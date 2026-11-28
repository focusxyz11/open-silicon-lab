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

test('below threshold (#498): copies help until the part is too unreliable, then hurt; the threshold computed, not typed', async () => {
  const R = await import('../src/engines/redundancy.js'), { readFileSync } = await import('node:fs');
  const c = R.voterShare(2);
  const t3 = R.threshold(3, c), t5 = R.threshold(5, c);
  /* pinned for three and five copies with the voter's own error (a quarter of the adder's: its area over the adder's) */
  assert.ok(Math.abs(t3 - 0.3625) < 1e-3, 'three copies: ' + t3); assert.ok(Math.abs(t5 - 0.4193) < 1e-3, 'five copies: ' + t5);
  for (const [n, th] of [[3, t3], [5, t5]]) {
    assert.ok(1 - R.blockOkWith(th * 0.9, n, c) < th * 0.9, n + ' copies help just below their threshold');
    assert.ok(1 - R.blockOkWith(Math.min(0.49, th * 1.1), n, c) > Math.min(0.49, th * 1.1), n + ' copies hurt just above it');
  }
  /* a bigger voter against its block lowers the threshold; with a voter that never fails, copies help up to a half */
  assert.ok(R.threshold(3, R.voterShare(1)) < t3); assert.ok(R.threshold(3, 0) > 0.49);
  /* well below threshold, five copies beat three, which beat one */
  const at = n => 1 - R.blockOkWith(0.05, n, c); assert.ok(at(5) < at(3) && at(3) < at(1));
  /* the quantum points: each with its fact, the logical error below the physical one (below threshold) */
  const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
  for (const q of R.QUANTUM) { const f = facts.find(x => x.id === q.fact); assert.ok(f && f.url && f.verified, q.fact); assert.ok(q.logical < q.phys); assert.match(f.value, new RegExp(String(q.qubits))); }
  assert.ok(R.QUANTUM[1].logical < R.QUANTUM[0].logical && R.QUANTUM[1].qubits > R.QUANTUM[0].qubits, 'the larger code, further below');
  const words = JSON.parse(readFileSync(new URL('../src/i18n/en/labs.json', import.meta.url), 'utf8'));
  assert.match(words['rd.th.quantum'], /not a majority vote, only the same idea/);
});
