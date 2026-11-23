/* The program nobody can judge (the halt engine): the core question "Beyond computation", in two depths. Pure logic,
   no DOM, no words (ids only; the words are halt.* in src/i18n/en/labs.json); tests in tests/halt.test.mjs.

   Stage 1, anything can compute. One gate, NAND (the output is off only when both inputs are on), built from
   dominoes, water in pipes or light through shutters: the same two choices make it in all three (how the two inputs
   are joined, and whether the output follows what comes through or is on unless something comes through). Two NANDs,
   each feeding the other, make a bit that remembers (a set-reset latch); many make any circuit. So a computer is a
   pattern, not a material. The pictures are teaching models of the pattern, not working machines of each material.

   Stage 2, the program nobody can judge. An agent claims it can tell whether any program stops. Its method: run the
   program for a budget of steps; if it has stopped by then, say "stops", if not, guess "never stops". The learner
   builds programs from four blocks (count, loop forever, stop, and ask the agent about this very program and do the
   opposite), and they run on the lab's RISC-V core (src/engines/riscv.js, used as it is: halt.js steps it, and answers
   the one ecall the ask block makes, itself). Turing's argument (On computable numbers, 1936,
   https://doi.org/10.1112/plms/s2-42.1.230): whatever the agent's method, the program that asks it about itself and
   does the opposite proves it wrong.

   The ask, exactly: to answer, the agent must run this very program, which begins by asking the agent again, so the
   agent's answer can never come within its own budget. It spends its whole budget and says "never stops"; the ask
   costs the program that many steps. In the agent's own run the ask therefore always runs past the budget.
   What really happens is exact too: a program of these blocks either stops, or reaches "loop forever" (a jump to
   itself with no way out, which halt.js recognises), so nothing is left to a guess. */
import RV from './riscv.js';

/* ---- stage 1: one gate from any material, and a bit that remembers ---- */
export const MEDIA = ['domino', 'water', 'light'];
/* how the two inputs are joined: one after the other (both are needed for anything to get through), or side by side
   (either is enough); and the output: it follows what gets through, or it is on unless something gets through */
export const JOINS = ['series', 'parallel'];
export const OUTS = ['follow', 'invert'];
export const INPUTS = [[0, 0], [0, 1], [1, 0], [1, 1]];
export const gate = (join, out) => (a, b) => { const through = join === 'series' ? a & b : a | b; return out === 'invert' ? 1 - through : through; };
export const nand = (a, b) => 1 - (a & b);
/* the four rows of a build: the inputs, what it gives, what a NAND gives */
export const table = (join, out) => INPUTS.map(([a, b]) => ({ a, b, got: gate(join, out)(a, b), want: nand(a, b) }));
export const isNand = (join, out) => table(join, out).every(r => r.got === r.want);
/* what the build is, by its table */
export const nameOf = (join, out) => ({ 'series.follow': 'and', 'parallel.follow': 'or', 'series.invert': 'nand', 'parallel.invert': 'nor' })[join + '.' + out];

/* Two NANDs, each one's output fed to the other's input: a set-reset latch. The buttons are pushes: pushing Set holds
   the first gate's other input at 0 for a moment, pushing Reset the second's. fed: whether the outputs are fed back
   (without it each gate's free input is held at 1, and each gate only answers its push). The latch settles in a few
   rounds; q is what it holds after the push is let go. */
export function settle(q, set, reset, fed) {
  let Q = q, NQ = 1 - q;
  for (let k = 0; k < 6; k++) { const nQ = nand(1 - set, fed ? NQ : 1), nNQ = nand(1 - reset, fed ? nQ : 1); if (nQ === Q && nNQ === NQ) break; Q = nQ; NQ = nNQ; }
  return { q: Q, nq: NQ };
}
/* a push of Set or Reset, then let go: what the bit shows while pushed, and what it holds after */
export function push(q, which, fed) {
  const during = settle(q, which === 'set' ? 1 : 0, which === 'reset' ? 1 : 0, fed);
  const after = settle(during.q, 0, 0, fed);
  return { during: during.q, after: after.q };
}
/* the bit remembers when, fed back, a Set holds a 1 after it is let go and a Reset holds a 0 */
export const remembers = seen => !!(seen && seen.set && seen.reset);
/* how many NANDs make each of the others (the usual smallest counts) */
export const FROM_NAND = [['not', 1], ['and', 2], ['or', 3], ['xor', 4], ['full', 9]];

/* ---- stage 2: the program nobody can judge ---- */
export const BLOCKS = ['count', 'loop', 'stop', 'ask'];
export const COUNTS = [10, 100, 1000, 10000, 100000];
export const BUDGETS = [100, 1000, 10000, 100000];
export const MAX_BLOCKS = 4;
const ASK = 1;   /* a7 = 1: the ecall that asks the agent */

/* a program: a list of blocks, { b: 'count', n } or { b: 'loop' | 'stop' | 'ask' }. Kept to what the blocks allow */
export function normal(prog) {
  return (Array.isArray(prog) ? prog : []).filter(x => x && BLOCKS.includes(x.b)).slice(0, MAX_BLOCKS)
    .map(x => (x.b === 'count' ? { b: 'count', n: COUNTS.includes(x.n) ? x.n : COUNTS[1] } : { b: x.b }));
}

