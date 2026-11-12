#!/usr/bin/env node
// The open port: an MCP server (Model Context Protocol) over the lab's engines, so any AI agent can
// read the community's plan, take a job, check its designs, make copies at the factory and propose
// what passes, through the same checks people use. No dependencies; it speaks JSON-RPC over stdin and
// stdout, one message per line. The tools are src/engines/api.js. See docs/MCP.md.
//
//   node scripts/mcp.mjs            (or: npm run mcp)
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { useTexts } from '../src/core/i18n.js';
import * as API from '../src/engines/api.js';

const root = new URL('..', import.meta.url);
const EN = JSON.parse(readFileSync(new URL('src/i18n/en.json', root), 'utf8'));
const PKG = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
useTexts(EN, 'en');

const str = d => ({ type: 'string', description: d });
const TOOLS = [
  { name: 'list_plan', fn: () => API.listPlan(), description: EN['api.tool.plan'], inputSchema: { type: 'object', properties: {} } },
  { name: 'get_job', fn: a => API.getJob(a.job), description: EN['api.tool.job'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']) }, required: ['job'] } },
  { name: 'check_design', fn: a => API.checkDesign(a), description: EN['api.tool.check'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']), code: str(EN['api.arg.code']), slice: str(EN['api.arg.slice']) }, required: ['job', 'code'] } },
  { name: 'at_factory', fn: a => API.atFactory(a), description: EN['api.tool.factory'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']), code: str(EN['api.arg.code']), slice: str(EN['api.arg.slice']), seed: { type: 'integer', description: EN['api.arg.seed'] } }, required: ['job', 'code'] } },
  { name: 'propose_design', fn: a => API.proposeDesign(a), description: EN['api.tool.propose'], inputSchema: { type: 'object', properties: { need: str(EN['api.arg.need']), code: str(EN['api.arg.code']), slice: str(EN['api.arg.slice']), title: str(EN['api.arg.title']), author: str(EN['api.arg.author']), kind: { type: 'string', enum: ['person', 'ai', 'both'], description: EN['api.arg.kind'] }, ai: str(EN['api.arg.ai']) }, required: ['need', 'code', 'kind'] } }
];

const send = m => process.stdout.write(JSON.stringify(m) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') return reply(id, { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'open-silicon-lab', version: PKG.version }, instructions: EN['api.instructions'] });
  if (method === 'ping') return reply(id, {});
  if (method === 'tools/list') return reply(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (method === 'tools/call') {
    const tool = TOOLS.find(x => x.name === (params && params.name));
    if (!tool) return fail(id, -32602, 'Unknown tool: ' + (params && params.name)); /* i18n-ok: protocol message */
    try { const out = tool.fn((params && params.arguments) || {}); return reply(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out, isError: !!(out && (out.error || out.ok === false)) }); }
    catch (e) { return reply(id, { content: [{ type: 'text', text: String(e && e.message || e) }], isError: true }); }
  }
  if (id !== undefined && id !== null) fail(id, -32601, 'Method not found: ' + method); /* i18n-ok: protocol message */
}

createInterface({ input: process.stdin }).on('line', line => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch (e) { return fail(null, -32700, 'Parse error'); } /* i18n-ok: protocol message */
  (Array.isArray(msg) ? msg : [msg]).forEach(handle);
});
