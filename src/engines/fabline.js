/* A fab you run: a wafer fab as a re-entrant line. Pure logic, no DOM; tests in tests/fabline.test.mjs.

   Three things a fab does that a straight assembly line does not, and that this model keeps true:
   1. Wafers go round. Every layer sends a lot back through the same tool groups (deposit, print,
      etch, clean, polish, measure, and for the first layers implant and anneal), so a chip with 80
      layers visits the scanners 80 times.
   2. One group sets the pace. Output can never exceed what the busiest group can do; adding tools
      anywhere else changes nothing.
   3. Full is slow. Lots wait in queues, and the wait grows without bound as a group nears 100% busy.

   The steady-state numbers come from standard factory physics (Hopp and Spearman): utilization
   u = arrivals × visits × time per visit ÷ (tools × availability), and the wait in a queue of m tools
   from the Kingman–Sakasegawa approximation
       Wq ≈ (ca² + cs²) / 2 · u^(√(2(m+1)) − 1) / (m (1 − u)) · te.
   Times per visit are illustrative, chosen so a line loaded to about 85% takes about 1 to 1.5 days
   per layer, as the industry reports (fact fab-cycle-time); tools are up about 90% of the time, as
   fabs expect. A lot is 25 wafers.

   step() moves individual lots through the same line, for drawing; the numbers shown to a reader come
   from summary(). */

export const LOT = 25;   /* wafers per lot (one FOUP) */

/* Tool groups, in the order a lot meets them on each layer. hours: raw time per lot per visit;
   tools: how many in the starting line; avail: share of time a tool is up (the rest is maintenance);
   share: the share of layers that visit the group. Implant and anneal shape the transistors, so only
   the first quarter of the layers (front end) needs them; the rest are wiring (back end). */
export const GROUPS = [
  { id: 'depo', hours: 2.4, tools: 4, avail: 0.9, share: 1 },      /* deposit a film */
  { id: 'litho', hours: 2.0, tools: 3, avail: 0.88, share: 1 },    /* coat, expose in the scanner, develop */
  { id: 'etch', hours: 2.0, tools: 4, avail: 0.9, share: 1 },      /* cut the pattern into the film */
  { id: 'clean', hours: 1.2, tools: 2, avail: 0.95, share: 1 },    /* strip the resist, wash */
  { id: 'implant', hours: 1.5, tools: 1, avail: 0.9, share: 0.25 },/* fire dopant ions (front end only) */
  { id: 'anneal', hours: 1.5, tools: 1, avail: 0.95, share: 0.25 },/* heat to switch the dopants on */
  { id: 'cmp', hours: 1.5, tools: 3, avail: 0.92, share: 1 },      /* polish flat */
  { id: 'metro', hours: 1.0, tools: 2, avail: 0.95, share: 1 }     /* measure and inspect */
];
/* Does layer i (0-based) of n visit group g? Front-end groups take the first layers. */
export const visits = (g, i, n) => g.share >= 1 || i < Math.round(g.share * n);

/* Products: layers sets how many times a lot goes round. Layer counts follow ECIA's figures by node. */
export const PRODUCTS = {
  mature: { layers: 45 },   /* a 28 nm-class chip: 40 to 50 mask layers */
  phone: { layers: 80 },    /* a 7 nm-class chip: 80 to 85 layers */
  ai: { layers: 100 }       /* a 5 nm-class chip and beyond: about 100 layers */
};

/* Squared coefficients of variation of arrivals and of process times. Real lines are bumpy: lots
   arrive in clumps, tools break, recipes differ, so both are above the 1 of a purely random process. */
const VAR = { ca2: 1.5, cs2: 1.5 };
/* Hours per layer that are neither waiting at a tool nor processing: moving between bays, holds,
   waiting for a measurement result. */
export const MOVE = 1.0;

export function line(tools = {}) {
  return GROUPS.map(g => Object.assign({}, g, { tools: Math.max(1, tools[g.id] ?? g.tools) }));
}

/* Lots one group could finish per day, counting every visit a lot makes to it. */
const groupCapacity = (g, layers) => g.tools * g.avail * 24 / (g.hours * Math.max(1, Math.round(g.share * layers)));

