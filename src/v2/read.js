/* Reading: every experiment as a plain document, made from the same data the pictures and challenges use
   (src/data/experiments/, src/engines/experiments.js), so nothing is written twice and the words cannot drift
   from what the lab can do. An experiment's page: its question; whether it can be tried now, and where; what is
   true (the notes where it is seen, the engine that judges it, figures with their sources, real cases); what is
   open (what it waits for, what people try, directions that drop a given, where informed people disagree); and
   the ways on, worked out from what experiments share. Never chapters: no page leads to a "next" one.

   The index (#/read) is the questions and challenges the lab has, by what can be done with them now. The eleven
   core questions are never listed: one appears under an experiment only once it has been earned (rootShown). */
import { t, has, fmtDate } from '../core/i18n.js';
import { THREADS, CASES } from '../data/weave.js';
import { DEBATES } from '../data/debates.js';
import { engineOf, directionOf } from '../data/layers.js';
import * as X from '../engines/experiments.js';
import { rootShown } from '../engines/weave.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ext = (href, html) => '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + html + '</a>';
const hue = w => (THREADS.find(x => x.id === w) || { hue: 0 }).hue;
export const colorOf = x => 'hsl(' + hue(x.world) + ' 70% 55%)';
export const askOf = x => (has('exp.' + x.id + '.ask') || !(x.stops || []).length ? t('exp.' + x.id + '.ask') : t('stop.' + x.stops[0] + '.q'));
const level = d => t('depth.' + d + '.name');
const dirName = id => (has('layer.dir.' + id) ? t('layer.dir.' + id) : t('way.' + id + '.t'));
const stageName = n => { const L = t('way.stages'); return (Array.isArray(L) ? L : String(L).split(','))[n] || ''; };

/* a question as a card, for the index, the first page and the ways on */
const noteOf = x => { const p = X.playOf(x), at = X.levelsOf(x).slice(0, 2).map(level).join(' · ');
  return (p ? t('read.kind.' + p.kind) + ' · ' : '') + at; };
export function card(x, note) {
  return '<a class="qcard" href="#/read/' + esc(x.id) + '" style="--qc:' + colorOf(x) + '" data-q="' + esc(askOf(x).toLowerCase()) + '">' +
    '<span class="q">' + esc(askOf(x)) + '</span><span class="small muted">' + esc(note || noteOf(x)) + '</span></a>';
}

/* the label of the button that plays it */
function playHtml(x, titleOf, chOf) {
  const p = X.playOf(x); if (!p) return '';
  const ch = p.kind === 'ch' ? chOf(p.id) : null;
  const label = ch ? t('read.try.ch', { name: titleOf(ch) }) : t('read.try.' + p.kind);
  return '<div class="readplay"><a class="btn primary" href="' + esc(p.href) + '">' + esc(label) + '</a>' +
    ((x.ch || []).slice(1).map(id => chOf(id)).filter(Boolean).map(c => '<a class="btn ghost" href="#/do/' + esc(c.id) + '">' + esc(titleOf(c)) + '</a>').join('')) + '</div>';
}

