/* Moving bits: if information weighs nothing, why does moving it cost so much? The engine of the question (#263) and of
   its game, Keep the chef busy. Pure logic, no DOM, no words (ids only); tests in tests/bits.test.mjs.

   Information always rides on something physical (Landauer, 1991), so moving one bit costs six things at once: energy,
   time, capacity (how many bits get through a second), space (the wires it needs), errors and money. Three walls no
   design passes: nothing outruns light (in one tick of a 3 GHz clock light crosses about 10 cm), noise caps what one
   wire can carry (Shannon, 1948), and every bit written costs at least kT ln 2 (Landauer's floor).

   Two things are built on these:
   - trip(at): one bit's trip from a memory to the processor, with the memory on the chip, stacked on it, beside it in
     the package, across the board or in another machine reached by light. Six meters, and how close each wall is.
   - kitchen(level, plan): the game. The processor is a chef who gets faster every round (80% a year, as Wulf and
     McKee wrote in 1995), the memory is a pantry that hardly does (7% a year). Six levers, each with its catch, keep
     the chef cooking; the score is the share of time the chef waits and the energy per answer, at the last round.

   It is small on purpose, like the energy budget it builds on (src/engines/budget.js): fair enough to compare ideas
   and never wrong in direction, not a simulator. The energies on a chip are those of the budget's 45 nm table (E16 in
   src/engines/paradigms.js; facts.json energy-moving-data), so the memory beside the chip costs what the budget's HBM
   costs (10 pJ a bit) and the memory chips on the board what its DRAM costs (40 pJ a bit); a modern HBM2 stack is
   about 4 pJ a bit (facts.json hbm2-energy), so absolute numbers are high and shares and directions hold. Light costs
   the same few picojoules a bit whatever the distance (facts.json optics-power), nerves carry a signal at 50 to 100
   metres a second (facts.json nerve-speed). Numbers not from a source are the model's own and are marked so. */
import { E16 } from './paradigms.js';
import { HOMES as BUDGET_HOMES } from './budget.js';
import { landauer, T_ROOM, C } from './floor.js';

/* the figures behind the numbers here and in the question's words (src/data/facts.json) */
export const FACTS = ['landauer-1991', 'light-per-tick', 'shannon-1948', 'landauer-measured', 'energy-moving-data', 'hbm2-energy', 'hbm4', 'memory-squeeze', 'optics-power', 'nerve-speed', 'memory-wall', 'llama3-mfu'];

/* ---------------- the walls ---------------- */
/* light in one tick of a clock (metres), and in glass (light in fibre is slower by its index, about 1.47) */
export const lightPerTick = ghz => C / (ghz * 1e9);
const GLASS = 1.47;
/* Shannon's limit: the most bits a second one channel of this width (Hz) carries at this signal-to-noise (dB) */
export const shannon = (hz, snrDb) => hz * Math.log2(1 + Math.pow(10, snrDb / 10));
/* Landauer's floor: joules to write (erase) one bit at room temperature, about 3 zJ */
export const FLOOR = landauer(T_ROOM);

/* ---------------- what a bit travels through ----------------
   pjMm: picojoules a bit for each millimetre; sMm: seconds a millimetre (never quicker than light: test); edge: what
   crossing out of one chip and into the next costs (pJ a bit, seconds: drivers, receivers, the light converted both
   ways); rate: bits a second one wire carries at its usual speed; hz: the width of its channel; snr0 and lossMm: the
   signal over the noise at the start, and the decibels it loses each millimetre, so that Shannon's limit falls with
   distance; err: the chance a bit arrives wrong before anything checks it; wire: what each wire as many again costs,
   as a share of the level's money (the model's own). The wire on a chip is a chain of repeaters (about 70 ps a millimetre); on the
   package and the board a signal travels at about half the speed of light. */
