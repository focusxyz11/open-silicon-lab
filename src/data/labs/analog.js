/* Chips that touch the real world (#220): from a signal to bits at the phone's board and the car's control unit, and the
   power chip (src/v2/labs/analog.js, src/engines/analog.js) */
export default {
  name: 'analog',
  challenges: [
    { id: 'sig-heart', step: 'ship', place: 'phones', at: 'phoneboard', kind: 'capture', grows: 'island-adc', opens: 'fail.phoneboard', exp: 'fail-heat' },
    { id: 'sig-bearing', step: 'ship', place: 'cars', at: 'ecu', kind: 'capture', grows: 'island-sensor', opens: 'fail.ecu', exp: 'fail-life' },
    { id: 'reg-jobs', step: 'ship', place: 'phones', at: 'phoneboard', kind: 'regulate', grows: 'island-reg', opens: 'fail.phoneboard', exp: 'fail-heat' }
  ]
};
