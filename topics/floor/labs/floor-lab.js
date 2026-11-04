/* Labs: How far from the floor?, Cold is not free, and How far can a signal go in one tick?
   The models are in src/engines/floor.js (tested); this file draws them.
   The site calls init(section) once, after this topic's content is on the page. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import * as F from 'osl/engines/floor.js';

/* Energies span 25 powers of ten, so they are written with SI prefixes. */
const PFX = [[1, 'J'], [1e-3, 'mJ'], [1e-6, 'µJ'], [1e-9, 'nJ'], [1e-12, 'pJ'], [1e-15, 'fJ'], [1e-18, 'aJ'], [1e-21, 'zJ'], [1e-24, 'yJ']];
const J = v => { for (const [k, u] of PFX) if (v >= k * 0.9999) { const x = v / k; return (x >= 100 ? Math.round(x) : x >= 10 ? x.toFixed(1) : x.toFixed(2)) + ' ' + u; } return v.toExponential(1) + ' J'; };
/* "about 14 million times" */
const sig = v => v >= 100 ? String(Math.round(v)) : String(+v.toPrecision(2));
const times = x => x >= 1e12 ? sig(x / 1e12) + ' trillion' : x >= 1e9 ? sig(x / 1e9) + ' billion' : x >= 1e6 ? sig(x / 1e6) + ' million' : x >= 1e3 ? Math.round(x).toLocaleString('en-US') : sig(x);
const sup = n => String(n).split('').map(ch => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+ch] || ch).join('');
/* axis labels at the ends stay inside the canvas */
const edge = (c, x, w) => { c.textAlign = x < 30 ? 'left' : x > w - 30 ? 'right' : 'center'; };
const len = m => m >= 1 ? m.toPrecision(3) + ' m' : m >= 0.01 ? (m * 100).toPrecision(3) + ' cm' : (m * 1000).toPrecision(3) + ' mm';

export function init() {
  if (!$('#pfCv')) return;
  ladderLab(); coldLab(); speedLab();
}

