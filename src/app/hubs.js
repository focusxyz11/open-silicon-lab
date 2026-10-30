/* Shared hubs, shown so they make you think rather than just read:
   - a trade-off is a seesaw between two things you cannot both have, with a link to the
     simulation where you can push it yourself;
   - a measure says what the number counts, which way is better and what it hides, with real,
     dated values from facts.json;
   - a debate is a balance of views, each with the assumption it rests on. Lean towards one and the
     page asks what would change your mind. Leanings stay in this browser and are never scored. */
import { BANDS, TRADEOFFS, MEASURES, DEBATES, topicById, tradeoffById, measureById, tradeoffsOf, tradeoffUses, measuresOf, measureUses, debatesOf } from '../data/topics.js';
import { FACTS } from './facts.js';
import { t, fmtList } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const bandVar = id => 'var(--band' + (BANDS.findIndex(b => b.id === id) % 5) + ')';
/* "A or B": joined the way the reader's language joins alternatives. */
const orList = xs => fmtList(xs, 'disjunction');
const chip = id => { const t = topicById(id); return '<a class="chip" href="#' + id + '" style="--bc:' + bandVar(t.band) + '">' + esc(t.t) + '</a>'; };

/* ---- trade-offs ---- */
function seesaw(tr) {
  return '<div class="seesaw" aria-hidden="true"><span>' + esc(cap(tr.a)) + '</span><i><b></b></i><span>' + esc(cap(tr.b)) + '</span></div>';
}
function tradeoffCard(id, here, use) {
  const tr = tradeoffById(id), others = tradeoffUses(id).filter(u => u.topic !== here);
  return '<article class="hubcard trade"><p class="code">' + t('hub.tradeCode') + '</p><h4>' + esc(tr.t) + '</h4>' + seesaw(tr) +
    '<p>' + esc(use ? cap(use.how) + '.' : tr.d) + '</p>' + (use ? '<p class="small muted">' + esc(tr.d) + '</p>' : '') +
    (use && use.try ? '<a class="btn" href="' + esc(use.try) + '">' + t('hub.try') + '</a>' : '') +
    (others.length ? '<p class="eyebrow">' + (here ? t('hub.alsoIn') : t('hub.feelIn')) + '</p><div class="row">' + others.map(u => u.try ? '<a class="chip" href="' + esc(u.try) + '" title="' + esc(cap(u.how)) + '" style="--bc:' + bandVar(topicById(u.topic).band) + '">' + esc(topicById(u.topic).t) + '</a>' : chip(u.topic)).join('') + '</div>' : '') +
    '</article>';
}

/* ---- measures ---- */
function measureCard(id, here, use) {
  const m = measureById(id), others = measureUses(id).filter(u => u.topic !== here);
  const fs = (m.facts || []).map(f => FACTS.facts.find(x => x.id === f)).filter(Boolean);
  return '<article class="hubcard measure"><p class="code">' + t('hub.measureCode') + '</p><h4>' + esc(m.t) + ' <span class="better">' + t('hub.better.' + m.better) + '</span></h4>' +
    '<p class="unit">' + esc(m.unit) + '</p><p>' + esc(use ? cap(use.how) + '. ' + m.d : m.d) + '</p>' +
    '<p class="catch">' + t('hub.hides', { text: esc(m.catch) }) + '</p>' +
    (fs.length ? '<ul class="mvals">' + fs.map(f => '<li><span>' + esc(f.label) + '</span><b>' + esc(f.value) + '</b></li>').join('') + '</ul>' : '') +
    (others.length ? '<p class="eyebrow">' + (here ? t('hub.alsoUsed') : t('hub.usedIn')) + '</p><div class="row">' + others.map(u => chip(u.topic)).join('') + '</div>' : '') +
    '</article>';
}

