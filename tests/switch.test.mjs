// Invent a transistor (#329): the switch engine (src/engines/switch.js), its sources, the band an invented material must
// sit in, the four goals, the factory line's heat (src/engines/fabline.js), and your switch up the scales into a
// machine (src/engines/machine.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../src/engines/switch.js';
import { heatAfter, LINE_HEAT } from '../src/engines/fabline.js';
import { SI_FLAT_SWING, mosfet } from '../src/engines/dope.js';
import * as M from '../src/engines/machine.js';
import { GOALS as MGOALS } from '../src/data/blocks.js';

const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
const factOf = id => facts.find(f => f.id === id);
const every = () => W.MATERIAL_IDS.flatMap(mat => W.shapesFor(W.materialOf(mat)).flatMap(shape => W.MECH_IDS.map(mech => ({ mat, shape, mech }))));

test('the 60 mV line: about 59.5 mV per tenfold at room temperature, in proportion to temperature', () => {
  assert.ok(Math.abs(W.swingLimit(300) - 59.5) < 0.1);
  assert.ok(Math.abs(W.swingLimit(150) / W.swingLimit(300) - 0.5) < 1e-12);
});

test('no switch whose carriers go over a barrier turns on steeper than 60 mV per tenfold at 300 K, invented or not', () => {
  for (const s of every().filter(s => s.mech === 'therm')) assert.ok(W.switchOf(s).swing >= W.swingLimit(300), s.mat + '/' + s.shape);
  for (const eg of [0, 0.5, 1.5, 3.4]) for (const dit of [1e10, 1e13]) for (const shape of ['planar', 'fin', 'gaa'])
    assert.ok(W.switchOf({ mat: 'own', shape, mech: 'therm', own: { eg, me: 100000, mh: 100000, dit } }).swing >= W.swingLimit(300));
  /* and colder, the line itself falls: the same switch at 150 K is twice as steep */
  assert.ok(Math.abs(W.switchOf(W.START, 150).swing / W.switchOf(W.START, 300).swing - 0.5) < 1e-9);
});

test('graphene never turns off cleanly, in any shape and any way of switching', () => {
  for (const s of every().filter(s => s.mat === 'graphene')) {
    const r = W.switchOf(s);
    assert.equal(r.clean, false, s.shape + '/' + s.mech);
    assert.ok(r.floor < W.DECADES, 'graphene: less than ten thousand times between on and off');
    assert.ok(Object.values(r.goals).every(g => !g), 'graphene meets no goal');
  }
  /* every other known material does turn off */
  for (const s of every().filter(s => s.mat !== 'graphene')) assert.ok(W.switchOf(s).clean, s.mat);
});

test('silicon gate-all-around beats the silicon fin: steeper, at a lower voltage, with less energy per switch', () => {
  const fin = W.switchOf({ mat: 'si', shape: 'fin', mech: 'therm' }), gaa = W.switchOf({ mat: 'si', shape: 'gaa', mech: 'therm' }), flat = W.switchOf({ mat: 'si', shape: 'planar', mech: 'therm' });
  assert.ok(gaa.swing < fin.swing && fin.swing < flat.swing, 'the firmer the gate\'s grip, the steeper');
  assert.ok(gaa.vmin < fin.vmin && gaa.energy < 1 && fin.energy === 1 && flat.energy > 1);
  assert.ok(gaa.speed > 1, 'and no slower');
  assert.ok(gaa.goals.energy && gaa.goals.factory && !gaa.goals.steep, 'a new shape: less energy, made by a factory, but not past the line');
  assert.equal(W.SILICON.energy, 1); assert.equal(W.SILICON.speed, 1);
});

test('the semiconductor engine\'s switch is the flat silicon case', () => {
  assert.ok(Math.abs(SI_FLAT_SWING - W.switchOf({ mat: 'si', shape: 'planar' }).swing / 1000) < 1e-12);
  assert.ok(Math.abs(SI_FLAT_SWING - 0.075) < 0.001, 'about 75 mV per tenfold');
  const a = mosfet(0.2, 0.5).Id, b = mosfet(0.2 + SI_FLAT_SWING, 0.5).Id;
  assert.ok(Math.abs(b / a - 10) < 1e-6, 'below its threshold, one swing more is ten times the current');
});

test('only a new way to switch gets steeper than the 60 mV line, and tunnelling pays in current', () => {
  const steep = every().filter(s => W.switchOf(s).goals.steep);
  assert.ok(steep.length && steep.every(s => s.mech !== 'therm'));
  const t = W.switchOf({ mat: 'si', shape: 'fin', mech: 'tunnel' }), nc = W.switchOf({ mat: 'si', shape: 'fin', mech: 'nc' });
  assert.ok(t.steep && t.speed < 0.05, 'a silicon tunnelling switch is steep but slow');
  assert.ok(nc.steep && nc.speed > 0.9);
  /* a smaller gap tunnels more */
  assert.ok(W.switchOf({ mat: 'ge', shape: 'fin', mech: 'tunnel' }).share > t.share);
});

