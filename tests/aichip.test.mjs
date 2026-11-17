// The AI chip engines (src/engines/aichip.js): the defaults give what the first version showed, results move the right way,
// and each challenge can be met by some setting and fails at the defaults.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../src/engines/aichip.js';
import { readFileSync } from 'node:fs';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test('chip facts name real entries in facts.json', () => {
  const ids = new Set(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url))).facts.map(f => f.id));
  for (const c of A.CHIPS) for (const f of c.facts) assert.ok(ids.has(f), f);
  for (const f of A.GPU_FACTS) assert.ok(ids.has(f), f);
});

test('roofline defaults: 70B in FP4 on Rubin, one user', () => {
  const r = A.roofline(...Object.values(A.ROOFLINE_DEFAULTS));
  assert.equal(r.chips, 1);
  near(r.tokPerUser, 624, 1);
  near(r.utilization * 100, 0.18, 0.005);
  assert.equal(r.memoryBound, true);
  near(r.ridge, 2272.7, 0.1);
  assert.equal(A.roofline('rubin', 70.5, 'fp4', 1).tokTotal, r.tokPerUser);
});

test('roofline: more users give more total tokens until compute-bound, then each user slows', () => {
  let prev = 0, flipped = false;
  for (let b = 1; b <= 1024; b *= 2) {
    const r = A.roofline('rubin', 70, 'fp8', b);
    assert.ok(r.tokTotal >= prev - 1e-9); prev = r.tokTotal;
    if (!r.memoryBound) { flipped = true; assert.ok(r.utilization > 0.999); }
  }
  assert.ok(flipped);
  assert.ok(A.roofline('rubin', 70, 'fp8', 1024).tokPerUser < A.roofline('rubin', 70, 'fp8', 256).tokPerUser);
  assert.equal(A.roofline('rubin', 70, 'fp8', 256).tokPerUser, A.roofline('rubin', 70, 'fp8', 1).tokPerUser);
});

test('roofline: a bigger model needs more chips, smaller numbers are faster, a faster chip is faster', () => {
  assert.equal(A.roofline('b200', 70, 'fp16', 1).chips, 1);
  assert.equal(A.roofline('b200', 1000, 'fp16', 1).chips, Math.ceil(2000e9 / (192e9 * 0.8)));
  assert.ok(A.roofline('rubin', 70, 'fp8', 1).tokPerUser > A.roofline('rubin', 70, 'fp16', 1).tokPerUser);
  assert.ok(A.roofline('rubin', 70, 'fp4', 1).tokPerUser > A.roofline('rubin', 70, 'fp8', 1).tokPerUser);
  assert.ok(A.roofline('rubin', 70, 'fp4', 1).tokPerUser > A.roofline('b200', 70, 'fp4', 1).tokPerUser);
  assert.throws(() => A.roofline('nope', 1, 'fp4', 1));
  near(A.paramsOfSlider(560), 70.5, 0.1);
  assert.equal(A.batchOfSlider(0), 1);
  assert.equal(A.batchOfSlider(1000), 1024);
});

test('challenge Feed the beast fails at the defaults and can be met', () => {
  assert.equal(A.feedTheBeast(A.ROOFLINE_DEFAULTS), false);
  const met = { chipId: 'rubin', paramsB: 70, format: 'fp8', batch: 600 };
  assert.equal(A.feedTheBeast(met), true);
  assert.equal(A.feedTheBeast({ ...met, batch: 100 }), false);
  assert.equal(A.feedTheBeast({ ...met, batch: 1024 }), false);
  assert.equal(A.feedTheBeast({ ...met, format: 'fp16' }), false);
  assert.equal(A.feedTheBeast({ ...met, chipId: 'b200' }), false);
});

test('challenge An assistant in your pocket fails at the defaults and can be met', () => {
  assert.equal(A.pocketAssistant(A.ROOFLINE_DEFAULTS), false);
  assert.equal(A.pocketAssistant({ chipId: 'phone', paramsB: 8, format: 'fp4', batch: 1 }), true);
  assert.equal(A.pocketAssistant({ chipId: 'phone', paramsB: 8, format: 'fp8', batch: 1 }), false);   // 8 GB at 80 GB/s
  assert.equal(A.pocketAssistant({ chipId: 'phone', paramsB: 4, format: 'fp8', batch: 1 }), false);   // under 7B
  assert.equal(A.pocketAssistant({ chipId: 'phone', paramsB: 30, format: 'fp4', batch: 1 }), false);  // too slow
  assert.equal(A.pocketAssistant({ chipId: 'phone', paramsB: 20, format: 'fp4', batch: 1 }), false);
});

