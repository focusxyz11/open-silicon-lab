// The chip-making step models (src/engines/fabsteps.js and the files it gathers): the defaults give what the first
// version showed, results move the right way, and each challenge can be met by some setting and fails at the defaults.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync as readEN } from 'node:fs';
const EN = readWords();
/* a word: still in an engine's WORDS, or moved into src/i18n/en/ once its view was built (the puller's are cz.*) */
const has = k => F.WORDS[k] || EN[k] || EN[k.replace('fab.puller.dislocations.', 'cz.disl.').replace('fab.puller.', 'cz.')] || EN[k.replace(/^fab\.ch\.(\w+)\.(t|goal)$/, 'game.ch.$1.$2')];
import { readFileSync } from 'node:fs';
import * as F from '../src/engines/fabsteps.js';
import { readWords } from '../scripts/words.mjs';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || '') + ' ' + a + ' vs ' + b);
const facts = JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url), 'utf8')).facts.map(f => f.id);

/* ---- the crystal puller ---- */
test('puller: it starts as the first version did, and its target moves the right way', () => {
  const s = F.pullStart();
  assert.deepEqual([s.D, s.L, s.melt, s.phase, s.neckOk, s.done], [5, 0, 400, 'dip', null, false]);
  near(s.target, 300 * Math.exp(-0.8 * 2.8 - 0.19 * 10), 1e-9);                  // the defaults ask for a thin neck
  near(F.pullTarget(1, 8), 300, 1e-9);
  assert.ok(F.pullTarget(2, 8) < F.pullTarget(1, 8), 'pulling too fast thins the crystal');
  assert.ok(F.pullTarget(1, 12) < F.pullTarget(1, 8), 'a hotter melt thins the crystal');
  assert.equal(F.pullTarget(50, 20), 2); assert.equal(F.pullTarget(0.2, 0), 460);
  assert.equal(F.pullRotation(3), 'slow'); assert.equal(F.pullRotation(12), 'ok'); assert.equal(F.pullRotation(24), 'fast');
});

test('puller: the diameter follows its target with a lag, and a step does not change the old state', () => {
  const s0 = F.pullStart(), copy = JSON.stringify(s0);
  const s1 = F.pullStep(s0, 5, { pull: 1, temp: 8 });                              // target 300 mm, a long way off
  assert.equal(JSON.stringify(s0), copy);
  assert.ok(s1.D > 5 && s1.D < 100, 'D ' + s1.D);
  let s = s1; for (let i = 0; i < 400; i++) s = F.pullStep(s, 1, { pull: 1, temp: 8 });
  near(s.D, 300, 1);
  /* any dt gives the same as steps of at most 2 minutes */
  let a = F.pullStep(s0, 10, { pull: 1, temp: 8 }), b = s0; for (let i = 0; i < 5; i++) b = F.pullStep(b, 2, { pull: 1, temp: 8 });
  near(a.D, b.D, 1e-9); near(a.mass, b.mass, 1e-12);
  /* heavier, longer crystal uses melt */
  near(s.mass + s.melt, 400, 1e-9); assert.ok(s.mass > 0);
});

test('puller: at the defaults the neck is thin and dislocation-free but nothing grows into an ingot; a thick neck spoils it', () => {
  let s = F.pullStart(); for (let i = 0; i < 3000; i++) s = F.pullStep(s, 1);
  assert.equal(s.neckOk, true); assert.equal(s.dislocations, 'none'); assert.ok(s.D < 6);
  assert.equal(s.phase, 'shoulder'); assert.equal(s.done, false); assert.equal(s.wafers, 0);
  assert.equal(F.pullMet([s]), false);
  let bad = F.pullStart(); for (let i = 0; i < 200; i++) bad = F.pullStep(bad, 1, { pull: 1, temp: 8 });
  assert.equal(bad.neckOk, false); assert.equal(bad.dislocations, 'seed'); assert.equal(bad.wafers, 0); assert.equal(bad.msg, 'neckfail');
});