/* The most lots per day the line can start and finish: the bottleneck's capacity. */
export function capacity(L, layers) {
  return Math.min(...L.map(g => groupCapacity(g, layers)));
}
export function bottleneck(L, layers) {
  let best = null;
  for (const g of L) { const c = groupCapacity(g, layers); if (!best || c < best.c) best = { id: g.id, c }; }
  return best.id;
}

/* Waiting time in hours at a group of m tools with utilization u and effective process time te. */
export function wait(u, m, te, v = VAR) {
  if (u >= 1) return Infinity;
  return (v.ca2 + v.cs2) / 2 * Math.pow(u, Math.sqrt(2 * (m + 1)) - 1) / (m * (1 - u)) * te;
}

/* Steady state for `starts` lots per day. */
export function summary(L, layers, starts) {
  const cap = capacity(L, layers);
  const groups = L.map(g => {
    const te = g.hours / g.avail;                       /* availability stretches each visit */
    const n = Math.round(g.share * layers);
    const u = starts * n * g.hours / (g.tools * g.avail * 24);
    const wq = wait(u, g.tools, te);
    return { id: g.id, u, wq, te, n, total: n * (wq + te) };
  });
  const raw = L.reduce((s, g) => s + Math.round(g.share * layers) * g.hours, 0) / 24;   /* days, never waiting */
  const days = (groups.reduce((s, g) => s + g.total, 0) + layers * MOVE) / 24;
  const stable = starts < cap;
  return {
    starts, capacity: cap, load: starts / cap, bottleneck: bottleneck(L, layers),
    groups, raw, days: stable ? days : Infinity, daysPerLayer: stable ? days / layers : Infinity,
    xFactor: stable ? days / raw : Infinity,
    wip: stable ? starts * days : Infinity,              /* Little's law: lots in the fab */
    outWafers: Math.min(starts, cap) * LOT               /* wafers a day out of the fab, at steady state */
  };
}

/* Cycle time across loads, for the curve: [{ load, days }]. */
export function curve(L, layers, points = 40, maxLoad = 0.98) {
  const cap = capacity(L, layers), out = [];
  for (let i = 1; i <= points; i++) { const load = maxLoad * i / points; out.push({ load, days: summary(L, layers, load * cap).days }); }
  return out;
}

/* ---- individual lots, for drawing ---- */
/* A small seeded random number generator, so a drawing can be replayed. */
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

export function startState(L, seed = 7) {
  return { t: 0, next: 0, lots: [], done: [], tools: L.map(g => Array.from({ length: g.tools }, () => null)), queues: L.map(() => []), rnd: rng(seed), id: 0 };
}
/* Advance by dt hours. Lots arrive at `starts` per day (randomly spaced), visit each group once per
   layer in order, and wait in a queue when every tool is busy. Process times vary (exponential), and
   tools are down part of the time on average through a longer process time. */
export function step(S, L, layers, starts, dt) {
  const r = S.rnd, expo = m => -Math.log(1 - r()) * m;
  S.t += dt;
  if (starts > 0) { if (!S.next) S.next = S.t + expo(24 / starts); while (S.t >= S.next) { const lot = { id: ++S.id, layer: 0, g: 0, born: S.next }; S.lots.push(lot); S.queues[0].push(lot); S.next += expo(24 / starts); } }
  L.forEach((g, gi) => {
    const T = S.tools[gi];
    for (let k = 0; k < T.length; k++) {
      const job = T[k];
      if (job && S.t >= job.until) {
        T[k] = null; const lot = job.lot;
        do { lot.g++; if (lot.g >= L.length) { lot.g = 0; lot.layer++; } } while (lot.layer < layers && !visits(L[lot.g], lot.layer, layers));
        if (lot.layer >= layers) { lot.out = S.t; S.done.push(lot); S.lots.splice(S.lots.indexOf(lot), 1); if (S.done.length > 400) S.done.shift(); }
        else S.queues[lot.g].push(lot);
      }
      if (!T[k] && S.queues[gi].length) { const lot = S.queues[gi].shift(); T[k] = { lot, until: S.t + expo(g.hours / g.avail) }; }
    }
  });
  return S;
}
