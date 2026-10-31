// The bench (src/hw): the Open Bench Protocol, transports, the virtual board, twin testing and
// diagnosis, and the Tiny Tapeout demo board adapter against an imitation of its Python prompt.
// Real boards cannot run in CI, so every adapter is tested against a stand-in that follows the
// board's documented behavior; the virtual board runs the exact same path every day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TC from '../src/engines/tinychip.js';
import { obpDevice, obpClient, parseHello } from '../src/hw/obp.js';
import { loopback, lineResponder } from '../src/hw/transport.js';
import { virtualChip, virtualDevice, visibleFaults, tray, simCases } from '../src/hw/virtual.js';
import { twinTest, diagnose, wrongPins, describeNet } from '../src/hw/twin.js';
import { ttDemoClient, fakeTTRepl, isProjectName } from '../src/hw/ttdemo.js';
import { BOARDS } from '../src/hw/boards.js';

const P = id => TC.PROJ.find(p => p.id === id);
const connect = chip => obpClient(loopback(lineResponder(virtualDevice(chip))));

test('the protocol: a reference device answers every command, and errors are clear', () => {
  const h = obpDevice({ board: 'test', eval: ui => ui ^ 0xff });
  assert.deepEqual(parseHello(h('HELLO')), { version: 0, board: 'test', in: '8', out: '8' });
  assert.equal(h('IN 0f'), 'OK'); assert.equal(h('OUT?'), 'OK F0');
  assert.equal(h('in 3'), 'OK'); assert.equal(h('OUT?'), 'OK FC');
  assert.match(h('IN zz'), /^ERR /); assert.match(h('CLK 0'), /^ERR /); assert.equal(h('CLK 5'), 'OK'); assert.equal(h('RST'), 'OK');
  assert.match(h('LIST?'), /^ERR /); assert.match(h('FLY'), /^ERR unknown/); assert.equal(h(''), '');
  assert.equal(parseHello('hello'), null);
});

test('the client talks to a device over a loopback, and reports device errors', async () => {
  const log = [];
  const designs = { a: ui => ui, b: ui => ~ui };
  let cur = 'a';
  const dev = obpDevice({ board: 'multi', eval: ui => designs[cur](ui), designs: () => Object.keys(designs), select: n => (designs[n] ? (cur = n, true) : false) });
  const c = obpClient(loopback(lineResponder(dev), { onTraffic: (d, t) => log.push(d + t.trim()) }));
  assert.equal((await c.hello()).board, 'multi');
  await c.setIn(0x5a); assert.equal(await c.getOut(), 0x5a);
  assert.deepEqual(await c.list(), ['a', 'b']);
  await c.select('b'); assert.equal(await c.getOut(), 0xa5);
  await assert.rejects(c.select('zz'), e => e.code === 'device');
  assert.ok(log.includes('outIN 5A') && log.includes('inOK'));
});

test('the virtual board matches the simulation for every project', async () => {
  for (const p of TC.PROJ) {
    const chip = virtualChip(p, p.sol || p.starter); assert.ok(chip.ok, p.id);
    const res = await twinTest(simCases(chip), connect(chip), { mask: chip.mask });
    assert.ok(res.ok, p.id + ' twin test'); assert.equal(res.rows.length, 1 << p.ins.length);
    /* With a correct design, the simulation also matches the specification. */
    if (p.f) { const spec = new Map(chip.cases.map(c => [c.ui, c.uo])); simCases(chip).forEach(c => assert.equal(c.uo, spec.get(c.ui), p.id + ' spec')); }
  }
  assert.equal(virtualChip(P('add2'), 'y = a &').ok, false);
});

test('a defect shows in the twin test, and diagnosis finds the wire', async () => {
  for (const id of ['add2', 'seg', 'alu', 'vote']) {
    const p = P(id), ref = virtualChip(p, p.sol);
    const faults = visibleFaults(ref); assert.ok(faults.length > 4, id);
    for (const f of faults.filter((x, i) => i % 5 === 0)) {
      const bad = virtualChip(p, p.sol, { fault: f });
      const res = await twinTest(simCases(ref), connect(bad), { mask: ref.mask });
      assert.ok(!res.ok, id + ' fault ' + JSON.stringify(f) + ' is visible');
      assert.ok(wrongPins(res.rows) > 0);
      const sus = diagnose(ref, res.rows);
      assert.ok(sus.some(s => s.net === f.net && s.v === f.v), id + ': the real fault is among the suspects');
      sus.forEach(s => assert.ok(s.where.pin || s.where.cell, 'every suspect has a place'));
    }
  }
  const ref = virtualChip(P('add2'), P('add2').sol);
  assert.deepEqual(diagnose(ref, simCases(ref).map(c => ({ ui: c.ui, want: c.uo, got: c.uo, ok: true }))), []);
  assert.equal(describeNet(ref, ref.M.inputs[0].net).pin, ref.M.inputs[0].name);
});

