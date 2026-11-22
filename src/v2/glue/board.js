/* One board, no side panel (src/v2/board3d.js): words on the parts, and a story docked below that drives the camera
   (src/v2/story.js, src/v2/stories.js).
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t } from '../../core/i18n.js';
import { DC_LEVELS as LEVELS } from '../../data/views3d.js';
import { sizeOf } from '../../data/atlas.js';
import { V, $, showStage, esc, follow } from '../shell.js';

export function create() {
  Object.assign(V, { showBoard });
  const hideBoard = () => { $('boardCanvas').hidden = $('boardLabels').hidden = true; V.bui.hidden = true; V.board && V.board.pause(); };
  const ensureBoard = () => V.boardP || (V.boardP = import('../board3d.js').then(m => (V.board = m.createBoard($('boardCanvas'), $('boardLabels'), { part: id => story && story.part(id), dive: () => { location.hash = '#/dive/chip'; },
    inset: () => V.frameInset(V.boardFrame), portal: p => V.boardFrame && V.boardFrame.inwardAt(p) }))));
  function showBoard() {
    V.hideAll(); document.body.classList.add('immersive');
    $('boardCanvas').hidden = $('boardLabels').hidden = false; V.bui.hidden = false; showStage(true);
    V.loading(true); V.lastPlace = 'datacentre';
    return Promise.all([V.withFrame(), ensureBoard(), import('../story.js'), import('../stories.js')]).then(([, b, St, Sd]) => {
      V.loading(false); b.resume(); const data = Sd.boardStory();
      const fr = V.boardFrame = V.frameOf(V.bui, { up: { href: '#/place/datacentre/4', label: t('board.up') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/datacentre/4', label: t('map.datacentre.t') }, { label: t('place.dc.board.t') }],
        rail: { label: t('place.levels'), items: LEVELS.map(k => ({ id: k, label: t('place.dc.' + k + '.t'), size: sizeOf(k) })) },
        onRail: k => { location.hash = k === 'chip' ? '#/dive/chip' : k === 'board' ? '#/board' : '#/place/datacentre/' + LEVELS.indexOf(k); }, onLook: () => story && story.go(story.at), caption: 'plain' });
      fr.rail('board', LEVELS.indexOf('board') / (LEVELS.length - 1)); fr.level('board');
      story = St.createStory(fr.dock, b, data, { follow, step: st => wayToChip(fr, st) || fr.goal(st.live ? '<p class="kicker">' + esc(t('board.goal')) + '</p>' + data.gauges(data.state).map(x => '<div class="gauge' + (x.warm ? ' warmg' : ' ok') + '"><span class="gl">' + esc(t('board.gauge.' + x.id)) + '</span><span class="gv">' + esc(x.text) + '</span><span class="gbar"><span style="width:' + Math.round(x.v * 100) + '%"></span></span></div>').join('') : null) });
      $('boardCanvas').focus({ preventScroll: true });
    });
  }
  let story = null;
  /* the board's way in, into its chip, on every step of its story (the last step's own way on is that way) */
  const wayToChip = (fr, st) => { if (!st.end) { const nav = fr.dock.querySelector('.nav'); if (nav) nav.insertAdjacentHTML('beforebegin', '<p class="wayrow"><a class="chipb" data-in data-inname="' + esc(t('depth.chip.name')) + '" href="#/dive/chip">↓ ' + esc(t('board.end.dive')) + '</a></p>'); } return false; };
  Object.assign(V, { hideBoard, ensureBoard });
}
