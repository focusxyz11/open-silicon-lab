/* Labs: Make a bit remember, Catch it on the tick, and Count, then push the clock. The gate-level
   simulator is src/engines/seq.js (tested); this file runs it in slow motion and draws it.
   The site calls init(section) once, after this topic's content is on the page. */
import { $, T, RM, fit, watch, rgba, inView } from 'osl/core/ui.js';
import * as Q from 'osl/engines/seq.js';
import TC from 'osl/engines/tinychip.js';
import { stampChip } from 'osl/app/mychip.js';

const ps = v => v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' ns' : Math.round(v) + ' ps';
const hz = f => f >= 1e9 ? (f / 1e9).toFixed(2) + ' GHz' : Math.round(f / 1e6) + ' MHz';
const col = v => v === 1 ? T.amber : v === 0 ? T.cyan : T.muted;

/* A timing diagram: one row per signal, time running left to right. marks: times to draw dashed lines at. */
function drawWaves(cv, rows, t0, t1, opt = {}) {
  const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
  const L = w < 480 ? 66 : Math.min(96, w * 0.24), R = 6, top = 8, rh = (h - top - 8) / rows.length, X = t => L + (t - t0) / (t1 - t0) * (w - L - R);
  (opt.marks || []).forEach(t => { if (t < t0 || t > t1) return; c.strokeStyle = rgba(T.amber, 0.45); c.setLineDash([3, 3]); c.beginPath(); c.moveTo(X(t), top); c.lineTo(X(t), h - 6); c.stroke(); c.setLineDash([]); });
  if (opt.slots) opt.slots.forEach((on, k) => { const a = X(k * opt.slotPs), b = X((k + 1) * opt.slotPs); c.fillStyle = rgba(T.amber, on ? 0.16 : 0.04); c.fillRect(a + 1, top + opt.slotRow * rh + 2, b - a - 2, rh - 4); });
  rows.forEach((r, i) => {
    const y0 = top + i * rh, hi = y0 + rh * 0.22, lo = y0 + rh * 0.78;
    c.fillStyle = T.ink; c.font = '600 ' + (w < 480 ? 10 : 12) + 'px "IBM Plex Sans", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(r.name, 4, (hi + lo) / 2);
    c.strokeStyle = T.line; c.lineWidth = 1; c.beginPath(); c.moveTo(L, lo + rh * 0.12); c.lineTo(w - R, lo + rh * 0.12); c.stroke();
    let prev = null, px = X(t0);
    const pts = r.wave.filter(([t]) => t <= t1);
    const at = t => { let v = r.wave[0][1]; for (const [tt, vv] of r.wave) { if (tt > t) break; v = vv; } return v; };
    let v = at(t0);
    const seg = (xa, xb, val) => {
      if (xb <= xa) return;
      if (val === 'x') { c.fillStyle = rgba(T.muted, 0.25); c.fillRect(xa, hi, xb - xa, lo - hi); return; }
      const y = val === 1 ? hi : lo; c.strokeStyle = col(val); c.lineWidth = 2; c.beginPath(); c.moveTo(xa, y); c.lineTo(xb, y); c.stroke();
      if (val === 1) { c.fillStyle = rgba(T.amber, 0.12); c.fillRect(xa, hi, xb - xa, lo - hi); }
    };
    for (const [t, nv] of pts) { if (t <= t0) continue; const x = X(t); seg(px, x, v); if (v !== 'x' && nv !== 'x' && v !== nv) { c.strokeStyle = T.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, hi); c.lineTo(x, lo); c.stroke(); } px = x; v = nv; prev = t; }
    seg(px, X(t1), v);
  });
  return { X, L, R, top, rh };
}

export function init() {
  if (!$('#ckLatch')) return;
  latchLab(); flopLab(); counterLab();
}

