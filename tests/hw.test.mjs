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
