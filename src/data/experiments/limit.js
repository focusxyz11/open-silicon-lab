/* The experiments at home in the world of thread.limit.root (a core question, never shown with the others). See index.js. */
export default [
  { id: 'limit-floor', strand: 0, stops: ['limit.atom'], engine: 'floor', lens: 'walls', trade: ['energy'], figures: ['landauer-measured'], given: ['erasing'], open: ['reversible'] },
  { id: 'limit-cold', strand: 0, at: ['atom'], engine: 'floor', lens: 'walls', trade: ['energy'] },
  { id: 'limit-hard', strand: 1, stops: ['limit.gate'], engine: null, lens: 'walls', open: ['quantum', 'pbits'] },
  { id: 'limit-fell', strand: 1, at: ['chip'], engine: null, wants: 'outside', lens: 'clock' },
  { id: 'limit-never', strand: 2, stops: ['limit.rack'], engine: null, lens: 'walls' },
  { id: 'limit-all', strand: 2, at: ['block'], engine: 'floor', wants: 'part', lens: 'clock', trade: ['sure', 'time'], given: ['tried'], open: ['proof'] },
  { id: 'limit-frozen', strand: 3, stops: ['limit.chip'], also: ['idea'], engine: null, lens: 'clock', given: ['frozen'], open: ['rewire', 'selfcheck'] },
  { id: 'limit-evolve', strand: 4, at: ['gates'], engine: 'logic', lens: 'side', trade: ['sure'] }
];
