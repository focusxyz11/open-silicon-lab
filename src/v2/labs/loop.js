/* One animation loop at a time on a lab's card (#373). loop(el, step, end) gives { start, on }: start() begins a
   requestAnimationFrame loop unless one already runs (a second tap, a second Run, starts no second loop); each frame
   calls step(now, dt), dt the real time since the last frame, capped at a second so a slow screen never jumps; the loop
   goes on while step returns true, and stops when the card leaves the page (end() is called then, to tidy the view).
   el.dataset.loops counts the loops running on the card, read by the browser smoke test. */
export function loop(el, step, end) {
  let on = false, last = null;
  const count = d => { el.dataset.loops = String(Math.max(0, (+el.dataset.loops || 0) + d)); };
  const stop = () => { if (!on) return; on = false; count(-1); };
  const tick = now => {
    if (!on) return;
    if (!el.isConnected) { stop(); if (end) end(); return; }
    const dt = Math.min(1000, now - (last == null ? now : last)); last = now;
    if (step(now, dt)) requestAnimationFrame(tick); else stop();
  };
  return {
    start() { if (on) return false; on = true; last = null; count(1); requestAnimationFrame(tick); return true; },
    get on() { return on; }
  };
}
