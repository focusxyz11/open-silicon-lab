// Builds src/generated/catalog.js from the topics/ folders: what each topic holds (its simulations
// and their titles), every anchor a link can point to, and how to load each topic on demand.
// The site reads this small file at start-up instead of loading every topic.
//
//   npm run catalog            regenerate after adding or changing a topic
//   node scripts/catalog.mjs --check   fail if the committed catalog is out of date (CI does this)
//
// It also checks each topic folder against the contract in topics/README.md and explains any
// problem in plain words, so a contributor (or their AI assistant) knows exactly what to fix.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = 'src/generated/catalog.js';
const REF = ['glossary', 'sources'];          // reference pages in content/, loaded on demand too

const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const q = s => JSON.stringify(s);

/* The simulations in a page, numbered the way the site numbers them: lab-<topic>-<n> in page order,
   unless the panel has its own id. Panels without a title are counted but not listed. */
export function labsIn(html, topic) {
  const out = []; const re = /<([a-z]+)\b[^>]*\bclass="([^"]*)"[^>]*>/g; let m, n = 0;
  while ((m = re.exec(html))) {
    if (!m[2].split(/\s+/).includes('lab')) continue;
    n++; const own = /\bid="([^"]+)"/.exec(m[0]);
    const after = html.slice(m.index, m.index + 4000); const h = /<header>\s*<b>([\s\S]*?)<\/b>/.exec(after);
    out.push({ id: own ? own[1] : 'lab-' + topic + '-' + n, t: h ? decode(h[1].replace(/<[^>]+>/g, '')).trim() : '' });
  }
  return out;
}
export const idsIn = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);

