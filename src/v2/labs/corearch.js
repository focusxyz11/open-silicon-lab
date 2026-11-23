/* Change your core (kind 'corearch', at the Lab, from the RISC-V core of the community's computer; #321): three real
   choices of a RISC-V core (a multiplier: none, slow or fast; one arithmetic unit or two; 32 registers or 16), and what
   each buys on the puzzles' programs against what it costs in area and energy, checked by src/engines/corearch.js.

   The picture is the core as a floor plan, every part's area to scale (the plain core and the area allowed outlined
   beside it), lit where the running program is working, and beside it the program's run cycle by cycle: with two
   units, two instructions issued in one cycle side by side; a slow multiply a long bar of 32 cycles. The programs'
   cycles, plain against yours, stand in the side panel. Won when the core is at least twice as fast in at most 1.4
   times the area, for no more energy: no single change reaches it.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as CA from '../../engines/corearch.js';

const STEP_MS = 420;          /* one cycle of the picture's run */
const phone = () => typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches;
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAXA = CA.measure({ mul: 'fast', alus: 2, regs: 32 }).area;
const fx2 = v => (v >= 10 ? v.toFixed(0) : v.toFixed(2)) + '×';

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.ca || (view.ca = { cfg: Object.assign({}, CA.PLAIN), prog: 'sum', k: 0, play: false, t0: 0, tried: 0 });

  /* ---- the floor plan: every part's area to scale, the plain core and the area allowed outlined ---- */
  function plan(c, cur, G) {
    const A = CA.area(c), base = CA.area(CA.PLAIN).total, k = (G.s * G.s) / MAXA, side = a => Math.sqrt(a * k);
    const D = side(A.total), x0 = G.x, y1 = G.y + G.s, P = A.parts;
    let h = '';
    /* the outlines: the area allowed (the goal), and the plain core */
    const budget = side(base * CA.GOAL.area), plain = side(base);
    h += '<rect class="cabudget" x="' + x0 + '" y="' + (y1 - budget).toFixed(1) + '" width="' + budget.toFixed(1) + '" height="' + budget.toFixed(1) + '" rx="4"/>' +
      '<text class="cak" x="' + (x0 + budget - 4).toFixed(1) + '" y="' + (y1 - budget - 5).toFixed(1) + '" text-anchor="end">' + esc(t('carch.fig.allowed')) + '</text>';
    /* the die */
    const busy = { alu1: !!cur, alu2: !!(cur && cur.with), mul: !!(cur && cur.mul), regs: !!cur, rest: !!cur };
    const wl = D * P.regs / A.total, xr = x0 + wl, wr = D - wl, rest = A.total - P.regs;
    h += '<rect class="cadie" x="' + x0 + '" y="' + (y1 - D).toFixed(1) + '" width="' + D.toFixed(1) + '" height="' + D.toFixed(1) + '" rx="3"/>';
    /* the registers: one row each */
    h += '<rect class="capart regs' + (busy.regs ? ' on' : '') + '" x="' + x0 + '" y="' + (y1 - D).toFixed(1) + '" width="' + wl.toFixed(1) + '" height="' + D.toFixed(1) + '"/>';
    for (let i = 1; i < c.regs; i++) { const yy = y1 - D + D * i / c.regs; h += '<path class="caline" d="M' + (x0 + 3) + ' ' + yy.toFixed(1) + 'h' + (wl - 6).toFixed(1) + '"/>'; }
    const fits = (txt, w) => txt.length * 6.2 <= w - 8;
    if (fits(t('carch.blk.regs', { n: c.regs }), wl)) h += '<text class="canm" x="' + (x0 + wl / 2).toFixed(1) + '" y="' + (y1 - D / 2).toFixed(1) + '" text-anchor="middle">' + esc(t('carch.blk.regs', { n: c.regs })) + '</text>';
    /* the rest stacked beside: the units, the multiplier, the control */
    const blocks = [['alu1', CA.PARTS.alu]].concat(c.alus > 1 ? [['alu2', CA.PARTS.alu]] : [], c.mul !== 'none' ? [['mul', P.mul]] : [], [['rest', P.rest]]);
    let yy = y1 - D;
    for (const [id, a] of blocks) {
      const hh = D * a / rest, on = busy[id];
      h += '<rect class="capart ' + id.replace(/\d/, '') + (id === 'mul' ? ' ' + c.mul : '') + (on ? ' on' : '') + '" x="' + xr.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + wr.toFixed(1) + '" height="' + hh.toFixed(1) + '"/>';
      if (id.startsWith('alu')) for (let i = 1; i < 32; i += 1) { const sy = yy + hh * i / 32; if (hh > 40 || i % 4 === 0) h += '<path class="caline" d="M' + (xr + 3) + ' ' + sy.toFixed(1) + 'h' + (wr - 6).toFixed(1) + '"/>'; }
      if (id === 'mul' && c.mul === 'fast') { const n = 12; for (let i = 1; i < n; i++) h += '<path class="caline" d="M' + (xr + wr * i / n).toFixed(1) + ' ' + (yy + 2).toFixed(1) + 'v' + (hh - 4).toFixed(1) + 'M' + (xr + 2).toFixed(1) + ' ' + (yy + hh * i / n).toFixed(1) + 'h' + (wr - 4).toFixed(1) + '"/>'; }
      const nm = t('carch.blk.' + (id.startsWith('alu') ? 'alu' : id === 'mul' ? 'mul.' + c.mul : id));
      if (hh >= 13 && fits(nm, wr)) h += '<text class="canm" x="' + (xr + wr / 2).toFixed(1) + '" y="' + (yy + hh / 2 + 3.5).toFixed(1) + '" text-anchor="middle">' + esc(nm) + '</text>';
      yy += hh;
    }
    h += '<rect class="caplain" x="' + x0 + '" y="' + (y1 - plain).toFixed(1) + '" width="' + plain.toFixed(1) + '" height="' + plain.toFixed(1) + '" rx="3"/>' +
      '<text class="cak plain" x="' + (x0 + 4) + '" y="' + (y1 + 13) + '">' + esc(t('carch.fig.plain')) + '</text>';
    return h;
  }
  /* ---- the run, cycle by cycle: one or two instructions a cycle, a slow multiply a long bar ---- */
  function run(c, R, k, G) {
    const rows = G.rows, first = Math.max(0, Math.min(k - Math.floor(rows / 2), R.steps.length - rows)), two = c.alus > 1;
    const cc = G.narrow ? 32 : 46, cw = two ? (G.w - cc) / 2 : G.w - cc, x0 = G.x + cc;
    let cyc = 0; for (let i = 0; i < first; i++) cyc += R.steps[i].cyc;
    let h = '<text class="cak" x="' + G.x + '" y="' + (G.y - 8) + '">' + esc(t('carch.fig.cycle')) + '</text><text class="cak" x="' + x0 + '" y="' + (G.y - 8) + '">' + esc(t('carch.fig.unit', { n: 1 })) + '</text>' +
      (two ? '<text class="cak" x="' + (x0 + cw + 6) + '" y="' + (G.y - 8) + '">' + esc(t('carch.fig.unit', { n: 2 })) + '</text>' : '');
    const slot = (x, s, on, w) => '<rect class="caslot' + (s.mul ? ' mul' : s.mem ? ' mem' : '') + (on ? ' on' : '') + '" x="' + x.toFixed(1) + '" y="0" width="' + (w - 6).toFixed(1) + '" height="' + (G.rh - 4) + '" rx="4"/><text class="caop" x="' + (x + 8).toFixed(1) + '" y="' + (G.rh / 2 + 2) + '">' + esc(s.op) + '</text>' +
      (G.narrow ? '' : '<text class="caln" x="' + (x + w - 12).toFixed(1) + '" y="' + (G.rh / 2 + 2) + '" text-anchor="end">' + esc(t('carch.fig.line', { n: s.l })) + '</text>');
    R.steps.slice(first, first + rows).forEach((s, i) => {
      const n = first + i, on = n === k, y = G.y + i * G.rh;
      h += '<g transform="translate(0 ' + y.toFixed(1) + ')"' + (n > k ? ' class="cafut"' : '') + '><text class="cacyc' + (on ? ' on' : '') + '" x="' + G.x + '" y="' + (G.rh / 2 + 2) + '">' + (cyc + 1) + (s.cyc > 1 ? '–' + (cyc + s.cyc) : '') + '</text>' +
        slot(x0, s, on, cw) + (s.with ? slot(x0 + cw, s.with, on, cw) : '') + '</g>';
      cyc += s.cyc;
    });
    return h;
  }
  function figure(s) {
    const c = s.cfg, R = CA.issueOf(s.prog, c), k = Math.min(s.k, R.steps.length - 1), cur = R.steps[k], narrow = phone();
    const W = narrow ? 360 : 640, H = narrow ? 262 : 360;
    const GP = narrow ? { x: 8, y: 14, s: 214 } : { x: 16, y: 26, s: 300 }, GR = narrow ? { x: 234, y: 30, w: 122, rows: 9, rh: 22, narrow: true } : { x: 352, y: 46, w: 280, rows: 14, rh: 21 };
    let h = '<svg class="casvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('carch.aria')) + '">' + plan(c, cur, GP) + run(c, R, k, GR);
    /* on a phone the parts are too small to name: a key under the picture */
    if (narrow) { let x = 10; for (const [cls, nm] of [['alu', t('carch.blk.alu')], ['mul ' + c.mul, t('carch.blk.mul.' + (c.mul === 'none' ? 'slow' : c.mul))], ['regs', t('carch.blk.regs', { n: c.regs })]]) {
      if (cls.startsWith('mul') && c.mul === 'none') continue;
      h += '<rect class="capart ' + cls + '" x="' + x + '" y="' + (H - 16) + '" width="11" height="11" rx="2"/><text class="cak" x="' + (x + 16) + '" y="' + (H - 7) + '">' + esc(nm) + '</text>'; x += 30 + nm.length * 5.6; } }
    h += '</svg>';
    return '<figure class="cafig" data-f2="instrument"><div class="dphead"><span class="dpwho">' + esc(t('carch.fig.k')) + '</span><span class="small muted">' + esc(t('carch.fig.prog', { p: t('rv.p.' + s.prog + '.t') })) + '</span></div>' + h + '<figcaption class="small muted">' + esc(t('carch.fig.cap')) + '</figcaption></figure>';
  }
  function goalbox(s) {
    const G = CA.gauges(s.cfg), ok = CA.met(s.cfg);
    const tgt = { speed: t('carch.t.speed', { v: CA.GOAL.speed }), area: t('carch.t.area', { v: CA.GOAL.area }), energy: t('carch.t.energy', { v: CA.GOAL.energy }) };
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + G.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('carch.g.' + g.k)) + '</span><span class="gv">' + esc(fx2(g.v)) + ' <span class="muted">' + esc(tgt[g.k]) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const seg = (k, opts, cur) => '<div class="caseg" role="group" aria-label="' + esc(t('carch.dial.' + k)) + '"><span class="small"><b>' + esc(t('carch.dial.' + k)) + '</b></span><span class="chips">' + opts.map(v => '<button type="button" class="chipb" data-ca-' + k + '="' + v + '" aria-pressed="' + (cur === v) + '">' + esc(t('carch.' + k + '.' + v)) + '</button>').join('') + '</span><span class="small muted">' + esc(t('carch.' + k + '.' + cur + '.d')) + '</span></div>';
  /* the programs' cycles, the plain core's against yours */
  function bars(r) {
    const W = 300, rh = 30, H = 10 + r.perProg.length * rh, max = Math.max(...r.perProg.map(p => Math.max(p.base, p.cycles))), x0 = 82, bw = W - x0 - 46, sc = v => Math.max(1.5, bw * v / max);
    let h = '<figure class="cabars"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('carch.bars.aria')) + '">';
    r.perProg.forEach((p, i) => { const y = 6 + i * rh;
      h += '<text class="cak" x="0" y="' + (y + 13) + '">' + esc(t('rv.p.' + p.id + '.t')) + '</text>' +
        '<rect class="cab plain" x="' + x0 + '" y="' + y + '" width="' + sc(p.base).toFixed(1) + '" height="9" rx="2"/><text class="cav" x="' + (x0 + sc(p.base) + 4).toFixed(1) + '" y="' + (y + 8) + '">' + p.base + '</text>' +
        '<rect class="cab you' + (p.cycles < p.base ? ' good' : p.cycles > p.base ? ' bad' : '') + '" x="' + x0 + '" y="' + (y + 12) + '" width="' + sc(p.cycles).toFixed(1) + '" height="9" rx="2"/><text class="cav" x="' + (x0 + sc(p.cycles) + 4).toFixed(1) + '" y="' + (y + 20) + '">' + p.cycles + '</text>'; });
    return h + '</svg><figcaption class="small muted"><i class="k plain"></i>' + esc(t('carch.bars.plain')) + ' <i class="k you"></i>' + esc(t('carch.bars.you')) + '</figcaption></figure>';
  }
  /* what this core is, in one line: the first thing that keeps it from the goal, or the win */
  function verdict(s) {
    const r = CA.compare(s.cfg), G = CA.gauges(s.cfg), bad = G.filter(g => !g.ok).map(g => g.k), c = s.cfg;
    if (!bad.length) return '<p class="small good camsg">' + esc(t('carch.v.won')) + '</p>';
    if (CA.same(c, CA.PLAIN)) return '<p class="small muted camsg">' + esc(t('carch.v.plain')) + '</p>';
    const key = bad.includes('speed') && bad.includes('area') ? 'both' : bad.includes('area') ? (r.speed >= CA.GOAL.speed ? 'big' : 'bigslow') : bad.includes('speed') ? 'slow' : 'energy';
    return '<p class="small camsg">' + esc(t('carch.v.' + key, { s: fx2(r.speed), a: fx2(r.areaX), e: fx2(r.energyX) })) + '</p>';
  }
  function card() {
    const s = st(), r = CA.compare(s.cfg);
    let h = head() + '<p class="small rvintro">' + esc(t('carch.intro')) + '</p>' + goalbox(s) + figure(s);
    h += '<div class="cadials">' + seg('mul', CA.MUL, s.cfg.mul) + seg('alus', CA.ALUS, s.cfg.alus) + seg('regs', CA.REGS, s.cfg.regs) + '</div>' + verdict(s);
    h += '<p class="kicker">' + esc(t('carch.watch')) + '</p><div class="chips">' + CA.PROGRAMS.map(p => '<button type="button" class="chipb" data-ca-prog="' + p.id + '" aria-pressed="' + (s.prog === p.id) + '">' + esc(t('rv.p.' + p.id + '.t')) + '</button>').join('') +
      '<button type="button" class="chipb" data-ca-play>' + esc(t(s.play ? 'rv.pause' : 'rv.play')) + '</button></div>';
    h += bars(r);
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('carch.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('carch.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('carch.note')) + '</p>' + doneNote() + reward();
  }
  function loop(now) {
    const s = st(); if (!s.play || !el.isConnected) { s.play = false; return; }
    const R = CA.issueOf(s.prog, s.cfg), cur = R.steps[Math.min(s.k, R.steps.length - 1)], dur = STEP_MS * Math.min(4, cur ? cur.cyc : 1);
    if (!s.t0) s.t0 = now;
    if (now - s.t0 >= dur) { s.t0 = now; if (s.k >= R.steps.length - 1) { s.play = false; draw(); return; } s.k++; draw(); }
    requestAnimationFrame(loop);
  }
  const set = (k, v) => { const s = st(); s.cfg = CA.normal(Object.assign({}, s.cfg, { [k]: v })); s.k = 0; s.tried++; if (CA.met(s.cfg)) win(); draw(); fx(); };
  return {
    draw: card,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const m = q('[data-ca-mul]'); if (m) { set('mul', m.dataset.caMul); return true; }
      const a = q('[data-ca-alus]'); if (a) { set('alus', +a.dataset.caAlus); return true; }
      const r = q('[data-ca-regs]'); if (r) { set('regs', +r.dataset.caRegs); return true; }
      const p = q('[data-ca-prog]'); if (p) { s.prog = p.dataset.caProg; s.k = 0; draw(); return true; }
      if (q('[data-ca-play]')) { if (still()) { s.k = CA.issueOf(s.prog, s.cfg).steps.length - 1; draw(); return true; } s.play = !s.play; s.t0 = 0; if (s.play) { if (s.k >= CA.issueOf(s.prog, s.cfg).steps.length - 1) s.k = 0; requestAnimationFrame(loop); } draw(); return true; }
      return false; },
    input() { return false; }
  };
}
