/* Grow an architecture that does not exist yet (docs/MACHINES.md, "Invent", the third scale: a new switch, a new
   machine, a new architecture). Pure logic, no DOM, no words (ids only); tests in tests/arch.test.mjs; played by
   src/v2/labs/arch.js.

   Today's computer is one recipe among hundreds: memory kept apart from the processor, values carried by charge in
   silicon, told what to do one instruction at a time, built from a few big cores. Fifty years of attempts have polished
   it. Any other recipe starts far behind, even one that could beat it once it had been polished as long, and that is
   the lesson: a new architecture is not efficient at first, and it gets better only through many attempts in many
   directions, usually by winning one need first, where its strengths count most, and spreading from there.

   An architecture is a recipe of four genes (GENES, OPTIONS): where it computes (memory far from the processor, near
   it, computing in the memory itself, or values flowing through a mesh laid out once), what carries a value (charge,
   light, spikes, reversible charge, living cells), how it is told what to do (a program step by step, a graph laid out
   once, acting on events, learning from examples, wired for one job) and its shape (a few big cores, a grid of small
   tiles, layers stacked, a swarm of small parts). 4 x 5 x 5 x 4 = 400 recipes; a few have been built (KNOWN, each
   resting on an entry of src/data/facts.json), the rest are open.

   What a recipe could become (potentialOf): each option changes five traits against today's computer (EFFECT: energy
   per answer, how many jobs it can take, whether answers are exact, how it bears faults and radiation, how fast it
   adapts), and each need weighs them (WANT; a need may also require a trait, 'must'). Spikes and events spend only
   when there is something to do, so they gain most where a need is rarely busy (ACTIVITY of src/data/inventions.js,
   each need's activity in src/data/blocks.js). Every number here is a choice of the model, written down so it can be
   argued with; one is near a real figure: a circuit wired for one job is capped at 25 times less energy than a
   program, where one study found about 500 times for one job (facts.json asic-vs-cpu), because the rest of a machine
   does not shrink with it.

   How polished it is (maturity): five directions of improvement (DIRS: the devices, where data sits and moves, the
   tools that tell it what to do, handling errors, making it in a factory), each from a start set by the genes that
   differ from today's (LINK: a changed gene leaves its main direction with little to build on, START_MAIN, and its
   second one with some, START_SIDE) up to 1, today's. A direction grows with the attempts put into it as a power law,
   Wright's law's shape (facts.json wright-law): each doubling of attempts multiplies it by 2^GROWTH, a choice of the
   model. A need weighs the directions it depends on (NEED_DIRS). Attempts come from people (ATTEMPTS a year each);
   people come from investing in them, and from winning: others join an architecture that has won a need.

   Against today's computer (scoreOf): potential times maturity, over today's computer's own gain, which keeps growing
   a little each year (TODAY_GAIN) from its millions of people. Above 1, the new architecture wins that need. Changing a
   gene after the first year is a fork: the directions it leads lose what was learned (forkOf). Agents propose forks
   (agentForks), worked out by the engine; the person decides.

   Stepping stones (STONES, broughtOf, #408): each direction is improved by doing it, in the lab that teaches it. A
   challenge won there raises that direction's start once (STONE; people: STONE_PEOPLE), whatever recipe is grown and
   through every fork. It never wins alone: a recipe still has to be grown (tests/arch.test.mjs).

   The family tree (treeOf, treeStart, treeFork, treeYear, #409): every start and fork of a visit as plain data, each
   node a recipe (its key), where it came from, the year it was made and the needs it won, the history a later ledger
   entry can carry.

   An attempt in the ledger (histOf, histOk, replay, #410): one line of the tree as a history, the start, the focus of
   each year, the forks and stones in order and the needs it claims, grown again here so a false claim is refused.

   A recipe is a set of forks in your stack (docs/PATH.md, #444): each option's carry contract (CARRY) sits beside its
   traits, and src/engines/path.js builds the recipe's anatomy rung by rung from it. A forked rung's energy is divided
   by the option's own energy factor (forkEnergy), and the stack's figure against today's computer is this engine's
   scoreOf: one number, never two. */

import { NEEDS as MACHINE_NEEDS } from '../data/blocks.js';
import { ACTIVITY } from '../data/inventions.js';
import { MATTERS } from '../data/lattice.js';

export const GENES = ['where', 'carrier', 'told', 'shape'];
export const OPTIONS = {
  where: ['far', 'near', 'in', 'flow'],
  carrier: ['charge', 'light', 'spikes', 'reversible', 'living'],
  told: ['program', 'graph', 'events', 'learns', 'fixed'],
  shape: ['few', 'grid', 'stack', 'swarm']
};
export const TODAY = { where: 'far', carrier: 'charge', told: 'program', shape: 'few' };
export const TRAITS = ['energy', 'flex', 'exact', 'rugged', 'adapt'];