/* ---------- Make a bit remember ---------- */
function latchLab() {
  const cv = $('#ckLatch'), wv = $('#ckLWave'), C = Q.srLatch(), RATE = 400; /* ps of chip time per second on screen */
  let hist, now, base = {}, last = performance.now(), visible = true, S = null;
  const reset = () => { hist = { S: [[0, 0]], R: [[0, 0]] }; now = 0; base = {}; };
  reset();
  const cur = n => hist[n][hist[n].length - 1][1];
  const set = (n, v) => { if (cur(n) !== v) hist[n].push([now, v]); };
  $('#ckS').addEventListener('click', () => { set('S', 1 - cur('S')); ui(); });
  $('#ckR').addEventListener('click', () => { set('R', 1 - cur('R')); ui(); });
  $('#ckBoth').addEventListener('click', () => { set('S', 0); set('R', 0); ui(); });
  $('#ckLReset').addEventListener('click', () => { reset(); ui(); });
  function ui() {
    ['S', 'R'].forEach(n => { const b = $('#ck' + n), on = cur(n) === 1; b.setAttribute('aria-pressed', on); b.textContent = n + (on ? ': on' : ': off'); });
  }
  function step() {
    S = Q.simulate(C, { stim: hist, init: base, tEnd: now });
    const q = S.at('Q', now), qn = S.at('Qn', now), sv = cur('S'), rv = cur('R');
    const recent = S.waves.Q.filter(([t]) => t > now - 1500).length;
    const osc = sv === 0 && rv === 0 && recent >= 4;
    $('#ckQ').textContent = q === 'x' ? 'unknown' : q; $('#ckQn').textContent = qn === 'x' ? 'unknown' : qn; $('#ckT').textContent = ps(now);
    $('#ckTag').textContent = osc ? 'Oscillating' : q === 'x' ? 'Unknown' : sv || rv ? 'Being written' : 'Holding ' + q;
    const usedS = hist.S.length > 1, usedR = hist.R.length > 1;
    $('#ckLHint').textContent = osc ? 'Both released at the same instant: each gate keeps flipping the other, forever in this model. A real latch settles after a while, at random. That is why designs never set and reset at once.'
      : sv && rv ? 'Both on: Q and not-Q are both 0, which a latch should never be. Now turn both off at once.'
      : sv ? 'S is on, so Q becomes 1. Now turn S off and see whether Q stays.'
      : rv ? 'R is on, so Q becomes 0. Turn R off: does it stay 0?'
      : q === 'x' ? 'At power-on Q is unknown: nothing has set it yet. Turn S on.'
      : usedS && usedR ? 'Both off, and Q holds whatever was written last. Two gates, one bit of memory: a processor\'s registers are built from loops like this.'
      : q === 1 ? 'S is off, but Q is still 1: the loop keeps it alive. That is one bit of memory. Now try R.' : 'Q is 0 and stays 0. Turn S on to store a 1.';
    if (now > 60000) { /* start a fresh history from the current values so the simulation stays small */ base = { Q: q, Qn: qn }; hist = { S: [[0, sv]], R: [[0, rv]] }; now = 0; }
  }
  function drawLatch() {
    if (!S) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const v = n => n === 'S' || n === 'R' ? cur(n) : S.at(n, now);
    const lw = Math.max(2, w / 220);
    const wire = (pts, n) => { const val = v(n); c.strokeStyle = col(val); c.lineWidth = lw; c.setLineDash(val === 'x' ? [4, 4] : []); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h)); c.stroke(); c.setLineDash([]); };
    const gate = (x, y) => { /* a NOR gate: an OR shape with a bubble */ const gw = 0.13 * w, gh = 0.22 * h, X0 = x * w - gw / 2, Y0 = y * h - gh / 2;
      c.fillStyle = T.surface; c.strokeStyle = T.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(X0, Y0); c.quadraticCurveTo(X0 + gw * 0.7, Y0, X0 + gw, Y0 + gh / 2); c.quadraticCurveTo(X0 + gw * 0.7, Y0 + gh, X0, Y0 + gh); c.quadraticCurveTo(X0 + gw * 0.3, Y0 + gh / 2, X0, Y0); c.fill(); c.stroke();
      c.beginPath(); c.arc(X0 + gw + 6, Y0 + gh / 2, 5, 0, 6.283); c.fill(); c.stroke();
      c.fillStyle = T.muted; c.font = '600 12px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NOR', x * w, y * h); };
    const yA = 0.3, yB = 0.7, gx = 0.45, inX = gx - 0.065 + 0.012, out = gx + 0.065 + 0.03;
    wire([[0.06, yA - 0.06], [inX, yA - 0.06]], 'R');
    wire([[0.06, yB + 0.06], [inX, yB + 0.06]], 'S');
    wire([[out, yA], [0.86, yA]], 'Q'); wire([[out + 0.05, yA], [out + 0.05, 0.47], [0.3, 0.55], [0.3, yB - 0.06], [inX, yB - 0.06]], 'Q');
    wire([[out, yB], [0.86, yB]], 'Qn'); wire([[out + 0.1, yB], [out + 0.1, 0.53], [0.24, 0.45], [0.24, yA + 0.06], [inX, yA + 0.06]], 'Qn');
    gate(gx, yA); gate(gx, yB);
    const lab = (s, x, y, n, align) => { const val = v(n); c.fillStyle = T.ink; c.font = '700 15px "IBM Plex Sans", sans-serif'; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s + ' = ' + (val === 'x' ? '?' : val), x * w, y * h); };
    lab('R', 0.05, yA - 0.13, 'R', 'left'); lab('S', 0.05, yB + 0.13, 'S', 'left'); lab('Q', 0.97, yA, 'Q', 'right'); lab('not-Q', 0.97, yB, 'Qn', 'right');
  }
  function drawWave() { if (!S) return; const t1 = Math.max(4000, now), t0 = t1 - 4000; drawWaves(wv, [{ name: 'S', wave: hist.S }, { name: 'R', wave: hist.R }, { name: 'Q', wave: S.waves.Q }, { name: 'not-Q', wave: S.waves.Qn }], t0, t1); }
  function loop(t) {
    if (!cv.isConnected) return;
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (visible) { now += dt * RATE; step(); drawLatch(); drawWave(); }
    requestAnimationFrame(loop);
  }
  inView(cv, x => { visible = x; });
  watch(cv, () => { step(); drawLatch(); }); watch(wv, drawWave);
  ui(); step(); requestAnimationFrame(loop);
}

