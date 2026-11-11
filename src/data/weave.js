/* The weave: one world of chips, entered by diving. Data only; every word a visitor reads is in src/i18n/en.json.

   - worlds: where a dive starts. Each kind of chip has its own way down (a data centre, a phone, a car), and
     every way down meets the others in the lower depths, because every chip is built from the same kinds of
     cells, switches and atoms. Words: world.<id>.name.
   - the journey: one world is not a dive but a line (line: true). Its depths are stations, moved through
     sideways, in the order a chip is made: from crystal to a chip shipped into a data centre, a phone or a
     car. From some stations you can dive down (DIVES), into a world the top bar does not show (hidden), and
     the last station sends the chip into the dives (EXITS). A station may hold a small picture of a depth
     you can dive into (inner).
   - depths: each is a scene drawn in a 1000 x 1000 space; the next depth lives inside a small square of it,
     its portal [x, y, side]. m = metres across the view. A depth's portal leads to the next depth in every
     world that passes through it.
   - threads: open questions that run down through the depths. At each depth where a thread stops, it takes
     a new form (text: stop.<thread>.<depth>.q / .note / .tried) and lights up the parts of the scene it is
     about. A thread's first form (thread.<id>.root) is one of the core questions: it is never listed with
     the others, and appears only once a visitor has followed that thread through two depths.

   - cases: real events that show a stop's question is not only a thought experiment (text: case.<id>.*).
   - figures: the numbers that back a stop, by id in src/data/facts.json, where each has its source, the date
     it was checked and its kind. A number in a stop's words must have one here (a test checks it).

   Adding a question means adding a stop: a thread, a depth, the parts it is about, and its words. */

/* Where visitors propose questions: the repository's issue form (.github/ISSUE_TEMPLATE/question.yml). */
export const REPO = 'https://github.com/focusxyz11/open-silicon-lab';

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
  /* the journey: stations of the line (no portals: you move along, not down) */
  crystal: { station: true },
  slice: { station: true },
  fab: { station: true, portal: [518, 359, 134], inner: 'bay' },
  bay: { station: true, portal: [645, 373, 240], inner: 'scanner' },
  pkg: { station: true },
  ship: { station: true },
  /* inside the factory: a dive from the machine that prints with light (the wafer's portal follows your chip's size) */
  scanner: { m: 4, portal: [642, 672, 176] },
  wafer: { m: 0.32, portal: [478, 478, 44] },
  die: { m: 0.015, portal: [190, 190, 70] },
  /* shared by every chip */
  block: { m: 1e-5, portal: [300, 438, 44] },
  gate: { m: 3e-7, portal: [365, 660, 90] },
  switch: { m: 5e-8, portal: [475, 520, 50] },
  atom: { m: 2e-9 }
};
export const SHARED = ['block', 'gate', 'switch', 'atom'];
/* the journey's ways down, and its ways out: station -> [world, depth] */
export const DIVES = { bay: [['made', 'scanner'], ['made', 'switch']], wafer: [['made', 'die']] };
export const EXITS = { ship: [['datacentre', 'chip'], ['phone', 'soc'], ['car', 'mcu']] };
export const WORLDS = [
  { id: 'datacentre', depths: ['building', 'rack', 'board', 'chip', ...SHARED] },
  { id: 'phone', depths: ['phone', 'phoneboard', 'soc', ...SHARED] },
  { id: 'car', depths: ['car', 'ecu', 'mcu', ...SHARED] },
  { id: 'journey', line: true, depths: ['crystal', 'slice', 'fab', 'bay', 'wafer', 'pkg', 'ship'] },
  { id: 'made', hidden: true, depths: ['scanner', 'wafer', 'die', ...SHARED] }
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
  'think.mcu': ['cores'], 'scale.mcu': ['flash', 'cores'], 'make.mcu': ['periph'],
  /* a chip factory */
  'make.fab': ['cleanroom', 'subfab'], 'scale.fab': ['cleanroom', 'power'], 'open.fab': ['line'],
  'make.bay': ['section', 'scanner'],
  'know.bay': ['people'], 'fail.bay': ['inspect'], 'divide.bay': ['etch', 'deposit', 'inspect', 'track'],
  'make.scanner': ['source'], 'scale.scanner': ['mirrors', 'mask'], 'open.scanner': ['source', 'mirrors', 'mask', 'stage'],
  'fail.wafer': ['defects'], 'make.wafer': ['dies'], 'divide.wafer': ['dies'],
  'fail.die': ['probes'], 'idea.die': ['cores'], 'make.die': ['pads'],
  /* the journey's own stations */
  'make.crystal': ['ingot'], 'know.crystal': ['furnace'], 'strange.crystal': ['melt'],
  'make.slice': ['saw'], 'scale.slice': ['wafers'],
  'make.pkg': ['bumps'], 'divide.pkg': ['memory', 'die'], 'fail.pkg': ['lid', 'substrate'],
  'fail.ship': ['trays'], 'open.ship': ['boxes'], 'divide.ship': ['datacentre', 'phone', 'car']
};
/* Stops whose words list real directions people are exploring (stop.<key>.tried, a list). */
export const TRIED = ['strange.chip', 'strange.gate', 'strange.switch', 'strange.atom', 'limit.chip', 'limit.gate', 'limit.atom', 'fail.building', 'fail.board', 'fail.gate',
  'idea.block', 'idea.gate', 'make.chip', 'make.switch', 'make.atom', 'know.switch', 'open.chip', 'open.block', 'divide.chip', 'divide.block', 'life.block', 'life.switch', 'scale.switch',
  'life.phone', 'divide.phone', 'idea.soc', 'life.car', 'fail.ecu', 'make.fab', 'scale.scanner', 'divide.wafer', 'make.die', 'divide.pkg'];