/* each option against today's computer: a factor per trait, above 1 better (missing: 1) */
export const EFFECT = {
  where: {
    far: {},
    near: { energy: 1.5, rugged: 0.85 },
    in: { energy: 3, flex: 0.35, exact: 0.5 },
    flow: { energy: 2, flex: 0.55, adapt: 0.8 }
  },
  carrier: {
    charge: {},
    light: { energy: 2, flex: 0.6, exact: 0.4, rugged: 1.3 },
    spikes: { energy: 1.5, flex: 0.45, exact: 0.5, adapt: 1.6, idle: true },
    reversible: { energy: 1.8, flex: 0.7, rugged: 0.8, adapt: 0.5 },
    living: { energy: 8, flex: 0.1, exact: 0.08, rugged: 0.05, adapt: 4 }
  },
  told: {
    program: {},
    graph: { energy: 2, flex: 0.6, adapt: 0.7 },
    events: { energy: 1.3, flex: 0.5, adapt: 1.2, idle: true },
    learns: { energy: 1.3, flex: 0.8, exact: 0.4, rugged: 1.3, adapt: 3 },
    fixed: { energy: 6, flex: 0.04, adapt: 0.05 }
  },
  shape: {
    few: {},
    grid: { energy: 1.3, flex: 0.85, rugged: 1.1 },
    stack: { energy: 1.4, rugged: 0.6 },
    swarm: { energy: 0.9, flex: 0.9, rugged: 3, adapt: 1.4 }
  }
};
/* each option's carry contract (docs/PATH.md, "Architectures: the frontier of the path"; #444): a recipe is a set of
   forks in your stack (src/engines/path.js), and a forked rung hands up the same fields as the rung it replaces. What
   an option changes in that contract is written here, beside its traits; its energy never is: a forked rung's energy
   is the replaced rung's divided by the option's own energy factor (forkEnergy, from EFFECT), so the stack and this
   engine share one factor and cannot drift apart.
     carrier  matter: the lattice's column it is made of (src/data/lattice.js MATTERS); delay: its gates' delay against
              today's silicon gate (as today's, the prototype's guess; living neurons fire in milliseconds where a gate
              switches in picoseconds, about a million times slower); skips: the rungs it goes past without building them (neurons learn without gates:
              the lattice marks those cells past), its contract handed up at the last of them
     where    latency: seconds from the machine's cores to the memory they read (far: across the board; else beside it)
     told     stages: whether the chip's pipeline stages are yours to choose (a program, one instruction after another);
              otherwise it runs in one stage, laid out or wired once
     shape    units: the machine's units at each of the stack's three settings (path.js CHOICES.ui)
   fact: the facts.json entry that backs a fork's contract. None does yet: every fork's contract is a guess (forkFact),
   until a fact backs it. Today's options are not forks: charge is the switch engine's, the rest an idea drawn. */
export const CARRY = {
  where: {
    far: { latency: 80e-9 },
    near: { latency: 3e-9, fact: null },
    in: { latency: 3e-9, fact: null },
    flow: { latency: 3e-9, fact: null }
  },
  carrier: {
    charge: { matter: 'silicon' },
    light: { matter: 'light', delay: 1, fact: null },
    spikes: { matter: 'silicon', delay: 1, fact: null },
    reversible: { matter: 'silicon', delay: 1, fact: null },
    living: { matter: 'neurons', delay: 1e6, skips: ['switch', 'gate', 'block', 'chip'], fact: null }
  },
  told: {
    program: { stages: true },
    graph: { stages: false, fact: null },
    events: { stages: false, fact: null },
    learns: { stages: false, fact: null },
    fixed: { stages: false, fact: null }
  },
  shape: {
    few: { units: [1, 4, 8] },
    grid: { units: [16, 64, 256], fact: null },
    stack: { units: [8, 16, 32], fact: null },
    swarm: { units: [100, 1000, 10000], fact: null }
  }
};
/* the open genome (docs/PATH.md, "Architectures: the frontier of the path"; #452): genes and options are data, so
   anyone, a person or an agent, can propose a new option for a gene (a carrier, a way of telling, a shape, a place to
   compute) with its trait effects, in EFFECT's form, and its carry contract, in CARRY's form, as an entry of the
   community's ledger (kind gene, src/engines/ledger.js). It is a guess until a fact (src/data/facts.json, named by the
   proposal and checked by the tests) backs it, and the engine grows it only once a pull request adopts it into OPTIONS
   with that fact. CONTRACT: what each gene's contract gives, the range each field is read in, and which can be left out
     matter  a column of the lattice (src/data/lattice.js MATTERS; yours, for matter nobody has put in the lab yet)
     rungs   the rungs a carrier goes past, in order, without building them */
