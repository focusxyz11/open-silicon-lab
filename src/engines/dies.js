/* Read the die: typical floorplans of five kinds of chip, as a photo of the die shows them, from the first site's
   chip X-ray (src/engines/xray.js on the branch claude/before-dive-2026-11). A die is the unit square (0 to 1 on each
   side); each block has a type, a rectangle and a short name. The floorplans are typical arrangements drawn from
   public die photos in general terms, not any one product, and chips of different kinds are not drawn to the same
   scale. What they teach is real: memory looks like a perfectly regular grid, logic like fine noise, repeated cores
   like copies of one tile, and where the area goes tells you what a chip is for. The dives' own chips, read the same
   way, are in src/engines/xray.js. Words: xray.type.<type>.t and .clue, xr.kind.<kind>, xr.why.<kind>. */

/* the types of block, in the order the key lists them */
export const TYPES = ['core', 'gpu', 'npu', 'logic', 'cache', 'flash', 'dram', 'pixels', 'adc', 'phy', 'analog', 'io'];

/* helpers that lay blocks out in rows and grids */
const B = (type, x, y, w, h, name) => ({ type, x, y, w, h, name });
function grid(type, x, y, w, h, cols, rows, gap, name) {
  const out = [], cw = (w - gap * (cols - 1)) / cols, rh = (h - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(B(type, x + c * (cw + gap), y + r * (rh + gap), cw, rh, name + ' ' + (r * cols + c + 1)));
  return out;
}
/* square pads all round the edge, inside a margin m */
function padRing(n, m = 0.035, size = 0.022) {
  const out = [], step = (1 - 2 * m) / n;
  for (let i = 0; i < n; i++) {
    const p = m + i * step + (step - size) / 2;
    out.push(B('io', p, 0.006, size, size, 'Pad'), B('io', p, 1 - 0.006 - size, size, size, 'Pad'), B('io', 0.006, p, size, size, 'Pad'), B('io', 1 - 0.006 - size, p, size, size, 'Pad'));
  }
  return out;
}

export const KINDS = {
  mcu: () => [
    ...padRing(12),
    B('flash', 0.06, 0.06, 0.4, 0.55, 'Flash memory (program)'),
    B('cache', 0.5, 0.06, 0.24, 0.3, 'SRAM (working memory)'),
    B('core', 0.78, 0.06, 0.16, 0.16, 'CPU core'),
    B('logic', 0.5, 0.4, 0.44, 0.25, 'Peripherals: timers, serial ports, bus'),
    B('analog', 0.06, 0.66, 0.26, 0.28, 'Converters (ADC, DAC)'),
    B('analog', 0.36, 0.66, 0.2, 0.28, 'Clock (PLL) and oscillators'),
    B('analog', 0.6, 0.7, 0.34, 0.24, 'Voltage regulators and power-on reset'),
    B('logic', 0.78, 0.25, 0.16, 0.12, 'Interrupts and debug')
  ],
  phone: () => [
    ...padRing(16, 0.035, 0.018),
    B('core', 0.05, 0.05, 0.13, 0.17, 'Big CPU core 1'), B('core', 0.19, 0.05, 0.13, 0.17, 'Big CPU core 2'),
    ...grid('core', 0.05, 0.23, 0.27, 0.15, 3, 2, 0.01, 'Little CPU core'),
    B('cache', 0.05, 0.39, 0.27, 0.1, 'CPU cache (L2/L3)'),
    ...grid('gpu', 0.35, 0.05, 0.36, 0.5, 4, 5, 0.008, 'GPU core'),
    B('npu', 0.74, 0.05, 0.21, 0.26, 'AI engine (NPU)'),
    B('cache', 0.74, 0.32, 0.21, 0.11, 'NPU memory'),
    B('cache', 0.35, 0.57, 0.36, 0.1, 'System cache'),
    B('logic', 0.05, 0.52, 0.27, 0.2, 'Camera image processor (ISP)'),
    B('logic', 0.74, 0.46, 0.21, 0.26, 'Video and display engines'),
    B('logic', 0.35, 0.68, 0.36, 0.06, 'Interconnect and security'),
    B('phy', 0.05, 0.76, 0.9, 0.07, 'Memory interface (LPDDR)'),
    B('analog', 0.05, 0.85, 0.2, 0.1, 'Clocks (PLL)'),
    B('phy', 0.28, 0.85, 0.4, 0.1, 'USB, display and camera links'),
    B('analog', 0.71, 0.85, 0.24, 0.1, 'Temperature and voltage sensors')
  ],
  gpu: () => [
    B('phy', 0.02, 0.05, 0.06, 0.9, 'Memory interface to HBM'), B('phy', 0.92, 0.05, 0.06, 0.9, 'Memory interface to HBM'),
    B('io', 0.1, 0.01, 0.8, 0.03, 'Chip-to-chip links'), B('io', 0.1, 0.96, 0.8, 0.03, 'PCIe and links'),
    ...grid('gpu', 0.1, 0.06, 0.8, 0.38, 8, 4, 0.008, 'Streaming multiprocessor'),
    B('cache', 0.1, 0.45, 0.8, 0.1, 'Shared L2 cache'),
    ...grid('gpu', 0.1, 0.56, 0.8, 0.38, 8, 4, 0.008, 'Streaming multiprocessor')
  ],
  dram: () => [
    ...grid('dram', 0.03, 0.03, 0.94, 0.4, 4, 2, 0.015, 'Memory bank'),
    B('logic', 0.03, 0.445, 0.94, 0.05, 'Control and address logic'),
    B('io', 0.03, 0.5, 0.94, 0.05, 'Pads (a row down the middle)'),
    ...grid('dram', 0.03, 0.565, 0.94, 0.4, 4, 2, 0.015, 'Memory bank')
  ],
  camera: () => [
    ...padRing(10, 0.04, 0.024),
    B('pixels', 0.1, 0.16, 0.8, 0.56, 'Pixel array'),
    B('adc', 0.1, 0.06, 0.8, 0.08, 'Column converters (ADC)'), B('adc', 0.1, 0.74, 0.8, 0.08, 'Column converters (ADC)'),
    B('logic', 0.1, 0.84, 0.5, 0.1, 'Readout and image logic'),
    B('analog', 0.62, 0.84, 0.28, 0.1, 'Bias, reference and clock'),
    B('analog', 0.04, 0.16, 0.05, 0.56, 'Row drivers'), B('analog', 0.91, 0.16, 0.05, 0.56, 'Row drivers')
  ]
};
export const KIND_IDS = Object.keys(KINDS);
export const plan = kind => KINDS[kind]();

/* the block under a point, or null */
export const hit = (blocks, x, y) => { for (let i = blocks.length - 1; i >= 0; i--) { const b = blocks[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b; } return null; };

/* where the area goes: the share of the die each type takes; whatever no block covers is wiring, spacing and test
   structures (other) */
export function shares(blocks) {
  const s = {}; let used = 0;
  for (const b of blocks) { const a = b.w * b.h; s[b.type] = (s[b.type] || 0) + a; used += a; }
  s.other = Math.max(0, 1 - used);
  return s;
}
/* the types to find on a die, biggest first */
export const askFor = kind => { const s = shares(plan(kind)); return Object.keys(s).filter(t => t !== 'other').sort((a, b) => s[b] - s[a]); };
/* what gives each kind of chip away: its biggest block type */
export const SIGNATURE = { mcu: 'flash', phone: 'gpu', gpu: 'gpu', dram: 'dram', camera: 'pixels' };
/* a die as it might be photographed: turned over left to right or top to bottom */
export const flipped = (blocks, f) => blocks.map(b => Object.assign({}, b, { x: f && f.h ? 1 - b.x - b.w : b.x, y: f && f.v ? 1 - b.y - b.h : b.y }));

/* the challenge: name the kind of chip from its die four times, and find every kind of block on one die */
export const GOAL = { named: 4 };
export const met = v => (v.named || 0) >= GOAL.named && (v.cleared || []).length >= 1;
/* rounds: every kind once before any comes again, each turned at random. rnd() in [0, 1) */
export function deal(rnd) { const k = KIND_IDS.slice(); for (let i = k.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [k[i], k[j]] = [k[j], k[i]]; } return k.map(kind => ({ kind, flip: { h: rnd() < 0.5, v: rnd() < 0.5 } })); }
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
