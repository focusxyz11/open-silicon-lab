/* How can a chip be right when its parts aren't? (src/engines/errors.js), the engine of the errors puzzle
   (content/puzzles/errors.md): never wrong in direction, each protection catching only what it can see, and matching
   the cases its sources give. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as X from '../src/engines/errors.js';
import { live, MISSIONS, FIT_PER_MBIT, VULNERABLE, LOGIC_SHARE } from '../src/engines/life.js';
import { budget, JOB, PLAN as RUN } from '../src/engines/budget.js';
import { fieldOf } from '../src/data/questions.js';
import { CHALLENGES } from '../src/v2/game.js';
import { DEPTHS } from '../src/data/weave.js';

const FACTS = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const run = (env, plan) => { const r = X.errors(env, plan); assert.ok(r.ok, env + ' ' + JSON.stringify(plan) + ': ' + r.why); return r; };
const near = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) <= tol, msg + ': ' + a + ' against ' + b + ' (within ' + tol * 100 + '%)');
const KINDS = ['fixed', 'caught', 'masked', 'silent'];
const COSTS = ['energy', 'area', 'time', 'price'];
/* what a chip in each place usually has already: error-correcting memory and a margin on its clock */
const USUAL = { memory: 'ecc', margin: 0.3 };
/* every value of every lever, from no protection and from the usual, in every place where it can be pulled */
const pulls = () => {
  const out = [];
  for (const env of X.ENVIRONMENT_IDS) for (const from of [{}, USUAL]) for (const L of X.LEVERS) {
    const vals = L.values, at = vals.indexOf(from[L.id] ?? X.PLAN[L.id]);
    for (const v of vals.slice(at + 1)) if (!X.problem(env, { ...from, [L.id]: v })) out.push({ env, from, id: L.id, v });
  }
  return out;
};

test('every level and every source sits at a depth of the dive (or the job itself), and every lever names what is already there', () => {
  for (const l of X.LEVELS) if (l !== 'job') assert.ok(DEPTHS[l], l);
  for (const s of X.SOURCES) assert.ok(X.LEVELS.includes(X.SOURCE_LEVEL[s]), s);
  for (const L of X.LEVERS) {
    assert.ok(L.id in X.PLAN && X.LEVELS.includes(L.level), L.id);
    assert.equal(L.values[0], X.PLAN[L.id], L.id + ': the first value is no protection');
    if (L.question) { const q = fieldOf(L.question); assert.ok(q, L.id + ': ' + L.question); }
    if (L.lab) assert.ok(CHALLENGES.find(c => c.id === L.lab), L.id + ': ' + L.lab);
  }
  /* the field questions the puzzle threads sit at the levels its levers are pulled at */
  assert.equal(fieldOf('spare').home.level, X.leverOf('margin').level);
  assert.equal(fieldOf('later').home.level, X.leverOf('selftest').level);
  assert.equal(fieldOf('lid').home.level, X.leverOf('materials').level);
  assert.equal(fieldOf('wear').home.level, X.SOURCE_LEVEL.wear);
});

test('every wrong value is counted once: fixed, caught, masked or silent, by source and by site', () => {
  for (const env of X.ENVIRONMENT_IDS) for (const plan of [{}, USUAL, { ...USUAL, logic: 'tmr', retry: true }, { memory: 'parity', logic: 'lockstep', check: 'abft' }, { cells: 'hardened', selftest: true, check: 'range' }]) {
    const r = run(env, plan);
    for (const o of [r.perBillion, ...Object.values(r.bySource), ...Object.values(r.bySite)]) {
      for (const k of ['raw', ...KINDS]) assert.ok(o[k] >= 0, env + ' ' + k);
      near(KINDS.reduce((a, k) => a + o[k], 0) || 1, o.raw || 1, 1e-9, env + ' ' + JSON.stringify(plan) + ': every wrong value ends somewhere');
    }
    for (const k of ['raw', ...KINDS]) near(X.SITES.reduce((a, s) => a + r.bySite[s][k], 0) || 1, r.perBillion[k] || 1, 1e-9, 'sites add up: ' + k);
    near(Object.values(r.stoppedAt).reduce((a, n) => a + n, 0) || 1, (r.perBillion.fixed + r.perBillion.caught) || 1, 1e-9, 'every stop has a level');
  }
});

