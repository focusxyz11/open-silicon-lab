/* The sound of a level slowed until it can be heard (Listen, #316, behind ?listen=1), with Web Audio. It plays a score
   of src/engines/listen.js: what each voice plays comes from the lab's engines, never from here. Few voices, soft, no
   music: a tick, a blip, a thump, a click, a hum and a hiss.
   - The audio is made only on a visitor's tap (start() is called from a click), never by itself, and it stops when the
     page is hidden.
   - Sounds are scheduled a little ahead on the audio clock; each event is also told back at its moment (onEvent), so
     the picture lights in time and the caption writes it. Where there is no audio (an old browser, a test without
     sound) the same events are told on the page's clock, silently.
   - One player at a time: starting another stops the first (its onStop is told); swap() changes the score of the one
     playing, keeping who it tells.
   - A phone buzz on a wrong bit, where the browser allows it and only when the visitor asked for it (buzz). */
const AHEAD = 0.15, EVERY = 25, MASTER = 0.5;
let ctx = null, master = null, hum = null, humG = null, hissG = null, cur = null, timer = 0, buzz = false;
/* a score runs on the audio clock while audio runs, else on the page's (silently) */
const audioOn = () => !!ctx && ctx.state === 'running';
const pageNow = () => performance.now() / 1000;
const clockOf = c => (c.audio ? ctx.currentTime : pageNow());

function make() {
  if (ctx) return true;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); if (!AC) return false;
  try {
    ctx = new AC(); master = ctx.createGain(); master.gain.value = MASTER; master.connect(ctx.destination);
    /* the hum: a soft triangle through a low-pass, so it is felt more than heard */
    hum = ctx.createOscillator(); hum.type = 'triangle'; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    humG = ctx.createGain(); humG.gain.value = 0; hum.connect(lp).connect(humG).connect(master); hum.start();
    /* the hiss: noise through a band around 3.5 kHz */
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3500; bp.Q.value = 0.7;
    hissG = ctx.createGain(); hissG.gain.value = 0; src.connect(bp).connect(hissG).connect(master); src.start();
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    return true;
  } catch (e) { ctx = null; return false; }
}
/* one short sound: a tone that rises in 4 ms and dies away, falling in pitch by drop if asked */
function blip(t, hz, dur, gain, type = 'sine', drop = 0) {
  const o = ctx.createOscillator(), e = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(hz, t); if (drop) o.frequency.exponentialRampToValueAtTime(hz * drop, t + dur);
  e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gain, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e).connect(master); o.start(t); o.stop(t + dur + 0.03);
}
function sound(e, t, V) {
  if (e.v === 'tick') blip(t, V.clock.hz, V.clock.dur, V.clock.gain);
  else if (e.v === 'sum') blip(t, V.sum.hz * (0.9 + (e.i % 5) * 0.05), V.sum.dur, V.sum.gain);
  else if (e.v === 'fetch') blip(t, V.fetch.hz, V.fetch.dur, V.fetch.gain, 'sine', 0.5);
  else if (e.v === 'wrong') blip(t, V.wrong.hz, V.wrong.dur, V.wrong.gain, 'square');
}
/* the steady voices, gliding to a score's levels (or to silence) */
function steady(V) {
  if (!ctx) return; const t = ctx.currentTime;
  humG.gain.setTargetAtTime(V ? V.hum.gain : 0, t, 0.15); if (V) hum.frequency.setTargetAtTime(V.hum.hz, t, 0.3);
  hissG.gain.setTargetAtTime(V ? V.hiss.gain : 0, t, 0.15);
}
function pump() {
  if (!cur) return;
  const c = cur;
  /* audio that began after the score did (a resume that took a moment): the score moves onto the audio clock */
  if (!c.audio && audioOn()) { c.t0 += ctx.currentTime - pageNow(); c.audio = true; }
  const T = clockOf(c), sound0 = c.audio;
  for (;;) {
    const S = c.score, ev = S.events[c.i];
    if (!ev) { if (!c.loop) { if (T > c.t0 + S.seconds) stop(); return; } c.t0 += S.seconds; c.i = 0; c.lap++; if (c.t0 + S.seconds < T) c.t0 = T; continue; }
    const at = c.t0 + ev.t; if (at > T + AHEAD) return;
    c.i++;
    if (at < T - 0.05) continue;   /* too late to play (the page was busy): skip, do not pile up */
    if (sound0) sound(ev, at, S.voices);
    const ms = Math.max(0, (at - T) * 1000);
    setTimeout(() => { if (cur !== c) return; if (ev.v === 'wrong' && buzz) { try { navigator.vibrate && navigator.vibrate(30); } catch (x) { /* not allowed */ } } c.onEvent && c.onEvent(ev, c.lap); }, ms);
  }
}
/* Play a score (from src/engines/listen.js's score()); loop it unless loop is false. Called from a tap. Returns
   whether sound is heard (false: the events still come, silently) */
export function start(score, { onEvent, onStop, loop = true, tag = null } = {}) {
  stop();
  const heard = make();
  if (heard && !audioOn()) { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* stays silent */ } }
  cur = { score, onEvent, onStop, loop, tag, i: 0, lap: 0, audio: audioOn() }; cur.t0 = clockOf(cur) + 0.05;
  steady(score.voices); timer = setInterval(pump, EVERY); pump();
  return audioOn();
}
/* change what is played without a gap (a new clip of the ear test): from the next moment */
export function swap(score) { if (!cur) return; cur.score = score; cur.i = 0; cur.lap = 0; cur.t0 = clockOf(cur) + 0.05; steady(score.voices); }
export function stop() {
  clearInterval(timer); timer = 0; const c = cur; cur = null; steady(null);
  if (c && c.onStop) c.onStop();
}
export const playing = () => !!cur;
/* who started what is playing (a tag given to start), and the voices of the score playing now */
export const current = () => (cur ? cur.tag : null);
export const voices = () => (cur ? cur.score.voices : null);
/* is audio running now (it may wait for a tap, or be missing) */
export const heard = audioOn;
export const setBuzz = on => { buzz = !!on; };
export const canBuzz = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
