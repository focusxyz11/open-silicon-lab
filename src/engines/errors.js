/* How can a chip be right when its parts aren't? The engine of the errors puzzle (content/puzzles/errors.md).
   Pure logic, no DOM, no words (ids only); tests in tests/errors.test.mjs.

   A fault environment (where the chip lives: a phone, a car, a data centre or space) and a plan (which protection sits
   at which level) give, for every billion answers, how many wrong answers are fixed, how many are caught (the answer is
   refused, or redone if the plan retries) and how many escape silently, with what the protection costs: energy (on the
   energy puzzle's scale, src/engines/budget.js, so being right is paid in the same joules), area, time and price.
   It is small on purpose: fair enough to compare ideas and never wrong in direction, not a reliability simulator.

   The faults, by where they come from (SOURCES), and the numbers they reuse:
   - flips from radiation, in memory and in logic: the rate per megabit, the share of flips that are read and the share
     that land in logic of src/engines/life.js (FIT_PER_MBIT, VULNERABLE, LOGIC_SHARE), and the on-chip memory each place
     uses (life's MISSIONS); half from alpha particles of the package and half from cosmic-ray neutrons at sea level
     (facts.json alpha-share), neutrons many times more in orbit (space-upsets);
   - copies that compute wrong for good: a slow copy outside its timing window and a worn one (life's live(): the share
     of chips failed by timing and by wear at the end of their life, at the plan's margin), and a copy with a defect no
     test found (facts.json sdc-rate for servers and phones, car-ppm for cars and space);
   - machines that stop: the data centre's interruptions (facts.json llama3-interruptions); always seen, never silent.

   The protection, one lever per level (LEVERS), each catching only the faults it can see:
   - error-correcting codes see memory only: parity finds one flipped bit and misses two; SECDED (facts.json secded-72)
     fixes one and finds two;
   - copies see logic only: two in lockstep find a difference, three that vote fix one wrong copy and not two. A particle
     strikes one copy; but a copy that is wrong for good is wrong through something the copies may share (a clock, a
     supply, a flaw in the design), and a share of those passes them all (COMMON: 1%, the share ISO 26262 lets through
     at its highest level, facts.json asil-d);
   - self-test and a fleet that hunts silent errors find copies that are wrong for good, never a one-off flip;
   - retrying redoes an answer that was caught, never one that was not;
   - an AI tolerates most wrong values on its own (facts.json dnn-bitflip), more if its values are clipped to their range;
     checksums on its matrix arithmetic (algorithm-based checks) find wrong logic.

   What is simplified: every rate is an expected number per answer (small, so they add); a copy that is wrong for good is
   wrong once in PERMANENT_HOURS of work; two wrong copies agree (the worst case); the energy of each protection is a
   share of the budget engine's parts (memory, logic, leakage) and of the server around them. The figures are for the
   direction and rough size, not the digits. */

import { MISSIONS, MARGINS, live, FIT_PER_MBIT, VULNERABLE, LOGIC_SHARE } from './life.js';
import { budget, JOB as ANSWER, PLAN as RUN } from './budget.js';

const H = 3600, BILLION = 1e9;

/* the levels a plan sets, top to bottom: the job itself (software), then the depths of the dive; pkg: the package */
export const LEVELS = ['job', 'building', 'rack', 'chip', 'block', 'gate', 'switch', 'pkg'];
/* where wrong answers come from, the level where each arises, and the part of the machine it is wrong in */
export const SOURCES = ['neutron', 'alpha', 'timing', 'wear', 'defect', 'crash'];
export const SOURCE_LEVEL = { neutron: 'switch', alpha: 'pkg', timing: 'gate', wear: 'block', defect: 'chip', crash: 'rack' };
export const SITES = ['memory', 'logic', 'machine'];
export const LASTING = ['timing', 'wear', 'defect'];

