/* Grow an architecture that does not exist yet (kind 'arch', at the Lab), from src/engines/arch.js: the third scale of
   Invent, after a new switch (src/v2/labs/switch.js) and a machine for one need (src/v2/machines.js).
   It opens on today's computer, one recipe of 400, polished by decades of attempts and level with itself in every need.
   Change a gene (where it computes, what carries a value, how it is told what to do, its shape) and the picture
   becomes that architecture, and it falls far behind: a new architecture is not efficient at first. Then grow it, a
   year at a time: put each year's attempts into one or two directions (its devices, moving data, its tools, handling
   errors, making it, or people, who bring more attempts every year), and watch it catch up need by need against
   today's computer, which keeps improving too. Win one need and others join. Agents propose forks (one gene changed,
   worked out by the engine) after your first year; you decide, and a fork loses what was learned in the directions the
   changed gene leads. The map of all 400 recipes shows the few anyone has built and the many nobody has tried.
   Two goals (src/engines/arch.js GOALS): beat today's computer at one need, then at three at once, each with a recipe
   nobody has built, at least two genes from today's, within its years.
   Each direction is improved by doing it, in the lab that teaches it (#408): its card leads there, and a challenge won
   there comes back as a stepping stone, raising that direction's start once (A.STONES). Every start and fork of the
   visit stays as a family tree you can go back through, and a curve draws your best need against the attempts so far,
   both on powers of ten, Wright's law's shape (#409). What you grew is kept for the visit (KEEP), so you can go to a
   lab, win there and come back to the same architecture.
   An attempt can be kept in the community's ledger (#410), the same draft and slip as Machines' Keep this attempt
   (src/v2/commons.js): its history (A.histOf: the recipe it started from, the focus of each year, the forks and stones
   in order) and the needs its recipe wins, grown again by the ledger before it counts. The map shows the recipes the
   ledger holds, people's and agents' apart, and rings the square of the first attempt to win with each recipe; under it,
   the first to win each need (first in an empty niche counts most), read from the entries alone.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as A from '../../engines/arch.js';
import { mark as fidMark, TRUTH } from '../fid.js';
import { still } from '../../core/ui.js';
/* your switch, kept at the switch level (src/v2/labs/switch.js): a stepping stone for the devices when it spends less */
import { keptSwitch } from '../kept.js';
import { forMachines, specOf } from '../../engines/switch.js';
/* the community's ledger: attempts kept as entries, people's and agents' apart (src/engines/ledger.js archAttempts) */
import { archAttempts } from '../../engines/ledger.js';
import { world } from '../game.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, draftOf } from '../commons.js';

/* the picture's frame: the architecture above, the race against today's computer below */
const VW = 360, VH = 332;
/* the race's axis: x0.01 to x100 on powers of ten, today's computer at x1 */
const RX0 = 124, RX1 = 350, RY0 = 190, RDY = 21, DEC = (RX1 - RX0) / 4;
const rx = v => RX0 + DEC * (Math.log10(Math.max(0.01, Math.min(100, v))) + 2);
const f1 = v => (+v).toFixed(1);
/* where the units of each shape stand in the picture (x, y, w, h) */
const UNITS = {
  few: [[100, 40, 88, 80], [204, 40, 88, 80]],
  grid: [0, 1, 2].flatMap(r => [0, 1, 2, 3].map(c => [88 + c * 52, 30 + r * 38, 42, 28])),
  stack: [[100, 96, 168, 32], [114, 68, 168, 32], [128, 40, 168, 32]],
  swarm: [[92, 32, 34, 24], [152, 26, 34, 24], [214, 38, 34, 24], [262, 28, 34, 24], [118, 76, 34, 24], [182, 82, 34, 24], [248, 78, 34, 24], [100, 118, 34, 24], [204, 120, 34, 24]]
};
/* the swarm's links, by unit */
const SWARM_LINKS = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [3, 6], [4, 7], [5, 8], [7, 8], [1, 5], [2, 6]];
const ORDER = [...A.DIRS, 'people'];
/* is an attempt of the ledger an agent's (an AI, or a program that searches) */
const ARCH_AGENT = (LG, id) => LG.agents.some(e => e.id === id);
/* what you grew, by challenge, for the visit: going into a lab and coming back finds it where you left it */
const KEEP = {};
const KEPT_KEYS = ['ar', 'arFocus', 'arTried', 'arTree', 'arSay', 'arForks', 'arHist', 'arSlip', 'arSlipKey', 'arNo'];
/* the card hosts the map's keys once (each host one listener, which only turns keys into clicks the player routes) */
const KEYED = new WeakSet();
/* the way into the lab where a stone is won (a challenge's address; your switch is kept at the switch's lab, your
   entry goes into the record at the Lab) */
