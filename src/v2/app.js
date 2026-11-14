/* The redesign's shell. The main thread is your chip's life (src/v2/game.js): the HUD always shows the five
   steps, where your chip is and what to do next. Every place opens the same sheet with three doors: Do (its
   challenges, played right there: src/v2/play.js), Look (the ways inside) and Ask (its questions and debates).
   Look is Inside: a place's levels, one inside the next, which hold the earlier site's pages (src/data/places.js).
   The menu: Explore (the island), Challenges (every challenge and every open job), Questions (by place),
   Build (the shared computer the community is building) and Ecosystem (the islands across the sea, and the
   world chips depend on). Routes live in the address: #/, #/place/<id>, #/place/datacentre/<level>, #/chip/<row>[/build] (inside a chip, layer by layer), #/board (one board, with a story that drives it), #/dive/<depth> (the flat dive, chip to atom), #/line/<step> (the factory), #/bench/<level>[/<challenge>] (the studio), #/challenges, #/questions, #/build,
   #/ecosystem. Words are read with t(); places not yet redrawn open the current site. */
import { t } from '../core/i18n.js';
import { REPO, THREADS } from '../data/weave.js';
import { NEEDS } from '../data/build.js';
import { childrenOf } from '../engines/build.js';
import { WAYS } from '../data/ways.js';
import * as Game from './game.js';
import { play, titleOf, goalOf } from './play.js';
import { PLACES } from './map3d.js';
import { LEVELS, ASKS } from './dc3d.js';
import { stopsAt } from '../data/places.js';
import { showStage, stage } from './kit3d.js';
import { rootShown } from '../engines/weave.js';
import { FIGURES, CASES } from '../data/weave.js';
import { fmtDate } from '../core/i18n.js';
import { ROWS, ASK as CHIP_ASK } from './chip3d.js';

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const MENU = ['explore', 'challenges', 'questions', 'build', 'ecosystem'];
const hue = th => (THREADS.find(x => x.id === th) || { hue: 200 }).hue;
const qColor = key => 'hsl(' + hue(key.split('.')[0]) + ' 70% 55%)';
/* following a question stays in the chip world: its trail walks from view to view (Game.askHref) */
const follow = key => Game.askHref(key);

