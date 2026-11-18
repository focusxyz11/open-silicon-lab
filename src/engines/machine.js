/* Machines from shared blocks: check a machine by the shared grammar, score it, and let an agent assemble one for a
   need (docs/MACHINES.md; the blocks, the grammar and the needs: src/data/blocks.js). Pure logic, no DOM, no words
   (ids only); tests in tests/machine.test.mjs.

   A plan gives each part of a need's machine a form: software, circuit or new matter. The engine says:
   - whether the machine follows the grammar (check): every form is one its block has, every wire joins ports of the
     same kind, every input is fed, and a block run as software has a core, made as a circuit, to run on;
   - whether it meets its need's rules (meets): parts that must stay changeable after the machine is made are software
     or new matter; parts that must be exact are not new matter;
   - what it costs and keeps (score): its energy against the same machine made all as circuits, how many parts can
     still change, how many are exact.
   An agent (assemble) tries every plan, keeps those that pass, and offers the ones no other beats on all three at
   once. It decides nothing: the person picks, because which trade-off is right depends on what the machine is for.

   The cost of each form, for the same work, against a circuit made for it (1):
   - software: about 500 times, a general-purpose chip against a custom one for the same job (Hameed et al., ISCA
     2010; facts.json asic-vs-cpu). That figure is for video encoding; adding custom instructions closed it to about
     3 times, so it is the cost of plain software, never of the best a core could do;
   - new matter: compute in memory, the crossbar's energy against a digital array doing the same products, converters
     included (cimEnergy, src/engines/paradigms.js), at the energy puzzle's array size and converter bits
     (src/engines/budget.js). Only a learner can take this form: its numbers are held where they are multiplied.
   A part's work (its share of the work per answer) is a choice of the model in src/data/blocks.js, so the engine
   only ever speaks of a machine against itself, never in joules. */

import { BLOCKS, NEEDS, FORMS, PORTS, blockOf, needOf } from '../data/blocks.js';
import { cimEnergy } from './paradigms.js';
import { CIM_ARRAY, CIM_ADC } from './budget.js';

export const SOFTWARE_COST = 500;                                   // facts.json asic-vs-cpu
const CIM = cimEnergy(CIM_ARRAY, CIM_ARRAY, CIM_ADC);
export const MATTER_COST = CIM.analog / CIM.digital;
export const COST = { software: SOFTWARE_COST, circuit: 1, matter: MATTER_COST };
/* what each form keeps: can it change after the machine is made, and is it exact */
export const CHANGES = { software: true, circuit: false, matter: true };
export const EXACT = { software: true, circuit: true, matter: false };
export const RULES = ['form', 'kind', 'fed', 'core'];
export { FORMS, PORTS };

const partOf = (need, id) => need.parts.find(p => p.id === id) || null;
/* 'mic.in0' → { part, dir: 'in', i: 0 } */
export function portOf(ref) {
  const m = /^([\w-]+)\.(in|out)(\d+)$/.exec(ref || '');
  return m ? { part: m[1], dir: m[2], i: +m[3] } : null;
}
const kindAt = (need, p) => { const part = partOf(need, p.part), b = part && blockOf(part.block); return b ? (b[p.dir] || [])[p.i] || null : null; };

/* the plan a machine starts from: every part as a circuit where its block can be one, else its first form */
export function startPlan(id) {
  const need = needOf(id), plan = {};
  need.parts.forEach(p => { const b = blockOf(p.block); plan[p.id] = b.forms.includes('circuit') ? 'circuit' : b.forms[0]; });
  return plan;
}

/* does the machine follow the grammar? breaks: { rule, part, port? } */
export function check(need, plan) {
  const breaks = [];
  need.parts.forEach(p => { const b = blockOf(p.block); if (!b || !b.forms.includes(plan[p.id])) breaks.push({ rule: 'form', part: p.id }); });
  const fed = new Set();
  need.wires.forEach(([from, to]) => {
    const T = portOf(to); if (!T) return;
    fed.add(to);
    if (from === 'world') return;
    const F = portOf(from), a = F && kindAt(need, F), b = kindAt(need, T);
    if (!a || !b || a !== b) breaks.push({ rule: 'kind', part: T.part, port: to });
  });
  need.parts.forEach(p => { const b = blockOf(p.block); (b ? b.in : []).forEach((k, i) => { const ref = p.id + '.in' + i; if (!fed.has(ref)) breaks.push({ rule: 'fed', part: p.id, port: ref }); }); });
  const core = need.parts.some(p => { const b = blockOf(p.block); return b && b.runs && plan[p.id] === 'circuit'; });
  need.parts.forEach(p => { if (plan[p.id] === 'software' && !core) breaks.push({ rule: 'core', part: p.id }); });
  return { ok: breaks.length === 0, breaks };
}

/* does it meet its need's rules? misses: { rule: 'change' | 'exact', part } */
export function meets(need, plan) {
  const misses = [];
  (need.change || []).forEach(id => { if (!CHANGES[plan[id]]) misses.push({ rule: 'change', part: id }); });
  (need.exact || []).forEach(id => { if (!EXACT[plan[id]]) misses.push({ rule: 'exact', part: id }); });
  return { ok: misses.length === 0, misses };
}

/* what it costs and keeps */
export function score(need, plan) {
  let energy = 0, base = 0, changes = 0, exact = 0;
  need.parts.forEach(p => { const f = plan[p.id]; energy += p.work * (COST[f] || 0); base += p.work; if (CHANGES[f]) changes++; if (EXACT[f]) exact++; });
  return { energy: energy / base, changes, exact, parts: need.parts.length };
}

/* everything about one machine */
export function machine(id, plan) {
  const need = needOf(id); plan = Object.assign(startPlan(id), plan || {});
  const C = check(need, plan), M = meets(need, plan);
  return { id, plan, check: C, meets: M, score: score(need, plan), ok: C.ok && M.ok };
}

/* a beats b when it is no worse on all three and better on one */
export const beats = (a, b) => a.energy <= b.energy && a.changes >= b.changes && a.exact >= b.exact && (a.energy < b.energy || a.changes > b.changes || a.exact > b.exact);

/* an agent: try every plan, keep those that pass, offer the ones nothing beats, cheapest first */
export function assemble(id, max = 4) {
  const need = needOf(id), parts = need.parts, choices = parts.map(p => blockOf(p.block).forms);
  const valid = [];
  let tried = 0;
  const walk = (i, plan) => {
    if (i === parts.length) {
      tried++;
      if (check(need, plan).ok && meets(need, plan).ok) valid.push({ plan: Object.assign({}, plan), score: score(need, plan) });
      return;
    }
    choices[i].forEach(f => { plan[parts[i].id] = f; walk(i + 1, plan); });
  };
  walk(0, {});
  const front = valid.filter(v => !valid.some(w => w !== v && beats(w.score, v.score)));
  front.sort((a, b) => a.score.energy - b.score.energy || b.score.changes - a.score.changes);
  return { tried, valid: valid.length, front: front.length, picks: front.slice(0, max) };
}

/* how a block is checked: by a piece of the community's plan (its state there: built, open, partly, engine) or by a
   lab's engine; P is the build's plan (src/engines/build.js plan()), optional */
export function checkOf(blockId, P) {
  const b = blockOf(blockId); if (!b) return null;
  if (b.need) return { by: 'plan', need: b.need, state: (P && P[b.need] && P[b.need].state) || 'open' };
  return { by: 'lab', lab: b.lab, state: 'lab' };
}

export { BLOCKS, NEEDS };
