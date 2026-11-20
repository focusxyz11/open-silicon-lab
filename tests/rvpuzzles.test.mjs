// Run your core (src/engines/rvpuzzles.js): every puzzle can be solved by running a program, the first start already
// works, the others do not, the multiplier is missing until the last puzzle, and the last asks for a better idea.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as RP from '../src/engines/rvpuzzles.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
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
