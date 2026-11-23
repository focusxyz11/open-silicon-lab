/* Too hot for silicon, at the switch (src/v2/labs/semiconductor.js, src/engines/dope.js) */
export default {
  name: 'semiconductor', css: true,
  challenges: [
    { id: 'too-hot', step: 'use', place: 'datacentre', at: 'switch', kind: 'semiconductor', grows: 'dc-heat', opens: 'fail.switch', exp: 'fail-atoms' }
  ]
};
