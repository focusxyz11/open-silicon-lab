/* The way: where you are in the lab, and where each move leads (docs/reviews/structure.md). Pure logic, no DOM;
   tests in tests/way.test.mjs.

   The lab is one grid. Across it runs a chip's life, the loop: something is open, then it is designed, made,
   tested, shipped and used, and what is learned in use opens the next. Down it runs scale: a place,
   then its levels, one inside the next, to the atom. An address is a cell of that grid, and there are two moves:
     in · out   scale: into the part in view, or up to the level above;
     along      the chip's life: the next stage, holding the depth you are at wherever that depth exists there
                (a gate as it is used, the same gate as it is printed, the same gate as you designed it).
   Everything else is a tap. The shell (src/v2/app.js) shows the two axes as two rails, the loop in the bar and the
   levels at the side, and the open port gives the same graph to AI agents (look, in src/engines/api.js). */
import { twinOf, TWINS } from '../data/atlas.js';
import { WORLDS } from '../data/weave.js';
import { placeOf } from '../data/places.js';
import { SEAMS } from '../data/questions.js';
import { viewOfDepth, challengeOf, DIVE_WORLD, DIVE_LEVELS, PLACES } from '../v2/loop.js';

/* the loop, in order. It starts with what is open, two ways in: something someone needs (pull), or something just
   possible and still looking for its use (push; much of chip history ran this way, so the first stage is not called a
   need). What is learned in use opens the next: the loop comes back here, where the community stands. */
export const STAGES = ['open', 'design', 'make', 'test', 'ship', 'use'];
/* the place that stands for each stage on the island */
export const STAGE_PLACE = { open: 'lab', design: 'studio', make: 'fab', test: 'test', ship: 'port', use: 'datacentre' };
/* and the stage every place belongs to (the sandbank for what does not exist yet has none) */
const PLACE_STAGE = { lab: 'open', village: 'open', studio: 'design', quarry: 'make', fab: 'make', test: 'test', port: 'ship', datacentre: 'use', phones: 'use', cars: 'use', tools: 'make', materials: 'make', power: 'use' };
export const stageOfPlace = place => PLACE_STAGE[place] || null;
/* the next place round the loop: the crystal goes on to the factory, everything else to the next stage's place */
export const nextPlace = place => {
  if (place === 'quarry') return 'fab';
  const s = stageOfPlace(place); return STAGE_PLACE[STAGES[(STAGES.indexOf(s) + 1) % STAGES.length]];
};

