/* Lab: RISC-V CPU lab. Levels, editor, datapath view, scoring and the AI copilot.
   Every level is open; stars are feedback only. */
import RV from 'osl/engines/riscv.js';
import { LEVELS as LV, CORES } from 'osl/data/riscv-levels.js';
import { CARDS, TH } from 'osl/data/cards.js';
import { makeALU, pickDefect } from 'osl/engines/alu.js';
import { currentSlice, openSliceInStudio } from 'osl/app/alu-link.js';
import { stampChip } from 'osl/app/mychip.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const tok = () => { const cs = getComputedStyle(document.documentElement); const g = n => cs.getPropertyValue('--' + n).trim(); return { ink: g('ink'), muted: g('muted'), line: g('line'), panel: g('surface'), sunk: g('sunk'), copper: g('amber'), oxide: g('cyan'), gold: g('amber'), good: g('good'), bad: g('bad'), violet: g('violet'), bg: g('bg') }; };

const LVX = { 0: { mem: [['0x1000', 0x1000, 16, 'i32']] }, 1: { mem: [] }, 2: { mem: [['X', 0x1000, 3, 'i32']] }, 3: { mem: [['N', 0x1000, 1, 'i32']] }, 4: { mem: [['P', 0x1000, 2, 'i32']] }, 5: { mem: [['W', 0x1000, 16, 'i8'], ['V', 0x1010, 16, 'i8']] }, 6: { mem: [['W', 0x1000, 16, 'i8'], ['V', 0x1010, 16, 'i8']] }, 7: { mem: [['W', 0x1000, 64, 'i8'], ['V', 0x1040, 16, 'i8'], ['Y', 0x1100, 4, 'i32']] } };
const EXTRA = { 1: ['copilot'], 4: ['modular'], 5: ['riscvai'], 6: ['skills'], 7: ['openisa'] };
const SANDBOX = { id: 0, t: 'Sandbox', arc: 'Free play', core: ['i', 'im', 'imac', 'idot', 'idotx'], pickCore: true, story: 'An empty RISC-V core with 8 KB of memory. Try any instruction, step through it and watch the datapath.', goal: 'No goal: experiment. Pick a core, write code and press Play.', syms: {}, start: '# Free play: try anything\nli   a0, 7\nli   a1, 6\nloop:\n  add  a2, a2, a0\n  addi a1, a1, -1\n  bnez a1, loop\n', sol: null, hints: ['Step through to see which datapath blocks each instruction uses.'], tests: [{}], check: () => null, cards: ['register', 'branch', 'extensions', 'custom'], ai: 'Ask the copilot to explain any instruction or to write a small program, then step through it to check whether it really does what it said.' };

const KEY = 'osl-riscv-v1';
const S = { stars: {}, code: {}, core: {}, alu: 'builtin', defect: false };
try { const j = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('osq-v1') || 'null'); if (j && typeof j === 'object') ['stars', 'code', 'core'].forEach(k => { if (j[k] && typeof j[k] === 'object') S[k] = j[k]; }); if (j.alu === 'mine') S.alu = 'mine'; if (j.defect === true) S.defect = true; } catch (e) { /* storage unavailable */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const starStr = n => '<span>' + '★'.repeat(n) + '</span><span class="off">' + '★'.repeat(3 - n) + '</span>';

export const riscvStars = () => LV.reduce((t, l) => t + (S.stars[l.id] || 0), 0);
export const levelStars = id => S.stars[id] || 0;

function runProg(L, src, coreKey, alu) {
  const C = CORES[coreKey]; const asm = RV.assemble(src, { ext: C.ext, syms: L.syms }); if (asm.errs.length) return { errs: asm.errs };
  let max = 0, ops = 0; const res = [];
  for (const t of L.tests) { const d = JSON.parse(JSON.stringify(t)); const m = RV.machine(asm.prog, mm => { if (L.init) L.init(mm, d); }, { alu }); RV.run(m, asm.prog); ops += m.aluOps; if (m.err) return { errs: [m.err], m, ops }; const f = L.check(m, d); res.push({ ok: !f, msg: f, cyc: m.cycles }); max = Math.max(max, m.cycles); }
  return { res, max, us: max / C.mhz, C, ops };
}

/* ---- your ALU: 32 copies of the slice from the tiny chip studio ---- */
const DEFECT_BIT = 5;
let aluCache = { key: null, fn: null, def: null };
function aluInfo() { const sl = currentSlice(); return { sl, usable: S.alu === 'mine' && sl.ok }; }
function aluFn() {
  const { sl, usable } = aluInfo(); if (!usable) return null;
  const key = sl.table.join('') + '|' + S.defect;
  if (aluCache.key !== key) { const def = S.defect ? pickDefect(sl.SY, DEFECT_BIT, 11) : null; aluCache = { key, fn: makeALU(sl.table, def), def }; }
  return aluCache.fn;
}
function renderAlu() {
  const { sl, usable } = aluInfo(); const mine = S.alu === 'mine';
  $('#rvAluSeg').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.a === S.alu));
  let txt, tag;
  if (!mine) { tag = 'Built in'; txt = 'The core uses a ready-made ALU. Switch to your gates and every add, subtract, AND, OR, XOR, comparison, branch and memory address runs on 32 copies of the one-bit slice you design in the tiny chip studio.'; }
  else if (!sl.ok) { tag = 'Not built'; txt = 'Your slice has ' + sl.errs.length + ' error' + (sl.errs.length > 1 ? 's' : '') + ', so the core cannot be built from it yet and uses the built-in ALU. Fix the code in the tiny chip studio.'; }
  else if (sl.wrong.length) { tag = 'Your gates · has a bug'; txt = 'The core now runs on your slice, which gives the wrong answer in ' + sl.wrong.length + ' of 64 cases. Expect wrong sums, wrong comparisons and loops that never end. Fix it in the studio, or switch back to check whether a failure is in your program or in your gates.'; }
  else { tag = 'Your gates'; txt = 'The core runs on 32 copies of your slice: ' + sl.cells + ' cells and ' + sl.tr + ' transistors each, ' + (sl.tr * 32).toLocaleString('en-US') + ' transistors for the whole ALU. All 64 cases verified.'; }
  if (usable && S.defect) { aluFn(); const d = aluCache.def; txt += d ? ' Defect planted: in the slice for bit ' + DEFECT_BIT + ', one wire is stuck at ' + d.fault.v + '. Your design was right; the factory broke one copy of it. Test patterns (step 8 in the studio) exist to catch exactly this.' : ''; tag += ' · defect'; }
  $('#rvAluTag').textContent = tag; $('#rvAluTxt').textContent = txt;
  $('#rvDefWrap').hidden = !usable; $('#rvDef').checked = S.defect;
}
function aluChanged() { aluCache.key = null; renderAlu(); if (L) { $('#rvResults').innerHTML = ''; lastRun = null; resetMachine(); } }

