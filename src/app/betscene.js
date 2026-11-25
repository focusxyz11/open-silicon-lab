/* What the pictures draw that changes as you play: your chip, and a bet's wafer, chip or power while its challenge is
   open. Small and without imports, so the shell can hold it from the start without loading the scenes.
   version says when to build again (src/v2/wafer3d.js, src/v2/relief3d.js, src/v2/level3d.js): it moves when either
   changes. */
const BET = { wafer: null, chip: null, power: null, v: 0, key: '' };

/* Your chip: the shell hands over its settings whenever they change (a challenge's dial, "Reset your chip", the island's
   dials) and once at the start, from what was saved (src/v2/app.js, save). The scenes follow it once they have loaded
   (src/app/scenes.js calls followChip with its setChip), so the wafer, the gate's timing, the phone's battery and the
   journey's wafer draw your chip, whichever loads first. The same settings twice change nothing. */
const YOURS = { chip: null, key: '', follow: null };
export function setChipScene(c) {
  const key = JSON.stringify(c || null); if (key === YOURS.key) return;
  YOURS.chip = c ? Object.assign({}, c) : null; YOURS.key = key;
  if (YOURS.follow && YOURS.chip) YOURS.follow(YOURS.chip);
  BET.v++;
}
export function followChip(f) { YOURS.follow = f; if (YOURS.chip) f(YOURS.chip); }

/* A bet's wafer, chip or power while its challenge is open (src/v2/labs/bets.js, src/engines/bet.js): the 3D levels draw it in
   place of yours, so the scene behind the card answers the dials (src/v2/wafer3d.js, src/v2/relief3d.js; the wafer
   through src/app/scenes.js waferNow). */
export function setBetScene(wafer, chip, key = '', power = null) { if (key === BET.key) return; BET.wafer = wafer || null; BET.chip = chip || null; BET.power = power || null; BET.key = key; BET.v++; }
export const betWaferNow = () => BET.wafer;
export const betChipNow = () => BET.chip;
/* Jevons' bet on the power island: { need, own }, the turbines today's answers would draw, and the island's own */
export const betPowerNow = () => BET.power;
export const sceneVersion = () => BET.v;
