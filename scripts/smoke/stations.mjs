/* the map of stations (#/stations, src/v2/stations.js), the first page before the blueprint: nothing 3D is drawn there; the wafer tests its chips, the toys answer,
   a station opens its card with what can be played there and the view it leads to, a question runs through the map as
   a thread, a way in dims what it is not about, and the island and the brand lead out and back */
import { S } from './shared.mjs';

export const about = 'the map of stations (#/stations): the wafer, the toys, a station and its card, a question as a thread, the ways in, the island one tap away, desktop and phone';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 800, 'dark'], [390, 844, 'light']]) {
    const tag = 'stations ' + w, hp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
    hp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    hp.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await hp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); } catch (e) { /* no storage */ } });
    await hp.goto(base + 'index.html#/stations');
    await hp.waitForFunction(() => !document.getElementById('stations').hidden && document.querySelectorAll('#stations .hm-die.ok, #stations .hm-die.bad').length > 20, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the stations are not a map, with a wafer tested'));
    if (await hp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the map');
    /* the same dust, bigger chips: fewer of them on the wafer */
    { const n0 = await hp.evaluate(() => document.querySelectorAll('#stations .hm-die').length);
      await hp.waitForFunction(() => { const b = document.querySelector('#stations [data-wsize="2"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return document.querySelectorAll('#stations .hm-die').length > 0 && document.querySelector('#stations [data-wsize="2"]').getAttribute('aria-pressed') === 'true'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the chip size cannot be changed'));
      const n1 = await hp.evaluate(() => document.querySelectorAll('#stations .hm-die').length);
      if (!(n1 < n0)) problems.push(tag + ': bigger chips do not fit fewer to a wafer (' + n0 + ' then ' + n1 + ')'); }
    /* the gate answers its switches */
    await hp.waitForFunction(() => { const b = document.querySelector('#stations [data-gin="b"]'); if (b && !b.classList.contains('on')) b.click(); const l = document.querySelector('#stations .hm-bulb'); return !!l && l.textContent.trim() === '0'; }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': a NAND with both switches on does not go dark'));
    /* the page leads on to the rest of the lab: six paths by subject, each a line of stops that open where they live
       and a way to start; one question with what is filed under it; what is new; every part of the lab by kind */
    await hp.waitForFunction(() => { const P = [...document.querySelectorAll('#stations .hm-path')];
      return P.length === 6 && P.every(p => p.querySelectorAll('.hm-psteps a[href^="#/"]').length >= 4 && !!p.querySelector('a.hm-pgo[href^="#/"]')); }, null, { timeout: 10000 })
      .catch(() => problems.push(tag + ': the first page has no paths by subject, each with its stops and a way to start'));
    /* each kind's pill holds its word (Explore was wider than its pill) */
    await hp.waitForFunction(() => [...document.querySelectorAll('#stations .hm-psteps .hm-tag, #stations .hm-qitem .hm-tag')].every(e => e.scrollWidth <= e.clientWidth + 1), null, { timeout: 10000 })
      .catch(() => problems.push(tag + ': a stop\'s kind runs out of its pill'));
    if (!(await hp.$('#stations .hm-qcard a.hm-qitem[href^="#/"]'))) problems.push(tag + ': the question on the first page shows nothing behind it');
    if ((await hp.$$('#stations .hm-nitem[href^="#/"]')).length < 3) problems.push(tag + ': the first page does not say what is new');
    { const ix = await hp.evaluate(() => [...document.querySelectorAll('#stations .hm-index a.hm-ilink')].map(a => a.getAttribute('href')));
      for (const h of ['#/challenges', '#/read', '#/island', '#/dive/chip', '#/line/crystal', '#/log']) if (!ix.includes(h)) problems.push(tag + ': the whole lab on the first page has no way to ' + h);
      /* the eleven worlds are reading pages, opened from a lens, never a list (#305) */
      if (ix.includes('#/w')) problems.push(tag + ': the whole lab on the first page still lists the worlds'); }
    /* a scale picked on the ruler opens its level on the map, with how it is designed and made */
    await hp.waitForFunction(() => { const b = document.querySelector('#stations [data-zat="5"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return document.querySelectorAll('#stations .hm-twins button').length === 2 && /Gate/.test((document.querySelector('#stations [data-side] h2') || {}).textContent || ''); }, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the ruler does not open the gate with its designed and made twins'));
    /* a station: what can be played there, and the view it leads to */
    const st = w > 760 ? '#stations .hm-st[data-st="print"]' : '#stations .hm-strip [data-st="print"]';
    if (w <= 760 && await hp.evaluate(() => !!document.querySelector('#stations .hm-fit') && getComputedStyle(document.querySelector('#stations .hm-fit')).display !== 'none')) problems.push(tag + ': the phone gets the wide map');
    await hp.click(st).catch(() => problems.push(tag + ': the station cannot be picked'));
    await hp.waitForFunction(() => document.querySelectorAll('#stations [data-side] a.hm-item').length >= 2 && !!document.querySelector('#stations [data-side] a.hm-enter[href="#/line/print"]'), null, { timeout: 10000 }).catch(() => problems.push(tag + ': a station shows nothing to play, or no way into its view'));
    /* its question, followed: a thread through the map, one question in the bar */
    await hp.click('#stations [data-side] [data-follow]').catch(() => problems.push(tag + ': the station offers no question to follow'));
    await hp.waitForFunction(w > 760 ? () => document.querySelectorAll('#stations .hm-trun').length >= 2 && !!document.querySelector('#stations [data-threadbar] .hm-q') : () => document.querySelectorAll('#stations .hm-strip .onq').length >= 3, null, { timeout: 10000 }).catch(() => problems.push(tag + ': the question is not drawn as a thread through the map'));
    if ((await hp.$$('#stations .hm-q')).length > 3) problems.push(tag + ': too many questions on the page at once');
    /* a way in dims the stations it is not about */
    await hp.click('#stations [data-way="fly"]').catch(() => problems.push(tag + ': no way in called Fly'));
    if (!(await hp.$('#stations .hm-st.dim, #stations .hm-strip .dim'))) problems.push(tag + ': a way in does not dim what it is not about');
    const side = await hp.evaluate(() => { const p = document.getElementById('stations'); return p.scrollWidth - p.clientWidth; });
    if (side > 1) problems.push(tag + ': the map scrolls sideways by ' + side + ' px');
    /* the island is one tap away, the brand comes back, a station leads into its view */
    await hp.click('#stations a[href="#/island"]').catch(() => problems.push(tag + ': the map offers no way to the island'));
    await hp.waitForFunction(() => location.hash === '#/island' && document.getElementById('stations').hidden && !document.getElementById('mapCanvas').hidden, null, { timeout: 30000 }).catch(() => problems.push(tag + ': the island does not open from the map'));
    await hp.click('.bar .brand').catch(() => problems.push(tag + ': no brand in the bar'));
    await hp.waitForFunction(() => !document.getElementById('home').hidden && document.getElementById('stations').hidden && document.getElementById('mapCanvas').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the brand does not lead back to the first page'));
    await hp.evaluate(() => { location.hash = '#/stations'; });
    await hp.waitForFunction(() => !document.getElementById('stations').hidden, null, { timeout: 15000 }).catch(() => problems.push(tag + ': the stations do not open again'));
    await hp.evaluate(() => { location.hash = '#/line/print'; });
    await hp.waitForFunction(() => document.getElementById('stations').hidden, null, { timeout: 20000 }).catch(() => problems.push(tag + ': the map stays over a station\'s view'));
    await hp.close();
  }
}
