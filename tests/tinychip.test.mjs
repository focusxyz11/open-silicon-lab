// The tiny-chip engine: every project's solution is correct, synthesizes to equivalent gates,
// places and routes without failures, and its test vectors catch nearly every stuck-at fault.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';

/* Run a gate netlist through a project's test patterns in order; flip-flops start at 0. */
const runGates = (M, V) => { let s = {}; return V.map(v => { const r = TC.simCells(M, v, null, s); s = r.next; return r.out; }); };

for (const p of TC.PROJ.filter(x => x.sol && x.f)) {
  test(`${p.t}: solution → gates → layout → test`, () => {
    const D = TC.parse(p.sol, p.ins, p.outs, { regs: !!p.seq });
    assert.deepEqual(D.errs, [], 'solution parses');
    const ver = TC.verify(D, p);
    assert.equal(ver.bad, 0, 'the solution meets the specification');
    const V = TC.testVectors(p), want = ver.rows.map(r => r.e);
    for (const lib of ['basic', 'nand']) {
      const SY = TC.synth(D, p.ins, p.outs, lib, false, '130');
      runGates(SY.M, V).forEach((out, k) => { for (const o of p.outs) assert.equal(out[o], want[k][o], `${lib} gates: ${o} at pattern ${k}`); });
      const PL = TC.place(SY.M, 0.5, 7);
      PL.anneal(Math.min(6000, 400 + SY.M.cells.length * 160), () => {});
      const R = TC.route(PL);
      assert.equal(R.failed.length, 0, `${lib}: every net routes at 50% utilization`);
      const F = TC.faults(SY.M, V);
      assert.ok(F.cov >= 0.9, `${lib}: the test patterns catch ≥90% of stuck-at faults (got ${F.cov.toFixed(2)})`);
    }
  });
}

test('a counter: reg makes flip-flops, the counter counts and wraps, and synthesis adds one DFF per reg', () => {
  const p = TC.PROJ.find(x => x.id === 'count');
  const D = TC.parse(p.sol, p.ins, p.outs, { regs: true });
  assert.deepEqual(D.regs, ['q0', 'q1', 'q2']);
  let s = {}; const seen = [];
  for (let k = 0; k < 10; k++) { const r = TC.stepDesign(D, { en: 1 }, s); seen.push(r.out.q2 * 4 + r.out.q1 * 2 + r.out.q0); s = r.next; }
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6, 7, 0, 1]);
  const SY = TC.synth(D, p.ins, p.outs, 'basic', false, '130');
  assert.equal(SY.M.cells.filter(c => c.type === 'DFF').length, 3);
  assert.equal(SY.M.inputs.length, 1, 'flip-flop outputs are not chip inputs');
  assert.ok(SY.st.tr >= 3 * TC.LIB.DFF[0], 'flip-flops count in the transistor total');
  /* holding en at 0 keeps the count */
  s = { q0: 1, q1: 0, q2: 1 }; const r = TC.simCells(SY.M, { en: 0 }, null, s);
  assert.deepEqual(r.next, s);
});

test('reg is refused in projects without a clock, and a loop through a reg is not a loop', () => {
  const half = TC.PROJ.find(x => x.id === 'half');
  assert.match(TC.parse('reg sum = a;\ncarry = b;', half.ins, half.outs).errs[0].m, /no clock/);
  assert.match(TC.parse('x = y;\ny = x;\nq = x;', ['en'], ['q']).errs.map(e => e.m).join(' '), /loop/);
  assert.deepEqual(TC.parse('reg q = q ^ en;', ['en'], ['q'], { regs: true }).errs, []);
});

test('a slower path between flip-flops lowers the top clock speed', () => {
  const p = TC.PROJ.find(x => x.id === 'count');
  const fast = TC.synth(TC.parse('reg q0 = q0 ^ en;\nreg q1 = q1;\nreg q2 = q2;', p.ins, p.outs, { regs: true }), p.ins, p.outs, 'basic', false, '130').st;
  const slow = TC.synth(TC.parse(p.sol, p.ins, p.outs, { regs: true }), p.ins, p.outs, 'basic', false, '130').st;
  assert.ok(slow.fmax < fast.fmax);
});

test('starter code with a planted bug is caught by verification', () => {
  for (const p of TC.PROJ.filter(x => x.lvl === 'Find the bug' || x.seq)) {
    const D = TC.parse(p.starter, p.ins, p.outs, { regs: !!p.seq });
    const wrong = TC.verify(D, p).bad > 0;
    assert.ok(wrong, `${p.t} starter is buggy`);
  }
});
