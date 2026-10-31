/* Real chips you can buy for a few cents and test on the bench with a pin-driver board: designs in
   the tiny-chip language, with the chip's pinout so the bench can show where each wire goes.
   ins / outs are in pin order: input k goes to ui_in[k], output k comes from uo_out[k]. */
import TC from '../engines/tinychip.js';

export const PARTS = [
  {
    id: 'hc00', t: '74HC00: four NAND gates', chip: '74HC00',
    d: 'The classic logic chip: four separate NAND gates in one 14-pin package. Every other gate can be built from NANDs.',
    ins: ['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'a4', 'b4'], outs: ['y1', 'y2', 'y3', 'y4'],
    code: 'y1 = ~(a1 & b1);\ny2 = ~(a2 & b2);\ny3 = ~(a3 & b3);\ny4 = ~(a4 & b4);',
    pins: { a1: 1, b1: 2, y1: 3, a2: 4, b2: 5, y2: 6, a3: 9, b3: 10, y3: 8, a4: 12, b4: 13, y4: 11 },
    power: { vcc: 14, gnd: 7 }
  },
  {
    id: 'hc00x1', t: '74HC00: one NAND gate', chip: '74HC00',
    d: 'Just the first gate of a 74HC00: two wires in, one out. The smallest real test, and it fits every board.',
    ins: ['a1', 'b1'], outs: ['y1'],
    code: 'y1 = ~(a1 & b1);',
    pins: { a1: 1, b1: 2, y1: 3 },
    power: { vcc: 14, gnd: 7 }
  }
];
/* Design bugs for the faulty-chip puzzle: the kind of mistake verification should catch. Every chip
   made from a wrong design is wrong in the same way, unlike a manufacturing defect. */
const sol = id => TC.PROJ.find(p => p.id === id).sol;
export const DESIGN_BUGS = {
  add2: { code: 's0 = a0 ^ b0;\nc0 = a0 & b0;\np1 = a1 ^ b1;\ns1 = p1;\ns2 = (a1 & b1) | (c0 & p1);', what: 'the design forgot to add the carry from bit 0 into bit 1 (s1 = p1 instead of p1 ^ c0)' },
  seg: { code: sol('seg').replace('g = (~x2 & x1) | (x2 & ~x1) | (x2 & ~x0);', 'g = (~x2 & x1) | (x2 & ~x1);'), what: 'segment g misses one case, so the digit 6 shows without its middle bar' },
  alu: { code: sol('alu').replace('cout = (a & bb) | (cin & p);', 'cout = (a & b) | (cin & p);'), what: 'the carry uses b instead of the inverted bb, so subtraction carries go wrong' }
};
export const partById = id => PARTS.find(p => p.id === id);
/* A part as a project the tiny-chip engine and the virtual board understand. */
export const asProject = part => ({ id: part.id, t: part.t, d: part.d, ins: part.ins, outs: part.outs, f: null, starter: part.code, sol: part.code });
