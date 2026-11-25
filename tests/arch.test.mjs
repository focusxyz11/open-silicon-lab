// Grow an architecture that does not exist yet (src/engines/arch.js, played by src/v2/labs/arch.js): the 400 recipes,
// what each could become, how a new one starts far behind and grows with attempts, forks, the agents' proposals,
// people who join a win, and the two goals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as A from '../src/engines/arch.js';

const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
const factOf = id => facts.find(f => f.id === id);
const fresh = () => A.allRecipes().filter(g => A.novelty(g) >= 2 && !A.knownOf(g));
/* a sensible way to play: people first for some years, then what the engine suggests */
function play(g, goal, peopleYears = 10) {
  let s = A.start(g); const G = A.GOALS[goal];
  for (let y = 0; y < G.years; y++) {
    const { dirs } = A.suggest(s, goal);
    s = A.year(s, y < peopleYears ? ['people', dirs[0]] : dirs);
    if (A.goalOf(s, goal).met) return { year: y + 1, s };
  }
  return null;
}

test('four genes make 400 recipes; today\'s computer is one of them, and a few others have been built', () => {
  assert.equal(A.RECIPES, 400);
  assert.equal(A.allRecipes().length, 400);
  assert.equal(new Set(A.allRecipes().map(A.keyOf)).size, 400);
  assert.equal(A.novelty(A.TODAY), 0);
  assert.ok(A.KNOWN.length >= 8 && A.KNOWN.length < 20, 'a few built, the rest open');
  assert.equal(new Set(A.KNOWN.map(k => A.keyOf(k.g))).size, A.KNOWN.length, 'each built recipe once');
  for (const k of A.KNOWN) {
    assert.ok(['product', 'lab'].includes(k.status), k.id);
    if (k.fact) assert.ok(factOf(k.fact), k.id + ': facts.json ' + k.fact);
    for (const g of A.GENES) assert.ok(A.OPTIONS[g].includes(k.g[g]), k.id + ' ' + g);
  }
  assert.ok(factOf(A.FIXED_FACT) && factOf(A.GROWTH_FACT), 'the two figures the model leans on are sourced');
});

test('today\'s computer is level with itself in every need, whatever the year, and never wins', () => {
  let s = A.start(A.TODAY);
  for (let y = 0; y < 30; y++) s = A.year(s, ['device', 'tools']);
  for (const n of A.NEEDS) { const r = A.scoreOf(s)[n]; assert.equal(r.now, 1); assert.equal(r.wins, false); }
  assert.equal(A.goalOf(s, 'archniche').met, false);
});

test('a new architecture is not efficient at first: no recipe nobody has built wins a need on day one', () => {
  for (const g of fresh()) { const sc = A.scoreOf(A.start(g)); for (const n of A.NEEDS) assert.ok(sc[n].now < 1, A.keyOf(g) + ' ' + n + ' ' + sc[n].now); }
  /* and most start far behind */
  const best = fresh().map(g => Math.max(...A.NEEDS.map(n => A.scoreOf(A.start(g))[n].now))).sort((a, b) => a - b);
  assert.ok(best[Math.floor(best.length / 2)] < 0.3, 'the median recipe starts below a third of today\'s computer in its best need');
});

test('it gets better only through attempts, and each direction stops at today\'s level', () => {
  const g = { where: 'flow', carrier: 'charge', told: 'graph', shape: 'swarm' };
  let s = A.start(g), last = A.scoreOf(s).rover.now;
  for (let y = 0; y < 15; y++) { s = A.year(s, ['errors', 'device']); const v = A.scoreOf(s).rover.now; assert.ok(v >= last * A.todayAt(1) ** -1 - 1e-12, 'never worse but for today\'s own gain'); last = v; }
  assert.ok(A.grow(0.01, 1e12) === 1 && A.grow(0.5, 0) === 0.5);
  /* Wright's law's shape: each doubling of attempts multiplies it by the same factor */
  const r1 = A.grow(0.001, 1000) / A.grow(0.001, 500), r2 = A.grow(0.001, 4000) / A.grow(0.001, 2000);
  assert.ok(Math.abs(r1 - r2) < 0.02 && Math.abs(r1 - 2 ** A.GROWTH) < 0.03);
  /* a year with no focus changes nothing but the year */
  const s0 = A.start(g), s1 = A.year(s0, []);
  assert.deepEqual(s1.tries, s0.tries); assert.equal(s1.year, 1);
});

test('needs are diverse: each has recipes that could beat today\'s computer, any program the fewest', () => {
  const R = A.allRecipes(), over = n => R.filter(g => A.potentialOf(g, n) > 1).length;
  for (const n of A.NEEDS) assert.ok(over(n) > 0, n);
  assert.ok(A.NEEDS.every(n => n === 'any' || over(n) > over('any')), 'any program is today\'s computer\'s home ground');
  assert.ok(over('any') <= 5);
  /* a need with a rule some recipes cannot keep */
  assert.equal(A.potentialOf({ where: 'in', carrier: 'charge', told: 'program', shape: 'few' }, 'rover'), 0, 'answers that are not exact cannot guide a rover');
  assert.deepEqual(A.missesOf({ where: 'far', carrier: 'charge', told: 'fixed', shape: 'few' }, 'hearing'), ['adapt'], 'a circuit wired for one job cannot be tuned to one person\'s hearing');
});

