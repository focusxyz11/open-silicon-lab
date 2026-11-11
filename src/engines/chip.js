/* Your chip: one chip whose settings every "Try it" changes, and whose effects every depth shows.
   A model for intuition, not for engineering: everything is relative to a starting chip (clock 1x,
   switch generation 2), and only the direction and rough size of each effect matter.

   - clock: how many times faster than the starting chip it ticks (CLOCKS).
   - gen: the switch generation, 0 (older, larger) to 4 (newest, smallest). Each generation shrinks a
     switch's length to about 0.7x, so its area halves and twice as many fit in the same space.
   - size: how large the chip is, as millimetres along each side (SIDES); bigger holds more cores and
     uses more power, and on the wafer fewer fit and more of them are hit by a defect.

   What follows from them:
   - timing: the slowest path through the logic must finish within one tick. Smaller switches are faster;
     a faster clock leaves less time. late = the share of paths that arrive after the tick.
   - wall: how much more current leaks through the thinner walls of the same area of switches.
   - power: switching costs energy every tick (more ticks, more switches, a little more voltage to go
     faster), and thinner walls let current leak even when nothing switches. */

export const CLOCKS = [0.5, 1, 1.5, 2, 3];
export const GENS = 5;
export const SIDES = [6, 10, 15, 20, 26];
export const START = { clock: 1, gen: 2, size: 2 };
export const SETTINGS = ['clock', 'gen', 'size'];

const step = (v, n, d) => { const x = Math.round(+v); return Number.isFinite(x) ? Math.max(0, Math.min(n - 1, x)) : d; };
const clampClock = c => (CLOCKS.includes(+c) ? +c : START.clock);
export const normal = c => ({ clock: clampClock(c && c.clock), gen: step(c && c.gen != null ? c.gen : START.gen, GENS, START.gen), size: step(c && c.size != null ? c.size : START.size, SIDES.length, START.size) });
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

export function model(c) {
  const { clock, gen, size } = normal(c);
  const side = SIDES[size], areaChip = (side / SIDES[START.size]) * (side / SIDES[START.size]);
  const s = Math.pow(0.7, gen - START.gen);           /* length of a switch, relative */
  const area = s * s;                                 /* area of a switch, relative */
  const density = 1 / area;                           /* switches in the same space */
  const path = 0.8 * Math.pow(s, 0.8);                /* time the slowest path needs, in starting ticks */
  const tick = 1 / clock;                             /* time one tick lasts */
  /* paths spread between half and all of the slowest; the share longer than a tick is late */
  const late = Math.max(0, Math.min(1, (path - tick) / (0.5 * path)));
  const volt = 0.8 + 0.2 * clock;                     /* a faster clock needs a little more voltage */
  const switching = 0.75 * clock * volt * volt;       /* same area: more but smaller switches cancel out */
  const leak = 0.25 * Math.pow(1.8, gen - START.gen) * volt; /* thinner walls leak more, per area */
  const power = (switching + leak) * areaChip;           /* a bigger chip has more switches to feed */
  /* on the wafer */
  const hit = hits(size, gen), total = hit.length, good = hit.filter(h => !h).length;
  const steps = STEPS[gen], start = START_WAFER();
  const cost = (steps / good) / (STEPS[START.gen] / start.good);   /* each wafer costs more with more steps */
  return {
    clock, gen, size, side, areaChip, s, area, density, path, tick, late, volt, power,
    leakShare: leak / (switching + leak), wall: Math.pow(1.8, gen - START.gen), battery: 1 / power,
    cores: gridOf(12 * density * areaChip).reduce((a, b) => a * b), grid: gridOf(12 * density * areaChip),
    dies: total, good, yield: total ? good / total : 0, steps, cost,
    layers: Math.round(62 * steps)   /* about a day in the factory for each, as in facts.json fab-cycle-time */
  };
}
let startWafer = null;
const START_WAFER = () => startWafer || (startWafer = { good: hits(START.size, START.gen).filter(h => !h).length });

/* A number for reading: two significant figures, as text. */
export const x2 = v => String(Number(v.toPrecision(2)));

/* Challenges: goals for your chip that no single setting can reach. Each names the settings it takes, and
   the stops where it is shown (at). Words: chal.<id>.goal and chal.<id>.hint. */
export const CHALLENGES = [
  { id: 'fast', needs: ['clock', 'gen'], at: ['fail.chip', 'scale.switch', 'scale.soc'], met: m => m.clock >= 2 && m.late === 0 },
  { id: 'battery', needs: ['gen', 'size'], at: ['life.phone', 'scale.soc', 'divide.test'], met: m => m.battery >= 1.5 && m.clock >= 1 && m.cores >= 12 },
  { id: 'cores', needs: ['gen', 'size'], at: ['fail.wafer', 'divide.test', 'scale.switch', 'scale.mcu'], met: m => m.cores >= 20 && m.cost <= 0.7 },
  { id: 'quick', needs: ['gen', 'size'], at: ['divide.test', 'scale.soc', 'scale.switch'], met: m => m.layers <= 50 && m.cores >= 12 }
];
