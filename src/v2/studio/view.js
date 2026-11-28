/* The studio: your chip as designed, one die in dashed blueprint outline, zoomed die → block → cells → one cell with
   no cut (#506, docs/prototypes/studio-fab/GUIDE.md §2, §5, §6, §7). It draws the record (src/engines/chiprecord.js)
   and computes no figure of its own. One camera: a level is a framing of the same drawing (plan.js targets), flown to
   in 900 ms with a cubic ease (a cut with reduced motion); the wheel, a pinch or a drag move it continuously, and the
   level is wherever the scale stands. A tap goes one level in. The words on the picture are HTML over it.
   createStudio(canvas, labels, o): o.words(key, vars) the words, o.mark(fid) a figure's mark of how true it is, o.still() reduced motion, o.inset() the picture's
   safe area ({ l, r, t, b }, pixels), o.level(level, pos) told whenever the level or the position along the levels
   changes. Returns { show(record, level, jump), go(level), at(), hide(), resize() }. */
import { planOf, levelAt, LEVELS } from './plan.js';
import { drawDie, paletteOf } from './draw.js';

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function createStudio(canvas, labelsEl, o) {
  const ctx = canvas.getContext('2d');
  let P = null, W = 0, H = 0, dpr = 1, cam = { ox: 0, oy: 0, s: 1 }, fly = null, raf = 0, shown = false, lastLv = null, lastPos = null, C = null;

  const inset = () => Object.assign({ l: 20, r: 20, t: 90, b: 150 }, o.inset ? o.inset(W, H) : {});
  /* the camera that frames a rectangle of the sheet in the safe area */
  function fit(r) {
    const I = inset(), aw = Math.max(80, W - I.l - I.r), ah = Math.max(80, H - I.t - I.b), s = Math.min(aw / r.w, ah / r.h);
    return { ox: I.l + (aw - r.w * s) / 2 - r.x * s, oy: I.t + (ah - r.h * s) / 2 - r.y * s, s };
  }
  /* where the safe area's middle falls on the sheet, and back: flights move that point and the scale (in logs) */
  const mid = () => { const I = inset(); return [I.l + (W - I.l - I.r) / 2, I.t + (H - I.t - I.b) / 2]; };
  const centre = c => { const [mx, my] = mid(); return { x: (mx - c.ox) / c.s, y: (my - c.oy) / c.s, s: c.s }; };
  const camOf = q => { const [mx, my] = mid(); return { ox: mx - q.x * q.s, oy: my - q.y * q.s, s: q.s }; };

  /* the view's size changed, or (reframe) its safe area did: the camera keeps its level, framed anew */
  function resize(reframe) {
    const r = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (reframe === true && P && !fly && lastLv && W) { W = w; H = h; go(lastLv, true); return; }
    if (w === W && h === H && canvas.width === Math.round(w * dpr)) return;
    const q = W && H ? centre(cam) : null; W = w; H = h; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (q) cam = camOf(q); draw();
  }
  const ro = new ResizeObserver(() => { if (shown) resize(); }); ro.observe(canvas);

  /* the level and the position along the levels, told when they change; the canvas says them for checks */
  function tell() {
    if (!P) return;
    const L = levelAt(P, cam.s, l => fit(P.targets[l]).s), pos = Math.round(L.pos * 100) / 100;
    canvas.dataset.level = L.level; canvas.dataset.pos = pos.toFixed(2); canvas.dataset.flying = fly ? '1' : '';
    if (L.level !== lastLv || pos !== lastPos) { lastLv = L.level; lastPos = pos; if (o.level) o.level(L.level, L.pos); }
  }
  function draw() {
    if (!P || !W) return;
    if (!C) C = paletteOf(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const labels = drawDie(ctx, P, cam, { W, H, C, words: o.words, time: o.still && o.still() ? null : performance.now() });
    /* the square on the masks' road keeps moving while it shows (nothing moves by itself with reduced motion) */
    if (labels.moving && shown) kick();
    labelsEl.innerHTML = labels.filter(l => l.x > -200 && l.x < W && l.y > -20 && l.y < H).map(l =>
      '<span class="sdl ' + l.kind + (l.bad ? ' bad' : '') + '" data-part="' + esc(l.part) + '" style="left:' + l.x.toFixed(1) + 'px;top:' + l.y.toFixed(1) + 'px">' + esc(l.text) + (l.fid && o.mark ? ' ' + o.mark(l.fid) : '') + '</span>').join('');
    /* a word that would run off the right edge is moved back inside it */
    for (const el of labelsEl.children) { const x = parseFloat(el.style.left), w = el.offsetWidth; if (x + w > W - 8) el.style.left = Math.max(8, W - 8 - w).toFixed(1) + 'px'; }
    tell();
  }
  function loop(now) {
    raf = 0;
    if (fly) {
      const f = Math.min(1, (now - fly.t0) / fly.ms), e = ease(f), a = fly.a, b = fly.b;
      cam = camOf({ x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * e) });
      if (f >= 1) { cam = fly.to; const done = fly.done; fly = null; if (done) done(); }
    }
    draw();
    if (fly) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  /* fly to a level (its target), or cut there with reduced motion or when asked */
  function go(level, jump) {
    if (!P) return Promise.resolve();
    const LV = P.levels || LEVELS, to = fit(P.targets[LV.includes(level) ? level : LV[0]]);
    if (jump || (o.still && o.still()) || !W) { fly = null; cam = to; draw(); return Promise.resolve(); }
    const a = centre(cam), b = centre(to), far = Math.abs(Math.log(b.s / a.s));
    return new Promise(res => { fly = { a, b, to, t0: performance.now(), ms: Math.min(1350, 900 * (1 + far / 12)), done: res }; tell(); kick(); });
  }

  /* the pointer: the wheel and a pinch zoom about the pointer, a drag pans, a tap goes one level in */
  const zoomAt = (x, y, k) => { fly = null; const s = Math.max(0.02, Math.min(4000, cam.s * k)); cam = { ox: x - (x - cam.ox) * s / cam.s, oy: y - (y - cam.oy) * s / cam.s, s }; kick(); };
  canvas.addEventListener('wheel', e => { if (!shown) return; e.preventDefault(); const r = canvas.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-Math.max(-60, Math.min(60, e.deltaY)) * 0.004)); }, { passive: false });
  const ptrs = new Map(); let moved = 0, pinch = 0, dragCell = null;
  /* the cell under a point of the view, at the block and closer, where cells are drawn */
  const cellAt = (cx, cy) => { if (!P || !['block', 'gate', 'switch'].includes(canvas.dataset.level)) return null; const r = canvas.getBoundingClientRect(), x = (cx - r.left - cam.ox) / cam.s, y = (cy - r.top - cam.oy) / cam.s; const c = P.cells.find(q => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); return c ? c.id : null; };
  canvas.addEventListener('pointerdown', e => { if (!shown) return; canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; dragCell = o.swap && ptrs.size === 1 ? cellAt(e.clientX, e.clientY) : null; canvas.dataset.drag = dragCell || ''; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = canvas.getBoundingClientRect(); if (pinch) zoomAt((a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top, d / pinch); pinch = d; moved += 10; return; }
    moved += Math.abs(dx) + Math.abs(dy); if (dragCell) return; if (moved > 4) { fly = null; cam = { ox: cam.ox + dx, oy: cam.oy + dy, s: cam.s }; kick(); }
  });
  const up = e => { if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0;
    /* a cell dragged onto another swaps with it (#508) */
    if (dragCell) { const a = dragCell, b = cellAt(e.clientX, e.clientY); dragCell = null; canvas.dataset.drag = ''; if (moved > 4) { if (b && b !== a) o.swap(a, b); return; } }
    if (moved <= 4 && ptrs.size === 0 && P) { const LV = P.levels || LEVELS, i = LV.indexOf(canvas.dataset.level); if (i >= 0 && i < LV.length - 1 && o.tap) o.tap(LV[i + 1]); } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = 0; });

  /* day and night change the palette */
  const mo = new MutationObserver(() => { C = null; draw(); }); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return {
    show(record, level, jump, extra) { shown = true; P = Object.assign(planOf(record, extra && extra.made), extra || {}); C = null; resize(); return go(level, jump || !lastLv); },
    /* the record changed (a gene, a design): drawn again where the camera is */
    update(record, extra) { P = Object.assign(planOf(record, extra && extra.made), extra || {}); draw(); },
    /* what a session adds to the drawing: the coverage map, the wire once settled */
    extra(x) { if (P) { Object.assign(P, x); draw(); } },
    go,
    at: () => ({ level: canvas.dataset.level || null, pos: +canvas.dataset.pos || 0, flying: !!fly }),
    plan: () => P,
    hide() { shown = false; fly = null; if (raf) cancelAnimationFrame(raf); raf = 0; },
    resize
  };
}
