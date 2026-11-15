/* The way: where you are in the lab, and where each move leads (docs/reviews/structure.md). Pure logic, no DOM;
   tests in tests/way.test.mjs.

   The lab is one grid. Across it runs a chip's life, the loop: someone needs it, then it is designed, made,
   tested, shipped and used, and what is learned in use comes back as the next need. Down it runs scale: a place,
   then its levels, one inside the next, to the atom. An address is a cell of that grid, and there are two moves:
     in · out   scale: into the part in view, or up to the level above;
     along      the chip's life: the next stage, holding the depth you are at wherever that depth exists there
                (a gate as it is used, the same gate as it is printed, the same gate as you designed it).
   Everything else is a tap. The shell (src/v2/app.js) shows the two axes as two rails, the loop in the bar and the
   levels at the side, and the open port gives the same graph to AI agents (look, in src/engines/api.js). */
import { twinOf } from '../data/atlas.js';
import { placeOf } from '../data/places.js';
import { viewOfDepth, challengeOf, DIVE_WORLD, DIVE_LEVELS, PLACES } from '../v2/game.js';

/* the loop, in order; the need is where it starts and where it comes back */
export const STAGES = ['need', 'design', 'make', 'test', 'ship', 'use'];
/* the place that stands for each stage on the island */
export const STAGE_PLACE = { need: 'lab', design: 'studio', make: 'fab', test: 'test', ship: 'port', use: 'datacentre' };
/* and the stage every place belongs to (the sandbank for what does not exist yet has none) */
const PLACE_STAGE = { lab: 'need', village: 'need', studio: 'design', quarry: 'make', fab: 'make', test: 'test', port: 'ship', datacentre: 'use', phones: 'use', cars: 'use' };
export const stageOfPlace = place => PLACE_STAGE[place] || null;
/* the next place round the loop: the crystal goes on to the factory, everything else to the next stage's place */
export const nextPlace = place => {
  if (place === 'quarry') return 'fab';
  const s = stageOfPlace(place); return STAGE_PLACE[STAGES[(STAGES.indexOf(s) + 1) % STAGES.length]];
};

/* the data centre is flown through: each stop of the flight shows one level */
const FLIGHT = ['building', 'building', 'rack', 'rack', 'board', 'chip'];
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
  return /^#\/(dive|line)\//.test(h) ? h : null;
}

/* the cell an address shows: its view, place, level and stage of the loop */
export function whereOf(hash) {
  const p = parts(hash), k = p[0] || 'island';
  if (k === 'ask') return Object.assign(whereOf(viewOfDepth(p[2] || 'chip')), { ask: p[1] || null });
  if (k === 'do') { const ch = challengeOf(decodeURIComponent(p[1] || '')), h = doHome(ch); return h ? whereOf(h) : ch ? cell('island', ch.place) : cell('island'); }
  if (k === 'dive') { const world = p[2] || DIVE_WORLD[p[1]] || 'datacentre'; return cell('dive', DIVE_PLACE[world] || 'datacentre', p[1] || 'chip', world === 'made' ? 'make' : 'use', { world }); }
  if (k === 'line') { const level = p[1] || 'crystal'; return cell('line', placeOf('journey', level) || 'fab', level); }
  if (k === 'bench') return cell('bench', 'studio', p[1] || 'need');
  if (k === 'chip') { const row = Math.min(DIVE_LEVELS.length - 1, Math.max(0, +p[1] || 0)), build = p[2] === 'build'; return cell('chip', build ? 'fab' : 'datacentre', DIVE_LEVELS[row], build ? 'make' : 'use', { row, build }); }
  if (k === 'board') return cell('board', 'datacentre', 'board');
  if (k === 'supply') return cell('supply', 'port', 'ship');
  if (k === 'build') return cell('page', 'lab');
  if (k === 'place' && p[1] === 'datacentre' && p[2] != null && p[2] !== 'inside') return cell('flight', 'datacentre', FLIGHT[+p[2]] || 'building');
  if (k === 'place' && PLACES.includes(p[1])) return cell('island', p[1]);
  return cell(k === 'ecosystem' ? 'out' : ['log', 'challenges', 'questions'].includes(k) ? 'log' : 'island');
}

/* along: the address of another stage of the loop, from where you are. The depth is held where the level has a
   twin there (the atlas's Turn), the factory's line is walked where you are already on it, and otherwise the move
   lands at that stage's place on the island. Null when you are already at that stage, inside a place. */
export function alongTo(where, stage) {
  if (!STAGES.includes(stage)) return null;
  const W = where || cell('island'), home = '#/place/' + STAGE_PLACE[stage];
  if (W.stage === stage && W.view !== 'island' && W.view !== 'page') return null;
  if (stage === 'need') return home;
  if (W.view === 'chip' && (stage === 'make' || stage === 'use')) return '#/chip/' + W.row + (stage === 'make' ? '/build' : '');
  if (W.view === 'line' && (stage === 'make' || stage === 'test' || stage === 'ship')) return '#/line/' + ({ make: 'wires', test: 'test', ship: 'pkg' })[stage];
  const tw = W.level && W.view !== 'island' ? twinOf(W.level === 'die' ? 'chip' : W.level) : null;
  if (tw) {
    if (stage === 'design' && tw.designed) return '#/bench/' + tw.designed;
    /* a whole chip is made as a die on its wafer, and closed in its package on the way out */
    if (stage === 'make') return tw.used === 'chip' ? '#/dive/die/made' : '#/line/' + tw.made[tw.made.length - 1];
    if (stage === 'ship' && tw.used === 'chip') return '#/line/pkg';
    if (stage === 'use') return '#/dive/' + tw.used;
  }
  return home;
}
/* whether that move holds the depth you are at (the bar says so before you take it) */
export const holds = (where, stage) => { const h = alongTo(where, stage); return !!h && !h.startsWith('#/place/'); };
