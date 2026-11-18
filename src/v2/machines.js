/* Machines from shared blocks (#/machines, #/machines/<need>; docs/MACHINES.md). No standard computer: pick a need,
   and a machine is a few shared blocks joined by one grammar, each block in the form that need calls for (software,
   circuit or new matter). Change a form and see what it costs and keeps; let an agent assemble it, and decide.
   The blocks, the grammar and the needs: src/data/blocks.js; the checks, the scores and the agent:
   src/engines/machine.js; how each block is checked: the community's plan (src/engines/build.js).

   machines(el, ctx) draws into el and keeps its own state; ctx: { need, go(need) }. */
import { t, fmtNum } from '../core/i18n.js';
import { BLOCKS, NEEDS, FORMS, blockOf, needOf } from '../data/blocks.js';
import * as M from '../engines/machine.js';
import { plan as buildPlan } from '../engines/build.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* the three forms drawn as one small mark each: a circuit solid, software dashed, new matter a hexagon */
const MARK = {
  circuit: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1" y="1" width="16" height="16" rx="3"/></svg>',
  software: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><rect x="1.75" y="1.75" width="14.5" height="14.5" rx="3"/></svg>',
  matter: '<svg class="mmark" viewBox="0 0 18 18" aria-hidden="true"><polygon points="1,9 5,2 13,2 17,9 13,16 5,16"/></svg>'
};
const times = x => (x >= 10 ? fmtNum(Math.round(x)) : fmtNum(x, { maximumFractionDigits: x < 1 ? 2 : 1 })) + '×';

