// The RISC-V engine: encodings match the RISC-V spec, and every level's reference solution passes its hidden tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import RV from '../src/engines/riscv.js';
import { LEVELS, CORES } from '../src/data/riscv-levels.js';

const word = (src, ext = {}) => { const a = RV.assemble(src, { ext }); assert.deepEqual(a.errs, []); return a.prog[0].word >>> 0; };

test('encodes instructions exactly as the RISC-V spec does', () => {
  assert.equal(word('addi a0, x0, 42'), 0x02a00513);
  assert.equal(word('add t3, t1, t2'), 0x00730e33);
  assert.equal(word('lw t1, 0(t0)'), 0x0002a303);
  assert.equal(word('sw t3, 8(t0)'), 0x01c2a423);
  assert.equal(word('lui a0, 0x12345'), 0x12345537);
  assert.equal(word('mul a0, a1, a2', { M: 1 }), 0x02c58533);
});

test('rejects instructions the chosen core does not have', () => {
  assert.ok(RV.assemble('mul a0, a1, a2', { ext: {} }).errs.length > 0);
  assert.ok(RV.assemble('dot4 a0, a1, a2', { ext: { M: 1 } }).errs.length > 0);
});

function runLevel(L, src, coreKey) {
  const C = CORES[coreKey];
  const asm = RV.assemble(src, { ext: C.ext, syms: L.syms });
  assert.deepEqual(asm.errs, [], `level ${L.id} on ${coreKey} assembles`);
  for (const t of L.tests) {
    const d = JSON.parse(JSON.stringify(t));
    const m = RV.machine(asm.prog, mm => { if (L.init) L.init(mm, d); });
    RV.run(m, asm.prog);
    assert.equal(m.err, null, `level ${L.id} runs without a fault`);
    assert.equal(L.check(m, d) || null, null, `level ${L.id} passes its tests on ${coreKey}`);
  }
}

for (const L of LEVELS) {
  test(`level ${L.id} (${L.t}): reference solution passes`, () => {
    /* Levels 6 and 7 let you pick a core; the solution uses the custom unit, so run it on the cores that have it. */
    const ok = L.core.filter(k => RV.assemble(L.sol, { ext: CORES[k].ext, syms: L.syms }).errs.length === 0);
    assert.ok(ok.length > 0, 'solution assembles on at least one allowed core');
    ok.forEach(k => runLevel(L, L.sol, k));
  });
}

test('level 7 baseline program is correct on RV32IM', () => {
  const L = LEVELS.find(l => l.id === 7);
  runLevel(L, L.base, 'im');
});
