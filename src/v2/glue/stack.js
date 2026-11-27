/* The glue of Your stack (#/stack, #/stack/<rung>, #/stack/field; docs/PATH.md step 4): loaded when the view first
   opens, with its words (the stack area, and the frame's) and its styles (src/styles/stack.css). It makes the view
   (src/v2/stack/view.js, fetched here) over the stage, hides the other views while it shows, and hides it again when
   the address leaves it. The population it draws comes from the community's ledger (the attempts at an architecture
   kept there, grown again by the engine); the stepping stones from the challenges you have won. */
import { V, $ } from '../shell.js';
import * as Game from '../game.js';
import { still } from '../../core/ui.js';
import { INVENT } from '../../data/path.js';

const here = () => /^#\/stack(\/|$)/.test(location.hash);
export function create() {
  let view = null, el = null;
  window.addEventListener('hashchange', () => { if (view && !here()) view.hide(); });
  V.showStack = at => import('../stack/view.js').then(m => {
    if (!here()) return;
    V.hideAll(); V.loading(false);
    if (!el) { el = document.createElement('section'); el.className = 'stackv'; el.id = 'stackv'; $('stage').appendChild(el); }
    if (!view) {
      const W = () => Game.world(V.S);
      view = m.createStack(el, { still,
        arch: () => (W().arch || []).map(id => W().byId[id].arch),
        done: () => V.S.done || {},
        inv: rung => (INVENT[rung] || []).map(Game.challengeOf).filter(Boolean).map(c => ['#/do/' + c.id, Game.titleOf(c)]) });
    }
    view.show(at);
  });
}
