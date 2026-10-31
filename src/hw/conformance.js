/* A conformance check for the Open Bench Protocol: run it against any board to see whether its
   firmware follows OBP/0. The bench offers it as "Check this board", and the tests run it against
   the JavaScript reference device and the MicroPython firmware. Each check: what to send, and a test
   of the reply. Checks marked optional may answer ERR. Pure logic, no DOM, no sentences for readers:
   each check has an id the page turns into words. */

export const CHECKS = [
  { id: 'hello', send: 'HELLO', ok: r => /^OK OBP\/0( |$)/.test(r) && /\bboard=\S+/.test(r) },
  { id: 'hello-pins', send: 'HELLO', ok: r => { const i = /\bin=(\d+)/.exec(r), o = /\bout=(\d+)/.exec(r); return !!i && !!o && +i[1] >= 1 && +i[1] <= 8 && +o[1] >= 1 && +o[1] <= 8; } },
  { id: 'in', send: 'IN 00', ok: r => r === 'OK' },
  { id: 'out', send: 'OUT?', ok: r => /^OK [0-9A-F]{2}$/.test(r) },
  { id: 'in-bad', send: 'IN ZZ', ok: r => /^ERR \S/.test(r) },
  { id: 'lower', send: 'in 01', ok: r => r === 'OK' },
  { id: 'clk', send: 'CLK', ok: r => r === 'OK' },
  { id: 'clk-n', send: 'CLK 3', ok: r => r === 'OK' },
  { id: 'clk-bad', send: 'CLK 0', ok: r => /^ERR \S/.test(r) },
  { id: 'rst', send: 'RST', ok: r => r === 'OK' },
  { id: 'list', send: 'LIST?', optional: true, ok: r => /^OK( \S+)+$/.test(r) },
  { id: 'unknown', send: 'FLY', ok: r => /^ERR \S/.test(r) }
];

/* raw(line) → the reply line. Returns each check with its reply and result. */
export async function conform(raw) {
  const out = [];
  for (const c of CHECKS) {
    let reply = '', pass = false;
    try { reply = await raw(c.send); pass = c.ok(reply) || (!!c.optional && /^ERR\b/.test(reply)); } catch (e) { reply = '(' + (e.code || 'error') + ')'; }
    out.push({ id: c.id, send: c.send, reply, pass, optional: !!c.optional });
  }
  try { await raw('IN 00'); } catch (e) { /* leave the board as found */ }
  return { checks: out, ok: out.every(c => c.pass) };
}
