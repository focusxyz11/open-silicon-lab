// Machines from shared blocks (src/data/blocks.js, src/engines/machine.js) and the kinds of new matter beyond today's
// chip (src/data/inventions.js): the grammar holds, the forms cost what their sources say, every claim says how sure it
// is, physics sets the floor, and the agent offers only machines that pass and that nothing beats.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { BLOCKS, NEEDS, PORTS, FORMS, GOALS, blockOf, needOf } from '../src/data/blocks.js';
import { MATTERS, STATUS, KINDS, ACTIVITY } from '../src/data/inventions.js';
import { FABS, TRY_DAYS, YEAR, fabOf } from '../src/data/fabs.js';
import { LIQUIDS, ON as LIQUID_ON, RESHAPE, FALLBACK } from '../src/data/liquid.js';
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
    const A = M.assemble(n.id, 99, guesses), every = n.parts.reduce((k, p) => k * M.formsOf(p.block).length, FABS.length);
    assert.equal(A.tried, every, n.id + ' tried every plan in every fab');
    assert.ok(A.picks.length >= 2, n.id + ' offers a real choice');
    assert.equal(A.picks.length, A.front);
    A.picks.forEach(p => assert.ok(M.machine(n.id, p.plan, guesses).ok, n.id + ' pick passes'));
    A.picks.forEach(a => A.picks.forEach(b => assert.ok(a === b || !M.beats(a.score, b.score), n.id + ' no pick beats another')));
    for (let i = 1; i < A.picks.length; i++) assert.ok(A.picks[i - 1].score.energy <= A.picks[i].score.energy);
  }
  /* the hearing aid's filter must change: counting only what is shown, a fabric rewired after it is made (exact, about
     14 times a circuit, a try a day) or in memory and approximate (cheap, but months a try);
     counting guesses, living neurons come first, with a range that shows the gamble */
  assert.deepEqual(M.assemble('hearing').picks.map(p => p.plan.filter).sort(), ['liquid:fpga', 'matter:cim']);
  const g = M.assemble('hearing', 4, true).picks[0];
  assert.equal(g.plan.filter, 'matter:living');
  assert.ok(g.score.high > 1);
  assert.ok(M.assemble('wildfire', 2).picks.length <= 2);
});

test('fabs: every place makes circuits, says how sure its days are, and rests on a source', () => {
  const kinds = ['days', 'cost', 'note'];
  for (const F of FABS) {
    assert.ok(F.makes.includes('circuit'), F.id + ' makes circuits');
    F.makes.forEach(f => assert.ok(f === 'circuit' || MATTERS.some(m => 'matter:' + m.id === f && !m.grown), F.id + ' makes ' + f));
    assert.equal(F.claims.filter(c => c.kind === 'days').length, 1, F.id + ' has one claim about days');
    F.claims.forEach(c => {
      assert.ok(STATUS.includes(c.status) && kinds.includes(c.kind), F.id + '.' + c.id);
      if (c.fact) assert.ok(factOf(c.fact) && factOf(c.fact).url, F.id + '.' + c.id + ' rests on ' + c.fact);
      if (c.status !== 'guess' && c.kind !== 'note' && c.id !== 'giantCost') assert.ok(c.fact, F.id + '.' + c.id + ': a number shown in a product or a lab needs its source');
      if (c.kind === 'days') assert.ok(c.value[0] >= 1 && c.value[0] <= c.value[1], F.id + ' days');
    });
  }
  assert.ok(MATTERS.filter(m => m.grown).every(m => !FABS.some(F => F.makes.includes('matter:' + m.id))), 'grown matter is made in no fab');
  /* the giant fab takes months; a flexible line, shown in products, days */
  assert.ok(M.daysOf('flexible').high < M.daysOf('giant').low / 10);
  /* a guess about days, if it fails, leaves them unknown */
  assert.equal(M.daysOf('desk').high, Infinity);
  assert.ok(M.daysOf('desk').low <= M.daysOf('flexible').low);
});

