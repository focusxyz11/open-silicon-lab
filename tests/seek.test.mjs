/* Something to do at every level (src/data/seek.js, issues #235, #246, #247): each search names parts its view draws
   at that level, has words to look for and something to notice on every part, leads into the question the level's
   card shows, and is kept. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SEEK, normalLooked, foundAt, seekAt, seekLevel } from '../src/data/seek.js';
import { VIEW_PARTS } from '../src/data/atlas.js';
import { STOPS, WORLDS, partWord } from '../src/data/weave.js';
import { stopsAt } from '../src/data/places.js';
import { partsOf } from '../src/app/scenes.js';
import { normalState, fresh, DIVE_LEVELS } from '../src/v2/game.js';
import { DC_LEVELS, DC_ASKS } from '../src/data/views3d.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const src = f => readFileSync(new URL('../src/v2/' + f, import.meta.url), 'utf8');

/* a flight's levels, the question each card shows, and the names on its picture with the stretch of the flight each
   is shown on (read from the source, as tests/redesign.test.mjs reads them: the flights load three.js) */
const flight = (file, objs, extra = [], data = null) => {
  const f = src(file);
  const levels = data ? data.levels : f.match(/LEVELS = \[([^\]]+)\]/)[1].match(/'([a-z]+)'/g).map(s => s.slice(1, -1));
  const asks = data ? data.asks : Object.fromEntries([...f.match(/ASKS = \{([^}]+)\}/)[1].matchAll(/([a-z]+): '([a-z.]+)'/g)].map(m => [m[1], m[2]]));
  const names = [...f.matchAll(new RegExp("\\['([a-z]+)', (?:" + objs + "), W3\\(.*?\\), \\[([\\d.]+), ([\\d.]+)\\]\\]", 'g'))].map(m => [m[1], +m[2], +m[3]]).concat(extra);
  /* named at a level as the flight's parts(lv) has it */
  const at = lv => names.filter(([, a, b]) => lv >= a - 0.01 && lv <= b + 0.01).map(n => n[0]);
  return { levels, asks, at };
};
/* the data centre's levels and questions are plain data (src/data/views3d.js) */
const DC = flight('dc3d.js', 'scene|rack|tray|pkg', [], { levels: DC_LEVELS, asks: DC_ASKS });
const PH = flight('phone3d-flight.js', 'hinge|phone|parts|soc|dram|scene', ['isp', 'gpu', 'npu', 'cpu', 'cache'].map(id => [id, 2.6, 3.05]));

test('every search looks at parts its view draws at that level, with words for each', () => {
  for (const [lv, Q] of Object.entries(SEEK)) {
    const level = seekLevel(lv);
    const drawn = Q.view === 'flight' ? DC.at(DC.levels.indexOf(level)) : Q.view === 'phone' ? PH.at(PH.levels.indexOf(level)) : Object.keys(partsOf(level));
    assert.ok(Q.parts.length >= 3, lv + ': a search needs at least three parts to choose from');
    Q.parts.forEach(p => { assert.ok(drawn.includes(p), lv + ': ' + p + ' is not drawn there'); assert.ok(EN['seek.' + lv + '.' + p], lv + ': no notice for ' + p); });
    if (Q.view !== 'dive') Q.parts.forEach(p => assert.ok(VIEW_PARTS[Q.view][p], lv + ': ' + p + ' is no part of the ' + Q.view));
    assert.ok(Q.parts.includes(Q.leads), lv + ': the part that leads in must be one of its parts');
    assert.ok(EN['seek.' + lv + '.find'], lv + ': no words for what to look for');
    assert.ok(STOPS[Q.ask] && EN['stop.' + Q.ask + '.q'], lv + ': leads into ' + Q.ask + ', which is not a question');
    assert.match(Q.at, /^#\/(place|dive)\//, lv + ': its address');
    /* it leads into the question its level's card shows (lit there once found) */
    if (Q.view === 'flight') assert.equal(DC.asks[level], Q.ask, lv + ': the data centre\'s ' + level + ' asks ' + DC.asks[level]);
    if (Q.view === 'phone') assert.equal(PH.asks[level], Q.ask, lv + ': the phone\'s ' + level + ' asks ' + PH.asks[level]);
    /* in the dive, the question is about the part that leads in */
    if (Q.view === 'dive') { assert.equal(Q.ask.split('.')[1], level); assert.ok(STOPS[Q.ask].includes(Q.leads), lv + ': ' + Q.leads + ' is not a part of ' + Q.ask); assert.equal(stopsAt(level)[0], Q.ask, lv + ': the card shows ' + stopsAt(level)[0]); }
    /* a level of the dive the phone's flight flies through: the same parts, named there too, by the same words */
    if (Q.fly) { assert.equal(Q.view, 'dive'); const named = PH.at(PH.levels.indexOf(Q.fly));
      Q.parts.forEach(p => { assert.ok(named.includes(p), lv + ': ' + p + ' is not named at the phone\'s ' + Q.fly); assert.equal(VIEW_PARTS.phone[p], partWord(level, p), lv + ': ' + p + ' has other words in the flight'); });
      assert.equal(PH.asks[Q.fly], Q.ask, lv + ': the phone\'s ' + Q.fly + ' asks ' + PH.asks[Q.fly]); }
  }
});

test('every level of both flights and of the dive has something to find (the wafer draws too few parts)', () => {
  DC.levels.forEach(lv => assert.ok(seekAt('flight', lv), 'the data centre\'s ' + lv));
  PH.levels.forEach(lv => assert.ok(seekAt('phone', lv), 'the phone\'s ' + lv));
  const dive = new Set(DIVE_LEVELS.concat(...['phone', 'car', 'made'].map(w => WORLDS.find(x => x.id === w).depths)));
  dive.forEach(lv => { if (lv !== 'wafer') assert.ok(seekAt('dive', lv), 'the dive\'s ' + lv); });
  /* one search for one level: found at the phone's board in the flight is found in the dive */
  assert.equal(seekAt('phone', 'board'), 'phoneboard'); assert.equal(seekAt('flight', 'chip'), 'accel'); assert.equal(seekAt('dive', 'chip'), 'chip');
});

test('what you looked at is kept, and found only at the part that leads in', () => {
  assert.deepEqual(fresh().looked, {});
  const s = normalState({ looked: { server: ['memory', 'nope', 'accelerator'], gate: ['diff'], nowhere: ['x'], phoneboard: 'soc' } });
  assert.deepEqual(s.looked, { server: ['accelerator', 'memory'], gate: ['diff'] });
  assert.ok(foundAt(s.looked, 'server')); assert.ok(!foundAt(s.looked, 'gate')); assert.ok(!foundAt(s.looked, 'phoneboard'));
  assert.deepEqual(normalLooked(null), {});
});
