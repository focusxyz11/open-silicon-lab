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
import { STOPS, WORLDS } from '../data/weave.js';
import { INSIDE, placeOf, SHARED, askAt as levelStops } from '../data/places.js';

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

/* The design challenges are fixed by tapping, not typing (src/v2/play.js). Every gate in a description is a button
   that turns into the next kind (AND → OR → XOR); where the fix needs more than a gate, a tray holds pieces that
   can be added to one line and taken off again. Exactly one way leads to a right design, and the engine checks it
   after every tap. Typing stays open for anyone who wants it. */
export const TAPS = {
  half: { pieces: null },
  vote: { line: 0, pieces: ['| (a | c)', '| (a & c)', '& (a ^ c)'] },
  full: { line: 0, pieces: ['& cin', '| cin', '^ cin'] }
};
export const GATE_TURN = { '&': '|', '|': '^', '^': '&' };
/* turn the k-th gate of a description into the next kind */
export const turnGate = (code, k) => { let i = -1; return code.replace(/[&|^]/g, m => (++i === k ? GATE_TURN[m] : m)); };
/* a piece on a line, added before its ';' or taken off */
const lineOf = (code, n) => code.split('\n')[n] || '';
export const hasPiece = (code, n, piece) => lineOf(code, n).includes(' ' + piece);
export const togglePiece = (code, n, piece) => code.split('\n').map((l, i) => i !== n ? l : hasPiece(code, n, piece) ? l.replace(' ' + piece, '') : l.replace(/;?\s*$/, ' ' + piece + ';')).join('\n');

/* Do: the challenges. kind: 'design' (write a circuit; p: its job), 'chip' (reach a goal of chip.js with
   your chip's settings; goal: its id), 'life' (ship a chip that lives through a place's life; mission),
   'spot' (find the broken chip with a few test patterns). Each happens at a place and a level inside it
   (place, at: a depth of src/data/places.js), on the step of the loop it belongs to. grows: what appears. */
export const CHALLENGES = [
  { id: 'half', step: 'design', place: 'studio', at: 'logic', kind: 'design', p: 'half', grows: 'masks' },
  { id: 'vote', step: 'design', place: 'studio', at: 'check', kind: 'design', p: 'vote', grows: 'studio-screen' },
  { id: 'full', step: 'design', place: 'studio', at: 'check', kind: 'design', p: 'full', grows: 'studio-wing' },
  { id: 'months', step: 'make', place: 'fab', at: 'clean', kind: 'chip', goal: 'months', grows: 'fab-trucks' },
  { id: 'quick', step: 'make', place: 'fab', at: 'deposit', kind: 'chip', goal: 'quick', grows: 'fab-line' },
  { id: 'spot', step: 'test', place: 'test', at: 'test', kind: 'spot', p: 'full', grows: 'test-probe' },
  { id: 'cores', step: 'test', place: 'test', at: 'test', kind: 'chip', goal: 'cores', grows: 'test-hall' },
  { id: 'phone', step: 'ship', place: 'phones', at: 'soc', kind: 'life', mission: 'phone', grows: 'island-phones' },
  { id: 'car', step: 'ship', place: 'cars', at: 'mcu', kind: 'life', mission: 'car', grows: 'island-cars' },
  { id: 'dclife', step: 'ship', place: 'port', at: 'ship', kind: 'life', mission: 'datacentre', grows: 'dc-hall' },
  { id: 'fed', step: 'use', place: 'datacentre', at: 'board', kind: 'chip', goal: 'fed', grows: 'dc-solar' },
  { id: 'fast', step: 'use', place: 'datacentre', at: 'chip', kind: 'chip', goal: 'fast', grows: 'clock-tower' }
];
/* the goal of a chip challenge as gauges: each a value of your chip's model and the bound it must reach
   (ge: at least, le: at most). Together they say the same as the goal's met() in src/engines/chip.js. */
export const GAUGES = {
  months: [{ k: 'days', le: 60 }, { k: 'load', ge: 0.92 }],
  quick: [{ k: 'layers', le: 50 }, { k: 'cores', ge: 12 }],
  cores: [{ k: 'cores', ge: 20 }, { k: 'cost', le: 0.7 }],
  fed: [{ k: 'work', ge: 2.9 }, { k: 'late', le: 0 }],
  fast: [{ k: 'clock', ge: 2 }, { k: 'late', le: 0 }]
};
/* how far a gauge is toward its bound, 0..1, and whether it is there */
export function gauge(g, m) {
  const v = m[g.k], ok = g.ge != null ? v >= g.ge : v <= g.le;
  const f = ok ? 1 : g.ge != null ? Math.max(0, v / g.ge) : g.le === 0 ? 1 / (1 + v) : Math.max(0, g.le / v);
  return { v, ok, f: Math.min(1, f) };
}
/* your design, as the chip carries it: the last design challenge you finished, built by the design engine */
export function yourDesign(s) {
  const c = ['full', 'vote', 'half'].map(challengeOf).find(x => x && isDone(s, x.id)); if (!c) return null;
  const B = checkDesign(c.p, s.codes[c.p] || starter(c.p)); return B.ok ? { p: c.p, B } : null;
}
export const challengeOf = id => CHALLENGES.find(c => c.id === id) || null;
export const chipGoal = id => CHIP.find(c => c.id === id);
export const placeChallenges = place => CHALLENGES.filter(c => c.place === place);
/* what grows, and where (the island draws each one: src/v2/map3d.js GROWERS) */
const GROW_AT = { half: 'studio', phone: 'phones', car: 'cars', dclife: 'datacentre', fast: 'lab' };
export const GROWTH = CHALLENGES.map(c => ({ id: c.grows, by: c.id, at: GROW_AT[c.id] || c.place }));

