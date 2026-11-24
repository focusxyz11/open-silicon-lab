/* Invent a transistor (#329, the switch level): a switch made of a material, in a shape, switching one way, against
   today's silicon fin and the 60 mV line. Pure logic, no DOM, no words (ids only); tests in tests/switch.test.mjs.
   A compact model with honest trends, not a device simulator; the lab says so. The semiconductor engine's switch
   (src/engines/dope.js mosfet) is its silicon case: a flat silicon switch turns on at the swing computed here.

   The switch. Current flows from source to drain through a channel; the gate's voltage lets it through or stops it.
   - How steeply it turns on: the swing, millivolts of gate voltage for each tenfold more current. Carriers that go
     over a barrier (thermionic, today's switch) need at least (kT/q) ln 10 for each tenfold, about 60 mV at room
     temperature (facts.json switch-60mv): swingLimit(T). The gate never holds the channel perfectly, so the swing is
     that limit times a body factor m >= 1 (SHAPES: a flat gate holds it least, one wrapped all around it most; the flat
     silicon switch's 1.26 gives dope.js's 75 mV). Traps at a poor insulator's interface hold charge too and soften
     it more: m grows by Cit/Cox, the traps' capacitance (q Dit) against a gate insulator 1 nm thick (silicon dioxide's
     equivalent). Tunnelling through the barrier instead (a lab result: 31.1 mV per tenfold over four tenfolds,
     facts.json tfet-2d) is not bound by the limit, but its current is small and falls fast with a wider gap
     (exp(-4.5 Eg^1.5), the shape of the tunnelling probability's fall; its constant is the lab's choice). A ferroelectric
     in the gate (negative capacitance, facts.json ncfet) amplifies the gate's voltage: m falls by NC_GAIN.
   - Whether it turns off at all: the band gap sets the floor of the current when off. Without a gap (graphene) the
     on-off ratio is about 10 (facts.json graphene-off: 2 to 20); each 2 kT ln 10 of gap (0.119 eV at 300 K) adds a
     tenfold, as carriers leak across the gap as exp(-Eg / 2kT). A clean switch, here, has ten thousand times less
     current off than on (DECADES), with half a tenfold to spare.
   - The lowest voltage for a clean switch: the turn-on (DECADES tenfolds at its swing) plus three spreads of the
     copies' threshold on each side, so that nearly every copy on a chip both turns off at 0 V and on at the supply.
     The spread (sigma, mV) is the shape's (a flat, doped channel varies most), tubes' (their diameters vary) and the
     traps' (charge held differently in each copy). These spreads and the traps of each material are the lab's
     simplification, not measured values: the lab marks them so (src/data/fidelity.js, an idea drawn).
   - Energy per switch: C V^2, at the same load, so against silicon it is (V / V_silicon)^2.
   - Speed: current over voltage (a load's charge C V delivered by the current), against silicon. The on-current is
     the mechanism's share times the channel's mobility, saturated: in a channel a few nanometres long carriers stop
     gaining from mobility (mu / (1 + mu / MU_SAT), the lab's simplification of velocity saturation). Speed is the
     electron switch's.
   - Both carriers (a CMOS pair, an electron switch and a hole switch side by side): holes no slower than a tenth of
     electrons (PAIR), else the pair needs a second material.
   - Something a factory could make: a known material, both carriers, and a channel that survives every step of the
     line after it goes in (src/engines/fabline.js heatAfter: a crystal goes in at the front and meets the 1,050 °C
     anneal, a sheet or tubes are laid on a finished chip and meet only the back end's 400 °C). A melting point is the
     hard limit; many materials spoil below it, so the check is generous.

   Invent your own material: a band gap, electron and hole mobility, and how clean its insulator is (traps per cm2 per
   eV). It must sit within the band the known materials make: no faster at its gap than the best known material at
   that gap, read off the upper edge of the known materials' points (log mobility against gap, a bigger gap tends to
   mean slower carriers; facts.json graphene-off). Outside it, the switch is a guess and never counts as beating
   silicon. An invented material is a guess to a machine either way (nobody has made it), and never a factory's.

   A spec is { mat, shape, mech, own }: mat an id of MATERIALS or 'own' (then own = { eg, me, mh, dit }). */
import { heatAfter } from './fabline.js';

export const K_B = 8.617333e-5;            // eV per kelvin
export const T_ROOM = 300;
export const DECADES = 4;                  // a clean switch: ten thousand times less current off than on
export const SPARE = 0.5;                  // and half a tenfold to spare below the leakage floor
export const MU_SAT = 2500;                // cm2/Vs: where a short channel stops gaining from mobility
export const PAIR = 0.1;                   // holes at least a tenth of electrons for a CMOS pair
export const NC_GAIN = 0.25;               // how much a ferroelectric lowers the body factor
const COX = 3.9 * 8.854e-14 / 1e-7, Q = 1.602e-19;   // F/cm2 of 1 nm of silicon dioxide; the charge of an electron
export const STATUS = ['product', 'lab', 'guess'];

