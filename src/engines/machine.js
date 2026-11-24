/* Machines from shared blocks: check a machine by the shared grammar, score it, and let an agent assemble one for a
   need (docs/MACHINES.md; the blocks, the grammar and the needs: src/data/blocks.js; the kinds of new matter, beyond
   today's chip: src/data/inventions.js). Pure logic, no DOM, no words (ids only); tests in tests/machine.test.mjs.

   A plan gives each part of a need's machine a form: 'software', 'circuit', a kind of new matter, 'matter:<kind>'
   ('matter' alone is read as 'matter:cim'), or a liquid fabric, 'liquid:<kind>' (src/data/liquid.js). The engine says:
   - whether the machine follows the grammar (check): every form is one its block can take, every wire joins ports of
     the same kind, every input is fed, and a block run as software has a core, made as a circuit, to run on;
   - whether it meets its need's rules (meets): parts that must stay changeable after the machine is made can change in
     their form; parts that must be exact are in a form that is exact; and where the need's job changes every so often
     (need.every), the parts that must change can reshape that fast (keep): how long each form takes is in
     src/data/liquid.js (RESHAPE, and each fabric's reshape claim);
   - whether its made parts can be made where the plan says (the rule fab): a plan also names a fab (plan.fab, a place
     of src/data/fabs.js, 'giant' if none), and every part that is neither software, bought (a stock block) nor grown
     must be a form that place makes;
   - what it costs and keeps (score): its energy against the same machine made all as circuits, as a range (if the
     guesses hold, and if they fail), how many parts can still change, how many are exact, where a claim hit the
     floor, and how many days one try takes, as a range (a try with nothing to make takes TRY_DAYS; a grown part's
     days are not known, so never), with the tries that fit in a year.
   An agent (assemble) tries every plan in every fab, keeps those that pass, and offers the ones no other beats on all
   four at once. By default it counts only what is in products or shown in a lab (the energy if the guesses fail); told to
   count guesses, it ranks by the energy if they hold. It decides nothing: the person picks.

   The cost of each form, for the same work, against a circuit made for it (1):
   - software: about 500 times, a general-purpose chip against a custom one for the same job (Hameed et al., ISCA
     2010; facts.json asic-vs-cpu). That figure is for video encoding; adding custom instructions closed it to about
     3 times, so it is the cost of plain software, never of the best a core could do;
   - a liquid fabric: its energy claim (an FPGA about 14 times, facts.json fpga-asic-gap); a guessed fabric that
     fails is no better than an FPGA;
   - new matter: the product of its claims (src/data/inventions.js). If the guesses hold, every gain counts and only
     the catches shown in a lab or in products; if they fail, only the gains shown in a lab or in products count and
     every catch does. Neither can go below the floor: erasing a bit costs at least kT ln 2 (src/engines/floor.js,
     facts.json landauer-measured), against a 16-bit multiply-add's energy in the 45 nm table (E16).
   A part's work (its share of the work per answer) is a choice of the model in src/data/blocks.js, so the engine
   only ever speaks of a machine against itself, never in joules.

   Your switch (#329): a block can be a circuit made of the switch you invented at the switch level, new matter of the
   kind 'switch' (src/data/inventions.js). The plan says which switch (plan.sw, a short word of src/engines/switch.js
   specKey; none: today's silicon fin), so a machine and a ledger entry are scored the same everywhere. Its claim takes
   the switch's energy per switch against silicon and its status (an invented material is a guess); a switch that
   never turns off cleanly, or a known material the line melts or that has no holes for a pair, cannot be made, so the
   fab's rule breaks (claimsOf, yours). */

import { BLOCKS, NEEDS, FORMS, PORTS, blockOf, needOf } from '../data/blocks.js';
import { MATTERS, ACTIVITY, matterOf, mattersFor } from '../data/inventions.js';
import { cimEnergy, E16 } from './paradigms.js';
import { CIM_ARRAY, CIM_ADC } from './budget.js';
import { landauer, bitsErased, T_ROOM } from './floor.js';
import { FABS, TRY_DAYS, YEAR, fabOf } from '../data/fabs.js';
import { LIQUIDS, RESHAPE, FALLBACK, liquidOf, liquidsFor } from '../data/liquid.js';
import { forMachines, specOf } from './switch.js';

