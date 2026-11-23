/* The styles are split by view (src/styles/), as the words are by area: the first page loads only base.css (the
   palette, the type, the bar and what every screen shares: the stage, loading, the toast, Break it) and hold.css,
   from index.html. Every other view's sheet loads the first time the view opens, before it draws: needStyles(name, …)
   adds each once and resolves when all are in (the shell awaits it with the view's glue, src/v2/app.js; the labs with
   the labs, src/v2/play.js).

   ORDER is the order the sheets stand in the document, whatever order they load in, so the cascade is the same on every
   path through the site: a sheet is put before the first one already in that comes after it. A lab's own sheet
   (labs/<name>, src/data/labs/) stands with the labs'. A new view's sheet gets its place here first. */
export const ORDER = ['base', 'frame', 'island', 'studio', 'flat', 'supply', 'pages', 'stations', 'labs', 'blueprint', 'hold'];
const rank = name => { const i = ORDER.indexOf(name.startsWith('labs/') ? 'labs' : name); return i < 0 ? ORDER.length : i + (name.startsWith('labs/') ? 0.5 : 0); };
const asked = {};
export const href = name => 'src/styles/' + name + '.css';
export function needStyles(...names) {
  return Promise.all(names.map(n => asked[n] || (asked[n] = new Promise(done => {
    if (typeof document === 'undefined' || document.querySelector('link[data-css="' + n + '"]')) { done(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href(n); l.dataset.css = n;
    l.onload = () => done();
    l.onerror = () => { console.error('Styles missing for', n); done(); };
    const after = [...document.querySelectorAll('link[data-css]')].find(x => rank(x.dataset.css) > rank(n));
    document.head.insertBefore(l, after || null);
  }))));
}
