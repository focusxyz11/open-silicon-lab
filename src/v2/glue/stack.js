/* The glue of Your stack (#/stack, #/stack/<rung>, #/stack/field; docs/PATH.md step 4): loaded when the view first
   opens, with its words (the stack area, and the frame's) and its styles (src/styles/stack.css). It makes the view
   (src/v2/stack/view.js, fetched here) over the stage, hides the other views while it shows, and hides it again when
   the address leaves it. The population it draws comes from the community's ledger (the attempts at an architecture
   kept there, grown again by the engine); each rung's stepping stones are the challenges on it (src/engines/path.js
   rungOfChallenge), the ones you have won inked. The address may say a face along the chip's life before the rung
   (#/stack/design/gate, #/stack/make; as used if none, #456): the view turns every plate to it, and tells the bar when
   it moves the address itself, so the loop lights the stage. */
import { V, $ } from '../shell.js';
import * as Game from '../game.js';
import { still } from '../../core/ui.js';
import { rungOfChallenge } from '../../engines/path.js';

const here = () => /^#\/stack(\/|$)/.test(location.hash);
export function create() {
  let view = null, el = null;
  window.addEventListener('hashchange', () => { if (view && !here()) view.hide(); });
  V.showStack = () => import('../stack/view.js').then(m => {
    if (!here()) return;
    V.hideAll(); V.loading(false);
    if (!el) { el = document.createElement('section'); el.className = 'stackv'; el.id = 'stackv'; $('stage').appendChild(el); }
    if (!view) {
      const W = () => Game.world(V.S), ON = {};
      Game.CHALLENGES.forEach(c => { const r = rungOfChallenge(c.id); if (r) (ON[r] = ON[r] || []).push(c); });
      view = m.createStack(el, { still,
        arch: () => (W().arch || []).map(id => W().byId[id].arch),
        done: () => V.S.done || {},
        moved: () => V.hud(),
        stones: rung => (ON[rung] || []).map(c => ({ id: c.id, href: '#/do/' + c.id, title: Game.titleOf(c), won: Game.isDone(V.S, c.id) })) });
    }
    const p = location.hash.split('/').slice(2), face = /^(design|make|use)$/.test(p[0]) ? p.shift() : 'use';
    view.show(p[0], face);
  });
}
