/* Why perfect designs fail: a small reliability model. Pure logic, no DOM.

   The "perfect design" is correct and meets timing at the conditions it was signed off at:
   a typical chip, 25 °C, a clean supply, brand new. Real chips are not typical, run hot, see
   the supply dip under load, age, catch defects the test missed and get hit by radiation.
   Every mechanism below is a textbook model, simplified; each one says what it leaves out. */

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
const V0 = 0.75, VT0 = 0.30, ALPHA = 1.3;       // supply, threshold voltage, alpha-power exponent
export const SIGMA = 0.03;                        // chip-to-chip spread in delay (process variation), 1 sigma
const k = 8.617e-5, K = t => t + 273.15;
/* Gate delay grows as the supply drops toward the threshold voltage (alpha-power law). */
const delay = (V, Vt) => V / Math.pow(V - Vt, ALPHA);
/* Hotter transistors are slower (a simplification: very low-voltage chips can do the opposite). */
const heat = T => 1 + 0.0008 * (T - 25);
/* Aging (bias temperature instability): the threshold voltage creeps up with time under voltage and
   heat, roughly as the fifth root of time. 25 mV after ten years at 105 °C and nominal voltage. */
export function dVt(years, T, V) { if (years <= 0) return 0; return 0.025 * Math.pow(years / 10, 0.2) * Math.exp(0.15 / k * (1 / K(105) - 1 / K(T))) * Math.pow(V / V0, 4); }
const D0 = delay(V0, VT0);                         // the signed-off delay of the perfect design

/* ---- where the chip will live ---- */
/* life: years in service; duty: share of the time it works hard; tMax: hottest junction temperature it
   must survive; tUse: typical working temperature (drives wear); fleet: how many are shipped;
   sram: on-chip memory in megabits; rad: radiation compared with sea level; need: the customer's
   requirements. */
export const MISSIONS = {
  phone: { t: 'Phone', who: '10 million phones', life: 3, duty: 0.25, tMax: 75, tUse: 45, fleet: 1e7, sram: 64, rad: 1, cool$: 0.12,
    need: { fail: 0.01, perf: 0.85, cost: 1.3 }, story: 'A phone chip must be cheap and fast. Customers return a phone that crashes, but nobody keeps one for 15 years.' },
  car: { t: 'Car', who: 'One million cars', life: 15, duty: 0.1, tMax: 125, tUse: 87, fleet: 1e6, sram: 16, rad: 1, cool$: 0.06,
    need: { fail: 50e-6, silent: 10, cost: 2 }, story: 'A car has thousands of chips and must work for 15 years from −40 to 125 °C. Car makers count bad chips in parts per million.' },
  dc: { t: 'AI data center', who: '100,000 AI chips', life: 5, duty: 0.9, tMax: 95, tUse: 85, fleet: 1e5, sram: 400, rad: 1, cool$: 0.1,
    need: { fail: 0.02, silent: 50, perf: 0.85, power: 1.25 }, story: 'An AI chip runs flat out, hot, all day. In a fleet of 100,000, an error that is one in a billion per hour happens every day.' },
  sat: { t: 'Satellite', who: '100 satellites', life: 10, duty: 1, tMax: 70, tUse: 50, fleet: 100, sram: 16, rad: 300, cool$: 0.2,
    need: { fail: 0.01, silent: 0.1, cost: 5 }, story: 'Nobody can repair a satellite. In orbit, radiation is hundreds of times stronger than on the ground.' }
};
export const MISSION_IDS = Object.keys(MISSIONS);

/* ---- what the team can do about it ---- */
export const TESTS = {
  basic: { t: 'Basic', cover: 0.99, latent: 1, hot: false, vTest: 1, cost: 0, d: 'Checks 99% of possible faults, at room temperature.' },
  thorough: { t: 'Thorough', cover: 0.999, latent: 0.5, hot: true, vTest: 1, cost: 0.03, d: 'Checks 99.9% of faults, hot, and screens out the weakest chips.' },
  zero: { t: 'Zero-defect', cover: 0.9999, latent: 0.15, hot: true, vTest: 0.97, cost: 0.08, d: 'Car-grade: 99.99% of faults, hot, at a lowered supply, and rejects statistical outliers.' }
};
export const PERFECT = { margin: 0, vboost: 0, avs: false, grid: false, cool: false, test: 'basic', burn: false, ecc: false, logic: 'none' };
export const LOGIC = { none: { t: 'None', area: 0, silent: 1, detect: 0 }, lockstep: { t: 'Lockstep', area: 0.25, silent: 0.01, detect: 0.99 }, tmr: { t: 'Triple', area: 0.6, silent: 0.001, detect: 0 } };

