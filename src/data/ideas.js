/* Big ideas: one idea that shows up in different layers of the stack. Seeing the same idea in a
   transistor, a package and a data center is how a learner starts to think like an engineer.

   Each topic says which ideas it shows, and how, in its topic.json:
     "ideas": [{ "idea": "keep-data-close", "how": "HBM sits millimetres from the processor" }]
   Add "counter": true when the topic shows where the idea stops working. Counter-examples and
   disagreements are welcome: they are often the most useful part.

   Rules (the tests check them): an idea must show up in at least two different bands, otherwise it
   is a detail of one topic. Add a new idea here only when no existing one fits. */
export const IDEAS = [
  { id: 'keep-data-close', t: 'Keep data close', d: 'Moving data costs more time and energy than computing with it, so good designs keep data near the work.' },
  { id: 'many-small', t: 'Many small beat one big', d: 'Splitting one big thing into many small, simple ones often wins on cost, yield or speed.' },
  { id: 'copies-catch-mistakes', t: 'Copies catch mistakes', d: 'Store or compute something more than once, and a single error can be found, outvoted or fixed.' },
  { id: 'smaller-until', t: 'Smaller, until physics pushes back', d: 'Shrinking made chips faster and cheaper for decades, but each step meets a physical limit that needs a new invention.' },
  { id: 'energy-budget', t: 'Energy is the budget', d: 'What a chip can do is limited less by how many switches fit than by the power they draw and the heat that must leave.' },
  { id: 'specialize', t: 'Specialize for the job', d: 'A chip built for one job beats a general one at that job, but it only pays off when the job is big and stays the same.' },
  { id: 'layers-hide-detail', t: 'Layers hide detail', d: 'Each layer makes a simple promise to the one above, so people can work on one layer without knowing everything below.' },
  { id: 'checking-is-hard', t: 'Checking is the hard part', d: 'Making something is often easier than proving it works. As AI makes making cheaper, checking becomes the bottleneck.' },
  { id: 'pay-once', t: 'Pay once, copy cheaply', d: 'Designs and factories cost a fortune up front and little per copy, so volume wins and few can afford the leading edge.' },
  { id: 'physics-computes', t: 'Let physics do the math', d: 'Instead of building math from billions of on-off switches, some machines let a physical effect compute the answer directly.' }
];
export const ideaById = id => IDEAS.find(i => i.id === id) || null;
