// Machines from shared blocks (src/data/blocks.js, src/engines/machine.js): the grammar holds, the forms cost what
// their sources say, and the agent offers only machines that pass and that nothing beats.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BLOCKS, NEEDS, PORTS, FORMS, blockOf, needOf } from '../src/data/blocks.js';
import * as M from '../src/engines/machine.js';
import { ENVIRONMENT_IDS } from '../src/engines/errors.js';
import { NEEDS as PLAN_NEEDS } from '../src/data/build.js';
import { plan as buildPlan } from '../src/engines/build.js';

const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8'));
const factList = Array.isArray(facts) ? facts : facts.facts || Object.values(facts);
const clone = o => JSON.parse(JSON.stringify(o));

test('blocks: known ports and forms, each checked by a piece of the plan or a lab', () => {
  for (const b of BLOCKS) {
    [...b.in, ...b.out].forEach(k => assert.ok(PORTS.includes(k), b.id + ' port ' + k));
    assert.ok(b.forms.length && b.forms.every(f => FORMS.includes(f)), b.id + ' forms');
    assert.ok(b.need || b.lab, b.id + ' needs a check');
    if (b.need) assert.ok(PLAN_NEEDS.some(n => n.id === b.need), b.id + ' names a need the plan does not have: ' + b.need);
  }
  assert.ok(BLOCKS.some(b => b.runs && b.forms.includes('circuit')), 'something can run software');
  assert.deepEqual(BLOCKS.filter(b => b.forms.includes('matter')).map(b => b.id), ['learner'], 'only a learner holds its numbers where they are multiplied');
});

test('needs: real blocks, unique parts, a place from the errors engine, rules on their own parts', () => {
  for (const n of NEEDS) {
    const ids = n.parts.map(p => p.id);
    assert.equal(new Set(ids).size, ids.length, n.id + ' parts are unique');
    n.parts.forEach(p => { assert.ok(blockOf(p.block), n.id + '.' + p.id); assert.ok(p.work > 0); });
    assert.ok(ENVIRONMENT_IDS.includes(n.env), n.id + ' env');
    [...n.change, ...n.exact].forEach(id => assert.ok(ids.includes(id), n.id + ' rule on ' + id));
  }
});

test('every machine starts out following the grammar', () => {
  for (const n of NEEDS) assert.deepEqual(M.machine(n.id).check.breaks, [], n.id);
});

test('the cost of the forms comes from their sources and points the right way', () => {
  const f = factList.find(x => x.id === 'asic-vs-cpu');
  assert.ok(f && /500/.test(f.value), 'facts.json asic-vs-cpu holds the 500×');
  assert.equal(M.SOFTWARE_COST, 500);
  assert.ok(M.COST.software > M.COST.circuit && M.COST.circuit > M.COST.matter && M.COST.matter > 0);
  assert.ok(M.CHANGES.software && !M.CHANGES.circuit && M.CHANGES.matter);
  assert.ok(M.EXACT.software && M.EXACT.circuit && !M.EXACT.matter);
});

test('the grammar catches a missing form, a wrong kind, an unfed input and software with nothing to run on', () => {
  const need = needOf('wildfire'), plan = M.startPlan('wildfire');
  assert.ok(M.check(need, Object.assign({}, plan, { smoke: 'software' })).breaks.some(b => b.rule === 'form' && b.part === 'smoke'));
  const kind = clone(need); kind.wires.push(['check.out0', 'detect.in0']);
  assert.ok(M.check(kind, plan).breaks.some(b => b.rule === 'kind'));
  const unfed = clone(need); unfed.wires = unfed.wires.filter(([, to]) => to !== 'check.in0');
  assert.ok(M.check(unfed, plan).breaks.some(b => b.rule === 'fed' && b.port === 'check.in0'));
  const nocore = clone(need); nocore.parts = nocore.parts.filter(p => p.id !== 'ctl'); nocore.wires = nocore.wires.filter(([f, t]) => !/^ctl\./.test(f) && !/^ctl\./.test(t));
  assert.ok(M.check(nocore, Object.assign({}, plan, { clock: 'software' })).breaks.some(b => b.rule === 'core' && b.part === 'clock'));
  assert.equal(M.check(nocore, plan).ok, true, 'without software, no core is needed');
});

test('a need\'s rules: what must change cannot be a circuit, what must be exact cannot be new matter', () => {
  assert.ok(M.machine('hearing').meets.misses.some(m => m.rule === 'change' && m.part === 'filter'));
  assert.equal(M.machine('hearing', { filter: 'software' }).ok, true);
  assert.equal(M.machine('rover', { nav: 'matter' }).ok, true);
  const r = needOf('rover');
  assert.ok(M.meets(r, Object.assign(M.startPlan('rover'), { nav: 'matter', ctl: 'matter' })).misses.some(m => m.rule === 'exact' && m.part === 'ctl'));
});

test('score: all circuits is the yardstick; software costs more, a learner as new matter less', () => {
  for (const n of NEEDS) {
    const s = M.machine(n.id).score;
    assert.equal(s.energy, 1, n.id);
    assert.equal(s.changes, 0); assert.equal(s.exact, n.parts.length);
  }
  assert.ok(M.machine('wildfire', { clock: 'software' }).score.energy > 1);
  assert.ok(M.machine('wildfire', { detect: 'matter' }).score.energy < 1);
});

test('the agent tries every plan and offers only machines that pass and that nothing beats, cheapest first', () => {
  for (const n of NEEDS) {
    const A = M.assemble(n.id, 99), every = n.parts.reduce((k, p) => k * blockOf(p.block).forms.length, 1);
    assert.equal(A.tried, every, n.id + ' tried every plan');
    assert.ok(A.picks.length >= 2, n.id + ' offers a real choice');
    assert.equal(A.picks.length, A.front);
    A.picks.forEach(p => { const m = M.machine(n.id, p.plan); assert.ok(m.ok, n.id + ' pick passes'); });
    A.picks.forEach(a => A.picks.forEach(b => assert.ok(a === b || !M.beats(a.score, b.score), n.id + ' no pick beats another')));
    for (let i = 1; i < A.picks.length; i++) assert.ok(A.picks[i - 1].score.energy <= A.picks[i].score.energy);
  }
  /* the hearing aid's filter must change: exact and costly, or cheap and approximate; the person decides */
  const H = M.assemble('hearing').picks.map(p => p.plan.filter).sort();
  assert.deepEqual(H, ['matter', 'software']);
  assert.ok(M.assemble('wildfire', 2).picks.length <= 2);
});

test('a block is checked by its piece of the plan, or by a lab', () => {
  const P = buildPlan();
  BLOCKS.forEach(b => { const c = M.checkOf(b.id, P); assert.ok(c); if (b.need) assert.ok(['built', 'open', 'partly', 'engine'].includes(c.state), b.id); else assert.equal(c.state, 'lab'); });
  assert.equal(M.checkOf('nope'), null);
});
