/* the labs section's check of the lab semiconductor (src/data/labs/semiconductor.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* too hot for silicon, at the switch: the heater is set to 600 K and the silicon warms through the crossing */
  await playLab('too-hot', "SET('#semi-T', 600)", 'Too hot for silicon');
};
