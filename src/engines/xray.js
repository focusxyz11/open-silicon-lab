/* Chip X-ray: reading a chip as a die photo shows it. Pure logic, no DOM; tests in tests/xray.test.mjs.

   From the earlier site's chip X-ray (src/engines/xray.js on the branch `before`), joined to the dives: the
   chip at the bottom of each dive (a data centre's AI chip, a phone's system-on-chip, a car's
   microcontroller) is seen as a photo of its die, every district with the texture it has under a
   microscope. What it teaches is real: memory looks like a perfectly regular grid, logic like fine noise,
   repeated cores like copies of one tile, circuits drawn by hand like a few large shapes; and where the
   area goes tells you what a chip is for. The floorplans are typical, in general terms, not any one
   product. The blocks themselves are drawn in src/app/scenes.js (xrayOf). Words: xray.type.<type>.t / .clue. */

/* the kinds of block a die photo shows, in the order they are named */
export const TYPES = ['core', 'gpu', 'npu', 'logic', 'cache', 'flash', 'phy', 'analog', 'io'];
/* the die in a chip scene's 1000 x 1000 space: the square inside its edge */
export const DIE = [40, 40, 920, 920];

const area = r => r[2] * r[3];
/* where the area goes: the share of the die each type of block takes; what no block covers is wiring,
   spacing and test structures (other) */
export function shares(blocks) {
  const s = {}; let used = 0;
  for (const b of blocks) { const a = area(b.r) / area(DIE); s[b.type] = (s[b.type] || 0) + a; used += a; }
  s.other = Math.max(0, 1 - used);
  return s;
}
/* the types to find on this die, biggest first */
export const askFor = blocks => { const s = shares(blocks); return Object.keys(s).filter(k => k !== 'other').sort((a, b) => s[b] - s[a]); };
/* the block under a point, or null (the last drawn is on top) */
export const hit = (blocks, x, y) => { for (let i = blocks.length - 1; i >= 0; i--) { const r = blocks[i].r; if (x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3]) return blocks[i]; } return null; };
/* the blocks as parts a visitor can tap, one part per type */
export const partsFor = blocks => { const P = {}; for (const b of blocks) (P[b.type] = P[b.type] || []).push({ r: b.r }); return P; };
/* memory of every kind: what fills a chip that waits on data */
export const MEMORY = ['cache', 'flash'];
export const memoryShare = blocks => { const s = shares(blocks); return MEMORY.reduce((a, k) => a + (s[k] || 0), 0); };
