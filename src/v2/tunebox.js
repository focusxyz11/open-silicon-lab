/* Probe (content/know.md, the visual system of "what part of making chips can't be written down?"): a thing you
   cannot open, known only by what you try on it. The face of the closed box is a plane of two dials; a third dial,
   unlabelled, sits beside it. Tap the plane to run the box at that setting: a result comes back, with its noise,
   and lights a patch of what you now know. The picture is the trace. Write a note (a setting and how far you trust
   it, and words), hand it to a search program, and see how far it carries, on this box and on its twin. The box is
   the Tune engine (src/engines/tune.js), a model of learning by trying, not of any real machine. Words: tune.*. */
import { t, fmtNum } from '../core/i18n.js';
import { machine, run, truth, rng, handover, GOOD, BUDGET, RANGE, RUNS } from '../engines/tune.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const TRUSTS = [0.5, 1.5, 3];
const S = { tries: [], z: 5, R: rng(2026), trust: 1, note: null, words: '', hand: null, open: false };
const M = machine(false);
const r1 = v => Math.round(v * 10) / 10;
const n1 = v => fmtNum(r1(v));
/* a result as a colour: dark blue for nothing, through teal, to warm yellow for the best */
function hue(q) {
  const k = Math.max(0, Math.min(1, q / 100)), stops = [[30, 50, 110], [20, 150, 160], [250, 200, 70]];
  const [a, b, f] = k < 0.5 ? [stops[0], stops[1], k * 2] : [stops[1], stops[2], (k - 0.5) * 2];
  return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',') + ')';
}
const P = 300, X = v => (v / RANGE) * P, Y = v => P - (v / RANGE) * P;
const best = () => S.tries.reduce((b, x) => (!b || x.q > b.q ? x : b), null);

/* the true landscape at the third dial's setting, drawn only when the box is opened */
function landscape(z, age) {
  let h = ''; const n = 30, w = P / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = (i + 0.5) / n * RANGE, y = (j + 0.5) / n * RANGE; h += '<rect x="' + (i * w).toFixed(1) + '" y="' + (P - (j + 1) * w).toFixed(1) + '" width="' + (w + 0.4).toFixed(1) + '" height="' + (w + 0.4).toFixed(1) + '" fill="' + hue(truth(M, x, y, z, age)) + '"/>'; }
  return '<g class="tland">' + h + '</g>';
}
function plane() {
  const B = best();
  let g = '<svg class="tplane" viewBox="-34 -8 342 344" data-tplane role="img" aria-label="' + esc(t('tune.planeAria', { n: S.tries.length })) + '"><rect class="tbox" x="0" y="0" width="' + P + '" height="' + P + '" rx="6"/>';
  if (S.open) g += landscape(S.z, S.tries.length);
  for (let v = 0; v <= RANGE; v += 2) g += '<text class="u" x="' + X(v) + '" y="' + (P + 16) + '" text-anchor="middle">' + v + '</text><text class="u" x="-8" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>';
  g += '<text class="ax" x="' + P / 2 + '" y="' + (P + 32) + '" text-anchor="middle">' + esc(t('tune.dial1')) + '</text><text class="ax" transform="translate(-26 ' + P / 2 + ') rotate(-90)" text-anchor="middle">' + esc(t('tune.dial2')) + '</text>';
  S.tries.forEach((x, i) => { const near = Math.abs(x.p[2] - S.z) <= 0.5; g += '<circle class="tfog' + (near ? '' : ' far') + '" data-tz="' + x.p[2] + '" cx="' + X(x.p[0]).toFixed(1) + '" cy="' + Y(x.p[1]).toFixed(1) + '" r="22" fill="' + hue(x.q) + '"/>'; });
  S.tries.forEach((x, i) => { const near = Math.abs(x.p[2] - S.z) <= 0.5; g += '<circle class="tdot' + (near ? '' : ' far') + (x === B ? ' best' : '') + '" data-tz="' + x.p[2] + '" cx="' + X(x.p[0]).toFixed(1) + '" cy="' + Y(x.p[1]).toFixed(1) + '" r="' + (x === B ? 5.5 : 3.5) + '" fill="' + hue(x.q) + '"/>'; });
  if (S.note) g += '<circle class="ttrust" cx="' + X(S.note.p[0]).toFixed(1) + '" cy="' + Y(S.note.p[1]).toFixed(1) + '" r="' + (S.note.trust / RANGE * P).toFixed(1) + '"/>';
  return g + '</svg>';
}
/* a search program's trace, small: every try a dot, and the path of the settings it kept */
function trace(res, name) {
  let g = '<svg viewBox="-4 -4 128 128" class="tthumb" aria-hidden="true"><rect class="tbox" x="0" y="0" width="120" height="120" rx="4"/>', kept = [], bestQ = -1;
  res.one.tries.forEach(x => { g += '<circle cx="' + (x.p[0] * 12).toFixed(1) + '" cy="' + (120 - x.p[1] * 12).toFixed(1) + '" r="2.4" fill="' + hue(x.q) + '"/>'; if (x.q > bestQ) { bestQ = x.q; kept.push(x.p); } });
  g += '<polyline class="tpath" points="' + kept.map(p => (p[0] * 12).toFixed(1) + ',' + (120 - p[1] * 12).toFixed(1)).join(' ') + '"/></svg>';
  const say = res.median != null ? t('tune.median', { n: res.median, s: fmtNum(Math.round(res.share * 100)) }) : t('tune.notFound', { b: BUDGET, s: fmtNum(Math.round(res.share * 100)) });
  return '<figure class="tfig">' + g + '<figcaption><b>' + esc(t(name)) + '</b><span>' + esc(say) + '</span></figcaption></figure>';
}

