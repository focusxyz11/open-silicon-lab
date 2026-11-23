/* the labs section's check of the lab analog (src/data/labs/analog.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* chips that touch the real world (#220): the heartbeat inside its budget, the edge where the bearing's tone is lost, and a regulator for each of four jobs (a wrong one first, then the best) */
  await playLab('sig-heart', "SET('#ana-rate', 10)", 'A heartbeat on a coin cell');
  await playLab('sig-bearing', "SET('#ana-rate', 14); SET('#ana-rate', 15)", 'Hear the failing bearing');
  await playLab('reg-jobs', "for (const [j, a, b] of [['wearable', 'ldo', 'buck'], ['cpu', 'ldo', 'buck'], ['adc', 'buck', 'both'], ['nearly', 'buck', 'ldo']]) { CL('[data-reg-job=\"' + j + '\"]'); CL('[data-reg-type=\"' + a + '\"]'); CL('[data-reg-type=\"' + b + '\"]'); }", 'Four jobs, four regulators');
};
