/* Liquid hardware: fabrics that can be rewired after they are made, so a block can be exact like a circuit and still
   change like software (docs/MACHINES.md, "Liquid hardware"). Data only, no words: the words are liquid.* in
   src/i18n/en.json; the engine is src/engines/machine.js.

   A liquid fabric is bought ready-made and configured, never made in a fab for one design (src/data/fabs.js): a try is
   a new configuration, not a new chip. What it costs is the switches and wires that make it flexible, and the time it
   takes to rewire, while it does no work.

   Every number says how sure it is, on the same ladder as new matter (src/data/inventions.js STATUS):
     energy   the energy of the same job against a circuit made for it: { value, status, fid, fact };
     reshape  how long it takes to rewire, in seconds, as a range [fastest, slowest]: { value, status, fid, fact };
     notes    what is true and changes no number: { id, status, fact }.
   and each says how the lab knows it (fid, src/data/fidelity.js): figures where it rests on fact, an idea where it is a
   guess.
   A guess's number is the guess itself, written down so it can be argued with. If a guess fails, the fabric is no
   better than the one shown in products: it costs FALLBACK's energy and takes FALLBACK's time to rewire.
   ON: the blocks a fabric can be configured into (logic that holds no stored data of its own).
   RESHAPE: how long other forms take to change, for the rule keep (a need whose job changes every so often):
   software switches to another program in about a microsecond, new matter that can change rewrites its state in
   about a millisecond (both choices of the model); a circuit never changes. */

export const ON = ['learner', 'adder', 'counter', 'voter', 'parity'];
export const RESHAPE = { software: 1e-6, matter: 1e-3 };
export const FALLBACK = 'fpga';

export const LIQUIDS = [
  /* rewired bit by bit: in every shop today */
  { id: 'fpga',
    energy: { value: 14, status: 'product', fid: 'figures', fact: 'fpga-asic-gap' },
    reshape: { value: [324e-6, 0.209], status: 'product', fid: 'figures', fact: 'fpga-reconfig-time' },
    notes: [{ id: 'fpgaArea', status: 'product', fid: 'figures', fact: 'fpga-asic-gap' }, { id: 'fpgaWhole', status: 'product', fid: 'figures', fact: 'fpga-reconfig-time' }] },
  /* rewired word by word, on every tick of the clock: test chips. Against a circuit, no source gives one figure:
     three times is a guess */
  { id: 'cgra',
    energy: { value: 3, status: 'guess', fid: 'idea' },
    reshape: { value: [1e-9, 1e-9], status: 'lab', fid: 'figures', fact: 'cgra-hycube' },
    notes: [{ id: 'cgraChip', status: 'lab', fid: 'figures', fact: 'cgra-hycube' }] },
  /* the goal: rewired in 50 ns, at nearly a circuit's energy. Nobody has shown it yet */
  { id: 'goal',
    energy: { value: 1.5, status: 'guess', fid: 'idea' },
    reshape: { value: [50e-9, 50e-9], status: 'guess', fid: 'idea', fact: 'prowess' },
    notes: [{ id: 'goalAim', status: 'guess', fid: 'idea', fact: 'prowess' }] }
];
export const LIQUID_IDS = LIQUIDS.map(l => l.id);
export const liquidOf = id => LIQUIDS.find(l => l.id === id) || null;
export const liquidsFor = blockId => (ON.includes(blockId) ? LIQUIDS : []);
