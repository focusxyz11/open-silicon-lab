# Build your own chip: the road

One design of yours, followed from logic gates to files a real factory accepts, with every stage
shown at its own scale. Nothing on the road is locked: each stage works on its own, and the strip of
stops only shows where you are.

## Stages

| Stage | What you do | Where | Status |
| --- | --- | --- | --- |
| 1. Switch | A transistor as a switch; a NOT and a NAND gate made from switches | new lab | planned |
| 2. Gates to adder | Half adder, full adder | `tiny` studio | done |
| 3. Your ALU | One ALU bit; 32 copies become the CPU's arithmetic | `tiny`, `riscv` | done |
| 4. Memory and clock | Latch, flip-flop, counter; push the clock until it breaks | `clock` | done |
| 5. Run a program | The RISC-V core runs real code on your ALU | `riscv` | done |
| 6. Lay it out | Placement, wires, the chip seen from above | `tiny`, `layout`, `xray` | done |
| 7. Test it | Board against simulation, find the faulty chip | `bench` | done |
| 8. Make it | Export for Tiny Tapeout, the last mile, the community chip | `tiny` export, `community` | done |

Across all of them: **Zoom into your chip** (My chip view) shows the same design at seven scales,
from the demo board to one transistor, with live values from the board's switches.

## Next steps

1. **Switch to gate.** A small lab before the studio: wire transistors as switches into NOT and NAND,
   the same CMOS networks the zoom opens up (`src/engines/chipzoom.js`).
2. **The last mile (done).** The community chip page walks from the exported files to a real chip:
   the template repository, a run, the wait, and the board that comes back.
3. **Push your own clock.** Send a studio design through the gate-level simulator
   (`src/engines/seq.js`): raise its clock until it breaks and watch a glitch move through your own
   gates. The studio's cells map onto the simulator's gates, with the same library delays.
4. **Clocked chips everywhere.** Open a flip-flop in the zoom (its two latches), and let the bench
   step a clock so it can twin-test clocked chips such as the Counter.
5. **At the end of the road: invent the next machine** (idea 3 in the [idea bank](IDEAS.md)).

Done so far: your chip can count (`reg` makes flip-flops; the Counter verifies cycle by cycle,
synthesizes DFF cells, exports clocked Verilog and ticks in the gadget and the zoom).
