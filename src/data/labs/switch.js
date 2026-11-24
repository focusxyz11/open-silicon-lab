/* Invent a transistor, at the switch (src/v2/labs/switch.js, src/engines/switch.js; #329) */
export default {
  name: 'switch', css: true,
  challenges: [
    { id: 'transistor', step: 'use', place: 'datacentre', at: 'switch', kind: 'transistor', grows: 'dc-switch', opens: 'scale.switch', exp: 'scale-gen' }
  ]
};
