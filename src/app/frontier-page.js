/* The Frontier tab (#frontier, and #challenges as before): the part of the lab that works on what
   nobody has solved, together. From the top: the ways to take part, the open problems (walls) with
   how well each answer is tested so far, the gaps nobody has filled yet, the community chip, and the
   whole frontier map. Proposals are GitHub issues opened from prefilled forms
   (.github/ISSUE_TEMPLATE/challenge.yml and view.yml), so anyone can read, improve and argue with them;
   when one is accepted it becomes a challenge, a view or a design in the repository, and shows here. */
import { BANDS, DEBATES, topicById, bandById } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { COMMUNITY } from '../generated/community.js';
import { renderFrontier, watchFrontier, pickWall } from './frontier.js';
import { leanOf } from './hubs.js';
import { issueURL, proposalsURL } from './config.js';
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LENSES = ['build', 'break', 'imagine'];
const ext = ' target="_blank" rel="noopener"';
/* The challenges that test one view of a wall: those in the topics the view names. */
const testsOf = v => CHALLENGES.filter(c => v.topics.includes(c.topic));
/* A view counts as thin while fewer than this many challenges test it. */
const THIN = 3;

/* The issue forms' dropdowns are filled with their English option text: they are read on GitHub. */
const LENS_OPTION = { build: 'Build (make it work)', break: 'Break (find where it fails)', imagine: 'Imagine (try what could come next)' };   // i18n-ok: the form's own options
const PROPOSALS = { challenge: proposalsURL('Challenge'), view: proposalsURL('View') };   // i18n-ok: issue title prefixes
const proposeChallenge = (fields = {}) => issueURL('challenge', Object.assign({ title: '[Challenge] ' }, fields));
const proposeView = (fields = {}) => issueURL('view', Object.assign({ title: '[View] ' }, fields));

/* Cells of the map with no challenge yet (a band and a lens), and views tested by fewer than THIN. */
export function gaps() {
  const cells = [];
  BANDS.forEach(b => LENSES.forEach(l => { if (!CHALLENGES.some(c => c.lens === l && (topicById(c.topic) || {}).band === b.id)) cells.push({ band: b, lens: l }); }));
  const views = [];
  DEBATES.forEach(d => d.views.forEach(v => { const n = testsOf(v).length; if (n < THIN) views.push({ d, v, n }); }));
  views.sort((a, b) => a.n - b.n);
  return { cells, views };
}

function ways() {
  const card = (k, href, cls, newTab) => '<article class="fway ' + cls + '"><p class="code"><span class="dot"></span>' + t('fr.way.' + k + '.code') + '</p><h3>' + t('fr.way.' + k + '.t') + '</h3><p>' + t('fr.way.' + k + '.d') + '</p>' +
    '<a class="btn' + (k === 'lean' ? ' primary' : '') + '" href="' + esc(href) + '"' + (newTab ? ext : '') + '>' + t('fr.way.' + k + '.go') + '</a></article>';
  return '<section class="wrap fways" aria-label="' + t('fr.waysLabel') + '">' +
    card('lean', '#frwalls', 'fc-walls', false) + card('challenge', proposeChallenge(), 'fc-build', true) +
    card('view', proposeView(), 'fc-imagine', true) + card('design', '#community', 'fc-break', false) + '</section>';
}

function wallCard(d) {
  const lean = leanOf(d.id), total = new Set(d.views.flatMap(v => testsOf(v).map(c => c.t))).size;
  return '<article class="fwall" data-wall="' + d.id + '"><p class="code">' + t('fr.wallCode', { n: d.views.length }) + (lean !== undefined ? '<span class="pill out">' + esc(t('fr.leaning', { view: d.views[lean].t })) + '</span>' : '') + '</p>' +
    '<h3>' + esc(d.t) + '</h3><p class="q">' + esc(d.q) + '</p>' +
    '<ul class="fviews">' + d.views.map((v, k) => { const n = testsOf(v).length; return '<li class="' + (n < THIN ? 'thin' : '') + (lean === k ? ' on' : '') + '"><b>' + esc(v.t) + '</b><span>' + t('fr.tested', { n }) + '</span></li>'; }).join('') + '</ul>' +
    '<p class="small muted">' + t('fr.tests', { n: total }) + '</p>' +
    '<div class="row"><button type="button" class="btn" data-pick="' + d.id + '">' + t('fr.onMap') + '</button><a class="btn" href="' + esc(proposeView({ wall: d.t })) + '"' + ext + '>' + t('fr.addView') + '</a></div></article>';
}

