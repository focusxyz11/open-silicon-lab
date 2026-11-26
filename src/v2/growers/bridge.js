/* What the lab bridge grows on the island (src/data/labs/bridge.js), drawn by src/v2/map3d.js when its challenges are
   won: each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into
   its group g from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, glass, box, cyl } from '../kit3d.js';

/* a stand of glass tubes, each with its liquid lit as brightly as given (0 dark, 1 lit), on a low rack */
function tubes(g, { P, night, pulses }, x0, lits) {
  box(g, 0.5 + lits.length * 0.62, 0.16, 0.9, metal(P.metal), x0 + (lits.length - 1) * 0.31, 0.3, 0, 0.04);
  lits.forEach((lit, i) => { const x = x0 + i * 0.62;
    cyl(g, 0.2, 0.2, 1.5, glass(P.white), x, 0.3, 0, 18, { cast: false });
    const liquid = cyl(g, 0.16, 0.16, 0.7, lit ? glow(lit > 0.8 ? P.accent : P.good, (night ? 1.2 : 0.6) * lit) : mat(P.wall), x, 0.36, 0, 16, { cast: false });
    if (lit > 0.8) pulses.push(liquid); });
}

export default {
  /* one spec, two matters (src/v2/labs/bridge.js), at the Lab: on a low slab a small chip with its pins, a lit trace
     running from it to a stand of three tubes whose liquid glows, the same logic in two matters side by side */
  'way-bridge': { at: [-0.5, 17.5], grow: (g, I) => { const { P, night } = I; box(g, 4.6, 0.3, 2.2, mat(P.wall), 0, 0, 0, 0.1);
    box(g, 1.3, 0.16, 1.3, metal(P.dark), -1.4, 0.3, 0, 0.04);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) box(g, 0.08, 0.05, 0.22, metal(P.metal), -1.85 + i * 0.3, 0.32, s * 0.72, 0.01, { cast: false });
    box(g, 1.1, 0.04, 0.08, glow(P.accent, night ? 1 : 0.5), -0.35, 0.32, 0, 0.01, { cast: false });
    tubes(g, I, 0.55, [1, 0.5, 1]); } },
  /* a tube that recognizes shapes (src/v2/labs/bridge.js), at the Lab: three tubes for three memories, the winner's lit
     bright and pulsing, the other two dark */
  'way-dnawta': { at: [8.5, 18.5], grow: (g, I) => { box(g, 2.8, 0.3, 1.6, mat(I.P.wall), 0, 0, 0, 0.1); tubes(g, I, -0.62, [0, 1, 0]); } }
};
