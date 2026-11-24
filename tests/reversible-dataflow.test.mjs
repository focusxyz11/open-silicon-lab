// Two new ways to compute as labs (#323): reversible logic at the switch (src/v2/labs/reversible.js) and dataflow at the
// chip (src/v2/labs/dataflow.js). The engines (src/engines/paradigms.js) behave like the physics they stand for, what the
// labs draw is what the engines compute, and their goals are the engines' own checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/engines/paradigms.js';
import * as R from '../src/v2/labs/reversible.js';
import * as D from '../src/v2/labs/dataflow.js';
import { matterOf } from '../src/data/inventions.js';
import { LAB_CHALLENGES } from '../src/data/labs/index.js';

const HALF = [{ t: 3, c: [0, 1] }, { t: 1, c: [0] }];
const FULL = HALF.concat([{ t: 3, c: [1, 2] }, { t: 2, c: [1] }]);

test('reversible: a gate of one, two or no controls is a Toffoli, and a circuit of them erases nothing', () => {
  for (let k = 0; k < 8; k++) { const i = [k >> 2 & 1, k >> 1 & 1, k & 1];
    assert.deepEqual(P.revStep([i[0], i[1], i[2], 0], { t: 2, c: [0, 1] }).slice(0, 3), P.toffoli(...i)); }
  assert.deepEqual(P.revStep([1, 0, 0, 0], { t: 1, c: [0] }), [1, 1, 0, 0], 'one control: CNOT');
  assert.deepEqual(P.revStep([0, 0, 0, 0], { t: 3, c: [] }), [0, 0, 0, 1], 'no control: NOT');
  assert.equal(P.gateOk({ t: 1, c: [1] }), false, 'a wire is not its own control');
  assert.equal(P.gateOk({ t: 0, c: [1, 2, 3] }), false, 'at most two controls');
  /* every input comes back when the gates are run in the other order: nothing was erased */
  const seen = new Set();
  for (let k = 0; k < 16; k++) { const i = [k >> 3 & 1, k >> 2 & 1, k >> 1 & 1, k & 1], o = P.revRun(FULL, i);
    seen.add(o.join('')); assert.deepEqual(P.revRun(FULL.slice().reverse(), o), i); }
  assert.equal(seen.size, 16, 'the circuit is a one-to-one map of its 16 states');
});

test('reversible: the half adder is right on half the inputs, two Toffoli and two CNOT make a full adder', () => {
  assert.equal(P.revAdder(HALF).right, 4); assert.equal(P.revAdder(HALF).ok, false);
  const A = P.revAdder(FULL); assert.equal(A.ok, true); assert.equal(A.sumWire, 2); assert.equal(A.carryWire, 3);
  assert.equal(P.revAdder([]).ok, false);
});

test('reversible: slower steps lose less without limit, pass under the floor of an adder that erases, and cost time', () => {
  let last = Infinity;
  for (const T of P.RAMPS) { const e = P.revEnergy(4, T); assert.ok(e.slow <= last); assert.ok(e.slow <= e.abrupt); last = e.slow; }
  assert.ok(Math.abs(P.revEnergy(4, 1e-12).saved - 1) < 1e-9, 'as fast as the wire itself: nothing saved');
  const slow = P.revEnergy(4, P.RAMPS[P.RAMPS.length - 1]);
  assert.ok(slow.slow < slow.floor, 'slow enough, it spends less than kT ln 2 for the bit an ordinary adder erases');
  assert.ok(P.revEnergy(4, 1e-9).slow > P.revEnergy(4, 1e-9).floor);
  assert.ok(Math.abs(slow.floor - P.landauer(300)) < 1e-30);
  assert.ok(Math.abs(P.revEnergy(4, 3e-10).time - 1.2e-9) < 1e-18, 'one step per gate');
});

