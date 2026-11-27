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

/* ---- stepping stones (#408): each direction improved in the lab that teaches it ---- */
const ALL = A.broughtOf(Object.values(A.STONES).flat());

test('a challenge won in a direction\'s lab is a stepping stone for that direction, the first of its list', () => {
  assert.deepEqual(A.broughtOf({}), {});
  assert.deepEqual(A.broughtOf({ flaky: true, dataflow: true, 'nobody-knows': true }), { errors: 'flaky', memory: 'dataflow' });
  assert.deepEqual(A.broughtOf(['cim', 'dataflow', A.KEPT_SWITCH]), { memory: 'cim', device: A.KEPT_SWITCH });
  assert.deepEqual(Object.keys(A.STONES).sort(), [...A.DIRS, 'people'].sort(), 'the six directions, no more');
  assert.deepEqual(Object.keys(ALL).sort(), Object.keys(A.STONES).sort());
  /* a stone named for another direction counts for nothing */
  const s = A.start({ where: 'in', carrier: 'light', told: 'graph', shape: 'grid' }, { device: 'flaky' });
  assert.deepEqual(s.stones, {});
});

test('a stone raises its direction\'s start once, whatever the recipe, and keeps it through a fork', () => {
  const g = { where: 'in', carrier: 'spikes', told: 'graph', shape: 'grid' }, plain = A.start(g), st = A.start(g, { device: 'transistor', people: A.LEDGER_ENTRY });
  assert.ok(Math.abs(st.start.device - Math.min(1, plain.start.device * A.STONE)) < 1e-12);
  for (const d of A.DIRS) if (d !== 'device') assert.equal(st.start[d], plain.start[d], d);
  assert.equal(st.people, A.PEOPLE_START * A.STONE_PEOPLE);
  /* brought back in the middle of a game: once */
  let s = A.year(A.start(g), ['memory']);
  const b1 = A.bring(s, { device: 'transistor' }), b2 = A.bring(b1, { device: 'transistor' });
  assert.ok(Math.abs(b1.start.device - s.start.device * A.STONE) < 1e-12);
  assert.deepEqual(b2.start, b1.start);
  /* a fork that loses the devices starts them again, with the stone */
  for (let y = 0; y < 4; y++) s = A.year(A.bring(s, { device: 'transistor' }), ['device']);
  const f = A.forkOf(s, 'carrier', 'light');
  assert.equal(f.tries.device, 0);
  assert.ok(Math.abs(f.start.device - A.startOf(f.g, f.stones).device) < 1e-12 && f.start.device > A.startOf(f.g).device);
  assert.deepEqual(A.choose(A.start(A.TODAY, ALL), 'carrier', 'light').stones, ALL, 'a new recipe chosen before the first year keeps them');
});

test('the stones help, but no recipe meets a goal from stones alone: it still has to be grown', () => {
  for (const g of fresh()) {
    let s = A.start(g, ALL);
    for (const n of A.NEEDS) assert.ok(A.scoreOf(s)[n].now < 1, A.keyOf(g) + ' ' + n + ' wins on day one');
    for (let y = 0; y < A.GOALS.archniche.years; y++) { s = A.year(s, []); assert.equal(A.goalOf(s, 'archniche').met, false, A.keyOf(g) + ' wins with no attempts'); }
  }
  const R = fresh().filter((g, i) => i % 3 === 0);
  const playWith = (g, stones) => { let s = A.start(g, stones); for (let y = 0; y < A.GOALS.archniche.years; y++) { s = A.year(s, y < 10 ? ['people', A.suggest(s, 'archniche').dirs[0]] : A.suggest(s, 'archniche').dirs); if (A.goalOf(s, 'archniche').met) return y + 1; } return null; };
  const without = R.map(g => playWith(g, {})), withAll = R.map(g => playWith(g, ALL));
  assert.ok(withAll.filter(Boolean).length > without.filter(Boolean).length, 'more recipes win a need with the stones');
  assert.ok(R.every((g, i) => !without[i] || (withAll[i] && withAll[i] <= without[i])), 'and none later');
});

