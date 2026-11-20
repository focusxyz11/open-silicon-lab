/* The bench's engine: what a visitor does to their own design at the steps the tiny-chip engine only computes once.
   Pure logic, no DOM; tests in tests/bench.test.mjs.

   - The job: say what a piece must answer for a pattern of inputs, checked against the job itself (its spec).
   - Layout: cells kept in the rows the placer gave them, in an order you choose (swap two, and the wires are routed
     again by the tiny-chip engine's maze router); the wire length and the vias are counted from that routing.
     The layout challenge starts from a scrambled placement and asks for wire as short as the placer's own.
   - Masks: every shape of the layout belongs on one mask (the cells' own layers, the metal running up and down,
     the vias, the metal running across); the masks challenge asks which, shape by shape.
   Named apart from the design-rule and timing engines on purpose: this one checks only what is done on the bench. */
import TC from './tinychip.js';
import { build, projectOf, solutionOf } from './design.js';

/* ---- the job: what must it answer? ---- */
/* the patterns a job is checked on, and the answer it wants for the k-th (a clocked job: its test, cycle by cycle,
   from a reset, so the answer at cycle k follows from the cycles before) */
export function jobRows(p) {
  const proj = projectOf(p); if (!proj.f || proj.id === 'core') return [];
  const vs = TC.testVectors(proj); let st = {};
  return vs.map(v => { if (proj.seq) { const r = proj.f(v, st); st = r.next; return { v, want: r.out }; } return { v, want: proj.f(v) }; });
}
/* the patterns the piece challenge asks about, in an order that is not the table's (so reading down the table is no
   help), three of them, starting at a seed */
export function jobAsk(p, seed) {
  const R = jobRows(p); if (!R.length) return [];
  const n = R.length, step = n > 2 ? (n % 3 === 0 ? 5 : 3) : 1, out = [];
  for (let i = 0; i < Math.min(3, n); i++) out.push(((seed | 0) + 1 + i * step) % n);
  return [...new Set(out)];
}
/* is this answer the one the job wants for row k? ans: { output: 0|1 } */
export function jobRight(p, k, ans) { const r = jobRows(p)[k]; return !!r && projectOf(p).outs.every(o => (ans && ans[o] | 0) === r.want[o]); }

/* ---- layout: your order of the cells in their rows ---- */
/* the rows of a placement, each the cells (by index) from left to right */
export function rowsOf(PL) {
  const rows = Array.from({ length: PL.rows }, () => []);
  Object.entries(PL.pos).forEach(([i, p]) => rows[p.r].push(+i));
  rows.forEach(r => r.sort((a, b) => PL.pos[a].x - PL.pos[b].x));
  return rows;
}
const widthOf = (M, i) => TC.LIB[M.cells[i].type][1];
const fits = (M, row, W) => row.reduce((s, i) => s + widthOf(M, i), 0) <= W;
/* a placement from rows: each row's cells spread evenly across it, as the tiny-chip placer packs them; the same
   tile (its width, height and pins) as the placer's own (base), so the router sees the same tile */
