/* The island's cards: the inspector beside what you tap, the lenses over the island, your chip's dials where they are
   decided, a place's card with its three doors and its inside, the Lab's inside (the commons as levels), a question
   and a thing that moves, followed.
   Glue of the shell (src/v2/app.js): create() runs once, when the view first opens; what it shares with the shell and
   the other views is on V (src/v2/shell.js). */
import { t } from '../../core/i18n.js';
import { REPO } from '../../data/weave.js';
import { childrenOf } from '../../engines/build.js';
import { WAYS } from '../../data/ways.js';
import * as Game from '../game.js';
import * as Way from '../../engines/way.js';
import { titleOf } from '../play.js';
import { stopsAt } from '../../data/places.js';
import { slipHtml, byLine } from '../commons.js';
import * as Read from '../read.js';
import * as Exp from '../../engines/experiments.js';
import * as Chip from '../../engines/chip.js';
import * as Field from '../field.js';
import { LEVERS as WF_LEVERS } from '../../engines/ripple.js';
import { V, $, esc, qColor, follow, followW } from '../shell.js';

export function create() {
  Object.assign(V, { openMover, openPlace, drawPlace, openQuestion });
  
  function drawInsp() {
    if (!V.cur) return V.hideInsp(); const id = V.cur.place, P = V.cur.part && V.PARTS[id], C = Game.community(V.S), dos = V.doList(id);
    const nDo = id === 'lab' ? C.jobs.length + C.engines.length : id === 'village' ? C.jobs.length : dos.filter(c => !V.S.done[c.id]).length, nAsk = (Game.ASK[id] || []).length + Game.debatesAt(id).length + Game.fieldsAt(id).length;
    const deep = P ? P.deeper(V.cur.part) : V.enterOf(id), cn = V.carryNote && V.carryNote.place === id ? V.carryNote : null;
    V.insp.innerHTML = '<button type="button" class="ix" data-iact="close" aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(P ? t('map.' + id + '.t') : V.kickerOf(id)) + '</p><h3>' + esc(P ? P.name(V.cur.part) : t('map.' + id + '.t')) + '</h3>' +
      '<p class="il">' + esc(P ? P.see(V.cur.part) : t('map.' + id + '.d')) + '</p>' +
      /* seen through a lens, a place offers the question that lens belongs to, where it is asked here */
      (lensQ(id) ? '<div class="ilens">' + V.askLink(lensQ(id)) + '</div>' : '') +
      (DIALS[id] && !P ? '<div class="dials"><p class="kicker">' + esc(t('dial.k')) + '</p>' + dialsHtml(id) + '</div>' : '') +
      (cn ? '<div class="icarry"><span>' + esc(cn.text) + '</span>' + (cn.ch ? '<button type="button" class="chipb" data-iact="play">' + esc(t('carry.go')) + '</button>' : '') + '</div>' : '') +
      /* the way in comes first, large, with the gestures that do the same said once beside it */
      (deep ? '<button type="button" class="igo" data-iact="deeper"><span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(P ? P.name(V.cur.part) : t('map.' + id + '.t')) + '</b></span></button><p class="small muted ihint">' + esc(t('insp.inHint')) + '</p>' : '') +
      '<div class="iacts">' +
      '<button type="button" class="chipb" data-iact="do">' + esc(t('door.do')) + (nDo ? ' <span class="n">' + nDo + '</span>' : '') + '</button>' +
      '<button type="button" class="chipb" data-iact="ask">' + esc(t('door.ask')) + (nAsk ? ' <span class="n">' + nAsk + '</span>' : '') + '</button>' +
      '<button type="button" class="chipb" data-iact="more">' + esc(t('insp.more')) + '</button></div>';
    V.insp.hidden = false; V.sheet.hidden = true; cancelAnimationFrame(V.inspRaf); inspTrack();
  }
  /* it stays beside what it is about, above it where there is room, below where there is not (a phone keeps it at the foot) */
  function inspTrack() { V.inspRaf = requestAnimationFrame(inspTrack); if (V.insp.hidden || !V.map || !V.cur) return; if (innerWidth <= 720) { V.insp.style.transform = ''; return; }
    const p = V.map.screenOf(V.cur.place, V.cur.part), r = $('stage').getBoundingClientRect(); if (!p) return; const w = V.insp.offsetWidth, h = V.insp.offsetHeight;
    /* beside it: to the right where there is room, else to the left, its middle level with the thing */
    const px = p.x * r.width, py = p.y * r.height, off = V.cur.part ? 70 : 150; let x = px + off; if (x + w > r.width - 12) x = px - off - w; let y = py - h / 2;
    x = Math.max(12, Math.min(r.width - w - 12, x)); y = Math.max(84, Math.min(r.height - h - 12, y));
    V.insp.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }
  V.insp.addEventListener('click', e => { const dl = e.target.closest('[data-dial]'); if (dl && V.cur) { turnDial(dl.dataset.dial, +dl.dataset.d); return; }
    const b = e.target.closest('[data-iact]'); if (!b || !V.cur) return; const a = b.dataset.iact;
    if (a === 'close') { V.closeSheet(); V.map && V.map.select(null); return; }
    if (a === 'deeper') { const to = V.deeperOf(V.cur.place, V.cur.part); if (to) V.enter(to); return; }
    if (a === 'play') { const ch = V.chOf(V.carryNote && V.carryNote.ch); V.carryNote = null; if (ch) location.hash = V.doHref(ch); return; }
    V.cur.tab = a === 'more' ? 'look' : a; drawPlace(); });
  /* ---- lenses: the same island seen for one thing at a time; each opens onto the question it belongs to, one at a
     time, never as a list ---- */
  const LENSES = [['look', '○'], ['heat', '≋'], ['flow', '⇄'], ['fail', '✕'], ['time', '◷']], LENS_WORLD = { heat: 'limit', fail: 'fail', time: 'make', flow: 'open' };
  const drawLens = k => { V.lensbar.innerHTML = '<div class="lb">' + LENSES.map(([id, g]) => '<button type="button" data-lens="' + id + '" aria-pressed="' + (id === k) + '" title="' + esc(t('lens.' + id + '.t')) + '"><span class="g" aria-hidden="true">' + g + '</span><span class="nm">' + esc(t('lens.' + id + '.t')) + '</span></button>').join('') + '</div>' +
    (k !== 'look' ? '<div class="lensnote"><p>' + esc(t('lens.' + k + '.d')) + '</p><a href="#/w/' + LENS_WORLD[k] + '">' + esc(t('lens.follow')) + ' →</a></div>' : ''); };
  drawLens('look');
  V.lensbar.addEventListener('click', e => { const b = e.target.closest('[data-lens]'); if (!b || !V.map) return; const k = V.map.lens() === b.dataset.lens ? 'look' : b.dataset.lens; V.map.setLens(k); drawLens(k); V.foldHero(); });
  const lensQ = id => { const k = V.map && V.map.lens(), w = k && LENS_WORLD[k]; if (!w) return null; const P = V.cur && V.cur.part && V.PARTS[id], L = P ? P.qs(V.cur.part) : (Game.ASK[id] || []); return L.find(q => q.startsWith(w + '.')) || null; };
  V.lensbar.addEventListener('click', () => { if (!V.insp.hidden) drawInsp(); });
  /* ---- change it where it is decided (docs/INTERACTION.md, "Change it in place"): your chip's settings are dials
     at the places that decide them, and what a change does is seen arriving where it shows: a light travels to those
     places, the lens that shows it comes on, and the numbers that moved are said in one line (src/engines/chip.js) ---- */
  const DIALS = { studio: ['clock', 'size'], fab: ['gen', 'load'], datacentre: ['mem', 'reuse'] };
  const DIAL_FX = { clock: [['test', 'datacentre'], 'fail'], size: [['fab', 'test'], 'fail'], gen: [['fab', 'test', 'datacentre'], 'heat'], load: [['fab', 'port'], 'time'], mem: [['datacentre'], 'heat'], reuse: [['datacentre'], 'heat'] };
  const dialMax = { clock: Chip.CLOCKS.length - 1, gen: Chip.GENS - 1, size: Chip.SIDES.length - 1, load: Chip.LOADS.length - 1, reuse: Chip.REUSES.length - 1, mem: Chip.MEMS.length - 1 };
  const dialIdx = k => (k === 'clock' ? Chip.CLOCKS.indexOf(V.S.chip.clock) : V.S.chip[k]);
  const dialText = k => { const c = V.S.chip; return k === 'clock' ? t('chip.clock.value', { v: Chip.x2(c.clock) }) : k === 'size' ? t('chip.size.value', { mm: Chip.SIDES[c.size] }) : k === 'load' ? t('chip.load.value', { v: Math.round(Chip.LOADS[c.load] * 100) }) : k === 'reuse' ? t('chip.reuse.value', { v: Chip.REUSES[c.reuse] }) : k === 'mem' ? t('chip.mem.names')[c.mem] : t('chip.gen.names')[c.gen]; };
  const dialRead = k => { const m = Chip.model(V.S.chip), pc = v => Math.round(v * 100);
    return k === 'clock' ? t('dial.read.clock', { late: pc(m.late), power: Chip.x2(m.power) }) : k === 'size' ? t('dial.read.size', { yield: pc(m.yield), power: Chip.x2(m.power) })
      : k === 'gen' ? t('dial.read.gen', { power: Chip.x2(m.power), yield: pc(m.yield), weeks: Math.round(m.days / 7) }) : k === 'load' ? t('dial.read.load', { weeks: Math.round(m.days / 7), cost: Chip.x2(m.cost) })
      : t('dial.read.mem', { busy: pc(m.busy), board: Chip.x2(m.powerBoard) }); };
  let dialLast = null;
  const dialsHtml = id => (DIALS[id] || []).map(k => '<div class="dial"><span class="dl">' + esc(t('chip.' + k + '.label')) + '</span><span class="dv"><button type="button" class="db" data-dial="' + k + '" data-d="-1"' + (dialIdx(k) <= 0 ? ' disabled' : '') + ' aria-label="−">−</button><output>' + esc(dialText(k)) + '</output><button type="button" class="db" data-dial="' + k + '" data-d="1"' + (dialIdx(k) >= dialMax[k] ? ' disabled' : '') + ' aria-label="+">+</button></span></div>' +
    (dialLast === k ? '<p class="dread">' + esc(dialRead(k)) + '</p>' : '')).join('');
  function turnDial(k, d) { const i = Math.max(0, Math.min(dialMax[k], dialIdx(k) + d)); V.S.chip[k] = k === 'clock' ? Chip.CLOCKS[i] : i; V.S.chip = Chip.normal(V.S.chip); V.save(); dialLast = k;
    const [to, lk] = DIAL_FX[k]; if (V.map) { V.map.frame([V.cur.place].concat(to)); V.map.ripple(V.cur.place, to); if (V.map.lens() !== lk) { V.map.setLens(lk); drawLens(lk); } V.map.setState(V.islandState(), false); } drawInsp(); }
  function insideHtml(id) {
    /* where a place has no levels, its first other way in is what Go inside opens: it is not offered twice */
    const L = Game.INSIDE[id] || [], extra = (Game.LOOK[id] || []).slice(L.length ? 0 : 1);
    const steps = w => ['journey', 'design'].includes(w), groups = []; L.forEach(l => { const g = groups[groups.length - 1]; if (g && steps(g[0].world) === steps(l.world)) g.push(l); else groups.push([l]); });
    let h = groups.map(G => '<p class="kicker lvk">' + esc(t(steps(G[0].world) ? 'loop.steps' : 'loop.levels')) + '</p><ol class="lvchips' + (steps(G[0].world) ? ' steps' : '') + '" aria-label="' + esc(t('door.look.d')) + '">' + G.map((l, i) => {
      const nq = stopsAt(l.depth).length, chs = Game.placeChallenges(id).filter(c => c.at === l.depth).length;
      const href = V.levelHref(id, l), fly = (Game.FLOWN[id] || {})[l.depth] != null, shared = id !== 'datacentre' && Game.SHARED.includes(l.depth);
      const note = [t('depth.' + l.depth + '.see'), fly && t('game.inside.fly'), shared && t('game.inside.shared')].filter(Boolean).join(' · ');
      /* the factory's tools are in the scene: a step selects its tool where it stands */
      if (V.isPart(id, l.depth)) return '<li><a href="#/place/' + id + '/' + l.depth + '" data-part="' + l.depth + '" title="' + esc(note) + '"><span class="i">' + (i + 1) + '</span>' + esc(t('depth.' + l.depth + '.name')) + (chs ? '<span class="dotc" role="img" aria-label="' + esc(t('game.inside.ch', { n: chs })) + '"></span>' : '') + (nq ? '<span class="qn" title="' + esc(t('game.inside.qs', { n: nq })) + '">' + nq + '</span>' : '') + '</a></li>';
      return '<li><a href="' + esc(href) + '" title="' + esc(note) + '" class="' + (shared ? 'shared' : '') + '"><span class="i">' + (i + 1) + '</span>' + esc(t('depth.' + l.depth + '.name')) + (chs ? '<span class="dotc" role="img" aria-label="' + esc(t('game.inside.ch', { n: chs })) + '"></span>' : '') + (nq ? '<span class="qn" title="' + esc(t('game.inside.qs', { n: nq })) + '">' + nq + '</span>' : '') + '</a></li>';
    }).join('') + '</ol>').join('');
    h += extra.map(l => { const href = l.to ? '#/place/' + l.to : '#/' + l.page;
      return '<a class="look" href="' + esc(href) + '"><b>' + esc(t('look.' + l.id + '.t')) + '</b><span class="small">' + esc(t('look.' + l.id + '.d')) + '</span>' + (l.world ? '<span class="small muted">' + esc(t('game.current')) + '</span>' : '') + '</a>'; }).join('');
    return h || (V.enterOf(id) ? '' : '<p class="small muted">' + esc(t('game.noLook')) + '</p>');
  }
  function openMover(m) {
    const W = Game.world(V.S), c = m.call, e = c && W.byId[c.key];
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
    V.cur = null; $('hero').classList.add('away');
    V.sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(k) + '</p><h2>' + esc(title) + '</h2><div class="door">' +
      (line ? '<p class="line">' + esc(line) + '</p>' : '') + (go ? '<button type="button" class="btn primary" data-fgo="' + go[0] + '" data-v="' + esc(go[1]) + '">' + esc(go[0] === 'place' ? t('follow.goPlace', { place: t('map.' + go[1] + '.t') }) : t('follow.go')) + '</button>' : '') +
      '<p class="small muted">' + esc(t(c ? 'follow.pullNote' : 'follow.note')) + '</p></div>';
    V.sheet.classList.add('mover'); V.sheet.classList.remove('part', 'inside'); V.sheet.hidden = false; V.sheet.scrollTop = 0; V.hud();
  }
  function openPlace(id, tab, step, piece, part) {
    V.sheet.classList.remove('mover'); dialLast = null; const quick = V.quickNext; V.quickNext = false; if (!V.carryNote || V.carryNote.place !== id) V.carryNote = null;
    V.cur = { place: id, tab: tab || 'look', step: step || null, piece: piece || null, part: part || null };
    { const to = Way.whereOf('#/place/' + id); V.crossed(V.seamFrom, to); V.seamFrom = to; }
    if (V.map) { if (!part) V.map.focus(id, { center: quick }); V.map.select(id, part); }
    /* the address says where you are: a place picked on the island is written into it (without going anywhere) */
    const at = '#/place/' + id + (part ? '/' + part : '');
    if (!step && /^#\/(place|explore|island)/.test(location.hash) && location.hash !== at && !location.hash.startsWith(at + '/')) history.pushState(null, '', at);
    $('hero').classList.add('away'); drawPlace(); if (quick) drawInsp(); V.hud(); if (V.map) V.map.setState(V.islandState(), false);
  }
  function drawPlace() {
    const id = V.cur.place, C = Game.community(V.S), asks = Game.ASK[id] || [], debates = Game.debatesAt(id), dos = V.doList(id), fields = Game.fieldsAt(id);
    const nDo = id === 'lab' ? C.jobs.length + C.engines.length : id === 'village' ? C.jobs.length : dos.filter(c => !V.S.done[c.id]).length, nAsk = asks.length + debates.length + fields.length;
    let h = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button>';
    h += '<div class="doors" role="tablist">' + ['look', 'do', 'ask'].map(k => '<button type="button" role="tab" data-door="' + k + '" aria-selected="' + (V.cur.tab === k) + '" title="' + esc(t('door.' + k + '.d')) + '"><b>' + esc(t('door.' + k)) + (k === 'do' && nDo ? ' <span class="n">' + nDo + '</span>' : k === 'ask' && nAsk ? ' <span class="n">' + nAsk + '</span>' : '') + '</b></button>').join('') + '</div>';
    const PP = V.cur.part && V.PARTS[id];
    h += PP && V.cur.tab === 'look' ? '<p class="kicker">' + esc(t('map.' + id + '.t')) + '</p><h2 class="cap">' + esc(PP.name(V.cur.part)) + '</h2><div class="door">'
      : '<p class="kicker">' + esc(V.kickerOf(id)) + '</p><h2>' + esc(t('map.' + id + '.t')) + '</h2><div class="door">';
    if (V.cur.tab === 'do') {
      if (id === 'lab') h += '<p class="small">' + esc(t('game.lab.do', { built: C.built, total: C.total })) + '</p>' + '<a class="chcard" href="#/machines"><span class="st">◇</span><span><b>' + esc(t('machines.ui.kicker')) + '</b><span class="small">' + esc(t('machines.ui.go')) + '</span></span></a>' + C.breaks.map(b => V.chCard(V.chOf('break:' + b.of))).join('') + C.jobs.map(V.jobCard).join('') + C.engines.map(e => '<a class="chcard engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + e.need + '.t') }) })) + '"><span class="st">⚙</span><span><b>' + esc(t('build.need.' + e.need + '.t')) + '</b><span class="small">' + esc(t('game.engineWanted')) + '</span></span></a>').join('') + '<a class="link" href="#/build">' + esc(t('game.seePlan')) + '</a>';
      else if (id === 'village') h += '<p class="small">' + esc(t('game.village.do')) + '</p>' + C.designs.map(V.designCard).join('') + C.jobs.map(V.jobCard).join('');
      else if (id === 'idea') h += '<p>' + esc(t('game.idea.do')) + '</p><a class="btn primary" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('game.idea.title') })) + '">' + esc(t('game.idea.propose')) + '</a>';
      else if (dos.length) h += dos.map(V.chCard).join('');
      else h += '<p class="small muted">' + esc(t('game.noDo')) + '</p>';
    } else if (V.cur.tab === 'look' && id === 'lab' && V.cur.step) {
      h += labInside();
    } else if (V.cur.tab === 'look' && V.cur.part) {
      /* a part of an open building: what it does, its question, and how to go closer (zoom in) */
      const P = V.cur.part, PP2 = V.PARTS[id], qs = PP2.qs(P);
      h += '<p class="line">' + esc(PP2.see(P)) + '</p>' +
        '<div class="zoomhint"><button type="button" class="igo" data-deeper><span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(PP2.name(P)) + '</b></span></button><span class="small muted">' + esc(t('zoom.tool.' + id)) + '</span></div>' + qs.slice(0, 1).map(V.askLink).join('') +
        '<ol class="lvchips steps" aria-label="' + esc(t('zoom.tools')) + '">' + PP2.list.map((s2, i) => '<li><button type="button" data-part="' + s2 + '"' + (s2 === P ? ' aria-current="true"' : '') + '>' + esc(PP2.name(s2)) + '</button></li>').join('') + '</ol>';
    } else if (V.cur.tab === 'look') {
      /* one line; the way in is zooming in (docs/INTERACTION.md), the card only says so; the levels as small steps */
      const enter = V.enterOf(id);
      const nx = Way.stageOfPlace(id) ? Way.nextPlace(id) : null;
      h += '<p class="line">' + esc(t('map.' + id + '.d')) + '</p>' +
        (enter ? '<div class="zoomhint"><button type="button" class="igo" data-deeper><span class="wia" aria-hidden="true">↓</span><span class="wit"><span class="wik">' + esc(t('frame.in.k')) + '</span><b>' + esc(t('map.' + id + '.t')) + '</b></span></button><span class="small muted">' + esc(t(V.PARTS[id] ? 'zoom.open' : 'zoom.place')) + '</span></div>' : '') +
        V.aroundHtml(id, nx) +
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
      h += Game.askAt(id).map(g => (g.level && Game.askAt(id).length > 1 ? '<p class="kicker">' + esc(t('depth.' + g.level.depth + '.name')) + '</p>' : '') + g.stops.map(V.askLink).join('')).join('');
      if (debates.length) h += '<p class="kicker">' + esc(t('game.debates')) + '</p>' + debates.map(d => '<div class="debate2"><b>' + esc(t('debate.' + d + '.t')) + '</b><span class="small">' + esc(t('debate.' + d + '.q')) + '</span></div>').join('');
      if (!nAsk && id !== 'lab') h += '<p class="small muted">' + esc(t('game.noAsk')) + '</p>';
    }
    V.sheet.innerHTML = h + '</div>'; V.sheet.hidden = false; V.hideInsp(); V.sheet.scrollTop = 0; V.sheet.classList.toggle('inside', id === 'lab' && !!V.cur.step && V.cur.tab === 'look'); V.sheet.classList.toggle('part', !!V.cur.part);
  }
  function openQuestion(key) {
    const pid = Object.keys(Game.BEACON).find(k => Game.BEACON[k] === key) || Object.keys(Game.ASK).find(k => Game.ASK[k].includes(key));
    if (pid) { V.cur = { place: pid, tab: 'ask' }; V.map && V.map.focus(pid); }
    $('hero').classList.add('away'); V.sheet.onclick = null; V.sheet.oninput = null;
    V.sheet.innerHTML = '<button type="button" class="x" data-close aria-label="' + esc(t('sheet.close')) + '">×</button><div class="ask big" style="--qc:' + qColor(key) + '"><p class="kicker">' + esc(pid ? t('map.' + pid + '.t') : t('sheet.ask')) + '</p><p class="q">' + esc(t('stop.' + key + '.q')) + '</p><p>' + esc(t('stop.' + key + '.note')) + '</p></div>' +
      '<div class="acts"><a class="btn primary" href="' + esc(followW(key)) + '">' + esc(t('sheet.follow')) + '</a>' + (pid ? '<button type="button" class="btn" data-place="' + pid + '">' + esc(t('game.allHere', { place: t('map.' + pid + '.t') })) + '</button>' : '') + '</div>';
    V.sheet.hidden = false;
  }
  /* ---- the Lab's inside (docs/reviews/structure.md, stage 3): the commons as levels, in the Lab's own card with the
     island behind it. The computer, then a piece of it, then the designs for that piece, each an entry of the ledger;
     and beside the computer, the record, who is here, and who makes what. There is no Build page. ---- */
  const LAB_STEPS = ['computer', 'record', 'society', 'mix'];
  function labParts() {
    const C = Game.community(V.S), P = {};
      /* the commons: the computer and whose pieces are inside it, what is open now, the record, and who makes what */
      const W = C.W, whose = id => { const d = W.inside[id] && W.byId[W.inside[id]]; return d ? ' <span class="who">' + esc(d.by) + '</span>' : ''; };
      const tree = id => { const st = C.state[id], kids = childrenOf(id); return '<ul class="tree"><li><button type="button" data-piece="' + id + '" class="node ' + st.state + (st.yours ? ' yours' : '') + '">' + esc(t('build.need.' + id + '.t')) + (st.n ? ' ×' + st.n : '') + whose(id) + '</button>' + kids.map(c => tree(c.id)).join('') + '</li></ul>'; };
      P.computer = '<div class="plan2"><div class="tower" aria-hidden="true">' + V.islandState().floors.slice().reverse().map(f => '<span class="fl ' + f + '"></span>').join('') + '</div><div><p class="big">' + esc(t('page.build.progress', { built: C.built, total: C.total })) + '</p><p class="small muted">' + esc(t('page.build.legend')) + '</p>' + tree('computer') + '</div></div>';
      P.open = '<h2>' + esc(t('page.build.open')) + '</h2><p class="small muted">' + esc(t('page.build.openD')) + '</p><div class="grid">' + C.asks.map(a => '<a class="chcard job" href="' + esc(a.under ? follow(a.under) : '#/questions') + '"><span class="st">?</span><span><span class="kicker">' + esc(t('page.build.askK', { by: a.by, n: a.work })) + '</span><b>' + esc(a.words) + '</b></span></a>').join('') + C.breaks.map(b => V.chCard(V.chOf('break:' + b.of))).join('') + C.jobs.map(V.jobCard).join('') +
        C.engines.map(e => '<a class="chcard engine" target="_blank" rel="noopener" href="' + esc(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml', title: t('game.engineFor', { piece: t('build.need.' + e.need + '.t') }) })) + '"><span class="st">⚙</span><span><b>' + esc(t('build.need.' + e.need + '.t')) + '</b><span class="small">' + esc(t('game.engineWanted')) + '</span></span></a>').join('') + '</div>';
      /* the lab broken by the people using it: every open report, loudest first, each a link to where it was seen */
      const reps = Game.frontierOf(V.S).filter(f => f.kind === 'report');
      if (reps.length) P.open += '<h2>' + esc(t('lab.reports')) + '</h2><p class="small muted">' + esc(t('lab.reportsD')) + '</p><div class="grid">' + reps.map(f => { const e = W.byId[f.of]; return '<a class="chcard report' + (e.draft ? ' draft' : '') + '" href="' + esc(e.at) + '"><span class="st">⚑</span><span><span class="kicker">' + esc(t('report.say.' + e.say)) + ' · ' + esc(e.at) + '</span><b>' + esc(e.words) + '</b><span class="small muted">' + byLine(e) + '</span></span></a>'; }).join('') + '</div>';
      /* the record: every entry, the newest first, each with who made it and where it stands now */
      const line = e => { const T = e.kind === 'break' ? W.byId[e.of] : null, T2 = e.kind === 'try' && !e.puzzle && !e.machine && !e.chef ? W.byId[e.of] : null, what = e.kind === 'design' ? t('ledger.rec.design', { title: e.title, piece: t('build.need.' + e.piece + '.t') }) : e.kind === 'break' ? t('ledger.rec.break', { title: T.title }) : T2 ? t('ledger.rec.try', { title: T2.title, n: e.facts.cases }) : e.kind === 'report' || e.kind === 'fix' || e.puzzle || e.machine || e.chef ? Game.entryWords(e, V.S) : e.q,
          links = (e.from ? ' · ' + esc(t('ledger.rec.from', { who: W.byId[e.from].by })) + ' ' + esc(W.byId[e.from].title) : '') + (e.tries && e.tries.length ? ' · ' + esc(t('ledger.tries', { n: e.tries.length })) : '') + (e.about ? ' · ' + esc(t('ledger.rec.about', { q: Game.aboutWords(e.about, W) })) : '');
        return '<li class="rec ' + e.kind + (e.draft ? ' draft' : '') + ' ' + e.state + '"><span class="made ' + esc(e.made) + '"></span><span><b>' + esc(what) + '</b><span class="small muted"> · ' + byLine(e) + ' · ' + esc(e.id.slice(0, 10)) + ' · ' + esc(t('ledger.state.' + (e.draft ? 'draft' : e.state))) + (e.brokenBy ? ' · ' + esc(t('ledger.brokenBy', { who: W.byId[e.brokenBy].by })) : '') + links + '</span>' + (e.draft ? slipHtml(V.S, e.id) : '') + '</span></li>'; };
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
    const C = Game.community(V.S), step = LAB_STEPS.includes(V.cur.step) ? V.cur.step : 'computer', i = LAB_STEPS.indexOf(step);
    const head = '<div class="labsteps" role="tablist">' + LAB_STEPS.map(k => '<button type="button" role="tab" data-labstep="' + k + '" aria-selected="' + (k === step && !V.cur.piece) + '">' + esc(t('lab.step.' + k)) + '</button>').join('') + '</div>';
    if (V.cur.piece && C.state[V.cur.piece]) { const id = V.cur.piece, st = C.state[id], ds = C.designs.filter(d => d.need === id), job = C.jobs.find(j => j.need === id), kids = childrenOf(id);
      return head + '<p class="kicker">' + esc(t('lab.pieceK', { state: t('lab.state.' + st.state) })) + '</p><h3>' + esc(t('build.need.' + id + '.t')) + (st.n ? ' ×' + st.n : '') + '</h3><p class="small">' + esc(t('build.need.' + id + '.d')) + '</p>' +
        (kids.length ? '<p class="kicker">' + esc(t('lab.madeOf')) + '</p><div class="chips">' + kids.map(c => '<button type="button" class="chipb" data-piece="' + c.id + '">' + esc(t('build.need.' + c.id + '.t')) + '</button>').join('') + '</div>' : '') +
        Game.CHALLENGES.filter(c => c.piece === id).map(c => '<a class="chcard" href="' + esc(V.doHref(c)) + '"><span class="st">' + (V.S.done[c.id] ? '✓' : '▶') + '</span><span><b>' + esc(titleOf(c)) + '</b><span class="small">' + esc(t('game.ch.' + c.id + '.goal')) + '</span></span></a>').join('') +
        (ds.length ? '<p class="kicker">' + esc(t('lab.designs', { n: ds.length })) + '</p>' + ds.map(V.designCard).join('') : '') + (job ? V.jobCard(job) : '') +
        '<div class="nav"><button type="button" class="btn ghost" data-key="back" data-labstep="computer">' + esc(t('lab.step.computer')) + '</button><span></span></div>'; }
    const P = labParts();
    return head + (step === 'computer' ? '<p class="small muted">' + esc(t('page.build.lead')) + '</p>' + P.computer + P.open : step === 'mix' ? P.mix + P.how : P[step]) +
      '<div class="nav">' + (i ? '<button type="button" class="btn ghost" data-key="back" data-labstep="' + LAB_STEPS[i - 1] + '">' + esc(t('story.back')) + '</button>' : '<button type="button" class="btn ghost" data-key="back" data-labstep="">' + esc(t('map.lab.t')) + '</button>') +
      (LAB_STEPS[i + 1] ? '<button type="button" class="btn primary" data-key="next" data-labstep="' + LAB_STEPS[i + 1] + '">' + esc(t('lab.step.' + LAB_STEPS[i + 1])) + '</button>' : '<a class="btn primary" data-key="next" href="#/place/studio">' + esc(t('loop.next', { place: t('map.studio.t') })) + '</a>') + '</div>';
  }
}
