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

/* The run is made of sections, each opening its own pages and closing them, and leaning on no other section's state:
     node scripts/smoke.mjs                 every section
     node scripts/smoke.mjs --only a,b      only the sections named
     node scripts/smoke.mjs --list          the sections and what each covers
   (npm run test:browser -- --only a,b does the same). CI runs them in groups, side by side (.github/workflows/ci.yml). */
const SECTIONS = [
  ['old', 'the old address (classic.html) leads to the chip world'],
  ['home', 'the map, the first page: the wafer, the toys, a station and its card, a question as a thread, the ways in, the island one tap away, desktop and phone'],
  ['explore-desktop', 'the chip world at 1280 px, light: the loop, the first challenge, the worlds and their tries, every 3D level, the dives, the commons, the frame, the bench, the board'],
  ['explore-phone', 'the same walk at 390 px, dark'],
  ['joins', 'every pair of neighbouring 3D levels drawn together half way, and back'],
  ['break', 'Break it on desktop and phone: the report kept as a ledger entry, standing on the island'],
  ['slow', 'a device too slow for 3D gets the flat drawing back'],
  ['motion', 'one stage and no cuts: the factory opens, zooms in and out, the island answers a tap, lenses and dials, the test house square, the islands around, Ask at the block, one WebGL context'],
  ['seams', 'a fresh visitor crosses a seam and its leak rises; What if? between the islands'],
  ['labs', 'every lab and bet played to its win on a flat page'],
  ['search', 'something to look for at a level, kept in your log'],
  ['ways', 'the ways on the picture: Go inside on the island, along and in on the line, one way down through a chip (the stack is Make, along from the dive), the phone\'s peek and swipe'],
  ['frame', 'the size at every level and the ring on the way in, desktop and phone'],
  ['flights', 'the data centre\'s way in and its flight into the chip; the studio walked inside, with a handoff to a bench; the phone\'s and the car\'s flights into their chips'],
  ['machines', 'machines from shared blocks: a form changed, an agent\'s pick used, where it is made, liquid hardware keeping up with a radio, the lab\'s curve and an attempt kept, new matter\'s claims and the guesses switch, desktop and phone'],
  ['frame2', 'the new frame behind ?frame=2 (#271): the caption at a dive level with its question in full, desktop and phone; Half the power won in Do mode, its instrument on the stage beside the panel that holds its controls; a question\'s page in Read mode, its column, its picture and the bar'],
];
const argv = process.argv.slice(2);
if (argv.includes('--list')) { for (const [n, about] of SECTIONS) console.log(n.padEnd(16) + about); process.exit(0); }
const oi = argv.indexOf('--only'), onlyArg = oi >= 0 ? argv[oi + 1] || '' : (argv.find(a => a.startsWith('--only=')) || '').slice(7);
const only = oi >= 0 || argv.some(a => a.startsWith('--only=')) ? onlyArg.split(',').map(s => s.trim()).filter(Boolean) : null;
if (only) { const unknown = only.filter(n => !SECTIONS.some(([s]) => s === n)); if (unknown.length || !only.length) { console.error('Unknown section: ' + (unknown.join(', ') || '(none given)') + '\nThe sections: ' + SECTIONS.map(([s]) => s).join(', ')); process.exit(2); } }

const server = await serve(0), base = 'http://localhost:' + server.address().port + '/';
const browser = await chromium.launch(), problems = [];
/* a watchdog: a page that stops answering (a stuck software renderer on a CI machine) fails the test with where it was,
   instead of hanging the run */
let at = 'start';
setTimeout(() => { console.error('Smoke test stuck at: ' + at + (problems.length ? '\nProblems so far:\n' + problems.join('\n') : '')); process.exit(1); }, 28 * 60 * 1000).unref();
/* its own browser, with software WebGL, so the 3D levels can draw on a machine without a GPU */
const browser3d = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const run = {};

run['old'] = async () => {
  /* the earlier site (classic.html) was retired in 2026-11 and kept on the branch claude/before-retire-2026-11; the old
     address now leads to the chip world */
  at = 'old address'; { const page = await browser.newPage(); await page.goto(base + 'classic.html#/questions'); await page.waitForFunction(() => /index\.html/.test(location.pathname) || location.pathname.endsWith('/'), null, { timeout: 15000 }).catch(() => problems.push('the old address does not lead to the chip world')); await page.close(); }
};

/* the map, the first page (#/, src/v2/home.js): nothing 3D is drawn there; the wafer tests its chips, the toys answer,
   a station opens its card with what can be played there and the view it leads to, a question runs through the map as
   a thread, a way in dims what it is not about, and the island and the brand lead out and back */
