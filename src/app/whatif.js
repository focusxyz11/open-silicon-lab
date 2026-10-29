/* What if? The map as a simulator. Levers above the map, badges on every topic the change
   reaches, and the cause chain behind each badge. The model lives in src/data/ripple.js and
   src/engines/ripple.js; this file only draws it. */
import { LEVERS, PRESETS, PUZZLES, INDICATORS } from '../data/ripple.js';
import { ripple, topicHeads, chain, fmt, IND, NEUTRAL, shows } from '../engines/ripple.js';
import { topicById } from '../data/topics.js';
import { FACTS } from './facts.js';

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
  box.innerHTML = '<div class="wihead"><div><p class="code">What if? · the map as a simulator</p><h3>Move a lever and watch the change ripple across the chip world</h3></div><button type="button" class="btn" data-wi-close>Close</button></div>' +
    '<div class="wilevers">' + LEVERS.map(l => '<label class="wilever" data-l="' + l.id + '"><span><b>' + esc(l.t) + '</b><output></output></span><input type="range" min="' + l.min + '" max="' + l.max + '" step="' + l.step + '" value="0" aria-describedby="wid-' + l.id + '"><small id="wid-' + l.id + '">' + esc(l.d) + '</small></label>').join('') + '</div>' +
    '<div class="wipresets"><span class="small muted">Try a scenario</span><div class="seg">' + PRESETS.map(p => '<button type="button" data-preset="' + p.id + '" title="' + esc(p.d) + '">' + esc(p.t) + '</button>').join('') + '<button type="button" data-preset="">Reset</button></div></div>' +
    '<details class="wipuzzles" open><summary></summary><ol></ol></details>' +
    '<details class="wifacts"><summary>What this simplifies, and the facts behind it</summary><p class="small">A teaching model, not a forecast. Each rule says which way one thing pushes another, and the directions follow the economics and the events of 2021–2026 below. The strengths are illustrative round numbers. The real industry has delays, feedback loops (higher prices cool demand; shortages pay for new fabs that later end them), stockpiles, contracts and politics, which this model leaves out. Effects are shown as changes from today, all at once.</p><ul class="ilist small">' +
    facts.map(f => '<li><span class="pill ' + (f.kind === 'reported' ? 'out' : 'ann') + '">' + esc(f.kind) + '</span> ' + esc(f.label) + ': <b>' + esc(f.value) + '</b> <span class="muted">(' + (f.url ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.source) + '</a>' : esc(f.source)) + ', checked ' + esc(f.verified) + ')</span></li>').join('') + '</ul></details>';
  syncPanel();
}

function syncPanel() {
  const box = $('#mWhatif'); if (!box || !box.dataset.ready) return;
  LEVERS.forEach(l => {
    const lab = box.querySelector('[data-l="' + l.id + '"]'); const inp = lab.querySelector('input'); const v = W.L[l.id];
    if (+inp.value !== v) inp.value = v;
    lab.querySelector('output').textContent = v ? fmt(v, l.unit) : 'today';
    lab.classList.toggle('on', !!v);
  });
  box.querySelectorAll('[data-preset]').forEach(b => { const p = PRESETS.find(x => x.id === b.dataset.preset); b.setAttribute('aria-pressed', p && LEVERS.every(l => (p.set[l.id] || 0) === W.L[l.id]) ? 'true' : 'false'); });
  const n = PUZZLES.filter(p => W.solved[p.id]).length;
  box.querySelector('.wipuzzles summary').textContent = 'Puzzles · ' + n + ' of ' + PUZZLES.length + ' solved';
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
    const t = topicById(sel); const inds = INDICATORS.filter(i => i.topic === sel);
    const lever = LEVERS.find(l => IND[l.ind].topic === sel);
    const live = inds.filter(i => shows(W.res.v[i.id], i.unit));
    let body = '';
    if (!inds.length) body = '<p>Nothing in this model links the five levers to ' + esc(t.t) + '. Real life has more links than any model: try to name one the model is missing.</p>';
    else if (!live.length) body = '<p>' + (moved() ? 'These levers leave it unchanged here:' : 'Move a lever to see what changes here. This topic tracks:') + '</p><ul class="ilist">' + inds.map(i => '<li>' + esc(i.t) + '</li>').join('') + '</ul>';
    else body = live.map(i => {
      const v = W.res.v[i.id], why = W.res.why[i.id];
      const ch = chain(W.res, i.id);
      return '<div class="wiind"><div class="wiv"><b>' + esc(i.t) + '</b><span class="rb ' + (v > 0 ? 'up' : 'down') + '">' + fmt(v, i.unit) + '</span></div>' +
        (why.length ? '<p class="eyebrow">Because</p><div class="conn">' + why.map(w => { const f = IND[w.from]; return '<button type="button" data-pick="' + f.topic + '"><span>←</span><b>' + esc(f.t) + ' ' + fmt(W.res.v[w.from], f.unit) + '</b><small>' + esc(w.d) + '</small></button>'; }).join('') + '</div>' : '<p class="small muted">You set this lever.</p>') +
        (ch.length > 2 ? '<p class="eyebrow">Strongest chain</p><ol class="wichain">' + ch.map(c => '<li>' + (c.s ? '<em>' + esc(c.s) + '</em>' : '') + '<b>' + esc(IND[c.id].t) + ' ' + fmt(c.v, IND[c.id].unit) + '</b></li>').join('') + '</ol>' : '') + '</div>';
    }).join('');
    return '<p class="code">What if? · ' + esc(tname(sel)) + '</p><h3>' + esc(t.t) + '</h3>' + (lever ? '<p class="small muted">The <b>' + esc(lever.t) + '</b> lever acts here.</p>' : '') + body + '<div class="row"><a class="btn" href="#' + sel + '">Open ' + esc(t.t) + ' →</a><button type="button" class="btn" data-pick="">All changes</button></div>';
  }
  if (!moved()) return '<p class="code">What if?</p><h3>Everything is at today\'s level</h3><p>Move one of the five levers above the map, or try a scenario. Every topic the change reaches gets a badge, and the wires show which way it travels.</p><p>Then select any topic to see why it changed, step by step back to your lever.</p>';
  const isLever = i => LEVERS.some(l => l.ind === i.id);
  const list = INDICATORS.filter(i => !isLever(i)).filter(i => shows(W.res.v[i.id], i.unit)).sort((a, b) => Math.abs(W.res.v[b.id]) - Math.abs(W.res.v[a.id]));
  const quiet = [...new Set(INDICATORS.filter(i => !isLever(i)).map(i => i.topic))].filter(t => !list.some(i => i.topic === t));
  return '<p class="code">What if? · ' + list.length + ' changes</p><h3>Biggest effects</h3><div class="wilist">' + list.slice(0, max).map(i => '<button type="button" data-pick="' + i.topic + '"><b>' + esc(i.t) + '</b><span class="rb ' + (W.res.v[i.id] > 0 ? 'up' : 'down') + '">' + fmt(W.res.v[i.id], i.unit) + '</span><small>' + esc(tname(i.topic)) + ' · ' + W.res.depth[i.id] + (W.res.depth[i.id] === 1 ? ' step' : ' steps') + ' from a lever</small></button>').join('') + '</div>' +
    (list.length > max ? '<p class="small muted">And ' + (list.length - max) + ' smaller ones: select any topic with a badge.</p>' : '') +
    (quiet.length ? '<p class="small muted">Untouched: ' + quiet.map(id => esc(tname(id))).join(', ') + '.</p>' : '');
}
