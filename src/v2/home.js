/* The blueprint: the first page (#/). One wheel holds the whole chip innovation ecosystem: around it a chip's life (the
   loop: Open, Design, Make, Test, Ship, Use), inward its scale (the world at the rim, the atom at the centre). A story
   in six chapters scrolls beside it and changes what the wheel shows: the whole of it, the world it takes, where it is
   stuck, what comes next, people and AI, and your move. Every dot on the wheel is a place in the lab and opens it.
   Nothing 3D is drawn here. The first page is the one page translated so far (bp.* in src/i18n/<lang>/blueprint.json);
   its language picker sets the reader's language for the whole lab, where the rest falls back to English.
   Data: src/data/blueprint.js; geometry: src/engines/blueprint.js. The station map that was the first page before is
   src/v2/stations.js (#/stations). */
import { t, fmtNum, lang, LANGS } from '../core/i18n.js';
import { STAGES, RINGS, STATIONS, FLOWS, ACTORS, WALLS, NEXT, ROLES, TRIAD, CHAPTERS, OPEN_AT, DOORS, WAYS } from '../data/blueprint.js';
import * as B from '../engines/blueprint.js';
import { ledger, settled, frontier } from '../engines/ledger.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const w = (k, o) => t('bp.' + k, o);
const QWORD = q => (q === 'perfect' ? 'field.perfect.q' : 'home.q.' + q);
const byId = Object.fromEntries(STATIONS.map(s => [s.id, s]));
const STATUS = ['product', 'lab', 'guess'];

