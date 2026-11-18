/* The experiments at home in the world of thread.strange.root (a core question, never shown with the others). See index.js. */
export default [
  { id: 'strange-gate', strand: 0, stops: ['strange.gate'], engine: null, lens: 'side', given: ['silicon', 'switch'] },
  { id: 'strange-domino', strand: 0, at: ['gate'], engine: 'substrate', wants: 'part', lens: 'side', given: ['erasing'], open: ['reversible'] },
  { id: 'strange-material', strand: 1, stops: ['strange.chip', 'strange.deposit'], engine: null, lens: 'side', given: ['silicon'], open: ['thin', 'nanotube', 'super'] },
  { id: 'strange-chain', strand: 1, at: ['gate'], engine: 'substrate', probe: 1, lens: 'side', trade: ['sure'] },
  { id: 'strange-pure', strand: 1, stops: ['strange.crystal'], engine: null, lens: 'line', given: ['silicon'] },
  { id: 'strange-switch', strand: 2, stops: ['strange.switch'], engine: null, lens: 'side', given: ['switch'], open: ['photonic', 'pbits', 'remember'] },
  { id: 'strange-atom', strand: 2, stops: ['strange.atom'], ch: ['grover'], engine: null, lens: 'dive', given: ['exact'], open: ['quantum', 'atoms'], debate: 'quantum' },
  { id: 'strange-neurons', strand: 3, at: ['chip'], also: ['life'], engine: null, lens: 'side', figures: ['cortical-cl1'], open: ['living'] },
  { id: 'strange-for', strand: 4, at: ['switch'], engine: 'substrate', wants: 'part', lens: 'walls' },
  { id: 'strange-score', strand: 4, at: ['switch'], engine: null, lens: 'walls', open: ['super', 'photonic', 'spatial', 'approx', 'neuro', 'analog', 'cim', 'reversible', 'pbits', 'quantum'] }
];
