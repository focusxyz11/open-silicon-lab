/* The line's care at its stations (#513): set where it happens, kept in your stack, and the record, the stack's spread
   at the switch and its yield and cost at the chip follow. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepFine, stackKept } from '../src/v2/stack/keep.js';
import { recordOf } from '../src/engines/chiprecord.js';
import { carry, fineOf } from '../src/engines/path.js';
import { solutionOf } from '../src/engines/design.js';

const store = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const D = { p: 'alu', code: solutionOf('alu') };

test('setting the care at a station keeps it in your stack, and the record follows it', () => {
  const st = store();
  assert.equal(fineOf(stackKept(st)).care, 1, 'today\'s care until you change it');
  const R1 = recordOf(stackKept(st), D);
  keepFine(st, 'care', 0);
  assert.equal(fineOf(stackKept(st)).care, 0, 'kept');
  const R0 = recordOf(stackKept(st), D), at = (r, s) => r.made.find(m => m.step === s).chip;
  assert.equal(R0.care, 0);
  assert.ok(at(R0, 'print').spread > at(R1, 'print').spread, 'a lower dose spreads the copies');
  assert.ok(at(R0, 'deposit').specks > at(R1, 'deposit').specks, 'dirtier air, more specks');
  assert.ok(at(R0, 'test').test.yield < at(R1, 'test').test.yield, 'fewer whole dies');
  assert.ok(at(R0, 'etch').cells.some(c => c.stray) && !at(R1, 'etch').cells.some(c => c.stray), 'copies stray on a hurried line, not on today\'s');
  /* and the stack: the switch's spread and the chip's yield and cost, the same carry the stack view draws */
  const C0 = carry(stackKept(st)), C1 = recordOf(stackOf1(), D).used;
  assert.ok(C0.rungs.switch.hands.sigma > C1.rungs.switch.hands.sigma);
  assert.ok(C0.rungs.chip.hands.yield < C1.rungs.chip.hands.yield);
  assert.notEqual(C0.rungs.chip.hands.cost, C1.rungs.chip.hands.cost);
  assert.deepEqual(C0, R0.used, 'the stack and the record agree');
  keepFine(st, 'care', 2); assert.equal(recordOf(stackKept(st), D).care, 2);
});
const stackOf1 = () => stackKept(store());
