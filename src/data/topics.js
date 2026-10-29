/* The knowledge graph behind the chip stack map: topics, the bands they sit in,
   the labelled links between them, and suggested paths (threads) through them.
   Every view reads from here, so adding a topic or link here updates the whole site. */

/* Bands of the chip stack, from the world at the top to atoms at the bottom. */
export const BANDS = [
  { id: 'future',   t: 'Innovation & future',  d: 'What limits progress, and where it could go' },
  { id: 'industry', t: 'Industry & economics', d: 'Companies, countries and money' },
  { id: 'systems',  t: 'Devices & data centers', d: 'Where chips end up: phones, cars, gadgets and the cloud' },
  { id: 'ai',       t: 'Specialized computing', d: 'Chips built for one kind of work, above all AI' },
  { id: 'pkg',      t: 'Packaging & memory',    d: 'Chiplets, HBM and advanced packages' },
  { id: 'mfg',      t: 'Manufacturing',         d: 'Printing, building and testing on the wafer' },
  { id: 'design',   t: 'Chip design',           d: 'From code to gates to layout' },
  { id: 'cpu',      t: 'Processors & ISA',      d: 'Instruction sets and how a CPU works' },
  { id: 'device',   t: 'Transistors',           d: 'The switch, and how its shape evolved' },
  { id: 'atoms',    t: 'Atoms & materials',     d: 'Semiconductor physics and pure silicon' }
];

/* kind: 'explore' (simulations and explanations) or 'build' (hands-on workshop). */
export const TOPICS = [
  { id: 'physics',      band: 'atoms',    kind: 'explore', t: 'From sand to switch',        s: 'Why silicon can switch: band gaps, doping, p–n junctions, growing a perfect crystal and implanting dopants.' },
  { id: 'transistor',   band: 'device',   kind: 'explore', t: 'The transistor',             s: 'Planar, FinFET, gate-all-around and CFET: how the switch keeps shrinking without leaking.' },
  { id: 'architecture', band: 'cpu',      kind: 'explore', t: 'Computer architecture',      s: 'x86, Arm and RISC-V compared; instruction encoding, pipelines, Amdahl\'s law and the memory hierarchy.' },
  { id: 'riscv',        band: 'cpu',      kind: 'build',   t: 'RISC-V CPU lab',             s: 'Program a real RISC-V core on a live datapath, then invent a custom AI instruction and measure the speedup.' },
  { id: 'design',       band: 'design',   kind: 'explore', t: 'Logic design',               s: 'The design flow, RTL to gates, timing, power and verification coverage.' },
  { id: 'layout',       band: 'design',   kind: 'explore', t: 'Physical layout',            s: 'Placing thousands of cells by simulated annealing so the wires stay short.' },
  { id: 'agent',        band: 'design',   kind: 'build',   t: 'Design with an AI agent',    s: 'An agent proposes designs, code and claims. Check them with real tools, find the mistakes, and decide what to trust.' },
  { id: 'tiny',         band: 'design',   kind: 'build',   t: 'Tiny chip studio',           s: 'Take your own circuit through all eight steps: logic, verification, gates, layout, masks, fab, test and a working gadget.' },
  { id: 'litho',        band: 'mfg',      kind: 'explore', t: 'Lithography',                s: 'Printing with light: resolution, EUV scanners, High-NA and the photon budget.' },
  { id: 'fab',          band: 'mfg',      kind: 'explore', t: 'Inside the fab',             s: 'The patterning loop, cleanrooms, deposition, etch, overlay and inspection.' },
  { id: 'yield',        band: 'mfg',      kind: 'explore', t: 'Wafer & yield',              s: 'Why defects make big dies expensive, and why chiplets help.' },
  { id: 'package',      band: 'pkg',      kind: 'explore', t: 'Packaging & memory',         s: 'Interposers, HBM stacks and CoWoS: the package is now a system.' },
  { id: 'compute',      band: 'ai',       kind: 'explore', t: 'AI at work',                 s: 'Systolic arrays and the roofline: why AI is limited by memory as often as by math.' },
  { id: 'accelerators', band: 'ai',       kind: 'explore', t: 'AI chip architectures',      s: 'GPUs, TPUs, wafer-scale and SRAM chips; 4-bit numbers; prefill versus decode.' },
  { id: 'build',        band: 'ai',       kind: 'build',   t: 'AI chip architect',          s: 'Design an AI chip for a mission and see how it scores against real 2026 chips.' },
  { id: 'everywhere',   band: 'systems',  kind: 'explore', t: 'Chips everywhere',           s: 'Open up a phone, a car, a thermostat and a server: dozens of different chips, and most are not cutting-edge.' },
  { id: 'datacenter',   band: 'systems',  kind: 'explore', t: 'Memory, networks & power',   s: 'DRAM and NAND cells, HBM stacks, cluster networks and the energy of every token.' },
  { id: 'ecosystem',    band: 'industry', kind: 'explore', t: 'The ecosystem',              s: 'Who supplies whom: about sixty companies from instruction sets to clouds.' },
  { id: 'supply',       band: 'industry', kind: 'explore', t: 'Supply chain map',           s: 'One GPU\'s journey across a dozen countries, and what breaks when one link fails.' },
  { id: 'economics',    band: 'industry', kind: 'explore', t: 'Economics',                  s: 'What an AI GPU costs to make, who earns what, and what a chip startup needs.' },
  { id: 'innovation',   band: 'future',   kind: 'explore', t: 'Innovation map',             s: 'Which steps AI speeds up, which need invention, money or people.' },
  { id: 'future',       band: 'future',   kind: 'explore', t: 'Roadmap',                    s: 'The state of the art year by year to the 2040s, tagged by how certain it is.' },
  { id: 'scenarios',    band: 'future',   kind: 'explore', t: 'Future scenarios',           s: 'Steer the bets that shape 2040, and see which beyond-silicon ideas are real.' }
];

