/* The island's block on the first page's chip (src/v2/hold.js): the island's plan, seen from straight above at the turn
   the island's own camera looks from (src/data/isle.js: the same coast, the same loop road, every place where it
   stands), so going inside is one move: the island opens on this picture and tilts down to itself (src/v2/map3d.js
   land). With it, the way in: the lab's blue button on the plan, and pushing on at the landing (landing). It is the last
   picture of the page, so it is fetched once the page has drawn, not with it. */
import { w, h, S, K, fg, clamp, TICK, setHolding } from './holdkit.js';
import { path, train, at, put, out, LIT } from './holdplates.js';
import { LOOP } from '../data/hold.js';
import { ISLE_COAST, ISLE_ROAD, ISLE_YAW, PLACES as ISLE_PLACES, isleFlat } from '../data/isle.js';

/* PLAN: plate units to one unit of the island, the point of the island at the plan's middle (as isleFlat gives it), and
   how far down the plate that middle is */
export const PLAN = { s: 5, c: [-.6, -3.2], y: .47 };
const planPt = p => { const [r, d] = isleFlat(p); return [500 + (r - PLAN.c[0]) * PLAN.s, 1000 * PLAN.y + (d - PLAN.c[1]) * PLAN.s]; };
/* a smooth closed line through points (Catmull-Rom, centripetal, as the island's own coast and road are made) */
function closedCurve(P, per = 10) { const n = P.length, out = [], tj = (ti, a, b) => ti + Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), .5);
  for (let i = 0; i < n; i++) { const p0 = P[(i + n - 1) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n], t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
    for (let k = 0; k < per; k++) { const t = t1 + (t2 - t1) * k / per, L = (a, b, ta, tb) => [0, 1].map(q => (tb - t) / (tb - ta) * a[q] + (t - ta) / (tb - ta) * b[q]);
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3), B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3); out.push(L(B1, B2, t1, t2)); } }
  return out; }
const COAST = closedCurve(ISLE_COAST.map(planPt), 8), ROAD = closedCurve(ISLE_ROAD.map(planPt), 8); ROAD.push(ROAD[0]);
const HERE = Object.fromEntries(ISLE_PLACES.filter(p => !p.far).map(p => [p.id, planPt(p.at)]));
/* where each place's words stand: under its square, over it, or at its right, clear of the road and of each other */
const SIDE = { lab: 'b', studio: 'b', fab: 'a', test: 'b', port: 'b', datacentre: 'r' }, SQ = 62;
const outline = (c, pts, k) => { c.beginPath(); pts.forEach(([x, y], i) => { const X = 500 + (x - 500) * k, Y = 470 + (y - 470) * k * (1 + (k - 1) * .5); if (i) c.lineTo(X, Y); else c.moveTo(X, Y); }); c.closePath(); };
export const ISLAND = {
  frame: () => [w('pl.island'), w('isle.lit', { n: LOOP.filter(l => LIT[l[1]]()).length })],
  paint(c, T) {
    /* the sea: the coast's own line, repeated outward and fading, as depths are drawn on a chart */
    c.lineWidth = 2; [1.3, 1.2, 1.11, 1.045].forEach((k, i) => { c.strokeStyle = fg(.05 + i * .035); outline(c, COAST, k); c.stroke(); });
    /* the land, hatched like silicon in every other picture of the page */
    outline(c, COAST, 1); c.fillStyle = K.plate; c.fill(); c.save(); c.clip(); c.strokeStyle = fg(.09); c.lineWidth = 1.5; c.beginPath(); for (let q = -1000; q < 1000; q += 16) { c.moveTo(q, 0); c.lineTo(q + 1000, 1000); } c.stroke(); c.restore();
    c.strokeStyle = K.ink; c.lineWidth = 4; outline(c, COAST, 1); c.stroke();
    /* the loop road, and what travels round it */
    path(c, ROAD, fg(.75), 3); train(c, ROAD, T, 1, .05, 18);
    for (const id of ['quarry', 'village']) { const [x, y] = HERE[id]; c.fillStyle = K.plate; c.fillRect(x - 13, y - 13, 26, 26); c.strokeStyle = fg(.45); c.lineWidth = 2.5; c.strokeRect(x - 13, y - 13, 26, 26); }
    LOOP.forEach(l => { const [x, y] = HERE[l[1]], lit = LIT[l[1]](), sel = S.place === l[1], h2 = SQ / 2; c.fillStyle = lit ? K.red : K.plate; c.fillRect(x - h2, y - h2, SQ, SQ); c.strokeStyle = lit ? K.red : K.ink; c.lineWidth = sel ? 7 : 4; c.strokeRect(x - h2, y - h2, SQ, SQ);
      if (sel) { c.strokeStyle = K.ink; c.lineWidth = 2.5; c.strokeRect(x - h2 - 13, y - h2 - 13, SQ + 26, SQ + 26); } }); },
  ui(host, pl) { LOOP.forEach(l => { const [x, y] = HERE[l[1]].map(v => v / 10), sd = SIDE[l[1]], b = h('button', 'isl-p ' + sd), g = SQ / 20 + 1.4; b.type = 'button';
      if (sd === 'r') at(b, x - g, y - g); else at(b, x - 13, sd === 'a' ? y + g : y - g, 26);
      b.innerHTML = '<i></i><span class="lb">' + w('stage.' + l[0]) + '<b>' + w('place.' + l[1]) + '</b></span>';
      b.onclick = () => { S.place = l[1]; out('island'); }; host.appendChild(b); });
    /* the way in, as the lab draws it everywhere: it fills as you push on at the landing (--land, src/v2/hold.js) */
    const go = h('a', 'goin'); go.href = '#/island'; go.dataset.go = 'island'; at(go, 50, 91); host.appendChild(go);
    pl.sync = () => put(go, '<span class="wia" aria-hidden="true">↓</span><b>' + (S.kept ? w('isle.go') : w('isle.go0')) + '</b>'); }
};

