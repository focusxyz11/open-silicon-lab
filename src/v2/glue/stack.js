/* The glue of Your stack (#/stack, #/stack/<rung>, #/stack/field; docs/PATH.md step 4): loaded when the view first
   opens, with its words (the stack area, and the frame's) and its styles (src/styles/stack.css). It makes the view
   (src/v2/stack/view.js, fetched here) over the stage, hides the other views while it shows, and hides it again when
   the address leaves it. The population it draws comes from the community's ledger (the attempts at an architecture
   kept there, with who made them and their credit, grown again by the engine; #448); each rung's stepping stones are the
   challenges on it (src/engines/path.js rungOfChallenge), the ones you have won inked. It wears the lab's one frame and
   card (src/v2/stack/card.js, #447): the questions that live at a level come from the frame's lenses (V.lensIds), each
   opened alone by the frame's own card. The address may say a face along the chip's life before the rung
   (#/stack/design/gate, #/stack/make; as used if none, #456): the view turns every plate to it, and tells the bar when
   it moves the address itself, so the loop lights the stage. */
import { V, $ } from '../shell.js';
import * as Game from '../game.js';
import { still } from '../../core/ui.js';
import { rungOfChallenge } from '../../engines/path.js';
import { purposesOf } from '../../engines/ledger.js';
import * as Arch from '../../engines/arch.js';
import { keep, signHtml, signOf, slipHtml, slipClick, refusal } from '../commons.js';

const here = () => /^#\/stack(\/|$)/.test(location.hash);
export function create() {
  let view = null, el = null;
  window.addEventListener('hashchange', () => { if (view && !here()) view.hide(); });
  V.showStack = () => Promise.all([import('../stack/view.js'), import('../stack/card.js'), V.withFrame()]).then(([m, C]) => {
    if (!here()) return;
    V.hideAll(); V.loading(false);
    if (!el) { el = document.createElement('section'); el.className = 'stackv'; el.id = 'stackv'; $('stage').appendChild(el); }
    if (!view) {
      const W = () => Game.world(V.S), ON = {}, o = { still, lensesAt: V.lensIds,
        entries: () => (W().arch || []).map(id => W().byId[id]), over: () => (W().archOver || []).length,
        genome: () => Game.genomeOf(V.S),
        /* purposes (#481): the proposed ones (yours among them, as drafts), what the engine checks a new one against, and
           the way to keep one as your draft and send it */
        purposes: () => purposesOf(W()),
        purposeCtx: () => { const w = W(), P = purposesOf(w); return { ids: P.all.concat(P.past).map(e => e.purpose), wants: P.all.map(e => Arch.wantKey(Arch.wantOf(e))), states: (w.arch || []).map(id => w.archState[id]).filter(Boolean) }; },
        signHtml: () => signHtml(V.S),
        keepPurpose: (fields, box) => { const r = keep(V.S, fields, 'purpose ' + fields.purpose, signOf(box)); if (r.ok) V.save(); return { ok: r.ok, why: r.ok ? '' : refusal(r.r), slip: r.ok ? slipHtml(V.S, r.e.id) : '' }; },
        slipClick: (ev, done) => slipClick(ev, V.S, redraw => { V.save(); done(redraw); }),
        done: () => V.S.done || {},
        moved: () => V.hud(),
        stones: rung => (ON[rung] || []).map(c => ({ id: c.id, href: '#/do/' + c.id, title: Game.titleOf(c), won: Game.isDone(V.S, c.id) })) };
      Game.CHALLENGES.forEach(c => { const r = rungOfChallenge(c.id); if (r) (ON[r] = ON[r] || []).push(c); });
      view = m.createStack(el, o);
      /* the lab's one frame and card, worn by the stack (#447) */
      o.card = C.wear(V, el, view, { stones: o.stones });
    }
    const p = location.hash.split('/').slice(2), face = /^(design|make|use)$/.test(p[0]) ? p.shift() : 'use';
    view.show(p[0], face);
  });
}
