/* The chip world as a game (src/v2/game.js): the main thread is a chip's life loop, every challenge is
   checked by a real engine and can be won, every growth is drawn and named, every door leads somewhere real,
   and the community's open jobs come from the plan. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as G from '../src/v2/game.js';
import { solutionOf } from '../src/engines/design.js';
import { CLOCKS, SIDES, LOADS, REUSES, MEMS, GENS } from '../src/engines/chip.js';
import { MARGINS, PROTECT } from '../src/engines/life.js';
import { NEEDS } from '../src/data/build.js';
import { DEBATES } from '../src/data/debates.js';
import { WORLDS, STOPS } from '../src/data/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const MAP = readFileSync(new URL('../src/v2/map3d.js', import.meta.url), 'utf8');
const RANGE = { clock: CLOCKS.map((_, i) => i), gen: [...Array(GENS).keys()], size: SIDES.map((_, i) => i), load: LOADS.map((_, i) => i), reuse: REUSES.map((_, i) => i), mem: MEMS.map((_, i) => i) };
/* every combination of the settings a goal needs, the rest as the starting chip */
function* combos(keys, at = 0, cur = {}) {
  if (at === keys.length) { yield cur; return; }
  for (const v of RANGE[keys[at]]) yield* combos(keys, at + 1, Object.assign({}, cur, { [keys[at]]: keys[at] === 'clock' ? CLOCKS[v] : v }));
}

test('the main thread is a loop of five steps, each with a station and at least two challenges', () => {
  assert.deepEqual(G.STEPS, ['design', 'make', 'test', 'ship', 'use']);
  for (const s of G.STEPS) {
    assert.ok(G.PLACES.includes(G.STATION[s]), s + ' has no station');
    assert.ok(G.stepChallenges(s).length >= 2, s + ' needs at least two challenges');
    assert.ok(EN['game.step.' + s], s);
  }
  const ids = G.CHALLENGES.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'challenge ids are unique');
});

test('every challenge has its words: a title, a goal, why it matters, and what it grows', () => {
  for (const c of G.CHALLENGES) {
    if (c.kind === 'design') { assert.ok(EN['design.proj.' + c.p + '.t'], c.id); assert.ok(EN['game.ch.' + c.id + '.goal'], c.id + ' goal'); }
    else assert.ok(EN['game.ch.' + c.id + '.t'], c.id + ' title');
    if (c.kind === 'chip') assert.ok(EN['chal.' + c.goal + '.goal'] && EN['chal.' + c.goal + '.hint'], c.id + ' goal');
    if (c.kind === 'life' || c.kind === 'spot') assert.ok(EN['game.ch.' + c.id + '.goal'], c.id + ' goal');
    assert.ok(EN['game.ch.' + c.id + '.why'], c.id + ' why');
    assert.ok(EN['grow.' + c.grows], c.id + ': grow.' + c.grows);
  }
  for (const p of ['half']) if (G.ownStarter(p)) assert.ok(EN['game.own.' + p], p);
});

test('every design challenge starts wrong and its solution passes the check', () => {
  for (const c of G.CHALLENGES.filter(x => x.kind === 'design')) {
    assert.equal(G.checkDesign(c.p, G.starter(c.p)).ok, false, c.id + ': the starter should fail');
    assert.equal(G.checkDesign(c.p, solutionOf(c.p)).ok, true, c.id + ': the solution should pass');
  }
});

test('every chip goal is unmet by the starting chip, and some settings reach it', () => {
  for (const c of G.CHALLENGES.filter(x => x.kind === 'chip')) {
    assert.equal(G.checkChip(c.goal, G.START).ok, false, c.id + ' is met at the start');
    const needs = G.chipGoal(c.goal).needs;
    let found = false;
    for (const set of combos(needs)) if (G.checkChip(c.goal, Object.assign({}, G.START, set)).ok) { found = true; break; }
    assert.ok(found, c.id + ' cannot be reached with ' + needs.join(', '));
  }
});

