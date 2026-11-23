// Change your core (src/engines/corearch.js): the puzzles' programs timed again for a changed core, what each change
// buys and costs, and the goal reached by exactly one core, which no single change reaches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../src/engines/corearch.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();

test('every program gives the right answer on every core, and the plain core is the measure', () => {
  for (const c of C.ALL) { const m = C.measure(c); assert.ok(m.runs, JSON.stringify(c)); assert.ok(m.progs.every(p => p.ok && p.cycles > 0)); }
  const b = C.compare(C.PLAIN);
  assert.equal(b.speed, 1); assert.equal(b.areaX, 1); assert.equal(b.energyX, 1);
});

test('what each change buys and costs', () => {
  const b = C.compare(C.PLAIN), slow = C.compare({ mul: 'slow' }), fast = C.compare({ mul: 'fast' }), two = C.compare({ alus: 2 }), small = C.compare({ regs: 16 });
  /* a multiplier turns the loops into one instruction: faster on adding up, but a slow one loses on a small multiply */
  assert.ok(fast.speed > slow.speed && slow.speed > 1);
  assert.ok(slow.perProg.find(p => p.id === 'mul').speed < 1, 'the slow multiplier always takes 32 cycles');
  assert.ok(fast.areaX > 1.9 && slow.areaX < 1.1);
  /* a second unit pairs independent instructions: faster everywhere it can, never on a single multiply */
  assert.ok(two.speed > 1.3 && two.perProg.every(p => p.speed >= 1));
  assert.ok(C.measure({ alus: 2 }).progs.some(p => p.pairs > 0));
  /* half the registers: the same speed for less area and energy, since the programs use only x0 to x15 */
  assert.equal(small.speed, 1); assert.ok(small.areaX < 0.7 && small.energyX < 1);
  assert.ok(b.parts.alu === 32 * 148);
});

test('dual issue never pairs an instruction with one that needs its answer', () => {
  const e = (op, rd, rs1, rs2, f = 'R') => ({ e: { op, rd, rs1, rs2, f } });
  /* t2 = a0 + t1, then a0 = t2: dependent, two cycles; t2 = a0 + t1 and t0 = a1 + a2: independent, one */
  assert.equal(C.cyclesOf([e('add', 7, 10, 6), e('add', 10, 7, 0)], { alus: 2 }).cycles, 2);
  assert.equal(C.cyclesOf([e('add', 7, 10, 6), e('add', 5, 11, 12)], { alus: 2 }).cycles, 1);
  assert.equal(C.cyclesOf([e('add', 7, 10, 6), e('add', 5, 11, 12)], { alus: 1 }).cycles, 2);
  /* a branch ends the pair; a multiply takes its own cycles */
  assert.equal(C.cyclesOf([e('beq', 0, 10, 0, 'B'), e('add', 5, 11, 12)], { alus: 2 }).cycles, 2);
  assert.equal(C.cyclesOf([e('mul', 10, 11, 12)], { mul: 'slow' }).cycles, 32);
  assert.equal(C.cyclesOf([e('mul', 10, 11, 12)], { mul: 'fast' }).cycles, 1);
});

test('the goal is reached by one core only, and by no single change', () => {
  const won = C.ALL.filter(C.met);
  assert.deepEqual(won, [{ mul: 'slow', alus: 2, regs: 16 }]);
  for (const c of [{ mul: 'slow' }, { mul: 'fast' }, { alus: 2 }, { regs: 16 }]) assert.ok(!C.met(c), JSON.stringify(c));
  assert.ok(!C.met({ mul: 'slow', alus: 2 }), 'fast enough, but too big');
});

test('the picture of a run: instructions issued together on two units', () => {
  const one = C.issueOf('fib', { alus: 1 }), two = C.issueOf('fib', { alus: 2 });
  assert.ok(one.steps.every(s => !s.with) && two.steps.some(s => s.with));
  assert.ok(two.steps.length < one.steps.length);
  assert.equal(C.issueOf('sum', { mul: 'fast' }).steps.length, 3);
});

test('its words', () => {
  for (const k of C.MUL) assert.ok(('carch.mul.' + k) in EN, k);
  for (const k of ['speed', 'area', 'energy']) assert.ok(('carch.g.' + k) in EN, k);
  for (const p of C.PROGRAMS) assert.ok(('rv.p.' + p.id + '.t') in EN, p.id);
});
