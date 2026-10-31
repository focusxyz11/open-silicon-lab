/* Pin profiles of the MicroPython bench program (src/hw/firmware/obp_bench.py), so the page can show
   where each wire goes before a board is even connected. The firmware is the source of truth; a test
   checks this copy matches it. ui[k] is the GPIO that drives the chip's input k (ui_in[k]); uo[k] reads
   its output k (uo_out[k]). */
export const PROFILES = {
  pico: { t: 'Raspberry Pi Pico / Pico 2', gpio: 'GP', ui: [0, 1, 2, 3, 4, 5, 6, 7], uo: [8, 9, 10, 11, 12, 13, 14, 15], clk: 16, rst: 17 },
  esp32s3: { t: 'ESP32-S3', gpio: 'GPIO', ui: [4, 5, 6, 7, 15, 16, 17, 18], uo: [8, 9, 10, 11, 12, 13, 14, 21], clk: 1, rst: 2 },
  esp32: { t: 'ESP32 (classic)', gpio: 'GPIO', ui: [4, 13, 14, 18, 19, 21, 22, 23], uo: [25, 26, 27, 32, 33, 34, 35, 36], clk: null, rst: null },
  esp32c3: { t: 'ESP32-C3 (RISC-V)', gpio: 'GPIO', ui: [0, 1, 3, 4], uo: [5, 6, 7, 10], clk: null, rst: null }
};

/* Where each wire of a part goes on a profile: [{ dir, bit, gpio, chipPin, signal }], or null if the
   part needs more pins than the profile has. */
export function wiring(profile, part) {
  const P = PROFILES[profile]; if (!P || part.ins.length > P.ui.length || part.outs.length > P.uo.length) return null;
  return part.ins.map((n, k) => ({ dir: 'in', bit: k, gpio: P.gpio + P.ui[k], chipPin: part.pins[n], signal: n }))
    .concat(part.outs.map((n, k) => ({ dir: 'out', bit: k, gpio: P.gpio + P.uo[k], chipPin: part.pins[n], signal: n })));
}
