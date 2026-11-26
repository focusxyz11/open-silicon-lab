/* the labs section's check of the lab arch (src/data/labs/arch.js): its challenges played to their win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* grow an architecture nobody has built: compute in the memory, laid out once as a graph, in stacked layers; put
     attempts into people for the first ten years, then into what the engine suggests (the directions marked
     data-ar-best), five years at a time. Each poll picks what is still missing and plays on from where a redraw left it */
  const MOVES = id => "const P = '.player[data-ch=\"" + id + "\"] ', q = s => document.querySelector(P + s), pick = (k, v) => { const b = q('[data-ar-gene=\"' + k + '\"][data-ar-opt=\"' + v + '\"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };"
    + " pick('where', 'in'); pick('told', 'graph'); pick('shape', 'stack');"
    + " const y = +((q('[data-ar-yearnow]') || {}).dataset || {}).arYearnow || 0, want = (y < 10 ? ['people'] : []).concat([1, 2].map(i => (q('[data-ar-best=\"' + i + '\"]') || {}).dataset).filter(Boolean).map(d => d.arDir)).slice(0, 2);"
    + " for (const d of ['device', 'memory', 'tools', 'errors', 'making', 'people']) { const b = q('[data-ar-dir=\"' + d + '\"]'); if (b && b.getAttribute('aria-pressed') === 'true' && !want.includes(d)) b.click(); }"
    + " for (const d of want) { const b = q('[data-ar-dir=\"' + d + '\"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }"
    + " if (q('[data-argoal=\"years\"].bad')) CL(P + '[data-ar-reset]'); else CL(P + '[data-ar-year=\"5\"]');";
  await playLab('archniche', MOVES('archniche'), 'An architecture nobody has built');
  await playLab('archspread', MOVES('archspread'), 'From one need to three');
  /* the agents wait for your first year (think first), then propose forks that keep the recipe new */
  await fp.waitForFunction(() => { const P = '.player[data-ch="archspread"] '; if (!document.querySelector(P)) return false;
    const ask = document.querySelector(P + '[data-ar-ask]'); if (ask) ask.click();
    return document.querySelectorAll(P + '[data-ar-fork]').length >= 1; }, null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': the agents propose no fork after the first year'));
  /* the map holds all 400 recipes, the built ones marked */
  await fp.waitForFunction(() => { const P = '.player[data-ch="archspread"] '; return document.querySelectorAll(P + '.armap [data-ar-pick]').length === 400 && document.querySelectorAll(P + '.armap .sq.k-product').length >= 5; }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': the map of recipes is not whole'));
  /* an attempt kept in the community's ledger (#410): signed, it is checked by the ledger (grown again there, so the
     history the lab records must replay to the same wins, stepping stones and all) and becomes your draft with its slip;
     the map shows the ledger's attempts, people's and agents' apart, and the first to win each need */
  await fp.waitForFunction(() => { const P = '.player[data-ch="archspread"] ', q = s => document.querySelector(P + s); if (!document.querySelector(P)) return false;
    if (q('.arkept .slip')) return true;
    const n = q('.arkeep [data-sign]'); if (n && !n.value) n.value = 'Smoke';
    const b = q('[data-ar-keep]'); if (b) b.click(); return false; }, null, { timeout: 30000, polling: 1000 })
    .catch(async () => problems.push(tag + ': an attempt cannot be kept in the ledger: ' + await fp.evaluate(() => (document.querySelector('.player[data-ch="archspread"] .arkeep .bad') || {}).textContent || 'no keep')));
  await fp.waitForFunction(() => { const P = '.player[data-ch="archspread"] ';
    return document.querySelectorAll(P + '.armap [data-ar-lg]').length >= 3 && document.querySelectorAll(P + '.armap .armarks [data-ar-first]').length >= 2 && document.querySelectorAll(P + '.armap .armarks .ld.a').length >= 1 && document.querySelectorAll(P + '.arfirsts .arwon').length >= 2; }, null, { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': the map does not show the ledger\'s attempts and the first to win each need'));
  /* each direction leads into the lab where it is improved, and a challenge won there comes back as a stepping stone,
     shown on its card (#408): Six flaky parts won, the errors' card says what it brought */
  { await fp.evaluate(() => { const k = 'osl-world-v1', s = JSON.parse(localStorage.getItem(k) || '{}'); s.done = Object.assign(s.done || {}, { flaky: true }); s.seen = true; localStorage.setItem(k, JSON.stringify(s)); });
    await fp.goto(adr('#/do/archniche')); await fp.reload();
    await fp.waitForFunction(() => { const P = '.player[data-ch="archniche"] ';
      return document.querySelectorAll(P + '[data-ar-card] a[href^="#/do/"], ' + P + '[data-ar-card] a[href="#/build"]').length === 6 && !!document.querySelector(P + '[data-ar-card="errors"] [data-ar-stone="flaky"]'); }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': a direction card does not lead into its lab, or a won stepping stone does not show on its card')); }
  /* the family tree (#409): a new recipe grown a year and forked twice is three nodes, the curve draws its attempts,
     and a node tapped starts again from it, a fourth node */
  { const ok = await fp.waitForFunction(() => { const P = '.player[data-ch="archniche"] ', q = s => document.querySelector(P + s), CL = s => { const b = q(s); if (b) b.click(); };
      const n = () => document.querySelectorAll(P + '.artfig [data-ar-node]').length;
      if (n() >= 3) return true;
      const pick = (k, v) => { const b = q('[data-ar-gene="' + k + '"][data-ar-opt="' + v + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };
      if (!n() || q('[data-ar-yearnow="0"]')) { pick('where', 'in'); pick('told', 'graph'); pick('shape', 'stack'); const d = q('[data-ar-dir="people"]'); if (d && d.getAttribute('aria-pressed') !== 'true') d.click(); CL('[data-ar-year="1"]'); return false; }
      if (n() === 1) pick('shape', 'grid'); else pick('carrier', 'light');
      return n() >= 3; }, null, { timeout: 30000, polling: 1000 }).then(() => true, () => false);
    if (!ok) problems.push(tag + ': two forks do not make a family tree of three');
    await fp.waitForFunction(() => !!document.querySelector('.player[data-ch="archniche"] .arcurve svg .cv'), null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': the curve of attempts is not drawn after a year'));
    await fp.waitForFunction(() => { const P = '.player[data-ch="archniche"] ', nodes = document.querySelectorAll(P + '.artfig [data-ar-node]');
      if (nodes.length >= 4) return !!document.querySelector(P + '.artfig [data-ar-node="3"].cur');
      const n0 = document.querySelector(P + '.artfig [data-ar-node="0"]'); if (n0) n0.dispatchEvent(new MouseEvent('click', { bubbles: true })); return false; }, null, { timeout: 20000, polling: 1000 })
      .catch(() => problems.push(tag + ': a node of the family tree does not start again from it')); }
  /* the map by keyboard alone (#409): the current square is in the tab order, an arrow moves to the next, Enter starts there */
  await fp.waitForFunction(() => { const P = '.player[data-ch="archniche"] ', cur = document.querySelector(P + '.armap .sq.cur'); if (!cur) return false;
    if (cur.getAttribute('tabindex') !== '0') return false;
    if (!window.__arWant) { const c = +cur.dataset.arC + (+cur.dataset.arC < 19 ? 1 : -1), r = cur.dataset.arR, to = document.querySelector(P + '.armap [data-ar-c="' + c + '"][data-ar-r="' + r + '"]'); window.__arWant = to && to.dataset.arPick; window.__arKey = +cur.dataset.arC < 19 ? 'ArrowRight' : 'ArrowLeft'; }
    if (cur.dataset.arPick === window.__arWant) return true;
    cur.focus(); cur.dispatchEvent(new KeyboardEvent('keydown', { key: window.__arKey, bubbles: true, cancelable: true }));
    const f = document.activeElement; if (f && f.dataset && f.dataset.arPick === window.__arWant) f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    return false; }, null, { timeout: 20000, polling: 1000 }).catch(() => problems.push(tag + ': the map of recipes cannot be used with the keyboard'));
  /* the race's bars move to where a new recipe stands, and stand still under reduced motion (#409) */
  { const dur = () => fp.waitForFunction(() => { const b = document.querySelector('.player[data-ch="archniche"] .arrace .bar'); return b ? { d: parseFloat(getComputedStyle(b).transitionDuration) } : false; }, null, { timeout: 10000, polling: 500 }).then(h => h.jsonValue(), () => ({ d: null })).then(r => r.d);
    if (!(await dur() > 0)) problems.push(tag + ': the race\'s bars do not move to a new recipe');
    await fp.emulateMedia({ reducedMotion: 'reduce' });
    if (await dur() !== 0) problems.push(tag + ': the race\'s bars still move under reduced motion');
    await fp.emulateMedia({ reducedMotion: null }); }
};