test('the four goals each have a switch that meets them, and the challenge is won by having tried them all', () => {
  for (const g of W.GOALS) assert.ok(every().some(s => W.switchOf(s).goals[g]), g);
  assert.equal(W.won([W.START]), false, 'today\'s fin meets only the first');
  assert.ok(W.switchOf(W.START).goals.off);
  assert.equal(W.won([{ mat: 'si', shape: 'gaa' }, { mat: 'si', shape: 'fin', mech: 'tunnel' }]), true);
  assert.equal(W.won([{ mat: 'graphene', shape: 'sheet' }]), false);
});

test('something a factory could make asks the line: germanium melts in its anneal, nanotubes go on a finished chip', () => {
  assert.equal(heatAfter('front'), 1050); assert.equal(heatAfter('back'), 400);
  assert.ok(LINE_HEAT.every(s => s.c > 0));
  const ge = W.switchOf({ mat: 'ge', shape: 'fin', mech: 'nc' });
  assert.ok(ge.goals.energy && !ge.survives && !ge.goals.factory, 'germanium beats silicon on paper, and melts at 937 °C');
  assert.ok(W.switchOf({ mat: 'cnt', shape: 'gaa', mech: 'nc' }).survives);
  for (const mat of ['ingaas', 'gan', 'mos2']) assert.equal(W.switchOf({ mat, shape: W.shapesFor(W.materialOf(mat))[0] }).pair, false, mat + ': no holes for a pair');
  assert.equal(W.switchOf({ mat: 'si', shape: 'fin', mech: 'tunnel' }).goals.factory, false, 'far too slow to be worth making');
});

