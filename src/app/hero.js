/* The home hero: zoom from an AI rack down to silicon atoms, and at every level look at it four
   ways: Explore (what it is), Build (something to make here), Break (what goes wrong here) and
   Imagine (where it could go). At the compute die, the die doubles as the map of the lab: each
   block is one band of the chip stack. The zoom itself is src/labs/zoom-rack-to-atom.js; this
   module listens to it ('osl:zoomlevel') and steers it ('osl:zoomto', 'osl:gate'). */
import { t } from '../core/i18n.js';
import { fmtLen } from '../core/ui.js';
import { TOPICS, topicById, bandById } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { HERO, DIE, LENS_IDS } from '../data/hero.js';
import { ZOOM_SIZES } from '../labs/zoom-rack-to-atom.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DIE_LEVEL = 3, GATE_LEVEL = 7;
const st = { level: 0, lens: 'explore', map: true, sel: null, gate: true };

/* The hero's markup; zoomHTML is the zoom viewer (content/zoom.html). */
export function heroHTML(zoomHTML, eyebrow) {
  const tabs = LENS_IDS.map(k => '<button type="button" role="tab" class="hlens l-' + k + '" data-lens="' + k + '" aria-selected="' + (k === st.lens) + '"><i aria-hidden="true"></i>' + t('hero.lens.' + k) + '</button>').join('');
  const die = DIE.map(d => {
    const b = bandById(d.band), n = TOPICS.filter(x => x.band === d.band).length;
    const z = d.zoom != null ? '<em>↘ ' + esc(fmtLen(ZOOM_SIZES[d.zoom])) + '</em>' : '';
    return '<button type="button" class="hdblk x-' + d.tex + '" data-band="' + d.band + '" style="left:' + d.x + '%;top:' + d.y + '%;width:' + d.w + '%;height:' + d.h + '%;--c:' + d.c + ';--t:' + d.t + '" aria-label="' + esc(b.t + ', ' + t('hero.map.count', { n })) + '"><span><b>' + esc(b.t) + '</b><small>' + n + '</small>' + z + '</span></button>';
  }).join('');
  return `
  <section class="wrap hero" aria-labelledby="heroT">
    <div class="hhead">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1 id="heroT">${t('hero.h1')}</h1>
      <p class="hlede">${t('hero.lede')}</p>
    </div>
    <div class="hstage">
      <div class="hview">
        ${zoomHTML}
        <div class="hdie" id="hDie" hidden>${die}</div>
      </div>
      <div class="hctl">
        <div class="seg hctlseg" id="hMapSeg" role="group" aria-label="${t('hero.map.label')}" hidden><button type="button" data-map="1" aria-pressed="true">${t('hero.map.on')}</button><button type="button" data-map="0" aria-pressed="false">${t('hero.map.off')}</button></div>
        <div class="seg hctlseg" id="hGateSeg" role="group" aria-label="${t('hero.gate.label')}" hidden><span class="eyebrow">${t('hero.gate.label')}</span><button type="button" data-gate="1" aria-pressed="true">${t('hero.gate.on')}</button><button type="button" data-gate="0" aria-pressed="false">${t('hero.gate.off')}</button></div>
        <p class="hgatenote small" id="hGateNote" hidden>${t('hero.gate.note')}</p>
      </div>
    </div>
    <div class="hpanel">
      <p class="hhook" id="hHook"></p>
      <div class="hlenses" role="tablist" aria-label="${t('hero.lensLabel')}">${tabs}</div>
      <div class="hcard" id="hCard" role="tabpanel" aria-live="polite"></div>
      <div class="mstats" id="mStats"></div>
      <p class="small muted">${t('doors.or')} <button type="button" class="linkish tourbtn" data-guide-start>${t('doors.tour')}</button></p>
    </div>
  </section>`;
}

/* One thing to do at a level, from data/hero.js: a challenge, a topic's simulation, or a topic. */
export function resolve(ref) {
  if (!ref) return null;
  if (ref.ch) {
    const c = CHALLENGES.find(x => x.topic === ref.ch[0] && x.t === ref.ch[1]);
    return c ? { kind: t('ch.kind.' + c.kind), t: c.t, d: c.d, href: c.href, topic: c.topic, cta: t('hero.play') } : null;
  }
  const id = ref.sim || ref.topic, tp = topicById(id);
  return tp ? { kind: t(ref.sim ? 'hero.kind.sim' : 'hero.kind.topic'), t: tp.t, d: tp.s, href: '#' + id, topic: id, cta: t('hero.open') } : null;
}

const chip = id => { const tp = topicById(id); return tp ? '<a class="hchip" href="#' + id + '">' + esc(tp.t) + ' <span aria-hidden="true">→</span></a>' : ''; };

