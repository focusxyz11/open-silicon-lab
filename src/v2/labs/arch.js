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
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as A from '../../engines/arch.js';
import { mark as fidMark, TRUTH } from '../fid.js';
import { still } from '../../core/ui.js';

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

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const goalId = A.GOALS[ch.id] ? ch.id : 'archniche';
  const st = () => view.ar || (view.ar = A.start(A.TODAY));
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
    for (let d = -2; d <= 2; d++) s += '<line class="gl" x1="' + f1(RX0 + DEC * (d + 2)) + '" x2="' + f1(RX0 + DEC * (d + 2)) + '" y1="' + (RY0 - 8) + '" y2="' + (RY0 + 5 * RDY + 6) + '"/><text class="ax" x="' + f1(RX0 + DEC * (d + 2)) + '" y="' + (RY0 + 5 * RDY + 20) + '" text-anchor="middle">×' + ['0.01', '0.1', '1', '10', '100'][d + 2] + '</text>';
    A.NEEDS.forEach((n, i) => {
      const r = sc[n], y = RY0 + i * RDY;
      s += '<text class="nl' + (r.wins ? ' beat' : '') + '" x="8" y="' + (y + 4) + '">' + (r.wins ? '✓ ' : '') + esc(t('ar.need.' + n)) + '</text>';
      s += '<rect class="track" x="' + RX0 + '" y="' + (y - 4.5) + '" width="' + (RX1 - RX0) + '" height="9" rx="4.5"/>';
      if (!r.can) { s += '<text class="cant" x="' + (RX0 + 6) + '" y="' + (y + 3.5) + '">' + esc(t('ar.cant', { what: A.missesOf(g, n).map(k => t('ar.cant.' + k)).join(', ') })) + '</text>'; return; }
      const w = Math.max(3, rx(r.now) - RX0);
      s += '<rect class="bar' + (r.wins ? ' beat' : '') + '" x="' + RX0 + '" y="' + (y - 4.5) + '" height="9" rx="4.5" style="width:' + f1(w) + 'px" width="' + f1(w) + '"/>';
      if (A.novelty(g)) s += '<path class="could' + (r.could >= 1 ? ' over' : '') + '" d="M' + f1(rx(r.could)) + ' ' + (y - 6) + 'l5 6l-5 6l-5 -6z"/>';
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
  function dirs(s0) {
    const M = A.maturityOf(s0), F = focus(), sg = A.novelty(s0.g) ? A.suggest(s0, goalId) : null;
    return '<div class="ardirs"><p class="kicker">' + esc(t('ar.dirs.kicker')) + '</p>' +
      (sg ? '<p class="small arsug">' + esc(t('ar.sug', { need: t('ar.need.' + sg.need), dirs: sg.dirs.map(d => t('ar.dir.' + d)).join(t('ar.and')) })) + '</p>' : '') + '<div class="ardirgrid">' + ORDER.map(d => {
      const on = F.includes(d), people = d === 'people', best = sg ? sg.dirs.indexOf(d) + 1 : 0;
      const val = people ? Math.round(s0.people) : Math.round(M[d] * 100), bar = people ? Math.min(1, Math.log10(s0.people) / 3) : M[d];
      return '<button type="button" class="ardir' + (people ? ' ppl' : '') + (best ? ' best' : '') + '" data-ar-dir="' + d + '"' + (best ? ' data-ar-best="' + best + '"' : '') + ' aria-pressed="' + on + '"><span class="ardn"><b>' + esc(t('ar.dir.' + d)) + '</b><span class="mono">' + (people ? val : val + '%') + '</span></span>' +
        '<span class="small muted">' + esc(people ? t('ar.dir.people.d', { n: Math.round(s0.people * A.ATTEMPTS) }) : t('ar.dir.' + d + '.d')) + '</span><span class="gbar"><span style="width:' + (bar * 100).toFixed(0) + '%"></span></span></button>';
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
    let s = '<svg viewBox="0 0 ' + (X0 + 5 * G) + ' ' + (Y0 + 5 * G + 2) + '" role="img" aria-label="' + esc(t('ar.map.aria', { built: A.KNOWN.length, of: A.RECIPES })) + '">';
    A.OPTIONS.carrier.forEach((c, i) => { s += '<text class="ax" x="' + (X0 + i * G + 2 * P - 2) + '" y="' + (Y0 - 6) + '" text-anchor="middle">' + esc(opt('carrier', c)) + '</text>'; });
    A.OPTIONS.told.forEach((o, j) => { s += '<text class="ax" x="' + (X0 - 4) + '" y="' + (Y0 + j * G + 2 * P + 2) + '" text-anchor="end">' + esc(opt('told', o)) + '</text>'; });
    for (const g of A.allRecipes()) {
      const x = X0 + A.OPTIONS.carrier.indexOf(g.carrier) * G + A.OPTIONS.where.indexOf(g.where) * P, y = Y0 + A.OPTIONS.told.indexOf(g.told) * G + A.OPTIONS.shape.indexOf(g.shape) * P;
      const k = A.keyOf(g), kn = A.knownOf(g), c = 'sq' + (kn ? ' k-' + kn.status : '') + (T.includes(k) ? ' tried' : '') + (k === me ? ' cur' : '');
      s += '<rect class="' + c + '" data-ar-pick="' + k + '" x="' + x + '" y="' + y + '" width="8.4" height="8.4" rx="1.6"><title>' + esc(recipeLine(g) + (kn ? ' · ' + t('ar.known.' + kn.id) : '')) + '</title></rect>';
    }
    return '<div class="armap"><p class="kicker">' + esc(t('ar.map.kicker', { of: A.RECIPES })) + '</p><figure>' + s + '</svg><figcaption class="small muted arkey"><span class="k built"></span>' + esc(t('ar.map.built')) + ' <span class="k lab"></span>' + esc(t('ar.map.lab')) + ' <span class="k tried"></span>' + esc(t('ar.map.tried')) + ' <span class="k cur"></span>' + esc(t('ar.map.now')) + '</figcaption></figure>' +
      '<p class="small muted">' + esc(t('ar.map.lead', { built: A.KNOWN.length, open: A.RECIPES - A.KNOWN.length })) + '</p></div>';
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
    const s0 = st(), sc = A.scoreOf(s0), G = A.goalOf(s0, goalId);
    let h = head() + '<p class="small arintro">' + esc(t('ar.intro')) + '</p>' + goalbox(s0) + figure(s0, sc);
    h += '<p class="small arsay" data-ar-yearnow="' + s0.year + '">' + esc(sayLine()) + '</p>';
    h += recipe(s0) + traits(s0.g) + dirs(s0) + agents(s0);
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
    for (let i = 0; i < n && s0.year < G.years; i++) { s0 = A.year(s0, F); if (A.goalOf(s0, goalId).met) break; }
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
        view.ar = A.choose(s0, k, o); view.arForks = null;
        if (s0.year) say(lost.length ? 'fork' : 'forkFree', { gene: t('ar.gene.' + k), option: opt(k, o), dirs: lost.map(d => t('ar.dir.' + d)).join(t('ar.and')) }); else sayStart();
        return after();
      }
      const d = q('[data-ar-dir]');
      if (d) { const F = focus(), id = d.dataset.arDir, i = F.indexOf(id); if (i >= 0) F.splice(i, 1); else { F.push(id); while (F.length > A.FOCUS_MAX) F.shift(); } draw(); return true; }
      const y = q('[data-ar-year]'); if (y) return years(+y.dataset.arYear || 1);
      if (q('[data-ar-reset]')) { view.ar = A.start(st().g); view.arForks = null; sayStart(); return after(); }
      if (q('[data-ar-ask]')) { view.arForks = A.agentForks(st()); draw(); return true; }
      const f = q('[data-ar-fork]');
      if (f) { const [k, o] = f.dataset.arFork.split(':'), s0 = st(), lost = A.LINK[k].filter(x => s0.tries[x] > 0); view.ar = A.forkOf(s0, k, o); view.arForks = null; say(lost.length ? 'fork' : 'forkFree', { gene: t('ar.gene.' + k), option: opt(k, o), dirs: lost.map(x => t('ar.dir.' + x)).join(t('ar.and')) }); return after(); }
      const p = q('[data-ar-pick]');
      if (p) { const [where, carrier, told, shape] = p.dataset.arPick.split('/'); view.ar = A.start({ where, carrier, told, shape }); view.arForks = null; sayStart(); return after(); }
      return false;
    },
    input() { return false; }
  };
}
