/* The reading pages: your log, the commons' pages, every experiment (#/read), a world made from its document
   (#/w/<id>, opened from a lens or by name; never listed, #305), machines from shared blocks, What if?, following a question's trail, a question's world, and the questions
   from the field opened in a view's card.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t, has, fmtDate } from '../../core/i18n.js';
import { facts as loadFacts } from '../../core/facts.js';
import { REPO, THREADS } from '../../data/weave.js';
import * as Game from '../game.js';
import { titleOf } from '../play.js';
import { stopsAt } from '../../data/places.js';
import { rootShown } from '../../engines/weave.js';
import { FIGURES, CASES } from '../../data/weave.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, byLine } from '../commons.js';
import * as Read from '../read.js';
import * as Field from '../field.js';
import { whatif as whatifView } from '../whatif.js';
import * as Worlds from '../worlds.js';
import { machines as machinesView } from '../machines.js';
import { copiesInput } from '../copies.js';
import { wallsInput } from '../walls.js';
import { formsInput } from '../forms.js';
import { planInput } from '../plan.js';
import { clockInput } from '../clock.js';
import { sideInput } from '../side.js';
import { swarmInput, swarmStart } from '../swarm.js';
import { tuneInput, tuneType } from '../tunebox.js';
import { WORLD_IDS } from '../../data/worlds.js';
import { SEEK, foundAt } from '../../data/seek.js';
import { readHtml } from '../frame2.js';
import { V, $, esc, qColor, follow, followW } from '../shell.js';
import { STAGES, stageOfPlace } from '../../engines/way.js';
import { latticeHtml, drawWires } from '../lattice.js';
import { pathOf } from '../../data/lattice.js';

export function create() {
  Object.assign(V, { showPage, showRead, showMachines, showWorld, showEcosystem, showWhatif, leaveWhatif, askStop });
  /* two reading views, opened on purpose: your log (the questions you met, what you did, what waits: the loop's
     challenges are kept here, never as a menu of their own) and the Lab's record (the commons, at the place where
     the loop starts and comes back) */
  /* the map of the chip world: everything in the lab on one page. Across, a chip's life round the loop (Open, Design,
     Make, Test, Ship, Use); down, from each place through its levels; under them the four depths every chip shares.
     Each cell leads to its view; its dots are the challenges played there (filled once done); a cell you have
     been to is marked (the addresses you opened, kept in this browser) */
  const BEEN_KEY = 'osl-been';
  const beenSet = () => { try { return JSON.parse(localStorage.getItem(BEEN_KEY) || '{}'); } catch (e) { return {}; } };
  /* the Map has two arrangements (#411): by a chip's life (#/log), and by matter and layers, the lattice
     (#/log/lattice[/<path>], src/v2/lattice.js). A path lit and the matter shown on a phone change the page in place,
     and the address with them */
  let latOn = false, latPath = null, latMatter = 'silicon';
  const latAddr = () => '#/log/lattice' + (latPath ? '/' + latPath : '');
  const latticeOf = B => latticeHtml({ path: latPath, matter: latMatter, FACT, been: B, chOf: id => Game.challengeOf(id), titleOf, doHref: V.doHref, isDone: id => Game.isDone(V.S, id),
    levelHref: (p, d) => { const l = (Game.INSIDE[p] || []).find(x => x.depth === d); return l ? V.levelHref(p, l) : null; } });
  const latDraw = () => { const el = V.page.querySelector('[data-lat]'); if (!el) return; el.outerHTML = latticeOf(beenSet()); requestAnimationFrame(() => drawWires(V.page)); };
  V.page.addEventListener('click', e => {
    const pb = e.target.closest('[data-lat] [data-latpath]'), mb = e.target.closest('[data-lat] [data-latm]');   /* i18n-ok: selectors */
    if (!pb && !mb) return;
    if (pb) { latPath = latPath === pb.dataset.latpath ? null : pb.dataset.latpath;
      /* on a phone, the path's first matter comes into view */
      const P = pathOf(latPath); if (P && !P.strands.flat().some(c => c.startsWith(latMatter + '.'))) latMatter = P.strands[0][0].split('.')[0]; }
    if (mb) latMatter = mb.dataset.latm;
    history.replaceState(null, '', latAddr()); latDraw();
    /* led on along the path into another matter: its step comes into view */
    if (mb && mb.classList.contains('lat-to')) { const c = V.page.querySelector('.lat-c.lit[data-m="' + latMatter + '"]'); if (c) c.scrollIntoView({ block: 'center' }); }
  });
  addEventListener('resize', () => { if (latOn && !V.page.hidden) drawWires(V.page); });
  function mapHtml() {
    const B = beenSet(), ch = Game.CHALLENGES, doneN = L => L.filter(c => Game.isDone(V.S, c.id)).length;
    const dots = L => L.length ? '<span class="wm-dots" title="' + esc(t('page.map.ch', { n: doneN(L), of: L.length })) + '">' + L.map(c => '<a href="' + esc(V.doHref(c)) + '" class="' + (Game.isDone(V.S, c.id) ? 'on' : '') + '" aria-label="' + esc(titleOf(c)) + '"></a>').join('') + '</span>' : '';
    const placeOf = c => (c.kind === 'break' ? 'village' : c.need ? 'lab' : c.place);
    const cols = STAGES.map((st, i) => {
      const places = Game.PLACES.filter(p => (stageOfPlace(p) || 'open') === st);
      return '<div class="wm-col" data-stage="' + st + '"><div class="wm-st"><span>0' + (i + 1) + '</span>' + esc(t('loop.stage.' + st)) + '</div>' + places.map(p => {
        const href = '#/place/' + p, L = (Game.INSIDE[p] || []).filter(l => !Game.SHARED.includes(l.depth)), own = ch.filter(c => placeOf(c) === p && (!c.at || !L.some(l => l.depth === c.at)) && !Game.SHARED.includes(c.at));
        return '<div class="wm-pl' + (B[href] ? ' been' : '') + '"><a class="wm-pn" href="' + esc(href) + '">' + esc(t('map.' + p + '.t')) + '</a>' + dots(own) +
          (L.length ? '<ol>' + L.map(l => { const lh = V.levelHref(p, l), at = ch.filter(c => placeOf(c) === p && c.at === l.depth); return '<li class="' + (B[lh] ? 'been' : '') + '"><a href="' + esc(lh) + '">' + esc(t('depth.' + l.depth + '.name')) + '</a>' + dots(at) + '</li>'; }).join('') + '</ol>' : '') + '</div>'; }).join('') + '</div>'; }).join('');
    const every = Game.SHARED.map(dp => { const lh = V.levelHref('datacentre', { world: 'datacentre', depth: dp }); return '<li class="' + (B[lh] ? 'been' : '') + '"><a href="' + esc(lh) + '">' + esc(t('depth.' + dp + '.name')) + '</a>' + dots(ch.filter(c => c.at === dp)) + '</li>'; }).join('');
    /* the first page's twelve challenges, played there (src/v2/hold.js) and counted with the lab's */
    const F = Game.firstPage(localStorage), fN = F.filter(c => c.done).length, all = ch.length + F.length, got = doneN(ch) + fN;
    const first = '<div class="wm-first"><p class="wm-axis small">' + esc(t('page.map.hold')) + '</p><p class="wm-fl' + (Object.keys(B).some(k => k === '#/' || k.startsWith('#/hold')) ? ' been' : '') + '"><a href="#/">' + esc(t('hd.hero.k')) + '</a><span class="wm-dots" title="' + esc(t('page.map.ch', { n: fN, of: F.length })) + '">' +
      F.map(c => '<a href="' + c.href + '" class="' + (c.done ? 'on' : '') + '" aria-label="' + esc(t('hd.ch.' + c.id)) + '"></a>').join('') + '</span></p></div>';
    const arr = '<p class="wm-arr small" role="group" aria-label="' + esc(t('page.map.arrange')) + '"><span>' + esc(t('page.map.arrange')) + '</span>' +
      '<a href="#/log"' + (latOn ? '' : ' aria-current="true"') + '>' + esc(t('page.map.byLife')) + '</a><a href="#/log/lattice"' + (latOn ? ' aria-current="true"' : '') + '>' + esc(t('page.map.byMatter')) + '</a></p>';
    return '<section class="cwmap' + (latOn ? ' lattice' : '') + '"><header class="wm-head f2rhead"><p class="kicker">' + esc(t('loop.map')) + '</p><h1>' + esc(t('page.map.k')) + '</h1>' + arr + '<p class="lead">' + esc(t(latOn ? 'page.lat.lead' : 'page.map.lead')) + '</p>' +
      '<p class="wm-key small"><span class="wm-k1"></span>' + esc(t('page.map.keyBeen')) + '<span class="wm-k2"></span>' + esc(t('page.map.keyTodo')) + '<span class="wm-k3"></span>' + esc(t('page.map.keyDone')) + '<b>' + esc(t('page.map.ch', { n: got, of: all })) + '</b></p></header>' +
      (latOn ? latticeOf(B) : '<p class="wm-axis wm-across small">' + esc(t('page.map.across')) + '</p><div class="wm-grid">' + cols + '</div>' +
      '<div class="wm-every"><p class="wm-axis small">' + esc(t('page.map.every')) + '</p><ol>' + every + '</ol></div>' + first) + '</section>';
  }
  function showPage(k0) {
    const k = 'log'; V.pageNow = k0;
    /* the arrangement and the path lit are in the address */
    const parts = V.partsOf(location.hash); latOn = k0 === 'log' && parts[1] === 'lattice'; latPath = latOn && pathOf(parts[2]) ? parts[2] : null;
    if (latOn && !FACT) facts().then(() => { if (latOn && V.partsOf(location.hash)[0] === 'log') latDraw(); });
    /* a reading page (Read, src/v2/frame2.js): the column alone, its way back to where you came from */
    const head = '<p class="kicker">' + esc(t('loop.logK')) + '</p><h2 class="wm-logh">' + esc(t('loop.log')) + '</h2><p class="lead">' + esc(t('page.' + k + '.lead')) + '</p>';
    let h = '', hc = '';
    const C = Game.community(V.S);
    if (k === 'log') {
      const nx = Game.next(V.S);
      h += '<div class="jump"><input type="search" data-jump autocomplete="off" placeholder="' + esc(t('jump.ph')) + '" aria-label="' + esc(t('jump.ph')) + '"><div class="jumpres" data-jumpres></div></div>';
      if (nx) h += '<section class="stepsec"><h2>' + esc(t('loop.nextUp')) + '</h2><div class="grid">' + V.chCard(nx) + '</div></section>';
      const F = Game.firstPage(localStorage);
      hc += '<h2 id="log-challenges">' + esc(t('nav.challenges')) + '</h2><p class="small muted">' + esc(t(nx ? 'page.challenges.lead' : 'game.allDone')) + '</p>' +
        '<section class="stepsec" data-first><h2><span class="num">0</span>' + esc(t('page.log.hold')) + ' <span class="small muted">' + F.filter(c => c.done).length + '/' + F.length + '</span></h2><div class="stopdo">' +
        F.map(c => '<a class="dochip' + (c.done ? ' done' : '') + '" href="' + c.href + '"><span class="kicker">' + esc(t(c.done ? 'trail.did' : 'trail.do')) + '</span><b>' + esc(t('hd.ch.' + c.id)) + '</b></a>').join('') + '</div></section>' + Game.STEPS.map((s, i) => { const st = Game.stepState(V.S, s); return '<section class="stepsec"><h2><span class="num">' + (i + 1) + '</span>' + esc(t('game.step.' + s)) + ' <span class="small muted">' + esc(t('map.' + Game.STATION[s] + '.t')) + ' · ' + st.done + '/' + st.total + '</span></h2><div class="grid">' + Game.stepChallenges(s).map(V.chCard).join('') + '</div></section>'; }).join('');
      hc += '<section class="stepsec"><h2><span class="num">⚙</span>' + esc(t('game.jobs')) + ' <span class="small muted">' + esc(t('game.jobsD')) + '</span></h2><div class="grid">' + C.breaks.map(b => V.chCard(V.chOf('break:' + b.of))).join('') + C.jobs.map(V.jobCard).join('') + '</div></section>';
      /* never a list of every question: the ones you have met, as strands you can pick up again, one way to meet
         the next, and the ones you asked yourself. Only the strand you followed last shows what lies underneath. */
      const strands = Object.keys(V.S.met).filter(th => THREADS.some(x => x.id === th) && V.S.met[th].some(d => Game.trail(th).includes(d))), last = strands[strands.length - 1];
      if (strands.length) h += '<section class="stepsec"><h2>' + esc(t('page.questions.met')) + '</h2>' + strands.slice().reverse().map(th => { const ds = V.S.met[th].filter(d => Game.trail(th).includes(d)), d = ds[ds.length - 1], key = th + '.' + d;
        return '<div class="strand" style="--qc:' + qColor(key) + '"><a class="q" href="' + esc(follow(key)) + '">' + esc(t('stop.' + key + '.q')) + '</a><div class="chips">' + ds.map(x => '<a class="chipb" href="' + esc(follow(th + '.' + x)) + '">' + esc(t('depth.' + x + '.name')) + '</a>').join('') + '</div>' +
          (th === last && rootShown(V.S.met[th], Game.didOn(V.S, th)) ? '<p class="small muted">' + esc(t('ui.rootOf')) + ' <em class="rootq">' + esc(t('thread.' + th + '.root')) + '</em></p>' : '') + '</div>'; }).join('') + '</section>';
      /* what you looked for and found at a level: where, what you looked for, and the question it led into */
      const found = Object.keys(SEEK).filter(lv => foundAt(V.S.looked, lv));
      if (found.length) h += '<section class="stepsec"><h2>' + esc(t('seek.log')) + '</h2><div class="seeklog">' + found.map(lv => { const Q = SEEK[lv];
        return '<div class="strand" style="--qc:' + qColor(Q.ask) + '"><a class="kicker" href="' + esc(Q.at) + '">' + esc(V.seekWhere(lv)) + '</a><p class="small muted">' + esc(t('seek.' + lv + '.find')) + '</p><a class="q" href="' + esc(follow(Q.ask)) + '">' + esc(t('stop.' + Q.ask + '.q')) + '</a></div>'; }).join('') + '</div></section>';
      const bk = Game.BEACON[Game.STATION[Game.chipAt(V.S)]];
      h += '<section class="stepsec"><h2>' + esc(t(strands.length ? 'page.questions.next' : 'page.questions.first')) + '</h2><p class="small muted">' + esc(t('page.questions.where')) + '</p><div class="qgrid">' +
        '<a class="qcard" href="' + esc(followW(bk)) + '" style="--qc:' + qColor(bk) + '"><span class="kicker">' + esc(t('map.' + Game.STATION[Game.chipAt(V.S)] + '.t')) + '</span><span class="q">' + esc(t('stop.' + bk + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a></div></section>';
      const asked = C.W.entries.filter(e => e.kind === 'question');
      h += '<section class="stepsec"><h2>' + esc(t('page.questions.asked')) + '</h2>' + (asked.length ? asked.slice().reverse().map(V.askedHtml).join('') : '<p class="small muted">' + esc(t('page.questions.none')) + '</p>') + '</section>' + hc;
    }
    V.page.innerHTML = '<div class="inner">' + mapHtml() + readHtml({ cls: 'logpage', head, text: h + '<p class="small muted">' + esc(t('page.preview')) + '</p>' }) + '</div>'; V.page.hidden = false; V.page.scrollTop = 0;
    if (latOn) requestAnimationFrame(() => drawWires(V.page));
    if (k0 === 'challenges') { const el = $('log-challenges'); if (el) V.page.scrollTop = el.offsetTop - 96; }
  }
  /* reading: every experiment as a document (src/v2/read.js), over the island; the index is the questions and
     challenges there are, by what can be done with them now */
  function showRead(id) {
    if (!FACT) { facts().then(() => { if (V.partsOf(location.hash)[0] === 'read') showRead(id); }); return; }
    const ctx = { S: V.S, FACT, titleOf, chOf: V.chOf, didOn: Game.didOn };
    V.page.innerHTML = '<div class="inner">' + (id ? Read.experimentHtml(id, ctx) : Read.indexHtml()) + '</div>';
    V.page.classList.add('reading'); V.page.hidden = false; V.page.scrollTop = 0;
  }
  V.page.addEventListener('input', e => { const f = e.target.closest('[data-readfind]'); if (f) Read.filterIndex(V.page, f.value); if (e.target.matches('[data-cyear]')) copiesInput(e.target); if (e.target.matches('[data-forms] [data-fcode]')) formsInput(e.target); if (e.target.matches('[data-tune] [data-tin]')) tuneType(e.target); });   /* i18n-ok: selectors */
  V.page.addEventListener('click', e => { const b = e.target.closest('[data-copies] [data-cp]'); if (b) copiesInput(b); const w = e.target.closest('[data-walls] [data-wk], [data-walls] [data-wrow]'); if (w) wallsInput(w, V.S.chip); const f = e.target.closest('[data-forms] [data-fjob], [data-forms] [data-fver], [data-forms] [data-fedit], [data-forms] [data-fsig]'); if (f) formsInput(f); const pl = e.target.closest('[data-plan] [data-pk2]'); if (pl) planInput(pl, V.S.chip); const ck = e.target.closest('[data-clock] [data-clk], [data-clock] [data-clkref]'); if (ck) clockInput(ck, V.S.chip); const sb = e.target.closest('[data-side] [data-sbk]'); if (sb) sideInput(sb); const sw = e.target.closest('[data-swarm] [data-swk]'); if (sw) swarmInput(sw); const tn = e.target.closest('[data-tune] [data-tk], [data-tune] [data-tplane]'); if (tn) tuneInput(tn, e); });   /* i18n-ok: a selector */
  /* machines from shared blocks (src/v2/machines.js): a need, its machine on the stage, its layers, an agent that
     assembles it, and its challenge in Do (sub: 'do' or a layer) */
  function showMachines(need, sub) {
    V.page.innerHTML = '<div class="inner"><div data-machines></div></div>';
    V.page.hidden = false; V.page.scrollTop = 0;
    /* the claims behind new matter link to their sources in facts.json: drawn at once, and again when the facts arrive */
    const draw = () => { const el = V.page.querySelector('[data-machines]'); if (el && V.partsOf(location.hash)[0] === 'machines') machinesView(el, { need, sub, FACT, go: (id, to) => { location.hash = '#/machines/' + id + (to ? '/' + to : ''); },
      /* an attempt of yours joins the lab's curve as a draft, with its slip into the ledger */
      world: () => Game.world(V.S), keep: (id, plan, box) => keep(V.S, { kind: 'try', machine: id, plan, words: '' }, 'machine ' + id, signOf(box)),
      slip: id => slipHtml(V.S, id), slipClick: (ev, done) => slipClick(ev, V.S, () => { V.save(); V.refresh(true); done(); }), refusal, signHtml: () => signHtml(V.S) }); };
    draw(); if (!FACT) facts().then(draw);
  }
  /* a world (src/v2/worlds.js): one core question, a reading page made from its document, opened from a lens's Read more or
     by name from Your log (there is no list of the worlds); #/w/<id>/q<n> opens a question inside */
  /* where a world's questions are asked on the island: each part or level whose question belongs to it, as an address */
  const ISLE_OF = { test: ['test', null], pkg: ['port', null], ship: ['port', null] };
  function islandOf(id) {
    const seen = new Set(), out = [], depths = new Set([...Object.values(V.PARTS).flatMap(P => P.list), ...Object.values(Game.INSIDE).flatMap(L => L.map(l => l.depth))]);
    depths.forEach(d => stopsAt(d).filter(k => k.startsWith(id + '.')).forEach(k => { let href = null, label = null;
      const P = Object.keys(V.PARTS).find(pl => V.PARTS[pl].list.includes(d));
      if (P) { href = '#/place/' + P + '/' + d; label = t('map.' + P + '.t') + ' · ' + V.PARTS[P].name(d); }
      else if (ISLE_OF[d]) { href = '#/place/' + ISLE_OF[d][0]; label = t('map.' + ISLE_OF[d][0] + '.t') + ' · ' + t('depth.' + d + '.name'); }
      else { const pl = Object.keys(Game.INSIDE).find(p2 => Game.INSIDE[p2].some(l => l.depth === d));
        if (pl) { href = V.levelHref(pl, Game.INSIDE[pl].find(l => l.depth === d)); label = t('map.' + pl + '.t') + ' · ' + t('depth.' + d + '.name'); } }
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
    if (atStop) { nowStop = { th: id, d: atStop }; askOpen = false; askNo = null; askVals = { q: '', noticed: '' }; const was = V.S.met[id] || []; delete V.S.met[id]; V.S.met[id] = [...new Set([...was, atStop])]; V.save(); }
    const q = /^q(\d+)$/.exec(at || ''), shown = location.hash;
    V.page.innerHTML = '<div class="inner"><p class="muted">' + esc(t('world.loading')) + '</p></div>';
    V.page.classList.add('reading'); V.page.hidden = false; V.page.scrollTop = 0;
    const draw = P => { if (location.hash !== shown) return;
      V.page.innerHTML = '<div class="inner">' + Worlds.worldHtml(id, P, { chip: V.S.chip, q: q ? +q[1] : null, island: islandOf(id), arrive: atStop ? arriveHtml(id, atStop) : null }) + '</div>';
      swarmStart(V.page);
      const el = q && V.page.querySelector('#q' + q[1]); if (el) el.scrollIntoView({ block: 'center' }); };
    const go = () => Worlds.loadWorld(id).then(draw, () => { V.page.querySelector('.inner').innerHTML += '<p>' + esc(t('world.missing')) + '</p>'; });
    if (!FACT) facts().then(go); else go();
  }
  V.page.addEventListener('click', e => { const b = e.target.closest('[data-probe] [data-pk]'); if (b) Read.probePick(b, V.S.chip); });   /* i18n-ok: a selector */
  /* jump: type a name, go to its address. Every place, level and challenge, and the two pages; the list is never
     shown whole, only what matches */
  const jumpIndex = () => Game.PLACES.map(p => ({ name: t('map.' + p + '.t'), kind: V.kickerOf(p), href: '#/place/' + p }))
    .concat(Object.entries(Game.INSIDE).flatMap(([p, L]) => L.filter(l => p === 'datacentre' || !Game.SHARED.includes(l.depth)).map(l => ({ name: t('depth.' + l.depth + '.name'), kind: t('map.' + p + '.t'), href: V.levelHref(p, l) }))),
      Game.CHALLENGES.map(c => ({ name: titleOf(c), kind: V.whereOf(c), href: V.doHref(c) })),
      Game.firstPage(localStorage).map(c => ({ name: t('hd.ch.' + c.id), kind: t('page.log.hold'), href: c.href })),
      /* each world, a reading page, by its question (#305) */
      WORLD_IDS.map(id => ({ name: t('thread.' + id + '.root'), kind: t('jump.world'), href: '#/w/' + id })),
      [{ name: t('look.plan.t'), kind: t('map.lab.t'), href: '#/build' }, { name: t('nav.challenges'), kind: t('loop.log'), href: '#/challenges' }, { name: t('loop.outShort'), kind: t('nav.ecosystem'), href: '#/ecosystem' }]);
  V.page.addEventListener('input', e => { const f = e.target.closest('[data-jump]'); if (!f) return; const q = f.value.trim().toLowerCase(), R = q ? jumpIndex().filter(x => x.name.toLowerCase().includes(q)).slice(0, 8) : [];
    V.page.querySelector('[data-jumpres]').innerHTML = R.map(x => '<a class="jumpto" href="' + esc(x.href) + '"><b>' + esc(x.name) + '</b><span class="small muted">' + esc(x.kind) + '</span></a>').join('') || (q ? '<p class="small muted">' + esc(t('jump.none')) + '</p>' : ''); });
  V.page.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest('[data-jump]')) { const a = V.page.querySelector('.jumpto'); if (a) location.hash = a.getAttribute('href'); } });
  V.page.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if (o) { const ch = V.chOf(o.dataset.open); if (ch) location.hash = V.doHref(ch); return; }
    if (slipClick(e, V.S, redraw => { V.save(); V.refresh(true); if (redraw) showPage(V.pageNow); })) return;
    const j = e.target.closest('[data-job]'); if (j) location.hash = '#/do/' + encodeURIComponent('job:' + j.dataset.job);
  });
  /* the ecosystem: fly out to the islands; the sheet tells what lies beyond */
  function showEcosystem() {
    V.map && V.map.ecosystem(); $('outbtn').hidden = true;
    $('hero').classList.add('away'); V.sheet.onclick = null; V.sheet.oninput = null;
    V.sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(t('nav.ecosystem')) + '</p><h2>' + esc(t('page.ecosystem.title')) + '</h2><p>' + esc(t('page.ecosystem.lead')) + '</p>' +
      '<div class="isles">' + ['phones', 'cars', 'tools', 'materials', 'power', 'idea'].map(id => '<button type="button" class="isle" data-place="' + id + '" title="' + esc(t('map.' + id + '.d')) + '"><b>' + esc(t('map.' + id + '.t')) + (V.S.done[{ phones: 'phone', cars: 'car' }[id]] ? ' ✓' : '') + '</b><span class="small muted">' + esc(t('map.' + id + '.role')) + '</span></button>').join('') + '</div>' +
      '<a class="look wfgo" href="#/whatif"><b>' + esc(t('whatif.ui.kicker')) + '</b><span class="small">' + esc(t('whatif.ui.title')) + '</span></a>' +
      '<p class="kicker">' + esc(t('page.ecosystem.world')) + '</p><a class="look" href="#/supply"><b>' + esc(t('page.ecosystem.map')) + '</b><span class="small">' + esc(t('page.ecosystem.mapD')) + '</span><span class="small muted">' + esc(t('game.current')) + '</span></a>' +
      '<div class="debate2"><b>' + esc(t('debate.supply.t')) + '</b><span class="small">' + esc(t('debate.supply.q')) + '</span></div>';
    V.sheet.hidden = false; V.cur = null;
  }

  /* What if? between the islands: the levers in the sheet (a bench at the side on a desktop), the world answering */
  
  function showWhatif(lever) {
    V.map && V.map.whatifView(); $('outbtn').hidden = true; $('hero').classList.add('away'); V.hideInsp();
    V.sheet.classList.remove('inside', 'part'); V.sheet.classList.add('whatif'); V.sheet.innerHTML = ''; V.sheet.hidden = false; V.cur = null;
    V.wf = whatifView(V.sheet, { S: V.S, save: V.save, map: V.map, name: id => t('map.' + id + '.t'), close: () => { location.hash = '#/ecosystem'; } });
    if (lever) V.wf.lever(lever);
  }
  function leaveWhatif() { if (!V.wf && !V.sheet.classList.contains('whatif')) return; V.wf = null; V.map && V.map.whatif(null); V.sheet.classList.remove('whatif'); V.sheet.oninput = null; V.sheet.onchange = null; V.sheet.onclick = null; V.sheet.hidden = true; V.sheet.innerHTML = ''; }

  /* ---- following a question: one stop of a thread's trail, in the dock of the view that shows its level ---- */
  /* the figures behind a stop, each with its source, kind and the date it was checked (src/data/facts.json) */
  let FACT = null;
  const facts = () => loadFacts().then(F => (FACT = F));
  const ext = (href, html) => '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + html + '</a>';
  const figuresHtml = key => { const fs = (FIGURES[key] || []).map(id => FACT && FACT[id]).filter(Boolean); if (!fs.length) return '';
    return '<p class="kicker">' + esc(t('trail.figures')) + '</p><ul class="figs2">' + fs.map(f => '<li><b>' + esc(f.value) + '</b> ' + esc(f.label) + '<span class="small muted"> · ' + ext(f.url, esc(f.source)) + ' · ' + esc(t('trail.checked', { kind: t('fact.' + f.kind), date: fmtDate(f.verified) })) + '</span></li>').join('') + '</ul>'; };
  /* a real case that happened at this stop: what, why, and what came after, with its source */
  const casesHtml = key => CASES.filter(c => c.stop === key).map(c => '<details class="case2"><summary><span class="kicker">' + esc(t('trail.case', { year: c.year })) + '</span> <b>' + esc(t('case.' + c.id + '.t')) + '</b></summary>' +
    ['what', 'why', 'after'].map(k => '<p class="small">' + esc(t('case.' + c.id + '.' + k)) + '</p>').join('') + '<p class="small muted">' + ext(c.url, esc(t('case.' + c.id + '.src'))) + '</p></details>').join('');
  let nowStop = null, askOpen = false, askNo = null, askVals = { q: '', noticed: '' };
  function stopHtml(th, d, hrefOf = Game.askHref) {
    const T = Game.trail(th), i = T.indexOf(d), key = th + '.' + d, tried = has('stop.' + key + '.tried') ? t('stop.' + key + '.tried') : null;
    const step = (j, k) => T[j] != null ? '<a class="btn' + (k === 'next' ? ' primary' : ' ghost') + '" data-key="' + k + '" href="' + esc(hrefOf(th + '.' + T[j])) + '">' + esc(t(k === 'next' ? 'trail.next' : 'trail.prev', { level: t('depth.' + T[j] + '.name') })) + '</a>' : '<span></span>';
    let h = '<div class="stopx"><p class="kicker trailk" style="--qc:' + qColor(key) + '"><span class="dotq"></span>' + esc(t('trail.k', { level: t('depth.' + d + '.name') })) + '</p>';
    h += '<p class="line trailq">' + esc(t('stop.' + key + '.q')) + '</p><p class="small">' + esc(t('stop.' + key + '.note')) + '</p>';
    /* what you can do about it: the challenges that open this question, and the open things of the ledger that sit here */
    const dos = Game.doAtStop(key, V.S);
    if (dos.length) h += '<div class="stopdo">' + dos.slice(0, 4).map(x => x.ch ? '<a class="dochip' + (V.S.done[x.ch.id] ? ' done' : '') + '" href="' + esc(V.doHref(x.ch)) + '"><span class="kicker">' + esc(t(V.S.done[x.ch.id] ? 'trail.did' : x.ch.kind === 'break' ? 'trail.open' : 'trail.do')) + '</span><b>' + esc(titleOf(x.ch)) + '</b></a>'
      : '<a class="dochip engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + x.engine + '.t') }) })) + '"><span class="kicker">' + esc(t('trail.open')) + '</span><b>' + esc(t('trail.engine', { piece: t('build.need.' + x.engine + '.t') })) + '</b></a>').join('') + '</div>';
    if (Array.isArray(tried)) h += '<details class="more2"><summary>' + esc(t('trail.tried')) + '</summary><ul class="tried2">' + tried.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></details>';
    h += casesHtml(key) + figuresHtml(key);
    /* the questions that meet this one on a part they share: a way across, not only down */
    const X = Game.across(key);
    if (X.length) h += '<details class="more2"><summary>' + esc(t('trail.across', { n: X.length })) + '</summary>' + X.map(k2 => '<a class="askline" href="' + esc(hrefOf(k2)) + '" style="--qc:' + qColor(k2) + '"><span class="q">' + esc(t('stop.' + k2 + '.q')) + '</span></a>').join('') + '</details>';
    /* the work done for this question, by people and agents: evidence, never an answer */
    const WK = Game.workAt(key, V.S);
    if (WK.length) h += '<details class="more2"><summary>' + esc(t('trail.work', { n: WK.length })) + '</summary><p class="small muted">' + esc(t('trail.workD')) + '</p>' + WK.map(e => '<p class="small"><span class="made ' + esc(e.made) + '"></span> ' + esc(Game.entryWords(e, V.S)) + ' <span class="muted">· ' + byLine(e) + '</span></p>').join('') + '</details>';
    /* what people have asked under it, and a place for yours */
    const A = Game.askedAt(key, V.S);
    h += '<details class="more2 asked"' + (A.some(e => e.draft) || askOpen ? ' open' : '') + '><summary>' + esc(t(A.length ? 'trail.asked' : 'trail.askedNone', { n: A.length })) + '</summary>' + A.map(V.askedHtml).join('') +
      (askOpen ? '<div class="askform"><label><span class="kicker">' + esc(t('ask.q')) + '</span><input type="text" data-askq maxlength="160" value="' + esc(askVals.q) + '" placeholder="' + esc(t('ask.qPh')) + '"></label><label><span class="kicker">' + esc(t('ask.noticed')) + '</span><input type="text" data-asknoticed maxlength="240" value="' + esc(askVals.noticed) + '" placeholder="' + esc(t('ask.noticedPh')) + '"></label>' +
        signHtml(V.S) + (askNo ? '<p class="small bad">' + esc(askNo) + '</p>' : '') + '<div class="acts"><button type="button" class="btn primary" data-askkeep>' + esc(t('ask.keep')) + '</button><span class="small muted">' + esc(t('ask.rule')) + '</span></div></div>'
        : '<button type="button" class="btn" data-askown>' + esc(t('ask.own')) + '</button>') + '</details>';
    /* the question behind the question: one root at a time, once two of its stops have been met, or one after you
       have done something about it */
    if (rootShown(V.S.met[th], Game.didOn(V.S, th))) h += '<div class="root2"><p class="small muted">' + esc(t('ui.rootOf')) + '</p><p class="rootq">' + esc(t('thread.' + th + '.root')) + '</p><p class="small muted">' + esc(t('ui.behind')) + ' <em>' + esc(t('thread.' + th + '.behind')) + '</em></p></div>';
    return h + '<div class="nav"><span class="navl">' + step(i - 1, 'back') + '<button type="button" class="btn ghost" data-leave>' + esc(t('trail.leave')) + '</button></span>' + step(i + 1, 'next') + '</div></div>';
  }
  function askStop(th, d, again) {
    if (!Game.trail(th).includes(d)) return;
    if (!again) { askOpen = false; askNo = null; askVals = { q: '', noticed: '' }; }
    nowStop = { th, d };
    /* the questions you have met stay met (your state), and the strand you followed last goes to the end */
    const was = V.S.met[th] || []; delete V.S.met[th]; V.S.met[th] = [...new Set([...was, d])]; V.save();
    if (!FACT) return facts().then(() => askStop(th, d, again));
    /* met in its world: the block at the top of the world's page */
    const arrive = !V.page.hidden && V.page.querySelector('[data-arrive]');
    if (arrive && location.hash === '#/w/' + th + '/at/' + d) { arrive.innerHTML = arriveHtml(th, d); return; }
    const html = stopHtml(th, d);
    const fr = !V.vui.hidden ? V.diveFrame : !V.cui.hidden ? V.chipFrame : !V.pui.hidden ? V.dcFrame : !V.fui.hidden ? V.phFrame : !V.kui.hidden ? V.caFrame : !V.sui.hidden ? V.swFrame : !V.bui.hidden ? V.boardFrame : null;
    if (fr) {
      fr.stop(html);
      /* on the flat dive, the question's parts light up on the picture */
      if (fr === V.diveFrame && V.dive && V.dive.setThread) { V.diveThread = th; V.dive.setThread(th); }
      if (fr === V.diveFrame) requestAnimationFrame(V.diveInset);
      return;
    }
    /* a level met at its place on the island: the question in the island's dock */
    V.sheet.onclick = null; V.sheet.oninput = null;
    V.sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>' + html;
    V.sheet.hidden = false; V.sheet.scrollTop = 0; $('hero').classList.add('away');
  }
  /* asking your own, under the question in view: it is checked for a home and a question's form, kept as yours, and
     the slip leads into the ledger */
  document.addEventListener('click', e => {
    const box = e.target.closest('.stopx'); if (!box || !nowStop) return;
    const again = () => askStop(nowStop.th, nowStop.d, true);
    if (e.target.closest('[data-askown]')) { askOpen = true; again(); const f = document.querySelector('.stopx [data-askq]'); if (f) f.focus(); return; }
    if (e.target.closest('[data-askkeep]')) {
      askVals = { q: box.querySelector('[data-askq]').value.trim(), noticed: box.querySelector('[data-asknoticed]').value.trim() };
      const key = nowStop.th + '.' + nowStop.d, k = keep(V.S, { kind: 'question', at: nowStop.d, under: key, q: askVals.q, noticed: askVals.noticed }, askVals.q.split(/\s+/).slice(0, 5).join(' '), signOf(box));
      if (k.ok) { askOpen = false; askNo = null; askVals = { q: '', noticed: '' }; V.kept(k.e); } else askNo = refusal(k.r);
      return again();
    }
    if (slipClick(e, V.S, redraw => { V.save(); V.refresh(true); if (redraw) again(); })) return;
  });
  /* ---- the questions from the field (src/data/questions.js, src/v2/field.js): one opens in the card of the view
     you are in, or in the island's dock; a leak is raised when you cross its seam, the first time, and then waits
     under Ask at its home ---- */
  const frameNow = () => (!V.vui.hidden ? V.diveFrame : !V.cui.hidden ? V.chipFrame : !V.pui.hidden ? V.dcFrame : !V.fui.hidden ? V.phFrame : !V.kui.hidden ? V.caFrame : !V.sui.hidden ? V.swFrame : !V.bui.hidden ? V.boardFrame : null);
  function openField(id) {
    V.hideSeam(); const html = Field.fieldHtml(id); if (!html) return;
    if (!V.S.crossed[id]) { V.S.crossed[id] = true; V.save(); }
    const fr = frameNow(); if (fr) return fr.stop(html);
    V.sheet.onclick = null; V.sheet.oninput = null; V.cur = null;
    V.sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>' + html;
    V.sheet.classList.remove('mover', 'part', 'inside'); V.sheet.hidden = false; V.sheet.scrollTop = 0; $('hero').classList.add('away'); V.hud();
  }
  /* the energy puzzle, offered where it runs through (the fetch seam, the questions on it, energy per token): the lens
     on the dive, Follow the joule (src/v2/joule.js), at the level named, or where you are in the dive */
  document.addEventListener('click', e => {
    const j = e.target.closest('[data-joule]'); if (!j) return;
    V.S.joule.on = true; V.save(); V.hideSeam();
    if (V.Joule && !V.vui.hidden && V.flatKind === 'dive' && V.diveWorld === 'datacentre') { e.preventDefault(); return V.Joule.on(true); }
    if (j.tagName !== 'A') location.hash = '#/dive/' + (j.dataset.joule || 'chip');   /* i18n-ok */
  });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-seamx]')) return V.hideSeam();
    const f = e.target.closest('[data-field]'); if (f) { e.preventDefault(); return openField(f.dataset.field); }
    if (!e.target.closest('[data-fieldleave]')) return;
    const fr = frameNow(); if (fr) fr.look(); else V.closeSheet();
  });
  /* leaving a question: back to the view's own words */
  document.addEventListener('click', e => { const l = e.target.closest('[data-leave]'); if (!l) return;
    /* in a world's page, leaving the question goes on to the world it belongs to */
    if (l.closest('[data-arrive]')) { const w = V.page.querySelector('.warrnext'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const fr = !V.vui.hidden ? V.diveFrame : !V.cui.hidden ? V.chipFrame : !V.pui.hidden ? V.dcFrame : !V.fui.hidden ? V.phFrame : !V.kui.hidden ? V.caFrame : !V.sui.hidden ? V.swFrame : !V.bui.hidden ? V.boardFrame : null;
    if (fr) { if (fr === V.diveFrame && V.dive) { V.diveThread = null; V.dive.setThread(null); } fr.look(); } else V.closeSheet(); });
}
