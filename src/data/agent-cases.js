/* Design alongside an AI agent: eight cases in which an agent proposes a design, a program or a
   claim. Some proposals are right and some contain the kind of mistake real agents make. You
   check them with the same engines the rest of the lab uses, then decide whether to trust them.
   Pure data and checks, no DOM: tests/agent.test.mjs proves every flaw is real and every sound
   proposal really works. */
import TC from '../engines/tinychip.js';
import RV from '../engines/riscv.js';

/* The human skills each case exercises. */
export const SKILLS = {
  spec: ['Writing the spec', 'Saying exactly what you want, including the corner cases.'],
  verify: ['Verifying', 'Testing every case that matters, not only the ones that come to mind.'],
  physics: ['Physical sense', 'Knowing roughly what the right answer should look like: units, sizes, limits.'],
  sources: ['Checking sources', 'Tracing a claim to a dated source instead of trusting a confident tone.'],
  judgment: ['Calibrated trust', 'Accepting good work quickly once it is checked, and rejecting bad work firmly.']
};

/* Check a tiny-chip design against a specification over every input. */
export function tinyCheck(code, ins, outs, f) {
  const D = TC.parse(code, ins, outs);
  if (D.errs.length) return { errs: D.errs, rows: [], bad: [] };
  const rows = TC.vectors(ins).map(v => { const got = TC.evalDesign(D, v), want = f(v); return { v, got, want, ok: outs.every(o => got[o] === want[o]) }; });
  return { errs: [], rows, bad: rows.filter(r => !r.ok) };
}

/* Run a RISC-V program with given memory contents; returns a0, steps and any fault. */
export function asmRun(src, words, at, extra) {
  const asm = RV.assemble(src, { ext: {}, syms: { A: 0x1000, N: 0x1100, P: 0x1000 } });
  if (asm.errs.length) return { errs: asm.errs };
  const m = RV.machine(asm.prog, mm => { words.forEach((w, i) => RV.st(mm, at + 4 * i, 4, w)); if (extra) extra(mm); });
  RV.run(m, asm.prog, 20000);
  return { a0: m.x[10], steps: m.steps, err: m.err };
}

/* Poisson yield: area in mm², defect density in defects per cm². */
export const poissonYield = (areaMm2, d0PerCm2) => Math.exp(-(areaMm2 / 100) * d0PerCm2);

/* One token of single-user decoding: time is set by whichever is slower, reading every weight
   from memory or doing about two operations per weight. */
export function decodeTime(paramsB, bytesPerParam, tbPerS, pflops) {
  const mem = paramsB * 1e9 * bytesPerParam / (tbPerS * 1e12);
  const math = 2 * paramsB * 1e9 / (pflops * 1e15);
  return { mem, math, t: Math.max(mem, math), bound: mem >= math ? 'memory' : 'compute' };
}

const SUM_ASM = 'li   t0, A        # t0 points at the first word\nli   t1, N\nlw   t1, 0(t1)    # t1 = how many words\nli   a0, 0\nloop:\n  lw   t2, 0(t0)\n  add  a0, a0, t2\n  addi t0, t0, 4\n  addi t1, t1, -1\n  bnez t1, loop\n';
const MUL_ASM = 'li   t0, P\nlw   a1, 0(t0)    # A\nlw   a2, 4(t0)    # B\nli   a0, 0\nloop:\n  beqz a2, done\n  andi t1, a2, 1\n  beqz t1, skip\n  add  a0, a0, a1\nskip:\n  slli a1, a1, 1\n  srli a2, a2, 1\n  j    loop\ndone:\n';

