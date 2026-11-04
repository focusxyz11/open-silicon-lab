// Quantum search: the squares on screen must be the exact state, and every claim on the page must hold.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { start, flip, mirror, run, chance, bestSteps, noisy, plain, sample, seeded, logicalError, physicalQubits, THRESHOLD, noisyAmps } from '../src/engines/grover.js';

test('flip and mirror match the exact formula and keep the total chance at 1', () => {
  for (const N of [4, 8, 16, 32, 64]) for (let k = 0; k <= 12; k++) {
    const a = run(N, k, 1);
    assert.ok(Math.abs(a[1] ** 2 - chance(N, k)) < 1e-9, `N ${N}, k ${k}`);
    assert.ok(Math.abs(a.reduce((s, v) => s + v * v, 0) - 1) < 1e-9);
  }
});

test('four boxes need exactly one step, and mirroring first does nothing', () => {
  assert.ok(Math.abs(run(4, 1, 2)[2] ** 2 - 1) < 1e-12);
  assert.deepEqual(mirror(start(8)).map(v => +v.toFixed(9)), start(8).map(v => +v.toFixed(9)));
  assert.deepEqual(flip(flip(start(4), 1), 1), start(4));
});

test('one step too many makes it worse', () => {
  assert.equal(bestSteps(8), 2);
  assert.ok(chance(8, 2) > 0.94 && chance(8, 3) < 0.34);
  assert.deepEqual([4, 8, 16, 32, 64].map(bestSteps), [1, 2, 3, 4, 6]);
});

test('about a million boxes take about 800 steps, against about half a million checks', () => {
  assert.equal(Math.round(Math.PI / 4 * Math.sqrt(2 ** 20)), 804);
  assert.ok(chance(2 ** 20, 804) > 0.99);
  assert.equal(2 ** 19, 524288);
});

test('a look lands on each box as often as its square says', () => {
  const r = seeded(5), p = run(16, 3, 4).map(v => v * v); let h = 0;
  for (let i = 0; i < 100000; i++) if (sample(p, r) === 4) h++;
  assert.ok(Math.abs(h / 100000 - p[4]) < 0.005);
});

test('noise pulls every box back to a guess, and the million-box goal has a real answer', () => {
  assert.equal(noisy(1, 16, 3, 0), 1);
  assert.ok(Math.abs(noisy(1, 16, 400, 0.5) - 1 / 16) < 1e-9);
  const bestAt = e => { let b = 0; for (let k = 0; k <= 804; k += 2) b = Math.max(b, noisy(chance(2 ** 20, k), 2 ** 20, k, e)); return b; };
  assert.ok(bestAt(0.0005) > 0.5 && bestAt(0.002) < 0.5);
  const a = noisyAmps(run(16, 3, 2), 3, 0.1); assert.ok(Math.abs(a.reduce((s, v) => s + v * v, 0) - 1) < 1e-9);
});

test('plain checking opens boxes and then guesses', () => {
  assert.equal(plain(4, 1), 0.5); assert.equal(plain(16, 15), 1); assert.equal(plain(16, 0), 1 / 16);
});

test('below the threshold copies help; above it they hurt', () => {
  assert.ok(logicalError(0.001, 11) < logicalError(0.001, 3));
  assert.ok(logicalError(0.01, 7) > logicalError(0.01, 3));
  assert.ok(Math.abs(logicalError(THRESHOLD, 11) - 0.03) < 1e-12);
  assert.equal(physicalQubits(11), 441);
});
