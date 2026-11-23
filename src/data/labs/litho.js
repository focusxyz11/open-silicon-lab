/* Print the finest lines, and the 1,000-watt source, at print (src/v2/labs/litho.js, src/engines/litho.js) */
export default {
  name: 'litho', css: true,
  challenges: [
    { id: 'litho-finest', step: 'make', place: 'fab', at: 'print', kind: 'litho', grows: 'fab-scanner', opens: 'scale.print', exp: 'scale-light' },
    { id: 'euv-1000', step: 'make', place: 'fab', at: 'print', kind: 'euv', grows: 'fab-euv', opens: 'fail.print', exp: 'scale-light', after: 'grover' }
  ]
};
