/* Lab: THE BENCH. Pick a board, put a design on it, try it by hand, then twin-test it: every input
   pattern on the board and in the simulation. The virtual board is always there; real boards join
   through src/hw (see docs/HARDWARE.md). This file only draws; the protocol, transports, adapters
   and the comparison live in osl/hw/. */
import { $ } from 'osl/core/ui.js';
import TC from 'osl/engines/tinychip.js';
import { BOARDS, boardById } from 'osl/hw/boards.js';
import { virtualChip, virtualDevice, simCases, visibleFaults } from 'osl/hw/virtual.js';
import { obpClient } from 'osl/hw/obp.js';
import { ttDemoClient, isProjectName } from 'osl/hw/ttdemo.js';
import { loopback, lineResponder, serialTransport, hasSerial } from 'osl/hw/transport.js';
import { twinTest, diagnose, wrongPins } from 'osl/hw/twin.js';
import { chipDesign, stampChip } from 'osl/app/mychip.js';
import { PARTS, partById, asProject } from 'osl/hw/parts.js';
import { PROFILES, wiring } from 'osl/hw/profiles.js';
import { conform } from 'osl/hw/conformance.js';
import { installProgram, loadFirmware } from 'osl/hw/mpinstall.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATUS = { ready: 'Ready', experimental: 'Experimental', planned: 'Planned', idea: 'Open idea' };
const CHECK_T = { hello: 'Says hello in OBP/0, with its name', 'hello-pins': 'Says how many input and output pins it has (1 to 8)', in: 'Accepts IN 00', out: 'Answers OUT? with two hex digits', 'in-bad': 'Refuses a bad IN value with ERR', lower: 'Accepts lower-case commands', clk: 'Accepts CLK', 'clk-n': 'Accepts CLK 3', 'clk-bad': 'Refuses CLK 0 with ERR', rst: 'Accepts RST', list: 'Lists its designs (optional)', unknown: 'Answers an unknown command with ERR' };
const FW_LINK = 'https://github.com/focusxyz11/open-silicon-lab/blob/main/src/hw/firmware/obp_bench.py';
const ISSUES = 'https://github.com/focusxyz11/open-silicon-lab/issues/new?labels=hardware&title=';
const SEG = { a: [10, 4, 30, 6], b: [38, 8, 6, 26], c: [38, 40, 6, 26], d: [10, 66, 30, 6], e: [4, 40, 6, 26], f: [4, 8, 6, 26], g: [10, 35, 30, 6] };
export const bits = (v, n) => v.toString(2).padStart(n, '0');
const differsFromSpec = chip => { const spec = new Map(chip.cases.map(c => [c.ui, c.uo & chip.mask])); return simCases(chip).some(c => (c.uo & chip.mask) !== spec.get(c.ui)); };

/* Words for a suspect wire, shared with the tray lab. */
export function whereText(f, chip) {
  const w = f.where, at = ' stuck at ' + f.v;
  if (w.pin) return 'Input pin ' + w.pin + at;
  if (w.cell) return 'The output of gate ' + (w.cell.index + 1) + ' (' + w.cell.type + ')' + at + (w.outs.length ? ', which is output ' + w.outs.join(', ') : '');
  return 'Wire n' + f.net + at;
}
export function diagHTML(chip, res) {
  if (res.ok) return '';
  const pins = wrongPins(res.rows); const names = chip.pins.outs.filter((n, i) => pins >> i & 1);
  const sus = diagnose(chip, res.rows);
  return '<div class="callout"><b>Wrong on ' + res.fail + ' of ' + res.rows.length + ' patterns, on output' + (names.length > 1 ? 's ' : ' ') + names.join(', ') + '.</b> ' +
    (sus.length ? 'A single stuck wire that explains every wrong answer: <ul class="ilist">' + sus.slice(0, 6).map(f => '<li>' + esc(whereText(f, chip)) + '</li>').join('') + '</ul>' + (sus.length > 1 ? '<span class="small muted">More than one wire fits: the test cannot tell them apart. Engineers add test points to split such cases.</span>' : '')
      : 'No single stuck wire explains these answers. Maybe two defects, a different design on the board, a loose connection, or a timing problem the simulation does not model.') + '</div>';
}

