/* A bet's wafer or chip while its challenge is open (src/v2/play.js, src/engines/bet.js): the 3D levels draw it in
   place of yours, so the scene behind the card answers the dials (src/v2/wafer3d.js, src/v2/relief3d.js; the wafer
   through src/app/scenes.js waferNow). version says when to build again. Small and without imports, so the shell can
   hold it from the start without loading the scenes. */
const BET = { wafer: null, chip: null, v: 0, key: '' };
export function setBetScene(wafer, chip, key = '') { if (key === BET.key) return; BET.wafer = wafer || null; BET.chip = chip || null; BET.key = key; BET.v++; }
export const betWaferNow = () => BET.wafer;
export const betChipNow = () => BET.chip;
export const sceneVersion = () => BET.v;
