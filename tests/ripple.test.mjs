// What if? between the islands (src/data/ripple.js, src/engines/ripple.js): the model is well formed, every effect
// sits on a real island, the levers are sourced, and the directions match what happened. Brought over from the
// first version of the site, with its own tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVERS, INDICATORS, RULES, PRESETS, PUZZLES, ripple, order, placeHeads, reach, chain, fmt, NEUTRAL, solved, normalLevers } from '../src/engines/ripple.js';
import { PLACES } from '../src/v2/game.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8'));
const ind = new Set(INDICATORS.map(i => i.id));

test('the model is well formed: real islands, known effects, no loops, sourced levers, every word there', () => {
  INDICATORS.forEach(i => { assert.ok(PLACES.includes(i.place), i.id + ' sits on unknown place ' + i.place); assert.ok(EN['whatif.ind.' + i.id], i.id); });
  assert.equal(ind.size, INDICATORS.length, 'effect ids are unique');
  RULES.forEach(r => { assert.ok(ind.has(r[0]) && ind.has(r[1]), 'rule ' + r[0] + ' → ' + r[1]); assert.ok(EN['whatif.rule.' + r[0] + '.' + r[1]] && EN['whatif.why.' + r[0] + '.' + r[1]], 'rule words ' + r[0] + '.' + r[1]); });
  LEVERS.forEach(l => { assert.ok(ind.has(l.ind)); assert.ok(PLACES.includes(l.place)); assert.equal(INDICATORS.find(i => i.id === l.ind).place, l.place, l.id + ' sits where its effect is');
    assert.ok(l.min <= 0 && l.max >= 0, 'today (0) is in range'); assert.ok(!RULES.some(r => r[1] === l.ind), 'nothing feeds a lever'); assert.ok(EN['whatif.lever.' + l.id + '.t'] && EN['whatif.lever.' + l.id + '.d']); });
  const ids = new Set(facts.facts.map(f => f.id));
  LEVERS.forEach(l => l.facts.forEach(f => assert.ok(ids.has(f), 'lever ' + l.id + ' cites missing fact ' + f)));
  PRESETS.forEach(p => { assert.ok(EN['whatif.preset.' + p.id + '.t']); Object.keys(p.set).forEach(k => assert.ok(LEVERS.some(l => l.id === k), p.id)); });
  PUZZLES.forEach(p => assert.ok(EN['whatif.puzzle.' + p.id + '.t'] && EN['whatif.puzzle.' + p.id + '.done']));
  assert.equal(order().length, INDICATORS.length);
  assert.throws(() => order([['a', 'b', 1], ['b', 'a', 1]], [{ id: 'a' }, { id: 'b' }]), /loop/);
  Object.values(ripple(NEUTRAL).v).forEach(v => assert.equal(v, 0));
  const all = ripple(Object.fromEntries(LEVERS.map(l => [l.id, l.max])));
  INDICATORS.forEach(i => assert.notEqual(all.v[i.id], 0, i.id + ' never moves'));
});

test('directions match what happened', () => {
  const squeeze = ripple({ demand: 60, hbm: -10 }).v;
  assert.ok(squeeze.memprice > 0 && squeeze.devprice > 0, 'AI demand raises memory and device prices (2026)');
  assert.ok(squeeze.aiship < 0, 'with HBM short, shipments follow the scarcer input');
  assert.ok(squeeze.memprofit > squeeze.memprice, 'profits move faster than prices');
  const cars = ripple({ mature: -15 }).v;
  assert.ok(cars.cars < 0 && cars.fabinvest > 0, 'a mature shortage stops cars and pays for fabs (2021)');
  assert.equal(cars.aicompute, 0, 'and leaves AI computing alone');
  const late = ripple({ node: 3 }).v;
  assert.ok(late.perfw < 0 && late.rivals > 0 && late.archgain > 0, 'a late node costs efficiency and opens a gap for rivals');
  const power = ripple({ elec: 100 }).v;
  assert.ok(power.costtoken > 5 && power.costtoken < 10, 'doubling power raises the cost of an answer by about 7%, not 100%');
});

test('the islands it reaches: a lever lights its own island, and the light goes to the others it moves', () => {
  const L = { demand: 60 }, res = ripple(L), heads = placeHeads(res, L), R = reach(res, L);
  assert.ok(heads.datacentre.lever && heads.datacentre.top.id === 'aidemand');
  assert.ok(heads.phones && heads.phones.top.id === 'devprice', 'AI demand reaches the phones');
  assert.equal(R.demand.from, 'datacentre');
  assert.ok(R.demand.to.includes('phones') && R.demand.to.includes('port') && !R.demand.to.includes('datacentre'));
  const C = chain(res, 'devprice'); assert.equal(C[0].id, 'aidemand'); assert.equal(C[C.length - 1].id, 'devprice');
  C.slice(1).forEach(s => assert.ok(EN['whatif.rule.' + s.rule], s.rule));
  assert.equal(fmt(12.34, '%'), '+12%'); assert.equal(fmt(-3.44, '%'), '−3.4%'); assert.equal(fmt(1.5, 'yr'), '+1.5 yr');
});

test('every puzzle can be solved, and a setting is read back inside its levers', () => {
  const tries = { phones: { demand: 60 }, power: { elec: 100 }, answer: { hbm: -60 }, split: { mature: -15 } };
  PUZZLES.forEach(p => assert.ok(solved(tries[p.id]).includes(p.id), p.id));
  assert.deepEqual(solved({}), []);
  assert.deepEqual(normalLevers({ demand: 999, hbm: 'x', node: 1.3 }), { demand: 150, hbm: 0, elec: 0, node: 1.5, mature: 0 });
});
