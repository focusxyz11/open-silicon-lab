/* Run your core (kind 'rv', at the Lab, from the RISC-V core of the community's computer): write small programs for a
   RISC-V core and watch them run, from src/engines/rvpuzzles.js on the lab's simulator (src/engines/riscv.js, the
   first site's RISC-V lab). Run checks the program on every case of the puzzle; won when three puzzles are solved.

   From gates to a computer (#321): every program also runs on the core made of your own ALU slice (the design on your
   bench when it is the slice, else the lab's example), side by side with the reference core (checkOn). The picture is
   that core's datapath (src/v2/labs/datapath.js): each instruction a light moving along the wires it uses, through the
   arithmetic unit drawn as your 32 slices. Turn a gate of your slice and run again: where the two cores part, the
   picture shows the instruction, the wrong value against the right one, and the slice that answered wrong. A machine's
   core (src/v2/machines.js, #/do/rvrun/<need>) opens here on that machine's job (JOBS), a program to watch on it.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as RP from '../../engines/rvpuzzles.js';
import { dpSvg, dpAnimate } from './datapath.js';

const DUR = 1150;            /* one instruction's way through the datapath, in ms */
const FAST = 110;            /* the same, when the run is fast-forwarded */
const OPS = { '&': 'and', '|': 'or', '^': 'xor' };
const TURN = { '&': '|', '|': '^', '^': '&' };
const turnGate = (code, k) => { let i = -1; return code.replace(/[&|^]/g, m => (++i === k ? TURN[m] : m)); };
const phone = () => typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches;
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const job = RP.jobOf(ch.job) ? ch.job : null;
  const st = () => view.rv || (view.rv = { p: job || 'sum', src: Object.fromEntries(RP.PUZZLES.concat(RP.JOBS).map(p => [p.id, p.start])), res: {}, solved: [], k: 0, play: false, fast: false, anim: null, slice: null, op: -1 });
  /* your slice: the design on your bench while it is the slice, else the one turned here, else the lab's example */
  const benchSlice = () => (S.bench && S.bench.p === 'alu' && typeof S.bench.code === 'string' ? S.bench.code : null);
  const sliceNow = () => benchSlice() || st().slice || RP.SLICE_EXAMPLE;
  const yoursIs = () => (benchSlice() != null ? 'bench' : st().slice != null ? 'here' : 'example');
  function setSlice(code) {
    const s = st(), b = S.bench, same = code === RP.SLICE_EXAMPLE;
    /* kept on your bench when the bench holds the slice, or only the lab's example of another piece: nothing of yours is lost */
    if (b && (b.p === 'alu' || b.code == null)) { b.p = 'alu'; b.code = same ? null : code; b.rows = null; s.slice = null; if (L.ctx && L.ctx.save) L.ctx.save(); }
    else s.slice = same ? null : code;
  }
  const res = () => st().res[st().p] || null;
  const shown = r => (r && r.yours && r.yours.trace.length ? r.yours : null);
  const traceOf = r => (shown(r) ? r.yours.trace : r ? r.ref.trace : []);

  /* the registers worth showing: those the program names, a0 first, at most eight */
  function regsOf(r, src) {
    const used = new Set([10]);
    traceOf(r).forEach(s => [s.rd, s.rs1, s.rs2].forEach(x => { if (x != null && x > 0) used.add(x); }));
    if (!r) (src.replace(/#.*$/gm, '').match(/\b(a[0-7]|t[0-6]|s[0-9])\b/g) || []).forEach(n => used.add(RP.ABI.indexOf(n)));
    return [...used].filter(i => i > 0).sort((a, b) => (a === 10 ? -1 : b === 10 ? 1 : a - b)).slice(0, 8).map(i => RP.ABI[i]);
  }
  function figure(s, r) {
    const tr = traceOf(r), k = Math.min(s.k, Math.max(0, tr.length - 1)), cur = tr.length ? tr[k] : null, y = shown(r);
    /* the fault is drawn from its step on (the first case's run): the line, the slice, and every register that differs */
    const F = y && y.fault && y.fault.at === 0 ? y.fault : null, after = F && k >= F.step;
    const svg = dpSvg({ lines: s.src[s.p].split('\n'), step: cur, refX: after ? y.refX[k] : null, fault: after ? (k === F.step ? F : Object.assign({}, F, { alu: null })) : null,
      show: regsOf(r, s.src[s.p]), narrow: phone(), abi: RP.ABI, uid: 'rvdp', aria: t('rv.aria', { op: cur ? cur.op : '' }) }, L).replace('data-ph="9"', 'data-ph="' + (s.anim ? 0 : 9) + '"');
    const who = !y ? 'rv.fig.ref' : y.right ? 'rv.fig.right' : 'rv.fig.wrong';
    return '<figure class="rvfig dpfig" data-f2="instrument"><div class="dphead"><span class="dpwho' + (y && !y.right ? ' bad' : '') + '">' + esc(t('rv.fig.yours')) + '</span><span class="small muted">' + esc(t(who, { n: y ? y.wrongRows : 0 })) + '</span>' +
      '<span class="dpstep mono">' + esc(t('rv.step', { n: tr.length ? k + 1 : 0, total: tr.length })) + '</span></div>' + svg +
      '<figcaption class="small muted">' + esc(t('rv.fig.cap')) + '</figcaption></figure>';
  }
  function goalbox(s, r) {
    const P = RP.puzzleOf(s.p), ok = RP.met(s.solved), pass = r ? r.ref.cases.filter(c => c.ok).length : 0, y = r && r.yours, same = y ? y.cases.filter(c => c.same).length : 0;
    const gs = [{ k: 'solved', ok, v: s.solved.length + ' / ' + RP.GOAL, f: Math.min(1, s.solved.length / RP.GOAL) },
      { k: 'cases', ok: !!(r && r.ref.ok), v: pass + ' / ' + P.cases.length, f: pass / P.cases.length },
      { k: 'same', ok: !!(y && y.same && y.reads), v: y ? same + ' / ' + P.cases.length : '–', f: y ? same / P.cases.length : 0 }];
    if (P.maxCycles) gs.push({ k: 'cycles', ok: !!r && !r.ref.slow && r.ref.cycles > 0, v: r ? String(r.ref.cycles) : '–', target: t('rv.t.cycles', { v: P.maxCycles }), f: r && r.ref.cycles ? Math.min(1, P.maxCycles / r.ref.cycles) : 0 });
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('rv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const inputs = c => Object.entries(c).filter(([k]) => k !== 'mem').map(([k, v]) => k + ' = ' + v).join(', ');
  /* every case on the two cores, side by side */
  function results(r) {
    if (!r) return '<p class="small muted">' + esc(t('rv.notyet')) + '</p>';
    const R = r.ref;
    if (R.errs.length) return '<p class="small bad">' + R.errs.slice(0, 3).map(e => esc(t('rv.line', { l: e.l })) + ' ' + esc(t('rv.err.' + e.k, { n: e.n || '' }))).join('<br>') + '</p>';
    const y = r.yours, cell = c => (c.err ? '<span class="bad">' + esc(c.err.k === 'loop' ? t('rv.cell.loop') : t('rv.cell.mem')) + '</span>' : '<b class="mono' + (c.ok ? '' : ' bad') + '">' + esc(String(c.got)) + '</b>');
    let h = '<table class="rvtwo"><thead><tr><th>' + esc(t('rv.col.in')) + '</th><th>' + esc(t('rv.col.ref')) + '</th><th>' + esc(t('rv.col.yours')) + '</th></tr></thead><tbody>' +
      R.cases.map((c, i) => { const m = y && y.cases[i]; return '<tr><td class="mono">' + esc(inputs(c.in) + (c.in.mem ? (inputs(c.in) ? ' · ' : '') + '[' + c.in.mem.join(', ') + ']' : '')) + '</td><td>' + cell(c) + (c.ok ? ' <span class="good">✓</span>' : '') + '</td><td>' + (m ? cell(m) + (m.same ? '' : ' <span class="bad">≠</span>') : '<span class="muted">–</span>') + '</td></tr>'; }).join('') + '</tbody></table>';
    const wrong = R.cases.find(x => !x.ok && !x.err);
    if (wrong) h += '<p class="small bad">' + esc(t('rv.wanted', { want: wrong.want, got: wrong.got })) + '</p>';
    if (R.forbidden) h += '<p class="small bad">' + esc(t('rv.forbid', { op: R.forbidden })) + '</p>';
    if (R.slow) h += '<p class="small bad">' + esc(t('rv.slow', { v: R.cycles })) + '</p>';
    if (R.ok && !RP.jobOf(R.id)) h += '<p class="small good">' + esc(t('rv.ok.' + R.id)) + '</p>';
    return h + faultHtml(r);
  }
  /* where your core went wrong: the instruction, the value, and the slice */
  function faultHtml(r) {
    const y = r.yours; if (!y) return '';
    if (!y.reads) return '<div class="rvfault"><p class="small bad">' + esc(t('rv.f.unread')) + '</p></div>';
    if (!y.fault) return '<p class="small ' + (y.right ? 'good' : 'muted') + '">' + esc(y.right ? t('rv.f.same') : t('rv.f.quiet', { n: y.wrongRows })) + '</p>';
    const f = y.fault, sl = f.slice, ins = RP.puzzleOf(r.ref.id).cases[f.at];
    let h = '<div class="rvfault"><p class="kicker">' + esc(t('rv.f.k')) + '</p><p class="small">' + esc(t('rv.f.where', { l: f.l, op: f.op, k: f.step + 1, c: inputs(ins) || '·' })) + '</p>';
    if (f.alu) h += '<p class="small">' + esc(t('rv.f.alu', { op: t('rv.op.' + f.alu.op), p: f.alu.p, q: f.alu.q, got: f.alu.got, want: f.alu.want })) + '</p>';
    if (sl) h += '<p class="small">' + esc(t('rv.f.slice', { n: sl.bit, a: sl.in.a, b: sl.in.b, c: sl.in.cin, y: sl.got.y, cy: sl.got.cout, wy: sl.want.y, wc: sl.want.cout })) + '</p>';
    return h + (f.at === 0 ? '<button type="button" class="chipb" data-rv-fault>' + esc(t('rv.f.go')) + '</button>' : '') + '</div>';
  }
  /* your slice: its description, each gate a button that turns it into the next kind */
  function sliceHtml() {
    const code = sliceNow(), s = st(), by = yoursIs(); let k = -1;
    const line = l => esc(l).replace(/&amp;|[|^]/g, m => { const op = m === '&amp;' ? '&' : m; k++;
      return '<button type="button" class="op' + (k === s.op ? ' just' : '') + '" data-rv-gate="' + k + '" title="' + esc(t('game.op.' + OPS[op] + '.d')) + '"><b>' + esc(op) + '</b></button>'; });
    return '<details class="rvslice"' + (s.sliceOpen ? ' open' : '') + '><summary><b>' + esc(t('rv.s.k')) + '</b> <span class="small muted">' + esc(t('rv.s.by.' + by)) + '</span></summary>' +
      '<p class="small muted">' + esc(t('rv.s.d')) + '</p><div class="code tapcode rvtap" role="group" aria-label="' + esc(t('rv.s.k')) + '">' + code.split('\n').map(l => '<div>' + line(l) + '</div>').join('') + '</div>' +
      '<div class="chips">' + (code !== RP.SLICE_EXAMPLE ? '<button type="button" class="chipb" data-rv-slice0>' + esc(t('rv.s.reset')) + '</button>' : '') + '<a class="chipb" href="#/bench/logic">' + esc(t('rv.s.bench')) + '</a></div></details>';
  }
  function bench() {
    const s = st(), r = res(), tr = traceOf(r), isJob = !!RP.jobOf(s.p), n = tr.length, k = Math.min(s.k, Math.max(0, n - 1));
    let h = head() + '<p class="small rvintro">' + esc(job ? t('rv.introJob', { job: t('rv.job.' + job + '.t') }) : t('rv.intro')) + '</p>';
    h += '<div class="chips rvpz">' + (job ? '<button type="button" class="chipb rvjob" data-rv-p="' + job + '" aria-pressed="' + (s.p === job) + '">' + esc(t('rv.job.' + job + '.t')) + '</button>' : '') +
      RP.PUZZLES.map(p => '<button type="button" class="chipb" data-rv-p="' + p.id + '" aria-pressed="' + (s.p === p.id) + '">' + (s.solved.includes(p.id) ? '✓ ' : '') + esc(t('rv.p.' + p.id + '.t')) + '</button>').join('') + '</div>';
    h += '<p class="small rvtask"><b>' + esc(isJob ? t('rv.job.' + s.p + '.t') : t('rv.p.' + s.p + '.t')) + '.</b> ' + esc(isJob ? t('rv.job.' + s.p + '.d') : t('rv.p.' + s.p + '.d')) + '</p>' + goalbox(s, r) + figure(s, r);
    h += '<div class="chips rvacts"><button type="button" class="btn primary" data-rv-run>' + esc(t('rv.run')) + '</button><button type="button" class="chipb" data-rv-play' + (n ? '' : ' disabled') + '>' + esc(t(s.play ? 'rv.pause' : 'rv.play')) + '</button><button type="button" class="chipb" data-rv-step' + (n ? '' : ' disabled') + '>' + esc(t('rv.stepb')) + '</button><button type="button" class="chipb" data-rv-fast aria-pressed="' + s.fast + '"' + (n ? '' : ' disabled') + '>' + esc(t('rv.fast')) + '</button><button type="button" class="chipb" data-rv-reset>' + esc(t('rv.reset')) + '</button></div>';
    if (n > 1) h += '<label class="rvscrub"><span class="small muted">' + esc(t('rv.scrub')) + '</span><input type="range" data-rv-k min="0" max="' + (n - 1) + '" step="1" value="' + k + '"></label>';
    h += '<label class="lab" for="rv-code"><b>' + esc(isJob ? t('rv.codeJob') : t('rv.code')) + '</b></label><textarea id="rv-code" class="rvedit mono" data-rv-code spellcheck="false" rows="9">' + esc(s.src[s.p]) + '</textarea>';
    h += results(r) + sliceHtml();
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(isJob ? t('rv.hint.job') : t('rv.hint.' + s.p)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('rv.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('rv.note')) + '</p>' + doneNote() + reward();
  }
  /* the light's way, on real time: one instruction a DUR; playing goes on to the next */
  function loop(now) {
    const s = st(), r = res(), a = s.anim; if (!a || !el.isConnected || !r) { s.anim = null; s.play = false; return; }
    const n = traceOf(r).length;
    if (a.t0 == null) a.t0 = now;
    /* a slow frame does not slow the run: at most one instruction a frame, and the light keeps its own time */
    const u = Math.min(1, (now - a.t0) / (s.fast ? FAST : DUR));
    dpAnimate(el.querySelector('.dpfig svg'), u);
    if (u >= 1) {
      if (s.play && s.k < n - 1) { s.k++; a.t0 = now; draw(); }
      else { s.anim = null; s.play = false; draw(); return; }
    }
    requestAnimationFrame(loop);
  }
  const go = () => { const s = st(); if (still()) { s.anim = null; if (s.play) { s.k = traceOf(res()).length - 1; s.play = false; } draw(); return; } const was = !!s.anim; s.anim = { t0: null }; draw(); if (!was) requestAnimationFrame(loop); };
  const runIt = () => { const s = st(), r = RP.checkOn(s.p, s.src[s.p], sliceNow()); s.res[s.p] = r; s.k = 0; s.play = false; s.anim = null;
    if (!RP.jobOf(s.p) && r.ref.ok && !s.solved.includes(s.p)) s.solved.push(s.p); if (RP.met(s.solved)) win(); };
  return {
    draw: bench,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const p = q('[data-rv-p]'); if (p) { s.p = p.dataset.rvP; s.k = 0; s.play = false; s.anim = null; draw(); fx(); return true; }
      if (q('[data-rv-run]')) { runIt(); draw(); fx(); return true; }
      if (q('[data-rv-play]')) { const r = res(); if (!r) return true; if (s.play) { s.play = false; s.anim = null; draw(); return true; } if (s.k >= traceOf(r).length - 1) s.k = 0; s.play = true; go(); return true; }
      if (q('[data-rv-step]')) { const r = res(); if (r) s.k = Math.min(traceOf(r).length - 1, s.k + 1); s.play = false; go(); return true; }
      if (q('[data-rv-fast]')) { s.fast = !s.fast; draw(); return true; }
      if (q('[data-rv-fault]')) { const r = res(); if (r && r.yours && r.yours.fault) { s.k = r.yours.fault.step; s.play = false; go(); } return true; }
      if (q('[data-rv-reset]')) { s.src[s.p] = RP.puzzleOf(s.p).start; delete s.res[s.p]; s.k = 0; s.play = false; s.anim = null; draw(); return true; }
      const g = q('[data-rv-gate]'); if (g) { const k = +g.dataset.rvGate; s.op = k; s.sliceOpen = true; setSlice(turnGate(sliceNow(), k)); if (s.res[s.p]) runIt(); draw(); fx(); return true; }
      if (q('[data-rv-slice0]')) { s.op = -1; setSlice(RP.SLICE_EXAMPLE); if (s.res[s.p]) runIt(); draw(); fx(); return true; }
      const sm = q('.rvslice > summary'); if (sm) { s.sliceOpen = !sm.parentNode.open; return false; }
      return false; },
    /* typing changes the program only: it is run when Run is pressed, so the cursor stays where it is */
    input(e) { const a = e.target.closest('[data-rv-code]'); if (a) { st().src[st().p] = a.value; return true; }
      const k = e.target.closest('[data-rv-k]'); if (k) { const s = st(); s.k = +k.value; s.play = false; s.anim = null; draw(); return true; }
      return false; }
  };
}