test('a try: software and bought parts take a day; made parts wait on their fab; grown parts on nobody knows', () => {
  const H = needOf('hearing');
  assert.deepEqual(M.made(H, M.startPlan('hearing')), ['filter'], 'the mic, the memory and the core are bought');
  assert.deepEqual(M.tryDays(H, Object.assign(M.startPlan('hearing'), { filter: 'software' })), { low: TRY_DAYS, high: TRY_DAYS });
  const giant = M.machine('hearing', { filter: 'matter:cim' }).score;
  assert.equal(giant.fab, 'giant');
  assert.ok(giant.days > 100 && giant.tries < 3);
  const flex = M.machine('rover', { nav: 'software', fab: 'flexible' });
  assert.equal(flex.ok, true);
  assert.equal(flex.score.tries, YEAR / M.daysOf('flexible').high);
  assert.equal(M.machine('hearing', { filter: 'matter:living' }).score.days, Infinity);
  assert.equal(M.machine('hearing', { filter: 'software' }).score.fab, null, 'nothing to make: no fab');
});

test('the rule fab: a place makes only what it makes; software, bought and grown parts are never stopped by it', () => {
  const W = M.machine('wildfire', { detect: 'matter:cim', fab: 'desk' });
  assert.ok(W.check.breaks.some(b => b.rule === 'fab' && b.part === 'detect'));
  assert.ok(!W.check.breaks.some(b => b.rule === 'fab' && b.part === 'smoke'), 'the smoke sensor is bought');
  assert.equal(M.machine('wildfire', { detect: 'matter:living', fab: 'desk' }).check.ok, true, 'living matter is grown');
  assert.equal(M.machine('wildfire', { fab: 'desk' }).check.ok, true);
  assert.equal(M.machine('wildfire', { fab: 'nowhere' }).check.ok, false);
  assert.ok(M.RULES.includes('fab'));
});

test('the agent weighs days too: a fast fab stays on the frontier beside the cheapest machine', () => {
  const picks = M.assemble('wildfire', 99).picks;
  assert.ok(picks.some(p => p.score.fab === 'flexible'), 'a flexible line, fast and shown in products');
  assert.ok(!picks.some(p => p.score.fab === 'desk' || p.score.fab === 'small'), 'days that are only guessed count as never unless guesses count');
  assert.ok(M.assemble('wildfire', 99, true).picks.some(p => p.score.fab === 'desk'));
});

test('liquid fabrics: real blocks, every number says how sure it is, and a shown number rests on a source', () => {
  LIQUID_ON.forEach(id => { assert.ok(blockOf(id), id); assert.ok(!blockOf(id).stock, id + ' is logic, not a bought part'); });
  for (const L of LIQUIDS) {
    for (const k of ['energy', 'reshape']) {
      const c = L[k];
      assert.ok(STATUS.includes(c.status), L.id + '.' + k);
      if (c.status !== 'guess') assert.ok(c.fact && factOf(c.fact) && factOf(c.fact).url, L.id + '.' + k + ' rests on a source');
    }
    assert.ok(L.energy.value >= 1, L.id + ': no fabric beats a circuit made for the job');
    assert.ok(L.reshape.value[0] > 0 && L.reshape.value[0] <= L.reshape.value[1]);
    L.notes.forEach(n => { assert.ok(STATUS.includes(n.status)); if (n.fact) assert.ok(factOf(n.fact), n.id); });
  }
  assert.equal(LIQUIDS.find(l => l.id === FALLBACK).energy.status, 'product', 'a failed guess falls back to what is in products');
});

test('a liquid part: exact like a circuit, changes like software, bought and configured, not made in a fab', () => {
  const H = needOf('hearing'), f = 'liquid:fpga';
  assert.ok(M.formsOf('learner').includes(f) && !M.formsOf('sensor').includes(f));
  assert.equal(M.changes(f), true); assert.equal(M.exact(f), true);
  assert.deepEqual(M.costOf(f, H), { low: 14, high: 14, wall: false });
  assert.equal(M.machine('hearing', { filter: f }).ok, true);
  assert.deepEqual(M.made(H, Object.assign(M.startPlan('hearing'), { filter: f })), []);
  assert.equal(M.machine('hearing', { filter: f }).score.days, TRY_DAYS, 'a try is a new configuration, a day');
  /* a guessed fabric: as hoped if the guesses hold, no better than an FPGA if they fail */
  const g = M.costOf('liquid:goal', H);
  assert.ok(g.low < 2 && g.high === 14);
  assert.ok(M.reshapeOf('liquid:goal').high > M.reshapeOf('liquid:goal').low);
  assert.equal(M.reshapeOf('circuit').high, Infinity);
  assert.equal(M.reshapeOf('software').low, RESHAPE.software);
});

