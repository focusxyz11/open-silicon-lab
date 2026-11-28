/* The path: the carry from matter to mind (docs/PATH.md; the rungs, their contracts and faces: src/data/path.js). Pure
   logic, no DOM, no words (ids only); tests in tests/path.test.mjs. Ported from the Your stack prototype by Claude Fable
   5.2 (docs/prototypes/stack/src/model.js), written for the lab by Claude Opus 5.5 in the nightly build; the model's
   numbers are the prototype's, with sums and memory as two parts of the block and the core a part of the chip.

   A stack is { aim, rungs: { <rung>: { genes, fine } } }: each rung holds the genes of the recipe that choose it (the
   gene-to-rung table, GENE_RUNGS) and its fine settings (FINE_OF). stackOf(recipe, fine, aim) lays a recipe of the
   architecture engine (src/engines/arch.js, four genes) and fine settings out on the rungs; recipeOf(stack) reads the
   recipe back (a gene from the first rung that chooses it); fineOf(stack) the fine settings.

   carry(stack) builds it from the atom up. Each rung is made of the contract the rungs below hand up (HANDS), and hands
   up its own: { hands, more, forks, fork, passed, broken, fid } per rung, and the stack's figure against today's
   computer for its need (against). The simplifications, written down so they can be argued with:
   - The atom is a material of the switch engine's table (src/engines/switch.js MATERIALS, each with its source), and the
     switch is that engine's switchOf, unchanged: its numbers are the switch rung's.
   - The line (#455): the line's care (CARE) is a setting of the fab's engines, and what it does comes up the stack.
     The spread of the copies is the switch engine's on today's line, scaled as the print's photon noise (litho.js
     euv: the noise goes as one over the root of the photons a feature catches, so as one over the root of the dose);
     the threshold stays where the design put it, so a wider spread raises the lowest clean voltage (three spreads
     above it, as the switch engine sets it) and more copies of a gate fail at your voltage. Specks on the wafer go as
     the specks in the air (fabline.js isoLimit, against the typical cleanroom), from the chip engine's defects for
     today's process (chip.js defectsOf). A die is its gates' switches at a 5 nm line's density (DENSITY) plus the
     pads and edges every chip has (bet.js AREA_FIXED); the chip engine counts the dies a wafer holds, the share no
     speck lands on (yield) and what a good one costs (chip.js dieOf), against the lab's example (cost). The scanner
     sets the line's pace: a higher dose, fewer wafers an hour (litho.js euv), and the fab's fixed costs shared over
     fewer of them. The line's numbers and their marks are carry().fab.
   - The gate: today's silicon gate is T0 ps and EG0 fJ at VREF (0.70 V), an idea drawn. At a voltage V, its delay goes
     as V over the switch's current there (a smooth turn-on at the switch's swing above its threshold), its energy as
     V squared, four times more without both carriers (no CMOS pair: current flows while it holds a 0). Its copies'
     thresholds spread by the switch's sigma: a gate fails when its voltage does not clear a copy's threshold, the tail
     of a normal spread (Q), one in about a billion at the switch's lowest clean voltage, a half at three spreads below
     the threshold. A richer library is slower and hungrier per gate, but needs fewer gates for a full adder.
   - The block: an ALU slice copied 32 times (a full adder of 9 NAND gates or 5 rich ones, and 6 gates of logic per
     bit), its carry rippling through every bit or looked ahead in a tree; a vote of three copies, if chosen, outvotes
     one wrong copy. A register file of your gates: its read crosses log2(registers) levels of gates, plus wires growing
     as the square root of its gates. A quarter of the gates switch on an operation.
   - The chip: one core, made of that block and 1,200 gates of control. Its clock is the slowest path (read, decode,
     add, write back) split into pipeline stages, each paying six gates of overhead, never faster than twelve gates a
     tick; deeper pipelines lose a little to stalls (cycles an instruction). It goes wrong when any of its gates does.
     Told another way than a program (a graph, events, learning, wired for one job), it runs in one stage.
   - The machine: its units of that chip (the shape's own number, CARRY in arch.js), each instruction missing on chip
     one time in a hundred and waiting for memory (far: 80 ns away, else 3 ns); a fetch from memory costs twice a 45 nm
     DRAM access (paradigms.js E16), so most of a small core's energy goes on moving data.
   - The mind: a small network (8 x 8 pixels in, 16 hidden, 10 digits out: MACS multiply-adds) run by instructions on
     cores with no multiplier (IPM instructions a multiply-add at each width of weights), its weights fetched from
     memory. How often it is right: the share a network of that width gets on such a task (ACC, an idea drawn), lower
     where the recipe is less exact (fewer bits in effect), and falling towards a guess (10%) as wrong instructions
     pile up in one answer.
   - A fork (a gene other than today's): a forked rung hands up the same fields as the rung it replaces, with its energy
     divided by the architecture engine's own factor for that option (arch.js forkEnergy, from EFFECT) and the option's
     carry contract (arch.js CARRY): a new carrier replaces the atom, the switch and the gate together and hands up
     today's example gate, its delay times the carrier's, failing never (its inexactness counts at the mind); a carrier
     that skips rungs (living cells: CARRY skips) passes them by, handing up today's example contract at the last of
     them, slowed by its delay and with the energy of every gene whose rungs it passed; a way of being told divides the
     chip's energy an instruction; where it computes divides the energy of moving data and sets the memory's distance;
     a shape divides the machine's energy and sets its units. Every fork's contract is a guess until a fact backs it,
     and every rung built on a guess is marked a guess too.
   - Against today's computer: one number, the architecture engine's (arch.js scoreOf): what the recipe could become for
     the need once as polished as today's computer (could), and, given a state grown in it, where it stands now (now).
     The stack computes no second one.

   The faces (#454): faceOf(rung, face) and alongTo(rung, stage), along the chip's life holding the rung (a gate as
   designed, as made, as used); a face a rung does not have says why. */
