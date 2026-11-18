/* Lithography and the EUV scanner, as models (gathered by fabsteps.js).
   Ported from the earlier site (the branch 'before': the lithography and EUV scanner labs of its litho topic), same
   formulas, constants and seeds, with the screen taken out. Pure.

   Printing (Abbe imaging of a 50% line and space grating): a grating of pitch p splits the light into orders at sin
   angles m lambda / p; the lens (numerical aperture NA) catches only the orders that fall inside its pupil. The
   image is the sum of the caught orders; the resist keeps what is lit above a threshold of 0.3 (times the dose). Half pitch hp
   = p / 2, and the Rayleigh rule is hp = k1 lambda / NA, so k1 = hp NA / lambda (single exposure can go down to
   about 0.25 with the light coming in off-axis). Illumination 'dipole' tilts the light by lambda / 2P (at most
   0.95 NA) from two sides; double patterning splits the lines over two masks at twice the pitch (cost x2, a duty of
   0.25 each). It prints if the image keeps at least 5% contrast, the line is not lost or merged; 'marginal' if the
   printed width is more than 12% off or contrast under 35%.
   The scanner (the 'throughput model'): the light left at the wafer is source x reflectivity^mirrors; exposure time =
   dose x 700 cm2 / power, plus 12.6 s per wafer for stage moves, alignment and exchange (calibrated to about 230 wafers
   an hour at 600 W and 50 mJ/cm2). An EUV photon is 92 eV, so 1 mJ/cm2 is 0.678 photons per nm2; nine 16 nm contact holes
   on a 32 nm pitch on a 1 nm grid catch photons at random (Poisson, about 20% absorbed, blurred by 3 nm); a hole fails if
   its printed area is under 60% or over 150% of target. */
import { rng, gauss, metBy } from './fabkit.js';

/* ---- the light sources ---- */
export const SOURCES = [
  { id: 'iline', lam: 365, na: 0.6, min: 0.35, max: 0.65 },
  { id: 'krf', lam: 248, na: 0.8, min: 0.5, max: 0.93 },
  { id: 'arf-dry', lam: 193, na: 0.93, min: 0.6, max: 0.93 },
  { id: 'arf-imm', lam: 193, na: 1.35, min: 0.9, max: 1.35 },
  { id: 'euv', lam: 13.5, na: 0.33, fixed: true },
  { id: 'high-na', lam: 13.5, na: 0.55, fixed: true },
  { id: 'hyper-na', lam: 13.5, na: 0.75, fixed: true }
];
export const sourceOf = id => SOURCES.find(s => s.id === id) || null;
export const naOf = (src, na) => src.fixed ? src.na : Math.min(src.max, Math.max(src.min, na ?? src.na));
export const hpOfSlider = v => 5 * Math.pow(40, v / 1000);                   // the first version's slider: 0 to 1000 over 5 to 200 nm
export const rayleigh = (k1, lam, NA) => k1 * lam / NA;                       // the smallest half pitch
export const k1Of = (hp, NA, lam) => hp * NA / lam;
export const LITHO_DEFAULTS = { src: 'euv', hp: hpOfSlider(279), dose: 0.86, illum: 'dipole', dp: false };
export const THRESHOLD = 0.3;

function img(p, lam, NA, tilt, duty, x) {
  const M = Math.ceil((NA + Math.abs(tilt)) * p / lam) + 1;
  let re = 0, im = 0;
  for (let m = -M; m <= M; m++) {
    const f = tilt + m * lam / p;
    if (Math.abs(f) > NA + 1e-9) continue;
    const cm = m === 0 ? duty : Math.sin(Math.PI * m * duty) / (Math.PI * m), ph = 2 * Math.PI * m * x / p;
    re += cm * Math.cos(ph); im += cm * Math.sin(ph);
  }
  return re * re + im * im;
}
/* the diffraction orders a grating of pitch p sends into (or past) the pupil: [order, direction, caught] */
export function orders(p, lam, NA, tilt) {
  const out = [], M = Math.ceil((NA * 1.9 + Math.abs(tilt)) * p / lam) + 1;
  for (let m = -M; m <= M; m++) { const f = tilt + m * lam / p; out.push([m, f, Math.abs(f) <= NA + 1e-9]); }
  return out;
}

