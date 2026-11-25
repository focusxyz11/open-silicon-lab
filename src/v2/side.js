/* Side by side (content/strange.md, the visual system of "what is the strangest thing that could compute?"):
   kinds of matter doing the same small job at the same moment, a 1 passed down a chain of parts, one lane each.
   Every lane runs in the Substrate engine (src/engines/substrate.js): the curve and the noise decide whether the
   1 is still a 1 at the end; each medium's energy and time for one step come from a source (src/data/media.js).
   On screen each lane's chain lights at a pace set by its time for one step, a tenfold longer step adding a fixed
   stretch, so the fast lanes finish at once and the slow ones make you wait. Under every lane, the same measures.
   Words: side.*. */
import { esc } from '../core/esc.js';
import { t, fmtNum } from '../core/i18n.js';
import { MEDIA } from '../data/media.js';
import { lanes, LENGTHS, COOLING, NOISES } from '../engines/substrate.js';

const S = { len: 1, noise: 1, cool: 0, run: 0 };
const CELLS = 100, PER_TEN = 0.3;
const sig = v => fmtNum(Number(v.toPrecision(2)));
const T_UNITS = [['ps', 1e-12], ['ns', 1e-9], ['us', 1e-6], ['ms', 1e-3], ['s', 1], ['min', 60], ['h', 3600], ['d', 86400], ['y', 365.25 * 86400]];
const E_UNITS = [['aJ', 1e-18], ['fJ', 1e-15], ['pJ', 1e-12], ['nJ', 1e-9], ['uJ', 1e-6], ['mJ', 1e-3], ['J', 1]];
const unit = (v, U) => { let u = U[0]; for (const x of U) if (v >= x[1] * 0.95) u = x; return [u[0], { v: sig(v / u[1]) }]; };
const time = v => { const [k, o] = unit(v, T_UNITS); return t('side.t.' + k, o); };
const energy = v => { if (v < 1e-18) return t('side.e.zJ', { v: sig(v / 1e-21) }); const [k, o] = unit(v, E_UNITS); return t('side.e.' + k, o); };
/* where a value sits on a log track, as a share of its width */
const at = (v, lo, hi) => Math.max(2, Math.min(100, ((Math.log10(v) - lo) / (hi - lo)) * 100)).toFixed(1) + '%';
const pace = s => (s == null ? 1.2 : 0.4 + PER_TEN * Math.max(0, Math.log10(s) + 13));

function chain(l) {
  const step = l.levels.length > CELLS + 1 ? (l.levels.length - 1) / CELLS : 1, n = Math.min(CELLS, l.levels.length - 1);
  let h = '';
  for (let i = 1; i <= n; i++) {
    const v = l.levels[Math.round(i * step)], c = v >= 0.7 ? 'one' : v <= 0.3 ? 'zero' : 'unsure';
    h += '<i class="' + c + '" style="--v:' + v.toFixed(2) + ';--k:' + (i / n).toFixed(3) + '"></i>';
  }
  return h;
}
const bar = (v, lo, hi, txt, cls) => '<span class="sbbar ' + cls + '">' + (v == null ? '<em>' + esc(t('side.none')) + '</em>' : '<span class="sbtrack"><b style="width:' + at(v, lo, hi) + '"></b></span><em>' + esc(txt) + '</em>') + '</span>';

