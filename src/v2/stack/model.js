/* Your stack, what the view reads (docs/PATH.md, step 4). Ported from the prototype by Claude Fable 5.2
   (docs/prototypes/stack/src/model.js), written for the lab by Claude Opus 5.5 in the nightly build. No model of its own:
   the carry is the lab's path engine (src/engines/path.js carry, stackOf), the growth, the needs, the agents' forks and
   the family tree the architecture engine (src/engines/arch.js), the switch the switch engine. Here only:
   - see(R): what each rung shows of the carry, as words and figures ([label, value, bad]), its way, its mark;
   - marksOf(R): where the core questions bite on your stack, weighed (at most three shown: topMarks), by their lab ids
     (src/data/frame.js QUESTIONS);
   - the sheet of every recipe (RECIPES, BLOCK, POT), the population (the built recipes, the attempts kept in the
     community's ledger, grown again by the engine, the agents' attempts run in this browser, and yours) and its census.
   No words are written here: every one is t('…'), in src/i18n/en/stack.json (sk.*) or an area the lab already has. */
import * as A from '../../engines/arch.js';
import * as SW from '../../engines/switch.js';
import * as P from '../../engines/path.js';
import { RUNGS, EXAMPLE } from '../../data/path.js';
import { t, fmtNum } from '../../core/i18n.js';
export { A, SW, P };

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/* the rung's name: the dive's own word for its level (depth.<id>.name); the machine, two levels of the dive, its own */
export const rungName = r => (r === 'machine' ? t('sk.machine') : t('depth.' + r + '.name'));
/* the direction of growth each rung is polished in (arch.js DIRS): its front edge is inked as far as that has come */
export const RUNG_DIR = { atom: 'making', switch: 'device', gate: 'device', block: 'errors', chip: 'tools', machine: 'memory', mind: 'tools' };
/* where each gene's bracket stands beside the stack, as indices from the bottom: the rungs it chooses, the place it is set
   from (src/data/path.js GENE_RUNGS; where it computes also sets the machine's memory) */
export const GENE_AT = { carrier: [0, 2], where: [3, 3], told: [4, 4], shape: [5, 5] };
export const GENE_OF = { atom: 'carrier', switch: 'carrier', gate: 'carrier', block: 'where', chip: 'told', machine: 'shape' };

/* ---------- numbers as words ---------- */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = n => String(n).split('').map(c => SUP[+c] || (c === '-' ? '⁻' : c)).join('');
export function fmtX(x) { return !isFinite(x) ? '—' : x >= 100 ? fmtNum(Math.round(x)) : x >= 10 ? x.toFixed(1) : x >= 0.1 ? x.toFixed(2) : x >= 0.01 ? x.toFixed(3) : '10' + sup(Math.round(Math.log10(x))); }
export const times = x => '×' + fmtX(x);
export function fmtT(s) { const ps = s * 1e12; return ps < 1000 ? ps.toFixed(ps < 10 ? 1 : 0) + ' ps' : ps < 1e6 ? (ps / 1000).toFixed(ps < 1e4 ? 2 : 1) + ' ns' : ps < 1e9 ? (ps / 1e6).toFixed(1) + ' µs' : (ps / 1e9).toFixed(1) + ' ms'; }
export function fmtE(J) { for (const [k, n] of [[1, 'J'], [1e-3, 'mJ'], [1e-6, 'µJ'], [1e-9, 'nJ'], [1e-12, 'pJ'], [1e-15, 'fJ'], [1e-18, 'aJ']]) if (J >= k) { const v = J / k; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + n; } return J.toExponential(1) + ' J'; }
export function fmtF(hz) { return hz >= 1e9 ? (hz / 1e9).toFixed(2) + ' GHz' : hz >= 1e6 ? (hz / 1e6).toFixed(0) + ' MHz' : hz >= 1e3 ? (hz / 1e3).toFixed(0) + ' kHz' : hz.toFixed(0) + ' Hz'; }
export const fmtN = n => (n >= 1 ? fmtNum(n, { notation: 'compact', maximumFractionDigits: 1 }) : n.toPrecision(2));
export function fmtP(W) { return W >= 1000 ? (W / 1000).toFixed(1) + ' kW' : W >= 1 ? W.toFixed(1) + ' W' : W >= 1e-3 ? (W * 1e3).toFixed(W < 0.01 ? 2 : 0) + ' mW' : (W * 1e6).toFixed(W < 1e-5 ? 2 : 0) + ' µW'; }
export function oneIn(p) { if (!(p > 0) || p < 1e-18) return t('sk.num.never'); if (p >= 0.4) return t('sk.num.half'); if (p > 0.01) return t('sk.num.oneIn', { n: Math.round(1 / p) }); return t('sk.num.oneIn', { n: '10' + sup(Math.round(-Math.log10(p))) }); }
export const pct = m => (m >= 0.995 ? '100%' : m >= 0.1 ? Math.round(m * 100) + '%' : m >= 0.01 ? (m * 100).toFixed(1) + '%' : (m * 100).toFixed(2) + '%');
const mob = v => fmtNum(Math.round(v)) + ' cm²/Vs';

