/* Change your core (#321): an architecture challenge on the community's RISC-V core. Pure logic, no DOM, no words (ids
   only); tests in tests/corearch.test.mjs.

   The core of Run your core (src/engines/rvpuzzles.js) is one arithmetic unit, 32 registers and no multiplier. Three
   choices change it, each a real one in RISC-V cores:
     mul    no multiplier (multiplying is a loop of additions, as in the puzzle), a slow one (a single adder used 32
            times, one bit of the multiplier a cycle) or a fast one (an array of adders that does it all at once);
     alus   one arithmetic unit or two: with two, the core issues two instructions in the same cycle when the second
            does not need the first's answer (dual issue, in order);
     regs   32 registers, or 16 (RV32E, the embedded base of RISC-V): half the register file, and programs that use
            only x0 to x15 still run.
   The puzzles' programs (their reference solutions; the version with mul when the core has a multiplier) run on the
   lab's simulator, and each run is timed again for the core you chose (cyclesOf): what the choice buys. What it costs
   is its area, counted in transistors from the parts (the ALU is 32 copies of the slice, 148 transistors in the lab's
   example; a register bit is a 24-transistor flip-flop), and the energy of every run: what each instruction switches,
   plus what the whole core leaks for every cycle it is powered (energy grows with area times time).

   The model is a sketch, said plainly: one cycle an instruction, a slow multiply 32 cycles, the leak a fixed share per
   transistor per cycle; the numbers are compared to the plain core, never quoted as watts. */
import RV from './riscv.js';
import { PUZZLES } from './rvpuzzles.js';
import { buildSlice } from './alu.js';
import { solutionOf } from './design.js';

export const MUL = ['none', 'slow', 'fast'];
export const ALUS = [1, 2];
export const REGS = [32, 16];
export const PLAIN = { mul: 'none', alus: 1, regs: 32 };
export const normal = c => ({ mul: MUL.includes(c && c.mul) ? c.mul : 'none', alus: ALUS.includes(c && c.alus) ? c.alus : 1, regs: REGS.includes(c && c.regs) ? c.regs : 32 });
export const same = (a, b) => a.mul === b.mul && a.alus === b.alus && a.regs === b.regs;
export const ALL = MUL.flatMap(mul => ALUS.flatMap(alus => REGS.map(regs => ({ mul, alus, regs }))));

/* the programs: every puzzle's reference solution, without and with a multiplier */
export const PROGRAMS = [
  { id: 'sum', soft: 'li a0, 0\nli t2, 1\nloop:\n  add a0, a0, t2\n  addi t2, t2, 1\n  ble t2, a1, loop', hard: 'addi t1, a1, 1\nmul a0, a1, t1\nsrli a0, a0, 1' },
  { id: 'max', soft: 'mv a0, a1\nbge a1, a2, done\nmv a0, a2\ndone:' },
  { id: 'mul', soft: 'li a0, 0\nloop:\n  andi t1, a2, 1\n  beq t1, x0, skip\n  add a0, a0, a1\nskip:\n  slli a1, a1, 1\n  srli a2, a2, 1\n  bne a2, x0, loop', hard: 'mul a0, a1, a2' },
  { id: 'fib', soft: 'li a0, 0\nli t1, 1\nloop:\n  beq a1, x0, done\n  add t2, a0, t1\n  mv a0, t1\n  mv t1, t2\n  addi a1, a1, -1\n  j loop\ndone:' }
];
const caseOf = id => PUZZLES.find(p => p.id === id).cases;
const wantOf = id => PUZZLES.find(p => p.id === id).want;

