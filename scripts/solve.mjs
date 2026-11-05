// Plays every challenge that checks itself to its goal in a real browser, and fails if one cannot be
// solved: a check that names the wrong readout, or a target the simulation cannot reach, shows up here.
// Run: npm run test:challenges   (needs Playwright, like the smoke test)
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';
import { CHALLENGES } from '../src/generated/graph.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

/* How a person would solve each one: set(id, value), seg(id, text), check(id, on), click(css), wait(ms), until(id, text),
   tap(css): a click sent from script, for a button that a sticky bar may cover while the page scrolls, or one marked
   aria-disabled, which a person can still press to see why it does nothing. */
const R = {
  'yield/Fill the shelf': [['seg', 'ydSplit', '8']],
  'yield/Half price by chiplets': [['click', '#yd-measure'], ['seg', 'ydPre', 'AI GPU'], ['set', 'ydD', 0.1], ['set', 'ydC', 30], ['seg', 'ydSplit', '8']],
  'yield/The yield cliff': [['seg', 'ydPre', 'AI GPU'], ['seg', 'ydSplit', '1'], ['set', 'ydD', 0.28]],
  'yield/A $45,000 wafer': [['seg', 'ydPre', 'AI GPU'], ['seg', 'ydSplit', '1'], ['set', 'ydC', 45], ['set', 'ydD', 0.04]],
  'yield/Half price in clumps': [['seg', 'ydPre', 'AI GPU'], ['set', 'ydD', 0.1], ['set', 'ydC', 30], ['seg', 'ydRain', 'Clumps'], ['seg', 'ydSplit', '8'], ['set', 'ydAl', 5]],
  'quantum/One look, no luck': [['click', '#qsFlip'], ['wait', 700], ['click', '#qsMirror'], ['wait', 700], ['click', '#qsLook']],
  'quantum/One step too many': [['seg', 'qsBoxes', '8'], ['click', '#qsFlip'], ['click', '#qsMirror'], ['click', '#qsFlip'], ['click', '#qsMirror'], ['wait', 400], ['click', '#qsFlip'], ['click', '#qsMirror']],
  'quantum/Clean enough for a million': [['set', 'qsE', 35]],
  'transistor/Why planar was retired': [['seg', 'trSeg', 'Planar'], ['seg', 'trSeg', 'GAA']],
  'transistor/Toward 60 millivolts': [['seg', 'trSeg', 'CFET'], ['seg', 'trSeg', '2D']],
  'package/Bandwidth per stack': [['set', 'pkE', 1], ['seg', 'pkList', 'HBM4']],
  'compute/Feed the beast': [['seg', 'rfChip', 'NVIDIA Rubin'], ['seg', 'rfPrec', 'FP8'], ['set', 'rfP', 560], ['set', 'rfB', 950]],
  'compute/Sixteen answers': Array(10).fill(['click', '#saStep']),
  'compute/An assistant in your pocket': [['seg', 'rfChip', 'Phone'], ['seg', 'rfPrec', 'FP4'], ['set', 'rfB', 0], ['set', 'rfP', 262]],
  'accelerators/Four bits, despite outliers': [['set', 'qzOut', 1], ['seg', 'qzFmt', 'FP4'], ['seg', 'qzScale', 'Per block of 16']],
  'accelerators/Read fast, write slow': [['seg', 'pdChip', 'Rubin'], ['seg', 'pdModel', '70B'], ['set', 'pdOutL', 550], ['set', 'pdIn', 950]],
  'architecture/Zero stalls': [['check', 'ppFwd', true], ['check', 'ppRe', true]],
  'architecture/The serial share': [['set', 'amP', 668]],
  'architecture/Room to grow': [['set', 'encOp', 'add'], ['set', 'encOp', 'sub']],
  'design/Pass the slow corner': [['set', 'tmP', 250], ['seg', 'tmCorner', 'Slow'], ['seg', 'tmCuts', '2']],
  'design/Half the power': [['set', 'pwA', 0.15], ['set', 'pwF', 2.25], ['click', '#pwBest']],
  'design/Close coverage with an agent': [['click', '#cvRand'], ['until', 'cvTag', 'Finished'], ['click', '#cvAI'], ['until', 'cvTag', 'Finished AI']],
  'fab/The bare bottom': [['seg', 'adM', 'CVD'], ['set', 'adAR', 2], ['click', '#adReset'], ['click', '#adRun'], ['wait', 3000], ['seg', 'adM', 'ALD'], ['click', '#adReset'], ['click', '#adRun'], ['wait', 5000]],
  'fab/Etch straight down': [['set', 'etI', 100], ['set', 'etC', 0], ['click', '#etReset'], ['click', '#etRun'], ['wait', 6000]],
  'fab/Ten billion vias': [['set', 'ovX', 0], ['set', 'ovS', 0.65], ['set', 'ovX', 2]],
  'ecosystem/Choke points': [['click', 'button[data-id="asml"]'], ['click', 'button[data-id="zeiss"]'], ['click', 'button[data-id="trumpf"]']],
  'innovation/What AI cannot shorten': [['seg', 'gtSeg', '2020'], ['seg', 'gtSeg', '2030']],
  'physics/Too hot for silicon': [['seg', 'phMode', '1'], ['set', 'phT', 600]],
  'physics/The furnace spreads it': [['seg', 'ipIon', 'Boron'], ['set', 'ipE', 0.2], ['seg', 'ipAn', 'Furnace'], ['seg', 'ipAn', 'Laser']],
  'physics/Shallow and switched on': [['seg', 'ipIon', 'Arsenic'], ['set', 'ipE', 0.2], ['seg', 'ipAn', 'Laser']],
  'litho/The 1,000-watt source': [['set', 'euP', 1000], ['set', 'euR', 0.72], ['set', 'euN', 8], ['set', 'euD', 15]],
  'factory/Wafers go round': [['seg', 'fyProd', 'AI'], ['seg', 'fyQ1', '100']],
  'factory/Full is slow': [['seg', 'fyProd', 'Phone'], ['set', 'fyLoad', 70], ['set', 'fyLoad', 95]],
  'factory/Buy one machine': [['click', '#fy-measure'], ['click', '#fyReset'], ['tap', '#fyTools button[data-g="litho"][data-d="1"]']],
  'factory/Double the output': [['click', '#fy-measure'], ['click', '#fyReset'], ...Array(3).fill(['tap', '#fyTools button[data-g="litho"][data-d="1"]']), ...Array(4).fill(['tap', '#fyTools button[data-g="depo"][data-d="1"]']), ...Array(2).fill(['tap', '#fyTools button[data-g="etch"][data-d="1"]']), ...Array(2).fill(['tap', '#fyTools button[data-g="clean"][data-d="1"]']), ...Array(1).fill(['tap', '#fyTools button[data-g="implant"][data-d="1"]']), ...Array(1).fill(['tap', '#fyTools button[data-g="anneal"][data-d="1"]']), ...Array(2).fill(['tap', '#fyTools button[data-g="cmp"][data-d="1"]']), ...Array(1).fill(['tap', '#fyTools button[data-g="metro"][data-d="1"]'])],
  'factory/What EUV really saves': [['click', '#fyReset'], ['set', 'fyLoad', 85], ['seg', 'fyPrint', '193']],
  'factory/One company, every chip': [['click', '#fy-open'], ['click', '#fyEco [data-shock="asml"]'], ['tap', '#fyTools button[data-g="litho"][data-d="1"]']],
  'factory/Smarter, not bigger': [['click', '#fyReset'], ['seg', 'fyPrint', 'EUV'], ['set', 'fyLoad', 90], ['seg', 'fyAi', 'AI']],
};

