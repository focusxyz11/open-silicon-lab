/* Moving bits (src/engines/bits.js), the engine of "if information weighs nothing, why does moving it cost so much?" and
   of its game, Keep the chef busy: never faster than light, never past Shannon's limit, never under Landauer's floor,
   agreeing with the energy budget it builds on, and every level playable with every lever's catch biting somewhere. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import * as B from '../src/engines/bits.js';
import { E16 } from '../src/engines/paradigms.js';
import { settle, checkEntry, chefCurve, chefAttemptsAt } from '../src/engines/ledger.js';
import { collect } from '../scripts/ledger.mjs';
import { CHALLENGES } from '../src/v2/game.js';
import { QUESTIONS } from '../src/data/atlas.js';
import { fieldOf } from '../src/data/questions.js';

const FACTS = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a / b - 1) <= tol, msg + ': ' + a + ' against ' + b + ' (within ' + tol * 100 + '%)');

test('the walls: light per tick, Shannon and Landauer, as their sources say', () => {
  /* about 10 cm in one tick of a 3 GHz clock (facts.json light-per-tick) */
  near(B.lightPerTick(3), 0.0999, 0.01, 'light per tick');
  /* a channel of 1 Hz at a signal-to-noise of 1 (0 dB) carries one bit a second (facts.json shannon-1948) */
  near(B.shannon(1, 0), 1, 1e-9, 'Shannon');
  assert.ok(B.shannon(1e9, 20) > B.shannon(1e9, 10), 'less noise, more bits');
  /* about 3 zJ at room temperature (facts.json landauer-measured) */
  near(B.FLOOR, 2.87e-21, 0.01, 'Landauer');
  for (const id of B.FACTS) { const f = FACTS[id]; assert.ok(f && f.url && f.source && f.verified, id + ' is a figure in facts.json with its source'); }
});

test('nothing outruns light, and no wire carries more than its noise allows', () => {
  for (const [id, M] of Object.entries(B.MEDIA)) assert.ok(M.sMm >= 1 / 299792458 / 1000 - 1e-24, id + ' is never quicker than light');
  for (const id of B.TRIP_IDS) {
    const T = B.trip(id);
    assert.ok(T.meters.time >= T.walls.lightS, id + ': the trip takes at least the time light needs');
    assert.ok(T.walls.perWire <= T.walls.shannon + 1, id + ': a wire carries no more than Shannon allows');
    assert.ok(T.walls.floor > 1e6, id + ': moving a bit costs far more than the floor today');
    for (const k of B.METERS) assert.ok(Number.isFinite(T.meters[k]) && T.meters[k] >= 0, id + ' ' + k);
  }
});

test('one bit\'s trip agrees with the energy budget, and moving the memory changes all six meters', () => {
  near(B.trip('near').meters.energy, B.budgetBit('sram'), 0.02, 'on-chip memory, as the budget has it');
  near(B.trip('beside').meters.energy, B.budgetBit('hbm'), 0.05, 'the stack beside the chip, as the budget has it');
  near(B.trip('board').meters.energy, B.budgetBit('dram'), 0.05, 'memory chips on the board, as the budget has it');
  /* reading 16 bits from DRAM costs about 640 pJ (facts.json energy-moving-data) */
  near(16 * B.trip('board').meters.energy * 1e12, E16.dram, 0.05, '16 bits from the board');
  /* a modern HBM2 stack is about 4 pJ a bit (facts.json hbm2-energy): the 45 nm table is high, within three times */
  const hbm = B.trip('beside').meters.energy * 1e12; assert.ok(hbm >= 3.97 && hbm <= 3 * 3.97, 'the 45 nm stack against HBM2: ' + hbm);
  /* in copper, every step farther costs more energy and time */
  const e = id => B.trip(id).meters.energy, s = id => B.trip(id).meters.time;
  assert.ok(e('near') < e('stacked') && e('stacked') < e('beside') && e('beside') < e('board'));
  assert.ok(s('near') < s('stacked') && s('stacked') < s('beside') && s('beside') < s('board') && s('board') < s('rack'));
  /* by light, twenty times farther costs no more energy than the board */
  assert.ok(B.trip('rack').mm > 20 * B.trip('board').mm && e('rack') <= e('board'));
  /* the Look: fetching two numbers costs far more than adding them, even from memory beside the arithmetic */
  for (const id of B.TRIP_IDS) assert.ok(B.trip(id).fetchTwoJ > 50 * B.trip(id).addJ, id);
  /* every meter differs somewhere as the memory moves */
  for (const k of B.METERS) assert.ok(new Set(B.TRIP_IDS.map(id => B.trip(id).meters[k])).size > 1, k + ' changes as the memory moves');
  /* the memory beside the chip has the many wires of a stack (facts.json hbm4: a 2,048-bit interface) */
  assert.equal(B.trip('beside').meters.space, 2048);
  assert.equal(B.trip('nowhere'), null);
});

