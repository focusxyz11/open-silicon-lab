/* The shell around the world: the top bar, the depth rail at the left, and the card at the right.
   There is one thing on screen, the dive. A question is met on the part of a scene it is about; once
   picked, it stays with you as you go deeper or higher, and changes form at every depth it reaches.
   The rail shows the depths and where the question you follow has a form, joined by its colour.
   The worlds in the top bar choose where the dive starts: a data centre, a phone or a car. They meet below.
   At a stop, the card can also show the figures behind it (with their sources), real cases, and the
   companion: a prompt for any AI assistant that looks for the question behind the question. Where a question
   has no form yet, the card invites the visitor to write one (on GitHub, through the question form).
   Your chip: at some stops a "Try it" changes one of its settings (src/engines/chip.js); every depth that
   shows your chip then says what changed there, and its scene changes too. */
import { t, fmtDate, has } from '../core/i18n.js';
import { SITES, ROUTES } from '../data/world.js';
import { status, worst } from '../engines/supply.js';
import { THREADS, WORLDS, STOPS, CASES, FIGURES, REPO, TRIES, SHOWS, DIVES, EXITS, MADE, PLANTS, LOOP, partWord } from '../data/weave.js';
import { CLOCKS, GENS, SIDES, LOADS, REUSES, MEMS, START, CHALLENGES, normal, changed, model, x2, dieSquare } from '../engines/chip.js';
import { N, IDS, WORLD, setWorld, worldOf, zIn, reshape, isLine, clampZ, sizeAt, sizeParts, stop, stopKey, crossing, below, above, nearest, threadOf, rootShown, threadDepths } from '../engines/weave.js';
import { createWorld, threadColor, theme, reduced } from './world.js';
import { setChip as drawChip, setBuild, BUILD_STEPS, setXray, xrayOf, XRAY_AT } from './scenes.js';
import { TYPES as XTYPES, shares, askFor } from '../engines/xray.js';
import { build as buildDesign, normalDesign, starterOf, PROJECTS, START_DESIGN } from '../engines/design.js';
import { setDesign, setMine } from './design.js';
import { DESIGNS, NEEDS, AGENT } from '../data/build.js';
import { DEBATES, debateAt } from '../data/debates.js';
import { WAYS, wayAt, wayOf } from '../data/ways.js';
import { perOp, cold, reach, landauer, TEMPS } from '../engines/floor.js';
import { live, MISSIONS, MISSION_IDS, LIVES_AT, MARGINS, PROTECT, PERFECT, CAUSES, normalLife } from '../engines/life.js';
import { plan, progress, needForProject, childrenOf } from '../engines/build.js';

const KEY = 'osl-weave-v1';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };

/* your chip reaches the scenes and the zoom: on the wafer, the chip the dive follows is as large as yours */
const setChip = c => { drawChip(c); reshape('wafer', { portal: dieSquare(c.size) }); reshape('die', { m: SIDES[c.size] / 1000 }); };

