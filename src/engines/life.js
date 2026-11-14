/* Your chip's life: why a perfect design still fails. Pure logic, no DOM; tests in tests/life.test.mjs.

   Ported from the earlier site's reliability model (src/engines/reality.js on the branch `before`), and
   joined to your design: the design is "perfect" at the conditions it was signed off at (a typical chip,
   25 °C, a clean supply, brand new), its test patterns are the ones the factory's Test station runs, and
   the chip then lives where the journey's last station sends it: a phone, a car or a data centre.

   Real chips are not typical, run hot, see their supply dip under load, age, carry defects the test
   missed and are hit by radiation. Every mechanism below is a textbook model, simplified; each says what
   it leaves out. The numbers are for intuition: the direction and rough size of each effect matter, not
   the digits. */

/* ---- tiny maths ---- */
/* Standard normal CDF, accurate in the far tails (W. J. Cody's rational approximations of erfc). */
export function Phi(z) {
  if (z === Infinity) return 1; if (z === -Infinity) return 0;
  const x = Math.abs(z) / Math.SQRT2;
  let erfc;
  if (x < 0.5) {
    const t = x * x;
    const p = ((((0.185777706184603153 * t + 3.16112374387056560) * t + 113.864154151050156) * t + 377.485237685302021) * t + 3209.37758913846947);
    const q = ((((t + 23.6012909523441209) * t + 244.024637934444173) * t + 1282.61652607737228) * t + 2844.23683343917062);
    erfc = 1 - x * p / q;
  } else if (x < 4) {
    const p = (((((((0.564188496988670089 * x + 8.88314979438837594) * x + 66.1191906371416295) * x + 298.635138197400131) * x + 881.952221241769090) * x + 1712.04761263407058) * x + 2051.07837782607147) * x + 1230.33935479799725);
    const q = (((((((x + 15.7449261107098347) * x + 117.693950891312499) * x + 537.181101862009858) * x + 1621.38957456669019) * x + 3290.79923573345963) * x + 4362.61909014324716) * x + 3439.36767414372164) * x + 1230.33935480374942;
    erfc = Math.exp(-x * x) * p / q;
  } else {
    const t = 1 / (x * x);
    const p = ((((0.0163153871373020978 * t + 0.305326634961232344) * t + 0.360344899949804439) * t + 0.125781726111229246) * t + 0.0160837851487422766);
    const q = ((((t + 2.56852019228982242) * t + 1.87295284992346725) * t + 0.527905102951428412) * t + 0.0605183413124413191);
    erfc = Math.exp(-x * x) / x * (0.564189583547756287 - t * p / q);
  }
  return z >= 0 ? 1 - erfc / 2 : erfc / 2;
}

/* ---- the transistor and its clock ---- */
const V0 = 0.75, VT0 = 0.30, ALPHA = 1.3;        // supply, threshold voltage, alpha-power exponent
export const SIGMA = 0.03;                         // chip-to-chip spread in delay (process variation), 1 sigma
const k = 8.617e-5, K = t => t + 273.15;
/* Gate delay grows as the supply drops toward the threshold voltage (alpha-power law). */
const delay = (V, Vt) => V / Math.pow(V - Vt, ALPHA);
/* Hotter transistors are slower (a simplification: very low-voltage chips can do the opposite). */
const heat = T => 1 + 0.0008 * (T - 25);
/* Ageing (bias temperature instability): the threshold voltage creeps up with time under voltage and
   heat, roughly as the fifth root of time; 25 mV after ten years at 105 °C. */
export function dVt(years, T) { if (years <= 0) return 0; return 0.025 * Math.pow(years / 10, 0.2) * Math.exp(0.15 / k * (1 / K(105) - 1 / K(T))); }
const D0 = delay(V0, VT0);                          // the signed-off delay of the perfect design

/* ---- where the chip will live: the three dives ---- */
/* life: years in service; duty: share of the time it works hard; tMax: hottest junction temperature it
   must survive; tUse: typical working temperature (drives wear); fleet: how many are shipped; mem: on-chip
   memory in megabits (radiation flips its bits); need: what the customer asks, as the share of chips
   failed by the end of life, silent wrong answers per year across the fleet, speed and cost compared with
   the perfect design. Words: life.<id>.who / .story. */
