import { S } from './shared.mjs';

export const about = 'the frame (#271): the size at every level and the ring on the way in, desktop and phone; the caption at a dive level with its question in full, desktop and phone; on a phone the sheet at three heights, the seam note in it, the names at the gate apart and Your log clear of the loop; Half the power won in Do mode, its instrument on the stage beside the panel that holds its controls; a chip\'s settings played on the line, Jevons\' bet in the island\'s sheet; a question\'s page in Read mode, its column, its picture and the bar';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  const tag = 'motion';
  /* how big it is here, and the ring on the way in, in every view (#231, #232, #234): a page of its own, as it moves
     between views. The layers of a chip stand in the free part of the picture, their names inside it and never under
     the card; each level on the rail says its size; the way in stands beside the next layer, the dive's next level and
     the board's chip, with a ring on it; and while the dive moves the card says how many times closer it goes */
  for (const [vt, viewport, scheme] of [['desktop', { width: 1280, height: 800 }, 'dark'], ['phone', { width: 390, height: 844 }, 'light']]) {
    const page = await browser3d.newPage({ viewport, colorScheme: scheme }), tg = tag + ' (' + vt + ')';
    await page.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
    page.on('pageerror', e => problems.push(tg + ' (size and ring): ' + e.message));
    await page.goto(base + 'index.html#/chip/1');
    const ringAt = ui => { const w = document.querySelector(ui + ' .wayin.at:not([hidden])'); return !!w && !!w.style.getPropertyValue('--wx') && !!w.querySelector('.wigo'); };
    await page.waitForFunction(ringAt, '#chipui', { timeout: 90000, polling: 1000 }).catch(() => problems.push(tg + ': the chip\'s layers put no ring on the way in'));
    if ((await page.$$('#chipui .rail2 .sz')).length !== 5) problems.push(tg + ': the chip\'s layers do not say their sizes on the rail');
    /* the names shown stay inside the picture, and clear of the card (polled: on a slow renderer the names may still
       stand where the frame before a resize put them, until the next frame is drawn) */
    const strayNames = () => { const c = document.getElementById('chipCanvas').getBoundingClientRect(), d = document.querySelector('#chipui .dockwrap').getBoundingClientRect();
      return [...document.querySelectorAll('#chipLabels .lbl3')].filter(e => e.style.opacity !== '0').filter(e => { const r = e.getBoundingClientRect();
        return r.left < c.left - 2 || r.right > c.right + 2 || r.top < c.top - 2 || (r.right > d.left && r.left < d.right && r.bottom > d.top && r.top < d.bottom); }).map(e => { const r = e.getBoundingClientRect(); return e.textContent + ' at ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(',') + ' (picture ' + [c.right, c.bottom].map(Math.round).join(',') + ', card from ' + Math.round(d.left) + ')'; }); };
    await page.waitForFunction(f => !new Function('return (' + f + ')()')().length, strayNames.toString(), { timeout: 60000, polling: 1000 })
      .catch(async () => problems.push(tg + ': names of the chip\'s layers outside the picture or under the card: ' + (await page.evaluate(strayNames)).join(', ')));
    /* the rest is the same frame on a phone: checked once, on the desktop, to keep the run short */
    if (vt === 'phone') { await page.close(); continue; }
    await page.evaluate(() => { location.hash = '#/board'; });
    await page.waitForFunction(ringAt, '#boardui', { timeout: 90000, polling: 1000 }).catch(() => problems.push(tg + ': the board puts no ring on its way into the chip'));
    await page.evaluate(() => { location.hash = '#/dive/block'; });
    await page.waitForFunction(ringAt, '#diveui', { timeout: 90000, polling: 1000 }).catch(() => problems.push(tg + ': the dive puts no ring on the square it goes into'));
    if ((await page.$$('#diveui .rail2 .sz')).length < 5) problems.push(tg + ': the dive\'s levels do not say their sizes on the rail');
    /* going in: every line the card shows is kept, so a quick move is not missed between two polls */
    await page.evaluate(() => { window.zooms = []; const keep = () => { const l = document.querySelector('#diveui .scale2.moving:not([hidden])'); if (l) window.zooms.push(l.textContent); };
      new MutationObserver(keep).observe(document.getElementById('diveui'), { subtree: true, attributes: true, childList: true, characterData: true }); });
    await page.waitForFunction(() => { if (/#\/dive\/block$/.test(location.hash)) { const b = document.querySelector('#diveui .wayin:not([hidden]) .wigo'); if (b) b.click(); } return window.zooms.some(z => /times closer/.test(z)); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tg + ': going deeper, the card does not say how many times closer'));
    await page.close(); }
  /* the frame's three modes (src/v2/frame2.js, #271): Look is a caption on the picture with the level's
     name and its whole question; Do gives a lab's instrument the stage, its controls in the side panel beside it. A
     flat page of its own (a fresh visitor), as the labs' are; every move is done again inside the poll */
  { const tag = 'frame modes', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } }); fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await fp.goto(base + 'index.html#/dive/block');
    /* the caption: bottom left on the picture, the level's name as its title, the question whole (never cut), Read more and Do */
    await fp.waitForFunction(() => { const w = document.querySelector('#diveui.f2cap > .dockwrap'), q = w && w.querySelector('.dock > .askline'), h = w && w.querySelector('.f2head .f2t');
      if (!w || !q || !h || !h.textContent.trim() || !w.querySelector('[data-f2open]') || !w.querySelector('.f2do')) return false;
      const r = w.getBoundingClientRect(), qr = q.getBoundingClientRect(), fs = parseFloat(getComputedStyle(q).fontSize);
      return r.left < innerWidth / 2 && r.bottom <= innerHeight && r.top > 0 && qr.top >= r.top && qr.bottom <= r.bottom && q.scrollHeight <= q.clientHeight + 1 && fs >= 15; }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at the block, the caption does not show the level\'s name and its whole question on the picture'));
    /* Read more: the whole card in the side panel, and back to the caption */
    await fp.waitForFunction(() => { const b = document.querySelector('#diveui.f2cap [data-f2open]'); if (b) b.click(); return !!document.querySelector('#diveui.f2side.f2open .f2more .nav'); }, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': Read more does not open the whole card in the side panel'));
    /* Do: Half the power, its chart on the stage left of the panel, its dials in the panel and in sight; won by the dials */
    await fp.evaluate(() => { location.hash = '#/do/power-curve'; });
    await fp.waitForFunction(() => { const set = (q, v) => { const i = document.querySelector(q); if (i && i.value !== String(v)) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } };
      const host = document.querySelector('#diveui.f2stage'), panel = host && host.querySelector('.dockwrap'), inst = host && host.querySelector('.player[data-ch="power-curve"] [data-f2="instrument"]'), goal = host && host.querySelector('[data-f2="goal"]');
      if (!panel || !inst || !goal) return false;
      set('#ckp-f', 2.25); set('#ckp-v', 0.61);
      const P = panel.getBoundingClientRect(), I = inst.getBoundingClientRect(), G = goal.getBoundingClientRect(), dials = [...panel.querySelectorAll('#ckp-f, #ckp-v')].map(d => d.getBoundingClientRect());
      return I.right <= P.left && I.width > 500 && I.height > 300 && G.bottom <= I.top && G.right <= P.left && dials.length === 2 && dials.every(d => d.left >= P.left && d.right <= P.right && d.top >= P.top && d.bottom <= innerHeight)
        && !!host.querySelector('.f2where:not([hidden])') && !!host.querySelector('.player .won'); }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': Half the power is not won in Do mode with its chart on the stage and its dials in the panel beside it'));
    /* where you are leads back to the picture, and its caption */
    await fp.waitForFunction(() => { const w = document.querySelector('#diveui .f2where:not([hidden])'); if (w) w.click(); return !!document.querySelector('#diveui.f2cap .f2head'); }, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': where you are does not lead back to the caption'));
    /* the bench in Do mode (#268): a bench challenge's layout takes the stage, the bench over the picture steps aside */
    await fp.evaluate(() => { location.hash = '#/do/floor'; });
    await fp.waitForFunction(() => { const host = document.querySelector('#diveui.f2stage'), panel = host && host.querySelector('.dockwrap'), inst = host && host.querySelector('.player[data-ch="floor"] .benchinst[data-f2="instrument"]'), goal = host && host.querySelector('.player[data-ch="floor"] [data-f2="goal"]');
      if (!panel || !inst || !goal) return false; const P = panel.getBoundingClientRect(), I = inst.getBoundingClientRect(), sf = document.querySelector('.bsurf');
      return I.right <= P.left && I.width > 400 && I.height > 300 && !!inst.querySelector('[data-bk-cell]') && (!sf || getComputedStyle(sf).visibility === 'hidden' || sf.hidden); }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': the shortest wire does not put the bench on the stage in Do mode'));
    /* every challenge in Do mode (#274; all of them: --only labs): your chip's settings on the factory's line keep
       the line as the picture, the goal across it and the dials in the panel; a challenge met in the island's sheet
       (Jevons' bet) has its instrument on the stage beside the sheet, which holds the dials */
    await fp.evaluate(() => { location.hash = '#/do/months'; });
    await fp.waitForFunction(() => { const host = document.querySelector('.f2stage.f2place:not([hidden])'), p = host && host.querySelector('.player[data-ch="months"]'), panel = host && host.querySelector(':scope > .dockwrap'), g = p && p.querySelector('[data-f2="goal"]');
      if (!g || !panel) return false; const P = panel.getBoundingClientRect(), G = g.getBoundingClientRect(), cv = [...document.querySelectorAll('#stage > .c3:not([hidden])')];
      return G.right <= P.left && G.top >= 100 && cv.some(c => getComputedStyle(c).visibility === 'visible') && panel.querySelectorAll('input[data-set]').length >= 2 && !!host.querySelector('.f2where:not([hidden])'); }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': through the factory in time is not played on the line in Do mode, its goal across the picture and its dials in the panel'));
    await fp.evaluate(() => { location.hash = '#/do/jevons'; });
    await fp.waitForFunction(() => { const g = document.querySelector('#sheet [data-guess-jv="2"]'); if (g) g.click();
      const sh = document.querySelector('#sheet.f2do.f2stage:not([hidden])'), i = sh && sh.querySelector('.player[data-ch="jevons"] [data-f2="instrument"]'); if (!i) return false;
      const S = sh.getBoundingClientRect(), I = i.getBoundingClientRect(), ds = [...sh.querySelectorAll('input[data-bet]')];
      return I.right <= S.left && I.width > 400 && I.height > 250 && ds.length === 2 && ds.every(d => { const r = d.getBoundingClientRect(); return r.left >= S.left && r.right <= S.right; }) && !!document.querySelector('#stage > .f2where.f2isle:not([hidden])'); }, null, { timeout: 120000, polling: 1000 })
      .catch(() => problems.push(tag + ': Jevons\' bet, met in the island\'s sheet, does not put its turbines and curve on the stage beside the sheet that holds its dials'));
    const side = await fp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await fp.close(); }
  /* a phone: the caption is the sheet, and at rest it shows the level's name and the whole question */
  { const tag = 'frame phone', pp = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); pp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await pp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await pp.goto(base + 'index.html#/dive/gate');
    await pp.waitForFunction(() => { const w = document.querySelector('#diveui.f2cap > .dockwrap.peek'), q = w && w.querySelector('.dock > .askline'), h = w && w.querySelector('.f2head .f2t');
      if (!q || !h) return false; const r = w.getBoundingClientRect(), qr = q.getBoundingClientRect(), hr = h.getBoundingClientRect();
      return hr.top >= r.top && qr.bottom <= r.bottom + 1 && q.scrollHeight <= q.clientHeight + 1 && w.scrollHeight <= w.clientHeight + 1 && r.bottom <= innerHeight; }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at rest, the sheet does not show the level\'s name and the whole question'));
    /* the sheet's three heights (#275): a tap on the handle goes up from the peek to half, then to the whole, then back
       to the peek; each poll taps again only from the height before */
    const peekH = await pp.evaluate(() => { const w = document.querySelector('#diveui > .dockwrap'); return w ? w.getBoundingClientRect().height : 0; });
    for (const [from, to] of [['peek', 'f2half'], ['f2half', 'f2full'], ['f2full', 'peek']]) {
      await pp.waitForFunction(([from, to, peekH]) => { const w = document.querySelector('#diveui.f2 > .dockwrap'), hd = w && w.querySelector(':scope > .peekbar'); if (!hd) return false;
        if (w.classList.contains(from) && !w.classList.contains(to)) hd.click();
        const r = w.getBoundingClientRect(); if (!w.classList.contains(to) || w.style.top) return false;
        return to === 'peek' ? Math.abs(r.height - peekH) < 2 && hd.getAttribute('aria-expanded') === 'false'
          : to === 'f2half' ? r.height > peekH + 40 && r.top >= innerHeight * 0.45 && hd.getAttribute('aria-expanded') === 'true'
          : r.top <= 120 && r.bottom <= innerHeight; }, [from, to, peekH], { timeout: 20000, polling: 500 })
        .catch(() => problems.push(tag + ': a tap on the handle does not move the sheet from ' + from + ' to ' + to));
    }
    /* a notice goes into the sheet, never over the picture: the seam crossed from the gate up to the block */
    await pp.waitForFunction(() => { if (location.hash !== '#/dive/block') location.hash = '#/dive/block';
      const n = document.querySelector('.seamnote'), w = document.querySelector('#diveui.f2 > .dockwrap'); if (!n || n.hidden || !w || !w.contains(n)) return false;
      const N = n.getBoundingClientRect(), W = w.getBoundingClientRect(); return N.top >= W.top && N.bottom <= W.bottom && !!w.querySelector('.f2head .f2t'); }, null, { timeout: 30000, polling: 500 })
      .catch(() => problems.push(tag + ': the seam note does not sit in the sheet on a phone'));
    const side = await pp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await pp.close(); }
  /* a narrow phone in 3D (#275): the names on the gate keep apart (src/v2/kit3d.js), none covering another nor the
     frame's own things; on a reading page Your log does not cover the loop's dots */
  { const tag = 'frame phone names', np = await browser3d.newPage({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' }); np.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await np.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await np.goto(base + 'index.html#/dive/gate');
    await np.waitForFunction(() => { if (location.hash !== '#/dive/gate') location.hash = '#/dive/gate';
      const host = document.getElementById('l3-gate'); if (!host || host.hidden || document.documentElement.dataset.join) return false;
      const box = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }, cross = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
      const N = [...host.querySelectorAll('.lbl3.part3')].filter(e => e.style.opacity !== '0' && e.offsetParent).map(box);
      const K = [...document.querySelectorAll('#diveui > :is(.homebtn, .joulebtn, .dockwrap), #diveui > .crumbs2 > a, .bar')].filter(e => e.offsetParent || e.matches('.bar')).map(box);
      return N.length >= 3 && N.every((a, i) => N.every((b, j) => i === j || !cross(a, b)) && K.every(k => !cross(a, k))); }, null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': on a phone, names on the gate cover each other or the frame'));
    await np.waitForFunction(() => { if (location.hash !== '#/w/fail') location.hash = '#/w/fail';
      const bar = document.querySelector('.bar.f2reading'), ol = bar && bar.querySelector('.loop ol'), log = document.getElementById('logbtn'); if (!ol || !log) return false;
      const L = ol.getBoundingClientRect(), G = log.getBoundingClientRect(), loop = bar.querySelector('.loop'); return L.right <= G.left && loop.scrollWidth <= loop.clientWidth + 1; }, null, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': on a reading page, Your log covers the loop\'s dots'));
    await np.close(); }
  /* Read (#273): a question's page is a reading page in the frame, a column of about 70 characters at 18 to 18.5 px
     with its picture pinned beside it (first on a phone, under the title); the bar says Reading and lights no stage;
     the way back leads to where you came from (here, your log) */
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const tag = 'frame read ' + w, rp = await browser.newPage({ viewport: { width: w, height: h } }); rp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await rp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await rp.goto(base + 'index.html#/log');
    await rp.waitForFunction(() => { if (location.hash !== '#/w/fail' && document.querySelector('#page:not([hidden]) [data-jump]')) location.hash = '#/w/fail';
      const page = document.querySelector('#page.f2rd:not([hidden])'), art = page && page.querySelector('.f2read.world'), col = art && art.querySelector('.f2col'), pic = art && art.querySelector('.f2pic'), head = art && art.querySelector('.f2rhead'), p = col && col.querySelector('p');
      const bar = document.querySelector('.bar.f2reading'), rk = bar && bar.querySelector('.loop .f2rk'), back = page && page.querySelector('.f2back');
      if (!col || !pic || !head || !p || !rk || !back) return false;
      const fs = parseFloat(getComputedStyle(p).fontSize), C = col.getBoundingClientRect(), P = pic.getBoundingClientRect(), H = head.getBoundingClientRect(), ch = C.width / (fs * 0.5);
      const placed = innerWidth > 720 ? P.right <= C.left && getComputedStyle(pic).position === 'sticky' && P.top >= 60 && P.bottom <= innerHeight + 1 : P.top >= H.bottom - 1 && C.top >= P.bottom - 1;
      return fs >= 18 && fs <= 18.5 && (innerWidth <= 720 || (ch >= 60 && ch <= 80)) && placed && !!rk.textContent.trim() && !bar.querySelector('.loop [aria-current]') && back.getAttribute('href') === '#/log'; }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': a question\'s page is not a reading column of about 70 characters at 18 to 18.5 px with its picture beside it (first on a phone), the bar saying Reading with no stage lit and a way back to the log'));
    const side = await rp.evaluate(() => Math.max(document.documentElement.scrollWidth - innerWidth, (() => { const p = document.querySelector('#page'); return p ? p.scrollWidth - p.clientWidth : 0; })()));
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await rp.close(); }
  /* the core questions are met on the picture (#303, docs/FRAME13.md): at a level, at most three marks while you look,
     one for every lens that lives there with Ask open, each beside its part; a mark tapped opens its lens alone and
     Put it down closes it; no row of their names anywhere */
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'frame marks ' + w, mp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme }); mp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await mp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    for (const hash of ['#/dive/block', '#/dive/gate', '#/place/datacentre/2']) {
      await mp.goto(base + 'index.html' + hash);
      await mp.waitForFunction(() => { const n = [...document.querySelectorAll('.mark3')].filter(m => !m.hidden && m.offsetParent).length; return n >= 1 && n <= 3; }, null, { timeout: 90000, polling: 500 })
        .catch(() => problems.push(tag + ' ' + hash + ': looking, the picture shows no marks, or more than three'));
      await mp.waitForFunction(() => { const f = [...document.querySelectorAll('section')].find(x => !x.hidden && x.querySelector(':scope > .marks3')); if (!f) return false;
        const b = f.querySelector('.modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click();
        const all = [...f.querySelectorAll('.mark3')], n = all.filter(m => !m.hidden && m.offsetParent).length;
        return b && b.getAttribute('aria-selected') === 'true' && all.length >= 2 && all.length <= 6 && n === all.length && !!f.querySelector('.dock .qlsay'); }, null, { timeout: 30000, polling: 500 })
        .catch(() => problems.push(tag + ' ' + hash + ': with Ask open, not one mark for every lens that lives here, or no word that the marks are its questions'));
      await mp.waitForFunction(() => { const f = [...document.querySelectorAll('section')].find(x => !x.hidden && x.querySelector(':scope > .marks3')); if (!f) return false;
        if (!f.querySelector('.dock .qlcard')) { const m = [...f.querySelectorAll('.mark3')].find(x => !x.hidden); if (m) m.click(); return false; }
        return f.querySelectorAll('.dock .qlcard').length === 1 && f.querySelectorAll('.mark3[aria-pressed="true"]').length === 1 && f.querySelectorAll('.mark3.dim').length >= 1 && !document.querySelector('.qlbar'); }, null, { timeout: 30000, polling: 500 })
        .catch(() => problems.push(tag + ' ' + hash + ': a mark tapped does not open its lens alone, the others dimmed'));
      await mp.waitForFunction(() => { const f = [...document.querySelectorAll('section')].find(x => !x.hidden && x.querySelector(':scope > .marks3')); if (!f) return false;
        const off = f.querySelector('.dock [data-lensoff]'); if (off) off.click();
        return !f.querySelector('.dock .qlcard') && !!f.querySelector('.dock .qlsay') && !f.querySelector('.mark3.dim'); }, null, { timeout: 15000, polling: 500 })
        .catch(() => problems.push(tag + ' ' + hash + ': Put it down does not close the lens'));
    }
    await mp.close(); }
  /* lenses repaint the picture (#304): at the block, each lens that lives there paints the level from its parts, a
     layer pinned onto the picture, with its control and measures in its card; a control moved changes what it
     measures; going down a level keeps a lens that lives there too, and puts one down, saying so, that does not */
  { const tag = 'frame lenses', lp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }); lp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await lp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await lp.goto(base + 'index.html#/dive/block');
    for (const q of ['geo', 'copy', 'physics', 'eff', 'dig', 'perfect']) {
      await lp.waitForFunction(q => { const f = document.querySelector('#diveui'); if (!f || f.hidden) return false;
        const b = f.querySelector('.modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') { b.click(); return false; }
        const m = f.querySelector('.mark3[data-lens="' + q + '"]'); if (m && m.getAttribute('aria-pressed') !== 'true') { m.click(); return false; }
        const svg = document.querySelector('.lenspaint:not([hidden]) svg[data-lens="' + q + '"]'), box = svg && svg.getBoundingClientRect();
        return !!svg && svg.querySelectorAll('rect, path, circle, line').length > 0 && box.width > 200 && !!f.querySelector('.dock .lpinst[data-lpinst="' + q + '"] .lpm b'); }, q, { timeout: 90000, polling: 500 })
        .catch(() => problems.push(tag + ': the ' + q + ' lens does not repaint the block, or has no instrument'));
    }
    /* a control moved: what it measures moves (Geometry: packing the logic beside the memory shortens the trip) */
    await lp.waitForFunction(() => { const f = document.querySelector('#diveui'), m = f && f.querySelector('.mark3[data-lens="geo"]'); if (m && m.getAttribute('aria-pressed') !== 'true') { m.click(); return false; }
      const r = f && f.querySelector('.dock [data-lpctl="geo"]'), v = f && f.querySelector('.dock [data-lpm="trip"]'); if (!r || !v) return false;
      if (!r.dataset.was) { r.dataset.was = v.textContent; r.value = r.max; r.dispatchEvent(new Event('input', { bubbles: true })); return false; }
      return v.textContent !== r.dataset.was; }, null, { timeout: 30000, polling: 500 })
      .catch(() => problems.push(tag + ': moving Geometry\'s control does not change what it measures'));
    /* down to the gate: Fight or use physics lives there too and stays on; Geometry does not, and is put down, saying so */
    /* what the frame shows, said with a failure, so a run on a slower machine can be read from its log */
    const seen = () => lp.evaluate(() => { const f = document.querySelector('#diveui'); if (!f) return 'no frame';
      return location.hash + '; lit: ' + ([...f.querySelectorAll('.mark3[aria-pressed="true"]')].map(m => m.dataset.lens).join(',') || 'none') + '; marks: ' + [...f.querySelectorAll('.mark3')].map(m => m.dataset.lens + (m.hidden ? '(hidden)' : '')).join(',') +
        '; cards: ' + f.querySelectorAll('.dock .qlcard').length + (f.querySelector('.dock .qldown') ? '; said put down' : '') + '; steps: ' + [...f.querySelectorAll('.dock .qlsteps [data-divego]')].map(b => b.textContent.trim()).join(' | ') + '; ask: ' + ((f.querySelector('.modes3 [data-mode="ask"]') || {}).ariaSelected); }).catch(e => 'unreadable: ' + e.message);
    await lp.waitForFunction(() => { const f = document.querySelector('#diveui'); if (!f) return false;
      if (location.hash === '#/dive/block') { const m = f.querySelector('.mark3[data-lens="physics"]'); if (m && m.getAttribute('aria-pressed') !== 'true') { m.click(); return false; }
        const d = [...f.querySelectorAll('.dock .qlsteps [data-divego]')].find(b => /↓/.test(b.textContent)); if (d) d.click(); return false; }
      return location.hash === '#/dive/gate' && !!f.querySelector('.mark3[data-lens="physics"][aria-pressed="true"]') && !!f.querySelector('.dock .qlcard'); }, null, { timeout: 60000, polling: 500 })
      .catch(async () => problems.push(tag + ': going down a level does not keep a lens that lives there too (' + await seen() + ')'));
    await lp.evaluate(() => { location.hash = '#/dive/block'; });
    await lp.waitForFunction(() => { const f = document.querySelector('#diveui'); if (!f) return false;
      if (location.hash === '#/dive/block') { const m = f.querySelector('.mark3[data-lens="geo"]'); if (m && m.getAttribute('aria-pressed') !== 'true') { m.click(); return false; }
        const d = [...f.querySelectorAll('.dock .qlsteps [data-divego]')].find(b => /↓/.test(b.textContent)); if (d && f.querySelector('.dock .lpinst[data-lpinst="geo"]')) d.click(); return false; }
      return location.hash === '#/dive/gate' && !!f.querySelector('.dock .qldown') && !f.querySelector('.mark3[aria-pressed="true"]'); }, null, { timeout: 60000, polling: 500 })
      .catch(async () => problems.push(tag + ': going down to where a lens does not live does not put it down, saying so (' + await seen() + ')'));
    await lp.close(); }
  /* a world is a reading page opened from a lens (#305): at the block, the lens whose form is a stop of a world reads
     more in it, and Read more opens that world's page at the block */
  { const tag = 'frame read more', rp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }); rp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await rp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await rp.goto(base + 'index.html#/dive/block');
    await rp.waitForFunction(() => { if (location.hash.startsWith('#/w/')) return !!document.querySelector('#page:not([hidden]) .f2read.world') && location.hash.endsWith('/at/block');
      const f = document.querySelector('#diveui'); if (!f || f.hidden) return false;
      const b = f.querySelector('.modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') { b.click(); return false; }
      const r = f.querySelector('.dock .qlcard a.qlread[href^="#/w/"]'); if (r) { r.click(); return false; }
      const M = [...f.querySelectorAll('.mark3')].filter(m => !m.hidden), on = M.findIndex(m => m.getAttribute('aria-pressed') === 'true'), m = M[(on + 1) % M.length]; if (m) m.click();
      return false; }, null, { timeout: 90000, polling: 700 })
      .catch(() => problems.push(tag + ': no lens at the block reads more in its world, or Read more does not open its page'));
    await rp.close(); }
  /* two lenses held (#315): at the block, Geometry with Efficiency fuels use draws a front, its dot moving with where
     the logic sits and the front moving with the innovation, the ledger's attempts on it and yours kept there (#326);
     Fight or use physics with Brain or copy a fork, whose line
     drags across the picture; with Digital meets physical a chain, whose steps light as it heats */
  { const tag = 'frame meets', mp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }); mp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await mp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await mp.goto(base + 'index.html#/dive/block');
    /* hold a with b: open a's mark, then its Hold both (or Hold with) for b; true once the pair's layer is on the picture */
    const hold = ([a, b, key]) => { const f = document.querySelector('#diveui'); if (!f || f.hidden) return false;
      const ask = f.querySelector('.modes3 [data-mode="ask"]'); if (ask && ask.getAttribute('aria-selected') !== 'true') { ask.click(); return false; }
      if (document.querySelector('.lenspaint:not([hidden]) svg[data-pair="' + key + '"]') && f.querySelector('.dock .qlpair .lpinst')) return true;
      const h = f.querySelector('.dock [data-hold="' + b + '"]'); if (h && f.querySelector('.mark3[data-lens="' + a + '"][aria-pressed="true"]')) { h.click(); return false; }
      const m = f.querySelector('.mark3[data-lens="' + a + '"]'); if (m) m.click(); return false; };
    await mp.waitForFunction(hold, ['geo', 'eff', 'eff.geo'], { timeout: 90000, polling: 500 }).catch(() => problems.push(tag + ': holding Geometry and Efficiency fuels use draws no front'));
    await mp.waitForFunction(() => { const dot = document.querySelector('#diveui .dock .lpfront .lpdot'), r = document.querySelector('[data-lppc="eff.geo:p"]'), n = document.querySelector('[data-lppc="eff.geo:n"]'); if (!dot || !r || !n) return false;
      if (!window.__dot) { window.__dot = dot.getAttribute('cx'); r.value = 4; r.dispatchEvent(new Event('input', { bubbles: true })); return false; }
      /* the card is drawn again after each move: the innovation's control is the new one */
      if (n.value !== '3') { n.value = 3; n.dispatchEvent(new Event('input', { bubbles: true })); return false; }
      const d2 = document.querySelector('#diveui .dock .lpfront .lpdot'); return d2 && d2.getAttribute('cx') !== window.__dot && !!document.querySelector('#diveui .dock .lpfront .lpline1'); }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': the front\'s dot does not move with the logic, or the innovation does not move the front'));
    /* the block's open problem, live (#326): the attempts kept in the ledger are points on the front, and a point of
       yours is kept there too, signed, its slip under the chart and its dot ringed */
    await mp.waitForFunction(() => { const box = document.querySelector('#diveui .dock [data-lppair="eff.geo"]'); if (!box) return false;
      if (box.querySelector('.lptries .slip') && box.querySelector('.lpfront .lpatt.mine')) return true;
      if (box.querySelectorAll('.lpfront .lpatt').length < 4) return false;
      const n = box.querySelector('.lpkeep [data-sign]'), k = box.querySelector('[data-lpkeep]'); if (n && !n.value) n.value = 'Smoke';
      if (k) k.click(); return false; }, null, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': the front shows no attempts from the ledger, or a point cannot be kept there'));
    await mp.evaluate(() => { const p = document.querySelector('#diveui .dock [data-putdown="eff"]'); if (p) p.click(); });
    await mp.waitForFunction(hold, ['physics', 'copy', 'copy.physics'], { timeout: 30000, polling: 500 }).catch(() => problems.push(tag + ': holding Fight or use physics and Brain or copy draws no fork'));
    { let moved = false;
      for (let i = 0; i < 4 && !moved; i++) {
        const box = await mp.evaluate(() => { const h = document.querySelector('.lenspins [data-pindrag]'), l = document.querySelector('.lenspaint svg[data-pair="copy.physics"] > line'); if (!h || !l) return null; window.__x = l.getAttribute('x1'); const r = h.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
        if (!box) { await mp.waitForFunction(() => !!document.querySelector('.lenspins [data-pindrag]'), null, { timeout: 5000 }).catch(() => {}); continue; }
        await mp.mouse.move(box[0], box[1]); await mp.mouse.down(); await mp.mouse.move(box[0] - 120, box[1], { steps: 6 }); await mp.mouse.up();
        moved = await mp.waitForFunction(() => { const l = document.querySelector('.lenspaint svg[data-pair="copy.physics"] > line'); return !!l && l.getAttribute('x1') !== window.__x; }, null, { timeout: 5000 }).then(() => true, () => false);
      }
      if (!moved) problems.push(tag + ': the fork\'s line does not drag across the picture'); }
    await mp.evaluate(() => { const p = document.querySelector('#diveui .dock [data-putdown="copy"]'); if (p) p.click(); });
    await mp.waitForFunction(hold, ['physics', 'dig', 'dig.physics'], { timeout: 30000, polling: 500 }).catch(() => problems.push(tag + ': holding Fight or use physics and Digital meets physical draws no chain'));
    await mp.waitForFunction(() => { const r = document.querySelector('[data-lppc="dig.physics:celsius"]'); if (!r) return false;
      if (r.value !== r.max) { r.value = r.max; r.dispatchEvent(new Event('input', { bubbles: true })); return false; }
      return document.querySelectorAll('.lenspins .lppin.lit').length === 4 && document.querySelectorAll('#diveui .dock .lpchain li.lit').length === 4; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': heating the block does not light the chain\'s steps'));
    await mp.close(); }
  /* Listen (#316): only with ?listen=1. At the block the switch beside the joule's starts the sound on a tap, the
     caption writes what is heard and the parts light in time on the picture (where there is no audio, as here, the
     events come on the page's clock, silently); without the flag there is no switch */
  { const tg = 'frame (listen)', lp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    lp.on('pageerror', e => problems.push(tg + ': ' + e.message));
    await lp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await lp.goto(base + 'index.html?listen=1#/dive/block');
    await lp.waitForFunction(() => { const b = document.querySelector('#diveui .lsnbtn:not([hidden])'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!document.querySelector('#diveui .lsnbox:not([hidden]) [data-lsnplay]'); }, null, { timeout: 120000, polling: 1000 })
      .catch(() => problems.push(tg + ': the Listen switch does not open at the block'));
    await lp.waitForFunction(() => { const c = document.querySelector('#diveui .lsncap'), s = document.querySelector('.lsnlayer svg'); return !!c && !!c.dataset.ev && !!s && +s.dataset.lit > 5; }, null, { timeout: 30000, polling: 500 })
      .catch(() => problems.push(tg + ': listening, the caption does not write what is heard or the parts do not light in time'));
    /* picking what the block does: too hot is heard as wrong bits, written in the caption */
    await lp.waitForFunction(() => { const h = document.querySelector('#diveui [data-lsnstate="hot"]'); if (h && h.getAttribute('aria-pressed') !== 'true') h.click(); const c = document.querySelector('#diveui .lsncap'); return !!c && c.dataset.ev === 'wrong'; }, null, { timeout: 30000, polling: 300 })
      .catch(() => problems.push(tg + ': the block too hot is not heard as wrong bits'));
    await lp.goto(base + 'index.html#/dive/block');
    await lp.waitForFunction(() => !!document.querySelector('#diveui .f2head') && !!document.querySelector('#diveui .joulebtn'), null, { timeout: 120000, polling: 1000 }).catch(() => problems.push(tg + ': the block does not open without the flag'));
    if (await lp.evaluate(() => !!document.querySelector('.lsnbtn, .lsnbox'))) problems.push(tg + ': without ?listen=1 the Listen switch shows');
    await lp.close(); }
  /* how true a level's picture is (#325): the dive's caption carries its mark beside the level's name (the chip computed
     from your chip, the block an idea drawn), tapped it says what it means here; a lens's measures at the block carry
     theirs at the top of its instrument */
  { const tag = 'frame fidelity', fp = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' }); fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await fp.goto(base + 'index.html#/dive/chip');
    await fp.waitForFunction(() => { const m = document.querySelector('#diveui .f2head .f2t .fid[data-fid="computed"]'); if (!m) return false; if (m.getAttribute('aria-expanded') !== 'true') m.click();
      const tip = document.querySelector('.fidtip p'); return !!tip && tip.textContent.length > 30; }, null, { timeout: 120000, polling: 1000 })
      .catch(() => problems.push(tag + ': the chip\'s caption does not carry its mark, or tapping it says nothing'));
    await fp.goto(base + 'index.html#/dive/block');
    await fp.waitForFunction(() => { const f = document.querySelector('#diveui'); if (!f || f.hidden) return false;
      if (!f.querySelector('.f2head .f2t .fid[data-fid="idea"]') && !f.dataset.fidSeen) return false; f.dataset.fidSeen = '1';
      const b = f.querySelector('.modes3 [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') { b.click(); return false; }
      const m = f.querySelector('.mark3[data-lens="geo"]'); if (m && m.getAttribute('aria-pressed') !== 'true') { m.click(); return false; }
      return !!f.querySelector('.dock .lpinst[data-lpinst="geo"] .fidrow .fid[data-fid="computed"]'); }, null, { timeout: 120000, polling: 1000 })
      .catch(() => problems.push(tag + ': the block\'s caption or its lens\'s measures do not carry their marks'));
    await fp.close(); }
}
