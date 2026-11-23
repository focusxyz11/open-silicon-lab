/* Evolve a circuit, at the studio's gates (src/v2/labs/evolve.js, src/engines/evolve.js) */
export default {
  name: 'evolve',
  challenges: [
    { id: 'evolve', step: 'design', place: 'studio', at: 'gates', kind: 'evolve', grows: 'studio-evolve', opens: 'idea.block', exp: 'idea-placed', after: 'piece' }
  ]
};
