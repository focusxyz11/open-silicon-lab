/* Your block placed, timed on its layout and tested (#508, src/engines/placer.js). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../src/engines/placer.js';
import { build, solutionOf } from '../src/engines/design.js';
import { recordOf } from '../src/engines/chiprecord.js';
import { stackOf } from '../src/engines/path.js';
import { FIDS, ENGINES } from '../src/data/fidelity.js';

const B = (p = 'alu') => build({ p, code: solutionOf(p) });
const inRows = (b, place) => { const { cols, rows } = P.gridOf(b); return b.M.cells.every((c, i) => place[i] && place[i].r >= 0 && place[i].r < rows && place[i].x >= 0 && place[i].x + place[i].w <= cols + 1e-6); };
const noOverlap = (b, place) => b.M.cells.every((c, i) => b.M.cells.every((d, j) => i === j || place[i].r !== place[j].r || place[i].x + place[i].w <= place[j].x + 1e-6 || place[j].x + place[j].w <= place[i].x + 1e-6));

test('by hand, scrambled, settled: every cell in its row, none on another; settling beats your hand', () => {
  for (const p of ['alu', 'seg', 'count']) {
    const b = B(p), hand = P.handOf(b), scr = P.scrambleOf(b, 3), frames = P.settleFrames(b, scr), set = frames[frames.length - 1];
    for (const pl of [hand, scr, set]) { assert.ok(inRows(b, pl), p + ': a cell outside the block'); assert.ok(noOverlap(b, pl), p + ': two cells on one site'); }
    assert.ok(P.wireOf(b, scr) > P.wireOf(b, hand) * 0.9, p + ': scrambling does not shorten the wire');
    assert.ok(P.wireOf(b, set) < P.wireOf(b, hand), p + ': the settled wire ' + P.wireOf(b, set) + ' is not shorter than by hand ' + P.wireOf(b, hand));
    assert.ok(frames.length > 10, 'frames to watch');
    assert.deepEqual(P.settleFrames(b, scr), frames, 'the same start settles the same way');
  }
  /* a swap by hand moves two cells and keeps the rows whole */
  const b = B(), h = P.handOf(b), s = P.swapOf(b, h, 0, 5);
  assert.ok(inRows(b, s) && noOverlap(b, s)); assert.notDeepEqual(s, h);
  assert.deepEqual(P.normalPlace(b, s), s); assert.equal(P.normalPlace(b, { 0: { x: -3, r: 0 } }), null);
});

test('timing on the layout: a long wire makes the path late, the clock is set from your hand', () => {
  const b = B(), hand = P.handOf(b), scr = P.scrambleOf(b, 3), clocks = P.clocksOf(b);
  assert.deepEqual(P.CLOCKS, [1.6, 1.12, 0.95, 0.8]);
  const th = P.timeLayout(b, hand, clocks[P.CLOCK_EXAMPLE]), ts = P.timeLayout(b, scr, clocks[P.CLOCK_EXAMPLE]);
  assert.ok(th.meets, 'the lab\'s example makes its clock'); assert.ok(th.slack > 0);
  assert.ok(ts.arrival > th.arrival, 'scrambled, the path is longer'); assert.ok(ts.wire > th.wire);
  assert.ok(!ts.meets, 'scrambled, the slice is late'); assert.ok(ts.slack < 0);
  assert.ok(Math.abs(clocks[0] / P.timeLayout(b, hand).arrival - 1.6) < 0.01, 'the clocks are multiples of the hand placement\'s own delay');
  assert.ok(!P.timeLayout(b, hand, clocks[3]).meets, 'x0.8 is too fast for any placement by hand');
  /* the path runs from an input to an output through cells that feed each other */
  const byOut = new Map(b.M.cells.map((c, i) => [c.out, i]));
  th.path.slice(1).forEach((i, k) => assert.ok(b.M.cells[i].ins.some(n => byOut.get(n) === th.path[k]), 'the path is a chain'));
  for (const k of ['arrival', 'slack']) { assert.ok(FIDS.includes(th.fid[k].f)); assert.ok(ENGINES[th.fid[k].by]); }
});

test('coverage: the bug the fewest states reveal hides from a few random tests and shows to every state', () => {
  const b = B(), C = P.coverageOf(b);
  assert.equal(C.states, 64); assert.equal(C.cols * C.rows, 64);
  assert.ok(C.bug && C.wrong.length >= 1 && C.wrong.length <= 4, 'a bug in a corner: ' + C.wrong.length + ' states');
  assert.equal(P.randomCount(C), 3, 'twenty of 512, in proportion');
  const all = P.testsOf(C, null); assert.equal(all.length, 64);
  assert.ok(C.wrong.every(s => all.includes(s)), 'testing every state finds it');
  const misses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(sd => !P.testsOf(C, P.randomCount(C), sd).some(s => C.wrong.includes(s))).length;
  assert.ok(misses >= 6, 'a few random tests usually look clean (' + misses + ' of 10 runs)');
});

test('the record keeps your placement and clock, and a late block fails every die at Test', async () => {
  const d = { p: 'alu', code: solutionOf('alu') }, b = B();
  const ex = recordOf(stackOf(), d);
  assert.deepEqual(ex.designed.place, P.handOf(b), 'the lab\'s example: the slice by hand');
  assert.equal(ex.designed.clock, P.CLOCK_EXAMPLE); assert.equal(ex.designed.late, false);
  assert.ok(ex.made.find(m => m.step === 'test').chip.test.good.some(Boolean));
  const scr = P.scrambleOf(b, 3), late = recordOf(stackOf(), Object.assign({}, d, { place: scr }));
  assert.equal(late.designed.late, true); assert.ok(late.designed.wire.now > late.designed.wire.hand);
  const T = late.made.find(m => m.step === 'test');
  assert.ok(T.chip.test.slow && T.chip.test.good.every(g => !g), 'every die fails for speed');
  assert.deepEqual(T.report.wrong, [{ what: 'speed', n: T.chip.test.good.length }]);
  /* a slower clock makes the same placement on time */
  assert.equal(recordOf(stackOf(), Object.assign({}, d, { place: scr, clock: 0 })).designed.late, false);
  /* kept as data, made again the same */
  const { keepOf, fromKept } = await import('../src/engines/chiprecord.js').then(m => m);
  assert.deepEqual(fromKept(JSON.parse(JSON.stringify(keepOf(late)))), late);
});
