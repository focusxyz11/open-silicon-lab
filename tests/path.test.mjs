/* The path (docs/PATH.md; src/data/path.js, src/engines/path.js): seven rungs from the atom to the mind, each made of
   the contract the rung below hands up (#443); a recipe of the architecture engine as a set of forks in the stack, with
   one figure against today's computer (#444); the three faces of every rung, as designed, as made and as used (#454). */
import './ledger.setup.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as D from '../src/data/path.js';
import * as P from '../src/engines/path.js';
import * as A from '../src/engines/arch.js';
import * as SW from '../src/engines/switch.js';
import { FIDS, ENGINES, STATUS_MAX, rankOf } from '../src/data/fidelity.js';
import { LAYERS } from '../src/data/lattice.js';
import { WORLDS, DEPTHS } from '../src/data/weave.js';
import { TWINS } from '../src/data/atlas.js';
import { STAGES } from '../src/engines/way.js';

const FACTS = new Set(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => f.id));
const depthsOf = id => WORLDS.find(w => w.id === id).depths;
const close = (a, b, why) => assert.ok(Math.abs(a - b) <= 1e-12 * Math.max(Math.abs(a), Math.abs(b)), why + ': ' + a + ' against ' + b);
const UNITS = ['eV', 'cm2/Vs', 'per cm2 eV', 'V', 'mV', 'x', 'yes', 's', 'J', 'p', 'n', 'share', 'Hz', 'per s', 'W'];
const ex = (f, g = A.TODAY, aim) => P.carry(P.stackOf(g, f, aim));
const H = (R, r) => R.rungs[r].hands;

/* ---- the path 1: the carry (#443) ---- */
test('seven rungs from the atom to the mind, on the dive\'s levels and the lattice\'s layers: one ladder', () => {
  assert.deepEqual(D.RUNGS, ['atom', 'switch', 'gate', 'block', 'chip', 'machine', 'mind']);
  assert.deepEqual(D.RUNGS.map(r => D.LAYER[r]), LAYERS, 'the lattice\'s layers, in order');
  for (const r of ['atom', 'switch', 'gate', 'block', 'chip']) assert.deepEqual(D.LEVELS[r], [r], r + ' is the dive\'s own level');
  for (const lv of D.LEVELS.machine) assert.ok(DEPTHS[lv] && depthsOf('datacentre').includes(lv), 'the machine is seen at the data centre\'s ' + lv);
  assert.deepEqual(D.LEVELS.mind, ['mind'], 'mind is the one new level');
  assert.deepEqual(D.PARTS, { block: ['sums', 'memory'], chip: ['core'] }, 'sums and memory are parts of the block, the core part of the chip');
});

test('every rung hands up named fields with units, and names the engine behind it and its mark of how true', () => {
  for (const r of D.RUNGS) {
    assert.ok(D.HANDS[r].length >= 3, r + ' hands up a contract');
    assert.equal(new Set(D.fieldsOf(r)).size, D.HANDS[r].length, r + ': each field once');
    for (const [k, u] of D.HANDS[r]) assert.ok(UNITS.includes(u), r + '.' + k + ': unit ' + u);
    assert.ok(ENGINES[D.BY[r]], r + ': ' + D.BY[r] + ' is an engine of ENGINES');
    assert.ok(FIDS.includes(D.FID[r]), r + ': a mark of FIDS');
  }
  assert.equal(D.BY.switch, 'switch'); assert.equal(D.FID.switch, 'computed');
  assert.ok(ENGINES[D.FORK_BY]);
  assert.ok(D.GENE_RUNGS && D.FINE_OF && D.EXAMPLE, 'the gene-to-rung table, the fine settings and the example');
});

