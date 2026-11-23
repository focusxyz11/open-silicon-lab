/* the labs section's check of the lab teardown (src/data/labs/teardown.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* Look inside, at the phone's board: open five products, count the leading-edge kinds; the right chip for the job */
  await fp.goto(adr('#/do/newest'));
  await fp.waitForSelector('[data-td-open]', { timeout: 60000 }).catch(() => problems.push(tag + ': Look inside does not offer its products'));
  await fp.evaluate(() => { for (const id of ['phone', 'car', 'thermo', 'laptop', 'server']) { const b = document.querySelector('[data-td-open="' + id + '"]'); if (b) b.click(); } const i = document.querySelector('[data-td-count]'); if (i) i.value = 7; const c = document.querySelector('[data-td-check]'); if (c) c.click(); });
  await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': counting the leading-edge kinds right does not win Look inside'));
  await inDo('newest', 'newest');
  await fp.goto(adr('#/do/jobs'));
  await fp.waitForSelector('[data-fit-kind]', { timeout: 60000 }).catch(() => problems.push(tag + ': the right chip for the job does not show its chips'));
  await fp.evaluate(() => { for (const [i, k] of [[0, 'cpu'], [1, 'mcu'], [2, 'gpu'], [3, 'asic'], [4, 'asic'], [5, 'fpga'], [6, 'dsp'], [7, 'power']]) { const j = document.querySelector('[data-fit-job="' + i + '"]'); if (j) j.click(); const b = document.querySelector('[data-fit-kind="' + k + '"]'); if (b) b.click(); } });
  await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': eight best fits do not win the right chip for the job'));
  await inDo('jobs', 'jobs');
};
