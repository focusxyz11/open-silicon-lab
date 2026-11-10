/* The dive with its questions (prototype; roadmap, "Now: the frame", step 2). One continuous zoom from
   a data centre down to single atoms, through the frame's depths (docs/FRAME.md), and one connected web
   of questions inside it. There is no route: wherever something is unfinished, a question waits, and
   behind every question is another one, somewhere else in the dive (deeper, higher, or in another
   year). Following them moves you through the dive. The eleven core questions stay underneath: each
   question carries one of them (q), but they are never listed or named as a set.

   Data only. Every word a visitor reads is in src/i18n/en.json under "dv.":
     dv.d.<depth>            what you see at this depth
     dv.t.<depth>.<year>     the same place in another year; a line holds until the next one starts
     dv.t.<depth>.before     before this depth existed (drawn as a ghost)
     dv.e.<id>.place / .q / .try   an unfinished place: its name, its question, what people try
   The time lens runs from 1947 (the first transistor) to 2040. Years after today are drawn unfinished. */

export const LENS = { min: 1947, max: 2040 };

/* The depths of the dive, from the frame's depths, starting at the building. born: the first year the
   place exists (before it, the scene is drawn as a ghost). times: the years where its time line changes. */
export const STOPS = [
  { depth: 'building', born: 1946, times: [1947, 1964, 1995, 2006, 2023, 2027] },
  { depth: 'rack', born: 1946, times: [1947, 1964, 1995, 2016, 2024, 2027] },
  { depth: 'board', born: 1971, times: [1971, 1999, 2016, 2026, 2027] },
  { depth: 'chip', born: 1959, times: [1959, 1971, 2027] },
  { depth: 'block', born: 1971, times: [1971, 2006, 2017, 2027] },
  { depth: 'gate', born: 1963, times: [1963, 1985, 2027] },
  { depth: 'switch', born: 1947, times: [1947, 1959, 2011, 2022, 2033] },
  { depth: 'atom', born: 1947, times: [1947, 1954, 2007, 2022, 2027] }
];

/* Unfinished places, drawn as broken rings inside the scenes. Each holds a question.
   at: where it sits in its scene, in the scene's units (-1..1 across the shorter side of the view).
   behind: the questions behind this one, elsewhere in the dive. Together they form one web with no
   end: from any question you can reach every other (tests/dive.test.mjs checks it).
   q: the core question underneath (src/data/frame.js), never shown. topic: where to go further.
   fact: a sourced figure from src/data/facts.json. bench: a challenge that opens in place (BENCH). */
export const EDGES = [
  { id: 'power-next-door', depth: 'building', q: 'scale', at: [-0.84, -0.42], behind: ['erasing-costs', 'memory-wall'], topic: 'datacenter', fact: 'dc-electricity' },
  { id: 'twenty-watts', depth: 'building', q: 'life', at: [0.7, 0.62], behind: ['where-it-thinks', 'not-electric'], topic: 'neuro', fact: 'hala-point' },
  { id: 'one-mind', depth: 'rack', q: 'divide', at: [-0.36, -0.06], behind: ['memory-wall', 'reticle-seam'], topic: 'datacenter', fact: 'vr-nvl72' },
  { id: 'rack-shape', depth: 'rack', q: 'open', at: [0.36, -0.84], behind: ['empty-slot', 'over-horizon'], topic: 'community' },
  { id: 'memory-wall', depth: 'board', q: 'divide', at: [0.36, -0.46], behind: ['where-it-thinks', 'power-next-door'], topic: 'memory', fact: 'energy-moving-data', bench: 'stacks' },
  { id: 'over-horizon', depth: 'chip', q: 'know', at: [0.62, 0.72], behind: ['atom-by-atom', 'rack-shape'], topic: 'supply', fact: 'adv-capacity' },
  { id: 'silent-errors', depth: 'chip', q: 'fail', at: [-0.42, 0.36], behind: ['no-atoms-left', 'empty-slot'], topic: 'reality', fact: 'sdc-rate' },
  { id: 'reticle-seam', depth: 'chip', q: 'make', at: [0.02, -0.5], behind: ['atom-by-atom', 'one-mind'], topic: 'package', fact: 'cowos-capacity' },
  { id: 'where-it-thinks', depth: 'block', q: 'think', at: [-0.88, -0.75], behind: ['not-electric', 'twenty-watts'], topic: 'accelerators', bench: 'systolic' },
  { id: 'empty-slot', depth: 'block', q: 'idea', at: [-0.5, 0.75], behind: ['rack-shape', 'silent-errors'], topic: 'tiny', fact: 'wafer-space-run' },
  { id: 'not-electric', depth: 'gate', q: 'strange', at: [0.78, -0.72], behind: ['no-atoms-left', 'twenty-watts'], topic: 'photonic', fact: 'lightmatter-passage' },
  { id: 'erasing-costs', depth: 'gate', q: 'limit', at: [-0.8, 0.74], behind: ['no-atoms-left', 'power-next-door'], topic: 'reversible', fact: 'landauer-measured' },
  { id: 'after-nanosheet', depth: 'switch', q: 'scale', at: [0.66, -0.62], behind: ['no-atoms-left', 'reticle-seam'], topic: 'transistor', fact: 'imec-cfet', bench: 'planar' },
  { id: 'no-atoms-left', depth: 'atom', q: 'limit', at: [0.62, 0.58], behind: ['not-electric', 'after-nanosheet'], topic: 'floor', fact: 'imec-2d' },
  { id: 'atom-by-atom', depth: 'atom', q: 'make', at: [-0.66, -0.56], behind: ['over-horizon', 'after-nanosheet'], topic: 'fab', fact: 'fab-steps' }
];

/* Existing challenges that open in place, on the workbench inside the dive. The simulation panel is
   borrowed from its topic page while it is open and returned when it closes. */
export const BENCH = {
  stacks: { topic: 'package', title: 'Bandwidth per stack', lab: 'lab-package-1' },
  systolic: { topic: 'accelerators', title: 'Sixteen answers', lab: 'lab-accelerators-5' },
  planar: { topic: 'transistor', title: 'Why planar was retired', lab: 'lab-transistor-1' }
};
