/* Frame 2 (#271; part 1 is #272): one frame, three modes, and one rule: whatever you are working on gets the stage.
   Behind ?frame=2, as ?menu=1 is for the menu (?frame=2 turns it on for this browser, ?frame=1 off again), so the
   two frames can be compared on the live site; without the flag nothing here runs and today's frame
   (src/v2/frame.js) is as it was. It wears the frame's own elements in a new way, so the views and the labs need
   not know:
   - the caption (Look): the card on the picture, bottom left: the place and the size, the level's name, one
     sentence, its question, the level's search (src/data/seek.js), and Read more and Do. The rest of the card (the
     rest of the words, what is here, the ways around) waits under Read more, in the side panel. On a phone the
     caption is the sheet: at rest the level's name and the whole question, a tap opens it.
   - the side panel (Do, Ask, Read more): the card at the right, full height, its width growing with the screen.
   - the stage (Do, with a lab that declares its instrument): the lab's instrument takes the picture area and its
     goal stands across the top of it as meters; the controls stay in the side panel; the place behind is hidden,
     and a small "where you are" where the address was leads back to Look. A lab declares the two in its own HTML,
     data-f2="instrument" and data-f2="goal" (docs/LABS.md, "Do mode"); its logic is untouched, and a challenge
     that declares nothing is played in the side panel beside the picture.
   ON: is the flag on. boot(): the class on <html> (every rule of src/styles/frame2.css hangs from it) and the
   stylesheet. attach(host, api, o, x): one frame (createFrame) worn the new way; o.caption: the view's card is a
   level's (the dive and the flights), so Look is a caption; x: { wrap, items, at(), here(), doList() } from the frame. */
import { t } from '../core/i18n.js';

export const ON = (() => { try { const q = new URLSearchParams(location.search).get('frame'); if (q === '1' || q === '2') localStorage.setItem('osl-frame', q); return localStorage.getItem('osl-frame') === '2'; } catch (e) { return false; } })();

