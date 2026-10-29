/* Every challenge and experiment on the site, in one list. All are open from the start;
   stars and checkmarks are feedback, never a gate. */
export const CHALLENGES = [
  { topic: 'riscv', href: '#riscv-1', kind: 'Puzzle', t: 'Power on', d: 'Put a number into a register.' },
  { topic: 'riscv', href: '#riscv-2', kind: 'Puzzle', t: 'Load, add, store', d: 'Read two numbers from memory and store their sum.' },
  { topic: 'riscv', href: '#riscv-3', kind: 'Puzzle', t: 'Loops', d: 'Add 1 to N with a branch loop.' },
  { topic: 'riscv', href: '#riscv-4', kind: 'Puzzle', t: 'No multiplier', d: 'Multiply using only RV32I instructions.' },
  { topic: 'riscv', href: '#riscv-5', kind: 'Puzzle', t: 'The neuron', d: 'Compute an int8 dot product, the core of AI.' },
  { topic: 'riscv', href: '#riscv-6', kind: 'Design', t: 'Invent an instruction', d: 'Choose a custom AI unit and beat RV32IM by 2× within an area budget.' },
  { topic: 'riscv', href: '#riscv-7', kind: 'Design', t: 'A neural layer', d: 'Four neurons with ReLU, as fast and small as you can.' },
  { topic: 'agent', href: '#lab-agent-1', kind: 'Puzzle', t: 'Verify the agent', d: 'Eight proposals from an AI agent: designs, code, estimates and facts. Trust or reject each, with evidence.' },
  { topic: 'agent', href: '#lab-agent-2', kind: 'Experiment', t: 'Calibrate your trust', d: 'Inside Claude: a live agent designs tiny chips. Decide whether to trust each design before you check it.' },
  { topic: 'tiny', href: '#tiny', kind: 'Puzzle', t: 'Find the bug: majority voter', d: 'Verification shows a missing case. Fix it before tape-out.' },
  { topic: 'tiny', href: '#tiny', kind: 'Puzzle', t: 'Find the bug: full adder', d: 'The sum line is wrong. Prove it, fix it, ship it.' },
  { topic: 'tiny', href: '#tiny', kind: 'Design', t: 'Display decoder', d: 'Finish segments d to g and route the biggest tiny design.' },
  { topic: 'tiny', href: '#lab-tiny-1', kind: 'Design', t: 'Build the CPU\'s ALU', d: 'Design one bit of an ALU. Thirty-two copies of it run the RISC-V programs.' },
  { topic: 'riscv', href: '#riscv-3', kind: 'Experiment', t: 'Break the CPU', d: 'Run a level on your own ALU, then plant a bug or a factory defect and watch what fails.' },
  { topic: 'tiny', href: '#lab-tiny-1', kind: 'Design', t: 'Tape it out for real', d: 'Export a design as a Tiny Tapeout project and run it through Yosys and OpenROAD on GitHub.' },
  { topic: 'tiny', href: '#tiny', kind: 'Design', t: 'Pack it tight', d: 'Find the highest packing density that still routes.' },
  { topic: 'future', href: '#timeMachine', kind: 'Experiment', t: 'Travel to 1985', d: 'Set the time machine to 1985 and find which of today\'s topics and companies did not exist yet.' },
  { topic: 'beyond', href: '#lab-beyond-2', kind: 'Experiment', t: 'Same job, ten machines', d: 'Pick a job and see which of ten machines suits it, from GPUs to qubits and living neurons, and why.' },
  { topic: 'cim', href: '#lab-cim-1', kind: 'Experiment', t: 'Fewest bits that still work', d: 'Find the cheapest converter that keeps an analog crossbar within 5% of exact.' },
  { topic: 'neuro', href: '#lab-neuro-1', kind: 'Puzzle', t: 'Spot the pattern', d: 'Tune a spiking neuron to fire for pattern A and never for noise.' },
  { topic: 'photonic', href: '#lab-photonic-1', kind: 'Puzzle', t: 'Steer the light', d: 'Set an interferometer\'s phases to route light or split it in any ratio.' },
  { topic: 'quantum', href: '#lab-quantum-1', kind: 'Puzzle', t: 'Entangle two qubits', d: 'Build circuits for certainty, interference and entanglement.' },
  { topic: 'pbits', href: '#lab-pbits-1', kind: 'Experiment', t: 'Run logic backwards', d: 'Clamp the output of a p-bit AND gate and let the inputs find themselves.' },
  { topic: 'reversible', href: '#lab-reversible-1', kind: 'Experiment', t: 'Approach the Landauer limit', d: 'How slowly must a gate switch to save 100× energy?' },
  { topic: 'spatial', href: '#lab-spatial-1', kind: 'Experiment', t: 'Make the model fit', d: 'Find when a model stops fitting on chip, and what that costs.' },
  { topic: 'everywhere', href: '#lab-everywhere-1', kind: 'Experiment', t: 'How many need the newest fab?', d: 'Open five products and count the chips that need a leading-edge process.' },
  { topic: 'everywhere', href: '#lab-everywhere-2', kind: 'Puzzle', t: 'The right chip for the job', d: 'Match eight real jobs to a CPU, GPU, FPGA, custom chip and more.' },
  { topic: 'build', href: '#build', kind: 'Design', t: 'Phone AI chip', d: 'Run an 8B assistant on a phone: fast, cool and cheap.' },
  { topic: 'build', href: '#build', kind: 'Design', t: 'Inference accelerator', d: 'Serve a 70B model to 64 users at the lowest cost per token.' },
  { topic: 'build', href: '#build', kind: 'Design', t: 'Training flagship', d: 'Maximum FP8 compute, memory and bandwidth.' },
  { topic: 'physics', href: '#physics', kind: 'Puzzle', t: 'Grow a perfect crystal', d: 'Pull a dislocation-free 300 mm ingot and taper it off safely.' },
  { topic: 'layout', href: '#layout', kind: 'Experiment', t: 'Watch annealing work', d: 'Change the cooling schedule and see wire length fall.' },
  { topic: 'litho', href: '#litho', kind: 'Experiment', t: 'Print the finest lines', d: 'Find the smallest pitch each scanner can still print.' },
  { topic: 'supply', href: '#supply', kind: 'Experiment', t: 'What if Taiwan stops?', d: 'Disrupt one link and see which products stall.' },
  { topic: 'economics', href: '#economics', kind: 'Design', t: 'Fund a chip startup', d: 'Reach first silicon with the least money and time.' },
  { topic: 'scenarios', href: '#scenarios', kind: 'Experiment', t: 'Escape the power wall', d: 'Find settings where electricity stops limiting AI growth.' }
];

