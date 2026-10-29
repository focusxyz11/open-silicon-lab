/* The time machine: what the chip world looked like in any year from 1971 to 2040.
   Years up to 2026 are history; later years are company plans, imec's roadmap or a plain trend
   line, and every value says which. Pure data and helpers, no DOM, so it is unit-tested.

   Sources:
   - Microprocessor transistor counts 1971–2021: Karl Rupp, "Microprocessor Trend Data" (CC BY 4.0),
     https://github.com/karlrupp/microprocessor-trend-data
   - Named chips and their transistor counts: Wikipedia, "Transistor count"; Rubin from src/data/facts.json.
   - Process nodes by year: Wikipedia, "Semiconductor device fabrication"; after 2026 TSMC plans and imec's roadmap.
   - Design cost by node: IBS, via SemiEngineering (28 and 16 nm) and Silicon Analysts (7, 5, 3 nm); 2 nm from CSIS.
   - Company founding years: each company's published history. */

export const NOW = 2026, MIN = 1971, MAX = 2040;

/* [year, transistors] for microprocessors (Karl Rupp, CC BY 4.0). */
export const RUPP = [[1971.88,2308],[1972.31,3555],[1974.33,6098],[1979.57,2.916e+04],[1982.31,1.358e+05],[1985.91,2.738e+05],[1986.25,1.094e+05],[1988.65,1.219e+05],[1989.47,1.208e+06],[1990.58,1.208e+06],[1992.40,1.208e+06],[1992.69,3.106e+06],[1992.69,1.114e+06],[1993.03,1.715e+06],[1993.41,3.106e+06],[1993.41,9.222e+05],[1994.71,1.911e+06],[1994.71,2.788e+06],[1995.43,9.647e+06],[1995.72,3.106e+06],[1996.15,5.474e+06],[1996.35,6.793e+06],[1996.35,3.652e+06],[1996.44,4.294e+06],[1996.83,9.647e+06],[1997.36,5.474e+06],[1997.45,3.555e+06],[1997.55,8.896e+06],[1997.64,7.567e+06],[1998.89,1.526e+07],[1999.13,9.39e+06],[1999.18,6.978e+06],[1999.47,9.39e+06],[1999.47,2.167e+07],[2000.19,2.227e+07],[2000.67,2.839e+07],[2000.67,3.718e+07],[2001.11,2.916e+07],[2001.20,4.255e+07],[2001.68,2.548e+07],[2001.83,3.718e+07],[2002.40,5.573e+07],[2002.79,3.82e+07],[2002.88,2.207e+08],[2003.41,1.512e+08],[2003.51,5.425e+07],[2003.65,1.065e+08],[2004.81,1.252e+08],[2004.81,1.065e+08],[2004.81,2.738e+08],[2005.72,2.329e+08],[2005.82,1.124e+08],[2005.96,3.051e+08],[2006.06,1.155e+08],[2006.88,3.786e+08],[2006.88,1.554e+08],[2006.92,2.458e+08],[2006.97,2.969e+08],[2006.97,5.829e+08],[2007.07,1.512e+08],[2007.64,5.829e+08],[2007.74,2.329e+08],[2007.79,8.058e+08],[2007.84,1.155e+08],[2007.98,5.094e+08],[2008.22,4.451e+08],[2008.46,4.105e+08],[2009.18,4.573e+08],[2009.28,7.844e+08],[2009.66,2.308e+09],[2009.71,1.911e+09],[2010.19,4.105e+08],[2010.38,1.31e+09],[2011.16,1.17e+09],[2011.32,2.6e+09],[2011.90,1.2e+09],[2012.40,2.4e+09],[2012.41,2.3e+09],[2012.70,2.1e+09],[2012.90,1.2e+09],[2013.40,5e+09],[2013.80,4.3e+09],[2014.16,4.3e+09],[2014.50,4.2e+09],[2014.80,2.6e+09],[2014.81,3.8e+09],[2014.82,5.7e+09],[2016.33,7.2e+09],[2016.67,8e+09],[2017.50,1.92e+10],[2018.40,8e+09],[2018.50,2.11e+10],[2019.30,8e+09],[2019.80,3.95e+10],[2020.10,3.04e+10],[2020.90,1.6e+10],[2021.80,5.7e+10],[2021.90,5.82e+10],[2021.90,5.5e+10]];

