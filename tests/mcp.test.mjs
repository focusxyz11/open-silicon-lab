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
  return { call, tool: async (name, args) => (await call('tools/call', { name, arguments: args })).result, line: l => p.stdin.write(l + '\n'), stop: () => p.kill() };
}

test('an agent connects, lists the tools, reads the plan and takes a job', async () => {
  const S = server();
  try {
    const init = await S.call('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    assert.equal(init.result.serverInfo.name, 'open-silicon-lab');
    assert.ok(init.result.capabilities.tools && init.result.instructions);
    const tools = (await S.call('tools/list', {})).result.tools.map(t => t.name);
    assert.deepEqual(tools, ['look', 'list_plan', 'get_job', 'check_design', 'at_factory', 'life_of', 'propose_design', 'list_ledger', 'propose_break', 'propose_try', 'propose_report', 'energy_budget', 'submit_attempt', 'block_front', 'submit_front', 'propose_question', 'choose_design', 'grow_architecture', 'architecture_forks', 'submit_architecture']);
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
    /* an agent can break the lab itself too: a report at a place, by its address, labelled as an agent's */
    const r = (await S.tool('propose_report', { at: '#/line/print', say: 'confusing', words: 'The step names the machine only after it has finished printing.', kind: 'ai', ai: 'an agent playing the line' })).structuredContent;
    assert.equal(r.ok, true); assert.match(r.entry.id, /-report-/); assert.match(r.link, /new\/main\/community\/ledger/);
    assert.equal((await S.tool('propose_report', { at: 'https://example.com', say: 'wrong', words: 'Somewhere outside the lab entirely.', kind: 'ai', ai: 'x' })).structuredContent.ok, false);
    const core = (await S.tool('check_design', { job: 'core', code: 'li a0, 42', slice: 'bb = b ^ sub;\np = a ^ bb;\ns = p ^ cin;\ncout = (a & bb) | (cin & p);\ny = (~op1 & ~op0 & (a & b)) | (~op1 & op0 & (a | b)) | (op1 & ~op0 & (a ^ b)) | (op1 & op0 & s);' })).structuredContent;
    assert.equal(core.right, true); assert.equal(core.result, 42);
  } finally { S.stop(); }
});

test('an agent reads the energy budget, pulls a lever, and submits an attempt the engine scores', async () => {
  const S = server();
  try {
    const B = (await S.tool('energy_budget', {})).structuredContent;
    assert.equal(B.ok, true); assert.equal(B.levels.length, 8); assert.equal(B.mostAt, 'board'); assert.equal(B.mostIs, 'moving');
    assert.ok(B.levers.some(l => l.id === 'cim' && l.level === 'block' && l.labName) && B.total.timesTheFloor > 1 && B.note);
    const L = (await S.tool('energy_budget', { plan: { batch: 64, precision: 'fp8' } })).structuredContent;
    assert.ok(L.total.joules < B.total.joules);
    assert.equal((await S.tool('energy_budget', { plan: { clock: 99 } })).structuredContent.ok, false);
    const open = (await S.tool('list_ledger', {})).structuredContent.open.find(o => o.do === 'attempt a puzzle');
    assert.ok(open && open.tools.includes('submit_attempt'));
    const yes = (await S.tool('submit_attempt', { plan: { batch: 256, precision: 'fp4', home: 'sram' }, kind: 'ai', ai: 'An agent read the budget and chose the plan.' })).structuredContent;
    assert.equal(yes.ok, true); assert.match(yes.entry.path, /-try-[a-z0-9-]+\.json$/); assert.ok(yes.joules > 0 && yes.facts.joules > 0);
    assert.equal(JSON.parse(yes.entry.file).puzzle, 'energy');
    assert.equal((await S.tool('submit_attempt', { plan: { batch: 256 }, kind: 'ai' })).structuredContent.ok, false, 'say how AI was used');
    assert.equal((await S.tool('submit_attempt', { plan: { home: 'cloud' }, kind: 'person' })).structuredContent.ok, false);
  } finally { S.stop(); }
});

test('an agent reads the block\'s front and submits a point the model places, checked by the ledger (#326)', async () => {
  const S = server();
  try {
    const F = (await S.tool('block_front', { plan: { p: 0.3, n: 0.7 } })).structuredContent;
    assert.equal(F.front, 'eff.geo'); assert.ok(F.today.length >= 5 && F.allMovedIn.length === F.today.length && F.question && F.note);
    assert.ok(F.attempts.length >= 4 && F.attempts.every(a => a.blockJoulesPerAnswer > 0 && ['front', 'beaten'].includes(a.state)));
    assert.ok(F.yours.blockJoulesPerAnswer < F.today[0].blockJoulesPerAnswer, 'moving memory in cuts the block\'s energy');
    const yes = (await S.tool('submit_front', { plan: { p: 0.3, n: 0.7 }, kind: 'ai', ai: 'An agent read the front and chose the point.' })).structuredContent;
    assert.equal(yes.ok, true); assert.equal(JSON.parse(yes.entry.file).front, 'eff.geo'); assert.ok(yes.placed.hottestPatch > 0);
    assert.equal((await S.tool('submit_front', { plan: { p: 0, n: 0 }, kind: 'person' })).structuredContent.ok, false, 'a point kept already');
    assert.equal((await S.tool('submit_front', { plan: { p: 0.25, n: 0 }, kind: 'person' })).structuredContent.ok, false, 'tenths only');
  } finally { S.stop(); }
});

test('an agent reads a thousand designs that pass and the people around the need, and prepares its choice with a reason', async () => {
  const S = server();
  try {
    const A = (await S.tool('choose_design', {})).structuredContent;
    assert.equal(A.need, 'phone'); assert.equal(A.designs.length, 1000); assert.equal(A.columns.length, A.designs[0].length);
    assert.deepEqual(A.people.map(p => p.id), ['user', 'repair', 'payer', 'planet', 'never']);
    assert.ok(A.choicesNoCheckScores.length === 4 && A.limits.power.value === 6 && A.note && A.how);
    /* people's choices and agents' come back apart, read from the ledger alone */
    assert.ok(Array.isArray(A.chosen.people) && Array.isArray(A.chosen.agents));
    const no = (await S.tool('choose_design', { pick: 'd0001', reason: 'short', kind: 'ai', ai: 'an agent chose' })).structuredContent;
    assert.equal(no.ok, false);
    const both = (await S.tool('choose_design', { pick: 'd0001', reason: 'A reason long enough to keep', kind: 'both', ai: 'together' })).structuredContent;
    assert.equal(both.ok, false);
    const yes = (await S.tool('choose_design', { pick: 'd0042', reason: 'It never sends what you say to a data centre', author: 'An agent', kind: 'ai', ai: 'Chosen by an AI agent through the open port.' })).structuredContent;
    assert.equal(yes.ok, true, yes.reason); assert.match(yes.entry.id, /-try-/);
    const f = JSON.parse(yes.entry.file); assert.equal(f.choice, 'phone'); assert.equal(f.pick, 'd0042'); assert.equal(f.made, 'ai'); assert.equal(f.words, 'It never sends what you say to a data centre');
    assert.match(yes.link, /new\/main\/community\/ledger/); assert.equal(yes.picked.id, 'd0042');
  } finally { S.stop(); }
});

/* Grow an architecture through the port (#410): score a recipe and a history, ask the agents' forks, take one, and
   submit the attempt; the ledger grows it again and refuses a claimed win it does not reach */
test('an agent grows an architecture through the port: scores a history, takes a fork, and submits only a win the replay reaches', async () => {
  const S = server();
  try {
    const G0 = (await S.tool('grow_architecture', { start: { where: 'near', carrier: 'spikes', told: 'events', shape: 'grid' } })).structuredContent;
    assert.equal(G0.recipe.key, 'near/spikes/events/grid'); assert.equal(G0.year, 0); assert.ok(G0.built && G0.how && G0.note);
    assert.equal(G0.needs.length, 6); assert.ok(G0.needs.every(n => typeof n.now === 'number' && n.name));
    /* the ledger's attempts, people's and agents' apart, and the first to win each need */
    assert.ok(G0.ledger.people >= 1 && G0.ledger.agents >= 1 && Object.keys(G0.ledger.firstToWin).length === 6);
    assert.equal((await S.tool('architecture_forks', { start: G0.recipe.key, years: [] })).structuredContent.forks.length, 0, 'the agents wait for the first year');
    let h = { start: G0.recipe.key, years: [['people'], ['people'], ['people']], changes: [] };
    const F = (await S.tool('architecture_forks', h)).structuredContent;
    assert.equal(F.year, 3); assert.ok(F.forks.length >= 1 && F.forks.every(f => f.name && f.then.changes.length === 1 && f.then.changes[0].at === 3));
    h = F.forks[0].then;
    /* grow on by the engine's suggestion until the recipe wins a need */
    let G = null;
    for (let i = 0; i < 25; i++) { G = (await S.tool('grow_architecture', h)).structuredContent; if (G.wins.length) break; h = Object.assign({}, h, { years: h.years.concat([G.suggest.dirs]) }); }
    assert.ok(G.wins.length >= 1, 'the forked recipe wins a need'); assert.deepEqual(G.history.wins, G.wins);
    const lie = (await S.tool('submit_architecture', { ...h, wins: ['any'], author: 'An agent', kind: 'ai', ai: 'Grown by an AI agent through the open port.' })).structuredContent;
    assert.equal(lie.ok, false, 'a win the replay does not reach'); assert.ok(lie.reason.length > 10);
    const yes = (await S.tool('submit_architecture', { ...h, author: 'An agent', kind: 'ai', ai: 'Grown by an AI agent through the open port.', words: 'A fork of the neuromorphic chip.' })).structuredContent;
    assert.equal(yes.ok, true, yes.reason); assert.match(yes.entry.id, /-try-/); assert.deepEqual(yes.reached, G.wins);
    const f = JSON.parse(yes.entry.file); assert.equal(f.made, 'ai'); assert.deepEqual(f.arch.wins, G.wins); assert.equal(f.arch.changes[0].gene, F.forks[0].gene);
    assert.ok((await S.tool('submit_architecture', { start: 'far/charge/magic/few', years: [['people']], kind: 'person' })).isError, 'a recipe the engine does not have');
    assert.ok((await S.tool('grow_architecture', { start: 'in/charge/graph/stack', years: [['luck']] })).isError, 'a direction the engine does not have');
  } finally { S.stop(); }
});

/* the front door (#372): what an agent sends is refused with a reason, never thrown on, and the port keeps serving */
test('an agent that sends a bad entry or a bad message gets a refusal, and the port stays up', async () => {
  const S = server();
  try {
    /* messages that are not requests: answered or ignored, never the end of the port */
    for (const l of ['null', '5', '"x"', '[null, 7]', '{"method": 5}', '{"jsonrpc":"2.0","id":99,"method":"tools/call","params":"x"}']) S.line(l);
    assert.deepEqual((await S.call('ping', {})).result, {}, 'the port still answers');
    const refused = async (name, args, why) => { const r = await S.tool(name, args); assert.equal(r.isError, true, why); assert.equal(r.structuredContent.ok, false, why); assert.ok(typeof r.structuredContent.reason === 'string' && r.structuredContent.reason.length > 5, why + ': a reason in words'); };
    const ask = { at: 'chip', question: 'What would a chip look like if it were designed for one model only?', kind: 'ai', ai: 'asked by an agent' };
    await refused('propose_question', { ...ask, under: ['think.chip'] }, 'under as a list');
    await refused('propose_question', { ...ask, at: 'constructor', about: 'toString' }, 'names every object has');
    for (const need of ['constructor', 'toString', '__proto__', ['phone']]) await refused('choose_design', { need }, 'the need ' + need);
    await refused('submit_attempt', { plan: { batch: 1.4 }, kind: 'ai', ai: 'an agent' }, 'a batch that is not whole');
    await refused('propose_break', { design: 'constructor', case: [{ en: 1 }], kind: 'ai', ai: 'an agent' }, 'a break of constructor');
    await refused('propose_try', { design: '__proto__', cases: [[{ en: 1 }]], kind: 'ai', ai: 'an agent' }, 'a try of __proto__');
    await refused('propose_report', { at: { toString: 1 }, say: 'wrong', words: 'words long enough here', kind: 'ai', ai: 'an agent' }, 'a place that is no string');
    await refused('propose_question', { ...ask, ai: { toString: 1 } }, 'how AI was used, not in words');
    assert.ok((await S.tool('look', { at: { toString: 1 } })).isError, 'a place to look at that is no string');
    assert.ok((await S.tool('get_job', { job: { toString: 1 } })).structuredContent.error);
  } finally { S.stop(); }
});
