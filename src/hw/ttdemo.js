/* The Tiny Tapeout demo board. Its RP2040 runs Tiny Tapeout's MicroPython firmware, which offers a
   Python prompt (REPL) over USB serial with a ready `tt` object. This adapter types short Python
   lines at that prompt, so the board needs no new firmware. It follows the commands documented at
   tinytapeout.com/guides/get-started-demoboard and in the tt-micropython-firmware README.

   Status: experimental. The tests check it against an imitation of the prompt, not yet against a
   real board. If you have one, please try it and tell us what happens (docs/HARDWARE.md). */

const PROMPT = '>>> ';
const sleep = ms => new Promise(r => setTimeout(r, ms));
export const isProjectName = s => /^tt_um_[A-Za-z0-9_]{1,60}$/.test(String(s || ''));

export function ttDemoClient(transport, { timeout = 3000 } = {}) {
  /* Run one line at the prompt; return what it printed. */
  async function py(line) {
    await transport.write(line + '\r\n');
    const raw = (await transport.readUntil(PROMPT, timeout)).replace(/\r/g, '');
    const lines = raw.split('\n'); if (lines[0].trim() === line.trim()) lines.shift();   // the echo
    const out = lines.join('\n').trim();
    if (/Traceback|Error:/.test(out)) throw Object.assign(new Error(out.split('\n').pop()), { code: 'device', reply: out });
    return out;
  }
  return {
    kind: 'ttdemo',
    async hello() {
      /* Ctrl-C stops anything running; then wait, forget whatever arrived, and check the prompt answers. */
      await transport.write('\x03'); await sleep(200); await transport.write('\r\n'); await sleep(300);
      if (transport.drain) transport.drain();
      let sync = '';
      try { sync = await py('print(4242)'); } catch (e) { /* handled below */ }
      if (!/4242/.test(sync)) throw Object.assign(new Error('no Python prompt answered'), { code: 'protocol' });
      try { await py('from ttboard.mode import RPMode'); await py('tt.mode = RPMode.ASIC_RP_CONTROL'); }
      catch (e) { throw Object.assign(new Error('this does not look like a Tiny Tapeout demo board: ' + e.message), { code: 'protocol' }); }
      return { version: null, board: 'ttdemo', in: '8', out: '8', clk: '1' };
    },
    async select(name) { if (!isProjectName(name)) throw Object.assign(new Error('project names look like tt_um_something'), { code: 'input' }); await py('tt.shuttle.' + name + '.enable()'); },
    async setIn(v) { await py('tt.ui_in.value = ' + (v & 255)); },
    async getOut() {
      const out = await py('print(tt.uo_out)');
      const m = /([01]{8})\s*$/.exec(out); if (!m) throw Object.assign(new Error('could not read the outputs: ' + out), { code: 'protocol' });
      return parseInt(m[1], 2);
    },
    /* A one-line loop: the prompt answers "... " and runs it after an empty line. */
    async clock(n = 1) { await py('for _ in range(' + Math.max(1, Math.min(100000, n | 0)) + '): tt.clock_project_once()\r\n'); },
    async reset() { await py('tt.reset_project(True)'); await py('tt.reset_project(False)'); },
    close: () => transport.close && transport.close()
  };
}

/* An imitation of the demo board's prompt, for tests and for trying the adapter without a board.
   chip(name) → { eval(ui) → uo } for each project on the imitated shuttle. */
export function fakeTTRepl(chips) {
  let ui = 0, cur = null, mode = false, pending = '', cont = false;
  const run = line => {
    let m;
    if (line === '\x03' || line === '') return '';
    if (line === 'from ttboard.mode import RPMode') return '';
    if (line === 'tt.mode = RPMode.ASIC_RP_CONTROL') { mode = true; return ''; }
    if ((m = /^tt\.shuttle\.(\w+)\.enable\(\)$/.exec(line))) { if (!chips[m[1]]) return 'Traceback (most recent call last):\nAttributeError: no project ' + m[1]; cur = m[1]; return ''; }
    if ((m = /^tt\.ui_in\.value = (\d+)$/.exec(line))) { ui = +m[1] & 255; return ''; }
    if (line === 'print(4242)') return '4242';
    if (line === 'print(tt.uo_out)') return (cur && mode ? chips[cur].eval(ui) & 255 : 0).toString(2).padStart(8, '0');
    if (/^for _ in range\(\d+\): tt\.clock_project_once\(\)$/.test(line)) return '';
    if (/^tt\.reset_project\((True|False)\)$/.test(line)) return '';
    return 'Traceback (most recent call last):\nNameError: ' + line;
  };
  return text => {
    pending += text; const parts = pending.split(/\r?\n/); pending = parts.pop();
    return parts.map(p => {
      const line = p.replace(/^\x03/, '').trim();
      if (cont) { cont = false; return '\r\n' + PROMPT; }
      if (/:\s*\S/.test(line) && /^for /.test(line)) { cont = true; run(line); return line + '\r\n... '; }
      const out = run(line);
      return (line ? line + '\r\n' : '') + (out ? out.replace(/\n/g, '\r\n') + '\r\n' : '') + PROMPT;
    }).join('');
  };
}
