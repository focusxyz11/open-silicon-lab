/* The weave: one world of chips, entered by diving. Data only; every word a visitor reads is in src/i18n/en.json.

   - worlds: where a dive starts. Each kind of chip has its own way down (a data centre, a phone, a car), and
     every way down meets the others in the lower depths, because every chip is built from the same kinds of
     cells, switches and atoms. Words: world.<id>.name.
   - depths: each is a scene drawn in a 1000 x 1000 space; the next depth lives inside a small square of it,
     its portal [x, y, side]. m = metres across the view. A depth's portal leads to the next depth in every
     world that passes through it.
   - threads: open questions that run down through the depths. At each depth where a thread stops, it takes
     a new form (text: stop.<thread>.<depth>.q / .note / .tried) and lights up the parts of the scene it is
     about. A thread's first form (thread.<id>.root) is one of the core questions: it is never listed with
     the others, and appears only once a visitor has followed that thread through two depths.

   Adding a question means adding a stop: a thread, a depth, the parts it is about, and its words. */

export const DEPTHS = {
  /* a data centre */
  building: { m: 120, portal: [465, 423, 30] },
  rack: { m: 2, portal: [468, 452, 64] },
  board: { m: 0.3, portal: [425, 425, 150] },
  chip: { m: 0.02, portal: [190, 190, 70] },
  /* a phone */
  phone: { m: 0.18, portal: [380, 70, 300] },
  phoneboard: { m: 0.05, portal: [410, 360, 240] },
  soc: { m: 0.012, portal: [200, 490, 56] },
  /* a car */
  car: { m: 5, portal: [760, 500, 36] },
  ecu: { m: 0.18, portal: [455, 425, 40] },
  mcu: { m: 0.007, portal: [176, 236, 52] },
  /* shared by every chip */
  block: { m: 1e-5, portal: [300, 438, 44] },
  gate: { m: 3e-7, portal: [365, 660, 90] },
  switch: { m: 5e-8, portal: [475, 520, 50] },
  atom: { m: 2e-9 }
};
export const SHARED = ['block', 'gate', 'switch', 'atom'];
export const WORLDS = [
  { id: 'datacentre', depths: ['building', 'rack', 'board', 'chip', ...SHARED] },
  { id: 'phone', depths: ['phone', 'phoneboard', 'soc', ...SHARED] },
  { id: 'car', depths: ['car', 'ecu', 'mcu', ...SHARED] }
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
  'scale.building': ['power'], 'scale.chip': ['cores'], 'scale.switch': ['gate', 'channel'], 'scale.atom': ['lattice'],
  /* a phone */
  'life.phone': ['battery'], 'divide.phone': ['board', 'antenna'], 'know.phone': ['camera'],
  'fail.phoneboard': ['soc', 'pmic'], 'scale.phoneboard': ['soc'], 'open.phoneboard': ['modem'],
  'divide.soc': ['cpu', 'gpu', 'npu', 'isp'], 'think.soc': ['npu'], 'idea.soc': ['cpu'], 'scale.soc': ['cpu', 'gpu'],
  /* a car */
  'fail.car': ['controllers'], 'divide.car': ['controllers', 'wiring'], 'know.car': ['controllers'], 'life.car': ['sensors'],
  'fail.ecu': ['mcu'], 'open.ecu': ['mcu', 'connector'], 'divide.ecu': ['drivers', 'mcu'],
  'think.mcu': ['cores'], 'scale.mcu': ['flash', 'cores'], 'make.mcu': ['periph']
};
/* Stops whose words list real directions people are exploring (stop.<key>.tried, a list). */
export const TRIED = ['strange.chip', 'strange.gate', 'strange.switch', 'strange.atom', 'limit.chip', 'limit.gate', 'limit.atom', 'fail.building', 'fail.board', 'fail.gate',
  'idea.block', 'idea.gate', 'make.chip', 'make.switch', 'make.atom', 'know.switch', 'open.chip', 'open.block', 'divide.chip', 'divide.block', 'life.block', 'life.switch', 'scale.switch',
  'life.phone', 'divide.phone', 'idea.soc', 'life.car', 'fail.ecu'];
