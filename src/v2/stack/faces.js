/* Your stack, the faces of its rungs along a chip's life (#456; docs/PATH.md, "Three faces: the studio and the fab").
   Along (← →, the switch under the rail, or the loop in the bar) turns every plate at once, and the camera and the
   stack do not move: as designed (the studio, chip to switch: drafted dashed outlines, the studio's steps as the
   plate's control), as made (the fab, atom to chip: solid, the line's steps as the control, each showing what it does
   to your design), as used (the stack as before, pics.js). Which rung has which face, its steps and why a face is
   missing are written once, in src/data/path.js FACE_OF (read through src/engines/path.js faceOf); the numbers are the
   carry's (the line's care, the spread of the copies, the specks, the yield and the cost of a good chip: carry().fab
   and the chip's die, #455; the timing the path model's), and the pictures are ideas drawn on them.
   Ported from the guiding prototype by Claude Fable 5.2 (docs/prototypes/faces/src/faces.js: stand-in numbers, eight
   rungs) onto the lab's seven rungs and its carry by Claude Opus 5.5 in the nightly build. No words here but t('…')
   (sk.face.*, sk.step.*, sk.ff.*, in src/i18n/en/stack.json); every picture is drawn in the plate's plan, 900 by 200,
   through the pen of pics.js, the left 170 kept clear for the rung's name. */
import { t, fmtNum } from '../../core/i18n.js';
import { FACES } from '../../data/path.js';
import { A, P, fmtT, fmtN, oneIn, times, pct } from './model.js';
import { PIC } from './pics.js';

export { FACES };
const H = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
/* the steps that sit inside another (the cell on the masks, timing and rules among the gates, Arrange on the job's
   screen) are named in the stack's words; the others are depths of the studio or the line, named by the lab already */
const INNER = ['cell', 'timing', 'rules', 'arrange'];
export const stepName = id => (INNER.includes(id) ? t('sk.step.' + id) : t('depth.' + id + '.name'));
export const stepWhat = id => t('sk.step.' + id + '.d');
/* a rung's face: { steps, home, none, fork }. none says why the rung has no such face (src/data/path.js FACE_OF); fork
   that another carrier replaces the rung, which no studio or line of the lab draws yet */
export function faceAt(R, rung, face) {
  const f = P.faceOf(rung, face) || {}, steps = f.steps ? f.steps.map(s => s.id) : [];
  return { steps, home: Math.max(0, steps.indexOf(f.home)), none: f.none || null, fork: face !== 'use' && ['atom', 'switch', 'gate'].includes(rung) && A.isFork('carrier', R.recipe.carrier) };
}
/* the words under a plate's name: the step it stands at, or why it has no face */
export function wayOf(R, rung, face, k) {
  const f = faceAt(R, rung, face);
  return f.none ? t('sk.face.none.' + f.none) : f.fork ? t('sk.face.forkTag') : f.steps.length ? stepName(f.steps[k]) + (f.steps.length > 1 ? ' · ' + t('sk.face.stepOf', { n: k + 1, of: f.steps.length }) : '') : '';
}
/* how true each face is: as made, the fab's engines behind what the line hands up (the print's spread, the cleanroom's
   specks, the chip engine's yield); everything else here is the path model, an idea drawn */
