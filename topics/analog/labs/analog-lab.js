/* Labs: Catch the signal, and Power it cleanly. The models are in src/engines/analog.js (tested);
   this file draws them. The site calls init(section) once, after this topic's content is on the page. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import * as A from 'osl/engines/analog.js';

const MISSION_NAMES = { heart: 'Heartbeat patch', temp: 'Thermostat', voice: 'Earbuds', fault: 'Motor sensor' };
const JOB_NAMES = { wearable: 'Fitness band', cpu: 'Phone processor', adc: 'Precise sensor', nearly: 'Radio, tight supply' };

const watts = w => w >= 1 ? w.toFixed(2) + ' W' : w >= 1e-3 ? (w * 1e3).toPrecision(3) + ' mW' : w >= 1e-6 ? (w * 1e6).toPrecision(3) + ' µW' : (w * 1e9).toPrecision(3) + ' nW';
const hz = r => r >= 1000 ? (r / 1000) + ' k' : r >= 1 ? String(r) : r.toString();
const pct = x => (x * 100).toFixed(x < 0.1 ? 2 : 1) + '%';

export function init() {
  if (!$('#anCv')) return;
  signalLab();
  powerLab();
}

/* ---- Catch the signal ---- */
function signalLab() {
  const cv = $('#anCv'), pw = $('#anPow');
  let mi = 0, res = null;
  const mis = () => A.MISSIONS[mi];
  $('#anMis').innerHTML = A.MISSIONS.map((m, i) => '<button type="button" data-i="' + i + '">' + MISSION_NAMES[m.id] + '</button>').join('');
  $('#anMis').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; mi = +b.dataset.i; update(); });
  ['anGain', 'anBits', 'anRate'].forEach(id => $('#' + id).addEventListener('input', update));
  $('#anShow').addEventListener('click', () => {
    const b = A.best(mis()); if (!b) return;
    $('#anGain').value = A.GAINS.indexOf(b.gain); $('#anBits').value = A.BITS.indexOf(b.bits); $('#anRate').value = A.RATES.indexOf(b.rate); update();
    $('#anHint').textContent = 'The cheapest setting that passes. Notice which part of the power it saves on: usually the radio, because every bit you keep has to be sent.';
  });

  function update() {
    const m = mis(), S = A.SIGNALS[m.signal];
    const set = { gain: A.GAINS[+$('#anGain').value], bits: A.BITS[+$('#anBits').value], rate: A.RATES[+$('#anRate').value] };
    res = A.capture(m.signal, set); const j = A.judge(m, res);
    $('#anMis').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', i === mi));
    $('#anWhy').textContent = 'Goal: ' + m.why + '. Error below ' + pct(m.maxErr) + ', no clipping, no aliasing, and under ' + watts(m.maxPower) + '.';
    $('#anGainO').textContent = '×' + set.gain; $('#anBitsO').textContent = set.bits + ' bits (' + (2 ** set.bits) + ' levels)'; $('#anRateO').textContent = hz(set.rate) + ' per second';
    $('#anErr').textContent = pct(res.err) + (res.clip ? ' · clipped' : '');
    $('#anPower').textContent = watts(res.power.total);
    $('#anSent').textContent = res.sent >= 1000 ? (res.sent / 1000).toFixed(1) + ' kbit' : res.sent.toFixed(res.sent < 10 ? 1 : 0) + ' bit';
    $('#anVerdict').textContent = j.pass ? '✓ Done' : '✗ Not yet';
    $('#anTag').textContent = MISSION_NAMES[m.id] + (j.pass ? ' · done' : '');
    $('#anHint').textContent = !j.alias ? 'Aliasing: you sample slower than twice the fastest part of the signal (' + S.fmax + ' Hz), so fast detail turns into a slow wave that is not there.'
      : res.clip ? 'Clipping: the gain pushes the signal past the converter\'s range, so the peaks are cut off. Lower the gain.'
      : !j.quality ? (res.err > 0.05 && set.gain < 50 && m.signal !== 'vibration' ? 'The signal uses only a few of the converter\'s levels. More gain fills the range, so each bit counts.' : 'The copy is not close enough yet: more bits make each step finer, more samples follow fast changes.')
      : !j.power ? 'Good copy, but too hungry: ' + watts(res.power.total) + ' against ' + watts(m.maxPower) + '. Which part of the bar is biggest?'
      : 'Done. Can you go cheaper still?';
    draw(); drawPower();
  }

  function draw() {
    if (!res) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const S = A.SIGNALS[mis().signal], dur = res.samples[res.samples.length - 1].t || S.dur;
    const half = A.CONST.range / 2, L = 8, R = w - 8, Tp = 10, B = h - 10;
    const X = t => L + t / dur * (R - L);
    /* the converter's range, in units of the original signal */
    const span = half / res.gain; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i <= 300; i++) { const v = S.f(dur * i / 300); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const pad = (hi - lo) * 0.25 || 1e-6, ylo = Math.max(-span, lo - pad), yhi = Math.min(span, hi + pad);
    const Y = v => B - (v - ylo) / (yhi - ylo) * (B - Tp);
    /* clipping limits, if visible */
    c.strokeStyle = rgba(T.bad, 0.6); c.setLineDash([4, 4]); c.lineWidth = 1;
    [span, -span].forEach(v => { if (v <= yhi && v >= ylo) { c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(R, Y(v)); c.stroke(); } }); c.setLineDash([]);
    /* quantization levels, when few enough to see */
    const step = A.CONST.range / 2 ** res.bits / res.gain;
    if ((yhi - ylo) / step < 40) { c.strokeStyle = rgba(T.muted, 0.15); for (let v = Math.ceil(ylo / step) * step; v < yhi; v += step) { c.beginPath(); c.moveTo(L, Y(v)); c.lineTo(R, Y(v)); c.stroke(); } }
    /* the real signal */
    c.strokeStyle = rgba(T.muted, 0.9); c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i <= 800; i++) { const t = dur * i / 800, y = Y(S.f(t)); i ? c.lineTo(X(t), y) : c.moveTo(X(t), y); } c.stroke();
    /* the copy */
    c.strokeStyle = T.cyan; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 800; i++) { const t = dur * i / 800, y = Y(Math.max(ylo, Math.min(yhi, res.back(t)))); i ? c.lineTo(X(t), y) : c.moveTo(X(t), y); } c.stroke();
    /* the samples, if they are not too dense to see */
    if (res.samples.length < 300) { c.fillStyle = T['amber-fill']; res.samples.forEach(s => { c.beginPath(); c.arc(X(s.t), Y(Math.max(ylo, Math.min(yhi, s.v / res.gain))), 3, 0, 7); c.fill(); }); }
  }

  function drawPower() {
    if (!res) return;
    const { ctx: c, w, h } = fit(pw); c.clearRect(0, 0, w, h);
    const m = mis(), parts = [['Amplifier', res.power.amp, T.violet], ['Converter', res.power.adc, T.cyan], ['Radio', res.power.radio, T['amber-fill']]];
    const max = Math.max(res.power.total, m.maxPower) * 1.1, X = v => 4 + v / max * (w - 8);
    let x = 0; c.font = '11px IBM Plex Sans, sans-serif'; c.textBaseline = 'middle';
    parts.forEach(([name, v, col]) => { c.fillStyle = col; c.fillRect(X(x), 18, Math.max(1, X(x + v) - X(x)), 26); x += v; });
    c.strokeStyle = T.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X(m.maxPower), 10); c.lineTo(X(m.maxPower), 52); c.stroke();
    c.fillStyle = T.ink; c.textAlign = X(m.maxPower) > w - 70 ? 'right' : 'left'; c.fillText('budget', X(m.maxPower) + (c.textAlign === 'right' ? -4 : 4), 8);
    c.textAlign = 'left'; let lx = 4;
    parts.forEach(([name, v, col]) => { c.fillStyle = col; c.fillRect(lx, 64, 10, 10); c.fillStyle = T.muted; const s = name + ' ' + watts(v); c.fillText(s, lx + 14, 69); lx += c.measureText(s).width + 30; });
  }
  watch(cv, draw); watch(pw, drawPower);
  update();
}

