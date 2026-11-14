/* Your chip: one chip whose settings every "Try it" changes, and whose effects every depth shows.
   A model for intuition, not for engineering: everything is relative to a starting chip (clock 1x,
   switch generation 2), and only the direction and rough size of each effect matter.

   - clock: how many times faster than the starting chip it ticks (CLOCKS).
   - gen: the switch generation, 0 (older, larger) to 4 (newest, smallest). Each generation shrinks a
     switch's length to about 0.7x, so its area halves and twice as many fit in the same space.
   - size: how large the chip is, as millimetres along each side (SIDES); bigger holds more cores and
     uses more power, and on the wafer fewer fit and more of them are hit by a defect.
   - load: how full the fab that makes it runs (LOADS), from the earlier site's "a fab you run"
     (src/engines/fab.js): fuller makes each wafer cheaper, but every wafer waits longer at every machine.

   - reuse: how many times each number is used once it has been fetched from memory (REUSES): a way of
     organizing the work (keeping numbers close, in the chip's own memory, batching many requests).
   - mem: where the memory sits (MEMS): memory chips on the board, or stacks of memory beside the chip in
     its package (as AI chips have): many times the bandwidth, and less energy for every byte.

   What follows from them:
   - timing: the slowest path through the logic must finish within one tick. Smaller switches are faster;
     a faster clock leaves less time. late = the share of paths that arrive after the tick.
   - wall: how much more current leaks through the thinner walls of the same area of switches.
   - the memory wall: the cores can only work as fast as numbers arrive. Faster cores and more of them
     ask more of memory; reuse and closer memory ask less. busy = the share of the time the cores work
     rather than wait. And moving a number from memory costs far more energy than computing with it
     (src/data/facts.json, energy-moving-data: at 45 nm, 640 pJ to read 16 bits from DRAM, 0.62 + 0.18 pJ
     to multiply and add): moving = the share of the energy spent fetching rather than computing.
   - power: switching costs energy every tick (more ticks, more switches, a little more voltage to go
     faster), and thinner walls let current leak even when nothing switches. */
import { line, capacity, summary } from './fab.js';

export const CLOCKS = [0.5, 1, 1.5, 2, 3];
export const GENS = 5;
export const SIDES = [6, 10, 15, 20, 26];
export const LOADS = [0.6, 0.75, 0.85, 0.92, 0.97];
export const REUSES = [1, 4, 16, 64, 256, 1024];
export const MEMS = [{ bw: 1, e: 1 }, { bw: 8, e: 0.25 }];   /* relative bandwidth, and energy per byte */
export const START = { clock: 1, gen: 2, size: 2, load: 2, reuse: 2, mem: 0 };
export const SETTINGS = ['clock', 'gen', 'size', 'load', 'reuse', 'mem'];
/* every value each setting can take, for searching them all (tests, challenges) */
export const VALUES = { clock: CLOCKS, gen: [0, 1, 2, 3, 4], size: SIDES.map((_, i) => i), load: LOADS.map((_, i) => i), reuse: REUSES.map((_, i) => i), mem: MEMS.map((_, i) => i) };

const step = (v, n, d) => { const x = Math.round(+v); return Number.isFinite(x) ? Math.max(0, Math.min(n - 1, x)) : d; };
const clampClock = c => (CLOCKS.includes(+c) ? +c : START.clock);
export const normal = c => ({ clock: clampClock(c && c.clock), gen: step(c && c.gen != null ? c.gen : START.gen, GENS, START.gen), size: step(c && c.size != null ? c.size : START.size, SIDES.length, START.size),
  load: step(c && c.load != null ? c.load : START.load, LOADS.length, START.load),
  reuse: step(c && c.reuse != null ? c.reuse : START.reuse, REUSES.length, START.reuse), mem: step(c && c.mem != null ? c.mem : START.mem, MEMS.length, START.mem) });
export const changed = c => { const n = normal(c); return SETTINGS.some(k => n[k] !== START[k]); };

/* The cores that fit: 12 on the starting chip, more with smaller switches and a bigger chip, as a grid
   about four wide for every three high (at most 12 x 9, to stay drawable). */
function gridOf(count) {
  const n = Math.max(2, Math.min(108, Math.round(count)));
  const cols = Math.max(2, Math.min(12, Math.round(Math.sqrt(n * 4 / 3))));
  return [cols, Math.max(1, Math.min(9, Math.round(n / cols)))];
}

