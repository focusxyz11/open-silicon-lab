/* The chip stack map: the home view. Every topic sits in its layer of the stack, and the
   knowledge graph draws the wires between them. Select a topic to see what it holds and
   what it connects to; pick a thread to light up a suggested route. Nothing is locked. */
import { TOPIC_FILES } from '../generated/catalog.js';
import { BANDS, TOPICS, EDGES, LINKS, THREADS, topicById, bandById } from '../data/topics.js';
import { linkListHTML } from './connections.js';
import { t, fmtDate } from '../core/i18n.js';
import { lensBarHTML, lensInfoHTML, lensTopics, markerDefs, ideaPath, longestChain, LENSES } from './maplens.js';
import { CHALLENGES } from '../data/challenges.js';
import { GL } from '../data/learning.js';
import { CARDS } from '../data/cards.js';
import { FACTS, factsFor, changesHTML } from './facts.js';
import { P } from './learning.js';
import { getYear } from './era.js';
import { BORN, NOW } from '../data/timeline.js';
import { W, renderPanel, wirePanel, paintNodes, rippleLinks, infoHTML } from './whatif.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NS = 'http://www.w3.org/2000/svg';
/* lens: which kind of connection the lines show ('' = only the selected or hovered topic's);
   idea: the big idea followed when lens is 'ideas'. */
export const state = { sel: null, thread: null, query: '', lens: '', idea: null };

export function renderMapShell(zoomHTML) {
  const jumps = [1971, 1978, 1985, 1993, 2000, 2007, 2012, 2018, 2026, 2030, 2040];
  $('#view-map').innerHTML = `
  <section class="wrap maphero">
    <p class="eyebrow">${esc(t('map.eyebrow', { date: FACTS.lastCheck ? fmtDate(FACTS.lastCheck, { month: 'long', year: 'numeric' }) : '–' }))}</p>
    <h1>${t('map.h1')}</h1>
    <p class="lede">${t('map.lede')}</p>
    <div class="mstats" id="mStats"></div>
    <div class="doors" aria-labelledby="doorsT">
      <p class="eyebrow" id="doorsT">${t('doors.title')}</p>
      <div class="doorrow">${[['#tiny', 'build'], ['#reality', 'break'], ['#whatif', 'imagine']].map(([h, id]) => '<a class="door" href="' + h + '"><b>' + t('guide.' + id + '.t') + '</b><span>' + t('guide.' + id + '.d') + '</span></a>').join('')}</div>
      <p class="small muted">${t('doors.or')} <button type="button" class="linkish tourbtn" data-guide-start>${t('doors.tour')}</button></p>
    </div>
  </section>
  <section class="wrap tmsec" id="timeMachine" aria-labelledby="tmTitle">
    <div class="tmhead">
      <div class="yearbig" id="tmYear">2026</div>
      <div class="tmera"><p class="code">${t('tm.code')}</p><h2 id="tmTitle"><span id="tmEra">–</span></h2><p id="tmEraD" class="small"></p></div>
    </div>
    <input type="range" id="tmR" value="2026" aria-label="${t('tm.range')}">
    <div class="row tmctl"><div class="seg" id="tmJump">${jumps.map(y => '<button type="button" data-y="' + y + '">' + (y === 2026 ? t('era.today') : y) + '</button>').join('')}</div><button type="button" class="btn" id="tmPlay">${t('tm.play')}</button></div>
    <div class="cols tmbody">
      <div><canvas class="plot" id="tmCv" style="height:280px" aria-label="${t('tm.plot')}"></canvas>
        <div class="legend"><span><i style="background:var(--cyan-fill)"></i>${t('tm.micro')}</span><span><i style="background:var(--amber-fill)"></i>${t('tm.landmark')}</span><span><i style="background:var(--violet)"></i>${t('tm.trend')}</span></div></div>
      <div class="tmcards" id="tmCards"></div>
    </div>
    <p class="note">${t('tm.note')}</p>
  </section>
  <section class="wrap mapgrid">
    <div class="mapmain">
      <div class="maptools">
        <div class="threads" id="mThreads" role="group" aria-label="${t('map.paths')}"></div>
        <button type="button" class="wibtn" id="mWhat" aria-pressed="false" aria-controls="mWhatif">${t('map.whatif')}</button>
        <input type="search" id="mSearch" placeholder="${t('map.search')}" aria-label="${t('map.searchLabel')}">
      </div>
      <div class="lensbar" id="mLens" role="group" aria-label="${t('map.lensLabel')}">${lensBarHTML()}</div>
      <div class="whatif" id="mWhatif" hidden></div>
      <div class="mstack" id="mStack"><svg id="mSvg" aria-hidden="true"></svg><div id="mBands"></div><svg id="mSvgL" aria-hidden="true"></svg></div>
      <p class="note">${t('map.note')}</p>
    </div>
    <aside class="mapinfo" id="mInfo" aria-live="polite"></aside>
  </section>
  <section class="wrap zoomsec">
    <div class="head"><p class="code">${t('zoom.code')}</p><h2>${t('zoom.title')}</h2></div>
    ${zoomHTML}
  </section>
  <section class="wrap mapfoot">
    <div class="hblock"><h3>${t('map.changed')}</h3><p class="small muted" id="fbStatus"></p><div id="changes"></div></div>
    <div class="hblock"><h3>${t('map.about')}</h3>
      <p class="small">${t('map.aboutText')}</p>
      <p class="small">${t('map.links')}</p>
    </div>
  </section>`;
}

