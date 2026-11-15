/* A world's page (#/w/<id>): one of the eleven core questions, made from its document, content/<id>.md, which is
   the one home of its words. At the top, its visual system: live where its engine already draws it, else its
   sketch. Then why it is open, what is true (the truths are the unit of the lab: content/STRUCTURE.md), the
   questions that lead in, the challenges with where each is played, the engine, the frontier, what the community
   does here, real cases, and the other worlds it really meets. The page shows this one core question on its own;
   the eleven are never listed together. #/w/<id>/q<n> opens it at a question inside. */
import { t } from '../core/i18n.js';
import { THREADS } from '../data/weave.js';
import { WORLDS, WORLD_IDS, challengeName } from '../data/worlds.js';
import { parseWorld, render, inline } from './md.js';
import { copiesHtml } from './copies.js';
import { probeHtml } from './read.js';
import { experimentOf } from '../engines/experiments.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hue = id => (THREADS.find(x => x.id === id) || { hue: 200 }).hue;
export const colorOf = id => 'hsl(' + hue(id) + ' 70% 55%)';
/* links inside a document: another world's document becomes its page; a picture is found in the content folder */
const opts = { link: h => { const m = /^([a-z]+)\.md$/.exec(h); return m && WORLDS[m[1]] ? '#/w/' + m[1] : /^https?:/.test(h) ? h : 'content/' + h; }, img: s => 'content/' + s };
const md = s => render(s, opts), il = s => inline(s, opts);

const DOCS = {};
export const loadWorld = id => DOCS[id] || (DOCS[id] = fetch('content/' + id + '.md').then(r => (r.ok ? r.text() : Promise.reject(r.status))).then(parseWorld));

/* what the visual system lays out, from its own section */
const laysOut = P => { const b = (P.sections.lens || {}).body || '', m = /\*\*What it lays out:\*\*\s*([\s\S]*?)(?:\n\n|$)/.exec(b); const v = m ? m[1].replace(/\s*\n\s*/g, ' ') : ''; return v.charAt(0).toUpperCase() + v.slice(1); };
function lensHtml(id, P, chip) {
  const W = WORLDS[id] || {}, sketch = '<img class="wsketch" src="content/img/' + esc(W.sketch || id) + '.svg" alt="' + esc(P.lens) + '">';
  let live = '';
  if (W.lens === 'copies') live = copiesHtml();
  else if (W.lens === 'probes') live = W.probes.map(pid => { const x = experimentOf(pid); return x ? probeHtml(x, chip) : ''; }).join('');
  let h = '<section class="wlens"><p class="kicker">' + esc(t('world.lens', { name: P.lens })) + '</p><p class="wlays">' + il(laysOut(P)) + '</p>';
  if (live) h += live;
  if (W.lens === 'view' || W.href) h += '<p><a class="btn' + (live ? '' : ' primary') + '" href="' + esc(W.href) + '">' + esc(t('world.open', { name: P.lens })) + '</a></p>';
  h += live ? '<details class="wsk"><summary>' + esc(t('world.sketch')) + '</summary>' + sketch + '</details>' : sketch + (W.lens ? '' : '<p class="small muted">' + esc(t('world.notYet')) + '</p>');
  return h + '</section>';
}

