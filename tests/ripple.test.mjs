import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVERS, INDICATORS, RULES, PRESETS, PUZZLES } from '../src/data/ripple.js';
import { ripple, order, topicHeads, chain, fmt, NEUTRAL } from '../src/engines/ripple.js';
import { TOPICS } from '../src/data/topics.js';
import facts from '../src/data/facts.json' with { type: 'json' };

const topicIds = new Set(TOPICS.map(t => t.id));
const ind = new Set(INDICATORS.map(i => i.id));

test('the model is well formed: known topics, known indicators, no loops, sourced levers', () => {
  INDICATORS.forEach(i => assert.ok(topicIds.has(i.topic), i.id + ' sits on unknown topic ' + i.topic));
  assert.equal(ind.size, INDICATORS.length, 'indicator ids are unique');
  RULES.forEach(r => { assert.ok(ind.has(r[0]) && ind.has(r[1]), 'rule ' + r[0] + ' → ' + r[1]); assert.ok(r[3] && r[4], 'rule has a label and a reason'); });
  LEVERS.forEach(l => { assert.ok(ind.has(l.ind)); assert.ok(l.min <= 0 && l.max >= 0, 'today (0) is in range'); assert.ok(!RULES.some(r => r[1] === l.ind), 'nothing feeds a lever'); });
  const ids = new Set(facts.facts.map(f => f.id));
  LEVERS.forEach(l => l.facts.forEach(f => assert.ok(ids.has(f), 'lever ' + l.id + ' cites missing fact ' + f)));
  assert.equal(order().length, INDICATORS.length);
  assert.throws(() => order([['a', 'b', 1], ['b', 'a', 1]], [{ id: 'a' }, { id: 'b' }]), /loop/);
  /* Every derived indicator can be reached from some lever. */
  const neutral = ripple(NEUTRAL); Object.values(neutral.v).forEach(v => assert.equal(v, 0));
  const all = ripple(Object.fromEntries(LEVERS.map(l => [l.id, l.max])));
  INDICATORS.forEach(i => assert.notEqual(all.v[i.id], 0, i.id + ' never moves'));
});

test('directions match what happened', () => {
  const squeeze = ripple({ demand: 60, hbm: -10 }).v;
  assert.ok(squeeze.memprice > 0 && squeeze.devprice > 0, 'AI demand raises memory and device prices (2026)');
  assert.ok(squeeze.aiship < 0, 'with HBM short, shipments follow the scarcer input');
  assert.ok(squeeze.memprofit > squeeze.memprice, 'profits move faster than prices');
  const cars = ripple({ mature: -15 }).v;
  assert.ok(cars.cars < 0 && cars.fabinvest > 0, 'mature shortage stops cars and pays for fabs (2021)');
  assert.equal(cars.aicompute, 0, 'and leaves AI computing alone');
  const late = ripple({ node: 3 }).v;
  assert.ok(late.perfw < 0 && late.rivals > 0 && late.archgain > 0, 'a late node costs efficiency and opens a gap for rivals');
  const power = ripple({ elec: 100 }).v;
  assert.ok(power.costtoken > 5 && power.costtoken < 10, 'doubling power raises the cost of an answer by about 7%, not 100%');
  /* Quantum computing is not an answer to any of these levers. */
  assert.ok(!INDICATORS.some(i => i.topic === 'quantum'));
});

test('heads, chains and formatting', () => {
  const res = ripple({ demand: 60 });
  const heads = topicHeads(res);
  assert.equal(heads.compute.lever, true);
  assert.ok(heads.everywhere && heads.everywhere.id === 'devprice');
  const ch = chain(res, 'devprice');
  assert.deepEqual(ch.map(c => c.id), ['aidemand', 'memtight', 'memprice', 'devprice']);
  assert.equal(ch[0].s, null); assert.ok(ch.slice(1).every(c => c.s));
  assert.ok(res.depth.devprice > res.depth.memprice && res.depth.aidemand === 0);
  assert.equal(fmt(12.4, '%'), '+12%'); assert.equal(fmt(-3.36, '%'), '−3.4%'); assert.equal(fmt(2, 'yr'), '+2 yr');
});

test('every preset changes something, and every puzzle can be solved', () => {
  PRESETS.forEach(p => { const L = { ...NEUTRAL, ...p.set }; assert.ok(Object.values(ripple(L).v).some(v => v !== 0), p.id); });
  const grid = LEVERS.map(l => { const vals = []; for (let v = l.min; v <= l.max + 1e-9; v += l.step) vals.push(Math.round(v * 10) / 10); return vals; });
  PUZZLES.forEach(pz => {
    let found = false;
    /* Try each lever alone, then pairs: enough for every puzzle here. */
    for (let i = 0; i < LEVERS.length && !found; i++) for (const a of grid[i]) {
      const L = { ...NEUTRAL, [LEVERS[i].id]: a }; if (pz.ok(L, ripple(L).v)) { found = true; break; }
      for (let j = i + 1; j < LEVERS.length && !found; j++) for (const b of grid[j]) { const M = { ...L, [LEVERS[j].id]: b }; if (pz.ok(M, ripple(M).v)) { found = true; break; } }
    }
    assert.ok(found, 'puzzle ' + pz.id + ' has a solution');
    assert.ok(!pz.ok({ ...NEUTRAL }, ripple(NEUTRAL).v), 'puzzle ' + pz.id + ' is not solved at today\'s levels');
  });
});
