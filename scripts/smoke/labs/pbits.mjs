/* the labs section's check of the lab pbits (src/data/labs/pbits.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* let the noise compute: p-bits factoring 15, then 143 */
  await playLab('noise', "SET('#pb-b', 4); SET('#pb-w', 3)", 'Let the noise compute');
  await playLab('noise-big', "SET('#pb-b', 4); SET('#pb-w', 3)", 'A bigger number, the same noise');
};
