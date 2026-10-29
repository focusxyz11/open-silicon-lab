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

  // Time machine: going back to 1985 dims topics not yet invented and shows a topic banner.
  await page.evaluate(() => { location.hash = 'map'; }); await page.waitForTimeout(150);
  await page.click('#tmJump [data-y="1985"]');
  if (!(await page.textContent('#yearBtn')).includes('1985')) problems.push(tag + 'time machine did not set the year');
  if (!(await page.$('.tnode.notyet[data-t="riscv"]'))) problems.push(tag + 'time machine did not dim RISC-V in 1985');
  await page.evaluate(() => { location.hash = 'riscv'; }); await page.waitForTimeout(150);
  if (!/1985/.test(await page.textContent('#eraBanner'))) problems.push(tag + 'topic page shows no time-machine banner');
  await page.click('#eraBanner [data-era-now]');
  if (!(await page.textContent('#yearBtn')).includes('Today')) problems.push(tag + 'time machine did not return to today');

  // What if? A lever ripples badges across the map; selecting a topic shows the cause chain.
  await page.evaluate(() => { location.hash = 'whatif'; }); await page.waitForTimeout(200);
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

  // Feedback: every topic offers prefilled GitHub forms, and the footer links work.
  await page.evaluate(() => { location.hash = 'litho'; }); await page.waitForTimeout(150);
  const fb = await page.$$eval('#topicFoot .feedback a', as => as.map(a => a.href));
  if (fb.length !== 2 || !fb.every(h => /\/issues\/new\?template=(correction|idea)\.yml/.test(h) && h.includes('topic=litho'))) problems.push(tag + 'topic feedback links are missing or wrong');
  const foot = await page.$$eval('#siteFoot a[data-issue], #siteFoot a[data-repo]', as => as.map(a => a.href));
  if (foot.length !== 4 || foot.some(h => !h.startsWith('https://github.com/'))) problems.push(tag + 'footer links are not wired');

  // Tiny chip studio: step 9 exports the design as a Tiny Tapeout project.
  await page.evaluate(() => { location.hash = 'lab-tiny-1'; }); await page.waitForTimeout(250);
  await page.click('#tcSteps button[data-i="8"]'); await page.waitForTimeout(150);
  if (!/module tt_um_/.test(await page.textContent('#tcFileView'))) problems.push(tag + 'tiny chip studio did not export Verilog');
  await page.click('#tcSteps button[data-i="0"]');

  // Design with an AI agent: verify the first case, reject it for the right reason.
  await page.evaluate(() => { location.hash = 'lab-agent-1'; }); await page.waitForTimeout(250);
  await page.click('#agNav [data-c="eq"]');
  await page.click('#agCase [data-tool="run"]');
  if (!/wrong/.test(await page.textContent('#agCase .agout'))) problems.push(tag + 'agent case 1: verification found no bug');
  await page.click('#agCase [data-d="reject"]'); await page.check('#agCase input[name="agr"][value="0"]'); await page.click('#agCase [data-d="confirm"]');
  if (!/Right call, right reason/.test(await page.textContent('#agCase'))) problems.push(tag + 'agent case 1: right answer not recognised');
  await page.click('#agCase [data-d="again"]');

  // New ways to compute: build a Bell state in the quantum lab.
  await page.evaluate(() => { location.hash = 'lab-quantum-1'; }); await page.waitForTimeout(200);
  await page.click('#qcGoals [data-g="bell"]');
  await page.click('#qcPal [data-g="H"]'); await page.click('#qcGrid [data-c="0"][data-q="0"]');
  await page.click('#qcPal [data-g="CX"]'); await page.click('#qcGrid [data-c="1"][data-q="0"]');
  if (!/solved/i.test(await page.textContent('#qcTag'))) problems.push(tag + 'quantum lab: Bell state not recognised');
  await page.click('#qcClear');

  // A lab anchor opens its topic and scrolls to it.
  await page.evaluate(() => { location.hash = 'lab-fab-2'; }); await page.waitForTimeout(300);
  if (await page.evaluate(() => document.getElementById('fab').hidden)) problems.push(tag + 'lab anchor did not open its topic');

  // RISC-V: run level 1 with the right answer.
  await page.evaluate(() => { location.hash = 'riscv-1'; }); await page.waitForTimeout(200);
  await page.fill('#rvCode', 'addi a0, x0, 42\n');
  await page.click('#rvBRun'); await page.waitForTimeout(300);
  if (!/pass/i.test(await page.textContent('#rvResults'))) problems.push(tag + 'RISC-V level 1 did not pass with the right answer');

  // Your own gates as the CPU's ALU: the starter slice is unfinished, so the core reports a bug.
  await page.click('#rvAluSeg [data-a="mine"]');
  if (!/bug|Your gates/.test(await page.textContent('#rvAluTag'))) problems.push(tag + 'RISC-V lab did not switch to your ALU');
  await page.click('#rvAluSeg [data-a="builtin"]');
  await page.close();
}

try {
  await check({ width: 1360, height: 900 });
  await check({ width: 390, height: 844 });
} finally { await browser.close(); server.close(); }
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('Smoke test passed: map, every topic, all views and the RISC-V lab work on desktop and mobile.');
