/* the labs section's check of the lab evolve (src/data/labs/evolve.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Evolve a circuit, at the studio's gates: evolution finds a voter smaller than the person's */
  await fp.goto(adr('#/do/evolve'));
  await fp.waitForSelector('[data-ev-go]', { timeout: 60000 }).catch(() => problems.push(tag + ': Evolve a circuit does not offer to evolve'));
  /* start it, and start it again if the sheet was drawn anew when the flight landed */
  await fp.waitForFunction(() => { const b = document.querySelector('[data-ev-go]'); if (b && !b.dataset.ran) { b.dataset.ran = '1'; b.click(); } return !!document.querySelector('.player .won'); }, null, { timeout: 90000, polling: 2000 }).catch(() => problems.push(tag + ': evolution does not beat the person\'s voter'));
  await inDo('evolve', 'evolve');
};
