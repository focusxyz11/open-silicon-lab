/* The clock and the power, as an engine: timing and pipeline stages, the voltage-and-clock power curve, a five-stage
   pipeline with its stalls, and the gate-level clock lab (a bit of memory, a flip-flop, a counter that fails when the
   clock outruns its slowest path). Pure logic, no DOM, no English (ids only; the words are ckp.* in
   src/i18n/en/labs.json, those the lab does not show yet waiting in src/data/waiting-words.json; its tests check them).
   Brought over from the first version of the site (the branch 'before'): the labs topics/design/labs/timing.js and
   power.js, topics/architecture/labs/pipeline.js and topics/clock/labs/clock-lab.js (with each topic's content.html
   and topic.json), and the gate simulator that the clock lab calls, src/engines/seq.js with its tests (it was not
   in the list of labs, but the lab is nothing without it, so it comes here whole). Same formulas and same numbers.
   Added here: timing() and fewestCuts() around the lab's stages() and balance(), power() around its formulas, the
   pipeline as schedule(), ids for hints and stall reasons, and CHALLENGES.

   Skipped, because they hold nothing to compute: every canvas drawing (waves, latch, budget bar, timing bars, power
   curve), the slow-motion loop of the latch lab (its RATE of 400 ps of chip time per second on screen) and the
   pipeline lab's Play button (a timer that steps a cycle number).

   What is simplified (the first version's notes, kept):
   timing: gate delays are representative values in picoseconds; each stage pays 40 ps for the flip-flop itself (setup
   plus clock-to-output); sign-off must pass at the slow corner (hot, low voltage); real chips check millions of paths
   across dozens of corners. power: P = a C V^2 f + leakage, with the lowest voltage a clock needs from a fitted curve.
   Round values for a made-up chip: 45 W of dynamic power at 3 GHz, 0.75 V and 15% activity, and 6 W of leakage at 0.75 V.
   pipeline: the classic textbook five stages; registers are written in the first half of a cycle and read in the
   second; real high-end cores go further (out-of-order, branch prediction, 4 to 10 instructions per cycle).
   gates: one fixed delay per gate (no wire delay, no load or rise/fall dependence), a change is never swallowed however
   short it is, and a latch set and reset at once then released oscillates forever instead of settling at random
   (metastability). The counter has no clock skew and no voltage or temperature change.
   No entry of src/data/facts.json is behind these numbers; the lab's note that real clocks stopped rising around 2005,
   near 4 GHz, is in the topic's words and has no source in the file. */
import TC from './tinychip.js';

/* ================= timing: pipeline registers and the clock period ================= */
/* The path through the logic, as the delay of each of twelve gates in ps, and the 40 ps every stage pays for its flip-flop. */
export const GATES = [28, 35, 22, 40, 30, 26, 45, 33, 24, 38, 29, 31];
export const OVERHEAD = 40;
/* Sign-off corners: how much slower (1.25) or faster (0.85) the gates are than typical. */
export const CORNERS = { fast: 0.85, typical: 1, slow: 1.25 };
export const PERIOD = { min: 100, max: 600, step: 5, start: 250 };   // the lab's clock-period slider, ps
export const MAX_CUTS = 6;                                           // the most registers a click could add
/* The stage delays when registers (cuts) sit after the gates whose indexes they hold. A cut after the last gate is no cut. */
export function stages(cuts = [], corner = 'typical') {
  const set = new Set(cuts), k = CORNERS[corner], st = []; let cur = 0;
  GATES.forEach((d, i) => { cur += d * k; if (set.has(i) && i < GATES.length - 1) { st.push(cur + OVERHEAD); cur = 0; } });
  st.push(cur + OVERHEAD);
  return st;
}
/* Where n registers go to make the slowest stage as short as it can be (all choices tried; the first best wins). */
export function balance(n) {
  let best = null;
  (function rec(start, ch) {
    if (ch.length === n) {
      const s = new Set(ch); let cur = 0, mx = 0;
      GATES.forEach((d, i) => { cur += d; if (s.has(i)) { mx = Math.max(mx, cur); cur = 0; } });
      mx = Math.max(mx, cur);
      if (!best || mx < best.mx) best = { mx, ch };
      return;
    }
    for (let i = start; i < GATES.length - 1; i++) rec(i + 1, ch.concat(i));
  })(0, []);
  return best.ch;
}
/* What the lab read out for a clock period (ps), a set of cuts and a corner: the stage delays, the slowest, the top
   clock (GHz), slack (period minus slowest, ps), the cycles a signal takes and the time (ns), and whether it meets timing. */
