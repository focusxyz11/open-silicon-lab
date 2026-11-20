/* Run your core (kind 'rv', at the Lab, from the RISC-V core of the community's computer): write small programs for a
   RISC-V core and watch them run, from src/engines/rvpuzzles.js on the lab's simulator (src/engines/riscv.js, the
   first site's RISC-V lab). The picture is the core at work: the program with the line it is on, the program counter,
   the decoder, the arithmetic unit with its two inputs and its answer, and the registers, the written one lit. Run
   checks the program on every case of the puzzle; Play steps through the first case on the clock. Won when three
   puzzles are solved. A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as RP from '../../engines/rvpuzzles.js';

const SHOW = ['zero', 'a0', 'a1', 'a2', 't0', 't1', 't2', 's0'];
const STEPS_S = 6;

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.rv || (view.rv = { p: 'sum', src: Object.fromEntries(RP.PUZZLES.map(p => [p.id, p.start])), res: {}, solved: [], k: 0, play: false });
  const regIdx = n => RP.ABI.indexOf(n);

  function figure(s, r) {
    const tr = r && r.trace || [], k = Math.min(s.k, Math.max(0, tr.length - 1)), cur = tr.length ? tr[k] : null, lines = s.src[s.p].split('\n');
    const W = 300, H = 236, cl = cur ? cur.l - 1 : -1, first = Math.max(0, Math.min(cl - 6, lines.length - 13));
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('rv.aria', { op: cur ? cur.op : '' })) + '">';
    /* the program, with the line the core is on */
    h += '<rect class="rvpanel" x="2" y="14" width="124" height="' + (H - 18) + '" rx="6"/><text class="ax" x="6" y="10">' + esc(t('core.block.program')) + '</text>';
    lines.slice(first, first + 13).forEach((ln, i) => { const n = first + i, y = 30 + i * 15.5, on = n === cl;
      if (on) h += '<rect class="rvon" x="4" y="' + (y - 10) + '" width="120" height="14" rx="3"/>';
      h += '<text class="rvcode' + (on ? ' on' : '') + '" x="8" y="' + y + '">' + esc(ln.replace(/\t/g, '  ').slice(0, 22)) + '</text>'; });
    /* program counter and decoder */
    h += '<rect class="rvbox" x="134" y="14" width="74" height="30" rx="5"/><text class="ax" x="138" y="26">' + esc(t('core.block.pc')) + '</text><text class="rvnum" x="204" y="39" text-anchor="end">' + (cur ? (cur.l - 1) * 4 : 0) + '</text>';
    h += '<rect class="rvbox" x="134" y="52" width="74" height="34" rx="5"/><text class="ax" x="138" y="64">' + esc(t('core.block.decode')) + '</text><text class="rvop" x="171" y="80" text-anchor="middle">' + esc(cur ? cur.op : '·') + '</text>';
    /* the arithmetic unit: two inputs in, one answer out */
    h += '<path class="rvalu' + (cur && cur.val != null ? ' on' : '') + '" d="M134 100h74l-14 36h-46z"/><text class="ax" x="171" y="96" text-anchor="middle">' + esc(t('rv.alu')) + '</text>' +
      '<text class="rvnum s" x="148" y="114" text-anchor="middle">' + esc(cur ? String(cur.a) : '') + '</text><text class="rvnum s" x="194" y="114" text-anchor="middle">' + esc(cur ? String(cur.b) : '') + '</text>' +
      '<text class="rvnum" x="171" y="131" text-anchor="middle">' + esc(cur && cur.val != null ? String(cur.val) : cur && cur.taken ? t('rv.jump') : '') + '</text>';
    h += '<text class="ax" x="134" y="152">' + esc(t('rv.step', { n: tr.length ? k + 1 : 0, total: tr.length })) + '</text>';
    h += '<rect class="rvbox" x="134" y="160" width="74" height="72" rx="5"/><text class="ax" x="138" y="172">' + esc(t('core.block.result')) + '</text><text class="rvbig" x="171" y="206" text-anchor="middle">' + esc(cur ? String(cur.x[10]) : '0') + '</text><text class="ax" x="171" y="222" text-anchor="middle">a0</text>';
    /* the registers, the one just written lit */
    h += '<text class="ax" x="216" y="10">' + esc(t('core.block.regs')) + '</text>';
    SHOW.forEach((n, i) => { const y = 14 + i * 27.5, ri = regIdx(n), lit = cur && cur.rd === ri && ri > 0;
      h += '<rect class="rvreg' + (lit ? ' on' : '') + '" x="216" y="' + y + '" width="82" height="23" rx="4"/><text class="ax" x="221" y="' + (y + 15) + '">' + n + '</text><text class="rvnum s" x="294" y="' + (y + 15) + '" text-anchor="end">' + (cur ? cur.x[ri] : 0) + '</text>'; });
    return '<figure class="rvfig" data-f2="instrument">' + h + '</svg></figure>';
  }
  function goalbox(s, r) {
    const P = RP.puzzleOf(s.p), ok = RP.met(s.solved), pass = r ? r.cases.filter(c => c.ok).length : 0;
    const gs = [{ k: 'solved', ok, v: s.solved.length + ' / ' + RP.GOAL, f: Math.min(1, s.solved.length / RP.GOAL) },
      { k: 'cases', ok: !!(r && r.ok), v: pass + ' / ' + P.cases.length, f: pass / P.cases.length }];
    if (P.maxCycles) gs.push({ k: 'cycles', ok: !!r && !r.slow && r.cycles > 0, v: r ? String(r.cycles) : '–', target: t('rv.t.cycles', { v: P.maxCycles }), f: r && r.cycles ? Math.min(1, P.maxCycles / r.cycles) : 0 });
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('rv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  function results(r) {
    if (!r) return '<p class="small muted">' + esc(t('rv.notyet')) + '</p>';
    if (r.errs.length) return '<p class="small bad">' + r.errs.slice(0, 3).map(e => esc(t('rv.line', { l: e.l })) + ' ' + esc(t('rv.err.' + e.k, { n: e.n || '' }))).join('<br>') + '</p>';
    let h = '<ul class="rvcases">' + r.cases.map(c => '<li class="' + (c.ok ? 'good' : 'bad') + '"><span class="mono">' + esc(Object.entries(c.in).map(([k, v]) => k + ' = ' + v).join(', ')) + '</span> → ' +
      (c.ok ? '<b class="mono">' + c.got + '</b> ✓' : esc(c.err ? (c.err.k === 'loop' ? t('core.caseStuck') : t('core.run.mem', { l: c.err.l })) : t('core.case', { want: c.want, got: c.got }))) + '</li>').join('') + '</ul>';
    if (r.forbidden) h += '<p class="small bad">' + esc(t('rv.forbid', { op: r.forbidden })) + '</p>';
    if (r.slow) h += '<p class="small bad">' + esc(t('rv.slow', { v: r.cycles })) + '</p>';
    if (r.ok) h += '<p class="small good">' + esc(t('rv.ok.' + r.id)) + '</p>';
    return h;
  }
  function bench() {
    const s = st(), P = RP.puzzleOf(s.p), r = s.res[s.p];
    let h = head() + '<p class="small rvintro">' + esc(t('rv.intro')) + '</p>';
    h += '<div class="chips rvpz">' + RP.PUZZLES.map(p => '<button type="button" class="chipb" data-rv-p="' + p.id + '" aria-pressed="' + (s.p === p.id) + '">' + (s.solved.includes(p.id) ? '✓ ' : '') + esc(t('rv.p.' + p.id + '.t')) + '</button>').join('') + '</div>';
    h += '<p class="small rvtask"><b>' + esc(t('rv.p.' + s.p + '.t')) + '.</b> ' + esc(t('rv.p.' + s.p + '.d')) + '</p>' + goalbox(s, r) + figure(s, r);
    h += '<div class="chips"><button type="button" class="btn primary" data-rv-run>' + esc(t('rv.run')) + '</button><button type="button" class="chipb" data-rv-play' + (r && r.trace.length ? '' : ' disabled') + '>' + esc(t(s.play ? 'rv.pause' : 'rv.play')) + '</button><button type="button" class="chipb" data-rv-step' + (r && r.trace.length ? '' : ' disabled') + '>' + esc(t('rv.stepb')) + '</button><button type="button" class="chipb" data-rv-reset>' + esc(t('rv.reset')) + '</button></div>';
    h += '<label class="lab" for="rv-code"><b>' + esc(t('rv.code')) + '</b></label><textarea id="rv-code" class="rvedit mono" data-rv-code spellcheck="false" rows="9">' + esc(s.src[s.p]) + '</textarea>';
    h += results(r);
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('rv.hint.' + s.p)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('rv.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('rv.note')) + '</p>' + doneNote() + reward();
  }
  function loop(now) {
    const s = st(), r = s.res[s.p]; if (!s.play || !el.isConnected || !r) { s.play = false; return; }
    if (now - (s.t || 0) >= 1000 / STEPS_S) { s.t = now; s.k++; if (s.k >= r.trace.length - 1) { s.k = r.trace.length - 1; s.play = false; } draw(); }
    if (s.play) requestAnimationFrame(loop);
  }
  const runIt = () => { const s = st(), r = RP.check(s.p, s.src[s.p]); s.res[s.p] = r; s.k = 0; s.play = false; if (r.ok && !s.solved.includes(s.p)) s.solved.push(s.p); if (RP.met(s.solved)) win(); };
  return {
    draw: bench,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const p = q('[data-rv-p]'); if (p) { s.p = p.dataset.rvP; s.k = 0; s.play = false; draw(); fx(); return true; }
      if (q('[data-rv-run]')) { runIt(); draw(); fx(); return true; }
      if (q('[data-rv-play]')) { const r = s.res[s.p]; if (!r) return true; if (s.k >= r.trace.length - 1) s.k = 0; s.play = !s.play; s.t = 0; draw(); if (s.play) requestAnimationFrame(loop); return true; }
      if (q('[data-rv-step]')) { const r = s.res[s.p]; if (r) s.k = Math.min(r.trace.length - 1, s.k + 1); s.play = false; draw(); return true; }
      if (q('[data-rv-reset]')) { s.src[s.p] = RP.puzzleOf(s.p).start; delete s.res[s.p]; s.k = 0; s.play = false; draw(); return true; }
      return false; },
    /* typing changes the program only: it is run when Run is pressed, so the cursor stays where it is */
    input(e) { const a = e.target.closest('[data-rv-code]'); if (!a) return false; st().src[st().p] = a.value; return true; }
  };
}
