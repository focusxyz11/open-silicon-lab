/* Small shared pieces of the chip-making step models (fabsteps.js and the files it gathers): a seeded random
   generator that can be stopped and resumed, a normal draw, a clamp, and how a challenge reads what a player has seen.
   Pure, no DOM, no English. The generator is the one the first version's labs used (the branch 'before'), so a seed
   gives the same numbers there and here. */

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* rng(seed) gives a function that returns numbers in [0, 1); rng.state() reads where it stands, so a step can end and
   the next one go on from the same place: rng(r.state()) continues the sequence. */
export function rng(seed) {
  let s = seed | 0;
  const f = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.state = () => s;
  return f;
}

/* one draw from the normal distribution (Box-Muller), using the generator r */
export function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }

/* A challenge is { id, lab, groups: [fn, ...] }. Each fn takes one result the lab reported and says whether it is the
   kind the challenge asks for; the challenge is met when every group has been matched by something the player saw
   (not necessarily the same result, not necessarily in order), so a challenge that asks to compare two settings has
   two groups. seen is the list of results the lab reported. */
export const metBy = (ch, seen) => ch.groups.every(g => seen.some(g));
