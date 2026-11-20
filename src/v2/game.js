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
import { plan, progress, needOf, childrenOf, designsFor, allDesigns } from '../engines/build.js';
import { ledger, settle, frontier, questionsAt, society, workFor, KINDS as ENTRY_KINDS } from '../engines/ledger.js';
import { t, fmtNum } from '../core/i18n.js';
import { normalJoule } from './joule.js';
import { normalState as normalChef } from '../engines/bits.js';
import { NEEDS, AGENT } from '../data/build.js';
import { DEBATES } from '../data/debates.js';
import { WAYS } from '../data/ways.js';
import { STOPS, WORLDS } from '../data/weave.js';
import { INSIDE, placeOf, SHARED, askAt as levelStops } from '../data/places.js';
import { fieldOf, fieldAtLevel, fieldAtPlace } from '../data/questions.js';
import { QUESTIONS } from '../data/atlas.js';
import { normalBetOf } from '../engines/bet.js';
import { normalLevers, PUZZLES } from '../engines/ripple.js';
import { normalAgent } from '../data/agent.js';
import { normalLooked } from '../data/seek.js';

/* the loop, in order, and the station of each step on the island */
export const STEPS = ['design', 'make', 'test', 'ship', 'use'];
export const STATION = { design: 'studio', make: 'fab', test: 'test', ship: 'port', use: 'datacentre' };
export const STEP_OF = Object.fromEntries(Object.entries(STATION).map(([s, p]) => [p, s]));
/* places that are not a step: the start of making, the community, and the islands across the sea */
export const PLACES = ['studio', 'quarry', 'fab', 'test', 'port', 'datacentre', 'lab', 'village', 'phones', 'cars', 'idea', 'tools', 'materials', 'power'];
export const STEP_PLACE = { quarry: 'make' };

/* a circuit's starting description: the job's own, or one that is almost right (a fix-it job) */
const STARTERS = { half: 'sum = a | b;\ncarry = a & b;' };
export const starter = p => STARTERS[p] || projectOf(p).starter;
export const ownStarter = p => p in STARTERS;   /* its words: game.own.<p> */

/* ---- the bench: one design of your own, carried from the job to the masks ----
   The pieces of the community's computer a design engine can check (src/data/build.js, engine 'logic'), by their job.
   Your design starts as the lab's working example for the piece you pick (the job's solution); changing it makes it
   yours. bench: { p, code (null: the lab's example), rows (your order of the cells on the tile, or null) }. */
export const BENCH_PIECES = NEEDS.filter(n => n.engine === 'logic' && n.project && projectOf(n.project).id === n.project && solutionOf(n.project)).map(n => ({ need: n.id, p: n.project }));
export const benchPieceOf = p => BENCH_PIECES.find(x => x.p === p) || null;
export function normalBench(b) {
  const o = b && typeof b === 'object' ? b : {}, p = benchPieceOf(o.p) ? o.p : 'half';
  const code = typeof o.code === 'string' && o.p === p ? o.code.slice(0, 4000) : null;
  const rows = Array.isArray(o.rows) && o.rows.length <= 12 && o.rows.every(r => Array.isArray(r) && r.length <= 60 && r.every(Number.isInteger)) ? o.rows.map(r => r.slice()) : null;
  const floor = Array.isArray(o.floor) && o.floor.length <= 12 && o.floor.every(r => Array.isArray(r) && r.every(Number.isInteger)) ? o.floor.map(r => r.slice()) : null;
  const q = x => ({ k: Number.isInteger(x && x.k) ? x.k : 0, run: Number.isInteger(x && x.run) ? Math.max(0, x.run) : 0 });
  return { p, code: code === solutionOf(p) ? null : code, rows, floor, mq: q(o.mq), jq: Object.assign(q(o.jq), { ans: o.jq && o.jq.ans && typeof o.jq.ans === 'object' ? Object.fromEntries(Object.entries(o.jq.ans).filter(([k, v]) => typeof k === 'string' && (v === 0 || v === 1))) : {} }) };
}
/* your design on the bench now: its job, its text, who wrote it (the lab's example until you change it), built */
export function benchDesign(s) {
  const b = normalBench(s && s.bench), code = b.code != null ? b.code : solutionOf(b.p);
  return { p: b.p, code, by: b.code != null ? 'you' : 'example', B: build({ p: b.p, code }) };
}

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

