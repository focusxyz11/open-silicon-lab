/* The frontier map: every challenge in the lab on one picture. Rows are the bands of the chip stack,
   from the world down to atoms. Columns run from known to unknown: Build (make it work), Break (find
   where it fails), Imagine (try what could come next), and the walls: the open problems in
   src/data/debates.js, which nobody has solved. Pick a wall and lines run from each of its views to
   the challenges that test it; pick a challenge and see which walls it helps with. Each challenge's
   column is its "lens" in its topic.json. On a phone the map shows one column at a time. */
import { BANDS, TOPICS, IDEAS, DEBATES, topicById, bandById, usesOf, debateTopics, debatesOf } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { debateCard } from './hubs.js';
import { levelStars } from './progress.js';
import { P } from './learning.js';
import { issueURL } from './config.js';
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LENSES = ['build', 'break', 'imagine'];
const COLS = LENSES.concat('walls');
const VIEW_COLORS = ['var(--cyan)', 'var(--rose)', 'var(--amber)'];
/* sel: { c: index into CHALLENGES } or { w: debate id }; f: lens shown on wide screens ('' = all);
   col: the one column a phone shows; idea: a big idea whose topics light up. */
const STATES = {};
let st = null, mode = null;   // mode: { lens } on a door page (one column and the walls), or {} for the whole map
CHALLENGES.forEach((c, i) => { c.i = i; });
const inBand = (b, lens) => CHALLENGES.filter(c => c.lens === lens && (topicById(c.topic) || {}).band === b);
const done = c => { const m = /^#riscv-(\d+)$/.exec(c.href); return m ? levelStars(+m[1]) > 0 : !!P.seen[c.topic]; };

let root = null;

/* v: the element to draw into. opts.lens: draw only that column and the walls (a door page);
   without it, the whole map (on the Frontier page, src/app/frontier-page.js, which draws the heading). */
export function renderFrontier(v, opts = {}) {
  root = v; mode = opts;
  const key = opts.lens || 'all';
  st = STATES[key] || (STATES[key] = { sel: null, f: opts.lens || '', col: opts.lens || 'build', idea: '' });
  const lensesHere = opts.lens ? [opts.lens] : LENSES, colsHere = lensesHere.concat('walls');
  const n = Object.fromEntries(LENSES.map(k => [k, CHALLENGES.filter(c => c.lens === k).length]));
  const head = '<div class="fmh"><div class="fmhc fml0"><span class="code">' + t('fm.world') + '</span><b aria-hidden="true">↓</b><small>' + t('fm.atoms') + '</small></div>' + colsHere.map(k => '<div class="fmhc fc-' + k + '"><span class="code">' + t('fm.col.' + k + '.code') + '</span><b>' + t('fm.col.' + k + '.t') + '</b><small>' + t('fm.col.' + k + '.d') + '</small></div>').join('') + '</div>';
  const rows = BANDS.map(b => {
    const empty = !CHALLENGES.some(c => (topicById(c.topic) || {}).band === b.id);
    const cells = lensesHere.map((k, j) => '<div class="fmc fc-' + k + '">' + inBand(b.id, k).map(pill).join('') +
      (empty && j === 0 ? '<a class="fmghost" href="' + esc(issueURL('challenge', { title: '[Challenge] ' + t('fm.proposeCh', { band: b.t }) })) + '" target="_blank" rel="noopener">' + t('fm.empty') + '</a>' : '') + '</div>').join('');
    return '<div class="fmr" data-band="' + b.id + '"><div class="fml"><b>' + esc(b.t) + '</b><small>' + esc(b.d) + '</small></div>' + cells + '</div>';
  }).join('');
  const walls = DEBATES.map(d => '<button type="button" class="fmw" data-w="' + d.id + '"><small>' + t('fm.views', { n: d.views.length }) + '</small>' + esc(d.t) + '</button>').join('') +
    '<a class="fmw propose" href="' + esc(issueURL('view', { title: '[View] ' + t('fm.proposeWall') })) + '" target="_blank" rel="noopener">' + t('fm.wallMissed') + '</a>';
  v.innerHTML =
    '<section class="wrap"><div class="vbar fmbar">' +
      (opts.lens ? '' : '<div class="seg fmwide" role="group" aria-label="' + t('fm.show') + '">' + [''].concat(LENSES).map(k => '<button type="button" data-f="' + k + '" aria-pressed="' + (st.f === k) + '">' + (k ? '<i class="dot fc-' + k + '"></i>' + t('fm.col.' + k + '.t') + ' <small>' + n[k] + '</small>' : t('ch.all') + ' <small>' + CHALLENGES.length + '</small>') + '</button>').join('') + '</div>') +
      '<div class="seg fmnarrow" role="group" aria-label="' + t('fm.show') + '">' + colsHere.map(k => '<button type="button" data-col="' + k + '" aria-pressed="' + (st.col === k) + '"><i class="dot fc-' + k + '"></i>' + t('fm.col.' + k + '.t') + '</button>').join('') + '</div>' +
      '<label class="fmidea">' + t('fm.idea') + ' <select class="fmideasel"><option value="">' + t('fm.ideaNone') + '</option>' + IDEAS.map(i => '<option value="' + i.id + '"' + (st.idea === i.id ? ' selected' : '') + '>' + esc(i.t) + '</option>').join('') + '</select></label>' +
    '</div>' +
    '<div class="fmwrap"><div class="fm' + (opts.lens ? ' door' : '') + '" data-col="' + st.col + '">' + head + '<div class="fmbody"><div class="fmrows">' + rows + '</div><div class="fmwalls">' + walls + '</div><svg class="fmlines" aria-hidden="true"></svg></div></div>' +
    '<aside class="fmpanel" aria-live="polite"></aside></div></section>';
  wire();
  paint();
  requestAnimationFrame(place);
}

function pill(c) {
  return '<button type="button" class="fmp k-' + c.kind.toLowerCase() + ' fc-' + c.lens + (done(c) ? ' done' : '') + '" data-c="' + c.i + '" aria-label="' + esc(t('ch.kind.' + c.kind) + ': ' + c.t + (done(c) ? ' · ' + t('ch.visited') : '')) + '">' + esc(c.t) + '</button>';
}

/* The walls sit beside the layers their views touch; lines need real positions, so both are
   worked out after the page has laid itself out, and again when it resizes. */
function place() {
  const fm = root && root.querySelector('.fm'); if (!fm) return;
  const body = fm.querySelector('.fmbody'), W = fm.querySelector('.fmwalls');
  const narrow = getComputedStyle(W).position !== 'absolute';
  const top = body.getBoundingClientRect().top;
  if (!narrow) {
    const mid = {}; fm.querySelectorAll('.fmr').forEach(r => { const b = r.getBoundingClientRect(); mid[r.dataset.band] = (b.top + b.bottom) / 2 - top; });
    const items = DEBATES.map(d => { const ys = debateTopics(d).map(id => mid[topicById(id).band]); return { d, y: ys.reduce((a, b) => a + b, 0) / ys.length }; }).sort((a, b) => a.y - b.y);
    let last = -Infinity;
    items.forEach(it => { const el = W.querySelector('[data-w="' + it.d.id + '"]'); const h = el.offsetHeight; const y = Math.max(it.y - h / 2, last + 8); el.style.top = y + 'px'; last = y + h; });
    const prop = W.querySelector('.propose'); prop.style.top = Math.max(last + 8, body.offsetHeight - prop.offsetHeight - 10) + 'px';
    const need = last + prop.offsetHeight + 24; body.style.minHeight = need > body.offsetHeight ? need + 'px' : '';
  } else { W.querySelectorAll('.fmw').forEach(el => { el.style.top = ''; }); body.style.minHeight = ''; }
  lines();
}

function lines() {
  const fm = root.querySelector('.fm'), svg = root.querySelector('.fmlines');
  const body = fm.querySelector('.fmbody'), R = body.getBoundingClientRect();
  svg.setAttribute('width', R.width); svg.setAttribute('height', R.height); svg.setAttribute('viewBox', '0 0 ' + R.width + ' ' + R.height);
  if (getComputedStyle(root.querySelector('.fmwalls')).position !== 'absolute' || !st.sel) { svg.innerHTML = ''; return; }
  const at = el => { const b = el.getBoundingClientRect(); return b; };
  const curve = (p, w, col) => { const a = at(p), b = at(w); if (!a.width) return '';
    const x1 = a.right - R.left, y1 = (a.top + a.bottom) / 2 - R.top, x2 = b.left - R.left, y2 = (b.top + b.bottom) / 2 - R.top;
    return '<path d="M' + x1 + ' ' + y1 + ' C' + (x1 + (x2 - x1) * 0.55) + ' ' + y1 + ' ' + (x2 - (x2 - x1) * 0.3) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '" stroke="' + col + '"/>'; };
  let h = '';
  const P_ = i => fm.querySelector('.fmp[data-c="' + i + '"]'), W_ = id => fm.querySelector('.fmw[data-w="' + id + '"]');
  if (st.sel.w) { const d = DEBATES.find(x => x.id === st.sel.w); d.views.forEach((v, k) => CHALLENGES.filter(c => v.topics.includes(c.topic)).forEach(c => { if ((st.f === '' || st.f === c.lens) && P_(c.i)) h += curve(P_(c.i), W_(d.id), VIEW_COLORS[k % 3]); })); }
  else { const c = CHALLENGES[st.sel.c]; if (P_(c.i)) debatesOf(c.topic).forEach(d => { h += curve(P_(c.i), W_(d.id), 'var(--amber)'); }); }
  svg.innerHTML = h;
}

function paint() {
  const fm = root.querySelector('.fm'); fm.dataset.col = st.col;
  const hotC = new Set(), hotW = new Set();
  const ideaT = st.idea ? new Set(usesOf(st.idea).map(u => u.topic)) : null;
  if (st.sel && st.sel.w) { const d = DEBATES.find(x => x.id === st.sel.w); hotW.add(d.id); d.views.forEach(v => CHALLENGES.filter(c => v.topics.includes(c.topic)).forEach(c => hotC.add(c.i))); }
  else if (st.sel) { const c = CHALLENGES[st.sel.c]; CHALLENGES.filter(x => x.topic === c.topic).forEach(x => hotC.add(x.i)); debatesOf(c.topic).forEach(d => hotW.add(d.id)); }
  if (ideaT) CHALLENGES.filter(c => ideaT.has(c.topic)).forEach(c => hotC.add(c.i));
  const focus = !!(st.sel || ideaT);
  fm.querySelectorAll('.fmp').forEach(el => { const c = CHALLENGES[+el.dataset.c];
    el.classList.toggle('dim', (st.f && c.lens !== st.f) || (focus && !hotC.has(c.i)));
    el.classList.toggle('on', !!(st.sel && st.sel.c === c.i)); el.setAttribute('aria-pressed', String(!!(st.sel && st.sel.c === c.i))); });
  fm.querySelectorAll('.fmw[data-w]').forEach(el => { const id = el.dataset.w;
    const touched = ideaT && DEBATES.find(d => d.id === id).views.some(v => v.topics.some(x => ideaT.has(x)));
    el.classList.toggle('dim', (!!st.sel && !hotW.has(id)) || (!st.sel && !!ideaT && !touched));
    el.classList.toggle('on', !!(st.sel && st.sel.w === id)); el.setAttribute('aria-pressed', String(!!(st.sel && st.sel.w === id))); });
  root.querySelectorAll('[data-f]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === st.f)));
  root.querySelectorAll('[data-col]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.col === st.col)));
  panel();
  lines();
}

const chBtn = c => '<button type="button" class="fmtry fc-' + c.lens + '" data-c="' + c.i + '">' + esc(c.t) + '</button>';

function panel() {
  const el = root.querySelector('.fmpanel');
  if (st.sel && st.sel.w) {
    const d = DEBATES.find(x => x.id === st.sel.w);
    el.innerHTML = '<p class="code fcw">' + t('fm.wallCode') + '</p>' + debateCard(d) +
      '<div class="fmtests"><p class="code">' + t('fm.testViews') + '</p>' + d.views.map((v, k) => { const cs = CHALLENGES.filter(c => v.topics.includes(c.topic));
        return '<div class="fmtest" style="--vc:' + VIEW_COLORS[k % 3] + '"><b><i></i>' + esc(v.t) + '</b>' + (cs.length ? '<div class="fmtries">' + cs.map(chBtn).join('') + '</div>' : '<p class="small muted">' + t('fm.noTest') + ' <a href="' + esc(issueURL('idea', { title: t('fm.proposeTest', { view: v.t }) })) + '" target="_blank" rel="noopener">' + t('fm.proposeOne') + '</a></p>') + '</div>'; }).join('') +
      '<p class="small muted">' + t('fm.bet') + '</p></div>';
    return;
  }
  if (st.sel) {
    const c = CHALLENGES[st.sel.c], tp = topicById(c.topic), ws = debatesOf(c.topic), same = CHALLENGES.filter(x => x.topic === c.topic && x.i !== c.i);
    el.innerHTML = '<div class="fmcard"><p class="code"><i class="dot fc-' + c.lens + '"></i>' + t('fm.col.' + c.lens + '.t') + ' · ' + t('ch.kind.' + c.kind) + ' · ' + esc(bandById(tp.band).t) + '</p>' +
      '<h3>' + esc(c.t) + '</h3><p>' + esc(c.d) + '</p><p class="small muted">' + t('fm.inTopic', { topic: '<a href="#' + tp.id + '">' + esc(tp.t) + '</a>' }) + ' ' + esc(tp.s) + '</p>' +
      '<a class="btn primary" href="' + esc(c.href) + '">' + t('fm.play') + ' →</a>' +
      (ws.length ? '<p class="code fcw">' + t('fm.helps', { n: ws.length }) + '</p><div class="fmtries">' + ws.map(d => '<button type="button" class="fmtry fc-walls" data-w="' + d.id + '">' + esc(d.t) + '</button>').join('') + '</div>' : '<p class="small muted">' + t('fm.noWall') + '</p>') +
      (same.length ? '<p class="code">' + t('fm.same', { topic: esc(tp.t) }) + '</p><div class="fmtries">' + same.map(chBtn).join('') + '</div>' : '') + '</div>';
    return;
  }
  const n = Object.fromEntries(LENSES.map(k => [k, CHALLENGES.filter(c => c.lens === k).length]));
  el.innerHTML = '<div class="fmcard"><p class="code">' + t('fm.readCode') + '</p><h3>' + t('fm.readT') + '</h3><p>' + t('fm.readD') + '</p>' +
    '<p class="fmkinds small"><span class="k-puzzle"><i></i>' + t('ch.kind.Puzzle') + '</span><span class="k-design"><i></i>' + t('ch.kind.Design') + '</span><span class="k-experiment"><i></i>' + t('ch.kind.Experiment') + '</span></p>' +
    '<p class="small muted">' + t('fm.counts', { build: n.build, break: n.break, imagine: n.imagine, walls: DEBATES.length }) + '</p></div>' +
    '<div class="fmcard"><p class="code fcw">' + t('fm.edgeCode') + '</p><p>' + t('fm.edge') + '</p><button type="button" class="btn" data-w="memory">' + esc((DEBATES.find(d => d.id === 'memory') || DEBATES[0]).t) + ' →</button></div>';
}

function wire() {
  root.querySelector('.fmwrap').addEventListener('click', e => {
    const c = e.target.closest('[data-c]');
    if (c) { const i = +c.dataset.c; st.sel = st.sel && st.sel.c === i ? null : { c: i }; paint(); reveal(); return; }
    const w = e.target.closest('button[data-w]');
    if (w) { st.sel = st.sel && st.sel.w === w.dataset.w ? null : { w: w.dataset.w }; paint(); reveal(); }
  });
  root.querySelector('.fmbar').addEventListener('click', e => {
    const f = e.target.closest('[data-f]'); if (f) { st.f = f.dataset.f; paint(); return; }
    const k = e.target.closest('[data-col]'); if (k) { st.col = k.dataset.col; paint(); }
  });
  root.querySelector('.fmideasel').addEventListener('change', e => { st.idea = e.target.value; paint(); });
}
/* On a phone the panel sits under the map: bring it into view after a choice. */
function reveal() {
  const el = root.querySelector('.fmpanel'); if (!st.sel || getComputedStyle(root.querySelector('.fmwalls')).position === 'absolute') return;
  el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

/* The Frontier page's wall cards pick a wall on the whole map. */
export function pickWall(id) {
  const s = STATES.all; if (!s) return;
  s.sel = { w: id }; s.col = 'walls';   /* a phone shows the walls column */
  if (st === s && root && root.querySelector('.fm')) { paint(); }
}

/* Walls and lines follow the layout when the window changes size. */
let ro = null;
export function watchFrontier() {
  if (ro || typeof ResizeObserver === 'undefined') return;
  let tm; ro = new ResizeObserver(() => { clearTimeout(tm); tm = setTimeout(() => { const v = root && root.closest('.view'); if (root && root.querySelector('.fm') && v && !v.hidden) place(); }, 80); });
  ro.observe(document.body);
}
