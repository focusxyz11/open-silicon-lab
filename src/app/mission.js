/* Challenge first. When a topic loads, its page is turned around so the reader meets a goal before
   the reading: a mission card under the question (the topic's first challenge, the others, and the
   open problem it helps with), a strip on each simulation that a challenge points at, and longer
   passages folded to their first paragraph. Nothing is removed: every fold opens with one click.
   A topic with no challenge yet says so, offers free play and asks for a proposal.
   The card features the first challenge not solved yet, so solving one moves the page on to the
   next (src/app/checks.js decides what is solved); a hint waits behind one click, and the "why" opens
   once it is solved. */
import { CHALLENGES } from '../data/challenges.js';
import { isSolved, solvedIn, markSolved, keyOf, watchChecks, selfChecks } from './checks.js';
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

/* compact: a depth lab holds its own mission, so the card stays short and the picture stays near the top. */
export function missionHTML(id, title, compact = false) {
  const ch = CHALLENGES.filter(c => c.topic === id);
  if (!ch.length) {
    const labs = (TOPIC_FILES[id] || { labs: [] }).labs;
    const first = labs[0];
    return '<div class="mission free"><p class="code">' + t('mission.free.code') + '</p>' +
      '<h3>' + t('mission.free.t', { n: labs.length }) + '</h3><p class="mtask">' + t('mission.free.d') + '</p>' +
      '<div class="row">' + (first ? '<a class="btn primary" href="#' + first.id + '">' + esc(t('mission.free.start', { lab: first.t })) + '</a>' : '') +
      '<a class="btn" href="' + esc(issueURL('challenge', { title: '[Challenge] ' + title + ': ', topic: id })) + '" target="_blank" rel="noopener">' + t('mission.propose') + '</a></div>' +
      wallsLine(id) + '</div>';
  }
  const c = ch.find(x => !isSolved(x)) || ch[0], rest = ch.filter(x => x !== c), n = solvedIn(ch), done = isSolved(c);
  const auto = selfChecks(c);
  const hint = !done && c.hint ? '<details class="mhint"><summary>' + t('mission.hint') + '</summary><p>' + esc(c.hint) + '</p></details>' : '';
  const more = (rest.length ? '<div class="mmore"><span class="code">' + t('mission.more', { n: rest.length }) + '</span>' +
      rest.map(r => '<a class="fmp fc-' + r.lens + ' k-' + r.kind.toLowerCase() + (isSolved(r) ? ' done' : '') + '" href="' + esc(target(r, id)) + '" title="' + esc(r.d) + '">' + esc(r.t) + '</a>').join('') + '</div>' : '') + wallsLine(id);
  return '<div class="mission fc-' + c.lens + (done ? ' solved' : '') + (compact ? ' compact' : '') + '"><p class="code"><span class="dot"></span>' + t('mission.code', { lens: t('fm.col.' + c.lens + '.t') }) + '<span class="pill out">' + t('ch.kind.' + c.kind) + '</span>' +
    '<span class="mcount">' + esc(t('mission.solved', { n, total: ch.length })) + '</span></p>' +
    '<h3>' + (done ? '<span class="tick" aria-hidden="true">✓</span> ' : '') + esc(c.t) + '</h3><p class="mtask">' + esc(c.d) + '</p>' +
    (done ? whyHTML(c) : '') +
    '<div class="row"><a class="btn primary" href="' + esc(target(c, id)) + '">' + t(done ? 'mission.again' : 'mission.start') + '</a>' +
    (!done && !auto ? '<button type="button" class="btn" data-tried="' + esc(keyOf(c)) + '">' + t('mission.tried') + '</button>' : '') +
    (!done && auto ? '<span class="small muted">' + t('mission.auto') + '</span>' : '') + '</div>' +
    (compact ? '<details class="mrest"><summary>' + t('mission.rest') + '</summary>' + hint + more + '</details>' : hint + more) + '</div>';
}
const card = (id, title) => { const s = document.getElementById(id); return missionHTML(id, title, !!(s && s.querySelector('.depthlab'))); };
const whyHTML = c => c.why ? '<div class="mwhy"><p class="code">' + t('mission.why') + '</p><p>' + esc(c.why) + '</p></div>' : '';

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
      ? '<div class="mmore"><span class="code">' + t('lab.challenges', { n: cs.length }) + '</span>' + cs.map(c => '<span class="fmp fc-' + c.lens + ' k-' + c.kind.toLowerCase() + (isSolved(c) ? ' done' : '') + '" data-ck="' + esc(keyOf(c)) + '" title="' + esc(c.d) + '">' + esc(c.t) + '</span>').join('') + '</div>'
      : cs.map(c => '<p class="fc-' + c.lens + (isSolved(c) ? ' done' : '') + '" data-ck="' + esc(keyOf(c)) + '"><span class="code"><span class="dot"></span>' + t('lab.challenge', { kind: t('ch.kind.' + c.kind) }) + '</span><b>' + esc(c.t) + '</b> <span>' + esc(c.d) + '</span></p>').join('');
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
  const m = document.createElement('div'); m.innerHTML = card(id, tp.t);
  head.after(m.firstElementChild);
  labStrips(id, sec);
  foldProse(sec);
  watchChecks(id, sec);
}

