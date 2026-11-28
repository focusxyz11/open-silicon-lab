/* Your chip's record (#505, docs/CHIP.md): the shape of the one record the studio, the line and its machines, the
   simulations and the carry share, and the line's stations in order. Pure data; the engines are
   src/engines/stations.js (every machine a function) and src/engines/chiprecord.js (the record).

   The record, field by field (the names are fixed here: docs/prototypes/studio-fab/GUIDE.md names the parts):
   { kind: 'osl-chip', v, care,
     designed: { recipe, fine, aim, design (the studio's input: p, code, slice), ok, broken (null, 'design' or
                 'switch'), errs, cells ([{ id, type, ins, out, slot }]: the netlist, placed), vias (the routing's),
                 coverage, transistors, area (µm², the design's cells), masks (maskSet), die ({ gates, switches,
                 area }: the core your stack makes, cm²), fid },
     made: [{ step, chip, report }] (one per station, in the line's order),
     used: the carry, rung by rung (carry in src/engines/path.js), reading the made part }

   The chip as made, after each step, keeps what every step before it added:
     ingot    { usableMm, wafers, neckOk }               crystal  (crystal.js, pullRun)
     film     { coveragePct, voided }                    deposit  (fabline.js, depoRun)
     air      { iso, perM3 }, specks (a cm²)             deposit  (fabline.js, isoLimit; chip.js, defectsOf)
     print    { dose, noisePct, wph }, spread, pace      print    (litho.js, euv)
     masks    { drawn, total }, cells [{ id, type, width, jit }]   print: the design's masks and cells, printed
     etch     { depthNm, undercutNm, maskPct }, cells[].stray      etch (etch.js, etchRun)
     implant  { ion, anneal, xjNm, activePct }           implant  (dope.js, implant)
     wiring   { vias, p, failed }                        wires    (fabline.js, overlay, VIA)
     test     { area, dies, yield, cost, good [WAFER_DIES], strays }  test (chip.js, dieOf)
     done     the steps done so far; stopped: null, 'design' or 'switch' (the line makes nothing from Print on)

   A report: { step, adds (the fields it added), wrong ([{ what, n }]), cost (what the step costs, where an engine
   says), figures ({ name: value }: the numbers the step's frame shows), fid ({ name: mark }: every number's mark,
   src/data/fidelity.js), mark (the core question the guide puts on it, if any), waits (an issue, for a station not
   built yet) }. */

/* the line's stations, in the atlas's order (the journey's depths in src/data/weave.js, without slicing, cleaning
   and shipping), each with the engine behind it and the question the guide marks on it. Package waits for its engine
   (#500): it keeps its place in the line, and its function is added when it is built. */
export const STATIONS = [
  { id: 'crystal', by: 'crystal' },
  { id: 'deposit', by: 'fabline' },
  { id: 'print', by: 'litho', mark: 'moore' },
  { id: 'etch', by: 'etch', mark: 'perfect' },
  { id: 'implant', by: 'dope' },
  { id: 'wires', by: 'fabline' },
  { id: 'test', by: 'chip', mark: 'eff' },
  { id: 'pkg', by: null, waits: 500 }
];
export const STEPS = STATIONS.map(s => s.id);
export const stationOf = id => STATIONS.find(s => s.id === id) || null;

/* the keep format: a chip kept as its inputs, from which the record is made again */
export const KIND = 'osl-chip';
export const VERSION = 1;

/* the settings of the engines no care changes: the puller's autopilot, a film laid atom by atom in a trench six times
   deeper than wide, the etch's own defaults and seed, a shallow arsenic junction with a spike anneal, overlay as the
   scanner holds it */
export const SETTINGS = {
  crystal: { auto: true },
  deposit: { mode: 'ald', ar: 6 },
  etch: { seed: 1 },
  implant: {},
  wires: {}
};

/* the dies on one wafer as a station frame draws it (the guide's 21), your die at the centre */
export const WAFER_DIES = 21;

/* a copy's gate: its width is scaled by 1 + jit x WIDTH, jit = (hash - 0.5) x spread, the hash seeded by the cell's
   id so the same copy strays at every station and every visit (GUIDE.md, "Wavy edges"). A copy strays (switches
   late) when |jit| is over STRAY: never on today's line (spread 1 keeps |jit| under 0.5), more often as the dose
   falls. An idea drawn (the prototype's rule), marked as one until the switch engine reads each copy's width. */
export const WIDTH = 0.9, STRAY = 0.5;
