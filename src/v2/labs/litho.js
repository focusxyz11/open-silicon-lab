/* Print the finest lines (kind 'litho') and The 1,000-watt source (kind 'euv'), both at the factory's printing step,
   from src/engines/litho.js. Two labs of the challenge player (src/v2/play.js) in one file: lab(L) gets the player's
   pieces and returns { draw, click, input }; click and input say whether they handled the event.
   Print the finest lines: pick the light, the lens, the pitch and the lighting; see the light that reaches the resist
   against its threshold, the lines that print, and where you are against the Rayleigh limit.
   The 1,000-watt source: the EUV scanner's throughput (light lost on every mirror, 12.6 s of moving per wafer) and the
   holes that come out ragged when few photons arrive. */
import * as X from '../../engines/litho.js';
import { metBy } from '../../engines/fabkit.js';

const chal = id => X.LITHO_CHALLENGES.find(c => c.id === id);
const f1 = (v, d = 1) => v.toFixed(d), nm = v => v < 20 ? v.toFixed(1) : String(Math.round(v));

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw } = L, view = L.view;

  /* ================= Print the finest lines ================= */
  const LT = () => view.lt || (view.lt = { src: 'iline', na: X.sourceOf('iline').na, v: 1000, dose: X.LITHO_DEFAULTS.dose, illum: 'conventional', dp: false, best: {} });
  const ltRun = () => { const o = LT(), r = X.litho({ src: o.src, na: o.na, hp: X.hpOfSlider(o.v), dose: o.dose, illum: o.illum, dp: o.dp });
    if (r.status !== 'bad' && (!o.best[o.src] || r.hp < o.best[o.src].hp)) o.best[o.src] = r;
    if (S.done[ch.id] === undefined && metBy(chal('litho-finest'), Object.values(o.best))) win();
    return r; };
  const ltDone = i => !!S.done[ch.id] || chal('litho-finest').groups[i](LT().best[X.SOURCES[i].id] || {});
  function ltSvg(r) {
    const W = 300, x0 = 12, x1 = 292, pw = x1 - x0, ya = 14, yb = 96, a = -2 * r.p, b = 2 * r.p, X1 = x => x0 + (x - a) / (b - a) * pw;
    const I = x => r.dp ? Math.max(r.intensity(x), r.intensity(x - r.p)) : r.intensity(x), pts = [];
    let mx = 1.2; for (let i = 0; i <= 160; i++) { const x = a + (b - a) * i / 160, v = I(x); pts.push([x, v]); mx = Math.max(mx, v * 1.05); }
    const Y = v => yb - (yb - ya) * Math.min(v, mx) / mx, line = pts.map(([x, v]) => X1(x).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
    const lines = X.resistLines(r), cls = r.status === 'ok' ? 'ok' : r.status === 'marginal' ? 'mid' : 'no';
    const lo = Math.log(4), hi = Math.log(220), R = v => x0 + pw * (Math.log(Math.min(220, Math.max(4, v))) - lo) / (hi - lo);
    const lim = X.rayleigh(0.25, r.lam, r.na), yr = 168;
    return '<figure class="ltfig"><svg viewBox="0 0 ' + W + ' 206" role="img" aria-label="' + esc(t('lt.aria', { status: t('lt.status.' + r.status) })) + '">' +
      '<text class="ax" x="' + x0 + '" y="9">' + esc(t('lt.fig.light')) + '</text>' +
      '<polygon class="ltarea" points="' + x0 + ',' + yb + ' ' + line + ' ' + x1 + ',' + yb + '"/><polyline class="ltcurve" points="' + line + '"/>' +
      '<line class="ltthr" x1="' + x0 + '" x2="' + x1 + '" y1="' + Y(X.THRESHOLD).toFixed(1) + '" y2="' + Y(X.THRESHOLD).toFixed(1) + '"/>' +
      '<text class="ax r" x="' + x1 + '" y="' + (Y(X.THRESHOLD) - 3).toFixed(1) + '">' + esc(t('lt.fig.thr')) + '</text>' +
      '<line class="ltbase" x1="' + x0 + '" x2="' + x1 + '" y1="' + yb + '" y2="' + yb + '"/>' +
      '<text class="ax" x="' + x0 + '" y="113">' + esc(t('lt.fig.lines')) + '</text>' +
      '<rect class="ltwafer" x="' + x0 + '" y="132" width="' + pw + '" height="6" rx="2"/>' +
      lines.map(([p, q]) => '<rect class="ltline ' + cls + '" x="' + X1(p).toFixed(1) + '" y="118" width="' + Math.max(0.8, X1(q) - X1(p)).toFixed(1) + '" height="14" rx="1.5"/>').join('') +
      '<text class="ax r" x="' + x1 + '" y="113">' + esc(t('lt.fig.span', { v: nm(b - a) })) + '</text>' +
      '<text class="ax" x="' + x0 + '" y="154">' + esc(t('lt.fig.rayleigh')) + '</text>' +
      '<rect class="ltrule" x="' + x0 + '" y="' + (yr - 4) + '" width="' + pw + '" height="8" rx="4"/>' +
      '<rect class="ltno" x="' + x0 + '" y="' + (yr - 4) + '" width="' + Math.max(0, R(lim) - x0).toFixed(1) + '" height="8" rx="4"/>' +
      '<line class="ltlim" x1="' + R(lim).toFixed(1) + '" x2="' + R(lim).toFixed(1) + '" y1="' + (yr - 9) + '" y2="' + (yr + 9) + '"/>' +
      '<circle class="ltdot ' + cls + '" cx="' + R(r.hp).toFixed(1) + '" cy="' + yr + '" r="5.5"/>' +
      '<text class="ax' + (R(lim) < 100 ? '' : ' r') + '" text-anchor="' + (R(lim) < 100 ? 'start' : 'end') + '" x="' + (R(lim) + (R(lim) < 100 ? 4 : -4)).toFixed(1) + '" y="' + (yr + 22) + '">' + esc(t('lt.fig.limit', { v: nm(lim) })) + '</text>' +
      '<text class="ax" text-anchor="' + (R(r.hp) > 250 ? 'end' : R(r.hp) < 50 ? 'start' : 'middle') + '" x="' + R(r.hp).toFixed(1) + '" y="' + (yr + 22 + (Math.abs(R(r.hp) - R(lim)) < 70 ? 12 : 0)) + '">' + esc(t('lt.fig.you', { v: nm(r.hp) })) + '</text>' +
      '</svg></figure>';
  }
  function litho() {
    const o = LT(), s = X.sourceOf(o.src), r = ltRun(), n = X.SOURCES.filter((_, i) => ltDone(i)).length, all = n === X.SOURCES.length, lim = X.rayleigh(0.25, r.lam, r.na);
    let h = head() + '<div class="goalbox' + (all ? ' ok' : '') + '"><p class="kicker">' + esc(t(all ? 'game.reached' : 'game.goalNow')) + '</p>' +
      '<div class="gauge' + (all ? ' ok' : '') + '"><span class="gl">' + esc(t('lt.g.done')) + '</span><span class="gv">' + esc(t('lt.g.of', { n, m: X.SOURCES.length })) + ' <span class="muted">' + esc(t('lt.g.all', { m: X.SOURCES.length })) + '</span></span><span class="gbar"><span style="width:' + (n / X.SOURCES.length * 100).toFixed(0) + '%"></span></span></div></div>';
    h += '<div class="chips ltsrcs" role="group">' + X.SOURCES.map((q, i) => '<button type="button" class="chipb ltsrc' + (ltDone(i) ? ' done' : '') + '" data-lt-src="' + q.id + '" aria-pressed="' + (q.id === o.src) + '"><b>' + esc(t('lt.src.' + q.id)) + (ltDone(i) ? ' ✓' : '') + '</b><span class="small">' + esc(t('lt.era.' + q.id)) + '</span></button>').join('') + '</div>';
    h += '<div class="betview">' + ltSvg(r) + '</div>';
    h += '<div class="ltread">' + [['lam', t('lt.nm', { v: nm(r.lam) })], ['na', f1(r.na, 2)], ['k1', f1(r.k1, 2)]].map(([k, v]) => '<span' + (k === 'k1' && r.k1 < 0.25 && !r.dp ? ' class="warn"' : '') + '><span class="small muted">' + esc(t('lt.r.' + k)) + '</span><b class="mono">' + esc(v) + '</b><span class="small muted">' + esc(t('lt.r.' + k + '.d')) + '</span></span>').join('') + '</div>';
    h += '<p class="small muted">' + esc(t('lt.rule', { k: '0.25', lam: nm(r.lam), na: f1(r.na, 2), lim: nm(lim) }) + (o.dp ? t('lt.rule.dp') : '')) + '</p>';
    const hpv = X.hpOfSlider(o.v), fixed = !!s.fixed;
    h += '<label class="lab" for="lt-hp"><b>' + esc(t('lt.set.hp')) + '</b> <output>' + esc(t('lt.nm', { v: nm(hpv) })) + '</output></label><input type="range" id="lt-hp" data-lt="v" min="0" max="1000" step="1" value="' + o.v + '">';
    h += '<label class="lab" for="lt-na"><b>' + esc(t('lt.set.na')) + '</b> <output>' + esc(fixed ? t('lt.v.fixed', { v: f1(s.na, 2) }) : f1(r.na, 2)) + '</output></label><input type="range" id="lt-na" data-lt="na" min="' + (fixed ? s.na : s.min) + '" max="' + (fixed ? s.na : s.max) + '" step="0.01" value="' + r.na + '"' + (fixed ? ' disabled' : '') + '>';
    h += '<label class="lab" for="lt-dose"><b>' + esc(t('lt.set.dose')) + '</b> <output>' + esc(t('lt.v.dose', { v: f1(o.dose, 2) })) + '</output></label><input type="range" id="lt-dose" data-lt="dose" min="0.4" max="1.6" step="0.01" value="' + o.dose + '">';
    h += '<div class="chips">' + ['conventional', 'dipole'].map(k => '<button type="button" class="chipb" data-lt-illum="' + k + '" aria-pressed="' + (o.illum === k) + '">' + esc(t('lt.illum.' + k)) + '</button>').join('') + '<button type="button" class="chipb" data-lt-dp aria-pressed="' + o.dp + '">' + esc(t('lt.dp')) + '</button></div>';
    const bad = r.status === 'bad', why = r.contrast < 0.05 ? 'blur' : r.cd === 0 ? 'vanish' : 'merge', fin = ltDone(X.SOURCES.findIndex(q => q.id === o.src));
    h += '<p class="small ' + (bad ? 'bad' : r.status === 'ok' ? 'good' : '') + '"><b>' + esc(t('lt.status.' + r.status)) + '.</b> ' + esc(t('lt.msg.' + (bad ? why : fin ? 'done' : r.status))) + '</p>';
    if (!all) h += view.hint ? '<p class="small hint">' + esc(t('lt.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('lt.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('lt.note')) + '</p>' + doneNote() + reward();
  }

  /* ================= The 1,000-watt source ================= */
  const EU = () => view.eu || (view.eu = { ...X.EUV_DEFAULTS, seed: 1, seen: [] });
  const euRun = () => { const o = EU(), r = X.euv(o); if (r.power >= 1000 && r.wphRounded >= 275) o.seen = [r];
    if (S.done[ch.id] === undefined && metBy(chal('euv-1000'), o.seen)) win(); return r; };
  function euSvg(r) {
    const W = 300, x0 = 12, pw = 276, n = r.mirrors, bw = pw / (n + 1), top = 18, hh = 62;
    let s = '<text class="ax" x="' + x0 + '" y="10">' + esc(t('eu.fig.mirrors')) + '</text>';
    for (let k = 0; k <= n; k++) { const v = Math.pow(r.reflect, k), hgt = Math.max(1.5, hh * v);
      s += '<rect class="eubar' + (k === 0 ? ' src' : k === n ? ' end' : '') + '" x="' + (x0 + k * bw + 1).toFixed(1) + '" y="' + (top + hh - hgt).toFixed(1) + '" width="' + Math.max(2, bw - 2).toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="1.5"/>'; }
    s += '<text class="ax r" x="' + (x0 + pw) + '" y="' + (top + hh + 11) + '">' + esc(t('eu.fig.wafer', { v: r.atWaferPct.toFixed(1) })) + '</text>';
    /* the time one wafer takes: light on, then the fixed 12.6 s of moving and waiting; 275 and 330 an hour marked */
    const Tmax = 20, tx = s2 => x0 + pw * Math.min(Tmax, s2) / Tmax, y = 118, ex = r.exposeSec, ov = X.EUV.overheadSec;
    s += '<text class="ax" x="' + x0 + '" y="106">' + esc(t('eu.fig.time')) + '</text>' +
      '<rect class="eumove" x="' + x0 + '" y="' + y + '" width="' + (tx(ov) - x0).toFixed(1) + '" height="14" rx="2"/>' +
      '<rect class="euexp" x="' + tx(ov).toFixed(1) + '" y="' + y + '" width="' + Math.max(1.5, tx(ov + ex) - tx(ov)).toFixed(1) + '" height="14"/>' +
      [[275, 'eu.fig.at275'], [330, 'eu.fig.at330']].map(([w, k], i) => '<line class="eumark" x1="' + tx(3600 / w).toFixed(1) + '" x2="' + tx(3600 / w).toFixed(1) + '" y1="' + (y - 5) + '" y2="' + (y + 19) + '"/><text class="ax" text-anchor="' + (i ? 'end' : 'start') + '" x="' + (tx(3600 / w) + (i ? -3 : 3)).toFixed(1) + '" y="' + (y + 30) + '">' + esc(t(k)) + '</text>').join('') +
      '<text class="ax" x="' + (x0 + 4) + '" y="' + (y + 10.5) + '" style="fill:var(--bg)">' + esc(t('eu.fig.move', { v: f1(ov) })) + '</text>';
    return '<figure class="eufig"><svg viewBox="0 0 ' + W + ' 156" role="img" aria-label="' + esc(t('eu.aria')) + '">' + s + '</svg></figure>';
  }
  function euHoles(o) {
    const E = X.euvExpose({ dose: o.dose }, o.seed), G = X.EUV.grid; let d = '';
    for (let y = 0; y < G; y++) { let x = 0; while (x < G) { if (E.printed[y * G + x]) { let x2 = x; while (x2 < G && E.printed[y * G + x2]) x2++; d += 'M' + x + ' ' + y + 'h' + (x2 - x) + 'v1h-' + (x2 - x) + 'z'; x = x2; } else x++; } }
    const cells = E.ok.map((ok, i) => '<rect class="euc ' + (ok ? 'ok' : 'no') + '" x="' + ((i % 3) * 32 + 1) + '" y="' + (Math.floor(i / 3) * 32 + 1) + '" width="30" height="30" rx="3"/>').join('');
    return { E, svg: '<svg viewBox="0 0 96 96" role="img" aria-label="' + esc(t('eu.holes.aria', { n: E.bad })) + '"><rect class="eures" width="96" height="96" rx="3"/><path class="euhole" d="' + d + '"/>' + cells + '</svg>' };
  }
  function euv() {
    const o = EU(), r = euRun(), Rg = X.EUV_RANGE, H = euHoles(o), won = r.power >= 1000 && r.wphRounded >= 275, best = X.euvBest();
    const g = [['power', r.power, t('eu.g.v.power', { v: Math.round(r.power) }), r.power >= 1000, r.power / 1000], ['wph', r.wph, String(r.wphRounded), r.wphRounded >= 275, r.wph / 275]];
    let h = head() + '<div class="goalbox' + (won ? ' ok' : '') + '"><p class="kicker">' + esc(t(won ? 'game.reached' : 'game.goalNow')) + '</p>' + g.map(([k, , v, ok, f]) => '<div class="gauge' + (ok ? ' ok' : '') + '"><span class="gl">' + esc(t('eu.g.' + k)) + '</span><span class="gv">' + esc(v) + ' <span class="muted">' + esc(t('eu.g.t.' + k)) + '</span></span><span class="gbar"><span style="width:' + (Math.min(1, f) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    h += '<div class="betview">' + euSvg(r) + '</div>';
    h += '<div class="euholes"><figure class="euhfig">' + H.svg + '</figure><div><p class="kicker">' + esc(t('eu.holes.t')) + '</p><p class="' + (H.E.bad ? 'bad' : 'good') + '"><b>' + esc(t('eu.holes.n', { n: H.E.bad })) + '</b></p><p class="small muted">' + esc(t('eu.holes.d', { n: Math.round(r.photonsPerHole) })) + '</p><button type="button" class="chipb" data-eu-again>' + esc(t('eu.again')) + '</button></div></div>';
    const sl = (k, step, v) => '<label class="lab" for="eu-' + k + '"><b>' + esc(t('eu.set.' + k)) + '</b> <output>' + esc(t('eu.v.' + k, { v })) + '</output></label><input type="range" id="eu-' + k + '" data-eu="' + k + '" min="' + Rg[k][0] + '" max="' + Rg[k][1] + '" step="' + step + '" value="' + o[k] + '">';
    h += sl('power', 10, Math.round(o.power)) + sl('reflect', 0.005, (o.reflect * 100).toFixed(1)) + sl('mirrors', 1, o.mirrors) + sl('dose', 1, Math.round(o.dose));
    h += '<p class="small muted">' + esc(t('eu.mirrors.d')) + '</p>';
    h += '<p class="small ' + (won && !H.E.bad ? 'good' : won ? 'bad' : '') + '">' + esc(won ? (H.E.bad ? t('eu.msg.ragged', { n: H.E.bad }) : t('eu.msg.won')) : r.wphRounded >= 275 ? t('eu.msg.power') : t('eu.msg.slow')) + (won && r.wph < 330 && r.wph >= best.wph - 3 ? ' ' + esc(t('eu.msg.ceiling')) : '') + '</p>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('eu.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('eu.done')) + '</p>';
    h += '<button type="button" class="link" data-eu-reset>' + esc(t('eu.reset')) + '</button>';
    return h + '<p class="small muted">' + esc(t('eu.note')) + '</p>' + doneNote() + reward();
  }

  return {
    draw: ch.kind === 'euv' ? euv : litho,
    click(e) { const q = s => e.target.closest(s);
      let b;
      if ((b = q('[data-lt-src]'))) { const o = LT(), s = X.sourceOf(b.dataset.ltSrc); o.src = s.id; o.na = s.fixed ? s.na : Math.min(s.max, Math.max(s.min, s.na)); draw(); return true; }
      if ((b = q('[data-lt-illum]'))) { LT().illum = b.dataset.ltIllum; draw(); return true; }
      if (q('[data-lt-dp]')) { const o = LT(); o.dp = !o.dp; draw(); return true; }
      if (q('[data-eu-again]')) { EU().seed++; draw(); return true; }
      if (q('[data-eu-reset]')) { Object.assign(EU(), X.EUV_DEFAULTS, { seed: 1 }); draw(); return true; }
      return false; },
    input(e) {
      const a = e.target.closest('[data-lt]'); if (a) { LT()[a.dataset.lt] = +a.value; draw(); return true; }
      const c = e.target.closest('[data-eu]'); if (c) { EU()[c.dataset.eu] = +c.value; draw(); return true; }
      return false; }
  };
}