function cardHTML() {
  const L = HERO[st.level];
  if (st.level === DIE_LEVEL && st.map && st.sel) {
    const d = DIE.find(x => x.band === st.sel), b = bandById(st.sel), list = TOPICS.filter(x => x.band === st.sel);
    return '<p class="eyebrow">' + esc(t('hero.map.count', { n: list.length })) + '</p><h3>' + esc(b.t) + '</h3><p class="muted">' + esc(b.d) + '</p>' +
      '<div class="hlist">' + list.map(x => '<a href="#' + x.id + '"><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></a>').join('') + '</div>' +
      '<div class="row">' + (d.zoom != null ? '<button type="button" class="btn primary" data-zoomto="' + d.zoom + '">' + esc(t('hero.map.zoom', { fov: fmtLen(ZOOM_SIZES[d.zoom]) })) + '</button>' : '') +
      '<button type="button" class="btn" data-unsel>' + t('hero.map.back') + '</button></div>';
  }
  if (st.lens === 'explore') {
    return '<p>' + esc(t('zoom.' + (st.level + 1) + '.d')) + '</p>' +
      (st.level === DIE_LEVEL && st.map ? '<p class="hnote">' + t('hero.map.note') + '</p>' : '') +
      '<div class="hchips">' + L.topics.map(chip).join('') + '</div>';
  }
  const c = resolve(L[st.lens]);
  if (!c) return '';
  return '<p class="hkind"><span class="pill l-' + st.lens + '">' + esc(c.kind) + '</span><span class="muted">' + esc(t('hero.in', { topic: (topicById(c.topic) || {}).t || '' })) + '</span></p>' +
    '<h3><a href="' + esc(c.href) + '">' + esc(c.t) + '</a></h3><p class="muted">' + esc(c.d) + '</p>' +
    '<p class="hwhy">' + esc(t('hero.why.' + (st.level + 1) + '.' + st.lens)) + '</p>' +
    '<a class="btn primary" href="' + esc(c.href) + '">' + esc(c.cta) + ' →</a>';
}

function render() {
  const atDie = st.level === DIE_LEVEL, atGate = st.level === GATE_LEVEL;
  $('#hHook').textContent = t('hero.hook.' + (st.level + 1));
  document.querySelectorAll('.hlens').forEach(b => b.setAttribute('aria-selected', String(b.dataset.lens === st.lens)));
  $('#hCard').innerHTML = cardHTML();
  $('#hDie').hidden = !(atDie && st.map);
  document.querySelectorAll('.hdblk').forEach(b => { b.classList.toggle('on', b.dataset.band === st.sel); b.classList.toggle('dim', !!st.sel && b.dataset.band !== st.sel); });
  $('#hMapSeg').hidden = !atDie;
  document.querySelectorAll('#hMapSeg button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.map === '1') === st.map)));
  $('#hGateSeg').hidden = !atGate;
  document.querySelectorAll('#hGateSeg button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.gate === '1') === st.gate)));
  $('#hGateNote').hidden = !(atGate && !st.gate);
}

export function initHero() {
  if (!$('.hero')) return;
  document.addEventListener('osl:zoomlevel', e => {
    const lv = +e.detail || 0;
    if (lv === st.level) return;
    st.level = lv; st.sel = null; render();
  });
  $('.hero').addEventListener('click', e => {
    const l = e.target.closest('[data-lens]'); if (l) { st.lens = l.dataset.lens; render(); return; }
    const blk = e.target.closest('[data-band]'); if (blk) { st.sel = st.sel === blk.dataset.band ? null : blk.dataset.band; render(); return; }
    const m = e.target.closest('[data-map]'); if (m) { st.map = m.dataset.map === '1'; if (!st.map) st.sel = null; render(); return; }
    const g = e.target.closest('[data-gate]'); if (g) { st.gate = g.dataset.gate === '1'; document.dispatchEvent(new CustomEvent('osl:gate', { detail: st.gate })); render(); return; }
    const z = e.target.closest('[data-zoomto]');
    if (z) {
      document.dispatchEvent(new CustomEvent('osl:zoomto', { detail: +z.dataset.zoomto }));
      /* On a phone the card sits below the viewer: bring the zoom back into sight. */
      const v = document.getElementById('zoomCv'), r = v && v.getBoundingClientRect();
      if (r && (r.bottom < 0 || r.top > innerHeight)) v.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    if (e.target.closest('[data-unsel]')) { st.sel = null; render(); }
  });
  /* Arrow keys move between the four lenses, as in any tab list. */
  $('.hlenses').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = LENS_IDS.indexOf(st.lens), n = (i + (e.key === 'ArrowRight' ? 1 : LENS_IDS.length - 1)) % LENS_IDS.length;
    st.lens = LENS_IDS[n]; render(); document.querySelector('.hlens[data-lens="' + st.lens + '"]').focus();
  });
  render();
}
