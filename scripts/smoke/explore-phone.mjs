import { explore } from './walk.mjs';
import { S } from './shared.mjs';

export const about = 'the same walk at 390 px, dark; your chip carried by touch; the bench and four labs readable';

export default async () => { await explore('explore phone', { width: 390, height: 844 }, 'dark'); await carryByTouch(); await readable(); await studioSteps(); };

/* the bench and four labs readable on a phone (#374): in each instrument every word stays inside the boxes that hold it
   (a box that scrolls may hide what is under it, never what is beside it), no word lies over another (figures in a
   drawing keep a little room between them), and the bench stands clear above the card. One move per page, done again
   at every poll: a lab's guess or run, so its figures show */
async function readable() {
  const { browser, base, problems } = S, tag = 'explore phone: readable';
  S.at = tag; const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce', hasTouch: true, isMobile: true });
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  const look = ([h, roots, ready, move, final]) => {
    if (location.hash !== h) { location.hash = h; return final ? ['the page did not open'] : false; }
    if (move) { const b = document.querySelector(move); if (b && !b.dataset.smoked) { b.dataset.smoked = '1'; b.click(); } }
    const R = [...document.querySelectorAll(roots)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
    if (!R.length || !document.querySelector(ready)) return final ? ['it did not draw'] : false;
    const out = [], boxes = [], at = (txt, what) => out.push('"' + txt.slice(0, 24) + '" ' + what);
    const style = e => getComputedStyle(e), scrolls = e => /auto|scroll/.test(style(e).overflowX + style(e).overflowY);
    for (const root of R) {
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const txt = n.textContent.trim(), el = n.parentElement; if (!txt || !el || el.closest('[hidden], textarea')) continue;
        const cs = style(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const svg = el instanceof SVGElement; let rects;
        if (svg) { const tx = el.closest('text'); if (!tx) continue; rects = [tx.getBoundingClientRect()]; }
        else { const rg = document.createRange(); rg.selectNodeContents(n); rects = [...rg.getClientRects()].filter(r => r.width > 0.5 && r.height > 0.5); }
        for (const r of rects) {
          /* inside every box that holds it: the root, a drawing, a box that clips, a control, its own block */
          for (let a = svg ? el.closest('svg') : el; a; a = a.parentElement) {
            const A = a.getBoundingClientRect(), html = !(a instanceof SVGElement), sc = html && scrolls(a), slack = Math.max(3, r.height / 4);
            const box = a === root || a.tagName === 'svg' || (html && (style(a).overflowX !== 'visible' || /^(BUTTON|LABEL|INPUT)$/.test(a.tagName) || (a === el && style(a).display !== 'inline')));
            if (box && A.width > 0 && (r.left < A.left - 1.5 || r.right > A.right + 1.5 || (!sc && (r.top < A.top - slack || r.bottom > A.bottom + slack)))) { at(txt, 'runs out of its box'); break; }
            if (a === root) break;
          }
          /* what a scrolling box hides lies over nothing */
          let v = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
          for (let a = el.parentElement; a && a !== root.parentElement; a = a.parentElement) if (!(a instanceof SVGElement) && style(a).overflowY !== 'visible') { const A = a.getBoundingClientRect(); v = { left: Math.max(v.left, A.left), right: Math.min(v.right, A.right), top: Math.max(v.top, A.top), bottom: Math.min(v.bottom, A.bottom) }; }
          if (v.right - v.left > 1 && v.bottom - v.top > 1) boxes.push({ v, txt, svg });
        }
      }
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].v, b = boxes[j].v, w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if ((w > 2 || (boxes[i].svg && boxes[j].svg && w > -2.5)) && h > Math.min(a.bottom - a.top, b.bottom - b.top) * 0.3) at(boxes[i].txt, 'lies over "' + boxes[j].txt.slice(0, 24) + '"');
    }
    /* the bench: as wide as the screen, and all of it above the card */
    const bs = document.querySelector('.bsurf:not([hidden])'), dk = document.querySelector('#diveui > .dockwrap');
    if (roots.startsWith('.bsurf')) { if (!bs || bs.getBoundingClientRect().width < innerWidth - 40) out.push('the bench is not as wide as the screen');
      else if (dk && R.some(e => e.getBoundingClientRect().bottom > dk.getBoundingClientRect().top + 1)) out.push('the bench runs under the card'); }
    return final ? out : !out.length;
  };
  const BK = '.bsurf:not([hidden]) .bk-r', INST = '.player [data-f2="instrument"]';
  for (const c of [['#/bench/logic/half', BK, '.bsurf .bk-logic .bk-ln'], ['#/bench/check/vote', BK, '.bsurf .bk-check .bk-say'], ['#/bench/check/full', BK, '.bsurf .bk-check .bk-say'],
    ['#/do/prove', BK, '.bsurf .bk-check .bk-say'], ['#/do/evolve', BK, '.bsurf .bk-gates .bk-g'], ['#/do/jobs', INST, '.fitline .fitk'],
    ['#/do/counter', INST, '.ckpc text.num:not(.want)', '[data-ckp-run]'], ['#/do/light', INST, '.lgtfig text.num ~ text.num ~ text.num ~ text.num', '[data-lgt-guess="bottom"]']]) {
    S.at = tag + ' ' + c[0];
    await page.goto(base + 'index.html' + c[0]);
    const ok = await page.waitForFunction(look, c, { timeout: 60000, polling: 1000 }).then(() => true, () => false);
    if (!ok) { const out = await page.evaluate(look, [c[0], c[1], c[2], c[3] || null, true]).catch(e => [e.message]); problems.push(tag + ': ' + c[0] + ' at 390 px: ' + (Array.isArray(out) && out.length ? out.slice(0, 4).join('; ') : 'not readable')); }
  }
  await page.close();
}

/* the studio seen from outside on a phone (#374): at none of its steps, the strip of steps waits rather than standing
   empty */
async function studioSteps() {
  const { browser3d, base, problems } = S, tag = 'explore phone: the studio from outside';
  S.at = tag; const page = await browser3d.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'light', reducedMotion: 'reduce', hasTouch: true, isMobile: true });
  await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
  page.on('pageerror', e => problems.push(tag + ': ' + e.message));
  await page.goto(base + 'index.html#/place/studio/0');
  const st = await page.waitForFunction(() => { if (location.hash !== '#/place/studio/0') location.hash = '#/place/studio/0';
    const u = document.getElementById('studioui'), n = u && !u.hidden && u.dataset.at === '0.0' && u.querySelector('.steps2');
    return n ? (getComputedStyle(n).display === 'none' || !!n.querySelector('.stn').textContent.trim() ? 'ok' : 'empty') : false; }, null, { timeout: 90000, polling: 1000 }).then(h => h.jsonValue(), () => null);
  if (st !== 'ok') problems.push(tag + ': ' + (st === 'empty' ? 'the strip of steps stands empty outside the studio' : 'the studio did not open from outside'));
  await page.close();
}

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
