/* The Open Bench Protocol (OBP), version 0: the simplest way for the lab to talk to a board.
   Any board whose firmware answers these text lines can join the bench, whatever chip or
   microcontroller it uses. One command per line, one reply per line, plain ASCII. Over a serial
   port the speed is 115200 baud. The full description, for firmware authors, is docs/HARDWARE.md.

     HELLO          →  OK OBP/0 board=<name> in=<n> out=<m> [clk=1] [key=value …]
     IN <hh>        →  OK            set the input pins (ui_in, up to 8) to the hex value hh
     OUT?           →  OK <hh>       read the output pins (uo_out, up to 8)
     CLK [n]        →  OK            give the design n clock pulses (default 1)
     RST            →  OK            pulse reset
     LIST?          →  OK <a> <b> …  optional: the designs the board can select
     SEL <name>     →  OK            optional: select a design
     anything else  →  ERR <reason>

   This file holds the protocol only: a client that speaks it over any transport, and a reference
   device that answers it (the virtual board uses it, and so do the tests). Pure logic, no DOM. */

export const OBP_VERSION = 0;
const hex2 = v => (v & 255).toString(16).toUpperCase().padStart(2, '0');

/* "OK OBP/0 board=virtual in=8 out=8" → { version: 0, board: 'virtual', in: '8', out: '8' } */
export function parseHello(line) {
  const m = /^OK OBP\/(\d+)(.*)$/.exec(String(line).trim());
  if (!m) return null;
  const info = { version: +m[1] };
  m[2].trim().split(/\s+/).filter(Boolean).forEach(kv => { const i = kv.indexOf('='); if (i > 0) info[kv.slice(0, i)] = kv.slice(i + 1); });
  return info;
}

/* A reference device. model: { board, ins?, outs?, eval(ui) → uo, clock?(ui), reset?(), designs?, select?(name) }.
   Returns handle(line) → reply. Combinational models only need eval. */
export function obpDevice(model) {
  let ui = 0;
  return function handle(raw) {
    const line = String(raw).trim(); if (!line) return '';
    const [cmd, arg] = line.split(/\s+/, 2); const C = cmd.toUpperCase();
    try {
      switch (C) {
        case 'HELLO': return 'OK OBP/' + OBP_VERSION + ' board=' + (model.board || 'unknown') + ' in=' + (model.ins || 8) + ' out=' + (model.outs || 8) + (model.clock ? ' clk=1' : '');
        case 'IN': { if (!/^[0-9a-fA-F]{1,2}$/.test(arg || '')) return 'ERR IN needs a hex value 00-FF'; ui = parseInt(arg, 16); return 'OK'; }
        case 'OUT?': return 'OK ' + hex2(model.eval(ui));
        case 'CLK': { const n = arg === undefined ? 1 : +arg; if (!(n >= 1 && n <= 1e6)) return 'ERR CLK needs a count 1-1000000'; if (model.clock) for (let k = 0; k < n; k++) model.clock(ui); return 'OK'; }
        case 'RST': if (model.reset) model.reset(); return 'OK';
        case 'LIST?': return model.designs ? 'OK ' + model.designs().join(' ') : 'ERR no designs to list';
        case 'SEL': return model.select ? (model.select(arg) ? 'OK' : 'ERR no design ' + arg) : 'ERR this board has one design';
        default: return 'ERR unknown command ' + C;
      }
    } catch (e) { return 'ERR ' + (e && e.message ? e.message : 'device error'); }
  };
}

/* A client: the same small interface every bench board offers.
   transport: { write(text), readUntil(token, ms) → text before token }. */
export function obpClient(transport, { timeout = 1500 } = {}) {
  /* Send one line and return the reply line as it is. */
  async function raw(cmd) {
    await transport.write(cmd + '\n');
    let reply = '';
    for (let k = 0; k < 5 && !reply; k++) reply = (await transport.readUntil('\n', timeout)).replace(/\r/g, '').trim();
    return reply;
  }
  async function ask(cmd) {
    const reply = await raw(cmd);
    if (/^ERR\b/.test(reply)) throw Object.assign(new Error(reply.slice(4) || 'device error'), { code: 'device', reply });
    if (!/^OK\b/.test(reply)) throw Object.assign(new Error('unexpected reply: ' + reply), { code: 'protocol', reply });
    return reply;
  }
  return {
    kind: 'obp',
    raw,
    async hello() { const info = parseHello(await ask('HELLO')); if (!info) throw Object.assign(new Error('not an OBP board'), { code: 'protocol' }); return info; },
    async setIn(v) { await ask('IN ' + hex2(v)); },
    async getOut() { const r = await ask('OUT?'); const m = /^OK ([0-9A-Fa-f]{1,2})$/.exec(r); if (!m) throw Object.assign(new Error('bad OUT? reply'), { code: 'protocol' }); return parseInt(m[1], 16); },
    async clock(n = 1) { await ask('CLK ' + n); },
    async reset() { await ask('RST'); },
    async list() { return (await ask('LIST?')).slice(2).trim().split(/\s+/).filter(Boolean); },
    async select(name) { await ask('SEL ' + name); },
    close: () => transport.close && transport.close()
  };
}
