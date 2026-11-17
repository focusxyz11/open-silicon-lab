/* What if? between the islands (#/whatif): five levers, each on the island where it is decided, and the change they
   make arriving at the other islands. The model is src/engines/ripple.js (brought over from the first version of the
   site); the islands answer it in 3D (src/v2/map3d.js whatif: a column and a tag over each island it reaches, a light
   flying from the lever's island). On a desktop the levers stand in a bench at the side and the world is the
   picture; on a phone the map stays a picture and the bench lists where the change lands, since tags over far
   islands would crowd a small screen (CLAUDE.md, desktop first where it is richer).
   whatif(sheet, ctx) draws into the sheet; ctx: { S, save(), map, name(place), close() }. Returns { pick(place) }. */
import { t } from '../core/i18n.js';
import * as R from '../engines/ripple.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const wide = () => innerWidth > 720;

export function whatif(sheet, ctx) {
  const S = ctx.S, W = S.whatif, view = { sel: null, ind: null, just: null };
  const now = () => { const res = R.ripple(W.levers); return { res, heads: R.placeHeads(res, W.levers) }; };
  const changeOf = (id, v) => R.fmt(v, R.IND[id].unit);
  /* the islands in the order the change reaches them, then by how much */
  const landing = heads => Object.values(heads).sort((a, b) => (b.lever - a.lever) || a.depth - b.depth || Math.abs(b.top.v) - Math.abs(a.top.v));

  function paintMap(heads, moved) {
    if (!ctx.map) return;
    const res = R.ripple(W.levers), reach = R.reach(res, W.levers);
    const flights = moved ? Object.entries(reach).filter(([id]) => moved.includes(id)).map(([, r]) => r) : [];
    ctx.map.whatif({ flights: flights.length ? flights : null, heads: Object.values(heads).map(h => ({ place: h.place, v: h.top.unit === 'yr' ? h.top.v * 20 : h.top.v, up: h.top.v > 0, lever: h.lever,
      /* a tag is small, the island's name and its largest change; what changes shows when it is pointed at */
      html: '<b>' + esc(ctx.name(h.place)) + '</b><span class="wv">' + esc(changeOf(h.top.id, h.top.v)) + '</span><span class="wn">' + esc(t('whatif.ind.' + h.top.id)) + '</span>' + (h.all.length > 1 ? '<span class="wm">' + esc(t('whatif.ui.more', { n: h.all.length - 1 })) + '</span>' : '') })) });
  }

  function leverRow(l) {
    const v = W.levers[l.id];
    return '<div class="wfl' + (v ? ' moved' : '') + '"><label for="wf-' + l.id + '"><b>' + esc(t('whatif.lever.' + l.id + '.t')) + '</b><button type="button" class="wfat small" data-wf-pick="' + l.place + '">' + esc(ctx.name(l.place)) + '</button><output>' + esc(v ? R.fmt(v, l.unit) : t('whatif.ui.today')) + '</output></label>' +
      '<input type="range" id="wf-' + l.id + '" data-wf-lever="' + l.id + '" min="' + l.min + '" max="' + l.max + '" step="' + l.step + '" value="' + v + '"><p class="small muted wfd">' + esc(t('whatif.lever.' + l.id + '.d')) + '</p></div>';
  }
  /* one island: what it feels, each change a button that shows the chain behind it */
  function island(h, res) {
    let x = '<div class="wfisle"><p class="kicker">' + esc(ctx.name(h.place)) + (h.lever ? ' · ' + esc(t('whatif.ui.leverHere')) : '') + '</p><div class="wfch">' +
      h.all.map(c => '<button type="button" class="wfc ' + (c.v > 0 ? 'up' : 'down') + (view.ind === c.id ? ' on' : '') + '" data-wf-ind="' + c.id + '"><span class="wv">' + esc(changeOf(c.id, c.v)) + '</span> ' + esc(t('whatif.ind.' + c.id)) + '</button>').join('') + '</div>';
    if (view.ind && h.all.some(c => c.id === view.ind) && !R.LEVER_OF[view.ind]) {
      const path = R.chain(res, view.ind);
      x += '<ol class="wfchain">' + path.map((s, i) => '<li><span class="wv">' + esc(changeOf(s.id, s.v)) + '</span> ' + esc(t('whatif.ind.' + s.id)) + ' <span class="small muted">' + esc(ctx.name(R.IND[s.id].place)) + '</span>' +
        (s.rule ? '<span class="small wfrule">' + esc(t('whatif.rule.' + s.rule)) + '</span><span class="small muted wfwhy">' + esc(t('whatif.why.' + s.rule)) + '</span>' : '') + '</li>').join('') + '</ol>';
    }
    return x + '</div>';
  }

  function draw(moved) {
    const { res, heads } = now(), any = Object.values(W.levers).some(Boolean), L = landing(heads);
    /* the puzzles: a newly solved one says what it shows */
    R.solved(W.levers).forEach(id => { if (!W.solved[id]) { W.solved[id] = true; view.just = id; ctx.save(); } });
    /* the levers are drawn once and only their values change while one is dragged (a new slider would drop the drag) */
    if (!sheet.querySelector('.wflevers')) sheet.innerHTML = '<button type="button" class="x" data-wf-close aria-label="' + esc(t('sheet.close')) + '">×</button><p class="kicker">' + esc(t('whatif.ui.kicker')) + '</p><h2>' + esc(t('whatif.ui.title')) + '</h2>' +
      '<p class="small muted">' + esc(t('whatif.ui.lead')) + '</p><div class="wflevers">' + R.LEVERS.map(leverRow).join('') + '</div><div class="wfdyn"></div>';
    R.LEVERS.forEach(l => { const v = W.levers[l.id], r = sheet.querySelector('#wf-' + l.id); if (!r) return; if (+r.value !== v && document.activeElement !== r) r.value = v;
      r.closest('.wfl').classList.toggle('moved', !!v); r.closest('.wfl').querySelector('output').textContent = v ? R.fmt(v, l.unit) : t('whatif.ui.today'); });
    let h = '<div class="chips wfpre">' + R.PRESETS.map(p => '<button type="button" class="chipb" data-wf-preset="' + p.id + '" title="' + esc(t('whatif.preset.' + p.id + '.d')) + '">' + esc(t('whatif.preset.' + p.id + '.t')) + '</button>').join('') +
      (any ? '<button type="button" class="chipb" data-wf-reset>' + esc(t('whatif.ui.reset')) + '</button>' : '') + '</div>';
    /* where it lands: the island you picked, or (on a phone, where the map carries no tags) every island it reaches */
    const sel = view.sel && heads[view.sel];
    if (!any) h += '<p class="small hint">' + esc(t('whatif.ui.start')) + '</p>';
    else if (sel) h += island(sel, res) + '<button type="button" class="link" data-wf-pick="">' + esc(t('whatif.ui.all')) + '</button>';
    else if (view.sel) h += '<p class="small muted">' + esc(t('whatif.ui.untouched', { place: ctx.name(view.sel) })) + '</p>';
    else h += '<p class="kicker">' + esc(t('whatif.ui.lands', { n: L.length })) + '</p>' + (wide() ? '<p class="small muted">' + esc(t('whatif.ui.tapTag')) + '</p>' : '') +
      '<div class="wflands">' + L.map(x => '<button type="button" class="wfland ' + (x.top.v > 0 ? 'up' : 'down') + '" data-wf-pick="' + x.place + '"><b>' + esc(ctx.name(x.place)) + '</b><span class="wv">' + esc(changeOf(x.top.id, x.top.v)) + '</span><span class="small">' + esc(t('whatif.ind.' + x.top.id)) + '</span></button>').join('') + '</div>';
    h += '<details class="wfpuz"' + (view.just ? ' open' : '') + '><summary>' + esc(t('whatif.ui.puzzles', { n: Object.keys(W.solved).length, total: R.PUZZLES.length })) + '</summary><ol>' +
      R.PUZZLES.map(p => '<li class="' + (W.solved[p.id] ? 'done' : '') + (view.just === p.id ? ' just' : '') + '"><span>' + esc(t('whatif.puzzle.' + p.id + '.t')) + '</span>' + (W.solved[p.id] ? '<span class="small good">' + esc(t('whatif.puzzle.' + p.id + '.done')) + '</span>' : '') + '</li>').join('') + '</ol></details>';
    h += '<p class="small muted wfnote">' + esc(t('whatif.ui.note')) + '</p>';
    sheet.querySelector('.wfdyn').innerHTML = h;
    paintMap(heads, moved);
  }

  const set = (levers, moved) => { W.levers = R.normalLevers(levers); view.ind = null; ctx.save(); draw(moved); };
  /* while a lever is dragged the islands follow it; when it is let go, the light flies from its island */
  sheet.oninput = e => { const r = e.target.closest('[data-wf-lever]'); if (!r) return; set(Object.assign({}, W.levers, { [r.dataset.wfLever]: +r.value }), null); };
  sheet.onchange = e => { const r = e.target.closest('[data-wf-lever]'); if (r) draw([r.dataset.wfLever]); };
  sheet.onclick = e => {
    const q = s => e.target.closest(s);
    if (q('[data-wf-close]')) return ctx.close();
    const p = q('[data-wf-preset]'); if (p) { const P = R.PRESETS.find(x => x.id === p.dataset.wfPreset); view.sel = null; return set(Object.assign({}, R.NEUTRAL, P.set), Object.keys(P.set)); }
    if (q('[data-wf-reset]')) { view.sel = null; return set(R.NEUTRAL, null); }
    const k = q('[data-wf-pick]'); if (k) { view.sel = k.dataset.wfPick || null; view.ind = null; return draw(null); }
    const i = q('[data-wf-ind]'); if (i) { view.ind = view.ind === i.dataset.wfInd ? null : i.dataset.wfInd; return draw(null); }
  };
  draw(null);
  return { pick(place) { view.sel = place; view.ind = null; draw(null); }, lever(id) { const l = R.LEVERS.find(x => x.id === id); if (l) { view.sel = l.place; draw(null); const r = sheet.querySelector('#wf-' + id); if (r) r.focus(); } } };
}
