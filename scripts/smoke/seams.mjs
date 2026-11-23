import { S } from './shared.mjs';

export const about = 'a fresh visitor crosses a seam and its leak rises; What if? between the islands';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  const tag = 'motion';
  /* the questions from the field (src/data/questions.js): crossing a seam raises the leak on it, and its card opens;
     under Ask at a level, the questions people were stuck on there come first */
  /* a fresh visitor (a new page, its own storage): earlier steps here crossed seams already, and a leak rises only
     the first time */
{ const fp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
  fp.on('pageerror', e => problems.push(tag + ' (seams): ' + e.message));
  await fp.goto(base + 'index.html#/line/test'); await fp.waitForTimeout(9000);
  await fp.evaluate(() => { location.hash = '#/line/pkg'; });
  await fp.waitForFunction(() => { const s = document.querySelector('.seamnote'); return !!s && !s.hidden && !!s.querySelector('[data-field="package"]'); }, null, { timeout: 30000 }).catch(() => problems.push(tag + ': crossing a seam does not raise its leak'));
  await fp.evaluate(() => { const b = document.querySelector('.seamnote [data-field]'); if (b) b.click(); });
  await fp.waitForSelector('.fieldx', { timeout: 10000 }).catch(() => problems.push(tag + ': a question from the field does not open its card'));
  /* What if? between the islands: a scenario moves the levers, the change lands on other islands, and one of
     them shows the chain back to the lever */
  await fp.goto(base + 'index.html#/whatif');
  await fp.waitForSelector('#sheet .wflevers [data-wf-lever]', { timeout: 120000 }).catch(() => problems.push(tag + ': What if? does not show its levers'));
  await fp.evaluate(() => { const b = document.querySelector('[data-wf-preset="squeeze"]'); if (b) b.click(); });
  await fp.waitForFunction(() => document.querySelectorAll('#sheet .wfland').length >= 5, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the memory squeeze does not reach the other islands'));
  await fp.evaluate(() => { const b = document.querySelector('#sheet [data-wf-pick="phones"]'); if (b) b.click(); });
  await fp.evaluate(() => { const b = document.querySelector('#sheet [data-wf-ind="devprice"]'); if (b) b.click(); });
  await fp.waitForFunction(() => document.querySelectorAll('#sheet .wfchain li').length >= 3, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a change on the phones does not trace back to its lever'));
  await fp.evaluate(() => { location.hash = '#/island'; });
  await fp.waitForFunction(() => !document.querySelector('#mapLabels .wf3') || [...document.querySelectorAll('#mapLabels .wf3')].every(e => e.style.opacity === '0'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': What if? stays on the island after leaving it'));
    await fp.close(); }
}