test('keep up: when a need\'s job changes every 100 ns, only what reshapes that fast meets it', () => {
  const R = needOf('radio');
  assert.ok(R.every > 0 && M.MISSES.includes('keep'));
  const miss = plan => M.machine('radio', plan).meets.misses.filter(m => m.rule === 'keep').map(m => m.part);
  assert.deepEqual(miss({ find: 'software', mix: 'software' }), ['find', 'mix'], 'software switches programs in about a microsecond');
  assert.deepEqual(miss({ find: 'liquid:fpga', mix: 'liquid:fpga' }), ['find', 'mix'], 'an FPGA rewires in microseconds at best');
  assert.equal(M.machine('radio', { find: 'liquid:cgra', mix: 'liquid:cgra' }).ok, true, 'an array rewired every tick, shown in a lab');
  assert.equal(M.machine('radio', { find: 'liquid:goal', mix: 'liquid:goal' }).ok, false, 'the 50 ns goal is a guess');
  assert.equal(M.machine('radio', { find: 'liquid:goal', mix: 'liquid:goal' }, true).ok, true, 'it holds if the guesses hold');
  assert.ok(M.machine('radio', { find: 'matter:cim', mix: 'liquid:cgra' }).meets.misses.some(m => m.part === 'find' && m.rule === 'keep'));
  /* needs with no changing job have no such rule */
  assert.ok(!M.machine('hearing', { filter: 'software' }).meets.misses.length);
  assert.ok(M.assemble('radio').picks.every(p => p.plan.find === 'liquid:cgra'));
});

test('a block is checked by its piece of the plan, or by a lab', () => {
  const P = buildPlan();
  BLOCKS.forEach(b => { const c = M.checkOf(b.id, P); assert.ok(c); if (b.need) assert.ok(['built', 'open', 'partly', 'engine'].includes(c.state), b.id); else assert.equal(c.state, 'lab'); });
  assert.equal(M.checkOf('nope'), null);
});

test('a challenge per need: two goals, each with a least energy some machine reaches, and the start never wins', () => {
  for (const n of NEEDS) {
    const G = GOALS[n.id];
    assert.ok(G && G.length === 2 && G[0].id === 'least', n.id + ' has two goals, the first the least energy');
    G.forEach(g => {
      const b = M.bestFor(n.id, g);
      assert.ok(b && isFinite(b.energy), n.id + '.' + g.id + ' can be met');
      const P = M.play(n.id, b.plan, g);
      assert.ok(P.ok && P.won, n.id + '.' + g.id + ': the best plan wins');
      assert.equal(M.play(n.id, M.startPlan(n.id), g).won, false, n.id + '.' + g.id + ': every part a circuit in a giant fab is not the answer');
      (g.exact || []).forEach(id => assert.ok(n.parts.some(p => p.id === id), n.id + ' goal names its own part ' + id));
    });
    /* the least energy is the agent's cheapest offer: the same engine, the same scoring */
    assert.ok(Math.abs(M.bestFor(n.id, G[0]).energy - M.assemble(n.id, 1).picks[0].score.energy) < 1e-12, n.id + ': the least is the agent\'s cheapest');
    /* a harder goal never costs less than the first */
    assert.ok(M.bestFor(n.id, G[1]).energy >= M.bestFor(n.id, G[0]).energy - 1e-12, n.id + ': the second goal is harder');
  }
  /* the hearing aid within a week: memory that computes waits months on a giant fab, a fabric rewired is bought and
     configured in a day */
  const wk = GOALS.hearing[1];
  assert.deepEqual(M.goalMisses(needOf('hearing'), M.machine('hearing', { filter: 'matter:cim' }).plan, wk), [{ rule: 'days' }]);
  assert.equal(M.play('hearing', { filter: 'liquid:fpga' }, wk).won, true);
  /* the rover's guide exact too: memory that computes misses it */
  assert.ok(M.play('rover', { nav: 'matter:cim', vote: 'matter:reversible', clock: 'matter:reversible' }, GOALS.rover[1]).extra.some(x => x.rule === 'exact' && x.part === 'nav'));
});