/* ---- data the map shows about each topic ---- */
/* What a topic holds comes from the catalog, so the map works before any topic is loaded. */
const labsOf = id => (TOPIC_FILES[id] || { labs: [] }).labs;
const challengesOf = id => CHALLENGES.filter(c => c.topic === id);

function nodeHTML(tp) {
  const n = labsOf(tp.id).length, c = challengesOf(tp.id).length;
  const meta = tp.id === 'riscv' ? t('map.riscvMeta') : [n ? t('map.sims', { n }) : '', c ? t('map.chs', { n: c }) : ''].filter(Boolean).join(' · ');
  return '<button type="button" class="tnode' + (tp.kind === 'build' ? ' build' : '') + (P.seen[tp.id] ? ' seen' : '') + '" data-t="' + tp.id + '"><span class="nb" aria-hidden="true"></span><b>' + esc(tp.t) + '</b><small>' + esc(meta) + '</small><span class="rb"></span></button>';
}

export function initMap() {
  $('#mBands').innerHTML = BANDS.map((b, i) => '<div class="band" data-b="' + b.id + '" style="--bc:var(--band' + (i % 5) + ')"><div class="bl"><b>' + esc(b.t) + '</b><span>' + esc(b.d) + '</span></div><div class="bn">' + TOPICS.filter(x => x.band === b.id).map(nodeHTML).join('') + '</div></div>').join('');
  const labCount = TOPICS.reduce((s, x) => s + labsOf(x.id).length, 0);
  $('#mStats').innerHTML = [[TOPICS.length, t('map.stat.topics')], [labCount + '+', t('map.stat.sims')], [CHALLENGES.length, t('map.stat.challenges')], [FACTS.facts.length, t('map.stat.facts')]].map(x => '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>').join('');
  $('#mThreads').innerHTML = '<button type="button" data-th="">' + t('map.allTopics') + '</button>' + THREADS.map(x => '<button type="button" data-th="' + x.id + '">' + esc(x.t) + '</button>').join('');
  $('#mThreads').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { state.thread = b.dataset.th || null; state.query = ''; $('#mSearch').value = ''; if (state.thread) { state.sel = null; W.on = false; state.lens = ''; } refresh(); }));
  $('#mLens').addEventListener('click', e => { const b = e.target.closest('[data-lens]'); if (!b) return; setLens(b.dataset.lens); });
  $('#mWhat').addEventListener('click', () => setWhatif(!W.on));
  wirePanel(animate => { if (!W.on) state.sel = null; refresh(animate); });
  $('#mBands').addEventListener('click', e => { const n = e.target.closest('.tnode'); if (!n) return; state.sel = state.sel === n.dataset.t && !matchMedia('(hover:hover)').matches ? state.sel : n.dataset.t; state.query = ''; $('#mSearch').value = ''; refresh(); });
  $('#mBands').addEventListener('dblclick', e => { const n = e.target.closest('.tnode'); if (n) location.hash = n.dataset.t; });
  $('#mBands').addEventListener('mouseover', e => { const n = e.target.closest('.tnode'); hover = n ? n.dataset.t : null; drawEdges(); });
  $('#mBands').addEventListener('mouseleave', () => { hover = null; drawEdges(); });
  $('#mSearch').addEventListener('input', e => { state.query = e.target.value.trim(); if (state.query) { state.thread = null; state.sel = null; W.on = false; state.lens = ''; } refresh(); });
  $('#mInfo').addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) { state.sel = b.dataset.pick; state.thread = null; refresh(); } const th = e.target.closest('[data-thread]'); if (th) { state.thread = th.dataset.thread; state.sel = null; W.on = false; state.lens = ''; refresh(); } const id = e.target.closest('[data-idea]'); if (id) { state.lens = 'ideas'; state.idea = id.dataset.idea || null; state.sel = null; refresh(); } if (e.target.closest('[data-whatif]')) setWhatif(true); });
  new ResizeObserver(() => drawEdges()).observe($('#mStack'));
  document.addEventListener('osl:year', () => refresh());
  $('#changes').innerHTML = changesHTML();
  $('#fbStatus').textContent = t('map.factStatus', { n: FACTS.facts.length, last: FACTS.lastCheck ? fmtDate(FACTS.lastCheck) : '–', next: FACTS.nextCheck ? fmtDate(FACTS.nextCheck) : '–' });
  refresh();
}

