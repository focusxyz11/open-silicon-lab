/* Quantum search with noise (kind 'grover', at the atom, where a single quantum state is the thing computed with),
   from src/engines/grover.js. Eight boxes, one prize: every box has an amplitude, a bar whose height squared is the
   chance of finding that box. A step turns the prize's bar upside down and mirrors every bar about the average; noise
   wipes the state back toward a guess. The player steps, sets how clean a step is, and looks. The goal is the engine's
   own check (checkSearchStep): the chance seen at its peak, and then lower after one step more.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as G from '../../engines/grover.js';

export const N = 8, MAX = 6, START = { k: 0, ln: -1.3, seed: 11 };
const RANGE = [-4, -0.5, 0.1], DUR = 900, PEAK = 0.94, FALL = 0.34;   // the bounds the engine's check asks for, to say them
export const noiseOf = ln => Math.pow(10, ln);
export const prizeOf = seed => Math.floor(G.seeded(seed * 7919)() * N);
/* the bars after k steps, and the chance of the prize */
export const amps = (k, e, prize) => G.noisyAmps(G.run(N, k, prize), k, e);
export const chanceAt = (k, e) => G.noisy(G.chance(N, k), N, k, e);
/* what the player has seen ({k, p}, in order), as the engine's check reads it: the first peak, and what was seen
   after it with more steps taken. The engine decides what a peak is and what a fall is. */