export const CONTRACT = {
  carrier: { matter: { matter: true }, delay: { min: 1e-6, max: 1e9 }, skips: { rungs: ['switch', 'gate', 'block', 'chip'], optional: true } },
  where: { latency: { min: 1e-12, max: 1e-3 } },
  told: { stages: { bool: true } },
  shape: { units: { units: 3, min: 1, max: 1e7 } }
};
export const OPTION_ID = /^[a-z][a-z0-9-]{1,23}$/, TRAIT_RANGE = [0.01, 100];
const num = (x, a, b) => typeof x === 'number' && Number.isFinite(x) && x >= a && x <= b;
function fieldOk(spec, v) {
  if (spec.matter) return typeof v === 'string' && MATTERS.includes(v);
  if (spec.bool) return typeof v === 'boolean';
  if (spec.rungs) return Array.isArray(v) && v.length >= 1 && v.every((r, i) => spec.rungs.includes(r) && (!i || spec.rungs.indexOf(r) > spec.rungs.indexOf(v[i - 1])));
  if (spec.units) return Array.isArray(v) && v.length === spec.units && v.every((u, i) => Number.isInteger(u) && num(u, spec.min, spec.max) && (!i || u > v[i - 1]));
  return num(v, spec.min, spec.max);
}
/* what a proposal lacks, or null when it is complete: the gene, a new option's id, its trait effects (at least one trait,
   each a factor against today's computer; idle for a gain when the need is rarely busy) and its carry contract (every
   field its gene's contract gives, none other) */
export function proposalWhy(p) {
  const isRec = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  if (!isRec(p) || typeof p.gene !== 'string' || !Object.hasOwn(CONTRACT, p.gene)) return 'gene';
  if (typeof p.option !== 'string' || !OPTION_ID.test(p.option) || OPTIONS[p.gene].includes(p.option)) return 'option';
  const e = p.effect;
  if (!isRec(e) || !Object.keys(e).length || !Object.keys(e).some(k => TRAITS.includes(k)) || !Object.entries(e).every(([k, v]) => (TRAITS.includes(k) && num(v, TRAIT_RANGE[0], TRAIT_RANGE[1])) || (k === 'idle' && v === true))) return 'effect';
  const C = CONTRACT[p.gene], c = p.carry;
  if (!isRec(c) || Object.keys(c).some(k => !Object.hasOwn(C, k)) || !Object.entries(C).every(([k, spec]) => (c[k] == null && spec.optional) || fieldOk(spec, c[k]))) return 'carry';
  return null;
}
/* is this option a fork from today's computer, and is its contract still a guess (no fact backs it) */
export const isFork = (gene, option) => TODAY[gene] !== option;
export const forkFact = (gene, option) => (isFork(gene, option) && CARRY[gene] && CARRY[gene][option] ? CARRY[gene][option].fact || null : null);
/* the energy factor a fork divides its rung's energy by: the option alone against today's computer, for a need (the
   idle gain of spikes and events counts where a need is rarely busy) */
export const forkEnergy = (gene, option, need) => traitsOf(Object.assign({}, TODAY, { [gene]: option }), need).energy;

/* the custom circuit's cap, against the one study's figure (facts.json asic-vs-cpu) */
export const FIXED_CAP = 6, FIXED_FACT = 'asic-vs-cpu';
/* how much more an idle-spending option gains where a need is rarely busy: (steady / its activity)^IDLE */
export const IDLE = 0.25;

/* the needs: Machines' four (src/data/blocks.js), and two more: any program, and a large model to train and serve */
export const NEEDS = ['any', 'model', 'hearing', 'wildfire', 'rover', 'radio'];
const MACHINE = Object.fromEntries(MACHINE_NEEDS.map(n => [n.id, n]));
export const activityOf = need => ACTIVITY[(MACHINE[need] || {}).activity || 'steady'];
/* what each need weighs (the power each trait is raised to) and what it must have */
export const WANT = {
  any: { w: { flex: 2, energy: 0.4 }, must: { exact: 0.9, flex: 0.5 } },
  model: { w: { energy: 1, flex: 0.4, adapt: 0.2 }, must: { flex: 0.2 } },
  hearing: { w: { energy: 0.7, adapt: 0.3 }, must: { adapt: 0.6 } },
  wildfire: { w: { energy: 0.7, rugged: 0.4 }, must: {} },
  rover: { w: { rugged: 1.2, energy: 0.4, adapt: 0.3 }, must: { exact: 0.9, rugged: 0.7 } },
  radio: { w: { adapt: 1, energy: 0.6, flex: 0.3 }, must: { exact: 0.9, adapt: 0.7 } }
};

