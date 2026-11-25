/* the labs and bets, each played to its win on a flat page of its own, in Do mode. The loop's own challenges (the bets,
   the designs, your chip's settings, its life, the broken copy) are played here; then each lab's own check, from its file
   in scripts/smoke/labs/ (named for the lab, src/data/labs/), in the order of the labs' list */
import { existsSync } from 'node:fs';
import { S } from './shared.mjs';
import { LABS } from '../../src/data/labs/index.js';

export const about = 'every lab and bet played to its win on a flat page, each in Do mode';

export default async function run() {
  const { browser, base, problems } = S;
  /* the labs and bets are played on a flat page of their own: none needs the 3D world, and on a CI machine's software
     renderer the flights between islands take long enough to redraw a card while it is played, which made these
     checks pass or fail by chance. A fresh visitor again (its own storage). */
  { const tag = 'labs', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
  /* every challenge, once won, must be in Do mode, its instrument on the stage left of the panel that holds its
     controls, or its place kept as the picture with the goal across it (src/v2/frame2.js, Do) */
  const adr = h => base + 'index.html' + h;
  const inDo = async (id, what) => {
    await fp.waitForFunction(id => { const p = document.querySelector('.player[data-ch="' + id + '"]'), host = p && p.closest('.f2stage'); if (!host || !p.querySelector('.won')) return false;
      const panel = host.id === 'sheet' ? host : host.querySelector(':scope > .dockwrap'), P = panel.getBoundingClientRect(), i = p.querySelector('[data-f2="instrument"]'), g = p.querySelector('[data-f2="goal"]');
      const where = [...document.querySelectorAll('.f2where:not([hidden])')].some(w => w.getBoundingClientRect().width > 0);
      if (!where || P.left < innerWidth / 2 || (g && g.getBoundingClientRect().right > P.left + 1)) return false;
      if (!i) return host.classList.contains('f2place');
      const I = i.getBoundingClientRect(); return I.width > 300 && I.height > 120 && I.left >= 0 && I.right <= P.left + 1 && I.top >= 60 && I.bottom <= innerHeight + 1; }, id, { timeout: 30000, polling: 1000 })
      .catch(() => problems.push(tag + ': ' + what + ' is not played in Do mode (its instrument on the stage beside the panel, or the place with its goal)')); };
  /* a file the labs ask for and do not get is named, so a 404 never goes untraced */
  fp.on('response', r => { if (r.status() >= 400) problems.push(tag + ': ' + r.status() + ' for ' + r.url()); });
  await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
  /* a bet is played: guess first, then the two dials find the balance (src/engines/bet.js) */
  await fp.goto(adr('#/do/cheaper'));
  await fp.waitForSelector('[data-guess-size]', { timeout: 30000 }).catch(() => problems.push(tag + ': the bet does not ask for a guess first'));
  await fp.evaluate(() => { const b = document.querySelector('[data-guess-size="6"]'); if (b) b.click(); });
  await fp.waitForSelector('.betwafer', { timeout: 10000 }).catch(() => problems.push(tag + ': the bet does not show its wafer'));
  await fp.evaluate(() => { for (const [k, v] of [['size', 6], ['clean', 2]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } } });
  await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the bet cannot be won with both dials'));
  await inDo('cheaper', 'cheaper');
  /* Cray's bet: the ox alone and the chickens alone fail; one chip with both wins */
  await fp.goto(adr('#/do/oxen'));
  await fp.waitForSelector('[data-guess-ox]', { timeout: 30000 }).catch(() => problems.push(tag + ': the oxen bet does not ask for a guess first'));
  await fp.evaluate(() => { const b = document.querySelector('[data-guess-ox="2"]'); if (b) b.click(); });
  await fp.waitForSelector('.oxplan', { timeout: 10000 }).catch(() => problems.push(tag + ': the oxen bet does not draw its chip'));
  await fp.evaluate(() => { for (const [k, v] of [['ox', 6], ['hens', 6]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } } });
  await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the oxen bet cannot be won with an ox and chickens'));
  await inDo('oxen', 'oxen');
  /* its caption names the parts by size, never by colour (the block is light at night), and speaks of the dashed line
     only while it is drawn: within the budget the outline, past it the dashed line (#373) */
  await fp.evaluate(async () => {
    const W = await (await fetch(new URL('src/i18n/en/labs.json', location.href))).json(), cap = () => (document.querySelector('.oxplan figcaption') || {}).textContent || '', set = (k, v) => { const r = document.querySelector('[data-bet="' + k + '"]'); if (r && r.value !== String(v)) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } };
    const ok = over => !!document.querySelector('.oxplan .budget') === over && cap().includes(W[over ? 'bet.ox.planOver' : 'bet.ox.planIn']) && !cap().includes(W[over ? 'bet.ox.planIn' : 'bet.ox.planOver']) && !/dark/i.test(cap());
    const until = async (f, ms) => { const end = Date.now() + ms; while (Date.now() < end) { if (f()) return true; await new Promise(r => requestAnimationFrame(r)); } return false; };
    const within = await until(() => ok(false), 10000);
    const hens = document.querySelector('[data-bet="hens"]'), past = await until(() => { set('hens', hens ? hens.max : 0); return ok(true); }, 10000);
    set('hens', 6);
    return within && past;
  }).then(r => { if (!r) problems.push(tag + ': Cray\'s caption does not match its picture (the dashed line, or a colour named)'); }).catch(e => problems.push(tag + ': Cray\'s caption could not be checked: ' + e.message));
  /* the pieces' bet: split and untested sinks packages; split and tested wins */
  await fp.goto(adr('#/do/onebad'));
  await fp.waitForSelector('[data-guess-pc]', { timeout: 30000 }).catch(() => problems.push(tag + ': the pieces bet does not ask for a guess first'));
  await fp.evaluate(() => { const b = document.querySelector('[data-guess-pc="1"]'); if (b) b.click(); });
  await fp.waitForSelector('.packs', { timeout: 10000 }).catch(() => problems.push(tag + ': the pieces bet does not draw its packages'));
  await fp.evaluate(() => { for (const [k, v] of [['k', 2], ['test', 2]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } } });
  await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the pieces bet cannot be won by splitting and testing'));
  await inDo('onebad', 'onebad');
  /* the proof's bet, at the bench: prove the arithmetic, test the rest */
  await fp.goto(adr('#/do/prove'));
  await fp.waitForSelector('[data-guess-pv]', { timeout: 30000 }).catch(() => problems.push(tag + ': the proof bet does not ask for a guess first'));
  await fp.evaluate(() => { const b = document.querySelector('[data-guess-pv="1"]'); if (b) b.click(); });
  await fp.waitForSelector('.pblocks [data-prove]', { timeout: 10000 }).catch(() => problems.push(tag + ': the proof bet does not show its blocks'));
  await fp.evaluate(() => { for (const i of [5, 6, 7]) { const b = document.querySelector('[data-prove="' + i + '"]'); if (b) b.click(); } const r = document.querySelector('[data-bet="tests"]'); if (r) { r.value = 5; r.dispatchEvent(new Event('input', { bubbles: true })); } });
  await fp.waitForSelector('.player .won', { timeout: 10000 }).catch(() => problems.push(tag + ': the proof bet cannot be won by proving the arithmetic'));
  await inDo('prove', 'prove');
  /* Jevons' bet, on the power island: a better chip alone draws more turbines; under a limit on its power it holds. The
     island is far, and the sheet may be drawn again when the flight lands: each poll guesses and turns the dials anew */
  await fp.goto(adr('#/do/jevons'));
  await fp.waitForSelector('[data-guess-jv]', { timeout: 120000 }).catch(() => problems.push(tag + ': the Jevons bet does not ask for a guess first'));
  const dials = (D, sel) => fp.waitForFunction(([D, sel]) => { const g = document.querySelector('[data-guess-jv="2"]'); if (g) g.click();
    for (const [k, v] of D) { const r = document.querySelector('#sheet [data-bet="' + k + '"]'); if (r && r.value !== String(v)) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } }
    return !!document.querySelector(sel); }, [D, sel], { timeout: 30000, polling: 1000 });
  await dials([['eff', 3], ['cap', 6]], '#sheet .turbines .tb.more').catch(() => problems.push(tag + ': a better chip alone does not draw turbines beyond the island'));
  await dials([['eff', 4], ['cap', 1]], '#sheet .player .won').catch(() => problems.push(tag + ': the Jevons bet cannot be won with a better chip and a limit on power'));
  await inDo('jevons', 'jevons');
  /* the batch bet, at the data centre's chip: many people and fewer bits keep each fast and the chip busy */
  await fp.goto(adr('#/do/batch'));
  await fp.waitForSelector('[data-guess-bt]', { timeout: 60000 }).catch(() => problems.push(tag + ': the batch bet does not ask for a guess first'));
  await fp.waitForFunction(() => { const g = document.querySelector('[data-guess-bt="2"]'); if (g) g.click();
    for (const [k, v] of [['batch', 9], ['format', 2]]) { const r = document.querySelector('[data-bet="' + k + '"]'); if (r && r.value !== String(v)) { r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); } }
    return !!document.querySelector('.player .won'); }, null, { timeout: 30000, polling: 1000 }).catch(() => problems.push(tag + ': the batch bet cannot be won with many people and fewer bits'));
  await inDo('batch', 'batch');
  /* its step keeps its three columns (a name, a bar, a figure) on a page where Verify the agent was never opened (#373) */
  await fp.waitForFunction(() => { const g = document.querySelector('.player[data-ch="batch"] .btstep .agrace'); return !!g && getComputedStyle(g).display === 'grid' && getComputedStyle(g).gridTemplateColumns.split(' ').length === 3; }, null, { timeout: 10000, polling: 500 })
    .catch(() => problems.push(tag + ': the batch bet\'s step loses its three columns on a fresh page'));
  /* the factory's labs: each is played to its win; a poll does every move again, as the sheet may be drawn anew
     when the flight lands. SET sets a dial the way a person drags it. */
  const SET = "const SET = (q, v) => { const i = document.querySelector(q); if (i) { i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); } }, CL = q => { const b = document.querySelector(q); if (b) b.click(); };";
  const playLab = async (id, moves, what, wait = 90000, addr = null) => {
    S.at = 'labs: ' + id;
    await fp.goto(adr(addr || '#/do/' + id));
    /* this challenge's own card (data-ch): the card of the lab before stays up until the new one is drawn */
    await fp.waitForSelector('.player[data-ch="' + id + '"]', { timeout: 60000 }).catch(() => problems.push(tag + ': ' + what + ' does not open'));
    /* polled from here: waitForFunction does not wait for an async predicate (its promise counts as true at once),
       so it would pass without a win; evaluate does wait */
    const play = new Function('return (async () => { ' + SET + moves + '; return !!document.querySelector(\'.player[data-ch="' + id + '"] .won\'); })()'), until = Date.now() + wait;
    let won = false;
    while (!won && Date.now() < until) { won = await fp.evaluate(play).catch(() => false); if (!won) await fp.waitForTimeout(3000); }
    if (!won) problems.push(tag + ': ' + what + ' is not won by the moves that win it');
    else await inDo(id, what);
  };
  /* the player's own kinds (src/v2/play.js), each found by its engine in the page and set as a person would: a design
     written right on the bench, your chip's settings for each goal (the chip carries from one to the next: where the
     two dials cannot reach a goal from where the last one left it, the chip is reset and tried again), a life
     each place's chip lives through, and the broken copy caught by a pattern that makes it answer wrong */
  const ENG = "const Gm = await import(new URL('src/v2/game.js', location.href).href), S = Gm.load(localStorage);";
  const DESIGN = id => ENG + " const Dz = await import(new URL('src/engines/design.js', location.href).href), P = '.player[data-ch=\"" + id + "\"] ';"
    + " CL(P + '[data-write]'); const ta = document.querySelector(P + '#chCode'); if (ta) { ta.value = Dz.solutionOf(Gm.challengeOf('" + id + "').p); CL(P + '[data-check]'); }";
  for (const [id, at, what] of [['half', 'logic', 'Half adder'], ['vote', 'check', 'A smaller majority voter'], ['full', 'check', 'Full adder']]) await playLab(id, DESIGN(id), what, 90000, '#/bench/' + at + '/' + id);
  const CHIP = id => ENG + " const Ch = await import(new URL('src/engines/chip.js', location.href).href), P = '.player[data-ch=\"" + id + "\"] ', ds = [...document.querySelectorAll(P + 'input[data-set]')];"
    + " const val = (k, v) => k === 'clock' ? Ch.CLOCKS[v] : v; let pick = null; const walk = (i, c) => { if (pick) return; if (i === ds.length) { if (Gm.checkChip('" + id + "', Object.assign({}, S.chip, c)).ok) pick = c; return; }"
    + " for (let v = +ds[i].min; v <= +ds[i].max; v++) walk(i + 1, Object.assign({}, c, { [ds[i].dataset.set]: val(ds[i].dataset.set, v) })); }; walk(0, {});"
    + " if (pick) ds.forEach(d => { const v = pick[d.dataset.set], i = d.dataset.set === 'clock' ? Ch.CLOCKS.indexOf(v) : v; if (+d.value !== i) SET(P + '#' + d.id, i); }); else CL(P + '[data-reset]');";
  for (const [id, what] of [['months', 'Through the factory in time'], ['quick', 'A chip that is quick to make'], ['cores', 'More cores, still cheap'], ['fed', 'Feed the cores'], ['fast', 'Half as fast again']]) await playLab(id, CHIP(id), what);
  const LIFE = id => ENG + " const Lf = await import(new URL('src/engines/life.js', location.href).href), m = Gm.challengeOf('" + id + "').mission, P = '.player[data-ch=\"" + id + "\"] '; let pick = null;"
    + " for (let margin = 0; margin < Lf.MARGINS.length && !pick; margin++) for (const protect of Lf.PROTECT) for (const grid of [false, true]) for (const hot of [false, true]) for (const burn of [false, true]) { const c = { margin, protect, grid, hot, burn }; if (!pick && Gm.checkLife(m, c).pass) pick = c; }"
    + " if (pick) { SET(P + '#lifeM', pick.margin); CL(P + '[data-prot=\"' + pick.protect + '\"]:not([aria-pressed=\"true\"])'); for (const k of ['grid', 'hot', 'burn']) { const b = document.querySelector(P + '[data-life=\"' + k + '\"]'); if (b && (b.getAttribute('aria-pressed') === 'true') !== pick[k]) b.click(); } }";
  for (const [id, what] of [['phone', 'Through a phone\'s life'], ['car', 'Through a car\'s life'], ['dclife', 'Through a data centre\'s life']]) await playLab(id, LIFE(id), what);
  await playLab('spot', ENG + " const C = Gm.spotCase(Gm.spotCode(S)), P = '.player[data-ch=\"spot\"] ', run = [...document.querySelectorAll(P + '.tt tbody tr:not(.spotwait)')].length;"
    + " if (!document.querySelector(P + '[data-guess]')) { const i = C.bad.findIndex(r => r.mis.length); CL(P + '[data-pat=\"' + i + '\"]'); } CL(P + '[data-guess=\"' + C.broken + '\"]'); if (run >= 3 && !document.querySelector(P + '.won')) CL(P + '[data-again]');", 'Find the broken copy');
  /* each lab's own check (scripts/smoke/labs/<lab>.mjs): the page, the moves and the check that it is played in Do */
  for (const l of LABS) {
    if (!existsSync(new URL('./labs/' + l.name + '.mjs', import.meta.url))) continue;
    S.at = 'labs: ' + l.name; const { default: check } = await import('./labs/' + l.name + '.mjs');
    await check({ fp, adr, inDo, playLab, problems, tag });
  }
  await fp.close(); }

  /* how true each lab is (#325, src/data/fidelity.js): every challenge card shows its mark under its title, the same
     pill whatever the mark; tapped, it says in one line what it means here, and Escape puts the note away; the RISC-V
     datapath on the stage carries the lab's mark too */
  { const tag = 'labs fidelity', fp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    fp.on('pageerror', e => problems.push(tag + ': ' + e.message));
    await fp.addInitScript(() => { localStorage.setItem('osl-quality', 'flat'); localStorage.setItem('osl-hints-v1', JSON.stringify({ seen: {}, off: true })); });
    for (const [id, f] of [['months', 'checked'], ['cim', 'computed'], ['newest', 'figures'], ['dieread', 'idea']]) {
      await fp.goto(base + 'index.html#/do/' + id);
      await fp.waitForFunction(([id, f]) => { const m = document.querySelector('.player[data-ch="' + id + '"] .fidrow .fid[data-fid="' + f + '"]'); if (!m) return false;
        if (m.getAttribute('aria-expanded') !== 'true') m.click();
        const tip = document.querySelector('.fidtip p'); return m.getAttribute('aria-expanded') === 'true' && !!tip && tip.textContent.length > 30; }, [id, f], { timeout: 60000, polling: 1000 })
        .catch(() => problems.push(tag + ': ' + id + ' does not show its mark (' + f + '), or tapping it says nothing'));
    }
    await fp.keyboard.press('Escape');
    await fp.waitForFunction(() => !document.querySelector('.fidtip'), null, { timeout: 10000, polling: 500 }).catch(() => problems.push(tag + ': Escape does not put the mark\'s note away'));
    await fp.goto(base + 'index.html#/do/rvrun');
    await fp.waitForFunction(() => !!document.querySelector('.player[data-ch="rvrun"] .dpfig .dphead .fid[data-fid="computed"]'), null, { timeout: 90000, polling: 1000 })
      .catch(() => problems.push(tag + ': the datapath does not carry the lab\'s mark'));
    await fp.close(); }
}
