/* The physics floor: how far your chip is from the limits physics sets. Pure logic, no DOM; tests in
   tests/floor.test.mjs. From the earlier site's floor engine (src/engines/floor.js on the branch `before`),
   joined to your chip (src/engines/chip.js): its switch size, its clock, its size and its memory.

   Three floors, each from first principles:
   - Energy: erasing one bit of information costs at least kT ln 2 (Landauer, 1961). Ordinary logic erases
     bits all the time (a gate takes two inputs and gives one output), so this is the floor for the
     computing every chip does today.
   - Cold: a cold chip has a lower floor, but its heat must be pumped out to the room, and even a perfect
     refrigerator pays (T_room − T) / T for every joule it removes (Carnot). The two cancel exactly.
   - Speed: no signal outruns light; in the glass between a chip's wires, light is about half as fast as in
     vacuum. Real wires are far slower still.

   Your chip's energy comes from its model: a 16-bit multiply-add, and fetching its two numbers, from the
   45 nm table of src/data/facts.json (energy-moving-data), scaled with your switches and your memory. */

export const K_B = 1.380649e-23;        /* Boltzmann's constant, J/K */
export const T_ROOM = 300;
export const C = 299792458;             /* light in vacuum, m/s */
export const EPS_GLASS = 3.9;           /* relative permittivity of silicon dioxide */
/* the starting chip's clock, an assumption of this model: 2 billion ticks a second */
export const BASE_GHZ = 2;

/* joules to erase one bit at a temperature */
export const landauer = (tempK = T_ROOM) => K_B * tempK * Math.LN2;
/* bits erased by one b-bit multiply-add, at least: an array multiplier is about b × b adder cells, each of
   which throws away at least one bit (three in, two out), plus the sum overwriting its old value. An
   estimate of the order of magnitude, not an exact count. */
export const bitsErased = b => b * b + 2 * b;

/* one multiply-add on your chip, and the floor under it, in joules. m: model(chip) from src/engines/chip.js */
export function perOp(m) {
  const floor = bitsErased(16) * landauer(T_ROOM), math = m.mathPJ * 1e-12, move = m.movePJ * 1e-12;
  return { floor, math, move, total: math + move, mathTimes: math / floor, times: (math + move) / floor };
}

/* Cooling: per bit erased at temperature T, the chip's floor plus a refrigerator's cost to pump that heat
   up to the room. eff: the refrigerator's share of the ideal (Carnot) performance, 0..1. */
export function cold(tempK, eff = 1) {
  const chip = landauer(tempK), room = landauer(T_ROOM);
  const pump = tempK >= T_ROOM ? 0 : chip * (T_ROOM - tempK) / tempK / Math.max(1e-6, eff);
  return { chip, pump, total: chip + pump, room, ratio: (chip + pump) / room };
}
/* the temperatures to try: liquid helium, liquid nitrogen, a freezer's far end, the room */
export const TEMPS = [4, 77, 200, 300];

/* Speed: how far light in glass goes in one tick of your chip, and how many ticks a signal needs at the
   very least to cross it corner to corner. */
export function reach(m) {
  const ghz = BASE_GHZ * m.clock, tick = 1e-9 / ghz, glass = C / Math.sqrt(EPS_GLASS) * tick;
  const across = Math.SQRT2 * m.side / 1000;
  return { ghz, tick, glass, across, ticks: across / glass };
}
