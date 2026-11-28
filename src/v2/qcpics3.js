/* The core question cards' pictures (src/v2/qcard.js), ported from docs/prototypes/cards/src/inst3.js: Fight or use
   physics, Beyond computation, Geometry, Brain or copy, Only humans. The same shape as src/v2/qcpics1.js. */
import { t } from '../core/i18n.js';
import { run as runRule, start as ruleStart, bit } from '../engines/automaton.js';
import { evaluate as mortal } from '../engines/mortal.js';
import { clamp, lerp, rng, gauss, erfc, disc, times, pct, whole, dec, TAU } from './qckit.js';

const w = (id, k, v) => t('qc.' + id + '.' + k, v);
export const PICS = {};

/* ---- Fight or use physics: the same sum kept exact, or left to physical law (a stand-in for physics() of lens.js;
   the energy per sum, 1 against 0.13, is the round figure of src/engines/mortal.js) ---- */
PICS.physics = {
  u0: 0.34,
  setup(S) { const r = rng(5); S.sm = Array.from({ length: 90 }, () => ({ tv: Math.round(r() * 255), u: Array.from({ length: 8 }, () => r()), z: gauss(r) })); },
  frame(g, S) {
    const { c, P, box: B } = g, sig = lerp(0.02, 0.5, g.u), pf = 0.5 * erfc(0.5 / (sig * Math.SQRT2));
    /* exact logic: a bit flips when the noise crosses half its swing. Physics: the whole answer drifts with the noise */
    const sm = S.sm.map(s => { let dv = s.tv, flips = 0; s.u.forEach((u, k) => { if (u < pf) { dv ^= 1 << k; flips |= 1 << k; } }); return { tv: s.tv, dv, flips, d: (dv - s.tv) / 255, a: sig * s.z }; });
    const gw = Math.min(150, B.w * 0.26), sx = B.x + gw + 14, sw = B.w - gw - 18, rowH = B.h / 2, cur = sm[sm.length - 1], stepX = sw / 89;
    [0, 1].forEach(row => {
      const y0 = B.y + row * rowH, mid = y0 + rowH / 2 + 8, amp = rowH / 2 - 26;
      c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, mid + 0.5); c.lineTo(sx + sw, mid + 0.5); c.stroke();
      sm.forEach((s, i) => { const e = row ? s.a : s.d, cl = clamp(e, -0.5, 0.5), bad = !row && s.flips;
        c.globalAlpha = 0.85; c.fillStyle = bad ? P.red : P.ink; disc(c, sx + i * stepX, mid - cl / 0.5 * amp, bad ? 3.6 : 2.6); c.fill(); });
      c.globalAlpha = 1;
    });
    const q = Math.min(13, (gw - 8) / 8 - 3), by = B.y + rowH / 2 + 8 - q / 2;
    for (let k = 7; k >= 0; k--) { const x = B.x + 2 + (7 - k) * (q + 3), on = (cur.dv >> k) & 1, fl = (cur.flips >> k) & 1;
      c.strokeStyle = fl ? P.red : P.ink; c.fillStyle = fl ? P.red : P.ink; c.lineWidth = 1.3; if (on) c.fillRect(x, by, q, q); else c.strokeRect(x + 0.5, by + 0.5, q - 1, q - 1); }
    const my = B.y + rowH * 1.5 + 8, jx = B.x + gw * 0.62, val = clamp(cur.tv / 255 + cur.a, 0.04, 1.2);
    c.strokeStyle = P.ink; c.globalAlpha = 0.55; c.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) { const yy = my + (i - 3.5) * Math.min(9, (rowH - 30) / 8); c.beginPath(); c.moveTo(B.x + 2, yy); c.bezierCurveTo(B.x + gw * 0.35, yy, B.x + gw * 0.4, my, jx, my); c.stroke(); }
    c.globalAlpha = 1; c.lineWidth = 2 + val * 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(jx, my); c.lineTo(B.x + gw - 4, my); c.stroke(); c.lineCap = 'butt';
    g.lab(B.x, B.y - 18, w('physics', 'l.exact'), 'ink'); g.lab(B.x, B.y + rowH - 18, w('physics', 'l.phys'), 'ink');
    if (B.w > 520) g.lab(sx + sw, B.y - 18, w('physics', 'l.ninety'), '', 'r');
    const eD = pf, eA = sig * Math.sqrt(2 / Math.PI);
    return { reads: [
      { v: eD < 1e-7 ? w('physics', 'v.right') : w('physics', 'v.off', { n: eD < 0.001 ? pct(eD, 3) : pct(eD, 1) }), k: w('physics', 'r.exact'), tone: eD < 1e-7 ? 'good' : '' },
      { v: w('physics', 'v.off', { n: pct(eA, 1) }), k: w('physics', 'r.phys') }] };
  }
};

