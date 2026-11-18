/* Machines from shared blocks (#/machines, #/machines/<need>; docs/MACHINES.md). No standard computer: pick a need,
   and a machine is a few shared blocks joined by one grammar, each block in the form that need calls for (software,
   circuit or new matter). Change a form and see what it costs and keeps; let an agent assemble it, and decide.
   Beyond today's chip: new matter is a kind of matter that may not exist yet (memory that computes, light, spikes,
   reversible logic, living cells), and each rests on claims that say how sure they are; the energy is a range, physics
   sets the floor, and the agent counts guesses only when told to.
   The blocks, the grammar and the needs: src/data/blocks.js; the kinds of new matter: src/data/inventions.js; the
   checks, the scores and the agent: src/engines/machine.js; how each block is checked: the community's plan
   (src/engines/build.js).

   machines(el, ctx) draws into el and keeps its own state; ctx: { need, go(need), FACT (facts.json by id, optional) }. */
import { t, fmtNum } from '../core/i18n.js';
import { BLOCKS, NEEDS, FORMS, blockOf, needOf } from '../data/blocks.js';
import { mattersFor } from '../data/inventions.js';
import * as M from '../engines/machine.js';
import { plan as buildPlan } from '../engines/build.js';

const REPO = 'https://github.com/focusxyz11/open-silicon-lab/blob/main/';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* the three families drawn as one small mark each: a circuit solid, software dashed, new matter a hexagon */
const MARK = {
  circuit: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/></svg>',
  software: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.75" y="1.75" width="14.5" height="14.5" rx="3"/></svg>',
  matter: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><polygon points="1,9 5,2 13,2 17,9 13,16 5,16"/></svg>'
};
const markOf = f => MARK[M.familyOf(f)] || '';
const fam = f => 'f-' + M.familyOf(f);
const times = x => (x >= 10 ? fmtNum(Math.round(x)) : fmtNum(x, x < 0.01 ? { maximumSignificantDigits: 1 } : { maximumFractionDigits: x < 1 ? 2 : 1 })) + '×';
const span = s => (Math.abs(s.low - s.high) / s.high < 0.005 ? times(s.high) : times(s.low) + ' – ' + times(s.high));
const formName = f => (M.matterIn(f) ? t('invent.matter.' + M.matterIn(f).id + '.t') : t('machines.form.' + f));

