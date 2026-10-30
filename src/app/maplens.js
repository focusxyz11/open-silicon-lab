/* Lenses for the map: show one kind of connection at a time instead of every line at once.
   Each kind of link gets its own colour, arrows that read as its sentence, and a panel that says
   what it means and shows its longest chain: stepping stones for "rests on", a zoom for "inside",
   dominoes for "cause and effect". The "Big ideas" lens draws one idea's path through the layers. */
import { BANDS, LINKS, LINK_KINDS, KIND_ORDER, IDEAS, topicById, bandById, usesOf, ideaById } from '../data/topics.js';
import { ladder } from './connections.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const title = id => (topicById(id) || { t: id }).t;
const bandIx = id => BANDS.findIndex(b => b.id === id);

/* The order of the buttons, their short names and colours. */
export const LENSES = [
  { id: '', t: 'Quiet' },
  { id: 'builds-on', t: 'Rests on' },
  { id: 'part-of', t: 'Inside' },
  { id: 'feeds', t: 'Next step' },
  { id: 'causes', t: 'Cause & effect' },
  { id: 'kind-of', t: 'Families' },
  { id: 'grew-from', t: 'Origins' },
  { id: 'ideas', t: 'Big ideas' }
];
export const KIND_COLOR = { 'builds-on': 'var(--muted)', 'part-of': 'var(--cyan)', 'feeds': 'var(--good)', 'causes': 'var(--amber)', 'kind-of': 'var(--violet)', 'grew-from': 'var(--rose)', ideas: 'var(--violet)' };
const VISUAL = { 'builds-on': 'stepping stones, from the top down to the foundation', 'part-of': 'a zoom, from the smallest part to the whole', 'feeds': 'a production line', 'kind-of': 'a family', 'grew-from': 'a family tree', 'causes': 'dominoes' };

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
    return '<p class="eyebrow">A chain of dominoes</p><ol class="dominoes">' + chain.map(l =>
      '<li><button type="button" data-pick="' + l.to + '"><span class="code">' + esc(title(l.from)) + ' → ' + esc(title(l.to)) + '</span><b>If ' + esc(l.if) + '</b><small>then ' + esc(l.then) + '</small></button></li>').join('') + '</ol>';
  }
  const ids = [chain[0].from].concat(chain.map(l => l.to));
  return '<p class="eyebrow">Longest chain: ' + esc(VISUAL[kind] || 'a chain') + '</p><ol class="stones">' + ids.map((id, i) => {
    const t = topicById(id);
    return '<li style="--kc:' + KIND_COLOR[kind] + '"><button type="button" data-pick="' + id + '"><span class="code">' + esc(bandById(t.band).t) + '</span><b>' + esc(t.t) + '</b>' +
      (i < chain.length ? '<small>' + esc(LINK_KINDS[kind].out.toLowerCase()) + ' ↓ ' + esc(chain[i].why) + '</small>' : '') + '</button></li>';
  }).join('') + '</ol>';
}

/* The side panel for a lens when no topic is selected. */
export function lensInfoHTML(lens, idea) {
  if (lens === 'ideas') {
    if (idea) {
      const i = ideaById(idea), uses = usesOf(idea), bands = new Set(uses.map(u => topicById(u.topic).band));
      return '<p class="code">Big idea · in ' + bands.size + ' of ' + BANDS.length + ' layers</p><h3>' + esc(i.t) + '</h3><p>' + esc(i.d) + '</p>' +
        '<p class="small muted">The dashed line follows it down the stack. Where it breaks is marked.</p>' + ladder(idea, null) +
        '<div class="row"><button type="button" class="btn" data-idea="">All big ideas</button></div>';
    }
    return '<p class="code">Big ideas</p><h3>One idea, many layers</h3><p>The same idea turns up from transistors to data centers. Pick one to see its path through the stack.</p><div class="tlist">' +
      IDEAS.map(x => '<button type="button" data-idea="' + x.id + '"><b>' + esc(x.t) + '</b><small>' + usesOf(x.id).length + ' topics · ' + esc(x.d) + '</small></button>').join('') + '</div>';
  }
  const k = LINK_KINDS[lens], ls = linksOfKind(lens);
  return '<p class="code">' + esc(k.t) + ' · ' + ls.length + ' links</p><h3>' + esc(k.ask) + '</h3><p>' + esc(k.means) + '</p>' +
    (ls.length ? '<p class="small muted">Arrows read as a sentence: <b>' + esc(title(ls[0].from)) + ' → ' + esc(k.out.toLowerCase()) + ' → ' + esc(title(ls[0].to)) + '</b>. Select a topic to follow its arrows.</p>' : '') +
    chainHTML(lens, longestChain(lens));
}

/* The bar above the map. */
export function lensBarHTML() {
  return '<span class="code">Show</span>' + LENSES.map(l => '<button type="button" data-lens="' + l.id + '">' + (l.id ? '<i style="--kc:' + KIND_COLOR[l.id] + '"></i>' : '') + esc(l.t) + '</button>').join('');
}

/* Arrowheads, one per kind, so each kind's arrows carry its colour. */
export function markerDefs(NS) {
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = KIND_ORDER.map(k => '<marker id="mk-' + k + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" class="mk k-' + k + '"></path></marker>').join('');
  return defs;
}
export const ideaPath = idea => usesOf(idea).slice().sort((a, b) => bandIx(topicById(a.topic).band) - bandIx(topicById(b.topic).band));
