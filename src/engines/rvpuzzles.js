/* Run your core: small programs to write for the community's RISC-V core, each checked by running it. Pure logic, no
   DOM, no words (ids only); tests in tests/rvpuzzles.test.mjs. The core is the lab's RISC-V simulator
   (src/engines/riscv.js, from the first site's RISC-V lab), the same one the core in the build runs on.

   A puzzle puts its inputs in a1 and a2, runs the program to its end, and reads the answer in a0. The core has no
   multiplier (RV32I without the M extension) until the last puzzle, which gives it one and asks for few cycles: the
   same answer by a better idea. Each
   gives a starting program: the first one already works, to be watched; the others are left for the player. */
import RV from './riscv.js';

export const PUZZLES = [
  { id: 'sum', start: 'li a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, a1, loop', cases: [{ a1: 10 }, { a1: 25 }, { a1: 100 }], want: c => (c.a1 * (c.a1 + 1)) / 2 },
  { id: 'max', start: '# a0 = the larger of a1 and a2\n', cases: [{ a1: 3, a2: 9 }, { a1: 9, a2: 3 }, { a1: -5, a2: -2 }, { a1: 7, a2: 7 }], want: c => Math.max(c.a1, c.a2) },
  { id: 'mul', start: '# a0 = a1 × a2, without mul\n', cases: [{ a1: 12, a2: 13 }, { a1: 999, a2: 1000 }, { a1: 7, a2: 0 }], forbid: ['mul', 'mulh', 'mac', 'dot4'], want: c => c.a1 * c.a2 },
  { id: 'fib', start: '# a0 = the a1-th Fibonacci number: 0, 1, 1, 2, 3, 5 ...\n', cases: [{ a1: 1 }, { a1: 2 }, { a1: 10 }, { a1: 20 }], want: c => { let a = 0, b = 1; for (let i = 0; i < c.a1; i++) [a, b] = [b, a + b]; return a; } },
  { id: 'fast', start: 'li a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, a1, loop', cases: [{ a1: 100 }, { a1: 1000 }, { a1: 7 }], maxCycles: 12, ext: { M: true }, want: c => (c.a1 * (c.a1 + 1)) / 2 }
];
export const PUZZLE_IDS = PUZZLES.map(p => p.id);
export const puzzleOf = id => PUZZLES.find(p => p.id === id) || null;
/* the challenge: three puzzles solved */
export const GOAL = 3;
export const met = solved => solved.length >= GOAL;
export const LIMIT = 20000;

/* assemble, check the forbidden instructions, run every case; keep the first case's steps for the picture */
export function check(id, src) {
  const P = puzzleOf(id), A = RV.assemble(src, { ext: P.ext || {} });
  const out = { id, errs: A.errs.map(e => ({ l: e.l, k: e.k, n: e.n })), cases: [], ok: false, cycles: 0, steps: 0, trace: [], forbidden: null };
  if (out.errs.length) return out;
  const used = A.prog.map(e => e.op), bad = (P.forbid || []).find(op => used.includes(op));
  if (bad) out.forbidden = bad;
  P.cases.forEach((c, i) => {
    const m = RV.machine(A.prog, null, {}); m.x[11] = c.a1 | 0; m.x[12] = (c.a2 || 0) | 0;
    if (i === 0) {
      while (!m.halted && m.steps < 400) { const r = RV.step(m, A.prog); if (!r) break; out.trace.push({ l: r.e.l, op: r.e.op, a: r.a, b: r.b, val: r.val, rd: r.rd, taken: !!(r.act && r.act.taken), x: Array.from(m.x) }); }
    }
    RV.run(m, A.prog, LIMIT);
    const got = m.err ? null : m.x[10], want = P.want(c);
    out.cases.push({ in: c, got, want, ok: got === want, err: m.err ? { k: m.err.k, l: m.err.l } : null, cycles: m.cycles });
  });
  out.cycles = Math.max(...out.cases.map(c => c.cycles));
  out.steps = out.trace.length;
  out.slow = P.maxCycles != null && out.cycles > P.maxCycles;
  out.ok = out.cases.every(c => c.ok) && !out.forbidden && !out.slow;
  return out;
}
/* the register names, for drawing */
export const ABI = RV.ABI;
