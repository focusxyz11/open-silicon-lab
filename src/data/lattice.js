/* The lattice (#411): the Map's second arrangement (#/log/lattice). The same lab laid out by the matter a computer is
   made of (across) and the layer it reaches (down, from physics at the bottom to intelligence at the top): one map of
   many, in the spirit of building a computer from the bottom up, for the AI era and for matter beyond silicon. Data
   only, no words: the words are page.lat.* in src/i18n/en/pages.json; the view is src/v2/lattice.js, drawn by the
   Map (src/v2/glue/pages.js); tests in tests/lattice.test.mjs.

   MATTERS: the columns, left to right; the last is open, for a matter nobody has put in the lab yet.
   LAYERS: the rows, from the bottom up.
   PLACED: what the lab already has, one line per thing: [what, matter, layer]. What is 'ch:<challenge>' (src/v2/loop.js
     CHALLENGES), 'lv:<place>/<depth>' (a level, src/data/places.js INSIDE) or 'go:<page>' (PAGES below). Nothing is
     written twice: names and addresses are read from the lab's own data. Adding a thing to a cell is one line here.
   PAGES: the reading pages a cell can lead to: their address and the word that names them.
   CELLS: what a cell is beyond what the lab has, one line per cell: a list of facts (src/data/facts.json) when the thing
     is real elsewhere (shown with its source, beside what the lab has, if anything), 'open' when nobody has built it
     yet (its question: page.lat.q.<matter>.<layer>, or page.lat.q.<matter> for the whole column), or 'past' when this
     matter goes from the layer below to the one above without it (neurons and DNA learn without gates). A cell with
     nothing placed and no line here is open.
   PATHS: the six ways through it from the owner's discussion, lit one at a time: strands of cells in order (a path
     may climb in more than one matter at once), and marks, the things of the lab it passes, lit in their cells. */

export const MATTERS = ['everyday', 'silicon', 'light', 'molecules', 'cells', 'neurons', 'yours'];
export const LAYERS = ['physics', 'switch', 'logic', 'sums', 'processor', 'machine', 'intelligence'];

export const PAGES = {
  side: { href: '#/w/strange', word: 'page.lat.go.side' },
  machines: { href: '#/machines', word: 'machines.ui.kicker' }
};

