/* A detector made of spikes, at the block (src/v2/labs/spikes.js, src/engines/paradigms.js): new matter for machines'
   blocks too (src/data/inventions.js spikes) */
export default {
  name: 'spikes', css: true,
  challenges: [
    { id: 'spikes', step: 'use', place: 'datacentre', at: 'block', kind: 'spikes', grows: 'way-spikes', opens: 'life.block', growAt: 'lab', exp: 'life-event' }
  ]
};