/* the 60 mV line: mV of gate voltage per tenfold, at the least, for carriers over a barrier at T kelvin */
export const swingLimit = (T = T_ROOM) => Math.LN10 * K_B * T * 1000;
/* the traps' share of the gate's grip: Cit / Cox */
export const trapLoad = dit => Q * dit / COX;

/* the known materials: band gap (eV), electron and hole mobility (cm2/Vs; null: holes not usable), traps at its
   insulator (per cm2 per eV, the lab's simplification), the form it comes in, the stage of the line it goes in at,
   its melting point (°C), how ready it is for logic, and its source (facts.json) */
export const MATERIALS = [
  { id: 'si', eg: 1.12, me: 1400, mh: 450, dit: 1e10, form: 'bulk', stage: 'front', melt: 1412, status: 'product', fact: 'mat-si' },
  { id: 'ge', eg: 0.66, me: 3900, mh: 1900, dit: 1e12, form: 'bulk', stage: 'front', melt: 937, status: 'lab', fact: 'mat-ge' },
  { id: 'ingaas', eg: 0.74, me: 12000, mh: 300, dit: 3e12, form: 'bulk', stage: 'front', melt: 1100, status: 'lab', fact: 'mat-ingaas' },
  { id: 'gan', eg: 3.39, me: 2000, mh: 31, dit: 1e12, form: 'bulk', stage: 'front', melt: 2500, status: 'product', fact: 'mat-gan' },
  { id: 'mos2', eg: 1.8, me: 36, mh: null, dit: 1e12, form: 'sheet', stage: 'back', melt: null, status: 'lab', fact: 'mat-mos2' },
  { id: 'cnt', eg: 0.7, me: 100000, mh: 100000, dit: 1e12, form: 'tube', stage: 'back', melt: null, status: 'lab', fact: 'mat-cnt' },
  { id: 'graphene', eg: 0, me: 10000, mh: 10000, dit: 1e12, form: 'sheet', stage: 'back', melt: null, status: 'lab', fact: 'graphene-off' }
];
export const MATERIAL_IDS = MATERIALS.map(m => m.id);
/* the shapes: the body factor m, the spread of the copies' thresholds (mV), the forms of material each holds, and how
   ready it is (gate all around is in volume production: facts.json tsmc-n2) */
export const SHAPES = [
  { id: 'planar', m: 1.26, sigma: 20, forms: ['bulk', 'tube'], status: 'product' },
  { id: 'fin', m: 1.12, sigma: 12, forms: ['bulk'], status: 'product' },
  { id: 'gaa', m: 1.05, sigma: 10, forms: ['bulk', 'tube', 'sheet'], status: 'product', fact: 'tsmc-n2' },
  { id: 'sheet', m: 1.03, sigma: 12, forms: ['sheet'], status: 'lab' }
];
export const SHAPE_IDS = SHAPES.map(s => s.id);
const FORM_SIGMA = { bulk: 0, sheet: 2, tube: 6 };   // tubes' diameters vary, and so do their thresholds
const TRAP_SIGMA = 4;                                // mV of spread per 10^12 traps per cm2 per eV
/* the ways to switch */
export const MECHS = [
  { id: 'therm', status: 'product', fact: 'switch-60mv' },
  { id: 'tunnel', status: 'lab', fact: 'tfet-2d' },
  { id: 'nc', status: 'lab', fact: 'ncfet' }
];
export const MECH_IDS = MECHS.map(m => m.id);
export const START = { mat: 'si', shape: 'fin', mech: 'therm' };
/* the dials of an invented material: [least, most]; mobility and traps on a scale of powers of ten */
export const OWN_RANGE = { eg: [0, 3.4], me: [10, 100000], mh: [1, 100000], dit: [1e10, 1e13] };
export const OWN_START = { eg: 1.12, me: 1400, mh: 450, dit: 1e10 };

