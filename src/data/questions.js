/* The questions from the field (docs/SYSTEM.md, "Questions from the field"; the framework: content/STRUCTURE.md).
   The questions that opened chip fields were asked by people who were stuck, at a turning point. Each comes in one of
   three shapes, by how many of the seven primitives meet in it (matter, energy, information, time, chance, people and
   machines, cost):
     limit  one primitive pushed to its edge: how small, how little heat, how sure, how long;
     leak   two meet, and what one level hides comes back through the other;
     bet    three pull at once, so people choose without proof.
   Every question has one home, a level (a depth of the weave) or a place of the island, where it is asked. A leak also
   sits on a seam, the line between two cells of the grid (src/engines/way.js): between two levels, crossed going in or
   out, or between two stages of a chip's life, crossed going along. Crossing it raises the question.
   The words are field.<id>.q (the question), .who (who asked it, and when), .opened, .open (what is still open), in
   src/i18n/en.json; src is where to read it in the asker's own words. A question joins when someone real was stuck on
   it, it opened something, and part of it is still open. */

export const PRIMS = ['matter', 'energy', 'info', 'time', 'chance', 'agents', 'value'];
export const SHAPES = ['limit', 'leak', 'bet'];
export const SIZE = { limit: 1, leak: 2, bet: 3 };

/* id, shape, the primitives that meet, home ({ level } or { place }), seam (leaks: { a, b } levels, or { along:
   [stage, stage] }, and on: 'view' or 'island' when the same pair of stages holds two leaks), source */