let T, L = null, asm = null, M = null, data = null, coreKey = 'i', playT = 0, lastRun = null, hintN = 0, readRegs = [], dash = 0, BASE = {};
let ta, gut, cv;

function cardHTML(k) {
  const c = CARDS[k]; if (!c) return '';
  const lv = LV.filter(l => (l.cards || []).includes(k) || (EXTRA[l.id] || []).includes(k)).map(l => l.id);
  return '<div class="kc" style="--c:' + TH[c[0]][1] + '"><span class="eyebrow">' + TH[c[0]][0] + '</span><b>' + esc(c[1]) + '</b><p>' + esc(c[2]) + '</p><div class="links">' + lv.map(i => '<a href="#riscv-' + i + '">Level ' + i + '</a>').join('') + '<a href="#' + c[3] + '">Topic: ' + esc(c[3]) + '</a></div></div>';
}

function renderLevelBar() {
  $('#rvLevels').innerHTML = LV.concat([SANDBOX]).map(l => { const st = S.stars[l.id] || 0; const on = L && L.id === l.id; return '<a role="tab" aria-selected="' + on + '" href="#riscv-' + (l.id || 'sandbox') + '"><span>' + (l.id ? 'Level ' + l.id : 'Free play') + '</span><b>' + esc(l.t) + '</b>' + (l.id ? '<i class="stars">' + starStr(st) + '</i>' : '<i></i>') + '</a>'; }).join('');
}
function coreOf(l) { const k = S.core[l.id]; return l.core.includes(k) ? k : l.core[0]; }

