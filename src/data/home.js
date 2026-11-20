/* The map: the first page (#/). One loop round a chip's life, drawn like a metro map in the lab's blueprint style:
   design comes down the left (the job to the masks), the masks become matter at tape-out, the factory builds back up
   the right (crystal to the port), the chip is used, and what is learned opens the next idea at the Lab. The middle
   line is scale, a data-centre hall down to an atom. The island (#/island) is one way in from here, not the front door.

   Data only. Every station is an address of the chip world (its view) and takes its words from the place that
   already owns them (depth.*, map.*, build.need.*); only what the map adds has words of its own (home.*). What can be
   played at a station is never written here: it is every challenge whose home view is the station's address
   (doHome in src/engines/way.js), read when the map is drawn, so a new challenge appears on the map by itself.
   The three faces of one level (designed, made, used) are the atlas's TWINS, not repeated here.

   - STATIONS: id, line (design, make, scale, loop), x and y on a 1000 x 650 map, kind (stop, hub, lvl), side
     (where its name sits: l, r, rc, b), href (its view), name and see (word keys), also (more views whose challenges
     belong here), places (island places whose challenges with no view of their own belong here), pages (other
     things to try there: [href, word key]) and links (stations it is joined to across the map).
   - THREADS: the thirteen core questions (words home.q.<id>), each starting at one station (home) and running through
     a few others (path). Only one is shown at a time, never a list of them (CLAUDE.md).
   - WAYS: five ways in, each lighting the lines and stations it is about. */

export const MAP = { w: 1000, h: 650 };

const D = 200, M = 800, S = 500;
const st = (id, line, x, y, kind, side, href, name, see, more) => Object.assign({ id, line, x, y, kind, side, href, name, see, also: [], places: [], pages: [], links: [] }, more || {});

