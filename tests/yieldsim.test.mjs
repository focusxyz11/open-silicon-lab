// The shared yield model: the rain, the grid and the formulas must tell the same story at every depth.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rain, grid, piece, hit, poissonY, murphyY, negBinY, spareY, costPerChip, DMAX } from '../src/engines/yieldsim.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
function simulated(w, h, D, clumped, alpha, runs = 300) {
  const g = grid(w, h); let good = 0, all = 0;
  for (let s = 1; s <= runs; s++) { const r = hit(g, rain(s, clumped, alpha), D); good += r.good; all += r.gross; }
  return good / all;
}

test('even rain matches the Poisson formula for big and small dies', () => {
  near(simulated(26, 32, 0.1, false, 1), poissonY(0.832), 0.012, 'big die');
  const p = piece(26, 32, 8);
  near(simulated(p.w, p.h, 0.1, false, 1, 120), poissonY(p.area / 100 * 0.1), 0.006, 'chiplet');
});

test('clumps match the negative binomial for small dies and land a little under it for big ones', () => {
  const p = piece(26, 32, 8);
  near(simulated(p.w, p.h, 0.1, true, 1, 120), negBinY(p.area / 100 * 0.1, 1), 0.01, 'chiplet');
  const big = simulated(26, 32, 0.1, true, 1), f = negBinY(0.832, 1);
  assert.ok(big < f && big > f - 0.05, `big die in clumps: ${big} vs ${f}`);
  assert.ok(big > poissonY(0.832), 'clumps must spare more big dies than even rain');
});

test('cutting changes the grid and never the rain, and density only adds drops', () => {
  const r = rain(8, false, 1), one = hit(grid(26, 32), r, 0.1), p = piece(26, 32, 8), eight = hit(grid(p.w, p.h), r, 0.1);
  assert.deepEqual(one.keep, eight.keep);
  const more = hit(grid(26, 32), r, 0.3).keep;
  assert.ok(one.keep.every(d => more.includes(d)) && more.length > one.keep.length);
  assert.ok(more.length < r.length * (0.3 / DMAX) * 1.2);
});

test('half price holds in even rain, fails in tight clumps and returns around α = 5', () => {
  const ratio = o => costPerChip(26, 32, 8, 0.1, 30000, o).cost / costPerChip(26, 32, 1, 0.1, 30000, o).cost;
  assert.ok(ratio({}) < 0.5);
  near(ratio({ clumped: true, alpha: 1 }), 0.585, 0.01, 'α = 1');
  assert.ok(ratio({ clumped: true, alpha: 4 }) > 0.5);
  assert.ok(ratio({ clumped: true, alpha: 5 }) < 0.5);
});

test('the existing numbers stay: one AI GPU die costs $1,077 and 8 chiplets reach $506', () => {
  const big = costPerChip(26, 32, 1, 0.1, 30000), eight = costPerChip(26, 32, 8, 0.1, 30000);
  assert.equal(big.gross, 64); assert.equal(Math.round(big.cost), 1077); assert.equal(Math.round(eight.cost), 506);
  assert.equal(murphyY(0), 1);
});

test('the See it challenge can be solved on the default wafer, and is not solved at the start', () => {
  const r = rain(8, false, 1), one = hit(grid(26, 32), r, 0.1).good, p = piece(26, 32, 8), eight = Math.floor(hit(grid(p.w, p.h), r, 0.1).good / 8);
  assert.ok(eight >= 2 * one, `${eight} chips from 8 pieces, ${one} from one`);
});

test('spare cores absorb defects, and with none the formula is plain yield', () => {
  assert.equal(spareY(0.8, 0, false, 1), poissonY(0.8));
  near(spareY(0.8, 0, true, 2), negBinY(0.8, 2), 1e-12, 'clumps');
  assert.ok(spareY(0.8, 3, false, 1) > spareY(0.8, 1, false, 1));
  const g = grid(26, 32), r = rain(3, false, 1);
  assert.ok(hit(g, r, 0.1, 2).good > hit(g, r, 0.1, 0).good);
});
