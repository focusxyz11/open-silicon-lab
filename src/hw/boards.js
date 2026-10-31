/* The boards the bench knows, and how far along each one is. Adding a board is adding an entry
   here and, if it does not speak the Open Bench Protocol, a small adapter (see docs/HARDWARE.md).
   status: ready (works and is tested) · experimental (written and tested against an imitation; needs
   people with the board to try it) · planned (designed, not built) · idea (open for anyone to take). */
export const BOARDS = [
  { id: 'virtual', status: 'ready', link: 'loopback', protocol: 'obp', t: 'Virtual board', d: 'Your design as a gate-level chip on screen, speaking the same protocol a real board does. Works everywhere, nothing to buy.' },
  { id: 'mpbench', status: 'experimental', link: 'serial', protocol: 'obp', install: true, t: 'ESP32, Pico or another MicroPython board', d: 'A few-dollar board drives a real chip you wire up, such as a 74HC00 with four NAND gates. One open program runs on all of them, and the page can install it for you.' },
  { id: 'ttdemo', status: 'experimental', link: 'serial', protocol: 'ttdemo', t: 'Tiny Tapeout demo board', d: 'A real chip from a community shuttle, with hundreds of designs on it. The lab types commands at the board\'s own Python prompt, so it needs no new firmware.' },
  { id: 'obp', status: 'experimental', link: 'serial', protocol: 'obp', t: 'Any Open Bench board', d: 'Any board whose firmware answers the Open Bench Protocol: one short text line per command. Arduino, FPGA or your own design can all join.' },
  { id: 'riscv', status: 'planned', link: 'serial', protocol: 'obp', t: 'Run programs on a real RISC-V core', d: 'ESP32-C3, Pico 2 and CH32V003 all have RISC-V cores. Next: run the RISC-V lab\'s programs on one and compare with the simulator.' },
  { id: 'fpga', status: 'planned', link: 'serial', protocol: 'obp', t: 'FPGA board', d: 'Your exported Verilog as real hardware in minutes, without waiting months for a shuttle. Open tools such as Yosys and nextpnr already run inside a browser.' },
  { id: 'remote', status: 'idea', link: 'websocket', protocol: 'obp', t: 'A shared bench far away', d: 'A board in a school or makerspace that anyone can test their design on over the internet, taking turns.' }
];
export const boardById = id => BOARDS.find(b => b.id === id);
