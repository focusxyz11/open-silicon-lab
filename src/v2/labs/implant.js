/* Implant and anneal (kind 'implant', at the factory's implant level), from src/engines/dope.js.
   One lab for two challenges ('furnace' and 'shallow'): fire dopant ions into silicon, heat the wafer, and read the
   dopant profile against the wafer's own doping. A lab of the challenge player (src/v2/play.js): lab(L) gets the
   player's pieces and returns { draw, click, input }; draw gives the card's HTML, click and input say whether they
   handled the event. The results the player has seen are kept in the view; the engine's challenge decides. */
import * as D from '../../engines/dope.js';
import { met } from '../../engines/fabsteps.js';

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻';
const sup = n => String(n).replace(/[0-9-]/g, c => SUP[c === '-' ? 10 : +c]);
const X0 = 34, X1 = 290, Y0 = 12, Y1 = 160, LO = 15, HI = 22;          // the plot, and the concentrations it spans (powers of ten)

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const sci = v => { if (!(v > 0)) return '0'; const e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e); return t('imp.sci', { m: m.toFixed(1), e: sup(e) }); };
  /* the dials: ion, energy (on a log scale, two figures), dose (log), anneal */
  const set = () => view.im || (view.im = { ion: D.IMPLANT_DEFAULTS.ion, anneal: D.IMPLANT_DEFAULTS.anneal, le: Math.log10(11), ld: 15 });
  const energy = o => +Math.pow(10, o.le).toPrecision(2);
  const settings = (o = set()) => ({ ion: o.ion, anneal: o.anneal, energy: energy(o), dose: Math.pow(10, o.ld) });
  const run = o => D.implant(settings(o));
  const seen = () => view.imSeen || (view.imSeen = [run()]);
  /* what the player has seen: every result shown, kept (most recent last) */
  function see() { const s = seen(), r = run(); s.push(r); if (s.length > 400) s.shift(); if (met(ch.id, s)) win(); return r; }
  const group = (i, s = seen()) => { const g = D.DOPE_CHALLENGES.find(c => c.id === ch.id).groups[i]; for (let k = s.length - 1; k >= 0; k--) if (g(s[k])) return s[k]; return null; };
  const nm = v => t('imp.nm', { v: v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(0) : v.toFixed(1) });

  function figure(r) {
    const W = 300, H = 200, xj = r.xj;
    /* the depth axis follows the profile: the first of a few round depths that holds the junction and the peak */
    const need = Math.max(20, (xj || 0) * 1.25, r.Rp + 2.8 * r.spread), xmax = [30, 60, 120, 250, 500, 1000, 2000, 4000].find(v => v >= need) || 4000;
    const px = x => X0 + (X1 - X0) * x / xmax, lg = c => Math.min(HI, Math.max(LO, Math.log10(Math.max(c, 1))));
    const py = c => Y1 - (Y1 - Y0) * (lg(c) - LO) / (HI - LO);
    const N = 150, xs = Array.from({ length: N + 1 }, (_, i) => xmax * i / N);
    const line = k => xs.map(x => px(x).toFixed(1) + ',' + py(r.profile(x) * k).toFixed(1)).join(' ');
    const base = py(Math.pow(10, LO)).toFixed(1), area = k => X0 + ',' + base + ' ' + line(k) + ' ' + X1 + ',' + base;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('imp.aria', { j: xj ? nm(xj) : t('imp.none'), a: r.activePct })) + '">';
    for (const p of [15, 17, 19, 21]) s += '<line class="gl" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(Math.pow(10, p)).toFixed(1) + '" y2="' + py(Math.pow(10, p)).toFixed(1) + '"/><text class="ax" x="' + (X0 - 4) + '" y="' + (py(Math.pow(10, p)) + 3.5).toFixed(1) + '" text-anchor="end">10' + sup(p) + '</text>';
    s += '<line class="bg" x1="' + X0 + '" x2="' + X1 + '" y1="' + py(D.BACKGROUND).toFixed(1) + '" y2="' + py(D.BACKGROUND).toFixed(1) + '"/><text class="ax bgt" x="' + (X1 - 2) + '" y="' + (py(D.BACKGROUND) + 11).toFixed(1) + '" text-anchor="end">' + esc(t('imp.bg')) + '</text>';
    s += '<polygon class="all" points="' + area(1) + '"/><polygon class="on" points="' + area(r.active) + '"/><polyline class="prof" points="' + line(1) + '"/>';
    if (xj) { const jx = px(xj), flip = jx > X1 - 70;
      s += '<line class="jn" x1="' + jx.toFixed(1) + '" x2="' + jx.toFixed(1) + '" y1="' + Y0 + '" y2="' + Y1 + '"/><circle class="jd" cx="' + jx.toFixed(1) + '" cy="' + py(D.BACKGROUND).toFixed(1) + '" r="3.5"/>' +
        '<text class="jt" x="' + (jx + (flip ? -6 : 6)).toFixed(1) + '" y="' + (Y0 + 9) + '" text-anchor="' + (flip ? 'end' : 'start') + '">' + esc(t('imp.jn', { v: nm(xj) })) + '</text>'; }
    s += '<text class="ax" x="' + X0 + '" y="' + (Y1 + 14) + '">0</text><text class="ax" x="' + X1 + '" y="' + (Y1 + 14) + '" text-anchor="end">' + esc(nm(xmax)) + '</text>' +
      '<text class="ax" x="' + ((X0 + X1) / 2) + '" y="' + (Y1 + 28) + '" text-anchor="middle">' + esc(t('imp.x')) + '</text>' +
      '<text class="ax" x="' + X0 + '" y="' + (Y0 - 3) + '">' + esc(t('imp.y')) + '</text></svg>';
    return '<figure class="imfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('imp.legend')) + '</figcaption></figure>';
  }
  /* the goal as gauges: each a thing to see, with how near it is */
  function goalbox(r) {
    const ok = met(ch.id, seen()); let gs;
    if (ch.id === 'furnace') {
      const F = group(0), Lz = group(1), g = (k, x) => ({ k, ok: !!x, v: x ? nm(x.xj) : t('imp.gv.none'), target: '', f: x ? 1 : 0 });
      gs = [g('furnace', F), g('laser', Lz)];
    } else gs = [{ k: 'type', ok: r.type === 'n', v: t('imp.type.' + r.type), target: '', f: r.type === 'n' ? 1 : 0 },
      { k: 'depth', ok: !!r.xj && r.xj < 15, v: r.xj ? nm(r.xj) : t('imp.none'), target: t('imp.t.depth', { v: 15 }), f: r.xj ? Math.min(1, 15 / r.xj) : 0 },
      { k: 'active', ok: r.activePct > 95, v: r.activePct + '%', target: t('imp.t.active', { v: 95 }), f: Math.min(1, r.active / 0.96) }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('imp.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + (g.target ? ' <span class="muted">' + esc(g.target) + '</span>' : '') + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* the four anneals side by side at the other dials: how deep each leaves the junction; tap one to use it */
  function anneals(o) {
    const rs = D.ANNEALS.map(a => run({ ...o, anneal: a })), top = Math.max(1, ...rs.map(r => r.xj || 0));
    return '<div class="imann" role="group" aria-label="' + esc(t('imp.set.anneal')) + '">' + rs.map(r => '<button type="button" class="imrow' + (r.anneal === o.anneal ? ' on' : '') + '" data-im-anneal="' + r.anneal + '" aria-pressed="' + (r.anneal === o.anneal) + '"><span class="imn"><b>' + esc(t('imp.anneal.' + r.anneal)) + '</b><span class="small muted">' + esc(t('imp.heat.' + r.anneal)) + '</span></span>' +
      '<span class="imbar"><span style="width:' + (r.xj ? Math.max(2, r.xj / top * 100) : 0).toFixed(0) + '%"></span></span><span class="imv mono">' + esc(r.xj ? nm(r.xj) : t('imp.none')) + '</span></button>').join('') + '</div>';
  }
  const dial = (id, label, value, min, max, step) => '<div class="imdial"><label class="lab" for="im-' + id + '"><b>' + esc(label) + '</b> <output>' + esc(value) + '</output></label><div class="imstep"><button type="button" class="chipb" data-im-nudge="' + id + ':-1" aria-label="' + esc(t('imp.less')) + '">−</button><input type="range" id="im-' + id + '" data-im="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + set()[id] + '"><button type="button" class="chipb" data-im-nudge="' + id + ':1" aria-label="' + esc(t('imp.more')) + '">+</button></div></div>';

  function bench() {
    const o = set(), r = run(o), st = settings(o);
    let h = head() + '<p class="small imintro">' + esc(t('imp.intro')) + '</p>' + goalbox(r) + figure(r);
    h += '<div class="imread">' + [['junction', r.xj ? nm(r.xj) : t('imp.none')], ['peak', sci(r.peak)], ['active', r.activePct + '%'], ['type', t('imp.type.' + r.type)]].map(([k, v]) => '<span><span class="small muted">' + esc(t('imp.r.' + k)) + '</span><b class="mono">' + esc(v) + '</b></span>').join('') + '</div>';
    h += '<p class="kicker">' + esc(t('imp.set.ion')) + '</p><div class="chips">' + D.ION_IDS.map(i => '<button type="button" class="chipb' + (o.ion === i ? ' on' : '') + '" data-im-ion="' + i + '" aria-pressed="' + (o.ion === i) + '">' + esc(t('imp.ion.' + i)) + '</button>').join('') + '</div>';
    h += dial('le', t('imp.set.energy'), t('imp.v.energy', { v: st.energy }), -0.3, 2.7, 0.01) + dial('ld', t('imp.set.dose'), t('imp.v.dose', { v: sci(st.dose) }), D.IMPLANT_RANGE.logDose[0], D.IMPLANT_RANGE.logDose[1], 0.1);
    h += '<p class="kicker">' + esc(t('imp.set.anneal')) + '</p>' + anneals(o);
    const extra = ['amorphous', 'oversoluble', 'shallow', 'deep'].find(k => r.notes.includes(k));
    h += '<p class="small">' + esc(t('imp.note.' + r.anneal)) + (extra ? ' ' + esc(t('imp.note.' + extra)) : '') + '</p>';
    if (!met(ch.id, seen())) h += view.hint ? '<p class="small hint">' + esc(t('imp.hint.' + ch.id)) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else if (S.done[ch.id]) h += '<p class="small good">' + esc(t('imp.done.' + ch.id)) + '</p>';
    if (ch.id === 'furnace' && group(0) && group(1)) h += '<p class="small">' + esc(t('imp.ratio', { v: (group(0).xj / group(1).xj).toFixed(1) })) + '</p>';
    return h + doneNote() + reward();
  }
  const after = () => { see(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      const i = q('[data-im-ion]'); if (i) { o.ion = i.dataset.imIon; return after(); }
      const a = q('[data-im-anneal]'); if (a) { o.anneal = a.dataset.imAnneal; return after(); }
      const n = q('[data-im-nudge]'); if (n) { const [k, d] = n.dataset.imNudge.split(':'), inp = el.querySelector('#im-' + k), step = +inp.step; o[k] = Math.min(+inp.max, Math.max(+inp.min, +(o[k] + step * +d).toFixed(2))); return after(); }
      return false; },
    input(e) { const r = e.target.closest('[data-im]'); if (!r) return false; set()[r.dataset.im] = +r.value; return after(); }
  };
}
