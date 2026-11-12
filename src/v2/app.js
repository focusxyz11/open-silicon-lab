/* The redesign's shell. Four parts in the menu: Explore (the chip world and every place in it), Questions
   (every open question, by place), Build (the shared goal, the studio, the open port for AI) and Ecosystem
   (the wider world chips depend on). Routes live in the address: #/, #/place/<id>, #/questions, #/build,
   #/ecosystem. The map and the places are 3D (src/v2/map3d.js, src/v2/dc3d.js); everything said in words is
   read with t(). Places not yet redrawn open the current version of the site. */
import { t } from '../core/i18n.js';
import { REPO, THREADS } from '../data/weave.js';
import { PLACES, BEACONS } from './map3d.js';
import { LEVELS, ASKS } from './dc3d.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const MENU = ['explore', 'questions', 'build', 'ecosystem'];
/* where each place leads: a redrawn place, or the current version of the site */
const LEADS = { datacentre: { place: 'datacentre' }, studio: { old: 'design' }, quarry: { old: 'journey' }, fab: { old: 'journey' }, port: { old: 'journey', map: true }, town: { old: 'phone' }, cars: { old: 'car' } };
const OLD = 'index.html?'; /* i18n-ok: a file name */
const oldUrl = (world, extra) => OLD + new URLSearchParams(Object.assign({ world }, extra || {}));
const hue = th => (THREADS.find(x => x.id === th) || { hue: 200 }).hue;
const qColor = key => 'hsl(' + hue(key.split('.')[0]) + ' 70% 55%)';

