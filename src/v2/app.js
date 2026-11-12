/* The redesign's shell. The main thread is your chip's life (src/v2/game.js): the HUD always shows the five
   steps, where your chip is and what to do next. Every place opens the same sheet with three doors: Do (its
   challenges, played right there: src/v2/play.js), Look (the ways inside) and Ask (its questions and debates).
   Look is Inside: a place's levels, one inside the next, which hold the earlier site's pages (src/data/places.js).
   The menu: Explore (the island), Challenges (every challenge and every open job), Questions (by place),
   Build (the shared computer the community is building) and Ecosystem (the islands across the sea, and the
   world chips depend on). Routes live in the address: #/, #/place/<id>, #/place/datacentre/<level>, #/chip/<row>[/build] (inside a chip, layer by layer), #/challenges, #/questions, #/build,
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
import { ROWS, ASK as CHIP_ASK } from './chip3d.js';

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const MENU = ['explore', 'challenges', 'questions', 'build', 'ecosystem'];
const OLD = 'index.html?'; /* i18n-ok: a file name */
const oldUrl = (world, extra) => OLD + new URLSearchParams(Object.assign({ world }, extra || {}));
const hue = th => (THREADS.find(x => x.id === th) || { hue: 200 }).hue;
const qColor = key => 'hsl(' + hue(key.split('.')[0]) + ' 70% 55%)';
const follow = key => { const [th, depth] = key.split('.'); return oldUrl(Game.worldOfDepth(depth), { thread: th, depth }); };

