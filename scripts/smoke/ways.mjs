import { S } from './shared.mjs';

export const about = 'the ways on the picture: Go inside on the island, along and in on the line, one way down through a chip (the stack is Make, along from the dive), the phone\'s peek and swipe, along round the loop keeping the level, and → at the end of the line and the studio';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* the ways on the picture (src/v2/frame.js): on the island, pointing at a building with an inside says so (a ring
     round it, Go inside over it); on the line, the next station is a button along the line (→), and a station with an
     inside has its way in (↓) with the machine ringed; each is the card's own control, mirrored */
  S.at = 'ways'; { const tag = 'ways', wp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    wp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await wp.goto(base + 'index.html#/island');
    let goSeen = false;
    for (let i = 0; i < 6 && !goSeen; i++) {
      const r = await wp.waitForFunction(() => { const e = document.querySelector('#mapLabels .place3[data-place="fab"]'); if (!e || e.style.opacity === '0') return null; const q = e.getBoundingClientRect(); return { x: q.x + q.width / 2, y: q.y + q.height / 2 }; }, null, { timeout: 30000, polling: 1000 }).then(h => h.jsonValue(), () => null);
      if (r) { await wp.mouse.move(r.x + 40, r.y + 40); await wp.mouse.move(r.x, r.y, { steps: 3 }); }
      goSeen = await wp.waitForFunction(() => { const g = document.querySelector('#mapLabels .go3'); return document.getElementById('mapCanvas').classList.contains('goin') && !!g && g.style.opacity !== '0'; }, null, { timeout: 10000, polling: 500 }).then(() => true, () => false);
    }
    if (!goSeen) problems.push(tag + ': pointing at the factory on the island does not invite you in');
    await wp.mouse.move(5, 790);
    await wp.evaluate(() => { location.hash = '#/line/print'; });
    await wp.waitForFunction(() => !!document.querySelector('#diveui .wayon:not([hidden]) .wogo') && !!document.querySelector('#diveui .wayin:not([hidden]) .wigo') && !!document.querySelector('#diveui .dock [data-in][href="#/dive/scanner/made"]'), null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at print, the line shows no way along and no way into the printing machine on the picture'));
    await wp.waitForFunction(() => !!document.querySelector('#diveui .wayin.at'), null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': at print, the way in does not stand beside the machine with a ring on it'));
    await wp.waitForFunction(() => { const b = document.querySelector('#diveui .wayon:not([hidden]) .wogo'); if (b && location.hash === '#/line/print') b.click(); return location.hash === '#/line/etch'; }, null, { timeout: 60000, polling: 3000 })
      .catch(() => problems.push(tag + ': the way along on the picture does not go to the next station'));
    await wp.waitForFunction(() => { const b = document.querySelector('#diveui .wayin:not([hidden]) .wigo'); if (b && location.hash === '#/line/etch' && /switch/.test(b.getAttribute('href') || '')) b.click(); return location.hash.startsWith('#/dive/switch'); }, null, { timeout: 60000, polling: 3000 })
      .catch(() => problems.push(tag + ': the way in on the line does not go inside what the station makes'));
    await wp.close(); }
  /* steps are along, levels are in · out (#266): on the line and in the studio the steps are one line from left to right,
     walked with → and Next; the rail at the side holds only the level a step shows, and is absent where it shows none.
     ↓ at the job goes in to the blocks as laid out. On a phone the steps are a strip with ← → and a count. Each page its own */
  for (const [vt, viewport] of [['desktop', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]]) {
    S.at = 'ways steps ' + vt; const tag = 'ways steps ' + vt, tp = await browser3d.newPage({ viewport });
    tp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await tp.goto(base + 'index.html#/line/print');
    /* where the frame says you are: the step lit, the level on the rail (if a rail is drawn), the strip on a phone */
    await tp.evaluate(() => { window.smokeSteps = () => { const c = document.querySelector('#diveui .steps2 [aria-current]'), r = document.querySelector('#diveui .rail2'), l = r && !r.hidden && r.querySelector('[aria-current]'), stl = document.querySelector('#diveui .steps2 .stl');
      return { n: document.querySelectorAll('#diveui .steps2 [data-step]').length, step: c && c.dataset.step, level: l ? l.dataset.rail : null, rail: !!r && !r.hidden,
        levels: (r ? [...r.querySelectorAll('[data-rail]')].map(b => b.dataset.rail) : []).join(','), line: !!stl && getComputedStyle(stl).display !== 'none',
        strip: (document.querySelector('#diveui .steps2 .stk') || {}).textContent || '', hash: location.hash }; }; });
    const fail = say => () => problems.push(tag + ': ' + say), wait = { timeout: 90000, polling: 1500 };
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.n === 11 && h.step === 'print' && h.level === 'gate' && h.levels === 'chip,block,gate,switch,atom'; }, null, wait)
      .catch(fail('the line does not show its eleven steps with print lit, and the gate on a rail of levels only'));
    if (vt === 'phone') await tp.waitForFunction(() => { const h = window.smokeSteps(); return !h.line && /5/.test(h.strip) && /11/.test(h.strip); }, null, wait).catch(fail('on a phone the steps are not a strip with a count'));
    else await tp.waitForFunction(() => window.smokeSteps().line, null, wait).catch(fail('on a desktop the steps are not drawn as a line'));
    /* → walks along to the next step, and the rail follows to the switch */
    await tp.waitForFunction(() => { if (location.hash === '#/line/print') { const c = document.getElementById('diveCanvas'); c.focus(); c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); }
      const h = window.smokeSteps(); return h.step === 'etch' && h.level === 'switch' && h.hash === '#/line/etch'; }, null, wait).catch(fail('→ does not walk the line to etching, with the switch on the rail'));
    /* a step that shows no level has no rail */
    await tp.evaluate(() => { location.hash = '#/line/test'; });
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.step === 'test' && !h.rail; }, null, wait).catch(fail('at the test step, which shows no level, a rail of levels is still drawn'));
    /* the studio: the same line of steps; check shows no level; Next walks along to the gates */
    await tp.evaluate(() => { location.hash = '#/bench/check'; });
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.n === 6 && h.step === 'check' && !h.rail; }, null, wait).catch(fail('the studio does not show its six steps with check lit and no rail'));
    await tp.waitForFunction(() => { const b = document.querySelector('#diveui .dock [data-along][data-key="next"]'); if (b && location.hash === '#/bench/check') b.click();
      const h = window.smokeSteps(); return h.step === 'gates' && h.level === 'gate' && h.levels === 'chip,block,gate'; }, null, wait).catch(fail('Next in the studio does not walk along to the gates, with the gate on the rail'));
    /* ↓ at the job goes in, to the blocks as laid out */
    await tp.evaluate(() => { location.hash = '#/bench/need'; });
    await tp.waitForFunction(() => { const h = window.smokeSteps(); return h.step === 'need' && h.level === 'chip'; }, null, wait).catch(fail('the job does not show the chip on the rail'));
    await tp.waitForFunction(() => { if (location.hash === '#/bench/need' && document.querySelector('#diveui .dock [data-in]')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const h = window.smokeSteps(); return h.step === 'layout' && h.level === 'block'; }, null, wait).catch(fail('↓ at the job does not go in to the blocks as laid out'));
    if (vt === 'desktop' && (await tp.evaluate(() => document.documentElement.scrollWidth - innerWidth)) > 0) problems.push(tag + ': the page scrolls sideways');
    await tp.close();
  }
  /* one way down through a chip (#230): the dive is the way down; the stack is the same level as made, reached along
     the loop (Make in the bar, underlined beforehand), with the address and the bar saying Make, and along back
     returns to the dive at the same level. Neither card offers a second way down, and an old address of the stack
     is the same place. A page of its own, as it moves between views */
  S.at = 'ways stack'; { const tag = 'ways stack', sp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } });
    sp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await sp.goto(base + 'index.html#/dive/gate');
    const ways = ui => [...document.querySelectorAll(ui + ' .dock [data-in], ' + ui + ' .wayin:not([hidden]) .wigo')].map(e => e.getAttribute('href') || 'row ' + e.dataset.rowgo);
    await sp.waitForFunction(() => location.hash === '#/dive/gate' && !!document.querySelector('#loop [data-stage="make"].holds') && !!document.querySelector('#diveui .rail2 [aria-current][data-rail="gate"]'), null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': at the dive\'s gate, the bar does not underline Make'));
    if ((await sp.evaluate(ways, '#diveui')).some(h => /^#\/chip\//.test(h))) problems.push(tag + ': the dive offers the stack as a way down');
    await sp.waitForFunction(() => { if (location.hash === '#/dive/gate') { const b = document.querySelector('#loop [data-stage="make"]'); if (b) b.click(); }
      const c = document.querySelector('#chipui .rail2 [aria-current]'), s = document.querySelector('#loop [aria-current]');
      return location.hash === '#/chip/2/build' && !document.getElementById('chipui').hidden && !!c && c.dataset.rail === 'gate' && !!s && s.dataset.stage === 'make' && /Print/.test(document.querySelector('#chipui .dock').textContent); }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': along to Make from the dive\'s gate does not land on the gate as made, with the address and the bar saying Make'));
    /* the stack's only way down is its own next level; no flat dive beside it */
    const inStack = await sp.evaluate(ways, '#chipui');
    if (!inStack.length || inStack.some(h => !/^row /.test(h))) problems.push(tag + ': the gate as made offers another way down: ' + inStack.join(', '));
    if (/flat dive/i.test(await sp.textContent('#chipui').catch(() => ''))) problems.push(tag + ': the stack still offers the flat dive');
    if (!(await sp.$('#loop [data-stage="use"].holds'))) problems.push(tag + ': in the stack, the bar does not underline Use');
    await sp.waitForFunction(() => { if (location.hash === '#/chip/2/build') { const b = document.querySelector('#loop [data-stage="use"]'); if (b) b.click(); }
      const c = document.querySelector('#diveui .rail2 [aria-current]'), s = document.querySelector('#loop [aria-current]');
      return location.hash === '#/dive/gate' && !document.getElementById('diveui').hidden && !!c && c.dataset.rail === 'gate' && !!s && s.dataset.stage === 'use'; }, null, { timeout: 90000, polling: 2000 })
      .catch(() => problems.push(tag + ': along back to Use from the gate as made does not return to the dive\'s gate'));
    /* an old address of the stack still opens it, and the address then says where you are */
    await sp.evaluate(() => { location.hash = '#/chip/1'; });
    await sp.waitForFunction(() => location.hash === '#/chip/1/build' && !!document.querySelector('#chipui .rail2 [aria-current][data-rail="block"]') && ((document.querySelector('#loop [aria-current]') || {}).dataset || {}).stage === 'make', null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': an old address of the stack does not open the block as made, saying Make'));
    await sp.close(); }
  /* along keeps the level round the loop (#368): → from the dive's gate (Use) wraps round to the Lab (Open), where there
     is no gate, and says what comes next (the bar underlines Design, the card offers the gate as designed); the next →
     picks the gate up again in the studio. And → at the end of the line and of the studio goes where Next says */
  S.at = 'ways round'; { const tag = 'ways round', rp = await browser3d.newPage({ viewport: { width: 1280, height: 800 } }), wait = { timeout: 90000, polling: 2000 };
    rp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await rp.goto(base + 'index.html#/dive/gate');
    await rp.waitForFunction(() => { if (location.hash === '#/dive/gate' && document.querySelector('#diveui .rail2 [aria-current][data-rail="gate"]')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      return location.hash === '#/place/lab' && !!document.querySelector('#loop [data-stage="design"].holds') && !!document.querySelector('#sheet:not([hidden]) .around [data-key="next"][href="#/bench/gates"]'); }, null, wait)
      .catch(() => problems.push(tag + ': → from the dive\'s gate does not wrap round to the Lab with the gate as designed offered next'));
    await rp.waitForFunction(() => { if (location.hash === '#/place/lab' && document.querySelector('#sheet:not([hidden]) .around [data-key="next"]')) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      return location.hash === '#/bench/gates'; }, null, wait)
      .catch(() => problems.push(tag + ': → → from the dive\'s gate does not reach the gates as designed (#/bench/gates)'));
    for (const [from, to] of [['#/line/ship', '#/place/port'], ['#/bench/masks', '#/line/print']]) {
      await rp.evaluate(h => { location.hash = h; }, from);
      await rp.waitForFunction(([f, d]) => { const a = document.querySelector('#diveui .dock [data-key="next"]'); if (location.hash === f && a && a.getAttribute('href') === d) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        return location.hash === d; }, [from, to], wait)
        .catch(() => problems.push(tag + ': → at the end of ' + from + ' does not go where Next says, ' + to));
    }
    await rp.close(); }
  /* the dive on a phone: the card rests as a peek, opens when touched and steps aside when the picture is touched; a
     swipe up on the picture goes one level in */
  S.at = 'ways phone'; { const tag = 'ways phone', pp = await browser3d.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    pp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await pp.goto(base + 'index.html#/dive/chip');
    /* at rest the peek shows the level's name (the caption's head, src/v2/frame2.js) */
    await pp.waitForSelector('#diveui .dockwrap.peek .dock .f2head .f2t', { timeout: 90000 }).catch(() => problems.push(tag + ': the dive\'s card does not rest as a peek on a phone'));
    await pp.waitForFunction(() => { const w = document.querySelector('#diveui .dockwrap'); if (w && w.classList.contains('peek')) w.click(); return !!w && !w.classList.contains('peek'); }, null, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': touching the peek does not open the card'));
    /* on the picture, above the open card (a level with a search has a taller card) */
    { const y = await pp.evaluate(() => Math.min(300, Math.round(document.querySelector('#diveui .dockwrap').getBoundingClientRect().top) - 60)), c = await pp.context().newCDPSession(pp);
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y }] }); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach(); }
    await pp.waitForSelector('#diveui .dockwrap.peek', { timeout: 15000 }).catch(() => problems.push(tag + ': touching the picture does not let the card down'));
    const swipe = async () => { const c = await pp.context().newCDPSession(pp);
      await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 420 }] });
      for (let i = 1; i <= 5; i++) await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 420 - i * 30 }] });
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach(); };
    let deeper = false;
    for (let i = 0; i < 4 && !deeper; i++) { await swipe(); deeper = await pp.waitForFunction(() => location.hash === '#/dive/block', null, { timeout: 15000, polling: 500 }).then(() => true, () => false); }
    if (!deeper) problems.push(tag + ': a swipe up on the picture does not go a level in');
    await pp.close(); }
}