test('more protection means fewer silent answers, and always costs more', () => {
  for (const { env, from, id, v } of pulls()) {
    const a = run(env, from), b = run(env, { ...from, [id]: v }), say = env + ' ' + JSON.stringify(from) + ' + ' + id + '=' + v;
    assert.ok(b.perBillion.silent <= a.perBillion.silent * (1 + 1e-12), say + ': no more silent answers');
    for (const k of COSTS) assert.ok(b.cost[k] >= a.cost[k] * (1 - 1e-12), say + ': ' + k + ' never falls');
    assert.ok(COSTS.some(k => b.cost[k] > a.cost[k] * (1 + 1e-9)), say + ': it costs something');
  }
  /* in each place, where silent answers come from something a lever can reach, the lever lowers them */
  const fewer = (env, from, id, v) => assert.ok(run(env, { ...from, [id]: v }).perBillion.silent < run(env, from).perBillion.silent, env + ' ' + id + '=' + v);
  for (const env of X.ENVIRONMENT_IDS) {
    fewer(env, {}, 'margin', 0.3); fewer(env, USUAL, 'logic', 'tmr'); fewer(env, USUAL, 'selftest', true); fewer(env, {}, 'memory', 'ecc');
    fewer(env, {}, 'cells', 'hardened'); fewer(env, {}, 'materials', 'lowAlpha');
  }
  fewer('datacentre', USUAL, 'hunt', true); fewer('datacentre', USUAL, 'check', 'abft'); fewer('datacentre', USUAL, 'check', 'range');
  /* a wider margin never lets more through */
  for (const env of X.ENVIRONMENT_IDS) {
    let last = Infinity;
    for (const margin of X.leverOf('margin').values) { const t = run(env, { margin }).bySource.timing.silent; assert.ok(t < last, env + ' margin ' + margin); last = t; }
  }
});

test('finding is not fixing: a check that only detects turns silent answers into caught ones, and retrying fixes what was caught', () => {
  for (const env of X.ENVIRONMENT_IDS) {
    for (const [id, v] of [['memory', 'parity'], ['logic', 'lockstep']]) {
      const a = run(env, {}), b = run(env, { [id]: v });
      assert.ok(b.perBillion.caught > a.perBillion.caught && b.perBillion.silent < a.perBillion.silent, env + ' ' + v);
    }
    /* a pair that compares stops about twice as often as one copy is wrong: either copy can be the wrong one */
    const one = run(env, { margin: 0.3 }).bySite.logic, two = run(env, { margin: 0.3, logic: 'lockstep' }).bySite.logic;
    near(two.caught, 2 * (one.silent + one.masked), 0.02, env + ': two copies are wrong twice as often');
    const r = run(env, { ...USUAL, logic: 'lockstep', retry: true });
    assert.equal(r.perBillion.caught, 0);
    assert.equal(r.perBillion.silent, run(env, { ...USUAL, logic: 'lockstep' }).perBillion.silent, 'retrying never sees a silent answer');
  }
  /* error-correcting memory fixes what parity only finds */
  const p = run('datacentre', { memory: 'parity' }).bySite.memory, e = run('datacentre', { memory: 'ecc' }).bySite.memory;
  assert.ok(e.fixed > 0 && p.fixed === 0 && e.caught < p.caught && e.silent < p.silent);
});

