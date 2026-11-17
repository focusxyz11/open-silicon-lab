// Verify the agent (src/data/agent.js): every flawed proposal really is flawed, every sound one really works, and
// each case's tool shows the truth. Brought over from the first version with its tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CASES, SKILLS, tinyCheck, asmRun, sumRun, poissonYield, decodeTime, score, checkAgent, normalAgent, caseOf } from '../src/data/agent.js';

const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf8'));
const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8'));
const C = caseOf;

test('every case is complete: its words, a real skill, four reasons, and some proposals are right', () => {
  for (const c of CASES) {
    assert.ok(['flawed', 'sound'].includes(c.truth), c.id);
    assert.ok(SKILLS.includes(c.skill), c.id + ' skill');
    ['t', 'ask', 'says', 'why', 'r0', 'r1', 'r2', 'r3'].forEach(k => assert.ok(EN['agent.case.' + c.id + '.' + k], c.id + '.' + k));
    assert.ok(EN['agent.area.' + c.area], c.id + ' area');
    assert.ok(c.right >= 0 && c.right < 4);
    if (c.truth === 'sound') assert.match(EN['agent.case.' + c.id + '.r' + c.right], /^Nothing/);
    else assert.doesNotMatch(EN['agent.case.' + c.id + '.r' + c.right], /^Nothing/);
  }
  SKILLS.forEach(s => assert.ok(EN['agent.skill.' + s + '.t'] && EN['agent.skill.' + s + '.d']));
  assert.ok(CASES.filter(c => c.truth === 'sound').length >= 2, 'some proposals are right, so rejecting everything does not win');
});

test('the equality checker is wrong, and the agent\'s own two tests pass', () => {
  const a = C('eq').art, r = tinyCheck(a.code, a.ins, a.outs, a.f);
  assert.ok(r.bad.length > 0);
  for (const k of a.tested) { const v = Object.fromEntries(a.ins.map((n, i) => [n, +k[i]])); assert.ok(r.rows.find(x => a.ins.every(n => x.v[n] === v[n])).ok, k); }
  assert.equal(tinyCheck(a.code.replace('m1 | m0', 'm1 & m0'), a.ins, a.outs, a.f).bad.length, 0, 'the fix works');
});

test('the 4-gate majority voter is right; the "fully verified" one fails the pattern nobody tried', () => {
  const m = C('maj').art; assert.equal(tinyCheck(m.code, m.ins, m.outs, m.f).bad.length, 0);
  const c = C('cov').art, r = tinyCheck(c.code, c.ins, c.outs, c.f), key = row => c.ins.map(n => row.v[n]).join('');
  assert.ok(r.rows.filter(x => c.tested.includes(key(x))).every(x => x.ok), 'every tested pattern passes');
  assert.deepEqual(r.bad.map(key), ['101']);
});

test('the array sum works for N = 4 and fails for N = 0', () => {
  const a = C('sum').art;
  assert.ok(sumRun(a.code, a.data, 4).ok);
  const bad = sumRun(a.code, a.data, 0); assert.ok(!bad.ok);
});

test('shift-and-add multiplication is right for every tried input, B = 0 and a million included', () => {
  const a = C('mul').art;
  for (const [x, y] of [[13, 11], [7, 0], [0, 9], [250, 31], [1000, 1000], [1, 1]]) { const r = asmRun(a.code, [x, y], 0x1000); assert.equal(r.err, null); assert.equal(r.a0, x * y, x + '×' + y); }
});

test('the yield claim mixes units (about 45%, not 0%); one user waits on memory, so twice the compute barely helps', () => {
  assert.ok(Math.abs(poissonYield(800, 0.1) - 0.449) < 0.01);
  assert.ok(Math.exp(-800 * 0.1) < 1e-30);
  const a = C('roof').art, one = decodeTime(a.params, a.bytes, a.bw, a.pf), two = decodeTime(a.params, a.bytes, a.bw, a.pf * 2);
  assert.equal(one.bound, 'memory'); assert.ok(one.t / two.t < 1.01);
});

test('the confident date is not what the dated facts say', () => {
  const f = facts.facts.find(x => x.id === C('fact').art.fact); assert.ok(f, 'the fact exists'); assert.match(f.value, /2028/);
  assert.doesNotMatch(EN['agent.case.fact.says'], /2028/);
});

test('scoring: a sound proposal wants trust, a flawed one a rejection for its real flaw; the challenge wants all eight', () => {
  assert.ok(score(C('maj'), 'trust').ok); assert.ok(!score(C('maj'), 'reject', 0).ok);
  assert.ok(score(C('eq'), 'reject', 0).ok); assert.ok(!score(C('eq'), 'reject', 1).ok); assert.ok(!score(C('eq'), 'trust').ok);
  const all = Object.fromEntries(CASES.map(c => [c.id, c.truth === 'sound' ? { decision: 'trust' } : { decision: 'reject', reason: c.right }]));
  assert.ok(checkAgent(all).ok); assert.equal(checkAgent({}).done, 0);
  const noTrust = Object.fromEntries(CASES.map(c => [c.id, { decision: 'reject', reason: c.right }])); assert.ok(!checkAgent(noTrust).ok, 'rejecting everything does not win');
  assert.deepEqual(normalAgent({ eq: { decision: 'reject', reason: 9 }, x: {} }), { eq: { decision: 'reject', reason: null } });
});
