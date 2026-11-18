/* The energy budget of one answer: where does the energy go? The engine of the energy puzzle (content/puzzles/energy.md).
   Pure logic, no DOM, no words (ids only); tests in tests/budget.test.mjs.

   A job (what is asked) and a plan (how a machine does it) give the energy of one answer, level by level down the data
   centre's dive (building, rack, board, chip, block, gate, switch, atom), each split three ways: computing, moving data
   and heat lost on the way (leaks, power conversion, cooling). It is small on purpose: fair enough to compare ideas and
   never wrong in direction, not a simulator. Every number comes from an engine that already holds it:
   - the cost of a multiply-add and of fetching a number from a register, an on-chip memory or a memory chip: the 45 nm
     table of src/engines/paradigms.js (E16; facts.json energy-moving-data), with stacked memory beside the chip at the
     share of energy per byte of src/engines/chip.js (MEMS);
   - compute in memory: the crossbar's energy per product, converters included (cimEnergy, paradigms.js);
   - clock, voltage and leakage: the power curve of src/engines/clockpower.js (power, lowestSafe, fmax);
   - the floor: Landauer's limit and the bits a multiply-add erases (src/engines/floor.js);
   - the rest of the server and the cooling: the energy-per-token lab (energyPerToken, src/engines/aiserve.js), the
     network between machines: the cluster-network lab (clusterNetwork, aiserve.js);
   - bytes per number and the chip's speed and bandwidth: src/engines/aichip.js (FORMATS, CHIPS: Rubin);
   - what lower precision costs in accuracy: the quantization lab (quantize, aiserve.js).

   What is simplified: the energies are those of a 45 nm chip, so the totals are those of an old chip doing a new job
   (shares and directions hold; absolute joules are high for a 3 nm chip). Arithmetic scales with the bits (a multiplier
   with their square, an adder with them, as Horowitz's table shows), on-chip energies with the voltage squared, and
   leakage is the power curve's leak over its switching at the plan's clock and voltage. Every operand is read from the
   register file; the block keeps each number it reads from on-chip memory for LOCAL_REUSE products (a fixed choice of
   the model, like a small systolic array); each number fetched from far memory is written to on-chip memory once. */

import { E16, cimEnergy } from './paradigms.js';
import { MEMS } from './chip.js';
import { power, lowestSafe, fmax, POWER_INPUTS } from './clockpower.js';
import { landauer, bitsErased, T_ROOM } from './floor.js';
import { energyPerToken, ENERGY_DEFAULTS, clusterNetwork, NET_DEFAULTS, quantize } from './aiserve.js';
import { FORMATS, chipOf } from './aichip.js';

/* the dive of a data centre, top to bottom: the levels a budget is told at */
export const LEVELS = ['building', 'rack', 'board', 'chip', 'block', 'gate', 'switch', 'atom'];
export const PARTS = ['compute', 'move', 'heat'];

/* numbers of 16 bits are the table's unit; bits per number for each precision (aichip's FORMATS: bytes per weight) */
export const PRECISIONS = Object.keys(FORMATS);                  // fp16, fp8, fp4
export const bitsOf = p => FORMATS[p].bytes * 8;
/* the quantization lab's format for each precision, to say what it costs in accuracy */
const QUANT_OF = { fp16: 'fp16', fp8: 'e4m3', fp4: 'fp4' };

/* where the numbers live: pJ to fetch 16 bits from there, the level that pays it, and bandwidth against stacked memory */
const HBM = MEMS[1], BOARD = MEMS[0];
export const HOMES = {
  dram: { pj16: E16.dram * BOARD.e, level: 'board', bw: BOARD.bw / HBM.bw },     // memory chips on the board
  hbm: { pj16: E16.dram * HBM.e, level: 'board', bw: 1 },                         // stacks beside the chip, in its package
  sram: { pj16: E16.sram32k, level: 'chip', bw: 8 }                                // all of it on chips, wafer-scale or many chips
};
export const HOME_IDS = Object.keys(HOMES);
/* the block keeps a number it read from on-chip memory for this many products before reading another */
export const LOCAL_REUSE = 16;
/* compute in memory: the size of one array, and its converters' bits by default */
export const CIM_ARRAY = 256, CIM_ADC = 6;
/* the power curve's starting point (3 GHz at 0.75 V, activity 0.15) is where the table's energies are taken */
const P0 = POWER_INPUTS, V_REF = P0.v.start, ACTIVITY = P0.a.start;
/* the chip that sets the speed: Rubin's peak (FP4, slower in wider formats) and bandwidth, at the power curve's clock */
const CHIP = chipOf('rubin');

/* One answer from a 70-billion-parameter language model, 500 tokens long: a multiply-add for every weight for every token,
   every weight read once per token (16 bits each), and used once unless the plan batches users together. */
