/* Design it, or search for it? (the search engine): a person's design against a blind search, as the compute spent
   on the search grows. Pure logic, no DOM, no words (ids only; the words are srch.* in src/i18n/en/labs.json); tests
   in tests/search.test.mjs.

   The core question it faces is "Compute beats cleverness" (Sutton, The Bitter Lesson, 2019): methods that use more
   computing have kept beating methods built on human cleverness. Here the cleverness is a person's design (the lab's
   working example of each job, from the studio, src/engines/tinychip.js), and the compute is a search: the evolve
   engine's Cartesian Genetic Programming (src/engines/evolve.js), a "1 + 4" strategy, so each generation tries a
   population of POP new circuits. The budget is the number of circuits tried, generations x population.

   Every circuit tried is checked against the checker's inputs, one bit per input pattern at once. With the checker
   that tries every input (CHECKERS.all) the score is honest: a circuit counts only when it is right on all of them.
   With the checker that tries only some (CHECKERS.some: the first half of the table, where the first input is 0),
   the search is scored on those alone, and what it finds is measured afterwards on every input: it "wins" where it
   was tested and fails where it was not.

   s = start('vote', { seed, checker }); advance(s, budget) runs the search until that many circuits are tried (it
   can be called again with a larger budget and goes on; the same seed gives the same run); at(s, budget) reads the
   best found within a budget; crossing(s) is the first budget at which the search passed the person's design.
   Size is counted in cells after synthesis, the studio's yardstick (evolve.measure), the person's design and the
   search's alike. */
import { target, randomGenome, mutate, fitness, run, toCode, measure, rng } from './evolve.js';
import TC from './tinychip.js';

/* each generation tries this many new circuits */
export const POP = 4;
/* the gates the search may use, and how many it carries (evolve.js) */
const NODES = 30;
/* the budgets offered, in circuits tried: 1, 2, 5 in every decade from a hundred to a million */
export const BUDGETS = [100, 200, 500, 1e3, 2e3, 5e3, 1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6];
export const MAX = BUDGETS[BUDGETS.length - 1];

/* the circuits to make, small to wide: three inputs each, one, four and seven outputs. The person's design is the
   studio's working example of each job, measured in cells by the same synthesis as the search's */
export const JOB_IDS = ['vote', 'select', 'seg'];
export const JOBS = JOB_IDS.map(id => {
  const proj = TC.PROJ.find(p => p.id === id), m = measure(proj, proj.sol);
  return { id, ins: proj.ins, outs: proj.outs, hand: m.cells, handCode: proj.sol, proj, patterns: 1 << proj.ins.length };
});
export const jobOf = id => JOBS.find(j => j.id === id) || null;

/* the checkers: every input pattern, or only the first half of the table (the first input 0) */
export const CHECKERS = ['all', 'some'];
const testedMask = (n, checker) => (checker === 'some' ? (1 << (n / 2)) - 1 : n >= 32 ? 0xffffffff : (1 << n) - 1) >>> 0;
const pop = x => { let c = 0; x >>>= 0; while (x) { c += x & 1; x >>>= 1; } return c; };

/* the job's target as the checker sees it: only the tested patterns count */
function checkedTarget(T, checker) {
  const m = testedMask(T.n, checker);
  return Object.assign({}, T, { mask: m, want: T.want.map(w => (w & m) >>> 0), bits: pop(m) * T.outs.length, tested: m });
}

/* every input pattern of a circuit: right on every output or not, and whether the checker tried it */
function patterns(T, G, tested) {
  const got = run(T, G), out = [];
  for (let i = 0; i < T.n; i++) out.push({ ok: got.every((x, k) => ((x >>> i) & 1) === ((T.want[k] >>> i) & 1)), tested: !!((tested >>> i) & 1) });
  return out;
}

