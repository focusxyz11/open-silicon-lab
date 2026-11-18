/* Follow the joule: a lens over the dive for the energy puzzle (content/puzzles/energy.md). Where does the energy of one
   answer go? At the level in view, the energy there split into computing, moving data and heat; through the levels above
   and below, a thin trace of the same. The labs that live at each level are its levers: pulling one runs the budget
   engine again (src/engines/budget.js) and the whole trace changes, so a lever at one level shows its effect on all the
   others. Your plan can be kept as an attempt, a try in the ledger that the engine scores (src/engines/ledger.js), and
   the map of attempts puts every attempt by its energy against its time, with who made it and how AI was used.
   Words are HTML over the picture, never drawn into the scene. Desktop gets the map; a phone the trace and the levers
   where you are.

   createJoule(host, o): o.S (the state: S.joule { on, plan }), o.save(), o.keep(plan, el) → { ok, e, r }, o.slip(id) → html,
   o.slipClick(ev, done(redraw)) → handled, o.refusal(r), o.signHtml(), o.attempts() → entries of the puzzle (yours too, marked draft), o.changed(on) when the lens opens or closes.
   Returns { level(id), on(v), bottom(), redraw() }. */
import { t, fmtNum } from '../core/i18n.js';
import { budget, LEVELS, PARTS, LEVERS, PLAN, JOB, problem } from '../engines/budget.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const n2 = v => fmtNum(+v.toPrecision(2));
/* joules in words: kJ, J, mJ, µJ, nJ */
export function joules(j) {
  const [u, k] = j >= 1e3 ? ['kJ', 1e-3] : j >= 1 ? ['J', 1] : j >= 1e-3 ? ['mJ', 1e3] : j >= 1e-6 ? ['uJ', 1e6] : ['nJ', 1e9];
  return t('joule.u.' + u, { v: n2(j * k) });
}
/* a share in words: a whole percent, one decimal under ten, and "under 0.1%" below that */
export const share = s => s >= 0.095 ? t('joule.pct', { v: fmtNum(Math.round(s * 100)) }) : s >= 0.001 ? t('joule.pct', { v: fmtNum(+(s * 100).toFixed(1)) }) : s > 0 ? t('joule.tiny') : t('joule.pct', { v: '0' });
/* a lever's value in words */
export function valueWords(id, v) {
  if (id === 'home' || id === 'optics') return t('joule.v.' + id + '.' + v);
  if (id === 'cim') return t(v ? 'joule.v.on' : 'joule.v.off');
  if (id === 'batch') return t('joule.v.batch', { n: fmtNum(v) });
  if (id === 'precision' || id === 'adcBits') return t('joule.v.bits', { n: id === 'precision' ? { fp16: 16, fp8: 8, fp4: 4 }[v] : v });
  if (id === 'clock') return t('joule.v.clock', { v: fmtNum(v) });
  return t('joule.v.pue', { v: fmtNum(v) });
}
/* a plan as kept: only what differs from the starting plan, and only values the engine accepts */
export function normalPlan(p) {
  const out = {}; if (!p || typeof p !== 'object') return out;
  LEVERS.forEach(L => { if (Object.hasOwn(p, L.id) && L.values.includes(p[L.id]) && p[L.id] !== PLAN[L.id]) out[L.id] = p[L.id]; });
  return problem(JOB, out) ? {} : out;
}
export const normalJoule = j => ({ on: !!(j && j.on), plan: normalPlan(j && j.plan) });

const bar = (parts, total) => PARTS.map(k => parts[k] > 0 ? '<i class="jp ' + k + '" style="flex:' + (parts[k] / total).toFixed(5) + '"></i>' : '').join('');
const delta = r => { const d = Math.round((r - 1) * 100); return d === 0 ? '' : '<span class="jd ' + (d < 0 ? 'down' : 'up') + '">' + esc(t(d < 0 ? 'joule.less' : 'joule.more', { v: fmtNum(Math.abs(d)) })) + '</span>'; };