/* Real chips that passed their checks and still failed, from the earlier site. stop: where it shows. */
export const CASES = [
  { id: 'sdc', year: 2021, stop: 'fail.building', facts: ['sdc-rate'], url: 'https://arxiv.org/abs/2203.08989' },
  { id: 'raptor', year: 2024, stop: 'fail.board', facts: ['raptor-warranty'], url: 'https://community.intel.com/t5/Blogs/Tech-Innovation/Client/Intel-Core-13th-and-14th-Gen-Desktop-Instability-Root-Cause/post/1705129' },
  { id: 'p3', year: 2000, stop: 'fail.chip', facts: ['p3-recall'], url: 'https://www.theregister.com/2000/08/28/intel_recalls_1_13ghz_pentium' },
  { id: 'spectre', year: 2018, stop: 'fail.chip', facts: [], url: 'https://meltdownattack.com/' },
  { id: 'fdiv', year: 1994, stop: 'idea.gate', facts: ['fdiv-charge'], url: 'https://en.wikipedia.org/wiki/Pentium_FDIV_bug' },
  { id: 'cougar', year: 2011, stop: 'fail.switch', facts: ['cougar-cost'], url: 'https://www.intc.com/news-events/press-releases/detail/688/intel-identifies-chipset-design-error-implementing-solution' },
  { id: 'vote', year: 2003, stop: 'think.block', facts: ['schaerbeek-votes'], url: 'https://en.wikipedia.org/wiki/Electronic_voting_in_Belgium' }
];

/* The figures behind a stop: ids in src/data/facts.json. */
export const FIGURES = {
  'life.building': ['dc-electricity', 'brain-power'], 'limit.rack': ['turing-1936'], 'make.chip': ['euv-wavelength'],
  'fail.building': ['sdc-rate'], 'divide.block': ['energy-moving-data'], 'make.switch': ['fab-steps'],
  'idea.soc': ['riscv-rva23'], 'fail.car': ['car-life'], 'divide.car': ['chips-per-car'], 'know.car': ['car-shortage-2021'],
  'fail.ecu': ['car-ppm'], 'scale.mcu': ['legacy-auto'], 'make.mcu': ['chip-units'],
  'make.fab': ['fab-build-time'], 'scale.fab': ['fab-module-cost'], 'open.fab': ['wafer-space-run'], 'know.bay': ['workforce'], 'divide.bay': ['fab-cycle-time'],
  'make.bay': ['fab-cycle-time'], 'make.scanner': ['euv-wavelength', 'euv-source'], 'scale.scanner': ['high-na-hvm', 'high-na-price'], 'idea.die': ['design-cost-2nm']
};

/* Your chip (src/engines/chip.js): a few settings that every "Try it" changes and every depth shows.
   TRIES: the stops where a setting can be changed, inside that stop's question.
   SHOWS: what each depth shows of your chip, and which settings it depends on (words: chip.show.<depth>).
   "build" and "loop" are tries of their own: they scrub through how a switch is made and how one layer
   is printed, and change no setting. */
export const TRIES = { 'fail.chip': 'clock', 'life.phone': 'clock', 'scale.switch': 'gen', 'scale.soc': 'gen', 'scale.mcu': 'gen', 'fail.wafer': 'size', 'divide.wafer': 'size', 'make.switch': 'build', 'make.bay': 'loop' };
const ALL = ['clock', 'gen', 'size'];
export const SHOWS = {
  building: ALL, rack: ALL, board: ALL, chip: ALL, phone: ALL, phoneboard: ALL, soc: ['clock', 'gen'], mcu: ['clock', 'gen'],
  fab: ['gen'], bay: ['gen'], scanner: ['gen'], wafer: ['gen', 'size'], die: ['gen', 'size'], pkg: ['size'], ship: ALL,
  block: ['gen'], gate: ['clock', 'gen'], switch: ['gen'], atom: ['gen']
};
