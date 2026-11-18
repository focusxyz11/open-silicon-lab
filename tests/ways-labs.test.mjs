// The labs of two new ways to compute (src/v2/labs/cim.js, grover.js): what they draw is what the engines compute,
// and their goals are the engines' own checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/engines/paradigms.js';
import * as G from '../src/engines/grover.js';
import * as C from '../src/v2/labs/cim.js';
import * as Q from '../src/v2/labs/grover.js';

test('compute in memory: the cells drawn are the cells the engine sums', () => {
  for (const o of [C.START, { seed: 7, w: 6, n: 0.1, adc: 9 }, { seed: 9, w: 3, n: 0, adc: 4 }]) {
    const st = C.settings(o), g = C.cells(st.W, st), fine = P.crossbar(st.W, st.x, Object.assign({}, st, { adcBits: 24 })).analog;
    for (let j = 0; j < C.COLS; j++) assert.ok(Math.abs(st.x.reduce((s, x, i) => s + g[i][j] * x, 0) - fine[j]) < 1e-4, 'column ' + j);
  }
});

test('compute in memory: the start is not a win, each of the three faults can be met, and a cheapest converter exists', () => {
  assert.equal(P.checkCimBits(C.settings(C.START)), false);
  assert.equal(C.verdict(C.settings(C.START)), 'cells');
  assert.equal(C.verdict(C.settings({ seed: 5, w: 8, n: 0.15, adc: 10 })), 'noise');
  assert.equal(C.verdict(C.settings({ seed: 5, w: 8, n: 0.03, adc: 4 })), 'coarse');
  assert.equal(C.verdict(C.settings({ seed: 5, w: 8, n: 0.03, adc: 10 })), 'spare');
  assert.equal(C.verdict(C.settings({ seed: 5, w: 8, n: 0.03, adc: 7 })), 'fewest');
  const E = C.energy(7); assert.ok(Math.abs(E.move + E.math - E.digital) < 1e-9 && Math.abs(E.array + E.conv - E.analog) < 1e-9);
  assert.ok(E.move > 5 * E.math, 'moving the numbers costs more than the arithmetic');
  assert.ok(C.energy(12).analog > C.energy(12).digital, 'a fine enough converter costs more than it saves');
});

test('quantum search: the peak must be seen before the fall, and noise hides the peak', () => {
  const run = (ln, ks) => ks.map(k => ({ k, p: Q.chanceAt(k, Q.noiseOf(ln)) }));
  assert.equal(Q.met(run(-4, [0, 1, 2])), false, 'the peak alone is not the goal');
  assert.equal(Q.met(run(-4, [0, 1, 2, 3])), true);
  assert.equal(Q.met(run(Q.START.ln, [0, 1, 2, 3, 4, 5, 6])), false, 'with the noise it starts with, the peak is never seen');
  assert.equal(Q.met(run(-4, [0, 1, 2]).concat(run(-0.5, [2]))), false, 'noise at the peak is not a step more');
  assert.equal(Q.met(run(-0.5, [3]).concat(run(-4, [0, 1, 2]))), false, 'a low chance seen before the peak does not count');
  const a = Q.amps(2, 0.05, 3); assert.ok(Math.abs(a[3] ** 2 - Q.chanceAt(2, 0.05)) < 1e-9);
  assert.ok(Q.prizeOf(11) >= 0 && Q.prizeOf(11) < Q.N && G.bestSteps(Q.N) < Q.MAX);
});
