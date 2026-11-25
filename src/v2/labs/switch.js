/* Invent a transistor (kind 'transistor', at the switch level, #329), from src/engines/switch.js.
   Choose what the switch is made of, its shape and how it switches, and see whether it beats silicon. The picture is
   the switching curve: current against the gate's voltage on a scale of powers of ten, your switch against today's
   silicon fin, the spread of its copies, the lowest voltage that switches it cleanly, and through its turn-on the
   60 mV line, whose steeper side no switch that works over a barrier can reach at room temperature. Beside it: the
   device across its channel, what the switch reads (voltage, energy and speed against silicon, millivolts per
   tenfold, both carriers, the factory line), how true each part is, and an invented material's place in the band the
   known materials make. Four goals, each met by some switch tried (won in src/engines/switch.js): a switch that really
   turns off, less energy than silicon, steeper than the line, and a better one a factory could make. Your switch goes
   up the scales: kept, a machine's block can be made of it (src/v2/machines.js, src/engines/machine.js).
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as W from '../../engines/switch.js';
import { mark as fidMark } from '../fid.js';
/* your switch, kept for the machines (a convenience of this browser: src/v2/machines.js reads it) */
import { keptSwitch, keepSwitch as keep } from '../kept.js';

/* a power of ten, raised in the same font as its number (#373): Unicode's superscript digits are not in the site's
   fonts, so they came from a fallback font ('10-1 0'). In a figure a tspan raised by dy (the exponent ends its text, so
   nothing after it moves), in HTML a sup (src/styles/labs.css); words with a number in them are escaped around it */
const pow = n => String(n).replace('-', '−');
const supSvg = n => '<tspan class="exp" dy="-0.42em" font-size="72%">' + pow(n) + '</tspan>';
const supHtml = n => '<sup class="exp">' + pow(n) + '</sup>';
const MARK = '\u0001';
/* the curve's frame: gate volts -0.4 to 0.8 across (below 0 V the switch is held off harder, where a leak shows), current
   10^-14 to 10^-2 A per micrometre up */