/* ---- the numbers of the model, each with its source or said to be a choice ---- */
export const ALPHA_SHARE = 0.5;          // at sea level, alpha and neutrons flip about as many bits each (facts.json alpha-share)
export const LOW_ALPHA_LEFT = 0.1;       // ultra-low-alpha materials: ten or more times fewer alphas (facts.json low-alpha)
export const HARDENED_LEFT = 0.1;        // hardened cells (bigger, or with a second node that restores the first): a choice
export const MULTI = 0.02;               // share of memory flips that hit two bits of one word: a choice (interleaving keeps it small)
export const PERMANENT_HOURS = 1000;     // a copy that is wrong for good gives a wrong answer once in this many hours: a choice
export const COMMON = 0.01;              // lasting faults that hit every copy alike: 1% (facts.json asil-d, 99% of single faults caught)
export const SELFTEST_COVER = 0.9;       // self-test finds 90% of copies wrong for good (facts.json asil-d, latent faults)
export const HUNT_COVER = 0.9;           // a fleet's tests find 90% of them: a choice
export const AI_MATTERS = 0.05;          // an AI's answer changes for about 5% of wrong values (facts.json dnn-bitflip: 0.4% to 7%)
export const RANGE_LEFT = 0.2;           // clipping values to their range leaves a fifth of those (only high bits matter): a choice
export const ABFT_COVER = 0.99;          // checksums on matrix arithmetic find 99% of wrong logic in it: a choice
/* one megabit flips FIT_PER_MBIT times per 10⁹ hours at sea level; a satellite's memory flipped 4.04 × 10⁻⁷ times per bit
   per day in low Earth orbit (facts.json space-upsets), so neutrons and protons there are SPACE_FLUX times sea level's */
export const SPACE_PER_BIT_DAY = 4.04e-7;
const GROUND_PER_BIT_DAY = FIT_PER_MBIT / BILLION / 1e6 * 24;
export const SPACE_FLUX = (SPACE_PER_BIT_DAY / GROUND_PER_BIT_DAY - ALPHA_SHARE) / (1 - ALPHA_SHARE);
/* the data centre's machines stop 419 times in 54 days on 16,384 GPUs (facts.json llama3-interruptions) */
export const LLAMA = { stops: 419, days: 54, gpus: 16384 };
export const CRASH_PER_HOUR = LLAMA.stops / (LLAMA.days * 24 * LLAMA.gpus);
/* copies wrong for good: one device in a thousand in a server fleet (facts.json sdc-rate), one chip in a million in a
   car (car-ppm); a phone's chips are taken as a server's, a satellite's as a car's (choices) */
export const DEFECT = { server: 1e-3, car: 1e-6 };

/* ---- where the chip lives ----
   life: the place in src/engines/life.js whose heat, supply and years set the timing and the wear (space is taken as a
   car: fifteen years through heat and cold); flux: neutrons against sea level; mbit: on-chip memory in use (life's
   MISSIONS); seconds: how long one answer takes (the data centre's from the budget engine's answer); defect: share of
   copies wrong for good; crash: machine stops per hour; ai: share of the work that is an AI's (tolerant) arithmetic;
   hall: a fleet that can be taken out of service and tested; the budget engine's job and run for the energy, and
   whether the server and the building around the chip count (outside). */
const CONTROL = { ops: 1e7, bytes: 1e4, reuse: 1 };
export const ENVIRONMENTS = {
  phone: { life: 'phone', flux: 1, mbit: MISSIONS.phone.mem, seconds: 2, defect: DEFECT.server, crash: 0, ai: 0.3, hall: false,
    job: { ops: 3e9 * 100, bytes: 2 * 3e9 * 100, reuse: 1 }, run: { home: 'dram', clock: 2, pue: 1 }, outside: false },
  car: { life: 'car', flux: 1, mbit: MISSIONS.car.mem, seconds: 0.001, defect: DEFECT.car, crash: 0, ai: 0, hall: false,
    job: CONTROL, run: { home: 'sram', clock: 1, pue: 1 }, outside: false },
  datacentre: { life: 'datacentre', flux: 1, mbit: MISSIONS.datacentre.mem, seconds: budget(ANSWER, RUN).seconds, defect: DEFECT.server, crash: CRASH_PER_HOUR, ai: 1, hall: true,
    job: ANSWER, run: RUN, outside: true },
  space: { life: 'car', flux: SPACE_FLUX, mbit: MISSIONS.car.mem, seconds: 1, defect: DEFECT.car, crash: 0, ai: 0, hall: false,
    job: CONTROL, run: { home: 'sram', clock: 1, pue: 1 }, outside: false }
};
export const ENVIRONMENT_IDS = Object.keys(ENVIRONMENTS);

/* ---- the plan: one lever per level ---- */
export const PLAN = { check: 'none', hunt: false, retry: false, materials: 'standard', logic: 'none', selftest: false, memory: 'none', margin: 0, cells: 'standard' };
/* each lever at its level, with the field question or lab already there (src/data/questions.js; CHALLENGES in
   src/v2/game.js) */
