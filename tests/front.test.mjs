// The block's open problem, live (#326): the front of Geometry and Efficiency fuels use (#315) takes attempts as ledger
// try entries (community/ledger/, src/engines/ledger.js FRONTS), each a point the front's model places on its chart
// (src/engines/lens.js geoEffFront). The ledger keeps them in order and checks their form; this replays them through the
// model, as the chart does, and holds the model to the block's own share of an answer.
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { collect } from '../scripts/ledger.mjs';
import { settle, checkEntry, frontAttemptsAt, FRONTS } from '../src/engines/ledger.js';
import { geoEffFront } from '../src/engines/lens.js';
import { MEETS } from '../src/data/frame.js';
import { budget, JOB, PLAN } from '../src/engines/budget.js';

const E = geoEffFront(), score = p => { const r = E.at(p.p, p.n); return { x: r.energy, y: r.heat }; };

test('every front the ledger takes is a front where two lenses meet, drawn by one model', () => {
  for (const k of Object.keys(FRONTS)) {
    const m = MEETS.find(x => x.a + '.' + x.b === k);
    assert.ok(m && m.shape === 'front' && m.front, k + ' is not a front of MEETS');
  }
});

test('the front is drawn in the block\'s own joules: what the block does moves only its share of the answer', () => {
  const b = budget(JOB, PLAN), blk = b.levels.block;
  assert.ok(Math.abs(E.today.energy - (blk.move + blk.compute)) < 1e-9, 'today the block spends its budget share');
  assert.ok(Math.abs(E.whole - b.total) < 1e-9, 'the whole answer is the budget engine\'s');
  for (const n of [0, 0.5, 1]) for (const p of [0, 0.5, 1]) { const r = E.at(p, n); assert.ok(r.energy > 0 && r.energy <= E.today.energy + 1e-9, p + ',' + n + ': nothing beats nothing'); }
  assert.ok(E.today.energy < E.whole / 100, 'the block is a sliver of the answer, never the whole of it');
});

test('attempts at the front are kept in the ledger, each a point the model places, the ones nothing beats on its front', () => {
  const W = settle(collect()), A = frontAttemptsAt(W, 'eff.geo', score);
  assert.ok(A.length >= 4, 'the examples are kept');
  assert.equal(readdirSync(new URL('../community/ledger/', import.meta.url)).filter(n => n.includes('-front')).length, A.length, 'every front file is an attempt kept');
  for (const a of A) {
    const r = E.at(a.plan.p, a.plan.n); assert.equal(a.x, r.energy); assert.equal(a.y, r.heat);
    const beaten = A.some(o => o !== a && o.x <= a.x && o.y <= a.y && (o.x < a.x || o.y < a.y));
    assert.equal(a.state === 'beaten', beaten, a.id + ' stands where the model puts it');
  }
  assert.ok(A.some(a => a.state === 'front'), 'something is on the ledger\'s front');
  assert.ok(A.some(a => a.made === 'ai') && A.some(a => a.made === 'example'), 'people, agents and examples are told apart');
});

test('a front attempt is checked for its form: a known front, two values in tenths, new among the attempts there', () => {
  const W = settle(collect());
  const base = { id: '2026-11-24-try-test-front-zz', kind: 'try', by: 'Tester', made: 'person', ai: '', words: '', front: 'eff.geo' };
  assert.equal(checkEntry({ ...base, front: 'moon', plan: { p: 0.2, n: 0.2 } }, W).reason, 'front');
  assert.equal(checkEntry({ ...base, plan: { p: 0.25, n: 0 } }, W).reason, 'plan', 'tenths only');
  assert.equal(checkEntry({ ...base, plan: { p: 2, n: 0 } }, W).reason, 'plan');
  assert.equal(checkEntry({ ...base, plan: { p: 0.2 } }, W).reason, 'plan');
  assert.equal(checkEntry({ ...base, plan: { p: 0.2, n: 0.1, q: 1 } }, W).reason, 'plan');
  assert.equal(checkEntry({ ...base, plan: { p: 0, n: 0 } }, W).reason, 'same', 'a point kept already');
  assert.equal(checkEntry({ ...base, plan: { p: 0.2, n: 0.1 }, chef: 'chip' }, W).reason, 'fields');
  assert.equal(checkEntry({ ...base, plan: { p: 0.2, n: 0.1 }, words: 'see https://example.com' }, W).reason, 'words');
  const ok = checkEntry({ ...base, plan: { p: 0.2, n: 0.1 } }, W); assert.ok(ok.ok);
  /* kept, it joins the chart: a point nothing kept so far beats is on the ledger's front */
  const W2 = settle(collect().concat({ ...base, plan: { p: 0.1, n: 1 } })), mine = frontAttemptsAt(W2, 'eff.geo', score).find(a => a.id === base.id);
  assert.ok(mine && mine.state === 'front');
});
