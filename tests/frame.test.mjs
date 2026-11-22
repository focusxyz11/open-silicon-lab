// The thirteen as lenses (src/data/frame.js, src/engines/frame.js): every experiment and challenge is filed under real
// questions, every word a lens shows exists, every level with questions offers a handful of lenses, and each lens holds
// what it says (its own stops, challenges played at that level, a question it meets that also lives there or by a seam).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as FrameData from '../src/data/frame.js';
import { FIELD } from '../src/data/questions.js';
import { partsOf } from '../src/app/scenes.js';
const { QUESTIONS, FILED, SEAMS, MARKS } = FrameData;
import { IDS, MAX_AT, createLenses, seamOf, questionOf } from '../src/engines/frame.js';
import { EXPERIMENTS } from '../src/engines/experiments.js';
import { STOPS, THREADS } from '../src/data/weave.js';
import { CHALLENGES } from '../src/v2/game.js';
import { doHome } from '../src/engines/way.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
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

/* a filing: a home question, then one or two it joins, all real and none twice */
const filedWell = (what, f) => {
  assert.ok(Array.isArray(f) && f.length >= 1 && f.length <= 3, what + ' is not filed, or files too many');
  for (const q of f) assert.ok(IDS.includes(q), what + ': ' + q + ' is not a question');
  assert.equal(new Set(f).size, f.length, what + ' files a question twice');
};
test('every question from the field and every stop is filed once, under real questions; nothing is filed by thread', () => {
  for (const q of FIELD) filedWell('field question ' + q.id, FILED.field[q.id]);
  for (const id of Object.keys(FILED.field)) assert.ok(FIELD.some(q => q.id === id), 'filed but gone: field ' + id);
  for (const k of Object.keys(STOPS)) filedWell('stop ' + k, FILED.stops[k]);
  for (const k of Object.keys(FILED.stops)) assert.ok(k in STOPS, 'filed but gone: stop ' + k);
  /* each stop belongs to the questions it is filed under, its home first */
  for (const k of Object.keys(STOPS)) assert.equal(L.questionsOfStop(k)[0], FILED.stops[k][0], k);
  assert.ok(!('THREAD_HOME' in FrameData), 'the threads no longer file anything');
  assert.ok(THREADS.length);
});

test('the field questions lead: at their home level, a lens gives its home ones first', () => {
  assert.equal(L.lensAt('geo', 'block').field[0], 'fetch');
  assert.equal(L.lensAt('vn', 'gate').field[0], 'spare');
  assert.equal(L.lensAt('copy', 'gate').field[0], 'brain');
  /* the field question weighs most at its home: its home question lives there */
  for (const q of FIELD.filter(f => f.home.level)) {
    const home = FILED.field[q.id][0], x = L.lensAt(home, q.home.level);
    assert.ok(x.field.includes(q.id), q.id + ' is not in the ' + home + ' lens at ' + q.home.level);
    if (DEPTHS.includes(q.home.level)) assert.ok(L.lensesAt(q.home.level).includes(home), q.id + ': ' + home + ' does not live at ' + q.home.level);
  }
  /* home ones before joins */
  for (const d of DEPTHS) for (const q of L.lensesAt(d)) {
    const f = L.lensAt(q, d).field, homes = f.map(id => FILED.field[id][0] === q);
    assert.deepEqual(homes, homes.slice().sort((a, b) => b - a), q + ' at ' + d + ': home field questions first');
    for (const id of f) assert.equal(FIELD.find(x => x.id === id).home.level, d);
  }
});

test('every lens that lives at a level has its mark there, on a part the level names', () => {
  const levels = [...new Set(DEPTHS.concat(FIELD.filter(f => f.home.level).map(f => f.home.level)))];
  for (const d of levels) {
    const here = L.lensesAt(d); if (!here.length) continue;
    const parts = Object.keys(partsOf(d) || {});
    assert.ok(MARKS[d], d + ' has lenses but no marks');
    for (const q of here) assert.ok(parts.includes(MARKS[d][q]), d + ': the ' + q + ' lens has no mark on a part of the level (' + MARKS[d][q] + ')');
    for (const q of Object.keys(MARKS[d])) assert.ok(here.includes(q), d + ': a mark for ' + q + ', which does not live there');
  }
  for (const d of Object.keys(MARKS)) assert.ok(levels.includes(d), 'marks at ' + d + ', which is no level with lenses');
});

test('every seam is named', () => {
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
      for (const id of x.field) assert.ok(FILED.field[id].includes(q) && ('field.' + id + '.q') in EN, id);
      for (const k of x.stops) { assert.equal(k.split('.')[1], d); assert.ok(L.questionsOfStop(k).includes(q)); assert.ok(('stop.' + k + '.q') in EN, k); }
      for (const id of x.challenges) assert.ok(CHALLENGES.some(c => c.id === id), id);
      assert.ok(x.field.length || x.stops.length || x.experiments.length || ('frame.at.' + q + '.' + d + '.q') in EN, q + ' at ' + d + ' has no form to show');
      for (const id of x.experiments) assert.ok(EXPERIMENTS.some(e => e.id === id), id);
      if (x.meets) { assert.notEqual(x.meets, q); if (x.seam) assert.ok(('frame.seam.' + x.seam) in EN); }
      if (x.next) { assert.notEqual(x.next, d); assert.ok(L.lensesAt(x.next).includes(q)); }
    }
  }
});

test('the words written for a question at a level are for a lens that lives there', () => {
  /* a form waiting for its lens to live there again (src/data/waiting-words.json) is kept, not shown */
  const WAITING = new Set(JSON.parse(readFileSync(new URL('../src/data/waiting-words.json', import.meta.url), 'utf8')).keys);
  for (const k of Object.keys(EN).filter(k => /^frame\.at\..+\.q$/.test(k) && !WAITING.has(k))) {
    const [, , q, d] = k.split('.');
    assert.ok(IDS.includes(q), k);
    assert.ok(L.lensesAt(d).includes(q), q + ' does not live at ' + d);
    assert.ok(('frame.at.' + q + '.' + d + '.note') in EN, k + ' has no note');
  }
});
