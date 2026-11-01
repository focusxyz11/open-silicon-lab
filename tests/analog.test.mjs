// Chips that touch the real world: the signal chain and the power model behave like the real thing
// in the ways the lab teaches, and every mission and job has an answer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/engines/analog.js';

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
    const b = A.best(m); assert.ok(b, m.id + ' has a passing setting');
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
