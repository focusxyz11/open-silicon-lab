/* Every challenge and experiment on the site, in one list. All are open from the start;
   stars and checkmarks are feedback, never a gate. */
/* Each challenge is written in its topic's topic.json ("challenges"); this is the generated list. */
export { CHALLENGES } from '../generated/graph.js';

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
