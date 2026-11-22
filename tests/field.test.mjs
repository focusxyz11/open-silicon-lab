// The questions from the field (src/data/questions.js): each has its words, a shape that matches how many primitives
// meet in it, one home that exists, and, for a leak, a seam a visitor can cross. See docs/SYSTEM.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIELD, PRIMS, SHAPES, SIZE, SEAMS } from '../src/data/questions.js';
import { fieldHome, levelAt } from '../src/data/atlas.js';
import { PLACES } from '../src/v2/game.js';
import { STAGES, seamOf, whereOf } from '../src/engines/way.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();

test('every question has its words, a shape and the primitives that make that shape', () => {
  const ids = new Set();
  for (const q of FIELD) {
    assert.ok(!ids.has(q.id), q.id + ' is there twice'); ids.add(q.id);
    for (const w of ['q', 'who', 'opened', 'open']) assert.ok(EN['field.' + q.id + '.' + w], 'field.' + q.id + '.' + w + ' is missing from en.json');
    assert.ok(SHAPES.includes(q.shape), q.id + ': no shape ' + q.shape);
    assert.equal(new Set(q.prims).size, q.prims.length, q.id + ' names a primitive twice');
    assert.equal(q.prims.length, SIZE[q.shape], q.id + ': a ' + q.shape + ' is where ' + SIZE[q.shape] + ' primitive(s) meet');
    q.prims.forEach(p => assert.ok(PRIMS.includes(p), q.id + ': no primitive ' + p));
    assert.match(EN['field.' + q.id + '.q'], /\?$/, q.id + ' is asked as a question');
    assert.match(q.src, /^https?:\/\//, q.id + ' says where to read it');
  }
});

test('every question has one home that exists, and only leaks sit on seams', () => {
  for (const q of FIELD) {
    const h = fieldHome(q.id);
    if (q.home.level) assert.ok(h && h.place, q.id + ': level ' + q.home.level + ' has no place');
    else assert.ok(PLACES.includes(q.home.place), q.id + ': no place ' + q.home.place);
    assert.equal(!!q.seam, q.shape === 'leak' && !!q.seam, q.id + ': only a leak sits on a seam');
    if (q.seam && q.seam.a) [q.seam.a, q.seam.b].forEach(l => assert.ok(levelAt(l), q.id + ': no level ' + l));
    if (q.seam && q.seam.along) q.seam.along.forEach(s => assert.ok(STAGES.includes(s), q.id + ': no stage ' + s));
  }
  assert.ok(SEAMS.length >= 8);
});

test('crossing a seam raises its leak, and nothing else does', () => {
  assert.equal(seamOf(whereOf('#/place/datacentre/4'), whereOf('#/place/datacentre/5')), 'wait');
  assert.equal(seamOf(whereOf('#/dive/chip'), whereOf('#/dive/block')), 'secret');
  assert.equal(seamOf(whereOf('#/dive/gate'), whereOf('#/dive/block')), 'fetch');
  assert.equal(seamOf(whereOf('#/place/studio'), whereOf('#/place/fab')), 'copy');
  assert.equal(seamOf(whereOf('#/bench/masks'), whereOf('#/line/print')), 'perfect');
  assert.equal(seamOf(whereOf('#/line/wires'), whereOf('#/line/test')), 'pins');
  assert.equal(seamOf(whereOf('#/dive/building'), whereOf('#/dive/rack')), null);
  assert.equal(seamOf(whereOf('#/dive/atom'), whereOf('#/dive/atom')), null);
});

test('no two leaks share a seam', () => {
  const keys = SEAMS.map(q => q.seam.a ? [q.seam.a, q.seam.b].sort().join('|') : q.seam.along.slice().sort().join('>') + (q.seam.on || ''));
  assert.equal(new Set(keys).size, keys.length);
});
