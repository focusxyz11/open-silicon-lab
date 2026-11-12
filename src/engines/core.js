/* The RISC-V core: the next engine of the build. Pure logic, no DOM; tests in tests/design.test.mjs.

   The core is the earlier site's RISC-V simulator (src/engines/riscv.js, RV32I) with one change that
   makes it part of the build: every add, subtract, AND, OR, XOR, comparison and branch goes through an
   arithmetic unit made of a design from the plan, the ALU slice, copied 32 times and chained carry to
   carry (src/engines/alu.js). A wrong slice makes real programs give wrong answers; a slice the factory
   spoiled (one wire stuck, pickDefect) does too, though its design was perfect.

   The core is checked by test programs (TESTS): each runs on several inputs and must leave the right
   answer. The rest of the core (registers, decoder, program counter, memory) is the simulator's own model
   for now: those pieces stay open in the plan until engines can check designs for them.

   What is simplified: one instruction per cycle (no pipeline), no caches, a small memory. */
import RV from './riscv.js';
import { buildSlice, makeALU, pickDefect } from './alu.js';

const N = 0x1000;
/* test programs: what the core must do. Words: core.test.<id>.t */
export const TESTS = [
  { id: 'hold', src: 'li a0, 42', cases: [{}], want: () => 42 },
  { id: 'add', src: 'li t0, 4096\nlw t1, 0(t0)\nlw t2, 4(t0)\nadd a0, t1, t2', cases: [{ a: 1234, b: 5678 }, { a: -50, b: 20 }, { a: 100000, b: 23456 }], init: (m, d) => { RV.st(m, N, 4, d.a); RV.st(m, N + 4, 4, d.b); }, want: d => d.a + d.b },
  { id: 'sub', src: 'li t0, 4096\nlw t1, 0(t0)\nlw t2, 4(t0)\nsub a0, t1, t2', cases: [{ a: 9, b: 4 }, { a: 4, b: 9 }, { a: -7, b: -7 }], init: (m, d) => { RV.st(m, N, 4, d.a); RV.st(m, N + 4, 4, d.b); }, want: d => d.a - d.b },
  { id: 'logic', src: 'li t1, 0b1100\nli t2, 0b1010\nand t3, t1, t2\nor t4, t1, t2\nxor t5, t1, t2\nadd a0, t3, t4\nadd a0, a0, t5', cases: [{}], want: () => 8 + 14 + 6 },
  { id: 'sum', src: 'li t0, 4096\nlw t1, 0(t0)\nli a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, t1, loop', cases: [{ n: 10 }, { n: 25 }, { n: 100 }], init: (m, d) => RV.st(m, N, 4, d.n), want: d => (d.n * (d.n + 1)) / 2 },
  { id: 'mul', src: 'li t0, 4096\nlw a1, 0(t0)\nlw a2, 4(t0)\nli a0, 0\nloop:\n  andi t1, a2, 1\n  beq t1, x0, skip\n  add a0, a0, a1\nskip:\n  slli a1, a1, 1\n  srli a2, a2, 1\n  bne a2, x0, loop', cases: [{ a: 12, b: 13 }, { a: 999, b: 1000 }, { a: 7, b: 0 }], init: (m, d) => { RV.st(m, N, 4, d.a); RV.st(m, N + 4, 4, d.b); }, want: d => d.a * d.b }
];
/* the program you run on your core, to watch it work: it adds 1 to 10 */
export const START_PROGRAM = 'li t1, 10\nli a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, t1, loop';

const cache = new Map();
/* the core made with a slice (its description), checked by the test programs, and running your program.
   defect: a number to pick one wire the factory left stuck in one slice, or null for a perfect copy */
export function buildCore(slice, program, defect) {
  const key = slice + '\n#\n' + program + '\n#' + defect;
  if (cache.has(key)) return cache.get(key);
  const S = buildSlice(slice), out = { slice: S, sliceOk: S.ok && !S.wrong.length, errs: [], tests: [], passed: 0, total: 0 };
  if (!S.ok) { out.sliceErrs = S.errs; return remember(key, out); }
  const bit = defect == null ? -1 : (defect * 7) % 32;
  out.defect = defect == null ? null : pickDefect(S.SY, bit, defect);
  const alu = makeALU(S.table, out.defect);
  for (const T of TESTS) {
    const P = RV.assemble(T.src, {}), cases = T.cases.map(d => {
      const m = RV.machine(P.prog, null, { alu }); if (T.init) T.init(m, d);
      RV.run(m, P.prog, 20000);
      const got = m.err ? null : m.x[10], want = T.want(d);
      return { ok: got === want, got, want, stuck: !!m.err };
    });
    const ok = cases.every(c => c.ok); out.tests.push({ id: T.id, ok, cases }); out.total++; if (ok) out.passed++;
  }
  /* your program: assembled, run, and every step kept for the picture */
  const P = RV.assemble(program, {});
  out.errs = P.errs; out.lines = program.split('\n');
  if (!P.errs.length) {
    const m = RV.machine(P.prog, null, { alu }), trace = [];
    while (!m.halted && trace.length < 400) { const r = RV.step(m, P.prog); if (!r) break; trace.push({ l: r.e.l, op: r.e.op, a: r.a, b: r.b, val: r.val, rd: r.rd, alu: !!(r.act && r.act.alu), x: Array.from(m.x) }); }
    out.trace = trace; out.result = m.x[10]; out.cycles = m.cycles; out.runErr = m.err && m.err.k !== undefined ? m.err : (trace.length >= 400 ? { k: 'loop', l: 0 } : null);
  }
  out.ok = out.sliceOk && out.passed === out.total && !out.errs.length;
  /* where the transistors go: your slice 32 times, the registers (32 x 32 flip-flops), and the rest
     (decoder, program counter, control) as a round estimate */
  out.budget = { alu: 32 * S.tr, regs: 32 * 32 * 24, rest: 6000 };
  return remember(key, out);
}
function remember(k, v) { if (cache.size > 30) cache.clear(); cache.set(k, v); return v; }

/* the carries rippling through the 32 slices for one ALU operation, for drawing */
export function ripple(table, op, a, b) {
  const OPS = { add: [1, 1, 0], sub: [1, 1, 1], and: [0, 0, 0], or: [0, 1, 0], xor: [1, 0, 0] }, [o1, o0, s] = OPS[op] || OPS.add, c = [];
  let cin = s;
  for (let i = 0; i < 32; i++) { const t = table[(((a >>> i) & 1) << 5) | (((b >>> i) & 1) << 4) | (cin << 3) | (s << 2) | (o1 << 1) | o0]; c.push({ y: t & 1, c: t >> 1 }); cin = t >> 1; }
  return c;
}
/* which ALU operation an instruction uses */
export const aluOp = op => /^(add|addi|lw|sw|lb|lh|lbu|lhu|sb|sh|jal|jalr|auipc)$/.test(op) ? 'add' : /^(sub|beq|bne|blt|bge|bltu|bgeu|slt|slti|sltu|sltiu)$/.test(op) ? 'sub' : /^(and|andi)$/.test(op) ? 'and' : /^(or|ori)$/.test(op) ? 'or' : /^(xor|xori)$/.test(op) ? 'xor' : 'add';
