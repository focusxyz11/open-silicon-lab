// Chips that touch the real world (src/engines/analog.js): the signal chain and the power model behave like the real thing
// in the ways the lab teaches, every mission and job has an answer, and the three challenges are checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/engines/analog.js';
import { readWords } from '../scripts/words.mjs';
/* the words: the lab's own, ana.* in src/i18n/en/labs.json (the missions it does not play yet wait in
   src/data/waiting-words.json), and the challenges' in core.json */
const W = readWords();

const BEST = {};   // best() searches every setting; do it once per mission
const bestOf = m => (BEST[m.id] ??= A.best(m));

test('more bits and more samples make a truer copy, and cost more power', () => {
  const lo = A.capture('heartbeat', { gain: 100, bits: 6, rate: 200 }), hi = A.capture('heartbeat', { gain: 100, bits: 12, rate: 200 });
  assert.ok(hi.err < lo.err, 'more bits, less error'); assert.ok(hi.power.total > lo.power.total, 'more bits, more power');
  const slow = A.capture('voice', { gain: 10, bits: 10, rate: 3000 }), fast = A.capture('voice', { gain: 10, bits: 10, rate: 16000 });
  assert.ok(fast.err < slow.err); assert.ok(fast.power.total > slow.power.total);
});

test('too much gain clips, too little wastes the bits, and slow sampling aliases', () => {
  assert.ok(A.capture('heartbeat', { gain: 20000, bits: 10, rate: 200 }).clip > 0, 'clips');
  assert.ok(A.capture('heartbeat', { gain: 2, bits: 10, rate: 200 }).err > A.capture('heartbeat', { gain: 200, bits: 10, rate: 200 }).err, 'small gain leaves most codes unused');
  assert.equal(A.capture('vibration', { gain: 5, bits: 10, rate: 1000 }).aliased, true);
  assert.equal(A.capture('vibration', { gain: 5, bits: 10, rate: 3000 }).aliased, false);
});

test('every mission has an answer, and an everyday default is not it', () => {
  for (const m of A.MISSIONS) {
    const b = bestOf(m); assert.ok(b, m.id + ' has a passing setting');
    assert.ok(A.judge(m, b).pass);
    assert.equal(A.judge(m, A.capture(m.signal, { gain: 100, bits: 12, rate: 1000 })).pass, false, m.id + ': the default should not already pass');
  }
});

test('regulators: each job has a different best answer, for a reason', () => {
  const best = Object.fromEntries(A.JOBS.map(j => [j.id, A.bestReg(j).type]));
  assert.deepEqual(best, { wearable: 'buck', cpu: 'buck', adc: 'both', nearly: 'ldo' });
  const cpu = A.JOBS.find(j => j.id === 'cpu');
  assert.equal(A.runJob(cpu, 'ldo').pass, false, 'a linear regulator would cook at 3 A');
  const adc = A.JOBS.find(j => j.id === 'adc');
  assert.equal(A.runJob(adc, 'buck').pass, false, 'a buck alone is too noisy for a precise converter');
  const r = A.regulate('ldo', 3.7, 1.8, 0.01); assert.ok(Math.abs(r.eff - 1.8 / 3.7) < 0.01, 'an LDO is about Vout/Vin efficient');
});

test('the challenges are checks: met by the right choice, missed by an obvious wrong one', () => {
  const C = A.CHALLENGES, heart = A.MISSIONS.find(m => m.id === 'heart');
  const b = bestOf(heart);
  assert.equal(C.heart.check({ gain: b.gain, bits: b.bits, rate: b.rate }), true);
  assert.equal(C.heart.check({ gain: 100, bits: 12, rate: 1000 }), false);
  assert.equal(A.SLOWEST_BEARING_RATE, 3000);
  assert.equal(C.bearing.check({ gain: 5, bits: 10, rate: 3000 }), true);
  assert.equal(C.bearing.check({ gain: 5, bits: 10, rate: 1000 }), false, 'aliased');
  assert.equal(C.bearing.check({ gain: 5, bits: 10, rate: 5000 }), false, 'not the slowest');
  const right = Object.fromEntries(A.JOBS.map(j => [j.id, A.bestReg(j).type]));
  assert.equal(C.regulators.check(right), true);
  assert.equal(C.regulators.check({ ...right, cpu: 'ldo' }), false);
  assert.equal(C.regulators.check({}), false);
  for (const id of Object.keys(C)) assert.equal(C[id].id, id);
});

test('the hints name what is wrong, and the words are all there', () => {
  const m = A.MISSIONS.find(x => x.id === 'fault'), set = { gain: 5, bits: 10, rate: 1000 };
  const res = A.capture(m.signal, set);
  assert.equal(A.hintOf(m, res, A.judge(m, res), set), 'alias');
  const h = A.MISSIONS[0], s2 = { gain: 20000, bits: 10, rate: 200 }, r2 = A.capture(h.signal, s2);
  assert.equal(A.hintOf(h, r2, A.judge(h, r2), s2), 'clip');
  const cpu = A.JOBS.find(j => j.id === 'cpu');
  assert.equal(A.hintOfReg(cpu, 'ldo', A.runJob(cpu, 'ldo')), 'heat');
  assert.equal(A.hintOfReg(cpu, 'buck', A.runJob(cpu, 'buck')), 'best-buck');
  assert.equal(A.hintOfReg(A.JOBS.find(j => j.id === 'adc'), 'buck', A.runJob(A.JOBS.find(j => j.id === 'adc'), 'buck')), 'ripple');
  for (const m of A.MISSIONS) assert.ok(W['ana.mission.' + m.id] && W['ana.mission.' + m.id + '.why']);
  for (const j of A.JOBS) assert.ok(W['ana.job.' + j.id] && W['ana.job.' + j.id + '.why']);
  for (const t of A.TYPES) assert.ok(W['ana.reg.' + t] && W['ana.rh.best-' + t]);
  for (const k of ['alias', 'clip', 'levels', 'quality', 'power', 'done']) assert.ok(W['ana.hint.' + k]);
  /* the engine's challenges, as the lab plays them */
  const LAB = { heart: 'sig-heart', bearing: 'sig-bearing', regulators: 'reg-jobs' };
  for (const id of Object.keys(A.CHALLENGES)) for (const k of ['game.ch.' + LAB[id] + '.t', 'game.ch.' + LAB[id] + '.goal', 'ana.done.' + LAB[id]]) assert.ok(W[k], k);
});
