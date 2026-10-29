// "Build the CPU from your own gates": a correct ALU slice, chained 32 times, runs every RISC-V
// level exactly like the built-in ALU; a buggy slice or a planted defect breaks the CPU.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import RV from '../src/engines/riscv.js';
import { buildSlice, makeALU, pickDefect } from '../src/engines/alu.js';
import { LEVELS, CORES } from '../src/data/riscv-levels.js';

const P = TC.PROJ.find(p => p.id === 'alu');
const good = buildSlice(P.sol);

test('the reference slice matches the specification in all 64 cases', () => {
  assert.equal(good.ok, true);
  assert.equal(good.wrong.length, 0);
});

test('32 chained slices compute add, sub, and, or, xor and the comparison flags', () => {
  const alu = makeALU(good.table);
  let s = 12345;
  const r = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return s | 0; };
  const edge = [0, 1, -1, 0x7fffffff, -0x80000000, 2, -2];
  const pairs = edge.flatMap(a => edge.map(b => [a, b]));
  for (let i = 0; i < 3000; i++) pairs.push([r(), r()]);
  for (const [a, b] of pairs) {
    assert.equal(alu('add', a, b).y, (a + b) | 0);
    assert.equal(alu('sub', a, b).y, (a - b) | 0);
    assert.equal(alu('and', a, b).y, a & b);
    assert.equal(alu('or', a, b).y, a | b);
    assert.equal(alu('xor', a, b).y, a ^ b);
    const d = alu('sub', a, b);
    assert.equal(d.n ^ d.v, a < b ? 1 : 0, `signed ${a} < ${b}`);
    assert.equal(d.c ? 0 : 1, (a >>> 0) < (b >>> 0) ? 1 : 0, `unsigned ${a} < ${b}`);
  }
});

function passes(L, src, coreKey, alu) {
  const asm = RV.assemble(src, { ext: CORES[coreKey].ext, syms: L.syms });
  if (asm.errs.length) return false;
  for (const t of L.tests) {
    const d = JSON.parse(JSON.stringify(t));
    const m = RV.machine(asm.prog, mm => { if (L.init) L.init(mm, d); }, { alu });
    RV.run(m, asm.prog);
    if (m.err || L.check(m, d)) return false;
  }
  return true;
}

test('every level\'s reference solution passes on the CPU built from your slice', () => {
  const alu = makeALU(good.table);
  for (const L of LEVELS) {
    const cores = L.core.filter(k => RV.assemble(L.sol, { ext: CORES[k].ext, syms: L.syms }).errs.length === 0);
    for (const k of cores) assert.ok(passes(L, L.sol, k, alu), `level ${L.id} on ${k}`);
  }
});

test('the ALU really is used: a run counts its operations', () => {
  const L = LEVELS.find(l => l.id === 3);
  const asm = RV.assemble(L.sol, { ext: {}, syms: L.syms });
  const d = JSON.parse(JSON.stringify(L.tests[0]));
  const m = RV.machine(asm.prog, mm => L.init(mm, d), { alu: makeALU(good.table) });
  RV.run(m, asm.prog);
  assert.ok(m.aluOps > 20);
});

test('a bug in the slice breaks the CPU', () => {
  /* Forgetting the carry-in in the carry-out: single-bit adds still look fine, but carries never ripple. */
  const bug = buildSlice(P.sol.replace('cout = (a & bb) | (cin & p);', 'cout = a & bb;'));
  assert.ok(bug.wrong.length > 0);
  const L = LEVELS.find(l => l.id === 3);
  assert.equal(passes(L, L.sol, 'i', makeALU(bug.table)), false);
});

test('the starter slice is unfinished and fails verification', () => {
  assert.ok(buildSlice(P.starter).wrong.length > 0);
});

test("a planted manufacturing defect breaks addition, and so the CPU", () => {
  const def = pickDefect(good.SY, 3, 7);
  assert.ok(def);
  const alu = makeALU(good.table, def);
  let differs = false;
  for (const [a, b] of [[5, 9], [100, 27], [-1, 1], [12345, 678], [8, 8], [255, 1]]) for (const op of ['add', 'sub', 'and', 'or', 'xor']) if (alu(op, a, b).y !== makeALU(good.table)(op, a, b).y) differs = true;
  assert.ok(differs);
  const L = LEVELS.find(l => l.id === 3);
  assert.equal(passes(L, L.sol, 'i', alu), false, 'level 3 fails on the defective ALU');
});
