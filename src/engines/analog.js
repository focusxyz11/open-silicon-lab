/* Chips that touch the real world: a small, pure model of the path from a physical signal to bits,
   and of the chip that powers it. No DOM; tests in tests/analog.test.mjs.

   The signal chain: sensor → amplifier (gain, with input noise) → converter (ADC: samples per second,
   bits, a fixed input range) → radio (every bit sent costs energy). The reader chooses gain, bits and
   rate; the model reports how faithful the captured signal is, whether it clipped or aliased, and how
   much power the chain draws.

   Energy figures are round, illustrative values in the right range for low-power parts, not data
   for any product: ADC energy per conversion step (a "Walden figure of merit"), amplifier power per
   hertz of bandwidth, and radio energy per bit. Each is named below so the lab can show it. */

export const CONST = {
  fom: 20e-15,          // ADC: joules per conversion step (energy per sample = fom · 2^bits)
  ampBase: 0.3e-6,      // amplifier: watts at rest
  ampPerHz: 5e-9,       // amplifier: extra watts per hertz of bandwidth (bandwidth = rate / 2)
  ampGainLog: 0.15,     // amplifier: higher gain costs a little more, per decade of gain
  radioPerBit: 5e-9,    // radio: joules to send one bit
  range: 1.0            // converter input range, volts (−0.5 … +0.5)
};

/* Deterministic noise, so a setting always gives the same result. */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/* The signals from the world, in volts at the sensor. fmax is the highest frequency that matters;
   noise is the amplifier's input noise (rms volts). */
export const SIGNALS = {
  heartbeat: {
    dur: 3, fmax: 40, noise: 4e-6, unit: 'mV', scale: 1e3,
    f: t => { const ph = t % 0.8; const g = (c, w, a) => a * Math.exp(-((ph - c) ** 2) / (2 * w * w)); return 1e-3 * (g(0.12, 0.025, 0.12) - g(0.27, 0.008, 0.15) + g(0.3, 0.012, 1) - g(0.33, 0.01, 0.25) + g(0.55, 0.045, 0.3)); }
  },
  temperature: {
    dur: 600, fmax: 0.02, noise: 2e-6, unit: '°C', scale: 100,   // 10 mV per °C around room temperature
    f: t => 0.01 * (0.6 * Math.sin(2 * Math.PI * t / 600) + 0.25 * Math.sin(2 * Math.PI * t / 170 + 1))
  },
  voice: {
    dur: 0.02, fmax: 3400, noise: 30e-6, unit: 'mV', scale: 1e3,
    f: t => 0.02 * (0.6 * Math.sin(2 * Math.PI * 300 * t) + 0.3 * Math.sin(2 * Math.PI * 900 * t + 1) + 0.15 * Math.sin(2 * Math.PI * 2500 * t + 2))
  },
  vibration: {
    dur: 0.1, fmax: 1300, noise: 20e-6, unit: 'mg', scale: 1e3, fault: 1200,
    f: t => 0.05 * (Math.sin(2 * Math.PI * 50 * t) + 0.35 * Math.sin(2 * Math.PI * 100 * t + 0.5)) + 0.012 * Math.sin(2 * Math.PI * 1200 * t)
  }
};

/* Run the chain. Returns the true signal, the samples, the reconstruction and the scores. */
export function capture(kind, { gain, bits, rate }, opts = {}) {
  const S = SIGNALS[kind], r = rng(opts.seed || 7);
  const half = CONST.range / 2, lsb = CONST.range / 2 ** bits;
  /* At most 20,000 samples: a very fast rate on a slow signal is judged on its first stretch. */
  const n = Math.max(2, Math.min(20000, Math.floor(S.dur * rate) + 1));
  const samples = []; let clipped = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate; if (t > S.dur && i > 1) break;
    let v = (S.f(t) + S.noise * gauss(r)) * gain;
    if (v > half || v < -half) { clipped++; v = Math.max(-half, Math.min(half - lsb, v)); }
    const code = Math.floor((v + half) / lsb);
    samples.push({ t, code, v: (code + 0.5) * lsb - half });
  }
  /* What the reader gets back: straight lines between the samples, divided by the gain. */
  const back = t => { if (samples.length < 2) return samples[0].v / gain; const k = Math.min(samples.length - 2, Math.floor(t * rate)); const a = samples[k], b = samples[k + 1]; const f = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))); return (a.v + (b.v - a.v) * f) / gain; };
  const M = 600; let se = 0, lo = Infinity, hi = -Infinity;
  const lastT = samples[samples.length - 1].t;
  for (let i = 0; i <= M; i++) { const t = lastT * i / M, x = S.f(t); lo = Math.min(lo, x); hi = Math.max(hi, x); se += (back(t) - x) ** 2; }
  const err = Math.sqrt(se / (M + 1)) / (hi - lo);
  const aliased = rate < 2 * S.fmax;
  const sent = rate * bits;                                  // bits per second the radio sends
  const power = { amp: CONST.ampBase + CONST.ampPerHz * rate / 2 * (1 + CONST.ampGainLog * Math.log10(Math.max(1, gain))), adc: rate * CONST.fom * 2 ** bits, radio: sent * CONST.radioPerBit };
  power.total = power.amp + power.adc + power.radio;
  return { kind, gain, bits, rate, samples, back, err, clip: clipped / samples.length, aliased, sent, power };
}

/* Missions: capture well enough, within a power budget. "faultSeen" asks that the 1.2 kHz fault tone
   in the vibration is not folded away (aliased). */
