/* The core question cards' pictures (src/v2/qcard.js), ported from docs/prototypes/cards/src/inst1.js: Perfect fails,
   Digital meets physical, Whole beats parts, Trust without inspection, Efficiency fuels use. Each is
   { u0, v0?, hstep?, setup?(S), frame(g, S) → { reads, cap? } }; g: c (the canvas), W, H, box, u, v, P (the palette),
   lab(x, y, words, class, align). Nothing moves by itself: a picture is drawn again only when its controls change.
   Words: qc.<id>.l.* (on the picture, as HTML) and qc.<id>.r.* (its measures), src/i18n/en/cards.json. */
import { t } from '../core/i18n.js';
import { exhaust } from '../engines/floor.js';
import { clamp, lerp, rng, gauss, erfc, disc, big, times, pct, oneIn, howLong, whole } from './qckit.js';

const w = (id, k, v) => t('qc.' + id + '.' + k, v);
export const PICS = {};

/* ---- Perfect fails: one drawing, many copies, each its own speed (a stand-in spread for perfect() of lens.js) ---- */
PICS.perfect = {
  u0: 0.615,
  setup(S) {
    const r = rng(7); S.cols = 18; S.rows = 8; S.d = [];
    for (let j = 0; j < S.rows; j++) for (let i = 0; i < S.cols; i++) {
      const x = (i + 0.5) / S.cols * 2 - 1, y = (j + 0.5) / S.rows * 2 - 1;
      S.d.push(0.86 + 0.05 * gauss(r) + 0.045 * (0.7 * x * x + 0.3 * y * y));   /* a little slower toward the wafer's edge */
    }
  },
  frame(g, S) {
    const { c, P, box: B } = g, T = lerp(1.32, 0.8, g.u);
    const s = Math.min(B.w / S.cols, B.h / S.rows), x0 = B.x + (B.w - s * S.cols) / 2, y0 = B.y + (B.h - s * S.rows) / 2;
    let late = 0;
    S.d.forEach((d, k) => {
      const x = x0 + (k % S.cols) * s + s * 0.1, y = y0 + ((k / S.cols) | 0) * s + s * 0.1, wd = s * 0.8, fail = d > T, p = clamp((d / T - 0.55) / 0.45, 0.04, 1);
      if (fail) late++;
      c.globalAlpha = 1; c.strokeStyle = fail ? P.red : P.line; c.lineWidth = fail ? 1.5 : 1; c.strokeRect(x + 0.5, y + 0.5, wd - 1, wd - 1);
      c.fillStyle = fail ? P.red : P.ink; c.globalAlpha = fail ? 0.85 : 0.55;
      c.fillRect(x + 3, y + 3, Math.max(0, (wd - 6) * p), wd - 6);
    });
    c.globalAlpha = 1;
    return { reads: [
      { v: t('qc.n.of', { a: whole(late), b: whole(S.d.length) }), k: w('perfect', 'r.fail'), tone: late ? 'bad' : 'good' },
      { v: times(1 / T), k: w('perfect', 'r.clock') }] };
  }
};