import * as A from './arch.js';
import * as SW from './switch.js';
import { E16 } from './paradigms.js';
import { euv } from './litho.js';
import { isoLimit } from './fabline.js';
import { defectsOf, dieOf, START as CHIP_START } from './chip.js';
import { AREA_FIXED } from './bet.js';
import { RUNGS, HANDS, BY, FID, FORK_BY, GENE_RUNGS, FINE_OF, CHOICES, V_RANGE, EXAMPLE, AIM, FACES, FACE_OF, FACE_STAGE, CARE, DENSITY, LAYER } from '../data/path.js';
import { PLACED } from '../data/lattice.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---- a stack, a recipe and fine settings ---- */
/* fine settings made whole: the switch engine's spec for the material, its shape and way of switching (an invented
   material keeps its dials, own), the voltage within its range, every other setting one of its choices */
export function normalFine(F) {
  const f = Object.assign({}, EXAMPLE, F || {}), spec = SW.normal({ mat: f.mat, shape: f.shape, mech: f.mech, own: f.own });
  const V = Number.isFinite(+f.V) ? clamp(+f.V, V_RANGE[0], V_RANGE[1]) : EXAMPLE.V;
  const out = { mat: spec.mat, shape: spec.shape, mech: spec.mech, V };
  if (spec.own) out.own = Object.assign({}, spec.own);
  for (const k of Object.keys(CHOICES)) out[k] = CHOICES[k].find(c => c === f[k] || String(c) === String(f[k])) ?? EXAMPLE[k];
  return out;
}
export function stackOf(recipe, fine, aim) {
  const g = A.normal(recipe), F = normalFine(fine), rungs = {};
  for (const r of RUNGS) rungs[r] = { genes: {}, fine: {} };
  for (const [gene, rs] of Object.entries(GENE_RUNGS)) for (const r of rs) rungs[r].genes[gene] = g[gene];
  for (const r of RUNGS) for (const k of FINE_OF[r]) rungs[r].fine[k] = F[k];
  if (F.own) rungs.atom.fine.own = Object.assign({}, F.own);
  return { aim: A.NEEDS.includes(aim) ? aim : AIM, rungs };
}
const rungOf = (stack, r) => (stack && stack.rungs && stack.rungs[r]) || {};
export const recipeOf = stack => A.normal(Object.fromEntries(A.GENES.map(k => [k, (rungOf(stack, GENE_RUNGS[k][0]).genes || {})[k]])));
export const fineOf = stack => normalFine(Object.assign({}, ...RUNGS.map(r => rungOf(stack, r).fine || {})));
export const aimOf = stack => (stack && A.NEEDS.includes(stack.aim) ? stack.aim : AIM);
/* the genes that fork a rung: those choosing it that differ from today's computer */
export const forksAt = (g, rung) => A.GENES.filter(k => GENE_RUNGS[k].includes(rung) && A.isFork(k, g[k]));

