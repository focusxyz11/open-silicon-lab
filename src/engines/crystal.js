/* The crystal puller, as a stepping model (the Czochralski process; gathered by fabsteps.js).
   Ported from the earlier site (the branch 'before': the crystal puller lab of its physics topic), same formulas and
   constants, with the screen and the timer taken out. Pure: pullStep(state, dt, settings) returns a new state.

   A seed crystal is dipped in molten silicon and pulled up while turning. The diameter does not jump to what the
   settings ask for; it follows it with a lag (a time constant of 25 minutes): target = 300 mm * exp(-0.8 (pull - 1)
   - 0.19 (temp - 8)), kept between 2 and 460 mm. Pull faster or run the melt hotter and the crystal gets thinner.
   Five phases: dip the seed, neck (thin to 6 mm or less over the first 80 mm, so dislocations from the seed grow
   out: Dash necking; if the neck never gets thin the crystal is spoiled), shoulder (widen), body (hold 300 to
   312 mm; only length grown in that band is usable) and tail (taper off once the melt is down to 40 kg). Lifting the
   crystal off at more than 120 mm wide is a thermal shock: dislocations run back up about one diameter, which
   is cut from the usable length. The melt is 400 kg; silicon weighs 2.33 g/cm3; a wafer costs 0.975 mm of ingot
   (775 um thick plus about 200 um lost to the saw). Units: mm, minutes, kg. Rotation only warns (too slow, striations;
   too fast, turbulence); it does not change the diameter.
   The first version's autopilot ran its tail at a speed that thinned the crystal to a thread, which uses no melt and so
   never ended; pullAuto here holds the tail near 90 mm until the melt runs out. */
import { clamp, metBy } from './fabkit.js';

export const PULL_DEFAULTS = { pull: 3.8, temp: 18, rot: 12 };          // mm/min, degrees above freezing, rpm: the first version's start
export const PULL_RANGE = { pull: [0.2, 4], temp: [0, 20], rot: [2, 25] };
export const PULL = { melt: 400, neckAt: 80, neckMax: 6, bodyFrom: 290, lag: 25, dtMax: 2, endMelt: 8, tailMelt: 40, shock: 120, waferMm: 0.975 };
export const PULL_TARGET = { min: 300, max: 312 };                       // the band, in mm, that counts as usable
export const PULL_PHASES = ['dip', 'neck', 'shoulder', 'body', 'tail'];
export const PULL_TIMESCALE = { dip: 7, neck: 7, shoulder: 24, body: 80, tail: 30 };  // minutes of crystal time per second on screen, as the first version ran it

export const pullTarget = (pull, temp) => clamp(300 * Math.exp(-0.8 * (pull - 1) - 0.19 * (temp - 8)), 2, 460);
export const pullSettings = s => ({ ...PULL_DEFAULTS, ...s });

/* what rotation does (and nothing else): 'slow', 'ok' or 'fast' */
export const pullRotation = rot => rot < 5 ? 'slow' : rot > 22 ? 'fast' : 'ok';

export function pullStart() {
  const s = { D: 5, L: 0, t: 0, hist: [[0, 5]], melt: PULL.melt, mass: 0, neckMin: 99, neckOk: null, usable: 0, body: false, done: false, shock: false };
  return { ...s, ...read(s, PULL_DEFAULTS) };
}

function phaseOf(s) {
  if (s.done) return 'tail';
  if (s.L < 5) return 'dip';
  if (s.neckOk === null) return 'neck';
  if (!s.body && s.melt > PULL.tailMelt) return 'shoulder';
  if (s.melt > PULL.tailMelt) return 'body';
  return 'tail';
}

/* what the autopilot would set now (the first version's, with the tail held near 90 mm so the melt can run out) */
export function pullAuto(s) {
  const ph = phaseOf(s);
  if (ph === 'dip' || ph === 'neck') return { pull: 3.6, temp: 18 };
  if (ph === 'shoulder') return { pull: 0.75, temp: 7.5 };
  if (ph === 'body') return { pull: clamp(1.0 + (s.D - 305) / 300 * 6, 0.4, 2.5), temp: 8 };
  return { pull: 3, temp: 6 };
}

