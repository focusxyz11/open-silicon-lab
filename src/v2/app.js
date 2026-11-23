/* The shell (docs/reviews/structure.md). The lab is one grid: across it a chip's life, the loop (need, design, make,
   test, ship, use, and back to the need), and down it scale (a place, then its levels to the atom). The bar holds the
   loop: it says which stage you are at and moves you along, holding your level where it exists there
   (src/engines/way.js). The side rail holds the levels. Everything else is one card at the bottom, the same on the
   island and in every view, with three faces: Look (what this is, and the two moves from here: in, and on round the
   loop), Do (its challenges, played right there, in the card of the view that shows their level: src/v2/play.js)
   and Ask (its questions, and what people and agents have asked). There is no menu: the commons is the need, the
   place where the loop starts and comes back (the Lab, and its record, #/build); what you met and did is your log
   (#/log); the world around the island is the way out from it (#/ecosystem).
   Routes: #/ (the blueprint, the first page: src/v2/home.js), #/stations (the station map: src/v2/stations.js), #/island (the island), #/place/<id>, #/place/datacentre/<level>, #/chip/<row>/build (inside a chip, layer by layer: the dive's levels as made),
   #/board (one board, with a story that drives it), #/dive/<depth>[/<world>] (the dive), #/line/<step> (the factory),
   #/bench/<level>[/<challenge>] (the studio), #/do/<challenge>, #/ask/<thread>/<depth>, #/supply, #/log, #/build,
   #/ecosystem. Words are read with t(). */
import { t, needWords, needAllWords } from '../core/i18n.js';
import { needStyles } from '../core/styles.js';
import { THREADS } from '../data/weave.js';
import { NEEDS } from '../data/build.js';
import { childrenOf } from '../engines/build.js';
import * as Game from './game.js';
import * as Way from '../engines/way.js';
import { play, titleOf, goalOf, labsLoaded, labsReady } from './play.js';
import { PLACES, CHIP_ROWS as ROWS } from '../data/views3d.js';
import { stopsAt } from '../data/places.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, byLine } from './commons.js';
import { reportsAt, SAYS } from '../engines/ledger.js';
import * as Read from './read.js';
import * as Exp from '../engines/experiments.js';
import * as Chip from '../engines/chip.js';
import { levelAt, sizeOf } from '../data/atlas.js';
import * as Field from './field.js';
import { setBetScene } from '../app/betscene.js';
import * as Worlds from './worlds.js';
import { WORLD_IDS } from '../data/worlds.js';
import { createHome } from './home.js';
import { sizeWords } from './frame.js';
import { boot as frame2Boot, reading as frame2Reading } from './frame2.js';
import { V, $, showStage, esc, hue, qColor, follow, followW } from './shell.js';

