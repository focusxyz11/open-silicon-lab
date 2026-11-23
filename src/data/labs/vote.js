/* A reliable whole from flaky parts, at the studio's gates (src/v2/labs/vote.js) */
export default {
  name: 'vote',
  challenges: [
    { id: 'flaky', step: 'design', place: 'studio', at: 'gates', kind: 'redund', grows: 'studio-vote', opens: 'fail.gates', exp: 'life-damage' }
  ]
};
