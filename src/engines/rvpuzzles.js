/* Run your core: small programs to write for the community's RISC-V core, each checked by running it. Pure logic, no
   DOM, no words (ids only); tests in tests/rvpuzzles.test.mjs. The core is the lab's RISC-V simulator
   (src/engines/riscv.js, from the first site's RISC-V lab), the same one the core in the build runs on.

   A puzzle puts its inputs in a1 and a2, runs the program to its end, and reads the answer in a0. The core has no
   multiplier (RV32I without the M extension) until the last puzzle, which gives it one and asks for few cycles: the
   same answer by a better idea. Each
   gives a starting program: the first one already works, to be watched; the others are left for the player.

   Your own core (#321): the same programs also run on the core made of your own ALU slice (src/engines/alu.js, the
   slice copied 32 times and chained carry to carry, as in src/engines/core.js), side by side with the reference core,
   step for step (checkOn). While the two agree nothing is said; the first step where they part is the fault: the
   instruction, the value your core wrote against the right one, and the slice that answered wrong, found by walking
   the carry chain and asking each slice whether it gave what an ALU slice must give for what it was handed. A
   machine's core (src/data/blocks.js, the block that runs) has a job of its own here too (JOBS), a working program
   to watch on that core. */
import RV from './riscv.js';
import { buildSlice, makeALU, sliceSpec, OPS as ALU_OPS } from './alu.js';
import { solutionOf } from './design.js';

export const PUZZLES = [
  { id: 'sum', start: 'li a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, a1, loop', cases: [{ a1: 10 }, { a1: 25 }, { a1: 100 }], want: c => (c.a1 * (c.a1 + 1)) / 2 },
  { id: 'max', start: '# a0 = the larger of a1 and a2\n', cases: [{ a1: 3, a2: 9 }, { a1: 9, a2: 3 }, { a1: -5, a2: -2 }, { a1: 7, a2: 7 }], want: c => Math.max(c.a1, c.a2) },
  { id: 'mul', start: '# a0 = a1 × a2, without mul\n', cases: [{ a1: 12, a2: 13 }, { a1: 999, a2: 1000 }, { a1: 7, a2: 0 }], forbid: ['mul', 'mulh', 'mac', 'dot4'], want: c => c.a1 * c.a2 },
  { id: 'fib', start: '# a0 = the a1-th Fibonacci number: 0, 1, 1, 2, 3, 5 ...\n', cases: [{ a1: 1 }, { a1: 2 }, { a1: 10 }, { a1: 20 }], want: c => { let a = 0, b = 1; for (let i = 0; i < c.a1; i++) [a, b] = [b, a + b]; return a; } },
  { id: 'fast', start: 'li a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, a1, loop', cases: [{ a1: 100 }, { a1: 1000 }, { a1: 7 }], maxCycles: 12, ext: { M: true }, want: c => (c.a1 * (c.a1 + 1)) / 2 }
];
/* the jobs of a machine's core (src/data/blocks.js NEEDS, by the need's id): a program that already works, watched on
   your core. a3 and the words of memory from address 4096 (mem) are inputs too. Words: rv.job.<id>.t, .d */
