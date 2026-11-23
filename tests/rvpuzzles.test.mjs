// Run your core (src/engines/rvpuzzles.js): every puzzle can be solved by running a program, the first start already
// works, the others do not, the multiplier is missing until the last puzzle, and the last asks for a better idea.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as RP from '../src/engines/rvpuzzles.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const SOLVE = {
  sum: RP.puzzleOf('sum').start,
  max: 'mv a0, a1\nbge a1, a2, done\nmv a0, a2\ndone:',
  mul: 'li a0, 0\nloop:\n beq a2, x0, done\n add a0, a0, a1\n addi a2, a2, -1\n j loop\ndone:',
  fib: 'li a0, 0\nli t1, 1\nloop:\n beq a1, x0, done\n add t2, a0, t1\n mv a0, t1\n mv t1, t2\n addi a1, a1, -1\n j loop\ndone:',
  fast: 'addi t1, a1, 1\nmul a0, a1, t1\nsrli a0, a0, 1'
};

test('every puzzle has its words and is solved by a program', () => {
  for (const P of RP.PUZZLES) {
    for (const k of ['.t', '.d']) assert.ok(('rv.p.' + P.id + k) in EN, P.id + k);
    assert.ok(('rv.ok.' + P.id) in EN && ('rv.hint.' + P.id) in EN, P.id);
    const r = RP.check(P.id, SOLVE[P.id]);
    assert.ok(r.ok, P.id + ': ' + JSON.stringify(r.cases.map(c => [c.got, c.want])));
    assert.ok(r.trace.length > 0 && r.trace.every(s => Array.isArray(s.x) && s.x.length === 32));
  }
});

test('only the first start already works; the slow way fails the last puzzle', () => {
  assert.ok(RP.check('sum', RP.puzzleOf('sum').start).ok);
  for (const id of ['max', 'mul', 'fib']) assert.ok(!RP.check(id, RP.puzzleOf(id).start).ok, id);
  const slow = RP.check('fast', RP.puzzleOf('fast').start);
  assert.ok(slow.cases.every(c => c.ok) && slow.slow && !slow.ok);
});

test('the core has no multiplier until the last puzzle, and every assembler error has its words', () => {
  const r = RP.check('mul', 'mul a0, a1, a2');
  assert.equal(r.errs[0].k, 'needM'); assert.ok(!r.ok);
  for (const k of ['label', 'twice', 'unknown', 'reg', 'num', 'range', 'operands', 'memop', 'needM']) assert.ok(('rv.err.' + k) in EN, k);
  assert.equal(RP.check('max', 'frob a0').errs[0].k, 'unknown');
});

test('a program that never stops is stopped, not run for ever', () => {
  const r = RP.check('max', 'loop:\n j loop');
  assert.ok(!r.ok && r.cases.every(c => c.err && c.err.k === 'loop'));
});

// Your own core (#321): the same programs on the core made of your ALU slice, side by side with the reference core.
const turn = (code, k) => { let i = -1; return code.replace(/[&|^]/g, m => (++i === k ? ({ '&': '|', '|': '^', '^': '&' })[m] : m)); };

test('a right slice: your core gives the reference core\'s answer on every puzzle and every job', () => {
  for (const P of RP.PUZZLES) {
    const r = RP.checkOn(P.id, SOLVE[P.id], null);
    assert.ok(r.ref.ok && r.yours.reads && r.yours.right, P.id);
    assert.ok(r.yours.same && !r.yours.fault, P.id);
    r.yours.cases.forEach((c, i) => assert.equal(c.got, r.ref.cases[i].got));
    /* the picture's steps: what went into the arithmetic unit, and every register afterwards */
    assert.ok(r.yours.trace.length && r.yours.trace.every(s => s.x.length === 32 && 'alu' in s && 'mem' in s));
  }
  for (const J of RP.JOBS) {
    for (const k of ['.t', '.d']) assert.ok(('rv.job.' + J.id + k) in EN, J.id + k);
    const r = RP.checkOn(J.id, J.start, null);
    assert.ok(r.ref.ok && r.yours.same, J.id);
  }
  /* a job that reads memory lights the memory on the way */
  assert.ok(RP.checkOn('wildfire', RP.jobOf('wildfire').start, null).yours.trace.some(s => s.mem === 'r'));
});

test('a wrong gate: your core gives a different answer, and the fault is shown', () => {
  /* the carry's AND turned into an OR: 1 + 1 still adds, 0 + 1 carries when it must not */
  const bad = turn(RP.SLICE_EXAMPLE, 2), r = RP.checkOn('sum', SOLVE.sum, bad);
  assert.ok(r.ref.ok, 'the reference core is not touched');
  assert.ok(r.yours.reads && !r.yours.right && r.yours.wrongRows > 0);
  assert.ok(!r.yours.same && r.yours.cases.some(c => !c.ok));
  const f = r.yours.fault;
  assert.ok(f && f.l >= 1 && f.op, 'the instruction');
  assert.notEqual(f.got, f.want, 'the wrong value, against the right one');
  assert.ok(f.alu && f.alu.got !== f.alu.want, 'what the arithmetic unit gave');
  assert.ok(f.slice && f.slice.bit >= 0 && f.slice.bit < 32, 'the slice');
  assert.ok(f.slice.got.y !== f.slice.want.y || f.slice.got.cout !== f.slice.want.cout);
  /* the slice blamed is the first in the chain that gave a wrong answer for what it was handed */
  const n = (RP.SLICE_EXAMPLE.match(/[&|^]/g) || []).length;
  let parted = 0, quiet = 0;
  for (let k = 0; k < n; k++) {
    const q = RP.checkOn('sum', SOLVE.sum, turn(RP.SLICE_EXAMPLE, k)).yours;
    if (!q.same) { parted++; assert.ok(q.fault && q.fault.slice, 'gate ' + k); }
    if (!q.right && q.same) quiet++;
  }
  assert.ok(parted >= 8, 'most wrong gates break the program');
  assert.ok(quiet >= 1, 'a wrong row this program never uses leaves its answer right');
});

test('a slice that does not read, and a slice that sends the program round for ever', () => {
  const r = RP.checkOn('sum', SOLVE.sum, 'y = a &&& b;');
  assert.ok(r.ref.ok && !r.yours.reads && r.yours.errs.length);
  const loop = RP.checkOn('sum', SOLVE.sum, turn(RP.SLICE_EXAMPLE, 0)).yours;
  assert.ok(loop.cases.every(c => c.err && c.err.k === 'loop') && loop.fault);
  /* a slice that answers 0 to everything: 1 + 1 is blamed on the first slice, which owed a carry */
  const z = RP.blame(new Uint8Array(64), 'add', 1, 1);
  assert.equal(z.bit, 0); assert.deepEqual([z.got.cout, z.want.cout], [0, 1]);
});
