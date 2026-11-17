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

// The pieces' bet (known good die): every number counted from the wafer's pieces and the packages they go into;
// splitting pays only once the bad pieces are tested out, and testing alone does not pay for one big piece.
test('one bad piece sinks its package: splitting pays only with a test first', () => {
  for (let k = 0; k < B.PIECES.length; k++) for (let ti = 0; ti < B.TESTS.length; ti++) {
    const P = B.pieces(k, ti);
    assert.equal(P.state.length, P.cells.length);
    if (ti === 0) assert.ok(!P.state.includes('caught'), 'no test caught a piece');
    const used = P.packs.flatMap(q => q.ids);
    assert.equal(new Set(used).size, used.length, 'a piece is in two packages');
    for (const q of P.packs) { assert.equal(q.ids.length, B.PIECES[k]); assert.equal(q.ok, q.joins && q.ids.every(i => P.state[i] === 'good')); for (const i of q.ids) assert.notEqual(P.state[i], 'caught'); }
    assert.equal(P.working, P.packs.filter(q => q.ok).length);
    const pass = B.checkPieces({ k, test: ti }).ok;
    if (pass) { assert.ok(B.PIECES[k] > 1 && ti > 0, 'passed without both a split and a test'); }
  }
  for (let k = 0; k < B.PIECES.length; k++) assert.ok(!B.checkPieces({ k, test: 0 }).ok, 'untested pieces pass');
  for (let ti = 0; ti < B.TESTS.length; ti++) assert.ok(!B.checkPieces({ k: 0, test: ti }).ok, 'one tested piece passes');
  assert.ok(B.PIECES.some((_, k) => B.TESTS.some((_, ti) => B.checkPieces({ k, test: ti }).ok)));
  assert.ok(B.PIECE_GUESSES.includes(B.piecesAnswer()));
});

// The proof's bet: tests alone cannot reach the rarest bugs within the budget, proving everything costs too much;
// every way through proves the divider, whose bug a billion tests miss most of the time.
test('test it, or prove it: only proofs where they are cheap and tests for the rest', () => {
  const all = (1 << B.PBLOCKS.length) - 1, div = B.PBLOCKS.findIndex(x => x.id === 'div');
  for (let ti = 0; ti < B.PTESTS.length; ti++) assert.ok(!B.checkProve({ tests: ti, proved: 0 }).ok, 'tests alone pass');
  for (let ti = 0; ti < B.PTESTS.length; ti++) assert.ok(!B.checkProve({ tests: ti, proved: all }).cheap, 'proving everything is cheap');
  let n = 0;
  for (let ti = 0; ti < B.PTESTS.length; ti++) for (let m = 0; m <= all; m++) {
    const C = B.checkProve({ tests: ti, proved: m });
    for (const [i, x] of C.R.blocks.entries()) assert.equal(x.hidden, B.isProved({ proved: m }, i) ? 0 : Math.exp(-B.PTESTS[ti] * x.p));
    if (C.ok) { n++; assert.ok(B.isProved({ proved: m }, div), 'passed without proving the divider'); }
  }
  assert.ok(n >= 2);
  /* the guess: a billion tests against the divider's bug */
  assert.ok(Math.exp(-1e9 * B.PBLOCKS[div].p) > 0.5);
  assert.deepEqual(B.normalBetOf('prove', { tests: 2, proved: 999, guess: 1 }), { tests: 2, proved: 0, guess: 1 });
});

test("Jevons' bet: a better chip alone uses more energy, a price alone asks less, and the goal needs both", () => {
  /* at today's price every better chip makes the world's energy rise: the paradox */
  for (let e = 1; e < B.EFF.length; e++) assert.ok(B.jevons(e, 0).energy > B.jevons(e - 1, 0).energy, 'efficiency alone saved energy');
  assert.equal(B.jevonsAnswer(), 'more');
  /* the energy is the answers times what each draws, and the turbines count it */
  for (let e = 0; e < B.EFF.length; e++) for (let q = 0; q < B.CHARGE.length; q++) { const J = B.jevons(e, q); assert.ok(Math.abs(J.energy - J.answers * J.e) < 1e-12); assert.ok(Math.abs(J.turbines - J.energy * B.TURBINES) < 1e-9); }
  const pass = [];
  for (let e = 0; e < B.EFF.length; e++) for (let q = 0; q < B.CHARGE.length; q++) if (B.checkJevons({ eff: e, charge: q }).ok) pass.push([e, q]);
  assert.ok(pass.length >= 2);
  assert.ok(pass.every(([e, q]) => e > 0 && q > 0), 'one dial was enough');
  assert.equal(B.checkJevons(B.J_START).ok, false);
  /* no winning setting sits on the edge of the goal */
  for (const [e, q] of pass) { const J = B.jevons(e, q); assert.ok(J.answers >= B.J_GOAL.minAnswers * 1.05 && J.energy <= B.J_GOAL.maxEnergy * 0.95); }
  assert.deepEqual(B.normalBetOf('jevons', { eff: 9, charge: -1, guess: 2 }), { eff: B.J_START.eff, charge: B.J_START.charge, guess: 2 });
});
