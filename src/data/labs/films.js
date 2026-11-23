/* Etch straight down, and the bare bottom at deposit (src/v2/labs/films.js, src/engines/etch.js) */
export default {
  name: 'films',
  challenges: [
    { id: 'etch', step: 'make', place: 'fab', at: 'etch', kind: 'etch', grows: 'fab-etch', opens: 'make.etch', exp: 'make-etch' },
    { id: 'bottom', step: 'make', place: 'fab', at: 'deposit', kind: 'deposit', grows: 'fab-ald', opens: 'idea.deposit', exp: 'make-quick' }
  ]
};
