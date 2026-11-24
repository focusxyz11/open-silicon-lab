/* Listen (#316, on for everyone since #317): a level slowed until it can be heard, on the frame. A switch beside the picture's
   other lens (Follow the joule), at the levels whose engines can feed it (LEVELS in src/engines/listen.js: the block
   first); off by default, never starting by itself (the sound begins on a tap), quiet, and remembered for the visitor.
   Open, it says how much the level is slowed and how loudness is mapped, lets you pick what the block is doing, writes
   what is heard in a quiet live caption, and lights each part on the picture in time with its sound: a layer in the
   level's plan (src/data/partfacts.js), pinned onto the picture as a lens's paint is (src/v2/lenspaint.js). The ear test
   (src/v2/labs/listen.js) draws the same picture, on its own base.
   - paint(F, base): the picture's SVG, in the plan (1000 by 1000); light(svg, e, V): one event lit on it.
   - createListen(host, o): the switch and its box on a view's frame. o: { where() (as a lens's paint), joule (the other
     lens, closed while this one is open), changed() (the picture keeps clear of the box) }. Returns { level(id),
     width(), bottom() }. */
import { t, fmtNum } from '../core/i18n.js';
import * as L from '../engines/listen.js';
import { factsOf } from '../data/partfacts.js';
import { squareTo } from './lenspaint.js';
import * as Sound from './sound.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---- the picture: the block's parts in its plan, each with what lights in time ---- */
const R = r => 'x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '"';
const path = p => 'M' + p.map(q => q[0].toFixed(0) + ' ' + q[1].toFixed(0)).join('L');
const rowsOf = F => F.parts.filter(p => p.kind === 'logic' && p.by === 'program').flatMap(p => p.rects);
const memOf = F => F.parts.find(p => p.kind === 'memory').rects[0];
const wiresOf = F => F.parts.filter(p => p.kind === 'wire').flatMap(p => p.paths);
const midOf = p => { const a = p[Math.floor((p.length - 1) / 2)], b = p[Math.floor((p.length - 1) / 2) + 1] || a; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
/* a fixed spread of 0..1, the same every time (the widths of the cells in a row) */
const spread = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/* the block as the ear test draws it, under the lit layer: rows of cells of different widths, the memory array, the
   other circuits, the copper wires over them */
function baseSvg(F) {
  const rows = rowsOf(F), mem = memOf(F), other = (F.parts.find(p => p.key === 'other') || { rects: [] }).rects[0];
  let h = '<rect x="0" y="0" width="1000" height="1000" rx="18" class="lsn-die"/>';
  rows.forEach((r, j) => { let x = r[0], k = 0; while (x < r[0] + r[2] - 8) { const w = Math.min(r[0] + r[2] - x, 22 + spread(j * 40 + k) * 46); h += '<rect x="' + (x + 2).toFixed(0) + '" y="' + (r[1] + 4) + '" width="' + Math.max(4, w - 4).toFixed(0) + '" height="' + (r[3] - 8) + '" rx="3" class="lsn-cell"/>'; x += w; k++; } });
  h += '<rect ' + R(mem) + ' rx="8" class="lsn-arr"/>';
  const cols = 14, rws = 26, cw = (mem[2] - 20) / cols, ch = (mem[3] - 20) / rws;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rws; j++) h += '<rect x="' + (mem[0] + 10 + i * cw + 2).toFixed(1) + '" y="' + (mem[1] + 10 + j * ch + 2).toFixed(1) + '" width="' + (cw - 4).toFixed(1) + '" height="' + (ch - 4).toFixed(1) + '" rx="2" class="lsn-bit"/>';
  if (other) [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([i, j]) => { h += '<rect x="' + (other[0] + i * other[2] / 2 + 6) + '" y="' + (other[1] + j * other[3] / 2 + 6) + '" width="' + (other[2] / 2 - 12) + '" height="' + (other[3] / 2 - 12) + '" rx="6" class="lsn-arr"/>'; });
  return h + '<g class="lsn-cu">' + wiresOf(F).map(p => '<path d="' + path(p) + '"/>').join('') + '</g>';
}
/* the lit layer: the clock's rails over each row, the places a sum lights, the way from the memory to each row and
   the memory itself (a fetch), the heat over the logic, each wire and a ring on it (a wrong bit) */