/* Landmark chips: [year, name, maker, kind, transistors, process, one line on why it matters]. */
export const CHIPS = [
  [1971, 'Intel 4004', 'Intel', 'cpu', 2300, '10 µm', 'The first commercial microprocessor, made for a Japanese desk calculator.'],
  [1978, 'Intel 8086', 'Intel', 'cpu', 29000, '3 µm', 'The first x86 chip: PCs still run its instruction set.'],
  [1979, 'Motorola 68000', 'Motorola', 'cpu', 68000, '3.5 µm', 'Powered the first Macintosh and many arcade machines.'],
  [1982, 'Intel 80286', 'Intel', 'cpu', 134000, '1.5 µm', 'The heart of the IBM PC/AT.'],
  [1985, 'Intel 80386', 'Intel', 'cpu', 275000, '1.5 µm', 'The first 32-bit x86, made in CMOS.'],
  [1985, 'ARM1', 'Acorn', 'cpu', 25000, '3 µm', 'The first Arm processor: tiny, simple and frugal, the RISC idea in silicon.'],
  [1989, 'Intel 80486', 'Intel', 'cpu', 1180000, '1 µm', 'The first chip with over a million transistors.'],
  [1993, 'Intel Pentium', 'Intel', 'cpu', 3100000, '800 nm', 'Two instructions per clock: the start of superscalar PCs.'],
  [1997, 'Intel Pentium II', 'Intel', 'cpu', 7500000, '350 nm', 'Cache memory moves into the processor package.'],
  [1999, 'NVIDIA GeForce 256', 'NVIDIA', 'gpu', 17000000, '220 nm', 'Marketed as the first GPU: 3D graphics math moves off the CPU.'],
  [2000, 'Intel Pentium 4', 'Intel', 'cpu', 42000000, '180 nm', 'The race for gigahertz, soon stopped by heat.'],
  [2003, 'AMD Athlon 64', 'AMD', 'cpu', 105900000, '130 nm', 'Brings 64-bit computing to PCs.'],
  [2006, 'Intel Core 2 Duo', 'Intel', 'cpu', 291000000, '65 nm', 'Two cores instead of more gigahertz: the power wall changes design.'],
  [2008, 'Intel Core i7 (Nehalem)', 'Intel', 'cpu', 731000000, '45 nm', 'Four cores with the memory controller on the chip.'],
  [2010, 'NVIDIA GF100 (Fermi)', 'NVIDIA', 'gpu', 3000000000, '40 nm', 'A GPU designed for general computing as well as games.'],
  [2012, 'Intel Ivy Bridge', 'Intel', 'cpu', 1400000000, '22 nm', 'The first chip in volume with FinFET transistors.'],
  [2016, 'NVIDIA GP100 (Pascal)', 'NVIDIA', 'gpu', 15300000000, '16 nm', 'HBM memory beside the GPU: the AI data-center chip takes shape.'],
  [2017, 'NVIDIA GV100 (Volta)', 'NVIDIA', 'gpu', 21100000000, '12 nm', 'Adds tensor cores, units built just for AI matrix math.'],
  [2018, 'Apple A12', 'Apple', 'soc', 6900000000, '7 nm', 'One of the first 7 nm chips, in a phone.'],
  [2020, 'Apple M1', 'Apple', 'soc', 16000000000, '5 nm', 'A phone-style system on a chip takes over the laptop.'],
  [2020, 'NVIDIA A100', 'NVIDIA', 'gpu', 54200000000, '7 nm', 'The workhorse of the early large-language-model boom.'],
  [2022, 'NVIDIA H100', 'NVIDIA', 'gpu', 80000000000, '4 nm', 'The chip behind the generative AI boom.'],
  [2023, 'Apple A17 Pro', 'Apple', 'soc', 19000000000, '3 nm', 'The first 3 nm chip in a phone.'],
  [2024, 'NVIDIA B200 (Blackwell)', 'NVIDIA', 'gpu', 208000000000, '4 nm', 'Two reticle-size dies joined in one package.'],
  [2026, 'NVIDIA Rubin', 'NVIDIA', 'gpu', 336000000000, '3 nm', 'Two compute dies with 288 GB of HBM4, shipping in late 2026.']
];
/* After 2026 the flagship follows the 2016–2026 trend of the biggest AI chips: twice the transistors about every 2.25 years. A trend line, not a forecast. */
export const TREND_DOUBLING = 2.25;
export const trendTransistors = y => 336e9 * Math.pow(2, (y - NOW) / TREND_DOUBLING);

