/* The chip stack map: the home view. Every topic sits in its layer of the stack, and the
   knowledge graph draws the wires between them. Select a topic to see what it holds and
   what it connects to; pick a thread to light up a suggested route. Nothing is locked. */
import { BANDS, TOPICS, EDGES, THREADS, topicById, bandById, edgesOf } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { GL } from '../data/learning.js';
import { CARDS } from '../data/cards.js';
import { FACTS, factsFor, changesHTML } from './facts.js';
import { P } from './learning.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NS = 'http://www.w3.org/2000/svg';
export const state = { sel: null, thread: null, query: '' };

export function renderMapShell(zoomHTML) {
  $('#view-map').innerHTML = `
  <section class="wrap maphero">
    <p class="eyebrow">Open-source chip lab · facts checked October 2026</p>
    <h1>The whole chip, from <em>atoms</em> to everything it powers</h1>
    <p class="lede">Phones, cars, thermostats and AI data centers all run on chips made through the same stack: physics, transistors, design, factories and packaging. Every layer is a topic with live simulations you can play with, and wires show how the topics depend on each other. Start anywhere: pick a topic, follow a thread, or build a chip in the workshop.</p>
    <div class="mstats" id="mStats"></div>
  </section>
  <section class="wrap mapgrid">
    <div class="mapmain">
      <div class="maptools">
        <div class="threads" id="mThreads" role="group" aria-label="Suggested paths"></div>
        <input type="search" id="mSearch" placeholder="Search anything: HBM, EUV, RISC-V, yield…" aria-label="Search the map">
      </div>
      <div class="mstack" id="mStack"><svg id="mSvg" aria-hidden="true"></svg><div id="mBands"></div><svg id="mSvgL" aria-hidden="true"></svg></div>
      <p class="note">Layers run from the world at the top to atoms at the bottom, like a cross-section of a chip. Thin lines show how topics connect; select a topic to label its connections. Dashed outlines mark hands-on builds.</p>
    </div>
    <aside class="mapinfo" id="mInfo" aria-live="polite"></aside>
  </section>
  <section class="wrap zoomsec">
    <div class="head"><p class="code">Zoom</p><h2>From a server rack down to a single atom</h2></div>
    ${zoomHTML}
  </section>
  <section class="wrap mapfoot">
    <div class="hblock"><h3>What changed recently</h3><p class="small muted" id="fbStatus"></p><div id="changes"></div></div>
    <div class="hblock"><h3>About this lab</h3>
      <p class="small">Open Silicon Lab is an open-source project about every kind of chip, from the microcontroller in a thermostat to the GPUs in an AI data center. It is made with AI: Claude wrote the text, simulations and code with the project owner, from public sources. Every simulation is a teaching model; each one says what it simplifies. Facts carry their source and the date they were last verified, and are rechecked every month.</p>
      <p class="small"><a href="#knowledge">Glossary and knowledge cards</a> · <a href="#sources">All sources</a> · <a href="#challenges">All challenges</a></p>
    </div>
  </section>`;
}

/* ---- data the map shows about each topic ---- */
function labsOf(id) { const s = document.getElementById(id); return s ? [...s.querySelectorAll('.lab')].map(l => ({ id: l.id, t: (l.querySelector(':scope > header b') || {}).textContent || '' })).filter(x => x.t) : []; }
const challengesOf = id => CHALLENGES.filter(c => c.topic === id);

function nodeHTML(t) {
  const n = labsOf(t.id).length, c = challengesOf(t.id).length;
  const meta = t.id === 'riscv' ? '7 levels + sandbox' : (n ? n + (n > 1 ? ' simulations' : ' simulation') : '') + (c ? (n ? ' · ' : '') + c + (c > 1 ? ' challenges' : ' challenge') : '');
  return '<button type="button" class="tnode' + (t.kind === 'build' ? ' build' : '') + (P.seen[t.id] ? ' seen' : '') + '" data-t="' + t.id + '"><span class="nb" aria-hidden="true"></span><b>' + esc(t.t) + '</b><small>' + esc(meta) + '</small></button>';
}