export const LEVERS = [
  { id: 'check', level: 'job', values: ['none', 'range', 'abft'] },
  { id: 'hunt', level: 'building', values: [false, true], question: 'later' },
  { id: 'retry', level: 'rack', values: [false, true] },
  { id: 'logic', level: 'chip', values: ['none', 'lockstep', 'tmr'], lab: 'vote' },
  { id: 'selftest', level: 'chip', values: [false, true], question: 'later' },
  { id: 'memory', level: 'block', values: ['none', 'parity', 'ecc'] },
  { id: 'margin', level: 'gate', values: MARGINS, question: 'spare' },
  { id: 'cells', level: 'switch', values: ['standard', 'hardened'] },
  { id: 'materials', level: 'pkg', values: ['standard', 'lowAlpha'], question: 'lid' }
];
export const leverOf = id => LEVERS.find(l => l.id === id) || null;

/* what each protection costs, as shares: area of the chip (half memory, half logic: a choice), energy of the part it
   protects, time of one answer, and price */
const MEM_AREA = 0.5, LOGIC_AREA = 0.5;
export const COST = {
  memory: { none: { bits: 0, codec: 0, time: 0 }, parity: { bits: 1 / 64, codec: 0.002, time: 0.002 }, ecc: { bits: 8 / 64, codec: 0.02, time: 0.01 } },
  logic: { none: { copies: 1, time: 0 }, lockstep: { copies: 2, time: 0.005 }, tmr: { copies: 3, time: 0.02 } },
  check: { none: { energy: 0, time: 0 }, range: { energy: 0.005, time: 0.005 }, abft: { energy: 0.03, time: 0.03 } },
  hardened: { area: 0.3, energy: 0.2 },
  selftest: { area: 0.02, time: 0.01 },
  hunt: { time: 0.01 },
  retry: { time: 0.001 },                // keeping each answer's input until it is known to be right
  lowAlpha: { price: 0.05 }
};

/* What happens to a memory word with this many flipped bits under each code (the Hamming code's promise) */
export function memoryOutcome(scheme, bits) {
  if (bits <= 0) return 'right';
  if (scheme === 'ecc') return bits === 1 ? 'fixed' : bits === 2 ? 'caught' : 'silent';
  if (scheme === 'parity') return bits % 2 ? 'caught' : 'silent';
  return 'silent';
}
/* Three copies vote: the answer is right while at most one copy is wrong */
export const vote = wrongCopies => (wrongCopies <= 1 ? 'right' : 'wrong');
/* Copies of the logic, each wrong with probability p, a share common of it alike in every copy: the share of answers
   where some copy is wrong (raw), and of answers fixed, caught and silent (two wrong copies agree: the worst case).
   More copies are wrong more often; what they buy is what happens next. Written out so tiny chances keep their digits. */
export function copies(scheme, p, common = 0) {
  const same = common * p, q = p - same;
  if (scheme === 'lockstep') return { raw: same + q * (2 - q), fixed: 0, caught: q * (2 - q), silent: same };
  if (scheme === 'tmr') return { raw: same + q * (3 - 3 * q + q * q), fixed: 3 * q * (1 - q) ** 2, caught: 0, silent: same + 3 * q * q - 2 * q ** 3 };
  return { raw: p, fixed: 0, caught: 0, silent: p };
}

/* What is wrong with an environment and a plan, or null: a plan may come from anyone, so every value is checked.
   Ids: 'env', then each lever's id; 'hunt' also where there is no fleet to take out of service. */
export function problem(env, plan) {
  if (typeof env !== 'string' || !Object.hasOwn(ENVIRONMENTS, env)) return 'env';
  const P = { ...PLAN, ...plan };
  for (const L of LEVERS) if (!L.values.includes(P[L.id])) return L.id;
  if (P.hunt && !ENVIRONMENTS[env].hall) return 'hunt';
  return null;
}

/* The energy and time of one answer with this plan, against the same answer unprotected, on the budget engine's scale:
   memory (reads from far and on-chip memory) pays the code's extra bits, logic (the block, the gate and the floor) pays
   its copies and checks, hardened cells pay on everything on the chip, leakage follows the chip's own energy, and the
   server and the building (where they count) follow the chip, as in the budget engine. The margin runs the chip slower
   at the same voltage, through the budget engine itself. */
