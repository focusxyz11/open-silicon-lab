/* What if? The map as a simulator. Levers above the map, badges on every topic the change
   reaches, and the cause chain behind each badge. The model lives in src/data/ripple.js and
   src/engines/ripple.js; this file only draws it. */
import { LEVERS, PRESETS, PUZZLES, INDICATORS } from '../data/ripple.js';
import { ripple, topicHeads, chain, fmt, IND, NEUTRAL, shows } from '../engines/ripple.js';
import { topicById } from '../data/topics.js';
import { FACTS, fmtDate } from './facts.js';
import { t, fmtList } from '../core/i18n.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'osl-whatif-v1';
function load() { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); return j && j.solved && typeof j.solved === 'object' ? j.solved : {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify({ solved: W.solved })); } catch (e) { /* ignore */ } }

export const W = { on: false, L: { ...NEUTRAL }, res: ripple(NEUTRAL), solved: load(), fresh: null };
const moved = () => LEVERS.some(l => W.L[l.id]);
const arrow = v => (v > 0 ? '▲' : '▼');
const short = (v, unit) => arrow(v) + ' ' + fmt(Math.abs(v), unit).replace('+', '');
const tname = id => (topicById(id) || { t: id }).t;
const factById = id => FACTS.facts.find(f => f.id === id);

/* ---- the lever panel above the map ---- */
export function renderPanel() {
  const box = $('#mWhatif'); if (!box) return;
  box.hidden = !W.on; if (!W.on) return;
  if (box.dataset.ready) { syncPanel(); return; }
  box.dataset.ready = '1';
  const facts = [...new Set(LEVERS.flatMap(l => l.facts))].map(factById).filter(Boolean);
  box.innerHTML = '<div class="wihead"><div><p class="code">' + t('wi.code') + '</p><h3>' + t('wi.title') + '</h3></div><button type="button" class="btn" data-wi-close>' + t('wi.close') + '</button></div>' +
    '<div class="wilevers">' + LEVERS.map(l => '<label class="wilever" data-l="' + l.id + '"><span><b>' + esc(l.t) + '</b><output></output></span><input type="range" min="' + l.min + '" max="' + l.max + '" step="' + l.step + '" value="0" aria-describedby="wid-' + l.id + '"><small id="wid-' + l.id + '">' + esc(l.d) + '</small></label>').join('') + '</div>' +
    '<div class="wipresets"><span class="small muted">' + t('wi.try') + '</span><div class="seg">' + PRESETS.map(p => '<button type="button" data-preset="' + p.id + '" title="' + esc(p.d) + '">' + esc(p.t) + '</button>').join('') + '<button type="button" data-preset="">' + t('wi.reset') + '</button></div></div>' +
    '<details class="wipuzzles" open><summary></summary><ol></ol></details>' +
    '<details class="wifacts"><summary>' + t('wi.simplifies') + '</summary><p class="small">' + t('wi.simplifiesText') + '</p><ul class="ilist small">' +
    facts.map(f => '<li><span class="pill ' + (f.kind === 'reported' ? 'out' : 'ann') + '">' + t('fact.' + (f.kind || 'reported')) + '</span> ' + esc(f.label) + ': <b>' + esc(f.value) + '</b> <span class="muted">(' + (f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.source) + '</a>' : esc(f.source)) + ', ' + esc(t('wi.checked', { date: fmtDate(f.verified) })) + ')</span></li>').join('') + '</ul></details>';
  syncPanel();
}

