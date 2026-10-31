/* The virtual board: your tiny-chip design as a gate-level chip that answers the Open Bench
   Protocol, so the bench talks to it exactly as it talks to a real board. A chip can carry a
   manufacturing defect (a wire stuck at 0 or 1), which is what real chip testing hunts for.
   Pure logic, no DOM. Combinational designs only, like the tiny-chip studio. */
import TC from '../engines/tinychip.js';
import { pinOrder, cases } from '../engines/export.js';
import { obpDevice } from './obp.js';

/* proj: a TC.PROJ entry; code: its tiny-language source. */
export function virtualChip(proj, code, { lib = 'basic', node = '130', fault = null } = {}) {
  const D = TC.parse(code, proj.ins, proj.outs);
  if (D.errs.length) return { ok: false, errs: D.errs };
  const { M } = TC.synth(D, proj.ins, proj.outs, lib, false, node);
  const pins = pinOrder(proj);
  const toVec = ui => Object.fromEntries(pins.ins.map((n, i) => [n, (ui >> i) & 1]));
  const pack = out => pins.outs.reduce((uo, n, i) => uo | ((out[n] & 1) << i), 0);
  const evalWith = (ui, f) => pack(TC.simCells(M, toVec(ui), f).out);
  return {
    ok: true, D, M, proj, pins, fault,
    mask: (1 << proj.outs.length) - 1,
    cases: cases(D, proj),               /* what the outputs must be (the specification, if there is one) */
    eval: ui => evalWith(ui, fault),
    evalWith, toVec, pack
  };
}

/* The chip as an OBP device: handle(line) → reply. */
export const virtualDevice = (chip, board = 'virtual') => obpDevice({ board, eval: ui => chip.eval(ui & ((1 << chip.pins.ins.length) - 1)) });

/* Faults the full test can see: those that change at least one output for some input. */
export function visibleFaults(chip) {
  const vecs = TC.vectors(chip.proj.ins);
  const R = TC.faults(chip.M, vecs);
  return R.F.filter((f, i) => R.detected[i] >= 0);
}

/* A tray of chips from one wafer: most good, some with a hidden defect. Seeded, so a tray can be shared. */
export function tray(proj, code, { n = 4, bad = 1, seed = 1, lib = 'basic' } = {}) {
  const base = virtualChip(proj, code, { lib }); if (!base.ok) return base;
  let s = (seed >>> 0) || 1; const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const pool = visibleFaults(base);
  const which = new Set(); while (which.size < Math.min(bad, n)) which.add(Math.floor(r() * n));
  const chips = Array.from({ length: n }, (_, i) => {
    const fault = which.has(i) && pool.length ? pool[Math.floor(r() * pool.length)] : null;
    return virtualChip(proj, code, { lib, fault });
  });
  return { ok: true, chips, base };
}

/* What the simulation of this design says for every input pattern: the twin of the board.
   (cases above compare with the specification instead; the tiny-chip studio checks that.) */
export const simCases = chip => Array.from({ length: 1 << chip.pins.ins.length }, (_, ui) => ({ ui, uo: chip.evalWith(ui, null) }));