test('puller: the autopilot grows a full ingot (about 2 m in the band, 2,000+ wafers), and the challenge is met by it', () => {
  const s = F.pullRun({ auto: true });
  assert.ok(s.done && s.neckOk && !s.shock);
  assert.ok(s.usable > 2000 && s.usable < 2500, 'usable ' + s.usable);
  assert.ok(s.wafers > 2000 && s.wafers === Math.floor(s.usable / 0.975));
  assert.ok(s.mass > 380 && s.mass < 400 && s.D < 120);
  assert.equal(s.msg, 'done'); assert.ok(F.pullMet([s]) && F.met('crystal', [s]));
  assert.ok(s.hist.length > 100 && s.hist[0][0] === 0);
  const ph = new Set(); let t = F.pullStart(); for (let i = 0; i < 6000 && !t.done; i++) { t = F.pullStep(t, 1, { auto: true }); ph.add(t.phase); }
  assert.deepEqual([...ph].sort(), [...F.PULL_PHASES].sort());
});

test('puller: lifting off wide is a thermal shock and loses length', () => {
  const hold = st => st.phase === 'tail' ? { pull: 1, temp: 8 } : F.pullAuto(st);   // keeps 300 mm to the end
  const s = F.pullRun(hold);
  assert.ok(s.done && s.shock && s.dislocations === 'shock' && s.msg === 'shock');
  assert.equal(F.pullMet([s]), false);
});

/* ---- doping ---- */
test('silicon: carriers climb with temperature, and 600 K frees as many as light doping adds', () => {
  near(F.ni(300), 1e10, 1);
  assert.ok(F.ni(400) > F.ni(300) * 50 && F.ni(500) > F.ni(400) * 20);
  near(Math.log10(F.siliconPure(600).n), 15.15, 0.02);
  assert.ok(F.siliconPure(600).rho < F.siliconPure(300).rho);
  const seen = r => F.met('too-hot', [r]);
  assert.equal(seen(F.siliconPure()), false);                                     // 300 K, the first version's start
  assert.equal(seen(F.siliconPure(600)), true);
  assert.equal(seen(F.siliconPure(650)), false);
  assert.equal(seen(F.siliconPure(580)), false);
});

test('silicon: doping makes it conduct, more doping more so; the junction blocks backwards; the switch turns on', () => {
  const pure = F.siliconPure(300).rho;
  assert.ok(F.siliconDoped('n', 16).rho < pure / 1e4 && F.siliconDoped('p', 16).rho < pure / 1e4);
  assert.ok(F.siliconDoped('n', 18).rho < F.siliconDoped('n', 16).rho);
  const n = F.siliconDoped('n', 16); assert.ok(n.majority > 0.99e16 && n.minority < 1e5);
  const j0 = F.junction(), fwd = F.junction(17, 17, 0.7), rev = F.junction(17, 17, -3);
  near(j0.Vbi, 0.833, 0.001); assert.equal(j0.state, 'near'); assert.equal(fwd.state, 'forward'); assert.equal(rev.state, 'reverse');
  assert.ok(rev.W > j0.W && j0.W > fwd.W, 'the depletion region widens when reverse biased');
  assert.ok(fwd.I > 1e-3 && Math.abs(rev.I) < 1e-12);
  assert.ok(F.junction(18, 18).Vbi > j0.Vbi);
  const off = F.mosfet(0.2, 0.5), on = F.mosfet(1, 0.5);
  assert.equal(off.state, 'off'); assert.equal(on.state, 'on'); assert.ok(on.Id > off.Id * 1e5);
  assert.ok(F.mosfet(1, 0.8).Id > F.mosfet(1, 0.1).Id && on.channel > off.channel);
});

