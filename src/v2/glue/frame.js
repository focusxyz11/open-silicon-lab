/* What every view below the island shares in the frame (src/v2/frame.js, docs/SYSTEM.md): the frame made for a view,
   the thirteen as lenses under Ask (src/engines/frame.js), something to look for at a level (src/data/seek.js), the
   way a picture is fitted beside the card, and the dives' worlds.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t, has } from '../../core/i18n.js';
import { STOPS, partWord } from '../../data/weave.js';
import { MARKS, FILED } from '../../data/frame.js';
import { createLenses, questionOf as frameQ, meetOf, pairOf } from '../../engines/frame.js';
import * as Game from '../game.js';
import * as Way from '../../engines/way.js';
import { titleOf } from '../play.js';
import { stopsAt, SHARED } from '../../data/places.js';
import { slipHtml, slipClick, signHtml, signOf, keep, refusal, byLine } from '../commons.js';
import { frontAttemptsAt } from '../../engines/ledger.js';
import * as Read from '../read.js';
import * as Exp from '../../engines/experiments.js';
import { fieldAtLevel, VIEW_PARTS, diveWord } from '../../data/atlas.js';
import { SEEK, foundAt, seekLevel } from '../../data/seek.js';
import { V, esc, qColor, follow, followW } from '../shell.js';
import { WORLD_IDS } from '../../data/worlds.js';
import * as Paint from '../lenspaint.js';

export function create() {
  Object.assign(V, { seekHtml, seekTap });

  /* ---- the frame: every view below the island wears it (src/v2/frame.js, docs/SYSTEM.md) ---- */
  /* the open things of the ledger that sit at a level: a design nobody has broken where designs are checked, a
     piece nobody has built where the job is chosen. The commons is on the thing itself, not on a page of its own */
  const openAt = d => { const C = Game.community(V.S); return (d === 'check' ? C.breaks.map(b => V.chOf('break:' + b.of)) : []).filter(Boolean); };
  /* the pieces nobody has built yet are played at the Lab, not here: at the job, one way there that says so */
  const labWay = d => { if (d !== 'need') return []; const n = Game.community(V.S).jobs.length; return n ? [{ id: 'lab-pieces', title: t('bench.labPieces', { n }), where: t('bench.labWhere'), href: '#/build', open: true }] : []; };
  const frameOf = (host, o) => FrameM.createFrame(host, Object.assign({ follow, askAt: d => stopsAt(d), fieldAt: d => fieldAtLevel(d).map(q => q.id),
    /* the marks on the picture: every lens that lives here, strongest first, with the part it is about by its one name */
    marksAt: d => { const D = LENS_AT[d] || d, M = MARKS[D] || {}; return Lenses.lensesAt(D).map(id => ({ id, label: t('frame.q.' + id), icon: frameQ(id).icon, word: M[id] ? partWord(D, M[id]) : null })); },
    lensesAt: d => Lenses.lensesAt(LENS_AT[d] || d).map(id => ({ id, label: t('frame.q.' + id), hint: t('frame.q.' + id + '.hint'), icon: frameQ(id).icon })),
    lensCard: (q, d) => lensCard(q, LENS_AT[d] || d), onLens: (q, d, q2) => lightLens(q, LENS_AT[d] || d, q2), pairCard: (a, b, d) => pairCard(a, b, LENS_AT[d] || d),
    askedAt: d => { const A = Game.askedAtLevel(d, V.S); return A.length ? '<p class="kicker">' + esc(t('page.questions.asked')) + '</p>' + A.map(askedHtml).join('') : ''; },
    doAt: d => Game.CHALLENGES.filter(c => c.at === d).map(c => ({ id: c.id, title: titleOf(c), where: V.whereOf(c), href: V.doHref(c) }))
      .concat(openAt(d).map(c => ({ id: c.id, title: titleOf(c), where: V.whereOf(c), href: '#/do/' + encodeURIComponent(c.id), open: true })), labWay(d)) }, o));
  let FrameM = null;
  /* ---- the thirteen as lenses (src/data/frame.js, src/engines/frame.js): under Ask, the core questions that live at
     the level in view, one at a time, each lighting on the picture what it is about ---- */
  const Lenses = createLenses({ experiments: Exp.EXPERIMENTS, stops: STOPS, challenges: Game.CHALLENGES, doHome: Way.doHome });
  /* the flights' levels that are a level of the dive by another name */
  const LENS_AT = { campus: 'building', hall: 'building', server: 'rack', handset: 'phone', cabin: 'car' };
  const hasWord = k => has(k);
  /* each lens at a level shows a form of its own: the level's stops shared out in the lenses' order, unless the lens
     has words written for this level */
  const formsAt = d => { const used = new Set(), out = {};
    Lenses.lensesAt(d).forEach(q => { const own = hasWord('frame.at.' + q + '.' + d + '.q'), x = Lenses.lensAt(q, d), st = own ? null : x.stops.find(k => !used.has(k)) || x.stops[0] || null; if (st) used.add(st); out[q] = { own, stop: st }; });
    return out; };
  const lensLevels = () => (!V.vui.hidden && ['dive', 'line', 'bench'].includes(V.flatKind) ? V.levelsOf(V.flatKind) : null);
  function lensCard(q, d) {
    const raw = lensLevels(), L = raw && raw.map(l => LENS_AT[l] || l), x = Lenses.lensAt(q, d, L), f = formsAt(d)[q] || {}, here = Lenses.lensesAt(d);
    /* no stop and no words of its own here: the first experiment that runs through the level gives the form */
    const xs = x.experiments.map(id => Exp.experimentOf(id)).filter(Boolean), x0 = !f.own && !f.stop ? xs[0] : null;
    /* its form here: the question from the field that lives here first (it leads), then words of its own, a stop, or an experiment.
       A field question leads only in the lens that is its home (the first it is filed under), so two lenses never ask
       the same question with different notes under it (#326); the others keep their own form and its note */
    const fq = (x.field || []).find(id => (FILED.field[id] || [])[0] === q);
    const form = fq ? t('field.' + fq + '.q') : f.own ? t('frame.at.' + q + '.' + d + '.q') : f.stop ? t('stop.' + f.stop + '.q') : x0 ? Read.askOf(x0) : '', note = f.own ? t('frame.at.' + q + '.' + d + '.note') : f.stop ? t('stop.' + f.stop + '.note') : '';
    let h = '<div class="qlcard">';
    if (form) h += fq ? '<button type="button" class="qlform" data-field="' + esc(fq) + '">' + esc(form) + '</button>' : f.stop || x0 ? '<a class="qlform" href="' + esc(f.stop ? follow(f.stop) : '#/read/' + x0.id) + '">' + esc(form) + '</a>' : '<p class="qlform">' + esc(form) + '</p>';
    if (note && note !== 'stop.' + f.stop + '.note') h += '<p class="qltrue"><b>' + esc(t('frame.lens.true')) + '</b> ' + esc(note) + '</p>';
    /* when its form here is a stop of one of the worlds, that world's reading page opens from here (#305): a world is
       met through a lens, never from a list of them */
    const wd = !fq && !f.own && f.stop ? f.stop.split('.')[0] : null;
    if (wd && WORLD_IDS.includes(wd)) h += '<a class="qlread" href="' + esc(followW(f.stop)) + '"><span class="small">' + esc(t('frame.lens.read')) + '</span><b>' + esc(t('thread.' + wd + '.root')) + '</b></a>';
    /* what it repaints, with one control and what it moves, from an engine (src/v2/lenspaint.js) */
    h += Paint.instrument(q, d);
    /* the question behind it, small: its card, the lens pulled back out of every level (#/q/<id>, src/v2/qcard.js) */
    h += '<p class="qlq"><a href="#/q/' + esc(q) + '">' + esc(t(frameQ(q).word)) + '</a></p>';
    const chs = x.challenges.map(V.chOf).filter(Boolean);
    if (chs.length) h += '<p class="kicker">' + esc(t('frame.lens.play')) + '</p><div class="dolist">' + chs.map(c => '<a class="dochip" href="' + esc(V.doHref(c)) + '"><b>' + esc(titleOf(c)) + '</b><span class="small muted">' + esc(V.whereOf(c)) + '</span></a>').join('') + '</div>';
    if (x.meets) { const inner = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + esc(frameQ(x.meets).icon) + '"/></svg><span>' + esc(t('frame.lens.meets', { q: t('frame.q.' + x.meets) })) + (x.meet ? '<small>' + esc(t('frame.meet.' + x.meet)) + '</small>' : '') + '</span>';
      h += here.includes(x.meets) ? '<div class="qlmeets"><button type="button" class="qlmeet" data-lens="' + esc(x.meets) + '">' + inner + '</button>' +
        (x.meet ? '<button type="button" class="chipb qlhold" data-hold="' + esc(x.meets) + '">' + esc(t('frame.lens.hold')) + '</button>' : '') + '</div>' : '<p class="qlmeet">' + inner + '</p>'; }
    /* the other lenses living here that it meets: each can be held with it too (#315) */
    const also = here.filter(o => o !== q && o !== x.meets && meetOf(q, o));
    if (also.length) h += '<p class="kicker">' + esc(t('frame.lens.also')) + '</p><div class="chips qlalso">' + also.map(o => '<button type="button" class="chipb" data-hold="' + esc(o) + '">' + esc(t('frame.lens.holdWith', { q: t('frame.q.' + o) })) + '</button>').join('') + '</div>';
    /* up and down with the lens kept on: it stays where it lives at the next level, and is put down, saying so, where not */
    if (L && V.WE && raw) { const i = L.indexOf(d), go = (k, a) => raw[k] && V.WE.IDS.includes(raw[k]) ? '<button type="button" class="chipb qlstep" data-divego="' + V.WE.IDS.indexOf(raw[k]) + '">' + a + ' ' + esc(t('depth.' + L[k] + '.name')) + '</button>' : '';
      if (i >= 0) h += '<div class="qlsteps">' + go(i - 1, '↑') + go(i + 1, '↓') + '</div>'; }
    if (x.next) { const w = '→ ' + esc(t('frame.lens.next', { level: t('depth.' + x.next + '.name') }));
      h += L && V.WE && V.WE.IDS.includes(raw[L.indexOf(x.next)]) ? '<button type="button" class="chipb qlnext" data-divego="' + V.WE.IDS.indexOf(raw[L.indexOf(x.next)]) + '">' + w + '</button>' : '<a class="chipb qlnext" href="' + esc(Game.viewOfDepth(x.next)) + '">' + w + '</a>'; }
    /* more of it here: its other stops, then the experiments it has at this level that no stop already shows */
    const shown = new Set([f.stop].concat(x.stops)), more = x.stops.filter(k => k !== f.stop).map(k => ({ href: follow(k), q: t('stop.' + k + '.q') }))
      .concat(xs.filter(e => e !== x0 && !(e.stops || []).some(k => shown.has(k))).map(e => ({ href: '#/read/' + e.id, q: Read.askOf(e) }))).slice(0, 2);
    if (more.length) h += '<p class="kicker">' + esc(t('frame.lens.more')) + '</p><div class="asklist">' + more.map(m => '<a class="askline" href="' + esc(m.href) + '"><span class="q">' + esc(m.q) + '</span></a>').join('') + '</div>';
    return h + '</div>';
  }
  /* two lenses held (#315): where they meet, the shape it is drawn in, the pair's own question (one neither asks alone),
     what is true there, the pair's instrument, and what is still open */
  function pairCard(a, b, d) {
    const P = pairOf(a, b); if (!P) return lensCard(a, d);
    const k = P.a + '.' + P.b, w = s => 'frame.meet.' + k + s;
    let h = '<div class="qlcard qlpair" data-shape="' + P.shape + '"><p class="kicker">' + esc(t('frame.pair.where', { meet: t(w('')) })) + '</p><p class="small qlshape">' + esc(t('frame.shape.' + P.shape)) + '</p>';
    h += '<p class="qlform">' + esc(t(w('.q'))) + '</p>';
    if (has(w('.true'))) h += '<p class="qltrue"><b>' + esc(t('frame.lens.true')) + '</b> ' + esc(t(w('.true'))) + '</p>';
    h += Paint.pairInstrument(a, b, d);
    return h + '<p class="qlopen"><b>' + esc(t('frame.pair.open')) + '</b> ' + esc(t(w('.open'))) + '</p></div>';
  }
  /* the lens chosen lights its parts on the flat picture (the stop it shows, through the dive's own threads) and keeps
     only its marks on a level drawn in 3D */
  
  /* a lens repaints the picture where its paint has the level's facts (src/v2/lenspaint.js): its layer is pinned to the
     dive's level in view, and a control moved in its card repaints it */
  const paint = Paint.createLensPaint(() => V.lensWhere && V.lensWhere());
  Paint.wire(() => paint.update());
  /* a front's attempts are the ledger's (#326): read from the world (yours too, as drafts) and kept like every entry */
  Paint.useLedger({ attempts: (k, score) => frontAttemptsAt(Game.world(V.S), k, score),
    keep: (k, plan, box, words) => { const r = keep(V.S, { kind: 'try', front: k, plan, words }, 'front ' + k, signOf(box)); if (r.ok) V.save(); return r; },
    slip: id => slipHtml(V.S, id), slipClick: (ev, done) => slipClick(ev, V.S, redraw => { V.save(); done(redraw); }), refusal, signHtml: () => signHtml(V.S) });
  function lightLens(q, d, q2) {
    if (q && q2 && Paint.paintsPair(q, q2, d)) paint.show(q, d, q2); else if (q && Paint.paints(q, d)) paint.show(q, d); else paint.hide();
    if (!q && !V.lensNow) return;   /* no lens before or now: the picture is left as it is */
    if (q && V.lensNow && V.lensNow.q === q && V.lensNow.d === d) return;
    V.lensNow = q ? { q, d, stops: Lenses.lensAt(q, d).stops } : null;
    if (!V.dive || V.vui.hidden || !['dive', 'line', 'bench'].includes(V.flatKind)) return;
    const f = q ? formsAt(d)[q] : null, st = q ? (f && f.stop) || V.lensNow.stops[0] : null;
    V.diveThread = st ? st.split('.')[0] : null; V.dive.setThread(V.diveThread);
  }
  const withFrame = () => FrameM ? Promise.resolve(FrameM) : import('../frame.js').then(m => (FrameM = m));
     /* a move along is spent by the next route, or forgotten when it changed nothing */
  /* around a level (docs/INTERACTION.md, "An open world"): the levels on either side, and the same level seen at
     other stages of a chip's life (as designed, as made, in use), all as one row of ways, none of them "next" */
  const elsewhere = () => { const W = Way.whereOf(location.hash); return Way.STAGES.filter(st => st !== W.stage && Way.holds(W, st)).map(st => '<a class="chipb else" href="' + esc(Way.alongTo(W, st)) + '">' + esc(t('around.as.' + st)) + '</a>').join(''); };
  const aroundRow = (...ways) => '<span class="kicker">' + esc(t('around.k')) + '</span><span class="chips">' + ways.filter(Boolean).join('') + elsewhere() + '</span>';
  const lineHtml = (kicker, line, key, nav) => '<p class="kicker">' + esc(kicker) + '</p><p class="line">' + esc(line) + '</p>' +
    (key ? '<a class="askline" href="' + esc(follow(key)) + '"><span class="q">' + esc(t('stop.' + key + '.q')) + '</span></a>' : '') + '<div class="nav">' + nav + '</div>';

  /* ---- something to do at a level (src/data/seek.js): its question turned into a small search on the picture. The card
     says what to look for; a part tapped, on the picture or here, gives something true to notice; the part that leads
     into the question lights the question (the card's line, and its parts on the picture); finding it is kept in your
     log. The search leads to the question and never answers it. One design in the flights and in the dive; lv is the
     search's key (src/data/seek.js seekAt finds it from a view's level), fly that it is shown in a flight, whose names
     on the picture light as the card's buttons are pointed at ---- */
  const seekName = (lv, p) => { const Q = SEEK[lv]; return t('part.' + (Q.view === 'dive' ? diveWord(seekLevel(lv), p) : VIEW_PARTS[Q.view][p])); };
  function seekHtml(lv, picked, fly) {
    const Q = SEEK[lv], seen = (V.S.looked && V.S.looked[lv]) || [], found = foundAt(V.S.looked, lv), last = Q.parts.includes(picked) ? picked : null;
    return '<div class="seek' + (found ? ' found' : '') + '" data-seekat="' + esc(lv) + '" style="--qc:' + qColor(Q.ask) + '">' +
      '<p class="kicker seekk"><span>' + esc(t(found ? 'seek.foundK' : 'seek.k')) + '</span><span class="seekn" aria-label="' + esc(t('seek.n', { n: seen.length, total: Q.parts.length })) + '">' + Q.parts.map(p => '<i' + (seen.includes(p) ? ' class="on"' : '') + '></i>').join('') + '</span></p>' +
      '<p class="seekq">' + esc(t('seek.' + lv + '.find')) + '</p>' +
      '<div class="seekparts">' + Q.parts.map(p => '<button type="button" class="seekp' + (seen.includes(p) ? ' looked' : '') + (p === last ? ' on' : '') + (found && p === Q.leads ? ' seeklead' : '') + '" data-seek="' + esc(p) + '"' + (fly ? ' data-hl="' + esc(p) + '"' : '') + '>' + esc(seekName(lv, p)) + '</button>').join('') + '</div>' +
      (last ? '<p class="seeknote"><b>' + esc(seekName(lv, last)) + '</b> ' + esc(t('seek.' + lv + '.' + last)) + '</p>' : '<p class="small muted seeknote">' + esc(t('seek.tap')) + '</p>') +
      (found ? '<p class="seekfound">' + esc(t('seek.found')) + '</p>' : '') + '</div>';
  }
  /* a part looked at: kept; the first time the search is found, a word that it is in your log */
  function seekTap(lv, p) {
    const Q = SEEK[lv]; if (!Q || !Q.parts.includes(p)) return false;
    const was = foundAt(V.S.looked, lv), seen = (V.S.looked[lv] || []);
    if (!seen.includes(p)) { V.S.looked[lv] = Q.parts.filter(x => x === p || seen.includes(x)); V.save(); }
    if (!was && foundAt(V.S.looked, lv)) V.toast(t('seek.kept'));
    return true;
  }
  /* where a search is, for your log: the level, and the place it is in (a level every world shares is in all of them) */
  const seekWhere = lv => { const Q = SEEK[lv], L = seekLevel(lv);
    if (Q.view !== 'dive') return t((Q.view === 'flight' ? 'place.dc.' : 'place.phone.') + L + '.t') + ' · ' + t(Q.view === 'flight' ? 'map.datacentre.t' : 'map.phones.t');
    const w = SHARED.includes(L) ? null : Q.at.split('/')[3] || 'datacentre';
    return t('depth.' + L + '.name') + (w && DIVES[w] ? ' · ' + t('map.' + DIVES[w].place + '.t') : ''); };
  /* the card's question, lit once its search is found */
  const seekLit = (html, lv) => { const Q = SEEK[lv], at = Q && '<a class="askline" href="' + esc(follow(Q.ask)) + '"'; return Q && foundAt(V.S.looked, lv) && html.includes(at) ? html.replace(at, '<a class="askline seeklit" style="--qc:' + qColor(Q.ask) + '" href="' + esc(follow(Q.ask)) + '"') : html; };
  /* the part of the picture the frame leaves free, in pixels from each edge: the rail at the left, the bar and the way
     out at the top, and the card below where it is not a bench at the right (the canvas already ends at the bench) */
  const frameInset = fr => { const wide = innerWidth > 720, bench = innerWidth >= 1100, dw = fr && fr.dock.parentNode, host = dw && dw.parentNode;
    /* on a desktop the picture stands right of the caption at rest, and left of the side panel */
    const f2 = bench && host && host.classList.contains('f2') ? dw.getBoundingClientRect() : null, cap = !!f2 && host.classList.contains('f2cap');
    return { l: cap ? Math.max(100, Math.round(f2.right - 120)) : wide ? 100 : 10, r: f2 && !cap ? Math.round(f2.width) + 32 : wide ? 24 : 10, t: wide ? 128 : 112, b: bench ? 24 : (dw && dw.offsetHeight ? (fr.restH ? fr.restH() : dw.offsetHeight) + (wide ? 30 : 22) : 260) }; };
  /* the dive starts from any world: the data centre's chip, a phone, a car, or the made chip */
  const DIVES = {
    datacentre: { levels: V.DIVE_LEVELS, place: 'datacentre' },
    phone: { title: 'dive.phone.title', up: '#/place/phones/3', upWord: 'map.phones.t', place: 'phones' },
    car: { title: 'dive.car.title', up: '#/place/cars/3', upWord: 'map.cars.t', place: 'cars' },
    made: { title: 'dive.made.title', up: '#/place/fab', upWord: 'map.fab.t', place: 'fab', face: 'made' }
  };
  /* ---- a question's world: where it leads, what you can do about it, what people have asked under it ---- */
  /* a question someone added under a stop: its words, who asked, and (for yours) the slip that leads into the ledger */
  const askedHtml = e => '<div class="asked1' + (e.draft ? ' draft' : '') + '"><p class="q">' + esc(e.q) + '</p>' + (e.noticed ? '<p class="small">' + esc(e.noticed) + '</p>' : '') + '<p class="small muted">' + byLine(e) + (e.under ? ' · ' + esc(t('depth.' + e.at + '.name')) : '') + '</p>' + (Game.workAt(e.id, V.S).length ? '<p class="kicker">' + esc(t('trail.work', { n: Game.workAt(e.id, V.S).length })) + '</p>' + Game.workAt(e.id, V.S).map(w => '<p class="small"><span class="made ' + esc(w.made) + '"></span> ' + esc(Game.entryWords(w, V.S)) + ' <span class="muted">· ' + byLine(w) + '</span></p>').join('') : '') + (e.draft ? slipHtml(V.S, e.id) : '<p class="small muted">' + esc(t('ask.workOn')) + ' <span class="mono">' + esc(e.id) + '</span></p>') + '</div>';
  /* the lenses for a view that draws its own marks (the stack, src/v2/glue/stack.js): which live at a level, and the card
     of one there */
  const lensIds = d => Lenses.lensesAt(LENS_AT[d] || d);
  Object.assign(V, { frameOf, LENS_AT, withFrame, aroundRow, lineHtml, seekWhere, seekLit, frameInset, DIVES, askedHtml, lensIds, lensCard, pairCard });
}
