/* Tries on a page: an experiment's engine, put to work inside its document (src/v2/read.js). A visitor changes one
   or two things; the engine answers at once, and every number in the sentences under the controls is the engine's,
   read at that moment, so the words cannot disagree with the result. This is how an experiment that has an engine
   becomes something to do before any picture of it is drawn.

   A probe: controls (each with the text naming it, its values and the texts naming them), and run(values, chip),
   which returns what to show: `says` (texts with their numbers), and at most one of `bars` (amounts on a scale
   that grows tenfold at each step, so a floor and a chip a hundred thousand times above it fit one picture),
   `line` (a level step by step) and `table` (rows the engine filled). Numbers are given raw and formatted by the
   page; a { s } is a length of time in seconds. Words: the texts named here, in src/i18n/en.json. */
import { model } from '../engines/chip.js';
import { perOp, cold, landauer, TEMPS, exhaust, WIDTHS, RATES } from '../engines/floor.js';
import { build } from '../engines/design.js';
import { cascade, NOISES, HIGH, LOW } from '../engines/substrate.js';

/* two descriptions of each job that give the same answers, for "are they the same chip?" */
export const TWO_WAYS = {
  full: ['sum = a ^ b ^ cin;\ncout = (a & b) | (a & cin) | (b & cin);', 'x = a ^ b;\nsum = x ^ cin;\ncout = (a & b) | (cin & x);'],   // i18n-ok: descriptions are code, not words
  vote: ['y = (a & b) | (a & c) | (b & c);', 'y = (a & (b | c)) | (b & c);'],
  half: ['sum = a ^ b;\ncarry = a & b;', 'sum = (a | b) & ~(a & b);\ncarry = a & b;']
};

const READS = { one: 'probe.chain.one', zero: 'probe.chain.zero', unsure: 'probe.chain.unsure' };

export const PROBES = {
  /* how far your chip is from the least energy physics allows (the Floor engine) */
  'limit-floor': {
    controls: [{ k: 'gen', label: 'chip.gen.label', values: [0, 1, 2, 3, 4], names: 'chip.gen.names', chip: true }],
    run({ gen }, chip) {
      const o = perOp(model(Object.assign({}, chip, { gen })));
      return {
        says: [{ key: 'floor.energy', vars: { zj: landauer() * 1e21 } }, { key: 'floor.yours', vars: { times: o.times, math: o.mathTimes, moving: Math.round(100 * o.move / o.total) } }],
        bars: { unit: 'probe.unit.j', items: [{ key: 'floor.rung.floor', v: o.floor, floor: true }, { key: 'floor.rung.math', v: o.math }, { key: 'floor.rung.total', v: o.total }] },
        foot: 'floor.model'
      };
    }
  },
  /* a colder chip has a lower floor; pumping its heat out to the room costs exactly the difference (Carnot) */
  'limit-cold': {
    controls: [{ k: 'temp', label: 'probe.cold.temp', values: TEMPS, each: 'floor.kelvin', start: TEMPS.length - 1 }],
    run({ temp }) {
      const c = cold(temp);
      return {
        says: [temp >= 300 ? { key: 'floor.room' } : { key: 'floor.cold', vars: { k: temp, pct: Math.round(100 * c.chip / c.room), pump: Math.round(100 * c.pump / c.total) } }],
        bars: { unit: 'probe.unit.j', items: [{ key: 'probe.cold.chip', v: c.chip }, { key: 'probe.cold.pump', v: c.pump }, { key: 'probe.cold.total', v: c.total }, { key: 'probe.cold.room', v: c.room, floor: true }] }
      };
    }
  },
  /* to be sure by testing alone, try every pair of inputs */
  'limit-all': {
    controls: [{ k: 'bits', label: 'probe.all.bits', values: WIDTHS, each: 'probe.all.bitsEach', start: 3 }, { k: 'rate', label: 'probe.all.rate', values: RATES, names: 'probe.all.rates', start: 1 }],
    run({ bits, rate }) {
      const e = exhaust(bits, rate);
      return { says: [{ key: 'probe.all.says', vars: { n: bits, pairs: e.pairs, time: { s: e.seconds } } }, { key: e.years > 100 ? 'probe.all.never' : 'probe.all.can' }] };
    }
  },
  /* two descriptions, the same answers: the Logic engine builds both */
  'idea-two-ways': {
    controls: [{ k: 'job', label: 'probe.two.job', values: Object.keys(TWO_WAYS), keys: Object.keys(TWO_WAYS).map(p => 'design.proj.' + p + '.t') }],
    run({ job }) {
      const [A, B] = TWO_WAYS[job].map(code => build({ p: job, code }));
      const rows = [A, B].map(b => [{ code: b.code }, { key: b.ok ? 'probe.two.right' : 'probe.two.wrong' }, b.M.cells.length, b.transistors, { key: 'probe.two.ps', vars: { v: b.st.crit } }]);
      const small = A.transistors <= B.transistors ? [A, B] : [B, A], d = small[0].st.crit - small[1].st.crit;
      return {
        says: [{ key: 'probe.two.same', vars: { rows: A.total } }, { key: d > 0 ? 'probe.two.slower' : d < 0 ? 'probe.two.faster' : 'probe.two.tie', vars: { a: small[0].transistors, b: small[1].transistors, da: small[0].st.crit, db: small[1].st.crit } }],
        table: { head: ['probe.two.code', 'probe.two.ok', 'probe.two.gates', 'probe.two.tr', 'probe.two.delay'], rows }
      };
    }
  },
  /* a 1 passed down a chain: only parts with gain and a threshold keep it (the Substrate engine, begun) */
  'strange-chain': {
    controls: [{ k: 'restoring', label: 'probe.chain.kind', values: [false, true], keys: ['probe.chain.pass', 'probe.chain.restore'] }, { k: 'noise', label: 'probe.chain.noise', values: NOISES, names: 'probe.chain.noises', start: 1 }],
    run({ restoring, noise }) {
      const r = cascade({ restoring, noise });
      return { says: [{ key: READS[r.reads], vars: { n: r.levels.length - 1 } }, { key: restoring ? 'probe.chain.whyRestore' : 'probe.chain.whyPass' }], line: { pts: r.levels, hi: HIGH, lo: LOW }, foot: 'probe.chain.model' };
    }
  }
};
export const probeOf = id => PROBES[id] || null;
/* the starting values: the visitor's own chip where a control is one of its settings, else the control's start */
export function startOf(P, chip = {}) {
  const v = {};
  for (const c of P.controls) { const i = c.chip && chip[c.k] != null ? c.values.indexOf(chip[c.k]) : -1; v[c.k] = c.values[i >= 0 ? i : (c.start || 0)]; }
  return v;
}