test('the memory wall: at every level the chef is kept busy at first and waits more every round', () => {
  for (const L of B.LEVELS) {
    const K = B.kitchen(L.id, {});
    assert.ok(K.ok && !K.cleared, L.id + ' is not cleared as it starts');
    assert.ok(K.rounds[0].wait < 0.05, L.id + ': the chef is busy at the first round');
    for (let r = 1; r < B.ROUNDS; r++) assert.ok(K.rounds[r].wait >= K.rounds[r - 1].wait, L.id + ': waits more each round');
    assert.ok(K.wait > 0.5, L.id + ': by the last round the chef waits most of the time');
  }
  /* 80% a year against 7% (facts.json memory-wall) */
  assert.equal(B.CHEF_GROWS, 1.8); assert.equal(B.PANTRY_GROWS, 1.07); assert.ok(FACTS['memory-wall'].value.includes('80%') && FACTS['memory-wall'].value.includes('7%'));
});

test('every level can be cleared, never by every lever at once, and each lever helps somewhere', () => {
  const used = new Set();
  for (const L of B.LEVELS) {
    let wins = 0;
    for (const p of B.plans()) { const K = B.kitchen(L.id, p); if (K.cleared) { wins++; B.LEVER_IDS.forEach(k => { if (p[k] !== B.START[k]) used.add(k); }); } }
    assert.ok(wins >= 3, L.id + ' can be cleared in several ways (' + wins + ')');
    const all = B.kitchen(L.id, { closer: 0.3, wider: 8, shelf: 1, stack: true, light: true, cim: 0.9 });
    assert.ok(!all.cleared && !all.catches.money.ok, L.id + ': pulling every lever costs more than the level has');
    const h = B.hint(L.id, {}); assert.ok(h && B.LEVER_IDS.includes(h.lever), L.id + ' has a hint');
  }
  for (const k of B.LEVER_IDS) assert.ok(used.has(k), k + ' is part of some win');
});

test('each lever has its catch', () => {
  /* closer and the shelf take room from the chef; the stack slows it with heat */
  assert.ok(B.kitchen('chip', { closer: 0.3 }).slow < 1 && B.kitchen('chip', { shelf: 1 }).slow < 1);
  near(B.kitchen('chip', { stack: true }).slow, B.STACK_SLOW, 1e-9, 'the stack');
  /* a wider door costs money and wires, and the chip's edge takes only so many */
  assert.ok(B.kitchen('chip', { wider: 8 }).catches.money.value > B.kitchen('chip', { wider: 2 }).catches.money.value);
  assert.ok(!B.kitchen('stacked', { wider: 8 }).catches.space.ok, 'the edge is full');
  /* a shelf must guess: where what comes next cannot be guessed, it helps less and wastes bits */
  const sh = id => B.kitchen(id, { shelf: 0.25 }).rounds[4];
  assert.ok(sh('chip').wasted > 0);
  assert.ok(B.kitchen('dc', { shelf: 0.25 }).energy > 0.8 * B.kitchen('dc', {}).energy, 'a job that uses each number once gets little from a shelf');
  /* light: over a millimetre it costs more than the wire; over a metre, far less */
  assert.ok(B.kitchen('wire', { light: true }).energy > B.kitchen('wire', {}).energy);
  assert.ok(B.kitchen('light', { light: true }).energy < 0.2 * B.kitchen('light', {}).energy);
  /* cooking in the pantry is approximate: a level that needs exact answers cannot take it */
  assert.ok(!B.kitchen('chip', { cim: 0.5 }).catches.error.ok && B.kitchen('dc', { cim: 0.5 }).catches.error.ok);
  assert.ok(B.kitchen('dc', { cim: 0.9 }).energy < B.kitchen('dc', {}).energy);
});

