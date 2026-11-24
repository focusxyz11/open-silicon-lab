/* Listen and tell, the ear test at the block (#316, src/v2/labs/listen.js, src/engines/listen.js): for everyone since
   the owner listened (#317; it was behind ?listen=1 until then). It opens the block's life:
   the ear test hears the block live, a clock, sums, waits, heat */
export default {
  name: 'listen', css: true,
  challenges: [
    { id: 'ear', step: 'use', place: 'datacentre', at: 'block', kind: 'listen', grows: 'dc-ear', opens: 'life.block', exp: 'life-event' }
  ]
};
