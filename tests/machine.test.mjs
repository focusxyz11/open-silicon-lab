// Machines from shared blocks (src/data/blocks.js, src/engines/machine.js) and the kinds of new matter beyond today's
// chip (src/data/inventions.js): the grammar holds, the forms cost what their sources say, every claim says how sure it
// is, physics sets the floor, and the agent offers only machines that pass and that nothing beats.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { BLOCKS, NEEDS, PORTS, FORMS, blockOf, needOf } from '../src/data/blocks.js';
import { MATTERS, STATUS, KINDS, ACTIVITY } from '../src/data/inventions.js';
import * as M from '../src/engines/machine.js';
import { E16 } from '../src/engines/paradigms.js';
import { landauer, bitsErased, T_ROOM } from '../src/engines/floor.js';
import { ENVIRONMENT_IDS } from '../src/engines/errors.js';
import { NEEDS as PLAN_NEEDS } from '../src/data/build.js';
import { plan as buildPlan } from '../src/engines/build.js';

const root = new URL('..', import.meta.url);
const facts = JSON.parse(readFileSync(new URL('src/data/facts.json', root), 'utf8')).facts;
const factOf = id => facts.find(f => f.id === id);
const clone = o => JSON.parse(JSON.stringify(o));

test('blocks: known ports and forms, each checked by a piece of the plan or a lab', () => {
  for (const b of BLOCKS) {
    [...b.in, ...b.out].forEach(k => assert.ok(PORTS.includes(k), b.id + ' port ' + k));
    assert.ok(b.forms.length && b.forms.every(f => FORMS.includes(f) && f !== 'matter'), b.id + ' forms (new matter comes from src/data/inventions.js)');
    assert.ok(b.need || b.lab, b.id + ' needs a check');
    if (b.need) assert.ok(PLAN_NEEDS.some(n => n.id === b.need), b.id + ' names a need the plan does not have: ' + b.need);
  }
  assert.ok(BLOCKS.some(b => b.runs && b.forms.includes('circuit')), 'something can run software');
});

test('needs: real blocks, unique parts, a place from the errors engine, an activity, rules on their own parts', () => {
  for (const n of NEEDS) {
    const ids = n.parts.map(p => p.id);
    assert.equal(new Set(ids).size, ids.length, n.id + ' parts are unique');
    n.parts.forEach(p => { assert.ok(blockOf(p.block), n.id + '.' + p.id); assert.ok(p.work > 0); });
    assert.ok(ENVIRONMENT_IDS.includes(n.env), n.id + ' env');
    assert.ok(n.activity in ACTIVITY, n.id + ' activity');
    [...n.change, ...n.exact].forEach(id => assert.ok(ids.includes(id), n.id + ' rule on ' + id));
  }
});

test('kinds of new matter: real blocks, and every claim says how sure it is and what it rests on', () => {
  for (const m of MATTERS) {
    assert.ok(m.on.length && m.on.every(id => blockOf(id)), m.id + ' is made into real blocks');
    assert.ok(m.floor === 'op' || (Number.isInteger(m.floor) && m.floor > 0), m.id + ' floor');
    assert.ok(m.claims.some(c => c.kind === 'gain'), m.id + ' claims a gain');
    for (const c of m.claims) {
      assert.ok(STATUS.includes(c.status) && KINDS.includes(c.kind), c.id);
      if (c.kind === 'note') assert.equal(c.energy, undefined, c.id + ': a note changes no number');
      else assert.ok(typeof c.energy === 'number' ? c.energy >= 0 : ['cim', 'activity'].includes(c.energy), c.id + ' energy');
      if (c.status !== 'guess') assert.ok(c.fact || c.engine, c.id + ': what is not a guess rests on a source or an engine');
      if (c.fact) assert.ok(factOf(c.fact), c.id + ' names a fact facts.json does not have: ' + c.fact);
      if (c.engine) assert.ok(existsSync(new URL(c.engine, root)), c.id + ' names a file that does not exist: ' + c.engine);
    }
  }
  assert.ok(MATTERS.some(m => m.exact) && MATTERS.some(m => !m.exact), 'some matter is exact, some is not');
});

test('every machine starts out following the grammar', () => {
  for (const n of NEEDS) assert.deepEqual(M.machine(n.id).check.breaks, [], n.id);
});

test('the cost of the forms comes from their sources and points the right way', () => {
  const f = factOf('asic-vs-cpu');
  assert.ok(f && /500/.test(f.value), 'facts.json asic-vs-cpu holds the 500×');
  const c = k => M.costOf(k, needOf('hearing'));
  assert.equal(c('software').high, 500);
  assert.equal(c('circuit').high, 1);
  assert.ok(c('matter:cim').high < 1 && c('matter:cim').low === c('matter:cim').high, 'in memory rests on no guess');
  assert.ok(factOf('vaire-ice-river') && /1\.41/.test(factOf('vaire-ice-river').value));
  assert.ok(Math.abs(c('matter:reversible').high - 1 / 1.41) < 1e-9, 'reversible, guesses failing: the test chip\'s recovery');
  for (const m of MATTERS) for (const n of NEEDS) { const r = M.costOf('matter:' + m.id, n); assert.ok(r.low <= r.high, m.id + ' ' + n.id + ' range'); }
  assert.ok(M.changes('software') && !M.changes('circuit') && M.exact('circuit'));
});

test('the floor: no claim goes below erasing its bits, and a guess of nothing stops there', () => {
  const op = bitsErased(16) * landauer(T_ROOM) * 1e12 / (E16.add + E16.mul);
  assert.ok(Math.abs(M.floorOf({ floor: 'op' }) - op) / op < 1e-12);
  const r = M.costOf('matter:reversible', needOf('wildfire'));
  assert.equal(r.wall, true, 'the guess of nothing hits the floor');
  assert.equal(r.low, M.floorOf(MATTERS.find(m => m.id === 'reversible')));
  for (const m of MATTERS) assert.ok(M.costOf('matter:' + m.id, needOf('rover')).low >= M.floorOf(m));
  assert.ok(M.machine('wildfire', { check: 'matter:reversible' }).score.walls.includes('check'));
});

