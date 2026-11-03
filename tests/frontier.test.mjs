// The frontier map (src/app/frontier.js) places every challenge by its band and its lens, and every
// open problem (a debate) beside the bands its views touch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, CHALLENGES } from '../src/generated/graph.js';
import { DEBATES } from '../src/data/debates.js';

const LENSES = ['build', 'break', 'imagine'];

test('every challenge says whether it builds, breaks or imagines', () => {
  for (const c of CHALLENGES) assert.ok(LENSES.includes(c.lens), c.topic + ': "' + c.t + '" has lens ' + c.lens);
});

test('each column of the map has challenges in it', () => {
  for (const k of LENSES) assert.ok(CHALLENGES.filter(c => c.lens === k).length >= 5, 'too few challenges to ' + k);
});

test('every open problem points at topics that exist, so the map can place it', () => {
  for (const d of DEBATES) for (const v of d.views) for (const id of v.topics) assert.ok(TOPICS.some(t => t.id === id), d.id + ' (' + v.t + ') names a topic that does not exist: ' + id);
});