export const SOFTWARE_COST = 500;                                   // facts.json asic-vs-cpu
const CIM = cimEnergy(CIM_ARRAY, CIM_ARRAY, CIM_ADC);
export const MATTER_COST = CIM.analog / CIM.digital;                 // compute in memory against a digital array
/* the floor against a circuit: kT ln 2 for each bit erased, over a 16-bit multiply-add (E16 is in pJ) */
const OP_PJ = E16.add + E16.mul, BIT_PJ = landauer(T_ROOM) * 1e12;
export const floorOf = m => (m.floor === 'op' ? bitsErased(16) : m.floor) * BIT_PJ / OP_PJ;
export const RULES = ['form', 'kind', 'fed', 'core', 'fab'];
export { FORMS, PORTS, MATTERS, FABS, LIQUIDS };
export const MISSES = ['change', 'exact', 'keep'];
export const START_FAB = 'giant';

/* the forms a block can take: its own, then every kind of new matter that can be made into it */
export const formsOf = blockId => { const b = blockOf(blockId); return b ? b.forms.concat(mattersFor(blockId).map(m => 'matter:' + m.id), liquidsFor(blockId).map(l => 'liquid:' + l.id)) : []; };
export const familyOf = f => String(f || '').split(':')[0];
export const matterIn = f => (familyOf(f) === 'matter' ? matterOf(String(f).split(':')[1] || 'cim') : null);
export const liquidIn = f => (familyOf(f) === 'liquid' ? liquidOf(String(f).split(':')[1] || FALLBACK) : null);
const norm = f => (f === 'matter' ? 'matter:cim' : f === 'liquid' ? 'liquid:' + FALLBACK : f);

/* what a form keeps: can it change after the machine is made, and is it exact */
export const changes = f => (f === 'software' || liquidIn(f) ? true : f === 'circuit' ? false : !!(matterIn(f) || {}).changes);
export const exact = f => (f === 'software' || f === 'circuit' || liquidIn(f) ? true : !!(matterIn(f) || {}).exact);
/* how long a form takes to change, in seconds, as a range { low: if the guesses hold, high: if they fail } */
export function reshapeOf(f) {
  if (f === 'software') return { low: RESHAPE.software, high: RESHAPE.software };
  const L = liquidIn(f);
  if (L) { const r = L.reshape, fb = liquidOf(FALLBACK).reshape.value; return r.status === 'guess' ? { low: r.value[0], high: fb[1] } : { low: r.value[0], high: r.value[1] }; }
  return changes(f) ? { low: RESHAPE.matter, high: RESHAPE.matter } : { low: Infinity, high: Infinity };
}

/* your switch, as a machine takes it: { energy, status, makeable } (sw: a plan's switch word; none: the silicon fin) */
const SW = {};
export const yours = sw => SW[sw || ''] || (SW[sw || ''] = forMachines(specOf(sw)));
/* a kind's claims, with your switch's filled in from the plan's switch */
export function claimsOf(m, sw) {
  if (!m) return [];
  return m.claims.map(c => {
    if (c.energy !== 'switch') return c;
    const Y = yours(sw), e = isFinite(Y.energy) ? Y.energy : 1;
    return Object.assign({}, c, { status: Y.status, fid: Y.status === 'guess' ? 'idea' : c.fid, kind: e <= 1 ? 'gain' : 'catch', value: e });
  });
}
/* the energy of a form against a circuit, as a range: { low: if the guesses hold, high: if they fail, wall } */
export function costOf(f, need, sw) {
  if (f === 'software') return { low: SOFTWARE_COST, high: SOFTWARE_COST, wall: false };
  if (f === 'circuit') return { low: 1, high: 1, wall: false };
  const L = liquidIn(f);
  if (L) { const e = L.energy; return { low: e.value, high: e.status === 'guess' ? liquidOf(FALLBACK).energy.value : e.value, wall: false }; }
  const m = matterIn(f); if (!m) return { low: Infinity, high: Infinity, wall: false };
  const value = c => (c.energy === 'cim' ? MATTER_COST : c.energy === 'activity' ? ACTIVITY[(need && need.activity) || 'steady'] : c.energy === 'switch' ? c.value : c.energy);
  let low = 1, high = 1;
  claimsOf(m, sw).forEach(c => {
    if (c.kind === 'gain') { low *= value(c); if (c.status !== 'guess') high *= value(c); }
    if (c.kind === 'catch') { high *= value(c); if (c.status !== 'guess') low *= value(c); }
  });
  const floor = floorOf(m), wall = low < floor || high < floor;
  return { low: Math.max(low, floor), high: Math.max(high, floor), wall };
}

