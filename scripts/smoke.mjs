// Browser smoke test: every view and topic opens without errors, every simulation draws,
// the map links work, and the RISC-V lab can run a level end to end.
// Needs Playwright with Chromium (npx playwright install chromium).
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';
import { TOPICS, DEBATES } from '../src/data/topics.js';
import { ANCHORS } from '../src/generated/catalog.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = await serve(0); const base = `http://localhost:${server.address().port}/`;
const problems = [];
const REF = ['glossary', 'sources'];
/* Which page a hash opens: topics load on demand, so wait until that page is on screen. */
const pageOf = h => TOPICS.some(t => t.id === h) || REF.includes(h) ? h : /^riscv-/.test(h) ? 'riscv' : ANCHORS[h] || null;
async function go(page, hash) {
  await page.evaluate(h => { location.hash = h; }, hash);
  const id = pageOf(hash);
  if (id) await page.waitForFunction(id => { const s = document.getElementById(id); return !!s && !s.hidden && !document.getElementById('view-topic').hidden; }, id, { timeout: 15000 });
  else await page.waitForTimeout(150);
  await page.waitForTimeout(60);
}
const browser = await chromium.launch();

async function check(viewport) {
  const page = await browser.newPage({ viewport });
  /* These checks act as a returning visitor; checkGuide() below plays the first visit. */
  await page.addInitScript(() => { try { localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* ignore */ } });
  const tag = viewport.width < 600 ? '[mobile] ' : '';
  page.on('pageerror', e => problems.push(tag + 'page error: ' + e.message + ' (' + String(e.stack || '').split('\n').slice(1, 3).map(l => l.trim()).join(' ← ') + ')'));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|ERR_NAME|net::/.test(m.text() + (m.location().url || ''))) problems.push(tag + 'console: ' + m.text()); });
  const requests = []; page.on('request', r => { if (r.url().startsWith(base)) requests.push(r.url().slice(base.length)); });
  await page.goto(base + 'index.html');
  await page.waitForSelector('#mBands .tnode');
  await page.waitForLoadState('networkidle');
  /* Speed budget: the map loads without any topic, in a bounded number of files. */
  const early = requests.filter(u => u.startsWith('topics/'));
  if (early.length) problems.push(tag + 'the map loaded topic files before any topic was opened: ' + early.slice(0, 3).join(', '));
  if (requests.length > 60) problems.push(tag + 'the map needed ' + requests.length + ' files to start (budget: 60)');
  if (!tag) console.log('Start-up: ' + requests.length + ' files, no topics loaded.');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + 'map scrolls sideways');

  // Map: select a topic, follow a thread, search.
  await page.click('.tnode[data-t="riscv"]');
  if (!(await page.textContent('#mInfo')).includes('Connects to')) problems.push(tag + 'map info panel did not open');
  await page.click('#mThreads button[data-th="make"]');
  if ((await page.$$('.tnode.stepn')).length !== 6) problems.push(tag + 'thread did not highlight its 6 steps');
  // Lenses: one kind of connection at a time, and one big idea across the layers.
  if (await page.$('#mSvg path.k-causes')) problems.push(tag + 'quiet map still draws every line');
  await page.click('#mLens [data-lens="causes"]');
  if ((await page.$$('#mSvg path.k-causes')).length < 5 || !(await page.textContent('#mInfo')).includes('domino')) problems.push(tag + 'cause-and-effect lens did not draw its arrows and dominoes');
  await page.click('#mLens [data-lens="ideas"]');
  await page.click('#mInfo [data-idea="keep-data-close"]');
  if ((await page.$$('.tnode.hit')).length < 4 || !(await page.$('#mSvg path.idea'))) problems.push(tag + 'big-idea lens did not trace "Keep data close"');
  await page.click('#mLens [data-lens=""]');
  // The frontier map: a wall (an open problem) lights up the challenges that test each view, and
  // leaning one way in its debate asks what would change your mind.
  await go(page, 'challenges');
  if ((await page.$$('#view-challenges .fm .fmp')).length < 60) problems.push(tag + 'the frontier map should place every challenge');
  if (await page.evaluate(() => getComputedStyle(document.querySelector('#view-challenges .fmnarrow')).display !== 'none')) await page.click('#view-challenges .fmnarrow [data-col="walls"]');   // a phone shows one column at a time
  await page.click('#view-challenges .fm .fmw[data-w="bigdie"]');
  if (!(await page.$('#view-challenges .fmpanel [data-debate="bigdie"]')) || !(await page.$$('#view-challenges .fmpanel .fmtry')).length) problems.push(tag + 'picking a wall did not show its debate and the challenges that test it');
  await page.click('[data-debate="bigdie"] [data-lean][data-v="1"]');
  if (!/What would change your mind/.test(await page.textContent('[data-debate="bigdie"]'))) problems.push(tag + 'leaning in a debate did not ask what would change your mind');
  await page.click('[data-debate="bigdie"] [data-lean][data-v="1"]');
  /* The Frontier tab around the map: a card for every wall, the gaps, and "See it on the map" picks that wall. */
  await go(page, 'frontier');
  const fr = await page.evaluate(() => ({ walls: document.querySelectorAll('#view-challenges .fwall[data-wall]').length, wanted: document.querySelectorAll('#view-challenges .fwant, #view-challenges .fwcells .fmp').length, forms: [...document.querySelectorAll('#view-challenges .fways a[target]')].map(a => a.href) }));
  if (fr.walls !== DEBATES.length) problems.push(tag + 'Frontier: ' + fr.walls + ' wall cards for ' + DEBATES.length + ' walls');
  if (!fr.wanted) problems.push(tag + 'Frontier: no gaps listed');
  if (fr.forms.length !== 2 || !fr.forms.every(h => /\/issues\/new\?template=(challenge|view)\.yml/.test(h))) problems.push(tag + 'Frontier: the proposal forms are not wired (' + fr.forms.join(', ') + ')');
  await page.click('#view-challenges .fwall[data-wall="power"] [data-pick]');
  await page.waitForTimeout(150);
  if (!(await page.$('#view-challenges .fmpanel [data-debate="power"]'))) problems.push(tag + 'Frontier: "See it on the map" did not pick the wall');
  await go(page, 'map');
  await page.fill('#mSearch', 'HBM');
  if (!(await page.$$('#mInfo .hits a')).length) problems.push(tag + 'search found nothing for HBM');

  // Time machine: going back to 1985 dims topics not yet invented and shows a topic banner.
  await go(page, 'map');
  await page.click('#tmJump [data-y="1985"]');
  if (!(await page.textContent('#yearBtn')).includes('1985')) problems.push(tag + 'time machine did not set the year');
  if (!(await page.$('.tnode.notyet[data-t="riscv"]'))) problems.push(tag + 'time machine did not dim RISC-V in 1985');
  await go(page, 'riscv');
  if (!/1985/.test(await page.textContent('#eraBanner'))) problems.push(tag + 'topic page shows no time-machine banner');
  await page.click('#eraBanner [data-era-now]');
  if (!(await page.textContent('#yearBtn')).includes('Today')) problems.push(tag + 'time machine did not return to today');

  // What if? A lever ripples badges across the map; selecting a topic shows the cause chain.
  await go(page, 'whatif');
  if (await page.isHidden('#mWhatif')) problems.push(tag + 'what-if panel did not open from #whatif');
  await page.locator('#mWhatif [data-l="hbm"] input').fill('-40');
  const badges = await page.$$eval('#mBands .tnode .rb.up, #mBands .tnode .rb.down', n => n.length);
  if (badges < 8) problems.push(tag + 'HBM lever reached only ' + badges + ' topics');
  await page.click('.tnode[data-t="everywhere"]');
  if (!/Phone and PC prices/.test(await page.textContent('#mInfo'))) problems.push(tag + 'what-if panel shows no cause for phone prices');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + 'what-if mode scrolls sideways');
  await page.click('#mWhatif [data-wi-close]');
  if (await page.$('#mBands .tnode .rb.up')) problems.push(tag + 'closing what-if left badges on the map');

  // Every topic and reference page.
  const ids = TOPICS.map(t => t.id).concat(REF);
  for (const id of ids) {
    try { await go(page, id); } catch (e) { problems.push(tag + `#${id}: did not open (${e.message.split('\n')[0]})`); continue; }
    const r = await page.evaluate(([id, REF_IDS]) => {
      const s = document.getElementById(id);
      const shown = [...document.querySelectorAll('#library > section')].filter(x => !x.hidden).map(x => x.id);
      const blank = [...s.querySelectorAll('canvas')].filter(c => c.offsetParent && (c.width < 2 || c.height < 2)).length;
      /* Challenge first: a topic opens with its mission card, right under its question, and every
         start link goes somewhere that exists. */
      const m = s.querySelector(':scope > .mission'), start = m && m.querySelector('.row a.btn.primary');
      const missionOk = REF_IDS.includes(id) || (!!m && m.previousElementSibling === s.querySelector(':scope > .head'));
      return { shown, blank, wide: document.documentElement.scrollWidth > innerWidth + 1, missionOk, start: start ? start.getAttribute('href') : null };
    }, [id, REF]);
    if (!r.missionOk) problems.push(tag + `#${id}: no mission card under the question`);
    if (r.start && !pageOf(r.start.slice(1)) && !['whatif', 'timeMachine', 'workshop'].includes(r.start.slice(1))) problems.push(tag + `#${id}: mission starts at ${r.start}, which leads nowhere`);
    if (r.shown.length !== 1 || r.shown[0] !== id) problems.push(tag + `#${id}: shows ${r.shown.join(',')}`);
    if (r.blank) problems.push(tag + `#${id}: ${r.blank} canvas(es) did not size`);
    if (r.wide) problems.push(tag + `#${id}: page scrolls sideways`);
  }
  /* The doors: Break and Imagine open with their projects and their own column of the frontier map. */
  for (const [v, lens] of [['workshop', 'build'], ['break', 'break'], ['imagine', 'imagine']]) {
    await page.evaluate(h => { location.hash = h; }, v);
    await page.waitForTimeout(150);
    const r = await page.evaluate(([v, lens]) => { const el = document.getElementById('view-' + v); const ps = [...el.querySelectorAll('.fm .fmp')]; return { n: ps.length, other: ps.filter(p => !p.classList.contains('fc-' + lens)).length, walls: el.querySelectorAll('.fm .fmw[data-w]').length }; }, [v, lens]);
    if (!r.n || r.other || !r.walls) problems.push(tag + v + ' door should show only its ' + lens + ' challenges and the walls (got ' + JSON.stringify(r) + ')');
  }
  for (const v of ['workshop', 'break', 'imagine', 'challenges', 'knowledge']) {
    await page.evaluate(h => { location.hash = h; }, v);
    await page.waitForTimeout(120);
    if (await page.evaluate(v => document.getElementById('view-' + v).hidden, v)) problems.push(tag + v + ' view did not open');
  }

  // The litho page: its long passage folds, its wall chip finds the debate, and its facts fold into Go deeper.
  await go(page, 'litho');
  const fold = await page.evaluate(() => { const b = document.querySelector('#litho .pmorebtn'); if (!b) return 'no fold'; b.click(); const open = !document.querySelector('#litho .pmore').hidden; b.click(); return open ? 'ok' : 'did not open'; });
  if (fold !== 'ok') problems.push(tag + 'litho: Read more ' + fold);
  if (!await page.$('#topicFoot [data-debate="' + await page.$eval('#litho .mission [data-wall]', b => b.dataset.wall) + '"]')) problems.push(tag + 'litho: the wall in the mission card is not on the page');
  if (!await page.$('#topicFoot details.deep.dfacts .factbox')) problems.push(tag + 'litho: facts are not folded into Go deeper');
  // Feedback: every topic offers prefilled GitHub forms, and the footer links work.
  const fb = await page.$$eval('#topicFoot .feedback a', as => as.map(a => a.href));
  if (fb.length !== 2 || !fb.every(h => /\/issues\/new\?template=(correction|idea)\.yml/.test(h) && h.includes('topic=litho'))) problems.push(tag + 'topic feedback links are missing or wrong');
  const foot = await page.$$eval('#siteFoot a[data-issue], #siteFoot a[data-repo]', as => as.map(a => a.href));
  if (foot.length !== 4 || foot.some(h => !h.startsWith('https://github.com/'))) problems.push(tag + 'footer links are not wired');

  // Tiny chip studio: step 9 exports the design as a Tiny Tapeout project.
  await go(page, 'lab-tiny-1');
  await page.click('#tcSteps button[data-i="8"]'); await page.waitForTimeout(150);
  if (!/module tt_um_/.test(await page.textContent('#tcFileView'))) problems.push(tag + 'tiny chip studio did not export Verilog');
  await page.click('#tcSteps button[data-i="0"]');

  // Design with an AI agent: verify the first case, reject it for the right reason.
  await go(page, 'lab-agent-1');
  await page.click('#agNav [data-c="eq"]');
  await page.click('#agCase [data-tool="run"]');
  if (!/wrong/.test(await page.textContent('#agCase .agout'))) problems.push(tag + 'agent case 1: verification found no bug');
  await page.click('#agCase [data-d="reject"]'); await page.check('#agCase input[name="agr"][value="0"]'); await page.click('#agCase [data-d="confirm"]');
  if (!/Right call, right reason/.test(await page.textContent('#agCase'))) problems.push(tag + 'agent case 1: right answer not recognised');
  await page.click('#agCase [data-d="again"]');

  // New ways to compute: build a Bell state in the quantum lab.
  await go(page, 'lab-quantum-1');
  await page.click('#qcGoals [data-g="bell"]');
  await page.click('#qcPal [data-g="H"]'); await page.click('#qcGrid [data-c="0"][data-q="0"]');
  await page.click('#qcPal [data-g="CX"]'); await page.click('#qcGrid [data-c="1"][data-q="0"]');
  if (!/solved/i.test(await page.textContent('#qcTag'))) problems.push(tag + 'quantum lab: Bell state not recognised');
  await page.click('#qcClear');

  // My chip: start a chip from the passport, then see it on a topic page and in the passport.
  await go(page, 'mychip');
  const startBtn = await page.$('[data-start="half"]');
  if (startBtn) { await startBtn.click(); await page.waitForTimeout(250); }
  await go(page, 'litho');
  if (!/Your chip/.test(await page.textContent('#chipBanner'))) problems.push(tag + 'my chip: no line on the Lithography page');
  await go(page, 'mychip');
  if (!(await page.$('#mcCard'))) problems.push(tag + 'my chip: passport card missing');

  // The bench: twin-test a design on the virtual board, then catch a planted defect.
  await go(page, 'bench');
  await page.waitForSelector('#bhIns .bhswb');
  await page.click('#bhDesign [data-d="add2"]'); await page.waitForTimeout(150);
  await page.click('#bhRun'); await page.waitForTimeout(400);
  if (!/All 16 patterns match/.test(await page.textContent('#bhRunTag'))) problems.push(tag + 'bench: the virtual 2-bit adder should pass its twin test');
  await page.click('#bhDesignNote [data-real="defect"]'); await page.waitForTimeout(150);
  await page.click('#bhRun'); await page.waitForTimeout(400);
  if (!/differ/.test(await page.textContent('#bhRunTag'))) problems.push(tag + 'bench: a planted defect should fail the twin test');
  if (!(await page.$('#bhDiag .callout'))) problems.push(tag + 'bench: no diagnosis after a failed twin test');
  /* A loose wire: the chip changes its mind, and the bench says so. */
  await page.click('#bhDesignNote [data-real="loose"]'); await page.waitForTimeout(150);
  let flaky = false;
  for (let k = 0; k < 4 && !flaky; k++) { await page.click('#bhRun'); await page.waitForTimeout(500); flaky = /changed its mind|differ/.test(await page.textContent('#lab-bench-1')); }
  if (!flaky) problems.push(tag + 'bench: a loose wire should make the twin test fail');
  await page.click('#bhDesignNote [data-real="perfect"]'); await page.waitForTimeout(150);
  /* A small test budget lowers the coverage it reports. */
  await page.click('#tyBudget [data-n="2"]');
  if (!/2 of 16/.test(await page.textContent('#tyCov'))) problems.push(tag + 'bench: the test budget did not change the coverage line');
  await page.click('#tyBudget [data-n="0"]');
  await page.$$eval('#tyTray [data-test]', bs => bs.forEach(b => b.click())); await page.waitForTimeout(400);
  /* A wafer has one chip with a defect, or (a design bug) every chip failing. */
  const failing = (await page.$$('#tyTray .tychip.fail')).length;
  if (failing !== 1 && failing !== 4) problems.push(tag + 'bench: the tray should hold one faulty chip, or four with a design bug; found ' + failing);
  await page.click('#bhBoards [data-b="mpbench"]'); await page.click('#bhDesign [data-d="hc00"]'); await page.waitForTimeout(150);
  if (!(await page.$('#bhConnect .bhwt'))) problems.push(tag + 'bench: no wiring table for a 74HC00 on a MicroPython board');
  await page.click('#bhBoards [data-b="virtual"]'); await page.waitForTimeout(150);

  // A lab anchor opens its topic and scrolls to it.
  await go(page, 'lab-fab-2');
  if (await page.evaluate(() => document.getElementById('fab').hidden)) problems.push(tag + 'lab anchor did not open its topic');

  // Why perfect designs fail: the perfect design fails, and margin plus adaptive voltage ships the phone.
  await go(page, 'reality');
  await page.click('#rlMission button[data-m="phone"]'); await page.click('#rlReset');
  if (!/fail/i.test(await page.textContent('#rlTag'))) problems.push(tag + 'reality: the perfect design should fail');
  await page.evaluate(() => { const m = document.getElementById('rlMargin'); m.value = 15; m.dispatchEvent(new Event('input')); });
  await page.check('#rlAvs');
  if (!/ships/i.test(await page.textContent('#rlTag'))) problems.push(tag + 'reality: margin + adaptive voltage should ship the phone');
  await page.click('#rlReset');
  await page.click('#rcCase [data-gap]');
  if (!(await page.$('#rcCase .rc-reveal'))) problems.push(tag + 'reality: case files did not reveal an answer');
  await page.evaluate(() => { try { localStorage.removeItem('osl-reality-cases-v1'); } catch (e) {} });

  // A deep link straight to a level opens that level.
  await go(page, 'riscv-5');
  if (!/neuron/i.test(await page.textContent('#rvLvTitle'))) problems.push(tag + '#riscv-5 did not open level 5');

  // RISC-V: run level 1 with the right answer.
  await go(page, 'riscv-1');
  await page.fill('#rvCode', 'addi a0, x0, 42\n');
  await page.click('#rvBRun'); await page.waitForTimeout(300);
  if (!/pass/i.test(await page.textContent('#rvResults'))) problems.push(tag + 'RISC-V level 1 did not pass with the right answer');

  // Your own gates as the CPU's ALU: the starter slice is unfinished, so the core reports a bug.
  await page.click('#rvAluSeg [data-a="mine"]');
  if (!/bug|Your gates/.test(await page.textContent('#rvAluTag'))) problems.push(tag + 'RISC-V lab did not switch to your ALU');
  await page.click('#rvAluSeg [data-a="builtin"]');
  await page.close();
}

