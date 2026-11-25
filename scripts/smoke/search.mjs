import { S } from './shared.mjs';

export const about = 'something to look for at a level, kept in your log; the map of the chip world above it';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* something to do at a level (src/data/seek.js): the card says what to look for, a part tapped gives something to
     notice, the part that leads in lights the question, and finding it is kept in your log. A page of its own (a
     fresh visitor), since it moves between views; each tap is done again inside the poll, as the view may still be
     making its card */
  /* on a flat page (the search is in the card; the 3D levels are checked elsewhere), so it costs CI little time */
  { const tag = 'search', sp = await browser.newPage({ viewport: { width: 1280, height: 800 } }); sp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await sp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await sp.goto(base + 'index.html#/dive/gate');
    await sp.waitForFunction(() => { const b = document.querySelector('#diveui .seek [data-seek="diff"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#diveui .seek .seeknote b') && !!document.querySelector('#diveui .seek:not(.found)'); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': at the gate, the card does not say what to look for, or a tapped part gives nothing to notice'));
    await sp.waitForFunction(() => { const b = document.querySelector('#diveui .seek [data-seek="metal"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#diveui .seek.found') && !!document.querySelector('#diveui .askline.seeklit'); }, null, { timeout: 60000, polling: 1500 })
      .catch(() => problems.push(tag + ': at the gate, the part that leads in does not light the question'));
    await sp.evaluate(() => { location.hash = '#/place/datacentre/3'; });
    await sp.waitForFunction(() => { const b = document.querySelector('#placeui .seek [data-seek="accelerator"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#placeui .seek.found') && !!document.querySelector('#placeui .askline.seeklit'); }, null, { timeout: 120000, polling: 3000 })
      .catch(() => problems.push(tag + ': in the data centre\'s server, finding the part that does the sums does not light the question'));
    /* every level has its search (#246): at the switch, the part that turns it on and off lights the switch's question */
    await sp.evaluate(() => { location.hash = '#/dive/switch'; });
    await sp.waitForFunction(() => { const b = document.querySelector('#diveui .seek[data-seekat="switch"] [data-seek="gate"]'); if (b && !b.classList.contains('looked')) b.click(); return !!document.querySelector('#diveui .seek[data-seekat="switch"].found') && !!document.querySelector('#diveui .askline.seeklit'); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': at the switch, finding what turns it on and off does not light the question'));
    /* and in the phone's flight (#247): the names on the picture are the parts to tap, and the cable leads into the closed phone's question */
    await sp.evaluate(() => { location.hash = '#/place/phones/0'; });
    await sp.waitForFunction(() => { const n = document.querySelector('#flyLabels.seeking [data-hl="cable"]'); if (n && !document.querySelector('#flyui .seek [data-seek="cable"].looked')) n.click(); return !!document.querySelector('#flyui .seek[data-seekat="handset"].found') && !!document.querySelector('#flyui .askline.seeklit'); }, null, { timeout: 120000, polling: 3000 })
      .catch(() => problems.push(tag + ': in the phone\'s flight, tapping the cable\'s name on the picture does not find where the energy comes in'));
    await sp.evaluate(() => { location.hash = '#/log'; });
    await sp.waitForFunction(() => document.querySelectorAll('#page .seeklog .strand').length === 4, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': your log does not keep what you found'));
    /* the bar's Map: the chip world on one page, six stages across, every place and level a link, challenges as dots, the
       places you have been marked */
    await sp.waitForFunction(() => document.querySelectorAll('#page .cwmap .wm-col').length === 6 && document.querySelectorAll('#page .cwmap .wm-pl a.wm-pn[href^="#/place/"]').length >= 10 &&
      document.querySelectorAll('#page .cwmap .wm-dots a[href^="#/"]').length >= 40 && document.querySelectorAll('#page .cwmap .been').length >= 1 && document.querySelectorAll('#page .cwmap .wm-every li').length === 4, null, { timeout: 15000, polling: 500 })
      .catch(() => problems.push(tag + ': the map of the chip world does not show every stage, place and challenge, or where you have been'));
    await sp.close(); }
  /* / opens the jump box on first use, waiting for the log's page to come (#369). Pressed once: a second press would hide
     a first one that missed */
  { const tag = 'jump key', jp = await browser.newPage({ viewport: { width: 1280, height: 800 } }); jp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await jp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await jp.goto(base + 'index.html#/line/print');
    await jp.waitForFunction(() => !document.getElementById('diveui').hidden && !!document.querySelector('#diveui .dock'), null, { timeout: 60000 }).catch(() => problems.push(tag + ': the line did not open'));
    await jp.keyboard.press('/');
    await jp.waitForFunction(() => location.hash === '#/log' && !!document.activeElement && document.activeElement.matches('[data-jump]'), null, { timeout: 20000 }).catch(() => problems.push(tag + ': / does not open the jump box on first use'));
    await jp.close(); }
}
