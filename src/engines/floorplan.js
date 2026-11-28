/* The floorplan and its heat (#507, docs/prototypes/studio-fab/GUIDE.md §2, "Floorplan under heat"): where the units
   that compute and the memory sit on your die, from the recipe's shape and where it computes, and what that does to
   the hot spot and to the trip a value makes to memory (Geometry: packing parts close to communicate, spreading them
   apart to stay cool). Pure; tests in tests/floorplan.test.mjs. Drawn by the studio (src/v2/studio/plan.js), which
   computes nothing of its own.

   The die is a sheet of 1000 x 1000 units, 20 mm across (a 2 cm die, the atlas's size for a chip). Its units by shape:
   few (one, four or eight in a grid with wide gaps), grid (a square of many, close), stack (layers one over another:
   a few sheets drawn offset, each eight units' worth of logic), swarm (a field of tiny ones, at most 20 x 20 drawn). The
   memory by where: far (off the chip, at its right), near (a band along the bottom), in (a piece inside every unit),
   flow (columns between the units).

   The heat is an idea drawn, not a measurement: the die burns one budget of power (the same whatever the arrangement),
   spread over the units' area; stacked layers pile their power on one footprint; memory on the chip (near, in, flow)
   adds the share of the energy spent moving values (MEM_SHARE) where it sits, memory off it takes that heat away. The
   steady temperature is solved on a 22 x 22 grid (heat spreads sideways through the silicon, and leaves through the
   lid into the cooler: SPREAD, LID), and the scale is set so today's computer (four units, memory far) has its hot spot
   at T_REF over the cooler's T_AIR. The trip is the mean distance from a unit's middle to the nearest memory, in mm, on
   the die (and, off it, to the memory beside it). */

export const DIE = 1000, DIE_MM = 20, GRID = 22;
export const T_AIR = 45, T_REF = 85;                  // degrees: the cooler's side, and today's hot spot (an idea drawn)
export const SPREAD = 1, LID = 0.25;                 // sideways spread against the leak through the lid, per grid cell
export const GRID_REF = 0.6;                          // today's hot spot on the drawn grid
export const MEM_SHARE = 0.25;                        // the share of the power memory on the chip adds where it sits
export const PER_LAYER = 8;                           // a stacked layer holds eight units' worth of logic
const INNER = { x: 60, y: 60, w: 880, h: 880 };
import * as A from './arch.js';

/* the units' grid for a shape and a count: columns and rows drawn */
function gridOf(shape, n) {
  if (shape === 'few') return n <= 1 ? [1, 1] : n <= 4 ? [2, 2] : [4, 2];
  if (shape === 'grid') { const c = Math.min(16, Math.round(Math.sqrt(n))); return [c, c]; }
  if (shape === 'swarm') { const c = Math.min(20, Math.round(Math.sqrt(n))); return [c, c]; }
  return [1, 1];
}

/* the floorplan of a recipe with its fine settings: { shape, where, n (units), layers, units [{ i, x, y, w, h, back,
   mem }], mem [{ x, y, w, h }], memKind } on the die's sheet */
export function floorplanOf(recipe, fine) {
  const g = A.normal(recipe || A.TODAY), F = fine || {};
  const shape = A.CARRY.shape[g.shape] ? g.shape : 'few', where = A.CARRY.where[g.where] ? g.where : 'far';
  const n = A.CARRY.shape[shape].units[F.ui != null ? F.ui : 1] || 1;
  let R = INNER; const mem = [];
  if (where === 'far') mem.push({ x: DIE + 70, y: 300, w: 190, h: 400 });
  if (where === 'near') { mem.push({ x: R.x, y: R.y + R.h - 120, w: R.w, h: 120 }); R = { x: R.x, y: R.y, w: R.w, h: R.h - 150 }; }
  const units = [], one = shape === 'stack' || gridOf(shape, n)[0] === 1;
  /* flowing memory beside a single unit or a stack: one column at its right */
  if (where === 'flow' && one) { mem.push({ x: R.x + R.w - 60, y: R.y, w: 60, h: R.h }); R = { x: R.x, y: R.y, w: R.w - 90, h: R.h }; }
  let layers = 1;
  if (shape === 'stack') {
    layers = Math.max(1, Math.round(n / PER_LAYER));
    const k = Math.min(5, layers), off = 26, w = R.w - off * (k - 1), h = R.h - off * (k - 1);
    for (let i = 0; i < k; i++) units.push({ i, x: R.x + off * i, y: R.y + off * (k - 1 - i), w, h, back: i > 0 });
  } else {
    const [c, r] = gridOf(shape, n), gap = shape === 'few' ? 26 : shape === 'grid' ? Math.max(3, 40 / c) : 4;
    const flow = where === 'flow' && c > 1, mw = flow ? Math.min(60, R.w / c * 0.22) : 0;
    const cw = (R.w - gap * (c - 1) - mw * (c - 1)) / c, rh = (R.h - gap * (r - 1)) / r;
    for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) units.push({ i: j * c + i, x: R.x + i * (cw + gap + mw), y: R.y + j * (rh + gap), w: cw, h: rh, back: false });
    if (flow) for (let i = 1; i < c; i++) mem.push({ x: R.x + i * (cw + gap + mw) - mw - gap / 2, y: R.y, w: mw, h: R.h });
  }
  if (where === 'in') units.forEach(u => { const m = { x: u.x + u.w * 0.74, y: u.y + u.h * 0.06, w: u.w * 0.2, h: u.h * 0.88 }; u.mem = m; if (!u.back) mem.push(m); });
  return { shape, where, n, layers, units, mem, memKind: where };
}