export function sideHtml() {
  const stages = LENGTHS[S.len], R = lanes(MEDIA, { noise: NOISES[S.noise], stages, cooling: COOLING[S.cool] });
  const ctl = (k, vals, label, name) => '<div class="pctl"><span class="small"><b>' + esc(t(label)) + '</b></span><div class="chips">' + vals.map((v, i) => '<button type="button" class="chipb" data-sbk="' + k + '" data-sbv="' + i + '" aria-pressed="' + (S[k] === i) + '">' + esc(name(v, i)) + '</button>').join('') + '</div></div>';
  let h = '<section class="sidebox" data-side><p class="kicker">' + esc(t('side.k', { n: stages })) + '</p>';
  h += '<div class="sbctl">' + ctl('len', LENGTHS, 'side.len', v => t('side.parts', { n: fmtNum(v) })) + ctl('noise', NOISES, 'side.noise', (v, i) => t('side.noise.' + i)) +
    ctl('cool', COOLING, 'side.cool', (v, i) => t('side.cool.' + i, { x: fmtNum(v) })) + '<button type="button" class="chipb sbagain" data-sbk="run" data-sbv="0">' + esc(t('side.again')) + '</button></div>';
  h += '<div class="sblanes" data-run="' + S.run + '">';
  R.lanes.forEach(l => {
    h += '<div class="sbl ' + l.reads + '" style="--d:' + pace(l.tStep).toFixed(2) + 's"><div class="sbh"><b>' + esc(t('side.m.' + l.id + '.name')) + '</b><span>' + esc(t('side.m.' + l.id + '.what')) + '</span></div>' +
      '<div class="sbc" role="img" aria-label="' + esc(t('side.chainAria', { name: t('side.m.' + l.id + '.name'), reads: t('side.reads.' + l.reads) })) + '">' + chain(l) + '</div>' +
      '<div class="sbm"><span class="sbv ' + l.reads + '">' + esc(t('side.reads.' + l.reads)) + '</span>' +
      bar(l.tStep, -13, 4, l.tStep == null ? '' : t('side.tOne', { t: time(l.tStep), all: time(l.tAll) }), 't') +
      bar(l.eStep, -20, -1, l.eStep == null ? '' : t('side.eOne', { e: energy(l.eStep) }), 'e') +
      '<span class="sbr">' + esc(t('side.reset.' + (l.reset || 'none'))) + '</span></div></div>';
  });
  h += '</div><p class="small muted">' + esc(t('side.bars')) + ' ' + esc(t('side.pace', { s: PER_TEN })) + '</p>';
  const name = l => t('side.m.' + l.id + '.name'), who = x => (x.tie ? t('side.tie', { a: name(x.a), b: name(x.tie) }) : name(x.a));
  h += '<div class="sbcard"><p class="plead">' + esc(t('side.kept', { k: R.kept, n: R.lanes.length, len: fmtNum(stages) })) + '</p>' +
    (R.fastest ? '<p>' + esc(t('side.fastest', { who: who(R.fastest), t: time(R.fastest.a.tStep) })) + '</p>' : '') +
    (R.cheapest ? '<p>' + esc(t('side.cheapest', { who: who(R.cheapest), e: energy(R.cheapest.a.eStep) })) + (R.cheapest.a.id === 'loop' || (R.cheapest.tie && R.cheapest.tie.id === 'loop') ? ' ' + esc(S.cool ? t('side.coolGone') : t('side.coolNote')) : '') + '</p>' : '') +
    '<p>' + esc(t('side.why')) + '</p></div>';
  h += '<details class="sbsrc"><summary>' + esc(t('side.sources')) + '</summary><ul>' + MEDIA.map(m => '<li><b>' + esc(t('side.m.' + m.id + '.name')) + '</b>: ' + m.sources.map(s => '<a href="' + s.url + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>').join('; ') + '</li>').join('') + '</ul><p class="small muted">' + esc(t('side.model')) + '</p></details>';
  return h + '</section>';
}
export function sideInput(btn) {
  const box = btn.closest('[data-side]'); if (!box) return false;
  const k = btn.dataset.sbk, i = +btn.dataset.sbv; if (!k) return false;
  if (k === 'run') S.run++; else S[k] = i;
  const w = document.createElement('div'); w.innerHTML = sideHtml(); const fresh = w.firstElementChild; box.replaceWith(fresh);
  const f = fresh.querySelector('[data-sbk="' + k + '"][data-sbv="' + i + '"]'); if (f) f.focus();
  return true;
}
