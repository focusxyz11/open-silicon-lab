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
import TC from './tinychip.js';
import { buildSlice, makeALU, pickDefect } from './alu.js';

/* ---- the register file, made of designs too: a register bit (copied 1,024 times) and a register
   select (used three times, as a tree, to turn a 5-bit register number into one write enable for
   each of the 32 registers). Each design is read into a table of what it does; null means the lab's
   own model, which behaves as a right design would. ---- */
const proj = id => TC.PROJ.find(p => p.id === id);
function tableOf(id, code) {
  const p = proj(id), D = TC.parse(code, p.ins, p.outs, { regs: !!p.seq });
  if (D.errs.length) return { ok: false };
  const M = TC.synth(D, p.ins, p.outs, 'basic', false, '130').M;
  if (id === 'regbit') {
    /* next value of the bit, for every d, we and present value q */
    const reg = M.regs && M.regs[0], name = reg ? reg.name : 'q', T = [];
    for (let d = 0; d < 2; d++) for (let we = 0; we < 2; we++) for (let q = 0; q < 2; q++) T[(d << 2) | (we << 1) | q] = reg ? TC.simCells(M, { d, we }, null, { [name]: q }).next[name] | 0 : 0;
    return { ok: true, T };
  }
  /* the four outputs, for every s1, s0 and en */
  const T = [];
  for (let k = 0; k < 8; k++) { const v = { s1: k >> 2 & 1, s0: k >> 1 & 1, en: k & 1 }, o = TC.simCells(M, v, null, {}).out; T[k] = [o.y0 | 0, o.y1 | 0, o.y2 | 0, o.y3 | 0]; }
  return { ok: true, T };
}
const RIGHT = { bit: tableOf('regbit', proj('regbit').sol), sel: tableOf('select', proj('select').sol) };
/* which of the 32 registers the select tree lets be written, for a 5-bit field and an enable */
function enables(sel, f, en) {
  const S = (s1, s0, e) => sel[(s1 << 2) | (s0 << 1) | e], out = new Array(32).fill(0), y = S(f >> 4 & 1, f >> 3 & 1, en);
  for (let k = 0; k < 4; k++) { const z = S(f >> 2 & 1, f >> 1 & 1, y[k]); for (let j = 0; j < 4; j++) { const w = S(0, f & 1, z[j]); out[k * 8 + j * 2] = w[0]; out[k * 8 + j * 2 + 1] = w[1]; } }
  return out;
}
/* one clock tick of the register file: every bit of every register takes its next value */
function tick(regs, before, field, en, d) {
  const we = enables(regs.sel, field, en), x = new Int32Array(32);
  for (let r = 1; r < 32; r++) { let v = 0; for (let b = 0; b < 32; b++) v |= regs.bit[((d >>> b & 1) << 2) | (we[r] << 1) | (before[r] >>> b & 1)] << b; x[r] = v; }
  return x;
}
/* a register file from your designs (codes: { bit, select }, either may be missing: then the lab's model) */
export function registerFile(codes) {
  const bit = codes && codes.bit ? tableOf('regbit', codes.bit) : null, sel = codes && codes.select ? tableOf('select', codes.select) : null;
  const regs = { bit: bit && bit.ok ? bit.T : RIGHT.bit.T, sel: sel && sel.ok ? sel.T : RIGHT.sel.T };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return { regs, yours: { bit: !!bit, select: !!sel }, reads: { bit: !bit || bit.ok, select: !sel || sel.ok }, right: same(regs.bit, RIGHT.bit.T) && same(regs.sel, RIGHT.sel.T) };
}
/* one step of the core with its registers made of designs: the simulator works out the instruction,
   then the register file, not the simulator, decides what every register holds afterwards. The
   register number is read from the instruction's own bits 7 to 11, as real hardware does, so a store
   or a branch (which writes nothing) still presents a number there. */
function stepWith(m, prog, RF) {
  const before = Int32Array.from(m.x), r = RV.step(m, prog);
  if (!r || RF.right) return r;
  const e = r.e, writes = r.rd !== null && r.rd !== undefined, field = (e.word >>> 7) & 31;
  m.x.set(tick(RF.regs, before, field, writes ? 1 : 0, writes ? r.val | 0 : r.val | 0));
  return r;
}

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
export function buildCore(slice, program, defect, regs) {
  const RF = registerFile(regs), key = slice + '\n#\n' + program + '\n#' + defect + '\n#' + JSON.stringify(regs || null);
  if (cache.has(key)) return cache.get(key);
  const S = buildSlice(slice), out = { slice: S, sliceOk: S.ok && !S.wrong.length, regs: RF, errs: [], tests: [], passed: 0, total: 0 };
  if (!S.ok) { out.sliceErrs = S.errs; return remember(key, out); }
  const bit = defect == null ? -1 : (defect * 7) % 32;
  out.defect = defect == null ? null : pickDefect(S.SY, bit, defect);
  const alu = makeALU(S.table, out.defect);
  for (const T of TESTS) {
    const P = RV.assemble(T.src, {}), cases = T.cases.map(d => {
      const m = RV.machine(P.prog, null, { alu }); if (T.init) T.init(m, d);
      run(m, P.prog, RF, 20000);
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
    while (!m.halted && trace.length < 400) { const r = stepWith(m, P.prog, RF); if (!r) break; trace.push({ l: r.e.l, op: r.e.op, a: r.a, b: r.b, val: r.val, rd: r.rd, alu: !!(r.act && r.act.alu), x: Array.from(m.x) }); }
    out.trace = trace; out.result = m.x[10]; out.cycles = m.cycles; out.runErr = m.err && m.err.k !== undefined ? m.err : (trace.length >= 400 ? { k: 'loop', l: 0 } : null);
  }
  out.ok = out.sliceOk && out.passed === out.total && !out.errs.length && out.regs.reads.bit && out.regs.reads.select;
  /* where the transistors go: your slice 32 times, the registers (32 x 32 flip-flops), and the rest
     (decoder, program counter, control) as a round estimate */
  out.budget = { alu: 32 * S.tr, regs: 32 * 32 * 24, rest: 6000 };
  return remember(key, out);
}
/* run a program to the end (or a limit), the registers working as RF says */
function run(m, prog, RF, limit) {
  if (RF.right) return RV.run(m, prog, limit);
  while (!m.halted && m.steps < limit) stepWith(m, prog, RF);
  if (!m.halted && !m.err) m.err = { l: 0, k: 'loop' };
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