/* one experiment, as a document. ctx: { S, FACT, titleOf, chOf, didOn } */
export function experimentHtml(id, ctx) {
  const x = X.experimentOf(id);
  if (!x) return '<p class="kicker">' + esc(t('read.k')) + '</p><h1>' + esc(t('read.missing')) + '</h1><p><a class="btn" href="#/read">' + esc(t('read.all')) + '</a></p>';
  const st = X.stateOf(x), ask = askOf(x), e = x.engine && engineOf(x.engine), FACT = ctx.FACT || {};
  let h = '<article class="readx" style="--qc:' + colorOf(x) + '">';
  h += '<p class="kicker"><span class="rstate rs-' + st + '">' + esc(t('read.state.' + st)) + '</span></p>';
  h += '<h1 class="readq">' + esc(ask) + '</h1>' + playHtml(x, ctx.titleOf, ctx.chOf);

  /* what is true: where it is seen, each with its note; the engine; the figures and the real cases */
  let tr = '';
  for (const s of x.stops || []) {
    const [th, d] = s.split('.'), q = t('stop.' + s + '.q');
    tr += '<div class="seen"><p class="kicker"><a href="#/ask/' + esc(th) + '/' + esc(d) + '">' + esc(t('read.at', { level: level(d) })) + '</a></p>' +
      (q !== ask ? '<p class="q2">' + esc(q) + '</p>' : '') + '<p>' + esc(t('stop.' + s + '.note')) + '</p></div>';
  }
  if (!(x.stops || []).length && (x.at || []).length) tr += '<p class="small muted">' + esc(t('read.about', { levels: x.at.map(level).join(' · ') })) + '</p>';
  if (e && e.state !== 'missing' && !x.wants) tr += '<p class="readeng"><b>' + esc(t('read.engine', { name: t('layer.engine.' + e.id) })) + '</b> ' + esc(t('layer.engine.' + e.id + '.does')) + '</p>';
  else if (!e && !x.wants) tr += '<p class="small muted">' + esc(t('read.noEngine')) + '</p>';
  const figs = X.figuresOf(x).map(f => FACT[f]).filter(Boolean);
  if (figs.length) tr += '<p class="kicker">' + esc(t('trail.figures')) + '</p><ul class="figs2">' + figs.map(f => '<li><b>' + esc(f.value) + '</b> ' + esc(f.label) + '<span class="small muted"> · ' + ext(f.url, esc(f.source)) + ' · ' + esc(t('trail.checked', { kind: t('fact.' + f.kind), date: fmtDate(f.verified) })) + '</span></li>').join('') + '</ul>';
  for (const cid of X.casesOf(x)) { const c = CASES.find(k => k.id === cid); if (!c) continue;
    tr += '<details class="case2"><summary><span class="kicker">' + esc(t('trail.case', { year: c.year })) + '</span> <b>' + esc(t('case.' + c.id + '.t')) + '</b></summary>' +
      ['what', 'why', 'after'].map(k => '<p class="small">' + esc(t('case.' + c.id + '.' + k)) + '</p>').join('') + '<p class="small muted">' + ext(c.url, esc(t('case.' + c.id + '.src'))) + '</p></details>'; }
  h += '<section class="readsec"><h2>' + esc(t('read.true')) + '</h2>' + tr + '</section>';

  /* what is open: what it waits for, what people try, directions, and where informed people disagree */
  let op = '';
  if (x.wants) { const w = engineOf(x.wants);
    op += '<p class="readwant">' + esc(w ? t('read.wants.engine', { name: t('layer.engine.' + w.id) }) + ' ' + t('layer.engine.' + w.id + '.does') : x.wants === 'part' && e ? t('read.wants.part', { name: t('layer.engine.' + e.id) }) : t('read.wants.outside')) + '</p>'; }
  const tried = X.triedOf(x).flatMap(s => { const L = t('stop.' + s + '.tried'); return Array.isArray(L) ? L : []; });
  if (tried.length) op += '<p class="kicker">' + esc(t('trail.tried')) + '</p><ul class="tried2">' + tried.map(v => '<li>' + esc(v) + '</li>').join('') + '</ul>';
  const dirs = (x.open || []).map(directionOf).filter(Boolean);
  if (dirs.length) op += '<p class="kicker">' + esc(t('read.dirs')) + '</p><ul class="readdirs">' + dirs.map(d => '<li><b>' + esc(dirName(d.id)) + '</b> <span class="small muted">· ' + esc(stageName(d.stage)) + ' · ' + esc(t('read.drops', { givens: d.drops.map(g => t('layer.given.' + g)).join(', ') })) + '</span>' +
    (has('way.' + d.id + '.how') ? '<span class="small">' + esc(t('way.' + d.id + '.how')) + ' <em>' + esc(t('way.' + d.id + '.catch')) + '</em></span>' : '') + '</li>').join('') + '</ul>';
  const db = x.debate && DEBATES.find(d => d.id === x.debate);
  if (db) { op += '<p class="kicker">' + esc(t('read.debate')) + '</p><div class="readdeb"><p><b>' + esc(t('debate.' + db.id + '.t')) + '</b> ' + esc(t('debate.' + db.id + '.q')) + '</p>';
    for (let i = 1; i <= db.views; i++) op += '<div class="view"><p class="small"><b>' + esc(t('debate.' + db.id + '.v' + i + '.t')) + '</b> ' + esc(t('debate.' + db.id + '.v' + i + '.claim')) + '</p><p class="small muted">' + esc(t('read.assumes')) + ' ' + esc(t('debate.' + db.id + '.v' + i + '.assumes')) + '</p></div>';
    op += '</div>'; }
  if (!op) op = '<p class="small muted">' + esc(t('read.openNone')) + '</p>';
  h += '<section class="readsec"><h2>' + esc(t('read.open')) + '</h2>' + op + '</section>';

  /* what it trades and stands on: small, because it is the joint between experiments, not their content */
  const tags = (x.trade || []).map(m => t('layer.measure.' + m)), giv = (x.given || []).map(g => t('layer.given.' + g));
  h += '<p class="readtags small"><span><b>' + esc(t('read.lens')) + '</b> ' + esc(t('layer.lens.' + x.lens)) + '</span>' + (tags.length ? '<span><b>' + esc(t('read.trades')) + '</b> ' + esc(tags.join(' · ')) + '</span>' : '') + (giv.length ? '<span><b>' + esc(t('read.given')) + '</b> ' + esc(giv.join(' · ')) + '</span>' : '') + '</p>';

  /* ways on: worked out, never a trail */
  const W = X.waysOn(x);
  if (W.length) h += '<section class="readsec"><h2>' + esc(t('read.ways')) + '</h2><div class="qgrid">' + W.map(w => card(X.experimentOf(w.id), waysBy(w))).join('') + '</div></section>';

  /* the question underneath, once it has been earned */
  const S = ctx.S;
  if (S && rootShown(S.met[x.world], ctx.didOn(S, x.world))) h += '<div class="root2"><p class="small muted">' + esc(t('ui.rootOf')) + '</p><p class="rootq">' + esc(t('thread.' + x.world + '.root')) + '</p></div>';
  return h + '<p class="small muted readback"><a href="#/read">' + esc(t('read.all')) + '</a></p></article>';
}
function waysBy(w) {
  const what = !w.what ? '' : w.by === 'engine' ? t('layer.engine.' + w.what) : w.by === 'dir' ? dirName(w.what) : w.by === 'given' ? t('layer.given.' + w.what) : w.by === 'level' ? level(w.what) : w.by === 'lens' ? t('layer.lens.' + w.what) : w.by === 'measure' ? t('layer.measure.' + w.what) : '';
  return t('read.by.' + w.by, { what });
}

