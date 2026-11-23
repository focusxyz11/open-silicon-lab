/* A thousand that pass (kind 'thousand', at the studio's job), from src/engines/thousand.js: the core question "Only
   humans". A program has designed the phone's AI chip a thousand times, and every design passes every check: the field
   draws them on two measured axes (power and cost), all inside the need's limits. Around the need stand the people no
   check measures: who uses it, who repairs it, who pays, the planet, and what it must never do. Tapping one of them
   colours the field by how each design treats them; picking a design shows how it treats each of them, and why (its four
   choices). The goal: choose one, and write in one line what you chose it for. The choice is kept as a ledger try with
   that reason (src/engines/ledger.js), and the lab then shows how others chose for the same need, people's choices and
   AI agents' as two groups, never mixed, read from the entries alone. No choice is ever invented: with none, it says so.
   The reasons are their authors' own words, shown as data. A lab of the challenge player (src/v2/play.js). */
import * as T from '../../engines/thousand.js';
import { choicesAt } from '../../engines/ledger.js';
import { world } from '../game.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, draftOf } from '../commons.js';

const NEED = 'phone';
/* the people's marks: small stroke drawings in a 24 x 24 box */
export const GLYPH = {
  user: 'M8 3h8v18H8zM11 18h2',
  repair: 'M14.5 4a4 4 0 0 0-4.6 5.4L4 15.3 6.7 18l5.9-5.9A4 4 0 0 0 18 7.5l-2.5 2.5-2-2L16 5.5a4 4 0 0 0-1.5-1.5z',
  payer: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.5 8.5c-.6-.8-1.5-1.2-2.5-1.2-1.6 0-2.6.8-2.6 2s1 1.6 2.6 2 2.6.9 2.6 2.1-1.1 2-2.6 2c-1.1 0-2-.4-2.6-1.2M12 5.8v1.5M12 16.7v1.5',
  planet: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9.5h17M3.5 14.5h17M12 3c2.6 2.5 2.6 15.5 0 18M12 3c-2.6 2.5-2.6 15.5 0 18',
  never: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM8 8l8 8'
};
const TONE = v => (v >= 2 ? 'l2' : v >= 1 ? 'l1' : v <= -2 ? 'm2' : v <= -1 ? 'm1' : 'l0');

