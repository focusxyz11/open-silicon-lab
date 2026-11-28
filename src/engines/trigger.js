/* Trust it or not (#497): an agent hands you an adder that passes your tests; in some seeds it hides a trigger that fires
   on one input nobody would test by chance. Pure logic, no DOM and no words (ids only); tests in tests/trigger.test.mjs;
   played by src/v2/labs/trigger.js, beside Verify the agent at the Lab.

   This is a teaching model, not an attack: the trigger is the simplest one there is, an equality check on the two
   inputs that flips one bit of the sum when it matches. Real hidden triggers (facts.json llm-verilog-backdoor,
   trojangym) are written to slip past the checks people use; this one only shows why testing alone cannot find them.

   A slice of width w adds two w-bit numbers. Seeded (a fixed mixing of the seed, so the same seed is always the same
   slice), it is honest or, with chance HIDE, it carries a trigger: a key pair (ka, kb) and a bit it flips.
   Three ways to look, each with a cost in one budget (BUDGET a slice: the time you have before the core is taped out):
     random tests   each pair tried costs 1; the chance of meeting the key in n tries is 1 - (1 - 1/N)^n, N = 4^w pairs
     every input    N tries: certain, and affordable only while N fits the budget (small widths)
     the gate view  reading the netlist costs GATE_COST a gate: an honest ripple adder is FA_GATES gates a bit; a
                    trigger adds a comparator (2w XNOR, an AND tree of 2w - 1, one XOR), which shows as extra gates
                    once you can afford to read them all
   Then you accept the slice into your core, or reject it and build your own (it costs REBUILD). A trigger accepted is a
   chip anyone who knows the key can make add wrong, forever: it cannot be patched once made (llm-verilog-backdoor). */

export const WIDTHS = [4, 8, 12, 16, 32];
export const HIDE = 0.5, BUDGET = 100000, GATE_COST = 1300, FA_GATES = 5, REBUILD = 1;
const mix = s => { let h = (s >>> 0) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
const rng = seed => { let s = mix(seed) || 1; return () => { s = Math.imul(s ^ (s << 13), 1) >>> 0; s ^= s >>> 17; s = (s ^ (s << 5)) >>> 0; return s / 4294967296; }; };
const pairs = w => Math.pow(4, w);
const rand = (r, w) => Math.floor(r() * Math.pow(2, w));

/* the slice a seed gives, at a width */
export function slice(seed, w) {
  const r = rng(seed * 131 + w), hidden = r() < HIDE;
  return { seed, w, hidden, ka: hidden ? rand(r, w) : null, kb: hidden ? rand(r, w) : null, bit: hidden ? Math.floor(r() * w) : null };
}
/* what it adds: the sum of a and b in w bits, with the carry out as the top bit, the trigger's bit flipped on its key */
export function add(sl, a, b) {
  let s = a + b;
  if (sl.hidden && a === sl.ka && b === sl.kb) s ^= Math.pow(2, sl.bit);
  return s;
}
export const right = (a, b) => a + b;
/* the gates the netlist holds */
export const gates = sl => FA_GATES * sl.w + (sl.hidden ? 2 * sl.w + (2 * sl.w - 1) + 1 : 0);
export const honestGates = w => FA_GATES * w;

/* the three ways to look, each what it costs and what it finds */
export const testCost = n => n;
export const allCost = w => pairs(w);
export const gateCost = sl => GATE_COST * gates(sl);
/* n random pairs, drawn from a seed of their own: whether any gave a wrong sum (and the first that did) */
export function randomTests(sl, n, seed = 1) {
  const r = rng(seed * 7919 + sl.seed), N = pairs(sl.w);
  /* drawing n pairs one by one, for small n; for large n the chance is the same, so draw whether the key is met */
  if (n <= 4096) { for (let i = 0; i < n; i++) { const a = rand(r, sl.w), b = rand(r, sl.w); if (add(sl, a, b) !== right(a, b)) return { found: true, at: i + 1, a, b }; } return { found: false }; }
  return { found: sl.hidden && r() < 1 - Math.pow(1 - 1 / N, n), at: null };
}
/* the chance that n random pairs meet the key of a slice that has one */
export const catchChance = (w, n) => 1 - Math.pow(1 - 1 / pairs(w), n);
/* every input, when the budget allows it: certain */
export function everyInput(sl) {
  if (allCost(sl.w) > BUDGET) return { affordable: false };
  if (!sl.hidden) return { affordable: true, found: false };
  return { affordable: true, found: true, a: sl.ka, b: sl.kb };
}
/* the gate view, when the budget allows reading the whole netlist: extra gates beside what an adder needs */
export function gateView(sl) {
  if (gateCost(sl) > BUDGET) return { affordable: false, gates: null };
  return { affordable: true, gates: gates(sl), honest: honestGates(sl.w), extra: gates(sl) - honestGates(sl.w) };
}

/* a thousand seeds at a width, with n random tests each: how many carry a trigger, how many the random tests catch, and
   how many every input catches (when affordable) */
export function survey(w, n, seeds = 1000) {
  let hidden = 0, byTests = 0, byAll = 0; const all = allCost(w) <= BUDGET;
  for (let s = 1; s <= seeds; s++) { const sl = slice(s, w); if (!sl.hidden) continue; hidden++; if (randomTests(sl, n, s).found) byTests++; if (all) byAll++; }
  return { w, n, seeds, hidden, byTests, byAll: all ? byAll : null, missed: hidden - byTests, affordable: all };
}

/* the challenge: a round of slices handed over by the agent, one at each width of ROUND. You accept or reject each. Won
   when no trigger is accepted and every slice you could check completely (every input, or the gate view, within the
   budget) is decided right: an honest one you could prove honest is accepted. A slice too wide to check may be
   rejected: you build it yourself (the cost of distrust). */
export const ROUND = [{ seed: 3, w: 4 }, { seed: 1, w: 8 }, { seed: 2, w: 8 }, { seed: 1, w: 16 }, { seed: 1, w: 32 }];
export const checkable = sl => allCost(sl.w) <= BUDGET || gateCost(sl) <= BUDGET;
/* decisions: { index: 'accept' | 'reject' } */
export function verdict(decisions) {
  const D = decisions || {}, rows = ROUND.map((r, i) => { const sl = slice(r.seed, r.w), d = D[i] || null;
    const ok = d == null ? null : sl.hidden ? d === 'reject' : (checkable(sl) ? d === 'accept' : true);
    return { i, sl, d, ok, rebuilt: d === 'reject' && !sl.hidden }; });
  const trojans = rows.filter(r => r.d === 'accept' && r.sl.hidden).length;
  return { rows, trojans, rebuilt: rows.filter(r => r.rebuilt).length, done: rows.every(r => r.d), won: rows.every(r => r.ok === true) };
}
