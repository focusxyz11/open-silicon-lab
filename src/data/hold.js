/* Hold, the first page (#/, src/v2/hold.js): fifty years of computing under one finger. One square of silicon, split
   again at every doubling while you hold; three moments on the way where the hold slows and something waits to be tried;
   the wall where holding stops working; then the four walls, the arrangement, your machine and the island. Scrolling is
   time, too: the fifty years can be scrolled, held or dragged on the chart of Moore's law beside the count.
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
  /* four transistors: wired up, a gate. What hides behind 0 and 1 */
  { id: 'gate', at: 2, span: 1.3, q: 'nat', facts: [], lab: '#/dive/gate' },
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

/* ---- Moore's law, live: the chart beside the count (the curve is part of the hold now). Before 1971 the count
   doubled about every year, as Moore wrote in 1965 (moore-1965); from 1971 about every two years (transistor-trend),
   so one doubling is a year before 1971 and two after, and the year of any count follows ---- */
export const yearAt = d => (d < D71 ? 1971 - (D71 - d) : yearOf(d));
export const dAt = y => (y < 1971 ? D71 - (1971 - y) : D71 + (y - 1971) / 2);
/* Moore's line of 1965: about 64 components in 1965, doubling every year to 65,000 in 1975 (moore-1965) */
export const MOORE65 = [[1959, 1], [1965, 64], [1975, 65000]];
/* real chips, named (chm-x86, core2-410m, northpole, rubin-gpu, transistor-trend). [year, transistors, word key, fact] */
export const CHIPS = [[1971, 2300, '4004', 'transistor-trend'], [1982, 134e3, '286', 'chm-x86'], [1985, 275e3, '386', 'chm-x86'],
  [1989, 1.2e6, '486', 'chm-x86'], [1993, 3.1e6, 'pentium', 'chm-x86'], [2000, 42e6, 'p4', 'chm-x86'], [2007, 410e6, 'core2', 'core2-410m'],
  [2023, 22e9, 'northpole', 'northpole'], [2026, 336e9, 'rubin', 'rubin-gpu']];
export const rule = (y, every = 2) => 2300 * Math.pow(2, (y - 1971) / every);
/* line width by year, by the names of the generations (node-years); from the late 1990s a name no longer measures
   anything on the chip (node-names) */
export const NODES = [[1968, '20 µm'], [1971, '10 µm'], [1974, '6 µm'], [1977, '3 µm'], [1981, '1.5 µm'], [1984, '1 µm'], [1987, '800 nm'],
  [1990, '600 nm'], [1993, '350 nm'], [1996, '250 nm'], [1999, '180 nm'], [2001, '130 nm'], [2003, '90 nm'], [2005, '65 nm'], [2007, '45 nm'],
  [2009, '32 nm'], [2010, '28 nm'], [2012, '22 nm'], [2014, '14 nm'], [2016, '10 nm'], [2018, '7 nm'], [2020, '5 nm'], [2022, '3 nm'], [2025, '2 nm']];
export const NAMED_ONLY = 1997;
export const nodeAt = y => { let n = null; for (const r of NODES) if (r[0] <= y) n = r[1]; return n; };
/* fifty years of microprocessors, one dot per chip (transistor-trend: Karl Rupp, CC BY 4.0, up to 2021): transistors,
   the clock (ticks a second), logical cores and power (watts). Each entry: tenths of a year after 1970 : value */