test('implant: boron at 2 keV goes about 3 times deeper in a furnace than with a laser (101 nm and 36 nm)', () => {
  const fur = F.implant({ ion: 'B', energy: 2, anneal: 'furnace' }), las = F.implant({ ion: 'B', energy: 2, anneal: 'laser' });
  near(fur.xj, 101, 1); near(las.xj, 36, 1); assert.ok(fur.xj / las.xj > 2.5);
  assert.equal(F.met('furnace', [fur]), false); assert.equal(F.met('furnace', [las]), false);
  assert.equal(F.met('furnace', [fur, las]), true);
  assert.equal(F.met('furnace', [F.implant({ ion: 'B', energy: 3, anneal: 'furnace' }), las]), false);
});

test('implant: more energy goes deeper, the longer anneal spreads further, and the default is not the shallow goal', () => {
  const at = e => F.implant({ ion: 'As', energy: e, anneal: 'none' });
  assert.ok(at(20).Rp > at(2).Rp * 5 && at(20).spread0 > at(2).spread0);
  const xj = a => F.implant({ ion: 'As', energy: 2, anneal: a }).xj;
  assert.ok(xj('furnace') > xj('spike') && xj('spike') > xj('laser'));
  assert.ok(F.implant({ ion: 'B', energy: 10 }).Rp > F.implant({ ion: 'As', energy: 10 }).Rp, 'a light ion goes deeper');
  assert.equal(F.implant({ dose: 1e16 }).amorphous, true); assert.equal(F.implant({ dose: 1e13, ion: 'B' }).amorphous, false);
  assert.ok(F.implant({ anneal: 'none' }).activePct < 5 && F.implant({ anneal: 'laser' }).activePct > 90);
  const def = F.implant();                                                          // arsenic, spike, 11 keV, 1e15
  near(def.energy, 11.2, 0.1); assert.equal(F.met('shallow', [def]), false);
  assert.equal(F.met('shallow', [F.implant({ ion: 'As', energy: 2, anneal: 'spike' })]), false);   // 12.5 nm but only 92% on
  assert.equal(F.met('shallow', [F.implant({ ion: 'B', energy: 2, anneal: 'laser' })]), false);    // not n-type
  const win = F.implant({ ion: 'As', energy: 2, anneal: 'laser' });
  near(win.xj, 9, 0.5); assert.equal(win.activePct, 99); assert.equal(F.met('shallow', [win]), true);
  assert.deepEqual(win.notes.slice(-2), ['laser', 'shallow']);
});

/* ---- the fab ---- */
test('etch: the same seed gives the same hole; the defaults undercut and only straight ions pass the challenge', () => {
  const a = F.etchRun({}, 1), b = F.etchRun({}, 1);
  assert.deepEqual([...a.g], [...b.g]); assert.equal(a.frames, b.frames);
  assert.notDeepEqual([...F.etchRun({}, 2).g], [...a.g]);
  assert.ok(a.done && a.depthNm > 100 && a.undercutNm > 8 && a.status === 'undercut');   // 85% ions, 30% radicals
  assert.equal(F.met('etch', [a]), false);
  const good = F.etchRun({ ions: 100, chem: 0 }, 1);
  assert.ok(good.undercutNm < 5 && good.maskPct >= 70 && good.depthNm > 100 && good.status === 'straight');
  assert.equal(F.met('etch', [good]), true);
  const radicals = F.etchRun({ ions: 100, chem: 90 }, 1), wide = F.etchRun({ ions: 0, chem: 0 }, 1);
  assert.ok(radicals.undercutNm > good.undercutNm * 5, 'radicals eat sideways');
  assert.ok(wide.undercutNm > good.undercutNm, 'a wide cone of ions undercuts too');
  const s0 = F.etchStart(1); assert.deepEqual([s0.depthNm, s0.undercutNm, s0.maskPct, s0.status], [0, 0, 100, 'ready']);
  const s1 = F.etchStep(s0, 1); assert.equal(s0.frames, 0); assert.equal(s1.frames, 1);
  const parts = F.etchStep(F.etchStep(s0, 2), 3), whole = F.etchStep(s0, 5);          // stopping and resuming changes nothing
  assert.deepEqual([...parts.g], [...whole.g]);
});