function chipEnergy(b, P, outside) {
  const L = b.levels, mem = COST.memory[P.memory], cp = COST.logic[P.logic], ck = COST.check[P.check];
  const hard = P.cells === 'hardened' ? 1 + COST.hardened.energy : 1;
  const logic = L.block.total + L.gate.total + L.atom.total, onChip = L.chip.total + logic, leak = L.switch.heat / onChip;
  const far = L.board.move * (1 + mem.bits + mem.codec);
  const near = L.chip.move * (1 + mem.bits + mem.codec) * hard;
  const logic2 = logic * (cp.copies + (P.logic === 'tmr' ? 0.01 : 0)) * (1 + ck.energy) * hard;
  const accel0 = L.board.move + onChip + L.switch.heat, accel = far + (near + logic2) * (1 + leak);
  return outside ? accel * b.total / accel0 : accel;
}
function costs(E, P, caught) {
  const base = budget(E.job, E.run), slow = budget(E.job, { ...E.run, clock: (E.run.clock || RUN.clock) / (1 + P.margin), volt: base.volt });
  const plain = chipEnergy(base, PLAN, E.outside);
  const share = 1 + (P.selftest ? COST.selftest.time : 0) + (P.hunt ? COST.hunt.time : 0) + (P.retry ? COST.retry.time : 0);
  const redo = 1 + (P.retry ? caught : 0);
  const joules = chipEnergy(slow, P, E.outside) * share * redo;
  const time = slow.seconds / base.seconds * (1 + COST.memory[P.memory].time) * (1 + COST.logic[P.logic].time) * (1 + COST.check[P.check].time) * share * redo;
  const mem = MEM_AREA * (1 + COST.memory[P.memory].bits + COST.memory[P.memory].codec);
  const logic = LOGIC_AREA * (COST.logic[P.logic].copies + (P.logic === 'tmr' ? 0.01 : 0));
  const area = (mem + logic + (P.selftest ? COST.selftest.area : 0)) * (P.cells === 'hardened' ? 1 + COST.hardened.area : 1);
  return { joules, plainJoules: plain, energy: joules / plain, area, time, seconds: E.seconds * time, price: area * (P.materials === 'lowAlpha' ? 1 + COST.lowAlpha.price : 1) };
}

const zero = () => ({ raw: 0, fixed: 0, caught: 0, masked: 0, silent: 0 });

/* Returns { ok, why (when not ok), env, plan, perBillion: { raw, fixed, caught, masked, silent } for a billion answers,
   the same bySource and bySite (memory, logic, machine), stoppedAt: { <level>: wrong values fixed or caught there },
   fit: { caught, silent } per 10⁹ hours of work, cost: { energy (against the same answer with no protection), joules,
   plainJoules, area, time, seconds, price }, where (the source of most silent answers, or null) }. Raw counts every
   wrong value; each ends fixed, caught, masked (the job shrugged it off) or silent. Caught answers are redone when the
   plan retries, and then count as fixed (stopped where they were caught). */