/* ---- Beyond computation: one row, one rule of eight bits (src/engines/automaton.js) ---- */
PICS.nat = {
  u0: 110 / 255, hstep: 255,
  frame(g, S) {
    const { c, P, box: B } = g, rule = Math.round(g.u * 255), cs = B.w < 480 ? 4 : 5, cols = Math.floor(B.w / cs), topH = 34, vis = Math.max(1, Math.floor((B.h - topH) / cs));
    /* the picture is the first rows; the rule runs on, unseen, to learn whether it ever repeats */
    const key = rule + '/' + cols + '/' + vis;
    if (S.key !== key) { S.key = key; S.out = runRule(rule, ruleStart(cols, 3), { keep: vis, limit: 3000 }); }
    const { rows, gen, verdict: v } = S.out;
    c.fillStyle = P.ink; c.globalAlpha = 0.88;
    rows.forEach((a, j) => { const y = B.y + topH + j * cs; let s = -1;
      for (let i = 0; i <= cols; i++) { if (i < cols && a[i]) { if (s < 0) s = i; } else if (s >= 0) { c.fillRect(B.x + s * cs, y, (i - s) * cs - 0.6, cs - 0.6); s = -1; } } });
    c.globalAlpha = 1;
    /* the eight tiles: each neighbourhood, and what the rule makes of it */
    const q = 6.5, tw = 3 * q + 9;
    for (let m = 7; m >= 0; m--) { const x = B.x + 2 + (7 - m) * tw, on = bit(rule, m);
      for (let k = 0; k < 3; k++) { const b = (m >> (2 - k)) & 1; c.strokeStyle = P.muted; c.lineWidth = 1; c.fillStyle = P.muted; if (b) c.fillRect(x + k * q, B.y, q - 1, q - 1); else c.strokeRect(x + k * q + 0.5, B.y + 0.5, q - 2, q - 2); }
      c.strokeStyle = P.warm; c.fillStyle = P.warm; c.lineWidth = 1.4; if (on) c.fillRect(x + q - 0.5, B.y + q + 3, q, q); else c.strokeRect(x + q, B.y + q + 3.5, q - 1, q - 1); }
    const say = v ? (v.period === 1 ? (v.all ? w('nat', 'v.one', { n: whole(v.from) }) : w('nat', 'v.still', { n: whole(v.from) })) : w('nat', 'v.repeats', { n: whole(v.period) })) : w('nat', 'v.norepeat', { n: whole(gen) });
    return { reads: [
      { v: w('nat', 'v.rule', { n: rule }), k: w('nat', 'r.rule') },
      { v: say, k: v ? w('nat', 'r.does') : w('nat', 'r.doesRun'), tone: v ? '' : 'bad' }] };
  }
};