/* Do: the challenges. kind: 'bet' (find a place among two dials where three primitives balance; bet: its question
   and engine, src/engines/bet.js), 'design' (write a circuit; p: its job), 'chip' (reach a goal of chip.js with
   your chip's settings; goal: its id), 'life' (ship a chip that lives through a place's life; mission),
   'spot' (find the broken chip with a few test patterns). Each happens at a place and a level inside it
   (place, at: a depth of src/data/places.js), on the step of the loop it belongs to. grows: what appears. */
export const CHALLENGES = [
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
  { id: 'phone', step: 'ship', place: 'phones', at: 'soc', kind: 'life', mission: 'phone', grows: 'island-phones' },
  { id: 'car', step: 'ship', place: 'cars', at: 'mcu', kind: 'life', mission: 'car', grows: 'island-cars' },
  { id: 'dclife', step: 'ship', place: 'port', at: 'ship', kind: 'life', mission: 'datacentre', grows: 'dc-hall' },
  { id: 'fed', step: 'use', place: 'datacentre', at: 'board', kind: 'chip', goal: 'fed', grows: 'dc-solar' },
  { id: 'fast', step: 'use', place: 'datacentre', at: 'chip', kind: 'chip', goal: 'fast', grows: 'clock-tower' },
  { id: 'oxen', step: 'use', place: 'datacentre', at: 'chip', kind: 'bet', bet: 'oxen', grows: 'dc-cores' },
  { id: 'jevons', step: 'use', place: 'power', kind: 'bet', bet: 'jevons', grows: 'power-store' },
  { id: 'agent', step: 'design', place: 'lab', kind: 'agent', grows: 'lab-desk' },
  { id: 'batch', step: 'use', place: 'datacentre', at: 'chip', kind: 'bet', bet: 'batch', grows: 'dc-batch' },
  { id: 'newest', step: 'ship', place: 'phones', at: 'phoneboard', kind: 'teardown', grows: 'island-teardown' },
  { id: 'sig-heart', step: 'ship', place: 'phones', at: 'phoneboard', kind: 'capture', grows: 'island-adc' },
  { id: 'sig-bearing', step: 'ship', place: 'cars', at: 'ecu', kind: 'capture', grows: 'island-sensor' },
  { id: 'reg-jobs', step: 'ship', place: 'phones', at: 'phoneboard', kind: 'regulate', grows: 'island-reg' },
  { id: 'jobs', step: 'design', place: 'studio', at: 'need', kind: 'fit', grows: 'studio-fit' },
  /* the bench's own challenges (src/v2/labs/bench.js, src/engines/bench.js): what the piece you pick must answer, at
     the job; the shortest wire, at the layout; which mask each shape is printed from, at the masks */
  { id: 'piece', step: 'design', place: 'studio', at: 'need', kind: 'piece', grows: 'studio-piece' },
  { id: 'evolve', step: 'design', place: 'studio', at: 'gates', kind: 'evolve', grows: 'studio-evolve' },
  { id: 'floor', step: 'design', place: 'studio', at: 'layout', kind: 'floor', grows: 'studio-floor' },
  { id: 'maskof', step: 'design', place: 'studio', at: 'masks', kind: 'maskof', grows: 'studio-masks' },
  { id: 'crystal', step: 'make', place: 'quarry', at: 'crystal', kind: 'pull', grows: 'quarry-ingot' },
  { id: 'furnace', step: 'make', place: 'fab', at: 'implant', kind: 'implant', grows: 'fab-implanter' },
  { id: 'shallow', step: 'make', place: 'fab', at: 'implant', kind: 'implant', grows: 'fab-anneal' },
  { id: 'vias', step: 'make', place: 'fab', at: 'print', kind: 'overlay', grows: 'fab-overlay' },
  { id: 'etch', step: 'make', place: 'fab', at: 'etch', kind: 'etch', grows: 'fab-etch' },
  { id: 'bottom', step: 'make', place: 'fab', at: 'deposit', kind: 'deposit', grows: 'fab-ald' },
  { id: 'litho-finest', step: 'make', place: 'fab', at: 'print', kind: 'litho', grows: 'fab-scanner' },
  /* new ways to compute, each at the depth where the problem it attacks is met (src/v2/labs/cim.js, grover.js) */
  { id: 'cim', step: 'use', place: 'datacentre', at: 'block', kind: 'cim', grows: 'way-cim' },
  { id: 'grover', step: 'use', place: 'datacentre', at: 'atom', kind: 'grover', grows: 'way-quantum' },
  { id: 'euv-1000', step: 'make', place: 'fab', at: 'print', kind: 'euv', grows: 'fab-euv' },
  { id: 'too-hot', step: 'use', place: 'datacentre', at: 'switch', kind: 'semiconductor', grows: 'dc-heat' },
  /* the capstone, at the end of the design line: everything it asks for has been met on the way */
  { id: 'ai-chip', step: 'design', place: 'studio', at: 'masks', kind: 'aibuild', grows: 'studio-aichip' },
  { id: 'power-curve', step: 'use', place: 'datacentre', at: 'block', kind: 'powercurve', grows: 'blk-power' },
  { id: 'counter', step: 'use', place: 'datacentre', at: 'gate', kind: 'counter', grows: 'gate-counter' },
  /* serving a language model (src/v2/labs/serve.js, src/engines/aiserve.js) */
  { id: 'quantize', step: 'use', place: 'datacentre', at: 'chip', kind: 'quantize', grows: 'dc-quant' },
  { id: 'token-energy', step: 'use', place: 'datacentre', at: 'rack', kind: 'tokenenergy', grows: 'dc-token' },
  { id: 'prefill', step: 'use', place: 'datacentre', at: 'chip', kind: 'prefill', grows: 'dc-prefill' },
  /* if information weighs nothing, why does moving it cost so much? One bit's trip, and Keep the chef busy
     (src/v2/labs/bits.js, src/engines/bits.js); its home in the atlas is QUESTIONS.bits */
  { id: 'chef', step: 'use', place: QUESTIONS.bits.home.place, at: QUESTIONS.bits.home.level, kind: 'chef', grows: 'dc-pantry' }
];
/* the goal of a chip challenge as gauges: each a value of your chip's model and the bound it must reach
   (ge: at least, le: at most). Together they say the same as the goal's met() in src/engines/chip.js. */
