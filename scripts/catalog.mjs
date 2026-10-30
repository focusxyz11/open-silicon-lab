// Builds the two small files the site reads at start-up, from the topics/ folders:
//   src/generated/graph.js    the knowledge graph: every topic's place, its links, the big ideas it
//                             shows and its challenges (from each topic.json)
//   src/generated/catalog.js  what each topic holds (simulations and their titles), every anchor a
//                             link can point to, and how to load each topic on demand
// Everything else in a topic (its page, simulations, explanations, quiz) loads only when opened.
//
//   npm run catalog                     regenerate after adding or changing a topic
//   node scripts/catalog.mjs --check    fail if the committed files are out of date (CI does this)
//
// It also checks every topic folder against the contract in topics/README.md and explains each
// problem in plain words, so a contributor (or their AI assistant) knows exactly what to fix.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT_CATALOG = 'src/generated/catalog.js';
const OUT_GRAPH = 'src/generated/graph.js';
const REF = ['glossary', 'sources'];          // reference pages in content/, loaded on demand too
const TOPIC_KINDS = ['explore', 'build'];
const CHALLENGE_KINDS = ['Puzzle', 'Design', 'Experiment'];
const ROUTES = ['map', 'whatif', 'workshop', 'challenges', 'knowledge', 'mychip', 'glossary', 'sources'];   // pages the router opens by name

const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const q = s => JSON.stringify(s);
const str = s => typeof s === 'string' && s.trim().length > 0;

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

/* The first loop in a set of directed links, as a list of topic ids, or null. */
export function findLoop(pairs) {
  const next = new Map(); pairs.forEach(([a, b]) => { if (!next.has(a)) next.set(a, []); next.get(a).push(b); });
  const state = new Map(), stack = [];
  const visit = n => {
    state.set(n, 1); stack.push(n);
    for (const m of next.get(n) || []) {
      if (state.get(m) === 1) return stack.slice(stack.indexOf(m)).concat(m);
      if (!state.has(m)) { const r = visit(m); if (r) return r; }
    }
    state.set(n, 2); stack.pop(); return null;
  };
  for (const n of next.keys()) if (!state.has(n)) { const r = visit(n); if (r) return r; }
  return null;
}