/* ---- the model's constants (an idea drawn: the header says what each stands for) ---- */
export const T0 = 15, EG0 = 1, VREF = 0.70;                 // ps and fJ, one gate of today's silicon fin at 0.70 V
export const MACS = 64 * 16 + 16 * 10;                     // a small network: 8 x 8 pixels, 16 hidden, 10 digits
export const IPM = { 1: 0.15, 2: 0.6, 4: 1.5, 8: 3.5 };    // instructions a multiply-add, with no multiplier
export const ACC = [[1, 0.86], [2, 0.93], [4, 0.965], [8, 0.972]];   // how often right, at each width of weights
export const MISS = 0.01, CTRL = 1200, CPI = { 1: 1, 3: 1.12, 5: 1.25 };
export const FA = { nand: [9, 9], rich: [5, 8] };          // gates of a full adder, and gates switching in one
export const LIB = { nand: { delay: 1, energy: 1, switches: 4 }, rich: { delay: 1.15, energy: 1.1, switches: 6 } };
/* the switch's current at V against its own scale: a smooth turn-on, quadratic above the threshold */
export function Irel(sw, V) {
  const s = sw.swing / 1000 / Math.LN10, h = (V - sw.vt) / (2 * s), l = h > 30 ? h : Math.log1p(Math.exp(h));
  return sw.ion * l * l;
}
const IREF = Irel(SW.SILICON, VREF);
/* the tail of a normal spread beyond z spreads */
export function Q(z) {
  if (z > 3) { const z2 = z * z; return Math.exp(-z2 / 2) / (z * Math.sqrt(2 * Math.PI)) * (1 - 1 / z2 + 3 / (z2 * z2)); }
  if (z < -3) return 1 - Q(-z);
  const u = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), y = u * (0.254829592 + u * (-0.284496736 + u * (1.421413741 + u * (-1.453152027 + u * 1.061405429)))) * Math.exp(-z * z / 2);
  return z >= 0 ? y / 2 : 1 - y / 2;
}
/* the chance that any of n copies fails, each with chance p */
const fails = (p, n) => (n * p < 1e-6 ? n * p : 1 - Math.pow(1 - Math.min(p, 1), n));
function baseAcc(b) {
  const x = Math.log2(clamp(b, 1, 8));
  for (let i = 1; i < ACC.length; i++) { const x0 = Math.log2(ACC[i - 1][0]), x1 = Math.log2(ACC[i][0]); if (x <= x1) return ACC[i - 1][1] + (ACC[i][1] - ACC[i - 1][1]) * (x - x0) / (x1 - x0); }
  return ACC[ACC.length - 1][1];
}

/* ---- the line: what the fab hands up (#455) ---- */
/* the line run with a care (CARE): the spread of the copies against today's line (from the print's photon noise), its
   pace against today's (the scanner's wafers an hour), the specks a cm² (from the cleanroom's air), each with the
   engine behind it and its mark */
const LINE0 = { print: euv({ dose: CARE.dose[EXAMPLE.care] }), air: isoLimit(CARE.clean[EXAMPLE.care]) };
export function lineOf(care) {
  const c = CHOICES.care.includes(care) ? care : EXAMPLE.care, print = euv({ dose: CARE.dose[c] }), air = isoLimit(CARE.clean[c]);
  return {
    care: c, dose: print.dose, noise: print.noisePct, spread: print.noisePct / LINE0.print.noisePct, wph: print.wph, pace: print.wph / LINE0.print.wph,
    iso: CARE.clean[c], air, defects: defectsOf(CHIP_START.gen) * air / LINE0.air,
    fid: { spread: { f: 'computed', by: 'litho' }, pace: { f: 'computed', by: 'litho' }, defects: { f: 'computed', by: 'fabline' },
      density: { f: 'figures', fact: DENSITY.fact }, area: { f: 'idea', by: 'bet' }, yield: { f: 'computed', by: 'chip' }, cost: { f: 'computed', by: 'chip' } }
  };
}
/* the area of a die of n gates of s switches each, cm²: its switches at the line's density, each gate taking k of a fin
   gate's area (the switch's shape: a stacked pair about half, #499), and its pads and edges */