export const CASES = [
  {
    id: 'eq', area: 'Logic', t: 'A 2-bit equality checker', truth: 'flawed', skill: 'verify', topic: 'tiny',
    ask: 'Make a circuit that outputs eq = 1 when the 2-bit number a1 a0 equals b1 b0.',
    says: 'Done. Each XNOR checks whether one pair of bits matches, and the OR combines them. I checked 0 = 0 and 3 = 3: both give eq = 1.',
    art: { kind: 'tiny', code: 'm1 = ~(a1 ^ b1);   // bit 1 matches\nm0 = ~(a0 ^ b0);   // bit 0 matches\neq = m1 | m0;', ins: ['a1', 'a0', 'b1', 'b0'], outs: ['eq'], f: v => ({ eq: v.a1 === v.b1 && v.a0 === v.b0 ? 1 : 0 }) },
    reasons: ['It combines the two bit checks with OR, so one matching bit is enough: 1 and 3 count as equal', 'XNOR cannot compare bits', 'An equality checker needs a clock', 'Nothing: it is correct'], right: 0,
    why: 'The agent tested only cases where both bits match, so OR and AND give the same answer. Exhaustive verification finds 1 = 3 and 2 = 0 reported as equal. Fix: eq = m1 & m0. Two hand-picked tests prove very little.'
  },
  {
    id: 'maj', area: 'Logic', t: 'A smaller majority voter', truth: 'sound', skill: 'judgment', topic: 'tiny',
    ask: 'Make y = 1 when at least two of a, b and c are 1, with as few gates as you can.',
    says: 'y = (a & b) | (c & (a ^ b)). It reuses the carry logic of a full adder: if a and b agree, they decide; if they differ, c breaks the tie. Four gates.',
    art: { kind: 'tiny', code: 'y = (a & b) | (c & (a ^ b));', ins: ['a', 'b', 'c'], outs: ['y'], f: v => ({ y: v.a + v.b + v.c >= 2 ? 1 : 0 }) },
    reasons: ['It ignores c when a and b differ', 'XOR makes it slower than the textbook version', 'It is wrong when all three inputs are 1', 'Nothing: it is correct'], right: 3,
    why: 'This one is right: the carry-out of a full adder is exactly the majority function. Verification passes all 8 cases. Rejecting good work is a mistake too: once you have checked it, accept it and move on.'
  },
  {
    id: 'sum', area: 'Processor', t: 'Summing an array in RISC-V', truth: 'flawed', skill: 'spec', topic: 'riscv',
    ask: 'Write RISC-V code that puts the sum of the N words starting at address A into a0. N is stored at address N.',
    says: 'Here it is. I tested it with N = 4 and the sum was correct.',
    art: { kind: 'asm', code: SUM_ASM, data: [7, -2, 30, 5, 11, 4, 9, 1] },
    reasons: ['When N is 0 it still runs the loop once, then counts down past zero and never stops', 'The words are 4 bytes apart, so addi t0, t0, 4 skips data', 'lw cannot read from address A', 'Nothing: it is correct'], right: 0,
    why: 'The loop checks the count at the end, so it always runs at least once. With N = 0 the counter goes to −1, the loop keeps reading past the data and finally crashes. The request never said what N = 0 should do; a good specification names the empty case, and good tests try it.'
  },
  {
    id: 'mul', area: 'Processor', t: 'Multiplying without a multiplier', truth: 'sound', skill: 'judgment', topic: 'riscv',
    ask: 'On RV32I, with no multiply instruction, put A × B into a0. A and B (0 to 1,000) are at P and P + 4.',
    says: 'Shift-and-add: for each bit of B, add A if the bit is 1, then double A and halve B. At most 10 turns of the loop for B up to 1,000.',
    art: { kind: 'asm2', code: MUL_ASM },
    reasons: ['It fails when B is 0', 'It overflows for 1,000 × 1,000', 'It should use repeated addition instead', 'Nothing: it is correct'], right: 3,
    why: 'Correct, including B = 0 and 1,000 × 1,000 (a million fits easily in 32 bits). It is the same algorithm hardware multipliers use. Try a few inputs, then trust it.'
  },
  {
    id: 'yield', area: 'Manufacturing', t: 'Can we make a big GPU die?', truth: 'flawed', skill: 'physics', topic: 'yield',
    ask: 'Estimate the yield of an 800 mm² die at a defect density of 0.1 defects per cm².',
    says: 'With the Poisson model, yield = e^(−A × D0) = e^(−800 × 0.1) = e^(−80) ≈ 0%. A die this size cannot be made; we should split it into chiplets.',
    art: { kind: 'yield', area: 800, d0: 0.1 },
    reasons: ['It multiplied mm² by defects per cm²: 800 mm² is 8 cm², so the yield is about 45%', 'The Poisson model does not apply to GPUs', 'Defect density is counted per wafer, not per area', 'Nothing: dies this big really cannot be made'], right: 0,
    why: 'A unit slip: 800 mm² is 8 cm², so yield = e^(−0.8) ≈ 45%. Physical sense would have caught it: real GPUs of about 800 mm² ship by the million. The conclusion (chiplets help) can still be right, but not for this reason.'
  },
  {
    id: 'roof', area: 'AI computing', t: 'Twice the compute, twice the speed?', truth: 'flawed', skill: 'physics', topic: 'compute',
    ask: 'Our chatbot answers one user at a time and feels slow. A new chip has twice the compute (FLOPS) and the same memory bandwidth. Will answers come twice as fast?',
    says: 'Yes. Tokens per second scale with FLOPS, so doubling compute doubles the speed.',
    art: { kind: 'roof', params: 70, bytes: 1, bw: 8, pf: 4.5 },
    reasons: ['With one user, every token waits for all the weights to be read from memory, so extra compute barely helps', 'FLOPS do not matter for AI at all', 'It would be four times faster', 'Nothing: it is correct'], right: 0,
    why: 'Single-user decoding is memory-bound: each token reads every weight once and does only two operations per weight. For a 70B model in FP8, reading weights takes about 8.8 ms per token and the math about 0.03 ms. Doubling compute changes almost nothing; more memory bandwidth or batching more users would.'
  },
  {
    id: 'fact', area: 'Industry', t: 'A confident date', truth: 'flawed', skill: 'sources', topic: 'future',
    ask: 'When does TSMC\'s A14 process enter volume production? Give a source.',
    says: 'TSMC\'s A14 entered volume production in January 2026, according to a TSMC press release from that month.',
    art: { kind: 'fact', fact: 'tsmc-a14', query: 'A14' },
    reasons: ['The date is wrong and the source looks made up: A14 is planned for 2028', 'A14 is an Intel process, not TSMC\'s', 'TSMC has no plans below 2 nm', 'Nothing: it is correct'], right: 0,
    why: 'The lab\'s dated facts say A14 is planned for 2028 (TSMC\'s N2 only reached volume in late 2025). Agents can produce fluent, specific and wrong answers, sometimes with sources that do not exist. Check the claim against a dated source you can open.'
  },
  {
    id: 'cov', area: 'Verification', t: '"Fully verified"', truth: 'flawed', skill: 'verify', topic: 'design',
    ask: 'Verify my 3-input majority voter and tell me whether it is ready to tape out.',
    says: 'I ran four test patterns: 000 → 0, 111 → 1, 110 → 1 and 011 → 1. All pass. Fully verified and ready for tape-out.',
    art: { kind: 'cov', code: 'y = (a & b) | (b & c);', ins: ['a', 'b', 'c'], outs: ['y'], f: v => ({ y: v.a + v.b + v.c >= 2 ? 1 : 0 }), tested: ['000', '111', '110', '011'] },
    reasons: ['Four of eight patterns is not full verification, and the untested 101 fails', 'The tests are fine and the design is correct', 'Majority voters need a clock to verify', 'It tested too many patterns'], right: 0,
    why: 'Half the input space was never tested, and the missing a = 1, b = 0, c = 1 case is exactly the bug: the design forgot (a & c). "All tests pass" means nothing until you know what the tests cover. That is why verification teams track coverage.'
  }
];