export function openLevel(id) {
  const l = id === 0 ? SANDBOX : (LV.find(x => x.id === id) || LV[0]);
  L = l; coreKey = coreOf(l); hintN = 0; lastRun = null; stopPlay();
  const isS = l.id === 0;
  $('#rvLvEye').textContent = isS ? 'Free play' : 'Level ' + l.id + ' of ' + LV.length + ' · ' + l.arc;
  $('#rvLvTitle').textContent = l.t;
  $('#rvLvStars').innerHTML = isS ? '' : starStr(S.stars[l.id] || 0);
  const prev = LV.find(x => x.id === l.id - 1), next = LV.find(x => x.id === l.id + 1);
  const pv = $('#rvLvPrev'), nx = $('#rvLvNext');
  pv.hidden = !prev; if (prev) { pv.href = '#riscv-' + prev.id; pv.textContent = '← Level ' + prev.id; }
  nx.hidden = !(next && !isS); if (next) { nx.href = '#riscv-' + next.id; nx.textContent = 'Level ' + next.id + ' →'; }
  $('#rvLvStory').textContent = l.story; $('#rvLvGoal').textContent = l.goal;
  ta.value = S.code[l.id] !== undefined ? S.code[l.id] : l.start;
  $('#rvFileName').textContent = (isS ? 'sandbox' : 'level' + l.id) + '.s';
  renderCores(); $('#rvHints').innerHTML = '';
  const hb = $('#rvBHint'); hb.textContent = l.hints && l.hints.length ? 'Show a hint' : 'No hints'; hb.disabled = !(l.hints && l.hints.length);
  $('#rvCopOut').hidden = true; $('#rvCopOut').textContent = ''; $('#rvResults').innerHTML = '';
  $('#rvAiTxt').textContent = l.ai || '';
  $('#rvLvCards').innerHTML = [...new Set((l.cards || []).concat(EXTRA[l.id] || []))].map(cardHTML).join('');
  renderLevelBar(); compile(); resetMachine();
}
function renderCores() {
  const box = $('#rvCores');
  box.innerHTML = L.core.map(k => { const c = CORES[k]; return '<button type="button" data-k="' + k + '" aria-pressed="' + (k === coreKey) + '"><b>' + c.t + '</b><small>' + c.d + '</small><span>' + c.area + ' area · ' + c.mhz + ' MHz</span></button>'; }).join('');
  box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { coreKey = b.dataset.k; S.core[L.id] = coreKey; save(); renderCores(); compile(); resetMachine(); }));
  $('#rvCoreTag').textContent = L.core.length > 1 ? 'Choose one' : 'Fixed for this level';
}
function compile() {
  asm = RV.assemble(ta.value, { ext: CORES[coreKey].ext, syms: L.syms || {} }); const st = $('#rvAsmStat');
  if (asm.errs.length) { st.className = 'pill bad'; st.textContent = asm.errs.length + (asm.errs.length > 1 ? ' errors' : ' error'); }
  else { st.className = 'pill ok'; st.textContent = asm.prog.length + ' instructions'; }
  $('#rvErrs').innerHTML = asm.errs.slice(0, 6).map(e => '<p><b>Line ' + e.l + '</b>' + esc(e.m) + '</p>').join('');
  gutter();
}
function curLine() { if (!M || !asm) return -1; if (M.halted) return M.last ? M.last.e.l : -1; const e = asm.prog[M.pc >> 2]; return e ? e.l : -1; }
function gutter() {
  const n = ta.value.split('\n').length; const er = new Set(asm ? asm.errs.map(e => e.l) : []); const cl = curLine();
  gut.innerHTML = Array.from({ length: Math.max(n, 14) }, (_, i) => '<span class="' + (i + 1 === cl ? 'cur' : er.has(i + 1) ? 'er' : '') + '">' + (i + 1) + '</span>').join('');
  gut.scrollTop = ta.scrollTop;
}
function resetMachine() { stopPlay(); data = JSON.parse(JSON.stringify(L.tests[0] || {})); M = asm.errs.length ? null : RV.machine(asm.prog, m => { if (L.init) L.init(m, data); }, { alu: aluFn() }); readRegs = []; renderState(); }
function stepOnce() { if (!M || M.halted) return false; const r = RV.step(M, asm.prog); readRegs = r ? [r.e.rs1, r.e.rs2].filter(x => x !== undefined) : []; return !!r; }
function stopPlay() { clearInterval(playT); playT = 0; const b = $('#rvBPlay'); if (b) b.textContent = 'Play'; }