/* the directions of improvement, and what each need depends on (weights add to 1) */
export const DIRS = ['device', 'memory', 'tools', 'errors', 'making'];
export const NEED_DIRS = {
  any: { tools: 0.35, memory: 0.2, device: 0.15, making: 0.15, errors: 0.15 },
  model: { memory: 0.3, device: 0.2, tools: 0.2, making: 0.2, errors: 0.1 },
  hearing: { device: 0.3, making: 0.25, memory: 0.15, tools: 0.15, errors: 0.15 },
  wildfire: { device: 0.3, making: 0.25, errors: 0.2, tools: 0.15, memory: 0.1 },
  rover: { errors: 0.35, device: 0.2, making: 0.15, tools: 0.15, memory: 0.15 },
  radio: { device: 0.25, tools: 0.25, memory: 0.2, making: 0.15, errors: 0.15 }
};
/* a changed gene's main direction and its second one */
export const LINK = { where: ['memory', 'tools'], carrier: ['device', 'making'], told: ['tools', 'errors'], shape: ['making', 'errors'] };
export const START_MAIN = 0.05, START_SIDE = 0.4, UNBUILT = 0.25;
/* living matter is grown, not made in a fab (src/data/inventions.js, grown): making it starts further behind still */
export const GROWN = 0.1;
/* growth: each doubling of attempts in a direction multiplies it by 2^GROWTH (Wright's law's shape, facts.json wright-law) */
export const GROWTH = 0.45, A0 = 10, GROWTH_FACT = 'wright-law';
/* a recipe someone has built starts further along: in products, or shown in a lab */
export const BUILT_BOOST = { product: 4, lab: 1.8 };
/* people: attempts a year each, the start, what an attempt put into people brings, and the share who join a win */
export const ATTEMPTS = 30, PEOPLE_START = 4, PER_PERSON = 25, JOIN = 1;
/* today's computer keeps getting better, a little each year */
export const TODAY_GAIN = 1.03;
/* the goals: the years each is played within, and how many needs it must win at once */
export const GOALS = { archniche: { needs: 1, years: 25 }, archspread: { needs: 3, years: 40 } };
export const FOCUS_MAX = 2;

/* the recipes someone has built, each with how far along it is and the fact it rests on */
export const KNOWN = [
  { id: 'cpu', g: TODAY, status: 'product', fact: null },
  { id: 'gpu', g: { where: 'far', carrier: 'charge', told: 'program', shape: 'grid' }, status: 'product', fact: 'alexnet-gpu' },
  { id: 'asic', g: { where: 'far', carrier: 'charge', told: 'fixed', shape: 'few' }, status: 'product', fact: 'asic-vs-cpu' },
  { id: 'tpu', g: { where: 'flow', carrier: 'charge', told: 'graph', shape: 'grid' }, status: 'product', fact: 'tpu-ironwood' },
  { id: 'wafer', g: { where: 'near', carrier: 'charge', told: 'graph', shape: 'grid' }, status: 'product', fact: 'cerebras-cs4' },
  { id: 'photonic', g: { where: 'flow', carrier: 'light', told: 'graph', shape: 'grid' }, status: 'product', fact: 'qant-photonic' },
  { id: 'neuro', g: { where: 'near', carrier: 'spikes', told: 'events', shape: 'grid' }, status: 'lab', fact: 'hala-point' },
  { id: 'cim', g: { where: 'in', carrier: 'charge', told: 'learns', shape: 'grid' }, status: 'lab', fact: null },
  { id: 'living', g: { where: 'near', carrier: 'living', told: 'learns', shape: 'swarm' }, status: 'product', fact: 'cortical-cl1' },
  { id: 'reversible', g: { where: 'far', carrier: 'reversible', told: 'fixed', shape: 'few' }, status: 'lab', fact: 'vaire-ice-river' }
];
export const keyOf = g => GENES.map(k => g[k]).join('/');
export const knownOf = g => KNOWN.find(k => keyOf(k.g) === keyOf(g)) || null;
export const RECIPES = OPTIONS.where.length * OPTIONS.carrier.length * OPTIONS.told.length * OPTIONS.shape.length;
export const normal = g => Object.fromEntries(GENES.map(k => [k, OPTIONS[k].includes((g || {})[k]) ? g[k] : TODAY[k]]));
/* how many genes differ from today's computer */
export const novelty = g => GENES.filter(k => g[k] !== TODAY[k]).length;
/* every recipe, for the map: carrier and where across, told and shape down */
export function allRecipes() {
  const out = [];
  for (const told of OPTIONS.told) for (const shape of OPTIONS.shape) for (const carrier of OPTIONS.carrier) for (const where of OPTIONS.where) out.push({ where, carrier, told, shape });
  return out;
}