/* Leading-edge logic process in volume production. kind: ship (history), plan (company plan), proj (imec roadmap). */
export const NODES = [
  [1971, '10 µm', 'ship'], [1974, '6 µm', 'ship'], [1977, '3 µm', 'ship'], [1981, '1.5 µm', 'ship'], [1984, '1 µm', 'ship'], [1987, '800 nm', 'ship'],
  [1990, '600 nm', 'ship'], [1993, '350 nm', 'ship'], [1996, '250 nm', 'ship'], [1999, '180 nm', 'ship'], [2001, '130 nm', 'ship'], [2003, '90 nm', 'ship'],
  [2005, '65 nm', 'ship'], [2007, '45 nm', 'ship'], [2009, '32 nm', 'ship'], [2012, '22 nm', 'ship'], [2014, '14 nm', 'ship'], [2016, '10 nm', 'ship'],
  [2018, '7 nm', 'ship'], [2020, '5 nm', 'ship'], [2022, '3 nm', 'ship'], [2025, '2 nm', 'ship'],
  [2027, 'A16 (1.6 nm-class, backside power)', 'plan'], [2028, 'A14 (1.4 nm-class)', 'plan'], [2031, 'A10', 'proj'], [2033, 'A7', 'proj'], [2036, 'A5', 'proj'], [2038, 'A3', 'proj']
];
export const SHAPES = [
  [1971, 'Planar MOS: a flat transistor, first PMOS, then NMOS', 'ship'],
  [1985, 'Planar CMOS: paired n- and p-type transistors that waste almost no power while idle', 'ship'],
  [2011, 'FinFET: the gate wraps three sides of a thin fin', 'ship'],
  [2022, 'Gate-all-around nanosheets: the gate surrounds stacked silicon sheets', 'ship'],
  [2033, 'CFET: n- and p-type transistors stacked on each other', 'proj']
];
export const LITHO = [
  [1971, 'Contact and proximity printing with mercury-lamp light', 'ship'],
  [1978, 'Steppers with g-line light, 436 nm', 'ship'],
  [1990, 'i-line light, 365 nm', 'ship'],
  [1996, 'Deep ultraviolet: KrF lasers, 248 nm', 'ship'],
  [2001, 'ArF lasers, 193 nm', 'ship'],
  [2007, 'ArF immersion: 193 nm light through water', 'ship'],
  [2012, 'Immersion with multiple patterning: each layer exposed two to four times', 'ship'],
  [2019, 'EUV, 13.5 nm light, for the critical layers', 'ship'],
  [2026, 'High-NA EUV joins EUV', 'ship'],
  [2038, 'Hyper-NA EUV may be needed', 'proj']
];
export const WAFERS = [[1971, '50 mm (2 inch)'], [1972, '75 mm (3 inch)'], [1976, '100 mm (4 inch)'], [1983, '150 mm (6 inch)'], [1992, '200 mm (8 inch)'], [2001, '300 mm (12 inch)']];
/* Typical cost to design one leading-edge chip, in millions of US dollars (IBS estimates). */
export const DESIGN_COST = [[2011, '28 nm', 51], [2014, '16/14 nm', 106], [2018, '7 nm', 257], [2020, '5 nm', 479], [2022, '3 nm', 585], [2025, '2 nm', 725]];

