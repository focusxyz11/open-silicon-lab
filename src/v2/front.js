/* A front, drawn once for the whole lab (#315, #320): today's best compromises between two measures as a line, the
   corner beyond it where nobody has a design yet shaded, and dots (your design, the offers). Two lenses held at once
   draw it in their card (src/v2/lenspaint.js: energy per answer against the hottest patch), and a machine of shared
   blocks draws it beside the machine (src/v2/machines.js: energy against how much can still change). The caller maps
   its own measures to the chart's coordinates; this draws the frame, the shaded corner, the lines, the dots and the
   key, with the classes of src/styles/frame.css (.lpfront and its parts).

   frontFigure(o) -> HTML. o: { W, H, box: [x0, y0, x1, y1] (the plot inside the viewBox), corner: 'bl' | 'tl' (where
   nobody is yet: down and left, or up and left), lines: [{ pts: [[x, y], ...], cls }] (the first is today's front; the
   corner is cut off by it), dots: [{ x, y, r, cls, attrs }] (attrs: extra attributes, already escaped), extra (SVG
   under the dots), aria, key: [[cls, words], ...], cls (on the figure) }. */
import { esc } from '../core/esc.js';
const f1 = v => (+v).toFixed(1);

/* the corner cut off by the front: from the corner, along one edge to the line's first end, along the line, and back
   along the other edge from its last end; the line kept inside the plot */
export function nobodyPath(box, corner, pts) {
  const [x0, y0, x1, y1] = box; if (!pts.length) return '';
  const cy = corner === 'tl' ? y0 : y1, inY = y => Math.max(y0, Math.min(y1, y)), A = pts[0], B = pts[pts.length - 1];
  const line = pts.map(p => f1(Math.max(x0, Math.min(x1, p[0]))) + ' ' + f1(inY(p[1]))).join('L');
  return corner === 'tl'
    ? 'M' + x0 + ' ' + f1(inY(A[1])) + 'L' + line + 'L' + f1(B[0]) + ' ' + cy + 'L' + x0 + ' ' + cy + 'Z'
    : 'M' + x0 + ' ' + cy + 'L' + f1(A[0]) + ' ' + cy + 'L' + line + 'L' + x0 + ' ' + f1(inY(B[1])) + 'Z';
}

export function frontFigure(o) {
  const [x0, y0, x1, y1] = o.box, lines = (o.lines || []).filter(l => l && l.pts && l.pts.length);
  const poly = L => L.pts.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
  return '<figure class="lpfront' + (o.cls ? ' ' + o.cls : '') + '"><svg viewBox="0 0 ' + o.W + ' ' + o.H + '" role="img" aria-label="' + esc(o.aria) + '">' +
    '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="none" stroke="var(--line)"/>' +
    /* nobody here yet: everything beyond today's front */
    (lines.length ? '<path d="' + nobodyPath(o.box, o.corner || 'bl', lines[0].pts) + '" class="lpnobody"/>' : '') +
    lines.map(L => '<polyline points="' + poly(L) + '" class="' + L.cls + '"/>').join('') + (o.extra || '') +
    (o.dots || []).map(d => '<circle cx="' + f1(d.x) + '" cy="' + f1(d.y) + '" r="' + (d.r || 7) + '" class="' + d.cls + '"' + (d.attrs ? ' ' + d.attrs : '') + '>' + (d.title ? '<title>' + esc(d.title) + '</title>' : '') + '</circle>').join('') + '</svg>' +
    '<figcaption class="lpkey">' + (o.key || []).map(([c, w]) => '<span' + (c ? ' class="' + c + '"' : '') + '>' + esc(w) + '</span>').join('') + '</figcaption></figure>';
}
