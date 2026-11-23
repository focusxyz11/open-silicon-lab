/* the labs section's check of the lab aibuild (src/data/labs/aibuild.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Build your own AI chip: the data-centre brief, met by stacked memory on an interposer, 4-bit weights, more math and a faster clock, then taped out */
  await playLab('ai-chip', "CL('[data-aib-brief=\"infer\"]'); CL('[data-aib-set=\"mem:h4\"]'); SET('#aib-memN', 6); CL('[data-aib-set=\"pkg:cs\"]'); CL('[data-aib-set=\"fp4:true\"]'); SET('#aib-area', 863); SET('#aib-f', 2); CL('[data-aib-tape]')", 'Build your own AI chip');
};