/* Print a grating. settings: { src, na, hp (nm), dose, illum ('conventional' | 'dipole'), dp (double patterning) }. */
export function litho(settings = {}) {
  const c = { ...LITHO_DEFAULTS, ...settings }, s = sourceOf(c.src), lam = s.lam, NA = naOf(s, c.na), hp = c.hp, p = 2 * hp;
  const P = c.dp ? 2 * p : p, duty = c.dp ? 0.25 : 0.5;
  const tilt = c.illum === 'dipole' ? Math.min(lam / (2 * P), 0.95 * NA) : 0;
  const I = x => (tilt ? (img(P, lam, NA, tilt, duty, x) + img(P, lam, NA, -tilt, duty, x)) / 2 : img(P, lam, NA, 0, duty, x)) * c.dose;
  const n = 600; let mx = -1, mn = 9, cd = 0, allOn = true;
  for (let i = 0; i < n; i++) { const v = I(-P / 2 + P * i / n); mx = Math.max(mx, v); mn = Math.min(mn, v); if (v > THRESHOLD) cd += P / n; else allOn = false; }
  const contrast = (mx - mn) / (mx + mn || 1), target = p / 2;
  let err = Math.abs(cd - target) / target, status = 'ok';
  const merged = c.dp && cd >= 1.5 * p;
  if (contrast < 0.05 || cd === 0 || allOn || merged) { status = 'bad'; err = NaN; }
  else if (err > 0.12 || contrast < 0.35) status = 'marginal';
  const caught = orders(P, lam, NA, tilt).filter(o => o[2]).length;
  return { src: c.src, lam, na: NA, hp, p, P, dose: c.dose, illum: c.illum, dp: c.dp, tilt, k1: k1Of(hp, NA, lam), contrast, cd, widthErr: err, status, masks: c.dp ? 2 : 1, caught, intensity: I };
}
/* where the resist stays after develop: intervals [from, to] in nm across -2p..2p */
export function resistLines(r, n = 500) {
  const x0 = -2 * r.p, x1 = 2 * r.p, out = []; let i0 = null;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n; let ex = r.intensity(x) > THRESHOLD;
    if (r.dp) ex = ex || r.intensity(x - r.p) > THRESHOLD;
    if (!ex && i0 === null) i0 = x;
    if ((ex || i === n) && i0 !== null) { out.push([i0, x]); i0 = null; }
  }
  return out;
}
/* the finest half pitch (nm) a source can still print at its best settings (largest NA, either lighting, one or two masks), scanned along the slider */
const finestCache = {};
export function finestHalfPitch(srcId) {
  if (finestCache[srcId]) return finestCache[srcId];
  const s = sourceOf(srcId), NA = naOf(s, 9);
  let best = Infinity;
  for (let v = 0; v <= 1000; v += 5) for (const illum of ['conventional', 'dipole']) for (const dp of [false, true]) {
    const hp = hpOfSlider(v); if (hp >= best) continue;
    if (litho({ src: srcId, na: NA, hp, dose: 0.86, illum, dp }).status !== 'bad') best = hp;
  }
  return (finestCache[srcId] = best);
}