test('every material value has a source in facts.json, and the shapes each material comes in are real', () => {
  for (const m of W.MATERIALS) {
    const f = factOf(m.fact);
    assert.ok(f && /^https:\/\//.test(f.url) && /^\d{4}-\d{2}-\d{2}$/.test(f.verified), m.id + ': ' + m.fact);
    assert.ok(W.STATUS.includes(m.status) && m.status !== 'guess', m.id);
    assert.ok(W.shapesFor(m).length, m.id + ' comes in a shape');
  }
  for (const x of W.MECHS) assert.ok(factOf(x.fact), x.id + ': ' + x.fact);
  assert.ok(factOf('beol-heat') && factOf('tsmc-n2'));
  /* the numbers the model uses are the sources' own */
  const has = (id, ...ns) => ns.forEach(n => assert.ok(factOf(id).detail.includes(n), id + ' says ' + n));
  has('mat-si', '1.12 eV', '1,400', '450', '1,412'); has('mat-ge', '0.66 eV', '3,900', '1,900', '937'); has('mat-ingaas', '0.74 eV', '12,000', '300', '1,100');
  has('mat-gan', '3.39 eV', '2,000', '31', '2,500'); has('mat-mos2', '1.8 eV', '36'); has('mat-cnt', '100,000'); has('graphene-off', '2 to 20', '10,000');
});

test('an invented material within the band the known materials make counts; outside it, it is a guess and never beats silicon', () => {
  /* the known materials sit inside their own band */
  for (const m of W.MATERIALS) { const B = W.band(m.eg); assert.ok(m.me <= B.me * 1.001 && (!m.mh || m.mh <= B.mh * 1.001), m.id); }
  /* a bigger gap tends to mean slower carriers */
  assert.ok(W.band(3.4).me < W.band(1.12).me && W.band(1.12).me < W.band(0.7).me);
  /* silicon's own numbers, invented, are within it, and the switch counts */
  const fair = W.switchOf({ mat: 'own', shape: 'gaa', own: W.OWN_START });
  assert.ok(fair.inBand && fair.fair && fair.goals.energy && !fair.goals.factory, 'an invention within the band counts, but no factory makes it');
  /* a wide gap with carriers faster than any known material at that gap: outside, a guess, and no goal */
  const wish = { eg: 2.5, me: 100000, mh: 100000, dit: 1e10 };
  assert.equal(W.inBand(wish).ok, false);
  for (const shape of ['planar', 'fin', 'gaa']) for (const mech of W.MECH_IDS) {
    const r = W.switchOf({ mat: 'own', shape, mech, own: wish });
    assert.equal(r.inBand, false); assert.equal(r.status, 'guess');
    assert.ok(Object.values(r.goals).every(g => !g), shape + '/' + mech + ': a guess never counts as beating silicon');
  }
  assert.equal(W.forMachines({ mat: 'own', own: wish }).status, 'guess');
});

test('a switch as a word and back', () => {
  for (const s of every().concat([{ mat: 'own', shape: 'gaa', mech: 'tunnel', own: { eg: 0.9, me: 2500, mh: 800, dit: 2e11 } }])) {
    const k = W.specKey(s);
    assert.ok(k.length <= 40, k);
    assert.equal(W.specKey(W.specOf(k)), k);
    assert.ok(Math.abs(W.switchOf(W.specOf(k)).swing - W.switchOf(s).swing) < 0.01);
  }
  assert.deepEqual(W.specOf('nonsense'), W.normal(W.START));
});

test('your switch up the scales: a machine\'s block made of it, its energy moving with the switch', () => {
  const plan = sw => Object.assign({ detect: 'matter:switch', check: 'matter:switch' }, sw ? { sw } : {});
  const base = M.machine('wildfire', {}).score.energy, si = M.machine('wildfire', plan()).score;
  assert.ok(M.machine('wildfire', plan()).ok, 'a block of silicon fins is made like a circuit');
  assert.ok(Math.abs(si.energy - base) < 1e-12, 'today\'s silicon fin costs what a circuit does');
  const gaa = M.machine('wildfire', plan(W.specKey({ mat: 'si', shape: 'gaa' })));
  assert.ok(gaa.ok && gaa.score.energy < base, 'gate all around: the machine spends less');
  const flat = M.machine('wildfire', plan(W.specKey({ mat: 'si', shape: 'planar' })));
  assert.ok(flat.score.energy > base, 'a flat switch: more');
  /* the line melts germanium: the fab cannot make the block; graphene never turns off: no block either */
  for (const sw of [W.specKey({ mat: 'ge', shape: 'gaa' }), W.specKey({ mat: 'graphene', shape: 'sheet' })])
    assert.ok(M.machine('wildfire', plan(sw)).check.breaks.some(b => b.rule === 'fab' && b.part === 'detect'), sw);
  /* an invented material is a guess: its gain counts only if the guesses hold */
  const own = W.specKey({ mat: 'own', shape: 'gaa', mech: 'nc', own: W.OWN_START }), o = M.machine('wildfire', plan(own));
  assert.ok(o.ok && o.score.low < o.score.high && Math.abs(o.score.high - base) < 1e-12);
  assert.equal(M.claimsOf(M.matterIn('matter:switch'), own)[0].status, 'guess');
  /* the least a need's goal can be follows your switch */
  assert.ok(M.bestFor('wildfire', MGOALS.wildfire[0], W.specKey({ mat: 'si', shape: 'gaa', mech: 'nc' })).energy <= M.bestFor('wildfire', MGOALS.wildfire[0]).energy);
});

test('the stacked pair (#499): a gate on half the ground, the same heat on it, shown in labs and not in products', async () => {
  const P = await import('../src/engines/path.js'), A = await import('../src/engines/arch.js'), { EXAMPLE } = await import('../src/data/path.js');
  const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts;
  const cf = W.shapeOf('cfet'), fact = facts.find(f => f.id === cf.fact);
  assert.equal(cf.status, 'lab', 'demonstrated in labs, not in products');
  assert.ok(fact && fact.url && fact.verified && /half/.test(fact.value), 'its area rests on a fact with its source and date');
  assert.equal(cf.area, 0.5);
  assert.ok(W.SHAPES.filter(s => s.id !== 'cfet').every(s => s.area === 1), 'no other shape changes the area without a source');
  /* the switch: as clean as gate all around, its copies a little more spread, its heat on half the area */
  const gaa = W.switchOf({ mat: 'si', shape: 'gaa' }), st = W.switchOf({ mat: 'si', shape: 'cfet' }), fin = W.SILICON;
  assert.ok(st.clean && st.sigma > gaa.sigma && st.vmin >= gaa.vmin, 'the top switch is harder to reach');
  assert.equal(st.area, 0.5); assert.equal(fin.area, 1);
  assert.ok(st.density > 1.5 * st.energy && st.density > fin.density, 'the same energy on half the ground: hotter per square');
  assert.deepEqual(W.shapesFor(W.materialOf('si')).includes('cfet'), true); assert.ok(!W.shapesFor(W.materialOf('mos2')).includes('cfet'), 'stacked ribbons of a crystal, not of sheets');
  /* the carry: the gate rung hands up half the area, and the chip's die shrinks with it; back to fins, it grows again */
  const carry = shape => P.carry(P.stackOf(A.TODAY, Object.assign({}, EXAMPLE, { shape })));
  const a = carry('fin'), b = carry('cfet'), c = carry('gaa');
  assert.equal(a.rungs.gate.hands.area, 1); assert.equal(b.rungs.gate.hands.area, 0.5);
  assert.ok(b.rungs.chip.hands.area < a.rungs.chip.hands.area && b.rungs.chip.hands.area < c.rungs.chip.hands.area, 'a smaller die');
  assert.ok(b.rungs.chip.hands.yield >= a.rungs.chip.hands.yield, 'a smaller die catches no more dust');
});
