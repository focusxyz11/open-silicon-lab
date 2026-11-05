// Old links and saved progress must survive when topics merge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MOVED, QUIZ_AT, movedTo, moveSolved, moveProgress, migrateSaved } from '../src/core/moved.js';
import { TOPICS } from '../src/data/topics.js';
import { ANCHORS } from '../src/generated/catalog.js';

const moved = { compute: 'accelerators' };
const store = init => { const m = new Map(Object.entries(init)); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), m }; };

test('a moved address finds its new home, and others are left alone', () => {
  assert.equal(movedTo('compute', moved), 'accelerators');
  assert.equal(movedTo('yield', moved), null);
  assert.equal(movedTo('constructor', moved), null);
});

test('solved challenges follow their topic, and the earliest date wins', () => {
  assert.deepEqual(moveSolved({ 'compute/Feed the beast': '2026-11-01', 'yield/Fill the shelf': '2026-11-02' }, moved),
    { 'accelerators/Feed the beast': '2026-11-01', 'yield/Fill the shelf': '2026-11-02' });
  assert.deepEqual(moveSolved({ 'compute/Same': '2026-11-03', 'accelerators/Same': '2026-11-01' }, moved), { 'accelerators/Same': '2026-11-01' });
});

test('seen topics move, and quiz answers land on the same questions after a merge', () => {
  const p = moveProgress({ seen: { compute: 1, yield: 1 }, quiz: { compute: { 0: 1, 2: 3 }, accelerators: { 1: 2 }, yield: { 0: 2 } }, other: 5 }, moved, { compute: 3 });
  assert.deepEqual(p, { seen: { accelerators: 1, yield: 1 }, quiz: { accelerators: { 1: 2, 3: 1, 5: 3 }, yield: { 0: 2 } }, other: 5 });
  assert.deepEqual(moveProgress({ seen: {}, quiz: { compute: { 0: 1 } } }, moved).quiz, {}, 'with no known position, answers are dropped');
});

test('every merged quiz starts where the receiving topic\'s own questions end', () => {
  const quiz = id => JSON.parse(readFileSync(new URL('../topics/' + id + '/topic.json', import.meta.url), 'utf8')).learn.quiz;
  for (const [id, at] of Object.entries(QUIZ_AT)) assert.ok(at <= quiz(MOVED[id]).length && at >= 0, id);
  assert.equal(QUIZ_AT.ecosystem, 3); assert.equal(quiz('supply')[3].q, 'Who is the only maker of EUV lithography scanners?');
});

test('migrating twice changes nothing more, and damaged saves do not stop the site', () => {
  const s = store({ 'osl-solved-v1': JSON.stringify({ 'compute/A': '2026-11-01' }), 'sjl-progress-v3': '{broken' });
  migrateSaved(s, moved, {}); const once = s.m.get('osl-solved-v1');
  assert.deepEqual(JSON.parse(once), { 'accelerators/A': '2026-11-01' });
  migrateSaved(s, moved, {}); assert.equal(s.m.get('osl-solved-v1'), once);
  assert.equal(s.m.get('sjl-progress-v3'), '{broken');
});

test('with nothing moved, the store is not touched', () => {
  const s = store({}); s.setItem = () => assert.fail('wrote to the store');
  migrateSaved(s, {});
});

test('every moved topic points at a live topic, and is not one itself', () => {
  const live = new Set(TOPICS.map(t => t.id)), anchors = new Set(Object.keys(ANCHORS));
  for (const [from, to] of Object.entries(MOVED)) { assert.ok(!live.has(from) && !anchors.has(from), from + ' still exists'); assert.ok(live.has(to) || anchors.has(to), to + ' does not exist'); }
});
