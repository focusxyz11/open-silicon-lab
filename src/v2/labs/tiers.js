/* Build up, not out (#482; src/engines/tiers.js): the lab of the challenge 'tiers', at the data centre's chip. A large
   model must run at a fixed pace on one chip's worth of logic. Stack tiers of it to shorten the wires, put the memory on
   the logic as a tier of its own, pump coolant between the tiers, or split the chip into chiplets side by side; the
   picture is the chip seen from the side, every tier coloured by how hot it runs, the cold plate on top. Won by the
   engine's met: enough operations per watt, under the temperature limit, with at least half the silicon good.
   On a phone: the same side view, and the three dials that win it (the chiplets stay on a desktop).
   lab(L) gets the player's pieces and returns { draw, click, input }. What the player tried is kept in the view. */
import * as Z from '../../engines/tiers.js';

const n1 = v => v.toFixed(1), n0 = v => Math.round(v).toLocaleString('en');
const phone = () => typeof matchMedia === 'function' && matchMedia('(max-width: 720px)').matches;

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win } = L, view = L.view;
  const set = () => view.tr || (view.tr = Object.assign({}, Z.START));
  const gauges = (ok, gs) => '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(g.l) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (Math.max(0, Math.min(1, g.f)) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  const hintLine = met => met ? '' : view.hint ? '<p class="small hint">' + esc(t('tier.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
  const see = () => { if (Z.met(set())) win(); };

  /* the chip from the side: the cold plate on top, the tiers under it (the memory tier at the bottom), every tier as hot
     as the engine says, coolant between tiers when it is pumped, and chiplets side by side as columns */
  function figure(B) {
    const W = 320, H = 210, X0 = 40, X1 = 250, top = 30, base = 178, m = B.T.length, k = B.s.chiplets, gap = k > 1 ? 6 : 0;
    /* the footprint shrinks as the tiers rise: the stack is drawn as wide as one tier is, against the flat chip's width */
    const flatW = X1 - X0, w = flatW * Math.sqrt(B.footprint / Z.build(Z.START).footprint), cx = (X0 + X1) / 2, x0 = cx - w / 2;
    const th = Math.min(22, (base - top - 16) / m - (B.s.cool ? 4 : 2)), step = th + (B.s.cool ? 4 : 2);
    const heatOf = T => Math.max(0, Math.min(1, (T - Z.T_COOL) / (Z.T_MAX - Z.T_COOL)));
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('tier.aria', { n: B.s.tiers, hot: n0(B.hot), lim: Z.T_MAX })) + '">';
    /* the flat chip's outline, for scale */
    s += '<rect class="trflat" x="' + X0 + '" y="' + (base - 10) + '" width="' + flatW + '" height="10" rx="1"/><text class="ax" x="' + X0 + '" y="' + (base + 12) + '">' + esc(t('tier.flat')) + '</text>';
    /* the cold plate, and the board under it all */
    const yTop = base - m * step;
    s += '<rect class="trplate" x="' + (x0 - 8) + '" y="' + (yTop - 12) + '" width="' + (w + 16) + '" height="9" rx="2"/><text class="ax" x="' + (x0 + w + 12) + '" y="' + (yTop - 5) + '">' + esc(t('tier.plate')) + '</text>';
    for (let i = 0; i < m; i++) {
      const y = base - (i + 1) * step, mem = B.memTier && i === 0, hot = B.T[i] > Z.T_MAX, f = heatOf(B.T[i]), cols = mem ? 1 : k;
      const cw = (w - gap * (cols - 1)) / cols;
      for (let c = 0; c < cols; c++) s += '<rect class="trtier' + (mem ? ' mem' : '') + (hot ? ' over' : '') + '" x="' + (x0 + c * (cw + gap)).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + th.toFixed(1) + '" rx="1.5" style="--h:' + f.toFixed(3) + '"/>';
      if (B.s.cool && i < m - 1) s += '<line class="trcool" x1="' + x0.toFixed(1) + '" x2="' + (x0 + w).toFixed(1) + '" y1="' + (y - 2).toFixed(1) + '" y2="' + (y - 2).toFixed(1) + '"/>';
      s += '<text class="ax trt' + (hot ? ' over' : '') + '" x="' + (W - 6) + '" y="' + (y + th / 2 + 3.5).toFixed(1) + '" text-anchor="end">' + esc(t(mem ? 'tier.memT' : 'tier.tierT', { t: n0(B.T[i]) })) + '</text>';
    }
    /* the limit, said once */
    s += '<text class="ax" x="' + X0 + '" y="16">' + esc(t('tier.limit', { t: Z.T_MAX })) + '</text></svg>';
    return '<figure class="trfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('tier.legend')) + '</figcaption></figure>';
  }
  const seg = (key, opts, cur, label) => '<div class="trdial"><span class="lab"><b>' + esc(label) + '</b></span><div class="seg" role="group" aria-label="' + esc(label) + '">' + opts.map(v => '<button type="button" data-tr="' + key + ':' + v + '" aria-pressed="' + (v === cur) + '">' + esc(String(v)) + '</button>').join('') + '</div></div>';
  const tog = (key, on, label) => '<label class="trtog"><input type="checkbox" data-tr-tog="' + key + '"' + (on ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';

  function bench() {
    const o = set(), B = Z.build(o), met = Z.met(o), ok = met || !!S.done[ch.id], why = Z.whyNot(o), ph = phone();
    let h = head() + '<p class="small trintro">' + esc(t('tier.intro')) + '</p>';
    h += gauges(ok, [
      { l: t('tier.g.eff'), ok: B.topsPerW >= Z.GOAL.topsPerW, v: t('tier.tops', { v: B.topsPerW.toFixed(2) }), target: t('tier.t.eff', { v: Z.GOAL.topsPerW }), f: B.topsPerW / Z.GOAL.topsPerW },
      { l: t('tier.g.hot'), ok: B.ok, v: t('tier.deg', { v: n0(B.hot) }), target: t('tier.t.hot', { v: Z.T_MAX }), f: B.ok ? 1 : Z.T_MAX / B.hot },
      { l: t('tier.g.good'), ok: B.good >= Z.GOAL.good, v: t('tier.pct', { v: n0(B.good * 100) }), target: t('tier.t.good', { v: n0(Z.GOAL.good * 100) }), f: B.good / Z.GOAL.good }]);
    h += figure(B);
    h += '<p class="small trsay ' + (met ? 'good' : why === 'hot' ? 'bad' : '') + '">' + esc(t('tier.why.' + (why || 'met'), { t: n0(B.hot), lim: Z.T_MAX })) + '</p>';
    h += seg('tiers', Z.TIERS, o.tiers, t('tier.set.tiers')) + '<div class="trtogs">' + tog('memOn', o.memOn, t('tier.set.mem')) + tog('cool', o.cool, t('tier.set.cool')) + '</div>';
    if (!ph) h += seg('chiplets', Z.CHIPLETS, o.chiplets, t('tier.set.chiplets'));
    /* where the energy of one operation goes, and what the stack does to the wires and the footprint (a desktop's) */
    if (!ph) {
      const E = B.E, parts = [['op', E.op], ['wire', E.wire], ['mem', E.mem], ['link', E.link]], tot = E.total;
      h += '<div class="trbar" role="img" aria-label="' + esc(t('tier.bar.aria', { pj: E.total.toFixed(2) })) + '">' + parts.map(([k, v]) => '<span class="' + k + '" style="flex:' + Math.max(0.001, v / tot).toFixed(3) + '" title="' + esc(t('tier.e.' + k) + ' ' + v.toFixed(2)) + '"></span>').join('') + '</div>';
      h += '<div class="trread">' + [['e', t('tier.pj', { v: E.total.toFixed(2) })], ['w', t('tier.watt', { v: n0(B.watts) })], ['wire', t('tier.x', { v: B.wire.toFixed(2) })], ['fp', t('tier.mm2', { v: n0(B.footprint) })], ['dens', t('tier.wcm', { v: n1(B.density * 100) })]]
        .map(([k, v]) => '<span><span class="small muted">' + esc(t('tier.r.' + k)) + '</span><b class="mono">' + esc(v) + '</b></span>').join('') + '</div>';
      h += '<p class="small muted trparts">' + parts.map(([k]) => '<i class="' + k + '"></i>' + esc(t('tier.e.' + k))).join(' ') + '</p>';
    }
    h += hintLine(ok);
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('tier.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('tier.note')) + '</p>' + doneNote() + reward();
  }

  return {
    draw: bench,
    click(e) {
      const q = s => e.target.closest(s);
      if (q('[data-hint]')) { view.hint = true; L.draw(); return true; }
      const b = q('[data-tr]'); if (!b) return false;
      const [k, v] = b.dataset.tr.split(':'), o = set(); o[k] = +v; view.tr = Z.normal(o); see(); L.draw(); return true;
    },
    input(e) {
      const c = e.target.closest && e.target.closest('[data-tr-tog]'); if (!c) return false;
      const o = set(); o[c.dataset.trTog] = c.checked; view.tr = Z.normal(o); see(); L.draw(); return true;
    }
  };
}