const TREND = {
  tr: '19:2.3e3 23:3.6e3 43:6.1e3 96:2.9e4 123:1.4e5 159:2.7e5 163:1.1e5 187:1.2e5 195:1.2e6 206:1.2e6 224:1.2e6 227:3.1e6 227:1.1e6 230:1.7e6 234:3.1e6 234:9.2e5 247:1.9e6 247:2.8e6 254:9.6e6 257:3.1e6 262:5.5e6 263:6.8e6 263:3.7e6 264:4.3e6 268:9.6e6 274:5.5e6 275:3.6e6 275:8.9e6 276:7.6e6 289:1.5e7 291:9.4e6 292:7e6 295:9.4e6 295:2.2e7 302:2.2e7 307:2.8e7 307:3.7e7 311:2.9e7 312:4.3e7 317:2.5e7 318:3.7e7 324:5.6e7 328:3.8e7 329:2.2e8 334:1.5e8 335:5.4e7 337:1.1e8 348:1.3e8 348:1.1e8 348:2.7e8 357:2.3e8 358:1.1e8 360:3.1e8 361:1.2e8 369:3.8e8 369:1.6e8 369:2.5e8 370:3e8 370:5.8e8 371:1.5e8 376:5.8e8 377:2.3e8 378:8.1e8 378:1.2e8 380:5.1e8 382:4.5e8 385:4.1e8 392:4.6e8 393:7.8e8 397:2.3e9 397:1.9e9 402:4.1e8 404:1.3e9 412:1.2e9 413:2.6e9 419:1.2e9 424:2.4e9 424:2.3e9 427:2.1e9 429:1.2e9 434:5e9 438:4.3e9 442:4.3e9 445:4.2e9 448:2.6e9 448:3.8e9 448:5.7e9 463:7.2e9 467:8e9 475:1.9e10 484:8e9 485:2.1e10 493:8e9 498:4e10 501:3e10 509:1.6e10 518:5.7e10 519:5.8e10 519:5.5e10',
  hz: '19:7e5 23:5.1e5 43:2e6 96:5e6 123:6.1e6 159:1.6e7 163:1.6e7 187:4e7 195:2.5e7 206:3.3e7 224:6.6e7 227:6e7 227:1e8 230:2e8 234:6.7e7 234:4e7 247:1.5e8 247:3e8 254:3e8 257:9.1e7 261:2e8 263:2e8 264:9.1e7 268:5.1e8 274:2.5e8 275:5.4e8 275:2.3e8 276:3e8 288:5e8 291:3e8 292:4e8 295:4.6e8 295:5.1e8 302:7.4e8 307:1e9 311:9e8 312:2e9 317:8.1e8 318:1.4e9 324:2.2e9 328:1.8e9 329:1e9 334:1.2e9 335:2.2e9 336:1.8e9 348:2.6e9 348:1.9e9 349:3.7e9 357:3.2e9 359:2.8e9 360:1.2e9 360:2.2e9 369:3.7e9 369:2.6e9 370:2.7e9 371:2.3e9 376:2.9e9 377:4.7e9 377:4.1e9 378:2e9 380:1.4e9 382:2e9 382:2.3e9 385:3e9 392:2.5e9 393:3.3e9 394:2.6e9 397:2.6e9 397:3.3e9 402:2.3e9 412:3.5e9 413:2.4e9 419:3e9 424:3.1e9 424:2.9e9 427:3.7e9 429:2.5e9 434:1.2e9 438:2.7e9 442:2.8e9 445:3.7e9 448:3.2e9 448:2.6e9 448:2.3e9 463:2.2e9 465:1.5e9 467:4e9 475:2.2e9 476:2.1e9 476:2.5e9 484:3.4e9 485:1.2e9 493:2.7e9 498:2.3e9 501:2.9e9 502:2.7e9 509:3.2e9 513:2.3e9 518:3.2e9 519:1e9 519:2.6e9',
  cores: '19:1e0 23:1e0 43:1e0 96:1e0 123:1e0 159:1e0 163:1e0 187:1e0 195:1e0 206:1e0 224:1e0 227:1e0 230:1e0 234:1e0 247:1e0 254:1e0 258:1e0 261:1e0 265:1e0 269:1e0 273:1e0 275:1e0 277:1e0 288:1e0 292:1e0 295:1e0 302:1e0 307:1e0 311:1e0 316:1e0 318:1e0 324:1e0 327:1e0 329:1e0 333:1e0 335:1e0 337:1e0 348:2e0 349:1e0 357:2e0 358:1e0 360:8e0 361:2e0 368:2e0 371:2e0 376:4e0 377:9e0 377:2e0 379:2e0 380:8e0 382:4e0 385:2e0 392:3e0 392:4e0 395:4e0 396:3e0 397:8e0 397:6e0 402:1.6e1 412:1.2e1 413:2e1 419:8e0 424:1.6e1 424:1.6e1 427:3.2e1 429:1.6e1 434:2.4e2 438:2.4e1 442:3e1 445:6.4e1 448:1.6e1 448:2.4e1 448:3.6e1 463:4.4e1 465:2.7e2 467:9.6e1 475:6.4e1 476:4.4e1 476:5.6e1 484:8.8e1 485:8e1 493:5.6e1 498:1.3e2 501:1.3e2 502:5.6e1 509:8e0 513:8e1 518:1e1 519:2.1e2 519:6.4e1',
  w: '19:4.5e-1 23:4.2e-1 43:9.2e-1 96:1.7e0 123:3e0 159:1.5e0 163:3e0 187:4e0 195:2.8e0 206:3.5e0 224:5.9e0 227:1.4e1 230:3.5e1 234:3e0 234:1.3e1 247:2.8e1 247:3e0 254:5e1 257:1.6e1 262:3.3e1 263:3.1e1 263:1e1 264:1.1e1 269:4.4e1 274:2.5e1 275:3.6e1 275:1.7e1 276:3.2e1 289:9.1e1 292:3e1 292:1.4e1 295:1.7e1 295:2.1e1 302:3.6e1 307:4.9e1 307:2e1 311:7.1e1 312:7.3e1 317:9.8e1 318:5.7e1 324:4.9e1 328:6.2e1 329:9.8e1 334:1.6e2 335:7.5e1 337:8.8e1 348:8.8e1 348:1.2e2 349:1e2 357:1.3e2 358:8.6e1 360:7.3e1 361:2.5e1 369:1.3e2 369:6.6e1 369:1.3e2 370:7.5e1 371:3.2e1 376:1.3e2 378:1e2 379:3.2e1 380:8.6e1 382:7.7e1 382:9.6e1 385:6.6e1 392:9.6e1 393:1.3e2 395:1.3e2 396:9.6e1 397:1.3e2 404:1.7e2 412:1.3e2 413:1.3e2 419:9.5e1 424:1.4e2 424:1.3e2 427:2e2 429:1.2e2 434:3e2 438:1.3e2 442:1.6e2 445:2e2 448:1.4e2 448:1.4e2 448:1.4e2 463:1.5e2 465:2.5e2 475:1.8e2 476:1.4e2 476:2.1e2 484:1.9e2 485:2.5e2 493:2.1e2 498:2.3e2 501:2.8e2 502:2.1e2 509:2.8e1 513:2.9e2 518:3e1 519:5e2 519:1e2'
};
const parsed = {};
export const trend = k => parsed[k] || (parsed[k] = TREND[k].split(' ').map(e => { const [y, v] = e.split(':'); return [1970 + y / 10, +v]; }));
/* the most any chip of the series had up to a year (the clock's best so far, the most cores so far) */
export const upTo = (k, y) => { let m = 0; for (const [yy, v] of trend(k)) if (yy <= y + .05 && v > m) m = v; return m; };
/* what can be added to the chart beside the transistors */
export const SERIES = ['hz', 'cores', 'w'];
/* the clock stopped climbing at about 3.8 GHz in 2004, held back by heat (clock-stall): a tap between these years finds it */
export const KNEE = [2002.5, 2007.5];
/* how the machine grew, era by era: a faster clock on one core; then more cores (dual-core-2005); then chips made for one
   kind of work, like the graphics chips deep learning was trained on (alexnet-gpu); then a chip made of smaller chips
   (epyc-chiplets). [id, the year it begins, facts, where it is played] */