export const areaOf = (n, s, k = 1) => (n * s * k / DENSITY.perMm2 + AREA_FIXED) / 100;

/* ---- the carry ---- */
/* a forked rung's contract: today's example rung, its energy divided by factor, its time multiplied by slow, failing
   never (a fork's inexactness counts at the mind, through the recipe's exact trait) */
function forkHands(rung, factor, slow) {
  const base = X0.rungs[rung].hands, out = {};
  for (const [k, u] of HANDS[rung]) {
    const v = base[k];
    out[k] = u === 'J' ? v / factor : u === 's' ? v * slow : u === 'Hz' || u === 'per s' ? v / slow : u === 'W' ? v / factor / slow : u === 'p' ? 0 : v;
  }
  return out;
}
function carryOf(g, F, aim, ref) {
  const line = lineOf(F.care), R = { recipe: g, fine: F, aim, broken: null, traits: A.traitsOf(g, aim), rungs: {}, fab: line };
  const e = k => A.forkEnergy(k, g[k], aim), eC = e('carrier'), eW = e('where'), eT = e('told'), eS = e('shape');
  const C = A.CARRY.carrier[g.carrier], charge = !A.isFork('carrier', g.carrier), skips = C.skips || [];
  let guessed = false;
  const put = (r, hands, more, how = {}) => {
    const forks = forksAt(g, r);
    if (forks.length) guessed = true;
    const fid = how.fid || (forks.length ? { f: 'idea', by: FORK_BY, status: 'guess' } : guessed ? { f: 'idea', by: BY[r], status: 'guess' } : { f: FID[r], by: BY[r] });
    R.rungs[r] = { id: r, hands, more: more || {}, forks, fork: forks.length > 0, passed: !!how.passed, broken: !!how.broken, fid };
    return hands;
  };
  const cannot = from => { for (const r of RUNGS.slice(RUNGS.indexOf(from) + 1)) put(r, null, {}, { broken: true, fid: { f: 'idea', by: BY[r] } }); };

  /* atom, switch, gate: the switch engine's, or the carrier's fork */
  let G;
  if (charge) {
    const spec = SW.normal({ mat: F.mat, shape: F.shape, mech: F.mech, own: F.own }), sw = SW.switchOf(spec), M = sw.mat;
    put('atom', { gap: M.eg, electrons: M.me, holes: M.mh, traps: M.dit }, { mat: M.id },
      { fid: M.own ? { f: 'idea', by: 'switch', status: 'guess' } : { f: 'figures', by: 'switch', fact: M.fact } });
    /* the switch as made on your line: its copies spread as the print's noise, its lowest clean voltage three spreads
       above the threshold the design set (today's line: the switch engine's own numbers) */
    const sigma = sw.sigma * line.spread, vmin = line.spread === 1 ? sw.vmin : sw.clean ? sw.vt + 3 * sigma / 1000 : NaN;
    const S = put('switch', { vmin, vt: sw.vt, swing: sw.swing, sigma, ion: sw.ion, pair: sw.pair, survives: sw.survives },
      { spec: SW.specKey(spec), clean: sw.clean, status: sw.status, designed: { sigma: sw.sigma, vmin: sw.vmin }, care: line.care }, { fid: sw.own ? { f: 'idea', by: 'switch', status: 'guess' } : { f: 'computed', by: 'switch' } });
    if (sw.own) guessed = true;
    if (!sw.clean) { R.broken = 'switch'; cannot('switch'); R.against = againstOf(g, aim); return R; }
    /* the gate, made of the switch's contract at your voltage */
    const V = F.V, L = LIB[F.lib], vtb = S.vt - 3 * S.sigma / 1000, z = 6 * (V - vtb) / (S.vmin - vtb);
    const p = V <= vtb ? 0.5 : Math.min(0.5, Q(z)), d = (V / VREF) * IREF / Math.max(Irel(S, V), 1e-30), en = Math.pow(V / VREF, 2);
    G = put('gate', { delay: T0 * d * L.delay * 1e-12, energy: EG0 * en * (S.pair ? 1 : 4) * L.energy * 1e-15, fail: p, switches: L.switches, area: sw.area }, { lib: F.lib, V });
  } else {
    put('atom', null, { matter: C.matter });
    if (!skips.length) { put('switch', null, { matter: C.matter }); G = put('gate', forkHands('gate', eC, C.delay), { matter: C.matter }); }
  }

  /* a carrier that skips rungs passes them by, handing up today's contract at the last, slowed, with the energy of every
     gene whose rungs it passed */
  const last = skips[skips.length - 1];
  for (const r of skips) {
    const folded = A.GENES.filter(k => k !== 'carrier' && GENE_RUNGS[k].every(x => skips.includes(x))).reduce((f, k) => f * e(k), eC);
    put(r, r === last ? forkHands(r, folded, C.delay) : null, { matter: C.matter }, { passed: true });
  }

  /* the block: an ALU of your gates and a register file of them */
  let B, K;
  if (!skips.includes('block')) {
    const tg = G.delay * 1e12, Eg = G.energy * 1e15, p = G.fail, lib = charge ? F.lib : EXAMPLE.lib, [faG, faE] = FA[lib];
    let addG = 32 * faG; const addD = F.adder === 'ripple' ? 2 * 32 + 3 : 2 * 5 + 4;
    if (F.adder === 'look') addG += 32 * 5 * 3;
    let aluG = addG + 32 * 6, aluD = (addD + 2) * tg, aluE = (32 * faE + (F.adder === 'look' ? 480 : 0) + 192) * 0.25 * Eg, Pw = fails(p, aluG * 0.5);
    if (F.vote) { const pv = fails(p, 32 * 4); Pw = Math.min(1, 3 * Pw * Pw + pv); aluG = aluG * 3 + 128; aluD += 2 * tg; aluE = aluE * 3 + 128 * 0.25 * Eg; }
    const RG = F.regs, fileG = RG * 32 * 10 + 2 * 32 * (RG - 1), lg = Math.log2(RG), wire = 0.02 * Math.sqrt(fileG) * tg, readD = (2 * lg + 2) * tg + wire;
    const readE = (32 * lg * 2 + 32 * 10 * 0.1) * 0.25 * Eg + Math.sqrt(fileG) * 0.04 * Eg, Pr = fails(p, 32 * lg * 2 * 0.5);
    B = put('block', { aluDelay: aluD * 1e-12, aluEnergy: aluE * 1e-15, aluWrong: Pw, readDelay: readD * 1e-12, readEnergy: readE * 1e-15, readWrong: Pr, wireShare: wire / readD, gates: aluG + fileG },
      { sums: { gates: aluG, adder: F.adder, vote: F.vote }, memory: { gates: fileG, regs: RG } });

    /* the chip: one core of that block and its control, told what to do one way or another */
    const SG = A.CARRY.told[g.told].stages ? F.stages : 1, path = readD + 6 * tg + aluD + 2 * tg, period = Math.max(SG === 1 ? path : path / SG + 6 * tg, 12 * tg);
    const pipeG = SG > 1 ? SG * 128 * 10 : 0, coreG = aluG + fileG + CTRL + pipeG;
    const Ei = (aluE + 3 * readE + CTRL * 0.1 * Eg + pipeG * 0.25 * Eg + 2000 * 0.05 * Eg * (SG > 1 ? 1 : 0.6)) / eT;
    const q = Math.min(1, 1 - (1 - Pw) * Math.pow(1 - Pr, 2) * (1 - fails(p, CTRL * 0.1)));
    /* its die, cut from a wafer of your line: how many come out whole, and what a good one costs */
    const die = dieOf(areaOf(coreG, G.switches, G.area), line.defects, line.pace);
    K = put('chip', { clock: 1e12 / period, cpi: CPI[SG], energy: Ei * 1e-15, wrong: q, gates: coreG, area: die.area, yield: die.yield, cost: die.cost / (ref || die.cost) },
      { core: { stages: SG, period: period * 1e-12 }, die });
  } else K = R.rungs.chip.hands;

  /* the machine: units of that chip, and memory near or far */
  const units = A.CARRY.shape[g.shape].units[F.ui], lat = A.CARRY.where[g.where].latency, fq = K.clock;
  const stall = MISS * lat * fq, ips = units * fq / (K.cpi + stall), Ef = 2 * E16.dram * 1e-12;
  const think = K.energy / eS, move = MISS * Ef / (eW * eS), Emi = think + move;
  const Mh = put('machine', { ips, energy: Emi, power: ips * Emi, moveShare: move / Emi, fetch: Ef * 0.25 / (eW * eS), wrong: K.wrong }, { units, latency: lat, think, move });

  /* the mind: a small network on that machine */
  const bits = F.bits, instr = MACS * IPM[bits] + 200, fetches = Math.ceil(MACS * bits / 32);
  const Ea = instr * Mh.energy * (1 - Mh.moveShare) + fetches * Mh.fetch, lam = Mh.wrong * instr, bEff = Math.max(1, bits + Math.log2(R.traits.exact));
  put('mind', { aps: Mh.ips / instr, energy: Ea, right: 0.1 + (baseAcc(bEff) - 0.1) * Math.exp(-lam / 8) }, { bits, instructions: instr, lam, bitsInEffect: bEff });
  R.against = againstOf(g, aim);
  return R;
}
/* today's computer, the lab's example, carried: the contract every fork replaces, and the good die every chip's cost
   is set against */
