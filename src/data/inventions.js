/* Beyond today's chip: kinds of new matter a block of a machine can be made of (docs/MACHINES.md, "Invent"). Data only,
   no words: the words are invent.* in src/i18n/en.json; the engine is src/engines/machine.js.

   Inventing is open, so a kind of matter may rest on guesses; but every claim it rests on says how sure it is, and the
   machine's energy is shown as a range: what it would be if the guesses hold, and if they fail. Physics sets a wall no
   claim can pass (the floor, src/engines/floor.js): no step costs less than erasing the bits it must erase.

   STATUS: how sure a claim is, from most to least: in products, shown in a lab, a guess.
   MATTERS: each kind of new matter, the blocks it can be a form of (on), whether it can still change after it is made,
   whether its answers are exact, whether it is grown rather than made in a fab (grown), the bits its floor counts (floor: 'op', every bit a multiply-add erases; or a number,
   the bits of the answer alone, for logic that erases nothing on the way), and its claims:
     status   product | lab | guess;
     fid      how the lab knows it, on the lab's ladder (src/data/fidelity.js): idea (a guess, or a note drawn), figures
              (it rests on fact), computed (an engine runs it: engine); a guess is never more than an idea;
     kind     gain (lowers the energy), catch (raises it) or note (says something true, changes no number);
     energy   the factor against a circuit made for the same work: a number, 'cim' (the compute-in-memory engine's
              crossbar against a digital array, src/engines/paradigms.js) or 'activity' (the share of time the need is
              busy, ACTIVITY below);
     fact     the entry of src/data/facts.json it rests on, or engine, the file of the lab that computes it;
   and lab, when a lab models it: the challenge it opens from Machines (src/data/labs/).
   A guess's number is the guess itself, written down so it can be argued with; it is never shown as a figure.
   ACTIVITY: how much of the time a need has something to do (a choice of the model). */

export const STATUS = ['product', 'lab', 'guess'];
export const KINDS = ['gain', 'catch', 'note'];
export const ACTIVITY = { rare: 0.02, steady: 0.5 };

export const MATTERS = [
  { id: 'cim', on: ['learner'], changes: true, exact: false, floor: 'op', claims: [
    { id: 'cimArray', status: 'lab', fid: 'computed', kind: 'gain', energy: 'cim', engine: 'src/engines/paradigms.js' },
    { id: 'cimNoise', status: 'lab', fid: 'computed', kind: 'note', engine: 'src/engines/paradigms.js' }] },
  { id: 'light', on: ['learner'], changes: true, exact: false, floor: 'op', claims: [
    { id: 'lightReal', status: 'product', fid: 'figures', kind: 'note', fact: 'qant-photonic' },
    { id: 'lightNoise', status: 'lab', fid: 'computed', kind: 'note', engine: 'src/engines/paradigms.js' },
    { id: 'lightCheap', status: 'guess', fid: 'idea', kind: 'gain', energy: 0.1 },
    { id: 'lightConvert', status: 'guess', fid: 'idea', kind: 'catch', energy: 2 }] },
  { id: 'spikes', on: ['learner'], changes: true, exact: false, floor: 'op', claims: [
    { id: 'spikesReal', status: 'lab', fid: 'figures', kind: 'note', fact: 'hala-point' },
    { id: 'spikesEvents', status: 'lab', fid: 'computed', kind: 'gain', energy: 'activity', engine: 'src/engines/paradigms.js' },
    { id: 'spikesCost', status: 'guess', fid: 'idea', kind: 'catch', energy: 3 }] },
  /* reversible logic erases nothing on the way, so its floor is the answer's 16 bits alone; the test chip recovered
     energy by 1.41 in a shift register and 1.77 in a capacitor array (facts.json vaire-ice-river): the lower is used */
  { id: 'reversible', on: ['adder', 'counter', 'voter', 'parity'], changes: false, exact: true, floor: 16, lab: 'reversible', claims: [
    { id: 'revChip', status: 'lab', fid: 'figures', kind: 'gain', energy: 1 / 1.41, fact: 'vaire-ice-river' },
    { id: 'revFree', status: 'guess', fid: 'idea', kind: 'gain', energy: 0 }] },
  /* living matter is grown from cells, not made in a fab (src/data/fabs.js): how long a try takes is not known */
  { id: 'living', on: ['learner'], changes: true, exact: false, floor: 'op', grown: true, claims: [
    { id: 'liveReal', status: 'product', fid: 'figures', kind: 'note', fact: 'cortical-cl1' },
    { id: 'liveBrain', status: 'guess', fid: 'idea', kind: 'gain', energy: 0.001, fact: 'brain-power' },
    { id: 'liveSupport', status: 'guess', fid: 'idea', kind: 'catch', energy: 100 },
    { id: 'liveGrown', status: 'lab', fid: 'figures', kind: 'note', fact: 'cortical-cl1' }] }
];
export const MATTER_IDS = MATTERS.map(m => m.id);
export const matterOf = id => MATTERS.find(m => m.id === id) || null;
export const mattersFor = blockId => MATTERS.filter(m => m.on.includes(blockId));