/* Reads and checks every topic.json. Returns the topics in map order and the problems found. */
async function readTopics(problems) {
  const { BANDS } = await import(pathToFileURL(root + 'src/data/bands.js').href);
  const bandIx = new Map(BANDS.map((b, i) => [b.id, i]));
  const metas = [];
  const folders = existsSync(root + 'topics') ? readdirSync(root + 'topics', { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name).sort() : [];
  for (const id of folders) {
    const f = `topics/${id}/topic.json`;
    if (!existsSync(root + f)) { problems.push(`${f} is missing. Copy topics/_template/topic.json and set "id" to "${id}".`); continue; }
    let m; try { m = JSON.parse(readFileSync(root + f, 'utf8')); } catch (e) { problems.push(`${f} is not valid JSON: ${e.message}`); continue; }
    if (m.id !== id) problems.push(`${f} says "id": ${q(m.id)}; it must be ${q(id)}, the folder name.`);
    if (!str(m.title)) problems.push(`${f} needs a "title": the short name shown on the map.`);
    if (!str(m.summary)) problems.push(`${f} needs a "summary": one sentence saying what the reader can do or find here.`);
    if (!bandIx.has(m.band)) problems.push(`${f} has "band": ${q(m.band)}. Use one of: ${BANDS.map(b => b.id).join(', ')} (see src/data/bands.js).`);
    if (!Number.isFinite(m.order)) problems.push(`${f} needs a number "order": its place from left to right within its band (10, 20, 30…; pick a number between two neighbours).`);
    if (!TOPIC_KINDS.includes(m.kind)) problems.push(`${f} has "kind": ${q(m.kind)}. Use "explore" (simulations and explanations) or "build" (a hands-on project).`);
    for (const k of ['labs', 'links', 'ideas', 'tradeoffs', 'measures', 'challenges']) if (m[k] !== undefined && !Array.isArray(m[k])) problems.push(`${f}: "${k}" must be a list [ … ].`);
    metas.push(Object.assign({ labs: [], links: [], ideas: [], tradeoffs: [], measures: [], challenges: [], learn: {} }, m, { id }));
  }
  metas.sort((a, b) => (bandIx.get(a.band) ?? 99) - (bandIx.get(b.band) ?? 99) || (a.order || 0) - (b.order || 0) || a.id.localeCompare(b.id));
  for (let i = 1; i < metas.length; i++) {
    const a = metas[i - 1], b = metas[i];
    if (a.band === b.band && a.order === b.order) problems.push(`topics/${a.id} and topics/${b.id} both have "order": ${a.order} in band "${a.band}". Give one of them a number in between its neighbours.`);
  }
  return { metas, BANDS };
}

/* Links, shared hubs (big ideas, trade-offs, measures, debates), challenges and learning content:
   the meaning of the graph. */
async function checkGraph(metas, anchors, shellIds, problems) {
  const { LINK_KINDS, LIMITS } = await import(pathToFileURL(root + 'src/data/links.js').href);
  const { IDEAS } = await import(pathToFileURL(root + 'src/data/ideas.js').href);
  const { TRADEOFFS } = await import(pathToFileURL(root + 'src/data/tradeoffs.js').href);
  const { MEASURES } = await import(pathToFileURL(root + 'src/data/measures.js').href);
  const { DEBATES } = await import(pathToFileURL(root + 'src/data/debates.js').href);
  const factIds = new Set(JSON.parse(readFileSync(root + 'src/data/facts.json', 'utf8')).facts.map(f => f.id));
  const ids = new Set(metas.map(m => m.id)), byId = new Map(metas.map(m => [m.id, m]));
  const kinds = Object.keys(LINK_KINDS);
  const long = (v, lim) => typeof v === 'string' && v.length > lim;
  const links = [], seen = new Map();
  for (const m of metas) {
    const f = `topics/${m.id}/topic.json`;
    m.links.forEach((l, i) => {
      const at = `${f} link ${i + 1}`;
      if (!kinds.includes(l.kind)) { problems.push(`${at} has "kind": ${q(l.kind)}. Use one of: ${kinds.join(', ')}. src/data/links.js explains each one and how to choose.`); return; }
      if ((l.to === undefined) === (l.from === undefined)) { problems.push(`${at} needs exactly one of "to" (this topic is the subject: "${m.id} ${l.kind} <to>") or "from" ("<from> ${l.kind} ${m.id}").`); return; }
      const other = l.to !== undefined ? l.to : l.from;
      if (!ids.has(other)) { problems.push(`${at} points at ${q(other)}, which is not a topic. Topic ids are the folder names in topics/.`); return; }
      if (other === m.id) { problems.push(`${at} links the topic to itself.`); return; }
      if (!str(l.why)) problems.push(`${at} needs a "why": a few words saying what connects them, shown on the map.`);
      else if (long(l.why, LIMITS.why)) problems.push(`${at}: "why" is ${l.why.length} characters; keep it under ${LIMITS.why} so it fits on the map.`);
      if (l.kind === 'causes') {
        if (!str(l.if) || !str(l.then)) problems.push(`${at} is a "causes" link, so it needs "if" (a change in the cause, e.g. "yield falls") and "then" (what happens in the other topic, e.g. "each working chip costs more"). Readers try to predict the "then".`);
        if (long(l.if, LIMITS.if) || long(l.then, LIMITS.then)) problems.push(`${at}: keep "if" under ${LIMITS.if} and "then" under ${LIMITS.then} characters.`);
      } else if (l.if !== undefined || l.then !== undefined) problems.push(`${at}: "if" and "then" belong only on "causes" links. Is this link really a "${l.kind}"?`);
      const from = l.to !== undefined ? m.id : other, to = l.to !== undefined ? other : m.id;
      const key = from + ' ' + l.kind + ' ' + to;
      if (seen.has(key)) { problems.push(`The link "${key}" is written twice: in ${seen.get(key)} and ${f}. Keep one.`); return; }
      seen.set(key, f);
      links.push(Object.assign({ from, to, kind: l.kind, why: l.why }, l.kind === 'causes' ? { if: l.if, then: l.then } : {}, { in: m.id }));
    });
  }
  for (const k of kinds.filter(k => LINK_KINDS[k].noLoops)) {
    const loop = findLoop(links.filter(l => l.kind === k).map(l => [l.from, l.to]));
    if (loop) problems.push(`The "${k}" links go round in a loop: ${loop.join(' → ')}. A "${k}" chain must have an end. One of these links is probably a different kind; see the test for each kind in src/data/links.js.`);
  }
  for (const m of metas) if (!links.some(l => l.from === m.id || l.to === m.id)) problems.push(`topics/${m.id}/topic.json has no links, and no other topic links to it. Add at least one under "links" so the topic sits in the graph.`);

  const ideaIds = new Set(IDEAS.map(i => i.id)), uses = [];
  for (const m of metas) {
    const f = `topics/${m.id}/topic.json`, mine = new Set();
    m.ideas.forEach((u, i) => {
      if (!ideaIds.has(u.idea)) { problems.push(`${f} idea ${i + 1} is ${q(u.idea)}, which is not a big idea. Use one of: ${[...ideaIds].join(', ')}, or add a new one to src/data/ideas.js.`); return; }
      if (mine.has(u.idea)) { problems.push(`${f} lists the idea "${u.idea}" twice. Keep one and put the best example in "how".`); return; }
      mine.add(u.idea);
      if (!str(u.how)) problems.push(`${f} idea "${u.idea}" needs a "how": where this idea shows up in this topic.`);
      else if (long(u.how, LIMITS.how)) problems.push(`${f} idea "${u.idea}": keep "how" under ${LIMITS.how} characters.`);
      uses.push(Object.assign({ idea: u.idea, topic: m.id, how: u.how }, u.counter ? { counter: true } : {}));
    });
  }
  for (const i of IDEAS) {
    const bands = new Set(uses.filter(u => u.idea === i.id).map(u => byId.get(u.topic).band));
    if (bands.size < 2) problems.push(`The big idea "${i.id}" shows up in ${bands.size ? 'only one band (' + [...bands][0] + ')' : 'no topic'}. A big idea must echo across at least two bands: add it to another topic's "ideas", or fold it into an existing idea.`);
  }

  /* Trade-offs and measures: shared hubs, used the same way as ideas. */
  const hubUses = (field, key, list, file, what) => {
    const known = new Set(list.map(x => x.id)), out = [];
    for (const m of metas) {
      const f = `topics/${m.id}/topic.json`, mine = new Set();
      m[field].forEach((u, i) => {
        if (!known.has(u[key])) { problems.push(`${f} ${key} ${i + 1} is ${q(u[key])}, which is not a ${what}. Use one of: ${[...known].join(', ')}, or add a new one to ${file}.`); return; }
        if (mine.has(u[key])) { problems.push(`${f} lists the ${what} "${u[key]}" twice. Keep one.`); return; }
        mine.add(u[key]);
        if (!str(u.how)) problems.push(`${f} ${what} "${u[key]}" needs a "how": where it shows up in this topic.`);
        else if (long(u.how, LIMITS.how)) problems.push(`${f} ${what} "${u[key]}": keep "how" under ${LIMITS.how} characters.`);
        if (u.try !== undefined) { const h = /^#([\w-]+)$/.exec(u.try); if (!h || !(anchors[h[1]] || ids.has(h[1]) || /^riscv-(\d+|sandbox)$/.test(h[1]))) problems.push(`${f} ${what} "${u[key]}" has "try": ${q(u.try)}, which does not exist. Point it at the simulation, e.g. "#lab-${m.id}-1".`); }
        out.push(Object.assign({ [key]: u[key], topic: m.id, how: u.how }, u.try ? { try: u.try } : {}));
      });
    }
    for (const x of list) { const n = out.filter(u => u[key] === x.id).length; if (n < 2) problems.push(`The ${what} "${x.id}" is used by ${n} topic${n === 1 ? '' : 's'}. A shared ${what} must show up in at least two: add it to another topic's "${field}", or remove it from ${file}.`); }
    return out;
  };
  const tradeoffUses = hubUses('tradeoffs', 'tradeoff', TRADEOFFS, 'src/data/tradeoffs.js', 'trade-off');
  const measureUses = hubUses('measures', 'measure', MEASURES, 'src/data/measures.js', 'measure');
  for (const t of TRADEOFFS) if (!str(t.a) || !str(t.b) || !str(t.d)) problems.push(`src/data/tradeoffs.js "${t.id}" needs "a" and "b" (what you gain at each end) and "d".`);
  for (const x of MEASURES) {
    if (!['higher', 'lower'].includes(x.better)) problems.push(`src/data/measures.js "${x.id}": "better" must be "higher" or "lower".`);
    if (!str(x.unit) || !str(x.catch)) problems.push(`src/data/measures.js "${x.id}" needs a "unit" and a "catch" (what the number hides).`);
    (x.facts || []).filter(id => !factIds.has(id)).forEach(id => problems.push(`src/data/measures.js "${x.id}" lists the fact "${id}", which is not in src/data/facts.json.`));
  }
  /* Debates live centrally (they span topics); every view needs an assumption and a place to test it. */
  for (const d of DEBATES) {
    if (!str(d.t) || !str(d.q)) problems.push(`src/data/debates.js "${d.id}" needs a "t" (title) and a "q" (the open question).`);
    if (!Array.isArray(d.views) || d.views.length < 2) { problems.push(`src/data/debates.js "${d.id}" needs at least two views; a debate with one side is a claim.`); continue; }
    d.views.forEach((v, i) => {
      if (!str(v.t) || !str(v.claim) || !str(v.assumes)) problems.push(`src/data/debates.js "${d.id}" view ${i + 1} needs "t", "claim" and "assumes" (what has to be true for this view to win).`);
      if (!Array.isArray(v.topics) || !v.topics.length) problems.push(`src/data/debates.js "${d.id}" view ${i + 1} needs "topics": where a reader can test it.`);
      else v.topics.filter(t => !ids.has(t)).forEach(t => problems.push(`src/data/debates.js "${d.id}" view ${i + 1} names the topic "${t}", which does not exist.`));
    });
  }

  const challenges = [];
  for (const m of metas) {
    const f = `topics/${m.id}/topic.json`;
    m.challenges.forEach((c, i) => {
      const at = `${f} challenge ${i + 1}`;
      if (!CHALLENGE_KINDS.includes(c.kind)) problems.push(`${at} has "kind": ${q(c.kind)}. Use Puzzle (one right answer), Design (many answers, scored on trade-offs) or Experiment (find where something breaks).`);
      if (!str(c.title) || !str(c.task)) problems.push(`${at} needs a "title" and a "task" (one sentence: what to do).`);
      const h = /^#([\w-]+)$/.exec(c.href || '');
      if (!h || !(anchors[h[1]] || ids.has(h[1]) || shellIds.has(h[1]) || ROUTES.includes(h[1]) || /^riscv-(\d+|sandbox)$/.test(h[1]))) problems.push(`${at} links to ${q(c.href)}, which does not exist. Use "#<topic>" or "#<id of an element in the topic>", such as "#lab-${m.id}-1".`);
      challenges.push({ topic: m.id, kind: c.kind, t: c.title, d: c.task, href: c.href });
    });
    const L = m.learn || {};
    if (!!L.plain !== !!L.engineer) problems.push(`${f} "learn" needs both "plain" (for beginners) and "engineer" (for engineers), or neither.`);
    (L.quiz || []).forEach((x, i) => {
      if (!str(x.q) || !Array.isArray(x.options) || x.options.length < 2 || !Number.isInteger(x.answer) || x.answer < 0 || x.answer >= x.options.length || !str(x.why)) problems.push(`${f} quiz question ${i + 1} needs "q", at least two "options", "answer" (the number of the right option, counting from 0) and "why".`);
    });
    if (L.ask !== undefined && (!Array.isArray(L.ask) || !L.ask.every(str))) problems.push(`${f} "learn.ask" must be a list of questions a reader might ask.`);
  }
  return { links, uses, tradeoffUses, measureUses, challenges };
}

export async function buildCatalog() {
  const problems = [];
  const { metas } = await readTopics(problems);
  const files = {}, anchors = {}, loaders = [];
  const claim = (id, owner) => { if (anchors[id] && anchors[id] !== owner) problems.push(`The id "${id}" is used in both ${anchors[id]} and ${owner}. Ids must be unique across the whole site; rename one of them (and the code that looks it up).`); else anchors[id] = owner; };
  for (const t of metas) {
    const dir = 'topics/' + t.id + '/';
    if (!existsSync(root + dir + 'content.html')) { problems.push(`${dir}content.html is missing. Every topic needs one; copy topics/_template/content.html to start.`); continue; }
    const html = readFileSync(root + dir + 'content.html', 'utf8');
    if (!new RegExp('<section id="' + t.id + '"').test(html)) problems.push(`${dir}content.html must start with <section id="${t.id}">.`);
    const onDisk = existsSync(root + dir + 'labs') ? readdirSync(root + dir + 'labs').filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort() : [];
    const listed = t.labs;
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
    const modules = listed.filter(x => onDisk.includes(x));
    files[t.id] = { labs: labs.filter(l => l.t), style: existsSync(root + dir + 'style.css'), modules };
    loaders.push(`  ${q(t.id)}: () => Promise.all([${modules.map(n => `import('../../${dir}labs/${n}.js')`).join(', ')}])`);
  }
  for (const r of REF) { const p = 'content/' + r + '.html'; if (existsSync(root + p)) idsIn(readFileSync(root + p, 'utf8')).forEach(id => claim(id, r)); }
  /* The app shell's own ids (index.html, the map page, the zoom viewer) must not clash with topics. */
  const shell = [readFileSync(root + 'index.html', 'utf8'), readFileSync(root + 'content/zoom.html', 'utf8')].concat(readdirSync(root + 'src/app').filter(f => f.endsWith('.js')).map(f => readFileSync(root + 'src/app/' + f, 'utf8')));
  const shellIds = new Set(shell.flatMap(idsIn)); shellIds.forEach(id => { if (anchors[id]) problems.push(`The id "${id}" is used by the app shell and by ${anchors[id]}. Rename the one in the topic.`); });
  const { links, uses, tradeoffUses, measureUses, challenges } = await checkGraph(metas, anchors, shellIds, problems);

  const sortedAnchors = Object.fromEntries(Object.keys(anchors).sort().map(k => [k, anchors[k]]));
  const catalog = `// Generated by scripts/catalog.mjs from the topics/ folders. Do not edit by hand: run \`npm run catalog\`.\n` +
    `// What each topic holds, every anchor a link can point to, and how to load each topic on demand.\n\n` +
    `/* Per topic: its simulations (anchor id and title), its lab modules in start order, and whether it has its own style.css. */\n` +
    `export const TOPIC_FILES = {\n${Object.entries(files).map(([k, v]) => `  ${q(k)}: ${JSON.stringify(v)}`).join(',\n')}\n};\n\n` +
    `/* Every element id inside a topic or reference page, and where it lives, so #anchor links open the right page. */\n` +
    `export const ANCHORS = {\n${Object.entries(sortedAnchors).map(([k, v]) => `  ${q(k)}: ${q(v)}`).join(',\n')}\n};\n\n` +
    `/* Loading a topic's simulations. Each import is written out so bundlers can see it. */\n` +
    `export const LOADERS = {\n${loaders.join(',\n')}\n};\n`;
  const graph = `// Generated by scripts/catalog.mjs from topics/*/topic.json. Do not edit by hand: change the topic's\n` +
    `// topic.json and run \`npm run catalog\`. Read it through src/data/topics.js.\n\n` +
    `/* Every topic in map order (band, then "order"): id, band, kind, title (t) and summary (s). */\n` +
    `export const TOPICS = [\n${metas.map(m => '  ' + JSON.stringify({ id: m.id, band: m.band, kind: m.kind, t: m.title, s: m.summary })).join(',\n')}\n];\n\n` +
    `/* Every link: "from <kind> to: why". "in" is the topic.json it is written in. */\n` +
    `export const LINKS = [\n${links.map(l => '  ' + JSON.stringify(l)).join(',\n')}\n];\n\n` +
    `/* Where each big idea shows up (src/data/ideas.js has the ideas themselves). */\n` +
    `export const IDEA_USES = [\n${uses.map(u => '  ' + JSON.stringify(u)).join(',\n')}\n];\n\n` +
    `/* Where each trade-off and measure shows up (src/data/tradeoffs.js and measures.js define them). */\n` +
    `export const TRADEOFF_USES = [\n${tradeoffUses.map(u => '  ' + JSON.stringify(u)).join(',\n')}\n];\n\n` +
    `export const MEASURE_USES = [\n${measureUses.map(u => '  ' + JSON.stringify(u)).join(',\n')}\n];\n\n` +
    `/* Every challenge, with the topic it belongs to. */\n` +
    `export const CHALLENGES = [\n${challenges.map(c => '  ' + JSON.stringify(c)).join(',\n')}\n];\n`;
  return { outputs: { [OUT_CATALOG]: catalog, [OUT_GRAPH]: graph }, text: catalog, problems };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { outputs, problems } = await buildCatalog();
  if (problems.length) { console.error('The topic folders need attention:\n- ' + problems.join('\n- ')); process.exit(1); }
  if (process.argv.includes('--check')) {
    const stale = Object.keys(outputs).filter(p => (existsSync(root + p) ? readFileSync(root + p, 'utf8') : '') !== outputs[p]);
    if (stale.length) { console.error(`${stale.join(' and ')} ${stale.length > 1 ? 'are' : 'is'} out of date. Run: npm run catalog`); process.exit(1); }
    console.log('Catalog and graph are up to date.');
  } else {
    mkdirSync(root + 'src/generated', { recursive: true });
    for (const [p, t] of Object.entries(outputs)) writeFileSync(root + p, t);
    console.log(`Wrote ${Object.keys(outputs).join(' and ')}.`);
  }
}
