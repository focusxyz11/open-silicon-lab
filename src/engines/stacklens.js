/* A lens repaints the whole stack (#449; docs/PATH.md, "The thirteen questions in the stack"): a question opened on the
   stack becomes a vertical story, every one of the seven plates painted from the carry (src/engines/path.js) at once.
   Pure logic, no DOM and no words (ids only); tests in tests/stacklens.test.mjs; painted by src/v2/stack/view.js.

   paint(R, id, who) for a carry R gives, rung by rung, { v, say, n, h }: v in [0, 1] how strongly the plate is painted
   (null: the lens has nothing to say on that rung, and the plate stays plain), say the id of the plate's words
   (sk.lens.<id>.<say>), n (and h) the numbers they carry. The numbers are the carry's own.
     perfect  Perfect fails: the chance a copy is wrong, as it climbs. The switch's is the gate's over its switches; the
              gate's, the block's (its sum or its read), the chip's (an instruction), the machine's are the carry's;
              the mind's is the share of its answers that are wrong. Painted on a scale of powers of ten, from one in
              10^40 or rarer (plain, 'rarer') to always (full); n is the power of ten ('oneIn'), or the share in percent
              once one in a thousand or more often ('pct').
     geo      Geometry: the share of a rung's energy spent moving bits (n, the carry's moving, #494), and its heat, W a
              cm² (h, the carry's heat). The atom and the switch move nothing yet ('still').
     line     Fixed or fluid: a rung fixed once made, or one that can change after: everything a factory makes is fixed
              (atom, switch, gate, block); the chip can change when it is told by a program or learns; the machine when
              it runs programs; the mind when it learns or is programmed. Living matter regrows: every rung is fluid.
     human    Only humans: who chose each rung, from who (r => 'you' | 'lab' | 'agent'): the player, the lab's example, or
              an agent whose fork the player took.
     heat     not a lens of its own, a measure two lenses held can climb by (below): the carry's heat against the most a
              cold plate takes off a chip (path.js HEAT_LIMIT, a guess), painted on a scale of powers of ten around it.

   Two lenses held together (#449; docs/FRAME13.md "Holding two lenses", docs/PATH.md): the pair's shape is the lab's
   (src/data/frame.js MEETS, pairOf), and on the stack each shape is one thing the stack already is:
     chain    the carry itself. chainOf(R, a, b) climbs the rungs by the pair's measure (measureOf: one of the four
              lenses that repaint, or heat), numbering the rungs it has a number for from the bottom up; a step is lit
              once its rung passes the measure's line (LINE: wrong once in 10^15, about once a fortnight at a billion a
              second; half the energy moving bits; hotter than a cold plate takes; fluid; chosen by someone other than the
              lab), and the first lit step is where the problem is made, the ones above where it is carried.
     fork     a gene (geneOfPair: the gene the pair's question turns on), the same stack built two ways: forkOf(R, R2,
              a, b) paints both carries by the pair's measure, your stack left of a line you drag, the fork right of it.
     front    the field for two needs: frontOf(points) keeps the attempts no other beats at both needs at once (the best
              compromises, as a line from the best at the first need to the best at the second); the corner past it is
              the one nobody has reached. */
import { pairOf } from './frame.js';
import { HEAT_LIMIT } from './path.js';

export const REPAINT = ['perfect', 'geo', 'line', 'human'];
const RUNGS = ['atom', 'switch', 'gate', 'block', 'chip', 'machine', 'mind'];
const P_MIN = 40;                                     // one in 10^40 or rarer: the plainest a plate is painted
const clamp01 = v => Math.max(0, Math.min(1, v));

const wrongOf = (R, r) => {
  const h = (R.rungs[r] || {}).hands; if (!h) return null;
  if (r === 'switch') { const g = (R.rungs.gate || {}).hands; return g ? g.fail / Math.max(1, g.switches) : null; }
  if (r === 'gate') return h.fail;
  if (r === 'block') return h.aluWrong + h.readWrong - h.aluWrong * h.readWrong;
  if (r === 'chip' || r === 'machine') return h.wrong;
  if (r === 'mind') return 1 - h.right;
  return null;
};
export function fluidOf(g, r) {
  if (g.carrier === 'living') return true;
  if (r === 'chip') return g.told === 'program' || g.told === 'learns';
  if (r === 'machine') return g.told === 'program';
  if (r === 'mind') return g.told === 'learns' || g.told === 'program';
  return false;
}
const sig2 = x => +x.toPrecision(2);