export function fidOf(R, rung, face) {
  const f = R.fab.fid, m = { switch: f.spread, gate: f.defects, chip: f.yield };
  return face === 'make' && m[rung] ? m[rung] : { f: 'idea', by: 'path' };
}
const mm2 = cm2 => (cm2 * 100).toFixed(cm2 < 0.1 ? 2 : 1) + ' mm²';
/* what a face hands up or asks, in place of the plate's figures as used: [label, value, bad] */
export function figsOf(R, rung, face, k) {
  const f = faceAt(R, rung, face); if (f.none || f.fork || R.broken && R.rungs[rung].broken) return [];
  const r = R.rungs, F = R.fine, L = (id, v) => t('sk.ff.' + id, v);
  if (face === 'design') {
    if (rung === 'switch') { const s = r.switch.hands; return [[L('vt'), s.vt.toFixed(2) + ' V'], [L('drawn'), s.swing.toFixed(0) + ' mV'], [L('spreadD'), r.switch.more.designed.sigma.toFixed(0) + ' mV']]; }
    if (rung === 'gate') { const G = r.gate.hands, per = r.chip.more.core ? r.chip.more.core.period : 0; return [[L('switches'), String(G.switches)], [t('sk.f.delay'), fmtT(G.delay)], per ? [L('perTick'), fmtNum(Math.round(per / G.delay))] : null].filter(Boolean); }
    if (rung === 'block' && r.block.hands) { const B = r.block.hands, m = r.block.more, per = r.chip.more.core ? r.chip.more.core.period : B.aluDelay, sl = per - B.aluDelay;
      if (k === 2) return [[L('gates'), fmtN(B.gates)], [L('memShare'), pct(m.memory.gates / B.gates)], [t('sk.f.read', { p: Math.round(100 * B.wireShare) }), fmtT(B.readDelay), B.wireShare > 0.2]];
      return [[L('gates'), fmtN(B.gates)], [L('add'), fmtT(B.aluDelay)], [sl >= 0 ? L('spare') : L('late'), fmtT(Math.abs(sl)), sl < 0]]; }
    if (rung === 'chip' && r.chip.hands) { const K = r.chip.hands; return [[L('gates'), fmtN(K.gates)], [L('area'), mm2(K.area)], [L('arranged'), t('ar.opt.shape.' + R.recipe.shape)]]; }
  } else if (face === 'make') {
    if (rung === 'atom' && !A.isFork('carrier', R.recipe.carrier)) return [[L('care'), t('sk.care.' + R.fab.care)], [t('sk.f.gap'), r.atom.hands.gap.toFixed(2) + ' eV']];
    if (rung === 'switch' && R.broken === 'switch') return [[t('sk.f.turnsOff'), t('sk.f.never'), true]];
    if (rung === 'switch') { const s = r.switch.hands, G = r.gate.hands; return [[L('spread'), s.sigma.toFixed(1) + ' mV', R.fab.spread > 1.2], [t('sk.f.vmin'), s.vmin.toFixed(2) + ' V', F.V < s.vmin], G ? [t('sk.f.wrong'), oneIn(G.fail), G.fail > 1e-12] : null].filter(Boolean); }
    if (rung === 'gate' && r.gate.hands) return [[L('specks'), R.fab.defects.toFixed(2) + ' /cm²', R.fab.defects > 0.5], [t('sk.f.wrong'), oneIn(r.gate.hands.fail), r.gate.hands.fail > 1e-12]];
    if (rung === 'block' && r.block.hands) { const B = r.block.hands; return [[t('sk.f.read', { p: Math.round(100 * B.wireShare) }), fmtT(B.readDelay), B.wireShare > 0.2], [L('gates'), fmtN(B.gates)]]; }
    if (rung === 'chip' && r.chip.hands) { const K = r.chip.hands, die = r.chip.more.die;
      return k === 1 ? [[L('cost'), times(K.cost), K.cost > 1.5], [L('yield'), pct(K.yield), K.yield < 0.6], [L('area'), mm2(K.area)]]
        : [[L('yield'), pct(K.yield), K.yield < 0.6], [L('good'), die ? fmtN(die.dies * die.yield) : '—'], [L('area'), mm2(K.area)]]; }
  }
  return [];
}

