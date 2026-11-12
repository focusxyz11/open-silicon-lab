/* The build (src/data/build.js): where the community's goal stands. Pure logic, no DOM; tests in
   tests/design.test.mjs.

   Engines check needs. Each is a small open interface: given a need and a design, say whether the design
   does the job. Today there are two: 'logic' (the tiny-chip engine, through src/engines/design.js) and
   'repeat' (a need met when the need it copies is met). A need with no engine stays open: bringing an
   engine for it (a processor simulator, a memory model, an analog model) is itself a contribution, and
   adding one here is all it takes for the plan, the studio and the tests to use it.

   A need's state: 'built' (a design that passes its check is in the plan), 'open' (it can be checked,
   nobody has built it yet), 'engine' (nothing can check it yet) or, for a need made of others, 'partly'. */
import { NEEDS, DESIGNS, GOAL } from '../data/build.js';
import { build as buildDesign } from './design.js';

export const ENGINES = {
  logic: { check: (need, d) => { const B = buildDesign({ p: need.project, code: d.code }); return B.errs.length === 0 && B.bad === 0; } },
  repeat: { check: () => true }
};
export const needOf = id => NEEDS.find(n => n.id === id) || null;
export const childrenOf = id => NEEDS.filter(n => n.parent === id);
export const needForProject = p => NEEDS.find(n => n.engine === 'logic' && n.project === p) || null;
export const designsFor = id => DESIGNS.filter(d => d.need === id);

/* the state of every need; mine: projects whose design you have finished here (they count as yours, not the plan's) */
export function plan(mine) {
  const own = new Set(mine || []), out = {};
  const state = id => {
    if (out[id]) return out[id];
    const n = needOf(id), kids = childrenOf(id);
    let s;
    if (n.engine === 'logic') {
      const ds = designsFor(id).filter(d => ENGINES.logic.check(n, d));
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