test('the lab\'s example carries from the atom to the mind without errors, every rung handing up its whole contract', () => {
  const R = P.X0;
  assert.equal(R.broken, null);
  for (const r of D.RUNGS) {
    const h = H(R, r), x = R.rungs[r];
    assert.deepEqual(Object.keys(h).sort(), D.fieldsOf(r).slice().sort(), r + ' hands up its fields');
    for (const [k, u] of D.HANDS[r]) assert.ok(u === 'yes' ? typeof h[k] === 'boolean' : Number.isFinite(h[k]), r + '.' + k + ' = ' + h[k]);
    assert.ok(!x.fork && !x.passed && !x.broken, r);
    assert.deepEqual(x.fid, r === 'atom' ? { f: 'figures', by: 'switch', fact: 'mat-si' } : { f: D.FID[r], by: D.BY[r] }, r + ': its mark');
  }
  for (const [r, k] of [['gate', 'fail'], ['block', 'aluWrong'], ['block', 'readWrong'], ['chip', 'wrong'], ['machine', 'wrong']]) assert.ok(H(R, r)[k] < 1e-15, r + '.' + k + ' ' + H(R, r)[k]);
  assert.ok(H(R, 'mind').right > 0.95, 'the example\'s mind is right ' + H(R, 'mind').right);
  assert.deepEqual(P.carry(P.stackOf(A.TODAY, D.EXAMPLE)).rungs, R.rungs, 'the example is today\'s recipe with the example\'s settings');
});

test('the switch rung\'s numbers are the switch engine\'s, for every material, shape and way of switching', () => {
  for (const mat of SW.MATERIAL_IDS) for (const shape of SW.SHAPE_IDS) for (const mech of SW.MECH_IDS) {
    const R = ex({ mat, shape, mech }), spec = SW.normal({ mat, shape, mech }), sw = SW.switchOf(spec), h = H(R, 'switch');
    for (const k of D.fieldsOf('switch')) assert.ok(Object.is(h[k], sw[k]), mat + '/' + shape + '/' + mech + ' ' + k + ': ' + h[k] + ' against ' + sw[k]);
    assert.deepEqual(H(R, 'atom'), { gap: sw.mat.eg, electrons: sw.mat.me, holes: sw.mat.mh, traps: sw.mat.dit }, mat + ': the atom is the engine\'s material');
    assert.ok(FACTS.has(R.rungs.atom.fid.fact), mat + ': the atom\'s figures have a source');
    assert.equal(R.broken, sw.clean ? null : 'switch', mat + '/' + shape + '/' + mech);
  }
});

test('graphene never turns off, and breaks every rung above the switch', () => {
  for (const shape of SW.SHAPE_IDS) for (const mech of SW.MECH_IDS) {
    const R = ex({ mat: 'graphene', shape, mech });
    assert.equal(R.broken, 'switch');
    assert.ok(!R.rungs.atom.broken && !R.rungs.switch.broken && H(R, 'switch'), 'the atom and the switch are still there to look at');
    for (const r of D.RUNGS.slice(2)) assert.ok(R.rungs[r].broken && R.rungs[r].hands === null, r + ' cannot be built');
  }
});

test('below the lowest clean voltage, wrong answers rise at the gate, the block, the chip and the mind', () => {
  for (const mat of ['si', 'ge', 'gan']) {
    const sw = SW.switchOf(SW.normal({ mat })), hi = ex({ mat, V: 0.7 }), lo = ex({ mat, V: sw.vmin - 0.01 }), lower = ex({ mat, V: sw.vmin - 0.04 });
    assert.ok(0.7 > sw.vmin && sw.vmin - 0.04 > D.V_RANGE[0], mat);
    for (const [a, b, strict] of [[hi, lo, true], [lo, lower, false]]) {
      const up = (x, y, why) => assert.ok(strict ? y > x : y >= x, mat + ': ' + why + ' ' + x + ' then ' + y);
      assert.ok(H(b, 'gate').fail > H(a, 'gate').fail, mat + ': the gate');
      assert.ok(H(b, 'block').aluWrong > H(a, 'block').aluWrong, mat + ': the block');
      up(H(a, 'chip').wrong, H(b, 'chip').wrong, 'the chip');
      up(1 - H(a, 'mind').right, 1 - H(b, 'mind').right, 'the mind');
    }
    assert.ok(H(lower, 'mind').right < 0.9, mat + ': the mind forgets ' + H(lower, 'mind').right);
    assert.ok(H(lo, 'gate').energy < H(hi, 'gate').energy, mat + ': and it spends less on every gate');
  }
});