function tick(s, dt, set) {
  let { pull: p, temp: T } = set;
  if (set.auto) ({ pull: p, temp: T } = pullAuto(s));
  const D = s.D + (pullTarget(p, T) - s.D) * Math.min(1, dt / PULL.lag);
  const body = s.body || (s.neckOk === true && D >= PULL.bodyFrom);
  const dL = p * dt, g = Math.PI * (D / 20) ** 2 * dL / 10 * 2.33 / 1000;
  const L = s.L + dL, melt = s.melt - g;
  let neckMin = s.neckMin, neckOk = s.neckOk, usable = s.usable, done = s.done, shock = s.shock;
  if (s.L > 5 && s.L < PULL.neckAt) neckMin = Math.min(neckMin, D);
  if (neckOk === null && L >= PULL.neckAt) neckOk = neckMin <= PULL.neckMax;
  if (D >= PULL_TARGET.min && D <= PULL_TARGET.max && neckOk) usable += dL;
  const last = s.hist[s.hist.length - 1];
  const hist = L - last[0] >= 4 ? s.hist.concat([[L, D]]) : s.hist;
  if (melt <= PULL.endMelt) { done = true; if (D > PULL.shock) { shock = true; usable = Math.max(0, usable - D); } }
  return { ...s, D, L, t: s.t + dt, hist, melt, mass: s.mass + g, neckMin, neckOk, usable, body, done, shock };
}

/* what the screen shows about a state: the phase, the target, the dislocations ('none', 'seed' from a neck that stayed
   thick, 'shock' from lifting off wide), a message id, the wafers it will slice into, and the rotation warning */
function read(s, set) {
  const phase = phaseOf(s), dislocations = s.neckOk === false ? 'seed' : s.shock ? 'shock' : 'none';
  const wafers = s.neckOk === false ? 0 : Math.floor(s.usable / PULL.waferMm);
  let msg;
  if (s.neckOk === false) msg = 'neckfail';
  else if (s.done) msg = s.shock ? 'shock' : 'done';
  else if (phase === 'dip' || phase === 'neck') msg = 'neck';
  else if (phase === 'shoulder') msg = 'shoulder';
  else if (phase === 'body') msg = s.D < PULL_TARGET.min ? 'thin' : s.D > PULL_TARGET.max ? 'wide' : 'ok';
  else msg = 'tail';
  return { phase, target: pullTarget(set.pull, set.temp), dislocations, wafers, msg, rotation: pullRotation(set.rot), ingotKg: s.mass, bodyMm: s.usable };
}

/* Advance the puller by dt minutes under settings { pull, temp, rot, auto }. Long steps are cut into steps of at
   most 2 minutes, so a view may pass any dt. Returns a new state; the old one is left alone. */
export function pullStep(state, dt, settings = {}) {
  const set = pullSettings(settings);
  let s = state, left = dt;
  while (left > 1e-9 && !s.done) { const h = Math.min(left, PULL.dtMax); s = tick(s, h, set); left -= h; }
  return { ...s, ...read(s, set) };
}

/* Run the autopilot (or a function from state to settings) until the melt is out or maxMin minutes have passed. */
export function pullRun(settings = { auto: true }, maxMin = 12000, dt = 1) {
  let s = pullStart();
  for (let t = 0; t < maxMin && !s.done; t += dt) s = pullStep(s, dt, typeof settings === 'function' ? settings(s) : settings);
  return s;
}

/* The challenge: a dislocation-free ingot, grown to the end and lifted off safely, with some length in the band. */
export const PULL_CHALLENGES = [
  { id: 'crystal', lab: 'puller', groups: [s => s.done && s.neckOk === true && !s.shock && s.usable > 0] }
];
export const pullMet = seen => metBy(PULL_CHALLENGES[0], seen);

/* the words: cz.* in src/i18n/en/ (the challenge's: game.ch.crystal.*, fab.ch.crystal.done) */
export const PULL_WORDS = {};
