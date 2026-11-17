/* Experiments (src/data/experiments/, src/engines/experiments.js): the one kind of piece the lab is made of. These
   tests keep the contract: everything the lab had (every stop, challenge and try) is part of exactly one experiment;
   every side names something that exists; the state is honest; every experiment can be read; the ways on lead on. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STOPS, TRIES, CASES, FIGURES, THREADS, DEPTHS } from '../src/data/weave.js';
import { DEBATES } from '../src/data/debates.js';
import { WAYS } from '../src/data/ways.js';
import { LENSES, ENGINES, MEASURES, GIVENS, DIRECTIONS, engineOf } from '../src/data/layers.js';
import { EXPERIMENTS, BY_WORLD } from '../src/data/experiments/index.js';
import * as X from '../src/engines/experiments.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const FACT = Object.fromEntries(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => [f.id, f]));
const SKELETON = JSON.parse(readFileSync(new URL('../docs/framework/skeleton.json', import.meta.url), 'utf8'));
/* the challenges, read from the game's data without a browser */
const GAME = readFileSync(new URL('../src/v2/game.js', import.meta.url), 'utf8');
const CHALLENGES = [...GAME.slice(GAME.indexOf('export const CHALLENGES'), GAME.indexOf('];', GAME.indexOf('export const CHALLENGES'))).matchAll(/\{ id: '([a-z]+)'/g)].map(m => m[1]);
const has = k => EN[k] !== undefined;

test('one world for each core question, in the weave\'s order; ids are unique and named for their world', () => {
  assert.deepEqual(Object.keys(BY_WORLD), THREADS.map(t => t.id));
  assert.equal(new Set(EXPERIMENTS.map(x => x.id)).size, EXPERIMENTS.length);
  for (const x of EXPERIMENTS) {
    assert.ok(x.id.startsWith(x.world + '-'), x.id + ' is in ' + x.world);
    assert.ok(Number.isInteger(x.strand) && x.strand >= 0 && x.strand < 5, x.id + ': strand 0..4');
    for (const w of x.also || []) assert.ok(BY_WORLD[w] && w !== x.world, x.id + ' also serves ' + w);
  }
});

test('everything the lab had is part of exactly one experiment: every stop, every challenge, every try', () => {
  const at = {};
  for (const x of EXPERIMENTS) for (const s of x.stops || []) {
    assert.ok(STOPS[s], x.id + ': no stop ' + s);
    assert.equal(s.split('.')[0], x.world, s + ' belongs to its own thread\'s world, not ' + x.id);
    assert.ok(!at[s], s + ' is in ' + at[s] + ' and ' + x.id); at[s] = x.id;
  }
  for (const s of Object.keys(STOPS)) assert.ok(at[s], 'the stop ' + s + ' is in no experiment');
  assert.equal(CHALLENGES.length, 17);
  for (const c of CHALLENGES) assert.equal(EXPERIMENTS.filter(x => (x.ch || []).includes(c)).length, 1, 'the challenge ' + c + ' is in exactly one experiment');
  for (const s of Object.keys(TRIES)) assert.equal(X.stateOf(X.experimentAtStop(s)), 'live', 'the try at ' + s + ' makes its experiment live');
  for (const c of CASES) assert.ok(EXPERIMENTS.some(x => X.casesOf(x).includes(c.id)), 'the case ' + c.id + ' is read somewhere');
  for (const d of DEBATES) assert.ok(EXPERIMENTS.some(x => x.debate === d.id), 'the debate ' + d.id + ' is raised somewhere');
  for (const w of WAYS) assert.ok(EXPERIMENTS.some(x => (x.open || []).includes(w.id)), 'the way ' + w.id + ' is tried somewhere');
});

test('every side names something that exists', () => {
  const L = new Set(LENSES.map(l => l.id)), E = new Set(ENGINES.map(e => e.id)), M = new Set(MEASURES), G = new Set(GIVENS), D = new Set(DIRECTIONS.map(d => d.id));
  for (const x of EXPERIMENTS) {
    assert.ok(L.has(x.lens), x.id + ': lens ' + x.lens);
    assert.ok(x.engine === null || E.has(x.engine), x.id + ': engine ' + x.engine);
    assert.ok(!x.wants || E.has(x.wants) || ['part', 'outside'].includes(x.wants), x.id + ': wants ' + x.wants);
    if (x.wants && E.has(x.wants)) assert.equal(engineOf(x.wants).state, 'missing', x.id + ' wants ' + x.wants + ', which is not missing');
    if (x.wants === 'part') assert.ok(x.engine && engineOf(x.engine).state !== 'missing', x.id + ' wants a part of an engine that exists');
    for (const m of x.trade || []) assert.ok(M.has(m), x.id + ': measure ' + m);
    for (const g of x.given || []) assert.ok(G.has(g), x.id + ': given ' + g);
    for (const d of x.open || []) assert.ok(D.has(d), x.id + ': direction ' + d);
    for (const f of X.figuresOf(x)) assert.ok(FACT[f], x.id + ': figure ' + f);
    for (const c of x.cases || []) assert.ok(CASES.some(k => k.id === c), x.id + ': case ' + c);
    for (const d of x.at || []) assert.ok(DEPTHS[d], x.id + ': level ' + d);
    assert.ok(X.levelsOf(x).length, x.id + ' is about some level of the chip');
    if (x.debate) assert.ok(DEBATES.some(d => d.id === x.debate), x.id + ': debate ' + x.debate);
    if (x.go) assert.match(x.go, /^#\/[a-z0-9\/-]+$/, x.id + ': go');
  }
});

test('the state is honest: what is live can be played, what is ready has an engine, what is wanted says what it waits for', () => {
  const c = X.counts();
  for (const x of EXPERIMENTS) {
    const st = X.stateOf(x);
    if (st === 'live') assert.ok(X.playOf(x), x.id + ' is live with nothing to play');
    if (st === 'ready') assert.ok(engineOf(x.engine) && engineOf(x.engine).state !== 'missing', x.id + ' is ready with no engine');
    if (st === 'wanted') assert.ok(x.wants, x.id + ' is wanted and does not say for what');
    if (st === 'words') assert.equal(x.engine, null, x.id + ' is only words');
  }
  for (const st of X.STATES) assert.ok(c[st] > 0, 'some experiment is ' + st);
  /* the lab is not yet what it should be: most of it cannot be played. When this changes, it is news. */
  assert.ok(c.live < EXPERIMENTS.length / 2);
});

test('every experiment can be read: its question, and a number in it comes from an engine or a source', () => {
  for (const x of EXPERIMENTS) {
    const k = X.askKeys(x).find(has);
    assert.ok(k, x.id + ' has no question (exp.' + x.id + '.ask, or a stop)');
    if (!(x.stops || []).length) assert.equal(k, 'exp.' + x.id + '.ask', x.id + ' has no stop, so it needs words of its own');
    const own = EN['exp.' + x.id + '.ask'];
    if (own && /\d/.test(own)) assert.ok(X.figuresOf(x).length || x.engine || (x.wants && engineOf(x.wants)), x.id + ' has a number but no figure or engine behind it');
  }
  for (const k of Object.keys(EN).filter(k => k.startsWith('exp.'))) assert.ok(X.experimentOf(k.split('.')[1]), k + ' is the words of no experiment');
});

test('every layer has its words; a direction that is a way to compute keeps that way\'s words', () => {
  for (const l of LENSES) assert.ok(has('layer.lens.' + l.id) && has('layer.lens.' + l.id + '.lays'), 'lens ' + l.id);
  for (const e of ENGINES) assert.ok(has('layer.engine.' + e.id) && has('layer.engine.' + e.id + '.does'), 'engine ' + e.id);
  for (const m of MEASURES) assert.ok(has('layer.measure.' + m), 'measure ' + m);
  for (const g of GIVENS) assert.ok(has('layer.given.' + g), 'given ' + g);
  for (const d of DIRECTIONS) {
    const way = WAYS.some(w => w.id === d.id);
    assert.ok(way ? has('way.' + d.id + '.t') && !has('layer.dir.' + d.id) : has('layer.dir.' + d.id), 'direction ' + d.id + (way ? ' keeps its way\'s words' : ' needs words'));
    for (const g of d.drops) assert.ok(GIVENS.includes(g), d.id + ' drops ' + g);
  }
  for (const st of X.STATES) for (const k of ['read.state.', 'read.sec.', 'read.secd.']) assert.ok(has(k + st), k + st);
});

test('the layers are the framework\'s own (docs/framework/skeleton.json)', () => {
  assert.deepEqual(LENSES.map(l => l.id), SKELETON.lenses.map(l => l.id));
  assert.deepEqual(ENGINES.map(e => [e.id, e.state]), SKELETON.engines.map(e => [e.id, e.state]));
  assert.deepEqual(MEASURES, SKELETON.measures.map(m => m.id));
  assert.deepEqual(GIVENS, SKELETON.givens.map(m => m.id));
  assert.deepEqual(DIRECTIONS.map(d => d.id), SKELETON.directions.map(d => d.id));
});

test('ways on: every experiment leads to others, mostly across questions, never to itself, and says what joins them', () => {
  for (const x of EXPERIMENTS) {
    const W = X.waysOn(x);
    assert.ok(W.length >= 3, x.id + ' leads to only ' + W.length);
    assert.ok(W.every(w => w.id !== x.id && X.experimentOf(w.id)), x.id + ': a way on to nowhere');
    assert.ok(W.filter(w => X.experimentOf(w.id).world === x.world).length <= 2, x.id + ': ways on stay in its own world');
    for (const w of W) assert.ok(has('read.by.' + w.by), 'read.by.' + w.by);
  }
});

test('a try on the page: every experiment that says it has one has one, it runs for every choice, and its words have every number they name', async () => {
  const { PROBES, startOf } = await import('../src/v2/probes.js');
  const flagged = EXPERIMENTS.filter(x => x.probe).map(x => x.id).sort();
  assert.deepEqual(Object.keys(PROBES).sort(), flagged, 'the experiments with a try on their page are the ones src/v2/probes.js has');
  for (const id of flagged) {
    const x = X.experimentOf(id), P = PROBES[id];
    assert.ok(x.engine && engineOf(x.engine).state !== 'missing', id + ': a try needs an engine that is there');
    assert.equal(X.stateOf(x), 'live');
    for (const c of P.controls) {
      assert.ok(has(c.label), id + ': ' + c.label);
      if (c.names) assert.ok(Array.isArray(EN[c.names]) && EN[c.names].length >= c.values.length, id + ': ' + c.names + ' names every value');
      if (c.keys) c.keys.forEach(k => assert.ok(has(k), id + ': ' + k));
      if (c.each) assert.ok(has(c.each), id + ': ' + c.each);
    }
    /* every combination of choices */
    const combos = P.controls.reduce((all, c) => all.flatMap(v => c.values.map(val => Object.assign({}, v, { [c.k]: val }))), [{}]);
    assert.ok(Object.values(startOf(P, {})).every(v => v !== undefined), id + ': it starts somewhere');
    for (const v of combos) {
      const R = P.run(v, {});
      assert.ok(R.says.length, id + ' says nothing for ' + JSON.stringify(v));
      for (const s of R.says) {
        const text = EN[s.key]; assert.ok(text, id + ': ' + s.key);
        for (const [, name] of String(typeof text === 'object' ? text.other : text).matchAll(/\{(\w+)\}/g)) assert.ok(s.vars && s.vars[name] !== undefined, id + ': ' + s.key + ' names {' + name + '}');
        for (const val of Object.values(s.vars || {})) { const n = val && typeof val === 'object' ? val.s : val; assert.ok(Number.isFinite(n), id + ': ' + s.key + ' gets ' + val); }
      }
      if (R.bars) R.bars.items.forEach(b => assert.ok(has(b.key) && b.v >= 0, id + ': bar ' + b.key));
      if (R.line) assert.ok(R.line.pts.every(p => p >= 0 && p <= 1), id + ': the line stays between 0 and 1');
      if (R.table) { R.table.head.forEach(k => assert.ok(has(k), id + ': ' + k)); R.table.rows.forEach(r => assert.equal(r.length, R.table.head.length)); }
      if (R.foot) assert.ok(has(R.foot), id + ': ' + R.foot);
    }
  }
});
