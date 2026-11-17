/* The patterning loop and four of the fab's tools, as models (gathered by fabsteps.js): the loop's layers, the
   cleanroom, CVD against ALD in a trench, overlay, and die-to-die inspection.
   Ported from the earlier site (the branch 'before': the fab topic's labs fab-loop, cleanroom, ald-vs-cvd, overlay
   and inspection), same formulas, constants and seeds, with the screen taken out. Pure.

   Loop: ten steps (clean, deposit a film, coat resist, expose, develop, etch, strip, fill metal, polish, inspect);
   layerAt(step, p) says how far each layer of the picture has got when step is p (0 to 1) done.
   Cleanroom: ISO 14644-1 class N allows 10^N x (0.1/D)^2.08 particles of size D um and larger per cubic metre; the first
   version used D = 0.1 um (so 10^N per m3), and extrapolated ISO 9 for ordinary air.
   Deposition: a 40 nm trench of a chosen depth over width. ALD adds 0.1 nm everywhere per cycle (2 s a cycle); CVD adds
   0.2 nm at the top per step (0.2 s) and less further down, as exp(-depth / (1.1 x the opening left)), and stops
   when the opening is under 0.6 nm: a closed trench traps a void. Both stop at 24 nm on top.
   Overlay: vias are 14 nm wide on a 28 nm pitch and a via fails if less than 70% of it lands on its wire, that is when
   the error is over 4.2 nm; the error is a shift plus a Gaussian spread; a chip has 10 billion vias.
   Inspection: three dies of 60 x 60 cells with the same wire pattern, one of which holds a bridge, a break or a particle;
   a cell that disagrees with both other dies is flagged. */
import { rng, gauss, clamp } from './fabkit.js';

/* ---- the loop ---- */
export const LOOP_STEPS = ['clean', 'deposit', 'coat', 'expose', 'develop', 'etch', 'strip', 'fill', 'polish', 'inspect'];
export const LOOP_START = 5;              // the first version opened on the etch
export const LOOP_LAYERS = 70;            // "repeat for each of 70+ mask layers"
/* every value is a fraction 0..1 (the first version drew the film 46, the resist 26 and the metal overburden 14 units tall):
   film, resist (thickness), expo (how exposed), open (how open the resist still is over the trenches), depth (of the
   trench etched), fill (copper in the trenches), over (copper above the film, to be polished away) */
export function layerAt(step, p = 1) {
  const s = clamp(step | 0, 0, LOOP_STEPS.length - 1);
  return {
    film: s < 1 ? 0 : s === 1 ? p : 1,
    resist: s < 2 ? 0 : s === 2 ? p : s < 6 ? 1 : s === 6 ? 1 - p : 0,
    expo: s < 3 ? 0 : s === 3 ? p : 1,
    open: s < 4 ? 1 : s === 4 ? 1 - p : 0,
    depth: s < 5 ? 0 : s === 5 ? p : 1,
    fill: s < 7 ? 0 : s === 7 ? p : 1,
    over: s < 7 ? 0 : s === 7 ? p : s === 8 ? 1 - p : 0
  };
}

/* ---- the cleanroom ---- */
export const CLEAN_CLASSES = [{ id: 'iso1', n: 1 }, { id: 'iso3', n: 3 }, { id: 'iso5', n: 5 }, { id: 'iso7', n: 7 }, { id: 'room', n: 9 }];
export const CLEAN_DEFAULT = 2;           // ISO 5, a typical semiconductor cleanroom
export const CLEAN_SCALE = { particleNm: 100, gatePitchNm: 48, smallParticleNm: 20, hairTimes: 800, shownMax: 2500 };
export const isoLimit = (n, dUm = 0.1) => Math.pow(10, n) * Math.pow(0.1 / dUm, 2.08);
export function cleanroom(index = CLEAN_DEFAULT) {
  const c = CLEAN_CLASSES[clamp(index | 0, 0, CLEAN_CLASSES.length - 1)], perM3 = isoLimit(c.n), perL = perM3 / 1000;
  return { id: c.id, n: c.n, perM3, perL, shown: Math.min(CLEAN_SCALE.shownMax, Math.round(perL)), litresPerParticle: perL < 1 ? Math.round(1 / perL) : null };
}
/* the particles drawn in a litre box, seeded as the first version did: x, y in 0..1 and a fall speed */
export function airParticles(index = CLEAN_DEFAULT) {
  const r = rng(index + 3);
  return Array.from({ length: cleanroom(index).shown }, () => ({ x: r(), y: r(), v: 0.0015 + r() * 0.002 }));
}

