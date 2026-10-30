// Builds dist/open-silicon-lab.html: the whole lab in one self-contained file (scripts, styles,
// content and facts inlined). Used for the claude.ai preview, where "Ask Claude" works, and for offline use.
// Topics still load on demand inside the file: their content is inlined and their simulations bundled.
// Needs esbuild: it uses ./node_modules/.bin/esbuild, $ESBUILD, or falls back to `npx esbuild`.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const r = p => readFileSync(root + p, 'utf8');
execFileSync(process.execPath, [root + 'scripts/catalog.mjs', '--check'], { stdio: 'inherit' });
const bin = process.env.ESBUILD || (existsSync(root + 'node_modules/.bin/esbuild') ? root + 'node_modules/.bin/esbuild' : null);
/* Topic simulations import shared code as osl/…; the browser maps that with an import map, esbuild with an alias. */
const args = [root + 'src/main.js', '--bundle', '--format=iife', '--minify', '--target=es2020', '--log-level=warning', '--alias:osl=' + root + 'src'];
const js = bin ? execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 64e6, cwd: root }) : execFileSync('npx', ['--yes', 'esbuild@0.24.0', ...args], { encoding: 'utf8', maxBuffer: 64e6, cwd: root });

const topics = readdirSync(root + 'topics', { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_')).map(d => d.name).sort();
const content = { 'content/zoom.html': r('content/zoom.html'), 'src/data/facts.json': r('src/data/facts.json') };
for (const f of readdirSync(root + 'content').filter(f => f.endsWith('.html'))) content['content/' + f] = r('content/' + f);
for (const t of topics) content['topics/' + t + '/content.html'] = r('topics/' + t + '/content.html');
/* Shared stylesheets first (base, then app), then each topic's own style.css. */
const core = ['base', 'app'];
const extra = readdirSync(root + 'src/styles').filter(f => f.endsWith('.css')).map(f => f.slice(0, -4)).filter(n => !core.includes(n)).sort();
const css = core.concat(extra).map(n => r(`src/styles/${n}.css`)).concat(topics.filter(t => existsSync(root + 'topics/' + t + '/style.css')).map(t => r('topics/' + t + '/style.css'))).join('\n');
const safe = s => s.replace(/<\/(script|style)/gi, '<\\/$1');

const icon = 'data:image/svg+xml;base64,' + readFileSync(root + 'assets/favicon.svg').toString('base64');
let html = r('index.html')
  .replace('href="assets/favicon.svg"', () => `href="${icon}"`)
  .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '')
  .replace(/<link rel="stylesheet" href="src\/styles\/[a-z]+\.css">\n?/g, '')
  .replace(/<!-- Topic simulations import[^\n]*\n<script type="importmap">[^\n]*<\/script>\n/, '')
  .replace('</head>', () => `<style>\n${safe(css)}\n</style>\n</head>`)
  .replace('<script type="module" src="src/main.js"></script>', () =>
    `<script>window.__OSL_INLINE_STYLES__=true;window.__OSL_CONTENT__=${safe(JSON.stringify(content))};</script>\n<script>\n${safe(js)}\n</script>`);
mkdirSync(root + 'dist', { recursive: true });
writeFileSync(root + 'dist/open-silicon-lab.html', html);
console.log(`dist/open-silicon-lab.html  ${(html.length / 1024).toFixed(0)} KB`);
