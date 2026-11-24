/* Compute without erasing (kind 'reversible', at the switch), from src/engines/paradigms.js: the core question "Fight
   or use physics". An ordinary gate takes more bits in than it gives out, so it erases some, and physics charges at
   least kT ln 2 of heat for every bit erased (Landauer; the floor, src/engines/floor.js). A Toffoli gate keeps every
   bit: it flips its target only when its controls are 1, and run twice it undoes itself. Here the player first guesses
   whether a circuit that erases nothing can go under that floor, then builds a full adder of Toffoli gates on four
   wires (the half adder is drawn to start with) and sets how slowly each step ramps its wire: switched at once a wire
   loses half its charge's energy, ramped slowly it loses less the slower it goes, and time is the price.
   The goal is the engine's own check (checkReversibleAdder): the gates add, each step loses 100 times less than
   switching at once (checkReversibleLimit), and no faster ramp would do it.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as P from '../../engines/paradigms.js';
import { BASE_GHZ } from '../../engines/floor.js';

export const COLS = 6, RIGHT = 1;                  // the gates' places along the wires; the guess that holds
/* the half adder, to start with: the spare wire gets a AND b, then b becomes a XOR b */
export const START_COLS = [['c', 'c', '', 't'], ['c', 't', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']];
export const START = { ramp: 0, row: 7 };
const ROLES = ['', 'c', 't'];
/* a column's roles as a gate: null when empty, { bad } when it is no gate (not one target, or more than two controls) */
export function gatesOf(cols) {
  return cols.map(col => { const t = [], c = []; col.forEach((r, w) => { if (r === 't') t.push(w); else if (r === 'c') c.push(w); });
    return !t.length && !c.length ? null : t.length === 1 && c.length <= 2 ? { t: t[0], c } : { bad: true }; });
}
export const validGates = cols => gatesOf(cols).filter(g => g && !g.bad);
/* the settings the engine checks */
export const stateOf = o => ({ gates: validGates(o.cols), ramp: o.ramp });
/* the bits on each wire after each column, for one input row */
export function flowOf(cols, input) { const out = [input.slice()]; gatesOf(cols).forEach(g => out.push(g && !g.bad ? P.revStep(out[out.length - 1], g) : out[out.length - 1].slice())); return out; }

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.rev || (view.rev = Object.assign({ cols: START_COLS.map(c => c.slice()), guess: null }, START));
  const lim = i => i >= 0 && i < P.RAMPS.length && P.checkReversibleLimit({ log10Time: Math.log10(P.RAMPS[i]), V: P.REV_V });
  const num = (v, d = 0) => v.toLocaleString('en', { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const sig = v => v >= 100 ? num(v) : v >= 10 ? num(v, 0) : v >= 1 ? num(v, 1) : num(v, 2);
  /* energies in joules, as a femto-, atto- or zeptojoule */
  const joule = v => v >= 1e-15 ? t('rev.u.fj', { v: sig(v * 1e15) }) : v >= 1e-18 ? t('rev.u.aj', { v: sig(v * 1e18) }) : t('rev.u.zj', { v: sig(v * 1e21) });
  const time = s => s >= 1e-6 ? t('rev.u.us', { v: sig(s * 1e6) }) : s >= 1e-9 ? t('rev.u.ns', { v: sig(s * 1e9) }) : t('rev.u.ps', { v: sig(s * 1e12) });

  /* the picture: four wires, the gates on them, and the bits of one input row flowing left to right */
  function figure(o, A, row) {
    const W = 330, H = 200, Y = [34, 76, 118, 160], X0 = 62, X1 = 282, cx = i => 92 + i * 34, G = gatesOf(o.cols), F = flowOf(o.cols, A.rows[row].in);
    const xs = [X0].concat(Array.from({ length: COLS }, (_, i) => cx(i)), [X1]);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('rev.aria', { n: A.right, g: validGates(o.cols).length })) + '">';
    /* each wire, lit where it carries a 1 */
    for (let w = 0; w < P.REV_WIRES; w++) {
      s += '<text class="ax" x="' + (X0 - 16) + '" y="' + (Y[w] + 3.5) + '" text-anchor="end">' + esc(t('rev.wire.' + w)) + '</text>';
      for (let k = 0; k <= COLS; k++) s += '<line class="w' + (F[k][w] ? ' on' : '') + '" x1="' + xs[k] + '" x2="' + xs[k + 1] + '" y1="' + Y[w] + '" y2="' + Y[w] + '"/>';
      const bit = (x, v, cls) => '<rect class="bit' + (v ? ' on' : '') + cls + '" x="' + (x - 8) + '" y="' + (Y[w] - 8) + '" width="16" height="16" rx="4"/><text class="bv' + (v ? ' on' : '') + '" x="' + x + '" y="' + (Y[w] + 3.8) + '" text-anchor="middle">' + v + '</text>';
      s += bit(X0, F[0][w], '') + bit(X1, F[COLS][w], '');
      const tag = w === A.sumWire ? 'sum' : w === A.carryWire ? 'carry' : '';
      if (tag && A.right) s += '<text class="tag' + (A.ok ? ' ok' : '') + '" x="' + (X1 + 13) + '" y="' + (Y[w] + 3.5) + '">' + esc(t('rev.out.' + tag)) + '</text>';
    }
    /* the gates: a line joining a gate's wires, a dot for each control, a ringed plus for the target (lit when it flips) */
    G.forEach((g, i) => {
      const x = cx(i), col = o.cols[i], used = col.map((r, w) => (r ? Y[w] : null)).filter(v => v != null), fires = g && !g.bad && g.c.every(c => F[i][c]);
      if (used.length > 1) s += '<line class="gl' + (g && g.bad ? ' bad' : '') + '" x1="' + x + '" x2="' + x + '" y1="' + Math.min(...used) + '" y2="' + Math.max(...used) + '"/>';
      col.forEach((r, w) => {
        if (r === 'c') s += '<circle class="ctl' + (g && g.bad ? ' bad' : '') + '" cx="' + x + '" cy="' + Y[w] + '" r="4.6"/>';
        else if (r === 't') s += '<circle class="tgt' + (g && g.bad ? ' bad' : fires ? ' fire' : '') + '" cx="' + x + '" cy="' + Y[w] + '" r="9"/><path class="tp' + (g && g.bad ? ' bad' : '') + '" d="M' + (x - 9) + ' ' + Y[w] + 'h18M' + x + ' ' + (Y[w] - 9) + 'v18"/>';
        else s += '<circle class="slot" cx="' + x + '" cy="' + Y[w] + '" r="2.4"/>';
      });
      if (g) s += '<text class="gn' + (g.bad ? ' bad' : '') + '" x="' + x + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(t('rev.gate.' + (g.bad ? 'bad' : g.c.length))) + '</text>';
      /* where a tap lands: one per wire and column */
      col.forEach((r, w) => { s += '<rect class="hit" data-rev-cell="' + i + ':' + w + '" data-role="' + (r || 'none') + '" x="' + (x - 16) + '" y="' + (Y[w] - 20) + '" width="32" height="40"><title>' + esc(t('rev.cell', { w: t('rev.wire.' + w), n: i + 1 })) + '</title></rect>'; });
    });
    return '<figure class="revfig" data-f2="instrument">' + s + '</svg><figcaption class="small muted">' + esc(t('rev.legend')) + '</figcaption></figure>';
  }
  function goalbox(o, A, E) {
    const ok = lim(o.ramp), least = A.ok && ok && !lim(o.ramp - 1), met = A.ok && least, faster = o.ramp > 0 ? P.revEnergy(1, P.RAMPS[o.ramp - 1]).saved : null;
    const gs = [{ k: 'rows', ok: A.ok, v: t('rev.v.rows', { n: A.right }), target: t('rev.t.rows'), f: A.right / 8 },
      { k: 'saved', ok, v: t('rev.v.saved', { v: sig(E.saved) }), target: t('rev.t.saved'), f: Math.min(1, Math.log10(E.saved) / 2) },
      { k: 'faster', ok: ok && !lim(o.ramp - 1), v: faster == null ? t('rev.none') : t('rev.v.saved', { v: sig(faster) }), target: t('rev.t.faster'), f: ok && !lim(o.ramp - 1) ? 1 : ok ? 0.5 : 0 }];
    return '<div class="goalbox' + (met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('rev.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (Math.max(0, g.f) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* every input, what it should give and what the circuit gives on the wires that come closest; a row shows on the picture */
  function table(o, A) {
    const head = ['a', 'b', 'c'].map(k => '<th>' + esc(t('rev.th.' + k)) + '</th>').join('') + '<th class="sep"></th><th>' + esc(t('rev.th.sum')) + '</th><th>' + esc(t('rev.th.carry')) + '</th><th class="sep"></th><th colspan="2">' + esc(t('rev.th.got')) + '</th><th></th>';
    return '<div class="tt revtt"><table><thead><tr>' + head + '</tr></thead><tbody>' + A.rows.map((r, k) => {
      const s = A.sumWire >= 0 ? r.out[A.sumWire] : '–', c = A.carryWire >= 0 ? r.out[A.carryWire] : '–', good = s === r.sum && c === r.carry;
      return '<tr class="' + (good ? '' : 'bad') + (k === o.row ? ' on' : '') + '" data-rev-row="' + k + '" tabindex="0">' + r.in.slice(0, 3).map(v => '<td>' + v + '</td>').join('') + '<td class="sep"></td><td>' + r.sum + '</td><td>' + r.carry + '</td><td class="sep"></td><td>' + s + '</td><td>' + c + '</td><td>' + (good ? '✓' : '✗') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  /* the energy of one addition against the time of each step, on log scales: switched at once (flat), ramped (falling),
     and the floor under an ordinary adder; the dot is where you are */
  function chart(o, n, E) {
    const W = 300, H = 158, x0 = 44, x1 = 292, y0 = 128, y1 = 12, lx = [-12, -5.5], ly = [-22.5, -14.5];
    const X = s => x0 + (Math.log10(s) - lx[0]) / (lx[1] - lx[0]) * (x1 - x0), Yj = j => y0 - (Math.log10(j) - ly[0]) / (ly[1] - ly[0]) * (y0 - y1), f = v => v.toFixed(1);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('rev.chart.aria', { e: joule(E.slow), f: joule(E.floor) })) + '">';
    [[1e-21, 'zj'], [1e-18, 'aj'], [1e-15, 'fj']].forEach(([j, u]) => { s += '<line class="grid" x1="' + x0 + '" x2="' + x1 + '" y1="' + f(Yj(j)) + '" y2="' + f(Yj(j)) + '"/><text class="ax" x="' + (x0 - 5) + '" y="' + f(Yj(j) + 3) + '" text-anchor="end">' + esc(t('rev.u.' + u, { v: 1 })) + '</text>'; });
    [[1e-12, 'ps'], [1e-9, 'ns'], [1e-6, 'us']].forEach(([v, u]) => { s += '<line class="grid" x1="' + f(X(v)) + '" x2="' + f(X(v)) + '" y1="' + y1 + '" y2="' + y0 + '"/><text class="ax" x="' + f(X(v)) + '" y="' + (y0 + 12) + '" text-anchor="middle">' + esc(t('rev.u.' + u, { v: 1 })) + '</text>'; });
    s += '<text class="ax" x="' + x1 + '" y="' + (H - 2) + '" text-anchor="end">' + esc(t('rev.chart.x')) + '</text>';
    /* under the floor: what no ordinary adder can reach */
    const fy = Yj(E.floor);
    s += '<rect class="under" x="' + x0 + '" y="' + f(fy) + '" width="' + (x1 - x0) + '" height="' + f(y0 - fy) + '"/><line class="floor" x1="' + x0 + '" x2="' + x1 + '" y1="' + f(fy) + '" y2="' + f(fy) + '"/><text class="lbl fl" x="' + (x0 + 4) + '" y="' + f(fy - 4) + '">' + esc(t('rev.chart.floor')) + '</text>';
    const ab = Yj(n * P.switchLoss(P.WIRE.C, P.REV_V));
    s += '<line class="abrupt" x1="' + x0 + '" x2="' + x1 + '" y1="' + f(ab) + '" y2="' + f(ab) + '"/><text class="lbl" x="' + x1 + '" y="' + f(ab - 4) + '" text-anchor="end">' + esc(t('rev.chart.abrupt')) + '</text>';
    let d = ''; for (let k = 0; k <= 60; k++) { const T = Math.pow(10, lx[0] + (lx[1] - lx[0]) * k / 60), e = P.revEnergy(n, T).slow; d += (k ? 'L' : 'M') + f(X(T)) + ' ' + f(Yj(e)); }
    s += '<path class="ramp" d="' + d + '"/>';
    const T = P.RAMPS[o.ramp], nx = X(T), ny = Yj(E.slow);
    s += '<line class="drop" x1="' + f(nx) + '" x2="' + f(nx) + '" y1="' + f(ny) + '" y2="' + y0 + '"/><circle class="now' + (E.slow < E.floor ? ' under' : '') + '" cx="' + f(nx) + '" cy="' + f(ny) + '" r="4.5"/>';
    return '<figure class="revchart">' + s + '</svg><figcaption class="small muted">' + esc(t('rev.chart.legend')) + '</figcaption></figure>';
  }
  function guessHtml() {
    return head() + '<p class="small revintro">' + esc(t('rev.intro')) + '</p><p class="kicker">' + esc(t('rev.predictK')) + '</p><p class="small">' + esc(t('rev.predict')) + '</p>' +
      '<div class="chips revguess">' + [0, 1, 2].map(i => '<button type="button" class="chipb" data-rev-guess="' + i + '">' + esc(t('rev.guess.' + i)) + '</button>').join('') + '</div>' + reward();
  }
  function bench() {
    const o = set(); if (o.guess == null) return guessHtml();
    const A = P.revAdder(validGates(o.cols)), n = Math.max(1, validGates(o.cols).length), E = P.revEnergy(n, P.RAMPS[o.ramp]), bad = gatesOf(o.cols).some(g => g && g.bad);
    const ok = lim(o.ramp), met = P.checkReversibleAdder(stateOf(o));
    let h = head() + '<p class="small revreveal ' + (o.guess === RIGHT ? 'good' : '') + '">' + esc(t(o.guess === RIGHT ? 'rev.right' : 'rev.wrong')) + '</p>' + goalbox(o, A, E) + figure(o, A, o.row);
    h += '<p class="small revtap">' + esc(t('rev.tap')) + '</p>' + table(o, A);
    const msg = bad ? 'bad' : !A.ok ? (A.right === 4 && validGates(o.cols).length <= 2 ? 'half' : 'rows') : met ? 'met' : !ok ? 'fast' : 'slow';
    h += '<p class="small revmsg ' + (met ? 'good' : msg === 'slow' ? '' : 'bad') + '">' + esc(t('rev.msg.' + msg, { n: A.right, v: sig(E.saved), time: time(E.time) })) + '</p>';
    h += '<div class="revdial"><label class="lab" for="rev-ramp"><b>' + esc(t('rev.set.ramp')) + '</b> <output>' + esc(time(P.RAMPS[o.ramp])) + '</output></label><div class="revstep"><button type="button" class="chipb" data-rev-nudge="-1" aria-label="' + esc(t('rev.faster')) + '">−</button><input type="range" id="rev-ramp" data-rev="ramp" min="0" max="' + (P.RAMPS.length - 1) + '" step="1" value="' + o.ramp + '"><button type="button" class="chipb" data-rev-nudge="1" aria-label="' + esc(t('rev.slower')) + '">+</button></div></div>';
    h += chart(o, n, E);
    const ticks = E.time * BASE_GHZ * 1e9;
    h += '<p class="small revsum">' + esc(t('rev.sum', { e: joule(E.slow), x: sig(E.saved), f: E.slow >= E.floor ? t('rev.sum.over', { v: sig(E.slow / E.floor) }) : t('rev.sum.under', { v: sig(E.floor / E.slow) }) })) + '</p>' +
      '<p class="small revsum">' + esc(t('rev.time', { g: validGates(o.cols).length, time: time(E.time), ticks: sig(ticks), ghz: BASE_GHZ })) + '</p>';
    h += '<div class="chips"><button type="button" class="chipb" data-rev-clear>' + esc(t('rev.clear')) + '</button></div>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('rev.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('rev.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('rev.note')) + '</p>' + doneNote() + reward();
  }
  /* a move: the engine's check on the new circuit and ramp decides */
  const after = () => { if (P.checkReversibleAdder(stateOf(set()))) win(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) {
      const q = s => e.target.closest(s), o = set();
      const g = q('[data-rev-guess]'); if (g) { o.guess = +g.dataset.revGuess; draw(); fx(); return true; }
      const c = q('[data-rev-cell]'); if (c) { const [i, w] = c.dataset.revCell.split(':').map(Number); o.cols[i][w] = ROLES[(ROLES.indexOf(o.cols[i][w]) + 1) % ROLES.length]; return after(); }
      const r = q('[data-rev-row]'); if (r) { o.row = +r.dataset.revRow; draw(); return true; }
      const n = q('[data-rev-nudge]'); if (n) { o.ramp = Math.min(P.RAMPS.length - 1, Math.max(0, o.ramp + +n.dataset.revNudge)); return after(); }
      if (q('[data-rev-clear]')) { o.cols = START_COLS.map(x => x.slice()); return after(); }
      return false;
    },
    input(e) { const r = e.target.closest('[data-rev]'); if (!r) return false; set().ramp = +r.value; return after(); }
  };
}