export function initMap() {
  $('#mBands').innerHTML = BANDS.map((b, i) => '<div class="band" data-b="' + b.id + '" style="--bc:var(--band' + (i % 5) + ')"><div class="bl"><b>' + esc(b.t) + '</b><span>' + esc(b.d) + '</span></div><div class="bn">' + TOPICS.filter(t => t.band === b.id).map(nodeHTML).join('') + '</div></div>').join('');
  const labCount = TOPICS.reduce((s, t) => s + labsOf(t.id).length, 0);
  $('#mStats').innerHTML = [[TOPICS.length, 'topics'], [labCount + '+', 'live simulations'], [CHALLENGES.length, 'challenges'], [FACTS.facts.length, 'dated facts']].map(x => '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>').join('');
  $('#mThreads').innerHTML = '<button type="button" data-th="">All topics</button>' + THREADS.map(t => '<button type="button" data-th="' + t.id + '">' + esc(t.t) + '</button>').join('');
  $('#mThreads').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { state.thread = b.dataset.th || null; state.query = ''; $('#mSearch').value = ''; if (state.thread) state.sel = null; refresh(); }));
  $('#mBands').addEventListener('click', e => { const n = e.target.closest('.tnode'); if (!n) return; state.sel = state.sel === n.dataset.t && !matchMedia('(hover:hover)').matches ? state.sel : n.dataset.t; state.query = ''; $('#mSearch').value = ''; refresh(); });
  $('#mBands').addEventListener('dblclick', e => { const n = e.target.closest('.tnode'); if (n) location.hash = n.dataset.t; });
  $('#mBands').addEventListener('mouseover', e => { const n = e.target.closest('.tnode'); hover = n ? n.dataset.t : null; drawEdges(); });
  $('#mBands').addEventListener('mouseleave', () => { hover = null; drawEdges(); });
  $('#mSearch').addEventListener('input', e => { state.query = e.target.value.trim(); if (state.query) { state.thread = null; state.sel = null; } refresh(); });
  $('#mInfo').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) { state.sel = b.dataset.pick; state.thread = null; refresh(); } const th = e.target.closest('[data-thread]'); if (th) { state.thread = th.dataset.thread; state.sel = null; refresh(); } });
  new ResizeObserver(() => drawEdges()).observe($('#mStack'));
  $('#changes').innerHTML = changesHTML();
  $('#fbStatus').textContent = FACTS.facts.length + ' facts tracked · last checked ' + (FACTS.lastCheck || '–') + ' · next check ' + (FACTS.nextCheck || '–');
  refresh();
}

/* ---- search across topics, simulations, glossary, cards, facts and challenges ---- */
function search(q) {
  const s = q.toLowerCase(); const hits = [];
  TOPICS.forEach(t => { if ((t.t + ' ' + t.s).toLowerCase().includes(s)) hits.push({ topic: t.id, kind: 'Topic', t: t.t, href: '#' + t.id }); labsOf(t.id).forEach(l => { if (l.t.toLowerCase().includes(s)) hits.push({ topic: t.id, kind: 'Simulation', t: l.t, href: '#' + l.id }); }); });
  GL.forEach(g => { if (g[0].toLowerCase().includes(s) || g[1].some(v => v.toLowerCase().includes(s))) hits.push({ topic: g[3], kind: 'Term', t: g[0], d: g[2], href: '#' + g[3] }); });
  Object.values(CARDS).forEach(c => { if ((c[1] + ' ' + c[2]).toLowerCase().includes(s)) hits.push({ topic: c[3], kind: 'Card', t: c[1], d: c[2], href: '#' + c[3] }); });
  FACTS.facts.forEach(f => { if ((f.label + ' ' + f.value).toLowerCase().includes(s)) hits.push({ topic: f.topic, kind: 'Fact', t: f.label, d: f.value, href: '#' + f.topic }); });
  CHALLENGES.forEach(c => { if ((c.t + ' ' + c.d).toLowerCase().includes(s)) hits.push({ topic: c.topic, kind: 'Challenge', t: c.t, d: c.d, href: c.href }); });
  return hits;
}

let hover = null;
function refresh() {
  const th = state.thread ? THREADS.find(t => t.id === state.thread) : null;
  const hits = state.query.length > 1 ? search(state.query) : null; const hitTopics = hits ? new Set(hits.map(h => h.topic)) : null;
  $('#mThreads').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.th || null) === state.thread ? 'true' : 'false'));
  document.querySelectorAll('#mBands .tnode').forEach(n => {
    const id = n.dataset.t; const step = th ? th.path.indexOf(id) : -1;
    n.classList.toggle('sel', id === state.sel);
    n.classList.toggle('dim', (!!th && step < 0) || (!!hitTopics && !hitTopics.has(id)));
    n.classList.toggle('hit', !!hitTopics && hitTopics.has(id));
    n.querySelector('.nb').textContent = step >= 0 ? String(step + 1) : '';
    n.classList.toggle('stepn', step >= 0);
    n.classList.toggle('seen', !!P.seen[id]);
  });
  renderInfo(th, hits); drawEdges();
}