export const MISSIONS = {
  phone: { life: 3, duty: 0.25, tMax: 75, tUse: 45, fleet: 1e7, mem: 64, need: { fail: 0.01, perf: 0.85, cost: 1.4 } },
  car: { life: 15, duty: 0.1, tMax: 125, tUse: 87, fleet: 1e6, mem: 16, need: { fail: 1e-4, silent: 10, cost: 2.2 } },
  /* a data centre accepts a few silent wrong answers a year across its fleet (about 2,000) and catches them in software
     that re-checks results and retires bad machines (Google, Cores that don't count; Meta, Silent data corruptions at
     scale): error-correcting memory is enough there. Only cars and aircraft run a second copy of the logic (lockstep) */
  datacentre: { life: 5, duty: 0.9, tMax: 95, tUse: 85, fleet: 1e5, mem: 400, need: { fail: 0.02, silent: 2000, perf: 0.8 } }
};
export const MISSION_IDS = Object.keys(MISSIONS);
/* where each depth's chip lives */
export const LIVES_AT = { chip: 'datacentre', soc: 'phone', mcu: 'car' };

/* ---- what the team can do about it: what people try ---- */
/* margin: sell it slower than it was signed off (share of the clock period added).
   hot: test hot and at a lowered supply, and reject outliers, instead of a cool test.
   burn: run every chip hot for hours before shipping, so weak ones break in the factory.
   grid: a stronger power grid in the layout (more metal for the supply), so the supply dips less under
   load; it costs a little area.
   protect: none; memory (error-correcting codes on memory); logic (also a second copy of the logic that
   checks the first, lockstep, which costs area).
   margin, grid and protect are decided in the design; hot and burn at the factory's Test station. */
export const MARGINS = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
export const PROTECT = ['none', 'memory', 'logic'];
export const PERFECT = { margin: 0, grid: false, hot: false, burn: false, protect: 'none' };
export const CHOICES = { design: ['margin', 'grid', 'protect'], factory: ['hot', 'burn'] };
export const normalLife = c => ({
  margin: Math.max(0, Math.min(MARGINS.length - 1, Math.round(+(c && c.margin) || 0))),
  grid: !!(c && c.grid), hot: !!(c && c.hot), burn: !!(c && c.burn), protect: PROTECT.includes(c && c.protect) ? c.protect : 'none'
});

/* ---- the model ---- */
const FIT_PER_MBIT = 500, VULNERABLE = 0.3, LOGIC_SHARE = 0.02, ECC_LEFT = 1e-4, LOCK_LEFT = 0.01;  // radiation
const DEFECTIVE = 0.10, LATENT = 0.0015, EM_T50 = 6, EM_EA = 0.9;
/* the stuck-at model your test patterns are graded by misses some real defects (bridges, slow wires) */
const UNMODELLED = { cool: 1e-3, hot: 1e-4 };
export const CAUSES = ['timing', 'escape', 'weak', 'wear'];

/* One design in one place. design: { coverage, mhz } from the studio (your test patterns' share of
   stuck-at faults caught, and the fastest clock its slowest path allows, as signed off). */