/* Labelled links. Read "from → to" as "from leads to / feeds / explains to". */
export const EDGES = [
  ['physics', 'transistor', 'doping and fields make the switch'],
  ['physics', 'fab', 'implant and anneal are fab steps'],
  ['transistor', 'architecture', 'switches become logic and CPUs'],
  ['transistor', 'litho', 'lithography prints the gates'],
  ['architecture', 'riscv', 'build the open ISA yourself'],
  ['architecture', 'design', 'a CPU is described in RTL'],
  ['riscv', 'accelerators', 'custom instructions for AI'],
  ['tiny', 'riscv', 'your ALU slice runs the CPU'],
  ['design', 'layout', 'the netlist gets placed'],
  ['design', 'tiny', 'try the whole flow yourself'],
  ['layout', 'litho', 'the layout becomes masks'],
  ['tiny', 'litho', 'masks and fab, in miniature'],
  ['tiny', 'yield', 'test catches defective chips'],
  ['litho', 'fab', 'one step of the patterning loop'],
  ['fab', 'yield', 'defects decide yield'],
  ['yield', 'package', 'chiplets beat giant dies'],
  ['yield', 'economics', 'yield sets the cost per chip'],
  ['package', 'accelerators', 'HBM and CoWoS feed the compute'],
  ['package', 'datacenter', 'stacked memory, up close'],
  ['compute', 'accelerators', 'the math AI chips are built for'],
  ['accelerators', 'build', 'architect your own'],
  ['accelerators', 'datacenter', 'chips become racks'],
  ['datacenter', 'scenarios', 'power may cap AI growth'],
  ['everywhere', 'architecture', 'every device runs a processor'],
  ['everywhere', 'accelerators', 'when one job deserves its own chip'],
  ['everywhere', 'datacenter', 'the cloud behind every phone'],
  ['physics', 'everywhere', 'sensors and power chips use the physics directly'],
  ['everywhere', 'supply', 'one missing chip stops a car line'],
  ['everywhere', 'economics', 'most chips are cheap and mature'],
  ['ecosystem', 'supply', 'where each company works'],
  ['ecosystem', 'economics', 'who earns what'],
  ['ecosystem', 'riscv', 'the open-ISA community'],
  ['supply', 'fab', 'which countries make chips'],
  ['supply', 'package', 'packaging is a chokepoint'],
  ['economics', 'accelerators', 'what a GPU costs to make'],
  ['economics', 'fab', 'a fab costs $20 billion+'],
  ['build', 'economics', 'tape-out cost and margin'],
  ['innovation', 'design', 'AI agents speed up design'],
  ['design', 'agent', 'agents write RTL; people verify'],
  ['agent', 'tiny', 'check what an agent built'],
  ['agent', 'riscv', 'test the code it writes'],
  ['agent', 'compute', 'check its performance claims'],
  ['innovation', 'agent', 'which human skills still matter'],
  ['innovation', 'fab', 'capital and time limit fabs'],
  ['innovation', 'scenarios', 'the bets that shape 2040'],
  ['future', 'transistor', 'CFET and 2D channels'],
  ['future', 'litho', 'High-NA and beyond'],
  ['scenarios', 'future', 'many possible roadmaps']
];

/* Suggested routes through the map. They highlight; they never lock anything. */
export const THREADS = [
  { id: 'start', t: 'Start here', d: 'A first hour: from the chips in your pocket down to atoms, then make one yourself.', path: ['everywhere', 'physics', 'transistor', 'architecture', 'tiny', 'litho'] },
  { id: 'everyday', t: 'Everyday chips', d: 'The billions of ordinary chips in phones, cars and appliances, and why old factories still matter.', path: ['everywhere', 'architecture', 'tiny', 'yield', 'supply', 'economics'] },
  { id: 'riscv', t: 'RISC-V path', d: 'Understand, build and extend an open processor.', path: ['architecture', 'riscv', 'design', 'tiny', 'layout', 'accelerators', 'ecosystem'] },
  { id: 'ai', t: 'AI-native', d: 'Where AI changes chips, and chips change AI.', path: ['compute', 'accelerators', 'riscv', 'design', 'agent', 'innovation', 'datacenter', 'scenarios'] },
  { id: 'make', t: 'Making chips', d: 'Follow the wafer through the fab.', path: ['physics', 'transistor', 'litho', 'fab', 'yield', 'package'] },
  { id: 'industry', t: 'Industry & open ecosystem', d: 'Companies, countries, money and community.', path: ['architecture', 'riscv', 'ecosystem', 'supply', 'economics', 'innovation', 'future'] }
];

export const topicById = id => TOPICS.find(t => t.id === id) || null;
export const bandById = id => BANDS.find(b => b.id === id) || null;
export const edgesOf = id => EDGES.filter(e => e[0] === id || e[1] === id);