/* ---- the model ---- */
const FIT_PER_MBIT = 500, VULNERABLE = 0.3, LOGIC_SHARE = 0.02, ECC_LEFT = 1e-4;  // soft-error assumptions
const DEFECTIVE = 0.10, LATENT = 0.002, EM_T50 = 6, EM_EA = 0.9;

/* Everything about one design in one mission. s: the team's choices (see PERFECT). */
export function evaluate(missionId, s0 = PERFECT) {
  const M = MISSIONS[missionId]; const s = { ...PERFECT, ...s0 }; const X = TESTS[s.test] || TESTS.basic; const L = LOGIC[s.logic] || LOGIC.none;
  const area = 1 + (s.grid ? 0.04 : 0) + (s.avs ? 0.01 : 0) + (s.ecc ? 0.05 : 0) + L.area;
  const P = D0 * (1 + s.margin);                                  // the clock period you choose
  const vSet = V0 * (1 + s.vboost), vMax = s.avs ? vSet * 1.08 : vSet, vAvg = s.avs ? vSet * 1.04 : vSet;
  const droop = s.grid ? 0.02 : 0.05;                             // supply dip under heavy load
  const tMax = M.tMax - (s.cool ? 15 : 0), tUse = M.tUse - (s.cool ? 15 : 0);
  /* A chip with slowness factor x (1 = typical) works when x · delay ≤ period. */
  const tTest = X.hot ? tMax : 25;
  const sTest = P / (delay(vMax * X.vTest, VT0) * heat(tTest));       // slowest chip that passes the test
  const sField = years => P / (delay(vMax * (1 - droop), VT0 + dVt(years * M.duty, tUse, vAvg)) * heat(tMax));
  const cdf = x => Phi((x - 1) / SIGMA);
  const yTiming = cdf(sTest), yDefect = Math.pow(1 - DEFECTIVE, area);
  /* Cumulative share of shipped chips failed by year t, per mechanism. */
  const timing = t => yTiming <= 0 ? 1 : Math.max(0, yTiming - cdf(Math.min(sField(t), sTest))) / yTiming;
  const escapes = (1 - Math.pow(1 - DEFECTIVE, area)) * (1 - X.cover) * 0.5;
  const esc = t => escapes * (1 - Math.exp(-t / 0.02));
  const latent = LATENT * area * X.latent * (s.burn ? 0.1 : 1);
  const lat = t => latent * (1 - Math.exp(-Math.sqrt(Math.max(0, t * M.duty))));
  const t50 = EM_T50 * Math.pow(vAvg / V0, -2) * Math.exp(EM_EA / k * (1 / K(tUse) - 1 / K(105)));
  const em = t => t <= 0 ? 0 : Phi((Math.log(t * M.duty) - Math.log(t50)) / 0.5);
  const total = t => 1 - (1 - timing(t)) * (1 - esc(t)) * (1 - lat(t)) * (1 - em(t));
  const life = M.life;
  const at = { timing: timing(life), esc: esc(life), lat: lat(life), em: em(life), total: total(life) };
  /* Radiation: upsets per year across the whole fleet, and how many stay silent. */
  const upsets = FIT_PER_MBIT * M.sram * 8760e-9 * M.rad * VULNERABLE * M.fleet;
  const memSilent = upsets * (s.ecc ? ECC_LEFT : 1), logicRaw = upsets * LOGIC_SHARE;
  const silent = memSilent + logicRaw * L.silent, detected = logicRaw * L.detect;
  /* What it costs. */
  const perf = 1 / (1 + s.margin);
  const power = (area - L.area * 0.3) * Math.pow(vAvg / V0, 2) * perf;   // redundant copies switch too, but less
  const cost = area / (yDefect * Math.max(yTiming, 1e-3)) * (1 - DEFECTIVE) + X.cost + (s.burn ? 0.1 : 0) + (s.cool ? M.cool$ : 0);
  const N = M.need, req = [];
  req.push({ id: 'fail', t: 'Chips failed by year ' + life, have: at.total, need: N.fail, ok: at.total <= N.fail, kind: 'fail' });
  if (N.silent !== undefined) req.push({ id: 'silent', t: 'Silent wrong answers per year, whole fleet', have: silent, need: N.silent, ok: silent <= N.silent, kind: 'count' });
  if (N.perf !== undefined) req.push({ id: 'perf', t: 'Speed, compared with the perfect design', have: perf, need: N.perf, ok: perf >= N.perf, kind: 'min' });
  if (N.power !== undefined) req.push({ id: 'power', t: 'Power, compared with the perfect design', have: power, need: N.power, ok: power <= N.power, kind: 'max' });
  if (N.cost !== undefined) req.push({ id: 'cost', t: 'Cost per good chip, compared with the plan', have: cost, need: N.cost, ok: cost <= N.cost, kind: 'max' });
  const causes = [['timing', at.timing], ['esc', at.esc], ['lat', at.lat], ['em', at.em]].sort((a, b) => b[1] - a[1]);
  return { mission: missionId, s, M, area, perf, power, cost, yTiming, yDefect, droop, tMax, tUse, vSet, vMax, at, curve: { timing, esc, lat, em, total }, sTest, sField, upsets, silent, detected, req, pass: req.every(r => r.ok), top: causes[0][1] > 0 ? causes[0][0] : null };
}