/* ---- what it costs: transistors ---- */
const SLICE_TR = buildSlice(solutionOf('alu')).tr;   /* 148 */
const FF = 24, FA = 28, AND2 = 6;
export const PARTS = {
  alu: 32 * SLICE_TR,                 /* one arithmetic unit: 32 slices */
  regbits: FF * 32,                   /* one 32-bit register */
  rest: 6000,                         /* decoder, program counter, control: a round estimate (src/engines/core.js) */
  port: 12 * 32,                      /* the extra read and write ports a second unit needs, per register */
  issue: 2500,                        /* checking that two instructions do not depend on each other */
  slow: 32 * FA + 64 * FF + 400,      /* one adder, a 64-bit product register, and its control */
  fast: 32 * 32 * AND2 + 31 * 32 * FA /* an array: every bit times every bit, then 31 rows of adders */
};
export function area(c) {
  c = normal(c);
  const parts = { alu: PARTS.alu * c.alus, regs: PARTS.regbits * c.regs + (c.alus > 1 ? PARTS.port * c.regs : 0), mul: c.mul === 'none' ? 0 : PARTS[c.mul], rest: PARTS.rest + (c.alus > 1 ? PARTS.issue : 0) };
  return { parts, total: parts.alu + parts.regs + parts.mul + parts.rest };
}

/* ---- what it buys: cycles, timed again from the instructions a run went through ---- */
const MUL_CYC = { none: 0, slow: 32, fast: 1 };
const isMul = op => op === 'mul' || op === 'mulh';
const isMem = op => /^(lw|lh|lb|lhu|lbu|sw|sh|sb)$/.test(op);
const isJump = e => e.f === 'B' || e.f === 'J' || e.op === 'jalr';
const writes = e => (e.f === 'S' || e.f === 'B' ? 0 : e.rd || 0);
const reads = e => [e.rs1, e.f === 'R' || e.f === 'S' || e.f === 'B' ? e.rs2 : null].filter(r => r != null && r !== 0);
/* the instructions of one run, in the order they ran: { e (the instruction), taken } */
export function cyclesOf(seq, c) {
  c = normal(c);
  let cyc = 0, pairs = 0;
  for (let i = 0; i < seq.length; i++) {
    const e = seq[i].e;
    if (isMul(e.op)) { cyc += MUL_CYC[c.mul] || 1; continue; }
    cyc++;
    /* a second unit takes the next instruction in the same cycle when it can: this one is no jump, the next does not
       read or overwrite what this one writes, and they do not both need memory (one port) or the multiplier */
    const n = seq[i + 1] && seq[i + 1].e;
    if (c.alus > 1 && n && !isJump(e) && !isMul(n.op) && !(isMem(e.op) && isMem(n.op))) {
      const w = writes(e);
      if (!w || (!reads(n).includes(w) && writes(n) !== w)) { i++; pairs++; }
    }
  }
  return { cycles: cyc, pairs };
}
/* what one instruction switches, in units of a plain instruction's fetch and decode */
export const E = { base: 1, alu: 0.3, mem: 0.6, slow: 0.4 * 32, fast: 3, dual: 0.12, leak: 1.2e-5 };
function energyOf(seq, c, cycles, tr) {
  let dyn = 0;
  for (const s of seq) { const op = s.e.op; dyn += E.base + (isMul(op) ? E[c.mul] || 0 : isMem(op) ? E.mem : E.alu) + (c.alus > 1 ? E.dual : 0); }
  return { dyn, leak: E.leak * tr * cycles, total: dyn + E.leak * tr * cycles };
}
/* run one program on the lab's simulator: the instructions it went through, case by case */
const RUNS = new Map();
function runs(p, hard) {
  const key = p.id + (hard ? '+' : '');
  if (RUNS.has(key)) return RUNS.get(key);
  const src = hard && p.hard ? p.hard : p.soft, A = RV.assemble(src, { ext: { M: true } }), out = [];
  for (const k of caseOf(p.id)) {
    const m = RV.machine(A.prog, null, {}); m.x[11] = k.a1 | 0; m.x[12] = (k.a2 || 0) | 0;
    const seq = [], hi = new Set();
    while (!m.halted && m.steps < 20000) { const r = RV.step(m, A.prog); if (!r) break; seq.push({ e: r.e, taken: !!(r.act && r.act.taken) }); [r.e.rd, r.e.rs1, r.e.rs2].forEach(x => { if (x != null) hi.add(x); }); }
    out.push({ seq, ok: !m.err && m.x[10] === wantOf(p.id)(k), top: Math.max(0, ...hi) });
  }
  RUNS.set(key, out); return out;
}
/* a core, measured: every program's cycles and energy, the area, and each against the plain core */
const MEMO = new Map();
export function measure(cfg) {
  const c = normal(cfg), key = c.mul + c.alus + c.regs;
  if (MEMO.has(key)) return MEMO.get(key);
  const A = area(c), progs = PROGRAMS.map(p => {
    const R = runs(p, c.mul !== 'none' && !!p.hard), fits = R.every(r => r.top < c.regs);
    const cyc = R.map(r => cyclesOf(r.seq, c)), cycles = cyc.reduce((a, x) => a + x.cycles, 0), pairs = cyc.reduce((a, x) => a + x.pairs, 0);
    const en = R.reduce((a, r, i) => a + energyOf(r.seq, c, cyc[i].cycles, A.total).total, 0);
    return { id: p.id, hard: c.mul !== 'none' && !!p.hard, ok: R.every(r => r.ok), fits, cycles, pairs, instrs: R.reduce((a, r) => a + r.seq.length, 0), energy: en };
  });
  const out = { cfg: c, area: A.total, parts: A.parts, progs, cycles: progs.reduce((a, p) => a + p.cycles, 0), energy: progs.reduce((a, p) => a + p.energy, 0), runs: progs.every(p => p.ok && p.fits) };
  MEMO.set(key, out); return out;
}
/* against the plain core: how many times faster, how many times the area, how many times the energy */
export function compare(cfg) {
  const m = measure(cfg), b = measure(PLAIN);
  return Object.assign({}, m, { speed: b.cycles / m.cycles, areaX: m.area / b.area, energyX: m.energy / b.energy,
    perProg: m.progs.map((p, i) => ({ id: p.id, speed: b.progs[i].cycles / p.cycles, base: b.progs[i].cycles, cycles: p.cycles, hard: p.hard })) });
}