test('a tray is the same for the same seed, and has exactly the faulty chips asked for', () => {
  const p = P('add2');
  const a = tray(p, p.sol, { seed: 42 }), b = tray(p, p.sol, { seed: 42 });
  assert.deepEqual(a.chips.map(c => c.fault), b.chips.map(c => c.fault));
  for (let s = 1; s < 30; s++) assert.equal(tray(p, p.sol, { seed: s }).chips.filter(c => c.fault).length, 1);
  assert.equal(tray(p, p.sol, { seed: 3, bad: 2 }).chips.filter(c => c.fault).length, 2);
});

test('the Tiny Tapeout demo board adapter works against an imitation of its prompt', async () => {
  const p = P('seg'), chip = virtualChip(p, p.sol);
  const sent = [];
  const tr = loopback(fakeTTRepl({ tt_um_seg: chip }), { onTraffic: (d, t) => d === 'out' && sent.push(t) });
  const c = ttDemoClient(tr);
  assert.equal((await c.hello()).board, 'ttdemo');
  await c.select('tt_um_seg');
  await c.clock(2); await c.reset();
  const res = await twinTest(simCases(chip), c, { mask: chip.mask });
  assert.ok(res.ok);
  assert.ok(sent.includes('tt.ui_in.value = 5\r\n') && sent.includes('print(tt.uo_out)\r\n'));
  await assert.rejects(c.select('tt_um_missing'), e => e.code === 'device');
  await assert.rejects(c.select('rm -rf'), e => e.code === 'input');
  assert.ok(isProjectName('tt_um_abc_1') && !isProjectName('tt_um_a.b()'));
});

test('a silent board times out instead of hanging', async () => {
  const c = obpClient(loopback(() => ''), { timeout: 50 });
  await assert.rejects(c.hello(), e => e.code === 'timeout');
});

test('the board list is complete and honest', () => {
  const ids = new Set();
  BOARDS.forEach(b => {
    assert.ok(!ids.has(b.id)); ids.add(b.id);
    assert.ok(['ready', 'experimental', 'planned', 'idea'].includes(b.status), b.id);
    assert.ok(b.t && b.d && b.link && b.protocol, b.id);
  });
  assert.equal(BOARDS.find(b => b.id === 'virtual').status, 'ready');
});

/* ---- One program for many boards: the MicroPython firmware, the installer, real parts ---- */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { CHECKS, conform } from '../src/hw/conformance.js';
import { installProgram, fakeMicroPython } from '../src/hw/mpinstall.js';
import { PARTS, asProject } from '../src/hw/parts.js';
import { PROFILES, wiring } from '../src/hw/profiles.js';

const FW = new URL('../src/hw/firmware/obp_bench.py', import.meta.url);
const HOST = new URL('./fixtures/firmware_host.py', import.meta.url);
const hasPython = spawnSync('python3', ['--version']).status === 0;

/* A transport to a program's stdin and stdout, like a serial port to a board. */
function processTransport(args) {
  const child = spawn('python3', args, { stdio: ['pipe', 'pipe', 'inherit'] });
  const tr = loopback(() => '');
  let buf = '', wake = null; let open = true;
  child.stdout.on('data', d => { buf += d.toString(); if (wake) { wake(); wake = null; } });
  child.on('exit', () => { open = false; if (wake) wake(); });
  return {
    write: async t => { child.stdin.write(t); },
    async readUntil(token, ms = 3000) {
      const end = Date.now() + ms;
      for (;;) {
        const i = buf.indexOf(token); if (i >= 0) { const o = buf.slice(0, i); buf = buf.slice(i + token.length); return o; }
        if (!open) throw Object.assign(new Error('closed'), { code: 'closed' });
        if (Date.now() > end) throw Object.assign(new Error('timeout'), { code: 'timeout' });
        await new Promise(r => { wake = r; setTimeout(r, 50); });
      }
    },
    close() { child.stdin.end(); child.kill(); tr.close(); }
  };
}

