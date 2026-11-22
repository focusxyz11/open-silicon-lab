/* The blueprint: the first page (#/, src/v2/home.js; geometry in src/engines/blueprint.js). One wheel holds the whole
   chip innovation ecosystem: around it a chip's life (the loop's six stages), inward its scale (a ring per level, the
   world at the rim, the atom at the centre). A story in six chapters changes what the wheel shows: the whole of it, the
   world it takes, where it is stuck, what comes next, people and AI, and your move.

   Data only; every word is bp.* in src/i18n/<lang>/blueprint.json (the first page is translated; the rest of the lab is
   in English for now). A figure in the words names its fact in src/data/facts.json (fact), shown as its source. */

export const STAGES = ['open', 'design', 'make', 'test', 'ship', 'use'];

/* the rings, outside in: words bp.ring.<id> */
export const RINGS = [
  { id: 'world', r: 420 }, { id: 'dc', r: 378 }, { id: 'machine', r: 336 }, { id: 'board', r: 296 }, { id: 'chip', r: 258 },
  { id: 'block', r: 220 }, { id: 'gate', r: 182 }, { id: 'switch', r: 144 }, { id: 'atom', r: 104 }
];

/* every place of the lab on the wheel: its stage, its ring, where in the sector (off, -1 to 1), and the view it opens.
   side: where its name goes (out: outward; cw, ccw: beside it, clockwise or not). Words bp.st.<id> (a short name). */
export const STATIONS = [
  { id: 'lab', stage: 'open', ring: 'world', off: 0, side: 'out', href: '#/place/lab' },
  { id: 'questions', stage: 'open', ring: 'dc', off: -0.45, side: 'out', href: '#/read' },
  { id: 'invent', stage: 'open', ring: 'atom', off: 0, side: 'out', href: '#/machines' },
  /* design comes down the middle of its sector, from the job to the masks, names on alternate sides */
  { id: 'need', stage: 'design', ring: 'dc', off: 0, side: 'ccw', href: '#/bench/need' },
  { id: 'arch', stage: 'design', ring: 'machine', off: 0, side: 'cw', href: '#/machines' },
  { id: 'core', stage: 'design', ring: 'board', off: 0, side: 'ccw', href: '#/build/computer/core' },
  { id: 'describe', stage: 'design', ring: 'chip', off: 0, side: 'cw', href: '#/bench/logic' },
  { id: 'check', stage: 'design', ring: 'block', off: 0, side: 'ccw', href: '#/bench/check' },
  { id: 'gates', stage: 'design', ring: 'gate', off: 0, side: 'cw', href: '#/bench/gates' },
  { id: 'layout', stage: 'design', ring: 'switch', off: 0, side: 'ccw', href: '#/bench/layout' },
  { id: 'masks', stage: 'design', ring: 'atom', off: 0, side: 'cw', href: '#/bench/masks' },
  /* the factory builds back up the middle of its sector, from a crystal to the wires */
  { id: 'crystal', stage: 'make', ring: 'atom', off: 0, side: 'cw', href: '#/line/crystal' },
  { id: 'print', stage: 'make', ring: 'switch', off: 0, side: 'ccw', href: '#/line/print' },
  { id: 'etch', stage: 'make', ring: 'gate', off: 0, side: 'cw', href: '#/line/etch' },
  { id: 'implant', stage: 'make', ring: 'block', off: 0, side: 'ccw', href: '#/line/implant' },
  { id: 'wires', stage: 'make', ring: 'chip', off: 0, side: 'cw', href: '#/line/wires' },
  { id: 'test', stage: 'test', ring: 'chip', off: -0.3, side: 'out', href: '#/line/test' },
  { id: 'wafer', stage: 'test', ring: 'block', off: 0.35, side: 'out', href: '#/dive/wafer/made' },
  { id: 'pkg', stage: 'test', ring: 'board', off: 0, side: 'out', href: '#/line/pkg' },
  { id: 'ship', stage: 'ship', ring: 'board', off: 0, side: 'out', href: '#/line/ship' },
  { id: 'phone', stage: 'ship', ring: 'machine', off: -0.4, side: 'out', href: '#/place/phones/0' },
  { id: 'car', stage: 'ship', ring: 'machine', off: 0.4, side: 'out', href: '#/place/cars/0' },
  { id: 'power', stage: 'use', ring: 'world', off: 0, side: 'out', href: '#/place/power' },
  /* the dive goes straight down the middle of Use, from a data centre to an atom */
  { id: 'datacentre', stage: 'use', ring: 'dc', off: 0, side: 'ccw', href: '#/place/datacentre/0' },
  { id: 'rack', stage: 'use', ring: 'machine', off: 0, side: 'cw', href: '#/place/datacentre/2' },
  { id: 'chip', stage: 'use', ring: 'chip', off: 0, side: 'ccw', href: '#/dive/chip' },
  { id: 'block', stage: 'use', ring: 'block', off: 0, side: 'cw', href: '#/dive/block' },
  { id: 'gate', stage: 'use', ring: 'gate', off: 0, side: 'ccw', href: '#/dive/gate' },
  { id: 'switch', stage: 'use', ring: 'switch', off: 0, side: 'cw', href: '#/dive/switch' },
  { id: 'atom', stage: 'use', ring: 'atom', off: 0, side: 'ccw', href: '#/dive/atom' }
];

