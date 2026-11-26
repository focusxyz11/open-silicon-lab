/* One spec, two matters, at the gate (src/v2/labs/bridge.js, src/engines/strands.js): the same logic run as silicon
   gates and as DNA strands in a test tube (an AND, then a choice), and a tube that sorts shapes by winner takes all */
export default {
  name: 'bridge', css: true,
  challenges: [
    { id: 'bridge', step: 'use', place: 'datacentre', at: 'gate', kind: 'bridge', grows: 'way-bridge', opens: 'strange.gate', growAt: 'lab', exp: 'strange-domino' },
    { id: 'dnawta', step: 'use', place: 'datacentre', at: 'gate', kind: 'bridge', grows: 'way-dnawta', opens: 'think.gate', growAt: 'lab', exp: 'strange-gate' }
  ]
};
