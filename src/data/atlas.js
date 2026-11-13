/* The atlas: one home for every thing (docs/SYSTEM.md).
   Every part, figure, question, challenge and story has exactly one address: a place of the chip world and a
   level inside it (src/data/places.js). Views never own content: they read it from here, by address, and show it
   their own way. So a thing is written once and appears wherever its place and level are shown.

   - Parts are the named shapes of the scenes, ids 'depth.part' (words part.<id> and what.<id>); the depth in the
     id is their home. A view that draws a part names it by that id (VIEW_PARTS), never with words of its own.
   - Questions are the stops 'thread.depth'; their depth is their home.
   - Challenges carry their place and level (src/v2/game.js); stories carry theirs (STORIES).
   - TWINS is the Turn: each level of a chip seen three ways, designed in the studio, made at the factory, used in
     the dive. */
import { INSIDE, placeOf, stopsAt, SHARED } from './places.js';
import { MADE, WORLDS } from './weave.js';

/* the world where a depth is drawn first (a place's own level before a shared one) */
export const worldOf = depth => {
  for (const L of Object.values(INSIDE)) { const l = L.find(x => x.depth === depth && !SHARED.includes(x.depth)); if (l) return l.world; }
  if (SHARED.includes(depth)) return 'datacentre';
  const w = WORLDS.find(x => x.depths.includes(depth)); return w ? w.id : null;
};
/* the address of a depth, and of the things that live there */
export const levelAt = depth => { const world = worldOf(depth); return world ? { place: placeOf(world, depth), world, level: depth } : null; };
/* the factory's handling (pods, robots, the overhead track) is part of every step; its home is the first */
const AT = { handle: 'clean' };
export const partHome = id => { const d = id.split('.')[0]; return levelAt(AT[d] || d); };
export const stopHome = key => levelAt(key.split('.')[1]);

/* the parts each 3D view draws, by the id of their one home */
export const VIEW_PARTS = {
  /* the flight through the data centre (src/v2/dc3d.js) */
  flight: { halls: 'building.halls', cooling: 'building.cooling', substation: 'building.substation', racks: 'building.racks', hotaisle: 'building.hotaisle', trays: 'building.trays', coldair: 'building.coldair',
    switch: 'rack.switch', servers: 'rack.servers', power: 'rack.power', fans: 'rack.fans', accelerator: 'board.bigchip', memory: 'board.memory', network: 'board.connectors',
    package: 'chip.package', powerstages: 'board.power', die: 'pkg.die', hbm: 'pkg.memory' },
  board: { chip: 'board.bigchip', die: 'pkg.die', hbm: 'pkg.memory', vrm: 'board.power', links: 'board.connectors' },
  chip: { lid: 'pkg.lid', bumps: 'pkg.bumps', wires: 'block.wires', contacts: 'gate.metal', gates: 'gate.gates', fins: 'switch.channel', wells: 'atom.dopant', silicon: 'atom.lattice' }
};

/* the stories that drive scenes (src/v2/stories.js), each at home at one level */
export const STORIES = { board: { place: 'datacentre', level: 'board', view: 'board' } };

/* The Turn: a level as it is designed (a depth of the studio), made (the factory steps, in order) and used (the
   depth of the dive). The made steps are the weave's MADE, with the crystal grown before anything is implanted. */
export const TWINS = [
  { used: 'chip', designed: 'need', made: ['pkg'] },
  { used: 'block', designed: 'layout', made: ['wires'] },
  { used: 'gate', designed: 'gates', made: ['print'] },
  { used: 'switch', designed: null, made: ['etch'] },
  { used: 'atom', designed: null, made: ['crystal', 'implant'] }
];
/* the twins of any depth: a depth of the dive, of the studio (masks feed the printing, the description becomes
   gates) or of the factory */
const DESIGN_TO = { need: 'chip', logic: 'gate', check: 'gate', gates: 'gate', layout: 'block', masks: 'gate' };
export function twinOf(depth) {
  return TWINS.find(x => x.used === depth || x.designed === depth || x.made.includes(depth)) || (DESIGN_TO[depth] ? TWINS.find(x => x.used === DESIGN_TO[depth]) : null) ||
    (MADE[depth] ? TWINS.find(x => x.made.includes(MADE[depth])) : null);
}
export { stopsAt };