export const MEDIA = {
  die: { pjMm: 0.19, sMm: 70e-12, edgePj: 0, edgeS: 0, rate: 2e9, hz: 1e9, snr0: 30, lossMm: 0.6, err: 1e-20, wire: 0.08 },
  bond: { pjMm: 0.1, sMm: 10e-12, edgePj: 0.1, edgeS: 0.1e-9, rate: 2e9, hz: 1e9, snr0: 30, lossMm: 1, err: 1e-18, wire: 0.01 },
  interposer: { pjMm: 0.3, sMm: 6.7e-12, edgePj: 2.6, edgeS: 2e-9, rate: 8e9, hz: 4e9, snr0: 28, lossMm: 0.4, err: 1e-16, wire: 0.15 },
  board: { pjMm: 0.15, sMm: 6.7e-12, edgePj: 20, edgeS: 10e-9, rate: 6.4e9, hz: 3.2e9, snr0: 30, lossMm: 0.06, err: 1e-12, wire: 0.12 },
  light: { pjMm: 0, sMm: GLASS / C / 1000, edgePj: 4.5, edgeS: 20e-9, rate: 100e9, hz: 50e9, snr0: 22, lossMm: 0.0002, err: 1e-12, wire: 0.2 },
  /* beyond chips: a thin bare nerve fibre (about a metre a second, and a spike every few bits: the model's own round
     numbers), one wrapped in myelin (50 to 100 m/s, facts.json nerve-speed; the wrapping takes room); people walking
     over to ask (1.4 m/s, a person's 100 W while they talk, a word or two a second) and people on a call (no walk, but
     minutes to set it up) */
  nerve: { pjMm: 100, sMm: 1 / 1 / 1000, edgePj: 500, edgeS: 1e-3, rate: 100, hz: 100, snr0: 10, lossMm: 0, err: 1e-3, wire: 0.15 },
  myelin: { pjMm: 10, sMm: 1 / 75 / 1000, edgePj: 500, edgeS: 1e-3, rate: 300, hz: 300, snr0: 10, lossMm: 0, err: 1e-3, wire: 0.2 },
  talk: { pjMm: 0, sMm: 1 / 1.4 / 1000, edgePj: 3e15, edgeS: 30, rate: 40, hz: 3000, snr0: 20, lossMm: 0, err: 1e-3, wire: 0.1 },
  call: { pjMm: 0, sMm: GLASS / C / 1000, edgePj: 1.2e16, edgeS: 120, rate: 40, hz: 3000, snr0: 14, lossMm: 0, err: 3e-3, wire: 0.1 }
};

/* what a bit is read out of: pj a bit (the cell and its own short wires), seconds to start, and what it costs to keep
   a gigabyte there, relative to memory chips on the board (the model's own: on-chip memory takes costly chip area,
   stacked memory about three times the wafer area of plain memory, facts.json memory-squeeze) */
const SRAM_PJ = E16.sram32k / 16, DRAM_PJ = 5;
export const CELLS = {
  sram: { pj: SRAM_PJ - MEDIA.die.pjMm, s: 1e-9, price: 30 },
  dram: { pj: DRAM_PJ, s: 15e-9, price: 1 },
  hbm: { pj: DRAM_PJ, s: 15e-9, price: 3 },
  synapse: { pj: 10, s: 1e-3, price: 1 },
  person: { pj: 1e12, s: 5, price: 1 }
};

/* ---------------- one bit's trip ----------------
   Where the memory can be, and the path from it to the arithmetic: [medium, millimetres]. The totals agree with the
   budget engine: on-chip memory 0.69 pJ a bit (its sram), the stack beside the chip 10 pJ (its hbm), memory chips on
   the board 40 pJ (its dram); tests hold them to it. wires: how many wires the memory has to the processor (a 2,048-bit
   HBM4 stack, facts.json hbm4; a 64-bit board channel; 16 fibres of 8 colours). */
export const TRIP = {
  near: { cell: 'sram', path: [['die', 1]], wires: 4096 },
  stacked: { cell: 'hbm', path: [['bond', 0.05], ['die', 0.5]], wires: 16384 },
  beside: { cell: 'hbm', path: [['die', 1.5], ['interposer', 6]], wires: 2048 },
  board: { cell: 'dram', path: [['die', 1.5], ['board', 100]], wires: 64 },
  rack: { cell: 'dram', path: [['die', 1.5], ['light', 2000], ['board', 50]], wires: 128 }
};
export const TRIP_IDS = Object.keys(TRIP);
export const METERS = ['energy', 'time', 'capacity', 'space', 'errors', 'money'];

/* a path's costs: energy (J a bit), time (s), the slowest wire's rate and its Shannon limit (bits a second), and the
   chance of an error; every boundary between two media is an edge crossed */
