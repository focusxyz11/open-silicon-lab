/* The loop: a chip's life as the shell knows it on every page, the first one included. Pure data and logic, no DOM,
   and no engine: the steps and their stations, the places, the challenges (the loop's own and each lab's), what grows,
   the levels inside each place and where each is shown, what each challenge opens, a challenge's name and goal, and
   your state as far as the loop reads it. The game (src/v2/game.js) is this and the engines behind it: the checks, the
   community's standings, the bench; it re-exports all of this, and loads only when a view that needs it first opens,
   or after the first page has painted (docs/ARCHITECTURE.md, "What loads when"). Tests in tests/game.test.mjs. */
import { t } from '../core/i18n.js';
import { STOPS, WORLDS } from '../data/weave.js';
import { INSIDE, placeOf, aboveOf, SHARED, askAt as levelStops } from '../data/places.js';
import { fieldOf, fieldAtLevel, fieldAtPlace } from '../data/questions.js';
import { DEBATES } from '../data/debates.js';
import { normalLooked } from '../data/seek.js';
import { LAB_CHALLENGES, challengeOnly } from '../data/labs/index.js';

/* the loop, in order, and the station of each step on the island */
export const STEPS = ['design', 'make', 'test', 'ship', 'use'];
export const STATION = { design: 'studio', make: 'fab', test: 'test', ship: 'port', use: 'datacentre' };
export const STEP_OF = Object.fromEntries(Object.entries(STATION).map(([s, p]) => [p, s]));
/* places that are not a step: the start of making, the community, and the islands across the sea */
export const PLACES = ['studio', 'quarry', 'fab', 'test', 'port', 'datacentre', 'lab', 'village', 'phones', 'cars', 'idea', 'tools', 'materials', 'power'];
export const STEP_PLACE = { quarry: 'make' };

/* Do: the challenges. kind: 'bet' (find a place among two dials where three primitives balance; bet: its question
   and engine, src/engines/bet.js), 'design' (write a circuit; p: its job), 'chip' (reach a goal of chip.js with
   your chip's settings; goal: its id), 'life' (ship a chip that lives through a place's life; mission),
   'spot' (find the broken chip with a few test patterns). Each happens at a place and a level inside it
   (place, at: a depth of src/data/places.js), on the step of the loop it belongs to. grows: what appears.
   These are the loop's own, played by the player itself (src/v2/play.js; the bets drawn by src/v2/labs/bets.js); every other kind is a lab's, and each lab
   declares its challenges in a file of its own (src/data/labs/), gathered below. */
const LOOP_CHALLENGES = [
  { id: 'half', step: 'design', place: 'studio', at: 'logic', kind: 'design', p: 'half', grows: 'masks' },
  { id: 'vote', step: 'design', place: 'studio', at: 'check', kind: 'design', p: 'vote', grows: 'studio-screen' },
  { id: 'full', step: 'design', place: 'studio', at: 'check', kind: 'design', p: 'full', grows: 'studio-wing' },
  { id: 'prove', step: 'design', place: 'studio', at: 'check', kind: 'bet', bet: 'prove', grows: 'studio-proof' },
  { id: 'months', step: 'make', place: 'fab', at: 'clean', kind: 'chip', goal: 'months', grows: 'fab-trucks' },
  { id: 'quick', step: 'make', place: 'fab', at: 'deposit', kind: 'chip', goal: 'quick', grows: 'fab-line' },
  { id: 'cheaper', step: 'make', place: 'fab', at: 'wafer', kind: 'bet', bet: 'cheaper', grows: 'fab-wafers' },
  { id: 'onebad', step: 'make', place: 'fab', at: 'wafer', kind: 'bet', bet: 'onebad', grows: 'test-dies' },
  { id: 'spot', step: 'test', place: 'test', at: 'test', kind: 'spot', p: 'full', grows: 'test-probe' },
  { id: 'cores', step: 'test', place: 'test', at: 'test', kind: 'chip', goal: 'cores', grows: 'test-hall' },
  { id: 'phone', step: 'use', place: 'phones', at: 'soc', kind: 'life', mission: 'phone', grows: 'island-phones' },
  { id: 'car', step: 'use', place: 'cars', at: 'mcu', kind: 'life', mission: 'car', grows: 'island-cars' },
  { id: 'dclife', step: 'ship', place: 'port', at: 'ship', kind: 'life', mission: 'datacentre', grows: 'dc-hall' },
  { id: 'fed', step: 'use', place: 'datacentre', at: 'board', kind: 'chip', goal: 'fed', grows: 'dc-solar' },
  { id: 'fast', step: 'use', place: 'datacentre', at: 'chip', kind: 'chip', goal: 'fast', grows: 'clock-tower' },
  { id: 'oxen', step: 'use', place: 'datacentre', at: 'chip', kind: 'bet', bet: 'oxen', grows: 'dc-cores' },
  { id: 'jevons', step: 'use', place: 'power', kind: 'bet', bet: 'jevons', grows: 'power-store' },
  { id: 'batch', step: 'use', place: 'datacentre', at: 'chip', kind: 'bet', bet: 'batch', grows: 'dc-batch' }
];
/* every challenge: the loop's own, then each lab's in the order of src/data/labs/index.js, a challenge with an `after`
   placed right after the challenge it names (the order the next thing to do and the lists by step follow) */