/* ---- search across topics, simulations, glossary, cards, facts and challenges ---- */
function search(q) {
  const s = q.toLowerCase(); const hits = [];
  TOPICS.forEach(x => { if ((x.t + ' ' + x.s).toLowerCase().includes(s)) hits.push({ topic: x.id, kind: 'topic', t: x.t, href: '#' + x.id }); labsOf(x.id).forEach(l => { if (l.t.toLowerCase().includes(s)) hits.push({ topic: x.id, kind: 'simulation', t: l.t, href: '#' + l.id }); }); });
  GL.forEach(g => { if (g[0].toLowerCase().includes(s) || g[1].some(v => v.toLowerCase().includes(s))) hits.push({ topic: g[3], kind: 'term', t: g[0], d: g[2], href: '#' + g[3] }); });
  Object.values(CARDS).forEach(c => { if ((c[1] + ' ' + c[2]).toLowerCase().includes(s)) hits.push({ topic: c[3], kind: 'card', t: c[1], d: c[2], href: '#' + c[3] }); });
  FACTS.facts.forEach(f => { if ((f.label + ' ' + f.value).toLowerCase().includes(s)) hits.push({ topic: f.topic, kind: 'fact', t: f.label, d: f.value, href: '#' + f.topic }); });
  CHALLENGES.forEach(c => { if ((c.t + ' ' + c.d).toLowerCase().includes(s)) hits.push({ topic: c.topic, kind: 'challenge', t: c.t, d: c.d, href: c.href }); });
  return hits;
}

