/* the labs section's check of the lab overlay (src/data/labs/overlay.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('vias', "SET('#ov-shift', 0); SET('#ov-sigma', 0.65); SET('#ov-shift', 2)", 'Ten billion vias');
};
