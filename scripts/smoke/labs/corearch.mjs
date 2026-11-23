/* the labs section's check of the lab corearch (src/data/labs/corearch.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* change your core (#321): a slow multiplier, a second unit and half the registers, together, reach the goal */
  await playLab('corearch', "const P = '.player[data-ch=\"corearch\"] '; for (const [k, v] of [['mul', 'slow'], ['alus', '2'], ['regs', '16']]) CL(P + '[data-ca-' + k + '=\"' + v + '\"]:not([aria-pressed=\"true\"])')", 'Change your core');
};