function renderInfo(th, hits) {
  const box = $('#mInfo');
  if (hits) {
    box.innerHTML = '<p class="code">Search</p><h3>' + hits.length + ' result' + (hits.length === 1 ? '' : 's') + ' for “' + esc(state.query) + '”</h3>' + (hits.length ? '<div class="hits">' + hits.slice(0, 40).map(h => '<a href="' + h.href + '"><span class="pill out">' + h.kind + '</span><b>' + esc(h.t) + '</b>' + (h.d ? '<small>' + esc(h.d) + '</small>' : '') + '<em>' + esc((topicById(h.topic) || { t: h.topic }).t) + '</em></a>').join('') + '</div>' : '<p class="muted">Nothing matches. Try a shorter word.</p>');
  } else if (th) {
    box.innerHTML = '<p class="code">Thread</p><h3>' + esc(th.t) + '</h3><p>' + esc(th.d) + ' A suggestion, not a requirement: every topic stays open.</p><ol class="tpath">' + th.path.map((id, i) => { const t = topicById(id); return '<li><a href="#' + id + '"><span>' + (i + 1) + '</span><b>' + esc(t.t) + '</b>' + (P.seen[id] ? '<em>explored</em>' : '') + '</a></li>'; }).join('') + '</ol><div class="row"><a class="btn primary" href="#' + th.path.find(id => !P.seen[id]) + '" data-start-thread="' + th.id + '">' + (th.path.some(id => P.seen[id]) ? 'Continue the thread →' : 'Start the thread →') + '</a></div>';
    if (th.path.every(id => P.seen[id])) box.querySelector('[data-start-thread]').setAttribute('href', '#' + th.path[0]);
  } else if (state.sel) {
    const t = topicById(state.sel), b = bandById(t.band); const labs = labsOf(t.id), ch = challengesOf(t.id), fs = factsFor(t.id);
    const conn = edgesOf(t.id).map(e => { const out = e[0] === t.id; const o = topicById(out ? e[1] : e[0]); return '<button type="button" data-pick="' + o.id + '"><span>' + (out ? '→' : '←') + '</span><b>' + esc(o.t) + '</b><small>' + esc(e[2]) + '</small></button>'; }).join('');
    const ths = THREADS.filter(x => x.path.includes(t.id));
    box.innerHTML = '<p class="code">' + esc(b.t) + (t.kind === 'build' ? ' · hands-on build' : '') + (P.seen[t.id] ? ' · explored' : '') + '</p><h3>' + esc(t.t) + '</h3><p>' + esc(t.s) + '</p><div class="row"><a class="btn primary" href="#' + t.id + '">Open ' + esc(t.t) + ' →</a></div>' +
      (labs.length ? '<p class="eyebrow">Inside</p><ul class="ilist">' + labs.map(l => '<li><a href="#' + l.id + '">' + esc(l.t) + '</a></li>').join('') + '</ul>' : '') +
      (ch.length ? '<p class="eyebrow">Challenges</p><ul class="ilist">' + ch.map(c => '<li><a href="' + c.href + '">' + esc(c.t) + '</a> <span class="muted small">' + c.kind + '</span></li>').join('') + '</ul>' : '') +
      '<p class="eyebrow">Connects to</p><div class="conn">' + conn + '</div>' +
      (fs.length ? '<p class="eyebrow">Live facts</p><ul class="ilist">' + fs.slice(0, 4).map(f => '<li>' + esc(f.label) + ': <b>' + esc(f.value) + '</b></li>').join('') + '</ul>' : '') +
      (ths.length ? '<p class="eyebrow">On these threads</p><div class="row">' + ths.map(x => '<button type="button" class="chip" data-thread="' + x.id + '">' + esc(x.t) + '</button>').join('') + '</div>' : '');
  } else {
    box.innerHTML = '<p class="code">How to use the map</p><h3>Select any topic</h3><p>Each box is a topic with its own simulations. Select one to see what it holds and how it connects. Double-click, or use its Open button, to go in.</p><p class="eyebrow">Or follow a thread</p><div class="tlist">' + THREADS.map(x => '<button type="button" data-thread="' + x.id + '"><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></button>').join('') + '</div><p class="eyebrow">Or look inside something you own</p><div class="tlist"><a href="#everywhere"><b>Chips everywhere</b><small>Open a phone, a car or a server and see which chips it takes</small></a></div><p class="eyebrow">Or build something</p><div class="tlist"><a href="#tiny"><b>Tiny chip studio</b><small>From logic to a working chip, in eight steps</small></a><a href="#riscv"><b>RISC-V CPU lab</b><small>Program a processor, then make it an AI chip</small></a><a href="#build"><b>AI chip architect</b><small>Design an AI chip for a mission</small></a></div>';
  }
  /* On narrow screens, show details right under the selected topic's layer. */
  const narrow = innerWidth < 980; const grid = document.querySelector('.mapgrid');
  if (narrow && state.sel) { const band = document.querySelector('#mBands .tnode[data-t="' + state.sel + '"]').closest('.band'); band.after(box); box.classList.add('inline'); }
  else if (box.parentElement !== grid) { grid.appendChild(box); box.classList.remove('inline'); }
  else box.classList.remove('inline');
}

