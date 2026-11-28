/* A lens repaints the whole stack (#449; docs/PATH.md, "The thirteen questions in the stack"): a question opened on the
   stack becomes a vertical story, every one of the seven plates painted from the carry (src/engines/path.js) at once.
   Pure logic, no DOM and no words (ids only); tests in tests/stacklens.test.mjs; painted by src/v2/stack/view.js.

   paint(R, id, who) for a carry R gives, rung by rung, { v, say, n }: v in [0, 1] how strongly the plate is painted
   (null: the lens has nothing to say on that rung, and the plate stays plain), say the id of the plate's words
   (sk.lens.<id>.<say>), n the number they carry. The numbers are the carry's own.
     perfect  Perfect fails: the chance a copy is wrong, as it climbs. The switch's is the gate's over its switches; the
              gate's, the block's (its sum or its read), the chip's (an instruction), the machine's are the carry's;
              the mind's is the share of its answers that are wrong. Painted on a scale of powers of ten, from one in
              10^40 or rarer (plain, 'rarer') to always (full); n is the power of ten ('oneIn'), or the share in percent
              once one in a thousand or more often ('pct').
     geo      Geometry: the share of a rung's time or energy spent moving bits, where the carry counts it: the block's
              wires on a read, the machine's moving data. The other rungs do not count it yet (#494 adds it to every
              rung), and say so.
     line     Fixed or fluid: a rung fixed once made, or one that can change after: everything a factory makes is fixed
              (atom, switch, gate, block); the chip can change when it is told by a program or learns; the machine when
              it runs programs; the mind when it learns or is programmed. Living matter regrows: every rung is fluid.
     human    Only humans: who chose each rung, from who (r => 'you' | 'lab' | 'agent'): the player, the lab's example, or
              an agent whose fork the player took. */
export const REPAINT = ['perfect', 'geo', 'line', 'human'];
const RUNGS = ['atom', 'switch', 'gate', 'block', 'chip', 'machine', 'mind'];
const P_MIN = 40;                                     // one in 10^40 or rarer: the plainest a plate is painted

const wrongOf = (R, r) => {
  const h = (R.rungs[r] || {}).hands; if (!h) return null;
  if (r === 'switch') { const g = (R.rungs.gate || {}).hands; return g ? g.fail / Math.max(1, g.switches) : null; }
  if (r === 'gate') return h.fail;
  if (r === 'block') return h.aluWrong + h.readWrong - h.aluWrong * h.readWrong;
  if (r === 'chip' || r === 'machine') return h.wrong;
  if (r === 'mind') return 1 - h.right;
  return null;
};
const moveOf = (R, r) => { const h = (R.rungs[r] || {}).hands; if (!h) return null; return r === 'block' ? h.wireShare : r === 'machine' ? h.moveShare : null; };
export function fluidOf(g, r) {
  if (g.carrier === 'living') return true;
  if (r === 'chip') return g.told === 'program' || g.told === 'learns';
  if (r === 'machine') return g.told === 'program';
  if (r === 'mind') return g.told === 'learns' || g.told === 'program';
  return false;
}

export function paint(R, id, who = () => 'lab') {
  const out = {};
  for (const r of RUNGS) {
    const broken = !(R.rungs[r] || {}).hands;
    if (id === 'perfect') {
      const p = broken ? null : wrongOf(R, r);
      if (p == null || !Number.isFinite(p)) { out[r] = { v: null, say: r === 'atom' ? 'same' : 'none', n: null }; continue; }
      /* rarer than the scale: plain; one in a thousand or more often: a share; in between: one in a power of ten */
      const k = p <= 0 ? -Infinity : Math.log10(p);
      out[r] = k <= -P_MIN ? { v: 0, say: 'rarer', n: P_MIN } : k >= -3 ? { v: (k + P_MIN) / P_MIN, say: 'pct', n: +(p * 100).toPrecision(2) } : { v: (k + P_MIN) / P_MIN, say: 'oneIn', n: Math.round(-k) };
    } else if (id === 'geo') {
      const s = broken ? null : moveOf(R, r);
      out[r] = s == null ? { v: null, say: 'notYet', n: null } : { v: Math.max(0, Math.min(1, s)), say: 'share', n: Math.round(s * 100) };
    } else if (id === 'line') {
      const f = fluidOf(R.recipe, r);
      out[r] = { v: f ? 1 : 0, say: f ? 'fluid' : 'fixed', n: null };
    } else if (id === 'human') {
      const w = who(r);
      out[r] = { v: w === 'lab' ? 0 : 1, say: w, n: null };
    } else return null;
  }
  return out;
}
