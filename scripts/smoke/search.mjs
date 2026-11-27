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
      document.querySelectorAll('#page .cwmap .wm-dots a[href^="#/"]').length >= 40 && document.querySelectorAll('#page .cwmap .been').length >= 1 && document.querySelectorAll('#page .cwmap .wm-every li').length === 4 && document.querySelectorAll('#page .wm-foot a[href^="https://github.com/focusxyz11/open-silicon-lab"]').length === 3 &&
      document.querySelector('#page .cwmap').scrollWidth <= innerWidth, null, { timeout: 15000, polling: 500 })
      .catch(() => problems.push(tag + ': the map of the chip world does not show every stage, place and challenge, or where you have been'));
    await sp.close(); }
  /* the Map's second arrangement, the lattice (#411): kinds of matter across, layers up, every cell something; what the
     lab has is linked, what is real elsewhere has its source; a path lit numbers its cells, wires them, and is in the
     address. Each move is done again inside its poll */
  { const tag = 'lattice', lp = await browser.newPage({ viewport: { width: 1280, height: 800 } }); lp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await lp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await lp.goto(base + 'index.html#/log');
    await lp.waitForFunction(() => { const a = document.querySelector('#page .cwmap .wm-arr a[href="#/log/lattice"]'); if (a && !document.querySelector('#page .lat')) a.click();
      const L = document.querySelector('#page .lat'); return !!L && location.hash === '#/log/lattice' && L.querySelectorAll('.lat-c').length === 49 && L.querySelectorAll('.lat-mh').length === 7 && L.querySelectorAll('.lat-lh').length === 7 &&
        L.querySelectorAll('.lat-ch a[href^="#/"]').length >= 60 && L.querySelectorAll('.lat-lv a[href^="#/"]').length >= 20 && L.querySelectorAll('.lat-fact a[href^="https://"]').length >= 15 &&
        L.querySelectorAll('.lat-c.k-open').length >= 10 && L.querySelectorAll('.lat-c.k-past').length >= 4; }, null, { timeout: 30000, polling: 500 })
      .catch(() => problems.push(tag + ': the Map arranged by matter and layers does not show every cell, link what the lab has, or give what is real elsewhere with its source'));
    await lp.waitForFunction(() => { const b = document.querySelector('#page .lat [data-latpath="spec"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
      const L = document.querySelector('#page .lat'); return !!L && location.hash === '#/log/lattice/spec' && L.querySelectorAll('.lat-c.lit').length === 6 && L.querySelectorAll('.lat-c.lit .lat-n').length === 6 &&
        L.querySelectorAll('.lat-wire path[marker-end]').length >= 4 && L.querySelectorAll('[data-latpath][aria-pressed="true"]').length === 1; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': lighting a path does not number its cells, wire them, or put it in the address'));
    await lp.waitForFunction(() => { const b = document.querySelector('#page .lat [data-latpath="things"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();
      const L = document.querySelector('#page .lat'); return !!L && location.hash === '#/log/lattice/things' && L.querySelectorAll('.lat-c.lit').length === 7 && L.querySelectorAll('[data-latpath][aria-pressed="true"]').length === 1; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': a second path does not take the first one\'s place'));
    await lp.close(); }
  /* on a phone the lattice is one matter at a time, chosen above it, and a lit path leads from matter to matter */
  { const tag = 'lattice on a phone', pp = await browser.newPage({ viewport: { width: 390, height: 844 } }); pp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await pp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); } catch (e) { /* no storage */ } });
    await pp.goto(base + 'index.html#/log/lattice/spec');
    await pp.waitForFunction(() => { const shown = [...document.querySelectorAll('#page .lat .lat-c')].filter(c => c.offsetParent);
      return shown.length === 7 && shown.every(c => c.dataset.m === 'silicon') && document.documentElement.scrollWidth <= innerWidth + 1; }, null, { timeout: 30000, polling: 500 })
      .catch(() => problems.push(tag + ': the lattice does not show one matter at a time, or scrolls sideways'));
    await pp.waitForFunction(() => { const b = document.querySelector('#page .lat .lat-c.lit[data-m="silicon"] .lat-to.next'); if (b) b.click();
      const shown = [...document.querySelectorAll('#page .lat .lat-c')].filter(c => c.offsetParent); return shown.length === 7 && shown.every(c => c.dataset.m === 'light') && location.hash === '#/log/lattice/spec'; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': a lit path does not lead on to its next matter'));
    await pp.close(); }
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
