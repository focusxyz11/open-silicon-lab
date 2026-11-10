import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { QUESTIONS, DEPTHS, PLACES, PORTALS, topicsAt } from '../src/data/frame.js';

const en = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url)));
const qids = new Set(QUESTIONS.map(q => q.id)), dids = new Set(DEPTHS.map(d => d.id));
const topics = readdirSync(new URL('../topics/', import.meta.url), { withFileTypes: true })
  .filter(e => e.isDirectory() && !e.name.startsWith('_') && existsSync(new URL(`../topics/${e.name}/topic.json`, import.meta.url))).map(e => e.name);

test('the frame has 11 questions and 10 depths', () => {
  assert.equal(QUESTIONS.length, 11);
  assert.equal(DEPTHS.length, 10);
  assert.equal(QUESTIONS.filter(q => q.onTime).length, 1);
});
test('every topic docks at exactly one valid place', () => {
  for (const t of topics) assert.ok(PLACES[t], `topic ${t} has no place in the frame`);
  for (const [t, [q, d]] of Object.entries(PLACES)) {
    assert.ok(topics.includes(t), `place for unknown topic ${t}`);
    assert.ok(qids.has(q), `${t}: unknown question ${q}`);
    assert.ok(dids.has(d), `${t}: unknown depth ${d}`);
  }
});
test('every question has a topic, an entry depth and its words', () => {
  for (const q of QUESTIONS) {
    assert.ok(topicsAt(q.id).length, `question ${q.id} has no topic yet`);
    assert.ok(dids.has(q.entry), `${q.id}: bad entry depth`);
    for (const k of ['name', 'question', 'leads']) assert.ok(en[`frame.q.${q.id}.${k}`], `missing frame.q.${q.id}.${k}`);
  }
  for (const d of DEPTHS) assert.ok(en[`frame.d.${d.id}`], `missing frame.d.${d.id}`);
});
test('portals join known questions, once each, with a reason', () => {
  const seen = new Set();
  for (const [a, b] of PORTALS) {
    assert.ok(qids.has(a) && qids.has(b) && a !== b);
    const k = [a, b].sort().join('|');
    assert.ok(!seen.has(k), `duplicate portal ${k}`); seen.add(k);
    assert.ok(en[`frame.p.${a}|${b}`], `missing frame.p.${a}|${b}`);
  }
  for (const q of qids) assert.ok(PORTALS.some(p => p.includes(q)), `question ${q} has no portal`);
});
