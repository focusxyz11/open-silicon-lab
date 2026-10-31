# Hardware: the open bench

The bench (`#bench`) tests a chip design on a board: set its input pins, read its output pins, and compare every answer with the simulation (a *twin test*). It is built to stay open: any board can join, no company's product is required, and a learner without hardware can do everything on the virtual board.

This page is for people who want to **add a board, test one, or build the next step**.

## Principles

1. **Hardware is a bonus, never a gate.** Every activity works on the virtual board. A real board adds the moment where silicon answers back.
2. **One small open protocol.** Boards join by speaking the Open Bench Protocol (below), or through a small adapter if their firmware already has its own commands.
3. **The virtual board uses the real path.** It answers the protocol through the same client and transport code as a real board, so that code is exercised by every visitor and every CI run.
4. **Honest status.** Each board is marked *ready*, *experimental*, *planned* or *idea* in `src/hw/boards.js`. Nothing is called ready until someone has tested it on the real thing.
5. **Safe and private.** Boards run on USB power at 3.3 V logic. The browser asks the reader before a page can open any port, and nothing leaves the reader's computer.

## Where the code is

```
src/hw/obp.js        the Open Bench Protocol: a client, and a reference device in JavaScript
src/hw/transport.js  how bytes travel: Web Serial, and an in-memory loopback
src/hw/ttdemo.js     the Tiny Tapeout demo board adapter (its MicroPython prompt), plus an imitation for tests
src/hw/virtual.js    the virtual board: a tiny-chip design as a gate-level chip, optionally with a defect
src/hw/twin.js       twin testing and single-stuck-at diagnosis
src/hw/boards.js     every board the bench knows, with its status
topics/bench/        the topic: the bench and the faulty-chip puzzle (only drawing; no protocol code)
tests/hw.test.mjs    tests for all of the above
```

Topics use the bench through `osl/hw/…`. They never touch serial ports directly.

## The Open Bench Protocol, version 0

Plain ASCII text, one command per line ending in `\n` (a `\r` before it is ignored), one reply line per command. Over USB serial the speed is **115200 baud**, 8 data bits, no parity, 1 stop bit. Commands are not case-sensitive; replies are upper case.

| The lab sends | The board answers | Meaning |
| --- | --- | --- |
| `HELLO` | `OK OBP/0 board=<name> in=8 out=8 [clk=1] [key=value …]` | Who are you? `board` is a short name without spaces. Add `clk=1` if the design has a clock. Extra `key=value` pairs are allowed and ignored by older labs. |
| `IN <hh>` | `OK` | Set the 8 input pins (`ui_in`) to the hex value `hh` (`00`–`FF`). |
| `OUT?` | `OK <hh>` | Read the 8 output pins (`uo_out`) as two hex digits. |
| `CLK [n]` | `OK` | Give the design `n` clock pulses (default 1, at most 1000000). Boards without a clock answer `OK` and do nothing. |
| `RST` | `OK` | Pulse reset. |
| `LIST?` | `OK <name> <name> …` | Optional: the designs the board can select. Otherwise `ERR …`. |
| `SEL <name>` | `OK` | Optional: select a design. Otherwise `ERR …`. |
| anything else | `ERR <reason>` | A short reason a person can read. |

Pin order: input *k* of a design is `ui_in[k]` and output *k* is `uo_out[k]`, the same order as the lab's Verilog export (`src/engines/export.js`, `pinOrder`) and the Tiny Tapeout top-level interface. A chip made from an exported design therefore plugs straight in.

A complete reference device is `obpDevice()` in `src/hw/obp.js`: about 20 lines, easy to port to MicroPython, Arduino C or an FPGA soft core.

### Versioning

The version is the number after `OBP/`. New optional commands can be added without changing it; boards answer `ERR` to commands they do not know, and the lab treats that as "not supported". A change that would break an existing board raises the version, and the lab keeps speaking the old one.