export function start() {
  let map = null, dc = null, chip = null, mapReady = null;
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
  const refresh = animate => { if (map) map.setState(islandState(), animate); hud(); };

  /* ---- the 3D views, made when first needed ---- */
  const loading = on => $('loading').classList.toggle('on', on);
  const ensureMap = () => mapReady || (mapReady = import('./map3d.js').then(m => {
    map = m.createMap($('mapCanvas'), $('mapLabels'), { place: id => openPlace(id), question: key => openQuestion(key), job: need => openJob(need), interact: () => $('hero').classList.add('away') });
    loading(false); map.setState(islandState(), false); return map;
  }));
  const ensureDc = () => dc ? Promise.resolve(dc) : import('./dc3d.js').then(m => { dc = m.createDataCentre($('placeCanvas'), $('placeLabels'), { level: lv => placeUI(lv), depth: z => depthBar(z) }); return dc; });

  /* ---- the HUD: your chip's life, always in view ---- */
  const hudEl = $('hud');
  function hud() {
    const at = Game.chipAt(S), nx = Game.next(S);
    hudEl.innerHTML = '<p class="kicker">' + esc(t('game.yourChip')) + '<a class="inlink" href="#/chip/0">' + esc(t('chipx.open')) + '</a></p><ol class="steps">' + Game.STEPS.map((s, i) => {
      const st = Game.stepState(S, s), full = st.done === st.total;
      return '<li><button type="button" data-step="' + s + '" class="' + (full ? 'full' : '') + (s === at ? ' here' : '') + '" aria-label="' + esc(t('game.stepAria', { n: i + 1, step: t('game.step.' + s), done: st.done, total: st.total })) + '"><span class="n">' + (full ? '✓' : i + 1) + '</span><span class="w">' + esc(t('game.step.' + s)) + '</span><span class="p">' + st.done + '/' + st.total + '</span></button></li>';
    }).join('') + '</ol>' + (nx ? '<button type="button" class="next" data-ch="' + nx.id + '"><span class="kicker">' + esc(t('game.next')) + '</span>' + esc(titleOf(nx)) + '</button>' : '<p class="small good">' + esc(t('game.allDone')) + '</p>');
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
  const DIVE_CHIP = { soc: 0, mcu: 0 };
  const levelHref = (place, l) => { const f = (Game.FLOWN[place] || {})[l.depth]; if (f != null) return '#/place/' + place + '/' + f;
    const c = DIVE_CHIP[l.depth] != null ? { row: 0, build: false } : rowOf(l.depth); return c ? '#/chip/' + c.row + (c.build ? '/build' : '') : oldUrl(l.world, { depth: l.depth }); };
  function insideHtml(id) {
    const L = Game.INSIDE[id] || [], extra = Game.LOOK[id] || [];
    let h = L.length ? '<p class="small muted">' + esc(t('game.inside.d')) + '</p><ol class="ladder2">' + L.map((l, i) => {
      const nq = stopsAt(l.depth).length, chs = Game.placeChallenges(id).filter(c => c.at === l.depth), flown = (Game.FLOWN[id] || {})[l.depth] != null;
      const drawn = flown || /^#\/chip/.test(levelHref(id, l)), meta = [nq ? t('game.inside.qs', { n: nq }) : '', chs.length ? t('game.inside.ch', { n: chs.length }) : '', Game.SHARED.includes(l.depth) ? t('game.inside.shared') : '', drawn ? t('game.inside.fly') : t('game.inside.current')].filter(Boolean).join(' · ');
      return '<li><a href="' + esc(levelHref(id, l)) + '"><span class="i">' + (i + 1) + '</span><span><b>' + esc(t('depth.' + l.depth + '.name')) + '</b><span class="see">' + esc(t('depth.' + l.depth + '.see')) + '</span><span class="small muted">' + esc(meta) + '</span></span></a></li>';
    }).join('') + '</ol>' : '';
    h += extra.map(l => { const href = l.to ? '#/place/' + l.to : l.page ? '#/' + l.page : oldUrl(l.world, Object.assign({ depth: l.depth }, l.map ? { map: 1 } : {}));
      return '<a class="look" href="' + esc(href) + '"><b>' + esc(t('look.' + l.id + '.t')) + '</b><span class="small">' + esc(t('look.' + l.id + '.d')) + '</span>' + (l.world ? '<span class="small muted">' + esc(t('game.current')) + '</span>' : '') + '</a>'; }).join('');
    return h || '<p class="small muted">' + esc(t('game.noLook')) + '</p>';
  }
  function openPlace(id, tab) {
    cur = { place: id, tab: tab || (doList(id).length || id === 'village' || id === 'lab' || id === 'idea' ? 'do' : 'look') };
    map && map.focus(id); $('hero').classList.add('away'); drawPlace();
  }
  function drawPlace() {
    const id = cur.place, C = Game.community(S), asks = Game.ASK[id] || [], debates = Game.debatesAt(id), dos = doList(id);
    const nDo = id === 'lab' ? C.jobs.length + C.engines.length : id === 'village' ? C.jobs.length : dos.filter(c => !S.done[c.id]).length, nAsk = asks.length + debates.length;
    let h = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>';
    h += '<p class="kicker">' + esc(kickerOf(id)) + '</p><h2>' + esc(t('map.' + id + '.t')) + '</h2><p>' + esc(t('map.' + id + '.d')) + '</p>';
    h += '<div class="doors" role="tablist">' + ['do', 'look', 'ask'].map(k => '<button type="button" role="tab" data-door="' + k + '" aria-selected="' + (cur.tab === k) + '"><b>' + esc(t('door.' + k)) + (k === 'do' && nDo ? ' <span class="n">' + nDo + '</span>' : k === 'ask' && nAsk ? ' <span class="n">' + nAsk + '</span>' : '') + '</b><span class="small">' + esc(t('door.' + k + '.d')) + '</span></button>').join('') + '</div><div class="door">';
    if (cur.tab === 'do') {
      if (id === 'lab') h += '<p class="small">' + esc(t('game.lab.do', { built: C.built, total: C.total })) + '</p>' + C.jobs.map(jobCard).join('') + C.engines.map(e => '<a class="chcard engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + e.need + '.t') }) })) + '"><span class="st">⚙</span><span><b>' + esc(t('build.need.' + e.need + '.t')) + '</b><span class="small">' + esc(t('game.engineWanted')) + '</span></span></a>').join('') + '<a class="link" href="#/build">' + esc(t('game.seePlan')) + '</a>';
      else if (id === 'village') h += '<p class="small">' + esc(t('game.village.do')) + '</p>' + C.designs.map(d => '<div class="chcard done"><span class="st">⌂</span><span><b>' + esc(d.title) + '</b><span class="small">' + esc(d.author) + ' · ' + esc(t('build.kind.' + d.kind)) + '</span></span></div>').join('') + C.jobs.map(jobCard).join('');
      else if (id === 'idea') h += '<p>' + esc(t('game.idea.do')) + '</p><a class="btn primary" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('game.idea.title') })) + '">' + esc(t('game.idea.propose')) + '</a>';
      else if (dos.length) h += dos.map(chCard).join('');
      else h += '<p class="small muted">' + esc(t('game.noDo')) + '</p>';
    } else if (cur.tab === 'look') {
      h += insideHtml(id);
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
  function won(ch) { refresh(true); toast(ch.grows ? t('game.toast', { what: t('grow.' + ch.grows) }) : t('game.toastJob')); }
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

  /* ---- a place flown through: the data centre ---- */
  const pui = $('placeui');
  function placeUI(lv) {
    const id = LEVELS[lv], key = ASKS[id];
    pui.querySelectorAll('[data-lv]').forEach(b => b.setAttribute('aria-current', +b.dataset.lv === lv ? 'step' : 'false'));
    pui.querySelector('.caption').innerHTML = '<p class="kicker">' + esc(t('place.level', { n: lv + 1, total: LEVELS.length })) + '</p><h2>' + esc(t('place.dc.' + id + '.t')) + '</h2><p>' + esc(t('place.dc.' + id + '.d')) + '</p>' +
      (key ? '<div class="ask" style="--qc:' + qColor(key) + '"><p class="q">' + esc(t('stop.' + key + '.q')) + '</p><a class="link" href="' + esc(follow(key)) + '">' + esc(t('sheet.follow')) + '</a></div>' : '') +
      (lv === LEVELS.length - 1 ? '<a class="btn primary" href="#/chip/0">' + esc(t('place.next')) + '</a>' : '');
  }
  const depthBar = z => { const f = pui.querySelector('.fill'); if (f) f.style.height = (z / (LEVELS.length - 1) * 100).toFixed(1) + '%'; };
  function showPlace(id, lv) {
    $('chipCanvas').hidden = $('chipLabels').hidden = true; cui.hidden = true; chip && chip.pause();
    $('hero').hidden = true; hudEl.hidden = true; closeSheet();
    $('mapCanvas').hidden = $('mapLabels').hidden = true; $('placeCanvas').hidden = $('placeLabels').hidden = false; pui.hidden = false;
    pui.innerHTML = '<nav class="crumbs"><a href="#/">' + esc(t('place.back')) + '</a><span aria-hidden="true">›</span><b>' + esc(t('map.' + id + '.t')) + '</b></nav>' +
      '<ol class="ladder" aria-label="' + esc(t('place.levels')) + '"><span class="track"><span class="fill"></span></span>' + LEVELS.map((k, i) => '<li><button type="button" data-lv="' + i + '">' + esc(t('place.dc.' + k + '.t')) + '</button></li>').join('') + '</ol>' +
      '<div class="caption"></div><p class="hint">' + esc(t('place.hint')) + '</p>';
    pui.onclick = e => { const b = e.target.closest('[data-lv]'); if (b && dc) dc.go(+b.dataset.lv); };
    map && map.pause();
    loading(true);
    ensureDc().then(d => { loading(false); d.resume(); if (lv != null && lv >= 0 && lv < LEVELS.length) d.go(lv); placeUI(Math.round(d.z)); $('placeCanvas').focus({ preventScroll: true }); });
  }
  /* ---- inside a chip, layer by layer: the dive (top down) and the line (bottom up) as one picture ---- */
  const cui = $('chipui');
  let chipMode = 'dive', chipRow = 0;
  const ensureChip = () => chip ? Promise.resolve(chip) : import('./chip3d.js').then(m => { chip = m.createChip($('chipCanvas'), $('chipLabels'), { row: r => { chipRow = r; chipPanel(); }, depth: z => { const f = cui.querySelector('.stack .fill'); if (!f) return; const k = z / (ROWS.length - 1), b = chipMode === 'build'; /* diving fills from the top, building from the bottom */ f.style.top = b ? 'auto' : '0'; f.style.bottom = b ? '0' : 'auto'; f.style.height = ((b ? 1 - k : k) * 100).toFixed(1) + '%'; } }); return chip; });
  const stepNames = r => ROWS[r].made.map(d => t('depth.' + d + '.name')).join(' → ');
  function chipPanel() {
    const r = chipRow, R = ROWS[r], build = chipMode === 'build', n = build ? ROWS.length - r : r + 1, key = CHIP_ASK[chipMode][r];
    cui.querySelector('.seg').innerHTML = ['dive', 'build'].map(m => '<button type="button" role="tab" data-mode="' + m + '" aria-selected="' + (m === chipMode) + '"><b>' + esc(t('chipx.' + m)) + '</b><span class="small">' + esc(t('chipx.' + m + 'D')) + '</span></button>').join('');
    cui.querySelector('.stack ol').innerHTML = ROWS.map((x, i) => '<li><button type="button" data-row="' + i + '" class="' + (i === r ? 'on' : '') + (build && i > r ? ' made' : '') + (!build && i < r ? ' passed' : '') + '"' + (i === r ? ' aria-current="step"' : '') + '><span class="n">' + (build ? ROWS.length - i : i + 1) + '</span><span class="lv">' + esc(t('depth.' + x.dive + '.name')) + '</span><span class="mk">' + esc(stepNames(i)) + '</span></button></li>').join('');
    let h = '<p class="kicker">' + esc(t(build ? 'chipx.stepN' : 'chipx.levelN', { n, total: ROWS.length })) + '</p>';
    if (build) h += '<h2>' + esc(stepNames(r)) + '</h2>' + R.made.map(d => '<p>' + esc(t('depth.' + d + '.see')) + '</p>').join('') + '<button type="button" class="swap" data-mode="dive">' + esc(t('chipx.becomes', { level: t('depth.' + R.dive + '.name') })) + '</button>';
    else h += '<h2>' + esc(t('depth.' + R.dive + '.name')) + '</h2><p>' + esc(t('depth.' + R.dive + '.see')) + '</p><button type="button" class="swap" data-mode="build">' + esc(t('chipx.madeAt', { step: stepNames(r) })) + '</button>';
    if (key) h += '<a class="askq" href="' + esc(follow(key)) + '" style="--qc:' + qColor(key) + '"><span class="q">' + esc(t('stop.' + key + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a>';
    const nextR = build ? r - 1 : r + 1, done = build ? r === 0 : r === ROWS.length - 1;
    h += '<div class="row">' + (done ? '<a class="btn primary" href="' + (build ? '#/place/port' : '#/') + '">' + esc(t(build ? 'chipx.ship' : 'chipx.back')) + '</a>' : '<button type="button" class="btn primary" data-row="' + nextR + '">' + esc(t(build ? 'chipx.next' : 'chipx.deeper')) + '</button>') +
      '<a class="btn" href="' + esc(build ? '#/place/fab/inside' : oldUrl('datacentre', { depth: R.dive })) + '">' + esc(t(build ? 'chipx.atFab' : 'chipx.current')) + '</a></div>';
    cui.querySelector('.now').innerHTML = h;
  }
  function showChip(row, mode) {
    $('hero').hidden = true; hudEl.hidden = true; closeSheet(); pui.hidden = true; dc && dc.pause(); map && map.pause();
    ['mapCanvas', 'mapLabels', 'placeCanvas', 'placeLabels'].forEach(k => { $(k).hidden = true; });
    $('chipCanvas').hidden = $('chipLabels').hidden = false; cui.hidden = false;
    chipMode = mode === 'build' ? 'build' : 'dive'; chipRow = row != null && row >= 0 && row < ROWS.length ? row : chipMode === 'build' ? ROWS.length - 1 : 0;
    cui.innerHTML = '<nav class="crumbs"><a href="#/">' + esc(t('place.back')) + '</a><span aria-hidden="true">›</span><b>' + esc(t('chipx.title')) + '</b></nav>' +
      '<aside class="stackpanel"><div class="seg" role="tablist"></div><div class="stack"><span class="track"><span class="fill"></span></span><ol></ol></div><div class="now"></div></aside><p class="hint">' + esc(t('chipx.hint')) + '</p>';
    cui.onclick = e => { const m = e.target.closest('[data-mode]'); if (m) { chipMode = m.dataset.mode; chip && chip.mode(chipMode); chipPanel(); return; } const b = e.target.closest('[data-row]'); if (b && chip) chip.go(+b.dataset.row); };
    chipPanel(); loading(true);
    ensureChip().then(c => { loading(false); c.mode(chipMode); c.set(chipRow); c.resume(); $('chipCanvas').focus({ preventScroll: true }); });
  }
  function showMap() {
    $('chipCanvas').hidden = $('chipLabels').hidden = true; cui.hidden = true; chip && chip.pause();
    $('placeCanvas').hidden = $('placeLabels').hidden = true; pui.hidden = true; dc && dc.pause();
    $('mapCanvas').hidden = $('mapLabels').hidden = false; $('hero').hidden = false; hudEl.hidden = false;
    loading(!map); return ensureMap().then(m => { m.resume(); return m; });
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
      h += '<h2>' + esc(t('page.build.how')) + '</h2><div class="cards"><a class="card2" href="' + esc(oldUrl('design')) + '"><b>' + esc(t('page.build.studio')) + '</b><span>' + esc(t('page.build.studioD')) + '</span></a>' +
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
      '<p class="kicker">' + esc(t('page.ecosystem.world')) + '</p><a class="look" href="' + esc(oldUrl('journey', { depth: 'ship', map: 1 })) + '"><b>' + esc(t('page.ecosystem.map')) + '</b><span class="small">' + esc(t('page.ecosystem.mapD')) + '</span><span class="small muted">' + esc(t('game.current')) + '</span></a>' +
      '<div class="debate2"><b>' + esc(t('debate.supply.t')) + '</b><span class="small">' + esc(t('debate.supply.q')) + '</span></div>';
    sheet.hidden = false; cur = null;
  }

  /* ---- routes ---- */
  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean), k = parts[0] || 'explore';
    const nav = k === 'place' || k === 'chip' ? 'explore' : MENU.includes(k) ? k : 'explore';
    menu.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === nav ? 'page' : 'false'));
    page.hidden = true;
    if (k === 'chip') return showChip(parts[1] != null ? +parts[1] : null, parts[2]);
    if (k === 'place' && parts[1] === 'datacentre' && parts[2] !== 'inside') return showPlace('datacentre', parts[2] != null ? +parts[2] : null);
    if (k === 'place' && Game.PLACES.includes(parts[1])) { showMap().then(() => openPlace(parts[1], parts[2] === 'inside' ? 'look' : null)); return; }
    showMap().then(() => { if (k === 'ecosystem') showEcosystem(); });
    if (['challenges', 'questions', 'build'].includes(k)) showPage(k);
  }
  window.addEventListener('hashchange', route);
  hud();
  route();
}
