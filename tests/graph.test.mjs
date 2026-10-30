// The knowledge graph keeps its meaning as it grows. Every link has a kind from a small, fixed list
// and reads as a sentence; some kinds can never go round in a loop; every big idea echoes across
// layers. scripts/catalog.mjs enforces the rules on every topic.json (see structure.test.mjs); these
// tests check the vocabulary itself and the helpers the site reads it with.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findLoop } from '../scripts/catalog.mjs';
import { BANDS, TOPICS, LINKS, IDEAS, IDEA_USES, LINK_KINDS, KIND_ORDER, EDGES, linksOf, linkLabel, ideasOf, usesOf, topicById } from '../src/data/topics.js';

test('each kind of link means one thing: labels both ways, a question, a test and an example', () => {
  assert.ok(KIND_ORDER.length >= 5 && KIND_ORDER.length <= 8, 'keep the vocabulary small enough to remember');
  for (const k of KIND_ORDER) {
    const d = LINK_KINDS[k];
    for (const f of ['t', 'out', 'back', 'means', 'ask', 'test', 'example']) assert.ok(d[f], k + ' needs "' + f + '"');
    assert.match(d.ask, /\?$/, k + ': "ask" is the question this kind answers');
    assert.ok(d.example.includes(' ' + k + ' '), k + ': the example uses the kind');
  }
});

test('every kind is used, and every "causes" link can be predicted', () => {
  for (const k of KIND_ORDER) assert.ok(LINKS.some(l => l.kind === k), 'no link of kind "' + k + '" yet');
  for (const l of LINKS.filter(x => x.kind === 'causes')) assert.ok(l.if && l.then, l.from + ' causes ' + l.to);
  assert.equal(EDGES.length, LINKS.length);
});

test('findLoop finds loops, and only loops', () => {
  assert.equal(findLoop([['a', 'b'], ['b', 'c'], ['a', 'c']]), null);
  assert.deepEqual(findLoop([['a', 'b'], ['b', 'c'], ['c', 'a']]), ['a', 'b', 'c', 'a']);
  assert.deepEqual(findLoop([['x', 'y'], ['y', 'y']]), ['y', 'y']);
});

test('a topic sees each link from its own side', () => {
  const up = linksOf('transistor').find(l => l.kind === 'builds-on' && l.other === 'physics');
  assert.ok(up && up.out); assert.equal(linkLabel(up), 'Builds on');
  const down = linksOf('physics').find(l => l.other === 'transistor');
  assert.equal(down.out, false); assert.equal(linkLabel(down), 'Foundation for');
  const ks = linksOf('riscv').map(l => KIND_ORDER.indexOf(l.kind));
  assert.deepEqual(ks, ks.slice().sort((a, b) => a - b), 'links come in kind order');
});

test('topics come in map order: band by band, top to bottom', () => {
  const ix = TOPICS.map(t => BANDS.findIndex(b => b.id === t.band));
  ix.forEach((v, i) => assert.ok(i === 0 || v >= ix[i - 1], TOPICS[i].id));
});

test('big ideas echo across layers, and some show where they break', () => {
  for (const i of IDEAS) assert.ok(new Set(usesOf(i.id).map(u => topicById(u.topic).band)).size >= 2, i.id);
  assert.ok(IDEA_USES.some(u => u.counter), 'at least one counter-example');
  const shown = TOPICS.filter(t => ideasOf(t.id).length).length;
  assert.ok(shown / TOPICS.length >= 0.75, 'most topics show at least one big idea (' + shown + ' of ' + TOPICS.length + ')');
});

test('trade-offs, measures and debates are shared, and each debate has real sides', async () => {
  const { TRADEOFFS, MEASURES, DEBATES, tradeoffUses, measureUses, debatesOf, debateTopics } = await import('../src/data/topics.js');
  for (const t of TRADEOFFS) assert.ok(tradeoffUses(t.id).length >= 2, t.id);
  for (const m of MEASURES) assert.ok(measureUses(m.id).length >= 2 && ['higher', 'lower'].includes(m.better), m.id);
  for (const d of DEBATES) {
    assert.ok(d.views.length >= 2, d.id + ' has two sides');
    for (const v of d.views) assert.ok(v.assumes && v.topics.length, d.id + ': ' + v.t + ' names an assumption and a place to test it');
    assert.ok(new Set(d.views.map(v => v.t)).size === d.views.length, d.id + ': views have different names');
    assert.ok(debateTopics(d).every(id => debatesOf(id).includes(d)), d.id);
  }
  assert.ok(debatesOf('yield').some(d => d.id === 'bigdie'));
});