export const STATIONS = [
  /* the Lab, where the loop starts and comes back */
  st('lab', 'loop', D, 40, 'hub', 'l', '#/place/lab', 'map.lab.t', 'map.lab.d', { places: ['lab', 'village'], pages: [['#/machines', 'machines.ui.kicker'], ['#/build', 'build.need.computer.t']], links: ['use', 'riscv', 'crystal'] }),
  /* design, going down */
  st('need', 'design', D, 95, 'stop', 'l', '#/bench/need', 'depth.need.name', 'depth.need.see', { sub: true, links: ['use', 'arch'] }),
  st('arch', 'design', D, 150, 'stop', 'l', '#/machines', 'home.st.arch', 'home.st.arch.see', { sub: true, pages: [['#/machines', 'machines.ui.kicker']], links: ['need', 'riscv', 'block'] }),
  st('riscv', 'design', D, 205, 'hub', 'l', '#/build/computer/core', 'build.need.core.t', 'build.need.core.d', { sub: true, pages: [['#/build/computer/alu', 'build.need.alu.t'], ['#/build/computer/regs', 'build.need.regs.t']], links: ['logic', 'lab', 'chip'] }),
  st('logic', 'design', D, 260, 'stop', 'l', '#/bench/logic', 'depth.logic.name', 'depth.logic.see', { sub: true, links: ['check', 'riscv'] }),
  st('check', 'design', D, 315, 'stop', 'l', '#/bench/check', 'depth.check.name', 'depth.check.see', { sub: true, links: ['test', 'logic'] }),
  st('gates', 'design', D, 370, 'stop', 'l', '#/bench/gates', 'depth.gates.name', 'depth.gates.see', { sub: true, links: ['logic'] }),
  st('layout', 'design', D, 425, 'stop', 'l', '#/bench/layout', 'depth.layout.name', 'depth.layout.see', { sub: true, links: ['masks'] }),
  st('masks', 'design', D, 480, 'stop', 'l', '#/bench/masks', 'depth.masks.name', 'depth.masks.see', { sub: true, links: ['print', 'tape'] }),
  /* where the design leaves the screen */
  st('tape', 'design', S, 590, 'hub', 'b', '#/place/fab', 'home.st.tape', 'home.st.tape.see', { sub: true, links: ['masks', 'crystal'] }),
  /* make, going up */
  st('crystal', 'make', M, 526, 'stop', 'r', '#/line/crystal', 'depth.crystal.name', 'depth.crystal.see', { sub: true, also: ['#/line/slice'], places: ['quarry'], links: ['lab', 'tape'] }),
  st('deposit', 'make', M, 472, 'stop', 'r', '#/line/deposit', 'depth.deposit.name', 'depth.deposit.see', { sub: true, also: ['#/line/clean'], links: ['etch'] }),
  st('print', 'make', M, 418, 'stop', 'r', '#/line/print', 'depth.print.name', 'depth.print.see', { sub: true, links: ['masks', 'layout'] }),
  st('etch', 'make', M, 364, 'stop', 'r', '#/line/etch', 'depth.etch.name', 'depth.etch.see', { sub: true, links: ['deposit'] }),
  st('implant', 'make', M, 310, 'stop', 'r', '#/line/implant', 'depth.implant.name', 'depth.implant.see', { sub: true, links: [] }),
  st('wires', 'make', M, 256, 'stop', 'r', '#/line/wires', 'depth.wires.name', 'depth.wires.see', { sub: true, links: ['layout'] }),
  st('test', 'make', M, 202, 'stop', 'r', '#/line/test', 'depth.test.name', 'depth.test.see', { sub: true, also: ['#/dive/wafer/made'], places: ['test'], links: ['check', 'ship'] }),
  st('pkg', 'make', M, 148, 'stop', 'r', '#/line/pkg', 'depth.pkg.name', 'depth.pkg.see', { sub: true, links: ['board'] }),
  st('ship', 'make', M, 94, 'stop', 'r', '#/line/ship', 'depth.ship.name', 'depth.ship.see', { sub: true, also: ['#/dive/soc/phone', '#/dive/mcu/car'], places: ['port'], links: ['use', 'test'] }),
  /* where a chip is used, and its users find the next problem */
  st('use', 'loop', M, 40, 'hub', 'r', '#/place/datacentre', 'map.datacentre.t', 'map.datacentre.d', { sub: true, also: ['#/dive/phoneboard/phone', '#/dive/ecu/car'], places: ['datacentre', 'power', 'phones', 'cars'], links: ['need', 'lab', 'building'] }),
  /* scale, in the middle: a data-centre hall down to an atom */
  st('building', 'scale', S, 100, 'lvl', 'rc', '#/place/datacentre/0', 'depth.building.name', 'depth.building.see'),
  st('rack', 'scale', S, 160, 'lvl', 'rc', '#/place/datacentre/2', 'depth.rack.name', 'depth.rack.see'),
  st('board', 'scale', S, 220, 'lvl', 'rc', '#/board', 'depth.board.name', 'depth.board.see'),
  st('chip', 'scale', S, 280, 'lvl', 'rc', '#/dive/chip', 'depth.chip.name', 'depth.chip.see'),
  st('block', 'scale', S, 340, 'lvl', 'rc', '#/dive/block', 'depth.block.name', 'depth.block.see'),
  st('gate', 'scale', S, 400, 'lvl', 'rc', '#/dive/gate', 'depth.gate.name', 'depth.gate.see'),
  st('switch', 'scale', S, 460, 'lvl', 'rc', '#/dive/switch', 'depth.switch.name', 'depth.switch.see'),
  st('atom', 'scale', S, 520, 'lvl', 'rc', '#/dive/atom', 'depth.atom.name', 'depth.atom.see')
];
export const SCALE = STATIONS.filter(s => s.line === 'scale').map(s => s.id);

/* the lines, as runs of straight wire (the map is drawn like a chip's wiring: across and down, never slanted) */
export const LINES = [
  { id: 'loop', w: 6, runs: [[D, 40, M, 40]] },
  { id: 'design', w: 8, runs: [[D, 40, D, 590], [D, 590, S, 590]] },
  { id: 'make', w: 8, runs: [[S, 590, M, 590], [M, 590, M, 40]] },
  { id: 'scale', w: 8, runs: [[S, 100, S, 520]] }
];
/* which way each line runs, marked along it */
export const ARROWS = [[D, 68, 'down', 'design'], [D, 535, 'down', 'design'], [350, 590, 'right', 'design'], [650, 590, 'right', 'make'], [M, 560, 'up', 'make'], [M, 175, 'up', 'make'], [650, 40, 'left', 'loop'], [350, 40, 'left', 'loop']];
/* the signals that run round the loop and down the scale */
export const LOOP_PATH = 'M' + D + ' 40 V590 H' + M + ' V40 Z';
export const SCALE_PATH = 'M' + S + ' 100 V520';