export function reading(seen) {
  const i = seen.findIndex(s => G.checkSearchStep({ N, seen: [s.p, 0] }));
  const best = seen.reduce((m, s) => Math.max(m, s.p), 0);
  if (i < 0) return { best, peak: false, after: null, fell: false, list: [] };
  const later = seen.slice(i + 1).filter(s => s.k > seen[i].k).map(s => s.p), after = later.length ? Math.min(...later) : null;
  const list = [seen[i].p].concat(later);
  return { best, peak: true, after, fell: after != null && G.checkSearchStep({ N, seen: [1, after] }), list };
}
export const met = seen => G.checkSearchStep({ N, seen: reading(seen).list });

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.gv || (view.gv = Object.assign({ prize: prizeOf(START.seed), looks: null, last: null, t0: 0, from: null }, START));
  const seen = () => view.gvSeen || (view.gvSeen = []);
  const pct = v => t('grv.pct', { v: v > 0.995 && v < 1 ? (v * 100).toFixed(1) : Math.round(v * 100) });
  const noiseText = e => t('grv.v.noise', { n: Math.round(1 / e).toLocaleString('en') });
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* what the player has seen is kept (the steps taken and the chance shown); the engine's check decides */
  function see() { const o = set(), s = seen(); s.push({ k: o.k, p: chanceAt(o.k, noiseOf(o.ln)) }); if (s.length > 400) s.shift(); if (met(s)) win(); }
  /* a step in two beats: the prize's bar turns over, then every bar is mirrored about the average */
  const loop = now => { const o = set(); if (!o.t0 || !el.isConnected) { o.t0 = 0; return; } if (now - o.t0 >= DUR) o.t0 = 0; draw(); if (o.t0) requestAnimationFrame(loop); };
  const ease = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2), mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
  function shown(o) {
    const to = amps(o.k, noiseOf(o.ln), o.prize); if (!o.t0 || !o.from) return to;
    const u = Math.min(1, (performance.now() - o.t0) / DUR), mid = G.flip(o.from, o.prize);
    return u < 0.5 ? mix(o.from, mid, ease(u * 2)) : mix(mid, to, ease(u * 2 - 1));
  }

  function figure(o, a) {
    const W = 300, H = 180, Y = 84, K = 54, cx = i => 24 + i * 31, f = v => v.toFixed(1), my = Y - G.mean(a) * K, p = a[o.prize] * a[o.prize];
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" data-grv-k="' + o.k + '" aria-label="' + esc(t('grv.aria', { k: o.k, p: pct(chanceAt(o.k, noiseOf(o.ln))) })) + '">';
    s += '<line class="base" x1="8" x2="256" y1="' + Y + '" y2="' + Y + '"/>';
    a.forEach((v, i) => { const h = Math.abs(v) * K; s += '<rect class="b' + (i === o.prize ? ' pz' : '') + (v < 0 ? ' dn' : '') + '" x="' + (cx(i) - 10) + '" y="' + f(v >= 0 ? Y - h : Y) + '" width="20" height="' + f(Math.max(0.5, h)) + '" rx="2"/>'; });
    s += '<line class="avg" x1="8" x2="292" y1="' + f(my) + '" y2="' + f(my) + '"/><text class="ax avt" x="292" y="' + f(my - 4) + '" text-anchor="end">' + esc(t('grv.avg')) + '</text>';
    s += '<text class="pv" x="' + cx(o.prize) + '" y="' + f(a[o.prize] >= 0 ? Math.max(11, Y - Math.abs(a[o.prize]) * K - 5) : Y + Math.abs(a[o.prize]) * K + 13) + '" text-anchor="middle">' + esc(pct(p)) + '</text>';
    /* the boxes: the prize, the box the last look opened, and how often each was found */
    const top = o.looks ? Math.max(1, ...o.looks) : 1;
    for (let i = 0; i < N; i++) { const x = cx(i);
      s += '<rect class="bx' + (i === o.prize ? ' pz' : '') + (o.last === i ? ' open' : '') + '" x="' + (x - 9) + '" y="144" width="18" height="18" rx="4"/>';
      if (i === o.prize) { let d = ''; for (let j = 0; j < 10; j++) { const r = j % 2 ? 2.6 : 6, an = -Math.PI / 2 + j * Math.PI / 5; d += (j ? 'L' : 'M') + f(x + Math.cos(an) * r) + ' ' + f(153 + Math.sin(an) * r); } s += '<path class="star" d="' + d + 'Z"/>'; }
      if (o.looks && o.looks[i]) s += '<rect class="hit' + (i === o.prize ? ' pz' : '') + '" x="' + (x - 9) + '" y="166" width="' + f(18 * o.looks[i] / top) + '" height="3" rx="1.5"/><text class="ax mono" x="' + x + '" y="179" text-anchor="middle">' + o.looks[i] + '</text>'; }
    return '<figure class="grvfig" data-f2="instrument">' + s + '</svg><figcaption class="small muted">' + esc(t('grv.legend')) + '</figcaption></figure>';
  }
  /* the chance of the prize after each step taken so far, against opening boxes one by one */
  function curve(o) {
    const W = 300, H = 104, X0 = 34, X1 = 290, Y0 = 8, Y1 = 74, px = k => X0 + (X1 - X0) * k / MAX, py = v => Y1 - (Y1 - Y0) * v, e = noiseOf(o.ln), f = v => v.toFixed(1);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('grv.curve.aria')) + '">';
    for (const v of [0, 0.5, 1]) s += '<line class="gl" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(v) + '" y2="' + py(v) + '"/><text class="ax" x="' + (X0 - 5) + '" y="' + (py(v) + 3.5) + '" text-anchor="end">' + esc(pct(v)) + '</text>';
    for (let k = 0; k <= MAX; k++) s += '<text class="ax' + (k === o.k ? ' now' : '') + '" x="' + px(k) + '" y="' + (Y1 + 13) + '" text-anchor="middle">' + k + '</text>';
    s += '<polyline class="plain" points="' + Array.from({ length: MAX + 1 }, (_, k) => f(px(k)) + ',' + f(py(G.plain(N, k)))).join(' ') + '"/>';
    const pts = Array.from({ length: o.k + 1 }, (_, k) => [px(k), py(chanceAt(k, e))]);
    s += '<polyline class="tr" points="' + pts.map(q => f(q[0]) + ',' + f(q[1])).join(' ') + '"/>' + pts.map((q, i) => '<circle class="dot' + (i === o.k ? ' now' : '') + '" cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (i === o.k ? 4 : 2.5) + '"/>').join('');
    return '<figure class="grvfig grvcurve">' + s + '<text class="ax" x="' + ((X0 + X1) / 2) + '" y="' + (H - 1) + '" text-anchor="middle">' + esc(t('grv.curve.x')) + '</text></svg><figcaption class="small muted"><span><i class="k1"></i>' + esc(t('grv.curve.this')) + '</span><span><i class="k2"></i>' + esc(t('grv.curve.plain')) + '</span></figcaption></figure>';
  }
  function goalbox() {
    const R = reading(seen()), ok = met(seen());
    const gs = [{ k: 'peak', ok: R.peak, v: pct(R.best), target: t('grv.t.peak', { v: Math.round(PEAK * 100) }), f: Math.min(1, R.best / PEAK) },
      { k: 'fall', ok: R.fell, v: R.after == null ? t('grv.none') : pct(R.after), target: t('grv.t.fall', { v: Math.round(FALL * 100) }), f: R.after == null ? 0 : Math.min(1, FALL / Math.max(R.after, 1e-9)) }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('grv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* one line of what happened: the step, what the noise did to it, and what the looks found */
  function story(o) {
    const e = noiseOf(o.ln), p = chanceAt(o.k, e), prev = o.k ? chanceAt(o.k - 1, e) : null, lost = G.chance(N, o.k) - p;
    let h = '<p class="small grvmsg">' + esc(t(o.k === 0 ? 'grv.msg.start' : p > prev ? 'grv.msg.up' : 'grv.msg.down', { p: pct(p), k: o.k })) + (lost > 0.05 ? ' ' + esc(t('grv.msg.noisy', { v: pct(lost) })) : '') + '</p>';
    if (o.looks) { const n = o.looks.reduce((a, b) => a + b, 0), hit = o.looks[o.prize];
      h += '<p class="small grvlook ' + (hit * 2 > n ? 'good' : 'bad') + '">' + esc(n === 1 ? t(hit ? 'grv.look.hit' : 'grv.look.miss', { b: o.last + 1 }) : t('grv.look.many', { n, h: hit })) + ' ' + esc(t('grv.look.ends')) + '</p>'; }
    return h;
  }

  function bench() {
    const o = set(), e = noiseOf(o.ln);
    let h = head() + '<p class="small grvintro">' + esc(t('grv.intro')) + '</p>' + goalbox() + figure(o, shown(o)) + curve(o);
    h += '<div class="chips grvacts"><button type="button" class="btn primary" data-grv-step' + (o.k >= MAX ? ' disabled' : '') + '>' + esc(t('grv.step')) + '</button><button type="button" class="chipb" data-grv-look="1">' + esc(t('grv.look1')) + '</button><button type="button" class="chipb" data-grv-look="100">' + esc(t('grv.look100')) + '</button><button type="button" class="chipb" data-grv-reset>' + esc(t('grv.again')) + '</button></div>';
    h += '<div class="grvdial"><label class="lab" for="grv-noise"><b>' + esc(t('grv.set.noise')) + '</b> <output>' + esc(noiseText(e)) + '</output></label><div class="grvstep"><button type="button" class="chipb" data-grv-nudge="-1" aria-label="' + esc(t('grv.less')) + '">−</button><input type="range" id="grv-noise" data-grv="ln" min="' + RANGE[0] + '" max="' + RANGE[1] + '" step="' + RANGE[2] + '" value="' + o.ln + '"><button type="button" class="chipb" data-grv-nudge="1" aria-label="' + esc(t('grv.more')) + '">+</button></div></div>';
    h += story(o);
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('grv.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('grv.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('grv.note')) + '</p>' + doneNote() + reward();
  }
  const fresh = o => { o.looks = null; o.last = null; };
  const after = () => { see(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      if (q('[data-grv-step]')) { if (o.k >= MAX) return true; o.from = amps(o.k, noiseOf(o.ln), o.prize); o.k++; fresh(o); const moving = !still(); o.t0 = moving ? performance.now() : 0; after(); if (moving) requestAnimationFrame(loop); return true; }
      const lk = q('[data-grv-look]'); if (lk) { const n = +lk.dataset.grvLook, r = view.gvR || (view.gvR = G.seeded(o.seed * 31 + 7)), pr = amps(o.k, noiseOf(o.ln), o.prize).map(v => v * v);
        o.looks = Array(N).fill(0);
        for (let i = 0; i < n; i++) { const b = G.sample(pr, r); o.looks[b]++; o.last = n === 1 ? b : null; }
        o.t0 = 0; draw(); fx(); return true; }
      if (q('[data-grv-reset]')) { o.seed++; o.prize = prizeOf(o.seed); o.k = 0; o.t0 = 0; fresh(o); draw(); fx(); return true; }
      const n = q('[data-grv-nudge]'); if (n) { o.ln = Math.min(RANGE[1], Math.max(RANGE[0], +(o.ln + RANGE[2] * +n.dataset.grvNudge).toFixed(1))); o.t0 = 0; fresh(o); return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-grv]'); if (!r) return false; const o = set(); o.ln = +r.value; o.t0 = 0; fresh(o); return after(); }
  };
}
