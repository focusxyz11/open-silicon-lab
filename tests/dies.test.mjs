// Read the die (src/engines/dies.js, the first site's chip X-ray): every floorplan is a real layout (blocks inside the
// die, none overlapping), each kind of chip shows the signature the lab teaches, and the challenge can be won.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as D from '../src/engines/dies.js';
import { readWords } from '../scripts/words.mjs';

const EN = readWords();
const overlap = (a, b) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;

test('every block sits inside the die, no two overlap, and every type has its words', () => {
  for (const k of D.KIND_IDS) {
    const bl = D.plan(k);
    for (const b of bl) { assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1 + 1e-9 && b.y + b.h <= 1 + 1e-9, k + ' outside'); assert.ok(D.TYPES.includes(b.type), b.type); }
    for (let i = 0; i < bl.length; i++) for (let j = i + 1; j < bl.length; j++) assert.ok(!overlap(bl[i], bl[j]), k + ': overlap');
    assert.ok(('xr.kind.' + k) in EN && ('xr.why.' + k) in EN, k);
  }
  for (const ty of D.TYPES) assert.ok(('xray.type.' + ty + '.t') in EN && ('xray.type.' + ty + '.clue') in EN, ty);
});

test('where the area goes gives each kind of chip away', () => {
  const s = Object.fromEntries(D.KIND_IDS.map(k => [k, D.shares(D.plan(k))]));
  assert.ok(s.dram.dram > 0.6 && s.gpu.gpu > 0.5 && s.camera.pixels > 0.4);
  assert.ok(s.mcu.flash > s.mcu.core * 5);
  for (const k of D.KIND_IDS) assert.equal(D.askFor(k)[0], D.SIGNATURE[k], k);
});

test('a turned die keeps its blocks and its shares; hit finds the block under a point', () => {
  const bl = D.plan('mcu'), f = D.flipped(bl, { h: true, v: true });
  assert.deepEqual(D.shares(f), D.shares(bl));
  assert.equal(D.hit(bl, 0.2, 0.3).type, 'flash'); assert.equal(D.hit(f, 0.8, 0.7).type, 'flash'); assert.equal(D.hit(bl, -1, -1), null);
});

test('a deal shows every kind once; the goal needs four named and one die read to the last block', () => {
  const deal = D.deal(D.rng(3));
  assert.deepEqual(deal.map(r => r.kind).sort(), D.KIND_IDS.slice().sort());
  assert.ok(!D.met({ named: 4, cleared: [] }) && !D.met({ named: 3, cleared: ['mcu'] }) && D.met({ named: 4, cleared: ['dram'] }));
});
