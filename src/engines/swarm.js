/* The Swarm engine (content/life.md): many small units with local rules, no one in charge, and what the whole
   does. Pure logic, no DOM; tests in tests/swarm.test.mjs.

   Two specimens, each from a measured experiment:

   1. Trails. Ants walk between their nest and food over two bridges, one short and one long. Each ant drops
      scent on the bridge it takes and, at each end, picks a bridge by the scent on it. The rule is the one fitted
      to Argentine ants on a double bridge by Deneubourg, Aron, Goss and Pasteels (J. Insect Behaviour, 1990):
      the chance of taking bridge A is (k + A)^n / ((k + A)^n + (k + B)^n), with n = 2 and k = 20 scent marks.
      Ants on the short bridge come back sooner, so it collects scent faster, and the colony settles on it with no
      ant knowing which is shorter. Goss, Aron, Deneubourg and Pasteels (Naturwissenschaften, 1989) gave the ants
      the short bridge only after the long one: most kept to the long one. Whether scent fades decides it.
      What it leaves out: space, crowding, ants getting lost, scent laid differently going and coming.

   2. Eyes. A camera reads every pixel every frame, whatever happens. A pixel that works like an eye reports only
      when the light on it has changed by more than a threshold since it last reported, as in the event camera of
      Lichtsteiner, Posch and Delbruck (IEEE JSSC, 2008). Count the reads against the events: work done only when
      news arrives. */

/* the same chance every time, so a run can be repeated: a small seeded generator (mulberry32) */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---- 1. trails ---- */
export const K = 20;                       /* scent marks before scent sways the choice (Deneubourg et al. 1990) */
export const SHORT = 12, LONG = 24;        /* steps to cross each bridge: the long one twice the short, as in the experiments */
export const COLONIES = [10, 60, 240];
/* how ants follow scent: not at all, in proportion, or more than in proportion (the measured n = 2) */
export const FOLLOW = [0, 1, 2];
/* how much scent is left after each step: it never fades, it fades slowly, it fades quickly */
export const FADE = [1, 0.99, 0.95];
export const OPEN_AT = 300;                /* in the second test, the short bridge opens only at this step */
export const STEPS = 1500;

/* the chance an ant takes the short bridge, from the scent on each and the rule */
export function choice(a, b, n = 2, k = K) {
  if (n === 0) return 0.5;
  const A = Math.pow(k + a, n), B = Math.pow(k + b, n);
  return A / (A + B);
}

