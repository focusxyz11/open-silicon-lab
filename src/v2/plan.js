/* Plan: the ground divided into districts, and what flows between them (content/divide.md, the visual system of "how
   should a chip divide its work?"). Your chip as a floor plan: its cores (lit when working, dark when waiting), its
   own memory, its links to the outside, and the memory it fetches from, on the board or stacked beside it. The stream
   from memory is drawn twice: what the cores ask for, and what arrives. Give part of the floor to a special district
   and say how much of the job is its kind of work: Amdahl's law decides whether it pays. Numbers from your chip's
   model (src/engines/chip.js) and the Work engine (src/engines/work.js). Words: plan.*, and chip.* (the model's own). */
import { esc } from '../core/esc.js';
import { t, fmtNum } from '../core/i18n.js';
import { model, REUSES } from '../engines/chip.js';
import { withDistrict, AREAS, SHARES, SPECIAL_K } from '../engines/work.js';

const S = { reuse: 2, mem: 0, clock: 1, area: 0, share: 1 };
const sig = v => fmtNum(Number(v.toPrecision(2)));
const SHOWN_CLOCK = [0.5, 1, 2, 3];

function floor(m, a) {
  const W = 640, H = 300, cx = 30, cy = 30, cw = 380, ch = 240, beside = m.mem === 1;
  let g = '<svg class="plansvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('plan.aria', { busy: Math.round(m.busy * 100) })) + '">';
  g += '<rect x="' + cx + '" y="' + cy + '" width="' + cw + '" height="' + ch + '" rx="10" class="die"/>';
  /* its own memory along the top, its links along the bottom */
  g += '<rect x="' + (cx + 12) + '" y="' + (cy + 10) + '" width="' + (cw - 24) + '" height="26" rx="5" class="sram"/><text x="' + (cx + 22) + '" y="' + (cy + 27) + '" class="pl">' + esc(t('plan.own')) + '</text>';
  g += '<rect x="' + (cx + 12) + '" y="' + (cy + ch - 34) + '" width="' + (cw - 24) + '" height="24" rx="5" class="io"/><text x="' + (cx + 22) + '" y="' + (cy + ch - 18) + '" class="pl">' + esc(t('plan.links')) + '</text>';
  /* the cores' district, and beside it the special one */
  const fx = cx + 12, fy = cy + 46, fw = cw - 24, fh = ch - 92, sw = Math.round(fw * a), gw = fw - sw - (a ? 8 : 0);
  const cols = Math.min(12, m.grid[0]), rows = Math.min(6, m.grid[1]), N = cols * rows, lit = Math.round(N * m.busy), cell = Math.min((gw - 6) / cols, (fh - 6) / rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i; g += '<rect x="' + (fx + 3 + i * cell).toFixed(1) + '" y="' + (fy + 3 + j * cell).toFixed(1) + '" width="' + (cell - 3).toFixed(1) + '" height="' + (cell - 3).toFixed(1) + '" rx="2" class="core' + (k < lit ? ' on' : '') + '"/>'; }
  if (a) { const sx = fx + gw + 8; g += '<rect x="' + sx + '" y="' + fy + '" width="' + sw + '" height="' + fh + '" rx="6" class="special"/><text x="' + (sx + sw / 2) + '" y="' + (fy + fh / 2 + 4) + '" text-anchor="middle" class="pl strong">' + esc(t('plan.special')) + '</text>'; }
  /* the memory it fetches from, and the stream: asked (outline) and arriving (solid) */
  const mx = beside ? cx + cw + 22 : 480, mw = beside ? 70 : 110, my = beside ? cy + 40 : 110, mh = beside ? 160 : 80;
  g += '<rect x="' + mx + '" y="' + my + '" width="' + mw + '" height="' + mh + '" rx="8" class="mem"/><text x="' + (mx + mw / 2) + '" y="' + (my + mh + 18) + '" text-anchor="middle" class="pl">' + esc(t(beside ? 'plan.memBeside' : 'plan.memBoard')) + '</text>';
  const asked = Math.min(40, 6 + 16 * m.need), got = Math.min(asked, 6 + 16 * Math.min(1, m.need)), y0 = my + mh / 2, x0 = cx + cw;
  g += '<path d="M' + mx + ' ' + y0 + ' H' + x0 + '" class="ask" style="stroke-width:' + asked.toFixed(1) + 'px"/><path d="M' + mx + ' ' + y0 + ' H' + x0 + '" class="got" style="stroke-width:' + got.toFixed(1) + 'px"/>';
  return g + '</svg>';
}
const chips = (k, values, label, name) => '<div class="pctl"><span class="small"><b>' + esc(label) + '</b></span><div class="chips">' + values.map((v, i) => '<button type="button" class="chipb" data-pk2="' + k + '" data-pv2="' + i + '" aria-pressed="' + (k === 'clock' ? S.clock === v : S[k] === i) + '">' + esc(name(v, i)) + '</button>').join('') + '</div></div>';

