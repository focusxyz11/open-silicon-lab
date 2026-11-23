import { S } from './shared.mjs';

export const about = 'the data centre\'s way in and its flight into the chip; the studio walked inside, with a handoff to a bench; the phone\'s and the car\'s flights into their chips';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  const tag = 'motion';
  /* a page of its own, so its moves do not mix with the zooms counted below */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (way in): ' + e.message));
  /* the way in is on the picture (src/v2/frame.js): inside the data centre, the button over the scene goes one level
     deeper, and at the chip, scrolling on carries the flight into it */
    await page.goto(base + 'index.html#/place/datacentre/2');
  await page.waitForFunction(() => { const b = document.querySelector('#placeui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/datacentre/2') b.click(); return location.hash === '#/place/datacentre/3'; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the data centre'));
  await page.evaluate(() => { location.hash = '#/place/datacentre/5'; });
  /* every arrival the page announces is kept, so a quick one is not missed between two polls */
  await page.evaluate(() => { window.arrivals = []; new MutationObserver(() => { const a = document.documentElement.dataset.arrive; if (a) window.arrivals.push(a); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arrive'] }); });
  await page.waitForFunction(() => { const c = document.getElementById('placeCanvas'); if (c && location.hash === '#/place/datacentre/5') { c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); } return location.hash === '#/dive/chip'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': going on past the chip does not carry the flight into it'));
  /* the chip you land on is the chip you saw: the dive's chip comes down from where the flight ended (data-arrive while
     the camera moves), then rests with its names, the memory stacked beside it among them (a slow software renderer
     may then keep the flat drawing: the names are shown in 3D on the page above) */
  await page.waitForFunction(() => window.arrivals.includes('chip'), null, { timeout: 60000, polling: 500 })
    .catch(() => problems.push(tag + ': the dive\'s chip does not come down from where the flight ended'));
  await page.waitForFunction(() => !document.documentElement.dataset.arrive && !!document.querySelector('#l3-chip [data-part3="hbm"]'), null, { timeout: 60000, polling: 500 })
    .catch(() => problems.push(tag + ': the dive\'s chip does not come to rest with the memory beside it'));
    await page.close(); }
  /* one studio (#267): Go inside the studio on the island flies down through its opened floor into the room (the walk
     passes between outside and the first corner, never jumping), the way in by the job's wall of notes settles on it and
     hands over to the job's bench, and the bench's way up comes back to the same corner of the room. A page of its own */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } }), tg = 'studio';
    page.on('pageerror', e => problems.push(tg + ': ' + e.message));
    await page.goto(base + 'index.html#/place/studio');
    await page.evaluate(() => { window.walk = []; new MutationObserver(() => { const s = document.getElementById('studioui'), a = s && s.dataset.at; if (a != null && window.walk[window.walk.length - 1] !== a) window.walk.push(a); if (s && s.dataset.handoff) window.handed = s.dataset.handoff; })
      .observe(document.getElementById('studioui'), { attributes: true, attributeFilter: ['data-at', 'data-handoff'] }); });
    await page.waitForFunction(() => { if (location.hash === '#/place/studio') { const b = document.querySelector('#sheet:not([hidden]) [data-deeper]'); if (b) b.click(); }
      return location.hash === '#/place/studio/1' && !document.getElementById('studioui').hidden; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tg + ': going inside the studio on the island does not open the room'));
    await page.waitForFunction(() => document.getElementById('studioui').dataset.at === '1.0', null, { timeout: 90000, polling: 500 }).catch(() => problems.push(tg + ': the flight into the studio does not come to rest at the first corner'));
    if (!(await page.evaluate(() => window.walk.length > 2 && window.walk.some(a => +a > 0 && +a < 1)))) problems.push(tg + ': the studio is entered with a cut, not a flight down into the room (' + (await page.evaluate(() => window.walk.join(' '))) + ')');
    if (!(await page.evaluate(() => { const c = document.querySelector('#studioui .steps2 [aria-current]'), r = document.querySelector('#studioui .rail2 [aria-current]'); return !!c && c.dataset.step === 'need' && !!r && r.dataset.rail === 'chip'; }))) problems.push(tg + ': at the first corner the frame does not say the job, and the chip on the rail');
    /* the handoff: the way in stands by the screen; taken, the camera settles on it and the job's bench takes over */
    await page.waitForFunction(() => { const b = document.querySelector('#studioui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/studio/1' && !window.handed) b.click(); return location.hash === '#/bench/need' && !document.getElementById('diveui').hidden; }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tg + ': the way in at the job\'s corner does not hand over to its bench'));
    if (!(await page.evaluate(() => window.handed === 'need'))) problems.push(tg + ': the bench opened without the camera settling on the corner\'s screen first');
    await page.waitForFunction(() => { const u = document.querySelector('#diveui .homebtn'); if (u && location.hash === '#/bench/need' && u.getAttribute('href') === '#/place/studio/1') u.click(); return location.hash === '#/place/studio/1' && !document.getElementById('studioui').hidden; }, null, { timeout: 60000, polling: 2000 })
      .catch(() => problems.push(tg + ': stepping out of the bench does not return to its corner of the room'));
    await page.close(); }
  /* a phone is flown through like the data centre (src/v2/phone3d-flight.js): going inside the phone island opens the
     flight, the way in on the picture goes deeper, and going on past the chip carries the flight into the dive's phone
     chip, which comes down from where the flight ended */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (phone flight): ' + e.message));
    await page.goto(base + 'index.html#/place/phones');
    await page.waitForFunction(() => { if (location.hash === '#/place/phones') { const b = document.querySelector('.insp:not([hidden]) [data-iact="deeper"]') || document.querySelector('#sheet:not([hidden]) a[href="#/place/phones/0"]'); if (b) b.click(); }
      return location.hash === '#/place/phones/0' && !document.getElementById('flyui').hidden; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tag + ': going inside the phone island does not open its flight'));
    await page.waitForFunction(() => { const b = document.querySelector('#flyui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/phones/0') b.click(); return location.hash === '#/place/phones/1'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the phone'));
    await page.waitForFunction(() => !!document.querySelector('#flyui .seek [data-seek="battery"][data-hl="battery"]'), null, { timeout: 90000, polling: 1000 }).catch(() => problems.push(tag + ': inside the phone, the card does not name the battery among the parts to look at'));
    await page.evaluate(() => { location.hash = '#/place/phones/3'; window.arrivals = []; new MutationObserver(() => { const a = document.documentElement.dataset.arrive; if (a) window.arrivals.push(a); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arrive'] }); });
    await page.waitForFunction(() => { const c = document.getElementById('flyCanvas'); if (c && location.hash === '#/place/phones/3') { c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); } return location.hash === '#/dive/soc/phone'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': going on past the phone\'s chip does not carry the flight into it'));
    await page.waitForFunction(() => window.arrivals.includes('soc'), null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': the dive\'s phone chip does not come down from where the flight ended'));
    await page.close(); }
  /* and so is a car (src/v2/car3d-flight.js): going inside the car island opens its flight, the way in on the picture
     goes deeper (the cabin cut away, its card naming the battery), the control unit's card names its chip, and going on
     past the chip carries the flight into the dive's car chip, which comes down from where the flight ended */
  { const page = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => problems.push(tag + ' (car flight): ' + e.message));
    await page.goto(base + 'index.html#/place/cars');
    await page.waitForFunction(() => { if (location.hash === '#/place/cars') { const b = document.querySelector('.insp:not([hidden]) [data-iact="deeper"]') || document.querySelector('#sheet:not([hidden]) a[href="#/place/cars/0"]'); if (b) b.click(); }
      return location.hash === '#/place/cars/0' && !document.getElementById('carui').hidden; }, null, { timeout: 150000, polling: 3000 }).catch(() => problems.push(tag + ': going inside the car island does not open its flight'));
    await page.waitForFunction(() => { const b = document.querySelector('#carui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/place/cars/0') b.click(); return location.hash === '#/place/cars/1'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the way in on the picture does not go deeper in the car'));
    await page.waitForFunction(() => !!document.querySelector('#carui .here2 [data-hl="battery"]'), null, { timeout: 90000, polling: 1000 }).catch(() => problems.push(tag + ': inside the car, the card does not name the battery'));
    await page.waitForFunction(() => { const b = document.querySelector('#carui [data-lvgo="2"]'); if (b && location.hash === '#/place/cars/1') b.click(); return location.hash === '#/place/cars/2' && !!document.querySelector('#carui .here2 [data-hl="mcu"]'); }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': the car\'s control unit does not open with its chip named'));
    await page.evaluate(() => { location.hash = '#/place/cars/3'; window.arrivals = []; new MutationObserver(() => { const a = document.documentElement.dataset.arrive; if (a) window.arrivals.push(a); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-arrive'] }); });
    await page.waitForFunction(() => { const c = document.getElementById('carCanvas'); if (c && location.hash === '#/place/cars/3') { c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })); } return location.hash === '#/dive/mcu/car'; }, null, { timeout: 90000, polling: 3000 }).catch(() => problems.push(tag + ': going on past the car\'s chip does not carry the flight into it'));
    await page.waitForFunction(() => window.arrivals.includes('mcu'), null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': the dive\'s car chip does not come down from where the flight ended'));
    await page.close(); }
}