/* the share of a rectangle inside a grid cell */
const overlap = (r, x0, y0, s) => Math.max(0, Math.min(r.x + r.w, x0 + s) - Math.max(r.x, x0)) * Math.max(0, Math.min(r.y + r.h, y0 + s) - Math.max(r.y, y0)) / (s * s);

/* the power on each grid cell, its total one (the die's budget): the units' logic, piled by layers, and memory on the
   chip adding its share where it sits */
function powerOf(fp) {
  const N = GRID, s = DIE / N, q = new Float64Array(N * N), front = fp.units.filter(u => !u.back);
  const logic = front.reduce((a, u) => a + (u.mem ? u.w * 0.72 * u.h : u.w * u.h), 0), onMem = fp.where !== 'far';
  const memArea = fp.mem.filter(m => m.x < DIE).reduce((a, m) => a + m.w * m.h, 0);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    let v = 0;
    for (const u of front) { const r = u.mem ? { x: u.x, y: u.y, w: u.w * 0.72, h: u.h } : u; v += overlap(r, i * s, j * s, s) * s * s / logic * fp.layers; }
    if (onMem && memArea) for (const m of fp.mem) if (m.x < DIE) v += overlap(m, i * s, j * s, s) * s * s / memArea * MEM_SHARE;
    q[j * N + i] = v;
  }
  return q;
}
/* the steady temperature rise over the grid for a power map (Jacobi: each cell the mean of its neighbours and what its
   own power holds against the lid's leak; the die's edges let no heat out sideways) */
function solve(q) {
  const N = GRID, T = new Float64Array(N * N), T2 = new Float64Array(N * N);
  for (let it = 0; it < 900; it++) {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i, l = i > 0 ? T[k - 1] : T[k], r = i < N - 1 ? T[k + 1] : T[k], u = j > 0 ? T[k - N] : T[k], d = j < N - 1 ? T[k + N] : T[k];
      T2[k] = (SPREAD * (l + r + u + d) + q[k]) / (4 * SPREAD + LID);
    }
    T.set(T2);
  }
  return T;
}
const PEAK0 = (() => { const T = solve(powerOf(floorplanOf(A.TODAY, { ui: 1 }))); return Math.max(...T); })();

/* the trip: the mean distance from each unit's middle to the nearest memory, in mm */
function tripOf(fp) {
  const front = fp.units.filter(u => !u.back);
  if (!fp.mem.length || !front.length) return 0;
  const d = u => { if (u.mem) return Math.hypot(u.mem.x + u.mem.w / 2 - (u.x + u.w * 0.36), 0);
    const cx = u.x + u.w / 2, cy = u.y + u.h / 2;
    return Math.min(...fp.mem.map(m => Math.hypot(Math.max(m.x - cx, 0, cx - m.x - m.w), Math.max(m.y - cy, 0, cy - m.y - m.h)))); };
  return front.reduce((a, u) => a + d(u), 0) / front.length * DIE_MM / DIE;
}

/* the heat of a floorplan: the grid (each cell's rise against today's hot spot, today's hot spot at GRID_REF, so one
   colour means one heat whatever the arrangement), the hot spot in degrees and where it is, the trip in mm, and the
   marks of how true each is */
export function heatOf(fp) {
  const T = solve(powerOf(fp)), peak = Math.max(...T), N = GRID, at = T.indexOf(peak);
  return {
    grid: Array.from(T, v => GRID_REF * v / PEAK0), hottest: T_AIR + (T_REF - T_AIR) * peak / PEAK0, at: { i: at % N, j: Math.floor(at / N) },
    trip: tripOf(fp), fid: { hottest: { f: 'idea', by: 'floorplan' }, trip: { f: 'idea', by: 'floorplan' } }
  };
}

/* ---- what an agent proposes (#510): it tries all sixteen arrangements and proposes the one both cooler and shorter
   than yours, by the most; null when none is both. It changes nothing: the person takes it or not ---- */
export function arrangementsOf(recipe, fine) {
  const g = A.normal(recipe || A.TODAY);
  return Object.keys(A.CARRY.shape).flatMap(shape => Object.keys(A.CARRY.where).map(where => {
    const H = heatOf(floorplanOf(Object.assign({}, g, { shape, where }), fine)); return { shape, where, hottest: H.hottest, trip: H.trip };
  }));
}
export function proposeArrangement(recipe, fine) {
  const g = A.normal(recipe || A.TODAY), mine = heatOf(floorplanOf(g, fine)), all = arrangementsOf(g, fine);
  const better = all.filter(a => (a.shape !== g.shape || a.where !== g.where) && a.hottest < mine.hottest - 0.5 && a.trip < mine.trip - 0.05);
  if (!better.length) return { yours: { shape: g.shape, where: g.where, hottest: mine.hottest, trip: mine.trip }, proposed: null };
  const gain = a => (mine.hottest - a.hottest) / (T_REF - T_AIR) + (mine.trip - a.trip) / Math.max(mine.trip, 1e-9);
  const best = better.reduce((b, a) => (gain(a) > gain(b) ? a : b));
  return { yours: { shape: g.shape, where: g.where, hottest: mine.hottest, trip: mine.trip }, proposed: best, cooler: mine.hottest - best.hottest, shorter: mine.trip - best.trip };
}