export function createJoule(host, o) {
  const S = o.S; S.joule = normalJoule(S.joule);
  let at = 'chip', last = null, pulled = null, mapOn = false, mine = null, no = '', more = false;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'joulebtn'; btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = '<span class="jbolt" aria-hidden="true"></span><span>' + esc(t('joule.toggle')) + '</span>';
  const box = document.createElement('aside'); box.className = 'joule'; box.hidden = true; box.setAttribute('aria-label', t('joule.k'));
  host.appendChild(btn); host.appendChild(box);

  /* the trace: every level, the one in view open with its split and its levers */
  function row(l, B, before) {
    const L = B.levels[l], here = l === at, levers = LEVERS.filter(x => x.level === l && (x.id !== 'adcBits' || S.joule.plan.cim));
    const r = before && before.levels[l].total ? L.total / before.levels[l].total : 1;
    let h = '<li class="jrow' + (here ? ' here' : '') + '" data-jl="' + l + '"><span class="jn">' + esc(t('depth.' + l + '.name')) + '</span>' +
      '<span class="jbar" aria-hidden="true"><span class="jfill" style="width:' + Math.max(0.6, B.shares[l] * 100).toFixed(2) + '%">' + bar(L, L.total || 1) + '</span></span>' +
      '<span class="js">' + esc(l === 'atom' ? t('joule.floor') : share(B.shares[l])) + (before ? delta(r) : '') + '</span>';
    if (here) {
      h += '<div class="jopen"><p class="jline"><b>' + esc(joules(L.total)) + '</b> ' + esc(t('joule.here', { level: t('depth.' + l + '.name') })) + '</p>' +
        '<p class="jsplit">' + PARTS.filter(k => L[k] > 0).map(k => '<span><i class="jp ' + k + '"></i>' + esc(t('joule.kind.' + k)) + ' ' + esc(share(L[k] / L.total)) + '</span>').join('') + '</p>' +
        '<p class="small muted">' + esc(t('joule.at.' + l)) + '</p>';
      h += levers.map(x => lever(x)).join('');
      h += '</div>';
    } else if (levers.length) h += '<span class="jlv">' + levers.map(x => '<button type="button" class="jchip" data-jgo="' + l + '">' + esc(t('joule.lever.' + x.id + '.t')) + '</button>').join('') + '</span>';
    return h + '</li>';
  }
  /* a lever: what it changes, the lab where it is played, and its values */
  const lever = x => { const now = S.joule.plan[x.id] === undefined ? PLAN[x.id] : S.joule.plan[x.id];
    return '<div class="jlever"><p class="jlt"><b>' + esc(t('joule.lever.' + x.id + '.t')) + '</b> <a class="small" href="#/do/' + esc(x.lab) + '">' + esc(t('joule.lab', { lab: t('game.ch.' + x.lab + '.t') })) + '</a></p>' +
      '<div class="seg jseg" role="group" aria-label="' + esc(t('joule.lever.' + x.id + '.t')) + '">' + x.values.map((v, i) => '<button type="button" data-jv="' + x.id + ':' + i + '" aria-pressed="' + (v === now) + '">' + esc(valueWords(x.id, v)) + '</button>').join('') + '</div></div>'; };

  /* the map of attempts: energy of one answer (down is less) against seconds for it (left is quicker), both on log scales */
  function map(B) {
    const A = o.attempts().filter(e => e.facts), pts = A.map(e => ({ e, x: e.facts.seconds, y: e.facts.joules })).concat([{ you: true, x: B.seconds, y: B.total }]);
    const lx = pts.map(p => Math.log10(p.x)), ly = pts.map(p => Math.log10(p.y)), pad = 0.3;
    const x0 = Math.min(...lx) - pad, x1 = Math.max(...lx) + pad, y0 = Math.min(...ly) - pad, y1 = Math.max(...ly) + pad, W = 300, H = 190, L = 34, R = 8, T = 10, Bm = 30;
    const X = v => L + (Math.log10(v) - x0) / (x1 - x0) * (W - L - R), Y = v => T + (1 - (Math.log10(v) - y0) / (y1 - y0)) * (H - T - Bm);
    let g = '<svg class="jmap" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('joule.map.aria', { n: A.length })) + '">' +
      '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - Bm) + '" y2="' + (H - Bm) + '"/><line class="ax" x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + (H - Bm) + '"/>' +
      '<text class="axt" x="' + ((W + L) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(t('joule.map.x')) + '</text>' +
      '<text class="axt" x="10" y="' + ((H - Bm + T) / 2) + '" text-anchor="middle" transform="rotate(-90 10 ' + ((H - Bm + T) / 2) + ')">' + esc(t('joule.map.y')) + '</text>';
    A.forEach(e => { g += '<circle class="jdot ' + esc(e.made) + (e.draft ? ' draft' : '') + (e.state === 'front' ? ' front' : '') + '" cx="' + X(e.facts.seconds).toFixed(1) + '" cy="' + Y(e.facts.joules).toFixed(1) + '" r="' + (e.state === 'front' ? 5 : 3.6) + '"><title>' + esc(e.by + ' · ' + t('build.kind.' + e.made) + ' · ' + joules(e.facts.joules)) + '</title></circle>'; });
    g += '<circle class="jyou" cx="' + X(B.seconds).toFixed(1) + '" cy="' + Y(B.total).toFixed(1) + '" r="7"/></svg>';
    const list = A.slice(0, 5).map(e => '<li><span class="made ' + esc(e.made) + '"></span><span><b>' + esc(joules(e.facts.joules)) + '</b> · ' + esc(t('joule.secs', { v: n2(e.facts.seconds) })) + ' · ' + esc(e.by) + ' · ' + esc(t('build.kind.' + e.made)) +
      ' <span class="small muted">· ' + esc(t('ledger.state.' + (e.draft ? 'draft' : e.state))) + '</span>' + (e.ai ? '<span class="small muted jai">' + esc(e.ai) + '</span>' : '') + '</span></li>').join('');
    return '<div class="jmapbox">' + g + '<p class="small muted">' + esc(t('joule.map.d')) + '</p>' + (A.length ? '<ul class="jlist">' + list + '</ul>' : '<p class="small muted">' + esc(t('joule.map.none')) + '</p>') + '</div>';
  }

  function draw() {
    btn.setAttribute('aria-pressed', String(S.joule.on)); btn.classList.toggle('on', S.joule.on); box.hidden = !S.joule.on;
    host.classList.toggle('jouling', S.joule.on); if (o.changed) o.changed(S.joule.on);
    if (!S.joule.on) return;
    const B = budget(JOB, S.joule.plan); if (!B.ok) { S.joule.plan = {}; return draw(); }
    const before = pulled ? last : null; last = B;
    let h = '<div class="jhead"><p class="kicker">' + esc(t('joule.k')) + '</p><button type="button" class="jx" data-jx aria-label="' + esc(t('joule.close')) + '">×</button></div>' +
      '<p class="jq">' + esc(t('joule.q')) + '</p>' +
      '<p class="jtot"><b>' + esc(t('joule.wh', { v: n2(B.total / 3600) })) + '</b> ' + esc(t('joule.answer')) + (before ? delta(B.total / before.total) : '') + '<span class="small muted"> · ' + esc(t('joule.times', { v: fmtNum(+B.times.toPrecision(2)) })) + '</span></p>' +
      '<p class="jbig" aria-hidden="true">' + bar(B.parts, B.total) + '</p><p class="jkey small">' + PARTS.map(k => '<span><i class="jp ' + k + '"></i>' + esc(t('joule.kind.' + k)) + ' ' + esc(share(B.parts[k] / B.total)) + '</span>').join('') + '</p>' +
      (pulled ? '<p class="small jsay">' + esc(t('joule.pulled', { lever: t('joule.lever.' + pulled + '.t'), v: Math.round(Math.abs(1 - B.total / before.total) * 100) })) + '</p>' : '') +
      '<ol class="jtrace">' + LEVELS.map(l => row(l, B, before)).join('') + '</ol>' +
      /* on a phone the lens rests folded (the answer, and where you are); this opens the trace and the levers */
      '<button type="button" class="link jmore" data-jmore aria-expanded="' + more + '">' + esc(t(more ? 'joule.fold' : 'joule.more.levers')) + '</button>' +
      '<p class="small muted jother">' + esc(t('joule.other', { s: n2(B.seconds), db: fmtNum(Math.round(B.snrDb)) })) + '</p>';
    /* keep it as an attempt: signed, checked by the ledger, and sent as a pull request like every entry */
    h += mine ? o.slip(mine) : '<div class="jkeep">' + o.signHtml() + (no ? '<p class="small bad">' + esc(no) + '</p>' : '') +
      '<div class="acts"><button type="button" class="btn primary" data-jkeep>' + esc(t('joule.keep')) + '</button><button type="button" class="link" data-jreset>' + esc(t('joule.reset')) + '</button></div></div>';
    h += '<button type="button" class="link jmapt" data-jmap aria-expanded="' + mapOn + '">' + esc(t(mapOn ? 'joule.map.hide' : 'joule.map.show')) + '</button>' + (mapOn ? map(B) : '');
    h += '<p class="small muted">' + esc(t('joule.model')) + '</p>';
    box.innerHTML = h; box.classList.toggle('more', more); pulled = null;
  }

  btn.addEventListener('click', () => { S.joule.on = !S.joule.on; o.save(); draw(); });
  box.addEventListener('click', e => {
    if (o.slipClick(e, redraw => { if (redraw) mine = null; draw(); })) return;
    const q = s => e.target.closest(s);
    if (q('[data-jx]')) { S.joule.on = false; o.save(); return draw(); }
    const v = q('[data-jv]'); if (v) { const [id, i] = v.dataset.jv.split(':'), L = LEVERS.find(x => x.id === id), val = L.values[+i], plan = { ...S.joule.plan, [id]: val };
      if (val === PLAN[id]) delete plan[id]; S.joule.plan = normalPlan(plan); pulled = id; mine = null; no = ''; o.save(); return draw(); }
    const go = q('[data-jgo]'); if (go) { at = go.dataset.jgo; return draw(); }
    if (q('[data-jreset]')) { S.joule.plan = {}; mine = null; no = ''; o.save(); return draw(); }
    if (q('[data-jmap]')) { mapOn = !mapOn; return draw(); }
    if (q('[data-jmore]')) { more = !more; return draw(); }
    if (q('[data-jkeep]')) { const r = o.keep(S.joule.plan, box); if (r.ok) { mine = r.e.id; no = ''; } else no = o.refusal(r.r); o.save(); return draw(); }
  });
  return {
    level(id) { if (LEVELS.includes(id) && id !== at) { at = id; draw(); } },
    on(v) { S.joule.on = !!v; o.save(); draw(); },
    /* where the folded lens ends on a phone (px from the top of the view), for the picture to keep below it; 0 otherwise */
    bottom() { return S.joule.on && !more && !box.hidden && matchMedia('(max-width: 720px)').matches ? box.offsetTop + box.offsetHeight : 0; },
    redraw: draw
  };
}
