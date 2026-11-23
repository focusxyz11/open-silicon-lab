/* one stage and no cuts: with motion on, going inside from the island dives the camera in, then the view zooms in from it
   (a view transition); rising goes back out. A duplicate name or a stuck view would show as an error here. */
import { S } from './shared.mjs';

export const about = 'every pair of neighbouring 3D levels drawn together half way, and back';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* joins: every pair of neighbouring levels in 3D (the phone to its board to its chip, the control unit to its chip,
     the wafer to the die, a chip to the block, down to the atom): no flat picture shows between; both levels are
     drawn in one frame on one camera path, half way and back */
  for (const [a, b, na] of [['phone', 'phoneboard', 4], ['phoneboard', 'soc', 4], ['ecu', 'mcu', 3], ['wafer', 'die', 2], ['chip', 'block', 5], ['block', 'gate', 4], ['gate', 'switch', 5], ['switch', 'atom', 5]]) {
    const tag = 'join ' + a + '>' + b;
    S.at = tag; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
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
}
