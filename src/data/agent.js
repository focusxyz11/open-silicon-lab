/* Verify the agent: eight cases in which an AI agent proposes a design, a program, an estimate or a claim. Some are
   right; some hold the kind of mistake real agents make (two hand-picked tests, a forgotten empty case, mm² taken for
   cm², FLOPS for speed, a confident date with a made-up source, "fully verified" after half the inputs). You check
   each with the lab's own engines (src/engines/tinychip.js, src/engines/riscv.js, the dated facts), then trust it or
   reject it for the right reason. Brought over from the first version of the site (the branch 'before',
   src/data/agent-cases.js and topics/agent); the words are agent.* in src/i18n/en.json. Pure data and checks, no DOM:
   tests/agent.test.mjs proves every flaw is real and every sound proposal really works. Played at the Lab, where AI
   joins the community through an open port (src/v2/play.js, kind 'agent'). */
import TC from '../engines/tinychip.js';
import RV from '../engines/riscv.js';

/* the human skills each case exercises */
export const SKILLS = ['spec', 'verify', 'physics', 'sources', 'judgment'];

/* a tiny-chip design against its job over every input */
export function tinyCheck(code, ins, outs, f) {
  const D = TC.parse(code, ins, outs);
  if (D.errs.length) return { errs: D.errs, rows: [], bad: [] };
  const rows = TC.vectors(ins).map(v => { const got = TC.evalDesign(D, v), want = f(v); return { v, got, want, ok: outs.every(o => got[o] === want[o]) }; });
  return { errs: [], rows, bad: rows.filter(r => !r.ok) };
}

/* a RISC-V program run with words in memory: a0, the steps it took and any fault */
export function asmRun(src, words, at, extra) {
  const asm = RV.assemble(src, { ext: {}, syms: { A: 0x1000, N: 0x1100, P: 0x1000 } });
  if (asm.errs.length) return { errs: asm.errs };
  const m = RV.machine(asm.prog, mm => { words.forEach((w, i) => RV.st(mm, at + 4 * i, 4, w)); if (extra) extra(mm); });
  RV.run(m, asm.prog, 20000);
  return { a0: m.x[10], steps: m.steps, err: m.err };
}
/* the array sum run with N words: what it gives against the true sum */
export function sumRun(code, data, n) {
  const r = asmRun(code, data, 0x1000, mm => RV.st(mm, 0x1100, 4, n));
  const want = data.slice(0, n).reduce((a, b) => a + b, 0);
  return { ...r, want, ok: !r.err && !r.errs && r.a0 === want };
}

/* Poisson yield: area in mm², defect density in defects per cm² */
export const poissonYield = (areaMm2, d0PerCm2) => Math.exp(-(areaMm2 / 100) * d0PerCm2);

/* one token of single-user decoding: whichever is slower, reading every weight or doing two operations per weight */
export function decodeTime(paramsB, bytesPerParam, tbPerS, pflops) {
  const mem = paramsB * 1e9 * bytesPerParam / (tbPerS * 1e12), math = 2 * paramsB * 1e9 / (pflops * 1e15);
  return { mem, math, t: Math.max(mem, math), bound: mem >= math ? 'memory' : 'compute' };
}

const SUM_ASM = 'li   t0, A        # t0 points at the first word\nli   t1, N\nlw   t1, 0(t1)    # t1 = how many words\nli   a0, 0\nloop:\n  lw   t2, 0(t0)\n  add  a0, a0, t2\n  addi t0, t0, 4\n  addi t1, t1, -1\n  bnez t1, loop\n';
const MUL_ASM = 'li   t0, P\nlw   a1, 0(t0)    # A\nlw   a2, 4(t0)    # B\nli   a0, 0\nloop:\n  beqz a2, done\n  andi t1, a2, 1\n  beqz t1, skip\n  add  a0, a0, a1\nskip:\n  slli a1, a1, 1\n  srli a2, a2, 1\n  j    loop\ndone:\n';


