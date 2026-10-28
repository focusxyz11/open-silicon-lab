/* Hash router. One page, five views: the map, a topic, the workshop, challenges and knowledge.
   Links are plain hashes (#litho, #lab-litho-2, #riscv-5), so every place in the lab is shareable. */
import { TOPICS, THREADS, topicById, bandById, edgesOf } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { redraws } from '../core/ui.js';
import { openLevel } from '../labs/riscv-lab.js';
import { factsHTML } from './facts.js';
import { markSeen, P } from './learning.js';
import { initMap, redrawMap, state as mapState } from './map.js';
import { renderWorkshop, renderChallenges, renderKnowledge } from './views.js';
import { issueURL } from './config.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VIEWS = ['map', 'topic', 'workshop', 'challenges', 'knowledge'];
const REF = { glossary: 'Glossary', sources: 'Sources' };
let curView = null, curTopic = null;

function show(view) {
  VIEWS.forEach(v => { const el = $('#view-' + v); if (el) el.hidden = v !== view; });
  const navFor = view === 'topic' ? ((topicById(curTopic) || {}).kind === 'build' ? 'workshop' : 'map') : view;
  document.querySelectorAll('#nav a').forEach(a => { if (a.dataset.v === navFor) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  curView = view;
}

const labsIn = id => [...document.getElementById(id).querySelectorAll('.lab')].map(l => ({ id: l.id, t: ((l.querySelector(':scope > header b') || {}).textContent || '').trim() })).filter(l => l.t);

function renderChrome(id) {
  const t = topicById(id);
  if (!t) { /* glossary or sources */
    $('#topicHead').innerHTML = '<nav class="crumbs" aria-label="Breadcrumb"><a href="#map">Map</a><span>›</span><a href="#knowledge">Knowledge</a><span>›</span><b>' + REF[id] + '</b></nav>';
    $('#rail').innerHTML = '<a class="back" href="#knowledge">← Knowledge</a><p class="eyebrow">Reference</p><a href="#glossary"' + (id === 'glossary' ? ' class="on"' : '') + '>Glossary</a><a href="#sources"' + (id === 'sources' ? ' class="on"' : '') + '>Sources</a>';
    $('#topicFoot').innerHTML = ''; return;
  }
  const b = bandById(t.band);
  const th = mapState.thread ? THREADS.find(x => x.id === mapState.thread && x.path.includes(id)) : null;
  const thIn = THREADS.filter(x => x.path.includes(id));
  let thread = '';
  if (th) {
    const i = th.path.indexOf(id), prev = th.path[i - 1], next = th.path[i + 1];
    thread = '<div class="thbar"><span class="code">Thread · ' + esc(th.t) + '</span><ol>' + th.path.map((p, k) => '<li' + (k === i ? ' class="on"' : '') + (P.seen[p] ? ' data-seen' : '') + '><a href="#' + p + '" title="' + esc(topicById(p).t) + '">' + (k + 1) + '</a></li>').join('') + '</ol><span class="thnav">' + (prev ? '<a href="#' + prev + '">← ' + esc(topicById(prev).t) + '</a>' : '') + (next ? '<a class="next" href="#' + next + '">' + esc(topicById(next).t) + ' →</a>' : '<a href="#map">Back to the map</a>') + '</span><button type="button" class="x" data-endthread aria-label="Leave this thread">×</button></div>';
  } else if (thIn.length) {
    thread = '<div class="thbar quiet"><span class="small muted">On ' + (thIn.length > 1 ? 'the threads' : 'the thread') + '</span>' + thIn.map(x => '<button type="button" class="chip" data-thread="' + x.id + '">' + esc(x.t) + '</button>').join('') + '</div>';
  }
  $('#topicHead').innerHTML = '<nav class="crumbs" aria-label="Breadcrumb"><a href="#map">Map</a><span>›</span><a href="#map" data-band="' + b.id + '">' + esc(b.t) + '</a><span>›</span><b>' + esc(t.t) + '</b></nav>' + thread;
  const labs = labsIn(id); const edges = edgesOf(id);
  const ch = CHALLENGES.filter(c => c.topic === id);
  $('#rail').innerHTML = '<a class="back" href="#map">← Map</a>' +
    (labs.length ? '<p class="eyebrow">Simulations here</p>' + labs.map((l, i) => '<a href="#' + l.id + '" data-lab="' + l.id + '"><span>' + (i + 1) + '</span>' + esc(l.t) + '</a>').join('') : '') +
    (id === 'riscv' ? '<p class="eyebrow">Levels</p>' + [1, 2, 3, 4, 5, 6, 7].map(n => '<a href="#riscv-' + n + '"><span>' + n + '</span>' + esc((CHALLENGES.find(c => c.href === '#riscv-' + n) || {}).t || 'Level ' + n) + '</a>').join('') + '<a href="#riscv-sandbox"><span>∞</span>Free play</a>' : '') +
    '<p class="eyebrow">Connected topics</p>' + edges.map(e => { const out = e[0] === id; const o = topicById(out ? e[1] : e[0]); return '<a class="conn" href="#' + o.id + '"><span>' + (out ? '→' : '←') + '</span><b>' + esc(o.t) + '</b><small>' + esc(e[2]) + '</small></a>'; }).join('');
  $('#topicFoot').innerHTML = factsHTML(id) +
    (ch.length && id !== 'riscv' ? '<div class="hblock"><p class="code">Challenges in this topic</p><div class="chgrid">' + ch.map(c => '<a href="' + c.href + '" class="chcard"><span class="pill out">' + c.kind + '</span><b>' + esc(c.t) + '</b><small>' + esc(c.d) + '</small></a>').join('') + '</div></div>' : '') +
    '<div class="hblock"><p class="code">Where this connects</p><div class="nextgrid">' + edges.map(e => { const out = e[0] === id; const o = topicById(out ? e[1] : e[0]); const ob = bandById(o.band); return '<a href="#' + o.id + '"><span class="code">' + (out ? 'Leads to' : 'Builds on') + ' · ' + esc(ob.t) + '</span><b>' + esc(o.t) + '</b><small>' + esc(e[2]) + '</small></a>'; }).join('') + '</div></div>' +
    feedbackHTML(id, t.t);
}

/* Every topic ends with a way to correct it or improve it. The links open GitHub issue
   forms with the topic already filled in. */
function feedbackHTML(id, title) {
  return '<div class="feedback"><div><p class="code">Help improve this topic</p><p>Spot a mistake, or have an idea for a simulation or challenge? This project is open source and improves through feedback.</p></div><div class="row">' +
    '<a class="btn" href="' + esc(issueURL('correction', { title: '[Correction] ' + title + ': ', topic: id })) + '" target="_blank" rel="noopener">Report a mistake</a>' +
    '<a class="btn" href="' + esc(issueURL('idea', { title: '[Idea] ' + title + ': ', topic: id })) + '" target="_blank" rel="noopener">Suggest an idea</a></div></div>';
}

function showTopic(id, anchor) {
  const changed = curTopic !== id || curView !== 'topic';
  if (changed) {
    curTopic = id;
    document.querySelectorAll('#library > section').forEach(s => { s.hidden = s.id !== id; });
    renderChrome(id);
    show('topic'); markSeen(id);
    requestAnimationFrame(() => redraws.forEach(f => { try { f(); } catch (e) { /* a lab redraw failed */ } }));
  }
  document.querySelectorAll('#rail a').forEach(a => a.classList.toggle('on', !!anchor && a.getAttribute('href') === '#' + anchor));
  if (anchor) { const el = document.getElementById(anchor); if (el) { requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: changed ? 'instant' : 'smooth' })); return; } }
  if (changed) scrollTo({ top: 0, behavior: 'instant' });
}

