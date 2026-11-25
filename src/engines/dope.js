/* Doping, as models (silicon as a semiconductor, and implant then anneal; gathered by fabsteps.js).
   Ported from the earlier site (the branch 'before': the semiconductor playground and the implant and anneal labs
   of its physics topic), same formulas and constants, with the screen taken out. Pure functions of their settings.

   Silicon (the playground): free carriers from the band gap (1.12 eV): ni(T) = 1e10 (T/300)^1.5 exp(-Eg/2k (1/T - 1/300))
   per cm3; mobility from the Caughey-Thomas fit; doped silicon from charge balance; a p-n junction by the abrupt
   depletion approximation and the ideal diode equation (I0 = 1e-14 A); a field-effect switch with a threshold of
   0.45 V and 75 mV per decade below it: the flat silicon switch of the switch engine (src/engines/switch.js), whose
   swing is the 60 mV limit times its gate's imperfect grip. Silicon has 5e22 atoms per cm3.
   Implant and anneal: a dopant ion lands at a depth Rp = a E^b nm with spread dRp = c E^d nm (E in keV; the
   constants are the first version's fits to published range tables), the profile is a Gaussian of the dose, the
   anneal broadens it by sqrt(2 D t) (diffusion, not counting transient enhanced diffusion), and a junction is where
   the profile falls to the background doping of 1e17 per cm3. How many dopants switch on depends on the anneal and on
   solid solubility: a dose above it leaves some inactive. Energy is in keV, dose in ions per cm2, depth in nm. */
import { clamp, metBy } from './fabkit.js';
import { switchOf } from './switch.js';

/* ---- silicon ---- */
const K_B = 8.617e-5, EG = 1.12, Q = 1.602e-19, N_SI = 5e22, VT = 0.02585;
export const ni = Tk => 1e10 * Math.pow(Tk / 300, 1.5) * Math.exp(-EG / (2 * K_B) * (1 / Tk - 1 / 300));
const mobilityN = N => 68.5 + 1345 / (1 + Math.pow(N / 9.2e16, 0.711));
const mobilityP = N => 44.9 + 425 / (1 + Math.pow(N / 2.23e17, 0.719));
export const SEMI_DEFAULTS = { T: 300, type: 'n', logN: 16, logNa: 17, logNd: 17, V: 0, Vg: 0.2, Vd: 0.5 };
export const SEMI_RANGE = { T: [150, 650], logN: [13, 20], logNa: [14, 19], logNd: [14, 19], V: [-3, 0.8], Vg: [0, 1.2], Vd: [0, 1] };

/* pure silicon at temperature T (kelvin): free electrons per cm3, how many bonds per free electron, resistivity (ohm cm), against copper */
export function siliconPure(T = SEMI_DEFAULTS.T) {
  const n = ni(T), rho = 1 / (Q * n * (mobilityN(1e13) + mobilityP(1e13)));
  return { T, n, bondsPerCarrier: 4 * N_SI / n, rho, vsCopper: rho / 1.7e-6 };
}

/* doped silicon: type 'n' (phosphorus) or 'p' (boron) at 10^logN dopants per cm3, at 300 K */
export function siliconDoped(type = SEMI_DEFAULTS.type, logN = SEMI_DEFAULTS.logN) {
  const N = Math.pow(10, logN), n0 = ni(300);
  const maj = N / 2 + Math.sqrt(N * N / 4 + n0 * n0), min = n0 * n0 / maj;
  const nn = type === 'n' ? maj : min, pp = type === 'n' ? min : maj;
  return { type, N, majority: maj, minority: min, rho: 1 / (Q * (nn * mobilityN(N) + pp * mobilityP(N))), atomsPerDopant: N_SI / N };
}

/* a p-n junction with 10^logNa acceptors on one side and 10^logNd donors on the other, at voltage V across it (volts, p side positive) */
export function junction(logNa = SEMI_DEFAULTS.logNa, logNd = SEMI_DEFAULTS.logNd, V = SEMI_DEFAULTS.V) {
  const Na = Math.pow(10, logNa), Nd = Math.pow(10, logNd), n0 = ni(300);
  const Vbi = VT * Math.log(Na * Nd / (n0 * n0)), eps = 11.7 * 8.854e-14, Vj = Math.max(0.02, Vbi - V);
  const W = Math.sqrt(2 * eps * Vj * (Na + Nd) / (Q * Na * Nd));                  // cm
  const I = Math.min(1e-14 * (Math.exp(Math.min(V, 0.8) / VT) - 1), 0.05);        // amps for 1 mm2
  return { Na, Nd, V, Vbi, W, xp: W * Nd / (Na + Nd), xn: W * Na / (Na + Nd), peakField: 2 * Vj / W, I, state: V > 0.5 ? 'forward' : V < 0 ? 'reverse' : 'near' };
}

