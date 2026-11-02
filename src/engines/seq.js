/* Memory and the clock: gates that remember, flip-flops that wait for the clock's tick, and a
   counter that fails when the clock outruns its slowest path. Pure logic, no DOM; tests in
   tests/seq.test.mjs.

   An event-driven gate simulator: every gate has a delay, a change at a gate's input schedules a
   change at its output that much later, and wires that feed back into themselves are allowed, which
   is what lets a pair of gates hold a bit. Values are 0, 1 or 'x' (unknown, as at power-on).
   Gate delays come from the tiny-chip studio's cell library and process (src/engines/tinychip.js),
   so a counter here is as fast as the same gates there.

   What is simplified: delays are fixed per gate (no wire delay, no dependence on load or on whether
   the output rises or falls), a change is never swallowed however short it is, and a latch that is
   set and reset at once oscillates forever instead of settling at random (metastability). */
import TC from './tinychip.js';

/* ---------- circuits ---------- */
export class Circ {
  constructor() { this.gates = []; this.ins = []; this.fan = {}; }
  input(...names) { names.forEach(n => { if (!this.ins.includes(n)) this.ins.push(n); }); return this; }
  /* type: NOT, BUF, AND, OR, NAND, NOR, XOR; d: delay in ps */
  g(type, ins, out, d) { const k = this.gates.length; this.gates.push({ type, ins, out, d }); ins.forEach(n => { (this.fan[n] = this.fan[n] || []).push(k); }); return out; }
  nets() { const s = new Set(this.ins); this.gates.forEach(g => { s.add(g.out); g.ins.forEach(n => s.add(n)); }); return [...s]; }
}
function ev(type, x) {
  const any = v => x.includes(v), all = v => x.every(y => y === v);
  switch (type) {
    case 'NOT': return x[0] === 'x' ? 'x' : 1 - x[0];
    case 'BUF': return x[0];
    case 'AND': return any(0) ? 0 : all(1) ? 1 : 'x';
    case 'NAND': return any(0) ? 1 : all(1) ? 0 : 'x';
    case 'OR': return any(1) ? 1 : all(0) ? 0 : 'x';
    case 'NOR': return any(1) ? 0 : all(0) ? 1 : 'x';
    case 'XOR': return any('x') ? 'x' : x.reduce((a, b) => a ^ b, 0);
  }
  throw new Error('unknown gate ' + type);
}

/* Gate delays in ps at a process, from the studio's library: intrinsic delay plus a small wire allowance. */
const CELL = { NOT: 'INV', BUF: 'BUF', AND: 'AND2', OR: 'OR2', NAND: 'NAND2', NOR: 'NOR2', XOR: 'XOR2' };
export function delays(node = '130') { const f = TC.NODE[node].dly, o = {}; for (const k in CELL) o[k] = Math.round(TC.LIB[CELL[k]][2] * f + 10 * f); return o; }

/* ---------- simulation ---------- */
/* stim: { net: [[t, v], ...] } input changes; init: { net: v } values at power-on (the rest are 'x').
   Returns waves: { net: [[t, v], ...] } (each starts at t = 0), and at(net, t). */
export function simulate(C, { stim = {}, init = {}, tEnd = 1000, maxEvents = 200000 } = {}) {
  const val = {}, waves = {};
  C.nets().forEach(n => { val[n] = init[n] !== undefined ? init[n] : 'x'; waves[n] = [[0, val[n]]]; });
  /* a small binary heap of [t, seq, net, v] */
  const H = []; let seq = 0;
  const push = e => { H.push(e); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (lt(H[p], H[i])) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const lt = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && lt(H[l], H[m])) m = l; if (r < H.length && lt(H[r], H[m])) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
  /* inputs at time 0 apply at once; later changes are events */
  for (const n in stim) for (const [t, v] of stim[n]) { if (t <= 0) val[n] = v; else push([t, seq++, n, v]); }
  /* power-on: the gates whose outputs were not given settle from the inputs and the given state
     (the given state is what a latch holds), then any gate that disagrees changes after its delay */
  for (let pass = 0; pass < C.gates.length; pass++) { let changed = false; C.gates.forEach(g => { if (init[g.out] !== undefined) return; const v = ev(g.type, g.ins.map(n => val[n])); if (v !== val[g.out]) { val[g.out] = v; changed = true; } }); if (!changed) break; }
  C.nets().forEach(n => { waves[n] = [[0, val[n]]]; });
  C.gates.forEach(g => { const v = ev(g.type, g.ins.map(n => val[n])); if (v !== val[g.out]) push([g.d, seq++, g.out, v]); });
  let count = 0, stopped = false;
  while (H.length) {
    const [t, , n, v] = pop(); if (t > tEnd) break;
    if (++count > maxEvents) { stopped = true; break; }
    if (val[n] === v) continue;
    val[n] = v; waves[n].push([t, v]);
    for (const k of C.fan[n] || []) { const g = C.gates[k], o = ev(g.type, g.ins.map(m => val[m])); push([t + g.d, seq++, g.out, o]); }
  }
  const at = (n, t) => { const w = waves[n]; let v = w[0][1]; for (const [tt, vv] of w) { if (tt > t) break; v = vv; } return v; };
  return { waves, at, tEnd, stopped };
}