export const JOB = { ops: 70e9 * 500, bytes: 2 * 70e9 * 500, reuse: 1 };
/* The plan: where the numbers live, their precision, the clock (GHz) and the voltage (V, null: the lowest that runs),
   and the levers: users served together (batch), compute in memory (cim, with its converters' bits), the data centre's
   power use effectiveness (pue) and the optics between machines (optics: 'plug' or 'cpo'). */
export const PLAN = { home: 'hbm', precision: 'fp16', clock: P0.f.start, volt: null, batch: 1, cim: false, adcBits: CIM_ADC, pue: ENERGY_DEFAULTS.pue, optics: NET_DEFAULTS.optics };

/* the levers, each a parameter of the plan, at the level where it is pulled and the lab already there (CHALLENGES in
   src/v2/game.js) */
export const LEVERS = [
  { id: 'home', level: 'board', lab: 'fed', values: HOME_IDS },
  { id: 'batch', level: 'chip', lab: 'batch', values: [1, 4, 16, 64, 256] },
  { id: 'precision', level: 'chip', lab: 'quantize', values: PRECISIONS },
  { id: 'clock', level: 'block', lab: 'power-curve', values: [1, 1.5, 2, 3, 4] },
  { id: 'cim', level: 'block', lab: 'cim', values: [false, true] },
  { id: 'pue', level: 'building', lab: 'token-energy', values: [1.5, 1.2, 1.1] },
  { id: 'optics', level: 'rack', lab: 'token-energy', values: ['plug', 'cpo'] },
  { id: 'adcBits', level: 'block', lab: 'cim', values: [4, 6, 8] }
];
export const leverOf = id => LEVERS.find(l => l.id === id) || null;

const zero = () => ({ compute: 0, move: 0, heat: 0 });
const sum = o => o.compute + o.move + o.heat;

/* Returns { ok, why (when not ok: the id problem() gives), levels: { <level>: { compute, move, heat,
   total } } in joules for one answer, parts: { compute, move, heat }, total, floor (joules physics asks for at least),
   times (total over floor), farBytes, volt, seconds (one answer, with its batch), perSecond (answers a second), snrDb
   (the precision's accuracy), shares: { <level>: share of the total } } */
/* What is wrong with a job and a plan, or null: an attempt may come from anyone, so every value is checked before use.
   Ids: 'job' (ops, bytes and reuse must be numbers, ops and bytes not negative, reuse at least 1), 'home', 'precision',
   'clock' (within the power curve's range), 'volt' (within it, and high enough for the clock), 'batch' (1 to 4,096),
   'adc' (2 to 12 bits), 'pue' (1 to 3), 'optics'. */
export const RANGE = { clock: [P0.f.min, P0.f.max], volt: [P0.v.min, P0.v.max], batch: [1, 4096], adcBits: [2, 12], pue: [1, 3] };
const within = (x, [a, b]) => typeof x === 'number' && Number.isFinite(x) && x >= a && x <= b;
export function problem(job, plan) {
  const J = { ...JOB, ...job }, P = { ...PLAN, ...plan }, num = x => typeof x === 'number' && Number.isFinite(x);
  if (!num(J.ops) || !num(J.bytes) || !num(J.reuse) || J.ops < 0 || J.bytes < 0 || J.reuse < 1) return 'job';
  if (!Object.hasOwn(HOMES, P.home)) return 'home';
  if (!Object.hasOwn(FORMATS, P.precision)) return 'precision';
  if (!within(P.clock, RANGE.clock)) return 'clock';
  if (P.volt != null && !within(P.volt, RANGE.volt)) return 'volt';
  if (P.clock > fmax(P.volt == null ? lowestSafe(P.clock) : P.volt) + 1e-9) return 'volt';
  if (!within(P.batch, RANGE.batch)) return 'batch';
  if (typeof P.cim !== 'boolean') return 'cim';
  if (!within(P.adcBits, RANGE.adcBits)) return 'adc';
  if (!within(P.pue, RANGE.pue)) return 'pue';
  if (!['plug', 'cpo'].includes(P.optics)) return 'optics';
  return null;
}