function renderState() {
  gutter(); const r = M && M.last;
  $('#rvSSteps').textContent = M ? M.steps.toLocaleString('en-US') : '0';
  $('#rvSCyc').textContent = M ? M.cycles.toLocaleString('en-US') : '0';
  $('#rvSPc').textContent = M ? '0x' + M.pc.toString(16).padStart(3, '0') : '–';
  $('#rvSLast').textContent = M && M.err ? 'Error' : M && M.halted && M.steps ? 'Finished' : r && r.rd !== null && r.rd !== undefined ? RV.ABI[r.rd] + ' = ' + r.val : r && r.act.mem === 'w' ? 'stored' : r && r.e.f === 'B' ? (r.act.taken ? 'branch taken' : 'not taken') : '–';
  if (M && M.err) $('#rvErrs').innerHTML = '<p><b>' + (M.err.l ? 'Line ' + M.err.l : 'Run') + '</b>' + esc(M.err.m) + '</p>';
  const x = M ? M.x : new Int32Array(32);
  $('#rvRegs').innerHTML = Array.from({ length: 32 }, (_, i) => '<div class="' + (r && r.rd === i && i ? 'w' : readRegs.includes(i) ? 'r' : '') + '" title="x' + i + ' = 0x' + ((x[i] >>> 0).toString(16)) + '"><span>x' + i + ' ' + RV.ABI[i] + '</span><b>' + x[i] + '</b></div>').join('');
  const mm = LVX[L.id].mem; $('#rvMemCard').hidden = !mm.length;
  if (mm.length) {
    $('#rvMemTag').textContent = mm.map(q => q[0] + ' = 0x' + q[1].toString(16)).join(' · ');
    $('#rvMem').innerHTML = mm.map(([nm, a, n, ty]) => { let cells = ''; for (let i = 0; i < n; i++) { const ad = ty === 'i8' ? a + i : a + 4 * i; const v = M ? (ty === 'i8' ? RV.s8(M.mem[ad]) : RV.ld(M, ad, 4, true)) : 0; const hit = r && r.memA !== null && r.memA !== undefined && (ty === 'i8' ? (r.memA <= ad && ad < r.memA + (r.e.op[1] === 'w' ? 4 : 1)) : (ad === r.memA)); cells += '<span class="' + (hit ? (r.act.mem === 'w' ? 'wr' : 'hit') : '') + '">' + v + '</span>'; } return '<div class="mr"><span>' + nm + (ty === 'i8' ? ' (int8)' : ' (word)') + '</span><div class="cells">' + cells + '</div></div>'; }).join('');
  }
  enc(); drawDP();
}
function enc() {
  const r = M && M.last; const e = r ? r.e : (M && asm.prog[M.pc >> 2]) || null; const box = $('#rvBits');
  if (!e) { box.innerHTML = ''; $('#rvEncTxt').textContent = 'Instruction encoding'; $('#rvEncHex').textContent = ''; return; }
  $('#rvEncTxt').textContent = (r ? 'Just ran: ' : 'Next: ') + e.src + (e.pseudo ? '  (' + e.pseudo + ' → ' + e.op + ')' : '');
  $('#rvEncHex').textContent = '0x' + e.word.toString(16).padStart(8, '0');
  const col = { opcode: 'var(--amber)', rd: 'var(--cyan)', rs1: 'var(--violet)', rs2: 'var(--violet)', funct3: 'var(--amber-fill)', funct7: 'var(--amber-fill)' };
  box.innerHTML = RV.fields(e).map(([n, w, v]) => '<div style="flex:' + w + ' 1 0;background:color-mix(in srgb,' + (col[n] || 'var(--muted)') + ' 16%,transparent)"><code>' + ((v >>> 0) & ((2 ** w) - 1)).toString(2).padStart(w, '0') + '</code><small>' + n + (n === 'rd' || n.startsWith('rs') ? ' = ' + RV.ABI[v] : '') + '</small></div>').join('');
}

/* ---- datapath drawing ---- */
const B = { pc: [30, 190, 58, 58, 'PC'], add: [30, 70, 58, 40, '+4'], imem: [118, 170, 108, 98, 'Instruction\nmemory'], dec: [262, 26, 128, 50, 'Decode & control'], rf: [262, 150, 128, 150, 'Registers\nx0–x31'], imm: [262, 322, 128, 42, 'Immediate'], cmp: [442, 40, 96, 46, 'Compare'], alu: [442, 150, 96, 110, 'ALU'], mul: [442, 280, 96, 42, 'Multiplier'], ai: [442, 340, 96, 52, 'AI unit'], dmem: [588, 160, 118, 110, 'Data\nmemory'], wb: [752, 175, 40, 120, 'WB'] };
const W = { pc_imem: [[88, 219], [118, 219]], pc_add: [[59, 190], [59, 110]], add_pc: [[30, 90], [14, 90], [14, 219], [30, 219]], imem_dec: [[172, 170], [172, 51], [262, 51]], imem_rf: [[226, 200], [262, 200]], dec_imm: [[326, 76], [326, 98], [244, 98], [244, 343], [262, 343]],
  rf_alu_a: [[390, 185], [442, 185]], rf_alu_b: [[390, 230], [420, 230], [420, 235], [442, 235]], imm_alu_b: [[390, 343], [416, 343], [416, 240], [442, 240]], rf_cmp: [[390, 170], [410, 170], [410, 63], [442, 63]], cmp_pc: [[538, 63], [560, 63], [560, 14], [8, 14], [8, 236], [30, 236]],
  alu_dmem: [[538, 205], [588, 205]], rf_dmem: [[390, 280], [566, 280], [566, 250], [588, 250]], dmem_wb: [[706, 215], [752, 215]], alu_wb: [[538, 190], [560, 190], [560, 140], [730, 140], [730, 195], [752, 195]],
  rf_mul: [[390, 295], [442, 301]], mul_wb: [[538, 301], [730, 301], [730, 255], [752, 255]], rf_ai: [[390, 300], [424, 300], [424, 366], [442, 366]], ai_wb: [[538, 366], [740, 366], [740, 275], [752, 275]],
  wb_rf: [[792, 235], [818, 235], [818, 410], [240, 410], [240, 280], [262, 280]], imm_wb: [[390, 355], [410, 355], [410, 400], [744, 400], [744, 285], [752, 285]], pc4_wb: [[88, 100], [100, 100], [100, 132], [746, 132], [746, 185], [752, 185]] };
