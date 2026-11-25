/* Swarm (content/life.md, the visual system of "what new kinds of computers could brains, swarms and living cells
   inspire?"): many small things, no one in charge, and the pattern that comes out of them. Above, a colony of ants
   between its nest and food over a short bridge and a long one, each ant following the rule measured on Argentine
   ants (the Swarm engine, src/engines/swarm.js); the trail that forms belongs to the colony, not to any ant. Change
   the rule, the colony, or when the short bridge opens; take away a third of the ants and watch the trail hold.
   Below, the same idea in an eye: a camera reads every pixel every frame, eye-like pixels report only what
   changed. The scenes are drawn on canvases; every word is HTML. Words: swm.*. */
import { still } from '../core/ui.js';
import { esc } from '../core/esc.js';
import { t, fmtNum } from '../core/i18n.js';
import { colony, step, kill, share, verdict, scentOn, COLONIES, FOLLOW, FADE, OPEN_AT, STEPS, SHORT, LONG, SCENES, EYE_W, EYE_H, look, scene } from '../engines/swarm.js';

const S = { n: 1, follow: 2, fade: 0, late: 0, seed: 7, eye: 1, paused: false };
let C = null, killedAt = null, E = null;   /* the running colony, when a third was taken, the eyes' running count */
const RATE = 100;      /* steps a second, whatever the frame rate: a run of 1,500 steps takes 15 seconds */
const pct = v => fmtNum(Math.round(v * 100));

function fresh() { C = colony({ n: COLONIES[S.n], follow: FOLLOW[S.follow], fade: FADE[S.fade], late: !!S.late, seed: S.seed }); killedAt = null; }
const ctl = (k, vals, label, name) => '<div class="pctl"><span class="small"><b>' + esc(t(label)) + '</b></span><div class="chips">' + vals.map((v, i) => '<button type="button" class="chipb" data-swk="' + k + '" data-swv="' + i + '" aria-pressed="' + (S[k] === i) + '">' + esc(name(v, i)) + '</button>').join('') + '</div></div>';

export function swarmHtml() {
  fresh();
  let h = '<section class="swarmbox" data-swarm><p class="kicker">' + esc(t('swm.k')) + '</p>';
  h += '<div class="swstage"><canvas class="swants" width="640" height="330" role="img" aria-label="' + esc(t('swm.antsAria')) + '"></canvas>' +
    '<span class="swlab nest">' + esc(t('swm.nest')) + '</span><span class="swlab food">' + esc(t('swm.food')) + '</span><span class="swlab short">' + esc(t('swm.short')) + '</span><span class="swlab long">' + esc(t('swm.long')) + '</span></div>';
  h += '<div class="swread"><div><b data-sw="share">–</b><span>' + esc(t('swm.shareK')) + '</span></div><div><b data-sw="food">0</b><span>' + esc(t('swm.foodK')) + '</span></div><div><b data-sw="t">0</b><span>' + esc(t('swm.tK', { n: fmtNum(STEPS) })) + '</span></div><svg class="swline" viewBox="0 0 150 40" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="20" x2="150" y2="20"/><polyline data-sw="line" points=""/></svg></div>';
  h += '<div class="swact"><button type="button" class="chipb" data-swk="kill" data-swv="0">' + esc(t('swm.kill')) + '</button><button type="button" class="chipb" data-swk="seed" data-swv="0">' + esc(t('swm.again')) + '</button><button type="button" class="chipb" data-swk="pause" data-swv="0">' + esc(t('swm.pause')) + '</button></div>';
  h += '<p class="plead" data-sw="say">' + esc(t('swm.running')) + '</p>';
  h += '<div class="sbctl">' + ctl('follow', FOLLOW, 'swm.follow', (v, i) => t('swm.follow.' + i)) + ctl('fade', FADE, 'swm.fade', (v, i) => t('swm.fade.' + i)) +
    ctl('n', COLONIES, 'swm.n', v => t('swm.ants', { n: fmtNum(v) })) + ctl('late', [0, 1], 'swm.late', (v, i) => t('swm.late.' + i)) + '</div>';
  h += '<p class="small muted">' + esc(t('swm.model')) + ' <a href="https://doi.org/10.1007/BF01417909" target="_blank" rel="noopener">' + esc(t('swm.src1')) + '</a> · <a href="https://doi.org/10.1007/BF00462870" target="_blank" rel="noopener">' + esc(t('swm.src2')) + '</a></p>';
  /* the eyes */
  h += '<p class="kicker">' + esc(t('swm.eyeK')) + '</p><div class="chips">' + SCENES.map((s, i) => '<button type="button" class="chipb" data-swk="eye" data-swv="' + i + '" aria-pressed="' + (S.eye === i) + '">' + esc(t('swm.scene.' + s)) + '</button>').join('') + '</div>';
  h += '<div class="sweyes"><figure><canvas class="sweye cam" width="240" height="140" role="img" aria-label="' + esc(t('swm.camAria')) + '"></canvas><figcaption><b>' + esc(t('swm.cam')) + '</b><span data-sw="reads">0</span></figcaption></figure>' +
    '<figure><canvas class="sweye ev" width="240" height="140" role="img" aria-label="' + esc(t('swm.evAria')) + '"></canvas><figcaption><b>' + esc(t('swm.ev')) + '</b><span data-sw="events">0</span></figcaption></figure></div>';
  h += '<p class="plead" data-sw="eyesay"></p><p class="small muted">' + esc(t('swm.eyeModel')) + ' <a href="https://doi.org/10.1109/JSSC.2007.914337" target="_blank" rel="noopener">' + esc(t('swm.src3')) + '</a></p>';
  return h + '</section>';
}

