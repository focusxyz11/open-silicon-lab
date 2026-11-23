/* the labs section's check of the lab search (src/data/labs/search.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* labs-a: design it or search for it, at the studio's gates: more computing passes the person's voter with every input
     checked, then a checker that tries half the inputs is fooled; the program nobody can judge, at the Lab: a NAND gate and
     a bit that remembers, then the agent fooled by a long count, again with more budget, and by the program that asks about itself */
  await playLab('search', "const P = '.player[data-ch=\"search\"] '; if (document.querySelector(P + '[data-sr-next=\"beat\"]')) { CL(P + '[data-sr-job=\"vote\"]:not([aria-pressed=\"true\"])'); CL(P + '[data-sr-check=\"all\"]:not([aria-pressed=\"true\"])'); SET(P + '#sr-budget', 6); } else CL(P + '[data-sr-check=\"some\"]:not([aria-pressed=\"true\"])')", 'Design it, or search for it?');
};
