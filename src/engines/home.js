/* The map's engine (the first page, src/v2/home.js): what is joined to what, what a question runs through, and the
   small simulations at the top of the page. Pure functions over src/data/home.js, so the tests can check them and the
   view only draws. */
import { STATIONS, LINES, THREADS, WAYS, TOYS } from '../data/home.js';
import { TWINS } from '../data/atlas.js';
import { TRENDS } from '../data/trends.js';

export const byId = Object.fromEntries(STATIONS.map(s => [s.id, s]));

/* ---- what can be played at each station: every challenge whose home view is the station's address, or one of its
   other views; a challenge played at a place of the island, with no view of its own, belongs to the station that
   holds that place. Each challenge is at exactly one station. ---- */
export function challengesAt(challenges, doHome) {
  const out = Object.fromEntries(STATIONS.map(s => [s.id, []]));
  for (const c of challenges) {
    const h = doHome(c);
    const s = h ? STATIONS.find(x => x.href === h || x.also.includes(h)) : STATIONS.find(x => x.places.includes(c.place));
    if (s) out[s.id].push(c.id);
  }
  return out;
}

/* ---- joins ---- */
/* the stations a station is joined to, either way round */
export const linksOf = id => [...new Set([...(byId[id] ? byId[id].links : []), ...STATIONS.filter(s => s.links.includes(id)).map(s => s.id)])].filter(x => x !== id && byId[x]);
/* one level seen three ways (the atlas's TWINS): as used (a level of the dive), as designed (a studio station), as
   made (factory steps). The stations that share a level with this one, or null where it has no twins */
export function twinsOf(id) {
  const T = TWINS.find(x => x.used === id || x.designed === id || x.made.includes(id));
  if (!T) return null;
  return { level: T.used, ids: [T.used, T.designed, ...T.made].filter(x => x && x !== id && byId[x]) };
}

/* ---- the lines, as boxes of wire, and a question's thread as a dashed path across the map ---- */
export function box(run, w) {
  const [x1, y1, x2, y2] = run, l = Math.min(x1, x2), r = Math.max(x1, x2), t = Math.min(y1, y2), b = Math.max(y1, y2);
  return { x: l - w / 2, y: t - w / 2, w: r - l + w, h: b - t + w, across: y1 === y2 };
}
export const wires = () => LINES.flatMap(L => L.runs.map(r => Object.assign(box(r, L.w), { line: L.id })));
export const threadOf = id => THREADS.find(x => x.id === id) || null;
export const threadAt = station => THREADS.find(x => x.home === station) || null;
/* a thread walks from station to station: across first, then up or down */
export function threadRuns(id, w = 3) {
  const T = threadOf(id); if (!T) return [];
  const P = T.path.map(s => byId[s]), out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1];
    if (a.x !== b.x) out.push(box([a.x, a.y, b.x, a.y], w));
    if (a.y !== b.y) out.push(box([b.x, a.y, b.x, b.y], w));
  }
  return out;
}
export const nextThread = id => { const i = THREADS.findIndex(x => x.id === id); return THREADS[(i + 1) % THREADS.length].id; };

/* ---- what stays bright: a way in lights its lines and stations; a thread lights the stations it runs through ---- */
export function lit(way, thread) {
  const W = WAYS.find(x => x.id === way), T = threadOf(thread);
  return {
    line: id => (T ? false : !W || W.lines.includes(id)),
    station: id => (T ? T.path.includes(id) : !W || W.stations.includes(id))
  };
}

/* ---- the wafer: dust falls on a round wafer cut into square chips; a chip with a speck on it fails. The same dust
   ruins more of the wafer when the chips are bigger, which is why big chips cost so much (a model: the dust is
   random, and every speck kills the chip it lands on) ---- */
function rng(seed) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let r = Math.imul(s ^ (s >>> 15), 1 | s); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
export function wafer(size, seed, o = TOYS.wafer) {
  const cell = o.sizes[size], R = o.radius, C = R + 6, n = Math.floor(2 * R / cell), off = C - n * cell / 2, rnd = rng(seed);
  const dust = Array.from({ length: o.dust }, () => { const r = R * Math.sqrt(rnd()), a = 2 * Math.PI * rnd(); return { x: Math.round(C + r * Math.cos(a)), y: Math.round(C + r * Math.sin(a)) }; });
  const inside = (x, y) => (x - C) ** 2 + (y - C) ** 2 <= R * R, dies = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = off + j * cell, y = off + i * cell;
    if (!(inside(x, y) && inside(x + cell, y) && inside(x, y + cell) && inside(x + cell, y + cell))) continue;
    dies.push({ x: x + 1, y: y + 1, s: cell - 2, bad: dust.some(p => p.x >= x && p.x < x + cell && p.y >= y && p.y < y + cell) });
  }
  return { dies, dust, side: 2 * C };
}
/* how many of the first n chips tested work */
export function yieldOf(dies, n = dies.length) {
  const done = Math.min(n, dies.length), good = dies.slice(0, done).filter(d => !d.bad).length;
  return { good, done, total: dies.length, pct: done ? Math.round(100 * good / done) : null };
}

/* ---- a gate: two inputs, one rule ---- */
const RULES = { NAND: (a, b) => 1 - (a & b), AND: (a, b) => a & b, OR: (a, b) => a | b, XOR: (a, b) => a ^ b };
export const gate = (name, a, b) => RULES[name](a & 1, b & 1);

/* ---- shrinking the switch: the most transistors on one processor in a year, from the trend data (thousands) ---- */
export function shrinkAt(year) {
  const pts = TRENDS.transistors.filter(([y]) => Math.floor(y) === year);
  return pts.length ? Math.max(...pts.map(p => p[1])) * 1000 : null;
}

/* ---- packing cores: closer means a message has less far to go, and heat less room to leave. A trade drawn in
   proportion to the gap, not measured ---- */
export function packAt(i) {
  const gap = TOYS.pack.gaps[i];
  return { gap, talk: Math.round(100 * (gap + 2) / 20), heat: Math.round(100 * 4 / (gap + 2)) };
}
