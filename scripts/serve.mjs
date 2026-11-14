// A tiny static server for local development and the browser smoke test: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from './ledger.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

export function serve(port = 8000) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    /* the ledger's list, made from its folder on the fly (at deploy it is written once: scripts/ledger.mjs) */
    if (p === '/community/ledger.json') { res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(collect())); return; }
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try { const body = await readFile(file); res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body); }
    catch { res.writeHead(404).end('Not found'); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = +process.argv[2] || 8000;
  await serve(port);
  console.log(`Open Silicon Lab running at http://localhost:${port}/`);
}
