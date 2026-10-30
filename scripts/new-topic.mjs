// Starts a new topic from topics/_template:  npm run new-topic -- <id> "<Title>" <prefix>
//   id      lower-case letters and dashes, e.g. thermal
//   Title   what the map shows, e.g. "Heat and cooling"
//   prefix  2–3 letters that start every element id in this topic, e.g. th  (keeps ids unique)
// Then follow the steps it prints. Nothing else in the site needs to change by hand.
import { cpSync, existsSync, readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const [id, title, prefix] = process.argv.slice(2);
const fail = m => { console.error(m); process.exit(1); };
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) fail('Give an id of lower-case letters, digits and dashes: npm run new-topic -- thermal "Heat and cooling" th');
if (!title) fail('Give a title in quotes, e.g. "Heat and cooling".');
if (!prefix || !/^[a-z]{2,3}$/.test(prefix)) fail('Give a 2–3 letter prefix for element ids, e.g. th.');
const dir = root + 'topics/' + id;
if (existsSync(dir)) fail('topics/' + id + ' already exists.');
cpSync(root + 'topics/_template', dir, { recursive: true });
renameSync(dir + '/labs/TOPIC_ID-lab.js', dir + '/labs/' + id + '-lab.js');
const fill = s => s.replaceAll('TOPIC_ID', id).replaceAll('TOPIC_TITLE', title).replaceAll('TOPIC_QUESTION', 'The question this topic answers?').replaceAll('PFX', prefix);
for (const f of ['topic.json', 'content.html', 'labs/' + id + '-lab.js']) writeFileSync(dir + '/' + f, fill(readFileSync(dir + '/' + f, 'utf8')));
console.log(`Created topics/${id}/ with a working example simulation.

Next steps:
 1. In src/data/topics.js, add to TOPICS:
      { id: '${id}', band: '<a band id from BANDS>', kind: 'explore', t: '${title}', s: 'One sentence for the map.' },
    and at least one labelled connection to EDGES, e.g.:
      ['transistor', '${id}', 'why the two connect'],
 2. In src/data/timeline.js, add a line for '${id}' to topicLine(): one sentence on what this
    topic looked like in a given year (the time machine shows it on the topic page).
 3. Write the question (the <h2>) and the text in topics/${id}/content.html.
 4. Replace the example model in topics/${id}/labs/${id}-lab.js.
 5. Run: npm run catalog   (updates src/generated/catalog.js)
 6. Run: npm test          (checks the folder contract and the knowledge graph)
 7. Open the site (npm start) at #${id} and check it at phone width and in dark mode.
See topics/README.md for the full contract.`);
