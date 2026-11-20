// The two labs of the thinnest core questions: Six flaky parts (src/engines/redundancy.js, "Whole beats parts") and
// Learn on one chip, copy to a thousand (src/engines/mortal.js, "Brain or copy"). Each must be winnable, but not by
// doing the obvious thing, and must show its question's turn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../src/engines/redundancy.js';
import * as M from '../src/engines/mortal.js';

const plans = () => { const out = [], ids = R.BLOCKS.map(b => b.id);
  for (let i = 0; i < 3 ** ids.length; i++) { let k = i; const p = {}; ids.forEach(id => { p[id] = R.COPIES[k % 3]; k = Math.floor(k / 3); }); out.push(p); }
  return out; };

test('built once each, the whole is worse than any part; every copy everywhere does not fit', () => {
  const bare = R.evaluate(R.startPlan());
  assert.ok(bare.whole < bare.worst && !bare.met);
  const all5 = R.evaluate(Object.fromEntries(R.BLOCKS.map(b => [b.id, 5])));
  assert.ok(all5.area > R.GOAL.area && !all5.met);
});

test('a vote makes a flaky block better and a steady one worse: the voter is a part too', () => {
  assert.ok(R.blockOk(0.06, 3) > 0.94 && R.blockOk(0.06, 5) > R.blockOk(0.06, 3));
  assert.ok(R.blockOk(0.002, 3) < 0.998);
});

test('the goal can be met in more than one way, and every way beats the worst part', () => {
  const ok = plans().map(R.evaluate).filter(r => r.met);
  assert.ok(ok.length >= 2 && ok.length <= 12, ok.length + ' plans meet the goal');
  for (const r of ok) assert.ok(r.beats && r.rows.find(x => x.id === 'mul').n > 1);
});

test('a thousand chips run for real fail about as often as the sum says', () => {
  const plan = Object.assign(R.startPlan(), { mul: 3, mem: 3, add: 3 }), rnd = R.rng(3), r = R.evaluate(plan);
  let bad = 0; for (let i = 0; i < 20000; i++) if (!R.trial(plan, rnd).ok) bad++;
  assert.ok(Math.abs(bad / 20000 - (1 - r.whole)) < 0.01, bad / 20000 + ' against ' + (1 - r.whole));
});

test('brain or copy: bits copy but cost; learning on the chip fits one chip; relearning on each copy meets the goal', () => {
  const dig = M.evaluate(M.start());
  assert.ok(dig.energy === 1 && dig.copied === M.EXACT && !dig.met);
  const brain = M.evaluate({ share: 0.9, learn: 'chip', calibrate: false });
  assert.ok(brain.own >= M.GOAL.own && brain.copied < M.GOAL.copied && brain.energy <= M.GOAL.energy);
  const blind = M.evaluate({ share: 0.9, learn: 'software', calibrate: false });
  assert.equal(blind.own, blind.copied); assert.ok(blind.own < M.GOAL.own);
  const met = M.SHARES.flatMap(share => ['software', 'chip'].flatMap(learn => [false, true].map(calibrate => ({ share, learn, calibrate })))).filter(o => M.evaluate(o).met);
  assert.ok(met.length >= 2 && met.every(o => o.calibrate && o.share >= 0.9));
  assert.ok(M.evaluate(met[0]).minutes > 0);
});

test('a fleet of copies spreads round the copied accuracy', () => {
  const o = { share: 1, learn: 'chip', calibrate: false }, F = M.fleet(o, 400, M.rng(5)), mean = F.reduce((s, v) => s + v, 0) / F.length;
  assert.ok(Math.abs(mean - M.evaluate(o).copied) < 1.5 && Math.min(...F) < Math.max(...F));
});
