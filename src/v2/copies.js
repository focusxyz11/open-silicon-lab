/* Copies: one design as a crowd of chips (content/fail.md, the visual system of "why can a perfect design fail?").
   Every dot is a copy of the same perfect design, a little faster or slower than the next. Across the picture runs
   how slow each copy is; the factory's Test throws away the slowest; then, year by year where the chips live, heat,
   supply dips and age push more of them past the edge, and hidden flaws break others. Every count comes from the
   Stress engine (src/engines/life.js) at that moment: the dots are a sample of the crowd, the numbers are the
   engine's. Words: life.* (the engine's own) and copies.*. */
import { esc } from '../core/esc.js';
import { t, fmtNum } from '../core/i18n.js';
import { live, MISSION_IDS, MARGINS, PROTECT, SIGMA, normalLife } from '../engines/life.js';

const rnd = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
const gauss = (i, k) => Math.sqrt(-2 * Math.log(Math.max(1e-6, rnd(i, k)))) * Math.cos(2 * Math.PI * rnd(i, k + 7));
const N = 360;
/* the crowd: each copy's slowness (1 = the typical chip the design was signed off on), a height to spread the
   dots, and a draw that decides which copies the rarer flaws hit */
const CROWD = Array.from({ length: N }, (_, i) => ({ x: 1 + SIGMA * gauss(i, 3), y: gauss(i, 5), u: rnd(i, 11) }));
const BY_SLOW = CROWD.map((c, i) => i).sort((a, b) => CROWD[b].x - CROWD[a].x);

const S = { mission: 'phone', choices: normalLife({}), year: null };
const share = v => (v >= 0.01 ? t('life.share.pct', { v: fmtNum(Number((v * 100).toPrecision(2))) }) : t('life.share.ppm', { v: fmtNum(Math.round(v * 1e6)) }));
const reqText = (r, M) => {
  const have = r.id === 'fail' ? share(r.have) : r.id === 'silent' ? fmtNum(Math.round(r.have)) : r.id === 'perf' ? t('life.share.pct', { v: Math.round(r.have * 100) }) : t('life.times', { v: fmtNum(Number(r.have.toPrecision(2))) });
  const need = r.id === 'fail' ? share(r.need) : r.id === 'silent' ? fmtNum(r.need) : r.id === 'perf' ? t('life.share.pct', { v: Math.round(r.need * 100) }) : t('life.times', { v: r.need });
  return t('life.have', { have, need });
};