/* the program as RISC-V assembly for the core, with the block each line belongs to (lines[i] = block index) */
export function toAsm(prog) {
  const out = [], lines = [];
  const put = (k, s) => { out.push(s); lines.push(k); };
  normal(prog).forEach((x, k) => {
    if (x.b === 'count') { put(k, 'li a0, 0'); put(k, 'li t1, ' + x.n); put(k, 'c' + k + ': addi a0, a0, 1'); put(k, 'blt a0, t1, c' + k); }
    else if (x.b === 'loop') put(k, 'f' + k + ': j f' + k);
    else if (x.b === 'stop') put(k, 'ebreak');
    else { put(k, 'li a7, ' + ASK); put(k, 'ecall'); put(k, 'bnez a0, f' + k); put(k, 'ebreak'); put(k, 'f' + k + ': j f' + k); }
  });
  return { src: out.join('\n'), lines };
}
export function assemble(prog) {
  const { src, lines } = toAsm(prog), A = RV.assemble(src);
  return { src, lines, prog: A.prog, errs: A.errs };
}

/* steps a program on the core until it stops, reaches a loop with no way out, or uses `limit` steps.
   ask(m) answers the ask block: { v: 1 stops / 0 never, cost } or null when the answer cannot come within the limit.
   sample: keep a few states along the way, for the picture */
function exec(A, limit, ask, sample) {
  const m = RV.machine(A.prog, null, {}), samples = [];
  let next = 1, out = null;
  const keep = force => { if (!sample) return; if (force || m.steps >= next) { const e = A.prog[m.pc >> 2]; samples.push({ steps: m.steps, line: e ? e.l - 1 : -1, op: e ? e.op : null, a0: m.x[10] }); while (next <= m.steps) next = Math.max(next + 1, Math.ceil(next * 1.25)); } };
  keep(true);
  while (!out) {
    const e = A.prog[m.pc >> 2];
    if (m.halted || !e) { out = 'stopped'; break; }
    if (e.op === 'jal' && e.rd === 0 && e.imm === 0) { out = 'loop'; break; }
    if (m.steps >= limit) { out = 'limit'; break; }
    if (e.op === 'ecall' && m.x[17] === ASK) {
      const r = ask(m, limit);
      if (!r) { m.steps = limit; out = 'limit'; break; }
      m.x[10] = r.v; m.steps += r.cost; m.cycles += r.cost; m.pc += 4; keep(); continue;
    }
    if (e.op === 'ebreak' || e.op === 'ecall') { m.steps++; m.halted = true; out = 'stopped'; break; }
    RV.step(m, A.prog); keep();
  }
  keep(true);
  return { end: out, steps: m.steps, a0: m.x[10], samples };
}

/* The agent: runs the program for `budget` steps. An ask inside costs the agent its whole budget (see above), so in
   its own run the ask never fits. verdict: 'stops' if the program stopped within the budget, else 'never' (a guess
   when it simply ran out; a sure answer only when it saw a loop with no way out, which it does not look for) */
export function agent(prog, budget) {
  const A = assemble(prog);
  const r = exec(A, budget, (m, limit) => (m.steps + budget > limit ? null : { v: 0, cost: budget }), false);
  const stopped = r.end === 'stopped';
  return { verdict: stopped ? 'stops' : 'never', steps: stopped ? r.steps : budget, ranOut: !stopped };
}

/* what really happens: the program run to its end, the asks answered by the agent with this budget */
export function truth(prog, budget) {
  const A = assemble(prog), says = agent(prog, budget);
  const r = exec(A, Infinity, () => ({ v: says.verdict === 'stops' ? 1 : 0, cost: budget }), true);
  return { stops: r.end === 'stopped', steps: r.steps, a0: r.a0, samples: r.samples, lines: A.lines, src: A.src };
}

/* one run: the agent's verdict, what really happened, and whether the agent was fooled */
export function judge(prog, budget) {
  const P = normal(prog), says = agent(P, budget), real = truth(P, budget);
  const fooled = (says.verdict === 'stops') !== real.stops;
  return { prog: P, budget, says, real, fooled, asks: P.some(x => x.b === 'ask') };
}

/* The goals, in order. fool: fooled by a program that runs longer than the budget and then stops (no ask); more: the
   same again with a larger budget than the first fooling; self: the program that asks about itself and does the
   opposite fools the agent at every budget. tried: what the learner has met so far, { fool: budget, more, self } */
export const GOALS = ['fool', 'more', 'self'];
export const everyBudget = prog => BUDGETS.map(b => ({ budget: b, fooled: judge(prog, b).fooled }));
export function after(tried, run) {
  const t = Object.assign({ fool: null, more: false, self: false }, tried || {});
  if (run.fooled && run.real.stops && !run.asks) {
    if (t.fool == null) t.fool = run.budget;
    else if (run.budget > t.fool) t.more = true;
  }
  if (run.fooled && run.asks && everyBudget(run.prog).every(x => x.fooled)) t.self = true;
  return t;
}
export const met = tried => !!(tried && tried.fool != null && tried.more && tried.self);