test('a plan from anyone is checked before it is run', () => {
  assert.equal(B.problem({ wider: 3 }), 'wider');
  assert.equal(B.problem({ teleport: true }), 'lever');
  assert.equal(B.problem([]), 'plan');
  assert.equal(B.kitchen('moon', {}).ok, false);
  assert.deepEqual(B.normalPlan({ wider: 1, shelf: 0.25, x: 1, cim: 7 }), { shelf: 0.25 });
  assert.ok(B.won(Object.fromEntries(B.TO_WIN.map(k => [k, 1])))); assert.ok(!B.won({ wire: 1 }));
});

test('attempts at the kitchen are kept in the ledger, scored by the engine, with a curve for each level', () => {
  const W = settle(collect());
  assert.ok(chefAttemptsAt(W, 'chip').length >= 3, 'the examples are kept');
  const C = chefCurve(W, 'chip');
  C.forEach((p, i) => { assert.ok(p.best <= p.wait + 1e-12); if (i) assert.ok(p.best <= C[i - 1].best); });
  for (const e of chefAttemptsAt(W, 'chip')) near(e.facts.wait + 1, B.kitchen('chip', e.plan).wait + 1, 1e-12, e.id);
  assert.ok(W.bestChef.chip, 'a level has a best');
  const base = { id: '2026-11-20-try-test-chef-zz', kind: 'try', by: 'Tester', made: 'person', ai: '', words: '', chef: 'chip' };
  assert.equal(checkEntry({ ...base, plan: { teleport: true } }, W).reason, 'plan');
  assert.equal(checkEntry({ ...base, plan: { wider: 3 } }, W).reason, 'plan');
  assert.equal(checkEntry({ ...base, chef: 'moon', plan: {} }, W).reason, 'chef');
  assert.equal(checkEntry({ ...base, plan: { wider: 1 } }, W).reason, 'same', 'the start written another way is the same plan');
  assert.equal(checkEntry({ ...base, plan: { wider: 2 }, puzzle: 'energy' }, W).reason, 'fields');
  const ok = checkEntry({ ...base, plan: { wider: 2 } }, W); assert.ok(ok.ok); assert.ok(ok.facts.wait > 0);
  assert.equal(readdirSync(new URL('../community/ledger/', import.meta.url)).filter(n => n.includes('-chef-')).length, chefAttemptsAt(W, 'chip').length + chefAttemptsAt(W, 'dc').length);
});

test('the question has one home: the atlas places it, the challenge reads its address, the field offers it', () => {
  const Q = QUESTIONS.bits, ch = CHALLENGES.find(c => c.id === Q.challenge);
  assert.ok(ch && ch.place === Q.home.place && ch.at === Q.home.level && ch.kind === 'chef');
  for (const f of Q.field) assert.ok(fieldOf(f), f + ' is a question of the field');
  assert.deepEqual(Object.keys(Q.ladder).filter(k => k !== 'trip').sort(), B.LEVEL_IDS.slice().sort(), 'every level stands on a rung of the ladder');
});
