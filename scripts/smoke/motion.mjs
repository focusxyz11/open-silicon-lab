import { S } from './shared.mjs';

export const about = 'one stage and no cuts: the factory opens, zooms in and out, the island answers a tap, lenses and dials, the test house square, the islands around, Ask at the block, one WebGL context';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  S.at = 'motion'; const tag = 'motion', page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
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
  /* a part's card lists no worlds: a world opens from a lens (#305) */
  await page.waitForSelector('#sheet.part', { timeout: 15000 }).catch(() => {});
  if (await page.$('#sheet .wchip, #sheet .wmeet')) problems.push(tag + ': a part\'s card still lists the worlds it meets');
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
}
