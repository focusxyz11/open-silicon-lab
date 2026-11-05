/* The layers (bands) of the chip stack, from the world at the top to atoms at the bottom.
   Every topic sits in exactly one band: its topic.json says which ("band": "<id>").
   Bands are part of the fixed structure; add one only when a whole new layer is missing. */
export const BANDS = [
  { id: 'frontier',   t: 'Frontier',              d: 'New ways to compute, big questions and what comes next' },
  { id: 'industry',   t: 'Industry',              d: 'Companies, countries, money and how the field changes' },
  { id: 'systems',    t: 'Systems',               d: 'Where chips end up, from gadgets and sensors to AI and data centers' },
  { id: 'making',     t: 'Making',                d: 'Printing, building, measuring and packaging chips' },
  { id: 'design',     t: 'Design',                d: 'From code to gates to layout, and testing the result' },
  { id: 'processors', t: 'Processors and memory', d: 'How a chip runs programs, keeps time and remembers' },
  { id: 'atoms',      t: 'Atoms and switches',    d: 'Semiconductor physics and the transistor' }
];
