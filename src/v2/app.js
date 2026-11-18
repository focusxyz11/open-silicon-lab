/* The shell (docs/reviews/structure.md). The lab is one grid: across it a chip's life, the loop (need, design, make,
   test, ship, use, and back to the need), and down it scale (a place, then its levels to the atom). The bar holds the
   loop: it says which stage you are at and moves you along, holding your level where it exists there
   (src/engines/way.js). The side rail holds the levels. Everything else is one card at the bottom, the same on the
   island and in every view, with three faces: Look (what this is, and the two moves from here: in, and on round the
   loop), Do (its challenges, played right there, in the card of the view that shows their level: src/v2/play.js)
   and Ask (its questions, and what people and agents have asked). There is no menu: the commons is the need, the
   place where the loop starts and comes back (the Lab, and its record, #/build); what you met and did is your log
   (#/log); the world around the island is the way out from it (#/ecosystem).
   Routes: #/, #/place/<id>, #/place/datacentre/<level>, #/chip/<row>[/build] (inside a chip, layer by layer),
   #/board (one board, with a story that drives it), #/dive/<depth>[/<world>] (the dive), #/line/<step> (the factory),
   #/bench/<level>[/<challenge>] (the studio), #/do/<challenge>, #/ask/<thread>/<depth>, #/supply, #/log, #/build,
   #/ecosystem. Words are read with t(). */
import { t } from '../core/i18n.js';
import { REPO, THREADS } from '../data/weave.js';
import { NEEDS } from '../data/build.js';
import { childrenOf } from '../engines/build.js';
import { WAYS } from '../data/ways.js';
import * as Game from './game.js';
import * as Way from '../engines/way.js';
import { play, titleOf, goalOf } from './play.js';
import { PLACES } from './map3d.js';
import { LEVELS, ASKS } from './dc3d.js';
import { stopsAt } from '../data/places.js';
import { showStage, stage } from './kit3d.js';
import { rootShown } from '../engines/weave.js';
import { FIGURES, CASES } from '../data/weave.js';
import { fmtDate } from '../core/i18n.js';
import { ROWS, ASK as CHIP_ASK } from './chip3d.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, byLine } from './commons.js';
import { reportsAt, SAYS } from '../engines/ledger.js';
import * as Read from './read.js';
import * as Exp from '../engines/experiments.js';
import * as Chip from '../engines/chip.js';
import { levelAt, fieldAtLevel, VIEW_PARTS, diveWord } from '../data/atlas.js';
import * as Field from './field.js';
import { setBetScene } from '../app/betscene.js';
import { whatif as whatifView } from './whatif.js';
import { LEVERS as WF_LEVERS } from '../engines/ripple.js';
import * as Worlds from './worlds.js';
import { copiesInput } from './copies.js';
import { wallsInput } from './walls.js';
import { formsInput } from './forms.js';
import { planInput } from './plan.js';
import { clockInput } from './clock.js';
import { sideInput } from './side.js';
import { swarmInput, swarmStart } from './swarm.js';
import { tuneInput, tuneType } from './tunebox.js';
import { WORLD_IDS } from '../data/worlds.js';

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hue = th => (THREADS.find(x => x.id === th) || { hue: 200 }).hue;
const qColor = key => 'hsl(' + hue(key.split('.')[0]) + ' 70% 55%)';
/* following a question stays in the chip world: its trail walks from view to view (Game.askHref) */
const follow = key => Game.askHref(key);
/* following a question from a card opens it in its world (#/w/<world>/at/<depth>): the question as it was met at its
   place, with what is tried and asked there, then the world it belongs to. Its marks inside a picture still open it
   in the picture (follow). */
const followW = key => { const [th, d] = key.split('.'); return WORLD_IDS.includes(th) ? '#/w/' + th + '/at/' + d : Game.askHref(key); };