function syncPanel() {
  const box = $('#mWhatif'); if (!box || !box.dataset.ready) return;
  LEVERS.forEach(l => {
    const lab = box.querySelector('[data-l="' + l.id + '"]'); const inp = lab.querySelector('input'); const v = W.L[l.id];
    if (+inp.value !== v) inp.value = v;
    lab.querySelector('output').textContent = v ? fmt(v, l.unit) : t('wi.today');
    lab.classList.toggle('on', !!v);
  });
  box.querySelectorAll('[data-preset]').forEach(b => { const p = PRESETS.find(x => x.id === b.dataset.preset); b.setAttribute('aria-pressed', p && LEVERS.every(l => (p.set[l.id] || 0) === W.L[l.id]) ? 'true' : 'false'); });
  const n = PUZZLES.filter(p => W.solved[p.id]).length;
  box.querySelector('.wipuzzles summary').textContent = t('wi.puzzles', { n, total: PUZZLES.length });
  box.querySelector('.wipuzzles ol').innerHTML = PUZZLES.map(p => '<li class="' + (W.solved[p.id] ? 'done' : '') + (W.fresh === p.id ? ' fresh' : '') + '"><b>' + (W.solved[p.id] ? '✓ ' : '') + esc(p.t) + '</b>' + (W.solved[p.id] ? '<small>' + esc(p.done) + '</small>' : '') + '</li>').join('');
}

/* Set levers, rerun the model, check the puzzles. Returns true if anything changed. */
export function setLevers(next, byHand) {
  LEVERS.forEach(l => { if (next[l.id] !== undefined) W.L[l.id] = Math.max(l.min, Math.min(l.max, +next[l.id] || 0)); });
  W.res = ripple(W.L); W.fresh = null;
  if (byHand) PUZZLES.forEach(p => { if (!W.solved[p.id] && p.ok(W.L, W.res.v)) { W.solved[p.id] = new Date().toISOString().slice(0, 10); W.fresh = p.id; save(); } });
  syncPanel();
}
export function wirePanel(onChange) {
  const box = $('#mWhatif');
  box.addEventListener('input', e => { const lab = e.target.closest('[data-l]'); if (!lab) return; setLevers({ [lab.dataset.l]: +e.target.value }, true); onChange(true); });
  box.addEventListener('click', e => {
    const p = e.target.closest('[data-preset]');
    if (p) { const pre = PRESETS.find(x => x.id === p.dataset.preset); setLevers({ ...NEUTRAL, ...(pre ? pre.set : {}) }); onChange(true); }
    if (e.target.closest('[data-wi-close]')) { W.on = false; onChange(false); }
  });
}

/* ---- badges on the map's topic boxes ---- */
export function paintNodes(animate) {
  const heads = W.on ? topicHeads(W.res) : {};
  const levTopics = new Set(LEVERS.filter(l => W.L[l.id]).map(l => IND[l.ind].topic));
  document.querySelectorAll('#mBands .tnode').forEach(n => {
    const id = n.dataset.t, h = heads[id], rb = n.querySelector('.rb');
    n.classList.toggle('wi', W.on);
    n.classList.toggle('calm', W.on && moved() && !h);
    n.classList.toggle('lever', W.on && levTopics.has(id));
    if (!rb) return;
    if (h) { const u = IND[h.id].unit; rb.textContent = short(h.v, u); rb.className = 'rb ' + (h.v > 0 ? 'up' : 'down'); rb.title = IND[h.id].t + ': ' + fmt(h.v, u); n.style.setProperty('--d', (W.res.depth[h.id] * 0.16) + 's'); }
    else { rb.textContent = ''; rb.className = 'rb'; rb.removeAttribute('title'); }
    if (animate) { n.classList.remove('rip'); void n.offsetWidth; n.classList.add('rip'); }
  });
}

/* ---- causal wires: one per pair of topics that a nonzero rule links ---- */
export function rippleLinks() {
  const pairs = {};
  INDICATORS.forEach(i => (W.res.why[i.id] || []).forEach(t => {
    const a = IND[t.from].topic, b = i.topic; if (a === b || Math.abs(t.amt) < 0.5) return;
    const k = a + '>' + b; const p = pairs[k] || (pairs[k] = { a, b, amt: 0, s: t.s, top: 0 });
    p.amt += t.amt; if (Math.abs(t.amt) > p.top) { p.top = Math.abs(t.amt); p.s = t.s; }
  }));
  return Object.values(pairs);
}

