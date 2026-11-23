/* The bench's own challenges (src/v2/labs/bench.js, src/engines/bench.js): what the piece you pick must answer, at the
   job; the shortest wire, at the layout; which mask each shape is printed from, at the masks */
export default {
  name: 'bench',
  challenges: [
    { id: 'piece', step: 'design', place: 'studio', at: 'need', kind: 'piece', grows: 'studio-piece', opens: 'open.need', exp: 'divide-need' },
    { id: 'floor', step: 'design', place: 'studio', at: 'layout', kind: 'floor', grows: 'studio-floor', opens: 'divide.layout', exp: 'divide-place' },
    { id: 'maskof', step: 'design', place: 'studio', at: 'masks', kind: 'maskof', grows: 'studio-masks', opens: 'make.masks', exp: 'idea-masks' }
  ]
};
