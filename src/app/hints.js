/* Hints at the moment they help, once each. Instead of a tour that opens by itself, a small note
   appears when a feature becomes useful, and never again once the visitor has used that feature
   (whether or not the hint was shown). One hint at a time; it never covers or blocks the page, and
   "Turn hints off" stops them all. Only "already seen" marks are kept, in the visitor's browser. */
import { topicById } from '../data/topics.js';
import { t } from '../core/i18n.js';

const KEY = 'osl-hints-v1';
const $ = s => document.querySelector(s);
const H = { seen: {}, off: false };
try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object') { if (j.seen && typeof j.seen === 'object') H.seen = j.seen; H.off = j.off === true; } } catch (e) { /* storage unavailable */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(H)); } catch (e) { /* ignore */ } };

/* id: also the text name "hint.<id>"; target: what to point at; used: a click that means the
   visitor found the feature by themselves. */
const HINTS = {
  tap: { target: '#mStack', used: '#mBands .tnode' },
  lens: { target: '#mLens', used: '#mLens [data-lens]' },
  level: { target: '.modeseg', used: '.modeseg button' },
  year: { target: '#yearBtn', used: '#yearBtn' }
};
export const HINT_IDS = Object.keys(HINTS);

let box = null, cur = null, pending = [];
const done = id => !!H.seen[id];
function markUsed(id) { if (!H.seen[id]) { H.seen[id] = 1; save(); } if (cur === id) hide(); pending = pending.filter(x => x !== id); }

function hide() {
  if (box) box.remove(); box = null;
  document.querySelectorAll('.hint-target').forEach(el => el.classList.remove('hint-target'));
  cur = null;
  if (pending.length) setTimeout(() => show(pending.shift()), 400);
}
/* Show a hint now, or queue it behind the current one. */
export function show(id) {
  if (H.off || done(id) || !HINTS[id] || cur === id) return;
  const target = $(HINTS[id].target); if (!target || target.offsetParent === null) return;
  if (cur) { if (!pending.includes(id)) pending.push(id); return; }
  cur = id;
  box = document.createElement('div'); box.className = 'hint'; box.setAttribute('role', 'status');
  box.innerHTML = '<p><span class="eyebrow">' + t('hint.label') + '</span>' + t('hint.' + id) + '</p><div class="hint-row"><button type="button" class="btn" data-h="ok">' + t('hint.ok') + '</button><button type="button" class="hint-off" data-h="off">' + t('hint.off') + '</button></div>';
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-h]'); if (!b) return;
    if (b.dataset.h === 'off') { H.off = true; save(); pending = []; }
    markUsed(id);
  });
  document.body.appendChild(box);
  target.classList.add('hint-target');
}

/* Turn hints back on and forget which were seen (footer link). */
export function resetHints() { H.seen = {}; H.off = false; save(); }
export const hintsOff = () => H.off;

export function initHints() {
  /* Using a feature counts as having found it. */
  document.addEventListener('click', e => {
    if (e.target.closest('[data-hints-reset]')) { e.preventDefault(); resetHints(); if (location.hash && location.hash !== '#map') location.hash = 'map'; else watchMap(); return; }
    for (const [id, h] of Object.entries(HINTS)) if (e.target.closest(h.used)) {
      markUsed(id);
      /* After a first topic is selected on the map, the next useful thing is the lens bar. */
      if (id === 'tap') setTimeout(() => show('lens'), 900);
    }
  }, true);
  /* Leaving a page closes its hint; a first topic page brings the level hint, a second one the year. */
  let topics = 0;
  document.addEventListener('osl:route', e => {
    if (cur) { const keep = cur; hide(); if (!done(keep)) pending = pending.filter(x => x !== keep); }
    const h = e.detail || '';
    if (topicById(h)) { topics++; setTimeout(() => show(topics === 1 ? 'level' : 'year'), 1500); }
    if (!h || h === 'map') watchMap();
  });
  watchMap();
}

/* When the map comes into view and no topic has been tried yet, say what to do. */
let io = null;
function watchMap() {
  if (H.off || done('tap') || typeof IntersectionObserver === 'undefined') return;
  const stack = $('#mStack'); if (!stack) return;
  if (io) io.disconnect();
  io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); io = null; setTimeout(() => show('tap'), 600); } }, { threshold: 0.25 });
  io.observe(stack);
}
