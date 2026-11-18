/* Machines from shared blocks: check a machine by the shared grammar, score it, and let an agent assemble one for a
   need (docs/MACHINES.md; the blocks, the grammar and the needs: src/data/blocks.js; the kinds of new matter, beyond
   today's chip: src/data/inventions.js). Pure logic, no DOM, no words (ids only); tests in tests/machine.test.mjs.

   A plan gives each part of a need's machine a form: 'software', 'circuit', or a kind of new matter, 'matter:<kind>'
   ('matter' alone is read as 'matter:cim'). The engine says:
   - whether the machine follows the grammar (check): every form is one its block can take, every wire joins ports of
     the same kind, every input is fed, and a block run as software has a core, made as a circuit, to run on;
   - whether it meets its need's rules (meets): parts that must stay changeable after the machine is made can change in
     their form; parts that must be exact are in a form that is exact;
   - what it costs and keeps (score): its energy against the same machine made all as circuits, as a range (if the
     guesses hold, and if they fail), how many parts can still change, how many are exact, and where a claim hit the
     floor.
   An agent (assemble) tries every plan, keeps those that pass, and offers the ones no other beats on all three at
   once. By default it counts only what is in products or shown in a lab (the energy if the guesses fail); told to
   count guesses, it ranks by the energy if they hold. It decides nothing: the person picks.

   The cost of each form, for the same work, against a circuit made for it (1):
   - software: about 500 times, a general-purpose chip against a custom one for the same job (Hameed et al., ISCA
     2010; facts.json asic-vs-cpu). That figure is for video encoding; adding custom instructions closed it to about
     3 times, so it is the cost of plain software, never of the best a core could do;
   - new matter: the product of its claims (src/data/inventions.js). If the guesses hold, every gain counts and only
     the catches shown in a lab or in products; if they fail, only the gains shown in a lab or in products count and
     every catch does. Neither can go below the floor: erasing a bit costs at least kT ln 2 (src/engines/floor.js,
     facts.json landauer-measured), against a 16-bit multiply-add's energy in the 45 nm table (E16).
   A part's work (its share of the work per answer) is a choice of the model in src/data/blocks.js, so the engine
   only ever speaks of a machine against itself, never in joules. */

import { BLOCKS, NEEDS, FORMS, PORTS, blockOf, needOf } from '../data/blocks.js';
import { MATTERS, ACTIVITY, matterOf, mattersFor } from '../data/inventions.js';
import { cimEnergy, E16 } from './paradigms.js';
import { CIM_ARRAY, CIM_ADC } from './budget.js';
import { landauer, bitsErased, T_ROOM } from './floor.js';

export const SOFTWARE_COST = 500;                                   // facts.json asic-vs-cpu
const CIM = cimEnergy(CIM_ARRAY, CIM_ARRAY, CIM_ADC);
export const MATTER_COST = CIM.analog / CIM.digital;                 // compute in memory against a digital array
/* the floor against a circuit: kT ln 2 for each bit erased, over a 16-bit multiply-add (E16 is in pJ) */
const OP_PJ = E16.add + E16.mul, BIT_PJ = landauer(T_ROOM) * 1e12;
export const floorOf = m => (m.floor === 'op' ? bitsErased(16) : m.floor) * BIT_PJ / OP_PJ;
export const RULES = ['form', 'kind', 'fed', 'core'];
export { FORMS, PORTS, MATTERS };

/* the forms a block can take: its own, then every kind of new matter that can be made into it */
export const formsOf = blockId => { const b = blockOf(blockId); return b ? b.forms.concat(mattersFor(blockId).map(m => 'matter:' + m.id)) : []; };
export const familyOf = f => String(f || '').split(':')[0];
export const matterIn = f => (familyOf(f) === 'matter' ? matterOf(String(f).split(':')[1] || 'cim') : null);
const norm = f => (f === 'matter' ? 'matter:cim' : f);

/* what a form keeps: can it change after the machine is made, and is it exact */
export const changes = f => (f === 'software' ? true : f === 'circuit' ? false : !!(matterIn(f) || {}).changes);
export const exact = f => (f === 'software' || f === 'circuit' ? true : !!(matterIn(f) || {}).exact);