export function paint(F, base) {
  const rows = rowsOf(F), mem = memOf(F), wires = wiresOf(F), S = L.ROW_SLOTS;
  let h = base ? baseSvg(F) : '';
  h += '<g class="lsn-heat">' + rows.map(r => '<rect ' + R(r) + ' rx="6"/>').join('') + '</g>';
  h += '<g class="lsn-rails">' + rows.map(r => '<rect x="' + r[0] + '" y="' + (r[1] - 5) + '" width="' + r[2] + '" height="4" rx="2"/>').join('') + '</g>';
  h += '<g class="lsn-sums">' + rows.map((r, j) => Array.from({ length: S }, (_, i) => { const w = r[2] / S; return '<rect data-s="' + (j * S + i) + '" x="' + (r[0] + i * w + w * 0.2).toFixed(0) + '" y="' + (r[1] + 7) + '" width="' + (w * 0.6).toFixed(0) + '" height="' + (r[3] - 14) + '" rx="5"/>'; }).join('')).join('') + '</g>';
  h += '<g class="lsn-ways">' + rows.map((r, j) => { const y = r[1] + r[3] / 2, ym = Math.max(mem[1] + 14, Math.min(mem[1] + mem[3] - 14, y)); return '<path data-f="' + j + '" d="M' + mem[0] + ' ' + ym.toFixed(0) + 'H' + (mem[0] - 18) + 'V' + y.toFixed(0) + 'H' + (r[0] + r[2] * 0.35).toFixed(0) + '"/>'; }).join('') + '</g>';
  h += '<rect ' + R(mem) + ' rx="8" class="lsn-mem"/>';
  h += '<g class="lsn-wires">' + wires.map((p, i) => '<path data-w="' + i + '" d="' + path(p) + '"/>').join('') + '</g>';
  h += '<g class="lsn-rings">' + wires.map((p, i) => { const [x, y] = midOf(p); return '<circle data-w="' + i + '" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="30"/>'; }).join('') + '</g>';
  return h;
}
/* the heat over the logic, from the block's temperature (25 to 115 °C) */
export const heatOf = V => Math.max(0, Math.min(1, (V.hum.celsius - L.ROOM_C) / 90));
/* one event lit on a picture (an SVG drawn by paint()), for as long as it lasts in the sound */
export function light(svg, e, V) {
  if (!svg || !svg.isConnected) return;
  /* how many events it has lit, for a test that cannot hear */
  svg.dataset.lit = (+svg.dataset.lit || 0) + 1;
  const on = (el, ms) => { if (!el) return; el.classList.add('on'); clearTimeout(el._lsn); el._lsn = setTimeout(() => el.classList.remove('on'), ms); };
  if (e.v === 'tick') on(svg.querySelector('.lsn-rails'), 110);
  else if (e.v === 'sum') on(svg.querySelector('[data-s="' + e.i + '"]'), 180);
  else if (e.v === 'fetch') { const ms = Math.min(e.dur, V.fetch.cycle * 0.9) * 1000; on(svg.querySelector('.lsn-ways [data-f="' + e.i + '"]'), ms); on(svg.querySelector('.lsn-mem'), ms);
    if (e.stop > 0) { svg.classList.add('lsn-waiting'); clearTimeout(svg._lsnw); svg._lsnw = setTimeout(() => svg.classList.remove('lsn-waiting'), e.stop * 1000); } }
  else if (e.v === 'wrong') { on(svg.querySelector('.lsn-wires [data-w="' + e.i + '"]'), 420); on(svg.querySelector('.lsn-rings [data-w="' + e.i + '"]'), 420); }
}
/* an SVG of the picture, in the plan, set for a state's heat */
export const svgOf = (level, state, base, attrs = '') => { const V = L.voices(state, level); return '<svg class="lsn" viewBox="0 0 1000 1000" style="--lsn-heat:' + heatOf(V).toFixed(2) + '" ' + attrs + '>' + paint(factsOf(level), base) + '</svg>'; };

/* ---- what is heard, written: one line at a time, never faster than a reader can follow (1.3 s), and what matters
   most held longest: a wrong bit over a wait, a wait over a fetch, a fetch over the work going on (2.6 s) ---- */