export const materialOf = id => MATERIALS.find(m => m.id === id) || null;
export const shapeOf = id => SHAPES.find(s => s.id === id) || null;
export const mechOf = id => MECHS.find(m => m.id === id) || null;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
/* an invented material, its dials kept inside their range */
export function ownOf(o = {}) {
  const v = Object.assign({}, OWN_START, o), R = OWN_RANGE;
  return { id: 'own', eg: clamp(+v.eg, R.eg[0], R.eg[1]), me: clamp(+v.me, R.me[0], R.me[1]), mh: clamp(+v.mh, R.mh[0], R.mh[1]), dit: clamp(+v.dit, R.dit[0], R.dit[1]),
    form: 'bulk', stage: 'front', melt: null, status: 'guess', own: true };
}
/* the material of a spec */
export const matOf = spec => (spec && spec.mat === 'own' ? ownOf(spec.own) : materialOf((spec && spec.mat) || 'si') || materialOf('si'));
/* the shapes a material comes in */
export const shapesFor = mat => SHAPES.filter(s => s.forms.includes(mat.form)).map(s => s.id);
/* a spec made whole: a shape the material comes in (else its first), a known way to switch */
export function normal(spec = {}) {
  const s = Object.assign({}, START, spec), M = matOf(s), ok = shapesFor(M);
  if (!ok.includes(s.shape)) s.shape = ok.includes('fin') ? 'fin' : ok[0];
  if (!mechOf(s.mech)) s.mech = 'therm';
  if (s.mat === 'own') s.own = Object.assign({}, OWN_START, s.own || {}); else delete s.own;
  if (!materialOf(s.mat) && s.mat !== 'own') s.mat = 'si';
  return s;
}

/* ---- the band the known materials make: the upper edge of log mobility against gap ---- */
function edge(points, g) {
  const P = points.slice().sort((a, b) => a[0] - b[0]);
  if (g >= P[P.length - 1][0]) return P.filter(p => p[0] === P[P.length - 1][0]).reduce((m, p) => Math.max(m, p[1]), -Infinity);
  let best = -Infinity;
  for (const a of P) for (const b of P) {
    if (a[0] > g || b[0] < g) continue;
    const y = b[0] === a[0] ? Math.max(a[1], b[1]) : a[1] + (b[1] - a[1]) * (g - a[0]) / (b[0] - a[0]);
    best = Math.max(best, y);
  }
  return best;
}
const E_PTS = MATERIALS.map(m => [m.eg, Math.log10(m.me)]), H_PTS = MATERIALS.filter(m => m.mh).map(m => [m.eg, Math.log10(m.mh)]);
/* the most a material of gap g can have, as known materials go: { me, mh } in cm2/Vs */
export const band = g => ({ me: Math.pow(10, edge(E_PTS, g)), mh: Math.pow(10, edge(H_PTS, g)) });
/* is an invented material within the band? a hair of rounding is forgiven */
export function inBand(own) {
  const o = ownOf(own), B = band(o.eg), me = o.me <= B.me * 1.001, mh = o.mh <= B.mh * 1.001;
  return { ok: me && mh, me, mh, band: B };
}
/* the band drawn: its upper edge for electrons and holes at n gaps from 0 to the widest dial */
export function bandEdge(n = 35) {
  return Array.from({ length: n }, (_, i) => { const g = OWN_RANGE.eg[1] * i / (n - 1), B = band(g); return { eg: g, me: B.me, mh: B.mh }; });
}

/* ---- the switch ---- */
const RANK = { product: 0, lab: 1, guess: 2 };
const weakest = list => list.reduce((w, s) => (RANK[s] > RANK[w] ? s : w), 'product');
const muEff = mu => mu / (1 + mu / MU_SAT);
/* the raw model of a switch: everything but the comparison with silicon */
function raw(spec, T) {
  const s = normal(spec), M = matOf(s), S = shapeOf(s.shape), X = mechOf(s.mech), S0 = swingLimit(T), cit = trapLoad(M.dit);
  const m = S.m + cit;
  let swing, share;
  if (s.mech === 'tunnel') { swing = 0.54 * swingLimit(T_ROOM) * S.m + 2 * S0 * cit; share = Math.exp(-4.5 * Math.pow(M.eg, 1.5)); }
  else if (s.mech === 'nc') { swing = S0 * (m - NC_GAIN); share = 0.9; }
  else { swing = S0 * m; share = 1; }
  const sigma = S.sigma + FORM_SIGMA[M.form] + TRAP_SIGMA * M.dit / 1e12;
  /* the leakage floor: tenfolds between on and the least current off */
  const floor = Math.min(10, 1 + M.eg / (2 * K_B * T * Math.LN10));
  const clean = floor >= DECADES + SPARE;
  const vt = (DECADES * swing + 3 * sigma) / 1000, vmin = clean ? vt + 3 * sigma / 1000 : NaN;
  const ion = share * muEff(M.me);
  const pair = M.mh != null && M.mh / M.me >= PAIR;
  const B = M.own ? inBand(M) : { ok: true };
  const heat = heatAfter(M.stage), survives = !M.own && (M.melt == null ? M.stage === 'back' : M.melt > heat);
  const status = weakest([M.status, S.status, X.status]);
  return { spec: s, mat: M, T, swing, m, cit, sigma, floor, clean, vt, vmin, ion, share, pair, inBand: B.ok, fair: !M.own || B.ok,
    heat, survives, status, own: !!M.own };
}
const REF = raw(START, T_ROOM);
/* the switch: its raw model, against today's silicon fin (energy and speed as factors, 1 is silicon), and the goals */
export function switchOf(spec, T = T_ROOM) {
  const r = raw(spec, T);
  r.energy = r.clean ? Math.pow(r.vmin / REF.vmin, 2) : NaN;
  r.speed = r.clean ? (r.ion / REF.ion) / (r.vmin / REF.vmin) : NaN;
  r.steep = r.swing < swingLimit(T);
  r.goals = goalsOf(r);
  return r;
}
export const SILICON = switchOf(START);