/* ---------- the carry, through the lab's engine ---------- */
export const carry = (F, g, aim) => P.carry(P.stackOf(g, F, aim));
export const X0 = P.X0;
const optName = (k, o) => t('ar.opt.' + k + '.' + o);
/* what a fork's trait does, as figures: less energy, exact answers, jobs it takes, bears faults, adapts */
const traitFigs = e => ['energy', 'exact', 'flex', 'rugged', 'adapt'].filter(k => e[k] != null).map(k => [t('ar.tr.' + k), times(e[k]), e[k] < 0.5 && k !== 'energy']);
/* what each rung shows: { fig: { rung: [[label, value, bad]] }, way: { rung: words }, fid: { rung: { f, by, status? } }, dead } */
export function see(R) {
  const g = R.recipe, F = R.fine, fig = {}, way = {}, fid = {}, charge = !A.isFork('carrier', g.carrier), r = R.rungs;
  for (const k of RUNGS) fid[k] = r[k].fid;
  const passed = k => r[k].passed && !r[k].hands;
  if (charge) {
    const M = SW.MATERIALS.find(m => m.id === F.mat) || SW.ownOf(F.own || {}), h = r.atom.hands;
    fig.atom = [[t('sk.f.gap'), h.gap.toFixed(2) + ' eV', h.gap < 0.3], [t('sk.f.electrons'), mob(h.electrons)], [t('sk.f.holes'), h.holes ? mob(h.holes) : t('sk.f.none'), !h.holes]];
    way.atom = t(M.own ? 'sw.mat.own' : 'sw.mat.' + M.id);
    const s = r.switch.hands, spec = SW.normal({ mat: F.mat, shape: F.shape, mech: F.mech, own: F.own });
    way.switch = t('sw.shape.' + spec.shape) + ' · ' + F.V.toFixed(2) + ' V';
    if (R.broken) fig.switch = [[t('sk.f.turnsOff'), t('sk.f.never'), true], [t('sk.f.swing'), s.swing.toFixed(0) + ' mV'], [t('sk.f.vmin'), '—', true]];
    else {
      const G = r.gate.hands, speed = (P.T0 * 1e-12 * P.LIB[F.lib].delay) / G.delay;
      fig.switch = [[t('sk.f.vmin'), s.vmin.toFixed(2) + ' V', F.V < s.vmin], [t('sk.f.swing'), s.swing.toFixed(0) + ' mV'], [t('sk.f.speed'), times(speed), speed < 1 / 3]];
      fig.gate = [[t('sk.f.delay'), fmtT(G.delay)], [t('sk.f.energy'), fmtE(G.energy)], [t('sk.f.wrong'), oneIn(G.fail), G.fail > 1e-12]];
      way.gate = t('sk.lib.' + F.lib);
    }
  } else {
    const fk = 'sk.fork.' + g.carrier, kn = A.KNOWN.find(k => k.g.carrier === g.carrier), eC = A.forkEnergy('carrier', g.carrier, R.aim);
    fig.atom = traitFigs(A.EFFECT.carrier[g.carrier]).slice(0, 3); way.atom = t(fk + '.atom');
    fig.switch = passed('switch') ? [[t('sk.f.passed'), '']] : [[t('sk.f.built'), kn ? t('ar.st.' + kn.status) : '—'], [t('sk.f.engine'), t('sk.f.notYet')], [t('sk.f.onceLess'), times(eC)]];
    way.switch = passed('switch') ? t('sk.tag.passed') : t(fk + '.switch');
    if (passed('gate')) { fig.gate = [[t('sk.f.passed'), '']]; way.gate = t('sk.tag.passed'); }
    else { const G = r.gate.hands, ex = A.EFFECT.carrier[g.carrier].exact || 1; fig.gate = [[t('sk.f.delay'), fmtT(G.delay)], [t('sk.f.energy'), fmtE(G.energy)], [t('ar.tr.exact'), times(ex), ex < 0.5]]; way.gate = t(fk + '.gate'); }
  }
  if (R.broken) { for (const k of RUNGS.slice(2)) { fig[k] = [[t('sk.tag.cannot'), '', true]]; way[k] = ''; } return { fig, way, fid, dead: RUNGS.indexOf(R.broken) }; }
  const B = r.block, K = r.chip, Mh = r.machine.hands, Mi = r.mind.hands;
  if (passed('block')) { fig.block = [[t('sk.f.passed'), '']]; way.block = t('sk.tag.passed'); }
  else { const h = B.hands, m = B.more;
    fig.block = [[t('sk.f.alu'), fmtT(h.aluDelay)], [t('sk.f.wrongOps'), oneIn(h.aluWrong), h.aluWrong > 1e-9], [t('sk.f.read', { p: Math.round(100 * h.wireShare) }), fmtT(h.readDelay), h.wireShare > 0.2]];
    way.block = t('sk.adder.' + m.sums.adder) + (m.sums.vote ? ' · ' + t('sk.vote.1') : '') + ' · ' + t('sk.f.regsN', { n: m.memory.regs }); }
  const kh = K.hands, prog = !!A.CARRY.told[g.told].stages;
  fig.chip = [[t('sk.f.clock'), fmtF(kh.clock)], [t('sk.f.perInstr'), fmtE(kh.energy)], [t('sk.f.wrongInstr'), oneIn(kh.wrong), kh.wrong > 1e-9]];
  way.chip = K.passed ? t('sk.tag.passed') : prog ? t('sk.stages.' + (K.more.core ? K.more.core.stages : 1)) : optName('told', g.told);
  fig.machine = [[t('sk.f.ips'), fmtN(Mh.ips)], [t('sk.f.power'), fmtP(Mh.power)], [t('sk.f.moving'), Math.round(100 * Mh.moveShare) + '%', Mh.moveShare > 0.6]];
  way.machine = t('sk.unit.' + g.shape, { n: fmtNum(r.machine.more.units) });
  fig.mind = [[t('sk.f.right'), (Mi.right * 100).toFixed(1) + '%', Mi.right < 0.9], [t('sk.f.perAnswer'), fmtE(Mi.energy)], [t('sk.f.aps'), fmtN(Mi.aps)]];
  way.mind = t('sk.f.bitsN', { n: F.bits });
  return { fig, way, fid, dead: 9 };
}
/* a switch that spends less than silicon and could be made: a stepping stone for the devices (arch.js KEPT_SWITCH) */
export function stoneOf(F, g) { if (A.isFork('carrier', g.carrier)) return false; const fm = SW.forMachines({ mat: F.mat, shape: F.shape, mech: F.mech, own: F.own }); return fm.makeable && fm.energy < 1 - 1e-9; }