run['home'] = async () => {
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'home ' + w, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
    await hp.goto(base + 'index.html');
    await hp.waitForFunction(() => !document.getElementById('home').hidden && document.querySelectorAll('#home .hm-die.ok, #home .hm-die.bad').length > 20, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page is not the map, with a wafer tested'));
    if (await hp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the map');
    /* the same dust, bigger chips: fewer of them on the wafer */
    { const n0 = await hp.evaluate(() => document.querySelectorAll('#home .hm-die').length);
      await hp.waitForFunction(() => { const b = document.querySelector('#home [data-wsize="2"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return document.querySelectorAll('#home .hm-die').length > 0 && document.querySelector('#home [data-wsize="2"]').getAttribute('aria-pressed') === 'true'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the chip size cannot be changed'));
      const n1 = await hp.evaluate(() => document.querySelectorAll('#home .hm-die').length);
      if (!(n1 < n0)) problems.push(tag + ': bigger chips do not fit fewer to a wafer (' + n0 + ' then ' + n1 + ')'); }
    /* the gate answers its switches */
    await hp.waitForFunction(() => { const b = document.querySelector('#home [data-gin="b"]'); if (b && !b.classList.contains('on')) b.click(); const l = document.querySelector('#home .hm-bulb'); return !!l && l.textContent.trim() === '0'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a NAND with both switches on does not go dark'));
    /* the page leads on to the rest of the lab: six paths by subject, each a line of stops that open where they live
       and a way to start; one question with what is filed under it; what is new; every part of the lab by kind */
    await hp.waitForFunction(() => { const P = [...document.querySelectorAll('#home .hm-path')];
      return P.length === 6 && P.every(p => p.querySelectorAll('.hm-psteps a[href^="#/"]').length >= 4 && !!p.querySelector('a.hm-pgo[href^="#/"]')); }, null, { timeout: 10000 })
      .catch(() => problems.push(tag + ': the first page has no paths by subject, each with its stops and a way to start'));
    if (!(await hp.$('#home .hm-qcard a.hm-qitem[href^="#/"]'))) problems.push(tag + ': the question on the first page shows nothing behind it');
    if ((await hp.$$('#home .hm-nitem[href^="#/"]')).length < 3) problems.push(tag + ': the first page does not say what is new');
    { const ix = await hp.evaluate(() => [...document.querySelectorAll('#home .hm-index a.hm-ilink')].map(a => a.getAttribute('href')));
      for (const h of ['#/challenges', '#/read', '#/w', '#/island', '#/dive/chip', '#/line/crystal', '#/log']) if (!ix.includes(h)) problems.push(tag + ': the whole lab on the first page has no way to ' + h); }
    /* a scale picked on the ruler opens its level on the map, with how it is designed and made */
    await hp.waitForFunction(() => { const b = document.querySelector('#home [data-zat="5"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return document.querySelectorAll('#home .hm-twins button').length === 2 && /Gate/.test((document.querySelector('#home [data-side] h2') || {}).textContent || ''); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the ruler does not open the gate with its designed and made twins'));
    /* a station: what can be played there, and the view it leads to */
    const st = w > 760 ? '#home .hm-st[data-st="print"]' : '#home .hm-strip [data-st="print"]';
    if (w <= 760 && await hp.evaluate(() => !!document.querySelector('#home .hm-fit') && getComputedStyle(document.querySelector('#home .hm-fit')).display !== 'none')) problems.push(tag + ': the phone gets the wide map');
    await hp.click(st).catch(() => problems.push(tag + ': the station cannot be picked'));
    await hp.waitForFunction(() => document.querySelectorAll('#home [data-side] a.hm-item').length >= 2 && !!document.querySelector('#home [data-side] a.hm-enter[href="#/line/print"]'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': a station shows nothing to play, or no way into its view'));
    /* its question, followed: a thread through the map, one question in the bar */
    await hp.click('#home [data-side] [data-follow]').catch(() => problems.push(tag + ': the station offers no question to follow'));
    await hp.waitForFunction(w > 760 ? () => document.querySelectorAll('#home .hm-trun').length >= 2 && !!document.querySelector('#home [data-threadbar] .hm-q') : () => document.querySelectorAll('#home .hm-strip .onq').length >= 3, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the question is not drawn as a thread through the map'));
    if ((await hp.$$('#home .hm-q')).length > 3) problems.push(tag + ': too many questions on the page at once');
    /* a way in dims the stations it is not about */
    await hp.click('#home [data-way="fly"]').catch(() => problems.push(tag + ': no way in called Fly'));
    if (!(await hp.$('#home .hm-st.dim, #home .hm-strip .dim'))) problems.push(tag + ': a way in does not dim what it is not about');
    const side = await hp.evaluate(() => { const p = document.getElementById('home'); return p.scrollWidth - p.clientWidth; });
    if (side > 1) problems.push(tag + ': the map scrolls sideways by ' + side + ' px');
    /* the island is one tap away, the brand comes back, a station leads into its view */
    await hp.click('#home a[href="#/island"]').catch(() => problems.push(tag + ': the map offers no way to the island'));
    await hp.waitForFunction(() => location.hash === '#/island' && document.getElementById('home').hidden && !document.getElementById('mapCanvas').hidden, null, { timeout: 30000 }).catch(() => problems.push(tag + ': the island does not open from the map'));
    await hp.click('.bar .brand').catch(() => problems.push(tag + ': no brand in the bar'));
    await hp.waitForFunction(() => !document.getElementById('home').hidden && document.getElementById('mapCanvas').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the brand does not lead back to the map'));
    await hp.evaluate(() => { location.hash = '#/line/print'; });
    await hp.waitForFunction(() => document.getElementById('home').hidden, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the map stays over a station\'s view'));
    await hp.close();
  }
};

/* the chip world (index.html): your chip's life on the island. The first challenge is played and won, the island
   grows and says so (the first fixed with one tap), the tracker in the bar moves on; a place opens its three doors in the dock, Look first with a way inside; the pages list every challenge and the plan. */
const explore = async (tag, viewport, scheme) => {
  at = tag; const page = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' });
  /* the software renderer here is slow: pin the quality, so the 3D levels are tested as 3D (the fallback has its own page) */
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
  await page.goto(base + 'index.html#/island');
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
  if (!/1 of 11/.test(await page.getAttribute('#loop [data-stage="design"]', 'aria-label').catch(() => ''))) problems.push(tag + ': the tracker did not count the win');
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
  /* the energy puzzle's lens on the dive: the whole answer level by level, and a lab at the block as a lever that
     changes the whole trace; closed again so the dive below is as it was */
  at = tag + ' follow the joule';
  await page.click('#diveui .joulebtn').catch(() => problems.push(tag + ': the dive has no Follow the joule'));
  await page.waitForFunction(() => { const j = document.querySelector('#diveui .joule'); return j && !j.hidden && j.querySelectorAll('.jrow').length === 8 && /Gate/.test((j.querySelector('.jrow.here') || {}).textContent || ''); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the lens does not show the eight levels with the gate open'));
  await page.evaluate(() => { location.hash = '#/dive/block'; });
  await page.waitForSelector('#diveui .jrow.here[data-jl="block"]', { timeout: 10000 }).catch(() => problems.push(tag + ': the lens does not follow the dive to the block'));
  { const before = await page.textContent('#diveui .jtot b').catch(() => '');
    const more = await page.$('#diveui .jmore'); if (more && await more.isVisible()) await more.click();
    await page.click('#diveui [data-jv="cim:1"]').catch(() => problems.push(tag + ': compute in memory is no lever at the block'));
    await page.waitForFunction(b => { const t = document.querySelector('#diveui .jtot b'); return t && t.textContent !== b; }, before, { timeout: 5000 }).catch(() => problems.push(tag + ': pulling a lever did not change the answer\'s energy')); }
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the lens scrolls the page sideways');
  await page.click('#diveui [data-jx]').catch(() => problems.push(tag + ': the lens cannot be closed'));
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
  if (!(await page.evaluate(() => { const c = document.querySelector('#diveui .steps2 [aria-current]'); return c && c.dataset.step === 'deposit'; }))) problems.push(tag + ': the challenge is not played at its own level');
  if ((await page.getAttribute('#diveui .modes3 [aria-selected="true"]', 'data-mode').catch(() => '')) !== 'do') problems.push(tag + ': a challenge in the card is not under Do');
  await page.click('#diveui .modes3 [data-mode="look"]').catch(() => {});
  if (await page.$('#diveui .dock .player')) problems.push(tag + ': Look does not lead back from a challenge to the story');
  at = tag + ' ' + '#/build'; await page.evaluate(() => { location.hash = '#/build'; });
  await page.waitForSelector('#sheet .tree [data-piece]', { timeout: 10000 }).catch(() => problems.push(tag + ': the build page has no plan'));
  /* inside a chip there is one way down, the dive; the layers of the chip as made are the same levels, along the loop */
  at = tag + ' ' + '#/dive/block'; await page.evaluate(() => { location.hash = '#/dive/block'; });
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'block'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the dive did not open at the block'));
  /* along: Make in the bar turns the block to the same level as made, the stack's row of wires */
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the block'));
  await page.waitForFunction(() => location.hash === '#/chip/1/build' && /Wires/.test((document.querySelector('#chipui .dock') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
  /* the frame: the rail, Look · Do · Ask from the atlas */
  if (!/Wires/.test(await page.textContent('#chipui .dock').catch(() => ''))) problems.push(tag + ': turning to made does not name the step that made this layer');
  await page.waitForFunction(() => !!document.querySelector('#chipui .rail2 [aria-current][data-rail="block"]'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': the layers as made are not at the level the dive was at'));
  await page.click('#chipui [data-rowgo="2"]').catch(() => problems.push(tag + ': no way deeper in the layers as made'));
  await page.waitForFunction(() => { const c = document.querySelector('#chipui .rail2 [aria-current]'); return c && c.dataset.rail === 'gate' && location.hash === '#/chip/2/build'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper in the layers as made did not reach the gates'));
  /* Ask: the core questions that live at the level, as lenses (src/engines/frame.js); one chosen is shown alone, and
     choosing another shows that one instead */
  await page.waitForFunction(() => { const b = document.querySelector('#chipui .modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click();
    return document.querySelectorAll('#chipui .dock .qlbar .qlb').length >= 2 && document.querySelectorAll('#chipui .dock .qlb[aria-pressed="true"]').length === 1 && !!document.querySelector('#chipui .dock .qlcard .qlq'); }, null, { timeout: 15000, polling: 500 })
    .catch(() => problems.push(tag + ': Ask shows no lenses at this level, or not one chosen'));
  { const q0 = await page.textContent('#chipui .dock .qlcard .qlq').catch(() => '');
    await page.waitForFunction(q => { const L = [...document.querySelectorAll('#chipui .dock .qlb')], on = L.find(b => b.getAttribute('aria-pressed') === 'true'), q1 = document.querySelector('#chipui .dock .qlcard .qlq');
      if (q1 && q1.textContent !== q && document.querySelectorAll('#chipui .dock .qlcard').length === 1) return true; const other = L.find(b => b !== on); if (other) other.click(); return false; }, q0, { timeout: 15000, polling: 500 })
      .catch(() => problems.push(tag + ': choosing another lens does not show its question alone')); }
  await page.click('#chipui .dock [data-mode="look"]').catch(() => {});
  /* the flat dive in the frame: the rail follows it down, and the Turn leads to the same level as made */
  at = tag + ' ' + '#/dive/gate'; await page.evaluate(() => { location.hash = '#/dive/gate'; });
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'gate'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the dive did not open at the gate'));
  await page.click('#diveui [data-divego][data-key="next"]').catch(() => problems.push(tag + ': no way deeper in the dive'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'switch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper in the dive did not reach the switch'));
  if (!(await page.$('#loop [data-stage="make"].holds'))) problems.push(tag + ': the loop does not say that Make holds the level in view');
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the dive'));
  await page.waitForFunction(() => location.hash === '#/chip/3/build' && /Etch/.test((document.querySelector('#chipui .dock') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => problems.push(tag + ': turning the switch to made did not open its layer as made'));
  /* and from the layer as made, its step on the factory's line */
  await page.click('#chipui .dock a[href="#/line/etch"]').catch(() => problems.push(tag + ': the switch as made does not lead to its step on the line'));
  await page.waitForFunction(() => location.hash === '#/line/etch', null, { timeout: 8000 }).catch(() => problems.push(tag + ': the layer as made did not open its factory step'));
  /* the line: the factory step by step, in the frame */
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .steps2 [aria-current]'); return c && c.dataset.step === 'etch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the line did not open at etching'));
  await page.click('#diveui [data-divego][data-key="next"]').catch(() => problems.push(tag + ': no next step on the line'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .steps2 [aria-current]'); return c && c.dataset.step === 'implant'; }, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the next step on the line is not implanting'));
  /* the bench: a design written in the dock, checked, won */
  at = tag + ' ' + '#/bench/logic/half'; await page.evaluate(() => { location.hash = '#/bench/logic/half'; });
  await page.waitForSelector('#diveui .dock .player [data-write], #diveui .dock #chCode', { timeout: 15000 }).catch(() => problems.push(tag + ': the bench did not open the design'));
  await page.click('#diveui .dock [data-write]', { timeout: 3000 }).catch(() => {});   /* the half adder opens for tapping; write it instead */
  await page.fill('#diveui .dock #chCode', 'sum = a ^ b;\ncarry = a & b;').catch(() => {});
  await page.click('#diveui .dock [data-check]').catch(() => {});
  await page.waitForSelector('#diveui .dock .won', { timeout: 10000 }).catch(() => problems.push(tag + ': a right design on the bench did not win'));
  /* what design really is, in each step's card (src/v2/studio-look.js): timing at the gates, the factory's rules on the tile,
     the masks against the process's own; each poll goes to the step again, in case the card was drawn anew */
  for (const [step, sel, n] of [['gates', '.sl-bar', 1], ['layout', '.sl-rules li', 7], ['masks', '.sl-masks .sl-m', 34]]) {
    at = tag + ' ' + '#/bench/' + step;
    await page.waitForFunction(([s, q, k]) => { if (location.hash !== '#/bench/' + s) location.hash = '#/bench/' + s;
      const c = document.querySelector('#diveui .dock .sl[data-studio="' + s + '"]'); return !!c && c.querySelectorAll(q).length >= k; }, [step, sel, n], { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': the ' + step + ' card does not show what its engine says of your design'));
  }
  /* the bench as a live design (#265, #268): a first visit names every piece of the computer readably and says the design is
     the lab's example; a design changed at describe is followed by the check, the gates and the layout */
  { const btag = tag + ' bench', bp = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' }); bp.on('pageerror', e => problems.push(btag + ': ' + e.message));
    at = btag; await bp.goto(base + 'index.html#/bench/need');
    await bp.waitForFunction(() => document.querySelectorAll('.bsurf .bk-tree .bk-node').length >= 17, null, { timeout: 60000 }).catch(() => problems.push(btag + ': the job does not show the community\'s computer'));
    const small = await bp.evaluate(() => [...document.querySelectorAll('.bsurf .bk-nm')].filter(n => parseFloat(getComputedStyle(n).fontSize) < 10 || !n.textContent.trim() || n.getBoundingClientRect().width < 8).length);
    if (small) problems.push(btag + ': ' + small + ' names in the job\'s tree are not readable');
    await bp.waitForSelector('#diveui .dock .benchy .verdict[data-by="example"]', { timeout: 15000 }).catch(() => problems.push(btag + ': a first visit does not open on the lab\'s example (or says it was written by you)'));
    const MINE = 'sum = (a | b) & ~(a & b);\ncarry = a & b;';
    const follows = (hash, sel, what) => bp.waitForFunction(([hash, sel, MINE]) => {
      if (location.hash !== hash) location.hash = hash;
      const ta = document.querySelector('.bsurf [data-bk-code]'); if (ta && ta.value !== MINE) { ta.value = MINE; ta.dispatchEvent(new Event('input', { bubbles: true })); }
      return !!document.querySelector(sel); }, [hash, sel, MINE], { timeout: 30000, polling: 1000 }).catch(() => problems.push(btag + ': ' + what));
    await follows('#/bench/logic', '#diveui .dock .benchy .verdict.good[data-by="you"]', 'a design written at describe is not yours');
    await follows('#/bench/check', '.bsurf .bk-check .bk-say.good', 'the check does not follow the design written at describe');
    await follows('#/bench/gates', '.bsurf .bk-gates .bk-g:nth-of-type(4)', 'the gates do not follow the design written at describe');
    await follows('#/bench/layout', '.bsurf .bk-layout [data-bk-cell="3"]', 'the layout does not follow the design written at describe');
    await bp.close(); }
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
};
run['explore-desktop'] = () => explore('explore desktop', { width: 1280, height: 800 }, 'light');
run['explore-phone'] = () => explore('explore phone', { width: 390, height: 844 }, 'dark');

/* one stage and no cuts: with motion on, going inside from the island dives the camera in, then the view zooms in from it
   (a view transition); rising goes back out. A duplicate name or a stuck view would show as an error here. */
run['joins'] = async () => {
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
};

run['break'] = async () => {
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
    if (w > 700) { await page.evaluate(() => { location.hash = '#/island'; });
      await page.waitForSelector('#mapLabels .poi3.report[data-poi="report:#/line/print"]', { state: 'attached', timeout: 30000 }).catch(() => problems.push(tag + ': a kept report does not stand on the island'));
      await page.evaluate(() => { const b = document.querySelector('#mapLabels .poi3.report'); if (b) b.click(); });
      await page.waitForFunction(() => location.hash === '#/line/print' && !document.getElementById('breakp').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': a report on the island does not lead back to where it was seen')); }
    await page.close();
  }
};

run['slow'] = async () => {
  /* a device too slow for a level in 3D gets its flat drawing back (osl-quality = slow makes every level count as too slow) */
  {
    at = 'slow device'; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => problems.push('slow device: ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'slow'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/dive/atom');
    await page.waitForFunction(() => { const h = document.getElementById('l3-atom'); return h && h.hidden && +getComputedStyle(document.getElementById('diveCanvas')).opacity > 0.9; }, null, { timeout: 30000 }).catch(() => problems.push('slow device: a level too slow in 3D did not fall back to its flat drawing'));
    await page.close();
  }
};

run['motion'] = async () => {
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
  await page.evaluate(() => { location.hash = '#/island'; }); await page.waitForTimeout(1500);
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
  /* Ask at the block, and one stage (the counter of WebGL contexts starts again with the page, from its init script) */
  await page.goto(base + 'index.html#/dive/block');
  /* the dive may still be making its view: Ask is chosen again until the block's questions show */
  await page.waitForFunction(() => { if (document.querySelector('#diveui .fieldline[data-field="fetch"]')) return true; const b = document.querySelector('#diveui .modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); return false; }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': Ask at the block does not list the questions from the field there'));
  /* one stage: the island, the data centre, the chip, the board and the line's machines all draw with one renderer */
  for (const h of ['#/place/datacentre/1', '#/chip/0', '#/board', '#/line/print', '#/island']) { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(2500); }
  const gl = await page.evaluate(() => window.GL);
  if (gl > 1) problems.push(tag + ': ' + gl + ' WebGL contexts; every 3D view should share the one stage');
  await page.close();
};

run['seams'] = async () => {
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
};

run['labs'] = async () => {
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
  /* the two thinnest core questions: a reliable whole from flaky parts (vote.js), a mind that cannot be copied (mortal.js) */
  await playLab('flaky', "['mul', 'mem', 'add'].forEach(b => CL('[data-rd=\"' + b + ':3\"]:not([aria-pressed=\"true\"])'))", 'Six flaky parts, one reliable chip');
  await playLab('mortal', "SET('#mo-share', 9); CL('[data-mo-learn=\"chip\"]:not([aria-pressed=\"true\"])'); CL('[data-mo-cal]:not([aria-pressed=\"true\"])')", 'Learn on one chip, copy to a thousand');
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
  /* the bench's own challenges (#269), played on the bench over the studio's picture: say what your piece must answer,
     swap the 2-bit adder's cells until the wire is short, say which mask each shape is printed from */
  const BENCH = "const st = () => JSON.parse(localStorage.getItem('osl-world-v1') || '{}').bench || {}, X = await import(new URL('src/engines/bench.js', location.href).href), Dz = await import(new URL('src/engines/design.js', location.href).href), Gm = await import(new URL('src/v2/game.js', location.href).href), CLK = n => n && n.dispatchEvent(new MouseEvent('click', { bubbles: true }));";
  await playLab('piece', BENCH + " const bk = document.querySelector('.bsurf .bk-need'); if (bk) { const p = bk.dataset.bkP, v = {}; bk.querySelectorAll('[data-bk-in]').forEach(b => { v[b.dataset.bkIn] = +b.querySelector('.bk-v').textContent; });"
    + " const pr = Dz.projectOf(p), w = pr.seq ? null : pr.f(v); if (w) { bk.querySelectorAll('[data-bk-ans]').forEach(b => { if ((b.getAttribute('aria-pressed') === 'true') !== !!w[b.dataset.bkAns]) CLK(b); }); CL('[data-jq-check]'); } }", 'Your piece of the computer');
  await playLab('floor', BENCH + " const B = X.floorDesign(), s = st(); let rows = s.floor && X.validRows(B.M, s.floor, B.PL) ? s.floor : X.floorStart(B), cur = X.floorCheck(B, rows).wl, best = null;"
    + " for (let a = 0; a < B.M.cells.length; a++) for (let b = a + 1; b < B.M.cells.length; b++) { const R = X.swapCells(B.M, rows, a, b, B.PL.W); if (!R) continue; const c = X.floorCheck(B, R); if (!c.failed && c.wl < cur && (!best || c.wl < best.wl)) best = { a, b, wl: c.wl }; }"
    + " if (best) { CLK(document.querySelector('.bsurf [data-bk-cell=\"' + best.a + '\"]')); CLK(document.querySelector('.bsurf [data-bk-cell=\"' + best.b + '\"]')); }", 'The shortest wire');
  await playLab('maskof', BENCH + " const s = st(), D = Gm.benchDesign({ bench: s }), rows = s.rows && X.validRows(D.B.M, s.rows, D.B.PL) ? s.rows : X.rowsOf(D.B.PL), m = X.measure(D.B.M, rows, D.B.PL), sh = X.maskAsk(X.maskShapes(m.PL, m.RT), (s.mq || {}).k || 0);"
    + " if (sh) CL('[data-mq=\"' + sh.mask + '\"]')", 'Which mask?');
  /* Build your own AI chip: the data-centre brief, met by stacked memory on an interposer, 4-bit weights, more math and a faster clock, then taped out */
  await playLab('ai-chip', "CL('[data-aib-brief=\"infer\"]'); CL('[data-aib-set=\"mem:h4\"]'); SET('#aib-memN', 6); CL('[data-aib-set=\"pkg:cs\"]'); CL('[data-aib-set=\"fp4:true\"]'); SET('#aib-area', 863); SET('#aib-f', 2); CL('[data-aib-tape]')", 'Build your own AI chip');
  /* the clock and the power: the dials at a point the engine's check accepts; the counter is run at the same place on its
     dial at one process after another, and a run in progress is left to finish */
  await playLab('power-curve', "SET('#ckp-f', 2.25); SET('#ckp-v', 0.61)", 'Half the power');
  await playLab('counter', "const n = ['130', '28'].find(k => !document.querySelector('[data-ckp-node=\"' + k + '\"][data-top]'));"
    + " if (n && !document.querySelector('[data-ckp-run][aria-pressed=\"true\"]')) { CL('[data-ckp-node=\"' + n + '\"]'); SET('#ckp-hz', 61); CL('[data-ckp-run]'); }", 'The counter that fails', 180000);
  /* Keep the chef busy (src/v2/labs/bits.js): one bit's trip answers a move of the memory; then each poll clears the first
     level of chips not yet cleared (a winning plan, served), and leaves a serve in progress to finish */
  await playLab('chef', "const P = '.player[data-ch=\"chef\"] ', W = { wire: ['closer:2', 'shelf:2'], chip: ['shelf:2', 'stack:1'], stacked: ['shelf:3', 'stack:1'], light: ['stack:1', 'light:1'], dc: ['closer:1', 'shelf:1', 'stack:1', 'cim:1'] };"
    + " if (!document.querySelector(P + '[data-mb-serve][disabled]')) { CL(P + '[data-mb-tab=\"chef\"]:not([aria-pressed=\"true\"])');"
    + " const lv = Object.keys(W).find(k => { const b = document.querySelector(P + '[data-mb-level=\"' + k + '\"]'); return b && !b.dataset.cleared; });"
    + " if (lv) { CL(P + '[data-mb-level=\"' + lv + '\"]'); CL(P + '[data-mb-start]'); for (const m of W[lv]) CL(P + '[data-mb-lever=\"' + m + '\"]'); CL(P + '[data-mb-serve]'); } }", 'Keep the chef busy', 180000);
  /* one bit's trip: moving the memory from the chip to another machine reached by light changes what the bit costs */
  await fp.waitForFunction(() => { const P = '.player[data-ch="chef"] ', c = q => { const b = document.querySelector(q); if (b) b.click(); }, e = () => { const f = document.querySelector(P + '[data-mb-e]'); return f ? { mbTrip: f.dataset.mbTrip, mbE: f.dataset.mbE } : null; };
    c(P + '[data-mb-tab="trip"]'); c(P + 'button[data-mb-at="near"]'); const a = e(); c(P + 'button[data-mb-at="rack"]'); const b = e();
    return !!(a && b && a.mbTrip === 'near' && b.mbTrip === 'rack' && +b.mbE > 10 * +a.mbE); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': moving the memory does not change one bit\'s trip'));
  /* Verify the agent, at the Lab: a tool checks a case, and eight right calls win */
  await fp.goto(base + 'index.html#/do/agent');
  await fp.waitForSelector('#sheet .agcases [data-ag-case]', { timeout: 60000 }).catch(() => problems.push(tag + ': Verify the agent does not show its cases'));
  await fp.waitForFunction(() => { const b = document.querySelector('#sheet [data-ag-run]'); if (b) b.click(); return !!document.querySelector('#sheet .agtt tr.bad'); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': checking every input does not find the equality checker\'s wrong rows'));
  /* the sheet may be drawn again when the flight lands: each poll makes every call that is still missing */
  await fp.waitForFunction(() => { const calls = [['eq', 0], ['maj'], ['sum', 0], ['mul'], ['yield', 0], ['roof', 0], ['fact', 0], ['cov', 0]], c = s => { const e = document.querySelector('#sheet ' + s); if (e) e.click(); };
    for (const [id, r] of calls) { c('[data-ag-case="' + id + '"]'); if (document.querySelector('#sheet .agverdict.good')) continue; c('[data-ag-redo]'); if (r == null) c('[data-ag-trust]'); else { c('[data-ag-reject]'); c('[data-ag-reason="' + r + '"]'); } }
    return !!document.querySelector('#sheet .player .won'); }, null, { timeout: 30000, polling: 1500 }).catch(() => problems.push(tag + ': eight right calls do not win Verify the agent'));
  await fp.close(); }
};

run['search'] = async () => {
  /* something to do at a level (src/data/seek.js): the card says what to look for, a part tapped gives something to
     notice, the part that leads in lights the question, and finding it is kept in your log. A page of its own (a
     fresh visitor), since it moves between views; each tap is done again inside the poll, as the view may still be
     making its card */
  /* on a flat page (the search is in the card; the 3D levels are checked elsewhere), so it costs CI little time */
  { const tag = 'search', sp = await browser.newPage({ viewport: { width: 1280, height: 800 } }); sp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await sp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await sp.goto(base + 'index.html#/dive/gate');
    await sp.waitForFunction(() => { const b = document.querySelector('#diveui .seek [data-seek="diff"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#diveui .seek .seeknote b') && !!document.querySelector('#diveui .seek:not(.found)'); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': at the gate, the card does not say what to look for, or a tapped part gives nothing to notice'));
    await sp.waitForFunction(() => { const b = document.querySelector('#diveui .seek [data-seek="metal"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#diveui .seek.found') && !!document.querySelector('#diveui .askline.seeklit'); }, null, { timeout: 60000, polling: 1500 })
      .catch(() => problems.push(tag + ': at the gate, the part that leads in does not light the question'));
    await sp.evaluate(() => { location.hash = '#/place/datacentre/3'; });
    await sp.waitForFunction(() => { const b = document.querySelector('#placeui .seek [data-seek="accelerator"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#placeui .seek.found') && !!document.querySelector('#placeui .askline.seeklit'); }, null, { timeout: 120000, polling: 3000 })
      .catch(() => problems.push(tag + ': in the data centre\'s server, finding the part that does the sums does not light the question'));
    /* every level has its search (#246): at the switch, the part that turns it on and off lights the switch's question */
    await sp.evaluate(() => { location.hash = '#/dive/switch'; });
    await sp.waitForFunction(() => { const b = document.querySelector('#diveui .seek[data-seekat="switch"] [data-seek="gate"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#diveui .seek[data-seekat="switch"].found') && !!document.querySelector('#diveui .askline.seeklit'); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': at the switch, finding what turns it on and off does not light the question'));
    /* and in the phone's flight (#247): the names on the picture are the parts to tap, and the cable leads into the closed phone's question */
    await sp.evaluate(() => { location.hash = '#/place/phones/0'; });
    await sp.waitForFunction(() => { const n = document.querySelector('#flyLabels.seeking [data-hl="cable"]'); if (n && !document.querySelector('#flyui .seek [data-seek="cable"].looked')) n.click(); return !!document.querySelector('#flyui .seek[data-seekat="handset"].found') && !!document.querySelector('#flyui .askline.seeklit'); }, null, { timeout: 120000, polling: 3000 })
      .catch(() => problems.push(tag + ': in the phone\'s flight, tapping the cable\'s name on the picture does not find where the energy comes in'));
    await sp.evaluate(() => { location.hash = '#/log'; });
    await sp.waitForFunction(() => document.querySelectorAll('#page .seeklog .strand').length === 4, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': your log does not keep what you found'));
    await sp.close(); }
};

run['ways'] = async () => {
  /* the ways on the picture (src/v2/frame.js): on the island, pointing at a building with an inside says so (a ring
     round it, Go inside over it); on the line, the next station is a button along the line (→), and a station with an
     inside has its way in (↓) with the machine ringed; each is the card's own control, mirrored */
  at = 'ways'; { const tag = 'ways', wp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    wp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await wp.goto(base + 'index.html#/island');
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
  /* steps are along, levels are in · out (#266): on the line and in the studio the steps are one line from left to right,
     walked with → and Next; the rail at the side holds only the level a step shows, and is absent where it shows none.
     ↓ at the job goes in to the blocks as laid out. On a phone the steps are a strip with ← → and a count. Each page its own */
  for (const [vt, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
    at = 'ways steps ' + vt; const tag = 'ways steps ' + vt, tp = await browser3d.newPage({ viewport });
    tp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await tp.goto(base + 'index.html#/line/print');
    /* where the frame says you are: the step lit, the level on the rail (if a rail is drawn), the strip on a phone */
    await tp.evaluate(() => { window.smokeSteps = () => { const c = document.querySelector('#diveui .steps2 [aria-current]'), r = document.querySelector('#diveui .rail2'), l = r && !r.hidden && r.querySelector('[aria-current]'), stl = document.querySelector('#diveui .steps2 .stl');
      return { n: document.querySelectorAll('#diveui .steps2 [data-step]').length, step: c && c.dataset.step, level: l ? l.dataset.rail : null, rail: !!r && !r.hidden,
        levels: (r ? [...r.querySelectorAll('[data-rail]')].map(b => b.dataset.rail) : []).join(','), line: !!stl && getComputedStyle(stl).display !== 'none',
        strip: (document.querySelector('#diveui .steps2 .stk') || {}).textContent || '', hash: location.hash }; }; });
    const fail = say => () => problems.push(tag + ': ' + say), wait = { timeout: 90000, polling: 1500 };
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.n === 11 && h.step === 'print' && h.level === 'gate' && h.levels === 'chip,block,gate,switch,atom'; }, null, wait)
      .catch(fail('the line does not show its eleven steps with print lit, and the gate on a rail of levels only'));
    if (vt === 'phone') await tp.waitForFunction(() => { const h = window.smokeSteps(); return !h.line && /5/.test(h.strip) && /11/.test(h.strip); }, null, wait).catch(fail('on a phone the steps are not a strip with a count'));
    else await tp.waitForFunction(() => window.smokeSteps().line, null, wait).catch(fail('on a desktop the steps are not drawn as a line'));
    /* → walks along to the next step, and the rail follows to the switch */
    await tp.waitForFunction(() => { if (location.hash === '#/line/print') { const c = document.getElementById('diveCanvas'); c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); }
      const h = window.smokeSteps(); return h.step === 'etch' && h.level === 'switch' && h.hash === '#/line/etch'; }, null, wait).catch(fail('→ does not walk the line to etching, with the switch on the rail'));
    /* a step that shows no level has no rail */
    await tp.evaluate(() => { location.hash = '#/line/test'; });
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.step === 'test' && !h.rail; }, null, wait).catch(fail('at the test step, which shows no level, a rail of levels is still drawn'));
    /* the studio: the same line of steps; check shows no level; Next walks along to the gates */
    await tp.evaluate(() => { location.hash = '#/bench/check'; });
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.n === 6 && h.step === 'check' && !h.rail; }, null, wait).catch(fail('the studio does not show its six steps with check lit and no rail'));
    await tp.waitForFunction(() => { const b = document.querySelector('#diveui .dock [data-along][data-key="next"]'); if (b && location.hash === '#/bench/check') b.click();
      const h = window.smokeSteps(); return h.step === 'gates' && h.level === 'gate' && h.levels === 'chip,block,gate'; }, null, wait).catch(fail('Next in the studio does not walk along to the gates, with the gate on the rail'));
    /* ↓ at the job goes in, to the blocks as laid out */
    await tp.evaluate(() => { location.hash = '#/bench/need'; });
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.step === 'need' && h.level === 'chip'; }, null, wait).catch(fail('the job does not show the chip on the rail'));
    await tp.waitForFunction(() => { if (location.hash === '#/bench/need' && document.querySelector('#diveui .dock [data-in]')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const h = window.smokeSteps(); return h.step === 'layout' && h.level === 'block'; }, null, wait).catch(fail('↓ at the job does not go in to the blocks as laid out'));
    if (vt === 'desktop' && (await tp.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 0) problems.push(tag + ': the page scrolls sideways');
    await tp.close();
  }
  /* one way down through a chip (#230): the dive is the way down; the stack is the same level as made, reached along
     the loop (Make in the bar, underlined beforehand), with the address and the bar saying Make, and along back
     returns to the dive at the same level. Neither card offers a second way down, and an old address of the stack
     is the same place. A page of its own, as it moves between views */
  at = 'ways stack'; { const tag = 'ways stack', sp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    sp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await sp.goto(base + 'index.html#/dive/gate');
    const ways = ui => [...document.querySelectorAll(ui + ' .dock [data-in], ' + ui + ' .wayin:not([hidden]) .wigo')].map(e => e.getAttribute('href') || 'row ' + e.dataset.rowgo);
    await sp.waitForFunction(() => location.hash === '#/dive/gate' && !!document.querySelector('#loop [data-stage="make"].holds') && !!document.querySelector('#diveui .rail2 [aria-current][data-rail="gate"]'), null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at the dive\'s gate, the bar does not underline Make'));
    if ((await sp.evaluate(ways, '#diveui')).some(h => /^#\/chip\//.test(h))) problems.push(tag + ': the dive offers the stack as a way down');
    await sp.waitForFunction(() => { if (location.hash === '#/dive/gate') { const b = document.querySelector('#loop [data-stage="make"]'); if (b) b.click(); }
      const c = document.querySelector('#chipui .rail2 [aria-current]'), s = document.querySelector('#loop [aria-current]');
      return location.hash === '#/chip/2/build' && !document.getElementById('chipui').hidden && !!c && c.dataset.rail === 'gate' && !!s && s.dataset.stage === 'make' && /Print/.test(document.querySelector('#chipui .dock').textContent); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': along to Make from the dive\'s gate does not land on the gate as made, with the address and the bar saying Make'));
    /* the stack's only way down is its own next level; no flat dive beside it */
    const inStack = await sp.evaluate(ways, '#chipui');
    if (!inStack.length || inStack.some(h => !/^row /.test(h))) problems.push(tag + ': the gate as made offers another way down: ' + inStack.join(', '));
    if (/flat dive/i.test(await sp.textContent('#chipui').catch(() => ''))) problems.push(tag + ': the stack still offers the flat dive');
    if (!(await sp.$('#loop [data-stage="use"].holds'))) problems.push(tag + ': in the stack, the bar does not underline Use');
    await sp.waitForFunction(() => { if (location.hash === '#/chip/2/build') { const b = document.querySelector('#loop [data-stage="use"]'); if (b) b.click(); }
      const c = document.querySelector('#diveui .rail2 [aria-current]'), s = document.querySelector('#loop [aria-current]');
      return location.hash === '#/dive/gate' && !document.getElementById('diveui').hidden && !!c && c.dataset.rail === 'gate' && !!s && s.dataset.stage === 'use'; }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': along back to Use from the gate as made does not return to the dive\'s gate'));
    /* an old address of the stack still opens it, and the address then says where you are */
    await sp.evaluate(() => { location.hash = '#/chip/1'; });
    await sp.waitForFunction(() => location.hash === '#/chip/1/build' && !!document.querySelector('#chipui .rail2 [aria-current][data-rail="block"]') && ((document.querySelector('#loop [aria-current]') || {}).dataset || {}).stage === 'make', null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': an old address of the stack does not open the block as made, saying Make'));
    await sp.close(); }
  /* the dive on a phone: the card rests as a peek, opens when touched and steps aside when the picture is touched; a
     swipe up on the picture goes one level in */
  at = 'ways phone'; { const tag = 'ways phone', pp = await browser3d.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    pp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await pp.goto(base + 'index.html#/dive/chip');
    await pp.waitForSelector('#diveui .dockwrap.peek .dock .kicker', { timeout: 90000 }).catch(() => problems.push(tag + ': the dive\'s card does not rest as a peek on a phone'));
    await pp.waitForFunction(() => { const w = document.querySelector('#diveui .dockwrap'); if (w && w.classList.contains('peek')) w.click(); return !!w && !w.classList.contains('peek'); }, null, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': touching the peek does not open the card'));
    /* on the picture, above the open card (a level with a search has a taller card) */
    { const y = await pp.evaluate(() => Math.min(300, Math.round(document.querySelector('#diveui .dockwrap').getBoundingClientRect().top) - 60)), c = await pp.context().newCDPSession(pp);
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y }] }); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach(); }
    await pp.waitForSelector('#diveui .dockwrap.peek', { timeout: 15000 }).catch(() => problems.push(tag + ': touching the picture does not let the card down'));
    const swipe = async () => { const c = await pp.context().newCDPSession(pp);
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 420 }] });
      for (let i = 1; i <= 5; i++) await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 420 - i * 30 }] });
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach(); };
    let deeper = false;
    for (let i = 0; i < 4 && !deeper; i++) { await swipe(); deeper = await pp.waitForFunction(() => location.hash === '#/dive/block', null, { timeout: 15000, polling: 500 }).then(() => true, () => false); }
    if (!deeper) problems.push(tag + ': a swipe up on the picture does not go a level in');
    await pp.close(); }
};