function wantedHTML() {
  const { cells, views } = gaps();
  return '<section class="wrap fwanted" id="frwanted"><div class="fsh"><p class="code">' + t('fr.wanted.code') + '</p><h2>' + t('fr.wanted.t') + '</h2><p class="muted">' + t('fr.wanted.d') + '</p></div>' +
    '<div class="fwcols">' +
    '<div><h3>' + t('fr.wanted.views', { n: views.length }) + '</h3><div class="fwlist">' + views.map(({ d, v, n }) =>
      '<a class="fwant fc-walls" href="' + esc(proposeChallenge({ wall: d.t, topic: v.topics[0] })) + '"' + ext + '><small>' + esc(d.t) + ' · ' + t('fr.tested', { n }) + '</small><b>' + esc(v.t) + '</b><span>' + t('fr.wanted.testIt') + '</span></a>').join('') + '</div></div>' +
    '<div><h3>' + t('fr.wanted.cells', { n: cells.length }) + '</h3><div class="fwcells">' + cells.map(({ band, lens }) =>
      '<a class="fmp fc-' + lens + '" href="' + esc(proposeChallenge({ lens: LENS_OPTION[lens] })) + '"' + ext + ' title="' + esc(t('fr.wanted.cellTitle', { lens: t('fm.col.' + lens + '.t'), band: band.t })) + '">' + esc(t('fm.col.' + lens + '.t') + ' · ' + band.t) + '</a>').join('') + '</div>' +
    '<p class="small muted">' + t('fr.wanted.cellsD') + '</p></div></div></section>';
}

function communityHTML() {
  return '<section class="wrap fcomm"><div class="fsh"><p class="code">' + t('fr.comm.code') + '</p><h2>' + t('fr.comm.t') + '</h2><p class="muted">' + t('fr.comm.d', { n: COMMUNITY.length }) + '</p></div>' +
    '<div class="fcgrid">' + COMMUNITY.map(c => '<a class="fcd" href="#community"><b>' + esc(c.title) + '</b><small>' + esc(c.description) + '</small><span class="code">' + esc(c.author) + ' · ' + t('fr.comm.cells', { n: c.cells }) + '</span></a>').join('') +
    '<a class="fcd add" href="#community"><b>' + t('fr.comm.addT') + '</b><small>' + t('fr.comm.addD') + '</small></a></div>' +
    '<p class="small">' + t('fr.comm.read') + ' <a href="' + esc(PROPOSALS.challenge) + '"' + ext + '>' + t('fr.comm.readCh') + '</a> · <a href="' + esc(PROPOSALS.view) + '"' + ext + '>' + t('fr.comm.readView') + '</a></p></section>';
}

export function renderFrontierPage() {
  const v = document.getElementById('view-challenges');
  const views = DEBATES.reduce((s, d) => s + d.views.length, 0), g = gaps();
  v.innerHTML = '<section class="wrap dhead fc-walls"><p class="code"><span class="dot"></span>' + t('fr.code') + '</p><h1>' + t('fr.title') + '</h1><p class="lede">' + t('fr.lede') + '</p>' +
    '<p class="small muted">' + t('fr.counts', { walls: DEBATES.length, views, ch: CHALLENGES.length, gaps: g.cells.length + g.views.length }) + '</p></section>' +
    ways() +
    '<section class="wrap fwalls" id="frwalls"><div class="fsh"><p class="code">' + t('fr.walls.code') + '</p><h2>' + t('fr.walls.t') + '</h2><p class="muted">' + t('fr.walls.d') + '</p></div><div class="fwgrid">' + DEBATES.map(wallCard).join('') +
    '<a class="fwall add" href="' + esc(proposeView()) + '"' + ext + '><h3>' + t('fr.walls.addT') + '</h3><p>' + t('fr.walls.addD') + '</p></a></div></section>' +
    wantedHTML() + communityHTML() +
    '<section class="frmap" id="frmap"><div class="wrap"><div class="fsh"><p class="code">' + t('fr.map.code') + '</p><h2>' + t('fm.title') + '</h2><p class="muted">' + t('fm.lede') + '</p></div></div><div class="frmapin"></div></section>';
  renderFrontier(v.querySelector('.frmapin'));
  watchFrontier();
}

/* "See it on the map" picks the wall on the whole map and scrolls to it. */
document.addEventListener('click', e => {
  const b = e.target.closest('#view-challenges [data-pick]'); if (!b) return;
  pickWall(b.dataset.pick);
  const m = document.getElementById('frmap'); if (m) m.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
