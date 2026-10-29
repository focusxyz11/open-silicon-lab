/* New ways to compute: the machines, the jobs they suit, and a gallery of frontier ideas.
   Fit scores and maturity are an editorial synthesis of the sources in src/data/facts.json,
   made to compare paradigms with one another. They are judgments, not measurements. */

export const STAGES = ['Idea', 'Lab demos', 'Prototype chips', 'Early products', 'Mainstream'];

/* id, name, topic, stage (index into STAGES), one line on how it computes */
export const MACHINES = [
  ['cpu', 'Classic processor', 'architecture', 4, 'Fetches instructions one after another and moves data to the math.'],
  ['gpu', 'GPU or AI accelerator', 'accelerators', 4, 'Thousands of simple cores doing the same math on lots of data.'],
  ['spatial', 'Dataflow and wafer-scale', 'spatial', 4, 'The program is laid out across the chip; data flows between tiles.'],
  ['cim', 'Compute in memory', 'cim', 3, 'Memory cells do the multiply-adds where the weights are stored.'],
  ['neuro', 'Neuromorphic', 'neuro', 3, 'Spiking neurons that use energy only when something happens.'],
  ['photonic', 'Photonic', 'photonic', 3, 'Light does matrix math by interference and carries data without heat.'],
  ['pbits', 'Probabilistic', 'pbits', 2, 'Noisy bits that settle into good answers for sampling and optimization.'],
  ['quantum', 'Quantum', 'quantum', 2, 'Qubits in superposition, with interference steering towards answers.'],
  ['reversible', 'Reversible', 'reversible', 1, 'Logic that loses no information, so switching energy can be recycled.'],
  ['bio', 'Living neurons', 'beyond', 1, 'Real neurons grown on a chip, trained with electrical signals.']
];

/* Jobs, and how well each machine fits: 0 not built for it, 1 possible, 2 good, 3 best today or in sight. */
export const JOBS = [
  { id: 'exact', t: 'Run everyday software exactly', d: 'Spreadsheets, browsers, operating systems: millions of different instructions, every bit must be right.',
    fit: { cpu: [3, 'Built for exactly this: any program, exact answers.'], gpu: [1, 'Only the parallel parts speed up.'], spatial: [1, 'Shines on regular data flows, not branchy code.'], reversible: [1, 'Could in principle run anything with far less energy, but only test chips exist.'] } },
  { id: 'llm', t: 'Serve a large language model', d: 'Hundreds of billions of weights, read again for every token, to millions of users.',
    fit: { gpu: [3, 'Today\'s workhorse: huge memory bandwidth and mature software.'], spatial: [3, 'Wafer-scale and SRAM dataflow chips keep weights on chip and lead on speed per user.'], cim: [1, 'Great for small models; big models outgrow the arrays and need exact digital steps too.'], photonic: [1, 'Fast, low-power matrix math, but converting to and from light costs energy and precision.'], cpu: [1, 'Works for small models, slowly.'], reversible: [1, 'A long-term route to lower energy per operation.'] } },
  { id: 'sense', t: 'Listen for a wake word for a year on a coin cell', d: 'Always on, almost always silence, a tiny battery.',
    fit: { neuro: [3, 'Spikes only when sound changes: microwatts while idle.'], cim: [2, 'Small analog arrays run tiny networks very efficiently.'], cpu: [2, 'A low-power microcontroller with a small network works today.'], reversible: [1, 'Would cut energy further one day.'] } },
  { id: 'sample', t: 'Sample and optimize', d: 'Find a good schedule or route among billions, or draw samples for a generative model.',
    fit: { pbits: [3, 'Noise is the engine: p-bits explore many answers in parallel and settle into good ones.'], gpu: [2, 'Runs sampling algorithms well, at a high energy cost.'], quantum: [1, 'Annealers and some algorithms may help; a clear advantage is still debated.'], cpu: [1, 'Classic heuristics work, slowly for big problems.'], neuro: [1, 'Spiking networks can sample too.'], cim: [1, 'Analog noise can be put to use.'], photonic: [1, 'Optical Ising machines are a research topic.'] } },
  { id: 'chem', t: 'Simulate molecules and materials exactly', d: 'Electrons behave quantum-mechanically; the cost of exact simulation explodes with size.',
    fit: { quantum: [3, 'The original reason to build quantum computers. Needs error-corrected machines, planned for around 2029.'], gpu: [2, 'Approximate methods and AI models work well for many molecules.'], cpu: [2, 'Classic simulation codes, limited by exponential cost.'] } },
  { id: 'learn', t: 'Learn from a few examples on almost no energy', d: 'What brains do: adapt continuously, from little data, on about 20 watts.',
    fit: { bio: [2, 'Real neurons learn by themselves; controlling and scaling them is the open problem.'], neuro: [2, 'On-chip learning rules are a core research goal.'], gpu: [1, 'Can learn anything, with lots of data and energy.'], cim: [1, 'Analog weights can be updated in place, with drift and noise to manage.'] } }
];