export const GAUGES = {
  months: [{ k: 'days', le: 60 }, { k: 'load', ge: 0.92 }],
  quick: [{ k: 'layers', le: 50 }, { k: 'cores', ge: 12 }],
  cores: [{ k: 'cores', ge: 16 }, { k: 'cost', le: 1.2 }],
  fed: [{ k: 'work', ge: 2.5 }, { k: 'late', le: 0 }],
  fast: [{ k: 'clock', ge: 1.5 }, { k: 'late', le: 0 }]
};
/* how far a gauge is toward its bound, 0..1, and whether it is there */
export function gauge(g, m) {
  const v = m[g.k], ok = g.ge != null ? v >= g.ge : v <= g.le;
  const f = ok ? 1 : g.ge != null ? Math.max(0, v / g.ge) : g.le === 0 ? 1 / (1 + v) : Math.max(0, g.le / v);
  return { v, ok, f: Math.min(1, f) };
}
/* your design, as the chip carries it: the last design challenge you finished, built by the design engine */
export function yourDesign(s) {
  /* the design you made your own on the bench, while it is right */
  const b = s.bench && s.bench.code != null ? benchDesign(s) : null; if (b && b.B.ok) return { p: b.p, B: b.B };
  const c = ['full', 'vote', 'half'].map(challengeOf).find(x => x && isDone(s, x.id)); if (!c) return null;
  const B = checkDesign(c.p, s.codes[c.p] || starter(c.p)); return B.ok ? { p: c.p, B } : null;
}
export const challengeOf = id => CHALLENGES.find(c => c.id === id) || null;
export const chipGoal = id => CHIP.find(c => c.id === id);
export const placeChallenges = place => CHALLENGES.filter(c => c.place === place);
/* what grows, and where (the island draws each one: src/v2/map3d.js GROWERS) */
/* where a growth stands when it is not at its challenge's place: the other ways to compute grow at the Lab (WAYS_AT), and the
   clock and the power budget, design decisions, at the studio */