/* the days one try takes in a fab, as a range: { low: if the guesses hold, high: if they fail } (never: Infinity) */
export function daysOf(fabId) {
  const F = fabOf(fabId); if (!F) return { low: Infinity, high: Infinity };
  const c = F.claims.find(k => k.kind === 'days');
  return c ? { low: c.value[0], high: c.status === 'guess' ? Infinity : c.value[1] } : { low: Infinity, high: Infinity };
}
/* what a line costs to set up, against a giant fab: [least, most] */
export function setupOf(fabId) {
  const F = fabOf(fabId), c = F && F.claims.find(k => k.kind === 'cost');
  return c ? { value: [].concat(c.value), status: c.status } : null;
}
/* the parts of a machine a fab has to make: not software, not bought ready-made, not grown, not a fabric that is
   bought and configured */
export function made(need, plan) {
  return need.parts.filter(p => { const f = norm(plan[p.id]), b = blockOf(p.block); return f !== 'software' && !(b && b.stock) && !(matterIn(f) || {}).grown && !liquidIn(f); }).map(p => p.id);
}
const grownIn = (need, plan) => need.parts.some(p => (matterIn(norm(plan[p.id])) || {}).grown);
/* how long one try of the machine takes, as a range in days */
export function tryDays(need, plan) {
  if (grownIn(need, plan)) return { low: Infinity, high: Infinity };
  if (!made(need, plan).length) return { low: TRY_DAYS, high: TRY_DAYS };
  const d = daysOf(plan.fab || START_FAB);
  return { low: Math.max(TRY_DAYS, d.low), high: Math.max(TRY_DAYS, d.high) };
}
export const triesAYear = days => (isFinite(days) ? YEAR / days : 0);

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
  plan.fab = START_FAB;
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
  const F = fabOf(plan.fab || START_FAB);
  made(need, plan).forEach(id => { if (!F || !F.makes.includes(norm(plan[id])) || (norm(plan[id]) === 'matter:switch' && !yours(plan.sw).makeable)) breaks.push({ rule: 'fab', part: id }); });
  return { ok: breaks.length === 0, breaks };
}

/* does it meet its need's rules? misses: { rule: 'change' | 'exact' | 'keep', part }. Keeping up counts the slowest
   a form may be (if the guesses fail), unless told to count guesses */
export function meets(need, plan, guesses = false) {
  const misses = [];
  (need.change || []).forEach(id => {
    const f = norm(plan[id]);
    if (!changes(f)) misses.push({ rule: 'change', part: id });
    else if (need.every) { const r = reshapeOf(f); if ((guesses ? r.low : r.high) > need.every) misses.push({ rule: 'keep', part: id }); }
  });
  (need.exact || []).forEach(id => { if (!exact(norm(plan[id]))) misses.push({ rule: 'exact', part: id }); });
  return { ok: misses.length === 0, misses };
}

/* what it costs and keeps; energy is the one the agent ranks by: if the guesses fail, unless told to count them */
export function score(need, plan, guesses = false) {
  let low = 0, high = 0, base = 0, kept = 0, sure = 0;
  const walls = [];
  need.parts.forEach(p => {
    const f = norm(plan[p.id]), c = costOf(f, need, plan.sw);
    low += p.work * c.low; high += p.work * c.high; base += p.work;
    if (c.wall) walls.push(p.id);
    if (changes(f)) kept++;
    if (exact(f)) sure++;
  });
  const D = tryDays(need, plan), days = guesses ? D.low : D.high;
  return { energy: (guesses ? low : high) / base, low: low / base, high: high / base, changes: kept, exact: sure, parts: need.parts.length, walls,
    days, daysLow: D.low, daysHigh: D.high, tries: triesAYear(days), fab: made(need, plan).length ? (plan.fab || START_FAB) : null };
}

/* everything about one machine */
export function machine(id, plan, guesses = false) {
  const need = needOf(id); plan = Object.assign(startPlan(id), plan || {});
  Object.keys(plan).forEach(k => { plan[k] = norm(plan[k]); });
  const C = check(need, plan), M = meets(need, plan, guesses);
  return { id, plan, check: C, meets: M, score: score(need, plan, guesses), ok: C.ok && M.ok };
}

/* a beats b when it is no worse on all four and better on one */
export const beats = (a, b) => a.energy <= b.energy && a.changes >= b.changes && a.exact >= b.exact && a.days <= b.days &&
  (a.energy < b.energy || a.changes > b.changes || a.exact > b.exact || a.days < b.days);