test('every life mission fails with nothing done, and some choices pass it', () => {
  for (const c of G.CHALLENGES.filter(x => x.kind === 'life')) {
    assert.equal(G.checkLife(c.mission, G.PERFECT).pass, false, c.id + ' passes with nothing done');
    let found = false;
    for (let m = 0; m < MARGINS.length && !found; m++) for (const grid of [false, true]) for (const hot of [false, true]) for (const burn of [false, true]) for (const protect of PROTECT)
      if (!found && G.checkLife(c.mission, { margin: m, grid, hot, burn, protect }).pass) found = true;
    assert.ok(found, c.id + ' cannot be passed');
  }
});

test('the broken copy is caught by some patterns and missed by others, so choosing them matters', () => {
  const S = G.spotCase();
  assert.ok(S.broken >= 0 && S.broken < G.SPOT.chips);
  const catches = S.bad.map(r => r.mis.length > 0);
  assert.ok(catches.some(Boolean), 'no pattern catches the fault');
  assert.ok(catches.some(x => !x), 'every pattern catches it: no choice to make');
  assert.ok(G.SPOT.tests < S.rows.length, 'fewer tests than patterns');
  const i = catches.indexOf(true);
  assert.notDeepEqual(G.spotAnswer(S, S.broken, i), G.spotAnswer(S, (S.broken + 1) % G.SPOT.chips, i));
});

test('every page of the earlier site has an address: a place and a level, and every question a place', () => {
  for (const w of WORLDS) for (const depth of w.depths) {
    const p = G.placeOf(w.id, depth);
    assert.ok(p && G.PLACES.includes(p), w.id + '/' + depth + ' has no place');
  }
  for (const w of WORLDS.filter(x => !x.hidden)) for (const depth of w.depths) assert.ok(Object.values(G.INSIDE).some(L => L.some(l => l.world === w.id && l.depth === depth)), w.id + '/' + depth + ' is no level of any place');
  for (const k of Object.keys(STOPS)) assert.ok(Object.values(G.ASK).some(L => L.includes(k)), k + ' is asked nowhere');
  for (const [place, L] of Object.entries(G.INSIDE)) for (const l of L) assert.ok(EN['depth.' + l.depth + '.name'] && EN['depth.' + l.depth + '.see'], place + ': ' + l.depth);
  for (const [place, F] of Object.entries(G.FLOWN)) for (const d of Object.keys(F)) assert.ok(G.INSIDE[place].some(l => l.depth === d), place + ' flies through ' + d);
  for (const [place, key] of Object.entries(G.BEACON)) assert.ok(G.ASK[place].includes(key), place + ': its beacon ' + key + ' is not asked there');
});

test('every challenge happens at a place, at one of its levels', () => {
  for (const c of G.CHALLENGES) {
    assert.ok(G.PLACES.includes(c.place), c.id);
    assert.ok((G.INSIDE[c.place] || []).some(l => l.depth === c.at), c.id + ': ' + c.at + ' is not a level of ' + c.place);
  }
});

test('everything that grows is drawn on the island, named, and stands at a real place', () => {
  const ids = G.GROWTH.map(g => g.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const g of G.GROWTH) {
    assert.ok(G.PLACES.includes(g.at), g.id + ' at ' + g.at);
    assert.ok(MAP.includes("'" + g.id + "': "), g.id + ' has no grower in map3d.js');
    assert.ok(EN['grow.' + g.id], g.id);
  }
});