/* ---------- How far from the floor? ---------- */
function ladderLab() {
  const TASKS = {
    mac: { t: 'One multiply-add', why: 'The basic step of AI and signal processing: multiply two numbers and add the result to a running total.' },
    token: { t: 'One AI word', why: 'One word (token) written by a language model with 7 billion parameters: about 7 billion multiply-adds, and every weight read again for each word.' },
    photo: { t: 'One photo', why: 'Recognising one photo with a ResNet-50-sized network: about 4 billion multiply-adds, but its 25 million weights fit on chip and are reused across the whole image.' }
  };
  const SRC = { rf: 'Registers', sram: 'On-chip memory', dram: 'DRAM' };
  const S = { task: 'mac', bits: 16, weight: 'sram', input: 'rf', reuse: 1 };
  const seg = (id, items, key) => { $(id).innerHTML = Object.entries(items).map(([k, t]) => '<button type="button" data-k="' + k + '">' + t + '</button>').join(''); $(id).addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; S[key] = key === 'bits' ? +b.dataset.k : b.dataset.k; if (key === 'task') applyTask(); update(); }); };
  seg('#pfTask', Object.fromEntries(Object.entries(TASKS).map(([k, v]) => [k, v.t])), 'task');
  seg('#pfBits', { 4: '4-bit', 8: '8-bit', 16: '16-bit', 32: '32-bit' }, 'bits');
  seg('#pfW', SRC, 'weight');
  seg('#pfI', { rf: 'Registers', sram: 'On-chip memory' }, 'input');
  const reuseOf = v => Math.round(Math.pow(10, v / 10));                 /* slider 0..30 → 1..1000 */
  const sliderOf = r => Math.round(Math.log10(Math.max(1, r)) * 10);
  $('#pfReuse').addEventListener('input', () => { S.reuse = reuseOf(+$('#pfReuse').value); update(); });
  function applyTask() { const t = F.TASKS[S.task]; S.bits = t.bits; S.weight = t.weight; S.input = t.input; S.reuse = t.reuse; $('#pfReuse').value = sliderOf(t.reuse); }
  let R = null;
  function update() {
    ['#pfTask', '#pfBits', '#pfW', '#pfI'].forEach((id, k) => { const key = ['task', 'bits', 'weight', 'input'][k]; $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k) === String(S[key]))); });
    $('#pfTaskWhy').textContent = TASKS[S.task].why;
    $('#pfReuseO').textContent = S.reuse === 1 ? 'once' : S.reuse + ' times';
    R = F.ladder(S.task, { bits: S.bits, weight: S.weight, input: S.input, reuse: S.reuse });
    $('#pfE').textContent = J(R.total); $('#pfF').textContent = J(R.floor); $('#pfX').textContent = times(R.times) + '×'; $('#pfMove').textContent = Math.round(R.moveShare * 100) + '%';
    $('#pfTag').textContent = 'About 10' + sup(Math.round(Math.log10(R.times))) + '× the floor';
    const lift = R.total / (0.1 * 9.81);                                 /* meters you could lift a 100 g apple with the same energy */
    let h = R.moveShare > 0.8 ? 'Most of the energy goes into moving numbers, not into the math. ' + (S.weight === 'dram' ? 'Each DRAM read costs about 5,000 times a register read: keep the weights closer, or reuse each one more.' : S.reuse < 10 && S.weight !== 'rf' ? 'Reuse each weight more, so its trip from memory is shared.' : 'Fetch the other numbers from registers.')
      : 'Now the arithmetic itself is most of the bill. It is still about ' + times(R.mathTimes) + ' times the floor: transistors switch whole wires full of charge to move one bit of meaning.';
    if (S.task === 'token') h += ' One word this way takes ' + J(R.total) + ', enough to lift an apple ' + (lift >= 1 ? lift.toFixed(1) + ' m' : Math.round(lift * 100) + ' cm') + '.';
    $('#pfHint').textContent = h;
    draw(); drawSplit();
  }
  function draw() {
    if (!R) return;
    const cv = $('#pfCv'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const lo = Math.floor(Math.log10(R.floor)) - 1, hi = Math.ceil(Math.log10(R.total)) + 1, L = 16, Rm = 16;
    const X = v => L + (Math.log10(v) - lo) / (hi - lo) * (w - L - Rm);
    /* the powers-of-ten axis */
    c.strokeStyle = T.line; c.fillStyle = T.muted; c.font = '11px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
    const ay = h - 30; c.beginPath(); c.moveTo(L, ay); c.lineTo(w - Rm, ay); c.stroke();
    const step = Math.max(1, Math.ceil((hi - lo) / Math.max(4, Math.floor(w / 70))));
    for (let p = lo; p <= hi; p += step) { const x = X(Math.pow(10, p)); c.beginPath(); c.moveTo(x, ay - 4); c.lineTo(x, ay + 4); c.stroke(); edge(c, x, w); c.fillText(J(Math.pow(10, p)), x, ay + 7); }
    /* the gap from the floor to the total */
    const y = h * 0.42, xf = X(R.floor), xt = X(R.total);
    c.fillStyle = rgba(T.amber, 0.14); c.fillRect(xf, y - 26, xt - xf, 52);
    c.strokeStyle = T.amber; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(xf, y); c.lineTo(xt, y); c.stroke(); c.setLineDash([]);
    c.fillStyle = T.ink; c.font = '600 13px "IBM Plex Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText(times(R.times) + ' times', (xf + xt) / 2, y - 30);
    const mark = (x, col, label, below) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 7, 0, 6.283); c.fill(); c.fillStyle = T.ink; c.font = '600 12px "IBM Plex Sans", sans-serif'; c.textAlign = x < w * 0.2 ? 'left' : x > w * 0.8 ? 'right' : 'center'; c.textBaseline = below ? 'top' : 'bottom'; c.fillText(label, x, below ? y + 34 : y - 46); };
    mark(xf, T.good, 'Physics floor', true);
    mark(X(R.math), T.cyan, 'The math alone', true);
    mark(xt, T.bad, 'What the chip spends', false);
  }
  function drawSplit() {
    if (!R) return;
    const cv = $('#pfSplit'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const parts = [['Arithmetic', R.math, T.cyan], ['Fetching weights', R.moveW, T.amber], ['Fetching other numbers', R.moveI, T.violet]];
    let x = 0; parts.forEach(([n, v, col]) => { const ww = v / R.total * w; c.fillStyle = rgba(col, 0.85); c.fillRect(x, 6, ww, 22); x += ww; });
    c.font = '12px "IBM Plex Sans", sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left'; let lx = 0;
    parts.forEach(([n, v, col]) => { const s = n + ' ' + Math.round(v / R.total * 100) + '%'; c.fillStyle = col; c.fillRect(lx, 42, 10, 10); c.fillStyle = T.ink; c.fillText(s, lx + 14, 47); lx += c.measureText(s).width + 30; });
  }
  watch($('#pfCv'), draw); watch($('#pfSplit'), drawSplit);
  applyTask(); update();
}

