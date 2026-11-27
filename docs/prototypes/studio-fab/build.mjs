/* Build the studio and fab prototype (the drawing and the line) into one self-contained page: the sources in src/ bundled with the lab's own engines
   (src/engines/switch.js, paradigms.js, arch.js). A reference to port from (docs/PATH.md), not part of the site.
   Run from the repository's root:  npm install --no-save esbuild && node docs/prototypes/studio-fab/build.mjs [--min] */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const esbuild = await import('esbuild');
const out = await esbuild.build({ entryPoints: [join(here, 'src/app.js')], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020', legalComments: 'none' });
const js = out.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const html = readFileSync(join(here, 'src/index.src.html'), 'utf8').replace('/*CSS*/', () => readFileSync(join(here, 'src/style.css'), 'utf8')).replace('/*JS*/', () => js);
writeFileSync(join(here, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB');