export async function buildCatalog() {
  const { TOPICS } = await import(pathToFileURL(root + 'src/data/topics.js').href);
  const problems = [], files = {}, anchors = {}, loaders = [];
  const known = new Set(TOPICS.map(t => t.id));
  for (const d of existsSync(root + 'topics') ? readdirSync(root + 'topics', { withFileTypes: true }) : []) {
    if (d.isDirectory() && !d.name.startsWith('_') && !known.has(d.name)) problems.push(`topics/${d.name}/ has no entry in src/data/topics.js. Add the topic there, or remove the folder.`);
  }
  const claim = (id, owner) => { if (anchors[id] && anchors[id] !== owner) problems.push(`The id "${id}" is used in both ${anchors[id]} and ${owner}. Ids must be unique across the whole site; rename one of them (and the code that looks it up).`); else anchors[id] = owner; };
  for (const t of TOPICS) {
    const dir = 'topics/' + t.id + '/';
    if (!existsSync(root + dir + 'content.html')) { problems.push(`${dir}content.html is missing. Every topic needs one; copy topics/_template/content.html to start.`); continue; }
    if (!existsSync(root + dir + 'topic.json')) { problems.push(`${dir}topic.json is missing. Copy topics/_template/topic.json and set "id" to "${t.id}".`); continue; }
    let meta; try { meta = JSON.parse(readFileSync(root + dir + 'topic.json', 'utf8')); } catch (e) { problems.push(`${dir}topic.json is not valid JSON: ${e.message}`); continue; }
    if (meta.id !== t.id) problems.push(`${dir}topic.json says "id": ${q(meta.id)}; it must be ${q(t.id)}, the folder name.`);
    const html = readFileSync(root + dir + 'content.html', 'utf8');
    if (!new RegExp('<section id="' + t.id + '"').test(html)) problems.push(`${dir}content.html must start with <section id="${t.id}">.`);
    const onDisk = existsSync(root + dir + 'labs') ? readdirSync(root + dir + 'labs').filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort() : [];
    const listed = Array.isArray(meta.labs) ? meta.labs : [];
    onDisk.filter(n => !listed.includes(n)).forEach(n => problems.push(`${dir}labs/${n}.js exists but is not listed in ${dir}topic.json "labs". Add "${n}" to that list so it starts when the topic opens.`));
    listed.filter(n => !onDisk.includes(n)).forEach(n => problems.push(`${dir}topic.json lists "${n}" but ${dir}labs/${n}.js does not exist.`));
    for (const n of listed.filter(x => onDisk.includes(x))) {
      const src = readFileSync(root + dir + 'labs/' + n + '.js', 'utf8');
      if (!/export\s+(async\s+)?function\s+init\s*\(/.test(src)) problems.push(`${dir}labs/${n}.js must export a function init(). The site calls it once, after the topic's content is on the page.`);
      const bad = [...src.matchAll(/from\s+'(\.\.\/[^']*)'/g)].map(m => m[1]);
      if (bad.length) problems.push(`${dir}labs/${n}.js imports ${bad.join(', ')}. Import shared code as 'osl/core/ui.js', 'osl/engines/…', 'osl/data/…' or 'osl/app/…', and files in the same topic as './…'.`);
    }
    const labs = labsIn(html, t.id);
    labs.forEach(l => claim(l.id, t.id)); idsIn(html).forEach(id => claim(id, t.id));
    files[t.id] = { labs: labs.filter(l => l.t), style: existsSync(root + dir + 'style.css') };
    loaders.push(`  ${q(t.id)}: () => Promise.all([${listed.filter(x => onDisk.includes(x)).map(n => `import('../../${dir}labs/${n}.js')`).join(', ')}])`);
    files[t.id].modules = listed.filter(x => onDisk.includes(x));
  }
  for (const r of REF) { const p = 'content/' + r + '.html'; if (existsSync(root + p)) idsIn(readFileSync(root + p, 'utf8')).forEach(id => claim(id, r)); }
  /* The app shell's own ids (index.html, the map page, the zoom viewer) must not clash with topics. */
  const shell = [readFileSync(root + 'index.html', 'utf8'), readFileSync(root + 'content/zoom.html', 'utf8')].concat(readdirSync(root + 'src/app').filter(f => f.endsWith('.js')).map(f => readFileSync(root + 'src/app/' + f, 'utf8')));
  const shellIds = new Set(shell.flatMap(idsIn)); shellIds.forEach(id => { if (anchors[id]) problems.push(`The id "${id}" is used by the app shell and by ${anchors[id]}. Rename the one in the topic.`); });
  const sortedAnchors = Object.fromEntries(Object.keys(anchors).sort().map(k => [k, anchors[k]]));
  const text = `// Generated by scripts/catalog.mjs from the topics/ folders. Do not edit by hand: run \`npm run catalog\`.\n` +
    `// What each topic holds, every anchor a link can point to, and how to load each topic on demand.\n\n` +
    `/* Per topic: its simulations (anchor id and title), its lab modules in start order, and whether it has its own style.css. */\n` +
    `export const TOPIC_FILES = {\n${Object.entries(files).map(([k, v]) => `  ${q(k)}: ${JSON.stringify(v)}`).join(',\n')}\n};\n\n` +
    `/* Every element id inside a topic or reference page, and where it lives, so #anchor links open the right page. */\n` +
    `export const ANCHORS = {\n${Object.entries(sortedAnchors).map(([k, v]) => `  ${q(k)}: ${q(v)}`).join(',\n')}\n};\n\n` +
    `/* Loading a topic's simulations. Each import is written out so bundlers can see it. */\n` +
    `export const LOADERS = {\n${loaders.join(',\n')}\n};\n`;
  return { text, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { text, problems } = await buildCatalog();
  if (problems.length) { console.error('The topic folders need attention:\n- ' + problems.join('\n- ')); process.exit(1); }
  if (process.argv.includes('--check')) {
    const cur = existsSync(root + OUT) ? readFileSync(root + OUT, 'utf8') : '';
    if (cur !== text) { console.error(`${OUT} is out of date. Run: npm run catalog`); process.exit(1); }
    console.log('Catalog is up to date.');
  } else {
    mkdirSync(root + 'src/generated', { recursive: true }); writeFileSync(root + OUT, text);
    console.log(`Wrote ${OUT}.`);
  }
}
