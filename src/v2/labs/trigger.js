/* Trust it or not (#497; src/engines/trigger.js): the lab of the challenge 'trigger', at the Lab beside Verify the agent.
   An agent hands over five adders for your core, one at each width; each passes the tests it came with, and some hide a
   trigger on one input. For each you have a budget of checking: random tests, every input (affordable only while the
   adder is narrow) and reading its gates. Then you accept it into your core, or reject it and build your own. When all
   five are decided, the round shows which hid a trigger and what accepting one would cost. A teaching model, not an
   attack: the trigger is the simplest there is.
   The picture: the adder chosen, as its chain of one-bit adders, and, once its gates are read, any extra gates beside
   them; above it, the five as tiles with what is left of each budget.
   lab(L) gets the player's pieces and returns { draw, click, input }. What the player tried is kept in the view. */
import * as Z from '../../engines/trigger.js';

const big = n => (n >= 1e12 ? n.toExponential(1).replace('e+', ' × 10^') : Math.round(n).toLocaleString('en'));
const TESTS = [100, 1000, 10000, 50000];

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win } = L, view = L.view;
  const st = () => view.tg || (view.tg = { at: 0, d: {}, looks: Z.ROUND.map(() => ({ spent: 0, tests: 0, found: null, all: null, gates: null })) });
  const sliceAt = i => Z.slice(Z.ROUND[i].seed, Z.ROUND[i].w);
  const left = i => Z.BUDGET - st().looks[i].spent;
  const see = () => { if (Z.verdict(st().d).won) win(); };

  /* the five adders, as tiles: width, what is left of the budget, the call made */
  function tiles() {
    const o = st();
    return '<div class="tgtiles" role="group" aria-label="' + esc(t('trg.tiles')) + '">' + Z.ROUND.map((r, i) => { const lk = o.looks[i], d = o.d[i], f = left(i) / Z.BUDGET;
      return '<button type="button" class="tgtile' + (i === o.at ? ' on' : '') + (d ? ' ' + d : '') + (lk.found ? ' caught' : '') + '" data-tg-at="' + i + '" aria-pressed="' + (i === o.at) + '">' +
        '<b>' + esc(t('trg.bitsShort', { w: r.w })) + '</b><span class="tgleft"><i style="width:' + (f * 100).toFixed(0) + '%"></i></span><span class="small">' + esc(d ? t('trg.d.' + d) : lk.found ? t('trg.caught') : t('trg.open')) + '</span></button>'; }).join('') + '</div>';
  }
  /* the adder chosen: its chain of one-bit adders, the extra gates once read (red), or the part not read yet */
  function schematic(i) {
    const sl = sliceAt(i), lk = st().looks[i], W = 360, H = 140, n = Math.min(sl.w, 8), bw = 22, gap = 6, x0 = 14, y0 = 66;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('trg.aria', { w: sl.w })) + '">';
    for (let k = 0; k < n; k++) {
      const x = x0 + k * (bw + gap), last = sl.w > 8 && k === n - 1;
      s += last ? '<text class="ax" x="' + (x + bw / 2) + '" y="' + (y0 + 18) + '" text-anchor="middle">…</text>' :
        '<rect class="fa" x="' + x + '" y="' + y0 + '" width="' + bw + '" height="28" rx="3"/><text class="ax" x="' + (x + bw / 2) + '" y="' + (y0 + 18) + '" text-anchor="middle">+</text>' +
        '<line class="w" x1="' + (x + 8) + '" x2="' + (x + 8) + '" y1="' + (y0 - 14) + '" y2="' + y0 + '"/><line class="w" x1="' + (x + 18) + '" x2="' + (x + 18) + '" y1="' + (y0 - 14) + '" y2="' + y0 + '"/><line class="w" x1="' + (x + bw / 2) + '" x2="' + (x + bw / 2) + '" y1="' + (y0 + 28) + '" y2="' + (y0 + 42) + '"/>';
      if (k && !last) s += '<line class="w" x1="' + (x - gap) + '" x2="' + x + '" y1="' + (y0 + 14) + '" y2="' + (y0 + 14) + '"/>';
    }
    s += '<text class="ax" x="' + x0 + '" y="' + (y0 - 22) + '">' + esc(t('trg.ab', { w: sl.w })) + '</text><text class="ax" x="' + x0 + '" y="' + (y0 + 58) + '">' + esc(t('trg.sum')) + '</text>';
    /* the netlist beyond the adders: unread, read and clean, or read with a comparator on the inputs into one sum bit */
    const G = lk.gates, gx = 258;
    if (!G) s += '<rect class="unread" x="' + gx + '" y="18" width="92" height="96" rx="6"/><text class="ax" x="' + (gx + 46) + '" y="70" text-anchor="middle">' + esc(t('trg.unread')) + '</text>';
    else if (!G.extra) s += '<text class="ax good" x="' + (gx + 46) + '" y="70" text-anchor="middle">' + esc(t('trg.clean', { g: G.gates })) + '</text>';
    else s += '<rect class="cmp" x="' + gx + '" y="18" width="92" height="40" rx="5"/><text class="ax bad" x="' + (gx + 46) + '" y="42" text-anchor="middle">' + esc(t('trg.cmp', { g: G.extra })) + '</text><path class="bad-w" d="M' + (gx + 46) + ' 58V' + (y0 + 36) + 'H' + (x0 + bw / 2) + '"/>';
    return s + '</svg>';
  }
  function tools(i) {
    const lk = st().looks[i], sl = sliceAt(i), N = Z.allCost(sl.w), gc = Z.gateCost(sl), r = left(i), decided = !!st().d[i];
    let h = '<div class="tgtools"><p class="kicker">' + esc(t('trg.budget', { left: big(r), of: big(Z.BUDGET) })) + '</p>';
    h += '<div class="tgrow"><span class="small"><b>' + esc(t('trg.random')) + '</b> ' + esc(t('trg.randomD')) + '</span><span class="chips">' + TESTS.map(n => '<button type="button" class="chipb" data-tg-test="' + n + '"' + (n > r || decided ? ' disabled' : '') + '>' + esc(big(n)) + '</button>').join('') + '</span></div>';
    h += '<div class="tgrow"><span class="small"><b>' + esc(t('trg.all')) + '</b> ' + esc(t('trg.allD', { n: big(N) })) + '</span><button type="button" class="chipb" data-tg-all' + (N > r || decided || lk.all ? ' disabled' : '') + '>' + esc(t(N > Z.BUDGET ? 'trg.tooBig' : 'trg.run')) + '</button></div>';
    h += '<div class="tgrow"><span class="small"><b>' + esc(t('trg.gates')) + '</b> ' + esc(t('trg.gatesD', { n: big(gc) })) + '</span><button type="button" class="chipb" data-tg-gates' + (gc > r || decided || lk.gates ? ' disabled' : '') + '>' + esc(t(gc > Z.BUDGET ? 'trg.tooBig' : 'trg.read')) + '</button></div>';
    /* what was found so far */
    const said = [];
    if (lk.tests) said.push(lk.found ? t('trg.found', { a: lk.found.a, b: lk.found.b }) : t('trg.passed', { n: big(lk.tests), p: (100 * Z.catchChance(sl.w, lk.tests)).toPrecision(2) }));
    if (lk.all) said.push(lk.all.found ? t('trg.allFound', { a: lk.all.a, b: lk.all.b }) : t('trg.allClean'));
    if (lk.gates) said.push(lk.gates.extra ? t('trg.gatesExtra', { n: lk.gates.extra }) : t('trg.gatesClean'));
    h += said.length ? '<p class="small tgsaid">' + said.map(esc).join(' ') + '</p>' : '<p class="small muted tgsaid">' + esc(t('trg.none')) + '</p>';
    h += decided ? '<p class="small">' + esc(t('trg.d.' + st().d[i] + 'D')) + ' <button type="button" class="link" data-tg-undo>' + esc(t('trg.undo')) + '</button></p>'
      : '<div class="chips"><button type="button" class="btn primary" data-tg-d="accept">' + esc(t('trg.accept')) + '</button><button type="button" class="btn" data-tg-d="reject">' + esc(t('trg.reject')) + '</button></div>';
    return h + '</div>';
  }
  /* the round, once every adder is decided: which hid a trigger, and what accepting it would cost */
  function outcome() {
    const V = Z.verdict(st().d); if (!V.done) return '';
    return '<div class="tgout"><p class="kicker">' + esc(t(V.won ? 'trg.out.won' : 'trg.out.lost')) + '</p><ul>' + V.rows.map(r => '<li class="' + (r.ok ? 'good' : 'bad') + '">' + esc(t('trg.bits', { w: r.sl.w }) + ': ' +
      (r.sl.hidden ? (r.d === 'accept' ? t('trg.out.trojan', { a: big(r.sl.ka), b: big(r.sl.kb) }) : t('trg.out.stopped')) : r.d === 'accept' ? t('trg.out.honest') : Z.checkable(r.sl) ? t('trg.out.lostHonest') : t('trg.out.rebuilt'))) + '</li>').join('') + '</ul>' +
      (V.won ? '' : '<button type="button" class="link" data-tg-again>' + esc(t('trg.again')) + '</button>') + '</div>';
  }
  function bench() {
    const o = st(), V = Z.verdict(o.d), ok = V.won || !!S.done[ch.id], decided = Object.keys(o.d).length, kept = V.rows.filter(r => r.d === 'accept' && !r.sl.hidden).length;
    let h = head() + '<p class="small tgintro">' + esc(t('trg.intro')) + '</p>';
    h += '<div class="goalbox' + (ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(ok ? 'game.reached' : 'game.goalNow')) + '</p>' +
      [[t('trg.g.decided'), decided + ' / ' + Z.ROUND.length, decided / Z.ROUND.length, decided === Z.ROUND.length], [t('trg.g.trojans'), V.done ? String(V.trojans) : '?', V.done && !V.trojans ? 1 : 0, V.done && !V.trojans], [t('trg.g.kept'), String(kept), V.done && V.won ? 1 : kept / 2, V.done && V.won]]
        .map(([l, v, f, g]) => '<div class="gauge' + (g ? ' ok' : '') + '"><span class="gl">' + esc(l) + '</span><span class="gv">' + esc(v) + '</span><span class="gbar"><span style="width:' + (Math.min(1, f) * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    h += '<figure class="tgfig" data-f2="instrument">' + tiles() + schematic(o.at) + '<figcaption class="small muted">' + esc(t('trg.legend')) + '</figcaption></figure>';
    h += tools(o.at) + outcome();
    h += '<p class="small muted">' + esc(t('trg.note')) + '</p>';
    if (S.done[ch.id]) h += '<p class="small good">' + esc(t('trg.done')) + '</p>';
    return h + doneNote() + reward();
  }

  return {
    draw: bench,
    click(e) {
      const q = s => e.target.closest(s), o = st(), i = o.at, lk = o.looks[i], sl = sliceAt(i);
      const at = q('[data-tg-at]'); if (at) { o.at = +at.dataset.tgAt; L.draw(); return true; }
      const tb = q('[data-tg-test]'); if (tb) { const n = +tb.dataset.tgTest; if (n > left(i)) return true; lk.spent += Z.testCost(n); lk.tests += n; const R = Z.randomTests(sl, n, lk.tests); if (R.found && !lk.found) lk.found = R.a != null ? { a: R.a, b: R.b } : { a: sl.ka, b: sl.kb }; L.draw(); return true; }
      if (q('[data-tg-all]')) { const c = Z.allCost(sl.w); if (c > left(i)) return true; lk.spent += c; lk.all = Z.everyInput(sl); if (lk.all.found) lk.found = { a: lk.all.a, b: lk.all.b }; L.draw(); return true; }
      if (q('[data-tg-gates]')) { const c = Z.gateCost(sl); if (c > left(i)) return true; lk.spent += c; lk.gates = Z.gateView(sl); L.draw(); return true; }
      const d = q('[data-tg-d]'); if (d) { o.d[i] = d.dataset.tgD; const next = Z.ROUND.findIndex((r, k) => !o.d[k]); if (next >= 0) o.at = next; see(); L.draw(); return true; }
      if (q('[data-tg-undo]')) { delete o.d[i]; L.draw(); return true; }
      if (q('[data-tg-again]')) { view.tg = null; L.draw(); return true; }
      return false;
    },
    input() { return false; }
  };
}
