/* the labs section's check of the lab spikes (src/data/labs/spikes.js): its challenge played to its win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* a detector made of spikes: a guess first (how much work on quiet input), then the threshold and the leak */
  await playLab('spikes', "CL('[data-spk-guess=\"none\"]'); SET('#spk-th', 1); SET('#spk-lk', 0.5)", 'A detector made of spikes');
};
