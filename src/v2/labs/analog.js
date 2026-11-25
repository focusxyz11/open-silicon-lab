/* Chips that touch the real world (kinds 'capture' and 'regulate'), from src/engines/analog.js.
   capture: a signal from the world goes through an amplifier and a converter and leaves as bits. Two challenges:
   'sig-heart' (a clean heartbeat inside a power budget, at the phone's board) and 'sig-bearing' (the slowest sampling
   rate that still hears a failing bearing, at the car's control unit).
   regulate: the power chip. One challenge, 'reg-jobs': four loads, and the regulator that suits each.
   Labs of the challenge player (src/v2/play.js): lab(L) returns { draw, click, input }. What the player has tried is
   kept in the view; the engine's own CHALLENGES decide the win. */
import { still } from '../../core/ui.js';
import * as A from '../../engines/analog.js';

const ENGINE = { 'sig-heart': 'heart', 'sig-bearing': 'bearing', 'reg-jobs': 'regulators' };
const SIGNAL = { 'sig-heart': 'heartbeat', 'sig-bearing': 'vibration' };
const START = { 'sig-heart': { gain: 100, bits: 12, rate: 1000 }, 'sig-bearing': { gain: 5, bits: 10, rate: 1000 } };
const WIN = { heartbeat: 0.8, vibration: 0.02 }, ESPANS = { heartbeat: 0.05, vibration: 0.2 };                          // the stretch of the signal the picture shows, seconds
const X0 = 40, X1 = 294, Y0 = 12, Y1 = 118, E0 = 134, E1 = 162;   // the wave's plot, the error strip, and its span
const SWEEP = 5000;                                                        // one pass of the reading dot, milliseconds
const f1 = v => (+v).toFixed(1);

