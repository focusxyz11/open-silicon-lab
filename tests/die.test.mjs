/* The data centre's chip as one plan (src/data/die.js): the die the flight lands on and the dive's chip level are
   drawn from it, so the chip you land on is the chip you saw. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SLAB, METRES, coreGrid, CACHE, IO, STACKS, BASE, PACKAGE, padsOf, PADS } from '../src/data/die.js';
import { DEPTHS } from '../src/data/weave.js';
import { model, START } from '../src/engines/chip.js';
import { diveWord } from '../src/data/atlas.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const inside = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];
const apart = (a, b) => a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1];

test('the die is drawn at the dive\'s own scale', () => {
  assert.equal(METRES, DEPTHS.chip.m / 1000);
  const cm = SLAB[2] * METRES * 100; assert.ok(cm > 1.5 && cm < 3, 'a die about two centimetres across, not ' + cm);
});

test('the tiles, the memory band, the links and the pads lie on the die, apart', () => {
  const tiles = coreGrid(...model(START).grid).map(c => c.r);
  assert.equal(tiles.length, 12);
  [...tiles, CACHE, IO, ...padsOf(PADS)].forEach(r => assert.ok(inside(r, SLAB), r + ' is off the die'));
  tiles.forEach(t => { assert.ok(apart(t, CACHE) && apart(t, IO)); });
  assert.ok(apart(CACHE, IO));
});

test('the memory stacks stand beside the die, on the base they share, inside the package', () => {
  assert.equal(STACKS.length, 4);
  STACKS.forEach((s, i) => {
    assert.ok(apart(s, SLAB), 'stack ' + i + ' overlaps the die');
    assert.ok(s[0] > SLAB[0] + SLAB[2], 'stack ' + i + ' is not beside the die');
    assert.ok(inside(s, BASE), 'stack ' + i + ' is off the base');
    STACKS.forEach((o, j) => { if (j > i) assert.ok(apart(s, o), 'stacks ' + i + ' and ' + j + ' overlap'); });
  });
  assert.ok(inside(SLAB, BASE));
  const h = PACKAGE.side / 2, pk = [PACKAGE.at[0] - h, PACKAGE.at[1] - h, 2 * h, 2 * h];
  assert.ok(inside(BASE, pk), 'the base is wider than the package');
});

test('going deeper from the chip comes down into one tile', () => {
  const [x, y, s] = DEPTHS.chip.portal, door = [x, y, s, s];
  const tiles = coreGrid(...model(START).grid).map(c => c.r);
  assert.equal(tiles.filter(t => inside(door, t)).length, 1);
});

test('the stacks the dive shows are named by their home', () => {
  const w = diveWord('chip', 'hbm');
  assert.equal(w, 'pkg.memory');
  assert.ok(EN['part.' + w] && EN['what.' + w]);
  assert.equal(diveWord('chip', 'cores'), 'chip.cores');
});
