/* What the lab arch grows on the island (src/data/labs/arch.js), drawn by src/v2/map3d.js when its challenges are won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, glow, box } from '../kit3d.js';

/* a small new chip: a die on a plinth, its tiles dark but for the ones lit */
function chip(g, { P, night, pulses }, x, z, lit) {
  box(g, 2.2, 0.35, 2.2, mat(P.wall), x, 0, z, 0.1);
  box(g, 1.7, 0.16, 1.7, mat(P.dark), x, 0.35, z, 0.05);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const on = lit.includes(i * 3 + j), c = box(g, 0.42, on ? 0.16 : 0.06, 0.42, on ? glow(P.accent, night ? 1.4 : 0.75) : mat(P.wall), x - 0.5 + i * 0.5, 0.51, z - 0.5 + j * 0.5, 0.03, { cast: false });
    if (on) pulses.push(c);
  }
}
export default {
  'lab-grow': { at: [-3, 12], grow: (g, I) => chip(g, I, 0, 0, [4]) },
  'lab-spread': { at: [-11, 18], grow: (g, I) => { chip(g, I, -2.6, 0, [1, 4]); chip(g, I, 0.4, 1.6, [3, 4, 5]); chip(g, I, 2.6, -1.2, [4, 7]);
    for (const [a, b, c, d] of [[-2.6, 0, 0.4, 1.6], [0.4, 1.6, 2.6, -1.2]]) { const dx = c - a, dz = d - b, len = Math.hypot(dx, dz), m = box(g, len, 0.05, 0.08, glow(I.P.warm, I.night ? 1.2 : 0.6), (a + c) / 2, 0.42, (b + d) / 2, 0.02, { cast: false }); m.rotation.y = -Math.atan2(dz, dx); } } }
};