/* the experiments in an order that mixes the worlds, so no colour gathers and no list reads as a chapter */
export function mixed(L) {
  const by = {}; L.forEach(x => (by[x.world] = by[x.world] || []).push(x));
  const out = [], keys = Object.keys(by);
  for (let i = 0; out.length < L.length; i++) keys.forEach(k => { if (by[k][i]) out.push(by[k][i]); });
  return out;
}
/* the index: questions and challenges, by what can be done with them now */
export function indexHtml() {
  let h = '<p class="kicker">' + esc(t('read.k')) + '</p><h1>' + esc(t('read.title')) + '</h1><p class="lead">' + esc(t('read.lead', { n: X.EXPERIMENTS.length })) + '</p>';
  h += '<div class="jump"><input type="search" data-readfind autocomplete="off" placeholder="' + esc(t('read.find')) + '" aria-label="' + esc(t('read.find')) + '"></div><p class="small muted" data-readnone hidden>' + esc(t('read.none')) + '</p>';
  for (const st of X.STATES) {
    const L = mixed(X.EXPERIMENTS.filter(x => X.stateOf(x) === st));
    h += '<section class="stepsec" data-readsec><h2>' + esc(t('read.sec.' + st)) + ' <span class="small muted">' + L.length + '</span></h2><p class="small muted">' + esc(t('read.secd.' + st)) + '</p><div class="qgrid">' + L.map(x => card(x)).join('') + '</div></section>';
  }
  return h;
}
/* filter the index as someone types: a section with nothing left hides */
export function filterIndex(root, q) {
  q = q.trim().toLowerCase(); let any = false;
  root.querySelectorAll('[data-readsec]').forEach(sec => { let n = 0;
    sec.querySelectorAll('.qcard').forEach(c => { const on = !q || c.dataset.q.includes(q); c.hidden = !on; if (on) n++; });
    sec.hidden = !n; if (n) any = true; });
  const none = root.querySelector('[data-readnone]'); if (none) none.hidden = any;
}

/* the first page: a few questions to start with, changing day by day, all of them things you can do now */
export function starters(n = 3, day = Math.floor(Date.now() / 864e5)) {
  const L = mixed(X.EXPERIMENTS.filter(x => X.stateOf(x) === 'live' && !(x.ch || []).length));
  return Array.from({ length: Math.min(n, L.length) }, (_, i) => L[(day * n + i) % L.length]);
}
