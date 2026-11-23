/* Half the power at the block, and the counter that fails at the gate (src/v2/labs/clockpower.js,
   src/engines/clockpower.js); both grow at the studio, where the clock and the power budget are decided */
export default {
  name: 'clockpower',
  challenges: [
    { id: 'power-curve', step: 'use', place: 'datacentre', at: 'block', kind: 'powercurve', grows: 'blk-power', opens: 'life.block', growAt: 'studio', exp: 'life-event' },
    { id: 'counter', step: 'use', place: 'datacentre', at: 'gate', kind: 'counter', grows: 'gate-counter', opens: 'fail.gate', growAt: 'studio', exp: 'fail-margin' }
  ]
};
