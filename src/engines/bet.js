/* The bets, as engines (the questions: src/data/questions.js; the player: src/v2/play.js, kind 'bet').
   A bet is where three primitives pull at once: push one, and the other two move. Its challenge gives two dials
   and asks for a place among them that no single dial reaches. Each bet here has a guess (asked before you look),
   a starting place, a check, and normalBetOf(id, saved) to read back what you left.

   Moore's bet (the question 'cheaper', Gordon Moore, 1965): put more parts on one chip and each part gets cheaper,
   until the chip is so big that specks of dust kill most copies, and each part gets dearer again. Matter (how big
   a chip is), chance (where the specks land) and cost meet. A cleaner line kills fewer chips but costs more per
   wafer, and as the line gets cleaner the size where each part is cheapest grows: the bet behind Moore's law.

   The model is the picture itself, not a formula over it: square chips are laid on a 300 mm wafer (a ring at the
   edge is lost), the same specks fall on every layout (fewer of them on a cleaner line, the rest stay where they
   were), and a chip with any speck on it is dead. What a part costs is a wafer's cost over the parts on the chips
   that work. Simple on purpose: every number on the screen can be counted on the wafer. */

import { roofline } from './aichip.js';

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
export const layout = n => layoutSide(chipSide(n));
export function layoutSide(s) {
  const lim = WAFER.r - WAFER.edge, k = Math.ceil(WAFER.r / s) + 1, cells = [];
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

/* ---- Cray's bet (the question 'oxen', Seymour Cray): two strong oxen or a thousand chickens? One strong core, or
   many simple ones? Information (how much of a job can be split), time (how fast it finishes) and cost (how much
   chip you spend) meet. The model is Hill and Marty's (Amdahl's law in the multicore era, IEEE Computer, 2008): a
   chip is made of units, each the size of one small core; a strong core of r units runs one step at a time
   sqrt(r) times as fast as a small one (Pollack's rule); the part of a job that cannot be split runs on the strong
   core alone, the rest on every core at once. Two jobs: an everyday app (half of it can be split) and training an
   AI (999 steps in 1000 can). One chip has to serve both. ---- */
export const OX = [1, 2, 4, 8, 16, 32, 64, 128, 256];       // units in the strong core (1 is just another chicken)
export const HENS = [0, 32, 64, 96, 128, 160, 192, 224, 256]; // small cores beside it
export const JOBS = { app: 0.5, ai: 0.999 };                  // the share of each job that can be split
export const BUDGET = 256;                                    // units a chip may spend
export const GUESSES = ['ox', 'hens', 'both'];
export const oxSpeed = (f, r, m) => 1 / ((1 - f) / Math.sqrt(r) + f / (Math.sqrt(r) + m));
export function oxen(ox, hens) {
  const r = OX[ox], m = HENS[hens];
  return { r, m, size: r + m, app: oxSpeed(JOBS.app, r, m), ai: oxSpeed(JOBS.ai, r, m) };
}
export const OX_GOAL = { app: 10, ai: 150, size: BUDGET };
export const OX_START = { ox: OX.length - 1, hens: 0, guess: null };
export function checkOxen(b) {
  const M = oxen(b.ox, b.hens), app = M.app >= OX_GOAL.app, ai = M.ai >= OX_GOAL.ai, size = M.size <= OX_GOAL.size;
  return { M, app, ai, size, ok: app && ai && size };
}
export function normalOxen(b) {
  const o = Object.assign({}, OX_START, b || {}), i = (v, L) => Number.isInteger(v) && v >= 0 && v < L.length;
  return { ox: i(o.ox, OX) ? o.ox : OX_START.ox, hens: i(o.hens, HENS) ? o.hens : OX_START.hens, guess: i(o.guess, GUESSES) ? o.guess : null };
}
/* where a chip of r strong units and m small cores puts them, on a grid 16 units wide: the strong core a block at
   the top left, the small cores filling the rest row by row */
export function floorplan(r, m) {
  const W = 16, w = Math.min(W, 2 ** Math.ceil(Math.log2(r) / 2)), h = r / w, used = new Set(), hens = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) used.add(x + ',' + y);
  for (let k = 0; hens.length < m; k++) { const x = k % W, y = Math.floor(k / W); if (!used.has(x + ',' + y)) hens.push([x, y]); }
  const rows = Math.max(h, ...hens.map(([, y]) => y + 1), 1);
  return { W, rows, ox: r > 1 ? { x: 0, y: 0, w, h } : null, hens: r > 1 ? hens : [[0, 0], ...hens], budgetRows: BUDGET / W };
}

