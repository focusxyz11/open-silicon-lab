/* Build up, not out (#482; docs/IDEAS.md 4): as shrinking slows, much of the progress comes from stacking tiers of logic
   and memory on one another and from splitting big chips into chiplets. Pure logic, no DOM and no words (ids only);
   tests in tests/tiers.test.mjs; played by src/v2/labs/tiers.js. The physical layers are called tiers here, in words
   and in code, so they never clash with Your stack (the stack of rungs).

   The job: a large model run at a fixed pace, JOB_OPS operations a second, on LOGIC mm² of logic (the split bet's chip,
   src/engines/bet.js). Its energy, per operation:
     switching   E_OP, the same however the logic is arranged
     wires       E_WIRE1 on one tier. Split the logic over n tiers and each tier's side is 1/sqrt(n) as long, and so is
                 the distance an average signal crosses: the wires' energy falls as 1/sqrt(n). Signals between tiers go
                 through bonds a few microns apart (facts.json hybrid-bond-pitch), whose own energy is tiny next to a wire's
                 (hybrid-bond-pjbit), and is counted as part of the wire.
     memory      MEM_BITS bits from memory per operation. Beside the chip (high-bandwidth memory) each bit costs
                 MEM_BESIDE (facts.json hbm-pjbit); with memory stacked as a tier under the logic, the bit skips the
                 trip off the chip: MEM_CORE for the memory array itself, plus a bond (hybrid-bond-pjbit).
     links       split into k chiplets side by side, LINK_BITS bits per operation cross from one to another, scaled by
                 the share that has to (1 - 1/k), each costing LINK_PJ (facts.json ucie-pjbit, on an interposer).
     pumps       coolant pumped between the tiers costs PUMP of the heat it carries away.
   The heat (steady state, one cell per tier): each tier's power spreads over the footprint (the area of one tier); heat
   passes between neighbouring tiers through a bond layer (R_BOND, per mm²), up from the top tier through the cold plate
   to the coolant (R_SINK), and weakly down through the package to the board (R_BOARD). Coolant pumped between tiers
   adds a path from every tier to the coolant (R_IC). Solved exactly (a chain of cells is a tridiagonal system). The
   limit is T_MAX at the hottest tier (facts.json junction-limit).
   The good chips: a piece of silicon is good when no speck of dust lands on it (the split bet's middle line, CLEAN[2]
   of bet.js, counted here by formula: e^(-specks per cm² x area)); pieces are tested before they are joined, and every
   join holds with the split bet's JOIN. A chip of k chiplets of n tiers is k x n pieces of LOGIC/(k n) mm² each (plus
   LINK mm² of links on a chiplet). good: the share of the silicon made that ends in working chips.
   Simplifications, so they can be argued with: one cell per tier (no hot spots inside a tier), heat spreading ignored,
   the memory tier always at the bottom, power independent of temperature (no leakage feedback), every number below
   that is not a fact a choice of the model. */
import { CLEAN, JOIN, LOGIC, LINK } from './bet.js';

export const JOB_OPS = 1e15;                         // operations a second: a large model served at a steady pace
export const E_OP = 0.25, E_WIRE1 = 0.25;            // pJ an operation: switching, and wires on one tier
export const MEM_BITS = 0.04;                        // bits from memory an operation
export const MEM_BESIDE = 7, MEM_CORE = 2, BOND_PJ = 0.02;   // pJ a bit: beside the chip (hbm-pjbit), the array alone, a bond (hybrid-bond-pjbit)
export const LINK_BITS = 0.5, LINK_PJ = 0.29;        // bits an operation crossing between chiplets, pJ a bit (ucie-pjbit)
export const PUMP = 0.05;                            // pumping coolant between tiers, as a share of the heat it carries
export const T_COOL = 35, T_MAX = 110;               // °C: the coolant, and the hottest a tier may run (junction-limit)
export const R_SINK = 50, R_BOND = 8, R_BOARD = 400, R_IC = 160;  // K·mm²/W: cold plate, a bond layer, to the board, coolant between tiers
export const TIERS = [1, 2, 3, 4, 5, 6, 8], CHIPLETS = [1, 2, 4, 8];
export const FACTS = { limit: 'junction-limit', pitch: 'hybrid-bond-pitch', link: 'ucie-pjbit', bond: 'hybrid-bond-pjbit', beside: 'hbm-pjbit' };

const DEFECTS = CLEAN[2];                            // specks per cm²: the split bet's middle line
export const START = { tiers: 1, memOn: false, cool: false, chiplets: 1 };
/* a setting as the lab and its checks hold it, read safely */
export function normal(o) {
  const x = o || {};
  return { tiers: TIERS.includes(x.tiers) ? x.tiers : START.tiers, memOn: !!x.memOn, cool: !!x.cool, chiplets: CHIPLETS.includes(x.chiplets) ? x.chiplets : START.chiplets };
}

