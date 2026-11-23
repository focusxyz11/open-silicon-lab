/* Listen and tell, the ear test at the block (#316, src/v2/labs/listen.js, src/engines/listen.js): only with ?listen=1
   until the owner has listened (flag: src/v2/game.js drops it from the challenges without it). It opens the block's life:
   the ear test hears the block live, a clock, sums, waits, heat */
export default {
  name: 'listen', css: true,
  challenges: [
    { id: 'ear', step: 'use', place: 'datacentre', at: 'block', kind: 'listen', flag: 'listen', grows: 'dc-ear', opens: 'life.block', exp: 'life-event' }
  ]
};