/* Open problems the whole industry is working on. No right answer is stored here: each one
   points to the simulations where you can test your own ideas, from several perspectives. */
export const PROBLEMS = [
  { id: 'memory', t: 'The memory wall', q: 'AI chips can do math faster than memory can feed them. Where would you find the next 10× of bandwidth?', persp: ['Architect', 'Packaging', 'Materials'], try: ['compute', 'package', 'datacenter', 'accelerators'] },
  { id: 'power', t: 'The power wall', q: 'AI data centers now ask for gigawatts. What cuts the energy of a token most: better chips, better numbers, or better grids?', persp: ['Architect', 'Energy', 'Policy'], try: ['scenarios', 'datacenter', 'accelerators'] },
  { id: 'shrink', t: 'Beyond 2 nm', q: 'Transistors are now stacked sheets. What comes after gate-all-around, and what has to be invented to print it?', persp: ['Physics', 'Manufacturing'], try: ['transistor', 'litho', 'future', 'physics'] },
  { id: 'designcost', t: 'The cost of designing a chip', q: 'A leading-edge chip can cost hundreds of millions of dollars to design. Which steps could AI agents shrink, and which still need people?', persp: ['Design', 'AI', 'Economics'], try: ['design', 'tiny', 'innovation', 'economics'] },
  { id: 'open', t: 'Open hardware', q: 'Open software changed the world. Can an open ISA, open tools and open PDKs do the same for chips? What is still missing?', persp: ['Community', 'Design', 'Business'], try: ['riscv', 'ecosystem', 'tiny', 'architecture'] },
  { id: 'supply', t: 'A fragile supply chain', q: 'Most advanced chips pass through a few fabs and packaging lines. How would you make the chain resilient without making chips unaffordable?', persp: ['Policy', 'Economics', 'Manufacturing'], try: ['supply', 'economics', 'fab'] },
  { id: 'signoff', t: 'Who signs off?', q: 'If AI agents write most of a chip\'s code and tests, who is responsible when the silicon fails? What must a person still check, and how would you prove the agent\'s tests are good enough?', persp: ['Design', 'AI', 'Policy'], try: ['agent', 'design', 'tiny', 'innovation'] },
  { id: 'paradigm', t: 'After the classic processor', q: 'Ten kinds of machine, each strong on different jobs. Which will matter most by 2040, and will one win, or will computers become mixtures of many?', persp: ['Physics', 'Architecture', 'Economics'], try: ['beyond', 'cim', 'neuro', 'photonic', 'quantum', 'pbits', 'reversible', 'spatial'] },
  { id: 'mature', t: 'The forgotten chips', q: 'Most chips by count come from older factories with thin margins, yet one missing part can stop a car line. Who should pay to keep that capacity, and should it sit closer to the factories that use it?', persp: ['Economics', 'Policy', 'Manufacturing'], try: ['everywhere', 'supply', 'economics', 'fab'] },
  { id: 'bigdie', t: 'Big dies, low yield', q: 'Bigger chips catch more defects. When does splitting a design into chiplets win, and what does the package then have to do?', persp: ['Manufacturing', 'Packaging', 'Economics'], try: ['yield', 'package', 'economics'] },
  { id: 'skills', t: 'People in an AI-native industry', q: 'When AI writes code and layouts, what will chip engineers spend their time on? Which skills last?', persp: ['People', 'AI', 'Education'], try: ['innovation', 'riscv', 'design'] }
];