const hrefOf = id => (id === A.LEDGER_ENTRY ? '#/build' : '#/do/' + encodeURIComponent(id === A.KEPT_SWITCH ? 'transistor' : id));
/* the map: arrows move between squares, Enter or Space starts from one; the tree's nodes take Enter too */
function keys(e) {
  const n = e.target && e.target.closest ? e.target.closest('[data-ar-pick]') || e.target.closest('[data-ar-node]') : null;
  if (!n || n.tagName === 'BUTTON') return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); n.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!d || !n.hasAttribute('data-ar-pick')) return;
  e.preventDefault();
  const to = n.ownerSVGElement.querySelector('[data-ar-c="' + (+n.dataset.arC + d[0]) + '"][data-ar-r="' + (+n.dataset.arR + d[1]) + '"]');
  if (to) { n.setAttribute('tabindex', '-1'); to.setAttribute('tabindex', '0'); to.focus(); }
}

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  const save = () => L.ctx && L.ctx.save && L.ctx.save();
  const goalId = A.GOALS[ch.id] ? ch.id : 'archniche';
  Object.assign(view, KEEP[ch.id] || {});
  if (el && !KEYED.has(el)) { KEYED.add(el); el.addEventListener('keydown', keys); }
  /* the stepping stones brought: the challenges won, your switch if it spends less than silicon, an entry of yours */
  const brought = () => {
    const done = Object.keys(S.done || {}).filter(k => S.done[k]), k = keptSwitch();
    if (k && forMachines(specOf(k)).energy < 1) done.push(A.KEPT_SWITCH);
    if ((S.drafts || []).length) done.push(A.LEDGER_ENTRY);
    return A.broughtOf(done);
  };
  const begin = g => A.start(g, brought());
  const st = () => view.ar || (view.ar = begin(A.TODAY));
  const tree = () => view.arTree || (view.arTree = A.treeOf(st().g));
  /* the history of the line being grown, for the ledger: begun again at every start (year 0), a year's focus at every
     year, a fork or a stone at the years grown before it (A.histOf; replayed by the ledger, src/engines/ledger.js) */
  const hist = () => view.arHist || (view.arHist = st().year ? null : A.histOf(st()));
  const restart = () => { view.arHist = A.histOf(view.ar); };
  const change = c => { const h = hist(); if (h) h.changes.push(c); };
  /* the attempt a slip is for: the same start, years and forks (a stone your entry brings back changes nothing kept) */
  const slipKey = h => JSON.stringify([h.start, h.years.length, h.changes.filter(c => c.gene != null)]);
  const stoneName = id => (id === A.KEPT_SWITCH ? t('ar.stone.kept') : id === A.LEDGER_ENTRY ? t('ar.stone.entry') : t('game.ch.' + id + '.t'));
  const gname = g => (A.novelty(g) ? A.GENES.filter(k => g[k] !== A.TODAY[k]).map(k => opt(k, g[k])).join(' · ') : t('ar.tree.today'));
  const focus = () => view.arFocus || (view.arFocus = []);
  const tried = () => view.arTried || (view.arTried = []);
  const opt = (k, id) => t('ar.opt.' + k + '.' + id);
  const pct = v => (v >= 1 ? '×' + (v < 10 ? v.toFixed(1) : Math.round(v)) : v < 0.01 ? '<1%' : Math.round(v * 100) + '%');
  const times = v => (v >= 1 ? '×' + (v < 10 ? (+v.toFixed(1)).toString() : Math.round(v)) : '×' + (+v.toPrecision(2)).toString());
  const recipeLine = g => t('ar.recipe', { where: opt('where', g.where), carrier: opt('carrier', g.carrier), told: opt('told', g.told), shape: opt('shape', g.shape) });
  const bestNeed = (sc, k = 'could') => A.NEEDS.reduce((m, n) => (sc[n][k] > sc[m][k] ? n : m), A.NEEDS[0]);
  const say = (k, p) => { view.arSay = [k, p || {}]; };

  /* ---- the architecture, drawn from its recipe ---- */
  function archSvg(g) {
    const U = UNITS[g.shape], living = g.carrier === 'living', moving = !still();
    const cls = 'arpic c-' + g.carrier + ' w-' + g.where + ' t-' + g.told + ' s-' + g.shape;
    let s = '<g class="' + cls + '">';
    s += '<rect class="board" x="6" y="8" width="348" height="146" rx="10"/>';
    /* the links between units: a chain for values flowing, a swarm's links, layers joined by vias */
    const mid = u => [u[0] + u[2] / 2, u[1] + u[3] / 2];
    let paths = [];
    if (g.where === 'flow') { for (let i = 0; i < U.length - 1; i++) { const a = mid(U[i]), b = mid(U[i + 1]); paths.push('M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1])); } }
    else if (g.shape === 'swarm') SWARM_LINKS.forEach(([i, j]) => { const a = mid(U[i]), b = mid(U[j]); paths.push('M' + f1(a[0]) + ' ' + f1(a[1]) + (living ? 'Q' + f1((a[0] + b[0]) / 2 + 8) + ' ' + f1((a[1] + b[1]) / 2 - 10) + ' ' : 'L') + f1(b[0]) + ' ' + f1(b[1])); });
    else if (g.shape === 'grid') { for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const a = mid(U[r * 4 + c]), b = mid(U[r * 4 + c + 1]); paths.push('M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1])); } }
    else if (g.shape === 'few') { const a = mid(U[0]), b = mid(U[1]); paths.push('M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1])); }
    if (g.shape === 'stack') for (const x of [150, 200, 250]) s += '<line class="via" x1="' + x + '" y1="58" x2="' + (x - 28) + '" y2="114"/>';
    /* memory far: a bank of its own and the long road to it */
    if (g.where === 'far') {
      s += '<rect class="mem" x="314" y="26" width="32" height="104" rx="5"/>' + [0, 1, 2, 3, 4, 5, 6].map(i => '<line class="cell" x1="318" x2="342" y1="' + (38 + i * 13) + '" y2="' + (38 + i * 13) + '"/>').join('');
      s += '<text class="lb" x="330" y="146" text-anchor="middle">' + esc(t('ar.pic.memory')) + '</text>';
      const last = U.reduce((m, u) => (u[0] + u[2] > m[0] + m[2] ? u : m), U[0]);
      paths.push('M' + f1(last[0] + last[2]) + ' ' + f1(last[1] + last[3] / 2) + 'L314 ' + f1(last[1] + last[3] / 2));
    }
    s += paths.map(d => '<path class="wire" d="' + d + '"/>').join('');
    /* the units, each in the carrier's form, with memory beside or inside it */
    U.forEach(u => {
      const [x, y, w, h] = u;
      s += living ? '<ellipse class="unit" cx="' + f1(x + w / 2) + '" cy="' + f1(y + h / 2) + '" rx="' + f1(w / 2) + '" ry="' + f1(h / 2) + '"/>' : '<rect class="unit" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (g.shape === 'swarm' ? 4 : 6) + '"/>';
      if (g.where === 'near') s += '<rect class="mem" x="' + (x + 3) + '" y="' + (y - 5) + '" width="' + (w - 6) + '" height="4" rx="1.5"/>';
      if (g.where === 'in') { const n = Math.max(2, Math.floor(w / 9)), m = Math.max(2, Math.floor(h / 9)); for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) s += '<rect class="memc" x="' + f1(x + 4 + i * (w - 8) / n) + '" y="' + f1(y + 4 + j * (h - 8) / m) + '" width="' + f1((w - 8) / n - 1.6) + '" height="' + f1((h - 8) / m - 1.6) + '" rx="1"/>'; }
      if (g.told === 'fixed') s += '<path class="hard" d="M' + f1(x + 6) + ' ' + f1(y + h / 2) + 'l' + f1(w / 6) + ' -' + f1(h / 5) + 'l' + f1(w / 6) + ' ' + f1(2 * h / 5) + 'l' + f1(w / 6) + ' -' + f1(2 * h / 5) + 'l' + f1(w / 6) + ' ' + f1(h / 5) + '"/>';
      if (g.told === 'learns' && g.where !== 'in') for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s += '<circle class="wt o' + ((i + j) % 3) + '" cx="' + f1(x + w * (0.28 + i * 0.22)) + '" cy="' + f1(y + h * (0.36 + j * 0.3)) + '" r="2.2"/>';
    });
    /* how it is told what to do, at the left */
    const T = g.told;
    if (T === 'program') s += '<rect class="tape" x="18" y="44" width="40" height="74" rx="4"/>' + [0, 1, 2, 3, 4, 5].map(i => '<line class="op" x1="24" x2="' + (40 + (i * 7) % 14) + '" y1="' + (54 + i * 11) + '" y2="' + (54 + i * 11) + '"/>').join('');
    else if (T === 'graph') s += '<path class="glink" d="M26 60L46 48M26 60L46 82M46 48L52 104M46 82L52 104"/>' + [[26, 60], [46, 48], [46, 82], [52, 104]].map(([a, b]) => '<circle class="gnode" cx="' + a + '" cy="' + b + '" r="5"/>').join('');
    else if (T === 'events') s += '<circle class="ring" cx="38" cy="80" r="20"/><path class="bolt" d="M41 64L31 82h8l-3 16 11-20h-8z"/>';
    else if (T === 'learns') s += [0, 1, 2].flatMap(i => [0, 1, 2].map(j => '<circle class="ex o' + ((i * 2 + j) % 3) + '" cx="' + (24 + i * 14) + '" cy="' + (62 + j * 14) + '" r="3.4"/>')).join('');
    else s += '<circle class="pin" cx="38" cy="80" r="7"/><line class="op" x1="45" y1="80" x2="62" y2="80"/>';
    s += '<text class="lb" x="38" y="140" text-anchor="middle">' + esc(t('ar.pic.told.' + T)) + '</text>';
    s += '<path class="feed" d="M60 80H' + (U[0][0] - 4) + '"/>';
    /* what flows: packets moving along the wires, in the carrier's form */
    if (moving && paths.length) {
      const P = { charge: '<rect class="pk" x="-2.5" y="-2.5" width="5" height="5" rx="1"/>', light: '<circle class="pk" r="2.6"/>', spikes: '<path class="pk" d="M-3 2L0 -5L3 2"/>', reversible: '<rect class="pk" x="-2.5" y="-2.5" width="5" height="5" rx="2.5"/>', living: '<circle class="pk" r="2"/>' }[g.carrier];
      paths.slice(0, 8).forEach((d, i) => { const dur = g.carrier === 'light' ? 1.1 : g.carrier === 'reversible' ? 3.2 : 2.2;
        s += '<g class="pkg">' + P + '<animateMotion dur="' + dur + 's" repeatCount="indefinite" begin="-' + ((i * 0.37) % dur).toFixed(2) + 's" path="' + d + '"' + (g.carrier === 'reversible' ? ' keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"' : '') + '/></g>'; });
    }
    return s + '</g>';
  }

  /* ---- the race: each need against today's computer, which keeps improving ---- */
  function raceSvg(sc, g) {
    let s = '<g class="arrace"><text class="rt" x="8" y="174">' + esc(t('ar.race.title')) + '</text>';
    for (let d = -2; d <= 2; d++) s += '<line class="gl" x1="' + f1(RX0 + DEC * (d + 2)) + '" x2="' + f1(RX0 + DEC * (d + 2)) + '" y1="' + (RY0 - 8) + '" y2="' + (RY0 + 5 * RDY + 6) + '"/><text class="ax" x="' + f1(RX0 + DEC * (d + 2)) + '" y="' + (RY0 + 5 * RDY + 20) + '" text-anchor="' + (d === 2 ? 'end' : 'middle') + '">×' + ['0.01', '0.1', '1', '10', '100'][d + 2] + '</text>';
    /* each need the same nodes whatever the recipe (a bar it cannot have is empty), so a redraw moves them: when a gene
       changes, the bars fall to where the new recipe stands (nothing moves with reduced motion, src/styles/base.css) */
    A.NEEDS.forEach((n, i) => {
      const r = sc[n], y = RY0 + i * RDY, w = r.can ? Math.max(3, rx(r.now) - RX0) : 0, cx = rx(r.can ? r.could : 1);
      s += '<g class="arn" data-ar-need="' + n + '"><text class="nl' + (r.wins ? ' beat' : '') + '" x="8" y="' + (y + 4) + '">' + (r.wins ? '✓ ' : '') + esc(t('ar.need.' + n)) + '</text>';
      s += '<rect class="track" x="' + RX0 + '" y="' + (y - 4.5) + '" width="' + (RX1 - RX0) + '" height="9" rx="4.5"/>';
      s += '<rect class="bar' + (r.wins ? ' beat' : '') + '" x="' + RX0 + '" y="' + (y - 4.5) + '" height="9" rx="4.5" style="width:' + f1(w) + 'px" width="' + f1(w) + '"/>';
      s += '<path class="could' + (r.could >= 1 ? ' over' : '') + (A.novelty(g) && r.can ? '' : ' off') + '" d="M0 -6l5 6l-5 6l-5 -6z" style="transform:translate(' + f1(cx) + 'px,' + y + 'px)"/>';
      s += '<text class="cant" x="' + (RX0 + 6) + '" y="' + (y + 3.5) + '">' + (r.can ? '' : esc(t('ar.cant', { what: A.missesOf(g, n).map(k => t('ar.cant.' + k)).join(', ') }))) + '</text></g>';
    });
    s += '<line class="today" x1="' + f1(rx(1)) + '" x2="' + f1(rx(1)) + '" y1="' + (RY0 - 12) + '" y2="' + (RY0 + 5 * RDY + 8) + '"/>';
    s += '<text class="tl" x="' + f1(rx(1) + 5) + '" y="' + (RY0 - 13) + '">' + esc(t('ar.race.today')) + '</text>';
    return s + '</g>';
  }
  function figure(s0, sc) {
    const g = s0.g, wins = A.winsOf(s0).length;
    return '<figure class="arfig" data-f2="instrument"><svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' + esc(t('ar.fig.aria', { recipe: recipeLine(g), n: wins })) + '">' + archSvg(g) + raceSvg(sc, g) + '</svg>' +
      '<figcaption class="small muted arkey"><span class="k now"></span>' + esc(t('ar.key.now')) + (A.novelty(g) ? ' <span class="k could"></span>' + esc(t('ar.key.could')) : '') + ' <span class="k today"></span>' + esc(t('ar.key.today')) + '</figcaption></figure>';
  }

  /* ---- the goal ---- */
  function goalbox(s0) {
    const G = A.goalOf(s0, goalId), late = s0.year > G.years;
    const rows = [
      ['wins', G.wins >= G.needs, t('ar.of', { n: Math.min(G.wins, G.needs), of: G.needs }), Math.min(1, G.wins / G.needs)],
      ['fresh', G.fresh && A.novelty(s0.g) > 0, t(G.fresh && A.novelty(s0.g) > 0 ? 'ar.yes' : 'ar.no'), G.fresh && A.novelty(s0.g) > 0 ? 1 : 0],
      ['far', G.far, t('ar.of', { n: A.novelty(s0.g), of: 2 }), Math.min(1, A.novelty(s0.g) / 2)],
      ['years', !late, t('ar.of', { n: s0.year, of: G.years }), Math.min(1, s0.year / G.years)]];
    return '<div class="goalbox argoal' + (G.met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(G.met ? 'game.reached' : 'game.goalNow')) + '</p>' + rows.map(([k, ok, v, b]) =>
      '<div class="gauge' + (ok && k !== 'years' ? ' ok' : '') + (k === 'years' ? (late ? ' bad' : ' warmg') : '') + '" data-argoal="' + k + '"' + (ok && k !== 'years' ? ' data-met' : '') + '><span class="gl">' + (ok && k !== 'years' ? '✓ ' : '') + esc(t('ar.g.' + k)) + '</span><span class="gv">' + esc(v) + '</span><span class="gbar"><span style="width:' + (b * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }

  /* ---- the recipe ---- */
  function recipe(s0) {
    const g = s0.g, kn = A.knownOf(g);
    let h = '<div class="arset">';
    for (const k of A.GENES) h += '<p class="kicker">' + esc(t('ar.gene.' + k)) + '</p><div class="chips">' + A.OPTIONS[k].map(o => '<button type="button" class="chipb" data-ar-gene="' + k + '" data-ar-opt="' + o + '" aria-pressed="' + (g[k] === o) + '" title="' + esc(t('ar.opt.' + k + '.' + o + '.d')) + '">' + esc(opt(k, o)) + '</button>').join('') + '</div>';
    const line = !A.novelty(g) ? t('ar.recipe.today') : kn ? t('ar.recipe.known', { name: t('ar.known.' + kn.id), status: t('ar.st.' + kn.status) }) : t('ar.recipe.new');
    h += '<p class="small arline"><b>' + esc(recipeLine(g)) + '</b> ' + esc(line) + '</p>';
    h += '<p class="small muted ardesc">' + A.GENES.map(k => esc(t('ar.opt.' + k + '.' + g[k] + '.d'))).join(' · ') + '</p>';
    if (s0.year) h += '<p class="small muted">' + esc(t('ar.fork.note')) + '</p>';
    return h + '</div>';
  }
  /* what the recipe does to five traits, against today's computer */
  function traits(g) {
    const T = A.traitsOf(g, 'model');
    return '<div class="artraits"><p class="kicker">' + esc(t('ar.traits.kicker')) + '</p><div class="artr">' + A.TRAITS.map(k => {
      const v = T[k], lg = Math.log10(v), w = Math.min(50, Math.abs(lg) * 25);
      return '<span class="arti" data-artrait="' + k + '"><span class="small">' + esc(t('ar.tr.' + k)) + '</span><b class="mono ' + (v > 1.001 ? 'good' : v < 0.999 ? 'bad' : '') + '">' + esc(times(v)) + '</b><span class="arbi"><span class="' + (lg >= 0 ? 'up' : 'dn') + '" style="width:' + w.toFixed(0) + '%;' + (lg >= 0 ? 'left:50%' : 'right:50%') + '"></span></span></span>';
    }).join('') + '</div></div>';
  }

  /* ---- where this year's attempts go ---- */
  /* each direction a card: what this year's attempts would go into (tap to choose it), and the way into the lab where
     that kind of improvement is done; a challenge won there is a stepping stone, and the card says what it brought */
  function dirs(s0) {
    const M = A.maturityOf(s0), F = focus(), sg = A.novelty(s0.g) ? A.suggest(s0, goalId) : null, B = s0.stones || {};
    return '<div class="ardirs"><p class="kicker">' + esc(t('ar.dirs.kicker')) + '</p><p class="small muted arstones">' + esc(t('ar.stones.lead')) + '</p>' +
      (sg ? '<p class="small arsug">' + esc(t('ar.sug', { need: t('ar.need.' + sg.need), dirs: sg.dirs.map(d => t('ar.dir.' + d)).join(t('ar.and')) })) + '</p>' : '') + '<div class="ardirgrid">' + ORDER.map(d => {
      const on = F.includes(d), people = d === 'people', best = sg ? sg.dirs.indexOf(d) + 1 : 0, got = B[d], lab = A.STONES[d][0];
      const val = people ? Math.round(s0.people) : Math.round(M[d] * 100), bar = people ? Math.min(1, Math.log10(s0.people) / 3) : M[d];
      const way = got ? '<a class="small arway got" href="' + hrefOf(got) + '" data-ar-stone="' + got + '"><span aria-hidden="true">✓ </span>' + esc(t('ar.stone', { what: stoneName(got) })) + '</a><span class="small arwhy">' + esc(t('ar.stone.' + d, { x: people ? A.STONE_PEOPLE : A.STONE })) + '</span>'
        : '<a class="small arway" href="' + hrefOf(lab) + '" data-ar-way="' + lab + '"><span aria-hidden="true">↓ </span>' + esc(people ? t('ar.way.people') : t('ar.way', { lab: stoneName(lab) })) + '</a>';
      return '<div class="ardir' + (people ? ' ppl' : '') + (best ? ' best' : '') + (on ? ' on' : '') + (got ? ' got' : '') + '" data-ar-card="' + d + '"><button type="button" class="ardt" data-ar-dir="' + d + '"' + (best ? ' data-ar-best="' + best + '"' : '') + ' aria-pressed="' + on + '"><span class="ardn"><b>' + esc(t('ar.dir.' + d)) + '</b><span class="mono">' + (people ? val : val + '%') + '</span></span>' +
        '<span class="small muted">' + esc(people ? t('ar.dir.people.d', { n: Math.round(s0.people * A.ATTEMPTS) }) : t('ar.dir.' + d + '.d')) + '</span><span class="gbar"><span style="width:' + (bar * 100).toFixed(0) + '%"></span></span></button>' + way + '</div>';
    }).join('') + '</div><div class="aracts"><button type="button" class="btn" data-ar-year="1">' + esc(t('ar.act.year')) + '</button><button type="button" class="btn ghost" data-ar-year="5">' + esc(t('ar.act.five')) + '</button><button type="button" class="link" data-ar-reset>' + esc(t('ar.act.reset')) + '</button></div></div>';
  }

  /* ---- the agents' forks ---- */
  function agents(s0) {
    let h = '<div class="aragents"><p class="kicker">' + esc(t('ar.ag.kicker')) + '</p>';
    if (!s0.year) return h + '<p class="small muted">' + esc(t('ar.ag.first')) + '</p></div>';
    if (!view.arForks) return h + '<p class="small muted">' + esc(t('ar.ag.how')) + '</p><button type="button" class="btn ghost" data-ar-ask>' + esc(t('ar.ag.ask')) + '</button></div>';
    if (!view.arForks.length) return h + '<p class="small">' + esc(t('ar.ag.none')) + '</p></div>';
    h += '<p class="small muted">' + esc(t('ar.ag.how')) + '</p>';
    h += view.arForks.map(c => '<div class="arfork"><p><b>' + esc(t('ar.gene.' + c.gene)) + ': ' + esc(opt(c.gene, c.option)) + '</b><br><span class="small">' + esc(t('ar.ag.could', { n: c.could })) + '</span><br><span class="small muted">' +
      esc(c.lost.length ? t('ar.ag.lost', { dirs: c.lost.map(d => t('ar.dir.' + d)).join(', ') }) : t('ar.ag.keeps')) + '</span></p><button type="button" class="chipb" data-ar-fork="' + c.gene + ':' + c.option + '">' + esc(t('ar.ag.take')) + '</button></div>').join('');
    return h + '</div>';
  }

  /* ---- the map of every recipe: the few built, the many nobody has tried ---- */
  function mapFig(s0) {
    const X0 = 58, Y0 = 18, P = 10, G = 4 * P + 4, me = A.keyOf(s0.g), T = tried();
    /* the ledger's attempts, by the recipe each ended on: people's and agents' apart, never mixed (yours, still drafts, among
       people's), the first to win with each recipe and the first to win each need (src/engines/ledger.js) */
    const LG = archAttempts(world(S)), at = {}, pioneers = new Set(Object.values(LG.first));
    LG.all.forEach(e => { (at[e.facts.g] = at[e.facts.g] || []).push(e); });
    const needs = list => list.map(n => t('ar.need.' + n)).join(t('ar.and'));
    const entryLine = e => e.by + ' · ' + t('build.kind.' + e.made) + (e.facts.wins.length ? ' · ' + t('ar.map.wins', { needs: needs(e.facts.wins) }) : '') + ((e.firstIn || []).length ? ' · ' + t('ar.map.firstIn', { needs: needs(e.firstIn) }) : '');
    let s = '<svg viewBox="0 0 ' + (X0 + 5 * G) + ' ' + (Y0 + 5 * G + 2) + '" role="group" aria-label="' + esc(t('ar.map.aria', { built: A.KNOWN.length, of: A.RECIPES })) + '">', marks = '';
    A.OPTIONS.carrier.forEach((c, i) => { s += '<text class="ax" x="' + (X0 + i * G + 2 * P - 2) + '" y="' + (Y0 - 6) + '" text-anchor="middle">' + esc(opt('carrier', c)) + '</text>'; });
    A.OPTIONS.told.forEach((o, j) => { s += '<text class="ax" x="' + (X0 - 4) + '" y="' + (Y0 + j * G + 2 * P + 2) + '" text-anchor="end">' + esc(opt('told', o)) + '</text>'; });
    for (const g of A.allRecipes()) {
      /* its column and row among all 400 (the arrows move by them), one square in the tab order: the current one */
      const c0 = A.OPTIONS.carrier.indexOf(g.carrier) * 4 + A.OPTIONS.where.indexOf(g.where), r0 = A.OPTIONS.told.indexOf(g.told) * 4 + A.OPTIONS.shape.indexOf(g.shape);
      const x = X0 + A.OPTIONS.carrier.indexOf(g.carrier) * G + A.OPTIONS.where.indexOf(g.where) * P, y = Y0 + A.OPTIONS.told.indexOf(g.told) * G + A.OPTIONS.shape.indexOf(g.shape) * P;
      const k = A.keyOf(g), kn = A.knownOf(g), here = at[k] || [], c = 'sq' + (kn ? ' k-' + kn.status : '') + (T.includes(k) ? ' tried' : '') + (k === me ? ' cur' : '');
      s += '<rect class="' + c + '" data-ar-pick="' + k + '" data-ar-c="' + c0 + '" data-ar-r="' + r0 + '"' + (here.length ? ' data-ar-lg="' + here.length + '"' : '') + ' tabindex="' + (k === me ? 0 : -1) + '" role="button" x="' + x + '" y="' + y + '" width="8.4" height="8.4" rx="1.6"><title>' +
        esc(recipeLine(g) + (kn ? ' · ' + t('ar.known.' + kn.id) : '') + here.map(e => '\n' + entryLine(e)).join('')) + '</title></rect>';
      if (!here.length) continue;
      /* a ring where the first attempt to win with this recipe stands (thicker when it was first in a niche nobody had won);
         a dot for people's attempts at the left, one for agents' at the right */
      const first = LG.square[k];
      if (first) marks += '<rect class="fw' + (pioneers.has(first) ? ' fn' : '') + (ARCH_AGENT(LG, first) ? ' a' : ' p') + '" data-ar-first="' + k + '" x="' + f1(x - 1.3) + '" y="' + f1(y - 1.3) + '" width="11" height="11" rx="2.6"/>';
      if (here.some(e => LG.people.includes(e))) marks += '<circle class="ld p" cx="' + f1(x + 2.5) + '" cy="' + f1(y + 5.9) + '" r="1.8"/>';
      if (here.some(e => LG.agents.includes(e))) marks += '<circle class="ld a" cx="' + f1(x + 5.9) + '" cy="' + f1(y + 5.9) + '" r="1.8"/>';
    }
    s += '<g class="armarks" aria-hidden="true">' + marks + '</g>';
    return '<div class="armap"><p class="kicker">' + esc(t('ar.map.kicker', { of: A.RECIPES })) + '</p><figure>' + s + '</svg><figcaption class="small muted arkey"><span class="k built"></span>' + esc(t('ar.map.built')) + ' <span class="k lab"></span>' + esc(t('ar.map.lab')) + ' <span class="k tried"></span>' + esc(t('ar.map.tried')) + ' <span class="k cur"></span>' + esc(t('ar.map.now')) +
      ' <span class="arkg"><span class="k lp"></span>' + esc(t('ar.map.people')) + '</span> <span class="arkg"><span class="k la"></span>' + esc(t('ar.map.agents')) + '</span> <span class="arkg"><span class="k fw"></span>' + esc(t('ar.map.first')) + '</span></figcaption></figure>' +
      '<p class="small muted">' + esc(t('ar.map.lead', { built: A.KNOWN.length, open: A.RECIPES - A.KNOWN.length })) + '</p><p class="small muted armapkeys">' + esc(t('ar.map.keys')) + '</p>' + firsts(LG) + '</div>';
  }
  /* the first to win each need, read from the ledger: who, people or agent, and the recipe (tap it to start from there) */
  function firsts(LG) {
    const W = world(S);
    return '<div class="arfirsts"><p class="kicker">' + esc(t('ar.lg.kicker')) + '</p><p class="small muted">' + esc(t('ar.lg.lead', { p: LG.people.length, a: LG.agents.length })) + '</p><ul>' + A.NEEDS.map(n => {
      const e = LG.first[n] ? W.byId[LG.first[n]] : null;
      if (!e) return '<li data-ar-need-first="' + n + '"><b>' + esc(t('ar.need.' + n)) + '</b><span class="small muted">' + esc(t('ar.lg.none')) + '</span></li>';
      return '<li data-ar-need-first="' + n + '" class="arwon ' + (LG.agents.includes(e) ? 'a' : 'p') + '"><b>' + esc(t('ar.need.' + n)) + '</b><button type="button" class="link" data-ar-pick="' + esc(e.facts.g) + '"><span class="made ' + esc(e.made) + '"></span>' +
        esc(e.by + ' · ' + t('build.kind.' + e.made) + ' · ' + gname(A.recipeOf(e.facts.g)) + ' · ' + t('ar.lg.years', { y: e.facts.years }) + (e.draft ? ' · ' + t('ledger.state.draft') : '')) + '</button></li>';
    }).join('') + '</ul></div>';
  }

  /* ---- the curve of attempts: your best need against the attempts so far, both on powers of ten ----
     Wright's law's shape: a straight line here, each doubling of the attempts making it better by the same factor.
     A dot where a need was won (others joined, and the attempts a year grew), a tick where you forked */
  function curve(s0) {
    const h = '<div class="arcurve"><p class="kicker">' + esc(t('ar.curve.kicker')) + '</p>';
    if (!A.novelty(s0.g) || !s0.log.length) return h + '<p class="small muted">' + esc(t(A.novelty(s0.g) ? 'ar.curve.empty' : 'ar.curve.today')) + '</p></div>';
    let sum = 0; const pts = s0.log.map(e => { sum += e.attempts; return { n: sum, v: Math.max(1e-4, e.best || 1e-4), fresh: e.fresh, year: e.year }; });
    const W = 320, H = 178, L0 = 40, R0 = 14, T0 = 16, B0 = 36;
    const nl = Math.floor(Math.log10(pts[0].n)), nh = Math.max(nl + 2, Math.ceil(Math.log10(pts[pts.length - 1].n) + 1e-9));
    const vs = pts.map(p => p.v), vl = Math.min(-1, Math.floor(Math.log10(Math.min(...vs)))), vh = Math.max(1, Math.ceil(Math.log10(Math.max(...vs)) + 1e-9));
    const X = n => L0 + (W - L0 - R0) * (Math.log10(n) - nl) / (nh - nl), Y = v => T0 + (H - T0 - B0) * (1 - (Math.log10(v) - vl) / (vh - vl));
    let g = '';
    for (let e = nl; e <= nh; e++) g += '<line class="gl" x1="' + f1(X(10 ** e)) + '" x2="' + f1(X(10 ** e)) + '" y1="' + T0 + '" y2="' + (H - B0) + '"/><text class="ax" x="' + f1(X(10 ** e)) + '" y="' + (H - B0 + 13) + '" text-anchor="middle">10<tspan class="exp" dy="-0.42em" font-size="72%">' + e + '</tspan></text>';
    for (let e = vl; e <= vh; e++) g += '<line class="gl" x1="' + L0 + '" x2="' + (W - R0) + '" y1="' + f1(Y(10 ** e)) + '" y2="' + f1(Y(10 ** e)) + '"/><text class="ax" x="' + (L0 - 5) + '" y="' + f1(Y(10 ** e) + 3) + '" text-anchor="end">×' + (e < 0 ? (10 ** e).toFixed(-e) : String(10 ** e)) + '</text>';
    g += '<line class="today" x1="' + L0 + '" x2="' + (W - R0) + '" y1="' + f1(Y(1)) + '" y2="' + f1(Y(1)) + '"/><text class="tl" x="' + (L0 + 4) + '" y="' + f1(Y(1) - 4) + '">' + esc(t('ar.race.today')) + '</text>';
    /* the forks on the line this recipe grew along: where the attempts stood when it was made */
    A.lineOf(tree()).filter(n => n.how === 'fork' && n.at > 0 && n.at <= pts.length).forEach(n => { const x = X(pts[n.at - 1].n);
      g += '<line class="fk" x1="' + f1(x) + '" x2="' + f1(x) + '" y1="' + T0 + '" y2="' + (H - B0) + '"/><text class="fkl" x="' + f1(x + 3) + '" y="' + (T0 + 8) + '">' + esc(t('ar.curve.fork')) + '</text>'; });
    const d = pts.map((p, i) => (i ? 'L' : 'M') + f1(X(p.n)) + ' ' + f1(Y(p.v))).join('');
    g += '<path class="cv" d="' + d + '"/>' + pts.map((p, i) => (p.fresh.length ? '<circle class="cw" cx="' + f1(X(p.n)) + '" cy="' + f1(Y(p.v)) + '" r="4.2"><title>' + esc(t('ar.curve.win', { y: p.year, need: p.fresh.map(x => t('ar.need.' + x)).join(t('ar.and')) })) + '</title></circle>' : i === pts.length - 1 ? '<circle class="cn" cx="' + f1(X(p.n)) + '" cy="' + f1(Y(p.v)) + '" r="3.4"/>' : '')).join('');
    g += '<text class="ay" x="' + L0 + '" y="10">' + esc(t('ar.curve.y')) + '</text><text class="ay" x="' + f1((L0 + W - R0) / 2) + '" y="' + (H - 3) + '" text-anchor="middle">' + esc(t('ar.curve.x')) + '</text>';
    return h + '<figure><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('ar.curve.aria', { n: Math.round(sum), v: pct(pts[pts.length - 1].v) })) + '">' + g + '</svg></figure>' +
      '<p class="small muted">' + esc(t('ar.curve.lead', { x: (+Math.pow(2, A.GROWTH).toFixed(2)).toString() })) + ' ' + fidMark({ f: 'figures', fact: A.GROWTH_FACT }) + '</p></div>';
  }

  /* ---- keep this attempt in the ledger: once a recipe nobody has grown is grown a year; the slip of the draft while
     the attempt is the one kept, the form again once it has grown on ---- */
  function keepBox(s0) {
    const h = hist(); if (!A.novelty(s0.g) || !s0.year || !h) return '';
    const kept = view.arSlip && draftOf(S, view.arSlip) && view.arSlipKey === slipKey(h), wins = A.winsOf(s0);
    if (kept) return '<div class="arkept">' + slipHtml(S, view.arSlip) + '</div>';
    const lead = wins.length ? t('ar.keep.lead', { needs: wins.map(n => t('ar.need.' + n)).join(t('ar.and')), y: s0.year }) : t('ar.keep.leadNone', { y: s0.year });
    return '<div class="keep arkeep"><p class="kicker">' + esc(t('ar.keep.kicker')) + '</p><p class="small muted">' + esc(lead) + '</p>' + signHtml(S) +
      (view.arNo ? '<p class="small bad">' + esc(view.arNo) + '</p>' : '') + '<button type="button" class="btn" data-ar-keep>' + esc(t('ar.keep')) + '</button></div>';
  }

  /* ---- the family tree: every start and fork of the visit; tap one to start again from it ----
     A node is its recipe as a glyph (four squares: where it computes and what carries a value above, how it is told
     and its shape below, lit where it differs from today's computer), the year it was made under it and the needs it
     won. Desktop: the tree drawn; a phone: the same as a list */
  function glyph(key, x, y, z) {
    const g = A.recipeOf(key), q = z / 2 - 1;
    return A.GENES.map((k, i) => '<rect class="gq' + (g[k] !== A.TODAY[k] ? ' on' : '') + '" x="' + f1(x + (i % 2) * (q + 2)) + '" y="' + f1(y + Math.floor(i / 2) * (q + 2)) + '" width="' + f1(q) + '" height="' + f1(q) + '" rx="1.4"/>').join('');
  }
  function treeFig(s0) {
    const T = tree(), kids = {}, pos = {}, line = new Set(A.lineOf(T).map(n => n.id));
    T.nodes.forEach(n => { const p = n.from == null ? 'root' : n.from; (kids[p] = kids[p] || []).push(n); });
    let row = 0, deep = 0;
    const walk = (n, d) => { pos[n.id] = [d, row]; deep = Math.max(deep, d); const ks = kids[n.id] || []; if (!ks.length) row++; ks.forEach(k => walk(k, d + 1)); };
    (kids.root || []).forEach(n => walk(n, 0));
    const CW = 58, RH = 40, Z = 16, W = 20 + (deep + 1) * CW, H = row * RH + 6, at = id => [14 + pos[id][0] * CW + Z / 2, 14 + pos[id][1] * RH];
    const made = n => (n.how === 'fork' ? t('ar.tree.at', { y: n.at }) : t('ar.tree.' + n.how));
    const won = n => (n.won.length ? t('ar.tree.won', { needs: n.won.map(x => t('ar.need.' + x)).join(t('ar.and')) }) : '');
    const label = n => gname(A.recipeOf(n.g)) + ' · ' + made(n) + (n.won.length ? ' · ' + won(n) : '');
    let e = '', v = '';
    T.nodes.forEach(n => { if (n.from == null || !pos[n.from]) return; const [px, py] = at(n.from), [cx, cy] = at(n.id), mx = px + Z / 2 + (CW - Z) / 2;
      e += '<path class="te' + (n.how === 'back' ? ' tback' : '') + (line.has(n.id) && line.has(n.from) ? ' on' : '') + '" d="M' + f1(px + Z / 2) + ' ' + py + 'H' + f1(mx) + 'V' + cy + 'H' + f1(cx - Z / 2 - 1) + '"/>'; });
    T.nodes.forEach(n => { const [cx, cy] = at(n.id), cur = n.id === T.cur;
      v += '<g class="tn' + (cur ? ' cur' : '') + '" data-ar-node="' + n.id + '" tabindex="0" role="button" aria-label="' + esc(label(n)) + '"' + (cur ? ' aria-current="true"' : '') + '><title>' + esc(label(n)) + '</title>' +
        '<rect class="tring" x="' + f1(cx - Z / 2 - 3) + '" y="' + (cy - Z / 2 - 3) + '" width="' + (Z + 6) + '" height="' + (Z + 6) + '" rx="5"/>' + glyph(n.g, cx - Z / 2, cy - Z / 2, Z) +
        '<text class="tl" x="' + f1(cx) + '" y="' + (cy + Z / 2 + 11) + '" text-anchor="middle">' + esc(n.how === 'fork' ? t('ar.tree.y', { y: n.at }) : t('ar.tree.' + n.how + '.s')) + (n.won.length ? ' ✓' + n.won.length : '') + '</text></g>'; });
    const list = '<ol class="artlist">' + T.nodes.map(n => '<li style="--d:' + pos[n.id][0] + '"><button type="button" class="arti2' + (n.id === T.cur ? ' cur' : '') + '" data-ar-node="' + n.id + '"' + (n.id === T.cur ? ' aria-current="true"' : '') + '><svg viewBox="0 0 16 16" aria-hidden="true">' + glyph(n.g, 0, 0, 16) + '</svg><span><b>' + esc(gname(A.recipeOf(n.g))) + '</b><span class="small muted">' + esc(made(n)) + (n.won.length ? ' · ' : '') + '</span>' + (n.won.length ? '<span class="small good">' + esc(won(n)) + '</span>' : '') + '</span></button></li>').join('') + '</ol>';
    return '<div class="artree"><p class="kicker">' + esc(t('ar.tree.kicker', { n: T.nodes.length })) + '</p><p class="small muted">' + esc(t('ar.tree.lead')) + '</p>' +
      '<figure class="artfig"><svg viewBox="0 0 ' + W + ' ' + H + '" style="width:' + Math.round(W * 1.5) + 'px" role="group" aria-label="' + esc(t('ar.tree.aria', { n: T.nodes.length })) + '">' + e + v + '</svg></figure>' + list + '</div>';
  }

  function truth() {
    const rows = [['grow', fidMark({ f: 'figures', fact: A.GROWTH_FACT })], ['genes', fidMark({ f: 'idea' })], ['fixed', fidMark({ f: 'figures', fact: A.FIXED_FACT })], ['built', ['product', 'lab'].map(k => '<span class="arst s-' + k + '">' + TRUTH[k] + esc(t('ar.st.' + k)) + '</span>').join('')]];
    return '<div class="artrue"><p class="kicker">' + esc(t('ar.true.kicker')) + '</p>' + rows.map(([k, m]) => '<div class="artr2"><span>' + esc(t('ar.true.' + k)) + '</span><span class="artm">' + m + '</span></div>').join('') + '</div>';
  }

  /* what happened, in one line */
  function sayLine() {
    const [k, p] = view.arSay || ['start', {}];
    return t('ar.say.' + k, Object.assign({}, p));
  }

  function bench() {
    /* a stepping stone won since this architecture began (in a lab its card led to) comes back with you */
    const was = st(), br = brought(), fresh = Object.keys(br).filter(d => !(was.stones || {})[d]);
    if (fresh.length) { view.ar = A.bring(was, br); say('stone', { what: stoneName(br[fresh[0]]), dir: t('ar.dir.' + fresh[0]) });
      if (!was.year) restart(); else fresh.forEach(d => change({ at: was.year, stone: br[d] })); }
    tree();
    KEEP[ch.id] = Object.fromEntries(KEPT_KEYS.map(k => [k, view[k]]));
    const s0 = st(), sc = A.scoreOf(s0), G = A.goalOf(s0, goalId);
    let h = head() + '<p class="small arintro">' + esc(t('ar.intro')) + '</p>' + goalbox(s0) + figure(s0, sc);
    h += '<p class="small arsay" data-ar-yearnow="' + s0.year + '">' + esc(sayLine()) + '</p>';
    h += recipe(s0) + traits(s0.g) + dirs(s0) + curve(s0) + keepBox(s0) + agents(s0) + treeFig(s0);
    if (!G.met) h += view.hint ? '<p class="small hint">' + esc(t('ar.hint.' + goalId)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + esc(t('ar.done.' + goalId)) + '</p>';
    h += mapFig(s0) + truth() + '<p class="small muted arnote">' + esc(t('ar.note')) + '</p>';
    return h + doneNote() + reward();
  }

  /* after every move: what it did, then whether a goal is met */
  function after() {
    const s0 = st(); if (A.novelty(s0.g)) { const k = A.keyOf(s0.g); if (!tried().includes(k)) tried().push(k); }
    if (A.goalOf(s0, goalId).met) win();
    draw(); fx(); return true;
  }
  /* a new start or a gene chosen before the first year: say where the recipe starts */
  function sayStart() {
    const s0 = st(), sc = A.scoreOf(s0), kn = A.knownOf(s0.g);
    if (!A.novelty(s0.g)) return say('start');
    if (kn) return say('known', { name: t('ar.known.' + kn.id) });
    const n = bestNeed(sc);
    if (!(sc[n].could > 0) || sc[n].could < 1) return say('newNone');
    say('new', { need: t('ar.need.' + n), v: pct(sc[n].now), could: times(sc[n].could) });
  }
  function years(n) {
    let s0 = st(); const G = A.GOALS[goalId];
    if (s0.year >= G.years && !A.goalOf(s0, goalId).met) { say('late'); return after(); }
    const F = focus().slice();
    for (let i = 0; i < n && s0.year < G.years; i++) { const h = hist(); s0 = A.year(s0, F); if (h) h.years.push(F.slice()); view.arTree = A.treeYear(tree(), A.winsOf(s0)); if (A.goalOf(s0, goalId).met) break; }
    view.ar = s0; view.arForks = null;
    const sc = A.scoreOf(s0), lastFresh = s0.log.slice(-n).flatMap(e => e.fresh), wins = A.winsOf(s0);
    const n0 = wins.length ? wins.reduce((m, x) => (sc[x].now > sc[m].now ? x : m), wins[0]) : bestNeed(sc, 'now');
    if (!A.novelty(s0.g)) say('todayYear', { y: s0.year });
    else if (lastFresh.length) say('win', { y: s0.year, need: t('ar.need.' + lastFresh[lastFresh.length - 1]), p: Math.round(s0.people) });
    else if (!F.length) say('idle', { y: s0.year });
    else if (s0.year >= G.years && !A.goalOf(s0, goalId).met) say('late');
    else say('year', { y: s0.year, n: Math.round(s0.log.slice(-n).reduce((a, e) => a + e.attempts, 0)), dirs: F.map(d => t('ar.dir.' + d)).join(t('ar.and')), need: t('ar.need.' + n0), v: pct(sc[n0].now) });
    return after();
  }

  return {
    draw: bench,
    click(e) {
      const q = s => e.target.closest(s);
      const gb = q('[data-ar-gene]');
      if (gb) {
        const s0 = st(), k = gb.dataset.arGene, o = gb.dataset.arOpt; if (s0.g[k] === o) return true;
        const lost = s0.year ? A.LINK[k].filter(d => s0.tries[d] > 0) : [];
        if (s0.year) hist();
        view.ar = A.choose(s0, k, o); view.arForks = null;
        if (s0.year) change({ at: s0.year, gene: k, option: o }); else restart();
        view.arTree = s0.year ? A.treeFork(tree(), view.ar.g, s0.year) : A.treeStart(tree(), view.ar.g);
        if (s0.year) say(lost.length ? 'fork' : 'forkFree', { gene: t('ar.gene.' + k), option: opt(k, o), dirs: lost.map(d => t('ar.dir.' + d)).join(t('ar.and')) }); else sayStart();
        return after();
      }
      const d = q('[data-ar-dir]');
      if (d) { const F = focus(), id = d.dataset.arDir, i = F.indexOf(id); if (i >= 0) F.splice(i, 1); else { F.push(id); while (F.length > A.FOCUS_MAX) F.shift(); } draw(); return true; }
      const y = q('[data-ar-year]'); if (y) return years(+y.dataset.arYear || 1);
      if (q('[data-ar-reset]')) { view.ar = begin(st().g); view.arForks = null; restart(); view.arTree = A.treeStart(tree(), view.ar.g, tree().cur); sayStart(); return after(); }
      if (q('[data-ar-ask]')) { view.arForks = A.agentForks(st()); draw(); return true; }
      const f = q('[data-ar-fork]');
      if (f) { const [k, o] = f.dataset.arFork.split(':'), s0 = st(), lost = A.LINK[k].filter(x => s0.tries[x] > 0); hist(); view.ar = A.forkOf(s0, k, o); change({ at: s0.year, gene: k, option: o }); view.arForks = null; view.arTree = A.treeFork(tree(), view.ar.g, s0.year); say(lost.length ? 'fork' : 'forkFree', { gene: t('ar.gene.' + k), option: opt(k, o), dirs: lost.map(x => t('ar.dir.' + x)).join(t('ar.and')) }); return after(); }
      /* keep this attempt: signed, checked against the ledger (grown again there), kept as your draft with its slip */
      if (q('[data-ar-keep]')) {
        const h = hist(), s0 = st(); if (!h) return true;
        const k = keep(S, { kind: 'try', arch: A.histClaim(h, A.winsOf(s0)), words: '' }, 'arch ' + A.keyOf(s0.g).split('/').join(' '), signOf(el.querySelector('.arkeep') || el));
        view.arNo = k.ok ? null : refusal(k.r); if (k.ok) { view.arSlip = k.e.id; view.arSlipKey = slipKey(h); save(); if (L.ctx && L.ctx.kept) L.ctx.kept(k.e); }
        draw(); if (show) show('.arkept .slip, .arkeep'); return true;
      }
      if (slipClick(e, S, redraw => { save(); if (redraw) { view.arSlip = null; draw(); } })) return true;
      const p = q('[data-ar-pick]');
      if (p) { view.ar = begin(A.recipeOf(p.dataset.arPick)); view.arForks = null; restart(); view.arTree = A.treeStart(tree(), view.ar.g); sayStart(); return after(); }
      /* a node of the family tree: a new start from that recipe, a branch of the tree from it */
      const nd = q('[data-ar-node]');
      if (nd) { const n = A.nodeOf(tree(), +nd.dataset.arNode); if (!n) return true; view.ar = begin(A.recipeOf(n.g)); view.arForks = null; restart(); view.arTree = A.treeStart(tree(), view.ar.g, n.id); say('back', { name: gname(view.ar.g) }); return after(); }
      return false;
    },
    input() { return false; }
  };
}
