/* A story that drives a scene. One step at a time, docked below the picture: each step moves the camera, lights
   a part and sets what the parts show. Its words are wired both ways: [[part|words]] lights that part when touched
   and the part brings its step back when tapped; [[#name]] is a live number you drag, and the scene and the words
   answer at once. A step may ask for a prediction before the number can be moved.
   A story is data: { text(key, vars), steps: [{ id, scene(state) -> what the scene shows, live, predict, ask, end }], state }. */
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* the step's words, with its parts and live numbers made touchable */
export function markup(text, live) {
  return esc(text).replace(/\[\[(#?)([a-z]+)(?:\|([^\]]*))?\]\]/g, (_, hash, id, words) => hash
    ? '<span class="live" role="slider" tabindex="0" data-live="' + id + '" aria-valuenow="' + esc(live[id].index) + '" aria-valuemin="0" aria-valuemax="' + (live[id].values.length - 1) + '" aria-label="' + esc(live[id].label) + '" aria-valuetext="' + esc(live[id].text) + '">' + esc(live[id].text) + '</span>'
    : '<button type="button" class="pw" data-part="' + id + '">' + words + '</button>');
}

export function createStory(dock, scene, story, on = {}) {
  let at = 0, drag = null;
  const S = story.state;
  const step = () => story.steps[at];
  function draw() {
    const st = step(), live = story.live(S), v = st.scene(S);
    scene.set(v);
    const predicted = !st.predict || S.guess != null;
    let h = '<div class="prog" role="tablist">' + story.steps.map((x, i) => '<button type="button" role="tab" data-go="' + i + '" aria-selected="' + (i === at) + '" aria-label="' + esc(t('story.stepN', { n: i + 1, total: story.steps.length })) + '"></button>').join('') + '</div>';
    h += '<p class="line">' + markup(story.text(st.id, story.vars(S)), live) + '</p>';
    if (st.predict && S.guess == null) h += '<div class="opts">' + st.predict.map(o => '<button type="button" class="opt" data-guess="' + o + '">' + esc(story.text(st.id + '.' + o)) + '</button>').join('') + '</div>';
    if (st.predict && S.guess != null) h += '<p class="after ' + (S.guess === st.right ? 'good' : '') + '">' + esc(story.text(st.id + (S.guess === st.right ? '.right' : '.wrong'))) + ' ' + esc(story.text(st.id + '.why', story.vars(S))) + '</p>';
    if (st.ask) h += '<a class="askline" href="' + esc(on.follow(st.ask)) + '"><span class="q">' + esc(t('stop.' + st.ask + '.q')) + '</span></a>';
    h += '<div class="nav">' + (at ? '<button type="button" class="btn ghost" data-key="back" data-go="' + (at - 1) + '">' + esc(t('story.back')) + '</button>' : '<span></span>') +
      (st.end ? st.end.map((e, i) => '<a class="btn' + (i === 0 ? ' primary" data-key="next' : '') + '" href="' + esc(e.href) + '">' + esc(t(e.words)) + '</a>').join('') : '<button type="button" class="btn primary" data-key="next" data-go="' + (at + 1) + '"' + (predicted ? '' : ' disabled') + '>' + esc(t('story.next')) + '</button>') + '</div>';
    dock.innerHTML = h;
    dock.classList.toggle('locked', st.predict && S.guess == null);
    on.step && on.step(st, v);
  }
  const go = i => { at = Math.max(0, Math.min(story.steps.length - 1, i)); draw(); };
  /* a live number: drag sideways, or use the arrow keys, or tap to step on */
  const nudge = (id, d) => { const L = story.live(S)[id]; if (step().predict && S.guess == null) return; S[id] = Math.max(0, Math.min(L.values.length - 1, S[id] + d)); draw(); const n = dock.querySelector('[data-live="' + id + '"]'); if (n && drag) n.classList.add('dragging'); };
  dock.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g && !g.disabled) return go(+g.dataset.go);
    const p = e.target.closest('[data-guess]'); if (p) { S.guess = p.dataset.guess; return draw(); }
  });
  dock.addEventListener('pointerover', e => { const p = e.target.closest('[data-part]'); if (p) scene.set({ lit: p.dataset.part }); });
  dock.addEventListener('pointerout', e => { const p = e.target.closest('[data-part]'); if (p) scene.set({ lit: step().scene(S).lit || null }); });
  dock.addEventListener('pointerdown', e => { const l = e.target.closest('[data-live]'); if (!l) return; e.preventDefault(); drag = { id: l.dataset.live, x: e.clientX, moved: 0 }; dock.setPointerCapture(e.pointerId); });
  dock.addEventListener('pointermove', e => { if (!drag) return; const d = Math.trunc((e.clientX - drag.x) / 28); if (d) { drag.x += d * 28; drag.moved++; nudge(drag.id, d); } });
  /* a tap without a drag steps the number on (the pointer is captured, so the tap is read here, not as a click) */
  dock.addEventListener('pointerup', () => { const d = drag; drag = null; if (d && !d.moved) nudge(d.id, 1); });
  dock.addEventListener('keydown', e => { const l = e.target.closest('[data-live]'); if (l && (e.key === 'ArrowRight' || e.key === 'ArrowUp')) { nudge(l.dataset.live, 1); e.preventDefault(); dock.querySelector('[data-live]').focus(); } if (l && (e.key === 'ArrowLeft' || e.key === 'ArrowDown')) { nudge(l.dataset.live, -1); e.preventDefault(); dock.querySelector('[data-live]').focus(); } });
  draw();
  return {
    go,
    /* a part was tapped in the scene: go to the step it belongs to */
    part(id) { const i = story.steps.findIndex(s => (s.parts || []).includes(id)); if (i >= 0) go(i); },
    get at() { return at; }
  };
}
