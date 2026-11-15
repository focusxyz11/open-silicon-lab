/* The framework (docs/framework/): its data holds together, agrees with the repository, and the map draws the
   same data. The framework is a plan, not the site: these tests keep the plan honest while the site is rebuilt. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { skeleton, embedded, problems, counts } from '../scripts/framework.mjs';
import { THREADS } from '../src/data/weave.js';

const S = skeleton();

test('the skeleton holds: every link names something that exists, and the questions are the site\'s own', () => {
  assert.deepEqual(problems(S), []);
  assert.deepEqual(S.worlds.map(w => w.id), THREADS.map(t => t.id), 'one world for each core question, in the weave\'s order');
  S.worlds.forEach((w, i) => assert.equal(w.hue, THREADS[i].hue, w.id + ' keeps its thread\'s colour'));
});

test('the map draws the same data (run `node scripts/framework.mjs` after changing skeleton.json)', () => {
  assert.deepEqual(embedded(), S);
});

test('the documents give the counts the data gives', () => {
  const c = counts(S), n = S.worlds.flatMap(w => w.experiments).length, readme = readFileSync(new URL('../docs/framework/README.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  assert.ok(readme.includes(n + ' experiments'), 'README: ' + n + ' experiments');
  for (const [words, k] of [['can be played today', 'live'], ['have an engine and wait to be built', 'ready'], ['are only words', 'words'], ['need something the lab does not have', 'wanted']]) assert.ok(readme.includes(c[k] + ' ' + words), 'README: ' + c[k] + ' ' + words);
  for (const w of S.worlds) { const row = ['live', 'ready', 'words', 'wanted'].map(st => w.experiments.filter(x => x.state === st).length).join(' · '); assert.ok(readme.includes(w.question + ' |') && readme.includes('| ' + row + ' |'), 'README: ' + w.id + ' stands at ' + row); }
});
