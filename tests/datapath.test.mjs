// Run your core's datapath (src/v2/labs/datapath.js, #373): the light that travels the wires an instruction uses reaches
// the jump-back wire in the phase that wire is lit, and travels it, on a branch taken and on a jump that keeps its
// return address (jal ra).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wiresOf, dpSvg } from '../src/v2/labs/datapath.js';

const L = { esc: s => String(s), t: k => k };
const ABI = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1', 'a0', 'a1', 'a2'];
const x = Array(32).fill(0);
const STEPS = {
  beq: { f: 'B', op: 'beq', rs1: 11, rs2: 0, imm: 8, taken: true, l: 4, pc: 12, x },
  jal: { f: 'J', op: 'jal', rd: 1, imm: 16, taken: true, val: 16, l: 2, pc: 4, x },
  jalr: { f: 'I', op: 'jalr', rd: 1, rs1: 1, imm: 0, taken: true, val: 8, l: 6, pc: 20, x },
  j: { f: 'J', op: 'jal', rd: 0, imm: -12, taken: true, l: 9, pc: 32, x }
};
/* the light's way as dpSvg writes it: each part with its phase and its points */
const routeOf = svg => /data-route="([^"]*)"/.exec(svg)[1].split('|').filter(Boolean).map(p => { const [ph, a] = p.split(':'); return { ph: +ph, p: a.split(';').map(q => q.split(',').map(Number)) }; });
const same = (a, b) => a.length === b.length && a.every((q, i) => q[0] === b[i][0] && q[1] === b[i][1]);

for (const narrow of [false, true]) {
  for (const [name, s] of Object.entries(STEPS)) {
    test('the light travels the jump-back wire in its phase: ' + name + (narrow ? ', on a phone' : ''), () => {
      const W = Object.fromEntries(wiresOf(s));
      assert.equal(W.br, 4, name + ': the jump back is lit in the last phase');
      const svg = dpSvg({ lines: Array(12).fill('nop'), step: s, show: ['ra', 'a0', 'a1'], abi: ABI, narrow }, L);
      /* the wire drawn lit says its phase */
      const lit = /class="dpw w-br on ph(\d)"/.exec(svg);
      assert.ok(lit, name + ': the jump-back wire is drawn lit');
      /* the light's way has a part that ends on that wire's points, in the same phase */
      const R = routeOf(svg), br = R.find(r => r.p.length >= 2 && same(r.p.slice(-2), (narrow ? [[203, 68], [203, 34]] : [[84, 352], [84, 340]])));
      assert.ok(br, name + ': the light travels the jump-back wire');
      assert.equal(br.ph, +lit[1], name + ': the light reaches the wire in the phase it is lit');
      /* and a jump that keeps its return address also writes it back first */
      if (s.rd) assert.ok(R.some(r => r.ph === 4 && r !== br), name + ': the return address is written back too');
      assert.equal(R[R.length - 1], br, name + ': the light ends going back to the program');
    });
  }
}

test('a branch not taken lights no jump-back wire', () => {
  const s = Object.assign({}, STEPS.beq, { taken: false });
  assert.equal(Object.fromEntries(wiresOf(s)).br, undefined);
  const svg = dpSvg({ lines: Array(12).fill('nop'), step: s, show: ['a0'], abi: ABI }, L);
  assert.doesNotMatch(svg, /w-br on/);
});
