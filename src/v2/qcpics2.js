/* The core question cards' pictures (src/v2/qcard.js), ported from docs/prototypes/cards/src/inst2.js: Compute beats
   cleverness, The next Moore's law, Fixed or fluid. The same shape as src/v2/qcpics1.js. */
import { t } from '../core/i18n.js';
import { trend, upTo } from '../data/hold.js';
import { share as fixedFluid, COLS, ROWS, GAIN } from '../engines/fixedfluid.js';
import { lerp, rng, disc, big, times, pct, whole, dec } from './qckit.js';

const w = (id, k, v) => t('qc.' + id + '.' + k, v);
export const PICS = {};

/* ---- Compute beats cleverness: a blind search against a person's design (Sutton 2019). A real, light search, as
   src/engines/search.js runs with the evolve engine: a circuit of NAND gates changed at random, four tries a round,
   kept when it scores no worse. It runs only as far as the computing you give it, so the picture changes under the
   hand alone ---- */
export const SRCH = (() => {
  const A = 0xF0, B = 0xCC, C = 0xAA, OUTS = [A ^ B ^ C, (A & B) | (B & C) | (A & C)], N = 16, FULL = 16;
  const pop = x => { let n = 0; while (x) { n += x & 1; x >>= 1; } return n; };
  /* a circuit: N NAND gates, each fed by two earlier things (0, 1, 2 are the inputs a, b, c), then which two are the outputs */
  function evalG(g) {
    const v = [A, B, C]; for (let i = 0; i < N; i++) v.push(~(v[g[2 * i]] & v[g[2 * i + 1]]) & 255);
    let right = 0; const used = new Set(), stack = [];
    for (let o = 0; o < 2; o++) { const k = g[2 * N + o]; right += 8 - pop(v[k] ^ OUTS[o]); stack.push(k); }
    while (stack.length) { const k = stack.pop(); if (k < 3 || used.has(k)) continue; used.add(k); stack.push(g[2 * (k - 3)], g[2 * (k - 3) + 1]); }
    return { right, gates: used.size, used, v };
  }
  function make(seed) {
    const r = rng(seed), g = []; for (let i = 0; i < N; i++) g.push(Math.floor(r() * (3 + i)), Math.floor(r() * (3 + i))); for (let o = 0; o < 2; o++) g.push(Math.floor(r() * (3 + N)));
    const f = evalG(g); return { r, best: g, fb: f, tried: 1, marks: [{ tried: 1, right: f.right, gates: f.gates, g }], first: null };
  }
  /* four changed copies a round; keep the best of them when it scores no worse (once right: no more gates) */
  function step(s, until) {
    const r = s.r;
    while (s.tried < until) {
      let ch = null, fc = null;
      for (let k = 0; k < 4; k++) { const h = s.best.slice(), m = 1 + Math.floor(r() * 3);
        for (let j = 0; j < m; j++) { const i = Math.floor(r() * h.length); h[i] = i < 2 * N ? Math.floor(r() * (3 + (i >> 1))) : Math.floor(r() * (3 + N)); }
        const f = evalG(h); s.tried++; if (!fc || f.right > fc.right || (f.right === fc.right && f.gates <= fc.gates)) { ch = h; fc = f; } }
      const fb = s.fb;
      if (fc.right > fb.right || (fc.right === fb.right && (fb.right < FULL || fc.gates <= fb.gates))) {
        if (fc.right > fb.right || (fc.right === FULL && fc.gates < fb.gates)) { s.marks.push({ tried: s.tried, right: fc.right, gates: fc.gates, g: ch }); if (fc.right === FULL && !s.first) s.first = s.tried; }
        s.best = ch; s.fb = fc; }
    }
  }
  /* the plain way: two half adders and an OR, written out in NAND gates (13) */
  const PLAIN = [0, 1, 0, 3, 1, 3, 4, 5, 3, 3, 6, 2, 6, 8, 2, 8, 9, 10, 8, 8, 7, 7, 12, 12, 13, 14, 0, 0, 0, 0, 0, 0, 11, 15];
  return { evalG, make, step, PLAIN, OUTS, N, FULL, MAX: 1e6 };
})();
function drawCircuit(g, G, x, y, wd, h, names) {
  const { c, P } = g, E = SRCH.evalG(G), N = SRCH.N, lv = [0, 0, 0], ids = [...E.used].sort((a, b) => a - b), pos = {};
  for (let k = 3; k < 3 + N; k++) lv[k] = E.used.has(k) ? 1 + Math.max(lv[G[2 * (k - 3)]], lv[G[2 * (k - 3) + 1]]) : 0;
  const maxL = Math.max(1, ...ids.map(k => lv[k]));
  [0, 1, 2].forEach(i => { pos[i] = [x + 6, y + h * (i + 0.5) / 3]; });
  for (let L = 1; L <= maxL; L++) {
    const at = ids.filter(k => lv[k] === L).map(k => ({ k, m: (pos[G[2 * (k - 3)]][1] + pos[G[2 * (k - 3) + 1]][1]) / 2 })).sort((a, b) => a.m - b.m);
    at.forEach((n, i) => { pos[n.k] = [x + 22 + (L - 0.4) / maxL * (wd - 52), y + h * (i + 0.5) / at.length]; });
  }
  c.lineWidth = 1; c.strokeStyle = P.muted; c.globalAlpha = 0.75;
  for (const k of ids) [0, 1].forEach(j => { const s = pos[G[2 * (k - 3) + j]], d = pos[k], x1 = s[0] + (G[2 * (k - 3) + j] < 3 ? 4 : 11), x2 = d[0] - 8, y2 = d[1] + (j ? 3.5 : -3.5), mx = (x1 + x2) / 2;
    c.beginPath(); c.moveTo(x1, s[1]); c.bezierCurveTo(mx, s[1], mx, y2, x2, y2); c.stroke(); });
  [0, 1].forEach(o => { const k = G[2 * N + o], s = pos[k], yo = y + h * (o ? 0.72 : 0.28), x1 = s[0] + (k < 3 ? 4 : 11), x2 = x + wd - 4, mx = (x1 + x2) / 2;
    c.beginPath(); c.moveTo(x1, s[1]); c.bezierCurveTo(mx, s[1], mx, yo, x2, yo); c.stroke(); });
  c.globalAlpha = 1;
  [0, 1, 2].forEach(i => { c.fillStyle = P.ink; disc(c, pos[i][0], pos[i][1], 3); c.fill(); });
  c.strokeStyle = P.ink; c.fillStyle = P.solid; c.lineWidth = 1.3;
  for (const k of ids) { const [X, Y] = pos[k]; c.beginPath(); c.moveTo(X - 7, Y - 6.5); c.lineTo(X, Y - 6.5); c.arc(X, Y, 6.5, -Math.PI / 2, Math.PI / 2); c.lineTo(X - 7, Y + 6.5); c.closePath(); c.fill(); c.stroke(); disc(c, X + 8.7, Y, 2); c.fill(); c.stroke(); }
  if (names) ['a', 'b', 'c'].forEach((n, i) => g.lab(x - 8, pos[i][1] - 7, n, '', 'r'));
  return E;
}
PICS.sutton = {
  u0: 0.62,
  setup(S) { S.main = SRCH.make(8 * 7919); S.others = [1, 2, 3, 4, 5, 6, 7, 9, 10].map(s => SRCH.make(s * 7919)); },
  frame(g, S) {
    const { c, P, box: B } = g, want = Math.round(Math.pow(10, 6 * g.u));
    /* the search catches up with the computing given to it, a slice each frame; then it stops */
    let left = 120000;
    for (const s of [S.main, ...S.others]) if (s.tried < want && left > 0) { const to = Math.min(want, s.tried + left); left -= to - s.tried; SRCH.step(s, to); }
    const catching = [S.main, ...S.others].some(s => s.tried < want); if (catching) g.again();
    const budget = Math.min(want, S.main.tried); let m = S.main.marks[0]; for (const k of S.main.marks) if (k.tried <= budget) m = k;
    const wide = B.w > 560, axY = B.y + B.h - 22, top = B.y + 14, h = axY - top - 26, lampW = 46;
    const xs = wide ? B.x + B.w * 0.36 : B.x + 16, ws = B.x + B.w - lampW - xs - 8;
    if (wide) { drawCircuit(g, SRCH.PLAIN, B.x + 16, top, B.w * 0.3, h, true); g.lab(B.x + 16 + B.w * 0.15, B.y - 18, w('sutton', 'l.plain'), '', 'c');
      c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath(); c.moveTo(B.x + B.w * 0.335, top); c.lineTo(B.x + B.w * 0.335, top + h); c.stroke(); }
    const E = drawCircuit(g, m.g, xs + 14, top, ws - 14, h, !wide);
    g.lab(xs + ws / 2, B.y - 18, w('sutton', 'l.best'), 'ink', 'c');
    /* its sixteen answers: the sum and the carry for each of the eight inputs */
    const lx = B.x + B.w - lampW, q = Math.min(11, (h - 8) / 8 - 3);
    [0, 1].forEach(o => { const out = E.v[m.g[2 * SRCH.N + o]];
      for (let r = 0; r < 8; r++) { const ok = ((out >> (7 - r)) & 1) === ((SRCH.OUTS[o] >> (7 - r)) & 1), X = lx + 8 + o * (q + 8), Y = top + 4 + r * (q + 3);
        if (ok) { c.fillStyle = P.ink; c.fillRect(X, Y, q, q); } else { c.strokeStyle = P.red; c.lineWidth = 1.6; c.strokeRect(X + 1, Y + 1, q - 2, q - 2); } } });
    g.lab(lx + 8 + q, B.y - 18, w('sutton', 'l.answers'), '', 'c');
    /* the computing spent, on powers of ten */
    const X = n => B.x + 10 + (B.w - 20) * Math.log10(Math.max(1, n)) / 6;
    c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath(); c.moveTo(X(1), axY); c.lineTo(X(1e6), axY); c.stroke();
    c.strokeStyle = P.blue; c.lineWidth = 3; c.beginPath(); c.moveTo(X(1), axY); c.lineTo(X(budget), axY); c.stroke();
    for (let e = 0; e <= 6; e++) { c.strokeStyle = P.muted; c.lineWidth = 1; c.beginPath(); c.moveTo(X(10 ** e), axY - 4); c.lineTo(X(10 ** e), axY + 4); c.stroke(); }
    g.lab(X(1), axY + 6, w('sutton', 'l.one')); g.lab(X(1e3), axY + 6, t('qc.l.thousand'), '', 'c'); g.lab(X(1e6), axY + 6, t('qc.l.million'), '', 'r');
    for (const k of S.main.marks) { c.fillStyle = k.right === SRCH.FULL ? P.ink : P.muted; c.globalAlpha = k.tried <= budget ? 1 : 0.35; c.fillRect(X(k.tried) - 1, axY - 13, 2, 8); }
    c.globalAlpha = 1; c.strokeStyle = P.muted; c.lineWidth = 1;
    const lucky = S.others.filter(o => o.first && o.first <= budget);
    for (const o of lucky) { const x = X(o.first), y = axY; c.beginPath(); c.moveTo(x, y - 3.5); c.lineTo(x + 3.5, y); c.lineTo(x, y + 3.5); c.lineTo(x - 3.5, y); c.closePath(); c.stroke(); }
    c.fillStyle = P.blue; disc(c, X(budget), axY, 4.5); c.fill();
    return { reads: [
      { v: big(budget), k: catching ? w('sutton', 'r.running') : w('sutton', 'r.tried') },
      { v: t('qc.n.of', { a: whole(m.right), b: whole(16) }), k: w('sutton', 'r.right'), tone: m.right === 16 ? 'good' : 'bad' },
      { v: m.right === 16 ? w('sutton', 'v.gates', { n: m.gates }) : w('sutton', 'v.notyet'), k: w('sutton', 'r.gates') }],
      cap: wide ? (lucky.length ? w('sutton', 'cap') + ' ' + w('sutton', 'lucky', { n: lucky.length }) : null) : w('sutton', 'capNarrow') };
  }
};

