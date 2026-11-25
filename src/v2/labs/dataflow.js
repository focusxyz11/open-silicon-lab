/* Keep the numbers on the chip (kind 'dataflow', at the chip), from src/engines/paradigms.js: the core questions "Where
   does it go" and "Do more with less". A processor fetches a model's weights from memory off the chip every time the
   model runs, and fetching costs far more than the arithmetic. A dataflow chip lays the model's layers across its
   tiles, each tile with memory of its own, so the weights stay where the work happens and the numbers flow from tile to
   tile. The player first guesses what one layer left off the chip costs, then lays models of different sizes across
   chips of different sizes, and finds the largest model a chip holds whole. The goal is the engine's own check
   (checkDataflowEdge, with checkSpatialFit): the model fits whole, and one layer more was tried and does not.
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import { still } from '../../core/ui.js';
import * as P from '../../engines/paradigms.js';

export const RIGHT = 2, PER_ROW = 8, SAVES = 50;
export const START = { layers: 6, tiles: 24 };
export const RANGE = { layers: [1, 24], tiles: [8, 48] };
/* the question asked before you look: nine of ten layers on the chip, the tenth fetched */
export const ASKED = { layers: 10, tiles: 18 };
const SPLIT = P.FLOW.mbPerLayer / P.FLOW.mbPerTile;      // tiles a layer fills
/* where each tile stands on the chip, in the order the layers fill them: row by row, each row the other way */
export function tileAt(i) { const r = Math.floor(i / PER_ROW), c = i % PER_ROW; return [r % 2 ? PER_ROW - 1 - c : c, r]; }
/* the layer each tile holds (-1: empty), and how many layers (in halves) stay in memory */
export function layout(layers, tiles) {
  const tl = Array.from({ length: tiles }, (_, i) => (Math.floor(i / SPLIT) < layers ? Math.floor(i / SPLIT) : -1));
  const onHalves = Math.min(layers * SPLIT, tiles);
  return { tiles: tl, offTiles: layers * SPLIT - onHalves };
}

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const set = () => view.dfl || (view.dfl = Object.assign({ guess: null, tried: [] }, START));
  const num = (v, d = 0) => v.toLocaleString('en', { maximumFractionDigits: d });
  const pct = v => t('dfl.pct', { v: v > 0.99 && v < 1 ? num(v * 100, 1) : Math.round(v * 100) });
  const uj = v => (v >= 1000 ? t('dfl.mj', { v: num(v / 1000, v >= 10000 ? 0 : 1) }) : t('dfl.uj', { v: num(v) }));
  const times = v => num(v, v >= 10 ? 0 : 1);
  const see = o => { o.tried.push({ layers: o.layers, tiles: o.tiles }); if (o.tried.length > 400) o.tried.shift(); };
  const moreSeen = o => o.tried.find(c => c.layers === o.layers + 1 && c.tiles === o.tiles);

  /* the chip: its tiles, each holding a part of one layer; the layers that do not fit wait in memory beside it */
  function figure(o, D) {
    const W = 330, H = 212, pitch = 24, sz = 20, gx = 22, gy = 40, rows = Math.ceil(o.tiles / PER_ROW), Lo = layout(o.layers, o.tiles);
    const cxy = i => { const [c, r] = tileAt(i); return [gx + c * pitch + sz / 2, gy + r * pitch + sz / 2]; };
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('dfl.aria', { l: o.layers, n: o.tiles, p: pct(D.fit) })) + '">';
    s += '<text class="ax" x="' + (gx - 6) + '" y="22">' + esc(t('dfl.fig.chip', { n: o.tiles, mb: o.tiles * P.FLOW.mbPerTile })) + '</text>';
    s += '<rect class="die" x="' + (gx - 8) + '" y="' + (gy - 8) + '" width="' + (PER_ROW * pitch - 4 + 16) + '" height="' + (rows * pitch - 4 + 16) + '" rx="8"/>';
    Lo.tiles.forEach((k, i) => { const [x, y] = cxy(i);
      s += '<rect class="tl' + (k < 0 ? ' free' : ' l' + (k % 2)) + '" x="' + (x - sz / 2) + '" y="' + (y - sz / 2) + '" width="' + sz + '" height="' + sz + '" rx="3.5"/>';
      if (k >= 0 && i % SPLIT === 0) s += '<text class="ln" x="' + x + '" y="' + (y + 3) + '" text-anchor="middle">' + (k + 1) + '</text>'; });
    /* the numbers' way through the chip, layer to layer, with one number moving along it */
    const used = Lo.tiles.map((k, i) => (k >= 0 ? cxy(i) : null)).filter(Boolean);
    if (used.length > 1) {
      const d = 'M' + used.map(p => p.join(' ')).join('L');
      s += '<path class="way" d="' + d + '"/>';
      if (!still()) s += '<circle class="act" r="3.4"><animateMotion dur="' + (used.length * 0.22).toFixed(2) + 's" repeatCount="indefinite" path="' + d + '"/></circle>';
    }
    /* memory off the chip, the layers that wait there, and the way they come in, every answer */
    const dieH = rows * pitch + 12, mx = 252, my = gy - 8, mw = 66, mh = Math.max(dieH, 112), off = Lo.offTiles / SPLIT;
    s += '<text class="ax" x="' + (mx + mw) + '" y="22" text-anchor="end">' + esc(t('dfl.fig.mem')) + '</text><rect class="mem' + (off ? ' busy' : '') + '" x="' + mx + '" y="' + my + '" width="' + mw + '" height="' + mh + '" rx="6"/>';
    const slabs = Math.ceil(off), sh = Math.min(9, (mh - 16) / Math.max(1, slabs) - 2);
    for (let j = 0; j < slabs; j++) { const part = Math.min(1, off - j), y = my + 8 + j * (sh + 2);
      s += '<rect class="slab l' + ((o.layers - slabs + j) % 2) + '" x="' + (mx + 8 + (mw - 16) * (1 - part)) + '" y="' + y.toFixed(1) + '" width="' + ((mw - 16) * part).toFixed(1) + '" height="' + sh.toFixed(1) + '" rx="2"/>'; }
    if (!off) s += '<text class="ax" x="' + (mx + mw / 2) + '" y="' + (my + mh / 2 + 3) + '" text-anchor="middle">' + esc(t('dfl.fig.idle')) + '</text>';
    const ay = gy - 8 + Math.min(dieH, mh) / 2, ax0 = gx - 8 + PER_ROW * pitch + 12;
    if (off) {
      s += '<path class="fetch" d="M' + (mx - 2) + ' ' + ay + 'H' + (ax0 + 4) + '"/><path class="tip" d="M' + (ax0 + 10) + ' ' + (ay - 6) + 'L' + ax0 + ' ' + ay + 'L' + (ax0 + 10) + ' ' + (ay + 6) + 'z"/>';
      if (!still()) s += '<circle class="wt" r="3"><animateMotion dur="0.9s" repeatCount="indefinite" path="M' + (mx - 2) + ' ' + ay + 'H' + (ax0 + 4) + '"/></circle>';
      s += '<text class="lbl warm" x="' + (mx + mw) + '" y="' + (my + mh + 12) + '" text-anchor="end">' + esc(t('dfl.fig.fetched', { n: num(off, 1) })) + '</text>';
    }
    return '<figure class="dflfig" data-f2="instrument">' + s + '</svg><figcaption class="small muted">' + esc(t('dfl.legend')) + '</figcaption></figure>';
  }
  function goalbox(o, D) {
    const m = moreSeen(o), mf = m ? P.dataflowParts(m).fit : null, whole = D.fit >= 1, more = whole && m && mf < 1, met = P.checkDataflowEdge(o);
    const gs = [{ k: 'whole', ok: whole, v: pct(D.fit), target: t('dfl.t.whole'), f: D.fit },
      { k: 'more', ok: !!more, v: !m ? t('dfl.notyet') : mf >= 1 ? t('dfl.fitsToo') : pct(mf), target: t('dfl.t.more'), f: more ? 1 : m ? 0.5 : 0 },
      { k: 'saves', ok: D.saves >= SAVES, v: t('dfl.v.saves', { v: times(D.saves) }), target: t('dfl.t.saves', { v: SAVES }), f: Math.min(1, Math.log(D.saves) / Math.log(SAVES)) }];
    return '<div class="goalbox' + (met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('dfl.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (Math.max(0, g.f) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  /* the energy of one answer, two ways: weights kept on the chip (what still comes from memory in warm), or every weight fetched */
  function energy(D) {
    const top = Math.max(D.uj, D.vn), w = v => (v / top * 100).toFixed(2);
    const row = (k, total, parts) => '<div class="dflrow"><span class="dfln">' + esc(t('dfl.e.' + k)) + '</span><span class="dflbar">' + parts.map(([c, v]) => '<i class="' + c + '" style="width:' + w(v) + '%"></i>').join('') + '</span><b class="mono">' + esc(uj(total)) + '</b></div>';
    return '<div class="dflen"><p class="kicker">' + esc(t('dfl.e.t')) + '</p>' + row('flow', D.uj, [['on', D.on], ['off', D.off]]) + row('vn', D.vn, [['off', D.vn]]) +
      '<p class="dflkey small muted"><span><i class="on"></i>' + esc(t('dfl.e.on')) + '</span><span><i class="off"></i>' + esc(t('dfl.e.off')) + '</span></p>' +
      '<p class="small">' + esc(D.off > 0 ? t('dfl.e.share', { p: pct(D.offShare), mb: num((1 - D.fit) * set().layers * P.FLOW.mbPerLayer, 1) }) : t('dfl.e.none', { x: times(D.saves) })) + '</p></div>';
  }
  const dial = (id, value) => '<div class="dfldial"><label class="lab" for="dfl-' + id + '"><b>' + esc(t('dfl.set.' + id)) + '</b> <output>' + esc(value) + '</output></label><div class="dflstep"><button type="button" class="chipb" data-dfl-nudge="' + id + ':-1" aria-label="' + esc(t('dfl.less')) + '">−</button><input type="range" id="dfl-' + id + '" data-dfl="' + id + '" min="' + RANGE[id][0] + '" max="' + RANGE[id][1] + '" step="1" value="' + set()[id] + '"><button type="button" class="chipb" data-dfl-nudge="' + id + ':1" aria-label="' + esc(t('dfl.more')) + '">+</button></div></div>';
  function guessHtml() {
    return head() + '<p class="small dflintro">' + esc(t('dfl.intro')) + '</p><p class="kicker">' + esc(t('dfl.predictK')) + '</p><p class="small">' + esc(t('dfl.predict')) + '</p>' +
      '<div class="chips">' + [0, 1, 2].map(i => '<button type="button" class="chipb" data-dfl-guess="' + i + '">' + esc(t('dfl.guess.' + i)) + '</button>').join('') + '</div>' + reward();
  }
  function bench() {
    const o = set(); if (o.guess == null) return guessHtml();
    const D = P.dataflowParts(o), asked = P.dataflowParts(ASKED), met = P.checkDataflowEdge(o);
    let h = head() + '<p class="small dflreveal ' + (o.guess === RIGHT ? 'good' : '') + '">' + esc(t(o.guess === RIGHT ? 'dfl.right' : 'dfl.wrong', { p: pct(asked.offShare), x: times((P.E16.dram / 16) / (P.E16.sram32k / 16)) })) + '</p>' + goalbox(o, D) + figure(o, D);
    h += dial('layers', t('dfl.v.layers', { n: o.layers, mb: o.layers * P.FLOW.mbPerLayer })) + dial('tiles', t('dfl.v.tiles', { n: o.tiles, mb: o.tiles * P.FLOW.mbPerTile }));
    const roomy = D.fit >= 1 && P.dataflowParts({ layers: o.layers + 1, tiles: o.tiles }).fit >= 1;
    const msg = met ? 'met' : D.fit < 1 ? 'spill' : roomy ? 'room' : 'try';
    const next = P.dataflowParts({ layers: o.layers + 1, tiles: o.tiles });
    h += '<p class="small dflmsg ' + (met ? 'good' : msg === 'spill' ? 'bad' : '') + '">' + esc(t('dfl.msg.' + msg, { p: pct(D.fit), s: pct(D.offShare), free: o.tiles - o.layers * SPLIT, l: o.layers, mb: o.layers * P.FLOW.mbPerLayer, x: times(next.uj / D.uj) })) + '</p>' + energy(D);
    if (!S.done[ch.id]) h += view.hint ? '<p class="small hint">' + esc(t('dfl.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    else h += '<p class="small good">' + esc(t('dfl.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('dfl.note')) + '</p>' + doneNote() + reward();
  }
  /* a move: what was tried is kept, and the engine's check on it decides */
  const after = () => { const o = set(); see(o); if (P.checkDataflowEdge(o)) win(); draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) {
      const q = s => e.target.closest(s), o = set();
      const g = q('[data-dfl-guess]'); if (g) { o.guess = +g.dataset.dflGuess; see(o); draw(); fx(); return true; }
      const n = q('[data-dfl-nudge]'); if (n) { const [k, d] = n.dataset.dflNudge.split(':'); o[k] = Math.min(RANGE[k][1], Math.max(RANGE[k][0], o[k] + +d)); return after(); }
      return false;
    },
    input(e) { const r = e.target.closest('[data-dfl]'); if (!r) return false; set()[r.dataset.dfl] = +r.value; return after(); }
  };
}
