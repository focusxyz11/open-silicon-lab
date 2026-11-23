/* The furnace spreads it, and shallow and switched on, at implant (src/v2/labs/implant.js, src/engines/dope.js) */
export default {
  name: 'implant',
  challenges: [
    { id: 'furnace', step: 'make', place: 'fab', at: 'implant', kind: 'implant', grows: 'fab-implanter', opens: 'make.implant', exp: 'make-impure' },
    { id: 'shallow', step: 'make', place: 'fab', at: 'implant', kind: 'implant', grows: 'fab-anneal', opens: 'fail.implant', exp: 'make-impure' }
  ]
};