test('HBM defaults: Rubin-like, 288 GB and 21.9 TB/s', () => {
  const r = A.hbmStack(A.HBM_DEFAULTS);
  assert.equal(r.gb, 288);
  near(r.tbs, 21.9, 0.05);
  near(r.dieUm, 36.4, 0.05);
  assert.equal(r.wires, 16384);
  assert.equal(r.likeRubin, true);
  assert.equal(r.fits && !r.thin, true);
});

test('HBM moves the right way; the height limit bites; hybrid bonding gives room', () => {
  const d = A.HBM_DEFAULTS;
  assert.ok(A.hbmStack({ ...d, stacks: 10 }).tbs > A.hbmStack(d).tbs);
  assert.ok(A.hbmStack({ ...d, stacks: 10 }).gb > A.hbmStack(d).gb);
  assert.ok(A.hbmStack({ ...d, pin: 12 }).tbs > A.hbmStack(d).tbs);
  assert.ok(A.hbmStack({ ...d, dies: 16 }).dieUm < A.hbmStack(d).dieUm);
  assert.ok(A.hbmStack({ ...d, bonding: 'hybrid' }).dieUm > A.hbmStack(d).dieUm);
  const tall = { gen: 'hbm4e', dies: 20, bonding: 'bump', pin: 12, stacks: 8 };
  assert.equal(A.hbmStack(tall).thin, true);                    // 16 um: ground very thin
  assert.equal(A.hbmStack({ ...tall, bonding: 'hybrid' }).thin, false);
  assert.equal(A.hbmStack({ ...tall, dies: 40 }).fits, false);  // not offered by any generation, but the limit still bites
  assert.equal(A.hbmStack({ ...d, pin: 13 }).pinAboveAnnounced, true);
  const e = A.withGeneration(d, 'hbm4e');
  assert.equal(e.pin, 12); assert.equal(e.dies, 16);
  assert.equal(A.withGeneration(d, 'hbm3e').dies, 12);
  assert.ok(A.hbmStack(A.withGeneration(d, 'hbm3e')).tbs < A.hbmStack(d).tbs);
});

test('GPU cost defaults: about $6,390, memory 54%, 36 of 64 good dies, 82% margin', () => {
  const r = A.gpuCost(A.GPU_COST_DEFAULTS);
  near(r.cost, 6391, 2);
  assert.equal(Math.round(r.memShare * 100), 54);
  assert.equal(Math.floor(r.goodDies), 36);
  assert.equal(r.grossDies, 64);
  assert.equal(Math.round(r.margin * 100), 82);
  assert.equal(r.biggest, 'hbm');
  near(r.parts.dies + r.parts.hbm + r.parts.packaging + r.yieldLoss + r.board, r.cost, 1e-9);
});

test('GPU cost moves the right way', () => {
  const d = A.GPU_COST_DEFAULTS, g = o => A.gpuCost({ ...d, ...o });
  assert.ok(g({ d0: 0.15 }).goodDies < g({}).goodDies);
  assert.ok(g({ d0: 0.15 }).cost > g({}).cost);
  assert.ok(g({ area: 400 }).grossDies > g({}).grossDies);
  assert.ok(g({ wafer: 28000 }).cost > g({}).cost);
  assert.ok(g({ hbmGB: 288 }).cost > g({}).cost);
  assert.ok(g({ packYield: 0.95 }).cost < g({}).cost);
  assert.ok(g({ price: 20000 }).margin < g({}).margin);
  assert.ok(g({ price: 5000 }).profit < 0);
  assert.equal(g({ hbmGB: 96, hbmPerGB: 6, d0: 0.2, area: 858 }).biggest, 'dies');
  assert.ok(Number.isFinite(g({ area: 858, d0: 0.2 }).cost));
});