export function copiesHtml() {
  const r = live(S.mission, S.choices), M = r.M, year = S.year == null ? M.life : Math.min(S.year, M.life);
  /* who is where at this year: rejected at the Test (the slowest), failed out here (the next slowest), hit by a flaw */
  const nReject = Math.round(N * (1 - r.yTiming)), shipped = BY_SLOW.slice(nReject), nTiming = Math.round(shipped.length * r.curve.timing(year));
  const other = 1 - ['escape', 'weak', 'wear'].reduce((a, c) => a * (1 - r.curve[c](year)), 1);
  const state = new Array(N).fill('ok');
  BY_SLOW.slice(0, nReject).forEach(i => (state[i] = 'rejected'));
  shipped.slice(0, nTiming).forEach(i => (state[i] = 'late'));
  shipped.forEach(i => { if (state[i] === 'ok' && CROWD[i].u < other) state[i] = 'flaw'; });
  const lo = 1 - 4 * SIGMA, hi = 1 + 4 * SIGMA, X = v => 30 + ((v - lo) / (hi - lo)) * 580, Y = v => 120 + v * 30;
  const edgeOf = list => (list.length ? CROWD[list[list.length - 1]].x : hi);
  const testEdge = nReject ? (CROWD[BY_SLOW[nReject - 1]].x + CROWD[BY_SLOW[nReject]].x) / 2 : hi, fieldEdge = nTiming ? edgeOf(shipped.slice(0, nTiming)) : testEdge;
  let svg = '<svg class="copies" viewBox="0 0 640 260" role="img" aria-label="' + esc(t('copies.aria', { n: N })) + '">';
  svg += '<rect x="30" y="20" width="' + (X(Math.min(testEdge, hi)) - 30).toFixed(1) + '" height="200" rx="8" class="cwin"/>';
  svg += '<line x1="' + X(testEdge).toFixed(1) + '" y1="14" x2="' + X(testEdge).toFixed(1) + '" y2="226" class="cedge"/>';
  if (nTiming) svg += '<line x1="' + X(fieldEdge).toFixed(1) + '" y1="14" x2="' + X(fieldEdge).toFixed(1) + '" y2="226" class="cedge field"/>';
  CROWD.forEach((c, i) => { svg += '<circle cx="' + X(Math.max(lo, Math.min(hi, c.x))).toFixed(1) + '" cy="' + Y(Math.max(-3, Math.min(3, c.y))).toFixed(1) + '" r="3.1" class="c' + state[i] + '"/>'; });
  svg += '<text x="30" y="246" class="cax">' + esc(t('copies.faster')) + '</text><text x="610" y="246" class="cax" text-anchor="end">' + esc(t('copies.slower')) + '</text>';
  svg += '<text x="' + (X(testEdge) + 6).toFixed(1) + '" y="30" class="cax">' + esc(t('copies.test')) + '</text></svg>';
  const count = s => state.filter(v => v === s).length;
  let h = '<section class="copiesbox" data-copies>';
  h += '<div class="pctl"><span class="small"><b>' + esc(t('life.where')) + '</b></span><div class="chips">' + MISSION_IDS.map(m => '<button type="button" class="chipb" data-cp="mission" data-cv="' + m + '" aria-pressed="' + (m === S.mission) + '">' + esc(t('copies.place.' + m)) + '</button>').join('') + '</div></div>';
  h += svg;
  h += '<label class="cyear"><span class="small"><b>' + esc(t('life.axis.years', { n: fmtNum(Number(year.toPrecision(2))) })) + '</b></span><input type="range" data-cyear min="0" max="' + M.life + '" step="' + (M.life / 30) + '" value="' + year + '" aria-label="' + esc(t('copies.year')) + '"></label>';
  h += '<p class="ckey small">' + ['ok', 'rejected', 'late', 'flaw'].map(k => '<span class="ki"><span class="dot ' + k + '"></span>' + esc(t('copies.' + k, { n: count(k) })) + '</span>').join('') + '</p>';
  h += '<div class="cgrid"><div><p class="kicker">' + esc(t('life.inDesign')) + '</p><div class="pctl"><span class="small">' + esc(t('life.margin')) + '</span><div class="chips">' + MARGINS.map((m, i) => '<button type="button" class="chipb" data-cp="margin" data-cv="' + i + '" aria-pressed="' + (i === S.choices.margin) + '">' + esc(t('life.marginValue', { v: Math.round(m * 100) })) + '</button>').join('') + '</div></div>' +
    '<div class="chips">' + PROTECT.map(p => '<button type="button" class="chipb" data-cp="protect" data-cv="' + p + '" aria-pressed="' + (p === S.choices.protect) + '">' + esc(t('life.protect.' + p)) + '</button>').join('') + '<button type="button" class="chipb" data-cp="grid" aria-pressed="' + S.choices.grid + '">' + esc(t('life.grid')) + '</button></div></div>' +
    '<div><p class="kicker">' + esc(t('life.atFactory')) + '</p><div class="chips"><button type="button" class="chipb" data-cp="hot" aria-pressed="' + S.choices.hot + '">' + esc(t('life.hot')) + '</button><button type="button" class="chipb" data-cp="burn" aria-pressed="' + S.choices.burn + '">' + esc(t('life.burn')) + '</button></div></div></div>';
  h += '<p class="kicker">' + esc(t('life.need')) + '</p><ul class="creq">' + r.req.map(q => '<li class="' + (q.ok ? 'ok' : 'bad') + '"><b>' + esc(t('life.req.' + q.id, { life: M.life })) + '</b> ' + esc(reqText(q, M)) + '</li>').join('') + '</ul>';
  h += '<p class="plead">' + esc(t('life.hint.' + r.hint, { cov: Math.round(100 * r.cover) })) + '</p><p class="small muted">' + esc(t('copies.sample', { n: N })) + ' ' + esc(t('life.model')) + '</p>';
  return h + '</section>';
}
/* a control was used: the engine runs again, the crowd is drawn anew, focus stays */
export function copiesInput(target) {
  const box = target.closest('[data-copies]'); if (!box) return false;
  if (target.matches('[data-cyear]')) { S.year = +target.value; }
  else { const k = target.dataset.cp, v = target.dataset.cv; if (!k) return false;
    if (k === 'mission') { S.mission = v; S.year = null; }
    else if (k === 'margin') S.choices = normalLife(Object.assign({}, S.choices, { margin: +v }));
    else if (k === 'protect') S.choices = normalLife(Object.assign({}, S.choices, { protect: v }));
    else S.choices = normalLife(Object.assign({}, S.choices, { [k]: !S.choices[k] })); }
  const wrap0 = document.createElement('div'); wrap0.innerHTML = copiesHtml(); const next = wrap0.firstElementChild;
  /* the year only moves the crowd: the slider stays in your hand */
  if (target.matches('[data-cyear]')) { ['svg.copies', '.ckey', '.cyear > span'].forEach(q => { const a = box.querySelector(q), b = next.querySelector(q); if (a && b) a.replaceWith(b); }); return true; }
  const sel = target.matches('[data-cyear]') ? '[data-cyear]' : '[data-cp="' + target.dataset.cp + '"]' + (target.dataset.cv ? '[data-cv="' + target.dataset.cv + '"]' : '');
  const fresh = next; box.replaceWith(fresh);
  const f = fresh.querySelector(sel); if (f) f.focus();
  return true;
}