/* ---- Digital meets physical: one wire, a line, and what is read (the formulas of digital() and cleanOne(), lens.js) ---- */
PICS.dig = {
  u0: 0.42,
  setup(S) { const r = rng(21); S.bits = Array.from({ length: 400 }, () => (r() < 0.5 ? 1 : 0)); S.nz = Array.from({ length: 4000 }, () => gauss(r)); },
  frame(g, S) {
    const { c, W, P, box: B } = g, s = lerp(0.28, 1.5, g.u), sig = 0.13, bp = 54, NS = 7;
    const bandH = B.h * 0.7, mid = B.y + bandH / 2, sc = (bandH / 2 - 6) / (0.75 + 2.6 * sig), sqY = B.y + bandH + (B.h - bandH) / 2;
    const m = (i, n) => ((i % n) + n) % n;
    const nz = xa => { const f = xa / NS, i = Math.floor(f), a = f - i, A = S.nz[m(i, 4000)], Bn = S.nz[m(i + 1, 4000)]; return (A + (Bn - A) * a) * sig; };
    const lvl = xa => { const f = xa / bp, i = Math.floor(f), a = f - i, b = S.bits[m(i, 400)], pb = S.bits[m(i - 1, 400)]; return (pb + (b - pb) * (1 - Math.exp(-a * 9)) - 0.5) * s; };
    /* the line where a 1 begins */
    c.strokeStyle = P.muted; c.lineWidth = 1; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(0, mid + 0.5); c.lineTo(W, mid + 0.5); c.stroke(); c.setLineDash([]);
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.lineJoin = 'round'; c.beginPath();
    for (let x = 0; x <= W; x += 2) { const y = mid - (lvl(x) + nz(x)) * sc; if (x) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke();
    for (let i = -1; ; i++) {
      const cx = (i + 0.66) * bp; if (cx > W + bp) break; if (cx < -bp) continue;
      const val = lvl(cx) + nz(cx), read = val > 0 ? 1 : 0, sent = S.bits[m(i, 400)], bad = read !== sent, q = 15;
      c.fillStyle = bad ? P.red : P.warm; disc(c, cx, mid - val * sc, 3.2); c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 1.4; c.fillStyle = P.ink;
      if (read) c.fillRect(cx - q / 2, sqY - q / 2, q, q); else c.strokeRect(cx - q / 2 + 0.5, sqY - q / 2 + 0.5, q - 1, q - 1);
      if (bad) { c.strokeStyle = P.red; c.lineWidth = 2; disc(c, cx, sqY, q * 0.95); c.stroke(); }
    }
    g.lab(12, B.y, w('dig', 'l.one')); g.lab(12, B.y + bandH - 12, w('dig', 'l.zero'));
    g.lab(W - 12, B.y, w('dig', 'l.wire'), '', 'r'); g.lab(W - 12, sqY - 26, w('dig', 'l.bits'), '', 'r');
    const wrong = 0.5 * erfc((s / 2) / (sig * Math.SQRT2));
    return { reads: [
      { v: oneIn(wrong), k: w('dig', 'r.wrong'), tone: wrong > 1e-3 ? 'bad' : '' },
      { v: times(s * s), k: w('dig', 'r.energy') }] };
  }
};

/* ---- Whole beats parts: copies that vote (von Neumann 1956; the formula of blockOk in src/engines/redundancy.js,
   the vote lab's own engine, written again here: a view's file may not import another view's) ---- */
const VOTER_P = 0.003;
const choose = (n, k) => { let x = 1; for (let i = 1; i <= k; i++) x = x * (n - k + i) / i; return x; };
export function blockOk(p, n) { const r = 1 - p; if (n === 1) return r; let ok = 0; for (let k = Math.ceil((n + 1) / 2); k <= n; k++) ok += choose(n, k) * r ** k * p ** (n - k); return ok * (1 - VOTER_P); }
PICS.vn = {
  u0: 0.25, v0: 0.5, hstep: 4,
  frame(g) {
    const { c, P, box: B } = g, n = [1, 3, 5, 7, 9][Math.round(g.u * 4)], p = 0.01 * Math.pow(60, g.v);
    const R = 10, rowH = Math.min(30, (B.h - 22) / R), q = rowH * 0.6;
    const wParts = n * rowH, gap = Math.min(70, B.w * 0.12), total = wParts + gap * 2 + rowH * 1.3, x0 = B.x + (B.w - total) / 2, xv = x0 + wParts + gap, xw = xv + gap;
    for (let r = 1; r <= R; r++) {
      const y = B.y + 24 + (r - 1) * rowH + rowH / 2, rr = rng((r + 1000) * 7919 + 17); let bad = 0;
      for (let i = 0; i < 9; i++) { const wr = rr() < p; if (i >= n) continue; if (wr) bad++;
        c.globalAlpha = wr ? 0.95 : 0.4; c.fillStyle = wr ? P.red : P.ink; c.fillRect(x0 + i * rowH + (rowH - q) / 2, y - q / 2, q, q); }
      const wrong = n === 1 ? bad > 0 : bad > n / 2 || rr() < VOTER_P;
      c.globalAlpha = 0.5; c.strokeStyle = P.muted; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + wParts + 4, y); c.lineTo(xw - 4, y); c.stroke();
      if (n > 1) { c.globalAlpha = 1; c.fillStyle = P.solid; disc(c, xv, y, 5); c.fill(); c.strokeStyle = P.muted; c.stroke(); }
      c.globalAlpha = 1; c.fillStyle = wrong ? P.red : P.ink; const Q2 = rowH * 0.8; c.fillRect(xw, y - Q2 / 2, Q2, Q2);
    }
    c.globalAlpha = 1;
    g.lab(x0 + wParts / 2, B.y, n === 1 ? w('vn', 'l.one') : w('vn', 'l.parts', { n }), '', 'c'); if (n > 1 && gap > 58) g.lab(xv, B.y, w('vn', 'l.vote'), '', 'c'); g.lab(xw + rowH * 0.4, B.y, w('vn', 'l.whole'), 'ink', 'c');
    const whole1 = 1 - blockOk(p, n);
    return { reads: [
      { v: oneIn(whole1), k: w('vn', 'r.whole'), tone: whole1 < p * 0.999 ? 'good' : n > 1 ? 'bad' : '' },
      { v: oneIn(p), k: w('vn', 'r.part') },
      { v: '×' + n, k: w('vn', 'r.paid') }] };
  }
};