export function worldHtml(id, P, ctx = {}) {
  const W = WORLDS[id] || { play: {} }, S = P.sections;
  let h = '<article class="world" style="--qc:' + colorOf(id) + '">';
  h += '<p class="kicker">' + esc(t('world.k')) + '</p><h1 class="wq">' + esc(P.title) + '</h1>' + (P.behind ? '<p class="wbehind">' + il(P.behind) + '</p>' : '');
  h += lensHtml(id, P, ctx.chip);
  if (S.open) h += '<section class="wsec wopen">' + md(S.open.body) + '</section>';
  /* the truths: the unit of every world */
  h += '<section class="wsec"><h2>' + esc(t('world.true')) + '</h2><ol class="truths">' + P.truths.map(x => '<li id="t' + x.n + '"><b>' + il(x.title) + '</b> ' + il(x.text) + '</li>').join('') + '</ol></section>';
  /* the questions that lead in: each one met somewhere, with something true to notice */
  h += '<section class="wsec"><h2>' + esc(t('world.inside')) + '</h2><div class="wqs">' + P.questions.map(([q, n], i) => '<details class="wqi" id="q' + (i + 1) + '"' + (ctx.q === i + 1 ? ' open' : '') + '><summary>' + il(q) + '</summary><p>' + il(n) + '</p></details>').join('') + '</div></section>';
  /* challenges: where each is played, or that it is not playable yet */
  const after = S.challenges ? S.challenges.body.split('\n').filter(l => l.trim() && !l.startsWith('|')).join('\n') : '';
  h += '<section class="wsec"><h2>' + esc(t('world.challenges')) + '</h2><div class="wchs">' + P.challenges.map(([name, change, judge]) => {
    const where = W.play[challengeName(name)], go = where === 'here' ? '<span class="chere">' + esc(t('world.here')) + '</span>' : where ? '<a class="btn primary" href="' + esc(where) + '">' + esc(t('world.play')) + '</a>' : '<span class="small muted">' + esc(t('world.later')) + '</span>';
    return '<div class="wch' + (where ? ' on' : '') + '"><p class="wchn">' + il(name) + '</p><p class="small"><b>' + esc(t('world.change')) + '</b> ' + il(change) + '</p><p class="small"><b>' + esc(t('world.judge')) + '</b> ' + il(judge) + '</p>' + go + '</div>';
  }).join('') + '</div>' + (after ? '<div class="small muted">' + md(after) + '</div>' : '') + '</section>';
  /* the rest of the document, as written: the engine, the frontier, the community, cases, the joints */
  const part = (k, open) => (S[k] ? '<details class="wsec wmore"' + (open ? ' open' : '') + '><summary><h2>' + il(S[k].head) + '</h2></summary>' + md(S[k].body.replace(/!\[[^\]]*\]\([^)]+\)/g, '')) + '</details>' : '');
  h += part('engine') + part('direction', true) + part('community', true) + part('cases', true);
  if (S.meets) h += '<section class="wsec wmeets"><h2>' + esc(t('world.meets')) + '</h2>' + md(S.meets.body) + '</section>';
  h += part('earlier');
  h += '<p class="small muted wsrc">' + esc(t('world.source')) + ' <a href="content/?d=' + esc(id) + '">content/' + esc(id) + '.md</a></p>';
  return h + '</article>';
}

/* every question inside, from every world, mixed so no world gathers: the way in that never lists the eleven.
   Each card opens its world at that question. */
export const loadAll = () => Promise.all(WORLD_IDS.map(id => loadWorld(id).then(P => [id, P])));
export function allQuestions(all) {
  const L = all.map(([id, P]) => P.questions.map(([q, n], i) => ({ id, i: i + 1, q, n }))), out = [];
  for (let k = 0; out.length < L.reduce((a, x) => a + x.length, 0); k++) L.forEach(x => { if (x[k]) out.push(x[k]); });
  return out;
}
const plain = s => s.replace(/\*\*|\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
export const qCard = x => '<a class="qcard" href="#/w/' + esc(x.id) + '/q' + x.i + '" style="--qc:' + colorOf(x.id) + '" data-q="' + esc(plain(x.q).toLowerCase()) + '"><span class="q">' + esc(plain(x.q)) + '</span></a>';
export function indexHtml(all) {
  const Q = allQuestions(all);
  return '<p class="kicker">' + esc(t('world.indexK')) + '</p><h1>' + esc(t('world.indexT')) + '</h1><p class="lead">' + esc(t('world.indexLead', { n: Q.length })) + '</p>' +
    '<div class="jump"><input type="search" data-readfind autocomplete="off" placeholder="' + esc(t('read.find')) + '" aria-label="' + esc(t('read.find')) + '"></div><p class="small muted" data-readnone hidden>' + esc(t('read.none')) + '</p>' +
    '<section class="stepsec" data-readsec><div class="qgrid">' + Q.map(qCard).join('') + '</div></section>';
}
/* a few questions for the first page, from different worlds, changing day by day */
export function starters(all, n = 3, day = Math.floor(Date.now() / 864e5)) {
  const Q = allQuestions(all); return Array.from({ length: n }, (_, k) => Q[(day * 7 + k * 13) % Q.length]);
}
