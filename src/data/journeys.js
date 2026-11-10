/* Journeys: concrete stories that cross every depth of the frame (docs/FRAME.md) and connect the
   eleven questions without naming them. This file holds the first one, One answer, as a prototype
   (roadmap, "Now: the frame", step 2): a reply travels from a phone to the data centre, down to
   electrons, and back.

   Data only. Every word a visitor reads is in src/i18n/en.json under "oa.":
     oa.d.<depth>.story        what happens to your answer at this depth (today)
     oa.t.<depth>.<year>       the same place in another year; a line holds until the next one starts
     oa.t.<depth>.before       before this depth existed in the journey (drawn as a ghost)
     oa.e.<edge>.place / .q / .try   an open edge: the unfinished place, the question behind it, what people try
   The time lens runs from 1947 (the first transistor) to 2040. Years after today are drawn unfinished. */

export const LENS = { min: 1947, max: 2040 };

/* The ten stops, in the order of the frame's depths. born: the first year this place exists in the
   story (before it, the scene is drawn as a ghost). times: the years where its time line changes. */
export const STOPS = [
  { depth: 'planet', born: 1947, times: [1947, 1969, 1988, 2007, 2023, 2027] },
  { depth: 'region', born: 1947, times: [1947, 1979, 1995, 2007, 2023, 2027] },
  { depth: 'building', born: 1946, times: [1947, 1964, 1995, 2006, 2023, 2027] },
  { depth: 'rack', born: 1946, times: [1947, 1964, 1995, 2016, 2024, 2027] },
  { depth: 'board', born: 1971, times: [1971, 1999, 2016, 2026, 2027] },
  { depth: 'chip', born: 1959, times: [1959, 1971, 2027] },
  { depth: 'block', born: 1971, times: [1971, 2006, 2017, 2027] },
  { depth: 'gate', born: 1963, times: [1963, 1985, 2027] },
  { depth: 'switch', born: 1947, times: [1947, 1959, 2011, 2022, 2033] },
  { depth: 'atom', born: 1947, times: [1947, 1954, 2007, 2022, 2027] }
];

/* Open edges: places drawn unfinished inside a scene, where what anyone knows runs out. Each is tagged
   to one of the eleven questions (src/data/frame.js) and is found by exploring, never listed.
   at: where it sits in its scene, in the scene's units (-1..1 across the shorter side of the view).
   topic: where to go further. fact: a sourced figure from src/data/facts.json shown with it.
   bench: an existing challenge that opens in place, inside the journey (BENCH below). */
export const EDGES = [
  { id: 'who-asks', depth: 'planet', q: 'open', at: [0.84, 0.2], topic: 'everywhere', fact: 'ch32v003' },
  { id: 'over-horizon', depth: 'planet', q: 'know', at: [0.6, -0.7], topic: 'supply', fact: 'adv-capacity' },
  { id: 'here-or-there', depth: 'region', q: 'divide', at: [-0.68, 0.46], topic: 'accelerators' },
  { id: 'power-next-door', depth: 'building', q: 'scale', at: [-0.84, -0.42], topic: 'datacenter', fact: 'dc-electricity' },
  { id: 'twenty-watts', depth: 'building', q: 'life', at: [0.7, 0.62], topic: 'neuro', fact: 'hala-point' },
  { id: 'one-mind', depth: 'rack', q: 'divide', at: [-0.36, -0.06], topic: 'datacenter', fact: 'vr-nvl72' },
  { id: 'rack-shape', depth: 'rack', q: 'open', at: [0.36, -0.84], topic: 'community' },
  { id: 'memory-wall', depth: 'board', q: 'divide', at: [0.36, -0.46], topic: 'memory', fact: 'energy-moving-data', bench: 'stacks' },
  { id: 'silent-errors', depth: 'chip', q: 'fail', at: [-0.42, 0.36], topic: 'reality', fact: 'sdc-rate' },
  { id: 'reticle-seam', depth: 'chip', q: 'make', at: [0.02, -0.5], topic: 'package', fact: 'cowos-capacity' },
  { id: 'where-it-thinks', depth: 'block', q: 'think', at: [-0.88, -0.75], topic: 'accelerators', bench: 'systolic' },
  { id: 'empty-slot', depth: 'block', q: 'idea', at: [-0.5, 0.75], topic: 'tiny', fact: 'wafer-space-run' },
  { id: 'not-electric', depth: 'gate', q: 'strange', at: [0.78, -0.72], topic: 'photonic', fact: 'lightmatter-passage' },
  { id: 'erasing-costs', depth: 'gate', q: 'limit', at: [-0.8, 0.74], topic: 'reversible', fact: 'landauer-measured' },
  { id: 'after-nanosheet', depth: 'switch', q: 'scale', at: [0.66, -0.62], topic: 'transistor', fact: 'imec-cfet', bench: 'planar' },
  { id: 'no-atoms-left', depth: 'atom', q: 'limit', at: [0.62, 0.58], topic: 'floor', fact: 'imec-2d' },
  { id: 'atom-by-atom', depth: 'atom', q: 'make', at: [-0.66, -0.56], topic: 'fab', fact: 'fab-steps' }
];

/* Existing challenges that open in place, on the workbench inside the journey. The simulation panel is
   borrowed from its topic page while it is open and returned when it closes. */
export const BENCH = {
  stacks: { topic: 'package', title: 'Bandwidth per stack', lab: 'lab-package-1' },
  systolic: { topic: 'accelerators', title: 'Sixteen answers', lab: 'lab-accelerators-5' },
  planar: { topic: 'transistor', title: 'Why planar was retired', lab: 'lab-transistor-1' }
};

/* Where each question's stars gather in the visitor's sky (0..1 across and down). Only positions:
   the sky never names a question until the visitor's own stars draw it. */
export const SKY = {
  think: [0.2, 0.26], strange: [0.43, 0.13], limit: [0.72, 0.2], fail: [0.12, 0.62], idea: [0.36, 0.48],
  make: [0.6, 0.47], know: [0.88, 0.5], open: [0.52, 0.8], divide: [0.24, 0.84], life: [0.86, 0.82], scale: [0.78, 0.66]
};
