/* The datapath of the community's RISC-V core (#321), drawn from one step of a run (src/engines/rvpuzzles.js checkOn):
   the program with the line the program counter points at, the decoder, the registers, the constant an instruction
   carries (imm), the arithmetic unit drawn as its 32 slices (your slice, copied, bit 0 at the bottom), the memory, and
   the wire that writes the answer back. The instruction is a light that travels along the wires it uses, phase by
   phase: fetched, decoded and its registers read, worked out by the slices (each slice's answer bit lit), memory, and
   written back; a branch that jumps lights the wire back to the program. Words are drawn in this flat figure only,
   never in a 3D scene.

   dpSvg(o, L) returns the figure's SVG; dpAnimate(svg, u) moves the light to u (0..1) of its way, without drawing
   anew. Two layouts: wide for the stage, narrow (a phone) with the program as one line on top. Words: rv.dp.*. */
const WIDE = {
  vb: [640, 364],
  prog: [8, 26, 152, 314], dec: [180, 26, 104, 60], imm: [180, 286, 104, 28], regs: [300, 104, 104, 184], mem: [556, 190, 76, 96],
  alu: [[470, 110], [540, 150], [540, 270], [470, 310], [470, 226], [482, 210], [470, 194]], aluX: [470, 540], aluY: [122, 298], A: 160, B: 270, Y: 210,
  w: {
    sel: [[284, 50], [352, 50], [352, 104]],
    immd: [[232, 86], [232, 286]],
    A: [[404, 160], [470, 160]],
    B: [[404, 250], [450, 250], [450, 270], [470, 270]],
    immB: [[284, 300], [450, 300], [450, 270]],
    addr: [[540, 210], [556, 210]],
    wbA: [[540, 210], [548, 210], [548, 86]],
    wbM: [[594, 190], [594, 86]],
    wb: [[594, 86], [380, 86], [380, 104]],
    wbS: [[548, 86], [380, 86], [380, 104]],
    br: [[505, 290], [505, 352], [84, 352], [84, 340]]
  }
};
const NARROW = {
  vb: [360, 262],
  strip: [6, 4, 348, 30], imm: [114, 226, 52, 22], regs: [6, 44, 104, 172], mem: [276, 96, 78, 72],
  alu: [[170, 52], [236, 84], [236, 184], [170, 216], [170, 144], [180, 134], [170, 124]], aluX: [170, 236], aluY: [62, 206], A: 88, B: 184, Y: 134,
  w: {
    sel: [[56, 34], [56, 44]],
    A: [[110, 88], [170, 88]],
    B: [[110, 170], [140, 170], [140, 184], [170, 184]],
    immB: [[140, 226], [140, 184]],
    addr: [[236, 134], [276, 134]],
    wbA: [[236, 134], [250, 134], [250, 252]],
    wbM: [[315, 168], [315, 252]],
    wb: [[315, 252], [58, 252], [58, 216]],
    wbS: [[250, 252], [58, 252], [58, 216]],
    br: [[203, 68], [203, 34]]
  }
};
/* what goes through the slices (shifts and the multiplier have their own hardware): for a run without the slices' record */
const ARITH = /^(add|addi|sub|and|andi|or|ori|xor|xori|slt|slti|sltu|sltiu|beq|bne|blt|bge|bltu|bgeu|lw|lh|lb|lhu|lbu|sw|sh|sb)$/;
/* which wires an instruction uses, phase by phase: 1 fetch and read, 2 work out, 3 memory, 4 write back */
export function wiresOf(s) {
  if (!s) return [];
  const f = s.f, op = s.op, W = [];
  if (f === 'R') W.push(['A', 1], ['B', 1]);
  else if (f === 'I') W.push(['A', 1], ['immd', 1], ['immB', 1]);
  else if (f === 'S') W.push(['A', 1], ['immd', 1], ['immB', 1], ['B', 1]);
  else if (f === 'B') W.push(['A', 1], ['B', 1]);
  else if (f === 'U') W.push(['immd', 1], ['immB', 1]);
  if (s.mem) W.push(['addr', 3]);
  if (f === 'B' || f === 'J' || op === 'jalr') { if (s.taken) W.push(['br', 2]); }
  if (s.rd != null && s.rd !== 0 && f !== 'S' && f !== 'B') { if (s.mem === 'r') W.push(['wbM', 4], ['wb', 4]); else W.push(['wbA', 4], ['wbS', 4]); }
  return W;
}
/* the light's way: the wires in order, each with its phase */
function routeOf(G, s, fetch) {
  const R = [], W = Object.fromEntries(wiresOf(s));
  if (fetch) R.push([0, fetch]);
  R.push([1, G.w.sel]);
  if (W.A) R.push([1, G.w.A]); else if (W.immB) R.push([1, G.w.immB]);
  /* through the slices, from the inputs to the answer */
  R.push([2, [[G.aluX[0] + 4, W.A ? G.A : G.B], [G.aluX[1], G.Y]]]);
  if (W.addr) R.push([3, G.w.addr, G.mem ? [[G.mem[0] + G.mem[2] / 2, G.Y]] : []]);
  if (W.wbM) R.push([4, G.w.wbM.concat(G.w.wb.slice(1))]);
  else if (W.wbA) R.push([4, G.w.wbA.concat(G.w.wbS.slice(1))]);
  else if (W.br) R.push([4, G.w.br]);
  return R.map(([ph, a, b]) => [ph, b ? a.concat(b) : a]);
}
const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const path = a => 'M' + a.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
const num = v => (v == null ? '' : String(v));
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/* o: { lines (the program), step (one step of the run, or null), refX (the reference core's registers at that step),
   fault (the fault, from its step on), show (register names), narrow (a phone), abi (the register names by number),
   uid (for the clip path), aria } */