/* ---------- Cold is not free ---------- */
function coldLab() {
  const temp = () => Math.round(Math.pow(10, +$('#pfT').value / 100 * Math.log10(300)));   /* 1 K .. 300 K, on a log scale */
  let R = null;
  const update = () => {
    const T0 = temp(), eff = +$('#pfEff').value / 100; R = F.cold(T0, eff); R.T = T0;
    $('#pfTO').textContent = T0 + ' K' + (T0 === 300 ? ' (room)' : T0 <= 4 ? ' (liquid helium)' : T0 >= 70 && T0 <= 80 ? ' (liquid nitrogen)' : '');
    $('#pfEffO').textContent = Math.round(eff * 100) + '%';
    $('#pfChip').textContent = J(R.chip); $('#pfPump').textContent = J(R.pump); $('#pfRatio').textContent = R.ratio.toPrecision(3) + '× the room floor';
    $('#pfCTag').textContent = R.ratio <= 1.0001 ? 'No saving' : 'Costs more';
    $('#pfCHint').textContent = T0 >= 300 ? 'At room temperature there is nothing to pump. Now cool the chip.'
      : eff >= 0.999 ? 'The chip erases each bit for ' + (300 / T0).toFixed(T0 > 100 ? 1 : 0) + ' times less, and the perfect refrigerator spends exactly that saving to push the heat out. The floor is set by where the heat finally goes: the room.'
      : 'With a real refrigerator, cooling makes the total ' + R.ratio.toPrecision(2) + ' times worse than not cooling at all.';
    draw();
  };
  function draw() {
    if (!R) return;
    const cv = $('#pfColdCv'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const max = Math.max(R.total, R.room) * 1.15, base = h - 34, top = 24, Y = v => base - v / max * (base - top), bw = Math.min(110, w * 0.22);
    const bars = [['Room temperature chip', 0.22, [[R.room, T.cyan]]], ['Your cold chip', 0.62, [[R.chip, T.cyan], [R.pump, T.violet]]]];
    c.font = '12px "IBM Plex Sans", sans-serif'; c.textAlign = 'center';
    bars.forEach(([n, fx, parts]) => { let acc = 0; const x = fx * w - bw / 2; parts.forEach(([v, col]) => { c.fillStyle = rgba(col, 0.85); c.fillRect(x, Y(acc + v), bw, Y(acc) - Y(acc + v)); acc += v; }); c.fillStyle = T.ink; c.textBaseline = 'top'; c.fillText(n, fx * w, base + 8); });
    c.strokeStyle = T.amber; c.setLineDash([5, 4]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(16, Y(R.room)); c.lineTo(w - 16, Y(R.room)); c.stroke(); c.setLineDash([]);
    c.fillStyle = T.amber; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText('room-temperature floor', w - 16, Y(R.room) - 4);
    c.textAlign = 'left'; c.textBaseline = 'middle'; [['chip erases the bit', T.cyan], ['refrigerator pumps the heat out', T.violet]].forEach(([n, col], k) => { c.fillStyle = col; c.fillRect(16, 10 + k * 16, 10, 10); c.fillStyle = T.ink; c.fillText(n, 30, 15 + k * 16); });
  }
  $('#pfT').addEventListener('input', update); $('#pfEff').addEventListener('input', update);
  watch($('#pfColdCv'), draw); update();
}

/* ---------- How far can a signal go in one tick? ---------- */
function speedLab() {
  const ghzOf = v => Math.pow(10, -1 + v / 50);                                  /* 0.1 .. 10 GHz */
  let G = 5;
  const update = () => {
    G = ghzOf(+$('#pfGhz').value); const r = F.reach(G);
    $('#pfGhzO').textContent = G >= 1 ? G.toFixed(G >= 10 ? 0 : 1) + ' GHz' : Math.round(G * 1000) + ' MHz';
    $('#pfTick').textContent = r.tick >= 1e-9 ? (r.tick * 1e9).toPrecision(3) + ' ns' : Math.round(r.tick * 1e12) + ' ps';
    $('#pfReach').textContent = len(r.glass);
    const die = F.ticksToCross(F.SPANS.reticle, G), rack = F.ticksToCross(F.SPANS.rack, G);
    $('#pfDie').textContent = die < 1 ? 'less than 1' : die.toFixed(1); $('#pfRack').textContent = rack.toFixed(rack < 10 ? 1 : 0);
    $('#pfSTag').textContent = die >= 1 ? 'Slower than one tick across a chip' : 'Light crosses a chip in a tick';
    draw();
  };
  function draw() {
    const cv = $('#pfSpeedCv'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const lo = -3, hi = Math.log10(3), L = 16, R = 16, X = m => L + (Math.log10(m) - lo) / (hi - lo) * (w - L - R), ay = h - 26, r = F.reach(G);
    c.strokeStyle = T.line; c.beginPath(); c.moveTo(L, ay); c.lineTo(w - R, ay); c.stroke();
    c.fillStyle = T.muted; c.font = '11px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'top';
    [0.001, 0.01, 0.1, 1].forEach(m => { const x = X(m); c.beginPath(); c.moveTo(x, ay - 4); c.lineTo(x, ay + 4); c.stroke(); edge(c, x, w); c.fillText(len(m), x, ay + 7); });
    const bar = (m, y, col, label) => { c.fillStyle = rgba(col, 0.8); c.fillRect(L, y, Math.max(2, X(m) - L), 14); c.fillStyle = T.ink; c.font = '12px "IBM Plex Sans", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; const tx = X(m) + 6; c.fillText(label, Math.min(tx, w - 170), y + 7); };
    bar(r.vacuum, 10, T.muted, 'light in vacuum: ' + len(r.vacuum));
    bar(r.glass, 32, T.amber, 'light in glass: ' + len(r.glass));
    const spans = [['phone chip', F.SPANS.phone], ['largest chip', F.SPANS.reticle], ['board', F.SPANS.board], ['rack', F.SPANS.rack]];
    spans.forEach(([n, m], k) => { const x = X(m), reached = m <= r.glass; c.strokeStyle = reached ? T.good : T.bad; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 54); c.lineTo(x, ay); c.stroke(); c.fillStyle = reached ? T.good : T.bad; c.font = '600 11px "IBM Plex Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(n, x, 56 + (k % 2) * 14); });
  }
  $('#pfGhz').addEventListener('input', update); watch($('#pfSpeedCv'), draw); update();
}
