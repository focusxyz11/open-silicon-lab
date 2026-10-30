// Starts a new topic from topics/_template:  npm run new-topic -- <id> "<Title>" <prefix> <band>
//   id      lower-case letters and dashes, e.g. thermal
//   Title   what the map shows, e.g. "Heat and cooling"
//   prefix  2–3 letters that start every element id in this topic, e.g. th  (keeps ids unique)
//   band    the layer of the stack it sits in, e.g. systems (the list is in src/data/bands.js)
// Then follow the steps it prints. The topic's place, links and ideas all live in its own folder.
import { cpSync, existsSync, readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { BANDS } = await import(pathToFileURL(root + 'src/data/bands.js').href);
const [id, title, prefix, band] = process.argv.slice(2);
const fail = m => { console.error(m); process.exit(1); };
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) fail('Give an id of lower-case letters, digits and dashes: npm run new-topic -- thermal "Heat and cooling" th');
if (!title) fail('Give a title in quotes, e.g. "Heat and cooling".');
if (!prefix || !/^[a-z]{2,3}$/.test(prefix)) fail('Give a 2–3 letter prefix for element ids, e.g. th.');
if (!BANDS.some(b => b.id === band)) fail('Give the band (layer) it sits in, one of:\n' + BANDS.map(b => '  ' + b.id.padEnd(10) + b.t + ': ' + b.d).join('\n'));
const dir = root + 'topics/' + id;
if (existsSync(dir)) fail('topics/' + id + ' already exists.');
cpSync(root + 'topics/_template', dir, { recursive: true });
renameSync(dir + '/labs/TOPIC_ID-lab.js', dir + '/labs/' + id + '-lab.js');
/* It goes last in its band; change "order" to move it left or right on the map. */
const orders = readdirSync(root + 'topics', { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => { try { return JSON.parse(readFileSync(root + 'topics/' + d.name + '/topic.json', 'utf8')); } catch (e) { return {}; } }).filter(m => m.band === band).map(m => m.order || 0);
const order = (orders.length ? Math.max(...orders) : 0) + 10;
const fill = s => s.replaceAll('TOPIC_ID', id).replaceAll('TOPIC_TITLE', title).replaceAll('TOPIC_BAND', band).replaceAll('"order": 999', '"order": ' + order).replaceAll('TOPIC_QUESTION', 'The question this topic answers?').replaceAll('PFX', prefix);
for (const f of ['topic.json', 'content.html', 'labs/' + id + '-lab.js']) writeFileSync(dir + '/' + f, fill(readFileSync(dir + '/' + f, 'utf8')));
console.log(`Created topics/${id}/ with a working example simulation.

Next steps:
 1. Fill in topics/${id}/topic.json:
      "summary"  one sentence for the map
      "links"    at least one connection, written as a sentence, e.g.
                 { "kind": "builds-on", "to": "physics", "why": "what connects them" }
                 src/data/links.js lists the six kinds and how to choose one.
      "ideas"    big ideas this topic shows, if any (src/data/ideas.js), e.g.
                 { "idea": "energy-budget", "how": "where it shows up here" }
      "learn"    plain and engineer explanations; optional quiz and tutor questions
 2. In src/data/timeline.js, add a line for '${id}' to topicLine(): one sentence on what this
    topic looked like in a given year (the time machine shows it on the topic page).
 3. Write the question (the <h2>) and the text in topics/${id}/content.html.
 4. Replace the example model in topics/${id}/labs/${id}-lab.js.
 5. Run: npm run catalog   (checks the folder, then updates src/generated/)
 6. Run: npm test          (checks the folder contract and the knowledge graph)
 7. Open the site (npm start) at #${id} and check it at phone width and in dark mode.
See topics/README.md for the full contract.`);