/* ---- Power it cleanly ---- */
function powerLab() {
  const cv = $('#anPCv');
  let ji = 0, type = 'ldo', res = null;
  $('#anJob').innerHTML = A.JOBS.map((j, i) => '<button type="button" data-i="' + i + '">' + JOB_NAMES[j.id] + '</button>').join('');
  $('#anJob').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; ji = +b.dataset.i; update(); });
  $('#anReg').addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return; type = b.dataset.r; update(); });

  function update() {
    const job = A.JOBS[ji]; res = A.runJob(job, type); const best = A.bestReg(job);
    $('#anJob').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', i === ji));
    $('#anReg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.r === type));
    const loads = job.loads.map(([i, s]) => (i >= 1 ? i + ' A' : i >= 1e-3 ? (i * 1e3) + ' mA' : (i * 1e6) + ' µA') + (job.loads.length > 1 ? ' ' + Math.round(s * 100) + '% of the time' : '')).join(', ');
    $('#anJobWhy').textContent = job.why[0].toUpperCase() + job.why.slice(1) + ': ' + job.vin + ' V in, ' + job.vout + ' V out, ' + loads + '. Ripple it can live with: ' + (job.rippleMax * 1e3) + ' mV' + (job.maxHeat ? '; at most ' + job.maxHeat + ' W of heat.' : '.');
    $('#anEff').textContent = res.ok ? Math.round(res.eff * 100) + '%' : '–';
    $('#anHeat').textContent = res.ok ? watts(res.heat) : '–';
    $('#anRip').textContent = (res.ripple * 1e3).toPrecision(2) + ' mV';
    $('#anLife').textContent = res.hours && res.ok ? (res.hours > 48 ? Math.round(res.hours / 24) + ' days' : Math.round(res.hours) + ' hours') : '–';
    const isBest = best && best.type === type;
    $('#anRVerdict').textContent = !res.ok ? '✗ Cannot work' : !res.pass ? '✗ Not good enough' : isBest ? '✓ Best choice' : '✓ Works';
    $('#anRTag').textContent = JOB_NAMES[job.id] + (isBest ? ' · solved' : '');
    $('#anRHint').textContent = !res.ok ? 'The input must be higher than the output by at least the regulator\'s dropout.'
      : res.ripple > job.rippleMax ? 'Too much ripple: the switching leaves ' + (res.ripple * 1e3) + ' mV on the output, and this load can only tolerate ' + (job.rippleMax * 1e3) + ' mV.'
      : job.maxHeat && res.heat > job.maxHeat ? 'Too hot: ' + watts(res.heat) + ' of heat in one small part. The extra voltage has to go somewhere.'
      : isBest ? 'The best choice here. ' + (type === 'ldo' ? 'The input is barely above the output, so a linear regulator wastes almost nothing and needs no coil.' : type === 'buck' ? 'Switching wastes far less power than burning the voltage difference as heat.' : 'The buck does the big step efficiently; the small LDO after it removes the ripple.')
      : 'It works, but another choice is better here. Compare efficiency, heat, ripple and the number of parts.';
    draw();
  }

  function draw() {
    if (!res) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    /* Side by side on wide screens; on narrow ones the power bar sits above the ripple trace. */
    const narrow = w < 520, L = 10, top = 22;
    const barW = narrow ? w - 2 * L : w * 0.56 - L - 20;
    const box = narrow ? { x0: L, x1: w - L, y0: 110, y1: h - 8 } : { x0: w * 0.56 + 10, x1: w - 10, y0: 22, y1: h - 8 };
    c.font = '12px IBM Plex Sans, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
    /* where the power goes */
    c.fillStyle = T.muted; c.fillText('From the battery', L, 10);
    if (res.ok) {
      const useful = barW * res.eff;
      c.fillStyle = T.good; c.fillRect(L, top, useful, 34); c.fillStyle = rgba(T.bad, 0.85); c.fillRect(L + useful, top, barW - useful, 34);
      c.fillStyle = T.surface; c.fillText(Math.round(res.eff * 100) + '% to the chip', L + 8, top + 17);
      c.fillStyle = T.ink; c.fillText('Heat: ' + Math.round((1 - res.eff) * 100) + '%', L, top + 54);
    } else { c.fillStyle = T.bad; c.fillText('Not possible with this input voltage', L, top + 17); }
    /* the output voltage, magnified so ripple is visible; the dashed lines are what this load tolerates */
    const { x0, x1 } = box, yc = (box.y0 + 18 + box.y1) / 2, room = (box.y1 - box.y0 - 18) / 2 - 4;
    const scale = room / 20e-3, amp = Math.min(room, res.ripple * scale), lim = Math.min(room, A.JOBS[ji].rippleMax * scale);
    c.fillStyle = T.muted; c.fillText('Output voltage, magnified', x0, box.y0 - 10 + (narrow ? 0 : 0));
    c.strokeStyle = rgba(T.muted, 0.3); c.lineWidth = 1; c.beginPath(); c.moveTo(x0, yc); c.lineTo(x1, yc); c.stroke();
    c.strokeStyle = rgba(T.amber, 0.8); c.setLineDash([4, 4]); [yc - lim, yc + lim].forEach(y => { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }); c.setLineDash([]);
    c.strokeStyle = T.cyan; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 200; i++) { const x = x0 + (x1 - x0) * i / 200, ph = (i / 200 * 8) % 1; const y = yc + (res.ripple > 1e-3 ? (ph < 0.5 ? amp * (1 - 4 * ph) : amp * (-1 + 4 * (ph - 0.5))) : amp * Math.sin(i / 7)); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.fillStyle = T.amber; c.textAlign = 'right'; c.fillText('what this load tolerates', x1, box.y0 + 8);
  }
  watch(cv, draw);
  update();
}
