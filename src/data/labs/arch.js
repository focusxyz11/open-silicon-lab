/* Grow an architecture that does not exist yet, at the Lab (src/v2/labs/arch.js, src/engines/arch.js): the third scale
   of Invent (docs/MACHINES.md), after a new switch and a machine for one need. Win one need, then spread to three */
export default {
  name: 'arch', css: true,
  challenges: [
    { id: 'archniche', step: 'design', place: 'lab', kind: 'arch', grows: 'lab-grow', opens: 'divide.chip', exp: 'divide-general' },
    { id: 'archspread', step: 'design', place: 'lab', kind: 'arch', grows: 'lab-spread', opens: 'strange.gate', exp: 'strange-gate' }
  ]
};