let booted = false;
export function boot() {
  if (!ON || booted) return; booted = true;
  document.documentElement.classList.add('frame2');
  /* the question is set in Besley's italic, which today's frame does not load */
  for (const href of ['https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;1,400&display=swap', 'src/styles/frame2.css']) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* the first sentence of a card's words, and the rest */
const firstSentence = s => { const m = /^([\s\S]+?[.?!])\s+(?=[A-Z0-9“‘\x22\x27(])/.exec(s); return m ? [m[1], s.slice(m[0].length)] : [s, '']; };
const phone = () => matchMedia('(max-width: 720px)').matches;

export function attach(host, api, o, x) {
  boot();
  const dock = api.dock, wrap = x.wrap, me = {};
  /* a view makes its frame anew in the same host each time it is shown: only the newest wears it */
  host.f2now = me; const now = () => host.f2now === me;
  let open = false;
  /* where you are, while a lab has the stage: the level on the way down, lit; a tap goes back to Look */
  const where = document.createElement('button'); where.type = 'button'; where.className = 'f2where'; where.hidden = true; host.appendChild(where);
  where.addEventListener('click', () => { open = false; api.look(); });
  let whereKey = '';
  const drawWhere = () => {
    const h = x.here(), at = x.at(), key = at + '|' + (h ? h.label : ''); if (key === whereKey) return; whereKey = key;
    where.innerHTML = '<span class="f2wa" aria-hidden="true">↑</span><span class="f2wt"><span class="f2wk">' + esc(t('frame2.where')) + '</span><b>' + esc(h ? h.label : '') + '</b>' + (h && h.size ? '<span class="f2fig">' + esc(h.size) + '</span>' : '') + '</span>' +
      (x.items.length > 1 ? '<span class="f2wl" aria-hidden="true">' + x.items.map(i => '<i' + (i.id === at ? ' class="on"' : '') + '></i>').join('') + '</span>' : '');
    where.setAttribute('aria-label', t('frame2.whereBack', { level: h ? h.label : '' }));
  };

  /* a level's card made a caption: its name and size first, one sentence, the question, the search, Read more and
     Do; the rest of the card is kept, under Read more. Done once each time the view writes its card */
  const caption = () => {
    if (dock.querySelector(':scope > .f2head')) return;
    const line = dock.querySelector(':scope > .line'), k = dock.firstElementChild; if (!line || !k) return;
    const h = x.here(), place = o.path && o.path[1] ? o.path[1].label : '';
    const head = document.createElement('div'); head.className = 'f2head';
    const size = h && h.size ? esc(t('frame2.across', { size: '\u0001' })).replace('\u0001', '<span class="f2fig">' + esc(h.size) + '</span>') : '';
    head.innerHTML = '<p class="f2k"><span>' + esc(place) + (size ? ' · ' + size : '') + '</span></p><h2 class="f2t">' + esc(h ? h.label : k.textContent) + '</h2>';
    k.classList.add('f2was'); k.after(head);
    const [one, rest] = firstSentence(line.textContent.trim());
    if (rest) { line.textContent = ''; const a = document.createElement('span'); a.className = 'f2s1'; a.textContent = one; const b = document.createElement('span'); b.className = 'f2rest'; b.textContent = ' ' + rest; line.append(a, b); }
    const more = document.createElement('div'); more.className = 'f2more';
    [...dock.children].filter(n => n !== k && n !== head && n !== line && !n.matches('.askline, .seek')).forEach(n => more.appendChild(n));
    const ds = x.doList(), c = ds.length === 1 ? ds[0] : null;
    const acts = document.createElement('div'); acts.className = 'f2acts';
    acts.innerHTML = '<button type="button" class="btn f2open" data-f2open>' + esc(t('frame2.more')) + '</button><button type="button" class="btn f2close" data-f2close>' + esc(t('frame2.less')) + '</button>' +
      (c ? '<a class="btn f2do" href="' + esc(c.href || '#/do/' + c.id) + '">' + esc(t('frame2.doOne', { what: c.title })) + '</a>' : ds.length ? '<button type="button" class="btn f2do" data-mode="do">' + esc(t('frame2.doN', { n: ds.length })) + '</button>' : '');
    dock.append(acts, more);
  };

  /* the mode, read from what the card holds: a lab with an instrument has the stage; any other challenge, a question
     followed, Do and Ask, and Read more are the side panel; a level's card at rest is the caption */
  const update = () => {
    if (!now()) return;
    const player = dock.querySelector('.player'), inst = !!(player && player.querySelector('[data-f2="instrument"]'));
    const look = !!o.caption && api.mode() === 'look' && !player && !dock.querySelector('.stopx');
    if (look) caption();
    const cap = look && !open && !!dock.querySelector(':scope > .f2head'), on = !!o.caption || inst;
    host.classList.toggle('f2', on); host.classList.toggle('f2cap', on && cap); host.classList.toggle('f2side', on && !cap); host.classList.toggle('f2stage', inst);
    host.classList.toggle('f2open', look && open);
    where.hidden = !inst; if (inst) drawWhere();
    const els = inst ? [player.querySelector('[data-f2="goal"]'), player.querySelector('[data-f2="instrument"]')].filter(Boolean) : cap ? [wrap] : [];
    if (ro && (els.length !== watched.length || els.some((e, i) => e !== watched[i]))) { ro.disconnect(); els.forEach(e => ro.observe(e)); watched = els; }
    measure();
  };
  /* a caption tall enough to reach the levels at the side stands a little to the right, and the levels beside it
     show their dots alone, so neither covers the other */
  const tight = () => { const rl = host.querySelector(':scope > .rail2'), on = host.classList.contains('f2cap') && !!rl && !phone(), top = on ? wrap.getBoundingClientRect().top : 0;
    let any = false; if (rl) rl.querySelectorAll('li').forEach(li => { const u = on && li.getBoundingClientRect().bottom + 8 > top; li.classList.toggle('f2under', u); any = any || u; });
    host.classList.toggle('f2tight', any); };
  /* the stage's rows: the goal's height, and on a phone where the sheet begins, under the instrument */
  const measure = () => {
    if (!now()) return;
    tight();
    const player = dock.querySelector('.player'), g = player && player.querySelector('[data-f2="goal"]'), i = player && player.querySelector('[data-f2="instrument"]'); if (!i) return;
    const gh = g ? Math.round(g.getBoundingClientRect().height) : 0;
    host.style.setProperty('--f2-goalh', gh + 'px');
    /* a drawing made for the card, now the size of the stage: its words keep their size on the screen */
    const sv = i.querySelector('svg[viewBox]'), vb = sv && sv.viewBox.baseVal, r = sv && sv.getBoundingClientRect();
    if (vb && vb.width && r.width && r.height) host.style.setProperty('--f2-k', (1 / Math.min(r.width / vb.width, r.height / vb.height)).toFixed(4));
    if (phone()) host.style.setProperty('--f2-sheet', Math.round(i.getBoundingClientRect().bottom + 10) + 'px');
  };
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  let watched = [];
  new MutationObserver(update).observe(dock, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', () => { if (!host.hidden) update(); });
  host.addEventListener('click', e => {
    if (!now()) return;
    if (e.target.closest('[data-f2open]')) { open = true; update(); wrap.scrollTop = 0; return; }
    if (e.target.closest('[data-f2close]')) { open = false; update(); return; }
    if (e.target.closest('[data-mode]')) { open = false; update(); }
  });
  update();
}
