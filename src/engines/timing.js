/* Timing: will a design give its answers in time? Pure logic, no DOM; tests in tests/timing.test.mjs.

   A clocked chip works in ticks. At every tick the flip-flops (one-bit memories) launch new values, the gates
   between them work them out, and before the next tick every result must have arrived and stood still for a
   moment (the set-up time). So the longest chain of gates between two flip-flops decides how short a tick can
   be. Designers call the time left over the slack: positive, the design makes the clock; negative, it fails, and
   no check of its answers would ever show it.

   What it reads: the gates (cells) of a design from the tiny-chip engine (src/engines/tinychip.js), with each
   cell's delay from its small library, scaled for the process (NODE[...].dly) and plus a fixed wire delay per
   stage, as the tiny-chip engine itself counts them. A design without flip-flops is timed as real designs use
   such logic: between flip-flops that hold its inputs and catch its outputs. What it leaves out: delay that
   grows with a wire's real length after layout, a slow or a fast copy of the chip, heat, and the clock arriving
   at different flip-flops at slightly different times; real sign-off timing (static timing analysis, done in
   the open flow by OpenSTA) measures all of these for every corner of the process. */
import TC from './tinychip.js';

export const WIRE_PS = 10;            /* the tiny-chip engine's fixed wire delay per stage, at 130 nm (ps) */
export const DFF = 'DFF';
const scale = node => (TC.NODE[node] || TC.NODE['130']).dly;
const cellDelay = (type, node) => TC.LIB[type][2] * scale(node) + WIRE_PS * scale(node);

/* The longest chain through a netlist M (cells, inputs, outs, regs) at a process: the cells it passes, each with
   its delay, from where it starts (an input pin or a flip-flop) to where it ends (an output pin or a flip-flop's
   input). Returns { cells: [{ i, type, ps }], logic, start, end, from, to }: logic is the gates' time alone (ps). */
export function longestChain(M, node = '130') {
  const byOut = {}, regQ = {}, regD = {};
  M.cells.forEach((c, i) => { if (c.type !== DFF) byOut[c.out] = i; });
  (M.regs || []).forEach(r => { regQ[r.q] = r.name; regD[r.d] = r.name; });
  const memo = {};
  /* the latest arrival at net n, and the cell that brings it */
  const at = n => {
    if (n in memo) return memo[n];
    const i = byOut[n];
    if (i == null) return (memo[n] = { t: 0, via: null });   /* an input pin, a tie or a flip-flop's output */
    const c = M.cells[i]; let best = { t: -1, from: null };
    c.ins.forEach(x => { const a = at(x); if (a.t > best.t) best = { t: a.t, from: x }; });
    return (memo[n] = { t: Math.max(0, best.t) + cellDelay(c.type, node), via: i, from: best.from });
  };
  const ends = M.outs.map(o => ({ net: o.net, to: { pin: o.name } })).concat((M.regs || []).map(r => ({ net: r.d, to: { reg: r.name } })));
  let worst = null;
  ends.forEach(e => { const a = at(e.net); if (!worst || a.t > worst.t) worst = { t: a.t, net: e.net, to: e.to }; });
  if (!worst) return { cells: [], logic: 0, from: null, to: null };
  /* walk back along the chain */
  const cells = []; let n = worst.net, guard = 0;
  while (memo[n] && memo[n].via != null && guard++ < 1000) { const i = memo[n].via; cells.unshift({ i, type: M.cells[i].type, ps: cellDelay(M.cells[i].type, node) }); n = memo[n].from; }
  const inp = M.inputs.find(p => p.net === n);
  const from = regQ[n] != null ? { reg: regQ[n] } : inp ? { pin: inp.name } : { tie: true };
  return { cells, logic: worst.t, from, to: worst.to };
}

/* The time a tick must allow around the logic: the launching flip-flop's clock-to-output and the catching one's
   set-up time (ps). */
export const overhead = (node = '130') => (TC.LIB.DFF[2] + TC.SETUP) * scale(node);

/* Does a netlist make a clock? period in ps. Returns the chain, the time it needs from tick to tick (arrival),
   the slack (period - arrival: positive makes it), whether it meets the clock, and the fastest clock it could
   run at (MHz). */
export function timeNetlist(M, period, node = '130') {
  const chain = longestChain(M, node), arrival = chain.logic + overhead(node);
  return { chain, arrival, period, slack: period - arrival, meets: arrival <= period, fmax: 1e6 / arrival, node };
}

/* A design built by src/engines/design.js. The RISC-V core is timed as its adder: 32 slices in a row, the carry
   passing through every one (design.js works that out as the core's st.crit, flip-flops included). */
export function timeDesign(B, period, node = '130') {
  if (!B || !B.M) return null;
  if (B.p === 'core' && B.st) {
    const chain = longestChain(B.M, node), k = scale(node), arrival = B.st.crit * k;
    return { chain, arrival, period, slack: period - arrival, meets: arrival <= period, fmax: 1e6 / arrival, node, copies: 32 };
  }
  return timeNetlist(B.M, period, node);
}

/* The same chain copied n times in a row, each copy's carry feeding the next (an n-bit adder made of full adders):
   how the delay of one small piece grows into the delay of a real block. from/to: the carry's own pins. */
export function chained(B, n, from, to, period, node = '130') {
  if (!B || !B.M) return null;
  const one = TC.pathDelay(B.M, node, from, to); if (one == null) return null;
  const rest = Math.max(0, longestChain(B.M, node).logic - one), arrival = n * one + rest + overhead(node);
  return { one, n, arrival, period, slack: period - arrival, meets: arrival <= period, fmax: 1e6 / arrival, node };
}

/* Mhz <-> ps */
export const periodOf = mhz => 1e6 / mhz;
export const mhzOf = ps => 1e6 / ps;