/* ---- The next Moore's law: fifty years of chips, and the years nobody has made yet (the first page's own series,
   trend() of src/data/hold.js: Karl Rupp's data, fact transistor-trend) ---- */
const END = 2021.9, LAST = 5.8e10;
PICS.moore = {
  u0: (2011 - 1971) / 69, v0: 0.5,
  frame(g) {
    const { c, P, box: B } = g, x0 = B.x + 4, x1 = B.x + B.w - 4, X = y => x0 + (x1 - x0) * (y - 1970) / 71, Y = v => B.y + B.h - 14 - (B.h - 22) * (Math.log10(v) - 2) / 13;
    const year = lerp(1971, 2040, g.u), fut = year > END, TR = trend('tr'), HZ = trend('hz');
    c.fillStyle = P.ink; c.globalAlpha = 0.045; c.fillRect(X(END), B.y, x1 - X(END), B.h); c.globalAlpha = 1;
    c.strokeStyle = P.line; c.lineWidth = 1;
    [[3, 'thousand'], [6, 'million'], [9, 'billion'], [12, 'trillion']].forEach(([e, k]) => { c.beginPath(); c.moveTo(x0, Y(10 ** e) + 0.5); c.lineTo(x1, Y(10 ** e) + 0.5); c.stroke(); g.lab(x1 - 4, Y(10 ** e) - 14, t('qc.l.' + k), '', 'r'); });
    [1980, 2000, 2020, 2040].forEach(y => { c.beginPath(); c.moveTo(X(y) + 0.5, B.y + B.h - 14); c.lineTo(X(y) + 0.5, B.y + B.h - 8); c.stroke(); g.lab(X(y), B.y + B.h - 8, String(y), '', y === 2040 ? 'r' : 'c'); });
    c.strokeStyle = P.muted; c.lineWidth = 1; for (const [y, v] of HZ) { disc(c, X(y), Y(v), 2.3); c.stroke(); }
    c.fillStyle = P.ink; for (const [y, v] of TR) { disc(c, X(y), Y(v), 2.4); c.fill(); }
    g.lab(X(1972), Y(2e9), w('moore', 'l.tr'), 'ink'); g.lab(X(2001), Y(2.5e6), w('moore', 'l.hz'));
    /* your line, past the data */
    const D = g.v < 0.03 ? Infinity : 1 / g.v, at = y => LAST * Math.pow(2, (y - END) / D);
    c.save(); c.beginPath(); c.rect(x0, B.y, x1 - x0, B.h); c.clip();
    c.strokeStyle = P.warm; c.lineWidth = 1.8; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(X(END), Y(LAST)); c.lineTo(X(2041), Y(at(2041))); c.stroke(); c.setLineDash([]); c.restore();
    g.lab(X(2031), B.y + 2, w('moore', 'l.future'), '', 'c');
    const best = fut ? at(year) : upTo('tr', year), xc = X(year);
    c.strokeStyle = P.blue; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xc + 0.5, B.y); c.lineTo(xc + 0.5, B.y + B.h - 14); c.stroke();
    if (best > 0 && Y(best) > B.y) { c.fillStyle = fut ? P.warm : P.blue; disc(c, xc, Y(best), 5); c.fill(); c.strokeStyle = P.solid; c.lineWidth = 1.5; c.stroke(); }
    const yr = Math.floor(year), every = d => (isFinite(d) ? w('moore', 'v.every', { n: d < 10 ? dec(d, 1) : whole(d) }) : w('moore', 'v.never'));
    if (fut) return { reads: [
      { v: big(best), k: w('moore', 'r.fut', { y: String(yr) }) },
      { v: every(D), k: w('moore', 'r.often') },
      { v: w('moore', 'v.nothing'), k: w('moore', 'r.real') }] };
    const span = Math.min(10, year - 1971.9), prev = upTo('tr', year - span), r = prev ? best / prev : 1, hz = upTo('hz', year), hzp = upTo('hz', year - span), rh = hzp ? hz / hzp : 1;
    const dbl = x => (span >= 3 && x > 1.2 ? every(span / Math.log2(x)) : span < 3 ? w('moore', 'v.early') : w('moore', 'v.stopped'));
    return { reads: [
      { v: big(best), k: w('moore', 'r.biggest', { y: String(yr) }) },
      { v: dbl(r), k: w('moore', 'r.dbl') },
      { v: dbl(rh), k: w('moore', 'r.clock'), tone: span >= 3 && rh <= 1.2 ? 'bad' : '' }] };
  }
};