export function dpSvg(o, L) {
  const { esc, t } = L, G = o.narrow ? NARROW : WIDE, s = o.step, [VW, VH] = G.vb, uid = o.uid || 'dp';
  const W = Object.fromEntries(wiresOf(s)), lines = o.lines || [], cl = s ? s.l - 1 : -1, ABI = o.abi;
  const fault = o.fault || null, rx = o.refX || null;
  let h = '<svg class="dpsvg' + (o.narrow ? ' narrow' : '') + '" viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="' + esc(o.aria || '') + '">';
  h += '<defs><clipPath id="' + uid + '-c"><polygon points="' + pts(G.alu) + '"/></clipPath><marker id="' + uid + '-m" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L8 4L0 8z" class="dparrow"/></marker></defs>';
  /* the wires, each lit when this instruction uses it, in its phase */
  let fetch = null;
  if (!o.narrow) {
    const first = Math.max(0, Math.min(cl - 9, lines.length - 20)), ly = cl >= 0 ? 44 + (cl - first) * 15 - 4 : 56;
    fetch = [[160, ly], [170, ly], [170, 56], [180, 56]];
    h += '<path class="dpw' + (s ? ' on ph0' : '') + '" d="' + path(fetch) + '" marker-end="url(#' + uid + '-m)"/>';
    o._first = first;
  }
  for (const k of Object.keys(G.w)) {
    /* the answer from the slices joins the wire back on its way: drawn over it only while it is lit */
    if (k === 'wbS' && W.wbS == null) continue;
    const on = W[k] != null || (k === 'sel' && !!s), ph = k === 'sel' ? 1 : W[k];
    h += '<path class="dpw w-' + k + (on ? ' on ph' + ph : '') + '" d="' + path(G.w[k]) + '"' + (k === 'br' || k === 'wb' || k === 'A' || k === 'immd' || k === 'addr' || k === 'sel' ? ' marker-end="url(#' + uid + '-m)"' : '') + '/>';
  }
  /* the program, or on a phone its line */
  if (o.narrow) {
    const [x, y, w, hh] = G.strip;
    h += '<rect class="dpbox" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="7"/>' +
      '<text class="dpk" x="' + (x + 10) + '" y="' + (y + 19) + '">' + esc(s ? t('rv.dp.line', { n: s.l }) : t('rv.dp.prog')) + '</text>' +
      '<text class="dpcode on" x="' + (x + 62) + '" y="' + (y + 20) + '">' + esc(s ? clip(String(lines[cl] || '').trim(), 30) : '') + '</text>' +
      (s && s.taken ? '<text class="dpk jump" x="' + (x + w - 10) + '" y="' + (y + 19) + '" text-anchor="end">' + esc(t('rv.jump')) + '</text>' : '');
  } else {
    const [x, y, w, hh] = G.prog, first = o._first;
    h += '<text class="dpk" x="' + x + '" y="' + (y - 8) + '">' + esc(t('rv.dp.prog')) + '</text><text class="dpk pc" x="' + (x + w) + '" y="' + (y - 8) + '" text-anchor="end">' + esc(t('rv.dp.pc', { n: s ? s.pc : 0 })) + '</text>';
    h += '<rect class="dpbox prog" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="8"/>';
    lines.slice(first, first + 20).forEach((ln, i) => { const n = first + i, yy = 44 + i * 15, on = n === cl, bad = fault && fault.l === n + 1;
      if (on || bad) h += '<rect class="dpon' + (bad ? ' bad' : '') + '" x="' + (x + 3) + '" y="' + (yy - 11) + '" width="' + (w - 6) + '" height="14.5" rx="3"/>';
      h += '<text class="dpcode' + (on ? ' on' : '') + (ln.trim().startsWith('#') ? ' cm' : '') + '" x="' + (x + 8) + '" y="' + yy + '">' + esc(clip(ln.replace(/\t/g, '  '), 23)) + '</text>'; });
  }
  /* the decoder: the instruction, and the registers it names */
  if (!o.narrow) {
    const [x, y, w, hh] = G.dec, rn = r => (r == null ? '' : ABI[r]), args = s ? (s.f === 'S' || s.f === 'B' ? [rn(s.rs1), rn(s.rs2)] : [rn(s.rs1), s.f === 'R' ? rn(s.rs2) : null].filter(Boolean)) : [];
    h += '<rect class="dpbox' + (s ? ' on' : '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="7"/><text class="dpk" x="' + (x + 8) + '" y="' + (y + 14) + '">' + esc(t('rv.dp.dec')) + '</text>' +
      '<text class="dpop" x="' + (x + w / 2) + '" y="' + (y + 36) + '" text-anchor="middle">' + esc(s ? s.op : '·') + '</text>' +
      '<text class="dpf" x="' + (x + w / 2) + '" y="' + (y + 52) + '" text-anchor="middle">' + esc(s ? (s.rd != null && s.f !== 'S' && s.f !== 'B' ? rn(s.rd) + ' ← ' : '') + args.join(', ') : '') + '</text>';
  }
  /* the constant an instruction carries */
  { const [x, y, w, hh] = G.imm, on = W.immd != null || W.immB != null;
    h += '<rect class="dpbox' + (on ? ' on ph1' : '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="6"/>' + (o.narrow ? '' : '<text class="dpk" x="' + (x + 8) + '" y="' + (y + hh / 2 + 4) + '">' + esc(t('rv.dp.imm')) + '</text>') +
      (on && s.imm != null ? '<text class="dpv ph1" x="' + (o.narrow ? x + w / 2 : x + w - 8) + '" y="' + (y + hh / 2 + 4.5) + '" text-anchor="' + (o.narrow ? 'middle' : 'end') + '">' + esc(num(s.imm)) + '</text>' : o.narrow ? '<text class="dpk" x="' + (x + w / 2) + '" y="' + (y + hh / 2 + 4) + '" text-anchor="middle">' + esc(t('rv.dp.imm')) + '</text>' : ''); }
  /* the registers: those read lit, the one written lit warm, one that differs from the reference core marked */
  { const [x, y, w, hh] = G.regs, show = o.show, step = 20, top = y + (o.narrow ? 6 : 22);
    h += (o.narrow ? '' : '<text class="dpk" x="' + (x + 8) + '" y="' + (y + 14) + '">' + esc(t('rv.dp.regs')) + '</text>') + '<rect class="dpbox regs" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="8" fill-opacity="0"/>';
    show.forEach((n, i) => { const ri = ABI.indexOf(n), yy = top + i * step, rd = s && s.rd === ri && ri > 0 && s.f !== 'S' && s.f !== 'B', rr = s && (s.rs1 === ri || s.rs2 === ri) && ri > 0, v = s ? s.x[ri] : 0, want = rx ? rx[ri] : v, off = rx && want !== v;
      h += '<rect class="dpreg' + (rd ? ' wr ph4' : '') + (rr ? ' rd' : '') + (off ? ' bad' : '') + '" x="' + (x + 5) + '" y="' + yy + '" width="' + (w - 10) + '" height="' + (step - 3) + '" rx="4"/>' +
        '<text class="dpn" x="' + (x + 11) + '" y="' + (yy + step / 2 + 2.5) + '">' + esc(n) + '</text><text class="dpv' + (rd ? ' ph4' : '') + (off ? ' bad' : '') + '" x="' + (x + w - 11) + '" y="' + (yy + step / 2 + 3) + '" text-anchor="end">' + esc(num(v)) + '</text>';
      if (off && !o.narrow) h += '<text class="dpshould" x="' + (x - 5) + '" y="' + (yy + step / 2 + 3) + '" text-anchor="end">' + esc(t('rv.dp.should', { v: want })) + '</text>'; }); }
  /* the arithmetic unit: 32 slices, bit 0 at the bottom, each lit by its answer bit; the slice that answered wrong red */
  { const [x0, x1] = G.aluX, [y0, y1] = G.aluY, dy = (y1 - y0) / 31, a = s && s.alu, mul = s && /^(mul|mulh)$/.test(s.op), used = !!a || !!(s && ARITH.test(s.op));
    const y = a ? a.y : s && s.val != null && used ? s.val : 0, bad = fault && fault.slice ? fault.slice.bit : -1;
    h += '<polygon class="dpalu' + (used || mul ? ' on' : '') + '" points="' + pts(G.alu) + '"/><g clip-path="url(#' + uid + '-c)">';
    for (let i = 0; i < 32; i++) { const yy = y1 - i * dy, bit = (y >>> i) & 1;
      h += '<rect class="dpsl' + (used && bit ? ' one ph2' : '') + (i === bad ? ' bad' : '') + '" x="' + (x0 + 2) + '" y="' + (yy - dy * 0.34).toFixed(2) + '" width="' + (x1 - x0 - 4) + '" height="' + (dy * 0.68).toFixed(2) + '"/>'; }
    h += '<rect class="dprip" x="' + x0 + '" y="' + (y1 + dy / 2).toFixed(1) + '" width="' + (x1 - x0) + '" height="0" data-span="' + (y1 - y0 + dy).toFixed(1) + '"/></g>';
    h += '<text class="dpk" x="' + ((x0 + x1) / 2) + '" y="' + (G.alu[0][1] - (o.narrow ? 5 : 8)) + '" text-anchor="middle">' + esc(t(mul ? 'rv.dp.mul' : 'rv.dp.alu')) + '</text>';
    /* the slice that answered wrong, named on a tag beside it (left of the unit, clear of the memory) */
    if (bad >= 0) { const yy = y1 - bad * dy, xl = x0 - 2, nm = t('rv.dp.slice', { n: bad }), tw = nm.length * 5.8 + 10;
      h += '<path class="dpbadmk" d="M' + xl + ' ' + yy.toFixed(1) + 'h-9"/><rect class="dpbadtag" x="' + (xl - 9 - tw).toFixed(1) + '" y="' + (yy - 7.5).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="15" rx="7.5"/>' +
        '<text class="dpbad" x="' + (xl - 9 - tw / 2).toFixed(1) + '" y="' + (yy + 3.5).toFixed(1) + '" text-anchor="middle">' + esc(nm) + '</text>'; }
    /* what went in and what came out */
    if (s && (used || mul)) {
      const ax = o.narrow ? 140 : 437, A = a ? a.p : s.a, B = a ? a.q : s.f === 'R' || s.f === 'B' ? s.b : s.imm;
      h += '<text class="dpv ph1" x="' + ax + '" y="' + (G.A - 5) + '" text-anchor="middle">' + esc(num(A)) + '</text>';
      if (B != null) h += '<text class="dpv ph1" x="' + (o.narrow ? 125 : 427) + '" y="' + (o.narrow ? 165 : G.B - 26) + '" text-anchor="middle">' + esc(num(B)) + '</text>';
      const out = s.f === 'B' ? t(s.taken ? 'rv.dp.yes' : 'rv.dp.no') : num(a ? a.y : s.val);
      h += '<text class="dpv out ph2' + (fault && fault.alu ? ' bad' : '') + '" x="' + (o.narrow ? x1 + 5 : 553) + '" y="' + (o.narrow ? G.Y - 6 : 184) + '">' + esc(out) + '</text>';
    }
  }
  /* the memory */
  { const [x, y, w, hh] = G.mem, on = !!(s && s.mem), val = s && s.mem === 'r' ? s.val : s && s.mem === 'w' ? s.b : null;
    h += '<rect class="dpbox mem' + (on ? ' on ph3' : '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="7"/><text class="dpk" x="' + (x + 8) + '" y="' + (y + 15) + '">' + esc(t('rv.dp.mem')) + '</text>';
    if (on) h += '<text class="dpf ph3" x="' + (x + w / 2) + '" y="' + (y + hh / 2 + 2) + '" text-anchor="middle">' + esc(t(s.mem === 'r' ? 'rv.dp.read' : 'rv.dp.write', { a: s.memA })) + '</text><text class="dpv big ph3" x="' + (x + w / 2) + '" y="' + (y + hh / 2 + 22) + '" text-anchor="middle">' + esc(num(val)) + '</text>'; }
  /* the answer on its way back, and the wire back to the program when a branch jumps */
  if (s && (W.wbA || W.wbM)) { const p = o.narrow ? [86, 247] : [470, 81]; h += '<text class="dpv ph4' + (rx && s.rd != null && rx[s.rd] !== s.x[s.rd] ? ' bad' : '') + '" x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle">' + esc(num(s.x[s.rd])) + '</text>'; }
  if (s && W.br && !o.narrow) h += '<text class="dpk jump ph4" x="300" y="347" text-anchor="middle">' + esc(t('rv.dp.jump', { n: s.l })) + '</text>';
  /* the light */
  const route = s ? routeOf(G, s, fetch) : [];
  h += '<g class="dptok"' + (s ? '' : ' hidden') + '><circle r="9" class="dphalo"/><circle r="4.2" class="dpdot"/></g>';
  return h.replace('<svg ', '<svg data-route="' + route.map(([ph, a]) => ph + ':' + a.map(p => p[0] + ',' + p[1]).join(';')).join('|') + '" data-ph="9" ') + '</svg>';
}

/* the light at u (0..1) of its way: its place, the phase reached (what the CSS shows lit), and the slices' ripple */
export function dpAnimate(svg, u) {
  if (!svg) return;
  if (svg._rt !== svg.dataset.route) {
    svg._rt = svg.dataset.route;
    const segs = (svg.dataset.route || '').split('|').filter(Boolean).map(s => { const [ph, a] = s.split(':'); return { ph: +ph, p: a.split(';').map(q => q.split(',').map(Number)) }; });
    const flat = []; segs.forEach(sg => { for (let i = 1; i < sg.p.length; i++) flat.push({ ph: sg.ph, a: sg.p[i - 1], b: sg.p[i], len: Math.hypot(sg.p[i][0] - sg.p[i - 1][0], sg.p[i][1] - sg.p[i - 1][1]) }); });
    svg._flat = flat; svg._len = flat.reduce((a, f) => a + f.len, 0);
  }
  const tok = svg.querySelector('.dptok'), rip = svg.querySelector('.dprip'), flat = svg._flat || [];
  if (!flat.length) { svg.dataset.ph = '9'; return; }
  if (u >= 1) { svg.dataset.ph = '9'; if (tok) tok.style.opacity = '0'; if (rip) rip.setAttribute('height', '0'); return; }
  let d = Math.max(0, u) * svg._len, f = flat[0];
  for (const x of flat) { f = x; if (d <= x.len) break; d -= x.len; }
  const k = f.len ? Math.min(1, d / f.len) : 1, x = f.a[0] + (f.b[0] - f.a[0]) * k, y = f.a[1] + (f.b[1] - f.a[1]) * k;
  if (tok) { tok.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); tok.style.opacity = '1'; }
  svg.dataset.ph = String(f.ph);
  /* while the light crosses the slices, the carry ripples up from bit 0 */
  if (rip) { const hh = f.ph === 2 ? (+rip.dataset.span || 0) * k : 0; rip.setAttribute('height', hh.toFixed(1)); rip.setAttribute('transform', 'translate(0 ' + (-hh).toFixed(1) + ')'); }
}