function pathCost(path, cell) {
  const C0 = CELLS[cell];
  let pj = C0.pj, s = C0.s, err = 0, mm = 0, prev = null;
  /* the door is set by the longest stretch that is not the chip's own wiring (the chip's wires are many and short) */
  const main = path.reduce((a, x) => (x[0] !== 'die' && (!a || a[0] === 'die' || x[1] > a[1]) ? x : a), null) || path[0];
  for (const [m, d] of path) {
    const M = MEDIA[m];
    pj += M.pjMm * d + (prev && prev !== m ? M.edgePj : 0);
    s += M.sMm * d + (prev && prev !== m ? M.edgeS : 0);
    /* noise grows with distance: a stretch that loses more than 3 dB is as likely to err as several short ones */
    err += M.err * Math.max(1, M.lossMm * d / 3);
    mm += d; prev = m;
  }
  const M = MEDIA[main[0]], lim = shannon(M.hz, M.snr0 - M.lossMm * main[1]);
  return { j: pj * 1e-12, s, rate: Math.min(M.rate, lim), shannon: lim, err: Math.min(1, err), mm, main: main[0] };
}

/* one bit from the memory at `at` to the arithmetic, at a clock of ghz. Returns the six meters:
   energy (J for the bit), time (s), capacity (bits a second, all wires), space (wires), errors (chance a bit arrives
   wrong before checking), money (price of a gigabyte there, relative to the board's memory); and the walls: light
   (the fastest the trip could be, and how many ticks of the clock that is), shannon (the most one wire carries over
   this distance, against what it does), floor (the energy over Landauer's floor), and the share of the bit's energy
   spent on wires against reading the cell. */
export function trip(at, ghz = 3) {
  const T = TRIP[at]; if (!T) return null;
  const P = pathCost(T.path, T.cell), lightS = P.mm / 1000 / C;
  return {
    at, mm: P.mm,
    meters: { energy: P.j, time: P.s, capacity: P.rate * T.wires, space: T.wires, errors: P.err, money: CELLS[T.cell].price },
    walls: { lightS, lightTicks: lightS * ghz * 1e9, ticks: P.s * ghz * 1e9, perWire: P.rate, shannon: P.shannon, floor: P.j / FLOOR },
    wireShare: 1 - CELLS[T.cell].pj * 1e-12 / P.j,
    /* adding two 16-bit numbers on the same 45 nm table, for the Look: fetching the two costs far more than adding */
    addJ: E16.add * 1e-12, fetchTwoJ: 2 * 16 * P.j
  };
}
/* the budget engine's energy for 16 bits from each home, per bit (J), to hold the trip to it */
export const budgetBit = home => BUDGET_HOMES[home].pj16 / 16 * 1e-12;

/* ---------------- the game: keep the chef busy ----------------
   A level is a kitchen: the chef (balance: at the first round the chef needs that many times longer to cook an answer
   than the pantry, as the level starts, needs to bring its ingredients; so the chef is kept busy at first and waits
   more every round after), the job of one answer (ops; the bits it needs;
   reuse: how often each bit is used again; guess: how well what comes next can be guessed; set: the bits it keeps
   using; hot: the share of the set worth keeping on a shelf), where the pantry is (its cell and path), how many wires
   its door has and how many the chip's edge can take, the room a chip has for a pantry
   of its own (bits, if all of it held memory), the bits a stack on the chip can hold, the most error its answers can
   bear, the energy of one op, and the goal at the last round (the share of time waiting, and the energy of one
   answer). The sizes are the model's own, chosen so each level asks its own question. */
