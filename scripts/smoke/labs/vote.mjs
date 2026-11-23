/* the labs section's check of the lab vote (src/data/labs/vote.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* the two thinnest core questions: a reliable whole from flaky parts (vote.js), a mind that cannot be copied (mortal.js) */
  await playLab('flaky', "['mul', 'mem', 'add'].forEach(b => CL('[data-rd=\"' + b + ':3\"]:not([aria-pressed=\"true\"])'))", 'Six flaky parts, one reliable chip');
};
