/* Debates: open questions where informed people disagree. Each view says what it claims and what
   it assumes, because the assumptions are where the disagreement really lives. No view is marked
   right: the reader weighs them, tries them in the simulations, and sees what would change their mind.

   A debate needs at least two views; each view names one assumption and at least one topic where
   you can test it. Write every view the way its best defender would. When something new is
   claimed or found, add or sharpen a view rather than declaring a winner. */
export const DEBATES = [
  { id: 'memory', t: 'The memory wall', q: 'AI chips do math faster than memory can feed them. Where will the next big jump in bandwidth come from?', views: [
    { t: 'Stack it closer', claim: 'Put memory on top of, or right beside, the compute: more HBM stacks, hybrid bonding, 3D chips.', assumes: 'Heat can still escape from taller stacks, and stacked parts keep yielding well.', topics: ['package', 'datacenter'] },
    { t: 'Keep it on the chip', claim: 'Spread SRAM across a wafer-sized chip so the weights never leave the silicon.', assumes: 'Models fit in on-chip memory, or split across many such chips cheaply.', topics: ['spatial', 'accelerators'] },
    { t: 'Move less data', claim: 'Smaller numbers, sparsity and computing inside memory cut the bytes that must move at all.', assumes: 'Answers stay accurate enough at low precision.', topics: ['compute', 'cim'] }
  ] },
  { id: 'power', t: 'The power wall', q: 'AI data centers ask for ever more electricity. What cuts the energy of an answer most?', views: [
    { t: 'Better chips', claim: 'Each chip generation does much more work per watt; keep improving the hardware.', assumes: 'Process and architecture gains keep coming at the old pace.', topics: ['accelerators', 'transistor'] },
    { t: 'Better numbers and models', claim: 'Smaller number formats and smaller models do the same job with a fraction of the work.', assumes: 'Quality holds as models and numbers shrink.', topics: ['compute', 'accelerators'] },
    { t: 'Better grids', claim: 'Efficiency gains get used up by more demand; the real limit is how fast power plants and grids can grow.', assumes: 'Demand keeps rising whatever the chips do.', topics: ['datacenter', 'scenarios'] }
  ] },
  { id: 'shrink', t: 'Beyond 2 nm', q: 'Transistors are now stacked sheets. Where does progress come from next?', views: [
    { t: 'Keep shrinking', claim: 'Stacked CFET transistors and 2D-material channels keep density rising for another decade.', assumes: 'New materials and steps can be made at scale, at an affordable cost.', topics: ['transistor', 'future', 'litho'] },
    { t: 'Stack the chips instead', claim: 'Progress moves to packaging: chiplets, hybrid bonding and 3D stacks.', assumes: 'Links between dies become dense and cheap enough to behave like one chip.', topics: ['package', 'yield'] },
    { t: 'Change the machine', claim: 'The big gains come from new kinds of computing, not from smaller switches.', assumes: 'New machines get the software and tools that today\'s chips have.', topics: ['beyond', 'scenarios'] }
  ] },
  { id: 'designcost', t: 'The cost of designing a chip', q: 'A leading-edge chip can cost hundreds of millions of dollars to design. How much of that can AI agents remove?', views: [
    { t: 'Most of it', claim: 'Agents already write RTL, tests and scripts; design teams will shrink and costs fall sharply.', assumes: 'Checking an agent\'s work can be automated and trusted too.', topics: ['agent', 'innovation'] },
    { t: 'Less than it seems', claim: 'Writing was never the main cost; specification, verification and sign-off still need people, masks still cost money.', assumes: 'Judgment about what to build and what to trust stays hard to automate.', topics: ['design', 'economics'] }
  ] },
  { id: 'open', t: 'Open hardware', q: 'Open software changed the world. Can an open instruction set, open tools and open PDKs do the same for chips?', views: [
    { t: 'Yes, as in software', claim: 'RISC-V, open tools and shared wafers lower the cost of starting, so many more people can build chips.', assumes: 'A shared base of verified designs and tools keeps growing.', topics: ['riscv', 'tiny'] },
    { t: 'Hardware is different', claim: 'Every attempt costs masks, fab time and testing; open designs do not remove the biggest costs or the need for trusted verification.', assumes: 'Manufacturing stays expensive and concentrated.', topics: ['economics', 'ecosystem'] }
  ] },
  { id: 'supply', t: 'A fragile supply chain', q: 'Most advanced chips pass through a few fabs and packaging lines. How should the chain be made resilient?', views: [
    { t: 'Spread the fabs', claim: 'Build leading-edge fabs and packaging in more regions, so one shock cannot stop the world.', assumes: 'Governments and customers will keep paying the higher cost.', topics: ['supply', 'fab'] },
    { t: 'Concentrate, with buffers', claim: 'Keep the efficient hubs and add stockpiles, second sources and long contracts.', assumes: 'Shocks are short enough to ride out on buffers.', topics: ['economics', 'ecosystem'] }
  ] },
  { id: 'signoff', t: 'Who signs off?', q: 'If AI agents write most of a chip\'s code and tests, who is responsible when the silicon fails?', views: [
    { t: 'A person, always', claim: 'An engineer must review and sign off; responsibility cannot be handed to a tool.', assumes: 'People can still understand and check what the agent built.', topics: ['agent', 'reality'] },
    { t: 'Proof, not people', claim: 'Formal checks and coverage targets can certify an agent\'s work better than a tired reviewer.', assumes: 'The specification itself is complete and correct.', topics: ['design', 'tiny'] }
  ] },
  { id: 'paradigm', t: 'After the classic processor', q: 'Ten kinds of machine, each strong on different jobs. By 2040, will one win, or will computers be mixtures of many?', views: [
    { t: 'One winner', claim: 'Digital chips like today\'s GPUs keep winning, because their software and tools are years ahead.', assumes: 'Software and tooling matter more than raw efficiency.', topics: ['accelerators', 'beyond'] },
    { t: 'Many specialists', claim: 'Energy limits force mixtures: analog, optical, spiking and quantum parts each doing the job they suit.', assumes: 'Software can split one program across very different machines.', topics: ['cim', 'neuro', 'photonic', 'quantum'] }
  ] },
  { id: 'mature', t: 'The forgotten chips', q: 'Most chips by count come from older factories with thin margins, yet one missing part can stop a car line. Who should keep that capacity running?', views: [
    { t: 'Let the market price it', claim: 'After a shortage, buyers sign longer contracts and pay more for secure supply; prices do the work.', assumes: 'Buyers remember shortages long enough to pay for safety.', topics: ['economics', 'everywhere'] },
    { t: 'Treat it as infrastructure', claim: 'A shortage costs far more than keeping spare capacity, so public support or shared reserves make sense.', assumes: 'Support can be targeted without propping up the wrong factories.', topics: ['supply', 'everywhere'] }
  ] },
  { id: 'bigdie', t: 'Big dies, low yield', q: 'Bigger chips catch more defects. When does splitting a design into chiplets win?', views: [
    { t: 'Split into chiplets', claim: 'Small dies yield better, can mix processes and can be reused across products.', assumes: 'Die-to-die links are fast, cheap and low-power enough.', topics: ['yield', 'package'] },
    { t: 'Go big anyway', claim: 'Keeping everything on one huge piece of silicon avoids slow links; spare cores route around defects.', assumes: 'Redundancy and cooling can handle a wafer-sized chip.', topics: ['spatial', 'accelerators'] }
  ] },
  { id: 'skills', t: 'People in an AI-native industry', q: 'When AI writes code and layouts, what will chip engineers spend their time on? Which skills last?', views: [
    { t: 'Engineers become directors', claim: 'People set goals, review agents\' work and decide trade-offs; tool-specific skills matter less.', assumes: 'Agents become reliable enough to trust with whole steps.', topics: ['agent', 'innovation'] },
    { t: 'Fundamentals matter more', claim: 'Someone has to know why a design fails; deep knowledge of physics, timing and verification grows in value.', assumes: 'Agents keep making subtle mistakes that only experts catch.', topics: ['design', 'reality'] }
  ] }
];
export const debateById = id => DEBATES.find(d => d.id === id) || null;
/* Every topic a debate draws on, in the order its views name them. */
export const debateTopics = d => [...new Set(d.views.flatMap(v => v.topics))];