export const PLACED = [
  /* everyday matter: dominoes and water */
  ['go:side', 'everyday', 'physics'],
  /* silicon */
  ['ch:crystal', 'silicon', 'physics'], ['ch:too-hot', 'silicon', 'physics'], ['ch:furnace', 'silicon', 'physics'], ['ch:shallow', 'silicon', 'physics'],
  ['ch:litho-finest', 'silicon', 'physics'], ['ch:euv-1000', 'silicon', 'physics'], ['ch:grover', 'silicon', 'physics'],
  ['lv:datacentre/atom', 'silicon', 'physics'], ['lv:quarry/crystal', 'silicon', 'physics'], ['lv:fab/implant', 'silicon', 'physics'],
  ['ch:transistor', 'silicon', 'switch'], ['ch:noise', 'silicon', 'switch'], ['ch:noise-big', 'silicon', 'switch'], ['ch:reversible', 'silicon', 'switch'],
  ['ch:etch', 'silicon', 'switch'], ['ch:bottom', 'silicon', 'switch'],
  ['lv:datacentre/switch', 'silicon', 'switch'], ['lv:fab/etch', 'silicon', 'switch'], ['lv:fab/deposit', 'silicon', 'switch'],
  ['ch:vote', 'silicon', 'logic'], ['ch:prove', 'silicon', 'logic'], ['ch:evolve', 'silicon', 'logic'], ['ch:flaky', 'silicon', 'logic'],
  ['ch:search', 'silicon', 'logic'], ['ch:maskof', 'silicon', 'logic'], ['ch:vias', 'silicon', 'logic'],
  ['lv:datacentre/gate', 'silicon', 'logic'], ['lv:studio/logic', 'silicon', 'logic'], ['lv:studio/gates', 'silicon', 'logic'], ['lv:fab/print', 'silicon', 'logic'],
  ['ch:half', 'silicon', 'sums'], ['ch:full', 'silicon', 'sums'], ['ch:counter', 'silicon', 'sums'], ['ch:cim', 'silicon', 'sums'],
  ['ch:power-curve', 'silicon', 'sums'], ['ch:chef', 'silicon', 'sums'], ['ch:ear', 'silicon', 'sums'], ['ch:floor', 'silicon', 'sums'],
  ['lv:datacentre/block', 'silicon', 'sums'], ['lv:studio/layout', 'silicon', 'sums'], ['lv:fab/wires', 'silicon', 'sums'],
  ['ch:rvrun', 'silicon', 'processor'], ['ch:corearch', 'silicon', 'processor'], ['ch:halt', 'silicon', 'processor'], ['ch:dataflow', 'silicon', 'processor'],
  ['ch:fast', 'silicon', 'processor'], ['ch:oxen', 'silicon', 'processor'], ['ch:cores', 'silicon', 'processor'], ['ch:spot', 'silicon', 'processor'],
  ['ch:dieread', 'silicon', 'processor'], ['ch:months', 'silicon', 'processor'], ['ch:quick', 'silicon', 'processor'], ['ch:cheaper', 'silicon', 'processor'],
  ['ch:onebad', 'silicon', 'processor'],
  ['lv:datacentre/chip', 'silicon', 'processor'], ['lv:phones/soc', 'silicon', 'processor'], ['lv:cars/mcu', 'silicon', 'processor'],
  ['lv:fab/die', 'silicon', 'processor'], ['lv:test/test', 'silicon', 'processor'],
  ['ch:jobs', 'silicon', 'machine'], ['ch:piece', 'silicon', 'machine'], ['ch:ai-chip', 'silicon', 'machine'], ['ch:archniche', 'silicon', 'machine'],
  ['ch:archspread', 'silicon', 'machine'], ['ch:thousand', 'silicon', 'machine'], ['ch:fed', 'silicon', 'machine'], ['ch:batch', 'silicon', 'machine'],
  ['ch:phone', 'silicon', 'machine'], ['ch:car', 'silicon', 'machine'], ['ch:dclife', 'silicon', 'machine'], ['ch:silent', 'silicon', 'machine'],
  ['ch:newest', 'silicon', 'machine'], ['ch:sig-heart', 'silicon', 'machine'], ['ch:sig-bearing', 'silicon', 'machine'], ['ch:reg-jobs', 'silicon', 'machine'],
  ['ch:jevons', 'silicon', 'machine'],
  ['lv:studio/need', 'silicon', 'machine'], ['lv:datacentre/board', 'silicon', 'machine'], ['lv:datacentre/rack', 'silicon', 'machine'],
  ['lv:datacentre/building', 'silicon', 'machine'], ['lv:phones/phoneboard', 'silicon', 'machine'], ['lv:cars/ecu', 'silicon', 'machine'],
  ['go:machines', 'silicon', 'machine'],
  ['ch:quantize', 'silicon', 'intelligence'], ['ch:prefill', 'silicon', 'intelligence'], ['ch:token-energy', 'silicon', 'intelligence'],
  ['ch:agent', 'silicon', 'intelligence'], ['ch:mortal', 'silicon', 'intelligence'],
  /* light */
  ['go:side', 'light', 'physics'], ['ch:light', 'light', 'sums'],
  /* molecules: DNA */
  ['go:side', 'molecules', 'physics'], ['ch:bridge', 'molecules', 'logic'], ['ch:dnawta', 'molecules', 'intelligence'],
  /* neurons, living or copied in silicon */
  ['go:side', 'neurons', 'physics'], ['ch:spikes', 'neurons', 'machine'], ['go:machines', 'neurons', 'intelligence']
];

