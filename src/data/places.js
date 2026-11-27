/* Where every page of the dive and the journey lives in the chip world (src/v2, docs/WORLD.md).
   The island is the journey: a chip's life along its loop road. Going into a place is the dive: down its levels,
   one inside the next. So every depth of the earlier site has an address, a place and a level inside it:
   the studio holds the design line, the quarry, factory, test house and port hold the journey's stations, and the
   data centre, phone island and car island hold the dives, each ending in the block, gate, switch and atom every
   chip shares. Questions (stops 'thread.depth') live at their depth, so at their place. */
import { WORLDS, SHARED, STOPS, THREADS } from './weave.js';

const depthsOf = id => WORLDS.find(w => w.id === id).depths;
/* the journey's stations on the island */
const STATION_OF = { crystal: 'quarry', slice: 'quarry', clean: 'fab', deposit: 'fab', print: 'fab', etch: 'fab', implant: 'fab', wires: 'fab', test: 'test', pkg: 'port', ship: 'port' };
const own = (world, depths) => depths.map(depth => ({ world, depth }));
const line = place => own('journey', depthsOf('journey').filter(d => STATION_OF[d] === place));

export const INSIDE = {
  studio: own('design', depthsOf('design')),
  quarry: line('quarry'),
  /* the factory's line, and inside one of its machines (the hidden dive from printing) */
  fab: line('fab').concat(own('made', depthsOf('made').filter(d => !SHARED.includes(d)))),
  test: line('test'),
  port: line('port'),
  datacentre: own('datacentre', depthsOf('datacentre')),
  phones: own('phone', depthsOf('phone')),
  cars: own('car', depthsOf('car'))
};
export { SHARED };

/* Above a place's levels: a level that is not a size (docs/PATH.md, #445). Mind, the stack's top rung, is what the
   machine does (a small network running on it: answers a second, the energy an answer costs, how often it is right),
   so it sits above the machine (the data centre's rack and board), not inside anything. It is a level of the data
   centre with a home in the atlas, so its parts, questions and challenges can live there; it is kept out of INSIDE,
   which the views read and the dive zooms through: the zoom runs on sizes and portals (DEPTHS in src/data/weave.js),
   and mind has neither, so putting it there would give the dive a level it cannot zoom to. Until the stack shows it
   (docs/PATH.md, "Building it", step 4), no view lists it and its way in is its place on the island (viewOfDepth,
   src/v2/loop.js). */
export const ABOVE = { datacentre: [{ world: 'datacentre', depth: 'mind' }] };
/* every level of a place, the ones above its zoom first: where a thing may have its home (src/data/atlas.js) */
export const levelsOf = place => (ABOVE[place] || []).concat(INSIDE[place] || []);
/* the place a level above the zoom belongs to, or null */
export const aboveOf = depth => Object.keys(ABOVE).find(p => ABOVE[p].some(l => l.depth === depth)) || null;

/* the place of a page of the earlier site (or of a level above a place's zoom) */
export function placeOf(world, depth) {
  for (const p of Object.keys(INSIDE)) if (levelsOf(p).some(l => l.world === world && l.depth === depth)) return p;
  return world === 'made' ? 'fab' : world === 'design' ? 'studio' : world === 'journey' ? 'fab' : null;
}

/* the questions at a level, in the threads' order; at a place, level by level */
const ORDER = THREADS.map(th => th.id);
export const stopsAt = depth => Object.keys(STOPS).filter(k => k.split('.')[1] === depth).sort((a, b) => ORDER.indexOf(a.split('.')[0]) - ORDER.indexOf(b.split('.')[0]));
export const askAt = place => (INSIDE[place] || []).map(l => ({ level: l, stops: stopsAt(l.depth) })).filter(x => x.stops.length);