export function machines(el, ctx) {
  const id = needOf(ctx.need) ? ctx.need : NEEDS[0].id, need = needOf(id);
  const view = { plan: M.startPlan(id), agent: null, guesses: false };
  let P = null; try { P = buildPlan(); } catch (e) { P = null; }
  const partName = p => t('machines.role.' + id + '.' + p);

  function needsHtml() {
    return '<div class="mneeds" role="tablist">' + NEEDS.map(n => '<button type="button" role="tab" data-mneed="' + n.id + '" aria-selected="' + (n.id === id) + '"><b>' + esc(t('machines.need.' + n.id + '.t')) + '</b><span class="small">' + esc(t('machines.need.' + n.id + '.d')) + '</span></button>').join('') + '</div>' +
      '<p class="small mwhy">' + esc(t('machines.need.' + id + '.why')) + '</p>';
  }
  function partHtml(p, m) {
    const b = blockOf(p.block), f = view.plan[p.id], forms = M.formsOf(b.id), kinds = mattersFor(b.id);
    const bad = m.check.breaks.some(x => x.part === p.id) || m.meets.misses.some(x => x.part === p.id);
    const famBtn = k => { const on = M.familyOf(f) === k, has = k === 'matter' ? kinds.length > 0 : forms.includes(k), to = k === 'matter' ? (on ? f : 'matter:' + (kinds[0] || {}).id) : k;
      return '<button type="button" class="f-' + k + '" data-mform="' + p.id + ':' + to + '" aria-pressed="' + on + '"' + (has ? '' : ' disabled') + ' title="' + esc(t('machines.form.' + k)) + '">' + MARK[k] + '<span class="sr">' + esc(t('machines.form.' + k)) + '</span></button>'; };
    let h = '<div class="mpart' + (bad ? ' bad' : '') + '"><div class="mtile ' + fam(f) + '">' + markOf(f) + '<span><b>' + esc(partName(p.id)) + '</b><span class="small muted">' + esc(t('machines.block.' + b.id + '.t')) + ' · ' + esc(formName(f)) + '</span></span></div>' +
      '<div class="mforms" role="group" aria-label="' + esc(partName(p.id)) + '">' + FORMS.map(famBtn).join('') + '</div>';
    if (M.familyOf(f) === 'matter' && kinds.length > 1) h += '<div class="mkinds" role="group" aria-label="' + esc(t('machines.form.matter')) + '">' + kinds.map(k => '<button type="button" data-mform="' + p.id + ':matter:' + k.id + '" aria-pressed="' + (f === 'matter:' + k.id) + '">' + esc(t('invent.matter.' + k.id + '.t')) + '</button>').join('') + '</div>';
    return h + '</div>';
  }
  function scoreHtml(m) {
    const s = m.score, list = [];
    m.check.breaks.forEach(x => list.push('<li class="bad">' + esc(t('machines.rule.' + x.rule, { part: partName(x.part) })) + '</li>'));
    m.meets.misses.forEach(x => list.push('<li class="bad">' + esc(t('machines.miss.' + x.rule, { part: partName(x.part) })) + '</li>'));
    if (m.check.ok) list.unshift('<li class="good">' + esc(t('machines.ui.grammarOk')) + '</li>');
    if (m.check.ok && m.meets.ok) list.push('<li class="good">' + esc(t('machines.ui.meetsOk')) + '</li>');
    return '<div class="mscore"><div class="mread"><b>' + esc(span(s)) + '</b><span class="small">' + esc(t('machines.ui.energy')) + '</span></div>' +
      '<div class="mread"><b>' + s.changes + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.changes')) + '</span></div>' +
      '<div class="mread"><b>' + s.exact + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.exact')) + '</span></div></div><ul class="mchecks">' + list.join('') + '</ul>';
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
  function agentHtml() {
    const A = view.agent;
    let h = '<div class="magent"><p class="kicker">' + esc(t('machines.ui.agentK')) + '</p><p class="small muted">' + esc(t('machines.ui.agentLead')) + '</p>' +
      '<label class="small mguess"><input type="checkbox" data-mguess' + (view.guesses ? ' checked' : '') + '> ' + esc(t('invent.ui.guesses')) + '</label>';
    if (!A) return h + '<button type="button" class="btn primary" data-magent>' + esc(t('machines.ui.agent')) + '</button></div>';
    h += '<p class="small">' + esc(t('machines.ui.tried', { tried: A.tried, valid: A.valid, front: A.front })) + '</p><div class="mpicks">';
    A.picks.forEach((p, i) => {
      const on = need.parts.every(q => p.plan[q.id] === view.plan[q.id]);
      h += '<div class="mpick' + (on ? ' on' : '') + '"><div class="mpickf">' + need.parts.map(q => '<span class="' + fam(p.plan[q.id]) + '" title="' + esc(partName(q.id) + ' · ' + formName(p.plan[q.id])) + '">' + markOf(p.plan[q.id]) + '</span>').join('') + '</div>' +
        '<p class="small"><b>' + esc(span(p.score)) + '</b> · ' + esc(t('machines.ui.pickKeeps', { changes: p.score.changes, exact: p.score.exact, parts: p.score.parts })) + '</p>' +
        '<p class="small muted">' + esc(need.parts.filter(q => p.plan[q.id] !== 'circuit').map(q => partName(q.id) + ': ' + formName(p.plan[q.id])).join(' · ') || t('machines.ui.allCircuit')) + '</p>' +
        (on ? '<p class="small mon">' + esc(t('machines.ui.inUse')) + '</p>' : '<button type="button" class="btn" data-muse="' + i + '">' + esc(t('machines.ui.use')) + '</button>') + '</div>';
    });
    return h + '</div><p class="small mdecide">' + esc(t('machines.ui.decide')) + '</p></div>';
  }
  function blocksHtml() {
    return '<details class="mblocks"><summary><b>' + esc(t('machines.ui.blocks')) + '</b> <span class="small muted">' + esc(t('machines.ui.blocksLead')) + '</span></summary><div class="grid">' + BLOCKS.map(b => {
      const c = M.checkOf(b.id, P), ports = k => b[k].map(x => t('machines.port.' + x)).join(', '), kinds = mattersFor(b.id);
      return '<div class="chcard mblock"><span class="st">' + b.forms.concat(kinds.length ? ['matter'] : []).map(f => '<span class="f-' + f + '">' + MARK[f] + '</span>').join('') + '</span><span><b>' + esc(t('machines.block.' + b.id + '.t')) + '</b><span class="small">' + esc(t('machines.block.' + b.id + '.d')) + '</span>' +
        '<span class="small muted">' + esc(t('machines.ui.ports', { ins: ports('in'), outs: ports('out') })) + '</span>' +
        (kinds.length ? '<span class="small muted">' + esc(t('invent.ui.matters', { list: kinds.map(k => t('invent.matter.' + k.id + '.t')).join(', ') })) + '</span>' : '') +
        '<span class="small muted">' + esc(t('machines.check.' + c.state)) + '</span></span></div>';
    }).join('') + '</div></details>';
  }
  function draw() {
    const m = M.machine(id, view.plan, view.guesses);
    el.innerHTML = '<article class="mach"><p class="kicker">' + esc(t('machines.ui.kicker')) + '</p><h1>' + esc(t('machines.ui.title')) + '</h1><p class="lead">' + esc(t('machines.ui.lead')) + '</p>' +
      needsHtml() +
      '<section class="mmachine"><p class="kicker">' + esc(t('machines.ui.machine')) + '</p><div class="mrail">' + need.parts.map(p => partHtml(p, m)).join('') + '</div>' +
      '<button type="button" class="link small" data-mreset>' + esc(t('machines.ui.reset')) + '</button></section>' +
      '<div class="mbody"><div class="mresult">' + scoreHtml(m) + inventHtml(m) + '</div>' + agentHtml() + '</div>' +
      blocksHtml() + '<p class="small muted mnote">' + t('machines.ui.note') + '</p></article>';
  }
  el.onclick = e => {
    const q = s => e.target.closest(s);
    const n = q('[data-mneed]'); if (n) { if (n.dataset.mneed !== id) ctx.go(n.dataset.mneed); return; }
    const f = q('[data-mform]'); if (f && !f.disabled) { const s = f.dataset.mform, i = s.indexOf(':'); view.plan = Object.assign({}, view.plan, { [s.slice(0, i)]: s.slice(i + 1) }); return draw(); }
    if (q('[data-magent]')) { view.agent = M.assemble(id, 4, view.guesses); return draw(); }
    const u = q('[data-muse]'); if (u && view.agent) { const p = view.agent.picks[+u.dataset.muse]; if (p) { view.plan = Object.assign({}, p.plan); return draw(); } }
    if (q('[data-mreset]')) { view.plan = M.startPlan(id); return draw(); }
  };
  el.onchange = e => { const g = e.target.closest('[data-mguess]'); if (!g) return; view.guesses = g.checked; if (view.agent) view.agent = M.assemble(id, 4, view.guesses); draw(); };
  draw();
}