export function budget(job = JOB, plan = PLAN) {
  const why = problem(job, plan);
  if (why) return { ok: false, why };
  const J = { ...JOB, ...job }, P = { ...PLAN, ...plan }, home = HOMES[P.home];
  const volt = P.volt == null ? lowestSafe(P.clock) : P.volt;

  const bits = bitsOf(P.precision), w = bits / 16, pj = 1e-12, ops = J.ops, batch = Math.round(P.batch);
  const reuse = J.reuse * batch;
  const v2 = (volt / V_REF) ** 2;                                   // on-chip energies with the voltage squared
  const L = Object.fromEntries(LEVELS.map(l => [l, zero()]));

  /* far memory: the bytes the job reads once, in this precision, shared by everyone served together */
  const farBytes = J.bytes * w / reuse;
  const far16 = farBytes / 2;                                       // in numbers of 16 bits, the table's unit
  L[home.level].move += far16 * home.pj16 * (home.level === 'chip' ? v2 : 1) * pj;
  /* on-chip memory: every far number is written in once, and the block reads two operands every LOCAL_REUSE products */
  const floorJ = ops * bitsErased(bits) * landauer(T_ROOM);
  if (home.level !== 'chip') L.chip.move += far16 * E16.sram32k * v2 * pj;
  if (P.cim) {
    /* in the arrays: the weights stay where they are summed, so no reads to the block and no digital multiply-add; the
       array and its converters (whose bits set the precision there) cost cimEnergy's analog share per product */
    const e = cimEnergy(CIM_ARRAY, CIM_ARRAY, P.adcBits).analog / (CIM_ARRAY * CIM_ARRAY);
    L.block.compute += ops * e * v2 * pj;
  } else {
    L.chip.move += ops * 2 / LOCAL_REUSE * E16.sram32k * w * v2 * pj;
    L.block.move += ops * 2 * E16.rf * w * v2 * pj;
    /* the arithmetic: a multiplier grows with the square of the bits, an adder with them */
    L.gate.compute += ops * (E16.mul * w * w + E16.add * w) * v2 * pj;
  }
  /* the atom holds what physics asks for (the floor); the gate (or the arrays) the rest of the arithmetic */
  const arith = P.cim ? 'block' : 'gate';
  L[arith].compute = Math.max(0, L[arith].compute - floorJ);
  L.atom.compute = floorJ;

  /* the switch: leakage, the power curve's leak over its switching at this clock and voltage, on every on-chip joule */
  const pw = power(ACTIVITY, volt, P.clock), onChip = ['chip', 'block', 'gate', 'atom'].reduce((a, l) => a + sum(L[l]), 0);
  L.switch.heat = onChip * pw.leak / pw.dyn;

  /* the server and the hall: the energy-per-token lab's rest of the server and network, its cooling (pue), and the
     network between machines as the cluster-network lab sizes it (the lab's own optics are inside the rest; other optics
     change only the network) */
  const accel = LEVELS.slice(2).reduce((a, l) => a + sum(L[l]), 0);
  const ept = energyPerToken({ ...ENERGY_DEFAULTS, pue: P.pue });
  const netShare = o => { const n = clusterNetwork({ ...NET_DEFAULTS, optics: o }); return n.netW / n.gpuW; };
  const rest = accel * ept.parts[1] / ept.parts[0], host = Math.max(0, rest - accel * netShare(NET_DEFAULTS.optics));
  L.rack.move = accel * netShare(P.optics);
  L.board.heat = host;
  L.building.heat = (accel + host + L.rack.move) * (P.pue - 1);

  const levels = Object.fromEntries(LEVELS.map(l => [l, { ...L[l], total: sum(L[l]) }]));
  const parts = Object.fromEntries(PARTS.map(k => [k, LEVELS.reduce((a, l) => a + L[l][k], 0)]));
  const total = sum(parts);

  /* speed: one step for the whole batch is the slower of its arithmetic and its reading, as in the roofline lab */
  const peak = CHIP.pf4 * 1e15 * FORMATS[P.precision].speed / 2 * (P.clock / P0.f.start);   // multiply-adds a second
  const bw = CHIP.bw * 1e12 * home.bw;
  const seconds = Math.max(ops * batch / peak, farBytes * batch / bw);
  const q = quantize({ format: QUANT_OF[P.precision], scaling: 'nv16', outliers: 0.5 });

  return {
    ok: true, levels, parts, total, floor: floorJ, times: total / floorJ, farBytes, volt,
    seconds, perSecond: batch / seconds, snrDb: q.snrDb,
    shares: Object.fromEntries(LEVELS.map(l => [l, levels[l].total / total]))
  };
}

/* the level where most of an answer's energy goes, and the part (computing, moving, heat) that dominates the whole */
export function where(b) {
  if (!b || !b.ok) return null;
  const level = LEVELS.reduce((m, l) => (b.levels[l].total > b.levels[m].total ? l : m), LEVELS[0]);
  const part = PARTS.reduce((m, k) => (b.parts[k] > b.parts[m] ? k : m), PARTS[0]);
  return { level, part };
}

/* What one lever changes: the budget before and after, and the change at every level (after over before, 1: unchanged) */
export function pull(job, plan, id, value) {
  const before = budget(job, plan), after = budget(job, { ...PLAN, ...plan, [id]: value });
  if (!before.ok || !after.ok) return { before, after, ratio: null, byLevel: null };
  return { before, after, ratio: after.total / before.total, byLevel: Object.fromEntries(LEVELS.map(l => [l, before.levels[l].total ? after.levels[l].total / before.levels[l].total : 1])) };
}

/* The score of an attempt: the energy of one answer (lower is better), with the floor it can never go below. A plan the
   engine cannot run scores nothing. The second axes a map of attempts may use: seconds per answer and accuracy. */
export function score(job, plan) {
  const b = budget(job, plan);
  if (!b.ok) return { ok: false, why: b.why };
  return { ok: true, joules: b.total, wh: b.total / 3600, times: b.times, seconds: b.seconds, snrDb: b.snrDb, where: where(b) };
}
