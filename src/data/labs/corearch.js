/* Change your core: what a multiplier, a second unit or half the registers buy and cost (src/v2/labs/corearch.js,
   src/engines/corearch.js) */
export default {
  name: 'corearch', css: true,
  challenges: [
    { id: 'corearch', step: 'design', place: 'lab', kind: 'corearch', piece: 'core', grows: 'lab-arch', opens: 'divide.chip', exp: 'think-slice' }
  ]
};
