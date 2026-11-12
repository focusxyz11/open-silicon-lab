/* The chip world as a game that grows. Pure logic, no DOM; tests in tests/game.test.mjs.

   The main thread is a chip's life, a loop: design, make, test, ship, use; and what fails goes back to
   design. Each step has a station on the island, and every station offers the same three doors:
     Do   challenges, each checked for real by one of the lab's engines (a circuit by the tiny-chip engine,
          a chip's settings by src/engines/chip.js, a chip's life by src/engines/life.js);
     Look ways inside: a place to fly through, a line to follow, a chip to read;
     Ask  open questions (stops of the threads) and debates.
   What you finish grows the island (GROWTH). What the community builds grows it too: the shared computer at
   the Lab rises with every piece of the plan that is built (src/data/build.js), community designs stand as
   workshops in the makers' village, and every open job is an empty plot anyone, person or AI, can take.
   To add content, add data here (a challenge, a door, a growth) or in src/data/build.js; the island and the
   pages are drawn from it. Words: game.*, look.*, grow.* (src/i18n/en.json). */
import { build, projectOf, solutionOf } from '../engines/design.js';
import { model, CHALLENGES as CHIP, START, normal, SETTINGS } from '../engines/chip.js';
import { live, PERFECT, normalLife } from '../engines/life.js';
import { plan, progress, needOf, childrenOf, designsFor } from '../engines/build.js';
import { NEEDS, DESIGNS, AGENT } from '../data/build.js';
import { DEBATES } from '../data/debates.js';
import { WAYS } from '../data/ways.js';

/* the loop, in order, and the station of each step on the island */
export const STEPS = ['design', 'make', 'test', 'ship', 'use'];
export const STATION = { design: 'studio', make: 'fab', test: 'test', ship: 'port', use: 'datacentre' };
export const STEP_OF = Object.fromEntries(Object.entries(STATION).map(([s, p]) => [p, s]));
/* places that are not a step: the start of making, the community, and the islands across the sea */
export const PLACES = ['studio', 'quarry', 'fab', 'test', 'port', 'datacentre', 'lab', 'village', 'phones', 'cars', 'idea'];
export const STEP_PLACE = { quarry: 'make' };

/* a circuit's starting description: the job's own, or one that is almost right (a fix-it job) */
const STARTERS = { half: 'sum = a | b;\ncarry = a & b;' };
export const starter = p => STARTERS[p] || projectOf(p).starter;
export const ownStarter = p => p in STARTERS;   /* its words: game.own.<p> */

/* Do: the challenges. kind: 'design' (write a circuit; p: its job), 'chip' (reach a goal of chip.js with
   your chip's settings; goal: its id), 'life' (ship a chip that lives through a place's life; mission),
   'spot' (find the broken chip with a few test patterns). grows: what appears on the island. */
export const CHALLENGES = [
  { id: 'half', step: 'design', kind: 'design', p: 'half', grows: 'studio-screen' },
  { id: 'vote', step: 'design', kind: 'design', p: 'vote', grows: 'studio-garden' },
  { id: 'full', step: 'design', kind: 'design', p: 'full', grows: 'studio-wing' },
  { id: 'months', step: 'make', kind: 'chip', goal: 'months', grows: 'fab-trucks' },
  { id: 'quick', step: 'make', kind: 'chip', goal: 'quick', grows: 'fab-line' },
  { id: 'spot', step: 'test', kind: 'spot', p: 'full', grows: 'test-probe' },
  { id: 'cores', step: 'test', kind: 'chip', goal: 'cores', grows: 'test-hall' },
  { id: 'phone', step: 'ship', kind: 'life', mission: 'phone', grows: 'island-phones' },
  { id: 'car', step: 'ship', kind: 'life', mission: 'car', grows: 'island-cars' },
  { id: 'dclife', step: 'ship', kind: 'life', mission: 'datacentre', grows: 'dc-hall' },
  { id: 'fed', step: 'use', kind: 'chip', goal: 'fed', grows: 'dc-solar' },
  { id: 'fast', step: 'use', kind: 'chip', goal: 'fast', grows: 'clock-tower' }
];
export const challengeOf = id => CHALLENGES.find(c => c.id === id) || null;
export const chipGoal = id => CHIP.find(c => c.id === id);
/* what grows, and where (the island draws each one: src/v2/map3d.js GROWERS) */
const GROW_AT = { phone: 'phones', car: 'cars', dclife: 'datacentre', fast: 'lab' };
export const GROWTH = CHALLENGES.map(c => ({ id: c.grows, by: c.id, at: GROW_AT[c.id] || STATION[c.step] }));