export function timing(period, cuts = [], corner = 'typical') {
  const st = stages(cuts, corner), mx = Math.max(...st);
  const cycles = st.length;
  return { period, stages: st, slowest: mx, fmaxGHz: 1000 / mx, clockGHz: 1000 / period, slack: period - mx, cycles, latencyNs: cycles * period / 1000, meets: period >= mx };
}
/* The fewest registers that meet timing at a period and corner (balanced as well as they can be), or null if none do. */
export function fewestCuts(period, corner = 'typical') {
  for (let n = 0; n < GATES.length; n++) { const cuts = balance(n); if (timing(period, cuts, corner).meets) return cuts; }
  return null;
}

/* ================= power: voltage, clock and leakage ================= */
const Vt = 0.3, K = 3 * 0.75 / Math.pow(0.45, 1.3), Cap = 45 / (0.15 * 0.5625 * 3);
export const VMAX = 1.1;                                              // the chip's limit, volts
export const POWER_INPUTS = { v: { min: 0.5, max: 1.1, step: 0.01, start: 0.75 }, f: { min: 0.5, max: 4.5, step: 0.05, start: 3 }, a: { min: 0.05, max: 0.5, step: 0.01, start: 0.15 } };
/* the highest clock (GHz) a voltage allows, leakage (W) at a voltage, and the lowest voltage (not under 0.5 V) for a clock */
export const fmax = V => V <= Vt ? 0 : K * Math.pow(V - Vt, 1.3) / V;
export const leak = V => 6 * (V / 0.75) * Math.exp((V - 0.75) / 0.25);
export function vmin(f) { let lo = 0.31, hi = 1.6; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fmax(m) >= f) hi = m; else lo = m; } return Math.max(0.5, hi); }
/* Power at activity a, voltage v and clock f (GHz): dynamic and leakage and total (W), energy per cycle (nJ), whether
   the clock is reachable at that voltage, and its status id: 'runs', 'fails' (needs vmin) or 'beyond' (needs over 1.1 V). */
export function power(a, v, f) {
  const dyn = a * Cap * v * v * f, lk = leak(v), total = dyn + lk, ok = f <= fmax(v) + 1e-9, need = vmin(f);
  return { dyn, leak: lk, total, energyNJ: total / f, ok, fmaxAtV: fmax(v), need, status: ok ? 'runs' : need > VMAX ? 'beyond' : 'fails' };
}
/* What the button "Use the lowest safe voltage" set: vmin rounded up to 0.01 V, at most 1.1 V. */
export const lowestSafe = f => Math.min(VMAX, Math.ceil(vmin(f) * 100) / 100);
/* The curve the lab drew: total power at the lowest voltage each clock needs, from 0.5 GHz to the fastest at 1.1 V. */
export function frontier(a, step = 0.02) {
  const top = fmax(VMAX), pts = [];
  for (let x = 0.5; x <= top; x += step) pts.push({ f: x, v: vmin(x), w: a * Cap * vmin(x) ** 2 * x + leak(vmin(x)) });
  return pts;
}