test('deposition: CVD starves the bottom of a deep trench and traps a void; ALD coats evenly but takes about 20 times longer', () => {
  const c2 = F.depoRun({ mode: 'cvd', ar: 2 }), a2 = F.depoRun({ mode: 'ald', ar: 2 });
  assert.ok(c2.coveragePct < 5 && c2.coveragePct >= 3, 'about 4% at 2:1: ' + c2.coveragePct);
  assert.equal(a2.coveragePct, 100); assert.equal(a2.status, 'filled'); assert.equal(a2.cycles, 240);
  near(a2.time / c2.time, 20, 1); near(a2.top, 24, 1e-9);
  assert.ok(F.depoRun({ mode: 'cvd', ar: 1 }).coveragePct > c2.coveragePct, 'a shallower trench is covered better');
  assert.ok(F.depoRun({ mode: 'cvd', ar: 12 }).coveragePct <= c2.coveragePct);
  assert.equal(F.depoRun({ mode: 'cvd', ar: 6 }).status, 'void');
  const s0 = F.depoStart({ mode: 'ald', ar: 6 }); assert.equal(s0.coveragePct, null); assert.equal(s0.coverage, 1);
  const s1 = F.depoStep(s0); assert.equal(s0.top, 0); assert.ok(s1.top > 0);
  /* the challenge needs both methods: the default (CVD, 6:1) alone does not do it */
  assert.equal(F.met('bottom', [F.depoRun()]), false);
  assert.equal(F.met('bottom', [F.depoRun({ mode: 'cvd', ar: 3 }), F.depoRun({ mode: 'ald', ar: 3 })]), true);
  assert.equal(F.met('bottom', [F.depoRun({ mode: 'cvd', ar: 3 }), F.depoRun({ mode: 'ald', ar: 1 })]), false);
});

test('overlay: the budget is a fraction of a nanometer; shift alone kills; the default fails', () => {
  const d = F.overlay(); assert.equal(d.verdict, 'fail'); assert.ok(d.failed > 1e6);
  assert.ok(F.overlay({ shift: 0, sigma: 0.5 }).failed < F.overlay({ shift: 0, sigma: 0.7 }).failed);
  assert.ok(F.overlay({ shift: 2, sigma: 0.2 }).failed < 1e-6, 'a 2 nm shift is fine with a tiny spread');
  assert.ok(F.overlay({ shift: 2, sigma: 0.8 }).failed > 1e4, 'a 2 nm shift with an ordinary spread');
  assert.equal(F.overlay({ shift: 0, sigma: 0.2 }).verdict, 'ok'); assert.equal(F.overlay({ shift: 0, sigma: 0.7 }).verdict, 'fail');
  assert.equal(F.overlay({ shift: -1, sigma: 1 }).p, F.overlay({ shift: 1, sigma: 1 }).p, 'symmetric');
  near(F.erfc(0), 1, 1e-6); near(F.erfc(1), 0.157299, 1e-5); near(F.erfc(-1), 2 - 0.157299, 1e-5);
  assert.equal(F.overlay({ shift: 0, sigma: 0.65 }).failed > 0.9 && F.overlay({ shift: 0, sigma: 0.65 }).failed < 1.1, true);
  assert.equal(F.met('vias', [d]), false);
  assert.equal(F.met('vias', [F.overlay({ shift: 0, sigma: 0.65 }), F.overlay({ shift: 2, sigma: 0.65 })]), true);
  assert.equal(F.met('vias', [F.overlay({ shift: 0, sigma: 0.7 }), F.overlay({ shift: 2, sigma: 0.65 })]), false);
  assert.equal(F.OVERLAY_Z.length, 40);
});