/* What if? mode: levers above the map, ripple badges on the topics. */
export function setWhatif(on) {
  W.on = on; state.sel = null;
  if (on) { state.thread = null; state.query = ''; $('#mSearch').value = ''; state.lens = ''; }
  refresh(on);
  if (on) requestAnimationFrame(() => { const r = $('#mWhatif').getBoundingClientRect(); if (r.top < 60 || r.top > innerHeight * 0.6) $('#mWhatif').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
}

/* Show one kind of connection on the map ('' for quiet, 'ideas' for big ideas). */
export function setLens(lens) {
  state.lens = LENSES.some(l => l.id === lens) ? lens : ''; state.idea = null; state.sel = null; state.thread = null;
  state.query = ''; $('#mSearch').value = ''; W.on = false; refresh();
}

let hover = null;
function refresh(animate) {
  const th = state.thread ? THREADS.find(t => t.id === state.thread) : null;
  const hits = state.query.length > 1 ? search(state.query) : null; const hitTopics = hits ? new Set(hits.map(h => h.topic)) : null;
  const inLens = !W.on && !th && !hits ? lensTopics(state.lens, state.idea) : null;
  $('#mLens').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', !W.on && !th && b.dataset.lens === state.lens ? 'true' : 'false'));
  $('#mThreads').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', !W.on && (b.dataset.th || null) === state.thread ? 'true' : 'false'));
  document.querySelectorAll('#mBands .tnode').forEach(n => {
    const id = n.dataset.t; const step = th ? th.path.indexOf(id) : -1;
    n.classList.toggle('sel', id === state.sel);
    n.classList.toggle('dim', (!!th && step < 0) || (!!hitTopics && !hitTopics.has(id)) || (!!inLens && !inLens.has(id)));
    n.classList.toggle('hit', (!!hitTopics && hitTopics.has(id)) || (state.lens === 'ideas' && !!inLens && inLens.has(id)));
    n.querySelector('.nb').textContent = step >= 0 ? String(step + 1) : '';
    n.classList.toggle('stepn', step >= 0);
    n.classList.toggle('seen', !!P.seen[id]);
    const notyet = getYear() !== NOW && BORN[id] && BORN[id][0] > getYear();
    n.classList.toggle('notyet', !!notyet); if (notyet) n.title = t('map.notYet', { year: getYear(), what: BORN[id][1] }); else n.removeAttribute('title');
  });
  $('#mWhat').setAttribute('aria-pressed', W.on ? 'true' : 'false');
  renderPanel(); paintNodes(!!animate && W.on);
  renderInfo(th, hits); drawEdges();
}

function renderInfo(th, hits) {
  const box = $('#mInfo');
  if (W.on) {
    box.innerHTML = infoHTML(state.sel, innerWidth < 980 ? 5 : 12);
  } else if (hits) {
    box.innerHTML = '<p class="code">' + t('search.code') + '</p><h3>' + t('search.count', { n: hits.length, q: esc(state.query) }) + '</h3>' + (hits.length ? '<div class="hits">' + hits.slice(0, 40).map(h => '<a href="' + h.href + '"><span class="pill out">' + t('search.kind.' + h.kind) + '</span><b>' + esc(h.t) + '</b>' + (h.d ? '<small>' + esc(h.d) + '</small>' : '') + '<em>' + esc((topicById(h.topic) || { t: h.topic }).t) + '</em></a>').join('') + '</div>' : '<p class="muted">' + t('search.none') + '</p>');
  } else if (th) {
    box.innerHTML = '<p class="code">' + t('thread.panelCode') + '</p><h3>' + esc(th.t) + '</h3><p>' + esc(th.d) + ' ' + t('thread.note') + '</p><ol class="tpath">' + th.path.map((id, i) => { const tp = topicById(id); return '<li><a href="#' + id + '"><span>' + (i + 1) + '</span><b>' + esc(tp.t) + '</b>' + (P.seen[id] ? '<em>' + t('thread.explored') + '</em>' : '') + '</a></li>'; }).join('') + '</ol><div class="row"><a class="btn primary" href="#' + th.path.find(id => !P.seen[id]) + '" data-start-thread="' + th.id + '">' + (th.path.some(id => P.seen[id]) ? t('thread.continue') : t('thread.start')) + '</a></div>';
    if (th.path.every(id => P.seen[id])) box.querySelector('[data-start-thread]').setAttribute('href', '#' + th.path[0]);
  } else if (state.sel) {
    const tp = topicById(state.sel), b = bandById(tp.band); const labs = labsOf(tp.id), ch = challengesOf(tp.id), fs = factsFor(tp.id);
    const conn = linkListHTML(tp.id, 'button');
    const ths = THREADS.filter(x => x.path.includes(tp.id));
    box.innerHTML = '<p class="code">' + esc(b.t) + (tp.kind === 'build' ? t('panel.build') : '') + (P.seen[tp.id] ? t('panel.explored') : '') + '</p><h3>' + esc(tp.t) + '</h3><p>' + esc(tp.s) + '</p><div class="row"><a class="btn primary" href="#' + tp.id + '">' + esc(t('panel.open', { topic: tp.t })) + '</a></div>' +
      (labs.length ? '<p class="eyebrow">' + t('panel.inside') + '</p><ul class="ilist">' + labs.map(l => '<li><a href="#' + l.id + '">' + esc(l.t) + '</a></li>').join('') + '</ul>' : '') +
      (ch.length ? '<p class="eyebrow">' + t('panel.challenges') + '</p><ul class="ilist">' + ch.map(c => '<li><a href="' + c.href + '">' + esc(c.t) + '</a> <span class="muted small">' + t('ch.kind.' + c.kind) + '</span></li>').join('') + '</ul>' : '') +
      '<p class="eyebrow">' + t('panel.connects') + '</p><div class="conn">' + conn + '</div>' +
      (fs.length ? '<p class="eyebrow">' + t('panel.facts') + '</p><ul class="ilist">' + fs.slice(0, 4).map(f => '<li>' + esc(f.label) + ': <b>' + esc(f.value) + '</b></li>').join('') + '</ul>' : '') +
      (ths.length ? '<p class="eyebrow">' + t('panel.threads') + '</p><div class="row">' + ths.map(x => '<button type="button" class="chip" data-thread="' + x.id + '">' + esc(x.t) + '</button>').join('') + '</div>' : '');
  } else if (state.lens) {
    box.innerHTML = lensInfoHTML(state.lens, state.idea);
  } else {
    const go = (id, d) => '<a href="#' + id + '"><b>' + esc((topicById(id) || {}).t || t('help.mychipT')) + '</b><small>' + t(d) + '</small></a>';
    box.innerHTML = '<p class="code">' + t('help.code') + '</p><h3>' + t('help.title') + '</h3><p>' + t('help.text') + '</p><p class="eyebrow">' + t('help.thread') + '</p><div class="tlist">' + THREADS.map(x => '<button type="button" data-thread="' + x.id + '"><b>' + esc(x.t) + '</b><small>' + esc(x.d) + '</small></button>').join('') + '</div><p class="eyebrow">' + t('help.whatif') + '</p><div class="tlist"><button type="button" data-whatif><b>' + t('help.whatifT') + '</b><small>' + t('help.whatifD') + '</small></button></div><p class="eyebrow">' + t('help.own') + '</p><div class="tlist">' + go('everywhere', 'help.everywhereD') + '</div><p class="eyebrow">' + t('help.build') + '</p><div class="tlist">' + go('mychip', 'help.mychipD') + go('tiny', 'help.tinyD') + go('riscv', 'help.riscvD') + go('build', 'help.buildD') + '</div>';
  }
  /* On narrow screens, show details right under the selected topic's layer. */
  const narrow = innerWidth < 980; const grid = document.querySelector('.mapgrid');
  if (narrow && state.sel) { const band = document.querySelector('#mBands .tnode[data-t="' + state.sel + '"]').closest('.band'); band.after(box); box.classList.add('inline'); }
  else if (narrow && W.on) { $('#mWhatif').after(box); box.classList.add('inline', 'wiinline'); }
  else if (narrow && state.lens && !th && !hits) { $('#mLens').after(box); box.classList.add('inline'); }
  else if (box.parentElement !== grid) { grid.appendChild(box); box.classList.remove('inline'); }
  else box.classList.remove('inline');
  if (!(narrow && W.on && !state.sel)) box.classList.remove('wiinline');
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
  if (W.on) {
    EDGES.forEach(e => { const a = center(e[0], wrap), b = center(e[1], wrap); if (a && b) mk(curve(a, b), 'w faint'); });
    rippleLinks().forEach(r => {
      const a = center(r.a, wrap), b = center(r.b, wrap); if (!a || !b) return;
      const on = !focus || r.a === focus || r.b === focus;
      const p = mk(curve(a, b), 'w rip ' + (r.amt > 0 ? 'up' : 'down') + (on ? '' : ' faint'));
      p.style.strokeWidth = (1.6 + Math.min(2.6, Math.abs(r.amt) / 15)).toFixed(1);
      if (state.sel && (r.a === state.sel || r.b === state.sel)) labels.push([a, b, r.s]);
    });
  } else if (!th && state.lens === 'ideas') {
    /* One big idea: a dashed path through every topic that shows it, top to bottom. */
    if (state.idea) { const u = ideaPath(state.idea); for (let i = 1; i < u.length; i++) { const a = center(u[i - 1].topic, wrap), b = center(u[i].topic, wrap); if (a && b) mk(curve(a, b), 'w idea'); } }
  } else if (!th) {
    /* Quiet: only the focused topic's links. A lens: every link of that kind, with arrows that
       read as its sentence. Two kinds can join one pair; each pair is labelled once. */
    svg.appendChild(markerDefs(NS));
    const pairs = new Set();
    /* With nothing selected, a lens tells one story: its longest chain, bold; the rest faint. */
    const chain = state.lens && !focus ? new Set(longestChain(state.lens)) : null;
    LINKS.forEach(l => {
      if (state.lens && l.kind !== state.lens) return;
      const on = !!focus && (l.from === focus || l.to === focus);
      if (!state.lens && !on) return;
      const a = center(l.from, wrap), b = center(l.to, wrap); if (!a || !b) return;
      const p = mk(curve(a, b), 'w k-' + l.kind + (on || (chain && chain.has(l)) ? ' on' : (focus || chain) ? ' faint' : ''));
      p.setAttribute('marker-end', 'url(#mk-' + l.kind + ')');
      const key = [l.from, l.to].sort().join(' ');
      if (on && state.sel && !pairs.has(key)) { pairs.add(key); labels.push([a, b, l.why]); }
    });
  }
  if (th) { for (let i = 1; i < th.path.length; i++) { const a = center(th.path[i - 1], wrap), b = center(th.path[i], wrap); if (a && b) mk(curve(a, b), 'w path'); } }
  /* Each label sits just outside the node at the far end of its wire, so it reads as
     "this topic: why it connects" and never stacks on the selected node. */
  const L = $('#mSvgL'); L.setAttribute('viewBox', svg.getAttribute('viewBox')); L.innerHTML = '';
  labels.forEach(([a, b, t]) => {
    const sel = center(state.sel, wrap); const o = a.x === sel.x && a.y === sel.y ? b : a;
    const above = !W.on && (Math.abs(o.y - sel.y) < 4 || o.y > sel.y); const y = above ? o.top - 9 : o.bot + 11;
    const tx = document.createElementNS(NS, 'text'); tx.setAttribute('x', o.x); tx.setAttribute('y', y); tx.setAttribute('class', 'wl'); tx.textContent = t; L.appendChild(tx);
  });
}
export const redrawMap = () => { refresh(); };
