/* Walls: everything a chip could be, and the walls around it (content/limit.md, the visual system of "what could a
   chip never do?"). Each row is one direction a chip could go (less energy, more distance in a tick, more certainty,
   bigger problems); the wall at its end is drawn by its kind (physics, mathematics, unproven, soft); the dot is your
   chip, placed by the Floor engine (src/engines/floor.js) at how many tenfold steps it stands from that wall. The
   last rows have no dot: a wall of mathematics nobody can approach, and a soft wall that fell. Words: walls.*,
   floor.* and chip.* (the engine's own). */
import { esc } from '../core/esc.js';
import { t, fmtNum, fmtWords } from '../core/i18n.js';
import { model, CLOCKS, SIDES, REUSES } from '../engines/chip.js';
import { perOp, reach, exhaust, WIDTHS, YEAR } from '../engines/floor.js';

const SPEEDUPS = [10, 1000, 1e6];
const S = { gen: 2, reuse: 2, clock: 1, size: 2, bits: 2, speed: 1, row: 0 };
const sig = v => fmtNum(Number(v.toPrecision(2)));
const sup = n => String(n).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const big = v => { if (v < 1e15) return v >= 1e6 ? fmtWords(v) : sig(v); const e = Math.floor(Math.log10(v)); return fmtNum(Number((v / Math.pow(10, e)).toPrecision(2))) + ' × 10' + sup(e); };

/* one direction as a track: the dot is your chip, placed at how many tenfold steps it stands from the wall */
function track(i, kind, title, steps, span) {
  const past = steps != null && steps < 0, at = steps == null ? null : Math.max(0, Math.min(1, steps / span));
  return '<button type="button" class="wrow ' + kind + (past ? ' past' : '') + '" data-wrow="' + i + '" aria-pressed="' + (S.row === i) + '"><span class="wrl">' + esc(title) + '</span>' +
    '<span class="wtrack">' + (at == null ? '' : '<i class="wdot" style="left:calc(' + ((1 - at) * 100).toFixed(1) + '% - 9px)"></i>') + '<span class="wwall"></span></span><span class="wkind">' + esc(t('walls.kind.' + kind)) + '</span></button>';
}
const chips = (k, values, name) => '<div class="chips">' + values.map((v, i) => '<button type="button" class="chipb" data-wk="' + k + '" data-wv="' + i + '" aria-pressed="' + (k === 'clock' ? S.clock === v : S[k] === i) + '">' + esc(name(v, i)) + '</button>').join('') + '</div>';
const ctl = (label, html) => '<div class="pctl"><span class="small"><b>' + esc(label) + '</b></span>' + html + '</div>';
const SHOWN_REUSE = [0, 2, 5], SHOWN_CLOCK = [0, 1, 4], SHOWN_SIZE = [0, 2, 4];

export function wallsHtml(chip = {}) {
  const m = model(Object.assign({}, chip, { gen: S.gen, reuse: S.reuse, clock: S.clock, size: S.size })), o = perOp(m), r = reach(m);
  const bits = WIDTHS[S.bits], e = exhaust(bits, 1e12), year = 1e12 * YEAR, speed = SPEEDUPS[S.speed], gens = t('chip.gen.names');
  const rows = [
    { kind: 'physics', title: t('walls.energy'), steps: Math.log10(o.times), span: 10, says: t('walls.energySays', { times: big(o.times), moving: Math.round(100 * o.move / o.total) }),
      ctl: ctl(t('chip.gen.label'), chips('gen', [0, 1, 2, 3, 4], (v, i) => (Array.isArray(gens) ? gens[i] : String(v)))) + ctl(t('chip.reuse.label'), sub('reuse', REUSES, SHOWN_REUSE, v => t('walls.reuse', { v }))) },
    { kind: 'physics', title: t('walls.light'), steps: Math.log10(1 / r.ticks), span: 2, says: t('floor.speed', { ghz: sig(r.ghz), cm: sig(r.glass * 100), mm: sig(r.across * 1000), ticks: sig(r.ticks) }),
      ctl: ctl(t('chip.clock.label'), sub('clock', CLOCKS, SHOWN_CLOCK, v => t('chip.clock.value', { v }))) + ctl(t('chip.size.label'), sub('size', SIDES, SHOWN_SIZE, v => t('chip.size.value', { mm: v }))) },
    { kind: 'counting', title: t('walls.trying'), steps: Math.log10(year / e.pairs), span: 20, says: t('walls.tryingSays', { n: bits, pairs: big(e.pairs), year: big(year) }),
      ctl: ctl(t('probe.all.bits'), chips('bits', WIDTHS, v => t('probe.all.bitsEach', { n: v }))) },
    { kind: 'unproven', title: t('walls.doubling'), steps: null, says: t('walls.doublingSays', { k: big(speed), more: Math.round(Math.log2(speed)) }),
      ctl: ctl(t('walls.faster'), chips('speed', SPEEDUPS, v => t('walls.timesFaster', { v: big(v) }))) },
    { kind: 'maths', title: t('walls.settle'), steps: null, says: t('walls.settleSays') },
    { kind: 'soft', title: t('walls.soft'), steps: null, says: t('walls.softSays') }];
  const R = rows[S.row], past = R.steps != null && R.steps < 0;
  let h = '<section class="wallsbox" data-walls><div class="wmap" role="group" aria-label="' + esc(t('walls.aria')) + '"><span class="wtoday">' + esc(t('walls.today')) + '</span>' + rows.map((x, i) => track(i, x.kind, x.title, x.steps, x.span)).join('') + '</div>';
  h += '<div class="wcard"><p class="kicker">' + esc(R.title) + ' · ' + esc(t('walls.kind.' + R.kind)) + '</p>';
  if (R.steps != null) h += '<p class="plead' + (past ? ' bad' : '') + '">' + esc(past ? t('walls.past') : R.steps < 0.05 ? t('walls.at') : t('walls.steps', { n: sig(R.steps) })) + '</p>';
  h += '<p>' + esc(R.says) + '</p>' + (R.ctl || '') + '</div>';
  return h + '<p class="small muted">' + esc(t('walls.how')) + '</p></section>';
}
/* a few of a setting's values: enough to feel the wall move */
function sub(k, values, shown, name) { return '<div class="chips">' + shown.map(i => '<button type="button" class="chipb" data-wk="' + k + '" data-wv="' + i + '" aria-pressed="' + (k === 'clock' ? S.clock === values[i] : S[k] === i) + '">' + esc(name(values[i])) + '</button>').join('') + '</div>'; }
/* a choice was made: the engine places the dots again */
export function wallsInput(btn, chip) {
  const box = btn.closest('[data-walls]'); if (!box) return false;
  if (btn.dataset.wrow != null) { S.row = +btn.dataset.wrow; const w = document.createElement('div'); w.innerHTML = wallsHtml(chip); const fresh = w.firstElementChild; box.replaceWith(fresh); const f = fresh.querySelector('[data-wrow="' + S.row + '"]'); if (f) f.focus(); return true; }
  const k = btn.dataset.wk, i = +btn.dataset.wv;
  if (k === 'clock') S.clock = CLOCKS[i]; else S[k] = i;
  const w = document.createElement('div'); w.innerHTML = wallsHtml(chip); const fresh = w.firstElementChild; box.replaceWith(fresh);
  const f = fresh.querySelector('[data-wk="' + k + '"][data-wv="' + i + '"]'); if (f) f.focus();
  return true;
}