export function init() {
  if (!$('#bhBoards')) return;
  const S = { board: 'virtual', design: 'mine', defect: false, client: null, transport: null, chip: null, ui: 0, log: [], busy: false, tt: '', info: null, boardDesigns: null, boardDesign: null, checks: null, profile: 'pico' };

  /* ---- the conversation log ---- */
  function traffic(dir, text) {
    text.split(/\r?\n/).forEach((l, i, a) => { if (!l || (i === a.length - 1 && !l)) return; S.log.push((dir === 'out' ? '→ ' : '← ') + l.replace(/\x03/g, '^C')); });
    if (S.log.length > 80) S.log.splice(0, S.log.length - 80);
    const pre = $('#bhLog'); if (pre) pre.textContent = S.log.join('\n');
  }

  /* ---- designs: yours from the studio, or the studio's projects (solved) ---- */
  const designs = () => [{ id: 'mine', t: 'Your chip' }].concat(PARTS.map(p => ({ id: p.id, t: p.t, part: true })), TC.PROJ.map(p => ({ id: p.id, t: p.t })));
  function build() {
    let proj, code;
    const part = partById(S.design);
    if (S.design === 'mine') { const d = chipDesign(); proj = TC.PROJ.find(p => p.id === d.p) || TC.PROJ[0]; code = d.code; }
    else if (part) { proj = asProject(part); code = part.code; }
    else { proj = TC.PROJ.find(p => p.id === S.design); code = proj.sol || proj.starter; }
    let fault = null;
    const ref = virtualChip(proj, code);
    if (ref.ok && S.defect && S.board === 'virtual') { const pool = visibleFaults(ref); fault = pool[Math.floor(Math.random() * pool.length)] || null; }
    S.chip = ref.ok ? ref : null; S.chipOnBoard = ref.ok ? virtualChip(proj, code, { fault }) : null;
    S.proj = proj; S.errs = ref.ok ? null : ref.errs;
  }

  /* ---- boards ---- */
  $('#bhBoards').innerHTML = BOARDS.map(b => {
    const can = b.status === 'ready' || b.status === 'experimental';
    return '<button type="button" role="radio" class="bhcard ' + b.status + '" data-b="' + b.id + '"' + (can ? '' : ' aria-disabled="true"') + '><span class="pill ' + b.status + '">' + STATUS[b.status] + '</span><b>' + esc(b.t) + '</b><small>' + esc(b.d) + '</small></button>';
  }).join('');
  $('#bhBoards').addEventListener('click', e => {
    const c = e.target.closest('[data-b]'); if (!c || c.getAttribute('aria-disabled') === 'true') return;
    if (S.busy) return;
    pickBoard(c.dataset.b);
  });
  $('#bhStatus').innerHTML = BOARDS.map(b => '<li><span class="pill ' + b.status + '">' + STATUS[b.status] + '</span> <b>' + esc(b.t) + '</b>' + (b.status === 'ready' ? '' : ' · <a href="' + ISSUES + encodeURIComponent((b.status === 'experimental' ? 'Tested: ' : 'Help build: ') + b.t) + '" target="_blank" rel="noopener">' + (b.status === 'experimental' ? 'I tried it' : 'I can help') + '</a>') + '</li>').join('');

  async function disconnect() {
    if (S.transport && S.transport.close) { try { await S.transport.close(); } catch (e) { /* ignore */ } }
    S.client = null; S.transport = null; S.out = null; S.info = null; S.boardDesigns = null; S.boardDesign = null; S.checks = null;
  }
  async function pickBoard(id) {
    await disconnect(); S.board = id; S.log = []; traffic('in', '');
    if (id === 'virtual') await connectVirtual();
    render();
  }
  async function connectVirtual() {
    build();
    if (!S.chipOnBoard) { S.client = null; return; }
    S.transport = loopback(lineResponder(virtualDevice(S.chipOnBoard)), { onTraffic: traffic });
    S.client = obpClient(S.transport);
    await S.client.hello();
    await sendInputs();
  }
  async function connectSerial() {
    const b = boardById(S.board);
    try {
      S.busy = true; status('Waiting for you to pick the board in the browser\'s dialog…');
      S.transport = await serialTransport({ onTraffic: traffic });
      S.client = b.protocol === 'ttdemo' ? ttDemoClient(S.transport) : obpClient(S.transport);
      status('Saying hello…');
      const info = await S.client.hello();
      await afterHello(info, b);
      status('Connected: ' + (info.board || b.t) + (info.version !== null && info.version !== undefined ? ' · OBP/' + info.version : '') + (b.protocol === 'ttdemo' ? '. Now select the project on the chip that matches your design.' : '.'), 'good');
      if (b.protocol !== 'ttdemo') await sendInputs();
    } catch (e) {
      await disconnect();
      status(errText(e), 'bad');
    } finally { S.busy = false; renderConnect(); }
  }
  async function afterHello(info, b) {
    S.info = info;
    if (PROFILES[info.board]) S.profile = info.board;
    if (b.protocol === 'obp') { try { S.boardDesigns = await S.client.list(); S.boardDesign = S.boardDesigns[0] || null; } catch (e) { S.boardDesigns = null; } }
  }
  /* Put the bench program on a MicroPython board, then talk to it. */
  async function install() {
    const b = boardById(S.board);
    try {
      S.busy = true; status('Loading the bench program…');
      const src = await loadFirmware();
      status('Waiting for you to pick the board in the browser\'s dialog…');
      S.transport = await serialTransport({ onTraffic: traffic });
      await installProgram(S.transport, src, { onStep: (step, k, n) => status({ stop: 'Stopping whatever runs on the board…', raw: 'Opening MicroPython\'s raw prompt…', write: 'Writing main.py: piece ' + k + ' of ' + n + '…', reset: 'Restarting the board into the bench program…' }[step]) });
      S.client = obpClient(S.transport);
      const info = await S.client.hello();
      await afterHello(info, b);
      status('Installed and connected: ' + info.board + ', ' + info.in + ' inputs and ' + info.out + ' outputs. It starts by itself from now on.', 'good');
      await sendInputs();
    } catch (e) {
      await disconnect();
      status(errText(e), 'bad');
    } finally { S.busy = false; renderConnect(); }
  }
  const errText = e => ({ 'no-serial': 'This browser cannot open USB serial ports.', cancelled: 'No board was chosen.', busy: 'The port could not be opened. Close other programs using the board (a serial monitor, Thonny, the Tiny Tapeout Commander) and try again.', timeout: 'The board did not answer in time. Check the cable, then try again.', protocol: 'The board answered, but not in the expected way: ' + e.message, device: 'The board reported an error: ' + e.message, closed: 'The board was disconnected.', fetch: 'The bench program could not be loaded. Download it from GitHub instead and copy it to the board as main.py.', input: e.message }[e.code] || ('Something went wrong: ' + e.message));
  function status(text, kind) { const el = $('#bhConnStat'); if (el) { el.textContent = text; el.className = 'small ' + (kind === 'good' ? 'ok' : kind === 'bad' ? 'bad' : 'muted'); } }

  function renderConnect() {
    const box = $('#bhConnect'); const b = boardById(S.board);
    if (b.link !== 'serial') { box.hidden = true; return; }
    box.hidden = false;
    if (!hasSerial()) {
      box.innerHTML = '<div class="callout"><p><b>This browser cannot talk to USB boards.</b> Web Serial works in Chrome, Edge, Opera and Brave on computers, and in Firefox from version 151. Safari, iPhones and iPads do not support it yet. The virtual board works everywhere.</p></div>' + wiringHTML();
      const pf0 = $('#bhProf'); if (pf0) pf0.addEventListener('click', e => { const x = e.target.closest('[data-prof]'); if (x) { S.profile = x.dataset.prof; renderConnect(); } });
      return;
    }
    box.innerHTML = '<div class="callout warn"><p><b>Experimental.</b> This connection is tested against an imitation of the board, not yet on real hardware. If you have one, try it and <a href="' + ISSUES + encodeURIComponent('Tested: ' + b.t) + '" target="_blank" rel="noopener">tell us what happened</a>.</p></div>' +
      '<div class="row">' + (S.client ? '<button type="button" class="btn" id="bhDisc">Disconnect</button>' : '<button type="button" class="btn primary" id="bhConn">Connect a board…</button>' + (b.install ? '<button type="button" class="btn" id="bhInst">Install the bench program…</button>' : '')) + '<span id="bhConnStat" class="small muted">' + (S.client ? 'Connected' + (S.info ? ': ' + esc(S.info.board) + ', ' + esc(S.info.in) + ' inputs, ' + esc(S.info.out) + ' outputs' : '') + '.' : 'Plug the board in with a USB cable, then connect.') + '</span></div>' +
      (b.install && !S.client ? '<p class="small muted">First time? Put MicroPython on the board (<a href="https://micropython.org/download/" target="_blank" rel="noopener">micropython.org/download</a>), then press <i>Install the bench program</i>. Or <a href="' + FW_LINK + '" target="_blank" rel="noopener">download the program</a> and copy it to the board as main.py yourself.</p>' : '') +
      (S.client && S.boardDesigns ? '<div class="row"><span class="small">On the board:</span><div class="seg" id="bhOnBoard">' + S.boardDesigns.map(n => '<button type="button" data-sel="' + esc(n) + '" aria-pressed="' + (n === S.boardDesign ? 'true' : 'false') + '">' + esc(n) + '</button>').join('') + '</div></div>' : '') +
      (S.client && b.protocol === 'obp' ? '<div class="row"><button type="button" class="btn" id="bhCheck">Check this board against the protocol</button></div>' + checksHTML() : '') +
      (b.protocol === 'ttdemo' && S.client ? '<div class="row"><label class="small" for="bhTT">Project on the chip</label><input id="bhTT" placeholder="tt_um_…" value="' + esc(S.tt) + '" autocomplete="off" spellcheck="false"><button type="button" class="btn" id="bhTTsel">Select it</button></div>' : '') + wiringHTML();
    const pf = $('#bhProf'); if (pf) pf.addEventListener('click', e => { const x = e.target.closest('[data-prof]'); if (x) { S.profile = x.dataset.prof; renderConnect(); } });
    const c = $('#bhConn'); if (c) c.addEventListener('click', connectSerial);
    const ins = $('#bhInst'); if (ins) ins.addEventListener('click', install);
    const ob = $('#bhOnBoard'); if (ob) ob.addEventListener('click', async e => { const x = e.target.closest('[data-sel]'); if (!x || S.busy) return; try { await S.client.select(x.dataset.sel); S.boardDesign = x.dataset.sel; renderConnect(); await sendInputs(); } catch (err) { status(errText(err), 'bad'); } });
    const ck = $('#bhCheck'); if (ck) ck.addEventListener('click', async () => { if (S.busy) return; S.busy = true; try { S.checks = await conform(S.client.raw); } catch (e) { status(errText(e), 'bad'); } S.busy = false; renderConnect(); await sendInputs(); });
    const d = $('#bhDisc'); if (d) d.addEventListener('click', async () => { await disconnect(); render(); });
    const s = $('#bhTTsel'); if (s) s.addEventListener('click', async () => {
      const name = $('#bhTT').value.trim(); S.tt = name;
      if (!isProjectName(name)) { status('Tiny Tapeout project names look like tt_um_yourname_project.', 'bad'); return; }
      try { await S.client.select(name); status('Selected ' + name + '.', 'good'); await sendInputs(); } catch (e) { status(errText(e), 'bad'); }
    });
  }

  function checksHTML() {
    if (!S.checks) return '';
    const n = S.checks.checks.filter(c => c.pass).length;
    return '<div class="bhchecks"><b class="' + (S.checks.ok ? 'ok' : 'bad') + '">' + (S.checks.ok ? 'This board follows OBP/0: ' : 'Not quite: ') + n + ' of ' + S.checks.checks.length + ' checks pass.</b><ul class="ilist small">' +
      S.checks.checks.map(c => '<li class="' + (c.pass ? 'ok' : 'bad') + '">' + (c.pass ? '✓ ' : '✗ ') + esc(CHECK_T[c.id] || c.id) + ' <code>' + esc(c.send) + '</code> → <code>' + esc(c.reply || '(nothing)') + '</code></li>').join('') + '</ul></div>';
  }
  /* Where each wire goes, for a real chip on a MicroPython board. */
  function wiringHTML() {
    const part = partById(S.design);
    if (S.board !== 'mpbench') return '';
    const prof = '<div class="seg" id="bhProf" role="group" aria-label="Your board">' + Object.entries(PROFILES).map(([k, p]) => '<button type="button" data-prof="' + k + '" aria-pressed="' + (k === S.profile ? 'true' : 'false') + '">' + esc(p.t) + '</button>').join('') + '</div>';
    if (!part) return '<div class="bhwire"><p class="eyebrow">Wiring</p><p class="small">To test a real chip, choose <i>' + esc(PARTS[0].t) + '</i> or <i>' + esc(PARTS[1].t) + '</i> under <b>What is on it</b>, and this shows where each wire goes. Without wiring anything, select <code>demo-74hc00</code> on the board to check the connection.</p></div>';
    const W = wiring(S.profile, part);
    return '<div class="bhwire"><p class="eyebrow">Wiring · ' + esc(part.chip) + ' on a breadboard</p>' + prof +
      (W ? '<table class="tt bhwt"><thead><tr><th>Board</th><th></th><th>' + esc(part.chip) + '</th></tr></thead><tbody>' +
        W.map(w => w.dir === 'in' ? '<tr><td>' + w.gpio + ' <small>ui_in[' + w.bit + ']</small></td><td>→</td><td>pin ' + w.chipPin + ' <small>' + esc(w.signal) + '</small></td></tr>' : '<tr><td>' + w.gpio + ' <small>uo_out[' + w.bit + ']</small></td><td>←</td><td>pin ' + w.chipPin + ' <small>' + esc(w.signal) + '</small></td></tr>').join('') +
        '<tr><td>3V3</td><td>→</td><td>pin ' + part.power.vcc + ' <small>VCC</small></td></tr><tr><td>GND</td><td>→</td><td>pin ' + part.power.gnd + ' <small>GND</small></td></tr></tbody></table>' +
        '<p class="small"><b>Power the chip from 3V3, never 5 V:</b> these boards\' pins are 3.3 V and are damaged by 5 V. Pin 1 of the chip is next to the notch or dot. Wire it with the USB cable unplugged.</p>'
        : '<p class="small bad">This board has fewer pins than the chip needs. Choose <i>' + esc(PARTS[1].t) + '</i>, or a board with more pins.</p>') + '</div>';
  }

  /* Does the design fit the board's pins? */
  const fits = () => !S.info || !S.chip || (S.chip.pins.ins.length <= +S.info.in && S.chip.pins.outs.length <= +S.info.out);

  /* ---- the board by hand ---- */
  async function sendInputs() {
    if (!S.chip) return;
    if (!S.client) { drawPins(); return; }
    try { await S.client.setIn(S.ui); S.out = (await S.client.getOut()) & S.chip.mask; } catch (e) { status(errText(e), 'bad'); S.out = null; }
    drawPins();
  }
  function drawPins() {
    const chip = S.chip; if (!chip) return;
    const ins = chip.pins.ins, outs = chip.pins.outs, sim = chip.evalWith(S.ui, null);
    $('#bhIns').innerHTML = ins.map((n, i) => [n, i]).reverse().map(([n, i]) => '<button type="button" class="bhswb" data-i="' + i + '" aria-pressed="' + ((S.ui >> i) & 1 ? 'true' : 'false') + '" aria-label="Input ' + esc(n) + ' (ui_in[' + i + '])"><i></i><span>' + esc(n) + '</span><small>' + i + '</small></button>').join('');
    $('#bhOuts').innerHTML = outs.map((n, i) => [n, i]).reverse().map(([n, i]) => {
      const on = S.out != null && (S.out >> i) & 1, want = (sim >> i) & 1, diff = S.out != null && on !== want;
      return '<span class="bhled' + (on ? ' on' : '') + (diff ? ' diff' : '') + '" title="' + esc(n) + ': board ' + (S.out == null ? '?' : on) + ', simulation ' + want + '"><i></i><span>' + esc(n) + '</span><small>' + i + '</small></span>';
    }).join('');
    const isSeg = 'abcdefg'.split('').every(s => outs.includes(s));
    const seg = $('#bhSeg'); seg.hidden = !isSeg;
    if (isSeg) seg.innerHTML = '<svg viewBox="0 0 48 76" aria-label="Seven-segment display">' + Object.entries(SEG).map(([k, r]) => { const i = outs.indexOf(k); const on = S.out != null && (S.out >> i) & 1; return '<rect x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="2" class="' + (on ? 'on' : '') + '"/>'; }).join('') + '</svg>';
    const diff = S.out != null && S.out !== sim;
    $('#bhHand').innerHTML = !S.client ? 'No board connected yet. The simulation says uo_out = ' + bits(sim, outs.length) + '.' : S.out == null ? 'No reading from the board.' : 'ui_in = ' + bits(S.ui, ins.length) + ' → uo_out = ' + bits(S.out, outs.length) + (diff ? ' <b class="bad">· the simulation says ' + bits(sim, outs.length) + '</b>' : ' · matches the simulation');
  }
  $('#bhIns').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b || S.busy) return; S.ui ^= 1 << +b.dataset.i; sendInputs(); });
  $('#bhClk').addEventListener('click', async () => { if (!S.client) return; try { await S.client.clock(1); await sendInputs(); $('#bhHand').insertAdjacentHTML('beforeend', ' · clock pulsed (these designs have no clock, so nothing changes)'); } catch (e) { status(errText(e), 'bad'); } });
  $('#bhRst').addEventListener('click', async () => { if (!S.client) return; try { await S.client.reset(); await sendInputs(); } catch (e) { status(errText(e), 'bad'); } });

  /* ---- designs ---- */
  $('#bhDesign').addEventListener('click', async e => {
    const b = e.target.closest('[data-d]'); if (!b || S.busy) return;
    S.design = b.dataset.d; S.ui = 0;
    if (S.board === 'virtual') { await disconnect(); await connectVirtual(); } else build();
    render();
  });
  $('#bhDesignNote').addEventListener('change', async e => { if (e.target.id === 'bhDefect') { S.defect = e.target.checked; await disconnect(); await connectVirtual(); render(); } });
  document.addEventListener('osl:chip', async () => { if (S.design === 'mine' && S.board === 'virtual' && !S.busy) { await disconnect(); await connectVirtual(); render(); } });

  /* ---- the twin test ---- */
  $('#bhRun').addEventListener('click', async () => {
    if (!S.client || !S.chip || S.busy || !fits()) return;
    S.busy = true; $('#bhRun').disabled = true; $('#bhDiag').innerHTML = '';
    const cases = simCases(S.chip), n = S.chip.pins.ins.length;
    $('#bhGrid').innerHTML = cases.map(c => '<span title="ui_in ' + bits(c.ui, n) + '">' + bits(c.ui, n) + '</span>').join('');
    const cells = $('#bhGrid').children;
    try {
      const res = await twinTest(cases, S.client, { mask: S.chip.mask, onRow: (r, k) => { cells[k].className = r.ok ? 'ok' : 'bad'; if (!r.ok) cells[k].title += ': board ' + bits(r.got, S.chip.pins.outs.length) + ', simulation ' + bits(r.want, S.chip.pins.outs.length); } });
      $('#bhRunTag').innerHTML = res.ok ? '<b class="ok">All ' + res.rows.length + ' patterns match.</b>' : '<b class="bad">' + res.fail + ' of ' + res.rows.length + ' patterns differ.</b>';
      $('#bhDiag').innerHTML = diagHTML(S.chip, res) + (res.ok && S.design === 'mine' ? '<p class="small">Stamped in <a href="#mychip">your chip\'s passport</a>: on the bench.</p>' : '');
      if (res.ok && S.design === 'mine') stampChip('bench');
      $('#bhTag').textContent = res.ok ? 'Twin test passed' : 'Twin test: ' + res.fail + ' differ';
      S.ui = 0; await sendInputs();
    } catch (e) { $('#bhRunTag').innerHTML = '<b class="bad">' + esc(errText(e)) + '</b>'; }
    S.busy = false; $('#bhRun').disabled = false;
  });

  function render() {
    $('#bhBoards').querySelectorAll('[data-b]').forEach(c => c.setAttribute('aria-checked', c.dataset.b === S.board ? 'true' : 'false'));
    $('#bhDesign').innerHTML = designs().map(d => '<button type="button" data-d="' + d.id + '" aria-pressed="' + (d.id === S.design ? 'true' : 'false') + '">' + esc(d.t) + '</button>').join('');
    const note = S.errs ? '<b class="bad">Your design has an error, so it cannot be built:</b> ' + esc(S.errs[0].m || S.errs[0]) + ' <a href="#tiny">Fix it in the studio →</a>'
      : S.design === 'mine' ? 'The design you are building in the <a href="#tiny">tiny chip studio</a>: ' + esc(S.proj.t) + '.' + (S.chip && S.proj.f && differsFromSpec(S.chip) ? ' <span class="muted">(It still differs from the project\'s specification; the studio\'s verify step shows where. The twin test compares the board with your design as written.)</span>' : '')
      : partById(S.design) ? 'A real chip you can buy for a few cents. ' + esc(S.proj.d) + (S.board === 'mpbench' ? ' The wiring is shown above, under the choice of board.' : ' Test the real one with an ESP32 or Pico: pick that board above.')
      : 'The tiny chip studio\'s <i>' + esc(S.proj.t) + '</i> project, solved. ' + esc(S.proj.d.split(/(?<=\.) /)[0]);
    $('#bhDesignNote').innerHTML = note + (S.board === 'virtual' && S.chip ? '<label class="bhdef"><input type="checkbox" id="bhDefect"' + (S.defect ? ' checked' : '') + '> Make the virtual chip like a real one: give it a random manufacturing defect</label>' : '');
    $('#bhChipName').textContent = S.proj ? S.proj.t : 'chip';
    $('#bhGrid').innerHTML = ''; $('#bhDiag').innerHTML = ''; $('#bhRunTag').textContent = '';
    $('#bhTag').textContent = boardById(S.board).t + (S.client ? ' · connected' : '');
    $('#bhRun').disabled = !S.client || !S.chip || !fits();
    if (!fits()) $('#bhDesignNote').insertAdjacentHTML('beforeend', '<p class="small bad">This design needs ' + S.chip.pins.ins.length + ' inputs and ' + S.chip.pins.outs.length + ' outputs; the board has ' + S.info.in + ' and ' + S.info.out + '.</p>');
    renderConnect();
    if (S.chip) drawPins(); else { $('#bhIns').innerHTML = ''; $('#bhOuts').innerHTML = ''; $('#bhHand').textContent = '–'; }
  }

  build(); render();
  connectVirtual().then(render).catch(() => render());
}