/* ---- drawing ---- */
const css = (el, name) => getComputedStyle(el).getPropertyValue(name).trim() || '#888';
function geom(W, H) {
  const nx = W * 0.09, fx = W * 0.91, y = H * 0.86, d = fx - nx, hgt = Math.min(d / 2, H * 0.74);
  const onShort = f => [nx + d * f, y];
  /* the long bridge: a cubic curve up and over, about twice the short one's length */
  const onLong = f => { const u = 1 - f; return [u * u * u * nx + 3 * u * u * f * nx + 3 * u * f * f * fx + f * f * f * fx, u * u * u * y + 3 * u * u * f * (y - hgt) + 3 * u * f * f * (y - hgt) + f * f * f * y]; };
  return { nx, fx, y, hgt, onShort, onLong };
}
function drawAnts(cv) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height, G = geom(W, H), ink = css(cv, '--ink'), qc = css(cv, '--qc'), muted = css(cv, '--muted');
  g.clearRect(0, 0, W, H);
  const path = (on, steps) => { g.beginPath(); for (let i = 0; i <= steps; i++) { const [x, y] = on(i / steps); i ? g.lineTo(x, y) : g.moveTo(x, y); } };
  const closed = C.late && C.t < OPEN_AT;
  [[G.onShort, 0], [G.onLong, 1]].forEach(([on, b]) => {
    path(on, 60); g.lineCap = 'round';
    g.strokeStyle = muted; g.globalAlpha = 0.25; g.lineWidth = 10; if (b === 0 && closed) g.setLineDash([4, 8]); g.stroke(); g.setLineDash([]);
    /* a bridge is drawn by its share of the scent: the trail is where the scent is, against the other bridge */
    const sc = scentOn(C, b), all = scentOn(C, 0) + scentOn(C, 1), part = all > 0 ? sc / all : 0;
    if (sc > 0.5) { path(on, 60); g.strokeStyle = qc; g.globalAlpha = 0.1 + 0.75 * part; g.lineWidth = 2 + 12 * part * Math.min(1, all / 200); g.stroke(); }
  });
  g.globalAlpha = 1;
  [[G.nx, 'nest'], [G.fx, 'food']].forEach(([x]) => { g.beginPath(); g.arc(x, G.y, 13, 0, 7); g.fillStyle = muted; g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1; });
  C.ants.forEach((a, i) => {
    if (!a.alive || a.b < 0) return;
    /* the engine moves ants a whole step at a time; each is drawn a little apart from its neighbours */
    const len = a.b === 0 ? SHORT : LONG, p = Math.min(len, a.pos + ((i * 0.618) % 1) * 0.9), f = a.dir === 1 ? p / len : 1 - p / len, [x, y] = (a.b === 0 ? G.onShort : G.onLong)(f);
    const side = (a.dir === 1 ? -1 : 1) * (2.5 + ((i * 0.37) % 1) * 4);
    g.beginPath(); g.arc(x, y + side, a.dir === 1 ? 2.1 : 2.6, 0, 7); g.fillStyle = a.dir === 1 ? ink : '#f0a33a'; g.fill();
  });
}
function readout(box) {
  const q = k => box.querySelector('[data-sw="' + k + '"]'), v = share(C);
  q('share').textContent = v == null ? '–' : t('swm.pct', { v: pct(v) });
  q('food').textContent = fmtNum(C.food); q('t').textContent = fmtNum(C.t);
  q('line').setAttribute('points', C.history.map((h, i) => (i * 150 / (STEPS / 20)).toFixed(1) + ',' + (40 - 40 * (h ?? 0.5)).toFixed(1)).join(' '));
  let say;
  if (C.late && C.t < OPEN_AT) say = t('swm.waiting', { n: fmtNum(OPEN_AT - C.t) });
  else if (C.t < STEPS) say = t('swm.running');
  else {
    const vd = verdict(share(C, 10));
    if (vd === 'short') say = t('swm.v.short');
    else if (vd === 'long') say = C.late ? t('swm.v.stuck') : t('swm.v.long');
    else say = S.follow === 0 ? t('swm.v.ignore') : S.follow === 1 ? t('swm.v.linear') : t('swm.v.fade');
  }
  if (killedAt != null) say += ' ' + t('swm.killed', { t: fmtNum(killedAt) });
  q('say').textContent = say;
}
function drawEye(box) {
  const cam = box.querySelector('.sweye.cam'), ev = box.querySelector('.sweye.ev'); if (!cam || !ev) return;
  const r = look(SCENES[S.eye], E.f, E.last), cw = cam.width / EYE_W, ch = cam.height / EYE_H, qc = css(ev, '--qc');
  E.reads += r.reads; E.events += r.events.length;
  const gc = cam.getContext('2d');
  for (let i = 0; i < r.px.length; i++) { const v = Math.round(r.px[i] * 255); gc.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; gc.fillRect((i % EYE_W) * cw, Math.floor(i / EYE_W) * ch, cw - 1, ch - 1); }
  const ge = ev.getContext('2d');
  for (let i = 0; i < E.glow.length; i++) E.glow[i] *= 0.8;
  r.events.forEach(i => (E.glow[i] = 1));
  ge.clearRect(0, 0, ev.width, ev.height);
  for (let i = 0; i < E.glow.length; i++) { ge.globalAlpha = 0.08 + 0.92 * E.glow[i]; ge.fillStyle = E.glow[i] > 0.05 ? qc : css(ev, '--muted'); ge.fillRect((i % EYE_W) * cw, Math.floor(i / EYE_W) * ch, cw - 1, ch - 1); }
  ge.globalAlpha = 1;
  box.querySelector('[data-sw="reads"]').textContent = t('swm.reads', { n: fmtNum(E.reads) });
  box.querySelector('[data-sw="events"]').textContent = t('swm.events', { n: fmtNum(E.events) });
  box.querySelector('[data-sw="eyesay"]').textContent = E.events === 0 ? t('swm.eye.none', { n: fmtNum(E.reads) }) : t('swm.eye.some', { r: fmtNum(Math.round(E.reads / E.events)) });
}
function freshEye() { E = { f: 0, last: scene(SCENES[S.eye], 0), reads: 0, events: 0, glow: new Float32Array(EYE_W * EYE_H) }; }

