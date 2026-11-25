/* The small part of Markdown the content documents use (content/*.md): headings, paragraphs, bold and italics,
   code, links, images, quotes, tables and lists. One renderer for the site's world pages and for the reader in
   content/index.html, so a document reads the same everywhere. And a parser that splits a world's document into
   its sections, so a page can lay them out (src/v2/worlds.js). The documents are the one home of their words. */
import { esc } from '../core/esc.js';
/* inline Markdown. link(href) may rewrite a link (a document name becomes a page); img(src) a picture's path */
export function inline(s, o = {}) {
  const link = o.link || (h => h), img = o.img || (h => h);
  return esc(s).split(/(`[^`]+`)/).map((part, i) => i % 2 ? '<code>' + part.slice(1, -1) + '</code>' : part
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => '<img src="' + img(src) + '" alt="' + alt + '">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => '<a href="' + link(href) + '"' + (/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')).join('');
}
/* the cells of a table row: | a | b | */
export const cells = row => row.slice(1, row.lastIndexOf('|')).split('|').map(c => c.trim());
/* a table's rows (header and the line under it dropped) */
export const tableRows = text => { const L = text.split('\n').filter(l => l.startsWith('|')); return L.slice(2).map(cells); };

/* blocks of Markdown into HTML */
export function render(md, o = {}) {
  const lines = md.replace(/\r/g, '').split('\n'), out = []; let i = 0;
  const il = s => inline(s, o);
  while (i < lines.length) {
    const L = lines[i];
    if (!L.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{1,3}) (.*)$/.exec(L))) { out.push('<h' + m[1].length + '>' + il(m[2]) + '</h' + m[1].length + '>'); i++; continue; }
    if (L.startsWith('|')) { const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      out.push('<div class="tw"><table><thead><tr>' + cells(rows[0]).map(c => '<th>' + il(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.slice(2).map(r => '<tr>' + cells(r).map(c => '<td>' + il(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>'); continue; }
    if (L.startsWith('>')) { const q = []; while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, '')); out.push('<blockquote><p>' + il(q.join(' ')) + '</p></blockquote>'); continue; }
    if (/^(- |\d+\. )/.test(L)) { const ol = /^\d/.test(L), items = [];
      while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || /^ {2,}\S/.test(lines[i]))) { if (/^ {2,}/.test(lines[i])) items[items.length - 1] += ' ' + lines[i].trim(); else items.push(lines[i].replace(/^(- |\d+\. )/, '')); i++; }
      out.push((ol ? '<ol>' : '<ul>') + items.map(x => '<li>' + il(x) + '</li>').join('') + (ol ? '</ol>' : '</ul>')); continue; }
    const para = []; while (i < lines.length && lines[i].trim() && !/^(#{1,3} |\||>|- |\d+\. )/.test(lines[i])) para.push(lines[i++]);
    out.push('<p>' + il(para.join(' ')) + '</p>');
  }
  return out.join('\n');
}

/* A world's document, in parts. Every world has the same sections (content/README.md, "The shape of one world").
   Returns { title, behind, sections: { key: { head, body } }, truths: [{ n, title, text }], questions: [[q, notice]],
   challenges: [[name, change, judge]], lens: name, engine: name }. */
const KEYS = [['open', 'Why it is open'], ['true', 'What is true'], ['lens', 'The visual system'], ['engine', 'The engine'], ['inside', 'Questions inside'], ['challenges', 'Challenges'],   // i18n-ok: the documents' own section headings, matched, never shown
  ['direction', 'Innovation direction'], ['community', 'Community topic'], ['cases', 'Real cases'], ['meets', 'Where it meets other questions'], ['earlier', 'From earlier work']];   // i18n-ok: the documents' own section headings, matched, never shown
export function parseWorld(md) {
  const text = md.replace(/\r/g, ''), parts = text.split(/\n## /), head = parts.shift();
  const title = (/^# (.+)$/m.exec(head) || [])[1] || '', behind = head.split('\n').filter(l => l.startsWith('>')).map(l => l.replace(/^>\s?/, '')).join(' ').replace(/^\*\*[^*]+\*\*\s*/, '').trim();
  const sections = {};
  for (const p of parts) {
    const nl = p.indexOf('\n'), h = p.slice(0, nl).trim(), body = p.slice(nl + 1).trim(), k = KEYS.find(([, s]) => h.startsWith(s));
    if (k) sections[k[0]] = { head: h, body, name: h.includes(':') ? h.slice(h.indexOf(':') + 1).trim() : '' };
  }
  const truths = sections.true ? sections.true.body.split(/\n\n(?=\*\*\d+\. )/).map(b => /^\*\*(\d+)\. ([^*]+)\*\*\s*([\s\S]*)$/.exec(b.trim())).filter(Boolean).map(m => ({ n: +m[1], title: m[2].trim(), text: m[3].trim().replace(/\s*\n\s*/g, ' ') })) : [];
  return { title, behind, sections, truths,
    questions: sections.inside ? tableRows(sections.inside.body) : [],
    challenges: sections.challenges ? tableRows(sections.challenges.body) : [],
    lens: sections.lens ? sections.lens.name : '', engine: sections.engine ? sections.engine.name : '' };
}
