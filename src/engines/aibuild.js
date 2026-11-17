/* Build your own AI chip, as an engine: the choices of a chip architect and what each does to speed, power, cost,
   yield and schedule. Pure logic, no DOM, no English (ids only; the words are in WORDS, to be merged into
   src/i18n/en.json by the owner).
   Brought over from the first version of the site (the branch 'before': topics/build/labs/build-your-own-ai-chip.js,
   with its content.html and topic.json) with the same tables, the same formulas and the same numbers. Added here:
   ids instead of sentences (problems, reviewer notes and requirement rows are ids with their numbers, and the words
   are in WORDS), design(choices) as one function that returns everything the lab showed, the tape-out timeline and
   first wafer as functions, PRESETS, solve(mission) (a search over the dials), CHALLENGES and WORDS.

   The model, as the lab's page put it: compute = dies x compute area x math per mm2 (by architecture and node) x
   clock. Power adds compute energy (scaled by voltage squared), memory traffic energy and the on-chip memory's
   leakage. Cost uses a wafer-yield model (dies per wafer, yield = exp(-area x defect density)) plus memory and
   packaging. Speed of a language model, one token per user per step: the step takes as long as the slower of reading
   the weights (bytes over bandwidth) and the math (2 x parameters x users over useful peak speed).
   The voltage needed for a clock comes from a fitted curve (fmax), and no clock is allowed that needs more than 1.05 V.

   Illustrative, not a quote (the first version's own note): wafer, memory and packaging prices are rough public
   estimates; the figures are a teaching model. Only a few are backed by src/data/facts.json (listed as `facts` on
   the rows that have one); the wafer prices of N3, N2 and A16, HBM and LPDDR/GDDR prices per device, package prices
   and schedule months have no source there. The first version's "compare with real chips" table is not here: it read
   the first version's chip list (src/data/chips.js), and src/engines/aichip.js holds the chips now. */

/* What each mission asks. P: billions of parameters (0: no language model, the mission is about the chip itself),
   B: users served at once, fp4ok: may run in FP4, dead: the schedule (months) beyond which a reviewer says so.
   reqs: key, op ('>=', '<=' or 'fit': the model's weights, plus 15%, fit in memory), value, unit.
   goal: the score (key, higher is better?, the values for two and three stars). */
export const MISSIONS = {
  phone: { P: 8, B: 1, fp4ok: true, dead: 24, reqs: [
    { key: 'tps', op: '>=', value: 20, unit: 'tps' }, { key: 'power', op: '<=', value: 6, unit: 'w' },
    { key: 'cost', op: '<=', value: 60, unit: 'usd' }, { key: 'fit', op: 'fit' }, { key: 'months', op: '<=', value: 24, unit: 'months' }],
    goal: { key: 'tpj', higher: true, stars: [6, 9] } },
  infer: { P: 70, B: 64, fp4ok: true, dead: 30, reqs: [
    { key: 'tps', op: '>=', value: 20000, unit: 'tps' }, { key: 'power', op: '<=', value: 1200, unit: 'w' },
    { key: 'cost', op: '<=', value: 15000, unit: 'usd' }, { key: 'fit', op: 'fit' }, { key: 'months', op: '<=', value: 30, unit: 'months' }],
    goal: { key: 'cpm', higher: false, stars: [0.012, 0.007] } },
  train: { P: 0, B: 0, fp4ok: false, dead: 34, reqs: [
    { key: 'pf8', op: '>=', value: 15, unit: 'pf' }, { key: 'cap', op: '>=', value: 192, unit: 'gb' },
    { key: 'bw', op: '>=', value: 12, unit: 'tbs' }, { key: 'power', op: '<=', value: 1800, unit: 'w' },
    { key: 'months', op: '<=', value: 34, unit: 'months' }],
    goal: { key: 'pfkw', higher: true, stars: [18, 24] } }
};

/* Architecture: dens: PFLOPS (FP8) per 1000 mm2 per GHz at the N3 density (the lab's units: dies x area x dens x node
   density x GHz / 1000), e: picojoules per operation at N3, util: the share of peak a real workload uses,
   design: months of design work. */