/* ---------- the pictures: (p, C, R, D, tm, a, k), k the step the plate stands at ---------- */
const X0 = 180, X1 = 880;
/* the block's two parts as the as-used picture lays them out: the register file at the left, 32 slices of the ALU */
const AX = i => 446 + i * 13.5, AW = 10;
const DESIGN = {
  /* the switch as designed: one cell, eleven times, drawn as four layers (where silicon is, the gate across it, the
     contacts, the first metal); at Masks each layer lifts onto its own sheet, ready for Print */
  switch(p, C, R, D, tm, a, k) {
    const sh = D.spec.shape, up = k === 1, kf = p.fit(100, 70), cols = [C.acc, C.ink, C.ink, C.mut];
    for (let l = 0; l < 4; l++) {
      const z = up ? l * 22 * kf : 0, col = cols[l];
      if (up) { p.begin(); p.quad(300, 36, 470, 128, z); p.stroke(col(0.4 * a), 1, [6, 4]); }
      p.begin();
      for (let i = 0; i < 11; i++) {
        const x = 312 + i * 42;
        if (l === 0) { if (sh === 'fin') { p.quad(x + 2, 84, 36, 6); p.quad(x + 2, 108, 36, 6); } else if (sh === 'planar') p.quad(x + 2, 74, 36, 52); else p.quad(x + 2, 90, 36, 20); }
        else if (l === 1) p.quad(x + 17, 56, 6, 88);
        else if (l === 2) { p.quad(x + 6, 96, 6, 6); p.quad(x + 28, 96, 6, 6); }
        else { p.seg(x + 9, 96, x + 9, 44); p.seg(x + 31, 102, x + 31, 156); }
      }
      p.stroke(col(0.95 * a), 1.2);
    }
  },
  /* the gate as designed: cells drawn as layout, two strips of silicon crossed by the gates of the library (two for a
     NAND, three for a richer cell), the rails above and below. Timing runs a signal through them; the rules check the
     space between them */
  gate(p, C, R, D, tm, a, k) {
    const n = D.F.lib === 'rich' ? 3 : 2, cw = 76, N = 9, x0 = 192, sweep = tm ? x0 + ((tm * 120) % (N * cw)) : x0 + N * cw;
    for (let i = 0; i < N; i++) {
      const x = x0 + i * cw, done = k === 2 && x + 62 < sweep, faint = k === 1 ? 0.55 : 1;
      p.begin(); p.quad(x, 30, 62, 140); p.stroke(done ? C.acc(0.9 * a) : C.ink(0.45 * a));
      p.begin(); p.quad(x + 6, 48, 50, 34); p.quad(x + 6, 118, 50, 34); p.stroke(C.acc(0.9 * a * faint), 1.2);
      p.begin(); for (let j = 0; j < n; j++) p.quad(x + 62 * (j + 1) / (n + 1) - 3.5, 40, 7, 120); p.stroke(C.ink(0.8 * a * faint), 1.2);
      p.begin(); p.seg(x, 34, x + 62, 34); p.seg(x, 166, x + 62, 166); p.stroke(C.ink(0.9 * a * faint), 2);
      if (k === 2 && i < N - 1) { p.begin(); p.seg(x + 64, 182, x + cw - 2, 182); p.seg(x + 64, 177, x + 64, 187); p.seg(x + cw - 2, 177, x + cw - 2, 187); p.stroke(done ? C.acc(0.95 * a) : C.mut(0.8 * a), 1, []); }
    }
    if (k === 1) {
      /* the path a signal takes, cell to cell, and where it has got to */
      p.begin(); p.M(x0 + 31, 100, 0); for (let i = 1; i < N; i++) p.L(x0 + i * cw + 31, 100, 0); p.stroke(C.acc(0.9 * a), 2, []);
      const u = tm ? (tm * 0.6) % 1 : 1; p.begin(); p.dot(x0 + 31 + u * (N - 1) * cw, 100, 6); p.fill(C.acc(1));
    }
    if (k === 2) { p.begin(); p.wall(sweep, sweep + 1, 22, 0, 30 * p.fit(22, 30)); p.seg(sweep, 22, sweep, 182); p.stroke(C.acc(0.9 * a), 1.4, []); }
  },
  /* the block as designed: Describe draws its sums and its memory; Check runs the carry against the clock (lit while
     it is in time, red once it is late: a path too long for one tick); Layout gives each part the room its gates take */
  block(p, C, R, D, tm, a, k) {
    const B = R.rungs.block; if (!B.hands) return;
    const F = D.F, m = B.more, regs = m.memory.regs, per = R.rungs.chip.more.core ? R.rungs.chip.more.core.period : B.hands.aluDelay;
    /* the room each part takes: at Layout, in proportion to its gates (the memory is most of a small block) */
    const share = k === 2 ? Math.min(0.86, m.memory.gates / B.hands.gates) : 0.31, RX1 = 188 + 692 * share - 20, ax = k === 2 ? i => RX1 + 26 + i * (862 - RX1 - 26) / 32 : AX, aw = k === 2 ? Math.max(1.5, (862 - RX1 - 26) / 32 * 0.74) : AW;
    p.begin(); p.quad(188, 20, RX1 - 188, 160); for (let r = 1, st = Math.max(1, regs / 8); r * st < regs; r++) p.seg(188, 20 + r * st * 160 / regs, RX1, 20 + r * st * 160 / regs); p.stroke(C.acc(0.55 * a), 1);
    p.begin(); for (let i = 0; i < 32; i++) p.quad(ax(i), 62, aw, 70); p.stroke(C.acc(0.8 * a), 1);
    if (F.adder === 'look' && k !== 2) { const kf = p.fit(34, 104); p.begin(); for (let L = 1; L <= 5; L++) { const st = 2 ** L, h0 = (L - 1) * 19 * kf, h1 = L * 19 * kf; for (let i = st - 1; i < 32; i += st) p.seg(ax(i - st / 2) + aw / 2, 46, ax(i) + aw / 2, 46, h0, h1); } p.stroke(C.acc(0.8 * a), 1.1); }
    /* the carry, bit by bit from the right; at Check, lit while in time, red once later than the tick */
    const edge = k === 1 ? Math.min(32, Math.floor(per / B.hands.aluDelay * 32)) : 32, run = k === 1 && tm ? Math.floor((tm * 14) % 40) : 32;
    for (let j = 0; j < 32 && j <= run; j++) { const i = 31 - j, late = j >= edge; p.begin(); p.seg(ax(i) + aw, 46, ax(i) - (ax(1) - ax(0) - aw), 46); p.seg(ax(i) + aw / 2, 46, ax(i) + aw / 2, 62); p.stroke(late ? C.bad(1) : k === 1 ? C.acc(1) : C.acc(0.6 * a), k === 1 ? 2 : 1.2, k === 1 ? [] : undefined); }
    if (k === 1 && edge < 32) { const x = ax(31 - edge) + aw + 2, kf = p.fit(46, 50); p.begin(); p.seg(x, 46, x, 46, 0, 50 * kf); p.seg(x, 30, x, 150); p.stroke(C.bad(1), 1.4, [4, 3]); }
    /* the read: the bus from the memory to the sums, red when its wires take the time */
    p.begin(); p.seg(RX1, 100, ax(0) - 4, 100); p.stroke(B.hands.wireShare > 0.2 ? C.bad(0.9) : C.ink(0.7 * a), 1.4);
  },
  /* the chip as designed: the job gives its floor (the die, its pads, and one core's parts in proportion to their
     gates); Arrange lays out its units as the recipe's shape and where it computes say (the genes) */
  chip(p, C, R, D, tm, a, k) {
    p.begin(); p.quad(184, 10, 694, 180); p.stroke(C.acc(0.8 * a), 1.2, [6, 4]);
    p.begin(); for (let i = 0; i < 30; i++) { p.quad(190 + i * 23, 3, 9, 5); p.quad(190 + i * 23, 192, 9, 5); } p.stroke(C.acc(0.6 * a), 1);
    const K = R.rungs.chip, B = R.rungs.block;
    if (k === 1) { PIC.machine(p, C, R, D, tm, a * 0.7); return; }
    if (!K.hands || !B.hands) return;
    /* one core: its memory, its sums, its control and its pipeline registers, each as wide as its gates */
    const parts = [B.more.memory.gates, B.more.sums.gates, P.CTRL, Math.max(0, K.hands.gates - B.hands.gates - P.CTRL)].filter(v => v > 0), tot = parts.reduce((s, v) => s + v, 0);
    let x = 214; const W = 632, cols = [C.acc, C.acc, C.ink, C.mut];
    parts.forEach((g, i) => { const w = Math.max(6, W * g / tot); p.begin(); p.quad(x, 44, w - 4, 112); p.stroke(cols[i](0.85 * a), 1.2); if (i === 0) { p.begin(); for (let r = 1; r < 8; r++) p.seg(x, 44 + r * 14, x + w - 4, 44 + r * 14); p.stroke(C.acc(0.35 * a), 1); } x += w; });
  }
};
const MAKE = {
  /* the atom as made: the crystal grown from its seed, row on row; then the implant, ions driven into it from above,
     each one an atom of something else now sitting in the lattice */
  atom(p, C, R, D, tm, a, k) {
    if (A.isFork('carrier', R.recipe.carrier)) return;
    const front = k === 0 && tm ? 188 + ((tm * 60) % 700) : 900, nx = p.lo ? 30 : 56;
    p.begin(); for (let j = 0; j < 6; j++) for (let i = 0; i < nx; i++) { const x = 192 + (i + (j % 2) * 0.5) * 676 / nx; if (x < front) p.dot(x, 25 + j * 30, 2.4); } p.fill(C.ink(0.6 * a));
    if (k === 0) { if (front < 880) { p.begin(); p.seg(front, 14, front, 186); p.stroke(C.acc(0.9), 1.6, []); p.begin(); for (let j = 0; j < 6; j++) for (let i = 0; i < nx; i++) { const x = 192 + (i + (j % 2) * 0.5) * 676 / nx; if (x >= front) p.dot(x, 25 + j * 30, 2.4); } p.fill(C.ink(0.12)); } return; }
    const kf = p.fit(40, 60);
    p.begin(); for (let d = 0; d < 26; d++) p.dot(200 + H(d + 11) * 660, 25 + Math.floor(H(d + 31) * 3) * 30, 4); p.fill(C.acc(a));
    p.begin(); for (let s = 0; s < 9; s++) { const x = 200 + H(s + 70) * 660, y = 25 + Math.floor(H(s + 90) * 3) * 30, u = tm ? (tm * 0.9 + H(s)) % 1 : 0.5; p.seg(x, y, x, y, 60 * kf * (1 - u), 60 * kf * (1 - u) + 14 * kf); } p.stroke(C.acc(0.8 * a), 1.6, []);
  },
  /* the switch as made: what each step of the line does to your design. Deposit lays a film over the wafer; Etch cuts
     the fins out of it, twelve copies never quite alike (wider on a hurried line), and the ones whose threshold your
     voltage does not clear go red, the same copies as in use. The spread they hand up stands at the right */
  switch(p, C, R, D, tm, a, k) {
    if (A.isFork('carrier', R.recipe.carrier)) return;
    const s = R.fab.spread, sw = R.rungs.switch.hands, V = D.F.V, kf = p.fit(140, 46);
    p.begin(); for (let j = 0; j < 5; j++) for (let i = 0; i < 30; i++) p.dot(196 + i * 15, 64 + j * 18, 1.8); p.fill(C.mut(0.5 * a));
    if (k === 0) {
      p.begin(); p.quad(186, 56, 440, 88, 7 * kf); p.fill(C.ink(0.14 * a)); p.stroke(C.ink(0.6 * a), 1, []);
      p.begin(); for (let i = 0; i < 14; i++) { const x = 196 + H(i + 5) * 420, u = tm ? (tm * 0.7 + H(i)) % 1 : 0.5; p.dot(x, 70 + H(i + 9) * 60, 2.2, 7 * kf + 40 * kf * (1 - u)); } p.fill(C.acc(0.9 * a));
    } else for (let i = 0; i < 12; i++) {
      const x = 200 + i * 35, wi = 14 * (1 + (H(i + 3) - 0.5) * 0.7 * s), vti = sw.vt + (H(i + 3) - 0.5) * 6 * sw.sigma / 1000, bad = V < vti + 0.02;
      p.begin(); p.M(x - wi / 2, 100, 0); p.L(x - wi / 2, 100, 34 * kf); p.L(x + wi / 2, 100, 34 * kf); p.L(x + wi / 2, 100, 0); p.fill(bad ? C.bad(0.25) : C.ink(0.16 * a)); p.stroke(bad ? C.bad(1) : C.ink(0.95 * a), 1.8, []);
      p.begin(); p.seg(x, 60, x, 140, 0); p.stroke(C.ink(0.5 * a), 1, []);
    }
    /* the copies' thresholds as a bell: wider as the print is noisier; the dashed line is the lowest clean voltage */
    const kb = p.fit(24, 110), sd = R.rungs.switch.more.designed.sigma, xv = dv => 760 + dv / (6 * sd) * 100;
    p.begin(); for (let u = -40; u <= 40; u++) { const dv = u / 40 * 6 * sd, h = 100 * kb * Math.exp(-dv * dv / (2 * sw.sigma * sw.sigma)) * sd / sw.sigma; u === -40 ? p.M(xv(dv), 24, h) : p.L(xv(dv), 24, h); } p.stroke(s > 1.2 ? C.bad(1) : C.acc(a), 2, []);
    p.begin(); p.seg(656, 24, 864, 24, 0); p.stroke(C.mut(0.8 * a), 1, []);
    const xm = Math.min(866, xv((sw.vmin - sw.vt) * 1000)); if (isFinite(xm)) { p.begin(); p.seg(xm, 24, xm, 24, 0, 104 * kb); p.stroke(V < sw.vmin ? C.bad(1) : C.ink(0.8 * a), 1.2, [4, 3]); }
  },
  /* the gate as made: your masks printed across the wafer's field by a slit of light; a speck of dust kills the cell it
     lands on (more on a dirtier line), and a copy the spread put out of reach goes wrong */
  gate(p, C, R, D, tm, a) {
    if (A.isFork('carrier', R.recipe.carrier) || !R.rungs.gate.hands) return;
    const cols = p.lo ? 36 : 60, n = cols * 6, w = 690 / cols, nd = Math.round(R.fab.defects * 14), dead = new Set(), fail = R.rungs.gate.hands.fail, Pb = 1 - Math.exp(-fail * 1e9 / n);
    for (let d = 0; d < nd; d++) dead.add(Math.floor(H(d + 40) * n));
    const slit = tm ? 185 + ((tm * 110) % 760) : 1e9, at = i => [185 + (i % cols) * w, 22 + ((i / cols) | 0) * 27];
    p.begin(); for (let i = 0; i < n; i++) { const [x, y] = at(i); if (!dead.has(i) && x < slit) p.quad(x, y, w * 0.7, 18); } p.fill(C.ink(0.3 * a)); p.stroke(C.ink(0.5 * a), 1, []);
    p.begin(); for (let i = 0; i < n; i++) { const [x, y] = at(i); if (x >= slit) p.quad(x, y, w * 0.7, 18); } p.stroke(C.ink(0.18 * a), 1, []);
    p.begin(); for (let i = 0; i < n; i++) { const [x, y] = at(i); if (!dead.has(i) && x < slit && H(i + 7) < Pb) p.quad(x, y, w * 0.7, 18); } p.fill(C.bad(0.9));
    p.begin(); for (const i of dead) { const [x, y] = at(i); if (x < slit) p.quad(x, y, w * 0.7, 18); } p.fill(C.bad(0.9));
    p.begin(); for (const i of dead) { const [x, y] = at(i); if (x < slit) p.dot(x + w * 0.35, y + 9, 9); } p.stroke(C.bad(0.8), 1, []);
    if (slit < 880) { p.begin(); p.quad(slit, 14, 8, 172); p.fill(C.acc(0.35)); p.stroke(C.acc(0.9), 1, []); }
  },
  /* the block as made: Wires lays metal over its gates, layer on layer, joined by vias; the read's long wires red when
     they take the time */
  block(p, C, R, D, tm, a) {
    const B = R.rungs.block; if (!B.hands) return;
    const kf = p.fit(40, 30), lv = [6, 14, 24].map(h => h * kf);
    p.begin(); p.quad(188, 20, 216, 160); for (let i = 0; i < 32; i++) p.quad(AX(i), 62, AW, 70); p.fill(C.acc(0.12 * a)); p.stroke(C.acc(0.45 * a), 1, []);
    p.begin(); for (let j = 0; j < 8; j++) p.seg(188, 28 + j * 20, 878, 28 + j * 20, lv[0]); p.stroke(C.ink(0.4 * a), 1, []);
    p.begin(); for (let i = 0; i < 18; i++) p.seg(196 + i * 38, 22, 196 + i * 38, 178, lv[1]); p.stroke(C.ink(0.55 * a), 1.2, []);
    p.begin(); for (let i = 0; i < 18; i++) for (let j = 0; j < 8; j++) if (H(i * 8 + j) < 0.3) p.dot(196 + i * 38, 28 + j * 20, 2.6, lv[1]); p.fill(C.ink(0.85 * a));
    p.begin(); p.seg(404, 100, AX(0) - 4, 100, lv[2]); p.seg(188, 60, 878, 60, lv[2]); p.seg(188, 140, 878, 140, lv[2]); p.stroke(B.hands.wireShare > 0.2 ? C.bad(0.9) : C.ink(0.9 * a), 2.2, []);
  },
  /* the chip as made: at Test, the wafer it is cut from, the dies a speck landed on in red: the yield; at Package, one
     good die closed in its package, wired to the pins */
  chip(p, C, R, D, tm, a, k) {
    const K = R.rungs.chip; if (!K.hands) return;
    if (k === 1) {
      const kf = p.fit(30, 26);
      p.begin(); p.quad(330, 30, 400, 140); p.fill(C.ink(0.1 * a)); p.stroke(C.ink(0.7 * a), 1.2, []);
      /* the pins round its edge, the die in the middle, a bond wire from each pad of the die to a pin */
      p.begin(); for (let i = 0; i < 6; i++) for (const y of [42, 158]) p.quad(368 + i * 62, y - 4, 16, 8); p.fill(C.ink(0.6 * a));
      p.begin(); p.quad(480, 70, 100, 60, 4 * kf); p.fill(C.panel(1)); p.stroke(C.ink(0.95 * a), 1.4, []);
      p.begin(); for (let i = 0; i < 6; i++) { const xd = 490 + i * 16, xp = 376 + i * 62; p.M(xd, 74, 4 * kf); p.L((xd + xp) / 2, 56, 20 * kf); p.L(xp, 42, 0); p.M(xd, 126, 4 * kf); p.L((xd + xp) / 2, 144, 20 * kf); p.L(xp, 158, 0); } p.stroke(C.acc(0.85 * a), 1, []);
      return;
    }
    const Y = K.hands.yield, probe = tm ? Math.floor(tm * 2) : -1;
    p.begin(); for (let u = 0; u <= 48; u++) { const an = u / 48 * 6.2832, x = 530 + Math.cos(an) * 338, y = 100 + Math.sin(an) * 98; u ? p.L(x, y, 0) : p.M(x, y, 0); } p.stroke(C.ink(0.7 * a), 1.3, []);
    let n = 0; const all = [];
    for (let j = 0; j < 7; j++) for (let i = 0; i < 22; i++) { const x = 215 + i * 29, y = 14 + j * 25, dx = (x + 12 - 530) / 330, dy = (y + 10 - 100) / 96; if (dx * dx + dy * dy > 0.92) continue; all.push([x, y, H(n++ + 5) > Y]); }
    p.begin(); for (const [x, y, bad] of all) if (!bad) p.quad(x, y, 24, 20); p.fill(C.ink(0.16 * a)); p.stroke(C.ink(0.6 * a), 1, []);
    p.begin(); for (const [x, y, bad] of all) if (bad) p.quad(x, y, 24, 20); p.fill(C.bad(0.85));
    if (probe >= 0 && all.length) { const [x, y] = all[probe % all.length]; p.begin(); p.quad(x - 2, y - 2, 28, 24); p.stroke(C.acc(1), 1.6, []); }
  }
};
/* draw a rung's face on its plate; false when there is nothing to draw (no such face, or a carrier no line draws) */
export function drawFace(face, rung, p, C, R, D, tm, a, k) {
  const fn = (face === 'design' ? DESIGN : face === 'make' ? MAKE : {})[rung], f = faceAt(R, rung, face);
  if (!fn || f.none || f.fork) return false;
  if (face === 'design') p.dash = [4, 3];
  fn(p, C, R, D, tm, a, k); return true;
}
