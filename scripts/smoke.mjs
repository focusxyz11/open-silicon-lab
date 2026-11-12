// Browser smoke test: the dive opens on desktop and phone, in dark and light, with no errors; every depth
// can be reached; tapping a part says what it does; a question can be picked, followed deeper and let go; the dive can start in a phone or a car,
// keeping a depth they share; a stop can show a real case, its figures and the companion;
// a "Try it" changes your chip and another depth shows it; the journey runs from crystal to a shipped chip; a gap invites a
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
  /* the card's tabs: open one, unless it is open already */
  const tab = async id => { const b = await page.$('#card [data-tab="' + id + '"]'); if (!b) { problems.push(tag + ': no tab "' + id + '" at ' + await where()); return; } if ((await b.getAttribute('aria-selected')) !== 'true') await b.click(); };
  for (const d of [7, 3, 0]) await go(d);
  /* at the atom, the physics floor: cooling the chip lowers its floor, and the refrigerator pays it back */
  await go(7);
  await tab('floor');
  await page.$eval('#card [data-cold="0"]', el => el.click()).catch(() => problems.push(tag + ': no physics floor at the atom'));
  if (!/refrigerator/.test(await page.textContent('#card .floor').catch(() => ''))) problems.push(tag + ': cooling does not say what the refrigerator costs');
  /* the chip as a die photo: where the area goes, and a block to find; then back to the picture */
  await go(3);
  await tab('xray');
  await page.$eval('#card [data-xray]', el => el.click()).catch(() => problems.push(tag + ': no X-ray at the chip'));
  if (!await page.$('#card .area') || !/\d/.test(await page.textContent('#card .xray .legend').catch(() => ''))) problems.push(tag + ': the X-ray does not say where the area goes');
  await page.$eval('#card [data-xray]', el => el.click());
  await go(0);
  /* a part of the picture says what it does (on a phone the scene fills the canvas, so its centre is known) */
  if (tag === 'phone') {
    const r = await page.$eval('#world', el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    const B = Math.min(r.w - 16, r.h - 16);
    await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2 + 0.04 * B);
    if (!/rack/i.test(await page.textContent('#card .note').catch(() => ''))) problems.push(tag + ': tapping a part does not say what it is');
    await page.$eval('#card [data-closepart]', el => el.click()).catch(() => {});
  }
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
  await tab('qs');
  await page.$eval('#card [data-th="fail"]', el => el.click());
  if (!await page.$('#cardQ')) problems.push(tag + ': the question is not the first thing in the card');
  await tab('evidence');
  if (!await page.$('#card details.case')) problems.push(tag + ': the real case does not show at its stop');
  if (await page.$('#card .companion')) problems.push(tag + ': the companion shows before it is asked for');
  await tab('ask');
  if (!/question behind it/i.test(await page.$eval('#card .companion textarea', el => el.value).catch(() => ''))) problems.push(tag + ': the companion has no prompt');
  await tab('try');
  /* your chip: speed up the clock here, and the gate below shows it; then back to the starting chip */
  await page.$eval('#tryRange', el => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  if (!/[1-9]\d*% of signals late/.test(await page.textContent('#tryOut'))) problems.push(tag + ': a faster clock did not make signals late');
  if (!await page.$('#card .chal')) problems.push(tag + ': no challenge at the clock');
  const hop = await page.$('#card [data-trystop]');
  if (hop) { await hop.click(); if (!/switch/i.test(await where())) problems.push(tag + ': a challenge hint does not lead to where its other setting changes'); await go(3); await tab('qs'); await page.$eval('#card [data-th="fail"]', el => el.click()); }
  await go(5);
  await tab('chip');
  if (!/slowest signal/.test(await page.textContent('#card .mine').catch(() => ''))) problems.push(tag + ': the gate does not show your chip');
  await page.$eval('#card [data-reset]', el => el.click());
  if (await page.$('#card .mine')) problems.push(tag + ': going back to the starting chip did not work');
  await go(1);
  if (!/\/issues\/new\?template=question\.yml/.test(await page.$eval('#card a.btn', el => el.href).catch(() => ''))) problems.push(tag + ': a gap does not invite a question');
  await go(0);
  await page.waitForTimeout(200);
  await tab('evidence');
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
  /* the journey: one panorama of stations; a bigger chip changes the test map; dive down from printing and come back; ship into a world */
  await page.click('#worlds [data-world="journey"]');
  if ((await page.$$('#rail [data-d]')).length !== 11) problems.push(tag + ': the journey does not have its stations');
  await go(8);
  await page.$eval('#card [data-th="divide"]', el => el.click());
  const before = await page.textContent('#card #chipHere');
  await page.$eval('#tryRange', el => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  if (before === await page.textContent('#card #chipHere')) problems.push(tag + ': a bigger chip does not change the test');
  await page.$eval('#card [data-reset]', el => el.click());
  await page.$eval('#card [data-leave]', el => el.click());
  await go(4);
  if (!/loop/i.test(await page.textContent('#card .plant').catch(() => ''))) problems.push(tag + ': printing does not say it is part of the loop');
  await page.$eval('#card [data-dive^="made:scanner"]', el => el.click()).catch(() => problems.push(tag + ': no way to dive down from printing'));
  if (!/machine/i.test(await where())) problems.push(tag + ': diving down from printing did not reach the machine');
  await page.$eval('#card [data-dive^="journey:"]', el => el.click()).catch(() => problems.push(tag + ': no way back to the line'));
  if (!/print/i.test(await where())) problems.push(tag + ': coming back did not return to the station');
  await go(10);
  /* its life: a perfect design fails in a car; with everything the design and the factory can do, it ships */
  const click = sel => page.$eval('#card ' + sel, el => el.click()).catch(() => problems.push(tag + ': no ' + sel + ' in its life'));
  await click('[data-lifem="car"]');
  if (await page.$('#lifeOut p.good')) problems.push(tag + ': a perfect design ships to a car');
  await page.$eval('#lifeMargin', el => { el.value = el.max; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  for (const sel of ['[data-lifeset="grid"]', '[data-lifeprot="logic"]', '[data-lifeset="hot"]', '[data-lifeset="burn"]']) await click(sel);
  if (!await page.$('#lifeOut p.good')) problems.push(tag + ': a careful design still does not ship to a car');
  await click('[data-lifereset]');
  await page.$eval('#card [data-dive^="phone:soc"]', el => el.click()).catch(() => problems.push(tag + ': the chip cannot be shipped into a phone'));
  if (!/chip/i.test(await where()) || (await page.$$('#rail [data-d]')).length !== 7) problems.push(tag + ': shipping into a phone did not arrive at its chip');
  await page.click('#worlds [data-world="datacentre"]');
  await page.$eval('#themeBtn', el => el.click());
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the page scrolls sideways');
  await page.close();
}
/* the redesign (explore.html): your chip's life on the island. The first challenge is played and won, the island
   grows and says so, the HUD moves on; a place opens its three doors; the pages list every challenge and the plan. */
/* its own browser, with software WebGL, so the island can draw on a machine without a GPU */
const browser3d = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [tag, viewport, scheme] of [['explore desktop', { width: 1280, height: 800 }, 'light'], ['explore phone', { width: 390, height: 844 }, 'dark']]) {
  const page = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
  await page.goto(base + 'explore.html');
  await page.waitForSelector('#hud .steps button', { timeout: 15000 }).catch(() => problems.push(tag + ': no HUD with the five steps'));
  if ((await page.$$('#hud .steps button')).length !== 5) problems.push(tag + ': the HUD does not show five steps');
  await page.click('#hero [data-start]');
  await page.waitForSelector('#sheet .player #chCode', { timeout: 10000 }).catch(() => problems.push(tag + ': the first challenge did not open'));
  await page.fill('#chCode', 'sum = a ^ b;\ncarry = a & b;');
  await page.click('#sheet [data-check]');
  await page.waitForSelector('#sheet .won', { timeout: 10000 }).catch(() => problems.push(tag + ': a right design did not win the challenge'));
  if (!/grew/i.test(await page.textContent('#toast').catch(() => ''))) problems.push(tag + ': winning did not say what grew');
  if (!/1\/3/.test(await page.textContent('#hud [data-step="design"]').catch(() => ''))) problems.push(tag + ': the HUD did not count the win');
  await page.click('#sheet [data-next]').catch(() => problems.push(tag + ': no way on to the next challenge'));
  if (!/voter/i.test(await page.textContent('#sheet .player h3').catch(() => ''))) problems.push(tag + ': the next challenge is not the majority voter');
  await page.click('#sheet [data-back]');
  for (const door of ['look', 'ask', 'do']) { await page.click('#sheet [data-door="' + door + '"]').catch(() => problems.push(tag + ': no door ' + door)); }
  if (!(await page.$$('#sheet .chcard')).length) problems.push(tag + ': the studio has nothing to do');
  await page.evaluate(() => { location.hash = '#/challenges'; });
  await page.waitForSelector('#page .stepsec', { timeout: 10000 }).catch(() => {});
  if ((await page.$$('#page .stepsec')).length !== 6) problems.push(tag + ': the challenges page does not show five steps and the open jobs');
  await page.evaluate(() => { location.hash = '#/build'; });
  await page.waitForSelector('#page .tree', { timeout: 10000 }).catch(() => problems.push(tag + ': the build page has no plan'));
  /* inside a chip: dive down the layers, then switch to building them and step up */
  await page.evaluate(() => { location.hash = '#/chip/0'; });
  await page.waitForSelector('#chipui .stack button.on', { timeout: 15000 }).catch(() => problems.push(tag + ': the chip view did not open'));
  await page.click('#chipui .now [data-row="1"]').catch(() => problems.push(tag + ': no way deeper in the chip'));
  await page.waitForFunction(() => /2/.test(document.querySelector('#chipui .stack button.on .n').textContent), null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper did not reach the wires'));
  await page.click('#chipui .seg [data-mode="build"]');
  if (!/Wires/.test(await page.textContent('#chipui .now h2').catch(() => ''))) problems.push(tag + ': building does not name the step that made this layer');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the page scrolls sideways');
  await page.close();
}
await browser.close(); await browser3d.close(); server.close();
if (problems.length) { console.error('Smoke test found problems:\n' + problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: the dive works in every world, and the redesign\'s island plays, on desktop and phone, in dark and light.');
