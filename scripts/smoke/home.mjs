/* Hold, the first page (#/, src/v2/hold.js): nothing 3D is drawn there. One transistor, 0 until you press and 1 while
   you do; the hold doubles the count and slows at three moments that wait with something to try (the right chip for
   the job, a test that passes, the light), each beside its question; the wall; then the four walls, the arrangement and
   its challenge, your machine and the island, each a tap away in the tabs; four languages; the island and the brand
   lead out and back */
import { S } from './shared.mjs';

export const about = 'Hold, the first page: one transistor, 0 and 1, the hold slowing at three moments that wait with something to try, the wall, the four walls each beside its question, the arrangement and its challenge, your machine, the island, the five parts a tap away, four languages, desktop and phone';

export default async function run() {
  const { browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'home ' + w, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: w < 500 });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if ((m.type() === 'error' || /Missing text/.test(m.text())) && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
    await hp.goto(base + 'index.html');
    await hp.waitForFunction(() => !document.getElementById('home').hidden && !!window.__hold && document.querySelectorAll('#home .h-tabs button[data-k]').length === 5 && /transistor/i.test(document.getElementById('hd-unit').textContent), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page is not Hold, starting from one transistor, with its five parts in tabs'));
    if (await hp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the first page');
    /* the transistor reads 0, and 1 while it is held */
    if (!(await hp.evaluate(() => (document.querySelector('#home .h-bit b') || {}).textContent === '0'))) problems.push(tag + ': the transistor does not read 0 at rest');
    await hp.waitForFunction(() => { const b = document.getElementById('hd-hold'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); return (document.querySelector('#home .h-bit b') || {}).textContent === '1'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': holding does not turn the transistor to 1'));
    /* held, the count doubles */
    await hp.waitForFunction(() => window.__hold.state().d > 1, null, { timeout: 20000 }).catch(() => problems.push(tag + ': holding does not double the count'));
    await hp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    /* each moment waits with something to try, beside its question, and the hold goes on past it */
    const moment = async (at, id, act, what) => {
      await hp.evaluate(at => window.__hold.set(at), at);
      await hp.waitForFunction(id => window.__hold.state().moment === id && !!document.querySelector('#home .h-moment[data-m="' + id + '"] .h-mqq em'), id, { timeout: 10000 }).catch(() => problems.push(tag + ': the moment ' + id + ' shows nothing to try, or no question'));
      await hp.waitForFunction(act, null, { timeout: 10000 }).catch(() => problems.push(tag + ': ' + what));
    };
    await moment(11.4, 'job', () => { const r = document.getElementById('hd-mj'); if (r && r.value !== '0') { r.value = '0'; r.dispatchEvent(new Event('input', { bubbles: true })); } return /×1/.test((document.getElementById('hd-mo') || {}).textContent || ''); }, 'sliding to one job does not change the energy');
    await moment(23.4, 'bug', () => { const b = document.getElementById('hd-mb2'); if (b && !/1\.333739/.test(document.getElementById('hd-mo').textContent)) b.click(); return /1\.333739/.test((document.getElementById('hd-mo') || {}).textContent || '') && !!document.querySelector('#hd-mo a[href^="http"]'); }, 'the worst case does not show the wrong answer and its source');
    await moment(34.9, 'light', () => { const b = document.querySelector('#hd-ml button[data-i="2"]'); if (b && !b.classList.contains('on')) b.click(); return !!document.querySelector('#hd-ml button[data-i="2"].on') && /\$/.test(document.getElementById('hd-mo').textContent); }, 'the new light does not say what it costs');
    if (!(await hp.evaluate(() => window.__hold.state().tried.length === 3))) problems.push(tag + ': the moments tried are not kept');
    /* the hold slows at a moment, never stops: held there, the count still moves */
    { const d0 = await hp.evaluate(() => { window.__hold.set(11.2); document.getElementById('hd-hold').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); return window.__hold.state().d; });
      await hp.waitForFunction(d0 => window.__hold.state().d > d0 + 0.3, d0, { timeout: 20000 }).catch(() => problems.push(tag + ': the hold stops at a moment'));
      await hp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))); }
    /* a tab jumps to its part, even before the wall */
    await hp.waitForFunction(() => { const b = document.querySelector('#home .h-tabs button[data-k="walls"]'); if (b && !window.__hold.state().atWall) b.click(); const s = document.getElementById('hd-s-switch'); return window.__hold.state().atWall && !!s && s.getBoundingClientRect().top < innerHeight * .7; }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the tab for the four walls does not lead to them'));
    await hp.waitForFunction(() => document.querySelector('#hd-s-switch .h-cq p').textContent.length > 20 && !!document.querySelector('#hd-s-switch .h-cq a[href^="#/"]'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': a wall stands without its question'));
    await hp.waitForFunction(() => { const r = document.getElementById('hd-w-sw'); if (r && r.value !== '3') { r.value = '3'; r.dispatchEvent(new Event('input', { bubbles: true })); } return /1,000/.test(document.getElementById('hd-o-switch').textContent); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': taking voltage off does not answer with the leak'));
    /* the arrangement's challenge: find where a number never travels */
    await hp.waitForFunction(() => { document.getElementById('hd-s-arch').scrollIntoView(); for (const i of [2, 4]) { const b = document.querySelector('#hd-a-sel button[data-i="' + i + '"]'); if (b) b.click(); } return !document.getElementById('hd-a-cq').hidden; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the arrangement challenge cannot be won, or shows no question'));
    /* your machine: an agent offers, you keep */
    await hp.waitForFunction(() => { document.getElementById('hd-s-machine').scrollIntoView(); const a = document.getElementById('hd-m-agent'), k = document.getElementById('hd-m-keep'); if (a && !/\d/.test(document.getElementById('hd-m-gen').textContent)) a.click(); else if (k && !k.disabled) k.click(); return window.__hold && document.getElementById('hd-enter').getAttribute('href').startsWith('#/machines/'); }, null, { timeout: 15000 }).catch(() => problems.push(tag + ': a machine cannot be generated and kept'));
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
