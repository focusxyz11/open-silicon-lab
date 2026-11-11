/* The weave's logic, with no DOM, so it is tested (tests/weave.test.mjs).
   The zoom: each depth is a 1000 x 1000 scene and the next depth sits in its portal square. z runs from 0
   (the whole first scene) to N - 1 (the last); z = i + f means depth i with the camera a fraction f of the
   way into its portal, shrinking the view geometrically, so the dive never cuts.
   A dive happens in one world at a time (a data centre, a phone, a car): N and IDS are that world's way down,
   and change when setWorld is called. Everything that takes a depth index means an index in that way down.
   The journey is a world of another kind: a line. Its depths are stations side by side, and z = i + f means
   the camera a fraction f of the way along from station i to station i + 1 (lineFrames). */
import { DEPTHS, WORLDS, SHARED, THREADS, STOPS } from '../data/weave.js';

export let WORLD = WORLDS[0].id;
export let IDS = WORLDS[0].depths;
export let N = IDS.length;
export const worldOf = id => WORLDS.find(w => w.id === id) || null;
export function setWorld(id) { const w = worldOf(id) || WORLDS[0]; WORLD = w.id; IDS = w.depths; N = IDS.length; return WORLD; }
/* is this world (by default, the current one) a line rather than a dive? */
export const isLine = id => !!(worldOf(id || WORLD) || {}).line;
/* A few depths change with your chip: on the wafer, the chip the dive follows is as large as your chip.
   reshape(id, { portal, m }) overrides a depth's data until it is called again. */
const SHAPE = {};
export function reshape(id, o) { SHAPE[id] = o ? Object.assign({}, DEPTHS[id], o) : undefined; }
const D = i => SHAPE[IDS[i]] || DEPTHS[IDS[i]];
export const clampZ = z => Math.max(0, Math.min(N - 1, z));
/* Where the same view would be in another world. A depth both share keeps its place. Above that, the
   steps are matched counting up from the shared depths (a chip is a chip, a board is a board), and the
   top of one world is the top of another. */
const own = w => w.depths.filter(d => !SHARED.includes(d)).length;
export function zIn(id, z) {
  const to = worldOf(id) || WORLDS[0], i = Math.round(clampZ(z)), j = to.depths.indexOf(IDS[i]);
  if (j >= 0) return j;
  if (i === 0 || to.line || isLine()) return 0;
  return Math.max(0, own(to) - (own(worldOf(WORLD)) - i));
}
/* The camera inside depth i at fraction f: the square of the 1000-space in view. f = 0 is the whole scene,
   f = 1 is exactly the portal. */
export function cam(i, f) {
  const p = i < N && D(i) && D(i).portal;
  if (!p) return { ox: 0, oy: 0, size: 1000 };
  const r = p[2] / 1000, k = Math.pow(r, f);
  return { ox: (p[0] / (1 - r)) * (1 - k), oy: (p[1] / (1 - r)) * (1 - k), size: 1000 * k };
}
/* On the line: the stations side by side, a small gap between them, the camera sliding along. Returns the
   station in view and its neighbours, each a transform as in frames(). */
export const GAP = 0.06;
export function lineFrames(z, B, cx, cy) {
  const zz = clampZ(z), i = Math.min(N - 1, Math.floor(zz)), f = zz - i, s = B / 1000, step = B * (1 + GAP);
  const at = k => ({ s, tx: cx - B / 2 + (k - zz) * step, ty: cy - B / 2 });
  const out = { i, f, cur: at(i), line: true };
  if (i + 1 < N) out.next = at(i + 1);
  if (i > 0) out.prev = at(i - 1);
  if (i + 2 < N) out.after = at(i + 2);
  return out;
}
/* Where to draw the current, next and previous depths for zoom z in a box of side B centred at (cx, cy).
   Each is a transform: screen = t + s * scene. */
export function frames(z, B, cx, cy) {
  const i = Math.min(N - 1, Math.floor(clampZ(z))), f = Math.max(0, Math.min(1, clampZ(z) - i));
  const v = cam(i, f), s = B / v.size, tx = cx - B / 2 - v.ox * s, ty = cy - B / 2 - v.oy * s;
  const out = { i, f, cur: { s, tx, ty } };
  const p = D(i).portal;
  if (p && i + 1 < N) out.next = { s: (s * p[2]) / 1000, tx: tx + p[0] * s, ty: ty + p[1] * s };
  if (i > 0) { const q = D(i - 1).portal, s0 = (s * 1000) / q[2]; out.prev = { s: s0, tx: tx - q[0] * s0, ty: ty - q[1] * s0 }; }
  return out;
}
/* Metres across the view at zoom z, between the depths' sizes on a log scale. */
export function sizeAt(z) {
  const i = Math.max(0, Math.min(N - 2, Math.floor(z))), f = Math.max(0, Math.min(1, z - i));
  return Math.pow(10, Math.log10(D(i).m) + f * (Math.log10(D(i + 1).m) - Math.log10(D(i).m)));
}
/* A size as [number, unit], two significant figures. */
export function sizeParts(m) {
  const u = m >= 1000 ? [m / 1000, 'km'] : m >= 1 ? [m, 'm'] : m >= 0.01 ? [m * 100, 'cm'] : m >= 0.001 ? [m * 1000, 'mm'] : m >= 1e-6 ? [m * 1e6, 'µm'] : [m * 1e9, 'nm'];
  return [Number(u[0].toPrecision(2)), u[1]];
}

/* ---- threads ---- */
export const threadOf = id => THREADS.find(t => t.id === id) || null;
export const stopKey = (th, depthIndex) => th + '.' + IDS[depthIndex];
export const stop = (th, depthIndex) => STOPS[stopKey(th, depthIndex)] || null;
/* The depths (as indexes) where a thread has a form, top to bottom. */
export const threadDepths = th => IDS.map((_, d) => d).filter(d => stop(th, d));
/* The threads that cross a depth. */
export const crossing = d => THREADS.filter(t => stop(t.id, d)).map(t => t.id);
/* The thread's next stop below or above a depth, or null. */
export const below = (th, d) => threadDepths(th).find(x => x > d) ?? null;
export const above = (th, d) => threadDepths(th).filter(x => x < d).pop() ?? null;
export function nearest(th, d) { let best = null; for (const x of threadDepths(th)) if (best == null || Math.abs(x - d) < Math.abs(best - d)) best = x; return best; }

/* A core question is never listed with the others. It appears on its own once its moment has come: when
   the visitor has followed its thread through at least two depths, in any world. seen = the ids of the
   depths where it was met (indexes saved by an earlier version are not counted). */
export const rootShown = seen => new Set((seen || []).filter(x => typeof x === 'string')).size >= 2;