const REF_COST = carryOf(A.TODAY, normalFine(EXAMPLE), AIM, null).rungs.chip.more.die.cost;
export const X0 = carryOf(A.TODAY, normalFine(EXAMPLE), AIM, REF_COST);
export const carry = stack => carryOf(recipeOf(stack), fineOf(stack), aimOf(stack), REF_COST);

/* ---- against today's computer: one number, the architecture engine's ---- */
function againstOf(g, need, st) {
  const s = st && A.keyOf(A.normal(st.g)) === A.keyOf(g) ? st : A.start(g), sc = A.scoreOf(s)[need];
  return { need, now: sc.now, could: sc.could, can: sc.can, wins: sc.wins, year: s.year };
}
/* the stack's figure for a need (its own, if none is given): what its recipe could become once polished, and where a
   state grown in that recipe stands now (st, a state of arch.js; without one, a new start) */
export const againstToday = (stack, need, st) => againstOf(recipeOf(stack), A.NEEDS.includes(need) ? need : aimOf(stack), st);

/* ---- the faces: the same rung as designed, as made, as used ---- */
export const faceOf = (rung, face) => (FACE_OF[rung] && FACE_OF[rung][face]) || null;
export const hasFace = (rung, face) => { const f = faceOf(rung, face); return !!f && !f.none; };
/* along the chip's life from a rung: the face it turns to at a stage of the loop, holding the rung. A stage with no
   face (open, test, ship) keeps the rung and turns nothing (face null); a face the rung does not have says why (none) */
export function alongTo(rung, stage) {
  if (!RUNGS.includes(rung) || typeof stage !== 'string') return null;
  const face = FACES.find(f => FACE_STAGE[f] === stage) || null;
  if (!face) return { rung, stage, face: null };
  const F = faceOf(rung, face);
  return F.none ? { rung, stage, face, none: F.none } : { rung, stage, face, home: F.home, steps: F.steps ? F.steps.map(s => s.id) : [] };
}

/* ---- the challenges as stepping stones on their rungs (#451) ----
   Each challenge sits on one rung: the rung of the layer the lattice places it in (src/data/lattice.js PLACED,
   'ch:<id>'; the rungs and layers are one ladder, LAYER), so where a challenge stands is written once. A challenge won
   inks its plate's edge; one of arch.js STONES also raises its direction once (broughtOf), never winning a need alone */
const RUNG_OF_LAYER = Object.fromEntries(Object.entries(LAYER).map(([r, l]) => [l, r]));
export const rungOfChallenge = id => { const p = PLACED.find(x => x[0] === 'ch:' + id); return (p && RUNG_OF_LAYER[p[2]]) || null; };