const GROW_AT = { onebad: 'test', half: 'studio', phone: 'phones', car: 'cars', dclife: 'datacentre', fast: 'lab', cim: 'lab', grover: 'lab', 'power-curve': 'studio', counter: 'studio' };
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
/* the other ways to compute belong where people imagine what comes next: the Lab */
export const WAYS_AT = { lab: WAYS.map(w => w.id) };
/* more ways inside, besides the levels. to: a place of the redesign (#/place/<id>), page: a page, or the
   current site (world, depth, map). Words: look.<id>.t / .d */
export const LOOK = {
  port: [{ id: 'supply', page: 'supply' }], tools: [{ id: 'supply', page: 'supply' }], materials: [{ id: 'supply', page: 'supply' }],
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
export function fresh() { return { done: {}, codes: {}, chip: Object.assign({}, START), life: {}, seen: false, drafts: [], sent: {}, met: {}, crossed: {}, bets: {}, whatif: { levers: {}, solved: {} }, agent: {}, teardown: {}, fit: {}, evolve: {}, litho: { best: {} }, aibuild: {}, looked: {}, joule: { on: false, plan: {} }, chef: normalChef(null), name: '', bench: normalBench(null) }; }
export function normalState(s) {
  const f = fresh();
  if (!s || typeof s !== 'object') return f;
  const done = {}; Object.keys(s.done || {}).forEach(k => { if (challengeOf(k) || k.startsWith('job:') || k.startsWith('break:')) done[k] = true; });
  /* your entries not yet in the ledger (at most 24), which of them you have sent, the questions you have met
     (thread: the levels where), and the name you sign with */
  const drafts = (Array.isArray(s.drafts) ? s.drafts : []).filter(d => d && typeof d.id === 'string' && ENTRY_KINDS.includes(d.kind)).slice(-24);
  const sent = {}; Object.keys(s.sent || {}).forEach(k => { if (drafts.some(d => d.id === k)) sent[k] = true; });
  const met = {}; Object.entries(s.met || {}).forEach(([k, v]) => { if (Array.isArray(v)) met[k] = v.filter(x => typeof x === 'string').slice(0, 40); });
  const codes = {}; Object.entries(s.codes || {}).forEach(([k, v]) => { if (typeof v === 'string') codes[k] = v.slice(0, 4000); });
  const lifeC = {}; Object.entries(s.life || {}).forEach(([k, v]) => { lifeC[k] = normalLife(v); });
  /* the seams you have crossed: their leak is raised once, then waits in Ask */
  const crossed = {}; Object.keys(s.crossed || {}).forEach(k => { if (fieldOf(k)) crossed[k] = true; });
  /* where you left each bet's dials (src/engines/bet.js) */
  const bets = {}; CHALLENGES.filter(c => c.kind === 'bet').forEach(c => { if (s.bets && s.bets[c.id]) bets[c.id] = normalBetOf(c.bet, s.bets[c.id]); });
  /* What if?: the levers where you left them, and the puzzles you solved (src/engines/ripple.js) */
  const w = s.whatif || {}, whatif = { levers: normalLevers(w.levers), solved: {} }; Object.keys(w.solved || {}).forEach(k => { if (PUZZLES.some(p => p.id === k)) whatif.solved[k] = true; });
  /* Print the finest lines: the setting that printed each scanner's finest lines (src/v2/labs/litho.js prints them again) */
  const litho = { best: {} }; Object.entries((s.litho && s.litho.best) || {}).slice(0, 12).forEach(([k, v]) => { if (v && typeof v === 'object' && [v.na, v.v, v.dose].every(Number.isFinite)) litho.best[k] = { na: v.na, v: v.v, dose: v.dose, illum: v.illum === 'dipole' ? 'dipole' : 'conventional', dp: !!v.dp }; });
  return { done, codes, chip: normal(s.chip || START), life: lifeC, seen: !!s.seen, drafts, sent, met, crossed, bets, whatif, agent: normalAgent(s.agent), teardown: s.teardown && typeof s.teardown === 'object' ? s.teardown : {}, fit: s.fit && typeof s.fit === 'object' ? s.fit : {}, evolve: s.evolve && typeof s.evolve === 'object' ? s.evolve : {}, litho, aibuild: s.aibuild && typeof s.aibuild === 'object' ? s.aibuild : {}, looked: normalLooked(s.looked), joule: normalJoule(s.joule), chef: normalChef(s.chef), name: typeof s.name === 'string' ? s.name.slice(0, 40) : '', bench: normalBench(s.bench) };
}
export function load(store) { try { return normalState(JSON.parse(store.getItem(KEY) || 'null')); } catch (e) { return fresh(); } }
export function save(store, s) { try { store.setItem(KEY, JSON.stringify({ done: s.done, codes: s.codes, chip: s.chip, life: s.life, seen: s.seen, drafts: s.drafts, sent: s.sent, met: s.met, crossed: s.crossed, bets: s.bets, whatif: s.whatif, agent: s.agent, teardown: s.teardown, fit: s.fit, evolve: s.evolve, litho: s.litho, aibuild: s.aibuild, looked: s.looked, joule: s.joule, chef: s.chef, name: s.name, bench: s.bench })); } catch (e) { /* storage unavailable */ } }

/* ---- checks: each challenge asks its engine ---- */
export function checkDesign(p, code) { return build({ p, code }); }
/* a job the studio has as a project (projectOf falls back to the first one for anything else) */
export const hasProject = p => projectOf(p).id === p;
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

/* ---- the community: the ledger replayed (src/engines/ledger.js), with your own entries not yet in it ---- */
/* the world the ledger makes, with your drafts on top (marked draft: only you see them, until they are merged).
   A draft that is already in the ledger (merged since) is left out. */
let worldKey = null, worldOf_ = null;
export function world(s) {
  const L = ledger(), ids = new Set(L.map(e => e.id)), mine = ((s && s.drafts) || []).filter(d => !ids.has(d.id)).map(d => Object.assign({}, d, { draft: true }));
  const key = L.length + '|' + mine.map(d => d.id).join(',');
  if (key !== worldKey) { worldKey = key; worldOf_ = settle(L.concat(mine)); }
  return worldOf_;
}
export function community(s) {
  const jobsDone = Object.keys(s.done).filter(k => k.startsWith('job:')).map(k => needOf(k.slice(4))).filter(n => n && n.project).map(n => n.project);
  const mine = CHALLENGES.filter(c => c.kind === 'design' && isDone(s, c.id)).map(c => c.p).concat(jobsDone);
  const W = world(s), P = plan(mine, W), pr = progress(P), F = frontier(W);
  const leaves = NEEDS.filter(n => !childrenOf(n.id).length);
  return {
    built: pr.built, total: pr.total, W,
    /* jobs anyone can take: pieces a design can fill, still without one */
    jobs: leaves.filter(n => P[n.id].state === 'open' && n.engine === 'logic').map(n => ({ need: n.id, p: n.project, ai: !!AGENT[n.project] })),
    /* pieces no engine can check yet: the job is to write the engine */
    engines: leaves.filter(n => P[n.id].state === 'engine').map(n => ({ need: n.id })),
    /* every design of the ledger: standing (holding a record, or behind one), broken, or yours and not yet in it */
    designs: allDesigns(W),
    /* the cases that breaks have added to the checks: each stands guard over its piece from then on */
    cases: W.entries.filter(e => e.kind === 'break').map(e => ({ id: e.id, piece: W.byId[e.of].piece, of: e.of, by: e.by, made: e.made, draft: !!e.draft })),
    /* designs whose check tried some cases, not all: nobody has broken them yet */
    breaks: F.filter(f => f.kind === 'break'),
    /* the questions people and agents asked, each a call of its own, and the loudest call of all */
    asks: F.filter(f => f.kind === 'ask').map(f => Object.assign({}, f, { words: W.byId[f.q].q, by: W.byId[f.q].by, draft: !!W.byId[f.q].draft })), loud: F[0] || null,
    state: P
  };
}
/* ---- challenges and questions are two faces of one thing ---- */
/* the question a challenge opens once you have won it: a stop, at its own level or the one beside it */
export const OPENS = { 'too-hot': 'fail.switch', 'litho-finest': 'scale.print', 'euv-1000': 'fail.print', etch: 'make.etch', bottom: 'idea.deposit', crystal: 'make.crystal', furnace: 'make.implant', shallow: 'fail.implant', vias: 'fail.print', evolve: 'idea.block', newest: 'open.phoneboard', jobs: 'divide.need', agent: 'idea.check', half: 'fail.check', vote: 'idea.check', full: 'make.gates', months: 'make.clean', quick: 'scale.clean', spot: 'fail.test', cores: 'divide.test',
  phone: 'life.phone', car: 'fail.car', dclife: 'fail.ship', fed: 'divide.board', fast: 'fail.chip',
  cim: 'divide.block', grover: 'strange.atom', 'ai-chip': 'scale.masks', piece: 'open.need', floor: 'divide.layout', maskof: 'make.masks', 'power-curve': 'life.block', counter: 'fail.gate',
  'sig-heart': 'fail.phoneboard', 'sig-bearing': 'fail.ecu', 'reg-jobs': 'fail.phoneboard', quantize: 'think.chip', 'token-energy': 'divide.rack', prefill: 'think.board', chef: 'divide.block' };
/* and where the open things of the ledger sit: a break under "is the design right?", a piece to build under
   "could anyone design a chip?", a missing check under "who checks, and with what?" */
export const FRONT_ASK = { break: 'fail.check', build: 'open.need', engine: 'idea.check' };
export const opensOf = ch => (ch.kind === 'break' ? 'idea.check' : ch.need ? 'open.layout' : OPENS[ch.id]) || null;
/* what there is to do about a question: the challenges that open it, and the open things of the ledger that sit there */
export function doAtStop(key, s) {
  const out = CHALLENGES.filter(c => OPENS[c.id] === key).map(c => ({ ch: c }));
  const C = community(s);
  if (FRONT_ASK.break === key) C.breaks.forEach(b => out.unshift({ ch: breakOf(b.of, s) }));
  if (FRONT_ASK.build === key) C.jobs.forEach(j => out.push({ ch: jobOf(j.need) }));
  if (FRONT_ASK.engine === key) C.engines.forEach(e => out.push({ engine: e.need }));
  return out.filter(x => x.engine || x.ch);
}
/* the other questions that meet this one: at the same level, about a part they share */
export const across = key => { const [, d] = key.split('.'), mine = STOPS[key] || []; return levelStops_(d).filter(k => k !== key && STOPS[k].some(p => mine.includes(p))); };
const levelStops_ = d => Object.keys(STOPS).filter(k => k.split('.')[1] === d);
/* what people have asked under a question, yours first */
export const askedAt = (key, s) => { const W = world(s); return questionsAt(W, key.split('.')[1], key).sort((a, b) => !!b.draft - !!a.draft); };
/* everything people and agents have asked at a level, under whichever question */
export const askedAtLevel = (d, s) => questionsAt(world(s), d, null).sort((a, b) => !!b.draft - !!a.draft);
/* the society, the work done for a question, and an entry or a question in a few words */
export const societyOf = W => society(W);
export const workAt = (key, s) => workFor(world(s), key);
export const aboutWords = (about, W) => (STOPS[about] ? t('stop.' + about + '.q') : (W.byId[about] || {}).q || about);
/* what is open now, loudest first, read from the ledger and your drafts */
export const frontierOf = s => frontier(world(s));
export function entryWords(e, s) { const W = world(s), T = W.byId[e.of];
  return e.kind === 'design' ? t('ledger.rec.design', { title: e.title, piece: t('build.need.' + e.piece + '.t') }) : e.kind === 'break' ? t('ledger.rec.break', { title: T.title }) : e.kind === 'try' && e.puzzle ? t('ledger.rec.attempt', { wh: fmtNum(+(e.facts.joules / 3600).toPrecision(2)) })
    : e.kind === 'try' && e.chef ? t('ledger.rec.chef', { level: t('mb.lv.' + e.chef + '.t'), wait: fmtNum(Math.round(e.facts.wait * 100)), e: fmtNum(+e.facts.energy.toPrecision(2)) })
    : e.kind === 'try' && e.machine ? t('ledger.rec.machine', { need: t('machines.need.' + e.machine + '.t'), x: fmtNum(+e.facts.energy.toPrecision(2)), days: isFinite(e.facts.days) ? fmtNum(e.facts.days) : '?', n: isFinite(e.facts.days) ? e.facts.days : 2 })
    : e.kind === 'try' ? t('ledger.rec.try', { title: T.title, n: e.facts.cases })
    : e.kind === 'report' ? t('ledger.rec.report', { say: t('report.say.' + e.say), at: e.at, words: e.words }) : e.kind === 'fix' ? t('ledger.rec.fix', { words: e.words }) : e.q; }
/* break a design: a challenge made by the ledger itself, for every clocked design that stands, and kept for the
   broken ones, so anyone can find the case again */
export function breakOf(id, s) { const e = world(s).byId[id]; if (!e || e.kind !== 'design' || !e.ok) return null; const n = needOf(e.piece);
  return projectOf(n.project).seq ? { id: 'break:' + id, step: null, kind: 'break', of: id, p: n.project, need: e.piece, title: e.title, place: 'village', at: 'check', grows: null } : null; }
/* a challenge by its id: one of the loop's, an open job (job:<piece>) or a break (break:<entry>) */
export const anyChallenge = (id, s) => !id ? null : id.startsWith('break:') ? breakOf(id.slice(6), s) : id.startsWith('job:') ? jobOf(id.slice(4)) : challengeOf(id);
export const jobOf = need => { const n = needOf(need); return n && n.project ? { id: 'job:' + need, step: null, kind: 'design', p: n.project, need, grows: null } : null; };
export const debatesAt = place => (DEBATES_AT[place] || []).filter(id => DEBATES.some(d => d.id === id));
/* the questions from the field asked at a place: its own, then those at its levels, each once */
export const fieldsAt = place => [...new Set(fieldAtPlace(place).concat(...(INSIDE[place] || []).map(l => fieldAtLevel(l.depth))).map(q => q.id))];
export const aiProposal = p => AGENT[p] || null;
export { SETTINGS, START, PERFECT, designsFor };
/* a question's root may show once two of its stops have been met, or one, after a challenge that opens that question was won */
export const didOn = (s, th) => CHALLENGES.some(c => isDone(s, c.id) && (OPENS[c.id] || '').startsWith(th + '.')) || (th === 'idea' && Object.keys(s.done).some(k => k.startsWith('break:')));
