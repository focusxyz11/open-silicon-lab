/* Chip X-ray (src/engines/xray.js, blocks in src/app/scenes.js): each dive's chip read as a die photo. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TYPES, DIE, shares, askFor, hit, partsFor } from '../src/engines/xray.js';
import { xrayOf, XRAY_AT, setXray, partsOf, SCENES } from '../src/app/scenes.js';
import { DEPTHS } from '../src/data/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const inside = (r, R) => r[0] >= R[0] - 1e-9 && r[1] >= R[1] - 1e-9 && r[0] + r[2] <= R[0] + R[2] + 1e-9 && r[1] + r[3] <= R[1] + R[3] + 1e-9;

test('every chip at the bottom of a dive has a die photo, its blocks on the die, every kind with its words', () => {
  for (const id of XRAY_AT) {
    const B = xrayOf(id);
    assert.ok(B.length > 5, id);
    for (const b of B) { assert.ok(TYPES.includes(b.type), id + ': ' + b.type); assert.ok(inside(b.r, DIE), id + ': a block off the die'); }
    for (const k of new Set(B.map(b => b.type))) { assert.ok(EN['xray.type.' + k + '.t'] && EN['xray.type.' + k + '.clue'], k + ' has words'); }
    assert.ok(EN['xray.read.' + id], id + ' says what it is for');
    const s = shares(B), sum = Object.values(s).reduce((a, v) => a + v, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9 && s.other > 0 && s.other < 0.6, id + ': the shares add up, and most of the die is blocks');
  }
});

test('the dive goes on inside a processor core: the next depth is logic', () => {
  for (const id of XRAY_AT) {
    const p = DEPTHS[id].portal, b = hit(xrayOf(id), p[0] + p[2] / 2, p[1] + p[2] / 2);
    assert.equal(b && b.type, 'core', id);
    assert.ok(inside([p[0], p[1], p[2], p[2]], b.r), id + ': the portal lies wholly in the core');
  }
});

test('where the area goes says what a chip is for', () => {
  assert.equal(askFor(xrayOf('chip'))[0], 'core', 'an AI chip is mostly compute');
  assert.equal(askFor(xrayOf('mcu'))[0], 'flash', 'a microcontroller is mostly the memory that keeps its program');
  assert.ok(askFor(xrayOf('soc')).includes('npu') && askFor(xrayOf('soc')).includes('gpu'), 'a phone chip has a district for each job');
});

test('in X-ray, the parts of a chip are its kinds of block, and only there', () => {
  setXray(true);
  try {
    for (const id of XRAY_AT) assert.deepEqual(Object.keys(partsOf(id)).sort(), Object.keys(partsFor(xrayOf(id))).sort());
    assert.equal(partsOf('block'), SCENES.block.parts);
  } finally { setXray(false); }
  assert.deepEqual(Object.keys(partsOf('chip')), Object.keys(SCENES.chip.parts));
});