export function start() {
  let map = null, dc = null, mapReady = null;
  const S = { route: '', place: null, sheet: null };

  /* ---- the menu ---- */
  const menu = $('menu');
  menu.innerHTML = MENU.map(k => '<a href="#/' + (k === 'explore' ? '' : k) + '" data-nav="' + k + '">' + esc(t('nav.' + k)) + '</a>').join('');
  const theme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const tb = $('theme'), themeLabel = () => { const k = theme() === 'dark' ? 'ui.toLight' : 'ui.toDark'; tb.setAttribute('aria-label', t(k)); tb.title = t(k); };
  tb.addEventListener('click', () => { const n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('osl-theme', n); } catch (e) { /* storage unavailable */ } location.reload(); });
  themeLabel();

  /* ---- the 3D views, made when first needed ---- */
  const loading = on => $('loading').classList.toggle('on', on);
  const ensureMap = () => mapReady || (mapReady = import('./map3d.js').then(m => {
    map = m.createMap($('mapCanvas'), $('mapLabels'), { place: id => openPlace(id), question: key => openQuestion(key), interact: () => $('hero').classList.add('away') });
    loading(false); return map;
  }));
  const ensureDc = () => dc ? Promise.resolve(dc) : import('./dc3d.js').then(m => { dc = m.createDataCentre($('placeCanvas'), $('placeLabels'), { level: lv => placeUI(lv), depth: z => depthBar(z) }); return dc; });

  /* ---- the hero: what this is, in a few words, over the map ---- */
  $('hero').innerHTML = '<p class="kicker">' + esc(t('hero.kicker')) + '</p><h1>' + esc(t('hero.title')) + '</h1><p class="lead">' + esc(t('hero.lead')) + '</p>' +
    '<ul class="hints"><li>' + esc(t('hero.hint.drag')) + '</li><li>' + esc(t('hero.hint.zoom')) + '</li><li>' + esc(t('hero.hint.tap')) + '</li></ul>';

  /* ---- the sheet: a place, or a question, picked on the map ---- */
  const sheet = $('sheet');
  const closeSheet = () => { sheet.hidden = true; S.sheet = null; };
  function openPlace(id) {
    S.sheet = id; map && map.focus(id); $('hero').classList.add('away');
    const lead = LEADS[id], key = BEACONS[id];
    let h = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>';
    h += '<p class="kicker">' + esc(t('map.' + id + '.kind')) + '</p><h2>' + esc(t('map.' + id + '.t')) + '</h2><p>' + esc(t('map.' + id + '.d')) + '</p>';
    if (key) h += '<div class="ask" style="--qc:' + qColor(key) + '"><p class="kicker">' + esc(t('sheet.ask')) + '</p><p class="q">' + esc(t('stop.' + key + '.q')) + '</p></div>';
    h += '<div class="acts">' + (lead.place ? '<a class="btn primary" href="#/place/' + lead.place + '">' + esc(t('sheet.inside')) + '</a>'
      : '<a class="btn primary" href="' + esc(oldUrl(lead.old, lead.map ? { map: 1 } : null)) + '">' + esc(t('sheet.open')) + '</a><p class="small muted">' + esc(t('sheet.soon')) + '</p>') + '</div>';
    sheet.innerHTML = h; sheet.hidden = false;
  }
  function openQuestion(key) {
    S.sheet = key; $('hero').classList.add('away');
    const pid = Object.keys(BEACONS).find(k => BEACONS[k] === key); if (pid && map) map.focus(pid);
    const [th, depth] = key.split('.');
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><div class="ask big" style="--qc:' + qColor(key) + '"><p class="kicker">' + esc(t(pid ? 'map.' + pid + '.t' : 'sheet.ask')) + '</p><p class="q">' + esc(t('stop.' + key + '.q')) + '</p><p>' + esc(t('stop.' + key + '.note')) + '</p></div>' +
      '<div class="acts"><a class="btn primary" href="' + esc(oldUrl(worldOfDepth(depth), { thread: th, depth })) + '">' + esc(t('sheet.follow')) + '</a>' + (pid ? '<button type="button" class="btn" data-place="' + pid + '">' + esc(t('map.' + pid + '.t')) + '</button>' : '') + '</div>';
    sheet.hidden = false;
  }
  sheet.addEventListener('click', e => { if (e.target.closest('[data-close]')) { closeSheet(); map && map.overview(); } const p = e.target.closest('[data-place]'); if (p) openPlace(p.dataset.place); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); map && map.overview(); } });

  /* ---- a place: the data centre, flown through from the campus to the chip ---- */
  const pui = $('placeui');
  function placeUI(lv) {
    const id = LEVELS[lv], key = ASKS[id];
    pui.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-current', +b.dataset.lv === lv ? 'step' : 'false'));
    const cap = pui.querySelector('.caption');
    cap.innerHTML = '<p class="kicker">' + esc(t('place.level', { n: lv + 1, total: LEVELS.length })) + '</p><h2>' + esc(t('place.dc.' + id + '.t')) + '</h2><p>' + esc(t('place.dc.' + id + '.d')) + '</p>' +
      (key ? '<div class="ask" style="--qc:' + qColor(key) + '"><p class="q">' + esc(t('stop.' + key + '.q')) + '</p><a class="link" href="' + esc(oldUrl('datacentre', { thread: key.split('.')[0], depth: key.split('.')[1] })) + '">' + esc(t('sheet.follow')) + '</a></div>' : '') +
      (lv === LEVELS.length - 1 ? '<a class="btn primary" href="' + esc(oldUrl('datacentre', { depth: 'chip' })) + '">' + esc(t('place.next')) + '</a>' : '');
  }
  const depthBar = z => { const f = pui.querySelector('.fill'); if (f) f.style.height = (z / (LEVELS.length - 1) * 100).toFixed(1) + '%'; };
  function showPlace(id) {
    $('hero').hidden = true; closeSheet();
    $('mapCanvas').hidden = $('mapLabels').hidden = true; $('placeCanvas').hidden = $('placeLabels').hidden = false; pui.hidden = false;
    pui.innerHTML = '<nav class="crumbs"><a href="#/">' + esc(t('place.back')) + '</a><span aria-hidden="true">›</span><b>' + esc(t('map.' + id + '.t')) + '</b></nav>' +
      '<ol class="ladder" aria-label="' + esc(t('place.levels')) + '"><span class="track"><span class="fill"></span></span>' + LEVELS.map((k, i) => '<li><button type="button" data-lv="' + i + '">' + esc(t('place.dc.' + k + '.t')) + '</button></li>').join('') + '</ol>' +
      '<div class="caption"></div><p class="hint">' + esc(t('place.hint')) + '</p>';
    pui.onclick = e => { const b = e.target.closest('[data-lv]'); if (b && dc) dc.go(+b.dataset.lv); };
    map && map.pause && map.pause();
    loading(true);
    ensureDc().then(d => { loading(false); d.resume(); placeUI(Math.round(d.z)); $('placeCanvas').focus({ preventScroll: true }); });
  }
  function showMap() {
    $('placeCanvas').hidden = $('placeLabels').hidden = true; pui.hidden = true; dc && dc.pause();
    $('mapCanvas').hidden = $('mapLabels').hidden = false; $('hero').hidden = false;
    loading(!map); ensureMap().then(m => { m.resume && m.resume(); });
  }

  /* ---- the pages: questions, build, ecosystem, over the map ---- */
  const page = $('page');
  function showPage(k) {
    let h = '<div class="inner"><h1>' + esc(t('nav.' + k)) + '</h1><p class="lead">' + esc(t('page.' + k + '.lead')) + '</p>';
    if (k === 'questions') {
      h += '<div class="qgrid">' + PLACES.map(p => { const key = BEACONS[p.id]; return '<button type="button" class="qcard" data-q="' + key + '" style="--qc:' + qColor(key) + '"><span class="kicker">' + esc(t('map.' + p.id + '.t')) + '</span><span class="q">' + esc(t('stop.' + key + '.q')) + '</span></button>'; }).join('') +
        LEVELS.filter(l => ASKS[l] && !Object.values(BEACONS).includes(ASKS[l])).map(l => { const key = ASKS[l]; return '<a class="qcard" href="#/place/datacentre" style="--qc:' + qColor(key) + '"><span class="kicker">' + esc(t('map.datacentre.t') + ' · ' + t('place.dc.' + l + '.t')) + '</span><span class="q">' + esc(t('stop.' + key + '.q')) + '</span></a>'; }).join('') + '</div>';
    } else if (k === 'build') {
      h += '<div class="cards"><a class="card2" href="' + esc(oldUrl('design')) + '"><b>' + esc(t('page.build.studio')) + '</b><span>' + esc(t('page.build.studioD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/blob/main/docs/MCP.md') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.port')) + '</b><span>' + esc(t('page.build.portD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/issues/new?template=need.yml') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.join')) + '</b><span>' + esc(t('page.build.joinD')) + '</span></a></div>';
    } else if (k === 'ecosystem') {
      h += '<div class="cards"><a class="card2" href="' + esc(oldUrl('journey', { map: 1 })) + '"><b>' + esc(t('page.ecosystem.map')) + '</b><span>' + esc(t('page.ecosystem.mapD')) + '</span></a>' +
        '<button type="button" class="card2" data-place="port"><b>' + esc(t('map.port.t')) + '</b><span>' + esc(t('map.port.d')) + '</span></button></div>';
    }
    page.innerHTML = h + '<p class="small muted">' + esc(t('page.preview')) + '</p></div>'; page.hidden = false;
  }
  page.addEventListener('click', e => { const q = e.target.closest('[data-q]'); if (q) { location.hash = '#/'; setTimeout(() => openQuestion(q.dataset.q), 50); } const p = e.target.closest('[data-place]'); if (p) { location.hash = '#/'; setTimeout(() => openPlace(p.dataset.place), 50); } });

  /* ---- routes ---- */
  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean), k = parts[0] || 'explore';
    const nav = k === 'place' ? 'explore' : MENU.includes(k) ? k : 'explore';
    menu.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === nav ? 'page' : 'false'));
    page.hidden = true;
    if (k === 'place' && parts[1] === 'datacentre') return showPlace('datacentre');
    showMap();
    if (['questions', 'build', 'ecosystem'].includes(k)) showPage(k);
  }
  window.addEventListener('hashchange', route);
  route();
}

/* the world of the current site a depth belongs to, for links into it */
function worldOfDepth(depth) {
  return { building: 'datacentre', rack: 'datacentre', board: 'datacentre', chip: 'datacentre', phone: 'phone', car: 'car', crystal: 'journey', clean: 'journey', ship: 'journey', need: 'design' }[depth] || 'datacentre';
}