/* ---- stepping stones: a challenge won in the lab where a direction is improved raises its start once ----
   Each direction's challenges, the first the one its card leads into; two are not challenges: your switch kept at the
   switch level when it spends less than silicon (KEPT_SWITCH, src/v2/kept.js), and an entry of yours in the
   community's record (LEDGER_ENTRY). Ids only: the lab names them */
export const KEPT_SWITCH = 'kept-switch', LEDGER_ENTRY = 'ledger-entry';
export const STONES = {
  device: ['transistor', KEPT_SWITCH],
  memory: ['cim', 'dataflow'],
  tools: ['rvrun', 'corearch'],
  errors: ['flaky'],
  making: ['litho-finest', 'etch', 'euv-1000', 'bottom', 'furnace', 'shallow', 'vias'],
  people: [LEDGER_ENTRY]
};
/* a direction's start times STONE (up to today's level); people at the start times STONE_PEOPLE */
export const STONE = 1.4, STONE_PEOPLE = 1.25;
/* the stones brought, from the challenges won (an object of ids, as the player's S.done, or a list): { direction: id },
   the first won of each direction's list */
export function broughtOf(done) {
  const has = Array.isArray(done) ? id => done.includes(id) : id => !!(done && done[id]), out = {};
  for (const d of Object.keys(STONES)) { const id = STONES[d].find(has); if (id) out[d] = id; }
  return out;
}
const stoneOf = (stones, d) => (stones && stones[d] && STONES[d] && STONES[d].includes(stones[d]) ? STONE : 1);

/* ---- what a recipe could become ---- */
export function traitsOf(g, need) {
  const T = Object.fromEntries(TRAITS.map(k => [k, 1])), idle = need ? Math.pow(ACTIVITY.steady / activityOf(need), IDLE) : 1;
  for (const k of GENES) {
    const e = EFFECT[k][g[k]] || {};
    for (const tr of TRAITS) if (e[tr] != null) T[tr] *= e[tr];
    if (e.idle) T.energy *= idle;
  }
  return T;
}
/* the traits a need requires and the recipe lacks */
export function missesOf(g, need) { const T = traitsOf(g, need), m = WANT[need].must; return Object.keys(m).filter(k => T[k] < m[k]); }
/* what it could become against today's computer, once as polished: 0 when it cannot do the need at all */
export function potentialOf(g, need) {
  if (missesOf(g, need).length) return 0;
  const T = traitsOf(g, need), w = WANT[need].w;
  return Object.keys(w).reduce((p, k) => p * Math.pow(T[k], w[k]), 1);
}

/* ---- how polished it is ---- */
export function startOf(g, stones) {
  const s = Object.fromEntries(DIRS.map(d => [d, 1])), kn = knownOf(g), boost = kn && novelty(g) ? BUILT_BOOST[kn.status] : 1;
  for (const k of GENES) if (g[k] !== TODAY[k]) { s[LINK[k][0]] *= START_MAIN; s[LINK[k][1]] *= START_SIDE; }
  if (!kn && novelty(g)) for (const d of DIRS) s[d] *= UNBUILT;
  if (g.carrier === 'living') s.making *= GROWN;
  for (const d of DIRS) s[d] = Math.min(1, s[d] * boost * stoneOf(stones, d));
  return s;
}
export const grow = (start, attempts) => Math.min(1, start * Math.pow(1 + attempts / A0, GROWTH));
export const maturityOf = st => Object.fromEntries(DIRS.map(d => [d, grow(st.start[d], st.tries[d])]));
export const needMaturity = (mat, need) => Object.entries(NEED_DIRS[need]).reduce((p, [d, w]) => p * Math.pow(mat[d], w), 1);
export const todayAt = year => Math.pow(TODAY_GAIN, year);
/* against today's computer, need by need: { need: { now, could, wins } } */
export function scoreOf(st) {
  const mat = maturityOf(st), bar = todayAt(st.year), out = {};
  /* today's recipe is today's computer: level with itself, whatever the year */
  if (!novelty(st.g)) { for (const n of NEEDS) out[n] = { now: 1, could: 1, can: true, wins: false }; return out; }
  for (const n of NEEDS) { const p = potentialOf(st.g, n), now = p * needMaturity(mat, n) / bar; out[n] = { now, could: p / bar, can: p > 0, wins: now >= 1 }; }
  return out;
}
export const winsOf = st => NEEDS.filter(n => scoreOf(st)[n].wins);