/* ---- Trust without inspection: every case, and what testing covers (exhaust of src/engines/floor.js, exact) ---- */
const DAY = 86400, RATE = 1e9;
PICS.trust = {
  u0: 22 / 60, hstep: 60,
  frame(g) {
    const { c, P, box: B } = g, b = 4 + Math.round(g.u * 60), X = exhaust(b, RATE), cases = X.pairs, share = Math.min(1, DAY * RATE / cases);
    const Sd = Math.min(B.w, B.h), x0 = B.x + (B.w - Sd) / 2, y0 = B.y + (B.h - Sd) / 2, side = Sd * Math.sqrt(share);
    /* every case: a field too fine to draw past a few bits */
    c.fillStyle = P.ink; c.globalAlpha = 0.06; c.fillRect(x0, y0, Sd, Sd);
    c.globalAlpha = 0.16; for (let yy = y0 + 5; yy < y0 + Sd; yy += 9) for (let xx = x0 + 5; xx < x0 + Sd; xx += 9) c.fillRect(xx, yy, 1.2, 1.2);
    c.globalAlpha = 1; c.strokeStyle = P.line; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, Sd - 1, Sd - 1);
    c.fillStyle = P.warm; c.globalAlpha = 0.9; if (side >= 3) c.fillRect(x0, y0 + Sd - side, side, side); c.globalAlpha = 1;
    if (b <= 6) { const n = Math.pow(2, b), st = Sd / n; c.strokeStyle = P.solid; c.lineWidth = n > 32 ? 0.5 : 1; c.beginPath(); for (let i = 1; i < n; i++) { c.moveTo(x0 + i * st, y0); c.lineTo(x0 + i * st, y0 + Sd); c.moveTo(x0, y0 + i * st); c.lineTo(x0 + Sd, y0 + i * st); } c.stroke(); }
    if (side < 3) { c.fillStyle = P.warm; c.fillRect(x0, y0 + Sd - 3, 3, 3); c.strokeStyle = P.warm; c.lineWidth = 1.2; disc(c, x0 + 1.5, y0 + Sd - 1.5, 12); c.stroke();
      g.lab(x0 + 20, y0 + Sd - 20, w('trust', 'l.small', { n: big(9 / (Sd * Sd * share)) }), 'warm'); }
    else if (share < 1) g.lab(x0 + side + 8, y0 + Sd - Math.min(side, 20), w('trust', 'l.tested'), 'warm');
    if (share < 1) g.lab(x0 + Sd - 8, y0 + 8, w('trust', 'l.never'), '', 'r');
    return { reads: [
      { v: big(cases), k: w('trust', 'r.cases', { b }) },
      { v: howLong(X.seconds), k: w('trust', 'r.all') },
      { v: share >= 1 ? w('trust', 'r.everyone') : share > 0.001 ? pct(share, 1) : oneIn(share), k: w('trust', 'r.day'), tone: share >= 1 ? 'good' : 'bad' }] };
  }
};

/* ---- Efficiency fuels use: cheaper answers, more of them (jevons() of src/engines/bet.js, its elasticity freed) ---- */
PICS.eff = {
  u0: 0.8, v0: 0.34,
  frame(g) {
    const { c, P, box: B } = g, a = lerp(0.5, 1.75, g.u), e = Math.pow(8, -g.v), asked = Math.pow(e, -a), total = asked * e;
    const R0 = Math.min(B.w, B.h) * 0.225, cx = B.x + B.w / 2, cy = B.y + B.h / 2, N = Math.min(1700, Math.round(40 * asked)), cc = R0 / Math.sqrt(40) * Math.sqrt(e), rd = Math.max(0.9, cc * 0.46);
    c.fillStyle = P.ink; c.globalAlpha = 0.62;
    for (let k = 0; k < N; k++) { const r = cc * Math.sqrt(k + 0.5), th = k * 2.399963; disc(c, cx + r * Math.cos(th), cy + r * Math.sin(th), rd); c.fill(); }
    c.globalAlpha = 1; c.strokeStyle = P.muted; c.lineWidth = 1.2; c.setLineDash([5, 5]); disc(c, cx, cy, R0); c.stroke(); c.setLineDash([]);
    g.lab(cx + R0 * 0.72 + 6, cy - R0 * 0.72 - 16, w('eff', 'l.today'));
    const f = x => (x >= 1 ? times(x) : '÷' + times(1 / x).slice(1));
    return { reads: [
      { v: f(e), k: w('eff', 'r.each') },
      { v: f(asked), k: w('eff', 'r.asked') },
      { v: f(total), k: w('eff', 'r.total'), tone: total > 1.02 ? 'bad' : total < 0.98 ? 'good' : '' }] };
  }
};
