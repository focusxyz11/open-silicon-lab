// The open port (scripts/mcp.mjs over src/engines/api.js): an AI agent can connect, list the tools,
// read the plan, check a design, make a copy at the factory and propose a design, through the same
// checks people use. These tests talk to the server the way an agent does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

function server() {
  const p = spawn(process.execPath, [new URL('../scripts/mcp.mjs', import.meta.url).pathname], { stdio: ['pipe', 'pipe', 'inherit'] });
  const waiting = new Map(); let n = 0;
  createInterface({ input: p.stdout }).on('line', l => { const m = JSON.parse(l); const w = waiting.get(m.id); if (w) { waiting.delete(m.id); w(m); } });
  const call = (method, params) => new Promise(res => { const id = ++n; waiting.set(id, res); p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n'); });
  return { call, tool: async (name, args) => (await call('tools/call', { name, arguments: args })).result, stop: () => p.kill() };
}

test('an agent connects, lists the tools, reads the plan and takes a job', async () => {
  const S = server();
  try {
    const init = await S.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(init.result.serverInfo.name, 'open-silicon-lab');
    assert.ok(init.result.capabilities.tools && init.result.instructions);
    const tools = (await S.call('tools/list', {})).result.tools.map(t => t.name);
    assert.deepEqual(tools, ['list_plan', 'get_job', 'check_design', 'at_factory', 'propose_design']);
    const plan = (await S.tool('list_plan', {})).structuredContent;
    assert.ok(plan.pieces.some(p => p.id === 'core' && p.engine === 'riscv'));
    const job = (await S.tool('get_job', { job: 'vote' })).structuredContent;
    assert.deepEqual(job.inputs, ['a', 'b', 'c']);
    assert.ok(job.language.includes('XOR'));
    assert.equal((await S.call('nope', {})).error.code, -32601);
  } finally { S.stop(); }
});

test('an agent checks a design, finds its bug, sees the factory spoil a copy, and proposes only what is right', async () => {
  const S = server();
  try {
    const wrong = (await S.tool('check_design', { job: 'vote', code: 'y = (a & b) | (a & c);' })).structuredContent;
    assert.equal(wrong.right, false); assert.ok(wrong.firstWrong);
    const right = (await S.tool('check_design', { job: 'vote', code: 'y = (a & b) | (b & c) | (a & c);' })).structuredContent;
    assert.equal(right.right, true); assert.ok(right.gates.transistors > 0 && right.layout.unrouted === 0);
    const fab = (await S.tool('at_factory', { job: 'vote', code: 'y = (a & b) | (b & c) | (a & c);', seed: 3 })).structuredContent;
    assert.ok(fab.wrongAnswers > 0 && fab.caughtAtTest === true);
    const no = await S.tool('propose_design', { need: 'safety', code: 'y = (a & b) | (a & c);', kind: 'ai', ai: 'an agent wrote it' });
    assert.equal(no.isError, true);
    const noSay = (await S.tool('propose_design', { need: 'display', code: 'a = 1;', kind: 'ai' })).structuredContent;
    assert.equal(noSay.ok, false);
    const yes = (await S.tool('propose_design', { need: 'half', code: 'sum = a ^ b;\ncarry = a & b;', kind: 'ai', ai: 'Written by an agent through the open port, checked by the lab.' })).structuredContent;
    assert.equal(yes.ok, true); assert.match(yes.form, /issues\/new\?template=design\.yml/);
    const core = (await S.tool('check_design', { job: 'core', code: 'li a0, 42', slice: 'bb = b ^ sub;\np = a ^ bb;\ns = p ^ cin;\ncout = (a & bb) | (cin & p);\ny = (~op1 & ~op0 & (a & b)) | (~op1 & op0 & (a | b)) | (op1 & ~op0 & (a ^ b)) | (op1 & op0 & s);' })).structuredContent;
    assert.equal(core.right, true); assert.equal(core.result, 42);
  } finally { S.stop(); }
});