/* Frontier gallery: id, name, stage, what it saves, how it works, latest signal, the catch, fact id. */
export const SAVES = { energy: 'Energy', speed: 'Speed', data: 'Data movement', density: 'Density', problems: 'New problems' };
export const GALLERY = [
  ['super', 'Superconducting logic', 1, 'energy', 'Currents flow with zero resistance in metals cooled to a few kelvin; logic switches with single flux quanta.', 'An imec-led team targets about 100× better energy efficiency for AI data centers, even after paying for cooling.', 'Everything must be cooled to near absolute zero, and the circuits are far less dense than CMOS.', 'superconducting-ai'],
  ['bio', 'Living neurons on chips', 1, 'energy', 'Human neurons grown on an electrode array learn from electrical feedback.', 'Cortical Labs released the CL1 in March 2025, a biological computer sold for about $35,000.', 'Cells live for months, behave differently each time, and raise ethical questions.', 'cortical-cl1'],
  ['dna', 'DNA data storage', 2, 'density', 'Data is written as sequences of the four DNA bases: an exabyte could fit in a few grams.', 'Biomemory plans its first commercial DNA storage in data centers in the second half of 2026.', 'Writing and reading take hours and cost far more than tape today.', 'biomemory-dna'],
  ['spin', 'Spintronic logic', 2, 'energy', 'Uses the magnetic spin of electrons instead of charge, so states survive without power.', 'Magnetic memory (MRAM) already ships inside microcontrollers; spin logic is still in labs.', 'Switching is slower and less reliable than transistors.', null],
  ['memristor', 'Memristor crossbars', 2, 'data', 'Resistors that remember: a grid of them stores weights and multiplies in one step.', 'The core of many compute-in-memory prototypes.', 'Values drift over time and differ from device to device.', null],
  ['stoch', 'Stochastic computing', 1, 'energy', 'Numbers become random bit streams; a single AND gate multiplies two of them.', 'Used in research for tiny, fault-tolerant circuits.', 'Precision needs long streams, which costs time.', null],
  ['reservoir', 'Physical reservoir computing', 1, 'problems', 'Let a physical system, such as a laser, a spin wave or a bucket of water, transform the input, and train only a simple readout.', 'Many lab demos on time-series prediction.', 'Hard to make reliable, programmable and large.', null],
  ['analog', 'Analog computers', 3, 'speed', 'Voltages stand for numbers; circuits solve equations continuously instead of step by step.', 'Small companies sell analog computers again for differential equations and control.', 'Noise limits precision, and each problem needs rewiring.', null],
  ['anneal', 'Quantum annealers', 3, 'problems', 'Thousands of qubits relax into low-energy states that encode optimization answers.', 'Sold commercially for optimization research.', 'Whether they beat good classical methods is still debated.', null],
  ['approx', 'Approximate computing', 4, 'energy', 'Accept small errors where nobody notices them, and save energy and area.', 'Already mainstream in AI: 8-, 4- and even fewer-bit numbers.', 'Only works where errors are tolerable.', null],
  ['optnn', 'Diffractive optical networks', 1, 'speed', 'Light passes through printed layers that diffract it into an answer: computing at the speed of light, with no power for the math.', 'Lab demos classify simple images.', 'Fixed once printed; hard to train and scale.', null],
  ['molecular', 'Molecular and chemical computing', 0, 'density', 'Molecules or chemical reactions carry out logic.', 'Research curiosity since DNA computing in 1994.', 'Very slow, and hard to read out.', null]
];