/* The moment a challenge is solved: a note on the simulation it was solved in (or under the card),
   with why the answer is what it is and the next challenge here; the card moves on. */
function winHTML(c, next) {
  return '<div class="chwin fc-' + c.lens + '" role="status"><p class="code"><span class="tick" aria-hidden="true">✓</span> ' + esc(t('win.code', { title: c.t })) + '</p>' +
    (c.why ? '<p>' + esc(c.why) + '</p>' : '') +
    '<div class="row">' + (next ? '<a class="btn primary" href="' + esc(target(next, c.topic)) + '">' + esc(t('win.next', { title: next.t })) + '</a>' : '<a class="btn primary" href="#frontier">' + t('win.frontier') + '</a>') +
    '<button type="button" class="btn" data-winclose>' + t('win.close') + '</button></div></div>';
}
document.addEventListener('osl:solved', e => {
  const c = e.detail.c, sec = document.getElementById(c.topic); if (!sec) return;
  const ch = CHALLENGES.filter(x => x.topic === c.topic), next = ch.find(x => !isSolved(x));
  const old = sec.querySelector(':scope > .mission');
  if (old) { const m = document.createElement('div'); m.innerHTML = card(c.topic, (topicById(c.topic) || {}).t || ''); old.replaceWith(m.firstElementChild); }
  sec.querySelectorAll('[data-ck="' + CSS.escape(keyOf(c)) + '"]').forEach(el => el.classList.add('done'));
  sec.querySelectorAll('.chwin').forEach(w => w.remove());
  const h = target(c, c.topic), lab = /^#[\w-]+$/.test(h) ? sec.querySelector(h) : null;
  const w = document.createElement('div'); w.innerHTML = winHTML(c, next);
  if (lab && lab.classList.contains('lab') && e.detail.from !== 'card') { const at = lab.querySelector(':scope > .labch') || lab.querySelector(':scope > header'); if (at) at.after(w.firstElementChild); else lab.prepend(w.firstElementChild); }
  else { const m = sec.querySelector(':scope > .mission'); if (m) m.after(w.firstElementChild); }
});
document.addEventListener('click', e => {
  const tr = e.target.closest('[data-tried]');
  if (tr) { const c = CHALLENGES.find(x => keyOf(x) === tr.dataset.tried); if (c) markSolved(c, 'card'); return; }
  const x = e.target.closest('[data-winclose]'); if (x) x.closest('.chwin').remove();
});

/* A wall chip in the mission card opens that debate further down the page. */
document.addEventListener('click', e => {
  const b = e.target.closest('.mission [data-wall]'); if (!b) return;
  const card = document.querySelector('#topicFoot [data-debate="' + b.dataset.wall + '"]');
  if (card) { card.scrollIntoView({ block: 'start', behavior: 'smooth' }); card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash'); }
});
/* RISC-V levels award their own stars (osl:progress): keep the card in step with them. */
document.addEventListener('osl:progress', () => {
  document.querySelectorAll('#library > section > .mission').forEach(old => {
    const id = old.parentElement.id, m = document.createElement('div'); m.innerHTML = card(id, (topicById(id) || {}).t || '');
    if (m.firstElementChild && m.firstElementChild.outerHTML !== old.outerHTML) old.replaceWith(m.firstElementChild);
  });
});
