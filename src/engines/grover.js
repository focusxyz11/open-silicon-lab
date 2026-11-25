/* Quantum search with noise and error correction, as an engine (the model of the first version's quantum-search lab,
   topics/quantum/labs/quantum-search.js there; ported unchanged, plus the checks of its challenges). Pure logic, no
   DOM, no words (the lab shows its own, grv.* in src/i18n/en/labs.json).

   One real amplitude per box: the search only ever needs up and down, so a list of numbers is an exact state.
   Flip marks the prize, mirror turns the mark into a difference, chance(N, k) = sin²((2k + 1)θ). Noise wipes the
   state back to guessing with chance e per step; error correction follows the rough surface-code estimate of
   Fowler et al. 2012: copies help below a threshold and hurt above it.

   CHECKS: one pure function per challenge id, on the state a player has reached. checkOf(id, state). */

/* Quantum search: one real amplitude per box. No DOM. This search never needs anything but up and
   down, so a plain list of numbers is an exact state, not a simplification of one. */
export const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let z = Math.imul(a ^ a >>> 15, 1 | a); z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z; return ((z ^ z >>> 14) >>> 0) / 4294967296; };
export const start = N => Array(N).fill(1 / Math.sqrt(N));
export const flip = (a, i) => a.map((v, j) => (j === i ? -v : v));
export const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
export const mirror = a => { const m = mean(a); return a.map(v => 2 * m - v); };
export function run(N, k, prize) { let a = start(N); for (let i = 0; i < k; i++) a = mirror(flip(a, prize)); return a; }

export const theta = N => Math.asin(1 / Math.sqrt(N));
/* The chance of finding the prize after k steps; k may be fractional, for drawing the curve. */
export const chance = (N, k) => Math.sin((2 * k + 1) * theta(N)) ** 2;
export function bestSteps(N) { let b = 0; for (let k = 0; k <= Math.ceil(Math.PI / 4 * Math.sqrt(N)) + 1; k++) if (chance(N, k) > chance(N, b) + 1e-12) b = k; return b; }

/* Noise: each step wipes the state back to pure guessing with chance e. */
export const wiped = (k, e) => 1 - Math.pow(1 - e, k);
export const noisy = (p, N, k, e) => { const w = wiped(k, e); return (1 - w) * p + w / N; };
export const noisyAmps = (a, k, e) => { const w = wiped(k, e), N = a.length; return a.map(v => (v < 0 ? -1 : 1) * Math.sqrt((1 - w) * v * v + w / N)); };
/* Plain checking: open k boxes, then guess among the rest. */
export const plain = (N, k) => Math.min(1, (k + 1) / N);
export function sample(p, r) { let u = r(), i = 0; for (; i < p.length - 1; i++) { u -= p[i]; if (u < 0) break; } return i; }

/* Error correction, from the rough surface-code estimate in Fowler et al. 2012. */
export const THRESHOLD = 0.0057;
export const logicalError = (p, d) => Math.min(0.5, 0.03 * Math.pow(p / THRESHOLD, (d + 1) / 2));
export const physicalQubits = d => (2 * d - 1) ** 2;

/* ---------- challenges: one check per goal, by id ---------- */
export const BIG = 2 ** 20, BIG_STEPS = 804;
/* the best chance a search of about a million boxes reaches, trying every second step up to 804 */
export function bigBest(e) { let b = 0; for (let k = 0; k <= BIG_STEPS; k += 2) b = Math.max(b, noisy(chance(BIG, k), BIG, k, e)); return b; }
/* One look, no luck: the player looked, and the prize box was a sure find (chance above 99.5%) */
export const checkSearchFound = ({ looked, prize, pAt } = {}) => looked === prize && pAt > 0.995;
/* One step too many: with 8 boxes the player has seen the chance reach 94% or more, and later fall to 34% or less.
   seen: list of the prize chance (0..1) after each step count tried with N = 8, in any order. */
export const checkSearchStep = ({ N = 8, seen = [] } = {}) => N === 8 && seen.some(p => p >= 0.94) && seen.some(p => p <= 0.34);
/* Clean enough for a million: noise e per step, at least half the time */
export const checkSearchMillion = ({ e = 0 } = {}) => bigBest(e) >= 0.5;
/* Copies that fix mistakes: below the threshold, and a logical error of one in a million or better */
export const checkSearchCorrected = ({ p, d } = {}) => p < THRESHOLD && logicalError(p, d) <= 1e-6;
export const CHECKS = { 'search-found': checkSearchFound, 'search-step': checkSearchStep, 'search-million': checkSearchMillion, 'search-corrected': checkSearchCorrected };
export const checkOf = (id, state) => (CHECKS[id] ? !!CHECKS[id](state) : false);
