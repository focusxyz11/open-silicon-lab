/* Topics load on demand. At start-up the site knows only the catalog (what each topic holds);
   the first time a topic is opened, its page, styles and simulations are fetched and started.
   Each topic loads once and stays on the page, so coming back is instant.

   ensureTopic(id) resolves to that topic's lab modules by name, e.g. mods['riscv-lab']. */
import { TOPIC_FILES, LOADERS } from '../generated/catalog.js';
import { prepareTopic } from './learning.js';

const REF = ['glossary', 'sources'];
const loading = new Map();

export const isReference = id => REF.includes(id);
export const isLoaded = id => loading.has(id);

/* Content may be inlined by the single-file build; otherwise fetch it. */
export async function text(path) {
  const inline = window.__OSL_CONTENT__;
  if (inline && inline[path] !== undefined) return inline[path];
  const r = await fetch(path);
  if (!r.ok) throw new Error('Could not load ' + path + ' (' + r.status + ')');
  return r.text();
}

function loadStyle(href) {
  if (window.__OSL_INLINE_STYLES__ || document.querySelector('link[data-topic-style="' + href + '"]')) return Promise.resolve();
  return new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.topicStyle = href; l.onload = l.onerror = () => res(); document.head.appendChild(l); });
}

async function load(id) {
  const ref = isReference(id), meta = TOPIC_FILES[id];
  if (!ref && !meta) throw new Error('Unknown topic: ' + id);
  const [html] = await Promise.all([
    text(ref ? 'content/' + id + '.html' : 'topics/' + id + '/content.html'),
    meta && meta.style ? loadStyle('topics/' + id + '/style.css') : null
  ]);
  const holder = document.createElement('div'); holder.innerHTML = html.trim();
  const sec = holder.firstElementChild; sec.hidden = true;
  const lib = document.getElementById('library'), foot = document.getElementById('topicFoot');
  lib.insertBefore(sec, foot);
  /* Every simulation panel gets a stable anchor: lab-<topic>-<n>, in page order. */
  sec.querySelectorAll('.lab').forEach((l, i) => { if (!l.id) l.id = 'lab-' + id + '-' + (i + 1); });
  const mods = {};
  if (meta && meta.modules.length) {
    let loaded = [];
    try { loaded = await LOADERS[id](); } catch (e) { console.error('Could not load the simulations of', id, e); }
    loaded.forEach((m, i) => {
      const name = meta.modules[i]; mods[name] = m;
      /* One failing simulation never stops the others. */
      try { if (m && typeof m.init === 'function') m.init(sec); } catch (e) { console.error('Lab failed to start:', id + '/' + name, e); }
    });
  }
  prepareTopic(id, sec);
  document.dispatchEvent(new CustomEvent('osl:topic-loaded', { detail: { id } }));
  return mods;
}

export function ensureTopic(id) {
  if (!loading.has(id)) loading.set(id, load(id).catch(e => { loading.delete(id); throw e; }));
  return loading.get(id);
}