/* ---- the wires ---- */
function center(id, wrap) { const n = document.querySelector('#mBands .tnode[data-t="' + id + '"]'); if (!n) return null; const r = n.getBoundingClientRect(); return { x: r.left - wrap.left + r.width / 2, y: r.top - wrap.top + r.height / 2, top: r.top - wrap.top, bot: r.bottom - wrap.top, h: r.height }; }
function curve(a, b) {
  if (Math.abs(a.y - b.y) < 4) { const my = a.top - 18; return 'M' + a.x + ',' + a.top + ' C' + a.x + ',' + my + ' ' + b.x + ',' + my + ' ' + b.x + ',' + b.top; }
  const down = b.y > a.y; const y1 = down ? a.bot : a.top, y2 = down ? b.top : b.bot; const m = (y1 + y2) / 2;
  return 'M' + a.x + ',' + y1 + ' C' + a.x + ',' + m + ' ' + b.x + ',' + m + ' ' + b.x + ',' + y2;
}
function drawEdges() {
  const svg = $('#mSvg'), stack = $('#mStack'); if (!svg || !stack) return; const wrap = stack.getBoundingClientRect(); if (wrap.width < 2) return;
  svg.setAttribute('viewBox', '0 0 ' + Math.round(wrap.width) + ' ' + Math.round(wrap.height)); svg.innerHTML = '';
  const th = state.thread ? THREADS.find(t => t.id === state.thread) : null; const focus = state.sel || hover;
  const mk = (d, cls) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); svg.appendChild(p); return p; };
  const labels = [];
  EDGES.forEach(e => {
    const a = center(e[0], wrap), b = center(e[1], wrap); if (!a || !b) return;
    const on = focus && (e[0] === focus || e[1] === focus);
    const cls = th ? 'w faint' : on ? 'w on' : (focus ? 'w faint' : 'w');
    mk(curve(a, b), cls);
    if (on && state.sel) labels.push([a, b, e[2]]);
  });
  if (th) { for (let i = 1; i < th.path.length; i++) { const a = center(th.path[i - 1], wrap), b = center(th.path[i], wrap); if (a && b) mk(curve(a, b), 'w path'); } }
  /* Each label sits just outside the node at the far end of its wire, so it reads as
     "this topic: why it connects" and never stacks on the selected node. */
  const L = $('#mSvgL'); L.setAttribute('viewBox', svg.getAttribute('viewBox')); L.innerHTML = '';
  labels.forEach(([a, b, t]) => {
    const sel = center(state.sel, wrap); const o = a.x === sel.x && a.y === sel.y ? b : a;
    const above = Math.abs(o.y - sel.y) < 4 || o.y > sel.y; const y = above ? o.top - 9 : o.bot + 11;
    const tx = document.createElementNS(NS, 'text'); tx.setAttribute('x', o.x); tx.setAttribute('y', y); tx.setAttribute('class', 'wl'); tx.textContent = t; L.appendChild(tx);
  });
}
export const redrawMap = () => { refresh(); };
