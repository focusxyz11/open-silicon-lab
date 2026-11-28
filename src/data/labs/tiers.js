/* Build up, not out (#482): tiers of silicon stacked until the heat stops you, memory put on the logic, coolant between
   tiers and chiplets side by side (src/v2/labs/tiers.js, src/engines/tiers.js), at the data centre's chip; it grows at
   the Lab, beside the other ways to compute, and it is a stepping stone on the chip rung of your stack */
export default {
  name: 'tiers', css: true,
  challenges: [
    { id: 'tiers', step: 'use', place: 'datacentre', at: 'chip', kind: 'tiers', grows: 'lab-tiers', opens: 'scale.chip', growAt: 'lab', exp: 'scale-double' }
  ]
};
