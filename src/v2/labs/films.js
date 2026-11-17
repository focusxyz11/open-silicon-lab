/* Etch straight down (kind 'etch', at the factory's etch step) and The bare bottom (kind 'deposit', at its deposit step),
   from src/engines/etch.js and src/engines/fabline.js. One module for the two films labs, since both draw a cross-section
   of a film on silicon and both run as a short animation of the engine's own steps (the engines hold the numbers; this
   file only draws them). A lab of the challenge player (src/v2/play.js): lab(L) gets the player's pieces and returns
   { draw, click, input }; draw gives the card's HTML, click and input say whether they handled the event. */
import { ETCH_GRID, ETCH_DEFAULTS, ETCH_RANGE, ETCH_CHALLENGES, ETCH, etchStart, etchStep } from '../../engines/etch.js';
import { TRENCH, DEPO_RANGE, FABLINE_CHALLENGES, depoStart, depoStep } from '../../engines/fabline.js';
import { metBy } from '../../engines/fabkit.js';

const ETCH_RATE = 12, DEPO_RATE = 24;                      // frames and steps a second, at normal speed

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const F = view.fl || (view.fl = {});
  const gauges = (list, ok) => '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' +
    list.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(g.l) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (Math.max(0, Math.min(1, g.f)) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  const tile = (k, v, cls) => '<span class="' + (cls || '') + '"><span class="small muted">' + esc(t('fl.r.' + k)) + '</span><b class="mono">' + esc(v) + '</b></span>';
  const hintOf = k => (S.done[ch.id] ? '' : view.hint ? '<p class="small hint">' + esc(t(k)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>');
  const slider = (id, key, label, value, text, range, step) => '<label class="lab" for="' + id + '"><b>' + esc(label) + '</b> <output>' + esc(text) + '</output></label><input type="range" id="' + id + '" data-fl="' + key + '" min="' + range[0] + '" max="' + range[1] + '" step="' + step + '" value="' + value + '">';

  /* ================= Etch straight down ================= */
  const E = () => F.et || (F.et = { ions: ETCH_DEFAULTS.ions, chem: ETCH_DEFAULTS.chem, s: etchStart(1), run: false, fast: false, acc: 0, T: null, ended: false });
  const etchLoop = now => {
    const o = E();
    if (!o.run || !el.isConnected) { o.run = false; return; }
    o.acc += Math.min(0.5, (now - (o.T || now)) / 1000) * ETCH_RATE * (o.fast ? 4 : 1); o.T = now;      /* the clock decides, so a slow screen etches the same hole in bigger steps */
    const n = Math.min(40, Math.floor(o.acc));
    if (n > 0) {
      o.acc -= n; o.s = etchStep(o.s, n, { ions: o.ions, chem: o.chem });
      if (o.s.done) { o.run = false; o.ended = true; if (metBy(ETCH_CHALLENGES[0], [o.s])) win(); }
      draw(); fx();
    }
    if (o.run) requestAnimationFrame(etchLoop);
  };
  function etchSvg(s) {
    const c = 3, G = ETCH_GRID, W = G.w * c, H = G.h * c, runs = v => {
      let d = ''; for (let y = 0; y < G.h; y++) { let x = 0; while (x < G.w) { if (s.g[y * G.w + x] !== v) { x++; continue; } const x0 = x; while (x < G.w && s.g[y * G.w + x] === v) x++; d += 'M' + x0 * c + ' ' + y * c + 'h' + (x - x0) * c + 'v' + c + 'h-' + (x - x0) * c + 'z'; } }
      return d; };
    const tr = s.traces.map(r => '<polyline class="' + (r.ion ? 'fl-ion' : 'fl-rad') + '" points="' + r.tr.map(p => (p[0] * c).toFixed(1) + ',' + (p[1] * c).toFixed(1)).join(' ') + '"/>').join('');
    const uc = s.undercutNm, ucOk = uc < 5, y3 = (G.filmTop + 1) * c, xl = G.openFrom * c, xr = G.openTo * c;
    const mark = uc > 0 ? '<g class="fl-uc ' + (ucOk ? 'good' : 'bad') + '"><path d="M' + (xl - uc / G.cellNm * c) + ' ' + y3 + 'H' + xl + 'M' + (xr + uc / G.cellNm * c) + ' ' + y3 + 'H' + xr + '"/><text x="' + (xl - uc / G.cellNm * c - 3) + '" y="' + (y3 + 4) + '" text-anchor="end">' + esc(t('fl.nm', { v: uc })) + '</text></g>' : '';
    return '<figure class="flfig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('fl.etch.aria', { d: s.depthNm, u: uc, m: s.maskPct })) + '" shape-rendering="crispEdges">' +
      '<defs><linearGradient id="fl-pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.34"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:.04"/></linearGradient></defs>' +
      '<rect class="fl-air" x="0" y="0" width="' + W + '" height="' + H + '"/><rect x="0" y="0" width="' + W + '" height="' + G.maskTop * c + '" fill="url(#fl-pl)"/>' +
      '<rect class="fl-was" x="0" y="' + G.maskTop * c + '" width="' + W + '" height="' + (G.filmTop - G.maskTop) * c + '"/>' +
      '<path class="fl-film" d="' + runs(2) + '"/><path class="fl-mask" d="' + runs(1) + '"/>' +
      '<g shape-rendering="auto">' + tr + mark + '</g>' +
      '<text class="fl-t" x="6" y="12">' + esc(t('fl.plasma')) + '</text><text class="fl-t" x="6" y="' + (G.maskTop * c + 11) + '">' + esc(t('fl.mask')) + '</text><text class="fl-t" x="6" y="' + (G.filmTop * c + 13) + '">' + esc(t('fl.film')) + '</text>' +
      '<text class="fl-t mid" x="' + (W / 2) + '" y="' + (G.maskTop * c - 5) + '" text-anchor="middle">' + esc(t('fl.open', { v: (G.openTo - G.openFrom) * G.cellNm })) + '</text></svg></figure>';
  }
  function etch() {
    const o = E(), s = o.s, X = ETCH_CHALLENGES[0].groups, ok = !!S.done[ch.id] || (o.ended && metBy(ETCH_CHALLENGES[0], [s]));
    const gs = [{ l: t('fl.etch.g.depth'), v: t('fl.nm', { v: s.depthNm }), target: t('fl.etch.t.depth', { v: 100 }), ok: s.depthNm > 100, f: s.depthNm / 100 },
      { l: t('fl.etch.g.undercut'), v: t('fl.nm', { v: s.undercutNm }), target: t('fl.etch.t.undercut', { v: 5 }), ok: s.undercutNm < 5 && s.depthNm > 0, f: s.depthNm ? 5 / Math.max(5, s.undercutNm) : 0 },
      { l: t('fl.etch.g.mask'), v: t('fl.pct', { v: s.maskPct }), target: t('fl.etch.t.mask', { v: 70 }), ok: s.maskPct >= 70, f: s.maskPct / 70 }];
    let h = head() + gauges(gs, ok) + etchSvg(s);
    h += '<div class="flread">' + tile('depth', t('fl.nm', { v: s.depthNm })) + tile('aspect', t('fl.ratio', { v: (s.aspect).toFixed(1) })) + tile('undercut', t('fl.nm', { v: s.undercutNm }), s.depthNm && s.undercutNm >= 5 ? 'bad' : s.depthNm ? 'good' : '') + tile('mask', t('fl.pct', { v: s.maskPct }), s.maskPct < 70 ? 'bad' : '') + '</div>';
    const key = !s.frames ? 'ready' : !o.ended ? 'running' : s.undercutNm >= 5 ? (o.chem > 35 ? 'radicals' : 'spread') : s.maskPct < 70 ? 'mask' : 'ok';
    h += '<p class="small ' + (key === 'ok' ? 'good' : o.ended ? 'bad' : '') + '">' + esc(t('fl.etch.msg.' + key)) + '</p>';
    h += '<p class="small muted">' + esc(t('fl.etch.intro')) + '</p>' + slider('fl-ions', 'ions', t('fl.etch.ions'), o.ions, t('fl.pct', { v: o.ions }), ETCH_RANGE.ions, 1) + slider('fl-chem', 'chem', t('fl.etch.chem'), o.chem, t('fl.pct', { v: o.chem }), ETCH_RANGE.chem, 1);
    h += '<div class="chips"><button type="button" class="btn primary" data-fl-go' + (o.ended ? ' disabled' : '') + '>' + esc(t(o.run ? 'fl.pause' : s.frames ? 'fl.resume' : 'fl.etch.go')) + '</button><button type="button" class="chipb" data-fl-fast aria-pressed="' + o.fast + '">' + esc(t('fl.fast')) + '</button>' + (s.frames ? '<button type="button" class="chipb" data-fl-reset>' + esc(t('fl.etch.again')) + '</button>' : '') + '</div>';
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('fl.etch.done')) + '</p>';
    return h + (ok ? '' : hintOf('fl.etch.hint')) + '<p class="small muted">' + esc(t('fl.etch.note', { n: ETCH.perFrame })) + '</p>' + doneNote() + reward();
  }

  /* ================= The bare bottom ================= */
  const D = () => F.dp || (F.dp = { mode: 'cvd', ar: 2, s: null, run: false, fast: false, acc: 0, T: null, seen: [] });
  const dstate = o => o.s || (o.s = depoStart({ mode: o.mode, ar: o.ar }));
  const bottom = FABLINE_CHALLENGES.find(c => c.id === 'bottom');
  const clock = sec => sec < 100 ? t('fl.sec', { v: sec.toFixed(sec < 10 ? 1 : 0) }) : t('fl.min', { v: (sec / 60).toFixed(1) });
  const depoLoop = now => {
    const o = D();
    if (!o.run || !el.isConnected) { o.run = false; return; }
    o.acc += Math.min(0.5, (now - (o.T || now)) / 1000) * DEPO_RATE * (o.fast ? 3 : 1); o.T = now;
    const n = Math.min(40, Math.floor(o.acc));
    if (n > 0) {
      o.acc -= n; let s = dstate(o); for (let i = 0; i < n && !s.done; i++) s = depoStep(s); o.s = s;
      if (s.done) { o.run = false; o.seen.push(s); if (metBy(bottom, o.seen)) win(); }
      draw(); fx();
    }
    if (o.run) requestAnimationFrame(depoLoop);
  };
  /* a change of mode or depth is a new trench: what was deposited is thrown away */
  const dreset = () => { const o = D(); o.run = false; o.s = null; o.acc = 0; };
  function depoSvg(s) {
    const W = 300, H = 250, top0 = 62, d = s.depthNm, w0 = TRENCH.widthNm, sc = Math.min(2.4, (H - top0 - 12) / d), xl = (W - w0 * sc) / 2, xr = xl + w0 * sc, yb = top0 + d * sc, NS = TRENCH.sides;
    const yi = i => top0 + d * i / (NS - 1) * sc, f = n => n.toFixed(1), idx = [...Array(NS).keys()];
    const wall = sgn => 'M' + f(sgn < 0 ? xl : xr) + ' ' + f(top0) + idx.map(i => 'L' + f(sgn < 0 ? xl : xr) + ' ' + f(yi(i))).join('') + idx.slice().reverse().map(i => 'L' + f(sgn < 0 ? xl + s.side[i] * sc : xr - s.side[i] * sc) + ' ' + f(yi(i))).join('') + 'z';
    const tt = s.top * sc;
    const film = s.top > 0 ? '<g class="fl-dfilm"><rect x="0" y="' + f(top0 - tt) + '" width="' + f(s.closed ? W : xl) + '" height="' + f(tt) + '"/>' + (s.closed ? '' : '<rect x="' + f(xr) + '" y="' + f(top0 - tt) + '" width="' + f(W - xr) + '" height="' + f(tt) + '"/>') + '<path d="' + wall(-1) + wall(1) + '"/><rect x="' + f(xl) + '" y="' + f(yb - s.bot * sc) + '" width="' + f(xr - xl) + '" height="' + f(s.bot * sc) + '"/></g>' : '';
    const cav = s.voided ? '<text class="fl-t mid" x="' + (W / 2) + '" y="' + f(Math.min(yb - 8, top0 + 22)) + '" text-anchor="middle">' + esc(t('fl.void')) + '</text>' : '';
    return '<figure class="flfig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('fl.dep.aria', { w: w0, d: d, p: s.coveragePct == null ? 0 : s.coveragePct })) + '">' +
      '<rect class="fl-air" x="0" y="0" width="' + W + '" height="' + H + '"/>' +
      '<path class="fl-sub" d="M0 ' + f(top0) + 'H' + f(xl) + 'V' + f(yb) + 'H' + f(xr) + 'V' + f(top0) + 'H' + W + 'V' + H + 'H0z"/>' + film + cav +
      '<text class="fl-t" x="6" y="14">' + esc(t('fl.gas')) + '</text><text class="fl-t" x="6" y="' + (H - 6) + '">' + esc(t('fl.silicon')) + '</text>' +
      '<path class="fl-dim" d="M' + f(xl) + ' ' + f(top0 - tt - 12) + 'H' + f(xr) + 'M' + f(xl) + ' ' + f(top0 - tt - 15) + 'v6M' + f(xr) + ' ' + f(top0 - tt - 15) + 'v6"/>' +
      '<text class="fl-t mid" x="' + (W / 2) + '" y="' + f(Math.max(11, top0 - tt - 17)) + '" text-anchor="middle">' + esc(t('fl.nm', { v: w0 })) + '</text></svg></figure>';
  }
  function deposit() {
    const o = D(), s = dstate(o), last = m => o.seen.filter(r => r.mode === m).pop();
    const cvdBest = Math.min(...o.seen.filter(r => r.mode === 'cvd').map(r => r.coveragePct), 101), aldBest = Math.max(-1, ...o.seen.filter(r => r.mode === 'ald' && r.ar >= 2).map(r => r.coveragePct));
    const okC = cvdBest < 5, okA = aldBest >= 99, ok = !!S.done[ch.id] || (okC && okA);
    const gs = [{ l: t('fl.dep.g.cvd'), v: cvdBest <= 100 ? t('fl.pct', { v: cvdBest }) : t('fl.none'), target: t('fl.dep.t.cvd', { v: 5 }), ok: okC, f: cvdBest <= 100 ? 5 / Math.max(5, cvdBest) : 0 },
      { l: t('fl.dep.g.ald'), v: aldBest >= 0 ? t('fl.pct', { v: aldBest }) : t('fl.none'), target: t('fl.dep.t.ald', { v: 99 }), ok: okA, f: aldBest >= 0 ? aldBest / 99 : 0 }];
    let h = head() + gauges(gs, ok) + depoSvg(s);
    h += '<div class="flread">' + tile('bottom', s.coveragePct == null ? t('fl.none') : t('fl.pct', { v: s.coveragePct })) + tile('top', t('fl.nm', { v: s.top.toFixed(1) })) + tile('time', clock(s.time)) + tile('status', t('fl.dep.status.' + (s.status === 'cvd' || s.status === 'ald' ? s.status : s.status)), s.status === 'void' ? 'bad' : s.status === 'filled' ? 'good' : '') + '</div>';
    const lc = last('cvd'), la = last('ald');
    const key = !s.top ? 'ready' : !s.done ? 'running' : s.mode === 'cvd' ? (s.coveragePct < 5 ? 'cvd' : 'cvdShallow') : s.ar < 2 ? 'aldShallow' : 'ald';
    h += '<p class="small ' + (s.done && (key === 'cvd' || key === 'ald') ? 'good' : '') + '">' + esc(t('fl.dep.msg.' + key, { p: s.coveragePct, time: clock(s.time) })) + '</p>';
    if (lc && la && lc.ar === la.ar) h += '<p class="small"><b>' + esc(t('fl.dep.cost', { x: Math.round(la.time / lc.time), a: clock(la.time), c: clock(lc.time) })) + '</b></p>';
    h += '<p class="small muted">' + esc(t('fl.dep.intro')) + '</p><div class="chips"><span class="small muted">' + esc(t('fl.dep.mode')) + '</span>' + ['cvd', 'ald'].map(m => '<button type="button" class="chipb' + (o.mode === m ? ' on' : '') + '" data-fl-mode="' + m + '" aria-pressed="' + (o.mode === m) + '">' + esc(t('fl.dep.mode.' + m)) + '</button>').join('') + '</div>';
    h += slider('fl-ar', 'ar', t('fl.dep.ar'), o.ar, t('fl.dep.arV', { d: TRENCH.widthNm * o.ar, v: o.ar }), DEPO_RANGE.ar, 1);
    h += '<div class="chips"><button type="button" class="btn primary" data-fl-go' + (s.done ? ' disabled' : '') + '>' + esc(t(o.run ? 'fl.pause' : s.top ? 'fl.resume' : 'fl.dep.go')) + '</button><button type="button" class="chipb" data-fl-fast aria-pressed="' + o.fast + '">' + esc(t('fl.fast')) + '</button>' + (s.top ? '<button type="button" class="chipb" data-fl-reset>' + esc(t('fl.dep.again')) + '</button>' : '') + '</div>';
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('fl.dep.done')) + '</p>';
    return h + (ok ? '' : hintOf('fl.dep.hint')) + '<p class="small muted">' + esc(t('fl.dep.note', { n: TRENCH.topNm })) + '</p>' + doneNote() + reward();
  }

  const isEtch = ch.id === 'etch';
  return {
    draw: isEtch ? etch : deposit,
    click(e) {
      const q = s => e.target.closest(s);
      const o = isEtch ? E() : D();
      if (q('[data-fl-go]')) {
        if (isEtch ? o.s.done : dstate(o).done) return true;
        o.run = !o.run; o.T = null; draw(); if (o.run) requestAnimationFrame(isEtch ? etchLoop : depoLoop); return true;
      }
      if (q('[data-fl-fast]')) { o.fast = !o.fast; draw(); return true; }
      if (q('[data-fl-reset]')) { o.run = false; o.acc = 0; if (isEtch) { o.s = etchStart(1); o.ended = false; } else o.s = null; draw(); return true; }
      const m = q('[data-fl-mode]'); if (m && !isEtch) { o.mode = m.dataset.flMode; dreset(); draw(); return true; }
      return false;
    },
    input(e) {
      const r = e.target.closest('[data-fl]'); if (!r) return false;
      const o = isEtch ? E() : D(); o[r.dataset.fl] = +r.value;
      if (!isEtch) dreset();                                   /* the dials of the etch can be turned while it runs; a new trench is a new deposit */
      draw(); return true;
    }
  };
}