/* ---- the family tree (#409) ---- */
test('the family tree keeps every start and fork as plain data, and the line the current recipe grew along', () => {
  const a = { where: 'in', carrier: 'charge', told: 'graph', shape: 'stack' }, b = Object.assign({}, a, { shape: 'grid' });
  let T = A.treeOf(A.TODAY);
  /* choosing before the first year changes the start in place */
  T = A.treeStart(T, a);
  assert.equal(T.nodes.length, 1); assert.equal(T.nodes[0].g, A.keyOf(a));
  T = A.treeYear(A.treeYear(T, []), ['wildfire']);
  T = A.treeFork(T, b, 2);
  assert.deepEqual(T.nodes.map(n => [n.id, n.from, n.how, n.at]), [[0, null, 'start', 0], [1, 0, 'fork', 2]]);
  assert.deepEqual(T.nodes[0].won, ['wildfire']); assert.equal(T.nodes[0].grown, 2);
  T = A.treeYear(T, ['wildfire', 'hearing']);
  assert.deepEqual(A.lineOf(T).map(n => n.id), [0, 1]);
  /* back to the first: a new start from it */
  T = A.treeStart(T, A.recipeOf(T.nodes[0].g), 0);
  assert.deepEqual(T.nodes.map(n => [n.id, n.from, n.how]), [[0, null, 'start'], [1, 0, 'fork'], [2, 0, 'back']]);
  assert.deepEqual(A.lineOf(T).map(n => n.id), [2]);
  assert.deepEqual(A.recipeOf(A.keyOf(b)), b);
  /* nothing grown on it yet: a start from the map takes its place */
  T = A.treeStart(T, b);
  assert.equal(T.nodes.length, 3); assert.equal(T.nodes[2].g, A.keyOf(b)); assert.equal(T.nodes[2].from, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(T)), T, 'plain data');
  /* every year's line says the best need's score after it */
  const s = A.year(A.start(a), ['device']);
  assert.equal(s.log[0].best, Math.max(...A.NEEDS.map(n => A.scoreOf(s)[n].now)));
});

/* a recipe is a set of forks in your stack (#444, src/engines/path.js): each option's carry contract beside its traits */
test('every option has a carry contract beside its traits, its energy only in EFFECT, a guess until a fact backs it', async () => {
  const { CHOICES, LAYER, RUNGS } = await import('../src/data/path.js');
  const { MATTERS, cellOf } = await import('../src/data/lattice.js');
  for (const k of A.GENES) {
    assert.deepEqual(Object.keys(A.CARRY[k]).sort(), A.OPTIONS[k].slice().sort(), k + ': a contract for every option');
    for (const o of A.OPTIONS[k]) {
      const c = A.CARRY[k][o];
      assert.ok(!('energy' in c), k + ' ' + o + ': its energy is EFFECT\'s, never written twice');
      if (A.isFork(k, o)) { assert.ok('fact' in c, k + ' ' + o + ': a fork says what backs it'); if (c.fact) assert.ok(factOf(c.fact), k + ' ' + o + ': ' + c.fact); assert.equal(A.forkFact(k, o), c.fact || null); }
      else assert.ok(!('fact' in c) && A.forkFact(k, o) === null, k + ' ' + o + ' is today\'s option, not a fork');
      assert.equal(A.forkEnergy(k, o), A.traitsOf(Object.assign({}, A.TODAY, { [k]: o })).energy, k + ' ' + o + ': the option alone');
    }
  }
  for (const o of A.OPTIONS.where) assert.ok(A.CARRY.where[o].latency > 0 && A.CARRY.where[o].latency <= A.CARRY.where.far.latency, o + ': memory no further than far');
  for (const o of A.OPTIONS.shape) assert.equal(A.CARRY.shape[o].units.length, CHOICES.ui.length, o + ': units at each of the stack\'s settings');
  assert.equal(A.CARRY.told.program.stages, true);
  for (const o of A.OPTIONS.carrier) {
    const c = A.CARRY.carrier[o];
    assert.ok(MATTERS.includes(c.matter), o + ': made of a matter of the lattice');
    assert.ok(o === 'charge' || c.delay > 0, o + ': a delay');
    /* the rungs it skips are the cells the lattice marks passed by for its matter */
    const past = RUNGS.filter(r => cellOf(c.matter, LAYER[r]).past);
    assert.deepEqual(c.skips || [], past, o + ' (' + c.matter + ') skips the cells the lattice passes by');
  }
  assert.ok(A.CARRY.carrier.living.skips.length, 'living cells learn without gates');
});
