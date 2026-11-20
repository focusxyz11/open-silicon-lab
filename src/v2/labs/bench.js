/* The bench's own challenges (#269), each played on the bench where it lives, on the design it is about, and checked
   by src/engines/bench.js:
     piece   at the job: pick a piece of the community's computer, then say what it must answer, three patterns in a row;
     floor   at the layout: the 2-bit adder's cells come scrambled; swap them until the wire is as short as the placer's;
     maskof  at the masks: which mask is this shape printed from? Five right in a row.
   The picture is the bench itself (src/v2/bench.js, handed in as ctx.bench): over the studio's picture in today's
   frame, and as this card's instrument in Do mode (data-f2="instrument"). A lab of the challenge player (src/v2/play.js). */
import * as X from '../../engines/bench.js';
import { benchPieceOf } from '../game.js';

export default function lab(L) {
  const { S, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view, BK = ctx.bench;
  if (!BK) return { draw: () => head() + '<p class="small muted">' + esc(t('bench.lab.away')) + '</p>', click: () => false, input: () => false };
  /* every change on the bench redraws this card, while it is this challenge's */
  const off = BK.listen(() => { if (!el.querySelector('.player[data-ch="' + ch.id + '"]')) return off(); check(); draw(); fx(); });
  el.onpointerdown = e => BK.down(e); el.onpointermove = e => BK.move(e); el.onpointerup = e => BK.up(e);
  const inst = () => '<div class="benchinst" data-f2="instrument">' + BK.html(ch.at, { inst: true }) + '</div>';
  const gauge = (label, v, goal, ok, f) => '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p><div class="gauge' + (ok ? ' ok' : '') + '"><span class="gl">' + esc(label) + '</span><span class="gv">' + esc(v) + ' <span class="muted">' + esc(goal) + '</span></span><span class="gbar"><span style="width:' + Math.round(Math.max(0, Math.min(1, f)) * 100) + '%"></span></span></div></div>';

  /* ---- what has been met: each draw checks again, so a win is never missed ---- */
  function check() {
    if (S.done[ch.id]) return;
    if (ch.kind === 'floor') { const D = BK.now(), Lo = BK.layoutOf(D); if (Lo && !Lo.failed && Lo.wl <= X.floorGoal(D.B)) win(); }
    if (ch.kind === 'maskof' && S.bench.mq.run >= X.MASK_STREAK) win();
    if (ch.kind === 'piece') { const D = BK.now(), need = Math.min(3, X.jobAsk(D.p, 0).length); if (S.bench.jq.run >= need && benchPieceOf(D.p)) win(); }
  }

  function piece() {
    const D = BK.now(), asked = X.jobAsk(D.p, S.bench.jq.k), need = Math.min(3, asked.length), run = Math.min(S.bench.jq.run, need);
    let h = head() + gauge(t('bench.lab.piece.g'), String(run), t('bench.lab.of', { n: need }), run >= need, run / need) + inst();
    h += '<p class="small">' + esc(t('bench.lab.piece.now', { job: t('design.proj.' + D.p + '.t') })) + '</p>';
    h += '<div class="row"><button type="button" class="btn primary" data-jq-check>' + esc(t('bench.lab.piece.check')) + '</button></div>';
    if (view.jqSaid) h += '<p class="small ' + (view.jqSaid === 'right' ? 'good' : 'bad') + ' verdict">' + esc(t('bench.lab.piece.' + view.jqSaid)) + '</p>';
    return h + '<p class="small muted hint">' + esc(t('bench.lab.piece.hint')) + '</p>' + doneNote() + reward();
  }
  function floor() {
    const D = BK.now(), Lo = BK.layoutOf(D), goal = X.floorGoal(D.B), ok = Lo && !Lo.failed && Lo.wl <= goal, start = X.floorCheck(D.B, X.floorStart(D.B)).wl;
    let h = head() + gauge(t('bench.lab.floor.g'), String(Lo ? Lo.wl : '·'), t('bench.lab.floor.goal', { n: goal }), ok, Lo ? (start - Lo.wl) / Math.max(1, start - goal) : 0) + inst();
    h += '<p class="small">' + esc(t('bench.lab.floor.now', { start })) + '</p>';
    return h + '<p class="small muted hint">' + esc(t('bench.lab.floor.hint')) + '</p>' + doneNote() + reward();
  }
  function maskof() {
    const run = Math.min(S.bench.mq.run, X.MASK_STREAK);
    let h = head() + gauge(t('bench.lab.mask.g'), String(run), t('bench.lab.of', { n: X.MASK_STREAK }), run >= X.MASK_STREAK, run / X.MASK_STREAK) + inst();
    h += '<p class="kicker">' + esc(t('bench.masks.which')) + '</p><div class="chips mqpick">' + X.MASKS.map(m => '<button type="button" class="chipb" data-mq="' + m + '">' + esc(t('design.layer.' + m)) + '</button>').join('') + '</div>';
    if (view.mqSaid) h += '<p class="small ' + (view.mqSaid.ok ? 'good' : 'bad') + ' verdict">' + esc(t(view.mqSaid.ok ? 'bench.lab.mask.right' : 'bench.lab.mask.wrong', { was: t('design.layer.' + view.mqSaid.was) })) + '</p>';
    return h + '<p class="small muted hint">' + esc(t('bench.lab.mask.hint')) + '</p>' + doneNote() + reward();
  }
  const drawIt = () => { check(); return ch.kind === 'piece' ? piece() : ch.kind === 'floor' ? floor() : maskof(); };

  function click(e) {
    const q = s => e.target.closest(s);
    if (q('[data-jq-check]')) {
      const D = BK.now(), asked = X.jobAsk(D.p, S.bench.jq.k), k = asked[S.bench.jq.run % asked.length], right = X.jobRight(D.p, k, S.bench.jq.ans);
      if (right) S.bench.jq.run++; else { S.bench.jq.run = 0; S.bench.jq.k++; }
      S.bench.jq.ans = {}; view.jqSaid = right ? 'right' : 'wrong'; ctx.save(); BK.changed(); return true;
    }
    const m = q('[data-mq]'); if (m) {
      const D = BK.now(), Lo = BK.layoutOf(D), sh = Lo && X.maskAsk(X.maskShapes(Lo.PL, Lo.RT), S.bench.mq.k), ok = X.maskRight(sh, m.dataset.mq);
      S.bench.mq.run = ok ? S.bench.mq.run + 1 : 0; S.bench.mq.k++; view.mqSaid = { ok, was: sh ? sh.mask : m.dataset.mq }; ctx.save(); BK.changed(); return true;
    }
    if (BK.click(e)) return true;
    return false;
  }
  return { draw: drawIt, click, input: e => BK.input(e) };
}
