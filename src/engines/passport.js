/* Your chip's passport: one design from the tiny-chip studio, followed through every layer of the
   stack. Pure logic, no DOM: everything here is computed from the design and the chosen process
   with the same engines the labs use. */
import TC from './tinychip.js';

/* What each process in the studio means further along the stack. */
export const NODE_X = {
  '180': { year: 1999, light: 'deep-ultraviolet KrF light, 248 nm', shape: 'planar CMOS transistors', where: 'a 180 nm line such as GlobalFoundries\' GF180MCU, the process of Tiny Tapeout\'s GF shuttles', open: true },
  '130': { year: 2001, light: 'KrF light at 248 nm, with 193 nm ArF on the finest layers', shape: 'planar CMOS transistors', where: 'IHP in Germany (SG13G2) or SkyWater in the US (SKY130), both with open design kits', open: true },
  '28': { year: 2011, light: 'ArF immersion light, 193 nm through water', shape: 'planar transistors, usually with high-k metal gates', where: 'a 28 nm foundry such as TSMC, Samsung, GlobalFoundries, UMC or SMIC', open: false },
  '3': { year: 2022, light: 'EUV light at 13.5 nm for the critical layers', shape: 'FinFETs (TSMC N3) or gate-all-around nanosheets (Samsung)', where: 'TSMC in Taiwan or Samsung in South Korea', open: false }
};
export const NODES = ['180', '130', '28', '3'];

/* The full passport. proj: a TC.PROJ entry; code: its source; node: '180' | '130' | '28' | '3'. */
export function passport({ proj, code, node = '130', lib = 'basic', util = 0.5, name } = {}) {
  const D = TC.parse(code, proj.ins, proj.outs);
  const base = { name: (name || '').trim() || proj.t, proj: proj.id, title: proj.t, node, lib, util };
  if (D.errs.length) return { ...base, ok: false, errs: D.errs };
  const vectors = TC.vectors(proj.ins);
  const wrong = proj.f ? vectors.filter(v => { const o = TC.evalDesign(D, v), e = proj.f(v); return proj.outs.some(k => o[k] !== e[k]); }).length : 0;
  const SY = TC.synth(D, proj.ins, proj.outs, lib, false, node);
  const nd = TC.NODE[node], X = NODE_X[node];
  const PL = TC.place(SY.M, util, 7);
  const wUm = PL.GW * nd.site[0], hUm = PL.H / 3 * nd.site[1], area = wUm * hUm;
  const areaCm2 = area / 1e8, yieldPct = Math.exp(-areaCm2 * nd.d0) * 100;
  const waferUm2 = Math.PI * (nd.wafer * 500) ** 2;
  return {
    ...base, ok: true, errs: [],
    spec: !!proj.f, wrong, cases: vectors.length,
    inputs: proj.ins.length, outputs: proj.outs.length, lines: D.order.length,
    cells: SY.st.cells, tr: SY.st.tr, depth: SY.st.depth, fmaxMHz: SY.st.fmax,
    nodeName: nd.t, masks: nd.masks, maskCostM: nd.mask$, shuttle: nd.shuttle, wafer: nd.wafer, weeks: Math.round(nd.masks * nd.days / 7),
    wUm, hUm, area, yieldPct, copiesPerWafer: waferUm2 / area,
    year: X.year, light: X.light, shape: X.shape, where: X.where, openPdk: X.open,
    vs4004: SY.st.tr / 2300, vsRubin: 336e9 / SY.st.tr,
    alu: proj.id === 'alu'
  };
}

const n0 = v => Math.round(v).toLocaleString('en-US');
const big = v => v >= 1e9 ? (+(v / 1e9).toPrecision(3)) + ' billion' : v >= 1e6 ? (+(v / 1e6).toPrecision(3)) + ' million' : n0(v);
const mhz = m => m >= 1000 ? (m / 1000).toFixed(2) + ' GHz' : Math.round(m) + ' MHz';

/* The journey: every stage of the stack, what it means for this chip, and where to see it.
   key: the stamp id; topic: where the stage lives on the map. */
