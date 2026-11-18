// Browser smoke test (the chip world, index.html): the dive opens on desktop and phone, in dark and light, with no errors; every depth
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
/* a watchdog: a page that stops answering (a stuck software renderer on a CI machine) fails the test with where it was,
   instead of hanging the run */
let at = 'start';
setTimeout(() => { console.error('Smoke test stuck at: ' + at + (problems.length ? '\nProblems so far:\n' + problems.join('\n') : '')); process.exit(1); }, 20 * 60 * 1000).unref();
/* the earlier site (classic.html) was retired in 2026-11 and kept on the branch claude/before-retire-2026-11; the old
   address now leads to the chip world */
at = 'old address'; { const page = await browser.newPage(); await page.goto(base + 'classic.html#/questions'); await page.waitForFunction(() => /index\.html/.test(location.pathname) || location.pathname.endsWith('/'), null, { timeout: 15000 }).catch(() => problems.push('the old address does not lead to the chip world')); await page.close(); }
/* the chip world (index.html): your chip's life on the island. The first challenge is played and won, the island
   grows and says so (the first fixed with one tap), the tracker in the bar moves on; a place opens its three doors in the dock, Look first with a way inside; the pages list every challenge and the plan. */
/* its own browser, with software WebGL, so the island can draw on a machine without a GPU */
const browser3d = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [tag, viewport, scheme] of [['explore desktop', { width: 1280, height: 800 }, 'light'], ['explore phone', { width: 390, height: 844 }, 'dark']]) {
  at = tag; const page = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' });
  /* the software renderer here is slow: pin the quality, so the 3D levels are tested as 3D (the fallback has its own page) */
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
  await page.goto(base + 'index.html');
  /* the structure (docs/reviews/structure.md): no menu; the bar holds the loop, six stages from the need round to use.
     Following the chip opens the place where the loop starts, the Lab, and every place's card offers the next: the
     studio comes after it, and its first challenge is under Do */
  await page.waitForSelector('#loop [data-stage]', { timeout: 15000 }).catch(() => problems.push(tag + ': the bar does not hold the loop'));
  if ((await page.$$('#loop [data-stage]')).length !== 6) problems.push(tag + ': the loop does not show its six stages');
  if (await page.$('#sections')) problems.push(tag + ': the menu of sections shows without being asked for');
  /* the first page: questions to start with and the next challenges (never the core questions together) */
  if ((await page.$$('#hero .heroq .qcard')).length < 2) problems.push(tag + ': the first page offers no questions to start with');
  if (!(await page.$('#hero .heroc a'))) problems.push(tag + ': the first page offers no challenge');
  /* exploring folds the questions into a button in the corner, which opens them again */
  await page.evaluate(() => document.getElementById('mapCanvas').dispatchEvent(new WheelEvent('wheel', { deltaY: -60, bubbles: true, cancelable: true })));
  if (!(await page.$('#hero.folded [data-unfold]'))) problems.push(tag + ': exploring does not fold the first page\'s questions away');
  await page.click('#hero [data-unfold]').catch(() => problems.push(tag + ': the folded questions cannot be opened again'));
  await page.click('#hero [data-start]');
  await page.waitForFunction(() => location.hash === '#/place/lab' && !!document.querySelector('#sheet [data-key="next"]'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': following the chip did not open the Lab, where the loop starts'));
  if ((await page.getAttribute('#loop [aria-current]', 'data-stage').catch(() => '')) !== 'open') problems.push(tag + ': at the Lab the loop does not light its first stage, what is open');
  /* no one way on: the next stage of a chip's life is one of the places around, not the only one */
  if ((await page.$$('#sheet .around [data-place]')).length < 3) problems.push(tag + ': a place offers no places around it');
  await page.click('#sheet [data-key="next"]').catch(() => problems.push(tag + ': the Lab offers no next place'));
  await page.waitForFunction(() => { const c = document.querySelector('#loop [aria-current]'); return c && c.dataset.stage === 'design'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the next place after the Lab is not the studio'));
  await page.click('#sheet [data-door="do"]').catch(() => problems.push(tag + ': the studio has no Do'));
  await page.click('#sheet [data-open="half"]').catch(() => problems.push(tag + ': the studio does not offer the first challenge'));
  /* the first challenge is fixed by tapping the wrong gate: OR becomes XOR, and the table checks at once */
  await page.waitForSelector('#sheet .player .tapcode [data-op]', { timeout: 10000 }).catch(() => problems.push(tag + ': the first challenge did not open with its gates to tap'));
  if (!(await page.$('#sheet .verdict.bad'))) problems.push(tag + ': the first challenge does not show its wrong row before any tap');
  await page.click('#sheet [data-op="0"]');
  await page.waitForSelector('#sheet .won', { timeout: 10000 }).catch(() => problems.push(tag + ': a right design did not win the challenge'));
  if (!/grew/i.test(await page.textContent('#toast').catch(() => ''))) problems.push(tag + ': winning did not say what grew');
  if (!(await page.$('#sheet .opens[href^="#/ask/"]'))) problems.push(tag + ': the first win opens no question');
  if (!/1 of 8/.test(await page.getAttribute('#loop [data-stage="design"]', 'aria-label').catch(() => ''))) problems.push(tag + ': the tracker did not count the win');
  await page.click('#sheet [data-next]').catch(() => problems.push(tag + ': no way on to the next challenge'));
  if (!/voter/i.test(await page.textContent('#sheet .player h3').catch(() => ''))) problems.push(tag + ': the next challenge is not the majority voter');
  await page.click('#sheet [data-back]');
  for (const door of ['look', 'ask', 'do']) { await page.click('#sheet [data-door="' + door + '"]').catch(() => problems.push(tag + ': no door ' + door)); }
  if (!(await page.$$('#sheet .chcard')).length) problems.push(tag + ': the studio has nothing to do');
  await page.click('#sheet [data-door="look"]');
  if (!(await page.$('#sheet .lvchips a')) || !(await page.$('#sheet .zoomhint'))) problems.push(tag + ': Look shows no way inside the studio');
  /* every experiment reads as a page: its question, what is true and open, and ways on to others */
  await page.evaluate(() => { location.hash = '#/read/fail-ontime'; });
  await page.waitForSelector('#page:not([hidden]) .readq', { timeout: 10000 }).catch(() => problems.push(tag + ': a question does not open as a page'));
  if ((await page.$$('#page .readsec .qcard')).length < 3) problems.push(tag + ': a question\'s page offers no ways on');
  /* a world, made from its document, with its picture live: the crowd of copies answers a change of margin */
  await page.evaluate(() => { location.hash = '#/w/fail'; });
  await page.waitForSelector('#page .world .truths li', { timeout: 15000 }).catch(() => problems.push(tag + ': a world does not open from its document'));
  { const before = await page.textContent('#page .creq').catch(() => '');
    await page.click('#page [data-cp="margin"][data-cv="4"]').catch(() => problems.push(tag + ': the copies cannot be changed'));
    const after = await page.textContent('#page .creq').catch(() => '');
    if (!after || after === before) problems.push(tag + ': the crowd of copies did not answer a change of margin'); }
  /* Walls: choose a direction, change the chip, the dot moves; Forms: touch a signal, it lights in every form */
  await page.evaluate(() => { location.hash = '#/w/limit'; });
  await page.waitForSelector('#page [data-walls] .wdot', { timeout: 15000 }).catch(() => problems.push(tag + ': the walls are not drawn'));
  { const before = await page.getAttribute('#page [data-walls] .wdot', 'style').catch(() => '');
    await page.click('#page [data-walls] [data-wk="reuse"][data-wv="5"]').catch(() => problems.push(tag + ': the walls cannot be changed'));
    const after = await page.getAttribute('#page [data-walls] .wdot', 'style').catch(() => '');
    if (!after || after === before) problems.push(tag + ': the dot did not move toward the wall'); }
  await page.evaluate(() => { location.hash = '#/w/idea'; });
  await page.waitForSelector('#page [data-forms] .fgates', { timeout: 15000 }).catch(() => problems.push(tag + ': the forms are not drawn'));
  await page.click('#page [data-forms] .fform [data-fsig="sum"]').catch(() => problems.push(tag + ': a signal cannot be touched'));
  if (!(await page.$('#page [data-forms] .fcell.on')) || !(await page.$('#page [data-forms] .fg.on'))) problems.push(tag + ': a touched signal does not light its gates and cells');
  /* Plan: give part of the floor to a district, the engine answers; Clock: pick another measure, the card answers */
  await page.evaluate(() => { location.hash = '#/w/divide'; });
  await page.waitForSelector('#page [data-plan] .plead', { timeout: 15000 }).catch(() => problems.push(tag + ': the floor plan is not drawn'));
  { const before = await page.textContent('#page [data-plan]').catch(() => '');
    await page.click('#page [data-plan] [data-pk2="area"][data-pv2="1"]').catch(() => problems.push(tag + ': the floor plan cannot be changed'));
    const after = await page.textContent('#page [data-plan]').catch(() => '');
    if (!after || after === before) problems.push(tag + ': the floor plan did not answer a district'); }
  await page.evaluate(() => { location.hash = '#/w/scale'; });
  await page.waitForSelector('#page [data-clock] .clkcard', { timeout: 15000 }).catch(() => problems.push(tag + ': the clock is not drawn'));
  { const before = await page.textContent('#page [data-clock] .clkcard').catch(() => '');
    await page.click('#page [data-clock] [data-clk="frequency"]').catch(() => problems.push(tag + ': the clock cannot be changed'));
    const after = await page.textContent('#page [data-clock] .clkcard').catch(() => '');
    if (!after || after === before) problems.push(tag + ': the clock did not answer another measure'); }
  /* Side by side: count the cooling, and the card says what it did to the loops */
  await page.evaluate(() => { location.hash = '#/w/strange'; });
  await page.waitForSelector('#page [data-side] .sbl', { timeout: 15000 }).catch(() => problems.push(tag + ': the lanes are not drawn'));
  if ((await page.$$('#page [data-side] .sbl')).length < 6) problems.push(tag + ': a lane is missing');
  { const before = await page.textContent('#page [data-side] .sbcard').catch(() => '');
    await page.click('#page [data-side] [data-sbk="cool"][data-sbv="2"]').catch(() => problems.push(tag + ': the cooling cannot be counted'));
    const after = await page.textContent('#page [data-side] .sbcard').catch(() => '');
    if (!after || after === before) problems.push(tag + ': the lanes did not answer the cooling'); }
  /* Swarm: the colony walks, and a still room costs the eye-like pixels nothing */
  await page.evaluate(() => { location.hash = '#/w/life'; });
  await page.waitForSelector('#page [data-swarm] .swants', { timeout: 15000 }).catch(() => problems.push(tag + ': the colony is not drawn'));
  await page.waitForFunction(() => +(document.querySelector('#page [data-swarm] [data-sw="t"]') || {}).textContent?.replace(/\D/g, '') > 0, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the colony does not walk'));
  await page.click('#page [data-swarm] [data-swk="eye"][data-swv="0"]').catch(() => problems.push(tag + ': the scene cannot be changed'));
  await page.waitForTimeout(600);
  if (!/^0\b/.test(await page.textContent('#page [data-swarm] [data-sw="events"]').catch(() => 'x'))) problems.push(tag + ': a still room made the eye-like pixels report');
  /* Probe: tap the face of the box, a try appears; a note handed on comes back with three traces */
  await page.evaluate(() => { location.hash = '#/w/know'; });
  await page.waitForSelector('#page [data-tune] [data-tplane]', { timeout: 15000 }).catch(() => problems.push(tag + ': the box is not drawn'));
  for (const [fx, fy] of [[0.65, 0.38], [0.3, 0.7]]) { const r = await (await page.$('#page [data-tune] [data-tplane]'))?.boundingBox(); if (r) await page.mouse.click(r.x + r.width * (34 + fx * 300) / 342, r.y + r.height * (8 + (1 - fy) * 300) / 344); await page.waitForTimeout(100); }
  if ((await page.$$('#page [data-tune] .tdot')).length !== 2) problems.push(tag + ': a tap on the box did not leave a try');
  await page.click('#page [data-tune] [data-tk="hand"]').catch(() => problems.push(tag + ': the note cannot be handed on'));
  await page.waitForSelector('#page [data-tune] .thand .tfig', { timeout: 15000 }).catch(() => problems.push(tag + ': the note came back with no traces'));
  await page.evaluate(() => { location.hash = '#/w'; });
  await page.waitForFunction(() => document.querySelectorAll('#page .qgrid .qcard').length > 90, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the questions that lead in are not there'));
  /* a try on the page: change a choice, and the engine answers again */
  await page.evaluate(() => { location.hash = '#/read/strange-chain'; });
  await page.waitForSelector('#page .probe [data-pk]', { timeout: 10000 }).catch(() => problems.push(tag + ': the chain has no try on its page'));
  { const before = await page.textContent('#page .probe .plead').catch(() => '');
    await page.click('#page .probe [data-pk="restoring"][data-pv="0"]').catch(() => problems.push(tag + ': the try cannot be changed'));
    await page.click('#page .probe [data-pk="restoring"][data-pv="1"]').catch(() => {});
    await page.click('#page .probe [data-pk="noise"][data-pv="2"]').catch(() => {});
    const after = await page.textContent('#page .probe .plead').catch(() => '');
    if (!after || !(await page.$('#page .probe svg.pline'))) problems.push(tag + ': the try draws no answer');
    if (before === '' && after === '') problems.push(tag + ': the try says nothing'); }
  await page.evaluate(() => { location.hash = '#/read'; });
  await page.waitForFunction(() => document.querySelectorAll('#page [data-readsec] .qcard').length > 100, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the questions and challenges page is not there'));
  /* every level and the supply map are inside the chip world: a phone's dive, the made chip, the map at the port */
  /* the switch is drawn in 3D on the one stage, in the flat picture's place, with its five names */
  at = tag + ' 3D switch'; await page.evaluate(() => { location.hash = '#/dive/switch'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-switch [data-part3]').length === 5 && !document.getElementById('l3-switch').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the switch did not appear in 3D with its five names'));
  if (await page.evaluate(() => +getComputedStyle(document.getElementById('diveCanvas')).opacity > 0.5)) problems.push(tag + ': the flat switch did not give way to the 3D one');
  await page.click('#l3-switch [data-part3="gate"]').catch(() => problems.push(tag + ': the 3D switch\'s gate cannot be picked'));
  await page.waitForSelector('#l3-switch .swnote:not([hidden])', { timeout: 10000 }).catch(() => problems.push(tag + ': picking the gate opened no note'));
  /* the chip as a relief on the stage, with its four names and the memory stacked beside it, as the flight showed it */
  await page.evaluate(() => { location.hash = '#/dive/chip'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-chip [data-part3]').length === 5 && !!document.querySelector('#l3-chip [data-part3="hbm"]') && !document.getElementById('l3-chip').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the chip did not appear as a relief with its four names and its stacked memory'));
  /* the block too, with its names (your design's only once you have one) */
  await page.evaluate(() => { location.hash = '#/dive/block'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-block [data-part3]').length === 4 && !document.getElementById('l3-block').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the block did not appear as a relief'));
  /* the gate as a relief on the stage, with its five names */
  await page.evaluate(() => { location.hash = '#/dive/gate'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-gate [data-part3]').length === 5 && !document.getElementById('l3-gate').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the gate did not appear as a relief with its five names'));
  /* the atom too: a crystal on the stage, with its four names */
  await page.evaluate(() => { location.hash = '#/dive/atom'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-atom [data-part3]').length === 4 && !document.getElementById('l3-atom').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the atom did not appear in 3D with its four names'));
  if (await page.evaluate(() => !document.getElementById('l3-switch').hidden)) problems.push(tag + ': the 3D switch stayed up at the atom');
  at = tag + ' dives and map'; await page.evaluate(() => { location.hash = '#/dive/phone/phone'; });
  await page.waitForSelector('#diveui .dock [data-key="next"]', { timeout: 20000 }).catch(() => problems.push(tag + ': the phone dive did not open with a way deeper'));
  /* the phone itself in 3D, taken apart, with its four names */
  await page.waitForFunction(() => document.querySelectorAll('#l3-phone [data-part3]').length === 4 && !document.getElementById('l3-phone').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the phone did not appear in 3D'));
  /* the phone's board is a 3D board, like the data centre's, with its four names */
  await page.evaluate(() => { location.hash = '#/dive/phoneboard/phone'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-phoneboard [data-part3]').length === 4 && !document.getElementById('l3-phoneboard').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the phone board did not appear in 3D'));
  /* the flat dive's words are HTML over the picture: names at rest, a note on a picked part, marks only under Ask
     (on the car, a level kept flat on purpose) */
  await page.evaluate(() => { location.hash = '#/dive/car/car'; });
  await page.waitForSelector('#diveui .dock [data-key="next"]', { timeout: 20000 }).catch(() => {});
  await page.waitForSelector('#flatLabels [data-fpart]', { timeout: 15000 }).catch(() => problems.push(tag + ': the flat dive shows no names'));
  if (await page.$('#flatLabels .q3')) problems.push(tag + ': question marks show while looking');
  await page.click('#flatLabels [data-fpart]').catch(() => problems.push(tag + ': a name in the flat dive cannot be picked'));
  await page.waitForSelector('#flatLabels .swnote:not([hidden])', { timeout: 10000 }).catch(() => problems.push(tag + ': picking a part opened no note'));
  await page.click('#diveui [data-mode="ask"]').catch(() => {});
  await page.waitForSelector('#flatLabels .q3', { timeout: 10000 }).catch(() => problems.push(tag + ': under Ask the questions have no marks on the picture'));
  await page.click('#diveui [data-mode="look"]').catch(() => {});
  /* the wafer in 3D, with its two names */
  await page.evaluate(() => { location.hash = '#/dive/wafer/made'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-wafer [data-part3]').length === 2 && !document.getElementById('l3-wafer').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the wafer did not appear in 3D'));
  await page.evaluate(() => { location.hash = '#/dive/scanner/made'; });
  await page.waitForFunction(() => /scanner|light|machine/i.test(document.querySelector('#diveui .dock') ? document.querySelector('#diveui .dock').textContent : ''), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the made chip did not open at the machine'));
  await page.evaluate(() => { location.hash = '#/supply'; });
  await page.waitForSelector('#diveui .dock [data-site]', { timeout: 20000 }).catch(() => problems.push(tag + ': the supply map did not open with its places'));
  await page.evaluate(() => { location.hash = '#/place/fab'; });
  await page.waitForSelector('#sheet .lvchips a', { timeout: 15000 }).catch(() => {});
  if (await page.$('#sheet .lvchips a.old, #sheet a[href*="classic"]')) problems.push(tag + ': a level of the factory still leads to the earlier site');
  /* the commons (docs/reviews/community.md): the ledger offers a design that passed its test; one paused tick breaks it;
     the case is kept as yours, with the one link that adds it to the ledger as a new file; the island shows the design
     broken and the case standing guard; and a question can be asked under a question, kept the same way */
  at = tag + ' commons'; await page.evaluate(() => { location.hash = '#/do/break:2026-11-12-design-studio-agent-counter'; });
  await page.waitForSelector('#sheet .ticks [data-tick="3"]', { timeout: 20000 }).catch(() => problems.push(tag + ': the break did not open with its ticks'));
  if (await page.$('#sheet .verdict.good')) problems.push(tag + ': the counter looks broken before any case was set');
  await page.click('#sheet [data-tick="3"]').catch(() => {});
  await page.waitForSelector('#sheet .verdict.good', { timeout: 10000 }).catch(() => problems.push(tag + ': pausing the counter at three did not break it'));
  if (!(await page.$('#sheet .opens'))) problems.push(tag + ': a won break opens no question');
  if (await page.$('#sheet [data-keep]')) {   /* not once someone's break of it is in the ledger: then the case is only found again */
    await page.fill('#sheet [data-sign]', 'Smoke test'); await page.click('#sheet [data-keep]');
    await page.waitForSelector('#sheet .slip [data-send]', { timeout: 10000 }).catch(() => problems.push(tag + ': a kept case has no slip'));
    if (!/\/new\/main\/community\/ledger\?filename=[^&]*break[^&]*\.json&value=/.test(await page.getAttribute('#sheet .slip [data-send]', 'href').catch(() => '') || '')) problems.push(tag + ': the slip does not lead to a new file in the ledger');
    await page.waitForFunction(() => !!document.querySelector('#mapLabels .work3.ent.broken') && !!document.querySelector('#mapLabels .plot3.guard.draft'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': the island does not show the broken design and the case guarding its piece'));
  }
  /* a question followed from a card opens in its world: the stop first, with its asking, then the world */
  await page.evaluate(() => { location.hash = '#/w/fail/at/check'; });
  await page.waitForSelector('#page [data-arrive] .trailq', { timeout: 15000 }).catch(() => problems.push(tag + ': a question followed does not open in its world'));
  if (!(await page.$('#page [data-arrive] [data-askown]'))) problems.push(tag + ': a question in its world cannot be asked under');
  await page.evaluate(() => { location.hash = '#/ask/fail/check'; });
  await page.waitForSelector('.stopx .dochip', { timeout: 25000 }).catch(() => problems.push(tag + ': a question shows nothing to do about it'));
  await page.click('.stopx .asked summary').catch(() => problems.push(tag + ': a question has no place for what people ask'));
  await page.click('.stopx [data-askown]').catch(() => {});
  await page.fill('.stopx [data-askq]', 'Not a question').catch(() => {}); await page.fill('.stopx [data-sign]', 'Smoke test').catch(() => {}); await page.click('.stopx [data-askkeep]').catch(() => {});
  await page.waitForSelector('.stopx .askform .bad', { timeout: 10000 }).catch(() => problems.push(tag + ': a sentence that is not a question was not refused'));
  await page.fill('.stopx [data-askq]', 'If one case can break a design that passed, how many cases are enough?').catch(() => {}); await page.click('.stopx [data-askkeep]').catch(() => {});
  await page.waitForSelector('.stopx .asked1.draft .slip', { timeout: 10000 }).catch(() => problems.push(tag + ': a question asked under a question was not kept'));
  await page.evaluate(() => { location.hash = '#/build/record'; });
  await page.waitForSelector('#sheet .record .rec', { timeout: 10000 }).catch(() => problems.push(tag + ': the build page shows no record'));
  await page.evaluate(() => { location.hash = '#/build/mix'; }); await page.waitForSelector('#sheet .mix .mbar', { timeout: 10000 }).catch(() => {});
  if (!(await page.$('#sheet .mix .mbar'))) problems.push(tag + ': the build page does not show who makes what');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push(tag + ': the build page scrolls sideways');
  /* questions stay in the chip world: the questions page and a followed question never send you to the earlier site */
  at = tag + ' ' + '#/questions'; await page.evaluate(() => { location.hash = '#/questions'; });
  await page.waitForSelector('#page .qcard', { timeout: 10000 }).catch(() => problems.push(tag + ': the questions page shows no questions'));
  if (await page.$('#page .qcard[href*="classic"]')) problems.push(tag + ': a question still leads to the earlier site');
  at = tag + ' ' + '#/ask/think/gate'; await page.evaluate(() => { location.hash = '#/ask/think/gate'; });
  await page.waitForSelector('#diveui .dock .trailq', { timeout: 20000 }).catch(() => problems.push(tag + ': following a question did not show its stop in the dive'));
  await page.click('#diveui .dock [data-key="next"]').catch(() => problems.push(tag + ': a stop has no next stop'));
  await page.waitForFunction(() => location.hash === '#/ask/think/switch', null, { timeout: 15000 }).catch(() => problems.push(tag + ': the next stop is not the switch'));
  await page.waitForSelector('#diveui .dock .root2', { timeout: 15000 }).catch(() => problems.push(tag + ': after two stops the question underneath did not show'));
  at = tag + ' ' + '#/challenges'; await page.evaluate(() => { location.hash = '#/challenges'; });
  await page.waitForSelector('#page .stepsec', { timeout: 10000 }).catch(() => {});
  if ((await page.$$('#page #log-challenges ~ .stepsec')).length !== 6) problems.push(tag + ': the log does not show the five steps\' challenges and the open jobs');
  /* a challenge is played where its level is shown: the card of the factory's line, with the machines behind it */
  at = tag + ' do in place'; await page.evaluate(() => { location.hash = '#/do/quick'; });
  await page.waitForSelector('#diveui .dock .player', { timeout: 20000 }).catch(() => problems.push(tag + ': a factory challenge is not played in the line\'s card'));
  if (!(await page.evaluate(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'deposit'; }))) problems.push(tag + ': the challenge is not played at its own level');
  if ((await page.getAttribute('#diveui .modes3 [aria-selected="true"]', 'data-mode').catch(() => '')) !== 'do') problems.push(tag + ': a challenge in the card is not under Do');
  await page.click('#diveui .modes3 [data-mode="look"]').catch(() => {});
  if (await page.$('#diveui .dock .player')) problems.push(tag + ': Look does not lead back from a challenge to the story');
  at = tag + ' ' + '#/build'; await page.evaluate(() => { location.hash = '#/build'; });
  await page.waitForSelector('#sheet .tree [data-piece]', { timeout: 10000 }).catch(() => problems.push(tag + ': the build page has no plan'));
  /* inside a chip: dive down the layers, then switch to building them and step up */
  at = tag + ' ' + '#/chip/0'; await page.evaluate(() => { location.hash = '#/chip/0'; });
  /* the frame: the rail, Look · Do · Ask from the atlas, and the Turn between used and made */
  await page.waitForSelector('#chipui .dock .line', { timeout: 15000 }).catch(() => problems.push(tag + ': the chip view did not open in its frame'));
  await page.click('#chipui [data-rowgo="1"]').catch(() => problems.push(tag + ': no way deeper in the chip'));
  await page.waitForFunction(() => { const c = document.querySelector('#chipui .rail2 [aria-current]'); return c && c.dataset.rail === 'block'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper did not reach the blocks'));
  /* along: the loop in the bar turns the stack to the same layer as it is made, in place */
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the chip'));
  await page.waitForFunction(() => location.hash === '#/chip/1/build' && /Wires/.test((document.querySelector('#chipui .dock .kicker') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
  if (!/Wires/.test(await page.textContent('#chipui .dock .kicker').catch(() => ''))) problems.push(tag + ': turning to made does not name the step that made this layer');
  await page.click('#chipui .modes3 [data-mode="ask"]').catch(() => {});
  if (!(await page.$('#chipui .dock .askline'))) problems.push(tag + ': Ask shows no questions at this level');
  await page.click('#chipui .dock [data-mode="look"]').catch(() => {});
  /* the flat dive in the frame: the rail follows it down, and the Turn leads to the same level as made */
  at = tag + ' ' + '#/dive/gate'; await page.evaluate(() => { location.hash = '#/dive/gate'; });
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'gate'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the dive did not open at the gate'));
  await page.click('#diveui [data-divego][data-key="next"]').catch(() => problems.push(tag + ': no way deeper in the dive'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'switch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper in the dive did not reach the switch'));
  if (!(await page.$('#loop [data-stage="make"].holds'))) problems.push(tag + ': the loop does not say that Make holds the level in view');
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the dive'));
  await page.waitForFunction(() => location.hash === '#/line/etch', null, { timeout: 8000 }).catch(() => problems.push(tag + ': turning the switch to made did not open its factory step'));
  /* the line: the factory step by step, in the frame */
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'etch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the line did not open at etching'));
  await page.click('#diveui [data-divego][data-key="next"]').catch(() => problems.push(tag + ': no next step on the line'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'implant'; }, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the next step on the line is not implanting'));
  /* the bench: a design written in the dock, checked, won */
  at = tag + ' ' + '#/bench/logic/half'; await page.evaluate(() => { location.hash = '#/bench/logic/half'; });
  await page.waitForSelector('#diveui .dock .player [data-write], #diveui .dock #chCode', { timeout: 15000 }).catch(() => problems.push(tag + ': the bench did not open the design'));
  await page.click('#diveui .dock [data-write]', { timeout: 3000 }).catch(() => {});   /* the half adder opens for tapping; write it instead */
  await page.fill('#diveui .dock #chCode', 'sum = a ^ b;\ncarry = a & b;').catch(() => {});
  await page.click('#diveui .dock [data-check]').catch(() => {});
  await page.waitForSelector('#diveui .dock .won', { timeout: 10000 }).catch(() => problems.push(tag + ': a right design on the bench did not win'));
  /* the board: a story drives the scene; a prediction comes before the live number moves */
  at = tag + ' ' + '#/board'; await page.evaluate(() => { location.hash = '#/board'; });
  await page.waitForSelector('#boardui .dock .line', { timeout: 15000 }).catch(() => problems.push(tag + ': the board did not open'));
  for (const i of [1, 2, 3]) await page.click('#boardui .dock [data-go="' + i + '"]').catch(() => problems.push(tag + ': no step ' + i + ' on the board'));
  if (!(await page.$('#boardui .dock [data-guess]'))) problems.push(tag + ': the board asks for no prediction');
  await page.click('#boardui .dock [data-guess="b"]').catch(() => {});
  const before = await page.textContent('#boardui .dock [data-live]').catch(() => '');
  await page.click('#boardui .dock [data-live]').catch(() => {});
  if (before === await page.textContent('#boardui .dock [data-live]').catch(() => '')) problems.push(tag + ': the live number does not move');
  if (await page.$eval('#boardui .goal2', el => el.hidden).catch(() => true)) problems.push(tag + ': the goal does not show while the number moves');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the page scrolls sideways');
  await page.close();
}
/* one stage and no cuts: with motion on, going inside from the island dives the camera in, then the view zooms in from it
   (a view transition); rising goes back out. A duplicate name or a stuck view would show as an error here. */
{
  /* joins: every pair of neighbouring levels in 3D (the phone to its board to its chip, the control unit to its chip,
     the wafer to the die, a chip to the block, down to the atom): no flat picture shows between; both levels are
     drawn in one frame on one camera path, half way and back */
  for (const [a, b, na] of [['phone', 'phoneboard', 4], ['phoneboard', 'soc', 4], ['ecu', 'mcu', 3], ['wafer', 'die', 2], ['chip', 'block', 5], ['block', 'gate', 4], ['gate', 'switch', 5], ['switch', 'atom', 5]]) {
    const tag = 'join ' + a + '>' + b;
    at = tag; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/dive/' + a);
    await page.waitForFunction(([a, b, na]) => document.querySelectorAll('#l3-' + a + ' [data-part3]').length === na && !!document.getElementById('l3-' + b), [a, b, na], { timeout: 40000 }).catch(() => problems.push(tag + ': the ' + a + ' and the ' + b + ' were not both made'));
    await page.waitForTimeout(1500);
    /* a point over the picture itself, not over one of its names (a wheel there goes to the name) */
    const c = await page.$eval('#diveCanvas', e => { const r = e.getBoundingClientRect(); for (const k of [0.33, 0.45, 0.55, 0.25, 0.65]) { const x = r.x + r.width / 2, y = r.y + r.height * k; if (document.elementFromPoint(x, y) === e) return [x, y]; } return [r.x + r.width / 2, r.y + r.height / 3]; });
    await page.mouse.move(c[0], c[1]); await page.mouse.wheel(0, 312);
    await page.waitForFunction(j => document.documentElement.dataset.join === j, a + '>' + b, { timeout: 15000 }).catch(() => problems.push(tag + ': half way they were not drawn together'));
    if (await page.evaluate(() => +getComputedStyle(document.getElementById('diveCanvas')).opacity > 0.05)) problems.push(tag + ': the flat picture showed between them');
    if (await page.evaluate(([a, b]) => [...document.querySelectorAll('#l3-' + a + ' .part3, #l3-' + b + ' .part3')].some(e => e.style.opacity !== '0' && e.offsetParent), [a, b])) problems.push(tag + ': names showed in the middle of a join');
    await page.mouse.wheel(0, 312);
    await page.waitForFunction(b => !document.documentElement.dataset.join && [...document.querySelectorAll('#l3-' + b + ' .part3')].some(e => e.style.opacity !== '0'), b, { timeout: 15000 }).catch(() => problems.push(tag + ': the ' + b + ' did not settle with its names'));
    await page.mouse.wheel(0, -624);
    await page.waitForFunction(a => [...document.querySelectorAll('#l3-' + a + ' .part3')].some(e => e.style.opacity !== '0') && !document.getElementById('l3-' + a).hidden, a, { timeout: 15000 }).catch(async () => {
      /* what the level was doing, so a failure seen only on a slower machine can be read from the log */
      const state = await page.evaluate(a => JSON.stringify({ join: document.documentElement.dataset.join || '', hidden: document.getElementById('l3-' + a).hidden, names: [...document.querySelectorAll('#l3-' + a + ' .part3')].map(e => e.style.opacity + '@' + e.style.transform), flat: getComputedStyle(document.getElementById('diveCanvas')).opacity, hash: location.hash }), a).catch(e => e.message);
      problems.push(tag + ': back up, the ' + a + ' did not come back with its names ' + state);
    });
    await page.close();
  }
  /* Break it: on every screen, on a phone too, anyone reports what is wrong at the place they saw it; it is kept as a
     draft entry of the ledger with the one link that opens it on GitHub, and a report without a name is refused in words */
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const tag = 'break it ' + w; at = tag;
    const page = await browser3d.newPage({ viewport: { width: w, height: h } });
    page.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/line/print');
    await page.waitForSelector('#breakbtn', { timeout: 30000 }).catch(() => problems.push(tag + ': no Break it button'));
    await page.waitForTimeout(1500);
    await page.click('#breakbtn').catch(() => problems.push(tag + ': Break it cannot be tapped'));
    await page.waitForSelector('#breakp:not([hidden]) [data-breakwords]', { timeout: 5000 }).catch(() => problems.push(tag + ': the panel did not open'));
    if (!/#\/line\/print/.test(await page.textContent('#breakp').catch(() => ''))) problems.push(tag + ': the panel does not say where you are');
    await page.fill('[data-breakwords]', 'Next step did nothing the first time I pressed it.').catch(() => {});
    await page.click('[data-breakkeep]').catch(() => {});
    if (!(await page.$('#breakp .err'))) problems.push(tag + ': a report without a name was not refused');
    await page.fill('[data-sign]', 'A tester').catch(() => {}); await page.fill('[data-breakwords]', 'Next step did nothing the first time I pressed it.').catch(() => {});
    await page.click('[data-say="broken"]').catch(() => {}); await page.click('[data-breakkeep]').catch(() => {});
    const href = await page.getAttribute('#breakp [data-send]', 'href').catch(() => '');
    if (!/\/new\/main\/community\/ledger\?filename=\d{4}-\d{2}-\d{2}-report-/.test(href || '')) problems.push(tag + ': the report was not kept as an entry with its link');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) problems.push(tag + ': sideways scrolling with the panel open');
    /* the report stands on the island, at the factory where printing is, until a fix names it; tapping it goes back there */
    if (w > 700) { await page.evaluate(() => { location.hash = '#/'; });
      await page.waitForSelector('#mapLabels .poi3.report[data-poi="report:#/line/print"]', { state: 'attached', timeout: 30000 }).catch(() => problems.push(tag + ': a kept report does not stand on the island'));
      await page.evaluate(() => { const b = document.querySelector('#mapLabels .poi3.report'); if (b) b.click(); });
      await page.waitForFunction(() => location.hash === '#/line/print' && !document.getElementById('breakp').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': a report on the island does not lead back to where it was seen')); }
    await page.close();
  }
  /* a device too slow for a level in 3D gets its flat drawing back (osl-quality = slow makes every level count as too slow) */
  {
    at = 'slow device'; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => problems.push('slow device: ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'slow'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/dive/atom');
    await page.waitForFunction(() => { const h = document.getElementById('l3-atom'); return h && h.hidden && +getComputedStyle(document.getElementById('diveCanvas')).opacity > 0.9; }, null, { timeout: 30000 }).catch(() => problems.push('slow device: a level too slow in 3D did not fall back to its flat drawing'));
    await page.close();
  }
  at = 'motion'; const tag = 'motion', page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => problems.push(tag + ': ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
  await page.addInitScript(() => { window.GL = 0; const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { if (/webgl/.test(k) && !this.__gl) { this.__gl = 1; window.GL++; } return g.call(this, k, ...a); };
    window.MOVES = []; const o = document.startViewTransition && document.startViewTransition.bind(document); if (!o) return;
    document.startViewTransition = f => { const tr = o(f); window.MOVES.push(document.documentElement.dataset.move); tr.ready.catch(e => window.MOVES.push('failed: ' + e.message)); return tr; }; });
  /* the factory opens where it stands (docs/INTERACTION.md): its six tools are named in the scene, a tool is selected
     in place, and going closer from it reaches the line */
  await page.goto(base + 'index.html#/place/fab');
  await page.waitForFunction(() => document.querySelectorAll('#mapLabels .tool3[data-place="fab"]').length === 6, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the open factory does not name its tools'));
  /* the studio and the test house open the same way, and a part of each is selected in place */
  for (const [pl, part] of [['studio', 'layout'], ['test', 'map'], ['port', 'saw'], ['datacentre', 'rack']]) {
    await page.evaluate(h => { location.hash = h; }, '#/place/' + pl + '/' + part);
    await page.waitForSelector('#sheet.part [data-deeper]', { timeout: 15000 }).catch(() => problems.push(tag + ': ' + pl + ' does not open with its parts'));
  }
  await page.evaluate(() => { location.hash = '#/place/fab/etch'; });
  /* a part leads into the worlds its questions belong to, and a world says where it is met on the island */
  await page.waitForFunction(() => [...document.querySelectorAll('#sheet .wchip')].some(a => !a.hidden && a.getAttribute('href') === '#/w/fail'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': the etch tool does not lead to the world of its questions'));
  await page.waitForSelector('#sheet.part [data-deeper]', { timeout: 15000 }).catch(() => problems.push(tag + ': a tool of the factory cannot be selected'));
  await page.click('#sheet [data-deeper]');
  await page.waitForFunction(() => location.hash.startsWith('#/line/'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': going inside did not reach the line'));
  /* the key is pressed once the line's frame is drawn and the zoom has finished: on a slow machine the view can
     still be making itself seconds after the address changed, and a key before its way up exists does nothing */
  await page.waitForFunction(() => !document.getElementById('diveui').hidden && document.querySelector('#diveui .homebtn') && document.querySelector('#diveui .dock .line') && !document.documentElement.dataset.move, null, { timeout: 60000 }).catch(() => problems.push(tag + ': the line never finished opening'));
  await page.keyboard.press('Escape');
  /* software rendering on a CI machine can take seconds per frame of the line: give the key time to be handled */
  await page.waitForFunction(() => location.hash === '#/place/fab', null, { timeout: 45000 }).catch(() => problems.push(tag + ': Escape did not rise to the factory'));
  await page.waitForFunction(() => !document.documentElement.dataset.move, null, { timeout: 60000 }).catch(() => {});
  /* a zoom that Chrome skips because the view took too long to make (a slow machine) still changes the view, plainly:
     not a failure. Any other failure is. */
  const moves = (await page.evaluate(() => window.MOVES)).filter(m => !/aborted because of timeout/.test(m));
  if (moves.join() !== 'in,out') problems.push(tag + ': the views did not zoom in and out (' + moves.join() + ')');
  /* the world is the interface: a place tapped is answered beside it, the full card one tap further; a lens drains the
     island and says what it shows */
  await page.evaluate(() => { location.hash = '#/'; }); await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = document.querySelector('#mapLabels .place3[data-place="fab"]'); if (b) b.click(); });
  await page.waitForFunction(() => { const i = document.querySelector('.insp'); return i && !i.hidden && !!i.querySelector('[data-iact="more"]') && document.getElementById('sheet').hidden; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': a place tapped on the island is not answered beside it'));
  await page.evaluate(() => { const b = document.querySelector('.insp [data-iact="more"]'); if (b) b.click(); });
  await page.waitForFunction(() => !document.getElementById('sheet').hidden && document.querySelector('.insp').hidden, null, { timeout: 10000 }).catch(() => problems.push(tag + ': More does not open the full card'));
  await page.evaluate(() => { const b = document.querySelector('#sheet [data-close]'); if (b) b.click(); });
  await page.evaluate(() => { const b = document.querySelector('.lensbar [data-lens="fail"]'); if (b) b.click(); });
  await page.waitForSelector('.lensbar .lensnote a[href="#/w/fail"]', { timeout: 10000 }).catch(() => problems.push(tag + ': a lens does not say what it shows'));
  await page.evaluate(() => { const b = document.querySelector('.lensbar [data-lens="look"]'); if (b) b.click(); });
  /* a dial turned where it is decided: the numbers that moved are said, and the lens that shows them comes on */
  await page.evaluate(() => { const b = document.querySelector('#mapLabels .place3[data-place="studio"]'); if (b) b.click(); });
  await page.waitForSelector('.insp [data-dial="clock"][data-d="1"]', { timeout: 15000 }).catch(() => problems.push(tag + ': the studio has no dial for your chip'));
  await page.evaluate(() => { const b = document.querySelector('.insp [data-dial="clock"][data-d="1"]'); if (b) b.click(); });
  await page.waitForFunction(() => !!document.querySelector('.insp .dread') && !!document.querySelector('.lensbar [data-lens="fail"][aria-pressed="true"]'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': turning a dial does not show what it changed'));
  await page.evaluate(() => { const b = document.querySelector('.insp [data-dial="clock"][data-d="-1"]'); if (b) b.click(); const l = document.querySelector('.lensbar [data-lens="look"]'); if (l) l.click(); const x = document.querySelector('.insp [data-iact="close"]'); if (x) x.click(); });
  /* what calls stands in the world (docs/INTERACTION.md): by the test house, a square with a board of its questions and
     a bench for each challenge played there; the board opens what is asked there, a bench plays its challenge */
  await page.evaluate(() => { location.hash = '#/place/test'; });
  await page.waitForFunction(() => !!document.querySelector('#mapLabels .poi3.qs[data-poi="ask:test"]') && document.querySelectorAll('#mapLabels .poi3.ch').length >= 2, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the test house has no square of what calls there'));
  await page.evaluate(() => { const b = document.querySelector('#mapLabels .poi3[data-poi="ask:test"]'); if (b) b.click(); });
  await page.waitForSelector('#sheet [data-door="ask"][aria-selected="true"]', { timeout: 10000 }).catch(() => problems.push(tag + ': the board of a square does not open what is asked there'));
  await page.evaluate(() => { const b = document.querySelector('#mapLabels .poi3[data-poi="ch:spot"]'); if (b) b.click(); });
  await page.waitForFunction(() => location.hash === '#/do/spot', null, { timeout: 10000 }).catch(() => problems.push(tag + ': a bench does not play its challenge'));
  /* the world around the island is many islands, each its own kind of place */
  await page.evaluate(() => { location.hash = '#/ecosystem'; });
  await page.waitForFunction(() => document.querySelectorAll('#sheet .isles [data-place]').length === 6, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the world around does not show its six islands'));
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
    /* the labs and bets are played on a flat page of their own: none needs the 3D world, and on a CI machine's software
       renderer the flights between islands take long enough to redraw a card while it is played, which made these
       checks pass or fail by chance. A fresh visitor again (its own storage). */
    { const tag = 'labs', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    /* a file the labs ask for and do not get is named, so a 404 never goes untraced */
    fp.on('response', r => { if (r.status() >= 400) problems.push(tag + ': ' + r.status() + ' for ' + r.url()); });
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    /* a bet is played: guess first, then the two dials find the balance (src/engines/bet.js) */
    await fp.goto(base + 'index.html#/do/cheaper');
    await fp.waitForSelector('[data-guess-size]', { timeout: 30000 }).catch(() => problems.push(tag + ': the bet does not ask for a guess first'));
    await fp.evaluate(() => { const b = document.querySelector('[data-guess-size="6"]'); if (b) b.click(); });
    await fp.waitForSelector('.betwafer', { timeout: 10000 }).catch(() => problems.push(tag + ': the bet does not show its wafer'));
    await fp.evaluate(() => { for (const [k, v] of [['size', 6], ['clean', 2]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } } });
    await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the bet cannot be won with both dials'));
    /* Cray's bet: the ox alone and the chickens alone fail; one chip with both wins */
    await fp.goto(base + 'index.html#/do/oxen');
    await fp.waitForSelector('[data-guess-ox]', { timeout: 30000 }).catch(() => problems.push(tag + ': the oxen bet does not ask for a guess first'));
    await fp.evaluate(() => { const b = document.querySelector('[data-guess-ox="2"]'); if (b) b.click(); });
    await fp.waitForSelector('.oxplan', { timeout: 10000 }).catch(() => problems.push(tag + ': the oxen bet does not draw its chip'));
    await fp.evaluate(() => { for (const [k, v] of [['ox', 6], ['hens', 6]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } } });
    await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the oxen bet cannot be won with an ox and chickens'));
    /* the pieces' bet: split and untested sinks packages; split and tested wins */
    await fp.goto(base + 'index.html#/do/onebad');
    await fp.waitForSelector('[data-guess-pc]', { timeout: 30000 }).catch(() => problems.push(tag + ': the pieces bet does not ask for a guess first'));
    await fp.evaluate(() => { const b = document.querySelector('[data-guess-pc="1"]'); if (b) b.click(); });
    await fp.waitForSelector('.packs', { timeout: 10000 }).catch(() => problems.push(tag + ': the pieces bet does not draw its packages'));
    await fp.evaluate(() => { for (const [k, v] of [['k', 2], ['test', 2]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } } });
    await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the pieces bet cannot be won by splitting and testing'));
    /* the proof's bet, at the bench: prove the arithmetic, test the rest */
    await fp.goto(base + 'index.html#/do/prove');
    await fp.waitForSelector('[data-guess-pv]', { timeout: 30000 }).catch(() => problems.push(tag + ': the proof bet does not ask for a guess first'));
    await fp.evaluate(() => { const b = document.querySelector('[data-guess-pv="1"]'); if (b) b.click(); });
    await fp.waitForSelector('.pblocks [data-prove]', { timeout: 10000 }).catch(() => problems.push(tag + ': the proof bet does not show its blocks'));
    await fp.evaluate(() => { for (const i of [5, 6, 7]) { const b = document.querySelector('[data-prove="' + i + '"]'); if (b) b.click(); } const r = document.querySelector('[data-bet="tests"]'); if (r) { r.value = 5; r.dispatchEvent(new Event('input', { bubbles: true })); } });
    await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the proof bet cannot be won by proving the arithmetic'));
    /* Jevons' bet, on the power island: a better chip alone draws more turbines; under a limit on its power it holds. The
       island is far, and the sheet may be drawn again when the flight lands: each poll guesses and turns the dials anew */
    await fp.goto(base + 'index.html#/do/jevons');
    await fp.waitForSelector('[data-guess-jv]', { timeout: 120000 }).catch(() => problems.push(tag + ': the Jevons bet does not ask for a guess first'));
    const dials = (D, sel) => fp.waitForFunction(([D, sel]) => { const g = document.querySelector('[data-guess-jv="2"]'); if (g) g.click();
      for (const [k, v] of D) { const r = document.querySelector('#sheet [data-bet="' + k + '"]'); if (r && r.value !== String(v)) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } }
      return !!document.querySelector(sel); }, [D, sel], { timeout: 30000, polling: 1000 });
    await dials([['eff', 3], ['cap', 6]], '#sheet .turbines .tb.more').catch(() => problems.push(tag + ': a better chip alone does not draw turbines beyond the island'));
    await dials([['eff', 4], ['cap', 1]], '#sheet .player .won').catch(() => problems.push(tag + ': the Jevons bet cannot be won with a better chip and a limit on power'));
    /* the batch bet, at the data centre's chip: many people and fewer bits keep each fast and the chip busy */
    await fp.goto(base + 'index.html#/do/batch');
    await fp.waitForSelector('[data-guess-bt]', { timeout: 60000 }).catch(() => problems.push(tag + ': the batch bet does not ask for a guess first'));
    await fp.waitForFunction(() => { const g = document.querySelector('[data-guess-bt="2"]'); if (g) g.click();
      for (const [k, v] of [['batch', 9], ['format', 2]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r && r.value !== String(v)) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } }
      return !!document.querySelector('.player .won'); }, null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': the batch bet cannot be won with many people and fewer bits'));
    /* Look inside, at the phone's board: open five products, count the leading-edge kinds; the right chip for the job */
    await fp.goto(base + 'index.html#/do/newest');
    await fp.waitForSelector('[data-td-open]', { timeout: 60000 }).catch(() => problems.push(tag + ': Look inside does not offer its products'));
    await fp.evaluate(() => { for (const id of ['phone', 'car', 'thermo', 'laptop', 'server']) { const b = document.querySelector('[data-td-open="' + id + '"]'); if (b) b.click(); } const i = document.querySelector('[data-td-count]'); if (i) i.value = 7; const c = document.querySelector('[data-td-check]'); if (c) c.click(); });
    await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': counting the leading-edge kinds right does not win Look inside'));
    await fp.goto(base + 'index.html#/do/jobs');
    await fp.waitForSelector('[data-fit-kind]', { timeout: 60000 }).catch(() => problems.push(tag + ': the right chip for the job does not show its chips'));
    await fp.evaluate(() => { for (const [i, k] of [[0, 'cpu'], [1, 'mcu'], [2, 'gpu'], [3, 'asic'], [4, 'asic'], [5, 'fpga'], [6, 'dsp'], [7, 'power']]) { const j = document.querySelector('[data-fit-job="' + i + '"]'); if (j) j.click(); const b = document.querySelector('[data-fit-kind="' + k + '"]'); if (b) b.click(); } });
    await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': eight best fits do not win the right chip for the job'));
    /* Evolve a circuit, at the studio's gates: evolution finds a voter smaller than the person's */
    await fp.goto(base + 'index.html#/do/evolve');
    await fp.waitForSelector('[data-ev-go]', { timeout: 60000 }).catch(() => problems.push(tag + ': Evolve a circuit does not offer to evolve'));
    /* start it, and start it again if the sheet was drawn anew when the flight landed */
    await fp.waitForFunction(() => { const b = document.querySelector('[data-ev-go]'); if (b && !b.dataset.ran) { b.dataset.ran = '1'; b.click(); } return !!document.querySelector('.player .won'); }, null, { timeout: 90000, polling: 2000 }).catch(() => problems.push(tag + ': evolution does not beat the person\'s voter'));
    /* Grow a crystal, at the quarry's first step: the autopilot grows a dislocation-free ingot */
    await fp.goto(base + 'index.html#/do/crystal');
    await fp.waitForSelector('[data-cz-go]', { timeout: 60000 }).catch(() => problems.push(tag + ': Grow a crystal does not offer to start'));
    await fp.evaluate(() => { for (const s of ['[data-cz-auto]', '[data-cz-fast]', '[data-cz-go]']) { const b = document.querySelector(s); if (b) b.click(); } });
    await fp.waitForSelector('.player .won', { timeout: 120000 }).catch(() => problems.push(tag + ': the autopilot does not grow a perfect crystal'));
    /* the factory's labs: each is played to its win; a poll does every move again, as the sheet may be drawn anew
       when the flight lands. SET sets a dial the way a person drags it. */
    const SET = "const SET = (q, v) => { const i = document.querySelector(q); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } }, CL = q => { const b = document.querySelector(q); if (b) b.click(); };";
    const playLab = async (id, moves, what, wait = 90000) => {
      await fp.goto(base + 'index.html#/do/' + id);
      /* this challenge's own card (data-ch): the card of the lab before stays up until the new one is drawn */
      await fp.waitForSelector('.player[data-ch="' + id + '"]', { timeout: 60000 }).catch(() => problems.push(tag + ': ' + what + ' does not open'));
      /* polled from here: waitForFunction does not wait for an async predicate (its promise counts as true at once),
         so it would pass without a win; evaluate does wait */
      const play = new Function('return (async () => { ' + SET + moves + '; return !!document.querySelector(\'.player[data-ch="' + id + '"] .won\'); })()'), until = Date.now() + wait;
      let won = false;
      while (!won && Date.now() < until) { won = await fp.evaluate(play).catch(() => false); if (!won) await fp.waitForTimeout(3000); }
      if (!won) problems.push(tag + ': ' + what + ' is not won by the moves that win it');
    };
    /* serving a language model, at the data centre: four bits despite outliers, where an answer's energy goes, read fast and write slow */
    await playLab('quantize', "CL('[data-sq-format=\"fp4\"]:not([aria-pressed=\"true\"])'); CL('[data-sq-scale=\"nv16\"]:not([aria-pressed=\"true\"])'); SET('#sq-outliers', 1)", 'Four bits, despite outliers');
    await playLab('token-energy', "SET('#se-watts', 2300); SET('#se-tokExp', 3.9); SET('#se-pue', 1.05); SET('#se-overhead', 10); SET('#se-tokExp', 4.5)", 'Where an answer\'s energy goes');
    await playLab('prefill', "CL('[data-sp-chip=\"rubin\"]:not([aria-pressed=\"true\"])'); CL('[data-sp-model=\"70\"]:not([aria-pressed=\"true\"])'); CL('[data-sp-answer=\"270\"]:not([aria-pressed=\"true\"])'); SET('#sp-prompt', 929)", 'Read fast, write slow');
    await playLab('furnace', "CL('[data-im-ion=\"B\"]'); SET('#im-le', 0.3); CL('[data-im-anneal=\"furnace\"]'); CL('[data-im-anneal=\"laser\"]')", 'The furnace spreads it');
    await playLab('shallow', "CL('[data-im-ion=\"As\"]'); SET('#im-le', 0.3); CL('[data-im-anneal=\"laser\"]')", 'Shallow and switched on');
    await playLab('vias', "SET('#ov-shift', 0); SET('#ov-sigma', 0.65); SET('#ov-shift', 2)", 'Ten billion vias');
    /* chips that touch the real world (#220): the heartbeat inside its budget, the edge where the bearing's tone is lost, and a regulator for each of four jobs (a wrong one first, then the best) */
    await playLab('sig-heart', "SET('#ana-rate', 10)", 'A heartbeat on a coin cell');
    await playLab('sig-bearing', "SET('#ana-rate', 14); SET('#ana-rate', 15)", 'Hear the failing bearing');
    await playLab('reg-jobs', "for (const [j, a, b] of [['wearable', 'ldo', 'buck'], ['cpu', 'ldo', 'buck'], ['adc', 'buck', 'both'], ['nearly', 'buck', 'ldo']]) { CL('[data-reg-job=\"' + j + '\"]'); CL('[data-reg-type=\"' + a + '\"]'); CL('[data-reg-type=\"' + b + '\"]'); }", 'Four jobs, four regulators');
    await playLab('euv-1000', "SET('#eu-power', 1000); SET('#eu-reflect', 0.72); SET('#eu-mirrors', 8); SET('#eu-dose', 15)", 'The 1,000-watt source');
    /* every scanner at its finest: the engine finds the setting, the person's dials are set to it */
    /* new ways to compute: the cheapest converter of a grid of memory cells, and a quantum search stepped past its peak */
    await playLab('cim', "SET('#cim-w', 8); SET('#cim-n', 0.03); SET('#cim-adc', 7)", 'Fewest bits that still work');
    await playLab('grover', "SET('#grv-noise', -4); const gk = document.querySelector('[data-grv-k]'); if (gk && +gk.dataset.grvK < 3) CL('[data-grv-step]')", 'One step too many');
    await playLab('litho-finest', "const X = await import(new URL('src/engines/litho.js', location.href).href); for (const s of X.SOURCES) { const f = X.finestHalfPitch(s.id); let pick = null;"
      + " for (const dp of [false, true]) for (const illum of ['dipole', 'conventional']) for (let v = 0; v <= 1000 && !pick; v++) { const r = X.litho({ src: s.id, na: X.naOf(s, 9), hp: X.hpOfSlider(v), dose: 0.86, illum, dp }); if (r.status !== 'bad' && r.hp <= f * 1.1) pick = { v, illum, dp }; }"
      + " if (!pick) continue; CL('[data-lt-src=\"' + s.id + '\"]'); CL('[data-lt-illum=\"' + pick.illum + '\"]'); const d = document.querySelector('[data-lt-dp]'); if (d && (d.getAttribute('aria-pressed') === 'true') !== pick.dp) d.click();"
      + " SET('#lt-na', 9); SET('#lt-hp', pick.v); }", 'Print the finest lines');
    /* the films labs run in time: start a run, go on if it was paused, start again if it ended short of the goal */
    const GO = "const g = document.querySelector('[data-fl-go]'), st = g ? g.dataset.flState : '';";
    await playLab('etch', GO + " if (st === 'ready') { SET('#fl-ions', 100); SET('#fl-chem', 0); const f = document.querySelector('[data-fl-fast]'); if (f && f.getAttribute('aria-pressed') !== 'true') f.click(); CL('[data-fl-go]'); }"
      + " else if (st === 'ended') CL('[data-fl-reset]'); else if (st === 'paused') CL('[data-fl-go]')", 'Etch straight down', 180000);
    await playLab('bottom', GO + " const m = document.querySelector('[data-fl-mode].on'), mode = m ? m.dataset.flMode : 'cvd';"
      + " if (st === 'ended') { if (mode === 'cvd') CL('[data-fl-mode=\"ald\"]'); else CL('[data-fl-reset]'); } else if (st === 'ready' || st === 'paused') CL('[data-fl-go]')", 'The bare bottom', 180000);
    /* too hot for silicon, at the switch: the heater is set to 600 K and the silicon warms through the crossing */
    await playLab('too-hot', "SET('#semi-T', 600)", 'Too hot for silicon');
    /* Build your own AI chip: the data-centre brief, met by stacked memory on an interposer, 4-bit weights, more math and a faster clock, then taped out */
    await playLab('ai-chip', "CL('[data-aib-brief=\"infer\"]'); CL('[data-aib-set=\"mem:h4\"]'); SET('#aib-memN', 6); CL('[data-aib-set=\"pkg:cs\"]'); CL('[data-aib-set=\"fp4:true\"]'); SET('#aib-area', 863); SET('#aib-f', 2); CL('[data-aib-tape]')", 'Build your own AI chip');
    /* the clock and the power: the dials at a point the engine's check accepts; the counter is run at the same place on its
       dial at one process after another, and a run in progress is left to finish */
    await playLab('power-curve', "SET('#ckp-f', 2.25); SET('#ckp-v', 0.61)", 'Half the power');
    await playLab('counter', "const n = ['130', '28'].find(k => !document.querySelector('[data-ckp-node=\"' + k + '\"][data-top]'));"
      + " if (n && !document.querySelector('[data-ckp-run][aria-pressed=\"true\"]')) { CL('[data-ckp-node=\"' + n + '\"]'); SET('#ckp-hz', 61); CL('[data-ckp-run]'); }", 'The counter that fails', 180000);
    /* Verify the agent, at the Lab: a tool checks a case, and eight right calls win */
    await fp.goto(base + 'index.html#/do/agent');
    await fp.waitForSelector('#sheet .agcases [data-ag-case]', { timeout: 60000 }).catch(() => problems.push(tag + ': Verify the agent does not show its cases'));
    await fp.waitForFunction(() => { const b = document.querySelector('#sheet [data-ag-run]'); if (b) b.click(); return !!document.querySelector('#sheet .agtt tr.bad'); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': checking every input does not find the equality checker\'s wrong rows'));
    /* the sheet may be drawn again when the flight lands: each poll makes every call that is still missing */
    await fp.waitForFunction(() => { const calls = [['eq', 0], ['maj'], ['sum', 0], ['mul'], ['yield', 0], ['roof', 0], ['fact', 0], ['cov', 0]], c = s => { const e = document.querySelector('#sheet ' + s); if (e) e.click(); };
      for (const [id, r] of calls) { c('[data-ag-case="' + id + '"]'); if (document.querySelector('#sheet .agverdict.good')) continue; c('[data-ag-redo]'); if (r == null) c('[data-ag-trust]'); else { c('[data-ag-reject]'); c('[data-ag-reason="' + r + '"]'); } }
      return !!document.querySelector('#sheet .player .won'); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': eight right calls do not win Verify the agent'));
    await fp.close(); }
    /* What if? between the islands: a scenario moves the levers, the change lands on other islands, and one of
       them shows the chain back to the lever */
    await fp.goto(base + 'index.html#/whatif');
    await fp.waitForSelector('#sheet .wflevers [data-wf-lever]', { timeout: 60000 }).catch(() => problems.push(tag + ': What if? does not show its levers'));
    await fp.evaluate(() => { const b = document.querySelector('[data-wf-preset="squeeze"]'); if (b) b.click(); });
    await fp.waitForFunction(() => document.querySelectorAll('#sheet .wfland').length >= 5, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the memory squeeze does not reach the other islands'));
    await fp.evaluate(() => { const b = document.querySelector('#sheet [data-wf-pick="phones"]'); if (b) b.click(); });
    await fp.evaluate(() => { const b = document.querySelector('#sheet [data-wf-ind="devprice"]'); if (b) b.click(); });
    await fp.waitForFunction(() => document.querySelectorAll('#sheet .wfchain li').length >= 3, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a change on the phones does not trace back to its lever'));
    await fp.evaluate(() => { location.hash = '#/'; });
    await fp.waitForFunction(() => !document.querySelector('#mapLabels .wf3') || [...document.querySelectorAll('#mapLabels .wf3')].every(e => e.style.opacity === '0'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': What if? stays on the island after leaving it'));
    await fp.close(); }
  /* the ways on the picture (src/v2/frame.js): on the island, pointing at a building with an inside says so (a ring
     round it, Go inside over it); on the line, the next station is a button along the line (→), and a station with an
     inside has its way in (↓) with the machine ringed; each is the card's own control, mirrored */
  { const tag = 'ways', wp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    wp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await wp.goto(base + 'index.html#/');
    let goSeen = false;
    for (let i = 0; i < 6 && !goSeen; i++) {
      const r = await wp.waitForFunction(() => { const e = document.querySelector('#mapLabels .place3[data-place="fab"]'); if (!e || e.style.opacity === '0') return null; const q = e.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, null, { timeout: 30000, polling: 1000 }).then(h => h.jsonValue(), () => null);
      if (r) { await wp.mouse.move(r.x + 40, r.y + 40); await wp.mouse.move(r.x, r.y, { steps: 3 }); }
      goSeen = await wp.waitForFunction(() => { const g = document.querySelector('#mapLabels .go3'); return document.getElementById('mapCanvas').classList.contains('goin') && !!g && g.style.opacity !== '0'; }, null, { timeout: 10000, polling: 500 }).then(() => true, () => false);
    }
    if (!goSeen) problems.push(tag + ': pointing at the factory on the island does not invite you in');
    await wp.mouse.move(5, 790);
    await wp.evaluate(() => { location.hash = '#/line/print'; });
    await wp.waitForFunction(() => !!document.querySelector('#diveui .wayon:not([hidden]) .wogo') && !!document.querySelector('#diveui .wayin:not([hidden]) .wigo') && !!document.querySelector('#diveui .dock [data-in][href="#/dive/scanner/made"]'), null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at print, the line shows no way along and no way into the printing machine on the picture'));
    await wp.waitForFunction(() => !!document.querySelector('#diveui .wayin.at'), null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': at print, the way in does not stand beside the machine with a ring on it'));
    await wp.waitForFunction(() => { const b = document.querySelector('#diveui .wayon:not([hidden]) .wogo'); if (b && location.hash === '#/line/print') b.click(); return location.hash === '#/line/etch'; }, null, { timeout: 60000, polling: 3000 })
      .catch(() => problems.push(tag + ': the way along on the picture does not go to the next station'));
    await wp.waitForFunction(() => { const b = document.querySelector('#diveui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/line/etch' && /switch/.test(b.getAttribute('href') || '')) b.click(); return location.hash.startsWith('#/dive/switch'); }, null, { timeout: 60000, polling: 3000 })
      .catch(() => problems.push(tag + ': the way in on the line does not go inside what the station makes'));
    await wp.close(); }
  /* the dive on a phone: the card rests as a peek, opens when touched and steps aside when the picture is touched; a
     swipe up on the picture goes one level in */
  { const tag = 'ways phone', pp = await browser3d.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    pp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await pp.goto(base + 'index.html#/dive/chip');
    await pp.waitForSelector('#diveui .dockwrap.peek .dock .kicker', { timeout: 90000 }).catch(() => problems.push(tag + ': the dive\'s card does not rest as a peek on a phone'));
    await pp.waitForFunction(() => { const w = document.querySelector('#diveui .dockwrap'); if (w && w.classList.contains('peek')) w.click(); return !!w && !w.classList.contains('peek'); }, null, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': touching the peek does not open the card'));
    { const c = await pp.context().newCDPSession(pp); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 300 }] }); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach(); }
    await pp.waitForSelector('#diveui .dockwrap.peek', { timeout: 15000 }).catch(() => problems.push(tag + ': touching the picture does not let the card down'));
    const swipe = async () => { const c = await pp.context().newCDPSession(pp);
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 420 }] });
      for (let i = 1; i <= 5; i++) await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 420 - i * 30 }] });
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach(); };
    let deeper = false;
    for (let i = 0; i < 4 && !deeper; i++) { await swipe(); deeper = await pp.waitForFunction(() => location.hash === '#/dive/block', null, { timeout: 15000, polling: 500 }).then(() => true, () => false); }
    if (!deeper) problems.push(tag + ': a swipe up on the picture does not go a level in');
    await pp.close(); }
  /* a page of its own, so its moves do not mix with the zooms counted below */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (way in): ' + e.message));
  /* the way in is on the picture (src/v2/frame.js): inside the data centre, the button over the scene goes one level
     deeper, and at the chip, scrolling on carries the flight into it */
    await page.goto(base + 'index.html#/place/datacentre/2');
  await page.waitForFunction(() => { const b = document.querySelector('#placeui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/datacentre/2') b.click(); return location.hash === '#/place/datacentre/3'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the data centre'));
  await page.evaluate(() => { location.hash = '#/place/datacentre/5'; });
  /* every arrival the page announces is kept, so a quick one is not missed between two polls */
  await page.evaluate(() => { window.arrivals = []; new MutationObserver(() => { const a = document.documentElement.dataset.arrive; if (a) window.arrivals.push(a); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arrive'] }); });
  await page.waitForFunction(() => { const c = document.getElementById('placeCanvas'); if (c && location.hash === '#/place/datacentre/5') { c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); } return location.hash === '#/dive/chip'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': going on past the chip does not carry the flight into it'));
  /* the chip you land on is the chip you saw: the dive's chip comes down from where the flight ended (data-arrive while
     the camera moves), then rests with its names, the memory stacked beside it among them (a slow software renderer
     may then keep the flat drawing: the names are shown in 3D on the page above) */
  await page.waitForFunction(() => window.arrivals.includes('chip'), null, { timeout: 60000, polling: 500 })
    .catch(() => problems.push(tag + ': the dive\'s chip does not come down from where the flight ended'));
  await page.waitForFunction(() => !document.documentElement.dataset.arrive && !!document.querySelector('#l3-chip [data-part3="hbm"]'), null, { timeout: 60000, polling: 500 })
    .catch(() => problems.push(tag + ': the dive\'s chip does not come to rest with the memory beside it'));
    await page.close(); }
  await page.evaluate(() => { location.hash = '#/dive/block'; });
  /* the dive may still be making its view: Ask is chosen again until the block's questions show */
  await page.waitForFunction(() => { if (document.querySelector('#diveui .fieldline[data-field="fetch"]')) return true; const b = document.querySelector('#diveui .modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); return false; }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': Ask at the block does not list the questions from the field there'));
  /* one stage: the island, the data centre, the chip, the board and the line's machines all draw with one renderer */
  for (const h of ['#/place/datacentre/1', '#/chip/0', '#/board', '#/line/print', '#/']) { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(2500); }
  const gl = await page.evaluate(() => window.GL);
  if (gl > 1) problems.push(tag + ': ' + gl + ' WebGL contexts; every 3D view should share the one stage');
  await page.close();
}
await browser.close(); await browser3d.close(); server.close();
if (problems.length) { console.error('Smoke test found problems:\n' + problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: the dive works in every world, and the redesign\'s island plays, on desktop and phone, in dark and light.');