export function paint(R, id, who = () => 'lab') {
  if (![...REPAINT, 'heat'].includes(id)) return null;
  const out = {};
  for (const r of RUNGS) {
    const hands = (R.rungs[r] || {}).hands, broken = !hands;
    if (id === 'perfect') {
      const p = broken ? null : wrongOf(R, r);
      if (p == null || !Number.isFinite(p)) { out[r] = { v: null, say: r === 'atom' ? 'same' : 'none', n: null }; continue; }
      /* rarer than the scale: plain; one in a thousand or more often: a share; in between: one in a power of ten */
      const k = p <= 0 ? -Infinity : Math.log10(p);
      out[r] = k <= -P_MIN ? { v: 0, say: 'rarer', n: P_MIN } : k >= -3 ? { v: (k + P_MIN) / P_MIN, say: 'pct', n: +(p * 100).toPrecision(2) } : { v: (k + P_MIN) / P_MIN, say: 'oneIn', n: Math.round(-k) };
      out[r].p = p;
    } else if (id === 'geo') {
      if (broken || !Number.isFinite(hands.moving)) { out[r] = { v: null, say: 'none', n: null }; continue; }
      out[r] = r === 'atom' || r === 'switch' ? { v: 0, say: 'still', n: 0, h: 0 } : { v: clamp01(hands.moving), say: 'share', n: Math.round(hands.moving * 100), h: sig2(hands.heat) };
    } else if (id === 'heat') {
      if (broken || !Number.isFinite(hands.heat)) { out[r] = { v: null, say: 'none', n: null }; continue; }
      const x = hands.heat;
      out[r] = x <= 0 ? { v: 0, say: 'cold', n: 0 } : { v: clamp01(Math.log10(x / HEAT_LIMIT) / 3 + 0.5), say: x > HEAT_LIMIT ? 'over' : 'under', n: sig2(x) };
      out[r].x = x;
    } else if (id === 'line') {
      const f = fluidOf(R.recipe, r);
      out[r] = { v: f ? 1 : 0, say: f ? 'fluid' : 'fixed', n: null };
    } else if (id === 'human') {
      const w = who(r);
      out[r] = { v: w === 'lab' ? 0 : 1, say: w, n: null };
    }
  }
  return out;
}

/* ---- two lenses held ---- */
/* the measure a pair climbs or splits by: a lens of the pair that repaints the stack, in this order; else the question
   it turns on: a clean 1, spares, trust and search are Perfect fails' copies; the next Moore's law, efficiency and
   physics are the heat; a copy of a brain is the moving; beyond computation is what can change */
const BY_Q = { dig: 'perfect', vn: 'perfect', trust: 'perfect', sutton: 'perfect', moore: 'heat', eff: 'heat', physics: 'heat', copy: 'geo', nat: 'line' };
export function measureOf(a, b) {
  const m = REPAINT.find(x => x === a || x === b);
  if (m) return m;
  if (a === 'dig' || b === 'dig') return 'perfect';
  return BY_Q[a] || BY_Q[b] || 'perfect';
}
/* the line a chain's step passes */
export const LINE = { perfect: 1e-15, geo: 0.5, heat: HEAT_LIMIT, line: 1, human: 1 };
function lit(q, m) {
  if (!q || q.v == null) return false;
  if (m === 'perfect') return q.p > LINE.perfect;
  if (m === 'geo') return q.n / 100 >= LINE.geo;
  if (m === 'heat') return q.x > LINE.heat;
  return q.v >= 1;
}
export const shapeOf = (a, b) => { const P = pairOf(a, b); return P ? P.shape : null; };

export function chainOf(R, a, b, who) {
  const m = measureOf(a, b), P = paint(R, m, who), steps = [];
  for (const r of RUNGS) { const q = P[r]; if (!q || q.v == null) continue; steps.push({ rung: r, k: steps.length + 1, lit: lit(q, m), q }); }
  const first = steps.find(s => s.lit);
  return { measure: m, steps, from: first ? first.rung : null, lit: steps.filter(s => s.lit).length };
}

/* the gene a fork turns on: the first of the pair's questions, by how near it is to one gene */
const GENE_Q = [['vn', 'shape'], ['geo', 'where'], ['copy', 'where'], ['line', 'told'], ['human', 'told'], ['sutton', 'told'], ['trust', 'told'], ['eff', 'where'], ['nat', 'carrier'], ['physics', 'carrier'], ['dig', 'carrier'], ['moore', 'carrier'], ['perfect', 'carrier']];
export function geneOfPair(a, b) { const x = GENE_Q.find(([q]) => q === a || q === b); return x ? x[1] : 'carrier'; }
/* the other way a fork builds the rung: the option asked for if it is not yours, else today's, else the first that is not yours */
export function otherOption(options, yours, today, asked) {
  if (asked && asked !== yours && options.includes(asked)) return asked;
  if (yours !== today) return today;
  return options.find(o => o !== yours) || yours;
}
export function forkOf(R, R2, a, b, who) {
  const m = measureOf(a, b);
  return { measure: m, left: paint(R, m, who), right: paint(R2, m, () => 'lab') };
}

/* the front: of points { x, y } (the figures at two needs, higher better), the ones no other beats at both, from the
   best at x to the best at y */
export function frontOf(pts) {
  const ok = pts.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
  const keep = ok.filter(p => !ok.some(q => q !== p && q.x >= p.x && q.y >= p.y && (q.x > p.x || q.y > p.y)));
  const seen = new Set();
  return keep.filter(p => { const k = p.x + ',' + p.y; if (seen.has(k)) return false; seen.add(k); return true; }).sort((p, q) => q.x - p.x || p.y - q.y);
}