export function live(missionId, choices = PERFECT, design = {}) {
  const id = MISSIONS[missionId] ? missionId : 'phone', M = MISSIONS[id], s = normalLife(choices);
  const margin = MARGINS[s.margin], lock = s.protect === 'logic', ecc = s.protect !== 'none';
  const area = 1 + (s.grid ? 0.04 : 0) + (ecc ? 0.05 : 0) + (lock ? 0.6 : 0), droop = s.grid ? 0.02 : 0.05;
  const P = D0 * (1 + margin);                                       // the clock period it is sold at
  /* A chip with slowness x (1 = typical) works when x · delay ≤ period. */
  const sTest = P / (delay(V0 * (s.hot ? 0.95 : 1), VT0) * heat(s.hot ? M.tMax : 25));   // slowest chip that passes the test
  const sField = years => P / (delay(V0 * (1 - droop), VT0 + dVt(years * M.duty, M.tUse)) * heat(M.tMax));
  const cdf = x => Phi((x - 1) / SIGMA);
  const yTiming = cdf(sTest), yDefect = Math.pow(1 - DEFECTIVE, area);
  /* the share of shipped chips failed by year t, by cause */
  const timing = t => yTiming <= 0 ? 1 : Math.max(0, yTiming - cdf(Math.min(sField(t), sTest))) / yTiming;
  const cover = Math.min(Number.isFinite(design.coverage) ? design.coverage : 1, 1 - UNMODELLED[s.hot ? 'hot' : 'cool']);
  const escapes = (1 - yDefect) * (1 - cover) * 0.5;
  const escape = t => escapes * (1 - Math.exp(-t / 0.02));
  const latent = LATENT * area * (s.hot ? 0.3 : 1) * (s.burn ? 0.1 : 1);
  const weak = t => latent * (1 - Math.exp(-Math.sqrt(Math.max(0, t * M.duty))));
  const t50 = EM_T50 * Math.exp(EM_EA / k * (1 / K(M.tUse) - 1 / K(105)));
  const wear = t => t <= 0 ? 0 : Phi((Math.log(t * M.duty) - Math.log(t50)) / 0.5);
  const curve = { timing, escape, weak, wear };
  const total = t => 1 - CAUSES.reduce((a, c) => a * (1 - curve[c](t)), 1);
  const at = Object.fromEntries(CAUSES.map(c => [c, curve[c](M.life)])); at.total = total(M.life);
  /* radiation: bits flipped per year across the whole fleet, and how many give a wrong answer nobody sees */
  const upsets = FIT_PER_MBIT * M.mem * 8760e-9 * VULNERABLE * M.fleet;
  const silent = upsets * (ecc ? ECC_LEFT : 1) + upsets * LOGIC_SHARE * (lock ? LOCK_LEFT : 1);
  /* what it costs */
  const perf = 1 / (1 + margin);
  const cost = area / (yDefect * Math.max(yTiming, 1e-3)) * (1 - DEFECTIVE) + (s.hot ? 0.05 : 0) + (s.burn ? 0.1 : 0);
  const N = M.need, req = [{ id: 'fail', have: at.total, need: N.fail, ok: at.total <= N.fail }];
  if (N.silent !== undefined) req.push({ id: 'silent', have: silent, need: N.silent, ok: silent <= N.silent });
  if (N.perf !== undefined) req.push({ id: 'perf', have: perf, need: N.perf, ok: perf >= N.perf });
  if (N.cost !== undefined) req.push({ id: 'cost', have: cost, need: N.cost, ok: cost <= N.cost });
  const top = CAUSES.slice().sort((a, b) => at[b] - at[a])[0];
  const mhz = design.mhz > 0 ? design.mhz : null;
  return { mission: id, s, M, life: M.life, margin, droop, area, perf, cost, yTiming, cover, at, curve, total, upsets, silent, req,
    yDefect, pass: req.every(r => r.ok), top: at[top] > 0 ? top : null, mhz, sold: mhz && mhz * perf, hint: hint(req, top, yTiming, s) };
}

/* the one most useful thing to notice: what fails first, and what people try for it. Words: life.hint.<key>. */
function hint(req, top, yTiming, s) {
  const bad = req.filter(r => !r.ok);
  if (!bad.length) return 'ok';
  if (bad.some(r => r.id === 'fail')) {
    if (top === 'timing') return yTiming < 0.9 ? 'typical' : 'field';
    if (top === 'escape') return 'escape';
    if (top === 'weak') return s.burn ? 'weakBurnt' : 'weak';
    return 'wear';
  }
  if (bad.some(r => r.id === 'silent')) return s.protect === 'none' ? 'silent' : 'silentLogic';
  if (bad.some(r => r.id === 'perf')) return 'perf';
  return 'cost';
}