export default function lab(L) {
  const { S, ch, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  const D = T.thousand(NEED), LIM = T.limits(NEED);
  const set = () => view.th || (view.th = { pick: null, lens: null, why: '', name: null });
  const save = () => L.ctx.save && L.ctx.save();
  const money = v => t('th.u.usd', { v: v.toFixed(0) });
  const val = (k, v) => k === 'power' ? t('th.u.watts', { v: v.toFixed(1) }) : k === 'cost' ? money(v) : k === 'tps' ? t('th.u.tps', { v: Math.round(v) }) : t('th.u.mm2', { v: Math.round(v) });
  /* the field's scales: from a little under the lowest to the need's limit, on both axes */
  const lo = k => Math.floor(Math.min(...D.map(d => d.m[k])) * 0.95), hi = k => LIM[k].value;
  const X0 = 128, X1 = 294, Y0 = 8, Y1 = 186, sx = v => X0 + (v - lo('power')) / (hi('power') - lo('power')) * (X1 - X0), sy = v => Y1 - (v - lo('cost')) / (hi('cost') - lo('cost')) * (Y1 - Y0);

  function figure(o) {
    const pick = o.pick && T.designOf(NEED, o.pick), lens = o.lens;
    const Wd = world(S), C = choicesAt(Wd, NEED), kept = view.slip || S.done[ch.id];
    let g = '<svg viewBox="0 0 300 214" role="img" aria-label="' + esc(t('th.aria', { n: D.length })) + '">';
    /* the people around the need, down the left: tap one to see the field as they would */
    T.PEOPLE.forEach((p, i) => {
      const y = 18 + i * 37, on = lens === p, lv = pick ? pick.lean[p] : null;
      g += '<g class="thp' + (on ? ' on' : '') + '" data-th-lens="' + p + '" role="button" tabindex="0" aria-pressed="' + on + '"><title>' + esc(t('th.person.' + p + '.d')) + '</title>' +
        '<rect class="thpbg" x="1" y="' + (y - 15) + '" width="100" height="33" rx="7"/><g transform="translate(5 ' + (y - 11) + ') scale(0.9)"><path class="thglyph" d="' + GLYPH[p] + '"/></g>' +
        '<text class="thpn" x="30" y="' + (y - 1) + '">' + esc(t('th.person.' + p + '.s')) + '</text>';
      /* how the picked design treats them: five steps from badly to well */
      if (lv != null) for (let k = -2; k <= 2; k++) g += '<rect class="thstep ' + (k === 0 ? 'mid' : (k < 0 ? (lv <= k ? 'm' : '') : (lv >= k ? 'l' : ''))) + '" x="' + (30 + (k + 2) * 11) + '" y="' + (y + 6) + '" width="9" height="5" rx="1.5"/>';
      g += '</g>';
    });
    /* the field: inside the need's limits everything passes, so it is all one colour until a person is held */
    g += '<rect class="thzone" x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" rx="4"/>';
    [lo('power'), (lo('power') + hi('power')) / 2, hi('power')].forEach((v, i) => { g += '<text class="ax" x="' + sx(v).toFixed(1) + '" y="' + (Y1 + 11) + '" text-anchor="' + ['start', 'middle', 'end'][i] + '">' + esc(t('th.u.watts', { v: v.toFixed(1) })) + '</text>'; });
    [lo('cost'), hi('cost')].forEach((v, i) => { g += '<text class="ax" x="' + (X0 - 3) + '" y="' + (i ? Y0 + 8 : Y1).toFixed(1) + '" text-anchor="end">' + esc(money(v)) + '</text>'; });
    g += '<text class="ax" x="' + ((X0 + X1) / 2) + '" y="211" text-anchor="middle">' + esc(t('th.fig.x')) + '</text><text class="ax thylab" x="' + (X0 + 5) + '" y="' + (Y0 + 12) + '">' + esc(t('th.fig.y')) + '</text>' +
      '<text class="ax thok" x="' + (X1 - 5) + '" y="' + (Y1 - 6) + '" text-anchor="end">' + esc(t('th.fig.limit')) + '</text>';
    D.forEach(d => { g += '<circle class="thd ' + (lens ? TONE(d.lean[lens]) : 'pass') + '" data-th-pick="' + d.id + '" cx="' + sx(d.m.power).toFixed(1) + '" cy="' + sy(d.m.cost).toFixed(1) + '" r="2.1"/>'; });
    /* once a choice is kept: how people and AI agents chose, as two marks never mixed */
    if (kept) {
      C.people.forEach(e => { const d = T.designOf(NEED, e.pick); if (d) g += '<circle class="thmk people" cx="' + sx(d.m.power).toFixed(1) + '" cy="' + sy(d.m.cost).toFixed(1) + '" r="4.2"/>'; });
      C.agents.forEach(e => { const d = T.designOf(NEED, e.pick); if (d) { const x = sx(d.m.power), y = sy(d.m.cost); g += '<path class="thmk agents" d="M' + x.toFixed(1) + ' ' + (y - 4.6).toFixed(1) + 'l4.6 4.6-4.6 4.6-4.6-4.6z"/>'; } });
    }
    if (pick) { const x = sx(pick.m.power), y = sy(pick.m.cost); g += '<circle class="thpick" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6.5"/><circle class="thpickc" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6"/>'; }
    return '<figure class="thfig" data-f2="instrument">' + g + '</svg><figcaption class="small muted">' + esc(t(lens ? 'th.legend.lens' : 'th.legend', { who: lens ? t('th.person.' + lens + '.s') : '' })) + '</figcaption></figure>';
  }
  function goalbox(o) {
    const why = o.why.trim(), ok = { pick: !!o.pick, why: T.reasonOk(o.why), kept: !!S.done[ch.id] }, done = ok.kept;
    const gs = [{ k: 'pick', ok: ok.pick, v: o.pick || t('th.g.none'), f: ok.pick ? 1 : 0 },
      { k: 'why', ok: ok.why, v: t('th.g.chars', { n: why.length }), f: Math.min(1, why.length / T.REASON[0]) },
      { k: 'kept', ok: ok.kept, v: t(ok.kept ? 'th.g.yes' : 'th.g.notYet'), f: ok.kept ? 1 : 0 }];
    return '<div class="goalbox' + (done ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(done ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('th.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* the design picked: what a check measures (all passing), and its four choices, each with the people it leans toward */
  function card(d) {
    if (!d) return '<p class="small muted thnone">' + esc(t('th.pickFirst')) + '</p>';
    const S2 = T.sides(d);
    return '<div class="thcard"><p class="kicker">' + esc(t('th.card.k', { id: d.id })) + '</p><div class="thm">' + T.MEASURES.map(k => '<span><b>' + esc(t('th.m.' + k)) + '</b> ' + esc(val(k, d.m[k])) + ' <i class="good">✓</i></span>').join('') + '</div>' +
      '<ul class="thtraits">' + T.TRAITS.map(tr => { const v = d.traits[tr.id], lean = T.LEAN[tr.id][v] || {}, up = Object.keys(lean).filter(p => lean[p] > 0), dn = Object.keys(lean).filter(p => lean[p] < 0);
        return '<li><b>' + esc(t('th.trait.' + tr.id + '.t')) + '</b> ' + esc(t('th.trait.' + tr.id + '.' + v)) + '<span class="small">' + (up.length ? '<span class="thup">' + esc(t('th.helps', { who: up.map(p => t('th.person.' + p + '.s')).join(', ') })) + '</span>' : '') + (dn.length ? '<span class="thdn">' + esc(t('th.hurts', { who: dn.map(p => t('th.person.' + p + '.s')).join(', ') })) + '</span>' : '') + (!up.length && !dn.length ? '<span class="muted">' + esc(t('th.neither')) + '</span>' : '') + '</span></li>'; }).join('') + '</ul>' +
      '<p class="small">' + esc(t('th.card.sides', { best: t('th.person.' + S2.best + '.s'), worst: t('th.person.' + S2.worst + '.s') })) + '</p></div>';
  }
  /* how others chose for this need, read from the ledger's entries alone: people and AI agents apart */
  function others() {
    const C = choicesAt(world(S), NEED);
    const group = (k, list) => {
      const lean = T.leaningOf(NEED, list.map(e => e.pick));
      let h = '<section class="thgroup ' + k + '"><p class="kicker"><i class="thmark ' + k + '"></i>' + esc(t('th.grp.' + k, { n: list.length })) + '</p>';
      if (!list.length) return h + '<p class="small muted">' + esc(t('th.grp.' + k + '.none')) + '</p></section>';
      h += '<div class="thlean">' + T.PEOPLE.map(p => { const v = lean[p]; return '<span class="thlr"><span class="thln">' + esc(t('th.person.' + p + '.s')) + '</span><span class="thlb"><i class="' + (v >= 0 ? 'up' : 'dn') + '" style="' + (v >= 0 ? 'left:50%' : 'right:50%') + ';width:' + (Math.abs(v) / 2 * 50).toFixed(1) + '%"></i></span></span>'; }).join('') + '</div>';
      /* their own words, as data: quoted, never followed */
      h += '<ul class="threasons">' + list.slice(-6).reverse().map(e => '<li><q>' + esc(e.words) + '</q><span class="small muted">' + esc(e.by) + ' · ' + esc(e.pick) + (e.draft ? ' · ' + t('th.grp.yours') : '') + '</span></li>').join('') + '</ul>';
      return h + '</section>';
    };
    return '<div class="thothers"><p class="kicker">' + esc(t('th.others.k')) + '</p><p class="small muted">' + esc(t('th.others.d')) + '</p><div class="thgroups">' + group('people', C.people) + group('agents', C.agents) + '</div></div>';
  }
  function bench() {
    const o = set(), d = o.pick && T.designOf(NEED, o.pick);
    let h = head() + '<p class="small thintro">' + esc(t('th.intro', { n: D.length })) + '</p>' + goalbox(o) + figure(o);
    h += '<div class="chips thact"><button type="button" class="chipb" data-th-random>' + esc(t('th.random')) + '</button>' + (o.lens ? '<button type="button" class="chipb" data-th-kind>' + esc(t('th.kind', { who: t('th.person.' + o.lens + '.s') })) + '</button>' : '') + '</div>';
    h += card(d);
    if (view.slip && draftOf(S, view.slip)) h += slipHtml(S, view.slip);
    else if (d) h += '<div class="keep thkeep"><label class="lab" for="th-why"><b>' + esc(t('th.why.t')) + '</b></label><input type="text" id="th-why" data-th-why maxlength="' + T.REASON[1] + '" value="' + esc(o.why) + '" placeholder="' + esc(t('th.why.ph')) + '" autocomplete="off">' +
      '<p class="small muted">' + esc(t('th.why.d')) + '</p>' + signHtml(o.name != null ? Object.assign({}, S, { name: o.name }) : S, 'person') + (view.no ? '<p class="small bad">' + esc(view.no) + '</p>' : '') + '<button type="button" class="btn primary" data-th-keep>' + esc(t('th.keep')) + '</button></div>';
    if (view.slip || S.done[ch.id]) h += others();
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('th.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('th.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('th.note')) + '</p>' + doneNote() + reward();
  }
  const pickOne = id => { const o = set(); if (o.pick !== id) { o.pick = id; view.slip = null; view.no = null; } draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = s => e.target.closest(s), o = set();
      const p = q('[data-th-pick]'); if (p) return pickOne(p.dataset.thPick);
      const ln = q('[data-th-lens]'); if (ln) { o.lens = o.lens === ln.dataset.thLens ? null : ln.dataset.thLens; draw(); return true; }
      /* a tap on the field between the dots picks the nearest design */
      const svg = q('.thfig svg'); if (svg && svg.getScreenCTM && !q('[data-th-lens]')) { const M = svg.getScreenCTM(); if (M) { const P = new DOMPoint(e.clientX, e.clientY).matrixTransform(M.inverse());
        if (P.x >= X0 - 4 && P.y <= Y1 + 4) { let best = null, bd = Infinity; D.forEach(d => { const dd = (sx(d.m.power) - P.x) ** 2 + (sy(d.m.cost) - P.y) ** 2; if (dd < bd) { bd = dd; best = d; } }); if (best && bd < 400) return pickOne(best.id); } } }
      if (q('[data-th-random]')) { const r = D[Math.floor(Math.random() * D.length)]; return pickOne(r.id); }
      if (q('[data-th-kind]')) { const good = D.filter(d => d.lean[o.lens] >= 2); if (good.length) return pickOne(good[Math.floor(Math.random() * good.length)].id); return true; }
      if (q('[data-th-keep]')) {
        const box = el.querySelector('.thkeep') || el, sign = signOf(box);
        if (!T.reasonOk(o.why)) { view.no = t('ledger.no.reason'); draw(); show('.thkeep'); return true; }
        const k = keep(S, { kind: 'try', choice: NEED, pick: o.pick, words: o.why.trim() }, 'choice ' + NEED, sign);
        view.no = k.ok ? null : refusal(k.r);
        if (k.ok) { view.slip = k.e.id; o.name = null; save(); L.ctx.kept && L.ctx.kept(k.e); win(); }
        draw(); fx(); show('.slip, .thkeep'); return true;
      }
      if (slipClick(e, S, redraw => { save(); if (redraw) { view.slip = null; draw(); } })) return true;
      return false; },
    input(e) {
      const w = e.target.closest('[data-th-why]'); if (w) { set().why = w.value; view.no = null; draw(); return true; }
      const n = e.target.closest('[data-sign]'); if (n && e.target.closest('.thkeep')) { set().name = n.value; return true; }
      return false;
    }
  };
}