/* ---- The pieces' bet (the question 'onebad'): why can one bad piece throw away four good ones? A big chip can be
   made as one piece, or split into pieces joined in one package (chiplets). Smaller pieces each come out good more
   often, but a package works only if every piece in it is good, so without a test first nothing is won: one bad
   piece wastes the good ones beside it. Test each piece before joining (known good die) and the bad ones are left
   out, but testing costs, and every piece needs a link to the others and a place in the package. Matter (how many
   pieces), chance (which are good, which a test catches) and cost meet.
   Counted, like Moore's bet: the same 300 mm wafer and the same specks (the middle line, 0.25 per cm²), cut into
   pieces; the pieces are tested, then joined in packages in the order they come off the wafer; a package works if
   every piece in it is good and every join holds. What a working chip costs is everything spent over the packages
   that work. Costs are in wafers: one wafer is 100. ---- */
export const LOGIC = 600;                              // mm² of logic in the whole chip
export const LINK = 6;                                 // mm² each piece spends on links to the others
export const PIECES = [1, 2, 4, 8, 16];
export const TESTS = ['none', 'quick', 'careful', 'thorough'];
export const CATCH = [0, 0.9, 0.99, 0.999];            // the share of bad pieces each test catches
export const TEST_COST = [0, 0.03, 0.08, 0.3];         // what testing one piece costs
export const JOIN = 0.99;                              // the chance one more piece joins well
export const assembly = k => 0.15 + 0.1 * k;           // what putting k pieces in one package costs
const PIECE_LINE = 2;                                  // the line the pieces are made on: CLEAN[2]
/* a fixed, even spread in [0, 1) for the i-th thing: which bad pieces a test misses, which joins fail */
const spread = (i, seed) => ((i + 1) * 0.6180339887 + seed) % 1;
const PCACHE = new Map();
export function pieces(ki, ti) {
  const key = ki + ':' + ti; if (PCACHE.has(key)) return PCACHE.get(key);
  const k = PIECES[ki], area = LOGIC / k + (k > 1 ? LINK : 0), s = Math.sqrt(area), cells = layoutSide(s).cells, dead = new Set();
  for (const [x, y] of specksOf(CLEAN[PIECE_LINE])) dead.add(Math.floor(x / s) + ',' + Math.floor(y / s));
  /* each piece: good, caught by the test (left out), or bad and missed (joined anyway) */
  let bad = 0; const state = cells.map(([i, j]) => dead.has(i + ',' + j) ? (spread(bad++, 0.13) < CATCH[ti] ? 'caught' : 'missed') : 'good');
  const passed = state.map((st, i) => st === 'caught' ? -1 : i).filter(i => i >= 0), packs = [];
  for (let p = 0; (p + 1) * k <= passed.length; p++) {
    const ids = passed.slice(p * k, (p + 1) * k), joins = k === 1 || spread(p, 0.71) < JOIN ** (k - 1);
    packs.push({ ids, ok: joins && ids.every(i => state[i] === 'good'), joins });
  }
  const working = packs.filter(q => q.ok).length;
  const spent = 100 + cells.length * TEST_COST[ti] + packs.length * assembly(k);
  const R = { k, s, cells, state, packs, working, good: state.filter(x => x === 'good').length, cost: working ? spent / working : Infinity, share: packs.length ? working / packs.length : 0 };
  PCACHE.set(key, R); return R;
}
/* against one big piece, untested: what everyone starts from */
export const piecesRel = (ki, ti) => pieces(ki, ti).cost / pieces(0, 0).cost;
export const PIECES_GOAL = { maxRel: 0.5, minShare: 0.9 };
export const PIECES_START = { k: 0, test: 0, guess: null };
export const PIECE_GUESSES = ['cheaper', 'same', 'dearer'];
/* the guess: four pieces, untested, against one; what the wafer says */
export function piecesAnswer() { const r = piecesRel(2, 0); return r < 0.7 ? 'cheaper' : r <= 1.3 ? 'same' : 'dearer'; }
export function checkPieces(b) {
  const P = pieces(b.k, b.test), rel = P.cost / pieces(0, 0).cost, cheap = rel <= PIECES_GOAL.maxRel, works = P.share >= PIECES_GOAL.minShare;
  return { P, rel, cheap, works, ok: cheap && works };
}
export function normalPieces(b) {
  const o = Object.assign({}, PIECES_START, b || {}), i = (v, L) => Number.isInteger(v) && v >= 0 && v < L.length;
  return { k: i(o.k, PIECES) ? o.k : PIECES_START.k, test: i(o.test, TESTS) ? o.test : PIECES_START.test, guess: i(o.guess, PIECE_GUESSES) ? o.guess : null };
}