export const ARCH = {
  gpu: { dens: 5.5, e: 0.06, util: 0.6, design: 26 },
  sys: { dens: 7.5, e: 0.045, util: 0.7, design: 22 },
  cpu: { dens: 0.6, e: 0.5, util: 0.5, design: 24 }
};
/* Process node: dens and e: against N3; wafer: dollars (estimate); d0: defects per cm2 (area / 100 x d0 in the yield);
   sram: mm2 per MB; fab: months in the fab; cplx: design effort against N3; risk: extra months for a node that is new.
   facts: ids in src/data/facts.json behind the node's words. N5's wafer price matches the 5 nm figure of 'wafer-price'
   (2020); the others are the first version's estimates. */
export const NODE = {
  n5: { dens: 0.62, e: 1.3, wafer: 17000, d0: 0.06, sram: 0.30, fab: 3.0, cplx: 0.85, risk: 0, facts: ['wafer-price'] },
  n3: { dens: 1.0, e: 1.0, wafer: 20000, d0: 0.08, sram: 0.27, fab: 3.5, cplx: 1, risk: 0, facts: [] },
  n2: { dens: 1.15, e: 0.78, wafer: 30000, d0: 0.12, sram: 0.24, fab: 4, cplx: 1.1, risk: 0, facts: ['tsmc-n2', 'node-n2'] },
  a16: { dens: 1.25, e: 0.66, wafer: 33000, d0: 0.2, sram: 0.24, fab: 4.5, cplx: 1.2, risk: 2, facts: ['tsmc-a16'] }
};
/* Memory: bw: TB/s per device, cap: GB per device, cost: dollars per device, pj: picojoules per bit moved,
   max: most devices, cow: needs a silicon interposer (CoWoS). */
export const MEM = {
  lp: { bw: 0.068, cap: 8, cost: 14, pj: 4, max: 4, cow: false, facts: [] },
  gd: { bw: 0.128, cap: 3, cost: 12, pj: 4.5, max: 16, cow: false, facts: [] },
  h3: { bw: 1.2, cap: 36, cost: 450, pj: 3.5, max: 12, cow: true, facts: ['gpu-cost'] },
  h4: { bw: 2.75, cap: 36, cost: 650, pj: 2.5, max: 12, cow: true, facts: ['hbm4'] }
};
/* Packaging: cost: dollars, maxD: most compute dies, maxS: most HBM stacks, maxSi: mm2 of silicon it can carry,
   y: package yield, mo: months. */
export const PKG = {
  org: { cost: 8, maxD: 1, maxS: 0, maxSi: 900, y: 0.995, mo: 0.5, facts: [] },
  fc: { cost: 60, maxD: 2, maxS: 0, maxSi: 2000, y: 0.99, mo: 0.7, facts: [] },
  cs: { cost: 900, maxD: 2, maxS: 6, maxSi: 2700, y: 0.97, mo: 1.5, facts: ['cowos-capacity'] },
  cl: { cost: 2200, maxD: 4, maxS: 12, maxSi: 6000, y: 0.96, mo: 2, facts: ['cowos-capacity'] }
};
/* The choices that are not a pick from a table, and their limits (the lab's sliders). */
export const DIES = [1, 2, 4];
export const LIMITS = { area: [5, 800], sram: [0, 511], memN: [0, 12], f: [0.6, 2.6], reticle: 858, maxVolt: 1.05 };
export const FILL_EXTRA = 1.15;                  // weights plus 15% must fit in memory

/* The starting points, one per mission. A choice is { mission, arch, node, area (mm2 of compute per die), dies,
   sram (MB per die), fp4, mem, memN (devices), pkg, f (GHz), agents (AI design agents) }. None meets its mission,
   as in the first version: each misses at least one requirement (the lab's lesson is where). */
export const PRESETS = {
  phone: { mission: 'phone', arch: 'sys', node: 'n3', area: 12, dies: 1, sram: 16, fp4: false, mem: 'lp', memN: 2, pkg: 'org', f: 1.2, agents: true },
  infer: { mission: 'infer', arch: 'gpu', node: 'n3', area: 600, dies: 1, sram: 64, fp4: false, mem: 'h3', memN: 6, pkg: 'cs', f: 2.0, agents: false },
  train: { mission: 'train', arch: 'gpu', node: 'n3', area: 600, dies: 2, sram: 64, fp4: false, mem: 'h3', memN: 8, pkg: 'cl', f: 1.8, agents: true }
};
export const preset = id => ({ ...PRESETS[id] });