/* The year each company in the company explorer was founded (or entered chips, where noted). */
export const FOUNDED = {
  arm: 1990, synopsys: 1986, cadence: 1988, siemens: 1981, sifive: 2015, chipagents: 2023,
  asml: 1984, zeiss: 1846, trumpf: 1923, amat: 1967, lam: 1980, tel: 1963, kla: 1975, advantest: 1954,
  shinetsu: 1926, sumco: 1999, jsr: 1957, tok: 1940, ajinomoto: 1909, ibiden: 1912, entegris: 1966,
  tsmc: 1987, samsungf: 1974, intelf: 1968, smic: 2000, gf: 2009, rapidus: 2022,
  skhynix: 1983, samsungm: 1974, micron: 1978, cxmt: 2016,
  ase: 1984, amkor: 1968, jcet: 1972,
  nvidia: 1993, amd: 1969, broadcom: 1991, marvell: 1995, qualcomm: 1985, apple: 1976, mediatek: 1997, huawei: 2004,
  cerebras: 2016, groq: 2016, tenstorrent: 2016, etched: 2022, dmatrix: 2019, lightmatter: 2017, ayarlabs: 2015,
  foxconn: 1974, quanta: 1988, wistron: 2001, supermicro: 1993, dell: 1984,
  microsoft: 1975, google: 1998, amazon: 2006, meta: 2004, openai: 2015, oracle: 1977, coreweave: 2017
};

export const ERAS = [
  [1971, 'The first microprocessors', 'A whole processor fits on one chip. Calculators, cash registers and the first home computers.'],
  [1980, 'PCs and the CMOS takeover', 'Personal computers spread; CMOS transistors take over because they waste almost no power while idle.'],
  [1990, 'The PC boom, fabless chips and foundries', 'TSMC\'s foundry model lets companies design chips without owning a fab. Clock speeds race upward.'],
  [2000, 'The power wall', 'Around 2004, chips get too hot to keep raising clock speed. Designers add cores instead.'],
  [2007, 'Smartphones', 'The iPhone arrives in 2007. Low-power phone chips, mostly Arm, become the biggest market for advanced processes.'],
  [2012, 'FinFETs and the deep-learning spark', 'Transistors go 3D, and in 2012 a neural network trained on two gaming GPUs wins an image-recognition contest.'],
  [2018, 'EUV and the AI accelerator race', 'EUV light reaches volume production; cloud companies design their own AI chips.'],
  [2023, 'Generative AI and the chip boom', 'Demand for AI chips, HBM memory and advanced packaging outruns supply; data centers ask for gigawatts.'],
  [2027, 'Projection: High-NA, backside power, chiplets everywhere', 'Company plans: power delivered from the back of the wafer, 1.4 nm-class nodes, panel-level packaging.'],
  [2033, 'Projection: stacked transistors', 'imec\'s roadmap: n- and p-type transistors stacked on each other, then built as separate bonded tiers.']
];

/* Topics whose subject did not exist yet in early years: [year, what happened]. */
export const BORN = {
  riscv: [2010, 'RISC-V starts as a research project at UC Berkeley in 2010.'],
  compute: [2012, 'Deep learning takes off on GPUs in 2012.'],
  accelerators: [2016, 'Google reveals its first TPU in 2016. GPUs became programmable for general computing with CUDA in 2007.'],
  build: [2016, 'Purpose-built AI chips appear from 2016.']
};

const atOrBefore = (list, y) => { let r = null; for (const it of list) if (it[0] <= y) r = it; return r; };
const clampY = y => Math.max(MIN, Math.min(MAX, Math.round(+y || NOW)));