/* ---- the EUV scanner ---- */
export const EUV_DEFAULTS = { power: 600, reflect: 0.7, mirrors: 11, dose: 50 };      // W, per mirror, count, mJ/cm2
export const EUV_RANGE = { power: [250, 1000], reflect: [0.6, 0.72], mirrors: [8, 14], dose: [15, 80] };
export const EUV = { overheadSec: 12.6, areaCm2: 700, photonsPerNm2PerMJ: 0.678, absorbed: 0.2, holeNm: 16, target: 201, tol: 0.1, grid: 96 };
export function euv(settings = {}) {
  const { power: p, reflect: r, mirrors: n, dose: d } = { ...EUV_DEFAULTS, ...settings };
  const atWafer = p * Math.pow(r, n), exposeSec = d / 1000 * EUV.areaCm2 / atWafer, wph = 3600 / (exposeSec + EUV.overheadSec);
  const perNm2 = d * EUV.photonsPerNm2PerMJ, hole = Math.PI * 64 * perNm2, abs = hole * EUV.absorbed;
  return { power: p, reflect: r, mirrors: n, dose: d, atWafer, atWaferPct: atWafer / p * 100, exposeSec, wph, wphRounded: Math.round(wph), photonsPerNm2: perNm2, photonsPerHole: hole, noisePct: 100 / Math.sqrt(abs), absorbedPerNm2: perNm2 * EUV.absorbed };
}
/* the most wafers an hour any setting in the ranges reaches (the answer to "can it reach 330?") */
export function euvBest() {
  const R = EUV_RANGE; return euv({ power: R.power[1], reflect: R.reflect[1], mirrors: R.mirrors[0], dose: R.dose[0] });
}
/* Expose nine contact holes by random photon counts. Returns bad (holes out of spec, of 9), area of each, printed (96 x 96, 1 = open). */
export function euvExpose(settings = {}, seed = 1) {
  const d = settings.dose ?? EUV_DEFAULTS.dose, G = EUV.grid, lamOpen = d * EUV.photonsPerNm2PerMJ * EUV.absorbed, r = rng(seed * 131 + d * 7);
  const cnt = new Float32Array(G * G), cen = [16, 48, 80];
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const cx = cen[Math.min(2, Math.floor(x / 32))], cy = cen[Math.min(2, Math.floor(y / 32))];
    const l = 1 / (1 + Math.exp((Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - 8) / 1.2)) * lamOpen;
    let k = 0;
    if (l > 30) k = Math.max(0, Math.round(l + Math.sqrt(l) * gauss(r)));
    else if (l > 0) { const Lx = Math.exp(-l); let pp = 1; do { k++; pp *= r(); } while (pp > Lx); k--; }
    cnt[y * G + x] = k;
  }
  const printed = new Uint8Array(G * G), thr = 0.5 * lamOpen, area = new Array(9).fill(0);
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    let s = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < G && yy < G) { s += cnt[yy * G + xx]; n++; } }
    if (s / n > thr) { printed[y * G + x] = 1; area[Math.min(2, Math.floor(y / 32)) * 3 + Math.min(2, Math.floor(x / 32))]++; }
  }
  /* in spec: the hole's area within a tenth of its target (about 5% in width). A looser band never caught a hole at any
     dose the scanner can be set to, so the price of a small dose could not be seen. */
  const ok = area.map(a => Math.abs(a - EUV.target) <= EUV.tol * EUV.target);
  return { dose: d, seed, area, ok, bad: ok.filter(v => !v).length, printed };
}

export const LITHO_CHALLENGES = [
  /* every source printed down near its own finest half pitch (within 10%) by some setting (the first version gave no check) */
  { id: 'litho-finest', lab: 'lithography', groups: SOURCES.map(s => r => r.src === s.id && r.status !== 'bad' && r.hp <= finestHalfPitch(s.id) * 1.1) },
  { id: 'euv-1000', lab: 'euv', groups: [r => r.power >= 1000 && r.wphRounded >= 275] }
];

export const LITHO_WORDS = {
  'fab.litho.src.iline': 'i-line', 'fab.litho.src.krf': 'KrF', 'fab.litho.src.arf-dry': 'ArF dry', 'fab.litho.src.arf-imm': 'ArF immersion',
  'fab.litho.src.euv': 'EUV', 'fab.litho.src.high-na': 'High-NA EUV', 'fab.litho.src.hyper-na': 'Hyper-NA (research)',
  'fab.litho.era.iline': '1990s', 'fab.litho.era.krf': 'late 1990s', 'fab.litho.era.arf-dry': '2000s', 'fab.litho.era.arf-imm': '2007 →', 'fab.litho.era.euv': '2019 →', 'fab.litho.era.high-na': '2026 →', 'fab.litho.era.hyper-na': '2030s?',
  'fab.litho.illum.conventional': 'Conventional', 'fab.litho.illum.dipole': 'Off-axis dipole', 'fab.litho.illum.dp': 'Double patterning (split onto two masks)',
  'fab.litho.status.ok': 'Prints', 'fab.litho.status.marginal': 'Marginal', 'fab.litho.status.bad': 'Fails: pattern lost',
  'fab.litho.masks.1': '1', 'fab.litho.masks.2': '2 (cost x2)',
  'fab.euv.holes': 'Holes out of spec',
  'fab.ch.litho-finest.t': 'Print the finest lines',
  'fab.ch.litho-finest.goal': 'Find the smallest pitch each scanner can still print.',
  'fab.ch.litho-finest.done': 'Every scanner printed lines near the finest its light and lens allow: half pitch = k1 x wavelength / NA, with a shorter wavelength or a bigger lens (or cleverer light) giving finer lines.',
  'fab.ch.euv-1000.t': 'The 1,000-watt source',
  'fab.ch.euv-1000.goal': 'Turn the light source up to 1,000 W and try every other setting. Can this scanner reach the 330 wafers per hour ASML aims for by 2030? If not, what is left that would have to change?',
  'fab.ch.euv-1000.done': 'In this model it cannot: even the best settings reach about 280 wafers per hour, because each wafer also spends 12.6 s on stage moves, alignment and exchange. Reaching 330 needs faster stages too, not only more light.'
};
