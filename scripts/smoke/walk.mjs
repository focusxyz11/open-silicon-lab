/* the walk the two explore sections take, one at a desktop's width, one at a phone's */
import { S } from './shared.mjs';

/* what the first page may fetch before its idle preload, in bytes (it was 3.4 MB with the island's 3D and every word;
   now no 3D, the shell's glue per view, and only the core words) */
const FIRST_PAGE_BYTES = 1.5e6;

/* the chip world (index.html): your chip's life on the island. The first challenge is played and won, the island
   grows and says so (the first fixed with one tap), the tracker in the bar moves on; a place opens its three doors in the dock, Look first with a way inside; the pages list every challenge and the plan. */
export const explore = async (tag, viewport, scheme) => {
  const { browser3d, base, problems } = S;
  S.at = tag; const page = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' });
  /* the software renderer here is slow: pin the quality, so the 3D levels are tested as 3D (the fallback has its own page) */
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
  /* the first page loads no 3D (docs/ARCHITECTURE.md): before its idle preload starts (data-preload, the moment it
     started), nothing of three.js or the 3D views is fetched, and what is fetched stays under a budget */
  if (viewport.width > 760) {
    const fp = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' });
    fp.on('pageerror', e => problems.push(tag + ': first page: ' + e.message));
    await fp.goto(base + 'index.html#/');
    await fp.waitForFunction(() => !!document.documentElement.dataset.preload, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page never starts its idle preload'));
    await fp.waitForLoadState('networkidle').catch(() => { /* measured as it stands */ });
    const early = await fp.evaluate(origin => { const pre = +document.documentElement.dataset.preload || Infinity;
      return performance.getEntriesByType('resource').filter(e => e.startTime < pre && e.name.startsWith(origin)).map(e => ({ u: e.name, b: e.decodedBodySize })); }, new URL(base).origin);
    const heavy = early.filter(e => /\/(three\.min|three-extras|kit3d|map3d|dc3d|chip3d|level3d)\.js/.test(e.u)).map(e => e.u.split('/').pop());
    if (heavy.length) problems.push(tag + ': the first page fetches 3D before its preload: ' + heavy.join(', '));
    const bytes = early.reduce((a, e) => a + e.b, 0);
    if (!(bytes < FIRST_PAGE_BYTES)) problems.push(tag + ': the first page fetches ' + Math.round(bytes / 1024) + ' KB before its preload (budget ' + Math.round(FIRST_PAGE_BYTES / 1024) + ' KB)');
    /* of the words, only the core area's and the first page's own */
    const words = early.filter(e => /\/src\/i18n\//.test(e.u)).map(e => e.u.split('/src/i18n/')[1]);
    if (words.sort().join() !== 'en/blueprint.json,en/core.json') problems.push(tag + ': the first page fetches words beyond core.json and its own (blueprint.json): ' + words.join(', '));
    await fp.close();
  }
  await page.goto(base + 'index.html#/island');
  /* the structure (docs/reviews/structure.md): no menu; the bar holds the loop, six stages from the need round to use.
     Following the chip opens the place where the loop starts, the Lab, and every place's card offers the next: the
     studio comes after it, and its first challenge is under Do */
  await page.waitForSelector('#loop [data-stage]', { timeout: 15000 }).catch(() => problems.push(tag + ': the bar does not hold the loop'));
  if ((await page.$$('#loop [data-stage]')).length !== 6) problems.push(tag + ': the loop does not show its six stages');
  if (await page.$('#sections')) problems.push(tag + ': the menu of sections shows without being asked for');
  /* the first card over the island: where the questions are (marks on the pictures, a way to the first ones) and the
     next challenges; never a list of questions from the worlds (#305) */
  if (!(await page.$('#hero p.heroq')) || !(await page.$('#hero a[href="#/dive/block"]'))) problems.push(tag + ': the first card does not offer the marks on the pictures');
  if (await page.$('#hero .qcard, #hero a[href="#/w"]')) problems.push(tag + ': the first card still lists the worlds\' questions');
  if (!(await page.$('#hero .heroc a'))) problems.push(tag + ': the first page offers no challenge');
  /* exploring folds the questions into a button in the corner, which opens them again */
  /* the island may still be in the making when the bar shows: the wheel is turned again on every poll until it answers */
  await page.waitForFunction(() => { if (!document.querySelector('#hero.folded [data-unfold]')) document.getElementById('mapCanvas').dispatchEvent(new WheelEvent('wheel', { deltaY: -60, bubbles: true, cancelable: true }));
    return !!document.querySelector('#hero.folded [data-unfold]'); }, null, { timeout: 30000, polling: 500 }).catch(() => problems.push(tag + ': exploring does not fold the first page\'s questions away'));
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
  /* the first win of the design stage, out of every challenge on that step (src/v2/game.js), so a new challenge there needs no edit here */
  { const designs = (await import('../../src/v2/game.js')).CHALLENGES.filter(c => c.step === 'design').length;
    if (!new RegExp('\\b1 of ' + designs + '\\b').test(await page.getAttribute('#loop [data-stage="design"]', 'aria-label').catch(() => ''))) problems.push(tag + ': the tracker did not count the win (1 of ' + designs + ')'); }
  await page.click('#sheet [data-next]').catch(() => problems.push(tag + ': no way on to the next challenge'));
  if (!/voter/i.test(await page.textContent('#sheet .player h3').catch(() => ''))) problems.push(tag + ': the next challenge is not the majority voter');
  /* back to the studio's card: in Do mode on a desktop the way back is where you are, over the picture (the player's
     own back waits until Look); on a phone the challenge is played in the sheet with its back */
  await page.click('#stage > .f2where.f2isle:not([hidden]), #sheet:not(.f2stage) [data-back]');
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
  /* there is no list of the worlds: the old address opens the map (#305) */
  await page.evaluate(() => { location.hash = '#/w'; });
  await page.waitForFunction(() => location.hash === '#/' && !!document.querySelector('#home:not([hidden])') && !document.querySelector('#page:not([hidden]) .qgrid'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': #/w does not land on the map'));
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
  S.at = tag + ' 3D switch'; await page.evaluate(() => { location.hash = '#/dive/switch'; });
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
  S.at = tag + ' follow the joule';
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
  S.at = tag + ' dives and map'; await page.evaluate(() => { location.hash = '#/dive/phone/phone'; });
  /* the way deeper stands on the picture (the frame's way in; the card's own copy waits under Read more) */
  await page.waitForSelector('#diveui .wayin:not([hidden]) .wigo', { timeout: 20000 }).catch(() => problems.push(tag + ': the phone dive did not open with a way deeper'));
  /* the phone itself in 3D, taken apart, with its four names */
  await page.waitForFunction(() => document.querySelectorAll('#l3-phone [data-part3]').length === 4 && !document.getElementById('l3-phone').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the phone did not appear in 3D'));
  /* the phone's board is a 3D board, like the data centre's, with its four names */
  await page.evaluate(() => { location.hash = '#/dive/phoneboard/phone'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-phoneboard [data-part3]').length === 4 && !document.getElementById('l3-phoneboard').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the phone board did not appear in 3D'));
  /* the flat dive's words are HTML over the picture: names at rest, a note on a picked part, marks only under Ask
     (on the car, a level kept flat on purpose) */
  await page.evaluate(() => { location.hash = '#/dive/car/car'; });
  await page.waitForSelector('#diveui .wayin:not([hidden]) .wigo', { timeout: 20000 }).catch(() => {});
  await page.waitForSelector('#flatLabels [data-fpart]', { timeout: 15000 }).catch(() => problems.push(tag + ': the flat dive shows no names'));
  if (await page.$('#flatLabels .q3')) problems.push(tag + ': question marks show while looking');
  await page.click('#flatLabels [data-fpart]').catch(() => problems.push(tag + ': a name in the flat dive cannot be picked'));
  await page.waitForSelector('#flatLabels .swnote:not([hidden])', { timeout: 10000 }).catch(() => problems.push(tag + ': picking a part opened no note'));
  /* Ask, a face of the card (on a phone, in the sheet: a peek opens first) */
  await page.waitForFunction(() => { if (document.querySelector('#flatLabels .q3')) return true; const w = document.querySelector('#diveui .dockwrap'), b = document.querySelector('#diveui .modes3 [data-mode="ask"]');
    if (w && w.classList.contains('peek')) w.click(); else if (b && b.offsetParent && b.getAttribute('aria-selected') !== 'true') b.click(); return false; }, null, { timeout: 10000, polling: 500 })
    .catch(() => problems.push(tag + ': under Ask the questions have no marks on the picture'));
  await page.click('#diveui [data-mode="look"]').catch(() => {});
  /* the wafer in 3D, with its two names */
  await page.evaluate(() => { location.hash = '#/dive/wafer/made'; });
  await page.waitForFunction(() => document.querySelectorAll('#l3-wafer [data-part3]').length === 2 && !document.getElementById('l3-wafer').hidden, null, { timeout: 25000 }).catch(() => problems.push(tag + ': the wafer did not appear in 3D'));
  await page.evaluate(() => { location.hash = '#/dive/scanner/made'; });
  await page.waitForFunction(() => /scanner|light|machine/i.test(document.querySelector('#diveui .dock') ? document.querySelector('#diveui .dock').textContent : ''), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the made chip did not open at the machine'));
  await page.evaluate(() => { location.hash = '#/supply'; });
  /* the places are in the map's card (on a phone, in the sheet: a peek opens first) */
  await page.waitForFunction(() => { const p = document.querySelector('#diveui .dock [data-site]'); if (p && p.offsetParent) return true; const w = document.querySelector('#diveui .dockwrap'); if (p && w && w.classList.contains('peek')) w.click(); return false; }, null, { timeout: 20000, polling: 500 })
    .catch(() => problems.push(tag + ': the supply map did not open with its places'));
  await page.evaluate(() => { location.hash = '#/place/fab'; });
  await page.waitForSelector('#sheet .lvchips a', { timeout: 15000 }).catch(() => {});
  if (await page.$('#sheet .lvchips a.old, #sheet a[href*="classic"]')) problems.push(tag + ': a level of the factory still leads to the earlier site');
  /* the commons (docs/reviews/community.md): the ledger offers a design that passed its test; one paused tick breaks it;
     the case is kept as yours, with the one link that adds it to the ledger as a new file; the island shows the design
     broken and the case standing guard; and a question can be asked under a question, kept the same way */
  S.at = tag + ' commons'; await page.evaluate(() => { location.hash = '#/do/break:2026-11-12-design-studio-agent-counter'; });
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
  S.at = tag + ' ' + '#/questions'; await page.evaluate(() => { location.hash = '#/questions'; });
  await page.waitForSelector('#page .qcard', { timeout: 10000 }).catch(() => problems.push(tag + ': the questions page shows no questions'));
  if (await page.$('#page .qcard[href*="classic"]')) problems.push(tag + ': a question still leads to the earlier site');
  S.at = tag + ' ' + '#/ask/think/gate'; await page.evaluate(() => { location.hash = '#/ask/think/gate'; });
  await page.waitForSelector('#diveui .dock .trailq', { timeout: 20000 }).catch(() => problems.push(tag + ': following a question did not show its stop in the dive'));
  await page.click('#diveui .dock [data-key="next"]').catch(() => problems.push(tag + ': a stop has no next stop'));
  await page.waitForFunction(() => location.hash === '#/ask/think/switch', null, { timeout: 15000 }).catch(() => problems.push(tag + ': the next stop is not the switch'));
  await page.waitForSelector('#diveui .dock .root2', { timeout: 15000 }).catch(() => problems.push(tag + ': after two stops the question underneath did not show'));
  S.at = tag + ' ' + '#/challenges'; await page.evaluate(() => { location.hash = '#/challenges'; });
  await page.waitForSelector('#page .stepsec', { timeout: 10000 }).catch(() => {});
  if ((await page.$$('#page #log-challenges ~ .stepsec')).length !== 6) problems.push(tag + ': the log does not show the five steps\' challenges and the open jobs');
  /* a challenge is played where its level is shown: the card of the factory's line, with the machines behind it */
  S.at = tag + ' do in place'; await page.evaluate(() => { location.hash = '#/do/quick'; });
  await page.waitForSelector('#diveui .dock .player', { timeout: 20000 }).catch(() => problems.push(tag + ': a factory challenge is not played in the line\'s card'));
  if (!(await page.evaluate(() => { const c = document.querySelector('#diveui .steps2 [aria-current]'); return c && c.dataset.step === 'deposit'; }))) problems.push(tag + ': the challenge is not played at its own level');
  if ((await page.getAttribute('#diveui .modes3 [aria-selected="true"]', 'data-mode').catch(() => '')) !== 'do') problems.push(tag + ': a challenge in the card is not under Do');
  await page.click('#diveui .modes3 [data-mode="look"]').catch(() => {});
  if (await page.$('#diveui .dock .player')) problems.push(tag + ': Look does not lead back from a challenge to the story');
  S.at = tag + ' ' + '#/build'; await page.evaluate(() => { location.hash = '#/build'; });
  await page.waitForSelector('#sheet .tree [data-piece]', { timeout: 10000 }).catch(() => problems.push(tag + ': the build page has no plan'));
  /* inside a chip there is one way down, the dive; the layers of the chip as made are the same levels, along the loop */
  S.at = tag + ' ' + '#/dive/block'; await page.evaluate(() => { location.hash = '#/dive/block'; });
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'block'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the dive did not open at the block'));
  /* along: Make in the bar turns the block to the same level as made, the stack's row of wires */
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the block'));
  await page.waitForFunction(() => location.hash === '#/chip/1/build' && /Wires/.test((document.querySelector('#chipui .dock') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
  /* the frame: the rail, Look · Do · Ask from the atlas */
  if (!/Wires/.test(await page.textContent('#chipui .dock').catch(() => ''))) problems.push(tag + ': turning to made does not name the step that made this layer');
  await page.waitForFunction(() => !!document.querySelector('#chipui .rail2 [aria-current][data-rail="block"]'), null, { timeout: 15000 }).catch(() => problems.push(tag + ': the layers as made are not at the level the dive was at'));
  await page.click('#chipui [data-rowgo="2"]').catch(() => problems.push(tag + ': no way deeper in the layers as made'));
  await page.waitForFunction(() => { const c = document.querySelector('#chipui .rail2 [aria-current]'); return c && c.dataset.rail === 'gate' && location.hash === '#/chip/2/build'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper in the layers as made did not reach the gates'));
  /* Ask: the core questions that live at the level are met on the picture, as marks (docs/FRAME13.md); one tapped is
     shown alone, another tapped shows that one instead, and no row of their names is drawn */
  await page.waitForFunction(() => { const b = document.querySelector('#chipui .modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click();
    const m = [...document.querySelectorAll('#chipui .mark3')].find(x => !x.hidden); if (m && !document.querySelector('#chipui .dock .qlcard')) m.click();
    return !!document.querySelector('#chipui .dock .qlcard .qlq') && document.querySelectorAll('#chipui .mark3[aria-pressed="true"]').length === 1 && !document.querySelector('.qlbar'); }, null, { timeout: 15000, polling: 500 })
    .catch(() => problems.push(tag + ': Ask shows no marks at this level, or a tapped one does not open its lens alone'));
  { const q0 = await page.textContent('#chipui .dock .qlcard .qlq').catch(() => '');
    await page.waitForFunction(q => { const q1 = document.querySelector('#chipui .dock .qlcard .qlq');
      if (q1 && q1.textContent !== q && document.querySelectorAll('#chipui .dock .qlcard').length === 1) return true;
      const other = [...document.querySelectorAll('#chipui .mark3:not([aria-pressed="true"])')].find(x => !x.hidden); if (other) other.click(); return false; }, q0, { timeout: 15000, polling: 500 })
      .catch(() => problems.push(tag + ': tapping another mark does not show its question alone')); }
  await page.click('#chipui .dock [data-mode="look"]').catch(() => {});
  /* the flat dive in the frame: the rail follows it down, and the Turn leads to the same level as made */
  S.at = tag + ' ' + '#/dive/gate'; await page.evaluate(() => { location.hash = '#/dive/gate'; });
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'gate'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the dive did not open at the gate'));
  await page.click('#diveui .wayin:not([hidden]) .wigo[data-divego]').catch(() => problems.push(tag + ': no way deeper in the dive'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .rail2 [aria-current]'); return c && c.dataset.rail === 'switch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': going deeper in the dive did not reach the switch'));
  if (!(await page.$('#loop [data-stage="make"].holds'))) problems.push(tag + ': the loop does not say that Make holds the level in view');
  await page.click('#loop [data-stage="make"]').catch(() => problems.push(tag + ': no way along the loop from the dive'));
  await page.waitForFunction(() => location.hash === '#/chip/3/build' && /Etch/.test((document.querySelector('#chipui .dock') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => problems.push(tag + ': turning the switch to made did not open its layer as made'));
  /* and from the layer as made, its step on the factory's line (in the card's rest: Read more, or the sheet opened) */
  await page.waitForFunction(() => { const a = document.querySelector('#chipui .dock a[href="#/line/etch"]'); if (a && a.offsetParent) return true;
    const m = document.querySelector('#chipui [data-f2open]'), w = document.querySelector('#chipui .dockwrap'); if (m && m.offsetParent) m.click(); else if (w && w.classList.contains('peek')) w.click(); return false; }, null, { timeout: 15000, polling: 500 }).catch(() => {});
  await page.click('#chipui .dock a[href="#/line/etch"]').catch(() => problems.push(tag + ': the switch as made does not lead to its step on the line'));
  await page.waitForFunction(() => location.hash === '#/line/etch', null, { timeout: 8000 }).catch(() => problems.push(tag + ': the layer as made did not open its factory step'));
  /* the line: the factory step by step, in the frame */
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .steps2 [aria-current]'); return c && c.dataset.step === 'etch'; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the line did not open at etching'));
  /* the next step along stands on the picture (the frame's way along) */
  await page.click('#diveui .wayon:not([hidden]) .wogo[data-divego]').catch(() => problems.push(tag + ': no next step on the line'));
  await page.waitForFunction(() => { const c = document.querySelector('#diveui .steps2 [aria-current]'); return c && c.dataset.step === 'implant'; }, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the next step on the line is not implanting'));
  /* the bench: a design written in the dock, checked, won */
  S.at = tag + ' ' + '#/bench/logic/half'; await page.evaluate(() => { location.hash = '#/bench/logic/half'; });
  await page.waitForSelector('#diveui .dock .player [data-write], #diveui .dock #chCode', { timeout: 15000 }).catch(() => problems.push(tag + ': the bench did not open the design'));
  await page.click('#diveui .dock [data-write]', { timeout: 3000 }).catch(() => {});   /* the half adder opens for tapping; write it instead */
  await page.fill('#diveui .dock #chCode', 'sum = a ^ b;\ncarry = a & b;').catch(() => {});
  await page.click('#diveui .dock [data-check]').catch(() => {});
  await page.waitForSelector('#diveui .dock .won', { timeout: 10000 }).catch(() => problems.push(tag + ': a right design on the bench did not win'));
  /* what design really is, in each step's card (src/v2/studio-look.js): timing at the gates, the factory's rules on the tile,
     the masks against the process's own; each poll goes to the step again, in case the card was drawn anew */
  for (const [step, sel, n] of [['gates', '.sl-bar', 1], ['layout', '.sl-rules li', 7], ['masks', '.sl-masks .sl-m', 34]]) {
    S.at = tag + ' ' + '#/bench/' + step;
    await page.waitForFunction(([s, q, k]) => { if (location.hash !== '#/bench/' + s) location.hash = '#/bench/' + s;
      const c = document.querySelector('#diveui .dock .sl[data-studio="' + s + '"]'); return !!c && c.querySelectorAll(q).length >= k; }, [step, sel, n], { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': the ' + step + ' card does not show what its engine says of your design'));
  }
  /* the bench as a live design (#265, #268): a first visit names every piece of the computer readably and says the design is
     the lab's example; a design changed at describe is followed by the check, the gates and the layout */
  { const btag = tag + ' bench', bp = await browser3d.newPage({ viewport, colorScheme: scheme, reducedMotion: 'reduce' }); bp.on('pageerror', e => problems.push(btag + ': ' + e.message));
    S.at = btag; await bp.goto(base + 'index.html#/bench/need');
    await bp.waitForFunction(() => document.querySelectorAll('.bsurf .bk-tree .bk-node').length >= 17, null, { timeout: 60000 }).catch(() => problems.push(btag + ': the job does not show the community\'s computer'));
    const small = await bp.evaluate(() => [...document.querySelectorAll('.bsurf .bk-nm')].filter(n => parseFloat(getComputedStyle(n).fontSize) < 10 || !n.textContent.trim() || n.getBoundingClientRect().width < 8).length);
    if (small) problems.push(btag + ': ' + small + ' names in the job\'s tree are not readable');
    /* your design's state is in the step's card, under Read more (or the sheet opened on a phone) */
    await bp.waitForFunction(() => { const v = document.querySelector('#diveui .dock .benchy .verdict[data-by="example"]'); if (v && v.offsetParent) return true;
      const m = document.querySelector('#diveui [data-f2open]'), w = document.querySelector('#diveui .dockwrap'); if (m && m.offsetParent) m.click(); else if (w && w.classList.contains('peek')) w.click(); return false; }, null, { timeout: 15000, polling: 500 })
      .catch(() => problems.push(btag + ': a first visit does not open on the lab\'s example (or says it was written by you)'));
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
  S.at = tag + ' ' + '#/board'; await page.evaluate(() => { location.hash = '#/board'; });
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