test('reversible: the goal is the engine\'s check: the adder, 100 times less, and no faster ramp that does it', () => {
  const least = P.RAMPS.findIndex(T => P.checkReversibleLimit({ log10Time: Math.log10(T), V: P.REV_V }));
  assert.equal(P.RAMPS[least], 3e-10);
  assert.equal(P.checkReversibleAdder({ gates: FULL, ramp: least }), true);
  assert.equal(P.checkReversibleAdder({ gates: FULL, ramp: least - 1 }), false, 'too fast');
  assert.equal(P.checkReversibleAdder({ gates: FULL, ramp: least + 1 }), false, 'slower than it needs');
  assert.equal(P.checkReversibleAdder({ gates: HALF, ramp: least }), false, 'not an adder');
  /* the lab: its start is the half adder at the fastest ramp, not a win; the solution in its columns wins */
  const o = { cols: R.START_COLS.map(c => c.slice()), ramp: R.START.ramp };
  assert.deepEqual(R.validGates(o.cols), HALF);
  assert.equal(P.checkReversibleAdder(R.stateOf(o)), false);
  o.cols[2] = ['', 'c', 'c', 't']; o.cols[3] = ['', 'c', 't', '']; o.ramp = least;
  assert.equal(P.checkReversibleAdder(R.stateOf(o)), true);
  /* a column that is no gate is drawn red and left out */
  o.cols[4] = ['t', 't', '', '']; assert.ok(R.gatesOf(o.cols)[4].bad); assert.equal(P.checkReversibleAdder(R.stateOf(o)), true);
  /* the bits drawn on the wires are the engine's */
  const A = P.revAdder(R.validGates(o.cols));
  A.rows.forEach(r => assert.deepEqual(R.flowOf(o.cols, r.in)[R.COLS], r.out));
});

test('dataflow: kept on the chip a model costs a fraction of fetching it; one layer in ten off the chip takes most of it', () => {
  const whole = P.dataflowParts({ layers: 12, tiles: 24 });
  assert.equal(whole.fit, 1); assert.equal(whole.off, 0); assert.ok(whole.saves > 50);
  const asked = P.dataflowParts(D.ASKED);
  assert.ok(Math.abs(asked.fit - 0.9) < 1e-12, 'nine of ten layers on the chip');
  assert.ok(asked.offShare > 0.8, 'the tenth layer takes most of the energy: ' + asked.offShare);
  assert.ok(Math.abs(asked.on + asked.off - asked.uj) < 1e-9);
  assert.ok(P.dataflowParts({ layers: 13, tiles: 24 }).uj > 3 * whole.uj, 'one layer too many costs several times as much');
});

test('dataflow: the goal is the engine\'s check: the largest model the chip holds, with the layer beyond it tried', () => {
  const tried = [{ layers: 13, tiles: 24 }, { layers: 12, tiles: 24 }];
  assert.equal(P.checkDataflowEdge({ layers: 12, tiles: 24, tried }), true);
  assert.equal(P.checkDataflowEdge({ layers: 12, tiles: 24, tried: [{ layers: 12, tiles: 24 }] }), false, 'the layer beyond not tried');
  assert.equal(P.checkDataflowEdge({ layers: 11, tiles: 24, tried: tried.concat([{ layers: 12, tiles: 24 }]) }), false, 'not the largest');
  assert.equal(P.checkDataflowEdge({ layers: 13, tiles: 24, tried }), false, 'does not fit');
  assert.equal(P.checkSpatialFit(tried.map(c => ({ ...c, ...P.FLOW }))), true);
  /* the lab's start is no win; its picture puts each layer on two tiles and the rest in memory */
  assert.equal(P.checkDataflowEdge({ ...D.START, tried: [D.START] }), false);
  const L = D.layout(13, 24); assert.equal(L.tiles.filter(k => k >= 0).length, 24); assert.equal(L.offTiles, 2);
  assert.deepEqual(D.layout(2, 8).tiles, [0, 0, 1, 1, -1, -1, -1, -1]);
  const cells = new Set(Array.from({ length: 48 }, (_, i) => D.tileAt(i).join(','))); assert.equal(cells.size, 48, 'each tile has its own place');
});

test('both labs stand at their levels, and Machines opens the reversible lab from its kind of matter', () => {
  const ch = id => LAB_CHALLENGES.find(c => c.id === id);
  assert.equal(ch('reversible').at, 'switch'); assert.equal(ch('dataflow').at, 'chip');
  assert.equal(matterOf('reversible').lab, 'reversible');
});