/* the three lines the lab is built on: design coming down (inward), the factory building back up (outward) to the
   test, and the dive straight down through a chip in use */
export const FLOWS = {
  design: ['need', 'arch', 'core', 'describe', 'check', 'gates', 'layout', 'masks'],
  make: ['crystal', 'print', 'etch', 'implant', 'wires', 'test', 'pkg'],
  /* where the studio meets the factory: the masks are what the line prints */
  tape: ['masks', 'print'],
  dive: ['datacentre', 'rack', 'chip', 'block', 'gate', 'switch', 'atom']
};

/* the world it takes: who works at each stage, at the giant end of the ecosystem and at its open end. Words
   bp.actor.<id>.t (a short name) and .d (one sentence, with its figure); fact: its source in facts.json */
export const ACTORS = [
  { id: 'buyers', stage: 'open', side: 'giant', fact: 'chip-market-2025' },
  { id: 'community', stage: 'open', side: 'open' },
  { id: 'designers', stage: 'design', side: 'giant', fact: 'design-cost-2nm' },
  { id: 'eda', stage: 'design', side: 'giant', fact: 'agentic-eda' },
  { id: 'riscv', stage: 'design', side: 'open', fact: 'riscv-rva23' },
  { id: 'openflow', stage: 'design', side: 'open', fact: 'open-flow' },
  { id: 'foundry', stage: 'make', side: 'giant', fact: 'fab-module-cost' },
  { id: 'scanner', stage: 'make', side: 'giant', fact: 'high-na-price' },
  { id: 'pdk', stage: 'make', side: 'open', fact: 'sky130-pdk' },
  { id: 'shuttle', stage: 'make', side: 'open', fact: 'wafer-space-run' },
  { id: 'packaging', stage: 'test', side: 'giant', fact: 'cowos-share' },
  { id: 'tinytapeout', stage: 'test', side: 'open', fact: 'tt-tile' },
  { id: 'devices', stage: 'ship', side: 'giant', fact: 'chip-units' },
  { id: 'cars', stage: 'ship', side: 'giant', fact: 'chips-per-car' },
  { id: 'boards', stage: 'ship', side: 'open', fact: 'ch32v003' },
  { id: 'cloud', stage: 'use', side: 'giant', fact: 'dc-electricity' },
  { id: 'everyone', stage: 'use', side: 'open', fact: 'end-markets' }
];

/* where it is stuck: four walls, each an arc where it bites (radius r, from and to in degrees, clockwise), each with
   the core question it belongs to (q, src/data/frame.js), its fact and a place to see it. Words bp.wall.<id>.t, .d */
export const WALLS = [
  { id: 'switch', q: 'physics', r: 163, from: -120, to: 240, href: '#/dive/switch' },
  { id: 'memory', q: 'geo', r: 239, from: 182, to: 238, fact: 'energy-moving-data', href: '#/dive/block' },
  { id: 'power', q: 'eff', r: 399, from: 160, to: 260, fact: 'dc-electricity', href: '#/place/datacentre/0' },
  { id: 'cost', q: 'moore', r: 440, from: -58, to: 58, fact: 'fab-module-cost', href: '#/line/print' }
];

/* what comes next: the new architectures and ways to make, each placed where it works, with how far along it is
   (product: in products, lab: shown in a lab, guess: a guess), the wall it attacks and where to try it; side: where its
   name goes (r or l), when the side it is on would not do. Words
   bp.next.<id>.t, .d */
