/* The atlas (src/data/atlas.js, docs/SYSTEM.md): every thing has exactly one home, views name things by that
   home, and nothing is written twice. */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { partHome, stopHome, VIEW_PARTS, STORIES, TWINS, twinOf, levelAt } from '../src/data/atlas.js';
import { INSIDE, ABOVE, levelsOf } from '../src/data/places.js';
import { STOPS, MADE, WORLDS } from '../src/data/weave.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
/* a level of a place: one of its levels in the zoom (INSIDE), or above it (ABOVE: mind) */
const inside = (place, depth) => levelsOf(place).some(l => l.depth === depth);

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

test('mind is a level above the machine, with a home in the atlas, and not a size (#445, docs/PATH.md)', async () => {
  const { sizeOf, NOT_A_SIZE } = await import('../src/data/atlas.js');
  /* one home: a level of the data centre, its own (not a shared depth), above the machine (the rack and the board) */
  assert.deepEqual(levelAt('mind'), { place: 'datacentre', world: 'datacentre', level: 'mind' });
  const L = levelsOf('datacentre').map(l => l.depth);
  assert.ok(L.indexOf('mind') >= 0 && L.indexOf('mind') < L.indexOf('rack') && L.indexOf('mind') < L.indexOf('board'), 'mind is above the machine: ' + L.join(', '));
  /* it explains itself, like every level */
  assert.ok(EN['depth.mind.name'] && EN['depth.mind.see'], 'mind has no words');
  /* not a size: its size is false (a step's is null), and the readout says so */
  assert.deepEqual(NOT_A_SIZE, ['mind']);
  assert.equal(sizeOf('mind'), false);
  for (const lv of Object.values(ABOVE).flat().map(l => l.depth)) assert.ok(NOT_A_SIZE.includes(lv), lv + ' is above a place\'s zoom, so it is not a size');
  assert.ok(EN['frame.size.not'] && EN['frame.size.notAt'], 'the readout has no words for a level that is not a size');
});

test('mind stays out of the zoom: nothing on the dive changes for a visitor (#445)', async () => {
  const { DEPTHS } = await import('../src/data/weave.js');
  const { DIVE_LEVELS, FLOWN, viewOfDepth } = await import('../src/v2/loop.js');
  const { doHome } = await import('../src/engines/way.js');
  for (const lv of Object.values(ABOVE).flat().map(l => l.depth)) {
    /* the zoom runs on sizes and portals: mind has neither, so no depth, no world's way down, no flight holds it */
    assert.ok(!(lv in DEPTHS), lv + ' is a depth of the zoom');
    for (const w of WORLDS) assert.ok(!w.depths.includes(lv), lv + ' is on the way down of ' + w.id);
    assert.ok(!DIVE_LEVELS.includes(lv), lv + ' is a level of the dive');
    for (const F of Object.values(FLOWN)) assert.ok(!(lv in F), lv + ' is flown through');
    /* the views list a place's levels from INSIDE: mind is not there until a view shows it (the stack) */
    for (const [p, I] of Object.entries(INSIDE)) assert.ok(!I.some(l => l.depth === lv), lv + ' is listed among the levels of ' + p);
    /* its way in is its place on the island, and a challenge there is played at that place */
    const place = levelAt(lv).place;
    assert.equal(viewOfDepth(lv), '#/place/' + place);
    /* so the lab's AI challenges that belong there (quantization, serving, Learn on one chip) can name it as their level */
    assert.ok(inside(place, lv));
    assert.equal(doHome({ id: 'x', place, at: lv, kind: 'quantize' }), null);
  }
});
