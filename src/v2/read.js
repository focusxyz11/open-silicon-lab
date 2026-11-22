/* Reading: every experiment as a plain document, made from the same data the pictures and challenges use
   (src/data/experiments/, src/engines/experiments.js), so nothing is written twice and the words cannot drift
   from what the lab can do. An experiment's page: its question; whether it can be tried now, and where; what is
   true (the notes where it is seen, the engine that judges it, figures with their sources, real cases); what is
   open (what it waits for, what people try, directions that drop a given, where informed people disagree); and
   the ways on, worked out from what experiments share. Never chapters: no page leads to a "next" one.

   The index (#/read) is the questions and challenges the lab has, by what can be done with them now. The eleven
   core questions are never listed: one appears under an experiment only once it has been earned (rootShown). */
import { t, has, fmtDate, fmtNum, fmtWords } from '../core/i18n.js';
import { THREADS, CASES } from '../data/weave.js';
import { DEBATES } from '../data/debates.js';
import { engineOf, directionOf } from '../data/layers.js';
import * as X from '../engines/experiments.js';
import { rootShown } from '../engines/weave.js';
import { probeOf, startOf } from './probes.js';
import { YEAR } from '../engines/floor.js';
import { levelAt } from '../data/atlas.js';
import { DEPTHS } from '../data/weave.js';
import { STAGES, stageOfPlace } from '../engines/way.js';
import { readHtml, tryHtml } from './frame2.js';

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
  return '<a class="qcard" href="#/read/' + esc(x.id) + '" style="--qc:' + colorOf(x) + '"' + ' data-f2x="' + esc(x.id) + '"' + ' data-q="' + esc(askOf(x).toLowerCase()) + '">' +
    '<span class="q">' + esc(askOf(x)) + '</span><span class="small muted">' + esc(note || noteOf(x)) + '</span></a>';
}

/* the label of the button that plays it */
function playHtml(x, titleOf, chOf, chip) {
  const p = X.playOf(x); if (!p) return '';
  if (p.kind === 'probe') return probeHtml(x, chip);
  const ch = p.kind === 'ch' ? chOf(p.id) : null;
  const label = ch ? t('read.try.ch', { name: titleOf(ch) }) : t('read.try.' + p.kind);
  return '<div class="readplay"><a class="btn primary" href="' + esc(p.href) + '">' + esc(label) + '</a>' +
    ((x.ch || []).slice(1).map(id => chOf(id)).filter(Boolean).map(c => '<a class="btn ghost" href="#/do/' + esc(c.id) + '">' + esc(titleOf(c)) + '</a>').join('')) + '</div>';
}

/* ---- a try on the page (src/v2/probes.js): controls, and the engine's answer in words and one small picture ---- */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = n => String(n).replace('-', '⁻').replace(/\d/g, d => SUP[d]);
const sci = v => { const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return fmtNum(Number(m.toPrecision(2))) + ' × 10' + sup(e); };
export const num = v => typeof v !== 'number' ? String(v) : !Number.isFinite(v) ? '—' : v === 0 ? '0'
  : Math.abs(v) >= 1e15 || Math.abs(v) < 1e-3 ? sci(v) : Math.abs(v) >= 1e6 ? fmtWords(v) : Number.isInteger(v) ? fmtNum(v) : fmtNum(Number(v.toPrecision(2)));
