/* Read the die (kind 'xray', at the Test step), from src/engines/dies.js: the first site's chip X-ray as one
   challenge. A die photo comes up with no names on it, turned at random: say what kind of chip it is, then find each
   kind of block on it by its texture. Memory is a perfectly regular grid, logic fine noise, repeated cores copies of
   one tile, hand-drawn circuits a few large shapes; where the area goes tells you what a chip is for. The goal is the
   engine's own check (met). A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as D from '../../engines/dies.js';

const W = 300, M = 6, S = W - 2 * M;
/* a die photo's textures, each a pattern drawn in the photo's own colours (--xr-*, the same by day and by night:
   a photo of a die looks the same in either) */
const SPECK = (cls, seed) => { const r = D.rng(seed); let s = ''; for (let i = 0; i < 9; i++) s += '<rect class="' + cls + (i % 3) + '" x="' + (r() * 11).toFixed(1) + '" y="' + (r() * 11).toFixed(1) + '" width="' + (0.8 + r() * 1.8).toFixed(1) + '" height="' + (0.6 + r() * 1.2).toFixed(1) + '"/>'; return s; };
const DEFS = '<defs>' +
  '<pattern id="xr-cache" width="3" height="3" patternUnits="userSpaceOnUse"><rect class="xc" width="3" height="3"/><path class="xcl" d="M0 0.5h3M0.5 0v3"/></pattern>' +
  '<pattern id="xr-flash" width="5" height="5" patternUnits="userSpaceOnUse"><rect class="xf" width="5" height="5"/><path class="xcl" d="M0 0.5h5M0.5 0v5"/></pattern>' +
  '<pattern id="xr-dram" width="2" height="2" patternUnits="userSpaceOnUse"><rect class="xd" width="2" height="2"/><path class="xcl" d="M0 0.4h2M0.4 0v2"/></pattern>' +
  '<pattern id="xr-core" width="12" height="12" patternUnits="userSpaceOnUse"><rect class="xk" width="12" height="12"/>' + SPECK('xks', 3) + '</pattern>' +
  '<pattern id="xr-gpu" width="12" height="12" patternUnits="userSpaceOnUse"><rect class="xg" width="12" height="12"/>' + SPECK('xgs', 5) + '</pattern>' +
  '<pattern id="xr-logic" width="12" height="12" patternUnits="userSpaceOnUse"><rect class="xl" width="12" height="12"/>' + SPECK('xls', 7) + SPECK('xls', 9) + '</pattern>' +
  '<pattern id="xr-phyh" width="4" height="4" patternUnits="userSpaceOnUse"><rect class="xp" width="4" height="4"/><path class="xpl" d="M0 1h4"/></pattern>' +
  '<pattern id="xr-phyv" width="4" height="4" patternUnits="userSpaceOnUse"><rect class="xp" width="4" height="4"/><path class="xpl" d="M1 0v4"/></pattern>' +
  '<pattern id="xr-adc" width="3" height="3" patternUnits="userSpaceOnUse"><rect class="xa" width="3" height="3"/><path class="xal" d="M1 0v3"/></pattern>' +
  '<pattern id="xr-pixels" width="4" height="4" patternUnits="userSpaceOnUse"><rect class="xpg" width="2" height="2"/><rect class="xpr" x="2" width="2" height="2"/><rect class="xpb" y="2" width="2" height="2"/><rect class="xpg" x="2" y="2" width="2" height="2"/></pattern>' +
  '</defs>';