export function tuneHtml() {
  const B = best(), last = S.tries[S.tries.length - 1];
  let h = '<section class="tunebox" data-tune><p class="kicker">' + esc(t('tune.k')) + '</p>';
  h += '<div class="tgrid"><div class="tstage">' + plane() + '</div><div class="tside">';
  h += '<label class="tdial3"><b>' + esc(t('tune.dial3')) + '</b><input type="range" min="0" max="10" step="1" value="' + S.z + '" data-tin="z" aria-label="' + esc(t('tune.dial3')) + '"><span data-tz3>' + S.z + '</span></label>';
  h += '<div class="tread"><div><b>' + (last ? n1(last.q) : '–') + '</b><span>' + esc(t('tune.last')) + '</span></div><div><b>' + (B ? n1(B.q) : '–') + '</b><span>' + esc(t('tune.best')) + '</span></div><div><b>' + S.tries.length + '</b><span>' + esc(t('tune.tries')) + '</span></div></div>';
  h += '<p class="small">' + esc(!S.tries.length ? t('tune.start') : last.q >= 80 ? t('tune.hot') : B && B.q >= 60 && S.tries.length > 8 ? t('tune.warm') : t('tune.cold')) + '</p>';
  h += '<div class="chips"><button type="button" class="chipb" data-tk="again"' + (last ? '' : ' disabled') + '>' + esc(t('tune.again')) + '</button><button type="button" class="chipb" data-tk="open" aria-pressed="' + S.open + '"' + (S.tries.length >= 8 ? '' : ' disabled') + '>' + esc(t(S.open ? 'tune.close' : 'tune.open')) + '</button><button type="button" class="chipb" data-tk="reset">' + esc(t('tune.reset')) + '</button></div>';
  if (S.open && S.tries.length) { const first = S.tries.findIndex(x => x.t >= GOOD); h += '<p class="small">' + esc(first >= 0 ? t('tune.openFound', { n: first + 1, q: n1(S.tries[first].t) }) : t('tune.openNot', { q: n1(Math.max(...S.tries.map(x => x.t))) })) + ' ' + esc(t('tune.openSay')) + '</p>'; }
  h += '</div></div>';
  /* the note */
  h += '<div class="tnote"><p class="kicker">' + esc(t('tune.noteK')) + '</p>';
  if (!B) h += '<p class="small muted">' + esc(t('tune.noteWait')) + '</p>';
  else {
    const p = S.note ? S.note.p : B.p;
    h += '<p>' + esc(t('tune.noteSet', { a: n1(p[0]), b: n1(p[1]), c: n1(p[2]) })) + ' <button type="button" class="chipb small" data-tk="fromBest">' + esc(t('tune.fromBest')) + '</button></p>';
    h += '<div class="pctl"><span class="small"><b>' + esc(t('tune.trust')) + '</b></span><div class="chips">' + TRUSTS.map((v, i) => '<button type="button" class="chipb" data-tk="trust" data-tv="' + i + '" aria-pressed="' + (S.trust === i) + '">' + esc(t('tune.trust.' + i)) + '</button>').join('') + '</div></div>';
    h += '<label class="twords"><span class="small"><b>' + esc(t('tune.words')) + '</b></span><textarea rows="2" data-tin="words" placeholder="' + esc(t('tune.wordsPh')) + '">' + esc(S.words) + '</textarea></label>';
    h += '<button type="button" class="chipb tgo" data-tk="hand">' + esc(t('tune.hand')) + '</button>';
  }
  if (S.hand) h += '<div class="thand">' + trace(S.hand.cold, 'tune.h.cold') + trace(S.hand.note, 'tune.h.note') + trace(S.hand.twin, 'tune.h.twin') + '</div><p class="plead">' + esc(sayHand(S.hand)) + '</p>' + (S.words.trim() ? '<p class="small">' + esc(t('tune.wordsLost')) + '</p>' : '');
  h += '</div><p class="small muted">' + esc(t('tune.model', { runs: RUNS, b: BUDGET, good: GOOD })) + '</p>';
  return h + '</section>';
}
function sayHand(H) {
  const n = H.note.median, c = H.cold.median, w = H.twin.median;
  const here = n == null ? t('tune.s.noteFail') : c == null ? t('tune.s.noteOnly', { n }) : n < c ? t('tune.s.noteFaster', { n, c }) : t('tune.s.noteNoHelp', { n, c });
  const twin = w == null ? t('tune.s.twinFail') : n != null && w > n * 1.5 + 2 ? t('tune.s.twinWorse', { w }) : t('tune.s.twinOk', { w });
  return here + ' ' + twin;
}
function redraw(box, focusSel) {
  const w = document.createElement('div'); w.innerHTML = tuneHtml(); const fresh = w.firstElementChild; box.replaceWith(fresh);
  const f = focusSel && fresh.querySelector(focusSel); if (f) f.focus();
}
function tryAt(x, y) { const p = [r1(x), r1(y), S.z]; S.tries.push({ p, q: run(M, p[0], p[1], p[2], S.tries.length, S.R), t: truth(M, p[0], p[1], p[2], S.tries.length) }); }