test('each rung is made of the rungs below: a rung\'s fine setting changes nothing beneath it', () => {
  const other = { mat: 'ge', shape: 'gaa', mech: 'nc', V: 0.55, lib: 'rich', adder: 'look', vote: 1, regs: 8, stages: 5, ui: 2, bits: 2 };
  for (const r of D.RUNGS) for (const k of D.FINE_OF[r]) {
    const R = ex({ [k]: other[k] });
    for (const below of D.RUNGS.slice(0, D.RUNGS.indexOf(r))) assert.deepEqual(H(R, below), H(P.X0, below), k + ' (at ' + r + ') changed ' + below);
    assert.notDeepEqual(D.RUNGS.slice(D.RUNGS.indexOf(r)).map(x => H(R, x)), D.RUNGS.slice(D.RUNGS.indexOf(r)).map(x => H(P.X0, x)), k + ' changes its rung or one above');
  }
});

test('fine settings are made whole: every setting on one rung, unknown values back to the example, the voltage in its range', () => {
  const all = D.RUNGS.flatMap(r => D.FINE_OF[r]);
  assert.deepEqual(all.slice().sort(), Object.keys(D.EXAMPLE).sort(), 'each fine setting on one rung');
  assert.deepEqual(P.normalFine(D.EXAMPLE), D.EXAMPLE);
  assert.deepEqual(P.normalFine({ lib: 'gold', regs: 7, bits: '4', V: 9 }), Object.assign({}, D.EXAMPLE, { bits: 4, V: D.V_RANGE[1] }));
  assert.equal(P.normalFine({ V: -1 }).V, D.V_RANGE[0]);
  assert.equal(P.normalFine({ mat: 'mos2' }).shape, 'gaa', 'a shape the material comes in');
});

test('an invented material carries, a guess from the atom up', () => {
  const R = ex({ mat: 'own', own: { eg: 1.2, me: 2000, mh: 600, dit: 1e10 } });
  assert.equal(R.broken, null);
  for (const r of D.RUNGS) assert.equal(R.rungs[r].fid.status, 'guess', r);
  assert.deepEqual(P.recipeOf(P.stackOf(A.TODAY, R.fine)), A.TODAY);
  assert.equal(P.fineOf(P.stackOf(A.TODAY, R.fine)).own.me, 2000);
});

/* ---- the path 2: one model for the stack and the recipe (#444) ---- */
test('the gene-to-rung table: every gene of the architecture engine chooses rungs of the stack', () => {
  assert.deepEqual(Object.keys(D.GENE_RUNGS).sort(), A.GENES.slice().sort());
  for (const [g, rs] of Object.entries(D.GENE_RUNGS)) for (const r of rs) assert.ok(D.RUNGS.includes(r), g + ': ' + r);
  assert.deepEqual(D.GENE_RUNGS.carrier, ['atom', 'switch', 'gate']);
  assert.ok(D.GENE_RUNGS.where.includes('block') && D.GENE_RUNGS.where.includes('machine'));
});

test('recipeOf(stackOf(r)) is r for all 400 recipes, and a stack keeps its fine settings and its need', () => {
  const all = A.allRecipes();
  assert.equal(all.length, 400);
  for (const g of all) {
    const s = P.stackOf(g, { V: 0.6, bits: 4 }, 'radio');
    assert.deepEqual(P.recipeOf(s), g, A.keyOf(g));
    for (const [gene, rs] of Object.entries(D.GENE_RUNGS)) for (const r of rs) assert.equal(s.rungs[r].genes[gene], g[gene]);
    assert.deepEqual(P.stackOf(P.recipeOf(s), P.fineOf(s), s.aim), s, A.keyOf(g) + ': laid out again the same');
  }
  assert.deepEqual(P.recipeOf({}), A.TODAY, 'an empty stack is today\'s computer');
  assert.equal(P.stackOf(A.TODAY, {}, 'nothing').aim, D.AIM, 'the need starts on any program');
});

