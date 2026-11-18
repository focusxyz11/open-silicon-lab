/* The energy budget of one answer (src/engines/budget.js), the engine of the energy puzzle (content/puzzles/energy.md):
   never wrong in direction, never below the floor, and matching the cases its sources give. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as B from '../src/engines/budget.js';
import { E16 } from '../src/engines/paradigms.js';
import { perOp, landauer } from '../src/engines/floor.js';
import { model, START } from '../src/engines/chip.js';
import { energyPerToken, ENERGY_DEFAULTS } from '../src/engines/aiserve.js';
import { CHALLENGES } from '../src/v2/game.js';
import { DEPTHS } from '../src/data/weave.js';

const FACTS = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const run = (plan, job) => { const b = B.budget(job, plan); assert.ok(b.ok, JSON.stringify(plan) + ': ' + b.why); return b; };
const near = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) <= tol, msg + ': ' + a + ' against ' + b + ' (within ' + tol * 100 + '%)');

test('every level is a depth of the data centre\'s dive, and every part is never negative', () => {
  for (const l of B.LEVELS) assert.ok(DEPTHS[l], l);
  for (const plan of [{}, { batch: 64 }, { home: 'sram', cim: true }, { precision: 'fp4', clock: 0.5 }]) {
    const b = run(plan);
    for (const l of B.LEVELS) for (const k of B.PARTS) assert.ok(b.levels[l][k] >= 0, l + ' ' + k);
    const sum = B.LEVELS.reduce((a, l) => a + b.levels[l].total, 0);
    near(sum, b.total, 1e-12, 'the levels add up to the total');
    near(B.PARTS.reduce((a, k) => a + b.parts[k], 0), b.total, 1e-12, 'the parts add up to the total');
  }
});

test('at low reuse, moving data off the chip dominates the answer', () => {
  const b = run({});
  assert.equal(B.where(b).level, 'board');
  assert.equal(B.where(b).part, 'move');
  assert.ok(b.levels.board.move > 10 * (b.levels.gate.compute + b.levels.atom.compute), 'far more to fetch than to compute');
  assert.ok(b.parts.move > b.parts.compute * 50);
});

test('reuse, closer memory, compute in memory and lower precision each lower the total', () => {
  const base = run({}).total;
  assert.ok(run({ batch: 16 }).total < base, 'batching users reuses every number fetched');
  assert.ok(run({}, { reuse: 8 }).total < base, 'a job that reuses its numbers');
  assert.ok(run({ home: 'sram' }).total < base, 'memory on the chip');
  assert.ok(run({ home: 'dram' }).total > base, 'memory chips on the board cost more than stacks beside the chip');
  assert.ok(run({ cim: true }).total < base, 'compute in memory');
  assert.ok(run({ precision: 'fp8' }).total < base && run({ precision: 'fp4' }).total < run({ precision: 'fp8' }).total, 'fewer bits');
  assert.ok(run({ pue: 1.1 }).total < base, 'less cooling');
  assert.ok(run({ optics: 'cpo' }).total < base, 'optics beside the switch');
  /* and more reuse never costs more */
  let last = Infinity;
  for (const batch of [1, 2, 4, 16, 64, 256, 1024]) { const t = run({ batch }).total; assert.ok(t < last, 'batch ' + batch); last = t; }
});

test('half the clock at the lowest voltage that runs saves energy, and costs no time while the chip waits for memory', () => {
  const fast = run({ clock: 3 }), slow = run({ clock: 1.5 });
  assert.ok(slow.volt < fast.volt);
  assert.ok(slow.total < fast.total);
  near(slow.seconds, fast.seconds, 1e-9, 'memory-bound: the same time');
  /* with users batched until the arithmetic is the limit, the slower clock is slower */
  assert.ok(run({ clock: 1.5, batch: 1024 }).seconds > run({ clock: 3, batch: 1024 }).seconds * 1.5);
  /* and below the lowest voltage, leakage takes over: a slower clock no longer saves */
  assert.ok(run({ clock: 0.5 }).levels.switch.heat > run({ clock: 1.5 }).levels.switch.heat);
});

test('the best fixes cross levels: a lever saves a little alone and a lot with others', () => {
  const save = (lever, plan = {}) => 1 - run({ ...plan, ...lever }).total / run(plan).total;
  const alone = save({ cim: true }), together = save({ cim: true }, { home: 'sram', batch: 64 });
  assert.ok(alone < 0.05, 'compute in memory alone, while the memory chips dominate: ' + alone);
  assert.ok(together > 3 * alone, 'with the numbers on the chip and reused: ' + together);
  const all = run({ home: 'sram', precision: 'fp8', batch: 64, cim: true, clock: 1.5, pue: 1.1, optics: 'cpo' });
  assert.ok(all.total < run({}).total / 1000, 'every lever together, more than a thousand times less');
});

test('nothing goes below the floor', () => {
  const plans = [{}];
  for (const L of B.LEVERS) for (const v of L.values) plans.push({ [L.id]: v }, { home: 'sram', batch: 4096, precision: 'fp4', cim: true, [L.id]: v });
  for (const p of plans) {
    const b = B.budget(B.JOB, p); if (!b.ok) continue;
    assert.ok(b.total > b.floor && b.times > 1, JSON.stringify(p));
    assert.ok(b.levels.atom.compute === b.floor);
  }
  /* even a job with no data to move pays the floor for its arithmetic */
  const lone = run({ cim: true, home: 'sram' }, { ops: 1e6, bytes: 0, reuse: 1 });
  assert.ok(lone.total >= lone.floor);
  assert.equal(run({}, { ops: 0, bytes: 0, reuse: 1 }).total, 0);
});

