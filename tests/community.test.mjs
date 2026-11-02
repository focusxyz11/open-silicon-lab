import test from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import { check, checkAll, chipVerilog, chipCases, chipFiles, designFile, LIMITS } from '../src/engines/community.js';
import { loadDesigns, buildCommunity } from '../scripts/community.mjs';
import { pinOrder } from '../src/engines/export.js';

test('every design in community/ passes its checks', () => {
  const { list, problems } = loadDesigns();
  assert.deepEqual(problems, []);
  assert.ok(list.length >= 3);
  assert.deepEqual(buildCommunity().problems, []);
});

test('bad designs are refused with plain reasons', () => {
  const ok = { slug: 'my-xor', title: 'XOR', author: 'Ada', ins: ['a', 'b'], outs: ['y'], code: 'y = a ^ b;' };
  assert.equal(check(ok).ok, true);
  const why = d => check({ ...ok, ...d }).problems.join(' ');
  assert.match(why({ slug: 'My Design' }), /folder name/);
  assert.match(why({ author: '' }), /author/);
  assert.match(why({ code: 'y = a &' }), /line 1/);
  assert.match(why({ ins: Array.from({ length: 9 }, (_, i) => 'i' + i) }), /1 to 8 input/);
  assert.match(why({ project: 'vote', code: 'y = a & b;' }), /specification/);
  assert.match(why({ clocked: true, code: 'reg y = y ^ a;' }), /tests/);
  assert.equal(check({ ...ok, clocked: true, code: 'reg y = y ^ a;', tests: { a: [1, 0, 1, 1], b: [0, 0, 0, 0] } }).ok, true);
  const many = Array.from({ length: LIMITS.designs + 1 }, (_, i) => ({ ...ok, slug: 'd-' + String(i).padStart(2, '0') }));
  assert.match(checkAll(many).problems.join(' '), /at most 32/);
});

test('the chip puts every design behind the selector, with clock and reset only when needed', () => {
  const { designs } = checkAll(loadDesigns().list);
  const v = chipVerilog(designs);
  assert.equal((v.match(/^module /gm) || []).length, designs.length + 1);
  designs.forEach((x, k) => { assert.ok(v.includes("5'd" + k + ': out = o' + k + ';')); assert.ok(v.includes('module d_' + x.d.slug.replace(/-/g, '_') + ' (')); });
  assert.ok(v.includes('wire [4:0] sel = uio_in[4:0];'));
  assert.ok(/\.clk\(clk\)/.test(v) === designs.some(x => x.r.spec.seq));
  const names = chipFiles(designs).map(f => f[0]);
  assert.deepEqual(names, ['src/project.v', 'info.yaml', 'test/test.py', 'test/tb.v', 'docs/info.md']);
});

test('the chip\'s expected outputs match each design simulated as gates', () => {
  const { designs } = checkAll(loadDesigns().list);
  chipCases(designs).forEach((c, k) => {
    const s = designs[k].r.spec, M = designs[k].r.M, V = TC.testVectors(s), { ins, outs } = pinOrder(s);
    assert.equal(c.cases.length, V.length, s.id + ': one case per test pattern');
    let st = {};
    V.forEach((v, i) => {
      const r = TC.simCells(M, v, null, st); st = r.next;
      const ui = ins.reduce((a, n, b) => a | (v[n] << b), 0), uo = outs.reduce((a, n, b) => a | ((r.out[n] & 1) << b), 0);
      assert.deepEqual(c.cases[i], { ui, uo }, s.id + ' case ' + i);
    });
  });
});

test('a design file from the studio is valid and keeps the order of its fields', () => {
  const txt = designFile({ slug: 'my-adder', title: 'My adder', author: 'Ada', project: 'full', code: TC.PROJ.find(p => p.id === 'full').sol }, '2026-11-02');
  const d = { ...JSON.parse(txt), slug: 'my-adder' };
  assert.equal(check(d).ok, true);
  assert.deepEqual(Object.keys(JSON.parse(txt)), ['title', 'author', 'added', 'project', 'code']);
});
