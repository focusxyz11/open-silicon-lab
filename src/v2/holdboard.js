/* The twelve challenges of the first page, as one board (src/v2/holdkit.js opens it from the count in the bar; fetched
   when it is first asked for; styles: src/styles/holdnotes.css). One path in the order of the story: twelve marks on a
   line, square where the challenge is played on the square or a block of the chip, round where it is played on Moore's
   law, each lit once done, with where the visitor is now marked between them. One challenge is open at a time: what
   you do there, its question (one, never a row of them), where it is played for real in the lab, and the place on the
   island it lights. Every connection shown is one the page already has (src/data/hold.js, the plates' words, LIT in
   src/v2/holdplates.js): none is drawn that does not exist. Nothing is locked: a tap goes there.
   board(root, go, state): go(id) flies to where a challenge is played; state() → { d, cur, yrs }. */
import { needStyles } from '../core/styles.js';
import { w, Q, h, S, PW, ORDER, onChange, LIVE } from './holdkit.js';
import { CHALS, CH_AT, DWALL, MOMENTS, yearShown } from '../data/hold.js';

/* the place on the island each lights, as the island's plan draws it (LIT, src/v2/holdplates.js) */
const LITS = { job: 'studio', light: 'fab', bug: 'test', walls: 'datacentre', keep: 'lab' };
/* what a challenge is: where it stands in the story, what you do, its question, where it is played for real */
function spec(id) {
  const m = MOMENTS.find(x => x.id === id), [pid, d] = CH_AT[id];
  if (m) return { at: yearShown(m.at), on: 'sq', p: w('mo.' + id + '.q'), q: m.q, lab: [w('mo.' + id + '.lab'), m.lab] };
  if (pid === 'years') return { at: yearShown(d), on: 'cv', p: w('cq.' + id) };
  const P = PW[pid], walls = id === 'walls';
  return { at: walls ? w('tab.walls') : P.name(), on: 'sq', p: walls ? w('board.walls') : w(P.tryq), q: walls ? null : P.q, lab: walls || !P.lab ? null : [w('play') + ': ' + w(P.lab[0]), P.lab[1]] };
}
/* how far along the story a challenge, or the visitor, is: the count through the fifty years, then block by block */
const along = id => { const [pid, d] = CH_AT[id]; return pid === 'years' ? d : DWALL + 1 + ORDER.indexOf(pid); };
/* the twelve in the order the story meets them */
const LINE = CHALS.slice().sort((a, b) => along(a) - along(b));

let el = null, repaint = null;
onChange(() => { if (el && repaint) repaint(); });
export function close() { if (!el) return; el.remove(); el = null; repaint = null; }
export function board(root, go, state) {
  if (el) { close(); return; }
  needStyles('holdnotes');
  const st = state(), now = st.yrs ? st.d : DWALL + 1 + ORDER.indexOf(st.cur), n = LINE.length;
  /* where you are: before the first challenge still ahead */
  let here = LINE.findIndex(id => along(id) > now + (st.yrs ? .05 : -.5)); if (here < 0) here = n;
  let sel = LINE[Math.min(n - 1, here)]; { const next = LINE.slice(here).find(id => !S.done[id]); if (next) sel = next; }
  el = h('div', 'h-board'); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', w('board.h'));
  const pane = h('div', 'hb-pane'), nYears = LINE.filter(id => CH_AT[id][0] === 'years').length;
  const hereAt = '<span class="hb-here mono' + (here > n - 2 ? ' end' : '') + '" style="left:' + (here / n * 100).toFixed(2) + '%">' + w('board.here') + '</span>';
  pane.innerHTML = '<header><div><h2 class="anton">' + w('board.h') + '</h2><p>' + w('board.p') + '</p></div><div class="hb-top mono"><span class="hb-count"></span><button type="button" class="bbtn mono" data-x="1">' + w('close') + ' ✕</button></div></header>' +
    '<div class="hb-path" style="--n:' + n + ';--ny:' + nYears + '"><div class="hb-zones mono"><span>' + w('board.g.years') + '</span><span>' + w('board.g.chip') + '</span></div><div class="hb-line">' +
    LINE.map((id, i) => { const sp = spec(id); return (i === here ? hereAt : '') + '<button type="button" class="hb-n ' + sp.on + '" data-ch="' + id + '"><i>' + String(i + 1).padStart(2, '0') + '</i><small class="mono">' + sp.at + '</small></button>'; }).join('') +
    (here === n ? hereAt : '') + '</div>' +
    '<p class="hb-key mono"><span><i class="sq"></i>' + w('board.k.sq') + '</span><span><i class="cv"></i>' + w('board.g.curve') + '</span><span><i class="on"></i>' + w('board.done') + '</span></p></div><div class="hb-d"></div>';
  el.appendChild(pane); root.appendChild(el);
  const det = pane.querySelector('.hb-d');
  function paint() { const done = Object.keys(S.done).length;
    pane.querySelector('.hb-count').innerHTML = '<b>' + done + '</b> / ' + n;
    pane.querySelectorAll('.hb-n').forEach(b => { const id = b.dataset.ch; b.classList.toggle('on', !!S.done[id]); b.classList.toggle('sel', id === sel); b.setAttribute('aria-pressed', id === sel ? 'true' : 'false'); b.setAttribute('aria-label', w('ch.' + id) + (S.done[id] ? ', ' + w('board.done') : '')); });
    const sp = spec(sel), i = LINE.indexOf(sel), lit = LITS[sel];
    det.innerHTML = '<div class="hb-what"><div class="w-k mono' + (S.done[sel] ? ' viol' : '') + '">' + String(i + 1).padStart(2, '0') + ' · ' + sp.at + (S.done[sel] ? ' · ' + w('board.done') : '') + '</div><h3 class="anton">' + w('ch.' + sel) + '</h3><p>' + sp.p + '</p>' +
      '<button type="button" class="hb-go" data-go="' + sel + '"><span class="wia" aria-hidden="true">→</span><b>' + w('board.go') + '</b></button></div>' +
      '<div class="hb-ties">' + (sp.q ? '<div class="hb-q"><span class="mono">' + w('board.q') + '</span><p>' + Q(sp.q) + '</p></div>' : '') +
      (sp.lab ? '<a class="lnk" href="' + sp.lab[1] + '">' + sp.lab[0] + '</a>' : '') + (lit ? '<p class="hb-lit"><i></i>' + w('board.lit', { place: w('place.' + lit) }) + '</p>' : '') + '</div>'; }
  paint(); repaint = paint;
  el.addEventListener('click', e => { const b = e.target.closest('.hb-n'), g = e.target.closest('[data-go]');
    if (b) { sel = b.dataset.ch; paint(); } else if (g) { const id = g.dataset.go; close(); go(id); } else if (e.target === el || e.target.closest('[data-x]') || e.target.closest('a.lnk')) close(); });
  const key = e => { if (!el) { removeEventListener('keydown', key, true); return; } if (!LIVE.on || e.key !== 'Escape') return; e.stopPropagation(); close(); removeEventListener('keydown', key, true); };
  addEventListener('keydown', key, true);
  (pane.querySelector('.hb-n.sel') || pane.querySelector('.hb-n')).focus({ preventScroll: true });
}
