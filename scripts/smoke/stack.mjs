/* Your stack (#/stack, src/v2/stack/view.js; docs/PATH.md step 4): your computer from the atom to the mind, seven plates
   on the dive's levels, each made of the one below (the lab's carry, src/engines/path.js), standing on its plot in the
   field of every recipe. Its checks for the lab: it opens on the lab's example, a rung opens by its address, the wreck
   (graphene, or the voltage taken down) breaks what is above, a gene changed rebuilds the anatomy, time grows it, the
   agents propose forks and sweep the field, the camera reaches the niche and every attempt and comes back, the DOM
   mirror carries the keyboard, and leaving hides it. Desktop at night, phone by day */
import { S } from './shared.mjs';

export const about = 'Your stack (#/stack): seven plates from the atom to the mind, a rung by its address, the wreck, a gene, growth, the agents, the field and back, the keyboard mirror, desktop and phone';

export default async function run() {
  const { browser3d, base, problems } = S;
  for (const [w, h, scheme] of [[1280, 820, 'dark'], [390, 844, 'light']]) {
    const tag = 'stack ' + w, sp = await browser3d.newPage({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: 'reduce' });
    sp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    sp.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|WebGL|GPU/.test(m.text())) problems.push(tag + ': console: ' + m.text()); });
    await sp.addInitScript(() => { try { localStorage.setItem('osl-quality', 'keep'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); localStorage.removeItem('osl-stack'); localStorage.removeItem('osl-lang'); } catch (e) { /* no storage */ } });
    await sp.goto(base + 'index.html#/stack');
    /* it opens on the lab's example: today's computer, seven plates, the island not drawn behind it */
    const opened = await sp.waitForFunction(() => { const v = window.__stack, el = document.getElementById('stackv'); return !!v && !!el && !el.hidden && v.view.level === 'stack' && !v.busy() && v.plates().length === 7 && v.carry().R.recipe.carrier === 'charge'; }, null, { timeout: 60000 }).then(() => true, () => false);
    if (!opened) { problems.push(tag + ': #/stack does not open your stack of seven plates on the lab\'s example'); await sp.close(); continue; }
    if (await sp.evaluate(() => !document.getElementById('mapCanvas').hidden)) problems.push(tag + ': the island is drawn behind the stack');
    if (!(await sp.evaluate(() => document.querySelectorAll('#stackv .sk-sr [data-rung]').length === 7 && document.querySelectorAll('#stackv .sk-sr [data-pop]').length === 5 && !!document.querySelector('#stackv .sk-sr .sk-plot'))))
      problems.push(tag + ': the DOM mirror does not hold every rung, every gene and the need, and the plots of the field');
    if (await sp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(tag + ': the stack scrolls sideways');
    /* a rung by its address, the controls under it */
    await sp.evaluate(() => { location.hash = '#/stack/switch'; });
    await sp.waitForFunction(() => { const v = window.__stack; return v.view.level === 'rung' && v.view.i === 1 && !!document.querySelector('#stackv .sk-ctl:not([hidden]) [data-k="mat"], #stackv .sk-ctl:not([hidden]) #sk-volt'); }, null, { timeout: 20000 })
      .catch(() => problems.push(tag + ': #/stack/switch does not open the switch with its controls'));
    /* the wreck: graphene never turns off, so nothing above the switch can be built */
    await sp.waitForFunction(() => { const v = window.__stack; if (v.view.i !== 0) { const b = document.querySelector('#stackv .sk-sr [data-rung="0"]'); if (b) b.click(); return false; }
      const g = document.querySelector('#stackv .sk-ctl [data-k="mat"][data-v="graphene"]'); if (g && g.getAttribute('aria-pressed') !== 'true') g.click();
      const R = v.carry().R; return R.broken === 'switch' && ['gate', 'block', 'chip', 'machine', 'mind'].every(r => R.rungs[r].broken) && /^#\/stack\/atom$/.test(location.hash); }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': graphene on the atom does not break every rung above the switch'));
    if (!(await sp.evaluate(() => /cannot be built/.test((document.querySelector('#stackv .sk-sr [data-rung="6"]') || {}).getAttribute?.('aria-label') || ''))))
      problems.push(tag + ': the mirror does not say the mind cannot be built after the wreck');
    /* mended, then the voltage taken down: copies go wrong at the gate and the mind forgets */
    await sp.waitForFunction(() => { const v = window.__stack, si = document.querySelector('#stackv .sk-ctl [data-k="mat"][data-v="si"]'); if (si && si.getAttribute('aria-pressed') !== 'true') si.click();
      if (!v.carry().R.broken && v.carry().R.fine.V > 0.26) v.setFine('V', 0.25); const R = v.carry().R; return !R.broken && R.rungs.gate.hands.fail > 1e-6 && R.rungs.mind.hands.right < 0.5; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': a low voltage does not make the gate\'s copies go wrong and the mind forget'));
    await sp.evaluate(() => window.__stack.setFine('V', 0.7));
    /* a gene changed rebuilds the anatomy: light instead of charge forks the atom, the switch and the gate */
    await sp.waitForFunction(() => { const v = window.__stack, pop = document.querySelector('#stackv .sk-pop:not([hidden]) [data-opt="light"]');
      if (v.carry().R.recipe.carrier !== 'light') { if (pop) pop.click(); else { const b = document.querySelector('#stackv .sk-sr [data-pop="carrier"]'); if (b) b.click(); } return false; }
      const R = v.carry().R; return ['atom', 'switch', 'gate'].every(r => R.rungs[r].fork) && R.rungs.gate.fid.status === 'guess' && /glass that guides light/.test(document.querySelector('#stackv .sk-sr [data-rung="0"]').getAttribute('aria-label')); }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': changing what carries a value to light does not rebuild the atom, the switch and the gate as a guess'));
    /* time: a year, then five */
    await sp.waitForFunction(() => { const v = window.__stack, y = v.S.A.year; if (y === 0) { const b = document.querySelector('#stackv .sk-dock .sk-grow1'); if (b && !b.disabled) b.click(); } return v.S.A.year >= 1; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': Grow a year does not grow the new recipe'));
    await sp.waitForFunction(() => { const v = window.__stack; if (v.S.A.year < 6) { if (innerWidth < 760 && !document.getElementById('stackv').classList.contains('more')) { const m = document.querySelector('#stackv .sk-more'); if (m) m.click(); } const b = document.querySelector('#stackv .sk-dock .sk-grow5'); if (b && !b.disabled && v.S.A.year === 1) b.click(); } return v.S.A.year >= 6; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': Five years does not grow it five years'));
    /* the agents propose forks; one taken */
    await sp.waitForFunction(() => { const v = window.__stack, p = document.querySelector('#stackv .sk-cards:not([hidden]) [data-fork="0"]'); if (!p) { const b = document.querySelector('#stackv .sk-dock .sk-ask'); if (b && !b.disabled) b.click(); return false; } return true; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': asking the agents shows no forks'));
    const before = await sp.evaluate(() => JSON.stringify(window.__stack.carry().R.recipe));
    await sp.waitForFunction(b => { const p = document.querySelector('#stackv .sk-cards:not([hidden]) [data-fork="0"]'); if (p) p.click(); return JSON.stringify(window.__stack.carry().R.recipe) !== b; }, before, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': an agent\'s fork taken does not change the recipe'));
    /* the field: out to its niche and every attempt, the agents' sweep, the address, then back */
    await sp.waitForFunction(() => { const v = window.__stack; if (!v.busy() && v.view.level !== 'field') { const b = document.querySelector('#stackv .sk-rail [data-go="field"]'); if (b) b.click(); } return v.view.level === 'field' && !v.busy() && location.hash === '#/stack/field' && document.querySelector('#stackv .sk-rail [data-go="field"]').classList.contains('on'); }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': zooming out does not reach every attempt (#/stack/field)'));
    await sp.waitForFunction(() => { const v = window.__stack, el = document.querySelector('#stackv .sk-say'); if (!/Agents grew/.test(el.textContent)) { const b = document.querySelector('#stackv .sk-explore'); if (innerWidth < 760 && !document.getElementById('stackv').classList.contains('more')) document.querySelector('#stackv .sk-more').click(); if (b && !v.busy()) b.click(); return false; } return true; }, null, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': sending agents exploring does not sweep the field'));
    await sp.waitForFunction(() => { const v = window.__stack; if (!v.busy() && v.view.level === 'field') { const b = document.querySelector('#stackv .sk-rail [data-go="niche"]'); if (b && !b.classList.contains('on')) b.click(); } return document.querySelector('#stackv .sk-rail [data-go="niche"]').classList.contains('on'); }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': the rail does not reach your niche'));
    await sp.waitForFunction(() => { const v = window.__stack; if (!v.busy() && v.view.level !== 'stack') { const b = document.querySelector('#stackv .sk-rail [data-go="stack"]'); if (b) b.click(); } return v.view.level === 'stack' && !v.busy() && location.hash === '#/stack'; }, null, { timeout: 20000, polling: 500 })
      .catch(() => problems.push(tag + ': the rail does not bring the camera back to your stack (#/stack)'));
    /* the keyboard: the mirror's plots move under the arrows and Enter opens one */
    await sp.evaluate(() => { window.__stack.goField(); });
    await sp.waitForFunction(() => !window.__stack.busy() && window.__stack.view.level === 'field', null, { timeout: 20000 }).catch(() => {});
    const l0 = await sp.evaluate(() => { const b = document.querySelector('#stackv .sk-plot'); b.focus(); return b.getAttribute('aria-label'); });
    await sp.keyboard.press('ArrowRight');
    await sp.waitForFunction(l0 => { const b = document.querySelector('#stackv .sk-plot'); return !!b && document.activeElement === b && b.getAttribute('aria-label') !== l0; }, l0, { timeout: 10000 })
      .catch(() => problems.push(tag + ': the arrows do not move between the plots of the field'));
    await sp.keyboard.press('ArrowLeft'); await sp.keyboard.press('Enter');
    await sp.waitForFunction(() => window.__stack.view.level === 'stack', null, { timeout: 20000 })
      .catch(() => problems.push(tag + ': Enter on a plot does not open its stack'));
    /* leaving: the address moves on, and the stack is hidden */
    await sp.evaluate(() => { location.hash = '#/island'; });
    await sp.waitForFunction(() => document.getElementById('stackv').hidden && !document.getElementById('mapCanvas').hidden, null, { timeout: 60000 })
      .catch(() => problems.push(tag + ': leaving for the island does not hide the stack'));
    await sp.close();
  }
}
