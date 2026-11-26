/* Hold, the first page (#/, src/v2/hold.js): nothing 3D is drawn there. One story on one chip: one transistor, 0 until
   you press and 1 while you do; scrolling is time and holding scrolls for you through fifty years, with four moments
   played on the square and Moore's law live along the bottom with its three challenges; the wall, day staying day;
   then the camera pulls back to the whole chip, a check finds four walls, and it flies block to block (the walls, the
   next fifty years, how the machine grew, the arrangements, your machine, the island), each block a tap away on the
   small chip in the bar or the chapters at the left, with the twelve challenges counted in the bar; the sources; four
   languages; the island and the brand lead out and back */
import { S } from './shared.mjs';

export const about = 'Hold, the first page: what it fetches before its preload (no 3D, no engine but the shell\'s, its JavaScript under its budget); one story on one chip — 0 and 1, scrolling and holding through fifty years, four moments, Moore\'s law live with its challenges, the wall without turning dark by day, the pull back to the whole chip and its four walls, every block\'s challenge, the bar\'s small chip and tally, the sources, Chinese and back, the island and back';

export default async function run() {
  const { browser3d, base, problems } = S;
  await fetched();
  await barFits();
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'home ' + w, phone = w < 500, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: phone });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if ((m.type() === 'error' || /Missing text/.test(m.text())) && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ }
      /* a block's picture, with its controls */
      window.__p = id => document.querySelector('#hd-root .dblk .plate[data-id="' + id + '"]');
      /* what on the page is wider than the window, or cut off by its box (the chip under the camera is a picture that
         pans: only the block the camera is on counts) */
      window.__over = () => { const W = innerWidth, bad = [];
        const seen = e => { for (let p = e; p && p.id !== 'hd-root'; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
        for (const e of document.querySelectorAll('#hd-root *')) {
          if (e.closest('.d-world') && !e.closest('.dblk.cur')) continue;
          if (e.closest('.sheet:not(.on),.srcpop:not(.on),.toast:not(.on)')) continue;
          const r = e.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || !seen(e)) continue;
          if (r.right > W + 1 || r.left < -1) bad.push('"' + (e.textContent || e.className).trim().slice(0, 30) + '" runs off the window');
          else if (!e.children.length && /hidden|clip/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth + 1) bad.push('"' + e.textContent.trim().slice(0, 30) + '" is cut off');
        }
        return bad.slice(0, 4); }; });
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
    /* the hold button never lies over a card or the narration: at the gate and the job, and at two counts in between */
    for (const [k, a] of [['ch', 'gate'], ['ch', 'job'], ['set', 6], ['set', 16]]) {
      const under = await hp.waitForFunction(([k, a]) => { window.__hold[k](a);
        const seen = e => { for (let p = e; p && p.id !== 'hd-root'; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
        const b = document.querySelector('#hd-root .b-hold .holdbtn'); if (!seen(b)) return 'ok';
        const r = b.getBoundingClientRect(), hit = [...document.querySelectorAll('#hd-root .card, #hd-root .d-ycard')].filter(c => { const q = c.getBoundingClientRect(); return seen(c) && q.width && q.left < r.right + 4 && r.left - 4 < q.right && q.top < r.bottom + 4 && r.top - 4 < q.bottom; });
        return hit.length ? null : 'ok'; }, [k, a], { timeout: 6000 }).then(() => null, () => hp.evaluate(() => [...document.querySelectorAll('#hd-root .card, #hd-root .d-ycard')].map(c => c.textContent.trim().slice(0, 30)).join(' | ')));
      if (under) problems.push(tag + ': at ' + a + ' the hold button lies over a card');
    }
    /* the glass follows the pointer (or the finger that holds) and names the part of the chip it is over; the chart names the year under the pointer */
    await hp.evaluate(() => window.__hold.set(20));
    await play('the glass does not follow the pointer over the square', () => { const p = window.__p('years'), r = p.getBoundingClientRect(), g = p.querySelector('.layer.on .lb.c');
      p.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: r.left + r.width * .25, clientY: r.top + r.height * .75 }));
      return !!g && parseFloat(g.style.left) < 40 && +getComputedStyle(g).opacity > .5 && !!g.querySelector('b').textContent; });
    if (!phone) await play('the chart does not name the year under the pointer', () => { const c = document.querySelector('#hd-root .b-band .chart'), r = c.getBoundingClientRect(), v = c.querySelector('.lab .hv');
      c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: r.left + r.width * .5, clientY: r.top + r.height * .5 }));
      return !!v && v.style.display !== 'none' && /\d{4}/.test(v.textContent); });
    /* Moore's law, live: the pace that fits the chips, the year the clock stopped, and a guess for 2026 */
    const tapChart = (year, f) => { const c = document.querySelector('#hd-root .b-band .chart'), r = c.getBoundingClientRect(), u = parseFloat(getComputedStyle(document.getElementById('hd-root')).getPropertyValue('--u')) || 1;
      const x = window.__hold.chartX ? window.__hold.chartX(year) : r.left + 34 * u + (year - 1957) / 73 * (r.width - 46 * u), y = r.top + r.height * f; for (const t of ['pointerdown', 'pointerup']) c.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 1 })); };
    /* the pace's slider can be dragged with the mouse, past two years, without the question being rebuilt under it */
    await hp.evaluate(() => window.__hold.ch('fit'));
    let dragged = false;
    for (let i = 0; i < 3 && !dragged; i++) {
      const r = await hp.waitForFunction(() => { const e = document.querySelector('#hd-root .cq input[data-a=every]'), b = e && e.getBoundingClientRect(); return b && b.width > 40 && b.top > 0 && b.bottom < innerHeight ? { x: b.left, y: b.top + b.height / 2, w: b.width } : null; }, null, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => null);
      if (!r) break;
      await hp.mouse.move(r.x + 4, r.y); await hp.mouse.down();
      for (let k = 1; k <= 20; k++) await hp.mouse.move(r.x + 4 + (r.w - 6) * k / 20, r.y);
      await hp.mouse.up();
      dragged = await hp.waitForFunction(() => window.__hold.S.cq.every > 2, null, { timeout: 3000 }).then(() => true, () => false);
    }
    if (!dragged) problems.push(tag + ': the pace\'s slider cannot be dragged past two years with the mouse');
    /* the question under the chart is whole: none of it is cut off by the band (on a desktop) */
    if (!phone && !(await hp.evaluate(() => { const q = document.querySelector('#hd-root .b-band .cq'); return q && q.scrollHeight <= q.clientHeight + 1; }))) problems.push(tag + ': the question under the chart is cut off by the band');
    await at('fit', 'the pace that fits the chips cannot be found', () => { const r = document.querySelector('#hd-root .cq input[data-a=every]'); if (r && r.value !== '2') { r.value = '2'; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); } return !!window.__hold.S.done.fit; });
    await at('knee', 'the year the clock stopped cannot be tapped', `(() => { const b = document.querySelector('#hd-root .cq [data-a=hz]'); if (b) b.click(); if (window.__hold.S.cq.pick === 'knee') (${tapChart})(2004.5, .5); return !!window.__hold.S.done.knee; })()`);
    await at('guess', 'a guess for 2026 cannot be made', `(() => { const S = window.__hold.S, b = document.querySelector('#hd-root .cq [data-a=guess]'); if (!S.cq.guess && S.cq.pick !== 'guess' && b) b.click(); if (S.cq.pick === 'guess') (${tapChart})(2020, .2); return !!S.cq.guess; })()`);
    /* a resize, or a phone turned on its side and back, keeps the year */
    const [tw, th] = phone ? [844, 390] : [1000, 700];
    await hp.evaluate(() => window.__hold.set(17.3));
    for (const [vw, vh2] of [[tw, th], [w, h]]) {
      await hp.setViewportSize({ width: vw, height: vh2 });
      await play('at ' + vw + '×' + vh2 + ' the fifty years lose the year', () => Math.abs(window.__hold.state().d - 17.3) < .05);
    }
    await hp.evaluate(() => window.__hold.set(99));
    await play('the guess for 2026 is not answered at the wall', () => !!window.__hold.S.done.guess);
    /* by day the page stays day, even at the wall */
    if (scheme === 'light' && !(await hp.evaluate(() => { const c = getComputedStyle(document.getElementById('hd-root')).backgroundColor.match(/\d+/g).map(Number); return c[0] > 200; }))) problems.push(tag + ': by day the first page turns dark at the wall');
    /* past the wall the camera pulls back: the square is one block of a chip, and a check finds four walls on it */
    await play('past the wall the camera does not pull back to the whole chip with its four walls', () => { const e = document.getElementById('home'), y = window.__hold.at('pull'); if (Math.abs(e.scrollTop - y) > 4) e.scrollTop = y; return window.__hold.state().chip && document.querySelectorAll('#hd-root .dblk.found').length === 4; });
    /* the four walls, each tried on its block; each with its question, a way into the lab, and what people are trying (the blueprint's words) */
    const wall = (id, what, fn, timeout) => hp.evaluate(id => window.__hold.go(id), id).then(() => play(what, fn, id, timeout));
    await wall('leak', 'the leak cannot be tried', () => { const r = window.__p('leak').querySelector('input[type=range]'); if (r && r.value !== '240') { r.value = '240'; r.dispatchEvent(new Event('input', { bubbles: true })); } return !!window.__hold.S.tried.switch; });
    await play('a wall stands without its question, its way into the lab and what people are trying', () => { const s = document.querySelector('#hd-root .sec[data-id="leak"]'); return s.querySelector('.w-q p').textContent.length > 20 && !!s.querySelector('a[href^="#/"]') && !!s.querySelector('.w-ways button[data-way]:not([hidden]) b').textContent; });
    await wall('distance', 'the distance cannot be tried', () => { const b = window.__p('distance').querySelectorAll('.seg button'); if (b[2] && !window.__hold.S.tried.memory) { b[1].click(); b[2].click(); } return !!window.__hold.S.tried.memory; });
    await wall('power', 'the power cannot be tried', () => { const b = window.__p('power').querySelector('.pbtn'); if (b && !window.__hold.S.tried.power) b.click(); return !!window.__hold.S.tried.power; });
    await wall('price', 'the price cannot be tried', () => { const b = window.__p('price').querySelectorAll('.seg button'); if (b[1] && !window.__hold.S.tried.cost) b[1].click(); return !!window.__hold.S.tried.cost; });
    if (!(await hp.evaluate(() => !!window.__hold.S.done.walls))) problems.push(tag + ': the four walls tried do not count as a challenge');
    /* the next fifty years: hold again, down to the floor (it takes its time: about twelve seconds of frames, more on a slow machine) */
    await wall('next', 'the next fifty years cannot be held down to the floor', () => { const b = window.__p('next').querySelector('.holdbtn'); if (b && !window.__hold.S.next.hold) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); return !!window.__hold.S.done.floor; }, 90000);
    await release();
    /* how the machine grew, every era; the arrangements, where a number never travels; your machine, offered by an agent and kept by you */
    await wall('eras', 'the eras cannot all be seen', () => { window.__p('eras').querySelectorAll('.seg button').forEach(b => b.click()); return !!window.__hold.S.done.eras; });
    await wall('arr', 'the arrangements cannot be found', () => { window.__p('arr').querySelectorAll('.seg button').forEach(b => b.click()); return !!window.__hold.S.done.arr; });
    await wall('machine', 'your machine cannot be kept', () => { const p = window.__p('machine'), S = window.__hold.S, t = p.querySelector('.mtile:not([disabled])'), a = p.querySelector('.tri .pbtn.ghost'), k = p.querySelector('.tri .pbtn:not(.ghost)');
      if (!S.agent && a) a.click(); else if (k) k.click(); if (t && !S.kept && !S.agent) t.click(); return !!S.done.keep; });
    if (!(await hp.evaluate(() => document.querySelectorAll('.bar .hbar .tally [data-ch].on').length === 12))) problems.push(tag + ': the bar does not count the twelve challenges done');
    /* past the wall too, a resize or a turn keeps the block you are at */
    for (const [vw, vh2] of [[tw, th], [w, h]]) {
      await hp.setViewportSize({ width: vw, height: vh2 });
      await play('at ' + vw + '×' + vh2 + ' the page loses the block it was at', () => window.__hold.state().cur === 'machine');
    }
    /* nothing runs off the window or is cut off, at every moment and on every block */
    const sweep = async lang => { for (const [k, a] of [['set', 0], ['ch', 'gate'], ['ch', 'job'], ['ch', 'bug'], ['ch', 'light'], ['ch', 'fit'], ['set', 99], ...['leak', 'distance', 'power', 'price', 'next', 'levels', 'eras', 'arr', 'machine', 'island'].map(id => ['go', id])]) {
      const ok = await hp.waitForFunction(([k, a]) => { window.__hold[k](a); return window.__over().length === 0; }, [k, a], { timeout: 6000 }).then(() => true, () => false);
      if (!ok) problems.push(tag + ' ' + lang + ': at ' + a + ', ' + (await hp.evaluate(() => window.__over().join('; ')))); } };
    await sweep('en');
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
    if (phone) for (const l of ['zh', 'fr', 'es']) {
      await hp.goto(base + 'index.html?lang=' + l + '#/');
      await play('the first page does not open in ' + l, l => document.documentElement.lang === l && !!window.__hold && !!window.__p && !!window.__p('island'), l, 20000);
      await sweep(l);
    }
    await hp.close();
  }
  await fitted();
  await apart();
  await kept();
}

