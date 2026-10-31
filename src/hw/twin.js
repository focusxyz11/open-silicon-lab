/* Twin testing: send every input pattern to a board and to the simulation, and compare. When they
   disagree, diagnose: which single defect (one wire stuck at 0 or 1) would explain exactly what the
   board did? That is how test engineers locate faults in real chips. Pure logic, no DOM. */
import TC from '../engines/tinychip.js';

/* cases: [{ ui, uo }] (uo = what the simulation or specification expects); board: { setIn, getOut }.
   onRow(row, k) reports progress. Returns every row and the counts. */
export async function twinTest(cases, board, { mask = 255, onRow } = {}) {
  const rows = [];
  for (let k = 0; k < cases.length; k++) {
    const c = cases[k];
    await board.setIn(c.ui);
    const got = (await board.getOut()) & mask;
    const row = { ui: c.ui, want: c.uo & mask, got, ok: got === (c.uo & mask) };
    rows.push(row); if (onRow) onRow(row, k);
  }
  const fail = rows.filter(r => !r.ok).length;
  return { rows, pass: rows.length - fail, fail, ok: fail === 0 };
}

/* Which output pins went wrong, across all rows: a bit mask. */
export const wrongPins = rows => rows.reduce((m, r) => m | (r.got ^ r.want), 0);

/* chip: a virtualChip (its netlist is the reference). Returns the single stuck-at faults that
   reproduce the board's answers on every row, each with a plain description of where it is. */
export function diagnose(chip, rows) {
  const out = [];
  if (!rows.some(r => !r.ok)) return out;
  for (let net = 0; net < chip.M.nets; net++) for (const v of [0, 1]) {
    const f = { net, v };
    if (rows.every(r => (chip.evalWith(r.ui, f) & chip.mask) === r.got)) out.push({ ...f, where: describeNet(chip, net) });
  }
  return out;
}

/* Where a wire is: an input pin, the output of which gate, and which outputs it feeds. */
export function describeNet(chip, net) {
  const M = chip.M;
  const pin = M.inputs.find(i => i.net === net);
  const k = M.cells.findIndex(c => c.out === net);
  const outs = M.outs.filter(o => o.net === net).map(o => o.name);
  return { pin: pin ? pin.name : null, cell: k >= 0 ? { index: k, type: M.cells[k].type } : null, outs };
}