/* The way in (src/v2/hold.js calls this once, when the plan is in). At the landing (.landing on the page's root: the
   camera has come down to the plan, alone with its way in) pushing on goes inside: keep holding, or keep scrolling (the
   wheel, a finger still dragging up), and the button fills (--land; the hold button's ring too). Then, or at a tap on
   the button: the portal opens where the plan is on the window, and the island's camera starts on the same plan from
   straight above, as large as it was drawn (ctx.enter(point, at); without it, the address alone) */
export function landing(host, root, pl, ctx = {}) {
  let push = 0, went = false; const box = root.querySelector('.b-hold');
  const at = () => root.classList.contains('landing') && host.scrollTop >= host.scrollHeight - host.clientHeight - 3;
  function enter() { if (went) return; went = true; setHolding(false); push = 0; setTimeout(() => { went = false; }, 1500);
    const r = pl.el.getBoundingClientRect(), px = PLAN.s * r.width / 1000 || 3, cx = r.left + r.width / 2, cy = r.top + r.height * PLAN.y;
    const R = (innerWidth / 2 - cx) / px + PLAN.c[0], D = (innerHeight / 2 - cy) / px + PLAN.c[1], cs = Math.cos(ISLE_YAW), sn = Math.sin(ISLE_YAW);
    if (ctx.enter) ctx.enter({ x: cx / innerWidth, y: cy / innerHeight }, { px, x: R * cs + D * sn, z: -R * sn + D * cs }); else location.hash = '#/island'; }
  const add = v => { if (at()) { push = Math.min(1, push + v); if (push >= 1) enter(); } };
  root.addEventListener('click', e => { if (e.target.closest('a[data-go=island]')) { e.preventDefault(); enter(); } });
  host.addEventListener('wheel', e => { if (e.deltaY > 0) add(e.deltaY / 520); }, { passive: true });
  let ty = null; host.addEventListener('touchstart', e => { ty = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  host.addEventListener('touchmove', e => { if (ty == null || !e.touches.length) return; const y = e.touches[0].clientY, dy = ty - y; ty = y; if (dy > 0) add(dy / 260); }, { passive: true });
  TICK.push((T, dt) => { const on = root.classList.contains('landing'); if (!on && !push) return;
    push = on ? clamp(push + (S.holding && at() ? dt * 1.15 : -dt * .5), 0, 1) : 0; root.style.setProperty('--land', push.toFixed(3)); if (on && box) box.style.setProperty('--pr', push.toFixed(3)); if (push >= 1) enter(); });
}
