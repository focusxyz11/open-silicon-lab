/* The Tune engine: a box you cannot open, learned by trying, and how far a note carries. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { machine, truth, run, rng, search, handover, GOOD, NOISE, BUDGET } from '../src/engines/tune.js';

const peak = M => { let b = [0]; for (let x = 0; x <= 10; x += 0.1) for (let y = 0; y <= 10; y += 0.1) for (let z = 0; z <= 10; z += 0.5) { const v = truth(M, x, y, z); if (v > b[0]) b = [v, x, y, z]; } return b; };

test('the box has one best setting near 100, a second-best patch, and results inside 0 to 100', () => {
  const M = machine(), [v, x, y, z] = peak(M);
  assert.ok(v > 99, 'best ' + v);
  assert.ok(truth(M, M.side.x, M.side.y, 5) > 50 && truth(M, M.side.x, M.side.y, 5) < GOOD, 'a patch good enough to hold you, not good');
  const R = rng(3); for (let i = 0; i < 200; i++) { const q = run(M, R() * 10, R() * 10, R() * 10, i, R); assert.ok(q >= 0 && q <= 100); }
});
test('the two dials work only together: turning one dial from the best loses most of it', () => {
  const M = machine(), [, x, y, z] = peak(M);
  assert.ok(truth(M, x + 1.5, y, z) < 60 && truth(M, x, y + 1.5, z) < 60);
});
test('the unlabelled dial moves everything; the box drifts with use; the twin is set differently', () => {
  const M = machine(), [, x, y, z] = peak(M);
  assert.ok(truth(M, x, y, z) - truth(M, x, y, z - 3) > 20, 'the third dial matters');
  assert.ok(truth(M, x, y, z, 200) < truth(M, x, y, z, 0) - 20, 'after 200 runs the old best is no longer best');
  assert.ok(truth(machine(true), x, y, z) < GOOD, 'the twin does not give its best at the same setting');
});
test('noise: the same setting gives different numbers, about NOISE apart', () => {
  const M = machine(), R = rng(5), q = Array.from({ length: 400 }, () => run(M, 5, 5, 5, 0, R)), m = q.reduce((a, b) => a + b) / q.length;
  const sd = Math.sqrt(q.reduce((a, b) => a + (b - m) ** 2, 0) / q.length);
  assert.ok(Math.abs(sd - NOISE) < 0.6, 'spread ' + sd);
});
test('a good note carries on this box; from nothing the program mostly fails; on the twin it takes longer', () => {
  const M = machine(), [, x, y, z] = peak(M), H = handover({ p: [x, y, z], trust: 0.5 });
  assert.ok(H.cold.share < 0.5 && H.cold.median === null);
  assert.ok(H.note.median != null && H.note.median <= 5);
  assert.ok(H.twin.median == null || H.twin.median > H.note.median);
  /* a search is repeatable */
  assert.deepEqual(search(M, { seed: 9 }).found, search(M, { seed: 9 }).found);
  assert.ok(search(M, { seed: 9 }).tries.length === BUDGET);
});