/* ---------- where the core questions bite: weighed, at most three shown, one a question ----------
   { rung, id, w, here, at }: id a question of src/data/frame.js, here what it is at this rung of your stack (words), at
   where its mark stands on the plate's plan (900 across, 200 deep) */
export function marksOf(R) {
  const m = [], g = R.recipe, F = R.fine, r = R.rungs, add = (rung, id, w, here, at) => m.push({ rung, id, w, here, at }), charge = !A.isFork('carrier', g.carrier);
  if (charge) add('atom', 'dig', 0.5, t('sk.here.dig', { eg: r.atom.hands.gap.toFixed(2) }), [820, 150]);
  else { add('atom', 'dig', 1.2, t('sk.here.digFork', { what: optName('carrier', g.carrier).toLowerCase() }), [560, 150]); add('gate', 'physics', 3.2, t('sk.here.physicsFork'), [640, 150]); }
  if (R.broken) { add('switch', 'perfect', 9, t('sk.here.perfectOff'), [760, 150]); return m.sort((a, b) => b.w - a.w); }
  if (charge) {
    const s = r.switch.hands, G = r.gate.hands;
    if (F.mech !== 'therm' || F.V < s.vmin + 0.1) add('switch', 'physics', F.mech !== 'therm' ? 4 : 3, F.mech !== 'therm' ? t('sk.here.physicsNew') : t('sk.here.physicsLow', { v: s.vmin.toFixed(2) }), [690, 150]);
    if (F.mat !== 'si' || F.shape !== 'fin') add('switch', 'moore', 3, t('sk.here.moore'), [300, 150]);
    if (G.fail > 1e-12) add('gate', 'perfect', 8 + Math.log10(G.fail + 1e-30) / 4, t('sk.here.perfect', { v: F.V.toFixed(2), p: oneIn(G.fail) }), [520, 150]);
  }
  const B = r.block.hands, K = r.chip, Mh = r.machine.hands, Mi = r.mind;
  if (B) {
    if (F.vote || B.aluWrong > 1e-9) add('block', 'vn', F.vote ? 5 : 4, F.vote ? t('sk.here.vnVote') : t('sk.here.vn', { p: oneIn(B.aluWrong) }), [700, 160]);
    if (F.adder === 'look') add('block', 'sutton', 2.5, t('sk.here.sutton'), [820, 160]);
    if (B.wireShare > 0.12) add('block', 'geo', 2 + B.wireShare * 10, t('sk.here.geoMem', { n: F.regs, p: Math.round(100 * B.wireShare) }), [300, 150]);
  }
  if (K.hands.gates > 12000 && !K.passed) add('chip', 'trust', 2, t('sk.here.trust', { n: Math.round(K.hands.gates / 1000) }), [560, 160]);
  if (g.told === 'fixed') add('chip', 'line', 3.4, t('sk.here.lineFixed'), [700, 160]);
  else if (g.told === 'learns') add('chip', 'line', 3.4, t('sk.here.lineLearns'), [700, 160]);
  else if (K.more.core && K.more.core.stages === 5) add('chip', 'line', 2, t('sk.here.line5'), [700, 160]);
  if (Mh.moveShare > 0.5) add('machine', 'geo', 3 + Mh.moveShare * 2, t('sk.here.geo', { p: Math.round(100 * Mh.moveShare) }), [680, 150]);
  if (Mi.hands.energy < X0.rungs.mind.hands.energy * 0.5) add('machine', 'eff', 3.5, t('sk.here.eff', { x: fmtX(X0.rungs.mind.hands.energy / Mi.hands.energy) }), [330, 160]);
  if (g.carrier === 'living') add('mind', 'copy', 6.5, t('sk.here.copyLive'), [420, 160]);
  else if (F.bits <= 2 || Mi.more.lam > 0.5) add('mind', 'copy', Mi.more.lam > 0.5 ? 6 : 3, Mi.more.lam > 0.5 ? t('sk.here.copyErr') : t('sk.here.copyBits'), [420, 160]);
  add('mind', 'human', 1.5, t('sk.here.human', { a: (Mi.hands.right * 100).toFixed(1), e: fmtE(Mi.hands.energy) }), [600, 160]);
  return m.sort((a, b) => b.w - a.w);
}
export const topMarks = (ms, n = 3) => { const seen = new Set(), out = []; for (const x of ms) { if (seen.has(x.id)) continue; seen.add(x.id); out.push(x); if (out.length === n) break; } return out; };

