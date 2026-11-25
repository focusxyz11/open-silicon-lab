/* The Tune engine (content/know.md): learning a thing you cannot open, by trying it. Pure logic, no DOM; tests in
   tests/tune.test.mjs.

   What it is not: a model of any real machine, recipe or factory. It is a model of learning by trying, built to be
   hard in the ways real processes are said to be hard: two dials that only work in the right combination (a narrow
   ridge running across them, so turning one dial at a time misses it), a second-best peak that can hold a searcher,
   a third dial nobody labelled that moves everything, noise on every run, a slow drift as the machine is used, and a
   twin of the same kind with small hidden differences. Every shape and number here is chosen, and named. Someone
   who has run a real process should read it; until then it is a draft (the document asks for that review).

   From the tries it computes how good a setting is, how many tries a search took, and how far a note carries: a
   note is a setting and how far its writer trusts it, handed to a simple search program that starts from it. */

/* the same chance every time, so a run can be repeated (mulberry32) */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const gauss = R => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = v => Math.max(0, Math.min(10, v));

export const RANGE = 10;          /* every dial turns from 0 to 10 */
export const NOISE = 3;           /* one run's result wanders by about this much, on a scale of 100 */
const DRIFT = 0.015;       /* how far the best setting moves for each run of the machine */
export const GOOD = 85;           /* a setting this good counts as found */
export const BUDGET = 60;         /* tries a search may make */

/* one machine of the kind; the twin has small hidden differences */
export function machine(twin = false) {
  return { cx: 6.2 + (twin ? 0.9 : 0), cy: 3.8 + (twin ? -0.7 : 0), z0: 6.5 + (twin ? -1.4 : 0), angle: 0.62, wide: 2.6, narrow: 0.6,
    side: { x: 2.4, y: 7.2, h: 62, r: 1.5 }, drift: [0.8, 0.6], twin };
}
/* the true result at a setting, for a machine that has run `age` times: what the noise hides */
export function truth(M, x, y, z, age = 0) {
  const cx = M.cx + 0.35 * (z - 5) + M.drift[0] * DRIFT * age, cy = M.cy - 0.25 * (z - 5) + M.drift[1] * DRIFT * age;
  const u = x - cx, v = y - cy, c = Math.cos(M.angle), s = Math.sin(M.angle), a = u * c + v * s, b = -u * s + v * c;
  const peak = 100 * Math.exp(-((z - M.z0) ** 2) / (2 * 2.2 * 2.2));
  const ridge = peak * Math.exp(-(a * a) / (2 * M.wide * M.wide) - (b * b) / (2 * M.narrow * M.narrow));
  const side = M.side.h * Math.exp(-((x - M.side.x) ** 2 + (y - M.side.y) ** 2) / (2 * M.side.r * M.side.r));
  return Math.max(ridge, side, 2 + 3 * Math.exp(-((x - 5) ** 2 + (y - 5) ** 2) / 40));
}
/* one run: the truth, plus the noise of this run */
export function run(M, x, y, z, age, R) {
  return Math.max(0, Math.min(100, truth(M, x, y, z, age) + NOISE * gauss(R)));
}

/* a simple search program: start somewhere, try a step in a random direction, keep it if the result was better,
   take bigger steps after a success and smaller after a failure. It sees only noisy results, as you do. */
export function search(M, { start = null, trust = null, budget = BUDGET, seed = 1, age = 0 } = {}) {
  const R = rng(seed);
  let best = start ? start.slice() : [R() * RANGE, R() * RANGE, R() * RANGE], step = trust != null ? Math.max(0.3, trust) : 3;
  const tries = [];
  let bestQ = run(M, best[0], best[1], best[2], age, R);
  tries.push({ p: best.slice(), q: bestQ, t: truth(M, best[0], best[1], best[2], age) });
  let found = tries[0].t >= GOOD ? 1 : null;
  for (let i = 1; i < budget; i++) {
    const p = best.map(v => clamp(v + step * gauss(R)));
    const q = run(M, p[0], p[1], p[2], age + i, R), tq = truth(M, p[0], p[1], p[2], age + i);
    tries.push({ p, q, t: tq });
    if (found == null && tq >= GOOD) found = i + 1;
    if (q > bestQ) { best = p; bestQ = q; step = Math.min(4, step * 1.5); } else step = Math.max(0.15, step * 0.85);
  }
  return { tries, found, best, bestTrue: truth(M, best[0], best[1], best[2], age + budget) };
}
/* how a note carries: the program many times from nothing, from the note on this machine, and from the note on
   the twin. For each, the median tries to reach a good setting (null when fewer than half got there) and the share
   that got there at all. */
export const RUNS = 24;
export function handover(note, { age = 0 } = {}) {
  const stat = (M, from, a) => {
    const f = []; for (let s = 1; s <= RUNS; s++) f.push(search(M, { ...from, seed: s * 31 + 7, age: a }).found);
    const got = f.filter(x => x != null).sort((x, y) => x - y);
    return { median: got.length >= RUNS / 2 ? got[Math.floor((RUNS - 1) / 2)] ?? got[got.length - 1] : null, share: got.length / RUNS, one: search(M, { ...from, seed: 7, age: a }) };
  };
  const here = machine(false), twin = machine(true), from = note ? { start: note.p, trust: note.trust } : {};
  return { cold: stat(here, {}, age), note: note ? stat(here, from, age) : null, twin: note ? stat(twin, from, 0) : null };
}
