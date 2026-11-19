/* Something to do at every level (issues #235, #246, #247): a level's question turned into a small search on its
   picture. The card says what to look for (seek.<key>.find); tapping a part, on the picture or in the card, gives
   something true to notice about it (seek.<key>.<part>); the part that leads into the question (leads) lights the
   question's thread to follow; finding it is kept in your log (S.looked in src/v2/game.js, by key). The search leads
   to the question; it never answers it.
   view: where the level is shown: 'flight', the data centre flown through (src/v2/dc3d.js), its parts the ids of
   VIEW_PARTS.flight; 'phone', the phone flown through (src/v2/phone3d-flight.js), its parts the ids of
   VIEW_PARTS.phone; 'dive', the dive, its parts the keys of the level's scene (src/app/scenes.js). level: the level
   it is at in that view, when it is not the key itself (a flight's level may share its name with a level of the
   dive). fly: a level of the dive that the phone's flight flies through too shows the same search there, at that
   level of the flight, with the same parts (one search, found once, wherever you meet it). ask: the question's stop
   key, the one the level's card shows; at: the address of the level, for your log. A level of the dive that every
   world shares (the block, the gate, the switch, the atom) has one search, as it has one picture. */
export const SEEK = {
  /* the data centre, flown through */
  campus: { view: 'flight', ask: 'life.building', parts: ['halls', 'cooling', 'substation'], leads: 'substation', at: '#/place/datacentre/0' },
  hall: { view: 'flight', ask: 'divide.building', parts: ['racks', 'hotaisle', 'trays'], leads: 'trays', at: '#/place/datacentre/1' },
  rack: { view: 'flight', ask: 'think.rack', parts: ['switch', 'servers', 'power'], leads: 'servers', at: '#/place/datacentre/2' },
  server: { view: 'flight', ask: 'divide.rack', parts: ['fans', 'accelerator', 'memory', 'network'], leads: 'accelerator', at: '#/place/datacentre/3' },
  board: { view: 'flight', ask: 'think.board', parts: ['package', 'lid', 'powerstages'], leads: 'package', at: '#/place/datacentre/4' },
  accel: { view: 'flight', level: 'chip', ask: 'think.chip', parts: ['die', 'hbm', 'base'], leads: 'die', at: '#/place/datacentre/5' },
  /* the phone, flown through: the closed phone (its other levels are the dive's, below) */
  handset: { view: 'phone', level: 'phone', ask: 'life.phone', parts: ['screen', 'antenna', 'cable'], leads: 'cable', at: '#/place/phones/0' },
  /* the dive: the data centre's chip */
  chip: { view: 'dive', ask: 'think.chip', parts: ['cores', 'cache', 'io', 'clock'], leads: 'cores', at: '#/dive/chip' },
  /* a phone's: opened, its board, its chip (each also in the phone's flight) */
  phone: { view: 'dive', fly: 'inside', ask: 'know.phone', parts: ['board', 'battery', 'camera', 'antenna'], leads: 'camera', at: '#/dive/phone/phone' },
  phoneboard: { view: 'dive', fly: 'board', ask: 'fail.phoneboard', parts: ['soc', 'pmic', 'modem', 'storage'], leads: 'soc', at: '#/dive/phoneboard/phone' },
  soc: { view: 'dive', fly: 'chip', ask: 'think.soc', parts: ['cpu', 'gpu', 'npu', 'isp', 'cache'], leads: 'npu', at: '#/dive/soc/phone' },
  /* a car's: the car, a control unit, its chip */
  car: { view: 'dive', ask: 'fail.car', parts: ['controllers', 'wiring', 'sensors', 'battery', 'motor', 'wheels'], leads: 'controllers', at: '#/dive/car/car' },
  ecu: { view: 'dive', ask: 'fail.ecu', parts: ['mcu', 'connector', 'drivers'], leads: 'mcu', at: '#/dive/ecu/car' },
  mcu: { view: 'dive', ask: 'think.mcu', parts: ['cores', 'flash', 'sram', 'periph'], leads: 'cores', at: '#/dive/mcu/car' },
  /* the made chip's: the machine that prints it, one chip on the wafer (the wafer itself draws only two parts) */
  scanner: { view: 'dive', ask: 'make.scanner', parts: ['source', 'mirrors', 'mask', 'stage', 'vacuum'], leads: 'source', at: '#/dive/scanner/made' },
  die: { view: 'dive', ask: 'idea.die', parts: ['cores', 'pads', 'probes', 'scribe'], leads: 'cores', at: '#/dive/die/made' },
  /* every world's: the block, the gate, the switch, the atom */
  block: { view: 'dive', ask: 'think.block', parts: ['cells', 'sram', 'wires'], leads: 'sram', at: '#/dive/block' },
  gate: { view: 'dive', ask: 'think.gate', parts: ['gates', 'diff', 'metal'], leads: 'metal', at: '#/dive/gate' },
  switch: { view: 'dive', ask: 'think.switch', parts: ['gate', 'channel', 'oxide', 'source', 'drain'], leads: 'gate', at: '#/dive/switch' },
  atom: { view: 'dive', ask: 'think.atom', parts: ['lattice', 'dopant', 'electrons', 'boundary'], leads: 'electrons', at: '#/dive/atom' }
};
export const SEEK_LEVELS = Object.keys(SEEK);
/* the level a search is at, in its own view */
export const seekLevel = k => SEEK[k].level || k;
/* the search at a level of a view, if it has one: its key (the phone's flight also has the dive's levels it flies through) */
export const seekAt = (view, level) => SEEK_LEVELS.find(k => (SEEK[k].view === view && seekLevel(k) === level) || (view === 'phone' && SEEK[k].fly === level)) || null;
/* what you have looked at, kept: only parts a search has, in its order */
export const normalLooked = v => {
  const out = {};
  Object.entries(v && typeof v === 'object' ? v : {}).forEach(([lv, ps]) => { if (SEEK[lv] && Array.isArray(ps)) { const k = SEEK[lv].parts.filter(p => ps.includes(p)); if (k.length) out[lv] = k; } });
  return out;
};
export const foundAt = (looked, lv) => !!(SEEK[lv] && looked && looked[lv] && looked[lv].includes(SEEK[lv].leads));