/* Names and one-line explanations of each mechanism, for charts and insight text. */
export const CAUSES = {
  timing: { t: 'Too slow in the real world', d: 'Chips that passed the test, then miss the clock when hot, under a supply dip, and as transistors age.' },
  esc: { t: 'Defects the test missed', d: 'Broken chips that slipped through the factory test and fail almost at once.' },
  lat: { t: 'Weak spots that break early', d: 'Hidden flaws that pass every test, then break in the first months of use: infant mortality.' },
  em: { t: 'Wires wearing out', d: 'Electromigration: current slowly pushes metal atoms along a wire until it opens.' }
};

/* The single most useful hint for the current design: what is failing, and the cheapest kind of fix. */
export function insight(r) {
  const bad = r.req.filter(x => !x.ok); if (!bad.length) return { ok: true, t: 'Shipped. Every requirement is met. Now try to make it cheaper or faster without breaking one.' };
  const f = bad.find(x => x.id === 'fail');
  if (f) {
    if (r.top === 'timing') {
      if (r.yTiming < 0.9) return { t: 'Most chips are too slow even at the factory test: the perfect design assumed a typical chip. Add clock margin or adaptive voltage.' };
      return { t: 'Chips pass the test, then fail in use: hot, under supply dips and as they age. ' + (r.s.grid ? '' : 'A stronger power grid cuts the dips. ') + 'More margin, adaptive voltage or better cooling also help.' };
    }
    if (r.top === 'esc') return { t: 'Broken chips are slipping through the factory test. A more thorough test program catches them.' };
    if (r.top === 'lat') return { t: 'Weak chips pass the test and break in their first months. Burn-in (running chips hot before shipping) and a stricter test screen them out.' };
    if (r.top === 'em') return { t: 'Wires are wearing out. Lower the voltage or the temperature.' };
  }
  if (bad.some(x => x.id === 'silent')) return { t: 'Radiation flips bits and nobody notices. Error-correcting memory (ECC) fixes most; protect the logic too if that is not enough.' };
  if (bad.some(x => x.id === 'perf')) return { t: 'Too slow: the margin you added costs speed. Adaptive voltage or a stronger power grid can replace some margin.' };
  if (bad.some(x => x.id === 'power')) return { t: 'Too much power: extra voltage and redundant logic burn energy. Use margin or adaptive voltage instead of a fixed voltage boost.' };
  if (bad.some(x => x.id === 'cost')) return { t: 'Too expensive. Drop protections this mission does not need: every one costs area, test time or cooling.' };
  return { t: 'Not there yet.' };
}
