/* the labs section's check of the lab mortal (src/data/labs/mortal.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('mortal', "SET('#mo-share', 9); CL('[data-mo-learn=\"chip\"]:not([aria-pressed=\"true\"])'); CL('[data-mo-cal]:not([aria-pressed=\"true\"])')", 'Learn on one chip, copy to a thousand');
};