/* an agent: try every plan in every fab, keep those that pass, offer the ones nothing beats, cheapest first. A plan
   with nothing to make is the same in every fab, so it is kept once */
export function assemble(id, max = 4, guesses = false, sw) {
  const need = needOf(id), parts = need.parts, choices = parts.map(p => formsOf(p.block));
  const valid = [];
  let tried = 0;
  const walk = (i, plan) => {
    if (i === parts.length) {
      FABS.forEach((F, k) => {
        tried++; plan.fab = F.id; if (sw) plan.sw = sw;
        if (k > 0 && !made(need, plan).length) return;
        if (check(need, plan).ok && meets(need, plan, guesses).ok) valid.push({ plan: Object.assign({}, plan), score: score(need, plan, guesses) });
      });
      return;
    }
    choices[i].forEach(f => { plan[parts[i].id] = f; walk(i + 1, plan); });
  };
  walk(0, {});
  /* a plan that scores exactly like one found before it is the same choice, as far as the score can tell: kept once */
  const same = (a, b) => a.energy === b.energy && a.changes === b.changes && a.exact === b.exact && a.days === b.days;
  const front = valid.filter((v, i) => !valid.some((w, j) => w !== v && (beats(w.score, v.score) || (j < i && same(w.score, v.score)))));
  front.sort((a, b) => a.score.energy - b.score.energy || b.score.changes - a.score.changes || a.score.days - b.score.days);
  return { tried, valid: valid.length, front: front.length, picks: front.slice(0, max), guesses };
}

/* ---- a need's challenge (GOALS in src/data/blocks.js), played on the machine (src/v2/machines.js, Do) ----
   A goal is met when the machine follows the grammar, meets its need, keeps the goal's own rules (goalMisses), and
   spends no more energy than the least any machine that does all that can (bestFor). Energy is the score's own,
   counting only what is shown (guesses never), so the scoring above is unchanged. */
/* the goal's own rules a plan breaks: { rule: 'exact', part }, or { rule: 'days' }: a try longer than the goal allows,
   if a guess fails */
export function goalMisses(need, plan, goal) {
  const out = [];
  (goal.exact || []).forEach(id => { if (!exact(norm(plan[id]))) out.push({ rule: 'exact', part: id }); });
  if (goal.days != null && !(tryDays(need, plan).high <= goal.days)) out.push({ rule: 'days' });
  return out;
}
/* the least energy any machine for this need can spend while it keeps the goal: every plan in every fab, as the agent
   tries them (a plan with nothing to make once); null if none can. Kept once worked out */
const BEST = {};
export function bestFor(id, goal, sw) {
  const key = id + '.' + goal.id + (sw ? '.' + sw : ''); if (key in BEST) return BEST[key];
  const need = needOf(id), parts = need.parts, choices = parts.map(p => formsOf(p.block));
  let best = null;
  const walk = (i, plan) => {
    if (i === parts.length) {
      FABS.forEach((F, k) => {
        plan.fab = F.id; if (sw) plan.sw = sw;
        if (k > 0 && !made(need, plan).length) return;
        if (!check(need, plan).ok || !meets(need, plan).ok || goalMisses(need, plan, goal).length) return;
        const e = score(need, plan).energy;
        if (!best || e < best.energy) best = { energy: e, plan: Object.assign({}, plan) };
      });
      return;
    }
    choices[i].forEach(f => { plan[parts[i].id] = f; walk(i + 1, plan); });
  };
  walk(0, {});
  return (BEST[key] = best);
}
/* a plan played against a goal: the machine, the goal's own misses, the least it can be, and whether it is won (within
   a millionth of the least, so rounding never denies a win) */
export function play(id, plan, goal) {
  const m = machine(id, plan), extra = goalMisses(needOf(id), m.plan, goal), b = bestFor(id, goal, m.plan.sw), ok = m.ok && !extra.length;
  return { m, extra, best: b ? b.energy : Infinity, ok, won: ok && !!b && m.score.energy <= b.energy * (1 + 1e-6) };
}

/* how a block is checked: by a piece of the community's plan (its state there: built, open, partly, engine) or by a
   lab's engine; P is the build's plan (src/engines/build.js plan()), optional */
export function checkOf(blockId, P) {
  const b = blockOf(blockId); if (!b) return null;
  if (b.need) return { by: 'plan', need: b.need, state: (P && P[b.need] && P[b.need].state) || 'open' };
  return { by: 'lab', lab: b.lab, state: 'lab' };
}

export { BLOCKS, NEEDS };
