/* The layers (bands) of the chip stack, from the world at the top to atoms at the bottom.
   Every topic sits in exactly one band: its topic.json says which ("band": "<id>").
   Bands are part of the fixed structure; add one only when a whole new layer is missing. */
export const BANDS = [
  { id: 'questions', t: 'Big questions',       d: 'Challenges beyond the technology itself' },
  { id: 'future',   t: 'Innovation & future',  d: 'What limits progress, and where it could go' },
  { id: 'next',     t: 'New ways to compute',  d: 'Memory, light, noise, qubits and neurons that compute' },
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