export function colony({ n = COLONIES[1], follow = 2, fade = FADE[0], late = false, seed = 7, k = K } = {}) {
  const R = rng(seed), ants = [];
  /* ants leave the nest one after another, a step apart, so the first choices are not all made at once */
  for (let i = 0; i < n; i++) ants.push({ b: -1, pos: 0, dir: 1, wait: i % 40, alive: true });
  /* scent[bridge][end]: each bridge is marked at its nest end (0) and its food end (1); an ant marks the end it
     leaves from and the end it arrives at, so the far end of the short bridge is marked first by ants coming back */
  return { R, ants, scent: [[0, 0], [0, 0]], follow, fade, late, k, t: 0, food: 0, history: [], crossed: [0, 0], win: [0, 0] };
}
const open = (S, b) => b === 1 || !S.late || S.t >= OPEN_AT;
function pick(S, end) {
  if (!open(S, 0)) return 1;
  return S.R() < choice(S.scent[0][end], S.scent[1][end], S.follow, S.k) ? 0 : 1;
}
/* the scent on a bridge, both ends together (for drawing) */
export const scentOn = (S, b) => S.scent[b][0] + S.scent[b][1];
/* one step for every ant; returns the state, changed in place (the view keeps one and steps it each frame) */
export function step(S) {
  S.t++;
  for (const a of S.ants) {
    if (!a.alive) continue;
    if (a.wait > 0) { a.wait--; continue; }
    if (a.b < 0) { a.b = pick(S, 0); a.pos = 0; S.scent[a.b][0] += 1; S.crossed[a.b]++; S.win[a.b]++; continue; }
    a.pos += 1;
    const len = a.b === 0 ? SHORT : LONG;
    if (a.pos >= len) {
      /* reached an end: it marks it; at the food it picks up a crumb, at the nest it drops it; then it picks a
         bridge back from this end, and marks this end again as it sets off */
      const end = a.dir === 1 ? 1 : 0;
      S.scent[a.b][end] += 1;
      if (a.dir === 1) a.dir = -1; else { a.dir = 1; S.food++; }
      a.b = pick(S, end); a.pos = 0; S.scent[a.b][end] += 1; S.crossed[a.b]++; S.win[a.b]++;
    }
  }
  for (const b of [0, 1]) for (const e of [0, 1]) S.scent[b][e] *= S.fade;
  /* every 20 steps: the share of the choices made in them that took the short bridge */
  if (S.t % 20 === 0) { const w = S.win[0] + S.win[1]; S.history.push(w ? S.win[0] / w : null); S.win = [0, 0]; }
  return S;
}
/* the share of recent choices that took the short bridge */
export function share(S, last = 5) {
  const h = S.history.slice(-last).filter(v => v != null);
  return h.length ? h.reduce((x, y) => x + y, 0) / h.length : null;
}
/* take away a share of the ants, the same ones each time for a given colony */
export function kill(S, part = 1 / 3) {
  const live = S.ants.filter(a => a.alive), m = Math.round(live.length * part);
  for (let i = 0; i < m; i++) live[(i * 7919) % live.length].alive = false;
  /* a second pass in case the stride met an ant already taken */
  let left = m - (live.length - live.filter(a => a.alive).length);
  for (const a of live) { if (left <= 0) break; if (a.alive) { a.alive = false; left--; } }
  return S;
}
export const verdict = v => (v == null ? 'none' : v >= 0.8 ? 'short' : v <= 0.2 ? 'long' : 'both');
/* run a colony to the end without drawing it: where it settled, and the food brought home */
export function settle(opts, steps = STEPS) {
  const S = colony(opts);
  for (let i = 0; i < steps; i++) step(S);
  const avg = share(S, 10) ?? 0.5;
  return { short: avg, food: S.food, verdict: verdict(avg) };
}

/* ---- 2. eyes ---- */
export const EYE_W = 24, EYE_H = 14;
export const SCENES = ['still', 'one', 'busy'];
export const THRESHOLD = 0.15;             /* a change in light, as a share of full, before a pixel reports */
/* the light on every pixel at frame f: a still room; one ball rolling across; many things moving */
export function scene(kind, f, W = EYE_W, H = EYE_H) {
  const px = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px[y * W + x] = 0.25 + 0.15 * Math.sin(x * 0.7) * Math.cos(y * 0.9);
  const ball = (cx, cy, r) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d < r) px[y * W + x] = Math.max(px[y * W + x], 1 - d / r * 0.4); } };
  if (kind === 'one') ball(((f * 0.35) % (W + 6)) - 3, H / 2, 2.4);
  if (kind === 'busy') for (let i = 0; i < 7; i++) ball((((f * (0.3 + i * 0.11)) + i * 9) % (W + 6)) - 3, (i * 5.3 + f * 0.07 * (i % 3)) % H, 1.8 + (i % 3) * 0.5);
  return px;
}
/* one frame through each kind of eye: the camera reads every pixel; the eye-like pixels report the ones that
   changed enough since they last reported, and remember the new level */
export function look(kind, f, last) {
  const px = scene(kind, f), events = [];
  for (let i = 0; i < px.length; i++) if (Math.abs(px[i] - last[i]) > THRESHOLD) { events.push(i); last[i] = px[i]; }
  return { px, events, reads: px.length };
}
/* many frames: reads against events */
export function watch(kind, frames = 120) {
  const last = scene(kind, 0); let reads = 0, events = 0;
  for (let f = 1; f <= frames; f++) { const r = look(kind, f, last); reads += r.reads; events += r.events.length; }
  return { reads, events };
}
