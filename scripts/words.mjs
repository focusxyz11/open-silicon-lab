/* Every word of a language, for node: the tests, the open port (scripts/mcp.mjs) and the checks read all the area
   files of src/i18n/<lang>/ merged into one set (the site loads them area by area: src/core/i18n.js). */
import { readFileSync, readdirSync } from 'node:fs';

const dirOf = lang => new URL('../src/i18n/' + lang + '/', import.meta.url);
/* the area files of a language: { area: { name: text } } */
export function readAreas(lang = 'en') {
  const dir = dirOf(lang);
  return Object.fromEntries(readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => [f.slice(0, -5), JSON.parse(readFileSync(new URL(f, dir), 'utf8'))]));
}
/* every word of a language in one set */
export const readWords = (lang = 'en') => Object.assign({}, ...Object.values(readAreas(lang)));
