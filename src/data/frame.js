/* The frame: the hidden backbone of the lab. It is never shown as a list.

   Eleven open questions organise everything underneath: every open edge, challenge and AI conversation
   is tagged to one of them, and visitors meet them only as open edges in the world and as patterns in
   what they discover (docs/FRAME.md). Ten depths give every place an address, from the planet down to
   the atom. Every existing topic docks where its question meets its depth.

   The words here are authoring data, like the threads in topics.js. When a view starts showing any of
   them, move those words into src/i18n/en.json. */

/* entry: the depth where the question is first met. onTime: the question that lives on the time dial. */
export const QUESTIONS = [
  { id: 'think', domain: 'chip', entry: 'chip', name: "Think",
    question: "How does a chip think?",
    leads: "Where does thinking come from: from the parts, or from how they are arranged?" },
  { id: 'strange', domain: 'chip', entry: 'gate', name: "Strange",
    question: "What is the strangest thing that could compute?",
    leads: "Is computing something humans invented, or something nature was already doing?" },
  { id: 'limit', domain: 'chip', entry: 'atom', name: "Limit",
    question: "What could a chip never do, and could it learn to?",
    leads: "Can a creation go beyond its creator?" },
  { id: 'fail', domain: 'craft', entry: 'chip', name: "Fail",
    question: "Why can a perfect design fail in the real world?",
    leads: "Is \"perfect\" only possible inside our models?" },
  { id: 'idea', domain: 'craft', entry: 'block', name: "Idea",
    question: "How could your idea become a chip?",
    leads: "How do ideas become real, and who gets to make them?" },
  { id: 'make', domain: 'craft', entry: 'building', name: "Make",
    question: "What would chipmaking look like if we invented it from scratch today?",
    leads: "How much of our technology is the way it is only because of history?" },
  { id: 'know', domain: 'people', entry: 'planet', name: "Know",
    question: "What part of making chips can't be written down?",
    leads: "How much human expertise lives only in people's hands, and can AI ever capture it?" },
  { id: 'open', domain: 'people', entry: 'region', name: "Open",
    question: "What happens when anyone can make a chip?",
    leads: "What happens to a society when powerful tools reach everyone?" },
  { id: 'divide', domain: 'future', entry: 'chip', name: "Divide",
    question: "How should a chip divide its work?",
    leads: "How should any system divide work: cells, companies, societies?" },
  { id: 'life', domain: 'future', entry: 'block', name: "Life",
    question: "What new kinds of computers could brains, swarms and living cells inspire?",
    leads: "If we stopped copying the 80-year-old computer design, what would we copy instead?" },
  { id: 'scale', domain: 'engine', entry: 'switch', onTime: true, name: "Scale",
    question: "What will be the next Moore's law?",
    leads: "Can any kind of progress keep doubling forever?" }
];

/* m = metres across the view at that depth. */
export const DEPTHS = [
  { id: 'planet', name: "Planet", m: 1.3e7 },
  { id: 'region', name: "Region", m: 1e5 },
  { id: 'building', name: "Building", m: 120 },
  { id: 'rack', name: "Rack", m: 2 },
  { id: 'board', name: "Board", m: 0.3 },
  { id: 'chip', name: "Chip", m: 0.02 },
  { id: 'block', name: "Block", m: 1e-5 },
  { id: 'gate', name: "Gate", m: 3e-7 },
  { id: 'switch', name: "Switch", m: 5e-8 },
  { id: 'atom', name: "Atom", m: 2e-9 }
];

/* Where each existing topic docks: [question, depth]. One place each; the topic's own links still connect it elsewhere. */
export const PLACES = {
  riscv: ['think', 'chip'],          clock: ['think', 'block'],
  photonic: ['strange', 'switch'],   pbits: ['strange', 'gate'],
  quantum: ['limit', 'atom'],        floor: ['limit', 'atom'],        reversible: ['limit', 'gate'],
  reality: ['fail', 'chip'],         bench: ['fail', 'board'],
  design: ['idea', 'block'],         layout: ['idea', 'block'],       agent: ['idea', 'block'],       tiny: ['idea', 'gate'],
  factory: ['make', 'building'],     yield: ['make', 'chip'],         litho: ['make', 'gate'],        fab: ['make', 'switch'],        physics: ['make', 'atom'],
  supply: ['know', 'planet'],        innovation: ['know', 'planet'],  xray: ['know', 'chip'],
  everywhere: ['open', 'region'],    economics: ['open', 'region'],   community: ['open', 'chip'],
  memory: ['divide', 'board'],       package: ['divide', 'board'],    analog: ['divide', 'board'],
  architecture: ['divide', 'chip'],  accelerators: ['divide', 'chip'], build: ['divide', 'chip'],   spatial: ['divide', 'chip'],
  datacenter: ['life', 'building'],  neuro: ['life', 'chip'],         beyond: ['life', 'chip'],       cim: ['life', 'block'],         evolve: ['life', 'gate'],
  future: ['scale', 'planet'],       transistor: ['scale', 'switch']
};

/* Links between questions, each with its reason: [a, b, why]. */
export const LINKS = [
  ['think', 'strange', "Same logic, new material"],
  ['think', 'limit', "How far thinking can go"],
  ['think', 'idea', "From logic you understand to a chip you design"],
  ['think', 'life', "A chip's mind beside a brain"],
  ['strange', 'fail', "Every material brings its own physics"],
  ['strange', 'life', "Grown and brain-like computers"],
  ['strange', 'scale', "New materials for the next law"],
  ['limit', 'life', "Could new kinds of computers do what chips can't?"],
  ['limit', 'scale', "Can progress go on forever?"],
  ['fail', 'idea', "Where design meets reality"],
  ['fail', 'make', "Reality sets the rules for making"],
  ['idea', 'make', "Your design goes to the factory"],
  ['idea', 'open', "Anyone's idea, anyone's chip"],
  ['make', 'know', "The know-how inside the factory"],
  ['make', 'scale', "Shrinking happens in the factory"],
  ['know', 'open', "Sharing what can't be written down"],
  ['open', 'divide', "A community divides work too"],
  ['divide', 'life', "Brains and swarms divide work too"],
  ['divide', 'scale', "Specialists keep progress going"]
];

export const questionById = id => QUESTIONS.find(q => q.id === id);
export const depthIndex = id => DEPTHS.findIndex(d => d.id === id);
/* Topics docked at one place, in depth order when a question is given alone. */
export const topicsAt = (q, d) => Object.keys(PLACES).filter(t => PLACES[t][0] === q && (d == null || PLACES[t][1] === d))
  .sort((a, b) => depthIndex(PLACES[a][1]) - depthIndex(PLACES[b][1]));
export const placeOf = topic => PLACES[topic] || null;