export const ROUNDS = 5;
export const CHEF_GROWS = 1.8, PANTRY_GROWS = 1.07;        // a year each round (Wulf and McKee, facts.json memory-wall)
const MAC = (E16.add + E16.mul) * 1e-12;
export const LEVELS = [
  { id: 'wire', balance: 2, job: { ops: 1e6, bits: 32e6, reuse: 8, guess: 0.9, set: 4e6, hot: 0.25 }, cell: 'sram', path: [['die', 10]], wires: 64, edge: 512, room: 8e6, stack: 1e6, err: 0, opJ: E16.add * 1e-12, goal: { wait: 0.3, energy: 30e-6 } },
  { id: 'chip', balance: 2, job: { ops: 4e6, bits: 64e6, reuse: 16, guess: 0.85, set: 64e6, hot: 0.25 }, cell: 'dram', path: [['die', 1.5], ['board', 100]], wires: 64, edge: 512, room: 16e6, stack: 64e6, err: 0, opJ: MAC, goal: { wait: 0.3, energy: 200e-6 } },
  { id: 'stacked', balance: 2, job: { ops: 16e6, bits: 256e6, reuse: 4, guess: 0.8, set: 512e6, hot: 0.25 }, cell: 'hbm', path: [['die', 1.5], ['interposer', 6]], wires: 1024, edge: 4096, room: 32e6, stack: 512e6, err: 0.01, opJ: MAC, goal: { wait: 0.35, energy: 800e-6 } },
  { id: 'light', balance: 2, job: { ops: 16e6, bits: 256e6, reuse: 2, guess: 0.6, set: 4e9, hot: 0.25 }, cell: 'dram', path: [['die', 1.5], ['board', 1000]], wires: 64, edge: 1024, room: 32e6, stack: 4e8, err: 0, opJ: MAC, goal: { wait: 0.35, energy: 2.4e-3 } },
  { id: 'dc', balance: 2, job: { ops: 64e6, bits: 1024e6, reuse: 1.2, guess: 0.95, set: 64e9, hot: 0.05 }, cell: 'hbm', path: [['die', 1.5], ['interposer', 6]], wires: 2048, edge: 8192, room: 64e6, stack: 8e9, err: 0.02, opJ: MAC, goal: { wait: 0.6, energy: 4.5e-3 } },
  { id: 'brain', balance: 2, job: { ops: 1e3, bits: 1e4, reuse: 4, guess: 0.5, set: 1e5, hot: 0.25 }, cell: 'synapse', path: [['nerve', 50]], fast: 'myelin', wires: 100, edge: 1000, room: 2e4, stack: 2e4, err: 0.1, opJ: 1e-9, goal: { wait: 0.3, energy: 3e-6 } },
  { id: 'team', balance: 2, job: { ops: 10, bits: 2e3, reuse: 2, guess: 0.4, set: 1e4, hot: 0.25 }, cell: 'person', path: [['talk', 200000]], fast: 'call', wires: 1, edge: 8, room: 4e3, stack: 2e3, err: 0.01, opJ: 100, goal: { wait: 0.3, energy: 1600 } }
];
export const LEVEL_IDS = LEVELS.map(l => l.id);
export const levelOf = id => LEVELS.find(l => l.id === id) || null;
/* the chef's speed at the first round (ops a second), from the level's balance */
function chefOf(L) {
  const P = pathCost(L.path, L.cell);
  const fetch = L.job.bits / (L.wires * P.rate) + L.job.ops / 4096 * P.s;
  return L.job.ops / (fetch * L.balance);
}

/* The six levers and the values each can take (the first is the start), with their catches:
   closer  share of the chip's room given to a pantry on the chip: less room for the chef, who slows by that share;
   wider   times the wires of the door: more wires (no more than the chip's edge takes) and more money;
   shelf   a small shelf by the stove (a cache), as a share of the job's set: it must guess what comes next, and every
           wrong guess fetches bits nobody uses; it takes room too (a tenth of what the same pantry on the chip would);
   stack   the pantry stacked on the kitchen: a hop up, through many wires in the chip's face rather than its edge,
           for as much as a stack holds; but the heat is harder to get out, and the chef works at 70%;
   light   ingredients sent by light: every bit pays the conversion, and a little time, but more distance costs almost
           nothing;
   cim     share of the cooking done inside the pantry (computing in memory): those ops move nothing, but the answers
           become approximate (2% wrong at the whole share), more than a level that needs exact answers can bear. */
export const LEVERS = [
  { id: 'closer', values: [0, 0.15, 0.3] },
  { id: 'wider', values: [1, 2, 4, 8] },
  { id: 'shelf', values: [0, 0.05, 0.25, 1] },
  { id: 'stack', values: [false, true] },
  { id: 'light', values: [false, true] },
  { id: 'cim', values: [0, 0.5, 0.9] }
];
export const LEVER_IDS = LEVERS.map(l => l.id);
export const START = Object.fromEntries(LEVERS.map(l => [l.id, l.values[0]]));
/* the catches, and the prices as shares of what a level can spend (the model's own): room on the chip for a pantry or
   a shelf at 1.5 a whole chip, the stack and the light at their share each */
export const STACK_SLOW = 0.7, STACK_WIRES = 8, SHELF_ROOM = 0.1, CIM_ERR = 0.02, CIM_OP = 0.25, CIM_SPEED = 2;
const PRICE = { room: 1.5, stack: 0.45, light: 0.5 };