function activeOf(r) {
  if (!r) return { w: [], b: [] }; const e = r.e, op = e.op; const w = ['pc_imem', 'imem_dec'], b = ['pc', 'imem', 'dec']; const add = (...x) => x.forEach(v => v in W ? w.push(v) : b.push(v));
  const taken = r.act.taken; if (!taken && e.f !== 'J' && op !== 'jalr') add('pc_add', 'add_pc', 'add');
  if (e.f === 'R') { if (r.act.unit === 'ai') add('imem_rf', 'rf_ai', 'ai_wb', 'wb_rf', 'rf', 'ai', 'wb'); else if (['mul', 'mulh', 'div', 'rem'].includes(op)) add('imem_rf', 'rf_mul', 'mul_wb', 'wb_rf', 'rf', 'mul', 'wb'); else add('imem_rf', 'rf_alu_a', 'rf_alu_b', 'alu_wb', 'wb_rf', 'rf', 'alu', 'wb'); }
  else if (e.opc === 0x13) add('imem_rf', 'dec_imm', 'rf_alu_a', 'imm_alu_b', 'alu_wb', 'wb_rf', 'rf', 'imm', 'alu', 'wb');
  else if (e.opc === 0x03) add('imem_rf', 'dec_imm', 'rf_alu_a', 'imm_alu_b', 'alu_dmem', 'dmem_wb', 'wb_rf', 'rf', 'imm', 'alu', 'dmem', 'wb');
  else if (e.f === 'S') add('imem_rf', 'dec_imm', 'rf_alu_a', 'imm_alu_b', 'alu_dmem', 'rf_dmem', 'rf', 'imm', 'alu', 'dmem');
  else if (e.f === 'B') { add('imem_rf', 'rf_cmp', 'dec_imm', 'rf', 'cmp', 'imm'); if (taken) add('cmp_pc'); }
  else if (e.f === 'J' || op === 'jalr') { add('dec_imm', 'pc4_wb', 'wb_rf', 'cmp_pc', 'imm', 'wb', 'rf'); if (op === 'jalr') add('imem_rf', 'rf_alu_a'); }
  else if (e.f === 'U') add('dec_imm', 'imm_wb', 'wb_rf', 'imm', 'wb', 'rf');
  return { w, b };
}
function drawDP() {
  if (!cv) return; const rr = cv.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); const w = Math.max(300, rr.width || 620), h = w * 430 / 1000;
  cv.width = Math.round(w * d); cv.height = Math.round(h * d); const c = cv.getContext('2d'); const k = w / 1000; c.setTransform(d * k, 0, 0, d * k, 0, 0); c.clearRect(0, 0, 1000, 430);
  const C = CORES[coreKey]; const has = { mul: !!C.ext.M, ai: !!(C.ext.MAC || C.ext.DOT4) }; const run = M && M.last && !M.err ? M.last : null; const A = activeOf(run);
  c.lineCap = 'round'; c.lineJoin = 'round';
  Object.entries(W).forEach(([n, pts]) => {
    if ((n.includes('mul') && !has.mul) || (n.includes('ai') && n !== 'alu_wb' && !has.ai)) return;
    const on = A.w.includes(n); c.strokeStyle = on ? T.copper : T.line; c.lineWidth = on ? 3.2 : 1.6; c.setLineDash(on && !RM ? [9, 6] : []); c.lineDashOffset = -dash;
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.setLineDash([]);
    const end = pts[pts.length - 1], pre = pts[pts.length - 2]; const ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]); c.fillStyle = on ? T.copper : T.line; c.beginPath(); c.moveTo(end[0], end[1]); c.lineTo(end[0] - 8 * Math.cos(ang - 0.45), end[1] - 8 * Math.sin(ang - 0.45)); c.lineTo(end[0] - 8 * Math.cos(ang + 0.45), end[1] - 8 * Math.sin(ang + 0.45)); c.closePath(); c.fill();
  });
  Object.entries(B).forEach(([n, b]) => {
    if (n === 'mul' && !has.mul) return; if (n === 'ai' && !has.ai) return; const [x, y, bw, bh, lab] = b; const on = A.b.includes(n);
    const vi = n === 'ai' || (n === 'alu' && aluFn()); c.fillStyle = on ? (vi ? T.violet : T.copper) : T.panel; c.strokeStyle = on ? (vi ? T.violet : T.copper) : (n === 'alu' && aluFn() ? T.violet : T.muted); c.lineWidth = 1.6;
    c.beginPath(); if (n === 'alu') { c.moveTo(x, y); c.lineTo(x + bw, y + 28); c.lineTo(x + bw, y + bh - 28); c.lineTo(x, y + bh); c.lineTo(x, y + bh * 0.62); c.lineTo(x + 14, y + bh / 2); c.lineTo(x, y + bh * 0.38); c.closePath(); } else if (c.roundRect) c.roundRect(x, y, bw, bh, 6); else c.rect(x, y, bw, bh);
    c.globalAlpha = on ? 0.2 : 1; c.fill(); c.globalAlpha = 1; c.stroke();
    c.fillStyle = T.ink; c.font = '600 13px "IBM Plex Sans",system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = (n === 'ai' ? (C.ext.DOT4 ? 'AI unit: DOT4' : 'AI unit: MAC') : n === 'alu' && aluFn() ? 'Your\nALU' : lab).split('\n'); lines.forEach((t, i) => c.fillText(t, x + bw / 2 + (n === 'alu' ? 6 : 0), y + bh / 2 + (i - (lines.length - 1) / 2) * 16));
  });
  c.font = '500 12px "IBM Plex Mono",ui-monospace,monospace'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const lbl = (t, x, y, col) => { c.fillStyle = T.bg; const tw = c.measureText(t).width; c.fillRect(x - 3, y - 12, tw + 6, 16); c.fillStyle = col || T.ink; c.fillText(t, x, y); };
  if (run) {
    const e = run.e; lbl('pc 0x' + run.pc.toString(16), 94, 248);
    if (e.rs1 !== undefined && A.w.some(v => v.startsWith('rf_'))) lbl('rs1 ' + RV.ABI[e.rs1] + '=' + run.a, 396, 178, T.violet);
    if (e.rs2 !== undefined && ['rf_alu_b', 'rf_dmem', 'rf_cmp', 'rf_mul', 'rf_ai'].some(v => A.w.includes(v))) lbl('rs2 ' + RV.ABI[e.rs2] + '=' + run.b, 396, (A.w.includes('rf_dmem') ? 272 : 222), T.violet);
    if (e.imm !== undefined && A.w.includes('dec_imm')) lbl('imm ' + e.imm, 330, 392, T.gold);
    if (run.memA !== null && run.memA !== undefined) lbl((run.act.mem === 'w' ? 'store ' : 'load ') + '@0x' + (run.memA >>> 0).toString(16), 596, 152, T.oxide);
    if (run.rd !== null && run.rd !== undefined) lbl('write ' + RV.ABI[run.rd] + ' = ' + run.val, 560, 418, T.copper);
    if (e.f === 'B') lbl(run.act.taken ? 'taken → 0x' + run.next.toString(16) : 'not taken', 548, 104, run.act.taken ? T.copper : T.muted);
  }
  c.fillStyle = T.muted; c.textAlign = 'right'; c.fillText(C.t + (run ? ' · ' + run.e.op : ''), 990, 20);
  if (M && M.halted && !M.err && M.steps) { c.fillStyle = T.good; c.fillText('finished: ' + M.steps + ' instructions, ' + M.cycles + ' cycles', 990, 40); }
}

