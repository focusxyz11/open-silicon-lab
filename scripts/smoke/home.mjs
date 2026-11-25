/* Hold, the first page (#/, src/v2/hold.js): nothing 3D is drawn there. One story on one chip: one transistor, 0 until
   you press and 1 while you do; scrolling is time and holding scrolls for you through fifty years, with four moments
   played on the square and Moore's law live along the bottom with its three challenges; the wall, day staying day;
   then the camera pulls back to the whole chip, a check finds four walls, and it flies block to block (the walls, the
   next fifty years, how the machine grew, the arrangements, your machine, the island), each block a tap away on the
   small chip in the bar or the chapters at the left, with the twelve challenges counted in the bar; the sources; four
   languages; the island and the brand lead out and back */
import { S } from './shared.mjs';

export const about = 'Hold, the first page: one story on one chip — 0 and 1, scrolling and holding through fifty years, four moments, Moore\'s law live with its challenges, the wall without turning dark by day, the pull back to the whole chip and its four walls, every block\'s challenge, the bar\'s small chip and tally, the sources, Chinese and back, the island and back';

export default async function run() {
  const { browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'home ' + w, phone = w < 500, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: phone });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if ((m.type() === 'error' || /Missing text/.test(m.text())) && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ }
      /* a block's picture, with its controls */
      window.__p = id => document.querySelector('#hd-root .dblk .plate[data-id="' + id + '"]'); });
    const play = (what, fn, arg, timeout = 15000) => hp.waitForFunction(fn, arg, { timeout }).catch(() => problems.push(tag + ': ' + what));
    await hp.goto(base + 'index.html');
    await play('the first page does not open as one chip, with its small chip and its twelve challenges in the bar', () => !document.getElementById('home').hidden && !!window.__hold && document.querySelectorAll('#hd-root .dblk .plate').length === 11 &&
      document.querySelectorAll('.bar .hbar .d-map button').length === 12 && document.querySelectorAll('.bar .hbar .tally [data-ch]').length === 12, null, 20000);
    if (await hp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the first page');
    if (!(await hp.evaluate(() => document.body.classList.contains('firstpage') && getComputedStyle(document.getElementById('loop')).display === 'none'))) problems.push(tag + ': the loop shows on the first page');
    /* the transistor reads 0, and 1 while it is held */
    if (!(await hp.evaluate(() => /0\s*$/.test(window.__p('years').querySelector('.pl-fr span:last-child').textContent)))) problems.push(tag + ': the transistor does not read 0 at rest');
    const press = () => { const b = document.querySelector('#hd-root .b-hold .holdbtn'); if (!window.__hold.state().holding) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); };
    await play('holding does not make the transistor read 1', `(${press})(), /1\\s*$/.test(window.__p('years').querySelector('.pl-fr span:last-child').textContent)`);
    const release = () => hp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    await release();
    /* scrolling is time: scroll down and the count follows, with nothing held */
    await play('scrolling does not move the fifty years', () => { const e = document.getElementById('home'); if (e.scrollTop < 900) e.scrollTop = 1000; return window.__hold.state().d > 3; });
    await hp.evaluate(() => window.__hold.set(0));
    await play('holding does not double the count', `(${press})(), window.__hold.state().d > 1`, null, 20000);
    await release();
    /* the four moments, each played on the square */
    const at = (id, what, fn) => hp.evaluate(id => window.__hold.ch(id), id).then(() => play(what, fn));
    await at('gate', 'the gate cannot be played on the square', () => { const S = window.__hold.S, t = window.__p('years').querySelectorAll('.layer.on .tap'); if (t.length === 2) { if (!S.gate.a) t[0].click(); if (!S.gate.b) t[1].click(); } return !!S.done.gate; });
    await at('job', 'the right chip for one job cannot be chosen', () => { const r = window.__p('years').querySelector('.layer.on input[type=range]'); if (r && r.value !== '0') { r.value = '0'; r.dispatchEvent(new Event('input', { bubbles: true })); } return !!window.__hold.S.done.job; });
    await at('bug', 'the divider\'s wrong answer cannot be found', () => { const S = window.__hold.S, b = window.__p('years').querySelectorAll('.layer.on .pbtn'); if (b.length > 1) (S.bug.n ? b[1] : b[0]).click(); return !!S.done.bug; });
    await at('light', 'the new light cannot be chosen', () => { const b = window.__p('years').querySelectorAll('.layer.on .seg button'); if (b[2] && !b[2].classList.contains('on')) b[2].click(); return !!window.__hold.S.done.light; });
    /* Moore's law, live: the pace that fits the chips, the year the clock stopped, and a guess for 2026 */
    const tapChart = (year, f) => { const c = document.querySelector('#hd-root .b-band .chart'), r = c.getBoundingClientRect(), u = parseFloat(getComputedStyle(document.getElementById('hd-root')).getPropertyValue('--u')) || 1;
      const x = r.left + 34 * u + (year - 1957) / 73 * (r.width - 46 * u), y = r.top + r.height * f; for (const t of ['pointerdown', 'pointerup']) c.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 1 })); };
    await at('fit', 'the pace that fits the chips cannot be found', () => { const r = document.querySelector('#hd-root .cq input[data-a=every]'); if (r && r.value !== '2') { r.value = '2'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); } return !!window.__hold.S.done.fit; });
    await at('knee', 'the year the clock stopped cannot be tapped', `(() => { const b = document.querySelector('#hd-root .cq [data-a=hz]'); if (b) b.click(); if (window.__hold.S.cq.pick === 'knee') (${tapChart})(2004.5, .5); return !!window.__hold.S.done.knee; })()`);
    await at('guess', 'a guess for 2026 cannot be made', `(() => { const S = window.__hold.S, b = document.querySelector('#hd-root .cq [data-a=guess]'); if (!S.cq.guess && S.cq.pick !== 'guess' && b) b.click(); if (S.cq.pick === 'guess') (${tapChart})(2020, .2); return !!S.cq.guess; })()`);
    await hp.evaluate(() => window.__hold.set(99));
    await play('the guess for 2026 is not answered at the wall', () => !!window.__hold.S.done.guess);
    /* by day the page stays day, even at the wall */
    if (scheme === 'light' && !(await hp.evaluate(() => { const c = getComputedStyle(document.getElementById('hd-root')).backgroundColor.match(/\d+/g).map(Number); return c[0] > 200; }))) problems.push(tag + ': by day the first page turns dark at the wall');
    /* past the wall the camera pulls back: the square is one block of a chip, and a check finds four walls on it */
    await play('past the wall the camera does not pull back to the whole chip with its four walls', () => { const e = document.getElementById('home'), y = window.__hold.at('pull'); if (Math.abs(e.scrollTop - y) > 4) e.scrollTop = y; return window.__hold.state().chip && document.querySelectorAll('#hd-root .dblk.found').length === 4; });
    /* the four walls, each tried on its block; each with its question, a way into the lab, and what people are trying (the blueprint's words) */
    const wall = (id, what, fn) => hp.evaluate(id => window.__hold.go(id), id).then(() => play(what, fn, id));
    await wall('leak', 'the leak cannot be tried', () => { const r = window.__p('leak').querySelector('input[type=range]'); if (r && r.value !== '240') { r.value = '240'; r.dispatchEvent(new Event('input', { bubbles: true })); } return !!window.__hold.S.tried.switch; });
    await play('a wall stands without its question, its way into the lab and what people are trying', () => { const s = document.querySelector('#hd-root .sec[data-id="leak"]'); return s.querySelector('.w-q p').textContent.length > 20 && !!s.querySelector('a[href^="#/"]') && !!s.querySelector('.w-ways button[data-way]:not([hidden]) b').textContent; });
    await wall('distance', 'the distance cannot be tried', () => { const b = window.__p('distance').querySelectorAll('.seg button'); if (b[2] && !window.__hold.S.tried.memory) { b[1].click(); b[2].click(); } return !!window.__hold.S.tried.memory; });
    await wall('power', 'the power cannot be tried', () => { const b = window.__p('power').querySelector('.pbtn'); if (b && !window.__hold.S.tried.power) b.click(); return !!window.__hold.S.tried.power; });
    await wall('price', 'the price cannot be tried', () => { const b = window.__p('price').querySelectorAll('.seg button'); if (b[1] && !window.__hold.S.tried.cost) b[1].click(); return !!window.__hold.S.tried.cost; });
    if (!(await hp.evaluate(() => !!window.__hold.S.done.walls))) problems.push(tag + ': the four walls tried do not count as a challenge');
    /* the next fifty years: hold again, down to the floor */
    await wall('next', 'the next fifty years cannot be held down to the floor', () => { const b = window.__p('next').querySelector('.holdbtn'); if (b && !window.__hold.S.next.hold) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); return !!window.__hold.S.done.floor; });
    await release();
    /* how the machine grew, every era; the arrangements, where a number never travels; your machine, offered by an agent and kept by you */
    await wall('eras', 'the eras cannot all be seen', () => { window.__p('eras').querySelectorAll('.seg button').forEach(b => b.click()); return !!window.__hold.S.done.eras; });
    await wall('arr', 'the arrangements cannot be found', () => { window.__p('arr').querySelectorAll('.seg button').forEach(b => b.click()); return !!window.__hold.S.done.arr; });
    await wall('machine', 'your machine cannot be kept', () => { const p = window.__p('machine'), S = window.__hold.S, t = p.querySelector('.mtile:not([disabled])'), a = p.querySelector('.tri .pbtn.ghost'), k = p.querySelector('.tri .pbtn:not(.ghost)');
      if (!S.agent && a) a.click(); else if (k) k.click(); if (t && !S.kept && !S.agent) t.click(); return !!S.done.keep; });
    if (!(await hp.evaluate(() => document.querySelectorAll('.bar .hbar .tally [data-ch].on').length === 12))) problems.push(tag + ': the bar does not count the twelve challenges done');
    /* the small chip in the bar flies to a block (on a phone, to the whole chip); the chapters at the left lead to each chapter */
    if (!phone) {
      await play('the small chip in the bar does not fly to its block', () => { if (window.__hold.state().cur !== 'arr') document.querySelector('.bar .hbar .d-map button[data-id="arr"]').click(); return window.__hold.state().cur === 'arr'; });
      await play('the chapters at the left do not lead to a chapter', () => { if (window.__hold.state().cur !== 'next') document.querySelector('#hd-root .b-rail button[data-ch="next"]').click(); return window.__hold.state().cur === 'next'; });
    } else await play('the small chip in the bar does not open the whole chip', () => { document.querySelector('.bar .hbar .d-map button[data-id="arr"]').click(); return window.__hold.state().chip && document.querySelector('#hd-root .d-world').classList.contains('far'); });
    /* every number's source, on one sheet */
    await play('the sources do not open on one sheet', () => { const b = document.querySelector('#hd-root .b-end .bbtn'); if (!document.querySelector('#hd-root .sheet.on')) b.click(); return document.querySelectorAll('#hd-root .sheet.on .f').length > 10; });
    await hp.keyboard.press('Escape');
    const side = await hp.evaluate(() => { const p = document.getElementById('home'); return p.scrollWidth - p.clientWidth; });
    if (side > 1) problems.push(tag + ': the first page scrolls sideways by ' + side + ' px');
    /* the first page in another language, and back */
    await hp.goto(base + 'index.html?lang=zh#/');
    await play('the first page does not show in Chinese', () => document.documentElement.lang === 'zh' && /晶体管/.test((document.querySelector('#hd-root .b-hud .count') || {}).textContent || ''), null, 20000);
    await hp.click('#langbtn').then(() => hp.waitForFunction(() => !document.getElementById('langmenu').hidden && document.querySelectorAll('#langmenu [data-lang]').length === 4, null, { timeout: 5000 })).then(() => hp.click('#langmenu [data-lang="en"]')).catch(() => problems.push(tag + ': the language menu does not open on the first page'));
    await play('the first page does not come back to English', () => document.documentElement.lang === 'en' && /transistor/i.test((document.querySelector('#hd-root .b-hud .count') || {}).textContent || ''), null, 20000);
    /* the island is one tap away on the last block, and the brand comes back */
    await play('the first page does not open again after a language change', () => !!window.__hold && !!window.__p && !!window.__p('island'), null, 20000);
    await play('the first page offers no way to the island', () => { window.__hold.go('island'); const a = window.__p('island').querySelector('a[href="#/island"]'); if (a && location.hash !== '#/island') a.click(); return location.hash === '#/island'; }, null, 20000);
    await play('the island does not open from the first page', () => document.getElementById('home').hidden && !document.getElementById('mapCanvas').hidden && !document.querySelector('.bar .hbar'), null, 30000);
    await hp.click('.bar .brand').catch(() => problems.push(tag + ': no brand in the bar'));
    await play('the brand does not lead back to the first page', () => !document.getElementById('home').hidden && document.getElementById('mapCanvas').hidden && !!document.querySelector('.bar .hbar'));
    await hp.close();
  }
}