/* ---- Geometry: close to talk, apart to stay cool (a toy sheet; in the lab, geometry() and geoEffFront() of lens.js) ---- */
PICS.geo = {
  u0: 0.4, v0: 0.4,
  setup(S) { const r = rng(12); S.lf = Array.from({ length: 600 }, () => r()); },
  frame(g, S) {
    const { c, P, box: B } = g, N = Math.round(lerp(150, 600, g.v)), s = lerp(0.7, 1.4, g.u), N0 = 330, s0 = 0.98;
    const Rm = Math.min(B.w, B.h) / 2 - 4, R = Rm * (s / 1.4) * Math.sqrt(N / 600), cx = B.x + B.w / 2, cy = B.y + B.h / 2;
    const trip = s * Math.sqrt(N) / (s0 * Math.sqrt(N0)), heat = Math.sqrt(N) / s / (Math.sqrt(N0) / s0);
    const pt = k => { const rr = R * Math.sqrt((k + 0.5) / N), th = k * 2.399963; return [cx + rr * Math.cos(th), cy + rr * Math.sin(th), rr]; };
    const hot = clamp((heat - 0.55) / 1.9); if (hot > 0) { const G = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25); G.addColorStop(0, P.red); G.addColorStop(1, 'transparent'); c.globalAlpha = hot * 0.75; c.fillStyle = G; disc(c, cx, cy, R * 1.25); c.fill(); c.globalAlpha = 1; }
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.1; c.beginPath();
    for (let k = 0; k < N; k += 2) { const a = pt(k), b = pt(Math.floor(S.lf[k] * N)); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    const rd = clamp(R / Math.sqrt(N) * 0.5, 1.1, 4.2);
    for (let k = 0; k < N; k++) { const p = pt(k), T = heat * (1 - 0.55 * (p[2] / R) ** 2); c.globalAlpha = 0.8; c.fillStyle = P.ink; disc(c, p[0], p[1], rd); c.fill(); const o = clamp((T - 0.9) / 1.3); if (o > 0) { c.globalAlpha = o; c.fillStyle = P.red; c.fill(); } }
    /* a few of the trips a message makes */
    c.globalAlpha = 0.9; c.fillStyle = P.blue; c.strokeStyle = P.blue; c.lineWidth = 1.4;
    for (let j = 0; j < 12; j++) { const k = (j * 46) % N - ((j * 46) % N) % 2, a = pt(k), b = pt(Math.floor(S.lf[k] * N)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); disc(c, a[0], a[1], 2.6); c.fill(); disc(c, b[0], b[1], 2.6); c.fill(); }
    c.globalAlpha = 1;
    return { reads: [
      { v: times(trip), k: w('geo', 'r.trip'), tone: trip > 1.25 ? 'bad' : '' },
      { v: times(heat), k: w('geo', 'r.heat'), tone: heat > 1.25 ? 'bad' : '' },
      { v: whole(N), k: w('geo', 'r.parts') }] };
  }
};

/* ---- Brain or copy: where a mind is kept (exactly evaluate() of src/engines/mortal.js: learned on the chip, no
   relearning; the four copies' differences drawn from seeded noise of the engine's spread) ---- */
PICS.copy = {
  u0: 0.35,
  setup(S) { const r = rng(31), G = 10; S.G = G; S.w = []; for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) S.w.push(clamp(0.5 + 0.42 * Math.sin(i * 0.8 + 1) * Math.cos(j * 0.65 + 0.4) + 0.12 * (r() - 0.5), 0.06, 1));
    const order = S.w.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    S.rank = []; order.forEach((k, i) => { S.rank[k] = i; }); S.q = [0, 1, 2, 3].map(() => S.w.map(() => gauss(r))); },
  frame(g, S) {
    const { c, P, box: B } = g, f = g.u, G = S.G, nA = Math.round(f * G * G), E = mortal({ share: f, learn: 'chip', calibrate: false });
    const L = Math.min(B.h - 34, B.w * 0.44), x0 = B.x + 4, y0 = B.y + 20, gap = Math.max(18, B.w * 0.07), M = (L - 16) / 2, x1 = x0 + L + gap + Math.max(0, (B.w - L - gap - 2 * M - 16 - 8) / 2);
    const grid = (x, y, sz, q) => { const cs = sz / G;
      for (let k = 0; k < G * G; k++) { const cx = x + (k % G + 0.5) * cs, cy = y + ((k / G | 0) + 0.5) * cs, an = S.rank[k] < nA; let wt = S.w[k], d = 0;
        if (an && q) { d = 0.1 * Math.SQRT2 * q[k] * 1.5; wt = clamp(wt + d, 0, 1); }
        c.globalAlpha = 0.1 + 0.82 * wt; c.fillStyle = P.ink;
        if (an) { disc(c, cx, cy, cs * 0.43); c.fill(); if (q) { c.globalAlpha = clamp(Math.abs(d) * 3.2); c.fillStyle = P.red; c.fill(); } } else c.fillRect(cx - cs * 0.4, cy - cs * 0.4, cs * 0.8, cs * 0.8); }
      c.globalAlpha = 1; };
    grid(x0, y0, L, null);
    [0, 1, 2, 3].forEach(i => grid(x1 + (i % 2) * (M + 16), y0 + (i >> 1) * (M + 16), M, S.q[i]));
    g.lab(x0, B.y - 18, w('copy', 'l.this'), 'ink'); g.lab(x1, B.y - 18, B.w > 520 ? w('copy', 'l.copies') : w('copy', 'l.copiesShort'), 'ink');
    return { reads: [
      { v: times(E.energy), k: w('copy', 'r.energy'), tone: E.energy < 0.5 ? 'good' : '' },
      { v: pct(E.own / 100, 1), k: w('copy', 'r.own') },
      { v: pct(E.copied / 100, 1), k: w('copy', 'r.copied'), tone: E.copied < 90 ? 'bad' : '' }] };
  }
};

