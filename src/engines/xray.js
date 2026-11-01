/* Chip X-ray: typical floorplans of five kinds of chip, as a die photo shows them. No DOM; tests in
   tests/xray.test.mjs.

   A die is the unit square (0…1 on each side). Each block has a type (what it is), a rectangle and
   a short name. The floorplans are typical arrangements drawn from public die photos and floorplans
   in general terms, not any one product, and chips of different kinds are not drawn to the same
   scale. What they teach is real: memory looks like a perfectly regular grid, logic like fine noise,
   repeated cores like copies of one tile, and where the area goes tells you what a chip is for. */

/* What each kind of block is, and the clue that gives it away on a die photo. */
export const BLOCKS = {
  core:   { clue: 'a tile of fine, irregular logic with a small grid of cache memory beside it, often copied several times' },
  cache:  { clue: 'a large, perfectly regular grid: memory cells (SRAM) repeated millions of times' },
  gpu:    { clue: 'many identical small units in rows: graphics or AI cores, copied again and again' },
  npu:    { clue: 'a dense square array of identical multiply units with memory around it' },
  logic:  { clue: 'fine, noise-like texture with no pattern: millions of gates placed by software' },
  analog: { clue: 'a few large, irregular shapes, sometimes round coils: circuits drawn by hand' },
  io:     { clue: 'a row of square pads around the edge, where wires connect the die to the package' },
  phy:    { clue: 'striped strips along an edge: the fast interfaces to memory or other chips' },
  flash:  { clue: 'a coarse regular grid with bigger cells: memory that keeps its contents without power' },
  dram:   { clue: 'huge, extremely dense arrays split by thin strips: almost the whole die is memory' },
  pixels: { clue: 'a vast field of tiny colored squares: one light-sensitive pixel each' },
  adc:    { clue: 'a long, thin strip of identical columns along the pixel array: one converter per column' }
};

/* Helpers that lay blocks out in rows and grids. */
const B = (type, x, y, w, h, name) => ({ type, x, y, w, h, name });
function grid(type, x, y, w, h, cols, rows, gap, name) {
  const out = [], cw = (w - gap * (cols - 1)) / cols, rh = (h - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(B(type, x + c * (cw + gap), y + r * (rh + gap), cw, rh, name + ' ' + (r * cols + c + 1)));
  return out;
}
/* Square pads all round the edge, inside a margin m. */
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

/* The block under a point, or null. */
export const hit = (blocks, x, y) => { for (let i = blocks.length - 1; i >= 0; i--) { const b = blocks[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b; } return null; };

/* Where the area goes: the share of the die each type takes. Whatever no block covers is wiring,
   spacing and test structures. */
export function shares(blocks) {
  const s = {}; let used = 0;
  for (const b of blocks) { const a = b.w * b.h; s[b.type] = (s[b.type] || 0) + a; used += a; }
  s.other = Math.max(0, 1 - used);
  return s;
}

/* The questions for "Name the blocks", one per type a chip has, biggest first. */
export const askFor = kind => { const s = shares(plan(kind)); return Object.keys(s).filter(t => t !== 'other').sort((a, b) => s[b] - s[a]); };

/* The clue that tells each kind of chip apart: its biggest block type. */
export const SIGNATURE = { mcu: 'flash', phone: 'gpu', gpu: 'gpu', dram: 'dram', camera: 'pixels' };