/* ================= pipeline: five stages, stalls, forwarding, reordering ================= */
/* The program: code (as an assembler would print it), d: the register it writes (0: none), s: registers it reads, ld: a load. */
const PROGRAM = [
  { t: 'lw   x1, 0(x10)', d: 1, s: [10], ld: 1 }, { t: 'add  x2, x1, x3', d: 2, s: [1, 3] }, { t: 'sub  x4, x2, x5', d: 4, s: [2, 5] },
  { t: 'addi x6, x6, 1', d: 6, s: [6] }, { t: 'and  x7, x4, x6', d: 7, s: [4, 6] }, { t: 'sw   x7, 8(x10)', d: 0, s: [7, 10] }
];
export const REORDERED = [0, 3, 1, 2, 4, 5];       // what the compiler does: an independent instruction fills the gap a load leaves
/* Schedule the program. Options: forwarding (a result goes straight to the next instruction), reorder. Returns
   rows [{ index (in PROGRAM), code, IF, ID, EX, MEM, WB }] (cycle numbers, from 1), reasons [{ id: 'load' | 'forward' |
   'nofwd', ins (mnemonic), reg, from (mnemonic), cycles }] for each stall, cycles (the last write-back), stalls (stall cycles
   in all), cpi ((cycles - 4) / instructions), ideal (instructions + 4). */
export function schedule({ forwarding = false, reorder = false } = {}) {
  const ord = reorder ? REORDERED : PROGRAM.map((_, i) => i), prog = ord.map(i => PROGRAM[i]), res = [], reasons = [];
  prog.forEach((ins, k) => {
    const IF = k ? res[k - 1].IF + 1 : 1, ID = k ? Math.max(IF + 1, res[k - 1].EX) : 2;
    let EX = Math.max(ID + 1, k ? res[k - 1].EX + 1 : 0);
    for (const r of ins.s) {
      let p = -1; for (let j = k - 1; j >= 0; j--) if (prog[j].d === r) { p = j; break; }
      if (p < 0) continue;
      const pr = res[p], pi = prog[p], need = forwarding ? (pi.ld ? pr.MEM + 1 : pr.EX + 1) : pr.WB + 1;
      if (need > ID + 1) reasons.push({ id: forwarding ? (pi.ld ? 'load' : 'forward') : 'nofwd', ins: ins.t.split(' ')[0], reg: r, from: pi.t.split(' ')[0], cycles: need - ID - 1 });
      EX = Math.max(EX, need);
    }
    res.push({ IF, ID, EX, MEM: EX + 1, WB: EX + 2 });
  });
  const rows = res.map((r, k) => ({ index: ord[k], code: prog[k].t, ...r }));
  const cycles = res[res.length - 1].WB, stalls = res.reduce((a, r) => a + (r.EX - r.ID - 1), 0);
  return { rows, reasons, cycles, stalls, cpi: (cycles - 4) / prog.length, ideal: prog.length + 4 };
}

/* ================= gates that remember (the gate simulator of the clock lab) ================= */
/* An event-driven gate simulator: every gate has a delay, a change at a gate's input schedules a change at its output
   that much later, and wires may feed back into themselves, which is what lets a pair of gates hold a bit. Values are
   0, 1 or 'x' (unknown, as at power-on). Gate delays come from the tiny-chip studio's cell library and process
   (src/engines/tinychip.js), so a counter here is as fast as the same gates there. */
