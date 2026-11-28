// Build up, not out (#482, src/engines/tiers.js): tiers of silicon stacked until the heat stops you, memory put on the
// logic, coolant between tiers, and chiplets that beat the dust but pay for their links.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as Z from '../src/engines/tiers.js';

const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
const mid = B => B.T[B.memTier ? 1 + Math.floor((B.T.length - 1) / 2) : Math.floor(B.T.length / 2)];

test('more tiers shorten the wires but raise the middle tier\'s temperature', () => {
  let last = null;
  for (const tiers of Z.TIERS) {
    const B = Z.build({ tiers });
    if (last) { assert.ok(B.wire < last.wire && B.E.wire < last.E.wire, tiers + ': shorter wires, less energy in them'); assert.ok(mid(B) > mid(last), tiers + ': a hotter middle'); }
    last = B;
  }
  /* the wires' energy falls as one over the square root of the tiers */
  assert.ok(Math.abs(Z.build({ tiers: 4 }).E.wire - Z.E_WIRE1 / 2) < 1e-12);
});

test('coolant between tiers lowers the temperature, at the cost of pumping it', () => {
  for (const tiers of Z.TIERS.filter(n => n > 1)) for (const memOn of [false, true]) {
    const dry = Z.build({ tiers, memOn }), wet = Z.build({ tiers, memOn, cool: true });
    assert.ok(mid(wet) < mid(dry) && wet.hot < dry.hot, tiers + ' tiers: cooler');
    assert.ok(wet.pumpW > 0 && wet.watts > dry.watts, tiers + ' tiers: the pumps cost power');
  }
  /* even cooled, a stack too tall passes the limit: the heat stops you */
  assert.ok(!Z.build({ tiers: 8, memOn: true, cool: true }).ok);
});

test('splitting a large chip raises the share of good chips and adds link energy', () => {
  let last = null;
  for (const chiplets of Z.CHIPLETS) {
    const B = Z.build({ chiplets });
    if (last) { assert.ok(B.good > last.good, chiplets + ' chiplets: more good silicon'); assert.ok(B.E.link > last.E.link && B.topsPerW < last.topsPerW, chiplets + ' chiplets: the links cost energy'); }
    last = B;
  }
  assert.equal(Z.build({}).E.link, 0, 'one piece has no links');
});

test('memory on the logic saves the trip off the chip', () => {
  const beside = Z.build({}), on = Z.build({ memOn: true });
  assert.ok(on.E.mem < beside.E.mem / 3 && on.topsPerW > beside.topsPerW);
  assert.equal(on.T.length, 2, 'the memory is a tier of its own, under the logic');
});

test('the heat model is a steady state: every watt in leaves through the coolant or the board', () => {
  for (const o of Z.ALL) {
    const B = Z.build(o), fp = B.footprint, T = B.T, m = T.length, heatIn = B.logicW + (B.memTier ? B.memW : 0);
    let out = (T[m - 1] - Z.T_COOL) * fp / Z.R_SINK + (T[0] - Z.T_COOL) * fp / Z.R_BOARD;
    if (B.s.cool) for (let i = 0; i < m - 1; i++) out += (T[i] - Z.T_COOL) * fp / Z.R_IC;
    assert.ok(Math.abs(out - heatIn) < 1e-6 * heatIn, JSON.stringify(o));
    assert.ok(T.every(t => t > Z.T_COOL), 'no tier colder than the coolant');
  }
});

test('the challenge: reached by building up with memory on the logic and coolant, never by one lever alone', () => {
  const won = Z.ALL.filter(Z.met);
  assert.ok(won.length >= 2, 'more than one way');
  assert.ok(won.every(o => o.tiers > 1 && o.memOn && o.cool), 'every way stacks, puts memory on the logic and cools between tiers');
  assert.ok(!Z.met(Z.START), 'not at the start');
  for (const one of [{ tiers: 4 }, { memOn: true }, { cool: true }, { chiplets: 8 }]) assert.ok(!Z.met(one), JSON.stringify(one) + ' alone');
  /* each reason a setting misses has its own word in the lab */
  assert.equal(Z.whyNot({ tiers: 4 }), 'hot'); assert.equal(Z.whyNot({}), 'energy'); assert.equal(Z.whyNot({ tiers: 3, memOn: true, cool: true }), null);
  assert.deepEqual(Z.normal({ tiers: 7, chiplets: 3, memOn: 1 }), { tiers: 1, memOn: true, cool: false, chiplets: 1 });
});

test('every figure the lab names is a fact with its source and the day it was checked', () => {
  for (const id of Object.values(Z.FACTS)) { const f = facts.find(x => x.id === id); assert.ok(f && f.source && f.url && /^\d{4}-\d{2}-\d{2}$/.test(f.verified), id); }
  /* the numbers the engine uses are the facts' own */
  const val = id => facts.find(x => x.id === id).value;
  assert.match(val('junction-limit'), new RegExp(String(Z.T_MAX))); assert.match(val('ucie-pjbit'), new RegExp(String(Z.LINK_PJ)));
  assert.match(val('hybrid-bond-pjbit'), new RegExp(String(Z.BOND_PJ))); assert.match(val('hbm-pjbit'), new RegExp(String(Z.MEM_BESIDE)));
});

test('the model says what it simplifies, and what it would make of the stacked shape', () => {
  const src = readFileSync(new URL('../src/engines/tiers.js', import.meta.url), 'utf8');
  assert.match(src, /Simplifications, so they can be argued with/);
  const S = Z.stackShape();
  assert.ok(S.energy > 1, 'a stack spends less energy an operation than one flat chip with its memory beside it');
  assert.ok(S.rugged >= 0 && S.rugged < 1, 'and keeps less temperature headroom');
});