export const ERAS = [['clock', 1971, ['transistor-trend', 'clock-stall'], '#/dive/block'], ['cores', 2005, ['dual-core-2005'], '#/dive/chip'],
  ['special', 2012, ['alexnet-gpu'], '#/place/datacentre/1'], ['chiplets', 2019, ['epyc-chiplets'], '#/dive/chip']];

/* ---- the next fifty years: energy per bit, from a bit fetched off another chip down to the physical floor for
   handling one bit. Fifty years of shrinking gave BEHIND times more transistors; the floor leaves AHEAD times less
   energy per bit. Each rung: [id, joules per bit, facts, where it is tried] (energy-moving-data: 640 pJ per 16 bits
   from DRAM, 8–11 pJ per 16 bits from on-chip SRAM, 0.18 pJ for a 16-bit sum; landauer-measured: kT ln 2) ---- */
export const BEHIND = 336e9 / 2300;
export const RUNGS = [['far', 640e-12 / 16, ['energy-moving-data'], '#/dive/block'], ['near', 9.5e-12 / 16, ['energy-moving-data', 'hbm4'], '#/dive/chip'],
  ['inside', 0.18e-12 / 16, ['energy-moving-data', 'encharge-en100'], '#/dive/block'], ['new', null, ['northpole', 'hala-point'], '#/machines'],
  ['floor', 1.380649e-23 * 300 * Math.LN2, ['landauer-measured'], '#/dive/switch']];
/* between the sum and the floor no one has a number yet: the bets aim there (new switches, spikes, light), drawn as a
   band, not a point, half way down on the log scale */
RUNGS[3][1] = Math.sqrt(RUNGS[2][1] * RUNGS[4][1]);
export const ZONE_RUNG = 'new';
export const AHEAD = RUNGS[0][1] / RUNGS[RUNGS.length - 1][1];

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

/* ---- the page's chapters, in order: the rail at the left. [id, the element it leads to] ---- */
export const PARTS = [['years', 'hd-years'], ['walls', 'hd-s-switch'], ['next', 'hd-s-next'], ['arch', 'hd-s-arch'], ['machine', 'hd-s-machine'], ['island', 'hd-s-island']];
/* ---- the challenges on this page, in the order they are met: each counted on the rail once it is done ---- */
export const CHALS = ['gate', 'fit', 'job', 'knee', 'bug', 'light', 'guess', 'walls', 'floor', 'eras', 'arr', 'keep'];

/* every fact the page names (tests/hold.test.mjs checks each is in src/data/facts.json) */
export const FACT_IDS = [...new Set(['transistor-trend', 'zeloof-garage', 'rubin-gpu', 'node-n2', 'tsmc-n2', 'wafer-space-run', 'fpga-asic-gap', 'brain-power',
  'moore-1965', 'node-years', 'node-names', 'clock-stall', ...CHIPS.map(c => c[3]), ...ERAS.flatMap(e => e[2]), ...RUNGS.flatMap(r => r[2]),
  ...COSTSRC, ...MOMENTS.flatMap(m => m.facts), ...WALLS.flatMap(w => [...w.facts, ...w.ways.flatMap(x => x[3])]), ...ARR.flatMap(a => a[2])])];