## Add a board

**If its firmware can speak the protocol** (for example a Raspberry Pi Pico running a short MicroPython script that drives a chip's pins):

1. Write the firmware from the table above; `obpDevice()` is the model.
2. Add an entry to `src/hw/boards.js` with `protocol: 'obp'`, `link: 'serial'` and `status: 'experimental'`.
3. Try it on the bench with **Any Open Bench board**. Open "Show the conversation" to see every line.
4. Open a pull request with what you tested. Once two people have used it successfully, it can become `ready`.

**If it already has its own commands** (like the Tiny Tapeout demo board's Python prompt):

1. Write an adapter in `src/hw/<board>.js` that returns the bench interface below, translating each call into the board's commands.
2. Write an imitation of the board (as `fakeTTRepl` does) and test the adapter against it in `tests/hw.test.mjs`, following the board's documentation.
3. Register it in `src/hw/boards.js` and in `connectSerial()` in `topics/bench/labs/bench.js`.

### The bench interface

Every adapter returns an object with these async methods:

```js
{
  kind: 'obp' | 'ttdemo' | …,
  hello()        → { version, board, in, out, clk? }   // throws if the board is not what we expect
  setIn(value)   → set ui_in (0–255)
  getOut()       → read uo_out (0–255)
  clock(n)       → n clock pulses
  reset()        → pulse reset
  list?()        → design names            (optional)
  select?(name)  → choose a design         (optional)
  close()
}
```

Errors carry a `code` the topic turns into words: `no-serial`, `cancelled`, `busy`, `timeout`, `protocol`, `device`, `input`, `closed`. The core holds no sentences for readers, so the bench can be translated without touching `src/hw`.

### Add a transport

A transport needs only `write(text)` and `readUntil(token, ms)`, plus `close()`. Web Serial and the loopback are in `src/hw/transport.js`. WebUSB, Web Bluetooth, or a WebSocket to a shared bench far away would each be one more function, and every protocol and adapter would work over it unchanged.

## Test without hardware

- `node --test tests/hw.test.mjs` runs the protocol, the virtual board, twin testing, diagnosis and the demo-board adapter against its imitation.
- On the site, pick **Virtual board** and open "Show the conversation": it is the same protocol a real board speaks.

## Board status (October 2026)

| Board | Status | Notes |
| --- | --- | --- |
| Virtual board | ready | Every tiny-chip project and your own design; optional random defect. |
| Tiny Tapeout demo board | experimental | Uses the board's own MicroPython prompt (`tt.ui_in.value`, `print(tt.uo_out)`, `tt.shuttle.<project>.enable()`), as documented by Tiny Tapeout. Tested against an imitation only. **Needs someone with a board.** |
| Any Open Bench board | experimental | Works with any firmware that follows the table above. |
| Raspberry Pi Pico 2 | planned | About $5, with two Hazard3 RISC-V cores in its RP2350. Plan: a small loader that runs the RISC-V lab's programs on real RISC-V silicon and reports registers and cycle counts. |
| FPGA board | planned | Your exported Verilog on real hardware in minutes. YoWASP already runs Yosys and nextpnr in the browser; programming the board from the page is the open question. |
| A shared bench far away | idea | A board in a school or makerspace, reachable over a WebSocket, taking turns. |

## The steps ahead

0. **Virtual bench.** Done: the bench, twin test, diagnosis, the faulty-chip puzzle, the protocol and the experimental adapters.
1. **Raspberry Pi Pico 2.** Real RISC-V silicon running the RISC-V lab's programs.
2. **Tiny Tapeout demo board, confirmed.** Real community chips, twin-tested live.
3. **FPGA.** Your own Verilog on real hardware, with the toolchain in the browser.
4. **Community shuttles.** Collect learners' designs into one submission; when the chips come back, test them on the bench.

Each step is a separate pull request, and nothing in a later step is needed for an earlier one.