/* Voltage and clock: the highest clock a voltage allows, and the lowest voltage (not under 0.5 V) for a clock. */
const Kf = 2.0 * 0.75 / Math.pow(0.45, 1.3);
export const fmax = V => V <= 0.3 ? 0 : Kf * Math.pow(V - 0.3, 1.3) / V;
export function vmin(f) { let lo = 0.31, hi = 1.4; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fmax(m) >= f) hi = m; else lo = m; } return Math.max(0.5, hi); }
/* The sliders: 0..1000 to mm2 of compute (5 to 800) and to MB of SRAM (0 to 511), and back. */
export const areaOfSlider = v => Math.round(5 * Math.pow(160, v / 1000)), sliderOfArea = a => Math.round(1000 * Math.log(a / 5) / Math.log(160));
export const sramOfSlider = v => Math.max(0, Math.round(Math.pow(2, v / 1000 * 9)) - 1), sliderOfSram = s => Math.round(1000 * Math.log2(s + 1) / 9);
/* Fit a choice to the table's limits (the lab did this when the memory type changed): never more devices than the type allows. */
export const tidy = c => ({ ...c, memN: Math.min(c.memN, MEM[c.mem].max) });

/* Everything the lab showed for one choice. Returns:
   V, vok (voltage for the clock, and whether it is allowed), dieA (mm2 per die), pf8, pf4 (PFLOPS; pf4 only if fp4),
   prec ('fp8' or 'fp4': what the model runs in), pfU (PFLOPS in that format), bw (TB/s), cap (GB, memory plus SRAM),
   power (W), Y (yield 0..1), dpw (dies per wafer), good (good dies per wafer), dieCost, cost (dollars per chip with
   its memory and package), problems (can this be built at all: [{ id, ...numbers }], empty when it can),
   tps (tokens per second for all users; 0 if it does not fit), memT, compT (seconds per step each way), fit, W (GB
   of weights), design (months of design), months (to launch), cpm (dollars per million tokens, Infinity if none),
   tpj (tokens per joule), pfkw (PFLOPS per kilowatt), and the verdict:
   rows [{ key, op, ok, value, limit, need }], all (every requirement met and buildable), buildable, stars (0..3),
   goal { key, value, higher, stars: [two, three] }. */