test('one figure against today\'s computer: the stack\'s for a need is the architecture engine\'s scoreOf', () => {
  for (const g of A.allRecipes()) for (const n of A.NEEDS) {
    const R = ex({}, g, n), sc = A.scoreOf(A.start(g))[n];
    assert.deepEqual(R.against, { need: n, now: sc.now, could: sc.could, can: sc.can, wins: sc.wins, year: 0 }, A.keyOf(g) + ' ' + n);
    if (A.novelty(g)) assert.equal(R.against.could, A.potentialOf(g, n), A.keyOf(g) + ' ' + n + ': once polished');
  }
  /* grown: the stack's figure follows the state grown in its recipe, year by year */
  const g = { where: 'near', carrier: 'charge', told: 'events', shape: 'swarm' }, s = P.stackOf(g, {}, 'wildfire');
  let st = A.start(g);
  for (let y = 0; y < 15; y++) {
    st = A.year(st, ['people', 'device']);
    for (const n of A.NEEDS) assert.equal(P.againstToday(s, n, st).now, A.scoreOf(st)[n].now, 'year ' + st.year + ' ' + n);
  }
  assert.equal(P.againstToday(s, null, st).need, 'wildfire', 'its own need by default');
  assert.equal(P.againstToday(s, 'any', A.start(A.TODAY)).now, A.scoreOf(A.start(g)).any.now, 'a state of another recipe is not this stack\'s');
});

test('a forked rung hands up the same fields as the rung it replaces, its energy divided by the engine\'s own factor', () => {
  for (const g of A.allRecipes()) for (const n of ['any', 'hearing']) {
    const R = ex({}, g, n);
    for (const r of D.RUNGS) {
      const x = R.rungs[r];
      if (x.hands) assert.deepEqual(Object.keys(x.hands).sort(), D.fieldsOf(r).slice().sort(), A.keyOf(g) + ' ' + r);
      for (const [k, u] of D.HANDS[r]) if (x.hands && u !== 'yes' && x.hands[k] !== null) assert.ok(Number.isFinite(x.hands[k]) && x.hands[k] >= 0, A.keyOf(g) + ' ' + r + '.' + k);
    }
    for (const r of ['machine', 'mind']) assert.ok(R.rungs[r].hands, A.keyOf(g) + ': ' + r + ' is always built');
  }
  for (const n of A.NEEDS) {
    const X = ex({}, A.TODAY, n), one = (k, o) => ex({}, Object.assign({}, A.TODAY, { [k]: o }), n);
    for (const o of A.OPTIONS.carrier) if (!(A.CARRY.carrier[o].skips || []).length) close(H(one('carrier', o), 'gate').energy, H(X, 'gate').energy / A.forkEnergy('carrier', o, n), 'carrier ' + o + ' ' + n);
    for (const o of A.OPTIONS.told) close(H(one('told', o), 'chip').energy, H(X, 'chip').energy / A.forkEnergy('told', o, n), 'told ' + o + ' ' + n);
    for (const o of A.OPTIONS.shape) close(H(one('shape', o), 'machine').energy, H(X, 'machine').energy / A.forkEnergy('shape', o, n), 'shape ' + o + ' ' + n);
    for (const o of A.OPTIONS.where) close(one('where', o).rungs.machine.more.move, X.rungs.machine.more.move / A.forkEnergy('where', o, n), 'where ' + o + ' ' + n);
    for (const k of A.GENES) close(A.forkEnergy(k, A.TODAY[k], n), 1, k + ': today\'s option divides by nothing');
  }
});