/* the address says where the camera is, and what you did is kept (#418, #419): a block and a year are written into the
   address in place, as the camera settles, and a reload, day or night, or a new language lands there again; a challenge
   done is still counted after a reload, and the Map shows it with the lab's; #/ alone opens at the start. Readable
   without seeing it, playable without a mouse (#420): one heading, every picture named, one polite voice, and from the
   top of the page "skip to the story" first, then the story */
async function kept() {
  const { browser3d, base, problems } = S, tag = 'home kept';
  const kp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  kp.on('pageerror', e => problems.push(tag + ': ' + e.message));
  await kp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
  const play = (what, fn, arg, timeout = 15000) => kp.waitForFunction(fn, arg, { timeout }).then(() => true, () => { problems.push(tag + ': ' + what); return false; });
  const open = () => kp.waitForFunction(() => !!window.__hold && document.querySelectorAll('.bar .hbar .tally [data-ch]').length === 12, null, { timeout: 20000 });
  await kp.goto(base + 'index.html#/'); await open();
  /* from the top of the page: "skip to the story" is the first stop, and the stop after it is inside the story */
  await kp.keyboard.press('Tab');
  if (!(await kp.evaluate(() => document.activeElement && document.activeElement.classList.contains('hskip')))) problems.push(tag + ': the first Tab stop is not "skip to the story"');
  await kp.keyboard.press('Enter'); await kp.keyboard.press('Tab');
  if (!(await kp.evaluate(() => !!document.activeElement.closest('#hd-root') && document.getElementById('home').scrollTop < 5))) problems.push(tag + ': the third Tab stop is not inside the story, or skipping moved the camera');
  /* the small chip and the tally are one stop each, the arrows inside */
  if (await kp.evaluate(() => ['.d-map', '.tally .sq'].some(s => [...document.querySelectorAll('.bar .hbar ' + s + ' button')].filter(b => b.tabIndex >= 0).length !== 1))) problems.push(tag + ': the small chip or the tally is more than one stop of the keyboard');
  /* one heading, every picture named, one polite voice that speaks while you hold */
  if (await kp.evaluate(() => [...document.querySelectorAll('h1')].filter(e => !e.closest('[hidden]')).length) !== 1) problems.push(tag + ': the first page has not one main heading');
  if (await kp.evaluate(() => [...document.querySelectorAll('#hd-root .dblk .plate canvas')].some(c => c.getAttribute('role') !== 'img' || !(c.getAttribute('aria-label') || '').trim()))) problems.push(tag + ': a picture has no text alternative');
  if (await kp.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#hd-root .src'), '::after').width)) < 23.5) problems.push(tag + ': a source mark is under 24 px to the touch');
  await play('the voice does not say the count while you hold', () => { const b = document.querySelector('#hd-root .b-hold .holdbtn'); if (!window.__hold.state().holding) b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    const v = document.querySelectorAll('#hd-root [aria-live="polite"]'); return v.length === 1 && /\d/.test(v[0].textContent); });
  await kp.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
  await play('the voice does not say the wall as it comes', () => { if (window.__hold.state().d < 38) window.__hold.set(99); const v = document.querySelector('#hd-root [aria-live="polite"]'), h = document.querySelector('#hd-root .card.wall .w-h').textContent.trim(); return !!v && !!h && v.textContent.startsWith(h.slice(0, 8)); });
  /* the sheet counts the sources it lists */
  await play('the sources\' sheet does not count what it lists', () => { const b = document.querySelector('#hd-root .b-end .bbtn'); if (!document.querySelector('#hd-root .sheet.on')) b.click(); const s = document.querySelector('#hd-root .sheet.on'), n = s && s.querySelectorAll('.f').length;
    return n > 10 && new RegExp('\\b' + n + '\\b').test(s.querySelector('header .dim').textContent); });
  await kp.keyboard.press('Escape');
  /* a block, then a year, written into the address in place */
  const h0 = await kp.evaluate(() => history.length);
  await play('settling on a block does not write its address', () => { if (window.__hold.state().cur !== 'price') window.__hold.go('price'); return location.hash === '#/hold/price'; });
  await play('settling in the fifty years does not write the year', () => { if (Math.abs(window.__hold.state().d - 22.17) > .05) window.__hold.set(22.17); return location.hash === '#/hold/years/1993'; });
  if (await kp.evaluate(() => history.length) !== h0) problems.push(tag + ': the address adds to the history as the camera moves');
  /* a reload lands on the same year, and on the same block */
  await kp.reload(); await open();
  await play('a reload does not land on the same year', () => location.hash === '#/hold/years/1993' && Math.round(window.__hold.S.d) === 22 && !window.__hold.state().chip);
  await play('settling on the eras does not write its address', () => { if (window.__hold.state().cur !== 'eras') window.__hold.go('eras'); return location.hash === '#/hold/eras'; });
  /* a challenge done there is kept */
  await play('the eras cannot all be seen', () => { window.__p = id => document.querySelector('#hd-root .dblk .plate[data-id="' + id + '"]'); window.__p('eras').querySelectorAll('.seg button').forEach(b => b.click()); return !!window.__hold.S.done.eras; });
  await kp.waitForFunction(() => { try { return !!JSON.parse(localStorage.getItem('osl-hold')).done.eras; } catch (e) { return false; } }, null, { timeout: 5000 }).catch(() => problems.push(tag + ': a challenge done is not kept in this browser'));
  /* day or night (it reloads the page) keeps the block and the challenge */
  await Promise.all([kp.waitForEvent('load'), kp.click('#theme')]); await open();
  const where = () => kp.evaluate(() => JSON.stringify([location.hash, window.__hold.state().cur, document.getElementById('home').scrollTop, Object.keys(window.__hold.S.done)]));
  if (!(await play('day or night does not keep the block, or the challenge done', () => location.hash === '#/hold/eras' && window.__hold.state().cur === 'eras' && !!window.__hold.S.done.eras && !!document.querySelector('.bar .hbar .tally [data-ch="eras"].on')))) problems.push(tag + ': it was at ' + (await where()));
  /* a new language keeps the block */
  await kp.goto(base + 'index.html?lang=fr#/hold/machine'); await open();
  if (!(await play('a new language, or opening a block\'s address, does not land on the block', () => document.documentElement.lang === 'fr' && window.__hold.state().cur === 'machine' && location.hash === '#/hold/machine', null, 20000))) problems.push(tag + ': it was at ' + (await where()));
  /* the Map shows the first page's twelve challenges, the one done, counted with the lab's; its log lists them */
  await kp.evaluate(() => { location.hash = '#/log'; });
  await play('the Map does not show the first page\'s challenges, with the one done', () => document.querySelectorAll('#page:not([hidden]) .wm-first .wm-dots a').length === 12 && document.querySelectorAll('#page .wm-first .wm-dots a.on[href="#/hold/eras"]').length === 1 &&
    document.querySelectorAll('#page [data-first] .dochip').length === 12 && document.querySelectorAll('#page [data-first] .dochip.done').length === 1, null, 60000);
  /* #/ alone opens at the start */
  await kp.goto(base + 'index.html?lang=en#/'); await open();
  await play('#/ does not open at the start', () => window.__hold.state().d < .1 && !window.__hold.state().chip && document.getElementById('home').scrollTop < 5 && location.hash === '#/');
  await kp.close();
}

/* the page's part of the bar fits between the phone and the desktop: at every width from 761 px, in each language,
   no two of the bar's buttons overlap and none breaks onto two lines (the chapter's name, the tally's words and the
   sources give way first, src/v2/hold.js fitBar) */
async function barFits() {
  const { browser3d, base, problems } = S, tag = 'home: the bar';
  const bp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  bp.on('pageerror', e => problems.push(tag + ': ' + e.message));
  for (const l of ['en', 'zh', 'fr', 'es']) {
    await bp.goto(base + 'index.html?lang=' + l + '#/');
    if (!(await bp.waitForFunction(() => !!window.__hold && document.querySelectorAll('.bar .hbar .tally [data-ch]').length === 12, null, { timeout: 20000 }).then(() => true, () => false))) { problems.push(tag + ': the first page does not open in ' + l); continue; }
    for (const bw of [761, 800, 900, 1024, 1180, 1280]) {
      await bp.setViewportSize({ width: bw, height: 800 });
      const bad = await bp.waitForFunction(bw => { if (innerWidth !== bw) return null;
        const els = [...document.querySelectorAll('.bar .brand, .bar .hbar .d-map, .bar .hbar .b-chap, .bar .hbar .tally .tl-n, .bar .hbar .tally .sq, .bar .hbar > .bbtn, #breakbtn, #logbtn, #langbtn, #theme')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0);
        const R = els.map(e => [e.id || e.className, e.getBoundingClientRect()]), out = [];
        for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) { const a = R[i][1], c = R[j][1]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) out.push(R[i][0] + ' over ' + R[j][0]); }
        for (const [n, e] of R) if (e.right > innerWidth) out.push(n + ' off the window');
        const two = e => { const rg = document.createRange(); rg.selectNodeContents(e); const t = [...rg.getClientRects()].filter(r => r.width).map(r => r.top); return t.length > 1 && Math.max(...t) - Math.min(...t) > parseFloat(getComputedStyle(e).fontSize) * .8; };
        for (const e of document.querySelectorAll('.bar .hbar .b-chap, .bar .hbar .tally .tl-n, #logbtn, .bar .hbar > .bbtn')) if (getComputedStyle(e).display !== 'none' && two(e)) out.push((e.id || e.className) + ' breaks onto two lines');
        return out.length ? null : 'ok'; }, bw, { timeout: 5000 }).then(() => null, () => bp.evaluate(() => [...document.querySelectorAll('.bar .hbar > *, #breakbtn, #logbtn, #langbtn, #theme')].map(e => (e.id || e.className) + ':' + Math.round(e.getBoundingClientRect().left) + '-' + Math.round(e.getBoundingClientRect().right)).join(' ')));
      if (bad) problems.push(tag + ' at ' + bw + ' px in ' + l + ': its buttons overlap or wrap (' + bad + ')');
    }
  }
  await bp.close();
}