test('spikes cost little when the need is quiet', () => {
  assert.ok(M.costOf('matter:spikes', needOf('wildfire')).high < M.costOf('matter:spikes', needOf('hearing')).high);
});

test('the grammar catches a missing form, a wrong kind, an unfed input and software with nothing to run on', () => {
  const need = needOf('wildfire'), plan = M.startPlan('wildfire');
  assert.ok(M.check(need, Object.assign({}, plan, { smoke: 'software' })).breaks.some(b => b.rule === 'form' && b.part === 'smoke'));
  assert.ok(M.check(need, Object.assign({}, plan, { smoke: 'matter:light' })).breaks.some(b => b.rule === 'form' && b.part === 'smoke'), 'a sensor cannot be made of light here');
  const kind = clone(need); kind.wires.push(['check.out0', 'detect.in0']);
  assert.ok(M.check(kind, plan).breaks.some(b => b.rule === 'kind'));
  const unfed = clone(need); unfed.wires = unfed.wires.filter(([, to]) => to !== 'check.in0');
  assert.ok(M.check(unfed, plan).breaks.some(b => b.rule === 'fed' && b.port === 'check.in0'));
  const nocore = clone(need); nocore.parts = nocore.parts.filter(p => p.id !== 'ctl'); nocore.wires = nocore.wires.filter(([f, t]) => !/^ctl\./.test(f) && !/^ctl\./.test(t));
  assert.ok(M.check(nocore, Object.assign({}, plan, { clock: 'software' })).breaks.some(b => b.rule === 'core' && b.part === 'clock'));
  assert.equal(M.check(nocore, plan).ok, true, 'without software, no core is needed');
});

test('a need\'s rules: what must change cannot be fixed, what must be exact cannot be approximate', () => {
  assert.ok(M.machine('hearing').meets.misses.some(m => m.rule === 'change' && m.part === 'filter'));
  assert.equal(M.machine('hearing', { filter: 'software' }).ok, true);
  assert.equal(M.machine('rover', { nav: 'matter' }).ok, true, '"matter" alone is in memory');
  assert.equal(M.machine('rover', { nav: 'matter:light' }).ok, true);
  assert.equal(M.machine('rover', { vote: 'matter:reversible' }).meets.ok, false, 'the rover\'s guide must still change');
  assert.equal(M.machine('rover', { nav: 'matter:cim', vote: 'matter:reversible' }).ok, true, 'reversible logic is exact');
  const r = needOf('rover');
  assert.ok(M.meets(r, Object.assign(M.startPlan('rover'), { nav: 'matter:cim', ctl: 'matter:cim' })).misses.some(m => m.rule === 'exact' && m.part === 'ctl'));
});

test('score: all circuits is the yardstick; software costs more, new matter can cost less', () => {
  for (const n of NEEDS) {
    const s = M.machine(n.id).score;
    assert.equal(s.energy, 1, n.id); assert.equal(s.low, 1); assert.equal(s.high, 1);
    assert.equal(s.changes, 0); assert.equal(s.exact, n.parts.length);
  }
  assert.ok(M.machine('wildfire', { clock: 'software' }).score.energy > 1);
  assert.ok(M.machine('wildfire', { detect: 'matter:cim' }).score.energy < 1);
  const living = M.machine('wildfire', { detect: 'matter:living' }).score;
  assert.ok(living.low < 1 && living.high > 1, 'living neurons: cheaper if the guesses hold, far dearer if they fail');
  assert.equal(M.machine('wildfire', { detect: 'matter:living' }, true).score.energy, living.low);
});

test('the agent tries every plan and offers only machines that pass and that nothing beats, cheapest first', () => {
  for (const guesses of [false, true]) for (const n of NEEDS) {
    const A = M.assemble(n.id, 99, guesses), every = n.parts.reduce((k, p) => k * M.formsOf(p.block).length, 1);
    assert.equal(A.tried, every, n.id + ' tried every plan');
    assert.ok(A.picks.length >= 2, n.id + ' offers a real choice');
    assert.equal(A.picks.length, A.front);
    A.picks.forEach(p => assert.ok(M.machine(n.id, p.plan).ok, n.id + ' pick passes'));
    A.picks.forEach(a => A.picks.forEach(b => assert.ok(a === b || !M.beats(a.score, b.score), n.id + ' no pick beats another')));
    for (let i = 1; i < A.picks.length; i++) assert.ok(A.picks[i - 1].score.energy <= A.picks[i].score.energy);
  }
  /* the hearing aid's filter must change: counting only what is shown, exact and costly or in memory and approximate;
     counting guesses, living neurons come first, with a range that shows the gamble */
  assert.deepEqual(M.assemble('hearing').picks.map(p => p.plan.filter).sort(), ['matter:cim', 'software']);
  const g = M.assemble('hearing', 4, true).picks[0];
  assert.equal(g.plan.filter, 'matter:living');
  assert.ok(g.score.high > 1);
  assert.ok(M.assemble('wildfire', 2).picks.length <= 2);
});

test('a block is checked by its piece of the plan, or by a lab', () => {
  const P = buildPlan();
  BLOCKS.forEach(b => { const c = M.checkOf(b.id, P); assert.ok(c); if (b.need) assert.ok(['built', 'open', 'partly', 'engine'].includes(c.state), b.id); else assert.equal(c.state, 'lab'); });
  assert.equal(M.checkOf('nope'), null);
});
