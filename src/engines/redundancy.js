/* A reliable whole from unreliable parts (the core question "Whole beats parts", home.q.vn), von Neumann's problem of
   1956: six blocks of a small chip, each failing now and then (big blocks, with more switches, more often). Any block
   can be built once, three times or five times, with a voter that takes the majority answer. A vote outlasts any one
   bad copy, but the copies cost area, and the voter is a part too: it can fail, so voting a block that already rarely
   fails makes it worse. The goal: the whole chip fails less often than its worst part alone, within an area budget.
   A model with round numbers, not industry figures. */

/* the blocks: area (units of the chip's floor) and the chance that one copy gives a wrong answer in a run */
export const BLOCKS = [
  { id: 'mul', area: 3, p: 0.06 },
  { id: 'mem', area: 4, p: 0.04 },
  { id: 'add', area: 2, p: 0.02 },
  { id: 'dec', area: 1, p: 0.01 },
  { id: 'reg', area: 1, p: 0.004 },
  { id: 'ctl', area: 1, p: 0.002 }
];
export const COPIES = [1, 3, 5];
/* the voter: its own area and its own chance of a wrong answer */
const VOTER = { area: 0.5, p: 0.003 };
/* the goal: the whole chip right at least this often, on no more than this floor */
export const GOAL = { whole: 0.95, area: 32 };

const choose = (n, k) => { let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return c; };
/* the chance a block built of n copies gives the right answer: a majority of its copies right, and its voter right */
export function blockOk(p, n) {
  const r = 1 - p;
  if (n === 1) return r;
  let ok = 0;
  for (let k = Math.ceil((n + 1) / 2); k <= n; k++) ok += choose(n, k) * r ** k * p ** (n - k);
  return ok * (1 - VOTER.p);
}
const blockArea = (a, n) => (n === 1 ? a : n * a + VOTER.area);

/* a plan: copies per block id. The whole works only when every block does */
export function evaluate(plan) {
  const rows = BLOCKS.map(b => { const n = plan[b.id] || 1, ok = blockOk(b.p, n), bare = 1 - b.p;
    return { id: b.id, n, ok, area: blockArea(b.area, n), bare, worse: n > 1 && ok < bare }; });
  const whole = rows.reduce((m, r) => m * r.ok, 1), area = rows.reduce((s, r) => s + r.area, 0);
  const worst = Math.min(...BLOCKS.map(b => 1 - b.p));
  return { rows, whole, area, worst, met: whole >= GOAL.whole && area <= GOAL.area + 1e-9, beats: whole > worst };
}
export const startPlan = () => Object.fromEntries(BLOCKS.map(b => [b.id, 1]));

/* one chip run for real: each copy right or wrong at random, the vote taken, the whole right or wrong. rnd() in [0, 1) */
export function trial(plan, rnd) {
  const blocks = BLOCKS.map(b => {
    const n = plan[b.id] || 1, copies = Array.from({ length: n }, () => rnd() >= b.p), good = copies.filter(Boolean).length;
    const voterOk = n === 1 || rnd() >= VOTER.p, ok = n === 1 ? copies[0] : voterOk && good > n / 2;
    return { id: b.id, copies, voterOk, ok };
  });
  return { blocks, ok: blocks.every(b => b.ok) };
}
/* a small seeded random source, so runs can be replayed */
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
