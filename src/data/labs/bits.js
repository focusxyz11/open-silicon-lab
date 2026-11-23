/* If information weighs nothing, why does moving it cost so much? One bit's trip, and Keep the chef busy
   (src/v2/labs/bits.js, src/engines/bits.js); its home in the atlas is QUESTIONS.bits */
import { QUESTIONS } from '../atlas.js';

export default {
  name: 'bits', css: true,
  challenges: [
    { id: 'chef', step: 'use', place: QUESTIONS.bits.home.place, at: QUESTIONS.bits.home.level, kind: 'chef', grows: 'dc-pantry', opens: 'divide.block', exp: 'divide-wall' }
  ]
};
