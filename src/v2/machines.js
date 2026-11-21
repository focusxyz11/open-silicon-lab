/* Machines from shared blocks (#/machines, #/machines/<need>; docs/MACHINES.md). No standard computer: pick a need,
   and a machine is a few shared blocks joined by one grammar, each block in the form that need calls for (software,
   circuit or new matter). Change a form and see what it costs and keeps; let an agent assemble it, and decide.
   Beyond today's chip: new matter is a kind of matter that may not exist yet (memory that computes, light, spikes,
   reversible logic, living cells), and each rests on claims that say how sure they are; the energy is a range, physics
   sets the floor, and the agent counts guesses only when told to.
   The blocks, the grammar and the needs: src/data/blocks.js; the kinds of new matter: src/data/inventions.js; the
   checks, the scores and the agent: src/engines/machine.js; how each block is checked: the community's plan
   (src/engines/build.js).

   Liquid hardware: a block can also be a fabric rewired after it is made (src/data/liquid.js), exact like a circuit and
   changeable like software; a map shows how fast each part can reshape against what it costs, and a need whose job
   keeps changing draws the line its parts must beat.
   Fab on a desk: where the made parts are made (src/data/fabs.js) sets how many days one try takes. Moore's law for
   ideas: every attempt kept for a need joins the lab's curve (src/engines/ledger.js labCurve), the best so far against
   the attempts so far; an attempt of yours is kept as a draft with its slip (src/v2/commons.js), like any entry.

   machines(el, ctx) draws into el and keeps its own state; ctx: { need, go(need), FACT (facts.json by id, optional),
   and, to keep attempts (optional): world() (the ledger with your drafts), keep(need, plan, el), slip(id),
   slipClick(ev, done), refusal(r), signHtml() }. */
import { t, fmtNum } from '../core/i18n.js';
import { BLOCKS, NEEDS, FORMS, blockOf, needOf } from '../data/blocks.js';
import { mattersFor } from '../data/inventions.js';
import { liquidsFor, liquidOf, FALLBACK } from '../data/liquid.js';
import * as M from '../engines/machine.js';
import { plan as buildPlan } from '../engines/build.js';
import { FABS, fabOf } from '../data/fabs.js';
import { labCurve } from '../engines/ledger.js';
import { readHtml } from './frame2.js';

const REPO = 'https://github.com/focusxyz11/open-silicon-lab/blob/main/';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* the three families drawn as one small mark each: a circuit solid, software dashed, new matter a hexagon */
const MARK = {
  circuit: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/></svg>',
  software: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.75" y="1.75" width="14.5" height="14.5" rx="3"/></svg>',
  matter: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><polygon points="1,9 5,2 13,2 17,9 13,16 5,16"/></svg>',
  liquid: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 1.5C9 1.5 3 8.2 3 11.6a6 6 0 0 0 12 0C15 8.2 9 1.5 9 1.5z"/></svg>'
};
/* the kinds a family offers a block: kinds of new matter, or liquid fabrics */
const kindsOf = (k, blockId) => (k === 'matter' ? mattersFor(blockId) : k === 'liquid' ? liquidsFor(blockId) : []);
const kindName = (k, id) => t((k === 'matter' ? 'invent.matter.' : 'liquid.kind.') + id + '.t');
const markOf = f => MARK[M.familyOf(f)] || '';
const fam = f => 'f-' + M.familyOf(f);
const times = x => (x >= 10 ? fmtNum(Math.round(x)) : fmtNum(x, x < 0.01 ? { maximumSignificantDigits: 1 } : { maximumFractionDigits: x < 1 ? 2 : 1 })) + '×';
const span = s => (Math.abs(s.low - s.high) / s.high < 0.005 ? times(s.high) : times(s.low) + ' – ' + times(s.high));
const days = (lo, hi) => (!isFinite(lo) ? t('machines.ui.never') : lo === hi || !isFinite(hi) ? fmtNum(lo) + (isFinite(hi) ? '' : '+') : fmtNum(lo) + '–' + fmtNum(hi));
const frac = v => (v >= 1 ? '1' : '1/' + fmtNum(Math.round(1 / v)));
/* a place to make parts, drawn as one small mark: a giant fab, a small one, a roll of film, a desk */
const FABMARK = {
  giant: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M2 22V10l7 4V10l7 4V10l7 4V3h6v19z"/></svg>',
  small: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><rect x="5" y="9" width="8" height="13" rx="1.5"/><rect x="15" y="9" width="8" height="13" rx="1.5"/><path d="M5 6h18"/></svg>',
  flexible: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 15c5-9 9 9 14 0s9-9 12 0"/><path d="M3 20c5-9 9 9 14 0s9-9 12 0"/></svg>',
  desk: '<svg class="fmark" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 13h26M6 13v9M26 13v9"/><rect x="11" y="5" width="10" height="8" rx="1.5"/></svg>'
};
const formName = f => (M.matterIn(f) ? t('invent.matter.' + M.matterIn(f).id + '.t') : M.liquidIn(f) ? t('liquid.kind.' + M.liquidIn(f).id + '.t') : t('machines.form.' + f));
/* a time in seconds, in words */
const secs = x => (!isFinite(x) ? t('liquid.tick.never') : x < 1e-6 ? t('liquid.time.ns', { n: fmtNum(+(x * 1e9).toPrecision(2)) }) : x < 1e-3 ? t('liquid.time.us', { n: fmtNum(+(x * 1e6).toPrecision(3)) }) : x < 1 ? t('liquid.time.ms', { n: fmtNum(+(x * 1e3).toPrecision(3)) }) : t('liquid.time.s', { n: fmtNum(+x.toPrecision(2)) }));