test('the JavaScript reference device passes every conformance check', async () => {
  const c = obpClient(loopback(lineResponder(obpDevice({ board: 'ref', eval: ui => ui }))));
  const r = await conform(c.raw);
  assert.ok(r.ok, JSON.stringify(r.checks.filter(x => !x.pass)));
  assert.equal(r.checks.length, CHECKS.length);
  /* A broken firmware is caught. */
  const sloppy = obpClient(loopback(lineResponder(line => (/^HELLO/i.test(line) ? 'OK OBP/0 board=x in=8 out=8' : 'OK'))));
  const s = await conform(sloppy.raw);
  assert.ok(!s.ok); assert.ok(s.checks.find(x => x.id === 'in-bad' && !x.pass));
});

test('the MicroPython firmware passes the conformance check and twin-tests a wired 74HC00', { skip: !hasPython && 'python3 not found' }, async () => {
  const tr = processTransport([HOST.pathname, 'pico']);
  try {
    const c = obpClient(tr, { timeout: 3000 });
    const info = await c.hello();
    assert.equal(info.board, 'host-pico'); assert.equal(info.in, '8'); assert.equal(info.out, '8');
    assert.ok((await conform(c.raw)).ok);
    assert.deepEqual(await c.list(), ['pins', 'demo-74hc00']);
    const part = PARTS.find(p => p.id === 'hc00'), chip = virtualChip(asProject(part), part.code);
    const res = await twinTest(simCases(chip), c, { mask: chip.mask });
    assert.ok(res.ok, 'the pretend 74HC00 matches the design on all 256 patterns');
    await c.select('demo-74hc00');
    assert.ok((await twinTest(simCases(chip), c, { mask: chip.mask })).ok, 'the built-in demo matches too');
  } finally { tr.close(); }
  /* A damaged chip: gate 3's output stuck at 0. The bench should name that wire. */
  const bad = processTransport([HOST.pathname, 'pico', '--broken']);
  try {
    const c = obpClient(bad, { timeout: 3000 }); await c.hello();
    const part = PARTS.find(p => p.id === 'hc00'), chip = virtualChip(asProject(part), part.code);
    const res = await twinTest(simCases(chip), c, { mask: chip.mask });
    assert.ok(!res.ok);
    const sus = diagnose(chip, res.rows);
    assert.ok(sus.some(f => f.v === 0 && f.where.outs.includes('y3')), JSON.stringify(sus.map(f => f.where)));
  } finally { bad.close(); }
  /* The ESP32-C3 profile has 4 inputs and 4 outputs, and says so. */
  const c3 = processTransport([HOST.pathname, 'esp32c3']);
  try { const info = await obpClient(c3).hello(); assert.equal(info.in, '4'); assert.equal(info.out, '4'); } finally { c3.close(); }
});

test('the page\'s pin table matches the firmware, and every part wires up', () => {
  const src = readFileSync(FW, 'utf8');
  for (const [name, p] of Object.entries(PROFILES)) {
    const m = new RegExp("'" + name + "':\\s*\\{'ui': \\[([\\d, ]+)\\], 'uo': \\[([\\d, ]+)\\], 'clk': (\\w+), 'rst': (\\w+)\\}").exec(src);
    assert.ok(m, name + ' is in the firmware');
    assert.deepEqual(m[1].split(',').map(Number), p.ui, name + ' ui');
    assert.deepEqual(m[2].split(',').map(Number), p.uo, name + ' uo');
    assert.equal(m[3] === 'None' ? null : +m[3], p.clk); assert.equal(m[4] === 'None' ? null : +m[4], p.rst);
  }
  for (const part of PARTS) {
    const chip = virtualChip(asProject(part), part.code); assert.ok(chip.ok, part.id);
    [...part.ins, ...part.outs].forEach(n => assert.ok(part.pins[n] >= 1 && part.pins[n] <= 14, part.id + ' ' + n));
    assert.equal(new Set(Object.values(part.pins)).size, Object.keys(part.pins).length, part.id + ': no pin used twice');
    assert.ok(wiring('pico', part));
  }
  assert.equal(wiring('esp32c3', PARTS.find(p => p.id === 'hc00')), null, 'four NAND gates need more pins than an ESP32-C3 profile has');
  assert.ok(wiring('esp32c3', PARTS.find(p => p.id === 'hc00x1')));
});