/* energy of one operation, part by part, in pJ */
export function energy(o) {
  const s = normal(o), wire = E_WIRE1 / Math.sqrt(s.tiers), mem = MEM_BITS * (s.memOn ? MEM_CORE + BOND_PJ : MEM_BESIDE), link = LINK_BITS * (1 - 1 / s.chiplets) * LINK_PJ;
  return { op: E_OP, wire, mem, link, chip: E_OP + wire + link, total: E_OP + wire + mem + link };
}

/* the steady temperature of every tier, bottom first: heat in each tier, conductances between them, solved exactly */
export function heat(powers, footprint, cool) {
  const m = powers.length, gb = footprint / R_BOND, gs = footprint / R_SINK, gd = footprint / R_BOARD, gc = cool ? footprint / R_IC : 0;
  /* the system: for tier i, (sum of its conductances) T_i - g T_{i-1} - g T_{i+1} = P_i + (its paths to the coolant) T_COOL */
  const a = new Array(m).fill(0), b = new Array(m).fill(0), c = new Array(m).fill(0), d = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    const down = i > 0 ? gb : gd, up = i < m - 1 ? gb : gs, side = i < m - 1 ? gc : 0;
    a[i] = i > 0 ? -gb : 0; c[i] = i < m - 1 ? -gb : 0; b[i] = down + up + side;
    d[i] = powers[i] + (i === 0 ? gd * T_COOL : 0) + (i === m - 1 ? gs * T_COOL : 0) + side * T_COOL;
  }
  /* the Thomas algorithm */
  for (let i = 1; i < m; i++) { const w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; d[i] -= w * d[i - 1]; }
  const T = new Array(m); T[m - 1] = d[m - 1] / b[m - 1];
  for (let i = m - 2; i >= 0; i--) T[i] = (d[i] - c[i] * T[i + 1]) / b[i];
  return T;
}

/* the good chips: the share of the silicon made that ends in working chips */
export function yieldOf(o) {
  const s = normal(o), pieces = s.chiplets * s.tiers, area = LOGIC / pieces + (s.chiplets > 1 ? LINK : 0);
  const piece = Math.exp(-DEFECTS * area / 100), joins = Math.pow(JOIN, pieces - 1);
  return { pieces, area, piece, joins, good: piece * joins };
}

/* one setting, whole: its energy, power, tiers and their temperatures, footprint, wires, operations per watt, good chips */
export function build(o) {
  const s = normal(o), E = energy(s), logicW = JOB_OPS * E.chip * 1e-12, memW = JOB_OPS * E.mem * 1e-12;
  /* the footprint: the logic split over its tiers, each chiplet with its links; the memory tier, when on logic, as wide */
  const footprint = LOGIC / s.tiers + (s.chiplets > 1 ? s.chiplets * LINK : 0);
  const powers = (s.memOn ? [memW] : []).concat(new Array(s.tiers).fill(logicW / s.tiers));
  const T = heat(powers, footprint, s.cool), hot = Math.max(...T), heatW = logicW + (s.memOn ? memW : 0), pumpW = s.cool ? PUMP * heatW : 0;
  /* memory beside the chip is its own package, cooled on its own: its power counts, its heat is not in the tiers */
  const watts = logicW + memW + pumpW, Y = yieldOf(s);
  return { s, E, watts, logicW, memW, pumpW, footprint, density: heatW / footprint, T, hot, hotAt: T.indexOf(hot), memTier: s.memOn,
    wire: 1 / Math.sqrt(s.tiers), topsPerW: JOB_OPS / watts / 1e12, good: Y.good, Y, ok: hot <= T_MAX };
}

/* the challenge: operations per watt for the large model, under the temperature limit, with at least half the silicon in
   working chips */
export const GOAL = { topsPerW: 2, good: 0.5 };
export const met = o => { const B = build(o); return B.ok && B.topsPerW >= GOAL.topsPerW && B.good >= GOAL.good; };
/* why a setting misses, the first reason in the order the player meets them */
export function whyNot(o) { const B = build(o); return !B.ok ? 'hot' : B.topsPerW < GOAL.topsPerW ? 'energy' : B.good < GOAL.good ? 'yield' : null; }
/* every setting the dials reach, for the tests and for a hint */
export const ALL = TIERS.flatMap(tiers => [false, true].flatMap(memOn => [false, true].flatMap(cool => CHIPLETS.map(chiplets => ({ tiers, memOn, cool, chiplets })))));

/* what this model says of the stacked shape of the architecture engine (src/engines/arch.js shape.stack, today a guess):
   a stack of SHAPE_AT (four tiers of logic on a tier of memory, cooled between) against one flat chip with its memory
   beside it: its energy as operations per watt against the flat chip's, and its ruggedness as the share of the flat
   chip's temperature headroom it keeps (a hot stack has less margin for faults and harsh places). Not read by arch.js
   yet: wiring it in changes the field's scores, so it waits for a new season (#480) */
export const SHAPE_AT = { tiers: 4, memOn: true, cool: true, chiplets: 1 };
export function stackShape() {
  const flat = build(START), st = build(SHAPE_AT);
  return { energy: st.topsPerW / flat.topsPerW, rugged: Math.max(0, (T_MAX - st.hot) / (T_MAX - flat.hot)), at: st.s };
}