/* ---- tests and scoring ---- */
function runTests() {
  stopPlay(); compile();
  if (asm.errs.length) { $('#rvResults').innerHTML = '<div class="verdict lose"><div><h3>Fix the errors first</h3><p class="small muted">The assembler found ' + asm.errs.length + ' problem' + (asm.errs.length > 1 ? 's' : '') + ' in your code.</p></div></div>'; return; }
  const R = runProg(L, ta.value, coreKey, aluFn());
  if (R.errs) { $('#rvResults').innerHTML = '<div class="verdict lose"><div><h3>The program crashed</h3><p class="small">' + esc((R.errs[0].l ? 'Line ' + R.errs[0].l + ': ' : '') + R.errs[0].m) + '</p>' + aluBlame() + '</div></div>'; return; }
  lastRun = R; const C = CORES[coreKey]; const allOk = R.res.every(x => x.ok);
  if (allOk && aluFn() && L.id) stampChip('cpu'); let stars = 0, why = '', extra = '';
  const speed = BASE[L.id] ? BASE[L.id] / R.us : null;
  if (L.id && allOk) {
    if (L.id === 6) { if (speed >= 2 && C.area <= 180) stars = speed >= 3 ? (C.area <= 150 ? 3 : 2) : 1; else why = speed < 2 ? 'Correct, but only ' + speed.toFixed(2) + '× faster than RV32IM. The goal is 2×.' : 'Correct, but the core uses ' + C.area + ' area units; the budget is 180.'; }
    else if (L.id === 7) { stars = 1; if (speed >= 2) stars = 2; if (speed >= 3 && C.area <= 150) stars = 3; }
    else { stars = 1; if (R.max <= L.stars[0]) stars = 2; if (R.max <= L.stars[1]) stars = 3; }
  }
  if (L.id && stars > (S.stars[L.id] || 0)) { S.stars[L.id] = stars; save(); document.dispatchEvent(new CustomEvent('osl:progress')); }
  if (stars > 0) {
    if (L.id === 4) extra = 'Level 5 uses the M extension: mul does in one cycle what your loop needed ' + R.max + ' cycles for.';
    if (L.id === 6) extra = speed >= 3 && C.area <= 150 ? 'You found the best design: DOT4 alone, without the general multiplier your program no longer needs. That is how AI chips are designed: hardware shaped around one workload.' : 'Try for 3 stars: does your program still need the general multiplier?';
  }
  const nl = LV.find(x => x.id === L.id + 1);
  const next = stars > 0 && nl ? '<a class="btn primary" href="#riscv-' + nl.id + '">Level ' + nl.id + ': ' + esc(nl.t) + ' →</a>' : '';
  const goalTxt = L.id === 0 || L.perf ? '' : (stars < 3 && allOk ? ' For ' + (stars === 1 ? '2 stars, get to ' + L.stars[0] : '3 stars, get to ' + L.stars[1]) + ' cycles or fewer.' : '');
  const yours = aluFn() ? '<p class="small">Your gates did ' + R.ops.toLocaleString('en-US') + ' ALU operations in these tests, each one rippling through 32 copies of your slice.</p>' : '';
  const tests = R.res.map((x, i) => '<div>' + (x.ok ? '<span class="pill ok">Pass</span>' : '<span class="pill bad">Fail</span>') + '<span>Test ' + (i + 1) + (L.tests.length > 1 ? (i === 0 ? ' (the one you can step through)' : ' (hidden)') : '') + ': ' + (x.ok ? x.cyc + ' cycles' : esc(x.msg)) + '</span></div>').join('');
  $('#rvResults').innerHTML = '<div class="verdict ' + (stars > 0 ? 'win' : L.id === 0 && allOk ? '' : 'lose') + '"><div style="display:grid;gap:4px"><h3>' + (L.id === 0 ? 'Ran on every test' : stars > 0 ? ['', 'Solved', 'Solved well', 'Solved brilliantly'][stars] : allOk ? 'Correct, but not there yet' : 'Not yet') + '</h3><p class="small">' + (why || (allOk ? 'All ' + R.res.length + ' test' + (R.res.length > 1 ? 's' : '') + ' pass.' + goalTxt : 'Some tests fail. Step through test 1 to watch what happens.')) + '</p></div>' + (stars ? '<span class="stars" style="font-size:22px">' + starStr(stars) + '</span>' : '') + '</div>' +
    '<div class="stat"><div><span>Worst-case cycles</span><b>' + R.max.toLocaleString('en-US') + '</b></div><div><span>Time at ' + C.mhz + ' MHz</span><b>' + (R.us >= 1 ? R.us.toFixed(2) + ' µs' : (R.us * 1000).toFixed(0) + ' ns') + '</b></div><div><span>Core area</span><b>' + C.area + ' units</b></div>' + (speed ? '<div><span>Speed vs RV32IM</span><b>' + speed.toFixed(2) + '×</b></div>' : '<div><span>Instructions in program</span><b>' + asm.prog.length + '</b></div>') + '</div>' +
    '<div class="rvcard"><div class="tests">' + tests + '</div>' + yours + (allOk ? '' : aluBlame()) + (extra ? '<p class="small">' + esc(extra) + '</p>' : '') + (next ? '<div class="row">' + next + '</div>' : '') + '</div>';
  if (L.id) $('#rvLvStars').innerHTML = starStr(S.stars[L.id] || 0);
  renderLevelBar(); resetMachine();
}

