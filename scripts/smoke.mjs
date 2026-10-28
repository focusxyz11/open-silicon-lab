// Browser smoke test: every view and topic opens without errors, every simulation draws,
// the map links work, and the RISC-V lab can run a level end to end.
// Needs Playwright with Chromium (npx playwright install chromium).
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = await serve(0); const base = `http://localhost:${server.address().port}/`;
const problems = [];
const browser = await chromium.launch();

async function check(viewport) {
  const page = await browser.newPage({ viewport });
  const tag = viewport.width < 600 ? '[mobile] ' : '';
  page.on('pageerror', e => problems.push(tag + 'page error: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_NAME|net::/.test(m.text() + (m.location().url || ''))) problems.push(tag + 'console: ' + m.text()); });
  await page.goto(base + 'index.html');
  await page.waitForSelector('#mBands .tnode');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + 'map scrolls sideways');

  // Map: select a topic, follow a thread, search.
  await page.click('.tnode[data-t="riscv"]');
  if (!(await page.textContent('#mInfo')).includes('Connects to')) problems.push(tag + 'map info panel did not open');
  await page.click('#mThreads button[data-th="make"]');
  if ((await page.$$('.tnode.stepn')).length !== 6) problems.push(tag + 'thread did not highlight its 6 steps');
  await page.fill('#mSearch', 'HBM');
  if (!(await page.$$('#mInfo .hits a')).length) problems.push(tag + 'search found nothing for HBM');

  // Every topic and reference page.
  const ids = await page.evaluate(() => [...document.querySelectorAll('#library > section')].map(s => s.id));
  for (const id of ids) {
    await page.evaluate(h => { location.hash = h; }, id);
    await page.waitForTimeout(120);
    const r = await page.evaluate(id => {
      const s = document.getElementById(id);
      const shown = [...document.querySelectorAll('#library > section')].filter(x => !x.hidden).map(x => x.id);
      const blank = [...s.querySelectorAll('canvas')].filter(c => c.offsetParent && (c.width < 2 || c.height < 2)).length;
      return { shown, blank, wide: document.documentElement.scrollWidth > innerWidth + 1 };
    }, id);
    if (r.shown.length !== 1 || r.shown[0] !== id) problems.push(tag + `#${id}: shows ${r.shown.join(',')}`);
    if (r.blank) problems.push(tag + `#${id}: ${r.blank} canvas(es) did not size`);
    if (r.wide) problems.push(tag + `#${id}: page scrolls sideways`);
  }
  for (const v of ['workshop', 'challenges', 'knowledge']) {
    await page.evaluate(h => { location.hash = h; }, v);
    await page.waitForTimeout(120);
    if (await page.evaluate(v => document.getElementById('view-' + v).hidden, v)) problems.push(tag + v + ' view did not open');
  }

  // A lab anchor opens its topic and scrolls to it.
  await page.evaluate(() => { location.hash = 'lab-fab-2'; }); await page.waitForTimeout(300);
  if (await page.evaluate(() => document.getElementById('fab').hidden)) problems.push(tag + 'lab anchor did not open its topic');

  // RISC-V: run level 1 with the right answer.
  await page.evaluate(() => { location.hash = 'riscv-1'; }); await page.waitForTimeout(200);
  await page.fill('#rvCode', 'addi a0, x0, 42\n');
  await page.click('#rvBRun'); await page.waitForTimeout(300);
  if (!/pass/i.test(await page.textContent('#rvResults'))) problems.push(tag + 'RISC-V level 1 did not pass with the right answer');
  await page.close();
}

try {
  await check({ width: 1360, height: 900 });
  await check({ width: 390, height: 844 });
} finally { await browser.close(); server.close(); }
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: map, every topic, all views and the RISC-V lab work on desktop and mobile.');