class Circ {
  constructor() { this.gates = []; this.ins = []; this.fan = {}; }
  input(...names) { names.forEach(n => { if (!this.ins.includes(n)) this.ins.push(n); }); return this; }
  /* type: NOT, BUF, AND, OR, NAND, NOR, XOR; d: delay in ps */
  g(type, ins, out, d) { const k = this.gates.length; this.gates.push({ type, ins, out, d }); ins.forEach(n => { (this.fan[n] = this.fan[n] || []).push(k); }); return out; }
  nets() { const s = new Set(this.ins); this.gates.forEach(g => { s.add(g.out); g.ins.forEach(n => s.add(n)); }); return [...s]; }
}
function evalGate(type, x) {
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

/* stim: { net: [[t, v], ...] } input changes; init: { net: v } values at power-on (the rest are 'x').
   Returns waves: { net: [[t, v], ...] } (each starts at t = 0), and at(net, t). */
export function simulate(C, { stim = {}, init = {}, tEnd = 1000, maxEvents = 200000 } = {}) {
  const val = {}, waves = {};
  C.nets().forEach(n => { val[n] = init[n] !== undefined ? init[n] : 'x'; waves[n] = [[0, val[n]]]; });
  /* a small binary heap of [t, seq, net, v] */
  const H = []; let seq = 0;
  const lt = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  const push = e => { H.push(e); let i = H.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (lt(H[p], H[i])) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && lt(H[l], H[m])) m = l; if (r < H.length && lt(H[r], H[m])) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
  /* inputs at time 0 apply at once; later changes are events */
  for (const n in stim) for (const [t, v] of stim[n]) { if (t <= 0) val[n] = v; else push([t, seq++, n, v]); }
  /* power-on: the gates whose outputs were not given settle from the inputs and the given state (the given state is
     what a latch holds), then any gate that disagrees changes after its delay */
  for (let pass = 0; pass < C.gates.length; pass++) { let changed = false; C.gates.forEach(g => { if (init[g.out] !== undefined) return; const v = evalGate(g.type, g.ins.map(n => val[n])); if (v !== val[g.out]) { val[g.out] = v; changed = true; } }); if (!changed) break; }
  C.nets().forEach(n => { waves[n] = [[0, val[n]]]; });
  C.gates.forEach(g => { const v = evalGate(g.type, g.ins.map(n => val[n])); if (v !== val[g.out]) push([g.d, seq++, g.out, v]); });
  let count = 0, stopped = false;
  while (H.length) {
    const [t, , n, v] = pop(); if (t > tEnd) break;
    if (++count > maxEvents) { stopped = true; break; }
    if (val[n] === v) continue;
    val[n] = v; waves[n].push([t, v]);
    for (const k of C.fan[n] || []) { const g = C.gates[k], o = evalGate(g.type, g.ins.map(m => val[m])); push([t + g.d, seq++, g.out, o]); }
  }
  const at = (n, t) => { const w = waves[n]; let v = w[0][1]; for (const [tt, vv] of w) { if (tt > t) break; v = vv; } return v; };
  return { waves, at, tEnd, stopped };
}

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
/* A flip-flop from two latches: the first listens while the clock is 0, the second copies it while the clock is 1, so Q
   changes only just after the clock rises. */
function dffIn(C, D, d, clk, p) {
  C.g('NOT', [clk], p + 'ck', D.NOT);
  const m = dLatchIn(C, D, d, p + 'ck', p + 'm');
  return dLatchIn(C, D, m, clk, p + 'l');
}
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
/* A counter: a register of flip-flops whose outputs go through an incrementer (a chain of half adders) and back into
   their inputs. Each tick of the clock stores the next number. Bit i is net 'b' + i + 'lq'. */
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
/* The timing a flip-flop needs and the counter's slowest path, in ps (named gateTiming: timing() above is the
   pipeline's). */
export function gateTiming(bits = 4, node = '130') {
  const D = delays(node);
  const clkToQ = D.AND + 2 * D.NOR;                      // clock rises -> slave's AND -> both NORs
  const setup = D.NOT + D.AND + 2 * D.NOR;               // D must pass the master's inverter, AND and loop
  const steps = bits <= 1 ? [['NOT', D.NOT]] : bits === 2 ? [['XOR', D.XOR]] : [...Array(bits - 2).fill(['AND', D.AND]), ['XOR', D.XOR]];
  const logic = steps.reduce((s, x) => s + x[1], 0), period = clkToQ + logic + setup;
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

/* ================= the clock lab: what the three experiments read out ================= */
export const COUNTER_NODES = ['180', '130', '28', '3'];
/* the speed slider, 0..100, to a clock in Hz: from 30% of the predicted top speed to 2 x it, on a log scale */
export const hzOfSlider = (node, v, bits = 4) => gateTiming(bits, node).fmaxHz * 0.3 * Math.pow(2 / 0.3, v / 100);
export const COUNTER_START = { node: '130', slider: 35 };

/* The latch lab: S and R as histories [[ps, 0|1]]; at time `now`, its state id: 'unknown' (Q not yet set), 'oscillating'
   (both released at once and Q keeps flipping: 4 or more changes in the last 1500 ps), 'written' (S or R is on),
   'holds0' or 'holds1'. Returns { state, q, qn, sim }. */
export function latchRun(hist, now) {
  const C = srLatch(), sim = simulate(C, { stim: hist, init: {}, tEnd: now });
  const cur = n => { let v = 0; for (const [t, x] of hist[n]) { if (t > now) break; v = x; } return v; };
  const q = sim.at('Q', now), qn = sim.at('Qn', now), sv = cur('S'), rv = cur('R');
  const recent = sim.waves.Q.filter(([t]) => t > now - 1500).length;
  const osc = sv === 0 && rv === 0 && recent >= 4;
  const state = osc ? 'oscillating' : q === 'x' ? 'unknown' : sv || rv ? 'written' : 'holds' + q;
  return { state, q, qn, sv, rv, osc, sim };
}
/* the hint the lab showed: an id ('clock.hint.latch.<id>') */
export function latchHint(hist, now) {
  const r = latchRun(hist, now), usedS = hist.S.length > 1, usedR = hist.R.length > 1;
  return r.osc ? 'oscillate' : r.sv && r.rv ? 'both' : r.sv ? 'setting' : r.rv ? 'resetting' : r.q === 'x' ? 'unknown' : usedS && usedR ? 'memory' : r.q === 1 ? 'holds1' : 'holds0';
}

/* The flip-flop lab: 16 slots of 600 ps, D on or off in each; the clock rises every 4 slots (slot 2, 6, 10, 14) and stays
   up for two slots. Returns the simulation, how often each Q changed, and the goals the lab offered. */
const FLOP = { slot: 600, slots: 16, per: 4 };
export function flopRun(D) {
  const { slot: SLOT, slots: N, per: PER } = FLOP, C = latchAndFlop(), init = zeroState(C);
  const edges = Array.from({ length: N / PER }, (_, k) => (k * PER + 2) * SLOT);
  const clk = [[0, 0]]; edges.forEach(e => { clk.push([e, 1]); clk.push([e + 2 * SLOT, 0]); });
  const stim = { CLK: clk, D: [[0, D[0]]] }; for (let k = 1; k < N; k++) if (D[k] !== D[k - 1]) stim.D.push([k * SLOT, D[k]]);
  const S = simulate(C, { stim, init, tEnd: N * SLOT + 400 });
  const changes = w => w.slice(1).filter(([t, v], i) => v !== 'x' && w[i][1] !== 'x' && v !== w[i][1]).length;
  const end = N * SLOT + 390, ones = D.filter(Boolean).length;
  return { sim: S, edges, latchChanges: changes(S.waves.aq), flopChanges: changes(S.waves.flq), ones, flopEver: S.waves.flq.some(([, v]) => v === 1), latchEnd: S.at('aq', end), flopEnd: S.at('flq', end) };
}
export const FLOP_GOALS = {
  one: (D, r = flopRun(D)) => r.ones === 1 && r.flopEver,            // the flip-flop stores a 1 although D was 1 for only one slot
  differ: (D, r = flopRun(D)) => r.latchEnd !== r.flopEnd,           // the latch and the flip-flop end with different values
  free: () => null                                                    // free play: nothing to meet
};
/* the hint the lab showed for a goal: an id ('clock.hint.flop.<id>') */
export function flopHint(goal, D, r = flopRun(D)) {
  const ok = FLOP_GOALS[goal](D, r);
  if (goal === 'one') {
    const k = D.indexOf(1);
    return r.ones === 0 ? 'none' : r.ones > 1 ? 'many' : ok ? 'one-done' : k % FLOP.per === 2 ? 'late' : 'before';
  }
  if (goal === 'differ') return ok ? 'differ-done' : 'differ';
  return 'free';
}

/* The counter lab: the status after a run at frequency hz at a process: 'errors', 'top' (no error, and from 90% to the
   whole predicted top speed), 'above' (right above the predicted limit, still counting) or 'counting'. */
export function counterStatus(node, hz) {
  const TM = gateTiming(4, node), R = runCounter({ node, hz, cycles: 20 }), r = hz / TM.fmaxHz;
  const top = !R.errors && r >= 0.9 && r <= 1.0001;
  return { status: R.errors ? 'errors' : top ? 'top' : r > 1 ? 'above' : 'counting', errors: R.errors, ratio: r, top, run: R, timing: TM };
}

/* ================= the challenges ================= */
/* Each has an id and a check. What each takes:
   slowCorner: { period, corner, cuts } (the registers' places);  halfPower: { a, v, f };  zeroStalls: { forwarding, reorder };
   latch: { S: [[ps, 0|1]], R: [[ps, 0|1]] } as left in the lab, the end time in ps (or checked from the stored history);
   oneSlot: D, an array of 16 zeros and ones;  differ: the same;  speedLimit: [{ node, hz }, ...] (runs the person made). */
export const CHALLENGES = {
  /* (design, 'Pass the slow corner'): at 4 GHz (250 ps), the fewest registers that pass at the slow corner: two (3 cycles) */
  slowCorner: { id: 'slowCorner', check: ({ period, corner, cuts }) => period === 250 && corner === 'slow' && timing(period, cuts, corner).meets && cuts.filter(i => i < GATES.length - 1).length === fewestCuts(250, 'slow').length },
  /* (design, 'Half the power'): start at 3 GHz and 0.75 V (about 51 W); the fastest clock that runs on under half: 2.2 GHz or more, under 25.5 W, at 15% activity */
  halfPower: { id: 'halfPower', check: ({ a, v, f }) => { const p = power(a, v, f); return Math.abs(a - 0.15) < 1e-9 && p.ok && f >= 2.2 && p.total < 25.5; } },
  /* (architecture, 'Zero stalls'): forwarding and reordering both on, and no stall cycle left */
  zeroStalls: { id: 'zeroStalls', check: ({ forwarding, reorder }) => !!forwarding && !!reorder && schedule({ forwarding, reorder }).stalls === 0 },
  /* (clock, 'One bit of memory'): a 1 stored and held (Q steady for 200 ps with S and R off) after S let go, and the latch driven to oscillate by releasing S and R together. Checked from the histories, every 100 ps up to the end. */
  latch: { id: 'latch', check: ({ hist, end }) => { let held = false, osc = false; const usedS = () => hist.S.some(([t, v]) => v === 1); for (let t = 100; t <= end; t += 100) { const r = latchRun(hist, t); if (r.state === 'holds1' && usedS() && !r.sim.waves.Q.some(([tt]) => tt > t - 200 && tt <= t)) held = true; if (r.state === 'oscillating') osc = true; } return held && osc; } },
  /* (clock, 'One slot is enough'): the flip-flop stores a 1 with D at 1 in only one slot */
  oneSlot: { id: 'oneSlot', check: D => !!FLOP_GOALS.one(D) },
  /* (clock lab's second goal, 'Different endings') */
  differ: { id: 'differ', check: D => !!FLOP_GOALS.differ(D) },
  /* (clock, 'Find the speed limit'): top speed with no wrong count at two different processes */
  speedLimit: { id: 'speedLimit', check: runs => new Set(runs.filter(r => counterStatus(r.node, r.hz).top).map(r => r.node)).size >= 2 }
};

