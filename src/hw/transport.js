/* Transports: how bytes reach a board. The bench only needs write(text) and
   readUntil(token, ms), so a new kind of link (Bluetooth, WebUSB, a WebSocket to a lab bench far
   away) is one more function here, and every board protocol works over it unchanged.
   Every transport can report the conversation through onTraffic(direction, text). */

export const hasSerial = () => typeof navigator !== 'undefined' && !!navigator.serial;

/* Text arrives in pieces; this keeps what has arrived and hands it out up to a token. */
function inbox() {
  let buf = '', wake = null;
  return {
    push(text) { buf += text; if (wake) { const w = wake; wake = null; w(); } },
    async until(token, ms, closed) {
      const end = Date.now() + ms;
      for (;;) {
        const i = buf.indexOf(token);
        if (i >= 0) { const out = buf.slice(0, i); buf = buf.slice(i + token.length); return out; }
        if (closed()) throw Object.assign(new Error('the connection closed'), { code: 'closed' });
        const left = end - Date.now();
        if (left <= 0) throw Object.assign(new Error('no reply in time'), { code: 'timeout' });
        await new Promise(r => { const t = setTimeout(() => { wake = null; r(); }, left); wake = () => { clearTimeout(t); r(); }; });
      }
    },
    drain() { const out = buf; buf = ''; return out; }
  };
}

/* An in-memory transport: whatever is written goes to respond(text), and what it returns comes
   back as if from a board. The virtual board and the tests use it. */
export function loopback(respond, { onTraffic } = {}) {
  const box = inbox(); let open = true;
  return {
    kind: 'loopback',
    async write(text) { if (!open) throw Object.assign(new Error('closed'), { code: 'closed' }); onTraffic && onTraffic('out', text); const r = respond(text); if (r) { await Promise.resolve(); onTraffic && onTraffic('in', r); box.push(r); } },
    readUntil: (token, ms = 1000) => box.until(token, ms, () => !open),
    drain: () => box.drain(),
    close() { open = false; }
  };
}

/* Turn a line-by-line device (like obpDevice) into a respond function for loopback. */
export function lineResponder(handle) {
  let part = '';
  return text => { part += text; const lines = part.split('\n'); part = lines.pop(); return lines.map(l => handle(l.replace(/\r$/, ''))).filter(r => r !== '').map(r => r + '\n').join(''); };
}

/* Web Serial: a USB serial port the reader picked in the browser's own dialog.
   The browser asks the reader every time; the page never sees other devices. */
export async function serialTransport({ baudRate = 115200, onTraffic, filters } = {}) {
  if (!hasSerial()) throw Object.assign(new Error('this browser cannot open serial ports'), { code: 'no-serial' });
  let port;
  try { port = await navigator.serial.requestPort(filters ? { filters } : {}); }
  catch (e) { throw Object.assign(new Error('no port chosen'), { code: 'cancelled' }); }
  try { await port.open({ baudRate }); }
  catch (e) { throw Object.assign(new Error('the port could not be opened; is another program using it?'), { code: 'busy' }); }
  const box = inbox(); let open = true;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const writer = port.writable.getWriter();
  const reader = port.readable.getReader();
  (async () => {
    try { for (;;) { const { value, done } = await reader.read(); if (done) break; const s = dec.decode(value, { stream: true }); onTraffic && onTraffic('in', s); box.push(s); } }
    catch (e) { /* unplugged or closed */ }
    open = false; box.push('');
  })();
  return {
    kind: 'serial',
    async write(text) { onTraffic && onTraffic('out', text); await writer.write(enc.encode(text)); },
    readUntil: (token, ms = 1500) => box.until(token, ms, () => !open),
    drain: () => box.drain(),
    async close() { open = false; try { await reader.cancel(); } catch (e) { /* ignore */ } try { reader.releaseLock(); writer.releaseLock(); await port.close(); } catch (e) { /* ignore */ } }
  };
}
