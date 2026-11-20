/* The lab's description, written as Verilog. Pure logic, no DOM; tests in tests/verilog.test.mjs.

   The lab's small language (src/engines/tinychip.js: one wire per line, & | ^ ~, reg for a flip-flop) is a
   piece of Verilog with the ceremony left out. Verilog, the language most chips are described in (an IEEE
   standard since 1995; SystemVerilog extends it), says the same thing with a module around it: its name, its
   pins, each wire declared, each line an assign, and each flip-flop updated at the clock's rising edge. The
   operators and their order are the same in both (~ first, then &, then ^, then |), so the expressions carry over
   as they are. The text this returns is what an open synthesis program such as Yosys reads. */
import TC from './tinychip.js';

const SYM = { or: '|', xor: '^', and: '&' };
/* an expression. Verilog would read it right with fewer brackets (the order is the same as the lab's), but a
   bracket wherever two different operators meet reads as people write it */
export function expr(e) {
  switch (e.op) {
    case 'const': return "1'b" + e.v;
    case 'var': return e.n;
    case 'not': return '~' + (e.a.op === 'var' || e.a.op === 'const' || e.a.op === 'not' ? expr(e.a) : '(' + expr(e.a) + ')');
    default: { const sub = c => (SYM[c.op] && c.op !== e.op ? '(' + expr(c) + ')' : expr(c)); return sub(e.a) + ' ' + SYM[e.op] + ' ' + sub(e.b); }
  }
}
const ident = s => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : 'design');

/* Verilog for a description: code in the lab's language, with the job's inputs and outputs. Returns { text, lines,
   errs } (errs: the parser's, when the description does not read; then text is empty). */
export function toVerilog(code, ins, outs, name = 'design') {
  const D = TC.parse(code, ins, outs, { regs: true });
  if (D.errs.length) return { text: '', lines: 0, errs: D.errs };
  const regs = D.order.filter(n => D.asg[n].reg), wires = D.order.filter(n => !D.asg[n].reg && !outs.includes(n));
  const ports = (regs.length ? ['input  wire clk'] : []).concat(ins.map(n => 'input  wire ' + n), outs.map(n => 'output ' + (regs.includes(n) ? 'reg ' : 'wire') + ' ' + n));
  const L = ['module ' + ident(name) + ' ('].concat(ports.map((p, i) => '  ' + p + (i < ports.length - 1 ? ',' : '')), [');']);
  wires.forEach(n => L.push('  wire ' + n + ';'));
  regs.filter(n => !outs.includes(n)).forEach(n => L.push('  reg  ' + n + ';'));
  D.order.filter(n => !D.asg[n].reg).forEach(n => L.push('  assign ' + n + ' = ' + expr(D.asg[n].e) + ';'));
  if (regs.length) { L.push('  always @(posedge clk) begin'); regs.forEach(n => L.push('    ' + n + ' <= ' + expr(D.asg[n].e) + ';')); L.push('  end'); }
  L.push('endmodule');
  return { text: L.join('\n'), lines: L.length, errs: [] };
}

/* a design built by src/engines/design.js; for the RISC-V core, its arithmetic slice (the core's description is
   the program it runs, not hardware) */
export function verilogOf(B) {
  if (!B) return null;
  if (B.p === 'core') { const S = B.slice; return S ? toVerilog(S.code, S.ins, S.outs, 'alu_slice') : null; }
  if (!B.ins || !B.outs) return null;
  return toVerilog(B.code, B.ins, B.outs, B.p);
}
