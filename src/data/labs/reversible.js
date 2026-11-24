/* Compute without erasing: an adder of Toffoli gates at the switch (src/v2/labs/reversible.js, src/engines/paradigms.js) */
export default {
  name: 'reversible', css: true,
  challenges: [
    { id: 'reversible', step: 'use', place: 'datacentre', at: 'switch', kind: 'reversible', grows: 'way-reversible', opens: 'strange.switch', growAt: 'lab', exp: 'strange-switch' }
  ]
};