/* ---- debates ---- */
const LKEY = 'osl-lean-v1';
let LEAN = {}; try { LEAN = JSON.parse(localStorage.getItem(LKEY) || '{}') || {}; } catch (e) { LEAN = {}; }
const saveLean = () => { try { localStorage.setItem(LKEY, JSON.stringify(LEAN)); } catch (e) { /* storage unavailable */ } };

function debateBody(d) {
  const lean = LEAN[d.id], n = d.views.length;
  const tilt = lean === undefined ? 0 : (lean - (n - 1) / 2) / Math.max(1, (n - 1) / 2);   /* -1 … 1 */
  const chosen = lean !== undefined ? d.views[lean] : null;
  return '<div class="balance" aria-hidden="true" style="--tilt:' + (tilt * 7).toFixed(1) + 'deg"><i></i><b></b></div>' +
    '<div class="dviews" style="--n:' + n + '">' + d.views.map((v, i) =>
      '<div class="dview' + (lean === i ? ' on' : '') + '"><b>' + esc(v.t) + '</b><p>' + esc(v.claim) + '</p><p class="assume"><span>' + t('hub.assumes') + '</span> ' + esc(v.assumes) + '</p>' +
      '<div class="row">' + v.topics.map(chip).join('') + '</div>' +
      '<button type="button" class="btn" data-lean="' + d.id + '" data-v="' + i + '" aria-pressed="' + (lean === i) + '">' + (lean === i ? t('hub.leanOn') : t('hub.lean')) + '</button></div>').join('') + '</div>' +
    (chosen ? '<p class="mind">' + t('hub.mind', { assumes: esc(chosen.assumes.replace(/\.$/, '')), topics: esc(orList(chosen.topics.map(id => topicById(id).t))), others: d.views.filter((_, i) => i !== lean).map(v => esc(v.assumes.replace(/\.$/, '').toLowerCase())).join('; ') }) + ' <button type="button" class="linkbtn" data-lean="' + d.id + '" data-v="">' + t('hub.undecided') + '</button></p>' : '<p class="small muted">' + t('hub.weigh') + '</p>');
}
function debateCard(d) {
  return '<article class="hubcard debate" data-debate="' + d.id + '"><p class="code">' + t('hub.debateCode') + '</p><h4>' + esc(d.t) + '</h4><p class="q">' + esc(d.q) + '</p><div class="dbody">' + debateBody(d) + '</div></article>';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lean]'); if (!b) return;
  const id = b.dataset.lean; if (b.dataset.v === '' || LEAN[id] === +b.dataset.v) delete LEAN[id]; else LEAN[id] = +b.dataset.v;
  saveLean();
  const d = DEBATES.find(x => x.id === id);
  document.querySelectorAll('[data-debate="' + id + '"] .dbody').forEach(el => { el.innerHTML = debateBody(d); });
});

/* ---- where they appear ---- */
/* On a topic page: the trade-offs, measures and debates this topic takes part in. */
export function hubsHTML(id) {
  const ts = tradeoffsOf(id), ms = measuresOf(id), ds = debatesOf(id);
  if (!ts.length && !ms.length && !ds.length) return '';
  return '<div class="hblock hubs"><p class="code">' + t('hub.title') + '</p>' +
    (ts.length || ms.length ? '<div class="hubgrid">' + ts.map(u => tradeoffCard(u.tradeoff, id, u)).join('') + ms.map(u => measureCard(u.measure, id, u)).join('') + '</div>' : '') +
    (ds.length ? '<div class="hubgrid wide">' + ds.map(debateCard).join('') + '</div>' : '') + '</div>';
}
export const allTradeoffsHTML = () => '<div class="hubgrid">' + TRADEOFFS.map(t => tradeoffCard(t.id, null, null)).join('') + '</div>';
export const allMeasuresHTML = () => '<div class="hubgrid">' + MEASURES.map(m => measureCard(m.id, null, null)).join('') + '</div>';
export const allDebatesHTML = () => '<div class="hubgrid wide">' + DEBATES.map(debateCard).join('') + '</div>';
