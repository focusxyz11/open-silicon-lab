/* Grow an architecture that does not exist yet (kind 'arch', at the Lab): the door of its two challenges (#450). The
   lab's own race and map of 400 recipes retired into Your stack (docs/PATH.md "How it joins the lab"): the stack's
   growth bar and its field do both, and the two challenges, the family tree, the curve and keeping an attempt in the
   ledger are played in the stack's Do (src/v2/stack/grow.js). The lab as it was is kept on the branch
   claude/before-stack-2026-11.
   This door shows the challenge's goal as it stands on your stack (kept in this browser by the stack, osl-stack), and
   leads into the stack's Do; a goal already met there is won here too.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as A from '../../engines/arch.js';
import { goalHtml } from '../stack/grow.js';

const KEY = 'osl-stack', DO = 'osl-stack-do';
/* the architecture grown on your stack, or today's computer if none is kept */
function grown() {
  try { const k = JSON.parse(localStorage.getItem(KEY) || 'null'); if (k && k.A && k.A.g && A.isKey(A.keyOf(k.A.g))) return k.A; } catch (e) { /* none kept */ }
  return A.start(A.TODAY);
}

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win } = L;
  const goalId = A.GOALS[ch.id] ? ch.id : 'archniche';
  return {
    draw() {
      const st = grown(), met = A.goalOf(st, goalId).met;
      if (met && !(S.done || {})[ch.id]) win();
      return head() + '<p class="small arintro">' + esc(t('ar.intro')) + '</p>' + goalHtml(st, goalId, t('game.goalNow'), !!(S.done || {})[ch.id]) +
        '<p class="small">' + esc(t('ar.door.lead')) + '</p><a class="btn primary" href="#/stack" data-ar-stack>' + esc(t('ar.door.go')) + '</a>' + doneNote() + reward();
    },
    click(e) {
      if (e.target.closest('[data-ar-stack]')) { try { sessionStorage.setItem(DO, 'grow'); } catch (x) { /* the stack opens on Look */ } return false; }
      return false;
    },
    input() { return false; }
  };
}
