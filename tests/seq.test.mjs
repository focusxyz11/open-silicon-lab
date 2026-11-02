import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, srLatch, dLatch, latchAndFlop, zeroState, counter, timing, runCounter, delays } from '../src/engines/seq.js';

test('two NOR gates remember a bit: set, hold, reset, hold', () => {
  const C = srLatch(), S = simulate(C, { stim: { S: [[0, 0], [100, 1], [400, 0], [1000, 0]], R: [[0, 0], [700, 1], [1100, 0]] }, tEnd: 1600 });
  assert.equal(S.at('Q', 50), 'x', 'unknown at power-on, before anything sets it');
  assert.equal(S.at('Q', 390), 1, 'set');
  assert.equal(S.at('Q', 690), 1, 'still 1 after S goes back to 0: it remembers');
  assert.equal(S.at('Q', 1090), 0, 'reset');
  assert.equal(S.at('Q', 1600), 0, 'still 0: it remembers');
  assert.equal(S.at('Qn', 690), 0);
});

test('setting and resetting at once, then letting go together, makes the latch oscillate', () => {
  const C = srLatch(), S = simulate(C, { stim: { S: [[0, 1], [500, 0]], R: [[0, 1], [500, 0]] }, tEnd: 3000 });
  assert.equal(S.at('Q', 400), 0); assert.equal(S.at('Qn', 400), 0);
  assert.ok(S.waves.Q.filter(([t]) => t > 500).length > 5, 'Q keeps flipping after both are released together');
});

test('a latch follows D while enabled; a flip-flop changes only just after the clock rises', () => {
  const C = latchAndFlop(), D = delays();
  /* clock: rises at 1000, falls at 2000, rises at 3000. D rises at 1400 (clock high), falls at 2400 (clock low). */
  const S = simulate(C, { stim: { CLK: [[0, 0], [1000, 1], [2000, 0], [3000, 1]], D: [[0, 0], [1400, 1], [2400, 0]] }, init: zeroState(C), tEnd: 4000 });
  assert.equal(S.at('aq', 1900), 1, 'latch: transparent while the clock is 1, so Q follows D at once');
  assert.equal(S.at('flq', 1900), 0, 'flip-flop: D changed after the edge, so Q waits');
  assert.equal(S.at('aq', 2900), 1, 'latch holds while the clock is 0, even though D fell');
  assert.equal(S.at('flq', 2900), 0, 'flip-flop still holds');
  assert.equal(S.at('flq', 3900), 0, 'at the next edge the flip-flop takes D, which is 0 again');
  /* every change of the flip-flop's Q comes just after a rising clock edge */
  for (const [t] of S.waves.flq.slice(1)) assert.ok([1000, 3000].some(e => t > e && t < e + 3 * D.NOR + D.AND + D.NOT), 'Q changed at ' + t);
});

test('the counter counts at a safe clock and makes mistakes when the clock outruns its slowest path', () => {
  for (const node of ['180', '130', '28', '3']) {
    const T = timing(4, node);
    const ok = runCounter({ node, hz: T.fmaxHz * 0.8, cycles: 20 });
    assert.equal(ok.errors, 0, node + ': no errors at 80% of the predicted top speed: ' + ok.values.join(','));
    assert.deepEqual(ok.values.slice(0, 17), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0, 1]);
    const bad = runCounter({ node, hz: T.fmaxHz * 1.6, cycles: 20 });
    assert.ok(bad.errors > 0, node + ': errors at 160% of the predicted top speed');
  }
});

test('the predicted top speed is close to where the simulated counter starts failing', () => {
  const T = timing(4, '130');
  let lo = T.fmaxHz * 0.5, hi = T.fmaxHz * 2;
  for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (runCounter({ hz: m, cycles: 34 }).errors) hi = m; else lo = m; }
  const ratio = lo / T.fmaxHz;
  assert.ok(ratio > 0.9 && ratio < 1.6, 'simulated limit / predicted = ' + ratio.toFixed(2) + ' (the prediction is the safe, slightly pessimistic side)');
});

test('a faster process gives a faster counter', () => {
  const f = ['180', '130', '28', '3'].map(n => timing(4, n).fmaxHz);
  for (let i = 1; i < f.length; i++) assert.ok(f[i] > f[i - 1]);
  assert.ok(counter(8).gates.length > counter(4).gates.length);
});