export function start() {
  let map = null, dc = null, chip = null, board = null, dive = null, mapReady = null;
  const S = Game.load(localStorage);
  const save = () => Game.save(localStorage, S);
  /* a leak raised when you cross its seam (src/data/questions.js), shown beside the view until you follow or close it */
  const seamEl = document.createElement('aside'); seamEl.className = 'seamnote'; seamEl.hidden = true; seamEl.setAttribute('aria-live', 'polite'); document.body.appendChild(seamEl);
  let seamTimer = null, seamFrom = null;
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
  /* ---- the theme ---- */
  const theme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const tb = $('theme'), k0 = theme() === 'dark' ? 'ui.toLight' : 'ui.toDark'; tb.setAttribute('aria-label', t(k0)); tb.title = t(k0);
  tb.addEventListener('click', () => { const n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('osl-theme', n); } catch (e) { /* storage unavailable */ } location.reload(); });

  /* ---- what the island shows: growth, steps, your chip, the community's pieces ---- */
  function islandState() {
    const C = Game.community(S), leaves = NEEDS.filter(n => !childrenOf(n.id).length), order = ['built', 'yours', 'open', 'engine'];
    const floors = leaves.map(n => { const p = C.state[n.id]; return p.state === 'built' ? 'built' : p.state === 'engine' ? 'engine' : p.yours ? 'yours' : 'open'; }).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const places = Object.fromEntries(Game.PLACES.map(id => { const L = doList(id); return [id, { done: L.filter(c => S.done[c.id]).length, total: L.length }]; }));
    return { grown: Game.grown(S), steps: Object.fromEntries(Game.STEPS.map(s => [s, Game.stepState(S, s)])), places, chipAt: (cur && Way.stageOfPlace(cur.place)) || Game.chipAt(S), floors, designs: C.designs, cases: C.cases, asks: C.asks.map(a => Object.assign({}, a, { at: placeOfStop(a.under) })), loud: C.loud, square: squareState(), wanted: wantedNow(), reports: reportsNow(), pull: pullNow(), aiShare: aiShare(), chip: Chip.model(S.chip), jobList: C.jobs, engineList: C.engines };
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
  const pullNow = () => { const W = Game.world(S); return Game.frontierOf(S).map(f => ({ kind: f.kind, key: f.piece && f.kind !== 'break' ? f.piece : f.of || f.q || f.piece, pull: f.pull,
    at: f.kind === 'ask' ? placeOfStop((W.byId[f.q] || {}).under) : f.kind === 'report' ? placeOfAt((W.byId[f.of] || {}).at) : null })); };
  const aiShare = () => { const E = Game.world(S).entries.filter(e => e.made && e.made !== 'example'); if (!E.length) return null; return E.reduce((a, e) => a + (e.made === 'ai' || e.made === 'program' ? 1 : e.made === 'both' ? 0.5 : 0), 0) / E.length; };
  const refresh = animate => { if (map) map.setState(islandState(), animate); hud(); drawHero(); firstGo(); };
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
  const prewarm = () => [ready(ensureDc, 'dc'), ready(ensureChip, 'chip'), ready(ensureBoard, 'board')].reduce((p, f) => p.then(() => new Promise(r => idle(() => { f(); r(); }))), Promise.resolve());
  const preload = () => { prewarm(); ['./frame.js', './board3d.js', './story.js', './stories.js', '../engines/weave.js', '../app/world.js', '../data/weave.js', '../app/design.js', '../app/journey.js', './level3d.js', './relief3d.js', './wafer3d.js', './pcb3d.js', './phone3d.js', './gate3d.js', './switch3d.js', './atom3d.js', './overlay.js'].forEach(u => import(u).catch(() => { /* fetched again when needed */ })); };
  const ensureMap = () => mapReady || (mapReady = import('./map3d.js').then(m => {
    /* tap selects, zoom goes in and out (docs/INTERACTION.md): a second tap on the same place selects it again, it
       does not go in */
    map = m.createMap($('mapCanvas'), $('mapLabels'), { whatif: id => wf && wf.pick(id), place: id => { if (wf) return wf.pick(id); if (cur && cur.place === id && !cur.part && (!sheet.hidden || !insp.hidden)) return; quickNext = true; openPlace(id); }, part: (place, part) => { quickNext = true; location.hash = '#/place/' + place + '/' + part; },
      carry: id => { carryNote = carryAt(id); quickNext = true; openPlace(id); },
      deeper: (place, part) => { const to = deeperOf(place, part); if (to) enter(to); },
      leave: id => { if (cur && cur.place === id) { closeSheet(); if (location.hash.startsWith('#/place/')) history.replaceState(null, '', '#/'); hud(); } },
      question: key => openQuestion(key), mover: info => openMover(info), unfollow: () => { if (sheet.classList.contains('mover')) closeSheet(); }, challenge: id => { const ch = chOf(id); if (ch) location.hash = doHref(ch); }, report: at => { if (location.hash !== at) location.hash = at; setTimeout(() => openBreak(true), 0); }, ask: id => openPlace(id, 'ask'), job: need => openJob(need), entry: id => openEntry(id), interact: () => foldHero() });
    loading(false); map.setState(islandState(), false); idle(preload);
    /* the first minute: a first visit to the island opens on a wide shot and comes down to it, and the hero rises after */
    if (!S.seen && (!location.hash || location.hash === '#/') && !still()) { map.intro(); $('hero').classList.add('intro'); }
    if (!S.seen) { S.seen = true; save(); }
    return map;
  }));
  /* each view is made once, even when the prewarm and a visit ask for it at the same moment */
  let dcP = null, chipP = null, boardP = null;
  const ensureDc = () => dcP || (dcP = import('./dc3d.js').then(m => { dc = m.createDataCentre($('placeCanvas'), $('placeLabels'), { level: lv => placeUI(lv), depth: z => depthBar(z),
    portal: p => dcFrame && dcFrame.inwardAt(p), beyond: () => { if (!pui.hidden) location.hash = '#/dive/chip'; } }); return dc; }));

  /* ---- the loop: a chip's life in the bar, on every view. It is where you are (the stage lit) and how you move
     along: a tap goes to that stage, holding the level you are at wherever that level exists there (a gate as used,
     as made, as designed), and otherwise to that stage's place on the island (src/engines/way.js) ---- */
  const hudEl = $('loop');
  /* the address of what is in view now: moving inside a view (deeper, along the line) changes it too */
  const liveHash = () => !vui.hidden && flatKind !== 'supply' && WE && diveD >= 0 && diveId() ? (flatKind === 'dive' ? '#/dive/' + diveId() + (diveWorld !== 'datacentre' ? '/' + diveWorld : '') : '#/' + flatKind + '/' + diveId())
    : !cui.hidden ? '#/chip/' + chipRow + (chipMode === 'build' ? '/build' : '') : !pui.hidden ? '#/place/datacentre/' + dcLv : location.hash;
  const whereNow = () => { const k = partsOf(location.hash)[0], W = Way.whereOf(k === 'ask' || k === 'do' || k === 'supply' ? location.hash : liveHash()); return W.view === 'island' && cur && !sheet.hidden ? Way.whereOf('#/place/' + cur.place) : W; };
  /* the address always says where you are (so it can be shared, and a reload comes back here), and the loop in the
     bar follows: walking the line from the wires to the test house to the port, the stage lit moves with you */
  const here = () => { const h = liveHash(), p = partsOf(location.hash), k = p[0];
    if (h !== location.hash && (['dive', 'line', 'chip'].includes(k) || (k === 'bench' && !p[2]) || (k === 'place' && !pui.hidden))) { history.replaceState(null, '', h); shownAt = h; }
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
    nextMove = 'along'; clearTimeout(turnT); turnT = setTimeout(() => { nextMove = null; }, 400);
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
    /* the questions come from inside the worlds' documents */
    Worlds.loadAll().then(all => { const box = $('hero').querySelector('[data-heroq]'); if (box) box.innerHTML = Worlds.starters(all).map(Worlds.qCard).join(''); }, () => {});
  }
  /* following the chip is no guide: it opens the place where the loop starts, and every place offers the next */
  /* the first page's questions and challenges never go away: exploring folds them into a small button in the corner,
     which opens them again (docs/INTERACTION.md: a heads-up layer that steps aside, not one that is gone) */
  function foldHero() { const h = $('hero'); if (!h.classList.contains('away')) h.classList.add('folded'); }
  $('hero').addEventListener('click', e => { if (e.target.closest('[data-unfold]')) { $('hero').classList.remove('folded'); return; } if (e.target.closest('[data-fold]')) { $('hero').classList.add('folded'); return; } if (e.target.closest('a[href]')) $('hero').classList.add('away'); if (e.target.closest('[data-start]')) { $('hero').classList.add('away'); location.hash = '#/place/' + Way.STAGE_PLACE.open; } });

  /* ---- the sheet: a place with its three doors, a question, or a challenge ---- */
  const sheet = $('sheet');
  /* the stage knows when a sheet is open (phones fold the HUD's next button away) */
  new MutationObserver(() => $('stage').classList.toggle('sheeted', !sheet.hidden)).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  let cur = null;   /* { place, tab } */
  /* ---- the world is the interface (docs/INTERACTION.md): what you tap on the island is answered beside it, by a
     small inspector that stays with it as the camera moves; the full card is one tap further, never in the way ---- */
  const insp = document.createElement('div'); insp.className = 'insp'; insp.hidden = true; insp.setAttribute('role', 'dialog'); $('stage').appendChild(insp);
  let quickNext = false, carryNote = null, inspRaf = 0;
  const hideInsp = () => { insp.hidden = true; cancelAnimationFrame(inspRaf); };
  function drawInsp() {
    if (!cur) return hideInsp(); const id = cur.place, P = cur.part && PARTS[id], C = Game.community(S), dos = doList(id);
    const nDo = id === 'lab' ? C.jobs.length + C.engines.length : id === 'village' ? C.jobs.length : dos.filter(c => !S.done[c.id]).length, nAsk = (Game.ASK[id] || []).length + Game.debatesAt(id).length + Game.fieldsAt(id).length;
    const deep = P ? P.deeper(cur.part) : enterOf(id), cn = carryNote && carryNote.place === id ? carryNote : null;
    insp.innerHTML = '<button type="button" class="ix" data-iact="close" aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(P ? t('map.' + id + '.t') : kickerOf(id)) + '</p><h3>' + esc(P ? P.name(cur.part) : t('map.' + id + '.t')) + '</h3>' +
      '<p class="il">' + esc(P ? P.see(cur.part) : t('map.' + id + '.d')) + '</p>' +
      /* seen through a lens, a place offers the question that lens belongs to, where it is asked here */
      (lensQ(id) ? '<div class="ilens">' + askLink(lensQ(id)) + '</div>' : '') +
      (DIALS[id] && !P ? '<div class="dials"><p class="kicker">' + esc(t('dial.k')) + '</p>' + dialsHtml(id) + '</div>' : '') +
      (cn ? '<div class="icarry"><span>' + esc(cn.text) + '</span>' + (cn.ch ? '<button type="button" class="chipb" data-iact="play">' + esc(t('carry.go')) + '</button>' : '') + '</div>' : '') +
      /* the way in comes first, large, with the gestures that do the same said once beside it */
      (deep ? '<button type="button" class="igo" data-iact="deeper"><span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(P ? P.name(cur.part) : t('map.' + id + '.t')) + '</b></span></button><p class="small muted ihint">' + esc(t('insp.inHint')) + '</p>' : '') +
      '<div class="iacts">' +
      '<button type="button" class="chipb" data-iact="do">' + esc(t('door.do')) + (nDo ? ' <span class="n">' + nDo + '</span>' : '') + '</button>' +
      '<button type="button" class="chipb" data-iact="ask">' + esc(t('door.ask')) + (nAsk ? ' <span class="n">' + nAsk + '</span>' : '') + '</button>' +
      '<button type="button" class="chipb" data-iact="more">' + esc(t('insp.more')) + '</button></div>';
    insp.hidden = false; sheet.hidden = true; cancelAnimationFrame(inspRaf); inspTrack();
  }
  /* it stays beside what it is about, above it where there is room, below where there is not (a phone keeps it at the foot) */
  function inspTrack() { inspRaf = requestAnimationFrame(inspTrack); if (insp.hidden || !map || !cur) return; if (innerWidth <= 720) { insp.style.transform = ''; return; }
    const p = map.screenOf(cur.place, cur.part), r = $('stage').getBoundingClientRect(); if (!p) return; const w = insp.offsetWidth, h = insp.offsetHeight;
    /* beside it: to the right where there is room, else to the left, its middle level with the thing */
    const px = p.x * r.width, py = p.y * r.height, off = cur.part ? 70 : 150; let x = px + off; if (x + w > r.width - 12) x = px - off - w; let y = py - h / 2;
    x = Math.max(12, Math.min(r.width - w - 12, x)); y = Math.max(84, Math.min(r.height - h - 12, y));
    insp.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }
  insp.addEventListener('click', e => { const dl = e.target.closest('[data-dial]'); if (dl && cur) { turnDial(dl.dataset.dial, +dl.dataset.d); return; }
    const b = e.target.closest('[data-iact]'); if (!b || !cur) return; const a = b.dataset.iact;
    if (a === 'close') { closeSheet(); map && map.select(null); return; }
    if (a === 'deeper') { const to = deeperOf(cur.place, cur.part); if (to) enter(to); return; }
    if (a === 'play') { const ch = chOf(carryNote && carryNote.ch); carryNote = null; if (ch) location.hash = doHref(ch); return; }
    cur.tab = a === 'more' ? 'look' : a; drawPlace(); });
  /* ---- lenses: the same island seen for one thing at a time; each opens onto the question it belongs to, one at a
     time, never as a list ---- */
  const LENSES = [['look', '○'], ['heat', '≋'], ['flow', '⇄'], ['fail', '✕'], ['time', '◷']], LENS_WORLD = { heat: 'limit', fail: 'fail', time: 'make', flow: 'open' };
  const lensbar = document.createElement('nav'); lensbar.className = 'lensbar'; lensbar.hidden = true; lensbar.setAttribute('aria-label', t('lens.aria')); $('stage').appendChild(lensbar);
  const drawLens = k => { lensbar.innerHTML = '<div class="lb">' + LENSES.map(([id, g]) => '<button type="button" data-lens="' + id + '" aria-pressed="' + (id === k) + '" title="' + esc(t('lens.' + id + '.t')) + '"><span class="g" aria-hidden="true">' + g + '</span><span class="nm">' + esc(t('lens.' + id + '.t')) + '</span></button>').join('') + '</div>' +
    (k !== 'look' ? '<div class="lensnote"><p>' + esc(t('lens.' + k + '.d')) + '</p><a href="#/w/' + LENS_WORLD[k] + '">' + esc(t('lens.follow')) + ' →</a></div>' : ''); };
  drawLens('look');
  lensbar.addEventListener('click', e => { const b = e.target.closest('[data-lens]'); if (!b || !map) return; const k = map.lens() === b.dataset.lens ? 'look' : b.dataset.lens; map.setLens(k); drawLens(k); foldHero(); });
  const lensQ = id => { const k = map && map.lens(), w = k && LENS_WORLD[k]; if (!w) return null; const P = cur && cur.part && PARTS[id], L = P ? P.qs(cur.part) : (Game.ASK[id] || []); return L.find(q => q.startsWith(w + '.')) || null; };
  lensbar.addEventListener('click', () => { if (!insp.hidden) drawInsp(); });
  /* ---- change it where it is decided (docs/INTERACTION.md, "Change it in place"): your chip's settings are dials
     at the places that decide them, and what a change does is seen arriving where it shows: a light travels to those
     places, the lens that shows it comes on, and the numbers that moved are said in one line (src/engines/chip.js) ---- */
  const DIALS = { studio: ['clock', 'size'], fab: ['gen', 'load'], datacentre: ['mem', 'reuse'] };
  const DIAL_FX = { clock: [['test', 'datacentre'], 'fail'], size: [['fab', 'test'], 'fail'], gen: [['fab', 'test', 'datacentre'], 'heat'], load: [['fab', 'port'], 'time'], mem: [['datacentre'], 'heat'], reuse: [['datacentre'], 'heat'] };
  const dialMax = { clock: Chip.CLOCKS.length - 1, gen: Chip.GENS - 1, size: Chip.SIDES.length - 1, load: Chip.LOADS.length - 1, reuse: Chip.REUSES.length - 1, mem: Chip.MEMS.length - 1 };
  const dialIdx = k => (k === 'clock' ? Chip.CLOCKS.indexOf(S.chip.clock) : S.chip[k]);
  const dialText = k => { const c = S.chip; return k === 'clock' ? t('chip.clock.value', { v: Chip.x2(c.clock) }) : k === 'size' ? t('chip.size.value', { mm: Chip.SIDES[c.size] }) : k === 'load' ? t('chip.load.value', { v: Math.round(Chip.LOADS[c.load] * 100) }) : k === 'reuse' ? t('chip.reuse.value', { v: Chip.REUSES[c.reuse] }) : k === 'mem' ? t('chip.mem.names')[c.mem] : t('chip.gen.names')[c.gen]; };
  const dialRead = k => { const m = Chip.model(S.chip), pc = v => Math.round(v * 100);
    return k === 'clock' ? t('dial.read.clock', { late: pc(m.late), power: Chip.x2(m.power) }) : k === 'size' ? t('dial.read.size', { yield: pc(m.yield), power: Chip.x2(m.power) })
      : k === 'gen' ? t('dial.read.gen', { power: Chip.x2(m.power), yield: pc(m.yield), weeks: Math.round(m.days / 7) }) : k === 'load' ? t('dial.read.load', { weeks: Math.round(m.days / 7), cost: Chip.x2(m.cost) })
      : t('dial.read.mem', { busy: pc(m.busy), board: Chip.x2(m.powerBoard) }); };
  let dialLast = null;
  const dialsHtml = id => (DIALS[id] || []).map(k => '<div class="dial"><span class="dl">' + esc(t('chip.' + k + '.label')) + '</span><span class="dv"><button type="button" class="db" data-dial="' + k + '" data-d="-1"' + (dialIdx(k) <= 0 ? ' disabled' : '') + ' aria-label="−">−</button><output>' + esc(dialText(k)) + '</output><button type="button" class="db" data-dial="' + k + '" data-d="1"' + (dialIdx(k) >= dialMax[k] ? ' disabled' : '') + ' aria-label="+">+</button></span></div>' +
    (dialLast === k ? '<p class="dread">' + esc(dialRead(k)) + '</p>' : '')).join('');
  function turnDial(k, d) { const i = Math.max(0, Math.min(dialMax[k], dialIdx(k) + d)); S.chip[k] = k === 'clock' ? Chip.CLOCKS[i] : i; S.chip = Chip.normal(S.chip); save(); dialLast = k;
    const [to, lk] = DIAL_FX[k]; if (map) { map.frame([cur.place].concat(to)); map.ripple(cur.place, to); if (map.lens() !== lk) { map.setLens(lk); drawLens(lk); } map.setState(islandState(), false); } drawInsp(); }
  /* your chip carried to a place: what that place would do with it, there and then */
  const carryAt = id => { const L = doList(id), open = L.filter(c => !S.done[c.id]); if (open.length) return { place: id, text: t('carry.play', { what: titleOf(open[0]) }), ch: open[0].id };
    return { place: id, text: t(L.length ? 'carry.done' : 'carry.none') }; };
  const closeSheet = () => { const was = cur; sheet.hidden = true; cur = null; hideInsp(); if (carryNote) { carryNote = null; map && map.chipHome(); } if (sheet.classList.contains('mover')) { sheet.classList.remove('mover'); map && map.unfollow(); } if (was) { $('hero').classList.remove('away'); $('hero').classList.add('folded'); hud(); if (map) map.select(null); if (map && !$('mapCanvas').hidden) map.setState(islandState(), false); } };
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
    /* where a place has no levels, its first other way in is what Go inside opens: it is not offered twice */
    const L = Game.INSIDE[id] || [], extra = (Game.LOOK[id] || []).slice(L.length ? 0 : 1);
    const steps = w => ['journey', 'design'].includes(w), groups = []; L.forEach(l => { const g = groups[groups.length - 1]; if (g && steps(g[0].world) === steps(l.world)) g.push(l); else groups.push([l]); });
    let h = groups.map(G => '<p class="kicker lvk">' + esc(t(steps(G[0].world) ? 'loop.steps' : 'loop.levels')) + '</p><ol class="lvchips' + (steps(G[0].world) ? ' steps' : '') + '" aria-label="' + esc(t('door.look.d')) + '">' + G.map((l, i) => {
      const nq = stopsAt(l.depth).length, chs = Game.placeChallenges(id).filter(c => c.at === l.depth).length;
      const href = levelHref(id, l), fly = (Game.FLOWN[id] || {})[l.depth] != null, shared = id !== 'datacentre' && Game.SHARED.includes(l.depth);
      const note = [t('depth.' + l.depth + '.see'), fly && t('game.inside.fly'), shared && t('game.inside.shared')].filter(Boolean).join(' · ');
      /* the factory's tools are in the scene: a step selects its tool where it stands */
      if (isPart(id, l.depth)) return '<li><a href="#/place/' + id + '/' + l.depth + '" data-part="' + l.depth + '" title="' + esc(note) + '"><span class="i">' + (i + 1) + '</span>' + esc(t('depth.' + l.depth + '.name')) + (chs ? '<span class="dotc" role="img" aria-label="' + esc(t('game.inside.ch', { n: chs })) + '"></span>' : '') + (nq ? '<span class="qn" title="' + esc(t('game.inside.qs', { n: nq })) + '">' + nq + '</span>' : '') + '</a></li>';
      return '<li><a href="' + esc(href) + '" title="' + esc(note) + '" class="' + (shared ? 'shared' : '') + '"><span class="i">' + (i + 1) + '</span>' + esc(t('depth.' + l.depth + '.name')) + (chs ? '<span class="dotc" role="img" aria-label="' + esc(t('game.inside.ch', { n: chs })) + '"></span>' : '') + (nq ? '<span class="qn" title="' + esc(t('game.inside.qs', { n: nq })) + '">' + nq + '</span>' : '') + '</a></li>';
    }).join('') + '</ol>').join('');
    h += extra.map(l => { const href = l.to ? '#/place/' + l.to : '#/' + l.page;
      return '<a class="look" href="' + esc(href) + '"><b>' + esc(t('look.' + l.id + '.t')) + '</b><span class="small">' + esc(t('look.' + l.id + '.d')) + '</span>' + (l.world ? '<span class="small muted">' + esc(t('game.current')) + '</span>' : '') + '</a>'; }).join('');
    return h || (enterOf(id) ? '' : '<p class="small muted">' + esc(t('game.noLook')) + '</p>');
  }
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
  function openMover(m) {
    const W = Game.world(S), c = m.call, e = c && W.byId[c.key];
    let k, title, line, go;
    if (c) { k = t('follow.' + m.kind + '.k');
      if (c.kind === 'break' && e) { title = e.title; line = t('follow.call.break'); go = ['open', 'break:' + c.key]; }
      else if (c.kind === 'build') { title = t('build.need.' + c.key + '.t'); line = t('follow.call.build'); go = ['job', c.key]; }
      else if (c.kind === 'engine') { title = t('build.need.' + c.key + '.t'); line = t('follow.call.engine'); go = ['place', 'village']; }
      else if (c.kind === 'ask' && e) { title = e.q; line = t('follow.call.ask', { by: e.by }); go = e.under ? ['q', e.under] : ['place', 'idea']; }
      else if (c.kind === 'report' && e) { title = e.words; line = t('follow.call.report', { say: t('report.say.' + e.say) }); go = ['report', e.at]; }
      else { title = t('follow.call.gone'); line = ''; go = null; } }
    else { k = t('follow.k'); const id = m.kind === 'ship' ? 'ship.' + m.lane : m.kind; title = t('follow.' + id + '.t'); line = t('follow.' + id + '.d');
      go = ['place', m.kind === 'ship' ? m.lane : m.kind === 'plane' ? 'port' : 'fab']; }
    cur = null; $('hero').classList.add('away');
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(k) + '</p><h2>' + esc(title) + '</h2><div class="door">' +
      (line ? '<p class="line">' + esc(line) + '</p>' : '') + (go ? '<button type="button" class="btn primary" data-fgo="' + go[0] + '" data-v="' + esc(go[1]) + '">' + esc(go[0] === 'place' ? t('follow.goPlace', { place: t('map.' + go[1] + '.t') }) : t('follow.go')) + '</button>' : '') +
      '<p class="small muted">' + esc(t(c ? 'follow.pullNote' : 'follow.note')) + '</p></div>';
    sheet.classList.add('mover'); sheet.classList.remove('part', 'inside'); sheet.hidden = false; sheet.scrollTop = 0; hud();
  }
  function openPlace(id, tab, step, piece, part) {
    sheet.classList.remove('mover'); dialLast = null; const quick = quickNext; quickNext = false; if (!carryNote || carryNote.place !== id) carryNote = null;
    cur = { place: id, tab: tab || 'look', step: step || null, piece: piece || null, part: part || null };
    { const to = Way.whereOf('#/place/' + id); crossed(seamFrom, to); seamFrom = to; }
    if (map) { if (!part) map.focus(id, { center: quick }); map.select(id, part); }
    /* the address says where you are: a place picked on the island is written into it (without going anywhere) */
    const at = '#/place/' + id + (part ? '/' + part : '');
    if (!step && /^#?\/?$|^#\/(place|explore)/.test(location.hash) && location.hash !== at && !location.hash.startsWith(at + '/')) history.pushState(null, '', at);
    $('hero').classList.add('away'); drawPlace(); if (quick) drawInsp(); hud(); if (map) map.setState(islandState(), false);
  }
  function drawPlace() {
    const id = cur.place, C = Game.community(S), asks = Game.ASK[id] || [], debates = Game.debatesAt(id), dos = doList(id), fields = Game.fieldsAt(id);
    const nDo = id === 'lab' ? C.jobs.length + C.engines.length : id === 'village' ? C.jobs.length : dos.filter(c => !S.done[c.id]).length, nAsk = asks.length + debates.length + fields.length;
    let h = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>';
    h += '<div class="doors" role="tablist">' + ['look', 'do', 'ask'].map(k => '<button type="button" role="tab" data-door="' + k + '" aria-selected="' + (cur.tab === k) + '" title="' + esc(t('door.' + k + '.d')) + '"><b>' + esc(t('door.' + k)) + (k === 'do' && nDo ? ' <span class="n">' + nDo + '</span>' : k === 'ask' && nAsk ? ' <span class="n">' + nAsk + '</span>' : '') + '</b></button>').join('') + '</div>';
    const PP = cur.part && PARTS[id];
    h += PP && cur.tab === 'look' ? '<p class="kicker">' + esc(t('map.' + id + '.t')) + '</p><h2 class="cap">' + esc(PP.name(cur.part)) + '</h2><div class="door">'
      : '<p class="kicker">' + esc(kickerOf(id)) + '</p><h2>' + esc(t('map.' + id + '.t')) + '</h2><div class="door">';
    if (cur.tab === 'do') {
      if (id === 'lab') h += '<p class="small">' + esc(t('game.lab.do', { built: C.built, total: C.total })) + '</p>' + C.breaks.map(b => chCard(chOf('break:' + b.of))).join('') + C.jobs.map(jobCard).join('') + C.engines.map(e => '<a class="chcard engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + e.need + '.t') }) })) + '"><span class="st">⚙</span><span><b>' + esc(t('build.need.' + e.need + '.t')) + '</b><span class="small">' + esc(t('game.engineWanted')) + '</span></span></a>').join('') + '<a class="link" href="#/build">' + esc(t('game.seePlan')) + '</a>';
      else if (id === 'village') h += '<p class="small">' + esc(t('game.village.do')) + '</p>' + C.designs.map(designCard).join('') + C.jobs.map(jobCard).join('');
      else if (id === 'idea') h += '<p>' + esc(t('game.idea.do')) + '</p><a class="btn primary" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('game.idea.title') })) + '">' + esc(t('game.idea.propose')) + '</a>';
      else if (dos.length) h += dos.map(chCard).join('');
      else h += '<p class="small muted">' + esc(t('game.noDo')) + '</p>';
    } else if (cur.tab === 'look' && id === 'lab' && cur.step) {
      h += labInside();
    } else if (cur.tab === 'look' && cur.part) {
      /* a part of an open building: what it does, its question, and how to go closer (zoom in) */
      const P = cur.part, PP2 = PARTS[id], qs = PP2.qs(P);
      h += '<p class="line">' + esc(PP2.see(P)) + '</p>' +
        '<div class="zoomhint"><button type="button" class="igo" data-deeper><span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(PP2.name(P)) + '</b></span></button><span class="small muted">' + esc(t('zoom.tool.' + id)) + '</span></div>' + qs.slice(0, 1).map(askLink).join('') + worldsRow(qs) +
        '<ol class="lvchips steps" aria-label="' + esc(t('zoom.tools')) + '">' + PP2.list.map((s2, i) => '<li><button type="button" data-part="' + s2 + '"' + (s2 === P ? ' aria-current="true"' : '') + '>' + esc(PP2.name(s2)) + '</button></li>').join('') + '</ol>';
    } else if (cur.tab === 'look') {
      /* one line; the way in is zooming in (docs/INTERACTION.md), the card only says so; the levels as small steps */
      const enter = enterOf(id);
      const nx = Way.stageOfPlace(id) ? Way.nextPlace(id) : null;
      h += '<p class="line">' + esc(t('map.' + id + '.d')) + '</p>' +
        (enter ? '<div class="zoomhint"><button type="button" class="igo" data-deeper><span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(t('map.' + id + '.t')) + '</b></span></button><span class="small muted">' + esc(t(PARTS[id] ? 'zoom.open' : 'zoom.place')) + '</span></div>' : '') +
        worldsRow((Game.INSIDE[id] || []).flatMap(l => stopsAt(l.depth))) +
        aroundHtml(id, nx) +
        /* What if?: the levers that sit on this island, each a way to see the change it makes cross the sea */
        WF_LEVERS.filter(l => l.place === id).map(l => '<a class="look wfgo" href="#/whatif/' + l.id + '"><b>' + esc(t('whatif.ui.go', { lever: t('whatif.lever.' + l.id + '.t') })) + '</b><span class="small">' + esc(t('whatif.lever.' + l.id + '.d')) + '</span></a>').join('') +
        /* where the loop starts there are two ways in: what someone needs, and what has just become possible */
        /* the sandbank: a stake for every question nobody can try yet, the first few as cards */
        (id === 'idea' ? (() => { const W = Exp.EXPERIMENTS.filter(x => Exp.stateOf(x) === 'wanted'); return W.length ? '<p class="kicker">' + esc(t('map.idea.staked', { n: W.length })) + '</p><div class="qcards">' + W.slice(0, 4).map(x => Read.card(x)).join('') + '</div>' + (W.length > 4 ? '<a class="more" href="#/read">' + esc(t('map.idea.all')) + '</a>' : '') : ''; })() : '') +
        (id === 'lab' ? '<div class="ways2"><button type="button" class="look" data-door="do"><b>' + esc(t('lab.pull.t')) + '</b><span class="small">' + esc(t('lab.pull.d', { n: C.jobs.length + C.engines.length })) + '</span></button><button type="button" class="look" data-door="ask"><b>' + esc(t('lab.push.t')) + '</b><span class="small">' + esc(t('lab.push.d', { n: WAYS.length })) + '</span></button></div>' : '') + insideHtml(id);
    } else {
      /* at the Lab, what has just become possible comes first: it is one of the two ways the loop starts */
      if (id === 'lab') h += '<p class="kicker">' + esc(t('game.ways')) + '</p>' + WAYS.map(w => '<div class="debate2"><b>' + esc(t('way.' + w.id + '.t')) + '</b><span class="small">' + esc(t('way.' + w.id + '.how')) + '</span></div>').join('');
      if (fields.length) h += '<p class="kicker">' + esc(t('field.ui.k')) + '</p><div class="fieldlist">' + fields.map(Field.fieldLine).join('') + '</div>';
      h += Game.askAt(id).map(g => (g.level && Game.askAt(id).length > 1 ? '<p class="kicker">' + esc(t('depth.' + g.level.depth + '.name')) + '</p>' : '') + g.stops.map(askLink).join('')).join('');
      if (debates.length) h += '<p class="kicker">' + esc(t('game.debates')) + '</p>' + debates.map(d => '<div class="debate2"><b>' + esc(t('debate.' + d + '.t')) + '</b><span class="small">' + esc(t('debate.' + d + '.q')) + '</span></div>').join('');
      if (!nAsk && id !== 'lab') h += '<p class="small muted">' + esc(t('game.noAsk')) + '</p>';
    }
    sheet.innerHTML = h + '</div>'; sheet.hidden = false; hideInsp(); sheet.scrollTop = 0; sheet.classList.toggle('inside', id === 'lab' && !!cur.step && cur.tab === 'look'); sheet.classList.toggle('part', !!cur.part);
  }
  /* a challenge, played in the sheet */
  function openChallenge(ch) {
    if (!ch) return;
    const placeId = ch.kind === 'break' ? 'village' : ch.need ? 'lab' : ch.place;
    if (!cur || cur.place !== placeId) { cur = { place: placeId, tab: 'do' }; map && map.focus(placeId); }
    $('hero').classList.add('away'); sheet.hidden = false; sheet.scrollTop = 0;
    play(sheet, ch, { state: S, save, kept, startChip: () => Object.assign({}, Game.START), open: openChallenge, back: () => { sheet.onclick = null; sheet.oninput = null; drawPlace(); }, done: won });
  }
  const openJob = need => { const j = Game.jobOf(need); if (j) openChallenge(j); };
  /* a house of the village: a clocked design opens the try to break it; any other, the village's list */
  const openEntry = id => { const ch = chOf('break:' + id); if (ch) openChallenge(ch); else openPlace('village', 'do'); };
  /* an entry of yours was kept (or dropped): the island shows it at once, as yours, and says who can see it */
  function kept(e) { save(); refresh(true); if (e) { toast(t('ledger.toast')); if (map && !$('mapCanvas').hidden) map.punch(); } }
  /* something was won: the island grows, the HUD moves on, a note says what appeared */
  /* a win is felt: the island grows where it happened and the camera leans in, the step in the bar bumps and counts
     one up, the next challenge glows, and a toast says what grew */
  function won(ch) {
    refresh(true); toast(ch.grows ? t('game.toast', { what: t('grow.' + ch.grows) }) : t(ch.kind === 'break' ? 'game.toastBreak' : 'game.toastJob'));
    if (map && !$('mapCanvas').hidden) map.punch();
    const b = ch.step && hudEl.querySelector('[data-stage="' + ch.step + '"]');
    if (b && !still()) { b.classList.add('bump'); const plus = document.createElement('span'); plus.className = 'plus'; plus.setAttribute('aria-hidden', 'true'); plus.textContent = '+1'; b.parentNode.appendChild(plus); setTimeout(() => plus.remove(), 1500); }
    if (!still()) $('logbtn').classList.add('glow');
  }
  const toastEl = $('toast'); let toastT = 0;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; toastEl.classList.remove('go'); void toastEl.offsetWidth; toastEl.classList.add('go'); clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 4200); }
  function openQuestion(key) {
    const pid = Object.keys(Game.BEACON).find(k => Game.BEACON[k] === key) || Object.keys(Game.ASK).find(k => Game.ASK[k].includes(key));
    if (pid) { cur = { place: pid, tab: 'ask' }; map && map.focus(pid); }
    $('hero').classList.add('away'); sheet.onclick = null; sheet.oninput = null;
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><div class="ask big" style="--qc:' + qColor(key) + '"><p class="kicker">' + esc(pid ? t('map.' + pid + '.t') : t('sheet.ask')) + '</p><p class="q">' + esc(t('stop.' + key + '.q')) + '</p><p>' + esc(t('stop.' + key + '.note')) + '</p></div>' +
      '<div class="acts"><a class="btn primary" href="' + esc(followW(key)) + '">' + esc(t('sheet.follow')) + '</a>' + (pid ? '<button type="button" class="btn" data-place="' + pid + '">' + esc(t('game.allHere', { place: t('map.' + pid + '.t') })) + '</button>' : '') + '</div>';
    sheet.hidden = false;
  }
  sheet.addEventListener('click', e => {
    if (e.target.closest('.player')) return;   /* the player handles its own clicks */
    const fg = e.target.closest('[data-fgo]'); if (fg) { sheet.classList.remove('mover'); map && map.unfollow(); const [k, v] = [fg.dataset.fgo, fg.dataset.v];
      if (k === 'open') openChallenge(chOf(v)); else if (k === 'job') openJob(v); else if (k === 'q') openQuestion(v); else if (k === 'report') { location.hash = v; setTimeout(() => openBreak(true), 0); } else openPlace(v); return; }
    if (e.target.closest('[data-close]')) { closeSheet(); if (location.hash !== '#/ecosystem') { map && map.overview(); if (location.hash.startsWith('#/place/')) history.replaceState(null, '', '#/'); } return; }
    const d = e.target.closest('[data-door]'); if (d) { cur.tab = d.dataset.door; drawPlace(); return; }
    /* going closer from the card is the same move as zooming in; a tool of the open factory is selected in place */
    if (e.target.closest('[data-deeper]')) { const to = deeperOf(cur.place, cur.part); if (to) enter(to); return; }
    const tp = e.target.closest('[data-part]'); if (tp) { location.hash = '#/place/' + cur.place + '/' + tp.dataset.part; return; }
    /* inside the Lab: its steps, and a piece of the computer (the address follows, so a piece can be shared) */
    const ls = e.target.closest('[data-labstep]'); if (ls) { location.hash = ls.dataset.labstep ? '#/build/' + ls.dataset.labstep : '#/place/lab'; return; }
    const pc = e.target.closest('[data-piece]'); if (pc) { location.hash = '#/build/computer/' + pc.dataset.piece; return; }
    if (slipClick(e, S, redraw => { save(); refresh(true); if (redraw) drawPlace(); })) return;
    const o = e.target.closest('[data-open]'); if (o) { openChallenge(chOf(o.dataset.open)); return; }
    const j = e.target.closest('[data-job]'); if (j) { openJob(j.dataset.job); return; }
    const p = e.target.closest('[data-place]'); if (p) openPlace(p.dataset.place);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); if (location.hash !== '#/ecosystem') map && map.overview(); } });

  /* ---- the frame: every view below the island wears it (src/v2/frame.js, docs/SYSTEM.md) ---- */
  /* the open things of the ledger that sit at a level: a design nobody has broken where designs are checked, a
     piece nobody has built where the job is chosen. The commons is on the thing itself, not on a page of its own */
  const openAt = d => { const C = Game.community(S); return (d === 'check' ? C.breaks.map(b => chOf('break:' + b.of)) : d === 'need' ? C.jobs.map(j => Game.jobOf(j.need)) : []).filter(Boolean); };
  const frameOf = (host, o) => FrameM.createFrame(host, Object.assign({ follow, askAt: d => stopsAt(d), fieldAt: d => fieldAtLevel(d).map(q => q.id),
    askedAt: d => { const A = Game.askedAtLevel(d, S); return A.length ? '<p class="kicker">' + esc(t('page.questions.asked')) + '</p>' + A.map(askedHtml).join('') : ''; },
    doAt: d => Game.CHALLENGES.filter(c => c.at === d).map(c => ({ id: c.id, title: titleOf(c), where: whereOf(c), href: doHref(c) }))
      .concat(openAt(d).map(c => ({ id: c.id, title: titleOf(c), where: whereOf(c), href: '#/do/' + encodeURIComponent(c.id), open: true }))) }, o));
  let FrameM = null;
  const withFrame = () => FrameM ? Promise.resolve(FrameM) : import('./frame.js').then(m => (FrameM = m));
  let turnT = 0;   /* a move along is spent by the next route, or forgotten when it changed nothing */
  /* around a level (docs/INTERACTION.md, "An open world"): the levels on either side, and the same level seen at
     other stages of a chip's life (as designed, as made, in use), all as one row of ways, none of them "next" */
  const elsewhere = () => { const W = Way.whereOf(location.hash); return Way.STAGES.filter(st => st !== W.stage && Way.holds(W, st)).map(st => '<a class="chipb else" href="' + esc(Way.alongTo(W, st)) + '">' + esc(t('around.as.' + st)) + '</a>').join(''); };
  const aroundRow = (...ways) => '<span class="kicker">' + esc(t('around.k')) + '</span><span class="chips">' + ways.filter(Boolean).join('') + elsewhere() + '</span>';
  const lineHtml = (kicker, line, key, nav) => '<p class="kicker">' + esc(kicker) + '</p><p class="line">' + esc(line) + '</p>' +
    (key ? '<a class="askline" href="' + esc(follow(key)) + '"><span class="q">' + esc(t('stop.' + key + '.q')) + '</span></a>' : '') + '<div class="nav">' + nav + '</div>';

  /* ---- a place flown through: the data centre ---- */
  const pui = $('placeui');
  const DC_DEPTH = { campus: 'building', hall: 'building', rack: 'rack', server: 'rack', board: 'board', chip: 'chip' };
  let dcFrame = null, dcLv = 0;
  function placeUI(lv) {
    dcLv = lv; const id = LEVELS[lv];
    if (!dcFrame) return;
    dcFrame.rail(id, lv / (LEVELS.length - 1)); dcFrame.level(DC_DEPTH[id]); here();
    if (dcFrame.mode() === 'look') drawDc();
  }
  function drawDc() {
    const id = LEVELS[dcLv], last = dcLv === LEVELS.length - 1;
    /* what you see here: every part named on the picture at this level, and what it does; pointing at one lights it */
    const here = dc ? dc.parts(dcLv) : [], PF = VIEW_PARTS.flight;
    const hereHtml = here.length ? '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2">' + here.map(k => '<li><button type="button" data-hl="' + k + '"><b>' + esc(t('part.' + PF[k])) + '</b><span>' + esc(t('what.' + PF[k])) + '</span></button></li>').join('') + '</ul></div>' : '';
    dcFrame.dock.innerHTML = lineHtml(t('place.dc.' + id + '.t'), t('place.dc.' + id + '.d'), ASKS[id], aroundRow(
      dcLv ? '<button type="button" class="chipb" data-key="back" data-lvgo="' + (dcLv - 1) + '">↑ ' + esc(t('place.dc.' + LEVELS[dcLv - 1] + '.t')) + '</button>' : '',
      last ? '<a class="chipb" data-key="next" data-in href="#/dive/chip">↓ ' + esc(t('place.next')) + '</a>' : '<button type="button" class="chipb" data-key="next" data-in data-lvgo="' + (dcLv + 1) + '">↓ ' + esc(t('place.dc.' + LEVELS[dcLv + 1] + '.t')) + '</button>',
      id === 'board' ? '<a class="chipb" href="#/board">' + esc(t('board.enter')) + '</a>' : '')).replace('<div class="nav">', hereHtml + '<div class="nav">');
  }
  function showPlace(id, lv) {
    hideAll();
    $('placeCanvas').hidden = $('placeLabels').hidden = false; pui.hidden = false; showStage(true); document.body.classList.add('immersive');
    loading(true); lastPlace = id;
    return Promise.all([withFrame(), ensureDc()]).then(([, d]) => {
      dcFrame = frameOf(pui, { up: { href: '#/', label: t('place.back') }, path: [{ href: '#/', label: t('place.back') }, { label: t('map.' + id + '.t') }],
        rail: { label: t('place.levels'), items: LEVELS.map(k => ({ id: k, label: t('place.dc.' + k + '.t') })) }, onRail: k => d.go(LEVELS.indexOf(k)), onLook: drawDc, scroll: true });
      pui.onclick = e => { const b = e.target.closest('[data-lvgo]'); if (b) d.go(+b.dataset.lvgo); const h = e.target.closest('[data-hl]'); if (h) d.mark(h.dataset.hl); };
      pui.onpointerover = e => { const h = e.target.closest('[data-hl]'); d.mark(h ? h.dataset.hl : null); };
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
    chipFrame.level(ROWS[chipRow].dive); here();
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
      (done ? '<a class="btn primary" data-key="next" href="' + (build ? '#/place/port' : '#/') + '">' + esc(t(build ? 'chipx.ship' : 'chipx.back')) + '</a>' : '<button type="button" class="btn primary" data-key="next"' + (build ? '' : ' data-in data-inname="' + esc(t('depth.' + ROWS[nextR].dive + '.name')) + '"') + ' data-rowgo="' + nextR + '">' + esc(t(build ? 'chipx.next' : 'chipx.deeper')) + '</button>')).replace('<div class="nav">', yours + '<div class="nav">');
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
        rail: { label: t('place.levels'), items: ROWS.map(x => ({ id: x.dive, label: t('depth.' + x.dive + '.name') })) },
        onRail: d => c.go(ROWS.findIndex(x => x.dive === d)), onLook: drawChip });
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
  let partsAt = null;   /* the parts each level's scene draws (src/app/scenes.js), for what you see here */
  let flatKind = 'dive', diveFrame = null, diveD = -1, divePart = null, diveThread = null, benchCh = null, WE = null, DiveData = null, DS = null;
  const levelsOf = k => FL(k).levels || DiveData.WORLDS.find(w => w.id === FL(k).world).depths;
  const diveId = () => WE.IDS[diveD];
  const ensureDive = () => dive ? Promise.resolve(dive) : Promise.all([import('../engines/weave.js'), import('../app/world.js'), import('../data/weave.js'), import('../app/design.js'), import('../app/journey.js'), import('./overlay.js'), import('../app/scenes.js')]).then(([E, Wm, Wd, Ds, Jm, Om, Sc]) => {
    WE = E; DiveData = Wd; DS = Ds; threadColorOf = Wm.threadColor; partsAt = Sc.partsOf;
    /* the dive's words in HTML over the picture: names, the note on a picked part, the questions' marks under Ask */
    flatWords = Om.createOverlay($('flatLabels'), { part: key => pickPart(key), mark: th => { location.hash = follow(th + '.' + diveId()); }, marks: ths => markAsk(ths), door: () => dive.flyTo(diveD + 1) });
    /* a wheel over one of those words still moves the dive (as over the 3D levels' names, level3d.js) */
    $('flatLabels').addEventListener('wheel', e => { e.preventDefault(); $('diveCanvas').dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, bubbles: true, cancelable: true })); }, { passive: false });
    /* one HUD: the earlier site's own marks, dive label and band give way to the frame */
    /* one stage: the line's machines draw on the shared renderer too */
    Wm.setChrome({ dots: false, dive: false, lit: true, keys: () => (flatKind === 'dive' ? 'scale' : 'steps'), stage: () => stage($('diveCanvas')), overlay: flatWords,
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
    const L = levelsOf(flatKind); diveFrame.rail(id, L.indexOf(id) / (L.length - 1)); diveFrame.level(id); diveNotes(); here();
    if (diveFrame.mode() === 'look' && !benchCh) drawDive();
  }
  /* words on the picture: the note on the part you picked, from its one home in the atlas. A note opens only on a
     part you pick, flat or in 3D; until then the picture and its names explain themselves */
  function diveNotes() {
    const id = diveId(), key = divePart;
    Object.entries(L3).forEach(([lv, l]) => { const w = key && diveWord(lv, key); if (l.obj) l.obj.select(id === lv && key ? key : null, w && EN_HAS(w) ? { title: t('part.' + w), text: t('what.' + w) } : null); });
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
  /* the join's windows and switch, loaded with the first level in 3D */
  let L3M = null, JOIN = { from: 0.08, to: 0.92, lead: 0.5 };
  Promise.all([import('./level3d.js'), import('../engines/join.js')]).then(([m, j]) => { L3M = m; JOIN = j.JOIN; }).catch(() => { /* no joins: the flat picture between levels, as before */ });
  const ensureL3 = lv => { const l = L3[lv]; return l.making || (l.making = import(l.mod).then(m => (l.obj = (l.arg ? m.create(l.arg) : m.create)($('diveCanvas'), l3Host(lv), { part: key => pickPart(key),
    marks: () => (diveFrame && diveFrame.mode() === 'ask' ? askMarks(lv) : null), mark: th => { location.hash = follow(th + '.' + lv); }, askMany: ths => markAsk(ths),
    /* too slow even at low settings: this level is drawn flat for the rest of the visit */
    failed: () => { if (dive) levelZoom(dive.z); } }))).catch(() => null)); };
  /* the questions at a level, grouped by the part each is about (the first of its parts): the marks under Ask */
  const askMarks = id => { const by = new Map(); DiveData.THREADS.forEach(th => { const nm = DiveData.STOPS[th.id + '.' + id], key = nm && nm[0]; if (!key) return; if (!by.has(key)) by.set(key, []); by.get(key).push({ id: th.id, color: threadColorOf(th.id) }); }); return [...by].map(([part, threads]) => ({ part, threads })); };
  let threadColorOf = () => '';
  const hideL3 = () => { Object.values(L3).forEach(l => { if (l.obj) l.obj.show(0); }); $('diveCanvas').style.opacity = ''; $('flatLabels').style.visibility = ''; if (dive) dive.setCovered(false); };
  /* a join (docs/reviews/transitions.md): between two neighbouring levels in 3D, both drawn in one frame on one camera
     path, so no flat picture shows between. Only when both models are made, neither failed, the parent has a door and
     the child a foot, joins are not off for slowness, and the move did not begin without them; else, as before */
  let unjoined = false;
  const joinOf = z => {
    const i = Math.floor(z), f = z - i, a = L3[WE.IDS[i]], b = L3[WE.IDS[i + 1]];
    if (Math.abs(z - Math.round(z)) < JOIN.from) unjoined = false;
    if (!(f > JOIN.from && f < JOIN.to)) return null;
    const ok = a && b && a.obj && b.obj && !a.obj.failed && !b.obj.failed && a.obj.door && b.obj.foot && !L3M.JOINS.off;
    if (!ok) { unjoined = true; return null; }
    return unjoined ? null : { a, b, f };
  };
  /* the square a level fills: at rest the dive's own; coming down into it from a level not joined to it (a diagram kept
     flat, the car or the scanner, or any pair when joins are off), the square where the flat drawing has it now, inside
     the portal, so the model and the drawing lie on each other while they mix (exact: no zoom factor of its own) */
  const squareOf = (ds, z) => {
    const b = dive.frame, F = WE.frames(z, b.B, b.cx, b.cy);
    if (F.i !== ds - 1 || !F.next || F.f <= 0) return b;
    const S = 1000 * F.next.s; return { B: S, cx: F.next.tx + S / 2, cy: F.next.ty + S / 2, exact: true };
  };
  /* a jump (one call moving the zoom half a level or more: reduced motion, or a link to another level) is never a
     cut on the stage: the picture dips to the page's ground in 100 ms, the level changes at the bottom of the dip,
     and it comes back in 100 ms. Not into a join, which is a picture of its own */
  let lastZ = null, dip = 0;
  const undip = () => { clearTimeout(dip); dip = 0; const cv = document.querySelector('.stage3d'); if (cv) cv.classList.remove('dipout', 'dipin'); };
  function levelZoom(z) {
    if (!dive || !WE || flatKind !== 'dive' || $('diveCanvas').hidden) { lastZ = null; undip(); hideL3(); return; }
    const was = lastZ; lastZ = z;
    if (dip) return;   /* in the dip the old picture holds; the new one comes at its bottom */
    const cv = document.querySelector('.stage3d');
    if (was != null && Math.abs(z - was) >= 0.5 && cv && !cv.hidden && !(L3M && joinOf(z))) {
      cv.classList.add('dipout');
      dip = setTimeout(() => { dip = 0; cv.classList.remove('dipout'); cv.classList.add('dipin'); levelZoom(dive.z); setTimeout(() => cv.classList.remove('dipin'), 120); }, 100);
      return;
    }
    const J = L3M && joinOf(z);
    if (J) {
      Object.values(L3).forEach(l => { if (l.obj && l !== J.a && l !== J.b) l.obj.show(0); });
      /* a hidden level is still told where the zoom is (above it or below), so coming back to it is never taken
         for an arrival from above */
      if (J.f < JOIN.lead) { J.b.obj.show(0, J.f - 1); J.a.obj.show(1, J.f, dive.frame, { guest: J.b.obj }); }
      else { J.a.obj.show(0, J.f); J.b.obj.show(1, J.f - 1, dive.frame, { host: J.a.obj }); }
      $('diveCanvas').style.opacity = '0'; dive.setCovered(true); $('flatLabels').style.visibility = 'hidden'; showStage(true);
      return;
    }
    let top = 0;
    Object.entries(L3).forEach(([lv, l]) => {
      const ds = WE.IDS.indexOf(lv), d = z - ds, k = ds < 0 ? 0 : 1 - Math.min(1, Math.max(0, (Math.abs(d) - 0.08) / 0.32));
      if (k <= 0) { if (l.obj) l.obj.show(0, ds < 0 ? 0 : d); return; }
      if (!l.obj) { ensureL3(lv).then(o => { if (o && flatKind === 'dive') { levelZoom(dive.z); diveNotes(); } }); return; }
      if (l.obj.failed) { l.obj.show(0); return; }
      l.obj.show(k, d, squareOf(ds, z), null); top = Math.max(top, k);
      /* at a level, its neighbours are made and their shaders compiled, so a move to them can be joined */
      if (k >= 1 && !l.near) { l.near = true; [-1, 1].forEach(n => { const nb = WE.IDS[WE.IDS.indexOf(lv) + n]; if (L3[nb]) ensureL3(nb).then(o => { if (o && o.warm) o.warm(); }); }); }
    });
    /* the flat picture and its words give way to the model; the stage shows while one is there */
    $('diveCanvas').style.opacity = String(1 - top); dive.setCovered(top >= 0.999);
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
    const end = { dive: '<a class="chipb" href="#/">' + esc(t('chipx.back')) + '</a>', line: '<a class="chipb" href="#/place/port">' + esc(t('line.end')) + '</a>', bench: '<a class="chipb" href="#/line/print">' + esc(t('bench.toFab')) + '</a>' }[flatKind];
    /* a dive goes up and down; the line and the studio go earlier and later in the work */
    const [ar0, ar1] = flatKind === 'dive' ? ['↑ ', '↓ '] : ['← ', '→ '], nm = d => t('depth.' + d + '.name');
    /* what you see here: the parts the level draws, each with what it does; choosing one picks it on the picture */
    const pk = flatKind === 'dive' && partsAt ? Object.keys(partsAt(id) || {}).filter(k => EN_HAS(DiveData.partWord(id, k)) && t('what.' + DiveData.partWord(id, k)) !== 'what.' + DiveData.partWord(id, k)) : [];
    const hereHtml = pk.length ? '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2">' + pk.map(k => { const w = DiveData.partWord(id, k); return '<li><button type="button" data-pick="' + esc(k) + '"' + (k === divePart ? ' class="on"' : '') + '><b>' + esc(t('part.' + w)) + '</b><span>' + esc(t('what.' + w)) + '</span></button></li>'; }).join('') + '</ul></div>' : '';
    diveFrame.dock.innerHTML = lineHtml(t('around.view.' + flatKind) + ' · ' + t('depth.' + id + '.name'), t('depth.' + id + '.see'), key, aroundRow(
      i ? '<button type="button" class="chipb" data-key="back" data-divego="' + (diveD - 1) + '">' + ar0 + esc(nm(L[i - 1])) + '</button>' : flatKind === 'dive' && diveWorld === 'datacentre' ? '<button type="button" class="chipb" data-key="back" data-divego="' + (diveD - 1) + '">' + esc(t('dive.up')) + '</button>' : '',
      last ? end : '<button type="button" class="chipb" data-key="next"' + (flatKind === 'dive' ? ' data-in' : '') + ' data-divego="' + (diveD + 1) + '">' + ar1 + esc(nm(L[i + 1])) + '</button>')).replace('<div class="nav">', yours + '<p class="small muted hintline">' + esc(t(F.hint)) + '</p>' + hereHtml + '<div class="nav">');
    requestAnimationFrame(diveInset);
  }
  /* keep the picture clear of the frame: the rail on the left, the corner, the dock below */
  const diveInset = () => { if (!dive || !diveFrame) return; const wide = innerWidth > 720, b = innerWidth >= 1100 ? 24 : diveFrame.dock.parentNode.offsetHeight + (wide ? 24 : 18); dive.setInset({ l: wide ? 90 : 8, r: wide ? 20 : 8, t: wide ? 122 : 116, b }); };
  /* the bench: a design challenge played in the dock; the drawings above follow your description */
  const syncDesign = ch => { if (DS && ch && ch.kind === 'design') DS.setDesign(Game.checkDesign(ch.p, S.codes[ch.p] || Game.starter(ch.p)));
    /* an evolved circuit for a job the studio knows is drawn there too, gate by gate and wave by wave */
    else if (DS && ch && ch.kind === 'evolve' && S.evolve && S.evolve.code && Game.hasProject(S.evolve.job)) DS.setDesign(Game.checkDesign(S.evolve.job, S.evolve.code)); };
  function openBench(ch) {
    benchCh = ch; const dock = diveFrame.dock; dock.classList.add('benchdock'); syncDesign(ch); diveFrame.doing();
    play(dock, ch, { state: S, startChip: () => Object.assign({}, Game.START),
      save: () => { save(); syncDesign(ch); }, kept,
      open: c => { location.hash = doHref(c); },
      back: () => diveFrame.look(),
      /* won: the island grows, and the drawings fly to your gates */
      done: c => { won(c); if (flatKind === 'bench') dive.flyTo(WE.IDS.indexOf('gates')); } });
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
        rail: { label: t('place.levels'), items: L.map(k => ({ id: k, label: t('depth.' + k + '.name') })) },
        onRail: k => w.flyTo(WE.IDS.indexOf(k)), onLook: () => { if (benchCh) { benchCh = null; const dk = diveFrame.dock; dk.classList.remove('benchdock'); dk.onclick = null; dk.oninput = null; } drawDive(); } }); watchDock();
      vui.onclick = e => { const b = e.target.closest('[data-divego]'); if (b) w.flyTo(+b.dataset.divego); const pk = e.target.closest('[data-pick]'); if (pk) { pickPart(pk.dataset.pick === divePart ? null : pk.dataset.pick); vui.querySelectorAll('[data-pick]').forEach(x => x.classList.toggle('on', x.dataset.pick === divePart)); } };
      const d = WE.IDS.indexOf(L.includes(depth) ? depth : L[0]);
      loading(false); w.start(); w.setZ(d); if (arriving && kind === 'line') w.arrive(); arriving = false; diveD = -1; diveAt(d); $('diveCanvas').focus({ preventScroll: true });
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
      (i < n - 1 ? '<button type="button" class="btn primary" data-key="next" data-supstep="' + (i + 1) + '">' + esc(t('line.next')) + '</button>' : '<a class="btn primary" href="#/place/' + (SUP.back || 'port') + '">' + esc(t('chipx.back')) + '</a>') + '</div>';
    diveFrame.dock.innerHTML = h; diveFrame.dock.classList.add('supdock'); requestAnimationFrame(diveInset);
  }
  function showSupply(world) {
    hideAll(); document.body.classList.add('immersive'); flatKind = 'supply'; benchCh = null;
    /* the world map is entered from the port, or from the island whose machines or materials it follows: going out
       comes back to where you came in */
    const back = ['tools', 'materials'].includes(enteredFrom) ? enteredFrom : 'port'; enteredFrom = null;
    $('diveCanvas').hidden = false; vui.hidden = false; loading(true); lastPlace = back;
    return Promise.all([withFrame(), ensureDive(), import('../data/world.js'), import('../engines/supply.js')]).then(([, w, Wd, Sp]) => {
      Wdata = Wd; Sup = Sp; WE.setWorld('journey'); DS.setBandCaption(false);
      const wd = Wdata.ROUTES[world] ? world : (SUP && SUP.world) || 'datacentre';
      SUP = { world: wd, step: 0, site: null, closed: [], back };
      const r = Wdata.ROUTES[wd];
      diveFrame = frameOf(vui, { up: { href: '#/place/' + back, label: t('map.' + back + '.t') }, path: [{ href: '#/', label: t('place.back') }, { href: '#/place/' + back, label: t('map.' + back + '.t') }, { label: t('page.ecosystem.map') }],
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
        rail: { label: t('place.levels'), items: LEVELS.map(k => ({ id: k, label: t('place.dc.' + k + '.t') })) },
        onRail: k => { location.hash = k === 'chip' ? '#/chip/0' : k === 'board' ? '#/board' : '#/place/datacentre/' + LEVELS.indexOf(k); }, onLook: () => story && story.go(story.at) });
      fr.rail('board', LEVELS.indexOf('board') / (LEVELS.length - 1)); fr.level('board');
      story = St.createStory(fr.dock, b, data, { follow, step: st => fr.goal(st.live ? '<p class="kicker">' + esc(t('board.goal')) + '</p>' + data.gauges(data.state).map(x => '<div class="gauge' + (x.warm ? ' warmg' : ' ok') + '"><span class="gl">' + esc(t('board.gauge.' + x.id)) + '</span><span class="gv">' + esc(x.text) + '</span><span class="gbar"><span style="width:' + Math.round(x.v * 100) + '%"></span></span></div>').join('') : null) });
      $('boardCanvas').focus({ preventScroll: true });
    });
  }
  let story = null, boardFrame = null;
  /* every view hides the others first */
  function hideAll() {
    $('diveCanvas').hidden = true; vui.hidden = true; dive && dive.stop(); hide3d(); $('flatLabels').hidden = true; if (flatWords) flatWords.clear();
    hideBoard(); $('hero').hidden = true; $('outbtn').hidden = true; lensbar.hidden = true; closeSheet(); pui.hidden = true; cui.hidden = true; dc && dc.pause(); map && map.pause(); chip && chip.pause();
    ['mapCanvas', 'mapLabels', 'placeCanvas', 'placeLabels', 'chipCanvas', 'chipLabels'].forEach(k => { $(k).hidden = true; });
    document.body.classList.remove('immersive'); page.hidden = true; hideL3(); showStage(false);
  }
  function showMap(from) {
    $('diveCanvas').hidden = true; vui.hidden = true; dive && dive.stop(); hide3d(); $('flatLabels').hidden = true; if (flatWords) flatWords.clear();
    hideBoard(); document.body.classList.remove('immersive');
    $('chipCanvas').hidden = $('chipLabels').hidden = true; cui.hidden = true; chip && chip.pause();
    $('placeCanvas').hidden = $('placeLabels').hidden = true; pui.hidden = true; dc && dc.pause();
    $('mapCanvas').hidden = $('mapLabels').hidden = false; $('hero').hidden = false; $('outbtn').hidden = false; lensbar.hidden = false; showStage(true);
    const part = from && ['line', 'bench'].includes(flatKind) && WE && isPart(lastPlace, diveId()) ? diveId() : null;
    loading(!map); return ensureMap().then(m => { if (from && lastPlace) { m.from(lastPlace, part); if (!part) m.focus(lastPlace); } m.resume(); return m; });
  }

  /* ---- the pages ---- */
  const page = $('page');
  let pageNow = 'build';
  /* ---- the Lab's inside (docs/reviews/structure.md, stage 3): the commons as levels, in the Lab's own card with the
     island behind it. The computer, then a piece of it, then the designs for that piece, each an entry of the ledger;
     and beside the computer, the record, who is here, and who makes what. There is no Build page. ---- */
  const LAB_STEPS = ['computer', 'record', 'society', 'mix'];
  function labParts() {
    const C = Game.community(S), P = {};
      /* the commons: the computer and whose pieces are inside it, what is open now, the record, and who makes what */
      const W = C.W, whose = id => { const d = W.inside[id] && W.byId[W.inside[id]]; return d ? ' <span class="who">' + esc(d.by) + '</span>' : ''; };
      const tree = id => { const st = C.state[id], kids = childrenOf(id); return '<ul class="tree"><li><button type="button" data-piece="' + id + '" class="node ' + st.state + (st.yours ? ' yours' : '') + '">' + esc(t('build.need.' + id + '.t')) + (st.n ? ' ×' + st.n : '') + whose(id) + '</button>' + kids.map(c => tree(c.id)).join('') + '</li></ul>'; };
      P.computer = '<div class="plan2"><div class="tower" aria-hidden="true">' + islandState().floors.slice().reverse().map(f => '<span class="fl ' + f + '"></span>').join('') + '</div><div><p class="big">' + esc(t('page.build.progress', { built: C.built, total: C.total })) + '</p><p class="small muted">' + esc(t('page.build.legend')) + '</p>' + tree('computer') + '</div></div>';
      P.open = '<h2>' + esc(t('page.build.open')) + '</h2><p class="small muted">' + esc(t('page.build.openD')) + '</p><div class="grid">' + C.asks.map(a => '<a class="chcard job" href="' + esc(a.under ? follow(a.under) : '#/questions') + '"><span class="st">?</span><span><span class="kicker">' + esc(t('page.build.askK', { by: a.by, n: a.work })) + '</span><b>' + esc(a.words) + '</b></span></a>').join('') + C.breaks.map(b => chCard(chOf('break:' + b.of))).join('') + C.jobs.map(jobCard).join('') +
        C.engines.map(e => '<a class="chcard engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + e.need + '.t') }) })) + '"><span class="st">⚙</span><span><b>' + esc(t('build.need.' + e.need + '.t')) + '</b><span class="small">' + esc(t('game.engineWanted')) + '</span></span></a>').join('') + '</div>';
      /* the lab broken by the people using it: every open report, loudest first, each a link to where it was seen */
      const reps = Game.frontierOf(S).filter(f => f.kind === 'report');
      if (reps.length) P.open += '<h2>' + esc(t('lab.reports')) + '</h2><p class="small muted">' + esc(t('lab.reportsD')) + '</p><div class="grid">' + reps.map(f => { const e = W.byId[f.of]; return '<a class="chcard report' + (e.draft ? ' draft' : '') + '" href="' + esc(e.at) + '"><span class="st">⚑</span><span><span class="kicker">' + esc(t('report.say.' + e.say)) + ' · ' + esc(e.at) + '</span><b>' + esc(e.words) + '</b><span class="small muted">' + byLine(e) + '</span></span></a>'; }).join('') + '</div>';
      /* the record: every entry, the newest first, each with who made it and where it stands now */
      const line = e => { const T = e.kind === 'break' ? W.byId[e.of] : null, T2 = e.kind === 'try' ? W.byId[e.of] : null, what = e.kind === 'design' ? t('ledger.rec.design', { title: e.title, piece: t('build.need.' + e.piece + '.t') }) : e.kind === 'break' ? t('ledger.rec.break', { title: T.title }) : T2 ? t('ledger.rec.try', { title: T2.title, n: e.facts.cases }) : e.kind === 'report' || e.kind === 'fix' ? Game.entryWords(e, S) : e.q,
          links = (e.from ? ' · ' + esc(t('ledger.rec.from', { who: W.byId[e.from].by })) + ' ' + esc(W.byId[e.from].title) : '') + (e.tries && e.tries.length ? ' · ' + esc(t('ledger.tries', { n: e.tries.length })) : '') + (e.about ? ' · ' + esc(t('ledger.rec.about', { q: Game.aboutWords(e.about, W) })) : '');
        return '<li class="rec ' + e.kind + (e.draft ? ' draft' : '') + ' ' + e.state + '"><span class="made ' + esc(e.made) + '"></span><span><b>' + esc(what) + '</b><span class="small muted"> · ' + byLine(e) + ' · ' + esc(e.id.slice(0, 10)) + ' · ' + esc(t('ledger.state.' + (e.draft ? 'draft' : e.state))) + (e.brokenBy ? ' · ' + esc(t('ledger.brokenBy', { who: W.byId[e.brokenBy].by })) : '') + links + '</span>' + (e.draft ? slipHtml(S, e.id) : '') + '</span></li>'; };
      P.record = '<h2>' + esc(t('page.build.record')) + '</h2><p class="small muted">' + esc(t('page.build.recordD')) + '</p><ol class="record">' + W.entries.slice().reverse().map(line).join('') + '</ol>';
      /* the society: every maker and what their entries add up to. Roles are read, not given. */
      const SO = Game.societyOf(W), list = a => a.map(esc).join(', ');
      P.society = '<h2>' + esc(t('page.build.society')) + '</h2><p class="small muted">' + esc(t('page.build.societyD')) + '</p><ul class="record society">' + SO.map(m => '<li class="rec"><span class="made ' + esc(m.made[0]) + '"></span><span><b>' + esc(m.by) + '</b><span class="small muted"> · ' + m.made.map(k => esc(t('build.kind.' + k))).join(', ') + '</span><br><span class="small">' +
        ['design', 'break', 'try', 'question', 'report', 'fix'].filter(k => m.does[k]).map(k => esc(t('society.does.' + k, { n: m.does[k] }))).concat(m.checked.length ? [esc(t('society.checked', { who: '' })) + list(m.checked)] : [], m.checkedBy.length ? [esc(t('society.checkedBy', { who: '' })) + list(m.checkedBy)] : [], m.builtOn.length ? [esc(t('society.builtOn', { who: '' })) + list(m.builtOn)] : []).join(' · ') + '</span></span></li>').join('') + '</ul>' +
        (SO.some(m => m.made.includes('person') || m.made.includes('both')) ? '' : '<p class="small hint">' + esc(t('page.build.empty')) + '</p>');
      /* who makes what: one bar per kind of entry, split by who made it, as each entry says */
      const kinds = ['design', 'break', 'try', 'question', 'report', 'fix'].filter((k, i) => i < 4 || W.mix[k]), made = ['person', 'both', 'ai', 'program', 'example'];
      P.mix = '<h2>' + esc(t('page.build.mix')) + '</h2><p class="small muted">' + esc(t('page.build.mixD')) + '</p><div class="mix">' + kinds.map(kd => { const M = W.mix[kd] || {}, n = made.reduce((a, m) => a + (M[m] || 0), 0);
        return '<div class="mixrow"><span class="ml">' + esc(t('ledger.kind.' + kd)) + '</span><span class="mbar">' + (n ? made.filter(m => M[m]).map(m => '<span class="made ' + m + '" style="flex:' + M[m] + '" title="' + esc(t('build.kind.' + m)) + ': ' + M[m] + '">' + M[m] + '</span>').join('') : '<span class="none">' + esc(t('page.build.mixNone')) + '</span>') + '</span></div>'; }).join('') +
        '<p class="legend small muted">' + made.map(m => '<span><span class="made ' + m + '"></span>' + esc(t('build.kind.' + m)) + '</span>').join('') + '</p></div>';
      P.how = '<h2>' + esc(t('page.build.how')) + '</h2><div class="cards"><a class="card2" href="#/bench/need"><b>' + esc(t('page.build.studio')) + '</b><span>' + esc(t('page.build.studioD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/blob/main/docs/MCP.md') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.port')) + '</b><span>' + esc(t('page.build.portD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/blob/main/docs/MCP.md#run-an-agent-of-your-own') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.agent')) + '</b><span>' + esc(t('page.build.agentD')) + '</span></a>' +
        '<a class="card2" href="' + esc(REPO + '/issues/new?template=need.yml') + '" target="_blank" rel="noopener"><b>' + esc(t('page.build.join')) + '</b><span>' + esc(t('page.build.joinD')) + '</span></a></div>';
    return P;
  }
  function labInside() {
    const C = Game.community(S), step = LAB_STEPS.includes(cur.step) ? cur.step : 'computer', i = LAB_STEPS.indexOf(step);
    const head = '<div class="labsteps" role="tablist">' + LAB_STEPS.map(k => '<button type="button" role="tab" data-labstep="' + k + '" aria-selected="' + (k === step && !cur.piece) + '">' + esc(t('lab.step.' + k)) + '</button>').join('') + '</div>';
    if (cur.piece && C.state[cur.piece]) { const id = cur.piece, st = C.state[id], ds = C.designs.filter(d => d.need === id), job = C.jobs.find(j => j.need === id), kids = childrenOf(id);
      return head + '<p class="kicker">' + esc(t('lab.pieceK', { state: t('lab.state.' + st.state) })) + '</p><h3>' + esc(t('build.need.' + id + '.t')) + (st.n ? ' ×' + st.n : '') + '</h3><p class="small">' + esc(t('build.need.' + id + '.d')) + '</p>' +
        (kids.length ? '<p class="kicker">' + esc(t('lab.madeOf')) + '</p><div class="chips">' + kids.map(c => '<button type="button" class="chipb" data-piece="' + c.id + '">' + esc(t('build.need.' + c.id + '.t')) + '</button>').join('') + '</div>' : '') +
        (ds.length ? '<p class="kicker">' + esc(t('lab.designs', { n: ds.length })) + '</p>' + ds.map(designCard).join('') : '') + (job ? jobCard(job) : '') +
        '<div class="nav"><button type="button" class="btn ghost" data-key="back" data-labstep="computer">' + esc(t('lab.step.computer')) + '</button><span></span></div>'; }
    const P = labParts();
    return head + (step === 'computer' ? '<p class="small muted">' + esc(t('page.build.lead')) + '</p>' + P.computer + P.open : step === 'mix' ? P.mix + P.how : P[step]) +
      '<div class="nav">' + (i ? '<button type="button" class="btn ghost" data-key="back" data-labstep="' + LAB_STEPS[i - 1] + '">' + esc(t('story.back')) + '</button>' : '<button type="button" class="btn ghost" data-key="back" data-labstep="">' + esc(t('map.lab.t')) + '</button>') +
      (LAB_STEPS[i + 1] ? '<button type="button" class="btn primary" data-key="next" data-labstep="' + LAB_STEPS[i + 1] + '">' + esc(t('lab.step.' + LAB_STEPS[i + 1])) + '</button>' : '<a class="btn primary" data-key="next" href="#/place/studio">' + esc(t('loop.next', { place: t('map.studio.t') })) + '</a>') + '</div>';
  }
  /* two reading views, opened on purpose: your log (the questions you met, what you did, what waits: the loop's
     challenges are kept here, never as a menu of their own) and the Lab's record (the commons, at the place where
     the loop starts and comes back) */
  function showPage(k0) {
    const k = 'log'; pageNow = k0;
    let h = '<div class="inner"><a class="x pagex" href="' + '#/' + '" aria-label="' + esc(t('sheet.close')) + '">×</a><p class="kicker">' + esc(t('loop.logK')) + '</p><h1>' + esc(t('loop.log')) + '</h1><p class="lead">' + esc(t('page.' + k + '.lead')) + '</p>', hc = '';
    const C = Game.community(S);
    if (k === 'log') {
      const nx = Game.next(S);
      h += '<div class="jump"><input type="search" data-jump autocomplete="off" placeholder="' + esc(t('jump.ph')) + '" aria-label="' + esc(t('jump.ph')) + '"><div class="jumpres" data-jumpres></div></div>';
      if (nx) h += '<section class="stepsec"><h2>' + esc(t('loop.nextUp')) + '</h2><div class="grid">' + chCard(nx) + '</div></section>';
      hc += '<h2 id="log-challenges">' + esc(t('nav.challenges')) + '</h2><p class="small muted">' + esc(t(nx ? 'page.challenges.lead' : 'game.allDone')) + '</p>' + Game.STEPS.map((s, i) => { const st = Game.stepState(S, s); return '<section class="stepsec"><h2><span class="num">' + (i + 1) + '</span>' + esc(t('game.step.' + s)) + ' <span class="small muted">' + esc(t('map.' + Game.STATION[s] + '.t')) + ' · ' + st.done + '/' + st.total + '</span></h2><div class="grid">' + Game.stepChallenges(s).map(chCard).join('') + '</div></section>'; }).join('');
      hc += '<section class="stepsec"><h2><span class="num">⚙</span>' + esc(t('game.jobs')) + ' <span class="small muted">' + esc(t('game.jobsD')) + '</span></h2><div class="grid">' + C.breaks.map(b => chCard(chOf('break:' + b.of))).join('') + C.jobs.map(jobCard).join('') + '</div></section>';
      /* never a list of every question: the ones you have met, as strands you can pick up again, one way to meet
         the next, and the ones you asked yourself. Only the strand you followed last shows what lies underneath. */
      const strands = Object.keys(S.met).filter(th => THREADS.some(x => x.id === th) && S.met[th].some(d => Game.trail(th).includes(d))), last = strands[strands.length - 1];
      if (strands.length) h += '<section class="stepsec"><h2>' + esc(t('page.questions.met')) + '</h2>' + strands.slice().reverse().map(th => { const ds = S.met[th].filter(d => Game.trail(th).includes(d)), d = ds[ds.length - 1], key = th + '.' + d;
        return '<div class="strand" style="--qc:' + qColor(key) + '"><a class="q" href="' + esc(follow(key)) + '">' + esc(t('stop.' + key + '.q')) + '</a><div class="chips">' + ds.map(x => '<a class="chipb" href="' + esc(follow(th + '.' + x)) + '">' + esc(t('depth.' + x + '.name')) + '</a>').join('') + '</div>' +
          (th === last && rootShown(S.met[th], Game.didOn(S, th)) ? '<p class="small muted">' + esc(t('ui.rootOf')) + ' <em class="rootq">' + esc(t('thread.' + th + '.root')) + '</em></p>' : '') + '</div>'; }).join('') + '</section>';
      const bk = Game.BEACON[Game.STATION[Game.chipAt(S)]];
      h += '<section class="stepsec"><h2>' + esc(t(strands.length ? 'page.questions.next' : 'page.questions.first')) + '</h2><p class="small muted">' + esc(t('page.questions.where')) + '</p><div class="qgrid">' +
        '<a class="qcard" href="' + esc(followW(bk)) + '" style="--qc:' + qColor(bk) + '"><span class="kicker">' + esc(t('map.' + Game.STATION[Game.chipAt(S)] + '.t')) + '</span><span class="q">' + esc(t('stop.' + bk + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a></div></section>';
      const asked = C.W.entries.filter(e => e.kind === 'question');
      h += '<section class="stepsec"><h2>' + esc(t('page.questions.asked')) + '</h2>' + (asked.length ? asked.slice().reverse().map(askedHtml).join('') : '<p class="small muted">' + esc(t('page.questions.none')) + '</p>') + '</section>' + hc;
    }
    page.innerHTML = h + '<p class="small muted">' + esc(t('page.preview')) + '</p></div>'; page.hidden = false; page.scrollTop = 0;
    if (k0 === 'challenges') { const el = $('log-challenges'); if (el) page.scrollTop = el.offsetTop - 16; }
  }
  /* reading: every experiment as a document (src/v2/read.js), over the island; the index is the questions and
     challenges there are, by what can be done with them now */
  function showRead(id) {
    if (!FACT) { facts().then(() => { if (partsOf(location.hash)[0] === 'read') showRead(id); }); return; }
    const ctx = { S, FACT, titleOf, chOf, didOn: Game.didOn };
    page.innerHTML = '<div class="inner"><a class="x pagex" href="#/" aria-label="' + esc(t('sheet.close')) + '">×</a>' + (id ? Read.experimentHtml(id, ctx) : Read.indexHtml()) + '</div>';
    page.classList.add('reading'); page.hidden = false; page.scrollTop = 0;
  }
  page.addEventListener('input', e => { const f = e.target.closest('[data-readfind]'); if (f) Read.filterIndex(page, f.value); if (e.target.matches('[data-cyear]')) copiesInput(e.target); if (e.target.matches('[data-forms] [data-fcode]')) formsInput(e.target); if (e.target.matches('[data-tune] [data-tin]')) tuneType(e.target); });   /* i18n-ok: selectors */
  page.addEventListener('click', e => { const b = e.target.closest('[data-copies] [data-cp]'); if (b) copiesInput(b); const w = e.target.closest('[data-walls] [data-wk], [data-walls] [data-wrow]'); if (w) wallsInput(w, S.chip); const f = e.target.closest('[data-forms] [data-fjob], [data-forms] [data-fver], [data-forms] [data-fedit], [data-forms] [data-fsig]'); if (f) formsInput(f); const pl = e.target.closest('[data-plan] [data-pk2]'); if (pl) planInput(pl, S.chip); const ck = e.target.closest('[data-clock] [data-clk], [data-clock] [data-clkref]'); if (ck) clockInput(ck, S.chip); const sb = e.target.closest('[data-side] [data-sbk]'); if (sb) sideInput(sb); const sw = e.target.closest('[data-swarm] [data-swk]'); if (sw) swarmInput(sw); const tn = e.target.closest('[data-tune] [data-tk], [data-tune] [data-tplane]'); if (tn) tuneInput(tn, e); });   /* i18n-ok: a selector */
  /* a world (src/v2/worlds.js): one core question, its page made from its document; #/w/<id>/q<n> opens a question inside */
  function showWorlds() {
    const shown = location.hash;
    page.innerHTML = '<div class="inner"><a class="x pagex" href="#/" aria-label="' + esc(t('sheet.close')) + '">×</a><p class="muted">' + esc(t('world.loading')) + '</p></div>';
    page.classList.add('reading'); page.hidden = false; page.scrollTop = 0;
    Worlds.loadAll().then(all => { if (location.hash === shown) page.innerHTML = '<div class="inner"><a class="x pagex" href="#/" aria-label="' + esc(t('sheet.close')) + '">×</a>' + Worlds.indexHtml(all) + '</div>'; });
  }
  /* where a world's questions are asked on the island: each part or level whose question belongs to it, as an address */
  const ISLE_OF = { test: ['test', null], pkg: ['port', null], ship: ['port', null] };
  function islandOf(id) {
    const seen = new Set(), out = [], depths = new Set([...Object.values(PARTS).flatMap(P => P.list), ...Object.values(Game.INSIDE).flatMap(L => L.map(l => l.depth))]);
    depths.forEach(d => stopsAt(d).filter(k => k.startsWith(id + '.')).forEach(k => { let href = null, label = null;
      const P = Object.keys(PARTS).find(pl => PARTS[pl].list.includes(d));
      if (P) { href = '#/place/' + P + '/' + d; label = t('map.' + P + '.t') + ' · ' + PARTS[P].name(d); }
      else if (ISLE_OF[d]) { href = '#/place/' + ISLE_OF[d][0]; label = t('map.' + ISLE_OF[d][0] + '.t') + ' · ' + t('depth.' + d + '.name'); }
      else { const pl = Object.keys(Game.INSIDE).find(p2 => Game.INSIDE[p2].some(l => l.depth === d));
        if (pl) { href = levelHref(pl, Game.INSIDE[pl].find(l => l.depth === d)); label = t('map.' + pl + '.t') + ' · ' + t('depth.' + d + '.name'); } }
      if (href && !seen.has(href)) { seen.add(href); out.push({ href, label, q: t('stop.' + k + '.q') }); } }));
    return out;
  }
  /* a question met at its place, opened in its world: where it was met (with the way back there and the picture it is
     asked in), the question, what to notice, what is tried and what people asked, all kept as before */
  function arriveHtml(th, d) {
    const back = islandOf(th).find(x => x.q === t('stop.' + th + '.' + d + '.q'));
    return '<p class="kicker warrk">' + (back ? '<a href="' + esc(back.href) + '">← ' + esc(back.label) + '</a> · ' : '') + '<a href="' + esc(Game.askHref(th + '.' + d)) + '">' + esc(t('world.inPicture')) + '</a></p>' + stopHtml(th, d, followW);
  }
  function showWorld(id, at, d) {
    if (!WORLD_IDS.includes(id)) { location.hash = '#/'; return; }
    const atStop = at === 'at' && d && Game.trail(id).includes(d) ? d : null;
    if (atStop) { nowStop = { th: id, d: atStop }; askOpen = false; askNo = null; askVals = { q: '', noticed: '' }; const was = S.met[id] || []; delete S.met[id]; S.met[id] = [...new Set([...was, atStop])]; save(); }
    const q = /^q(\d+)$/.exec(at || ''), shown = location.hash;
    page.innerHTML = '<div class="inner"><a class="x pagex" href="#/" aria-label="' + esc(t('sheet.close')) + '">×</a><p class="muted">' + esc(t('world.loading')) + '</p></div>';
    page.classList.add('reading'); page.hidden = false; page.scrollTop = 0;
    const draw = P => { if (location.hash !== shown) return;
      page.innerHTML = '<div class="inner"><a class="x pagex" href="#/" aria-label="' + esc(t('sheet.close')) + '">×</a>' + Worlds.worldHtml(id, P, { chip: S.chip, q: q ? +q[1] : null, island: islandOf(id), arrive: atStop ? arriveHtml(id, atStop) : null }) + '</div>';
      swarmStart(page);
      const el = q && page.querySelector('#q' + q[1]); if (el) el.scrollIntoView({ block: 'center' }); };
    const go = () => Worlds.loadWorld(id).then(draw, () => { page.querySelector('.inner').innerHTML += '<p>' + esc(t('world.missing')) + '</p>'; });
    if (!FACT) facts().then(go); else go();
  }
  page.addEventListener('click', e => { const b = e.target.closest('[data-probe] [data-pk]'); if (b) Read.probePick(b, S.chip); });   /* i18n-ok: a selector */
  /* jump: type a name, go to its address. Every place, level and challenge, and the two pages; the list is never
     shown whole, only what matches */
  const jumpIndex = () => Game.PLACES.map(p => ({ name: t('map.' + p + '.t'), kind: kickerOf(p), href: '#/place/' + p }))
    .concat(Object.entries(Game.INSIDE).flatMap(([p, L]) => L.filter(l => p === 'datacentre' || !Game.SHARED.includes(l.depth)).map(l => ({ name: t('depth.' + l.depth + '.name'), kind: t('map.' + p + '.t'), href: levelHref(p, l) }))),
      Game.CHALLENGES.map(c => ({ name: titleOf(c), kind: whereOf(c), href: doHref(c) })),
      [{ name: t('look.plan.t'), kind: t('map.lab.t'), href: '#/build' }, { name: t('nav.challenges'), kind: t('loop.log'), href: '#/challenges' }, { name: t('loop.outShort'), kind: t('nav.ecosystem'), href: '#/ecosystem' }]);
  page.addEventListener('input', e => { const f = e.target.closest('[data-jump]'); if (!f) return; const q = f.value.trim().toLowerCase(), R = q ? jumpIndex().filter(x => x.name.toLowerCase().includes(q)).slice(0, 8) : [];
    page.querySelector('[data-jumpres]').innerHTML = R.map(x => '<a class="jumpto" href="' + esc(x.href) + '"><b>' + esc(x.name) + '</b><span class="small muted">' + esc(x.kind) + '</span></a>').join('') || (q ? '<p class="small muted">' + esc(t('jump.none')) + '</p>' : ''); });
  page.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('[data-jump]')) { const a = page.querySelector('.jumpto'); if (a) location.hash = a.getAttribute('href'); } });
  page.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { const ch = chOf(o.dataset.open); if (ch) location.hash = doHref(ch); return; }
    if (slipClick(e, S, redraw => { save(); refresh(true); if (redraw) showPage(pageNow); })) return;
    const j = e.target.closest('[data-job]'); if (j) location.hash = '#/do/' + encodeURIComponent('job:' + j.dataset.job);
  });
  /* the ecosystem: fly out to the islands; the sheet tells what lies beyond */
  function showEcosystem() {
    map && map.ecosystem(); $('outbtn').hidden = true;
    $('hero').classList.add('away'); sheet.onclick = null; sheet.oninput = null;
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(t('nav.ecosystem')) + '</p><h2>' + esc(t('page.ecosystem.title')) + '</h2><p>' + esc(t('page.ecosystem.lead')) + '</p>' +
      '<div class="isles">' + ['phones', 'cars', 'tools', 'materials', 'power', 'idea'].map(id => '<button type="button" class="isle" data-place="' + id + '" title="' + esc(t('map.' + id + '.d')) + '"><b>' + esc(t('map.' + id + '.t')) + (S.done[{ phones: 'phone', cars: 'car' }[id]] ? ' ✓' : '') + '</b><span class="small muted">' + esc(t('map.' + id + '.role')) + '</span></button>').join('') + '</div>' +
      '<a class="look wfgo" href="#/whatif"><b>' + esc(t('whatif.ui.kicker')) + '</b><span class="small">' + esc(t('whatif.ui.title')) + '</span></a>' +
      '<p class="kicker">' + esc(t('page.ecosystem.world')) + '</p><a class="look" href="#/supply"><b>' + esc(t('page.ecosystem.map')) + '</b><span class="small">' + esc(t('page.ecosystem.mapD')) + '</span><span class="small muted">' + esc(t('game.current')) + '</span></a>' +
      '<div class="debate2"><b>' + esc(t('debate.supply.t')) + '</b><span class="small">' + esc(t('debate.supply.q')) + '</span></div>';
    sheet.hidden = false; cur = null;
  }

  /* What if? between the islands: the levers in the sheet (a bench at the side on a desktop), the world answering */
  let wf = null;
  function showWhatif(lever) {
    map && map.whatifView(); $('outbtn').hidden = true; $('hero').classList.add('away'); hideInsp();
    sheet.classList.remove('inside', 'part'); sheet.classList.add('whatif'); sheet.innerHTML = ''; sheet.hidden = false; cur = null;
    wf = whatifView(sheet, { S, save, map, name: id => t('map.' + id + '.t'), close: () => { location.hash = '#/ecosystem'; } });
    if (lever) wf.lever(lever);
  }
  function leaveWhatif() { if (!wf && !sheet.classList.contains('whatif')) return; wf = null; map && map.whatif(null); sheet.classList.remove('whatif'); sheet.oninput = null; sheet.onchange = null; sheet.onclick = null; sheet.hidden = true; sheet.innerHTML = ''; }

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
  /* ---- a question's world: where it leads, what you can do about it, what people have asked under it ---- */
  /* a question someone added under a stop: its words, who asked, and (for yours) the slip that leads into the ledger */
  const askedHtml = e => '<div class="asked1' + (e.draft ? ' draft' : '') + '"><p class="q">' + esc(e.q) + '</p>' + (e.noticed ? '<p class="small">' + esc(e.noticed) + '</p>' : '') + '<p class="small muted">' + byLine(e) + (e.under ? ' · ' + esc(t('depth.' + e.at + '.name')) : '') + '</p>' + (Game.workAt(e.id, S).length ? '<p class="kicker">' + esc(t('trail.work', { n: Game.workAt(e.id, S).length })) + '</p>' + Game.workAt(e.id, S).map(w => '<p class="small"><span class="made ' + esc(w.made) + '"></span> ' + esc(Game.entryWords(w, S)) + ' <span class="muted">· ' + byLine(w) + '</span></p>').join('') : '') + (e.draft ? slipHtml(S, e.id) : '<p class="small muted">' + esc(t('ask.workOn')) + ' <span class="mono">' + esc(e.id) + '</span></p>') + '</div>';
  let nowStop = null, askOpen = false, askNo = null, askVals = { q: '', noticed: '' };
  function stopHtml(th, d, hrefOf = Game.askHref) {
    const T = Game.trail(th), i = T.indexOf(d), key = th + '.' + d, tried = t('stop.' + key + '.tried');
    const step = (j, k) => T[j] != null ? '<a class="btn' + (k === 'next' ? ' primary' : ' ghost') + '" data-key="' + k + '" href="' + esc(hrefOf(th + '.' + T[j])) + '">' + esc(t(k === 'next' ? 'trail.next' : 'trail.prev', { level: t('depth.' + T[j] + '.name') })) + '</a>' : '<span></span>';
    let h = '<div class="stopx"><p class="kicker trailk" style="--qc:' + qColor(key) + '"><span class="dotq"></span>' + esc(t('trail.k', { level: t('depth.' + d + '.name') })) + '</p>';
    h += '<p class="line trailq">' + esc(t('stop.' + key + '.q')) + '</p><p class="small">' + esc(t('stop.' + key + '.note')) + '</p>';
    /* what you can do about it: the challenges that open this question, and the open things of the ledger that sit here */
    const dos = Game.doAtStop(key, S);
    if (dos.length) h += '<div class="stopdo">' + dos.slice(0, 4).map(x => x.ch ? '<a class="dochip' + (S.done[x.ch.id] ? ' done' : '') + '" href="' + esc(doHref(x.ch)) + '"><span class="kicker">' + esc(t(S.done[x.ch.id] ? 'trail.did' : x.ch.kind === 'break' ? 'trail.open' : 'trail.do')) + '</span><b>' + esc(titleOf(x.ch)) + '</b></a>'
      : '<a class="dochip engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + x.engine + '.t') }) })) + '"><span class="kicker">' + esc(t('trail.open')) + '</span><b>' + esc(t('trail.engine', { piece: t('build.need.' + x.engine + '.t') })) + '</b></a>').join('') + '</div>';
    if (Array.isArray(tried)) h += '<details class="more2"><summary>' + esc(t('trail.tried')) + '</summary><ul class="tried2">' + tried.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></details>';
    h += casesHtml(key) + figuresHtml(key);
    /* the questions that meet this one on a part they share: a way across, not only down */
    const X = Game.across(key);
    if (X.length) h += '<details class="more2"><summary>' + esc(t('trail.across', { n: X.length })) + '</summary>' + X.map(k2 => '<a class="askline" href="' + esc(hrefOf(k2)) + '" style="--qc:' + qColor(k2) + '"><span class="q">' + esc(t('stop.' + k2 + '.q')) + '</span></a>').join('') + '</details>';
    /* the work done for this question, by people and agents: evidence, never an answer */
    const WK = Game.workAt(key, S);
    if (WK.length) h += '<details class="more2"><summary>' + esc(t('trail.work', { n: WK.length })) + '</summary><p class="small muted">' + esc(t('trail.workD')) + '</p>' + WK.map(e => '<p class="small"><span class="made ' + esc(e.made) + '"></span> ' + esc(Game.entryWords(e, S)) + ' <span class="muted">· ' + byLine(e) + '</span></p>').join('') + '</details>';
    /* what people have asked under it, and a place for yours */
    const A = Game.askedAt(key, S);
    h += '<details class="more2 asked"' + (A.some(e => e.draft) || askOpen ? ' open' : '') + '><summary>' + esc(t(A.length ? 'trail.asked' : 'trail.askedNone', { n: A.length })) + '</summary>' + A.map(askedHtml).join('') +
      (askOpen ? '<div class="askform"><label><span class="kicker">' + esc(t('ask.q')) + '</span><input type="text" data-askq maxlength="160" value="' + esc(askVals.q) + '" placeholder="' + esc(t('ask.qPh')) + '"></label><label><span class="kicker">' + esc(t('ask.noticed')) + '</span><input type="text" data-asknoticed maxlength="240" value="' + esc(askVals.noticed) + '" placeholder="' + esc(t('ask.noticedPh')) + '"></label>' +
        signHtml(S) + (askNo ? '<p class="small bad">' + esc(askNo) + '</p>' : '') + '<div class="acts"><button type="button" class="btn primary" data-askkeep>' + esc(t('ask.keep')) + '</button><span class="small muted">' + esc(t('ask.rule')) + '</span></div></div>'
        : '<button type="button" class="btn" data-askown>' + esc(t('ask.own')) + '</button>') + '</details>';
    /* the question behind the question: one root at a time, once two of its stops have been met, or one after you
       have done something about it */
    if (rootShown(S.met[th], Game.didOn(S, th))) h += '<div class="root2"><p class="small muted">' + esc(t('ui.rootOf')) + '</p><p class="rootq">' + esc(t('thread.' + th + '.root')) + '</p><p class="small muted">' + esc(t('ui.behind')) + ' <em>' + esc(t('thread.' + th + '.behind')) + '</em></p></div>';
    return h + '<div class="nav"><span class="navl">' + step(i - 1, 'back') + '<button type="button" class="btn ghost" data-leave>' + esc(t('trail.leave')) + '</button></span>' + step(i + 1, 'next') + '</div></div>';
  }
  function askStop(th, d, again) {
    if (!Game.trail(th).includes(d)) return;
    if (!again) { askOpen = false; askNo = null; askVals = { q: '', noticed: '' }; }
    nowStop = { th, d };
    /* the questions you have met stay met (your state), and the strand you followed last goes to the end */
    const was = S.met[th] || []; delete S.met[th]; S.met[th] = [...new Set([...was, d])]; save();
    if (!FACT) return facts().then(() => askStop(th, d, again));
    /* met in its world: the block at the top of the world's page */
    const arrive = !page.hidden && page.querySelector('[data-arrive]');
    if (arrive && location.hash === '#/w/' + th + '/at/' + d) { arrive.innerHTML = arriveHtml(th, d); return; }
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
  /* asking your own, under the question in view: it is checked for a home and a question's form, kept as yours, and
     the slip leads into the ledger */
  document.addEventListener('click', e => {
    const box = e.target.closest('.stopx'); if (!box || !nowStop) return;
    const again = () => askStop(nowStop.th, nowStop.d, true);
    if (e.target.closest('[data-askown]')) { askOpen = true; again(); const f = document.querySelector('.stopx [data-askq]'); if (f) f.focus(); return; }
    if (e.target.closest('[data-askkeep]')) {
      askVals = { q: box.querySelector('[data-askq]').value.trim(), noticed: box.querySelector('[data-asknoticed]').value.trim() };
      const key = nowStop.th + '.' + nowStop.d, k = keep(S, { kind: 'question', at: nowStop.d, under: key, q: askVals.q, noticed: askVals.noticed }, askVals.q.split(/\s+/).slice(0, 5).join(' '), signOf(box));
      if (k.ok) { askOpen = false; askNo = null; askVals = { q: '', noticed: '' }; kept(k.e); } else askNo = refusal(k.r);
      return again();
    }
    if (slipClick(e, S, redraw => { save(); refresh(true); if (redraw) again(); })) return;
  });
  /* ---- the questions from the field (src/data/questions.js, src/v2/field.js): one opens in the card of the view
     you are in, or in the island's dock; a leak is raised when you cross its seam, the first time, and then waits
     under Ask at its home ---- */
  const frameNow = () => (!vui.hidden ? diveFrame : !cui.hidden ? chipFrame : !pui.hidden ? dcFrame : !bui.hidden ? boardFrame : null);
  function openField(id) {
    hideSeam(); const html = Field.fieldHtml(id); if (!html) return;
    if (!S.crossed[id]) { S.crossed[id] = true; save(); }
    const fr = frameNow(); if (fr) return fr.stop(html);
    sheet.onclick = null; sheet.oninput = null; cur = null;
    sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>' + html;
    sheet.classList.remove('mover', 'part', 'inside'); sheet.hidden = false; sheet.scrollTop = 0; $('hero').classList.add('away'); hud();
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-seamx]')) return hideSeam();
    const f = e.target.closest('[data-field]'); if (f) { e.preventDefault(); return openField(f.dataset.field); }
    if (!e.target.closest('[data-fieldleave]')) return;
    const fr = frameNow(); if (fr) fr.look(); else closeSheet();
  });
  /* leaving a question: back to the view's own words */
  document.addEventListener('click', e => { const l = e.target.closest('[data-leave]'); if (!l) return;
    /* in a world's page, leaving the question goes on to the world it belongs to */
    if (l.closest('[data-arrive]')) { const w = page.querySelector('.warrnext'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const fr = !vui.hidden ? diveFrame : !cui.hidden ? chipFrame : !pui.hidden ? dcFrame : !bui.hidden ? boardFrame : null;
    if (fr) { if (fr === diveFrame && dive) { diveThread = null; dive.setThread(null); } fr.look(); } else closeSheet(); });

  /* ---- routes ---- */
  /* which view an address shows, and how deep it sits: the island 0, a place 1, the board 2, the chip 3, the dive 4.
     Going between views is never a cut: deeper zooms in, higher zooms out, the Turn turns, along slides. */
  const partsOf = h => (h.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
  const doPlace = ch => (ch && !ch.need && ch.kind !== 'break' && ch.kind !== 'design' ? Way.doHome(ch) : null);
  const viewOf = p => { const k = p[0]; if (k === 'ask') return viewOf(partsOf(Game.viewOfDepth(p[2] || 'chip')));
    if (k === 'do') { const h = doPlace(chOf(decodeURIComponent(p[1] || ''))); return h ? viewOf(partsOf(h)) : ['map', 0]; }
    if (k === 'dive') { const w = p[2] || Game.DIVE_WORLD[p[1]] || 'datacentre'; if (w === 'datacentre') return ['dive', 4]; const i = Math.max(0, ['phone', 'phoneboard', 'soc', 'car', 'ecu', 'mcu', 'scanner', 'wafer', 'die'].indexOf(p[1]) % 3); return ['dive:' + w, Game.DIVE_WORLD[p[1]] ? 1 + i : 4]; }
    if (k === 'supply') return ['supply', 0];
    return k === 'board' ? ['board', 2] : k === 'line' ? ['line', 1] : k === 'bench' ? ['bench', 1] : k === 'chip' ? ['chip', 3]
      : k === 'place' && p[1] === 'datacentre' && /^\d+$/.test(p[2] || '') ? ['dc', 1] : ['map', 0]; };
  let shownAt = null;   /* the address of the view now made, so a question at the same level only changes the dock */
  let viewNow = null, rankNow = 0, nextMove = null, lastPlace = null, entering = false, enteredFrom = null;
  /* going inside from the island: the camera dives into the place first, then the view zooms in from it */
  function enter(href) {
    if (entering) return;
    if (still() || !map || $('mapCanvas').hidden || !lastFocus()) { location.hash = href; return; }
    /* the camera dives at what is selected, and the view inside opens from that point on the screen, as through a
       portal (docs/INTERACTION.md) */
    enteredFrom = lastFocus(); entering = true; map.dive(lastFocus(), cur && cur.part).then(() => { entering = false; portalAt(map.screenOf(lastFocus(), cur && cur.part)); arriving = true; location.hash = href; });
  }
  const lastFocus = () => (cur && cur.place) || null;
  let arriving = false;   /* the next view was entered from the island: it starts from above, coming down */
  /* where the next zoom opens or closes on the screen */
  const portalAt = p => { const r = document.documentElement.style; if (p && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1) { r.setProperty('--vx', (p.x * 100).toFixed(1) + '%'); r.setProperty('--vy', (p.y * 100).toFixed(1) + '%'); } else { r.removeProperty('--vx'); r.removeProperty('--vy'); } };
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
    /* a challenge is played where its level is shown, in that view's card, with the picture behind it; a piece of
       the shared computer or a break is met at the Lab and the village, on the island */
    if (k === 'do' && parts[1]) { const ch = chOf(decodeURIComponent(parts[1])), home = doPlace(ch);
      if (home) return show(partsOf(home), from).then(() => { shownAt = '#/' + parts.join('/'); openBench(ch); });
      return showMap(from).then(() => openChallenge(ch)); }
    if (k === 'chip') return showChip(parts[1] != null ? +parts[1] : null, parts[2]);
    /* the data centre's flight is entered at one of its levels (#/place/datacentre/2); the place itself opens on the island */
    if (k === 'place' && parts[1] === 'datacentre' && /^\d+$/.test(parts[2] || '')) return showPlace('datacentre', +parts[2]);
    if (k === 'place' && isPart(parts[1], parts[2])) return showMap(from).then(() => openPlace(parts[1], 'look', null, null, parts[2]));
    if (k === 'place' && Game.PLACES.includes(parts[1])) return showMap(from).then(() => openPlace(parts[1], parts[2] === 'inside' ? 'look' : null));
    if (k === 'build') return showMap(from).then(() => openPlace('lab', 'look', parts[1] || 'computer', parts[2]));
    if (['log', 'challenges', 'questions'].includes(k)) showPage(k);
    if (k === 'read') showRead(parts[1] ? decodeURIComponent(parts[1]) : null);
    if (k === 'w') { if (parts[1]) showWorld(parts[1], parts[2], parts[3]); else showWorlds(); }
    if (k === 'whatif') return showMap(from).then(() => showWhatif(parts[1]));
    return showMap(from).then(() => { if (k === 'ecosystem') showEcosystem(); else if (k === 'explore' && cur && !sheet.hidden) { closeSheet(); map && map.overview(); } });
  }
  function route() {
    const parts = partsOf(location.hash), k = parts[0] || 'explore';
    /* the cell you came from and the one you are in: a seam between them may raise its leak */
    { const to = Way.whereOf(location.hash); hideSeam(); crossed(seamFrom, to); seamFrom = to; }
    /* a bet's wafer or chip stands in the scene only while its challenge is open */
    if (!/^#\/do\/(cheaper|onebad|oxen|jevons)$/.test(location.hash)) setBetScene(null, null, '');
    /* What if? holds the world grey with its columns only while it is open */
    if (k !== 'whatif') leaveWhatif();
    page.hidden = true; page.classList.remove('reading'); $('logbtn').setAttribute('aria-current', ['log', 'challenges', 'questions'].includes(k) ? 'page' : 'false'); $('logbtn').classList.remove('glow');
    const after = pr => { hud(); return Promise.resolve(pr).then(hud); };
    const [view, rank] = viewOf(parts), from = viewNow, move = nextMove || (rank > rankNow ? 'in' : rank < rankNow ? 'out' : 'along');
    nextMove = null; viewNow = view; rankNow = rank;
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
    const host = [vui, cui, pui, bui].find(h => h && !h.hidden) || (!sheet.hidden && !sheet.querySelector('.player') ? sheet : null); if (!host) return;
    if (e.key === 'Escape') { const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } return; }
    const W = whereNow(), column = ['dive', 'flight', 'chip'].includes(W.view) && !host.querySelector('.dock .player, .dock .stopx');
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { const down = e.key === 'ArrowDown';
      if (column) { const b = host.querySelector('.dock [data-key="' + (down ? 'next' : 'back') + '"]'); if (b) { b.click(); e.preventDefault(); } else if (!down) { const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } } return; }
      if (host === sheet) { const a = down && sheet.querySelector('.nav a.btn.primary'); if (a) { a.click(); e.preventDefault(); } return; }
      if (down) { const to = W.view === 'line' && W.level === 'print' ? '#/dive/scanner/made' : null; if (to) { location.hash = to; e.preventDefault(); } return; }
      const up = host.querySelector('.homebtn'); if (up) { location.hash = up.getAttribute('href'); e.preventDefault(); } return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (column) { const i = Way.STAGES.indexOf(W.stage), n = Way.STAGES.length; along(Way.STAGES[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n]); e.preventDefault(); return; }
    if (host === sheet && e.key === 'ArrowLeft' && cur) { const st = Way.stageOfPlace(cur.place), prev = st && Object.values(Way.STAGE_PLACE).find(p => Way.nextPlace(p) === Way.STAGE_PLACE[st]); if (prev) { location.hash = '#/place/' + prev; e.preventDefault(); } return; }
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
}
