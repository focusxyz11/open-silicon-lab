/* The frame view (#questions, #q-<id>): the eleven questions as the lab's structure.
   Left, the die: one block per question. Right, the chosen question run down the ten depths, with every
   topic and challenge docked where that question meets that depth. Empty depths are shown as open places.
   Structure: src/data/frame.js. This view is the first step toward the continuous zoom (docs/FRAME.md). */
import { QUESTIONS, DEPTHS, PORTALS, topicsAt, questionById } from '../data/frame.js';
import { topicById } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const q = (id, k) => t('frame.q.' + id + '.' + k);
const chOf = topic => CHALLENGES.filter(c => c.topic === topic);
const countQ = id => topicsAt(id).reduce((n, tp) => n + chOf(tp).length, 0);
const linked = id => PORTALS.filter(p => p.includes(id)).map(p => ({ id: p[0] === id ? p[1] : p[0], why: t('frame.p.' + p[0] + '|' + p[1]) }));

function dieHTML(sel) {
  return '<div class="fr-die" role="list">' + QUESTIONS.map(x => {
    const [c, r, w, h] = x.home;
    return '<a role="listitem" class="fr-blk d-' + x.domain + (x.id === sel ? ' on' : '') + '" href="#q-' + x.id + '" style="grid-column:' + (c + 1) + ' / span ' + w + ';grid-row:' + (r + 1) + ' / span ' + h + '"' + (x.id === sel ? ' aria-current="true"' : '') + '>' +
      '<span class="fr-n">' + esc(q(x.id, 'name')) + '</span><span class="fr-q">' + esc(q(x.id, 'question')) + '</span>' +
      '<span class="fr-c">' + esc(t('frame.count', { n: countQ(x.id) })) + '</span></a>';
  }).join('') + '</div>';
}

function columnHTML(id) {
  const x = questionById(id);
  let h = '<p class="fr-dom d-' + x.domain + '">' + esc(t('frame.dom.' + x.domain)) + '</p><h2 class="fr-title">' + esc(q(id, 'question')) + '</h2>' +
    '<p class="fr-leads"><b>' + esc(t('frame.leads')) + '</b> ' + esc(q(id, 'leads')) + '</p>' +
    (x.onTime ? '<p class="fr-note">' + esc(t('frame.onTime')) + '</p>' : '') +
    '<ol class="fr-depths" aria-label="' + esc(t('frame.depths')) + '">';
  DEPTHS.forEach(d => {
    const here = topicsAt(id, d.id), entry = x.entry === d.id;
    h += '<li class="' + (here.length ? 'has' : 'open') + (entry ? ' entry' : '') + '"><div class="fr-dn"><b>' + esc(t('frame.d.' + d.id)) + '</b><span>' + esc(t('frame.s.' + d.id)) + '</span></div><div class="fr-dc">';
    if (!here.length) h += '<span class="fr-open">' + esc(t('frame.open')) + '</span>';
    here.forEach(tp => {
      const T = topicById(tp);
      h += '<div class="fr-topic"><a class="fr-tl" href="#' + tp + '">' + esc(T ? T.t : tp) + '</a><ul>' +
        chOf(tp).map(c => '<li><a href="' + esc(c.href) + '">' + esc(c.t) + '</a></li>').join('') + '</ul></div>';
    });
    h += '</div></li>';
  });
  h += '</ol><h3 class="fr-h3">' + esc(t('frame.portals')) + '</h3><ul class="fr-portals">' + linked(id).map(p =>
    '<li><a class="d-' + questionById(p.id).domain + '" href="#q-' + p.id + '"><b>' + esc(q(p.id, 'name')) + '</b><span>' + esc(p.why) + '</span></a></li>').join('') + '</ul>';
  return h;
}

export function renderFrame(sel) {
  const id = questionById(sel) ? sel : 'think';
  const el = document.getElementById('view-questions');
  el.innerHTML = '<div class="wrap fr"><header class="fr-head"><h1>' + esc(t('frame.title')) + '</h1><p>' + esc(t('frame.lede')) + '</p></header>' +
    '<div class="fr-grid"><nav class="fr-home" aria-label="' + esc(t('frame.title')) + '">' + dieHTML(id) + '</nav><section class="fr-col" aria-live="polite">' + columnHTML(id) + '</section></div></div>';
}
