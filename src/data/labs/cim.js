/* Compute in memory, at the block, where the memory wall is met (src/v2/labs/cim.js, src/engines/paradigms.js) */
export default {
  name: 'cim',
  challenges: [
    { id: 'cim', step: 'use', place: 'datacentre', at: 'block', kind: 'cim', grows: 'way-cim', opens: 'divide.block', growAt: 'lab', exp: 'divide-wall' }
  ]
};
