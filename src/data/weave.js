/* The weave: one world, entered by diving. Data only; every word a visitor reads is in src/i18n/en.json.

   - depths: from a data-centre building down to silicon atoms, one continuous zoom. Each depth is a scene
     drawn in a 1000 x 1000 space; the next depth lives inside a small square of it, its portal [x, y, side].
     m = metres across the view at that depth.
   - threads: open questions that run down through the depths. At each depth where a thread stops, it takes
     a new form (text: stop.<thread>.<depth>.q / .note / .tried) and lights up the parts of the scene it is
     about. A thread's first form (thread.<id>.root) is one of the core questions: it is never listed with
     the others, and appears only once a visitor has followed that thread through two depths.

   Adding a question means adding a stop: a thread, a depth, the parts it is about, and its words. */

export const DEPTHS = [
  { id: 'building', m: 120, portal: [465, 423, 30] },
  { id: 'rack', m: 2, portal: [468, 452, 64] },
  { id: 'board', m: 0.3, portal: [425, 425, 150] },
  { id: 'chip', m: 0.02, portal: [190, 190, 70] },
  { id: 'block', m: 1e-5, portal: [300, 438, 44] },
  { id: 'gate', m: 3e-7, portal: [365, 660, 90] },
  { id: 'switch', m: 5e-8, portal: [475, 520, 50] },
  { id: 'atom', m: 2e-9 }
];

/* hue: the thread's colour. A thread is recognised by colour and by its words, never by a name. */
export const THREADS = [
  { id: 'think', hue: 215 }, { id: 'strange', hue: 262 }, { id: 'limit', hue: 305 }, { id: 'fail', hue: 350 }, { id: 'idea', hue: 24 },
  { id: 'make', hue: 46 }, { id: 'know', hue: 82 }, { id: 'open', hue: 135 }, { id: 'divide', hue: 168 }, { id: 'life', hue: 192 }, { id: 'scale', hue: 0 }
];

/* STOPS['thread.depth'] = the parts of that depth's scene this question lights up. */
export const STOPS = {
  'think.rack': ['servers'], 'think.board': ['bigchip', 'memory'], 'think.chip': ['cores'], 'think.block': ['sram'], 'think.gate': ['gates', 'metal'], 'think.switch': ['gate', 'channel'], 'think.atom': ['electrons'],
  'strange.chip': ['cores', 'cache'], 'strange.gate': ['gates'], 'strange.switch': ['channel'], 'strange.atom': ['dopant'],
  'limit.rack': ['servers'], 'limit.chip': ['cache'], 'limit.gate': ['diff'], 'limit.atom': ['lattice'],
  'fail.building': ['racks'], 'fail.board': ['bigchip', 'power'], 'fail.chip': ['clock'], 'fail.gate': ['gates'], 'fail.switch': ['channel', 'oxide'], 'fail.atom': ['boundary'],
  'idea.chip': ['cores', 'cache', 'io'], 'idea.block': ['cells'], 'idea.gate': ['metal'],
  'make.chip': ['io'], 'make.switch': ['gate', 'source', 'drain'], 'make.atom': ['lattice'],
  'know.chip': ['cores'], 'know.switch': ['oxide'],
  'open.chip': ['cores'], 'open.block': ['cells'], 'open.gate': ['gates', 'diff'],
  'divide.building': ['racks'], 'divide.rack': ['switch', 'cooling', 'power'], 'divide.board': ['bigchip', 'memory', 'power'], 'divide.chip': ['cores', 'cache'], 'divide.block': ['sram', 'wires'],
  'life.building': ['power', 'cooling'], 'life.block': ['cells'], 'life.switch': ['channel'], 'life.atom': ['lattice'],
  'scale.building': ['power'], 'scale.chip': ['cores'], 'scale.switch': ['gate', 'channel'], 'scale.atom': ['lattice']
};
/* Stops whose words list real directions people are exploring (stop.<key>.tried, a list). */
export const TRIED = ['strange.chip', 'strange.gate', 'strange.switch', 'strange.atom', 'limit.chip', 'limit.gate', 'limit.atom', 'fail.building', 'fail.board', 'fail.gate',
  'idea.block', 'idea.gate', 'make.chip', 'make.switch', 'make.atom', 'know.switch', 'open.chip', 'open.block', 'divide.chip', 'divide.block', 'life.block', 'life.switch', 'scale.switch'];
