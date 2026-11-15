/* The Substrate engine's first piece: a 1 passed along a chain survives only where each part restores it. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cascade, NOISES, HIGH, LOW } from '../src/engines/substrate.js';
import { exhaust, WIDTHS, RATES, YEAR } from '../src/engines/floor.js';

test('parts with gain and a threshold hand a clear 1 down a chain of ten, at every level of noise', () => {
  for (const noise of NOISES) { const r = cascade({ restoring: true, noise }); assert.equal(r.reads, 'one', 'noise ' + noise); assert.equal(r.levels.length, 11); assert.ok(r.levels.every(v => v >= 0 && v <= 1)); }
});
test('parts that only pass the signal on lose the 1 within ten steps, even with little noise', () => {
  for (const noise of NOISES) { const r = cascade({ restoring: false, noise }); assert.notEqual(r.reads, 'one', 'noise ' + noise); }
  /* and the loss is gradual: the first step still reads as a 1 */
  assert.ok(cascade({ restoring: false, noise: NOISES[0], stages: 1 }).end >= HIGH);
  assert.ok(LOW < HIGH);
});
test('trying every case: an adder of b bits has 2^(2b) pairs of inputs, and the time is that over the rate', () => {
  assert.equal(exhaust(8, 1e6).pairs, 65536);
  assert.equal(exhaust(16, 1e9).pairs, 4294967296);
  assert.ok(Math.abs(exhaust(32, 1e12).years - Math.pow(2, 64) / 1e12 / YEAR) < 1e-6);
  for (const b of WIDTHS) for (const r of RATES) assert.ok(Number.isFinite(exhaust(b, r).seconds));
  /* a 64-bit adder at a trillion tries a second takes far longer than any lifetime */
  assert.ok(exhaust(64, 1e12).years > 1e18);
});