/* ---- the wafer: a disc 300 mm across, drawn in the 1000 x 1000 space as a circle of radius R ---- */
export const WAFER = { mm: 300, R: 440 };
const MM = WAFER.R / (WAFER.mm / 2);
/* defects per square centimetre: newer processes start with more */
const D0 = gen => 0.1 * Math.pow(1.25, gen - START.gen);
/* the chips on the wafer: a grid of squares, one centred on the middle, kept wholly inside the disc */
export function dies(size) {
  const side = SIDES[step(size, SIDES.length, START.size)] * MM, gap = 2, pitch = side + gap, out = [];
  const n = Math.ceil(WAFER.R / pitch) + 1;
  for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
    const x = 500 + i * pitch - side / 2, y = 500 + j * pitch - side / 2;
    const far = Math.max(Math.hypot(x - 500, y - 500), Math.hypot(x + side - 500, y - 500), Math.hypot(x - 500, y + side - 500), Math.hypot(x + side - 500, y + side - 500));
    if (far <= WAFER.R - 6) out.push([x, y, side, side]);
  }
  return out;
}
/* the specks that land on one wafer: always in the same places for the same process, so the picture
   and the count agree */
export function defects(gen) {
  const area = Math.PI * (WAFER.mm / 20) * (WAFER.mm / 20), n = Math.round(D0(step(gen, GENS, START.gen)) * area), out = [];
  for (let k = 0; out.length < n && k < n * 4; k++) {
    const a = frac(Math.sin(k * 12.9898) * 43758.5453), b = frac(Math.sin(k * 78.233) * 12345.6789);
    const r = Math.sqrt(a) * (WAFER.R - 8), t = b * 6.2832;
    out.push([500 + r * Math.cos(t), 500 + r * Math.sin(t)]);
  }
  return out;
}
const frac = v => v - Math.floor(v);
/* which chips a speck lands on */
export function hits(size, gen) {
  const ds = dies(size), sp = defects(gen);
  return ds.map(d => sp.some(p => p[0] >= d[0] && p[0] <= d[0] + d[2] && p[1] >= d[1] && p[1] <= d[1] + d[3]));
}
/* the chip the dive follows down: the one in the middle */
export const dieSquare = size => { const side = SIDES[step(size, SIDES.length, START.size)] * MM; return [500 - side / 2, 500 - side / 2, side]; };
/* build steps, relative to the starting chip: finer switches need more layers and more passes */
const STEPS = [0.6, 0.8, 1, 1.3, 1.6];
/* Today's rules for a generation (docs/reviews/models.md, C1, C2, C4, C5, C8; facts.json density-per-node,
   speed-per-node, wafer-price, voltage-scaling, leakage-rule). The old rule, 2x the switches and 25% faster
   each time with the voltage falling, held until about 2005 to 2015; a generation now gives:
   - DENSITY: switches in the same space, relative to the starting chip (1.7x and 1.5x for the two newer ones;
     makers' figures for logic, less for whole chips with their memories)
   - SPEED: each generation's slowest path about 13% shorter at the same power
   - WAFER_COST: a wafer costs about 1.5x more each generation, so a switch costs about the same
   - the voltage no longer falls with the size, so the same area turns more power into heat (HEAT per generation),
     and makers hold each switch's leak about level, so the same area leaks a little more (LEAK) */
const DENSITY = [0.25, 0.5, 1, 1.7, 2.6];
const SPEED = 0.87, HEAT = 1.25, LEAK = 1.1;
const WAFER_COST = [0.55, 0.75, 1, 1.5, 2.2];

/* the fab: its line of tool groups, and how each station of the journey maps onto them */
const LINE = line();
export const GROUPS_AT = { clean: ['clean'], deposit: ['depo'], print: ['litho'], etch: ['etch'], implant: ['implant', 'anneal'], wires: ['cmp', 'metro'] };
const GROUP_STATION = { depo: 'deposit', litho: 'print', etch: 'etch', clean: 'clean', implant: 'implant', anneal: 'implant', cmp: 'wires', metro: 'wires' };
/* a fab's costs are mostly fixed: a wafer made in a fuller fab carries less of them (illustrative: 60% fixed) */
const FIXED = 0.6;

