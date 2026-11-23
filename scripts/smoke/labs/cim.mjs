/* the labs section's check of the lab cim (src/data/labs/cim.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* new ways to compute: the cheapest converter of a grid of memory cells, and a quantum search stepped past its peak */
  await playLab('cim', "SET('#cim-w', 8); SET('#cim-n', 0.03); SET('#cim-adc', 7)", 'Fewest bits that still work');
};
