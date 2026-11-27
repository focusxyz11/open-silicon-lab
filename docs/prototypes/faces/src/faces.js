/* The faces of a rung along a chip's life (docs/SYSTEM.md: "along keeps the level: a gate as used, as made, as
   designed"). As used is the stack itself (pics.js). Here: the same plates as designed (the studio: drafted outlines)
   and as made (the fab: what the line's steps do to that design). A guiding sketch: four faces drawn in full (chip and
   block as designed, switch and gate as made), the rest only far enough to show the pattern. Every number here is an
   idea drawn; the port should take them from timing.js, rules.js, fabline.js, litho.js and chip.js (yield). */
import { PIC } from './pics.js';
import { UNITS, clamp, fmtT, oneIn, times } from './model.js';
import { STR, t } from './strings.js';
const H = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const FACES = ['design', 'make', 'use'];
export const STEPS = ['crystal', 'deposit', 'print', 'etch', 'implant', 'wires'];
export const CLOCKS = [250, 500, 1000, 2000];
/* which face of which rung is drawn in full, for the switcher's honest note */
export const DRAWN = { design: ['machine', 'sums', 'gate', 'switch'], make: ['switch', 'gate', 'machine'] };

export const FACE = { design: {
  /* the chip as designed: the floorplan, arranged by the recipe's own genes (shape, where it computes) */
  machine(p, C, R, F, g, tm, a) {
    p.begin(); p.quad(184, 10, 694, 180); p.stroke(C.acc(0.8), 1.2, [6, 4]);
    p.begin(); for (let i = 0; i < 30; i++) { p.quad(190 + i * 23, 3, 9, 5); p.quad(190 + i * 23, 192, 9, 5); } p.stroke(C.acc(0.6), 1, []);
    PIC.machine(p, C, R, F, g, 0, 0.45);
    if (g.shape === 'few' || g.shape === 'grid') { const n = UNITS[g.shape][clamp(F.ui, 0, 2)], cols = g.shape === 'few' ? n : n === 16 ? 8 : n === 64 ? 16 : 32, A1 = g.where === 'far' ? 640 : 880, uw = (A1 - 188) / cols, y = g.shape === 'few' ? 44 : 18, d = g.shape === 'few' ? 112 : 164 / (n / cols) * 0.76;
      p.begin(); p.quad(188, y, uw * 0.82, d); p.stroke(C.ink(1), 2, []); p.begin(); for (let k = 1; k < 8; k++) p.seg(188 + k * uw * 0.82 / 8, y, 188 + k * uw * 0.82 / 8, y + d); p.stroke(C.ink(0.55), 1, []); }
  },
  /* the block as designed: your slice, 32 tiles, the carry's wires lit by when the signal arrives against the clock */
  sums(p, C, R, F, g, tm) {
    const xs = i => 186 + i * 21.6, T = R.time.T, D = R.sums.aluD, edge = clamp(Math.floor(T / D * 32), 0, 32), run = Math.floor((tm * 14) % 40);
    p.begin(); for (let i = 0; i < 32; i++) { p.quad(xs(i), 62, 16, 70); p.seg(xs(i) + 4, 80, xs(i) + 12, 80); p.seg(xs(i) + 4, 112, xs(i) + 12, 112); } p.stroke(C.ink(0.6), 1, [4, 3]);
    for (let k = 0; k < 32; k++) { const i = 31 - k, late = k >= edge; if (tm && k > run) break; p.begin(); p.seg(xs(i) + 16, 46, xs(i) - 5.6, 46); p.seg(xs(i) + 8, 46, xs(i) + 8, 62); p.stroke(late ? C.bad(1) : C.acc(1), 2.2, []); }
    if (edge < 32) { const x = xs(31 - edge) + 19, kf = p.fit(46, 50); p.begin(); p.seg(x, 46, x, 46, 0, 50 * kf); p.stroke(C.bad(1), 1.6, [4, 3]); }
  },
  /* the gate as designed: cells drawn as layout, two strips of silicon crossed by two gates, rails above and below */
  gate(p, C) {
    for (let i = 0; i < 9; i++) { const x = 192 + i * 76;
      p.begin(); p.quad(x, 30, 62, 140); p.stroke(C.ink(0.45), 1, [4, 3]);
      p.begin(); p.quad(x + 6, 48, 50, 34); p.quad(x + 6, 118, 50, 34); p.stroke(C.acc(0.9), 1.2, []);
      p.begin(); p.quad(x + 18, 40, 7, 120); p.quad(x + 37, 40, 7, 120); p.stroke(C.bad(0.8), 1.2, []);
      p.begin(); p.seg(x, 34, x + 62, 34); p.seg(x, 166, x + 62, 166); p.stroke(C.ink(0.9), 2, []); }
  },
  /* the switch as designed: its masks, one sheet a layer, ready to go down the road to Print */
  switch(p, C) {
    const kf = p.fit(100, 70);
    [[0, C.acc], [20, C.bad], [40, C.ink], [60, C.ink]].forEach(([h, col], L) => { const z = h * kf;
      p.begin(); p.quad(300, 40, 460, 120, z); p.stroke(col(0.5), 1, [5, 4]);
      p.begin(); for (let i = 0; i < 11; i++) { const x = 318 + i * 40; if (L === 0) p.quad(x, 60, 26, 80, z); else if (L === 1) p.quad(x + 9, 50, 8, 100, z); else if (L === 2) { p.quad(x + 2, 72, 5, 5, z); p.quad(x + 19, 72, 5, 5, z); } else p.seg(x + 4, 120, x + 30, 120, z); } p.stroke(col(0.95), 1.2, []); });
  }
}, make: {
  /* the switch as made: what each step of the line does to your design, twelve copies never quite alike */
  switch(p, C, R, F, g, tm) {
    const k = F.step, s = R.fab.sig, kf = p.fit(140, 46), w = i => 14 * (1 + (H(i + 3) - 0.5) * 0.7 * s), off = i => Math.abs(H(i + 3) - 0.5) * s > 0.36;
    p.begin(); for (let j = 0; j < 5; j++) for (let i = 0; i < 30; i++) p.dot(196 + i * 15, 64 + j * 18, 1.8); p.fill(C.mut(0.5));
    if (k === 1 || k === 2) { p.begin(); p.quad(186, 56, 440, 88, 7 * kf); p.fill(C.ink(0.12)); p.stroke(C.ink(0.6), 1, []); }
    for (let i = 0; i < 12; i++) { const x = 200 + i * 35, wi = w(i), bad = off(i) && k >= 3;
      if (k === 2) { p.begin(); p.quad(x - wi / 2, 62, wi, 76, 13 * kf); p.fill(C.acc(0.35)); p.stroke(C.acc(1), 1.2, []); p.begin(); p.seg(x + 17, 100, x + 17, 100, 16 * kf, 44 * kf); p.stroke(C.acc(0.5 + 0.4 * Math.sin(tm * 5 + i)), 1, [2, 3]); }
      if (k >= 3) { p.begin(); p.M(x - wi / 2, 100, 0); p.L(x - wi / 2, 100, 34 * kf); p.L(x + wi / 2, 100, 34 * kf); p.L(x + wi / 2, 100, 0); p.stroke(bad ? C.bad(1) : C.ink(0.95), 1.8, []); p.begin(); p.seg(x, 60, x, 140, 0); p.stroke(C.ink(0.5), 1, []); }
      if (k >= 4) { p.begin(); p.dot(x - 11, 100, 3.4); p.dot(x + 11, 100, 3.4); p.fill(C.acc(1)); }
      if (k >= 5) { p.begin(); p.seg(x - 11, 100, x - 11, 100, 0, 44 * kf); p.seg(x + 11, 100, x + 11, 100, 0, 44 * kf); p.stroke(C.ink(0.7), 1, []); } }
    if (k >= 5) { p.begin(); p.seg(186, 100, 626, 100, 44 * kf); p.stroke(C.ink(0.9), 1.6, []); }
    /* the spread it hands up: the copies' thresholds as a bell, standing at the right */
    const kb = p.fit(24, 110); p.begin(); for (let u = -40; u <= 40; u += 2) { const x = 760 + u * 2.6, h = 100 * kb * Math.exp(-u * u / (2 * 144 * s * s)); u === -40 ? p.M(x, 24, h) : p.L(x, 24, h); } p.stroke(s > 1.2 ? C.bad(1) : C.acc(1), 2, []);
    p.begin(); p.seg(656, 24, 864, 24, 0); p.stroke(C.mut(0.8), 1, []);
  },
  /* the gate as made: your masks printed across the wafer's field; a speck of dust kills the cell it lands on */
  gate(p, C, R, F) {
    const cols = p.lo ? 36 : 60, n = cols * 6, w = 690 / cols, nd = Math.round(R.fab.D * 14), dead = new Set();
    for (let d = 0; d < nd; d++) dead.add(Math.floor(H(d + 40 + F.care * 9) * n));
    p.begin(); for (let i = 0; i < n; i++) if (!dead.has(i)) p.quad(185 + (i % cols) * w, 22 + ((i / cols) | 0) * 27, w * 0.7, 18); p.fill(C.ink(0.3)); p.stroke(C.ink(0.5), 1, []);
    p.begin(); for (const i of dead) p.quad(185 + (i % cols) * w, 22 + ((i / cols) | 0) * 27, w * 0.7, 18); p.fill(C.bad(0.9));
    p.begin(); for (const i of dead) p.dot(185 + (i % cols) * w + w * 0.35, 31 + ((i / cols) | 0) * 27, 9); p.stroke(C.bad(0.8), 1, []);
  },
  /* the chip as made: the wafer it is cut from, the dies that did not come out in red: the yield */
  machine(p, C, R) {
    const Y = R.fab.Y; p.begin(); for (let u = 0; u <= 48; u++) { const an = u / 48 * 6.2832, x = 530 + Math.cos(an) * 338, y = 100 + Math.sin(an) * 98; u ? p.L(x, y, 0) : p.M(x, y, 0); } p.stroke(C.ink(0.7), 1.3, []);
    let k = 0; for (let j = 0; j < 7; j++) for (let i = 0; i < 22; i++) { const x = 215 + i * 29, y = 14 + j * 25, dx = (x + 12 - 530) / 330, dy = (y + 10 - 100) / 96; if (dx * dx + dy * dy > 0.92) continue; const bad = H(k++ + 5) > Y; p.begin(); p.quad(x, y, 24, 20); if (bad) p.fill(C.bad(0.85)); else { p.fill(C.ink(0.16)); p.stroke(C.ink(0.6), 1, []); } }
  }
} };
/* what a face hands up or asks, in place of the plate's figures as used */
export function faceFigs(face, rung, R, F) {
  if (R.broken) return null; const S = STR.face, f = S.f;
  if (face === 'design') {
    if (rung === 'machine') return [[f.die, R.fab.A.toFixed(2) + ' cm²'], [f.blocks, R.machine.C.toLocaleString('en')], [f.arranged, STR.opt.shape[R.g.shape][0].toLowerCase()]];
    if (rung === 'sums') return [[f.clock, F.clk + ' MHz'], [f.arrives, fmtT(R.sums.aluD)], [f.slack, (R.time.slack >= 0 ? '+' : '−') + fmtT(Math.abs(R.time.slack)), R.time.slack < 0]];
    if (rung === 'gate') return [[f.cell, f.cellV], [f.rules, f.pass]];
    if (rung === 'switch') return [[f.masks, f.masksV], [f.next, f.print]];
  } else if (face === 'make') {
    if (rung === 'switch') return [[f.spread, R.fab.sigma.toFixed(0) + ' mV', R.fab.sig > 1.2], [f.step, S.step[STEPS[F.step]]], [f.wrong, oneIn(R.p), R.p > 1e-12]];
    if (rung === 'gate') return [[f.dust, R.fab.D + ' /cm²', R.fab.D > 1], [f.wrong, oneIn(R.p), R.p > 1e-12]];
    if (rung === 'machine') return [[f.yield, Math.round(R.fab.Y * 100) + '%', R.fab.Y < 0.6], [f.cost, times(1 / R.fab.Y), R.fab.Y < 0.6], [f.die, R.fab.A.toFixed(2) + ' cm²']];
  }
  return null;
}
