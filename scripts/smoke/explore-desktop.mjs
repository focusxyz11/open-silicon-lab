import { explore } from './walk.mjs';
import { S } from './shared.mjs';

export const about = 'the chip world at 1280 px, light: the loop, the first challenge, the worlds and their tries, every 3D level, the dives, the commons, the frame, the bench, the board; the island\'s handles and lens bar';

export default async () => { await explore('explore desktop', { width: 1280, height: 800 }, 'light'); await handles(); };

/* the island's handles (#371): your chip carried by the pin it stands at and let go, then a place's name tapped opens
   that place (the press on the pin once swallowed the next tap on any name); the pin tapped without moving opens its
   place; and the lens bar shows the lens that is on after What if? lends the island its own and gives yours back */
async function handles() {
  const { browser3d, base, problems } = S, tag = 'explore desktop: the island\'s handles';
  S.at = tag; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  await page.goto(base + 'index.html#/island');
  /* where the pin and the factory's name are on the island, once both show */
  const at = async () => { await page.waitForFunction(() => { if (location.hash !== '#/island') location.hash = '#/island'; const p = document.querySelector('#mapLabels .pin3.here'), f = document.querySelector('#mapLabels .place3[data-place="fab"]');
      return !!p && !!f && p.getBoundingClientRect().width > 0 && f.getBoundingClientRect().width > 0; }, null, { timeout: 60000, polling: 500 }).catch(() => {});
    return page.evaluate(() => { const r = e => { const b = e && e.getBoundingClientRect(); return b && b.width ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : null; }, pin = document.querySelector('#mapLabels .pin3.here');
      return { place: pin && pin.dataset.place, pin: r(pin), fab: r(document.querySelector('#mapLabels .place3[data-place="fab"]')) }; }); };
  /* carried a little way onto open ground and let go, then the factory's name: the factory opens */
  let carried = false;
  for (let i = 0; i < 5 && !carried; i++) { const p = await at(); if (!p.pin || !p.fab) continue;
    await page.mouse.move(p.pin.x, p.pin.y); await page.mouse.down(); await page.mouse.move(p.pin.x + 40, p.pin.y + 110, { steps: 6 }); await page.mouse.up();
    await page.mouse.click(p.fab.x, p.fab.y);
    carried = await page.waitForFunction(() => location.hash === '#/place/fab', null, { timeout: 8000 }).then(() => true, () => false); }
  if (!carried) problems.push(tag + ': after your chip is carried by its pin, tapping a place\'s name does not open that place');
  /* the pin tapped without moving opens the place of the step your chip is at */
  await page.reload();
  let opened = false;
  for (let i = 0; i < 5 && !opened; i++) { const p = await at(); if (!p.pin) continue;
    await page.mouse.click(p.pin.x, p.pin.y);
    opened = await page.waitForFunction(place => location.hash === '#/place/' + place, p.place, { timeout: 8000 }).then(() => true, () => false); }
  if (!opened) problems.push(tag + ': a tap on the pin your chip stands at does not open its place');
  /* a lens on, What if? opened and closed: the lens comes back, the bar shows it, and tapping it again turns it off */
  await page.evaluate(() => { location.hash = '#/island'; });
  await page.waitForFunction(() => { const b = document.querySelector('.lensbar [data-lens="heat"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('.lensbar [data-lens="heat"][aria-pressed="true"]'); }, null, { timeout: 30000, polling: 500 })
    .catch(() => problems.push(tag + ': the heat lens does not come on'));
  await page.evaluate(() => { location.hash = '#/whatif'; });
  await page.waitForFunction(() => document.getElementById('sheet').classList.contains('whatif') && !document.getElementById('sheet').hidden, null, { timeout: 30000 }).catch(() => problems.push(tag + ': What if? does not open'));
  await page.evaluate(() => { location.hash = '#/island'; });
  await page.waitForFunction(() => !document.getElementById('sheet').classList.contains('whatif') && !!document.querySelector('.lensbar [data-lens="heat"][aria-pressed="true"]'), null, { timeout: 30000 })
    .catch(() => problems.push(tag + ': after What if? closes, the lens bar does not show the lens you had on'));
  await page.evaluate(() => { const b = document.querySelector('.lensbar [data-lens="heat"]'); if (b) b.click(); });
  await page.waitForFunction(() => !!document.querySelector('.lensbar [data-lens="look"][aria-pressed="true"]'), null, { timeout: 10000 })
    .catch(() => problems.push(tag + ': after What if?, tapping the lens the bar shows pressed does not turn it off'));
  /* every lens says its name without a hover (#381) */
  await page.mouse.move(640, 760);
  await page.waitForFunction(() => { const n = [...document.querySelectorAll('.lensbar [data-lens] .nm')]; return n.length === 5 && n.every(e => e.getBoundingClientRect().width > 0 && e.textContent.trim()); }, null, { timeout: 10000 })
    .catch(() => problems.push(tag + ': the lens buttons do not all show their names'));
  /* zoomed out, the island's places fold into one name, and it stays a name: it once took the first page's .home and
     covered the whole picture */
  const far = await page.waitForFunction(() => {
    const cv = document.getElementById('mapCanvas');
    if (cv) cv.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, clientX: innerWidth * 0.8, clientY: innerHeight * 0.6, bubbles: true, cancelable: true }));
    const n = document.querySelector('#mapLabels .place3.homeisle'), b = n && n.getBoundingClientRect();
    return n && n.style.opacity !== '0' && b.width > 0 ? { w: b.width, h: b.height } : false;
  }, null, { timeout: 30000, polling: 300 }).then(h => h.jsonValue(), () => null);
  if (!far) problems.push(tag + ': zoomed out, the island\'s one name does not show');
  else if (far.w > 400 || far.h > 80) problems.push(tag + ': zoomed out, the island\'s one name covers the picture (' + Math.round(far.w) + ' x ' + Math.round(far.h) + ' px)');
  await page.close();
}