test('every fork\'s contract is a guess, and so is every rung built on one', () => {
  for (const k of A.GENES) for (const o of A.OPTIONS[k]) if (A.isFork(k, o)) assert.equal(A.forkFact(k, o), null, k + ' ' + o + ' has no fact behind it yet');
  for (const g of A.allRecipes()) {
    const R = ex({}, g); let below = false;
    for (const r of D.RUNGS) {
      const x = R.rungs[r], forks = A.GENES.filter(k => D.GENE_RUNGS[k].includes(r) && g[k] !== A.TODAY[k]);
      assert.deepEqual(x.forks, forks, A.keyOf(g) + ' ' + r);
      if (forks.length) { assert.deepEqual(x.fid, { f: 'idea', by: D.FORK_BY, status: 'guess' }, A.keyOf(g) + ' ' + r); below = true; }
      else if (below) assert.equal(x.fid.status, 'guess', A.keyOf(g) + ' ' + r + ' rests on a guess');
      else assert.ok(!x.fid.status, A.keyOf(g) + ' ' + r);
      assert.ok(FIDS.includes(x.fid.f) && ENGINES[x.fid.by], A.keyOf(g) + ' ' + r + ': a mark and an engine');
      if (x.fid.status === 'guess') assert.ok(rankOf(x.fid.f) <= rankOf(STATUS_MAX.guess), 'a guess is never more than an idea drawn');
    }
  }
});

test('a carrier that skips rungs passes them by instead of forcing them, handing its contract up at the last', () => {
  for (const o of A.OPTIONS.carrier) {
    const skips = A.CARRY.carrier[o].skips || [], R = ex({}, Object.assign({}, A.TODAY, { carrier: o }));
    for (const r of D.RUNGS) assert.equal(R.rungs[r].passed, skips.includes(r), o + ' ' + r);
    if (!skips.length) continue;
    skips.slice(0, -1).forEach(r => assert.equal(R.rungs[r].hands, null, o + ': ' + r + ' is passed by'));
    const last = skips[skips.length - 1];
    assert.ok(H(R, last), o + ': its contract reaches the rung above at ' + last);
    assert.equal(H(R, last).clock, H(P.X0, last).clock / A.CARRY.carrier[o].delay, o + ': slowed by its own delay');
    assert.ok(H(R, 'mind').aps < H(P.X0, 'mind').aps, o + ': a slower mind');
  }
});

/* ---- faces 1: the three faces (#454) ---- */
test('every rung names its three faces, as designed, as made and as used, or says why it has none', () => {
  const studio = depthsOf('design'), line = depthsOf('journey'), WHY = ['chosen', 'outside', 'assembled', 'trained'];
  assert.deepEqual(D.FACES, ['design', 'make', 'use']);
  for (const f of D.FACES) assert.ok(STAGES.includes(D.FACE_STAGE[f]), f + ' is seen at a stage of the loop');
  for (const r of D.RUNGS) {
    assert.deepEqual(Object.keys(D.FACE_OF[r]).sort(), D.FACES.slice().sort(), r);
    for (const f of D.FACES) {
      const F = D.FACE_OF[r][f];
      if (F.none) { assert.ok(WHY.includes(F.none), r + ' as ' + f + ': why ' + F.none); assert.ok(!P.hasFace(r, f)); continue; }
      assert.ok(P.hasFace(r, f));
      if (f === 'use') { assert.ok(D.LEVELS[r].includes(F.home), r + ' as used is at its own level'); continue; }
      const row = f === 'design' ? studio : line;
      assert.ok(row.includes(F.home), r + ' as ' + f + ': home ' + F.home);
      assert.ok(F.steps.length && F.steps.some(s => s.at === F.home), r + ' as ' + f + ': a step at its home');
      for (const s of F.steps) { assert.ok(row.includes(s.at), r + ' ' + s.id + ' at ' + s.at); assert.ok(ENGINES[s.by], r + ' ' + s.id + ': engine ' + s.by); }
    }
  }
  /* the studio is chip to switch, the fab atom to chip, the dive every rung */
  assert.deepEqual(D.RUNGS.filter(r => P.hasFace(r, 'design')), ['switch', 'gate', 'block', 'chip']);
  assert.deepEqual(D.RUNGS.filter(r => P.hasFace(r, 'make')), ['atom', 'switch', 'gate', 'block', 'chip']);
  assert.deepEqual(D.RUNGS.filter(r => P.hasFace(r, 'use')), D.RUNGS);
  assert.equal(D.FACE_OF.mind.make.none, 'trained', 'mind as made says so');
  /* every step of the studio is a step of some rung as designed; arrange is the recipe's own genes */
  for (const d of studio) assert.ok(D.RUNGS.some(r => P.hasFace(r, 'design') && D.FACE_OF[r].design.steps.some(s => s.at === d)), d + ' belongs to a rung as designed');
  assert.ok(D.ARRANGE.every(k => A.GENES.includes(k)) && D.FACE_OF.chip.design.steps.some(s => s.id === 'arrange' && s.by === 'arch'));
});