test('the installer writes the program through the raw prompt, then the board speaks the protocol', async () => {
  const src = readFileSync(FW, 'utf8');
  const fake = fakeMicroPython(() => obpDevice({ board: 'installed', eval: ui => ui }));
  const steps = [];
  const tr = loopback(t => fake.respond(t));
  const r = await installProgram(tr, src, { onStep: s => steps.push(s) });
  assert.equal(fake.files['main.py'], src, 'the file on the board is the program, byte for byte');
  assert.equal(r.bytes, src.length);
  assert.deepEqual([...new Set(steps)], ['stop', 'raw', 'write', 'reset']);
  const c = obpClient(tr); assert.equal((await c.hello()).board, 'installed');
  await assert.rejects(installProgram(loopback(() => ''), src, { timeout: 50 }), e => e.code === 'protocol');
  await assert.rejects(installProgram(tr, 'naïve', {}), e => e.code === 'input');
});

/* ---- Where the bench meets "Why perfect designs fail" ---- */
import { budgetCases, coverage } from '../src/hw/virtual.js';
import { DESIGN_BUGS } from '../src/hw/parts.js';

test('a test budget: fewer patterns catch fewer defects, and all patterns catch them all', async () => {
  for (const id of ['add2', 'seg', 'alu']) {
    const p = P(id), chip = virtualChip(p, p.sol), N = 1 << p.ins.length;
    assert.equal(coverage(chip, budgetCases(chip, N)), 1, id + ': the full test catches every visible stuck wire');
    assert.ok(coverage(chip, budgetCases(chip, 1)) < 1, id + ': one pattern misses some');
    let last = 0; for (let n = 1; n <= N; n *= 2) { const c = coverage(chip, budgetCases(chip, n)); assert.ok(c >= last, id + ' coverage never falls as the budget grows'); last = c; }
    /* A smaller budget is part of a larger one. */
    const small = budgetCases(chip, 4).map(c => c.ui), big = budgetCases(chip, 8).map(c => c.ui);
    small.forEach(u => assert.ok(big.includes(u)));
  }
  /* Somewhere a defect escapes a small test: a faulty chip passes. */
  const p = P('add2'); let escaped = false;
  for (let s = 1; s < 40 && !escaped; s++) {
    const T = tray(p, p.sol, { seed: s }); const bad = T.chips.find(c => c.fault);
    const r = await twinTest(budgetCases(T.base, 2), connect(bad), { mask: T.base.mask }); if (r.ok) escaped = true;
  }
  assert.ok(escaped, 'a 2-pattern test lets some defect through');
});

test('a design bug fails every chip the same way; a defect fails one', async () => {
  for (const id of Object.keys(DESIGN_BUGS)) {
    const p = P(id), T = tray(p, p.sol, { bugCode: DESIGN_BUGS[id].code });
    assert.ok(T.ok && T.design, id);
    const results = [];
    for (const c of T.chips) results.push(await twinTest(simCases(T.base), connect(c), { mask: T.base.mask }));
    assert.ok(results.every(r => !r.ok), id + ': every chip fails');
    const sig = r => r.rows.map(x => x.got).join(',');
    assert.ok(results.every(r => sig(r) === sig(results[0])), id + ': and in exactly the same way');
    assert.ok(DESIGN_BUGS[id].what.length > 20);
  }
  const p = P('seg'), T = tray(p, p.sol, { seed: 9 }); let fails = 0;
  for (const c of T.chips) if (!(await twinTest(simCases(T.base), connect(c), { mask: T.base.mask })).ok) fails++;
  assert.equal(fails, 1, 'a defect wafer has one failing chip');
});

test('a loose wire makes the chip change its mind', () => {
  const p = P('add2'), chip = virtualChip(p, p.sol, { loose: 1, seed: 5 });
  const answers = new Set(); for (let k = 0; k < 40; k++) answers.add(chip.eval(0));
  assert.ok(answers.size > 1, 'the same input gives different answers');
  const fixed = virtualChip(p, p.sol); const once = new Set(); for (let k = 0; k < 10; k++) once.add(fixed.eval(0));
  assert.equal(once.size, 1, 'a chip without a loose wire always answers the same');
});