function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  document.dispatchEvent(new CustomEvent('osl:route', { detail: h }));
  if (!h || h === 'map') { show('map'); curTopic = null; redrawMap(); return; }
  if (h === 'workshop') { renderWorkshop(); show('workshop'); scrollTo({ top: 0, behavior: 'instant' }); return; }
  if (h === 'challenges') { renderChallenges(); show('challenges'); scrollTo({ top: 0, behavior: 'instant' }); return; }
  if (h === 'knowledge') { renderKnowledge(); show('knowledge'); scrollTo({ top: 0, behavior: 'instant' }); return; }
  const rv = /^riscv-(\d+|sandbox)$/.exec(h);
  if (rv) { const wasRv = curTopic === 'riscv' && curView === 'topic'; showTopic('riscv', wasRv ? null : 'rvLevels'); openLevel(rv[1] === 'sandbox' ? 0 : +rv[1]); document.querySelectorAll('#rail a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + h)); return; }
  if (topicById(h) || REF[h]) { showTopic(h, null); return; }
  const el = document.getElementById(h); const sec = el && el.closest('#library > section');
  if (sec) { showTopic(sec.id, h); return; }
  show('map'); redrawMap();
}

export function initRouter() {
  initMap();
  /* Thread chips and band links in the topic header steer the map's state. */
  document.addEventListener('click', e => {
    const th = e.target.closest('#topicHead [data-thread]'); if (th) { mapState.thread = th.dataset.thread; renderChrome(curTopic); return; }
    if (e.target.closest('[data-endthread]')) { mapState.thread = null; renderChrome(curTopic); return; }
    const st = e.target.closest('[data-start-thread]'); if (st) mapState.thread = st.dataset.startThread;
    const bd = e.target.closest('#topicHead [data-band]'); if (bd) { mapState.sel = curTopic; mapState.thread = null; }
  });
  addEventListener('hashchange', route);
  document.addEventListener('osl:progress', () => { if (curView === 'challenges') renderChallenges(); });
  route();
}