test('protection at the wrong level does not catch errors from another level', () => {
  const same = (a, b, msg) => near(a || 1e-300, b || 1e-300, 1e-12, msg);
  for (const env of X.ENVIRONMENT_IDS) for (const from of [{}, USUAL]) {
    const a = run(env, from), with_ = (id, v) => run(env, { ...from, [id]: v });
    /* codes on memory see no logic; copies of the logic see no memory (every copy reads the same wrong word) */
    for (const v of ['parity', 'ecc']) for (const k of KINDS) { same(with_('memory', v).bySite.logic[k], a.bySite.logic[k], env + ' ' + v + ' logic ' + k); same(with_('memory', v).bySite.machine[k], a.bySite.machine[k], env + ' ' + v + ' machine'); }
    for (const v of ['lockstep', 'tmr']) for (const k of KINDS) same(with_('logic', v).bySite.memory[k], a.bySite.memory[k], env + ' ' + v + ' memory ' + k);
    /* self-test and the fleet's hunt find copies wrong for good, never a flip from radiation */
    for (const s of ['alpha', 'neutron']) for (const k of KINDS) same(with_('selftest', true).bySource[s][k], a.bySource[s][k], env + ' self-test ' + s);
    if (ENV_HALL(env)) for (const s of ['alpha', 'neutron']) same(with_('hunt', true).bySource[s].silent, a.bySource[s].silent, env + ' hunt ' + s);
    /* the margin reaches only timing; low-alpha materials only alpha particles; hardened cells only radiation */
    for (const s of X.SOURCES) if (s !== 'timing') same(with_('margin', 0.3).bySource[s].silent, a.bySource[s].silent, env + ' margin ' + s);
    for (const s of X.SOURCES) if (s !== 'alpha') same(with_('materials', 'lowAlpha').bySource[s].raw, a.bySource[s].raw, env + ' low alpha ' + s);
    for (const s of X.LASTING) same(with_('cells', 'hardened').bySource[s].raw, a.bySource[s].raw, env + ' hardened ' + s);
    /* nothing reaches a machine that stops but retrying */
    for (const L of X.LEVERS) for (const v of L.values) if (L.id !== 'retry' && !X.problem(env, { ...from, [L.id]: v })) same(with_(L.id, v).bySource.crash.caught, a.bySource.crash.caught, env + ' ' + L.id);
  }
  /* an AI's checks do nothing for a car's control loop, which is not an AI's arithmetic: they only cost */
  for (const v of ['range', 'abft']) {
    const a = run('car', USUAL), b = run('car', { ...USUAL, check: v });
    assert.equal(b.perBillion.silent, a.perBillion.silent); assert.ok(b.cost.time > a.cost.time);
  }
  /* a fleet to hunt in exists only in a hall */
  for (const env of ['phone', 'car', 'space']) assert.equal(X.problem(env, { hunt: true }), 'hunt');
});
const ENV_HALL = env => X.ENVIRONMENTS[env].hall;

test('three voting copies fix one fault but not two; two copies find one and fix none', () => {
  assert.deepEqual([0, 1, 2, 3].map(X.vote), ['right', 'right', 'wrong', 'wrong']);
  for (const p of [1e-9, 1e-6, 1e-3, 0.1]) {
    const t = X.copies('tmr', p), l = X.copies('lockstep', p);
    near(t.silent, 3 * p * p - 2 * p ** 3, 1e-12, 'wrong when two or three copies are');
    near(t.fixed, 3 * p * (1 - p) ** 2, 1e-12, 'fixed when exactly one is');
    assert.equal(t.caught, 0);
    near(l.caught, 2 * p - p * p, 1e-12, 'caught when either copy is'); assert.equal(l.fixed, 0); assert.equal(l.silent, 0);
    assert.equal(X.copies('none', p).silent, p);
    for (const c of [t, l]) near(c.fixed + c.caught + c.silent, c.raw, 1e-12, 'every answer with a wrong copy ends somewhere');
    near(t.raw, 1 - (1 - p) ** 3, 1e-6, 'three copies are wrong three times as often');
  }
  /* so voting squares a small chance: ten times rarer faults, a hundred times rarer wrong answers */
  near(X.copies('tmr', 1e-7).silent / X.copies('tmr', 1e-6).silent, 0.01, 1e-5, 'the square');
  /* but a fault every copy shares passes them all */
  near(X.copies('tmr', 1e-6, X.COMMON).silent, X.COMMON * 1e-6, 1e-3, 'a shared fault');
  near(X.copies('lockstep', 1e-6, X.COMMON).silent, X.COMMON * 1e-6, 1e-12, 'a shared fault');
  /* in space, where flips are thousands of times more common, voting fixes almost all of them and a pair stops instead */
  const v = run('space', { ...USUAL, logic: 'tmr' }), l = run('space', { ...USUAL, logic: 'lockstep' });
  assert.ok(v.bySource.neutron.silent < run('space', USUAL).bySource.neutron.silent / 1e5);
  assert.ok(l.perBillion.caught > 2 * v.perBillion.caught);
});

test('the Hamming code: SECDED fixes one flipped bit and finds two, parity finds one and misses two', () => {
  assert.deepEqual([0, 1, 2].map(b => X.memoryOutcome('ecc', b)), ['right', 'fixed', 'caught']);
  assert.deepEqual([0, 1, 2, 3].map(b => X.memoryOutcome('parity', b)), ['right', 'caught', 'silent', 'caught']);
  assert.deepEqual([1, 2].map(b => X.memoryOutcome('none', b)), ['silent', 'silent']);
  /* its price: 8 check bits for 64 (facts.json secded-72) */
  assert.match(FACTS['secded-72'].value, /8 check bits for every 64/);
  assert.equal(X.COST.memory.ecc.bits, 8 / 64);
});