/* ---- Only humans: a thousand designs that all pass (a stand-in for src/engines/thousand.js: seeded designs, each
   leaning toward five things no check measures, that engine's people) ---- */
const SIDES = ['users', 'repair', 'pay', 'planet', 'limits'];
PICS.human = {
  u0: 0.55,
  setup(S) { const r = rng(2026); S.d = Array.from({ length: 1000 }, () => ({ L: [r(), r(), r(), r(), r()], s: 100 - Math.abs(gauss(r)) * 1.1 })); S.keep = -1; S.hov = -1; S.lay = null; },
  at(x, y, S) { const l = S.lay; if (!l || x < l.x0 || y < l.y0) return -1; const i = Math.floor((x - l.x0) / l.cell), j = Math.floor((y - l.y0) / l.cell), k = j * l.cols + i; return i < l.cols && k < l.N ? k : -1; },
  hover(x, y, S) { S.hov = this.at(x, y, S); },
  tap(x, y, S) { const k = this.at(x, y, S); if (k >= 0) S.keep = S.keep === k ? -1 : k; },
  frame(g, S) {
    const { c, P, box: B } = g, N = Math.max(1, Math.round(Math.pow(10, 3 * g.u))), cols = Math.ceil(Math.sqrt(N * B.w / B.h)), rows = Math.ceil(N / cols), cell = Math.min(B.w / cols, B.h / rows, 190);
    const x0 = B.x + (B.w - cell * cols) / 2, y0 = B.y + (B.h - cell * rows) / 2; S.lay = { x0, y0, cell, cols, N };
    let best = 0; for (let k = 0; k < N; k++) best = Math.max(best, S.d[k].s); let near = 0;
    for (let k = 0; k < N; k++) { const d = S.d[k], cx = x0 + (k % cols + 0.5) * cell, cy = y0 + ((k / cols | 0) + 0.5) * cell, R = cell * 0.44, kept = k === S.keep, hov = k === S.hov; if (d.s >= best - 1) near++;
      c.beginPath(); for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + j * TAU / 5, rr = R * (0.28 + 0.72 * d.L[j]); if (j) c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); else c.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } c.closePath();
      c.globalAlpha = kept ? 0.4 : 0.08; c.fillStyle = kept ? P.warm : P.ink; c.fill();
      c.globalAlpha = kept || hov ? 1 : cell < 14 ? 0.5 : 0.7; c.strokeStyle = kept ? P.warm : hov ? P.blue : P.ink; c.lineWidth = kept || hov ? 2 : cell < 14 ? 0.7 : 1.1; c.stroke(); }
    c.globalAlpha = 1;
    const lean = k => { const L = S.d[k].L; let hi = 0, lo = 0; L.forEach((v, j) => { if (v > L[hi]) hi = j; if (v < L[lo]) lo = j; }); return w('human', 'lean', { hi: w('human', 'side.' + SIDES[hi]), lo: w('human', 'side.' + SIDES[lo]) }); };
    const kept = S.keep >= 0 && S.keep < N, show = S.hov >= 0 && S.hov < N ? S.hov : -1;
    return { reads: [
      { v: whole(N), k: w('human', 'r.n', { n: N }) },
      { v: whole(near), k: w('human', 'r.near') },
      { v: kept ? w('human', 'v.kept', { n: S.keep + 1 }) : w('human', 'v.none'), k: w('human', 'r.kept'), tone: kept ? 'good' : '' }],
      cap: kept ? w('human', 'capKept', { n: S.keep + 1, lean: lean(S.keep) })
        : show >= 0 ? w('human', 'capHover', { n: show + 1, s: dec(S.d[show].s, 1), lean: lean(show) }) : null };
  }
};
