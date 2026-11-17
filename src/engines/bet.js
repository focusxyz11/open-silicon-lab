/* The bets, as engines (the questions: src/data/questions.js; the player: src/v2/play.js, kind 'bet').
   A bet is where three primitives pull at once: push one, and the other two move. Its challenge gives two dials
   and asks for a place among them that no single dial reaches.

   Moore's bet (the question 'cheaper', Gordon Moore, 1965): put more parts on one chip and each part gets cheaper,
   until the chip is so big that specks of dust kill most copies, and each part gets dearer again. Matter (how big
   a chip is), chance (where the specks land) and cost meet. A cleaner line kills fewer chips but costs more per
   wafer, and as the line gets cleaner the size where each part is cheapest grows: the bet behind Moore's law.

   The model is the picture itself, not a formula over it: square chips are laid on a 300 mm wafer (a ring at the
   edge is lost), the same specks fall on every layout (fewer of them on a cleaner line, the rest stay where they
   were), and a chip with any speck on it is dead. What a part costs is a wafer's cost over the parts on the chips
   that work. Simple on purpose: every number on the screen can be counted on the wafer. */

export const WAFER = { r: 150, edge: 3 };            // mm: a 300 mm wafer, and the ring at its edge no chip uses
export const SIZES = [1, 2, 4, 8, 16, 32, 64, 128, 256]; // parts on one chip, in millions
export const CLEAN = [1, 0.5, 0.25, 0.1, 0.05];      // specks per square centimetre, from a dusty line to a clean one
const AREA_FIXED = 10, AREA_PER = 2;                   // mm² for the pads and edges of a chip, and per million parts
/* what a wafer costs on each line, against the dustiest: cleaner air, filters and checks cost money */
export const waferCost = d => (0.6 + 0.08 / d) / (0.6 + 0.08 / CLEAN[0]);
export const chipSide = n => Math.sqrt(AREA_FIXED + AREA_PER * n);

/* the specks: one fixed scatter, the dustiest line's; a cleaner line keeps the first ones only */
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const WAFER_CM2 = Math.PI * WAFER.r * WAFER.r / 100;
export const SPECKS = (() => {
  const r = rng(7), n = Math.round(CLEAN[0] * WAFER_CM2), out = [];
  while (out.length < n) { const x = (r() * 2 - 1) * WAFER.r, y = (r() * 2 - 1) * WAFER.r; if (x * x + y * y < WAFER.r * WAFER.r) out.push([x, y]); }
  return out;
})();
export const specksOf = d => SPECKS.slice(0, Math.round(d * WAFER_CM2));

/* the chips of one size on the wafer: grid cells [i, j] whose four corners lie inside the usable disc */
export function layout(n) {
  const s = chipSide(n), lim = WAFER.r - WAFER.edge, k = Math.ceil(WAFER.r / s) + 1, cells = [];
  for (let i = -k; i < k; i++) for (let j = -k; j < k; j++) {
    const far = Math.max(Math.hypot(i * s, j * s), Math.hypot((i + 1) * s, j * s), Math.hypot(i * s, (j + 1) * s), Math.hypot((i + 1) * s, (j + 1) * s));
    if (far <= lim) cells.push([i, j]);
  }
  return { s, cells };
}

/* one setting: size and clean are indices into SIZES and CLEAN */
const CACHE = new Map();
export function moore(size, clean) {
  const key = size + ':' + clean; if (CACHE.has(key)) return CACHE.get(key);
  const n = SIZES[size], d = CLEAN[clean], L = layout(n), dead = new Set();
  for (const [x, y] of specksOf(d)) dead.add(Math.floor(x / L.s) + ',' + Math.floor(y / L.s));
  const alive = L.cells.map(([i, j]) => !dead.has(i + ',' + j)), good = alive.filter(Boolean).length, wc = waferCost(d);
  const R = { n, d, s: L.s, cells: L.cells, alive, chips: L.cells.length, good, wafer: wc, cost: good ? wc / good / n : Infinity };
  CACHE.set(key, R); return R;
}
/* the cheapest part anyone can make here, over every size and every line: what costs are measured against */
export const BEST = Math.min(...CLEAN.flatMap((_, c) => SIZES.map((_, s) => moore(s, c).cost)));
export const rel = (size, clean) => moore(size, clean).cost / BEST;
/* on one line, what each part costs at every size, and the size where it is cheapest */
export const curve = clean => SIZES.map((_, s) => rel(s, clean));
export const cheapest = clean => { const c = curve(clean); return c.indexOf(Math.min(...c)); };

/* the challenge: a big chip, each part close to the cheapest. No single dial gets there: the biggest chip on a
   dusty line is mostly dead, the cleanest line is too dear per wafer. */
export const GOAL = { minParts: 64, maxRel: 1.25 };
export const START = { size: 2, clean: 0, guess: null };
export function check(b) {
  const r = rel(b.size, b.clean);
  return { big: SIZES[b.size] >= GOAL.minParts, close: r <= GOAL.maxRel, rel: r, ok: SIZES[b.size] >= GOAL.minParts && r <= GOAL.maxRel };
}
export function normalBet(b) {
  const o = Object.assign({}, START, b || {}), i = (v, L) => Number.isInteger(v) && v >= 0 && v < L.length;
  return { size: i(o.size, SIZES) ? o.size : START.size, clean: i(o.clean, CLEAN) ? o.clean : START.clean, guess: i(o.guess, SIZES) ? o.guess : null };
}
