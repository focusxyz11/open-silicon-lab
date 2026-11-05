// Old links and saved progress must survive when topics merge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVED, movedTo, moveSolved, moveProgress, migrateSaved } from '../src/core/moved.js';
import { TOPICS } from '../src/data/topics.js';

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

test('seen topics move, and quiz answers never land on the wrong questions', () => {
  const p = moveProgress({ seen: { compute: 1, yield: 1 }, quiz: { compute: { 0: 1 }, yield: { 0: 2 } }, other: 5 }, moved);
  assert.deepEqual(p, { seen: { accelerators: 1, yield: 1 }, quiz: { accelerators: { 0: 1 }, yield: { 0: 2 } }, other: 5 });
  assert.deepEqual(moveProgress({ seen: {}, quiz: { compute: { 0: 1 }, accelerators: { 0: 2 } } }, moved).quiz, { accelerators: { 0: 2 } });
});

test('migrating twice changes nothing more, and damaged saves do not stop the site', () => {
  const s = store({ 'osl-solved-v1': JSON.stringify({ 'compute/A': '2026-11-01' }), 'sjl-progress-v3': '{broken' });
  migrateSaved(s, moved); const once = s.m.get('osl-solved-v1');
  assert.deepEqual(JSON.parse(once), { 'accelerators/A': '2026-11-01' });
  migrateSaved(s, moved); assert.equal(s.m.get('osl-solved-v1'), once);
  assert.equal(s.m.get('sjl-progress-v3'), '{broken');
});

test('with nothing moved, the store is not touched', () => {
  const s = store({}); s.setItem = () => assert.fail('wrote to the store');
  migrateSaved(s, {});
});

test('every moved topic points at a live topic, and is not one itself', () => {
  const live = new Set(TOPICS.map(t => t.id));
  for (const [from, to] of Object.entries(MOVED)) { assert.ok(!live.has(from), from + ' still has a folder'); assert.ok(live.has(to), to + ' is not a topic'); }
});