/* Begin a seeded search. job: an id of JOBS; checker: 'all' or 'some'. */
export function start(job, { seed = 1, checker = 'all' } = {}) {
  const J = jobOf(job); if (!J) return null;
  const ck = CHECKERS.includes(checker) ? checker : 'all';
  const T = target(J.proj), C = checkedTarget(T, ck), r = rng(seed);
  const best = randomGenome(C, { nodes: NODES }, r);
  const s = { job: J.id, checker: ck, seed, T, C, r, best, fit: fitness(C, best), tried: 0, marks: [], lastScore: -Infinity, bestCells: null };
  note(s);
  return s;
}

/* keep a mark each time the best gets better: what it scores on the checker, and, once it passes the checker, its
   size in cells and how it does on every input */
function note(s) {
  const f = s.fit; if (f.score <= s.lastScore) return; s.lastScore = f.score;
  const J = jobOf(s.job), passes = f.correct === s.C.bits;
  let cells = null, code = null, pats = null, right = null;
  if (passes) {
    code = toCode(s.T, s.best).split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
    cells = measure(J.proj, code)?.cells ?? null;
    pats = patterns(s.T, s.best, s.C.tested);
    right = pats.filter(p => p.ok).length;
  }
  /* the best found so far is the smallest circuit that passes the checker; a mark that is not smaller keeps it */
  if (passes && cells != null && (s.bestCells == null || cells < s.bestCells)) s.bestCells = cells;
  else if (passes && s.bestCells != null && cells >= s.bestCells) return;
  s.marks.push({ tried: s.tried, correct: f.correct, of: s.C.bits, passes, cells, code, pats, right });
}

/* run the search until `budget` circuits have been tried (whole generations); returns the state */
export function advance(s, budget) {
  const until = Math.min(MAX, budget);
  while (s.tried + POP <= until) {
    let cb = null, cf = null;
    for (let k = 0; k < POP; k++) { const c = mutate(s.C, s.best, s.r), f = fitness(s.C, c); if (!cf || f.score >= cf.score) { cb = c; cf = f; } }
    s.tried += POP;
    if (cf.score >= s.fit.score) { s.best = cb; s.fit = cf; note(s); }
  }
  return s;
}

/* the best found within a budget: the last mark at or under it (the search must have been advanced that far) */
export function at(s, budget) {
  const J = jobOf(s.job); let m = null;
  for (const x of s.marks) if (x.tried <= budget) m = x;
  const passes = !!(m && m.passes), beats = passes && m.cells != null && m.cells < J.hand;
  const all = passes ? m.pats.every(p => p.ok) : false;
  return { budget, tried: Math.min(budget, s.tried), hand: J.hand, passes, cells: passes ? m.cells : null, correct: m ? m.correct : 0, of: s.C.bits,
    code: passes ? m.code : null, pats: passes ? m.pats : null, right: passes ? m.right : null, patterns: J.patterns, all, beats,
    /* passed where it was tested, and wrong somewhere it was not */
    fooled: passes && !all };
}

/* the curve: the best size found against circuits tried, as steps (a point at each mark that passes the checker) */
export const curve = s => s.marks.filter(m => m.passes).map(m => ({ tried: Math.max(1, m.tried), cells: m.cells, all: m.pats.every(p => p.ok) }));

/* the first budget at which the search passed the person's design, or null (within what has been run) */
export function crossing(s) {
  const J = jobOf(s.job), m = s.marks.find(x => x.passes && x.cells != null && x.cells < J.hand);
  return m ? Math.max(1, m.tried) : null;
}

/* The goals, in order. beat: with the checker that tries every input, the search's best within the budget is smaller
   than the person's design. fooled: with the checker that tries only some inputs, the search's best passes the
   checker, is smaller than the person's design, and is wrong on an input nobody tried. */
export const GOALS = ['beat', 'fooled'];
export function check(s, budget) {
  const r = at(s, budget);
  return { beat: s.checker === 'all' && r.beats && r.all, fooled: s.checker === 'some' && r.beats && r.fooled };
}
