/* The atlas (src/data/atlas.js, docs/SYSTEM.md): every thing has exactly one home, views name things by that
   home, and nothing is written twice. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { partHome, stopHome, VIEW_PARTS, STORIES, TWINS, twinOf, levelAt } from '../src/data/atlas.js';
import { INSIDE } from '../src/data/places.js';
import { STOPS, MADE, WORLDS } from '../src/data/weave.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const inside = (place, depth) => (INSIDE[place] || []).some(l => l.depth === depth);

test('every part has one home, a place and a level, and explains itself', () => {
  const parts = Object.keys(EN).filter(k => k.startsWith('part.')).map(k => k.slice(5));
  assert.ok(parts.length > 100);
  for (const id of parts) {
    const h = partHome(id);
    assert.ok(h && h.place, id + ' has no home');
    assert.ok(inside(h.place, h.level), id + ': ' + h.level + ' is not a level of ' + h.place);
    assert.ok(EN['what.' + id], id + ' does not say what it is');
  }
});

test('views name parts by their home, never with words of their own', () => {
  for (const [view, map] of Object.entries(VIEW_PARTS)) for (const [local, home] of Object.entries(map)) assert.ok(EN['part.' + home] && EN['what.' + home], view + ': ' + local + ' → ' + home + ' is no part');
  const own = Object.keys(EN).filter(k => !k.startsWith('part.') && !k.startsWith('what.') && /\.part\.[a-z]/.test(k));
  assert.deepEqual(own, [], 'part names outside the atlas: ' + own.join(', '));
});

test('nothing is written twice: every longer text in the words is unique', () => {
  const seen = new Map(), twice = [];
  for (const [k, v] of Object.entries(EN)) if (typeof v === 'string' && v.length >= 40) { if (seen.has(v)) twice.push(seen.get(v) + ' = ' + k); else seen.set(v, k); }
  assert.deepEqual(twice, [], 'the same text twice: ' + twice.join('; '));
});

test('every question has one home, at a level of a place', () => {
  for (const k of Object.keys(STOPS)) { const h = stopHome(k); assert.ok(h && h.place && inside(h.place, h.level), k + ' has no home'); }
  for (const [id, s] of Object.entries(STORIES)) assert.ok(inside(s.place, s.level), 'story ' + id + ' has no home');
});

test('the Turn: each level of a chip, as designed, made and used', () => {
  const dive = new Set(WORLDS.filter(w => !w.hidden && w.id !== 'design' && w.id !== 'journey').flatMap(w => w.depths));
  for (const x of TWINS) {
    assert.ok(dive.has(x.used), x.used + ' is no depth of a dive');
    if (x.designed) assert.ok(inside('studio', x.designed), x.designed + ' is no level of the studio');
    assert.ok(x.made.length && x.made.every(d => ['quarry', 'fab', 'test', 'port'].some(p => inside(p, d))), x.used + ': its steps are not on the line');
    assert.equal(x.made[x.made.length - 1], MADE[x.used], x.used + ' is made last at ' + MADE[x.used]);
    assert.equal(levelAt(x.used).place, 'datacentre');
  }
  /* from anywhere a twin can be reached: every level of the studio, and every step that makes a level */
  for (const l of INSIDE.studio) assert.ok(twinOf(l.depth), 'studio ' + l.depth + ' has no twin');
  for (const d of Object.values(MADE)) assert.ok(twinOf(d), d + ' has no twin');
});

test('a level shared by a flight and the dive has one size: the phone is one phone, the car one car (#380)', async () => {
  const { sizeOf } = await import('../src/data/atlas.js');
  const { DEPTHS } = await import('../src/data/weave.js');
  const { DC_LEVELS } = await import('../src/data/views3d.js');
  const src = f => readFileSync(new URL('../src/v2/' + f, import.meta.url), 'utf8');
  const pairs = (f, name) => Object.fromEntries([...f.match(new RegExp('export const ' + name + ' = \\{([^}]+)\\}'))[1].matchAll(/([a-z]+): '([a-z]+)'/g)].map(m => [m[1], m[2]]));
  /* the flights' rails read their sizes from these maps (src/v2/glue/flights.js) */
  const glue = src('glue/flights.js');
  assert.match(glue, /size: sizeOf\(PH\.SIZE\[k\]\)/); assert.match(glue, /size: sizeOf\(CA\.SIZE\[k\]\)/);
  for (const f of ['phone3d-flight.js', 'car3d-flight.js']) {
    const s = src(f), depth = pairs(s, 'DEPTH'), size = pairs(s, 'SIZE');
    for (const [lv, d] of Object.entries(depth)) {
      assert.ok(sizeOf(size[lv]) > 0, f + ': ' + lv + ' has no size');
      /* the level the flight and the dive both have (a flight's level named as its depth) shows the dive's one size */
      if (lv === d || size[lv] === d) assert.equal(sizeOf(size[lv]), DEPTHS[d].m, f + ': ' + lv + ' has two sizes, ' + sizeOf(size[lv]) + ' m in the flight and ' + DEPTHS[d].m + ' m in the dive');
    }
  }
  for (const lv of DC_LEVELS) if (DEPTHS[lv]) assert.equal(sizeOf(lv), DEPTHS[lv].m, 'the data centre\'s ' + lv + ' has two sizes');
  /* a phone is about fifteen centimetres long */
  assert.ok(DEPTHS.phone.m >= 0.12 && DEPTHS.phone.m <= 0.18, 'a phone is about 15 cm, not ' + DEPTHS.phone.m * 100 + ' cm');
});
