/* The flat views (src/app/world.js) in the frame: the dive (chip to atom), the line (the factory) and the bench (the
   studio, src/v2/bench.js), and the levels drawn in 3D as the dive reaches them (src/v2/level3d.js).
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t, has } from '../../core/i18n.js';
import * as Game from '../game.js';
import * as Way from '../../engines/way.js';
import { play } from '../play.js';
import { stopsAt } from '../../data/places.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick } from '../commons.js';
import { attemptsAt } from '../../engines/ledger.js';
import { createJoule } from '../joule.js';
import { diveWord, sizeOf } from '../../data/atlas.js';
import { SEEK, foundAt, seekAt } from '../../data/seek.js';
import { studioLook } from '../studio-look.js';
import { V, $, showStage, esc, follow } from '../shell.js';
import { mark as fidMark } from '../fid.js';
import { LEVELS as FID_LEVELS } from '../../data/fidelity.js';

export function create() {
  Object.assign(V, { openBench, showFlat });
  const FLAT = {
    dive: { world: 'datacentre', title: 'dive.title', up: '#/place/datacentre/5', upWord: 'map.datacentre.t', face: 'used', kicker: 'place.level', next: 'chipx.deeper', hint: 'dive.hint' },
    line: { world: 'journey', title: 'line.title', up: '#/place/fab', upWord: 'map.fab.t', face: 'made', kicker: 'line.stepN', next: 'line.next', hint: 'line.hint' },
    bench: { world: 'design', title: 'bench.title', up: '#/place/studio', upWord: 'map.studio.t', face: 'designed', kicker: 'line.stepN', next: 'line.next', hint: 'bench.hint' }
  };
  
  const FL = k => k === 'dive' ? Object.assign({}, FLAT.dive, { world: V.diveWorld }, V.DIVES[V.diveWorld]) : FLAT[k];
  let partsAt = null;   /* the parts each level's scene draws (src/app/scenes.js), for what you see here */
     /* the lens of the energy puzzle on the data centre's dive (src/v2/joule.js) */
  let divePart = null, DiveData = null;
  const levelsOf = k => FL(k).levels || DiveData.WORLDS.find(w => w.id === FL(k).world).depths;
  /* the views that are a row of steps walked along, not a column of levels */
  const rowsOf = k => k === 'line' || k === 'bench';
  let L3M = null, JOIN = { from: 0.08, to: 0.92, lead: 0.5 };
  /* the joins load with the dive (never on the first page: level3d.js brings three.js) */
  let joinsP = null;
  const ensureJoins = () => joinsP || (joinsP = Promise.all([import('../level3d.js'), import('../../engines/join.js')]).then(([m, j]) => { L3M = m; JOIN = j.JOIN; }).catch(() => { /* no joins: the flat picture between levels, as before */ }));
  const ensureDive = () => V.dive ? Promise.resolve(V.dive) : Promise.all([import('../../engines/weave.js'), import('../../app/world.js'), import('../../data/weave.js'), import('../../app/design.js'), import('../../app/journey.js'), import('../overlay.js'), import('../../app/scenes.js'), import('../kit3d.js'), ensureJoins()]).then(([E, Wm, Wd, Ds, Jm, Om, Sc, K3]) => {
    V.WE = E; DiveData = Wd; V.DS = Ds; threadColorOf = Wm.threadColor; partsAt = Sc.partsOf;
    /* the dive's words in HTML over the picture: names, the note on a picked part, the questions' marks under Ask */
    V.flatWords = Om.createOverlay($('flatLabels'), { part: key => pickPart(key), mark: th => { location.hash = follow(th + '.' + V.diveId()); }, marks: ths => markAsk(ths), door: () => V.dive.flyTo(V.diveD + 1) });
    /* a wheel over one of those words still moves the dive (as over the 3D levels' names, level3d.js) */
    $('flatLabels').addEventListener('wheel', e => { e.preventDefault(); $('diveCanvas').dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, bubbles: true, cancelable: true })); }, { passive: false });
    /* one HUD: the earlier site's own marks, dive label and band give way to the frame */
    /* one stage: the line's machines draw on the shared renderer too */
    Wm.setChrome({ dots: false, dive: false, lit: true, keys: () => (V.flatKind === 'dive' ? 'scale' : 'steps'), stage: () => K3.stage($('diveCanvas')), overlay: V.flatWords,
      look: () => !!V.diveFrame && V.diveFrame.mode() === 'look' && !V.benchCh, ask: () => !!V.diveFrame && V.diveFrame.mode() === 'ask',
      askOnly: id => (V.lensNow && V.lensNow.d === (V.LENS_AT[id] || id) ? V.lensNow.stops.map(k => k.split('.')[0]) : null) }); Jm.setBand(false);
    V.dive = Wm.createWorld($('diveCanvas'), { depth: d => diveAt(d), arrive: d => diveAt(d), zoom: z => { diveRail(z); levelZoom(z); benchZoom(z); }, part: (d, key) => { const a = l3Active(); pickPart(a ? a.obj.hit(lastTap.x, lastTap.y) : key); }, pick: th => { V.diveThread = th; V.dive.setThread(th); if (!V.benchCh && V.flatKind !== 'supply') drawDive(); },
      site: id => V.supplySite(id), mapStep: i => V.supplyStep(i) });
    return V.dive;
  });
  /* a part picked on the picture or by its name: a ring on it and its note beside its name; a tap on nothing clears it */
  
  function pickPart(key) { divePart = key || null; V.dive.select(divePart); diveNotes();
    /* at a level with a search, a part picked is a part looked at */
    const lv = seekAt('dive', V.diveId()); if (divePart && V.flatKind === 'dive' && !V.benchCh && lv && V.seekTap(lv, divePart)) { seekLight(lv); if (V.diveFrame && V.diveFrame.mode() === 'look') drawDive(); } }
  /* found: the question's parts light on the flat picture, as when you follow it */
  const seekLight = lv => { if (!foundAt(V.S.looked, lv) || V.diveThread) return; const th = SEEK[lv].ask.split('.')[0]; V.dive.setThread(th); };
  /* a mark standing for several questions: those lines light up in the dock's list */
  function markAsk(ths) {
    const want = new Set(ths.map(th => follow(th + '.' + V.diveId()))), lines = [...V.diveFrame.dock.querySelectorAll('.askline')];
    lines.forEach(a => a.classList.toggle('hit', want.has(a.getAttribute('href'))));
    const first = lines.find(a => a.classList.contains('hit')); if (first) first.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  /* the factory's 3D machines draw under the flat world on the line; nowhere else */
  const hide3d = () => { const w3 = document.getElementById('world3d'); if (w3) w3.style.display = 'none'; };
  function diveAt(d) {
    if (V.flatKind === 'supply') { V.diveD = d; return; }   /* the map stays over the line's last station */
    const id = V.WE.IDS[d];
    if (!levelsOf(V.flatKind).includes(id)) { if (V.flatKind === 'dive' && V.diveWorld === 'datacentre') location.hash = '#/place/datacentre/' + (id === 'board' ? 4 : 2); return; }   /* above the chip, the flight takes over */
    if (d !== V.diveD) { divePart = null; V.diveThread = null; V.dive.setThread(null); V.dive.select(null); }
    V.diveD = d; if (V.Joule && V.flatKind === 'dive') V.Joule.level(id); if (V.Listen) V.Listen.level(V.flatKind === 'dive' ? id : null); if (V.Bench && V.flatKind === 'bench') V.Bench.step(id); if (!V.diveFrame) return;
    const L = levelsOf(V.flatKind);
    /* a row of steps (the line, the bench): the step is lit on the line of steps, and the rail shows only the level the
       step shows, if any (src/engines/way.js, steps and levels) */
    if (rowsOf(V.flatKind)) { const lv = Way.levelOfStep(V.flatKind, id), R = Way.levelsOfSteps(V.flatKind); V.diveFrame.steps(id); V.diveFrame.rail(lv, lv ? R.indexOf(lv) / (R.length - 1) : 0); }
    else V.diveFrame.rail(id, L.indexOf(id) / (L.length - 1));
    /* the bench's way up goes back to its corner of the studio, out of its screen */
    if (V.flatKind === 'bench') { const up = V.vui.querySelector('.homebtn'), n = Way.stepsOf('bench').indexOf(id) + 1; if (up && n > 0) up.setAttribute('href', '#/place/studio/' + n); }
    V.diveFrame.level(id); diveNotes(); V.here();
    if (V.diveFrame.mode() === 'look' && !V.benchCh) drawDive();
  }
  /* words on the picture: the note on the part you picked, from its one home in the atlas. A note opens only on a
     part you pick, flat or in 3D; until then the picture and its names explain themselves */
  function diveNotes() {
    const id = V.diveId(), key = divePart;
    Object.entries(L3).forEach(([lv, l]) => { const w = key && diveWord(lv, key); if (l.obj) l.obj.select(id === lv && key ? key : null, w && EN_HAS(w) ? { title: t('part.' + w), text: t('what.' + w) } : null); });
    if (!key) return V.dive.setNotes([]);
    const w = DiveData.partWord(id, key); if (!EN_HAS(w)) return V.dive.setNotes([]);
    V.dive.setNotes([{ part: key, title: t('part.' + w), text: t('what.' + w), tone: 'cool' }]);
  }
  /* ---- the levels in 3D (src/v2/level3d.js: the chips as reliefs, the gate, the switch, the atom): as the dive reaches one, the flat picture gives
     way to a model of it on the one stage, in the same square; the flat drawing stays the fallback ---- */
  const L3 = { chip: { mod: '../relief3d.js', arg: 'chip' }, soc: { mod: '../relief3d.js', arg: 'soc' }, mcu: { mod: '../relief3d.js', arg: 'mcu' }, die: { mod: '../relief3d.js', arg: 'die' }, block: { mod: '../relief3d.js', arg: 'block' }, wafer: { mod: '../wafer3d.js' }, phone: { mod: '../phone3d.js' }, phoneboard: { mod: '../pcb3d.js', arg: 'phoneboard' }, ecu: { mod: '../pcb3d.js', arg: 'ecu' },
    gate: { mod: '../gate3d.js' }, switch: { mod: '../switch3d.js' }, atom: { mod: '../atom3d.js' } };
  /* each level writes its names in a layer of its own over the stage */
  const l3Host = lv => { let h = $('l3-' + lv); if (!h) { h = document.createElement('div'); h.className = 'labels'; h.id = 'l3-' + lv; h.hidden = true; $('flatLabels').after(h); } return h; };
  const l3Active = () => Object.values(L3).find(l => l.obj && l.obj.active());
  /* where a lens's paint stands (src/v2/lenspaint.js): under the picture's names, the plan of the dive's level in view
     pinned by its corners, on its 3D level or on the flat picture; nowhere while the dive moves or out of the dive */
  const lensWhere = () => {
    if (V.vui.hidden || V.flatKind !== 'dive' || !V.dive) return null;
    const a = l3Active(), host = $('diveCanvas').parentNode, before = $('flatLabels');
    if (a) { const c = [[0, 0], [1000, 0], [1000, 1000], [0, 1000]].map(([x, y]) => a.obj.toScreen && a.obj.toScreen(x, y)); return { host, before, corners: c.every(Boolean) ? c : null }; }
    return { host, before, corners: V.dive.planCorners ? V.dive.planCorners() : null };
  };
  const lastTap = { x: 0, y: 0 };
  $('diveCanvas').addEventListener('pointerup', e => { lastTap.x = e.clientX; lastTap.y = e.clientY; }, true);
  /* the join's windows and switch, loaded with the first level in 3D */
  const ensureL3 = lv => { const l = L3[lv]; return l.making || (l.making = import(l.mod).then(m => (l.obj = (l.arg ? m.create(l.arg) : m.create)($('diveCanvas'), l3Host(lv), { part: key => pickPart(key),
    marks: () => (V.diveFrame && V.diveFrame.mode() === 'ask' ? askMarks(lv) : null), mark: th => { location.hash = follow(th + '.' + lv); }, askMany: ths => markAsk(ths),
    /* too slow even at low settings: this level is drawn flat for the rest of the visit */
    failed: () => { if (V.dive) levelZoom(V.dive.z); } }))).catch(() => null)); };
  /* the questions at a level, grouped by the part each is about (the first of its parts): the marks under Ask */
  const askMarks = id => { const by = new Map(), only = V.lensNow && V.lensNow.d === id ? V.lensNow.stops : null; DiveData.THREADS.forEach(th => { if (only && !only.includes(th.id + '.' + id)) return; const nm = DiveData.STOPS[th.id + '.' + id], key = nm && nm[0]; if (!key) return; if (!by.has(key)) by.set(key, []); by.get(key).push({ id: th.id, color: threadColorOf(th.id) }); }); return [...by].map(([part, threads]) => ({ part, threads })); };
  let threadColorOf = () => '';
  const hideL3 = () => { Object.values(L3).forEach(l => { if (l.obj) l.obj.show(0); }); $('diveCanvas').style.opacity = ''; $('flatLabels').style.visibility = ''; if (V.dive) V.dive.setCovered(false); };
  /* a join (docs/reviews/transitions.md): between two neighbouring levels in 3D, both drawn in one frame on one camera
     path, so no flat picture shows between. Only when both models are made, neither failed, the parent has a door and
     the child a foot, joins are not off for slowness, and the move did not begin without them; else, as before */
  let unjoined = false;
  const joinOf = z => {
    const i = Math.floor(z), f = z - i, a = L3[V.WE.IDS[i]], b = L3[V.WE.IDS[i + 1]];
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
    const b = V.dive.frame, F = V.WE.frames(z, b.B, b.cx, b.cy);
    if (F.i !== ds - 1 || !F.next || F.f <= 0) return b;
    const S = 1000 * F.next.s; return { B: S, cx: F.next.tx + S / 2, cy: F.next.ty + S / 2, exact: true };
  };
  /* a jump (one call moving the zoom half a level or more: reduced motion, or a link to another level) is never a
     cut on the stage: the picture dips to the page's ground in 100 ms, the level changes at the bottom of the dip,
     and it comes back in 100 ms. Not into a join, which is a picture of its own */
  let lastZ = null, dip = 0;
  const undip = () => { clearTimeout(dip); dip = 0; const cv = document.querySelector('.stage3d'); if (cv) cv.classList.remove('dipout', 'dipin'); };
  function levelZoom(z) {
    if (!V.dive || !V.WE || V.flatKind !== 'dive' || $('diveCanvas').hidden) { lastZ = null; undip(); hideL3(); return; }
    const was = lastZ; lastZ = z;
    if (dip) return;   /* in the dip the old picture holds; the new one comes at its bottom */
    const cv = document.querySelector('.stage3d');
    if (was != null && Math.abs(z - was) >= 0.5 && cv && !cv.hidden && !(L3M && joinOf(z))) {
      cv.classList.add('dipout');
      dip = setTimeout(() => { dip = 0; cv.classList.remove('dipout'); cv.classList.add('dipin'); levelZoom(V.dive.z); setTimeout(() => cv.classList.remove('dipin'), 120); }, 100);
      return;
    }
    const J = L3M && joinOf(z);
    if (J) {
      Object.values(L3).forEach(l => { if (l.obj && l !== J.a && l !== J.b) l.obj.show(0); });
      /* a hidden level is still told where the zoom is (above it or below), so coming back to it is never taken
         for an arrival from above */
      if (J.f < JOIN.lead) { J.b.obj.show(0, J.f - 1); J.a.obj.show(1, J.f, V.dive.frame, { guest: J.b.obj }); }
      else { J.a.obj.show(0, J.f); J.b.obj.show(1, J.f - 1, V.dive.frame, { host: J.a.obj }); }
      $('diveCanvas').style.opacity = '0'; V.dive.setCovered(true); $('flatLabels').style.visibility = 'hidden'; showStage(true);
      return;
    }
    let top = 0;
    Object.entries(L3).forEach(([lv, l]) => {
      const ds = V.WE.IDS.indexOf(lv), d = z - ds, k = ds < 0 ? 0 : 1 - Math.min(1, Math.max(0, (Math.abs(d) - 0.08) / 0.32));
      if (k <= 0) { if (l.obj) l.obj.show(0, ds < 0 ? 0 : d); return; }
      if (!l.obj) { ensureL3(lv).then(o => { if (o && V.flatKind === 'dive') { levelZoom(V.dive.z); diveNotes(); } }); return; }
      if (l.obj.failed) { l.obj.show(0); return; }
      l.obj.show(k, d, squareOf(ds, z), null); top = Math.max(top, k);
      /* at a level, its neighbours are made and their shaders compiled, so a move to them can be joined */
      if (k >= 1 && !l.near) { l.near = true; [-1, 1].forEach(n => { const nb = V.WE.IDS[V.WE.IDS.indexOf(lv) + n]; if (L3[nb]) ensureL3(nb).then(o => { if (o && o.warm) o.warm(); }); }); }
    });
    /* the flat picture and its words give way to the model; the stage shows while one is there */
    $('diveCanvas').style.opacity = String(1 - top); V.dive.setCovered(top >= 0.999);
    $('flatLabels').style.visibility = top > 0.5 ? 'hidden' : '';
    showStage(top > 0);
  }
  const EN_HAS = w => has('part.' + w);
  /* the rail follows the zoom continuously, so the card can say how many times closer the next level is */
  function diveRail(z) {
    if (!V.diveFrame || !V.WE || V.flatKind !== 'dive') return;
    const L = levelsOf('dive'), i = Math.floor(z), a = L.indexOf(V.WE.IDS[i]); if (a < 0) return;
    const pos = a + (L[a + 1] && L[a + 1] === V.WE.IDS[i + 1] ? z - i : 0);
    V.diveFrame.rail(L[Math.round(pos)], pos / (L.length - 1), pos);
  }
  /* the way in, beside the square the next level lives in, with a ring on it: the door of a level drawn in 3D, else
     the portal of the flat picture (the model lies in the same square). Read while the dive is on screen */
  let ringRaf = 0;
  function diveRing() {
    ringRaf = 0; if (V.vui.hidden || !V.dive || !V.diveFrame) return;
    ringRaf = requestAnimationFrame(diveRing);
    if (V.flatKind !== 'dive') return;   /* the line rings its own machine (lineRing) */
    if (dip) return V.diveFrame.inwardAt(null);
    const a = l3Active(), p = a ? a.obj.portal() : undefined;   /* undefined: the level has no door of its own */
    V.diveFrame.inwardAt(p === undefined ? V.dive.portal : p);
  }
  function drawDive() {
    const F = FL(V.flatKind), L = levelsOf(V.flatKind), id = V.diveId(), i = L.indexOf(id), last = i === L.length - 1;
    const key = V.diveThread && DiveData.STOPS[V.diveThread + '.' + id] ? V.diveThread + '.' + id : stopsAt(id)[0];
    /* the parts this story is about are named first on the picture */
    V.dive.setLead(key && DiveData.STOPS[key] ? DiveData.STOPS[key] : [DiveData.NOTE_AT[id]].filter(Boolean));
    /* your design, where the line carries it */
    const Y = V.flatKind === 'line' && Game.yourDesign(V.S), yk = Y && ({ print: 'print', etch: 'etch', wires: 'wires' })[id];
    /* on the bench, what this station did with your design (the studio's caption, moved off the picture) */
    /* on the bench, your design's state (right or not, who wrote it, which job) is words, so it is here, not drawn */
    const benchYours = V.flatKind === 'bench' && V.Bench ? '<div class="yours benchy">' + benchWords(id) + '</div>' : '';
    const yours = benchYours + (yk ? '<div class="yours"><span class="kicker">' + esc(t('chipx.yours')) + '</span>' + esc(t('chipx.yours.' + yk, { name: t('design.proj.' + Y.p + '.t'), gates: Y.B.M.cells.length, transistors: Y.B.transistors, masks: Y.B.masks, wire: Math.round(Y.B.RT ? Y.B.RT.wl : 0) })) + '</div>' : '');
    /* a dive goes up and down; the line and the studio go earlier and later in the work */
    const [ar0, ar1] = V.flatKind === 'dive' ? ['↑ ', '↓ '] : ['← ', '→ '], nm = d => t('depth.' + d + '.name');
    /* along (the line, the studio): the next step is marked data-along, and the frame shows it on the picture too */
    const al = V.flatKind === 'dive' ? '' : ' data-along';
    const end = { dive: '<a class="chipb" href="#/island">' + esc(t('chipx.back')) + '</a>', line: '<a class="chipb" data-along href="#/place/port">' + esc(t('line.end')) + '</a>', bench: '<a class="chipb" data-along href="#/line/print">' + esc(t('bench.toFab')) + '</a>' }[V.flatKind];
    /* on the line, a station with an inside: the way into it (the machine, or what it makes), on the picture as Go inside */
    const dv = V.flatKind === 'line' && (DiveData.DIVES[id] || [])[0], inName = dv && (dv[1] === 'scanner' ? cap1(t('part.' + DiveData.partWord(id, DiveData.DIVE_PART[id]))) : nm(dv[1])),
      inHtml = dv ? '<a class="chipb" data-in data-inname="' + esc(inName) + '" href="' + esc(lineIn(id)) + '">↓ ' + esc(inName) + '</a>' : '';
    /* what you see here: the parts the level draws, each with what it does; choosing one picks it on the picture */
    const pk = V.flatKind === 'dive' && partsAt ? Object.keys(partsAt(id) || {}).filter(k => EN_HAS(DiveData.partWord(id, k)) && t('what.' + DiveData.partWord(id, k)) !== 'what.' + DiveData.partWord(id, k)) : [];
    const sk = V.flatKind === 'dive' ? seekAt('dive', id) : null;
    const hereHtml = sk ? V.seekHtml(sk, divePart) : pk.length ? '<div class="herebox"><p class="kicker">' + esc(t('place.here')) + '</p><ul class="here2">' + pk.map(k => { const w = DiveData.partWord(id, k); return '<li><button type="button" data-pick="' + esc(k) + '"' + (k === divePart ? ' class="on"' : '') + '><b>' + esc(t('part.' + w)) + '</b><span>' + esc(t('what.' + w)) + '</span></button></li>'; }).join('') + '</ul></div>' : '';
    V.diveFrame.dock.innerHTML = V.lineHtml(t('around.view.' + V.flatKind) + ' · ' + t('depth.' + id + '.name'), t('depth.' + id + '.see'), key, V.aroundRow(
      i ? '<button type="button" class="chipb" data-key="back" data-divego="' + (V.diveD - 1) + '">' + ar0 + esc(nm(L[i - 1])) + '</button>' : V.flatKind === 'dive' && V.diveWorld === 'datacentre' ? '<button type="button" class="chipb" data-key="back" data-divego="' + (V.diveD - 1) + '">' + esc(t('dive.up')) + '</button>' : '',
      last ? end : '<button type="button" class="chipb" data-key="next"' + (V.flatKind === 'dive' ? ' data-in' : al) + ' data-divego="' + (V.diveD + 1) + '">' + ar1 + esc(nm(L[i + 1])) + '</button>', inHtml || benchIn(id, 1), benchIn(id, -1)));
    /* the studio's step: what is true, the practice and its open tools, what the engines say of your design, what people try */
    const studioHtml = V.flatKind === 'bench' && V.DS ? studioLook(id, V.DS.designNow(), key) : '';
    V.diveFrame.dock.innerHTML = (sk ? V.seekLit(V.diveFrame.dock.innerHTML, sk) : V.diveFrame.dock.innerHTML).replace('<div class="nav">', studioHtml + yours + (hereHtml.startsWith('<div class="seek') ? '' : '<p class="small muted hintline">' + esc(V.flatKind === 'bench' ? t('bench.do.' + id) : t(F.hint)) + '</p>') + hereHtml + '<div class="nav">');
    if (sk) seekLight(sk);
    requestAnimationFrame(diveInset);
  }
  /* in · out at the bench: from a step that shows a level of the chip, to the step that shows the level inside it (the
     job's chip → layout's blocks → the gates) or around it. ↓ and ↑ take them; nothing at describe, check or masks */
  const benchIn = (id, dir) => { const to = V.flatKind === 'bench' && Way.inOutOfStep('bench', id, dir); if (!to) return '';
    const lv = Way.levelOfStep('bench', to), name = t('depth.' + to + '.name');
    return '<button type="button" class="chipb" ' + (dir > 0 ? 'data-in data-inname="' + esc(t('depth.' + lv + '.name') + ' · ' + name) + '"' : 'data-out') + ' data-divego="' + V.WE.IDS.indexOf(to) + '">' + (dir > 0 ? '↓ ' : '↑ ') + esc(name) + '</button>'; };
  /* the way into a station of the line (src/data/weave.js DIVES): the machine that prints with light, or what the step makes */
  const cap1 = w => w.charAt(0).toUpperCase() + w.slice(1);
  const lineIn = id => { const dv = DiveData && (DiveData.DIVES[id] || [])[0]; return dv ? '#/dive/' + dv[1] + '/' + dv[0] : null; };
  /* while the line is shown, the frame rings the machine the way in starts from, wherever the camera has it now */
  let lineRingT = 0;
  const lineRing = () => {
    clearTimeout(lineRingT);
    if (!V.dive || !V.diveFrame || V.vui.hidden || V.flatKind !== 'line') return;
    const id = V.diveId(), part = id && DiveData.DIVES[id] ? DiveData.DIVE_PART[id] : null;
    if (part && V.dive.partPoint) V.diveFrame.inwardAt(V.dive.partPoint(part) || V.dive.partPoint('chamber'));
    lineRingT = setTimeout(lineRing, 250);
  };
  /* keep the picture clear of the frame: the rail on the left, the corner, the dock below (on a phone, the card at rest) */
  /* the lens of the energy puzzle is part of the frame: on a desktop at the picture's right edge, on a phone (folded) at its
     top, and the picture keeps clear of it */
  const diveInset = () => { if (!V.dive || !V.diveFrame) return; const wide = innerWidth > 720, b = innerWidth >= 1100 ? 24 : (V.diveFrame.restH ? V.diveFrame.restH() : V.diveFrame.dock.parentNode.offsetHeight) + (wide ? 24 : 18), lens = (V.Joule && V.S.joule.on && innerWidth >= 1100 ? 356 : 0) + (V.Listen ? V.Listen.width() : 0), top = Math.max(V.Joule ? V.Joule.bottom() : 0, V.Listen ? V.Listen.bottom() : 0);
    /* the picture stands right of the caption at rest, and left of the side panel */
    const f2 = innerWidth >= 1100 && V.vui.classList.contains('f2') ? V.diveFrame.dock.parentNode.getBoundingClientRect() : null, f2cap = f2 && V.vui.classList.contains('f2cap');
    const st = rowsOf(V.flatKind) ? (wide ? 70 : 40) : 0;   /* the line of steps across the top of the picture */
    /* the bench keeps clear of the way along at the picture's foot; on a phone it stands above the card at rest and may
       be taller than wide (src/v2/bench.js) */
    /* where the way in shows too, it stands above the way along (src/styles/frame2.css), and the bench keeps clear of both;
       on a phone the strip of steps is the way along, so only the way in waits above the card at rest */
    const bench = V.Bench && V.flatKind === 'bench', phoneB = bench && !wide, wi = V.vui.querySelector(':scope > .wayin'), inV = bench && !!wi && !wi.hidden,
      last = phoneB && !!V.vui.querySelector(':scope > .steps2 [data-stepgo="1"][disabled]'),
      bb = !bench ? b : innerWidth >= 1100 ? b + 62 + (inV ? 62 : 0) : phoneB ? b + (inV || last ? 64 : 8) + (inV && last ? 52 : 0) : b + 56 + (inV ? 56 : 0), tt = (top ? top + 8 : wide ? 122 : 116) + st;
    V.dive.setInset({ l: f2cap ? Math.max(90, Math.round(f2.right - 120)) : wide ? 90 : 8, r: (f2 && !f2cap ? Math.round(f2.width) + 32 : wide ? 20 : 8) + lens, t: tt, b: bb });
    if (bench) { const f = V.dive.frame, ah = $('diveCanvas').clientHeight - tt - bb; V.Bench.place(Object.assign({}, f, phoneB ? { h: Math.min(ah - 8, f.B * 1.5), top: tt + 4 } : { h: f.B })); }
    /* a level drawn in 3D takes its square when the zoom moves; it is told now, so it moves with the frame */
    if (V.flatKind === 'dive' && V.WE) levelZoom(V.dive.z); };
  /* the bench: a design challenge played in the dock; the drawings above follow your description */
  /* the bench shows the design a challenge played there is about (a design to fix, an evolved circuit, a scrambled
     layout), and follows it after every tap; else your own (src/v2/bench.js) */
  const syncDesign = () => { if (V.Bench && V.flatKind === 'bench') V.Bench.changed(); };
  /* your design's state in the card, in words: right or not, who wrote it, which job, and what this step did with it */
  function benchWords(id) {
    const D = V.Bench.now(), B = D.B, st = B.errs.length ? 'errs' : B.spec ? (B.bad ? 'wrong' : 'right') : 'free', vars = { bad: B.bad || 0, total: B.total || 0, errs: B.errs.length };
    return '<span class="kicker">' + esc(t('chipx.yours')) + ' · ' + esc(t('design.proj.' + D.p + '.t')) + '</span><p class="verdict ' + (st === 'right' || st === 'free' ? 'good' : 'bad') + '" data-by="' + D.by + '">' + esc(t('design.state.' + st, vars) + ' · ' + t('build.by.' + D.by)) + '</p>' + esc(V.Bench.caption(id));
  }
  const benchRefresh = () => { if (V.flatKind !== 'bench' || !V.Bench || !V.diveFrame) return; const y = V.diveFrame.dock.querySelector('.benchy'); if (y) y.innerHTML = benchWords(V.diveId()); };
  function openBench(ch) {
    V.benchCh = ch; const dock = V.diveFrame.dock; dock.classList.add('benchdock'); if (V.Bench && V.flatKind === 'bench') V.Bench.challenge(ch); V.diveFrame.doing();
    V.withLabs(() => { if (V.benchCh !== ch) return;
      play(dock, ch, { state: V.S, startChip: () => Object.assign({}, Game.START), bench: V.flatKind === 'bench' ? V.Bench : null,
        save: () => { V.save(); syncDesign(); }, kept: V.kept,
        open: c => { location.hash = V.doHref(c); },
        back: () => V.diveFrame.look(),
        /* won: the island grows, and a design's drawings fly to your gates */
        done: c => { V.won(c); if (V.flatKind === 'bench' && c.kind === 'design') V.dive.flyTo(V.WE.IDS.indexOf('gates')); } });
      requestAnimationFrame(diveInset); });
  }
  /* while the step line moves, the bench slides with it: the step nearest is drawn, offset by how far the line is from it */
  function benchZoom(z) {
    if (!V.Bench || V.flatKind !== 'bench' || !V.WE) return;
    const d = Math.round(z), id = V.WE.IDS[d];
    if (levelsOf('bench').includes(id)) V.Bench.step(id);
    V.Bench.slide(Math.abs(z - d) < 0.002 ? 0 : z - d);
  }
  function showFlat(kind, depth, chId, world) {
    V.hideAll(); document.body.classList.add('immersive'); V.flatKind = kind; V.vui.dataset.flat = kind; V.benchCh = null; if (kind === 'dive') V.diveWorld = V.DIVES[world] ? world : 'datacentre';
    $('diveCanvas').hidden = false; V.vui.hidden = false; $('flatLabels').hidden = false;
    V.loading(true); V.lastPlace = kind === 'dive' ? V.DIVES[V.diveWorld].place : { line: 'fab', bench: 'studio' }[kind];
    return Promise.all([V.withFrame(), ensureDive(), kind === 'bench' ? import('../bench.js') : null]).then(([, w, BkM]) => {
      const F = FL(kind); V.WE.setWorld(F.world); w.setMap(null); V.diveFrame && V.diveFrame.dock.classList.remove('supdock'); if (kind !== 'line') hide3d(); V.DS.setBandCaption(false);
      /* the bench: your design, live, on a surface over the studio's picture (src/v2/bench.js); a first visit opens on
         the lab's working example for the first piece, the half adder */
      V.DS.setSurface(kind === 'bench');
      if (kind === 'bench') {
        if (!V.Bench) { V.Bench = BkM.createBench({ state: V.S, save: V.save, before: $('flatLabels'), go: (st, line) => { V.dive.flyTo(V.WE.IDS.indexOf(st)); setTimeout(() => V.Bench.focusLine(line), 1200); } }); V.Bench.listen(benchRefresh);
          /* on a phone, working on the bench lets the card down, as a touch on any picture does */
          V.Bench.el.addEventListener('pointerdown', () => { if (innerWidth <= 720 && V.vui.peekDown) V.vui.peekDown(); }, true); }
        V.Bench.challenge(null); V.Bench.show(true); const D = V.Bench.now(); V.DS.setDesign(D.B, D.by);
      }
      const L = levelsOf(kind);
      V.diveFrame = V.frameOf(V.vui, { up: { href: F.up, label: t(F.upWord) }, path: [{ href: '#/island', label: t('place.back') }, { href: F.up, label: t(F.upWord) }, { label: t(F.title) }],
        rail: rowsOf(kind) ? { label: t('frame.levels.' + kind), optional: true, items: Way.levelsOfSteps(kind).map(k => ({ id: k, label: t('depth.' + k + '.name'), size: sizeOf(k) })) }
          : { label: t('place.levels'), items: L.map(k => ({ id: k, label: t('depth.' + k + '.name'), size: kind === 'dive' ? sizeOf(k) : null })) },
        /* in a row of steps the rail's levels lead to the step that shows them; the steps are walked along their own line */
        steps: rowsOf(kind) ? { label: t('frame.steps.' + kind), items: L.map(k => ({ id: k, label: t('depth.' + k + '.name') })) } : null,
        onStep: k => w.flyTo(V.WE.IDS.indexOf(k)),
        /* how true a level's picture of the dive is (#325, src/data/fidelity.js): its mark in the caption */
        fidAt: kind === 'dive' ? d => fidMark(FID_LEVELS[d]) : null,
        onRail: k => { const s = rowsOf(kind) ? Way.stepOfLevel(kind, k, V.diveId()) : k; if (s) w.flyTo(V.WE.IDS.indexOf(s)); }, onLook: () => { if (V.benchCh) { V.benchCh = null; const dk = V.diveFrame.dock; dk.classList.remove('benchdock'); dk.onclick = null; dk.oninput = null; dk.onpointerdown = dk.onpointermove = dk.onpointerup = null; if (V.Bench && V.flatKind === 'bench') V.Bench.challenge(null); } drawDive(); }, caption: true }); V.watchDock();
      /* the data centre's dive wears the lens of the energy puzzle: Follow the joule */
      V.vui.classList.remove('jouling');
      V.Joule = kind === 'dive' && V.diveWorld === 'datacentre' ? createJoule(V.vui, { S: V.S, save: V.save,
        keep: (plan, el) => keep(V.S, { kind: 'try', puzzle: 'energy', plan, words: '' }, 'energy', signOf(el)),
        slip: id => slipHtml(V.S, id), slipClick: (ev, done) => slipClick(ev, V.S, redraw => { V.save(); V.refresh(true); done(redraw); }),
        refusal, signHtml: () => signHtml(V.S), attempts: () => attemptsAt(Game.world(V.S), 'energy'), changed: () => requestAnimationFrame(diveInset) }) : null;
      if (V.Joule) V.Joule.redraw();
      /* Listen (#316, only with ?listen=1): the block slowed down until it can be heard, a switch beside the joule's
         (src/v2/listen.js); its code loads only with the flag */
      V.Listen = null;
      if (kind === 'dive' && /[?&]listen=1(&|$)/.test(location.search)) import('../listen.js').then(m => { if (V.flatKind !== 'dive' || V.vui.hidden) return;
        V.Listen = m.createListen(V.vui, { where: lensWhere, joule: () => { if (V.Joule && V.S.joule.on) V.Joule.on(false); }, changed: () => requestAnimationFrame(diveInset) }); V.Listen.level(V.diveId()); });
      V.vui.onclick = e => { const b = e.target.closest('[data-divego]'); if (b) w.flyTo(+b.dataset.divego); const sk = e.target.closest('[data-seek]'); if (sk) return pickPart(sk.dataset.seek); const pk = e.target.closest('[data-pick]'); if (pk) { pickPart(pk.dataset.pick === divePart ? null : pk.dataset.pick); V.vui.querySelectorAll('[data-pick]').forEach(x => x.classList.toggle('on', x.dataset.pick === divePart)); } };
      const d = V.WE.IDS.indexOf(L.includes(depth) ? depth : L[0]);
      V.loading(false); w.start(); w.setZ(d); if (!ringRaf) ringRaf = requestAnimationFrame(diveRing); if (V.arriving && kind === 'line') w.arrive(); V.arriving = false; V.diveD = -1; diveAt(d); $('diveCanvas').focus({ preventScroll: true });
      lineRing();
      const ch = chId && Game.challengeOf(chId); if (ch) openBench(ch);
    });
  }
  Object.assign(V, { levelsOf, ensureDive, hide3d, hideL3, diveInset, lensWhere });
}