export function design(c) {
  const m = MISSIONS[c.mission], a = ARCH[c.arch], n = NODE[c.node], me = MEM[c.mem], pk = PKG[c.pkg];
  if (!m || !a || !n || !me || !pk) throw new Error('unknown mission or table id');
  const V = vmin(c.f), vok = V <= LIMITS.maxVolt, fp4a = c.fp4 ? 1.04 : 1;
  const phy = me.cow ? (c.memN / c.dies) * 8 : (c.memN > 0 ? 6 : 0), d2d = c.dies > 1 ? 12 : 0;
  const dieA = (c.area * fp4a + c.sram * n.sram) * 1.12 + phy + d2d;
  const pf8 = c.dies * c.area * a.dens * n.dens * c.f / 1000, pf4 = c.fp4 ? pf8 * 2 : 0;
  const prec = m.fp4ok && c.fp4 ? 'fp4' : 'fp8', pfU = prec === 'fp4' ? pf4 : pf8;
  const bw = c.memN * me.bw, cap = c.memN * me.cap + c.sram * c.dies / 1000;
  const pComp = pf8 * 1e15 * a.util * a.e * 1e-12 * n.e * (V / 0.75) ** 2, pMem = bw * 8 * me.pj * 0.6, pSram = c.sram * c.dies * 0.02;
  const power = (pComp + pSram) * 1.1 + pMem;
  const A = dieA, dpw = Math.max(0, Math.floor(Math.PI * 22500 / A - Math.PI * 300 / Math.sqrt(2 * A))), Y = Math.exp(-A / 100 * n.d0), good = dpw * Y;
  const dieCost = good > 0 ? n.wafer / good : Infinity;
  const cost = (c.dies * dieCost + c.memN * me.cost + pk.cost) / pk.y * 1.03;
  const si = c.dies * A + (me.cow ? c.memN * 110 : 0);
  const problems = [];
  if (A > LIMITS.reticle) problems.push({ id: 'reticle', area: Math.round(A), max: LIMITS.reticle });
  if (me.cow && pk.maxS === 0) problems.push({ id: 'needs-interposer' });
  if (me.cow && c.memN > pk.maxS && pk.maxS > 0) problems.push({ id: 'stacks', pkg: c.pkg, max: pk.maxS });
  if (c.dies > pk.maxD) problems.push({ id: 'dies', pkg: c.pkg, max: pk.maxD });
  if (si > pk.maxSi) problems.push({ id: 'silicon', pkg: c.pkg, need: Math.round(si), max: pk.maxSi });
  if (!vok) problems.push({ id: 'clock', f: c.f });
  if (c.memN < 1) problems.push({ id: 'no-memory' });
  let tps = 0, memT = 0, compT = 0;
  const b = prec === 'fp4' ? 0.5 : 1, W = m.P * b, fit = m.P ? cap >= W * FILL_EXTRA : true;
  if (m.P && bw > 0 && pfU > 0) { memT = W * 1e9 / (bw * 1e12); compT = 2 * m.P * 1e9 * m.B / (pfU * 1e15 * a.util); tps = fit ? m.B / Math.max(memT, compT) : 0; }
  const area = c.area * c.dies;
  const dsg = a.design * n.cplx * (c.dies > 1 ? 1.08 : 1) * (c.agents ? 0.75 : 1) * (0.85 + 0.15 * Math.min(1, area / 1500));
  const months = dsg + 1 + n.fab + pk.mo + 4 + n.risk;
  const life = 3 * 365 * 24 * 3600 * 0.6;            // three years at 60% busy: the chip's working life in seconds
  const cpm = tps > 0 ? ((cost * 2.5) / life + power * 1.3 / 1000 * 0.10 / 3600) / tps * 1e6 : Infinity;
  const R = { V, vok, dieA: A, pf8, pf4, prec, pfU, bw, cap, power, Y, dpw, good, dieCost, cost, problems, tps, memT, compT, fit, W, design: dsg, months, cpm, tpj: power > 0 ? tps / power : 0, pfkw: power > 0 ? pf8 / (power / 1000) : 0 };
  const rows = m.reqs.map(r => {
    if (r.op === 'fit') return { key: 'fit', op: 'fit', ok: R.fit, value: R.cap, need: Math.ceil(R.W * FILL_EXTRA) };
    const v = R[r.key], ok = r.op === '>=' ? v >= r.value : v <= r.value;
    return { key: r.key, op: r.op, ok, value: v, limit: r.value };
  });
  const buildable = !problems.length, all = rows.every(r => r.ok) && buildable;
  const g = m.goal, gv = R[g.key]; let stars = 0;
  if (all) { stars = 1; if (g.higher ? gv >= g.stars[0] : gv <= g.stars[0]) stars++; if (g.higher ? gv >= g.stars[1] : gv <= g.stars[1]) stars++; }
  return { ...R, rows, all, buildable, stars, goal: { key: g.key, value: gv, higher: g.higher, stars: g.stars } };
}

/* The tape-out: where the months go (id, months, who it limits: ai, invent, capital or people), in order. */
export function timeline(c, R = design(c)) {
  const n = NODE[c.node], pk = PKG[c.pkg];
  return [
    { id: 'design', months: R.design, limit: 'ai' }, { id: 'masks', months: 1, limit: 'ai' },
    { id: 'fab', months: n.fab + n.risk, limit: 'invent' }, { id: 'packaging', months: pk.mo, limit: 'capital' },
    { id: 'bringup', months: 4, limit: 'people' }
  ];
}
/* The first wafer: the same dies the lab drew (a 300 mm wafer, a gap of 0.1 mm between dies, none within 3 mm of the
   edge), each good with the chance Y, from a seed. Returns [{ i, j, ok }] and the counts. */
