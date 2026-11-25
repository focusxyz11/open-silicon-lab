import { explore } from './walk.mjs';
import { S } from './shared.mjs';

export const about = 'the same walk at 390 px, dark; your chip carried by touch';

export default async () => { await explore('explore phone', { width: 390, height: 844 }, 'dark'); await carryByTouch(); };

/* your chip carried by touch (#371): the pin it stands at is a handle a finger can hold, so the browser does not take
   the touch away; a touch the browser cancels picks nothing; a touch let go over the factory carries the chip there */
async function carryByTouch() {
  const { browser3d, base, problems } = S, tag = 'explore phone: carrying your chip by touch';
  S.at = tag; const page = await browser3d.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', reducedMotion: 'reduce', hasTouch: true, isMobile: true });
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  await page.goto(base + 'index.html#/island');
  const cdp = await page.context().newCDPSession(page);
  /* where the pin is, and a point on the factory (under its name), once both show on the island */
  const at = async () => { await page.waitForFunction(() => { if (location.hash !== '#/island') location.hash = '#/island'; const p = document.querySelector('#mapLabels .pin3.here'), f = document.querySelector('#mapLabels .place3[data-place="fab"]');
      return !!p && !!f && p.getBoundingClientRect().width > 0 && f.getBoundingClientRect().width > 0; }, null, { timeout: 60000, polling: 500 }).catch(() => {});
    return page.evaluate(() => { const r = (e, dy) => { const b = e && e.getBoundingClientRect(); return b && b.width ? { x: b.left + b.width / 2, y: b.top + b.height / 2 + dy } : null; };
      return { pin: r(document.querySelector('#mapLabels .pin3.here'), 0), fab: r(document.querySelector('#mapLabels .place3[data-place="fab"]'), 40) }; }); };
  const drag = async (p, end) => { const pt = (x, y) => [{ x, y, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(p.pin.x, p.pin.y) });
    for (let k = 1; k <= 10; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(p.pin.x + (p.fab.x - p.pin.x) * k / 10, p.pin.y + (p.fab.y - p.pin.y) * k / 10) });
    await cdp.send('Input.dispatchTouchEvent', { type: end, touchPoints: [] }); };
  if (!(await at()).pin || await page.evaluate(() => getComputedStyle(document.querySelector('#mapLabels .pin3.here')).touchAction !== 'none')) problems.push(tag + ': the pin your chip stands at lets the browser take a touch on it');
  /* a cancelled touch over the factory: nothing is carried, nothing opens */
  { const p = await at(); if (p.pin && p.fab) await drag(p, 'touchCancel'); }
  if (await page.evaluate(() => location.hash !== '#/island' || !!document.querySelector('.insp:not([hidden]) .icarry'))) problems.push(tag + ': a cancelled touch carried your chip somewhere');
  /* a touch let go over the factory: the chip is set down there and the factory says what it does with it */
  let carried = false;
  for (let i = 0; i < 5 && !carried; i++) { const p = await at(); if (!p.pin || !p.fab) continue; await drag(p, 'touchEnd');
    carried = await page.waitForFunction(() => location.hash === '#/place/fab' && !!document.querySelector('.insp:not([hidden]) .icarry'), null, { timeout: 8000 }).then(() => true, () => false); }
  if (!carried) problems.push(tag + ': your chip cannot be carried by touch from its pin to a place');
  await page.close();
}