run['frame'] = async () => {
  const tag = 'motion';
  /* how big it is here, and the ring on the way in, in every view (#231, #232, #234): a page of its own, as it moves
     between views. The layers of a chip stand in the free part of the picture, their names inside it and never under
     the card; each level on the rail says its size; the way in stands beside the next layer, the dive's next level and
     the board's chip, with a ring on it; and while the dive moves the card says how many times closer it goes */
  for (const [vt, viewport, scheme] of [['desktop', { width: 1280, height: 800 }, 'dark'], ['phone', { width: 390, height: 844 }, 'light']]) {
    const page = await browser3d.newPage({ viewport, colorScheme: scheme }), tg = tag + ' (' + vt + ')';
    await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
    page.on('pageerror', e => problems.push(tg + ' (size and ring): ' + e.message));
    await page.goto(base + 'index.html#/chip/1');
    const ringAt = ui => { const w = document.querySelector(ui + ' .wayin.at:not([hidden])'); return !!w && !!w.style.getPropertyValue('--wx') && !!w.querySelector('.wigo'); };
    await page.waitForFunction(ringAt, '#chipui', { timeout: 90000, polling: 1000 }).catch(() => problems.push(tg + ': the chip\'s layers put no ring on the way in'));
    if ((await page.$$('#chipui .rail2 .sz')).length !== 5) problems.push(tg + ': the chip\'s layers do not say their sizes on the rail');
    /* the names shown stay inside the picture, and clear of the card (polled: on a slow renderer the names may still
       stand where the frame before a resize put them, until the next frame is drawn) */
    const strayNames = () => { const c = document.getElementById('chipCanvas').getBoundingClientRect(), d = document.querySelector('#chipui .dockwrap').getBoundingClientRect();
      return [...document.querySelectorAll('#chipLabels .lbl3')].filter(e => e.style.opacity !== '0').filter(e => { const r = e.getBoundingClientRect();
        return r.left < c.left - 2 || r.right > c.right + 2 || r.top < c.top - 2 || (r.right > d.left && r.left < d.right && r.bottom > d.top && r.top < d.bottom); }).map(e => { const r = e.getBoundingClientRect(); return e.textContent + ' at ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',') + ' (picture ' + [c.right, c.bottom].map(Math.round).join(',') + ', card from ' + Math.round(d.left) + ')'; }); };
    await page.waitForFunction(f => !new Function('return (' + f + ')()')().length, strayNames.toString(), { timeout: 60000, polling: 1000 })
      .catch(async () => problems.push(tg + ': names of the chip\'s layers outside the picture or under the card: ' + (await page.evaluate(strayNames)).join(', ')));
    /* the rest is the same frame on a phone: checked once, on the desktop, to keep the run short */
    if (vt === 'phone') { await page.close(); continue; }
    await page.evaluate(() => { location.hash = '#/board'; });
    await page.waitForFunction(ringAt, '#boardui', { timeout: 90000, polling: 1000 }).catch(() => problems.push(tg + ': the board puts no ring on its way into the chip'));
    await page.evaluate(() => { location.hash = '#/dive/block'; });
    await page.waitForFunction(ringAt, '#diveui', { timeout: 90000, polling: 1000 }).catch(() => problems.push(tg + ': the dive puts no ring on the square it goes into'));
    if ((await page.$$('#diveui .rail2 .sz')).length < 5) problems.push(tg + ': the dive\'s levels do not say their sizes on the rail');
    /* going in: every line the card shows is kept, so a quick move is not missed between two polls */
    await page.evaluate(() => { window.zooms = []; const keep = () => { const l = document.querySelector('#diveui .scale2.moving:not([hidden])'); if (l) window.zooms.push(l.textContent); };
      new MutationObserver(keep).observe(document.getElementById('diveui'), { subtree: true, attributes: true, childList: true, characterData: true }); });
    await page.waitForFunction(() => { if (/#\/dive\/block$/.test(location.hash)) { const b = document.querySelector('#diveui .wayin:not([hidden]) .wigo'); if (b) b.click(); } return window.zooms.some(z => /times closer/.test(z)); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tg + ': going deeper, the card does not say how many times closer'));
    await page.close(); }
};

run['flights'] = async () => {
  const tag = 'motion';
  /* a page of its own, so its moves do not mix with the zooms counted below */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (way in): ' + e.message));
  /* the way in is on the picture (src/v2/frame.js): inside the data centre, the button over the scene goes one level
     deeper, and at the chip, scrolling on carries the flight into it */
    await page.goto(base + 'index.html#/place/datacentre/2');
  await page.waitForFunction(() => { const b = document.querySelector('#placeui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/datacentre/2') b.click(); return location.hash === '#/place/datacentre/3'; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the data centre'));
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
  /* one studio (#267): Go inside the studio on the island flies down through its opened floor into the room (the walk
     passes between outside and the first corner, never jumping), the way in by the job's wall of notes settles on it and
     hands over to the job's bench, and the bench's way up comes back to the same corner of the room. A page of its own */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } }), tg = 'studio';
    page.on('pageerror', e => problems.push(tg + ': ' + e.message));
    await page.goto(base + 'index.html#/place/studio');
    await page.evaluate(() => { window.walk = []; new MutationObserver(() => { const s = document.getElementById('studioui'), a = s && s.dataset.at; if (a != null && window.walk[window.walk.length - 1] !== a) window.walk.push(a); if (s && s.dataset.handoff) window.handed = s.dataset.handoff; })
      .observe(document.getElementById('studioui'), { attributes: true, attributeFilter: ['data-at', 'data-handoff'] }); });
    await page.waitForFunction(() => { if (location.hash === '#/place/studio') { const b = document.querySelector('#sheet:not([hidden]) [data-deeper]'); if (b) b.click(); }
      return location.hash === '#/place/studio/1' && !document.getElementById('studioui').hidden; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tg + ': going inside the studio on the island does not open the room'));
    await page.waitForFunction(() => document.getElementById('studioui').dataset.at === '1.0', null, { timeout: 90000, polling: 500 }).catch(() => problems.push(tg + ': the flight into the studio does not come to rest at the first corner'));
    if (!(await page.evaluate(() => window.walk.length > 2 && window.walk.some(a => +a > 0 && +a < 1)))) problems.push(tg + ': the studio is entered with a cut, not a flight down into the room (' + (await page.evaluate(() => window.walk.join(' '))) + ')');
    if (!(await page.evaluate(() => { const c = document.querySelector('#studioui .steps2 [aria-current]'), r = document.querySelector('#studioui .rail2 [aria-current]'); return !!c && c.dataset.step === 'need' && !!r && r.dataset.rail === 'chip'; }))) problems.push(tg + ': at the first corner the frame does not say the job, and the chip on the rail');
    /* the handoff: the way in stands by the screen; taken, the camera settles on it and the job's bench takes over */
    await page.waitForFunction(() => { const b = document.querySelector('#studioui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/studio/1' && !window.handed) b.click(); return location.hash === '#/bench/need' && !document.getElementById('diveui').hidden; }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tg + ': the way in at the job\'s corner does not hand over to its bench'));
    if (!(await page.evaluate(() => window.handed === 'need'))) problems.push(tg + ': the bench opened without the camera settling on the corner\'s screen first');
    await page.waitForFunction(() => { const u = document.querySelector('#diveui .homebtn'); if (u && location.hash === '#/bench/need' && u.getAttribute('href') === '#/place/studio/1') u.click(); return location.hash === '#/place/studio/1' && !document.getElementById('studioui').hidden; }, null, { timeout: 60000, polling: 2000 })
      .catch(() => problems.push(tg + ': stepping out of the bench does not return to its corner of the room'));
    await page.close(); }
  /* a phone is flown through like the data centre (src/v2/phone3d-flight.js): going inside the phone island opens the
     flight, the way in on the picture goes deeper, and going on past the chip carries the flight into the dive's phone
     chip, which comes down from where the flight ended */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (phone flight): ' + e.message));
    await page.goto(base + 'index.html#/place/phones');
    await page.waitForFunction(() => { if (location.hash === '#/place/phones') { const b = document.querySelector('.insp:not([hidden]) [data-iact="deeper"]') || document.querySelector('#sheet:not([hidden]) a[href="#/place/phones/0"]'); if (b) b.click(); }
      return location.hash === '#/place/phones/0' && !document.getElementById('flyui').hidden; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tag + ': going inside the phone island does not open its flight'));
    await page.waitForFunction(() => { const b = document.querySelector('#flyui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/phones/0') b.click(); return location.hash === '#/place/phones/1'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the phone'));
    await page.waitForFunction(() => !!document.querySelector('#flyui .seek [data-seek="battery"][data-hl="battery"]'), null, { timeout: 90000, polling: 1000 }).catch(() => problems.push(tag + ': inside the phone, the card does not name the battery among the parts to look at'));
    await page.evaluate(() => { location.hash = '#/place/phones/3'; window.arrivals = []; new MutationObserver(() => { const a = document.documentElement.dataset.arrive; if (a) window.arrivals.push(a); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arrive'] }); });
    await page.waitForFunction(() => { const c = document.getElementById('flyCanvas'); if (c && location.hash === '#/place/phones/3') { c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); } return location.hash === '#/dive/soc/phone'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': going on past the phone\'s chip does not carry the flight into it'));
    await page.waitForFunction(() => window.arrivals.includes('soc'), null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': the dive\'s phone chip does not come down from where the flight ended'));
    await page.close(); }
  /* and so is a car (src/v2/car3d-flight.js): going inside the car island opens its flight, the way in on the picture
     goes deeper (the cabin cut away, its card naming the battery), the control unit's card names its chip, and going on
     past the chip carries the flight into the dive's car chip, which comes down from where the flight ended */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (car flight): ' + e.message));
    await page.goto(base + 'index.html#/place/cars');
    await page.waitForFunction(() => { if (location.hash === '#/place/cars') { const b = document.querySelector('.insp:not([hidden]) [data-iact="deeper"]') || document.querySelector('#sheet:not([hidden]) a[href="#/place/cars/0"]'); if (b) b.click(); }
      return location.hash === '#/place/cars/0' && !document.getElementById('carui').hidden; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tag + ': going inside the car island does not open its flight'));
    await page.waitForFunction(() => { const b = document.querySelector('#carui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/cars/0') b.click(); return location.hash === '#/place/cars/1'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the car'));
    await page.waitForFunction(() => !!document.querySelector('#carui .here2 [data-hl="battery"]'), null, { timeout: 90000, polling: 1000 }).catch(() => problems.push(tag + ': inside the car, the card does not name the battery'));
    await page.waitForFunction(() => { const b = document.querySelector('#carui [data-lvgo="2"]'); if (b && location.hash === '#/place/cars/1') b.click(); return location.hash === '#/place/cars/2' && !!document.querySelector('#carui .here2 [data-hl="mcu"]'); }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the car\'s control unit does not open with its chip named'));
    await page.evaluate(() => { location.hash = '#/place/cars/3'; window.arrivals = []; new MutationObserver(() => { const a = document.documentElement.dataset.arrive; if (a) window.arrivals.push(a); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arrive'] }); });
    await page.waitForFunction(() => { const c = document.getElementById('carCanvas'); if (c && location.hash === '#/place/cars/3') { c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); } return location.hash === '#/dive/mcu/car'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': going on past the car\'s chip does not carry the flight into it'));
    await page.waitForFunction(() => window.arrivals.includes('mcu'), null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': the dive\'s car chip does not come down from where the flight ended'));
    await page.close(); }
};

run['machines'] = async () => {
  /* machines from shared blocks (#/machines, src/v2/machines.js): a flat page of its own, a fresh visitor */
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const tag = 'machines ' + w, fp = await browser.newPage({ viewport: { width: w, height: h } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await fp.goto(base + 'index.html#/machines/hearing');
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mpart').length === 4 && !!document.querySelector('.mach .mchecks li.bad'), null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': the hearing aid does not start as circuits that miss its need'));
    /* the filter made software: the machine meets its need */
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="filter:software"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!b && !document.querySelector('.mach .mchecks li.bad'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': a filter made software does not meet the need'));
    /* the agent offers a real choice, and a pick is used */
    await fp.waitForFunction(() => { const a = document.querySelector('[data-magent]'); if (a) a.click(); return document.querySelectorAll('.mach .mpick').length >= 2; }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the agent does not offer a choice'));
    await fp.waitForFunction(() => { const u = document.querySelector('[data-muse="0"]'); if (u) u.click(); return !!document.querySelector('.mach .mpick.on'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': a pick is not put to use'));
    /* fab on a desk: memory that computes is made only in a giant fab; on a desk the grammar breaks, back in the giant
       fab it holds, and a try there takes months */
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="filter:matter:cim"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); const d = document.querySelector('[data-mfab="desk"]'); if (d && d.getAttribute('aria-pressed') !== 'true') d.click(); return !!document.querySelector('.mach .mchecks li.bad'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': a fab on a desk does not refuse memory that computes'));
    await fp.waitForFunction(() => { const g = document.querySelector('[data-mfab="giant"]'); if (g && g.getAttribute('aria-pressed') !== 'true') g.click(); return !document.querySelector('.mach .mchecks li.bad') && /126/.test([...document.querySelectorAll('.mach .mread b')].map(b => b.textContent).join(' ')); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the giant fab does not show months a try'));
    /* Moore's law for ideas: the lab's curve draws the attempts kept, the best so far, and where yours would land; kept, yours joins it */
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mcurve .dot:not(.you)').length >= 4 && !!document.querySelector('.mach .mcurve .best') && !!document.querySelector('.mach .mcurve .dot.you'), null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the lab\'s curve does not draw'));
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="filter:matter:living"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); const n = document.querySelector('.mach .mkeep [data-sign]'); if (n && !n.value) n.value = 'Smoke'; const k = document.querySelector('[data-mkeep]'); if (k && !document.querySelector('.mach .mkeep .slip')) k.click(); return !!document.querySelector('.mach .mkeep .slip') && !!document.querySelector('.mach .mcurve .dot.mine'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': an attempt is not kept on the curve'));
    /* beyond today's chip: a part made of living neurons shows its claims, guesses labelled, and a range */
    await fp.evaluate(() => { location.hash = '#/machines/wildfire'; });
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="detect:matter:living"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b) { const m = document.querySelector('[data-mform^="detect:matter"]'); if (m) m.click(); } return document.querySelectorAll('.mach .mclaims .mst.s-guess').length >= 2 && /–/.test((document.querySelector('.mach .mread b') || {}).textContent || ''); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': new matter does not show its claims and its range'));
    /* the agent told to count guesses */
    await fp.waitForFunction(() => { const g = document.querySelector('[data-mguess]'); if (g && !g.checked) g.click(); const a = document.querySelector('[data-magent]'); if (a) a.click(); return !!g && g.checked && document.querySelectorAll('.mach .mpick').length >= 2; }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the agent cannot be told to count guesses'));
    /* liquid hardware: a radio whose job changes every 100 ns; an FPGA rewires too slowly, an array rewired every tick keeps up,
       and the map draws the line the parts must beat */
    await fp.evaluate(() => { location.hash = '#/machines/radio'; });
    await fp.waitForFunction(() => { const pick = s => { const b = document.querySelector('[data-mform="' + s + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };
      if (!document.querySelector('[data-mform="find:liquid:fpga"]')) pick('find:liquid:fpga'); pick('find:liquid:fpga'); pick('mix:liquid:fpga');
      return [...document.querySelectorAll('.mach .mchecks li.bad')].length >= 2 && !!document.querySelector('.mach .lmap .every') && !!document.querySelector('.mach .mliquid .mclaims'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': an FPGA does not miss a job that changes every 100 ns'));
    await fp.waitForFunction(() => { ['find:liquid:cgra', 'mix:liquid:cgra'].forEach(s => { const b = document.querySelector('[data-mform="' + s + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
      return !document.querySelector('.mach .mchecks li.bad') && document.querySelectorAll('.mach .lmap .pt.f-liquid').length >= 1; }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': an array rewired every tick does not keep up'));
    /* another need, its own machine; nothing scrolls sideways */
    await fp.evaluate(() => { location.hash = '#/machines/rover'; });
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mpart').length === 5, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the rover\'s machine does not open'));
    const side = await fp.evaluate(() => { const p = document.querySelector('.page'); return p ? p.scrollWidth - p.clientWidth : 0; });
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await fp.close();
  }
};

run['frame2'] = async () => {
  /* the new frame, only behind ?frame=2 (src/v2/frame2.js, #271): Look is a caption on the picture with the level's
     name and its whole question; Do gives a lab's instrument the stage, its controls in the side panel beside it. A
     flat page of its own (a fresh visitor), as the labs' are; every move is done again inside the poll */
  { const tag = 'frame2', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } }); fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await fp.goto(base + 'index.html?frame=2#/dive/block');
    /* the caption: bottom left on the picture, the level's name as its title, the question whole (never cut), Read more and Do */
    await fp.waitForFunction(() => { const w = document.querySelector('#diveui.f2cap > .dockwrap'), q = w && w.querySelector('.dock > .askline'), h = w && w.querySelector('.f2head .f2t');
      if (!w || !q || !h || !h.textContent.trim() || !w.querySelector('[data-f2open]') || !w.querySelector('.f2do')) return false;
      const r = w.getBoundingClientRect(), qr = q.getBoundingClientRect(), fs = parseFloat(getComputedStyle(q).fontSize);
      return r.left < innerWidth / 2 && r.bottom <= innerHeight && r.top > 0 && qr.top >= r.top && qr.bottom <= r.bottom && q.scrollHeight <= q.clientHeight + 1 && fs >= 15; }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at the block, the caption does not show the level\'s name and its whole question on the picture'));
    /* Read more: the whole card in the side panel, and back to the caption */
    await fp.waitForFunction(() => { const b = document.querySelector('#diveui.f2cap [data-f2open]'); if (b) b.click(); return !!document.querySelector('#diveui.f2side.f2open .f2more .nav'); }, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': Read more does not open the whole card in the side panel'));
    /* Do: Half the power, its chart on the stage left of the panel, its dials in the panel and in sight; won by the dials */
    await fp.evaluate(() => { location.hash = '#/do/power-curve'; });
    await fp.waitForFunction(() => { const set = (q, v) => { const i = document.querySelector(q); if (i && i.value !== String(v)) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } };
      const host = document.querySelector('#diveui.f2stage'), panel = host && host.querySelector('.dockwrap'), inst = host && host.querySelector('.player[data-ch="power-curve"] [data-f2="instrument"]'), goal = host && host.querySelector('[data-f2="goal"]');
      if (!panel || !inst || !goal) return false;
      set('#ckp-f', 2.25); set('#ckp-v', 0.61);
      const P = panel.getBoundingClientRect(), I = inst.getBoundingClientRect(), G = goal.getBoundingClientRect(), dials = [...panel.querySelectorAll('#ckp-f, #ckp-v')].map(d => d.getBoundingClientRect());
      return I.right <= P.left && I.width > 500 && I.height > 300 && G.bottom <= I.top && G.right <= P.left && dials.length === 2 && dials.every(d => d.left >= P.left && d.right <= P.right && d.top >= P.top && d.bottom <= innerHeight)
        && !!host.querySelector('.f2where:not([hidden])') && !!host.querySelector('.player .won'); }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': Half the power is not won in Do mode with its chart on the stage and its dials in the panel beside it'));
    /* where you are leads back to the picture, and its caption */
    await fp.waitForFunction(() => { const w = document.querySelector('#diveui .f2where:not([hidden])'); if (w) w.click(); return !!document.querySelector('#diveui.f2cap .f2head'); }, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': where you are does not lead back to the caption'));
    /* the bench in Do mode (#268): a bench challenge's layout takes the stage, the bench over the picture steps aside */
    await fp.evaluate(() => { location.hash = '#/do/floor'; });
    await fp.waitForFunction(() => { const host = document.querySelector('#diveui.f2stage'), panel = host && host.querySelector('.dockwrap'), inst = host && host.querySelector('.player[data-ch="floor"] .benchinst[data-f2="instrument"]'), goal = host && host.querySelector('.player[data-ch="floor"] [data-f2="goal"]');
      if (!panel || !inst || !goal) return false; const P = panel.getBoundingClientRect(), I = inst.getBoundingClientRect(), sf = document.querySelector('.bsurf');
      return I.right <= P.left && I.width > 400 && I.height > 300 && !!inst.querySelector('[data-bk-cell]') && (!sf || getComputedStyle(sf).visibility === 'hidden' || sf.hidden); }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': the shortest wire does not put the bench on the stage in Do mode'));
    const side = await fp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await fp.close(); }
  /* a phone: the caption is the sheet, and at rest it shows the level's name and the whole question */
  { const tag = 'frame2 phone', pp = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); pp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await pp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await pp.goto(base + 'index.html?frame=2#/dive/gate');
    await pp.waitForFunction(() => { const w = document.querySelector('#diveui.f2cap > .dockwrap.peek'), q = w && w.querySelector('.dock > .askline'), h = w && w.querySelector('.f2head .f2t');
      if (!q || !h) return false; const r = w.getBoundingClientRect(), qr = q.getBoundingClientRect(), hr = h.getBoundingClientRect();
      return hr.top >= r.top && qr.bottom <= r.bottom + 1 && q.scrollHeight <= q.clientHeight + 1 && w.scrollHeight <= w.clientHeight + 1 && r.bottom <= innerHeight; }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at rest, the sheet does not show the level\'s name and the whole question'));
    const side = await pp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await pp.close(); }
  /* Read (#273): a question's page is a reading page in the frame, a column of about 70 characters at 18 to 18.5 px
     with its picture pinned beside it (first on a phone, under the title); the bar says Reading and lights no stage;
     the way back leads to where you came from (here, your log) */
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const tag = 'frame2 read ' + w, rp = await browser.newPage({ viewport: { width: w, height: h } }); rp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await rp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await rp.goto(base + 'index.html?frame=2#/log');
    await rp.waitForFunction(() => { if (location.hash !== '#/w/fail' && document.querySelector('#page:not([hidden]) [data-jump]')) location.hash = '#/w/fail';
      const page = document.querySelector('#page.f2rd:not([hidden])'), art = page && page.querySelector('.f2read.world'), col = art && art.querySelector('.f2col'), pic = art && art.querySelector('.f2pic'), head = art && art.querySelector('.f2rhead'), p = col && col.querySelector('p');
      const bar = document.querySelector('.bar.f2reading'), rk = bar && bar.querySelector('.loop .f2rk'), back = page && page.querySelector('.f2back');
      if (!col || !pic || !head || !p || !rk || !back) return false;
      const fs = parseFloat(getComputedStyle(p).fontSize), C = col.getBoundingClientRect(), P = pic.getBoundingClientRect(), H = head.getBoundingClientRect(), ch = C.width / (fs * 0.5);
      const placed = innerWidth > 720 ? P.right <= C.left && getComputedStyle(pic).position === 'sticky' && P.top >= 60 && P.bottom <= innerHeight + 1 : P.top >= H.bottom - 1 && C.top >= P.bottom - 1;
      return fs >= 18 && fs <= 18.5 && (innerWidth <= 720 || (ch >= 60 && ch <= 80)) && placed && !!rk.textContent.trim() && !bar.querySelector('.loop [aria-current]') && back.getAttribute('href') === '#/log'; }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': a question\'s page is not a reading column of about 70 characters at 18 to 18.5 px with its picture beside it (first on a phone), the bar saying Reading with no stage lit and a way back to the log'));
    const side = await rp.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, (() => { const p = document.querySelector('#page'); return p ? p.scrollWidth - p.clientWidth : 0; })()));
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await rp.close(); }
};

/* the sections asked for, in order; each says how long it took, so the groups in CI can be balanced */
const times = [];
for (const [name] of SECTIONS) {
  if (only && !only.includes(name)) continue;
  at = name; const t0 = Date.now(), n0 = problems.length;
  try { await run[name](); } catch (e) { problems.push(name + ': the section stopped: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
  const s = Math.round((Date.now() - t0) / 1000); times.push(name + ' ' + s + ' s');
  console.log('Section ' + name + ': ' + s + ' s' + (problems.length > n0 ? ', ' + (problems.length - n0) + ' problem(s)' : ''));
}
await browser.close(); await browser3d.close(); server.close();
if (problems.length) { console.error('Smoke test found problems (' + times.join(', ') + '):\n' + problems.join('\n')); process.exit(1); }
console.log((only ? 'Smoke test passed (' + only.join(', ') + '): ' : 'Smoke test passed: ') + 'the dive works in every world, and the redesign\'s island plays, on desktop and phone, in dark and light.');