/* Everything the site shows about one year. */
export function snapshot(year) {
  const y = clampY(year);
  const chip = atOrBefore(CHIPS, y);
  const node = atOrBefore(NODES, y), shape = atOrBefore(SHAPES, y), litho = atOrBefore(LITHO, y), wafer = atOrBefore(WAFERS, y), era = atOrBefore(ERAS, y);
  const cost = atOrBefore(DESIGN_COST, y);
  const ids = Object.keys(FOUNDED);
  const existed = ids.filter(k => FOUNDED[k] <= y);
  const s = {
    y, proj: y > NOW,
    era: { t: era[1], d: era[2] },
    chip: { year: chip[0], name: chip[1], maker: chip[2], kind: chip[3], tr: chip[4], node: chip[5], why: chip[6] },
    node: { t: node[1], kind: node[2], year: node[0] },
    shape: { t: shape[1], kind: shape[2], year: shape[0] },
    litho: { t: litho[1], kind: litho[2], year: litho[0] },
    wafer: wafer[1],
    cost: cost ? { node: cost[1], m: cost[2] } : null,
    companies: { n: existed.length, total: ids.length, ids: existed },
    missing: Object.entries(BORN).filter(([, b]) => b[0] > y).map(([id]) => id)
  };
  /* The largest chip so far, for the flagship line: the biggest count among chips up to this year. */
  const big = CHIPS.filter(c => c[0] <= y).reduce((a, c) => (c[4] > a[4] ? c : a));
  s.biggest = { name: big[1], tr: big[4], year: big[0] };
  s.flagship = y > NOW ? trendTransistors(y) : big[4];
  return s;
}

/* Words for big numbers: 2,300 · 1.2 million · 336 billion · 25 trillion. */
export function words(n) {
  if (n >= 1e12) return (+(n / 1e12).toPrecision(2)) + ' trillion';
  if (n >= 1e9) return (+(n / 1e9).toPrecision(3)) + ' billion';
  if (n >= 1e6) return (+(n / 1e6).toPrecision(3)) + ' million';
  return Math.round(n).toLocaleString('en-US');
}