export function planHtml(chip) {
  const m = model(Object.assign({}, chip, { reuse: S.reuse, mem: S.mem, clock: S.clock })), a = AREAS[S.area], f = SHARES[S.share], time = withDistrict(f, a, SPECIAL_K);
  const mems = t('chip.mem.names');
  let h = '<section class="planbox" data-plan>' + floor(m, a);
  h += '<p class="pkey small"><span><i class="k on"></i>' + esc(t('plan.working')) + '</span><span><i class="k"></i>' + esc(t('plan.waiting')) + '</span><span><i class="k kask"></i>' + esc(t('plan.asked')) + '</span><span><i class="k kgot"></i>' + esc(t('plan.arrives')) + '</span></p>';
  h += '<div class="plancard"><p class="plead">' + esc(m.need > 1 ? t('plan.waits', { busy: Math.round(m.busy * 100) }) : t('plan.fed')) + '</p><p>' + esc(t('chip.memory', { work: sig(m.work), busy: Math.round(m.busy * 100), moving: Math.round(m.moving * 100), board: sig(m.powerBoard) })) + '</p>' +
    chips('reuse', REUSES, t('chip.reuse.label'), v => t('walls.reuse', { v })) +
    chips('mem', [0, 1], t('chip.mem.label'), (v, i) => (Array.isArray(mems) ? mems[i] : String(v))) +
    chips('clock', SHOWN_CLOCK, t('chip.clock.label'), v => t('chip.clock.value', { v })) + '</div>';
  h += '<div class="plancard"><p class="kicker">' + esc(t('plan.districtK')) + '</p>' +
    chips('area', AREAS, t('plan.area'), v => (v ? t('plan.areaV', { v: Math.round(v * 100) }) : t('plan.none'))) +
    chips('share', SHARES, t('plan.share'), v => t('plan.shareV', { v: Math.round(v * 100) })) +
    '<p class="plead">' + esc(!a ? t('plan.noDistrict') : time < 1 / 1.05 ? t('plan.pays', { x: sig(1 / time) }) : time > 1.05 ? t('plan.costs', { x: sig(time) }) : t('plan.even')) + '</p><p class="small muted">' + esc(t('plan.how', { k: SPECIAL_K })) + '</p></div>';
  return h + '</section>';
}
export function planInput(btn, chip) {
  const box = btn.closest('[data-plan]'); if (!box) return false;
  const k = btn.dataset.pk2, i = +btn.dataset.pv2; if (!k) return false;
  if (k === 'clock') S.clock = SHOWN_CLOCK[i]; else S[k] = i;
  const w = document.createElement('div'); w.innerHTML = planHtml(chip); const fresh = w.firstElementChild; box.replaceWith(fresh);
  const f = fresh.querySelector('[data-pk2="' + k + '"][data-pv2="' + i + '"]'); if (f) f.focus();
  return true;
}
