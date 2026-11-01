// Chip X-ray: every floorplan is a real layout (blocks inside the die, none overlapping), and each
// kind of chip shows the signature the lab teaches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as X from '../src/engines/xray.js';

const overlap = (a, b) => a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9;

test('every block sits inside the die and no two blocks overlap', () => {
  for (const k of X.KIND_IDS) {
    const bl = X.plan(k);
    for (const b of bl) { assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1 + 1e-9 && b.y + b.h <= 1 + 1e-9, k + ': ' + b.name + ' outside'); assert.ok(X.BLOCKS[b.type], k + ': unknown type ' + b.type); }
    for (let i = 0; i < bl.length; i++) for (let j = i + 1; j < bl.length; j++) assert.ok(!overlap(bl[i], bl[j]), k + ': ' + bl[i].name + ' overlaps ' + bl[j].name);
  }
});

test('where the area goes gives each kind of chip away', () => {
  const s = Object.fromEntries(X.KIND_IDS.map(k => [k, X.shares(X.plan(k))]));
  assert.ok(s.dram.dram > 0.6, 'a memory chip is mostly memory');
  assert.ok(s.gpu.gpu > 0.5, 'an AI GPU is mostly copies of one core');
  assert.ok(s.camera.pixels > 0.4, 'a camera sensor is mostly pixels');
  assert.ok(s.mcu.flash > s.mcu.core * 5, 'a microcontroller spends far more area on memory and peripherals than on its CPU');
  assert.ok(['core', 'gpu', 'npu', 'cache', 'logic'].every(t => s.phone[t] > 0), 'a phone chip has a block for each job');
  for (const k of X.KIND_IDS) { const top = Object.entries(s[k]).filter(([t]) => t !== 'other').sort((a, b) => b[1] - a[1])[0][0]; assert.equal(top, X.SIGNATURE[k], k + ': biggest block type'); }
});

test('hit finds the block under a point', () => {
  const bl = X.plan('mcu');
  assert.equal(X.hit(bl, 0.2, 0.3).type, 'flash');
  assert.equal(X.hit(bl, 0.86, 0.14).type, 'core');
  assert.equal(X.hit(bl, -1, -1), null);
});

test('every question asks for something the chip has, and every type has a clue', () => {
  for (const k of X.KIND_IDS) for (const t of X.askFor(k)) { assert.ok(X.plan(k).some(b => b.type === t)); assert.ok(X.BLOCKS[t].clue.length > 20); }
});
