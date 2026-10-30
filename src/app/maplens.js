/* Lenses for the map: show one kind of connection at a time instead of every line at once.
   Each kind of link gets its own colour, arrows that read as its sentence, and a panel that says
   what it means and shows its longest chain: stepping stones for "rests on", a zoom for "inside",
   dominoes for "cause and effect". The "Big ideas" lens draws one idea's path through the layers. */
import { BANDS, LINKS, LINK_KINDS, KIND_ORDER, IDEAS, topicById, bandById, usesOf, ideaById } from '../data/topics.js';
import { ladder } from './connections.js';
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const title = id => (topicById(id) || { t: id }).t;
const bandIx = id => BANDS.findIndex(b => b.id === id);

/* The order of the buttons and their colours; their names are "lens.<id>" in src/i18n. */
export const LENSES = ['', 'builds-on', 'part-of', 'feeds', 'causes', 'kind-of', 'grew-from', 'ideas'].map(id => ({ id }));
const lensName = id => t('lens.' + (id || 'quiet'));
export const KIND_COLOR = { 'builds-on': 'var(--muted)', 'part-of': 'var(--cyan)', 'feeds': 'var(--good)', 'causes': 'var(--amber)', 'kind-of': 'var(--violet)', 'grew-from': 'var(--rose)', ideas: 'var(--violet)' };

export const linksOfKind = k => LINKS.filter(l => l.kind === k);
/* Topics that take part in a lens, so the others can step back. */
export function lensTopics(lens, idea) {
  if (lens === 'ideas') return idea ? new Set(usesOf(idea).map(u => u.topic)) : null;
  if (!lens) return null;
  const s = new Set(); linksOfKind(lens).forEach(l => { s.add(l.from); s.add(l.to); }); return s;
}

/* The longest chain of one kind, as a list of links. Kinds that may not loop are searched as a
   tree; "causes" may loop, so each chain visits a topic at most once. */
export function longestChain(kind) {
  const ls = linksOfKind(kind), out = new Map();
  ls.forEach(l => { if (!out.has(l.from)) out.set(l.from, []); out.get(l.from).push(l); });
  let best = [];
  const walk = (id, path, seen) => {
    if (path.length > best.length) best = path.slice();
    for (const l of out.get(id) || []) if (!seen.has(l.to)) { seen.add(l.to); path.push(l); walk(l.to, path, seen); path.pop(); seen.delete(l.to); }
  };
  for (const id of out.keys()) walk(id, [], new Set([id]));
  return best;
}

function chainHTML(kind, chain) {
  if (!chain.length) return '';
  if (kind === 'causes') {
    return '<p class="eyebrow">' + t('lens.dominoes') + '</p><ol class="dominoes">' + chain.map(l =>
      '<li><button type="button" data-pick="' + l.to + '"><span class="code">' + esc(title(l.from)) + ' → ' + esc(title(l.to)) + '</span><b>' + esc(t('lens.if', { change: l.if })) + '</b><small>' + esc(t('lens.then', { result: l.then })) + '</small></button></li>').join('') + '</ol>';
  }
  const ids = [chain[0].from].concat(chain.map(l => l.to));
  return '<p class="eyebrow">' + esc(t('lens.chain', { shape: t('lens.visual.' + kind) })) + '</p><ol class="stones">' + ids.map((id, i) => {
    const tp = topicById(id);
    return '<li style="--kc:' + KIND_COLOR[kind] + '"><button type="button" data-pick="' + id + '"><span class="code">' + esc(bandById(tp.band).t) + '</span><b>' + esc(tp.t) + '</b>' +
      (i < chain.length ? '<small>' + esc(LINK_KINDS[kind].out.toLowerCase()) + ' ↓ ' + esc(chain[i].why) + '</small>' : '') + '</button></li>';
  }).join('') + '</ol>';
}

/* The side panel for a lens when no topic is selected. */
export function lensInfoHTML(lens, idea) {
  if (lens === 'ideas') {
    if (idea) {
      const i = ideaById(idea), uses = usesOf(idea), bands = new Set(uses.map(u => topicById(u.topic).band));
      return '<p class="code">' + t('lens.ideaCode', { n: bands.size, total: BANDS.length }) + '</p><h3>' + esc(i.t) + '</h3><p>' + esc(i.d) + '</p>' +
        '<p class="small muted">' + t('lens.ideaPath') + '</p>' + ladder(idea, null) +
        '<div class="row"><button type="button" class="btn" data-idea="">' + t('lens.allIdeas') + '</button></div>';
    }
    return '<p class="code">' + t('lens.ideasCode') + '</p><h3>' + t('lens.ideasTitle') + '</h3><p>' + t('lens.ideasLede') + '</p><div class="tlist">' +
      IDEAS.map(x => '<button type="button" data-idea="' + x.id + '"><b>' + esc(x.t) + '</b><small>' + t('lens.ideaTopics', { n: usesOf(x.id).length }) + ' · ' + esc(x.d) + '</small></button>').join('') + '</div>';
  }
  const k = LINK_KINDS[lens], ls = linksOfKind(lens);
  return '<p class="code">' + esc(t('lens.kindCode', { kind: k.t, n: ls.length })) + '</p><h3>' + esc(k.ask) + '</h3><p>' + esc(k.means) + '</p>' +
    (ls.length ? '<p class="small muted">' + t('lens.sentence', { from: esc(title(ls[0].from)), verb: esc(k.out.toLowerCase()), to: esc(title(ls[0].to)) }) + '</p>' : '') +
    chainHTML(lens, longestChain(lens));
}

/* The bar above the map. */
export function lensBarHTML() {
  return '<span class="code">' + t('lens.show') + '</span>' + LENSES.map(l => '<button type="button" data-lens="' + l.id + '">' + (l.id ? '<i style="--kc:' + KIND_COLOR[l.id] + '"></i>' : '') + esc(lensName(l.id)) + '</button>').join('');
}

/* Arrowheads, one per kind, so each kind's arrows carry its colour. */
export function markerDefs(NS) {
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = KIND_ORDER.map(k => '<marker id="mk-' + k + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" class="mk k-' + k + '"></path></marker>').join('');
  return defs;
}
export const ideaPath = idea => usesOf(idea).slice().sort((a, b) => bandIx(topicById(a.topic).band) - bandIx(topicById(b.topic).band));