/* ---- the four goals (played in Do at #/dive/switch, src/v2/labs/switch.js) ----
   off      a switch that really turns off (graphene never does);
   energy   less energy per switch than the silicon fin (a new shape does it before a new material does);
   steep    steeper than the 60 mV line (only a new way to switch);
   factory  a better switch a factory could make: a known material that survives the line, both carriers, less energy
            than silicon, and at least half its speed (SLOWEST: a switch far slower would need far more of them).
   A switch made of an invented material outside the band counts for none of them. */
export const GOALS = ['off', 'energy', 'steep', 'factory'];
export const SLOWEST = 0.5;
export function goalsOf(r) {
  const ok = r.clean && r.fair;
  return { off: ok, energy: ok && r.energy < 1 - 1e-9, steep: ok && r.swing < swingLimit(r.T), factory: ok && !r.own && r.survives && r.pair && r.energy < 1 - 1e-9 && r.speed >= SLOWEST };
}
/* the challenge is won when every goal was met by some switch the player tried (seen: switches, or specs) */
export function won(seen) {
  const got = {};
  for (const x of seen || []) { const g = x && x.goals ? x.goals : switchOf(x).goals; GOALS.forEach(k => { if (g[k]) got[k] = true; }); }
  return GOALS.every(k => got[k]);
}

/* ---- the switching curve: log10 of the current (amps per micrometre of width) against the gate's voltage ----
   A silicon fin carries about 1 mA per micrometre when on; a switch's on-current is that times its own against
   silicon's. The nominal copy's threshold sits at vt; shift moves it (in mV) to draw the spread of the copies. */
export const ION_SI = 1e-3;
export function current(r, V, shift = 0) {
  const on = Math.log10(ION_SI * r.ion / REF.ion), x = (r.vt + shift / 1000 - V) * 1000 / r.swing;
  const l = on - (x > 30 ? x : Math.log10(1 + Math.pow(10, x)));
  return Math.max(on - r.floor, l);
}
export function curve(r, n = 121, vmax = 1, shift = 0, vmin = 0) {
  return Array.from({ length: n }, (_, i) => { const V = vmin + (vmax - vmin) * i / (n - 1); return [V, current(r, V, shift)]; });
}

/* ---- your switch up the scales: what a machine's block made of it gets (src/engines/machine.js yours) ----
   energy against a circuit of silicon fins (Infinity if it never turns off cleanly), its status (how sure: an invented
   material is a guess to a machine, whatever its band), and whether it can be made into a block: it turns off, and a
   known material survives the line and has both carriers (an invented one is let through as a guess, whose gain
   counts only if the guesses hold) */
export function forMachines(spec) {
  const r = switchOf(spec);
  return { energy: r.clean ? r.energy : Infinity, status: r.own ? 'guess' : r.status, makeable: r.clean && (r.own || (r.survives && r.pair)), spec: r.spec };
}

/* ---- a switch as a short word, as a machine's plan holds it (plan.sw) and a ledger entry keeps it ----
   'si/gaa/therm', or for an invented material 'own:<gap>:<electrons>:<holes>:<traps>/<shape>/<way>' */
const num = v => String(+(+v).toPrecision(3));
export function specKey(spec) {
  const s = normal(spec), m = s.mat === 'own' ? 'own:' + ['eg', 'me', 'mh', 'dit'].map(k => num(ownOf(s.own)[k])).join(':') : s.mat;
  return m + '/' + s.shape + '/' + s.mech;
}
export function specOf(key) {
  const [m, shape, mech] = String(key || '').split('/'), [mat, ...own] = String(m || '').split(':');
  if (mat === 'own') { const [eg, me, mh, dit] = own.map(Number); if ([eg, me, mh, dit].every(isFinite)) return normal({ mat, shape, mech, own: { eg, me, mh, dit } }); return normal(START); }
  return normal({ mat: materialOf(mat) ? mat : 'si', shape, mech });
}