/* ctx: still() (reduced motion) */
export function createHome(host, ctx) {
  const S = { mode: 'whole', side: 'giant', step: 0, show: { product: true, lab: true, guess: true }, sel: null, stage: null };
  let facts = null, io = null, drawn = false;
  const reduced = () => (ctx && ctx.still ? ctx.still() : false);
  const pos = Object.fromEntries(STATIONS.map(s => [s.id, B.placeOf(s)]));

  /* ---- the wheel ---- */
  const lbl = (x, y, text, cls, anchor) => '<text class="' + cls + '" x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(text) + '</text>';
  function grid() {
    let h = '<g class="g-grid">';
    /* the stages: six sectors, with their names along the rim, upright all round */
    STAGES.forEach(st => {
      const a = B.angleOf(st), id = 'bp-arc-' + st;
      h += '<path class="bp-sec" data-stage="' + st + '" d="' + B.sector(st, 40, 450, 0.6) + '"/>';
      h += '<path id="' + id + '" d="' + B.arc(B.lower(a) ? 520 : 498, a - 26, a + 26, B.lower(a)) + '" fill="none"/>';
      h += '<text class="bp-stagename" data-stage="' + st + '"><textPath href="#' + id + '" startOffset="50%" text-anchor="middle">' + esc(t('loop.stage.' + st)) + '</textPath></text>';
    });
    RINGS.forEach((r, i) => { h += '<circle class="bp-ring' + (r.id === 'world' ? ' rim' : '') + '" r="' + r.r + '"/>'; });
    STAGES.forEach(st => { const [x, y] = B.pol(450, B.angleOf(st) - B.SPAN / 2); h += '<line class="bp-spoke" x1="0" y1="0" x2="' + x + '" y2="' + y + '"/>'; });
    /* the scale, written down the gap between Use and Open */
    RINGS.forEach(r => { const [x, y] = B.pol(r.r, -120); h += lbl(x - 8, y - 6, w('ring.' + r.id), 'bp-ringname', 'end'); });
    return h + '</g>';
  }
  function flows() {
    let h = '<g class="g-flows">';
    h += '<path id="bp-loop" class="bp-loop" d="' + B.arc(462, -90, 269.9) + '"/>';
    for (let i = 0; i < 6; i++) { const a = -90 + 60 * i + 30, [x, y] = B.pol(462, a); h += '<path class="bp-loopdir" d="M-7 -7L5 0L-7 7" transform="translate(' + x + ' ' + y + ') rotate(' + (a + 90) + ')"/>'; }
    for (const [k, ids] of Object.entries(FLOWS)) h += '<path class="bp-flow f-' + k + '" d="' + B.through(ids.map(id => pos[id])) + '"/>';
    if (!reduced()) h += '<circle class="bp-pulse" r="7"><animateMotion dur="14s" repeatCount="indefinite" rotate="auto"><mpath href="#bp-loop"/></animateMotion></circle>';
    return h + '</g>';
  }
  /* where a name goes beside its dot: outward, or across the line it sits on (clockwise or not) */
  function nameAt(p, side) {
    const a = p.deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
    const [dx, dy] = side === 'cw' ? [-sn, c] : side === 'ccw' ? [sn, -c] : [c, sn];
    const x = +(p.x + dx * 17).toFixed(1), y = +(p.y + dy * 17).toFixed(1);
    const anchor = dx > 0.35 ? 'start' : dx < -0.35 ? 'end' : 'middle';
    return { x, y: anchor === 'middle' ? (dy > 0 ? y + 14 : y - 4) : y + 7, anchor };
  }
  function stations() {
    return '<g class="g-stations">' + STATIONS.map((s, i) => {
      const p = pos[s.id], n = nameAt(p, s.side), name = w('st.' + s.id);
      return '<a class="bp-st" href="' + s.href + '" data-st="' + s.id + '" data-stage="' + s.stage + '" style="--i:' + i + '" aria-label="' + esc(name + ', ' + t('loop.stage.' + s.stage) + ', ' + w('ring.' + s.ring)) + '">' +
        '<circle class="bp-dot" cx="' + p.x + '" cy="' + p.y + '" r="9"/>' + lbl(n.x, n.y, name, 'bp-stname', n.anchor) + '</a>';
    }).join('') + '</g>';
  }
  function world() {
    const at = {};
    return '<g class="g-world">' + ACTORS.map(a => {
      const n = at[a.stage + a.side] = (at[a.stage + a.side] || 0) + 1, many = ACTORS.filter(x => x.stage === a.stage && x.side === a.side).length;
      const deg = B.angleOf(a.stage) + (many > 1 ? (n === 1 ? -12 : 12) : 0), [x, y] = B.pol(410, deg);
      return '<g class="bp-actor" data-actor="' + a.id + '" data-side="' + a.side + '" tabindex="0" role="button" aria-label="' + esc(w('actor.' + a.id + '.t')) + '">' +
        '<circle cx="' + x + '" cy="' + y + '" r="16"/>' + lbl(x, y + 42 * (y > 0 ? 1 : -1) + (y > 0 ? 0 : 12), w('actor.' + a.id + '.t'), 'bp-actname', 'middle') + '</g>';
    }).join('') + '</g>';
  }
  function walls() {
    return '<g class="g-walls">' + WALLS.map(wl => {
      const mid = (wl.from + wl.to) / 2, [x, y] = B.pol(wl.r, wl.id === 'switch' ? 30 : mid);
      return '<g class="bp-wall" data-wall="' + wl.id + '" tabindex="0" role="button" aria-label="' + esc(w('wall.' + wl.id + '.t')) + '">' +
        (wl.to - wl.from >= 359 ? '<circle class="bp-wallarc" r="' + wl.r + '"/><circle class="bp-wallhit" r="' + wl.r + '"/>' : '<path class="bp-wallarc" d="' + B.arc(wl.r, wl.from, wl.to) + '"/><path class="bp-wallhit" d="' + B.arc(wl.r, wl.from, wl.to) + '"/>') +
        '<g class="bp-wallmark" transform="translate(' + x + ' ' + y + ')"><rect x="-15" y="-15" width="30" height="30" rx="8"/><path d="M-6 -6L6 6M6 -6L-6 6"/></g>' +
        lbl(x + (x >= 0 ? 24 : -24), y + 7, w('wall.' + wl.id + '.t'), 'bp-wallname', x >= 0 ? 'start' : 'end') + '</g>';
    }).join('') + '</g>';
  }
  function next() {
    const wall = Object.fromEntries(WALLS.map(x => [x.id, x]));
    return '<g class="g-next">' + NEXT.map(n => {
      const p = B.placeOf(n), q = B.onWall(wall[n.attacks], p);
      return '<g class="bp-next s-' + n.status + '" data-next="' + n.id + '" data-status="' + n.status + '" tabindex="0" role="button" aria-label="' + esc(w('next.' + n.id + '.t')) + '">' +
        '<line class="bp-attack" x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '"/>' +
        '<rect class="bp-nextdot" x="' + (p.x - 13) + '" y="' + (p.y - 13) + '" width="26" height="26" rx="4" transform="rotate(45 ' + p.x + ' ' + p.y + ')"/>' +
        (r => lbl(p.x + (r ? 22 : -22), p.y + 7, w('next.' + n.id + '.t'), 'bp-nextname', r ? 'start' : 'end'))(n.side ? n.side === 'r' : p.x >= 0) + '</g>';
    }).join('') + '</g>';
  }
  function people() {
    let h = '<g class="g-people">';
    ROLES.forEach(r => { h += '<path class="bp-ai" data-role="' + r.stage + '"/><path class="bp-pp" data-role="' + r.stage + '"/>'; });
    /* the heart: AI generates, engines check, people decide */
    const T = TRIAD.map((k, i) => ({ k, p: B.pol(118, -90 + 120 * i) }));
    h += '<circle class="bp-heart" r="190"/>';
    T.forEach(({ k, p }, i) => { const q = T[(i + 1) % 3].p; h += '<path class="bp-triadarc" d="M' + p[0] + ' ' + p[1] + 'Q0 0 ' + q[0] + ' ' + q[1] + '"/>'; });
    T.forEach(({ k, p }) => { h += '<g class="bp-triad t-' + k + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="44"/>' + lbl(p[0], p[1] - 2, w('triad.' + k), 'bp-triadname', 'middle') + lbl(p[0], p[1] + 70, w('triad.' + k + '.who'), 'bp-triadwho', 'middle') + '</g>'; });
    return h + '</g>';
  }
  function you() {
    let h = '<g class="g-you">';
    const F = openWork();
    Object.entries(F.at).forEach(([kind, n]) => { const o = OPEN_AT[kind]; if (!o) return; const p = B.placeOf(o);
      h += '<a class="bp-beacon" href="' + o.href + '" data-open="' + kind + '" aria-label="' + esc(w('open.' + kind)) + '"><circle class="bp-bring" cx="' + p.x + '" cy="' + p.y + '" r="30"/><circle class="bp-bdot" cx="' + p.x + '" cy="' + p.y + '" r="12"/>' +
        lbl(p.x, p.y - 40, w('open.' + kind) + ' · ' + fmtNum(n), 'bp-beaconname', 'middle') + '</a>'; });
    return h + '</g>';
  }
  function wheel() {
    return '<svg class="bp-wheel" viewBox="-548 -548 1096 1096" role="img" aria-labelledby="bp-wtitle"><title id="bp-wtitle">' + esc(w('wheel.aria')) + '</title>' +
      grid() + flows() + people() + walls() + next() + world() + stations() + you() + '</svg>';
  }

  /* ---- the open work, from the community's ledger: what is open of each kind, and who has added what ---- */
  function openWork() {
    let at = {}, entries = [], people = 0;
    try { const W = settled(); frontier(W).forEach(f => { at[f.kind] = (at[f.kind] || 0) + 1; }); entries = ledger(); people = entries.filter(e => e.made === 'person').length; } catch (e) { /* no ledger: nothing open is shown */ }
    return { at, n: entries.length, people };
  }

  /* ---- the story ---- */
  function hero() {
    return '<header class="bp-hero" data-ch="whole"><p class="bp-kicker">' + esc(w('hero.k')) + '</p><h1>' + w('hero.h') + '</h1><p class="bp-lead">' + esc(w('hero.p')) + '</p>' +
      '<div class="bp-ctas"><a class="bp-cta primary" href="#/" data-scroll>' + esc(w('hero.read')) + ' ↓</a><a class="bp-cta" href="#/island">' + esc(w('hero.enter')) + '</a></div></header>';
  }
  const chip = (attrs, text, on) => '<button type="button" class="bp-chip" ' + attrs + ' aria-pressed="' + !!on + '">' + text + '</button>';
  function chapter(id, i) {
    let body = '';
    if (id === 'whole') body = '<div class="bp-chips" role="group" aria-label="' + esc(w('stages.aria')) + '">' + STAGES.map(st => chip('data-stagepick="' + st + '"', esc(t('loop.stage.' + st)), S.stage === st)).join('') + '</div><p class="bp-hint">' + esc(w('ch.whole.hint')) + '</p>';
    if (id === 'world') body = '<div class="bp-chips bp-toggle" role="group">' + chip('data-side="giant"', esc(w('side.giant')), S.side === 'giant') + chip('data-side="open"', esc(w('side.open')), S.side === 'open') + '</div><p class="bp-hint">' + esc(w('ch.world.hint')) + '</p>';
    if (id === 'walls') body = '<ul class="bp-list">' + WALLS.map(x => '<li><button type="button" data-wallpick="' + x.id + '"><span class="bp-sw wall"></span>' + esc(w('wall.' + x.id + '.t')) + '</button></li>').join('') + '</ul>';
    if (id === 'next') body = '<div class="bp-chips" role="group" aria-label="' + esc(w('status.aria')) + '">' + STATUS.map(s => chip('data-status="' + s + '"', '<span class="bp-sw s-' + s + '"></span>' + esc(w('status.' + s)), S.show[s])).join('') + '</div><ul class="bp-list">' + NEXT.map(n => '<li><button type="button" data-nextpick="' + n.id + '"><span class="bp-sw s-' + n.status + '"></span>' + esc(w('next.' + n.id + '.t')) + '</button></li>').join('') + '</ul>';
    if (id === 'people') body = '<label class="bp-slider"><span>' + esc(w('ai.label')) + '</span><input type="range" min="0" max="2" step="1" value="' + S.step + '" data-step aria-valuetext="' + esc(w('ai.step' + S.step)) + '"><span class="bp-ends"><span>' + esc(w('ai.step0')) + '</span><span>' + esc(w('ai.step2')) + '</span></span></label>' +
      '<table class="bp-roles"><thead><tr><th></th><th>' + esc(w('ai.col')) + '</th><th>' + esc(w('people.col')) + '</th></tr></thead><tbody>' + ROLES.map(r => '<tr data-rolerow="' + r.stage + '"><th>' + esc(t('loop.stage.' + r.stage)) + '</th><td>' + esc(w('role.' + r.stage + '.ai')) + '</td><td>' + esc(w('role.' + r.stage + '.people')) + '</td></tr>').join('') + '</tbody></table>' +
      '<p class="bp-hint" data-stepnote>' + esc(w('ai.note' + S.step)) + '</p>';
    if (id === 'you') { const F = openWork(); body = '<div class="bp-record"><b>' + fmtNum(F.n) + '</b><span>' + esc(w('you.entries')) + '</span><b class="' + (F.people ? '' : 'zero') + '">' + fmtNum(F.people) + '</b><span>' + esc(w('you.people')) + '</span></div>'; }
    return '<section class="bp-ch" data-ch="' + id + '" aria-labelledby="bp-h-' + id + '"><p class="bp-kicker"><span class="bp-num">' + fmtNum(i + 1) + '</span>' + esc(w('ch.' + id + '.k')) + '</p><h2 id="bp-h-' + id + '">' + esc(w('ch.' + id + '.h')) + '</h2><p>' + esc(w('ch.' + id + '.p')) + '</p>' + body + '</section>';
  }
  function doors() {
    return '<section class="bp-doors" aria-labelledby="bp-doors-h"><h2 id="bp-doors-h">' + esc(w('doors.h')) + '</h2><div class="bp-doorgrid">' + DOORS.map(d =>
      '<a class="bp-door" href="' + d.href + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d.icon + '"/></svg><b>' + esc(w('door.' + d.id + '.t')) + '</b><span>' + esc(w('door.' + d.id + '.d')) + '</span></a>').join('') +
      '</div><nav class="bp-ways" aria-label="' + esc(w('ways.aria')) + '">' + WAYS.map(([h, k]) => '<a href="' + h + '">' + esc(w('ways.' + k)) + ' →</a>').join('') + '</nav></section>';
  }
  function draw() {
    host.innerHTML = '<div class="bp" data-mode="' + S.mode + '" data-side="' + S.side + '"><div class="bp-grid"><div class="bp-story">' + hero() + CHAPTERS.map(chapter).join('') + '</div>' +
      '<div class="bp-stage"><div class="bp-sticky">' + wheel() + '<div class="bp-legend" aria-hidden="true">' + legend() + '</div><aside class="bp-card" data-card hidden aria-live="polite"></aside></div></div></div>' + doors() + '</div>';
    drawn = true; paint(); watch();
  }
  function legend() {
    return '<span><i class="lg-flow f-design"></i>' + esc(w('legend.design')) + '</span><span><i class="lg-flow f-make"></i>' + esc(w('legend.make')) + '</span><span><i class="lg-flow f-dive"></i>' + esc(w('legend.dive')) + '</span><span><i class="lg-loop"></i>' + esc(w('legend.loop')) + '</span>';
  }

  /* ---- what the wheel shows now ---- */
  function paint() {
    const root = host.querySelector('.bp'); if (!root) return;
    root.dataset.mode = S.mode; root.dataset.side = S.side;
    host.querySelectorAll('.bp-sec').forEach(el => el.classList.toggle('on', el.dataset.stage === S.stage));
    host.querySelectorAll('.bp-st').forEach(el => el.classList.toggle('off', !!S.stage && el.dataset.stage !== S.stage));
    host.querySelectorAll('.bp-next').forEach(el => el.classList.toggle('off', !S.show[el.dataset.status]));
    /* the people and AI band, from the slider: AI's share inside, people's outside, per stage */
    ROLES.forEach(r => {
      const { ai } = B.shares(r, S.step), a = B.angleOf(r.stage), a0 = a - B.SPAN / 2 + 1.5, a1 = a + B.SPAN / 2 - 1.5, cut = a0 + (a1 - a0) * ai;
      const A = host.querySelector('.bp-ai[data-role="' + r.stage + '"]'), P = host.querySelector('.bp-pp[data-role="' + r.stage + '"]');
      if (A) A.setAttribute('d', B.band(446, 478, a0, cut)); if (P) P.setAttribute('d', B.band(446, 478, cut, a1));
    });
    host.querySelectorAll('[data-rolerow]').forEach(tr => { const r = ROLES.find(x => x.stage === tr.dataset.rolerow), s = B.shares(r, S.step); tr.style.setProperty('--ai', (s.ai * 100).toFixed(0) + '%'); });
    const note = host.querySelector('[data-stepnote]'); if (note) note.textContent = w('ai.note' + S.step);
    host.querySelectorAll('[data-stagepick]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.stagepick === S.stage)));
    host.querySelectorAll('[data-side]').forEach(b => { if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.dataset.side === S.side)); });
    host.querySelectorAll('button[data-status]').forEach(b => b.setAttribute('aria-pressed', String(S.show[b.dataset.status])));
  }

  /* ---- the card: what one thing on the wheel is, its source and where it leads ---- */
  function factOf(id) {
    if (!id) return Promise.resolve(null);
    const get = facts ? Promise.resolve(facts) : fetch('src/data/facts.json').then(r => r.json()).then(j => (facts = j.facts)).catch(() => (facts = []));
    return get.then(L => L.find(f => f.id === id) || null);
  }
  function card(kind, id) {
    const el = host.querySelector('[data-card]'); if (!el) return;
    S.sel = kind + ':' + id;
    let title = '', meta = '', body = '', href = null, fact = null, extra = '';
    if (kind === 'stage') { title = t('loop.stage.' + id); body = w('stage.' + id + '.d'); extra = '<div class="bp-cardlinks">' + STATIONS.filter(s => s.stage === id).map(s => '<a href="' + s.href + '">' + esc(w('st.' + s.id)) + '</a>').join('') + '</div>'; }
    if (kind === 'actor') { const a = ACTORS.find(x => x.id === id); title = w('actor.' + id + '.t'); meta = t('loop.stage.' + a.stage) + ' · ' + w('side.' + a.side); body = w('actor.' + id + '.d'); fact = a.fact; }
    if (kind === 'wall') { const x = WALLS.find(v => v.id === id); title = w('wall.' + id + '.t'); body = w('wall.' + id + '.d'); fact = x.fact; href = x.href; extra = '<p class="bp-q"><span>' + esc(w('card.question')) + '</span>' + esc(t(QWORD(x.q))) + '</p>'; }
    if (kind === 'next') { const n = NEXT.find(v => v.id === id); title = w('next.' + id + '.t'); meta = '<span class="bp-mark s-' + n.status + '">' + esc(w('status.' + n.status)) + '</span> · ' + esc(w('card.attacks', { wall: w('wall.' + n.attacks + '.t') })); body = w('next.' + id + '.d'); fact = n.fact; href = n.href; }
    el.innerHTML = '<button type="button" class="bp-close" data-close aria-label="' + esc(w('card.close')) + '">×</button><p class="bp-cardmeta">' + (kind === 'next' ? meta : esc(meta)) + '</p><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' + extra +
      '<p class="bp-src" data-src></p>' + (href ? '<a class="bp-go" href="' + href + '">' + esc(w('card.go')) + ' →</a>' : '');
    el.hidden = false;
    factOf(fact).then(f => { const s = el.querySelector('[data-src]'); if (s && f && S.sel === kind + ':' + id) s.innerHTML = esc(w('card.source')) + ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.source) + '</a> · ' + esc(f.verified); });
  }
  const closeCard = () => { const el = host.querySelector('[data-card]'); if (el) el.hidden = true; S.sel = null; };

  /* ---- moving through the story: the chapter in the middle of the screen sets the wheel's mode ---- */
  function watch() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { const m = e.target.dataset.ch; if (m !== S.mode) { S.mode = m; if (m !== 'whole') S.stage = null; closeCard(); paint(); } } }); }, { root: host, rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    host.querySelectorAll('[data-ch]').forEach(el => io.observe(el));
  }

  /* ---- what a reader does ---- */
  host.addEventListener('click', e => {
    if (e.target.closest('[data-scroll]')) { e.preventDefault(); const c = host.querySelector('.bp-ch'); if (c) c.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); return; }
    if (e.target.closest('[data-close]')) return closeCard();
    const sp = e.target.closest('[data-stagepick]'); if (sp) { S.stage = S.stage === sp.dataset.stagepick ? null : sp.dataset.stagepick; paint(); return S.stage ? card('stage', S.stage) : closeCard(); }
    const sd = e.target.closest('button[data-side]'); if (sd) { S.side = sd.dataset.side; paint(); return; }
    const ss = e.target.closest('button[data-status]'); if (ss) { S.show[ss.dataset.status] = !S.show[ss.dataset.status]; paint(); return; }
    const a = e.target.closest('[data-actor]'); if (a) return card('actor', a.dataset.actor);
    const wl = e.target.closest('[data-wall]') || e.target.closest('[data-wallpick]'); if (wl) return card('wall', wl.dataset.wall || wl.dataset.wallpick);
    const n = e.target.closest('[data-next]') || e.target.closest('[data-nextpick]'); if (n) return card('next', n.dataset.next || n.dataset.nextpick);
    const sec = e.target.closest('.bp-sec'); if (sec && S.mode === 'whole') { S.stage = S.stage === sec.dataset.stage ? null : sec.dataset.stage; paint(); return S.stage ? card('stage', S.stage) : closeCard(); }
  });
  host.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } if (e.key === 'Escape') closeCard(); });
  host.addEventListener('input', e => { if (e.target.matches('[data-step]')) { S.step = +e.target.value; e.target.setAttribute('aria-valuetext', w('ai.step' + S.step)); paint(); } });

  return {
    show() { if (!drawn) draw(); host.hidden = false; host.classList.toggle('still', reduced()); },
    hide() { host.hidden = true; closeCard(); }
  };
}
