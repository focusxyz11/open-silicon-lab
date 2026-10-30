/* Measures: the numbers people use to compare chips, what each one counts, and which way is
   better. Knowing what a number counts, and what it leaves out, is half of reading any chip news.
   A topic says which measures it uses in its topic.json:
     "measures": [{ "measure": "bandwidth", "how": "HBM stacks set how fast the GPU is fed" }]
   Real values never live here: "facts" lists ids in src/data/facts.json, which carry the source and
   date. A measure must be used by at least two topics. "catch" is what the number hides. */
export const MEASURES = [
  { id: 'yield', t: 'Yield', unit: '% of chips on a wafer that work', better: 'higher', d: 'Sets what each working chip really costs.', catch: 'A chip can pass the factory test and still fail later in use.', facts: [] },
  { id: 'dppm', t: 'Defects per million', unit: 'faulty parts per million shipped', better: 'lower', d: 'How many bad chips reach customers. Cars and satellites need far lower numbers than phones.', catch: 'It counts failures found; failures nobody notices are not in it.', facts: [] },
  { id: 'ops-watt', t: 'Operations per watt', unit: 'TOPS/W or FLOPS/W', better: 'higher', d: 'How much work a chip does for each joule. For AI and batteries this matters more than raw speed.', catch: 'Vendors quote it at their best number format and best workload.', facts: ['asic-vs-cpu', 'encharge-en100', 'superconducting-ai'] },
  { id: 'bandwidth', t: 'Memory bandwidth', unit: 'TB/s', better: 'higher', d: 'How fast data reaches the compute. Many AI jobs are limited by this, not by math.', catch: 'Peak bandwidth is rarely reached by real programs.', facts: ['tpu-ironwood', 'trainium3', 'amd-mi400', 'cerebras-cs4'] },
  { id: 'energy-bit', t: 'Energy per bit moved', unit: 'pJ/bit', better: 'lower', d: 'What it costs to move one bit. Moving data often costs far more than computing with it.', catch: 'It depends hugely on distance: on chip, across a board or across a data center.', facts: ['energy-moving-data'] },
  { id: 'transistors', t: 'Transistors per chip', unit: 'count', better: 'higher', d: 'The classic measure of progress, doubling about every two years for decades.', catch: 'More transistors is not more speed; what they are used for matters more.', facts: ['transistor-trend', 'rubin-gpu', 'cerebras-cs4'] },
  { id: 'node', t: 'Process node', unit: 'a name such as "2 nm"', better: 'lower', d: 'Which generation of manufacturing a chip uses.', catch: 'Since the late 1990s it is a name, not the size of anything on the chip.', facts: ['tsmc-n2', 'tsmc-a16', 'tsmc-a14'] },
  { id: 'cost-chip', t: 'Cost per working chip', unit: 'dollars', better: 'lower', d: 'Wafer, test, packaging and design cost, divided by the chips that work.', catch: 'Design cost per chip depends on how many you sell.', facts: ['gpu-cost', 'design-cost-2nm'] }
];
export const measureById = id => MEASURES.find(m => m.id === id) || null;
