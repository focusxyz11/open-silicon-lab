/* Grow a crystal, at the quarry (src/v2/labs/crystal.js, src/engines/crystal.js) */
export default {
  name: 'crystal', css: true,
  challenges: [
    { id: 'crystal', step: 'make', place: 'quarry', at: 'crystal', kind: 'pull', grows: 'quarry-ingot', opens: 'make.crystal', exp: 'make-crystal' }
  ]
};
