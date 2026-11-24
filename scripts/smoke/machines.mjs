import { S } from './shared.mjs';

export const about = 'machines from shared blocks, a place: the machine drawn as a block diagram that changes with a form, the agent\'s offers on the front and a pick used, where it is made, liquid hardware keeping up with a radio, the lab\'s curve and an attempt kept, new matter\'s claims and the guesses switch, a block made of your switch, two challenges won in Do, a kind of new matter leading into its lab, desktop and phone';

export default async function run() {
  const { browser, browser3d, base, problems } = S;
  /* machines from shared blocks (#/machines, src/v2/machines.js): a place of its own (#320), a fresh visitor. The machine
     is a block diagram on the stage; its layers (made in, reshaping, how sure, attempts) are opened from it */
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    const tag = 'machines ' + w, fp = await browser.newPage({ viewport: { width: w, height: h } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await fp.goto(base + 'index.html#/machines/hearing');
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mpart').length === 4 && !!document.querySelector('.mach .mchecks li.bad'), null, { timeout: 60000, polling: 500 }).catch(() => problems.push(tag + ': the hearing aid does not start as circuits that miss its need'));
    /* the machine is drawn: every block on the stage with its wires, the filter a circuit */
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mstage .mpic .mbk').length === 4 && document.querySelectorAll('.mach .mwires .mw').length === 4 && !!document.querySelector('.mach .mbk[data-mpart="filter"].f-circuit .mbks .body'), null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the machine is not drawn as a block diagram'));
    /* the core block leads into the core, at work on this machine's job (#321) */
    await fp.waitForFunction(() => !!document.querySelector('a.mcoreway[href="#/do/rvrun/hearing"]'), null, { timeout: 15000, polling: 500 }).catch(() => problems.push(tag + ': the core block does not lead into the core'));
    /* the filter made software: the machine meets its need, and the diagram changes with the form */
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="filter:software"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!b && !document.querySelector('.mach .mchecks li.bad'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': a filter made software does not meet the need'));
    await fp.waitForFunction(() => !!document.querySelector('.mach .mbk[data-mpart="filter"].f-software') && !document.querySelector('.mach .mbk[data-mpart="filter"].f-circuit') && !!document.querySelector('.mach .mwires .mrun'), null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the filter made software does not change on the diagram (nor run on the core)'));
    /* the agent offers a real choice, its offers stand on the front with your machine, and a pick is used */
    await fp.waitForFunction(() => { const a = document.querySelector('[data-magent]'); if (a) a.click(); return document.querySelectorAll('.mach .mpick').length >= 2; }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the agent does not offer a choice'));
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mfront .mfo').length >= 2 && !!document.querySelector('.mach .mfront .lpline0') && !!document.querySelector('.mach .mfront .lpnobody') && !!document.querySelector('.mach .mfront .lpdot'), null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the front does not draw the agent\'s offers, today\'s compromises, nobody\'s corner and your machine'));
    await fp.waitForFunction(() => { const u = document.querySelector('.mpick [data-muse="0"]'); if (u) u.click(); return !!document.querySelector('.mach .mpick.on'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': a pick is not put to use'));
    /* fab on a desk, a layer of the machine: memory that computes is made only in a giant fab; on a desk the grammar
       breaks, back in the giant fab it holds, and a try there takes months */
    await fp.waitForFunction(() => { const L = document.querySelector('[data-mlayer="made"]'); if (L && L.getAttribute('aria-pressed') !== 'true') L.click(); const b = document.querySelector('[data-mform="filter:matter:cim"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); const d = document.querySelector('[data-mfab="desk"]'); if (d && d.getAttribute('aria-pressed') !== 'true') d.click(); return !!document.querySelector('.mach .mchecks li.bad') && location.hash === '#/machines/hearing/made' && !!document.querySelector('.mach .mbk[data-mpart="filter"].bad'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': a fab on a desk does not refuse memory that computes'));
    await fp.waitForFunction(() => { const g = document.querySelector('[data-mfab="giant"]'); if (g && g.getAttribute('aria-pressed') !== 'true') g.click(); return !document.querySelector('.mach .mchecks li.bad') && /126/.test([...document.querySelectorAll('.mach .mread b')].map(b => b.textContent).join(' ')); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the giant fab does not show months a try'));
    /* Moore's law for ideas, a layer: the lab's curve draws the attempts kept, the best so far, and where yours would land; kept, yours joins it */
    await fp.waitForFunction(() => { const L = document.querySelector('[data-mlayer="tries"]'); if (L && L.getAttribute('aria-pressed') !== 'true') L.click(); return document.querySelectorAll('.mach .mcurve .dot:not(.you)').length >= 4 && !!document.querySelector('.mach .mcurve .best') && !!document.querySelector('.mach .mcurve .dot.you'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the lab\'s curve does not draw'));
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="filter:matter:living"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); const n = document.querySelector('.mach .mkeep [data-sign]'); if (n && !n.value) n.value = 'Smoke'; const k = document.querySelector('[data-mkeep]'); if (k && !document.querySelector('.mach .mkeep .slip')) k.click(); return !!document.querySelector('.mach .mkeep .slip') && !!document.querySelector('.mach .mcurve .dot.mine'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': an attempt is not kept on the curve'));
    /* beyond today's chip, the layer of how sure: a part made of living neurons shows its claims, guesses labelled, a
       range, and its mark on the picture */
    await fp.evaluate(() => { location.hash = '#/machines/wildfire'; });
    await fp.waitForFunction(() => { const L = document.querySelector('[data-mlayer="claims"]'); if (L && L.getAttribute('aria-pressed') !== 'true') L.click(); const b = document.querySelector('[data-mform="detect:matter:living"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b) { const m = document.querySelector('[data-mform^="detect:matter"]'); if (m) m.click(); } return document.querySelectorAll('.mach .mclaims .mst.s-guess').length >= 2 && /–/.test((document.querySelector('.mach .mread b') || {}).textContent || '') && !!document.querySelector('.mach .mbk[data-mpart="detect"].f-matter .mbkt .t-guess'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': new matter does not show its claims, its range and its mark on the picture'));
    /* a kind of new matter a lab models opens its lab (#323): the parity check made reversible leads into the reversible
       adder; the learner, chosen, leads into the dataflow lab. The check is a circuit again after */
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="check:matter:reversible"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); const d = document.querySelector('.mach .mbk[data-mpart="detect"]'); if (d && d.getAttribute('aria-pressed') !== 'true') d.click();
      return !!document.querySelector('.mach a.mlabway[href="#/do/reversible"]') && !!document.querySelector('.mach a.mway[href="#/do/dataflow"]'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': reversible matter does not open its lab, or the learner the dataflow lab'));
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="check:circuit"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!b && b.getAttribute('aria-pressed') === 'true'; }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the parity check is not a circuit again'));
    /* the agent told to count guesses */
    await fp.waitForFunction(() => { const g = document.querySelector('[data-mguess]'); if (g && !g.checked) g.click(); const a = document.querySelector('[data-magent]'); if (a) a.click(); return !!g && g.checked && document.querySelectorAll('.mach .mpick').length >= 2; }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the agent cannot be told to count guesses'));
    /* liquid hardware, the layer of reshaping: a radio whose job changes every 100 ns; an FPGA rewires too slowly, an
       array rewired every tick keeps up, and the map draws the line the parts must beat */
    await fp.evaluate(() => { location.hash = '#/machines/radio'; });
    await fp.waitForFunction(() => { const pick = s => { const b = document.querySelector('[data-mform="' + s + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); };
      const L = document.querySelector('[data-mlayer="reshape"]'); if (L && L.getAttribute('aria-pressed') !== 'true') L.click();
      if (!document.querySelector('[data-mform="find:liquid:fpga"]')) pick('find:liquid:fpga'); pick('find:liquid:fpga'); pick('mix:liquid:fpga');
      return [...document.querySelectorAll('.mach .mchecks li.bad')].length >= 2 && !!document.querySelector('.mach .lmap .every') && !!document.querySelector('.mach .mliquid .mclaims') && !!document.querySelector('.mach .mbk[data-mpart="find"] .mbkl .bad'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': an FPGA does not miss a job that changes every 100 ns'));
    await fp.waitForFunction(() => { ['find:liquid:cgra', 'mix:liquid:cgra'].forEach(s => { const b = document.querySelector('[data-mform="' + s + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
      return !document.querySelector('.mach .mchecks li.bad') && document.querySelectorAll('.mach .lmap .pt.f-liquid').length >= 1 && !!document.querySelector('.mach .mbk[data-mpart="find"].f-liquid .mbkl .good'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': an array rewired every tick does not keep up'));
    /* Do: the radio's challenge played on the picture to its win (its rules kept with the least energy), the goal across the stage */
    await fp.waitForFunction(() => { const d = document.querySelector('[data-mmode="do"]'); if (d && d.getAttribute('aria-selected') !== 'true') d.click();
      ['find:liquid:cgra', 'mix:liquid:cgra', 'clock:matter:reversible'].forEach(s => { const b = document.querySelector('[data-mform="' + s + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b && s.startsWith('clock')) { const m = document.querySelector('[data-mform^="clock:matter"]'); if (m) m.click(); } });
      const f = document.querySelector('[data-mfab="giant"]'); if (f && f.getAttribute('aria-pressed') !== 'true') f.click();
      return location.hash === '#/machines/radio/do' && document.querySelectorAll('.mach .mgoal .mgm').length >= 3 && !!document.querySelector('.mach .mstage.mwin .mwon'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the radio\'s challenge does not play to its win in Do'));
    /* another need, its own machine and its own challenge: the rover, whose guide must change and whose voter must be exact */
    await fp.evaluate(() => { location.hash = '#/machines/rover'; });
    await fp.waitForFunction(() => document.querySelectorAll('.mach .mpart').length === 5, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the rover\'s machine does not open'));
    await fp.waitForFunction(() => { const d = document.querySelector('[data-mmode="do"]'); if (d && d.getAttribute('aria-selected') !== 'true') d.click();
      const pick = (s, fam) => { const b = document.querySelector('[data-mform="' + s + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b) { const m = document.querySelector('[data-mform^="' + fam + '"]'); if (m) m.click(); } };
      const won = !!document.querySelector('.mach .mstage.mwin');
      if (!won) { pick('nav:matter:cim', 'nav:matter'); pick('vote:matter:reversible', 'vote:matter'); pick('clock:matter:reversible', 'clock:matter'); }
      return won && !!document.querySelector('.mach .mdo .mdone'); }, null, { timeout: 15000, polling: 300 }).catch(() => problems.push(tag + ': the rover\'s challenge does not play to its win in Do'));
    const side = await fp.evaluate(() => { const p = document.querySelector('.page'); return p ? p.scrollWidth - p.clientWidth : 0; });
    if (side > 1) problems.push(tag + ': the page scrolls sideways by ' + side + ' px');
    await fp.close();
  }
  /* how true each claim is (#325): a claim beyond today's chip carries two marks, one above the other, whether anyone
     has built it (its status) and how the lab knows it (its mark), a guess never more than an idea drawn; each tapped
     says in one line what it means */
  { const tag = 'machines fidelity', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await fp.goto(base + 'index.html#/machines/wildfire');
    await fp.waitForFunction(() => { const L = document.querySelector('[data-mlayer="claims"]'); if (L && L.getAttribute('aria-pressed') !== 'true') L.click();
      const b = document.querySelector('[data-mform="detect:matter:living"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b) { const m = document.querySelector('[data-mform^="detect:matter"]'); if (m) m.click(); }
      const rows = [...document.querySelectorAll('.mach .mclaims li')];
      return rows.length >= 4 && rows.every(r => r.querySelector('.mmarks .mst[data-fidst]') && r.querySelector('.mmarks .fid[data-fid]')) &&
        rows.filter(r => r.querySelector('.mst.s-guess')).every(r => r.querySelector('.fid[data-fid="idea"]')); }, null, { timeout: 20000, polling: 300 })
      .catch(() => problems.push(tag + ': a claim does not carry both its marks, or a guess is marked more than an idea'));
    for (const sel of ['.mach .mclaims .mst[data-fidst="guess"]', '.mach .mclaims .fid[data-fid="figures"]']) {
      await fp.waitForFunction(sel => { const L = document.querySelector('[data-mlayer="claims"]'); if (L && L.getAttribute('aria-pressed') !== 'true') L.click();
        const m = document.querySelector(sel); if (!m) return false; if (m.getAttribute('aria-expanded') !== 'true') m.click();
        const tip = document.querySelector('.fidtip p'); return !!tip && tip.textContent.length > 30; }, sel, { timeout: 15000, polling: 500 })
        .catch(() => problems.push(tag + ': tapping ' + sel + ' says nothing'));
    }
    await fp.close(); }
  /* your switch up the scales (#329): a switch kept at the switch level (src/v2/labs/switch.js) is a kind of new matter;
     the wildfire sensor's detector made of it spends less than a circuit of silicon fins, and its claim says whose switch */
  { const tag = 'machines switch', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); localStorage.setItem('osl-switch-v1', JSON.stringify({ sw: 'si/gaa/therm' })); });
    await fp.goto(base + 'index.html#/machines/wildfire/claims');
    await fp.waitForFunction(() => { const b = document.querySelector('[data-mform="detect:matter:switch"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b) { const m = document.querySelector('[data-mform^="detect:matter"]'); if (m) m.click(); }
      const e = (document.querySelector('.mach .mread b') || {}).textContent || '', v = parseFloat(e);
      return !!document.querySelector('.mach .mbk[data-mpart="detect"].f-matter') && !!document.querySelector('.mach .mclaims .mswitch a[href="#/do/transistor"]') && v > 0 && v < 1 && !document.querySelector('.mach .mchecks li.bad'); }, null, { timeout: 20000, polling: 300 })
      .catch(() => problems.push(tag + ': a block made of your switch does not lower the machine\'s energy'));
    await fp.close(); }
  /* the kind of new matter a lab models leads into that lab (#322, src/data/inventions.js lab): a part made of spikes into
     the detector made of spikes, one made of light into multiplying as it travels, which opens from there */
  { const tag = 'machines labs', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    await fp.goto(base + 'index.html#/machines/wildfire');
    for (const k of ['spikes', 'light']) {
      await fp.waitForFunction(k => { const b = document.querySelector('[data-mform="detect:matter:' + k + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); else if (!b) { const m = document.querySelector('[data-mform^="detect:matter"]'); if (m) m.click(); }
        return !!document.querySelector('.mach a.mlabway[href="#/do/' + k + '"]'); }, k, { timeout: 20000, polling: 300 })
        .catch(() => problems.push(tag + ': a part made of ' + k + ' does not lead into its lab'));
    }
    await fp.waitForFunction(() => { const a = document.querySelector('.mach a.mlabway[href="#/do/light"]'); if (a) a.click(); return !!document.querySelector('.player[data-ch="light"]'); }, null, { timeout: 60000, polling: 1000 })
      .catch(() => problems.push(tag + ': the lab of light does not open from its matter'));
    await fp.close(); }
}
