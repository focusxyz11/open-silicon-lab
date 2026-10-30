/* The 30-second first-visit guide. Four steps, each pointing at the real thing on the page:
   the stack, how topics connect, the two dials (explanation level and year), then a first
   challenge to start with. It opens once, on a first visit to the map; "Take the 30-second
   tour" replays it. Skippable at every step (Esc), and it never opens over a shared deep link. */
import { state as mapState, redrawMap } from './map.js';

const KEY = 'osl-guide-v1';
const $ = s => document.querySelector(s);
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const seen = () => { try { return localStorage.getItem(KEY) === 'done'; } catch (e) { return false; } };
const remember = () => { try { localStorage.setItem(KEY, 'done'); } catch (e) { /* storage unavailable: it simply may show again */ } };

/* target: what to spotlight (one or more selectors); before: what to do when the step opens. */
const STEPS = [
  { target: ['#mStack'], top: true, eyebrow: 'The map', t: 'The whole chip world, as a stack',
    d: 'Atoms at the bottom, devices and industry higher up, big questions on top. Every box is a topic you can play with.',
    before: () => { mapState.sel = null; mapState.thread = null; mapState.lens = ''; redrawMap(); sweep(); } },
  { target: ['#mStack .tnode[data-t="transistor"]'], soft: true, eyebrow: 'Connections', t: 'Everything connects',
    d: 'Select any topic to see how it connects. Use Show to see one kind of connection at a time: what is inside what, cause and effect, or one big idea across the layers. Nothing is locked.',
    before: () => { mapState.sel = 'transistor'; mapState.thread = null; mapState.query = ''; mapState.lens = ''; redrawMap(); } },
  { target: ['.modeseg', '#yearBtn'], eyebrow: 'Two dials', t: 'Your level, and the year',
    d: 'Beginner or Engineer changes how much detail every explanation gives. The year button sends the whole site back to 1971 or forward to 2040.' },
  { target: null, eyebrow: 'Start', t: 'Learn by doing: pick a first challenge', choices: [
    { href: '#tiny', t: 'Build', d: 'Design a tiny chip, from logic gates to a working chip.' },
    { href: '#reality', t: 'Break', d: 'Ship a perfect design to a car and watch reality fail it.' },
    { href: '#whatif', t: 'Imagine', d: 'What if memory runs short? Move one lever and watch the industry ripple.' }
  ] }
];

let i = 0, box = null, hole = null, block = null, open = false, raf = 0;

function sweep() {
  if (reduce()) return;
  const bands = [...document.querySelectorAll('#mBands .band')].reverse();
  bands.forEach((b, k) => setTimeout(() => { b.classList.add('g-lit'); setTimeout(() => b.classList.remove('g-lit'), 520); }, 90 * k));
}

function rectOf(sels) {
  const rs = sels.map(s => document.querySelector(s)).filter(el => el && el.offsetParent !== null).map(el => el.getBoundingClientRect());
  if (!rs.length) return null;
  /* Clip to what is on screen, so a target taller than the screen is framed by what you can see. */
  const l = Math.max(4, Math.min(...rs.map(r => r.left)) - 8), t = Math.max(4, Math.min(...rs.map(r => r.top)) - 8);
  const r = Math.min(innerWidth - 4, Math.max(...rs.map(r => r.right)) + 8), b = Math.min(innerHeight - 4, Math.max(...rs.map(r => r.bottom)) + 8);
  if (r - l < 8 || b - t < 8) return null;
  return { left: l, top: t, width: r - l, height: b - t };
}

function place() {
  if (!open) return;
  const st = STEPS[i], R = st.target ? rectOf(st.target) : null;
  const narrow = innerWidth < 640;
  if (R) { Object.assign(hole.style, { left: R.left + 'px', top: R.top + 'px', width: R.width + 'px', height: R.height + 'px' }); hole.hidden = false; }
  else hole.hidden = true;
  hole.classList.toggle('soft', !!st.soft);
  /* A big target leaves no room beside it: the card sits at the bottom (phones) or bottom corner. */
  const big = R && R.height > innerHeight * 0.55;
  box.classList.toggle('sheet', narrow || !R);
  box.classList.toggle('corner', !narrow && !!big);
  if (narrow || !R || big) { box.style.left = box.style.top = ''; return; }
  const bw = box.offsetWidth, bh = box.offsetHeight, gap = 14;
  let top = R.top + R.height + gap;
  if (top + bh > innerHeight - 12) top = R.top - bh - gap;
  if (top < 12) top = Math.min(innerHeight - bh - 12, Math.max(12, R.top + 12));
  const left = Math.min(innerWidth - bw - 12, Math.max(12, R.left + R.width / 2 - bw / 2));
  box.style.left = left + 'px'; box.style.top = top + 'px';
}
const follow = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };

