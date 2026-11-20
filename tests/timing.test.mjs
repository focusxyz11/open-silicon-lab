// Timing (src/engines/timing.js): does a design give its answers before the next tick? These tests keep the engine
// honest: the chain it finds is the longest, it agrees with the tiny-chip engine's own count, the slack has the
// right sign, and a chain copied in a row grows as a real adder's carry does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import { build, solutionOf, starterOf, PROJECTS } from '../src/engines/design.js';
import { longestChain, timeNetlist, timeDesign, chained, overhead, periodOf, mhzOf, WIRE_PS } from '../src/engines/timing.js';

const B = p => build({ p, code: solutionOf(p) || starterOf(p), slice: solutionOf('alu') });

test('the longest chain is a real chain of cells, and its time is the sum of their delays', () => {
  for (const p of PROJECTS) {
    const D = B(p), C = longestChain(D.M);
    assert.ok(C.cells.length >= 1, p);
    assert.ok(Math.abs(C.cells.reduce((a, c) => a + c.ps, 0) - C.logic) < 1e-6, p + ': the chain adds up');
    for (let k = 1; k < C.cells.length; k++) assert.ok(D.M.cells[C.cells[k].i].ins.includes(D.M.cells[C.cells[k - 1].i].out), p + ': each cell feeds the next');
    assert.ok(C.from && C.to, p);
  }
});

test('it agrees with the tiny-chip engine on the longest delay, for logic without flip-flops', () => {
  for (const p of ['half', 'vote', 'full', 'add2', 'seg', 'alu', 'select', 'parity']) {
    const D = B(p);
    assert.ok(Math.abs(longestChain(D.M).logic - D.st.crit) < 1e-6, p + ': ' + longestChain(D.M).logic + ' vs ' + D.st.crit);
  }
});

test('the half adder: one XOR, and it makes a slow clock easily but not an impossible one', () => {
  const D = B('half'), C = longestChain(D.M);
  assert.deepEqual(C.cells.map(c => c.type), ['XOR2']);
  assert.equal(C.logic, TC.LIB.XOR2[2] + WIRE_PS);
  const slow = timeNetlist(D.M, periodOf(66)), fast = timeNetlist(D.M, 200);
  assert.ok(slow.meets && slow.slack > 0);
  assert.ok(!fast.meets && fast.slack < 0);
  assert.equal(slow.arrival, C.logic + overhead());
  assert.ok(Math.abs(slow.fmax - mhzOf(slow.arrival)) < 1e-9);
});

test('a finer process is faster, in proportion to its cells', () => {
  const D = B('full'), a = timeNetlist(D.M, 1000, '130'), b = timeNetlist(D.M, 1000, '28');
  assert.ok(b.arrival < a.arrival);
  assert.ok(Math.abs(b.arrival / a.arrival - TC.NODE['28'].dly / TC.NODE['130'].dly) < 1e-9);
});

test('a clocked design is timed from flip-flop to flip-flop', () => {
  const D = B('count'), C = longestChain(D.M);
  assert.ok(C.to.reg, 'the counter\'s longest chain ends at a flip-flop');
});

test('copied in a row, the carry sets the speed: 32 full adders are far slower than one', () => {
  const D = B('full'), one = timeNetlist(D.M, periodOf(66)), row = chained(D, 32, 'cin', 'cout', periodOf(66));
  assert.ok(row.arrival > 8 * one.arrival);
  assert.equal(row.one, TC.pathDelay(D.M, '130', 'cin', 'cout'));
  assert.equal(chained(D, 32, 'nope', 'cout', 1000), null);
});

test('the core is timed as its 32-slice adder, the same way the design engine counts it', () => {
  const D = B('core'), T = timeDesign(D, periodOf(66));
  assert.equal(T.copies, 32);
  assert.equal(T.arrival, D.st.crit);
  assert.ok(T.fmax < 200 && T.fmax > 20, 'a ripple-carry core at 130 nm runs at tens of MHz: ' + T.fmax);
  assert.equal(timeDesign(null, 1), null);
});
