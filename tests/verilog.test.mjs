// The lab's lines as Verilog (src/engines/verilog.js): what it writes is well formed and means the same thing. Each
// assign is read back into the lab's language and checked against the job, so a bracket in the wrong place fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import { build, solutionOf, starterOf, PROJECTS } from '../src/engines/design.js';
import { toVerilog, verilogOf, expr } from '../src/engines/verilog.js';

/* read the Verilog back: assigns stay lines, the always block's lines become reg lines */
const back = text => text.split('\n').map(l => l.trim()).flatMap(l => {
  let m = /^assign (\w+) = (.+);$/.exec(l); if (m) return [m[1] + ' = ' + m[2].replace(/1'b([01])/g, '$1') + ';'];
  m = /^(\w+) <= (.+);$/.exec(l); if (m) return ['reg ' + m[1] + ' = ' + m[2].replace(/1'b([01])/g, '$1') + ';'];
  return [];
}).join('\n');

test('every job, written as Verilog, is a module with every pin, and means the same', () => {
  for (const p of PROJECTS) {
    const D = build({ p, code: solutionOf(p) || starterOf(p), slice: solutionOf('alu') }), V = verilogOf(D);
    assert.equal(V.errs.length, 0, p);
    const proj = p === 'core' ? TC.PROJ.find(x => x.id === 'alu') : TC.PROJ.find(x => x.id === p);
    assert.match(V.text, /^module \w+ \(/);
    assert.match(V.text, /\nendmodule$/);
    for (const n of proj.ins) assert.match(V.text, new RegExp('input  wire ' + n + '\\b'), p + ': ' + n);
    for (const n of proj.outs) assert.match(V.text, new RegExp('output (wire|reg ) ' + n + '\\b'), p + ': ' + n);
    if (proj.seq) assert.match(V.text, /always @\(posedge clk\)/);
    const R = build({ p: proj.id, code: back(V.text) });
    assert.equal(R.errs.length, 0, p + ' reads back');
    const orig = p === 'core' ? D.slice : D;
    assert.deepEqual(R.rows.map(r => r.o && proj.outs.map(n => r.o[n] ?? r.o[n])), orig.rows.map(r => r.o && proj.outs.map(n => r.o[n])), p + ': same answers');
    assert.equal(V.lines, V.text.split('\n').length);
  }
});

test('brackets where operators meet, none where they do not', () => {
  const D = TC.parse('y = (a & b) | (c & ~(a ^ b)) | 1;', ['a', 'b', 'c'], ['y']);
  assert.equal(expr(D.asg.y.e), "(a & b) | (c & ~(a ^ b)) | 1'b1");
  assert.equal(toVerilog('y = a & ;', ['a'], ['y']).text, '');
  assert.ok(toVerilog('y = a & ;', ['a'], ['y']).errs.length);
  assert.equal(verilogOf(null), null);
});