/* the thirteen core questions, each a thread through the map. One at a time. Words home.q.<id>, or the question's
   own home where it already has one (word) */
export const THREADS = [
  { id: 'perfect', word: 'field.perfect.q', home: 'layout', path: ['layout', 'etch', 'test', 'use'] },
  { id: 'line', home: 'riscv', path: ['riscv', 'arch', 'lab', 'logic'] },
  { id: 'moore', home: 'print', path: ['print', 'switch', 'pkg', 'lab'] },
  { id: 'geo', home: 'pkg', path: ['pkg', 'block', 'rack', 'building'] },
  { id: 'vn', home: 'check', path: ['check', 'test', 'switch', 'rack'] },
  { id: 'sutton', home: 'need', path: ['need', 'arch', 'chip', 'use'] },
  { id: 'dig', home: 'switch', path: ['switch', 'atom', 'masks', 'tape'] },
  { id: 'trust', home: 'ship', path: ['ship', 'test', 'riscv', 'masks'] },
  { id: 'eff', home: 'use', path: ['use', 'rack', 'building', 'need'] },
  { id: 'copy', home: 'arch', path: ['arch', 'block', 'pkg', 'lab'] },
  { id: 'nat', home: 'atom', path: ['atom', 'crystal', 'lab'] },
  { id: 'human', home: 'lab', path: ['lab', 'need', 'arch', 'ship'] },
  { id: 'physics', home: 'block', path: ['block', 'gate', 'switch', 'atom'] }
].map(x => Object.assign({ word: 'home.q.' + x.id }, x));

/* five ways in, each a route on the map */
export const WAYS = [
  { id: 'fly', lines: ['scale'], stations: SCALE },
  { id: 'build', lines: ['design', 'make'], stations: ['arch', 'riscv', 'logic', 'check', 'gates', 'layout', 'masks', 'tape', 'crystal', 'deposit', 'print', 'etch', 'implant', 'wires', 'test', 'pkg', 'chip'] },
  { id: 'solve', lines: ['make'], stations: ['check', 'test', 'ship', 'use', 'chip', 'block', 'switch'] },
  { id: 'invent', lines: ['loop', 'design'], stations: ['lab', 'need', 'arch', 'riscv', 'block'] },
  { id: 'evolve', lines: ['loop', 'make'], stations: ['lab', 'print', 'pkg', 'use', 'need', 'switch'] }
];

/* the first things to try, of different kinds: each is a station's challenge or page, met on the map */
export const STARTS = [
  { kind: 'puzzle', ch: 'onebad', at: 'test' },
  { kind: 'build', href: '#/build/computer/core', at: 'riscv', word: 'riscv' },
  { kind: 'lab', ch: 'litho-finest', at: 'print' },
  { kind: 'play', ch: 'prefill', at: 'chip' },
  { kind: 'build', ch: 'evolve', at: 'gates' }
];

/* the toys at the top of the page: small, played in a few seconds, each leading to its station and a question */
export const TOYS = {
  /* a wafer leaves the fab: specks of dust fall at random, and every chip with a speck on it fails. The same dust
     kills more of the wafer when the chips are bigger. A model, not industry figures */
  wafer: { sizes: [14, 24, 40], dust: 24, radius: 134, at: 'test', ch: 'onebad', thread: 'perfect' },
  /* two switches into one gate: the gate's rule decides the light */
  gate: { gates: ['NAND', 'AND', 'OR', 'XOR'], at: 'logic', ch: 'half' },
  /* shrinking the switch: how many fit on one processor, from the lab's trend data (src/data/trends.js) */
  shrink: { years: [1971, 1989, 2004, 2014, 2021], at: 'switch', figure: 'transistor-trend', thread: 'moore' },
  /* packing cores close: messages arrive sooner, heat has less room to leave. Shown as a trade, not measured */
  pack: { gaps: [2, 8, 18], at: 'block', thread: 'geo' },
  /* zooming from a hall to an atom, with the sizes the atlas keeps */
  zoom: { start: 'chip' }
};
