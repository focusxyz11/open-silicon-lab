/* The supply map: a chip's whole trip across the world (src/app/map.js, src/engines/supply.js), in the frame.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t, has } from '../../core/i18n.js';
import * as Game from '../game.js';
import { V, $, esc } from '../shell.js';

export function create() {
  Object.assign(V, { supplySite, supplyStep, showSupply });
  /* ---- the supply map: a chip's whole trip across the world (the earlier site's map, src/app/map.js), drawn by
     the flat world over the line and told in the dock: a route, its steps, a place, and what stops if it shuts ---- */
  let SUP = null, Wdata = null, Sup = null;
  const supState = () => { const r = Wdata.ROUTES[SUP.world], focus = r[SUP.step] || r[0], first = SUP.site || focus.at[0] || (focus.flow[0] || [])[1] || 'hsc';
    return { route: r, world: SUP.world, step: SUP.step, here: null, site: SUP.site, closed: new Set(SUP.closed), st: Sup.status(r, SUP.closed), from: Wdata.SITES[first] }; };
  const supShow = () => { if (!SUP || V.flatKind !== 'supply') return; V.dive.setMap(supState()); V.diveFrame.rail(Wdata.ROUTES[SUP.world][SUP.step].id, SUP.step / (Wdata.ROUTES[SUP.world].length - 1)); if (V.diveFrame.mode() === 'look') drawSupply(); };
  function supplySite(id) { if (!SUP) return; SUP.site = SUP.site === id ? null : id; if (SUP.site) { const i = Wdata.ROUTES[SUP.world].findIndex(st => st.at.includes(id)); if (i >= 0) SUP.step = i; } supShow(); }
  function supplyStep(i) { if (!SUP) return; SUP.step = i; SUP.site = null; supShow(); }
  const siteBtn = id => '<button type="button" class="chipb" data-site="' + id + '" aria-pressed="' + (SUP.site === id) + '">' + esc(t('site.' + id + '.name')) + '</button>';
  function drawSupply() {
    const r = Wdata.ROUTES[SUP.world], st = Sup.status(r, SUP.closed), step = r[SUP.step] || r[0], bad = Sup.worst(st);
    let h = '<p class="kicker">' + esc(t('map.route.' + SUP.world)) + '</p><div class="chips">' + Object.keys(Wdata.ROUTES).map(w => '<button type="button" class="chipb" data-supworld="' + w + '" aria-pressed="' + (w === SUP.world) + '">' + esc(t('world.' + w + '.name')) + '</button>').join('') + '</div>';
    /* what stops, if anything does: the question a shut place raises */
    if (SUP.closed.length) {
      const places = bad ? (st[bad.i].why.map(id => t('site.' + id + '.name')).join(', ') || SUP.closed.map(id => t('site.' + id + '.name')).join(', ')) : '';
      /* a stopped maker of machines (capital) stops no chips at once: the fabs go on with the machines they have */
      const cap = bad && bad.state === 'stopped' && r[bad.i].capital;
      h += '<div class="mapstop2 ' + (bad ? (cap ? 'strained' : bad.state) : '') + '">' + (bad ? '<p><b>' + esc(t(cap ? 'map.capital' : bad.state === 'stopped' ? 'map.stops' : 'map.strained', { step: t('route.step.' + r[bad.i].id), places })) + '</b></p><p class="small">' + esc(t(bad.state === 'stopped' && !cap ? 'map.qStop' : 'map.qStrain')) + '</p>' : '') +
        '<button type="button" class="link" data-openall>' + esc(t('map.openAll')) + '</button></div>';
    }
    h += '<p class="kicker">' + esc(t('map.step')) + ' · ' + esc(t('route.step.' + step.id)) + '</p>' + (SUP.site ? '' : '<p class="small">' + esc(t('route.' + (has('route.' + SUP.world + '.' + step.id) ? SUP.world : 'any') + '.' + step.id)) + '</p>');
    if (step.at.length) h += '<p class="small muted">' + esc(t('map.places')) + '</p><div class="chips">' + step.at.map(siteBtn).join('') + '</div>';
    if (SUP.site) { const id = SUP.site, shut = SUP.closed.includes(id);
      h += '<div class="yours"><span class="kicker">' + esc(t('site.' + id + '.name')) + ' · ' + esc(t('site.' + id + '.where')) + '</span>' + esc(t('site.' + id + '.what')) + ' <span class="muted">' + esc(t('site.' + id + '.who')) + '</span></div>' +
        '<button type="button" class="btn' + (shut ? '' : ' primary') + '" data-shut="' + id + '">' + esc(t(shut ? 'map.reopen' : 'map.shut')) + '</button>'; }
    const i = SUP.step, n = r.length;
    h += '<div class="nav">' + (i ? '<button type="button" class="btn ghost" data-key="back" data-supstep="' + (i - 1) + '">' + esc(t('story.back')) + '</button>' : '<span></span>') +
      (step.st ? '<a class="btn" href="#/line/' + step.st + '">' + esc(t('map.toStation', { station: t('depth.' + step.st + '.name') })) + '</a>' : '') +
      (i < n - 1 ? '<button type="button" class="btn primary" data-key="next" data-supstep="' + (i + 1) + '">' + esc(t('line.next')) + '</button>' : '<a class="btn primary" href="#/place/' + (SUP.back || 'port') + '">' + esc(t('chipx.back')) + '</a>') + '</div>';
    V.diveFrame.dock.innerHTML = h; V.diveFrame.dock.classList.add('supdock'); requestAnimationFrame(V.diveInset);
  }
  function showSupply(world) {
    V.hideAll(); document.body.classList.add('immersive'); V.flatKind = 'supply'; V.benchCh = null;
    /* the world map is entered from the port, or from the island whose machines or materials it follows: going out
       comes back to where you came in */
    const back = ['tools', 'materials'].includes(V.enteredFrom) ? V.enteredFrom : 'port'; V.enteredFrom = null;
    $('diveCanvas').hidden = false; V.vui.hidden = false; V.loading(true); V.lastPlace = back;
    return Promise.all([V.withFrame(), V.ensureDive(), import('../../data/world.js'), import('../../engines/supply.js')]).then(([, w, Wd, Sp]) => {
      Wdata = Wd; Sup = Sp; V.WE.setWorld('journey'); V.DS.setBandCaption(false);
      const wd = Wdata.ROUTES[world] ? world : (SUP && SUP.world) || 'datacentre';
      SUP = { world: wd, step: 0, site: null, closed: [], back };
      const r = Wdata.ROUTES[wd];
      V.diveFrame = V.frameOf(V.vui, { up: { href: '#/place/' + back, label: t('map.' + back + '.t') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/' + back, label: t('map.' + back + '.t') }, { label: t('page.ecosystem.map') }],
        rail: { label: t('map.routes'), items: r.map(st => ({ id: st.id, label: t('route.step.' + st.id) })) },
        onRail: id => supplyStep(Wdata.ROUTES[SUP.world].findIndex(st => st.id === id)), onLook: drawSupply }); watchDock();
      V.vui.onclick = e => {
        const s = e.target.closest('[data-supstep]'); if (s) return supplyStep(+s.dataset.supstep);
        const st = e.target.closest('[data-site]'); if (st) return supplySite(st.dataset.site);
        const wb = e.target.closest('[data-supworld]'); if (wb) { location.hash = '#/supply/' + wb.dataset.supworld; return; }
        const sh = e.target.closest('[data-shut]'); if (sh) { const id = sh.dataset.shut; SUP.closed = SUP.closed.includes(id) ? SUP.closed.filter(x => x !== id) : SUP.closed.concat(id); return supShow(); }
        if (e.target.closest('[data-openall]')) { SUP.closed = []; return supShow(); }
      };
      V.loading(false); w.start(); w.setZ(V.WE.IDS.indexOf('ship')); V.diveD = V.WE.IDS.indexOf('ship'); V.hide3d();
      V.diveFrame.level('ship'); supShow(); $('diveCanvas').focus({ preventScroll: true });
    });
  }
  const showDive = (depth, world) => V.showFlat('dive', depth, null, world || Game.DIVE_WORLD[depth]);
  addEventListener('resize', () => { if (!V.vui.hidden) V.diveInset(); });
  /* the picture keeps clear of the dock as it grows or shrinks (Ask's list, a challenge, a note) */
  const dockObs = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (!V.vui.hidden) V.diveInset(); }) : null;
  /* and, on the bench, of the way in as it comes and goes, and of the last step, where the way along stays on a phone */
  const inObs = typeof MutationObserver === 'function' ? new MutationObserver(() => { if (!V.vui.hidden && V.flatKind === 'bench') V.diveInset(); }) : null;
  const watchDock = () => { if (dockObs && V.diveFrame) { dockObs.disconnect(); dockObs.observe(V.diveFrame.dock); }
    if (!inObs) return; inObs.disconnect();
    const wi = V.vui.querySelector(':scope > .wayin'), nx = V.vui.querySelector(':scope > .steps2 [data-stepgo="1"]');
    if (wi) inObs.observe(wi, { attributes: true, attributeFilter: ['hidden'] }); if (nx) inObs.observe(nx, { attributes: true, attributeFilter: ['disabled'] }); };
  Object.assign(V, { showDive, watchDock });
}
