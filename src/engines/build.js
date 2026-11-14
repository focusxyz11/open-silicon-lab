/* The build (src/data/build.js): where the community's goal stands. Pure logic, no DOM; tests in
   tests/design.test.mjs.

   Engines check needs. Each is a small open interface: given a need and a design, say whether the design
   does the job. Today there are three: 'logic' (the tiny-chip engine, through src/engines/design.js),
   'repeat' (a need met when the need it copies is met) and 'riscv' (a RISC-V core whose ALU is a slice
   design, run on test programs, src/engines/core.js). A need with no engine stays open: bringing an
   engine for it (a processor simulator, a memory model, an analog model) is itself a contribution, and
   adding one here is all it takes for the plan, the studio and the tests to use it.

   A need's state: 'built' (a design that passes its check is in the plan), 'open' (it can be checked,
   nobody has built it yet), 'engine' (nothing can check it yet) or, for a need made of others, 'partly'. */
import { NEEDS, GOAL } from '../data/build.js';
import { settled, standing } from './ledger.js';
import { build as buildDesign } from './design.js';
import { buildCore, START_PROGRAM } from './core.js';

export const ENGINES = {
  logic: { check: (need, d) => { const B = buildDesign({ p: need.project, code: d.code }); return B.errs.length === 0 && B.bad === 0; } },
  repeat: { check: () => true },
  /* a core design is a slice for its ALU: it passes when every test program gives the right answer */
  riscv: { check: (need, d) => buildCore(d.slice || d.code, START_PROGRAM, null, d.regs || null).ok }
};
export const needOf = id => NEEDS.find(n => n.id === id) || null;
export const childrenOf = id => NEEDS.filter(n => n.parent === id);
export const needForProject = p => NEEDS.find(n => n.project === p) || null;
/* the designs for a need: the ledger's entries that stand (right, not broken), the one inside the computer first,
   in the shape the plan and the pictures use */
const shape = e => ({ id: e.id, need: e.piece, title: e.title, author: e.by, kind: e.made, ai: e.ai || '', description: e.words || '', code: e.code, state: e.state, facts: e.facts, draft: !!e.draft });
export const designsFor = (id, W) => standing(W || settled(), id).map(shape);
/* every design of the ledger, standing or broken, in the order they came */
export const allDesigns = W => { W = W || settled(); return W.entries.filter(e => e.kind === 'design').map(e => Object.assign(shape(e), { brokenBy: e.brokenBy, inside: W.inside[e.piece] === e.id, tries: e.tries.length })); };

/* the state of every need; mine: projects whose design you have finished here (they count as yours, not the plan's) */
export function plan(mine, W) {
  W = W || settled();
  const own = new Set(mine || []), out = {};
  const state = id => {
    if (out[id]) return out[id];
    const n = needOf(id), kids = childrenOf(id);
    let s;
    if (n.engine === 'riscv') {
      /* the core is not written, it is put together: the community's slice (and its register bit and select, when
         they stand) must run every test program */
      const one = k => designsFor(k, W)[0] || null, sl = one('slice'), core = sl ? { slice: sl.code, regs: { bit: (one('regbit') || {}).code || null, select: (one('select') || {}).code || null } } : null;
      const ok = !!core && ENGINES.riscv.check(n, core);
      s = { state: ok ? 'built' : 'open', designs: ok ? [sl] : [], kinds: ok ? [sl.kind] : [], yours: own.has(n.project) };
    } else if (n.engine === 'logic') {
      const ds = designsFor(id, W).filter(d => ENGINES[n.engine].check(n, d));
      s = { state: ds.length ? 'built' : 'open', designs: ds, kinds: [...new Set(ds.map(d => d.kind))], yours: own.has(n.project) };
    } else if (n.engine === 'repeat') {
      const of = state(n.of);
      s = { state: of.state === 'built' ? 'built' : 'open', designs: [], kinds: of.kinds, yours: of.yours, n: n.n };
    } else if (kids.length) {
      const k = kids.map(c => state(c.id)), built = k.filter(x => x.state === 'built').length;
      s = { state: n.engine === null && !kids.length ? 'engine' : built === kids.length ? 'built' : 'partly', designs: [], kinds: [], yours: false, built, of: kids.length };
    } else s = { state: 'engine', designs: [], kinds: [], yours: false };
    kids.forEach(c => state(c.id));
    return (out[id] = s);
  };
  state(GOAL);
  NEEDS.forEach(n => state(n.id));
  return out;
}

/* how far the goal is: needs built out of all the needs that are pieces (no children) */
export function progress(P) {
  const leaves = NEEDS.filter(n => !childrenOf(n.id).length);
  return { built: leaves.filter(n => P[n.id].state === 'built').length, open: leaves.filter(n => P[n.id].state === 'open').length, engine: leaves.filter(n => P[n.id].state === 'engine').length, total: leaves.length };
}

/* the tree laid out in levels, for drawing: depth of each need, and its order in its level */
export function levels() {
  const L = {}, walk = (id, d) => { (L[d] = L[d] || []).push(id); childrenOf(id).forEach(c => walk(c.id, d + 1)); };
  walk(GOAL, 0);
  return Object.keys(L).sort((a, b) => a - b).map(k => L[k]);
}
