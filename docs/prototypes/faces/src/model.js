/* The model: one architecture, seen four ways.
   - carry(): the anatomy. Each rung is made of the one below. The switch is the lab's own switch engine (switchOf);
     everything above it is this page's model, an idea drawn (first written for the "Your stack" prototype).
   - A recipe (four genes of src/engines/arch.js) is a set of fork choices in the stack. A forked rung hands up the
     contract of the rung it replaces, its energy divided by the architecture engine's own factor for that fork
     (EFFECT): a guess, and marked so.
   - Growth, the six needs, the agents' forks and the family tree are the lab's architecture engine, unchanged.
   - The population: the ten recipes someone has built (KNOWN), the two attempts of the community's ledger, grown
     again with replay(), the agents' attempts run in this browser, and yours. */
import * as A from '../../../../src/engines/arch.js';
import * as SW from '../../../../src/engines/switch.js';
import { E16 } from '../../../../src/engines/paradigms.js';
import { STR, t } from './strings.js';
export { A, SW };

export const RUNGS = ['matter', 'switch', 'gate', 'sums', 'memory', 'core', 'machine', 'mind'];
export const GENE_OF = { matter: 'carrier', switch: 'carrier', gate: 'carrier', memory: 'where', core: 'told', machine: 'shape' };
export const GENE_AT = { carrier: [0, 2], where: [4, 4], told: [5, 5], shape: [6, 6] };          // the rungs a gene chooses
export const RUNG_DIR = { matter: 'making', switch: 'device', gate: 'device', sums: 'errors', memory: 'memory', core: 'tools', machine: 'memory', mind: 'tools' };
export const EXAMPLE = { mat: 'si', shape: 'fin', mech: 'therm', V: 0.70, lib: 'nand', adder: 'ripple', vote: 0, regs: 32, stages: 1, ui: 1, bits: 8, care: 1, clk: 500, step: 5 };
export const CARE = { sig: [1.7, 1, 0.7], dust: [2, 0.5, 0.1] };   /* the line's care: the copies' spread against the engine's, and specks of dust per cm² (an idea drawn) */
export const FINE_OF = { matter: ['mat'], switch: ['shape', 'mech', 'V', 'care'], gate: ['lib'], sums: ['adder', 'vote', 'clk'], memory: ['regs'], core: ['stages'], machine: ['ui'], mind: ['bits'] };
export const UNITS = { few: [1, 4, 8], grid: [16, 64, 256], stack: [8, 16, 32], swarm: [100, 1000, 10000] };
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- words for numbers ---------- */
export function fmtX(x) { return !isFinite(x) ? '—' : x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x >= 0.1 ? x.toFixed(2) : x >= 0.01 ? x.toFixed(3) : x.toExponential(0).replace('e-', '×10⁻').replace(/⁻(\d)/, (_, d) => '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]); }
export const times = x => '×' + fmtX(x);
export function fmtT(ps) { return ps < 1000 ? ps.toFixed(ps < 10 ? 1 : 0) + ' ps' : ps < 1e6 ? (ps / 1000).toFixed(ps < 1e4 ? 2 : 1) + ' ns' : (ps / 1e6).toFixed(1) + ' µs'; }
export function fmtE(J) { const u = [[1, 'J'], [1e-3, 'mJ'], [1e-6, 'µJ'], [1e-9, 'nJ'], [1e-12, 'pJ'], [1e-15, 'fJ'], [1e-18, 'aJ']]; for (const [k, n] of u) if (J >= k) { const v = J / k; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + n; } return J.toExponential(1) + ' J'; }
export function fmtF(hz) { return hz >= 1e9 ? (hz / 1e9).toFixed(2) + ' GHz' : hz >= 1e6 ? (hz / 1e6).toFixed(0) + ' MHz' : (hz / 1e3).toFixed(0) + ' kHz'; }
export function fmtN(n) { const N = STR.num; return n >= 1e12 ? (n / 1e12).toFixed(1) + ' ' + N.trillion : n >= 1e9 ? (n / 1e9).toFixed(1) + ' ' + N.billion : n >= 1e6 ? (n / 1e6).toFixed(1) + ' ' + N.million : n >= 1e3 ? (n / 1e3).toFixed(1) + ' ' + N.thousand : n.toFixed(0); }
export function fmtP(W) { return W >= 1000 ? (W / 1000).toFixed(1) + ' kW' : W >= 1 ? W.toFixed(1) + ' W' : W >= 1e-3 ? (W * 1e3).toFixed(W < 0.01 ? 2 : 0) + ' mW' : (W * 1e6).toFixed(0) + ' µW'; }
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = n => String(n).split('').map(c => SUP[+c]).join('');
export function oneIn(p) { if (!(p > 0) || p < 1e-18) return STR.num.lessThan; if (p >= 0.4) return STR.num.half; if (p > 0.01) return t(STR.num.oneIn, { n: Math.round(1 / p) }); return t(STR.num.oneIn, { n: '10' + sup(Math.round(-Math.log10(p))) }); }
export const pct = m => (m >= 0.995 ? '100%' : m >= 0.1 ? Math.round(m * 100) + '%' : m >= 0.01 ? (m * 100).toFixed(1) + '%' : (m * 100).toFixed(2) + '%');

/* ---------- the carry: each rung made of the one below ---------- */
const T0 = 15, EG0 = 1, VREF = 0.70;           // ps and fJ for one gate of today's silicon fin at 0.70 V (an idea drawn)
const SI = SW.switchOf({ mat: 'si', shape: 'fin', mech: 'therm' });
export function Irel(sw, V) { const s = sw.swing / 1000 / Math.LN10, h = (V - sw.vt) / (2 * s), l = h > 30 ? h : Math.log1p(Math.exp(h)); return sw.ion * l * l; }
const IREF = Irel(SI, VREF);
function Q(z) {
  if (z > 3) { const z2 = z * z; return Math.exp(-z2 / 2) / (z * Math.sqrt(2 * Math.PI)) * (1 - 1 / z2 + 3 / (z2 * z2)); }
  if (z < -3) return 1 - Q(-z);
  const u = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), y = u * (0.254829592 + u * (-0.284496736 + u * (1.421413741 + u * (-1.453152027 + u * 1.061405429)))) * Math.exp(-z * z / 2);
  return z >= 0 ? y / 2 : 1 - y / 2;
}
const fails = (p, n) => (n * p < 1e-6 ? n * p : 1 - Math.pow(1 - Math.min(p, 1), n));
const ACC = [[1, 0.86], [2, 0.93], [4, 0.965], [8, 0.972]];
function baseAcc(b) { const x = Math.log2(clamp(b, 1, 8)); for (let i = 1; i < ACC.length; i++) { const x0 = Math.log2(ACC[i - 1][0]), x1 = Math.log2(ACC[i][0]); if (x <= x1) return ACC[i - 1][1] + (ACC[i][1] - ACC[i - 1][1]) * (x - x0) / (x1 - x0); } return ACC[3][1]; }
const IPM = { 1: 0.15, 2: 0.6, 4: 1.5, 8: 3.5 };   // instructions per multiply-add on a core with no multiplier
export const MACS = 64 * 16 + 16 * 10;             // a small network: 8×8 pixels, 16 hidden, 10 digits
const traitWords = e => ['energy', 'exact', 'flex', 'rugged', 'adapt'].filter(k => e[k] != null).map(k => [STR.f[k === 'energy' ? 'less' : k], times(e[k]), e[k] < 0.5 && k !== 'energy']);

export function carry(F, g, aim) {
  const f = STR.f, R = { broken: null, fig: {}, way: {}, fid: {}, fork: {}, g, aim };
  const one = k => A.traitsOf(Object.assign({}, A.TODAY, { [k]: g[k] }), aim);
  const eC = one('carrier').energy, eW = one('where').energy, eT = one('told').energy, eS = one('shape').energy;
  const TR = R.traits = A.traitsOf(g, aim), charge = g.carrier === 'charge';
  for (const r of RUNGS) R.fork[r] = GENE_OF[r] ? g[GENE_OF[r]] !== A.TODAY[GENE_OF[r]] : false;
  let d = 1, e = 1, p = 0, pair = true, V = F.V;
  if (charge) {
    const spec = SW.normal({ mat: F.mat, shape: F.shape, mech: F.mech }), M = SW.MATERIALS.find(m => m.id === spec.mat), sw = SW.switchOf(spec);
    R.M = M; R.sw = sw; R.spec = spec; R.V = V;
    R.fig.matter = [[f.gap, M.eg.toFixed(2) + ' eV', M.eg < 0.3], [f.electrons, M.me.toLocaleString('en') + ' cm²/Vs'], [f.holes, M.mh ? M.mh.toLocaleString('en') + ' cm²/Vs' : f.none, !M.mh]];
    R.fid.matter = 'figures'; R.way.matter = STR.mat[M.id];
    R.way.switch = STR.shape[spec.shape] + ' · ' + STR.mech[spec.mech] + ' · ' + V.toFixed(2) + ' V'; R.fid.switch = 'computed';
    if (!sw.clean) { R.broken = 'switch'; R.fig.switch = [[f.turnsOff, f.never, true], [f.swing, sw.swing.toFixed(0) + ' mV'], [f.vmin, '—', true]]; }
    else {
      const vtb = sw.vt - 3 * sw.sigma / 1000, z = 6 * (V - vtb) / (sw.vmin - vtb) / CARE.sig[F.care];
      p = V <= vtb ? 0.5 : Math.min(0.5, Q(z)); d = (V / VREF) * IREF / Math.max(Irel(sw, V), 1e-30); e = Math.pow(V / VREF, 2); pair = sw.pair;
      R.fig.switch = [[f.vmin, sw.vmin.toFixed(2) + ' V', V < sw.vmin], [f.swing, sw.swing.toFixed(0) + ' mV'], [f.speed, times(1 / d), d > 3]];
      const fm = SW.forMachines(spec); R.stone = fm.makeable && fm.energy < 1 - 1e-9;
    }
  } else {
    const fk = STR.fork[g.carrier], kn = A.KNOWN.find(k => k.g.carrier === g.carrier);
    R.fig.matter = traitWords(A.EFFECT.carrier[g.carrier]).slice(0, 3); R.fid.matter = 'guess'; R.way.matter = fk.matter;
    R.fig.switch = [[f.builtAs, kn ? STR.st[kn.status] : '—'], [f.engine, f.notYet], [f.less + ', ' + f.once, times(eC)]]; R.fid.switch = 'guess'; R.way.switch = fk.switch;
    e = 1 / eC;
  }
  R.p = p; R.d = d; R.e = e;
  if (R.broken) { for (const r of RUNGS.slice(2)) { R.fig[r] = [[STR.tag.cannot, '', true]]; R.fid[r] = 'idea'; R.way[r] = ''; } return R; }
  /* gate */
  const rich = F.lib === 'rich', tg = T0 * d * (rich ? 1.15 : 1), Eg = EG0 * e * (pair ? 1 : 4) * (rich ? 1.1 : 1);
  R.gate = { tg, Eg, p };
  R.fig.gate = [[f.delay, fmtT(tg)], [f.energy, fmtE(Eg * 1e-15)], charge ? [f.wrong, oneIn(p), p > 1e-12] : [f.exact, times(A.EFFECT.carrier[g.carrier].exact || 1), (A.EFFECT.carrier[g.carrier].exact || 1) < 0.5]];
  R.fid.gate = charge ? 'idea' : 'guess'; R.way.gate = charge ? STR.lib[F.lib] : STR.fork[g.carrier].gate;
  /* sums */
  const faG = rich ? 5 : 9, faE = rich ? 8 : 9;
  let addG = 32 * faG, addD = F.adder === 'ripple' ? 2 * 32 + 3 : 2 * 5 + 4;
  if (F.adder === 'look') addG += 32 * 5 * 3;
  let aluG = addG + 32 * 6, aluD = (addD + 2) * tg, aluE = (32 * faE + (F.adder === 'look' ? 480 : 0) + 192) * 0.25 * Eg, Pw = fails(p, aluG * 0.5);
  if (F.vote) { const pv = fails(p, 32 * 4); Pw = Math.min(1, 3 * Pw * Pw + pv); aluG = aluG * 3 + 128; aluD += 2 * tg; aluE = aluE * 3 + 128 * 0.25 * Eg; }
  R.sums = { aluG, aluD, aluE, Pw };
  R.fig.sums = [[f.alu, fmtT(aluD)], [f.energy, fmtE(aluE * 1e-15)], [f.wrongOps, oneIn(Pw), Pw > 1e-9]];
  R.fid.sums = charge ? 'idea' : 'guess'; R.way.sums = STR.adder[F.adder] + (F.vote ? ' · ' + STR.vote[1].toLowerCase() : '');
  /* memory */
  const RG = F.regs, fileG = RG * 32 * 10 + 2 * 32 * (RG - 1), lg = Math.log2(RG), wire = 0.02 * Math.sqrt(fileG) * tg, readD = (2 * lg + 2) * tg + wire;
  const readE = (32 * lg * 2 + 32 * 10 * 0.1) * 0.25 * Eg + Math.sqrt(fileG) * 0.04 * Eg, Pr = fails(p, 32 * lg * 2 * 0.5);
  R.memory = { RG, fileG, readD, readE, wireShare: wire / readD, Pr };
  R.fig.memory = [[f.read, fmtT(readD)], [f.wires, t(f.ofTime, { p: Math.round(100 * wire / readD) }), wire / readD > 0.2], R.fork.memory ? [f.less + ', ' + f.once, times(eW)] : [f.gates, Math.round(fileG).toLocaleString('en')]];
  R.fid.memory = R.fork.memory ? 'guess' : 'idea'; R.way.memory = R.fork.memory ? STR.opt.where[g.where][0].toLowerCase() : RG + ' ' + STR.ctl.regs.toLowerCase();
  /* core */
  const prog = g.told === 'program', SG = prog ? F.stages : 1, path = readD + 6 * tg + aluD + 2 * tg, period = Math.max(SG === 1 ? path : path / SG + 6 * tg, 12 * tg);
  const fq = 1e12 / period, cpi = { 1: 1, 3: 1.12, 5: 1.25 }[SG], ctrlG = 1200, pipeG = SG > 1 ? SG * 128 * 10 : 0, coreG = aluG + fileG + ctrlG + pipeG;
  const Ei = (aluE + 3 * readE + ctrlG * 0.1 * Eg + pipeG * 0.25 * Eg + 2000 * 0.05 * Eg * (SG > 1 ? 1 : 0.6)) / eT;
  const q = Math.min(1, 1 - (1 - Pw) * Math.pow(1 - Pr, 2) * (1 - fails(p, ctrlG * 0.1)));
  R.core = { f: fq, cpi, coreG, Ei, q, period, SG };
  R.fig.core = [[f.clock, fmtF(fq)], [f.perInstr, fmtE(Ei * 1e-15)], [f.wrongInstr, oneIn(q), q > 1e-9]];
  R.fid.core = R.fork.core ? 'guess' : 'idea'; R.way.core = prog ? STR.stages[SG].toLowerCase() : STR.opt.told[g.told][0].toLowerCase();
  /* machine */
  const C = UNITS[g.shape][clamp(F.ui, 0, 2)], lat = g.where === 'far' ? 80 : 3, miss = 0.01, stall = miss * lat * fq / 1e9, ips = C * fq / (cpi + stall);
  const Ef = 2 * E16.dram, think = Ei * 1e-3 / eS, move = miss * Ef / (eW * eS), Emi = think + move, P = ips * Emi * 1e-12, moveShare = move / Emi;
  R.machine = { C, ips, Emi, P, moveShare };
  { const Ar = C * coreG * 1e-5, Dd = CARE.dust[F.care]; R.fab = { A: Ar, D: Dd, Y: Math.exp(-Dd * Ar), sig: CARE.sig[F.care], sigma: (R.sw ? R.sw.sigma : 12) * CARE.sig[F.care] }; R.time = { T: 1e6 / F.clk, slack: 1e6 / F.clk - aluD }; }
  R.fig.machine = [[f.ips, fmtN(ips)], [f.power, fmtP(P)], [f.moving, Math.round(100 * moveShare) + '%', moveShare > 0.6]];
  R.fid.machine = R.fork.machine || R.fork.memory ? 'guess' : 'idea'; R.way.machine = C.toLocaleString('en') + ' ' + STR.unit[g.shape];
  /* mind */
  const B = F.bits, instrA = MACS * IPM[B] + 200, fetches = Math.ceil(MACS * B / 32), aps = ips / instrA;
  const Ea = instrA * think + fetches * Ef * 0.25 / (eW * eS), lam = q * instrA, bEff = Math.max(1, B + Math.log2(TR.exact));
  const acc = 0.1 + (baseAcc(bEff) - 0.1) * Math.exp(-lam / 8);
  R.mind = { aps, Ea, acc, lam, B, instrA, bEff };
  R.fig.mind = [[f.right, (acc * 100).toFixed(1) + '%', acc < 0.9], [f.perAnswer, fmtE(Ea * 1e-12)], [f.aps, fmtN(aps)]];
  R.fid.mind = A.novelty(g) ? 'guess' : 'idea'; R.way.mind = B + ' ' + STR.ctl.bits.toLowerCase();
  return R;
}
export const X0 = carry(EXAMPLE, A.TODAY, 'any');

/* ---------- where the questions bite: at most three marks, one per question ---------- */
export function marksOf(R, F, g) {
  const m = [], H = STR.here, add = (rung, id, w, here, at) => m.push({ rung, id, w, here, at });
  if (g.carrier === 'charge') add('matter', 'dig', 0.5, t(H.dig, { eg: R.M.eg.toFixed(2) }), [820, 150]);
  else { add('matter', 'dig', 1.2, t(H.digFork, { what: STR.opt.carrier[g.carrier][0].toLowerCase() }), [560, 150]); add('gate', 'physics', 3.2, H.physicsFork, [640, 150]); }
  if (R.broken) { add('switch', 'perfect', 9, H.perfectOff, [760, 150]); return m; }
  if (g.carrier === 'charge') {
    const sw = R.sw;
    if (F.mech !== 'therm' || F.V < sw.vmin + 0.1) add('switch', 'physics', F.mech !== 'therm' ? 4 : 3, F.mech !== 'therm' ? H.physicsNew : t(H.physicsLow, { v: sw.vmin.toFixed(2) }), [690, 150]);
    if (F.mat !== 'si' || F.shape !== 'fin') add('switch', 'moore', 3, H.moore, [300, 150]);
    if (R.p > 1e-12) add('gate', 'perfect', 8 + Math.log10(R.p + 1e-30) / 4, t(H.perfect, { v: F.V.toFixed(2), p: oneIn(R.p) }), [520, 150]);
  }
  if (F.vote || R.sums.Pw > 1e-9) add('sums', 'vn', F.vote ? 5 : 4, F.vote ? H.vnVote : t(H.vn, { p: oneIn(R.sums.Pw) }), [500, 160]);
  if (F.adder === 'look') add('sums', 'sutton', 2.5, H.sutton, [760, 160]);
  if (R.memory.wireShare > 0.12) add('memory', 'geo', 2 + R.memory.wireShare * 10, t(H.geoMem, { n: F.regs, p: Math.round(100 * R.memory.wireShare) }), [600, 150]);
  if (R.core.coreG > 12000) add('core', 'trust', 2, t(H.trust, { n: Math.round(R.core.coreG / 1000) }), [560, 160]);
  if (g.told === 'fixed') add('core', 'line', 3.4, H.lineFixed, [700, 160]);
  else if (g.told === 'learns') add('core', 'line', 3.4, H.lineLearns, [700, 160]);
  else if (R.core.SG === 5) add('core', 'line', 2, H.line5, [700, 160]);
  if (R.machine.moveShare > 0.5) add('machine', 'geo', 3 + R.machine.moveShare * 2, t(H.geo, { p: Math.round(100 * R.machine.moveShare) }), [680, 150]);
  if (R.mind.Ea < X0.mind.Ea * 0.5) add('machine', 'eff', 3.5, t(H.eff, { x: fmtX(X0.mind.Ea / R.mind.Ea) }), [330, 160]);
  if (g.carrier === 'living') add('mind', 'copy', 6.5, H.copyLive, [420, 160]);
  else if (F.bits <= 2 || R.mind.lam > 0.5) add('mind', 'copy', R.mind.lam > 0.5 ? 6 : 3, R.mind.lam > 0.5 ? H.copyErr : H.copyBits, [420, 160]);
  add('mind', 'human', 1.5, t(H.human, { a: (R.mind.acc * 100).toFixed(1), e: fmtE(R.mind.Ea * 1e-12) }), [600, 160]);
  return m.sort((a, b) => b.w - a.w);
}
export const topMarks = (ms, n = 3) => { const seen = new Set(), out = []; for (const m of ms) { if (seen.has(m.id)) continue; seen.add(m.id); out.push(m); if (out.length === n) break; } return out; };

/* ---------- every recipe, and where it stands on the sheet ---------- */
const mask = g => A.GENES.reduce((s, k, i) => s + (g[k] !== A.TODAY[k] ? 1 << i : 0), 0), ord = g => A.GENES.map(k => A.OPTIONS[k].indexOf(g[k])).join('');
export const RECIPES = A.allRecipes().map(g => ({ g, key: A.keyOf(g), d: A.novelty(g), known: A.knownOf(g) }))
  .sort((a, b) => a.d - b.d || mask(a.g) - mask(b.g) || (ord(a.g) < ord(b.g) ? -1 : 1));
RECIPES.forEach((r, i) => { r.i = i; });
export const RIDX = new Map(RECIPES.map(r => [r.key, r.i]));
export const BLOCK = [0, 1, 2, 3, 4].map(d => RECIPES.filter(r => r.d === d).map(r => r.i));
RECIPES.forEach(r => { r.slot = BLOCK[r.d].indexOf(r.i); });
export const NEEDS = A.NEEDS;
export const POT = NEEDS.map(n => RECIPES.map(r => A.potentialOf(r.g, n)));
export const CAN = NEEDS.map((n, ni) => POT[ni].filter(p => p > 0).length);
export const CELLCAN = NEEDS.map((n, ni) => [0, 1, 2, 3, 4].map(d => RECIPES.filter(r => r.d === d && POT[ni][r.i] > 0).length));
export const fxOf = (k, o) => { const e = A.EFFECT[k][o] || {}; return ['energy', 'flex', 'exact', 'rugged', 'adapt'].filter(x => e[x] != null).map(x => STR.f[x === 'energy' ? 'less' : x] + ' ' + times(e[x])).concat(e.idle ? [STR.f.idle] : []).join(' · '); };
export const bestNeed = g => { let b = 0, bi = -1; NEEDS.forEach((n, i) => { const p = A.potentialOf(g, n); if (p > b) { b = p; bi = i; } }); return bi; };
export function recipeName(g) { const k = A.knownOf(g); if (k) return STR.known[k.id]; return A.GENES.filter(x => g[x] !== A.TODAY[x]).map(x => STR.opt[x][g[x]][0]).join(STR.recipe.sep) || STR.recipe.today; }

/* ---------- the population ---------- */
const LEDGER = [
  { by: 'person', h: { start: 'near/charge/events/swarm', years: [['people', 'errors'], ['people', 'device'], ['people', 'errors'], ['people', 'tools'], ['people', 'memory'], ['people', 'making'], ['people', 'errors'], ['people', 'errors'], ['people', 'tools'], ['people', 'errors'], ['memory', 'making']], wins: ['rover'] } },
  { by: 'agent', h: { start: 'near/spikes/events/grid', years: [['people', 'device'], ['people', 'making'], ['people', 'errors'], ['making', 'device'], ['tools', 'memory']], changes: [{ at: 3, gene: 'carrier', option: 'charge' }], wins: ['wildfire'] } }
];
export const POP = [];
for (const k of A.KNOWN) POP.push({ key: A.keyOf(k.g), g: k.g, st: A.start(k.g), by: k.status, id: k.id });
for (const L of LEDGER) if (A.histOk(L.h)) { const r = A.replay(L.h); POP.push({ key: A.keyOf(r.st.g), g: r.st.g, st: r.st, by: 'ledger', who: L.by }); }
let seed = 20261127;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const SWEEP_YEARS = 25;
/* agents explore: recipes nobody has tried, at least two genes from today's, that could win some need once polished;
   each grown the way the ledger's own example plays it: people first for ten years, then the engine's suggestion */
export function explore(n, mineKey) {
  const tried = new Set(POP.map(a => a.key)); if (mineKey) tried.add(mineKey);
  const cands = RECIPES.filter(r => r.d >= 2 && !tried.has(r.key) && NEEDS.some((nd, i) => POT[i][r.i] >= 1)), out = [];
  for (let k = 0; k < n && cands.length; k++) out.push(agentGrow(cands.splice(Math.floor(rnd() * cands.length), 1)[0]));
  return out;
}
function agentGrow(r) {
  let st = A.start(r.g);
  for (let y = 0; y < SWEEP_YEARS; y++) { const s = A.suggest(st, 'archniche').dirs; st = A.year(st, y < 10 ? ['people', s[0]] : s); }
  const a = { key: r.key, g: r.g, st, by: 'agent', years: SWEEP_YEARS }; POP.push(a); return a;
}
/* the agents' attempts of an earlier visit, grown again: the same recipe and the same play give the same result */
export function regrow(keys) { for (const k of keys || []) if (RIDX.has(k) && !POP.some(a => a.key === k)) agentGrow(RECIPES[RIDX.get(k)]); }
/* the census: every plot of the sheet (need × recipe), who stands on it and how it scores, and each niche's champion */
export function census(mine) {
  const atts = POP.slice(); if (mine) atts.push(mine);
  const P = NEEDS.map(() => new Array(RECIPES.length).fill(null)), champ = NEEDS.map(() => [null, null, null, null, null]);
  let wins = 0; const triedKeys = new Set();
  for (const a of atts) {
    const ri = RIDX.get(a.key), sc = A.scoreOf(a.st), d = RECIPES[ri].d; a.sc = sc; triedKeys.add(a.key);
    let won = false;
    NEEDS.forEach((n, ni) => {
      if (!sc[n].can) return;
      const cur = P[ni][ri];
      if (!cur || a.mine || (!cur.a.mine && sc[n].now > cur.now)) P[ni][ri] = { a, now: sc[n].now, could: sc[n].could };
      if (sc[n].wins && d > 0) won = true;
    });
    if (won) wins++;
  }
  NEEDS.forEach((n, ni) => P[ni].forEach((e, ri) => { if (!e) return; const d = RECIPES[ri].d, c = champ[ni][d]; if (!c || e.now > c.now) champ[ni][d] = { ri, now: e.now }; }));
  return { P, champ, tried: triedKeys.size, wins };
}