/* each case: the area it is from, whether the proposal is sound, the skill it asks for, where in the world it lives,
   the artifact the agent hands over (art.kind says which tool checks it), and which of four reasons is right
   (words: agent.case.<id>.t / .ask / .says / .why / .r0-.r3) */
export const CASES = [
  { id: 'eq', area: 'logic', truth: 'flawed', skill: 'verify', at: '#/bench/check', right: 0,
    art: { kind: 'tiny', code: 'm1 = ~(a1 ^ b1);   // bit 1 matches\nm0 = ~(a0 ^ b0);   // bit 0 matches\neq = m1 | m0;', ins: ['a1', 'a0', 'b1', 'b0'], outs: ['eq'], f: v => ({ eq: v.a1 === v.b1 && v.a0 === v.b0 ? 1 : 0 }), tested: ['0000', '1111'] } },
  { id: 'maj', area: 'logic', truth: 'sound', skill: 'judgment', at: '#/bench/check', right: 3,
    art: { kind: 'tiny', code: 'y = (a & b) | (c & (a ^ b));', ins: ['a', 'b', 'c'], outs: ['y'], f: v => ({ y: v.a + v.b + v.c >= 2 ? 1 : 0 }) } },
  { id: 'sum', area: 'processor', truth: 'flawed', skill: 'spec', at: '#/build', right: 0,
    art: { kind: 'asm', code: SUM_ASM, data: [7, -2, 30, 5, 11, 4, 9, 1], tried: 4 } },
  { id: 'mul', area: 'processor', truth: 'sound', skill: 'judgment', at: '#/build', right: 3,
    art: { kind: 'asm2', code: MUL_ASM, tried: [13, 11] } },
  { id: 'yield', area: 'making', truth: 'flawed', skill: 'physics', at: '#/do/cheaper', right: 0,
    art: { kind: 'yield', area: 800, d0: 0.1 } },
  { id: 'roof', area: 'ai', truth: 'flawed', skill: 'physics', at: '#/place/datacentre', right: 0,
    art: { kind: 'roof', params: 70, bytes: 1, bw: 8, pf: 4.5 } },
  { id: 'fact', area: 'industry', truth: 'flawed', skill: 'sources', at: null, right: 0,
    art: { kind: 'fact', fact: 'tsmc-a14' } },
  { id: 'cov', area: 'verify', truth: 'flawed', skill: 'verify', at: '#/bench/check', right: 0,
    art: { kind: 'cov', code: 'y = (a & b) | (b & c);', ins: ['a', 'b', 'c'], outs: ['y'], f: v => ({ y: v.a + v.b + v.c >= 2 ? 1 : 0 }), tested: ['000', '111', '110', '011'] } }
];
export const caseOf = id => CASES.find(c => c.id === id);

/* a decision: the right call, and for a flawed proposal the right reason too */
export function score(c, decision, reason) {
  const rightCall = (decision === 'trust') === (c.truth === 'sound');
  const rightReason = c.truth === 'flawed' ? decision === 'reject' && reason === c.right : rightCall;
  return { rightCall, rightReason, ok: rightCall && rightReason };
}
/* the challenge: every case judged right, the sound ones trusted and the flawed ones rejected for their real flaw */
export function checkAgent(decided) { const R = CASES.map(c => { const d = (decided || {})[c.id]; return d ? score(c, d.decision, d.reason).ok : false; }); return { done: R.filter(Boolean).length, total: CASES.length, ok: R.every(Boolean) }; }
/* what was saved, read back */
export function normalAgent(o) { const out = {}; CASES.forEach(c => { const d = (o || {})[c.id]; if (d && (d.decision === 'trust' || d.decision === 'reject')) out[c.id] = { decision: d.decision, reason: Number.isInteger(d.reason) && d.reason >= 0 && d.reason < 4 ? d.reason : null }; }); return out; }
