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
import { useLedger } from '../src/engines/ledger.js';
import { collect } from './ledger.mjs';
import { readWords } from './words.mjs';

const root = new URL('..', import.meta.url);
const EN = readWords();
const PKG = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
useTexts(EN, 'en');
useLedger(collect());

const str = d => ({ type: 'string', description: d });
const WHO = { author: str(EN['api.arg.author']), kind: { type: 'string', enum: ['person', 'ai', 'both', 'program'], description: EN['api.arg.kind'] }, ai: str(EN['api.arg.ai']), about: str(EN['api.arg.about']) };
/* a plan for the energy puzzle (src/engines/budget.js PLAN): every field optional, the engine checks the values */
const PLAN_ARG = { type: 'object', description: EN['api.arg.plan'], properties: {
  home: { type: 'string', enum: ['dram', 'hbm', 'sram'] }, precision: { type: 'string', enum: ['fp16', 'fp8', 'fp4'] }, clock: { type: 'number', minimum: 0.5, maximum: 4.5 },
  volt: { type: ['number', 'null'], minimum: 0.5, maximum: 1.1 }, batch: { type: 'integer', minimum: 1, maximum: 4096 }, cim: { type: 'boolean' }, adcBits: { type: 'integer', minimum: 2, maximum: 12 },
  pue: { type: 'number', minimum: 1, maximum: 3 }, optics: { type: 'string', enum: ['plug', 'cpo'] } } };
const FRONT_ARG = { type: 'object', description: EN['api.arg.front'], properties: { p: { type: 'number', minimum: 0, maximum: 1, multipleOf: 0.1 }, n: { type: 'number', minimum: 0, maximum: 1, multipleOf: 0.1 } }, required: ['p', 'n'] };
/* a history of Grow an architecture (src/engines/arch.js histOf): the recipe it starts from, its stones, each year's focus
   and the changes between years; the engine checks every value */
const DIR = { type: 'string', enum: ['device', 'memory', 'tools', 'errors', 'making', 'people'] };
const ARCH_ARGS = { start: { type: ['string', 'object'], description: EN['api.arg.archStart'], properties: { where: { type: 'string', enum: ['far', 'near', 'in', 'flow'] }, carrier: { type: 'string', enum: ['charge', 'light', 'spikes', 'reversible', 'living'] }, told: { type: 'string', enum: ['program', 'graph', 'events', 'learns', 'fixed'] }, shape: { type: 'string', enum: ['few', 'grid', 'stack', 'swarm'] } } },
  stones: { type: 'object', description: EN['api.arg.archStones'] }, years: { type: 'array', description: EN['api.arg.archYears'], maxItems: 40, items: { type: 'array', maxItems: 2, items: DIR } },
  changes: { type: 'array', description: EN['api.arg.archChanges'], items: { type: 'object', properties: { at: { type: 'integer', minimum: 1 }, gene: { type: 'string', enum: ['where', 'carrier', 'told', 'shape'] }, option: { type: 'string' }, stone: { type: 'string' } }, required: ['at'] } } };