/* ---------- every recipe, and where it stands on the sheet: needs across, genes away from today up ---------- */
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
export const fxOf = (k, o) => { const e = A.EFFECT[k][o] || {}; return ['energy', 'flex', 'exact', 'rugged', 'adapt'].filter(x => e[x] != null).map(x => t('ar.tr.' + x) + ' ' + times(e[x])).join(' · '); };
export const bestNeed = g => { let b = 0, bi = -1; NEEDS.forEach((n, i) => { const p = A.potentialOf(g, n); if (p > b) { b = p; bi = i; } }); return bi; };
export function recipeName(g) { const k = A.knownOf(g); if (k) return t('ar.known.' + k.id); return A.GENES.filter(x => g[x] !== A.TODAY[x]).map(x => optName(x, g[x])).join(' · ') || t('sk.recipe.today'); }

/* ---------- the population ---------- */
export const SWEEP_YEARS = 25;
export function population(arch) {
  const POP = [];
  for (const k of A.KNOWN) POP.push({ key: A.keyOf(k.g), g: k.g, st: A.start(k.g), by: k.status, id: k.id });
  /* the attempts kept in the community's ledger (src/engines/ledger.js), grown again by the same engine */
  for (const h of arch || []) if (A.histOk(h)) { const r = A.replay(h); if (!POP.some(a => a.key === A.keyOf(r.st.g))) POP.push({ key: A.keyOf(r.st.g), g: r.st.g, st: r.st, by: 'ledger' }); }
  return POP;
}
let seed = 20261127;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
/* agents explore: recipes nobody has tried, at least two genes from today's, that could win some need once polished;
   each grown as the ledger's own example plays it: people first for ten years, then the engine's suggestion. Run in
   this browser by the visitor, never by the lab (docs/PATH.md: agents' sweeps come through the port) */