/* a tablet held upright and a phone on its side: the phone's layout, sized from the window (the picture above, or at
   the left), every word at least 11 px, no card over the square or the hold button, the whole chip in the window,
   a moment and a wall played, and a turn keeps the place */
async function fitted() {
  const { browser3d, base, problems } = S;
  for (const [fw, fh, scheme] of [[768, 1024, 'light'], [844, 390, 'dark']]) {
    const tag = 'home ' + fw + '×' + fh, fp = await browser3d.newPage({ viewport: { width: fw, height: fh }, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: true });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ }
      /* what is wrong where the visitor looks: a word under 11 px, a card over the square or the hold button, anything off the window */
      window.__fit = () => { const bad = [], W = innerWidth, H = innerHeight;
        const seen = e => { for (let p = e; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
        for (const e of document.querySelectorAll('#hd-root *, .bar *')) {
          if ((e.closest('.d-world') && !e.closest('.dblk.cur')) || e.closest('.sheet:not(.on),.srcpop:not(.on),.toast:not(.on),.src')) continue;
          if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
          const r = e.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W || !seen(e)) continue;
          if (parseFloat(getComputedStyle(e).fontSize) < 10.95) bad.push('"' + e.textContent.trim().slice(0, 24) + '" is under 11 px');
          if (e.closest('#hd-root') && (r.right > W + 1 || r.left < -1)) bad.push('"' + e.textContent.trim().slice(0, 24) + '" runs off the window');
        }
        const chip = window.__hold.state().chip, sq = document.querySelector(chip ? '#hd-root .dblk.live .plate' : '#hd-root .dblk .plate[data-id="years"]'), hb = document.querySelector('#hd-root .b-hold .holdbtn');
        for (const c of document.querySelectorAll('#hd-root .card, #hd-root .d-ycard')) { if (!seen(c)) continue; const q = c.getBoundingClientRect(); if (!q.width || q.bottom < 0 || q.top > H) continue;
          for (const [o, what] of [[sq, 'the square'], [hb, 'the hold button']]) { if (!o || !seen(o)) continue; const r = o.getBoundingClientRect();
            if (!(q.left < r.right - 1 && r.left < q.right - 1 && q.top < r.bottom - 1 && r.top < q.bottom - 1)) continue;
            const t = document.elementFromPoint((Math.max(q.left, r.left) + Math.min(q.right, r.right)) / 2, (Math.max(q.top, r.top) + Math.min(q.bottom, r.bottom)) / 2);
            if (t && c.contains(t)) bad.push('a card ("' + c.textContent.trim().slice(0, 24) + '") lies over ' + what); } }
        return bad.slice(0, 4); }; });
    const play = (what, fn, arg, timeout = 15000) => fp.waitForFunction(fn, arg, { timeout }).catch(() => problems.push(tag + ': ' + what));
    await fp.goto(base + 'index.html');
    await play('the first page does not open', () => !!window.__hold && document.querySelectorAll('#hd-root .dblk .plate').length === 11, null, 20000);
    /* the phone's layout: the picture pinned above the story (upright) or at its left (on its side), and a big square */
    await play('the picture is not pinned ' + (fw > fh ? 'at the left of' : 'above') + ' the story, or its square is small', fw => { const s = document.querySelector('#hd-root .b-stage').getBoundingClientRect(), p = document.querySelector('#hd-root .dblk .plate[data-id="years"]').getBoundingClientRect(), c = document.querySelector('#hd-root .d-ycard').getBoundingClientRect();
      return innerWidth > innerHeight ? s.right < innerWidth * .5 && c.left >= p.right && p.height > (innerHeight - 62) * .85 : s.bottom <= c.top && p.width > innerWidth * .6; }, fw);
    /* what the visitor sees, at counts, moments, the wall and blocks after it */
    for (const [k, a] of [['set', 0], ['set', 6], ['ch', 'gate'], ['ch', 'job'], ['ch', 'fit'], ['set', 16], ['set', 99], ['go', 'leak'], ['go', 'distance'], ['go', 'machine']]) {
      const ok = await fp.waitForFunction(([k, a]) => { window.__hold[k](a); return window.__fit().length === 0; }, [k, a], { timeout: 8000 }).then(() => true, () => false);
      if (!ok) problems.push(tag + ': at ' + a + ', ' + (await fp.evaluate(() => window.__fit().join('; '))));
    }
    /* a moment and a wall, played */
    await fp.evaluate(() => window.__hold.ch('gate'));
    await play('the gate cannot be played', () => { const S = window.__hold.S, t = document.querySelectorAll('#hd-root .dblk .plate[data-id="years"] .layer.on .tap'); if (t.length === 2) { if (!S.gate.a) t[0].click(); if (!S.gate.b) t[1].click(); } return !!S.done.gate; });
    await fp.evaluate(() => window.__hold.go('leak'));
    await play('the leak cannot be tried', () => { const r = document.querySelector('#hd-root .dblk .plate[data-id="leak"] input[type=range]'); if (r && r.value !== '240') { r.value = '240'; r.dispatchEvent(new Event('input', { bubbles: true })); } return !!window.__hold.S.tried.switch; });
    /* the whole chip fits the window */
    await play('the whole chip does not fit the window', () => { const e = document.getElementById('home'), y = window.__hold.at('pull'); if (Math.abs(e.scrollTop - y) > 4) e.scrollTop = y;
      const bs = [...document.querySelectorAll('#hd-root .dblk')].map(b => b.getBoundingClientRect()); return window.__hold.state().chip && Math.min(...bs.map(r => r.left)) >= 0 && Math.min(...bs.map(r => r.top)) >= 0 && Math.max(...bs.map(r => r.right)) <= innerWidth && Math.max(...bs.map(r => r.bottom)) <= innerHeight; });
    /* a turn, and back, keeps the place: in the fifty years and on a block */
    for (const [k, a, ok] of [['set', 17.3, 'Math.abs(window.__hold.state().d - 17.3) < .05'], ['go', 'machine', "window.__hold.state().cur === 'machine'"]]) {
      await fp.evaluate(([k, a]) => window.__hold[k](a), [k, a]);
      for (const [vw, vh] of [[fh, fw], [fw, fh]]) { await fp.setViewportSize({ width: vw, height: vh });
        /* where it was instead, said with the problem */
        await fp.waitForFunction(ok, null, { timeout: 15000 }).catch(async () => problems.push(tag + ': turned to ' + vw + '×' + vh + ' at ' + a + ', the page loses its place (' + (await fp.evaluate(() => JSON.stringify([location.hash, window.__hold.state().cur, +window.__hold.state().d.toFixed(2), document.getElementById('home').scrollTop]))) + ')')); }
    }
    const side = await fp.evaluate(() => { const p = document.getElementById('home'); return p.scrollWidth - p.clientWidth; });
    if (side > 1) problems.push(tag + ': the first page scrolls sideways by ' + side + ' px');
    await fp.close();
  }
}