const TOOLS = [
  { name: 'look', fn: a => API.look(a || {}), description: EN['api.tool.look'], inputSchema: { type: 'object', properties: { at: str(EN['api.arg.lookAt']) } } },
  { name: 'list_plan', fn: () => API.listPlan(), description: EN['api.tool.plan'], inputSchema: { type: 'object', properties: {} } },
  { name: 'get_job', fn: a => API.getJob(a.job), description: EN['api.tool.job'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']) }, required: ['job'] } },
  { name: 'check_design', fn: a => API.checkDesign(a), description: EN['api.tool.check'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']), code: str(EN['api.arg.code']), slice: str(EN['api.arg.slice']), regbit: str(EN['api.arg.regbit']), select: str(EN['api.arg.select']) }, required: ['job', 'code'] } },
  { name: 'at_factory', fn: a => API.atFactory(a), description: EN['api.tool.factory'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']), code: str(EN['api.arg.code']), slice: str(EN['api.arg.slice']), seed: { type: 'integer', description: EN['api.arg.seed'] } }, required: ['job', 'code'] } },
  { name: 'life_of', fn: a => API.lifeOf(a), description: EN['api.tool.life'], inputSchema: { type: 'object', properties: { job: str(EN['api.arg.job']), code: str(EN['api.arg.code']), slice: str(EN['api.arg.slice']), where: { type: 'string', enum: ['phone', 'car', 'datacentre'], description: EN['api.arg.where'] },
    choices: { type: 'object', description: EN['api.arg.choices'], properties: { margin: { type: 'integer', minimum: 0, maximum: 6 }, grid: { type: 'boolean' }, protect: { type: 'string', enum: ['none', 'memory', 'logic'] }, hot: { type: 'boolean' }, burn: { type: 'boolean' } } } }, required: ['job', 'code', 'where'] } },
  { name: 'propose_design', fn: a => API.proposeDesign(a), description: EN['api.tool.propose'], inputSchema: { type: 'object', properties: { need: str(EN['api.arg.need']), code: str(EN['api.arg.code']), title: str(EN['api.arg.title']), words: str(EN['api.arg.words']), from: str(EN['api.arg.from']), ...WHO }, required: ['need', 'code', 'kind'] } },
  { name: 'list_ledger', fn: () => API.listLedger(), description: EN['api.tool.ledger'], inputSchema: { type: 'object', properties: {} } },
  { name: 'propose_break', fn: a => API.proposeBreak(a), description: EN['api.tool.break'], inputSchema: { type: 'object', properties: { design: str(EN['api.arg.design']), case: { type: 'array', description: EN['api.arg.case'], items: { type: 'object' } }, words: str(EN['api.arg.words']), ...WHO }, required: ['design', 'case', 'kind'] } },
  { name: 'propose_try', fn: a => API.proposeTry(a), description: EN['api.tool.try'], inputSchema: { type: 'object', properties: { design: str(EN['api.arg.design']), cases: { type: 'array', description: EN['api.arg.cases'], items: { type: 'array' } }, words: str(EN['api.arg.words']), ...WHO }, required: ['design', 'cases', 'kind'] } },
  { name: 'propose_report', fn: a => API.proposeReport(a), description: EN['api.tool.report'], inputSchema: { type: 'object', properties: { at: str(EN['api.arg.place']), say: { type: 'string', enum: ['wrong', 'confusing', 'broken', 'better'], description: EN['api.arg.say'] }, words: str(EN['api.arg.reportWords']), ...WHO }, required: ['at', 'say', 'words', 'kind'] } },
  { name: 'energy_budget', fn: a => API.energyBudget(a || {}), description: EN['api.tool.energy'], inputSchema: { type: 'object', properties: { plan: PLAN_ARG } } },
  { name: 'submit_attempt', fn: a => API.submitAttempt(a), description: EN['api.tool.attempt'], inputSchema: { type: 'object', properties: { plan: PLAN_ARG, words: str(EN['api.arg.words']), ...WHO }, required: ['plan', 'kind'] } },
  { name: 'block_front', fn: a => API.blockFront(a || {}), description: EN['api.tool.blockFront'], inputSchema: { type: 'object', properties: { plan: FRONT_ARG } } },
  { name: 'submit_front', fn: a => API.submitFront(a), description: EN['api.tool.submitFront'], inputSchema: { type: 'object', properties: { plan: FRONT_ARG, words: str(EN['api.arg.words']), ...WHO }, required: ['plan', 'kind'] } },
  { name: 'propose_question', fn: a => API.proposeQuestion(a), description: EN['api.tool.question'], inputSchema: { type: 'object', properties: { at: str(EN['api.arg.at']), under: str(EN['api.arg.under']), question: str(EN['api.arg.question']), noticed: str(EN['api.arg.noticed']), ...WHO }, required: ['at', 'question', 'kind'] } },
  { name: 'choose_design', fn: a => API.chooseDesign(a || {}), description: EN['api.tool.choose'], inputSchema: { type: 'object', properties: { need: { type: 'string', enum: ['phone'], description: EN['api.arg.chooseNeed'] }, pick: str(EN['api.arg.pick']), reason: str(EN['api.arg.reason']),
    author: str(EN['api.arg.author']), kind: { type: 'string', enum: ['person', 'ai'], description: EN['api.arg.chooser'] }, ai: str(EN['api.arg.ai']), about: str(EN['api.arg.about']) } } },
  { name: 'grow_architecture', fn: a => API.growArchitecture(a || {}), description: EN['api.tool.grow'], inputSchema: { type: 'object', properties: ARCH_ARGS } },
  { name: 'architecture_forks', fn: a => API.archForks(a || {}), description: EN['api.tool.archForks'], inputSchema: { type: 'object', properties: ARCH_ARGS, required: ['start', 'years'] } },
  { name: 'submit_architecture', fn: a => API.submitArchitecture(a || {}), description: EN['api.tool.submitArch'], inputSchema: { type: 'object', properties: { ...ARCH_ARGS, wins: { type: 'array', description: EN['api.arg.archWins'], items: { type: 'string', enum: ['any', 'model', 'hearing', 'wildfire', 'rover', 'radio'] } }, words: str(EN['api.arg.words']), ...WHO }, required: ['start', 'years', 'kind'] } }
];

const send = m => process.stdout.write(JSON.stringify(m) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

/* anything may arrive on the line: a message that is not a request is answered with an error, never thrown on (a throw
   here would stop the port for every agent connected), and a tool's arguments are a plain record or nothing */
const record = x => (x !== null && typeof x === 'object' && !Array.isArray(x) ? x : null);
function handle(msg) {
  if (!record(msg)) return fail(null, -32600, 'Invalid Request'); /* i18n-ok: protocol message */
  const { id, method } = msg, params = record(msg.params);
  if (method === 'initialize') return reply(id, { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'open-silicon-lab', version: PKG.version }, instructions: EN['api.instructions'] });
  if (method === 'ping') return reply(id, {});
  if (method === 'tools/list') return reply(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (method === 'tools/call') {
    const tool = TOOLS.find(x => x.name === (params && params.name));
    if (!tool) return fail(id, -32602, 'Unknown tool: ' + (params && typeof params.name === 'string' ? params.name : '')); /* i18n-ok: protocol message */
    try { const out = tool.fn(record(params.arguments) || {}); return reply(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out, isError: !!(out && (out.error || out.ok === false)) }); }
    catch (e) { return reply(id, { content: [{ type: 'text', text: String(e && e.message || e) }], isError: true }); }
  }
  if (id !== undefined && id !== null) fail(id, -32601, 'Method not found: ' + (typeof method === 'string' ? method : '')); /* i18n-ok: protocol message */
}

createInterface({ input: process.stdin }).on('line', line => {
  if (!line.trim()) return;
  let msg; try { msg = JSON.parse(line); } catch (e) { return fail(null, -32700, 'Parse error'); } /* i18n-ok: protocol message */
  (Array.isArray(msg) ? msg : [msg]).forEach(handle);
});
