/* Run your core: programs for the community's RISC-V core, offered from that piece in the Lab (src/v2/labs/rv.js,
   src/engines/rvpuzzles.js) */
export default {
  name: 'rv',
  challenges: [
    { id: 'rvrun', step: 'design', place: 'lab', kind: 'rv', piece: 'core', grows: 'lab-cpu', opens: 'think.chip', exp: 'think-slice' }
  ]
};