/* nothing on a block lies on another word (#416, #417): no card's number, on the block or on its card, lies on a word
   of the block; no two of its words overlap, nor a card over them; on a phone every word on it is at least 11 px; and
   around the block the camera is on the rest of the chip shows as drawings, none of its words in the window (the other
   blocks', the pads', the chip's title). On every block and at every moment, in four languages on a desktop and a
   phone, and in English on a wide screen */
async function apart() {
  const { browser3d, base, problems } = S;
  const stops = [['set', 0], ['ch', 'gate'], ['ch', 'job'], ['ch', 'bug'], ['ch', 'light'], ['set', 99], ...['leak', 'distance', 'power', 'price', 'next', 'levels', 'eras', 'arr', 'machine', 'island'].map(id => ['go', id])];
  for (const [w, h, scheme, langs] of [[1280, 800, 'dark', ['en', 'zh', 'fr', 'es']], [390, 844, 'light', ['en', 'zh', 'fr', 'es']], [1920, 1080, 'dark', ['en']]]) {
    const hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce', hasTouch: w < 500 });
    hp.on('pageerror', e => problems.push('home apart ' + w + ': ' + e.message));
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ }
      /* how visible an element is (its own opacity times its parents'), and the words under a root, each line as a box
         as tall as its type (a tight line height does not make two lines touch) */
      const eff = e => { let o = 1; for (let p = e; p && p.id !== 'hd-root'; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden') return 0; o *= +s.opacity; } return o; };
      const texts = (root, min) => { const out = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
        while ((n = tw.nextNode())) { if (!n.textContent.trim() || eff(n.parentElement) < min) continue; const fs = parseFloat(getComputedStyle(n.parentElement).fontSize), r = document.createRange(); r.selectNodeContents(n);
          for (const q of r.getClientRects()) if (q.width > 1 && q.height > 1) { const hh = Math.min(q.height, fs), m = (q.top + q.bottom) / 2; out.push({ el: n.parentElement, r: { left: q.left, right: q.right, top: m - hh / 2, bottom: m + hh / 2 } }); } }
        return out; };
      /* one label: what sits directly on the plate, in a layer, a row of buttons or a cell */
      const grp = el => { let e = el; while (e.parentElement && !e.parentElement.matches('.pl-ui, .pl-ui .layer, .seg, .tri > div, .pl-fr, .plate')) e = e.parentElement; return e; };
      const hit = (a, b) => a.left < b.right - .5 && b.left < a.right - .5 && a.top < b.bottom - .5 && b.top < a.bottom - .5;
      const say = e => '"' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '"';
      window.__apart = () => { const live = document.querySelector('#hd-root .dblk.live'), bad = []; if (!live) return ['no block under the camera'];
        const pl = live.querySelector('.plate'), T = texts(pl, .05).map(t => ({ ...t, g: grp(t.el) }));
        for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) { const a = T[i].g, b = T[j].g; if (a !== b && !a.contains(b) && !b.contains(a) && hit(T[i].r, T[j].r)) bad.push(say(a) + ' touches ' + say(b)); }
        /* the numbers: on the block (settled where they go), and on the cards (where nothing covers them) */
        const mks = [...document.querySelectorAll('#hd-root .b-mk.on')].filter(m => eff(m) > .5);
        for (const m of mks) { const r = m.getBoundingClientRect(), cs = getComputedStyle(m), P = m.parentElement.getBoundingClientRect();
          if (r.width < m.offsetWidth * .95 || Math.abs(parseFloat(cs.left) - parseFloat(m.style.left) / 100 * P.width) > 1 || Math.abs(parseFloat(cs.top) - parseFloat(m.style.top) / 100 * P.height) > 1) return ['a number is still on its way']; }
        const ns = [...document.querySelectorAll('#hd-root .card .n')].filter(m => { if (eff(m) < .5) return false; const r = m.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && m.contains(e); });
        for (const m of mks) { const r = m.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (e && e.closest('.card')) bad.push('the number ' + m.textContent + ' on the block is under a card'); }
        for (const m of mks.concat(ns)) { const r = m.getBoundingClientRect(), t = T.find(t => hit(r, t.r)); if (t) bad.push('the number ' + m.textContent + (m.classList.contains('n') ? ' on its card' : '') + ' lies on ' + say(t.g)); }
        /* a card (or the bar, the band, the hold button) over a word of the block */
        for (const t of T) { const y = (t.r.top + t.r.bottom) / 2; for (const x of [t.r.left + 2, (t.r.left + t.r.right) / 2, t.r.right - 2]) { if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) continue;
          const e = document.elementFromPoint(x, y); if (e && !pl.contains(e) && e.closest('.card, .b-hold, .b-band, .bar, .b-rail, .d-ycard, .d-cover')) { bad.push(say(t.g) + ' is under ' + (e.closest('.card') ? 'a card' : 'the ' + e.className)); break; } } }
        if (innerWidth < 500) for (const t of T) { const fs = parseFloat(getComputedStyle(t.el).fontSize) * (pl.getBoundingClientRect().width / pl.clientWidth); if (fs < 10.95) bad.push(say(t.el) + ' is ' + fs.toFixed(1) + ' px'); }
        /* the rest of the chip: drawings only */
        for (const t of texts(document.querySelector('#hd-root .d-world'), .02)) { const r = t.r; if (live.contains(t.el) || r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) continue;
          const o = t.el.closest('.dblk'); bad.push(say(t.el) + (o ? ' of another block' : t.el.closest('.d-pad') ? ' of a pad' : ' of the chip') + ' shows beside the block'); }
        return [...new Set(bad)].slice(0, 5); }; });
    for (const l of langs) {
      const tag = 'home ' + w + ' ' + l;
      await hp.goto(base + 'index.html?lang=' + l + '#/');
      const up = await hp.waitForFunction(l => document.documentElement.lang === l && !!window.__hold && document.querySelectorAll('#hd-root .dblk .plate').length === 11, l, { timeout: 20000 }).then(() => true, () => false);
      if (!up) { problems.push(tag + ': the first page does not open'); continue; }
      for (const [k, a] of stops) {
        const ok = await hp.waitForFunction(([k, a]) => { window.__hold[k](a); return window.__apart().length === 0; }, [k, a], { timeout: 8000 }).then(() => true, () => false);
        if (!ok) problems.push(tag + ': at ' + a + ', ' + (await hp.evaluate(() => window.__apart().join('; '))));
      }
    }
    await hp.close();
  }
}

