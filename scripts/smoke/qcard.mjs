/* A core question's card (#/q/<id>, src/v2/qcard.js, #517): three cards open, each with its one question, its picture,
   its controls and measures, where it lives, why it matters and True with its source; one is dragged and its measures
   change; a slider moves it from the keyboard; It meets turns to another card; a lit level on the card lands on that
   level with the lens on, and the line at the foot of that lens card opens the card again; #/q alone is the first
   page. Desktop at night, phone by day, no sideways scrolling and no row of the thirteen */
import { S } from './shared.mjs';

export const about = 'the core question cards (#/q/<id>): three cards, a drag and a slider, It meets, a lit level landing with its lens on and the lens card leading back, #/q alone, desktop and phone';

export default async function run() {
  const { browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 820, 'dark'], [390, 844, 'light']]) {
    const tag = 'qcard ' + w, qp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
    qp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    qp.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await qp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
    /* three cards, each whole: one question, a picture drawn with its measures, the words of every band, a source */
    for (const id of ['perfect', 'nat', 'line']) {
      S.at = tag + ' #/q/' + id;
      await qp.goto(base + 'index.html#/q/' + id);
      const ok = await qp.waitForFunction(id => { const c = window.__qcard, el = document.getElementById('qcard');
        return !!c && c.state().q === id && c.state().drawn && !el.hidden && el.querySelectorAll('h1').length === 1 && el.querySelectorAll('[data-qcreads] .qc-read').length >= 2 &&
          el.querySelectorAll('.qc-why .qc-cols > div').length === 3 && !!el.querySelector('.qc-open i') && el.querySelectorAll('.qc-foot .c.on').length > 0 && !!el.querySelector('[data-qcsrc]').textContent.trim(); }, id, { timeout: 30000 }).then(() => true, () => false);
      if (!ok) { problems.push(tag + ': #/q/' + id + ' does not open its card whole (one question, a picture with its measures, where it lives, why it matters, True with its source)'); continue; }
      const bad = await qp.evaluate(() => { const el = document.getElementById('qcard'), out = [];
        if (document.documentElement.scrollWidth > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1) out.push('scrolls sideways');
        if (!document.getElementById('mapCanvas').hidden) out.push('the island is drawn behind it');
        if (el.querySelectorAll('[data-meet]').length >= 12) out.push('it shows a row of the thirteen');
        if (/\bqc\.|undefined|NaN/.test(el.textContent)) out.push('a word or a number is missing');
        return out; });
      bad.forEach(b => problems.push(tag + ': #/q/' + id + ' ' + b));
    }
    /* a drag across the picture changes it, and the measures with it; a slider from the keyboard too */
    {
      const before = await qp.evaluate(() => ({ u: window.__qcard.state().u, reads: document.querySelector('#qcard [data-qcreads]').textContent }));
      const box = await qp.locator('#qcard [data-qcpic]').boundingBox();
      if (box) { await qp.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await qp.mouse.down(); await qp.mouse.move(box.x + box.width * 0.15, box.y + box.height * 0.5, { steps: 6 }); await qp.mouse.up(); }
      await qp.waitForFunction(b => { const c = window.__qcard.state(); return c.u < b.u - 0.05 && document.querySelector('#qcard [data-qcreads]').textContent !== b.reads; }, before, { timeout: 10000 })
        .catch(() => problems.push(tag + ': a drag across the picture does not change it and its measures'));
      const u0 = await qp.evaluate(() => window.__qcard.state().u);
      await qp.waitForFunction(u0 => { const s = document.querySelector('#qcard [data-qc="h"]'); if (window.__qcard.state().u === u0 && s) { s.focus(); s.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); s.value = String(+s.value + Math.max(1, Math.round(s.max / 12))); s.dispatchEvent(new Event('input', { bubbles: true })); } return window.__qcard.state().u > u0; }, u0, { timeout: 10000 })
        .catch(() => problems.push(tag + ': the slider does not move the picture'));
    }
    /* nothing on a card moves by itself: drawn again only under the hand (thirty frames pass, and nothing is drawn) */
    {
      const moved = await qp.evaluate(() => new Promise(done => { let n0 = 0, k = 0; const f = () => { k++; if (k === 3) n0 = window.__qcard.state().frames; if (k < 33) requestAnimationFrame(f); else done(window.__qcard.state().frames - n0); }; requestAnimationFrame(f); }));
      if (moved) problems.push(tag + ': the picture moves by itself (' + moved + ' frames drawn untouched)');
    }
    /* It meets turns to another card */
    await qp.waitForFunction(() => { const go = document.querySelector('#qcard .qc-go'); if (go && location.hash === '#/q/line') go.click(); const c = window.__qcard.state(); return c.q && c.q !== 'line' && location.hash === '#/q/' + c.q; }, null, { timeout: 20000 })
      .catch(() => problems.push(tag + ': It meets does not turn to another card'));
    /* a lit level of Perfect fails lands on that level with the lens on, and the lens card leads back to the card */
    await qp.goto(base + 'index.html#/q/perfect');
    await qp.waitForFunction(() => window.__qcard && window.__qcard.state().q === 'perfect' && !!document.querySelector('#qcard .qc-foot [data-go^="#/dive/"]'), null, { timeout: 30000 }).catch(() => {});
    const go = await qp.evaluate(() => { const c = document.querySelector('#qcard .qc-foot [data-go^="#/dive/"]'); if (!c) return null; c.dispatchEvent(new MouseEvent('click', { bubbles: true })); return c.dataset.go; });
    if (!go) problems.push(tag + ': Perfect fails lights no level of the dive');
    else {
      const on = await qp.waitForFunction(() => [...document.querySelectorAll('.qlcard .qlq a[href="#/q/perfect"]')].some(a => !a.closest('[hidden]') && a.getClientRects().length), null, { timeout: 45000 }).then(() => true, () => false);
      if (!on) problems.push(tag + ': a lit level (' + go + ') does not land with the lens of Perfect fails on');
      else {
        await qp.waitForFunction(() => { const a = [...document.querySelectorAll('.qlcard .qlq a[href="#/q/perfect"]')].find(x => x.getClientRects().length); if (a && location.hash !== '#/q/perfect') a.click(); return location.hash === '#/q/perfect' && window.__qcard.state().q === 'perfect' && !document.getElementById('qcard').hidden; }, null, { timeout: 20000 })
          .catch(() => problems.push(tag + ': the question at the foot of a lens card does not open its card'));
      }
    }
    /* #/q alone is the first page */
    await qp.evaluate(() => { location.hash = '#/q'; });
    await qp.waitForFunction(() => location.hash === '#/' && document.getElementById('qcard').hidden, null, { timeout: 20000 }).catch(() => problems.push(tag + ': #/q alone does not open the first page'));
    await qp.close();
  }
}
