// Builds dist/open-silicon-lab.html: the whole lab in one self-contained file (script, styles and words
// inlined), for the claude.ai preview and offline use. Needs esbuild: ./node_modules/.bin/esbuild,
// $ESBUILD, or `npx esbuild`.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const r = p => readFileSync(root + p, 'utf8');
const bin = process.env.ESBUILD || (existsSync(root + 'node_modules/.bin/esbuild') ? root + 'node_modules/.bin/esbuild' : null);
const args = [root + 'src/main.js', '--bundle', '--format=iife', '--minify', '--target=es2020', '--log-level=warning'];
const js = bin ? execFileSync(bin, args, { encoding: 'utf8', maxBuffer: 64e6, cwd: root }) : execFileSync('npx', ['--yes', 'esbuild@0.24.0', ...args], { encoding: 'utf8', maxBuffer: 64e6, cwd: root });
const content = {};
for (const f of readdirSync(root + 'src/i18n').filter(f => f.endsWith('.json'))) content['src/i18n/' + f] = r('src/i18n/' + f);
const safe = s => s.replace(/<\/(script|style)/gi, '<\\/$1');
const icon = 'data:image/svg+xml;base64,' + readFileSync(root + 'assets/favicon.svg').toString('base64');
const html = r('index.html')
  .replace('href="assets/favicon.svg"', () => `href="${icon}"`)
  .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '')
  .replace('<link rel="stylesheet" href="src/styles/site.css">', () => `<style>\n${safe(r('src/styles/site.css'))}\n</style>`)
  .replace('<script type="module" src="src/main.js"></script>', () => `<script>window.__OSL_CONTENT__=${safe(JSON.stringify(content))};</script>\n<script>\n${safe(js)}\n</script>`);
mkdirSync(root + 'dist', { recursive: true });
writeFileSync(root + 'dist/open-silicon-lab.html', html);
console.log(`dist/open-silicon-lab.html  ${(html.length / 1024).toFixed(0)} KB`);