/* One sentence per topic: what this topic looked like in that year. */
export function topicLine(id, year) {
  const s = snapshot(year), y = s.y;
  if (BORN[id] && BORN[id][0] > y) return 'Not yet: ' + BORN[id][1];
  const isa = [[1978, 'x86'], [1985, 'Arm'], [2010, 'RISC-V']].filter(x => x[0] <= y).map(x => x[1]);
  const L = {
    physics: 'Wafers in the newest fabs are ' + s.wafer + ' across.',
    transistor: s.shape.t + (s.shape.kind === 'proj' ? ' (projection)' : '') + '. Leading-edge process: ' + s.node.t + '.',
    architecture: isa.length ? 'Instruction sets of today already alive: ' + isa.join(', ') + '. Biggest chip so far: ' + s.biggest.name + ', ' + words(s.biggest.tr) + ' transistors.' : 'None of today\'s big instruction sets exists yet: x86 arrives in 1978, Arm in 1985, RISC-V in 2010.',
    riscv: y < 2015 ? 'RISC-V is a university research project; the RISC-V Foundation forms in 2015.' : y < 2020 ? 'The RISC-V Foundation grows; the first commercial RISC-V cores ship.' : 'RISC-V International, based in Switzerland since 2020, runs the open standard.',
    design: y < 1984 ? 'Chips are drawn largely by hand, gate by gate and polygon by polygon. Verilog arrives in 1984.' : y < 1988 ? 'Verilog (1984) lets engineers describe hardware as code; automatic logic synthesis is just arriving.' : s.cost ? 'Designing a leading-edge chip costs about $' + s.cost.m + ' million (' + s.cost.node + ', IBS estimate).' : 'Logic synthesis and automatic place-and-route turn code into layouts.',
    layout: 'The biggest chip so far, ' + s.biggest.name + ', places ' + words(s.biggest.tr) + ' transistors.',
    tiny: y < 1981 ? 'Only big companies can make chips: shared multi-project wafers start with MOSIS in 1981.' : y < 2022 ? 'Universities share wafers through programs such as MOSIS (since 1981). Community shuttles for hobbyists are still to come.' : 'Community shuttles such as Tiny Tapeout (since 2022) let anyone put a design on a real chip.',
    litho: 'Printing method: ' + s.litho.t + (s.litho.kind === 'proj' ? ' (projection)' : '') + '.',
    fab: 'Newest fabs process ' + s.wafer + ' wafers on a ' + s.node.t + ' process.',
    yield: 'The biggest die so far holds ' + words(s.biggest.tr) + ' transistors (' + s.biggest.name + '). Bigger dies catch more defects.',
    package: y < 2011 ? 'Chips sit alone in their packages, wired out through bond wires or solder bumps.' : y < 2015 ? '2.5D packaging begins: TSMC\'s CoWoS joins dies side by side on a silicon interposer.' : y < 2017 ? 'HBM memory stacks arrive beside the GPU (2015).' : 'Chiplets and HBM stacks make the package a system.',
    compute: y < 2017 ? 'Deep learning runs on GPUs; the transformer architecture comes in 2017.' : y < 2022 ? 'Transformers (2017) scale up; models grow from millions to billions of parameters.' : 'Large language models serve hundreds of millions of people.',
    accelerators: y < 2017 ? 'The first AI chips: Google\'s TPU (revealed 2016) and GPUs used for deep learning.' : 'Tensor cores (2017), TPUs and a wave of AI chip startups.',
    build: 'Purpose-built AI chips exist; their designers face the same trade-offs you do here.',
    everywhere: y < 1977 ? 'Chips go into calculators, watches and industrial controls.' : y < 1983 ? 'Home computers such as the Apple II (1977) and the IBM PC (1981) appear.' : y < 2007 ? 'Mobile phones (from 1983) and PCs carry more and more chips.' : y < 2012 ? 'Smartphones (from 2007) become the biggest market for advanced chips.' : y <= NOW ? 'Phones, cars, appliances and AI data centers: over a trillion chips a year.' : 'Projection: more chips in cars, robots and data centers; today\'s trends continued.',
    datacenter: y < 1995 ? 'Computing lives in mainframes, minicomputers and PCs.' : y < 2006 ? 'Web companies build large data centers from ordinary PC servers.' : y < 2016 ? 'Cloud computing (from 2006) puts servers in giant shared data centers.' : 'GPU clusters linked by NVLink (from 2016) and fast networks train AI models.',
    ecosystem: s.companies.n + ' of the ' + s.companies.total + ' companies in today\'s ecosystem explorer exist' + (y > NOW ? ' (plus whoever is founded after 2026).' : '.'),
    supply: y < 1987 ? 'Almost every chip company owns its own fab. TSMC, the first pure foundry, opens in 1987.' : 'The foundry model (TSMC, 1987) splits design from manufacturing; supply chains spread across countries.',
    economics: s.cost ? 'Designing a leading-edge chip costs about $' + s.cost.m + ' million (' + s.cost.node + ', IBS estimate).' : 'Leading-edge chips cost far less to design than today\'s: the IBS series starts at about 1 million for 28 nm in 2011.',
    innovation: y <= NOW ? 'This is history. The innovation map describes 2026 and the 2030 outlook.' : 'You are in a projection: the bottlenecks on the innovation map decide whether it comes true.',
    future: y <= NOW ? 'Everything after 2026 on the roadmap is a plan or a projection.' : 'Projection for ' + y + ': ' + s.node.t + ' process, ' + s.shape.t.split(':')[0] + ' transistors.',
    scenarios: y <= NOW ? 'The scenarios start in 2026 and run to 2040.' : 'You are inside the scenario window: ' + y + ' is one of many possible futures.'
  };
  return L[id] || '';
}
