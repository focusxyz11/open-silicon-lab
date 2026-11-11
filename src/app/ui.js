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
import { t, fmtDate } from '../core/i18n.js';
import { THREADS, WORLDS, STOPS, CASES, FIGURES, REPO, TRIES, SHOWS, DIVES, EXITS, PLANTS, LOOP, partWord } from '../data/weave.js';
import { CLOCKS, GENS, SIDES, START, CHALLENGES, normal, changed, model, x2, dieSquare } from '../engines/chip.js';
import { N, IDS, WORLD, setWorld, worldOf, zIn, reshape, isLine, clampZ, sizeAt, sizeParts, stop, stopKey, crossing, below, above, nearest, threadOf, rootShown, threadDepths } from '../engines/weave.js';
import { createWorld, threadColor, theme, reduced } from './world.js';
import { setChip as drawChip, setBuild, BUILD_STEPS } from './scenes.js';

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
    build: BUILD_STEPS - 1
  };
  setChip(S.chip);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ world: WORLD, z: Math.round(world.z * 100) / 100, thread: S.thread, seen: S.seen, chip: S.chip, from: S.from })); } catch (e) { /* storage unavailable */ } };

  const depthName = d => t('depth.' + IDS[d] + '.name');
  /* how far down (in a dive), or which station (on the line) */
  const across = z => { if (isLine()) return t('ui.station', { n: Math.round(z) + 1, total: N }); const [n, unit] = sizeParts(sizeAt(z)); return t('ui.across', { n, unit }); };
  const railNote = d => isLine() ? t('station.' + IDS[d] + '.when') : across(d);
  const q = (th, d) => t('stop.' + stopKey(th, d) + '.q');

  /* ---- the world ---- */
  const world = createWorld($('world'), {
    zoom(z) { const a = $('acrossNow'); if (a) a.textContent = across(z); railNow(z); },
    depth(d) { see(d); card(); rail(); save(); },

    arrive(d) { see(d); card(); rail(); save(); },
    pick(th) { follow(th); },
    part(d, key) { S.part = { id: IDS[d], key }; card(); }
  });
  world.setZ(S.z);

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
  const figures = key => {
    const fs = (FIGURES[key] || []).map(id => FACT[id]).filter(Boolean); if (!fs.length) return '';
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
    return t('chip.show.' + id, { power: x2(m.power), clock: x2(m.clock), cores: m.cores, timing, battery: x2(m.battery), area: x2(m.area), density: x2(m.density),
      tick: x2(m.tick), path: x2(m.path), length: x2(m.s), wall: x2(m.wall), steps: x2(m.steps), layers: m.layers, dies: m.dies, good: m.good, yield: Math.round(m.yield * 100), cost: x2(m.cost), mm: m.side });
  };
  const readout = k => {
    const m = model(S.chip);
    if (k === 'build') return t('chip.build.names')[S.build];
    if (k === 'size') return t('chip.wafer', { cores: m.cores, power: x2(m.power), yield: Math.round(m.yield * 100), cost: x2(m.cost) });
    return t('chip.readout', { clock: x2(m.clock), power: x2(m.power), late: Math.round(m.late * 100) });
  };
  const valueText = k => k === 'clock' ? t('chip.clock.value', { v: x2(S.chip.clock) }) : k === 'size' ? t('chip.size.value', { mm: SIDES[S.chip.size] }) :
    k === 'build' ? t('chip.build.value', { n: S.build + 1, total: BUILD_STEPS }) :
    t('chip.gen.names')[S.chip.gen];
  /* the depths of this world where a setting shows */
  const showsOf = k => IDS.map((id, i) => i).filter(i => (SHOWS[IDS[i]] || []).includes(k));
  const tryIt = (key, d) => {
    const k = TRIES[key]; if (!k) return '';
    const max = { clock: CLOCKS.length - 1, gen: GENS - 1, size: SIDES.length - 1, build: BUILD_STEPS - 1 }[k];
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

  /* the ways on from here: down from a station, out from the last one, back to the line from the factory's dive */
  const ways = d => {
    const id = IDS[d], out = [];
    if (isLine()) {
      (DIVES[id] || []).forEach(([w, at]) => out.push(['dive', w, at, t('ui.diveDown', { depth: t('depth.' + at + '.name') })]));
      (EXITS[id] || []).forEach(([w, at]) => out.push(['exit', w, at, t('ui.shipTo', { world: t('world.' + w + '.name') })]));
    } else if (worldOf(WORLD).hidden) out.push(['back', 'journey', S.from || 'print', t('ui.backToLine', { station: t('depth.' + (S.from || 'print') + '.name') })]);
    if (!out.length) return '';
    return '<section class="ways"><p class="code">' + t(isLine() && EXITS[id] ? 'ui.waysOut' : isLine() ? 'ui.waysDown' : 'ui.waysBack') + '</p><div class="moves">' +
      out.map(o => '<button type="button" class="btn' + (o[0] === 'exit' ? ' primary' : '') + '" data-dive="' + o[1] + ':' + o[2] + (o[0] === 'back' ? '' : ':' + id) + '">' + esc(o[3]) + '</button>').join('') + '</div></section>';
  };

  const companion = (th, d) => '<button type="button" class="link" data-companion aria-expanded="false">' + t('ui.companion') + '</button><div class="companion" hidden><p class="small muted">' + t('ui.companionNote') +
    '</p><textarea readonly rows="7" aria-label="' + esc(t('ui.companion')) + '">' + esc(prompt(th, d)) + '</textarea><div class="moves"><button type="button" class="btn" data-copy>' + t('ui.copy') + '</button><span class="small muted" role="status"></span></div></div>';
  const qButton = (th, d) => '<button type="button" class="qpick" data-th="' + th + '" style="--th:' + threadColor(th) + '"><i></i><span>' + esc(q(th, d)) + '</span></button>';
  function card() {
    const d = Math.round(world.z), th = S.thread;
    setBuild(null);   /* a switch is shown finished, unless "Build it" is open */
    if (S.part && S.part.id !== IDS[d]) S.part = null;
    let h = '<p class="where"><b>' + esc(depthName(d)) + '</b> <span id="acrossNow">' + esc(across(world.z)) + '</span></p>';
    /* on the line: which building you are in, and whether this machine is part of the loop every layer goes round */
    if (isLine() && PLANTS[IDS[d]]) h += '<p class="small plant">' + esc(t('plant.' + PLANTS[IDS[d]])) + (LOOP.includes(IDS[d]) ? ' · ' + esc(t('ui.inLoop', { layers: model(S.chip).layers })) : '') + '</p>';
    h += partCard(d);
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
  cardEl.addEventListener('input', e => { const r = e.target.closest('#tryRange'); if (r) setSetting(r.dataset.setting, +r.value); });
  cardEl.addEventListener('change', e => { if (e.target.closest('#tryRange')) { const keep = e.target.value; card(); const r = $('tryRange'); if (r) { r.value = keep; r.focus(); } } });

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