/* Ask: the stops whose questions belong at each place (stop.<key>.q), and the debates there */
export const ASK = {
  studio: ['idea.need', 'divide.need', 'divide.layout'], quarry: ['make.crystal', 'strange.crystal', 'know.crystal'],
  fab: ['make.clean', 'scale.clean', 'scale.print', 'fail.print', 'make.etch', 'know.etch'], test: ['fail.test', 'divide.test', 'fail.etch'],
  port: ['divide.ship', 'open.ship', 'fail.ship', 'make.pkg', 'divide.pkg', 'fail.pkg'],
  datacentre: ['life.building', 'divide.building', 'fail.building', 'scale.building', 'think.rack', 'think.board', 'think.chip'],
  lab: ['open.need', 'open.layout', 'open.clean'], village: ['open.need'],
  phones: ['divide.phone', 'life.phone', 'know.phone'], cars: ['fail.car', 'divide.car', 'know.car', 'life.car', 'fail.ecu'], idea: []
};
export const DEBATES_AT = {
  studio: ['designcost', 'signoff', 'skills'], fab: ['shrink'], test: ['bigdie'], port: ['supply'], datacentre: ['memory', 'power', 'paradigm', 'quantum'],
  lab: ['open'], cars: ['mature'], phones: [], quarry: [], village: [], idea: []
};
/* the other ways to compute belong where people imagine what comes next: the Lab */
export const WAYS_AT = { lab: WAYS.map(w => w.id) };
/* Look: the ways inside each place. to: a place of the redesign (#/place/<id>), or the current site
   (world, depth, map). Words: look.<id>.t / .d */
export const LOOK = {
  studio: [{ id: 'studio', world: 'design', depth: 'need' }],
  quarry: [{ id: 'crystal', world: 'journey', depth: 'crystal' }],
  fab: [{ id: 'line', world: 'journey', depth: 'clean' }, { id: 'print', world: 'journey', depth: 'print' }],
  test: [{ id: 'probe', world: 'journey', depth: 'test' }],
  port: [{ id: 'supply', world: 'journey', depth: 'ship', map: true }, { id: 'package', world: 'journey', depth: 'pkg' }],
  datacentre: [{ id: 'fly', to: 'datacentre' }, { id: 'inside', world: 'datacentre', depth: 'chip' }, { id: 'floor', world: 'datacentre', depth: 'atom' }],
  lab: [{ id: 'plan', page: 'build' }], village: [{ id: 'plan', page: 'build' }],
  phones: [{ id: 'phone', world: 'phone', depth: 'phone' }], cars: [{ id: 'car', world: 'car', depth: 'car' }], idea: []
};
/* the world of the current site a stop's depth belongs to */
export const worldOfDepth = depth => ({ building: 'datacentre', rack: 'datacentre', board: 'datacentre', chip: 'datacentre', phone: 'phone', car: 'car', ecu: 'car', need: 'design', layout: 'design' }[depth] || 'journey');

/* ---- your state: what you have done, and what you were working on ---- */
export const KEY = 'osl-world-v1';
export function fresh() { return { done: {}, codes: {}, chip: Object.assign({}, START), life: {}, seen: false }; }
export function normalState(s) {
  const f = fresh();
  if (!s || typeof s !== 'object') return f;
  const done = {}; Object.keys(s.done || {}).forEach(k => { if (challengeOf(k) || k.startsWith('job:')) done[k] = true; });
  const codes = {}; Object.entries(s.codes || {}).forEach(([k, v]) => { if (typeof v === 'string') codes[k] = v.slice(0, 4000); });
  const lifeC = {}; Object.entries(s.life || {}).forEach(([k, v]) => { lifeC[k] = normalLife(v); });
  return { done, codes, chip: normal(s.chip || START), life: lifeC, seen: !!s.seen };
}
export function load(store) { try { return normalState(JSON.parse(store.getItem(KEY) || 'null')); } catch (e) { return fresh(); } }
export function save(store, s) { try { store.setItem(KEY, JSON.stringify({ done: s.done, codes: s.codes, chip: s.chip, life: s.life, seen: s.seen })); } catch (e) { /* storage unavailable */ } }

