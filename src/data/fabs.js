/* Fab on a desk: where the made parts of a machine are made, and how long one try takes (docs/MACHINES.md, "Fab on a
   desk"). Data only, no words: the words are fab.* in src/i18n/en.json; the engine is src/engines/machine.js.

   A try that runs as software can be changed and run again the same day. A part made as a circuit, or of new matter,
   has to be made first, and the place that makes it sets how many tries fit in a year: a giant fab takes months, a
   flexible line days, a fab on a desk perhaps a day. Parts anyone can buy (blocks marked stock in src/data/blocks.js)
   are bought, not made; living matter is grown, not made in a fab, and how long that takes is not known here.

   Each place says how sure its numbers are, on the same ladder as new matter (src/data/inventions.js STATUS):
     makes    the forms it can make: 'circuit' and kinds of new matter, 'matter:<kind>';
     claims   status product | lab | guess;
              kind   days (one try: from a finished design to a part to test, as a range [fewest, most]),
                     cost (what a line costs to set up, against a giant fab: a number or a range), or note;
              fact   the entry of src/data/facts.json it rests on.
   A guess's number is the guess itself, written down so it can be argued with. If a guess about days fails, the
   days are not known: the engine counts them as never, so a try that rests on it is never chosen unless guesses count.
   TRY_DAYS: a try with nothing to make (software and bought parts) takes a day to build and test: a choice of the
   model. YEAR: days in a year, for tries a year. */

export const TRY_DAYS = 1;
export const YEAR = 365;

export const FABS = [
  /* the giant fab: every form but living matter; months a try (Pragmatic's comparison: 18 to 26 weeks from tape-out
     to tested wafers) */
  { id: 'giant', makes: ['circuit', 'matter:cim', 'matter:light', 'matter:spikes', 'matter:reversible'], claims: [
    { id: 'giantDays', status: 'product', kind: 'days', value: [126, 182], fact: 'silicon-turnaround' },
    { id: 'giantCost', status: 'product', kind: 'cost', value: 1 }] },
  /* Minimal Fab (AIST, sold by Yokogawa): no cleanroom, half-inch wafers, a hundredth to a thousandth of the cost.
     Its days a try are not in a source we found: a guess */
  { id: 'small', makes: ['circuit'], claims: [
    { id: 'smallReal', status: 'product', kind: 'note', fact: 'minimal-fab' },
    { id: 'smallCost', status: 'product', kind: 'cost', value: [0.001, 0.01], fact: 'minimal-fab' },
    { id: 'smallDays', status: 'guess', kind: 'days', value: [3, 14] }] },
  /* a flexible line (Pragmatic's FlexLogic): thin-film circuits on plastic; under 48 hours a run, under a week to
     tested wafers; a hundredth of the cost of a standard fab */
  { id: 'flexible', makes: ['circuit'], claims: [
    { id: 'flexDays', status: 'product', kind: 'days', value: [2, 7], fact: 'pragmatic-flexic' },
    { id: 'flexWeek', status: 'product', kind: 'note', fact: 'silicon-turnaround' },
    { id: 'flexCost', status: 'product', kind: 'cost', value: 0.01, fact: 'flexlogic-cost' }] },
  /* a fab on a desk: one person made 1,200 transistors at home (10 µm); a company is building factories that make
     small fabs. A day to a week a try, and its cost, are guesses */
  { id: 'desk', makes: ['circuit'], claims: [
    { id: 'deskReal', status: 'lab', kind: 'note', fact: 'zeloof-garage' },
    { id: 'deskFab2', status: 'guess', kind: 'note', fact: 'fab2' },
    { id: 'deskDays', status: 'guess', kind: 'days', value: [1, 7] },
    { id: 'deskCost', status: 'guess', kind: 'cost', value: 0.0001 }] }
];
export const FAB_IDS = FABS.map(f => f.id);
export const fabOf = id => FABS.find(f => f.id === id) || null;