/* ---- a game ---- */
export function start(g, stones) {
  const gg = normal(g), kept = {};
  for (const d of Object.keys(stones || {})) if (stoneOf(stones, d) > 1) kept[d] = stones[d];
  return { g: gg, start: startOf(gg, kept), tries: Object.fromEntries(DIRS.map(d => [d, 0])), year: 0, people: PEOPLE_START * (kept.people ? STONE_PEOPLE : 1), won: [], best: {}, log: [], stones: kept };
}
/* stones brought back in the middle of a game (a challenge won since): each new one raises its direction once */
export function bring(st, stones) {
  const s = clone(st);
  for (const d of Object.keys(stones || {})) {
    if (s.stones[d] || stoneOf(stones, d) === 1) continue;
    s.stones[d] = stones[d];
    if (d === 'people') s.people *= STONE_PEOPLE; else s.start[d] = Math.min(1, s.start[d] * STONE);
  }
  return s;
}
/* one year: this year's attempts split between the focused directions ('people' among them); then those who join a win */
export function year(st, focus) {
  const f = (focus || []).filter(d => DIRS.includes(d) || d === 'people').slice(0, FOCUS_MAX);
  const s = clone(st), total = s.people * ATTEMPTS, share = f.length ? total / f.length : 0, before = winsOf(st);
  for (const d of f) if (d === 'people') s.people += share / PER_PERSON; else s.tries[d] += share;
  s.year += 1;
  const after = winsOf(s), fresh = after.filter(n => !before.includes(n));
  if (fresh.length) s.people *= Math.pow(1 + JOIN, fresh.length);
  for (const n of after) if (!s.won.includes(n)) s.won.push(n);
  const sc = scoreOf(s); for (const n of NEEDS) s.best[n] = Math.max(s.best[n] || 0, sc[n].now);
  /* the year's line: where its attempts went, the needs won for the first time, and the best need's score after it */
  s.log.push({ year: s.year, focus: f, fresh, attempts: Math.round(total), best: Math.max(...NEEDS.map(n => sc[n].now)) });
  return s;
}
/* a fork: one gene changed; the directions it leads lose what was learned in them, the rest is kept */
export function forkOf(st, gene, option) {
  if (!GENES.includes(gene) || !OPTIONS[gene].includes(option)) return clone(st);
  const s = clone(st), g = Object.assign({}, s.g, { [gene]: option }), fresh = startOf(g, s.stones);
  const lost = new Set();
  for (const k of GENES) if (g[k] !== st.g[k]) LINK[k].forEach(d => lost.add(d));
  s.g = g;
  for (const d of DIRS) { if (lost.has(d)) { s.start[d] = fresh[d]; s.tries[d] = 0; } else s.start[d] = Math.max(s.start[d], fresh[d]); }
  return s;
}
/* before the first year a gene is chosen freely: a new start */
export const choose = (st, gene, option) => (st.year ? forkOf(st, gene, option) : start(Object.assign({}, st.g, { [gene]: option }), st.stones));
/* the agents' forks: every one-gene change that keeps the recipe one nobody has built, at least two genes from today's
   (the goals' rule), scored by how many needs it could win once polished, then by where it stands now; the three
   best, each changing a different gene where it can. They propose; the person decides */
export function agentForks(st, n = 3) {
  const now = scoreOf(st), cands = [];
  for (const k of GENES) for (const o of OPTIONS[k]) {
    if (o === st.g[k]) continue;
    const f = forkOf(st, k, o);
    if (knownOf(f.g) || novelty(f.g) < 2) continue;
    const sc = scoreOf(f), could = NEEDS.filter(x => sc[x].could >= 1), bestNow = Math.max(...NEEDS.map(x => sc[x].now));
    cands.push({ gene: k, option: o, could: could.length, now: bestNow, lost: LINK[k].filter(d => st.tries[d] > 0), gain: could.filter(x => now[x].could < 1) });
  }
  cands.sort((a, b) => b.could - a.could || b.now - a.now);
  const out = [], genes = new Set();
  for (const c of cands) { if (out.length >= n) break; if (!genes.has(c.gene)) { out.push(c); genes.add(c.gene); } }
  for (const c of cands) { if (out.length >= n) break; if (!out.includes(c)) out.push(c); }
  return out;
}
/* a goal is met by a recipe nobody has built, at least two genes from today's, winning enough needs at once in time */
export function goalOf(st, id) {
  const G = GOALS[id] || GOALS.archniche, wins = winsOf(st), fresh = !knownOf(st.g), far = novelty(st.g) >= 2, time = st.year <= G.years;
  return { wins: wins.length, needs: G.needs, fresh, far, time, years: G.years, met: fresh && far && time && wins.length >= G.needs };
}
/* the best direction for a need now: where one more year's attempts would raise it most */
const needNow = (st, need) => potentialOf(st.g, need) * needMaturity(maturityOf(st), need);
export function bestDir(st, need) {
  let best = DIRS[0], gain = -1;
  const base = Math.max(1e-12, needNow(st, need)), add = st.people * ATTEMPTS;
  for (const d of DIRS) { const tr = Object.assign({}, st.tries, { [d]: st.tries[d] + add }), v = needNow({ g: st.g, start: st.start, tries: tr }, need) / base; if (v > gain) { gain = v; best = d; } }
  return best;
}

