/* Ten billion vias (kind 'overlay', at the factory's print level), from src/engines/fabline.js (overlay).
   Two dials, the random error of each layer's alignment and a steady shift, and a field of vias landing on the wires
   below, with the failed vias per chip on a log meter. A lab of the challenge player (src/v2/play.js): lab(L) gets the
   player's pieces and returns { draw, click, input }. The results the player has seen are kept in the view. */
import * as F from '../../engines/fabline.js';
import { met } from '../../engines/fabsteps.js';

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.ov || (view.ov = { shift: F.OVERLAY_DEFAULTS.shift, sigma: F.OVERLAY_DEFAULTS.sigma });
  const run = () => F.overlay(set());
  const seen = () => view.ovSeen || (view.ovSeen = [run()]);
  function see() { const s = seen(), r = run(); s.push(r); if (s.length > 400) s.shift(); if (met(ch.id, s)) win(); }
  const group = i => { const g = F.FABLINE_CHALLENGES.find(c => c.id === ch.id).groups[i], s = seen(); for (let k = s.length - 1; k >= 0; k--) if (g(s[k])) return s[k]; return null; };
  const nm = v => t('ovl.nm', { v: (+v).toFixed(2).replace(/0$/, '') });
  const count = v => v < 0.01 ? t('ovl.n.tiny') : v < 100 ? t('ovl.n.plain', { v: +v.toPrecision(2) }) : v < 1e6 ? t('ovl.n.plain', { v: Math.round(v).toLocaleString('en') }) : v < 1e9 ? t('ovl.n.million', { v: (v / 1e6).toFixed(1) }) : t('ovl.n.billion', { v: (v / 1e9).toFixed(1) });

  function figure(r) {
    const W = 300, COLS = 10, ROWS = 4, P = F.VIA.pitchNm, w = F.VIA.widthNm, ox = (W - COLS * P) / 2 + P / 2, oy = 14;
    let s = '<svg viewBox="0 0 ' + W + ' 196" role="img" aria-label="' + esc(t('ovl.aria', { n: Math.round(r.failed) > 0 ? count(r.failed) : t('ovl.n.tiny') })) + '">';
    for (let c = 0; c < COLS; c++) s += '<rect class="wire" x="' + (ox + c * P - w / 2) + '" y="6" width="' + w + '" height="' + (ROWS * P + 4) + '" rx="2"/>';
    let miss = 0;
    F.OVERLAY_Z.slice(0, COLS * ROWS).forEach((z, i) => {
      const dx = r.shift + r.sigma * z, bad = Math.abs(dx) > F.VIA.limitNm, c = i % COLS, rw = Math.floor(i / COLS); if (bad) miss++;
      s += '<rect class="via ' + (bad ? 'miss' : 'hit') + '" x="' + (ox + c * P + dx - w / 2).toFixed(1) + '" y="' + (oy + rw * P - w / 2 + 6).toFixed(1) + '" width="' + w + '" height="' + w + '" rx="3"/>';
    });
    /* the meter: failed vias per chip, from a hundredth to ten billion, with one per chip marked */
    const my = 160, a = 20, b = 280, lo = -2, hi = 10, x = v => a + (b - a) * (Math.log10(Math.max(v, 0.01)) - lo) / (hi - lo);
    s += '<rect class="mtr" x="' + a + '" y="' + my + '" width="' + (b - a) + '" height="8" rx="4"/><rect class="mfill ' + r.verdict + '" x="' + a + '" y="' + my + '" width="' + (x(r.failed) - a).toFixed(1) + '" height="8" rx="4"/>' +
      '<line class="m1" x1="' + x(1) + '" x2="' + x(1) + '" y1="' + (my - 5) + '" y2="' + (my + 13) + '"/><text class="ax" x="' + x(1) + '" y="' + (my + 25) + '" text-anchor="middle">' + esc(t('ovl.one')) + '</text><text class="ax" x="' + b + '" y="' + (my + 25) + '" text-anchor="end">' + esc(t('ovl.all')) + '</text></svg>';
    /* 40 vias cannot show a miss that happens once in millions: say what the sample shows, and how rare a miss is on the chip */
    const every = r.p > 1e-11 ? t('ovl.rate', { n: count(1 / r.p) }) : t('ovl.rate.none');
    return '<figure class="ovfig" data-f2="instrument">' + s + '<p class="ovrate"><span class="' + (miss ? 'bad' : 'muted') + '">' + esc(t('ovl.sample', { k: miss })) + '</span> <b>' + esc(every) + '</b></p><figcaption class="small muted">' + esc(t('ovl.legend')) + '</figcaption></figure>';
  }
  function goalbox() {
    const ok = met(ch.id, seen()), A = group(0), B = group(1);
    const gs = [{ k: 'free', ok: !!A, v: A ? nm(A.sigma) : t('ovl.gv.none'), target: t('ovl.t.free') }, { k: 'shift', ok: !!B, v: B ? count(B.failed) : t('ovl.gv.none'), target: t('ovl.t.shift') }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('ovl.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + '</span><span class="gbar"><span style="width:' + (g.ok ? 100 : 0) + '%"></span></span><span class="small muted">' + esc(g.target) + '</span></div>').join('') + '</div>';
  }
  const dial = (id, label, value, min, max, step) => '<div class="imdial"><label class="lab" for="ov-' + id + '"><b>' + esc(label) + '</b> <output>' + esc(value) + '</output></label><div class="imstep"><button type="button" class="chipb" data-ov-nudge="' + id + ':-1" aria-label="' + esc(t('ovl.less')) + '">−</button><input type="range" id="ov-' + id + '" data-ov="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + set()[id] + '"><button type="button" class="chipb" data-ov-nudge="' + id + ':1" aria-label="' + esc(t('ovl.more')) + '">+</button></div></div>';
  function bench() {
    const o = set(), r = run(), R = F.OVERLAY_RANGE;
    let h = head() + '<p class="small imintro">' + esc(t('ovl.intro')) + '</p>' + goalbox() + figure(r);
    h += '<div class="imread"><span class="wide"><span class="small muted">' + esc(t('ovl.r.failed')) + '</span><b class="mono ' + r.verdict + '">' + esc(count(r.failed)) + '</b></span><span class="wide"><span class="small muted">' + esc(t('ovl.verdict.' + r.verdict)) + '</span><span class="small">' + esc(t('ovl.text.' + r.verdict)) + '</span></span></div>';
    h += dial('sigma', t('ovl.set.sigma'), nm(o.sigma), R.sigma[0], R.sigma[1], 0.01) + dial('shift', t('ovl.set.shift'), nm(o.shift), R.shift[0], R.shift[1], 0.1);
    if (!met(ch.id, seen())) h += view.hint ? '<p class="small hint">' + esc(t('ovl.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + esc(t('ovl.done')) + '</p>';
    return h + doneNote() + reward();
  }
  const after = () => { see(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const n = e.target.closest('[data-ov-nudge]'); if (!n) return false;
      const [k, d] = n.dataset.ovNudge.split(':'), inp = el.querySelector('#ov-' + k), o = set();
      o[k] = Math.min(+inp.max, Math.max(+inp.min, +(o[k] + +inp.step * +d).toFixed(2))); return after(); },
    input(e) { const r = e.target.closest('[data-ov]'); if (!r) return false; set()[r.dataset.ov] = +r.value; return after(); }
  };
}