export const CHALLENGES = (() => {
  const L = LOOP_CHALLENGES.slice(), later = [];
  LAB_CHALLENGES.forEach(c => (c.after ? later : L).push(c));
  later.forEach(c => { const i = L.findIndex(x => x.id === c.after); L.splice(i < 0 ? L.length : i + 1, 0, c); });
  return L.map(challengeOnly);
})();
/* A challenge behind a flag (flag: 'x', as the ear test was behind ?listen=1 until #317) shows only where the address
   asks for it (?x=1): in a browser without the flag it is dropped from CHALLENGES here, before anything reads the list, so nothing else changes.
   With no address (the tests, the open port) everything stays. */
export const flagged = (c, search) => !c.flag || new RegExp('[?&]' + c.flag + '=1(&|$)').test(search);
{ let q = null; try { q = location.search; } catch (e) { q = null; }
  if (typeof q === 'string') for (let i = CHALLENGES.length - 1; i >= 0; i--) if (!flagged(CHALLENGES[i], q)) CHALLENGES.splice(i, 1); }
export const challengeOf = id => CHALLENGES.find(c => c.id === id) || null;
export const placeChallenges = place => CHALLENGES.filter(c => c.place === place);
/* what grows, and where (the island draws each one: src/v2/map3d.js GROWERS, and each lab's in src/v2/growers/) */
/* where a growth stands when it is not at its challenge's place; a lab's say so themselves (growAt in src/data/labs/):
   the other ways to compute grow at the Lab, and the clock and the power budget, design decisions, at the studio */
const GROW_AT = Object.assign({ onebad: 'test', half: 'studio', phone: 'phones', car: 'cars', dclife: 'datacentre', fast: 'lab' },
  Object.fromEntries(LAB_CHALLENGES.filter(c => c.growAt).map(c => [c.id, c.growAt])));
export const GROWTH = CHALLENGES.map(c => ({ id: c.grows, by: c.id, at: GROW_AT[c.id] || c.place }));

/* Inside: every place's levels, one inside the next (src/data/places.js). These hold the earlier site's
   pages: each level opens there until it is redrawn here. The data centre's first levels are flown through
   (src/v2/dc3d.js; FLOWN: a depth and its level in the flight), and so are a phone's (src/v2/phone3d-flight.js) and a car's
   (src/v2/car3d-flight.js). */
export { INSIDE, placeOf, SHARED };
export const FLOWN = { datacentre: { building: 0, rack: 2, board: 4, chip: 5 }, phones: { phone: 0, phoneboard: 2, soc: 3 }, cars: { car: 0, ecu: 2, mcu: 3 },
  /* the studio is walked: each step is a corner of the room (src/v2/studio3d.js), whose screen opens into its bench */
  studio: { need: 1, logic: 2, check: 3, gates: 4, layout: 5, masks: 6 } };
/* Ask: the questions at each level of a place; the Lab holds the open thread's questions, where the
   community asks them. BEACON: the one question glowing above a place. */
