/* The frame: the fixed structure of the lab, which new content fills but does not change.

   Two axes and one dial:
     questions   11 open questions, the framework. 10 run down through the world as threads;
                 the 11th (scale) lives on the time dial.
     depths      10 powers of ten, one continuous dive from the planet to the atom.
     time        the year dial, 1947 to 2040 (shared with the time machine).

   Every place in the lab has an address: question + depth (+ year).
   Every existing topic is docked at one place, so its labs and challenges appear where its question
   meets its depth. Words live in src/i18n/en.json under frame.q.<id>.*, frame.d.<id> and frame.p.<a>|<b>. */

/* home: [col, row, w, h] of the question's block on the die (a 4 x 4 grid; scale sits in the centre). */
export const QUESTIONS = [
  { id: 'think',   domain: 'chip',   home: [0, 0, 1, 1], entry: 'chip' },
  { id: 'strange', domain: 'chip',   home: [1, 0, 2, 1], entry: 'gate' },
  { id: 'limit',   domain: 'chip',   home: [3, 0, 1, 1], entry: 'atom' },
  { id: 'fail',    domain: 'craft',  home: [3, 1, 1, 1], entry: 'chip' },
  { id: 'idea',    domain: 'craft',  home: [3, 2, 1, 1], entry: 'block' },
  { id: 'make',    domain: 'craft',  home: [3, 3, 1, 1], entry: 'building' },
  { id: 'know',    domain: 'people', home: [0, 1, 1, 1], entry: 'planet' },
  { id: 'open',    domain: 'people', home: [0, 2, 1, 1], entry: 'region' },
  { id: 'divide',  domain: 'future', home: [0, 3, 2, 1], entry: 'chip' },
  { id: 'life',    domain: 'future', home: [2, 3, 1, 1], entry: 'block' },
  { id: 'scale',   domain: 'engine', home: [1, 1, 2, 2], entry: 'switch', onTime: true }
];

/* m = metres across the view at that depth. */
export const DEPTHS = [
  { id: 'planet',   m: 1.3e7 },
  { id: 'region',   m: 1e5 },
  { id: 'building', m: 120 },
  { id: 'rack',     m: 2 },
  { id: 'board',    m: 0.3 },
  { id: 'chip',     m: 0.02 },
  { id: 'block',    m: 1e-5 },
  { id: 'gate',     m: 3e-7 },
  { id: 'switch',   m: 5e-8 },
  { id: 'atom',     m: 2e-9 }
];

/* Where each existing topic docks: [question, depth]. One place each; the topic's own links still connect it elsewhere. */
export const PLACES = {
  riscv: ['think', 'chip'],          clock: ['think', 'block'],
  photonic: ['strange', 'switch'],   pbits: ['strange', 'gate'],
  quantum: ['limit', 'atom'],        floor: ['limit', 'atom'],        reversible: ['limit', 'gate'],
  reality: ['fail', 'chip'],         bench: ['fail', 'board'],
  design: ['idea', 'block'],         layout: ['idea', 'block'],       agent: ['idea', 'block'],       tiny: ['idea', 'gate'],
  factory: ['make', 'building'],     yield: ['make', 'chip'],         litho: ['make', 'gate'],        fab: ['make', 'switch'],        physics: ['make', 'atom'],
  supply: ['know', 'planet'],        innovation: ['know', 'planet'],  xray: ['know', 'chip'],
  everywhere: ['open', 'region'],    economics: ['open', 'region'],   community: ['open', 'chip'],
  memory: ['divide', 'board'],       package: ['divide', 'board'],    analog: ['divide', 'board'],
  architecture: ['divide', 'chip'],  accelerators: ['divide', 'chip'], build: ['divide', 'chip'],   spatial: ['divide', 'chip'],
  datacenter: ['life', 'building'],  neuro: ['life', 'chip'],         beyond: ['life', 'chip'],       cim: ['life', 'block'],         evolve: ['life', 'gate'],
  future: ['scale', 'planet'],       transistor: ['scale', 'switch']
};

/* Portals between questions: wires on the die, doors inside the world. */
export const PORTALS = [
  ['think', 'strange'], ['think', 'limit'], ['think', 'idea'], ['think', 'life'],
  ['strange', 'fail'], ['strange', 'life'], ['strange', 'scale'],
  ['limit', 'life'], ['limit', 'scale'],
  ['fail', 'idea'], ['fail', 'make'],
  ['idea', 'make'], ['idea', 'open'],
  ['make', 'know'], ['make', 'scale'],
  ['know', 'open'], ['open', 'divide'],
  ['divide', 'life'], ['divide', 'scale']
];

export const questionById = id => QUESTIONS.find(q => q.id === id);
export const depthIndex = id => DEPTHS.findIndex(d => d.id === id);
/* Topics docked at one place, in depth order when a question is given alone. */
export const topicsAt = (q, d) => Object.keys(PLACES).filter(t => PLACES[t][0] === q && (d == null || PLACES[t][1] === d))
  .sort((a, b) => depthIndex(PLACES[a][1]) - depthIndex(PLACES[b][1]));
export const placeOf = topic => PLACES[topic] || null;
