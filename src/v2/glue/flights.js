/* The places flown through: the data centre (src/v2/dc3d.js), a phone (src/v2/phone3d-flight.js) and a car
   (src/v2/car3d-flight.js), each with its own canvas, card and levels.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t } from '../../core/i18n.js';
import { DC_LEVELS as LEVELS, DC_ASKS as ASKS } from '../../data/views3d.js';
import { VIEW_PARTS, sizeOf } from '../../data/atlas.js';
import { SEEK, foundAt, seekAt } from '../../data/seek.js';
import { V, $, showStage, esc } from '../shell.js';

export function create() {
  Object.assign(V, { showPlace, showPhone, showCar });
  const ensureDc = () => V.dcP || (V.dcP = import('../dc3d.js').then(m => { V.dc = m.createDataCentre($('placeCanvas'), $('placeLabels'), { level: lv => placeUI(lv), depth: z => depthBar(z),
    portal: p => V.dcFrame && V.dcFrame.inwardAt(p), beyond: () => { if (!V.pui.hidden) location.hash = '#/dive/chip'; } }); return V.dc; }));
  const DC_DEPTH = { campus: 'building', hall: 'building', rack: 'rack', server: 'rack', board: 'board', chip: 'chip' };
  let dcPick = null;
  function placeUI(lv) {
    if (lv !== V.dcLv) dcPick = null;
    V.dcLv = lv; const id = LEVELS[lv];
    $('placeLabels').classList.toggle('seeking', !!seekAt('flight', id));
    if (V.dc) V.dc.mark(dcHold());
    if (!V.dcFrame) return;
    V.dcFrame.rail(id, lv / (LEVELS.length - 1)); V.dcFrame.level(DC_DEPTH[id]); V.here();
    if (V.dcFrame.mode() === 'look') drawDc();
  }
  function drawDc() {
    const id = LEVELS[V.dcLv], last = V.dcLv === LEVELS.length - 1;
    /* what you see here: every part named on the picture at this level, and what it does; pointing at one lights it */
    const here = V.dc ? V.dc.parts(V.dcLv) : [], PF = VIEW_PARTS.flight;
    const sk = seekAt('flight', id);
    const hereHtml = sk ? V.seekHtml(sk, dcPick, true) : here.length ? '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2">' + here.map(k => '<li><button type="button" data-hl="' + k + '"><b>' + esc(t('part.' + PF[k])) + '</b><span>' + esc(t('what.' + PF[k])) + '</span></button></li>').join('') + '</ul></div>' : '';
    V.dcFrame.dock.innerHTML = V.lineHtml(t('place.dc.' + id + '.t'), t('place.dc.' + id + '.d'), ASKS[id], V.aroundRow(
      V.dcLv ? '<button type="button" class="chipb" data-key="back" data-lvgo="' + (V.dcLv - 1) + '">↑ ' + esc(t('place.dc.' + LEVELS[V.dcLv - 1] + '.t')) + '</button>' : '',
      last ? '<a class="chipb" data-key="next" data-in href="#/dive/chip">↓ ' + esc(t('place.next')) + '</a>' : '<button type="button" class="chipb" data-key="next" data-in data-lvgo="' + (V.dcLv + 1) + '">↓ ' + esc(t('place.dc.' + LEVELS[V.dcLv + 1] + '.t')) + '</button>',
      id === 'board' ? '<a class="chipb" href="#/board">' + esc(t('board.enter')) + '</a>' : ''));
    V.dcFrame.dock.innerHTML = (sk ? V.seekLit(V.dcFrame.dock.innerHTML, sk) : V.dcFrame.dock.innerHTML).replace('<div class="nav">', hereHtml + '<div class="nav">');
  }
  /* in the flight, the part kept lit on the picture: the one you tapped, else, once found, the one that leads in */
  const dcHold = () => { const k = seekAt('flight', LEVELS[V.dcLv]); return dcPick || (k && foundAt(V.S.looked, k) ? SEEK[k].leads : null); };
  const dcSeek = id => { const lv = seekAt('flight', LEVELS[V.dcLv]); if (!lv || !SEEK[lv].parts.includes(id)) return false; dcPick = id; V.seekTap(lv, id); if (V.dc) V.dc.mark(id); if (V.dcFrame && V.dcFrame.mode() === 'look') drawDc(); return true; };
  function showPlace(id, lv) {
    V.hideAll();
    $('placeCanvas').hidden = $('placeLabels').hidden = false; V.pui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = id; const n = V.routeN;
    /* made while the visitor moved on (#365): left paused, and its frame not drawn */
    return Promise.all([V.withFrame(), ensureDc()]).then(([, d]) => { if (n !== V.routeN) { if (V.pui.hidden) d.pause(); return; }
      V.dcFrame = V.frameOf(V.pui, { up: { href: '#/island', label: t('place.back') }, path: [{ href: '#/island', label: t('place.back') }, { label: t('map.' + id + '.t') }],
        rail: { label: t('place.levels'), items: LEVELS.map(k => ({ id: k, label: t('place.dc.' + k + '.t'), size: sizeOf(k) })) }, onRail: k => d.go(LEVELS.indexOf(k)), onLook: drawDc, scroll: true, caption: true });
      V.pui.onclick = e => { const b = e.target.closest('[data-lvgo]'); if (b) d.go(+b.dataset.lvgo); const sk = e.target.closest('[data-seek]'); if (sk) return dcSeek(sk.dataset.seek); const h = e.target.closest('[data-hl]'); if (h) d.mark(h.dataset.hl); };
      V.pui.onpointerover = e => { const h = e.target.closest('[data-hl]'); d.mark(h ? h.dataset.hl : dcHold()); };
      /* at a level with a search, the names on the picture are the parts to tap */
      $('placeLabels').onclick = e => { const h = e.target.closest('[data-hl]'); if (h) dcSeek(h.dataset.hl); };
      V.loading(false); d.resume(); if (lv != null && lv >= 0 && lv < LEVELS.length) d.go(lv); placeUI(Math.round(d.z)); $('placeCanvas').focus({ preventScroll: true });
    });
  }
  const depthBar = z => { if (V.dcFrame) V.dcFrame.rail(LEVELS[Math.round(z)], z / (LEVELS.length - 1)); };
  let ph = null, phP = null, PH = null, phPick = null;
  const ensurePh = () => phP || (phP = import('../phone3d-flight.js').then(m => { PH = m; ph = m.createPhoneFlight($('flyCanvas'), $('flyLabels'), { level: lv => phUI(lv),
    depth: z => { if (V.phFrame) V.phFrame.rail(PH.LEVELS[Math.round(z)], z / (PH.LEVELS.length - 1)); },
    portal: p => V.phFrame && V.phFrame.inwardAt(p), beyond: () => { if (!V.fui.hidden) location.hash = PH.BEYOND; } }); return ph; }));
  function phUI(lv) {
    if (lv !== V.phLv) phPick = null;
    V.phLv = lv; const id = PH.LEVELS[lv];
    /* at a level with a search (src/data/seek.js), the names on the picture are the parts to tap, as in the data centre */
    $('flyLabels').classList.toggle('seeking', !!seekAt('phone', id));
    if (ph) ph.mark(phHold());
    if (!V.phFrame) return;
    V.phFrame.rail(id, lv / (PH.LEVELS.length - 1)); V.phFrame.level(PH.DEPTH[id]); V.here();
    if (V.phFrame.mode() === 'look') drawPh();
  }
  function drawPh() {
    const LV = PH.LEVELS, id = LV[V.phLv], last = V.phLv === LV.length - 1, PP = VIEW_PARTS.phone, seen = ph ? ph.parts(V.phLv) : [], sk = seekAt('phone', id);
    const hereHtml = sk ? V.seekHtml(sk, phPick, true) : seen.length ? '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2">' + seen.map(k => '<li><button type="button" data-hl="' + k + '"><b>' + esc(t('part.' + PP[k])) + '</b><span>' + esc(t('what.' + PP[k])) + '</span></button></li>').join('') + '</ul></div>' : '';
    V.phFrame.dock.innerHTML = V.lineHtml(t('place.phone.' + id + '.t'), t('place.phone.' + id + '.d'), PH.ASKS[id], V.aroundRow(
      V.phLv ? '<button type="button" class="chipb" data-key="back" data-lvgo="' + (V.phLv - 1) + '">↑ ' + esc(t('place.phone.' + LV[V.phLv - 1] + '.t')) + '</button>' : '',
      last ? '<a class="chipb" data-key="next" data-in href="' + PH.BEYOND + '">↓ ' + esc(t('place.next')) + '</a>' : '<button type="button" class="chipb" data-key="next" data-in data-lvgo="' + (V.phLv + 1) + '">↓ ' + esc(t('place.phone.' + LV[V.phLv + 1] + '.t')) + '</button>'));
    V.phFrame.dock.innerHTML = (sk ? V.seekLit(V.phFrame.dock.innerHTML, sk) : V.phFrame.dock.innerHTML).replace('<div class="nav">', hereHtml + '<div class="nav">');
  }
  /* the part kept lit on the picture, and a part tapped, as in the data centre's flight */
  const phHold = () => { const k = PH && seekAt('phone', PH.LEVELS[V.phLv]); return phPick || (k && foundAt(V.S.looked, k) ? SEEK[k].leads : null); };
  const phSeek = id => { const lv = seekAt('phone', PH.LEVELS[V.phLv]); if (!lv || !SEEK[lv].parts.includes(id)) return false; phPick = id; V.seekTap(lv, id); if (ph) ph.mark(id); if (V.phFrame && V.phFrame.mode() === 'look') drawPh(); return true; };
  function showPhone(lv) {
    V.hideAll();
    $('flyCanvas').hidden = $('flyLabels').hidden = false; V.fui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = 'phones'; const n = V.routeN;
    return Promise.all([V.withFrame(), ensurePh()]).then(([, d]) => { if (n !== V.routeN) { if (V.fui.hidden) d.pause(); return; }
      V.phFrame = V.frameOf(V.fui, { up: { href: '#/island', label: t('place.back') }, path: [{ href: '#/island', label: t('place.back') }, { label: t('map.phones.t') }],
        rail: { label: t('place.levels'), items: PH.LEVELS.map(k => ({ id: k, label: t('place.phone.' + k + '.t'), size: sizeOf(PH.DEPTH[k] === 'phone' ? 'handset' : PH.DEPTH[k]) })) }, onRail: k => d.go(PH.LEVELS.indexOf(k)), onLook: drawPh, scroll: true, caption: true });
      V.fui.onclick = e => { const b = e.target.closest('[data-lvgo]'); if (b) d.go(+b.dataset.lvgo); const sk = e.target.closest('[data-seek]'); if (sk) return phSeek(sk.dataset.seek); const h = e.target.closest('[data-hl]'); if (h) d.mark(h.dataset.hl); };
      V.fui.onpointerover = e => { const h = e.target.closest('[data-hl]'); d.mark(h ? h.dataset.hl : phHold()); };
      $('flyLabels').onclick = e => { const h = e.target.closest('[data-hl]'); if (h) phSeek(h.dataset.hl); };
      V.loading(false); d.resume(); if (lv != null && lv >= 0 && lv < PH.LEVELS.length) d.go(lv); phUI(Math.round(d.z)); $('flyCanvas').focus({ preventScroll: true });
    });
  }
  const hidePh = () => { $('flyCanvas').hidden = $('flyLabels').hidden = true; V.fui.hidden = true; if (ph) ph.pause(); };
  let ca = null, caP = null, CA = null;
  const ensureCa = () => caP || (caP = import('../car3d-flight.js').then(m => { CA = m; ca = m.createCarFlight($('carCanvas'), $('carLabels'), { level: lv => caUI(lv),
    depth: z => { if (V.caFrame) V.caFrame.rail(CA.LEVELS[Math.round(z)], z / (CA.LEVELS.length - 1)); },
    portal: p => V.caFrame && V.caFrame.inwardAt(p), beyond: () => { if (!V.kui.hidden) location.hash = CA.BEYOND; } }); return ca; }));
  function caUI(lv) {
    V.caLv = lv; if (!V.caFrame) return; const id = CA.LEVELS[lv];
    V.caFrame.rail(id, lv / (CA.LEVELS.length - 1)); V.caFrame.level(CA.DEPTH[id]); V.here();
    if (V.caFrame.mode() === 'look') drawCa();
  }
  function drawCa() {
    const LV = CA.LEVELS, id = LV[V.caLv], last = V.caLv === LV.length - 1, PP = VIEW_PARTS.car, seen = ca ? ca.parts(V.caLv) : [];
    const hereHtml = seen.length ? '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2">' + seen.map(k => '<li><button type="button" data-hl="' + k + '"><b>' + esc(t('part.' + PP[k])) + '</b><span>' + esc(t('what.' + PP[k])) + '</span></button></li>').join('') + '</ul></div>' : '';
    V.caFrame.dock.innerHTML = V.lineHtml(t('place.car.' + id + '.t'), t('place.car.' + id + '.d'), CA.ASKS[id], V.aroundRow(
      V.caLv ? '<button type="button" class="chipb" data-key="back" data-lvgo="' + (V.caLv - 1) + '">↑ ' + esc(t('place.car.' + LV[V.caLv - 1] + '.t')) + '</button>' : '',
      last ? '<a class="chipb" data-key="next" data-in href="' + CA.BEYOND + '">↓ ' + esc(t('place.next')) + '</a>' : '<button type="button" class="chipb" data-key="next" data-in data-lvgo="' + (V.caLv + 1) + '">↓ ' + esc(t('place.car.' + LV[V.caLv + 1] + '.t')) + '</button>')).replace('<div class="nav">', hereHtml + '<div class="nav">');
  }
  function showCar(lv) {
    V.hideAll();
    $('carCanvas').hidden = $('carLabels').hidden = false; V.kui.hidden = false; showStage(true); document.body.classList.add('immersive');
    V.loading(true); V.lastPlace = 'cars'; const n = V.routeN;
    return Promise.all([V.withFrame(), ensureCa()]).then(([, d]) => { if (n !== V.routeN) { if (V.kui.hidden) d.pause(); return; }
      V.caFrame = V.frameOf(V.kui, { up: { href: '#/island', label: t('place.back') }, path: [{ href: '#/island', label: t('place.back') }, { label: t('map.cars.t') }],
        rail: { label: t('place.levels'), items: CA.LEVELS.map(k => ({ id: k, label: t('place.car.' + k + '.t'), size: sizeOf(CA.SIZE[k]) })) }, onRail: k => d.go(CA.LEVELS.indexOf(k)), onLook: drawCa, scroll: true, caption: true });
      V.kui.onclick = e => { const b = e.target.closest('[data-lvgo]'); if (b) d.go(+b.dataset.lvgo); const h = e.target.closest('[data-hl]'); if (h) d.mark(h.dataset.hl); };
      V.kui.onpointerover = e => { const h = e.target.closest('[data-hl]'); d.mark(h ? h.dataset.hl : null); };
      V.loading(false); d.resume(); if (lv != null && lv >= 0 && lv < CA.LEVELS.length) d.go(lv); caUI(Math.round(d.z)); $('carCanvas').focus({ preventScroll: true });
    });
  }
  const hideCa = () => { $('carCanvas').hidden = $('carLabels').hidden = true; V.kui.hidden = true; if (ca) ca.pause(); };
  Object.assign(V, { ensureDc, hidePh, hideCa });
}
