/* The experiments at home in the world of thread.make.root (a core question, never shown with the others). See index.js. */
export default [
  { id: 'make-light', strand: 0, stops: ['make.chip', 'make.scanner'], engine: null, lens: 'line', given: ['masks'], open: ['imprint', 'beam', 'self'] },
  { id: 'make-nomask', strand: 0, stops: ['make.masks'], engine: null, wants: 'process', lens: 'walls', trade: ['time', 'cost'], given: ['masks'], open: ['beam'] },
  { id: 'make-grow', strand: 1, stops: ['make.switch'], engine: null, lens: 'dive', open: ['self'] },
  { id: 'make-atoms', strand: 1, stops: ['make.atom'], engine: null, lens: 'dive', open: ['atoms'] },
  { id: 'make-etch', strand: 1, stops: ['make.etch'], engine: null, lens: 'dive' },
  { id: 'make-impure', strand: 1, stops: ['make.implant'], engine: null, lens: 'dive' },
  { id: 'make-quick', strand: 2, at: ['deposit'], ch: ['quick'], engine: 'factory', lens: 'line', trade: ['time', 'cost'] },
  { id: 'make-layers', strand: 2, stops: ['make.wires'], engine: null, lens: 'line', given: ['flat'], open: ['stack'] },
  { id: 'make-package', strand: 2, stops: ['make.die', 'make.pkg'], ch: ['onebad'], engine: null, lens: 'line', given: ['onepiece'], open: ['chiplets', 'stack'] },
  { id: 'make-months', strand: 3, at: ['clean'], ch: ['months'], engine: 'factory', lens: 'line', trade: ['time', 'cost'] },
  { id: 'make-room', strand: 3, stops: ['make.clean'], engine: null, lens: 'map', given: ['giant'], open: ['smallfab'] },
  { id: 'make-crystal', strand: 3, stops: ['make.crystal', 'make.slice'], ch: ['crystal'], engine: null, lens: 'line', given: ['silicon'] },
  { id: 'make-round', strand: 3, stops: ['make.wafer'], ch: ['cheaper'], engine: 'money', lens: 'copies', trade: ['yield', 'cost'] },
  { id: 'make-cheap', strand: 3, stops: ['make.mcu'], engine: null, lens: 'copies', trade: ['cost', 'yield'] },
  { id: 'make-gates', strand: 4, stops: ['make.gates'], also: ['idea'], engine: 'logic', lens: 'forms', trade: ['area', 'work', 'energy'] },
  { id: 'make-order', strand: 4, at: ['switch'], engine: null, wants: 'process', lens: 'dive', trade: ['yield'] }
];