/* ---- checks: each challenge asks its engine ---- */
export function checkDesign(p, code) { return build({ p, code }); }
export function checkChip(goal, settings) { const m = model(normal(settings)); return { m, ok: !!chipGoal(goal).met(m) }; }
export function checkLife(mission, choices) { return live(mission, normalLife(choices), { coverage: 1 }); }

/* Find the broken chip: four copies of a full adder, one spoiled at the factory with a wire stuck at 0 or 1.
   You may run a few test patterns; a pattern catches the fault only if it makes the broken copy answer wrong. */
export const SPOT = { chips: 4, tests: 3 };
let spotCache = null;
export function spotCase() {
  if (spotCache) return spotCache;
  const code = solutionOf('full');
  for (let seed = 0; seed < 40; seed++) {
    const B = build({ p: 'full', code, defect: seed });
    if (!B.defect) continue;
    const wrong = B.defect.rows.filter(r => r.mis.length).length;
    /* a fault that only some patterns catch: choosing the patterns matters */
    if (wrong >= 2 && wrong <= 3) { spotCache = { seed, broken: 2, rows: B.rows, bad: B.defect.rows, ins: B.ins, outs: B.outs }; return spotCache; }
  }
  const B = build({ p: 'full', code, defect: 1 });
  return (spotCache = { seed: 1, broken: 2, rows: B.rows, bad: B.defect.rows, ins: B.ins, outs: B.outs });
}
/* what a copy answers to a pattern: the broken one answers as spoiled, the others as designed */
export const spotAnswer = (S, chip, i) => (chip === S.broken ? S.bad[i].o : S.rows[i].e);

/* ---- progress ---- */
export const isDone = (s, id) => !!s.done[id];
export const stepChallenges = step => CHALLENGES.filter(c => c.step === step);
export const stepState = (s, step) => { const L = stepChallenges(step); return { done: L.filter(c => isDone(s, c.id)).length, total: L.length }; };
/* the next thing to do: the first unfinished challenge along the loop */
export function next(s) { return CHALLENGES.find(c => !isDone(s, c.id)) || null; }
/* where your chip stands on the loop: the step of the next challenge, or the last step when all are done */
export function chipAt(s) { const n = next(s); return n ? n.step : STEPS[STEPS.length - 1]; }
/* what has grown on the island */
export function grown(s) { return new Set(GROWTH.filter(g => isDone(s, g.by)).map(g => g.id)); }

/* ---- the community: the shared computer, its built pieces, the designs, the open jobs ---- */
export function community(s) {
  const jobsDone = Object.keys(s.done).filter(k => k.startsWith('job:')).map(k => needOf(k.slice(4))).filter(n => n && n.project).map(n => n.project);
  const mine = CHALLENGES.filter(c => c.kind === 'design' && isDone(s, c.id)).map(c => c.p).concat(jobsDone);
  const P = plan(mine), pr = progress(P);
  const leaves = NEEDS.filter(n => !childrenOf(n.id).length);
  return {
    built: pr.built, total: pr.total,
    /* jobs anyone can take: pieces a design can fill, still without one */
    jobs: leaves.filter(n => P[n.id].state === 'open' && n.engine === 'logic').map(n => ({ need: n.id, p: n.project, ai: !!AGENT[n.project] })),
    /* pieces no engine can check yet: the job is to write the engine */
    engines: leaves.filter(n => P[n.id].state === 'engine').map(n => ({ need: n.id })),
    designs: DESIGNS.map(d => ({ need: d.need, title: d.title, author: d.author, kind: d.kind })),
    state: P
  };
}
export const jobOf = need => { const n = needOf(need); return n && n.project ? { id: 'job:' + need, step: null, kind: 'design', p: n.project, need, grows: null } : null; };
export const debatesAt = place => (DEBATES_AT[place] || []).filter(id => DEBATES.some(d => d.id === id));
export const aiProposal = p => AGENT[p] || null;
export { SETTINGS, START, PERFECT, designsFor };
