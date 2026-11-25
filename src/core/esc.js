/* The one escape for text put into HTML: & < > " ' become entities, and nothing (null or undefined) becomes empty.
   No imports, so any page can load it, the first one too. */
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