test('known cases: the 45 nm table, the Landauer limit and the floor engine', () => {
  /* Pedram et al. (facts.json energy-moving-data): reading 16 bits from DRAM costs about 3,500 times a 16-bit add */
  assert.match(FACTS['energy-moving-data'].value, /3,500/);
  const one = run({ home: 'dram', volt: 0.75 }, { ops: 0, bytes: 2, reuse: 1 });
  near(one.levels.board.move / (E16.add * 1e-12), 3500, 0.05, 'a number from DRAM against an add');
  /* on-chip memory costs 8 to 11 pJ per 16-bit read: about sixty times less than DRAM */
  const chip = run({ home: 'sram', volt: 0.75 }, { ops: 0, bytes: 2, reuse: 1 });
  assert.ok(chip.levels.chip.move >= 8e-12 && chip.levels.chip.move <= 11e-12 * 1.001);
  /* the floor per bit is Landauer's, about 3 zJ at room temperature (facts.json landauer-measured) */
  assert.match(FACTS['landauer-measured'].value, /3 zJ/);
  const f = run({}, { ops: 1, bytes: 0, reuse: 1 });
  near(f.floor / 288, 3e-21, 0.05, 'the floor for each bit a 16-bit multiply-add erases');
  near(f.floor / 288, landauer(300), 1e-12, 'from the floor engine');
  /* the arithmetic alone is a million times the floor, as the floor engine says of the starting chip */
  near((f.levels.gate.compute + f.levels.atom.compute) / f.floor, perOp(model(START)).mathTimes, 0.05, 'the arithmetic against the floor');
});

test('known case: the server and the hall take the shares the energy-per-token lab gives them', () => {
  for (const pue of [1.1, 1.2, 1.5]) {
    const b = run({ pue }), ept = energyPerToken({ ...ENERGY_DEFAULTS, pue });
    const outside = b.levels.building.total + b.levels.rack.total + b.levels.board.heat;
    near(outside / b.total, 1 - ept.shares[0], 1e-9, 'pue ' + pue);
  }
});

test('measured answers from real services lie between the engine\'s plans: the engine is a 45 nm ruler, not a meter', () => {
  /* Google measured 0.24 Wh for a median text prompt (facts.json ai-prompt-energy); a 45 nm chip doing a 70-billion-parameter
     model's answer one user at a time is far above, and every lever pulled together far below */
  assert.match(FACTS['ai-prompt-energy'].value, /0\.24 Wh/);
  const wh = 0.24, base = run({}).total / 3600, all = run({ home: 'sram', precision: 'fp8', batch: 64, cim: true, clock: 1.5, pue: 1.1, optics: 'cpo' }).total / 3600;
  assert.ok(base > wh && all < wh, base + ' > ' + wh + ' > ' + all);
});

test('speed and accuracy, the other axes: fewer bits are faster and less accurate, batching is slower per answer once the arithmetic is the limit', () => {
  const a = run({}), b = run({ precision: 'fp4' });
  assert.ok(b.seconds < a.seconds && b.snrDb < a.snrDb);
  assert.ok(run({ batch: 4096 }).seconds > run({ batch: 1 }).seconds, 'a big batch waits for its arithmetic');
  assert.ok(run({ batch: 64 }).perSecond > run({ batch: 1 }).perSecond * 30);
  assert.ok(run({ home: 'dram' }).seconds > a.seconds, 'memory chips on the board are slower too');
});

test('every lever is a parameter of the plan, at a level of the dive, with a lab that is played there', () => {
  for (const L of B.LEVERS) {
    assert.ok(L.id in B.PLAN, L.id);
    assert.ok(B.LEVELS.includes(L.level), L.id);
    const c = CHALLENGES.find(x => x.id === L.lab); assert.ok(c, L.id + ': ' + L.lab);
    assert.equal(c.place, 'datacentre', L.id);
    for (const v of L.values) assert.ok(B.budget(B.JOB, { [L.id]: v }).ok, L.id + ' ' + v);
  }
  const p = B.pull(B.JOB, {}, 'cim', true);
  assert.ok(p.ratio < 1 && p.byLevel.gate === 0 && p.byLevel.building < 1, 'a lever pulled at one level changes the others');
});

test('a plan from anyone is checked before it is run', () => {
  const bad = [[{}, { home: 'cloud' }, 'home'], [{}, { precision: 'fp2' }, 'precision'], [{}, { clock: 9 }, 'clock'], [{}, { clock: 4, volt: 0.6 }, 'volt'],
    [{}, { volt: 2 }, 'volt'], [{}, { batch: 0 }, 'batch'], [{}, { batch: '64' }, 'batch'], [{}, { cim: 'yes' }, 'cim'], [{}, { adcBits: 40 }, 'adc'],
    [{}, { pue: 0.5 }, 'pue'], [{}, { optics: 'telepathy' }, 'optics'], [{ ops: -1 }, {}, 'job'], [{ reuse: 0 }, {}, 'job'], [{ bytes: NaN }, {}, 'job'],
    [{}, { home: '__proto__' }, 'home'], [{}, { precision: 'toString' }, 'precision']];
  for (const [job, plan, why] of bad) {
    const b = B.budget(job, plan);
    assert.equal(b.ok, false, JSON.stringify(plan)); assert.equal(b.why, why, JSON.stringify([job, plan]));
    assert.equal(B.score(job, plan).ok, false);
  }
  const s = B.score(B.JOB, { batch: 64 });
  assert.ok(s.ok && s.joules > 0 && Math.abs(s.wh * 3600 - s.joules) < 1e-9 && s.where.level);
});
