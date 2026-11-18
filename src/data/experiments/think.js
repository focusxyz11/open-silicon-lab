/* The experiments at home in the world of thread.think.root (a core question, never shown with the others). See index.js. */
export default [
  { id: 'think-switch', strand: 0, stops: ['think.switch'], engine: null, lens: 'dive', given: ['exact'], open: ['analog', 'pbits'] },
  { id: 'think-rewire', strand: 1, stops: ['think.gate'], engine: null, lens: 'dive' },
  { id: 'think-nand', strand: 1, at: ['gates'], engine: 'logic', lens: 'forms', trade: ['area'] },
  { id: 'think-text', strand: 1, stops: ['think.logic'], also: ['idea'], engine: 'logic', lens: 'forms', trade: ['sure'] },
  { id: 'think-mcu', strand: 1, stops: ['think.mcu'], engine: null, lens: 'clock', given: ['program'] },
  { id: 'think-loop', strand: 2, stops: ['think.block'], engine: 'logic', lens: 'dive', go: '#/build/computer/regbit', given: ['apart'], open: ['cim', 'remember'] },
  { id: 'think-slice', strand: 3, at: ['chip', 'block'], engine: 'core', lens: 'dive', go: '#/build/computer/slice', trade: ['work'] },
  { id: 'think-adding', strand: 3, stops: ['think.board'], ch: ['prefill'], also: ['divide'], engine: 'timing', lens: 'plan', trade: ['work', 'energy'], open: ['spatial'] },
  { id: 'think-face', strand: 3, stops: ['think.soc'], also: ['divide'], engine: null, lens: 'plan', open: ['neuro'] },
  { id: 'think-seven', strand: 3, at: ['chip'], engine: 'core', lens: 'plan', trade: ['work'] },
  { id: 'think-count', strand: 3, at: ['gate', 'switch'], also: ['limit'], engine: 'floor', lens: 'clock', trade: ['energy'] },
  { id: 'think-add-down', strand: 4, at: ['chip', 'gate', 'switch', 'atom'], engine: 'core', lens: 'clock' },
  { id: 'think-where', strand: 4, stops: ['think.chip', 'think.rack', 'think.atom'], ch: ['quantize'], engine: null, lens: 'dive' }
];