const MEM0 = 4096;
export const JOBS = [
  { id: 'hearing', start: '# the louder of two microphones\nmv a0, a1\nbge a1, a2, done\nmv a0, a2\ndone:', cases: [{ a1: 310, a2: 870 }, { a1: 650, a2: 120 }], want: c => Math.max(c.a1, c.a2) },
  { id: 'wildfire', start: '# count the readings over the alarm level a2\nli t0, 4096\nli t1, 6\nli a0, 0\nloop:\n  lw t2, 0(t0)\n  ble t2, a2, skip\n  addi a0, a0, 1\nskip:\n  addi t0, t0, 4\n  addi t1, t1, -1\n  bne t1, x0, loop',
    cases: [{ a2: 40, mem: [12, 55, 38, 71, 40, 90] }, { a2: 100, mem: [3, 8, 2, 120, 9, 1] }], want: c => c.mem.filter(v => v > c.a2).length },
  { id: 'rover', start: '# two of three computers must agree, bit by bit\nand t0, a1, a2\nand t1, a1, a3\nand t2, a2, a3\nor a0, t0, t1\nor a0, a0, t2',
    cases: [{ a1: 0b101101, a2: 0b101001, a3: 0b111100 }, { a1: 7, a2: 7, a3: 0 }], want: c => (c.a1 & c.a2) | (c.a1 & c.a3) | (c.a2 & c.a3) },
  { id: 'radio', start: '# the strongest of the readings\nli t0, 4096\nli t1, 5\nlw a0, 0(t0)\nloop:\n  addi t0, t0, 4\n  addi t1, t1, -1\n  beq t1, x0, done\n  lw t2, 0(t0)\n  bge a0, t2, loop\n  mv a0, t2\n  j loop\ndone:',
    cases: [{ mem: [14, 92, 37, 61, 8] }, { mem: [5, 3, 77, 2, 76] }], want: c => Math.max(...c.mem) }
];
export const JOB_IDS = JOBS.map(j => j.id);
export const jobOf = id => JOBS.find(j => j.id === id) || null;
export const puzzleOf = id => PUZZLES.find(p => p.id === id) || jobOf(id);
/* a case's inputs into a machine */
function setIn(m, c) { m.x[11] = c.a1 | 0; m.x[12] = (c.a2 || 0) | 0; m.x[13] = (c.a3 || 0) | 0; (c.mem || []).forEach((v, i) => RV.st(m, MEM0 + 4 * i, 4, v)); }
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
    const m = RV.machine(A.prog, null, {}); setIn(m, c);
    if (i === 0) {
      while (!m.halted && m.steps < 400) { const r = RV.step(m, A.prog); if (!r) break; out.trace.push(dpStep(r, [], m)); }
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

/* ---- your own core: the program on the core made of your slice, beside the reference core ---- */
export const SLICE_EXAMPLE = solutionOf('alu');
const RIGHT = makeALU(buildSlice(SLICE_EXAMPLE).table, null);
/* one step as the datapath draws it: the instruction's fields, what went into the arithmetic unit and came out, memory,
   the branch, and every register afterwards */
const dpStep = (r, calls, m) => {
  const e = r.e, c = calls.length ? calls[calls.length - 1] : null;
  return { l: e.l, pc: r.pc, op: e.op, f: e.f, rd: r.rd, rs1: e.rs1 != null ? e.rs1 : null, rs2: e.rs2 != null && (e.f === 'R' || e.f === 'S' || e.f === 'B') ? e.rs2 : null, imm: e.imm != null && e.f !== 'R' ? e.imm : null,
    a: r.a, b: r.b, val: r.val, taken: !!(r.act && r.act.taken), mem: (r.act && r.act.mem) || null, memA: r.memA, alu: c ? { op: c.op, p: c.p, q: c.q, y: c.y } : null, x: Array.from(m.x) };
};
/* the slice that answered wrong: walk the carry chain of one operation with your slice's table, and ask each slice
   whether it gave what an ALU slice must give for the inputs it was handed (the first that did not is the one) */
export function blame(table, op, a, b) {
  const [o1, o0, s] = ALU_OPS[op] || ALU_OPS.add; let cin = s;
  for (let i = 0; i < 32; i++) {
    const v = { a: (a >>> i) & 1, b: (b >>> i) & 1, cin, sub: s, op1: o1, op0: o0 }, t = table[(v.a << 5) | (v.b << 4) | (cin << 3) | (s << 2) | (o1 << 1) | o0], w = sliceSpec(v);
    if ((t & 1) !== w.y || (t >> 1) !== w.cout) return { bit: i, in: v, got: { y: t & 1, cout: t >> 1 }, want: w };
    cin = t >> 1;
  }
  return null;
}
/* one case on your core, in step with the reference core: the answer, and the first step where the two parted */
function runMine(prog, c, table, keep) {
  const calls = [], base = makeALU(table, null), alu = (op, p, q) => { const r = base(op, p, q); calls.push({ op, p, q, y: r.y, r }); return r; };
  const m = RV.machine(prog, null, { alu }), ref = RV.machine(prog, null, {}); setIn(m, c); setIn(ref, c);
  const trace = [], refX = []; let fault = null;
  while (!m.halted && m.steps < LIMIT) {
    calls.length = 0;
    const r = RV.step(m, prog); if (!r) break;
    const q = fault ? null : RV.step(ref, prog);
    if (keep && trace.length < 400) trace.push(dpStep(r, calls, m));
    if (!fault) {
      const parted = !q || m.pc !== ref.pc || m.x.some((v, i) => v !== ref.x[i]) || r.memA !== q.memA;
      if (parted) {
        const bad = calls.find(k => { const w = RIGHT(k.op, k.p, k.q); return w.y !== k.r.y || w.c !== k.r.c || w.z !== k.r.z || w.n !== k.r.n || w.v !== k.r.v; });
        fault = { step: m.steps - 1, l: r.e.l, op: r.e.op, rd: r.rd, got: r.val, want: q ? q.val : null, taken: !!(r.act && r.act.taken), wantTaken: !!(q && q.act && q.act.taken),
          alu: bad ? { op: bad.op, p: bad.p, q: bad.q, got: bad.r.y, want: RIGHT(bad.op, bad.p, bad.q).y } : null, slice: bad ? blame(table, bad.op, bad.p, bad.q) : null };
      }
    }
    if (keep && refX.length < 400) refX.push(fault && !q ? null : Array.from(ref.x));
  }
  if (!m.halted && !m.err) m.err = { l: 0, k: 'loop' };
  return { got: m.err ? null : m.x[10], err: m.err ? { k: m.err.k, l: m.err.l } : null, cycles: m.cycles, trace, refX, fault };
}
/* a puzzle (or a machine's job) on the reference core and on yours, side by side. slice: your ALU slice's description
   (null: the lab's example). yours: { ok (it reads and every slice row is right), cases [{ got, ok, same (as the
   reference) }], trace (the first case, for the datapath), refX (the reference's registers at each step), fault } */
export function checkOn(id, src, slice) {
  const ref = check(id, src), P = puzzleOf(id), code = slice == null ? SLICE_EXAMPLE : slice;
  if (ref.errs.length || !P) return { ref, yours: null };
  const S = buildSlice(code);
  if (!S.ok) return { ref, yours: { reads: false, errs: S.errs.map(e => ({ l: e.l, k: e.k, n: e.n })), cases: [], trace: [], refX: [], fault: null, same: false } };
  const A = RV.assemble(src, { ext: P.ext || {} }), runs = P.cases.map((c, i) => runMine(A.prog, c, S.table, i === 0));
  const cases = runs.map((r, i) => { const want = P.want(P.cases[i]), rc = ref.cases[i]; return { in: P.cases[i], got: r.got, want, ok: r.got === want, same: r.got === rc.got && !r.err === !rc.err, err: r.err, fault: r.fault }; });
  const first = runs.findIndex(r => r.fault);
  return { ref, yours: { reads: true, right: !S.wrong.length, wrongRows: S.wrong.length, cells: S.cells, tr: S.tr, cases, trace: runs[0].trace, refX: runs[0].refX,
    fault: first >= 0 ? Object.assign({ at: first }, runs[first].fault) : null, same: cases.every(c => c.same) } };
}
