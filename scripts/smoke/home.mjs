/* Hold, the first page (#/, src/v2/hold.js): nothing 3D is drawn there. One transistor, 0 until you press and 1 while
   you do; scrolling is time and holding scrolls for you, slowing at four moments with something to try, each beside its
   question; Moore's law drawn live beside the count, with its three challenges; the wall, day staying day; then the four
   walls, the next fifty years, how the machine grew and the arrangement, your machine and the island, each a tap away on
   the rail at the left, with the challenges counted there; four languages; the island and the brand lead out and back */
import { S } from './shared.mjs';

export const about = 'Hold, the first page: one transistor, 0 and 1, scrolling and holding through fifty years, four moments, Moore\'s law live with its challenges, the wall without turning dark by day, the four walls, the next fifty, how the machine grew, your machine, the island, the rail of chapters and challenges, four languages, desktop and phone';

export default async function run() {
  const { browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'home ' + w, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: w < 500 });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if ((m.type() === 'error' || /Missing text/.test(m.text())) && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
    await hp.goto(base + 'index.html');
    await hp.waitForFunction(() => !document.getElementById('home').hidden && !!window.__hold && document.querySelectorAll('#hd-chap > li[data-k]').length === 6 && document.querySelectorAll('#hd-tsq button').length === 12 && !!document.getElementById('hd-cv') && /transistor/i.test(document.getElementById('hd-unit').textContent), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page is not Hold, starting from one transistor, with its chapters and challenges on the rail and the chart beside the count'));
    if (await hp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the first page');
    /* the transistor reads 0, and 1 while it is held */
    if (!(await hp.evaluate(() => (document.querySelector('#home .h-bit b') || {}).textContent === '0'))) problems.push(tag + ': the transistor does not read 0 at rest');
    await hp.waitForFunction(() => { const b = document.getElementById('hd-hold'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); return (document.querySelector('#home .h-bit b') || {}).textContent === '1'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': holding does not turn the transistor to 1'));
    /* scrolling is time: scroll down and the count follows, with nothing held */
    await hp.waitForFunction(() => { const h = document.getElementById('home'); if (h.scrollTop < 900) h.scrollTop = 1000; return window.__hold.state().d > 3; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': scrolling does not move the fifty years'));
    await hp.evaluate(() => window.__hold.set(0));
    /* held, the count doubles */
    await hp.waitForFunction(() => window.__hold.state().d > 1, null, { timeout: 20000 }).catch(() => problems.push(tag + ': holding does not double the count'));
    await hp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    /* each moment waits with something to try, beside its question, and the hold goes on past it */
    const moment = async (at, id, act, what) => {
      await hp.evaluate(at => window.__hold.set(at), at);
      await hp.waitForFunction(id => window.__hold.state().moment === id && !!document.querySelector('#home .h-moment[data-m="' + id + '"] .h-mqq em'), id, { timeout: 10000 }).catch(() => problems.push(tag + ': the moment ' + id + ' shows nothing to try, or no question'));
      await hp.waitForFunction(act, null, { timeout: 10000 }).catch(() => problems.push(tag + ': ' + what));
    };
    await moment(2.2, 'gate', () => { const g = window.__hold.state(); if (document.getElementById('hd-gout') && document.getElementById('hd-gout').textContent !== '0') { const a = document.getElementById('hd-ga'), b = document.getElementById('hd-gb'); if (a.textContent === '0') a.click(); else if (b.textContent === '0') b.click(); } return (document.getElementById('hd-gout') || {}).textContent === '0' && /NAND/.test(document.getElementById('hd-mo').textContent) && g.d >= 2; }, 'four transistors do not answer as a NAND gate');
    if (!(await hp.evaluate(() => /^4\b/.test(document.getElementById('hd-num').textContent.replace(/\s/g, ''))))) problems.push(tag + ': the gate moment does not count four transistors');
    await moment(11.4, 'job', () => { const r = document.getElementById('hd-mj'); if (r && r.value !== '0') { r.value = '0'; r.dispatchEvent(new Event('input', { bubbles: true })); } return /×1/.test((document.getElementById('hd-mo') || {}).textContent || ''); }, 'sliding to one job does not change the energy');
    await moment(23.4, 'bug', () => { const b = document.getElementById('hd-mb2'); if (b && !/1\.333739/.test(document.getElementById('hd-mo').textContent)) b.click(); return /1\.333739/.test((document.getElementById('hd-mo') || {}).textContent || '') && !!document.querySelector('#hd-mo a[href^="http"]'); }, 'the worst case does not show the wrong answer and its source');
    await moment(34.9, 'light', () => { const b = document.querySelector('#hd-ml button[data-i="2"]'); if (b && !b.classList.contains('on')) b.click(); return !!document.querySelector('#hd-ml button[data-i="2"].on') && /\$/.test(document.getElementById('hd-mo').textContent); }, 'the new light does not say what it costs');
    if (!(await hp.evaluate(() => window.__hold.state().tried.length === 4))) problems.push(tag + ': the moments tried are not kept');
    /* the hold slows at a moment, never stops: held there, the count still moves */
    { const d0 = await hp.evaluate(() => { window.__hold.set(11.2); document.getElementById('hd-hold').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); return window.__hold.state().d; });
      await hp.waitForFunction(d0 => window.__hold.state().d > d0 + 0.3, d0, { timeout: 20000 }).catch(() => problems.push(tag + ': the hold stops at a moment'));
      await hp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))); }
    /* Moore's law, live: find the pace that fits the chips, then where the clock stopped (tap its year), then guess 2026 before getting there */
    await hp.evaluate(() => window.__hold.set(30));
    await hp.waitForFunction(() => { const r = document.getElementById('hd-c-ev'); if (r && r.value !== '2') { r.value = '2'; r.dispatchEvent(new Event('input', { bubbles: true })); } return window.__hold.state().done.includes('fit'); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the pace of the chips cannot be found on the chart'));
    await hp.waitForFunction(() => { const b = document.querySelector('#hd-c-ser [data-s="hz"]'); if (b && !b.classList.contains('on')) b.click(); const cv = document.getElementById('hd-cv'), r = cv.getBoundingClientRect(), small = r.width < 420, L = small ? 34 : 44, x = r.left + L + (2005 - 1957) / (2031 - 1957) * (r.width - L - 8);
      for (const t of ['pointerdown', 'pointerup']) cv.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: r.top + 20, pointerId: 1 })); return window.__hold.state().done.includes('knee'); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': tapping the year the clock stopped does not count'));
    await hp.waitForFunction(() => { window.__hold.set(30); const b = document.getElementById('hd-c-gs'); if (b && !document.getElementById('hd-root').classList.contains('is-guessing')) b.click(); const cv = document.getElementById('hd-cv'), r = cv.getBoundingClientRect();
      if (document.getElementById('hd-root').classList.contains('is-guessing')) cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.right - 12, clientY: r.top + r.height * .2, pointerId: 1 })); return !!window.__hold.state().chart.guess; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': no guess for 2026 can be made on the chart'));
    await hp.evaluate(() => window.__hold.set(99));
    await hp.waitForFunction(() => window.__hold.state().done.includes('guess') && /336/.test(document.getElementById('hd-say').textContent), null, { timeout: 10000 }).catch(() => problems.push(tag + ': the guess for 2026 is not answered at the wall'));
    /* by day the page stays day, even at the wall */
    if (scheme === 'light' && !(await hp.evaluate(() => { const c = getComputedStyle(document.getElementById('hd-root')).backgroundColor.match(/\d+/g).map(Number); return c[0] > 200; }))) problems.push(tag + ': by day the first page turns dark at the wall');
    /* the rail leads to every chapter, even from the top */
    await hp.evaluate(() => window.__hold.set(0));
    await hp.waitForFunction(() => { const s = document.getElementById('hd-s-switch'); if (!s || s.getBoundingClientRect().top > innerHeight) document.querySelector('#hd-chap li[data-k="walls"] .h-ch').click(); return !!s && s.getBoundingClientRect().top < innerHeight * .7; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the rail does not lead to the four walls'));
    /* the checks (after Fable's Tapeout): at a wall the square marks where it bites, the strip under it counts the walls found, and on a desktop wires cross the middle from the words to it */
    await hp.waitForFunction(() => { const s = document.getElementById('hd-s-switch'); if (s.getBoundingClientRect().top > innerHeight * .4) s.scrollIntoView(); return !!document.querySelector('#hd-dl .h-vio.on') && /1/.test(document.getElementById('hd-dfound').textContent); }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': at a wall the check marks nothing on the square, or the strip under it counts nothing'));
    if (w >= 1100 && !(await hp.evaluate(() => { const c = document.getElementById('hd-wires'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) return true; return false; }))) problems.push(tag + ': no wires cross the middle at a wall');
    await hp.waitForFunction(() => document.querySelector('#hd-s-switch .h-cq p').textContent.length > 20 && !!document.querySelector('#hd-s-switch .h-cq a[href^="#/"]'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': a wall stands without its question'));
    await hp.waitForFunction(() => { const r = document.getElementById('hd-w-sw'); if (r && r.value !== '3') { r.value = '3'; r.dispatchEvent(new Event('input', { bubbles: true })); } return /1,000/.test(document.getElementById('hd-o-switch').textContent); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': taking voltage off does not answer with the leak'));
    /* the next fifty years: hold again, down to the floor, and its question opens */
    await hp.waitForFunction(() => { const s = document.getElementById('hd-s-next'); s.scrollIntoView(); const b = document.getElementById('hd-nbtn'); if (b && !b.classList.contains('on')) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return !document.getElementById('hd-ncq').hidden && /×/.test(document.getElementById('hd-nnum').textContent); }, null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': holding again does not reach the floor'));
    await hp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    /* the arrangement's challenge: find where a number never travels */
    await hp.waitForFunction(() => { document.getElementById('hd-s-arch').scrollIntoView(); for (const i of [2, 4]) { const b = document.querySelector('#hd-a-sel button[data-i="' + i + '"]'); if (b) b.click(); } return !document.getElementById('hd-a-cq').hidden; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the arrangement challenge cannot be won, or shows no question'));
    /* how the machine grew: every era, drawn on the square */
    await hp.waitForFunction(() => { document.getElementById('hd-s-arch').scrollIntoView(); document.querySelectorAll('#hd-a-era button').forEach(b => b.click()); return window.__hold.state().done.includes('eras') && document.getElementById('hd-o-era').textContent.length > 60; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the eras of the machine cannot all be seen'));
    /* your machine: an agent offers, you keep */
    await hp.waitForFunction(() => { document.getElementById('hd-s-machine').scrollIntoView(); const a = document.getElementById('hd-m-agent'), k = document.getElementById('hd-m-keep'); if (a && !/\d/.test(document.getElementById('hd-m-gen').textContent)) a.click(); else if (k && !k.disabled) k.click(); return window.__hold && document.getElementById('hd-enter').getAttribute('href').startsWith('#/machines/'); }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': a machine cannot be generated and kept'));
    if (!(await hp.evaluate(() => document.querySelectorAll('#hd-tsq button.on').length >= 9))) problems.push(tag + ': the rail does not count the challenges done');
    const side = await hp.evaluate(() => { const p = document.getElementById('home'); return p.scrollWidth - p.clientWidth; });
    if (side > 1) problems.push(tag + ': the first page scrolls sideways by ' + side + ' px');
    /* the first page in another language, and back */
    await hp.goto(base + 'index.html?lang=zh#/');
    await hp.waitForFunction(() => document.documentElement.lang === 'zh' && /晶体管/.test((document.getElementById('hd-unit') || {}).textContent || ''), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page does not show in Chinese'));
    /* the language is a small menu in the bar, on every page; on the first page the loop waits */
    if (!(await hp.evaluate(() => document.body.classList.contains('firstpage') && getComputedStyle(document.getElementById('loop')).visibility === 'hidden'))) problems.push(tag + ': the loop shows on the first page');
    await hp.click('#langbtn').then(() => hp.waitForFunction(() => !document.getElementById('langmenu').hidden && document.querySelectorAll('#langmenu [data-lang]').length === 4, null, { timeout: 5000 })).then(() => hp.click('#langmenu [data-lang="en"]')).catch(() => problems.push(tag + ': the bar has no language menu'));
    await hp.waitForFunction(() => document.documentElement.lang === 'en' && /transistor/.test((document.getElementById('hd-unit') || {}).textContent || ''), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page does not come back to English'));
    /* the island is one tap away at the end, and the brand comes back */
    await hp.waitForFunction(() => window.__hold, null, { timeout: 20000 });
    await hp.evaluate(() => { window.__hold.set(99); });
    await hp.waitForFunction(() => { const a = document.getElementById('hd-enter'); if (a && location.hash !== '#/island') a.click(); return location.hash === '#/island'; }, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page offers no way to the island'));
    await hp.waitForFunction(() => document.getElementById('home').hidden && !document.getElementById('mapCanvas').hidden, null, { timeout: 30000 }).catch(() => problems.push(tag + ': the island does not open from the first page'));
    await hp.click('.bar .brand').catch(() => problems.push(tag + ': no brand in the bar'));
    await hp.waitForFunction(() => !document.getElementById('home').hidden && document.getElementById('mapCanvas').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the brand does not lead back to the first page'));
    await hp.close();
  }
}