/* A first visit: nothing blocks the page. The rack-to-atom hero sits at the top of the map, tips appear
   when a feature becomes useful and go away once it is used, and the tour opens only on request. */
async function checkGuide(viewport) {
  const page = await browser.newPage({ viewport }); const tag = viewport.width < 600 ? '[mobile first visit] ' : '[first visit] ';
  page.on('pageerror', e => problems.push(tag + 'page error: ' + e.message + ' (' + String(e.stack || '').split('\n').slice(1, 3).map(l => l.trim()).join(' ← ') + ')'));
  await page.goto(base + 'index.html'); await page.waitForSelector('#mBands .tnode'); await page.waitForTimeout(1200);
  if (await page.$('.g-card')) problems.push(tag + 'the tour opened by itself');
  if ((await page.$$('.hero .hlens')).length !== 4) problems.push(tag + 'the hero should offer four lenses: explore, build, break, imagine');
  /* Scrolling to the map brings the "select a box" tip; selecting one dismisses it and brings the lens tip. */
  await page.evaluate(() => document.getElementById('mStack').scrollIntoView());
  try { await page.waitForSelector('.hint', { timeout: 4000 }); } catch (e) { problems.push(tag + 'no tip when the map came into view'); }
  if (await page.$('.g-block')) problems.push(tag + 'a tip should never block the page');
  await page.click('.tnode[data-t="yield"]');
  await page.waitForTimeout(1600);
  const lensTip = await page.$('.hint'); if (!lensTip || !/Show/.test(await lensTip.textContent())) problems.push(tag + 'selecting a topic should bring the lens tip');
  await page.click('.hint [data-h="off"]');
  if (await page.$('.hint')) problems.push(tag + 'Turn tips off did not close the tip');
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + 'page scrolls sideways');
  /* The hero: zoom to the die, where each block of the map is a layer; a block zooms further down;
     at the transistor the gate switch works; a lens card goes straight to a challenge. */
  await page.evaluate(() => scrollTo(0, 0));
  await page.click('#zLevels button:nth-child(4)');
  try { await page.waitForSelector('#hDie:not([hidden])', { timeout: 8000 }); } catch (e) { problems.push(tag + 'the die did not become the map of the lab at level 4'); }
  await page.click('.hdblk[data-band="device"]');
  if (!/Transistor/.test(await page.textContent('#hCard'))) problems.push(tag + 'picking the Transistors block did not show its topics');
  await page.click('#hCard [data-zoomto]');
  try { await page.waitForSelector('#hGateSeg:not([hidden])', { timeout: 10000 }); } catch (e) { problems.push(tag + 'zooming down from the die did not reach the transistor'); }
  await page.click('#hGateSeg [data-gate="0"]');
  if (await page.$eval('#hGateNote', el => el.hidden)) problems.push(tag + 'switching the gate off did not explain what happens');
  await page.click('.hlens[data-lens="break"]');
  await page.click('#hCard a.btn');
  try { await page.waitForFunction(() => { const s = document.getElementById('reality'); return s && !s.hidden; }, null, { timeout: 15000 }); } catch (e) { problems.push(tag + 'the Break card did not open the reality topic'); }
  if (await page.$('.hint')) problems.push(tag + 'tips stay off after Turn tips off');
  /* The tour still opens on request, walks four steps, and Escape closes it. */
  await page.goto(base + 'index.html'); await page.waitForSelector('.hero [data-guide-start]');
  await page.click('.hero [data-guide-start]'); await page.waitForSelector('.g-card');
  for (let k = 0; k < 3; k++) { await page.click('.g-card [data-g="next"]'); await page.waitForTimeout(120); }
  if ((await page.$$('.g-card [data-g="go"]')).length !== 3) problems.push(tag + 'the tour\'s last step should offer 3 challenges');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  if (await page.$('.g-card')) problems.push(tag + 'Escape did not close the tour');
  await page.close();
}

try {
  await check({ width: 1360, height: 900 });
  await check({ width: 390, height: 844 });
  await checkGuide({ width: 1360, height: 900 });
  await checkGuide({ width: 390, height: 844 });
} finally { await browser.close(); server.close(); }
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: map, every topic, all views and the RISC-V lab work on desktop and mobile.');