test('cleanroom: each class holds 100 times fewer particles than the next but one; ISO 5 is the start', () => {
  const c = i => F.cleanroom(i);
  assert.equal(F.CLEAN_CLASSES[F.CLEAN_DEFAULT].id, 'iso5');
  assert.equal(c(2).perM3, 1e5); assert.equal(c(2).perL, 100); assert.equal(c(0).litresPerParticle, 100);
  assert.ok(c(0).perM3 < c(1).perM3 && c(1).perM3 < c(2).perM3 && c(3).perM3 < c(4).perM3);
  assert.equal(c(4).shown, 2500);
  near(F.isoLimit(5, 0.5), 1e5 * Math.pow(0.2, 2.08), 1e-6);
  assert.equal(F.airParticles(2).length, 100); assert.deepEqual(F.airParticles(3).slice(0, 5), F.airParticles(3).slice(0, 5));
  assert.ok(F.airParticles(2).every(p => p.x >= 0 && p.x < 1 && p.v > 0));
});

test('inspection: every wafer holds one defect only its own die shows, and comparing finds it', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const w = F.inspectionWafer(seed), d = w.defect;
    assert.ok(d && F.INSPECT_TYPES.includes(d.type), 'seed ' + seed);
    const flagged = [0, 1, 2].map(k => F.inspectCompare(w, k));
    assert.ok(flagged[d.di].length >= 3);
    assert.equal(flagged.filter(f => f.length).length, 1, 'only the bad die disagrees with both others');
    assert.ok(F.inspectGuess(w, d.di, d.x, d.y));
    assert.ok(!F.inspectGuess(w, d.di, d.x + 20, d.y) && !F.inspectGuess(w, (d.di + 1) % 3, d.x, d.y));
  }
  assert.deepEqual(F.inspectionWafer(4).defect, F.inspectionWafer(4).defect);
  assert.notDeepEqual(F.inspectionWafer(4).dies[0], F.inspectionWafer(5).dies[0]);
});

test('the loop: ten steps build one layer, ending flat with metal only in the trenches', () => {
  assert.equal(F.LOOP_STEPS.length, 10); assert.equal(F.LOOP_STEPS[F.LOOP_START], 'etch');
  const done = F.layerAt(9, 1);
  assert.deepEqual([done.film, done.resist, done.depth, done.fill, done.over], [1, 0, 1, 1, 0]);
  const etched = F.layerAt(5, 1); assert.deepEqual([etched.resist, etched.depth, etched.open], [1, 1, 0]);
  const half = F.layerAt(4, 0.5); assert.ok(half.open === 0.5 && half.expo === 1);
  for (const k of ['film', 'depth', 'fill']) for (let s = 0; s < 9; s++) assert.ok(F.layerAt(s + 1, 0)[k] >= F.layerAt(s, 1)[k] - 1e-12, k + ' step ' + s);
  assert.ok(F.layerAt(7, 1).over === 1 && F.layerAt(8, 0.5).over === 0.5);
});

/* ---- lithography ---- */
test('lithography: the first version starts on EUV at a 14 nm half pitch and prints it', () => {
  const r = F.litho();
  near(r.hp, 14, 0.01); near(r.p, 28, 0.02); near(r.k1, 0.342, 0.001); assert.equal(r.status, 'ok'); assert.equal(r.masks, 1);
  assert.equal(r.na, 0.33); assert.equal(r.lam, 13.5); assert.ok(r.contrast > 0.35);
  near(F.rayleigh(0.25, 13.5, 0.33), 10.23, 0.01); near(F.k1Of(10.23, 0.33, 13.5), 0.25, 0.001);
  near(F.hpOfSlider(0), 5, 1e-9); near(F.hpOfSlider(1000), 200, 1e-9);
  assert.ok(F.resistLines(r).length >= 3);
});