export function firstWafer(R, seed = 1) {
  let s = seed;
  const rand = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const side = Math.sqrt(R.dieA), nx = Math.ceil(150 / (side + 0.1)) + 1, dies = [];
  for (let i = -nx; i <= nx; i++) for (let j = -nx; j <= nx; j++) {
    const x = i * (side + 0.1) - side / 2, y = j * (side + 0.1) - side / 2;
    if (![[x, y], [x + side, y], [x, y + side], [x + side, y + side]].every(([p, q]) => p * p + q * q <= 147 * 147)) continue;
    dies.push({ i, j, ok: rand() < R.Y });
  }
  return { dies, total: dies.length, good: dies.filter(d => d.ok).length };
}
/* The reviewer's notes after a tape-out, as ids with numbers (words: WORDS 'aibuild.note.<id>'). */
export function notes(c, R = design(c)) {
  const m = MISSIONS[c.mission], out = [];
  if (m.P) { if (R.memT > 1.5 * R.compT) out.push({ id: 'memory-bound' }); else if (R.compT > 1.5 * R.memT) out.push({ id: 'compute-bound' }); else out.push({ id: 'balanced' }); }
  if (R.Y < 0.45) out.push({ id: 'low-yield', percent: Math.round(R.Y * 100) });
  const pc = m.reqs.find(r => r.key === 'power');
  if (pc && R.power > 0.9 * pc.value) out.push({ id: 'power-close' });
  if (c.node === 'a16') out.push({ id: 'newest-node' });
  if (c.arch === 'sys') out.push({ id: 'compiler' });
  if (c.arch === 'cpu') out.push({ id: 'cpu-math' });
  if (!c.agents && R.months > m.dead) out.push({ id: 'agents' });
  if (m.fp4ok && !c.fp4) out.push({ id: 'fp4' });
  if (R.cost > 0 && c.mem.startsWith('h')) out.push({ id: 'hbm-share', percent: Math.round(c.memN * MEM[c.mem].cost / R.cost * 100) });
  return out;
}

/* A search over the dials for the best-scoring choice that meets a mission (null if none does): every pick from
   every table, a few values of area, SRAM, devices and clock. Slow enough to run once, not on every move. */
export function solve(mission, { dials } = {}) {
  const D = dials || { area: [12, 20, 40, 100, 200, 400, 600, 700], sram: [0, 16, 64, 128], memN: [1, 2, 4, 6, 8, 12], f: [0.8, 1.2, 1.6, 2.0, 2.4], dies: DIES };
  const better = (x, y) => !y || x.stars > y.stars || (x.stars === y.stars && (MISSIONS[mission].goal.higher ? x.goal.value > y.goal.value : x.goal.value < y.goal.value));
  let top = null, topC = null;
  for (const arch of Object.keys(ARCH)) for (const node of Object.keys(NODE)) for (const mem of Object.keys(MEM)) for (const pkg of Object.keys(PKG))
    for (const dies of D.dies) for (const area of D.area) for (const sram of D.sram) for (const memN of D.memN) {
      if (memN > MEM[mem].max) continue;
      for (const f of D.f) for (const fp4 of MISSIONS[mission].fp4ok ? [false, true] : [false]) {
        const c = { mission, arch, node, area, dies, sram, fp4, mem, memN, pkg, f, agents: true };
        const d = design(c);
        if (d.all && better(d, top)) { top = d; topC = c; }
      }
    }
  return topC;
}

/* The challenges (the first version's topic.json: Phone AI chip, Inference accelerator, Training flagship), as checks
   over a choice: the mission is met. stars(c) says how well. */
export const CHALLENGES = {
  phone: { id: 'phone', mission: 'phone', check: c => design({ ...c, mission: 'phone' }).all },
  infer: { id: 'infer', mission: 'infer', check: c => design({ ...c, mission: 'infer' }).all },
  train: { id: 'train', mission: 'train', check: c => design({ ...c, mission: 'train' }).all }
};

/* Words for the owner to merge into en.json (the engine itself holds none). Placeholders in {braces} are the numbers
   of the id's object (problems, notes) or of the thing named. */