/* ---------- Catch it on the tick ---------- */
function flopLab() {
  const cv = $('#ckFWave'), SLOT = 600, N = 16, PER = 4, C = Q.latchAndFlop(), init = Q.zeroState(C), TM = Q.timing();
  const edges = Array.from({ length: N / PER }, (_, k) => (k * PER + 2) * SLOT);
  const clk = [[0, 0]]; edges.forEach(e => { clk.push([e, 1]); clk.push([e + 2 * SLOT, 0]); });
  const GOALS = {
    one: { t: 'One slot is enough', why: 'Make the flip-flop store a 1 with D at 1 for only one slot.' },
    differ: { t: 'Different endings', why: 'Make the latch and the flip-flop end with different values.' },
    free: { t: 'Free play', why: 'Draw any pattern on D and compare the latch with the flip-flop.' }
  };
  let goal = 'one', D = new Array(N).fill(0), S = null, geo = null;
  $('#ckGoal').innerHTML = Object.entries(GOALS).map(([k, g]) => '<button type="button" data-g="' + k + '">' + g.t + '</button>').join('');
  $('#ckGoal').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { goal = b.dataset.g; update(); } });
  $('#ckClear').addEventListener('click', () => { D.fill(0); update(); });
  cv.addEventListener('click', e => {
    if (!geo) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left;
    const k = Math.floor((x - geo.L) / ((r.width - geo.L - geo.R) / N)); if (k < 0 || k >= N) return;
    D[k] = 1 - D[k]; update();
  });
  const changes = w => w.slice(1).filter(([t, v], i) => v !== 'x' && w[i][1] !== 'x' && v !== w[i][1]).length;
  function update() {
    $('#ckGoal').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.g === goal));
    $('#ckGoalWhy').textContent = GOALS[goal].why;
    const stim = { CLK: clk, D: [[0, D[0]]] }; for (let k = 1; k < N; k++) if (D[k] !== D[k - 1]) stim.D.push([k * SLOT, D[k]]);
    S = Q.simulate(C, { stim, init, tEnd: N * SLOT + 400 });
    const lc = changes(S.waves.aq), fc = changes(S.waves.flq), end = N * SLOT + 390;
    $('#ckLC').textContent = lc + (lc === 1 ? ' time' : ' times'); $('#ckFC').textContent = fc + (fc === 1 ? ' time' : ' times');
    const ones = D.filter(Boolean).length, flqEver = S.waves.flq.some(([, v]) => v === 1);
    const ok = goal === 'one' ? ones === 1 && flqEver : goal === 'differ' ? S.at('aq', end) !== S.at('flq', end) : null;
    $('#ckGoalOk').textContent = ok === null ? '–' : ok ? '✓ Done' : 'Not yet';
    $('#ckFTag').textContent = ok ? '✓ ' + GOALS[goal].t : GOALS[goal].t;
    let hint = '';
    if (goal === 'one') {
      const k = D.indexOf(1);
      if (ones === 0) hint = 'Switch D to 1 in one slot. The dashed lines are the ticks.';
      else if (ones > 1) hint = 'Use only one slot at 1.';
      else if (ok) hint = 'D was steady for ' + SLOT + ' ps before the tick, longer than the setup time of about ' + TM.setup + ' ps, so the first latch had settled when the clock rose.';
      else if (k % PER === 2) hint = 'D rose exactly at the tick: too late. The first latch closes as the clock rises, so D must be there a little before.';
      else hint = 'The flip-flop looks at D only as the clock rises. Put the 1 in the slot just before a tick.';
    } else if (goal === 'differ') hint = ok ? 'The latch let a late change through while the clock was 1; the flip-flop had already taken its value at the tick.' : 'Hint: the latch is open the whole time the clock is 1. What if D changes in the second half of the last cycle?';
    else hint = 'Count the changes: the latch passes every wiggle while the clock is 1; the flip-flop changes at most once per tick.';
    $('#ckFHint').textContent = hint;
    draw();
  }
  function draw() {
    if (!S) return;
    const dW = [[0, D[0]]]; for (let k = 1; k < N; k++) if (D[k] !== D[k - 1]) dW.push([k * SLOT, D[k]]);
    geo = drawWaves(cv, [{ name: 'Clock', wave: clk }, { name: 'D', wave: dW }, { name: 'Latch Q', wave: S.waves.aq }, { name: 'Flip-flop Q', wave: S.waves.flq }], 0, N * SLOT, { marks: edges, slots: D, slotPs: SLOT, slotRow: 1 });
  }
  watch(cv, draw);
  update();
}