export function start(facts) {
  const FACT = Object.fromEntries((facts || []).map(f => [f.id, f]));
  const $ = id => document.getElementById(id);
  const saved = load();
  setWorld(worldOf(saved.world) ? saved.world : WORLDS[0].id);
  const S = {
    z: typeof saved.z === 'number' ? clampZ(saved.z) : 0,
    thread: threadOf(saved.thread) ? saved.thread : null,
    seen: saved.seen && typeof saved.seen === 'object' ? saved.seen : {},
    from: typeof saved.from === 'string' ? saved.from : null,
    chip: normal(saved.chip || START),
    design: normalDesign(saved.design || START_DESIGN),
    /* who wrote the description now (you, an AI, both), and the jobs you have finished here */
    by: ['you', 'ai', 'both'].includes(saved.by) ? saved.by : 'you',
    done: Array.isArray(saved.done) ? saved.done.filter(p => PROJECTS.includes(p)) : [],
    /* your description for every job you have tried, so switching jobs keeps your work; and a copy the factory spoiled (a number), or none */
    codes: saved.codes && typeof saved.codes === 'object' ? Object.fromEntries(Object.entries(saved.codes).filter(([k, v]) => PROJECTS.includes(k) && typeof v === 'string').map(([k, v]) => [k, v.slice(0, 4000)])) : {},
    defect: null,
    /* your chip's life: where it lives, and what the design and the factory do about it (src/engines/life.js) */
    /* the chips seen as die photos, and which kinds of block you have found on each */
    xray: { on: !!(saved.xray && saved.xray.on), found: Object.fromEntries(XRAY_AT.map(id => [id, (saved.xray && saved.xray.found && Array.isArray(saved.xray.found[id]) ? saved.xray.found[id] : []).filter(k => XTYPES.includes(k))])) },
    xpick: null,
    /* the temperature tried at the physics floor */
    cold: 3,
    life: { m: MISSION_IDS.includes(saved.life && saved.life.m) ? saved.life.m : MISSION_IDS[0], c: normalLife(saved.life && saved.life.c) },
    build: BUILD_STEPS - 1
  };
  setChip(S.chip); setXray(S.xray.on);
  /* your design as built now: for the core, with your ALU slice inside */
  const cur = () => buildDesign(Object.assign({}, S.design, { slice: S.codes.alu || starterOf('alu'), regs: { bit: S.codes.regbit || null, select: S.codes.select || null }, defect: S.defect }));
  setDesign(cur()); setMine(S.done, S.by);
  if (!worldOf(WORLD).line && !worldOf(WORLD).hidden) S.lastDive = WORLD;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ world: WORLD, z: Math.round(world.z * 100) / 100, thread: S.thread, seen: S.seen, chip: S.chip, from: S.from, design: S.design, by: S.by, done: S.done, codes: S.codes, life: S.life, xray: { on: S.xray.on, found: S.xray.found } })); } catch (e) { /* storage unavailable */ } };

  const depthName = d => t('depth.' + IDS[d] + '.name');
  /* how far down (in a dive), or which station (on the line) */
  const across = z => { if (isLine()) return t('ui.station', { n: Math.round(z) + 1, total: N }); const [n, unit] = sizeParts(sizeAt(z)); return t('ui.across', { n, unit }); };
  const railNote = d => isLine() ? t('station.' + IDS[d] + '.when') : across(d);
  const q = (th, d) => t('stop.' + stopKey(th, d) + '.q');

  /* ---- the world ---- */
  const world = createWorld($('world'), {
    zoom(z) { const a = $('acrossNow'); if (a) a.textContent = across(z); railNow(z); },
    depth(d) { see(d); if (S.map) world.setMap(mapState()); card(); rail(); save(); },

    arrive(d) { see(d); if (S.map) world.setMap(mapState()); card(); rail(); save(); },
    pick(th) { follow(th); },
    part(d, key) {
      const id = IDS[d];
      /* in X-ray, a tap names the kind of block, and may be the one you were asked to find */
      if (xrayHere(id)) { const want = nextFind(id); S.xpick = { id, type: key, want }; if (key === want) S.xray.found[id] = S.xray.found[id].concat(key); save(); card(); return; }
      S.part = { id, key }; card();
    },
    /* the lens over a machine at work: down into what it shows */
    lens(d) { const id = IDS[d], dv = DIVES[id] && DIVES[id][0]; if (dv) { enter(dv[0], dv[1]); S.from = id; save(); card(); } },
    /* the world around the line */
    map() { if (S.map) closeMap(); else openMap(); },
    site(id) { if (!S.map) return; S.map.site = S.map.site === id ? null : id; if (S.map.site) { const r = ROUTES[S.map.world], i = r.findIndex(st => st.at.includes(id)); if (i >= 0) S.map.step = i; } showMap(); },
    mapStep(i) { if (!S.map) return; S.map.step = i; S.map.site = null; showMap(); }
  });
  world.setZ(S.z);

  /* ---- the world around the line (src/app/map.js): a chip's whole trip, from design to where it is used ---- */
  /* which step of a trip the station you are at belongs to */
  const STEP_OF = { crystal: 'wafers', slice: 'wafers', clean: 'fab', deposit: 'fab', print: 'fab', etch: 'fab', implant: 'fab', wires: 'fab', test: 'fab', pkg: 'package' };
  const stepAt = (w, station) => { const r = ROUTES[w]; let i = r.findIndex(st => st.id === STEP_OF[station]); if (i < 0) i = r.findIndex(st => st.st === station); return i < 0 ? null : i; };
  function mapState() {
    const m = S.map, r = ROUTES[m.world], here = isLine() ? stepAt(m.world, IDS[Math.round(world.z)]) : null, focus = r[m.step] || r[here] || r[0];
    const first = m.site || focus.at[0] || (focus.flow[0] || [])[1] || 'hsc';
    return { route: r, world: m.world, step: m.step, here, site: m.site, closed: new Set(m.closed), st: status(r, m.closed), from: SITES[first] };
  }
  function showMap() { if (!S.map) return; world.setMap(mapState()); card(); }
  function openMap(w) {
    const route = w || S.mapWorld || 'datacentre', here = isLine() ? stepAt(route, IDS[Math.round(world.z)]) : null;
    S.map = { world: route, step: here != null ? here : 0, site: null, closed: [] }; S.mapWorld = route; S.part = null;
    showMap();
  }
  function closeMap() { S.map = null; world.setMap(null); card(); }

  /* A question you follow remembers the depths where you met it. */
  function see(d) {
    if (!S.thread || !stop(S.thread, d)) return;
    const s = new Set((S.seen[S.thread] || []).filter(x => typeof x === 'string')); s.add(IDS[d]); S.seen[S.thread] = [...s];
  }
  function follow(th) {
    S.thread = th; world.setThread(th); S.part = null;
    const d = Math.round(world.z);
    if (!stop(th, d)) { const n = nearest(th, d); if (n != null) world.flyTo(n); }
    see(d); card(); rail(); save();
  }
  function letGo() { S.thread = null; world.setThread(null); world.setAnchor(null); card(); rail(); save(); }

  /* ---- the rail ---- */
  const railEl = $('rail');
  const buildRail = () => railEl.innerHTML = '<ol>' + IDS.map((id, d) => '<li><button type="button" data-d="' + d + '"><i></i><b>' + esc(t('depth.' + id + '.name')) + '</b><small>' + esc(railNote(d)) + '</small></button></li>').join('') + '</ol><span class="railnow" id="railNow"></span><span class="railthread" id="railThread"></span>';
  buildRail();
  railEl.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) world.flyTo(+b.dataset.d); });
  function rail() {
    const d = Math.round(world.z), stops = S.thread ? threadDepths(S.thread) : [], color = S.thread ? threadColor(S.thread) : '';
    railEl.querySelectorAll('[data-d]').forEach(b => {
      const k = +b.dataset.d, on = stops.includes(k);
      b.setAttribute('aria-current', k === d ? 'true' : 'false');
      b.classList.toggle('stop', on); b.querySelector('i').style.background = on ? color : '';
      b.classList.toggle('seen', on && (S.seen[S.thread] || []).includes(IDS[k]));
    });
    /* the question's colour joins its forms down the rail */
    const line = $('railThread');
    if (stops.length > 1) {
      const a = railEl.querySelector('[data-d="' + stops[0] + '"] i').getBoundingClientRect(), b = railEl.querySelector('[data-d="' + stops[stops.length - 1] + '"] i').getBoundingClientRect(), r = railEl.getBoundingClientRect();
      Object.assign(line.style, { display: 'block', top: (a.top + a.height / 2 - r.top) + 'px', height: (b.top - a.top) + 'px', left: (a.left + a.width / 2 - r.left - 1) + 'px', background: color });
    } else line.style.display = 'none';
    railNow(world.z);
  }
  function railNow(z) {
    const items = railEl.querySelectorAll('[data-d] i'); if (!items.length) return;
    const r = railEl.getBoundingClientRect(), i = Math.min(N - 2, Math.floor(z)), f = z - i;
    const a = items[i].getBoundingClientRect(), b = items[Math.min(N - 1, i + 1)].getBoundingClientRect();
    $('railNow').style.top = (a.top + (b.top - a.top) * f + a.height / 2 - r.top) + 'px';
  }

  /* ---- the worlds: where the dive starts. A depth they share keeps its place. ---- */
  const worldsEl = $('worlds');
  worldsEl.setAttribute('aria-label', t('ui.worlds'));
  worldsEl.innerHTML = WORLDS.filter(w => !w.hidden).map(w => '<button type="button" data-world="' + w.id + '">' + esc(t('world.' + w.id + '.name')) + '</button>').join('');
  /* inside the factory's hidden dive, the journey stays lit in the top bar */
  const shownWorld = () => worldOf(WORLD).hidden ? 'journey' : WORLD;
  const markWorld = () => worldsEl.querySelectorAll('[data-world]').forEach(b => b.setAttribute('aria-pressed', b.dataset.world === shownWorld() ? 'true' : 'false'));
  /* go into another world: at a given depth or station, or where zIn says the same view is */
  function enter(id, at) {
    if (id === WORLD && at == null) return;
    const target = worldOf(id), j = at != null && target ? target.depths.indexOf(at) : -1, z = j >= 0 ? j : zIn(id, world.z);
    setWorld(id); buildRail(); markWorld();
    if (!isLine() && !worldOf(WORLD).hidden) S.lastDive = id;
    if (S.map && !isLine()) { S.map = null; world.setMap(null); }
    world.setZ(z); see(Math.round(z)); card(); rail(); save();
  }
  worldsEl.addEventListener('click', e => { const b = e.target.closest('[data-world]'); if (b) enter(b.dataset.world); });
  markWorld();

  /* ---- the card ---- */
  const cardEl = $('card');
  const ext = (href, html, cls) => '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + esc(href) + '" target="_blank" rel="noopener" title="' + esc(t('ui.newTab')) + '">' + html + '</a>';
  /* a new question for this place, through the repository's question form, filled in as far as we can */
  const propose = (d, th) => {
    const p = { template: 'question.yml', title: t('ui.issueTitle', { depth: depthName(d) }), where: t('ui.issueWhere', { world: t('world.' + WORLD + '.name'), depth: depthName(d) }) };
    const n = th ? nearest(th, d) : null; if (n != null) p.continues = q(th, n);
    return REPO + '/issues/new?' + new URLSearchParams(p);
  };
  const figures = key => figList(FIGURES[key] || []);
  const figList = ids => {
    const fs = ids.map(id => FACT[id]).filter(Boolean); if (!fs.length) return '';
    return '<section class="figs"><p class="code">' + t('ui.figures') + '</p><ul>' + fs.map(f => '<li><b>' + esc(f.value) + '</b> <span>' + esc(f.label) + '</span><small>' +
      ext(f.url, esc(f.source)) + ' · ' + esc(t('fact.' + f.kind)) + ' · ' + esc(t('ui.checked', { date: fmtDate(f.verified) })) + '</small></li>').join('') + '</ul></section>';
  };
  const cases = key => CASES.filter(c => c.stop === key).map(c => '<details class="case"><summary><span class="code">' + esc(t('ui.realCase', { year: c.year })) + '</span><b>' + esc(t('case.' + c.id + '.t')) + '</b></summary>' +
    ['what', 'why', 'after'].map(k => '<p>' + esc(t('case.' + c.id + '.' + k)) + '</p>').join('') + '<p class="small muted">' + t('ui.source') + ': ' + ext(c.url, esc(t('case.' + c.id + '.src'))) + '</p></details>').join('');
  const prompt = (th, d) => {
    const [n, unit] = sizeParts(sizeAt(d)), key = stopKey(th, d);
    return t('ui.prompt', { world: t('world.' + WORLD + '.name'), depth: depthName(d), size: n + ' ' + unit, see: t('depth.' + IDS[d] + '.see'), q: q(th, d), note: t('stop.' + key + '.note'),
      root: rootShown(S.seen[th]) ? t('ui.promptRoot', { root: t('thread.' + th + '.root'), behind: t('thread.' + th + '.behind') }) : '' });
  };
  /* ---- your chip: what this depth shows of it, and the "Try it" at a stop ---- */
  const chipWords = d => {
    const id = IDS[d], m = model(S.chip); if (!SHOWS[id]) return '';
    const timing = m.late > 0 ? t('chip.late', { late: Math.round(m.late * 100) }) : t('chip.inTime');
    const f = m.fab[id] || { busy: 0, wait: 0 };
    const fed = m.busy >= 0.999 ? t('chip.fed', { work: x2(m.work) }) : t('chip.starved', { peak: x2(m.peak), idle: Math.round((1 - m.busy) * 100), work: x2(m.work) });
    return t('chip.show.' + id, { fed, moving: Math.round(m.moving * 100), where: t('chip.memWhere', { mem: t('chip.mem.names')[m.mem] }), busy: Math.round(f.busy * 100), wait: x2(f.wait), days: Math.round(m.days), per: x2(m.perLayer), waiting: Math.round(m.waiting * 100), slow: t('depth.' + m.slow + '.name'), power: x2(m.power), clock: x2(m.clock), cores: m.cores, timing, battery: x2(m.battery), area: x2(m.area), density: x2(m.density),
      tick: x2(m.tick), path: x2(m.path), length: x2(m.s), wall: x2(m.wall), steps: x2(m.steps), layers: m.layers, dies: m.dies, good: m.good, yield: Math.round(m.yield * 100), cost: x2(m.cost), mm: m.side });
  };
  const readout = k => {
    const m = model(S.chip);
    if (k === 'build') return t('chip.build.names')[S.build];
    if (k === 'load') return t('chip.fab', { days: Math.round(m.days), per: x2(m.perLayer), waiting: Math.round(m.waiting * 100), slow: t('depth.' + m.slow + '.name'), cost: x2(m.cost) });
    if (k === 'reuse' || k === 'mem') return t('chip.memory', { work: x2(m.work), busy: Math.round(m.busy * 100), moving: Math.round(m.moving * 100) });
    if (k === 'size') return t('chip.wafer', { cores: m.cores, power: x2(m.power), yield: Math.round(m.yield * 100), cost: x2(m.cost) });
    return t('chip.readout', { clock: x2(m.clock), power: x2(m.power), late: Math.round(m.late * 100) });
  };
  const valueText = k => k === 'clock' ? t('chip.clock.value', { v: x2(S.chip.clock) }) : k === 'size' ? t('chip.size.value', { mm: SIDES[S.chip.size] }) :
    k === 'load' ? t('chip.load.value', { v: Math.round(LOADS[S.chip.load] * 100) }) :
    k === 'build' ? t('chip.build.value', { n: S.build + 1, total: BUILD_STEPS }) :
    k === 'reuse' ? t('chip.reuse.value', { v: REUSES[S.chip.reuse] }) : k === 'mem' ? t('chip.mem.names')[S.chip.mem] :
    t('chip.gen.names')[S.chip.gen];
  /* the depths of this world where a setting shows */
  const showsOf = k => IDS.map((id, i) => i).filter(i => (SHOWS[IDS[i]] || []).includes(k));
  const tryIt = (key, d) => {
    const k = TRIES[key]; if (!k) return '';
    const max = { clock: CLOCKS.length - 1, gen: GENS - 1, size: SIDES.length - 1, load: LOADS.length - 1, reuse: REUSES.length - 1, mem: MEMS.length - 1, build: BUILD_STEPS - 1 }[k];
    const val = k === 'clock' ? CLOCKS.indexOf(S.chip.clock) : k === 'build' ? S.build : S.chip[k];
    if (k === 'build') setBuild(S.build);
    const local = k === 'build';
    return '<section class="try"><p class="code">' + t('chip.try') + '</p><label class="trylabel" for="tryRange"><b>' + t('chip.' + k + '.label') + '</b> <output id="tryValue">' + esc(valueText(k)) + '</output></label>' +
      '<input type="range" id="tryRange" data-setting="' + k + '" min="0" max="' + max + '" step="1" value="' + val + '">' +
      '<p class="readout" id="tryOut" aria-live="polite">' + esc(readout(k)) + '</p>' +
      (k === 'build' ? '<p class="small">' + esc(t('chip.build.steps', { steps: x2(model(S.chip).steps) })) + '</p>' :
        SHOWS[IDS[d]] ? '<p class="small" id="chipHere">' + esc(chipWords(d)) + '</p>' : '') +
      '<p class="small muted">' + t('chip.' + k + '.notice') + '</p>' + '<div id="chals">' + chals(key) + '</div>' + (local ? '' :
      '<p class="small muted">' + t('chip.shows') + '</p><div class="shows">' + showsOf(k).filter(i => i !== d).map(i => '<button type="button" class="chipgo" data-go="' + i + '">' + esc(depthName(i)) + '</button>').join('') + '</div>' +
      (changed(S.chip) ? '<button type="button" class="link" data-reset>' + t('chip.reset') + '</button>' : '')) + '</section>';
  };
  /* challenges shown at this stop: met or not, a hint, and where the other settings they need can be changed */
  const placesFor = k => { const out = []; WORLDS.forEach(w => Object.entries(TRIES).forEach(([key, v]) => { const [th, id] = key.split('.'); if (v === k && w.depths.includes(id) && !w.hidden && !out.some(o => o[2] === key)) out.push([w.id, id, key, th]); })); return out; };
  const chals = key => {
    const m = model(S.chip), here = TRIES[key];
    return CHALLENGES.filter(c => c.at.includes(key)).map(c => {
      const done = c.met(m), other = c.needs.filter(k => k !== here), go = other.flatMap(k => placesFor(k).filter(p => p[0] === WORLD || !placesFor(k).some(q => q[0] === WORLD)).slice(0, 1));
      return '<div class="chal' + (done ? ' done' : '') + '"><p><b>' + (done ? '✓ ' + t('chal.done') : t('chal.title')) + '</b> ' + esc(t('chal.' + c.id + '.goal')) + '</p>' +
        (done ? '' : '<p class="small muted">' + esc(t('chal.' + c.id + '.hint')) + '</p>' + go.map(p => '<button type="button" class="chipgo" data-trystop="' + p[0] + ':' + p[2] + '">' + esc(t('chal.change', { where: t('depth.' + p[1] + '.name') + ' (' + t('chip.' + TRIES[p[2]] + '.label') + ')' })) + '</button>').join('')) + '</div>';
    }).join('');
  };
  const mine = (d, skip) => (skip || !changed(S.chip) || !SHOWS[IDS[d]]) ? '' :
    '<section class="mine"><p class="code">' + t('chip.yours') + '</p><p id="chipHere">' + esc(chipWords(d)) + '</p><button type="button" class="link" data-reset>' + t('chip.reset') + '</button></section>';
  function setSetting(k, i) {
    if (k === 'build') { S.build = i; setBuild(i); } else { const c = Object.assign({}, S.chip); c[k] = k === 'clock' ? CLOCKS[i] : i; S.chip = normal(c); setChip(S.chip); save(); }
    const d = Math.round(world.z), v = $('tryValue'), o = $('tryOut'), here = $('chipHere');
    if (v) v.textContent = valueText(k);
    if (o) o.textContent = readout(k);
    if (here) here.textContent = chipWords(d);
    const ch = $('chals'), th = S.thread; if (ch && th) ch.innerHTML = chals(stopKey(th, d));
  }

  /* a part of the picture: what it does, and the questions, tries, cases and ideas about it */
  const partCard = d => {
    if (xrayHere(IDS[d])) return '';
    const id = IDS[d], key = S.part && S.part.id === id ? S.part.key : null; if (!key) return '';
    const ths = THREADS.map(x => x.id).filter(th => (STOPS[th + '.' + id] || []).includes(key)), keys = ths.map(th => th + '.' + id);
    let h = '<section class="part"><p class="code">' + t('ui.partWhat') + '</p><h3>' + esc(t('part.' + partWord(id, key))) + '</h3><p>' + esc(t('what.' + partWord(id, key))) + '</p>';
    if (ths.length) h += '<p class="small muted">' + t('ui.partAsks') + '</p>' + ths.map(th => qButton(th, d)).join('');
    else h += '<p class="small muted">' + t('ui.partNone') + ' ' + ext(propose(d), t('ui.propose')) + '</p>';
    const tries = keys.filter(k => TRIES[k]).map(k => t('chip.' + TRIES[k] + '.label'));
    if (tries.length) h += '<p class="small">' + t('ui.partTry') + ': <b>' + esc(tries.join(' · ')) + '</b></p>';
    const cs = CASES.filter(c => keys.includes(c.stop));
    if (cs.length) h += '<p class="small">' + t('ui.partCase') + ': ' + cs.map(c => esc(t('case.' + c.id + '.t'))).join(' · ') + '</p>';
    const ideas = [...new Set(keys.flatMap(k => { const v = t('stop.' + k + '.tried'); return Array.isArray(v) ? v : []; }))].slice(0, 4);
    if (ideas.length) h += '<p class="small muted">' + t('ui.partIdeas') + '</p><ul class="tried">' + ideas.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    return h + '<button type="button" class="link" data-closepart>' + t('ui.partClose') + '</button></section>';
  };

  /* the top of each dive, and its chip, lead to that chip's trip around the world */
  /* where a depth of a dive is built in the studio, and where a studio station is seen inside a real chip */
  const BUILT = { chip: 'need', soc: 'need', mcu: 'need', block: 'layout', gate: 'gates', switch: 'gates' };
  const SEEN_IN = { need: 'chip', gates: 'gate', layout: 'block' };
  const TRIP = { building: 'datacentre', rack: 'datacentre', chip: 'datacentre', phone: 'phone', soc: 'phone', car: 'car', mcu: 'car' };
  /* the ways on from here: down from a station, out from the last one, back to the line from the factory's dive */
  const ways = d => {
    const id = IDS[d], out = [];
    if (isLine()) {
      (DIVES[id] || []).forEach(([w, at]) => out.push(['dive', w, at, t('ui.diveDown', { depth: t('depth.' + at + '.name') })]));
      (EXITS[id] || []).forEach(([w, at]) => out.push(['exit', w, at, t('ui.shipTo', { world: t('world.' + w + '.name') })]));
    } else if (worldOf(WORLD).hidden) out.push(['back', 'journey', S.from || 'print', t('ui.backToLine', { station: t('depth.' + (S.from || 'print') + '.name') })]);
    else if (MADE[id]) out.push(['back', 'journey', MADE[id], t('ui.seeMade', { station: t('depth.' + MADE[id] + '.name') })]);
    /* the whole trip, around the world: from any station, and from the top of each dive */
    const trip = isLine() ? '' : TRIP[id];
    if (isStudio()) { if (id === 'masks') out.push(['back', 'journey', 'print', t('design.toFab', { station: t('depth.print.name') })]); }
    else if (isLine()) { if (id === 'print') out.push(['back', 'design', 'masks', t('design.fromDesign', { station: t('depth.masks.name') })]); out.push(['map', '', '', t('map.open')]); }
    else if (trip) out.push(['map', trip, '', t('map.fromDive')]);
    /* one world: the dive's chip, block and gate are what the studio builds; the studio's gates and layout are inside every chip */
    if (!isLine() && !worldOf(WORLD).hidden && BUILT[id]) out.push(['back', 'design', BUILT[id], t('here.go', { station: t('depth.' + BUILT[id] + '.name') })]);
    if (isStudio() && SEEN_IN[id]) out.push(['back', S.lastDive || 'datacentre', SEEN_IN[id], t('here.see', { depth: t('depth.' + SEEN_IN[id] + '.name'), world: t('world.' + (S.lastDive || 'datacentre') + '.name') })]);
    if (!out.length) return '';
    return '<section class="ways"><p class="code">' + t(isStudio() ? 'ui.waysOn' : isLine() && EXITS[id] ? 'ui.waysOut' : isLine() ? 'ui.waysDown' : worldOf(WORLD).hidden ? 'ui.waysBack' : 'ui.waysMade') + '</p><div class="moves">' +
      out.map(o => o[0] === 'map' ? '<button type="button" class="btn" data-map="' + o[1] + '">' + esc(o[3]) + '</button>' :
        '<button type="button" class="btn' + (o[0] === 'exit' ? ' primary' : '') + '" data-dive="' + o[1] + ':' + o[2] + (o[0] === 'back' ? '' : ':' + id) + '">' + esc(o[3]) + '</button>').join('') + '</div></section>';
  };

  /* ---- your design (src/engines/design.js), in the design studio, and where the journey meets it ---- */
  const isStudio = () => !!worldOf(WORLD).flat;
  const errWords = B => B.errs.map(e => '<li>' + esc(t('design.err.' + e.k, { l: e.l, n: e.n || '' })) + '</li>').join('');
  const pattern = v => Object.entries(v).map(([k, x]) => k + ' ' + x).join(' · ');
  function designMsg(id, B) {
    if (B.errs.length) return '<ul class="errs">' + errWords(B) + '</ul>';
    if (B.p === 'core') {
      const C = B.core;
      let h = C.sliceOk ? '<p class="small good">' + esc(t('core.sliceIn', { cells: B.M ? B.M.cells.length : 0 })) + '</p>' : '<p class="small bad">' + esc(t('core.needSlice')) + '</p><button type="button" class="btn" data-proj="alu">' + t('core.buildSlice') + '</button>';
      /* the registers: your register bit and select if you have written them, or the lab's model */
      const R = C.regs, mine = R.yours.bit || R.yours.select;
      h += '<p class="small ' + (!mine ? 'muted' : R.right ? 'good' : 'bad') + '">' + esc(t(!mine ? 'core.regsModel' : R.right ? 'core.regsYours' : 'core.regsWrong', { which: [R.yours.bit && t('design.proj.regbit.t'), R.yours.select && t('design.proj.select.t')].filter(Boolean).join(', ') })) + '</p>';
      if (!mine) h += '<div class="moves"><button type="button" class="btn" data-proj="regbit">' + t('design.proj.regbit.t') + '</button><button type="button" class="btn" data-proj="select">' + t('design.proj.select.t') + '</button></div>';
      h += C.runErr ? '<p class="small bad">' + esc(t('core.run.' + C.runErr.k, { l: C.runErr.l })) + '</p>' : C.trace ? '<p class="small">' + esc(t('core.ran', { result: C.result, cycles: C.cycles })) + '</p>' : '';
      if (id === 'check') h += '<ul class="tests">' + C.tests.map(T => { const f = T.cases.find(x => !x.ok); return '<li class="' + (T.ok ? 'good' : 'bad') + '">' + (T.ok ? '✓ ' : '✗ ') + esc(t('core.test.' + T.id + '.t')) + (f ? ' · ' + esc(t(f.stuck ? 'core.caseStuck' : 'core.case', { want: f.want, got: f.got })) : '') + '</li>'; }).join('') + '</ul>';
      return h;
    }
    if (id === 'check' || id === 'logic') {
      if (!B.spec) return '<p class="small">' + esc(t('design.state.free')) + '</p>';
      const r = B.rows.find(x => x.mis.length);
      return r ? '<p class="small bad">' + esc(t('design.wrongAt', { v: pattern(r.v), e: pattern(Object.fromEntries(r.mis.map(k => [k, r.e[k]]))), o: pattern(Object.fromEntries(r.mis.map(k => [k, r.o[k]]))) })) + '</p>' : '<p class="small good">' + esc(t('design.allRight')) + '</p>';
    }
    return '';
  }
  /* a design you finish here joins the plan as yours */
  function designChanged() {
    S.codes[S.design.p] = S.design.code;
    const B = cur(); setDesign(B);
    if (B.ok && B.spec && !S.defect && !S.done.includes(B.p)) S.done = S.done.concat(B.p);
    setMine(S.done, S.by); save(); return B;
  }
  /* the prompt for any AI assistant: the job, the inputs and outputs, and the rules of the description */
  const askPrompt = B => t('build.prompt', { job: t('design.proj.' + B.p + '.d'), ins: B.ins.join(', '), outs: B.outs.join(', '), clock: t(B.seq ? 'build.promptClock' : 'build.promptNoClock') });
  const planCard = () => {
    const P = plan(S.done), pr = progress(P), here = needForProject(S.design.p);
    let h = '<p class="small">' + esc(t('build.progress', pr)) + '</p><ul class="plan">';
    const walk = (id, depth) => {
      const n = NEEDS.find(x => x.id === id), st = P[id];
      const pick = n.project ? '<button type="button" class="chipgo" data-proj="' + n.project + '" aria-pressed="' + (here && here.id === id) + '">' + esc(t('build.need.' + id + '.t')) + '</button>' : '<b>' + esc(t('build.need.' + id + '.t')) + '</b>';
      h += '<li style="--d:' + depth + '" class="st-' + st.state + '">' + pick + ' <span class="small muted">' + esc(t('build.state.' + st.state, { built: st.built || 0, of: st.of || 0, n: st.n || 0 })) + (st.yours ? ' · ' + esc(t('build.yoursDone')) : '') + '</span>' +
        (n.engine === null && !childrenOf(id).length ? ' ' + ext(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('build.engineFor', { need: t('build.need.' + id + '.t') }) }), t('build.proposeEngine'), 'small') : '') + '</li>';
      childrenOf(id).forEach(c => walk(c.id, depth + 1));
    };
    walk(NEEDS[0].id, 0);
    h += '</ul><div class="shows"><button type="button" class="chipgo" data-proj="free" aria-pressed="' + (S.design.p === 'free') + '">' + esc(t('design.proj.free.t')) + '</button></div>';
    return h + '<p class="small muted">' + ext(REPO + '/issues/new?' + new URLSearchParams({ template: 'need.yml' }), t('build.proposeNeed')) + '</p>';
  };
  /* working with an AI: an agent's proposal to check, or a prompt for any assistant; and who wrote it */
  const partner = B => {
    let h = '<section class="partner"><p class="code">' + t('build.partner') + '</p>';
    if (S.claim && AGENT[B.p] && S.design.code === AGENT[B.p]) h += '<p class="small"><b>' + t('build.agentSays') + '</b> ' + esc(t('build.agent.' + B.p)) + '</p><p class="small muted">' + t('build.trust') + '</p>';
    if (AGENT[B.p]) h += '<button type="button" class="btn" data-agent>' + t('build.agentLoad') + '</button>';
    h += '<button type="button" class="link" data-companion aria-expanded="false">' + t('build.ask') + '</button>' +
      '<div class="companion" hidden><p class="small muted">' + t('build.askNote') + '</p><textarea readonly rows="7" aria-label="' + esc(t('build.ask')) + '">' + esc(askPrompt(B)) + '</textarea><div class="moves"><button type="button" class="btn" data-copy>' + t('ui.copy') + '</button><span class="small muted" role="status"></span></div></div>';
    h += '<p class="small muted">' + t('build.port') + ' ' + ext(REPO + '/blob/main/docs/MCP.md', t('build.portLink')) + '</p>';
    h += '<p class="small muted">' + t('build.who') + '</p><div class="shows">' + ['you', 'ai', 'both'].map(k => '<button type="button" class="chipgo" data-by="' + k + '" aria-pressed="' + (S.by === k) + '">' + esc(t('build.by.' + k)) + '</button>').join('') + '</div>';
    return h + '</section>';
  };
  /* at a depth of a dive: what the community and you have built of a thing like this */
  function buildHere(id) {
    const B = cur(), P = plan(S.done), pr = progress(P), job = t('design.proj.' + B.p + '.t');
    const types = {}; (B.M ? B.M.cells : []).forEach(c => { types[c.type] = (types[c.type] || 0) + 1; });
    const list = Object.entries(types).map(([k, n]) => k.replace(/2$/, '') + ' × ' + n).join(', ');
    const n = { built: pr.built, total: pr.total, job, cells: B.M ? B.M.cells.length * (B.p === 'core' ? 32 : 1) : 0, list: list || '—', transistors: (B.transistors || 0).toLocaleString() };
    const key = id === 'block' ? 'here.block' : id === 'gate' ? 'here.gate' : id === 'switch' ? 'here.switch' : 'here.chip';
    return '<section class="fab"><p class="code">' + t('here.title') + '</p><p class="small">' + esc(t(key, n)) + '</p></section>';
  }
  /* where informed people disagree about what is here: each view's claim and what it assumes; none marked right */
  function debate(D) {
    if (!D) return '';
    let h = '<details class="debate"><summary><span class="code">' + t('debate.title') + '</span> <b>' + esc(t('debate.' + D.id + '.t')) + '</b></summary><p>' + esc(t('debate.' + D.id + '.q')) + '</p><p class="small muted">' + t('debate.note') + '</p><ul class="views">';
    for (let i = 0; i < D.views; i++) h += '<li><b>' + esc(t('debate.' + D.id + '.v' + i + '.t')) + '</b> ' + esc(t('debate.' + D.id + '.v' + i + '.claim')) + '<br><span class="small muted">' + t('debate.assumes') + ' ' + esc(t('debate.' + D.id + '.v' + i + '.assumes')) + '</span></li>';
    return h + '</ul><p class="small"><b>' + t('debate.mind') + '</b> ' + ext(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('debate.' + D.id + '.t') }), t('debate.add')) + '</p></details>';
  }
  /* ---- chip X-ray: the chip at the bottom of a dive, read as a die photo (src/engines/xray.js) ---- */
  const xrayAt = id => XRAY_AT.includes(id) && !isLine() && !worldOf(WORLD).hidden;
  const xrayHere = id => S.xray.on && xrayAt(id);
  const nextFind = id => askFor(xrayOf(id)).find(k => !S.xray.found[id].includes(k)) || null;
  const pct = v => t('life.share.pct', { v: Math.round(v * 100) });
  function xrayCard(id) {
    let h = '<section class="try xray"><p class="code">' + t('xray.title') + '</p><p>' + esc(t('xray.q')) + '</p><button type="button" class="btn' + (S.xray.on ? '' : ' primary') + '" data-xray aria-pressed="' + S.xray.on + '">' + t(S.xray.on ? 'xray.off' : 'xray.on') + '</button>';
    if (!S.xray.on) return h + '</section>';
    const B = xrayOf(id), sh = shares(B), order = Object.keys(sh).filter(k => k !== 'other').sort((a, b) => sh[b] - sh[a]).concat('other');
    h += '<p class="small muted">' + t('xray.area') + '</p><div class="area" role="img" aria-label="' + esc(order.map(k => t(k === 'other' ? 'xray.other' : 'xray.type.' + k + '.t') + ' ' + pct(sh[k])).join(', ')) + '">' + order.map(k => '<span class="x-' + k + '" style="width:' + (sh[k] * 100).toFixed(1) + '%"></span>').join('') + '</div>';
    h += '<ul class="legend small">' + order.map(k => '<li class="x-' + k + '">' + esc(t(k === 'other' ? 'xray.other' : 'xray.type.' + k + '.t')) + ' ' + pct(sh[k]) + '</li>').join('') + '</ul>';
    h += '<p class="small">' + esc(t('xray.read.' + id)) + '</p>';
    /* read it: find each kind of block, biggest first */
    const P = S.xpick && S.xpick.id === id ? S.xpick : null, want = nextFind(id), tn = k => t('xray.type.' + k + '.t');
    if (P) h += '<p class="small ' + (P.type === P.want ? 'good' : '') + '"><b>' + esc(tn(P.type)) + '.</b> ' + esc(t('xray.type.' + P.type + '.clue')) + (P.want && P.type !== P.want ? ' ' + esc(t('xray.wrong', { got: tn(P.type), type: tn(P.want) })) : '') + '</p>';
    if (want) h += '<p><b>' + esc(t('xray.find', { type: tn(want) })) + '</b></p>' + (P && P.want === want && P.type !== want ? '<p class="small muted">' + esc(t('xray.hint', { clue: t('xray.type.' + want + '.clue') })) + '</p>' : '');
    else h += '<p class="small good">' + esc(t('xray.done')) + '</p>';
    h += '<p class="small muted">' + esc(t('xray.found', { n: S.xray.found[id].length, total: askFor(B).length })) + '</p>';
    return h + '<p class="small muted">' + t('xray.note') + '</p></section>';
  }
  /* ---- another way to compute, where the problem it attacks is met (src/data/ways.js) ---- */
  const DOTS = 5;
  function wayCard(W) {
    if (!W) return '';
    const stages = t('way.stages');
    let h = '<details class="debate way"><summary><span class="code">' + t('way.title') + '</span> <b>' + esc(t('way.' + W.id + '.t')) + '</b></summary>';
    h += '<p>' + esc(t('way.' + W.id + '.how')) + '</p><p class="small"><b>' + t('way.attacks') + '</b> ' + esc(t('way.saves.' + W.saves)) + '</p>';
    h += '<p class="small"><b>' + t('way.catch') + '</b> ' + esc(t('way.' + W.id + '.catch')) + '</p>';
    h += '<p class="small"><b>' + t('way.where') + '</b> <span class="stage" aria-hidden="true">' + Array.from({ length: DOTS }, (_, i) => '<i class="' + (i <= W.stage ? 'on' : '') + '"></i>').join('') + '</span> ' + esc(stages[W.stage]) + '. ' + esc(t('way.' + W.id + '.now')) + '</p>';
    return h + '<p class="small muted">' + t('way.note') + ' ' + ext(REPO + '/issues/new?' + new URLSearchParams({ template: 'idea.yml', title: t('way.' + W.id + '.t') }), t('way.add')) + '</p></details>';
  }
  /* ---- the physics floor: how far your chip is from the limits physics sets (src/engines/floor.js) ---- */
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const pow10 = v => { const e = Math.round(Math.log10(v)); return e <= 0 ? '1' : '10' + String(e).split('').map(d => SUP[+d]).join(''); };
  function floorLadder(E) {
    const W = 320, H = 124, l = 8, r = 8, X = v => l + (W - l - r) * Math.min(1, Math.log10(Math.max(1, v)) / 9);
    const rungs = [['floor', 1, 'grn'], ['math', E.mathTimes, 'warm'], ['total', E.times, 'bad']];
    let g = '<svg class="ladder" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(rungs.map(q => t('floor.rung.' + q[0]) + ' ' + pow10(q[1])).join(', ')) + '">';
    for (let e = 0; e <= 9; e += 3) g += '<line x1="' + X(Math.pow(10, e)) + '" x2="' + X(Math.pow(10, e)) + '" y1="4" y2="' + (H - 16) + '" class="grid"/><text x="' + X(Math.pow(10, e)) + '" y="' + (H - 4) + '" text-anchor="middle">' + pow10(Math.pow(10, e)) + '</text>';
    rungs.forEach((q, i) => { const y = 4 + i * 34; g += '<text x="' + (l + 2) + '" y="' + (y + 10) + '" class="lbl">' + esc(t('floor.rung.' + q[0])) + ' · ' + pow10(q[1]) + '</text><rect x="' + l + '" y="' + (y + 15) + '" width="' + Math.max(3, X(q[1]) - l).toFixed(1) + '" height="12" class="r-' + q[2] + '"/>'; });
    return g + '</svg>';
  }
  function floorCard() {
    const m = model(S.chip), E = perOp(m), R = reach(m), T = TEMPS[S.cold], Cd = cold(T, 1);
    let h = '<section class="try floor"><p class="code">' + t('floor.title') + '</p><h3>' + esc(t('floor.q')) + '</h3>';
    h += '<p class="small">' + esc(t('floor.energy', { zj: (landauer() * 1e21).toFixed(1) })) + '</p>';
    h += floorLadder(E) + '<p class="small">' + esc(t('floor.yours', { times: pow10(E.times), math: pow10(E.mathTimes), moving: Math.round(m.moving * 100) })) + '</p>';
    h += '<p class="code">' + t('floor.coldTitle') + '</p><div class="shows" role="group" aria-label="' + esc(t('floor.coldTitle')) + '">' + TEMPS.map((k, i) => '<button type="button" class="chipgo" data-cold="' + i + '" aria-pressed="' + (i === S.cold) + '">' + esc(t('floor.kelvin', { k })) + '</button>').join('') + '</div>';
    h += '<p class="small">' + esc(T >= 300 ? t('floor.room') : t('floor.cold', { k: T, pct: (Cd.chip / Cd.room * 100).toPrecision(2), pump: Math.round(Cd.pump / Cd.total * 100) })) + '</p>';
    h += '<p class="code">' + t('floor.speedTitle') + '</p><p class="small">' + esc(t('floor.speed', { ghz: x2(R.ghz), cm: x2(R.glass * 100), mm: Math.round(R.across * 1000), ticks: x2(R.ticks) })) + '</p>';
    h += '<p class="small muted">' + t('floor.aim') + '</p><div class="moves">' + ['reversible', 'super'].map(id => { const W = wayOf(id), at = W.at[0], w = WORLDS.find(x => x.id === WORLD && x.depths.includes(at)) ? WORLD : 'datacentre'; return '<button type="button" class="btn" data-dive="' + w + ':' + at + '">' + esc(t('way.' + id + '.t')) + '</button>'; }).join('') + '</div>';
    return h + '<p class="small muted">' + t('floor.model') + '</p></section>';
  }
  /* ---- your chip's life: why a perfect design still fails, where it lives (src/engines/life.js) ---- */
  /* where each place's chip is met in its dive */
  const LIFE_DEPTH = Object.fromEntries(Object.entries(LIVES_AT).map(([d, m]) => [m, d]));
  const share = v => v >= 0.01 ? t('life.share.pct', { v: (v * 100).toFixed(v >= 0.1 ? 0 : 1) }) : t('life.share.ppm', { v: v * 1e6 >= 10 ? Math.round(v * 1e6).toLocaleString() : (v * 1e6).toPrecision(2) });
  const reqValue = (id, v) => id === 'fail' ? share(v) : id === 'silent' ? (v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(1)) : id === 'perf' ? t('life.share.pct', { v: Math.round(v * 100) }) : t('life.times', { v: v.toFixed(2) });
  const lifeOf = m => { const B = cur(); return live(m, S.life.c, { coverage: B.M ? B.coverage : undefined, mhz: B.st ? B.st.fmax : undefined }); };
  /* failures year by year, on a log scale from one in a million to all of them, with the line the customer accepts */
  function lifeChart(L) {
    const W = 320, H = 150, l = 52, r = 8, top = 8, b = 22, yr = L.life, lg = v => Math.max(-6, Math.log10(Math.max(v, 1e-9)));
    const X = y => l + (W - l - r) * y / yr, Y = v => top + (H - top - b) * (-lg(v)) / 6;
    const path = f => { let d = ''; for (let i = 0; i <= 48; i++) { const y = yr * i / 48; d += (i ? 'L' : 'M') + X(y).toFixed(1) + ' ' + Y(f(y)).toFixed(1); } return d; };
    let g = '<svg class="lifechart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('life.chart')) + '">';
    [0, -2, -4, -6].forEach(e => { const y = Y(Math.pow(10, e)); g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (l - 4) + '" y="' + (y + 3) + '" text-anchor="end">' + esc(t('life.share.pct', { v: [100, 1, 0.01, 0.0001][-e / 2] })) + '</text>'; });
    g += '<text x="' + X(0) + '" y="' + (H - 6) + '">0</text><text x="' + X(yr) + '" y="' + (H - 6) + '" text-anchor="end">' + esc(t('life.axis.years', { n: yr })) + '</text>';
    const need = L.req[0].need; g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(need) + '" y2="' + Y(need) + '" class="need"/>';
    g += '<path d="' + path(L.total) + '" class="total ' + (L.req[0].ok ? 'ok' : 'no') + '"/>';
    CAUSES.forEach(c => { g += '<path d="' + path(L.curve[c]) + '" class="c-' + c + '"/>'; });
    return g + '</svg>';
  }
  /* what changes when a choice changes: the chart, the needs, and what to notice */
  function lifeOut(m) {
    const L = lifeOf(m), y = Math.round(L.yTiming * L.yDefect * 100);
    let h = lifeChart(L) + '<ul class="legend small">' + CAUSES.map(c => '<li class="c-' + c + '" title="' + esc(t('life.cause.' + c + '.d')) + '">' + esc(t('life.cause.' + c + '.t')) + '</li>').join('') + '<li class="total">' + esc(t('life.total')) + '</li><li class="need">' + esc(t('life.need')) + '</li></ul>';
    h += '<ul class="needs small">' + L.req.map(q => '<li class="' + (q.ok ? 'good' : 'bad') + '">' + (q.ok ? '✓ ' : '✗ ') + esc(t('life.req.' + q.id, { life: L.life })) + ' · ' + esc(t('life.have', { have: reqValue(q.id, q.have), need: reqValue(q.id, q.need) })) + '</li>').join('') + '</ul>';
    h += '<p class="small">' + esc(t('life.yield', { v: y })) + (L.mhz ? ' ' + esc(t('life.speed', { mhz: Math.round(L.mhz), sold: Math.round(L.sold) })) : '') + '</p>';
    return h + '<p class="small ' + (L.pass ? 'good' : '') + '"><b>' + t('life.notice') + '</b> ' + esc(t('life.hint.' + L.hint, { cov: Math.round(L.cover * 100) })) + '</p>';
  }
  /* the life of your chip in one place (fixed: met in that place's dive), or in a place you pick (at the Ship station) */
  function lifeCard(fixed) {
    const m = fixed || S.life.m, M = MISSIONS[m], c = S.life.c, B = cur();
    const pressed = (k, on) => '<button type="button" class="chipgo" data-lifeset="' + k + '" aria-pressed="' + on + '">' + esc(t('life.' + k)) + '</button>';
    let h = '<section class="try life" id="life"><p class="code">' + t('life.title') + '</p><h3>' + esc(t('life.q', { life: M.life })) + '</h3><p class="small muted">' + t('life.signed') + '</p>';
    if (!fixed) h += '<div class="shows" role="group" aria-label="' + esc(t('life.where')) + '">' + MISSION_IDS.map(k => '<button type="button" class="chipgo" data-lifem="' + k + '" aria-pressed="' + (k === m) + '">' + esc(t('world.' + k + '.name')) + '</button>').join('') + '</div>';
    h += '<p class="small">' + esc(t('life.' + m + '.story', { fleet: M.fleet.toLocaleString(), life: M.life, tMax: M.tMax })) + '</p>';
    if (!B.ok) h += '<p class="small muted">' + t('life.notYet') + '</p>';
    h += '<div id="lifeOut" aria-live="polite">' + lifeOut(m) + '</div>';
    h += '<p class="code">' + t('life.inDesign') + '</p><label class="trylabel" for="lifeMargin"><b>' + t('life.margin') + '</b> <output id="lifeMarginV">' + esc(t('life.marginValue', { v: Math.round(MARGINS[c.margin] * 100) })) + '</output></label>' +
      '<input type="range" id="lifeMargin" min="0" max="' + (MARGINS.length - 1) + '" step="1" value="' + c.margin + '">' +
      '<div class="shows">' + pressed('grid', c.grid) + '</div><p class="small muted">' + t('life.protect') + '</p><div class="shows" role="group" aria-label="' + esc(t('life.protect')) + '">' + PROTECT.map(p => '<button type="button" class="chipgo" data-lifeprot="' + p + '" aria-pressed="' + (c.protect === p) + '">' + esc(t('life.protect.' + p)) + '</button>').join('') + '</div>';
    h += '<p class="code">' + t('life.atFactory') + '</p><div class="shows">' + pressed('hot', c.hot) + pressed('burn', c.burn) + '</div>';
    if (Object.keys(PERFECT).some(k => c[k] !== PERFECT[k])) h += '<button type="button" class="link" data-lifereset>' + t('life.reset') + '</button>';
    h += '<p class="small muted">' + t('life.model') + '</p><div class="moves">';
    if (fixed) h += '<button type="button" class="btn" data-dive="journey:ship">' + esc(t('life.otherPlaces')) + '</button>';
    else h += '<button type="button" class="btn" data-dive="' + m + ':' + LIFE_DEPTH[m] + '">' + esc(t('life.go', { place: t('depth.' + LIFE_DEPTH[m] + '.name') })) + '</button>';
    h += '<button type="button" class="btn" data-dive="design:check">' + esc(t('life.toDesign')) + '</button>';
    return h + '</div></section>';
  }
  /* what the factory will do to it: at every station, the design meets the line it will be made on */
  function fabLens(id, B) {
    if (!B.M && B.p !== 'core') return '';
    const core = B.p === 'core', n = { transistors: (B.transistors || 0).toLocaleString(), ps: B.st ? Math.round(B.st.crit) : 0, mhz: B.st ? Math.round(B.st.fmax) : 0, area: Math.round(B.area || 0), masks: B.masks || 0 };
    let h = '<section class="fab"><p class="code">' + t('fab.title') + '</p><p class="small">' + esc(core && id === 'gates' ? t('fab.gatesCore') : core && id === 'check' ? t('fab.checkCore') : t('fab.' + id, n)) + '</p>';
    if (id === 'check' && B.ok !== undefined && (B.ok || S.defect != null)) {
      if (S.defect != null) {
        if (core && B.core.defect) h += '<p class="small bad">' + esc(t('fab.defectCore', { bit: B.core.defect.bit, passed: B.core.passed, total: B.core.total })) + '</p>';
        else if (B.defect) h += '<p class="small bad">' + esc(t('fab.defect', { v: B.defect.v, wrong: B.defect.wrong, total: B.total })) + '</p><p class="small">' + esc(t('fab.caught', { vectors: B.vectors })) + '</p>';
      }
      h += '<button type="button" class="btn' + (S.defect == null ? ' primary' : '') + '" data-defect>' + t(S.defect == null ? 'fab.make' : 'fab.perfect') + '</button>';
    }
    const go = { check: 'test', layout: 'test', masks: 'print', gates: null, need: 'crystal', logic: null }[id];
    if (go) h += '<button type="button" class="link" data-dive="journey:' + go + '">' + esc(t('fab.see', { station: t('depth.' + go + '.name') })) + '</button>';
    return h + '</section>';
  }
  function designCard(d) {
    const id = IDS[d], B = cur(), need = needForProject(B.p);
    let h = '<section class="try design"><p class="code">' + t('design.yours') + ' · ' + esc(t('design.proj.' + B.p + '.t')) + '</p>';
    if (id === 'need') h += '<p class="small muted">' + t('build.goal') + '</p>' + planCard();
    if (need) h += '<p class="small"><b>' + esc(t('build.need.' + need.id + '.t')) + '</b> · ' + esc(t('build.need.' + need.id + '.d')) + '</p>';
    h += '<p>' + esc(t('design.proj.' + B.p + '.d')) + '</p>';
    if (id === 'logic' || id === 'check') {
      h += '<label class="trylabel" for="designCode"><b>' + t('design.edit') + '</b></label><textarea id="designCode" class="code-edit" spellcheck="false" autocapitalize="off" autocomplete="off" rows="' + Math.min(14, B.code.split('\n').length + 2) + '">' + esc(B.code) + '</textarea>';
      h += '<div id="designMsg" aria-live="polite">' + designMsg(id, B) + '</div><button type="button" class="link" data-dreset>' + t('design.reset') + '</button>';
      h += partner(B);
    } else if (B.errs.length) h += '<ul class="errs">' + errWords(B) + '</ul>';
    h += fabLens(id, B);
    /* signed off: and then it has a life to live */
    if (id === 'check' && B.ok && S.defect == null) h += '<section class="fab"><p class="code">' + t('life.title') + '</p><p class="small">' + esc(t('life.teaser')) + '</p><button type="button" class="link" data-dive="journey:ship">' + esc(t('life.follow')) + '</button></section>';
    if (id === 'gates' && B.p === 'alu' && B.M) h += '<p class="small">' + esc(t('design.alu32', { cells: B.M.cells.length })) + '</p>';
    if ((id === 'check' || id === 'gates') && B.M) h += '<p class="small muted">' + esc(t('design.cov', { vectors: B.vectors, caught: Math.round(B.coverage * 100) })) + '</p>';
    if (id === 'layout') {
      h += '<p class="small muted">' + t('design.community') + '</p><ol class="small community">' + DESIGNS.map(c => '<li><b>' + esc(c.title) + '</b> · ' + esc(c.author) + ' · ' + esc(t('build.kind.' + c.kind)) + '</li>').join('') + '</ol>';
      if (B.ok) {
        const url = REPO + '/issues/new?' + new URLSearchParams({ template: 'design.yml', title: t('design.addYours') + ': ' + t('design.proj.' + B.p + '.t'), need: need ? need.id : 'free', code: B.code, ai: t('build.aiUse.' + S.by) });
        h += ext(url, t('design.addYours'), 'btn') + '<p class="small muted">' + t('design.addNote') + '</p>';
      }
    }
    return h + '</section>';
  }

  /* the card while the map is open: whose trip, the step picked, the place picked, and what stops */
  const siteBtn = id => '<button type="button" class="chipgo' + (S.map.closed.includes(id) ? ' shut' : '') + '" data-site="' + id + '">' + esc(t('site.' + id + '.name')) + '</button>';
  function mapCard() {
    const m = S.map, r = ROUTES[m.world], st = status(r, m.closed), step = r[m.step] || r[0];
    let h = '<p class="where"><b>' + t('map.title') + '</b> <span>' + esc(t('map.route.' + m.world)) + '</span></p>';
    h += '<section class="maptabs"><p class="code">' + t('map.routes') + '</p><div class="shows">' + Object.keys(ROUTES).map(w => '<button type="button" class="chipgo" data-mapworld="' + w + '" aria-pressed="' + (w === m.world) + '">' + esc(t('world.' + w + '.name')) + '</button>').join('') + '</div></section>';
    /* what stops, if anything does */
    const bad = worst(st);
    if (m.closed.length) {
      h += '<section class="mapstop ' + (bad ? bad.state : '') + '">';
      if (bad) {
        const places = st[bad.i].why.map(id => t('site.' + id + '.name')).join(', ') || m.closed.map(id => t('site.' + id + '.name')).join(', ');
        h += '<p><b>' + esc(t(bad.state === 'stopped' ? 'map.stops' : 'map.strained', { step: t('route.step.' + r[bad.i].id), places })) + '</b></p>';
        h += '<p class="rootq">' + esc(t(bad.state === 'stopped' ? 'map.qStop' : 'map.qStrain')) + '</p>';
        h += figList([...(r[bad.i].id === 'fab' ? ['fab-build-time'] : []), ...(m.world === 'car' ? ['car-shortage-2021'] : [])]);
      }
      h += '<p class="small muted">' + t('map.note') + '</p><button type="button" class="link" data-openall>' + t('map.openAll') + '</button></section>';
    }
    /* the step */
    h += '<section class="mapstep"><p class="code">' + t('map.step') + '</p><h2>' + esc(t('route.step.' + step.id)) + '</h2><p>' + esc(t('route.' + (has('route.' + m.world + '.' + step.id) ? m.world : 'any') + '.' + step.id)) + '</p>';
    if (step.at.length) h += '<p class="small muted">' + t('map.places') + '</p><div class="shows">' + step.at.map(siteBtn).join('') + '</div>';
    const needs = (step.needs || []).flatMap(n => n.at);
    if (needs.length) h += '<p class="small muted">' + t('map.needs') + '</p><div class="shows">' + needs.map(siteBtn).join('') + '</div>';
    h += '<div class="moves">' + (step.st ? '<button type="button" class="btn" data-mapgo="' + step.st + '">' + esc(t('map.toStation', { station: t('depth.' + step.st + '.name') })) + '</button>' : '') +
      (step.dive ? '<button type="button" class="btn" data-world="' + step.dive + '">' + esc(t('map.diveTo', { world: t('world.' + step.dive + '.name') })) + '</button>' : '') + '</div></section>';
    /* the place */
    if (m.site) {
      const id = m.site, shut = m.closed.includes(id), stn = SITES[id][3];
      h += '<section class="mapsite"><p class="code">' + t('map.site') + '</p><h3>' + esc(t('site.' + id + '.name')) + ' <span class="small muted">' + esc(t('site.' + id + '.where')) + '</span></h3><p>' + esc(t('site.' + id + '.what')) + '</p><p class="small muted">' + esc(t('site.' + id + '.who')) + '</p>' +
        '<div class="moves"><button type="button" class="btn' + (shut ? '' : ' primary') + '" data-shut="' + id + '">' + t(shut ? 'map.reopen' : 'map.shut') + '</button>' +
        (stn ? '<button type="button" class="btn" data-mapgo="' + stn + '">' + esc(t('map.toStation', { station: t('depth.' + stn + '.name') })) + '</button>' : '') + '</div></section>';
    }
    h += debate(DEBATES.find(x => x.id === 'supply'));
    h += '<p class="small muted how">' + t('map.how') + '</p><button type="button" class="btn" data-closemap>' + t('map.close') + '</button>';
    return h;
  }

  const companion = (th, d) => '<button type="button" class="link" data-companion aria-expanded="false">' + t('ui.companion') + '</button><div class="companion" hidden><p class="small muted">' + t('ui.companionNote') +
    '</p><textarea readonly rows="7" aria-label="' + esc(t('ui.companion')) + '">' + esc(prompt(th, d)) + '</textarea><div class="moves"><button type="button" class="btn" data-copy>' + t('ui.copy') + '</button><span class="small muted" role="status"></span></div></div>';
  const qButton = (th, d) => '<button type="button" class="qpick" data-th="' + th + '" style="--th:' + threadColor(th) + '"><i></i><span>' + esc(q(th, d)) + '</span></button>';
  function card() {
    if (S.map && isLine()) { cardEl.innerHTML = mapCard(); anchor(); return; }
    const d = Math.round(world.z), th = S.thread;
    setBuild(null);   /* a switch is shown finished, unless "Build it" is open */
    if (S.part && S.part.id !== IDS[d]) S.part = null;
    let h = '<p class="where"><b>' + esc(depthName(d)) + '</b> <span id="acrossNow">' + esc(across(world.z)) + '</span></p>';
    /* on the line: which building you are in, and whether this machine is part of the loop every layer goes round */
    if (isLine() && PLANTS[IDS[d]]) h += '<p class="small plant">' + esc(t('plant.' + PLANTS[IDS[d]])) + (LOOP.includes(IDS[d]) ? ' · ' + esc(t('ui.inLoop', { layers: model(S.chip).layers })) : '') + '</p>';
    if (isStudio()) h += designCard(d);
    else if (!isLine() && !worldOf(WORLD).hidden && BUILT[IDS[d]]) h += buildHere(IDS[d]);
    /* at the factory's Test station: how well its test patterns would catch faults in your own design */
    if (isLine() && IDS[d] === 'test') { const B = cur(); if (B.M) h += '<p class="small plant">' + esc(t('design.testYours', { vectors: B.vectors, caught: Math.round(B.coverage * 100) })) + '</p>'; }
    /* and after the factory: its life, in the place the last station sends it, or met in that place's dive */
    if (isLine() && !isStudio() && IDS[d] === 'ship') h += lifeCard(null);
    if (xrayAt(IDS[d])) h += xrayCard(IDS[d]);
    if (!isLine() && !worldOf(WORLD).hidden && LIVES_AT[IDS[d]] && LIVES_AT[IDS[d]] === WORLD) h += lifeCard(WORLD);
    h += partCard(d);
    if (IDS[d] === 'atom') h += floorCard();
    h += debate(debateAt(IDS[d]));
    if (!isLine()) h += wayCard(wayAt(IDS[d]));
    if (th) {
      const here = stop(th, d), color = threadColor(th), key = stopKey(th, d);
      h += '<section class="follow" style="--th:' + color + '"><p class="code">' + t('ui.following') + '</p>';
      if (rootShown(S.seen[th])) h += '<div class="root"><p class="small">' + t('ui.rootOf') + '</p><p class="rootq">' + esc(t('thread.' + th + '.root')) + '</p><p class="small">' + t('ui.behind') + ' <em>' + esc(t('thread.' + th + '.behind')) + '</em></p></div>';
      if (here) {
        h += '<p class="small muted">' + t('ui.becomes') + '</p><h2 id="cardQ">' + esc(q(th, d)) + '</h2><p>' + esc(t('stop.' + key + '.note')) + '</p>';
        h += tryIt(key, d);
        const tried = t('stop.' + key + '.tried');
        h += figures(key);
        if (Array.isArray(tried)) h += '<p class="small muted">' + t('ui.tried') + '</p><ul class="tried">' + tried.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
        h += cases(key);
        const dn = below(th, d), up = above(th, d);
        const L = isLine();
        h += '<div class="moves">' + (dn != null ? '<button type="button" class="btn primary" data-go="' + dn + '">' + esc(t(L ? 'ui.onward' : 'ui.deeper', { depth: depthName(dn) })) + '</button>' : '<p class="small">' + t('ui.bottom') + '</p>') +
          (up != null ? '<button type="button" class="btn" data-go="' + up + '">' + esc(t(L ? 'ui.backward' : 'ui.higher', { depth: depthName(up) })) + '</button>' : '') + '</div>';
        h += companion(th, d);
      } else {
        const n = nearest(th, d), w = n == null ? WORLDS.find(x => x.depths.some(id => STOPS[th + '.' + id])) : null;
        h += '<p>' + t(n != null ? 'ui.noStop' : 'ui.noStopWorld') + '</p><p class="small muted">' + t('ui.openPlace') + '</p>' + ext(propose(d, th), t('ui.writeIt'), 'btn') + (n != null ? '<button type="button" class="btn primary" data-go="' + n + '">' + esc(t('ui.nearest', { depth: depthName(n) })) + '</button>' : '') +
          (w ? '<button type="button" class="btn primary" data-world="' + w.id + '">' + esc(t('ui.meetIn', { world: t('world.' + w.id + '.name') })) + '</button>' : '');
      }
      h += '<button type="button" class="link" data-leave>' + t('ui.leave') + '</button></section>';
      h += mine(d, here && TRIES[key]) + ways(d);
      const others = crossing(d).filter(x => x !== th);
      if (others.length) h += '<section class="crossing"><p class="code">' + t('ui.alsoCrossing') + '</p>' + others.map(x => qButton(x, d)).join('') + '</section>';
    } else {
      h += '<p class="see">' + esc(t('depth.' + IDS[d] + '.see')) + '</p>' + mine(d) + ways(d);
      const all = crossing(d);
      h += '<section class="crossing"><p class="code">' + t('ui.crossingHere') + '</p>' + (all.length ? all.map(x => qButton(x, d)).join('') : '<p class="small muted">' + t('ui.noneCrossing') + '</p>') + '</section>';
      h += '<p class="small muted how">' + t(isLine() ? 'ui.howLine' : 'ui.howMove') + ' ' + t('ui.tapPart') + '</p>';
      h += '<p class="small muted">' + t('ui.ownQ') + ' ' + ext(propose(d), t('ui.propose')) + '</p>';
    }
    cardEl.innerHTML = h;
    anchor();
  }
  cardEl.addEventListener('click', e => {
    const pj = e.target.closest('[data-proj]'); if (pj) { const p = pj.dataset.proj; S.design = normalDesign({ p, code: S.codes[p] }); S.by = 'you'; S.claim = false; S.defect = null; designChanged(); card(); return; }
    if (e.target.closest('[data-dreset]')) { S.design = normalDesign({ p: S.design.p }); S.by = 'you'; S.claim = false; S.defect = null; designChanged(); card(); return; }
    if (e.target.closest('[data-defect]')) { S.defect = S.defect == null ? 1 + Math.floor(Math.random() * 997) : null; designChanged(); card(); return; }
    if (e.target.closest('[data-agent]')) { S.design = normalDesign({ p: S.design.p, code: AGENT[S.design.p] }); S.by = 'ai'; S.claim = true; designChanged(); card(); return; }
    const cd = e.target.closest('[data-cold]'); if (cd) { S.cold = +cd.dataset.cold; card(); return; }
    if (e.target.closest('[data-xray]')) { S.xray.on = !S.xray.on; S.xpick = null; S.part = null; setXray(S.xray.on); save(); card(); return; }
    const lm = e.target.closest('[data-lifem]'); if (lm) { S.life.m = lm.dataset.lifem; save(); card(); return; }
    const ls = e.target.closest('[data-lifeset]'); if (ls) { const k = ls.dataset.lifeset; S.life.c = normalLife(Object.assign({}, S.life.c, { [k]: !S.life.c[k] })); save(); card(); return; }
    const lp = e.target.closest('[data-lifeprot]'); if (lp) { S.life.c = normalLife(Object.assign({}, S.life.c, { protect: lp.dataset.lifeprot })); save(); card(); return; }
    if (e.target.closest('[data-lifereset]')) { S.life.c = normalLife(PERFECT); save(); card(); return; }
    const by = e.target.closest('[data-by]'); if (by) { S.by = by.dataset.by; designChanged(); card(); return; }
    const mp = e.target.closest('[data-map]'); if (mp) { const w = mp.dataset.map; if (w) enter('journey', 'ship'); openMap(w || undefined); return; }
    if (S.map) {
      const mw = e.target.closest('[data-mapworld]'); if (mw) { S.map.world = S.mapWorld = mw.dataset.mapworld; S.map.closed = []; S.map.site = null; const i = stepAt(S.map.world, IDS[Math.round(world.z)]); S.map.step = i != null ? i : 0; showMap(); return; }
      const si = e.target.closest('[data-site]'); if (si) { S.map.site = si.dataset.site; showMap(); return; }
      const sh = e.target.closest('[data-shut]'); if (sh) { const id = sh.dataset.shut, c = new Set(S.map.closed); if (c.has(id)) c.delete(id); else c.add(id); S.map.closed = [...c]; showMap(); return; }
      if (e.target.closest('[data-openall]')) { S.map.closed = []; showMap(); return; }
      const go = e.target.closest('[data-mapgo]'); if (go) { const d = IDS.indexOf(go.dataset.mapgo); closeMap(); if (d >= 0) world.flyTo(d); return; }
      if (e.target.closest('[data-closemap]')) { closeMap(); return; }
      if (e.target.closest('[data-world]')) { closeMap(); }
    }
    const p = e.target.closest('[data-th]'); if (p) { follow(p.dataset.th); return; }
    const g = e.target.closest('[data-go]'); if (g) { world.flyTo(+g.dataset.go); return; }
    const w = e.target.closest('[data-world]'); if (w) { enter(w.dataset.world); const n = nearest(S.thread, Math.round(world.z)); if (n != null) world.flyTo(n); return; }
    const dv = e.target.closest('[data-dive]'); if (dv) { const [id, at, from] = dv.dataset.dive.split(':'); enter(id, at); if (from) { S.from = from; save(); card(); } return; }
    if (e.target.closest('[data-leave]')) { letGo(); return; }
    const ts = e.target.closest('[data-trystop]');
    if (ts) { const [w, key] = ts.dataset.trystop.split(':'), [th, id] = key.split('.'); enter(w, id); follow(th); return; }
    if (e.target.closest('[data-closepart]')) { S.part = null; card(); return; }
    if (e.target.closest('[data-reset]')) { S.chip = normal(START); setChip(S.chip); save(); card(); return; }
    const c = e.target.closest('[data-companion]');
    if (c) { const box = c.nextElementSibling, open = box.hidden; box.hidden = !open; c.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) box.querySelector('textarea').scrollTop = 0; return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) {
      const box = cp.closest('.companion'), ta = box.querySelector('textarea'), msg = box.querySelector('[role=status]');
      const done = ok => { msg.textContent = t(ok ? 'ui.copied' : 'ui.copyBlocked'); if (!ok) { ta.focus(); ta.select(); } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(() => done(true), () => done(false)); else done(false);
    }
  });
  /* the tether starts at the question in the card (only when the card sits beside the world) */
  function anchor() {
    const el = $('cardQ'), cv = $('world');
    if (!el || !S.thread || getComputedStyle(cardEl).position !== 'absolute') { world.setAnchor(null); return; }
    const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect(), k = cardEl.getBoundingClientRect();
    if (r.bottom < k.top + 8 || r.top > k.bottom - 8) { world.setAnchor(null); return; }
    world.setAnchor([r.left - c.left - 6, r.top - c.top + Math.min(r.height / 2, 18)]);
  }

  cardEl.addEventListener('scroll', anchor, { passive: true });
  cardEl.addEventListener('input', e => { const r = e.target.closest('#tryRange'); if (r) setSetting(r.dataset.setting, +r.value); if (e.target.id === 'designCode') editDesign(e.target.value);
    if (e.target.id === 'lifeMargin') { S.life.c = normalLife(Object.assign({}, S.life.c, { margin: +e.target.value })); save(); const v = $('lifeMarginV'), o = $('lifeOut'); if (v) v.textContent = t('life.marginValue', { v: Math.round(MARGINS[S.life.c.margin] * 100) }); if (o) o.innerHTML = lifeOut(LIVES_AT[IDS[Math.round(world.z)]] === WORLD ? WORLD : S.life.m); } });
  /* the description, edited in the card: the whole design follows at once, in every station's picture */
  let editT = null;
  function editDesign(code) {
    clearTimeout(editT);
    editT = setTimeout(() => { S.design = normalDesign({ p: S.design.p, code }); if (S.by === 'ai') S.by = 'both'; const B = designChanged(); const m = $('designMsg'); if (m) m.innerHTML = designMsg(IDS[Math.round(world.z)], B); }, 220);
  }
  cardEl.addEventListener('change', e => { if (e.target.id === 'lifeMargin') { card(); const r = $('lifeMargin'); if (r) r.focus(); return; } if (e.target.closest('#tryRange')) { const keep = e.target.value; card(); const r = $('tryRange'); if (r) { r.value = keep; r.focus(); } } });

  /* ---- layout: keep the scene clear of the rail and the card ---- */
  function layout() {
    const side = getComputedStyle(cardEl).position === 'absolute';
    const top = $('top').getBoundingClientRect().height, rr = railEl.getBoundingClientRect(), cr = cardEl.getBoundingClientRect();
    world.setInset(side ? { l: rr.right + 12, r: window.innerWidth - cr.left + 12, t: top + 8, b: 16 } : { l: 8, r: 8, t: 8, b: 8 });
    rail(); anchor();
  }
  new ResizeObserver(layout).observe(document.body);

  /* ---- theme ---- */
  const tb = $('themeBtn');
  const themeLabel = () => { const k = theme() === 'dark' ? 'ui.toLight' : 'ui.toDark'; tb.setAttribute('aria-label', t(k)); tb.title = t(k); };
  tb.addEventListener('click', () => { const n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('osl-theme', n); } catch (e) { /* storage unavailable */ } themeLabel(); card(); rail(); });
  themeLabel();

  world.setThread(S.thread);
  card(); layout();
  if (reduced()) document.documentElement.classList.add('rm');
  window.addEventListener('beforeunload', save);
}
