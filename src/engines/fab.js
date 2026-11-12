/* A fab you run: a wafer fab as a re-entrant line. Pure logic, no DOM; tests in tests/weave.test.mjs.
   From the earlier site (src/engines/fabline.js there), without its lot-by-lot drawing.

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

   The numbers shown to a reader come from summary(). Here your chip's layers (src/engines/chip.js) set
   how many times a wafer goes round, and how full you run the fab sets how long it waits. */

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
/* With AI in scheduling, inspection and maintenance, flow is modeled as smoother: fewer surprises, so
   shorter queues. Fabs are adding such tools (fact ai-in-fabs on the earlier site); the size of the effect is illustrative. */
const VAR_AI = { ca2: 1.0, cs2: 1.0 };

/* How the finest layers are printed. Without EUV, a fine layer needs a second pattern (deposit,
   print and etch again: double patterning); standard EUV prints most layers in one pass, but the very
   finest layers of the newest chips still need two; High-NA EUV prints those in one. extra: the share
   of layers that need the second pass, by chip; hours: scanner time per visit. Illustrative values. */
export const PRINT = {
  duv: { hours: 1.5, extra: { mature: 0, phone: 0.3, ai: 0.6 } },
  euv: { hours: 2.0, extra: { mature: 0, phone: 0, ai: 0.15 } },
  highna: { hours: 2.0, extra: { mature: 0, phone: 0, ai: 0 } }
};
const kindOf = layers => layers >= 95 ? 'ai' : layers >= 70 ? 'phone' : 'mature';
/* Layers that need a second pass: the finest ones, at the bottom of the stack. */
export const extraLayers = (L, layers) => Math.round(PRINT[L.print || 'euv'].extra[kindOf(layers)] * layers);
export const isCritical = (L, i, layers) => i < extraLayers(L, layers);
const REPEAT = ['depo', 'litho', 'etch'];   /* what a second pattern repeats */
/* Hours per layer that are neither waiting at a tool nor processing: moving between bays, holds,
   waiting for a measurement result. */
export const MOVE = 1.0;

/* A line: its tool groups, how it prints (opts.print: duv, euv or highna) and whether AI runs it. */
export function line(tools = {}, opts = {}) {
  const print = opts.print || 'euv';
  const L = GROUPS.map(g => Object.assign({}, g, { tools: Math.max(1, tools[g.id] ?? g.tools) }, g.id === 'litho' ? { hours: PRINT[print].hours } : {}));
  L.print = print; L.ai = !!opts.ai;
  return L;
}
/* Visits a lot makes to group g over the whole chip. */
export const visitsOf = (L, g, layers) => Math.round(g.share * layers) + (REPEAT.includes(g.id) ? extraLayers(L, layers) : 0);

/* Lots one group could finish per day, counting every visit a lot makes to it. */
const groupCapacity = (L, g, layers) => g.tools * g.avail * 24 / (g.hours * Math.max(1, visitsOf(L, g, layers)));

/* The most lots per day the line can start and finish: the bottleneck's capacity. */
export function capacity(L, layers) {
  return Math.min(...L.map(g => groupCapacity(L, g, layers)));
}
export function bottleneck(L, layers) {
  let best = null;
  for (const g of L) { const c = groupCapacity(L, g, layers); if (!best || c < best.c) best = { id: g.id, c }; }
  return best.id;
}

/* Waiting time in hours at a group of m tools with utilization u and effective process time te. */
export function wait(u, m, te, v = VAR) {   /* v: VAR, or VAR_AI for a line run with AI */
  if (u >= 1) return Infinity;
  return (v.ca2 + v.cs2) / 2 * Math.pow(u, Math.sqrt(2 * (m + 1)) - 1) / (m * (1 - u)) * te;
}

/* Steady state for `starts` lots per day. */
export function summary(L, layers, starts) {
  const cap = capacity(L, layers);
  const groups = L.map(g => {
    const te = g.hours / g.avail;                       /* availability stretches each visit */
    const n = visitsOf(L, g, layers);
    const u = starts * n * g.hours / (g.tools * g.avail * 24);
    const wq = wait(u, g.tools, te, L.ai ? VAR_AI : VAR);
    return { id: g.id, u, wq, te, n, total: n * (wq + te) };
  });
  const raw = L.reduce((s, g) => s + visitsOf(L, g, layers) * g.hours, 0) / 24;   /* days, never waiting */
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
