// Trust it or not (#497, src/engines/trigger.js): an agent's adder that passes your tests may hide a trigger on one
// rare input. Random testing misses it more and more as the adder widens; checking every input finds it, but only while
// the widths are small enough to afford.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as Z from '../src/engines/trigger.js';

test('a slice adds right everywhere but on its key, where one bit is flipped', () => {
  for (let s = 1; s <= 40; s++) for (const w of [4, 8]) {
    const sl = Z.slice(s, w), N = Math.pow(2, w);
    assert.deepEqual(Z.slice(s, w), sl, 'the same seed is the same slice');
    let wrong = 0;
    for (let a = 0; a < N; a += w === 4 ? 1 : 7) for (let b = 0; b < N; b += w === 4 ? 1 : 5) if (Z.add(sl, a, b) !== a + b) wrong++;
    if (!sl.hidden) assert.equal(wrong, 0, 'an honest slice is always right');
    else { assert.equal(Math.abs(Z.add(sl, sl.ka, sl.kb) - (sl.ka + sl.kb)), Math.pow(2, sl.bit), 'its key flips one bit'); assert.ok(wrong <= 1, 'and nothing else'); }
  }
});

test('over a thousand seeds: random testing misses more as the slice widens; every input catches all, while affordable', () => {
  const n = 1000, S = Z.WIDTHS.map(w => Z.survey(w, n));
  for (const s of S) assert.ok(s.hidden > 400 && s.hidden < 600, s.w + ': about half the seeds hide a trigger');
  /* random tests: most caught at 4 bits, few at 8, none above */
  const share = s => s.byTests / s.hidden;
  assert.ok(share(S[0]) > 0.9, '4 bits: a thousand random tests nearly always meet the key');
  assert.ok(share(S[1]) < 0.05, '8 bits: they nearly always miss it');
  assert.ok(S.slice(2).every(s => s.byTests === 0), '12 bits and up: they never meet it');
  for (let i = 1; i < S.length; i++) assert.ok(share(S[i]) <= share(S[i - 1]), 'the misses only grow with the width');
  /* the analytic chance agrees with the thousand seeds */
  for (const s of S.slice(0, 2)) assert.ok(Math.abs(share(s) - Z.catchChance(s.w, n)) < 0.05, s.w + ': the seeds agree with 1 - (1 - 1/4^w)^n');
  /* every input: certain at small widths, beyond the budget above them */
  for (const s of S) { if (s.affordable) assert.equal(s.byAll, s.hidden, s.w + ': every input catches every trigger'); else assert.equal(s.byAll, null); }
  assert.ok(S[0].affordable && S[1].affordable && !S[2].affordable && !S[4].affordable);
  for (let w = 4; w < 32; w += 4) assert.equal(Z.allCost(w + 4) / Z.allCost(w), 256, 'every input costs 256 times more for every four bits');
});

test('the gate view shows the comparator as extra gates, while the netlist is small enough to read', () => {
  for (let s = 1; s <= 30; s++) for (const w of Z.WIDTHS) {
    const sl = Z.slice(s, w), G = Z.gateView(sl);
    if (!G.affordable) { assert.ok(w >= 12 && (w >= 16 || sl.hidden), w + ': only wide netlists are beyond the budget (at 12 bits, only one with a trigger, whose extra gates push it over)'); continue; }
    assert.equal(G.extra, sl.hidden ? 4 * w : 0, 'a trigger adds 2w XNOR, 2w - 1 AND and one XOR');
  }
});

test('the round: won by rejecting every trigger and keeping every honest slice you could prove honest', () => {
  const R = Z.ROUND.map(r => Z.slice(r.seed, r.w)), right = {};
  R.forEach((sl, i) => { right[i] = sl.hidden ? 'reject' : 'accept'; });
  assert.ok(R.some(sl => sl.hidden && Z.checkable(sl)) && R.some(sl => sl.hidden && !Z.checkable(sl)), 'a trigger you can find, and one you cannot');
  assert.ok(R.some(sl => !sl.hidden && Z.checkable(sl)) && R.some(sl => !sl.hidden && !Z.checkable(sl)), 'an honest slice you can prove, and one you cannot');
  assert.ok(Z.verdict(right).won);
  /* trusting what you cannot check loses as soon as one of them hides a trigger */
  const trusting = Object.fromEntries(R.map((sl, i) => [i, Z.checkable(sl) ? right[i] : 'accept']));
  assert.ok(!Z.verdict(trusting).won && Z.verdict(trusting).trojans === 1);
  /* distrusting what you cannot check wins, at the cost of building it yourself */
  const careful = Object.fromEntries(R.map((sl, i) => [i, Z.checkable(sl) ? right[i] : 'reject']));
  assert.ok(Z.verdict(careful).won && Z.verdict(careful).rebuilt >= 1);
  /* rejecting an honest slice you could have proven is a wrong call */
  const fearful = Object.fromEntries(R.map((sl, i) => [i, 'reject']));
  assert.ok(!Z.verdict(fearful).won);
  assert.ok(!Z.verdict({}).done);
});

test('the engine says it is a teaching model, not an attack', () => {
  assert.match(readFileSync(new URL('../src/engines/trigger.js', import.meta.url), 'utf8'), /a teaching model, not an attack/);
  const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
  for (const id of ['design-conductor', 'llm-verilog-backdoor', 'trojangym']) assert.ok(facts.some(f => f.id === id && f.url && f.verified), id);
});
