// The thirteen as lenses (src/data/frame.js, src/engines/frame.js): every experiment and challenge is filed under real
// questions, every word a lens shows exists, every level with questions offers a handful of lenses, and each lens holds
// what it says (its own stops, challenges played at that level, a question it meets that also lives there or by a seam).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUESTIONS, FILED, THREAD_HOME, SEAMS } from '../src/data/frame.js';
import { IDS, MAX_AT, createLenses, seamOf, questionOf } from '../src/engines/frame.js';
import { EXPERIMENTS } from '../src/engines/experiments.js';
import { STOPS, THREADS } from '../src/data/weave.js';
import { CHALLENGES } from '../src/v2/game.js';
import { doHome } from '../src/engines/way.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const L = createLenses({ experiments: EXPERIMENTS, stops: STOPS, challenges: CHALLENGES, doHome });
const DEPTHS = [...new Set(Object.keys(STOPS).map(k => k.split('.')[1]))];

test('thirteen questions, each with its words and an icon', () => {
  assert.equal(QUESTIONS.length, 13);
  assert.equal(new Set(IDS).size, 13);
  for (const q of QUESTIONS) {
    assert.ok(q.word in EN, q.word);
    assert.ok(('frame.q.' + q.id) in EN, 'frame.q.' + q.id);
    assert.ok(('frame.q.' + q.id + '.hint') in EN, 'frame.q.' + q.id + '.hint');
    assert.match(q.icon, /^M[\d.\s,MLHVCSQTAZmlhvcsqtaz-]+$/);
  }
  assert.equal(questionOf('nope'), null);
});

test('every experiment and challenge is filed once, under real questions', () => {
  for (const x of EXPERIMENTS) {
    const f = FILED.experiments[x.id];
    assert.ok(f && f.length, 'experiment ' + x.id + ' is not filed');
    for (const q of f) assert.ok(IDS.includes(q), x.id + ': ' + q);
    assert.equal(new Set(f).size, f.length, x.id + ' files a question twice');
  }
  for (const c of CHALLENGES) {
    const f = FILED.challenges[c.id];
    assert.ok(f && f.length, 'challenge ' + c.id + ' is not filed');
    for (const q of f) assert.ok(IDS.includes(q), c.id + ': ' + q);
  }
  for (const id of Object.keys(FILED.experiments)) assert.ok(EXPERIMENTS.some(x => x.id === id), 'filed but gone: ' + id);
  for (const id of Object.keys(FILED.challenges)) assert.ok(CHALLENGES.some(c => c.id === id), 'filed but gone: ' + id);
  /* every question has something filed under it as its home */
  const homes = new Set([...Object.values(FILED.experiments), ...Object.values(FILED.challenges)].map(f => f[0]));
  for (const q of IDS) assert.ok(homes.has(q), q + ' is home to nothing');
});

test('the earlier threads all belong to a question, and every seam is named', () => {
  for (const th of THREADS) assert.ok(IDS.includes(THREAD_HOME[th.id]), 'thread ' + th.id);
  for (const [a, b] of SEAMS) {
    assert.ok(IDS.includes(a) && IDS.includes(b) && a < b, a + '.' + b);
    assert.ok(('frame.seam.' + a + '.' + b) in EN, 'frame.seam.' + a + '.' + b);
    assert.equal(seamOf(b, a), a + '.' + b);
  }
});

test('every level with questions offers a handful of lenses, each holding what it says', () => {
  for (const d of DEPTHS) {
    const here = L.lensesAt(d);
    assert.ok(here.length >= 2 && here.length <= MAX_AT, d + ' offers ' + here.length);
    for (const q of here) {
      const x = L.lensAt(q, d, DEPTHS);
      assert.equal(x.q, q);
      for (const k of x.stops) { assert.equal(k.split('.')[1], d); assert.ok(L.questionsOfStop(k).includes(q)); assert.ok(('stop.' + k + '.q') in EN, k); }
      for (const id of x.challenges) assert.ok(CHALLENGES.some(c => c.id === id), id);
      assert.ok(x.stops.length || x.experiments.length || ('frame.at.' + q + '.' + d + '.q') in EN, q + ' at ' + d + ' has no form to show');
      for (const id of x.experiments) assert.ok(EXPERIMENTS.some(e => e.id === id), id);
      if (x.meets) { assert.notEqual(x.meets, q); if (x.seam) assert.ok(('frame.seam.' + x.seam) in EN); }
      if (x.next) { assert.notEqual(x.next, d); assert.ok(L.lensesAt(x.next).includes(q)); }
    }
  }
});

test('the words written for a question at a level are for a lens that lives there', () => {
  for (const k of Object.keys(EN).filter(k => /^frame\.at\..+\.q$/.test(k))) {
    const [, , q, d] = k.split('.');
    assert.ok(IDS.includes(q), k);
    assert.ok(L.lensesAt(d).includes(q), q + ' does not live at ' + d);
    assert.ok(('frame.at.' + q + '.' + d + '.note') in EN, k + ' has no note');
  }
});
