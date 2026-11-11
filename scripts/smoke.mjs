// Browser smoke test: the dive opens on desktop and phone, in dark and light, with no errors; every depth
// can be reached; a question can be picked, followed deeper and let go; the dive can start in a phone or a car,
// keeping a depth they share; a stop can show a real case, its figures and the companion;
// a "Try it" changes your chip and another depth shows it; the factory makes your chip; a gap invites a
// question; nothing scrolls sideways.
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
  /* at a stop: a real case, the figures behind it, and the companion's prompt; elsewhere, a way to propose a question */
  await go(3);
  await page.$eval('#card [data-th="fail"]', el => el.click());
  if (!await page.$('#card details.case')) problems.push(tag + ': the real case does not show at its stop');
  if (await page.$eval('#card .companion', el => getComputedStyle(el).display !== 'none')) problems.push(tag + ': the companion shows before it is asked for');
  await page.$eval('#card [data-companion]', el => el.click());
  if (!/question behind it/i.test(await page.$eval('#card .companion textarea', el => el.value))) problems.push(tag + ': the companion has no prompt');
  if (await page.$eval('#card .companion', el => getComputedStyle(el).display === 'none')) problems.push(tag + ': the companion did not open');
  /* your chip: speed up the clock here, and the gate below shows it; then back to the starting chip */
  await page.$eval('#tryRange', el => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  if (!/[1-9]\d*% of signals late/.test(await page.textContent('#tryOut'))) problems.push(tag + ': a faster clock did not make signals late');
  await go(5);
  if (!/slowest signal/.test(await page.textContent('#card .mine').catch(() => ''))) problems.push(tag + ': the gate does not show your chip');
  await page.$eval('#card [data-reset]', el => el.click());
  if (await page.$('#card .mine')) problems.push(tag + ': going back to the starting chip did not work');
  await go(1);
  if (!/\/issues\/new\?template=question\.yml/.test(await page.$eval('#card a.btn', el => el.href).catch(() => ''))) problems.push(tag + ': a gap does not invite a question');
  await go(0);
  await page.waitForTimeout(200);
  if (!await page.$('#card .figs li')) problems.push(tag + ': the figures behind a stop do not show');
  await page.$eval('#card [data-leave]', el => el.click());
  if (!await page.$('#card a[href*="issues/new"]')) problems.push(tag + ': there is no way to propose a question');
  await go(2);
  if (await page.$('#cardQ')) problems.push(tag + ': letting go of the question did not work');
  /* another world: from the board, a phone keeps the step down (its board); a car keeps a depth they share (the block) */
  await page.click('#worlds [data-world="phone"]');
  if ((await page.$$('#rail [data-d]')).length !== 7) problems.push(tag + ': the phone dive does not have its own depths');
  if (!/board/i.test(await where())) problems.push(tag + ': changing world did not keep the step down');
  await go(3);
  if (!/block/i.test(await where())) problems.push(tag + ': the phone dive does not reach the shared depths');
  await page.click('#worlds [data-world="car"]');
  if (!/block/i.test(await where())) problems.push(tag + ': changing world did not keep a shared depth');
  await go(0);
  if (!/car/i.test(await where())) problems.push(tag + ': the car dive does not start at the car');
  /* the factory makes your chip: a bigger chip, fewer good ones; and the switch can be built step by step */
  await page.click('#worlds [data-world="factory"]');
  if ((await page.$$('#rail [data-d]')).length !== 9) problems.push(tag + ': the factory does not have its own depths');
  await go(3);
  await page.$eval('#card [data-th="fail"]', el => el.click());
  const before = await page.textContent('#card #chipHere');
  await page.$eval('#tryRange', el => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  if (before === await page.textContent('#card #chipHere')) problems.push(tag + ': a bigger chip does not change the wafer');
  await page.$eval('#card [data-reset]', el => el.click());
  await go(7);
  await page.$eval('#card [data-th="make"]', el => el.click());
  await page.$eval('#tryRange', el => { el.value = 2; el.dispatchEvent(new Event('input', { bubbles: true })); });
  if (!/narrow stack/i.test(await page.textContent('#tryOut'))) problems.push(tag + ': "Build it" does not step through how a switch is made');
  await page.$eval('#card [data-leave]', el => el.click());
  await page.click('#worlds [data-world="datacentre"]');
  await page.$eval('#themeBtn', el => el.click());
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the page scrolls sideways');
  await page.close();
}
await browser.close(); server.close();
if (problems.length) { console.error('Smoke test found problems:\n' + problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: the dive works in every world, on desktop and phone, in dark and light.');