/* ---- the side panel ---- */
export function infoHTML(sel, max = 12) {
  if (sel) {
    const tp = topicById(sel); const inds = INDICATORS.filter(i => i.topic === sel);
    const lever = LEVERS.find(l => IND[l.ind].topic === sel);
    const live = inds.filter(i => shows(W.res.v[i.id], i.unit));
    let body = '';
    if (!inds.length) body = '<p>' + esc(t('wi.noLink', { topic: tp.t })) + '</p>';
    else if (!live.length) body = '<p>' + (moved() ? t('wi.unchanged') : t('wi.tracks')) + '</p><ul class="ilist">' + inds.map(i => '<li>' + esc(i.t) + '</li>').join('') + '</ul>';
    else body = live.map(i => {
      const v = W.res.v[i.id], why = W.res.why[i.id];
      const ch = chain(W.res, i.id);
      return '<div class="wiind"><div class="wiv"><b>' + esc(i.t) + '</b><span class="rb ' + (v > 0 ? 'up' : 'down') + '">' + fmt(v, i.unit) + '</span></div>' +
        (why.length ? '<p class="eyebrow">' + t('wi.because') + '</p><div class="conn">' + why.map(w => { const f = IND[w.from]; return '<button type="button" data-pick="' + f.topic + '"><span>←</span><b>' + esc(f.t) + ' ' + fmt(W.res.v[w.from], f.unit) + '</b><small>' + esc(w.d) + '</small></button>'; }).join('') + '</div>' : '<p class="small muted">' + t('wi.youSet') + '</p>') +
        (ch.length > 2 ? '<p class="eyebrow">' + t('wi.chain') + '</p><ol class="wichain">' + ch.map(c => '<li>' + (c.s ? '<em>' + esc(c.s) + '</em>' : '') + '<b>' + esc(IND[c.id].t) + ' ' + fmt(c.v, IND[c.id].unit) + '</b></li>').join('') + '</ol>' : '') + '</div>';
    }).join('');
    return '<p class="code">' + esc(t('wi.topicCode', { topic: tname(sel) })) + '</p><h3>' + esc(tp.t) + '</h3>' + (lever ? '<p class="small muted">' + t('wi.leverHere', { lever: esc(lever.t) }) + '</p>' : '') + body + '<div class="row"><a class="btn" href="#' + sel + '">' + esc(t('wi.open', { topic: tp.t })) + '</a><button type="button" class="btn" data-pick="">' + t('wi.all') + '</button></div>';
  }
  if (!moved()) return '<p class="code">' + t('wi.idleCode') + '</p><h3>' + t('wi.idleTitle') + '</h3><p>' + t('wi.idleText') + '</p><p>' + t('wi.idleText2') + '</p>';
  const isLever = i => LEVERS.some(l => l.ind === i.id);
  const list = INDICATORS.filter(i => !isLever(i)).filter(i => shows(W.res.v[i.id], i.unit)).sort((a, b) => Math.abs(W.res.v[b.id]) - Math.abs(W.res.v[a.id]));
  const quiet = [...new Set(INDICATORS.filter(i => !isLever(i)).map(i => i.topic))].filter(id => !list.some(i => i.topic === id));
  return '<p class="code">' + t('wi.changes', { n: list.length }) + '</p><h3>' + t('wi.biggest') + '</h3><div class="wilist">' + list.slice(0, max).map(i => '<button type="button" data-pick="' + i.topic + '"><b>' + esc(i.t) + '</b><span class="rb ' + (W.res.v[i.id] > 0 ? 'up' : 'down') + '">' + fmt(W.res.v[i.id], i.unit) + '</span><small>' + esc(t('wi.steps', { topic: tname(i.topic), n: W.res.depth[i.id] })) + '</small></button>').join('') + '</div>' +
    (list.length > max ? '<p class="small muted">' + t('wi.more', { n: list.length - max }) + '</p>' : '') +
    (quiet.length ? '<p class="small muted">' + esc(t('wi.untouched', { topics: fmtList(quiet.map(tname)) })) + '</p>' : '');
}
