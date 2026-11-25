// Build your own AI chip (src/engines/aibuild.js): each preset gives the numbers the first version's lab showed (taken
// by running that lab's own model code), each mission can be met by some choice and is missed by another, and the
// challenges are checks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../src/engines/aibuild.js';
import { readWords } from '../scripts/words.mjs';
/* the lab's words (aib.* in src/i18n/en/labs.json) name what the engine returns */
const EN = readWords();

const close = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${msg}: ${a} vs ${b}`);

/* What the first version showed for its three starting points (its model code, run as it was). */
const FIRST = {
  phone: { V: 0.533891806559241, dieA: 24.2784, pf8: 0.108, bw: 0.136, cap: 16.016, power: 4.85951717967986, Y: 0.9807646857549961, dpw: 2776, dieCost: 7.345911874327439, cost: 44.87064244277112, tps: 17.000000000000004, months: 23.0448, cpm: 0.12656749875080284, tpj: 3.4982899270499024, pfkw: 22.224430124787613, fit: true, probs: 0, stars: 0, all: false, rows: [false, true, true, true, true] },
  infer: { V: 0.7500000000005366, dieA: 739.3536, pf8: 6.6, bw: 7.199999999999999, cap: 216.064, power: 383.728000000374, Y: 0.5535058930536831, dpw: 71, dieCost: 508.91985863238136, cost: 4363.079849887994, tps: 6582.857142857141, months: 33.66, cpm: 0.03129536124190991, tpj: 17.15500860727058, pfkw: 17.199683108852017, fit: true, probs: 0, stars: 0, all: false, rows: [false, true, true, true, false] },
  train: { V: 0.688564604657149, dieA: 735.3536, pf8: 11.88, bw: 9.6, cap: 288.128, power: 560.6282262292492, Y: 0.5552799488869274, dpw: 71, dieCost: 507.29391797727493, cost: 7311.48486565957, tps: 0, months: 30.9282, cpm: Infinity, tpj: 0, pfkw: 21.19051350643571, fit: true, probs: 0, stars: 0, all: false, rows: [false, true, false, true, true] }
};

test('each preset gives what the first version showed, number for number', () => {
  assert.deepEqual(Object.keys(B.PRESETS), ['phone', 'infer', 'train']);
  for (const id of Object.keys(FIRST)) {
    const d = B.design(B.preset(id)), F = FIRST[id];
    for (const k of ['V', 'dieA', 'pf8', 'bw', 'cap', 'power', 'Y', 'dpw', 'dieCost', 'cost', 'tps', 'months', 'cpm', 'tpj', 'pfkw']) {
      if (F[k] === Infinity) assert.equal(d[k], Infinity, id + ' ' + k); else close(d[k], F[k], id + ' ' + k);
    }
    assert.equal(d.fit, F.fit); assert.equal(d.problems.length, F.probs); assert.equal(d.stars, F.stars); assert.equal(d.all, F.all);
    assert.deepEqual(d.rows.map(r => r.ok), F.rows, id + ' requirement rows');
    assert.equal(d.buildable, true);
  }
  /* the first version's slider and voltage curve */
  assert.equal(B.areaOfSlider(0), 5); assert.equal(B.areaOfSlider(1000), 800); assert.equal(B.sramOfSlider(0), 0); assert.equal(B.sramOfSlider(1000), 511);
  for (const a of [5, 12, 100, 600, 800]) assert.ok(Math.abs(B.areaOfSlider(B.sliderOfArea(a)) - a) <= 1, 'area slider round trip');
  close(B.fmax(0.75), 2.0, 'the curve: 2 GHz at 0.75 V');
  assert.equal(B.vmin(0.6), 0.5, 'never under 0.5 V');
});

test('the tables are complete, and every mission names real keys', () => {
  for (const p of Object.values(B.PRESETS)) for (const [k, t] of [['arch', B.ARCH], ['node', B.NODE], ['mem', B.MEM], ['pkg', B.PKG]]) assert.ok(t[p[k]], k);
  for (const [id, m] of Object.entries(B.MISSIONS)) {
    const d = B.design(B.preset(id)); assert.equal(d.rows.length, m.reqs.length);
    assert.ok(m.goal.key in d, 'goal key'); assert.equal(m.goal.stars.length, 2);
    for (const r of m.reqs) { assert.ok(r.op === 'fit' || r.key in d); if (r.op !== 'fit') assert.ok(EN['aib.v.' + r.unit], 'unit word'); }
  }
  for (const [k, t] of [['arch', B.ARCH], ['node', B.NODE], ['mem', B.MEM], ['pkg', B.PKG]]) for (const id of Object.keys(t)) assert.ok(EN[`aib.${k}.${id}`] && EN[`aib.${k}.${id}.d`], k + id);
  for (const id of Object.keys(B.MISSIONS)) assert.ok(EN['aib.mission.' + id] && EN['aib.mission.' + id + '.story']);
});

test('each mission can be met by some choice and is missed by another', () => {
  const meets = {
    phone: { fp4: true },                                        // 4-bit weights: half the bytes, so the phone's memory keeps up
    infer: { fp4: true, agents: true, mem: 'h4' },               // 4-bit weights, faster memory, and design agents for the schedule
    train: { arch: 'sys', mem: 'h4', memN: 6, area: 700, dies: 4, f: 1.2, agents: true }
  };
  for (const id of Object.keys(B.MISSIONS)) {
    const good = { ...B.preset(id), ...meets[id] }, d = B.design(good);
    assert.equal(d.all, true, id + ' is met'); assert.ok(d.stars >= 1); assert.ok(d.rows.every(r => r.ok)); assert.equal(d.problems.length, 0);
    assert.equal(B.CHALLENGES[id].check(good), true);
    const bad = B.preset(id); assert.equal(B.design(bad).all, false, id + ' is missed by its starting point'); assert.equal(B.CHALLENGES[id].check(bad), false);
  }
  /* stars: the score against two thresholds */
  const t = B.design({ ...B.preset('train'), ...meets.train });
  assert.equal(t.stars, 3); assert.ok(t.goal.value >= t.goal.stars[1]);
  assert.equal(B.design({ ...B.preset('infer'), ...meets.infer }).stars, 2);
  /* each mission is missed in its own way */
  assert.equal(B.design({ ...B.preset('phone'), fp4: true, memN: 3 }).rows.find(r => r.key === 'power').ok, false, 'a third memory chip breaks the phone\'s power budget');
  assert.equal(B.design({ ...B.preset('infer'), mem: 'lp', memN: 4, pkg: 'org' }).all, false);
  assert.equal(B.design({ ...B.preset('train'), node: 'a16', area: 700, dies: 4 }).all, false);
  for (const id of Object.keys(B.CHALLENGES)) { assert.equal(B.CHALLENGES[id].id, id); for (const k of ['aib.mission.' + id, 'aib.mission.' + id + '.story', 'aib.done.' + id]) assert.ok(EN[k], k); }
});

test('a search over the dials finds a meeting design (a small grid, to keep it fast)', () => {
  const small = { area: [12, 700], sram: [0, 64], memN: [2, 6], f: [1.2, 2.0], dies: [1, 4] };
  for (const id of Object.keys(B.MISSIONS)) {
    const c = B.solve(id, { dials: small });
    if (c) { assert.equal(B.design(c).all, true); }
  }
  assert.ok(B.solve('phone', { dials: small }), 'the phone has an answer on the small grid');
  assert.ok(B.solve('train', { dials: small }), 'the training flagship has an answer on the small grid');
});

test('what cannot be built is named, with its numbers', () => {
  const ids = c => B.design(c).problems.map(p => p.id);
  assert.deepEqual(ids({ ...B.preset('infer'), area: 800 }), ['reticle']);
  assert.ok(B.design({ ...B.preset('infer'), area: 800 }).problems[0].area > B.LIMITS.reticle);
  assert.deepEqual(ids({ ...B.preset('infer'), pkg: 'org', dies: 1, memN: 6 }).slice(0, 2), ['needs-interposer', 'silicon']);
  assert.ok(ids({ ...B.preset('infer'), memN: 8 }).includes('stacks'));
  assert.ok(ids({ ...B.preset('train'), pkg: 'cs', dies: 4 }).includes('dies'));
  assert.ok(ids({ ...B.preset('infer'), f: 3 }).includes('clock'));   // the lab's slider stops at 2.6 GHz, which 0.97 V still reaches;
  assert.ok(ids({ ...B.preset('phone'), memN: 0 }).includes('no-memory'));
  assert.equal(B.tidy({ ...B.preset('phone'), mem: 'lp', memN: 9 }).memN, 4);
  for (const id of ['reticle', 'needs-interposer', 'stacks', 'dies', 'silicon', 'clock', 'no-memory']) assert.ok(EN['aib.problem.' + id]);
  assert.equal(B.design({ ...B.preset('infer'), area: 800 }).all, false, 'an unbuildable chip never meets a mission');
});

test('the model moves the way the lab taught', () => {
  const base = B.preset('infer');
  /* memory-bound: more bandwidth raises speed, and 4-bit weights nearly double it */
  const d0 = B.design(base), d1 = B.design({ ...base, fp4: true });
  assert.ok(d0.memT > d0.compT, 'memory-bound'); assert.ok(d1.tps > 1.8 * d0.tps);
  assert.ok(B.design({ ...base, mem: 'h4' }).tps > d0.tps);
  /* a bigger die yields worse and costs more per good die; a newer node costs more per wafer */
  assert.ok(B.design({ ...base, area: 300 }).Y > d0.Y);
  assert.ok(B.design({ ...base, area: 300 }).dieCost < d0.dieCost);
  assert.ok(B.NODE.a16.wafer > B.NODE.n2.wafer && B.NODE.n2.wafer > B.NODE.n3.wafer && B.NODE.n3.wafer > B.NODE.n5.wafer);
  /* a faster clock needs more voltage and so more than proportionally more power */
  const lo = B.design({ ...base, f: 1.2 }), hi = B.design({ ...base, f: 2.0 });
  assert.ok(hi.power / lo.power > 2.0 / 1.2);
  /* design agents shorten the schedule by a quarter of the design time */
  close(B.design({ ...base, agents: true }).design, d0.design * 0.75, 'agents');
  /* the model does not fit in memory: no speed */
  const nofit = B.design({ ...B.preset('infer'), mem: 'gd', memN: 4, pkg: 'org' });
  assert.equal(nofit.fit, false); assert.equal(nofit.tps, 0); assert.equal(nofit.cpm, Infinity);
});

test('the tape-out: the months add up, the first wafer is counted, and the reviewer\'s notes are ids', () => {
  for (const id of Object.keys(B.MISSIONS)) {
    const c = B.preset(id), d = B.design(c), tl = B.timeline(c, d);
    close(tl.reduce((s, p) => s + p.months, 0), d.months, id + ' months');
    for (const p of tl) assert.ok(EN['aib.phase.' + p.id]);
    const w = B.firstWafer(d, 5), w2 = B.firstWafer(d, 5);
    assert.deepEqual(w, w2, 'deterministic'); assert.equal(w.total, w.dies.length); assert.equal(w.good, w.dies.filter(x => x.ok).length);
    assert.ok(w.total > 0 && w.good <= w.total);
    for (const n of B.notes(c, d)) assert.ok(EN['aib.note.' + n.id], n.id);
  }
  const n = B.notes(B.preset('infer')).map(x => x.id);
  assert.ok(n.includes('memory-bound') && n.includes('fp4') && n.includes('agents') && n.includes('hbm-share'));
  assert.ok(B.notes({ ...B.preset('infer'), node: 'n2', area: 700 }).some(x => x.id === 'low-yield' && x.percent < 45), 'a big die on a new node yields badly');
  assert.deepEqual(B.notes(B.preset('phone')).map(x => x.id).filter(x => x === 'compiler'), ['compiler']);
});

test('facts named by the tables exist in src/data/facts.json', async () => {
  const { readFileSync } = await import('node:fs');
  const ids = new Set(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url))).facts.map(f => f.id));
  for (const t of [B.NODE, B.MEM, B.PKG]) for (const r of Object.values(t)) for (const f of r.facts) assert.ok(ids.has(f), f);
});