/* a field-effect switch at gate voltage Vg and drain voltage Vd: drain current per micrometre of width (amps), channel strength 0 to 1 */
export const SI_FLAT_SWING = switchOf({ mat: 'si', shape: 'planar', mech: 'therm' }).swing / 1000;   // volts per tenfold, about 0.075
export function mosfet(Vg = SEMI_DEFAULTS.Vg, Vd = SEMI_DEFAULTS.Vd) {
  const Vt = 0.45, ss = SI_FLAT_SWING;
  let Id = Vg < Vt ? 1e-7 * Math.pow(10, (Vg - Vt) / ss) : 1e-7 + 6e-4 * Math.pow(Vg - Vt, 1.3);
  Id *= Math.tanh(Vd / 0.15) * (1 + 0.1 * Vd);
  return { Vg, Vd, Vt, Id, channel: clamp((Vg - Vt + 0.15) / 0.8, 0, 1), state: Vg < Vt - 0.1 ? 'off' : Vg < Vt + 0.05 ? 'turning' : 'on' };
}

/* ---- implant and anneal ---- */
const IONS = {
  B: { type: 'p', rp: [3.9, 0.96], spread: [4.6, 0.59], amorphous: 1e17, solubility: 2e20, diffusion: [1.5e-15, 6e-14, 1e-12] },
  P: { type: 'n', rp: [1.8, 0.92], spread: [1.08, 0.81], amorphous: 5e14, solubility: 1e21, diffusion: [2e-15, 8e-14, 1e-12] },
  As: { type: 'n', rp: [1.74, 0.76], spread: [0.8, 0.7], amorphous: 2e14, solubility: 2e21, diffusion: [2e-16, 1e-14, 3e-13] }
};
export const ION_IDS = Object.keys(IONS);
export const ANNEALS = ['none', 'furnace', 'spike', 'laser'];
const ANNEAL_TIME = { furnace: 1800, spike: 1.5, laser: 1e-3 };                  // seconds: 900 C 30 min, 1050 C about 1 s, 1300 C 1 ms
const ANNEAL_ACTIVE = { none: 0.03, furnace: 0.97, spike: 0.92, laser: 0.99 };
const ANNEAL_SOL = { none: 1, furnace: 1, spike: 1, laser: 3 };                  // a laser anneal can hold 3 times the usual solubility
export const BACKGROUND = 1e17;
export const IMPLANT_DEFAULTS = { ion: 'As', anneal: 'spike', energy: 0.5 * Math.pow(1000, 0.45), dose: 1e15 };
export const IMPLANT_RANGE = { energy: [0.5, 500], logDose: [12, 16] };

export function implant(settings = {}) {
  const { ion, anneal, energy: e, dose } = { ...IMPLANT_DEFAULTS, ...settings }, I = IONS[ion];
  const Rp = I.rp[0] * Math.pow(e, I.rp[1]), s0 = I.spread[0] * Math.pow(e, I.spread[1]);
  const Dc = anneal === 'none' ? 0 : I.diffusion[ANNEALS.indexOf(anneal) - 1];
  const add = anneal === 'none' ? 0 : Math.sqrt(2 * Dc * ANNEAL_TIME[anneal]) * 1e7;
  const s = Math.sqrt(s0 * s0 + add * add);
  const C = (x, sg = s) => dose / (Math.sqrt(2 * Math.PI) * sg * 1e-7) * Math.exp(-(x - Rp) * (x - Rp) / (2 * sg * sg));
  const pk = C(Rp, s), sol = I.solubility * ANNEAL_SOL[anneal];
  const xj = pk > BACKGROUND ? Rp + s * Math.sqrt(2 * Math.log(pk / BACKGROUND)) : null;
  const active = clamp(anneal === 'none' ? 0.03 : (pk <= sol ? ANNEAL_ACTIVE[anneal] : ANNEAL_ACTIVE[anneal] * Math.min(1, (sol / pk) * 1.6)), 0, 1);
  const notes = [];
  if (dose >= I.amorphous) notes.push('amorphous');
  notes.push(anneal);
  if (pk > sol && anneal !== 'none') notes.push('oversoluble');
  if (xj && xj < 20) notes.push('shallow'); else if (xj && xj > 300) notes.push('deep');
  return { ion, type: I.type, anneal, energy: e, dose, Rp, spread0: s0, spread: s, peak: pk, solubility: sol, xj, active, activePct: Math.round(active * 100), amorphous: dose >= I.amorphous, notes, profile: C };
}

/* ---- the challenges (each group is matched by some result the lab reported; see fabkit.js) ---- */
export const DOPE_CHALLENGES = [
  { id: 'too-hot', lab: 'semiconductor', groups: [r => r.T !== undefined && r.n !== undefined && r.T >= 590 && r.T <= 615] },
  { id: 'furnace', lab: 'implant', groups: [
    r => r.ion === 'B' && r.energy < 10 && r.energy.toFixed(1) === '2.0' && r.anneal === 'furnace',
    r => r.ion === 'B' && r.energy < 10 && r.energy.toFixed(1) === '2.0' && r.anneal === 'laser'] },
  { id: 'shallow', lab: 'implant', groups: [r => r.type === 'n' && r.xj !== null && r.xj !== undefined && r.xj < 15 && r.activePct > 95] }
];

