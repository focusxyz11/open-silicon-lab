/* the labs section's check of the lab dataflow (src/data/labs/dataflow.js): its challenge played to its win on the
   labs' flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* keep the numbers on the chip: guess, then a model one layer too large for 24 tiles, then the largest that fits */
  await playLab('dataflow', "CL('[data-dfl-guess=\"2\"]'); SET('#dfl-tiles', 24); SET('#dfl-layers', 13); SET('#dfl-layers', 12)", 'Keep the numbers on the chip');
};