/* start the colony and the eyes once the section is on the page; each loop ends when its section leaves */
export function swarmStart(root) {
  const box = root.querySelector('[data-swarm]'); if (!box) return;
  const cv = box.querySelector('.swants'); freshEye();
  if (still()) { while (C.t < STEPS) step(C); drawAnts(cv); readout(box); for (let i = 0; i < 60; i++) { E.f++; drawEye(box); } return; }
  let last = performance.now(), owed = 0, eyeAt = last;
  const loop = now => {
    if (!box.isConnected) return;
    owed = Math.min(25, owed + (now - last) / 1000 * RATE); last = now;
    if (!S.paused && C.t < STEPS && owed >= 1) { while (owed >= 1 && C.t < STEPS) { step(C); owed--; } drawAnts(cv); readout(box); }
    if (now - eyeAt > 60) { eyeAt = now; E.f++; drawEye(box); }
    requestAnimationFrame(loop);
  };
  drawAnts(cv); readout(box); requestAnimationFrame(loop);
}
export function swarmInput(btn) {
  const box = btn.closest('[data-swarm]'); if (!box) return false;
  const k = btn.dataset.swk, i = +btn.dataset.swv; if (!k) return false;
  if (k === 'kill') { if (killedAt == null) { kill(C, 1 / 3); killedAt = C.t; if (still()) { while (C.t < STEPS) step(C); } drawAnts(box.querySelector('.swants')); readout(box); } return true; }
  if (k === 'pause') { S.paused = !S.paused; btn.textContent = t(S.paused ? 'swm.play' : 'swm.pause'); return true; }
  if (k === 'eye') { S.eye = i; box.querySelectorAll('[data-swk="eye"]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.swv === i))); freshEye(); if (still()) for (let j = 0; j < 60; j++) { E.f++; drawEye(box); } return true; }
  if (k === 'seed') S.seed++; else S[k] = i;
  box.querySelectorAll('[data-swk="' + k + '"]').forEach(b => b.hasAttribute('aria-pressed') && b.setAttribute('aria-pressed', String(+b.dataset.swv === S[k])));
  fresh(); S.paused = false; const p = box.querySelector('[data-swk="pause"]'); if (p) p.textContent = t('swm.pause');
  if (still()) while (C.t < STEPS) step(C);
  drawAnts(box.querySelector('.swants')); readout(box);
  return true;
}