/* what is wrong with a plan, or null: an attempt may come from anyone, so every value is checked against the levers */
export function problem(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return 'plan';
  for (const k of Object.keys(plan)) if (!LEVER_IDS.includes(k)) return 'lever';
  for (const L of LEVERS) if (Object.hasOwn(plan, L.id) && !L.values.includes(plan[L.id])) return L.id;
  return null;
}
export const fullPlan = plan => Object.assign({}, START, plan);

/* the pantry's own path under a plan: as the level has it, or by light past the chip's own wires */
function basePath(L, P) {
  if (!P.light) return L.path;
  const far = L.path.filter(([m]) => m !== 'die').reduce((a, [, d]) => a + d, 0);
  return L.path.filter(([m]) => m === 'die').concat([[L.fast || 'light', far]]);
}
const STACK_PATH = [['bond', 0.05], ['die', 0.5]];

/* One round of the kitchen (r from 0). Returns the chef's speed, time cooking and fetching (s), the share waiting, the
   energy of one answer (J) split into cooking and moving, and the bits that came from far, from the stack and near. */
function round(L, P, r, K) {
  const J = L.job, F = K.chef * Math.pow(CHEF_GROWS, r) * K.slow;
  const cimOps = J.ops * P.cim, ops = J.ops - cimOps;
  /* the bits the job uses: what the pantry on the chip holds comes from near; of the rest, the shelf holds what is
     used again (if it is big enough, and if it guessed right); what it guessed wrong it fetched for nothing */
  const bits = J.bits * (1 - P.cim), onChip = Math.min(1, L.room * P.closer / J.set), rest = bits * (1 - onChip);
  const fit = Math.min(1, P.shelf / J.hot), hit = (1 - 1 / J.reuse) * fit * J.guess;
  const wasted = rest * fit * (1 - J.guess) * 0.5, far = rest * (1 - hit) + wasted, nearBits = bits - rest * (1 - hit);
  /* of what comes from the pantry, the stack holds its share; the rest still comes the long way */
  const viaStack = P.stack ? far * K.stackShare : 0, viaBase = far - viaStack;
  const grow = Math.pow(PANTRY_GROWS, r), trips = J.ops / 4096 * (1 - hit) * (1 - onChip);   // a wait for every 4,096 ops (the model's own)
  const tBase = viaBase ? viaBase / (K.wires * K.base.rate * grow) + trips * (viaBase / far) * K.base.s / grow : 0;
  const tStack = viaStack ? viaStack / (K.wires * STACK_WIRES * K.stack.rate * grow) + trips * (viaStack / far) * K.stack.s / grow : 0;
  const tNear = nearBits / (4096 * K.near.rate);
  /* cooking is the kitchen's work, the chef's and the pantry's own (computing in memory, at CIM_SPEED times the chef);
     fetching is only moving */
  const tCook = ops / F + cimOps / (F * CIM_SPEED), tFetch = tBase + tStack + tNear;
  const t = Math.max(tCook, tFetch);
  const eCook = ops * L.opJ + cimOps * L.opJ * CIM_OP;
  const eMove = viaBase * K.base.j + viaStack * K.stack.j + nearBits * K.near.j;
  return { F, tCook, tFetch, t, wait: 1 - tCook / t, eCook, eMove, energy: eCook + eMove, far: viaBase, stacked: viaStack, near: nearBits, wasted };
}

/* The kitchen at a level under a plan: every round, the last one's score, the catches (each { ok, value, limit }) and
   the walls. ok: the plan can run (its values are levers'). cleared: the goal is met at the last round with every
   catch inside its limit. */
