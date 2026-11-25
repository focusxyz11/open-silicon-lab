/* The studio, walked inside (src/v2/studio3d.js, #267): from the island's building, down into the room, corner by
   corner, each corner's screen opening into its bench.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t } from '../../core/i18n.js';
import * as Way from '../../engines/way.js';
import { stopsAt } from '../../data/places.js';
import { VIEW_PARTS, sizeOf } from '../../data/atlas.js';
import { cornerOf as studioCorner } from '../../data/studio.js';
import { V, $, showStage, esc } from '../shell.js';

export function create() {
  Object.assign(V, { showStudio });
  let sw = null, swP = null, SW = null, swGoing = false;
  const ensureSw = () => swP || (swP = import('../studio3d.js').then(m => { SW = m; sw = m.createStudio($('studioCanvas'), $('studioLabels'), { level: lv => swUI(lv),
    portal: p => { if (V.swFrame && !V.sui.hidden) V.swFrame.inwardAt(p); }, beyond: () => swIn(), swipe: d => { if (!V.sui.hidden && sw) sw.go(V.swLv + d); },
    /* where the walk is, on the section, to a tenth of a stop (what the smoke test reads to see the flight come in) */
    depth: z => { const v = z.toFixed(1); if (V.sui.dataset.at !== v) V.sui.dataset.at = v; } }); return sw; }));
  function swUI(lv) {
    V.swLv = lv; if (!V.swFrame) return; const step = lv ? SW.STOPS[lv] : null, lvl = step && Way.levelOfStep('bench', step), R = Way.levelsOfSteps('bench');
    V.swFrame.steps(step); V.swFrame.rail(lvl, lvl ? R.indexOf(lvl) / (R.length - 1) : 0); V.swFrame.level(step); V.here();
    if (V.swFrame.mode() === 'look') drawRoom();
  }
  function drawRoom() {
    const lv = V.swLv, id = SW.STOPS[lv], last = lv === SW.STOPS.length - 1, nm = d => t('depth.' + d + '.name');
    const sp = lv ? studioCorner(id).screen.part : null, pw = sp ? t('part.' + VIEW_PARTS.studio[sp]) : '';
    V.swFrame.dock.innerHTML = V.lineHtml(t('room.title') + (lv ? ' · ' + nm(id) : ''), t('room.' + id + '.d'), lv ? stopsAt(id)[0] : null, V.aroundRow(
      lv > 1 ? '<button type="button" class="chipb" data-key="back" data-swgo="' + (lv - 1) + '">← ' + esc(nm(SW.STOPS[lv - 1])) + '</button>' : '',
      last ? '<a class="chipb" data-along href="#/line/print">' + esc(t('bench.toFab')) + '</a>' : '<button type="button" class="chipb" data-key="next" data-along data-swgo="' + (lv + 1) + '">→ ' + esc(nm(SW.STOPS[lv + 1])) + '</button>',
      lv ? '<a class="chipb" data-in data-swin data-inname="' + esc(pw) + '" href="#/bench/' + id + '">↓ ' + esc(pw) + '</a>' : ''));
    /* what this corner's screen is, from its one home in the atlas */
    if (sp) V.swFrame.dock.querySelector('.nav').insertAdjacentHTML('beforebegin', '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2"><li><button type="button" data-swin><b>' + esc(pw) + '</b><span>' + esc(t('what.' + VIEW_PARTS.studio[sp])) + '</span></button></li></ul></div>');
  }
  /* the handoff: the camera settles on the screen until it fills the picture, and the bench opens from there */
  function swIn() {
    if (swGoing || V.sui.hidden || !sw) return; const lv = Math.round(sw.z); if (lv < 1) return; swGoing = true; V.sui.dataset.handoff = SW.STOPS[lv];
    const rn = V.routeN; sw.handoff().then(p => { swGoing = false; delete V.sui.dataset.handoff; if (V.sui.hidden || rn !== V.routeN) return; V.portalAt(p); V.nextMove = 'in'; location.hash = '#/bench/' + SW.STOPS[lv]; });
  }
  function showStudio(lv, from) {
    V.hideAll();
    $('studioCanvas').hidden = $('studioLabels').hidden = false; V.sui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = 'studio';
    const fromIsland = V.arriving, rn = V.routeN; V.arriving = false;
    /* made while the visitor moved on (#365): left paused, and its frame not drawn */
    return Promise.all([V.withFrame(), ensureSw()]).then(([, d]) => { if (rn !== V.routeN) { if (V.sui.hidden) d.pause(); return; }
      const n = Math.max(0, Math.min(SW.STOPS.length - 1, lv || 0));
      V.swFrame = V.frameOf(V.sui, { up: { href: '#/place/studio', label: t('place.back') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/studio', label: t('map.studio.t') }, { label: t('room.title') }],
        rail: { label: t('frame.levels.bench'), optional: true, items: Way.levelsOfSteps('bench').map(k => ({ id: k, label: t('depth.' + k + '.name'), size: sizeOf(k) })) },
        steps: { label: t('frame.steps.bench'), items: Way.stepsOf('bench').map(k => ({ id: k, label: t('depth.' + k + '.name') })) },
        onStep: k => d.go(SW.STOPS.indexOf(k)), onRail: k => { const s = Way.stepOfLevel('bench', k, SW.STOPS[V.swLv]); if (s) d.go(SW.STOPS.indexOf(s)); }, onLook: drawRoom, scroll: true, caption: true });
      V.sui.onclick = e => { const g = e.target.closest('[data-swgo]'); if (g) d.go(+g.dataset.swgo); const a = e.target.closest('[data-swin]'); if (a) { e.preventDefault(); swIn(); } };
      V.loading(false); d.resume();
      /* from the island the flight comes down through the opened floor; back from a bench, it starts on that corner's screen */
      if (from === 'bench' && n >= 1) d.back(n); else if (fromIsland) { d.jump(0); d.go(n || 1); } else d.jump(n);
      swUI(Math.round(d.z)); $('studioCanvas').focus({ preventScroll: true });
    });
  }
  const hideSw = () => { $('studioCanvas').hidden = $('studioLabels').hidden = true; V.sui.hidden = true; if (sw) sw.pause(); };
  Object.assign(V, { hideSw });
}