export const WORDS = {
  'aibuild.mission.phone': 'Phone AI chip', 'aibuild.mission.phone.story': 'Run an 8-billion-parameter assistant on a phone: quick replies, cool to the touch, cheap enough for a mass-market handset.',
  'aibuild.mission.infer': 'Inference accelerator', 'aibuild.mission.infer.story': 'Serve a 70-billion-parameter model to 64 users at once in a data center, at the lowest cost per token.',
  'aibuild.mission.train': 'Training flagship', 'aibuild.mission.train.story': 'Build the chip frontier labs will train their next models on: maximum FP8 compute, huge memory, high bandwidth.',
  'aibuild.req.tps': 'Throughput', 'aibuild.req.tps.phone': 'Reply speed (one user)', 'aibuild.req.tps.infer': 'Throughput, 64 users',
  'aibuild.req.power': 'Power', 'aibuild.req.cost': 'Build cost', 'aibuild.req.cost.phone': 'Build cost, chip + memory',
  'aibuild.req.fit': 'Model fits in memory', 'aibuild.req.months': 'Ready in',
  'aibuild.req.pf8': 'FP8 compute', 'aibuild.req.cap': 'Memory', 'aibuild.req.bw': 'Bandwidth',
  'aibuild.goal.tpj': 'Tokens per joule', 'aibuild.goal.cpm': 'Cost per million tokens', 'aibuild.goal.pfkw': 'PFLOPS per kilowatt',
  'aibuild.unit.tps': 'tok/s', 'aibuild.unit.w': 'W', 'aibuild.unit.usd': '$', 'aibuild.unit.months': 'months', 'aibuild.unit.pf': 'PFLOPS', 'aibuild.unit.gb': 'GB', 'aibuild.unit.tbs': 'TB/s',
  'aibuild.arch.gpu': 'GPU-style', 'aibuild.arch.gpu.d': 'Programmable cores plus tensor units. Runs anything; biggest software ecosystem.',
  'aibuild.arch.sys': 'Matrix engine', 'aibuild.arch.sys.d': 'Big systolic arrays, TPU-style. More math per mm² and per watt, less flexible.',
  'aibuild.arch.cpu': 'Many CPU cores', 'aibuild.arch.cpu.d': 'General-purpose cores with vector units. Flexible, but far less math per mm².',
  'aibuild.node.n5': 'N5', 'aibuild.node.n5.d': 'Mature since 2020: cheap wafers, high yield.',
  'aibuild.node.n3': 'N3', 'aibuild.node.n3.d': 'Workhorse of 2024–26 AI chips.',
  'aibuild.node.n2': 'N2', 'aibuild.node.n2.d': 'Gate-all-around, volume since Q4 2025. Less power, pricier wafers.',
  'aibuild.node.a16': 'A16', 'aibuild.node.a16.d': 'Backside power, ramping 2H 2026. Best efficiency, newest and riskiest.',
  'aibuild.mem.lp': 'LPDDR5X', 'aibuild.mem.lp.d': 'Phone and laptop memory: cheap, low power, modest bandwidth.',
  'aibuild.mem.gd': 'GDDR7', 'aibuild.mem.gd.d': 'Graphics memory chips on the board around the package.',
  'aibuild.mem.h3': 'HBM3E', 'aibuild.mem.h3.d': 'Stacked memory beside the die. Needs CoWoS.',
  'aibuild.mem.h4': 'HBM4', 'aibuild.mem.h4.d': '2,048-bit stacks, new in 2026. Needs CoWoS.',
  'aibuild.pkg.org': 'Standard', 'aibuild.pkg.org.d': 'Cheap phone-style package, one die.',
  'aibuild.pkg.fc': 'Large organic', 'aibuild.pkg.fc.d': 'Big FCBGA package for up to two dies, no HBM.',
  'aibuild.pkg.cs': 'CoWoS-S', 'aibuild.pkg.cs.d': 'Silicon interposer: up to 2 dies and 6 HBM stacks.',
  'aibuild.pkg.cl': 'CoWoS-L', 'aibuild.pkg.cl.d': 'Bridged interposer beyond reticle size: up to 4 dies and 12 stacks.',
  'aibuild.dial.dies': 'Number of compute dies (chiplets)', 'aibuild.dial.area': 'Compute area per die', 'aibuild.dial.sram': 'On-chip SRAM per die',
  'aibuild.dial.memN': 'How many memory devices', 'aibuild.dial.f': 'Clock frequency',
  'aibuild.dial.fp4': 'Support FP4 math (+4% compute area, 2× throughput in FP4)',
  'aibuild.dial.agents': 'Use 2026 AI design agents for RTL, verification and layout (about 25% faster design)',
  'aibuild.phase.design': 'Design & verification', 'aibuild.phase.masks': 'Masks', 'aibuild.phase.fab': 'Wafer fab', 'aibuild.phase.packaging': 'Packaging', 'aibuild.phase.bringup': 'Bring-up',
  'aibuild.problem.reticle': 'Each die is {area} mm², larger than the {max} mm² reticle limit. Shrink compute or SRAM, or split into more dies.',
  'aibuild.problem.needs-interposer': 'HBM must sit on a silicon interposer: choose CoWoS-S or CoWoS-L packaging.',
  'aibuild.problem.stacks': 'This package fits at most {max} HBM stacks.',
  'aibuild.problem.dies': 'This package holds at most {max} die(s).',
  'aibuild.problem.silicon': 'Dies plus memory need about {need} mm² of package area; this package allows {max} mm².',
  'aibuild.problem.clock': 'No safe voltage reaches {f} GHz. Lower the clock.',
  'aibuild.problem.no-memory': 'The chip has no external memory. Add at least one memory device.',
  'aibuild.note.memory-bound': 'Memory-bound: the math units wait on memory most of the time. More or faster memory, or FP4 weights, would raise speed more than extra compute.',
  'aibuild.note.compute-bound': 'Compute-bound: memory keeps up easily. More compute area or a higher clock would help.',
  'aibuild.note.balanced': 'Well balanced: compute and memory finish each step at about the same time.',
  'aibuild.note.low-yield': 'Only {percent}% of dies work. Chiplets or a more mature node would cut the cost per chip.',
  'aibuild.note.power-close': 'Power is close to the limit; cooling will be tight.',
  'aibuild.note.newest-node': 'A16 only entered production in late 2026: the newest node costs more and adds schedule risk.',
  'aibuild.note.compiler': 'Matrix engines need a strong compiler team. Budget for software, as Google does for TPUs.',
  'aibuild.note.cpu-math': 'CPU cores deliver far less math per mm² than tensor or matrix units, which is why AI chips spend their area on matrix math.',
  'aibuild.note.agents': 'Turning on AI design agents would pull the schedule in by several months.',
  'aibuild.note.fp4': 'Supporting FP4 halves the bytes per weight, which roughly doubles speed on a memory-bound workload.',
  'aibuild.note.hbm-share': 'HBM is {percent}% of the build cost. Memory, not logic, dominates the bill of materials of AI chips.',
  'aibuild.verdict.ready': 'Launch review: ready to ship', 'aibuild.verdict.back': 'Launch review: back to the drawing board',
  'aibuild.verdict.unbuildable': 'Not buildable', 'aibuild.verdict.unmet': 'Requirements not met',
  'aibuild.ch.phone.t': 'Phone AI chip', 'aibuild.ch.phone.goal': 'Run an 8B assistant on a phone: fast, cool and cheap.',
  'aibuild.ch.phone.done': 'An 8B assistant on a phone: quick enough, cool enough, cheap enough, and ready in time.',
  'aibuild.ch.infer.t': 'Inference accelerator', 'aibuild.ch.infer.goal': 'Serve a 70B model to 64 users at the lowest cost per token.',
  'aibuild.ch.infer.done': 'A 70B model served to 64 users within the power and cost limits. Compare the cost per token with another design.',
  'aibuild.ch.train.t': 'Training flagship', 'aibuild.ch.train.goal': 'Maximum FP8 compute, memory and bandwidth.',
  'aibuild.ch.train.done': 'Compute, memory and bandwidth all at flagship level, within the power and schedule limits.'
};
