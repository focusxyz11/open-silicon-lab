/* Moving bits (src/engines/bits.js): if information weighs nothing, why does moving it cost so much? One lab of the
   challenge player (src/v2/play.js), the challenge 'chef', at home where the atlas puts it (QUESTIONS.bits in
   src/data/atlas.js). Two faces, one tab each:
   'trip'  one bit's trip, from a memory on the chip, stacked on it, beside it, across the board or in another machine
           reached by light, to the arithmetic: six meters fill as it travels (energy, time, capacity, space, errors,
           money), and move the memory to change them; the three walls are drawn on the picture.
   'chef'  Keep the chef busy: the processor is a chef who gets faster every round, the memory is the pantry; six levers,
           each with its catch, keep the chef cooking at seven levels, from one wire to a team passing messages. Each
           level shows its question on the picture. Serving runs the five rounds; an attempt can be kept in the ledger,
           and each level has its curve of the best time waiting so far. Won when every level of chips is cleared.
   In the new frame (?frame=2) the picture is the instrument and the meters the goal (docs/LABS.md, Do mode). On a phone
   the kitchen keeps one picture and the levers the level needs most; the rest wait behind More levers.
   lab(L) gets the player's pieces and returns { draw, click, input }. What the player tried is kept in the view and in
   S.chef (the game's state). */
import * as MB from '../../engines/bits.js';
import { QUESTIONS } from '../../data/atlas.js';
import { chefCurve } from '../../engines/ledger.js';
import { world } from '../game.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, draftOf } from '../commons.js';
import { fmtNum } from '../../core/i18n.js';

/* the levers a phone shows first at each level: the ones its question turns on */
const PHONE = { wire: ['closer', 'wider', 'shelf'], chip: ['wider', 'shelf', 'stack'], stacked: ['shelf', 'stack', 'cim'], light: ['shelf', 'stack', 'light'],
  dc: ['closer', 'shelf', 'stack', 'cim'], brain: ['shelf', 'light', 'cim'], team: ['closer', 'wider', 'cim'] };
/* levels beyond chips name their levers in their own words */
const OWN_WORDS = ['brain', 'team'];
const SERVE_MS = 3200, SEND_MS = 1800, GHZ = 3;
const n2 = v => fmtNum(+(+v).toPrecision(2));
const LADDER = QUESTIONS.bits.ladder;

