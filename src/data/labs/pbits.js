/* Let the noise compute: p-bits at the switch (src/v2/labs/pbits.js, src/engines/paradigms.js) */
export default {
  name: 'pbits', css: true,
  challenges: [
    { id: 'noise', step: 'use', place: 'datacentre', at: 'switch', kind: 'pbits', grows: 'way-pbits', opens: 'strange.switch', growAt: 'lab', exp: 'strange-switch' },
    { id: 'noise-big', step: 'use', place: 'datacentre', at: 'switch', kind: 'pbits', grows: 'way-factor', opens: 'think.switch', growAt: 'lab', exp: 'strange-switch' }
  ]
};