export function model(c) {
  const { clock, gen, size, load: li, reuse: ri, mem: mi } = normal(c);
  const side = SIDES[size], areaChip = (side / SIDES[START.size]) * (side / SIDES[START.size]);
  const g = gen - START.gen;
  const density = DENSITY[gen];                       /* switches in the same space */
  const area = 1 / density;                           /* the space a switch (with its share of wiring) takes */
  const s = Math.sqrt(area);                          /* its side, for the energy of an operation */
  const path = 0.8 * Math.pow(SPEED, g);              /* time the slowest path needs, in starting ticks */
  const tick = 1 / clock;                             /* time one tick lasts */
  /* paths spread between half and all of the slowest; the share longer than a tick is late */
  const late = Math.max(0, Math.min(1, (path - tick) / (0.5 * path)));
  const volt = 0.8 + 0.2 * clock;                     /* a faster clock needs a little more voltage */
  const switching = 0.75 * clock * volt * volt * Math.pow(HEAT, g);   /* same area: the voltage no longer falls, so it runs hotter */
  const leak = 0.25 * Math.pow(LEAK, g) * volt;       /* each switch's leak held about level: more of them in the same area */
  const power = (switching + leak) * areaChip;           /* a bigger chip has more switches to feed */
  /* on the wafer */
  const hit = hits(size, gen), total = hit.length, good = hit.filter(h => !h).length;
  const steps = STEPS[gen], start = START_WAFER();
  const load = LOADS[li], layers = Math.round(62 * steps);   /* about a day in the factory for each, as in facts.json fab-cycle-time */
  const F = summary(LINE, layers, load * capacity(LINE, layers));
  const full = 1 - FIXED + FIXED * LOADS[START.load] / load;
  const cost = full * (WAFER_COST[gen] / good) / (WAFER_COST[START.gen] / start.good);   /* each wafer costs more in a newer process */
  /* each station of the line: how busy it is, and how long a wafer waits there per visit (hours) */
  const fab = {};
  Object.entries(GROUPS_AT).forEach(([st, ids]) => { const gs = F.groups.filter(g => ids.includes(g.id)); fab[st] = { busy: Math.max(...gs.map(g => g.u)), wait: gs.reduce((a, g) => a + g.wq, 0), work: gs.reduce((a, g) => a + g.te, 0) }; });
  /* the memory wall: the starting chip, with each number used 16 times and memory chips on the board, is
     exactly fed. need > 1: the cores ask for numbers faster than memory sends them */
  const grid = gridOf(12 * density * areaChip), cores = grid[0] * grid[1];
  const peak = cores * clock / 12, reuse = REUSES[ri], memory = MEMS[mi];
  const need = peak * REUSES[START.reuse] / (reuse * memory.bw), busy = Math.min(1, 1 / need);
  const math = (0.62 + 0.18) * s, move = 2 * 640 * memory.e / reuse;
  /* the board's power: the chip, and the memory it fetches from (about a fifth to a third of a server's power;
     0.3 of the chip's at the start, when each number is used 16 times from memory chips: 80 pJ per multiply-add) */
  const workDone = peak * busy, memPower = 0.3 * workDone * (move / 80);
  return {
    clock, gen, size, side, areaChip, s, area, density, path, tick, late, volt, power,
    reuse, mem: mi, peak, need, busy, work: workDone, moving: move / (math + move), mathPJ: math, movePJ: move,
    powerBoard: (power + memPower) / 1.3,
    leakShare: leak / (switching + leak), wall: Math.pow(LEAK, g), battery: 1 / power,
    cores, grid,
    dies: total, good, yield: total ? good / total : 0, steps, cost, layers,
    load, days: F.days, perLayer: F.daysPerLayer, slow: GROUP_STATION[F.bottleneck], fab, waiting: 1 - F.raw / F.days
  };
}
let startWafer = null;
const START_WAFER = () => startWafer || (startWafer = { good: hits(START.size, START.gen).filter(h => !h).length });

/* A number for reading: two significant figures, as text. */
export const x2 = v => String(Number(v.toPrecision(2)));

/* Challenges: goals for your chip that no single setting can reach. Each names the settings it takes, and
   the stops where it is shown (at). Words: chal.<id>.goal and chal.<id>.hint. */
export const CHALLENGES = [
  { id: 'fast', needs: ['clock', 'gen'], at: ['fail.chip', 'scale.switch', 'scale.soc'], met: m => m.clock >= 1.5 && m.late === 0 },
  { id: 'battery', needs: ['gen', 'size'], at: ['life.phone', 'scale.soc', 'divide.test'], met: m => m.battery >= 1.5 && m.clock >= 1 && m.cores >= 12 },
  { id: 'cores', needs: ['gen', 'size'], at: ['fail.wafer', 'divide.test', 'scale.switch', 'scale.mcu'], met: m => m.cores >= 16 && m.cost <= 1.2 },
  { id: 'quick', needs: ['gen', 'size'], at: ['divide.test', 'scale.soc', 'scale.switch'], met: m => m.layers <= 50 && m.cores >= 12 },
  { id: 'fed', needs: ['gen', 'reuse'], at: ['scale.switch', 'think.board', 'divide.block', 'divide.pkg'], met: m => m.work >= 2.5 && m.late === 0 },
  { id: 'months', needs: ['gen', 'load'], at: ['divide.wires', 'scale.switch'], met: m => m.days <= 60 && m.load >= 0.92 }
];