export const NEXT = [
  { id: 'switches', stage: 'open', ring: 'switch', off: -0.5, side: 'r', status: 'lab', attacks: 'switch', href: '#/dive/switch' },
  { id: 'living', stage: 'open', ring: 'atom', off: 0.3, status: 'product', attacks: 'power', fact: 'cortical-cl1', href: '#/machines' },
  { id: 'cim', stage: 'use', ring: 'block', off: 0.55, status: 'product', attacks: 'memory', fact: 'encharge-en100', href: '#/dive/block' },
  { id: 'stack', stage: 'use', ring: 'chip', off: -0.55, status: 'product', attacks: 'memory', fact: 'hbm4', href: '#/dive/chip' },
  { id: 'light', stage: 'ship', ring: 'dc', off: 0.4, status: 'product', attacks: 'power', fact: 'cpo-production', href: '#/place/datacentre/2' },
  { id: 'spikes', stage: 'design', ring: 'block', off: -0.6, status: 'lab', attacks: 'power', fact: 'hala-point', href: '#/machines' },
  { id: 'pbits', stage: 'design', ring: 'switch', off: 0.7, status: 'lab', attacks: 'switch', fact: 'landauer-measured', href: '#/dive/switch' },
  { id: 'liquid', stage: 'design', ring: 'chip', off: 0.6, status: 'product', attacks: 'cost', href: '#/machines' },
  { id: 'machines', stage: 'open', ring: 'machine', off: 0.45, status: 'guess', attacks: 'cost', href: '#/machines' },
  { id: 'smallfab', stage: 'make', ring: 'dc', off: 0.4, side: 'l', status: 'lab', attacks: 'cost', fact: 'minimal-fab', href: '#/machines' }
];

/* people and AI around the loop: at each stage, what AI generates and what people decide; ai: AI's share of the work
   at each step of the slider (today, more, most). The steps after today are a question, not a forecast: people's share
   never falls below the floor (src/engines/blueprint.js). Words bp.role.<stage>.ai, .people; fact: what is real today */
export const ROLES = [
  { stage: 'open', ai: [0.15, 0.35, 0.5] },
  { stage: 'design', ai: [0.35, 0.6, 0.78], fact: 'agentic-eda' },
  { stage: 'make', ai: [0.3, 0.55, 0.72], fact: 'ai-in-fabs' },
  { stage: 'test', ai: [0.4, 0.62, 0.78], fact: 'dv-agent' },
  { stage: 'ship', ai: [0.3, 0.5, 0.65] },
  { stage: 'use', ai: [0.45, 0.65, 0.8], fact: 'workforce' }
];
/* the loop at the heart of it: what the lab itself is built on (docs/MACHINES.md, "AI-native") */
export const TRIAD = ['generate', 'check', 'decide'];

/* the story, in order: each chapter puts the wheel in its mode. Words bp.ch.<id>.k (a kicker), .h (its headline), .p */
export const CHAPTERS = ['whole', 'world', 'walls', 'next', 'people', 'you'];

/* where the open work is, read from the community's ledger (frontier in src/engines/ledger.js): each kind of open
   thing has a place on the wheel */
export const OPEN_AT = {
  break: { stage: 'test', ring: 'chip', off: 0.35, href: '#/build' },
  build: { stage: 'design', ring: 'block', off: 0.75, href: '#/build/computer' },
  puzzle: { stage: 'use', ring: 'block', off: -0.5, href: '#/place/datacentre/0' },
  ask: { stage: 'open', ring: 'dc', off: 0.45, href: '#/read' },
  report: { stage: 'open', ring: 'world', off: -0.55, href: '#/log' }
};

/* the doors at the end: words bp.door.<id>.t, .d */
export const DOORS = [
  { id: 'invent', href: '#/machines', icon: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3' },
  { id: 'build', href: '#/build/computer', icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { id: 'break', href: '#/build', icon: 'M5 19L19 5M8 5h11v11' },
  { id: 'ask', href: '#/read', icon: 'M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 19v.01' }
];
/* the rest of the lab, from the end of the page */
export const WAYS = [['#/stations', 'stations'], ['#/island', 'island'], ['#/challenges', 'challenges'], ['#/read', 'read'], ['#/log', 'log']];