/* the pages of Your log, behind the bar's log button */
export const LOG_PAGES = ['log', 'challenges', 'questions'];
/* the data centre is flown through: each stop of the flight shows one level */
const FLIGHT = ['building', 'building', 'rack', 'rack', 'board', 'chip'];
/* and so is a phone (src/v2/phone3d-flight.js DEPTH) */
const PHONE_FLIGHT = ['phone', 'phone', 'phoneboard', 'soc'];
/* and a car (src/v2/car3d-flight.js DEPTH) */
const CAR_FLIGHT = ['car', 'car', 'ecu', 'mcu'];
const DIVE_PLACE = { datacentre: 'datacentre', phone: 'phones', car: 'cars', made: 'fab' };
const parts = h => String(h || '').replace(/^#\/?/, '').split('/').filter(Boolean);
const cell = (view, place, level, stage, more) => Object.assign({ view, place: place || null, level: level || null, stage: stage || (place ? stageOfPlace(place) : null) }, more);

/* where a challenge is played: in the view that shows its level, with the picture behind it. A design is written
   on the bench; a board's story holds its own dock, so its challenge is met at its place on the island. */
export function doHome(ch) {
  if (!ch || !ch.at) return null;
  if (ch.kind === 'design' || ch.kind === 'break') return ch.need || ch.kind === 'break' ? null : '#/bench/' + ch.at;
  if (DIVE_LEVELS.includes(ch.at)) return '#/dive/' + ch.at;
  const h = viewOfDepth(ch.at);
  /* a challenge at a level of the design but not a design to write (the proof's bet at the check, the right chip for
     the job at the need) is played at the bench */
  if (/^#\/bench\//.test(h)) return h;
  return /^#\/(dive|line)\//.test(h) ? h : null;
}

/* the cell an address shows: its view, place, level and stage of the loop. Your stack's rungs turn their faces along
   (#/stack/<face>/<rung>, as used if none is said) */
const FACE = /^(design|make|use)$/;
/* the levels the studio draws (#506) */
export const STUDIO_LEVELS = ['chip', 'block', 'gate', 'switch'];
export function whereOf(hash) {
  const p = parts(hash), k = p[0] || 'island';
  if (k === 'ask') return Object.assign(whereOf(viewOfDepth(p[2] || 'chip')), { ask: p[1] || null });
  if (k === 'do') { const ch = challengeOf(decodeURIComponent(p[1] || '')), h = doHome(ch); return h ? whereOf(h) : ch ? cell('island', ch.place) : cell('island'); }
  if (k === 'dive') { const world = p[2] || DIVE_WORLD[p[1]] || 'datacentre'; return cell('dive', DIVE_PLACE[world] || 'datacentre', p[1] || 'chip', world === 'made' ? 'make' : 'use', { world }); }
  if (k === 'line') { const level = p[1] || 'crystal'; return cell('line', placeOf('journey', level) || 'fab', level, null, { step: level, size: levelOfStep('line', level) }); }
  if (k === 'bench') { const step = p[1] || 'need'; return cell('bench', 'studio', step, null, { step, size: levelOfStep('bench', step) }); }
  /* inside a chip, layer by layer: the stack is the lower half of the Make column, each row a level of the dive as it is
     made (the block as wired, the gate as printed). An old address without /build is the same place */
  if (k === 'chip') { const row = Math.min(DIVE_LEVELS.length - 1, Math.max(0, +p[1] || 0)), level = DIVE_LEVELS[row], made = twinOf(level).made;
    return cell('chip', 'fab', level, 'make', { row, build: true, step: made[made.length - 1] }); }
  if (k === 'stack') { const s = p[1] === 'field' ? null : FACE.test(p[1]) ? p[1] : 'use'; return cell('stack', null, s && p[p[1] === s ? 2 : 1], s); }
  if (k === 'board') return cell('board', 'datacentre', 'board');
  if (k === 'supply') return cell('supply', 'port', 'ship');
  if (k === 'build') return cell('page', 'lab');
  if (k === 'place' && p[1] === 'datacentre' && p[2] != null && p[2] !== 'inside') return cell('flight', 'datacentre', FLIGHT[+p[2]] || 'building');
  if (k === 'studio') return cell('studio', 'studio', STUDIO_LEVELS.includes(p[1]) ? p[1] : 'chip', 'design');
  if (k === 'place' && p[1] === 'phones' && /^\d+$/.test(p[2] || '')) return cell('flight', 'phones', PHONE_FLIGHT[+p[2]] || 'phone');
  if (k === 'place' && p[1] === 'cars' && /^\d+$/.test(p[2] || '')) return cell('flight', 'cars', CAR_FLIGHT[+p[2]] || 'car');
  if (k === 'place' && PLACES.includes(p[1])) return cell('island', p[1]);
  return cell(k === 'ecosystem' || k === 'whatif' ? 'out' : [...LOG_PAGES, 'read', 'w', 'machines'].includes(k) ? 'log' : 'island');
}

/* Steps and levels (docs/SYSTEM.md). In the studio and on the factory's line things follow each other in time: steps,
   walked along (← →, Next →) left to right. A step may show a level of the chip (the job the whole chip, layout its
   blocks, gates its gates; the line prints the gates, etches the switches, wires the blocks, packs the chip): only
   those are levels, on the rail at the side, moved through in · out (↑ ↓). Describe, check, masks, and the line's
   slicing, cleaning, depositing, testing and shipping show none: no rail, and in · out leads nowhere in the view. */
const STEP_WORLD = { bench: 'design', line: 'journey' };
const DESIGN_STAGE = { bench: 'designed', line: 'made' };
/* the steps of a view, in order (the depths of its world in the weave), or [] for a view that is not a row of steps */
export const stepsOf = view => (STEP_WORLD[view] ? WORLDS.find(w => w.id === STEP_WORLD[view]).depths.slice() : []);
/* the level a step shows, or null: the Turn's twin whose designed (studio) or made (line) form is that step */
export function levelOfStep(view, step) {
  const f = DESIGN_STAGE[view]; if (!f || !step) return null;
  const tw = TWINS.find(x => (f === 'designed' ? x.designed === step : x.made.includes(step)));
  return tw ? tw.used : null;
}
/* the levels a row of steps shows, biggest first: the rail's items (the studio: chip, block, gate; the line: all five) */
export const levelsOfSteps = view => TWINS.map(x => x.used).filter(lv => stepsOf(view).some(s => levelOfStep(view, s) === lv));
/* the step that shows a level: the step you are at if it does, else the last that does (the atom is implanted after it
   is grown, and the implant is where the line's atoms are looked at) */
export function stepOfLevel(view, level, at) {
  if (levelOfStep(view, at) === level) return at;
  const S = stepsOf(view).filter(s => levelOfStep(view, s) === level); return S.length ? S[S.length - 1] : null;
}
/* in · out inside a row of steps: the step that shows the next level in (dir 1) or out (dir -1), or null where the
   step shows no level, or there is nothing further that way in this view */
export function inOutOfStep(view, step, dir) {
  const lv = levelOfStep(view, step); if (!lv) return null;
  const L = levelsOfSteps(view), n = L[L.indexOf(lv) + (dir > 0 ? 1 : -1)];
  return n ? stepOfLevel(view, n, step) : null;
}

/* along: the address of another stage of the loop, from where you are. The depth is held where the level has a
   twin there (the atlas's Turn), the line is walked where you are on it, your stack's rungs turn their faces, and
   otherwise the move lands at that stage's place on the island. Null when already at that stage, inside a place.
   Inside a chip there is one way down, the dive (Use); a level of it seen as made is the same row of the stack
   (Make), so along turns between the two at the level you are at, and in · out moves through the levels of
   whichever you are in. */
export function alongTo(where, stage) {
  if (!STAGES.includes(stage)) return null;
  const W = where || cell('island'), home = '#/place/' + STAGE_PLACE[stage];
  if (W.stage === stage && W.view !== 'island' && W.view !== 'page') return null;
  if (stage === 'open') return home;
  if (W.view === 'stack' && FACE.test(stage)) return '#/stack' + (stage === 'use' ? '' : '/' + stage) + (W.level ? '/' + W.level : '');
  if (W.view === 'line' && (stage === 'make' || stage === 'test' || stage === 'ship')) return '#/line/' + ({ make: 'wires', test: 'test', ship: 'pkg' })[stage];
  /* in a row of steps, only the level the step shows is held: describe, check and masks hold none. On the island, a
     level carried past a stage where it does not exist (below, carryOf) is picked up again at the next stage that has it */
  const rows = ROWS.includes(W.view), tw = rows ? (W.size ? twinOf(W.size) : null) : W.level && W.view !== 'island' ? twinOf(W.level === 'die' ? 'chip' : W.level) : W.view === 'island' && W.carry ? twinOf(W.carry) : null;
  if (tw) {
    if (stage === 'design' && STUDIO_LEVELS.includes(tw.used)) return '#/studio/' + tw.used;
    if (stage === 'design' && tw.designed) return '#/bench/' + tw.designed;
    /* a whole chip is made as a die on its wafer, and closed in its package on the way out; the levels inside it are
       made layer by layer, and the stack shows each as made, in the same row (the dive is the only way down) */
    if (stage === 'make') return tw.used === 'chip' ? '#/dive/die/made' : '#/chip/' + DIVE_LEVELS.indexOf(tw.used) + '/build';
    if (stage === 'ship' && tw.used === 'chip') return '#/line/pkg';
    if (stage === 'use') return '#/dive/' + tw.used;
  }
  return home;
}
/* the seam a move crosses, and the leak on it (src/data/questions.js). In or out crosses the line between two levels
   at one stage, along the line between two stages; a leak's seam is that pair, either way round. Where one pair of
   stages holds two, one is met on the island (place to place), the other inside a view. Else null. */
export function seamOf(from, to) {
  if (!from || !to) return null;
  const pair = (x, y, a, b) => (x === a && y === b) || (x === b && y === a);
  const isle = w => w.view === 'island';
  for (const q of SEAMS) {
    const s = q.seam;
    if (s.a && from.stage === to.stage && from.level && to.level && pair(from.level, to.level, s.a, s.b)) return q.id;
    if (s.along && from.stage !== to.stage && pair(from.stage, to.stage, s.along[0], s.along[1]) &&
      (!s.on || (s.on === 'island' ? isle(from) && isle(to) : !isle(to)))) return q.id;
  }
  return null;
}
/* whether that move holds the depth you are at (the bar says so before you take it) */
/* From a row of steps, a move that walks the same row to another step (print → test on the line) holds no level, unless
   the step it lands on shows the same one: Around here offers a level at another stage only where it exists there. */
const ROWS = ['bench', 'line'];
const sizeOfCell = W => (ROWS.includes(W.view) ? W.size : W.level === 'die' ? 'chip' : W.level);
export const holds = (where, stage) => { const h = alongTo(where, stage); if (!h || h.startsWith('#/place/')) return false;
  if (!where || !ROWS.includes(where.view)) return true;
  return !!where.size && sizeOfCell(whereOf(h)) === where.size; };
/* the level an along move carries. A move that drops your level, landing at a stage's place on the island because it
   does not exist there (a gate at the Lab, where what is open is decided), carries it: along picks it up again at the
   next stage that has it (a cell with carry set, alongTo above). Null when it lands on a level, or none was carried. */
export function carryOf(from, to) {
  if (!from || !to || !/^#\/place\//.test(to)) return null;
  const lv = ROWS.includes(from.view) ? from.size : from.view === 'island' ? from.carry : from.level === 'die' ? 'chip' : from.level;
  const tw = lv ? twinOf(lv) : null; return tw ? tw.used : null;
}
/* a cell with the level an along move carried there (kept while you stay where the move landed) */
export const carried = (W, c) => (c && c.level && W && W.view === 'island' ? Object.assign(W, { carry: c.level }) : W);
/* along one stage on (dir 1) or back (dir -1) round the loop, as the keys take it: the stage, the address, and the
   level carried (Use → Open wraps round to what is open, and the next → picks the level up again) */
export function alongStep(where, dir) {
  const W = where || cell('island'), n = STAGES.length, i = STAGES.indexOf(W.stage), stage = STAGES[(i + (dir > 0 ? 1 : n - 1) + n) % n];
  const to = alongTo(W, stage); return { stage, to, carry: carryOf(W, to) };
}
/* the stage a challenge is played at: the one the bar (and its card) names while you play it */
export const stageOfChallenge = ch => (ch ? whereOf('#/do/' + encodeURIComponent(ch.id)).stage : null);