export function start() {
  let map = null, dc = null, chip = null, board = null, dive = null, mapReady = null;
  const S = Game.load(localStorage);
  const save = () => Game.save(localStorage, S);

  /* ---- the menu and the theme ---- */
  const menu = $('menu');
  menu.innerHTML = MENU.map(k => '<a href="#/' + (k === 'explore' ? '' : k) + '" data-nav="' + k + '">' + esc(t('nav.' + k)) + '</a>').join('');
  const theme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const tb = $('theme'), k0 = theme() === 'dark' ? 'ui.toLight' : 'ui.toDark'; tb.setAttribute('aria-label', t(k0)); tb.title = t(k0);
  tb.addEventListener('click', () => { const n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('osl-theme', n); } catch (e) { /* storage unavailable */ } location.reload(); });

  /* ---- what the island shows: growth, steps, your chip, the community's pieces ---- */
  function islandState() {
    const C = Game.community(S), leaves = NEEDS.filter(n => !childrenOf(n.id).length), order = ['built', 'yours', 'open', 'engine'];
    const floors = leaves.map(n => { const p = C.state[n.id]; return p.state === 'built' ? 'built' : p.state === 'engine' ? 'engine' : p.yours ? 'yours' : 'open'; }).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const places = Object.fromEntries(Game.PLACES.map(id => { const L = doList(id); return [id, { done: L.filter(c => S.done[c.id]).length, total: L.length }]; }));
    return { grown: Game.grown(S), steps: Object.fromEntries(Game.STEPS.map(s => [s, Game.stepState(S, s)])), places, chipAt: Game.chipAt(S), floors, designs: C.designs, jobList: C.jobs, engineList: C.engines };
  }
  const refresh = animate => { if (map) map.setState(islandState(), animate); hud(); firstGo(); };
  /* until the first win, the way to start glows */
  const firstGo = () => { const b = $('hero').querySelector('[data-start]'); if (b) b.classList.toggle('pulse', !Object.keys(S.done).length); };

  /* ---- the 3D views, made when first needed ---- */
  /* the spinner shows only when a view takes long to make: a quick view comes in without one */
  let loadT = 0;
  const loading = on => { clearTimeout(loadT); if (on) loadT = setTimeout(() => $('loading').classList.add('on'), 400); else $('loading').classList.remove('on'); };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* the views' code, fetched while the visitor looks at the island, so going inside does not wait for the network */
  const idle = f => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 1200));
  /* one stage: while the island is shown, the data centre, the chip and the board are made one by one, paused, and
     their shaders compiled on the shared renderer, so going inside finds them ready */
  const ready = (make, view) => () => { if (viewNow !== 'map') return; make().then(v => { if (viewNow !== view) v.pause(); return v.warm(); }); };
  const prewarm = () => [ready(ensureDc, 'dc'), ready(ensureChip, 'chip'), ready(ensureBoard, 'board')].reduce((p, f) => p.then(() => new Promise(r => idle(() => { f(); r(); }))), Promise.resolve());
  const preload = () => { prewarm(); ['./frame.js', './board3d.js', './story.js', './stories.js', '../engines/weave.js', '../app/world.js', '../data/weave.js', '../app/design.js', '../app/journey.js', './level3d.js', './relief3d.js', './wafer3d.js', './pcb3d.js', './phone3d.js', './gate3d.js', './switch3d.js', './atom3d.js', './overlay.js'].forEach(u => import(u).catch(() => { /* fetched again when needed */ })); };
  const ensureMap = () => mapReady || (mapReady = import('./map3d.js').then(m => {
    map = m.createMap($('mapCanvas'), $('mapLabels'), { place: id => (cur && cur.place === id && !sheet.hidden && enterOf(id) ? enter(enterOf(id)) : openPlace(id)), question: key => openQuestion(key), job: need => openJob(need), interact: () => $('hero').classList.add('away') });
    loading(false); map.setState(islandState(), false); idle(preload);
    /* the first minute: a first visit to the island opens on a wide shot and comes down to it, and the hero rises after */
    if (!S.seen && (!location.hash || location.hash === '#/') && !still()) { map.intro(); $('hero').classList.add('intro'); }
    if (!S.seen) { S.seen = true; save(); }
    return map;
  }));
  /* each view is made once, even when the prewarm and a visit ask for it at the same moment */
  let dcP = null, chipP = null, boardP = null;
  const ensureDc = () => dcP || (dcP = import('./dc3d.js').then(m => { dc = m.createDataCentre($('placeCanvas'), $('placeLabels'), { level: lv => placeUI(lv), depth: z => depthBar(z) }); return dc; }));

  /* ---- the HUD: your chip's life, always in view ---- */
  /* the tracker: your chip's life, in the bar on every view, so the goal never leaves the screen */
  const hudEl = $('track');
  function hud() {
    const at = Game.chipAt(S), nx = Game.next(S);
    hudEl.innerHTML = '<ol class="tsteps">' + Game.STEPS.map((s, i) => { const st = Game.stepState(S, s), full = st.done === st.total;
      return '<li><button type="button" data-step="' + s + '" class="' + (full ? 'full' : '') + (s === at ? ' here' : '') + '" title="' + esc(t('game.step.' + s)) + '" aria-label="' + esc(t('game.stepAria', { n: i + 1, step: t('game.step.' + s), done: st.done, total: st.total })) + '">' + (full ? '✓' : i + 1) + '</button></li>'; }).join('') + '</ol>' +
      (nx ? '<button type="button" class="tnext" data-ch="' + nx.id + '"><span class="kicker">' + esc(t('game.next')) + '</span><span class="tn">' + esc(titleOf(nx)) + '</span></button>' : '<span class="tnext done" title="' + esc(t('game.allDone')) + '">✓</span>');
  }
  hudEl.addEventListener('click', e => { const s = e.target.closest('[data-step]'); if (s) { goExplore(() => openPlace(Game.STATION[s.dataset.step], 'do')); return; } const c = e.target.closest('[data-ch]'); if (c) goExplore(() => openChallenge(Game.challengeOf(c.dataset.ch))); });

  /* ---- the hero: what this is, and where to start ---- */
  $('hero').innerHTML = '<p class="kicker">' + esc(t('hero.kicker')) + '</p><h1>' + esc(t('hero.title')) + '</h1><p class="lead">' + esc(t('hero.lead')) + '</p>' +
    '<div class="row"><button type="button" class="btn primary" data-start>' + esc(t('hero.start')) + '</button><button type="button" class="btn" data-tour>' + esc(t('hero.look')) + '</button></div>' +
    '<ul class="hints"><li>' + esc(t('hero.hint.drag')) + '</li><li>' + esc(t('hero.hint.zoom')) + '</li><li>' + esc(t('hero.hint.tap')) + '</li></ul>';
  $('hero').addEventListener('click', e => { if (e.target.closest('[data-start]')) { $('hero').classList.add('away'); openChallenge(Game.next(S) || Game.CHALLENGES[0]); } if (e.target.closest('[data-tour]')) { $('hero').classList.add('away'); map && map.overview(); } });

  /* ---- the sheet: a place with its three doors, a question, or a challenge ---- */
  const sheet = $('sheet');
  /* the stage knows when a sheet is open (phones fold the HUD's next button away) */
  new MutationObserver(() => $('stage').classList.toggle('sheeted', !sheet.hidden)).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  let cur = null;   /* { place, tab } */
  const closeSheet = () => { sheet.hidden = true; cur = null; };
  const kickerOf = id => { const step = Game.STEP_OF[id] || Game.STEP_PLACE[id]; return step ? t('game.stepN', { n: Game.STEPS.indexOf(step) + 1, step: t('game.step.' + step) }) : t('map.' + id + '.kind'); };
  /* what to do at a place: its own challenges, and at a step's station the step's challenges played elsewhere */
  const doList = id => { const step = Game.STEP_OF[id] || Game.STEP_PLACE[id], here = Game.placeChallenges(id);
    return here.concat(step ? Game.stepChallenges(step).filter(c => c.place !== id) : []); };
  const whereOf = ch => t('map.' + (ch.need ? 'lab' : ch.place) + '.t') + (ch.at ? ' › ' + t('depth.' + ch.at + '.name') : '');
  function chCard(ch) {
    const done = S.done[ch.id];
    return '<button type="button" class="chcard' + (done ? ' done' : '') + '" data-open="' + esc(ch.id) + '"><span class="st">' + (done ? '✓' : '') + '</span><span><span class="kicker">' + esc(whereOf(ch)) + '</span><b>' + esc(titleOf(ch)) + '</b><span class="small">' + esc(goalOf(ch)) + '</span>' + (ch.grows ? '<span class="small muted">' + esc(t(done ? 'game.grew' : 'game.grows', { what: t('grow.' + ch.grows) })) + '</span>' : '') + '</span></button>';
  }
  const jobCard = j => '<button type="button" class="chcard job" data-job="' + j.need + '"><span class="st">?</span><span><b>' + esc(t('design.proj.' + j.p + '.t')) + '</b><span class="small">' + esc(t('build.need.' + j.need + '.d')) + '</span></span></button>';
  const askLink = k => '<a class="askq" href="' + esc(follow(k)) + '" style="--qc:' + qColor(k) + '"><span class="q">' + esc(t('stop.' + k + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a>';
  /* Inside: the place's levels, one inside the next, with what waits at each; then any other way in */
  /* a level opens where it is drawn best: the flight through the data centre, the chip's layers (a depth of the
     dive, or the factory step that makes it), or else the current site */
  const rowOf = d => { const i = ROWS.findIndex(r => r.dive === d || r.made.includes(d)); return i < 0 ? null : { row: i, build: !ROWS.some(r => r.dive === d) }; };
  /* the flat dive's levels (the earlier site's zoom, in the frame): from the chip down to the atom */
  const DIVE_LEVELS = Game.DIVE_LEVELS;
  const levelHref = (place, l) => { if (place === 'datacentre' && l.depth === 'board') return '#/board'; const f = (Game.FLOWN[place] || {})[l.depth]; if (f != null) return '#/place/' + place + '/' + f;
    if (FLAT_WORLDS.includes(l.world)) return '#/dive/' + l.depth + '/' + l.world;
    if (DIVE_LEVELS.includes(l.depth) && l.depth !== 'chip') return '#/dive/' + l.depth;
    if (l.world === 'design') return '#/bench/' + l.depth;
    if (l.world === 'journey') return '#/line/' + l.depth;
    const c = rowOf(l.depth); return c ? '#/chip/' + c.row + (c.build ? '/build' : '') : Game.viewOfDepth(l.depth); };
  /* the worlds with a flat dive of their own, besides the data centre's */
  const FLAT_WORLDS = ['phone', 'car', 'made'];
  /* where going inside a place leads: its first level, drawn in the frame */
  const enterOf = id => { const L = Game.INSIDE[id] || []; if (L.length) return levelHref(id, L[0]); const x = (Game.LOOK[id] || [])[0]; return x ? (x.to ? '#/place/' + x.to : x.page ? '#/' + x.page : null) : null; };
  function insideHtml(id) {
    const L = Game.INSIDE[id] || [], extra = Game.LOOK[id] || [];
    let h = L.length ? '<ol class="lvchips" aria-label="' + esc(t('door.look.d')) + '">' + L.map((l, i) => {
      const nq = stopsAt(l.depth).length, chs = Game.placeChallenges(id).filter(c => c.at === l.depth).length;
      const href = levelHref(id, l), fly = (Game.FLOWN[id] || {})[l.depth] != null, shared = id !== 'datacentre' && Game.SHARED.includes(l.depth);
      const note = [t('depth.' + l.depth + '.see'), fly && t('game.inside.fly'), shared && t('game.inside.shared')].filter(Boolean).join(' · ');
      return '<li><a href="' + esc(href) + '" title="' + esc(note) + '" class="' + (shared ? 'shared' : '') + '"><span class="i">' + (i + 1) + '</span>' + esc(t('depth.' + l.depth + '.name')) + (chs ? '<span class="dotc" role="img" aria-label="' + esc(t('game.inside.ch', { n: chs })) + '"></span>' : '') + (nq ? '<span class="qn" title="' + esc(t('game.inside.qs', { n: nq })) + '">' + nq + '</span>' : '') + '</a></li>';
    }).join('') + '</ol>' : '';
    h += extra.map(l => { const href = l.to ? '#/place/' + l.to : '#/' + l.page;
      return '<a class="look" href="' + esc(href) + '"><b>' + esc(t('look.' + l.id + '.t')) + '</b><span class="small">' + esc(t('look.' + l.id + '.d')) + '</span>' + (l.world ? '<span class="small muted">' + esc(t('game.current')) + '</span>' : '') + '</a>'; }).join('');
    return h || '<p class="small muted">' + esc(t('game.noLook')) + '</p>';
  }
  function openPlace(id, tab) {
    cur = { place: id, tab: tab || 'look' };
    map && map.focus(id); $('hero').classList.add('away'); drawPlace();
  }
  function drawPlace() {
    const id = cur.place, C = Game.community(S), asks = Game.ASK[id] || [], debates = Game.debatesAt(id), dos = doList(id);
    const nDo = id === 'lab' ? C.jobs.length + C.engines.length : id === 'village' ? C.jobs.length : dos.filter(c => !S.done[c.id]).length, nAsk = asks.length + debates.length;
    let h = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>';
    h += '<p class="kicker">' + esc(kickerOf(id)) + '</p><h2>' + esc(t('map.' + id + '.t')) + '</h2>';
    h += '<div class="doors" role="tablist">' + ['look', 'do', 'ask'].map(k => '<button type="button" role="tab" data-door="' + k + '" aria-selected="' + (cur.tab === k) + '" title="' + esc(t('door.' + k + '.d')) + '"><b>' + esc(t('door.' + k)) + (k === 'do' && nDo ? ' <span class="n">' + nDo + '</span>' : k === 'ask' && nAsk ? ' <span class="n">' + nAsk + '</span>' : '') + '</b></button>').join('') + '</div><div class="door">';
    if (cur.tab === 'do') {
      if (id === 'lab') h += '<p class="small">' + esc(t('game.lab.do', { built: C.built, total: C.total })) + '</p>' + C.jobs.map(jobCard).join('') + C.engines.map(e => '<a class="chcard engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + e.need + '.t') }) })) + '"><span class="st">⚙</span><span><b>' + esc(t('build.need.' + e.need + '.t')) + '</b><span class="small">' + esc(t('game.engineWanted')) + '</span></span></a>').join('') + '<a class="link" href="#/build">' + esc(t('game.seePlan')) + '</a>';
      else if (id === 'village') h += '<p class="small">' + esc(t('game.village.do')) + '</p>' + C.designs.map(d => '<div class="chcard done"><span class="st">⌂</span><span><b>' + esc(d.title) + '</b><span class="small">' + esc(d.author) + ' · ' + esc(t('build.kind.' + d.kind)) + '</span></span></div>').join('') + C.jobs.map(jobCard).join('');
      else if (id === 'idea') h += '<p>' + esc(t('game.idea.do')) + '</p><a class="btn primary" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('game.idea.title') })) + '">' + esc(t('game.idea.propose')) + '</a>';
      else if (dos.length) h += dos.map(chCard).join('');
      else h += '<p class="small muted">' + esc(t('game.noDo')) + '</p>';
    } else if (cur.tab === 'look') {
      /* one line, and the way in; the levels as small steps to jump to */
      const enter = enterOf(id);
      h += '<p class="line">' + esc(t('map.' + id + '.d')) + '</p>' + (enter ? '<div class="nav"><span></span><a class="btn primary" href="' + esc(enter) + '">' + esc(t('door.enter')) + '</a></div>' : '') + insideHtml(id);
    } else {
      h += Game.askAt(id).map(g => (g.level && Game.askAt(id).length > 1 ? '<p class="kicker">' + esc(t('depth.' + g.level.depth + '.name')) + '</p>' : '') + g.stops.map(askLink).join('')).join('');
      if (debates.length) h += '<p class="kicker">' + esc(t('game.debates')) + '</p>' + debates.map(d => '<div class="debate2"><b>' + esc(t('debate.' + d + '.t')) + '</b><span class="small">' + esc(t('debate.' + d + '.q')) + '</span></div>').join('');
      if (id === 'lab') h += '<p class="kicker">' + esc(t('game.ways')) + '</p>' + WAYS.map(w => '<div class="debate2"><b>' + esc(t('way.' + w.id + '.t')) + '</b><span class="small">' + esc(t('way.' + w.id + '.how')) + '</span></div>').join('');
      if (!nAsk && id !== 'lab') h += '<p class="small muted">' + esc(t('game.noAsk')) + '</p>';
    }
    sheet.innerHTML = h + '</div>'; sheet.hidden = false; sheet.scrollTop = 0;
  }
  /* a challenge, played in the sheet */
  function openChallenge(ch) {
    if (!ch) return;
    const placeId = ch.need ? 'lab' : ch.place;
    if (!cur || cur.place !== placeId) { cur = { place: placeId, tab: 'do' }; map && map.focus(placeId); }
    $('hero').classList.add('away'); sheet.hidden = false; sheet.scrollTop = 0;
    play(sheet, ch, { state: S, save, startChip: () => Object.assign({}, Game.START), open: openChallenge, back: () => { sheet.onclick = null; sheet.oninput = null; drawPlace(); }, done: won });
  }
  const openJob = need => { const j = Game.jobOf(need); if (j) openChallenge(j); };
  /* something was won: the island grows, the HUD moves on, a note says what appeared */
  /* a win is felt: the island grows where it happened and the camera leans in, the step in the bar bumps and counts
     one up, the next challenge glows, and a toast says what grew */
  function won(ch) {
    refresh(true); toast(ch.grows ? t('game.toast', { what: t('grow.' + ch.grows) }) : t('game.toastJob'));
    if (map && !$('mapCanvas').hidden) map.punch();
    const b = ch.step && hudEl.querySelector('[data-step="' + ch.step + '"]');
    if (b && !still()) { b.classList.add('bump'); const plus = document.createElement('span'); plus.className = 'plus'; plus.setAttribute('aria-hidden', 'true'); plus.textContent = '+1'; b.parentNode.appendChild(plus); setTimeout(() => plus.remove(), 1500); }
    const n = hudEl.querySelector('.tnext'); if (n && !still()) n.classList.add('glow');
  }
  const toastEl = $('toast'); let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; toastEl.classList.remove('go'); void toastEl.offsetWidth; toastEl.classList.add('go'); clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 4200); }
  function openQuestion(key) {
    const pid = Object.keys(Game.BEACON).find(k => Game.BEACON[k] === key) || Object.keys(Game.ASK).find(k => Game.ASK[k].includes(key));
    if (pid) { cur = { place: pid, tab: 'ask' }; map && map.focus(pid); }
    $('hero').classList.add('away'); sheet.onclick = null; sheet.oninput = null;
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><div class="ask big" style="--qc:' + qColor(key) + '"><p class="kicker">' + esc(pid ? t('map.' + pid + '.t') : t('sheet.ask')) + '</p><p class="q">' + esc(t('stop.' + key + '.q')) + '</p><p>' + esc(t('stop.' + key + '.note')) + '</p></div>' +
      '<div class="acts"><a class="btn primary" href="' + esc(follow(key)) + '">' + esc(t('sheet.follow')) + '</a>' + (pid ? '<button type="button" class="btn" data-place="' + pid + '">' + esc(t('game.allHere', { place: t('map.' + pid + '.t') })) + '</button>' : '') + '</div>';
    sheet.hidden = false;
  }
  sheet.addEventListener('click', e => {
    if (e.target.closest('.player')) return;   /* the player handles its own clicks */
    if (e.target.closest('[data-close]')) { closeSheet(); if (location.hash !== '#/ecosystem') map && map.overview(); return; }
    const d = e.target.closest('[data-door]'); if (d) { cur.tab = d.dataset.door; drawPlace(); return; }
    const o = e.target.closest('[data-open]'); if (o) { openChallenge(Game.challengeOf(o.dataset.open)); return; }
    const j = e.target.closest('[data-job]'); if (j) { openJob(j.dataset.job); return; }
    const p = e.target.closest('[data-place]'); if (p) openPlace(p.dataset.place);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); if (location.hash !== '#/ecosystem') map && map.overview(); } });

  /* ---- the frame: every view below the island wears it (src/v2/frame.js, docs/SYSTEM.md) ---- */
  const frameOf = (host, o) => FrameM.createFrame(host, Object.assign({ follow, askAt: d => stopsAt(d),
    doAt: d => Game.CHALLENGES.filter(c => c.at === d).map(c => ({ id: c.id, title: titleOf(c), where: whereOf(c), href: c.kind === 'design' ? '#/bench/' + c.at + '/' + c.id : '#/do/' + c.id })) }, o));
  let FrameM = null;
  const withFrame = () => FrameM ? Promise.resolve(FrameM) : import('./frame.js').then(m => (FrameM = m));
  /* the Turn, from any level: designed opens the studio's level, made and used open the chip's layers */
  let turnT = 0;   /* the Turn's move is spent by the next route, or forgotten when the Turn changed nothing */
  const turnTo = (face, tw) => { if (!tw) return; nextMove = 'turn'; clearTimeout(turnT); turnT = setTimeout(() => { nextMove = null; }, 400);
    if (face === 'designed' && tw.designed) location.hash = '#/bench/' + tw.designed; else if (face === 'made') location.hash = '#/line/' + tw.made[tw.made.length - 1]; else if (face === 'used') location.hash = '#/dive/' + tw.used; };
  const TWINS_ORDER = ROWS.map(r => r.dive);
  const lineHtml = (kicker, line, key, nav) => '<p class="kicker">' + esc(kicker) + '</p><p class="line">' + esc(line) + '</p>' +
    (key ? '<a class="askline" href="' + esc(follow(key)) + '"><span class="q">' + esc(t('stop.' + key + '.q')) + '</span></a>' : '') + '<div class="nav">' + nav + '</div>';

  /* ---- a place flown through: the data centre ---- */
  const pui = $('placeui');
  const DC_DEPTH = { campus: 'building', hall: 'building', rack: 'rack', server: 'rack', board: 'board', chip: 'chip' };
  let dcFrame = null, dcLv = 0;
  function placeUI(lv) {
    dcLv = lv; const id = LEVELS[lv];
    if (!dcFrame) return;
    dcFrame.rail(id, lv / (LEVELS.length - 1)); dcFrame.level(DC_DEPTH[id]);
    if (dcFrame.mode() === 'look') drawDc();
  }
  function drawDc() {
    const id = LEVELS[dcLv], last = dcLv === LEVELS.length - 1;
    dcFrame.dock.innerHTML = lineHtml(t('place.level', { n: dcLv + 1, total: LEVELS.length }) + ' · ' + t('place.dc.' + id + '.t'), t('place.dc.' + id + '.d'), ASKS[id],
      (dcLv ? '<button type="button" class="btn ghost" data-lvgo="' + (dcLv - 1) + '">' + esc(t('story.back')) + '</button>' : '<span></span>') +
      (id === 'board' ? '<a class="btn" href="#/board">' + esc(t('board.enter')) + '</a>' : '') +
      (last ? '<a class="btn primary" href="#/dive/chip">' + esc(t('place.next')) + '</a>' : '<button type="button" class="btn primary" data-lvgo="' + (dcLv + 1) + '">' + esc(t('chipx.deeper')) + '</button>'));
  }
  function showPlace(id, lv) {
    hideAll();
    $('placeCanvas').hidden = $('placeLabels').hidden = false; pui.hidden = false; showStage(true); document.body.classList.add('immersive');
    loading(true); lastPlace = id;
    return Promise.all([withFrame(), ensureDc()]).then(([, d]) => {
      dcFrame = frameOf(pui, { up: { href: '#/', label: t('place.back') }, path: [{ href: '#/', label: t('place.back') }, { label: t('map.' + id + '.t') }],
        rail: { label: t('place.levels'), items: LEVELS.map(k => ({ id: k, label: t('place.dc.' + k + '.t') })) }, turn: true,
        onRail: k => d.go(LEVELS.indexOf(k)), onTurn: turnTo, onLook: drawDc });
      pui.onclick = e => { const b = e.target.closest('[data-lvgo]'); if (b) d.go(+b.dataset.lvgo); };
      loading(false); d.resume(); if (lv != null && lv >= 0 && lv < LEVELS.length) d.go(lv); placeUI(Math.round(d.z)); $('placeCanvas').focus({ preventScroll: true });
    });
  }
  const depthBar = z => { if (dcFrame) dcFrame.rail(LEVELS[Math.round(z)], z / (LEVELS.length - 1)); };

  /* ---- inside a chip, layer by layer: the dive (used) and the line (made) as one picture, turned by the Turn ---- */
  const cui = $('chipui');
  let chipMode = 'dive', chipRow = 0, chipFrame = null;
  const ensureChip = () => chipP || (chipP = import('./chip3d.js').then(m => { chip = m.createChip($('chipCanvas'), $('chipLabels'), { row: r => { chipRow = r; chipPanel(); },
    depth: z => { if (chipFrame) chipFrame.rail(ROWS[Math.round(z)].dive, chipMode === 'build' ? 1 - z / (ROWS.length - 1) : z / (ROWS.length - 1)); } }); return chip; }));
  const stepNames = r => ROWS[r].made.map(d => t('depth.' + d + '.name')).join(' → ');
  function chipPanel() {
    if (!chipFrame) return;
    chipFrame.level(ROWS[chipRow].dive); chipFrame.face(chipMode === 'build' ? 'made' : 'used');
    if (chipFrame.mode() === 'look') drawChip();
  }
  function drawChip() {
    const r = chipRow, R = ROWS[r], build = chipMode === 'build', n = build ? ROWS.length - r : r + 1, key = CHIP_ASK[chipMode][r];
    const kicker = t(build ? 'chipx.stepN' : 'chipx.levelN', { n, total: ROWS.length }) + ' · ' + (build ? stepNames(r) : t('depth.' + R.dive + '.name'));
    const line = build ? R.made.map(d => t('depth.' + d + '.see')).join(' ') : t('depth.' + R.dive + '.see');
    const nextR = build ? r - 1 : r + 1, done = build ? r === 0 : r === ROWS.length - 1;
    /* your own design, where the chip carries it: the gates you wrote are printed, etched and wired here */
    const Y = Game.yourDesign(S), yk = Y && (build ? ({ 1: 'wires', 2: 'print', 3: 'etch' })[r] : r === 2 ? 'gate' : null);
    const yours = yk ? '<div class="yours"><span class="kicker">' + esc(t('chipx.yours')) + '</span>' + esc(t('chipx.yours.' + yk, { name: t('design.proj.' + Y.p + '.t'), gates: Y.B.M.cells.length, transistors: Y.B.transistors, masks: Y.B.masks, wire: Math.round(Y.B.RT ? Y.B.RT.wl : 0) })) + '</div>'
      : !Y && r === 2 ? '<a class="yours none" href="#/place/studio">' + esc(t('chipx.yoursNone')) + '</a>' : '';
    chipFrame.dock.innerHTML = lineHtml(kicker, line, key,
      /* the same order on every dock: back and the other views on the left, the next step on the right */
      '<span class="navl">' + ((build ? r < ROWS.length - 1 : r > 0) ? '<button type="button" class="btn ghost" data-key="back" data-rowgo="' + (build ? r + 1 : r - 1) + '">' + esc(t('story.back')) + '</button>' : '') +
      '<a class="btn" href="' + esc(build ? '#/place/fab/inside' : '#/dive/' + R.dive) + '">' + esc(t(build ? 'chipx.atFab' : 'dive.flat')) + '</a></span>' +
      (done ? '<a class="btn primary" data-key="next" href="' + (build ? '#/place/port' : '#/') + '">' + esc(t(build ? 'chipx.ship' : 'chipx.back')) + '</a>' : '<button type="button" class="btn primary" data-key="next" data-rowgo="' + nextR + '">' + esc(t(build ? 'chipx.next' : 'chipx.deeper')) + '</button>')).replace('<div class="nav">', yours + '<div class="nav">');
  }
  function showChip(row, mode) {
    hideAll();
    $('chipCanvas').hidden = $('chipLabels').hidden = false; cui.hidden = false; showStage(true); document.body.classList.add('immersive');
    chipMode = mode === 'build' ? 'build' : 'dive'; chipRow = row != null && row >= 0 && row < ROWS.length ? row : chipMode === 'build' ? ROWS.length - 1 : 0;
    loading(true);
    const want = chipRow;   /* the chip may report its first row before the frame is ready */
    lastPlace = 'datacentre';
    return Promise.all([withFrame(), ensureChip()]).then(([, c]) => {
      chipFrame = frameOf(cui, { up: { href: '#/place/datacentre/5', label: t('board.up') }, path: [{ href: '#/', label: t('place.back') }, { href: '#/place/datacentre/5', label: t('map.datacentre.t') }, { label: t('chipx.title') }],
        rail: { label: t('place.levels'), items: ROWS.map(x => ({ id: x.dive, label: t('depth.' + x.dive + '.name') })) }, turn: true, face: chipMode === 'build' ? 'made' : 'used',
        onRail: d => c.go(ROWS.findIndex(x => x.dive === d)),
        /* made and used turn the stack in place; designed opens the studio */
        onTurn: (face, tw) => { if (face === 'designed') return turnTo(face, tw); chipMode = face === 'made' ? 'build' : 'dive'; c.mode(chipMode); chipPanel(); },
        onLook: drawChip });
      cui.onclick = e => { const b = e.target.closest('[data-rowgo]'); if (b) c.go(+b.dataset.rowgo); };
      loading(false); chipRow = want; c.mode(chipMode); c.set(want); c.resume(); chipPanel(); $('chipCanvas').focus({ preventScroll: true });
    });
  }

  /* ---- the flat views: the earlier site's continuous 2D world (src/app/world.js) in the frame. One canvas, three
     uses: the dive (a level as used: chip to atom), the line (as made: the factory step by step, a wafer travelling
     between the machines) and the bench (as designed: the studio, where your design is code and the drawings are
     of it). Tap a part and its note sits on the picture; the questions crossing a level are dots on their parts. ---- */
  const vui = $('diveui');
  const FLAT = {
    dive: { world: 'datacentre', title: 'dive.title', up: '#/place/datacentre/5', upWord: 'map.datacentre.t', face: 'used', kicker: 'place.level', next: 'chipx.deeper', hint: 'dive.hint' },
    line: { world: 'journey', title: 'line.title', up: '#/place/fab', upWord: 'map.fab.t', face: 'made', kicker: 'line.stepN', next: 'line.next', hint: 'line.hint' },
    bench: { world: 'design', title: 'bench.title', up: '#/place/studio', upWord: 'map.studio.t', face: 'designed', kicker: 'line.stepN', next: 'line.next', hint: 'bench.hint' }
  };
  /* the dive starts from any world: the data centre's chip, a phone, a car, or the made chip */
  const DIVES = {
    datacentre: { levels: DIVE_LEVELS, place: 'datacentre' },
    phone: { title: 'dive.phone.title', up: '#/place/phones', upWord: 'map.phones.t', place: 'phones' },
    car: { title: 'dive.car.title', up: '#/place/cars', upWord: 'map.cars.t', place: 'cars' },
    made: { title: 'dive.made.title', up: '#/place/fab', upWord: 'map.fab.t', place: 'fab', face: 'made' }
  };
  let diveWorld = 'datacentre';
  const FL = k => k === 'dive' ? Object.assign({}, FLAT.dive, { world: diveWorld }, DIVES[diveWorld]) : FLAT[k];
  let flatKind = 'dive', diveFrame = null, diveD = -1, divePart = null, diveThread = null, benchCh = null, WE = null, DiveData = null, DS = null;
  const levelsOf = k => FL(k).levels || DiveData.WORLDS.find(w => w.id === FL(k).world).depths;
  const diveId = () => WE.IDS[diveD];
  const ensureDive = () => dive ? Promise.resolve(dive) : Promise.all([import('../engines/weave.js'), import('../app/world.js'), import('../data/weave.js'), import('../app/design.js'), import('../app/journey.js'), import('./overlay.js')]).then(([E, Wm, Wd, Ds, Jm, Om]) => {
    WE = E; DiveData = Wd; DS = Ds; threadColorOf = Wm.threadColor;
    /* the dive's words in HTML over the picture: names, the note on a picked part, the questions' marks under Ask */
    flatWords = Om.createOverlay($('flatLabels'), { part: key => pickPart(key), mark: th => { location.hash = follow(th + '.' + diveId()); }, marks: ths => markAsk(ths), door: () => dive.flyTo(diveD + 1) });
    /* one HUD: the earlier site's own marks, dive label and band give way to the frame */
    /* one stage: the line's machines draw on the shared renderer too */
    Wm.setChrome({ dots: false, dive: false, lit: true, stage: () => stage($('diveCanvas')), overlay: flatWords,
      look: () => !!diveFrame && diveFrame.mode() === 'look' && !benchCh, ask: () => !!diveFrame && diveFrame.mode() === 'ask' }); Jm.setBand(false);
    dive = Wm.createWorld($('diveCanvas'), { depth: d => diveAt(d), arrive: d => diveAt(d), zoom: z => levelZoom(z), part: (d, key) => { const a = l3Active(); pickPart(a ? a.obj.hit(lastTap.x, lastTap.y) : key); }, pick: th => { diveThread = th; dive.setThread(th); if (!benchCh && flatKind !== 'supply') drawDive(); },
      site: id => supplySite(id), mapStep: i => supplyStep(i) });
    return dive;
  });
  /* a part picked on the picture or by its name: a ring on it and its note beside its name; a tap on nothing clears it */
  let flatWords = null;
  function pickPart(key) { divePart = key || null; dive.select(divePart); diveNotes(); }
  /* a mark standing for several questions: those lines light up in the dock's list */
  function markAsk(ths) {
    const want = new Set(ths.map(th => follow(th + '.' + diveId()))), lines = [...diveFrame.dock.querySelectorAll('.askline')];
    lines.forEach(a => a.classList.toggle('hit', want.has(a.getAttribute('href'))));
    const first = lines.find(a => a.classList.contains('hit')); if (first) first.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  /* the factory's 3D machines draw under the flat world on the line; nowhere else */
  const hide3d = () => { const w3 = document.getElementById('world3d'); if (w3) w3.style.display = 'none'; };
  function diveAt(d) {
    if (flatKind === 'supply') { diveD = d; return; }   /* the map stays over the line's last station */
    const id = WE.IDS[d];
    if (!levelsOf(flatKind).includes(id)) { if (flatKind === 'dive' && diveWorld === 'datacentre') location.hash = '#/place/datacentre/' + (id === 'board' ? 4 : 2); return; }   /* above the chip, the flight takes over */
    if (d !== diveD) { divePart = null; diveThread = null; dive.setThread(null); dive.select(null); }
    diveD = d; if (!diveFrame) return;
    const L = levelsOf(flatKind); diveFrame.rail(id, L.indexOf(id) / (L.length - 1)); diveFrame.level(id); diveFrame.face(FL(flatKind).face); diveNotes();
    if (diveFrame.mode() === 'look' && !benchCh) drawDive();
  }
  /* words on the picture: the note on the part you picked, from its one home in the atlas. A note opens only on a
     part you pick, flat or in 3D; until then the picture and its names explain themselves */
  function diveNotes() {
    const id = diveId(), key = divePart;
    Object.entries(L3).forEach(([lv, l]) => { const w = key && DiveData.partWord(lv, key); if (l.obj) l.obj.select(id === lv && key ? key : null, w && EN_HAS(w) ? { title: t('part.' + w), text: t('what.' + w) } : null); });
    if (!key) return dive.setNotes([]);
    const w = DiveData.partWord(id, key); if (!EN_HAS(w)) return dive.setNotes([]);
    dive.setNotes([{ part: key, title: t('part.' + w), text: t('what.' + w), tone: 'cool' }]);
  }
  /* ---- the levels in 3D (src/v2/level3d.js: the chips as reliefs, the gate, the switch, the atom): as the dive reaches one, the flat picture gives
     way to a model of it on the one stage, in the same square; the flat drawing stays the fallback ---- */
  const L3 = { chip: { mod: './relief3d.js', arg: 'chip' }, soc: { mod: './relief3d.js', arg: 'soc' }, mcu: { mod: './relief3d.js', arg: 'mcu' }, die: { mod: './relief3d.js', arg: 'die' }, block: { mod: './relief3d.js', arg: 'block' }, wafer: { mod: './wafer3d.js' }, phone: { mod: './phone3d.js' }, phoneboard: { mod: './pcb3d.js', arg: 'phoneboard' }, ecu: { mod: './pcb3d.js', arg: 'ecu' },
    gate: { mod: './gate3d.js' }, switch: { mod: './switch3d.js' }, atom: { mod: './atom3d.js' } };
  /* each level writes its names in a layer of its own over the stage */
  const l3Host = lv => { let h = $('l3-' + lv); if (!h) { h = document.createElement('div'); h.className = 'labels'; h.id = 'l3-' + lv; h.hidden = true; $('flatLabels').after(h); } return h; };
  const l3Active = () => Object.values(L3).find(l => l.obj && l.obj.active());
  const lastTap = { x: 0, y: 0 };
  $('diveCanvas').addEventListener('pointerup', e => { lastTap.x = e.clientX; lastTap.y = e.clientY; }, true);
  const ensureL3 = lv => { const l = L3[lv]; return l.making || (l.making = import(l.mod).then(m => (l.obj = (l.arg ? m.create(l.arg) : m.create)($('diveCanvas'), l3Host(lv), { part: key => pickPart(key),
    marks: () => (diveFrame && diveFrame.mode() === 'ask' ? askMarks(lv) : null), mark: th => { location.hash = follow(th + '.' + lv); }, askMany: ths => markAsk(ths) }))).catch(() => null)); };
  /* the questions at a level, grouped by the part each is about (the first of its parts): the marks under Ask */
  const askMarks = id => { const by = new Map(); DiveData.THREADS.forEach(th => { const nm = DiveData.STOPS[th.id + '.' + id], key = nm && nm[0]; if (!key) return; if (!by.has(key)) by.set(key, []); by.get(key).push({ id: th.id, color: threadColorOf(th.id) }); }); return [...by].map(([part, threads]) => ({ part, threads })); };
  let threadColorOf = () => '';
  const hideL3 = () => { Object.values(L3).forEach(l => { if (l.obj) l.obj.show(0); }); $('diveCanvas').style.opacity = ''; $('flatLabels').style.visibility = ''; };
  function levelZoom(z) {
    if (!dive || !WE || flatKind !== 'dive' || $('diveCanvas').hidden) { hideL3(); return; }
    let top = 0;
    Object.entries(L3).forEach(([lv, l]) => {
      const ds = WE.IDS.indexOf(lv), d = z - ds, k = ds < 0 ? 0 : 1 - Math.min(1, Math.max(0, (Math.abs(d) - 0.08) / 0.32));
      if (k <= 0) { if (l.obj) l.obj.show(0); return; }
      if (!l.obj) { ensureL3(lv).then(o => { if (o && flatKind === 'dive') { levelZoom(dive.z); diveNotes(); } }); return; }
      l.obj.show(k, d, dive.frame); top = Math.max(top, k);
    });
    /* the flat picture and its words give way to the model; the stage shows while one is there */
    $('diveCanvas').style.opacity = String(1 - top);
    $('flatLabels').style.visibility = top > 0.5 ? 'hidden' : '';
    showStage(top > 0);
  }
  const EN_HAS = w => t('part.' + w) !== 'part.' + w;
  function drawDive() {
    const F = FL(flatKind), L = levelsOf(flatKind), id = diveId(), i = L.indexOf(id), last = i === L.length - 1;
    const key = diveThread && DiveData.STOPS[diveThread + '.' + id] ? diveThread + '.' + id : stopsAt(id)[0];
    /* the parts this story is about are named first on the picture */
    dive.setLead(key && DiveData.STOPS[key] ? DiveData.STOPS[key] : [DiveData.NOTE_AT[id]].filter(Boolean));
    /* your design, where the line carries it */
    const Y = flatKind === 'line' && Game.yourDesign(S), yk = Y && ({ print: 'print', etch: 'etch', wires: 'wires' })[id];
    /* on the bench, what this station did with your design (the studio's caption, moved off the picture) */
    /* on the bench, your design's state (right or not, who wrote it, which job) is words, so it is here, not drawn */
    const BS = flatKind === 'bench' ? DS.bandState() : null;
    const benchYours = BS ? '<div class="yours"><span class="kicker">' + esc(t('chipx.yours')) + ' · ' + esc(BS.job) + '</span><p class="verdict ' + (BS.right ? 'good' : 'bad') + '">' + esc(BS.said) + '</p>' + esc(t('design.cap.' + id + '.d', DS.numbers())) + '</div>' : '';
    const yours = benchYours + (yk ? '<div class="yours"><span class="kicker">' + esc(t('chipx.yours')) + '</span>' + esc(t('chipx.yours.' + yk, { name: t('design.proj.' + Y.p + '.t'), gates: Y.B.M.cells.length, transistors: Y.B.transistors, masks: Y.B.masks, wire: Math.round(Y.B.RT ? Y.B.RT.wl : 0) })) + '</div>' : '');
    const end = { dive: '<a class="btn primary" href="#/">' + esc(t('chipx.back')) + '</a>', line: '<a class="btn primary" href="#/place/port">' + esc(t('line.end')) + '</a>', bench: '<a class="btn primary" href="#/line/print">' + esc(t('bench.toFab')) + '</a>' }[flatKind];
    diveFrame.dock.innerHTML = lineHtml(t(F.kicker, { n: i + 1, total: L.length }) + ' · ' + t('depth.' + id + '.name'), t('depth.' + id + '.see'), key,
      (i || (flatKind === 'dive' && diveWorld === 'datacentre') ? '<button type="button" class="btn ghost" data-key="back" data-divego="' + (diveD - 1) + '">' + esc(t(i ? 'story.back' : 'dive.up')) + '</button>' : '<span></span>') +
      (last ? end : '<button type="button" class="btn primary" data-key="next" data-divego="' + (diveD + 1) + '">' + esc(t(F.next)) + '</button>')).replace('<div class="nav">', yours + '<p class="small muted hintline">' + esc(t(F.hint)) + '</p><div class="nav">');
    requestAnimationFrame(diveInset);
  }
  /* keep the picture clear of the frame: the rail on the left, the corner, the dock below */
  const diveInset = () => { if (!dive || !diveFrame) return; const wide = innerWidth > 720, b = diveFrame.dock.offsetHeight + (wide ? 24 : 18); dive.setInset({ l: wide ? 90 : 8, r: wide ? 20 : 8, t: wide ? 122 : 236, b }); };
  /* the bench: a design challenge played in the dock; the drawings above follow your description */
  const syncDesign = ch => { if (DS && ch && ch.kind === 'design') DS.setDesign(Game.checkDesign(ch.p, S.codes[ch.p] || Game.starter(ch.p))); };
  function openBench(ch) {
    benchCh = ch; const dock = diveFrame.dock; dock.classList.add('benchdock'); syncDesign(ch);
    play(dock, ch, { state: S, startChip: () => Object.assign({}, Game.START),
      save: () => { save(); syncDesign(ch); },
      open: c => { location.hash = c.kind === 'design' ? '#/bench/' + c.at + '/' + c.id : '#/do/' + c.id; },
      back: () => { benchCh = null; dock.classList.remove('benchdock'); dock.onclick = null; dock.oninput = null; drawDive(); },
      /* won: the island grows, and the drawings fly to your gates */
      done: c => { won(c); dive.flyTo(WE.IDS.indexOf('gates')); } });
    requestAnimationFrame(diveInset);
  }
  function showFlat(kind, depth, chId, world) {
    hideAll(); document.body.classList.add('immersive'); flatKind = kind; benchCh = null; if (kind === 'dive') diveWorld = DIVES[world] ? world : 'datacentre';
    $('diveCanvas').hidden = false; vui.hidden = false; $('flatLabels').hidden = false;
    loading(true); lastPlace = kind === 'dive' ? DIVES[diveWorld].place : { line: 'fab', bench: 'studio' }[kind];
    return Promise.all([withFrame(), ensureDive()]).then(([, w]) => {
      const F = FL(kind); WE.setWorld(F.world); w.setMap(null); diveFrame && diveFrame.dock.classList.remove('supdock'); if (kind !== 'line') hide3d(); DS.setBandCaption(false);
      /* the bench draws your design: the last you won, else the first job's */
      if (kind === 'bench') { const Y = Game.yourDesign(S); DS.setDesign(Y ? Y.B : Game.checkDesign('half', S.codes.half || Game.starter('half'))); }
      const L = levelsOf(kind);
      diveFrame = frameOf(vui, { up: { href: F.up, label: t(F.upWord) }, path: [{ href: '#/', label: t('place.back') }, { href: F.up, label: t(F.upWord) }, { label: t(F.title) }],
        rail: { label: t('place.levels'), items: L.map(k => ({ id: k, label: t('depth.' + k + '.name') })) }, turn: true, face: F.face,
        onRail: k => w.flyTo(WE.IDS.indexOf(k)), onTurn: (face, tw) => { if (face !== F.face) turnTo(face, tw); }, onLook: () => { if (benchCh) openBench(benchCh); else drawDive(); } }); watchDock();
      vui.onclick = e => { const b = e.target.closest('[data-divego]'); if (b) w.flyTo(+b.dataset.divego); };
      const d = WE.IDS.indexOf(L.includes(depth) ? depth : L[0]);
      loading(false); w.start(); w.setZ(d); diveD = -1; diveAt(d); $('diveCanvas').focus({ preventScroll: true });
      const ch = chId && Game.challengeOf(chId); if (ch) openBench(ch);
    });
  }
  /* ---- the supply map: a chip's whole trip across the world (the earlier site's map, src/app/map.js), drawn by
     the flat world over the line and told in the dock: a route, its steps, a place, and what stops if it shuts ---- */
  let SUP = null, Wdata = null, Sup = null;
  const supState = () => { const r = Wdata.ROUTES[SUP.world], focus = r[SUP.step] || r[0], first = SUP.site || focus.at[0] || (focus.flow[0] || [])[1] || 'hsc';
    return { route: r, world: SUP.world, step: SUP.step, here: null, site: SUP.site, closed: new Set(SUP.closed), st: Sup.status(r, SUP.closed), from: Wdata.SITES[first] }; };
  const supShow = () => { if (!SUP || flatKind !== 'supply') return; dive.setMap(supState()); diveFrame.rail(Wdata.ROUTES[SUP.world][SUP.step].id, SUP.step / (Wdata.ROUTES[SUP.world].length - 1)); if (diveFrame.mode() === 'look') drawSupply(); };
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
    h += '<p class="kicker">' + esc(t('map.step')) + ' · ' + esc(t('route.step.' + step.id)) + '</p>' + (SUP.site ? '' : '<p class="small">' + esc(t('route.' + (t('route.' + SUP.world + '.' + step.id) !== 'route.' + SUP.world + '.' + step.id ? SUP.world : 'any') + '.' + step.id)) + '</p>');
    if (step.at.length) h += '<p class="small muted">' + esc(t('map.places')) + '</p><div class="chips">' + step.at.map(siteBtn).join('') + '</div>';
    if (SUP.site) { const id = SUP.site, shut = SUP.closed.includes(id);
      h += '<div class="yours"><span class="kicker">' + esc(t('site.' + id + '.name')) + ' · ' + esc(t('site.' + id + '.where')) + '</span>' + esc(t('site.' + id + '.what')) + ' <span class="muted">' + esc(t('site.' + id + '.who')) + '</span></div>' +
        '<button type="button" class="btn' + (shut ? '' : ' primary') + '" data-shut="' + id + '">' + esc(t(shut ? 'map.reopen' : 'map.shut')) + '</button>'; }
    const i = SUP.step, n = r.length;
    h += '<div class="nav">' + (i ? '<button type="button" class="btn ghost" data-key="back" data-supstep="' + (i - 1) + '">' + esc(t('story.back')) + '</button>' : '<span></span>') +
      (step.st ? '<a class="btn" href="#/line/' + step.st + '">' + esc(t('map.toStation', { station: t('depth.' + step.st + '.name') })) + '</a>' : '') +
      (i < n - 1 ? '<button type="button" class="btn primary" data-key="next" data-supstep="' + (i + 1) + '">' + esc(t('line.next')) + '</button>' : '<a class="btn primary" href="#/place/port">' + esc(t('chipx.back')) + '</a>') + '</div>';
    diveFrame.dock.innerHTML = h; diveFrame.dock.classList.add('supdock'); requestAnimationFrame(diveInset);
  }
  function showSupply(world) {
    hideAll(); document.body.classList.add('immersive'); flatKind = 'supply'; benchCh = null;
    $('diveCanvas').hidden = false; vui.hidden = false; loading(true); lastPlace = 'port';
    return Promise.all([withFrame(), ensureDive(), import('../data/world.js'), import('../engines/supply.js')]).then(([, w, Wd, Sp]) => {
      Wdata = Wd; Sup = Sp; WE.setWorld('journey'); DS.setBandCaption(false);
      const wd = Wdata.ROUTES[world] ? world : (SUP && SUP.world) || 'datacentre';
      SUP = { world: wd, step: 0, site: null, closed: [] };
      const r = Wdata.ROUTES[wd];
      diveFrame = frameOf(vui, { up: { href: '#/place/port', label: t('map.port.t') }, path: [{ href: '#/', label: t('place.back') }, { href: '#/place/port', label: t('map.port.t') }, { label: t('page.ecosystem.map') }],
        rail: { label: t('map.routes'), items: r.map(st => ({ id: st.id, label: t('route.step.' + st.id) })) },
        onRail: id => supplyStep(Wdata.ROUTES[SUP.world].findIndex(st => st.id === id)), onLook: drawSupply }); watchDock();
      vui.onclick = e => {
        const s = e.target.closest('[data-supstep]'); if (s) return supplyStep(+s.dataset.supstep);
        const st = e.target.closest('[data-site]'); if (st) return supplySite(st.dataset.site);
        const wb = e.target.closest('[data-supworld]'); if (wb) { location.hash = '#/supply/' + wb.dataset.supworld; return; }
        const sh = e.target.closest('[data-shut]'); if (sh) { const id = sh.dataset.shut; SUP.closed = SUP.closed.includes(id) ? SUP.closed.filter(x => x !== id) : SUP.closed.concat(id); return supShow(); }
        if (e.target.closest('[data-openall]')) { SUP.closed = []; return supShow(); }
      };
      loading(false); w.start(); w.setZ(WE.IDS.indexOf('ship')); diveD = WE.IDS.indexOf('ship'); hide3d();
      diveFrame.level('ship'); supShow(); $('diveCanvas').focus({ preventScroll: true });
    });
  }
  const showDive = (depth, world) => showFlat('dive', depth, null, world || Game.DIVE_WORLD[depth]);
  addEventListener('resize', () => { if (!vui.hidden) diveInset(); });
  /* the picture keeps clear of the dock as it grows or shrinks (Ask's list, a challenge, a note) */
  const dockObs = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (!vui.hidden) diveInset(); }) : null;
  const watchDock = () => { if (dockObs && diveFrame) { dockObs.disconnect(); dockObs.observe(diveFrame.dock); } };

  /* ---- one board, no side panel: words on the parts, a story docked below that drives the camera ---- */
  const bui = $('boardui');
  const hideBoard = () => { $('boardCanvas').hidden = $('boardLabels').hidden = true; bui.hidden = true; board && board.pause(); };
  const ensureBoard = () => boardP || (boardP = import('./board3d.js').then(m => (board = m.createBoard($('boardCanvas'), $('boardLabels'), { part: id => story && story.part(id), dive: () => { location.hash = '#/chip/0'; } }))));
  function showBoard() {
    hideAll(); document.body.classList.add('immersive');
    $('boardCanvas').hidden = $('boardLabels').hidden = false; bui.hidden = false; showStage(true);
    loading(true); lastPlace = 'datacentre';
    return Promise.all([withFrame(), ensureBoard(), import('./story.js'), import('./stories.js')]).then(([, b, St, Sd]) => {
      loading(false); b.resume(); const data = Sd.boardStory();
      const fr = boardFrame = frameOf(bui, { up: { href: '#/place/datacentre/4', label: t('board.up') }, path: [{ href: '#/', label: t('place.back') }, { href: '#/place/datacentre/4', label: t('map.datacentre.t') }, { label: t('place.dc.board.t') }],
        rail: { label: t('place.levels'), items: LEVELS.map(k => ({ id: k, label: t('place.dc.' + k + '.t') })) }, turn: true,
        onRail: k => { location.hash = k === 'chip' ? '#/chip/0' : k === 'board' ? '#/board' : '#/place/datacentre/' + LEVELS.indexOf(k); }, onTurn: turnTo, onLook: () => story && story.go(story.at) });
      fr.rail('board', LEVELS.indexOf('board') / (LEVELS.length - 1)); fr.level('board');
      story = St.createStory(fr.dock, b, data, { follow, step: st => fr.goal(st.live ? '<p class="kicker">' + esc(t('board.goal')) + '</p>' + data.gauges(data.state).map(x => '<div class="gauge' + (x.warm ? ' warmg' : ' ok') + '"><span class="gl">' + esc(t('board.gauge.' + x.id)) + '</span><span class="gv">' + esc(x.text) + '</span><span class="gbar"><span style="width:' + Math.round(x.v * 100) + '%"></span></span></div>').join('') : null) });
      $('boardCanvas').focus({ preventScroll: true });
    });
  }
  let story = null, boardFrame = null;
  /* every view hides the others first */
  function hideAll() {
    $('diveCanvas').hidden = true; vui.hidden = true; dive && dive.stop(); hide3d(); $('flatLabels').hidden = true; if (flatWords) flatWords.clear();
    hideBoard(); $('hero').hidden = true; closeSheet(); pui.hidden = true; cui.hidden = true; dc && dc.pause(); map && map.pause(); chip && chip.pause();
    ['mapCanvas', 'mapLabels', 'placeCanvas', 'placeLabels', 'chipCanvas', 'chipLabels'].forEach(k => { $(k).hidden = true; });
    document.body.classList.remove('immersive'); page.hidden = true; hideL3(); showStage(false);
  }
  function showMap(from) {
    $('diveCanvas').hidden = true; vui.hidden = true; dive && dive.stop(); hide3d(); $('flatLabels').hidden = true; if (flatWords) flatWords.clear();
    hideBoard(); document.body.classList.remove('immersive');
    $('chipCanvas').hidden = $('chipLabels').hidden = true; cui.hidden = true; chip && chip.pause();
    $('placeCanvas').hidden = $('placeLabels').hidden = true; pui.hidden = true; dc && dc.pause();
    $('mapCanvas').hidden = $('mapLabels').hidden = false; $('hero').hidden = false; showStage(true);
    loading(!map); return ensureMap().then(m => { if (from && lastPlace) { m.from(lastPlace); m.focus(lastPlace); } m.resume(); return m; });
  }
  const goExplore = then => { page.hidden = true; if ((location.hash || '#/') !== '#/' && location.hash !== '') { location.hash = '#/'; setTimeout(then, 80); } else then(); };

  /* ---- the pages ---- */
  const page = $('page');
  function showPage(k) {
    let h = '<div class="inner"><h1>' + esc(t('nav.' + k)) + '</h1><p class="lead">' + esc(t('page.' + k + '.lead')) + '</p>';
    const C = Game.community(S);
    if (k === 'challenges') {
      h += Game.STEPS.map((s, i) => { const st = Game.stepState(S, s); return '<section class="stepsec"><h2><span class="num">' + (i + 1) + '</span>' + esc(t('game.step.' + s)) + ' <span class="small muted">' + esc(t('map.' + Game.STATION[s] + '.t')) + ' · ' + st.done + '/' + st.total + '</span></h2><div class="grid">' + Game.stepChallenges(s).map(chCard).join('') + '</div></section>'; }).join('');
      h += '<section class="stepsec"><h2><span class="num">⚙</span>' + esc(t('game.jobs')) + ' <span class="small muted">' + esc(t('game.jobsD')) + '</span></h2><div class="grid">' + C.jobs.map(jobCard).join('') + '</div></section>';
    } else if (k === 'questions') {
      /* by place, level by level; the block, gate, switch and atom every chip shares are shown once, in the data centre */
      h += PLACES.filter(p => (Game.ASK[p.id] || []).length).map(p => '<section class="stepsec"><h2>' + esc(t('map.' + p.id + '.t')) + ' <span class="small muted">' + esc(kickerOf(p.id)) + '</span></h2>' +
        Game.askAt(p.id).filter(g => !g.level || p.id === 'datacentre' || !Game.SHARED.includes(g.level.depth)).map(g => (g.level ? '<p class="kicker">' + esc(t('depth.' + g.level.depth + '.name')) + '</p>' : '') + '<div class="qgrid">' + g.stops.map(key => '<a class="qcard" href="' + esc(follow(key)) + '" style="--qc:' + qColor(key) + '"><span class="q">' + esc(t('stop.' + key + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a>').join('') + '</div>').join('') + '</section>').join('');
    } else if (k === 'build') {
      const tree = id => { const st = C.state[id], kids = childrenOf(id); return '<ul class="tree"><li><span class="node ' + st.state + (st.yours ? ' yours' : '') + '">' + esc(t('build.need.' + id + '.t')) + (st.n ? ' ×' + st.n : '') + '</span>' + kids.map(c => tree(c.id)).join('') + '</li></ul>'; };
      h += '<div class="plan2"><div class="tower" aria-hidden="true">' + islandState().floors.slice().reverse().map(f => '<span class="fl ' + f + '"></span>').join('') + '</div><div><p class="big">' + esc(t('page.build.progress', { built: C.built, total: C.total })) + '</p><p class="small muted">' + esc(t('page.build.legend')) + '</p>' + tree('computer') + '</div></div>';
      h += '<h2>' + esc(t('game.jobs')) + '</h2><div class="grid">' + C.jobs.map(jobCard).join('') + '</div>';
      h += '<h2>' + esc(t('page.build.how')) + '</h2><div class="cards"><a class="card2" href="#/bench/need"><b>' + esc(t('page.build.studio')) + '</b><span>' + esc(t('page.build.studioD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/blob/main/docs/MCP.md') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.port')) + '</b><span>' + esc(t('page.build.portD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/issues/new?template=need.yml') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.join')) + '</b><span>' + esc(t('page.build.joinD')) + '</span></a></div>';
      h += '<h2>' + esc(t('page.build.designs')) + '</h2><div class="grid">' + C.designs.map(d => '<div class="chcard done"><span class="st">⌂</span><span><b>' + esc(d.title) + '</b><span class="small">' + esc(d.author) + ' · ' + esc(t('build.kind.' + d.kind)) + ' · ' + esc(t('build.need.' + d.need + '.t')) + '</span></span></div>').join('') + '</div>';
    }
    page.innerHTML = h + '<p class="small muted">' + esc(t('page.preview')) + '</p></div>'; page.hidden = false; page.scrollTop = 0;
  }
  page.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { const ch = Game.challengeOf(o.dataset.open); goExplore(() => openChallenge(ch)); return; }
    const j = e.target.closest('[data-job]'); if (j) { const need = j.dataset.job; goExplore(() => openJob(need)); }
  });
  /* the ecosystem: fly out to the islands; the sheet tells what lies beyond */
  function showEcosystem() {
    map && map.ecosystem();
    $('hero').classList.add('away'); sheet.onclick = null; sheet.oninput = null;
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(t('nav.ecosystem')) + '</p><h2>' + esc(t('page.ecosystem.title')) + '</h2><p>' + esc(t('page.ecosystem.lead')) + '</p>' +
      ['phones', 'cars', 'idea'].map(id => '<button type="button" class="chcard" data-place="' + id + '"><span class="st">' + (id === 'idea' ? '+' : S.done[id === 'phones' ? 'phone' : 'car'] ? '✓' : '') + '</span><span><b>' + esc(t('map.' + id + '.t')) + '</b><span class="small">' + esc(t('map.' + id + '.d')) + '</span></span></button>').join('') +
      '<p class="kicker">' + esc(t('page.ecosystem.world')) + '</p><a class="look" href="#/supply"><b>' + esc(t('page.ecosystem.map')) + '</b><span class="small">' + esc(t('page.ecosystem.mapD')) + '</span><span class="small muted">' + esc(t('game.current')) + '</span></a>' +
      '<div class="debate2"><b>' + esc(t('debate.supply.t')) + '</b><span class="small">' + esc(t('debate.supply.q')) + '</span></div>';
    sheet.hidden = false; cur = null;
  }

  /* ---- following a question: one stop of a thread's trail, in the dock of the view that shows its level ---- */
  /* the figures behind a stop, each with its source, kind and the date it was checked (src/data/facts.json) */
  let FACT = null;
  const facts = () => FACT ? Promise.resolve(FACT) : fetch('src/data/facts.json').then(r => r.json()).then(j => (FACT = Object.fromEntries((j.facts || []).map(f => [f.id, f]))), () => (FACT = {}));
  const ext = (href, html) => '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + html + '</a>';
  const figuresHtml = key => { const fs = (FIGURES[key] || []).map(id => FACT && FACT[id]).filter(Boolean); if (!fs.length) return '';
    return '<p class="kicker">' + esc(t('trail.figures')) + '</p><ul class="figs2">' + fs.map(f => '<li><b>' + esc(f.value) + '</b> ' + esc(f.label) + '<span class="small muted"> · ' + ext(f.url, esc(f.source)) + ' · ' + esc(t('trail.checked', { kind: t('fact.' + f.kind), date: fmtDate(f.verified) })) + '</span></li>').join('') + '</ul>'; };
  /* a real case that happened at this stop: what, why, and what came after, with its source */
  const casesHtml = key => CASES.filter(c => c.stop === key).map(c => '<details class="case2"><summary><span class="kicker">' + esc(t('trail.case', { year: c.year })) + '</span> <b>' + esc(t('case.' + c.id + '.t')) + '</b></summary>' +
    ['what', 'why', 'after'].map(k => '<p class="small">' + esc(t('case.' + c.id + '.' + k)) + '</p>').join('') + '<p class="small muted">' + ext(c.url, esc(t('case.' + c.id + '.src'))) + '</p></details>').join('');
  const trailSeen = {};   /* the stops of each thread seen in this visit: after two, the question underneath may show */
  function stopHtml(th, d) {
    const T = Game.trail(th), i = T.indexOf(d), key = th + '.' + d, tried = t('stop.' + key + '.tried');
    const step = (j, k) => T[j] != null ? '<a class="btn' + (k === 'next' ? ' primary' : ' ghost') + '" data-key="' + k + '" href="' + esc(Game.askHref(th + '.' + T[j])) + '">' + esc(t(k === 'next' ? 'trail.next' : 'trail.prev', { level: t('depth.' + T[j] + '.name') })) + '</a>' : '<span></span>';
    let h = '<p class="kicker trailk" style="--qc:' + qColor(key) + '"><span class="dotq"></span>' + esc(t('trail.k', { n: i + 1, total: T.length, level: t('depth.' + d + '.name') })) + '</p>';
    h += '<p class="line trailq">' + esc(t('stop.' + key + '.q')) + '</p><p class="small">' + esc(t('stop.' + key + '.note')) + '</p>';
    if (Array.isArray(tried)) h += '<p class="kicker">' + esc(t('trail.tried')) + '</p><ul class="tried2">' + tried.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    h += casesHtml(key) + figuresHtml(key);
    /* the question behind the question: one root at a time, once two of its stops have been seen */
    if (rootShown(trailSeen[th])) h += '<div class="root2"><p class="small muted">' + esc(t('ui.rootOf')) + '</p><p class="rootq">' + esc(t('thread.' + th + '.root')) + '</p><p class="small muted">' + esc(t('ui.behind')) + ' <em>' + esc(t('thread.' + th + '.behind')) + '</em></p></div>';
    return h + '<div class="nav"><span class="navl">' + step(i - 1, 'back') + '<button type="button" class="btn ghost" data-leave>' + esc(t('trail.leave')) + '</button></span>' + step(i + 1, 'next') + '</div>';
  }
  function askStop(th, d) {
    if (!Game.trail(th).includes(d)) return;
    trailSeen[th] = [...new Set([...(trailSeen[th] || []), d])];
    if (!FACT) return facts().then(() => askStop(th, d));
    const html = stopHtml(th, d);
    const fr = !vui.hidden ? diveFrame : !cui.hidden ? chipFrame : !pui.hidden ? dcFrame : !bui.hidden ? boardFrame : null;
    if (fr) {
      fr.stop(html);
      /* on the flat dive, the question's parts light up on the picture */
      if (fr === diveFrame && dive && dive.setThread) { diveThread = th; dive.setThread(th); }
      if (fr === diveFrame) requestAnimationFrame(diveInset);
      return;
    }
    /* a level met at its place on the island: the question in the island's dock */
    sheet.onclick = null; sheet.oninput = null;
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>' + html;
    sheet.hidden = false; sheet.scrollTop = 0; $('hero').classList.add('away');
  }
  /* leaving a question: back to the view's own words */
  document.addEventListener('click', e => { const l = e.target.closest('[data-leave]'); if (!l) return;
    const fr = !vui.hidden ? diveFrame : !cui.hidden ? chipFrame : !pui.hidden ? dcFrame : !bui.hidden ? boardFrame : null;
    if (fr) { if (fr === diveFrame && dive) { diveThread = null; dive.setThread(null); } fr.look(); } else closeSheet(); });

  /* ---- routes ---- */
  /* which view an address shows, and how deep it sits: the island 0, a place 1, the board 2, the chip 3, the dive 4.
     Going between views is never a cut: deeper zooms in, higher zooms out, the Turn turns, along slides. */
  const partsOf = h => (h.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const viewOf = p => { const k = p[0]; if (k === 'ask') return viewOf(partsOf(Game.viewOfDepth(p[2] || 'chip')));
    if (k === 'dive') { const w = p[2] || Game.DIVE_WORLD[p[1]] || 'datacentre'; if (w === 'datacentre') return ['dive', 4]; const i = Math.max(0, ['phone', 'phoneboard', 'soc', 'car', 'ecu', 'mcu', 'scanner', 'wafer', 'die'].indexOf(p[1]) % 3); return ['dive:' + w, Game.DIVE_WORLD[p[1]] ? 1 + i : 4]; }
    if (k === 'supply') return ['supply', 0];
    return k === 'board' ? ['board', 2] : k === 'line' ? ['line', 1] : k === 'bench' ? ['bench', 1] : k === 'chip' ? ['chip', 3]
      : k === 'place' && p[1] === 'datacentre' && p[2] !== 'inside' ? ['dc', 1] : ['map', 0]; };
  let shownAt = null;   /* the address of the view now made, so a question at the same level only changes the dock */
  let viewNow = null, rankNow = 0, nextMove = null, lastPlace = null, entering = false;
  /* going inside from the island: the camera dives into the place first, then the view zooms in from it */
  function enter(href) {
    if (entering) return;
    if (still() || !map || $('mapCanvas').hidden || !lastFocus()) { location.hash = href; return; }
    entering = true; map.dive(lastFocus()).then(() => { entering = false; location.hash = href; });
  }
  const lastFocus = () => (cur && cur.place) || null;
  sheet.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (!a || viewOf(partsOf(a.getAttribute('href')))[0] === 'map') return; e.preventDefault(); e.stopPropagation(); enter(a.getAttribute('href')); }, true);
  function show(parts, from) {
    const k = parts[0] || 'explore';
    /* a question at a level already in view: no need to make the view again, only the dock changes */
    if (k === 'ask' && parts[1] && parts[2]) { const at = Game.viewOfDepth(parts[2]); if (at === shownAt && !from) { askStop(parts[1], parts[2]); return Promise.resolve(); } return show(partsOf(at), from).then(() => askStop(parts[1], parts[2])); }
    shownAt = '#/' + parts.join('/');
    if (k === 'board') return showBoard();
    if (k === 'dive') return showDive(parts[1], parts[2]);
    if (k === 'supply') return showSupply(parts[1]);
    if (k === 'line') return showFlat('line', parts[1]);
    if (k === 'bench') return showFlat('bench', parts[1], parts[2]);
    if (k === 'do' && parts[1]) return showMap(from).then(() => openChallenge(Game.challengeOf(parts[1])));
    if (k === 'chip') return showChip(parts[1] != null ? +parts[1] : null, parts[2]);
    if (k === 'place' && parts[1] === 'datacentre' && parts[2] !== 'inside') return showPlace('datacentre', parts[2] != null ? +parts[2] : null);
    if (k === 'place' && Game.PLACES.includes(parts[1])) return showMap(from).then(() => openPlace(parts[1], parts[2] === 'inside' ? 'look' : null));
    if (['challenges', 'questions', 'build'].includes(k)) showPage(k);
    return showMap(from).then(() => { if (k === 'ecosystem') showEcosystem(); });
  }
  function route() {
    const parts = partsOf(location.hash), k = parts[0] || 'explore';
    const nav = k === 'ask' || k === 'supply' || k === 'place' || k === 'chip' || k === 'board' || k === 'dive' || k === 'line' || k === 'bench' ? 'explore' : MENU.includes(k) ? k : 'explore';
    menu.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === nav ? 'page' : 'false'));
    page.hidden = true;
    const [view, rank] = viewOf(parts), from = viewNow, move = nextMove || (rank > rankNow ? 'in' : rank < rankNow ? 'out' : 'along');
    nextMove = null; viewNow = view; rankNow = rank;
    if (!from || from === view || still() || !document.startViewTransition) return show(parts, from && from !== view ? from : null);
    /* the old picture holds while the new view is made (at most a moment), then one zooms into the other */
    const root = document.documentElement; root.dataset.move = move;
    const tr = document.startViewTransition(() => Promise.race([show(parts, from), new Promise(r => setTimeout(r, 1500))]));
    tr.finished.finally(() => { if (root.dataset.move === move) delete root.dataset.move; });
  }
  /* one set of keys on every frame: ← → step along (the dock's back and next), Escape goes up */
  document.addEventListener('keydown', e => {
    /* a picture that steps along by itself (the flat world) has already taken the key */
    if (e.defaultPrevented || (e.target.closest && e.target.closest('input, textarea, select, [data-live]'))) return; /* i18n-ok */
    const host = [vui, cui, pui, bui].find(h => h && !h.hidden); if (!host) return;
    if (e.key === 'Escape') { const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const b = host.querySelector('.dock [data-key="' + (e.key === 'ArrowRight' ? 'next' : 'back') + '"]');
    if (b) { b.click(); e.preventDefault(); }
  });
  window.addEventListener('hashchange', route);
  hud(); firstGo();
  route();
}