/* the energy of a form against a circuit, as a range: { low: if the guesses hold, high: if they fail, wall } */
export function costOf(f, need) {
  if (f === 'software') return { low: SOFTWARE_COST, high: SOFTWARE_COST, wall: false };
  if (f === 'circuit') return { low: 1, high: 1, wall: false };
  const m = matterIn(f); if (!m) return { low: Infinity, high: Infinity, wall: false };
  const value = c => (c.energy === 'cim' ? MATTER_COST : c.energy === 'activity' ? ACTIVITY[(need && need.activity) || 'steady'] : c.energy);
  let low = 1, high = 1;
  m.claims.forEach(c => {
    if (c.kind === 'gain') { low *= value(c); if (c.status !== 'guess') high *= value(c); }
    if (c.kind === 'catch') { high *= value(c); if (c.status !== 'guess') low *= value(c); }
  });
  const floor = floorOf(m), wall = low < floor || high < floor;
  return { low: Math.max(low, floor), high: Math.max(high, floor), wall };
}

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
  need.parts.forEach(p => { const fs = formsOf(p.block); plan[p.id] = fs.includes('circuit') ? 'circuit' : fs[0]; });
  return plan;
}

/* does the machine follow the grammar? breaks: { rule, part, port? } */
export function check(need, plan) {
  const breaks = [];
  need.parts.forEach(p => { if (!formsOf(p.block).includes(norm(plan[p.id]))) breaks.push({ rule: 'form', part: p.id }); });
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
  (need.change || []).forEach(id => { if (!changes(norm(plan[id]))) misses.push({ rule: 'change', part: id }); });
  (need.exact || []).forEach(id => { if (!exact(norm(plan[id]))) misses.push({ rule: 'exact', part: id }); });
  return { ok: misses.length === 0, misses };
}

/* what it costs and keeps; energy is the one the agent ranks by: if the guesses fail, unless told to count them */
export function score(need, plan, guesses = false) {
  let low = 0, high = 0, base = 0, kept = 0, sure = 0;
  const walls = [];
  need.parts.forEach(p => {
    const f = norm(plan[p.id]), c = costOf(f, need);
    low += p.work * c.low; high += p.work * c.high; base += p.work;
    if (c.wall) walls.push(p.id);
    if (changes(f)) kept++;
    if (exact(f)) sure++;
  });
  return { energy: (guesses ? low : high) / base, low: low / base, high: high / base, changes: kept, exact: sure, parts: need.parts.length, walls };
}

/* everything about one machine */
export function machine(id, plan, guesses = false) {
  const need = needOf(id); plan = Object.assign(startPlan(id), plan || {});
  Object.keys(plan).forEach(k => { plan[k] = norm(plan[k]); });
  const C = check(need, plan), M = meets(need, plan);
  return { id, plan, check: C, meets: M, score: score(need, plan, guesses), ok: C.ok && M.ok };
}

/* a beats b when it is no worse on all three and better on one */
export const beats = (a, b) => a.energy <= b.energy && a.changes >= b.changes && a.exact >= b.exact && (a.energy < b.energy || a.changes > b.changes || a.exact > b.exact);

/* an agent: try every plan, keep those that pass, offer the ones nothing beats, cheapest first */
export function assemble(id, max = 4, guesses = false) {
  const need = needOf(id), parts = need.parts, choices = parts.map(p => formsOf(p.block));
  const valid = [];
  let tried = 0;
  const walk = (i, plan) => {
    if (i === parts.length) {
      tried++;
      if (check(need, plan).ok && meets(need, plan).ok) valid.push({ plan: Object.assign({}, plan), score: score(need, plan, guesses) });
      return;
    }
    choices[i].forEach(f => { plan[parts[i].id] = f; walk(i + 1, plan); });
  };
  walk(0, {});
  const front = valid.filter(v => !valid.some(w => w !== v && beats(w.score, v.score)));
  front.sort((a, b) => a.score.energy - b.score.energy || b.score.changes - a.score.changes);
  return { tried, valid: valid.length, front: front.length, picks: front.slice(0, max), guesses };
}

/* how a block is checked: by a piece of the community's plan (its state there: built, open, partly, engine) or by a
   lab's engine; P is the build's plan (src/engines/build.js plan()), optional */
export function checkOf(blockId, P) {
  const b = blockOf(blockId); if (!b) return null;
  if (b.need) return { by: 'plan', need: b.need, state: (P && P[b.need] && P[b.need].state) || 'open' };
  return { by: 'lab', lab: b.lab, state: 'lab' };
}

export { BLOCKS, NEEDS };
