/* Lab: REALITY STRESS TEST. A design that passed every check is shipped to a phone, a car, a data
   center or a satellite. Pick fixes until it survives; every fix costs speed, power, area or money. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import { evaluate, insight, MISSIONS, MISSION_IDS, PERFECT, TESTS, CAUSES, SIGMA, Phi } from 'osl/engines/reality.js';

const KEY = 'osl-reality-v1';
const COL = { timing: 'amber', esc: 'rose', lat: 'violet', em: 'cyan' };

export function init() {
  const cv = $('#rlCv'); if (!cv) return;
  /* Each mission keeps its own choices; all start from the perfect design. */
  const S = { mission: 'phone', view: 'time', year: 1, by: {}, shipped: {} };
  try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object') { if (MISSIONS[j.mission]) S.mission = j.mission; if (j.view === 'spread') S.view = 'spread'; if (j.by && typeof j.by === 'object') MISSION_IDS.forEach(m => { if (j.by[m] && typeof j.by[m] === 'object') S.by[m] = { ...PERFECT, ...j.by[m] }; }); if (j.shipped && typeof j.shipped === 'object') S.shipped = j.shipped; } } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ mission: S.mission, view: S.view, by: S.by, shipped: S.shipped })); } catch (e) { /* ignore */ } };
  const cur = () => (S.by[S.mission] = S.by[S.mission] || { ...PERFECT });

  const el = id => $('#' + id);
  const press = (box, attr, val) => box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset[attr] === val ? 'true' : 'false'));
  el('rlMission').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.mission = b.dataset.m; S.year = 1; save(); sync(); });
  el('rlView').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.view = b.dataset.v; save(); render(); });
  el('rlTest').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur().test = b.dataset.t; save(); render(); });
  el('rlLogic').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cur().logic = b.dataset.l; save(); render(); });
  el('rlMargin').addEventListener('input', e => { cur().margin = +e.target.value / 100; save(); render(); });
  el('rlBoost').addEventListener('input', e => { cur().vboost = +e.target.value / 100; save(); render(); });
  [['rlAvs', 'avs'], ['rlGrid', 'grid'], ['rlCool', 'cool'], ['rlBurn', 'burn'], ['rlEcc', 'ecc']].forEach(([id, k]) => el(id).addEventListener('change', e => { cur()[k] = e.target.checked; save(); render(); }));
  el('rlYear').addEventListener('input', e => { S.year = +e.target.value; render(); });
  el('rlReset').addEventListener('click', () => { S.by[S.mission] = { ...PERFECT }; save(); sync(); });

  /* Put the controls in line with the current mission's choices. */
  function sync() {
    const s = cur();
    el('rlMargin').value = Math.round(s.margin * 100); el('rlBoost').value = Math.round(s.vboost * 100);
    el('rlAvs').checked = s.avs; el('rlGrid').checked = s.grid; el('rlCool').checked = s.cool; el('rlBurn').checked = s.burn; el('rlEcc').checked = s.ecc;
    render();
  }

  const pct = x => x >= 0.995 ? '100%' : (x * 100).toFixed(x < 0.1 ? 1 : 0) + '%';
  const failTxt = x => x < 1e-6 ? 'under 1 ppm' : x < 1e-3 ? Math.round(x * 1e6) + ' ppm' : (x * 100).toFixed(x < 0.1 ? 2 : 1).replace(/\.?0+$/, '') + '%';
  const count = x => x < 0.01 ? 'under 0.01' : x < 10 ? x.toFixed(x < 1 ? 2 : 1) : Math.round(x).toLocaleString('en-US');
  const times = x => x > 10 ? 'over 10×' : x.toFixed(2) + '×';
  const reqTxt = r => r.kind === 'fail' ? failTxt(r.have) + ' · allowed ' + failTxt(r.need) : r.kind === 'count' ? count(r.have) + ' · allowed ' + count(r.need) : r.kind === 'min' ? times(r.have) + ' · need at least ' + times(r.need) : times(r.have) + ' · allowed ' + times(r.need);

  let R = null;
  function render() {
    const s = cur(); const M = MISSIONS[S.mission];
    R = evaluate(S.mission, s);
    press(el('rlMission'), 'm', S.mission); press(el('rlView'), 'v', S.view); press(el('rlTest'), 't', s.test); press(el('rlLogic'), 'l', s.logic);
    el('rlMarginO').textContent = Math.round(s.margin * 100) + '%' + (s.margin ? ' (speed ×' + R.perf.toFixed(2) + ')' : '');
    el('rlBoostO').textContent = '+' + Math.round(s.vboost * 100) + '%';
    el('rlTestD').textContent = TESTS[s.test].d;
    el('rlStory').innerHTML = '<b>' + M.who + ', ' + M.life + ' years.</b> ' + M.story;
    el('rlYearCtl').hidden = S.view !== 'spread';
    const yr = S.year * M.life; el('rlYearO').textContent = yr < 0.05 ? 'new' : yr.toFixed(yr < 10 ? 1 : 0) + ' years';
    if (R.pass && !S.shipped[S.mission]) { S.shipped[S.mission] = 1; save(); }
    el('rlTag').innerHTML = R.pass ? '<span class="status ok">Ships</span>' : '<span class="status bad">' + R.req.filter(r => !r.ok).length + ' of ' + R.req.length + ' requirements fail</span>';
    el('rlReqs').innerHTML = '<div class="rl-reqhead"><span></span><b>' + M.t + ': what the customer needs</b><span></span></div>' + R.req.map(r => '<div class="' + (r.ok ? 'ok' : 'no') + '"><i></i><span>' + r.t + '</span><b>' + reqTxt(r) + '</b></div>').join('');
    const I = insight(R);
    el('rlInsight').innerHTML = (I.ok ? '<b>Shipped.</b> ' : '<b>What breaks:</b> ') + I.t.replace(/^Shipped\. /, '');
    el('rlInsight').className = 'rl-insight ' + (I.ok ? 'ok' : '');
    const passTest = R.yTiming * R.yDefect;
    el('rlOut').innerHTML = [
      ['Pass the factory test', pct(passTest)],
      ['Fail in service by year ' + M.life, failTxt(R.at.total)],
      ['Silent wrong answers a year', count(R.silent) + ' in the fleet'],
      ['Errors caught, safe restart', count(R.detected) + ' a year'],
      ['Speed · power · area', R.perf.toFixed(2) + ' · ' + R.power.toFixed(2) + ' · ' + R.area.toFixed(2)],
      ['Cost per good chip', times(R.cost)]
    ].map(x => '<div><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');
    draw();
  }

  /* ---- charts ---- */
  function draw() {
    if (!R) return; const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    c.font = '11px IBM Plex Mono, monospace'; c.textBaseline = 'middle';
    if (S.view === 'spread') drawSpread(c, w, h); else drawTime(c, w, h);
  }

  function drawTime(c, w, h) {
    const M = R.M, L = { l: 54, r: 14, t: 30, b: 30 };
    /* Lay out the legend first, wrapping onto as many rows as the width needs. */
    const items = [['Total', T.ink]].concat(Object.keys(COL).map(k => [CAUSES[k].t, T[COL[k]]])); const spots = []; let lx = L.l, row = 0;
    items.forEach(([t, col]) => { const tw = c.measureText(t).width + 30; if (lx + tw > w - 4 && lx > L.l) { row++; lx = L.l; } spots.push([t, col, lx, 12 + row * 15]); lx += tw; });
    L.t = 30 + row * 15; const pw = w - L.l - L.r, ph = h - L.t - L.b;
    const tMax = M.life * 1.5, yMin = -6, yMax = 0;   // log10 of the failed share: 1 ppm to 100%
    const X = t => L.l + t / tMax * pw, Y = f => L.t + (1 - (Math.log10(Math.max(f, 1e-6)) - yMin) / (yMax - yMin)) * ph;
    c.strokeStyle = rgba(T.muted, 0.25); c.lineWidth = 1; c.fillStyle = T.muted; c.textAlign = 'right';
    [[1e-6, '1 ppm'], [1e-5, '10 ppm'], [1e-4, '100 ppm'], [1e-3, '0.1%'], [1e-2, '1%'], [1e-1, '10%'], [1, '100%']].forEach(([f, t]) => { const y = Y(f); c.beginPath(); c.moveTo(L.l, y); c.lineTo(w - L.r, y); c.stroke(); c.fillText(t, L.l - 6, y); });
    c.textAlign = 'center'; const step = M.life <= 3 ? 1 : M.life <= 5 ? 1 : M.life <= 10 ? 2 : 5;
    for (let t = 0; t <= tMax + 1e-9; t += step) c.fillText(t + (t === 0 ? '' : ' y'), X(t), h - L.b + 14);
    /* The requirement and the end of the mission. */
    const need = M.need.fail; c.strokeStyle = T.good; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(L.l, Y(need)); c.lineTo(w - L.r, Y(need)); c.stroke();
    c.beginPath(); c.strokeStyle = rgba(T.ink, 0.5); c.moveTo(X(M.life), L.t); c.lineTo(X(M.life), h - L.b); c.stroke(); c.setLineDash([]);
    c.textAlign = 'left'; c.fillStyle = T.good; c.fillText('allowed: ' + failTxt(need), L.l + 6, Y(need) - 9);
    c.fillStyle = T.ink; c.textAlign = 'right'; c.fillText('end of service', X(M.life) - 5, L.t + 8);
    /* One line per cause, then the total. */
    const N = 120, line = (f, col, lw) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); let on = false; for (let i = 0; i <= N; i++) { const t = i / N * tMax, v = f(t); if (v < 1e-6) { on = false; continue; } const x = X(t), y = Y(v); if (!on) { c.moveTo(x, y); on = true; } else c.lineTo(x, y); } c.stroke(); };
    Object.keys(COL).forEach(k => line(R.curve[k], T[COL[k]], 1.6));
    line(R.curve.total, T.ink, 2.6);
    /* Legend. */
    c.textAlign = 'left'; spots.forEach(([t, col, x, y]) => { c.fillStyle = col; c.fillRect(x, y - 2, 12, 4); c.fillStyle = T.ink; c.fillText(t, x + 16, y); });
  }

  function drawSpread(c, w, h) {
    const M = R.M, L = { l: 14, r: 14, t: 34, b: 44 }, pw = w - L.l - L.r, ph = h - L.t - L.b;
    const years = S.year * M.life, sF = Math.min(R.sField(years), R.sTest), sT = R.sTest;
    const lo = 1 - 4.2 * SIGMA, hi = 1 + 4.2 * SIGMA;
    const X = s => L.l + (s - lo) / (hi - lo) * pw, pdf = s => Math.exp(-0.5 * ((s - 1) / SIGMA) ** 2), Y = v => L.t + (1 - v) * ph;
    const band = (a, b, col) => { a = Math.max(lo, a); b = Math.min(hi, b); if (b <= a) return; c.fillStyle = col; c.beginPath(); c.moveTo(X(a), Y(0)); for (let i = 0; i <= 80; i++) { const s = a + (b - a) * i / 80; c.lineTo(X(s), Y(pdf(s))); } c.lineTo(X(b), Y(0)); c.closePath(); c.fill(); };
    band(lo, sF, rgba(T.good, 0.45)); band(sF, sT, rgba(T.bad, 0.6)); band(sT, hi, rgba(T.muted, 0.35));
    c.strokeStyle = T.ink; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i <= 160; i++) { const s = lo + (hi - lo) * i / 160; i ? c.lineTo(X(s), Y(pdf(s))) : c.moveTo(X(s), Y(pdf(s))); } c.stroke();
    c.strokeStyle = rgba(T.muted, 0.6); c.beginPath(); c.moveTo(L.l, Y(0)); c.lineTo(w - L.r, Y(0)); c.stroke();
    /* Markers: the one chip the design was checked on, the test limit, the field limit. */
    const mark = (s, t, col, row) => { if (s < lo || s > hi) return; const x = X(s); c.strokeStyle = col; c.setLineDash([4, 3]); c.beginPath(); c.moveTo(x, L.t - 6); c.lineTo(x, Y(0)); c.stroke(); c.setLineDash([]); c.fillStyle = col; c.textAlign = x > w * 0.7 ? 'right' : x < w * 0.3 ? 'left' : 'center'; c.fillText(t, x, L.t - 12 - row * 13); };
    mark(1, 'the chip it was checked on', T.ink, 0);
    if (sT < hi) mark(sT, 'test limit', T.muted, 1);
    if (sF < sT) mark(sF, 'too slow in service', T.bad, sT < hi && Math.abs(X(sT) - X(sF)) < 120 ? 0 : 1);
    c.textAlign = 'left'; c.fillStyle = T.muted; c.fillText('faster chips', L.l, h - L.b + 16); c.textAlign = 'right'; c.fillText('slower chips', w - L.r, h - L.b + 16);
    const fail = Math.max(0, Phi((sT - 1) / SIGMA) - Phi((sF - 1) / SIGMA)), thrown = 1 - Phi((sT - 1) / SIGMA);
    c.textAlign = 'center'; c.fillStyle = T.ink;
    c.fillText('■ works ' + pct(Math.max(0, 1 - fail - thrown)) + '   ■ fails in service ' + failTxt(fail) + '   ■ thrown away at test ' + failTxt(thrown), w / 2, h - 12);
    const lx = w / 2 - c.measureText('■ works ' + pct(Math.max(0, 1 - fail - thrown)) + '   ■ fails in service ' + failTxt(fail) + '   ■ thrown away at test ' + failTxt(thrown)).width / 2;
    c.textAlign = 'left'; c.fillStyle = T.good; c.fillText('■', lx, h - 12);
    const t1 = '■ works ' + pct(Math.max(0, 1 - fail - thrown)) + '   '; c.fillStyle = T.bad; c.fillText('■', lx + c.measureText(t1).width, h - 12);
    const t2 = t1 + '■ fails in service ' + failTxt(fail) + '   '; c.fillStyle = T.muted; c.fillText('■', lx + c.measureText(t2).width, h - 12);
  }

  watch(cv, draw); sync();
}
