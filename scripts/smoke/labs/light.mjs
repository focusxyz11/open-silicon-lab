/* the labs section's check of the lab light (src/data/labs/light.js): its challenge played to its win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* multiply as it travels: a guess first (where the light comes out), then a weight of a quarter, then the noise at its edge */
  await playLab('light', "CL('[data-lgt-guess=\"bottom\"]'); SET('#lgt-th', 60); SET('#lgt-n', 5)", 'Multiply as it travels');
};