export function askAt(place) { return place === 'lab' ? [{ level: null, stops: Object.keys(STOPS).filter(k => k.startsWith('open.')) }] : levelStops(place); }
export const ASK = Object.fromEntries(PLACES.map(p => [p, askAt(p).flatMap(x => x.stops)]));
export const BEACON = { studio: 'idea.need', quarry: 'make.crystal', fab: 'make.clean', test: 'fail.test', port: 'divide.ship', datacentre: 'life.building', lab: 'open.need' };
export const DEBATES_AT = {
  studio: ['designcost', 'signoff', 'skills'], fab: ['shrink'], test: ['bigdie'], port: ['supply'], datacentre: ['memory', 'power', 'paradigm', 'quantum'],
  lab: ['open'], cars: ['mature'], phones: [], quarry: [], village: [], idea: [], tools: ['shrink', 'supply'], materials: ['supply'], power: ['power']
};
/* more ways inside, besides the levels. to: a place of the redesign (#/place/<id>), page: a page, or the
   current site (world, depth, map). Words: look.<id>.t / .d */
export const LOOK = {
  port: [{ id: 'supply', page: 'supply' }], tools: [{ id: 'supply', page: 'supply' }], materials: [{ id: 'supply', page: 'supply' }],
  lab: [{ id: 'plan', page: 'build' }], village: [{ id: 'plan', page: 'build' }]
};
/* the world of the current site where a depth is drawn (the first place that holds it) */
const worldOfDepth = depth => { for (const L of Object.values(INSIDE)) { const l = L.find(x => x.depth === depth); if (l) return l.world; } return 'journey'; };

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
  /* a level above a place's zoom (mind, ABOVE in src/data/places.js) has no view yet: its way in is its place */
  const up = aboveOf(d); if (up) return '#/place/' + up;
  if (DIVE_WORLD[d]) return '#/dive/' + d + '/' + DIVE_WORLD[d];
  if (d === 'board') return '#/board';
  const f = FLOWN.datacentre[d]; if (f != null) return '#/place/datacentre/' + f;
  if (DIVE_LEVELS.includes(d)) return '#/dive/' + d;
  const w = worldOfDepth(d);
  return w === 'design' ? '#/bench/' + d : '#/line/' + d;
}
export const askHref = key => { const [th, d] = key.split('.'); return '#/ask/' + th + '/' + d; };

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

/* ---- challenges and questions are two faces of one thing ---- */
/* the question a challenge opens once you have won it: a stop, at its own level or the one beside it */
export const OPENS = Object.assign({ half: 'fail.check', vote: 'idea.check', full: 'make.gates', months: 'make.clean', quick: 'scale.clean', spot: 'fail.test', cores: 'divide.test',
  phone: 'life.phone', car: 'fail.car', dclife: 'fail.ship', fed: 'divide.board', fast: 'fail.chip' },
  /* each lab's challenges say what they open (src/data/labs/) */
  Object.fromEntries(LAB_CHALLENGES.filter(c => c.opens).map(c => [c.id, c.opens])));
/* and where the open things of the ledger sit: a break under "is the design right?", a piece to build under
   "could anyone design a chip?", a missing check under "who checks, and with what?" */
export const FRONT_ASK = { break: 'fail.check', build: 'open.need', engine: 'idea.check' };
export const opensOf = ch => (ch.kind === 'break' ? 'idea.check' : ch.need ? 'open.layout' : OPENS[ch.id]) || null;
/* the other questions that meet this one: at the same level, about a part they share */
export const across = key => { const [, d] = key.split('.'), mine = STOPS[key] || []; return levelStops_(d).filter(k => k !== key && STOPS[k].some(p => mine.includes(p))); };
const levelStops_ = d => Object.keys(STOPS).filter(k => k.split('.')[1] === d);
export const debatesAt = place => (DEBATES_AT[place] || []).filter(id => DEBATES.some(d => d.id === id));
/* the questions from the field asked at a place: its own, then those at its levels, each once */
export const fieldsAt = place => [...new Set(fieldAtPlace(place).concat(...(INSIDE[place] || []).map(l => fieldAtLevel(l.depth))).map(q => q.id))];
/* a question's root may show once two of its stops have been met, or one, after a challenge that opens that question was won */
export const didOn = (s, th) => CHALLENGES.some(c => isDone(s, c.id) && (OPENS[c.id] || '').startsWith(th + '.')) || (th === 'idea' && Object.keys(s.done).some(k => k.startsWith('break:')));