export const MISSIONS = [
  { id: 'heart', signal: 'heartbeat', maxErr: 0.01, maxPower: 20e-6, why: 'a patch that runs a year on a coin cell' },
  { id: 'temp', signal: 'temperature', maxErr: 0.005, maxPower: 1e-6, why: 'a thermostat sensor that runs ten years on two AA cells' },
  { id: 'voice', signal: 'voice', maxErr: 0.01, maxPower: 600e-6, why: 'earbuds that last all day' },
  { id: 'fault', signal: 'vibration', maxErr: 0.02, maxPower: 250e-6, why: 'a motor sensor that hears a bearing start to fail' }
];
export function judge(m, res) {
  const ok = { quality: res.err <= m.maxErr && res.clip === 0, power: res.power.total <= m.maxPower, alias: !res.aliased };
  return { ...ok, pass: ok.quality && ok.power && ok.alias };
}

/* The settings the sliders offer, and a search over them: the cheapest setting that passes. */
export const GAINS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
export const BITS = [4, 6, 8, 10, 12, 14, 16];
export const RATES = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 8000, 12000, 16000, 24000, 48000];
export function best(m) {
  let top = null;
  for (const gain of GAINS) for (const bits of BITS) for (const rate of RATES) {
    const r = capture(m.signal, { gain, bits, rate }); const j = judge(m, r);
    if (j.pass && (!top || r.power.total < top.power.total)) top = r;
  }
  return top;
}

/* ---- Power: from a battery to the chip ---- */
/* Two kinds of regulator. A linear one (LDO) burns the voltage difference as heat but is quiet. A
   switching one (buck) chops the voltage with an inductor: efficient at real loads, but it has a
   fixed overhead and leaves ripple on the output. "Buck + LDO" does both: the buck does the big step,
   a small LDO cleans up. Values are round and illustrative. */
export const REG = {
  ldo: { dropout: 0.15, iq: 1e-6, ripple: 0.05e-3 },
  buck: { fixed: 60e-6, r: 0.08, sw: 0.08, ripple: 15e-3 },
  both: { headroom: 0.2 }
};
export function regulate(type, vin, vout, iload) {
  const pout = vout * iload; let pin, ripple, ok = true;
  if (type === 'ldo') { ok = vin >= vout + REG.ldo.dropout; pin = vin * (iload + REG.ldo.iq); ripple = REG.ldo.ripple; }
  else if (type === 'buck') { pin = pout + REG.buck.fixed + iload * iload * REG.buck.r + REG.buck.sw * pout; ripple = REG.buck.ripple; ok = vin > vout; }
  else {
    const mid = vout + REG.both.headroom;
    const b = regulate('buck', vin, mid, iload + REG.ldo.iq), l = regulate('ldo', mid, vout, iload);
    pin = b.pin; ripple = REG.ldo.ripple; ok = b.ok && l.ok;
  }
  return { type, ok, pin, pout, heat: pin - pout, eff: pout / pin, ripple };
}

/* Jobs for the regulator. "rippleMax" is how much ripple the load tolerates; "life" asks for battery
   hours. Each job's best answer differs, which is the point. */
export const JOBS = [
  { id: 'wearable', vin: 3.7, vout: 1.8, loads: [[20e-6, 0.95], [5e-3, 0.05]], rippleMax: 20e-3, battery: 0.15 * 3.7 * 3600, why: 'a fitness band, asleep 95% of the time' },
  { id: 'cpu', vin: 3.8, vout: 0.8, loads: [[3, 1]], rippleMax: 20e-3, maxHeat: 1.5, why: 'a phone processor running flat out' },
  { id: 'adc', vin: 3.7, vout: 1.8, loads: [[2e-3, 1]], rippleMax: 1e-3, why: 'a precise converter measuring microvolts' },
  { id: 'nearly', vin: 1.95, vout: 1.8, loads: [[50e-3, 1]], rippleMax: 20e-3, why: 'a radio fed from a supply only a little higher than it needs' }
];
/* Average over the job's load pattern: efficiency, heat, ripple, and battery life if it has one. */
export function runJob(job, type) {
  let pin = 0, pout = 0, ok = true, heat = 0, ripple = 0;
  for (const [i, share] of job.loads) { const r = regulate(type, job.vin, job.vout, i); pin += r.pin * share; pout += r.pout * share; ok = ok && r.ok; heat = Math.max(heat, r.heat); ripple = r.ripple; }
  const res = { type, ok, pin, pout, eff: pout / pin, heat, ripple, hours: job.battery ? job.battery / pin / 3600 : null };
  res.pass = ok && ripple <= job.rippleMax && (!job.maxHeat || heat <= job.maxHeat);
  return res;
}
export const TYPES = ['ldo', 'buck', 'both'];
/* Parts each needs: a buck needs an inductor and more capacitors, which cost money and board space. */
export const PARTS = { ldo: 1, buck: 3, both: 4 };
/* The best regulator for a job: it must pass; then the most efficient wins, unless a simpler one is
   within two points of it, because fewer parts is cheaper and smaller. */
export function bestReg(job) {
  const ok = TYPES.map(t => runJob(job, t)).filter(r => r.pass); if (!ok.length) return null;
  const top = Math.max(...ok.map(r => r.eff));
  return ok.filter(r => r.eff >= top - 0.02).sort((a, b) => PARTS[a.type] - PARTS[b.type])[0];
}