function aluBlame() {
  const { sl, usable } = aluInfo(); if (!usable) return '';
  if (sl.wrong.length) return '<p class="small"><b>Suspect your gates.</b> This core runs on your ALU slice, which is wrong in ' + sl.wrong.length + ' of 64 cases. Switch to the built-in ALU: if the tests pass there, the bug is in the hardware, not the program.</p>';
  if (S.defect) return '<p class="small"><b>Suspect the factory.</b> A defect is planted in one slice of your ALU. Turn it off and run again.</p>';
  return '';
}

/* ---- hints and the AI copilot ---- */
function showHint() {
  const H = L.hints || []; if (hintN < H.length) hintN++; else if (L.sol && hintN === H.length) hintN++;
  let h = H.slice(0, hintN).map((x, i) => '<p class="hint"><b>Hint ' + (i + 1) + '.</b> ' + esc(x) + '</p>').join('');
  if (hintN > H.length && L.sol) h += '<div class="row"><button type="button" class="btn" id="rvBSol">Load a solution (replaces your code)</button></div>';
  $('#rvHints').innerHTML = h; const hb = $('#rvBHint');
  hb.textContent = hintN < H.length ? 'Show another hint' : L.sol && hintN === H.length ? 'I\'m stuck: show a solution' : 'All hints shown';
  hb.disabled = hintN > H.length || (!L.sol && hintN >= H.length);
  const bs = $('#rvBSol'); if (bs) bs.addEventListener('click', () => { ta.value = L.sol; S.code[L.id] = L.sol; save(); compile(); resetMachine(); });
}
let sample = null, copBusy = false;
function copPrompt(mode) {
  const C = CORES[coreKey]; const lr = lastRun ? lastRun.res.map((x, i) => 'Test ' + (i + 1) + ': ' + (x.ok ? 'pass, ' + x.cyc + ' cycles' : 'FAIL: ' + x.msg)).join('\n') : 'Not run yet.';
  return 'You are a friendly RISC-V mentor inside a learning lab for a beginner with basic hardware knowledge. Reply in plain English, under 140 words, no markdown headings.\n' +
    (mode === 'hint' ? 'Give ONE next-step hint toward solving the goal. Do not write the full solution. Point at a specific line or instruction if helpful.' : 'Review the code: is it correct, and how could it use fewer cycles on this core? Mention one concrete improvement. Do not rewrite the whole program.') +
    '\n\nLevel: ' + L.t + '\nGoal: ' + L.goal + '\nCore: ' + C.t + ' (' + C.d + ') Allowed: RV32I base' + (C.ext.M ? ', M extension (mul, div, rem)' : '') + (C.ext.MAC ? ', custom "mac rd, rs1, rs2" meaning rd = rd + rs1*rs2' : '') + (C.ext.DOT4 ? ', custom "dot4 rd, rs1, rs2" meaning rd += sum of four signed int8 products of the bytes of rs1 and rs2' : '') + '. Pseudo-instructions li, mv, j, ble, bgt, beqz, bnez are supported. Every instruction takes 1 cycle except div/rem (32).\nKnown addresses: ' + JSON.stringify(L.syms || {}) + '\n\nStudent code:\n' + ta.value + '\n\nAssembler errors: ' + (asm.errs.length ? asm.errs.map(e => 'line ' + e.l + ': ' + e.m).join('; ') : 'none') + '\nLast test results:\n' + lr;
}
async function ask(mode) {
  if (!sample || copBusy) return; copBusy = true; const out = $('#rvCopOut'); out.hidden = false; out.textContent = 'Thinking…'; $('#rvBCopHint').disabled = true; $('#rvBCopRev').disabled = true;
  try { const r = await sample(copPrompt(mode), { cache: false, modelTier: 'quick', onText: ({ text }) => { out.textContent = text; } }); if (r && r.text) out.textContent = r.text; }
  catch (e) { out.textContent = e && e.code === 'not_granted' ? 'The copilot needs your permission to ask Claude. You can allow it from this page\'s permissions.' : e && e.code === 'rate_limited' ? 'The copilot is busy. Try again in a minute.' : 'The copilot could not answer right now.'; }
  finally { copBusy = false; $('#rvBCopHint').disabled = false; $('#rvBCopRev').disabled = false; }
}