export function tuneInput(el, ev) {
  const box = el.closest('[data-tune]'); if (!box) return false;
  if (el.matches('[data-tplane]')) {
    const r = el.getBoundingClientRect(), vb = el.viewBox.baseVal, sx = (ev.clientX - r.left) / r.width * vb.width + vb.x, sy = (ev.clientY - r.top) / r.height * vb.height + vb.y;
    if (sx < 0 || sy < 0 || sx > P || sy > P) return true;
    tryAt(sx / P * RANGE, (P - sy) / P * RANGE); redraw(box); return true;
  }
  const k = el.dataset.tk; if (!k) return false;
  if (k === 'again') { const l = S.tries[S.tries.length - 1]; S.z = l.p[2]; tryAt(l.p[0], l.p[1]); }
  else if (k === 'open') S.open = !S.open;
  else if (k === 'reset') { S.tries = []; S.note = null; S.hand = null; S.open = false; S.R = rng(2026 + Math.floor(Math.random() * 1000)); }
  else if (k === 'fromBest') { const B = best(); S.note = { p: B.p.slice(), trust: TRUSTS[S.trust] }; S.hand = null; }
  else if (k === 'trust') { S.trust = +el.dataset.tv; const B = best(); S.note = { p: (S.note || B).p.slice(), trust: TRUSTS[S.trust] }; S.hand = null; }
  else if (k === 'hand') { const B = best(); if (!S.note) S.note = { p: B.p.slice(), trust: TRUSTS[S.trust] }; S.hand = handover(S.note, { age: S.tries.length }); }
  redraw(box, '[data-tk="' + k + '"]' + (el.dataset.tv ? '[data-tv="' + el.dataset.tv + '"]' : ''));
  return true;
}
/* the third dial and the words: kept as they change, without drawing everything again */
export function tuneType(el) {
  const box = el.closest('[data-tune]'); if (!box) return false;
  if (el.dataset.tin === 'words') { S.words = el.value; return true; }
  if (el.dataset.tin === 'z') {
    S.z = +el.value; box.querySelector('[data-tz3]').textContent = S.z;
    box.querySelectorAll('[data-tz]').forEach(c => c.classList.toggle('far', Math.abs(+c.dataset.tz - S.z) > 0.5));
    if (S.open) { const l = box.querySelector('.tland'); if (l) { const w = document.createElement('div'); w.innerHTML = '<svg>' + landscape(S.z, S.tries.length) + '</svg>'; l.replaceWith(w.firstElementChild.firstElementChild); } }
    return true;
  }
  return false;
}
