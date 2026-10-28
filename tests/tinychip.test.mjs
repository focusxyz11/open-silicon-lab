// The tiny-chip engine: every project's solution is correct, synthesizes to equivalent gates,
// places and routes without failures, and its test vectors catch nearly every stuck-at fault.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';

for (const p of TC.PROJ.filter(x => x.sol && x.f)) {
  test(`${p.t}: solution → gates → layout → test`, () => {
    const D = TC.parse(p.sol, p.ins, p.outs);
    assert.deepEqual(D.errs, [], 'solution parses');
    const V = TC.vectors(p.ins);
    for (const v of V) {
      const got = TC.evalDesign(D, v), want = p.f(v);
      for (const o of p.outs) assert.equal(got[o], want[o], `${o} for ${JSON.stringify(v)}`);
    }
    for (const lib of ['basic', 'nand']) {
      const SY = TC.synth(D, p.ins, p.outs, lib, false, '130');
      for (const v of V) {
        const out = TC.simCells(SY.M, v).out, want = p.f(v);
        for (const o of p.outs) assert.equal(out[o], want[o], `${lib} gates: ${o} for ${JSON.stringify(v)}`);
      }
      const PL = TC.place(SY.M, 0.5, 7);
      PL.anneal(Math.min(6000, 400 + SY.M.cells.length * 160), () => {});
      const R = TC.route(PL);
      assert.equal(R.failed.length, 0, `${lib}: every net routes at 50% utilization`);
      const F = TC.faults(SY.M, V);
      assert.ok(F.cov >= 0.9, `${lib}: exhaustive vectors catch ≥90% of stuck-at faults (got ${F.cov.toFixed(2)})`);
    }
  });
}

test('starter code with a planted bug is caught by verification', () => {
  for (const p of TC.PROJ.filter(x => x.lvl === 'Find the bug')) {
    const D = TC.parse(p.starter, p.ins, p.outs);
    const wrong = TC.vectors(p.ins).some(v => { const g = TC.evalDesign(D, v), w = p.f(v); return p.outs.some(o => g[o] !== w[o]); });
    assert.ok(wrong, `${p.t} starter is buggy`);
  }
});
