/* Small drawing helpers shared by the scenes (src/app/scenes.js) and the journey (src/app/journey.js).
   G is the drawing helper from src/app/world.js. */
export const rnd = (i, j) => { const v = Math.sin(i * 127.1 + (j || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* Shapes that are not boxes: a filled outline, a box with round corners, a smooth closed curve. */
export const paint = (G, fill, stroke, lw) => { const c = G.ctx; if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = G.lw(lw || 1); c.stroke(); } };
export const poly = (G, pts, fill, stroke, lw) => {
  const c = G.ctx; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); paint(G, fill, stroke, lw);
};
export const rr = (G, x, y, w, h, q, fill, stroke, lw) => {
  const c = G.ctx; c.beginPath(); c.moveTo(x + q, y); c.arcTo(x + w, y, x + w, y + h, q); c.arcTo(x + w, y + h, x, y + h, q); c.arcTo(x, y + h, x, y, q); c.arcTo(x, y, x + w, y, q); c.closePath(); paint(G, fill, stroke, lw);
};
export const blob = (G, pts, fill, stroke, lw) => {
  const c = G.ctx, n = pts.length, mid = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2], m0 = mid(n - 1);
  c.beginPath(); c.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(i); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } c.closePath(); paint(G, fill, stroke, lw);
};
/* the three faces of a box: top, front, side, lit the same way in dark and light */
export const faces = c => c.dark ? [c.up, c.mid, c.lo] : [c.lo, c.mid, c.up];
/* an outline that is a closed shape (a box drawn in 2.5D), as a part */
export const closed = pts => ({ p: pts.concat([pts[0]]), closed: true });
/* a point moving along a line of points */
export const along2 = (pts, u) => { const n = pts.length - 1, k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]; };

/* Words on the picture are read with t() and measured, never assumed: any language, any length. Lines break
   at word boundaries as the language defines them (Intl.Segmenter, so text without spaces wraps too), and a
   word longer than a line breaks between characters. */
const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
const pieces = s => SEG ? [...SEG.segment(s)].map(x => x.segment) : s.split(/(\s+)/);
/* c: anything with measureText (a canvas context) */
export function wrap(c, text, maxW) {
  const lines = []; let line = '';
  for (const p of pieces(String(text))) {
    const next = line + p;
    if (c.measureText(next).width <= maxW || !line.trim()) {
      if (c.measureText(next).width <= maxW) { line = next; continue; }
      /* a single piece wider than the line: break it between characters */
      for (const ch of [...next]) { if (c.measureText(line + ch).width > maxW && line) { lines.push(line); line = ''; } line += ch; }
      continue;
    }
    lines.push(line.trimEnd()); line = p.trimStart();
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}
