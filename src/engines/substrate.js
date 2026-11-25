/* The Substrate engine, begun (docs/framework/shared.md, section 2): what any computer needs from its parts,
   whatever they are made of. Pure logic, no DOM; tests in tests/substrate.test.mjs.

   Its first piece is the oldest test of a switch: can a 1 survive being passed on? Every part adds a little
   noise. A part that only passes the signal on (no gain) lets the noise and its own small loss pile up, so after
   a few steps nobody can tell a 1 from a 0. A part with gain and a sharp threshold pushes a weak 1 back up to a
   full 1 at every step, so a chain of any length still ends in a clear answer. This is the property R. W. Keyes
   set out in "What makes a good computer device?" (Science, 1985): gain, a threshold, and an output that can
   drive the next part. It decides whether a material can compute in long chains, before speed or size do.

   It is a model of the principle, not of any material: the loss (a tenth per step), the steepness of the
   threshold and the noise are chosen to show it, and are named here. */

/* how much noise each step adds, at most, as a share of the full signal: a little, some, a lot */
export const NOISES = [0.05, 0.15, 0.3];
const LOSS = 0.1;          /* a part with no gain hands on nine tenths of what it gets */
const STEEP = 12;          /* how sharp a restoring part's threshold is */
/* what a level reads as: a clear 1 above HIGH, a clear 0 below LOW, and in between nobody can say */
export const HIGH = 0.7, LOW = 0.3;

/* the same noise every time, so a try can be repeated: a number in [-1, 1) for each step */
const wobble = i => { const s = Math.sin((i + 1) * 12.9898) * 43758.5453; return 2 * (s - Math.floor(s)) - 1; };
const clamp01 = v => Math.max(0, Math.min(1, v));
const restore = v => 1 / (1 + Math.exp(-STEEP * (v - 0.5)));

/* pass a 1 along a chain of parts. restoring: does each part have gain and a threshold? Returns the level after
   every step (the first is the 1 that went in) and what the end reads as. */
export function cascade({ restoring = true, noise = NOISES[1], stages = 10 } = {}) {
  const levels = [1];
  let v = 1;
  for (let i = 0; i < stages; i++) {
    const kept = restoring ? restore(v) : (1 - LOSS) * v;
    v = clamp01(kept + noise * wobble(i));
    levels.push(v);
  }
  return { levels, reads: v >= HIGH ? 'one' : v <= LOW ? 'zero' : 'unsure', end: v };
}

/* The second piece: what each step costs. A medium (src/data/media.js) is its curve (does a part restore the
   signal, or only pass it on?), its energy and time for one step from a source, and how it is set back for the
   next go. A lane is one medium doing the same job as every other: a 1 passed down a chain of parts. */
export const LENGTHS = [10, 100, 1000];
/* the cooling a superconducting loop needs, counted at the wall: watts drawn at room temperature for each watt
   taken out at 4 K. The range is from Holmes and DeBenedictis (IRDS, 2023); none counts the chip alone. */
export const COOLING = [1, 400, 10000];

/* a domino falling into the next, worked out from a named example: the energy is what standing it up stored
   (its centre of mass raised by half its height), the time is its spacing at the speed of a domino wave */
const DOMINO = { kg: 0.01, m: 0.05, gap: 0.02 };   /* an example domino: 10 g, 5 cm tall, 2 cm apart */
const WAVE = 0.75;                                  /* m/s, between Stronge's 0.65 and 0.86 */
export const G = 9.81;
export const dominoStep = (d = DOMINO, v = WAVE) => ({ e: d.kg * G * d.m / 2, t: d.gap / v });

/* one lane: the levels along the chain, what the end reads as, and the costs of one step and of the chain */
export function lane(m, { noise = NOISES[1], stages = 10, cooling = 1 } = {}) {
  const r = cascade({ restoring: m.curve === 'restore', noise, stages });
  const e = m.e == null ? null : m.e * (m.cold ? cooling : 1);
  return { id: m.id, ...r, eStep: e, tStep: m.t, eAll: e == null ? null : e * stages, tAll: m.t == null ? null : m.t * stages, reset: m.reset };
}
/* every lane, and the trade at a glance: of those that keep the 1, the fastest and the one that spends least */
export function lanes(media, opts) {
  const L = media.map(m => lane(m, opts)), kept = L.filter(l => l.reads === 'one');
  const rank = k => kept.filter(l => l[k] != null).sort((a, b) => a[k] - b[k]);
  /* within a tenth of each other counts as a tie: the figures are estimates, not that precise */
  const top = k => { const r = rank(k); return !r.length ? null : { a: r[0], tie: r[1] && r[1][k] <= r[0][k] * 1.1 ? r[1] : null }; };
  return { lanes: L, kept: kept.length, fastest: top('tStep'), cheapest: top('eStep') };
}
