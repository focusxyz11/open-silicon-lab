/* The knowledge graph behind the chip stack map, in one place for the rest of the site to read.

   Most of it is generated from the topic folders: each topics/<id>/topic.json says where the topic
   sits (band, order), how it connects (links) and which big ideas it shows (ideas). So a new topic
   needs no change here. What lives here is what spans many topics: the threads.

   The fixed structure, which new content fills but does not change:
     bands       the layers of the stack            src/data/bands.js
     topics      one folder each                   topics/<id>/
     links       six kinds, each with a meaning    src/data/links.js
     big ideas   one idea across several layers    src/data/ideas.js
     threads     suggested routes, never gates     below */
import { BANDS } from './bands.js';
import { LINK_KINDS, KIND_ORDER } from './links.js';
import { IDEAS, ideaById } from './ideas.js';
import { TOPICS, LINKS, IDEA_USES } from '../generated/graph.js';
export { BANDS, LINK_KINDS, KIND_ORDER, IDEAS, ideaById, TOPICS, LINKS, IDEA_USES };

/* Every link as [from, to, why, kind], for drawing lines on the map. */
export const EDGES = LINKS.map(l => [l.from, l.to, l.why, l.kind]);

/* Suggested routes through the map. They highlight; they never lock anything. A thread may go
   top-down (from what you know to what is inside) or bottom-up; it does not have to follow links. */
export const THREADS = [
  { id: 'start', t: 'Start here', d: 'A first hour: from the chips in your pocket down to atoms, then make one yourself.', path: ['everywhere', 'physics', 'transistor', 'architecture', 'tiny', 'litho'] },
  { id: 'everyday', t: 'Everyday chips', d: 'The billions of ordinary chips in phones, cars and appliances, and why old factories still matter.', path: ['everywhere', 'architecture', 'tiny', 'yield', 'supply', 'economics'] },
  { id: 'riscv', t: 'RISC-V path', d: 'Understand, build and extend an open processor.', path: ['architecture', 'riscv', 'design', 'tiny', 'layout', 'accelerators', 'ecosystem'] },
  { id: 'ai', t: 'AI-native', d: 'Where AI changes chips, and chips change AI.', path: ['compute', 'accelerators', 'riscv', 'design', 'agent', 'innovation', 'datacenter', 'scenarios'] },
  { id: 'make', t: 'Making chips', d: 'Follow the wafer through the fab.', path: ['physics', 'transistor', 'litho', 'fab', 'yield', 'package'] },
  { id: 'next', t: 'Beyond today\'s computers', d: 'Ten kinds of machine, from analog memory to qubits and living neurons.', path: ['compute', 'beyond', 'cim', 'neuro', 'photonic', 'quantum', 'pbits', 'reversible', 'spatial'] },
  { id: 'industry', t: 'Industry & open ecosystem', d: 'Companies, countries, money and community.', path: ['architecture', 'riscv', 'ecosystem', 'supply', 'economics', 'innovation', 'future'] }
];

export const topicById = id => TOPICS.find(t => t.id === id) || null;
export const bandById = id => BANDS.find(b => b.id === id) || null;
export const edgesOf = id => EDGES.filter(e => e[0] === id || e[1] === id);

/* A topic's links seen from that topic, in kind order. "out" is true when this topic is the subject
   of the sentence ("transistor builds on physics"), so the label is LINK_KINDS[kind].out; otherwise
   it is LINK_KINDS[kind].back ("physics: foundation for transistor"). "other" is the other topic. */
export const linksOf = id => LINKS.filter(l => l.from === id || l.to === id)
  .map(l => Object.assign({}, l, { out: l.from === id, other: l.from === id ? l.to : l.from }))
  .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || (b.out - a.out));
/* The label for a link seen from one side, e.g. "Builds on" or "Foundation for". */
export const linkLabel = l => (LINK_KINDS[l.kind] || {})[l.out ? 'out' : 'back'] || l.kind;

/* Big ideas a topic shows, and every place an idea shows up. */
export const ideasOf = id => IDEA_USES.filter(u => u.topic === id);
export const usesOf = idea => IDEA_USES.filter(u => u.idea === idea);
