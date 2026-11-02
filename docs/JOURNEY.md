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
| 8. Make it | Export for Tiny Tapeout, what happens next, what comes back | `tiny` export | export done; walkthrough planned |

Across all of them: **Zoom into your chip** (My chip view) shows the same design at seven scales,
from the demo board to one transistor, with live values from the board's switches.

## Next steps

1. **Flip-flops in the zoom and the studio.** The zoom can open a flip-flop cell, and the studio can
   hold a register, so your own design can count. Export to Verilog then needs a clocked top level.
2. **Switch to gate.** A small lab before the studio: wire transistors as switches into NOT and NAND,
   the same CMOS networks the zoom opens up (`src/engines/chipzoom.js`).
3. **The last mile.** A plain walkthrough from the exported files to a submitted Tiny Tapeout
   project: the template repository, which run, roughly what it costs, how long it takes, the demo
   board that comes back. Run dates change, so link to Tiny Tapeout's runs page and keep only
   general facts in `facts.json`.
4. **Later: invent one.** An architecture sandbox at the end of the road: put together a machine
   that does not exist yet (where it computes, how it represents numbers, where data lives, what it
   is built from), run real kinds of work through it, and see where it breaks. Every future-device
   number is an assumption you can change, labelled proven, shown in a lab or a guess; software and
   ecosystem count beside energy and speed. It reuses the models in `src/engines/paradigms.js`.