/* a challenge's name and goal, in words */
export function titleOf(ch) { return ch.kind === 'break' ? t('game.break.t', { what: ch.title || t('design.proj.' + ch.p + '.t') }) : ch.kind === 'design' ? t('design.proj.' + ch.p + '.t') : t('game.ch.' + ch.id + '.t'); }
export function goalOf(ch) {
  if (ch.kind === 'break') return t('game.break.goal');
  if (ch.kind === 'design') return t(ch.need ? 'game.job.goal' : 'game.ch.' + ch.id + '.goal', { job: t('design.proj.' + ch.p + '.t') });
  if (ch.kind === 'chip') return t('chal.' + ch.goal + '.goal');
  return t('game.ch.' + ch.id + '.goal');
}

/* ---- your state: what you have done, and what you were working on ----
   Read here as far as the loop needs it: what you have done, met, crossed and written, and your name. What an engine
   checks (your chip and its life, the bets, What if?, the agent, the joule, the chef, the bench, your drafts) is kept
   as it was stored, and saved back unchanged, until the game's engines load and check it (complete() in game.js) */
export const KEY = 'osl-world-v1';
export const CHECKED = ['drafts', 'sent', 'chip', 'life', 'bets', 'whatif', 'agent', 'joule', 'chef', 'bench'];
export function readState(s) {
  const o = s && typeof s === 'object' ? s : {};
  const done = {}; Object.keys(o.done || {}).forEach(k => { if (challengeOf(k) || k.startsWith('job:') || k.startsWith('break:')) done[k] = true; });
  /* the questions you have met (thread: the levels where) */
  const met = {}; Object.entries(o.met || {}).forEach(([k, v]) => { if (Array.isArray(v)) met[k] = v.filter(x => typeof x === 'string').slice(0, 40); });
  const codes = {}; Object.entries(o.codes || {}).forEach(([k, v]) => { if (typeof v === 'string') codes[k] = v.slice(0, 4000); });
  /* the seams you have crossed: their leak is raised once, then waits in Ask */
  const crossed = {}; Object.keys(o.crossed || {}).forEach(k => { if (fieldOf(k)) crossed[k] = true; });
  /* Print the finest lines: the setting that printed each scanner's finest lines (src/v2/labs/litho.js prints them again) */
  const litho = { best: {} }; Object.entries((o.litho && o.litho.best) || {}).slice(0, 12).forEach(([k, v]) => { if (v && typeof v === 'object' && [v.na, v.v, v.dose].every(Number.isFinite)) litho.best[k] = { na: v.na, v: v.v, dose: v.dose, illum: v.illum === 'dipole' ? 'dipole' : 'conventional', dp: !!v.dp }; });
  const obj = v => (v && typeof v === 'object' ? v : {});
  return Object.assign({ done, codes, seen: !!o.seen, met, crossed, teardown: obj(o.teardown), fit: obj(o.fit), evolve: obj(o.evolve), litho, aibuild: obj(o.aibuild), looked: normalLooked(o.looked), name: typeof o.name === 'string' ? o.name.slice(0, 40) : '' },
    Object.fromEntries(CHECKED.filter(k => o[k] !== undefined).map(k => [k, o[k]])));
}
/* what this browser has stored, or nothing */
export const stored = store => { try { return JSON.parse(store.getItem(KEY) || 'null'); } catch (e) { return null; } };
export function save(store, s) { try { store.setItem(KEY, JSON.stringify({ done: s.done, codes: s.codes, chip: s.chip, life: s.life, seen: s.seen, drafts: s.drafts, sent: s.sent, met: s.met, crossed: s.crossed, bets: s.bets, whatif: s.whatif, agent: s.agent, teardown: s.teardown, fit: s.fit, evolve: s.evolve, litho: s.litho, aibuild: s.aibuild, looked: s.looked, joule: s.joule, chef: s.chef, name: s.name, bench: s.bench })); } catch (e) { /* storage unavailable */ } }