test('what spends only when there is something to do gains most where a need is rarely busy', () => {
  const g = { where: 'far', carrier: 'spikes', told: 'events', shape: 'few' };
  assert.ok(A.traitsOf(g, 'wildfire').energy > A.traitsOf(g, 'model').energy * 2);
  assert.equal(A.traitsOf(A.TODAY, 'wildfire').energy, A.traitsOf(A.TODAY, 'model').energy);
});

test('a fork keeps what it can: only the directions the changed gene leads lose what was learned', () => {
  let s = A.start({ where: 'near', carrier: 'light', told: 'graph', shape: 'stack' });
  for (let y = 0; y < 5; y++) s = A.year(s, ['device', 'tools']);
  const f = A.forkOf(s, 'shape', 'grid');
  assert.equal(f.g.shape, 'grid');
  for (const d of A.DIRS) assert.equal(f.tries[d], A.LINK.shape.includes(d) ? 0 : s.tries[d], d);
  assert.ok(f.tries.device > 0 && f.tries.tools > 0, 'the light and the graph keep their attempts');
  /* before the first year, choosing is free: a fresh start */
  const c = A.choose(A.start(A.TODAY), 'carrier', 'light');
  assert.equal(c.year, 0); assert.equal(c.g.carrier, 'light');
});

test('the engine suggests the need to work on and the directions that raise it most', () => {
  const g = { where: 'in', carrier: 'charge', told: 'graph', shape: 'stack' };
  let s = A.start(g);
  const sg = A.suggest(s, 'archspread');
  assert.ok(A.NEEDS.includes(sg.need) && sg.dirs.length >= 1 && sg.dirs.every(d => A.DIRS.includes(d)));
  /* following it, five years at a time, people first, spreads to three needs in time */
  while (s.year < A.GOALS.archspread.years && !A.goalOf(s, 'archspread').met) { const { dirs } = A.suggest(s, 'archspread'), f = s.year < 10 ? ['people', dirs[0]] : dirs; for (let i = 0; i < 5; i++) s = A.year(s, f); }
  assert.ok(A.goalOf(s, 'archspread').met, A.keyOf(g) + ' spreads by year ' + s.year);
});

test('agents propose forks within the goals\' rule; they decide nothing', () => {
  let s = A.start({ where: 'flow', carrier: 'charge', told: 'graph', shape: 'stack' });
  for (let y = 0; y < 3; y++) s = A.year(s, ['people', 'device']);
  const F = A.agentForks(s);
  assert.ok(F.length && F.length <= 3);
  for (const c of F) { const g = Object.assign({}, s.g, { [c.gene]: c.option }); assert.ok(!A.knownOf(g) && A.novelty(g) >= 2, A.keyOf(g)); }
  assert.equal(new Set(F.map(c => c.gene)).size, F.length, 'each a different gene');
  assert.deepEqual(s.g, { where: 'flow', carrier: 'charge', told: 'graph', shape: 'stack' }, 'the recipe is unchanged until the person forks');
});

test('people join an architecture that wins a need', () => {
  const r = play({ where: 'in', carrier: 'spikes', told: 'fixed', shape: 'swarm' }, 'archniche');
  assert.ok(r, 'it wins');
  const log = r.s.log, at = log.findIndex(e => e.fresh.length);
  assert.ok(at >= 0);
  /* the year of the win, people grew more than a year of investing alone brings */
  assert.ok(r.s.people > A.PEOPLE_START);
});

test('both goals can be met by a recipe nobody has built, the second far more rarely; a built recipe never meets them', () => {
  /* every third recipe nobody has built, to keep the test quick */
  const R = fresh().filter((g, i) => i % 3 === 0), niche = R.filter(g => play(g, 'archniche')), spread = niche.filter(g => play(g, 'archspread'));
  assert.ok(niche.length > R.length / 3, 'a niche is within reach of many: ' + niche.length);
  assert.ok(spread.length > 0 && spread.length < niche.length / 3, 'spreading to three needs is rare: ' + spread.length);
  /* investing in people pays: the same play without them wins far less often */
  assert.ok(R.filter(g => play(g, 'archniche', 0)).length < niche.length / 3);
  for (const k of A.KNOWN) { let s = A.start(k.g); for (let y = 0; y < 30; y++) s = A.year(s, ['device', 'memory']); assert.equal(A.goalOf(s, 'archniche').met, false, k.id); }
  /* within the years only */
  const won = play(niche[0], 'archniche');
  assert.ok(won.year <= A.GOALS.archniche.years);
});
