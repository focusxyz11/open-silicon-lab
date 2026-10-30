// Finds words meant for readers that are written inside code instead of src/i18n/<lang>.json.
// Used by tests/i18n.test.mjs; run it directly to see every hit:  node scripts/i18n-check.mjs src/app/*.js
//
// It looks at string literals and reports the ones that read like English (several words, a capital
// letter, sentence punctuation). Markup, CSS, ids and text names ("hub.try") are ignored. A line
// that must keep English (for example, a message shown when the texts themselves failed to load)
// can say so with a comment containing "i18n-ok".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* Blank out comments but keep line numbers. */
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"\\])\/\/[^\n]*/g, (m, p) => p);

/* Does this piece of a string read like English meant for a person? */
function reads(raw) {
  let s = raw;
  if (/&amp;|\\u|^\s*$/.test(s)) return null;
  s = s.replace(/\$\{[^}]*\}/g, ' ')                 // template holes
    .replace(/<\/?[a-zA-Z][^>]*>?/g, ' ')            // tags, even half-written ones
    .replace(/[\w-]+=("[^"]*"?|'[^']*'?)?/g, ' ')    // attributes
    .replace(/^[^<]*>/, ' ')                         // the end of a tag begun in an earlier literal
    .replace(/--[\w-]+:?[^;]*;?/g, ' ')              // CSS variables
    .replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (/^[a-z][\w-]*(\.[\w-]+)+\.?$/.test(s)) return null;              // a text name such as hub.better.
  if (/^(https?:|#|\.|\/|var\(|M[\d.]|[\w-]+\()/.test(s)) return null;    // urls, selectors, paths, CSS, SVG
  if (!/\s/.test(s) && /[\/,]/.test(s)) return null;                       // a path or a selector list
  if (/^\((prefers|min|max|hover|pointer)[\w-]*:/.test(s)) return null;    // a media query
  if (/^(\d{3} )?\d+(\.\d+)?px ["A-Z]/.test(s)) return null;                 // a canvas font
  if (/^(Escape|Enter|Tab|Space|Backspace|Arrow(Left|Right|Up|Down)|Home|End)$/.test(s)) return null;   // key names
  if (/^[a-z][\w-]*$/.test(s)) return null;                                // one lowercase identifier, e.g. zoom-rack-to-atom
  const words = s.match(/[A-Za-z][a-z’']+/g) || [];
  const yes = (words.length >= 2 && (/[A-Z][a-z]+[\s,]/.test(s) || /[a-z][.,?!:;]\s/.test(s) || /[a-z][.?!]$/.test(s) || words.length >= 4)) || /^[A-Z][a-z]{2,}( [a-z]+)*$/.test(s);
  /* All-lowercase words are usually class names; four or more are a sentence. */
  return yes && (words.length >= 4 || !/^[a-z0-9 _.-]+$/.test(s)) ? s.slice(0, 80) : null;
}

export function englishIn(source) {
  const out = [], raw = source.split('\n'), code = stripComments(source);
  const lineAt = i => code.slice(0, i).split('\n').length;
  const okLine = n => /i18n-ok|console\.(log|warn|error)/.test(raw[n - 1] || '');
  /* Template literals can span lines: read each piece between ${…} holes as its own string. */
  for (const m of code.matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
    let pos = m.index + 1;
    for (const part of m[1].split(/\$\{[^}]*\}/)) {
      const at = code.indexOf(part, pos); const n = lineAt(at < 0 ? m.index : at); pos = at < 0 ? pos : at + part.length;
      for (const chunk of part.split(/(?<=>)|(?=<)/)) { const r = reads(chunk); if (r && !okLine(n)) out.push([n, r]); }
    }
  }
  const noTpl = code.replace(/`(?:[^`\\]|\\.)*`/g, m => m.replace(/[^\n]/g, ' '));
  noTpl.split('\n').forEach((line, i) => {
    if (okLine(i + 1)) return;
    for (const m of line.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) { const r = reads(m[1] ?? m[2] ?? ''); if (r) out.push([i + 1, r]); }
  });
  return out.sort((a, b) => a[0] - b[0]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let n = 0;
  for (const f of process.argv.slice(2)) for (const [line, s] of englishIn(readFileSync(f, 'utf8'))) { n++; console.log(f + ':' + line + '  ' + s); }
  console.log(n + ' hit' + (n === 1 ? '' : 's'));
}
