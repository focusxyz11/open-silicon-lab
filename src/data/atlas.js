/* The atlas: one home for every thing (docs/SYSTEM.md).
   Every part, figure, question, challenge and story has exactly one address: a place of the chip world and a
   level inside it (src/data/places.js). Views never own content: they read it from here, by address, and show it
   their own way. So a thing is written once and appears wherever its place and level are shown.

   - Parts are the named shapes of the scenes, ids 'depth.part' (words part.<id> and what.<id>); the depth in the
     id is their home. A view that draws a part names it by that id (VIEW_PARTS), never with words of its own.
   - Questions are the stops 'thread.depth'; their depth is their home. The questions from the field
     (src/data/questions.js) each have one home too, a level or a place; a leak also sits on a seam.
   - Challenges carry their place and level (src/v2/game.js); stories carry theirs (STORIES).
   - TWINS is the Turn: each level of a chip seen three ways, designed in the studio, made at the factory, used in
     the dive. */
import { INSIDE, placeOf, stopsAt, SHARED } from './places.js';
import { MADE, WORLDS, DEPTHS, partWord } from './weave.js';
import { FIELD, fieldOf, fieldAtLevel, fieldAtPlace } from './questions.js';

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
/* the questions from the field (src/data/questions.js): each at a level, or at a place of the island */
export const fieldHome = id => { const q = fieldOf(id); return !q ? null : q.home.level ? levelAt(q.home.level) : { place: q.home.place, world: null, level: null }; };
export { FIELD, fieldOf, fieldAtLevel, fieldAtPlace };

/* the parts each 3D view draws, by the id of their one home */
export const VIEW_PARTS = {
  /* the flight through the data centre (src/v2/dc3d.js) */
  flight: { halls: 'building.halls', cooling: 'building.cooling', substation: 'building.substation', racks: 'building.racks', hotaisle: 'building.hotaisle', trays: 'building.trays', coldair: 'building.coldair',
    switch: 'rack.switch', servers: 'rack.servers', power: 'rack.power', fans: 'rack.fans', accelerator: 'board.bigchip', memory: 'board.memory', network: 'board.connectors',
    package: 'chip.package', powerstages: 'board.power', lid: 'pkg.lid', die: 'pkg.die', hbm: 'pkg.memory', base: 'pkg.substrate' },
  /* the flight through a phone (src/v2/phone3d-flight.js) */
  phone: { screen: 'phone.screen', antenna: 'phone.antenna', cable: 'phone.cable', battery: 'phone.battery', board: 'phone.board', camera: 'phone.camera', shield: 'phoneboard.shield',
    soc: 'phoneboard.soc', dram: 'phoneboard.dram', pmic: 'phoneboard.pmic', modem: 'phoneboard.modem', storage: 'phoneboard.storage',
    cpu: 'soc.cpu', gpu: 'soc.gpu', npu: 'soc.npu', isp: 'soc.isp', cache: 'soc.cache' },
  /* the flight through a car (src/v2/car3d-flight.js) */
  car: { sensors: 'car.sensors', wheels: 'car.wheels', battery: 'car.battery', motor: 'car.motor', controllers: 'car.controllers', wiring: 'car.wiring',
    case: 'ecu.case', connector: 'ecu.connector', mcu: 'ecu.mcu', drivers: 'ecu.drivers', cores: 'mcu.cores', flash: 'mcu.flash', sram: 'mcu.sram', periph: 'mcu.periph' },
  /* the studio walked inside (src/v2/studio3d.js): the screen at each corner, where its bench opens (src/data/studio.js) */
  studio: { notes: 'need.notes', code: 'logic.desk', results: 'check.wall', gates: 'gates.drawing', screentable: 'layout.screentable', lighttable: 'masks.lighttable' },
  board: { chip: 'board.bigchip', die: 'pkg.die', hbm: 'pkg.memory', vrm: 'board.power', links: 'board.connectors' },
  chip: { lid: 'pkg.lid', bumps: 'pkg.bumps', wires: 'block.wires', contacts: 'gate.metal', gates: 'gate.gates', sheets: 'switch.channel', wells: 'atom.dopant', silicon: 'atom.lattice' },
  /* the dive's levels in 3D, the parts they draw besides their own scene's, by 'level.key' (src/v2/relief3d.js): the
     data centre's chip shows the memory stacked beside its die, as the flight did */
  dive: { 'chip.hbm': 'pkg.memory' }
};
/* the words of a part a level of the dive draws: its own, or those of the part's home elsewhere */
export const diveWord = (level, key) => VIEW_PARTS.dive[level + '.' + key] || partWord(level, key);

/* how big each level is, roughly: metres across one picture of it. A level of the dive has its size in its one home
   (m in DEPTHS, src/data/weave.js, which the zoom itself runs on); the flight's levels above the board, which the dive
   does not have, have theirs here. Physical sizes rounded to a figure, not industry figures; they agree with the
   levels' own words (depth.*.see, place.dc.*.d). The frame's rail says them, and how many times closer the next level
   is (src/v2/frame.js). Steps of a line (the factory's, the studio's) are steps, not sizes, and have none */
/* handset: the phone flown through, closed or opened like a book; cabin: the car cut away round its footwell */
const FLIGHT_SIZES = { campus: 500, hall: 100, server: 0.8, handset: 0.15, cabin: 2 };
export const sizeOf = level => (DEPTHS[level] && DEPTHS[level].m) || FLIGHT_SIZES[level] || null;

/* Questions to build: an open question with an engine and a game of its own (#263). Its home is here and only here: the
   place and level where it lives (its challenge is played there: CHALLENGES in src/v2/game.js reads its address from
   this), the world of the core question it sits inside (content/<world>.md), the questions from the field whose cards
   and seams offer it, and its ladder: which rung of the question each level of its game stands on (look, deeper,
   deeper still, the age of AI, beyond chips), with one bit's trip as the measure. The engine, the game, the ledger's
   attempts and the figures do not depend on where it is shown, so when the lab is restructured round the new core
   questions the question moves by changing its address here, not what it is. */
export const QUESTIONS = {
  bits: { home: { place: 'datacentre', level: 'block' }, world: 'divide', field: ['fetch', 'wait'], challenge: 'chef', engine: 'src/engines/bits.js',
    ladder: { trip: 'measure', wire: 'look', chip: 'deeper', stacked: 'still', light: 'still', dc: 'ai', brain: 'beyond', team: 'beyond' } }
};
/* the question to build a question of the field offers, if any */
export const questionOfField = id => Object.keys(QUESTIONS).find(k => QUESTIONS[k].field.includes(id)) || null;

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
