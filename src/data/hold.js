/* Hold, the first page (#/, src/v2/hold.js): fifty years of computing under one finger. One square of silicon, split
   again at every doubling while you hold; three moments on the way where the hold slows and something waits to be tried;
   the wall where holding stops working; then the four walls, the arrangement, your machine and the island.
   Every number here comes from src/data/facts.json (ids below; tests/hold.test.mjs checks they exist), and every word
   from src/i18n/<lang>/hold.json (hd.*). Designed with Claude Fable 5.2 (the Hold prototype, 22 November 2026) and
   brought into the lab with Claude Opus 5.5. */

/* ---- the count: doublings from one transistor ---- */
export const D71 = Math.log2(2300);              /* transistor-trend: 2,300 in 1971, doubling about every two years */
export const DGAR = Math.log2(1200);             /* zeloof-garage: 1,200 transistors, one person, 2021 */
export const DWALL = Math.log2(336e9);           /* rubin-gpu: 336 billion, 2026 */
export const D95 = D71 + (1995 - 1971) / 2;      /* fdiv-charge: January 1995 */
export const D2011 = D71 + (2011 - 1971) / 2;    /* design-cost-older: the series runs from 2011 */
/* the price of designing one leading chip, $ million, node by node (design-cost-*) */
export const COST = [['28 nm', 51], ['16 nm', 106], ['7 nm', 257], ['5 nm', 479], ['3 nm', 585], ['2 nm', 725]];
export const COSTSRC = ['design-cost-older', 'design-cost-older', 'design-cost-recent', 'design-cost-recent', 'design-cost-recent', 'design-cost-2nm'];
/* six paid generations from 2011 to the wall */
export const GEN = i => D2011 + (DWALL - D2011) * i / COST.length;
export const yearOf = d => 1971 + 2 * (d - D71);
/* the transistor's three forms, as the years made them */
export const formAt = v => v < GEN(1) ? 'planar' : v < GEN(5) ? 'fin' : 'gaa';

/* ---- three moments on the way. The hold slows as it reaches one and never stops; let go and it waits, with a thing
   to try that shows the reason, the core question it belongs to (home.q.*, met alone, beside its moment) and where in
   the lab it is played for real. `span`: how many doublings the moment stays after it is reached ---- */
export const MOMENTS = [
  { id: 'job', at: D71, span: 2.2, q: 'line', facts: ['asic-vs-cpu'], lab: '#/bench/need' },
  { id: 'bug', at: D95, span: 2.4, q: 'trust', facts: ['fdiv-rate', 'fdiv-charge'], lab: '#/line/test' },
  { id: 'light', at: GEN(3), span: 1.05, q: 'dig', facts: ['euv-wavelength', 'high-na-price'], lab: '#/line/print' }
];
/* 1971: from one job to any program, the energy for the same work (asic-vs-cpu: about 500× for video) */
export const JOB_GAP = 500;
/* 1995: about one random division in nine billion went wrong (fdiv-rate); the worst case anyone found */
export const FDIV = { rate: 9e9, a: 4195835, b: 3145727, wrong: 4195579 / 3145727 };
/* the light: three ways to print lines finer than 193 nm light (euv-wavelength, high-na-price) */
export const LIGHTS = ['one', 'passes', 'euv'];

/* ---- the four walls, each beside its core question ---- */
export const WALLS = [
  { id: 'switch', q: 'physics', facts: [], meet: '#/dive/switch', lab: '#/dive/switch',
    ways: [['switches', 'lab', '#/dive/switch', []], ['pbits', 'lab', '#/dive/switch', ['landauer-measured']]] },
  { id: 'memory', q: 'geo', facts: ['energy-moving-data'], meet: '#/dive/block', lab: '#/dive/block', ways: [] },
  { id: 'power', q: 'eff', facts: ['dc-electricity'], meet: '#/place/datacentre/0', lab: '#/place/power',
    ways: [['living', 'product', '#/machines', ['cortical-cl1', 'brain-power']]] },
  { id: 'cost', q: 'moore', facts: ['design-cost-older', 'design-cost-2nm', 'fab-module-cost'], meet: '#/line/print', lab: '#/dive/wafer/made',
    ways: [['smallfab', 'lab', '#/machines', ['minimal-fab']], ['liquid', 'product', '#/machines', []]] }
];

/* ---- how a computer is arranged: the levels from the transistor up, and the arrangements people are trying ---- */
export const ARR = [['classic', null, ['energy-moving-data'], '#/dive/block'], ['stack', 'product', ['hbm4'], '#/dive/chip'],
  ['cim', 'product', ['encharge-en100'], '#/dive/block'], ['light', 'product', ['cpo-production'], '#/place/datacentre/2'],
  ['spikes', 'lab', ['hala-point'], '#/machines']];
/* the arrangement's puzzle: which one makes a number's trip shortest (in the drawings' units, the trip a number makes) */
export const TRIP = { classic: 3, stack: 1, cim: 0, light: 2, spikes: 0 };

/* ---- the next machine: needs and their parts (src/data/blocks.js: share of the work per answer). Software and a
   liquid fabric cost what src/engines/machine.js says against a circuit made for the job (asic-vs-cpu, fpga-asic-gap) ---- */
export const NEEDS = [
  { id: 'hearing', parts: [['mic', 'sensor', 2], ['filter', 'learner', 40], ['mem', 'memory', 4], ['ctl', 'core', 3]], change: ['filter'], wires: [[0, 1], [1, 2], [2, 3]] },
  { id: 'wildfire', parts: [['smoke', 'sensor', 2], ['detect', 'learner', 30], ['check', 'parity', 1], ['clock', 'counter', 1], ['ctl', 'core', 4]], change: [], wires: [[0, 1], [1, 2], [1, 4], [3, 4]] },
  { id: 'rover', parts: [['cam', 'sensor', 2], ['nav', 'learner', 60], ['vote', 'voter', 2], ['clock', 'counter', 1], ['ctl', 'core', 10]], change: ['nav'], wires: [[0, 1], [1, 4], [2, 3], [3, 4]] }
];
export const STOCK = ['sensor', 'memory', 'core'], FORMS = ['software', 'circuit', 'liquid'], FCOST = { software: 500, circuit: 1, liquid: 14 };

/* ---- the island: a chip's life round the loop, and where each is played for real ---- */
export const LOOP = [['open', 'lab', 500, 150], ['design', 'studio', 850, 310], ['make', 'fab', 850, 690], ['test', 'test', 500, 850], ['ship', 'port', 150, 690], ['use', 'datacentre', 150, 310]];

/* ---- the page's five parts, in order: the tabs under the bar ---- */
export const PARTS = [['hero', null], ['walls', 'hd-s-switch'], ['arch', 'hd-s-arch'], ['machine', 'hd-s-machine'], ['island', 'hd-s-island']];

/* every fact the page names (tests/hold.test.mjs checks each is in src/data/facts.json) */
export const FACT_IDS = [...new Set(['transistor-trend', 'zeloof-garage', 'rubin-gpu', 'node-n2', 'tsmc-n2', 'wafer-space-run', 'fpga-asic-gap',
  ...COSTSRC, ...MOMENTS.flatMap(m => m.facts), ...WALLS.flatMap(w => [...w.facts, ...w.ways.flatMap(x => x[3])]), ...ARR.flatMap(a => a[2])])];