const RANK = { work: 0, fetch: 1, wait: 2, wrong: 3 };
export function captioner(el) {
  let cur = null, since = 0, pend = null, tm = 0;
  const age = () => Date.now() - since;
  const ok = id => !cur || (age() >= 1300 && (RANK[id] >= RANK[cur] || age() >= 2600));
  const show = id => { cur = id; since = Date.now(); el.textContent = t('hear.ev.' + id); el.dataset.ev = id; };
  const later = () => { tm = 0; const p = pend; if (!p || !el.isConnected) return; if (ok(p)) { pend = null; show(p); } else tm = setTimeout(later, 300); };
  return e => {
    const id = L.caption(e); if (!id || !el.isConnected) return;
    if (id === cur) { if (RANK[id] > 0) since = Date.now(); return; }
    if (ok(id)) { pend = null; show(id); return; }
    if (!pend || RANK[id] >= RANK[pend]) pend = id;
    if (!tm) tm = setTimeout(later, 300);
  };
}

/* ---- the switch on the frame ---- */
const KEY = 'osl-listen';
const kept = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return { open: !!o.open, state: L.STATES.includes(o.state) ? o.state : 'busy', buzz: !!o.buzz }; } catch (e) { return { open: false, state: 'busy', buzz: false }; } };
const keep = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* no storage: forgotten after the visit */ } };
export function createListen(host, o) {
  const P = kept(); let level = null, playing = false, layer = null, raf = 0, M = null;
  Sound.setBuzz(P.buzz);
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'lsnbtn'; btn.hidden = true; btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = '<span class="lsnwave" aria-hidden="true"><i></i><i></i><i></i></span><span>' + esc(t('hear.toggle')) + '</span>';
  const box = document.createElement('aside'); box.className = 'lsnbox'; box.hidden = true; box.setAttribute('aria-label', t('hear.k'));
  host.appendChild(btn); host.appendChild(box);
  /* where it stands: beside the other lens's switch */
  const place = () => { const j = host.querySelector(':scope > .joulebtn'); btn.style.left = j && j.offsetParent ? (j.offsetLeft + j.offsetWidth + 8) + 'px' : ''; };
  const draw = () => {
    const V = L.voices(P.state, level);
    box.innerHTML = '<div class="lsnhead"><p class="kicker">' + esc(t('hear.k')) + '</p><button type="button" class="lsnx" data-lsnx aria-label="' + esc(t('hear.close')) + '">×</button></div>' +
      '<p class="lsnscale">' + esc(t('hear.scale.' + level)) + '</p><p class="lsnshort">' + esc(t('hear.short.' + level)) + '</p>' +
      '<div class="lsnstates" role="group" aria-label="' + esc(t('hear.states')) + '">' + L.STATES.map(s => '<button type="button" class="chipb" data-lsnstate="' + s + '" aria-pressed="' + (s === P.state) + '">' + esc(t('hear.state.' + s)) + '</button>').join('') + '</div>' +
      /* on a phone, what the block is doing is one menu beside the button */
      '<div class="lsnrow"><select class="lsnsel" data-lsnsel aria-label="' + esc(t('hear.states')) + '">' + L.STATES.map(s => '<option value="' + s + '"' + (s === P.state ? ' selected' : '') + '>' + esc(t('hear.state.' + s)) + '</option>').join('') + '</select>' +
      '<button type="button" class="btn ' + (playing ? '' : 'primary ') + 'lsnplay" data-lsnplay>' + esc(t(playing ? 'hear.stop' : 'hear.play')) + '</button></div>' +
      '<p class="lsncap" aria-live="polite">' + esc(playing ? '' : t('hear.idle')) + '</p>' +
      '<p class="small muted lsnloud">' + esc(t('hear.loud', { n: fmtNum(Math.round(V.fetch.times)) })) + '</p>' +
      (Sound.canBuzz() && matchMedia('(pointer: coarse)').matches ? '<label class="small lsnbuzz"><input type="checkbox" data-lsnbuzz' + (P.buzz ? ' checked' : '') + '> ' + esc(t('hear.buzz')) + '</label>' : '') +
      '<a class="link lsntest" href="#/do/ear">' + esc(t('hear.test')) + '</a>';
    cap = captioner(box.querySelector('.lsncap'));
  };
  let cap = () => {};
  const open = v => { P.open = v; keep(P); box.hidden = !v; btn.classList.toggle('on', v); btn.setAttribute('aria-pressed', String(v)); if (!v) stop(); else { if (o.joule) o.joule(); draw(); } layerOn(v); o.changed && o.changed(); };
  /* the lit layer on the picture, pinned by the plan's corners wherever the picture is */
  const layerOn = v => {
    if (!v) { cancelAnimationFrame(raf); raf = 0; if (layer) { layer.remove(); layer = null; } return; }
    if (!raf) follow();
  };
  function follow() {
    /* a frame made anew leaves this switch behind: its layer goes with it */
    if (!btn.isConnected) { raf = 0; if (layer) { layer.remove(); layer = null; } return; }
    raf = requestAnimationFrame(follow);
    const W = o.where && o.where();
    if (!W || !W.corners || !level || !box.offsetParent) { if (layer) layer.hidden = true; return; }
    if (!layer || layer.parentNode !== W.host) { if (layer) layer.remove(); layer = document.createElement('div'); layer.className = 'lsnlayer'; layer.innerHTML = svgOf(level, P.state, false, 'aria-hidden="true"'); W.host.insertBefore(layer, W.before || null); }
    const r = W.host.getBoundingClientRect(); M = squareTo(W.corners.map(([x, y]) => [x - r.left, y - r.top]));
    layer.hidden = false; layer.style.transform = 'matrix3d(' + M.map(v => +v.toFixed(6)).join(',') + ')';
  }
  const svg = () => layer && layer.querySelector('svg');
  const play = () => {
    const S = L.score(P.state, 30, 1, level);
    playing = true; Sound.start(S, { tag: 'look', onEvent: e => { light(svg(), e, Sound.voices()); cap(e); }, onStop: () => { playing = false; if (box.isConnected && !box.hidden) draw(); } });
    draw(); watch();
  };
  const stop = () => { if (playing) Sound.stop(); playing = false; };
  /* the sound stops when the view leaves the block, or the frame is made anew */
  const watch = () => { const k = setInterval(() => { if (!playing) return clearInterval(k); if (!btn.isConnected || host.hidden || btn.hidden || !box.offsetParent) { clearInterval(k); stop(); layerOn(false); } }, 250); };
  btn.addEventListener('click', () => { const v = !P.open; open(v); if (v) play(); });
  box.addEventListener('click', e => {
    const q = s => e.target.closest(s);
    if (q('[data-lsnx]')) return open(false);
    if (q('[data-lsnplay]')) { if (playing) { stop(); draw(); } else play(); return; }
    const st = q('[data-lsnstate]'); if (st) return pick(st.dataset.lsnstate);
  });
  box.addEventListener('change', e => { const b = e.target.closest('[data-lsnbuzz]'); if (b) { P.buzz = b.checked; keep(P); Sound.setBuzz(P.buzz); }
    const m = e.target.closest('[data-lsnsel]'); if (m && L.STATES.includes(m.value)) pick(m.value); });
  /* what the block is doing, picked: the picture's heat and the sound follow at once */
  function pick(state) { P.state = state; keep(P); if (layer) { layer.remove(); layer = null; } if (playing) { const S = L.score(P.state, 30, 1, level); Sound.swap(S); } draw(); }
  /* the other lens opened: this one steps aside */
  host.addEventListener('click', e => { if (btn.isConnected && P.open && e.target.closest('.joulebtn')) open(false); });
  return {
    level(id) {
      const ok = L.LEVELS.includes(id); if (ok === !!level && id === level) return;
      if (!ok) { level = null; btn.hidden = true; box.hidden = true; stop(); layerOn(false); o.changed && o.changed(); return; }
      level = id; btn.hidden = false; requestAnimationFrame(place);
      /* remembered open: the box shows, and waits for a tap to sound */
      if (P.open) { box.hidden = false; btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true'); draw(); layerOn(true); } o.changed && o.changed();
    },
    /* how much of the picture's right the box takes on a desktop, and where it ends on a phone */
    width: () => (!box.hidden && level && innerWidth >= 1100 ? 336 : 0),
    bottom: () => (!box.hidden && level && innerWidth <= 720 ? box.offsetTop + box.offsetHeight : 0)
  };
}
