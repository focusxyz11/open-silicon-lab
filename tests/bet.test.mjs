// Moore's bet as an engine (src/engines/bet.js): the numbers are counted on the wafer, each part is cheapest at a
// middle size, that size grows as the line gets cleaner, and the goal needs both dials.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../src/engines/bet.js';

test('every number is counted on the wafer: chips that fit, specks that kill, what a part costs', () => {
  for (let c = 0; c < B.CLEAN.length; c++) for (let s = 0; s < B.SIZES.length; s++) {
    const M = B.moore(s, c);
    assert.equal(M.alive.length, M.chips);
    assert.equal(M.good, M.alive.filter(Boolean).length);
    for (const [i, j] of M.cells) for (const [x, y] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]) assert.ok(Math.hypot(x * M.s, y * M.s) <= B.WAFER.r - B.WAFER.edge + 1e-9, 'a chip off the wafer');
    if (M.good) assert.ok(Math.abs(M.cost - M.wafer / M.good / M.n) < 1e-12);
  }
  /* a cleaner line keeps some of the same specks, and loses the rest */
  for (let c = 1; c < B.CLEAN.length; c++) assert.deepEqual(B.specksOf(B.CLEAN[c]), B.specksOf(B.CLEAN[c - 1]).slice(0, B.specksOf(B.CLEAN[c]).length));
});

test('each part is cheapest at a middle size, and that size grows as the line gets cleaner', () => {
  const at = B.CLEAN.map((_, c) => B.cheapest(c));
  for (const i of at) assert.ok(i > 0 && i < B.SIZES.length - 1, 'cheapest at an end');
  for (let c = 1; c < at.length; c++) assert.ok(at[c] >= at[c - 1], 'a cleaner line made the cheapest chip smaller');
  assert.ok(at[at.length - 1] > at[0]);
  assert.ok(Math.abs(Math.min(...B.CLEAN.flatMap((_, c) => B.curve(c))) - 1) < 1e-12);
});

test('the goal needs both dials: no size alone, no line alone', () => {
  const pass = [];
  for (let c = 0; c < B.CLEAN.length; c++) for (let s = 0; s < B.SIZES.length; s++) if (B.check({ size: s, clean: c }).ok) pass.push([s, c]);
  assert.ok(pass.length >= 1);
  for (const [s, c] of pass) { assert.notEqual(s, B.START.size); assert.notEqual(c, B.START.clean); }
  /* the extremes fail: the biggest chip, the cleanest line */
  assert.ok(!B.check({ size: B.SIZES.length - 1, clean: B.START.clean }).ok);
  assert.ok(!B.check({ size: B.START.size, clean: B.CLEAN.length - 1 }).ok);
  assert.ok(!B.check({ size: B.SIZES.length - 1, clean: B.CLEAN.length - 1 }).ok);
  assert.deepEqual(B.normalBet({ size: 99, clean: -1, guess: 'x' }), { size: B.START.size, clean: B.START.clean, guess: null });
});

// Cray's bet: Hill and Marty's asymmetric chip (IEEE Computer, 2008). Neither the ox alone nor the chickens alone
// serve both jobs; every chip that does has both, within the budget.
test('oxen or chickens: only a chip with both serves the everyday app and the AI, within its budget', () => {
  const hm = (f, n, r) => 1 / ((1 - f) / Math.sqrt(r) + f / (Math.sqrt(r) + n - r));
  for (let o = 0; o < B.OX.length; o++) for (let h = 0; h < B.HENS.length; h++) {
    const M = B.oxen(o, h);
    assert.ok(Math.abs(M.ai - hm(B.JOBS.ai, M.size, M.r)) < 1e-9 && Math.abs(M.app - hm(B.JOBS.app, M.size, M.r)) < 1e-9, 'not the model');
    const F = B.floorplan(M.r, M.m);
    assert.equal(F.hens.length + (F.ox ? F.ox.w * F.ox.h : 0), M.size, 'the plan does not hold every unit');
    assert.equal(new Set(F.hens.map(p => p.join(','))).size, F.hens.length);
    if (B.checkOxen({ ox: o, hens: h }).ok) { assert.ok(M.r > 1 && M.m > 0, 'passed without both'); assert.ok(M.size <= B.BUDGET); }
  }
  assert.ok(!B.checkOxen(B.OX_START).ok);
  assert.ok(!B.checkOxen({ ox: 0, hens: B.HENS.length - 2 }).ok, 'the chickens alone serve the everyday app');
  assert.ok(!B.checkOxen({ ox: B.OX.length - 1, hens: B.HENS.length - 1 }).ok, 'spending past the budget passes');
  assert.ok(B.OX.some((_, o) => B.HENS.some((_, h) => B.checkOxen({ ox: o, hens: h }).ok)));
  assert.deepEqual(B.normalBetOf('oxen', { ox: 3, hens: 99, guess: 2 }), { ox: 3, hens: B.OX_START.hens, guess: 2 });
});