/* ---- The proof's bet (the question 'prove'): test it, or prove it? A chip's design is checked before it is made.
   Random tests are cheap each, but a bug that shows once in ten billion inputs needs tens of billions of them;
   that is how the Pentium's division bug slipped through in 1994. A proof by machine (formal verification) covers
   every input of a block at once, but costs far more, and most for blocks full of control and memory, where the
   cases multiply. Information (what is checked), chance (which bug a test happens to hit) and cost meet.
   A chip of eight blocks, each hiding one bug that a random test hits with chance p (from once in a thousand to
   once in ten billion). After T tests a bug is still hidden with chance exp(-T p), unless its block is proved. ---- */
export const PBLOCKS = [
  { id: 'fetch', p: 1e-3, proof: 4 }, { id: 'decode', p: 1e-4, proof: 6 }, { id: 'regs', p: 1e-5, proof: 3 }, { id: 'cache', p: 1e-6, proof: 25 },
  { id: 'branch', p: 1e-7, proof: 20 }, { id: 'adder', p: 1e-8, proof: 2 }, { id: 'mul', p: 1e-9, proof: 3 }, { id: 'div', p: 1e-10, proof: 4 }
];
export const PTESTS = [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10];
export const testCost = T => T / 1e8;                       // in the same units as a proof
export const PROVE_GOAL = { maxEscape: 0.01, maxCost: 20 };
export const PROVE_START = { tests: 3, proved: 0, guess: null };
export const PROVE_GUESSES = ['tests', 'proof', 'either'];
export const PROVE_ANSWER = 'proof';                         // a billion tests against a bug of one in ten billion
export const isProved = (b, i) => ((b.proved >> i) & 1) === 1;
/* one setting: each block's chance its bug is still hidden, the chance that any bug ships, what it all cost */
export function proofs(b) {
  const T = PTESTS[b.tests], blocks = PBLOCKS.map((B, i) => ({ ...B, proved: isProved(b, i), hidden: isProved(b, i) ? 0 : Math.exp(-T * B.p) }));
  const escape = 1 - blocks.reduce((a, B) => a * (1 - B.hidden), 1);
  const cost = testCost(T) + blocks.reduce((a, B) => a + (B.proved ? B.proof : 0), 0);
  return { T, blocks, escape, cost };
}
export function checkProve(b) {
  const R = proofs(b), safe = R.escape <= PROVE_GOAL.maxEscape, cheap = R.cost <= PROVE_GOAL.maxCost;
  return { R, safe, cheap, ok: safe && cheap };
}
export function normalProve(b) {
  const o = Object.assign({}, PROVE_START, b || {});
  return { tests: Number.isInteger(o.tests) && o.tests >= 0 && o.tests < PTESTS.length ? o.tests : PROVE_START.tests,
    proved: Number.isInteger(o.proved) && o.proved >= 0 && o.proved < 1 << PBLOCKS.length ? o.proved : 0,
    guess: Number.isInteger(o.guess) && o.guess >= 0 && o.guess < PROVE_GUESSES.length ? o.guess : null };
}

/* ---- Jevons' bet (the question 'jevons', William Stanley Jevons, The Coal Question, 1865): when each answer takes
   less energy, why does the world use more? Jevons saw that better steam engines made coal cheaper to use, so
   Britain found more uses for it and burned more coal, not less. Energy (what each answer draws), cost (what an
   answer is sold for) and people and machines (how much the world asks when the price falls) meet.
   A model, not a forecast. Today's answers, their energy and their price are 1. Power is a small part of an
   answer's price; the chip is most of it, and a chip that needs half the energy per answer also answers twice as
   fast, so the price of an answer falls with its energy. The world answers the price: every time it halves, it asks
   2^1.5, nearly three times as much (an elasticity of 1.5; nobody knows the real one for AI, and Jevons needs it
   above 1). So a price on power barely moves the asking; what holds the energy is how much power the island can
   connect (a grid's limit, a moratorium on new data centres): answers past it are not served. ---- */
