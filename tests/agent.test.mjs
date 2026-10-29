// Design alongside an AI agent: every flawed proposal really is flawed, every sound one really
// works, and the tools in each case reveal the truth.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import TC from '../src/engines/tinychip.js';
import { CASES, SKILLS, tinyCheck, asmRun, poissonYield, decodeTime, score, livePrompt, extractCode } from '../src/data/agent-cases.js';
import { TOPICS } from '../src/data/topics.js';

const C = id => CASES.find(c => c.id === id);
const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url)));

test('every case is complete and points at real topics and skills', () => {
  const ids = new Set(TOPICS.map(t => t.id));
  for (const c of CASES) {
    assert.ok(['flawed', 'sound'].includes(c.truth), c.id);
    assert.ok(SKILLS[c.skill], c.id + ' skill');
    assert.ok(ids.has(c.topic), c.id + ' topic');
    assert.equal(c.reasons.length, 4);
    assert.ok(c.right >= 0 && c.right < 4);
    if (c.truth === 'sound') assert.match(c.reasons[c.right], /^Nothing/);
    else assert.doesNotMatch(c.reasons[c.right], /^Nothing/);
  }
  assert.ok(CASES.filter(c => c.truth === 'sound').length >= 2, 'some proposals are right, so blind rejection does not win');
});

test('the equality checker is wrong, and the agent\'s own two tests pass', () => {
  const a = C('eq').art; const r = tinyCheck(a.code, a.ins, a.outs, a.f);
  assert.ok(r.bad.length > 0);
  const row = v => r.rows.find(x => a.ins.every(n => x.v[n] === v[n]));
  assert.ok(row({ a1: 0, a0: 0, b1: 0, b0: 0 }).ok && row({ a1: 1, a0: 1, b1: 1, b0: 1 }).ok);
  assert.ok(tinyCheck(a.code.replace('m1 | m0', 'm1 & m0'), a.ins, a.outs, a.f).bad.length === 0, 'the fix works');
});

test('the 4-gate majority voter is right', () => {
  const a = C('maj').art; assert.equal(tinyCheck(a.code, a.ins, a.outs, a.f).bad.length, 0);
});

test('the array sum works for N = 4 and fails for N = 0', () => {
  const a = C('sum').art; const nAt = n => mm => RV_store(mm, n);
  const RV_store = (mm, n) => { mm.mem[0x1100] = n & 255; mm.mem[0x1101] = 0; mm.mem[0x1102] = 0; mm.mem[0x1103] = 0; };
  const ok = asmRun(a.code, a.data, 0x1000, nAt(4));
  assert.equal(ok.err, null); assert.equal(ok.a0, 7 - 2 + 30 + 5);
  const bad = asmRun(a.code, a.data, 0x1000, nAt(0));
  assert.ok(bad.err || bad.a0 !== 0, 'N = 0 does not give 0');
});

test('shift-and-add multiplication is right for every tested input', () => {
  const a = C('mul').art;
  for (const [x, y] of [[13, 11], [7, 0], [0, 9], [250, 31], [1000, 1000], [1, 1]]) {
    const r = asmRun(a.code, [x, y], 0x1000); assert.equal(r.err, null); assert.equal(r.a0, x * y, x + '×' + y);
  }
});

test('the yield claim mixes units; the right answer is about 45%', () => {
  assert.ok(Math.abs(poissonYield(800, 0.1) - 0.449) < 0.01);
  assert.ok(Math.exp(-800 * 0.1) < 1e-30);
});

test('single-user decode is memory-bound, so 2× compute barely helps', () => {
  const a = C('roof').art; const t1 = decodeTime(a.params, a.bytes, a.bw, a.pf), t2 = decodeTime(a.params, a.bytes, a.bw, a.pf * 2);
  assert.equal(t1.bound, 'memory'); assert.ok(t1.t / t2.t < 1.01);
});

test('the A14 claim contradicts the dated fact', () => {
  const f = facts.facts.find(x => x.id === C('fact').art.fact);
  assert.ok(f); assert.match(f.value, /2028/);
});

test('the coverage case: the untested pattern fails', () => {
  const a = C('cov').art; const r = tinyCheck(a.code, a.ins, a.outs, a.f);
  const key = v => a.ins.map(n => v[n]).join('');
  assert.ok(r.bad.every(x => !a.tested.includes(key(x.v))), 'every failing pattern is untested');
  assert.ok(r.bad.some(x => key(x.v) === '101'));
  assert.ok(r.rows.filter(x => a.tested.includes(key(x.v))).every(x => x.ok), 'the agent\'s tests really pass');
});

test('scoring rewards the right call and the right reason', () => {
  assert.equal(score(C('eq'), 'reject', 0).points, 2);
  assert.equal(score(C('eq'), 'reject', 1).points, 1);
  assert.equal(score(C('eq'), 'trust').points, 0);
  assert.equal(score(C('maj'), 'trust').points, 1);
  assert.equal(score(C('maj'), 'reject', 0).points, 0);
});

test('live agent prompt and reply parsing', () => {
  const p = TC.PROJ.find(x => x.id === 'full');
  assert.ok(livePrompt(p).includes('a=1 b=1 cin=1 → sum=1 cout=1'));
  for (const q of TC.PROJ.filter(x => x.f)) assert.doesNotMatch(livePrompt(q), /bug|starting code/i, q.id);
  assert.equal(extractCode('Sure!\n```\nsum = a ^ b ^ cin;\ncout = (a & b) | (cin & (a ^ b));\n```\nIt works.'), 'sum = a ^ b ^ cin;\ncout = (a & b) | (cin & (a ^ b));');
  assert.equal(extractCode('sum = a ^ b;\nThis is why.'), 'sum = a ^ b;');
});