/* the challenge: a core at least twice as fast on the programs as the plain one, in no more than 1.4 times its area,
   for no more energy than it uses. No single change reaches it: the fast multiplier is far too big, the slow one alone
   is not quite fast enough, and a second unit alone costs more area and energy than it buys. Two changes together are
   fast enough but too big; the room has to come from somewhere, and half the registers is room. */
export const GOAL = { speed: 2, area: 1.4, energy: 1 };
export const gauges = cfg => { const r = compare(cfg); return [
  { k: 'speed', v: r.speed, ok: r.speed >= GOAL.speed, f: Math.min(1, r.speed / GOAL.speed) },
  { k: 'area', v: r.areaX, ok: r.areaX <= GOAL.area, f: Math.min(1, GOAL.area / r.areaX) },
  { k: 'energy', v: r.energyX, ok: r.energyX <= GOAL.energy, f: Math.min(1, GOAL.energy / r.energyX) }]; };
export const met = cfg => compare(cfg).runs && gauges(cfg).every(g => g.ok);
/* one program's run on a core, instruction by instruction, for the picture: which instructions issued together */
export function issueOf(id, cfg) {
  /* the case drawn: the longest run that still fits the picture (adding to 10, not to 100) */
  const c = normal(cfg), p = PROGRAMS.find(x => x.id === id) || PROGRAMS[0], all = runs(p, c.mul !== 'none' && !!p.hard), src = c.mul !== 'none' && p.hard ? p.hard : p.soft;
  const R = all.filter(r => r.seq.length <= 120).sort((a, b) => b.seq.length - a.seq.length)[0] || all[0];
  const out = [];
  for (let i = 0; i < R.seq.length && out.length < 200; i++) {
    const s = R.seq[i], one = cyclesOf([s, R.seq[i + 1]].filter(Boolean), c), two = c.alus > 1 && R.seq[i + 1] && one.pairs > 0 && !isMul(s.e.op);
    out.push({ l: s.e.l, op: s.e.op, f: s.e.f, rd: s.e.rd, rs1: s.e.rs1, rs2: s.e.rs2, mul: isMul(s.e.op), mem: isMem(s.e.op), taken: s.taken, cyc: isMul(s.e.op) ? MUL_CYC[c.mul] || 1 : 1,
      with: two ? { l: R.seq[i + 1].e.l, op: R.seq[i + 1].e.op, mem: isMem(R.seq[i + 1].e.op) } : null });
    if (two) i++;
  }
  return { src, steps: out };
}
