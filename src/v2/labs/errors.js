/* Catch the silent errors (kind 'errors', at the Ship step): part 2 of the puzzle "how can a chip be right when its
   parts aren't?" (content/puzzles/errors.md), scored by its engine, src/engines/errors.js. A chip goes out to live in
   a phone, a car, a data centre or a satellite. The picture is the stack of levels the dive goes down, from the job
   the chip does to the package it sits in: on each row, the wrong values born there (each source at the level where
   it arises), what that level's protection stops (fixed, or caught and refused), and the protection itself, set right
   on the row. What gets past every level leaves at the top as silent wrong answers. Each place has its goal (silent
   answers in a billion, or for the car the ISO 26262 limit in a billion hours) and its limit on what being right may
   cost in area and energy. Won when the phone, the car and the data centre are cleared; space is there to try.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as X from '../../engines/errors.js';
import { fmtNum } from '../../core/i18n.js';

/* each place's goal: silent answers per billion (per) or per 10⁹ hours (fit), and the most area and energy (as
   multiples of the unprotected chip) being right may cost */
export const GOALS = {
  phone: { per: 0.1, area: 1.15, energy: 1.2 },
  car: { fit: 10, area: 1.7, energy: 1.7 },
  datacentre: { per: 0.001, area: 1.15, energy: 1.2 },
  space: { fit: 100, area: 1.7, energy: 1.7 }
};
export const NEEDED = ['phone', 'car', 'datacentre'];
export const metAt = (env, r) => { const G = GOALS[env]; return !!r && r.ok && (G.per != null ? r.perBillion.silent <= G.per : r.fit.silent <= G.fit) && r.cost.area <= G.area + 1e-9 && r.cost.energy <= G.energy + 1e-9; };
const LO = -6, HI = 5;   /* a millionth to a hundred thousand in a billion */

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.er || (view.er = { env: 'phone', plans: Object.fromEntries(X.ENVIRONMENT_IDS.map(e => [e, {}])), solved: [] });
  const n = v => (v >= 100 ? fmtNum(Math.round(v)) : v >= 0.01 ? fmtNum(+v.toPrecision(2)) : v > 0 ? fmtNum(+v.toPrecision(1), { maximumSignificantDigits: 2 }) : '0');
  const w = v => Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1e-12)) - LO) / (HI - LO))) * 100;
  const pc = v => t('er.pc', { v: (v >= 1 ? '+' : '') + Math.round((v - 1) * 100) });
  const after = () => { const s = st(), r = X.errors(s.env, s.plans[s.env]); if (metAt(s.env, r) && !s.solved.includes(s.env)) s.solved.push(s.env); if (NEEDED.every(e => s.solved.includes(e))) win(); draw(); fx(); return true; };
  const value = v => (typeof v === 'number' ? t('er.pc', { v: Math.round(v * 100) }) : t('er.v.' + v));

  /* one lever, set on its row */
  function lever(s, Lv) {
    const P = { ...X.PLAN, ...s.plans[s.env] }, off = Lv.id === 'hunt' && !X.ENVIRONMENTS[s.env].hall;
    if (off) return '<span class="small muted">' + esc(t('er.nohall')) + '</span>';
    return '<span class="erlever"><span class="small">' + esc(t('er.l.' + Lv.id)) + '</span><span class="erseg">' + Lv.values.filter((v, i) => Lv.id !== 'margin' || i % 2 === 0).map(v => '<button type="button" class="chipb" data-er="' + Lv.id + ':' + v + '" aria-pressed="' + (P[Lv.id] === v) + '">' + esc(value(v)) + '</button>').join('') + '</span></span>';
  }
  /* the stack: each level, what is born there, what it stops, its protection; silent answers leave at the top */
  function stack(s, r) {
    const born = lv => X.SOURCES.filter(src => X.SOURCE_LEVEL[src] === lv);
    const fit = GOALS[s.env].fit != null, out = fit ? r.fit.silent : r.perBillion.silent;
    let h = '<div class="erstack" data-f2="instrument"><div class="ertop"><span class="erlv"><b>' + esc(t('er.out')) + '</b><span class="small muted">' + esc(t(fit ? 'er.inHours' : 'er.inAnswers')) + '</span></span><span class="erbars"><i class="ersil" style="width:' + w(out).toFixed(1) + '%"></i></span><b class="mono ersilv">' + esc(n(out)) + '</b></div>';
    for (const lv of X.LEVELS) {
      const B = born(lv), raw = B.reduce((a, src) => a + r.bySource[src].raw, 0), stop = r.stoppedAt[lv] || 0, levers = X.LEVERS.filter(l => l.level === lv);
      h += '<div class="errow"><span class="erlv"><b>' + esc(lv === 'job' ? t('er.lv.job') : t('depth.' + lv + '.name')) + '</b>' + (B.length ? '<span class="small muted">' + esc(B.map(src => t('er.src.' + src)).join(' · ')) + '</span>' : '') + '</span>' +
        '<span class="erbars">' + (raw > 0 ? '<i class="erborn" style="width:' + w(raw).toFixed(1) + '%" title="' + esc(t('er.bornT', { v: n(raw) })) + '"></i>' : '') + (stop > 0 ? '<i class="erstop" style="width:' + w(stop).toFixed(1) + '%" title="' + esc(t('er.stopT', { v: n(stop) })) + '"></i>' : '') + '</span>' +
        '<span class="erlevers">' + levers.map(Lv => lever(s, Lv)).join('') + '</span></div>';
    }
    return h + '<p class="small muted erkey"><span><i class="erborn"></i>' + esc(t('er.k.born')) + '</span><span><i class="erstop"></i>' + esc(t('er.k.stop')) + '</span><span><i class="ersil"></i>' + esc(t('er.k.silent')) + '</span></p></div>';
  }
  function goalbox(s, r) {
    const G = GOALS[s.env], ok = metAt(s.env, r), fit = G.fit != null, v = fit ? r.fit.silent : r.perBillion.silent, lim = fit ? G.fit : G.per;
    const gs = [{ k: fit ? 'fit' : 'per', ok: v <= lim, v: n(v), target: t('er.t.max', { v: n(lim) }), f: Math.min(1, lim / Math.max(v, 1e-15)) },
      { k: 'area', ok: r.cost.area <= G.area + 1e-9, v: pc(r.cost.area), target: t('er.t.cost', { v: pc(G.area) }), f: r.cost.area <= G.area ? 1 : (G.area - 1) / (r.cost.area - 1) },
      { k: 'energy', ok: r.cost.energy <= G.energy + 1e-9, v: pc(r.cost.energy), target: t('er.t.cost', { v: pc(G.energy) }), f: r.cost.energy <= G.energy ? 1 : (G.energy - 1) / (r.cost.energy - 1) }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('er.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (Math.max(0, g.f) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  function bench() {
    const s = st(), r = X.errors(s.env, s.plans[s.env]), G = GOALS[s.env];
    let h = head() + '<p class="small erintro">' + esc(t('er.intro')) + '</p>';
    h += '<div class="chips erplaces">' + X.ENVIRONMENT_IDS.map(e => '<button type="button" class="chipb" data-er-env="' + e + '" aria-pressed="' + (s.env === e) + '">' + (s.solved.includes(e) ? '✓ ' : '') + esc(t('er.place.' + e)) + (NEEDED.includes(e) ? '' : ' · ' + esc(t('er.extra'))) + '</button>').join('') + '</div>';
    h += '<p class="small erplace">' + esc(t('er.placed.' + s.env)) + '</p>' + goalbox(s, r) + stack(s, r);
    const ok = metAt(s.env, r), big = r.cost.area > G.area + 1e-9 || r.cost.energy > G.energy + 1e-9;
    h += '<p class="small ermsg ' + (ok ? 'good' : big ? 'bad' : '') + '">' + esc(ok ? t('er.msg.met', { caught: n(r.perBillion.caught) }) : big ? t('er.msg.costly') : r.where ? t('er.msg.worst', { src: t('er.src.' + r.where) }) : t('er.msg.more')) + '</p>';
    if (NEEDED.every(e => s.solved.includes(e))) h += '<p class="small good">' + esc(t('er.all')) + '</p>';
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('er.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('er.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('er.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: bench,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const p = q('[data-er-env]'); if (p) { s.env = p.dataset.erEnv; return after(); }
      const b = q('[data-er]'); if (b) { const [id, raw] = b.dataset.er.split(':'), Lv = X.leverOf(id), v = Lv.values.find(x => String(x) === raw); s.plans[s.env][id] = v; return after(); }
      return false; },
    input() { return false; }
  };
}
