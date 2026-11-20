/* The map: the first page (#/). A wafer coming out of the fab, four toys played in seconds, the first things to try,
   and the map of everything visual and interactive in the lab: design coming down, the factory building back up,
   scale in the middle, and one of the twelve questions at a time drawn as a thread through the stations it touches.
   Every station opens its own view of the chip world; the island is one way in (#/island). Data: src/data/home.js;
   logic: src/engines/home.js. Words are read with t(); the map's own are home.* */
import { t, fmtNum, fmtWords } from '../core/i18n.js';
import { MAP, STATIONS, LINES, ARROWS, LOOP_PATH, SCALE_PATH, THREADS, WAYS, STARTS, TOYS, SCALE } from '../data/home.js';
import * as H from '../engines/home.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const w = (k, o) => t('home.' + k, o);
const ARROW = { down: '▼', up: '▲', left: '◀', right: '▶' };
/* the kind of thing a challenge is, for its tag */
const KIND = { design: 'build', fit: 'build', evolve: 'build', aibuild: 'build', bet: 'puzzle', agent: 'puzzle', spot: 'puzzle', teardown: 'see' };
const kindOf = c => KIND[c.kind] || 'play';

/* ctx: challenges, chOf(id), titleOf(c), doHref(c), doHome(c), sizeOf(level), sizeWords(m), still() */
export function createHome(host, ctx) {
  const at = H.challengesAt(ctx.challenges, ctx.doHome);
  const S = { way: null, sel: null, thread: null, zoom: SCALE.indexOf(TOYS.zoom.start), q: 0, a: 1, b: 0, gate: 'NAND', year: 0, pack: 1, size: 1, seed: 7, rev: 0 };
  let timer = 0, idle = 0, W = null, dieEls = [];
  const nameOf = id => t(H.byId[id].name);
  const chs = id => at[id].map(ctx.chOf).filter(Boolean);
  const nPlay = id => at[id].length + H.byId[id].pages.length;

  /* ---- the page ---- */
  function draw() {
    host.innerHTML = '<div class="hm">' + heroHtml() + '<div class="hm-toys">' + ['gate', 'shrink', 'pack', 'zoom'].map(k => '<section class="hm-toy hm-' + k + '" data-toy="' + k + '"></section>').join('') + '</div>' +
      '<div class="hm-starts" data-starts></div>' + waysHtml() + '<div class="hm-stage" data-mapat><div class="hm-mapcard"><div class="hm-thread" data-threadbar></div><div class="hm-fit" data-fit><div class="hm-map" data-map style="width:' + MAP.w + 'px;height:' + MAP.h + 'px"></div></div><div class="hm-strips" data-strips></div></div><aside class="hm-side" data-side aria-live="polite"></aside></div>' +
      legendHtml() + '</div>';
    ['gate', 'shrink', 'pack', 'zoom'].forEach(toy); starts(); newWafer(); paint();
  }
  /* the map keeps its drawing and is scaled down to the card when the card is narrower */
  function fit() {
    const f = host.querySelector('[data-fit]'), m = host.querySelector('[data-map]'); if (!f || !m || !f.clientWidth) return;
    const s = Math.min(1, f.clientWidth / MAP.w);
    m.style.transform = s < 1 ? 'scale(' + s.toFixed(4) + ')' : ''; m.style.margin = s < 1 ? '0' : '0 auto'; f.style.height = Math.round(MAP.h * s) + 'px';
  }
  addEventListener('resize', () => { if (!host.hidden) fit(); });
  /* what changes when the visitor picks something on the map */
  function paint() { mapDraw(); strips(); side(); threadBar(); ways(); }

  /* ---- the hero: what this is, two ways on, and a wafer leaving the fab ---- */
  function heroHtml() {
    const m = STATIONS.filter(s => s.line === 'scale').map(s => ctx.sizeOf(s.id)).filter(Boolean), powers = Math.round(Math.log10(Math.max(...m) / Math.min(...m)));
    return '<section class="hm-hero"><div class="hm-herotext"><p class="kicker">' + esc(w('kicker')) + '</p><h1>' + esc(w('title')) + '</h1><p class="hm-lead">' + esc(w('lead')) + '</p>' +
      '<div class="hm-ctas"><button type="button" class="btn primary" data-tomap>' + esc(w('toMap')) + '</button><a class="btn ghost" href="#/island">' + esc(w('toIsland')) + '</a></div>' +
      '<div class="hm-stats">' + [[STATIONS.length, 'stations'], [ctx.challenges.length, 'plays'], [powers, 'powers'], [1, 'loop']].map(([n, k]) => '<div><b>' + esc(fmtNum(n)) + '</b><span>' + esc(w('stat.' + k)) + '</span></div>').join('') + '</div></div>' +
      '<div class="hm-wafercard"><div class="hm-wafer" data-wafer></div><div class="hm-winfo" data-winfo></div></div></section>';
  }
  function newWafer() {
    W = H.wafer(S.size, S.seed); S.rev = ctx.still() ? W.dies.length : 0; idle = 0;
    const box = host.querySelector('[data-wafer]'); if (!box) return;
    box.style.setProperty('--side', W.side + 'px');
    box.innerHTML = '<span class="hm-sheen"></span>' + W.dies.map(d => '<i class="hm-die" style="left:' + d.x + 'px;top:' + d.y + 'px;width:' + d.s + 'px;height:' + d.s + 'px"></i>').join('') +
      W.dust.map(p => '<b class="hm-dust" style="left:' + p.x + 'px;top:' + p.y + 'px"></b>').join('') + '<span class="hm-notch"></span>';
    dieEls = [...box.querySelectorAll('.hm-die')]; dieEls.forEach((el, i) => { if (i < S.rev) el.classList.add(W.dies[i].bad ? 'bad' : 'ok'); });
    winfo();
  }
  /* the wafer's card is made once; while chips are tested only its count changes, so a control in it keeps focus */
  function winfo() {
    const y = H.yieldOf(W.dies, S.rev), el = host.querySelector('[data-winfo]'); if (!el) return;
    const pct = el.querySelector('[data-wpct]');
    if (pct) { pct.textContent = y.pct == null ? '–' : fmtNum(y.pct); el.querySelector('[data-wtested]').textContent = w('wafer.tested', { good: fmtNum(y.good), done: fmtNum(y.done) });
      el.querySelectorAll('[data-wsize]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.wsize === S.size))); return; }
    const bet = ctx.chOf(TOYS.wafer.ch);
    el.innerHTML = '<p class="kicker"><span class="hm-live"></span>' + esc(w('wafer.k')) + '</p><p class="hm-pct"><b data-wpct>' + (y.pct == null ? '–' : esc(fmtNum(y.pct))) + '</b><span>' + esc(w('wafer.pct')) + '</span></p>' +
      '<p class="small muted" data-wtested>' + esc(w('wafer.tested', { good: fmtNum(y.good), done: fmtNum(y.done) })) + '</p><p class="kicker">' + esc(w('wafer.size')) + '</p><div class="hm-pills">' +
      TOYS.wafer.sizes.map((_, i) => '<button type="button" class="hm-pill" data-wsize="' + i + '" aria-pressed="' + (i === S.size) + '">' + esc(w('wafer.s' + i)) + '</button>').join('') + '</div>' +
      '<p class="small">' + esc(w('wafer.note')) + '</p><div class="hm-pills"><button type="button" class="hm-pill" data-rerun>↻ ' + esc(w('wafer.again')) + '</button>' + (bet ? '<a class="hm-pill hm-go" href="' + esc(ctx.doHref(bet)) + '">' + esc(w('wafer.bet')) + ' →</a>' : '') + '</div>' +
      '<button type="button" class="hm-wq" data-follow="' + TOYS.wafer.thread + '"><span class="hm-spark"></span>' + esc(t(H.threadOf(TOYS.wafer.thread).word)) + '</button>';
  }
  function tick() {
    if (!W || host.hidden) return;
    if (S.rev < W.dies.length) {
      const to = Math.min(W.dies.length, S.rev + Math.ceil(W.dies.length / 22));
      for (let i = S.rev; i < to; i++) if (dieEls[i]) dieEls[i].classList.add(W.dies[i].bad ? 'bad' : 'ok');
      S.rev = to; winfo(); return;
    }
    if (++idle > 45) { S.seed++; newWafer(); }
  }

  /* ---- the toys ---- */
  function toy(k) {
    const el = host.querySelector('[data-toy="' + k + '"]'); if (!el) return;
    const head = (ttl, kick) => '<p class="kicker">' + esc(w('toy.' + kick)) + '</p><h2>' + esc(w(ttl)) + '</h2>';
    const foot = (id, thread) => '<div class="hm-tfoot">' + (id ? '<button type="button" data-st="' + id + '" data-showmap>' + esc(w('toy.onMap', { at: nameOf(id) })) + ' →</button>' : '') + (thread ? '<button type="button" data-follow="' + thread + '"><span class="hm-spark"></span>' + esc(w('toy.follow')) + '</button>' : '') + '</div>';
    if (k === 'gate') {
      const o = H.gate(S.gate, S.a, S.b), on = v => (v ? ' on' : ''), half = ctx.chOf(TOYS.gate.ch);
      el.innerHTML = head('gate.t', 'logic') + '<div class="hm-gstage"><button type="button" class="hm-sw' + on(S.a) + '" data-gin="a" style="top:10px"><span>A</span><b>' + S.a + '</b></button><button type="button" class="hm-sw' + on(S.b) + '" data-gin="b" style="top:70px"><span>B</span><b>' + S.b + '</b></button>' +
        '<i class="hm-wire' + on(S.a) + '" style="left:62px;top:27px;width:52px"></i><i class="hm-wire' + on(S.b) + '" style="left:62px;top:87px;width:52px"></i><span class="hm-gbox">' + esc(S.gate) + '</span><i class="hm-wire' + on(o) + '" style="left:184px;top:57px;width:40px"></i><span class="hm-bulb' + on(o) + '">' + o + '</span></div>' +
        '<div class="hm-pills">' + TOYS.gate.gates.map(g => '<button type="button" class="hm-pill" data-gate="' + g + '" aria-pressed="' + (g === S.gate) + '">' + g + '</button>').join('') + '</div>' +
        '<p class="small muted">' + esc(w('gate.d')) + '</p>' + '<div class="hm-tfoot">' + (half ? '<a href="' + esc(ctx.doHref(half)) + '">' + esc(w('gate.play')) + ' →</a>' : '') + '<button type="button" data-st="' + TOYS.gate.at + '" data-showmap>' + esc(w('toy.onMap', { at: nameOf(TOYS.gate.at) })) + ' →</button></div>';
    }
    if (k === 'shrink') {
      const yr = TOYS.shrink.years[S.year], n = H.shrinkAt(yr), cell = [30, 16, 9, 5, 3][S.year], leak = [0, 5, 25, 55, 90][S.year];
      el.innerHTML = head('shrink.t', 'fab') + '<div class="hm-row"><div class="hm-shchip" style="background-size:' + cell + 'px ' + cell + 'px">' + Array.from({ length: Math.round(leak / 9) }, (_, i) => '<i class="hm-leak" style="left:' + ((i * 37) % 104 + 4) + 'px;top:' + ((i * 23) % 90 + 4) + 'px;animation-delay:' + ((i * 0.37) % 1.8).toFixed(2) + 's"></i>').join('') + '</div>' +
        '<div class="hm-read"><p class="hm-big">' + esc(String(yr)) + '</p><p class="small muted">' + esc(w('shrink.n', { n: fmtWords(n) })) + '</p><div class="hm-meter"><span class="kicker">' + esc(w('shrink.leak')) + '</span><span class="hm-bar"><i style="width:' + leak + '%;background:var(--hm-thread)"></i></span></div></div></div>' +
        '<div class="hm-pills">' + TOYS.shrink.years.map((y, i) => '<button type="button" class="hm-pill" data-year="' + i + '" aria-pressed="' + (i === S.year) + '">' + y + '</button>').join('') + '</div>' +
        '<p class="small muted">' + esc(w('shrink.src')) + '</p>' + foot(TOYS.shrink.at, TOYS.shrink.thread);
    }
    if (k === 'pack') {
      const p = H.packAt(S.pack), side = 90 + 2 * p.gap, hot = ['hot', 'warm', 'cool'][S.pack];
      el.innerHTML = head('pack.t', 'energy') + '<div class="hm-row"><div class="hm-pkgrid ' + hot + '" style="width:' + side + 'px;height:' + side + 'px;gap:' + p.gap + 'px">' + '<i></i>'.repeat(9) + '<span class="hm-bus"><b style="animation-duration:' + (0.5 + side / 90).toFixed(2) + 's"></b></span></div>' +
        '<div class="hm-read"><div class="hm-meter"><span class="kicker">' + esc(w('pack.talk')) + '</span><span class="hm-bar"><i style="width:' + p.talk + '%;background:var(--accent)"></i></span></div><div class="hm-meter"><span class="kicker">' + esc(w('pack.heat')) + '</span><span class="hm-bar"><i style="width:' + p.heat + '%;background:var(--bad)"></i></span></div><p class="small muted">' + esc(w('pack.n' + S.pack)) + '</p></div></div>' +
        '<div class="hm-pills">' + [0, 1, 2].map(i => '<button type="button" class="hm-pill" data-pack="' + i + '" aria-pressed="' + (i === S.pack) + '">' + esc(w('pack.p' + i)) + '</button>').join('') + '</div>' + foot(TOYS.pack.at, TOYS.pack.thread);
    }
    if (k === 'zoom') {
      const id = SCALE[S.zoom], T = H.twinsOf(id), m = ctx.sizeOf(id), sq = 60, next = SCALE[S.zoom + 1], inner = next ? Math.max(4, Math.round(sq * ctx.sizeOf(next) / m)) : 0;
      el.innerHTML = '<div class="hm-zhead"><div>' + head('zoom.t', 'scale') + '</div><span class="hm-pills"><button type="button" class="hm-pill" data-zoom="-1" aria-label="' + esc(w('zoom.out')) + '">−</button><button type="button" class="hm-pill" data-zoom="1" aria-label="' + esc(w('zoom.in')) + '">+</button></span></div>' +
        '<div class="hm-zread"><span class="hm-zbox"><i style="width:' + sq + 'px;height:' + sq + 'px"></i>' + (inner ? '<b style="width:' + inner + 'px;height:' + inner + 'px"></b>' : '') + '</span><div><p class="hm-zname">' + esc(nameOf(id)) + ' <span>' + esc(ctx.sizeWords(m)) + '</span></p><p class="small muted">' + esc(t(H.byId[id].see)) + '</p></div></div>' +
        '<ol class="hm-ruler">' + SCALE.map((s, i) => '<li><button type="button" data-zat="' + i + '" aria-pressed="' + (i === S.zoom) + '"><i></i><span>' + esc(nameOf(s)) + '</span><small>' + esc(ctx.sizeWords(ctx.sizeOf(s))) + '</small></button></li>').join('') + '</ol>' +
        (T ? '<div class="hm-twins">' + T.ids.map(x => '<button type="button" data-st="' + x + '" data-showmap><span class="kicker hm-c-' + H.byId[x].line + '">' + esc(w('twin.' + H.byId[x].line)) + '</span><b>' + esc(nameOf(x)) + '</b></button>').join('') + '</div>' : '<p class="small muted">' + esc(w('zoom.flown')) + '</p>');
    }
  }

  /* ---- the first things to try, of different kinds, and one question ---- */
  function starts() {
    const el = host.querySelector('[data-starts]'); if (!el) return;
    const T = THREADS[S.q % THREADS.length];
    el.innerHTML = '<p class="kicker hm-full">' + esc(w('start.k')) + '</p>' + STARTS.map(x => { const c = x.ch && ctx.chOf(x.ch); if (x.ch && !c) return '';
      const href = c ? ctx.doHref(c) : x.href, title = c ? ctx.titleOf(c) : w('start.' + x.word + '.t'), line = w('start.' + (x.ch || x.word) + '.l');
      return '<a class="hm-start" href="' + esc(href) + '"><span class="hm-tag t-' + x.kind + '">' + esc(w('tag.' + x.kind)) + '</span><b>' + esc(title) + '</b><span class="small muted">' + esc(line) + '</span><span class="hm-at hm-c-' + H.byId[x.at].line + '">' + esc(nameOf(x.at)) + ' →</span></a>'; }).join('') +
      '<div class="hm-start hm-qcard"><span class="hm-tag t-q">' + esc(w('tag.q')) + '</span><p class="hm-q">' + esc(t(T.word)) + '</p><div class="hm-pills"><button type="button" class="hm-pill hm-pink" data-follow="' + T.id + '">✦ ' + esc(w('start.follow')) + '</button><button type="button" class="hm-pill" data-nextq aria-label="' + esc(w('start.another')) + '">↻</button></div></div>';
  }

  /* ---- ways in ---- */
  const waysHtml = () => '<nav class="hm-ways" data-ways></nav>';
  function ways() {
    const el = host.querySelector('[data-ways]'); if (!el) return;
    el.innerHTML = '<span class="kicker">' + esc(w('way.k')) + '</span>' + WAYS.map(x => '<button type="button" class="hm-way" data-way="' + x.id + '" aria-pressed="' + (S.way === x.id) + '"><span class="g">' + esc(w('way.' + x.id + '.g')) + '</span><span><b>' + esc(w('way.' + x.id + '.t')) + '</b><small>' + esc(w('way.' + x.id + '.l')) + '</small></span></button>').join('') +
      '<button type="button" class="hm-all" data-way="" aria-pressed="' + (!S.way && !S.thread) + '">' + esc(w('way.all')) + '</button>';
  }

  /* ---- the map ---- */
  function mapDraw() {
    const el = host.querySelector('[data-map]'); if (!el) return;
    const L = H.lit(S.way, S.thread), sel = S.sel, linked = sel ? H.linksOf(sel) : [], tw = sel && H.twinsOf(sel), twins = tw ? tw.ids : [], T = H.threadOf(S.thread);
    const box = (b, cls, style) => '<i class="' + cls + '" style="left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.h + 'px' + (style || '') + '"></i>';
    let h = H.wires().map(b => box(b, 'hm-ln ' + 'hm-bg-' + b.line + (L.line(b.line) ? '' : ' dim'))).join('');
    if (T) h += H.threadRuns(T.id).map(b => box(b, 'hm-trun' + (b.across ? ' across' : ''))).join('');
    h += ARROWS.map(([x, y, d, line]) => '<span class="hm-arw hm-c-' + line + (L.line(line) ? '' : ' dim') + '" style="left:' + x + 'px;top:' + y + 'px" aria-hidden="true">' + ARROW[d] + '</span>').join('');
    h += '<span class="hm-pkt" style="offset-path:path(\'' + LOOP_PATH + '\')"></span><span class="hm-pkt" style="offset-path:path(\'' + LOOP_PATH + '\');animation-delay:-4.6s"></span><span class="hm-pkt" style="offset-path:path(\'' + LOOP_PATH + '\');animation-delay:-9.3s"></span><span class="hm-pkt s" style="offset-path:path(\'' + SCALE_PATH + '\')"></span>';
    h += [['design', 200, 604], ['scale', 500, 54], ['make', 800, 604]].map(([k, x, y]) => '<p class="hm-colhead" style="left:' + x + 'px;top:' + y + 'px"><b class="hm-c-' + k + '">' + esc(w('col.' + k)) + '</b><span>' + esc(w('col.' + k + '.d')) + '</span></p>').join('');
    h += '<p class="hm-looptag hm-c-loop">' + esc(w('col.loop')) + '</p>';
    h += STATIONS.map(s => { const n = nPlay(s.id), q = H.threadAt(s.id), on = T && T.path.includes(s.id);
      return '<button type="button" class="hm-st k-' + s.kind + ' hm-c-' + s.line + (L.station(s.id) ? '' : ' dim') + (sel === s.id ? ' sel' : '') + (linked.includes(s.id) ? ' linked' : '') + (twins.includes(s.id) ? ' twin' : '') + (on ? ' onq' : '') + '" data-st="' + s.id + '" style="left:' + s.x + 'px;top:' + s.y + 'px" aria-pressed="' + (sel === s.id) + '">' +
        '<span class="hm-o"><i class="dot"></i>' + (n ? '<span class="hm-badge">' + n + '</span>' : '') + (q ? '<span class="hm-qdot" title="' + esc(w('q.has')) + '"></span>' : '') +
        '<span class="lbl s-' + s.side + '">' + esc(nameOf(s.id)) + (s.sub ? '<small>' + esc(w('sub.' + s.id)) + '</small>' : '') + '</span></span></button>'; }).join('');
    el.innerHTML = h;
  }
  /* the phone's map: the three lines as strips, the same stations, the same card */
  function strips() {
    const el = host.querySelector('[data-strips]'); if (!el) return;
    const L = H.lit(S.way, S.thread), T = H.threadOf(S.thread);
    el.innerHTML = [['design', ['lab', ...STATIONS.filter(s => s.line === 'design').map(s => s.id)]], ['make', STATIONS.filter(s => s.line === 'make').map(s => s.id).concat('use')], ['scale', SCALE]].map(([k, ids]) =>
      '<section class="hm-strip hm-c-' + k + '"><p class="kicker">' + esc(w('col.' + k)) + ' · ' + esc(w('col.' + k + '.d')) + '</p><ol>' + ids.map(id => '<li><button type="button" data-st="' + id + '" class="' + (L.station(id) ? '' : 'dim') + (S.sel === id ? ' sel' : '') + (T && T.path.includes(id) ? ' onq' : '') + '"><i></i>' + esc(nameOf(id)) + (nPlay(id) ? '<span class="hm-badge">' + nPlay(id) + '</span>' : '') + '</button></li>').join('') + '</ol></section>').join('');
  }
  function threadBar() {
    const el = host.querySelector('[data-threadbar]'); if (!el) return;
    const T = H.threadOf(S.thread);
    el.innerHTML = '<span class="hm-spark"></span>' + (T ? '<p class="hm-q">' + esc(t(T.word)) + '</p><span class="kicker">' + esc(w('q.stops', { n: T.path.length })) + '</span><button type="button" class="hm-pill" data-nextthread>↻ ' + esc(w('q.another')) + '</button><button type="button" class="hm-pill" data-unthread aria-label="' + esc(t('sheet.close')) + '">×</button>'
      : '<p class="small muted">' + esc(w('q.hint')) + '</p><button type="button" class="hm-pill hm-pink" data-nextthread>✦ ' + esc(w('q.follow')) + '</button>');
  }
  /* the card beside the map: a station, or how to read the map */
  function side() {
    const el = host.querySelector('[data-side]'); if (!el) return;
    const s = S.sel && H.byId[S.sel];
    if (!s) {
      el.innerHTML = '<p class="kicker">' + esc(w('read.k')) + '</p><h2>' + esc(w('read.t')) + '</h2>' + ['design', 'make', 'scale', 'loop'].map(k => '<div class="hm-how"><i class="hm-bg-' + k + '"></i><div><b>' + esc(w('read.' + k)) + '</b><span class="small muted">' + esc(w('read.' + k + '.d')) + '</span></div></div>').join('') +
        '<div class="hm-glint"><p class="kicker"><span class="hm-spark"></span>' + esc(w('read.q')) + '</p><p class="small">' + esc(w('read.q.d')) + '</p></div><p class="kicker hm-end">' + esc(w('read.tap')) + '</p>';
      return;
    }
    const C = chs(s.id), tw = H.twinsOf(s.id), twins = tw ? tw.ids : [], links = H.linksOf(s.id).filter(x => !twins.includes(x)), q = H.threadAt(s.id);
    const chip = id => '<button type="button" class="hm-chip" data-st="' + id + '"><i class="hm-bg-' + H.byId[id].line + '"></i>' + esc(nameOf(id)) + '</button>';
    el.innerHTML = '<div class="hm-dk"><i class="hm-swatch hm-bg-' + s.line + '"></i><span class="kicker">' + esc(w('line.' + s.line)) + '</span><button type="button" class="x" data-unsel aria-label="' + esc(t('sheet.close')) + '">×</button></div>' +
      '<h2>' + esc(nameOf(s.id)) + '</h2><p class="hm-see">' + esc(t(s.see)) + '</p>' +
      (C.length || s.pages.length ? '<p class="kicker">' + esc(w('side.try')) + '</p><div class="hm-items">' + C.map(c => '<a class="hm-item" href="' + esc(ctx.doHref(c)) + '"><span class="hm-tag t-' + kindOf(c) + '">' + esc(w('tag.' + kindOf(c))) + '</span><span>' + esc(ctx.titleOf(c)) + '</span></a>').join('') +
        s.pages.map(([href, k]) => '<a class="hm-item" href="' + esc(href) + '"><span class="hm-tag t-page">' + esc(w('tag.page')) + '</span><span>' + esc(t(k)) + '</span></a>').join('') + '</div>' : '') +
      (tw ? '<p class="kicker">' + esc(w('side.level', { level: nameOf(tw.level) })) + '</p><div class="hm-chips">' + twins.map(chip).join('') + '</div>' : '') +
      (links.length ? '<p class="kicker">' + esc(w('side.joined')) + '</p><div class="hm-chips">' + links.map(chip).join('') + '</div>' : '') +
      (q ? '<div class="hm-glint"><p class="kicker"><span class="hm-spark"></span>' + esc(w('side.q')) + '</p><p class="hm-q">' + esc(t(q.word)) + '</p><button type="button" class="hm-pill hm-pink" data-follow="' + q.id + '">✦ ' + esc(w('side.follow')) + '</button></div>' : '') +
      '<a class="btn primary hm-enter" href="' + esc(s.href) + '">' + esc(w('side.go', { at: nameOf(s.id) })) + ' →</a>';
  }
  const legendHtml = () => '<footer class="hm-legend">' + [['dot', 'stop'], ['hub', 'hub'], ['lvl', 'level']].map(([k, x]) => '<span><i class="hm-lg ' + k + '"></i>' + esc(w('legend.' + x)) + '</span>').join('') +
    '<span><i class="hm-badge hm-lgb">3</i>' + esc(w('legend.plays')) + '</span><span><i class="hm-spark"></i>' + esc(w('legend.q')) + '</span><span class="hm-tags">' + ['play', 'puzzle', 'build', 'lab', 'see', 'page'].map(k => '<i class="hm-tag t-' + k + '">' + esc(w('tag.' + k)) + '</i>').join('') + '</span></footer>';

  /* ---- moves ---- */
  const toMap = () => { const m = host.querySelector('[data-mapat]'); if (m) m.scrollIntoView({ behavior: ctx.still() ? 'auto' : 'smooth', block: 'start' }); };
  host.addEventListener('click', e => {
    const g = sel => e.target.closest(sel);
    let b;
    if (g('[data-tomap]')) { toMap(); return; }
    if ((b = g('[data-wsize]'))) { S.size = +b.dataset.wsize; newWafer(); return; }
    if (g('[data-rerun]')) { S.seed++; newWafer(); return; }
    if ((b = g('[data-gin]'))) { S[b.dataset.gin] = 1 - S[b.dataset.gin]; toy('gate'); return; }
    if ((b = g('[data-gate]'))) { S.gate = b.dataset.gate; toy('gate'); return; }
    if ((b = g('[data-year]'))) { S.year = +b.dataset.year; toy('shrink'); return; }
    if ((b = g('[data-pack]'))) { S.pack = +b.dataset.pack; toy('pack'); return; }
    if ((b = g('[data-zoom]'))) { S.zoom = Math.max(0, Math.min(SCALE.length - 1, S.zoom + +b.dataset.zoom)); S.sel = SCALE[S.zoom]; toy('zoom'); paint(); return; }
    if ((b = g('[data-zat]'))) { S.zoom = +b.dataset.zat; S.sel = SCALE[S.zoom]; toy('zoom'); paint(); return; }
    if ((b = g('[data-follow]'))) { S.thread = b.dataset.follow; S.way = null; paint(); toMap(); return; }
    if (g('[data-nextq]')) { S.q++; starts(); return; }
    if (g('[data-nextthread]')) { S.thread = H.nextThread(S.thread); S.way = null; paint(); return; }
    if (g('[data-unthread]')) { S.thread = null; paint(); return; }
    if ((b = g('[data-way]'))) { S.way = b.dataset.way && S.way !== b.dataset.way ? b.dataset.way : null; S.thread = null; paint(); return; }
    if (g('[data-unsel]')) { S.sel = null; paint(); return; }
    if ((b = g('[data-st]'))) { S.sel = b.dataset.st; const i = SCALE.indexOf(S.sel); if (i >= 0 && i !== S.zoom) { S.zoom = i; toy('zoom'); } paint(); if (b.hasAttribute('data-showmap')) toMap(); }
  });

  return {
    show() { if (!host.firstChild) draw(); host.hidden = false; fit(); clearInterval(timer); if (!ctx.still()) timer = setInterval(tick, 70); },
    hide() { host.hidden = true; clearInterval(timer); timer = 0; }
  };
}