export function placeRows(M, rows, base) {
  const W = base.W, TR = base.TR, pos = {};
  rows.forEach((L, k) => {
    const used = L.reduce((s, i) => s + widthOf(M, i), 0), gap = (W - used) / (L.length + 1); let x = gap;
    L.forEach(i => { pos[i] = { x: Math.round(x), r: k, w: widthOf(M, i) }; x += widthOf(M, i) + gap; });
    let cur = 0; L.forEach(i => { if (pos[i].x < cur) pos[i].x = cur; cur = pos[i].x + pos[i].w; });
    if (cur > W) { let e = W; for (let j = L.length - 1; j >= 0; j--) { const p = pos[L[j]]; if (p.x + p.w > e) p.x = e - p.w; e = p.x; } }
  });
  const pinXY = (ci, pin) => { const p = pos[ci], c = M.cells[ci], w = p.w, y = p.r * TR + 2; let dx;
    if (pin === 'o') dx = w - 1; else { const n = c.ins.length; dx = n === 1 ? 0 : (pin === 0 ? 0 : Math.min(w - 2, Math.max(1, Math.floor((w - 1) / 2)))); }
    return { x: 2 + p.x + dx, y }; };
  const netPins = () => { const P = {}, add = (n, pt, k) => { (P[n] = P[n] || []).push(Object.assign({ k }, pt)); };
    M.inputs.forEach(p => add(p.net, base.ioIn[p.net], 'd'));
    M.cells.forEach((c, ci) => { add(c.out, pinXY(ci, 'o'), 'd'); c.ins.forEach((n, k) => { if (k === 1 && c.ins[0] === n) return; add(n, pinXY(ci, k), 's'); }); });
    Object.values(base.ioOut).forEach(o => add(o.net, { x: o.x, y: o.y }, 's'));
    return P; };
  return { pos, rows: rows.length, W, H: base.H, GW: base.GW, TR, ioIn: base.ioIn, ioOut: base.ioOut, netPins };
}
/* route a placement and count its wire (steps of one track) and its vias (a change of metal) */
export function measure(M, rows, base) {
  const PL = placeRows(M, rows, base), RT = TC.route(PL);
  return { PL, RT, wl: RT.wl, vias: RT.vias, failed: RT.failed.length };
}
/* swap two cells (by index), across rows if both rows still fit; null if they do not */
export function swapCells(M, rows, a, b, W) {
  if (a === b) return null;
  const R = rows.map(r => r.slice()), ra = R.findIndex(r => r.includes(a)), rb = R.findIndex(r => r.includes(b)); if (ra < 0 || rb < 0) return null;
  const ia = R[ra].indexOf(a), ib = R[rb].indexOf(b); R[ra][ia] = b; R[rb][ib] = a;
  return fits(M, R[ra], W) && fits(M, R[rb], W) ? R : null;
}
/* move a cell to the end of another row, if it fits there */
export function moveCell(M, rows, a, r, W) {
  const R = rows.map(x => x.filter(i => i !== a)); if (!R[r]) return null; R[r].push(a);
  return fits(M, R[r], W) ? R : null;
}
/* a placement as it might come before anyone thinks about it: the cells dealt into the rows in a fixed shuffle */
export function scramble(M, base, seed) {
  let s = (seed | 0) || 3; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const ids = M.cells.map((_, i) => i); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  const rows = Array.from({ length: base.rows }, () => []); let r = 0;
  ids.forEach(i => { let tries = 0; while (!fits(M, rows[r].concat(i), base.W) && tries < base.rows) { r = (r + 1) % base.rows; tries++; } rows[r].push(i); r = (r + 1) % base.rows; });
  return rows;
}
/* a placement is a list of rows holding each cell once */
export const validRows = (M, rows, base) => Array.isArray(rows) && rows.length === base.rows && rows.every(r => Array.isArray(r) && fits(M, r, base.W)) &&
  rows.flat().length === M.cells.length && new Set(rows.flat()).size === M.cells.length && rows.flat().every(i => Number.isInteger(i) && i >= 0 && i < M.cells.length);

/* ---- the layout challenge: the 2-bit adder's cells, scrambled; join them with wire as short as the placer's ---- */
export const FLOOR = { p: 'add2', seed: 1, slack: 1.05 };
export const floorDesign = () => build({ p: FLOOR.p, code: solutionOf(FLOOR.p) });
export function floorStart(B) { return scramble(B.M, B.PL, FLOOR.seed); }
/* the goal: no longer than the placer's own wire, give or take a step in twenty */
export const floorGoal = B => Math.round(B.RT.wl * FLOOR.slack);
export function floorCheck(B, rows) { const m = measure(B.M, rows, B.PL), goal = floorGoal(B); return { wl: m.wl, vias: m.vias, goal, failed: m.failed, ok: !m.failed && m.wl <= goal, m }; }

/* ---- masks: which mask a shape of the layout is printed from ---- */
export const MASKS = ['cells', 'm1', 'via', 'm2'];
/* every shape your layout draws: each cell, each straight run of one metal, each via (from the placement and the
   routing; layer 1 of the router runs up and down, layer 0 across) */
export function maskShapes(PL, RT) {
  const out = [], GW = PL.GW;
  Object.entries(PL.pos).forEach(([i, p]) => out.push({ id: 'c' + i, mask: 'cells', cell: +i, x: 2 + p.x, y: p.r * PL.TR + 1, w: p.w, h: 3 }));
  const xy = a => { const l = a % 2, c = (a - l) / 2, x = c % GW; return { l, x, y: (c - x) / GW }; };
  let n = 0;
  Object.values(RT.paths).forEach(segs => segs.forEach(path => {
    let run = null;
    const flush = () => { if (run && (run.a.x !== run.b.x || run.a.y !== run.b.y)) out.push({ id: 'w' + n++, mask: run.l === 1 ? 'm1' : 'm2', x1: run.a.x, y1: run.a.y, x2: run.b.x, y2: run.b.y }); run = null; };
    for (let k = 1; k < path.length; k++) {
      const a = xy(path[k - 1]), b = xy(path[k]);
      if (a.l !== b.l) { flush(); out.push({ id: 'v' + n++, mask: 'via', x: a.x, y: a.y }); continue; }
      if (run && run.l === a.l) run.b = b; else { flush(); run = { l: a.l, a, b }; }
    }
    flush();
  }));
  return out;
}
/* the shapes the challenge asks about, in turn: one of each mask first, then mixed, never the same twice running */
export function maskAsk(shapes, k) {
  const by = MASKS.map(m => shapes.filter(s => s.mask === m)).filter(L => L.length);
  if (!by.length) return null;
  const order = [0, 2, 1, 3, 1, 0, 3, 2], g = by[order[k % order.length] % by.length], L = g;
  return L[(k * 7 + 3) % L.length];
}
export const maskRight = (shape, mask) => !!shape && shape.mask === mask;
/* won after five right answers in a row */
export const MASK_STREAK = 5;