/* ---------- building blocks ---------- */
/* Two NOR gates feeding each other: S sets Q to 1, R resets it to 0, and with both at 0 it remembers. */
export function srLatch(node = '130') {
  const D = delays(node), C = new Circ().input('S', 'R');
  C.g('NOR', ['R', 'Qn'], 'Q', D.NOR); C.g('NOR', ['S', 'Q'], 'Qn', D.NOR);
  return C;
}
/* A gated D latch inside circuit C: while E is 1, Q follows D; while E is 0, Q holds. p names its nets. */
function dLatchIn(C, D, d, e, p) {
  C.g('NOT', [d], p + 'nd', D.NOT);
  C.g('AND', [d, e], p + 's', D.AND); C.g('AND', [p + 'nd', e], p + 'r', D.AND);
  C.g('NOR', [p + 'r', p + 'qn'], p + 'q', D.NOR); C.g('NOR', [p + 's', p + 'q'], p + 'qn', D.NOR);
  return p + 'q';
}
/* A flip-flop from two latches: the first listens while the clock is 0, the second copies it while
   the clock is 1, so Q changes only just after the clock rises. */
function dffIn(C, D, d, clk, p) {
  C.g('NOT', [clk], p + 'ck', D.NOT);
  const m = dLatchIn(C, D, d, p + 'ck', p + 'm');
  return dLatchIn(C, D, m, clk, p + 'l');
}
export function dLatch(node = '130') { const D = delays(node), C = new Circ().input('D', 'E'); dLatchIn(C, D, 'D', 'E', 'a'); return C; }
/* Both side by side on the same D and clock, so they can be compared: latch Q is 'aq', flip-flop Q is 'flq'. */
export function latchAndFlop(node = '130') {
  const D = delays(node), C = new Circ().input('D', 'CLK');
  dLatchIn(C, D, 'D', 'CLK', 'a'); dffIn(C, D, 'D', 'CLK', 'f');
  return C;
}
/* Power-on values that make every latch hold 0 (what a reset does). */
export function zeroState(C) {
  const init = {}; C.nets().forEach(n => { if (/q$/.test(n)) init[n] = 0; if (/qn$/.test(n)) init[n] = 1; }); return init;
}

/* A counter: a register of flip-flops whose outputs go through an incrementer (a chain of half
   adders) and back into their inputs. Each tick of the clock stores the next number. Bit i is net
   'b' + i + 'lq'. */
export function counter(bits = 4, node = '130') {
  const D = delays(node), C = new Circ().input('CLK'), q = i => 'b' + i + 'lq';
  for (let i = 0; i < bits; i++) {
    /* next value of bit i: bit i XOR carry into bit i; the carry into bit 0 is 1 */
    let d;
    if (i === 0) d = C.g('NOT', [q(0)], 'n0', D.NOT);
    else d = C.g('XOR', [q(i), i === 1 ? q(0) : 'c' + i], 'n' + i, D.XOR);
    if (i >= 2) C.g('AND', [q(i - 1), i === 2 ? q(0) : 'c' + (i - 1)], 'c' + i, D.AND);
    dffIn(C, D, d, 'CLK', 'b' + i);
  }
  return C;
}
export const qOf = i => 'b' + i + 'lq';

/* The timing a flip-flop needs and the counter's slowest path, in ps. */
export function timing(bits = 4, node = '130') {
  const D = delays(node);
  const clkToQ = D.AND + 2 * D.NOR;         /* clock rises → slave's AND → both NORs */
  const setup = D.NOT + D.AND + 2 * D.NOR;               /* D must pass the master's inverter, AND and loop */
  const steps = bits <= 1 ? [['NOT', D.NOT]] : bits === 2 ? [['XOR', D.XOR]] : [...Array(bits - 2).fill(['AND', D.AND]), ['XOR', D.XOR]];
  const logic = steps.reduce((s, x) => s + x[1], 0);
  const period = clkToQ + logic + setup;
  return { clkToQ, setup, logic, steps, period, fmaxHz: 1e12 / period, delays: D };
}

/* Run the counter for some clock cycles at a frequency; read the count just before each rising edge. */
export function runCounter({ bits = 4, node = '130', hz, cycles = 20 } = {}) {
  const C = counter(bits, node), per = 1e12 / hz, half = per / 2, edges = [];
  const stim = { CLK: [[0, 0]] };
  for (let k = 1; k <= cycles; k++) { stim.CLK.push([k * per - half, 1]); stim.CLK.push([k * per, 0]); edges.push(k * per - half); }
  const S = simulate(C, { stim, init: zeroState(C), tEnd: (cycles + 1) * per });
  const read = t => { let v = 0; for (let i = 0; i < bits; i++) { const b = S.at(qOf(i), t); if (b === 'x') return null; v |= b << i; } return v; };
  /* sample just before each next edge: the value the register holds during that cycle */
  const values = edges.map((e, k) => read((k + 1 < edges.length ? edges[k + 1] : e + per) - 1));
  const expected = values.map((_, k) => (k + 1) % (1 << bits));
  const wrong = values.map((v, k) => v !== expected[k]);
  return { values, expected, wrong, errors: wrong.filter(Boolean).length, per, sim: S, edges };
}
