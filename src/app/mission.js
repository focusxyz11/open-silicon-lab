/* Challenge first. When a topic loads, its page is turned around so the reader meets a goal before
   the reading: a mission card under the question (the topic's first challenge, the others, and the
   open problem it helps with), a strip on each simulation that a challenge points at, and longer
   passages folded to their first paragraph. Nothing is removed: every fold opens with one click.
   A topic with no challenge yet says so, offers free play and asks for a proposal. */
import { CHALLENGES } from '../data/challenges.js';
import { debatesOf, topicById } from '../data/topics.js';
import { TOPIC_FILES } from '../generated/catalog.js';
import { issueURL } from './config.js';
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const words = el => (el.textContent.trim().match(/\S+/g) || []).length;
/* A passage folds only when what would be hidden is long enough to be worth a click. */
const FOLD_MIN = 25;
/* A challenge that points at its whole topic is played in the topic's first simulation. */
const firstLab = id => ((TOPIC_FILES[id] || { labs: [] }).labs[0] || {}).id;
const target = (c, id) => c.href === '#' + id && firstLab(id) ? '#' + firstLab(id) : c.href;

function wallsLine(id) {
  const ds = debatesOf(id);
  if (!ds.length) return '';
  return '<p class="mwall"><span class="code">' + t('mission.wall', { n: ds.length }) + '</span>' +
    ds.map(d => '<button type="button" class="chip" data-wall="' + d.id + '">' + esc(d.t) + '</button>').join('') + '</p>';
}

export function missionHTML(id, title) {
  const ch = CHALLENGES.filter(c => c.topic === id);
  if (!ch.length) {
    const labs = (TOPIC_FILES[id] || { labs: [] }).labs;
    const first = labs[0];
    return '<div class="mission free"><p class="code">' + t('mission.free.code') + '</p>' +
      '<h3>' + t('mission.free.t', { n: labs.length }) + '</h3><p class="mtask">' + t('mission.free.d') + '</p>' +
      '<div class="row">' + (first ? '<a class="btn primary" href="#' + first.id + '">' + esc(t('mission.free.start', { lab: first.t })) + '</a>' : '') +
      '<a class="btn" href="' + esc(issueURL('idea', { title: '[Challenge] ' + title + ': ', topic: id })) + '" target="_blank" rel="noopener">' + t('mission.propose') + '</a></div>' +
      wallsLine(id) + '</div>';
  }
  const [c, ...rest] = ch;
  return '<div class="mission fc-' + c.lens + '"><p class="code"><span class="dot"></span>' + t('mission.code', { lens: t('fm.col.' + c.lens + '.t') }) + '<span class="pill out">' + t('ch.kind.' + c.kind) + '</span></p>' +
    '<h3>' + esc(c.t) + '</h3><p class="mtask">' + esc(c.d) + '</p>' +
    '<div class="row"><a class="btn primary" href="' + esc(target(c, id)) + '">' + t('mission.start') + '</a></div>' +
    (rest.length ? '<div class="mmore"><span class="code">' + t('mission.more', { n: rest.length }) + '</span>' +
      rest.map(r => '<a class="fmp fc-' + r.lens + ' k-' + r.kind.toLowerCase() + '" href="' + esc(target(r, id)) + '" title="' + esc(r.d) + '">' + esc(r.t) + '</a>').join('') + '</div>' : '') +
    wallsLine(id) + '</div>';
}

/* When a topic has several simulations, each one a challenge points at carries that challenge above its controls. */
function labStrips(id, sec) {
  /* With one simulation the mission card sits just above it and already says what to do. */
  if ((TOPIC_FILES[id] || { labs: [] }).labs.length < 2) return;
  const byLab = new Map();
  CHALLENGES.filter(c => c.topic === id).forEach(c => {
    const h = target(c, id), el = /^#[\w-]+$/.test(h) ? sec.querySelector(h) : null;
    if (!el || !el.classList.contains('lab')) return;
    if (!byLab.has(el)) byLab.set(el, []);
    byLab.get(el).push(c);
  });
  byLab.forEach((cs, lab) => {
    const s = document.createElement('div'); s.className = 'labch';
    /* One or two challenges are written out; more become a row of pills, so the simulation stays near the top. */
    s.innerHTML = cs.length > 2
      ? '<div class="mmore"><span class="code">' + t('lab.challenges', { n: cs.length }) + '</span>' + cs.map(c => '<span class="fmp fc-' + c.lens + ' k-' + c.kind.toLowerCase() + '" title="' + esc(c.d) + '">' + esc(c.t) + '</span>').join('') + '</div>'
      : cs.map(c => '<p class="fc-' + c.lens + '"><span class="code"><span class="dot"></span>' + t('lab.challenge', { kind: t('ch.kind.' + c.kind) }) + '</span><b>' + esc(c.t) + '</b> <span>' + esc(c.d) + '</span></p>').join('');
    const head = lab.querySelector(':scope > header');
    if (head) head.after(s); else lab.prepend(s);
  });
}

/* Each passage keeps its headings and first paragraph; the rest opens with "Read more". */
function foldProse(sec) {
  sec.querySelectorAll('.prose').forEach(p => {
    if (p.closest('.lab')) return;   /* a simulation's own text is the simulation's to manage */
    const kids = [...p.children];
    const firstP = kids.findIndex(k => k.tagName === 'P');
    if (firstP < 0) return;
    const rest = kids.slice(firstP + 1);
    /* Glossary terms are buttons too; anything else interactive keeps the passage open. */
    const live = '[id],button:not(.term),input,select,canvas';
    if (!rest.length || rest.some(k => k.matches(live) || k.querySelector(live))) return;
    const n = rest.reduce((s, k) => s + words(k), 0);
    if (n < FOLD_MIN) return;
    const more = document.createElement('div'); more.className = 'pmore'; more.hidden = true;
    rest.forEach(k => more.appendChild(k));
    const b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn pmorebtn'; b.setAttribute('aria-expanded', 'false');
    b.textContent = t('prose.more', { n });
    b.addEventListener('click', () => { const open = more.hidden; more.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? t('prose.less') : t('prose.more', { n }); });
    p.append(more, b);
  });
}

export function challengeFirst(id, sec) {
  const head = sec.querySelector('.head'), tp = topicById(id);
  if (!head || !tp) return;
  const m = document.createElement('div'); m.innerHTML = missionHTML(id, tp.t);
  head.after(m.firstElementChild);
  labStrips(id, sec);
  foldProse(sec);
}

/* A wall chip in the mission card opens that debate further down the page. */
document.addEventListener('click', e => {
  const b = e.target.closest('.mission [data-wall]'); if (!b) return;
  const card = document.querySelector('#topicFoot [data-debate="' + b.dataset.wall + '"]');
  if (card) { card.scrollIntoView({ block: 'start', behavior: 'smooth' }); card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }
});
