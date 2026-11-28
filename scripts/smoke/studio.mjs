/* The studio (#/studio/<level>, src/v2/studio/, #506): your chip as designed, one die in dashed outline, zoomed die →
   block → cells → one cell with no cut. Its checks: it opens on the die from the record (the lab's example design on the
   bench), the island not drawn behind it; the rail and the address say the level; ↓ and a tap on the rail go in,
   continuously (the camera passes between the levels, never jumping); ↑ comes out; along (→) leads to the same level as
   made; an old address of the room walked through opens the die at its corner's level; a design that does not do its
   job is said on the die; Arrange sets the recipe in your stack and the hot spot follows (#507); the block scrambled turns
   late, settled is on time, every state finds the planted bug (#508); no sideways scroll. Desktop at night, phone by day */
import { S } from './shared.mjs';

export const about = 'The studio (#/studio): your chip as designed from the record, the die zoomed to block, gate and switch with no cut, the rail and the address, along to the same level as made, the room\'s old addresses, a broken design, desktop and phone';

export default async function run() {
  const { browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 820, 'dark'], [390, 844, 'light']]) {
    const tag = 'studio ' + w; S.at = tag;
    const page = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    page.on('pageerror', e => problems.push(tag + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); localStorage.removeItem('osl-stack'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
    await page.goto(base + 'index.html#/studio');
    const opened = await page.waitForFunction(() => { const c = document.getElementById('studioCanvas'), u = document.getElementById('studioui');
      return !!c && !c.hidden && !u.hidden && c.dataset.level === 'chip' && !c.dataset.flying && !!document.querySelector('#studioLabels .sdl.title') && u.dataset.broken === ''; }, null, { timeout: 60000 }).then(() => true, () => false);
    if (!opened) { problems.push(tag + ': #/studio does not open the die as designed'); await page.close(); continue; }
    if (await page.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the studio');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the studio scrolls sideways');
    if (!(await page.evaluate(() => { const r = document.querySelector('#studioui .rail2 [aria-current]'); return document.querySelectorAll('#studioui .rail2 [data-rail]').length === 4 && (!r || r.dataset.rail === 'chip'); })))
      problems.push(tag + ': the rail does not hold the four levels as designed, the chip lit');
    /* Arrange (#507): at the chip, the recipe's shape and where it computes; stacked, the hot spot climbs (its figure
       red, with its mark), and the stack keeps the recipe */
    const arranged = await page.waitForFunction(() => { const b = document.querySelector('#studioui .sdctl [data-opt="stack"]'), u = document.getElementById('studioui');
      if (b && !u.dataset.recipe.endsWith('/stack')) b.click();
      const hot = document.querySelector('#studioLabels .sdl.figure[data-part="hottest"]'), k = JSON.parse(localStorage.getItem('osl-stack') || 'null');
      return u.dataset.recipe.endsWith('/stack') && !!hot && hot.classList.contains('bad') && !!hot.querySelector('.fid') && !!k && k.A.g.shape === 'stack'; }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!arranged) problems.push(tag + ': Arrange does not set the shape in your stack, or stacking does not heat the die with its marked figure');
    const back = await page.waitForFunction(() => { const b = document.querySelector('#studioui .sdctl [data-opt="few"]'), u = document.getElementById('studioui'); if (b && !u.dataset.recipe.endsWith('/few')) b.click();
      const hot = document.querySelector('#studioLabels .sdl.figure[data-part="hottest"]'); return u.dataset.recipe.endsWith('/few') && !!hot && !hot.classList.contains('bad'); }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!back) problems.push(tag + ': Arrange does not go back to today\'s few big cores, cool again');
    /* in, continuously: ↓ flies to the block, the camera passing between the levels; the address follows */
    await page.evaluate(() => { window.posSeen = []; const c = document.getElementById('studioCanvas'); new MutationObserver(() => window.posSeen.push(+c.dataset.pos)).observe(c, { attributes: true, attributeFilter: ['data-pos'] }); });
    const inBlock = await page.waitForFunction(() => { const c = document.getElementById('studioCanvas');
      if (c.dataset.level === 'chip' && !c.dataset.flying) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      return c.dataset.level === 'block' && !c.dataset.flying && location.hash === '#/studio/block'; }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!inBlock) problems.push(tag + ': ↓ does not go in from the die to the block');
    else if (!(await page.evaluate(() => window.posSeen.some(p => p > 0.05 && p < 0.95)))) problems.push(tag + ': the die is entered with a cut, not a flight (' + (await page.evaluate(() => window.posSeen.join(' '))) + ')');
    /* your block (#508): scrambled, the wire grows and the longest path turns late; let to settle, it comes back on time;
       a few random tests miss the bug planted in a corner, every state finds it */
    const blockOk = await page.waitForFunction(() => { const u = document.getElementById('studioui').dataset, b = document.querySelector('#studioui .sdctl [data-place="scramble"]');
      if (b && !u.late) b.click(); const p = document.querySelector('#studioLabels [data-part="path"]');
      return u.late === '1' && !!p && p.classList.contains('bad') && !!p.querySelector('.fid'); }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!blockOk) problems.push(tag + ': scrambling your block does not make its longest path late, marked');
    const settledOk = await page.waitForFunction(() => { const u = document.getElementById('studioui').dataset, b = document.querySelector('#studioui .sdctl [data-place="settle"]');
      if (b && !b.disabled && !u.settled) b.click(); return !!u.settled && u.late === '' && +u.wire === +u.settled; }, null, { timeout: 30000, polling: 1000 }).then(() => true, () => false);
    if (!settledOk) problems.push(tag + ': letting your block settle does not bring it back on time');
    const covered = await page.waitForFunction(() => { const u = document.getElementById('studioui').dataset, b = document.querySelector('#studioui .sdctl [data-tests="all"]');
      if (b && u.tested !== '64') b.click(); return u.tested === '64' && u.found === '1' && !!document.querySelector('#studioLabels [data-part="found"].bad'); }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!covered) problems.push(tag + ': testing every state does not find the bug planted in a corner');
    await page.evaluate(() => { const b = document.querySelector('#studioui .sdctl [data-place="hand"]'); if (b) b.click(); });
    /* the rail takes you to any level: the switch, one cell close, with its words */
    const atSwitch = await page.waitForFunction(() => { const c = document.getElementById('studioCanvas'), b = document.querySelector('#studioui .rail2 [data-rail="switch"]');
      if (c.dataset.level !== 'switch' && !c.dataset.flying && b) b.click();
      return c.dataset.level === 'switch' && !c.dataset.flying && location.hash === '#/studio/switch' && [...document.querySelectorAll('#studioLabels .sdl')].some(l => l.dataset.part.startsWith('cell:')); }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!atSwitch) problems.push(tag + ': the rail does not take you to the switch, one cell close and named');
    /* ↑ comes out to the gate */
    const atGate = await page.waitForFunction(() => { const c = document.getElementById('studioCanvas');
      if (c.dataset.level === 'switch' && !c.dataset.flying) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      return c.dataset.level === 'gate' && !c.dataset.flying; }, null, { timeout: 30000, polling: 500 }).then(() => true, () => false);
    if (!atGate) problems.push(tag + ': ↑ does not come out from the switch to the gate');
    /* along: → leads to the gate as made */
    const made = await page.waitForFunction(() => { if (location.hash.startsWith('#/studio')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      return location.hash === '#/chip/2/build'; }, null, { timeout: 30000, polling: 1000 }).then(() => true, () => false);
    if (!made) problems.push(tag + ': along from the gate as designed does not lead to the gate as made (' + (await page.evaluate(() => location.hash)) + ')');
    /* the room walked through before: its old addresses open the die at the level of their corner (layout: the block) */
    const old = await page.waitForFunction(() => { if (!location.hash.startsWith('#/studio')) location.hash = '#/place/studio/5'; const c = document.getElementById('studioCanvas');
      return location.hash === '#/studio/block' && !c.hidden && c.dataset.level === 'block' && !c.dataset.flying; }, null, { timeout: 30000, polling: 1000 }).then(() => true, () => false);
    if (!old) problems.push(tag + ': an old address of the room does not open the die at its corner\'s level');
    await page.close();
  }
  /* a design that does not do its job: the die says so, and the line will not make it */
  { const tag = 'studio: a broken design'; S.at = tag;
    const page = await browser3d.newPage({ viewport: { width: 1280, height: 820 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); localStorage.setItem('osl-world-v1', JSON.stringify({ bench: { p: 'half', code: 'nonsense =' } })); } catch (e) { /* no storage */ } });
    await page.goto(base + 'index.html#/studio/block');
    const said = await page.waitForFunction(() => { const u = document.getElementById('studioui'), c = document.getElementById('studioCanvas');
      return !u.hidden && u.dataset.broken === 'design' && c.dataset.level === 'block' && !!document.querySelector('#studioLabels .sdl.bad'); }, null, { timeout: 60000 }).then(() => true, () => false);
    if (!said) problems.push(tag + ': a design that does not do its job is not said on the die');
    await page.close(); }
}