export default function lab(L) {
  const { S: St, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const st = () => view.xr || (view.xr = { deck: D.deal(D.rng(11)), i: 0, answered: null, named: 0, finds: {}, cleared: [], pick: null, seed: 11 });
  const tn = k => t(k === 'other' ? 'xray.other' : 'xray.type.' + k + '.t');
  const cur = () => { const s = st(), r = s.deck[s.i]; return Object.assign({}, r, { blocks: D.flipped(D.plan(r.kind), r.flip) }); };
  const want = () => { const s = st(), r = cur(), got = s.finds[s.i] || []; return D.askFor(r.kind).find(k => !got.includes(k)) || null; };
  const check = () => { const s = st(); if (D.met(s)) win(); };

  /* one block, drawn with its texture, and what the texture alone cannot say (a core's own cache, a GPU's band of
     memory, an AI engine's array, coils of hand-drawn circuits) */
  function block(b, i, mark) {
    const x = M + b.x * S, y = M + b.y * S, w = b.w * S, h = b.h * S, r = v => v.toFixed(1);
    const fill = b.type === 'phy' ? (w < h ? 'url(#xr-phyv)' : 'url(#xr-phyh)') : b.type === 'npu' || b.type === 'analog' || b.type === 'io' ? null : 'url(#xr-' + b.type + ')';
    let s = '<g class="xrb' + (mark ? ' ' + mark : '') + '" data-xr-b="' + i + '" data-xr-type="' + b.type + '">';
    s += '<rect class="xr-' + b.type + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '"' + (fill ? ' fill="' + fill + '"' : '') + '/>';
    if (b.type === 'core') s += '<rect x="' + r(x + w * 0.62) + '" y="' + r(y + h * 0.08) + '" width="' + r(w * 0.32) + '" height="' + r(h * 0.38) + '" fill="url(#xr-cache)"/>';
    if (b.type === 'gpu') s += '<rect x="' + r(x + w * 0.1) + '" y="' + r(y + h * 0.1) + '" width="' + r(w * 0.8) + '" height="' + r(h * 0.18) + '" fill="url(#xr-cache)"/>';
    if (b.type === 'npu') { const n = 7; for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) s += '<rect class="xn' + ((a + c) % 2) + '" x="' + r(x + w * (0.08 + 0.84 * a / n)) + '" y="' + r(y + h * (0.08 + 0.84 * c / n)) + '" width="' + r(w * 0.84 / n - 1) + '" height="' + r(h * 0.84 / n - 1) + '"/>'; }
    if (b.type === 'analog') { const q = D.rng(Math.round((b.x + b.y * 7) * 1000)); for (let k = 0; k < 2; k++) { const sz = Math.min(w, h) * (0.16 + q() * 0.14), cx = x + w * (0.25 + 0.5 * q()), cy = y + h * (0.3 + 0.4 * q()); for (let j = 0; j < 3; j++) { const d = sz * (1 - j * 0.3); s += '<rect class="xcoil" x="' + r(cx - d) + '" y="' + r(cy - d) + '" width="' + r(2 * d) + '" height="' + r(2 * d) + '"/>'; } } }
    return s + '</g>';
  }
  function figure(r, s) {
    const named = s.answered != null, got = s.finds[s.i] || [], P = s.pick;
    let h = '<svg viewBox="0 0 ' + W + ' ' + W + '" role="img" aria-label="' + esc(t('xr.aria')) + '">' + DEFS + '<rect class="xrdie" x="' + M + '" y="' + M + '" width="' + S + '" height="' + S + '" rx="2"/>';
    r.blocks.forEach((b, i) => { const mark = P && P.i === i ? (P.ok ? 'ok' : 'bad') : named && got.includes(b.type) && b.type !== 'io' ? 'found' : ''; h += block(b, i, mark); });
    return '<figure class="xrfig" data-f2="instrument">' + h + '</svg></figure>';
  }
  /* where the area goes, once the chip is named */
  function area(r) {
    const s = D.shares(r.blocks), order = Object.keys(s).filter(k => s[k] > 0.004).sort((a, b) => (a === 'other') - (b === 'other') || s[b] - s[a]);
    return '<p class="kicker">' + esc(t('xray.area')) + '</p><div class="xrbar" role="img" aria-label="' + esc(order.map(k => tn(k) + ' ' + Math.round(s[k] * 100) + '%').join(', ')) + '">' +
      order.map(k => '<i class="xk-' + k + '" style="flex:' + s[k].toFixed(4) + '"></i>').join('') + '</div><p class="xrkey small muted">' + order.map(k => '<span><i class="xk-' + k + '"></i>' + esc(tn(k)) + ' ' + Math.round(s[k] * 100) + '%</span>').join('') + '</p>';
  }
  function goalbox(s) {
    const r = cur(), total = D.askFor(r.kind).length, got = (s.finds[s.i] || []).length, ok = D.met(s), best = Math.max(got / total, s.cleared.length ? 1 : 0);
    const gs = [{ k: 'named', ok: s.named >= D.GOAL.named, v: s.named + ' / ' + D.GOAL.named, f: Math.min(1, s.named / D.GOAL.named) },
      { k: 'found', ok: s.cleared.length >= 1, v: s.cleared.length ? t('xr.cleared', { n: s.cleared.length }) : t('xray.found', { n: got, total }), f: best }];
    return '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('xr.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + '</span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
  }
  function bench() {
    const s = st(), r = cur(), named = s.answered != null, w = want(), P = s.pick;
    let h = head() + '<p class="small xrintro">' + esc(t('xray.q')) + '</p>' + goalbox(s) + figure(r, s);
    if (!named) {
      h += '<p class="lab"><b>' + esc(t('xr.ask')) + '</b></p><div class="chips xrkinds">' + D.KIND_IDS.map(k => '<button type="button" class="chipb" data-xr-kind="' + k + '">' + esc(t('xr.kind.' + k)) + '</button>').join('') + '</div>';
    } else {
      const ok = s.answered === r.kind;
      h += '<p class="small xrsay ' + (ok ? 'good' : 'bad') + '"><b>' + esc(t(ok ? 'xr.right' : 'xr.no', { kind: t('xr.kind.' + r.kind) })) + '</b> ' + esc(t('xr.why.' + r.kind)) + '</p>' + area(r);
      if (w) {
        h += '<p class="lab xrfind"><b>' + esc(t('xray.find', { type: tn(w) })) + '</b></p>';
        if (P) h += '<p class="small ' + (P.ok ? 'good' : 'bad') + '">' + (P.wiring ? esc(t('xr.wiring')) : '<b>' + esc(tn(P.type)) + '.</b> ' + esc(t('xray.type.' + P.type + '.clue')) + (P.ok ? '' : ' ' + esc(t('xray.wrong', { type: tn(P.want) })))) + '</p>';
        h += view.xrClue ? '<p class="small hint">' + esc(t('xray.hint', { clue: t('xray.type.' + w + '.clue') })) + '</p>' : '';
        h += '<div class="chips"><button type="button" class="chipb" data-xr-clue>' + esc(t('xr.clue')) + '</button><button type="button" class="chipb" data-xr-next>' + esc(t('xr.next')) + ' →</button></div>';
      } else h += '<p class="small good">' + esc(t('xray.done')) + '</p><div class="chips"><button type="button" class="btn primary" data-xr-next>' + esc(t('xr.next')) + ' →</button></div>';
    }
    if (St.done[ch.id]) h += '<p class="small good">' + esc(t('xr.done')) + '</p>';
    return h + '<p class="small muted">' + esc(t('xray.note')) + '</p>' + doneNote() + reward();
  }
  const redraw = () => { draw(); fx(); return true; };
  return {
    draw: bench,
    click(e) { const q = sel => e.target.closest(sel), s = st();
      const k = q('[data-xr-kind]'); if (k && s.answered == null) { s.answered = k.dataset.xrKind; if (s.answered === cur().kind) s.named++; check(); return redraw(); }
      if (q('[data-xr-next]')) { s.i++; if (s.i >= s.deck.length) { s.seed++; s.deck = D.deal(D.rng(s.seed)); s.i = 0; s.finds = {}; } s.answered = null; s.pick = null; view.xrClue = false; return redraw(); }
      if (q('[data-xr-clue]')) { view.xrClue = true; return redraw(); }
      const b = q('[data-xr-b]'), fig = q('.xrfig');
      if (fig && s.answered != null) { const w = want(); if (!w) return true;
        if (!b) { s.pick = { wiring: true, ok: false, i: -1 }; return redraw(); }
        const i = +b.dataset.xrB, blk = cur().blocks[i], ok = blk.type === w;
        s.pick = { i, type: blk.type, want: w, ok };
        if (ok) { const got = s.finds[s.i] = (s.finds[s.i] || []).concat(w); if (!want() && !s.cleared.includes(cur().kind)) s.cleared.push(cur().kind); void got; view.xrClue = false; check(); }
        return redraw(); }
      return false; },
    input() { return false; }
  };
}