/* ---------- Count, then push the clock ---------- */
function counterLab() {
  const NODES = ['180', '130', '28', '3'];
  let node = '130', R = null, TM = null, shown = 0, timer = null;
  $('#ckNode').innerHTML = NODES.map(n => '<button type="button" data-n="' + n + '">' + TC.NODE[n].t + '</button>').join('');
  $('#ckNode').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { node = b.dataset.n; update(); } });
  $('#ckHz').addEventListener('input', update);
  const freq = () => TM.fmaxHz * 0.3 * Math.pow(2 / 0.3, +$('#ckHz').value / 100);
  function update() {
    $('#ckNode').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.n === node));
    TM = Q.timing(4, node); const f = freq();
    R = Q.runCounter({ node, hz: f, cycles: 20 });
    $('#ckHzO').textContent = hz(f); $('#ckMax').textContent = hz(TM.fmaxHz); $('#ckPer').textContent = ps(R.per); $('#ckNeed').textContent = ps(TM.period); $('#ckErr').textContent = R.errors + ' of 20';
    const r = f / TM.fmaxHz, top = !R.errors && r >= 0.9 && r <= 1.0001;
    $('#ckCTag').textContent = R.errors ? 'Errors' : top ? '✓ Top speed' : 'Counting';
    $('#ckCHint').textContent = R.errors ? 'Too fast: the clock ticked before the carry finished rippling through the adders, so the register stored half-finished sums.'
      : top ? 'That is the top safe speed: the slowest path just fits in one tick. ' + (TC.NODE[node].t === '3 nm' ? 'Real 3 nm processors run far slower than this tiny counter, because their slowest paths are much longer and power limits them.' : 'Try another process: faster gates, faster clock.')
      : r > 1 ? 'Still counting right above the predicted limit: the prediction adds up the worst case of every gate, and real designs keep that margin. Push further.'
      : 'It counts right. Push the clock faster: where does it break?';
    if (top) stampChip('clock');
    shown = RM ? 20 : 0; clearInterval(timer); if (!RM) timer = setInterval(() => { shown++; drawSeq(); if (shown >= 20) clearInterval(timer); }, 160);
    drawSeq(); drawWave(); drawBudget();
  }
  function drawSeq() {
    const k = Math.max(0, Math.min(shown, 20) - 1), v = R.values[k];
    $('#ckLeds').innerHTML = [3, 2, 1, 0].map(i => '<span class="' + (v != null && (v >> i) & 1 ? 'on' : '') + '"><i></i>bit ' + i + '</span>').join('') + '<b>' + (v == null ? '?' : v) + '</b>';
    $('#ckSeq').innerHTML = R.values.map((x, i) => '<span class="' + (i >= shown ? 'hide' : R.wrong[i] ? 'bad' : 'ok') + '" title="expected ' + R.expected[i] + '">' + (x == null ? '?' : x) + '</span>').join('');
  }
  function drawWave() {
    const t1 = Math.min(R.per * 6.5, R.sim.tEnd);
    const rows = [{ name: 'Clock', wave: R.sim.waves.CLK }].concat([0, 1, 2, 3].map(i => ({ name: 'Bit ' + i, wave: R.sim.waves[Q.qOf(i)] })));
    drawWaves($('#ckCWave'), rows, 0, t1, { marks: R.edges });
  }
  function drawBudget() {
    const cv = $('#ckBudget'), { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const full = Math.max(R.per, TM.period) * 1.08, X = t => 8 + t / full * (w - 16);
    c.fillStyle = T.ink; c.font = '12px "IBM Plex Sans", sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillText('One tick: ' + ps(R.per), 8, 12);
    c.strokeStyle = T.ink; c.lineWidth = 2; c.strokeRect(X(0), 20, X(R.per) - X(0), 14);
    let t = 0; [['Flip-flop out', TM.clkToQ, T.amber], ['Adders', TM.logic, T.cyan], ['Setup', TM.setup, T.violet]].forEach(([n, d, cc]) => {
      c.fillStyle = rgba(cc, 0.8); c.fillRect(X(t), 42, X(t + d) - X(t), 14); if (X(t + d) - X(t) > 64) { c.fillStyle = T.bg; c.fillText(n, X(t) + 4, 49); } t += d; });
    if (TM.period > R.per) { c.fillStyle = rgba(T.bad, 0.5); c.fillRect(X(R.per), 40, X(TM.period) - X(R.per), 18); }
    c.fillStyle = T.muted; c.fillText('Slowest path: ' + ps(TM.period), 8, 68);
  }
  watch($('#ckCWave'), () => R && drawWave()); watch($('#ckBudget'), () => R && drawBudget());
  update();
}
