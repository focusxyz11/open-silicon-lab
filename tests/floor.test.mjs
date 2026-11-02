import test from 'node:test';
import assert from 'node:assert/strict';
import { landauer, ladder, cold, reach, ticksToCross, SPANS, bitsErased, TASKS } from '../src/engines/floor.js';

test('the Landauer limit at room temperature is about 2.9 zeptojoules per bit', () => {
  assert.ok(Math.abs(landauer(300) - 2.87e-21) < 0.01e-21);
  assert.ok(Math.abs(landauer(4) / landauer(300) - 4 / 300) < 1e-12, 'it falls in proportion to temperature');
});

test('one multiply-add is millions of times above the floor, and moving data is most of it', () => {
  const r = ladder('mac');
  assert.ok(r.times > 1e6 && r.times < 1e9, 'times above the floor: ' + r.times.toExponential(2));
  assert.ok(r.moveShare > 0.9, 'fetching operands from SRAM costs far more than the math');
  assert.ok(r.math > r.floor * 1e5, 'even the arithmetic alone is far above the floor');
  assert.equal(bitsErased(16), 288);
});

test('keeping data close, reusing it and using fewer bits each move a task toward the floor', () => {
  const base = ladder('token');
  assert.ok(base.moveShare > 0.95, 'one token at batch 1: reading every weight from DRAM dominates');
  assert.ok(ladder('token', { reuse: 64 }).total < base.total / 10, 'reusing each weight across a batch of 64');
  assert.ok(ladder('token', { weight: 'sram' }).total < base.total / 10, 'weights in on-chip memory');
  assert.ok(ladder('mac', { bits: 4 }).total < ladder('mac').total / 3, '4-bit numbers');
  /* but the floor shrinks with fewer bits too, so 4-bit is not automatically closer in ratio */
  assert.ok(ladder('mac', { bits: 4 }).floor < ladder('mac').floor);
});

test('a token costs more than a photo, because the photo reuses its weights', () => {
  assert.ok(ladder('token').total > ladder('photo').total);
  assert.ok(TASKS.token.macs > TASKS.photo.macs);
});

test('cooling cannot beat the room-temperature floor, even with a perfect refrigerator', () => {
  for (const T of [1, 4, 77, 150, 250, 299]) {
    const ideal = cold(T, 1);
    assert.ok(Math.abs(ideal.ratio - 1) < 1e-9, 'ideal: exactly the room floor at ' + T + ' K');
    assert.ok(cold(T, 0.2).ratio > 1, 'a real refrigerator makes it worse at ' + T + ' K');
    assert.ok(ideal.chip < ideal.room, 'the chip itself is below the room floor');
  }
});

test('light crosses about 3 cm of glass in one tick at 5 GHz; a large chip takes a tick or more', () => {
  const r = reach(5);
  assert.ok(Math.abs(r.vacuum - 0.05996) < 1e-4);
  assert.ok(r.glass > 0.029 && r.glass < 0.031);
  assert.ok(ticksToCross(SPANS.reticle, 5) > 1, 'even light cannot cross the largest chip in one 5 GHz tick');
  assert.ok(ticksToCross(SPANS.phone, 1) < 1);
});