/* the need to work on next for a goal: of the needs this recipe could win once polished, the most promising ones the
   goal asks for, the one not yet won that is furthest behind (or, if it could win none, the closest) */
export function targetOf(st, id) {
  const sc = scoreOf(st), G = GOALS[id] || GOALS.archniche;
  const want = NEEDS.filter(n => sc[n].could >= 1).sort((a, b) => sc[b].could - sc[a].could).slice(0, G.needs);
  if (!want.length) return NEEDS.reduce((m, n) => (sc[n].could > sc[m].could ? n : m), NEEDS[0]);
  return want.filter(n => !sc[n].wins).sort((a, b) => sc[a].now - sc[b].now)[0] || want[0];
}
/* the engine's suggestion: that need, and the one or two directions that would raise it most this year */
export function suggest(st, id) {
  const need = targetOf(st, id), d1 = bestDir(st, need), d2 = bestDir(year(st, [d1]), need);
  return { need, dirs: d1 === d2 ? [d1] : [d1, d2] };
}

/* ---- the family tree: every start and fork of a visit ----
   { nodes, cur }: a node is { id, from, how, g, at, grown, won }: from is the node it came from (null for a start from
   nothing: the map, or the recipe chosen before the first year), how is 'start', 'fork' (a gene changed while
   growing) or 'back' (a new start from a node of the tree), g is the recipe's key (keyOf), at the year it was made,
   grown the years grown on it, won the needs it won. Plain data, no words: what a ledger entry could carry */
export const treeOf = g => ({ nodes: [{ id: 0, from: null, how: 'start', g: keyOf(normal(g)), at: 0, grown: 0, won: [] }], cur: 0 });
const treeCopy = T => ({ nodes: T.nodes.map(n => Object.assign({}, n, { won: n.won.slice() })), cur: T.cur });
export const nodeOf = (T, id) => T.nodes.find(n => n.id === id) || null;
export const recipeOf = key => { const [where, carrier, told, shape] = String(key).split('/'); return normal({ where, carrier, told, shape }); };
/* a new start: from nothing (from null) or from a node (a way back). A start nothing has grown yet, with nothing
   branched from it, is only being chosen: it takes the new recipe in place */
export function treeStart(T, g, from = null) {
  const R = treeCopy(T), cur = nodeOf(R, R.cur), key = keyOf(normal(g));
  if (cur && !cur.grown && cur.how !== 'fork' && !R.nodes.some(n => n.from === cur.id)) {
    cur.g = key; if (from != null && from !== cur.id && nodeOf(R, from)) { cur.from = from; cur.how = 'back'; }
    return R;
  }
  const id = R.nodes.length ? Math.max(...R.nodes.map(n => n.id)) + 1 : 0, back = from != null && nodeOf(R, from);
  R.nodes.push({ id, from: back ? from : null, how: back ? 'back' : 'start', g: key, at: 0, grown: 0, won: [] }); R.cur = id;
  return R;
}
/* a fork from the current node, in the year it was made */
export function treeFork(T, g, at) {
  const R = treeCopy(T), id = Math.max(...R.nodes.map(n => n.id)) + 1;
  R.nodes.push({ id, from: R.cur, how: 'fork', g: keyOf(normal(g)), at, grown: 0, won: [] }); R.cur = id;
  return R;
}
/* a year grown on the current node, and the needs it wins after it */
export function treeYear(T, wins) {
  const R = treeCopy(T), n = nodeOf(R, R.cur);
  if (n) { n.grown += 1; for (const w of wins || []) if (!n.won.includes(w)) n.won.push(w); }
  return R;
}
/* the line the current node grew along: it and the forks it came from, back to its start (oldest first) */
export function lineOf(T) {
  const out = []; let n = nodeOf(T, T.cur);
  while (n) { out.unshift(n); if (n.how !== 'fork') break; n = nodeOf(T, n.from); }
  return out;
}

