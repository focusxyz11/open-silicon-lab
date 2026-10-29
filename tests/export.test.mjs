// From simulation to silicon: the exported Verilog computes exactly what the tiny-chip design
// computes, the netlist matches the synthesized cells, and the Tiny Tapeout files are well formed.
// (CI also runs every exported project through Icarus Verilog and Yosys: scripts/verilog-check.mjs.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import * as X from '../src/engines/export.js';

/* A tiny evaluator for the Verilog subset the exporter writes: assign statements and gate primitives. */
function evalModule(src, inputs) {
  const val = { ...inputs };
  const assigns = [...src.matchAll(/^\s*assign\s+(\w+)\s*=\s*(.+?);/gm)].map(m => [m[1], m[2]]);
  const prims = [...src.matchAll(/^\s*(not|buf|nand|nor|and|or|xor|xnor)\s+\w+\s*\(([^)]*)\)/gm)].map(m => [m[1], m[2].split(',').map(s => s.trim())]);
  const ev = s => {
    const toks = s.replace(/1'b([01])/g, ' $1 ').match(/\w+|[&|^~()]/g); let p = 0;
    const prim = () => { const t = toks[p++]; if (t === '~') return 1 - prim(); if (t === '(') { const v = or(); p++; return v; } if (t === '0' || t === '1') return +t; if (!(t in val)) throw new Error('not ready'); return val[t]; };
    const and = () => { let v = prim(); while (toks[p] === '&') { p++; v &= prim(); } return v; };
    const xor = () => { let v = and(); while (toks[p] === '^') { p++; v ^= and(); } return v; };
    const or = () => { let v = xor(); while (toks[p] === '|') { p++; v |= xor(); } return v; };
    return or();
  };
  for (let round = 0; round < 200; round++) {
    let progress = false;
    for (const [n, e] of assigns) if (!(n in val)) { try { val[n] = ev(e); progress = true; } catch (err) { /* inputs not ready yet */ } }
    for (const [g, pins] of prims) { const [o, ...ins] = pins; if (o in val || !ins.every(i => i in val)) continue; const x = ins.map(i => val[i]); const r = { not: 1 - x[0], buf: x[0], and: x.reduce((a, b) => a & b), nand: 1 - x.reduce((a, b) => a & b), or: x.reduce((a, b) => a | b), nor: 1 - x.reduce((a, b) => a | b), xor: x.reduce((a, b) => a ^ b), xnor: 1 - x.reduce((a, b) => a ^ b) }[g]; val[o] = r; progress = true; }
    if (!progress) break;
  }
  return val;
}

const projects = TC.PROJ.flatMap(p => [[p, p.sol, 'solution'], [p, p.starter, 'starter']].filter(x => x[1]));

for (const [p, code, kind] of projects) {
  test(`${p.t} (${kind}): exported Verilog and gate netlist match the design`, () => {
    const D = TC.parse(code, p.ins, p.outs); assert.deepEqual(D.errs, []);
    const core = X.coreVerilog(D, p);
    const M = TC.synth(D, p.ins, p.outs, 'basic', false, '130').M;
    const gates = X.gatesVerilog(M, p);
    const nand = X.gatesVerilog(TC.synth(D, p.ins, p.outs, 'nand', false, '130').M, p);
    for (const v of TC.vectors(p.ins)) {
      const want = TC.evalDesign(D, v);
      for (const src of [core, gates, nand]) { const got = evalModule(src, v); for (const o of p.outs) assert.equal(got[o], want[o], `${o} for ${JSON.stringify(v)}`); }
    }
  });
}

test('the Tiny Tapeout wrapper uses the template interface and assigns every output', () => {
  for (const p of TC.PROJ) {
    const D = TC.parse(p.sol || p.starter, p.ins, p.outs);
    const top = X.topName('Ada ' + p.id);
    assert.match(top, /^tt_um_[a-z0-9_]+$/);
    const v = X.projectV(D, p, top);
    for (const port of ['input  wire [7:0] ui_in', 'output wire [7:0] uo_out', 'input  wire [7:0] uio_in', 'output wire [7:0] uio_out', 'output wire [7:0] uio_oe', 'input  wire       ena', 'input  wire       clk', 'input  wire       rst_n']) assert.ok(v.includes(port), port);
    assert.ok(v.includes("assign uio_oe  = 8'b0;"));
    if (p.outs.length < 8) assert.ok(v.includes('assign uo_out[7:' + p.outs.length + ']'));
    assert.equal((v.match(/^module /gm) || []).length, 2);
  }
});

test('pins put bit-numbered names least significant first', () => {
  const seg = TC.PROJ.find(p => p.id === 'seg');
  assert.deepEqual(X.pinOrder(seg).ins, ['x0', 'x1', 'x2']);
  assert.deepEqual(X.pinOrder(seg).outs, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  const add2 = TC.PROJ.find(p => p.id === 'add2');
  assert.deepEqual(X.pinOrder(add2).ins, ['a0', 'a1', 'b0', 'b1']);
});

test('test cases follow the specification on the chip pins', () => {
  const half = TC.PROJ.find(p => p.id === 'half');
  const D = TC.parse(half.sol, half.ins, half.outs);
  /* ui[0] = a, ui[1] = b; uo[0] = sum, uo[1] = carry */
  assert.deepEqual(X.cases(D, half), [{ ui: 0, uo: 0 }, { ui: 2, uo: 1 }, { ui: 1, uo: 1 }, { ui: 3, uo: 2 }]);
  const py = X.cocotbTest(D, half);
  assert.ok(py.includes('@cocotb.test()') && py.includes('(0b00000011, 0b00000010),'));
});

test('info.yaml has every pin, the top module and yaml_version 6', () => {
  const p = TC.PROJ.find(x => x.id === 'full');
  const y = X.infoYaml(p, 'tt_um_ada_full', 'Ada');
  for (const k of ['ui', 'uo', 'uio']) for (let i = 0; i < 8; i++) assert.ok(y.includes('  ' + k + '[' + i + ']: '), k + i);
  assert.ok(y.includes('top_module:  "tt_um_ada_full"'));
  assert.ok(y.includes('yaml_version: 6'));
  assert.ok(y.includes('ui[2]: "cin"'));
});

test('Verilog keywords used as wire names are renamed', () => {
  const p = { id: 'free', t: 'Your own design', ins: ['a', 'b', 'c', 'd'], outs: ['y', 'z'], d: 'x.', f: null };
  const D = TC.parse('or = a | b;\nwire2 = c & d;\ny = or ^ wire2;\nz = ~or;', p.ins, p.outs);
  assert.deepEqual(D.errs, []);
  const v = X.coreVerilog(D, p);
  assert.ok(v.includes('assign w_or = a | b;'));
  for (const vec of TC.vectors(p.ins)) { const want = TC.evalDesign(D, vec); const got = evalModule(v, vec); assert.equal(got.y, want.y); assert.equal(got.z, want.z); }
});

test('the zip file is well formed', () => {
  assert.equal(X.crc32(new TextEncoder().encode('123456789')), 0xCBF43926);
  const z = X.zip([['a.txt', 'hello'], ['dir/b.txt', 'world!']]);
  const dv = new DataView(z.buffer);
  assert.equal(dv.getUint32(0, true), 0x04034b50);
  const end = z.length - 22;
  assert.equal(dv.getUint32(end, true), 0x06054b50);
  assert.equal(dv.getUint16(end + 10, true), 2);
  const cdOff = dv.getUint32(end + 16, true);
  assert.equal(dv.getUint32(cdOff, true), 0x02014b50);
});
