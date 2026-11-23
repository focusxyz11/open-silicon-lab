/* The program nobody can judge (src/engines/halt.js): one gate from any material, a bit that remembers, and an agent
   that runs programs on the lab's RISC-V core for a budget and guesses. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as HL from '../src/engines/halt.js';
import RV from '../src/engines/riscv.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();

test('stage 1: the same two choices make the same four gates in every material; one of them is NAND', () => {
  const names = [];
  for (const j of HL.JOINS) for (const o of HL.OUTS) names.push(HL.nameOf(j, o));
  assert.deepEqual(names.sort(), ['and', 'nand', 'nor', 'or']);
  assert.ok(HL.isNand('series', 'invert'));
  assert.equal(HL.JOINS.flatMap(j => HL.OUTS.map(o => HL.isNand(j, o))).filter(Boolean).length, 1);
  assert.deepEqual(HL.table('series', 'invert').map(r => r.got), [1, 1, 1, 0]);
  for (const m of HL.MEDIA) { assert.ok(('halt.m.' + m) in EN); for (const j of HL.JOINS) assert.ok(('halt.join.' + m + '.' + j) in EN); for (const o of HL.OUTS) assert.ok(('halt.out.' + m + '.' + o) in EN && ('halt.cap.' + m + '.' + o) in EN); }
  for (const n of names) assert.ok(('halt.msg.' + n) in EN, n);
});

test('stage 1: two NANDs fed back hold a bit after the push is let go; without feedback they forget', () => {
  assert.deepEqual(HL.push(0, 'set', true), { during: 1, after: 1 });
  assert.deepEqual(HL.push(1, 'reset', true), { during: 0, after: 0 });
  assert.deepEqual(HL.push(1, 'set', true).after, 1);
  assert.deepEqual(HL.push(0, 'set', false), { during: 1, after: 0 });
  assert.equal(HL.settle(1, 0, 0, true).q, 1); assert.equal(HL.settle(0, 0, 0, true).q, 0);
  assert.ok(HL.remembers({ set: true, reset: true })); assert.ok(!HL.remembers({ set: true }));
});

test('stage 2: the blocks become a program the RISC-V core assembles', () => {
  for (const b of HL.BLOCKS) assert.ok(('halt.blk.' + b) in EN && ('halt.blk.' + b + '.s') in EN, b);
  const P = [{ b: 'count', n: 100000 }, { b: 'ask' }, { b: 'loop' }, { b: 'stop' }];
  const A = HL.assemble(P);
  assert.deepEqual(A.errs, []);
  assert.equal(A.lines.length, A.src.split('\n').length);
  assert.deepEqual(RV.assemble(A.src).errs, []);
  assert.equal(HL.normal(P.concat(P)).length, HL.MAX_BLOCKS);
  assert.deepEqual(HL.normal([{ b: 'count', n: 7 }, { b: 'nope' }]), [{ b: 'count', n: 100 }]);
});

test('stage 2: what really happens is counted on the core, and the agent sees only up to its budget', () => {
  const short = HL.judge([{ b: 'count', n: 100 }, { b: 'stop' }], 1000);
  assert.equal(short.says.verdict, 'stops'); assert.ok(short.real.stops); assert.equal(short.fooled, false);
  assert.equal(short.real.steps, short.says.steps);
  assert.equal(short.real.a0, 100);
  const long = HL.judge([{ b: 'count', n: 1000 }, { b: 'stop' }], 1000);
  assert.equal(long.says.verdict, 'never'); assert.ok(long.real.stops && long.real.steps > 1000); assert.ok(long.fooled);
  const loop = HL.judge([{ b: 'loop' }], 1000);
  assert.equal(loop.says.verdict, 'never'); assert.equal(loop.real.stops, false); assert.equal(loop.fooled, false);
  assert.equal(HL.judge([], 100).says.verdict, 'stops');
  /* a longer count fools it, and a bigger budget sees through the same program */
  assert.equal(HL.judge([{ b: 'count', n: 1000 }], 10000).fooled, false);
});

test('stage 2: the program that asks about itself and does the opposite fools the agent at every budget', () => {
  for (const P of [[{ b: 'ask' }], [{ b: 'count', n: 10 }, { b: 'ask' }]]) {
    const ev = HL.everyBudget(P);
    assert.equal(ev.length, HL.BUDGETS.length);
    assert.ok(ev.every(x => x.fooled), JSON.stringify(ev));
    const r = HL.judge(P, 1000);
    assert.equal(r.says.verdict, 'never'); assert.ok(r.real.stops); assert.ok(r.asks);
  }
});

test('stage 2: the goals, in order', () => {
  let t = {};
  t = HL.after(t, HL.judge([{ b: 'count', n: 100 }], 1000)); assert.equal(t.fool, null);
  t = HL.after(t, HL.judge([{ b: 'count', n: 1000 }, { b: 'stop' }], 1000)); assert.equal(t.fool, 1000); assert.equal(t.more, false);
  t = HL.after(t, HL.judge([{ b: 'count', n: 1000 }], 100)); assert.equal(t.more, false, 'a smaller budget is not more');
  t = HL.after(t, HL.judge([{ b: 'count', n: 10000 }], 10000)); assert.equal(t.more, true);
  assert.equal(HL.met(t), false);
  t = HL.after(t, HL.judge([{ b: 'ask' }], 100)); assert.equal(t.self, true);
  assert.equal(HL.met(t), true);
  for (const g of HL.GOALS) assert.ok(('halt.goal.' + g) in EN, g);
});