export function errors(env = 'datacentre', plan = PLAN) {
  const why = problem(env, plan);
  if (why) return { ok: false, why };
  const E = ENVIRONMENTS[env], P = { ...PLAN, ...plan }, h = E.seconds / H;
  const S = Object.fromEntries(SOURCES.map(s => [s, zero()])), T = Object.fromEntries(SITES.map(s => [s, zero()]));
  const at = Object.fromEntries(LEVELS.map(l => [l, 0]));
  const add = (s, site, kind, n, level) => { S[s][kind] += n; T[site][kind] += n; if (level) at[level] += n; };
  const tolerate = 1 - E.ai + E.ai * AI_MATTERS * (P.check === 'range' ? RANGE_LEFT : 1);
  /* a wrong value nobody caught: the job shrugs most of it off if it is an AI's */
  const left = (s, site, n) => { add(s, site, 'masked', n * (1 - tolerate)); add(s, site, 'silent', n * tolerate); };

  /* radiation: flips per answer in the bits it uses, from each source; hardened cells and low-alpha materials at source */
  const perHour = FIT_PER_MBIT * E.mbit / BILLION * VULNERABLE * (P.cells === 'hardened' ? HARDENED_LEFT : 1);
  const rad = { alpha: perHour * ALPHA_SHARE * (P.materials === 'lowAlpha' ? LOW_ALPHA_LEFT : 1) * h, neutron: perHour * (1 - ALPHA_SHARE) * E.flux * h };
  /* copies wrong for good: life's share of chips out of the timing window and worn out at this margin, and defects */
  const life = live(E.life, { margin: MARGINS.indexOf(P.margin) });
  const lasting = { timing: life.at.timing, wear: life.at.wear, defect: E.defect };

  /* a wrong logic value: self-test and the fleet's hunt retire lasting faults before they answer; then the copies, then
     the job's checksums, then the job's tolerance */
  const logic = (s, p) => {
    const keeps = LASTING.includes(s), common = keeps ? COMMON : 0, raw = q => copies(P.logic, q, common).raw;
    add(s, 'logic', 'raw', raw(p));
    if (keeps && P.selftest) { const q = p * (1 - SELFTEST_COVER); add(s, 'logic', 'fixed', raw(p) - raw(q), 'chip'); p = q; }
    if (keeps && P.hunt) { const q = p * (1 - HUNT_COVER); add(s, 'logic', 'fixed', raw(p) - raw(q), 'building'); p = q; }
    const c = copies(P.logic, p, common);
    add(s, 'logic', 'fixed', c.fixed, 'chip'); add(s, 'logic', 'caught', c.caught, 'chip');
    const abft = P.check === 'abft' ? E.ai * ABFT_COVER : 0;
    add(s, 'logic', 'caught', c.silent * abft, 'job');
    left(s, 'logic', c.silent * (1 - abft));
  };
  for (const s of ['alpha', 'neutron']) {
    /* memory: one flipped bit or two in a word, through the code; logic: a share of the flips land there */
    add(s, 'memory', 'raw', rad[s]);
    for (const [bits, n] of [[1, rad[s] * (1 - MULTI)], [2, rad[s] * MULTI]]) {
      const o = memoryOutcome(P.memory, bits);
      if (o === 'silent') left(s, 'memory', n); else add(s, 'memory', o, n, 'block');
    }
    logic(s, rad[s] * LOGIC_SHARE);
  }
  for (const s of LASTING) logic(s, lasting[s] * h / PERMANENT_HOURS);
  /* a machine that stops: seen by everyone */
  add('crash', 'machine', 'raw', E.crash * h); add('crash', 'machine', 'caught', E.crash * h, 'rack');

  /* retrying redoes every caught answer */
  const caught = SOURCES.reduce((a, s) => a + S[s].caught, 0);
  if (P.retry) {
    for (const o of [...Object.values(S), ...Object.values(T)]) { o.fixed += o.caught; o.caught = 0; }
  }

  const per = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * BILLION]));
  const bySource = Object.fromEntries(SOURCES.map(s => [s, per(S[s])])), bySite = Object.fromEntries(SITES.map(s => [s, per(T[s])]));
  const perBillion = Object.fromEntries(Object.keys(zero()).map(k => [k, SOURCES.reduce((a, s) => a + bySource[s][k], 0)]));
  const fit = { caught: perBillion.caught / h, silent: perBillion.silent / h };
  const worst = SOURCES.reduce((m, s) => (bySource[s].silent > bySource[m].silent ? s : m), SOURCES[0]);
  return { ok: true, env, plan: P, perBillion, bySource, bySite, stoppedAt: per(at), fit, cost: costs(E, P, caught), where: bySource[worst].silent > 0 ? worst : null };
}

/* What one lever changes: before and after, silent answers after over before, and the energy after over before */
export function pull(env, plan, id, value) {
  const before = errors(env, plan), after = errors(env, { ...PLAN, ...plan, [id]: value });
  if (!before.ok || !after.ok) return { before, after, silent: null, energy: null };
  return { before, after, silent: before.perBillion.silent ? after.perBillion.silent / before.perBillion.silent : 1, energy: after.cost.energy / before.cost.energy };
}

/* The score of an attempt: silent wrong answers per billion (lower is better), then the ones caught and not fixed, with
   what being right costs beside them (energy against no protection, area, time, price). Nobody votes; an attempt that
   is quieter and no dearer on any side moves the frontier. A plan the engine cannot run scores nothing. */
export function score(env, plan) {
  const r = errors(env, plan);
  if (!r.ok) return { ok: false, why: r.why };
  return { ok: true, silent: r.perBillion.silent, caught: r.perBillion.caught, fit: r.fit.silent, energy: r.cost.energy, joules: r.cost.joules, area: r.cost.area, time: r.cost.time, price: r.cost.price, where: r.where };
}

/* Is one attempt at least as good as another on every side, and better on one? (the frontier of attempts) */
export function beats(a, b) {
  const sides = ['silent', 'caught', 'energy', 'area', 'time', 'price'];
  return a.ok && b.ok && sides.every(k => a[k] <= b[k] * (1 + 1e-12)) && sides.some(k => a[k] < b[k] * (1 - 1e-12));
}
