/* The lanes of Side by side (content/strange.md): kinds of matter that can pass a 1 to the next part, each with
   the numbers the Substrate engine needs and where every number comes from. A number nobody has given a source
   for yet is null: the lane shows it as missing, a place on the strange shelf for someone to fill. Words for each
   medium are in src/i18n/en.json (side.m.<id>.*). The domino's figures are worked out by the engine. */
import { dominoStep } from '../engines/substrate.js';

const D = dominoStep();
export const MEDIA = [
  { id: 'silicon', curve: 'restore', e: 40e-18, t: 0.43e-12, reset: 'self', kind: 'estimate',
    sources: [{ name: 'Nikonov & Young, Overview of beyond-CMOS devices (CMOS at 15 nm: switch plus its wire)', url: 'https://arxiv.org/abs/1302.0244' }] },
  { id: 'loop', curve: 'restore', e: 1e-19, t: 2e-12, cold: true, reset: 'self', kind: 'estimate',
    sources: [{ name: 'Hypres patent 9520180 (a Josephson junction switching: about 10⁻¹⁹ J, a pulse about 2 ps wide)', url: 'https://patents.justia.com/patent/9520180' },
      { name: 'Holmes & DeBenedictis, superconductor electronics in the IRDS (cooling: 400 to 10,000 W per W at 4 K)', url: 'https://www.osti.gov/servlets/purl/2002405' }] },
  { id: 'light', curve: 'pass', e: null, t: null, reset: null, kind: 'reported',
    sources: [{ name: 'D. A. B. Miller, Are optical transistors the logical next step? (Nature Photonics, 2010)', url: 'https://doi.org/10.1038/nphoton.2009.240' }] },
  { id: 'neuron', curve: 'restore', e: 28e-12, t: 1e-3, reset: 'self', kind: 'estimate',
    sources: [{ name: 'Computational capacity of pyramidal neurons in the cerebral cortex (one spike, all costs: about 28 pJ)', url: 'https://arxiv.org/abs/2009.10615' },
      { name: 'Wikipedia, Action potential (about a thousandth of a second)', url: 'https://en.wikipedia.org/wiki/Action_potential' }] },
  { id: 'dna', curve: 'restore', e: null, t: 1800, reset: 'fuel', kind: 'estimate',
    sources: [{ name: 'Qian & Winfree, Scaling up digital circuit computation with DNA strand displacement cascades (Science, 2011)', url: 'https://doi.org/10.1126/science.1200520' },
      { name: 'Science News (the four-bit square root took close to 10 hours)', url: 'https://www.sciencenews.org/?p=7561' }] },
  { id: 'domino', curve: 'restore', e: D.e, t: D.t, reset: 'hand', kind: 'estimate',
    sources: [{ name: 'Stronge, the domino effect (Nature, 1987: waves of 0.65 to 0.86 m/s)', url: 'https://www.nature.com/articles/325191a0.pdf' }] }
];
