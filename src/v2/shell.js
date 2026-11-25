/* What the shell (src/v2/app.js) and its glue (src/v2/glue/) share: V, the shared context, and a few small helpers.
   app.js keeps the router, the loop in the bar, the frame's modes, Your log's way in, Break it and the island's sheet;
   each view's glue is one module in src/v2/glue/, loaded when its view first opens (docs/ARCHITECTURE.md). */
import { THREADS } from '../data/weave.js';
import * as Game from './game.js';
import { WORLD_IDS } from '../data/worlds.js';

/* the shared context: the state the views share (the island, which view is shown, where the dive is, each view's
   frame) and the functions one part lends another. app.js fills it as it starts; a glue module adds its own when it
   loads. Until then a view's moves are stand-ins that load its glue first (app.js, waits) */
export const V = {};

export const $ = id => document.getElementById(id);
/* the one GL canvas of the 3D views (kit3d.js) shows while a 3D view is in front, and steps aside for the flat views
   and the pages. Found by its class, so the shell never imports the 3D kit: before any 3D view has opened there is
   no canvas, and nothing to hide */
export const showStage = on => { const c = document.querySelector('canvas.stage3d'); if (c) c.hidden = !on; };
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const hue = th => (THREADS.find(x => x.id === th) || { hue: 200 }).hue;
export const qColor = key => 'hsl(' + hue(key.split('.')[0]) + ' 70% 55%)';
/* following a question stays in the chip world: its trail walks from view to view (Game.askHref) */
export const follow = key => Game.askHref(key);
/* following a question from a card opens it in its world (#/w/<world>/at/<depth>): the question as it was met at its
   place, with what is tried and asked there, then the world it belongs to. Its marks inside a picture still open it
   in the picture (follow). */
export const followW = key => { const [th, d] = key.split('.'); return WORLD_IDS.includes(th) ? '#/w/' + th + '/at/' + d : Game.askHref(key); };
/* where you have been, for the Map (src/v2/glue/pages.js): the addresses arrived at in this browser (src/v2/app.js,
   arrive), the newest 400; an address under a place (#/place/datacentre/3) marks the place too */
export const been = h => { try { const B = JSON.parse(localStorage.getItem('osl-been') || '{}'), add = x => { delete B[x]; B[x] = 1; }, pl = /^#\/place\/[a-z]+(?=\/)/.exec(h);
  if (pl) add(pl[0]); add(h); const K = Object.keys(B); K.slice(0, Math.max(0, K.length - 400)).forEach(x => { delete B[x]; }); localStorage.setItem('osl-been', JSON.stringify(B)); } catch (e) { /* no storage */ } };