export function machines(el, ctx) {
  const id = needOf(ctx.need) ? ctx.need : NEEDS[0].id, need = needOf(id);
  const view = { plan: M.startPlan(id), agent: null, guesses: false, kept: null, keepErr: '' };
  let P = null; try { P = buildPlan(); } catch (e) { P = null; }
  const partName = p => t('machines.role.' + id + '.' + p);

  function needsHtml() {
    return '<div class="mneeds" role="tablist">' + NEEDS.map(n => '<button type="button" role="tab" data-mneed="' + n.id + '" aria-selected="' + (n.id === id) + '"><b>' + esc(t('machines.need.' + n.id + '.t')) + '</b><span class="small">' + esc(t('machines.need.' + n.id + '.d')) + '</span></button>').join('') + '</div>' +
      '<p class="small mwhy">' + esc(t('machines.need.' + id + '.why')) + '</p>';
  }
  function partHtml(p, m) {
    const b = blockOf(p.block), f = view.plan[p.id], forms = M.formsOf(b.id), fm = M.familyOf(f), kinds = kindsOf(fm, b.id);
    const bad = m.check.breaks.some(x => x.part === p.id) || m.meets.misses.some(x => x.part === p.id);
    const famBtn = k => { const ks = kindsOf(k, b.id), multi = k === 'matter' || k === 'liquid', on = fm === k, has = multi ? ks.length > 0 : forms.includes(k), to = multi ? (on ? f : k + ':' + (ks[0] || {}).id) : k;
      return '<button type="button" class="f-' + k + '" data-mform="' + p.id + ':' + to + '" aria-pressed="' + on + '"' + (has ? '' : ' disabled') + ' title="' + esc(t('machines.form.' + k)) + '">' + MARK[k] + '<span class="sr">' + esc(t('machines.form.' + k)) + '</span></button>'; };
    let h = '<div class="mpart' + (bad ? ' bad' : '') + '"><div class="mtile ' + fam(f) + '">' + markOf(f) + '<span><b>' + esc(partName(p.id)) + '</b><span class="small muted">' + esc(t('machines.block.' + b.id + '.t')) + ' · ' + esc(formName(f)) + '</span></span></div>' +
      '<div class="mforms" role="group" aria-label="' + esc(partName(p.id)) + '">' + FORMS.map(famBtn).join('') + '</div>';
    if (kinds.length > 1) h += '<div class="mkinds k-' + fm + '" role="group" aria-label="' + esc(t('machines.form.' + fm)) + '">' + kinds.map(k => '<button type="button" data-mform="' + p.id + ':' + fm + ':' + k.id + '" aria-pressed="' + (f === fm + ':' + k.id) + '">' + esc(kindName(fm, k.id)) + '</button>').join('') + '</div>';
    return h + '</div>';
  }
  /* a machine its fab cannot make has no days a try */
  const unmade = m => m.check.breaks.some(x => x.rule === 'fab');
  function scoreHtml(m) {
    const s = Object.assign({}, m.score), list = [];
    if (unmade(m)) Object.assign(s, { daysLow: Infinity, daysHigh: Infinity, tries: 0 });
    m.check.breaks.forEach(x => list.push('<li class="bad">' + esc(t('machines.rule.' + x.rule, { part: partName(x.part) })) + '</li>'));
    m.meets.misses.forEach(x => list.push('<li class="bad">' + esc(t('machines.miss.' + x.rule, { part: partName(x.part) })) + '</li>'));
    if (m.check.ok) list.unshift('<li class="good">' + esc(t('machines.ui.grammarOk')) + '</li>');
    if (m.check.ok && m.meets.ok) list.push('<li class="good">' + esc(t('machines.ui.meetsOk')) + '</li>');
    return '<div class="mscore"><div class="mread"><b>' + esc(span(s)) + '</b><span class="small">' + esc(t('machines.ui.energy')) + '</span></div>' +
      '<div class="mread"><b>' + s.changes + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.changes')) + '</span></div>' +
      '<div class="mread"><b>' + s.exact + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.exact')) + '</span></div>' +
      '<div class="mread"><b>' + esc(days(s.daysLow, s.daysHigh)) + '</b><span class="small">' + esc(t('machines.ui.days')) + (s.tries ? ' · ' + esc(t('machines.ui.tries', { n: fmtNum(Math.round(s.tries)) })) : '') + '</span></div></div><ul class="mchecks">' + list.join('') + '</ul>';
  }
  /* beyond today's chip: the claims behind every part made of new matter */
  function inventHtml(m) {
    const parts = need.parts.filter(p => M.matterIn(view.plan[p.id]));
    let h = '<section class="minvent"><p class="kicker">' + esc(t('invent.ui.kicker')) + '</p><p class="small muted">' + esc(t('invent.ui.lead')) + '</p>';
    if (!parts.length) return h + '<p class="small">' + esc(t('invent.ui.none')) + '</p></section>';
    parts.forEach(p => {
      const k = M.matterIn(view.plan[p.id]), c = M.costOf(view.plan[p.id], need);
      h += '<div class="mclaims"><p><b>' + esc(partName(p.id)) + ' · ' + esc(t('invent.matter.' + k.id + '.t')) + '</b> <span class="small muted">' + esc(t('invent.matter.' + k.id + '.d')) + '</span></p>' +
        '<p class="small mrange">' + esc(t('invent.ui.range', { low: times(c.low), high: times(c.high) })) + '</p><ul>' + k.claims.map(cl => {
          const f = cl.fact && ctx.FACT && ctx.FACT[cl.fact], src = f && f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a>' : cl.engine ? '<a href="' + esc(REPO + cl.engine) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.engine')) + '</a>' : '';
          return '<li class="k-' + cl.kind + '"><span class="mst s-' + cl.status + '">' + esc(t('invent.status.' + cl.status)) + '</span><span>' + esc(t('invent.claim.' + cl.id)) + (src ? ' <span class="small">' + src + '</span>' : '') + '</span></li>';
        }).join('') + '</ul>' + (m.score.walls.includes(p.id) ? '<p class="small mwall">' + esc(t('invent.wall.floor')) + '</p>' : '') + '</div>';
    });
    return h + '</section>';
  }
  /* fab on a desk: where the made parts are made, and how long a try takes there */
  function fabHtml(m) {
    const cur = view.plan.fab || M.START_FAB, F = fabOf(cur), none = !M.made(need, view.plan).length;
    const grown = need.parts.some(p => (M.matterIn(view.plan[p.id]) || {}).grown);
    let h = '<section class="mfab"><p class="kicker">' + esc(t('fab.ui.kicker')) + '</p><p class="small muted">' + esc(t('fab.ui.lead')) + '</p><div class="mfabs" role="group" aria-label="' + esc(t('fab.ui.kicker')) + '">' +
      FABS.map(f => {
        const d = M.daysOf(f.id), dc = f.claims.find(c => c.kind === 'days'), su = M.setupOf(f.id);
        return '<button type="button" data-mfab="' + f.id + '" aria-pressed="' + (f.id === cur) + '">' + FABMARK[f.id] + '<b>' + esc(t('fab.name.' + f.id + '.t')) + '</b>' +
          '<span class="small"><span class="mst s-' + dc.status + '">' + esc(t('invent.status.' + dc.status)) + '</span> ' + esc(isFinite(d.high) ? t('fab.ui.days', { low: fmtNum(d.low), high: fmtNum(d.high) }) : t('fab.ui.guessDays', { low: fmtNum(d.low) + '–' + fmtNum(dc.value[1]) })) + '</span>' +
          (su ? '<span class="small muted">' + esc(t('fab.ui.setup', { x: su.value.map(frac).join('–') })) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    if (none) h += '<p class="small mfabnone">' + esc(t('fab.ui.none')) + '</p>';
    if (grown) h += '<p class="small mfabnone">' + esc(t('fab.ui.grown')) + '</p>';
    h += '<div class="mclaims"><p><b>' + esc(t('fab.name.' + cur + '.t')) + '</b> <span class="small muted">' + esc(t('fab.name.' + cur + '.d')) + ' ' + esc(t('fab.ui.makes', { list: F.makes.map(formName).join(', ') })) + '</span></p><ul>' + F.claims.map(cl => {
      const f = cl.fact && ctx.FACT && ctx.FACT[cl.fact], src = f && f.url ? ' <span class="small"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a></span>' : '';
      return '<li class="k-note"><span class="mst s-' + cl.status + '">' + esc(t('invent.status.' + cl.status)) + '</span><span>' + esc(t('fab.claim.' + cl.id)) + src + '</span></li>';
    }).join('') + '</ul>' + (cur !== 'giant' ? '<p class="small muted">' + esc(t('fab.ui.note')) + '</p>' : '') + '</div></section>';
    return h;
  }
  /* liquid hardware: how fast each part can reshape against what it costs, the line a changing job draws, and the
     claims behind every fabric in use */
  function liquidMap(m) {
    const W = 600, H = 210, L = 46, R = 12, T = 14, B = 34, G = view.guesses;
    const X = s => (!isFinite(s) ? L + 10 : L + 40 + (W - L - R - 50) * (8 - Math.log10(s)) / 17), Y = e => T + (H - T - B) * (1 - Math.log10(Math.max(1, Math.min(1000, e))) / 3);
    let g = '';
    [1, 10, 100, 1000].forEach(e => { g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(e).toFixed(1) + '" y2="' + Y(e).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (Y(e) + 4).toFixed(1) + '" text-anchor="end">' + esc(times(e)) + '</text>'; });
    [[Infinity, 'never'], [1e7, 'months'], [1e5, 'days'], [1, 's'], [1e-3, 'ms'], [1e-6, 'us'], [1e-9, 'ns']].forEach(([s, k]) => { g += '<text class="tick tk-' + k + '" x="' + X(s).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + esc(t('liquid.tick.' + k)) + '</text>'; });
    const cx = X(1e-7), cy = Y(4);
    g += '<rect class="lcorner" x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" width="' + (W - R - cx).toFixed(1) + '" height="' + (Y(1) - cy + 6).toFixed(1) + '" rx="8"/>';
    if (need.every) { const ex = X(need.every); g += '<line class="every" x1="' + ex.toFixed(1) + '" x2="' + ex.toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/><text class="evt" x="' + (ex - 6).toFixed(1) + '" y="' + (T + 10) + '" text-anchor="end">' + esc(t('liquid.ui.every', { t: secs(need.every) })) + '</text>'; }
    /* the reference points: a circuit, an FPGA rewired, software */
    const fp = liquidOf(FALLBACK);
    g += '<circle class="ref" cx="' + X(Infinity) + '" cy="' + Y(1) + '" r="5"/><line class="refl" x1="' + X(fp.reshape.value[1]).toFixed(1) + '" x2="' + X(fp.reshape.value[0]).toFixed(1) + '" y1="' + Y(fp.energy.value).toFixed(1) + '" y2="' + Y(fp.energy.value).toFixed(1) + '"/><circle class="ref" cx="' + X(1e-6).toFixed(1) + '" cy="' + Y(500).toFixed(1) + '" r="5"/>';
    /* this machine's parts, one dot per form, every part with that form named beside it */
    const at = {};
    need.parts.forEach(p => { const f = view.plan[p.id], r = M.reshapeOf(f), c = M.costOf(f, need), s = G ? r.low : r.high, e = G ? c.low : c.high, k = f + '|' + s + '|' + e;
      (at[k] = at[k] || { f, s, e, names: [] }).names.push(partName(p.id)); });
    Object.values(at).forEach((a, i) => { const x = X(a.s), y = Y(a.e);
      g += '<g class="pt ' + fam(a.f) + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="7"/><text x="' + (x + (x > W - 150 ? -11 : 11)).toFixed(1) + '" y="' + (y - 9 - (i % 2) * 12).toFixed(1) + '" text-anchor="' + (x > W - 150 ? 'end' : 'start') + '">' + esc(a.names.join(', ')) + '</text></g>'; });
    return '<svg class="lmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('liquid.ui.mapAria')) + '">' + g + '</svg>';
  }
  function liquidHtml(m) {
    const parts = need.parts.filter(p => M.liquidIn(view.plan[p.id]));
    let h = '<section class="mliquid"><p class="kicker">' + esc(t('liquid.ui.kicker')) + '</p><p class="small muted">' + esc(t('liquid.ui.lead')) + '</p>' +
      '<div class="lmapbox"><span class="small muted">' + esc(t('liquid.ui.axisY')) + '</span>' + liquidMap(m) + '<span class="small muted lax">' + esc(t('liquid.ui.axisX')) + '</span><p class="small lkey"><span class="lk lk-corner"></span> ' + esc(t('liquid.ui.corner')) + (need.every ? ' · <span class="lk lk-every"></span> ' + esc(t('liquid.ui.everyKey')) : '') + ' · <span class="lk lk-ref"></span> ' + esc(t('liquid.ui.refs')) + '</p></div>';
    const src = fact => { const f = fact && ctx.FACT && ctx.FACT[fact]; return f && f.url ? ' <span class="small"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a></span>' : ''; };
    const li = (status, words, fact) => '<li class="k-note"><span class="mst s-' + status + '">' + esc(t('invent.status.' + status)) + '</span><span>' + esc(words) + src(fact) + '</span></li>';
    if (!parts.length) h += '<p class="small">' + esc(t('liquid.ui.none')) + '</p>';
    const shown = new Set();
    parts.forEach(p => { const L = M.liquidIn(view.plan[p.id]); if (shown.has(L.id)) return; shown.add(L.id);
      const names = parts.filter(q => M.liquidIn(view.plan[q.id]).id === L.id).map(q => partName(q.id)).join(', '), r = L.reshape.value;
      h += '<div class="mclaims"><p><b>' + esc(names) + ' · ' + esc(t('liquid.kind.' + L.id + '.t')) + '</b> <span class="small muted">' + esc(t('liquid.kind.' + L.id + '.d')) + '</span></p><ul>' +
        li(L.energy.status, t('liquid.ui.energy', { x: times(L.energy.value) }), L.energy.fact) +
        li(L.reshape.status, t('liquid.ui.reshape', { range: r[0] === r[1] ? secs(r[0]) : secs(r[0]) + ' – ' + secs(r[1]) }), L.reshape.fact) +
        L.notes.map(n => li(n.status, t('liquid.note.' + n.id), n.fact)).join('') + '</ul>' +
        (L.energy.status === 'guess' || L.reshape.status === 'guess' ? '<p class="small muted">' + esc(t('liquid.ui.fallback')) + '</p>' : '') + '</div>'; });
    const ev = ctx.FACT && ctx.FACT['thompson-evolved'];
    h += '<p class="small levolve">' + esc(t('liquid.ui.evolve')) + (ev && ev.url ? ' <a href="' + esc(ev.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a>' : '') + ' <a href="#/do/evolve">' + esc(t('liquid.ui.evolveGo')) + '</a></p>';
    return h + '</section>';
  }
  /* Moore's law for ideas: the attempts kept for this need, the best so far, and where yours would land */
  const LAWS = [['moore', 'ideas-harder'], ['wright', 'wright-law'], ['lab', null]];
  const LAWMARK = {
    moore: '<svg class="lmark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    wright: '<svg class="lmark" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="15" width="16" height="4" rx="1"/><rect x="6" y="10" width="12" height="4" rx="1"/><rect x="8" y="5" width="8" height="4" rx="1"/></svg>',
    lab: '<svg class="lmark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="15" cy="15" r="2"/><circle cx="20" cy="17" r="2"/></svg>'
  };
  function curveSvg(C, mine) {
    const pts = C.points, N = Math.max(pts.length + (mine ? 1 : 0), 4), W = 640, H = 230, L = 46, R = 14, T = 12, B = 30;
    const vals = pts.map(p => p.energy).concat(mine ? [mine.energy] : []).filter(v => isFinite(v) && v > 0);
    if (!vals.length) vals.push(1);
    const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...vals)))), hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...vals)) + 1e-9));
    const top = hi === lo ? hi * 10 : hi;
    const X = n => L + (W - L - R) * Math.log2(n) / Math.log2(N), Y = v => T + (H - T - B) * (1 - (Math.log10(v) - Math.log10(lo)) / (Math.log10(top) - Math.log10(lo)));
    let g = '';
    for (let e = Math.log10(lo); e <= Math.log10(top) + 1e-9; e++) g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(Math.pow(10, e)).toFixed(1) + '" y2="' + Y(Math.pow(10, e)).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (Y(Math.pow(10, e)) + 4).toFixed(1) + '" text-anchor="end">' + esc(times(Math.pow(10, e))) + '</text>';
    for (let n = 1; n <= N; n *= 2) g += '<line class="grid" y1="' + T + '" y2="' + (H - B) + '" x1="' + X(n).toFixed(1) + '" x2="' + X(n).toFixed(1) + '"/><text class="tick" x="' + X(n).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + n + '</text>';
    let path = '';
    pts.forEach((p, i) => { path += (i ? 'H' + X(p.n).toFixed(1) + 'V' : 'M' + X(p.n).toFixed(1) + ',') + Y(p.best).toFixed(1); });
    if (pts.length) path += 'H' + X(N).toFixed(1);
    const dots = pts.map(p => '<circle class="dot c-' + esc(p.made) + (p.draft ? ' mine' : '') + '" cx="' + X(p.n).toFixed(1) + '" cy="' + Y(p.energy).toFixed(1) + '" r="5"><title>' + esc(p.by + ' · ' + times(p.energy)) + '</title></circle>').join('');
    const you = mine && isFinite(mine.energy) ? '<circle class="dot you" cx="' + X(pts.length + 1).toFixed(1) + '" cy="' + Y(mine.energy).toFixed(1) + '" r="6"><title>' + esc(t('curve.ui.yours') + ' · ' + times(mine.energy)) + '</title></circle>' : '';
    return '<svg class="mcurve" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('curve.ui.kicker')) + '">' + g + (path ? '<path class="best" d="' + path + '"/>' : '') + dots + you + '</svg>';
  }
  function curveHtml(m) {
    const W = ctx.world ? ctx.world() : null, C = W ? labCurve(W, id) : { points: [], slope: null, perDoubling: null }, n = C.points.length;
    const mine = m.ok ? { energy: m.score.high } : null;
    let h = '<section class="mlab"><p class="kicker">' + esc(t('curve.ui.kicker')) + '</p><h2>' + esc(t('curve.ui.title')) + '</h2><p class="small muted">' + esc(t('curve.ui.lead')) + '</p>' +
      '<div class="mcurvebox"><div class="mplot"><span class="small muted maxis ay">' + esc(t('curve.ui.axisY')) + '</span>' + curveSvg(C, mine) + '<span class="small muted maxis ax">' + esc(t('curve.ui.axisX')) + '</span>' +
      '<p class="small mlegend"><span class="dot you"></span> ' + esc(t('curve.ui.yours')) + '</p></div><div class="mlawbox">';
    h += '<p class="mlaw"><b>' + esc(!n ? t('curve.ui.none') : C.slope == null ? t('curve.ui.noLaw', { n }) : t('curve.ui.law', { x: fmtNum(Math.pow(2, C.slope), { maximumSignificantDigits: 2 }) + '×' })) + '</b></p>';
    const tries = m.score.tries;
    if (!m.ok) h += '<p class="small">' + esc(t('curve.ui.cannot')) + '</p>';
    else if (!tries) h += '<p class="small">' + esc(t('curve.ui.paceNever')) + '</p>';
    else {
      const yrs = Math.max(n, 1) / tries, time = yrs * 365 < 60 ? t('curve.time.days', { n: fmtNum(Math.max(1, Math.round(yrs * 365))) }) : yrs < 2 ? t('curve.time.months', { n: fmtNum(Math.round(yrs * 12)) }) : t('curve.time.years', { n: fmtNum(Math.round(yrs)) });
      h += '<p class="small">' + esc(t('curve.ui.pace', { tries: fmtNum(Math.round(tries)), n: Math.max(n, 1), time })) + '</p>';
    }
    h += '<p class="small muted">' + esc(t('curve.ui.many')) + '</p></div></div>';
    h += '<p class="kicker">' + esc(t('curve.ui.laws')) + '</p><div class="mlaws">' + LAWS.map(([k, fact]) => { const f = fact && ctx.FACT && ctx.FACT[fact];
      return '<div class="mlaw1 l-' + k + '">' + LAWMARK[k] + '<p class="small">' + esc(t('curve.law.' + k)) + (f && f.url ? ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('invent.ui.source')) + '</a>' : '') + '</p></div>'; }).join('') + '</div>';
    if (ctx.keep) {
      h += '<div class="mkeep"><p class="small muted">' + esc(t('curve.ui.keepLead')) + '</p>' + ctx.signHtml() + (view.keepErr ? '<p class="small err" role="alert">' + esc(view.keepErr) + '</p>' : '') +
        '<div class="acts"><button type="button" class="btn primary" data-mkeep' + (m.ok ? '' : ' disabled') + '>' + esc(t('curve.ui.keep')) + '</button>' + (m.ok ? '' : '<span class="small muted">' + esc(t('curve.ui.cannot')) + '</span>') + '</div>' +
        (view.kept ? ctx.slip(view.kept) : '') + '</div>';
    }
    return h + '</section>';
  }
  function agentHtml() {
    const A = view.agent;
    let h = '<div class="magent"><p class="kicker">' + esc(t('machines.ui.agentK')) + '</p><p class="small muted">' + esc(t('machines.ui.agentLead')) + '</p>' +
      '<label class="small mguess"><input type="checkbox" data-mguess' + (view.guesses ? ' checked' : '') + '> ' + esc(t('invent.ui.guesses')) + '</label>';
    if (!A) return h + '<button type="button" class="btn primary" data-magent>' + esc(t('machines.ui.agent')) + '</button></div>';
    h += '<p class="small">' + esc(t('machines.ui.tried', { tried: A.tried, valid: A.valid, front: A.front })) + '</p><div class="mpicks">';
    A.picks.forEach((p, i) => {
      const on = need.parts.every(q => p.plan[q.id] === view.plan[q.id]) && (!p.score.fab || p.plan.fab === (view.plan.fab || M.START_FAB));
      h += '<div class="mpick' + (on ? ' on' : '') + '"><div class="mpickf">' + need.parts.map(q => '<span class="' + fam(p.plan[q.id]) + '" title="' + esc(partName(q.id) + ' · ' + formName(p.plan[q.id])) + '">' + markOf(p.plan[q.id]) + '</span>').join('') + '</div>' +
        '<p class="small"><b>' + esc(span(p.score)) + '</b> · ' + esc(t('machines.ui.pickKeeps', { changes: p.score.changes, exact: p.score.exact, parts: p.score.parts })) + '</p>' +
        '<p class="small">' + (p.score.fab ? FABMARK[p.score.fab] + ' ' + esc(t('fab.name.' + p.score.fab + '.t')) + ' · ' : '') + esc(days(p.score.daysLow, p.score.daysHigh)) + ' · ' + esc(t('machines.ui.daysShort')) + '</p>' +
        '<p class="small muted">' + esc(need.parts.filter(q => p.plan[q.id] !== 'circuit').map(q => partName(q.id) + ': ' + formName(p.plan[q.id])).join(' · ') || t('machines.ui.allCircuit')) + '</p>' +
        (on ? '<p class="small mon">' + esc(t('machines.ui.inUse')) + '</p>' : '<button type="button" class="btn" data-muse="' + i + '">' + esc(t('machines.ui.use')) + '</button>') + '</div>';
    });
    return h + '</div><p class="small mdecide">' + esc(t('machines.ui.decide')) + '</p></div>';
  }
  function blocksHtml() {
    return '<details class="mblocks"><summary><b>' + esc(t('machines.ui.blocks')) + '</b> <span class="small muted">' + esc(t('machines.ui.blocksLead')) + '</span></summary><div class="grid">' + BLOCKS.map(b => {
      const c = M.checkOf(b.id, P), ports = k => b[k].map(x => t('machines.port.' + x)).join(', '), kinds = mattersFor(b.id);
      return '<div class="chcard mblock"><span class="st">' + b.forms.concat(kinds.length ? ['matter'] : [], liquidsFor(b.id).length ? ['liquid'] : []).map(f => '<span class="f-' + f + '">' + MARK[f] + '</span>').join('') + '</span><span><b>' + esc(t('machines.block.' + b.id + '.t')) + '</b><span class="small">' + esc(t('machines.block.' + b.id + '.d')) + '</span>' +
        '<span class="small muted">' + esc(t('machines.ui.ports', { ins: ports('in'), outs: ports('out') })) + '</span>' +
        (kinds.length ? '<span class="small muted">' + esc(t('invent.ui.matters', { list: kinds.map(k => t('invent.matter.' + k.id + '.t')).join(', ') })) + '</span>' : '') +
        '<span class="small muted">' + esc(t('machines.check.' + c.state)) + '</span></span></div>';
    }).join('') + '</div></details>';
  }
  function draw() {
    const m = M.machine(id, view.plan, view.guesses);
    /* a reading page (Read, src/v2/frame2.js): the machine and what it scores are the picture pinned beside the
       words; the words (where it is made, the fabrics, the new matter, the agent, the curve) change it */
    el.innerHTML = readHtml({ cls: 'mach', head: '<p class="kicker">' + esc(t('machines.ui.kicker')) + '</p><h1>' + esc(t('machines.ui.title')) + '</h1><p class="lead">' + esc(t('machines.ui.lead')) + '</p>',
      picture: '<section class="mmachine"><p class="kicker">' + esc(t('machines.ui.machine')) + ' · ' + esc(t('machines.need.' + id + '.t')) + '</p><div class="mrail">' + need.parts.map(p => partHtml(p, m)).join('') + '</div>' +
        '<button type="button" class="link small" data-mreset>' + esc(t('machines.ui.reset')) + '</button></section>' + scoreHtml(m),
      text: needsHtml() + '<div class="mbody"><div class="mresult">' + fabHtml(m) + liquidHtml(m) + inventHtml(m) + '</div>' + agentHtml() + '</div>' + curveHtml(m) + blocksHtml() + '<p class="small muted mnote">' + t('machines.ui.note') + '</p>' });
  }
  el.onclick = e => {
    const q = s => e.target.closest(s);
    const n = q('[data-mneed]'); if (n) { if (n.dataset.mneed !== id) ctx.go(n.dataset.mneed); return; }
    if (ctx.slipClick && ctx.slipClick(e, () => draw())) return;
    const fb = q('[data-mfab]'); if (fb) { view.plan = Object.assign({}, view.plan, { fab: fb.dataset.mfab }); return draw(); }
    const kp = q('[data-mkeep]'); if (kp && !kp.disabled && ctx.keep) {
      const k = ctx.keep(id, Object.assign({}, M.machine(id, view.plan).plan), el.querySelector('.mkeep'));
      if (k.ok) { view.kept = k.e.id; view.keepErr = ''; } else view.keepErr = ctx.refusal(k.r);
      return draw();
    }
    const f = q('[data-mform]'); if (f && !f.disabled) { const s = f.dataset.mform, i = s.indexOf(':'); view.plan = Object.assign({}, view.plan, { [s.slice(0, i)]: s.slice(i + 1) }); return draw(); }
    if (q('[data-magent]')) { view.agent = M.assemble(id, 4, view.guesses); return draw(); }
    const u = q('[data-muse]'); if (u && view.agent) { const p = view.agent.picks[+u.dataset.muse]; if (p) { view.plan = Object.assign({}, p.plan); return draw(); } }
    if (q('[data-mreset]')) { view.plan = M.startPlan(id); return draw(); }
  };
  el.onchange = e => { const g = e.target.closest('[data-mguess]'); if (!g) return; view.guesses = g.checked; if (view.agent) view.agent = M.assemble(id, 4, view.guesses); draw(); };
  draw();
}