/* Inside: every place's levels, one inside the next (src/data/places.js). These hold the earlier site's
   pages: each level opens there until it is redrawn here. The data centre's first levels are flown through
   (src/v2/dc3d.js; FLOWN: a depth and its level in the flight). */
export { INSIDE, placeOf, SHARED };
export const FLOWN = { datacentre: { building: 0, rack: 2, board: 4, chip: 5 } };
/* Ask: the questions at each level of a place; the Lab holds the open thread's questions, where the
   community asks them. BEACON: the one question glowing above a place. */
export function askAt(place) { return place === 'lab' ? [{ level: null, stops: Object.keys(STOPS).filter(k => k.startsWith('open.')) }] : levelStops(place); }
export const ASK = Object.fromEntries(PLACES.map(p => [p, askAt(p).flatMap(x => x.stops)]));
export const BEACON = { studio: 'idea.need', quarry: 'make.crystal', fab: 'make.clean', test: 'fail.test', port: 'divide.ship', datacentre: 'life.building', lab: 'open.need' };
export const DEBATES_AT = {
  studio: ['designcost', 'signoff', 'skills'], fab: ['shrink'], test: ['bigdie'], port: ['supply'], datacentre: ['memory', 'power', 'paradigm', 'quantum'],
  lab: ['open'], cars: ['mature'], phones: [], quarry: [], village: [], idea: []
};
/* the other ways to compute belong where people imagine what comes next: the Lab */
export const WAYS_AT = { lab: WAYS.map(w => w.id) };
/* more ways inside, besides the levels. to: a place of the redesign (#/place/<id>), page: a page, or the
   current site (world, depth, map). Words: look.<id>.t / .d */
export const LOOK = {
  port: [{ id: 'supply', page: 'supply' }],
  lab: [{ id: 'plan', page: 'build' }], village: [{ id: 'plan', page: 'build' }]
};
/* the world of the current site where a depth is drawn (the first place that holds it) */
export const worldOfDepth = depth => { for (const L of Object.values(INSIDE)) { const l = L.find(x => x.depth === depth); if (l) return l.world; } return 'journey'; };

/* ---- following a question: a thread's stops as one trail through the chip world ---- */
/* the order a trail walks: a chip in use from the building down to the atom (the data centre, then what only a
   phone or a car adds), then designed, then made */
export const DEPTH_ORDER = (() => { const o = []; WORLDS.forEach(w => w.depths.forEach(d => { if (!o.includes(d)) o.push(d); })); return o; })();
export const trail = th => DEPTH_ORDER.filter(d => STOPS[th + '.' + d]);
/* the levels of the flat dive (the earlier site's zoom, in the frame): from the chip down to the atom */
export const DIVE_LEVELS = ['chip', 'block', 'gate', 'switch', 'atom'];
/* the worlds the flat dive starts from besides the data centre: a phone, a car, and the made chip (the factory's
   machine, its wafer and a finished die), each from its own top level down to the atom */
export const DIVE_WORLD = { phone: 'phone', phoneboard: 'phone', soc: 'phone', car: 'car', ecu: 'car', mcu: 'car', scanner: 'made', wafer: 'made', die: 'made' };
/* where a level is shown in the chip world: always an address inside it, never the earlier site */
export function viewOfDepth(d) {
  if (DIVE_WORLD[d]) return '#/dive/' + d + '/' + DIVE_WORLD[d];
  if (d === 'board') return '#/board';
  const f = FLOWN.datacentre[d]; if (f != null) return '#/place/datacentre/' + f;
  if (DIVE_LEVELS.includes(d)) return '#/dive/' + d;
  const w = worldOfDepth(d);
  return w === 'design' ? '#/bench/' + d : '#/line/' + d;
}
export const askHref = key => { const [th, d] = key.split('.'); return '#/ask/' + th + '/' + d; };

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
/* The copies are of your own full adder once you have designed one that passes, else of the lab's.
   The factory's fault is the first that only some patterns catch, so choosing the patterns matters. */
const spotCache = new Map();
export const spotCode = s => (s && isDone(s, 'full') && s.codes.full && checkDesign('full', s.codes.full).ok ? s.codes.full : null);
export function spotCase(code) {
  const key = code || solutionOf('full');
  if (spotCache.has(key)) return spotCache.get(key);
  let found = null;
  for (let seed = 0; seed < 60 && !found; seed++) {
    const B = build({ p: 'full', code: key, defect: seed });
    if (!B.defect) continue;
    const wrong = B.defect.rows.filter(r => r.mis.length).length;
    if (wrong >= 2 && wrong <= 3) found = { seed, B };
  }
  if (!found) { for (let seed = 0; seed < 60 && !found; seed++) { const B = build({ p: 'full', code: key, defect: seed }); if (B.defect && B.defect.wrong < B.rows.length) found = { seed, B }; } }
  const { seed, B } = found;
  const C = { seed, yours: !!code, broken: 2, rows: B.rows, bad: B.defect.rows, ins: B.ins, outs: B.outs, net: B.defect.net, v: B.defect.v };
  spotCache.set(key, C); return C;
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
