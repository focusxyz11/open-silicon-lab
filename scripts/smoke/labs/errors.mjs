/* the labs section's check of the lab errors (src/data/labs/errors.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* catch the silent errors, at the port: the errors puzzle's lens, each place protected at the levels that can see its faults */
  await playLab('silent', "const P = '.player[data-ch=\"silent\"] ', W = { phone: ['check:abft', 'selftest:true', 'memory:parity', 'margin:0.3', 'materials:lowAlpha'], car: ['logic:lockstep', 'selftest:true', 'memory:ecc', 'margin:0.3'], datacentre: ['check:abft', 'hunt:true', 'memory:ecc', 'margin:0.3'] }; for (const [env, L] of Object.entries(W)) { CL(P + '[data-er-env=\"' + env + '\"]'); for (const k of L) CL(P + '[data-er=\"' + k + '\"]:not([aria-pressed=\"true\"])'); }", 'Catch the silent errors');
};