export const CELLS = {
  'everyday.switch': 'open',
  'everyday.logic': ['domino-adder-2014'],
  'everyday.sums': ['domino-adder-2014'],
  'everyday.processor': 'open',
  'everyday.machine': ['moniac-1949'],
  'everyday.intelligence': 'open',
  'light.physics': ['light-per-tick'],
  'light.switch': 'open',
  'light.logic': 'open',
  'light.processor': ['qant-photonic'],
  'light.machine': ['cpo-production'],
  'light.intelligence': 'open',
  'molecules.switch': 'past',
  'molecules.logic': ['dna-sqrt-2011'],
  'molecules.sums': ['dna-sqrt-2011', 'biomemory-dna'],
  'molecules.processor': 'open',
  'molecules.machine': ['dna-route-1994'],
  'molecules.intelligence': ['dna-neural-2018'],
  'cells.physics': ['gene-switch-1965'],
  'cells.switch': ['toggle-2000'],
  'cells.logic': ['cello-2016'],
  'cells.sums': ['gene-counter-2009'],
  'cells.processor': 'open',
  'cells.machine': 'open',
  'cells.intelligence': 'open',
  'neurons.physics': ['nerve-speed'],
  'neurons.switch': 'past',
  'neurons.logic': 'past',
  'neurons.sums': 'past',
  'neurons.processor': 'past',
  'neurons.machine': ['hala-point'],
  'neurons.intelligence': ['cortical-cl1', 'brain-power']
};

export const PATHS = [
  { id: 'nand', strands: [['silicon.logic', 'silicon.sums', 'silicon.processor', 'silicon.machine']], marks: ['lv:studio/gates', 'ch:half', 'ch:full', 'ch:rvrun', 'ch:piece'] },
  { id: 'riscv', strands: [['silicon.logic', 'silicon.sums', 'silicon.processor', 'silicon.machine', 'silicon.intelligence']], marks: ['ch:vote', 'ch:full', 'ch:rvrun', 'ch:corearch', 'ch:ai-chip', 'ch:quantize'] },
  { id: 'physics', strands: [['silicon.physics', 'silicon.switch', 'silicon.logic', 'silicon.sums', 'silicon.processor']], marks: ['ch:crystal', 'lv:datacentre/atom', 'ch:transistor', 'lv:datacentre/switch', 'lv:datacentre/gate', 'lv:datacentre/block', 'lv:datacentre/chip'] },
  { id: 'things', strands: [['neurons.physics', 'neurons.machine', 'neurons.intelligence'], ['molecules.physics', 'molecules.intelligence'], ['silicon.switch', 'silicon.intelligence']], marks: ['ch:spikes', 'ch:noise', 'ch:mortal', 'ch:dnawta'] },
  { id: 'living', strands: [['molecules.physics', 'molecules.logic', 'cells.switch', 'cells.logic', 'cells.sums']], marks: ['ch:bridge'] },
  { id: 'spec', strands: [['everyday.sums', 'silicon.sums', 'light.sums', 'molecules.sums', 'cells.sums', 'yours.sums'], ['silicon.logic', 'molecules.logic']], marks: ['ch:half', 'ch:full', 'ch:light', 'ch:bridge'] }
];

/* a cell's key, and what the lab has there, in the order written */
export const cellKey = (m, l) => m + '.' + l;
export const placedAt = (m, l) => PLACED.filter(p => p[1] === m && p[2] === l).map(p => p[0]);
/* what a cell is: what the lab has (has), the facts it is real by elsewhere (real), and whether it is open or passed by */
export function cellOf(m, l) {
  const has = placedAt(m, l), c = CELLS[cellKey(m, l)];
  return { has, real: Array.isArray(c) ? c : [], open: c === 'open' || (!has.length && c == null), past: c === 'past' };
}
export const pathOf = id => PATHS.find(p => p.id === id) || null;
/* the cells a path lights, each once, in the order met */
export const pathCells = id => { const p = pathOf(id); return p ? [...new Set(p.strands.flat())] : []; };
/* what kind of thing an item is, and its id: ['ch', 'half'], ['lv', 'studio/gates'], ['go', 'side'] */
export const itemOf = s => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; };
