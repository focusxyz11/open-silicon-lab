/* The boards the bench knows, and how far along each one is. Adding a board is adding an entry
   here and, if it does not speak the Open Bench Protocol, a small adapter (see docs/HARDWARE.md).
   status: ready (works and is tested) · experimental (written and tested against an imitation; needs
   people with the board to try it) · planned (designed, not built) · idea (open for anyone to take). */
export const BOARDS = [
  { id: 'virtual', status: 'ready', link: 'loopback', protocol: 'obp', t: 'Virtual board', d: 'Your design as a gate-level chip on screen, speaking the same protocol a real board does. Works everywhere, nothing to buy.' },
  { id: 'ttdemo', status: 'experimental', link: 'serial', protocol: 'ttdemo', t: 'Tiny Tapeout demo board', d: 'A real chip from a community shuttle, with hundreds of designs on it. The lab types commands at the board\'s own Python prompt, so it needs no new firmware.' },
  { id: 'obp', status: 'experimental', link: 'serial', protocol: 'obp', t: 'Any Open Bench board', d: 'Any board whose firmware answers the Open Bench Protocol: one short text line per command. A Pico, an Arduino or an FPGA can all join.' },
  { id: 'pico2', status: 'planned', link: 'serial', protocol: 'obp', t: 'Raspberry Pi Pico 2', d: 'About $5, with two real RISC-V cores in its RP2350. Next step: run the RISC-V lab\'s programs on real RISC-V silicon.' },
  { id: 'fpga', status: 'planned', link: 'serial', protocol: 'obp', t: 'FPGA board', d: 'Your exported Verilog as real hardware in minutes, without waiting months for a shuttle. Open tools such as Yosys and nextpnr already run inside a browser.' },
  { id: 'remote', status: 'idea', link: 'websocket', protocol: 'obp', t: 'A shared bench far away', d: 'A board in a school or makerspace that anyone can test their design on over the internet, taking turns.' }
];
export const boardById = id => BOARDS.find(b => b.id === id);
