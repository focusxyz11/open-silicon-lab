# What design really is

> Part of [how could your idea become a chip?](idea.md): the studio's steps from first principles, from a job written
> down to masks sent to a factory, and the open path anyone can take today.

The studio walks one small design through six steps: the job, describe, check, gates, layout, masks. Each step is
real work in every chip company, done by people and programs together. This page says, for each step, what is true
there, how it is done in practice and with which open tools, what people are trying, and the question behind it.
Every term is explained the first time it is used. Numbers have sources (`src/data/facts.json`); the rest comes from
the lab's engines, which say what they leave out.

Two things run through every step, so they come first.

- **A design is always for one way of making it.** The factory gives designers a **process design kit (PDK)**: its
  ready-made gates (the **cell library**), its **design rules** (the shapes it can print), and models of how its
  parts behave (how fast, how hot, how much they leak). Every step below is done against one PDK. Until 2020 every
  PDK was secret. Then Google and SkyWater released **SKY130**, a 130 nm process with one layer of local wiring and
  five of metal, as the first open PDK
  ([SkyWater PDK](https://github.com/google/skywater-pdk)); **GF180**, a 180 nm process from GlobalFoundries,
  followed in 2022 under the Apache 2.0 licence
  ([Google](https://opensource.googleblog.com/2022/08/GlobalFoundries-joins-Googles-open-source-silicon-initiative.html)).
- **A chip cannot be changed once it is made.** Every step is a chance to find a mistake while it is still cheap. In
  2024 only 14% of chip projects worked the first time they were made, down from about 30%
  ([Semiconductor Engineering](https://semiengineering.com/first-time-silicon-success-plummets), from the Wilson
  Research Group's survey for Siemens EDA).

## 1. The job: a specification

**What is true.** A chip begins as a job someone wrote down: what goes in, what comes out, how fast, at what power
and cost, on which process. Written precisely, it is a **specification**, and every later step is checked against
it. A job written badly is built into every copy.

**In practice.** The specification names the pins, says what every output must be for every input (or for every
tick of a clock), and sets the budgets: the clock (how many ticks a second), the power, the area. For a processor it
also names the **instruction set**, the list of commands the processor understands. **RISC-V** is an open one: anyone
may build a processor for it without paying a licence fee, which is why the lab's community computer is built
around a RISC-V core.

**What people are trying.** Specifications a program can check (the job written as properties every later step is
tested against, not as prose someone reads); open specifications anyone may build to; AI that drafts a
specification and its tests from a plain request, for people to correct.

**The question behind it:** who decides what a chip should do, and what happens when the job changes after it is
made?

*In the lab:* the job's card counts your job's inputs, outputs and the patterns the job gives an answer for. A job
without a specification (the free job) can be built but never be wrong, which is the problem.

## 2. Describe: a hardware description language

**What is true.** The design is a description of structure, not of steps. Each line says what a wire must be at
every moment: it describes gates that always exist and always answer, not an instruction that runs once.

**In practice.** Chips are described in a **hardware description language (HDL)**, most often **Verilog**, an IEEE
standard since 1995, or **SystemVerilog**, which extends it and has been a standard since 2005
([Doulos](https://doulos.com/knowhow/verilog/a-brief-history-of-verilog)). The lab's language is Verilog with the
ceremony left out. The half adder, which adds two bits, in the lab's words:

```
sum = a ^ b;
carry = a & b;
```

and in Verilog, as an open synthesis program would read it:

```verilog
module half (
  input  wire a,
  input  wire b,
  output wire sum,
  output wire carry
);
  assign sum = a ^ b;
  assign carry = a & b;
endmodule
```

The lines that matter are the same; Verilog adds a **module** (a named block with its pins), declares every pin,
and calls each line an **assign**. A flip-flop (a one-bit memory that takes a new value at each tick of the clock)
is written as an `always @(posedge clk)` block: `reg q = d;` in the lab becomes `q <= d;` inside it. The studio
writes your own description as Verilog in the card (the engine `src/engines/verilog.js`, checked by reading every
job's Verilog back and comparing its answers).

**What people are trying.** Languages that generate the description from a program (Chisel, in which several open
RISC-V cores are written; SpinalHDL; Amaranth in Python); **high-level synthesis**, the job written in C++ and the
circuit chosen by a tool; AI that writes Verilog from a plain request, which then has to pass the same checks as
anyone's.

**The question behind it:** can a few lines of text describe a machine that runs billions of times a second, and who
will read them in ten years?

## 3. Check: simulation, coverage and proof

**What is true.** Checking costs more than describing. A small circuit can be tried on every input: two inputs
have four patterns, and trying all four is a proof. A processor has more states than anyone could ever try, so
checking means choosing which cases matter, and the cases nobody thought of are where the bugs live.

**In practice.** Three tools, used together:
- **Simulation:** run the description on chosen inputs and compare its answers with the specification's.
- **Coverage:** measure how much of the design the tests reached (every line, every branch, every case someone
  listed), so the team knows what it has not tried.
- **Formal verification:** prove with mathematics that a property holds for every input at once (the carry is
  never 1 unless both inputs are), without trying them.

Teams often spend more effort here than on describing, and still most projects need their masks made again.

**What people are trying.** Proofs instead of patterns for the riskiest blocks, with open tools such as SymbiYosys;
tests written in Python with cocotb, as Tiny Tapeout's templates do; random patterns steered toward the cases no test
has reached yet; AI that writes tests, whose tests also need checking.

**The question behind it:** if every pattern you tried gave the right answer, is the design right?

*In the lab:* the check's card says whether the patterns tried are all there are (a proof) or one test of a clocked
design (not a proof), and what share of the faults a factory could leave those patterns would catch.

## 4. Gates: synthesis against a cell library

**What is true.** A program turns the description into gates. It chooses which cells of the library to use (small
and slow, or large and fast), trading area, delay and energy. Two descriptions that give the same answers can
become very different circuits.

**In practice.** **Synthesis** maps the description onto **standard cells**: ready-made gates from the PDK, each
drawn, measured and modelled by the factory (an inverter, a two-input NAND, a flip-flop, in several strengths).
In the open flow, **Yosys** does it. The cells' models say how long each takes to answer and how much energy each
switch costs, so the program can aim for small, fast or frugal. **Power** is decided here too: every wire that
switches charges and discharges a little capacitance, so the energy grows with how often wires switch and with the
clock; the lab's *Half the power* challenge, at the block, plays with that.

**What people are trying.** Cell libraries tuned for one job (very low voltage, very high speed); synthesis guided by
machine learning; whole designs evolved by search rather than written (the lab's *Evolve a circuit*).

**The question behind it:** a program chose your gates; what was it trying to make small, and what did that cost?

## 5. Timing: the longest chain against the clock

**What is true.** A clocked chip works in ticks. At every tick the flip-flops launch new values, the gates between
them work out the results, and before the next tick every result must have arrived and stood still for a moment
(the **set-up time**). So the longest chain of gates between two flip-flops, the **critical path**, decides how
short a tick can be. The time left over is the **slack**: positive, the design makes its clock; negative, it fails,
and no check of its answers would ever show it.

**In practice.** **Static timing analysis** adds up the delays along every path, without simulating, at every
**corner** of the process: a slow copy and a fast one, hot and cold, low and high voltage. In the open flow,
**OpenSTA** does it, inside OpenROAD, after synthesis and again after layout, when the real wire lengths are known.
A path that is too slow is fixed by stronger cells, by a shorter route, or by cutting it in two with flip-flops
between (a **pipeline**: shorter ticks, but an answer takes more of them).

*In the lab:* the engine `src/engines/timing.js` finds the longest chain through your gates (each cell's delay from
the library, plus a fixed delay for the wire), adds the flip-flops on either side, and compares it with the tick of a
66 MHz clock, about the fastest a Tiny Tapeout chip's pins can carry ([Tiny Tapeout](https://tinytapeout.com/specs/clock/)).
A half adder makes it with almost the whole tick to spare. Copy a full adder 32 times in a row, each carry feeding
the next, as a 32-bit adder is built, and the same small chain grows into most of the tick: that is why the lab's
RISC-V core runs at tens of megahertz, not hundreds. What it leaves out: delay that grows with a wire's real length,
the corners, and the clock reaching different flip-flops at slightly different times.

**What people are trying.** Timing every path at every corner; adders whose carry does not ripple (carry-lookahead,
which computes the carries in parallel); logic without a clock, where each part says when it is done, hard to design
and check, so still rare.

**The question behind it:** every answer is right; will it be right in time?

## 6. Layout: placement, routing and design rules

**What is true.** Programs decide where every cell goes. **Placement** puts the cells in rows so that wires stay
short; **routing** draws every wire through the layers of metal above, with **vias** (small plugs) joining one layer
to the next. Nobody places them by hand, and each run can come out differently.

**In practice.** **OpenROAD** places and routes in the open flow. Then a **design rule check (DRC)** measures every
shape against the PDK's rules: a line too thin breaks, two lines too close run together, a via too near another
merges with it. In SKY130, metal 1 must be at least 0.14 µm wide and 0.14 µm from its neighbour, and a via 0.15 µm
across and 0.17 µm from the next ([SkyWater PDK](https://skywater-pdk.readthedocs.io/en/main/rules/summary.html)).
A second check (**LVS**, layout versus schematic) confirms that the shapes drawn make the circuit described.
Open programs such as **Magic** and **KLayout** run these checks against the open rules.

*In the lab:* the engine `src/engines/rules.js` checks your tile against seven rules in the tile's own terms: every
wire on a track (which keeps its width and spacing), no two signals touching, no two vias of different signals side
by side, no cells overlapping, every cell inside the tile, no wire too long for the gates it ends on (the
**antenna** rule: while a layer is etched its wires collect charge, and a long one ending only on a gate can break
the gate's thin oxide), and every signal joined. The router of the lab keeps most of them by construction; on
larger designs it sometimes leaves two vias side by side, and the card says so. A real flow moves those wires and
checks again, until nothing is left.

**What people are trying.** Every line on a fixed grid, one direction per layer, at the newest processes, so fewer
shapes can go wrong; dummy metal added where a layer is too empty, so polishing leaves the wafer flat; open rules,
which anyone can read and check against.

**The question behind it:** your wires join the right cells; can the factory print them as they are drawn?

## 7. Masks: tapeout

**What is true.** Each layer of the chip is printed through a **mask**, a plate of glass and chrome that lets light
through in the shape of that layer. Sending the final layout to be made into masks is **tapeout**; after it, every
mistake costs a new set.

**In practice.** The layout is written out as one file of shapes, layer by layer (GDS), and sent. A design draws
only some of the masks: SKY130's mask table marks 34 masks as used
([SkyWater PDK](https://github.com/google/skywater-pdk/blob/main/docs/rules/masks.csv)). The engine `maskSet` in
`src/engines/rules.js` splits them by who draws them:
- the **transistors** (wells, the gates' polysilicon, the implants that make sources and drains) and the **cells'
  own wiring** (contacts, the local interconnect, the first metal): 15 masks, drawn once inside every cell by the
  library's makers;
- **your wires**: a via, the second metal, a via, the third metal, 4 masks the lab's tile draws itself;
- the **upper metals** that carry the chip's power and its long wires, 4 masks;
- the chip's **edge and its way out** (seal ring, pad openings, packaging layers), 5 masks;
- parts **other designs** on the same wafer may need (deep wells, flash memory, high-voltage parts, resistors), 6
  masks: on a shared run the wafer carries everyone's designs, so every mask any of them needs is printed.

The grouping is the lab's reading of the PDK's list, not a table the factory publishes. Newer processes need many
more masks (from 40 to 50 layers at 28 nm to about 100 at 5 nm,
[ECIA](https://ecianow.org/assets/docs/Stats/LeadTimes/Understanding%20Lead%20Times.pdf)), and each set costs more.

**The question behind it:** from a few lines to a set of masks, what did each step add that you never said?

## 8. The open path to a real chip

**What is true.** For the first time, the whole path from a description to a chip you can hold is open: open PDKs,
open tools and shared runs. It costs the price of a share of one run, not of a mask set.

**In practice.**
- **Open PDKs:** SKY130 (since 2020) and GF180 (since 2022); IHP's 130 nm kit is open too.
- **Open tools:** Yosys for synthesis; OpenROAD for placement, routing and timing; **OpenLane**, now LibreLane, runs
  them in order with the checks and writes the GDS
  ([Chartered Semi](https://www.charteredsemi.com/tiny-tapeout-program-explained/)).
- **Shared runs (shuttles):** many designs on one chip, each paying a share. **Tiny Tapeout** gives each design a
  tile: you start from its template repository, the open flow runs on every change you push, and the chip comes back
  on a board, normally six to nine months after the deadline. One Tiny Tapeout chip, SKY 26b, carried 273 designs
  ([Tiny Tapeout](https://tinytapeout.com/chips/ttsky26b/)). wafer.space sells a whole run of about 1,000 chips on
  GF180 for $7,000 ([Tiny Tapeout](https://tinytapeout.com/news/wafer-space-partnership/), a claim).
- **Fragile, and kept open:** Efabless, which ran the free shuttles Google paid for, closed in March 2025, delaying
  about 500 Tiny Tapeout designs ([eeNews Europe](https://www.eenewseurope.com/en/tiny-tapeout-sees-industrial-boost-as-it-recovers-from-efabless-closure/));
  the community moved its runs to IHP, SkyWater and GlobalFoundries through new partners.

**What people are trying.** Making the last mile one click from a lab like this one (a description, checked, sent to
a shuttle from the record); open PDKs at finer processes; agents that drive the open flow end to end, whose
work is checked by the same rules as anyone's.

**The question behind it:** what happens to chips when anyone can make one?

## Where it shows in the lab

Each step's card in the studio (Look) shows its question, what is true there, the practice and its open tools, what
the engines say about your design, and what people are trying (`src/v2/studio-look.js`, words in `en.json`,
questions in `src/data/weave.js`): timing is the first question at the gates (the engine `timing.js`), the
factory's rules at the layout (`rules.js`), tapeout and the open path at the masks (`maskSet`). The other questions
of each step wait under Ask.
