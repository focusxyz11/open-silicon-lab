/* The shell around the world: the top bar, the depth rail at the left, and the card at the right.
   There is one thing on screen, the dive. A question is met on the part of a scene it is about; once
   picked, it stays with you as you go deeper or higher, and changes form at every depth it reaches.
   The rail shows the depths and where the question you follow has a form, joined by its colour. */
import { t } from '../core/i18n.js';
import { THREADS } from '../data/weave.js';
import { N, IDS, clampZ, sizeAt, sizeParts, stop, stopKey, crossing, below, above, nearest, threadOf, rootShown, threadDepths } from '../engines/weave.js';
import { createWorld, threadColor, theme, reduced } from './world.js';

const KEY = 'osl-weave-v1';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };

export function start() {
  const $ = id => document.getElementById(id);
  const saved = load();
  const S = {
    z: typeof saved.z === 'number' ? clampZ(saved.z) : 0,
    thread: threadOf(saved.thread) ? saved.thread : null,
    seen: saved.seen && typeof saved.seen === 'object' ? saved.seen : {}
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ z: Math.round(world.z * 100) / 100, thread: S.thread, seen: S.seen })); } catch (e) { /* storage unavailable */ } };

  const depthName = d => t('depth.' + IDS[d] + '.name');
  const across = z => { const [n, unit] = sizeParts(sizeAt(z)); return t('ui.across', { n, unit }); };
  const q = (th, d) => t('stop.' + stopKey(th, d) + '.q');

  /* ---- the world ---- */
  const world = createWorld($('world'), {
    zoom(z) { const a = $('acrossNow'); if (a) a.textContent = across(z); railNow(z); },
    depth(d) { see(d); card(); rail(); save(); },
    arrive(d) { see(d); card(); rail(); save(); },
    pick(th) { follow(th); }
  });
  world.setZ(S.z);

  /* A question you follow remembers the depths where you met it. */
  function see(d) {
    if (!S.thread || !stop(S.thread, d)) return;
    const s = new Set(S.seen[S.thread] || []); s.add(d); S.seen[S.thread] = [...s];
  }
  function follow(th) {
    S.thread = th; world.setThread(th);
    const d = Math.round(world.z);
    if (!stop(th, d)) { const n = nearest(th, d); if (n != null) world.flyTo(n); }
    see(d); card(); rail(); save();
  }
  function letGo() { S.thread = null; world.setThread(null); world.setAnchor(null); card(); rail(); save(); }

  /* ---- the rail ---- */
  const railEl = $('rail');
  railEl.innerHTML = '<ol>' + IDS.map((id, d) => '<li><button type="button" data-d="' + d + '"><i></i><b>' + esc(t('depth.' + id + '.name')) + '</b><small>' + esc(across(d)) + '</small></button></li>').join('') + '</ol><span class="railnow" id="railNow"></span><span class="railthread" id="railThread"></span>';
  railEl.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) world.flyTo(+b.dataset.d); });
  function rail() {
    const d = Math.round(world.z), stops = S.thread ? threadDepths(S.thread) : [], color = S.thread ? threadColor(S.thread) : '';
    railEl.querySelectorAll('[data-d]').forEach(b => {
      const k = +b.dataset.d, on = stops.includes(k);
      b.setAttribute('aria-current', k === d ? 'true' : 'false');
      b.classList.toggle('stop', on); b.querySelector('i').style.background = on ? color : '';
      b.classList.toggle('seen', on && (S.seen[S.thread] || []).includes(k));
    });
    /* the question's colour joins its forms down the rail */
    const line = $('railThread');
    if (stops.length > 1) {
      const a = railEl.querySelector('[data-d="' + stops[0] + '"] i').getBoundingClientRect(), b = railEl.querySelector('[data-d="' + stops[stops.length - 1] + '"] i').getBoundingClientRect(), r = railEl.getBoundingClientRect();
      Object.assign(line.style, { display: 'block', top: (a.top + a.height / 2 - r.top) + 'px', height: (b.top - a.top) + 'px', left: (a.left + a.width / 2 - r.left - 1) + 'px', background: color });
    } else line.style.display = 'none';
    railNow(world.z);
  }
  function railNow(z) {
    const items = railEl.querySelectorAll('[data-d] i'); if (!items.length) return;
    const r = railEl.getBoundingClientRect(), i = Math.min(N - 2, Math.floor(z)), f = z - i;
    const a = items[i].getBoundingClientRect(), b = items[Math.min(N - 1, i + 1)].getBoundingClientRect();
    $('railNow').style.top = (a.top + (b.top - a.top) * f + a.height / 2 - r.top) + 'px';
  }

  /* ---- the card ---- */
  const cardEl = $('card');
  const qButton = (th, d) => '<button type="button" class="qpick" data-th="' + th + '" style="--th:' + threadColor(th) + '"><i></i><span>' + esc(q(th, d)) + '</span></button>';
  function card() {
    const d = Math.round(world.z), th = S.thread;
    let h = '<p class="where"><b>' + esc(depthName(d)) + '</b> <span id="acrossNow">' + esc(across(world.z)) + '</span></p>';
    if (th) {
      const here = stop(th, d), color = threadColor(th), key = stopKey(th, d);
      h += '<section class="follow" style="--th:' + color + '"><p class="code">' + t('ui.following') + '</p>';
      if (rootShown(S.seen[th])) h += '<div class="root"><p class="small">' + t('ui.rootOf') + '</p><p class="rootq">' + esc(t('thread.' + th + '.root')) + '</p><p class="small">' + t('ui.behind') + ' <em>' + esc(t('thread.' + th + '.behind')) + '</em></p></div>';
      if (here) {
        h += '<p class="small muted">' + t('ui.becomes') + '</p><h2 id="cardQ">' + esc(q(th, d)) + '</h2><p>' + esc(t('stop.' + key + '.note')) + '</p>';
        const tried = t('stop.' + key + '.tried');
        if (Array.isArray(tried)) h += '<p class="small muted">' + t('ui.tried') + '</p><ul class="tried">' + tried.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
        const dn = below(th, d), up = above(th, d);
        h += '<div class="moves">' + (dn != null ? '<button type="button" class="btn primary" data-go="' + dn + '">' + esc(t('ui.deeper', { depth: depthName(dn) })) + '</button>' : '<p class="small">' + t('ui.bottom') + '</p>') +
          (up != null ? '<button type="button" class="btn" data-go="' + up + '">' + esc(t('ui.higher', { depth: depthName(up) })) + '</button>' : '') + '</div>';
      } else {
        const n = nearest(th, d);
        h += '<p>' + t('ui.noStop') + '</p>' + (n != null ? '<button type="button" class="btn primary" data-go="' + n + '">' + esc(t('ui.nearest', { depth: depthName(n) })) + '</button>' : '');
      }
      h += '<button type="button" class="link" data-leave>' + t('ui.leave') + '</button></section>';
      const others = crossing(d).filter(x => x !== th);
      if (others.length) h += '<section class="crossing"><p class="code">' + t('ui.alsoCrossing') + '</p>' + others.map(x => qButton(x, d)).join('') + '</section>';
    } else {
      h += '<p class="see">' + esc(t('depth.' + IDS[d] + '.see')) + '</p>';
      const all = crossing(d);
      h += '<section class="crossing"><p class="code">' + t('ui.crossingHere') + '</p>' + (all.length ? all.map(x => qButton(x, d)).join('') : '<p class="small muted">' + t('ui.noneCrossing') + '</p>') + '</section>';
      h += '<p class="small muted how">' + t('ui.howMove') + '</p>';
    }
    cardEl.innerHTML = h;
    anchor();
  }
  cardEl.addEventListener('click', e => {
    const p = e.target.closest('[data-th]'); if (p) { follow(p.dataset.th); return; }
    const g = e.target.closest('[data-go]'); if (g) { world.flyTo(+g.dataset.go); return; }
    if (e.target.closest('[data-leave]')) letGo();
  });
  /* the tether starts at the question in the card (only when the card sits beside the world) */
  function anchor() {
    const el = $('cardQ'), cv = $('world');
    if (!el || !S.thread || getComputedStyle(cardEl).position !== 'absolute') { world.setAnchor(null); return; }
    const r = el.getBoundingClientRect(), c = cv.getBoundingClientRect();
    world.setAnchor([r.left - c.left - 6, r.top - c.top + Math.min(r.height / 2, 18)]);
  }

  /* ---- layout: keep the scene clear of the rail and the card ---- */
  function layout() {
    const side = getComputedStyle(cardEl).position === 'absolute';
    const top = $('top').getBoundingClientRect().height, rr = railEl.getBoundingClientRect(), cr = cardEl.getBoundingClientRect();
    world.setInset(side ? { l: rr.right + 12, r: window.innerWidth - cr.left + 12, t: top + 8, b: 16 } : { l: 8, r: 8, t: 8, b: 8 });
    rail(); anchor();
  }
  new ResizeObserver(layout).observe(document.body);

  /* ---- theme ---- */
  const tb = $('themeBtn');
  const themeLabel = () => { const k = theme() === 'dark' ? 'ui.toLight' : 'ui.toDark'; tb.setAttribute('aria-label', t(k)); tb.title = t(k); };
  tb.addEventListener('click', () => { const n = theme() === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('osl-theme', n); } catch (e) { /* storage unavailable */ } themeLabel(); card(); rail(); });
  themeLabel();

  world.setThread(S.thread);
  card(); layout();
  if (reduced()) document.documentElement.classList.add('rm');
  window.addEventListener('beforeunload', save);
}
