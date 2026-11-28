/* What the studio's drawings share (#506, #511): the lab's palette read from its tokens and a token's colour at an
   opacity. No words: the line's view uses it too (src/v2/glue/flat.js). */
/* the lab's palette, read from its tokens (base.css), so day and night follow the page */
export function paletteOf(el) {
  const cs = getComputedStyle(el || document.documentElement), v = k => cs.getPropertyValue(k).trim();
  return { bg: v('--bg'), ink: v('--ink'), muted: v('--muted'), line: v('--line'), accent: v('--accent'), bad: v('--bad'), warm: v('--warm'), panel: v('--panel-solid') };
}
/* a token's colour at an opacity (the tokens are hex colours) */
export const alpha = (c, a) => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return c; const n = parseInt(m[1], 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

