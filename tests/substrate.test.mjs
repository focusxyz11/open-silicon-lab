/* The Substrate engine's first piece: a 1 passed along a chain survives only where each part restores it. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cascade, NOISES, HIGH, LOW } from '../src/engines/substrate.js';
import { exhaust, WIDTHS, RATES, YEAR } from '../src/engines/floor.js';

test('parts with gain and a threshold hand a clear 1 down a chain of ten, at every level of noise', () => {
  for (const noise of NOISES) { const r = cascade({ restoring: true, noise }); assert.equal(r.reads, 'one', 'noise ' + noise); assert.equal(r.levels.length, 11); assert.ok(r.levels.every(v => v >= 0 && v <= 1)); }
});
test('parts that only pass the signal on lose the 1 within ten steps, even with little noise', () => {
  for (const noise of NOISES) { const r = cascade({ restoring: false, noise }); assert.notEqual(r.reads, 'one', 'noise ' + noise); }
  /* and the loss is gradual: the first step still reads as a 1 */
  assert.ok(cascade({ restoring: false, noise: NOISES[0], stages: 1 }).end >= HIGH);
  assert.ok(LOW < HIGH);
});
test('trying every case: an adder of b bits has 2^(2b) pairs of inputs, and the time is that over the rate', () => {
  assert.equal(exhaust(8, 1e6).pairs, 65536);
  assert.equal(exhaust(16, 1e9).pairs, 4294967296);
  assert.ok(Math.abs(exhaust(32, 1e12).years - Math.pow(2, 64) / 1e12 / YEAR) < 1e-6);
  for (const b of WIDTHS) for (const r of RATES) assert.ok(Number.isFinite(exhaust(b, r).seconds));
  /* a 64-bit adder at a trillion tries a second takes far longer than any lifetime */
  assert.ok(exhaust(64, 1e12).years > 1e18);
});

/* The second piece: lanes side by side, each with its own costs from src/data/media.js */
import { lanes, lane, dominoStep, COOLING, LENGTHS } from '../src/engines/substrate.js';
import { MEDIA } from '../src/data/media.js';
import { readWords } from '../scripts/words.mjs';

test('every medium has a curve, a source for its numbers, and words', () => {
  const EN = readWords();
  for (const m of MEDIA) {
    assert.ok(['restore', 'pass'].includes(m.curve), m.id);
    assert.ok(m.sources.length && m.sources.every(s => /^https:\/\//.test(s.url) && s.name), m.id + ' needs sources');
    for (const k of ['name', 'what']) assert.ok(('side.m.' + m.id + '.' + k) in EN, m.id + ' ' + k);
    assert.ok(m.e === null || m.e > 0); assert.ok(m.t === null || m.t > 0);
  }
});
test('the lanes that keep a 1 down a long chain are the restoring ones, whatever they are made of', () => {
  for (const stages of LENGTHS) {
    const R = lanes(MEDIA, { stages });
    R.lanes.forEach(l => assert.equal(l.reads === 'one', MEDIA.find(m => m.id === l.id).curve === 'restore', l.id + ' at ' + stages));
  }
});
test('silicon is the fastest that keeps the 1; the loops spend least on the chip, but not once the cooling is counted', () => {
  const chip = lanes(MEDIA, { stages: 100, cooling: COOLING[0] });
  assert.equal(chip.fastest.a.id, 'silicon');
  assert.equal(chip.cheapest.a.id, 'loop');
  const worst = lanes(MEDIA, { stages: 100, cooling: COOLING[2] });
  assert.equal(worst.cheapest.a.id, 'silicon');
  /* a chain costs its length times a step */
  const l = lane(MEDIA[0], { stages: 10 }); assert.ok(Math.abs(l.eAll - 10 * l.eStep) < 1e-30);
});
test('a domino step: the energy standing it up stored, and its gap at the speed of the wave', () => {
  const d = dominoStep();
  assert.ok(d.e > 1e-3 && d.e < 1e-2, 'a few millijoules');
  assert.ok(d.t > 0.01 && d.t < 0.05, 'a few hundredths of a second');
});
