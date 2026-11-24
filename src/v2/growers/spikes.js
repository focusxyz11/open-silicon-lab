/* What the lab spikes grows on the island (src/data/labs/spikes.js), drawn by src/v2/map3d.js when its challenge is won:
   each growth's place beside its place on the island, at: [x, z, y], and its model, grow(g, island), built into its group g
   from the island's palette and lists (the palette P, the roofs A, night, and what pulses or spins) */
import { mat, metal, glow, box, cyl } from '../kit3d.js';

export default {
  /* a detector made of spikes, at the Lab south of its tower: four input rails (two blue that add, two orange that take)
     running into one post, the neuron, whose light pulses when its pattern passes */
  'way-spikes': { at: [-3, 12], grow: (g, { P, night, pulses }) => { box(g, 4.2, 0.3, 2.6, mat(P.wall), 0, 0, 0, 0.1);
    for (let i = 0; i < 4; i++) { const z = -0.9 + i * 0.6; box(g, 2.4, 0.08, 0.12, metal(P.metal), -0.6, 0.3, z, 0.03, { cast: false });
      for (let k = 0; k < 3; k++) { const s = box(g, 0.16, 0.16, 0.16, glow(i < 2 ? P.accent : P.warm, night ? 1.2 : 0.6), -1.6 + k * 0.8 + (i % 2) * 0.35, 0.38, z, 0.04, { cast: false }); if ((i + k) % 2 === 0) pulses.push(s); } }
    cyl(g, 0.34, 0.42, 1.5, metal(P.dark), 1.2, 0.3, 0, 16); pulses.push(cyl(g, 0.3, 0.3, 0.3, glow(P.good, night ? 1.6 : 0.8), 1.2, 1.8, 0, 16, { cast: false })); } }
};
