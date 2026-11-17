/* The experiments at home in the world of thread.idea.root (a core question, never shown with the others). See index.js. */
export default [
  { id: 'idea-job', strand: 0, stops: ['idea.need'], engine: null, lens: 'forms', cases: ['fdiv'] },
  { id: 'idea-tradeoff', strand: 0, stops: ['idea.chip'], engine: null, lens: 'plan', trade: ['work', 'energy', 'area', 'cost'] },
  { id: 'idea-journey', strand: 0, stops: ['idea.die'], engine: null, lens: 'line' },
  { id: 'idea-one-char', strand: 1, at: ['logic', 'check'], ch: ['half', 'vote', 'full'], engine: 'logic', lens: 'forms', trade: ['sure'] },
  { id: 'idea-two-ways', strand: 1, at: ['logic', 'gates'], engine: 'logic', probe: 1, lens: 'forms', trade: ['area', 'work'] },
  { id: 'idea-placed', strand: 1, stops: ['idea.block'], ch: ['evolve'], engine: 'logic', lens: 'forms', trade: ['area'], given: ['closed', 'hands'], open: ['aidesign'] },
  { id: 'idea-masks', strand: 1, at: ['need', 'logic', 'check', 'gates', 'layout', 'masks'], engine: 'logic', lens: 'forms' },
  { id: 'idea-sure', strand: 2, stops: ['idea.gate'], engine: null, lens: 'probe', trade: ['sure'], given: ['frozen', 'tried'], open: ['proof'] },
  { id: 'idea-coverage', strand: 2, at: ['check'], ch: ['prove'], engine: 'logic', lens: 'probe', trade: ['sure'], given: ['tried'] },
  { id: 'idea-ai', strand: 3, stops: ['idea.check'], ch: ['agent'], engine: 'logic', lens: 'side', go: '#/build', trade: ['sure'], open: ['aidesign'], debate: 'signoff' },
  { id: 'idea-blocks', strand: 4, stops: ['idea.soc'], engine: null, lens: 'map', given: ['closed'], open: ['riscv', 'openkit'] },
  { id: 'idea-precise', strand: 4, stops: ['idea.deposit'], also: ['make'], engine: null, lens: 'line', open: ['atoms'] },
  { id: 'idea-afford', strand: 4, at: ['layout'], engine: 'money', wants: 'part', lens: 'map', trade: ['cost'], figures: ['wafer-space-run', 'tt-tile'], open: ['shuttle'] }
];
