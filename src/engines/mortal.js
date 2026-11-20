/* Brain or copy (the core question "Brain or copy", home.q.copy): a small network that reads a sensor and answers,
   built on a chip where its numbers (weights) are kept either as bits, exact and copyable but costly to move, or as
   the physical state of analog cells (a conductance), far cheaper to compute with but never the same twice: each
   cell differs a little from what was written, and differently on every chip. Three choices:
   - how much of the network is analog (share, 0 to 1);
   - where it learns: in software, then written onto the chip (copyable, but blind to this chip's quirks), or on the
     chip itself (it learns around its own cells' quirks, like a brain, and so the result fits only this chip);
   - whether each copy relearns a little on its own chip before it starts (calibration: time on every chip).
   The goal: a network many times cheaper than all-digital that can still be copied to a fleet and work. Hinton calls
   the analog side "mortal computation": knowledge that dies with its hardware. A model with round numbers. */

/* energy of one answer, all-digital = 1: analog cells compute for about a twelfth, and need converters at the edges */
export const ENERGY = { digital: 1, analog: 0.08, convert: 0.05 };
/* how far each analog cell sits from what was meant (its spread), and the accuracy of the network kept exactly */
export const SPREAD = 0.1, EXACT = 98;
/* how hard noise of a given size hurts: written from software (blind to the chip), learned on the chip (it learns
   around the quirks it has, so only what is left over hurts), and moved to another chip (two chips' quirks apart) */
const HURT = { written: 1000, learned: 120, moved: 2000, calibrated: 180 };
/* minutes of relearning per chip, for the whole network analog */
export const CALIBRATE_MIN = 12;
export const GOAL = { energy: 0.3, own: 95, copied: 90 };
export const SHARES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

const acc = loss => Math.max(50, Math.round((EXACT - loss) * 10) / 10);
/* o: { share, learn: 'software' | 'chip', calibrate: bool } */
export function evaluate(o) {
  const f = o.share, n2 = (f * SPREAD) ** 2;
  const energy = (1 - f) * ENERGY.digital + f * (ENERGY.analog + ENERGY.convert);
  const own = o.learn === 'chip' ? acc(HURT.learned * n2) : acc(HURT.written * n2);
  /* weights learned in software do not depend on any one chip: a copy is as good as the first. Weights learned on a
     chip carry its quirks: on another chip they miss by both chips' quirks. Calibration relearns on each copy */
  let copied = o.learn === 'chip' ? acc(HURT.moved * n2) : own;
  if (o.calibrate) copied = Math.max(copied, acc(HURT.calibrated * n2));
  const ownBest = o.calibrate ? Math.max(own, acc(HURT.calibrated * n2)) : own;
  const minutes = o.calibrate ? Math.round(CALIBRATE_MIN * f * 10) / 10 : 0;
  const met = energy <= GOAL.energy + 1e-9 && ownBest >= GOAL.own && copied >= GOAL.copied;
  return { energy, own: ownBest, copied, minutes, met };
}
export const start = () => ({ share: 0, learn: 'software', calibrate: false });

/* a fleet of copies, each chip's accuracy spread a little around the copied mean (some chips' quirks are kinder) */
export function fleet(o, n, rnd) {
  const r = evaluate(o), s = o.share * (o.learn === 'chip' && !o.calibrate ? 6 : 1.5);
  return Array.from({ length: n }, () => { const g = (rnd() + rnd() + rnd() - 1.5) * 2; return Math.max(50, Math.min(EXACT, r.copied + g * s)); });
}
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