export function machines(el, ctx) {
  const id = needOf(ctx.need) ? ctx.need : NEEDS[0].id, need = needOf(id);
  const view = { plan: M.startPlan(id), agent: null };
  let P = null; try { P = buildPlan(); } catch (e) { P = null; }
  const partName = p => t('machines.role.' + id + '.' + p);

  function needsHtml() {
    return '<div class="mneeds" role="tablist">' + NEEDS.map(n => '<button type="button" role="tab" data-mneed="' + n.id + '" aria-selected="' + (n.id === id) + '"><b>' + esc(t('machines.need.' + n.id + '.t')) + '</b><span class="small">' + esc(t('machines.need.' + n.id + '.d')) + '</span></button>').join('') + '</div>' +
      '<p class="small mwhy">' + esc(t('machines.need.' + id + '.why')) + '</p>';
  }
  function partHtml(p) {
    const b = blockOf(p.block), f = view.plan[p.id], C = M.check(need, view.plan), bad = C.breaks.some(x => x.part === p.id) || M.meets(need, view.plan).misses.some(x => x.part === p.id);
    return '<div class="mpart' + (bad ? ' bad' : '') + '"><div class="mtile f-' + f + '">' + MARK[f] + '<span><b>' + esc(partName(p.id)) + '</b><span class="small muted">' + esc(t('machines.block.' + b.id + '.t')) + ' · ' + esc(t('machines.form.' + f)) + '</span></span></div>' +
      '<div class="mforms" role="group" aria-label="' + esc(partName(p.id)) + '">' + FORMS.map(k => '<button type="button" class="f-' + k + '" data-mform="' + p.id + ':' + k + '" aria-pressed="' + (k === f) + '"' + (b.forms.includes(k) ? '' : ' disabled') + ' title="' + esc(t('machines.form.' + k)) + '">' + MARK[k] + '<span class="sr">' + esc(t('machines.form.' + k)) + '</span></button>').join('') + '</div></div>';
  }
  function scoreHtml(m) {
    const s = m.score, list = [];
    m.check.breaks.forEach(x => list.push('<li class="bad">' + esc(t('machines.rule.' + x.rule, { part: partName(x.part) })) + '</li>'));
    m.meets.misses.forEach(x => list.push('<li class="bad">' + esc(t('machines.miss.' + x.rule, { part: partName(x.part) })) + '</li>'));
    if (m.check.ok) list.unshift('<li class="good">' + esc(t('machines.ui.grammarOk')) + '</li>');
    if (m.check.ok && m.meets.ok) list.push('<li class="good">' + esc(t('machines.ui.meetsOk')) + '</li>');
    return '<div class="mscore"><div class="mread"><b>' + esc(times(s.energy)) + '</b><span class="small">' + esc(t('machines.ui.energy')) + '</span></div>' +
      '<div class="mread"><b>' + s.changes + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.changes')) + '</span></div>' +
      '<div class="mread"><b>' + s.exact + ' / ' + s.parts + '</b><span class="small">' + esc(t('machines.ui.exact')) + '</span></div></div><ul class="mchecks">' + list.join('') + '</ul>';
  }
  function agentHtml() {
    const A = view.agent;
    let h = '<div class="magent"><p class="kicker">' + esc(t('machines.ui.agentK')) + '</p><p class="small muted">' + esc(t('machines.ui.agentLead')) + '</p>';
    if (!A) return h + '<button type="button" class="btn primary" data-magent>' + esc(t('machines.ui.agent')) + '</button></div>';
    h += '<p class="small">' + esc(t('machines.ui.tried', { tried: A.tried, valid: A.valid, front: A.front })) + '</p><div class="mpicks">';
    A.picks.forEach((p, i) => {
      const on = need.parts.every(q => p.plan[q.id] === view.plan[q.id]);
      h += '<div class="mpick' + (on ? ' on' : '') + '"><div class="mpickf">' + need.parts.map(q => '<span class="f-' + p.plan[q.id] + '" title="' + esc(partName(q.id) + ' · ' + t('machines.form.' + p.plan[q.id])) + '">' + MARK[p.plan[q.id]] + '</span>').join('') + '</div>' +
        '<p class="small"><b>' + esc(times(p.score.energy)) + '</b> · ' + esc(t('machines.ui.pickKeeps', { changes: p.score.changes, exact: p.score.exact, parts: p.score.parts })) + '</p>' +
        '<p class="small muted">' + esc(need.parts.filter(q => p.plan[q.id] !== 'circuit').map(q => partName(q.id) + ': ' + t('machines.form.' + p.plan[q.id])).join(' · ') || t('machines.ui.allCircuit')) + '</p>' +
        (on ? '<p class="small mon">' + esc(t('machines.ui.inUse')) + '</p>' : '<button type="button" class="btn" data-muse="' + i + '">' + esc(t('machines.ui.use')) + '</button>') + '</div>';
    });
    return h + '</div><p class="small mdecide">' + esc(t('machines.ui.decide')) + '</p></div>';
  }
  function blocksHtml() {
    return '<details class="mblocks"><summary><b>' + esc(t('machines.ui.blocks')) + '</b> <span class="small muted">' + esc(t('machines.ui.blocksLead')) + '</span></summary><div class="grid">' + BLOCKS.map(b => {
      const c = M.checkOf(b.id, P), ports = k => b[k].map(x => t('machines.port.' + x)).join(', ');
      return '<div class="chcard mblock"><span class="st">' + b.forms.map(f => '<span class="f-' + f + '">' + MARK[f] + '</span>').join('') + '</span><span><b>' + esc(t('machines.block.' + b.id + '.t')) + '</b><span class="small">' + esc(t('machines.block.' + b.id + '.d')) + '</span>' +
        '<span class="small muted">' + esc(t('machines.ui.ports', { ins: ports('in'), outs: ports('out') })) + '</span><span class="small muted">' + esc(t('machines.check.' + c.state)) + '</span></span></div>';
    }).join('') + '</div></details>';
  }
  function draw() {
    const m = M.machine(id, view.plan);
    el.innerHTML = '<article class="mach"><p class="kicker">' + esc(t('machines.ui.kicker')) + '</p><h1>' + esc(t('machines.ui.title')) + '</h1><p class="lead">' + esc(t('machines.ui.lead')) + '</p>' +
      needsHtml() +
      '<section class="mmachine"><p class="kicker">' + esc(t('machines.ui.machine')) + '</p><div class="mrail">' + need.parts.map(partHtml).join('') + '</div>' +
      '<button type="button" class="link small" data-mreset>' + esc(t('machines.ui.reset')) + '</button></section>' +
      '<div class="mbody"><div class="mresult">' + scoreHtml(m) + '</div>' + agentHtml() + '</div>' +
      blocksHtml() + '<p class="small muted mnote">' + t('machines.ui.note') + '</p></article>';
  }
  el.onclick = e => {
    const q = s => e.target.closest(s);
    const n = q('[data-mneed]'); if (n) { if (n.dataset.mneed !== id) ctx.go(n.dataset.mneed); return; }
    const f = q('[data-mform]'); if (f && !f.disabled) { const [part, form] = f.dataset.mform.split(':'); view.plan = Object.assign({}, view.plan, { [part]: form }); return draw(); }
    if (q('[data-magent]')) { view.agent = M.assemble(id); return draw(); }
    const u = q('[data-muse]'); if (u && view.agent) { const p = view.agent.picks[+u.dataset.muse]; if (p) { view.plan = Object.assign({}, p.plan); return draw(); } }
    if (q('[data-mreset]')) { view.plan = M.startPlan(id); return draw(); }
  };
  draw();
}
