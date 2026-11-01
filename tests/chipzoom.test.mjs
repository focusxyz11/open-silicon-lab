import test from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import { CELLS, circuit, evalCell, dual, conducts, build, signals, tileSize } from '../src/engines/chipzoom.js';

const LOGIC = {
  INV: (a) => 1 - a, BUF: (a) => a, NAND2: (a, b) => 1 - (a & b), NOR2: (a, b) => 1 - (a | b),
  AND2: (a, b) => a & b, OR2: (a, b) => a | b, XOR2: (a, b) => a ^ b, XNOR2: (a, b) => 1 - (a ^ b),
  TIE0: () => 0, TIE1: () => 1
};

test('every library cell is opened into transistors, and the count matches the library', () => {
  for (const type of Object.keys(TC.LIB)) {
    assert.ok(CELLS[type], type + ' has a transistor circuit');
    assert.equal(circuit(type).fets.length, TC.LIB[type][0], type + ' transistor count');
  }
});

test('the transistors compute the cell\'s logic, and pull-up and pull-down never fight', () => {
  for (const type of Object.keys(CELLS)) for (const a of [0, 1]) for (const b of [0, 1]) {
    const v = { a, b };
    for (const st of CELLS[type]) {
      const down = conducts(st.pd, v, 'n'), up = conducts(dual(st.pd), v, 'p');
      assert.notEqual(down, up, type + ': exactly one network conducts at node ' + st.out + ' for a=' + a + ' b=' + b);
      v[st.out] = up ? 1 : 0;
    }
    assert.equal(evalCell(type, [a, b]).out, LOGIC[type](a, b), type + '(' + a + ',' + b + ')');
  }
});

test('transistor boxes stay inside the cell and do not overlap', () => {
  for (const type of Object.keys(CELLS)) {
    const F = circuit(type).fets;
    for (const f of F) assert.ok(f.box.x >= 0 && f.box.x + f.box.w <= 1.0001 && f.box.y >= 0 && f.box.y + f.box.h <= 1.0001, type);
    for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
      const A = F[i].box, B = F[j].box;
      const over = A.x + 1e-9 < B.x + B.w && B.x + 1e-9 < A.x + A.w && A.y + 1e-9 < B.y + B.h && B.y + 1e-9 < A.y + A.h;
      assert.ok(!over, type + ': transistors ' + i + ' and ' + j + ' overlap');
    }
  }
});

test('every built-in project zooms from board to transistor, each level inside the last', () => {
  for (const proj of TC.PROJ) for (const node of ['180', '130', '28', '3']) {
    const Z = build({ p: proj.id, code: proj.sol || proj.starter, node, lib: 'basic', util: 0.5 });
    assert.ok(Z.ok, proj.id);
    for (let k = 0; k + 1 < Z.levels.length; k++) {
      const L = Z.levels[k], N = Z.levels[k + 1];
      assert.ok(N.size < L.size, proj.id + ' ' + node + ': ' + N.id + ' is smaller than ' + L.id);
      /* the next level's frame sits inside this one */
      const r = N.size / L.size;
      assert.ok(Math.abs(L.T[0]) + r <= 1.0001 && Math.abs(L.T[1]) + r <= 1.0001, proj.id + ' ' + node + ': ' + N.id + ' fits inside ' + L.id);
    }
    /* the design fits in its tile */
    const [tw, th] = tileSize(node).map(v => v * 1e-6), u = Z.um;
    assert.ok(u.dW * u.inTile <= tw && u.dH * u.inTile <= th, proj.id + ' ' + node + ' fits its tile');
    /* a tile holds the same number of cells at every process: it scales with the cell size */
    const site = TC.NODE[node].site, ref = TC.NODE['130'].site;
    assert.ok(Math.abs((tw * th) / (site[0] * site[1]) - (160e-6 * 110e-6) / (ref[0] * ref[1])) / ((tw * th) / (site[0] * site[1])) < 1e-9, node + ': tile scales with the cell');
  }
  assert.deepEqual(tileSize('130').map(Math.round), [160, 110], 'about Tiny Tapeout\'s SKY130 tile');
});

test('signals on the wires agree with the design for every input', () => {
  for (const proj of TC.PROJ) {
    const Z = build({ p: proj.id, code: proj.sol || proj.starter, node: '130' });
    const D = TC.parse(proj.sol || proj.starter, proj.ins, proj.outs);
    for (const vec of TC.vectors(proj.ins).slice(0, 64)) {
      const ins = proj.ins.map(k => vec[k]), S = signals(Z, ins), want = TC.evalDesign(D, vec);
      for (const k of proj.outs) assert.equal(S.out[k], want[k], proj.id + ' ' + k);
      /* and each cell's transistors give the value its output wire carries */
      Z.cells.forEach((c, i) => assert.equal(evalCell(c.type, S.cellIns[i]).out, S.net[c.out], proj.id + ' cell ' + i));
    }
  }
});
