import { S } from './shared.mjs';

export const about = 'a device too slow for 3D gets the flat drawing back; a connection that saves data still gets every word';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* a device too slow for a level in 3D gets its flat drawing back (osl-quality = slow makes every level count as too slow) */
  {
    S.at = 'slow device'; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => problems.push('slow device: ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'slow'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/dive/atom');
    await page.waitForFunction(() => { const h = document.getElementById('l3-atom'); return h && h.hidden && +getComputedStyle(document.getElementById('diveCanvas')).opacity > 0.9; }, null, { timeout: 30000 }).catch(() => problems.push('slow device: a level too slow in 3D did not fall back to its flat drawing'));
    await page.close();
  }
  /* on low settings (a software renderer starts there) a level in 3D still names its parts once it has arrived: its
     last frames of the arrival rounded alike, so the names, which wait for the arrival's end, never showed (#435).
     Every name is asked for (show); one with no room on a slow machine may still be left out (folded), so at least one
     is read on the picture */
  for (const [lv, hash, n] of [['phone', '#/dive/phone/phone', 4], ['ecu', '#/dive/ecu/car', 3]]) {
    S.at = 'low settings: ' + lv; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(S.at + ': ' + e.message));
    await page.addInitScript(() => { localStorage.setItem('osl-quality', 'low'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html' + hash);
    await page.waitForFunction(([id, count]) => { const h = document.getElementById('l3-' + id); if (!h || h.hidden || document.documentElement.dataset.arrive) return false;
      const N = [...h.querySelectorAll('.part3')].filter(e => e.f2L);
      return N.length >= count && N.every(e => e.f2L.show) && N.some(e => e.f2L.on && !e.f2L.folded && e.style.opacity !== '0' && e.getBoundingClientRect().width > 0); }, [lv, n], { timeout: 45000, polling: 500 })
      .catch(() => problems.push(S.at + ': ' + hash + ' in 3D on low settings never showed its parts\' names'));
    await page.close();
  }
  /* a connection that saves data (Data Saver, or 2g/3g) gets no idle preload of the words: each view, opened cold, waits
     for every area it shows (src/core/i18n.js, needWords), so none shows a text's name. A name shown warns "Missing
     text", which fails the run (scripts/smoke.mjs); each view is waited for until it has drawn what it shows */
  {
    const saving = () => { Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {} }) });
      localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); };
    const VIEWS = [
      ['the Lab\'s computer', '#/build/computer', () => !!document.querySelector('#sheet:not([hidden]) .plan2')],
      ['the Lab\'s record', '#/build/record', () => !!document.querySelector('#sheet:not([hidden]) ol.record li')],
      ['who is here', '#/build/society', () => !!document.querySelector('#sheet:not([hidden]) .society')],
      ['who makes what', '#/build/mix', () => !!document.querySelector('#sheet:not([hidden]) .mix .mixrow')],
      ['the supply map', '#/supply/datacentre', () => !!document.querySelector('[data-supworld]')],
      ['a world\'s reading page', '#/w/fail', () => !!document.querySelector('svg.copies')],
      ['Keep the chef busy', '#/do/chef', () => !!document.querySelector('.mbgoal')],
      ['Ask on the bench', '#/bench/check', () => { const b = document.querySelector('#diveui [data-mode="ask"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); return !!b && b.getAttribute('aria-selected') === 'true'; }],
      ['the station map', '#/stations', () => { const s = document.getElementById('stations'); return !!s && !s.hidden && s.children.length > 0; }],
      ['the studio\'s dials on the island', '#/island', () => { const d = document.querySelector('.insp:not([hidden]) .dial'); if (!d) { const b = document.querySelector('#mapLabels .place3[data-place="studio"]'); if (b) b.click(); } return !!d; }]
    ];
    for (const [what, hash, drawn] of VIEWS) {
      S.at = 'saving data: ' + what; const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
      page.on('pageerror', e => problems.push(S.at + ': ' + e.message));
      await page.addInitScript(saving);
      await page.goto(base + 'index.html' + hash);
      await page.waitForFunction(drawn, null, { timeout: 60000 }).catch(() => problems.push(S.at + ': ' + hash + ' never drew, with Data Saver on'));
      if (await page.evaluate(() => !!document.documentElement.dataset.preload && document.documentElement.dataset.preload !== 'off')) problems.push(S.at + ': the words were preloaded though the connection saves data');
      await page.close();
    }
  }
  /* the first page with Data Saver: nothing fetched ahead (data-preload off), and the blueprint's words, for what people
     are trying, fetched when the page is first touched */
  {
    S.at = 'saving data: the first page'; const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => problems.push(S.at + ': ' + e.message));
    await page.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {} }) });
      localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await page.goto(base + 'index.html#/');
    await page.waitForFunction(() => !!window.__hold && document.documentElement.dataset.preload === 'off', null, { timeout: 30000 }).catch(() => problems.push(S.at + ': the first page does not say its preload is off'));
    await page.waitForFunction(() => { const e = document.getElementById('home'); if (e.scrollTop < 900) e.scrollTop = 1000; return window.__hold.state().ways; }, null, { timeout: 30000 })
      .catch(() => problems.push(S.at + ': what people are trying never gets its words once the page is touched'));
    await page.close();
  }
}
