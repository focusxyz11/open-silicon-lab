/* Lab: TOPIC_TITLE. One simulation: a knob, a chart and a readout. Replace the model with yours.
   The site calls init(section) once, after this topic's content is on the page. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';

export function init(section) {
  const cv = $('#PFXCv'); if (!cv) return;
  const knob = $('#PFXK');
  knob.addEventListener('input', update);

  /* The model: keep it small and pure. Move it to src/engines/ with a test once it grows. */
  const model = k => ({ value: k * k / 100 });

  let r = null;
  function update() {
    const k = +knob.value; r = model(k);
    $('#PFXKO').textContent = k + '%';
    $('#PFXOut').textContent = r.value.toFixed(1);
    $('#PFXTag').textContent = r.value > 50 ? 'High' : 'Low';
    draw();
  }
  function draw() {
    if (!r) return;
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    const bw = (w - 40) * Math.min(1, r.value / 100);
    c.fillStyle = rgba(T.amber, 0.8); c.fillRect(20, h / 2 - 16, bw, 32);
    c.fillStyle = T.ink; c.font = '12px IBM Plex Mono, monospace'; c.fillText(r.value.toFixed(1), 24 + bw, h / 2 + 4);
  }
  watch(cv, draw);   /* redraws on resize and when the theme changes */
  update();
}