/* what the first page fetches before its idle preload starts (data-preload, the moment it started; docs/ARCHITECTURE.md,
   "What loads when"): nothing of three.js or the 3D views, no engine but the shell's own (way.js: the game, the
   ledger and the engines it replays through load beyond the first page, src/v2/beyond.js), only the core words and
   its own, and its JavaScript under its budget, everything under the total. It was 3.4 MB with the island's 3D and
   every word, then 1.2 MB with nearly 1 MB of JavaScript, every engine the ledger replays through among it (#377) */
const FIRST_PAGE_BYTES = 1.5e6, FIRST_PAGE_JS = 400 * 1024;
async function fetched() {
  const { browser3d, base, problems } = S, tag = 'home: what the first page fetches';
  const fp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
  await fp.goto(base + 'index.html#/');
  await fp.waitForFunction(() => !!document.documentElement.dataset.preload, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page never starts its idle preload'));
  await fp.waitForLoadState('networkidle').catch(() => { /* measured as it stands */ });
  const early = await fp.evaluate(origin => { const pre = +document.documentElement.dataset.preload || Infinity;
    return performance.getEntriesByType('resource').filter(e => e.startTime < pre && e.name.startsWith(origin)).map(e => ({ u: e.name.split('?')[0], b: e.decodedBodySize })); }, new URL(base).origin);
  const name = e => e.u.split('/').pop(), kb = b => Math.round(b / 1024) + ' KB';
  const heavy = early.filter(e => /\/(three\.min|three-extras|kit3d|map3d|dc3d|chip3d|level3d)\.js$/.test(e.u)).map(name);
  if (heavy.length) problems.push(tag + ': it fetches 3D before its preload: ' + heavy.join(', '));
  const engines = early.filter(e => /\/src\/engines\//.test(e.u) && !/\/way\.js$/.test(e.u)).map(name);
  if (engines.length) problems.push(tag + ': it fetches engines before its preload: ' + engines.join(', '));
  if (early.some(e => /\/community\/ledger\.json$/.test(e.u))) problems.push(tag + ': it fetches the ledger before its preload');
  const bytes = early.reduce((a, e) => a + e.b, 0), js = early.filter(e => /\.m?js$/.test(e.u)).reduce((a, e) => a + e.b, 0);
  if (!(js < FIRST_PAGE_JS)) problems.push(tag + ': ' + kb(js) + ' of JavaScript before its preload (budget ' + kb(FIRST_PAGE_JS) + ')');
  if (!(bytes < FIRST_PAGE_BYTES)) problems.push(tag + ': ' + kb(bytes) + ' before its preload (budget ' + kb(FIRST_PAGE_BYTES) + ')');
  /* of the words, only the core area's and the first page's own; of the styles, only what every screen shares and its own */
  const words = early.filter(e => /\/src\/i18n\//.test(e.u)).map(e => e.u.split('/src/i18n/')[1]);
  if (words.sort().join() !== 'en/core.json,en/hold.json') problems.push(tag + ': it fetches words beyond core.json and its own (hold.json): ' + words.join(', '));
  const sheets = early.filter(e => /\.css$/.test(e.u)).map(name);
  if (sheets.sort().join() !== 'base.css,hold.css') problems.push(tag + ': it fetches styles beyond base.css and its own (hold.css): ' + sheets.join(', '));
  await fp.close();
}