test('known cases: the life engine, the satellite, the training run and the server fleet', () => {
  /* with no protection and no tolerance, radiation gives the wrong answers per hour that src/engines/life.js gives */
  for (const env of ['phone', 'car', 'datacentre']) {
    const r = run(env, {}), h = X.ENVIRONMENTS[env].seconds / 3600, M = MISSIONS[env];
    const perHour = (r.bySource.alpha.raw + r.bySource.neutron.raw) / 1e9 / h;
    near(perHour, live(env).silent / M.fleet / 8760, 1e-9, env + ': the life engine');
    near(perHour, FIT_PER_MBIT * M.mem * 1e-9 * VULNERABLE * (1 + LOGIC_SHARE), 1e-9, env + ': its numbers');
  }
  /* a satellite's memory in low Earth orbit flipped about 4 × 10⁻⁷ times per bit per day (facts.json space-upsets) */
  assert.match(FACTS['space-upsets'].value, /4 × 10⁻⁷ flips per bit per day/);
  const s = run('space', {}), E = X.ENVIRONMENTS.space, days = E.seconds / 86400;
  near((s.bySite.memory.raw / 1e9) / VULNERABLE / (E.mbit * 1e6) / days, 4.04e-7, 0.01, 'flips per bit per day in orbit');
  assert.ok(X.SPACE_FLUX > 1000, 'thousands of times sea level');
  /* Llama 3: 419 unexpected interruptions in 54 days on 16,384 GPUs (facts.json llama3-interruptions) */
  assert.match(FACTS['llama3-interruptions'].value, /419 unexpected interruptions in 54 days on 16,384 GPUs/);
  const d = run('datacentre', {}), hd = X.ENVIRONMENTS.datacentre.seconds / 3600;
  near(d.bySource.crash.raw / 1e9 / hd * 54 * 24 * 16384, 419, 0.01, 'stops in the training run');
  /* one device in a thousand computes wrong silently in a server fleet (facts.json sdc-rate, mercurial-cores), one chip
     in a million is allowed in a car (car-ppm) */
  assert.match(FACTS['sdc-rate'].value, /one in a thousand/); assert.equal(X.DEFECT.server, 1e-3);
  assert.match(FACTS['car-ppm'].value, /1 bad chip per million/); assert.equal(X.DEFECT.car, 1e-6);
  /* about half of the flips at sea level come from alpha particles (alpha-share), ten times fewer with low-alpha
     materials (low-alpha) */
  assert.match(FACTS['alpha-share'].value, /about as many/); assert.equal(X.ALPHA_SHARE, 0.5);
  assert.match(FACTS['low-alpha'].value, /ten or more times less/); assert.equal(X.LOW_ALPHA_LEFT, 0.1);
  const lo = run('datacentre', { materials: 'lowAlpha' }), hi = run('datacentre', {});
  near(lo.bySource.alpha.raw / hi.bySource.alpha.raw, 0.1, 1e-12, 'low alpha');
  near(hi.bySource.alpha.raw, hi.bySource.neutron.raw, 1e-12, 'alpha and neutrons alike at sea level');
  /* an AI's answer changes for 0.4% to 7% of single flips (facts.json dnn-bitflip): the engine's share lies inside */
  assert.match(FACTS['dnn-bitflip'].value, /0\.4% to 7%/);
  assert.ok(X.AI_MATTERS >= 0.004 && X.AI_MATTERS <= 0.072);
  const ai = run('datacentre', { margin: 0.3 }).bySite.memory;
  near(ai.silent / (ai.silent + ai.masked), X.AI_MATTERS, 1e-9, 'the share of flips an AI does not shrug off');
});