export function kitchen(levelId, plan) {
  const L = levelOf(levelId); if (!L) return { ok: false, why: 'level' };
  const why = problem(plan); if (why) return { ok: false, why };
  const P = fullPlan(plan), bp = basePath(L, P);
  const K = { base: pathCost(bp, L.cell), stack: pathCost(STACK_PATH, L.cell), near: pathCost([['die', 1]], 'sram'),
    chef: chefOf(L), wires: L.wires * P.wider, stackShare: Math.min(1, L.stack / L.job.set),
    slow: (1 - P.closer - P.shelf * SHELF_ROOM) * (P.stack ? STACK_SLOW : 1) };
  const rounds = Array.from({ length: ROUNDS }, (_, r) => round(L, P, r, K));
  const last = rounds[ROUNDS - 1];
  /* what the plan spends, as a share of what the level can: more wires (at the price of the medium they cross), the
     room on the chip given to a pantry and a shelf, the stack and the light */
  const main = MEDIA[K.base.main];
  const money = (P.wider - 1) * main.wire + (P.closer + P.shelf * SHELF_ROOM) * PRICE.room + (P.stack ? PRICE.stack : 0) + (P.light ? PRICE.light : 0);
  const error = P.cim * CIM_ERR;
  const catches = {
    money: { ok: money <= 1 + 1e-9, value: money, limit: 1 },
    space: { ok: K.wires <= L.edge, value: K.wires, limit: L.edge },
    error: { ok: error <= L.err + 1e-12, value: error, limit: L.err }
  };
  const lightS = K.base.mm / 1000 / C;
  const walls = {
    light: { s: lightS, ticks: lightS * last.F, fetchTicks: K.base.s * last.F },              // the fastest any trip could be, in the chef's ticks
    shannon: { perWire: K.base.rate, limit: K.base.shannon, share: K.base.rate / K.base.shannon },  // one wire against its noise limit
    floor: { perBit: K.base.j, times: K.base.j / FLOOR }                                         // a bit's energy over Landauer's floor
  };
  const goal = { wait: last.wait <= L.goal.wait, energy: last.energy <= L.goal.energy };
  const allOk = Object.values(catches).every(c => c.ok);
  return { ok: true, level: L.id, plan: P, rounds, wait: last.wait, energy: last.energy, catches, walls, goal, cleared: goal.wait && goal.energy && allOk,
    pantry: { j: K.base.j, s: K.base.s, mm: K.base.mm, medium: K.base.main }, slow: K.slow };
}

/* the score of an attempt: what the ledger keeps (src/engines/ledger.js), lower is better on both */
export function score(levelId, plan) {
  const K = kitchen(levelId, plan);
  if (!K.ok) return { ok: false, why: K.why };
  return { ok: true, wait: K.wait, energy: K.energy, cleared: K.cleared };
}
/* every plan there is, for searching (tests, the hint) */
export function* plans() {
  const rec = function* (i, cur) {
    if (i === LEVERS.length) { yield cur; return; }
    for (const v of LEVERS[i].values) yield* rec(i + 1, Object.assign({}, cur, { [LEVERS[i].id]: v }));
  };
  yield* rec(0, {});
}
/* a plan as kept: only the levers that differ from the start */
export function normalPlan(p) {
  const out = {}; if (!p || typeof p !== 'object') return out;
  LEVERS.forEach(L => { if (Object.hasOwn(p, L.id) && L.values.includes(p[L.id]) && p[L.id] !== START[L.id]) out[L.id] = p[L.id]; });
  return out;
}
/* a hint: the lever to pull next, toward the nearest plan that clears the level (fewest levers changed from yours),
   and the value to pull it to; null when the plan clears already or no plan does */
export function hint(levelId, plan) {
  const P = fullPlan(normalPlan(plan)), K = kitchen(levelId, P); if (!K.ok || K.cleared) return null;
  let best = null, bestD = Infinity;
  for (const q of plans()) {
    const d = LEVER_IDS.filter(k => q[k] !== P[k]).length;
    if (d < bestD && kitchen(levelId, q).cleared) { best = q; bestD = d; }
  }
  if (!best) return null;
  const id = LEVER_IDS.find(k => best[k] !== P[k]);
  return { lever: id, value: best[id], steps: bestD };
}
/* the game is won when the chef is kept busy at every level of chips (the first five); the two beyond chips are there
   to play */
export const TO_WIN = LEVEL_IDS.slice(0, 5);
export const won = cleared => TO_WIN.every(id => cleared && cleared[id]);
/* the player's kitchen as kept in the browser (the game's state, src/v2/game.js): the level in view, a plan for each
   level, the levels cleared, and the tab (the trip or the kitchen) and the memory's place on the trip; anything else
   is dropped */
export function normalState(s) {
  const o = s && typeof s === 'object' ? s : {}, plans = {}, cleared = {};
  LEVEL_IDS.forEach(id => { if (o.plans && o.plans[id]) plans[id] = normalPlan(o.plans[id]); if (o.cleared && o.cleared[id]) cleared[id] = 1; });
  return { at: LEVEL_IDS.includes(o.at) ? o.at : LEVEL_IDS[0], plans, cleared, tab: o.tab === 'trip' ? 'trip' : 'chef', trip: TRIP_IDS.includes(o.trip) ? o.trip : 'board' };
}
