/* Your chip: one chip whose settings every "Try it" changes, and whose effects every depth shows.
   A model for intuition, not for engineering: everything is relative to a starting chip (clock 1x,
   switch generation 2), and only the direction and rough size of each effect matter.

   - clock: how many times faster than the starting chip it ticks (CLOCKS).
   - gen: the switch generation, 0 (older, larger) to 4 (newest, smallest). Each generation shrinks a
     switch's length to about 0.7x, so its area halves and twice as many fit in the same space.

   What follows from them:
   - timing: the slowest path through the logic must finish within one tick. Smaller switches are faster;
     a faster clock leaves less time. late = the share of paths that arrive after the tick.
   - wall: how much more current leaks through the thinner walls of the same area of switches.
   - power: switching costs energy every tick (more ticks, more switches, a little more voltage to go
     faster), and thinner walls let current leak even when nothing switches. */

export const CLOCKS = [0.5, 1, 1.5, 2, 3];
export const GENS = 5;
export const START = { clock: 1, gen: 2 };
export const SETTINGS = ['clock', 'gen'];

const clampGen = g => Math.max(0, Math.min(GENS - 1, Math.round(+g)));
const clampClock = c => (CLOCKS.includes(+c) ? +c : START.clock);
export const normal = c => ({ clock: clampClock(c && c.clock), gen: clampGen(c && c.gen != null ? c.gen : START.gen) });
export const changed = c => { const n = normal(c); return n.clock !== START.clock || n.gen !== START.gen; };

/* The cores that fit on the chip, as a grid, by generation: about twice as many each step. */
const GRIDS = [[2, 2], [3, 2], [4, 3], [6, 4], [8, 6]];

export function model(c) {
  const { clock, gen } = normal(c);
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
  const power = switching + leak;
  return {
    clock, gen, s, area, density, path, tick, late, volt, power,
    leakShare: leak / power, wall: Math.pow(1.8, gen - START.gen), battery: 1 / power, grid: GRIDS[gen]
  };
}

/* A number for reading: two significant figures, as text. */
export const x2 = v => String(Number(v.toPrecision(2)));
