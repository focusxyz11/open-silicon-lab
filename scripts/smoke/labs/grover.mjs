/* the labs section's check of the lab grover (src/data/labs/grover.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('grover', "SET('#grv-noise', -4); const gk = document.querySelector('[data-grv-k]'); if (gk && +gk.dataset.grvK < 3) CL('[data-grv-step]')", 'One step too many');
};