const checked = CHALLENGES.filter(c => c.check);
const key = c => c.topic + '/' + c.t;
const problems = checked.filter(c => !R[key(c)]).map(c => key(c) + ': no way to solve it in scripts/solve.mjs');

const server = await serve(0), port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
page.on('pageerror', e => problems.push('page error: ' + e.message));
await page.goto(`http://localhost:${port}/#map`);
await page.evaluate(() => { try { localStorage.removeItem('osl-solved-v1'); } catch (e) { /* ignore */ } });

for (const c of checked) {
  const steps = R[key(c)]; if (!steps) continue;
  await page.evaluate(h => { location.hash = h; }, c.topic);
  await page.waitForFunction(id => { const s = document.getElementById(id); return s && !s.hidden; }, c.topic, { timeout: 15000 });
  await page.waitForTimeout(400);
  const early = await page.evaluate(k => { try { return !!JSON.parse(localStorage.getItem('osl-solved-v1') || '{}')[k]; } catch (e) { return false; } }, key(c));
  if (early) { problems.push(key(c) + ': counts as solved before the reader did anything'); continue; }
  try {
    for (const [op, a, b] of steps) {
      if (op === 'set') await page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [a, b]);
      else if (op === 'check') await page.evaluate(([id, v]) => { const e = document.getElementById(id); e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); e.dispatchEvent(new Event('input', { bubbles: true })); }, [a, b]);
      else if (op === 'seg') await page.evaluate(([id, txt]) => { const bt = [...document.getElementById(id).querySelectorAll('button')].find(x => x.textContent.trim().startsWith(txt)); if (!bt) throw new Error('no button "' + txt + '" in #' + id); bt.click(); }, [a, b]);
      else if (op === 'click') await page.click(a);
      else if (op === 'tap') await page.evaluate(sel => document.querySelector(sel).click(), a);
      else if (op === 'wait') await page.waitForTimeout(a);
      else if (op === 'until') await page.waitForFunction(([id, txt]) => document.getElementById(id).textContent.includes(txt), [a, b], { timeout: 90000 });
      await page.waitForTimeout(160);
    }
    await page.waitForFunction(k => { try { return !!JSON.parse(localStorage.getItem('osl-solved-v1') || '{}')[k]; } catch (e) { return false; } }, key(c), { timeout: 3000 });
    if (!(await page.$('#' + c.topic + ' .chwin'))) problems.push(key(c) + ': solved, but no note appeared');
  } catch (e) { problems.push(key(c) + ': not solved by its recipe (' + e.message.split('\n')[0] + ')'); }
}
await browser.close(); server.close();
if (problems.length) { console.error('Challenges that cannot be solved:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('Every self-checking challenge was solved in the browser: ' + checked.length + ' of ' + checked.length + '.');
