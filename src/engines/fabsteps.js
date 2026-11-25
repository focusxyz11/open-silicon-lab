/* The chip-making steps, as small models (the step labs of the earlier site, ported as engines; the views are somewhere else).
   Pure logic, no DOM, no English (ids only; the views show their own words, in src/i18n/en/, and those no view
   shows yet, fab.loop.*, fab.clean.* and fab.inspect.*, wait in src/data/waiting-words.json; its tests check them).
   Ported from the earlier site (the branch 'before'), from the labs of its physics, fab and litho topics, with
   the same formulas, constants and seeds, so the same settings show the same numbers; added here: stepping, seeded
   random draws and challenge checks. One file per step, gathered here:
     crystal.js  growing the crystal: the Czochralski puller (pullStart, pullStep, pullAuto, pullRun)
     dope.js     silicon as a semiconductor (siliconPure, siliconDoped, junction, mosfet) and implant then anneal (implant)
     fabline.js  the patterning loop (layerAt), cleanroom, CVD against ALD (depoStart, depoStep), overlay, inspection
     etch.js     plasma etch, a seeded Monte Carlo (etchStart, etchStep)
     litho.js    printing with light (litho, finestHalfPitch) and the EUV scanner (euv, euvExpose)
   Left out: the wafer steps lab (a list of eight sentences, no model); the first version's cleanroom, etch, fab-loop,
   inspection and EUV labs also drew animations (falling dust, ion traces, tin droplets), which a view does on its own.

   Challenges: CHALLENGES is a list of { id, lab, groups }; each group is a test of one result the lab reported, and the
   challenge is met when every group is matched by some result the player has seen (met(id, seen)). Results are what the
   lab functions return (for the puller, the state; for implant, the result; and so on); a view keeps the ones it has shown.
   Facts: ids of src/data/facts.json that these models' words rest on, by lab (FACT_IDS). Figures with no id there are
   in the comments of the file that uses them. */
import { metBy } from './fabkit.js';
import { PULL_CHALLENGES } from './crystal.js';
import { DOPE_CHALLENGES } from './dope.js';
import { FABLINE_CHALLENGES } from './fabline.js';
import { ETCH_CHALLENGES } from './etch.js';
import { LITHO_CHALLENGES } from './litho.js';

export * from './crystal.js';
export * from './dope.js';
export * from './fabline.js';
export * from './etch.js';
export * from './litho.js';
export { clamp, rng, gauss, metBy } from './fabkit.js';

export const CHALLENGES = [...PULL_CHALLENGES, ...DOPE_CHALLENGES, ...FABLINE_CHALLENGES, ...ETCH_CHALLENGES, ...LITHO_CHALLENGES];
export const challengeOf = id => CHALLENGES.find(c => c.id === id) || null;
export const met = (id, seen) => { const c = challengeOf(id); return !!c && metBy(c, seen); };

export const FACT_IDS = {
  loop: ['fab-steps', 'fab-cycle-time', 'fab-module-cost'],
  lithography: ['euv-wavelength', 'high-na-hvm', 'high-na-price'],
  euv: ['euv-source', 'euv-throughput', 'euv-wavelength']
};

