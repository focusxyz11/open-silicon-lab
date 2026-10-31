/* Put the bench program on a MicroPython board (ESP32, Pico, …) straight from the page, with no
   tools to install. It uses MicroPython's "raw REPL", the same mechanism as the official mpremote
   tool: Ctrl-A enters raw mode, each block of code ends with Ctrl-D and the board answers
   "OK", its output, Ctrl-D, its errors, Ctrl-D and ">". The program is written to main.py in small
   pieces, then a soft reset (Ctrl-D at the normal prompt) starts it.

   Status: experimental. The tests check it against an imitation of the raw REPL, not yet on a board.
   MicroPython itself must already be on the board (micropython.org/download). */

const sleep = ms => new Promise(r => setTimeout(r, ms));
/* Where the program is served from, next to this file. In the single-file build there is no such
   place, so the page offers the GitHub link instead. */
export const FIRMWARE_PATH = 'src/hw/firmware/obp_bench.py';
function firmwareUrl() {
  try { return new URL('./firmware/obp_bench.py', import.meta.url); } catch (e) { return FIRMWARE_PATH; }
}

/* The program as text. Throws { code: 'fetch' } if it cannot be loaded (for example offline). */
export async function loadFirmware(fetcher = fetch) {
  try { const r = await fetcher(firmwareUrl()); if (!r.ok) throw new Error(String(r.status)); return await r.text(); }
  catch (e) { throw Object.assign(new Error('could not load the bench program'), { code: 'fetch' }); }
}

/* onStep(id) reports progress: 'stop', 'raw', 'write' (with done/total), 'reset'. */
export async function installProgram(transport, source, { name = 'main.py', chunk = 192, onStep = () => {}, timeout = 4000 } = {}) {
  if (!/^[\w.-]+\.py$/.test(name)) throw Object.assign(new Error('bad file name'), { code: 'input' });
  if (/[^\x09\x0a\x0d\x20-\x7e]/.test(source)) throw Object.assign(new Error('the program must be plain ASCII'), { code: 'input' });
  onStep('stop');
  await transport.write('\r\x03\x03'); await sleep(300);
  if (transport.drain) transport.drain();
  onStep('raw');
  await transport.write('\r\x01');
  try { await transport.readUntil('raw REPL; CTRL-B to exit', timeout); await transport.readUntil('>', timeout); }
  catch (e) { throw Object.assign(new Error('no MicroPython prompt answered; is MicroPython installed?'), { code: 'protocol' }); }

  async function run(code) {
    await transport.write(code + '\x04');
    const ok = await transport.readUntil('OK', timeout);
    if (ok.trim()) throw Object.assign(new Error('the board did not accept the code: ' + ok.trim()), { code: 'protocol' });
    await transport.readUntil('\x04', timeout);                       // output
    const err = await transport.readUntil('\x04', timeout);           // errors
    await transport.readUntil('>', timeout);
    if (err.trim()) throw Object.assign(new Error(err.trim().split('\n').pop()), { code: 'device', reply: err });
  }
  await run("f=open('" + name + "','w')");
  const parts = []; for (let i = 0; i < source.length; i += chunk) parts.push(source.slice(i, i + chunk));
  for (let k = 0; k < parts.length; k++) { await run('f.write(' + JSON.stringify(parts[k]) + ')'); onStep('write', k + 1, parts.length); }
  await run('f.close()');
  /* Check what was written by its length, then leave raw mode and restart into the program. */
  await transport.write("import os\nprint('SIZE', os.stat('" + name + "')[6])\x04");
  await transport.readUntil('OK', timeout);
  const out = await transport.readUntil('\x04', timeout); await transport.readUntil('\x04', timeout); await transport.readUntil('>', timeout);
  const m = /SIZE (\d+)/.exec(out);
  if (!m || +m[1] !== source.length) throw Object.assign(new Error('the file on the board has the wrong size'), { code: 'device' });
  onStep('reset');
  await transport.write('\x02'); await sleep(200);
  await transport.write('\x04'); await sleep(1500);
  if (transport.drain) transport.drain();
  return { bytes: source.length, pieces: parts.length };
}

/* An imitation of a MicroPython board, for tests: a normal prompt, the raw REPL with just enough
   Python to write a file, and a soft reset that starts main.py as a line-by-line device
   (startProgram(source) → handle(line) → reply). */
export function fakeMicroPython(startProgram) {
  const files = {}; let mode = 'normal', buf = '', file = null, program = null, part = '';
  const exec = code => {
    let m;
    for (const line of code.split('\n')) {
      const l = line.trim(); if (!l) continue;
      if ((m = /^f=open\('([\w.-]+)','w'\)$/.exec(l))) { file = m[1]; files[file] = ''; }
      else if ((m = /^f\.write\(("(?:[^"\\]|\\.)*")\)$/.exec(l))) { if (file === null) return ['', 'OSError: no file']; files[file] += JSON.parse(m[1]); }
      else if (l === 'f.close()') file = null;
      else if (l === 'import os') { /* fine */ }
      else if ((m = /^print\('SIZE', os\.stat\('([\w.-]+)'\)\[6\]\)$/.exec(l))) { if (!(m[1] in files)) return ['', 'OSError: ENOENT']; return ['SIZE ' + files[m[1]].length + '\r\n', '']; }
      else return ['', 'SyntaxError: ' + l];
    }
    return ['', ''];
  };
  const respond = text => {
    let out = '';
    for (const ch of text) {
      if (program) { part += ch; if (ch === '\n') { const r = program(part.replace(/\r?\n$/, '')); part = ''; if (r) out += r + '\r\n'; } continue; }
      if (mode === 'raw') {
        if (ch === '\x04') { const [o, e] = exec(buf); buf = ''; out += 'OK' + o + '\x04' + e + '\x04>'; }
        else if (ch === '\x02') { mode = 'normal'; out += '\r\nMicroPython (imitation)\r\n>>> '; }
        else if (ch === '\x03') buf = '';
        else buf += ch;
        continue;
      }
      if (ch === '\x01') { mode = 'raw'; buf = ''; out += 'raw REPL; CTRL-B to exit\r\n>'; }
      else if (ch === '\x03') out += '\r\n>>> ';
      else if (ch === '\x04') { out += 'MPY: soft reboot\r\n'; if (files['main.py']) program = startProgram(files['main.py']); else out += '>>> '; }
    }
    return out;
  };
  return { respond, files };
}