test('every place has its words, and its doors lead somewhere real', () => {
  const places = [...MAP.matchAll(/\{ id: '([a-z]+)', at: \[/g)].map(m => m[1]);
  assert.deepEqual(places.slice().sort(), G.PLACES.slice().sort(), 'the island draws every place of the game');
  for (const id of G.PLACES) for (const k of ['t', 'd']) assert.ok(EN['map.' + id + '.' + k], id + ' ' + k);
  for (const id of G.PLACES.filter(p => !G.STEP_OF[p] && !G.STEP_PLACE[p])) assert.ok(EN['map.' + id + '.kind'], id + ' kind');
  for (const [place, keys] of Object.entries(G.ASK)) {
    assert.ok(G.PLACES.includes(place), place);
    for (const k of keys) assert.ok(EN['stop.' + k + '.q'], place + ': ' + k + ' is not a stop');
  }
  for (const [place, ids] of Object.entries(G.DEBATES_AT)) for (const id of ids) assert.ok(DEBATES.some(d => d.id === id), place + ': debate ' + id);
  for (const [place, looks] of Object.entries(G.LOOK)) for (const l of looks) {
    assert.ok(EN['look.' + l.id + '.t'] && EN['look.' + l.id + '.d'], place + ': look.' + l.id);
    assert.ok(l.to || l.page || (l.world && l.depth), place + ': ' + l.id + ' leads nowhere');
  }
  /* every station has something to do */
  for (const s of G.STEPS) assert.ok(G.stepChallenges(s).length, s);
});

test('the community: open jobs come from the plan and can be played; finished jobs count as yours', () => {
  const s = G.fresh(), C = G.community(s);
  assert.ok(C.total > 0 && C.built < C.total);
  assert.ok(C.jobs.length > 0, 'there are open jobs');
  for (const j of C.jobs) {
    assert.ok(NEEDS.some(n => n.id === j.need), j.need);
    const ch = G.jobOf(j.need);
    assert.equal(ch.kind, 'design'); assert.ok(EN['design.proj.' + ch.p + '.t'], ch.p);
    assert.equal(G.checkDesign(ch.p, solutionOf(ch.p)).ok, true, j.need + ': its solution passes');
  }
  const j = C.jobs[0];
  s.done['job:' + j.need] = true;
  assert.ok(G.community(s).state[j.need].yours, 'a finished job is yours on the plan');
});

test('progress: the next challenge walks the loop, and finishing everything grows everything', () => {
  const s = G.fresh();
  assert.equal(G.next(s).id, G.CHALLENGES[0].id);
  assert.equal(G.chipAt(s), 'design');
  assert.equal(G.grown(s).size, 0);
  G.CHALLENGES.forEach(c => { s.done[c.id] = true; });
  assert.equal(G.next(s), null);
  assert.equal(G.grown(s).size, G.GROWTH.length);
  for (const st of G.STEPS) { const p = G.stepState(s, st); assert.equal(p.done, p.total); }
});

test('your state survives a reload and junk is cleaned', () => {
  const mem = { v: null, getItem() { return this.v; }, setItem(k, v) { this.v = v; } };
  const s = G.fresh(); s.done.half = true; s.codes.half = 'sum = a ^ b;'; s.chip.gen = 3; s.life.car = { margin: 3, hot: true };
  G.save(mem, s);
  const r = G.load(mem);
  assert.equal(r.done.half, true); assert.equal(r.codes.half, 'sum = a ^ b;'); assert.equal(r.chip.gen, 3); assert.equal(r.life.car.hot, true);
  mem.v = JSON.stringify({ done: { nonsense: true, 'job:x': true }, chip: { gen: 99 }, codes: { a: 5 } });
  const j = G.load(mem);
  assert.equal(j.done.nonsense, undefined); assert.equal(j.codes.a, undefined); assert.ok(j.chip.gen < GENS);
  mem.v = '{bad json'; assert.deepEqual(G.load(mem).done, {});
});

test('a chip goal\'s gauges say the same as the goal itself, on every combination of its settings', () => {
  for (const c of G.CHALLENGES.filter(x => x.kind === 'chip')) {
    const gs = G.GAUGES[c.goal]; assert.ok(gs && gs.length, c.goal + ' has no gauges');
    for (const g of gs) assert.ok(EN['gauge.' + g.k], 'gauge.' + g.k);
    for (const set of combos(G.chipGoal(c.goal).needs)) {
      const R = G.checkChip(c.goal, Object.assign({}, G.START, set));
      assert.equal(gs.every(g => G.gauge(g, R.m).ok), R.ok, c.goal + ' ' + JSON.stringify(set));
    }
  }
});

test('your design travels with your chip once a design challenge is won', () => {
  const s = G.fresh(); assert.equal(G.yourDesign(s), null);
  s.done.half = true; s.codes.half = solutionOf('half');
  const Y = G.yourDesign(s); assert.equal(Y.p, 'half'); assert.ok(Y.B.M.cells.length > 0 && Y.B.transistors > 0 && Y.B.masks > 0);
});
