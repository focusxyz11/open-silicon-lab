import { S } from './shared.mjs';

export const about = 'something to look for at a level, kept in your log';

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
    await sp.close(); }
}