/* ---- Fixed or fluid: a line you drag across a machine, and how far the work has moved on (src/engines/fixedfluid.js) ---- */
PICS.line = {
  u0: 7 / 12, v0: 0.3, hstep: 12,
  frame(g) {
    const { c, P, box: B } = g, N = COLS * ROWS, M = fixedFluid({ cols: g.u * COLS, known: lerp(1, 0.2, g.v) });
    const { F, L, fDone, lDone, lKnown, away, idle, energy } = M, known = Math.round(lerp(1, 0.2, g.v) * N);
    const qw = Math.min(B.w * 0.2, 150), cx = B.x + qw + 14, cw = B.w - qw - 18, cy = B.y + 22, ch = B.h - 26, pw = cw / COLS, ph = ch / ROWS, q = Math.min(pw, ph) * 0.2, lx = cx + cw * F / N;
    c.fillStyle = P.ink; c.globalAlpha = 0.07; c.fillRect(cx, cy, lx - cx, ch); c.globalAlpha = 1;
    c.strokeStyle = P.line; c.lineWidth = 1; c.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
    const job = (x, y, sq, st) => { c.lineWidth = 1.6; c.strokeStyle = st === 'away' ? P.red : P.ink; c.globalAlpha = st === 'idle' ? 0.28 : 1;
      if (sq) c.strokeRect(x - q, y - q, 2 * q, 2 * q); else { disc(c, x, y, q * 1.12); c.stroke(); } c.globalAlpha = 1; };
    for (let n = 0; n < N; n++) { const col = (n / ROWS) | 0, row = n % ROWS, x = cx + (col + 0.5) * pw, y = cy + (row + 0.5) * ph, fixed = n < F;
      const done = fixed ? n < fDone : n - F < lDone;
      if (done) { c.fillStyle = P.warm; c.globalAlpha = fixed ? 0.9 : 0.32; disc(c, x, y, fixed ? Math.min(pw, ph) * 0.46 / Math.sqrt(GAIN) : Math.min(pw, ph) * 0.46); c.fill(); c.globalAlpha = 1; }
      if (fixed) job(x, y, true, done ? 'done' : 'idle'); else if (done) job(x, y, n - F < lKnown, 'done'); else { c.setLineDash([3, 3]); c.strokeStyle = P.line; c.strokeRect(x - q, y - q, 2 * q, 2 * q); c.setLineDash([]); } }
    /* the jobs it had no place for */
    const ac = Math.max(1, Math.floor(qw / (2.9 * q)));
    for (let n = 0; n < away; n++) job(B.x + q * 1.6 + (n % ac) * 2.9 * q, cy + q * 1.6 + ((n / ac) | 0) * 2.9 * q, n < Math.max(0, known - fDone - lKnown), 'away');
    c.strokeStyle = P.blue; c.lineWidth = 2.5; c.beginPath(); c.moveTo(lx, cy - 6); c.lineTo(lx, cy + ch + 6); c.stroke(); c.fillStyle = P.blue; c.fillRect(lx - 5, cy + ch / 2 - 16, 10, 32);
    if (lx - cx > 60) g.lab((cx + lx) / 2, B.y, w('line', 'l.fixed', { n: F }), 'ink', 'c'); if (cx + cw - lx > 60) g.lab((lx + cx + cw) / 2, B.y, w('line', 'l.fluid', { n: L }), 'ink', 'c');
    g.lab(B.x, B.y, away ? w('line', 'l.away', { n: away }) : w('line', 'l.none'), away ? 'bad' : '');
    return { reads: [
      { v: times(energy), k: w('line', 'r.energy'), tone: energy < 0.5 ? 'good' : '' },
      { v: pct(away / N), k: w('line', 'r.away'), tone: away ? 'bad' : '' },
      { v: pct(F ? idle / F : 0), k: w('line', 'r.idle'), tone: idle > F * 0.25 ? 'bad' : '' }] };
  }
};
