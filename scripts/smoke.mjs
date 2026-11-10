// Browser smoke test: the dive opens on desktop and phone, in dark and light, with no errors; every depth
// can be reached; a question can be picked, followed deeper and let go; nothing scrolls sideways.
// Needs Playwright:  npm install --no-save playwright && npx playwright install chromium
import { serve } from './serve.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const server = await serve(0), base = 'http://localhost:' + server.address().port + '/';
const browser = await chromium.launch(), problems = [];
for (const [tag, viewport, scheme] of [['desktop', { width: 1360, height: 860 }, 'dark'], ['phone', { width: 390, height: 844 }, 'light']]) {
  const page = await browser.newPage({ viewport, colorScheme: scheme });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
  await page.goto(base);
  await page.waitForSelector('#card .where', { timeout: 15000 });
  const where = () => page.textContent('#card .where b');
  const go = async d => { await page.$eval('#rail [data-d="' + d + '"]', el => el.click()); await page.waitForFunction(d => document.querySelector('#rail [data-d="' + d + '"]').getAttribute('aria-current') === 'true', d, { timeout: 10000 }).catch(() => problems.push(tag + ': depth ' + d + ' was not reached')); };
  for (const d of [7, 3, 0]) await go(d);
  if (!(await page.$$('#card .qpick')).length) problems.push(tag + ': no question crosses the first depth');
  await go(1);
  await page.$eval('#card [data-th="think"]', el => el.click());
  if (!await page.$('#cardQ')) problems.push(tag + ': picking a question did not show it');
  await page.$eval('#card [data-go]', el => el.click());
  await page.waitForFunction(() => document.querySelector('#rail [data-d="2"]').getAttribute('aria-current') === 'true', null, { timeout: 10000 }).catch(() => problems.push(tag + ': "Go deeper" did not reach the next form of the question'));
  await page.waitForTimeout(300);
  if (!await page.$('#card .root')) problems.push(tag + ': after two depths the question underneath did not appear');
  if (!/board/i.test(await where())) problems.push(tag + ': the card does not follow the depth');
  await page.$eval('#card [data-leave]', el => el.click());
  if (await page.$('#cardQ')) problems.push(tag + ': letting go of the question did not work');
  await page.$eval('#themeBtn', el => el.click());
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the page scrolls sideways');
  await page.close();
}
await browser.close(); server.close();
if (problems.length) { console.error('Smoke test found problems:\n' + problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: the dive works on desktop and phone, in dark and light.');