/* How a decision scores: the right call, and for a flawed proposal the right reason. */
export function score(c, decision, reason) {
  const rightCall = (decision === 'trust') === (c.truth === 'sound');
  const rightReason = c.truth === 'flawed' ? decision === 'reject' && reason === c.right : rightCall;
  return { rightCall, rightReason, points: (rightCall ? 1 : 0) + (rightCall && rightReason && c.truth === 'flawed' ? 1 : 0) };
}

/* A project's description without the puzzle hints meant for people ("the sum line has a bug"). */
export const specText = p => p.d.split(/(?<=\.)\s+/).filter(s => !/bug|starting code|starter|finish|is done|are done|let synthesis help/i.test(s)).join(' ');

/* The prompt for a live agent (inside Claude only): write a tiny-chip design for a spec. */
export function livePrompt(p) {
  const rows = TC.vectors(p.ins).map(v => { const o = p.f(v); return p.ins.map(n => n + '=' + v[n]).join(' ') + ' → ' + p.outs.map(n => n + '=' + o[n]).join(' '); }).join('\n');
  return 'You are a chip design agent. Write combinational logic in this tiny hardware language: one assignment per line, "name = expression;", using only & (AND), | (OR), ^ (XOR), ~ (NOT), parentheses, the constants 0 and 1, the inputs, and new wire names you define. Every output must be assigned. No clocks, no other syntax.\n\n' +
    'Inputs: ' + p.ins.join(', ') + '\nOutputs: ' + p.outs.join(', ') + '\nSpecification (' + p.t + '): ' + specText(p) + '\nTruth table:\n' + rows + '\n\n' +
    'Reply with the design inside a ``` code block, then one short sentence saying why it works. Keep it small.';
}
/* Pull the design out of a model reply: the first code block, or else the assignment lines. */
export function extractCode(text) {
  const m = /```[a-z]*\n?([\s\S]*?)```/.exec(String(text || ''));
  if (m) return m[1].trim();
  return String(text || '').split('\n').filter(l => /^\s*[A-Za-z_]\w*\s*=/.test(l)).join('\n');
}
