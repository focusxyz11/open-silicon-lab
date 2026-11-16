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
  await page.click('#hero [data-start]');
  await page.waitForFunction(() => location.hash === '#/place/lab' && !!document.querySelector('#sheet [data-key="next"]'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': following the chip did not open the Lab, where the loop starts'));
  if ((await page.getAttribute('#loop [aria-current]', 'data-stage').catch(() => '')) !== 'open') problems.push(tag + ': at the Lab the loop does not light its first stage, what is open');
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
  if (!/1 of 3/.test(await page.getAttribute('#loop [data-stage="design"]', 'aria-label').catch(() => ''))) problems.push(tag + ': the tracker did not count the win');
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
  /* the chip as a relief on the stage, with its four names */
  await page.evaluate(() => { location.hash = '#/dive/chip'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-chip [data-part3]').length === 4 && !document.getElementById('l3-chip').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the chip did not appear as a relief with its four names'));
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
  await page.click('#diveui [data-divego]:not(.ghost)').catch(() => problems.push(tag + ': no way deeper in the dive'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'switch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper in the dive did not reach the switch'));
  if (!(await page.$('#loop [data-stage="make"].holds'))) problems.push(tag + ': the loop does not say that Make holds the level in view');
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the dive'));
  await page.waitForFunction(() => location.hash === '#/line/etch', null, { timeout: 8000 }).catch(() => problems.push(tag + ': turning the switch to made did not open its factory step'));
  /* the line: the factory step by step, in the frame */
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'etch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the line did not open at etching'));
  await page.click('#diveui [data-divego]:not(.ghost)').catch(() => problems.push(tag + ': no next step on the line'));
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
  for (const [a, b, na] of [['phone', 'phoneboard', 4], ['phoneboard', 'soc', 4], ['ecu', 'mcu', 3], ['wafer', 'die', 2], ['chip', 'block', 4], ['block', 'gate', 4], ['gate', 'switch', 5], ['switch', 'atom', 5]]) {
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
  /* one stage: the island, the data centre, the chip, the board and the line's machines all draw with one renderer */
  for (const h of ['#/place/datacentre/1', '#/chip/0', '#/board', '#/line/print', '#/']) { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(2500); }
  const gl = await page.evaluate(() => window.GL);
  if (gl > 1) problems.push(tag + ': ' + gl + ' WebGL contexts; every 3D view should share the one stage');
  await page.close();
}
await browser.close(); await browser3d.close(); server.close();
if (problems.length) { console.error('Smoke test found problems:\n' + problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: the dive works in every world, and the redesign\'s island plays, on desktop and phone, in dark and light.');