test('lithography: shorter light and a bigger lens print finer lines; off-axis light helps; k1 stays near 0.25', () => {
  const ok = (src, hp, o = {}) => F.litho({ src, hp, ...o }).status !== 'bad';
  assert.ok(!ok('euv', 7) && ok('high-na', 7), 'higher NA resolves what EUV cannot');
  assert.ok(ok('arf-imm', 40, { illum: 'dipole' }) && !ok('arf-imm', 40, { illum: 'conventional' }), 'off-axis light prints finer');
  const finest = F.SOURCES.map(s => F.finestHalfPitch(s.id));
  for (let i = 1; i < finest.length; i++) assert.ok(finest[i] < finest[i - 1], F.SOURCES[i].id + ' should print finer than ' + F.SOURCES[i - 1].id);
  for (let i = 0; i < 6; i++) { const s = F.SOURCES[i]; near(F.k1Of(finest[i], F.naOf(s, 9), s.lam), 0.25, 0.01, s.id); }
  assert.ok(F.finestHalfPitch('euv') > 10 && F.finestHalfPitch('euv') < 10.5);
  assert.equal(F.litho({ src: 'euv', na: 0.9 }).na, 0.33, 'the NA of an EUV machine is fixed');
  assert.equal(F.litho({ src: 'krf', na: 2 }).na, 0.93, 'a lens has a largest NA');
  assert.equal(F.litho({ src: 'arf-imm', hp: 100, dp: true }).masks, 2);
  assert.ok(F.litho({ hp: 5 }).caught <= 2 && F.litho({ src: 'arf-imm', hp: 100, illum: 'conventional' }).caught > 2, 'bigger pitches let more orders in');
  assert.equal(F.litho({ src: 'euv', hp: 7 }).status, 'bad'); assert.ok(Number.isNaN(F.litho({ src: 'euv', hp: 7 }).widthErr));
});

test('lithography: the challenge to print the finest lines needs every scanner printed near its limit', () => {
  const at = (src, hp) => F.litho({ src, hp, na: 9, illum: 'dipole' });
  assert.equal(F.met('litho-finest', [F.litho()]), false);
  const best = F.SOURCES.map(s => { for (const illum of ['dipole', 'conventional']) for (const dp of [false, true]) { const r = F.litho({ src: s.id, na: 9, hp: F.finestHalfPitch(s.id), illum, dp }); if (r.status !== 'bad') return r; } return null; });
  assert.ok(best.every(Boolean));
  assert.equal(F.met('litho-finest', best), true);
  assert.equal(F.met('litho-finest', best.slice(0, -1)), false);
  assert.equal(F.met('litho-finest', [...best.slice(0, -1), at('hyper-na', 30)]), false, 'printing coarse lines is not the finest');
});

test('EUV scanner: 600 W gives about 230 wafers an hour; more power, better mirrors or less dose all print faster; 330 is out of reach', () => {
  const d = F.euv();
  near(d.wph, 230, 3); near(d.atWaferPct, 0.7 ** 11 * 100, 1e-9); near(d.atWafer, 11.86, 0.01); assert.equal(d.wphRounded, 232);
  const w = o => F.euv(o).wph;
  assert.ok(w({ power: 1000 }) > w({ power: 600 }) && w({ reflect: 0.72 }) > w({ reflect: 0.7 }) && w({ mirrors: 8 }) > w({ mirrors: 14 }) && w({ dose: 20 }) > w({ dose: 50 }));
  assert.ok(F.euv({ dose: 20 }).noisePct > d.noisePct, 'less dose, more photon noise');
  near(d.photonsPerNm2, 33.9, 0.01);
  const best = F.euvBest(); assert.ok(best.wph > 275 && best.wph < 330, 'best ' + best.wph);
  assert.ok(F.euv({ power: 1000 }).exposeSec + F.EUV.overheadSec > 12.6, 'the 12.6 s overhead is a floor: 3600 / 12.6 = 285');
  assert.ok(w({ power: 1e9, reflect: 1, mirrors: 1, dose: 1 }) < 3600 / 12.6);
  assert.equal(F.met('euv-1000', [d]), false);
  assert.equal(F.met('euv-1000', [F.euv({ power: 1000 })]), false);                // 1,000 W with the default optics is not enough
  assert.equal(F.met('euv-1000', [best]), true);
  assert.equal(F.met('euv-1000', [F.euv({ power: 600, reflect: 0.72, mirrors: 8, dose: 15 })]), false, 'the source must be turned up');
});

