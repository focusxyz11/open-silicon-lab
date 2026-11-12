/* The physics floor (src/engines/floor.js) and other ways to compute (src/data/ways.js). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { landauer, bitsErased, perOp, cold, reach, TEMPS } from '../src/engines/floor.js';
import { model, START } from '../src/engines/chip.js';
import { WAYS, SAVES } from '../src/data/ways.js';
import { DEPTHS } from '../src/data/weave.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));

test('the Landauer limit at room temperature is about 2.9 zeptojoules per bit, and falls with temperature', () => {
  assert.ok(Math.abs(landauer(300) - 2.87e-21) < 0.01e-21);
  assert.ok(Math.abs(landauer(4) / landauer(300) - 4 / 300) < 1e-12);
  assert.equal(bitsErased(16), 288);
});

test('your chip is millions of times above the floor, and moving data is most of it', () => {
  const E = perOp(model(START));
  assert.ok(E.mathTimes > 1e5 && E.mathTimes < 1e7, 'the arithmetic alone: ' + E.mathTimes.toExponential(2));
  assert.ok(E.times > 1e7 && E.times < 1e9);
  const near = perOp(model(Object.assign({}, START, { reuse: 5, mem: 1, gen: 4 })));
  assert.ok(near.times < E.times / 30, 'reuse, close memory and smaller switches move it toward the floor');
  assert.ok(near.times > 1e5, 'but nowhere near it');
});

test('cooling cannot beat the room-temperature floor, even with a perfect refrigerator', () => {
  for (const T of TEMPS.concat(1, 150)) {
    const ideal = cold(T, 1);
    assert.ok(Math.abs(ideal.ratio - 1) < 1e-9, 'ideal: exactly the room floor at ' + T + ' K');
    if (T < 300) { assert.ok(cold(T, 0.2).ratio > 1, 'a real refrigerator makes it worse'); assert.ok(ideal.chip < ideal.room); }
  }
});

test('light crosses less of the chip per tick as the clock rises', () => {
  const a = reach(model(START)), b = reach(model(Object.assign({}, START, { clock: 3 })));
  assert.ok(Math.abs(a.glass - 0.0759) < 0.001, 'about 7.6 cm per tick at 2 GHz');
  assert.ok(b.ticks > a.ticks * 2.9);
  assert.ok(reach(model(Object.assign({}, START, { size: 4 }))).ticks > a.ticks, 'a bigger chip takes longer to cross');
});

test('every other way to compute sits at a real depth, with its words, and one way per place', () => {
  const seen = new Set();
  for (const W of WAYS) {
    assert.ok(SAVES.includes(W.saves) && W.stage >= 0 && W.stage < EN['way.stages'].length, W.id);
    for (const k of ['t', 'how', 'catch', 'now']) assert.ok(EN['way.' + W.id + '.' + k], W.id + ' has no ' + k);
    for (const at of W.at) { assert.ok(DEPTHS[at], W.id + ': ' + at + ' is not a depth'); assert.ok(!seen.has(at), at + ' has two ways'); seen.add(at); }
  }
  for (const k of SAVES) assert.ok(EN['way.saves.' + k]);
});