export const FIELD = [
  /* limits */
  { id: 'pinhead', shape: 'limit', prims: ['matter'], home: { level: 'atom' }, src: 'https://www.zyvex.com/nanotech/feynman.html' },
  { id: 'heat', shape: 'limit', prims: ['energy'], home: { level: 'switch' }, src: 'https://doi.org/10.1147/rd.53.0183' },
  { id: 'nature', shape: 'limit', prims: ['info'], home: { place: 'idea' }, src: 'https://doi.org/10.1007/BF02650179' },
  { id: 'brain', shape: 'limit', prims: ['energy'], home: { level: 'gate' }, src: 'https://doi.org/10.1109/5.58356' },
  { id: 'dark', shape: 'limit', prims: ['energy'], home: { level: 'chip' }, src: 'https://doi.org/10.1145/2000064.2000108' },
  { id: 'wires', shape: 'limit', prims: ['matter'], home: { level: 'wires' }, src: 'https://en.wikipedia.org/wiki/Tyranny_of_numbers' },
  { id: 'wear', shape: 'limit', prims: ['time'], home: { level: 'block' }, src: 'https://en.wikipedia.org/wiki/Black%27s_equation' },
  { id: 'spare', shape: 'limit', prims: ['chance'], home: { level: 'gate' }, src: 'https://static.ias.edu/pitp/archive/2012files/Probabilistic_Logics.pdf' },
  { id: 'palm', shape: 'limit', prims: ['energy'], home: { level: 'phone' }, src: 'https://eprints.soton.ac.uk/439709/' },
  { id: 'life', shape: 'limit', prims: ['chance'], home: { level: 'ecu' }, src: 'https://www.ti.com/lit/SLOA294' },
  /* leaks */
  { id: 'fetch', shape: 'leak', prims: ['energy', 'info'], home: { level: 'block' }, seam: { a: 'block', b: 'gate' }, src: 'https://doi.org/10.1109/ISSCC.2014.6757323' },
  { id: 'wait', shape: 'leak', prims: ['info', 'time'], home: { level: 'board' }, seam: { a: 'board', b: 'chip' }, src: 'https://libraopen.lib.virginia.edu/public_view/k35694375' },
  { id: 'secret', shape: 'leak', prims: ['info', 'time'], home: { level: 'chip' }, seam: { a: 'chip', b: 'block' }, src: 'https://arxiv.org/abs/1801.01203' },
  { id: 'lid', shape: 'leak', prims: ['matter', 'chance'], home: { level: 'pkg' }, src: 'https://doi.org/10.1109/T-ED.1979.19370' },
  { id: 'perfect', shape: 'leak', prims: ['matter', 'info'], home: { level: 'masks' }, seam: { along: ['design', 'make'], on: 'view' }, src: 'https://ai.eecs.umich.edu/people/conway/Memoirs/VLSI/Files/The-book-that-changed-everything.htm' },
  { id: 'copy', shape: 'leak', prims: ['matter', 'agents'], home: { place: 'fab' }, seam: { along: ['design', 'make'], on: 'island' }, src: 'https://en.wikipedia.org/wiki/Copy_Exactly!' },
  { id: 'pins', shape: 'leak', prims: ['info', 'matter'], home: { level: 'test' }, seam: { along: ['make', 'test'] }, src: 'https://doi.org/10.1109/ISSCC.1978.1155765' },
  { id: 'later', shape: 'leak', prims: ['chance', 'time'], home: { level: 'chip' }, seam: { along: ['test', 'use'] }, src: 'https://research.google/pubs/cores-that-dont-count/' },
  { id: 'trust', shape: 'leak', prims: ['agents', 'info'], home: { place: 'port' }, seam: { along: ['ship', 'use'] }, src: 'https://doi.org/10.1145/358198.358210' },
  { id: 'package', shape: 'leak', prims: ['matter', 'value'], home: { level: 'pkg' }, seam: { along: ['test', 'ship'] }, src: 'https://www.tomshardware.com/news/tsmc-shortage-of-nvidias-ai-gpus-to-persist-for-15-years' },
  /* the places that make the makers: the quarry, the tools, the materials, the power */
  { id: 'purity', shape: 'limit', prims: ['matter'], home: { place: 'quarry' }, src: 'https://halbleiter.org/en/waferfabrication/rawsilicon/' },
  { id: 'mask', shape: 'leak', prims: ['info', 'matter'], home: { place: 'tools' }, src: 'https://doi.org/10.1515/aot-2015-0023' },
  { id: 'oxide', shape: 'leak', prims: ['matter', 'energy'], home: { place: 'materials' }, src: 'https://www.intel.com/pressroom/kits/advancedtech/doodle/ref_HiK-MG/high-k.htm' },
  /* bets */
  { id: 'oxen', shape: 'bet', prims: ['info', 'time', 'value'], home: { level: 'chip' }, src: 'https://todayinsci.com/C/Cray_Seymour/CraySeymour-Quotations.htm' },
  { id: 'fabless', shape: 'bet', prims: ['matter', 'agents', 'value'], home: { place: 'fab' }, src: 'https://computerhistory.org/profile/morris-chang/' },
  { id: 'printer', shape: 'bet', prims: ['matter', 'chance', 'value'], home: { level: 'scanner' }, src: 'https://worksinprogress.co/issue/the-worlds-most-complex-machine/' },
  { id: 'anyone', shape: 'bet', prims: ['info', 'agents', 'matter'], home: { place: 'studio' }, src: 'https://ai.eecs.umich.edu/people/conway/Memoirs/VLSI/Files/The-book-that-changed-everything.htm' },
  { id: 'cheaper', shape: 'bet', prims: ['matter', 'chance', 'value'], home: { level: 'wafer' }, src: 'https://www.computerhistory.org/atchm/moores-law50-the-most-important-graph-in-human-history/' },
  { id: 'general', shape: 'bet', prims: ['info', 'energy', 'value'], home: { level: 'need' }, src: 'https://doi.org/10.1145/3282307' },
  { id: 'lottery', shape: 'bet', prims: ['info', 'agents', 'chance'], home: { place: 'lab' }, src: 'https://arxiv.org/abs/2009.06489' },
  { id: 'scale', shape: 'bet', prims: ['info', 'agents', 'energy'], home: { level: 'building' }, src: 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html' },
  { id: 'top', shape: 'bet', prims: ['info', 'agents', 'time'], home: { place: 'lab' }, src: 'https://doi.org/10.1126/science.aam9744' },
  { id: 'prove', shape: 'bet', prims: ['info', 'chance', 'value'], home: { level: 'check' }, src: 'https://en.wikipedia.org/wiki/Pentium_FDIV_bug' },
  { id: 'onebad', shape: 'bet', prims: ['chance', 'value', 'matter'], home: { level: 'die' }, src: 'https://www.synopsys.com/articles/test-die-to-die-phy.html' },
  { id: 'quartz', shape: 'bet', prims: ['matter', 'chance', 'value'], home: { place: 'quarry' }, src: 'https://www.trendforce.com/news/2024/10/02/news-quartz-mines-hit-by-hurricane-helene-could-disrupt-the-semiconductor-supply-chain/' },
  { id: 'neon', shape: 'bet', prims: ['matter', 'chance', 'agents'], home: { place: 'materials' }, src: 'https://www.theregister.com/2022/03/11/ukraine_neon_supplies/' },
  { id: 'station', shape: 'bet', prims: ['energy', 'time', 'value'], home: { place: 'power' }, src: 'https://www.iea.org/reports/energy-and-ai/executive-summary' },
  { id: 'jevons', shape: 'bet', prims: ['energy', 'value', 'agents'], home: { place: 'power' }, src: 'https://www.sigarch.org/the-jevons-paradox-why-efficiency-alone-wont-solve-our-data-center-carbon-challenge/' },
  { id: 'dollar', shape: 'bet', prims: ['time', 'chance', 'value'], home: { level: 'car' }, src: 'https://sgp.fas.org/crs/misc/IF12000.pdf' }
];

const BY = Object.fromEntries(FIELD.map(q => [q.id, q]));
export const fieldOf = id => BY[id] || null;
/* the questions asked at a level, and at a place of the island */
export const fieldAtLevel = level => FIELD.filter(q => q.home.level === level);
export const fieldAtPlace = place => FIELD.filter(q => q.home.place === place);
/* the leaks on the seams */
export const SEAMS = FIELD.filter(q => q.seam);