export function journey(p) {
  if (!p.ok) return [];
  return [
    { key: 'logic', topic: 'tiny', href: '#lab-tiny-1', t: 'Logic', d: p.lines + ' lines of logic, ' + p.inputs + ' inputs and ' + p.outputs + ' outputs.' },
    { key: 'verify', topic: 'design', href: '#lab-tiny-1', t: 'Verification', d: !p.spec ? 'Free design: all ' + p.cases + ' input cases shown, no specification to check against.' : p.wrong ? 'Wrong in ' + p.wrong + ' of ' + p.cases + ' cases. A real chip with this bug cannot be patched.' : 'Correct in all ' + p.cases + ' cases: exhaustive verification.' },
    { key: 'gates', topic: 'design', href: '#lab-tiny-1', t: 'Synthesis', d: p.cells + ' standard cells, ' + n0(p.tr) + ' transistors, ' + p.depth + ' gates on the longest path, up to ' + mhz(p.fmaxMHz) + ' at ' + p.nodeName + '.' },
    { key: 'cpu', topic: 'riscv', href: '#riscv-3', t: 'Inside a CPU', d: p.alu ? 'Your slice, copied 32 times, is the RISC-V core\'s ALU: ' + n0(p.tr * 32) + ' transistors.' : 'Only the ALU slice project runs inside the RISC-V core. Your design is a stand-alone chip.' },
    { key: 'layout', topic: 'layout', href: '#lab-tiny-1', t: 'Layout', d: p.wUm.toFixed(1) + ' × ' + p.hUm.toFixed(1) + ' µm at ' + p.nodeName + ': ' + n0(p.area) + ' µm².' },
    { key: 'masks', topic: 'litho', href: '#litho', t: 'Masks and light', d: 'About ' + p.masks + ' masks, printed with ' + p.light + '. A full mask set alone would cost about $' + (p.maskCostM >= 1 ? p.maskCostM + ' million' : Math.round(p.maskCostM * 1000) + ',000') + '.' },
    { key: 'fab', topic: 'fab', href: '#fab', t: 'Fab', d: 'About ' + p.weeks + ' weeks in the fab, on ' + p.wafer + ' mm wafers. Made at ' + p.where + '.' },
    { key: 'yield', topic: 'yield', href: '#yield', t: 'Yield', d: 'Your circuit is so small that ' + (p.yieldPct >= 99.99 ? 'practically every copy works' : p.yieldPct.toFixed(3) + '% of copies work') + '. One wafer could hold ' + big(p.copiesPerWafer) + ' copies.' },
    { key: 'test', topic: 'tiny', href: '#lab-tiny-1', t: 'Test', d: 'Every copy is tested with up to ' + p.cases + ' input patterns before it ships.' },
    { key: 'cost', topic: 'economics', href: '#economics', t: 'Cost', d: p.shuttle ? 'On a shared shuttle you pay for a small tile, not the $' + (p.maskCostM >= 1 ? p.maskCostM + ' million' : Math.round(p.maskCostM * 1000) + 'k') + ' mask set. That is what makes student chips possible.' : 'No low-cost shuttles at 3 nm: a full mask set costs about $' + p.maskCostM + ' million, so only large companies tape out here.' },
    { key: 'era', topic: 'future', href: '#timeMachine', t: 'History', d: 'Your process reached volume production in ' + p.year + '. Your ' + n0(p.tr) + ' transistors are ' + (p.vs4004 >= 1 ? p.vs4004.toFixed(1) + ' times' : Math.round(p.vs4004 * 100) + '% of') + ' the 1971 Intel 4004\'s 2,300; NVIDIA Rubin has ' + big(p.vsRubin) + ' times more.' },
    { key: 'real', topic: 'tiny', href: '#lab-tiny-1', t: 'Real silicon', d: p.openPdk ? 'Exportable as a Tiny Tapeout project: real Verilog for Yosys and OpenROAD, on an open process.' : 'At ' + p.nodeName + ' there is no open design kit or community shuttle; export it at 130 or 180 nm to make it for real.' },
    { key: 'bench', topic: 'bench', href: '#lab-bench-1', t: 'On the bench', d: 'Twin-test it on a board: all ' + p.cases + ' input patterns, board against simulation, the way finished chips are checked. The virtual board works today; real boards join step by step.' }
  ];
}

/* One line for a topic page: what this topic means for the learner's chip. */
export function chipLine(topic, p) {
  if (!p || !p.ok) return '';
  const J = Object.fromEntries(journey(p).map(s => [s.key, s.d]));
  const L = {
    tiny: J.logic + ' ' + J.verify,
    design: J.gates,
    layout: J.layout,
    riscv: J.cpu,
    litho: J.masks,
    fab: J.fab,
    yield: J.yield,
    economics: J.cost,
    future: J.era,
    bench: J.bench,
    transistor: 'At ' + p.nodeName + ' your ' + n0(p.tr) + ' transistors are ' + p.shape + '.',
    physics: 'Your chip starts as one spot on a ' + p.wafer + ' mm silicon wafer, among ' + big(p.copiesPerWafer) + ' possible copies.',
    architecture: 'Your chip has ' + p.cells + ' cells. A CPU is the same kind of logic, a few million to billions of times larger.',
    supply: 'Made at ' + p.where + '. Packaging and testing often happen in another country again.',
    package: 'Community-shuttle chips come back as bare dies or small packages on a demo board; a GPU\'s package holds whole stacks of memory.',
    reality: (p.wrong ? 'Your chip still fails ' + p.wrong + ' of its ' + p.cases + ' cases: fix that first. ' : 'Your chip is correct in all ' + p.cases + ' cases. ') + 'Each copy will still differ a little, run warm and age; at ' + p.nodeName + ' it was checked at one ideal set of conditions.',
    accelerators: 'NVIDIA Rubin has ' + big(p.vsRubin) + ' times as many transistors as your chip.'
  };
  return L[topic] || '';
}
