/* the labs section's check of the lab crystal (src/data/labs/crystal.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Grow a crystal, at the quarry's first step: the autopilot grows a dislocation-free ingot */
  await fp.goto(adr('#/do/crystal'));
  await fp.waitForSelector('[data-cz-go]', { timeout: 60000 }).catch(() => problems.push(tag + ': Grow a crystal does not offer to start'));
  await fp.evaluate(() => { for (const s of ['[data-cz-auto]', '[data-cz-fast]', '[data-cz-go]']) { const b = document.querySelector(s); if (b) b.click(); } });
  await fp.waitForSelector('.player .won', { timeout: 120000 }).catch(() => problems.push(tag + ': the autopilot does not grow a perfect crystal'));
  await inDo('crystal', 'crystal');
};
