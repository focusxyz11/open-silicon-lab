/* Listen and tell, the ear test at the block (kind 'listen', challenge 'ear', #316; on for everyone since #317). The picture is
   hidden; the lab plays the block in one of four states made from the engines (src/engines/listen.js: busy and
   healthy, waiting on memory, too hot with bits going wrong, saving power) and asks which. Once answered, the picture
   shows and lights in time with the same sound, so the ear learns what it heard. Won by eight right of the last ten;
   the card shows the learner's own run of answers getting better. The sound is src/v2/sound.js, the picture
   src/v2/listen.js. The state being played is on the instrument (data-ear-state), so a test can play it without audio.
   lab(L) gets the player's pieces and returns { draw, click, input }. */
import * as Ln from '../../engines/listen.js';
import { svgOf, light } from '../listen.js';
import * as Sound from '../sound.js';

const LEVEL = 'block', CLIP = 12;

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const E = () => view.ear || (view.ear = { cur: null, answered: false, pick: null, hist: [], seed: 1 + Math.floor(Math.random() * 9999), heard: true });
  const oks = () => E().hist.map(h => h.ok);
  /* the run of answers: one column each, right or wrong, as tall as the share right of the last ten at that answer */
  function run() {
    const H = E().hist, n = Math.max(10, H.length), W = 300, Hh = 64, w = W / n;
    if (!H.length) return '';
    const col = (h, i) => { const share = Ln.rightOfLast(H.slice(0, i + 1).map(x => x.ok)) / Ln.EAR.last, y = Hh - 6 - share * (Hh - 12);
      return '<rect x="' + (i * w + w * 0.18).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (w * 0.64).toFixed(1) + '" height="' + (Hh - 4 - y).toFixed(1) + '" rx="2" class="' + (h.ok ? 'ok' : 'no') + '"/>'; };
    const goal = Hh - 6 - Ln.EAR.right / Ln.EAR.last * (Hh - 12);
    return '<figure class="earrun"><svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(t('ear.runAria', { right: Ln.rightOfLast(oks()), n: Math.min(H.length, Ln.EAR.last) })) + '">' +
      '<line x1="0" x2="' + W + '" y1="' + goal.toFixed(1) + '" y2="' + goal.toFixed(1) + '" class="goal"/>' + H.map(col).join('') + '</svg><figcaption class="small muted">' + esc(t('ear.run')) + '</figcaption></figure>';
  }
  function body() {
    const X = E(), right = Ln.rightOfLast(oks()), won = !!S.done[ch.id] || Ln.earWon(oks()), hidden = !X.cur || !X.answered;
    let h = head();
    h += '<div class="goalbox' + (won ? ' ok' : '') + '" data-f2="goal"><div class="gauge' + (won ? ' ok' : '') + '"><span class="gl">' + esc(t('ear.g.right')) + '</span><span class="gv">' + esc(t('ear.g.of', { n: right, goal: Ln.EAR.right })) + '</span><span class="gbar"><span style="width:' + Math.min(100, right / Ln.EAR.right * 100).toFixed(0) + '%"></span></span></div></div>';
    /* the picture: hidden (and showing nothing of the answer) until answered; then the state's own, lit in time */
    h += '<figure class="earfig' + (hidden ? ' hid' : '') + '" data-f2="instrument" data-ear-state="' + esc(X.cur || '') + '">' + svgOf(LEVEL, hidden ? 'saving' : X.cur, true, 'role="img" aria-label="' + esc(t(hidden ? 'ear.hidAria' : 'ear.picAria', { state: X.cur ? t('hear.state.' + X.cur) : '' })) + '"') +
      (hidden ? '<div class="earcover"><span class="lsnwave big" aria-hidden="true"><i></i><i></i><i></i></span><b>' + esc(t(X.cur ? 'ear.cover' : 'ear.start')) + '</b></div>' : '') + '</figure>';
    h += '<p class="small muted">' + esc(t('hear.scale.' + LEVEL)) + '</p>';
    h += '<button type="button" class="btn' + (X.cur && !X.answered ? '' : ' primary') + ' earplay" data-ear-play>' + esc(t(!X.cur ? 'ear.play' : X.answered ? 'ear.next' : 'ear.again')) + '</button>';
    h += '<div class="earans" role="group" aria-label="' + esc(t('ear.ask')) + '">' + Ln.STATES.map(s => { const c = X.answered ? (s === X.cur ? ' right' : s === X.pick ? ' wrong' : '') : '';
      return '<button type="button" class="chipb' + c + '" data-ear-ans="' + s + '"' + (X.cur && !X.answered ? '' : ' disabled') + '>' + esc(t('hear.state.' + s)) + '</button>'; }).join('') + '</div>';
    if (X.answered) h += '<p class="small ' + (X.pick === X.cur ? 'good' : 'bad') + ' earsay">' + esc(t(X.pick === X.cur ? 'ear.right' : 'ear.wrong', { state: t('hear.state.' + X.cur) })) + ' ' + esc(t('ear.why.' + X.cur)) + '</p>';
    if (!X.heard) h += '<p class="small hint">' + esc(t('ear.nosound')) + '</p>';
    h += run();
    h += view.hint ? '<p class="small hint">' + esc(t('ear.hint')) + '</p>' : won ? '' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    return h + doneNote() + reward();
  }
  /* the sound of a state, lit on the picture once it shows; it stops when the card leaves */
  const fig = () => el.querySelector('.earfig:not(.hid) svg');
  function sound() {
    const X = E(), sc = Ln.score(X.cur, CLIP, X.seed + X.hist.length, LEVEL);
    if (Sound.current() === 'ear') Sound.swap(sc);
    else X.heard = Sound.start(sc, { tag: 'ear', onEvent: e => { if (E().answered) light(fig(), e, Sound.voices()); } }) || Sound.heard();
    if (!view.earWatch) { view.earWatch = setInterval(() => { if (!el.isConnected || !el.querySelector('.player[data-ch="' + ch.id + '"]')) { clearInterval(view.earWatch); view.earWatch = 0; Sound.stop(); } }, 300); }
  }
  return {
    draw: body,
    click(e) {
      const q = s => e.target.closest(s), X = E();
      if (q('[data-ear-play]')) {
        /* a new clip after an answer; the same one again while it waits for one */
        if (!X.cur || X.answered) { X.cur = Ln.pick(X.seed, X.hist.map(h => h.s)); X.answered = false; X.pick = null; }
        sound(); draw(); fx(); return true;
      }
      const a = q('[data-ear-ans]'); if (a && X.cur && !X.answered) {
        X.pick = a.dataset.earAns; X.answered = true; X.hist.push({ s: X.cur, a: X.pick, ok: X.pick === X.cur }); if (X.hist.length > 60) X.hist.shift();
        if (Ln.earWon(oks())) win();
        draw(); fx(); return true;
      }
      return false;
    },
    input() { return false; }
  };
}
