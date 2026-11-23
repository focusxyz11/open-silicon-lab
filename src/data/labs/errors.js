/* Errors, from switch to fleet: the second system-problem question, after moving bits (src/v2/labs/errors.js,
   src/engines/errors.js) */
export default {
  name: 'errors', css: true,
  challenges: [
    { id: 'silent', step: 'ship', place: 'port', at: 'ship', kind: 'errors', grows: 'port-errors', opens: 'fail.ship', exp: 'fail-enough' }
  ]
};
