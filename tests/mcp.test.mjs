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
    assert.deepEqual(tools, ['list_plan', 'get_job', 'check_design', 'at_factory', 'life_of', 'propose_design', 'list_ledger', 'propose_break', 'propose_try', 'propose_question']);
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
    const perfect = (await S.tool('life_of', { job: 'vote', code: 'y = (a & b) | (b & c) | (a & c);', where: 'car' })).structuredContent;
    assert.equal(perfect.right, true); assert.equal(perfect.ships, false); assert.ok(perfect.failedByEnd.timing > 0.5);
    const careful = (await S.tool('life_of', { job: 'vote', code: 'y = (a & b) | (b & c) | (a & c);', where: 'car', choices: { margin: 6, grid: true, protect: 'logic', hot: true, burn: true } })).structuredContent;
    assert.equal(careful.ships, true); assert.ok(careful.soldMHz > 0);
    assert.ok((await S.tool('life_of', { job: 'vote', code: 'y = a;', where: 'moon' })).isError);
    const no = await S.tool('propose_design', { need: 'safety', code: 'y = (a & b) | (a & c);', kind: 'ai', ai: 'an agent wrote it' });
    assert.equal(no.isError, true);
    const noSay = (await S.tool('propose_design', { need: 'display', code: 'a = 1;', kind: 'ai' })).structuredContent;
    assert.equal(noSay.ok, false);
    const yes = (await S.tool('propose_design', { need: 'half', code: 'sum = a ^ b;\ncarry = a & b;', kind: 'ai', ai: 'Written by an agent through the open port, checked by the lab.' })).structuredContent;
    assert.equal(yes.ok, true); assert.match(yes.link, /\/new\/main\/community\/ledger\?filename=/); assert.match(yes.entry.path, /^community\/ledger\/\d{4}-\d\d-\d\d-design-[a-z0-9-]+\.json$/);
    assert.equal(JSON.parse(yes.entry.file).piece, 'half');
    /* the ledger: an agent reads what stands and what is open, breaks a design that passed its check with a case the
       check never tried, and cannot break one that is right, or with a case that does not fail it */
    const L = (await S.tool('list_ledger', {})).structuredContent, target = L.open.find(o => o.do === 'break' && o.insideTheComputer);
    assert.ok(L.entries.length >= 4 && target && L.note);
    const miss = (await S.tool('propose_break', { design: target.design, case: [{ en: 1 }, { en: 0 }], kind: 'ai', ai: 'an agent tried a case' })).structuredContent;
    assert.equal(miss.ok, false);
    const hit = (await S.tool('propose_break', { design: target.design, case: [{ en: 1 }, { en: 1 }, { en: 1 }, { en: 0 }, { en: 0 }], kind: 'ai', ai: 'An agent searched for a case the test never tried.' })).structuredContent;
    assert.equal(hit.ok, true); assert.equal(hit.facts.tick, 5); assert.ok(hit.ticks[4].wrong && !hit.ticks[3].wrong);
    const q = (await S.tool('propose_question', { at: 'check', under: 'fail.check', question: 'If a case can break a design that passed, who decides how many cases are enough?', noticed: 'The counter passed thirteen ticks and failed on the fourteenth kind.', kind: 'ai', ai: 'asked by an agent' })).structuredContent;
    assert.equal(q.ok, true);
    assert.equal((await S.tool('propose_question', { at: 'check', question: 'Not a question', kind: 'person' })).structuredContent.ok, false);
    const core = (await S.tool('check_design', { job: 'core', code: 'li a0, 42', slice: 'bb = b ^ sub;\np = a ^ bb;\ns = p ^ cin;\ncout = (a & bb) | (cin & p);\ny = (~op1 & ~op0 & (a & b)) | (~op1 & op0 & (a | b)) | (op1 & ~op0 & (a ^ b)) | (op1 & op0 & s);' })).structuredContent;
    assert.equal(core.right, true); assert.equal(core.result, 42);
  } finally { S.stop(); }
});