/* ---- CVD against ALD ---- */
export const TRENCH = { widthNm: 40, topNm: 24, sides: 60, ald: 0.1, cvd: 0.2, aldSec: 2, cvdSec: 0.2 };
export const DEPO_DEFAULTS = { mode: 'cvd', ar: 6 };
export const DEPO_RANGE = { ar: [1, 12] };
export function depoStart({ mode, ar } = DEPO_DEFAULTS) {
  return depoRead({ mode: mode || 'cvd', ar: ar ?? 6, top: 0, side: new Float32Array(TRENCH.sides), bot: 0, closed: false, time: 0, cycles: 0, phase: 0, done: false });
}
export function depoStep(s) {
  if (s.done) return s;
  const W0 = TRENCH.widthNm, NS = TRENCH.sides, d = W0 * s.ar, side = s.side.slice();
  let { top, bot, closed, time, cycles, phase } = s;
  if (s.mode === 'ald') {
    for (let k = 0; k < 2 && top < TRENCH.topNm; k++) { top += 0.1; for (let i = 0; i < NS; i++) side[i] = Math.min(W0 / 2, side[i] + 0.1); bot = Math.min(d, bot + 0.1); cycles++; time += TRENCH.aldSec; }
    phase = (phase + 1) % 4;
  } else {
    const r0 = 0.2, open = W0 - 2 * side[0];
    if (open <= 0.6) closed = true;
    if (!closed) { const o = Math.max(open, 1); for (let i = 0; i < NS; i++) { const z = d * i / (NS - 1); side[i] = Math.min(W0 / 2, side[i] + r0 * Math.exp(-z / (1.1 * o))); } bot += r0 * Math.exp(-d / (1.1 * o)); }
    top += r0; time += TRENCH.cvdSec;
  }
  const done = top >= TRENCH.topNm;
  return depoRead({ ...s, top: done ? TRENCH.topNm : top, side, bot, closed, time, cycles, phase, done });
}
/* readings: coverage (bottom over top, 0..1; 1 before anything is deposited), coveragePct (rounded, or null before), voided, status */
export function depoRead(s) {
  const NS = TRENCH.sides, W0 = TRENCH.widthNm;
  const coverage = s.top > 0 ? Math.min(1, Math.max(s.bot, s.side[NS - 1]) / s.top) : 1;
  const voided = s.mode === 'cvd' && s.closed && 2 * s.side[NS - 1] < W0 - 1;
  const filled = s.top >= 20 && 2 * s.side[NS - 1] >= W0 - 1;
  return { ...s, depthNm: W0 * s.ar, coverage, coveragePct: s.top > 0 ? Math.round(coverage * 100) : null, voided, status: voided ? 'void' : filled ? 'filled' : s.mode };
}
export function depoRun(settings = DEPO_DEFAULTS) {
  let s = depoStart(settings);
  while (!s.done) s = depoStep(s);
  return s;
}

/* ---- overlay ---- */
export function erfc(x) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
export const VIA = { widthNm: 14, pitchNm: 28, limitNm: 4.2, perChip: 1e10 };
export const OVERLAY_DEFAULTS = { shift: 0.5, sigma: 1.2 };
export const OVERLAY_RANGE = { shift: [-6, 6], sigma: [0.2, 3] };
export const OVERLAY_Z = (() => { const r = rng(9); return Array.from({ length: 40 }, () => gauss(r)); })();   // the same 40 draws the first version used, for drawing the vias
export function overlay({ shift, sigma } = OVERLAY_DEFAULTS) {
  const k = Math.SQRT2 * sigma, L = VIA.limitNm;
  const p = 0.5 * erfc((L - shift) / k) + 0.5 * erfc((L + shift) / k), failed = p * VIA.perChip;
  return { shift, sigma, p, failed, verdict: failed >= 1 ? 'fail' : failed >= 0.05 ? 'marginal' : 'ok' };
}

