/* The program nobody can judge (kind 'halt', at the Lab, on the community's RISC-V core), from src/engines/halt.js:
   the core question "Beyond computation", in two depths. Stage 1, anything can compute: build one gate (NAND) from
   dominoes, water or light, with two choices and no knowledge needed, then two of them that remember a bit. Stage 2
   opens from it: an agent says whether a program stops by running it for a budget of steps; build programs from four
   blocks, run them on the core, and fool it three times, the last with the program that asks about itself and does
   the opposite (Turing, 1936). Won when stage 1 and all three fools are done.
   The picture: stage 1 the gate or the latch in the chosen material; stage 2 the program as blocks, the core stepping
   (its step count, the instruction, a0), and two lanes, the agent's look up to its budget and what really happened.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as HL from '../../engines/halt.js';
import { loop } from './loop.js';

const ANIM_S = 1.6;   /* seconds a run takes to replay on the picture */

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.hl || (view.hl = { stage: 1, media: 'water', join: 'parallel', out: 'follow', a: 1, b: 0, gate: false, fed: false, q: 0, push: null, seen: { set: false, reset: false },
    prog: [{ b: 'count', n: 100 }, { b: 'stop' }], budget: 1000, run: null, tried: {}, k: 1 });
  const num = v => Number(v).toLocaleString('en-GB');
  const stage1 = s => s.gate && HL.remembers(s.seen);
  const check = () => { const s = st(); if (stage1(s) && HL.met(s.tried)) win(); };

  /* ---- stage 1: the gate, in one material ---- */
  function gateFig(s) {
    const f = HL.gate(s.join, s.out), thr = s.join === 'series' ? s.a & s.b : s.a | s.b, o = f(s.a, s.b), inv = s.out === 'invert', M = s.media;
    const W = 300, H = 200, ser = s.join === 'series';
    /* the points: the source, the two inputs, where the paths join, the output */
    const P = ser ? { S: [34, 100], A: [100, 100], B: [160, 100], J: [206, 100] } : { S: [34, 100], A: [112, 56], B: [112, 144], J: [184, 100] };
    const K = [240, 100], O = inv ? [240, 156] : [262, 100], S2 = [240, 26];
    const seg = (a, b, on, k) => '<path class="hlw ' + M + (on ? ' on' : '') + '" d="M' + a[0] + ' ' + a[1] + (ser || k === 'tail' ? 'L' : 'H' + ((a[0] + b[0]) / 2) + 'V' + b[1] + 'H') + b.join(' ') + '"/>';
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('halt.g.aria', { m: t('halt.m.' + M), a: s.a, b: s.b, o })) + '">';
    if (ser) { h += seg(P.S, P.A, 1) + seg(P.A, P.B, s.a) + seg(P.B, P.J, thr); }
    else { h += seg(P.S, P.A, 1) + seg(P.S, P.B, 1) + seg(P.A, P.J, s.a) + seg(P.B, P.J, s.b); }
    if (inv) h += seg(P.J, K, thr, 'tail') + seg(S2, K, 1, 'tail') + seg(K, O, o, 'tail');
    else h += seg(P.J, O, thr, 'tail');
    /* the sources: a tank, a lamp, a push */
    const src = (p, k) => M === 'water' ? '<rect class="hlsrc" x="' + (p[0] - 16) + '" y="' + (p[1] - 14) + '" width="22" height="28" rx="3"/><rect class="hlwater" x="' + (p[0] - 14) + '" y="' + (p[1] - 4) + '" width="18" height="16" rx="2"/>'
      : M === 'light' ? '<circle class="hllamp" cx="' + (p[0] - 6) + '" cy="' + p[1] + '" r="9"/>' : '<path class="hlpush" d="M' + (p[0] - 18) + ' ' + (p[1] - 8) + 'l12 8l-12 8z"/>';
    h += src(P.S); if (inv) h += M === 'water' ? '<rect class="hlsrc" x="' + (S2[0] - 11) + '" y="' + (S2[1] - 20) + '" width="22" height="18" rx="3"/><rect class="hlwater" x="' + (S2[0] - 9) + '" y="' + (S2[1] - 12) + '" width="18" height="8" rx="2"/>'
      : M === 'light' ? '<circle class="hllamp" cx="' + S2[0] + '" cy="' + (S2[1] - 8) + '" r="8"/>' : '<path class="hlpush" d="M' + (S2[0] - 8) + ' ' + (S2[1] - 18) + 'l8 12l8 -12z"/>';
    /* the inputs: a valve, a shutter, a gap that a domino fills; each can be tapped */
    const inp = (p, k, on) => '<g class="hlin' + (on ? ' on' : '') + '" data-hl-in="' + k + '" role="button" aria-label="' + esc(t('halt.g.in', { k: k.toUpperCase() })) + '"><rect class="hlhit" x="' + (p[0] - 18) + '" y="' + (p[1] - 22) + '" width="36" height="44"/>' +
      (M === 'water' ? '<path class="hlvalve" d="M' + (p[0] - 10) + ' ' + (p[1] - 9) + 'L' + (p[0] + 10) + ' ' + (p[1] + 9) + 'V' + (p[1] - 9) + 'L' + (p[0] - 10) + ' ' + (p[1] + 9) + 'z"/>' + (on ? '' : '<line class="hlshut" x1="' + p[0] + '" x2="' + p[0] + '" y1="' + (p[1] - 12) + '" y2="' + (p[1] + 12) + '"/>')
        : M === 'light' ? '<rect class="hlshutter" x="' + (p[0] - 3) + '" y="' + (on ? p[1] - 22 : p[1] - 11) + '" width="6" height="' + (on ? 9 : 22) + '" rx="1.5"/>'
        : (on ? '<rect class="hldom on" x="' + (p[0] - 3) + '" y="' + (p[1] - 9) + '" width="6" height="18" rx="1"/>' : '<rect class="hlgap" x="' + (p[0] - 7) + '" y="' + (p[1] - 9) + '" width="14" height="18" rx="2"/>')) +
      '<text class="hlk" x="' + p[0] + '" y="' + (p[1] + (ser ? 26 : (k === 'a' ? -14 : 26))) + '" text-anchor="middle">' + k.toUpperCase() + ' · ' + (on ? 1 : 0) + '</text></g>';
    h += inp(P.A, 'a', s.a) + inp(P.B, 'b', s.b);
    /* where the switched path meets the output's own line, when the output is on unless something comes through */
    if (inv) h += '<circle class="hlblock' + (thr ? ' on' : '') + '" cx="' + K[0] + '" cy="' + K[1] + '" r="6"/>';
    /* the output: a cup that fills, a lamp that lights, a domino that falls */
    h += M === 'water' ? '<path class="hlcup" d="M' + (O[0] - 12) + ' ' + (O[1] - 4) + 'l3 22h18l3 -22"/>' + (o ? '<path class="hlwater" d="M' + (O[0] - 10) + ' ' + (O[1] + 4) + 'l2 13h16l2 -13z"/>' : '')
      : M === 'light' ? '<circle class="hlout' + (o ? ' on' : '') + '" cx="' + O[0] + '" cy="' + (O[1] + 8) + '" r="10"/>'
      : '<rect class="hldom' + (o ? ' on' : '') + '" x="' + (O[0] - 3) + '" y="' + O[1] + '" width="6" height="18" rx="1" transform="rotate(' + (o ? 70 : 0) + ' ' + O[0] + ' ' + (O[1] + 18) + ')"/>';
    h += '<text class="hlk out' + (o ? ' on' : '') + '" x="' + O[0] + '" y="' + (O[1] + 36) + '" text-anchor="middle">' + esc(t('halt.g.out')) + ' · ' + o + '</text>';
    return '<figure class="hlfig" data-f2="instrument">' + h + '</svg><figcaption class="small muted">' + esc(t('halt.cap.' + M + '.' + s.out)) + '</figcaption></figure>';
  }
  /* ---- stage 1: the latch, two of the same gates, each output fed to the other ---- */
  function latchFig(s) {
    const W = 300, H = 200, M = s.media, q = s.q, nq = 1 - q, pushed = s.push && s.push.held ? s.push.which : null;
    const g = (y, label) => '<rect class="hlgate" x="120" y="' + (y - 22) + '" width="64" height="44" rx="10"/><text class="hlgt" x="152" y="' + (y + 4) + '" text-anchor="middle">' + esc(label) + '</text><circle class="hlbub" cx="188" cy="' + y + '" r="4"/>';
    const w = (d, on, fb) => '<path class="hlw ' + M + ' thin' + (on ? ' on' : '') + (fb && !s.fed ? ' off' : '') + '" d="' + d + '"/>';
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('halt.l.aria', { q })) + '">';
    /* the pushes in, each to one gate */
    h += w('M40 50H120', pushed === 'set') + w('M40 150H120', pushed === 'reset');
    h += '<text class="hlk" x="40" y="40">' + esc(t('halt.l.set')) + '</text><text class="hlk" x="40" y="168">' + esc(t('halt.l.reset')) + '</text>';
    /* the outputs, and the wires fed back across to the other gate's second input */
    h += w('M192 60H262', q) + w('M192 140H232', nq);
    h += w('M212 60V82L100 118V128H120', q, true) + w('M232 140V118L100 82V72H120', nq, true);
    h += g(60, t('halt.l.gate')) + g(140, t('halt.l.gate'));
    /* the bit: a lamp on the first output */
    h += '<circle class="hlout' + (q ? ' on' : '') + '" cx="272" cy="60" r="11"/><text class="hlk out' + (q ? ' on' : '') + '" x="272" y="88" text-anchor="middle">' + esc(t('halt.l.bit', { q })) + '</text>';
    if (!s.fed) h += '<text class="ax" x="152" y="194" text-anchor="middle">' + esc(t('halt.l.notfed')) + '</text>';
    return '<figure class="hlfig" data-f2="instrument">' + h + '</svg><figcaption class="small muted">' + esc(t(s.fed ? 'halt.l.capFed' : 'halt.l.cap')) + '</figcaption></figure>';
  }
  /* ---- stage 2: the program, the core, the agent's look and what really happened ---- */
  function runFig(s) {
    const r = s.run, W = 300, H = 224, P = HL.normal(s.prog), now = r ? Math.min(1, (performance.now() - r.t0) / 1000 / ANIM_S) : 0;
    let h = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(r ? t('halt.r.aria', { says: t('halt.says.' + r.says.verdict), real: t(r.real.stops ? 'halt.real.stops' : 'halt.real.never') }) : t('halt.r.ariaNone')) + '">';
    /* the replay: which sample the core is at */
    const sm = r ? r.real.samples : [], idx = r ? Math.min(sm.length - 1, Math.floor(now * (sm.length - 1) + 1e-9)) : 0, cur = sm[idx] || null, blk = cur && cur.line >= 0 ? r.real.lines[cur.line] : -1;
    /* the program as blocks */
    h += '<text class="ax" x="4" y="10">' + esc(t('halt.r.program')) + '</text>';
    if (!P.length) h += '<text class="hlk" x="8" y="34">' + esc(t('halt.r.empty')) + '</text>';
    P.forEach((x, i) => { const y = 16 + i * 30, on = r && i === blk && now < 1;
      h += '<rect class="hlblk hk-' + x.b + (on ? ' on' : '') + '" x="4" y="' + y + '" width="112" height="25" rx="6"/><text class="hlbt" x="12" y="' + (y + 16) + '">' + esc(t('halt.blk.' + x.b + '.s', { n: x.n ? num(x.n) : '' })) + '</text>'; });
    /* the scale of steps (log) for the two lanes, and the steps so far: a program that never stops keeps counting */
    const x0 = 128, x1 = 292, top = Math.max(6, Math.ceil(Math.log10(Math.max(10, s.budget, r && r.real.stops ? r.real.steps : 0) * 3))), lx = v => x0 + Math.log10(Math.max(1, v)) / top * (x1 - x0);
    const steps = !cur ? 0 : r.real.stops ? cur.steps : Math.max(cur.steps, Math.round(10 ** (top * now)));
    /* the core: steps so far, the instruction, a0 */
    h += '<rect class="hlcore" x="128" y="16" width="168" height="60" rx="8"/><text class="ax" x="136" y="30">' + esc(t('halt.r.core')) + '</text>' +
      '<text class="hlbig" x="136" y="56">' + num(steps) + '</text><text class="ax" x="136" y="70">' + esc(t('halt.r.steps')) + '</text>' +
      '<text class="hlop" x="288" y="44" text-anchor="end">' + esc(cur && cur.op ? cur.op : '·') + '</text><text class="ax" x="288" y="66" text-anchor="end">a0 = ' + (cur ? num(cur.a0) : 0) + '</text>';
    /* the two lanes, on one scale of steps (log): the agent's look up to its budget, and what really happened */
    const lane = (y, k) => '<text class="ax" x="' + x0 + '" y="' + (y - 5) + '">' + esc(t('halt.r.' + k)) + '</text><rect class="hllane" x="' + x0 + '" y="' + y + '" width="' + (x1 - x0) + '" height="12" rx="6"/>';
    h += lane(98, 'agentLane') + lane(150, 'realLane');
    const bx = lx(s.budget);
    h += '<line class="hlwall" x1="' + bx.toFixed(1) + '" x2="' + bx.toFixed(1) + '" y1="90" y2="168"/><text class="ax" x="' + Math.max(x0 + 24, Math.min(x1 - 24, bx)).toFixed(1) + '" y="180" text-anchor="middle">' + esc(t('halt.r.budget', { n: num(s.budget) })) + '</text>';
    if (r) {
      const seen = Math.min(steps, r.says.steps), aEnd = lx(seen);
      h += '<rect class="hlrun agent" x="' + x0 + '" y="98" width="' + Math.max(0, aEnd - x0).toFixed(1) + '" height="12" rx="6"/>';
      const rEnd = lx(steps);
      h += '<rect class="hlrun real' + (r.real.stops ? '' : ' never') + '" x="' + x0 + '" y="150" width="' + Math.max(0, rEnd - x0).toFixed(1) + '" height="12" rx="6"/>';
      if (now >= 1) {
        if (r.real.stops) h += '<path class="hlflag" d="M' + lx(r.real.steps).toFixed(1) + ' 166v-24l9 4l-9 4"/>';
        else h += '<text class="hlinf" x="' + (x1 - 2) + '" y="146" text-anchor="end">∞</text>';
        h += '<text class="hlsay ' + (r.says.verdict === 'stops' ? 'stops' : 'never') + '" x="' + x0 + '" y="125">' + esc(t('halt.says.' + r.says.verdict)) + '</text>';
        h += '<text class="hlsay real" x="' + x0 + '" y="198">' + esc(r.real.stops ? t('halt.real.stopsN', { n: num(r.real.steps) }) : t('halt.real.never')) + '</text>';
        if (r.fooled) h += '<g class="hlstamp"><rect x="212" y="203" width="80" height="20" rx="5"/><text x="252" y="217" text-anchor="middle">' + esc(t('halt.r.fooled')) + '</text></g>';
        else h += '<text class="hlright" x="292" y="217" text-anchor="end">' + esc(t('halt.r.right')) + '</text>';
      }
    } else h += '<text class="ax" x="' + x0 + '" y="198">' + esc(t('halt.r.press')) + '</text>';
    /* the program that asks about itself, against every budget */
    if (r && r.every && now >= 1) { const y0 = 16 + Math.max(P.length, 1) * 30 + 14;
      h += '<text class="ax" x="6" y="' + y0 + '">' + esc(t('halt.r.everyK')) + '</text>';
      r.every.forEach((x, i) => { h += '<text class="hlk' + (x.fooled ? ' bad' : '') + '" x="8" y="' + (y0 + 14 + i * 13) + '">' + esc(t('halt.r.every', { n: num(x.budget) })) + ' · ' + esc(t(x.fooled ? 'halt.r.fooled' : 'halt.r.right')) + '</text>'; }); }
    return '<figure class="hlfig" data-f2="instrument">' + h + '</svg><figcaption class="small muted">' + esc(t('halt.r.cap')) + '</figcaption></figure>';
  }

  function goalbox(s) {
    const T = s.tried, gs = s.stage === 1
      ? [{ k: 'gate', ok: s.gate, v: s.gate ? t('halt.v.built') : t('halt.v.rows', { a: HL.table(s.join, s.out).filter(r => r.got === r.want).length }) },
        { k: 'bit', ok: HL.remembers(s.seen), v: HL.remembers(s.seen) ? t('halt.v.kept') : s.seen.set ? t('halt.v.half') : '—' }]
      : [{ k: 'fool', ok: T.fool != null, v: T.fool != null ? t('halt.v.done') : '—' },
        { k: 'more', ok: !!T.more, v: T.more ? t('halt.v.done') : '—' },
        { k: 'self', ok: !!T.self, v: T.self ? t('halt.v.done') : '—' }];
    const ok = gs.every(g => g.ok);
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('halt.goal.' + g.k)) + '</span><span class="gv">' + esc(g.v) + '</span><span class="gbar"><span style="width:' + (g.ok ? 100 : 0) + '%"></span></span></div>').join('') + '</div>';
  }
  const chips = (k, list, cur, word) => '<div class="chips">' + list.map(v => '<button type="button" class="chipb" data-hl-' + k + '="' + v + '" aria-pressed="' + (cur === v) + '">' + esc(word(v)) + '</button>').join('') + '</div>';
  const stages = s => '<div class="chips hlstages" role="tablist">' + [1, 2].map(n => '<button type="button" class="chipb" role="tab" data-hl-stage="' + n + '" aria-selected="' + (s.stage === n) + '" aria-pressed="' + (s.stage === n) + '"' + (n === 2 && !stage1(s) ? ' disabled' : '') + '>' + esc(t('halt.stage.' + n)) + '</button>').join('') + '</div>';

  function one(s) {
    let h = '<p class="small hlintro">' + esc(t('halt.intro1')) + '</p>' + goalbox(s);
    if (!s.gate || s.k === 1) {
      h += gateFig(s);
      h += '<p class="kicker">' + esc(t('halt.ui.media')) + '</p>' + chips('media', HL.MEDIA, s.media, m => t('halt.m.' + m));
      h += '<div class="hlins"><button type="button" class="chipb" data-hl-in="a" aria-pressed="' + !!s.a + '">' + esc(t('halt.ui.in', { k: 'A', v: s.a })) + '</button><button type="button" class="chipb" data-hl-in="b" aria-pressed="' + !!s.b + '">' + esc(t('halt.ui.in', { k: 'B', v: s.b })) + '</button></div>';
      h += '<p class="kicker">' + esc(t('halt.ui.join')) + '</p>' + chips('join', HL.JOINS, s.join, j => t('halt.join.' + s.media + '.' + j));
      h += '<p class="kicker">' + esc(t('halt.ui.out')) + '</p>' + chips('out', HL.OUTS, s.out, o => t('halt.out.' + s.media + '.' + o));
      const T = HL.table(s.join, s.out);
      h += '<table class="hltt"><thead><tr><th>A</th><th>B</th><th>' + esc(t('halt.tt.yours')) + '</th><th>' + esc(t('halt.tt.want')) + '</th></tr></thead><tbody>' + T.map(r => '<tr class="' + (r.got === r.want ? 'good' : 'bad') + (r.a === s.a && r.b === s.b ? ' now' : '') + '"><td>' + r.a + '</td><td>' + r.b + '</td><td>' + r.got + '</td><td>' + r.want + '</td></tr>').join('') + '</tbody></table>';
      const nm = HL.nameOf(s.join, s.out);
      h += '<p class="small hlmsg ' + (nm === 'nand' ? 'good' : '') + '">' + esc(t('halt.msg.' + nm)) + '</p>';
      if (s.gate) h += '<button type="button" class="btn primary" data-hl-k="2">' + esc(t('halt.ui.toBit')) + '</button>';
    } else {
      h += latchFig(s);
      h += '<div class="chips"><button type="button" class="chipb" data-hl-fed aria-pressed="' + s.fed + '">' + esc(t('halt.ui.fed')) + '</button></div>';
      h += '<div class="chips"><button type="button" class="btn" data-hl-push="set">' + esc(t('halt.ui.set')) + '</button><button type="button" class="btn" data-hl-push="reset">' + esc(t('halt.ui.reset')) + '</button><button type="button" class="chipb" data-hl-k="1">' + esc(t('halt.ui.toGate')) + '</button></div>';
      if (s.push) h += '<p class="small hlmsg ' + (s.fed && s.push.after === (s.push.which === 'set' ? 1 : 0) && s.push.from !== s.push.after ? 'good' : '') + '">' + esc(t('halt.push.' + s.push.which + '.' + (s.push.after ? 1 : 0) + (s.fed ? 'f' : ''), {})) + '</p>';
      if (stage1(s)) {
        h += '<p class="kicker">' + esc(t('halt.ui.any')) + '</p><div class="hlany">' + HL.FROM_NAND.map(([k, n]) => '<span><b class="mono">' + n + '</b><span class="small">' + esc(t('halt.any.' + k)) + '</span></span>').join('') + '</div>';
        h += '<p class="small">' + esc(t('halt.pattern')) + '</p><button type="button" class="btn primary" data-hl-deeper>' + esc(t('halt.ui.deeper')) + '</button>';
      }
    }
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t(s.gate ? 'halt.hint.bit' : 'halt.hint.gate')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    return h + '<p class="small muted">' + esc(t('halt.note1')) + '</p>';
  }
  function two(s) {
    const P = HL.normal(s.prog), r = s.run;
    let h = '<p class="small hlintro">' + esc(t('halt.intro2')) + '</p>' + goalbox(s) + runFig(s);
    h += '<p class="kicker">' + esc(t('halt.ui.prog')) + '</p><ol class="hlprog">' + P.map((x, i) => '<li class="hlb hk-' + x.b + '"><span>' + esc(t('halt.blk.' + x.b)) + '</span>' +
      (x.b === 'count' ? '<select data-hl-n="' + i + '" aria-label="' + esc(t('halt.ui.countTo')) + '">' + HL.COUNTS.map(n => '<option value="' + n + '"' + (n === x.n ? ' selected' : '') + '>' + num(n) + '</option>').join('') + '</select>' : '') +
      '<button type="button" class="hlx" data-hl-del="' + i + '" aria-label="' + esc(t('halt.ui.del')) + '">×</button></li>').join('') + '</ol>';
    h += '<div class="chips hladd">' + HL.BLOCKS.map(b => '<button type="button" class="chipb" data-hl-add="' + b + '"' + (P.length >= HL.MAX_BLOCKS ? ' disabled' : '') + '>+ ' + esc(t('halt.blk.' + b)) + '</button>').join('') + '<button type="button" class="chipb" data-hl-clear>' + esc(t('halt.ui.clear')) + '</button></div>';
    h += '<p class="kicker">' + esc(t('halt.ui.budget')) + '</p><div class="chips">' + HL.BUDGETS.map(b => '<button type="button" class="chipb" data-hl-budget="' + b + '" aria-pressed="' + (s.budget === b) + '">' + esc(t('halt.ui.steps', { n: num(b) })) + '</button>').join('') + '</div>';
    h += '<div class="chips"><button type="button" class="btn primary" data-hl-run>' + esc(t('halt.ui.run')) + '</button></div>';
    if (r) h += '<p class="small hlmsg ' + (r.fooled ? 'good' : '') + '">' + esc(t('halt.msg2.' + (r.fooled ? (r.asks ? 'self' : 'fooled') : r.says.verdict === 'stops' ? 'stops' : 'never'), { n: num(r.real.steps), b: num(r.budget) })) + '</p>';
    if (s.tried.self) h += '<div class="hlopen"><p class="kicker">' + esc(t('halt.open.k')) + '</p><p class="small">' + esc(t('halt.open.p1')) + '</p><p class="small">' + esc(t('halt.open.p2')) + '</p></div>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t(s.tried.fool == null ? 'halt.hint.fool' : !s.tried.more ? 'halt.hint.more' : 'halt.hint.self')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('halt.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('halt.note2')) + '</p>';
  }
  function bench() { const s = st(); return head() + stages(s) + (s.stage === 1 ? one(s) : two(s)) + doneNote() + reward(); }

  /* the replay, one loop at a time: Run pressed again starts the replay over in the loop already running */
  const replayL = loop(el, now => { const s = st(); if (!s.run) return false; draw(); return now - s.run.t0 < ANIM_S * 1000 + 50; });
  function runIt() {
    const s = st(), r = HL.judge(s.prog, s.budget);
    s.run = Object.assign(r, { t0: performance.now(), every: r.asks ? HL.everyBudget(r.prog) : null });
    s.tried = HL.after(s.tried, r); check(); draw(); fx(); replayL.start();
  }
  return {
    draw: bench,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const sg = q('[data-hl-stage]'); if (sg) { const n = +sg.dataset.hlStage; if (n === 1 || stage1(s)) s.stage = n; draw(); return true; }
      const m = q('[data-hl-media]'); if (m) { s.media = m.dataset.hlMedia; draw(); return true; }
      const i = q('[data-hl-in]'); if (i) { s[i.dataset.hlIn] = s[i.dataset.hlIn] ? 0 : 1; draw(); return true; }
      const j = q('[data-hl-join]'); if (j) { s.join = j.dataset.hlJoin; if (HL.isNand(s.join, s.out)) s.gate = true; draw(); fx(); return true; }
      const o = q('[data-hl-out]'); if (o) { s.out = o.dataset.hlOut; if (HL.isNand(s.join, s.out)) s.gate = true; draw(); fx(); return true; }
      const k = q('[data-hl-k]'); if (k) { s.k = +k.dataset.hlK; draw(); return true; }
      const p = q('[data-hl-push]'); if (p) { const w = p.dataset.hlPush, r = HL.push(s.q, w, s.fed);
        s.push = { which: w, from: s.q, after: r.after, during: r.during }; s.q = r.after;
        if (s.fed && w === 'set' && r.after === 1) s.seen.set = true;
        if (s.fed && w === 'reset' && s.push.from === 1 && r.after === 0 && s.seen.set) s.seen.reset = true;
        check(); draw(); fx(); return true; }
      if (q('[data-hl-fed]')) { s.fed = !s.fed; s.push = null; draw(); return true; }
      if (q('[data-hl-deeper]')) { s.stage = 2; draw(); fx(); return true; }
      const a = q('[data-hl-add]'); if (a) { if (s.prog.length < HL.MAX_BLOCKS) s.prog.push(a.dataset.hlAdd === 'count' ? { b: 'count', n: 1000 } : { b: a.dataset.hlAdd }); s.run = null; draw(); return true; }
      const d = q('[data-hl-del]'); if (d) { s.prog.splice(+d.dataset.hlDel, 1); s.run = null; draw(); return true; }
      if (q('[data-hl-clear]')) { s.prog = []; s.run = null; draw(); return true; }
      const b = q('[data-hl-budget]'); if (b) { s.budget = +b.dataset.hlBudget; s.run = null; draw(); return true; }
      if (q('[data-hl-run]')) { runIt(); return true; }
      return false; },
    input(e) { const s = st();
      const n = e.target.closest('[data-hl-n]'); if (n) { const x = s.prog[+n.dataset.hlN]; if (x) x.n = +n.value; s.run = null; draw(); return true; }
      return false; }
  };
}
