// The bench's engine (src/engines/bench.js) and your design on the bench (src/v2/game.js): what a piece must answer,
// a layout you reorder and the wire it costs, the masks every shape is printed from, and a first visit that starts
// on the lab's working example.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as X from '../src/engines/bench.js';
import * as G from '../src/v2/game.js';
import { build, solutionOf } from '../src/engines/design.js';

test('the job: every pattern has the answer the job wants, and only that answer is right', () => {
  const R = X.jobRows('half');
  assert.equal(R.length, 4);
  assert.deepEqual(R[3].want, { sum: 0, carry: 1 });
  assert.ok(X.jobRight('half', 3, { sum: 0, carry: 1 }));
  assert.ok(!X.jobRight('half', 3, { sum: 1, carry: 1 }));
  /* a clocked job: the answer at a tick follows from the ticks before */
  const C = X.jobRows('count'); assert.deepEqual(C[2].want, { q2: 0, q1: 1, q0: 0 });
  for (const { p } of G.BENCH_PIECES) { const A = X.jobAsk(p, 4); assert.ok(A.length >= 2 && A.every(k => k >= 0 && k < X.jobRows(p).length), p); assert.equal(new Set(A).size, A.length, p); }
});

test('layout: the placer\'s rows routed again give the placer\'s wire; a swap changes it; rows always hold every cell once', () => {
  const B = build({ p: 'full', code: solutionOf('full') }), rows = X.rowsOf(B.PL), m = X.measure(B.M, rows, B.PL);
  assert.equal(m.wl, B.RT.wl); assert.equal(m.vias, B.RT.vias); assert.ok(X.validRows(B.M, rows, B.PL));
  const R = X.swapCells(B.M, rows, 0, 1, B.PL.W); assert.ok(R && X.validRows(B.M, R, B.PL));
  assert.equal(X.swapCells(B.M, rows, 2, 2, B.PL.W), null);
  assert.ok(!X.validRows(B.M, [[0, 0]], B.PL));
});

test('the shortest wire: the scrambled start is far from the goal, and swaps alone can reach it', () => {
  const B = X.floorDesign(); let rows = X.floorStart(B), cur = X.floorCheck(B, rows);
  assert.ok(!cur.ok && cur.wl > X.floorGoal(B) * 1.3, 'the start is already good: ' + cur.wl);
  for (let it = 0; it < 30 && !cur.ok; it++) {
    let best = null; const n = B.M.cells.length;
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { const R = X.swapCells(B.M, rows, a, b, B.PL.W); if (!R) continue; const c = X.floorCheck(B, R); if (!c.failed && c.wl < cur.wl && (!best || c.wl < best.c.wl)) best = { R, c }; }
    if (!best) break; rows = best.R; cur = best.c;
  }
  assert.ok(cur.ok, 'swaps get no shorter than ' + cur.wl + ' (goal ' + X.floorGoal(B) + ')');
});

test('masks: every shape of a layout is on exactly one mask, and the challenge asks about every kind', () => {
  const B = build({ p: 'add2', code: solutionOf('add2') }), S = X.maskShapes(B.PL, B.RT);
  assert.equal(S.filter(s => s.mask === 'cells').length, B.M.cells.length);
  assert.equal(S.filter(s => s.mask === 'via').length, B.RT.vias);
  for (const s of S) assert.ok(X.MASKS.includes(s.mask));
  const asked = Array.from({ length: 8 }, (_, k) => X.maskAsk(S, k));
  assert.deepEqual([...new Set(asked.map(s => s.mask))].sort(), X.MASKS.slice().sort());
  for (let k = 1; k < asked.length; k++) assert.notEqual(asked[k].id, asked[k - 1].id);
  assert.ok(X.maskRight(asked[0], asked[0].mask) && !X.maskRight(asked[0], 'nope'));
});

test('a first visit starts on the lab\'s working example; changing it makes it yours; a right design of yours rides on', () => {
  const s = G.fresh(), D = G.benchDesign(s);
  assert.equal(D.p, 'half'); assert.equal(D.by, 'example'); assert.ok(D.B.ok, 'the example is right');
  for (const { p } of G.BENCH_PIECES) assert.ok(G.benchDesign({ bench: { p } }).B.ok, p + ': the lab\'s example should be right');
  assert.equal(G.yourDesign(s), null);
  s.bench = G.normalBench({ p: 'half', code: 'sum = a | b;\ncarry = a & b;' });
  assert.equal(G.benchDesign(s).by, 'you'); assert.ok(!G.benchDesign(s).B.ok);
  assert.equal(G.yourDesign(s), null, 'a wrong design does not go on to the factory');
  s.bench = G.normalBench({ p: 'half', code: 'carry = a & b;\nsum = a ^ b;' });
  assert.equal(G.yourDesign(s).p, 'half');
  /* the example's own text is the example again */
  assert.equal(G.normalBench({ p: 'half', code: solutionOf('half') }).code, null);
  assert.equal(G.normalBench({ p: 'nope' }).p, 'half');
  assert.deepEqual(G.normalState(JSON.parse(JSON.stringify(s))).bench, s.bench);
});
