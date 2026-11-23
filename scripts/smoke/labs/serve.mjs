/* the labs section's check of the lab serve (src/data/labs/serve.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* serving a language model, at the data centre: four bits despite outliers, where an answer's energy goes, read fast and write slow */
  await playLab('quantize', "CL('[data-sq-format=\"fp4\"]:not([aria-pressed=\"true\"])'); CL('[data-sq-scale=\"nv16\"]:not([aria-pressed=\"true\"])'); SET('#sq-outliers', 1)", 'Four bits, despite outliers');
  await playLab('token-energy', "SET('#se-watts', 2300); SET('#se-tokExp', 3.9); SET('#se-pue', 1.05); SET('#se-overhead', 10); SET('#se-tokExp', 4.5)", 'Where an answer\'s energy goes');
  await playLab('prefill', "CL('[data-sp-chip=\"rubin\"]:not([aria-pressed=\"true\"])'); CL('[data-sp-model=\"70\"]:not([aria-pressed=\"true\"])'); CL('[data-sp-answer=\"270\"]:not([aria-pressed=\"true\"])'); SET('#sp-prompt', 929)", 'Read fast, write slow');
};
