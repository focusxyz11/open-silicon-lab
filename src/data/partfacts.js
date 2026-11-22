/* What a level's parts are, beyond where they are drawn (#304): the facts a lens paints from, written once per level, so
   a lens is a rule over facts and a new level needs its parts' facts, not new drawing code (src/v2/lenspaint.js).
   Where each part is comes from the level's scene (src/app/scenes.js, partsOf); here, for each part:
     kind  logic, memory, wire or io (input and output)
     by    who decided it: a program (placed or routed by one), a person (chosen by someone), or open (not decided yet)
     r     a place of its own, for a district the scene draws but does not name (in the scene's 1000 by 1000 plan)
   A test checks every part a level names has its facts, with a kind and a maker from these lists. */
import { partsOf } from '../app/scenes.js';
import { DEPTHS } from './weave.js';

export const KINDS = ['logic', 'memory', 'wire', 'io'];
export const MAKERS = ['program', 'person', 'open'];

export const FACTS = {
  /* one block: rows of ready-made cells a program placed, a memory array a memory compiler drew, the wires a router
     laid, your design (a person's choice), and a corner of other circuits nobody has decided yet */
  block: {
    cells: { kind: 'logic', by: 'program' },
    sram: { kind: 'memory', by: 'program' },
    wires: { kind: 'wire', by: 'program' },
    yours: { kind: 'logic', by: 'person' },
    other: { kind: 'logic', by: 'open', r: [660, 650, 300, 290] }
  }
};

/* a level's parts as facts with their shapes: { key, kind, by, rects: [[x, y, w, h]], paths: [[[x, y]...]] }, in the
   scene's plan, and how many micrometres one unit of the plan is */
export function factsOf(level) {
  const F = FACTS[level]; if (!F) return null;
  const P = partsOf(level) || {};
  const parts = Object.entries(F).map(([key, f]) => {
    const shapes = P[key] || [], rects = f.r ? [f.r] : shapes.filter(s => s.r).map(s => s.r), paths = shapes.filter(s => s.p).map(s => s.p);
    return { key, kind: f.kind, by: f.by, rects, paths };
  });
  return { level, parts, um: DEPTHS[level].m * 1e6 / 1000 };
}