function capture(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const kind = SIGNAL[ch.id], SIG = A.SIGNALS[kind], heart = ch.id === 'sig-heart', ESPAN = ESPANS[kind], mission = A.MISSIONS.find(m => m.signal === kind);
  const set = () => view.ana || (view.ana = (s => ({ gi: A.GAINS.indexOf(s.gain), bi: A.BITS.indexOf(s.bits), ri: A.RATES.indexOf(s.rate) }))(START[ch.id]));
  const settings = (o = set()) => ({ gain: A.GAINS[o.gi], bits: A.BITS[o.bi], rate: A.RATES[o.ri] });
  const seen = () => view.anaSeen || (view.anaSeen = {});                 // bearing: at each rate tried, was the tone folded away?
  const below = () => { const o = set(); return o.ri > 0 ? A.RATES[o.ri - 1] : null; };
  const proven = () => A.CHALLENGES.bearing.check(settings()) && seen()[below()] === true;
  const metNow = () => heart ? A.CHALLENGES.heart.check(settings()) : proven();
  let cur = null, running = false; const me = {};                                         // the capture on screen, for the reading dot

  const num = v => v >= 100 ? Math.round(v).toLocaleString() : v >= 10 ? f1(v) : v >= 1 ? v.toFixed(v % 1 ? 1 : 0) : String(+v.toPrecision(2));
  const watts = w => { const u = w * 1e6; return u >= 1000 ? t('ana.mw', { v: num(u / 1000) }) : t('ana.uw', { v: u >= 10 ? Math.round(u) : u >= 1 ? f1(u) : u >= 0.1 ? u.toFixed(2) : +u.toPrecision(1) }); };
  const pct = e => t('ana.pct', { v: e >= 0.1 ? Math.round(e * 100) : (e * 100).toFixed(1) });

  /* where the reading dot is now: the real signal and the copy at the same moment, and the gap between them */
  function scan(now) {
    const c = cur, u = (now % SWEEP) / SWEEP, tt = c.T * u, x = X0 + (X1 - X0) * u;
    return { x, a: c.py(SIG.f(tt)), b: c.py(c.res.back(Math.min(tt, c.last))) };
  }
  function loop(now) {
    const g = el.isConnected && el.querySelector('.anascan');
    if (!g || !cur || el.__ana !== me) { running = false; return; }
    const p = scan(now), q = s => g.querySelector(s);
    q('.sl').setAttribute('x1', p.x.toFixed(1)); q('.sl').setAttribute('x2', p.x.toFixed(1));
    q('.gap').setAttribute('x1', p.x.toFixed(1)); q('.gap').setAttribute('x2', p.x.toFixed(1)); q('.gap').setAttribute('y1', p.a.toFixed(1)); q('.gap').setAttribute('y2', p.b.toFixed(1));
    q('.dr').setAttribute('cx', p.x.toFixed(1)); q('.dr').setAttribute('cy', p.a.toFixed(1));
    q('.dc').setAttribute('cx', p.x.toFixed(1)); q('.dc').setAttribute('cy', p.b.toFixed(1));
    requestAnimationFrame(loop);
  }
  const start = () => { if (running || still() || typeof requestAnimationFrame !== 'function') return; running = true; el.__ana = me; setTimeout(() => requestAnimationFrame(loop), 60); };

  /* the picture: the real signal, the samples on the converter's levels, the copy rebuilt from them, and the gap */
  function figure(res) {
    const T = WIN[kind], N = 260, ts = Array.from({ length: N + 1 }, (_, i) => T * i / N), real = ts.map(SIG.f);
    const lo0 = Math.min(...real), hi0 = Math.max(...real), span = hi0 - lo0, pad = span * 0.16;
    const last = res.samples[res.samples.length - 1].t, back = ts.map(x => res.back(Math.min(x, last)));
    /* the picture frames the real signal, and widens (up to a point) when the copy lands far from it */
    const lo = Math.max(lo0 - 2.5 * span, Math.min(lo0, ...back)) - pad, hi = Math.min(hi0 + 2.5 * span, Math.max(hi0, ...back)) + pad;
    const px = x => X0 + (X1 - X0) * x / T, py = v => Y1 - (Y1 - Y0) * (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo);
    const pts = (ys, f = py) => ts.map((x, i) => px(x).toFixed(1) + ',' + f(ys[i]).toFixed(1)).join(' ');
    cur = { res, T, py, last };
    const step = A.CONST.range / 2 ** res.bits / res.gain, half = A.CONST.range / 2 / res.gain;
    let s = '<svg viewBox="0 0 300 182" role="img" aria-label="' + esc(t('ana.aria', { e: pct(res.err), p: watts(res.power.total) })) + '">';
    /* the converter's levels, where they are few enough to tell apart: a sample can only land on one of them */
    const first = Math.ceil((lo + half) / step - 0.5), n = Math.floor((hi + half) / step - 0.5) - first + 1;
    if (n > 0 && n <= 34) for (let k = first; k < first + n; k++) { const y = py((k + 0.5) * step - half); s += '<line class="lv" x1="' + X0 + '" x2="' + X1 + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; }
    for (const e of [half, -half]) if (e > lo && e < hi) s += '<line class="edge" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(e).toFixed(1) + '" y2="' + py(e).toFixed(1) + '"/>';
    s += '<rect class="box" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '"/>';
    s += '<polyline class="real" points="' + pts(real) + '"/><polyline class="copy' + (res.aliased || res.clip ? ' off' : '') + (res.rate * T > 200 ? ' dense' : '') + '" points="' + pts(back) + '"/>';
    const inWin = res.rate * T <= 95 ? res.samples.filter(p => p.t <= T) : null;
    if (inWin) s += inWin.map(p => '<circle class="smp" cx="' + px(p.t).toFixed(1) + '" cy="' + py(p.v / res.gain).toFixed(1) + '" r="' + (inWin.length > 45 ? 1.4 : 2.1) + '"/>').join('');
    /* the gap between the copy and the real signal, as a share of the signal's height */
    const mid = (E0 + E1) / 2, ey = d => mid - (E1 - E0) / 2 * Math.max(-1, Math.min(1, d / span / ESPAN));
    s += '<rect class="box" x="' + X0 + '" y="' + E0 + '" width="' + (X1 - X0) + '" height="' + (E1 - E0) + '"/>';
    if (heart) { const b = (E1 - E0) / 2 * mission.maxErr / ESPAN; s += '<rect class="band" x="' + X0 + '" y="' + (mid - b).toFixed(1) + '" width="' + (X1 - X0) + '" height="' + (2 * b).toFixed(1) + '"/>'; }
    s += '<line class="zero" x1="' + X0 + '" x2="' + X1 + '" y1="' + mid + '" y2="' + mid + '"/><polyline class="err" points="' + ts.map((x, i) => px(x).toFixed(1) + ',' + ey(back[i] - real[i]).toFixed(1)).join(' ') + '"/>';
    const p = scan(still() || typeof performance === 'undefined' ? SWEEP * 0.62 : performance.now());
    s += '<g class="anascan"><line class="sl" x1="' + p.x.toFixed(1) + '" x2="' + p.x.toFixed(1) + '" y1="' + Y0 + '" y2="' + E1 + '"/><line class="gap" x1="' + p.x.toFixed(1) + '" x2="' + p.x.toFixed(1) + '" y1="' + p.a.toFixed(1) + '" y2="' + p.b.toFixed(1) + '"/>' +
      '<circle class="dr" cx="' + p.x.toFixed(1) + '" cy="' + p.a.toFixed(1) + '" r="3"/><circle class="dc" cx="' + p.x.toFixed(1) + '" cy="' + p.b.toFixed(1) + '" r="3"/></g>';
    const unit = v => { const u = Math.abs(v) * SIG.scale; return t('ana.u.' + kind, { v: u >= 10 ? Math.round(u) : +u.toFixed(1) }); };
    s += '<text class="ax" x="' + (X0 - 4) + '" y="' + (py(hi0) + 3.5).toFixed(1) + '" text-anchor="end">' + esc(unit(hi0)) + '</text><text class="ax" x="' + (X0 - 4) + '" y="' + (py(0) + 3.5).toFixed(1) + '" text-anchor="end">0</text>' +
      '<text class="ax" x="' + (X0 - 4) + '" y="' + (mid + 3.5) + '" text-anchor="end">' + esc(t('ana.gap')) + '</text>' +
      '<text class="ax" x="' + X0 + '" y="' + (E1 + 14) + '">0</text><text class="ax" x="' + X1 + '" y="' + (E1 + 14) + '" text-anchor="end">' + esc(t('ana.x.' + kind)) + '</text></svg>';
    start();
    return '<figure class="anafig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('ana.legend', { v: Math.round(ESPAN * 100) })) + '</figcaption></figure>';
  }
  /* the bearing's tones on a line of frequencies: what lies past half the sampling rate cannot be told apart, and
     shows up folded back as a slower tone that is not there */
  function tones(res) {
    const F = 2000, x = f => X0 + (X1 - X0) * Math.min(F, f) / F, lim = res.rate / 2, fault = SIG.fault, ghost = Math.abs(fault - res.rate * Math.round(fault / res.rate));
    let s = '<svg viewBox="0 0 300 74" role="img" aria-label="' + esc(t(res.aliased ? 'ana.tone.lost' : 'ana.tone.kept')) + '">';
    if (lim < F) s += '<rect class="dark" x="' + x(lim).toFixed(1) + '" y="8" width="' + (X1 - x(lim)).toFixed(1) + '" height="42"/>';
    s += '<line class="zero" x1="' + X0 + '" x2="' + X1 + '" y1="50" y2="50"/>';
    for (const [f, h] of [[50, 38], [100, 16]]) s += '<line class="hum" x1="' + x(f).toFixed(1) + '" x2="' + x(f).toFixed(1) + '" y1="50" y2="' + (50 - h) + '"/>';
    s += '<line class="tone' + (res.aliased ? ' lost' : '') + '" x1="' + x(fault).toFixed(1) + '" x2="' + x(fault).toFixed(1) + '" y1="50" y2="30"/>';
    if (res.aliased) s += '<line class="ghost" x1="' + x(ghost).toFixed(1) + '" x2="' + x(ghost).toFixed(1) + '" y1="50" y2="30"/><path class="fold" d="M' + x(fault).toFixed(1) + ' 27 Q' + ((x(fault) + x(ghost)) / 2).toFixed(1) + ' 13 ' + x(ghost).toFixed(1) + ' 27"/>';
    if (lim <= F) s += '<line class="limit" x1="' + x(lim).toFixed(1) + '" x2="' + x(lim).toFixed(1) + '" y1="3" y2="54"/>';
    const lx = Math.min(F, lim), flip = x(lx) > X1 - 90;
    s += '<text class="lt" x="' + (x(lx) + (flip ? -5 : 5)).toFixed(1) + '" y="12" text-anchor="' + (flip ? 'end' : 'start') + '">' + esc(t(lim > F ? 'ana.tone.far' : 'ana.tone.limit', { v: num(lim) })) + '</text>';
    s += '<text class="ax" x="' + X0 + '" y="66">0</text><text class="ax" x="' + x(fault).toFixed(1) + '" y="66" text-anchor="middle">' + esc(t('ana.hz', { v: num(fault) })) + '</text><text class="ax" x="' + X1 + '" y="66" text-anchor="end">' + esc(t('ana.hz', { v: num(F) })) + '</text></svg>';
    return '<figure class="anafig anatones">' + s + '<figcaption class="small muted">' + esc(t(res.aliased ? 'ana.tone.ghost' : 'ana.tone.ok', { v: num(ghost) })) + '</figcaption></figure>';
  }
  /* where the power goes: the three parts of the chain as one bar, against the budget where there is one */
  function power(res) {
    const P = res.power, max = heart ? Math.max(P.total, mission.maxPower * 1.25) : P.total, w = v => (v / max * 100).toFixed(1);
    return '<div class="anapow"><div class="anabar"><div class="anafill">' + ['amp', 'adc', 'radio'].map(k => '<span class="' + k + '" style="width:' + w(P[k]) + '%"></span>').join('') + '</div>' +
      (heart ? '<i class="budget" style="left:' + w(mission.maxPower) + '%"></i>' : '') + '</div><div class="anakey small">' +
      ['amp', 'adc', 'radio'].map(k => '<span><i class="' + k + '"></i>' + esc(t('ana.chain.' + k)) + ' <b class="mono">' + esc(watts(P[k])) + '</b></span>').join('') + '</div></div>';
  }
  function goalbox(res, j) {
    const ok = metNow(); let gs;
    if (heart) gs = [{ k: 'copy', ok: j.quality, v: res.clip ? t('ana.clipped') : pct(res.err), target: t('ana.t.copy', { v: mission.maxErr * 100 }), f: res.clip ? 0.1 : Math.min(1, mission.maxErr / res.err) },
      { k: 'true', ok: j.alias, v: t(j.alias ? 'ana.v.true' : 'ana.v.false'), target: '', f: j.alias ? 1 : 0.15 },
      { k: 'power', ok: j.power, v: watts(res.power.total), target: t('ana.t.power', { v: watts(mission.maxPower) }), f: Math.min(1, mission.maxPower / res.power.total) }];
    else { const lost = Object.values(seen()).includes(true);
      gs = [{ k: 'lost', ok: lost, v: t(lost ? 'ana.v.seen' : 'ana.v.notyet'), target: '', f: lost ? 1 : 0 },
        { k: 'kept', ok: !res.aliased, v: t(res.aliased ? 'ana.v.folded' : 'ana.v.kept'), target: '', f: res.aliased ? 0.15 : 1 },
        { k: 'slowest', ok, v: t('ana.v.rate', { v: num(res.rate) }), target: '', f: ok ? 1 : res.aliased ? 0 : 0.5 }]; }
    return '<div class="goalbox anagoal' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('ana.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  const dial = (id, label, value, n) => '<div class="anadial"><label class="lab" for="ana-' + id + '"><b>' + esc(label) + '</b> <output>' + esc(value) + '</output></label><div class="anastep"><button type="button" class="chipb" data-ana-nudge="' + id + ':-1" aria-label="' + esc(t('ana.less')) + '">−</button><input type="range" id="ana-' + id + '" data-ana="' + id + '" min="0" max="' + (n - 1) + '" step="1" value="' + set()[id[0] + 'i'] + '"><button type="button" class="chipb" data-ana-nudge="' + id + ':1" aria-label="' + esc(t('ana.more')) + '">+</button></div></div>';

  /* what just happened, in the engine's own order: false waves first, then cut-off peaks, then the copy, then the power */
  function said(res, j, st) {
    if (heart) return t('ana.hint.' + A.hintOf(mission, res, j, st));
    if (res.aliased) return t('ana.hint.alias');
    if (res.clip) return t('ana.hint.clip');
    return t(proven() ? 'ana.b.won' : A.CHALLENGES.bearing.check(st) ? 'ana.b.edge' : 'ana.b.slower');
  }
  function bench() {
    const st = settings(), res = A.capture(kind, st), j = A.judge(mission, res), ok = metNow();
    if (!heart) seen()[st.rate] = res.aliased;
    let h = head() + '<p class="small anaintro">' + esc(t('ana.intro.' + ch.id, { f: (SIG.fault || 0).toLocaleString() })) + '</p>' + goalbox(res, j) + figure(res) + (heart ? '' : tones(res)) + power(res);
    h += dial('gain', t('ana.set.gain'), t('ana.v.gain', { v: st.gain.toLocaleString() }), A.GAINS.length) +
      dial('bits', t('ana.set.bits'), t('ana.v.bits', { v: st.bits, n: (2 ** st.bits).toLocaleString() }), A.BITS.length) +
      dial('rate', t('ana.set.rate'), t('ana.v.rate', { v: num(st.rate) }), A.RATES.length);
    h += '<p class="small anasaid' + (ok ? ' good' : '') + '">' + esc(said(res, j, st)) + '</p>';
    if (!ok) h += view.hint ? '<p class="small hint">' + esc(t('ana.nudge.' + ch.id)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + esc(t('ana.done.' + ch.id)) + '</p>';
    return h + '<p class="small muted">' + esc(t('ana.note')) + '</p>' + doneNote() + reward();
  }
  const after = () => { const st = settings(); if (!heart) seen()[st.rate] = A.capture(kind, st).aliased; if (metNow()) win(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const n = e.target.closest('[data-ana-nudge]'); if (!n) return false;
      const [id, d] = n.dataset.anaNudge.split(':'), k = id[0] + 'i', inp = el.querySelector('#ana-' + id); set()[k] = Math.min(+inp.max, Math.max(0, set()[k] + +d)); return after(); },
    input(e) { const r = e.target.closest('[data-ana]'); if (!r) return false; set()[r.dataset.ana[0] + 'i'] = +r.value; return after(); }
  };
}

/* ---- the power chip ---- */
const RX0 = 44, RX1 = 294, JUMP = 104, PERIOD = 12;                        // the scope, where the load jumps, one ripple
function regulate(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.reg || (view.reg = { job: A.JOBS[0].id, pick: {}, tried: {} });
  const jobOf = id => A.JOBS.find(j => j.id === id);
  const triedOf = id => st().tried[id] || (st().tried[id] = {});
  const compared = id => Object.keys(triedOf(id)).length >= 2;
  const rightFor = id => compared(id) && A.bestReg(jobOf(id)).type === st().pick[id];
  const metNow = () => A.CHALLENGES.regulators.check(st().pick) && A.JOBS.every(j => compared(j.id));
  const sig = v => +v.toPrecision(2);
  const amps = i => i >= 1 ? t('ana.a', { v: sig(i) }) : i >= 1e-3 ? t('ana.ma', { v: sig(i * 1e3) }) : t('ana.ua', { v: sig(i * 1e6) });
  const heat = w => w >= 1 ? t('ana.w', { v: f1(w) }) : w >= 1e-3 ? t('ana.mw', { v: sig(w * 1e3) }) : t('ana.uw', { v: sig(w * 1e6) });
  const mv = v => t('ana.mv', { v: sig(v * 1e3) });
  const hot = (job, r) => job.maxHeat && r.heat > job.maxHeat ? 'hot' : r.eff < 0.6 ? 'warm' : 'cool';

  /* the picture: battery, regulator, chip; under it the load jumping and the output holding, rippling or sagging */
  function figure(job, type, r) {
    const big = Math.max(...job.loads.map(l => l[0])), burst = job.loads.length > 1, tone = hot(job, r);
    let s = '<svg viewBox="0 0 300 190" role="img" aria-label="' + esc(t('ana.reg.aria', { e: Math.round(r.eff * 100), h: heat(r.heat) })) + '">';
    /* the chain */
    const blk = (x, w, cls, label) => '<rect class="blk ' + cls + '" x="' + x + '" y="10" width="' + w + '" height="30" rx="5"/><text class="bt" x="' + (x + w / 2) + '" y="29" text-anchor="middle">' + esc(label) + '</text>';
    const coil = x => '<path class="coil" d="M' + x + ' 25 q4 -11 8 0 q4 -11 8 0 q4 -11 8 0"/>';
    s += '<line class="wire" x1="60" x2="240" y1="25" y2="25"/>' + blk(8, 54, 'bat', t('ana.v', { v: job.vin })) + blk(240, 54, 'load', t('ana.v', { v: job.vout }));
    if (type === 'ldo') s += blk(122, 56, tone, t('ana.reg.s.ldo'));
    else if (type === 'buck') s += blk(96, 56, tone, t('ana.reg.s.buck')) + '<rect class="gapw" x="164" y="14" width="28" height="22"/>' + coil(166);
    else s += blk(72, 50, tone, t('ana.reg.s.buck')) + '<rect class="gapw" x="128" y="14" width="28" height="22"/>' + coil(130) + blk(170, 44, 'cool', t('ana.reg.s.ldo'));
    if (tone !== 'cool') { const hx = type === 'ldo' ? 150 : type === 'buck' ? 124 : 97; s += [-12, 0, 12].map(d => '<path class="heat ' + tone + '" d="M' + (hx + d) + ' 8 q-3 -3 0 -6"/>').join(''); }
    s += '<text class="ax" x="35" y="52" text-anchor="middle">' + esc(t('ana.reg.bat')) + '</text><text class="ax" x="267" y="52" text-anchor="middle">' + esc(t('ana.reg.load')) + '</text>';
    /* the load: asleep or off, then on */
    const ly0 = 92, ly1 = 70, low = burst ? ly0 - 3 : ly0;
    s += '<text class="ax" x="' + (RX0 - 5) + '" y="84" text-anchor="end">' + esc(t('ana.reg.i')) + '</text><line class="zero" x1="' + RX0 + '" x2="' + RX1 + '" y1="' + ly0 + '" y2="' + ly0 + '"/>';
    s += '<polyline class="loadl" points="' + (burst ? [[RX0, low], [JUMP, low], [JUMP, ly1], [JUMP + 14, ly1], [JUMP + 14, low], [220, low], [220, ly1], [234, ly1], [234, low], [RX1, low]] : [[RX0, ly0], [JUMP, ly0], [JUMP, ly1], [RX1, ly1]]).map(p => p.join(',')).join(' ') + '"/>';
    s += '<text class="lt" x="' + (JUMP + (burst ? 18 : 6)) + '" y="' + (ly1 + (burst ? 8 : -4)) + '">' + esc(amps(big)) + '</text>';
    /* the output: the band it must stay in, and what the regulator leaves on it */
    const cy = 140, band = 13, amp = Math.max(0, Math.min(22, r.ripple / job.rippleMax * band)), bad = r.ripple > job.rippleMax, sag = !r.ok;
    s += '<text class="ax" x="' + (RX0 - 5) + '" y="' + (cy + 3.5) + '" text-anchor="end">' + esc(t('ana.reg.out')) + '</text><rect class="band" x="' + RX0 + '" y="' + (cy - band) + '" width="' + (RX1 - RX0) + '" height="' + 2 * band + '"/>' +
      '<line class="zero" x1="' + RX0 + '" x2="' + RX1 + '" y1="' + cy + '" y2="' + cy + '"/><text class="ax" x="' + RX1 + '" y="' + (cy - 27) + '" text-anchor="end">' + esc(t('ana.reg.band', { v: mv(job.rippleMax) })) + '</text>';
    if (sag) s += '<polyline class="outl bad" points="' + [[RX0, cy], [JUMP, cy], [JUMP + 18, cy + 30], [RX1, cy + 32]].map(p => p.join(',')).join(' ') + '"/>';
    else { let pts = ''; for (let x = RX0 - PERIOD; x <= RX1 + PERIOD; x += PERIOD) pts += x + ',' + (cy + amp).toFixed(1) + ' ' + (x + PERIOD * 0.75).toFixed(1) + ',' + (cy - amp).toFixed(1) + ' ';
      s += '<clipPath id="anaclip"><rect x="' + RX0 + '" y="' + (cy - 34) + '" width="' + (RX1 - RX0) + '" height="68"/></clipPath><g clip-path="url(#anaclip)"><polyline class="outl' + (bad ? ' bad' : '') + (amp > 0.6 ? ' run' : '') + '" points="' + pts.trim() + '"/></g>'; }
    s += '<line class="jump" x1="' + JUMP + '" x2="' + JUMP + '" y1="62" y2="176"/><text class="ax" x="' + (JUMP + 4) + '" y="184">' + esc(t('ana.reg.jump')) + '</text></svg>';
    return '<figure class="anafig anareg" data-f2="instrument">' + s + '</figure>';
  }
  function goalbox() {
    const ok = metNow();
    return '<div class="goalbox anagoal' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p><div class="anajobs">' + A.JOBS.map(j => { const p = st().pick[j.id], good = rightFor(j.id);
      return '<div class="gauge' + (good ? ' ok' : '') + '"><span class="gl">' + esc(t('ana.job.' + j.id)) + '</span><span class="gv">' + esc(p ? t('ana.reg.s.' + p) : t('ana.reg.none')) + '</span><span class="gbar"><span style="width:' + (good ? 100 : p ? 45 : 0) + '%"></span></span></div>'; }).join('') + '</div></div>';
  }
  function bench() {
    const o = st(), job = jobOf(o.job), type = o.pick[job.id] || null, r = type ? A.runJob(job, type) : null, ok = metNow();
    let h = head() + '<p class="small anaintro">' + esc(t('ana.intro.reg-jobs')) + '</p>' + goalbox();
    h += '<div class="chips anatabs" role="group" aria-label="' + esc(t('ana.reg.jobs')) + '">' + A.JOBS.map(j => '<button type="button" class="chipb' + (j.id === job.id ? ' on' : '') + '" data-reg-job="' + j.id + '" aria-pressed="' + (j.id === job.id) + '">' + esc(t('ana.job.' + j.id)) + '</button>').join('') + '</div>';
    const [a, b] = job.loads;
    h += '<p class="small anajob"><b>' + esc(t('ana.job.' + job.id + '.why')) + '</b> ' + esc(t('ana.reg.need', { vin: job.vin, vout: job.vout })) + ' ' +
      esc(b ? t('ana.reg.draw2', { a: amps(a[0]), pa: Math.round(a[1] * 100), b: amps(b[0]) }) : t('ana.reg.draw', { a: amps(a[0]) })) + ' ' + esc(t('ana.reg.tol', { v: mv(job.rippleMax) })) + (job.maxHeat ? ' ' + esc(t('ana.reg.cool', { v: heat(job.maxHeat) })) : '') + '</p>';
    if (r) h += figure(job, type, r);
    h += '<div class="anatypes" role="group" aria-label="' + esc(t('ana.reg.types')) + '">' + A.TYPES.map(ty => { const x = triedOf(job.id)[ty] ? A.runJob(job, ty) : null;
      return '<button type="button" class="anarow' + (ty === type ? ' on' : '') + '" data-reg-type="' + ty + '" aria-pressed="' + (ty === type) + '"><span class="anan"><b>' + esc(t('ana.reg.' + ty)) + '</b><span class="small muted">' + esc(t('ana.reg.' + ty + '.d', { n: A.PARTS[ty] })) + '</span></span>' +
        '<span class="anaeff"><span class="' + (x && x.pass ? 'pass' : 'fail') + '" style="width:' + (x ? Math.round(x.eff * 100) : 0) + '%"></span></span><span class="anav mono">' + esc(x ? t('ana.pct', { v: Math.round(x.eff * 100) }) : t('ana.reg.untried')) + '</span></button>'; }).join('') + '</div>';
    if (r) {
      const cells = [['eff', t('ana.pct', { v: Math.round(r.eff * 100) }), ''], ['heat', heat(r.heat), hot(job, r) === 'hot' ? 'fail' : ''], ['ripple', mv(r.ripple), r.ripple > job.rippleMax ? 'fail' : ''], ['parts', String(A.PARTS[type]), '']];
      if (r.hours) cells.push(['hours', t('ana.reg.days', { v: Math.round(r.hours / 24) }), '']);
      h += '<div class="anaread">' + cells.map(([k, v, c]) => '<span><span class="small muted">' + esc(t('ana.reg.r.' + k)) + '</span><b class="mono ' + c + '">' + esc(v) + '</b></span>').join('') + '</div>';
      h += '<div class="anaflow" role="img" aria-label="' + esc(t('ana.reg.flow', { e: Math.round(r.eff * 100), h: 100 - Math.round(r.eff * 100) })) + '"><span class="to" style="width:' + (r.eff * 100).toFixed(1) + '%"></span><span class="lost"></span></div><p class="small muted anaflowt">' + esc(t('ana.reg.flow', { e: Math.round(r.eff * 100), h: 100 - Math.round(r.eff * 100) })) + '</p>';
      const id = A.hintOfReg(job, type, r);
      h += '<p class="small anasaid' + (rightFor(job.id) ? ' good' : '') + '">' + esc(/^best-/.test(id) && !compared(job.id) ? t('ana.rh.first') : t('ana.rh.' + id)) + '</p>';
    } else h += '<p class="small anasaid">' + esc(t('ana.reg.start')) + '</p>';
    if (!ok) h += view.hint ? '<p class="small hint">' + esc(t('ana.nudge.reg-jobs')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + esc(t('ana.done.reg-jobs')) + '</p>';
    return h + '<p class="small muted">' + esc(t('ana.reg.note')) + '</p>' + doneNote() + reward();
  }
  const after = () => { if (metNow()) win(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = st();
      const j = q('[data-reg-job]'); if (j) { o.job = j.dataset.regJob; return after(); }
      const ty = q('[data-reg-type]'); if (ty) { o.pick[o.job] = ty.dataset.regType; triedOf(o.job)[ty.dataset.regType] = true; return after(); }
      return false; },
    input() { return false; }
  };
}

export default function lab(L) { return ENGINE[L.ch.id] === 'regulators' ? regulate(L) : capture(L); }