test('the faces agree with the atlas\'s Turn: the same level designed, made and used', () => {
  for (const tw of TWINS) {
    const r = tw.used;
    assert.equal(D.FACE_OF[r].use.home, r);
    if (tw.designed) assert.equal(D.FACE_OF[r].design.home, tw.designed, r + ' as designed');
    assert.ok(tw.made.includes(D.FACE_OF[r].make.home), r + ' as made: ' + D.FACE_OF[r].make.home);
    for (const m of tw.made) assert.ok(D.FACE_OF[r].make.steps.some(s => s.at === m), r + ' as made has ' + m);
  }
});

test('along keeps the rung across Design, Make and Use', () => {
  for (const r of D.RUNGS) {
    for (const stage of ['design', 'make', 'use']) {
      const a = P.alongTo(r, stage), F = D.FACE_OF[r][stage];
      assert.equal(a.rung, r, r + ' at ' + stage); assert.equal(a.stage, stage); assert.equal(a.face, stage);
      if (F.none) assert.equal(a.none, F.none); else { assert.equal(a.home, F.home); assert.deepEqual(a.steps, (F.steps || []).map(s => s.id)); }
    }
    for (const stage of STAGES.filter(s => !Object.values(D.FACE_STAGE).includes(s))) assert.deepEqual(P.alongTo(r, stage), { rung: r, stage, face: null }, r + ' at ' + stage + ' turns nothing');
  }
  assert.deepEqual(P.alongTo('gate', 'make'), { rung: 'gate', stage: 'make', face: 'make', home: 'print', steps: ['print'] });
  assert.equal(P.alongTo('mind', 'make').none, 'trained');
  assert.equal(P.alongTo('cloud', 'use'), null);
  assert.equal(P.faceOf('gate', 'nowhere'), null);
});

/* ---- the path 9: challenges as stepping stones on their rungs (#451) ---- */
test('every challenge sits on one rung, read from where the lattice places it', async () => {
  const { CHALLENGES } = await import('../src/v2/loop.js');
  const left = CHALLENGES.filter(c => !D.RUNGS.includes(P.rungOfChallenge(c.id))).map(c => c.id);
  assert.deepEqual(left, [], 'challenges without a rung (place them in src/data/lattice.js PLACED)');
  /* the challenges that raise a direction once (arch.js STONES) are challenges, each on a rung */
  for (const ids of Object.values(A.STONES)) for (const id of ids) if (id !== A.KEPT_SWITCH && id !== A.LEDGER_ENTRY) assert.ok(CHALLENGES.some(c => c.id === id) && P.rungOfChallenge(id), id);
  assert.equal(P.rungOfChallenge('no-such-challenge'), null);
});

test('stepping stones never win a need alone', () => {
  /* every stone brought, on every recipe nobody has built: each direction raised once, no further than today's level,
     and no need won before a single year is grown; brought in the middle of a start, the same */
  const all = Object.fromEntries(Object.entries(A.STONES).map(([d, ids]) => [d, ids[0]]));
  for (const g of A.allRecipes()) {
    if (!A.novelty(g) || A.knownOf(g)) continue;
    const bare = A.start(g), st = A.start(g, all), later = A.bring(bare, all);
    assert.deepEqual(A.winsOf(st), [], A.keyOf(g) + ' wins with stones alone');
    assert.deepEqual(A.winsOf(later), [], A.keyOf(g) + ' wins with stones brought later');
    for (const d of A.DIRS) { assert.ok(st.start[d] <= 1 && st.start[d] <= bare.start[d] * A.STONE + 1e-12, d); close(A.bring(later, all).start[d], later.start[d], 'a stone raises its direction once'); }
  }
});