/* ---- inspection ---- */
export const INSPECT_SIZE = 60, INSPECT_TYPES = ['bridge', 'open', 'particle'], INSPECT_RADIUS = 5;
export function inspectionWafer(seed = 4) {
  const S = INSPECT_SIZE;
  let dies = null, defect = null;
  for (let tries = 0; tries < 20 && !defect; tries++) {
    const r = rng(seed * 977 + tries), b = new Uint8Array(S * S);
    for (let y = 2; y < S - 3; y += 6) {
      for (let x = 2; x < S - 2; x++) for (let t = 0; t < 3; t++) b[(y + t) * S + x] = 1;
      for (let k = 0; k < 3; k++) { const cx = 4 + Math.floor(r() * (S - 10)); for (let t = 0; t < 3; t++) { b[(y + t) * S + cx] = 0; b[(y + t) * S + cx + 1] = 0; } }
    }
    for (let k = 0; k < 26; k++) { const ly = 2 + 6 * Math.floor(r() * 8), cx = 3 + Math.floor(r() * (S - 6)); for (let a = 0; a < 2; a++) for (let q = 3; q < 6; q++) { const yy = ly + q; if (yy < S) b[yy * S + cx + a] = 1; } }
    dies = [b.slice(), b.slice(), b.slice()];
    const di = Math.floor(r() * 3), type = INSPECT_TYPES[Math.floor(r() * 3)];
    const ly = 2 + 6 * (1 + Math.floor(r() * 6)), x = 6 + Math.floor(r() * (S - 12)), D = dies[di];
    let y;
    if (type === 'bridge') { y = ly + 4; for (let a = 0; a < 2; a++) for (let q = 3; q < 6; q++) D[(ly + q) * S + x + a] = 1; }
    else if (type === 'open') { y = ly + 1; for (let a = 0; a < 3; a++) for (let t = 0; t < 3; t++) D[(ly + t) * S + x + a] = 0; }
    else { y = ly + 4; for (let a = -2; a <= 2; a++) for (let q = -2; q <= 2; q++) if (a * a + q * q <= 5) { const yy = y + q, xx = x + a; if (yy >= 0 && yy < S && xx >= 0 && xx < S) D[yy * S + xx] = 1; } }
    let diff = 0; for (let i = 0; i < S * S; i++) if (D[i] !== b[i]) diff++;
    if (diff >= 3) defect = { di, x, y, type };
  }
  return { seed, dies, defect };
}
/* did a click at cell (cx, cy) of die k find the defect? */
export const inspectGuess = (w, k, cx, cy) => k === w.defect.di && Math.hypot(cx - w.defect.x, cy - w.defect.y) <= INSPECT_RADIUS;
/* the cells of die k that disagree with both other dies */
export function inspectCompare(w, k) {
  const a = w.dies[k], o1 = w.dies[(k + 1) % 3], o2 = w.dies[(k + 2) % 3], out = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== o1[i] && a[i] !== o2[i]) out.push(i);
  return out;
}

