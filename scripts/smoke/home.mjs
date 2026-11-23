/* the blueprint, the first page (#/, src/v2/home.js): nothing 3D is drawn there. One wheel, a chip's life round it and
   its scale inward, with every station on it leading to its view; six chapters, each repainting the wheel as it is
   read (the world's two ends, four walls each with its question and source, ten ways past them, people and AI, open
   work); the first page in four languages, and the island and the brand lead out and back */
import { S } from './shared.mjs';

export const about = 'the blueprint, the first page: the wheel of stations, six chapters repainting it, a wall with its question and source, people and AI, four languages, the island one tap away, desktop and phone';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'home ' + w, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
    await hp.goto(base + 'index.html');
    await hp.waitForFunction(() => !document.getElementById('home').hidden && document.querySelectorAll('#home .bp-wheel .bp-st[href^="#/"]').length >= 30 && document.querySelectorAll('#home .bp-ch').length === 6, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page is not the blueprint, with its wheel of stations and six chapters'));
    if (await hp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the blueprint');
    if (!(await hp.evaluate(() => [...document.querySelectorAll('#home .bp-stagename')].map(e => e.textContent).join() === 'Open,Design,Make,Test,Ship,Use'))) problems.push(tag + ': the wheel does not name the six stages of a chip\'s life');
    /* a stage picked: its sector lit, and a card with the stations in it */
    await hp.waitForFunction(() => { const b = document.querySelector('#home [data-stagepick="make"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return document.querySelectorAll('#home [data-card] .bp-cardlinks a[href^="#/"]').length >= 4; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a stage picked shows no card with its stations'));
    /* each chapter, read, repaints the wheel */
    const chapter = async (id, what) => hp.waitForFunction(id => { const c = document.querySelector('#home .bp-ch[data-ch="' + id + '"]'); if (c) c.scrollIntoView({ block: 'center' }); return document.querySelector('#home .bp').dataset.mode === id; }, id, { timeout: 10000 }).catch(() => problems.push(tag + ': reading ' + what + ' does not change the wheel'));
    await chapter('world', 'the world it takes');
    await hp.waitForFunction(() => { const b = document.querySelector('#home button[data-side="open"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return document.querySelector('#home .bp').dataset.side === 'open'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the open end cannot be shown'));
    await chapter('walls', 'the walls');
    await hp.waitForFunction(() => { const b = document.querySelector('#home [data-wallpick="memory"]'); if (b && !document.querySelector('#home [data-card] .bp-q')) b.click(); const c = document.querySelector('#home [data-card]'); return !!c && !c.hidden && !!c.querySelector('.bp-q') && /3,500/.test(c.textContent); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a wall shows no card with its question'));
    await hp.waitForFunction(() => /^Source:/.test((document.querySelector('#home [data-card] [data-src]') || {}).textContent || '') && !!document.querySelector('#home [data-card] [data-src] a[href^="http"]'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': a wall\'s figure shows no source'));
    await chapter('next', 'what comes next');
    await hp.waitForFunction(() => { const b = document.querySelector('#home [data-nextpick="cim"]'); if (b && !/Attacks/.test((document.querySelector('#home [data-card]') || {}).textContent || '')) b.click(); return /Attacks: The memory wall/.test((document.querySelector('#home [data-card]') || {}).textContent || ''); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a way past the walls does not say which wall it attacks'));
    await chapter('people', 'people and AI');
    { const n0 = await hp.textContent('#home [data-stepnote]').catch(() => '');
      await hp.waitForFunction(n0 => { const r = document.querySelector('#home [data-step]'); if (r && r.value !== '2') { r.value = '2'; r.dispatchEvent(new Event('input', { bubbles: true })); } const n = document.querySelector('#home [data-stepnote]'); return !!n && n.textContent !== n0 && /not a forecast/.test(n.textContent); }, n0, { timeout: 10000 }).catch(() => problems.push(tag + ': moving the AI share does not change what people and AI each do')); }
    await chapter('you', 'your move');
    const side = await hp.evaluate(() => { const p = document.getElementById('home'); return p.scrollWidth - p.clientWidth; });
    if (side > 1) problems.push(tag + ': the blueprint scrolls sideways by ' + side + ' px');
    /* the first page in another language: its words, the bar's stages, and a way back */
    await hp.goto(base + 'index.html?lang=zh#/');
    await hp.waitForFunction(() => document.documentElement.lang === 'zh' && /蓝图/.test((document.querySelector('#home .bp-hero h1') || {}).textContent || '') && [...document.querySelectorAll('#home .bp-stagename')].some(e => e.textContent === '设计'), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page does not show in Chinese'));
    await hp.click('#home [data-lang="en"]').catch(() => problems.push(tag + ': the first page offers no way back to English'));
    await hp.waitForFunction(() => document.documentElement.lang === 'en' && /blueprint/.test((document.querySelector('#home .bp-hero h1') || {}).textContent || ''), null, { timeout: 20000 }).catch(() => problems.push(tag + ': the first page does not come back to English'));
    /* the island is one tap away, the brand comes back, a station on the wheel leads into its view */
    await hp.click('#home .bp-hero a[href="#/island"]').catch(() => problems.push(tag + ': the blueprint offers no way to the island'));
    await hp.waitForFunction(() => location.hash === '#/island' && document.getElementById('home').hidden && !document.getElementById('mapCanvas').hidden, null, { timeout: 30000 }).catch(() => problems.push(tag + ': the island does not open from the blueprint'));
    await hp.click('.bar .brand').catch(() => problems.push(tag + ': no brand in the bar'));
    await hp.waitForFunction(() => !document.getElementById('home').hidden && document.getElementById('mapCanvas').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the brand does not lead back to the blueprint'));
    await hp.waitForFunction(() => { const a = document.querySelector('#home .bp-st[data-st="print"]'); if (a && location.hash !== '#/line/print') a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return location.hash === '#/line/print' && document.getElementById('home').hidden; }, null, { timeout: 20000 }).catch(() => problems.push(tag + ': a station on the wheel does not lead into its view'));
    await hp.close();
  }
}
