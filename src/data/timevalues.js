/* The values a topic's time-machine sentence may use. A topic.json "time" section holds lines
   that apply from a year onwards:
     "time": {
       "born": [2010, "RISC-V starts as a research project at UC Berkeley in 2010."],
       "then": [[2010, "RISC-V is a university research project."], [2015, "…"]]
     }
   A line can name a value in braces, such as "Newest fabs process {wafer} wafers on a {node} process.",
   and the time machine fills it in for the chosen year. Only the names below are allowed. */
import { fmtWords, fmtList } from '../core/i18n.js';

export const TIME_VALUES = {
  year: 'the chosen year',
  wafer: 'the wafer size in the newest fabs',
  node: 'the leading-edge process name',
  shape: 'the transistor shape, marked "(projection)" in the future',
  shapeName: 'the transistor shape, short name only',
  litho: 'the printing method, marked "(projection)" in the future',
  biggest: 'the biggest chip so far',
  biggestTr: 'its transistor count, in words',
  isa: 'the big instruction sets that exist by then',
  companies: 'how many companies in the ecosystem explorer exist',
  companiesTotal: 'how many companies the explorer lists',
  designCost: 'the cost of designing a leading-edge chip, in millions of dollars',
  costNode: 'the node that design cost is for'
};

/* Words for big numbers in the reader's language: 2,300 · 1.21 million · 336 billion. */
export const words = fmtWords;

const ISA = [[1978, 'x86'], [1985, 'Arm'], [2010, 'RISC-V']];
/* The value of each name for one snapshot of the timeline. */
export function timeValues(s) {
  const proj = k => k === 'proj' ? ' (projection)' : '';
  return {
    year: String(s.y), wafer: s.wafer, node: s.node.t,
    shape: s.shape.t + proj(s.shape.kind), shapeName: s.shape.t.split(':')[0],
    litho: s.litho.t + proj(s.litho.kind),
    biggest: s.biggest.name, biggestTr: words(s.biggest.tr),
    isa: fmtList(ISA.filter(x => x[0] <= s.y).map(x => x[1])),
    companies: String(s.companies.n), companiesTotal: String(s.companies.total),
    designCost: s.cost ? String(s.cost.m) : '', costNode: s.cost ? s.cost.node : ''
  };
}
export const namesIn = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]);
export const fillLine = (text, s) => { const v = timeValues(s); return String(text).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)); };
/* The line for a year: the last one that starts on or before it. */
export const lineFor = (then, y) => { let r = null; for (const l of then || []) if (l[0] <= y) r = l; return r; };
