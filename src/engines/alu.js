/* Your ALU: one bit-slice designed in the tiny-chip studio, copied 32 times and chained
   carry to carry, becomes the arithmetic-logic unit of the RISC-V core. Pure logic, no DOM.

   Slice pins:  a, b, cin, sub, op1, op0  →  y, cout
     op1 op0 = 00 AND · 01 OR · 10 XOR · 11 ADD (SUB when sub = 1)
     cout is always the carry of a + (b XOR sub) + cin.
   Subtraction uses two's complement: a − b = a + (NOT b) + 1, so sub inverts b in every slice
   and the first slice gets cin = 1. */
import TC from './tinychip.js';

export const ALU_INS = ['a', 'b', 'cin', 'sub', 'op1', 'op0'];
export const ALU_OUTS = ['y', 'cout'];
/* op1, op0, sub for each operation the CPU asks for. */
export const OPS = { and: [0, 0, 0], or: [0, 1, 0], xor: [1, 0, 0], add: [1, 1, 0], sub: [1, 1, 1] };

/* What one slice must do. */
export function sliceSpec(v) {
  const bb = v.b ^ v.sub, s = v.a ^ bb ^ v.cin;
  const cout = (v.a & bb) | (v.cin & (v.a ^ bb));
  const op = v.op1 * 2 + v.op0;
  const y = op === 0 ? v.a & v.b : op === 1 ? v.a | v.b : op === 2 ? v.a ^ v.b : s;
  return { y, cout };
}

const idx = v => (v.a << 5) | (v.b << 4) | (v.cin << 3) | (v.sub << 2) | (v.op1 << 1) | v.op0;
const VECS = TC.vectors(ALU_INS);

/* Truth table of a synthesized netlist: entry = y | cout << 1, optionally with a stuck-at fault. */
export function tableOf(M, fault) {
  const t = new Uint8Array(64);
  for (const v of VECS) { const o = TC.simCells(M, v, fault).out; t[idx(v)] = (o.y & 1) | ((o.cout & 1) << 1); }
  return t;
}

/* Parse, synthesize to real cells, and check a slice against the specification. */
export function buildSlice(code) {
  const D = TC.parse(code, ALU_INS, ALU_OUTS);
  if (D.errs.length) return { ok: false, errs: D.errs, D };
  const SY = TC.synth(D, ALU_INS, ALU_OUTS, 'basic', false, '130');
  const table = tableOf(SY.M);
  const wrong = [];
  for (const v of VECS) { const e = sliceSpec(v), t = table[idx(v)]; if ((t & 1) !== e.y || (t >> 1) !== e.cout) wrong.push(v); }
  return { ok: true, errs: [], D, SY, table, wrong, cells: SY.st.cells, tr: SY.st.tr };
}

/* A manufacturing defect: one wire in one slice stuck at 0 or 1, chosen among the faults that
   spoil addition, so programs notice it. Exhaustive test patterns would have caught it. */
export function pickDefect(SY, bit, seed) {
  const good = tableOf(SY.M);
  /* Prefer faults that spoil addition, the operation every program uses. */
  const addIdx = VECS.filter(v => v.op1 && v.op0 && !v.sub).map(idx);
  const cands = [];
  for (let n = 0; n < SY.M.nets; n++) for (const sv of [0, 1]) {
    const f = { net: n, v: sv }, t = tableOf(SY.M, f);
    if (addIdx.some(k => t[k] !== good[k])) cands.push({ f, t });
  }
  if (!cands.length) return null;
  const c = cands[Math.abs(seed | 0) % cands.length];
  return { bit, fault: c.f, table: c.t };
}

/* The 32-bit ALU: 32 slices in a ripple-carry chain. Returns the result and the flags the
   CPU uses for comparisons: c (carry out), v (signed overflow), n (sign), z (zero). */
export function makeALU(table, defect) {
  const fn = (op, a, b) => {
    const [o1, o0, s] = OPS[op];
    let cin = s, y = 0, c30 = 0;
    for (let i = 0; i < 32; i++) {
      const t = (defect && defect.bit === i ? defect.table : table)[(((a >>> i) & 1) << 5) | (((b >>> i) & 1) << 4) | (cin << 3) | (s << 2) | (o1 << 1) | o0];
      y |= (t & 1) << i;
      if (i === 30) c30 = t >> 1;
      cin = t >> 1;
    }
    y |= 0;
    return { y, c: cin, v: c30 ^ cin, n: (y >>> 31) & 1, z: y === 0 ? 1 : 0 };
  };
  fn.slices = 32;
  return fn;
}

export const SLICE_VECTORS = VECS;
export const sliceIndex = idx;