export function start() {
  /* each view's glue (src/v2/glue/) loads when its view first opens, after the glue it builds on and with the words of its
     areas (src/core/i18n.js: the first page needs only core); until then its moves wait for it (they load it, then run),
     and hiding a view that never opened does nothing. Once a view has opened, the other areas' words load in an idle
     moment */
  const GLUE = {'island': [], 'frame': [], 'flights': ['frame'], 'studio': ['frame'], 'chip': ['frame'], 'flat': ['frame'], 'supply': ['flat'], 'board': ['frame'], 'pages': ['frame']}, glueP = {};
  const WORDS = { island: ['atlas', 'place', 'design'], frame: ['atlas', 'place', 'design'], pages: ['pages'] };
  /* and the styles of its view (src/core/styles.js): the frame's with the frame, each view's own with its glue */
  const STYLES = { island: ['frame', 'island'], frame: ['frame'], studio: ['studio'], flat: ['flat'], supply: ['supply'], pages: ['pages'] };
  const glue = k => glueP[k] || (glueP[k] = Promise.all(GLUE[k].map(glue).concat(needWords(...(WORDS[k] || [])), needStyles(...(STYLES[k] || [])))).then(() => import('./glue/' + k + '.js')).then(m => { m.create(); afterPaint(() => { if (preloadOk()) needAllWords(); }); }));
  const waits = (k, names) => names.forEach(n => { V[n] = (...a) => glue(k).then(() => V[n](...a)); });
  /* a question from the field, the joule's way in and the ways out of a question are offered on every view and on the
     seam's note, and answered by the reading pages' glue: the first such click loads it, then is made again */
  document.addEventListener('click', e => { const el = !glueP.pages && e.target.closest('[data-field],[data-fieldleave],[data-joule],[data-leave],[data-seamx]'); if (!el) return;
    e.preventDefault(); e.stopPropagation(); glue('pages').then(() => el.click()); }, true);
  waits('flights', ['ensureDc', 'showPlace', 'showPhone', 'showCar']);
  V.hidePh = V.hideCa = () => {};
  waits('island', ['openMover', 'openPlace', 'drawPlace', 'openQuestion']);
  waits('frame', ['frameOf', 'withFrame', 'aroundRow', 'lineHtml', 'seekHtml', 'seekTap', 'seekWhere', 'seekLit', 'frameInset', 'askedHtml']);
  waits('studio', ['showStudio']);
  V.hideSw = () => {};
  waits('chip', ['ensureChip', 'showChip']);
  waits('flat', ['levelsOf', 'ensureDive', 'diveInset', 'openBench', 'showFlat']);
  V.hide3d = V.hideL3 = () => {};
  waits('supply', ['supplySite', 'supplyStep', 'showSupply', 'showDive', 'watchDock']);
  waits('board', ['ensureBoard', 'showBoard']);
  V.hideBoard = () => {};
  waits('pages', ['showPage', 'showRead', 'showMachines', 'showWorlds', 'showWorld', 'showEcosystem', 'showWhatif', 'askStop']);
  V.leaveWhatif = () => {};
  Object.assign(V, { hideSeam, crossed, islandState, hud, foldHero, chCard, designCard, kept, won, toast, hideAll, enter });
  V.quickNext = false; V.carryNote = null; V.inspRaf = 0; V.lensNow = null; V.turnT = 0; V.dcFrame = null; V.dcLv = 0; V.phFrame = null; V.phLv = 0; V.caFrame = null; V.caLv = 0; V.swFrame = null; V.swLv = 0; V.chipRow = 0; V.chipFrame = null; V.diveWorld = 'datacentre'; V.Joule = null; V.flatKind = 'dive'; V.diveFrame = null; V.diveD = -1; V.diveThread = null; V.benchCh = null; V.WE = null; V.DS = null; V.Bench = null; V.flatWords = null; V.boardFrame = null; V.wf = null;
  let mapReady = null; V.map = null; V.dc = null; V.chip = null; V.board = null; V.dive = null;
  const S = Game.load(localStorage);
  const save = () => Game.save(localStorage, S);
  /* a leak raised when you cross its seam (src/data/questions.js), shown beside the view until you follow or close it */
  const seamEl = document.createElement('aside'); seamEl.className = 'seamnote'; seamEl.hidden = true; seamEl.setAttribute('aria-live', 'polite'); document.body.appendChild(seamEl);
  let seamTimer = null; V.seamFrom = null;
  function hideSeam() { seamEl.hidden = true; clearTimeout(seamTimer); }
  /* a move from one cell to another: if it crossed a seam with a leak not yet met, the leak rises beside the view */
  function crossed(from, to) {
    const id = Way.seamOf(from, to); if (!id || S.crossed[id]) return;
    S.crossed[id] = true; save();
    seamEl.innerHTML = Field.seamNote(id); seamEl.hidden = false; clearTimeout(seamTimer); seamTimer = setTimeout(hideSeam, 14000);
  }

  /* ---- a menu of sections, only if asked for: ?menu=1 turns it on for this browser, ?menu=0 off. Whether the lab
     needs one is not decided (docs/reviews/structure.md, "The menu"); this keeps the choice one line to reverse ---- */
  const SECTIONS_ON = (() => { try { const q = new URLSearchParams(location.search).get('menu'); if (q === '1' || q === '0') localStorage.setItem('osl-menu', q === '1' ? 'on' : 'off'); return localStorage.getItem('osl-menu') === 'on'; } catch (e) { return false; } })();
  if (SECTIONS_ON) { const m = document.createElement('details'); m.className = 'sections'; m.id = 'sections';
    m.innerHTML = '<summary aria-label="' + esc(t('nav.aria')) + '">☰</summary><nav>' + [['', 'nav.explore'], ['challenges', 'nav.challenges'], ['questions', 'nav.questions'], ['build', 'nav.build'], ['ecosystem', 'nav.ecosystem']].map(([h, k]) => '<a href="#/' + h + '">' + esc(t(k)) + '</a>').join('') + '</nav>';
    $('logbtn').before(m); m.addEventListener('click', e => { if (e.target.closest('a')) m.open = false; }); }
  /* ---- the frame: one frame, three modes (src/v2/frame2.js, #271) ---- */
  frame2Boot();
  /* ---- the theme ---- */
  const theme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const tb = $('theme'), k0 = theme() === 'dark' ? 'ui.toLight' : 'ui.toDark'; tb.setAttribute('aria-label', t(k0)); tb.title = t(k0);
  tb.addEventListener('click', () => { const n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('osl-theme', n); } catch (e) { /* storage unavailable */ } location.reload(); });

  /* ---- what the island shows: growth, steps, your chip, the community's pieces ---- */
  function islandState() {
    const C = Game.community(S), leaves = NEEDS.filter(n => !childrenOf(n.id).length), order = ['built', 'yours', 'open', 'engine'];
    const floors = leaves.map(n => { const p = C.state[n.id]; return p.state === 'built' ? 'built' : p.state === 'engine' ? 'engine' : p.yours ? 'yours' : 'open'; }).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const places = Object.fromEntries(Game.PLACES.map(id => { const L = doList(id); return [id, { done: L.filter(c => S.done[c.id]).length, total: L.length }]; }));
    return { grown: Game.grown(S), steps: Object.fromEntries(Game.STEPS.map(s => [s, Game.stepState(S, s)])), places, chipAt: (V.cur && Way.stageOfPlace(V.cur.place)) || Game.chipAt(S), floors, designs: C.designs, cases: C.cases, asks: C.asks.map(a => Object.assign({}, a, { at: placeOfStop(a.under) })), loud: C.loud, square: squareState(), wanted: wantedNow(), reports: reportsNow(), pull: pullNow(), aiShare: aiShare(), chip: Chip.model(S.chip), jobList: C.jobs, engineList: C.engines };
  }
  /* what calls at each place, for its square on the island: how many questions are asked there, and the challenges
     played there, each with its name and whether it is done; a question added under a stop stands where that stop is */
  const placeOfStop = key => (key && (Object.entries(Game.ASK).find(([, ks]) => ks.includes(key)) || [])[0]) || 'idea';
  const squareState = () => Object.fromEntries(Game.PLACES.map(id => [id, { n: (Game.ASK[id] || []).length + Game.debatesAt(id).length + Game.fieldsAt(id).length, chs: Game.placeChallenges(id).map(c => ({ id: c.id, done: !!S.done[c.id], name: titleOf(c) })) }]));
  /* the questions nobody can try yet: each a stake on the sandbank of what is not yet */
  const wantedNow = () => Exp.EXPERIMENTS.filter(x => Exp.stateOf(x) === 'wanted').map(x => ({ id: x.id, hue: (THREADS.find(th => th.id === x.world) || { hue: 0 }).hue }));
  /* the reports nobody has fixed yet (yours kept, and the ledger's), each at the place of the island where it was seen:
     a page of a place's levels is at that place, a page with no place on the island (a world, the record) at the Lab */
  const placeOfAt = at => { const [k, a] = partsOf(at || ''); if (k === 'place' && Game.PLACES.includes(a)) return a; if (k === 'line' || k === 'dive') { const h = levelAt(a); return (h && h.place) || 'lab'; }
    return { bench: 'studio', chip: 'datacentre', board: 'datacentre', supply: 'port', ecosystem: 'port', do: 'lab' }[k] || 'lab'; };
  const reportsNow = () => { const W = Game.world(S); return Game.frontierOf(S).filter(f => f.kind === 'report').map(f => { const e = W.byId[f.of]; return { id: e.id, at: placeOfAt(e.at), href: e.at, say: e.say, words: e.words, draft: !!e.draft }; }); };
  /* what is open and how hard it pulls (the ledger's frontier), each with where it stands; and how much of the record
     agents made, so the figures the pull sets walking come in the same shares (the lab's own examples left out) */
  const pullNow = () => { const W = Game.world(S); return Game.frontierOf(S).map(f => ({ kind: f.kind, key: f.piece && f.kind !== 'break' ? f.piece : f.of || f.q || f.piece || f.puzzle, pull: f.pull,
    at: f.kind === 'puzzle' ? 'datacentre' : f.kind === 'ask' ? placeOfStop((W.byId[f.q] || {}).under) : f.kind === 'report' ? placeOfAt((W.byId[f.of] || {}).at) : null })); };
  const aiShare = () => { const E = Game.world(S).entries.filter(e => e.made && e.made !== 'example'); if (!E.length) return null; return E.reduce((a, e) => a + (e.made === 'ai' || e.made === 'program' ? 1 : e.made === 'both' ? 0.5 : 0), 0) / E.length; };
  const refresh = animate => { if (V.map) V.map.setState(islandState(), animate); hud(); drawHero(); firstGo(); };
  /* until the first win, the way to start glows */
  const firstGo = () => { const b = $('hero').querySelector('.row .btn.primary'); if (b) b.classList.toggle('pulse', !Object.keys(S.done).length); };

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
  const prewarm = () => [ready(V.ensureDc, 'dc'), ready(V.ensureChip, 'chip'), ready(V.ensureBoard, 'board')].reduce((p, f) => p.then(() => new Promise(r => idle(() => { f(); r(); }))), Promise.resolve());
  /* the idle preload: never on a connection that asks to save data or is slow (2g, 3g), and never before the page has
     painted (a frame, then an idle moment). The page is marked with the moment it starts (data-preload, in ms since
     the page opened), so the smoke test can tell what was fetched before it */
  const preloadOk = () => { const c = navigator.connection; return !(c && (c.saveData || /2g|3g/.test(c.effectiveType || ''))); };
  const afterPaint = f => requestAnimationFrame(() => idle(f));
  const preloadMark = () => { const h = document.documentElement; if (!h.dataset.preload) h.dataset.preload = String(Math.floor(performance.now())); };
  /* on the first page: only the labs, so a challenge chosen there opens at once */
  let homeLoaded = false;
  const preloadHome = () => { if (homeLoaded || !preloadOk()) return; homeLoaded = true; preloadMark(); labsReady(false).catch(() => { /* fetched again when a challenge is played */ }); };
  const preload = () => { if (!preloadOk()) return; preloadMark(); prewarm(); ['./frame.js', './board3d.js', './story.js', './stories.js', '../engines/weave.js', '../app/world.js', '../data/weave.js', '../app/design.js', '../app/journey.js', './level3d.js', './relief3d.js', './wafer3d.js', './pcb3d.js', './phone3d.js', './gate3d.js', './switch3d.js', './atom3d.js', './overlay.js'].forEach(u => import(u).catch(() => { /* fetched again when needed */ })); };
  const ensureMap = () => mapReady || (mapReady = Promise.all([import('./map3d.js'), needStyles('frame', 'island')]).then(([m]) => {
    /* tap selects, zoom goes in and out (docs/INTERACTION.md): a second tap on the same place selects it again, it
       does not go in */
    V.map = m.createMap($('mapCanvas'), $('mapLabels'), { whatif: id => V.wf && V.wf.pick(id), place: id => { if (V.wf) return V.wf.pick(id); if (V.cur && V.cur.place === id && !V.cur.part && (!sheet.hidden || !insp.hidden)) return; V.quickNext = true; V.openPlace(id); }, part: (place, part) => { V.quickNext = true; location.hash = '#/place/' + place + '/' + part; },
      carry: id => { V.carryNote = carryAt(id); V.quickNext = true; V.openPlace(id); },
      deeper: (place, part) => { const to = deeperOf(place, part); if (to) enter(to); },
      inside: (place, part) => !!deeperOf(place, part),
      leave: id => { if (V.cur && V.cur.place === id) { closeSheet(); if (location.hash.startsWith('#/place/')) history.replaceState(null, '', '#/island'); hud(); } },
      question: key => V.openQuestion(key), mover: info => V.openMover(info), unfollow: () => { if (sheet.classList.contains('mover')) closeSheet(); }, challenge: id => { const ch = chOf(id); if (ch) location.hash = doHref(ch); }, report: at => { if (location.hash !== at) location.hash = at; setTimeout(() => openBreak(true), 0); }, ask: id => V.openPlace(id, 'ask'), job: need => openJob(need), entry: id => openEntry(id), interact: () => foldHero() });
    loading(false); V.map.setState(islandState(), false); afterPaint(preload);
    /* the first minute: a first visit to the island opens on a wide shot and comes down to it, and the hero rises after */
    if (!S.seen && location.hash === '#/island' && !still()) { V.map.intro(); $('hero').classList.add('intro'); }
    if (!S.seen) { S.seen = true; save(); }
    return V.map;
  }));
  /* each view is made once, even when the prewarm and a visit ask for it at the same moment */
  V.dcP = null; V.chipP = null; V.boardP = null;

  /* ---- the loop: a chip's life in the bar, on every view. It is where you are (the stage lit) and how you move
     along: a tap goes to that stage, holding the level you are at wherever that level exists there (a gate as used,
     as made, as designed), and otherwise to that stage's place on the island (src/engines/way.js) ---- */
  const hudEl = $('loop');
  /* the address of what is in view now: moving inside a view (deeper, along the line) changes it too */
  const liveHash = () => !vui.hidden && V.flatKind !== 'supply' && V.WE && V.diveD >= 0 && diveId() ? (V.flatKind === 'dive' ? '#/dive/' + diveId() + (V.diveWorld !== 'datacentre' ? '/' + V.diveWorld : '') : '#/' + V.flatKind + '/' + diveId())
    : !cui.hidden ? '#/chip/' + V.chipRow + '/build' : !pui.hidden ? '#/place/datacentre/' + V.dcLv : !fui.hidden ? '#/place/phones/' + V.phLv : !kui.hidden ? '#/place/cars/' + V.caLv : !sui.hidden ? '#/place/studio/' + V.swLv : location.hash;
  const whereNow = () => { const k = partsOf(location.hash)[0], W = Way.whereOf(k === 'ask' || k === 'do' || k === 'supply' ? location.hash : liveHash()); return W.view === 'island' && V.cur && !sheet.hidden ? Way.whereOf('#/place/' + V.cur.place) : W; };
  /* the address always says where you are (so it can be shared, and a reload comes back here), and the loop in the
     bar follows: walking the line from the wires to the test house to the port, the stage lit moves with you */
  const here = () => { const h = liveHash(), p = partsOf(location.hash), k = p[0];
    if (h !== location.hash && (['dive', 'line', 'chip'].includes(k) || (k === 'bench' && !p[2]) || (k === 'place' && (!pui.hidden || !fui.hidden || !kui.hidden || !sui.hidden)))) { history.replaceState(null, '', h); shownAt = h; }
    hud(); };
  function hud() {
    const W = whereNow(), chipS = Game.chipAt(S);
    hudEl.innerHTML = '<ol>' + Way.STAGES.map((s, i) => { const st = s === 'open' ? null : Game.stepState(S, s), full = !!st && st.done === st.total, name = t('loop.stage.' + s), held = W.stage !== s && Way.holds(W, s);
      return '<li><button type="button" data-stage="' + s + '"' + (s === W.stage ? ' aria-current="step"' : '') + ' class="' + (full ? 'full' : '') + (s === chipS ? ' chip' : '') + (held ? ' holds' : '') + '" title="' + esc(held ? t('loop.same', { as: t('loop.as.' + s) }) : t('loop.at.' + s)) + '" aria-label="' + esc(st ? t('game.stepAria', { n: i, step: name, done: st.done, total: st.total }) : t('loop.at.open')) + '"><span class="ld">' + (full ? '✓' : '') + '</span><span class="ln">' + esc(name) + '</span></button></li>'; }).join('') + '</ol>';
    $('logbtn').innerHTML = '<span class="lg">' + esc(t('loop.log')) + '</span>';
    $('breakbtn').setAttribute('aria-label', t('break.btn')); $('breakbtn').title = t('break.btn');
  }
  function along(stage) {
    const W = whereNow(), to = Way.alongTo(W, stage); if (!to) return;
    V.nextMove = 'along'; clearTimeout(V.turnT); V.turnT = setTimeout(() => { V.nextMove = null; }, 400);
    if (!to.startsWith('#/place/')) toast(t('loop.same', { as: t('loop.as.' + stage) }));
    if (location.hash === to) route(); else location.hash = to;
  }
  hudEl.addEventListener('click', e => { const s = e.target.closest('[data-stage]'); if (s) along(s.dataset.stage); });

  /* ---- the hero: what this is, and where to start ---- */
  /* the first page: questions to start with and challenges to take, over the island. Questions you can try now,
     a few at a time and changing day by day (never the core questions, which stay hidden); the next challenges you
     have not done; every question and challenge on one page; and a chip's life round the loop for whoever wants it */
  function drawHero() {
    const C = Game.CHALLENGES.filter(c => !S.done[c.id]).slice(0, 3);
    $('hero').innerHTML = '<button type="button" class="herofold" data-unfold aria-label="' + esc(t('hero.unfold')) + '"><span class="q" aria-hidden="true">?</span><span><b>' + esc(t('hero.start')) + '</b><span class="small">' + esc(t('hero.pill')) + '</span></span></button>' +
      '<button type="button" class="x herox" data-fold aria-label="' + esc(t('hero.fold')) + '">–</button><p class="kicker">' + esc(t('hero.kicker')) + '</p><h1>' + esc(t('hero.start')) + '</h1><div class="heroq" data-heroq></div>' +
      '<div class="herofoot">' + (C.length ? '<p class="kicker herok">' + esc(t('hero.or')) + '</p><div class="chips heroc">' + C.map(c => '<a class="chipb" href="' + esc(doHref(c)) + '">' + esc(titleOf(c)) + '</a>').join('') + '</div>' : '') +
      '<div class="row"><a class="btn primary" href="#/w">' + esc(t('hero.all')) + '</a><button type="button" class="btn ghost" data-start>' + esc(t('hero.follow')) + '</button></div></div>';
    heroQs();
  }
  /* the questions come from inside the worlds' documents, fetched only once the hero shows (over the island, never
     on the first page) */
  const heroQs = () => { if ($('hero').hidden) return; Worlds.loadAll().then(all => { const box = $('hero').querySelector('[data-heroq]'); if (box) box.innerHTML = Worlds.starters(all).map(Worlds.qCard).join(''); }, () => {}); };
  /* following the chip is no guide: it opens the place where the loop starts, and every place offers the next */
  /* the first page's questions and challenges never go away: exploring folds them into a small button in the corner,
     which opens them again (docs/INTERACTION.md: a heads-up layer that steps aside, not one that is gone) */
  function foldHero() { const h = $('hero'); if (!h.classList.contains('away')) h.classList.add('folded'); }
  $('hero').addEventListener('click', e => { if (e.target.closest('[data-unfold]')) { $('hero').classList.remove('folded'); return; } if (e.target.closest('[data-fold]')) { $('hero').classList.add('folded'); return; } if (e.target.closest('a[href]')) $('hero').classList.add('away'); if (e.target.closest('[data-start]')) { $('hero').classList.add('away'); location.hash = '#/place/' + Way.STAGE_PLACE.open; } });

  /* ---- the sheet: a place with its three doors, a question, or a challenge ---- */
  const sheet = $('sheet');
  /* the stage knows when a sheet is open (phones fold the HUD's next button away) */
  new MutationObserver(() => $('stage').classList.toggle('sheeted', !sheet.hidden)).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  V.cur = null;   /* { place, tab } */
  /* ---- the world is the interface (docs/INTERACTION.md): what you tap on the island is answered beside it, by a
     small inspector that stays with it as the camera moves; the full card is one tap further, never in the way ---- */
  const insp = document.createElement('div'); insp.className = 'insp'; insp.hidden = true; insp.setAttribute('role', 'dialog'); $('stage').appendChild(insp);
  const hideInsp = () => { insp.hidden = true; cancelAnimationFrame(V.inspRaf); };
  const lensbar = document.createElement('nav'); lensbar.className = 'lensbar'; lensbar.hidden = true; lensbar.setAttribute('aria-label', t('lens.aria')); $('stage').appendChild(lensbar);
  /* your chip carried to a place: what that place would do with it, there and then */
  const carryAt = id => { const L = doList(id), open = L.filter(c => !S.done[c.id]); if (open.length) return { place: id, text: t('carry.play', { what: titleOf(open[0]) }), ch: open[0].id };
    return { place: id, text: t(L.length ? 'carry.done' : 'carry.none') }; };
  const closeSheet = () => { const was = V.cur; sheet.hidden = true; V.cur = null; hideInsp(); if (V.carryNote) { V.carryNote = null; V.map && V.map.chipHome(); } if (sheet.classList.contains('mover')) { sheet.classList.remove('mover'); V.map && V.map.unfollow(); } if (was) { $('hero').classList.remove('away'); $('hero').classList.add('folded'); hud(); if (V.map) V.map.select(null); if (V.map && !$('mapCanvas').hidden) V.map.setState(islandState(), false); } };
  const kickerOf = id => { const step = Game.STEP_OF[id] || Game.STEP_PLACE[id]; return Way.stageOfPlace(id) === 'open' ? t('loop.open.k') : step ? t('game.stepN', { n: Game.STEPS.indexOf(step) + 1, step: t('game.step.' + step) }) : t('map.' + id + '.kind'); };
  /* what to do at a place: its own challenges, and at a step's station the step's challenges played elsewhere */
  const doList = id => { const step = Game.STEP_OF[id] || Game.STEP_PLACE[id], here = Game.placeChallenges(id);
    return here.concat(step ? Game.stepChallenges(step).filter(c => c.place !== id) : []); };
  const whereOf = ch => t('map.' + (ch.kind === 'break' ? 'village' : ch.need ? 'lab' : ch.place) + '.t') + (ch.at ? ' › ' + t('depth.' + ch.at + '.name') : '');
  function chCard(ch) {
    const done = S.done[ch.id];
    return '<button type="button" class="chcard' + (done ? ' done' : '') + '" data-open="' + esc(ch.id) + '"><span class="st">' + (done ? '✓' : '') + '</span><span><span class="kicker">' + esc(whereOf(ch)) + '</span><b>' + esc(titleOf(ch)) + '</b><span class="small">' + esc(goalOf(ch)) + '</span>' + (ch.grows ? '<span class="small muted">' + esc(t(done ? 'game.grew' : 'game.grows', { what: t('grow.' + ch.grows) })) + '</span>' : '') + '</span></button>';
  }
  /* a challenge by its id: the loop's, an open job, or a break the ledger offers */
  const chOf = id => Game.anyChallenge(id, S);
  const doHref = c => c.kind === 'design' && !c.need ? '#/bench/' + c.at + '/' + c.id : '#/do/' + c.id;
  /* a design of the ledger: who made it, where it stands, and (for a clocked one) the way to try to break it */
  function designCard(d) {
    const ch = chOf('break:' + d.id), st = d.draft ? 'draft' : d.state;
    const facts = t('ledger.facts', { tr: d.facts.transistors, ps: d.facts.ps }) + (d.inside ? ' · ' + t('ledger.inside') : '');
    const body = '<span class="st">' + (d.state === 'broken' ? '✕' : '⌂') + '</span><span><span class="kicker">' + esc(t('build.need.' + d.need + '.t')) + ' · ' + esc(t('ledger.state.' + st)) + '</span><b>' + esc(d.title) + '</b><span class="small">' + esc(d.author) + ' · ' + esc(t('build.kind.' + d.kind)) + '</span><span class="small muted">' + esc(facts) + '</span>' +
      (ch ? '<span class="small ' + (d.state === 'broken' ? 'bad' : 'hint') + '">' + esc(d.state === 'broken' ? t('ledger.card.broken') : d.tries ? t('ledger.tries', { n: d.tries }) : t('ledger.card.unbroken')) + '</span>' : '') + '</span>';
    return ch ? '<button type="button" class="chcard entry ' + st + '" data-open="' + esc(ch.id) + '">' + body + '</button>' : '<div class="chcard entry ' + st + '">' + body + '</div>';
  }
  const jobCard = j => '<button type="button" class="chcard job" data-job="' + j.need + '"><span class="st">?</span><span><b>' + esc(t('design.proj.' + j.p + '.t')) + '</b><span class="small">' + esc(t('build.need.' + j.need + '.d')) + '</span></span></button>';
  /* the worlds a place meets (docs/INTERACTION.md, content/): every question asked at a place belongs to one of the
     eleven core questions (its thread is the world, stop.<world>.<depth>), so the link from a place to a world is the
     questions already there, never one drawn for the purpose. Each world's own words come from its document, loaded
     once; until then the chip waits for them. */
  let WT = null;
  const LIVE = ['copies', 'walls', 'forms', 'plan', 'clock', 'side', 'swarm', 'tune', 'probes'];
  const fillWorlds = root => { if (!WT) return; root.querySelectorAll('[data-wt]').forEach(a => { const P = WT[a.dataset.wt]; if (!P) return; const live = LIVE.includes((Worlds.WORLD_OF(a.dataset.wt) || {}).lens);
    a.querySelector('.wq').textContent = P.title.replace(/\*\*|\*/g, ''); a.querySelector('.wl').textContent = live ? t('world.tryIt', { name: P.lens }) : t('world.seeIt', { name: P.lens }); a.hidden = false; }); };
  const loadWT = () => (WT ? Promise.resolve() : Worlds.loadAll().then(all => { WT = Object.fromEntries(all); }));
  const worldsOf = keys => [...new Set(keys.map(k => k.split('.')[0]).filter(id => WORLD_IDS.includes(id)))];
  const worldsRow = keys => { const ids = worldsOf(keys).slice(0, 3); if (!ids.length) return '';
    loadWT().then(() => fillWorlds(sheet));
    return '<div class="wmeet"><p class="kicker">' + esc(t('world.here')) + '</p>' + ids.map(id => '<a class="wchip" href="#/w/' + id + '" data-wt="' + id + '" style="--qc:' + Worlds.colorOf(id) + '"' + (WT ? '' : ' hidden') + '><span class="wq"></span><span class="wl small"></span></a>').join('') + '</div>'; };
  const askLink = k => '<a class="askq" href="' + esc(followW(k)) + '" style="--qc:' + qColor(k) + '"><span class="q">' + esc(t('stop.' + k + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a>';
  /* Inside: the place's levels, one inside the next, with what waits at each; then any other way in */
  /* a level opens where it is drawn best: the flight through the data centre, the dive (the one way down through a
     chip), the line, the bench, or the chip's layers for a factory step that makes one of them */
  const rowOf = d => { const i = ROWS.findIndex(r => r.made.includes(d)); return i < 0 ? null : { row: i }; };
  /* the flat dive's levels (the earlier site's zoom, in the frame): from the chip down to the atom */
  const DIVE_LEVELS = Game.DIVE_LEVELS;
  const levelHref = (place, l) => { if (place === 'datacentre' && l.depth === 'board') return '#/board'; const f = (Game.FLOWN[place] || {})[l.depth]; if (f != null) return '#/place/' + place + '/' + f;
    if (FLAT_WORLDS.includes(l.world)) return '#/dive/' + l.depth + '/' + l.world;
    if (DIVE_LEVELS.includes(l.depth)) return '#/dive/' + l.depth;
    if (l.world === 'design') return '#/bench/' + l.depth;
    if (l.world === 'journey') return '#/line/' + l.depth;
    const c = rowOf(l.depth); return c ? '#/chip/' + c.row + '/build' : Game.viewOfDepth(l.depth); };
  /* the worlds with a flat dive of their own, besides the data centre's */
  const FLAT_WORLDS = ['phone', 'car', 'made'];
  /* where going inside a place leads: its first level, drawn in the frame */
  const enterOf = id => { const L = Game.INSIDE[id] || []; if (L.length) return levelHref(id, L[0]); const x = (Game.LOOK[id] || [])[0]; return x ? (x.to ? '#/place/' + x.to : x.page ? '#/' + x.page : null) : null; };
  /* the tools of the factory, opened where it stands: each is selected as a part of it (#/place/fab/etch) */
  /* the buildings that open where they stand, and their parts, each selected as itself (#/place/fab/etch): what it is
     called, the sentence that says what it does, its questions, and where going closer leads */
  const FAB_PARTS = ['clean', 'deposit', 'print', 'etch', 'implant', 'wires'];
  const shipOrPkg = p => (['trays', 'boxes'].includes(p) ? 'ship' : 'pkg');
  const PARTS = {
    fab: { list: FAB_PARTS, name: p => t('depth.' + p + '.name'), see: p => t('depth.' + p + '.see'), qs: p => stopsAt(p), deeper: p => '#/line/' + p },
    studio: { list: ['need', 'logic', 'check', 'gates', 'layout', 'masks'], name: p => t('depth.' + p + '.name'), see: p => t('depth.' + p + '.see'), qs: p => stopsAt(p), deeper: p => levelHref('studio', { world: 'design', depth: p }) },
    port: { list: ['saw', 'bumps', 'lid', 'trays', 'boxes'], name: p => { const w = t('part.' + shipOrPkg(p) + '.' + p); return w.charAt(0).toUpperCase() + w.slice(1); }, see: p => t('what.' + shipOrPkg(p) + '.' + p), qs: p => stopsAt(shipOrPkg(p)), deeper: p => '#/line/' + shipOrPkg(p) },
    datacentre: { list: ['rack', 'board'], name: p => t('depth.' + p + '.name'), see: p => t('depth.' + p + '.see'), qs: p => stopsAt(p), deeper: p => levelHref('datacentre', { world: 'datacentre', depth: p }) },
    test: { list: ['prober', 'needles', 'map'], name: p => { const w = t('part.test.' + p); return w.charAt(0).toUpperCase() + w.slice(1); }, see: p => t('what.test.' + p), qs: () => stopsAt('test'), deeper: () => '#/line/test' }
  };
  const isPart = (place, p) => !!PARTS[place] && PARTS[place].list.includes(p);
  const deeperOf = (place, p) => (p && PARTS[place] ? PARTS[place].deeper(p) : enterOf(place));
  /* something that moves, followed (docs/INTERACTION.md, "An open world"): what it is, where it is going, and the
     way there. A figure is the pull of an open thing made visible; it says which, never who. */
  /* no one way on (docs/INTERACTION.md, "An open world"): from a place, what stands around it on the island, nearest
     first, and the next stage of a chip's life as one way among them (→ still takes it) */
  const aroundHtml = (id, nx) => { const me = PLACES.find(p => p.id === id); if (!me) return '';
    const near = PLACES.filter(p => p.id !== id && p.id !== nx && !!p.far === !!me.far).map(p => [p.id, Math.hypot(p.at[0] - me.at[0], p.at[1] - me.at[1])]).sort((a, b) => a[1] - b[1]).slice(0, nx ? 2 : 3).map(x => x[0]);
    const chip = (p, key) => '<button type="button" class="chipb"' + (key ? ' data-key="next"' : '') + ' data-place="' + p + '">' + esc(key ? t('around.loop', { place: t('map.' + p + '.t') }) : t('map.' + p + '.t')) + '</button>';
    return '<div class="around"><p class="kicker">' + esc(t('around.k')) + '</p><div class="chips">' + (nx ? chip(nx, true) : '') + near.map(p => chip(p)).join('') + '</div></div>'; };
  /* the labs load with the first challenge played (src/v2/play.js); a challenge asked for meanwhile replaces it */
  let playTok = 0;
  const withLabs = f => { const k = ++playTok; if (labsLoaded()) return f(); loading(true); return labsReady().then(() => { loading(false); if (k === playTok) f(); }); };
  /* a challenge, played in the sheet */
  function openChallenge(ch) {
    if (!ch) return;
    const placeId = ch.kind === 'break' ? 'village' : ch.need ? 'lab' : ch.place;
    if (!V.cur || V.cur.place !== placeId) { V.cur = { place: placeId, tab: 'do' }; V.map && V.map.focus(placeId); }
    $('hero').classList.add('away'); sheet.hidden = false; sheet.scrollTop = 0;
    withLabs(() => { if (!sheet.hidden) play(sheet, ch, { state: S, save, kept, startChip: () => Object.assign({}, Game.START), open: openChallenge, back: () => { sheet.onclick = null; sheet.oninput = null; V.drawPlace(); }, done: won }); });
  }
  const openJob = need => { const j = Game.jobOf(need); if (j) openChallenge(j); };
  /* a house of the village: a clocked design opens the try to break it; any other, the village's list */
  const openEntry = id => { const ch = chOf('break:' + id); if (ch) openChallenge(ch); else V.openPlace('village', 'do'); };
  /* an entry of yours was kept (or dropped): the island shows it at once, as yours, and says who can see it */
  function kept(e) { save(); refresh(true); if (e) { toast(t('ledger.toast')); if (V.map && !$('mapCanvas').hidden) V.map.punch(); } }
  /* something was won: the island grows, the HUD moves on, a note says what appeared */
  /* a win is felt: the island grows where it happened and the camera leans in, the step in the bar bumps and counts
     one up, the next challenge glows, and a toast says what grew */
  function won(ch) {
    refresh(true); toast(ch.grows ? t('game.toast', { what: t('grow.' + ch.grows) }) : t(ch.kind === 'break' ? 'game.toastBreak' : 'game.toastJob'));
    if (V.map && !$('mapCanvas').hidden) V.map.punch();
    const b = ch.step && hudEl.querySelector('[data-stage="' + ch.step + '"]');
    if (b && !still()) { b.classList.add('bump'); const plus = document.createElement('span'); plus.className = 'plus'; plus.setAttribute('aria-hidden', 'true'); plus.textContent = '+1'; b.parentNode.appendChild(plus); setTimeout(() => plus.remove(), 1500); }
    if (!still()) $('logbtn').classList.add('glow');
  }
  const toastEl = $('toast'); let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; toastEl.classList.remove('go'); void toastEl.offsetWidth; toastEl.classList.add('go'); clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 4200); }
  sheet.addEventListener('click', e => {
    if (e.target.closest('.player')) return;   /* the player handles its own clicks */
    const fg = e.target.closest('[data-fgo]'); if (fg) { sheet.classList.remove('mover'); V.map && V.map.unfollow(); const [k, v] = [fg.dataset.fgo, fg.dataset.v];
      if (k === 'open') openChallenge(chOf(v)); else if (k === 'job') openJob(v); else if (k === 'q') V.openQuestion(v); else if (k === 'report') { location.hash = v; setTimeout(() => openBreak(true), 0); } else V.openPlace(v); return; }
    if (e.target.closest('[data-close]')) { closeSheet(); if (location.hash !== '#/ecosystem') { V.map && V.map.overview(); if (location.hash.startsWith('#/place/')) history.replaceState(null, '', '#/island'); } return; }
    const d = e.target.closest('[data-door]'); if (d) { V.cur.tab = d.dataset.door; V.drawPlace(); return; }
    /* going closer from the card is the same move as zooming in; a tool of the open factory is selected in place */
    if (e.target.closest('[data-deeper]')) { const to = deeperOf(V.cur.place, V.cur.part); if (to) enter(to); return; }
    const tp = e.target.closest('[data-part]'); if (tp) { location.hash = '#/place/' + V.cur.place + '/' + tp.dataset.part; return; }
    /* inside the Lab: its steps, and a piece of the computer (the address follows, so a piece can be shared) */
    const ls = e.target.closest('[data-labstep]'); if (ls) { location.hash = ls.dataset.labstep ? '#/build/' + ls.dataset.labstep : '#/place/lab'; return; }
    const pc = e.target.closest('[data-piece]'); if (pc) { location.hash = '#/build/computer/' + pc.dataset.piece; return; }
    if (slipClick(e, S, redraw => { save(); refresh(true); if (redraw) V.drawPlace(); })) return;
    const o = e.target.closest('[data-open]'); if (o) { openChallenge(chOf(o.dataset.open)); return; }
    const j = e.target.closest('[data-job]'); if (j) { openJob(j.dataset.job); return; }
    const p = e.target.closest('[data-place]'); if (p) V.openPlace(p.dataset.place);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); if (location.hash !== '#/ecosystem') V.map && V.map.overview(); } });

  /* ---- a place flown through: the data centre ---- */
  const pui = $('placeui');

  /* ---- a place flown through: a phone (src/v2/phone3d-flight.js), as the data centre is: its own canvas, card and
     levels, and past the chip the flight carries on into the dive's phone chip ---- */
  const fui = $('flyui');

  /* ---- and a car (src/v2/car3d-flight.js), the same way: from the car on its road, through the cut-away cabin, to the
     control unit in the footwell and its chip; past the chip the flight carries on into the dive's car chip ---- */
  const kui = $('carui');

  /* ---- the studio, walked inside (src/v2/studio3d.js, #267): the building seen on the island, entered without a cut.
     Its corners are the design's steps in order along the room, walked along on the line of steps (← →, Next →); the
     rail holds only the level a step shows. At a corner, the way in (↓, the button by the screen, a push of the wheel)
     settles the camera on the corner's screen and the step's bench takes over there; the bench's way up comes back
     to the same corner, starting on its screen ---- */
  const sui = $('studioui');

  /* ---- inside a chip, layer by layer: the levels of the dive as they are made (the lower half of the Make column).
     The dive is the only way down through a chip; this is the same level as made, reached along the loop (← →, or
     Make in the bar) and left the same way, back to the dive at the level you are at. In · out (↑ ↓, the rail, the
     wheel, the way in on the picture) moves through the rows, each a level as made; going up a row is the next
     step the factory does, so the stack is built as you climb it ---- */
  const cui = $('chipui');

  /* ---- the flat views: the earlier site's continuous 2D world (src/app/world.js) in the frame. One canvas, three
     uses: the dive (a level as used: chip to atom), the line (as made: the factory step by step, a wafer travelling
     between the machines) and the bench (as designed: the studio, where your design is code and the drawings are
     of it). Tap a part and its note sits on the picture; the questions crossing a level are dots on their parts. ---- */
  const vui = $('diveui');
  const diveId = () => V.WE.IDS[V.diveD];

  /* ---- one board, no side panel: words on the parts, a story docked below that drives the camera ---- */
  const bui = $('boardui');
  /* every view hides the others first */
  function hideAll() {
    $('diveCanvas').hidden = true; vui.hidden = true; V.dive && V.dive.stop(); V.hide3d(); $('flatLabels').hidden = true; if (V.flatWords) V.flatWords.clear(); if (V.Bench) V.Bench.show(false);
    V.hideBoard(); $('hero').hidden = true; $('outbtn').hidden = true; lensbar.hidden = true; closeSheet(); pui.hidden = true; cui.hidden = true; V.dc && V.dc.pause(); V.map && V.map.pause(); V.chip && V.chip.pause();
    ['mapCanvas', 'mapLabels', 'placeCanvas', 'placeLabels', 'chipCanvas', 'chipLabels'].forEach(k => { $(k).hidden = true; });
    V.hidePh(); V.hideCa(); V.hideSw();
    document.body.classList.remove('immersive'); page.hidden = true; V.hideL3(); showStage(false);
  }
  /* ---- the blueprint, the first page (#/, src/v2/home.js): the whole chip innovation ecosystem as one wheel, a chip's
     life around it and its scale inward, with a story beside it. Nothing 3D is made or drawn here: the island (#/island)
     is one way in, made when it is first visited ---- */
  const homeEl = $('home');
  let home = null;
  function showHome() { showHome0(); return showBlueprint(); }
  function showHome0() {
    $('diveCanvas').hidden = true; vui.hidden = true; V.dive && V.dive.stop(); V.hide3d(); $('flatLabels').hidden = true; if (V.flatWords) V.flatWords.clear(); if (V.Bench) V.Bench.show(false);
    V.hideBoard(); document.body.classList.remove('immersive');
    $('chipCanvas').hidden = $('chipLabels').hidden = true; cui.hidden = true; V.chip && V.chip.pause();
    $('placeCanvas').hidden = $('placeLabels').hidden = true; pui.hidden = true; V.dc && V.dc.pause(); V.hidePh(); V.hideCa(); V.hideSw();
    $('mapCanvas').hidden = $('mapLabels').hidden = true; $('hero').hidden = true; $('outbtn').hidden = true; lensbar.hidden = true; showStage(false); if (V.map) V.map.pause();
    if (!sheet.hidden) closeSheet(); loading(false);
  }
  function showBlueprint() {
    if (stations) stations.hide();
    return needWords('blueprint').then(() => { if (!home) home = createHome(homeEl, { still }); home.show(); afterPaint(preloadHome); });
  }
  /* ---- the station map (#/stations, src/v2/stations.js): the first page before the blueprint, every station of the lab
     joined round a chip's life, with its toys and paths by subject; loaded when it is first opened ---- */
  const stationsEl = $('stations');
  let stations = null;
  function showStations() {
    showHome0(); if (home) home.hide();
    return Promise.all([import('./stations.js'), needStyles('stations')]).then(([m]) => {
      if (!stations) stations = m.createStations(stationsEl, { challenges: Game.CHALLENGES, chOf, titleOf, doHref, doHome: Way.doHome, sizeOf, sizeWords, still,
        done: () => S.done, exps: Exp.EXPERIMENTS.map(x => ({ id: x.id, world: x.world, ask: Read.askOf(x) })) });
      stations.show();
    });
  }
  function showMap(from) {
    $('diveCanvas').hidden = true; vui.hidden = true; V.dive && V.dive.stop(); V.hide3d(); $('flatLabels').hidden = true; if (V.flatWords) V.flatWords.clear(); if (V.Bench) V.Bench.show(false);
    V.hideBoard(); document.body.classList.remove('immersive');
    $('chipCanvas').hidden = $('chipLabels').hidden = true; cui.hidden = true; V.chip && V.chip.pause();
    $('placeCanvas').hidden = $('placeLabels').hidden = true; pui.hidden = true; V.dc && V.dc.pause(); V.hidePh(); V.hideCa(); V.hideSw();
    const part = from && ['line', 'bench'].includes(V.flatKind) && V.WE && isPart(V.lastPlace, diveId()) ? diveId() : null;
    /* the island's styles are in before anything of it shows (src/core/styles.js) */
    return needStyles('frame', 'island').then(() => {
      $('mapCanvas').hidden = $('mapLabels').hidden = false; $('hero').hidden = false; $('outbtn').hidden = false; lensbar.hidden = false; showStage(true); heroQs();
      loading(!V.map); return Promise.all([ensureMap(), glue('island')]); }).then(([m]) => { if (from && V.lastPlace) { m.from(V.lastPlace, part); if (!part) m.focus(V.lastPlace); } m.resume(); return m; });
  }

  /* ---- the pages ---- */
  const page = $('page');
  V.pageNow = 'build';

  /* ---- routes ---- */
  /* which view an address shows, and how deep it sits: the island 0, a place 1, the board 2, the chip 3, the dive 4.
     Going between views is never a cut: deeper zooms in, higher zooms out, the Turn turns, along slides. */
  const partsOf = h => (h.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const doPlace = ch => (ch && !ch.need && ch.kind !== 'break' && ch.kind !== 'design' ? Way.doHome(ch) : null);
  const viewOf = p => { const k = p[0]; if (!k || k === 'home' || k === 'stations') return ['home', -1]; if (k === 'ask') return viewOf(partsOf(Game.viewOfDepth(p[2] || 'chip')));
    if (k === 'do') { const h = doPlace(chOf(decodeURIComponent(p[1] || ''))); return h ? viewOf(partsOf(h)) : ['map', 0]; }
    if (k === 'dive') { const w = p[2] || Game.DIVE_WORLD[p[1]] || 'datacentre'; if (w === 'datacentre') return ['dive', 4]; const i = Math.max(0, ['phone', 'phoneboard', 'soc', 'car', 'ecu', 'mcu', 'scanner', 'wafer', 'die'].indexOf(p[1]) % 3); return ['dive:' + w, Game.DIVE_WORLD[p[1]] ? 1 + i : 4]; }
    if (k === 'supply') return ['supply', 0];
    return k === 'board' ? ['board', 2] : k === 'line' ? ['line', 1] : k === 'bench' ? ['bench', 1] : k === 'chip' ? ['chip', 3]
      : k === 'place' && p[1] === 'datacentre' && /^\d+$/.test(p[2] || '') ? ['dc', 1] : k === 'place' && p[1] === 'phones' && /^\d+$/.test(p[2] || '') ? ['fly', 1] : k === 'place' && p[1] === 'cars' && /^\d+$/.test(p[2] || '') ? ['carfly', 1] : k === 'place' && p[1] === 'studio' && /^\d+$/.test(p[2] || '') ? ['studio', 1] : ['map', 0]; };
  let shownAt = null;   /* the address of the view now made, so a question at the same level only changes the dock */
  let viewNow = null, rankNow = 0, entering = false; V.nextMove = null; V.lastPlace = null; V.enteredFrom = null;
  /* going inside from the island: the camera dives into the place first, then the view zooms in from it */
  function enter(href) {
    if (entering) return;
    if (still() || !V.map || $('mapCanvas').hidden || !lastFocus()) { location.hash = href; return; }
    /* the camera dives at what is selected, and the view inside opens from that point on the screen, as through a
       portal (docs/INTERACTION.md) */
    V.enteredFrom = lastFocus(); entering = true; V.map.dive(lastFocus(), V.cur && V.cur.part).then(() => { entering = false; portalAt(V.map.screenOf(lastFocus(), V.cur && V.cur.part)); V.arriving = true; location.hash = href; });
  }
  const lastFocus = () => (V.cur && V.cur.place) || null;
  V.arriving = false;   /* the next view was entered from the island: it starts from above, coming down */
  /* where the next zoom opens or closes on the screen */
  const portalAt = p => { const r = document.documentElement.style; if (p && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1) { r.setProperty('--vx', (p.x * 100).toFixed(1) + '%'); r.setProperty('--vy', (p.y * 100).toFixed(1) + '%'); } else { r.removeProperty('--vx'); r.removeProperty('--vy'); } };
  sheet.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (!a || viewOf(partsOf(a.getAttribute('href')))[0] === 'map') return; e.preventDefault(); e.stopPropagation(); enter(a.getAttribute('href')); }, true);
  function show(parts, from) {
    const k = parts[0] || 'home';
    /* a question at a level already in view: no need to make the view again, only the dock changes */
    if (k === 'ask' && parts[1] && parts[2]) { const at = Game.viewOfDepth(parts[2]); if (at === shownAt && !from) { V.askStop(parts[1], parts[2]); return Promise.resolve(); } return show(partsOf(at), from).then(() => V.askStop(parts[1], parts[2])); }
    shownAt = '#/' + parts.join('/');
    if (k === 'home') return showHome();
    if (k === 'stations') return showStations();
    if (k === 'board') return V.showBoard();
    if (k === 'dive') return V.showDive(parts[1], parts[2]);
    if (k === 'supply') return V.showSupply(parts[1]);
    if (k === 'line') return V.showFlat('line', parts[1]);
    if (k === 'bench') return V.showFlat('bench', parts[1], parts[2]);
    /* a challenge is played where its level is shown, in that view's card, with the picture behind it; a piece of
       the shared computer or a break is met at the Lab and the village, on the island */
    /* #/do/<challenge>/<job>: a challenge opened for a job, such as a machine's core on that machine's work (#321) */
    if (k === 'do' && parts[1]) { const c0 = chOf(decodeURIComponent(parts[1])), ch = c0 && parts[2] ? Object.assign({}, c0, { job: decodeURIComponent(parts[2]) }) : c0, home = doPlace(ch);
      if (home) return show(partsOf(home), from).then(() => { shownAt = '#/' + parts.join('/'); V.openBench(ch); });
      return showMap(from).then(() => openChallenge(ch)); }
    if (k === 'chip') return V.showChip(parts[1] != null ? +parts[1] : null);
    /* the data centre's flight is entered at one of its levels (#/place/datacentre/2); the place itself opens on the island */
    if (k === 'place' && parts[1] === 'datacentre' && /^\d+$/.test(parts[2] || '')) return V.showPlace('datacentre', +parts[2]);
    /* and a phone's, the same way (#/place/phones/2) */
    if (k === 'place' && parts[1] === 'phones' && /^\d+$/.test(parts[2] || '')) return V.showPhone(+parts[2]);
    /* and a car's (#/place/cars/2) */
    if (k === 'place' && parts[1] === 'cars' && /^\d+$/.test(parts[2] || '')) return V.showCar(+parts[2]);
    /* and the studio, walked inside (#/place/studio/3: the third corner) */
    if (k === 'place' && parts[1] === 'studio' && /^\d+$/.test(parts[2] || '')) return V.showStudio(+parts[2], from);
    if (k === 'place' && isPart(parts[1], parts[2])) return showMap(from).then(() => V.openPlace(parts[1], 'look', null, null, parts[2]));
    if (k === 'place' && Game.PLACES.includes(parts[1])) return showMap(from).then(() => V.openPlace(parts[1], parts[2] === 'inside' ? 'look' : null));
    if (k === 'build') return showMap(from).then(() => V.openPlace('lab', 'look', parts[1] || 'computer', parts[2]));
    if (['log', 'challenges', 'questions'].includes(k)) V.showPage(k);
    if (k === 'read') V.showRead(parts[1] ? decodeURIComponent(parts[1]) : null);
    if (k === 'w') { if (parts[1]) V.showWorld(parts[1], parts[2], parts[3]); else V.showWorlds(); }
    if (k === 'whatif') return showMap(from).then(() => V.showWhatif(parts[1]));
    if (k === 'machines') V.showMachines(parts[1], parts[2]);
    /* a reading page stands on its own: the island waits behind it, paused (src/v2/frame2.js, Read) */
    if (frame2Reading()) return showMap(from).then(m => { if (frame2Reading()) m.pause(); });
    return showMap(from).then(() => { if (k === 'ecosystem') V.showEcosystem(); else if ((k === 'island' || k === 'explore') && V.cur && !sheet.hidden) { closeSheet(); V.map && V.map.overview(); } });
  }
  function route() {
    const parts = partsOf(location.hash), k = parts[0] || 'home';
    if (k !== 'home' && home) home.hide();
    if (k !== 'stations' && stations) stations.hide();
    /* the cell you came from and the one you are in: a seam between them may raise its leak */
    { const to = Way.whereOf(location.hash); hideSeam(); crossed(V.seamFrom, to); V.seamFrom = to; }
    /* a bet's wafer or chip stands in the scene only while its challenge is open */
    if (!/^#\/do\/(cheaper|onebad|oxen|jevons)$/.test(location.hash)) setBetScene(null, null, '');
    /* What if? holds the world grey with its columns only while it is open */
    if (k !== 'whatif') V.leaveWhatif();
    page.hidden = true; page.classList.remove('reading'); $('logbtn').setAttribute('aria-current', ['log', 'challenges', 'questions'].includes(k) ? 'page' : 'false'); $('logbtn').classList.remove('glow');
    const after = pr => { hud(); return Promise.resolve(pr).then(hud); };
    const [view, rank] = viewOf(parts), from = viewNow, move = V.nextMove || (from === 'bench' && view === 'studio' ? 'out' : rank > rankNow ? 'in' : rank < rankNow ? 'out' : 'along');
    V.nextMove = null; viewNow = view; rankNow = rank;
    if (!from || from === view || still() || !document.startViewTransition) return after(show(parts, from && from !== view ? from : null));
    /* the old picture holds while the new view is made (at most a moment), then one zooms into the other */
    const root = document.documentElement; root.dataset.move = move; if (move !== 'in') portalAt(null);
    const tr = document.startViewTransition(() => Promise.race([after(show(parts, from)), new Promise(r => setTimeout(r, 1500))]));
    /* a transition the browser skips (a newer one began, or the view took too long) rejects its promises: the view still
       changes, plainly, so the rejections are expected and caught here */
    const quiet = () => {}; tr.ready.catch(quiet); tr.updateCallbackDone.catch(quiet);
    tr.finished.catch(quiet).finally(() => { if (root.dataset.move === move) delete root.dataset.move; });
  }
  /* one set of keys in every view, one pair for each move: ↑ ↓ are out and in (scale), ← → are along. Where the
     view is a column of levels (the flight, the dive, the stack), along is the loop: the stage before or after,
     keeping your level. Where it is a row of steps (the line, the bench, a story, the island's places), along is
     the step before or after, ↑ leads out and ↓ into what the step makes, where that is drawn. Escape goes out. */
  document.addEventListener('keydown', e => {
    /* a picture that steps along by itself (the flat world) has already taken the key */
    if (e.defaultPrevented || (e.target.closest && e.target.closest('input, textarea, select, [data-live]'))) return; /* i18n-ok */
    /* / jumps: the log opens with its box ready */
    if (e.key === '/') { e.preventDefault(); if (partsOf(location.hash)[0] !== 'log') location.hash = '#/log'; setTimeout(() => { const f = page.querySelector('[data-jump]'); if (f) f.focus(); }, 60); return; }
    const host = [vui, cui, pui, bui, sui].find(h => h && !h.hidden) || (!sheet.hidden && !sheet.querySelector('.player') ? sheet : null); if (!host) return;
    if (e.key === 'Escape') { const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } return; }
    const W = whereNow(), column = ['dive', 'flight', 'chip'].includes(W.view) && !host.querySelector('.dock .player, .dock .stopx');
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { const down = e.key === 'ArrowDown';
      if (column) { const b = host.querySelector('.dock [data-key="' + (down ? 'next' : 'back') + '"]'); if (b) { b.click(); e.preventDefault(); } else if (!down) { const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } } return; }
      if (host === sheet) { const a = down && sheet.querySelector('.nav a.btn.primary'); if (a) { a.click(); e.preventDefault(); } return; }
      if (down) { const a = host.querySelector('.dock [data-in]'); if (a) { a.click(); e.preventDefault(); } return; }
      const out = host.querySelector('.dock [data-out]'); if (out) { out.click(); e.preventDefault(); return; }
      const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (column) { const i = Way.STAGES.indexOf(W.stage), n = Way.STAGES.length; along(Way.STAGES[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]); e.preventDefault(); return; }
    if (host === sheet && e.key === 'ArrowLeft' && V.cur) { const st = Way.stageOfPlace(V.cur.place), prev = st && Object.values(Way.STAGE_PLACE).find(p => Way.nextPlace(p) === Way.STAGE_PLACE[st]); if (prev) { location.hash = '#/place/' + prev; e.preventDefault(); } return; }
    const b = host.querySelector((host === sheet ? '' : '.dock ') + '[data-key="' + (e.key === 'ArrowRight' ? 'next' : 'back') + '"]');
    if (b) { b.click(); e.preventDefault(); }
  });
  /* ---- Break it: the lab itself, broken by anyone, from anywhere, at any time. Not a stage of a plan: whoever uses
     the lab stands outside it and says what is untrue, confusing, broken or could be better, where they saw it. It
     becomes a report in the ledger (src/engines/ledger.js), through the same slip as every entry, and calls for a fix
     until someone makes one. What was reported here already is shown first, so it is said once and seen by all. ---- */
  const breakp = $('breakp');
  let breakSay = 'confusing', breakMine = null, breakErr = '';
  const breakAt = () => (/^#\/[a-z0-9._\/-]{0,80}$/.test(location.hash) ? location.hash : '#/');
  function drawBreak() {
    const at = breakAt(), here = reportsAt(Game.world(S), at);
    let h = '<button type="button" class="x" data-breakx aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(t('break.k')) + '</p><h2>' + esc(t('break.t')) + '</h2>' +
      '<p class="small">' + esc(t('break.lead')) + '</p><p class="small muted">' + esc(t('break.here')) + ' <span class="mono">' + esc(at) + '</span></p>';
    h += here.length ? '<p class="kicker">' + esc(t('break.reported')) + '</p><ul class="reports">' + here.map(e => '<li class="' + esc(e.state || '') + (e.draft ? ' draft' : '') + '"><span class="made ' + esc(e.made) + '"></span><span><b>' + esc(t('report.say.' + e.say)) + '</b> ' + esc(e.words) +
      '<span class="small muted"> · ' + byLine(e) + ' · ' + esc(t('ledger.state.' + (e.draft ? 'draft' : e.state))) + (e.fixedBy ? ' · ' + esc(t('break.fixedBy', { words: (Game.world(S).byId[e.fixedBy] || {}).words || '' })) : '') + '</span>' + (e.draft ? slipHtml(S, e.id) : '') + '</span></li>').join('') + '</ul>'
      : '<p class="small muted">' + esc(t('break.none')) + '</p>';
    if (!breakMine) h += '<div class="breakform"><p class="kicker">' + esc(t('break.say')) + '</p><div class="chips">' + SAYS.map(k => '<button type="button" class="chipb" data-say="' + k + '" aria-pressed="' + (k === breakSay) + '">' + esc(t('report.say.' + k)) + '</button>').join('') + '</div>' +
      '<label><span class="kicker">' + esc(t('break.words')) + '</span><textarea data-breakwords rows="3" maxlength="400" placeholder="' + esc(t('break.ph')) + '"></textarea></label>' + signHtml(S) +
      (breakErr ? '<p class="small err" role="alert">' + esc(breakErr) + '</p>' : '') + '<div class="acts"><button type="button" class="btn primary" data-breakkeep>' + esc(t('break.keep')) + '</button></div><p class="small muted">' + esc(t('break.gh')) + '</p></div>';
    breakp.innerHTML = h;
  }
  const openBreak = on => { breakp.hidden = !on; $('breakbtn').setAttribute('aria-expanded', String(on)); if (on) { breakMine = null; breakErr = ''; drawBreak(); const f = breakp.querySelector('textarea'); if (f && innerWidth > 700) f.focus(); } };
  $('breakbtn').addEventListener('click', () => openBreak(breakp.hidden));
  breakp.addEventListener('click', e => {
    if (e.target.closest('[data-breakx]')) { openBreak(false); $('breakbtn').focus(); return; }
    if (slipClick(e, S, () => { save(); refresh(true); drawBreak(); })) return;
    const say = e.target.closest('[data-say]'); if (say) { breakSay = say.dataset.say; breakp.querySelectorAll('[data-say]').forEach(b => b.setAttribute('aria-pressed', String(b === say))); return; }
    if (e.target.closest('[data-breakkeep]')) {
      const words = (breakp.querySelector('[data-breakwords]') || {}).value || '', r = keep(S, { kind: 'report', at: breakAt(), say: breakSay, words: words.trim() }, breakSay, signOf(breakp));
      if (r.ok) { breakMine = r.e.id; breakErr = ''; save(); refresh(true); } else breakErr = refusal(r.r);
      const keepWords = words; drawBreak(); const f = breakp.querySelector('[data-breakwords]'); if (f && !r.ok) f.value = keepWords;
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !breakp.hidden) { openBreak(false); $('breakbtn').focus(); } });
  /* the place changes under an open panel: it follows, and shows what was reported there */
  window.addEventListener('hashchange', () => { if (!breakp.hidden) { breakMine = null; breakErr = ''; drawBreak(); } });
  window.addEventListener('hashchange', route);
  hud(); drawHero(); firstGo();
  route();
  Object.assign(V, { S, save, refresh, loading, here, sheet, insp, hideInsp, lensbar, closeSheet, kickerOf, doList, whereOf, chOf, doHref, jobCard, worldsRow, askLink, DIVE_LEVELS, levelHref, enterOf, PARTS, isPart, deeperOf, aroundHtml, withLabs, pui, fui, kui, sui, cui, vui, diveId, bui, page, partsOf, portalAt });
}
