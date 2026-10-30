/* How connections are shown. A link is never just a line: each kind asks its own question, so each
   gets its own form. "Causes" links become predictions to try before reading the answer; big ideas
   become a ladder through the layers of the stack, so one idea can be seen echoing from a
   transistor up to a data center. The map, topic pages and views all draw connections from here. */
import { BANDS, IDEAS, LINK_KINDS, KIND_ORDER, topicById, bandById, linksOf, linkLabel, ideasOf, usesOf, ideaById } from '../data/topics.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const bandIx = id => BANDS.findIndex(b => b.id === id);
const bandVar = id => 'var(--band' + (bandIx(id) % 5) + ')';

/* "If yield falls, what happens in Economics?" Seen from the topic that is changed, the question
   asks what happens here. The answer stays folded until the reader has had a moment to think. */
function predictCard(id, l) {
  const o = topicById(l.other), ob = bandById(o.band);
  const where = l.out ? 'in ' + esc(o.t) : 'here';
  return '<details class="pcard"><summary><span class="code">Predict · ' + esc(l.out ? ob.t : 'from ' + o.t) + '</span>' +
    '<b>If ' + esc(l.if) + ', what happens ' + where + '?</b><small>Think first, then open</small></summary>' +
    '<p>' + esc(cap(l.then)) + '.</p><a href="#' + o.id + '">' + esc(l.out ? 'See it in ' + o.t : 'Go to ' + o.t) + ' →</a></details>';
}

/* The "How this connects" block at the foot of a topic page. */
export function connectionsHTML(id) {
  const ls = linksOf(id); if (!ls.length) return '';
  const cause = ls.filter(l => l.kind === 'causes');
  const rest = KIND_ORDER.filter(k => k !== 'causes').map(k => [k, ls.filter(l => l.kind === k)]).filter(([, g]) => g.length);
  return '<div class="hblock conns"><p class="code">How this connects</p>' +
    (cause.length ? '<div class="cgroup k-causes"><p class="cq">' + esc(LINK_KINDS.causes.ask) + '</p><div class="predgrid">' + cause.map(l => predictCard(id, l)).join('') + '</div></div>' : '') +
    rest.map(([k, g]) => '<div class="cgroup k-' + k + '"><p class="cq">' + esc(LINK_KINDS[k].ask) + '</p><div class="nextgrid">' +
      g.map(l => { const o = topicById(l.other); return '<a href="#' + o.id + '" style="--bc:' + bandVar(o.band) + '"><span class="code">' + esc(linkLabel(l)) + ' · ' + esc(bandById(o.band).t) + '</span><b>' + esc(o.t) + '</b><small>' + esc(cap(l.why)) + '</small></a>'; }).join('') +
      '</div></div>').join('') + '</div>';
}

/* One big idea as a ladder down the stack: every topic that shows it, in band order, with this
   topic marked. Counter-examples are labelled, because where an idea breaks is worth seeing. */
function ladder(ideaId, here) {
  const uses = usesOf(ideaId).slice().sort((a, b) => bandIx(topicById(a.topic).band) - bandIx(topicById(b.topic).band));
  return '<ol class="ladder">' + uses.map(u => {
    const t = topicById(u.topic), b = bandById(t.band), me = u.topic === here;
    return '<li style="--bc:' + bandVar(t.band) + '"' + (me ? ' class="here" aria-current="true"' : '') + '><span class="rung">' + esc(b.t) + '</span>' +
      (me ? '<b>' + esc(t.t) + ' <em>here</em></b>' : '<a href="#' + t.id + '"><b>' + esc(t.t) + '</b></a>') +
      (u.counter ? '<span class="pill out">Where it breaks</span>' : '') + '<small>' + esc(cap(u.how)) + '</small></li>';
  }).join('') + '</ol>';
}

/* "Big ideas here": the ideas this topic shows, each with its echoes in other layers. */
export function ideasHTML(id) {
  const mine = ideasOf(id); if (!mine.length) return '';
  return '<div class="hblock ideas"><p class="code">Big ideas here</p><p class="small muted">The same idea turns up in other layers of the stack. Seeing it again somewhere new is how it sticks.</p><div class="igrid">' +
    mine.map((u, k) => { const i = ideaById(u.idea); return '<details class="idea"' + (k === 0 ? ' open' : '') + '><summary><b>' + esc(i.t) + '</b>' + (u.counter ? '<span class="pill out">Where it breaks</span>' : '') + '<small>' + esc(cap(u.how)) + '</small></summary><p class="small">' + esc(i.d) + '</p>' + ladder(i.id, id) + '</details>'; }).join('') +
    '</div></div>';
}

/* The short list in a topic's side rail and in the map's info panel: one entry per neighbour,
   even when two kinds of link join the same pair ("Feeds into: …; Changes: …"). */
export function linkListHTML(id, tag = 'a') {
  const by = new Map(); linksOf(id).forEach(l => { if (!by.has(l.other)) by.set(l.other, []); by.get(l.other).push(l); });
  return [...by].map(([other, ls]) => {
    const o = topicById(other); const dirs = new Set(ls.map(l => l.out));
    const arrow = dirs.size > 1 ? '↔' : ls[0].out ? '→' : '←';
    const attr = tag === 'a' ? 'class="conn" href="#' + o.id + '"' : 'type="button" data-pick="' + o.id + '"';
    const why = ls.map(l => esc(linkLabel(l)) + ' · ' + esc(l.why)).join('<br>');
    return '<' + tag + ' ' + attr + '><span aria-hidden="true">' + arrow + '</span><b>' + esc(o.t) + '</b><small>' + why + '</small></' + tag + '>';
  }).join('');
}

/* Every big idea with the bands it crosses, for the Knowledge view. */
export function allIdeasHTML() {
  return '<div class="igrid all">' + IDEAS.map(i => {
    const uses = usesOf(i.id); const bands = new Set(uses.map(u => topicById(u.topic).band));
    return '<details class="idea"><summary><b>' + esc(i.t) + '</b><small>' + esc(i.d) + '</small><span class="span" aria-label="Shows up in ' + bands.size + ' of ' + BANDS.length + ' layers">' +
      BANDS.map(b => '<i' + (bands.has(b.id) ? ' class="on" style="--bc:' + bandVar(b.id) + '"' : '') + ' title="' + esc(b.t) + '"></i>').join('') + '</span></summary>' + ladder(i.id, null) + '</details>';
  }).join('') + '</div>';
}
