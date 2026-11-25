/* Plasma etch, as a Monte Carlo model (gathered by fabsteps.js).
   Ported from the earlier site (the branch 'before': the etch lab of its fab topic), same grid, same rules, with
   the screen taken out and the random numbers seeded, so the same seed gives the same etch. Pure: etchStep(state,
   frames, settings) returns a new state.

   A grid of 100 x 90 cells, each cell 2 nm: 10 rows of empty space on top, 6 rows of mask (with a 20-cell, 40 nm
   opening), the rest the film to etch. Each frame fires 350 particles from the top. An ion flies in a cone around
   straight down (the cone is +-2 degrees at full directionality and +-40 at none), hits the first solid cell and
   removes a film cell with chance 0.6 or a mask cell with chance 0.015. A radical flies in any direction, only etches film
   (chance 0.05 on contact) and otherwise bounces off in a random direction, up to 8 times: it eats sideways. The share of
   radicals is the chemistry setting. The etch stops when the hole reaches the bottom or after 1,200 frames.
   Readings: depth, aspect ratio (depth over the 40 nm opening), undercut (how far the film is eaten sideways under the
   mask in the top 3 rows, in nm), and how much of the mask is left. */
import { rng, gauss, metBy } from './fabkit.js';

export const ETCH_GRID = { w: 100, h: 90, maskTop: 10, filmTop: 16, openFrom: 40, openTo: 60, cellNm: 2 };
export const ETCH_DEFAULTS = { ions: 85, chem: 30 };           // directionality 0 to 100 percent, radicals 0 to 90 percent
export const ETCH_RANGE = { ions: [0, 100], chem: [0, 90] };
export const ETCH = { perFrame: 350, maxFrames: 1200, maxTraces: 40 };
const etchCone = ions => 2 + (100 - ions) / 100 * 38;  // half-angle in degrees

const { w: GW, h: GH, maskTop: MT, filmTop: MB, openFrom: OL, openTo: OR } = ETCH_GRID;
const count = (g, v) => { let n = 0; for (let i = 0; i < g.length; i++) if (g[i] === v) n++; return n; };

export function etchStart(seed = 1) {
  const g = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) g[y * GW + x] = y < MT ? 0 : y < MB ? ((x >= OL && x < OR) ? 0 : 1) : 2;
  return etchRead({ g, mask0: count(g, 1), frames: 0, traces: [], rs: rng(seed).state(), done: false });
}

function shoot(g, rnd, ion, sig) {
  let x = rnd() * GW, y = 0;
  const th = ion ? gauss(rnd) * sig : Math.asin(2 * rnd() - 1);
  let dx = Math.sin(th), dy = Math.cos(th), b = 0;
  const tr = [[x, y]];
  for (let s = 0; s < 700; s++) {
    x += dx * 0.5; y += dy * 0.5;
    if (x < 0 || x >= GW || y >= GH || y < 0) break;
    const i = (y | 0) * GW + (x | 0), v = g[i];
    if (!v) continue;
    if (ion) { if (v === 2 && rnd() < 0.6) g[i] = 0; else if (v === 1 && rnd() < 0.015) g[i] = 0; tr.push([x, y]); break; }
    if (v === 2 && rnd() < 0.05) { g[i] = 0; tr.push([x, y]); break; }
    if (b++ > 8) break;
    x -= dx * 0.5; y -= dy * 0.5; tr.push([x, y]);
    const a = rnd() * Math.PI * 2; dx = Math.cos(a); dy = Math.sin(a);
  }
  tr.push([x, y]);
  return { ion, tr };
}

function depthCells(g) {
  let md = MB - 1;
  for (let x = OL - 25; x < OR + 25; x++) { if (x < 0 || x >= GW) continue; for (let y = GH - 1; y >= MB; y--) if (!g[y * GW + x]) { if (y > md) md = y; break; } }
  return md - MB + 1;
}
function undercutCells(g) {
  let u = 0;
  for (let y = MB; y < MB + 3; y++) {
    let k = 0; for (let x = OL - 1; x >= 0 && !g[y * GW + x]; x--) k++;
    let k2 = 0; for (let x = OR; x < GW && !g[y * GW + x]; x++) k2++;
    u = Math.max(u, k, k2);
  }
  return u;
}

/* the readings of a state: depthNm, aspect, undercutNm, maskPct (rounded, as shown), status ('ready', 'running', 'straight', 'undercut') */
function etchRead(s) {
  const depthNm = depthCells(s.g) * ETCH_GRID.cellNm, undercutNm = undercutCells(s.g) * ETCH_GRID.cellNm, mask = count(s.g, 1) / s.mask0;
  const status = !s.done && s.frames > 0 ? 'running' : undercutNm > 8 ? 'undercut' : depthNm > 0 ? 'straight' : 'ready';
  return { ...s, depthNm, aspect: depthNm / 40, undercutNm, maskLeft: mask, maskPct: Math.round(mask * 100), status };
}

/* Run n frames (default 1) at settings { ions, chem }. Stops by itself when the hole is through or the frames run out. */
export function etchStep(state, frames = 1, settings = {}) {
  const { ions, chem } = { ...ETCH_DEFAULTS, ...settings };
  const g = state.g.slice(), R = rng(state.rs), traces = state.traces.slice();
  const sig = etchCone(ions) * Math.PI / 180, share = chem / 100;
  let f = state.frames, done = state.done;
  for (let n = 0; n < frames && !done; n++) {
    for (let k = 0; k < ETCH.perFrame; k++) {
      const ion = R() >= share, r = shoot(g, R, ion, sig);
      if (r.tr[r.tr.length - 1][1] > MT && R() < 0.12) { traces.push(r); if (traces.length > ETCH.maxTraces) traces.shift(); }
    }
    f++;
    if (depthCells(g) >= GH - MB - 1 || f > ETCH.maxFrames) done = true;
  }
  return etchRead({ g, mask0: state.mask0, frames: f, traces, rs: R.state(), done });
}

/* Etch to the end (or for at most maxFrames frames) and report. */
export function etchRun(settings = {}, seed = 1, maxFrames = ETCH.maxFrames + 1) {
  let s = etchStart(seed);
  while (!s.done && s.frames < maxFrames) s = etchStep(s, 10, settings);
  return s;
}

export const ETCH_CHALLENGES = [
  { id: 'etch', lab: 'etch', groups: [r => r.undercutNm < 5 && r.maskPct >= 70 && r.depthNm > 100] }
];