export function init() {
  if (!$('#riscv')) return;
  T = tok(); ta = $('#rvCode'); gut = $('#rvGut'); cv = $('#rvDp');
  BASE = { 6: runProg(LV[4], LV[4].sol, 'im').us, 7: runProg(LV[6], LV[6].base, 'im').us };
  ta.addEventListener('input', () => { S.code[L.id] = ta.value; save(); compile(); resetMachine(); });
  ta.addEventListener('scroll', () => { gut.scrollTop = ta.scrollTop; });
  ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); } if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runTests(); } });
  $('#rvBStep').addEventListener('click', () => { if (!M || M.halted) resetMachine(); stepOnce(); renderState(); });
  $('#rvBReset').addEventListener('click', resetMachine);
  $('#rvBResetCode').addEventListener('click', () => { delete S.code[L.id]; save(); ta.value = L.start; compile(); resetMachine(); });
  $('#rvBPlay').addEventListener('click', () => { if (playT) { stopPlay(); return; } if (!M || M.halted) resetMachine(); if (!M) return; $('#rvBPlay').textContent = 'Pause'; const sp = +$('#rvSpd').value; playT = setInterval(() => { const k = Math.max(1, Math.round(sp / 20)); for (let i = 0; i < k; i++) if (!stepOnce()) break; dash = (dash + 3) % 30; renderState(); if (!M || M.halted) stopPlay(); }, Math.max(16, 1000 / Math.min(sp, 20))); });
  $('#rvBRun').addEventListener('click', runTests);
  $('#rvAluSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.alu = b.dataset.a; save(); aluChanged(); });
  $('#rvAluEdit').addEventListener('click', openSliceInStudio);
  $('#rvDef').addEventListener('change', e => { S.defect = e.target.checked; save(); aluChanged(); });
  document.addEventListener('osl:alu', () => { if (S.alu === 'mine') aluChanged(); else renderAlu(); });
  document.addEventListener('click', e => { if (e.target.closest('[data-use-alu]')) { S.alu = 'mine'; save(); aluChanged(); } });
  $('#rvBHint').addEventListener('click', showHint);
  $('#rvBCopHint').addEventListener('click', () => ask('hint')); $('#rvBCopRev').addEventListener('click', () => ask('review'));
  new ResizeObserver(() => { if (L) drawDP(); }).observe(cv);
  const onTheme = () => { T = tok(); if (L) drawDP(); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme); new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  (async () => { try { if (window.claude && typeof window.claude.use === 'function') sample = await window.claude.use('sample'); } catch (e) { sample = null; }
    if (sample) { $('#rvBCopHint').hidden = false; $('#rvBCopRev').hidden = false; $('#rvCopNote').textContent = 'The copilot is Claude. It sees this level\'s goal, your code and your last test result. Its answers can be wrong, so run the tests to check.'; }
    else $('#rvCopNote').textContent = 'The AI copilot is available when this lab is opened inside Claude.'; })();
  renderAlu();
  openLevel(1);
}
