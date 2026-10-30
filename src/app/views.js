/* Workshop, Challenges and Knowledge: three ways into the same topics. Each reads the shared
   data (topics, challenges, cards, facts), so nothing is duplicated and nothing is locked. */
import { BANDS, TOPICS, topicById, bandById } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { allTradeoffsHTML, allMeasuresHTML, allDebatesHTML } from './hubs.js';
import { CARDS, TH } from '../data/cards.js';
import { FACTS, fmtDate, changesHTML } from './facts.js';
import { levelStars, riscvStars } from './progress.js';
import { TOPIC_FILES } from '../generated/catalog.js';
import { P } from './learning.js';
import { allIdeasHTML } from './connections.js';
import { t } from '../core/i18n.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? String(u) : '';
const tName = id => (topicById(id) || { t: id }).t;
const labsIn = id => (TOPIC_FILES[id] || { labs: [] }).labs;
const stars = n => '<span class="stars"><span>' + '★'.repeat(n) + '</span><span class="off">' + '★'.repeat(3 - n) + '</span></span>';

/* ---------------- Workshop ---------------- */
/* The four builds; their words are "ws.<id>.t / .d / .steps / .link" in src/i18n. */
const BUILDS = [{ id: 'tiny', n: '01', link: true }, { id: 'riscv', n: '02', link: true }, { id: 'build', n: '03' }, { id: 'agent', n: '04' }];
let wsQuery = '';
export function renderWorkshop() {
  const v = $('#view-workshop');
  const rs = riscvStars();
  const n = TOPICS.reduce((s, x) => s + labsIn(x.id).length, 0);
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">' + t('ws.eyebrow') + '</p><h1>' + t('ws.title') + '</h1><p class="lede">' + t('ws.lede', { n }) + '</p></section>' +
    '<section class="wrap buildline">' + BUILDS.map(b => '<div class="bstation"><a class="bcard" href="#' + b.id + '"><span class="bn">' + b.n + '</span><div><b>' + esc(t('ws.' + b.id + '.t')) + '</b><p>' + esc(t('ws.' + b.id + '.d')) + '</p><ol class="bsteps">' + t('ws.' + b.id + '.steps').map((s, k) => '<li' + (b.id === 'riscv' && levelStars(k + 1) ? ' class="done"' : '') + '>' + esc(s) + '</li>').join('') + '</ol>' + (b.id === 'riscv' ? '<small class="muted">' + t('ws.stars', { n: rs }) + '</small>' : '<small class="muted">' + (P.seen[b.id] ? t('ws.opened') : t('ws.notOpened')) + '</small>') + '</div><span class="go">' + t('ws.open') + '</span></a>' + (b.link ? '<p class="blink"><span aria-hidden="true">↓</span>' + esc(t('ws.' + b.id + '.link')) + '</p>' : '') + '</div>').join('') + '</section>' +
    '<section class="wrap"><div class="vbar"><h2>' + t('ws.playground') + '</h2><input type="search" id="wsQ" placeholder="' + t('ws.find') + '" aria-label="' + t('ws.find') + '" value="' + esc(wsQuery) + '"></div><div id="wsGrid"></div></section>';
  const draw = () => {
    const q = wsQuery.toLowerCase();
    $('#wsGrid').innerHTML = BANDS.map(b => { const tiles = TOPICS.filter(x => x.band === b.id).flatMap(x => labsIn(x.id).map(l => ({ ...l, topic: x }))).filter(l => !q || (l.t + ' ' + l.topic.t).toLowerCase().includes(q)); return tiles.length ? '<div class="pgband"><p class="eyebrow">' + esc(b.t) + '</p><div class="pgrid">' + tiles.map(l => '<a href="#' + l.id + '"><b>' + esc(l.t) + '</b><small>' + esc(l.topic.t) + '</small></a>').join('') + '</div></div>' : ''; }).join('') || '<p class="muted">' + t('ws.none') + '</p>';
  };
  $('#wsQ').addEventListener('input', e => { wsQuery = e.target.value.trim(); draw(); });
  draw();
}

/* ---------------- Challenges ---------------- */
let chKind = '';
export function renderChallenges() {
  const v = $('#view-challenges');
  const kinds = ['', 'Puzzle', 'Design', 'Experiment'];   // i18n-ok: kind ids from topic.json, shown through ch.kind.*
  const status = c => { const m = /^#riscv-(\d+)$/.exec(c.href); if (m) { const s = levelStars(+m[1]); return stars(s); } return P.seen[c.topic] ? '<span class="vis">' + t('ch.visited') + '</span>' : ''; };
  const list = CHALLENGES.filter(c => !chKind || c.kind === chKind);
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">' + t('ch.eyebrow') + '</p><h1>' + t('ch.title') + '</h1><p class="lede">' + t('ch.lede') + '</p></section>' +
    '<section class="wrap"><div class="vbar"><div class="seg" role="group" aria-label="' + t('ch.filter') + '">' + kinds.map(k => '<button type="button" data-k="' + k + '" aria-pressed="' + (k === chKind) + '">' + (k ? t('ch.plural.' + k) : t('ch.all')) + ' <small>' + CHALLENGES.filter(c => !k || c.kind === k).length + '</small></button>').join('') + '</div></div>' +
    '<div class="chgrid">' + BANDS.flatMap(b => list.filter(c => (topicById(c.topic) || {}).band === b.id)).map(c => '<a class="chcard k-' + c.kind.toLowerCase() + '" href="' + c.href + '"><span class="pill out">' + t('ch.kind.' + c.kind) + '</span><b>' + esc(c.t) + '</b><small>' + esc(c.d) + '</small><span class="chmeta"><em>' + esc(bandById(topicById(c.topic).band).t) + ' · ' + esc(tName(c.topic)) + '</em>' + status(c) + '</span></a>').join('') + '</div>' + '</section>' +
    '<section class="wrap"><div class="vbar"><h2>' + t('ch.debates') + '</h2></div><p class="lede">' + t('ch.debatesLede') + '</p>' + allDebatesHTML() + '</section>';
  v.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { chKind = b.dataset.k; renderChallenges(); }));
}

