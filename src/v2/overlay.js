/* Words over a flat picture, in HTML, as over the 3D views (docs/reviews/art-direction.md §2): the names of the parts,
   the note on the part you picked (beside its name, no line drawn to it), the questions' marks (only under Ask) and
   four corner marks on the way deeper. The flat world (src/app/world.js) hands it screen positions each frame; nothing
   here is written into the canvas. Names show a moment after the picture comes to rest and hide while it moves.

   createOverlay(host, on): on.part(key), on.mark(threadId), on.marks([threadId]), on.door().
   draw({ labels: [{ key, text, x, y, align, on }], note: { key, title, text, x, y } | null,
          marks: [{ part, x, y, threads: [{ id, color }] }], avoid: [[x, y, w, h]] (names drawn by someone else),
          door: [x, y, side] | null, doorWord, moving }) */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createOverlay(host, on) {
  const names = new Map(), marks = new Map();
  /* the note and the way deeper are made the first time they are needed (the 3D switch uses only the marks) */
  let card = null, door = null, cardKey = null, doorWord = '';
  const makeCard = () => { card = document.createElement('div'); card.className = 'swnote'; card.hidden = true; host.appendChild(card); };
  const makeDoor = () => { door = document.createElement('button'); door.type = 'button'; door.className = 'door4'; door.hidden = true; door.innerHTML = '<i></i><i></i><i></i><i></i>'; host.appendChild(door); };
  host.addEventListener('click', e => {
    if (e.target.closest('.door4')) { e.stopPropagation(); on.door && on.door(); return; }
    const n = e.target.closest('[data-fpart]'); if (n) { e.stopPropagation(); on.part && on.part(n.dataset.fpart); return; }
    const m = e.target.closest('[data-fq]'); if (m) { e.stopPropagation(); const ths = m.dataset.fq.split(' '); if (ths.length > 1) on.marks && on.marks(ths); else on.mark && on.mark(ths[0]); }
  });

  /* keep one element per key; make the new, drop the gone */
  function sync(map, list, keyOf, make) {
    const keep = new Set(list.map(keyOf));
    map.forEach((el, k) => { if (!keep.has(k)) { el.remove(); map.delete(k); } });
    list.forEach(it => { const k = keyOf(it); if (!map.has(k)) { const el = make(it); host.appendChild(el); map.set(k, el); } });
  }

  function placeLabels(list) {
    sync(names, list, it => it.key, it => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lbl3 part3 pick flat'; /* i18n-ok: class names */ b.dataset.fpart = it.key; return b; });
    list.forEach(it => {
      const el = names.get(it.key);
      if (el.textContent !== it.text) { el.textContent = it.text; el._w = 0; }
      if (!el._w) el._w = el.offsetWidth || 80;
      el.classList.toggle('on', !!it.on);
      /* where the name stood when it was drawn: x is its start, middle or end, y its baseline */
      const w = el._w, x = it.align === 'center' ? it.x - w / 2 : it.align === 'right' ? it.x - w + 9 : it.x - 9, y = it.y - 16;
      el._r = [x, y, w, 22];
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    });
  }

  function placeNote(n, W, H) {
    if (!n) { if (card) card.hidden = true; cardKey = null; return; }
    if (!card) makeCard();
    if (cardKey !== n.key) { card.innerHTML = '<b>' + esc(n.title) + '</b><span>' + esc(n.text) + '</span>'; cardKey = n.key; }
    card.hidden = false;
    const lb = names.get(n.key), cw = card.offsetWidth, chh = card.offsetHeight;
    /* beside the part's name, on the side with more room, touching it; else beside the part */
    const r = lb && lb._r ? lb._r : [n.x - 4, n.y - 4, 8, 8], right = r[0] + r[2] / 2 < W / 2;
    let x = right ? r[0] + r[2] + 8 : r[0] - cw - 8, y = r[1] + r[3] / 2 - chh / 2;
    x = clamp(x, 8, W - cw - 8); y = clamp(y, 8, H - chh - 8);
    card.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
  }

  /* one mark per question, side by side over its part; more than three on one part become one mark with a count */
  function placeMarks(list, avoid) {
    const items = [];
    list.forEach(m => {
      if (m.threads.length > 3) { items.push({ key: m.part + ':all', x: m.x, y: m.y, ths: m.threads.map(x => x.id), color: m.threads[0].color, text: String(m.threads.length) }); return; }
      m.threads.forEach((th, i) => items.push({ key: m.part + ':' + th.id, x: m.x + (i - (m.threads.length - 1) / 2) * 30, y: m.y, ths: [th.id], color: th.color, text: '?' }));
    });
    sync(marks, items, it => it.key, it => { const b = document.createElement('button'); b.type = 'button'; b.className = 'lbl3 q3 flat'; return b; });
    /* a mark never covers a name or another mark: it steps down, or up, until it is clear */
    const taken = [...names.values()].map(el => el._r).filter(Boolean).concat(avoid || []), hit = (x, y) => taken.some(r => x + 15 > r[0] && x - 15 < r[0] + r[2] && y > r[1] - 2 && y - 28 < r[1] + r[3] + 2);
    items.forEach(it => { for (const d of [0, 30, -30, 60, -60, 90]) if (!hit(it.x, it.y + d)) { it.y += d; break; } taken.push([it.x - 13, it.y - 26, 26, 26]); });
    items.forEach(it => {
      const el = marks.get(it.key);
      el.dataset.fq = it.ths.join(' '); el.textContent = it.text; el.style.setProperty('--qc', it.color);
      el.style.transform = 'translate(' + it.x.toFixed(1) + 'px,' + it.y.toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  return {
    draw(o) {
      const W = host.clientWidth || 1, H = host.clientHeight || 1;
      host.classList.toggle('moving', !!o.moving);
      placeLabels(o.moving ? [] : o.labels || []);
      placeNote(o.moving ? null : o.note, W, H);
      placeMarks(o.moving ? [] : o.marks || [], o.avoid);
      const d = o.door;
      if (d && !door) makeDoor();
      if (door) door.hidden = !d;
      if (d) {
        if (doorWord !== o.doorWord) { doorWord = o.doorWord || ''; door.setAttribute('aria-label', doorWord); door.title = doorWord; }
        const g = 6, s = Math.max(d[2], 16);
        door.style.transform = 'translate(' + (d[0] + d[2] / 2 - s / 2 - g).toFixed(1) + 'px,' + (d[1] + d[2] / 2 - s / 2 - g).toFixed(1) + 'px)';
        door.style.width = door.style.height = (s + 2 * g).toFixed(0) + 'px';
      }
    },
    clear() { names.forEach(el => el.remove()); names.clear(); marks.forEach(el => el.remove()); marks.clear(); if (card) card.hidden = true; cardKey = null; if (door) door.hidden = true; }
  };
}