/* ---- an attempt as a history, for the ledger (#410) ----
   What a visit did along one line of the tree, enough to grow it again: the recipe it started from (start, a key), the
   stepping stones it began with (stones: { direction: id }), the focus of each year in order (years: a list a year, at
   most FOCUS_MAX directions or 'people'), the changes between years in the order they were made (changes: a fork
   { at, gene, option } or a stone brought back { at, stone }, at the years grown before it), and the needs its recipe
   wins at the end (wins: the claim). replay grows it again with this engine, so anyone can check a claim; the ledger
   (src/engines/ledger.js) refuses a claimed win the replay does not reach. Plain data, no words */
export const HIST_YEARS = Math.max(...Object.values(GOALS).map(G => G.years)), HIST_CHANGES = 40;
const HIST_KEYS = ['start', 'stones', 'years', 'changes', 'wins'];
const rec = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const keysIn = (o, list) => Object.keys(o).every(k => list.includes(k));
export const isKey = k => typeof k === 'string' && k.split('/').length === GENES.length && GENES.every((g, i) => OPTIONS[g].includes(k.split('/')[i]));
export const stoneDirOf = id => Object.keys(STONES).find(d => STONES[d].includes(id)) || null;
/* a new history from a game's state at its start (year 0: everything before the first year is the start) */
export const histOf = st => ({ start: keyOf(st.g), stones: Object.assign({}, st.stones || {}), years: [], changes: [] });
/* is it a history the engine can grow: every field in its form, nothing else (a claim of wins included, maybe empty) */
export function histOk(h, needWins = true) {
  if (!rec(h) || !keysIn(h, HIST_KEYS) || !isKey(h.start)) return false;
  const S = h.stones == null ? {} : h.stones;
  if (!rec(S) || !Object.entries(S).every(([d, id]) => Object.hasOwn(STONES, d) && STONES[d].includes(id))) return false;
  if (!Array.isArray(h.years) || h.years.length < 1 || h.years.length > HIST_YEARS) return false;
  if (!h.years.every(f => Array.isArray(f) && f.length <= FOCUS_MAX && new Set(f).size === f.length && f.every(d => DIRS.includes(d) || d === 'people'))) return false;
  const C = h.changes == null ? [] : h.changes;
  if (!Array.isArray(C) || C.length > HIST_CHANGES) return false;
  let at = 1;
  for (const c of C) {
    if (!rec(c) || !Number.isInteger(c.at) || c.at < at || c.at > h.years.length) return false;
    at = c.at;
    if (c.stone != null ? !(keysIn(c, ['at', 'stone']) && stoneDirOf(c.stone)) : !(keysIn(c, ['at', 'gene', 'option']) && GENES.includes(c.gene) && OPTIONS[c.gene].includes(c.option))) return false;
  }
  if (h.wins == null) return !needWins;
  return Array.isArray(h.wins) && h.wins.length <= NEEDS.length && new Set(h.wins).size === h.wins.length && h.wins.every(n => NEEDS.includes(n));
}
/* grow a history again: the state it ends in, and the needs its recipe wins then. Only for a history histOk accepts */
export function replay(h) {
  let s = start(recipeOf(h.start), h.stones || {}), i = 0;
  const C = h.changes || [];
  for (let y = 0; y <= h.years.length; y++) {
    for (; i < C.length && C[i].at === y; i++) { const c = C[i]; s = c.stone != null ? bring(s, { [stoneDirOf(c.stone)]: c.stone }) : forkOf(s, c.gene, c.option); }
    if (y < h.years.length) s = year(s, h.years[y]);
  }
  return { st: s, wins: winsOf(s) };
}
/* the history as a ledger entry carries it, with the needs it claims: empty stones and changes left out */
export const histClaim = (h, wins) => Object.assign({ start: h.start }, Object.keys(h.stones || {}).length ? { stones: Object.assign({}, h.stones) } : {}, { years: h.years.map(f => f.slice()) },
  (h.changes || []).length ? { changes: h.changes.map(c => Object.assign({}, c)) } : {}, { wins: NEEDS.filter(n => (wins || []).includes(n)) });
/* the same attempt written twice is one: the start, the stones, each year's focus in any order, the changes */
export const histKey = h => JSON.stringify([h.start, Object.entries(h.stones || {}).sort(), h.years.map(f => f.slice().sort()), (h.changes || []).map(c => c.stone != null ? [c.at, c.stone] : [c.at, c.gene, c.option])]);

function clone(st) { return { g: Object.assign({}, st.g), start: Object.assign({}, st.start), tries: Object.assign({}, st.tries), year: st.year, people: st.people, won: st.won.slice(), best: Object.assign({}, st.best), log: st.log.slice(), stones: Object.assign({}, st.stones || {}) }; }