/* ---------------- Knowledge ---------------- */
let fq = '', fk = '';
const FACT_KINDS = ['reported', 'claim', 'estimate', 'projection'];
export function renderKnowledge() {
  const v = $('#view-knowledge');
  const groups = Object.keys(TH).map(k => [k, Object.entries(CARDS).filter(([, c]) => c[0] === k)]);
  const sec = (title, lede, html) => '<section class="wrap"><div class="vbar"><h2>' + title + '</h2></div><p class="lede">' + lede + '</p>' + html + '</section>';
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">' + t('kn.eyebrow') + '</p><h1>' + t('kn.title') + '</h1><p class="lede">' + t('kn.lede') + '</p><div class="row"><a class="btn" href="#glossary">' + t('ref.glossary') + '</a><a class="btn" href="#sources">' + t('kn.allSources') + '</a></div></section>' +
    sec(t('kn.ideas'), t('kn.ideasLede'), allIdeasHTML()) + sec(t('kn.trades'), t('kn.tradesLede'), allTradeoffsHTML()) + sec(t('kn.measures'), t('kn.measuresLede'), allMeasuresHTML()) +
    '<section class="wrap">' + groups.map(([k, cs]) => '<div class="pgband"><p class="eyebrow" style="color:' + TH[k][1] + '">' + esc(TH[k][0]) + '</p><div class="kgrid">' + cs.map(([, c]) => '<a class="kcard" href="#' + c[3] + '" style="--kc:' + TH[k][1] + '"><b>' + esc(c[1]) + '</b><p>' + esc(c[2]) + '</p><small>' + esc(tName(c[3])) + ' →</small></a>').join('') + '</div></div>').join('') + '</section>' +
    '<section class="wrap"><div class="vbar"><h2>' + t('kn.facts') + '</h2><div class="seg" role="group" aria-label="' + t('kn.factKind') + '">' + [''].concat(FACT_KINDS).map(k => '<button type="button" data-fk="' + k + '" aria-pressed="' + (k === fk) + '">' + (k ? t('fact.' + k) : t('ch.all')) + '</button>').join('') + '</div><input type="search" id="kfQ" placeholder="' + t('kn.searchFacts') + '" aria-label="' + t('kn.searchFacts') + '" value="' + esc(fq) + '"></div><p class="small muted">' + esc(t('kn.factStatus', { n: FACTS.facts.length, last: fmtDate(FACTS.lastCheck), next: fmtDate(FACTS.nextCheck) })) + '</p><div class="ftable" id="kfList"></div></section>' +
    '<section class="wrap"><div class="vbar"><h2>' + t('kn.changed') + '</h2></div>' + changesHTML() + '</section>';
  const draw = () => {
    const q = fq.toLowerCase();
    const fs = FACTS.facts.filter(f => (!fk || f.kind === fk) && (!q || (f.label + ' ' + f.value + ' ' + (f.detail || '') + ' ' + tName(f.topic)).toLowerCase().includes(q)));
    $('#kfList').innerHTML = fs.length ? fs.map(f => { const u = safeUrl(f.url), kind = FACT_KINDS.includes(f.kind) ? f.kind : 'reported'; return '<div class="frow"><div><b>' + esc(f.label) + '</b>' + (f.detail ? '<small>' + esc(f.detail) + '</small>' : '') + '</div><div class="v">' + esc(f.value) + '</div><div class="meta"><span class="pill ' + ({ reported: 'ship', claim: 'ann', estimate: 'out', projection: 'proj' }[kind]) + '">' + t('fact.' + kind) + '</span><a href="#' + f.topic + '">' + esc(tName(f.topic)) + '</a>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(f.source || t('fact.source')) + '</a>' : '') + '<span>' + esc(fmtDate(f.verified)) + '</span></div></div>'; }).join('') : '<p class="muted">' + t('kn.noFacts') + '</p>';
  };
  $('#kfQ').addEventListener('input', e => { fq = e.target.value.trim(); draw(); });
  v.querySelectorAll('[data-fk]').forEach(b => b.addEventListener('click', () => { fk = b.dataset.fk; v.querySelectorAll('[data-fk]').forEach(x => x.setAttribute('aria-pressed', x.dataset.fk === fk)); draw(); }));
  draw();
}