const CW = 360, CH = 240, X0 = 46, X1 = 348, Y0 = 22, Y1 = 200, LO = -14, HI = -2, VLO = -0.4, VMAX = 0.8;
const cx = v => X0 + (X1 - X0) * (v - VLO) / (VMAX - VLO), cy = l => Y1 - (Y1 - Y0) * (Math.max(LO, Math.min(HI, l)) - LO) / (HI - LO);
const f1 = v => v.toFixed(1);
/* the band's frame: gap 0 to 3.4 eV across, mobility 1 to 10^5 up */
const BW = 300, BH = 168, B0 = 34, B1 = 292, BT = 10, BB = 138;
const bx = g => B0 + (B1 - B0) * g / W.OWN_RANGE.eg[1], by = lm => BB - (BB - BT) * Math.max(0, Math.min(5, lm)) / 5;
/* an invented material's dials, as the sliders hold them (mobility and traps as powers of ten) */
const DIALS = [['eg', 0, 3.4, 0.02], ['me', 1, 5, 0.05], ['mh', 0, 5, 0.05], ['dit', 10, 13, 0.1]];
const toDial = (k, v) => (k === 'eg' ? v : Math.log10(v)), fromDial = (k, v) => (k === 'eg' ? v : Math.pow(10, v));

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.sw || (view.sw = W.normal(W.START));
  const seen = () => view.swSeen || (view.swSeen = [W.switchOf(set())]);
  const got = () => { const g = {}; seen().forEach(r => W.GOALS.forEach(k => { if (r.goals[k]) g[k] = true; })); return g; };
  function see() { const r = W.switchOf(set()); seen().push(r); if (seen().length > 300) seen().splice(1, 1); if (W.won(seen())) win(); }
  const nf = (v, d = 0) => (+v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const mob = v => nf(+v.toPrecision(2));
  const matName = id => t('sw.mat.' + id);
  /* a material's name inside a sentence */
  const inName = r => (r.own ? t('sw.dev.own') : matName(r.spec.mat).toLowerCase());
  /* a number as m × 10 to a power, as HTML */
  const sci = v => { const e = Math.floor(Math.log10(v) + 1e-9), m = v / Math.pow(10, e); return esc(t('sw.sci', { m: nf(m, 1), e: MARK })).replace(MARK, supHtml(e)); };

  /* ---- the switching curve ---- */
  function curveFig(r) {
    const si = W.SILICON, yours = !(r.spec.mat === 'si' && r.spec.shape === 'fin' && r.spec.mech === 'therm' && !r.own);
    const pts = (rr, shift = 0) => W.curve(rr, 121, VMAX, shift, VLO).map(([v, l]) => f1(cx(v)) + ',' + f1(cy(l))).join(' ');
    let s = '<svg viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="' + esc(t('sw.fig.aria', { mv: nf(r.swing), v: r.clean ? nf(r.vmin, 2) : t('sw.never') })) + '">';
    s += '<defs><clipPath id="tswclip"><rect x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '"/></clipPath></defs>';
    s += '<rect class="plot" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" rx="4"/>';
    for (let d = LO; d <= HI; d += 2) s += '<line class="gl" x1="' + X0 + '" x2="' + X1 + '" y1="' + f1(cy(d)) + '" y2="' + f1(cy(d)) + '"/><text class="ax" x="' + (X0 - 5) + '" y="' + f1(cy(d) + 3.5) + '" text-anchor="end">10' + supSvg(d) + '</text>';
    for (let v = VLO; v <= VMAX + 1e-9; v += 0.2) s += '<text class="ax" x="' + f1(cx(v)) + '" y="' + (Y1 + 13) + '" text-anchor="middle">' + (Math.abs(v) < 1e-9 ? '0' : v.toFixed(1).replace('-', '−')) + '</text>';
    /* 0 V on the gate: where the switch should be off */
    s += '<line class="zero" x1="' + f1(cx(0)) + '" x2="' + f1(cx(0)) + '" y1="' + Y0 + '" y2="' + Y1 + '"/>';
    s += '<text class="cap" x="' + X1 + '" y="' + (CH - 4) + '" text-anchor="end">' + esc(t('sw.fig.x')) + '</text>';
    s += '<text class="cap" x="' + X0 + '" y="' + (Y0 - 8) + '">' + esc(t('sw.fig.y')) + '</text>';
    s += '<g clip-path="url(#tswclip)">';
    /* the 60 mV line through the middle of your switch's turn-on: one tenfold every 60 mV; its steeper side shaded */
    const A = r.clean ? r : si, lim = W.swingLimit(r.T), vm = A.vt - (W.DECADES / 2) * A.swing / 1000, lm = W.current(A, vm), d = 2.6, dv = d * lim / 1000;
    const ax = cx(vm - dv), ay = cy(lm - d), bxp = cx(vm + dv), byp = cy(lm + d);
    s += '<path class="wall" d="M' + f1(ax) + ' ' + f1(ay) + 'L' + f1(bxp) + ' ' + f1(byp) + 'L' + f1(ax) + ' ' + f1(byp) + 'Z"/><line class="line60" x1="' + f1(ax) + '" y1="' + f1(ay) + '" x2="' + f1(bxp) + '" y2="' + f1(byp) + '"/>';
    /* silicon's fin, today */
    s += '<polyline class="si" points="' + pts(si) + '"/>';
    if (yours) {
      /* the spread of the copies: the same switch with its threshold three spreads lower and higher */
      const lo = W.curve(r, 81, VMAX, -3 * r.sigma, VLO), hi = W.curve(r, 81, VMAX, 3 * r.sigma, VLO).reverse();
      s += '<polygon class="spread" points="' + lo.concat(hi).map(([v, l]) => f1(cx(v)) + ',' + f1(cy(l))).join(' ') + '"/>';
      s += '<polyline class="you' + (r.fair ? '' : ' guess') + '" points="' + pts(r) + '"/>';
    }
    if (!r.clean) { const fl = cy(Math.log10(W.ION_SI * r.ion / W.SILICON.ion) - r.floor); s += '<line class="floor" x1="' + X0 + '" x2="' + X1 + '" y1="' + f1(fl) + '" y2="' + f1(fl) + '"/>'; }
    s += '</g>';
    /* the words on the picture: the line, silicon, yours, and the voltage that switches it cleanly */
    const tx = Math.min(X1 - 4, Math.max(X0 + 4, ax + 6));
    s += '<text class="lt t60" x="' + f1(tx) + '" y="' + f1(Math.max(Y0 + 22, ay + 13)) + '">' + esc(t('sw.fig.line', { mv: Math.round(lim) })) + '</text>';
    /* your switch's name above its curve where there is room, else under it; silicon's under its own, clear of yours */
    const ySi = cy(Math.log10(W.ION_SI)), yOn = cy(Math.log10(W.ION_SI * r.ion / W.SILICON.ion)), yYou = yOn - 6 >= Y0 + 10 ? yOn - 6 : yOn + 14;
    let ySiT = ySi + 13; if (yours && Math.abs(ySiT - yYou) < 12) ySiT = yYou + 13;
    s += '<text class="lt tsi" x="' + (X1 - 6) + '" y="' + f1(ySiT) + '" text-anchor="end">' + esc(t('sw.fig.si')) + '</text>';
    if (yours) s += '<text class="lt tyou" x="' + (X1 - 6) + '" y="' + f1(yYou) + '" text-anchor="end">' + esc(t('sw.fig.you')) + '</text>';
    if (r.clean) s += '<line class="vmin" x1="' + f1(cx(r.vmin)) + '" x2="' + f1(cx(r.vmin)) + '" y1="' + Y0 + '" y2="' + Y1 + '"/><text class="lt tv" x="' + f1(cx(r.vmin) + 4) + '" y="' + (Y1 - 6) + '">' + esc(t('sw.v', { v: nf(r.vmin, 2) })) + '</text>';
    else s += '<text class="lt tbad" x="' + f1((X0 + X1) / 2) + '" y="' + (Y1 - 8) + '" text-anchor="middle">' + esc(t('sw.fig.never')) + '</text>';
    return '<figure class="tswfig" data-f2="instrument">' + s + '</svg><figcaption class="small muted tswkey"><span class="k you"></span>' + esc(t('sw.key.you')) + ' <span class="k band"></span>' + esc(t('sw.key.spread')) + ' <span class="k si"></span>' + esc(t('sw.key.si')) + ' <span class="k l60"></span>' + esc(t('sw.key.line')) + '</figcaption></figure>';
  }

  /* ---- the device, across its channel (current flows into the page) ---- */
  function deviceFig(r) {
    const sh = r.spec.shape, form = r.mat.form, ins = (x, y, w, h, rx = 3) => '<rect class="ins" x="' + (x - 2.5) + '" y="' + (y - 2.5) + '" width="' + (w + 5) + '" height="' + (h + 5) + '" rx="' + (rx + 2) + '"/>';
    const chan = (x, y, w, h, rx = 3) => '<rect class="ch" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/>';
    const tube = (x, y, rr) => '<circle class="ins" cx="' + x + '" cy="' + y + '" r="' + (rr + 2.5) + '"/><circle class="ch" cx="' + x + '" cy="' + y + '" r="' + rr + '"/>';
    let s = '<svg viewBox="0 0 240 132" role="img" aria-label="' + esc(t('sw.dev.aria', { shape: t('sw.shape.' + sh), mat: inName(r) })) + '">';
    s += '<rect class="sub" x="8" y="104" width="224" height="22" rx="4"/>';
    let gate = '', body = '';
    if (sh === 'planar' && form === 'tube') { body = '<rect class="ins" x="28" y="96" width="184" height="8" rx="2"/>' + [84, 108, 132, 156].map(x => tube(x, 88, 5)).join(''); gate = '<rect class="ins" x="66" y="74" width="108" height="5" rx="1"/><rect class="gate" x="66" y="44" width="108" height="30" rx="4"/>'; }
    else if (sh === 'planar') { body = chan(28, 88, 184, 16, 2); gate = '<rect class="ins" x="78" y="82" width="84" height="6" rx="1"/><rect class="gate" x="78" y="52" width="84" height="30" rx="4"/>'; }
    else if (sh === 'fin') { body = chan(28, 96, 184, 8, 2) + chan(108, 34, 24, 70, 4); gate = '<path class="ins" d="M100 104V28h40v76h-4V32h-32v72z"/><path class="gate" d="M84 104V16h72v88h-16V28h-40v76z"/>'; }
    else if (sh === 'gaa') {
      gate = '<rect class="gate" x="70" y="18" width="100" height="86" rx="6"/>';
      if (form === 'tube') body = [[98, 40], [142, 40], [98, 80], [142, 80]].map(([x, y]) => tube(x, y, 9)).join('');
      else if (form === 'sheet') body = [36, 56, 76].map(y => ins(84, y, 72, 4, 1) + chan(84, y, 72, 4, 1)).join('');
      else body = [32, 54, 76].map(y => ins(86, y, 68, 12) + chan(86, y, 68, 12)).join('');
    } else { body = '<rect class="ins" x="28" y="98" width="184" height="6" rx="1"/>' + chan(28, 94, 184, 4, 1); gate = '<rect class="ins" x="78" y="88" width="84" height="6" rx="1"/><rect class="gate" x="78" y="58" width="84" height="30" rx="4"/>'; }
    s += (sh === 'gaa' ? gate + body : body + gate);
    /* three words, each beside its part */
    const gy = sh === 'gaa' ? 13 : sh === 'fin' ? 11 : sh === 'sheet' ? 53 : 45;
    s += '<text class="lb" x="120" y="' + gy + '" text-anchor="middle">' + esc(t('sw.dev.gate')) + '</text>';
    s += sh === 'gaa' ? '<path class="lead" d="M172 60h14"/><text class="lb lch" x="190" y="63">' + esc(t('sw.dev.channel')) + '</text>'
      : '<text class="lb lch" x="28" y="' + (sh === 'fin' ? 91 : sh === 'sheet' ? 89 : 82) + '">' + esc(t('sw.dev.channel')) + '</text>';
    s += '<text class="lb lsub" x="120" y="119" text-anchor="middle">' + esc(t('sw.dev.sub')) + '</text>';
    return '<figure class="tswdev">' + s + '</svg><figcaption class="small muted">' + esc(t('sw.dev.cap', { shape: t('sw.shape.' + sh), mat: inName(r) })) + '</figcaption></figure>';
  }

  /* ---- the band the known materials make, and your material in it ---- */
  function bandFig(r) {
    const E = W.bandEdge(35), o = r.mat, B = W.inBand(o);
    let s = '<svg viewBox="0 0 ' + BW + ' ' + BH + '" role="img" aria-label="' + esc(t(B.ok ? 'sw.band.aria.in' : 'sw.band.aria.out')) + '">';
    const edge = k => E.map(p => f1(bx(p.eg)) + ',' + f1(by(Math.log10(p[k])))).join(' ');
    s += '<polygon class="beyond" points="' + f1(bx(0)) + ',' + BT + ' ' + edge('me') + ' ' + f1(bx(W.OWN_RANGE.eg[1])) + ',' + BT + '"/>';
    for (let p = 0; p <= 5; p++) s += '<line class="gl" x1="' + B0 + '" x2="' + B1 + '" y1="' + f1(by(p)) + '" y2="' + f1(by(p)) + '"/><text class="ax" x="' + (B0 - 4) + '" y="' + f1(by(p) + 3) + '" text-anchor="end">' + (p ? '10' + supSvg(p) : '1') + '</text>';
    for (const g of [0, 1, 2, 3]) s += '<text class="ax" x="' + f1(bx(g)) + '" y="' + (BB + 12) + '" text-anchor="middle">' + g + '</text>';
    s += '<polyline class="edge" points="' + edge('me') + '"/><polyline class="edge h" points="' + edge('mh') + '"/>';
    for (const m of W.MATERIALS) s += '<circle class="known" cx="' + f1(bx(m.eg)) + '" cy="' + f1(by(Math.log10(m.me))) + '" r="2.6"><title>' + esc(matName(m.id)) + '</title></circle>';
    s += '<text class="ax" x="' + f1(bx(2.2)) + '" y="' + (BT + 12) + '">' + esc(t('sw.band.beyond')) + '</text>';
    s += '<line class="tie" x1="' + f1(bx(o.eg)) + '" x2="' + f1(bx(o.eg)) + '" y1="' + f1(by(Math.log10(o.me))) + '" y2="' + f1(by(Math.log10(o.mh))) + '"/>';
    s += '<circle class="me' + (B.me ? '' : ' out') + '" cx="' + f1(bx(o.eg)) + '" cy="' + f1(by(Math.log10(o.me))) + '" r="5"/><circle class="mh' + (B.mh ? '' : ' out') + '" cx="' + f1(bx(o.eg)) + '" cy="' + f1(by(Math.log10(o.mh))) + '" r="4"/>';
    s += '<text class="cap" x="' + B1 + '" y="' + (BH - 3) + '" text-anchor="end">' + esc(t('sw.band.x')) + '</text>';
    return '<figure class="tswband">' + s + '</svg><figcaption class="small muted tswkey"><span class="k me"></span>' + esc(t('sw.band.me')) + ' <span class="k mh"></span>' + esc(t('sw.band.mh')) + ' <span class="k kn"></span>' + esc(t('sw.band.known')) + '</figcaption></figure>';
  }

  /* ---- the goals: each met by some switch you tried; the current one's value beside it ---- */
  function goalbox(r) {
    const g = got(), all = W.GOALS.every(k => g[k]);
    const val = { off: r.goals.off ? t('sw.yes') : r.clean ? t('sw.status.guess') : t('sw.never'), energy: r.clean ? t('sw.pct', { v: nf(r.energy * 100) }) : '—',
      steep: t('sw.mv', { v: nf(r.swing) }), factory: r.goals.factory ? t('sw.yes') : t('sw.no') };
    const bar = { off: r.clean ? 1 : r.floor / W.DECADES, energy: r.clean ? Math.min(1, 1 / r.energy) : 0, steep: Math.min(1, W.swingLimit(r.T) / r.swing), factory: [r.clean && !r.own, r.survives, r.pair, r.clean && r.energy < 1, r.speed >= W.SLOWEST].filter(Boolean).length / 5 };
    return '<div class="goalbox tswgoal' + (all ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(all ? 'game.reached' : 'game.goalNow')) + '</p>' + W.GOALS.map(k => '<div class="gauge' + (g[k] ? ' ok' : '') + '" data-swgoal="' + k + '"' + (g[k] ? ' data-met' : '') + '><span class="gl">' + (g[k] ? '✓ ' : '') + esc(t('sw.g.' + k)) + '</span><span class="gv">' + esc(val[k]) + '</span><span class="gbar"><span style="width:' + (Math.max(0, Math.min(1, bar[k])) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }

  /* ---- what it reads, and how true each part is ---- */
  function readout(r) {
    const fac = r.own ? t('sw.f.own') : !r.survives ? t('sw.f.melts', { c: nf(r.mat.melt), heat: nf(r.heat) }) : !r.pair ? t('sw.f.pair') : t('sw.f.ok', { c: nf(r.heat) });
    const rows = [['v', r.clean ? t('sw.v', { v: nf(r.vmin, 2) }) : t('sw.never'), 'sw.r.v.d'], ['energy', r.clean ? t('sw.pct', { v: nf(r.energy * 100) }) : '—', 'sw.r.energy.d'],
      ['speed', r.clean ? t('sw.times', { v: r.speed >= 0.1 ? nf(r.speed, 2) : nf(+r.speed.toPrecision(1), 3) }) : '—', 'sw.r.speed.d'], ['swing', t('sw.mv', { v: nf(r.swing) }), 'sw.r.swing.d'],
      ['pair', r.pair ? t('sw.yes') : t('sw.no'), r.pair ? 'sw.r.pair.y' : 'sw.r.pair.n'], ['factory', fac, 'sw.r.factory.d']];
    return '<div class="tswread">' + rows.map(([k, v, d]) => '<span class="sr-' + k + '"><span class="small muted">' + esc(t('sw.r.' + k)) + '</span><b class="mono">' + esc(v) + '</b><span class="small muted">' + esc(t(d)) + '</span></span>').join('') + '</div>';
  }
  const pill = st => '<span class="tswst s-' + st + '">' + esc(t('sw.status.' + st)) + '</span>';
  function truth(r) {
    const M = r.mat, X = W.mechOf(r.spec.mech), Sh = W.shapeOf(r.spec.shape);
    const matSt = M.own ? (r.inBand ? 'band' : 'guess') : M.status;
    const rows = [
      ['mat', M.own ? fidMark({ f: 'idea' }) : fidMark({ f: 'figures', fact: M.fact }), pill(matSt)],
      ['shape', fidMark({ f: 'idea' }), pill(Sh.status)],
      ['way', fidMark({ f: 'figures', fact: X.fact }), pill(X.status)],
      ['curve', fidMark({ f: 'computed', by: 'switch' }), ''],
      ['traps', fidMark({ f: 'idea' }), '']];
    return '<div class="tswtrue"><p class="kicker">' + esc(t('sw.true.kicker')) + '</p>' + rows.map(([k, m, p]) => '<div class="tswtr"><span>' + esc(t('sw.true.' + k)) + '</span><span class="tswtm">' + m + p + '</span></div>').join('') + '</div>';
  }

  /* ---- the choices ---- */
  function choices(o, r) {
    const shapes = W.shapesFor(r.mat), chip = (k, id, on, label, dis) => '<button type="button" class="chipb" data-sw-' + k + '="' + id + '" aria-pressed="' + on + '"' + (dis ? ' disabled' : '') + '>' + esc(label) + '</button>';
    let h = '<div class="tswset"><p class="kicker">' + esc(t('sw.set.mat')) + '</p><div class="chips">' + W.MATERIAL_IDS.map(id => chip('mat', id, o.mat === id, matName(id))).join('') + chip('mat', 'own', o.mat === 'own', t('sw.mat.own')) + '</div>';
    if (o.mat === 'own') {
      const v = W.ownOf(o.own);
      h += '<div class="tswown"><p class="small muted">' + esc(t('sw.own.lead')) + '</p>' + DIALS.map(([k, a, b, st]) => { const val = toDial(k, v[k]), shown = k === 'eg' ? esc(t('sw.ev', { v: nf(v.eg, 2) })) : k === 'dit' ? sci(v.dit) : esc(t('sw.mob', { v: mob(v[k]) }));
        return '<div class="tswdial"><label class="lab" for="sw-' + k + '"><b>' + esc(t('sw.own.' + k)) + '</b> <output>' + shown + '</output></label><input type="range" id="sw-' + k + '" data-sw-own="' + k + '" min="' + a + '" max="' + b + '" step="' + st + '" value="' + val.toFixed(2) + '"><span class="small muted">' + esc(t('sw.own.' + k + '.d', { p: MARK })).replace(MARK, '10' + supHtml(10)) + '</span></div>'; }).join('') + bandFig(r) +
        '<p class="small tswbandsay ' + (r.inBand ? 'good' : 'bad') + '">' + esc(t(r.inBand ? 'sw.band.in' : 'sw.band.out')) + '</p></div>';
    }
    h += '<p class="kicker">' + esc(t('sw.set.shape')) + '</p><div class="chips">' + W.SHAPE_IDS.map(id => chip('shape', id, o.shape === id, t('sw.shape.' + id), !shapes.includes(id))).join('') + '</div>';
    h += '<p class="kicker">' + esc(t('sw.set.mech')) + '</p><div class="chips">' + W.MECH_IDS.map(id => chip('mech', id, o.mech === id, t('sw.mech.' + id))).join('') + '</div></div>';
    return h;
  }
  /* what happened, in one line: the most telling thing about this switch */
  function say(r) {
    const k = r.mat.eg === 0 && !r.own ? 'graphene' : !r.clean ? 'leaks' : !r.fair ? 'guess' : r.own ? 'own' : !r.survives ? 'melts' : r.spec.mech === 'tunnel' && r.speed < 0.1 ? 'tunnelSlow' : r.spec.mech === 'tunnel' ? 'tunnel' : r.spec.mech === 'nc' ? (r.steep ? 'nc' : 'ncNot') : !r.pair ? 'pair' : r.spec.mat === 'si' && r.spec.shape === 'fin' ? 'today' : r.energy < 1 ? 'better' : 'worse';
    return t('sw.say.' + k, { mat: matName(r.spec.mat), c: r.mat.melt ? nf(r.mat.melt) : '', heat: nf(r.heat), v: r.clean ? nf(r.vmin, 2) : '', e: r.clean ? nf(r.energy * 100) : '', s: r.clean ? (r.speed >= 0.1 ? nf(r.speed, 1) : nf(+r.speed.toPrecision(1), 3)) : '', mv: nf(r.swing) });
  }
  /* your switch up the scales: kept for the machines */
  function upHtml(r) {
    const k = W.specKey(r.spec), kept = keptSwitch() === k;
    return '<div class="tswup"><p class="kicker">' + esc(t('sw.up.kicker')) + '</p><p class="small">' + esc(t('sw.up.lead')) + '</p>' +
      (kept ? '<p class="small good" data-sw-kept>' + esc(t('sw.up.kept')) + '</p>' : '<button type="button" class="btn" data-sw-keep' + (r.clean ? '' : ' disabled') + '>' + esc(t('sw.up.keep')) + '</button>') +
      '<a class="link small tswgo" href="#/machines/wildfire/claims">' + esc(t('sw.up.go')) + '</a></div>';
  }

  function bench() {
    const o = set(), r = W.switchOf(o), g = got(), done = W.GOALS.every(k => g[k]);
    let h = head() + '<p class="small tswintro">' + esc(t('sw.intro')) + '</p>' + goalbox(r) + curveFig(r);
    h += choices(o, r) + deviceFig(r) + readout(r);
    h += '<p class="small tswsay">' + esc(say(r)) + '</p>';
    if (!done) h += view.hint ? '<p class="small hint">' + esc(t('sw.hint.' + (W.GOALS.find(k => !g[k]) || 'off'))) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + esc(t('sw.done')) + '</p>';
    h += truth(r) + upHtml(r) + '<p class="small muted tswnote">' + esc(t('sw.note')) + '</p>';
    return h + doneNote() + reward();
  }
  const after = () => { see(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) {
      const q = s => e.target.closest(s), o = set();
      const m = q('[data-sw-mat]'); if (m && !m.disabled) { o.mat = m.dataset.swMat; if (o.mat === 'own' && !o.own) o.own = Object.assign({}, W.OWN_START); Object.assign(o, W.normal(o)); return after(); }
      const s = q('[data-sw-shape]'); if (s && !s.disabled) { o.shape = s.dataset.swShape; Object.assign(o, W.normal(o)); return after(); }
      const x = q('[data-sw-mech]'); if (x) { o.mech = x.dataset.swMech; return after(); }
      if (q('[data-sw-keep]')) { const r = W.switchOf(o); if (r.clean) keep(W.specKey(o)); draw(); return true; }
      return false;
    },
    input(e) {
      const i = e.target.closest('[data-sw-own]'); if (!i) return false;
      const o = set(), k = i.dataset.swOwn; o.own = Object.assign({}, W.OWN_START, o.own, { [k]: fromDial(k, +i.value) }); return after();
    }
  };
}
