// The knowledge graph and content stay consistent: every link points at something that exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { BANDS, TOPICS, EDGES, THREADS } from '../src/data/topics.js';
import { CHALLENGES, PROBLEMS } from '../src/data/challenges.js';
import { CARDS } from '../src/data/cards.js';
import { GL } from '../src/data/learning.js';

const ids = new Set(TOPICS.map(t => t.id));
const root = new URL('..', import.meta.url);
const facts = JSON.parse(readFileSync(new URL('src/data/facts.json', root)));

test('every topic has a band and a content file', () => {
  const bands = new Set(BANDS.map(b => b.id));
  for (const t of TOPICS) {
    assert.ok(bands.has(t.band), t.id + ' band');
    const f = new URL('topics/' + t.id + '/content.html', root);
    assert.ok(existsSync(f), t.id + ' content file');
    assert.match(readFileSync(f, 'utf8'), new RegExp('<section id="' + t.id + '"'), t.id + ' section id');
  }
});
test('links, threads, challenges, problems, cards and glossary point at real topics', () => {
  for (const [a, b, l] of EDGES) { assert.ok(ids.has(a) && ids.has(b), a + '→' + b); assert.ok(l.length > 3); }
  for (const th of THREADS) th.path.forEach(id => assert.ok(ids.has(id), th.id + ': ' + id));
  for (const c of CHALLENGES) { assert.ok(ids.has(c.topic), c.t); assert.ok(['Puzzle', 'Design', 'Experiment'].includes(c.kind)); }
  for (const p of PROBLEMS) p.try.forEach(id => assert.ok(ids.has(id), p.id + ': ' + id));
  for (const [k, c] of Object.entries(CARDS)) assert.ok(ids.has(c[3]), 'card ' + k);
  for (const g of GL) assert.ok(ids.has(g[3]), 'term ' + g[0]);
});
test('every topic is connected to the graph', () => {
  for (const t of TOPICS) assert.ok(EDGES.some(e => e[0] === t.id || e[1] === t.id), t.id + ' has a connection');
});
test('facts are dated, sourced and filed under a topic', () => {
  assert.match(facts.lastCheck, /^\d{4}-\d{2}-\d{2}$/);
  for (const f of facts.facts) {
    assert.ok(ids.has(f.topic), f.label + ' topic');
    assert.ok(['reported', 'claim', 'estimate', 'projection'].includes(f.kind), f.label + ' kind');
    assert.match(f.verified, /^\d{4}-\d{2}-\d{2}/, f.label + ' verified date');
    assert.match(f.url, /^https:\/\//, f.label + ' source url');
  }
});