export const EFF = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 16, 1 / 32]; // energy per answer, against today's: each step a better chip
export const CAP = [0.6, 0.8, 1, 1.5, 2, 4, Infinity];      // the power the island can connect, against what today's answers draw
export const ASK = 1.5;                                      // how strongly the world asks more as the price falls
export const TURBINES = 13;                                  // the island's turbines: what today's answers draw
export function jevons(ei, ci) {
  const e = EFF[ei], cap = CAP[ci], asked = e ** -ASK, answers = Math.min(asked, cap / e), energy = answers * e;
  return { e, cap, asked, answers, energy, turbines: energy * TURBINES, waiting: asked - answers };
}
export const J_GOAL = { minAnswers: 8, maxEnergy: 0.9 };
export const J_START = { eff: 0, cap: CAP.length - 1, guess: null };
export const J_GUESSES = ['less', 'same', 'more'];
/* the guess: chips eight times as efficient, no limit on the island's power; what the model says */
export function jevonsAnswer() { const E = jevons(3, CAP.length - 1).energy; return E < 0.8 ? 'less' : E <= 1.25 ? 'same' : 'more'; }
export function checkJevons(b) {
  const J = jevons(b.eff, b.cap), many = J.answers >= J_GOAL.minAnswers, held = J.energy <= J_GOAL.maxEnergy;
  return { J, many, held, ok: many && held };
}
export function normalJevons(b) {
  const o = Object.assign({}, J_START, b || {}), i = (v, L) => Number.isInteger(v) && v >= 0 && v < L.length;
  return { eff: i(o.eff, EFF) ? o.eff : J_START.eff, cap: i(o.cap, CAP) ? o.cap : J_START.cap, guess: i(o.guess, J_GUESSES) ? o.guess : null };
}

/* ---- The batch bet (the question 'batch'): fast for one person, or busy for many? An AI chip answering one person
   reads every weight of the model from memory for each word it writes, and does only two sums per weight, so it
   waits on memory and its arithmetic sits nearly idle (the memory wall, Wulf and McKee, 1995). Serving many people
   at once shares each read among them: the chip gets busier and each answer cheaper, until the arithmetic is full and
   every person waits on everyone else. Fewer bits per number make each read smaller and each sum faster. Information
   (the weights to read), time (each person's speed) and cost (how busy the chip is) meet. The model is the roofline
   of src/engines/aichip.js (from the first version of the site): a 70-billion-weight model on one 2026 accelerator.
   Simple on purpose: it leaves out the memory each conversation's notes take (the KV cache), which in practice
   limits how many fit at once. ---- */
export const BATCH = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]; // people served at once
export const BFORMATS = ['fp16', 'fp8', 'fp4'];                                       // bits per number: 16, 8, 4
export const BATCH_MODEL = { chip: 'rubin', params: 70 };
export const BATCH_GOAL = { minSpeed: 200, minBusy: 0.8 };
export const BATCH_START = { batch: 0, format: 0, guess: null };
export const BATCH_GUESSES = ['most', 'some', 'tiny'];
export function batched(bi, fi) { const R = roofline(BATCH_MODEL.chip, BATCH_MODEL.params, BFORMATS[fi], BATCH[bi]); return { ...R, people: BATCH[bi], format: BFORMATS[fi] }; }
/* the guess: one person, 16-bit numbers; what share of the arithmetic works */
export function batchAnswer() { const u = batched(0, 0).utilization; return u > 0.5 ? 'most' : u > 0.05 ? 'some' : 'tiny'; }
export function checkBatch(b) {
  const R = batched(b.batch, b.format), fast = R.tokPerUser >= BATCH_GOAL.minSpeed, busy = R.utilization >= BATCH_GOAL.minBusy;
  return { R, fast, busy, ok: fast && busy };
}
export function normalBatch(b) {
  const o = Object.assign({}, BATCH_START, b || {}), i = (v, L) => Number.isInteger(v) && v >= 0 && v < L.length;
  return { batch: i(o.batch, BATCH) ? o.batch : BATCH_START.batch, format: i(o.format, BFORMATS) ? o.format : BATCH_START.format, guess: i(o.guess, BATCH_GUESSES) ? o.guess : null };
}

/* every bet, by its question */
export function normalBetOf(id, b) { return id === 'oxen' ? normalOxen(b) : id === 'onebad' ? normalPieces(b) : id === 'prove' ? normalProve(b) : id === 'jevons' ? normalJevons(b) : id === 'batch' ? normalBatch(b) : normalBet(b); }