function render() {
  if (!open || !box) return;   /* closed before a delayed call arrived */
  const st = STEPS[i], last = i === STEPS.length - 1;
  box.innerHTML = '<div class="g-top"><p class="eyebrow">' + st.eyebrow + ' · ' + (i + 1) + ' of ' + STEPS.length + '</p><button type="button" class="g-skip" data-g="skip">Skip tour</button></div>' +
    '<h3 id="gTitle">' + st.t + '</h3>' + (st.d ? '<p>' + st.d + '</p>' : '') +
    (st.choices ? '<div class="g-choices">' + st.choices.map(c => '<a href="' + c.href + '" data-g="go"><b>' + c.t + '</b><span>' + c.d + '</span></a>').join('') + '</div><button type="button" class="g-link" data-g="done">Or explore the map on your own</button>' : '') +
    '<div class="g-foot"><span class="g-dots" aria-hidden="true">' + STEPS.map((_, k) => '<i' + (k === i ? ' class="on"' : '') + '></i>').join('') + '</span>' +
    (i ? '<button type="button" class="btn" data-g="back">Back</button>' : '') + (last ? '' : '<button type="button" class="btn primary" data-g="next">Next</button>') + '</div>';
  if (st.before) st.before();
  const first = st.target && document.querySelector(st.target[0]);
  if (first) { const r = first.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 60) first.scrollIntoView({ block: st.top ? 'start' : 'center', behavior: reduce() ? 'instant' : 'smooth' }); }
  setTimeout(place, reduce() ? 0 : 380); place();
  const focus = box.querySelector('[data-g="next"]') || box.querySelector('[data-g="go"]'); if (focus) focus.focus({ preventScroll: true });
}

function close() {
  if (!open) return; open = false; remember();
  [box, hole, block].forEach(el => el && el.remove()); box = hole = block = null;
  removeEventListener('resize', follow); removeEventListener('scroll', follow, true); document.removeEventListener('keydown', keys);
  document.documentElement.classList.remove('g-on');
  const back = $('[data-guide-start]'); if (back) back.focus({ preventScroll: true });
}
function keys(e) {
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  else if (e.key === 'ArrowRight' && i < STEPS.length - 1) { i++; render(); }
  else if (e.key === 'ArrowLeft' && i > 0) { i--; render(); }
}

export function startGuide() {
  if (open) return;
  if (location.hash && location.hash !== '#map') location.hash = 'map';
  open = true; i = 0;
  block = document.createElement('div'); block.className = 'g-block';
  hole = document.createElement('div'); hole.className = 'g-hole'; hole.setAttribute('aria-hidden', 'true');
  box = document.createElement('div'); box.className = 'g-card'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'gTitle');
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const a = b.dataset.g;
    if (a === 'next') { i++; render(); } else if (a === 'back') { i--; render(); } else if (a === 'skip' || a === 'done' || a === 'go') close();
  });
  document.body.append(block, hole, box);
  document.documentElement.classList.add('g-on');
  addEventListener('resize', follow); addEventListener('scroll', follow, true); document.addEventListener('keydown', keys);
  setTimeout(render, 0);
}

export function initGuide() {
  document.addEventListener('click', e => { if (e.target.closest('[data-guide-start]')) { e.preventDefault(); startGuide(); } });
  /* First visit, arriving on the map (not on someone's shared link to a topic). */
  const home = !location.hash || location.hash === '#map';
  if (!seen() && home) setTimeout(() => { if (!open && (!location.hash || location.hash === '#map')) startGuide(); }, 700);
}
