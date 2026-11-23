/* Ten billion vias, at print (src/v2/labs/overlay.js, src/engines/fabline.js) */
export default {
  name: 'overlay',
  challenges: [
    { id: 'vias', step: 'make', place: 'fab', at: 'print', kind: 'overlay', grows: 'fab-overlay', opens: 'fail.print', exp: 'fail-align' }
  ]
};