test('EUV scanner: the photons are random, seeded, and the holes spread more at low dose', () => {
  const a = F.euvExpose({ dose: 20 }, 3), b = F.euvExpose({ dose: 20 }, 3);
  assert.deepEqual([...a.printed], [...b.printed]); assert.deepEqual(a.area, b.area);
  assert.notDeepEqual(F.euvExpose({ dose: 20 }, 4).area, a.area);
  const spread = dose => { const v = []; for (let s = 1; s <= 12; s++) v.push(...F.euvExpose({ dose }, s).area); const m = v.reduce((x, y) => x + y) / v.length; return Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length); };
  assert.ok(spread(15) > spread(80), 'edges get rougher as the dose falls');
  const m = F.euvExpose({}, 1); assert.equal(m.area.length, 9); assert.ok(m.area.every(x => x > 150 && x < 260)); assert.equal(m.bad, 0);
  assert.ok(F.euvExpose({ dose: 2 }, 2).bad > 0, 'at a tiny dose holes fail');
  /* within the scanner's own range of doses the price of little light shows: most samples at the smallest dose hold a
     hole out of spec, hardly any at the largest */
  const R = F.EUV_RANGE.dose, withBad = dose => { let n = 0; for (let sd = 1; sd <= 40; sd++) if (F.euvExpose({ dose }, sd).bad > 0) n++; return n; };
  assert.ok(withBad(R[0]) >= 30, 'at the smallest dose most samples show a hole out of spec'); assert.ok(withBad(R[1]) <= 2, 'at the largest dose hardly any');
});

/* ---- words and facts ---- */
test('every challenge has its words, every word is named fab.*, and the fact ids exist', () => {
  assert.equal(F.CHALLENGES.length, 9);
  for (const c of F.CHALLENGES) {
    for (const k of ['t', 'goal', 'done']) assert.ok(has('fab.ch.' + c.id + '.' + k), c.id + ' ' + k);
    assert.ok(c.groups.length && c.groups.every(g => typeof g === 'function'));
    assert.equal(F.met(c.id, []), false, c.id + ' is not met by nothing');
  }
  for (const [k, v] of Object.entries(F.WORDS)) { assert.ok(k.startsWith('fab.'), k); assert.equal(typeof v, 'string'); assert.ok(v.length > 0); }
  assert.equal(F.met('nope', []), false);
  for (const id of F.PULL_PHASES) assert.ok(has('fab.puller.phase.' + id));
  for (const id of F.LOOP_STEPS) for (const k of ['t', 'text', 'gear']) assert.ok(has('fab.loop.' + id + '.' + k), id);
  for (const s of F.SOURCES) assert.ok(has('fab.litho.src.' + s.id) && has('fab.litho.era.' + s.id));
  for (const id of F.ION_IDS) assert.ok(has('fab.implant.ion.' + id));
  for (const a of F.ANNEALS) assert.ok(has('fab.implant.anneal.' + a) && has('fab.implant.note.' + a));
  for (const c of F.CLEAN_CLASSES) assert.ok(has('fab.clean.' + c.id) && has('fab.clean.name.' + c.id));
  for (const k of ['neckfail', 'shock', 'done', 'neck', 'shoulder', 'thin', 'wide', 'ok', 'tail']) assert.ok(has('fab.puller.msg.' + k), k);
  for (const ids of Object.values(F.FACT_IDS)) for (const id of ids) assert.ok(facts.includes(id), id);
});

test('the models give plain data: no English in what they return', () => {
  const english = /[a-z]{3,} [a-z]{3,}/;
  for (const r of [F.pullStart(), F.implant(), F.litho(), F.euv(), F.overlay(), F.depoStart(), F.cleanroom(), F.siliconPure(), F.junction(), F.mosfet()]) {
    for (const [k, v] of Object.entries(r)) if (typeof v === 'string') assert.ok(!english.test(v), k + ': ' + v);
  }
});