/* facts.json, for the sources of the walls (fetched once, drawn again when it arrives) */
let FACT = null, factsAsked = false;
const facts = redraw => { if (FACT || factsAsked) return; factsAsked = true; fetch('src/data/facts.json').then(r => r.json()).then(j => { FACT = Object.fromEntries((j.facts || []).map(f => [f.id, f])); redraw(); }, () => { FACT = {}; }); };

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  S.chef = MB.normalState(S.chef);
  const C = S.chef, save = () => L.ctx.save && L.ctx.save();
  facts(() => { if (el.isConnected) { draw(); fx(); } });

  /* ---- words for numbers ---- */
  const unit = (x, list) => { const a = Math.abs(x), [u, k] = list.find(([, k]) => a >= k * 0.9995) || list[list.length - 1]; return [u, n2(x / k)]; };
  const E = j => { const [u, v] = unit(j, [['kJ', 1e3], ['J', 1], ['mJ', 1e-3], ['uJ', 1e-6], ['nJ', 1e-9], ['pJ', 1e-12], ['fJ', 1e-15], ['zJ', 1e-21]]); return t('mb.u.e.' + u, { v }); };
  const T = s => { const [u, v] = unit(s, [['h', 3600], ['min', 60], ['s', 1], ['ms', 1e-3], ['us', 1e-6], ['ns', 1e-9], ['ps', 1e-12]]); return t('mb.u.t.' + u, { v }); };
  const R = b => { const [u, v] = unit(b, [['T', 1e12], ['G', 1e9], ['M', 1e6], ['k', 1e3], ['b', 1]]); return t('mb.u.r.' + u, { v }); };
  const pct = x => t('mb.pct', { v: fmtNum(x >= 0.1 || x === 0 ? Math.round(x * 100) : +(x * 100).toFixed(1)) });
  const errW = p => p < 1e-15 ? t('mb.u.errNone') : t('mb.u.err', { v: fmtNum(Math.round(1 / p), { notation: 'compact' }) });
  const src = id => { const f = FACT && FACT[id]; return f && f.url ? ' <a class="mbsrc" href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('mb.source')) + '</a>' : ''; };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gauges = (ok, gs, cls) => '<div class="goalbox mbgoal' + (cls ? ' ' + cls : '') + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : cls ? 'mb.trip.meters' : 'game.goalNow')) + '</p>' +
    gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + (g.bad ? ' bad' : '') + (g.c ? ' ' + g.c : '') + '"><span class="gl">' + esc(g.l) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (Math.max(0, Math.min(1, g.f)) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';

  /* ================= one bit's trip ================= */
  const X0 = 66, X1 = 306, LMIN = Math.log10(0.03), LMAX = Math.log10(3000);
  const xOf = mm => X0 + (X1 - X0) * (Math.log10(mm) - LMIN) / (LMAX - LMIN);
  /* each meter's place between the cheapest and the dearest trip, on a log scale (capacity: more is better) */
  const RANGE = Object.fromEntries(MB.METERS.map(k => { const v = MB.TRIP_IDS.map(id => Math.max(1e-30, MB.trip(id, GHZ).meters[k])); return [k, [Math.min(...v), Math.max(...v)]]; }));
  const share = (k, v) => { const [a, b] = RANGE[k]; return b <= a ? 1 : 0.12 + 0.88 * (Math.log10(Math.max(v, 1e-30)) - Math.log10(a)) / (Math.log10(b) - Math.log10(a)); };
  const meterWords = (k, v) => k === 'energy' ? E(v) : k === 'time' ? T(v) : k === 'capacity' ? R(v) : k === 'space' ? t('mb.trip.wiresShort', { n: fmtNum(v) }) : k === 'errors' ? errW(v) : t('mb.trip.price', { v: n2(v) });
  function tripFigure(at, Tr, p) {
    const W = 320, H = 200, YD = 86, here = MB.TRIP[at];
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('mb.trip.aria', { at: t('mb.at.' + at + '.t'), e: E(Tr.meters.energy), s: T(Tr.meters.time) })) + '">';
    /* the distance axis: a tenth of a millimetre to a metre and more */
    s += '<line class="ax0" x1="' + X0 + '" x2="' + X1 + '" y1="170" y2="170"/>';
    [[0.1, 'mm01'], [1, 'mm1'], [10, 'cm1'], [100, 'cm10'], [1000, 'm1']].forEach(([mm, k]) => { const x = xOf(mm).toFixed(1); s += '<line class="tk" x1="' + x + '" x2="' + x + '" y1="167" y2="173"/><text class="ax" x="' + x + '" y="184" text-anchor="middle">' + esc(t('mb.trip.d.' + k)) + '</text>'; });
    s += '<text class="ax" x="' + X1 + '" y="197" text-anchor="end">' + esc(t('mb.trip.far')) + '</text>';
    /* the wall of light: as far as light gets in one tick of a 3 GHz clock */
    const xl = xOf(MB.lightPerTick(GHZ) * 1000).toFixed(1);
    s += '<line class="wall" x1="' + xl + '" x2="' + xl + '" y1="18" y2="170"/><text class="ax wallt" x="' + (+xl - 4) + '" y="16" text-anchor="end">' + esc(t('mb.trip.tick')) + '</text>';
    /* the processor: the arithmetic, at the start of the axis */
    s += '<rect class="die" x="14" y="' + (YD - 20) + '" width="40" height="40" rx="4"/><rect class="alu" x="22" y="' + (YD - 12) + '" width="24" height="24" rx="2"/><text class="ax in" x="34" y="' + (YD + 3) + '" text-anchor="middle">' + esc(t('mb.trip.alu')) + '</text>';
    s += '<text class="ax" x="34" y="' + (YD + 34) + '" text-anchor="middle">' + esc(t('mb.trip.proc')) + '</text>';
    /* the places a memory can be: the one chosen solid, the others faint */
    const spot = id => id === 'stacked' ? [34, YD - 30] : id === 'near' ? [xOf(1), YD] : [xOf(MB.TRIP[id].path.reduce((a, [, d]) => a + d, 0)), YD];
    for (const id of MB.TRIP_IDS) {
      const [x, y] = spot(id), on = id === at;
      s += '<g class="mem' + (on ? ' on' : '') + '" data-mb-at="' + id + '"><rect x="' + (x - 9).toFixed(1) + '" y="' + (y - 7) + '" width="18" height="14" rx="2"/>' + [0, 1, 2].map(i => '<line x1="' + (x - 6).toFixed(1) + '" x2="' + (x + 6).toFixed(1) + '" y1="' + (y - 3 + i * 3) + '" y2="' + (y - 3 + i * 3) + '"/>').join('') + '</g>';
      if (id !== 'stacked') s += '<text class="ax' + (on ? ' onT' : '') + '" x="' + x.toFixed(1) + '" y="' + (y + (MB.TRIP_IDS.indexOf(id) % 2 ? 22 : -12)) + '" text-anchor="middle">' + esc(t('mb.at.' + id + '.s')) + '</text>';
    }
    s += '<text class="ax' + (at === 'stacked' ? ' onT' : '') + '" x="60" y="' + (YD - 38) + '">' + esc(t('mb.at.stacked.s')) + '</text>';
    /* the path the bit takes, drawn by what it crosses, and the bit on it */
    const [mx, my] = spot(at), pts = at === 'stacked' ? [[mx, my + 7], [34, YD - 12]] : at === 'near' ? [[mx - 9, my], [46, YD]] : [[mx - 9, my], [54, YD]];
    const medium = here.path.slice(-1)[0][0], cls = at === 'stacked' ? 'bond' : medium;
    s += '<line class="path ' + cls + '" x1="' + pts[0][0].toFixed(1) + '" y1="' + pts[0][1] + '" x2="' + pts[1][0].toFixed(1) + '" y2="' + pts[1][1] + '"/>';
    const bx = pts[0][0] + (pts[1][0] - pts[0][0]) * p, by = pts[0][1] + (pts[1][1] - pts[0][1]) * p;
    s += '<circle class="bit" cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="4"/>';
    /* the Look under it: two numbers fetched against the two added */
    s += '<text class="ax look" x="14" y="140">' + esc(t('mb.trip.look', { f: E(Tr.fetchTwoJ), a: E(Tr.addJ), k: fmtNum(Math.round(Tr.fetchTwoJ / Tr.addJ)) })) + '</text>';
    return '<figure class="mbfig mbtrip" data-f2="instrument" data-mb-trip="' + at + '" data-mb-e="' + Tr.meters.energy.toExponential(3) + '">' + s + '</svg><figcaption class="small muted">' + esc(t('mb.at.' + at + '.d')) + '</figcaption></figure>';
  }
  function tripBench() {
    const at = C.trip, Tr = MB.trip(at, GHZ), p = view.tp == null ? 1 : view.tp, W = Tr.walls;
    let h = head() + tabs() + '<p class="small mbintro"><span class="kicker">' + esc(t('mb.rung.' + LADDER.trip)) + '</span> ' + esc(t('mb.trip.intro')) + '</p>';
    h += gauges(false, MB.METERS.map(k => ({ l: t('mb.m.' + k), v: meterWords(k, Tr.meters[k] * (k === 'space' || k === 'money' || k === 'errors' ? 1 : p)), f: share(k, Tr.meters[k]) * p, c: 'mbm ' + k })), 'mbsix');
    h += tripFigure(at, Tr, p);
    h += '<div class="chips mbats" role="group" aria-label="' + esc(t('mb.trip.where')) + '">' + MB.TRIP_IDS.map(id => '<button type="button" class="chipb" data-mb-at="' + id + '" aria-pressed="' + (id === at) + '">' + esc(t('mb.at.' + id + '.t')) + '</button>').join('') + '</div>';
    h += '<div class="chips"><button type="button" class="btn primary" data-mb-send' + (view.sending ? ' disabled' : '') + '>' + esc(t('mb.trip.send')) + '</button></div>';
    h += '<ul class="mbwalls">' +
      '<li><b>' + esc(t('mb.wall.light')) + '</b> ' + esc(t('mb.wall.lightD', { n: +W.lightTicks.toPrecision(2), m: n2(W.ticks) })) + src('light-per-tick') + '</li>' +
      '<li><b>' + esc(t('mb.wall.shannon')) + '</b> ' + esc(t('mb.wall.shannonD', { r: R(W.perWire), c: R(W.shannon) })) + src('shannon-1948') + '</li>' +
      '<li><b>' + esc(t('mb.wall.floor')) + '</b> ' + esc(t('mb.wall.floorD', { x: fmtNum(W.floor, { notation: 'compact', maximumSignificantDigits: 2 }) })) + src('landauer-1991') + '</li></ul>';
    h += '<p class="small mbsay">' + esc(t('mb.trip.wires', { n: fmtNum(Tr.meters.space) })) + ' · ' + esc(t('mb.trip.wireShare', { v: pct(Tr.wireShare) })) + '</p>';
    return h + '<p class="small muted">' + esc(t('mb.trip.note')) + '</p>' + doneNote() + reward();
  }
  let sendT = null;
  const sendLoop = now => {
    if (!view.sending || !el.isConnected) { view.sending = false; return; }
    const dt = Math.min(1000, now - (sendT || now)); sendT = now;
    view.tp = Math.min(1, (view.tp || 0) + dt / SEND_MS);
    if (view.tp >= 1) view.sending = false;
    draw(); if (view.sending) requestAnimationFrame(sendLoop);
  };
  function send() { if (still()) { view.tp = 1; return draw(); } view.tp = 0; view.sending = true; sendT = null; draw(); requestAnimationFrame(sendLoop); }

  /* ================= keep the chef busy ================= */
  const lv = () => MB.levelOf(C.at);
  const planOf = id => MB.fullPlan(C.plans[id] || {});
  const leverName = (id, level) => (OWN_WORDS.includes(level) ? t('mb.lever.' + id + '.' + level) : t('mb.lever.' + id + '.t'));
  /* the kitchen: the chef's die with its pantry on the chip and its shelf, the pantry away along its door (or stacked on
     top), the bits coming in, and below it five rounds of the chef busy and waiting */
  function kitchenFigure(Lv, K, r, frac) {
    const P = K.plan, W = 320, H = 216, R0 = K.rounds[r], busy = 1 - R0.wait, cores = 16, lit = Math.round(busy * cores);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('mb.k.aria', { level: t('mb.lv.' + Lv.id + '.t'), r: r + 1, wait: pct(R0.wait), e: E(R0.energy) })) + '">';
    /* the chef: a die of cores, lit as busy as this round lets them be; room given to a pantry or a shelf on the chip is
       taken from it */
    const dx = 18, dy = 34, ds = 86, roomW = ds * (P.closer + P.shelf * MB.SHELF_ROOM);
    s += '<rect class="die" x="' + dx + '" y="' + dy + '" width="' + ds + '" height="' + ds + '" rx="6"/>';
    const cw = (ds - roomW - 14) / 4;
    for (let i = 0; i < cores; i++) { const cx = dx + 7 + (i % 4) * cw, cy = dy + 7 + Math.floor(i / 4) * ((ds - 14) / 4);
      s += '<rect class="core' + (i < lit ? ' on' : '') + '" x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" width="' + Math.max(2, cw - 3).toFixed(1) + '" height="' + ((ds - 14) / 4 - 3).toFixed(1) + '" rx="1.5"/>'; }
    if (P.closer) s += '<rect class="onchip" x="' + (dx + ds - 7 - ds * P.closer).toFixed(1) + '" y="' + (dy + 7) + '" width="' + (ds * P.closer - 2).toFixed(1) + '" height="' + (ds - 14) + '" rx="2"/>';
    if (P.shelf) { const sw = Math.max(6, ds * P.shelf * MB.SHELF_ROOM); s += '<rect class="shelf" x="' + (dx + ds - 7 - ds * P.closer - sw - 2).toFixed(1) + '" y="' + (dy + ds - 22) + '" width="' + sw.toFixed(1) + '" height="14" rx="2"/>'; }
    s += '<text class="ax" x="' + (dx + ds / 2) + '" y="' + (dy + ds + 13) + '" text-anchor="middle">' + esc(t('mb.k.chef.' + (Lv.id === 'brain' || Lv.id === 'team' ? Lv.id : 'chip'))) + '</text>';
    /* the stack: the pantry on top of the chef, the heat rising off it */
    if (P.stack) {
      s += '<rect class="pantry stacked" x="' + (dx + 6) + '" y="' + (dy - 20) + '" width="' + (ds - 12) + '" height="16" rx="3"/>';
      for (let i = 0; i < 4; i++) { const hx = dx + 16 + i * 18; s += '<path class="heat" d="M' + hx + ' ' + (dy - 24) + 'q4 -5 0 -10q-4 -5 0 -10"/>'; }
    }
    /* the far pantry, and its door: as many lines as the door is wide (light: one bright fibre) */
    const px = 236, py = 52, pw = 66, ph = 50, mm = K.pantry.mm, part = P.stack ? 1 - Math.min(1, Lv.stack / Lv.job.set) : 1;
    const faint = part < 0.05 ? ' faint' : '';
    s += '<rect class="pantry' + faint + '" x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="5"/>';
    for (let i = 0; i < 4; i++) s += '<line class="jar' + faint + '" x1="' + (px + 8) + '" x2="' + (px + pw - 8) + '" y1="' + (py + 12 + i * 9) + '" y2="' + (py + 12 + i * 9) + '"/>';
    if (P.cim) for (let i = 0; i < (P.cim > 0.6 ? 3 : 2); i++) s += '<path class="cook" d="M' + (px + 16 + i * 17) + ' ' + (py + ph - 6) + 'q-5 -7 0 -14q5 7 0 14z"/>';
    s += '<text class="ax" x="' + (px + pw / 2) + '" y="' + (py + ph + 13) + '" text-anchor="middle">' + esc(t('mb.k.pantry.' + (Lv.id === 'brain' || Lv.id === 'team' ? Lv.id : 'chip'))) + '</text>';
    const x0 = dx + ds, x1 = px, yc = dy + ds / 2, n = Math.min(9, Math.max(1, Math.round(Math.log2(Lv.wires * P.wider) / 1.6)));
    if (P.light) s += '<line class="door light' + faint + '" x1="' + x0 + '" x2="' + x1 + '" y1="' + yc + '" y2="' + yc + '"/>';
    else for (let i = 0; i < n; i++) { const y = yc + (i - (n - 1) / 2) * 3.4; s += '<line class="door ' + esc(K.pantry.medium) + faint + '" x1="' + x0 + '" x2="' + x1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; }
    s += '<text class="ax" x="' + ((x0 + x1) / 2) + '" y="' + (yc - 14 - n * 1.7).toFixed(1) + '" text-anchor="middle">' + esc(t('mb.k.dist', { d: dist(mm) })) + '</text>';
    /* the bits on their way in: more of them the more the door carries this round */
    const nb = Math.max(1, Math.min(7, Math.round(R0.far / (Lv.job.bits / 6)))), off = frac == null ? 0.5 : frac;
    for (let i = 0; i < nb; i++) { const q = ((i + off * 2) / nb) % 1, bx = x1 - (x1 - x0) * q; s += '<circle class="bit' + faint + '" cx="' + bx.toFixed(1) + '" cy="' + yc + '" r="2.6"/>'; }
    /* five rounds: the chef busy (below) and waiting (above), against the goal */
    const by = 150, bh = 52, bw = 34, bx0 = 70;
    s += '<text class="ax" x="' + (bx0 - 8) + '" y="' + (by + 4) + '" text-anchor="end">' + esc(t('mb.k.waits')) + '</text><text class="ax" x="' + (bx0 - 8) + '" y="' + (by + bh) + '" text-anchor="end">' + esc(t('mb.k.cooks')) + '</text>';
    K.rounds.forEach((q, i) => { const x = bx0 + i * (bw + 12), wh = bh * q.wait, shown = i <= r;
      s += '<rect class="rb busy' + (shown ? '' : ' off') + '" x="' + x + '" y="' + (by + wh).toFixed(1) + '" width="' + bw + '" height="' + (bh - wh).toFixed(1) + '" rx="2"/>' +
        '<rect class="rb wait' + (shown ? '' : ' off') + (i === r ? ' now' : '') + '" x="' + x + '" y="' + by + '" width="' + bw + '" height="' + wh.toFixed(1) + '" rx="2"/>' +
        '<text class="ax" x="' + (x + bw / 2) + '" y="' + (by + bh + 12) + '" text-anchor="middle">' + esc(t('mb.k.round', { n: i + 1 })) + '</text>'; });
    const gy = by + bh * Lv.goal.wait;
    s += '<line class="goal" x1="' + (bx0 - 4) + '" x2="' + (bx0 + 5 * (bw + 12) - 8) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '"/><text class="ax goalt" x="' + (bx0 + 5 * (bw + 12) - 6) + '" y="' + (gy + 3).toFixed(1) + '">' + esc(t('mb.k.goal')) + '</text>';
    return '<figure class="mbfig mbkitchen" data-f2="instrument"><p class="mbq"><span class="kicker">' + esc(t('mb.rung.' + LADDER[Lv.id])) + ' · ' + esc(t('mb.lv.' + Lv.id + '.t')) + '</span>' + esc(t('mb.lv.' + Lv.id + '.q')) + '</p>' + s + '</svg>' +
      '<figcaption class="small muted">' + esc(t('mb.lv.' + Lv.id + '.who')) + '</figcaption></figure>';
  }
  const dist = mm => mm >= 1e6 ? t('mb.u.d.km', { v: n2(mm / 1e6) }) : mm >= 1000 ? t('mb.u.d.m', { v: n2(mm / 1000) }) : mm >= 10 ? t('mb.u.d.cm', { v: n2(mm / 10) }) : t('mb.u.d.mm', { v: n2(mm) });
  function lever(Lv, Lr, P) {
    const i = Lr.values.indexOf(P[Lr.id]), phone = (PHONE[Lv.id] || []).includes(Lr.id);
    return '<div class="mblever' + (phone ? '' : ' mbx') + '"><p class="mblt"><b>' + esc(leverName(Lr.id, Lv.id)) + '</b> <span class="small muted">' + esc(OWN_WORDS.includes(Lv.id) ? t('mb.lever.' + Lr.id + '.' + Lv.id + 'C') : t('mb.lever.' + Lr.id + '.catch')) + '</span></p>' +
      '<div class="seg mbseg" role="group" aria-label="' + esc(leverName(Lr.id, Lv.id)) + '">' + Lr.values.map((v, k) => '<button type="button" data-mb-lever="' + Lr.id + ':' + k + '" aria-pressed="' + (k === i) + '">' + esc(t('mb.v.' + Lr.id + '.' + k)) + '</button>').join('') + '</div></div>';
  }
  /* the level's curve: every attempt kept there, its time waiting, and the best so far; yours is the open dot */
  function curve(Lv, K) {
    const P = chefCurve(world(S), Lv.id), N = Math.max(4, P.length + 1), W = 300, H = 120, L0 = 34, R0 = 8, T0 = 10, B0 = 22;
    const X = n => L0 + (W - L0 - R0) * (n - 1) / (N - 1), Y = w => T0 + (H - T0 - B0) * (1 - w);
    let g = '';
    [0, 0.5, 1].forEach(w => { g += '<line class="grid" x1="' + L0 + '" x2="' + (W - R0) + '" y1="' + Y(w) + '" y2="' + Y(w) + '"/><text class="ax" x="' + (L0 - 5) + '" y="' + (Y(w) + 3) + '" text-anchor="end">' + esc(pct(w)) + '</text>'; });
    const gy = Y(Lv.goal.wait); g += '<line class="goal" x1="' + L0 + '" x2="' + (W - R0) + '" y1="' + gy + '" y2="' + gy + '"/>';
    let path = ''; P.forEach((p, i) => { path += (i ? 'H' + X(p.n).toFixed(1) + 'V' : 'M' + X(p.n).toFixed(1) + ',') + Y(p.best).toFixed(1); });
    const dots = P.map(p => '<circle class="dot c-' + esc(p.made) + (p.draft ? ' mine' : '') + '" cx="' + X(p.n).toFixed(1) + '" cy="' + Y(p.wait).toFixed(1) + '" r="4"><title>' + esc(p.by + ' · ' + pct(p.wait)) + '</title></circle>').join('');
    const you = '<circle class="dot you" cx="' + X(P.length + 1).toFixed(1) + '" cy="' + Y(K.wait).toFixed(1) + '" r="5"><title>' + esc(t('mb.curve.yours') + ' · ' + pct(K.wait)) + '</title></circle>';
    return '<section class="mbcurve"><p class="kicker">' + esc(t('mb.curve.k')) + '</p><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('mb.curve.aria', { n: P.length, level: t('mb.lv.' + Lv.id + '.t') })) + '">' + g + (path ? '<path class="best" d="' + path + 'H' + X(N).toFixed(1) + '"/>' : '') + dots + you +
      '<text class="ax" x="' + ((L0 + W - R0) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(t('mb.curve.x')) + '</text></svg>' +
      '<p class="small muted">' + esc(P.length ? t('mb.curve.d', { n: P.length, best: pct(P[P.length - 1].best) }) : t('mb.curve.none')) + '</p></section>';
  }
  function chefBench() {
    const Lv = lv(), P = planOf(Lv.id), K = MB.kitchen(Lv.id, P), r = view.kr == null ? MB.ROUNDS - 1 : view.kr, served = view.served && view.served[Lv.id];
    const cleared = !!C.cleared[Lv.id], Cc = K.catches, ok = K.cleared;
    let h = head() + tabs() + '<p class="small mbintro">' + esc(t('mb.k.intro')) + '</p>';
    h += gauges(ok && served, [
      { l: t('mb.g.wait'), ok: K.goal.wait, v: pct(K.wait), target: t('mb.g.atMost', { v: pct(Lv.goal.wait) }), f: K.wait <= 0 ? 1 : Math.min(1, Lv.goal.wait / K.wait) },
      { l: t('mb.g.energy'), ok: K.goal.energy, v: E(K.energy), target: t('mb.g.atMost', { v: E(Lv.goal.energy) }), f: Math.min(1, Lv.goal.energy / K.energy) },
      { l: t('mb.g.money'), ok: Cc.money.ok, bad: !Cc.money.ok, v: pct(Cc.money.value), target: t('mb.g.atMost', { v: pct(1) }), f: Cc.money.ok ? 1 : 1 / Cc.money.value, c: 'mbsm' },
      { l: t('mb.g.wires'), ok: Cc.space.ok, bad: !Cc.space.ok, v: fmtNum(Cc.space.value), target: t('mb.g.ofEdge', { n: fmtNum(Cc.space.limit) }), f: Cc.space.ok ? 1 : Cc.space.limit / Cc.space.value, c: 'mbsm' },
      { l: t('mb.g.errors'), ok: Cc.error.ok, bad: !Cc.error.ok, v: pct(Cc.error.value), target: Cc.error.limit ? t('mb.g.atMost', { v: pct(Cc.error.limit) }) : t('mb.g.exact'), f: Cc.error.ok ? 1 : 0.3, c: 'mbsm' }]);
    h += '<div class="mblevels" role="group" aria-label="' + esc(t('mb.levels')) + '">' + MB.LEVEL_IDS.map((id, i) => '<button type="button" class="chipb" data-mb-level="' + id + '" aria-pressed="' + (id === Lv.id) + '"' + (C.cleared[id] ? ' data-cleared="1"' : '') + '><span class="mbn">' + (i + 1) + '</span>' + esc(t('mb.lv.' + id + '.t')) + (C.cleared[id] ? ' ✓' : '') + '</button>').join('') + '</div>';
    h += kitchenFigure(Lv, K, r, view.kf);
    /* what happened: after serving, the last round's verdict; before, what the plan would do */
    const why = !Cc.money.ok ? 'money' : !Cc.space.ok ? 'space' : !Cc.error.ok ? 'error' : !K.goal.wait ? 'wait' : !K.goal.energy ? 'energy' : 'ok';
    const say = view.serving ? t('mb.say.serving', { n: r + 1 }) : served ? t('mb.say.' + why, { wait: pct(K.wait), e: E(K.energy) }) : t('mb.say.ready');
    h += '<p class="small mbsay ' + (served && !view.serving ? (ok ? 'good' : 'bad') : '') + '">' + esc(say) + '</p>';
    h += '<div class="chips mbacts"><button type="button" class="btn primary" data-mb-serve' + (view.serving ? ' disabled' : '') + '>' + esc(t(served ? 'mb.serveAgain' : 'mb.serve')) + '</button>' +
      '<button type="button" class="link" data-mb-start>' + esc(t('mb.start')) + '</button></div>';
    h += '<div class="mblevers' + (view.all ? ' all' : '') + '">' + MB.LEVERS.map(Lr => lever(Lv, Lr, P)).join('') + '</div>';
    h += '<button type="button" class="link mball" data-mb-all aria-expanded="' + !!view.all + '">' + esc(t(view.all ? 'mb.fewer' : 'mb.more')) + '</button>';
    const W2 = K.walls;
    h += '<ul class="mbwalls">' +
      '<li><b>' + esc(t('mb.wall.light')) + '</b> ' + esc(t('mb.wall.kLight', { n: +W2.light.ticks.toPrecision(2), m: n2(W2.light.fetchTicks) })) + src('light-per-tick') + '</li>' +
      '<li><b>' + esc(t('mb.wall.shannon')) + '</b> ' + esc(t('mb.wall.shannonD', { r: R(W2.shannon.perWire), c: R(W2.shannon.limit) })) + src('shannon-1948') + '</li>' +
      '<li><b>' + esc(t('mb.wall.floor')) + '</b> ' + esc(t('mb.wall.kFloor', { e: E(W2.floor.perBit), x: fmtNum(W2.floor.times, { notation: 'compact', maximumSignificantDigits: 2 }) })) + src('landauer-1991') + '</li></ul>';
    if (!ok) { const hi = MB.hint(Lv.id, P); if (hi) h += view.hint ? '<p class="small hint">' + esc(t('mb.hint', { lever: leverName(hi.lever, Lv.id), v: t('mb.v.' + hi.lever + '.' + MB.LEVERS.find(x => x.id === hi.lever).values.indexOf(hi.value)), n: hi.steps })) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>'; }
    h += '<p class="small mbprog">' + esc(t('mb.progress', { n: MB.TO_WIN.filter(id => C.cleared[id]).length, of: MB.TO_WIN.length })) + (cleared ? ' · ' + esc(t('mb.cleared')) : '') + '</p>';
    h += curve(Lv, K);
    /* keep this attempt in the ledger: after serving, signed, checked by the engine */
    if (served && !view.serving) h += view.slip && draftOf(S, view.slip) ? slipHtml(S, view.slip) : '<div class="keep mbkeep"><p class="small muted">' + esc(t('mb.keep.lead')) + '</p>' + signHtml(S) + (view.no ? '<p class="small bad">' + esc(view.no) + '</p>' : '') + '<button type="button" class="btn" data-mb-keep>' + esc(t('mb.keep')) + '</button></div>';
    return h + '<p class="small muted">' + esc(t('mb.k.note')) + '</p>' + doneNote() + reward();
  }
  let serveT = null;
  function finish() {
    const Lv = lv(), K = MB.kitchen(Lv.id, planOf(Lv.id));
    view.serving = false; view.kr = MB.ROUNDS - 1; view.kf = null; view.served = view.served || {}; view.served[Lv.id] = true; view.slip = null; view.no = null;
    if (K.cleared && !C.cleared[Lv.id]) { C.cleared[Lv.id] = 1; save(); }
    if (MB.won(C.cleared)) win();
  }
  const serveLoop = now => {
    if (!view.serving || !el.isConnected) { view.serving = false; return; }
    const dt = Math.min(1000, now - (serveT || now)); serveT = now;
    view.kt = (view.kt || 0) + dt / SERVE_MS;
    const pos = view.kt * MB.ROUNDS; view.kr = Math.min(MB.ROUNDS - 1, Math.floor(pos)); view.kf = pos % 1;
    if (view.kt >= 1) finish();
    draw(); fx(); if (view.serving) requestAnimationFrame(serveLoop);
  };
  function serve() {
    if (still()) { finish(); draw(); fx(); return show('.mbsay'); }
    view.serving = true; view.kt = 0; view.kr = 0; serveT = null; draw(); requestAnimationFrame(serveLoop);
  }
  /* a lever pulled or a level changed: the kitchen answers at once, and asks to be served again */
  const changed = () => { view.served = view.served || {}; delete view.served[C.at]; view.kr = null; view.kf = null; view.slip = null; view.no = null; save(); draw(); fx(); };

  const tabs = () => '<div class="seg mbtabs" role="tablist">' + ['chef', 'trip'].map(k => '<button type="button" role="tab" data-mb-tab="' + k + '" aria-selected="' + (C.tab === k) + '" aria-pressed="' + (C.tab === k) + '">' + esc(t('mb.tab.' + k)) + '</button>').join('') + '</div>';
  return {
    draw: () => (C.tab === 'trip' ? tripBench() : chefBench()),
    click(e) { const q = s => e.target.closest(s);
      const tb = q('[data-mb-tab]'); if (tb) { C.tab = tb.dataset.mbTab; save(); draw(); fx(); return true; }
      const at = q('[data-mb-at]'); if (at) { if (C.trip !== at.dataset.mbAt) { C.trip = at.dataset.mbAt; save(); send(); } return true; }
      if (q('[data-mb-send]')) { if (!view.sending) send(); return true; }
      if (view.serving && (q('[data-mb-level]') || q('[data-mb-lever]') || q('[data-mb-start]'))) return true;
      const lvB = q('[data-mb-level]'); if (lvB) { if (C.at !== lvB.dataset.mbLevel) { C.at = lvB.dataset.mbLevel; view.hint = false; changed(); } return true; }
      const lr = q('[data-mb-lever]'); if (lr) { const [id, k] = lr.dataset.mbLever.split(':'), Lr = MB.LEVERS.find(x => x.id === id); if (!Lr) return true;
        const P = MB.normalPlan(Object.assign({}, C.plans[C.at], { [id]: Lr.values[+k] })); if (JSON.stringify(P) !== JSON.stringify(C.plans[C.at] || {})) { C.plans[C.at] = P; changed(); } return true; }
      if (q('[data-mb-start]')) { C.plans[C.at] = {}; changed(); return true; }
      if (q('[data-mb-serve]')) { if (!view.serving) serve(); return true; }
      if (q('[data-mb-all]')) { view.all = !view.all; draw(); return true; }
      if (q('[data-mb-keep]')) {
        const k = keep(S, { kind: 'try', chef: C.at, plan: MB.normalPlan(C.plans[C.at] || {}), words: '' }, 'chef ' + C.at, signOf(el.querySelector('.mbkeep') || el));
        view.no = k.ok ? null : refusal(k.r); if (k.ok) { view.slip = k.e.id; save(); L.ctx.kept && L.ctx.kept(k.e); }
        draw(); show('.slip, .mbkeep'); return true;
      }
      if (slipClick(e, S, redraw => { save(); if (redraw) { view.slip = null; draw(); } })) return true;
      return false; },
    input() { return false; }
  };
}