/* a length of time, in the largest unit that keeps it readable */
export function dur(s) {
  const U = [['y', YEAR], ['d', 86400], ['h', 3600], ['min', 60], ['s', 1]], [u, k] = U.find(([, k]) => s >= k) || U[U.length - 1], v = s / k;
  return t('probe.dur.' + u, { v: num(v < 10 && !Number.isInteger(v) ? Number(v.toPrecision(2)) : v >= 10 && v < 1e6 ? Math.round(v) : v), n: v });
}
const fill = vars => vars ? Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, k === 'n' ? v : v && typeof v === 'object' && 's' in v ? dur(v.s) : num(v)])) : vars;
const cell = c => c && typeof c === 'object' ? (c.code != null ? '<code>' + esc(c.code) + '</code>' : esc(t(c.key, fill(c.vars)))) : esc(num(c));
const valName = (c, i) => { const v = c.values[i]; if (c.keys) return t(c.keys[i]); if (c.names) { const L = t(c.names); return Array.isArray(L) ? L[i] : String(v); } return c.each ? t(c.each, { k: v, v, n: v }) : String(v); };
const VALS = {};
function barsHtml(B) {
  const L = B.items.map(b => (b.v > 0 ? Math.log10(b.v) : null)), ok = L.filter(v => v != null), lo = Math.floor(Math.min(...ok)) - 0.4, hi = Math.max(...ok);
  return '<div class="pbars">' + B.items.map((b, i) => '<div class="pbar' + (b.floor ? ' floor' : '') + '"><span class="pl">' + esc(t(b.key)) + '</span><span class="pt"><i style="width:' + (L[i] == null ? 0 : (4 + 96 * (L[i] - lo) / Math.max(1e-9, hi - lo))).toFixed(1) + '%"></i></span><span class="pv">' + esc(b.v > 0 ? t(B.unit, { v: sci(b.v) }) : '0') + '</span></div>').join('') + '<p class="small muted">' + esc(t('probe.tenfold')) + '</p></div>';
}
function lineHtml(Ln, label) {
  const n = Ln.pts.length, X = i => 24 + i * (284 / (n - 1)), Y = v => 104 - v * 92, pts = Ln.pts.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  return '<svg class="pline" viewBox="0 0 320 124" role="img" aria-label="' + esc(label) + '"><rect class="band" x="24" y="' + Y(Ln.hi) + '" width="284" height="' + (Y(Ln.lo) - Y(Ln.hi)) + '"></rect>' +
    '<line class="ax" x1="24" y1="' + Y(1) + '" x2="308" y2="' + Y(1) + '"></line><line class="ax" x1="24" y1="' + Y(0) + '" x2="308" y2="' + Y(0) + '"></line>' +
    '<text x="12" y="' + (Y(1) + 4) + '">1</text><text x="12" y="' + (Y(0) + 4) + '">0</text><polyline points="' + pts + '"></polyline>' +
    Ln.pts.map((v, i) => '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="3.2" class="' + (v >= Ln.hi ? 'hi' : v <= Ln.lo ? 'lo' : 'mid') + '"></circle>').join('') + '</svg>';
}
export function probeHtml(x, chip) {
  const P = probeOf(x.id); if (!P) return '';
  const v = VALS[x.id] || (VALS[x.id] = startOf(P, chip || {})), R = P.run(v, chip || {}), says = R.says.map(s => t(s.key, fill(s.vars)));
  let h = '<section class="probe" data-probe="' + esc(x.id) + '"><p class="kicker">' + esc(t('probe.k')) + '</p>';
  h += P.controls.map(c => '<div class="pctl"><span class="small"><b>' + esc(t(c.label)) + '</b></span><div class="chips">' + c.values.map((val, i) => '<button type="button" class="chipb" data-pk="' + esc(c.k) + '" data-pv="' + i + '" aria-pressed="' + (val === v[c.k]) + '">' + esc(valName(c, i)) + '</button>').join('') + '</div></div>').join('');
  h += '<div class="pout" aria-live="polite">' + says.map((w, i) => '<p' + (i ? '' : ' class="plead"') + '>' + esc(w) + '</p>').join('');
  if (R.bars) h += barsHtml(R.bars);
  if (R.line) h += lineHtml(R.line, says[0]);
  if (R.table) h += '<div class="ptabw"><table class="ptab"><thead><tr>' + R.table.head.map(k => '<th>' + esc(t(k)) + '</th>').join('') + '</tr></thead><tbody>' + R.table.rows.map(r => '<tr>' + r.map((c, i) => '<td data-h="' + esc(t(R.table.head[i])) + '">' + cell(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  if (R.foot) h += '<p class="small muted">' + esc(t(R.foot)) + '</p>';
  return h + '</div></section>';
}
/* a control was picked: the engine runs again and the try is drawn anew, with the same control in focus */
export function probePick(btn, chip) {
  const sec = btn.closest('[data-probe]'), x = sec && X.experimentOf(sec.dataset.probe), P = x && probeOf(x.id); if (!P) return;
  const c = P.controls.find(k => k.k === btn.dataset.pk); if (!c) return;
  VALS[x.id] = Object.assign({}, VALS[x.id] || startOf(P, chip || {}), { [c.k]: c.values[+btn.dataset.pv] });
  const wrap = document.createElement('div'); wrap.innerHTML = probeHtml(x, chip); const fresh = wrap.firstElementChild;
  sec.replaceWith(fresh); const f = fresh.querySelector('[data-pk="' + c.k + '"][data-pv="' + btn.dataset.pv + '"]'); if (f) f.focus();
}

/* one experiment, as a document. ctx: { S, FACT, titleOf, chOf, didOn } */
export function experimentHtml(id, ctx) {
  const x = X.experimentOf(id);
  if (!x) return '<p class="kicker">' + esc(t('read.k')) + '</p><h1>' + esc(t('read.missing')) + '</h1><p><a class="btn" href="#/read">' + esc(t('read.all')) + '</a></p>';
  const st = X.stateOf(x), ask = askOf(x), e = x.engine && engineOf(x.engine), FACT = ctx.FACT || {};
  const head = '<p class="kicker"><span class="rstate rs-' + st + '">' + esc(t('read.state.' + st)) + '</span></p><h1 class="readq">' + esc(ask) + '</h1>';
  /* a reading page (Read, src/v2/frame2.js): the try on the page is the picture pinned beside the words, and the
     words try it; a question with no try of its own is seen where it sits among the others, with the ways on */
  const p = X.playOf(x), probe = p && p.kind === 'probe', chip = ctx.S && ctx.S.chip;
  let h = probe ? '<div class="readplay">' + tryHtml() + '</div>' : playHtml(x, ctx.titleOf, ctx.chOf, chip);

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
  const tried = X.triedOf(x).flatMap(s => { const L = has('stop.' + s + '.tried') ? t('stop.' + s + '.tried') : null; return Array.isArray(L) ? L : []; });
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
  h += '<p class="small muted readback"><a href="#/read">' + esc(t('read.all')) + '</a></p>';
  return readHtml({ cls: 'readx', style: '--qc:' + colorOf(x), head, picture: probe ? probeHtml(x, chip) : mapHtml(x, W.map(w => w.id)), text: h });
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
/* ---- the questions as one picture (Read, src/v2/frame2.js): every question a dot, in the row of the stage of a chip's
   life where it is met and in the order of its level, filled when it can be tried now. A dot opens its question; a
   card in the words and its dot light together, and the finder dims the dots it leaves out. me: the question on
   this page, ringed; ways: the ways on from it, circled ---- */
const LEVELS = Object.keys(DEPTHS);
const stageOfX = x => { const l = X.levelsOf(x)[0], h = l && levelAt(l); return (h && stageOfPlace(h.place)) || 'open'; };
const lvOf = x => { const i = LEVELS.indexOf(X.levelsOf(x)[0]); return i < 0 ? LEVELS.length : i; };
export function mapHtml(me, ways = []) {
  const rows = STAGES.map(s => [s, X.EXPERIMENTS.filter(x => stageOfX(x) === s).sort((a, b) => lvOf(a) - lvOf(b) || X.STATES.indexOf(X.stateOf(a)) - X.STATES.indexOf(X.stateOf(b)))]).filter(r => r[1].length);
  const dot = x => '<a class="f2dot' + (X.stateOf(x) === 'live' ? ' f2live' : '') + (me && me.id === x.id ? ' f2me' : ways.includes(x.id) ? ' f2way' : '') + '" href="#/read/' + esc(x.id) + '" tabindex="-1" style="--qc:' + colorOf(x) + '" data-f2x="' + esc(x.id) + '" data-q="' + esc(askOf(x).toLowerCase()) + '" aria-label="' + esc(askOf(x)) + '"></a>';
  return '<section class="f2qmap"><p class="kicker">' + esc(t('frame2.mapK')) + '</p>' +
    rows.map(([s, L]) => '<div class="f2qrow"><p class="f2qst"><b>' + esc(t('loop.stage.' + s)) + '</b><span class="f2fig">' + L.length + '</span></p><div class="f2qdots">' + L.map(dot).join('') + '</div></div>').join('') +
    '<p class="f2qkey"><span><i class="f2dot f2live"></i>' + esc(t('frame2.mapLive')) + '</span><span><i class="f2dot"></i>' + esc(t('frame2.mapWait')) + '</span>' +
    (me ? '<span><i class="f2dot f2live f2me"></i>' + esc(t('frame2.mapMe')) + '</span>' + (ways.length ? '<span><i class="f2dot f2live f2way"></i>' + esc(t('frame2.mapWays')) + '</span>' : '') : '') + '</p>' +
    '<p class="f2qsay" data-f2say>' + esc(t('frame2.mapHint')) + '</p></section>';
}

/* the index: questions and challenges, by what can be done with them now */
export function indexHtml() {
  const head = '<p class="kicker">' + esc(t('read.k')) + '</p><h1>' + esc(t('read.title')) + '</h1><p class="lead">' + esc(t('read.lead', { n: X.EXPERIMENTS.length })) + '</p>';
  let h = '<div class="jump"><input type="search" data-readfind autocomplete="off" placeholder="' + esc(t('read.find')) + '" aria-label="' + esc(t('read.find')) + '"></div><p class="small muted" data-readnone hidden>' + esc(t('read.none')) + '</p>';
  for (const st of X.STATES) {
    const L = mixed(X.EXPERIMENTS.filter(x => X.stateOf(x) === st));
    h += '<section class="stepsec" data-readsec><h2>' + esc(t('read.sec.' + st)) + ' <span class="small muted">' + L.length + '</span></h2><p class="small muted">' + esc(t('read.secd.' + st)) + '</p><div class="qgrid">' + L.map(x => card(x)).join('') + '</div></section>';
  }
  return readHtml({ head, picture: mapHtml(null), text: h });
}
/* filter the index as someone types: a section with nothing left hides */
export function filterIndex(root, q) {
  q = q.trim().toLowerCase(); let any = false;
  root.querySelectorAll('[data-readsec]').forEach(sec => { let n = 0;
    sec.querySelectorAll('.qcard').forEach(c => { const on = !q || c.dataset.q.includes(q); c.hidden = !on; if (on) n++; });
    sec.hidden = !n; if (n) any = true; });
  const none = root.querySelector('[data-readnone]'); if (none) none.hidden = any;
  root.querySelectorAll('.f2qmap .f2dot[data-q]').forEach(d => d.classList.toggle('f2off', !!q && !d.dataset.q.includes(q)));
}

/* the first page: a few questions to start with, changing day by day, all of them things you can do now */
export function starters(n = 3, day = Math.floor(Date.now() / 864e5)) {
  const L = mixed(X.EXPERIMENTS.filter(x => X.stateOf(x) === 'live' && !(x.ch || []).length));
  return Array.from({ length: Math.min(n, L.length) }, (_, i) => L[(day * n + i) % L.length]);
}