export const FABLINE_WORDS = {
  'fab.loop.clean.t': 'Clean', 'fab.loop.clean.text': 'Wet chemistry and scrubbing remove particles and residue. One stray particle can kill a die, so the air in a fab is thousands of times cleaner than a hospital operating room.', 'fab.loop.clean.gear': 'Wet benches and scrubbers (SCREEN, Lam Research)',
  'fab.loop.deposit.t': 'Deposit film', 'fab.loop.deposit.text': 'Grow or deposit an insulating film. Atomic layer deposition (ALD) can build it one atomic layer at a time.', 'fab.loop.deposit.gear': 'CVD and ALD tools (Applied Materials, Lam Research, Tokyo Electron, ASM)',
  'fab.loop.coat.t': 'Coat resist', 'fab.loop.coat.text': 'Spin a light-sensitive photoresist onto the wafer, a film only tens of nanometers thick.', 'fab.loop.coat.gear': 'Coater/developer tracks (Tokyo Electron)',
  'fab.loop.expose.t': 'Expose', 'fab.loop.expose.text': 'The scanner shines EUV light through the mask and shrinks the image 4x onto the resist, stepping across the wafer exposure by exposure.', 'fab.loop.expose.gear': 'EUV scanners (ASML, sole supplier)',
  'fab.loop.develop.t': 'Develop', 'fab.loop.develop.text': 'A developer liquid dissolves the resist that was hit by light, uncovering the film underneath.', 'fab.loop.develop.gear': 'Coater/developer tracks',
  'fab.loop.etch.t': 'Etch', 'fab.loop.etch.text': 'A plasma of reactive ions carves straight down into the film wherever the resist is open.', 'fab.loop.etch.gear': 'Plasma etch (Lam Research, Tokyo Electron, Applied Materials)',
  'fab.loop.strip.t': 'Strip resist', 'fab.loop.strip.text': 'Remove the leftover resist. The pattern now lives in the film itself.', 'fab.loop.strip.gear': 'Ashers and wet strip',
  'fab.loop.fill.t': 'Fill metal', 'fab.loop.fill.text': 'Coat the trenches with a thin barrier and fill them with copper. Newer nodes are testing ruthenium for the narrowest wires.', 'fab.loop.fill.gear': 'Deposition and electroplating (Applied Materials, Lam Research)',
  'fab.loop.polish.t': 'Polish (CMP)', 'fab.loop.polish.text': 'Chemical-mechanical polishing grinds the top perfectly flat, leaving metal only inside the trenches, so the next layer starts on a level surface.', 'fab.loop.polish.gear': 'CMP tools (Applied Materials, Ebara)',
  'fab.loop.inspect.t': 'Inspect', 'fab.loop.inspect.text': 'Optical and electron-beam tools scan for defects and measure dimensions to fractions of a nanometer. Data flows back to tune earlier steps.', 'fab.loop.inspect.gear': 'Inspection and metrology (KLA, Applied Materials, Hitachi High-Tech)',
  'fab.clean.iso1': 'Inside tool mini-environments and sealed wafer pods', 'fab.clean.iso3': 'A very clean fab bay', 'fab.clean.iso5': 'A typical semiconductor cleanroom', 'fab.clean.iso7': 'Roughly a hospital operating room', 'fab.clean.room': 'An ordinary office (extrapolated from ISO 9)',
  'fab.clean.name.iso1': 'ISO 1', 'fab.clean.name.iso3': 'ISO 3', 'fab.clean.name.iso5': 'ISO 5', 'fab.clean.name.iso7': 'ISO 7', 'fab.clean.name.room': 'Room air',
  'fab.depo.status.cvd': 'CVD: fast, uneven', 'fab.depo.status.ald': 'ALD: about 0.1 nm per cycle', 'fab.depo.status.void': 'Void trapped', 'fab.depo.status.filled': 'Filled cleanly',
  'fab.depo.mode.cvd': 'CVD', 'fab.depo.mode.ald': 'ALD',
  'fab.overlay.verdict.fail': 'Chips fail', 'fab.overlay.verdict.marginal': 'Marginal', 'fab.overlay.verdict.ok': 'Within budget',
  'fab.overlay.text.fail': 'Nearly every chip would have broken connections, so yield would be close to zero. Total overlay error must stay within a couple of nanometers.',
  'fab.overlay.text.marginal': 'Several percent of chips would fail from overlay alone. Still too risky.',
  'fab.overlay.text.ok': 'Fewer than 1 chip in 20 affected. This is the level of control a leading fab needs.',
  'fab.inspect.defect.bridge': 'an extra metal bridge between two wires, which shorts two signals together',
  'fab.inspect.defect.open': 'a break in a wire, which cuts a signal',
  'fab.inspect.defect.particle': 'a particle lying across the pattern, which can short or block several features',
  'fab.inspect.text.prompt': 'One of these three dies has a defect. Click where you think it is.',
  'fab.inspect.text.compared': 'Die {die} disagrees with both neighbours: {what}. One defect like this can kill the whole chip.',
  'fab.inspect.text.found': 'Found it in die {die}. Now imagine doing this for 10 billion features on hundreds of dies per wafer, at speed.',
  'fab.inspect.text.miss': 'Not there. Keep looking, or let the comparison find it.',
  'fab.ch.bottom.t': 'The bare bottom',
  'fab.ch.bottom.goal': 'Deepen the trench until CVD leaves its bottom with less than 5% of the film on top, then coat it evenly with ALD. What does an even coat cost in time?',
  'fab.ch.bottom.done': 'At 2:1, CVD leaves only about 4% of the film at the bottom, because the gas reacts near the top before it can reach down. ALD builds the film one atomic layer at a time and coats every surface evenly, but it takes about 20 times longer.',
  'fab.ch.vias.t': 'Ten billion vias',
  'fab.ch.vias.goal': 'With no shift, find the largest random error that leaves at most one failed via per chip. Then see what a 2 nm shift does.',
  'fab.ch.vias.done': 'The random error can be about 0.65 nm before one via in ten billion misses, a fraction of a nanometer. A 2 nm shift alone produces tens of thousands of failures, which is why overlay is measured on every wafer and why fabs use self-aligned vias.'
};

export const FABLINE_CHALLENGES = [
  { id: 'bottom', lab: 'deposition', groups: [r => r.mode === 'cvd' && r.coveragePct !== null && r.coveragePct < 5, r => r.mode === 'ald' && r.coveragePct !== null && r.coveragePct >= 99 && r.ar >= 2] },
  { id: 'vias', lab: 'overlay', groups: [r => r.shift === 0 && r.sigma >= 0.64 && +r.failed.toPrecision(2) <= 1, r => r.shift >= 2] }
];