test('known case: a car\'s brakes need every one of error-correcting memory, a margin, two copies and self-test to stay under 10 FIT', () => {
  /* ISO 26262 at ASIL D: under 10 failures in a billion hours, 99% of single faults caught (facts.json asil-d) */
  assert.match(FACTS['asil-d'].value, /Under 10 failures in a billion hours, with at least 99% of single faults caught/);
  near(1 - X.COMMON, 0.99, 1e-12, 'what two copies let through is what ISO 26262 lets through');
  const asil = { memory: 'ecc', margin: 0.3, logic: 'lockstep', selftest: true };
  assert.ok(run('car', asil).fit.silent < 10, 'all four: ' + run('car', asil).fit.silent);
  assert.ok(run('car', {}).fit.silent > 1e5, 'none');
  for (const [id, v] of [['memory', 'none'], ['margin', 0.2], ['logic', 'none'], ['selftest', false]]) {
    const r = run('car', { ...asil, [id]: v });
    assert.ok(r.fit.silent > 10, 'without ' + id + ': ' + r.fit.silent);
  }
});

test('being right costs energy, on the energy puzzle\'s scale', () => {
  /* the data centre's answer is the budget engine's answer, in the same joules */
  const r = run('datacentre', {});
  near(r.cost.plainJoules, budget(JOB, RUN).total, 1e-9, 'the same answer'); near(r.cost.joules, r.cost.plainJoules, 1e-12, 'no protection, no cost');
  near(X.ENVIRONMENTS.datacentre.seconds, budget(JOB, RUN).seconds, 1e-12, 'the same time');
  /* where moving data dominates, copies of the logic are cheap in energy and dear in area; codes on memory are the
     reverse: the energy puzzle's shares, seen from the other side */
  const tmr = run('datacentre', { logic: 'tmr' }), ecc = run('datacentre', { memory: 'ecc' });
  assert.ok(tmr.cost.energy < 1.05 && tmr.cost.area > 2, 'three copies in a data centre: ' + tmr.cost.energy);
  assert.ok(ecc.cost.energy > tmr.cost.energy && ecc.cost.area < tmr.cost.area);
  /* in a car's control loop, where the arithmetic is the work, three copies cost about three times the logic's energy */
  assert.ok(run('car', { logic: 'tmr' }).cost.energy > 1.5);
  /* a margin is free in time while the chip waits for memory, and slows a loop that computes */
  near(run('datacentre', { margin: 0.3 }).cost.time, 1, 1e-9, 'memory-bound');
  near(run('car', { margin: 0.3 }).cost.time, 1.3, 1e-6, 'compute-bound');
});

test('a plan from anyone is checked before it is run, and an attempt is scored on every side', () => {
  const bad = [['moon', {}, 'env'], [null, {}, 'env'], ['__proto__', {}, 'env'], ['toString', {}, 'env'], ['car', { memory: 'magic' }, 'memory'], ['car', { margin: 0.12 }, 'margin'],
    ['car', { margin: '0.3' }, 'margin'], ['car', { logic: 'quad' }, 'logic'], ['car', { selftest: 'yes' }, 'selftest'], ['car', { retry: 1 }, 'retry'],
    ['car', { cells: 'gold' }, 'cells'], ['car', { materials: 'lead' }, 'materials'], ['car', { check: 'pray' }, 'check'], ['phone', { hunt: true }, 'hunt'], ['datacentre', { hunt: 'on' }, 'hunt']];
  for (const [env, plan, why] of bad) {
    const r = X.errors(env, plan);
    assert.equal(r.ok, false, JSON.stringify([env, plan])); assert.equal(r.why, why, JSON.stringify([env, plan]));
    assert.equal(X.score(env, plan).ok, false);
  }
  const a = X.score('datacentre', USUAL), b = X.score('datacentre', { ...USUAL, check: 'range' }), c = X.score('datacentre', { ...USUAL, logic: 'tmr' });
  assert.ok(a.ok && a.silent > 0 && a.energy > 1 && a.where);
  assert.ok(!X.beats(b, a) && !X.beats(a, b), 'quieter but slower: neither beats the other');
  /* a check that cannot help where it is pulled only costs: the plan without it beats the plan with it */
  assert.ok(X.beats(X.score('car', USUAL), X.score('car', { ...USUAL, check: 'abft' })));
  assert.ok(!X.beats(a, a), 'nothing beats itself');
  const p = X.pull('datacentre', USUAL, 'logic', 'tmr');
  assert.ok(p.silent < 0.1 && p.energy > 1 && p.energy < 1.05);
  assert.ok(c.silent < a.silent);
  /* every lever value runs in some place */
  for (const L of X.LEVERS) for (const v of L.values) assert.ok(X.ENVIRONMENT_IDS.some(env => X.errors(env, { [L.id]: v }).ok), L.id + ' ' + v);
});
