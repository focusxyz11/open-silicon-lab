/* Build your own AI chip (kind 'aibuild', at the studio's need), from src/engines/aibuild.js: the capstone.
   A brief says what the chip is for (so much speed, within this power, cost and date); the architect's choices
   (the kind of chip, the process, the area, the dies, the memory beside it, the package, the clock, the team) each
   move speed, power, cost, yield and schedule at once. The bench shows the chip being specified (its dies and memory
   to scale, on its first wafer with the dies that work and the ones that do not), the brief as gauges, the months to
   the first wafer and to shipping, and a reviewer's notes, each naming the choice it is about. Taping out is the
   check: the engine's own (B.CHALLENGES[brief].check) decides.
   A lab of the challenge player (src/v2/play.js): lab(L) gets the player's pieces and returns { draw, click, input }.
   The choices are kept in the save (S.aibuild), one design per brief. */
import * as B from '../../engines/aibuild.js';
import { fmtNum } from '../../core/i18n.js';

const BRIEFS = ['infer', 'phone', 'train'];
/* where each brief starts: a plain first sketch that misses it in more than one way (not the engine's presets, which
   are one move from their answer) */
const START = {
  infer: { arch: 'gpu', node: 'n5', area: 200, dies: 1, sram: 64, fp4: false, mem: 'gd', memN: 8, pkg: 'fc', f: 1.6, agents: false },
  phone: { arch: 'gpu', node: 'n3', area: 60, dies: 1, sram: 64, fp4: false, mem: 'lp', memN: 4, pkg: 'org', f: 2.0, agents: false },
  train: { arch: 'gpu', node: 'n3', area: 400, dies: 1, sram: 64, fp4: false, mem: 'h3', memN: 4, pkg: 'cs', f: 1.6, agents: false }
};
/* the choice each of the reviewer's notes, and each reason a chip cannot be built, is about */
const AT = { 'memory-bound': 'mem', 'compute-bound': 'area', 'low-yield': 'area', 'power-close': 'f', 'newest-node': 'node', compiler: 'arch', 'cpu-math': 'arch', agents: 'agents', fp4: 'fp4', 'hbm-share': 'mem',
  reticle: 'area', 'needs-interposer': 'pkg', stacks: 'pkg', dies: 'pkg', silicon: 'pkg', clock: 'f', 'no-memory': 'mem' };
/* a trade-off that is the subject of another lab: the choice, and that challenge (src/v2/game.js CHALLENGES) */
const ELSE = { area: 'cores', node: 'litho-finest', agents: 'agent', mem: 'batch' };
const PHASES = ['design', 'masks', 'fab', 'packaging', 'bringup'];

