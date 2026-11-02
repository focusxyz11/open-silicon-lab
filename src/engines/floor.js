/* The physics floor: how far a task is from the limits physics sets. Pure logic, no DOM; tests in
   tests/floor.test.mjs.

   Three floors, each from first principles:
   - Energy: erasing one bit of information costs at least kT ln 2 (Landauer, 1961). Ordinary logic
     erases bits all the time, so this is the floor for irreversible computing.
   - Cold: a cold chip has a lower floor, but its heat must be pumped out to the room, and even an
     ideal refrigerator pays (T_room − T) / T for every joule it removes (Carnot). The two cancel.
   - Speed: no signal outruns light; in the glass between a chip's wires, light is about half as fast
     as in vacuum.

   Today's energies come from the 45 nm table already used by the beyond topic (fact
   energy-moving-data). Newer processes do arithmetic several times more cheaply and move bits
   somewhat more cheaply, but the gaps from the floor stay enormous; the lab says so. */
import { E16, K_B } from './paradigms.js';

export const T_ROOM = 300;
export const landauer = (tempK = T_ROOM) => K_B * tempK * Math.LN2;   /* joules per bit erased */

/* Bits erased by one b-bit multiply-add, at least: an array multiplier is about b × b adder cells, each
   of which throws away at least one bit (three inputs in, two out), plus the accumulator overwriting
   its old value. An estimate of the order of magnitude, not an exact count. */
export const bitsErased = b => b * b + 2 * b;

/* Where an operand can come from, cheapest first, in pJ per 16-bit read (45 nm). */
export const SOURCES = { rf: E16.rf, sram: E16.sram32k, dram: E16.dram };

/* Tasks: how many multiply-adds, and where each one's two operands come from by default.
   weight: the operand that is shared (reused) across a batch or across positions; input: the other. */
export const TASKS = {
  mac: { macs: 1, weight: 'sram', input: 'rf', reuse: 1, bits: 16 },
  /* one word (token) from a 7-billion-parameter language model: about one multiply-add per parameter
     per token, every weight read from DRAM once per batch */
  token: { macs: 7e9, weight: 'dram', input: 'rf', reuse: 1, bits: 16 },
  /* one photo through a ResNet-50-sized network: about 4 billion multiply-adds, its 25 million weights
     fit on chip and are reused at every position in the image (He et al., 2015) */
  photo: { macs: 4e9, weight: 'sram', input: 'rf', reuse: 50, bits: 16 }
};

/* Energy of one task, by layer, in joules. opts: { bits, weight, input, reuse, tempK } override the task's defaults. */
export function ladder(task, opts = {}) {
  const t = { ...TASKS[task], ...opts }, b = t.bits, n = t.macs, s = b / 16;
  const floor = n * bitsErased(b) * landauer(t.tempK || T_ROOM);
  const math = n * (E16.mul * s * s + E16.add * s) * 1e-12;                 /* a multiplier grows as b², an adder as b */
  const moveW = n * SOURCES[t.weight] * s / Math.max(1, t.reuse) * 1e-12;
  const moveI = n * SOURCES[t.input] * s * 1e-12;
  const total = math + moveW + moveI;
  return {
    floor, math, moveW, moveI, move: moveW + moveI, total,
    times: total / floor,                          /* how many times above the floor */
    mathTimes: math / floor,
    moveShare: (moveW + moveI) / total,
    bits: b, macs: n
  };
}

/* Cooling: per bit erased at temperature T, the chip's floor plus the refrigerator's cost to pump that
   heat up to the room. eff: the refrigerator's share of the ideal (Carnot) performance, 0..1. */
export function cold(tempK, eff = 1) {
  const chip = landauer(tempK);
  const pump = tempK >= T_ROOM ? 0 : chip * (T_ROOM - tempK) / tempK / Math.max(1e-6, eff);
  return { chip, pump, total: chip + pump, room: landauer(T_ROOM), ratio: (chip + pump) / landauer(T_ROOM) };
}

/* Speed: how far a signal can go in one clock tick at its fastest. */
export const C = 299792458;
export const EPS_SIO2 = 3.9;                                          /* relative permittivity of silicon dioxide */
export function reach(ghz) {
  const tick = 1e-9 / ghz;
  return { tick, vacuum: C * tick, glass: C / Math.sqrt(EPS_SIO2) * tick };
}
/* Things a signal may need to cross. The largest die a lithography scanner prints in one exposure is
   26 × 33 mm, so its diagonal is the widest a single chip gets. */
export const SPANS = { phone: 0.01, reticle: Math.hypot(0.026, 0.033), board: 0.3, rack: 2 };
export const ticksToCross = (span, ghz) => span / reach(ghz).glass;
