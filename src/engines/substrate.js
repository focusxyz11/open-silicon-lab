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
export const LOSS = 0.1;          /* a part with no gain hands on nine tenths of what it gets */
export const STEEP = 12;          /* how sharp a restoring part's threshold is */
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