export default function lab(L) {
  const { S, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  const num = (v, lo, hi, d) => Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d, pick = (v, T, d) => T[v] ? v : d;
  const normal = (o, id) => { const s = START[id]; o = o && typeof o === 'object' ? o : {};
    return B.tidy({ mission: id, arch: pick(o.arch, B.ARCH, s.arch), node: pick(o.node, B.NODE, s.node), area: Math.round(num(o.area, B.LIMITS.area[0], B.LIMITS.area[1], s.area)), dies: B.DIES.includes(o.dies) ? o.dies : s.dies,
      sram: Math.round(num(o.sram, B.LIMITS.sram[0], B.LIMITS.sram[1], s.sram)), fp4: typeof o.fp4 === 'boolean' ? o.fp4 : s.fp4, mem: pick(o.mem, B.MEM, s.mem), memN: Math.round(num(o.memN, B.LIMITS.memN[0], B.LIMITS.memN[1], s.memN)),
      pkg: pick(o.pkg, B.PKG, s.pkg), f: +num(o.f, B.LIMITS.f[0], B.LIMITS.f[1], s.f).toFixed(1), agents: typeof o.agents === 'boolean' ? o.agents : s.agents }); };
  const state = () => { const o = S.aibuild && typeof S.aibuild === 'object' ? S.aibuild : {}, met = {}; BRIEFS.forEach(id => { if (o.met && o.met[id]) met[id] = true; });
    return (S.aibuild = { brief: BRIEFS.includes(o.brief) ? o.brief : BRIEFS[0], c: Object.fromEntries(BRIEFS.map(id => [id, normal((o.c || {})[id], id)])), met, tapes: Number.isInteger(o.tapes) && o.tapes > 0 ? o.tapes : 0 }); };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- numbers as words ---- */
  const n0 = v => fmtNum(Math.round(v)), n1 = v => fmtNum(+v.toFixed(1), { minimumFractionDigits: 1 });
  const fig = (key, v) => key === 'tps' || key === 'power' ? (v >= 10 || !v ? n0(v) : n1(v)) : key === 'months' || key === 'pf8' || key === 'bw' ? n1(v) : n0(v);
  const val = (key, v) => t('aib.v.' + ({ tps: 'tps', power: 'w', cost: 'usd', months: 'months', pf8: 'pf', bw: 'tbs' }[key] || 'gb'), { v: fig(key, v) });
  const ms = s => t('aib.v.ms', { v: s * 1000 >= 10 ? n0(s * 1000) : fmtNum(+(s * 1000).toPrecision(2)) });
  const score = (key, v) => !Number.isFinite(v) ? t('aib.none') : key === 'cpm' ? t('aib.v.usd', { v: fmtNum(+v.toFixed(4), { minimumFractionDigits: 4 }) }) : n1(v);

  /* ---- the brief as gauges: each requirement, the value now, and the line it must reach (four fifths along) ---- */
  function goalbox(A, d) {
    const done = !!A.met[A.brief];
    const g = r => { const fit = r.op === 'fit', lim = fit ? r.need : r.limit, key = fit ? 'cap' : r.key;
      return '<div class="gauge aibgauge' + (r.ok ? ' ok' : '') + '"><span class="gl">' + esc(r.key === 'tps' ? t('aib.req.tps.' + A.brief) : t('aib.req.' + r.key)) + ' <span class="muted">' + esc(t(fit ? 'aib.needs' : r.op === '>=' ? 'aib.atLeast' : 'aib.atMost', { v: fig(key, lim) })) +
        '</span></span><span class="gv">' + esc(val(key, r.value)) + '</span><span class="gbar"><span style="width:' + Math.min(100, r.value / lim * 80).toFixed(0) + '%"></span><i class="aibtick"></i></span></div>'; };
    const G = d.goal, stars = [1, 2, 3].map(k => '<i class="' + (d.stars >= k ? 'on' : '') + '">★</i>').join('');
    return '<div class="goalbox' + (d.all ? ' ok' : '') + '"><p class="kicker">' + esc(t(done ? 'aib.shipped' : d.all ? 'aib.ready' : 'aib.brief')) + '</p>' + d.rows.map(g).join('') +
      '<p class="small aibscore' + (d.all ? '' : ' muted') + '"><span class="aibstars" aria-hidden="true">' + stars + '</span> ' + esc(t('aib.goal.' + G.key)) + ' <b class="mono">' + esc(d.all ? score(G.key, G.value) : t('aib.none')) + '</b> <span class="muted">' +
      esc(t(G.higher ? 'aib.starsUp' : 'aib.starsDown', { a: score(G.key, G.stars[0]), b: score(G.key, G.stars[1]) })) + '</span></p></div>';
  }

  /* ---- the picture: the first wafer with its dies, good and dead, and beside it the chip in its package, to scale ---- */
  function figure(c, d, W) {
    const n = B.NODE[c.node], me = B.MEM[c.mem], side = Math.sqrt(d.dieA);
    /* the wafer: 300 mm across, the dies the engine laid out, drawn as two paths */
    const cx = 76, cy = 84, k = 72 / 150, p = side + 0.1, gap = side * k > 6 ? 0.8 : side * k > 3 ? 0.4 : 0.15, q = side * k - gap;
    let good = '', dead = '';
    for (const x of W.dies) { const r = 'M' + (cx + (x.i * p - side / 2) * k).toFixed(1) + ' ' + (cy + (x.j * p - side / 2) * k).toFixed(1) + 'h' + q.toFixed(1) + 'v' + q.toFixed(1) + 'h-' + q.toFixed(1) + 'z'; if (x.ok) good += r; else dead += r; }
    let s = '<svg viewBox="0 0 340 178" role="img" aria-label="' + esc(t('aib.fig.aria', { good: W.good, total: W.total, area: n0(d.dieA), dies: c.dies, mem: c.memN })) + '">' +
      '<circle class="wf" cx="' + cx + '" cy="' + cy + '" r="72"/><path class="wf" d="M' + (cx - 5) + ' ' + (cy + 72) + 'l5 -5l5 5"/><path class="dg" d="' + good + '"/><path class="dd" d="' + dead + '"/>';
    /* the package: the compute dies in the middle, the memory at both sides, all in millimetres */
    const g = 1.5, cols = c.dies === 4 ? 2 : 1, rows = c.dies === 1 ? 1 : 2, bw = cols * side + (cols - 1) * g, bh = rows * side + (rows - 1) * g;
    const m = me.cow ? 10.5 : 9, nl = Math.ceil(c.memN / 2), nr = c.memN - nl, mr = Math.max(2, Math.floor((bh + g) / (m + g)));
    const wOf = cnt => cnt ? Math.ceil(cnt / mr) * (m + g) + 1 : 0, colH = cnt => cnt * (m + g) - g;
    const Wm = wOf(nl) + bw + wOf(nr), Hm = Math.max(bh, c.memN ? colH(Math.min(mr, nl)) : 0), pad = 3;
    const sc = Math.min(174 / (Wm + 2 * pad), 144 / (Hm + 2 * pad), 6), ox = 160 + (174 - (Wm + 2 * pad) * sc) / 2 + pad * sc, oy = 6 + (144 - (Hm + 2 * pad) * sc) / 2 + pad * sc;
    const X = v => (ox + v * sc).toFixed(1), Y = v => (oy + v * sc).toFixed(1), Z = v => (v * sc).toFixed(1);
    s += '<rect class="pk' + (B.PKG[c.pkg].maxS ? ' si' : '') + '" x="' + X(-pad) + '" y="' + Y(-pad) + '" width="' + Z(Wm + 2 * pad) + '" height="' + Z(Hm + 2 * pad) + '" rx="5"/>';
    const tile = (i, cnt, left) => { const col = Math.floor(i / mr), row = i % mr, inCol = Math.min(mr, cnt - col * mr), x = left ? (Math.ceil(cnt / mr) - 1 - col) * (m + g) : wOf(nl) + bw + 1 + col * (m + g), y = (Hm - colH(inCol)) / 2 + row * (m + g);
      return '<rect class="mm' + (me.cow ? ' hb' : '') + '" x="' + X(x) + '" y="' + Y(y) + '" width="' + Z(m) + '" height="' + Z(m) + '" rx="1.5"/>' + (me.cow && m * sc > 7 ? '<path class="ml" d="M' + X(x + 1.6) + ' ' + Y(y + m / 3) + 'h' + Z(m - 3.2) + 'M' + X(x + 1.6) + ' ' + Y(y + 2 * m / 3) + 'h' + Z(m - 3.2) + '"/>' : ''); };
    for (let i = 0; i < nl; i++) s += tile(i, nl, true);
    for (let i = 0; i < nr; i++) s += tile(i, nr, false);
    /* inside a die: the math (a grid of cores, finer for a matrix engine), the memory on the chip, and the rest (the
       wires to the memory and to the other dies) */
    const fc = c.area * (c.fp4 ? 1.04 : 1) * 1.12 / d.dieA, fs = c.sram * n.sram * 1.12 / d.dieA, px = side * sc;
    const N = Math.max(1, Math.min(14, Math.round(Math.sqrt(c.area) / { cpu: 6, gpu: 3.2, sys: 2.2 }[c.arch]))), M = Math.max(1, Math.round(N * fc));
    for (let i = 0; i < c.dies; i++) { const x = wOf(nl) + (i % cols) * (side + g), y = (Hm - bh) / 2 + Math.floor(i / cols) * (side + g);
      s += '<rect class="di" x="' + X(x) + '" y="' + Y(y) + '" width="' + Z(side) + '" height="' + Z(side) + '" rx="1.5"/><rect class="dc a-' + c.arch + '" x="' + X(x) + '" y="' + Y(y) + '" width="' + Z(side) + '" height="' + Z(side * fc) + '" rx="1.5"/>';
      if (px / N >= 3.2) { let l = ''; for (let a = 1; a < N; a++) l += 'M' + X(x + side * a / N) + ' ' + Y(y) + 'v' + Z(side * fc); for (let b = 1; b < M; b++) l += 'M' + X(x) + ' ' + Y(y + side * fc * b / M) + 'h' + Z(side); s += '<path class="dl" d="' + l + '"/>'; }
      if (fs * px >= 0.6) s += '<rect class="ds" x="' + X(x) + '" y="' + Y(y + side * fc) + '" width="' + Z(side) + '" height="' + Z(side * fs) + '"/>'; }
    /* ten millimetres, for scale */
    s += '<path class="sb" d="M' + (334 - 10 * sc).toFixed(1) + ' 166v6h' + (10 * sc).toFixed(1) + 'v-6"/><text class="ax" x="' + (330 - 10 * sc).toFixed(1) + '" y="174" text-anchor="end">' + esc(t('aib.mm', { v: 10 })) + '</text>' +
      '<text class="ax" x="8" y="174">' + esc(t('aib.mm', { v: 300 })) + '</text></svg>';
    const key = [['dg', 'aib.key.good'], ['dd', 'aib.key.dead'], ['dc', 'aib.key.math'], ['ds', 'aib.key.sram'], ['mm' + (me.cow ? ' hb' : ''), 'aib.key.mem']].map(([cl, w]) => '<span class="small"><i class="sw ' + cl + '"></i>' + esc(t(w)) + '</span>').join('');
    return '<figure class="aibfig">' + s + '<div class="aibcap"><span class="small">' + esc(t('aib.fig.wafer', { good: W.good, total: W.total })) + '</span><span class="small">' + esc(t('aib.fig.chip', { n: c.dies, mem: c.memN })) + '</span></div><div class="aibkey">' + key + '</div></figure>';
  }
  const reads = (c, d, W) => '<div class="aibread">' + [['die', t('aib.mm2', { v: n0(d.dieA) }), d.dieA > B.LIMITS.reticle ? 'bad' : ''], ['yield', t('aib.pct', { v: Math.round(d.Y * 100) }), d.Y < 0.45 ? 'bad' : ''],
    ['each', Number.isFinite(d.dieCost) ? t('aib.v.usd', { v: n0(d.dieCost) }) : t('aib.none'), ''], ['volt', t('aib.v.volt', { v: d.V.toFixed(2) }), d.vok ? '' : 'bad']].map(([k, v, cl]) => '<span><span class="small muted">' + esc(t('aib.r.' + k)) + '</span><b class="mono ' + cl + '">' + esc(v) + '</b></span>').join('') + '</div>';

  /* ---- one step of the model: reading the weights against doing the math; the slower one sets the speed ---- */
  function balance(c, d) {
    if (!B.MISSIONS[c.mission].P || !(d.memT > 0) || !(d.compT > 0)) return '';
    const top = Math.max(d.memT, d.compT), row = (k, v) => '<div class="aibrow' + (v === top ? ' slow' : '') + '"><span class="small">' + esc(t('aib.bal.' + k)) + '</span><span class="aibbar"><span style="width:' + Math.max(2, v / top * 100).toFixed(0) + '%"></span></span><b class="mono small">' + esc(ms(v)) + '</b></div>';
    return '<div class="aibbal"><p class="kicker">' + esc(t('aib.bal.t')) + '</p>' + row('mem', d.memT) + row('math', d.compT) + (d.fit ? '' : '<p class="small bad">' + esc(t('aib.bal.nofit')) + '</p>') + '</div>';
  }

  /* ---- the schedule: where the months go, the first wafer, the day it ships, and the date the brief sets ---- */
  function schedule(c, d) {
    const T = B.timeline(c, d), dead = B.MISSIONS[c.mission].dead, span = Math.max(d.months, dead) * 1.04, first = T.slice(0, 3).reduce((a, x) => a + x.months, 0), late = d.months > dead;
    return '<div class="aibtl"><p class="kicker">' + esc(t('aib.tl.t')) + '</p><div class="aibtrack" role="img" aria-label="' + esc(t('aib.tl.aria', { first: n1(first), ship: n1(d.months), dead })) + '">' +
      T.map(x => '<span class="tls p-' + x.id + '" style="width:' + (x.months / span * 100).toFixed(2) + '%"></span>').join('') + '<i class="aibdead" style="left:' + (dead / span * 100).toFixed(2) + '%"></i><i class="aibsweep"></i></div>' +
      '<p class="small aibwhen"><span>' + esc(t('aib.tl.first', { v: n1(first) })) + '</span><span class="' + (late ? 'bad' : 'good') + '">' + esc(t(late ? 'aib.tl.late' : 'aib.tl.ship', { v: n1(d.months), dead })) + '</span></p>' +
      '<ul class="aibph">' + T.map(x => '<li class="small"><i class="sw p-' + x.id + '"></i>' + esc(t('aib.phase.' + x.id)) + ' <b class="mono">' + esc(n1(x.months)) + '</b></li>').join('') + '</ul></div>';
  }

  /* ---- the reviewer: why it cannot be built, and what the plan says about itself; each names its choice ---- */
  function review(c, d) {
    const item = (cl, id, words) => '<li class="' + cl + '"><button type="button" class="aibat" data-aib-at="' + AT[id] + '">' + esc(t('aib.g.' + AT[id])) + '</button><span class="small">' + esc(words) + '</span></li>';
    const probs = d.problems.map(p => item('no', p.id, t('aib.problem.' + p.id, { ...p, n: p.max }))), ns = B.notes(c, d).map(x => AT[x.id] ? item('', x.id, t('aib.note.' + x.id, x)) : '<li><span class="small">' + esc(t('aib.note.' + x.id, x)) + '</span></li>');
    return '<div class="aibrev"><p class="kicker">' + esc(t('aib.rev.t')) + '</p><ul>' + probs.join('') + ns.join('') + '</ul></div>';
  }
  function verdict(A) {
    const r = view.aibRev;
    if (view.aibRun) return '<p class="small aibverdict muted">' + esc(t('aib.running')) + '</p>';
    if (!r || r.brief !== A.brief) return '';
    return '<p class="aibverdict ' + (r.ok ? 'good' : 'bad') + '"><b>' + esc(t(r.ok ? 'aib.verdict.ready' : 'aib.verdict.back')) + '</b> <span class="small">' + esc(r.ok ? t('aib.done.' + r.brief) : t(r.built ? 'aib.verdict.unmet' : 'aib.verdict.unbuildable')) + '</span></p>';
  }

  /* ---- the choices ---- */
  function choices(A, c, d) {
    const marked = new Set(d.problems.map(p => AT[p.id]).concat(B.notes(c, d).map(x => AT[x.id])).filter(Boolean));
    const grp = (id, body) => '<div class="aibg' + (view.aibAt === id ? ' on' : '') + '" data-aib-g="' + id + '"><p class="kicker">' + esc(t('aib.g.' + id)) + (marked.has(id) ? '<i class="aibdot" title="' + esc(t('aib.rev.mark')) + '"></i>' : '') + '</p>' + body +
      (ELSE[id] ? '<a class="aibelse small" href="#/do/' + ELSE[id] + '">' + esc(t('aib.else', { what: t('game.ch.' + ELSE[id] + '.t') })) + '</a>' : '') + '</div>';
    const seg = (k, ids, label) => '<div class="chips aibseg">' + ids.map(v => '<button type="button" class="chipb" data-aib-set="' + k + ':' + v + '" aria-pressed="' + (String(c[k]) === String(v)) + '">' + esc(label(v)) + '</button>').join('') + '</div>';
    const table = k => seg(k, Object.keys({ arch: B.ARCH, node: B.NODE, mem: B.MEM, pkg: B.PKG }[k]), v => t('aib.' + k + '.' + v)) + '<p class="small muted aibd">' + esc(t('aib.' + k + '.' + c[k] + '.d')) + '</p>';
    const onoff = k => seg(k, [false, true], v => t(v ? 'aib.on' : 'aib.off')) + '<p class="small muted aibd">' + esc(t('aib.' + k + '.d')) + '</p>';
    const dial = (k, value, min, max, step, v) => '<label class="lab" for="aib-' + k + '"><b>' + esc(t('aib.dial.' + k)) + '</b> <output>' + esc(value) + '</output></label><input type="range" id="aib-' + k + '" data-aib="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '">';
    return '<p class="kicker aibsec">' + esc(t('aib.sec.chip')) + '</p>' + grp('arch', table('arch')) + grp('node', table('node')) +
      grp('area', dial('area', t('aib.mm2', { v: c.area }), 0, 1000, 1, B.sliderOfArea(c.area)) + '<p class="small aibsub">' + esc(t('aib.dial.dies')) + '</p>' + seg('dies', B.DIES, v => String(v)) + '<p class="small muted aibd">' + esc(t('aib.dies.d')) + '</p>') +
      grp('sram', dial('sram', t('aib.mb', { v: c.sram }), 0, 1000, 1, B.sliderOfSram(c.sram)) + '<p class="small muted aibd">' + esc(t('aib.sram.d')) + '</p>') +
      grp('f', dial('f', t('aib.ghz', { f: c.f.toFixed(1), v: d.V.toFixed(2) }), B.LIMITS.f[0], B.LIMITS.f[1], 0.1, c.f) + '<p class="small muted aibd">' + esc(t('aib.f.d')) + '</p>') + grp('fp4', onoff('fp4')) +
      '<p class="kicker aibsec">' + esc(t('aib.sec.around')) + '</p>' + grp('mem', table('mem') + dial('memN', String(c.memN), 0, B.MEM[c.mem].max, 1, c.memN)) + grp('pkg', table('pkg')) +
      '<p class="kicker aibsec">' + esc(t('aib.sec.team')) + '</p>' + grp('agents', onoff('agents'));
  }

  function bench() {
    const A = state(), c = A.c[A.brief], d = B.design(c), W = B.firstWafer(d, A.tapes + 1), won = d.all;
    let h = '<div class="aib' + (view.aibRun ? ' run' : '') + '"><div class="aibtop">' + head() + '<div class="chips aibbriefs" role="group" aria-label="' + esc(t('aib.briefs')) + '">' + BRIEFS.map(id => '<button type="button" class="chipb" data-aib-brief="' + id + '" aria-pressed="' + (A.brief === id) + '">' + (A.met[id] ? '✓ ' : '') + esc(t('aib.mission.' + id)) + '</button>').join('') + '</div>' +
      '<p class="small aibstory">' + esc(t('aib.mission.' + A.brief + '.story')) + '</p></div>';
    /* a phone keeps the brief in sight as a thin strip while the choices scroll under it */
    h += '<div class="aibstrip" aria-hidden="true">' + d.rows.map(r => '<span class="' + (r.ok ? 'ok' : '') + '"><span>' + esc(t('aib.s.' + r.key)) + '</span><span class="gbar"><span style="width:' + Math.min(100, r.value / (r.op === 'fit' ? r.need : r.limit) * 80).toFixed(0) + '%"></span><i class="aibtick"></i></span></span>').join('') + '</div>';
    h += '<div class="aibL">' + goalbox(A, d) + figure(c, d, W) + reads(c, d, W) + balance(c, d) + schedule(c, d) +
      '<div class="aibgo"><button type="button" class="btn primary" data-aib-tape' + (view.aibRun ? ' disabled' : '') + '>' + esc(t('aib.tape')) + '</button><span class="small muted">' + esc(t(A.tapes ? 'aib.tapes' : 'aib.tape.d', { n: A.tapes })) + '</span></div>' + verdict(A) + review(c, d);
    if (!won && !A.met[A.brief]) h += view.hint ? '<p class="small hint">' + esc(t('aib.hint.' + A.brief)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<p class="small muted aibnote">' + esc(t('aib.note')) + '</p>' + doneNote() + reward() + '</div>';
    return h + '<div class="aibR">' + choices(A, c, d) + '<button type="button" class="link aibreset" data-aib-reset>' + esc(t('aib.reset')) + '</button></div></div>';
  }

  /* taping out: the months go by on the schedule, the first wafer comes back, and the engine's check decides */
  function tape() {
    if (view.aibRun) return true;
    const A = state(), id = A.brief, c = { ...A.c[id] }, ok = B.CHALLENGES[id].check(c), built = B.design(c).buildable;
    A.tapes += 1; view.aibRun = true; view.aibRev = null; ctx.save(); draw();
    setTimeout(() => { view.aibRun = false; if (!el.isConnected) return; view.aibRev = { brief: id, ok, built };
      if (ok) { state().met[id] = true; ctx.save(); win(); }
      draw(); fx(); show('.aibverdict'); }, still() ? 0 : 1700);
    return true;
  }
  const changed = () => { view.aibRev = null; ctx.save(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), A = state(), c = A.c[A.brief];
      const b = q('[data-aib-brief]'); if (b) { if (view.aibRun) return true; A.brief = b.dataset.aibBrief; view.aibAt = null; view.hint = false; ctx.save(); draw(); fx(); return true; }
      const s = q('[data-aib-set]'); if (s) { if (view.aibRun) return true; const [k, v] = s.dataset.aibSet.split(':'), to = k === 'dies' ? +v : k === 'fp4' || k === 'agents' ? v === 'true' : v;
        if (c[k] === to) return true; c[k] = to; A.c[A.brief] = B.tidy(c); return changed(); }
      const a = q('[data-aib-at]'); if (a) { view.aibAt = a.dataset.aibAt; draw(); show('[data-aib-g="' + view.aibAt + '"]'); return true; }
      if (q('[data-aib-tape]')) return tape();
      if (q('[data-aib-reset]')) { if (view.aibRun) return true; A.c[A.brief] = normal(null, A.brief); view.aibAt = null; return changed(); }
      return false; },
    input(e) { const r = e.target.closest('[data-aib]'); if (!r) return false; if (view.aibRun) return true;
      const A = state(), c = A.c[A.brief], k = r.dataset.aib, v = +r.value, to = k === 'area' ? B.areaOfSlider(v) : k === 'sram' ? B.sramOfSlider(v) : k === 'f' ? +v.toFixed(1) : Math.round(v);
      if (c[k] === to) return true; c[k] = to; return changed(); }
  };
}