export function explore(POP, n, mineKey) {
  const tried = new Set(POP.map(a => a.key)); if (mineKey) tried.add(mineKey);
  const cands = RECIPES.filter(r => r.d >= 2 && !tried.has(r.key) && NEEDS.some((nd, i) => POT[i][r.i] >= 1)), out = [];
  for (let k = 0; k < n && cands.length; k++) out.push(agentGrow(POP, cands.splice(Math.floor(rnd() * cands.length), 1)[0]));
  return out;
}
function agentGrow(POP, r) {
  let st = A.start(r.g);
  for (let y = 0; y < SWEEP_YEARS; y++) { const s = A.suggest(st, 'archniche').dirs; st = A.year(st, y < 10 ? ['people', s[0]] : s); }
  const a = { key: r.key, g: r.g, st, by: 'agent', years: SWEEP_YEARS }; POP.push(a); return a;
}
/* the agents' attempts of an earlier visit, grown again: the same recipe and the same play give the same result */
export function regrow(POP, keys) { for (const k of keys || []) if (RIDX.has(k) && !POP.some(a => a.key === k)) agentGrow(POP, RECIPES[RIDX.get(k)]); }
/* the census: every plot of the sheet (need x recipe), who stands on it and how it scores, and each niche's champion */
export function census(POP, mine) {
  const atts = POP.slice(); if (mine) atts.push(mine);
  const Pl = NEEDS.map(() => new Array(RECIPES.length).fill(null)), champ = NEEDS.map(() => [null, null, null, null, null]);
  let wins = 0; const triedKeys = new Set();
  for (const a of atts) {
    const ri = RIDX.get(a.key), sc = A.scoreOf(a.st), d = RECIPES[ri].d; a.sc = sc; triedKeys.add(a.key);
    let won = false;
    NEEDS.forEach((n, ni) => {
      if (!sc[n].can) return;
      const cur = Pl[ni][ri];
      if (!cur || a.mine || (!cur.a.mine && sc[n].now > cur.now)) Pl[ni][ri] = { a, now: sc[n].now, could: sc[n].could };
      if (sc[n].wins && d > 0) won = true;
    });
    if (won) wins++;
  }
  NEEDS.forEach((n, ni) => Pl[ni].forEach((e, ri) => { if (!e) return; const d = RECIPES[ri].d, c = champ[ni][d]; if (!c || e.now > c.now) champ[ni][d] = { ri, now: e.now }; }));
  return { P: Pl, champ, tried: triedKeys.size, wins };
}
export { EXAMPLE, RUNGS };
