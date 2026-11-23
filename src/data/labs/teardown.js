/* Look inside, at the phone's board, and the right chip for the job, at the studio's need (src/v2/labs/teardown.js,
   src/data/teardown.js) */
export default {
  name: 'teardown',
  challenges: [
    { id: 'newest', step: 'ship', place: 'phones', at: 'phoneboard', kind: 'teardown', grows: 'island-teardown', opens: 'open.phoneboard', exp: 'open-modem' },
    { id: 'jobs', step: 'design', place: 'studio', at: 'need', kind: 'fit', grows: 'studio-fit', opens: 'divide.need', exp: 'divide-need', after: 'reg-jobs' }
  ]
};
