# Where does the energy go?

> **The question:** one answer from an AI costs energy. Where does it all go, and how far down could we bring it?
>
> **The question behind it:** is the cost of thinking set by physics, or by where we put things?

A puzzle (see [README](README.md)): one problem that runs through every level of a data centre, from the hall to the
atom, so no level can solve it alone.

## Why it is open

**The floor is tiny.** Physics asks for a minimum to erase a bit, about 3 zeptojoules at room temperature (see
[limit](../limit.md)). The arithmetic of a whole answer from a large language model, done at that floor, would cost
about thirty microjoules.

**The bill is huge.** A measured answer costs about a quarter of a watt-hour, ten million times the floor or more, and
most of it pays for **distance**: numbers carried from memory to the arithmetic and back, then the heat of carrying
them pumped out of the building. Moving a number costs thousands of times more than using it (see
[divide](../divide.md)).

Between the floor and the bill is a gap of seven or more powers of ten. Nobody knows how much of it is physics we
cannot avoid and how much is only where we put things.

## What is true

**1. One answer costs a fraction of a watt-hour today.** Google measured the median text prompt to its assistant at
0.24 Wh in May 2025, counting the chips, the machines that host them, the machines kept ready, and the building; the AI
chips alone came to about 0.10 Wh ([Google](https://arxiv.org/abs/2508.15734)). An independent estimate puts a typical
ChatGPT query at about 0.3 Wh, far more for long inputs or reasoning
([Epoch AI](https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use)). Small for one answer; billions a day
add up to power stations.

**2. Moving a number costs more than computing with it.** On a 45 nm chip, reading 16 bits from a memory chip cost
640 picojoules; adding two 16-bit numbers cost 0.18: about 3,500 times less
([Pedram et al.](https://arxiv.org/pdf/1602.04183)). Reading from memory on the chip itself cost 8 to 11 picojoules.
The home of this truth is [divide](../divide.md).

**3. Most of the energy goes to moving data, in a phone as in a hall.** In phones and tablets running a browser, a
learned model and video, about 63% of the whole device's energy went to moving data between memory and the
processors ([Boroumand et al.](https://doi.org/10.1145/3173162.3173177)).

**4. Reuse decides how much moving each answer pays.** A language model reads every weight once for every word it
writes. Served to one person, each weight fetched is used once; served to sixty-four people at once, it is used
sixty-four times, and each answer pays a sixty-fourth of the fetching.

**5. Fewer bits cost less twice.** A number of 8 bits is half the bytes to move of one of 16, and a multiplier for it
takes about a quarter of the energy (the energy of a multiplier grows with the square of its bits). The catch is
accuracy: each bit taken away adds rounding noise.

**6. A slower clock can be cheaper.** Switching energy grows with the voltage squared, and a slower clock runs at a
lower voltage. While the chip waits for memory, a slower clock costs no time at all. Too slow, and leakage (current
through switches that are off) takes over.

**7. A chip's own heat is only part of the bill.** For every joule a chip uses, the server around it uses more (its
host processor, fans, power conversion and the network to other machines), and the building pumps the heat out
(power use effectiveness, PUE: about 1.1 to 1.5).

**8. The floor is real and far away.** Erasing one bit releases at least kT ln 2 of heat, about 3 zeptojoules at room
temperature, measured in 2012 ([Nature](https://www.nature.com/articles/nature10872)). A brain does all its thinking
on about 20 watts ([Physics Factbook](https://hypertextbook.com/facts/2001/JacquelineLing.shtml)), far above the floor
and far below any machine that does as much.

## Level by level

The engine's starting plan: a 70-billion-parameter model writing a 500-word answer for one person, its weights in 16
bits in stacked memory beside the chip, at 3 GHz, in a data centre with a PUE of 1.2. On the engine's 45 nm ruler it
costs about 2.8 Wh: about two thirds moving data, one third heat, and well under one percent arithmetic. The shares are
what the puzzle is about; a newer chip lowers every joule, not the shape.

| Level | Where the energy goes there | Share at the start | Levers people are trying | Their catch | Already in the lab |
| --- | --- | --- | --- | --- | --- |
| **Building** | Pumping out the heat; power conversion | 17% heat | Liquid cooling, cooler climates, reuse of the heat (PUE 1.2 → 1.1) | Water, and it saves only the overhead, never the work | Where an answer's energy goes (rack); `jevons`, `station` |
| **Rack** | The network between machines | 6% moving | Optics beside the switch chip instead of plugged-in modules | New packaging; a broken laser is hard to swap | Where an answer's energy goes; the cluster's network (no lab yet) |
| **Board** | Fetching weights from memory; the host machine and fans | 71% (56% moving, 15% heat) | Batching users (the batch bet); memory beside the chip, not on the board; the model kept on chips | Each user waits longer; on-chip memory is small and dear | Feed the cores (`wait`); the batch bet (`batch`) |
| **Chip** | Moving numbers through on-chip memory | 4% moving | Fewer bits per number (quantization); keeping data close in space and time | Rounding noise, outliers | Four bits, despite outliers; `dark` |
| **Block** | Reading operands from registers | 0.1% moving | Compute in memory: sum the weights where they are stored | Noise, and converters that cost more for every bit | Fewest bits that still work; half the power; `fetch` |
| **Gate** | The arithmetic | 0.3% computing | Narrower multipliers; approximate arithmetic | Wrong answers that must be rare and harmless | `brain` |
| **Switch** | Leakage through switches that are off | 0.7% heat | Lower voltage, slower clocks; keeping chips cool | Leakage takes over below the lowest voltage; hot silicon leaks more | Too hot for silicon; `heat` |
| **Atom** | The floor: bits erased | 3 × 10⁻⁷ % computing | Reversible logic that erases nothing | Slow, and needs a new way to compute | The energy floor (Walls, in [limit](../limit.md)); `heat` |

Read down the table and the puzzle shows: the biggest share sits at the board and the building, while the arithmetic,
the only part the answer needs, is a sliver. A lever at the chip (fewer bits) halves the fetching at the board; a lever
at the board (batching) makes the block and gate matter for the first time.

**Each lever alone, and together** (the engine, from the starting plan):

| Lever | Energy of one answer | The other side |
| --- | --- | --- |
| 64 users served together | 3% of it | each waits for the others once the arithmetic is the limit |
| 8 bits instead of 16 | 50% | rounding noise (75 dB → 36 dB signal-to-noise) |
| the whole model on chips | 9% | needs many chips' worth of on-chip memory |
| memory chips on the board instead | 370% | slower too: eight times less bandwidth |
| compute in memory | 98% | alone, almost nothing: the board still dominates |
| half the clock at the lowest voltage | 95% | no slower while the chip waits for memory |
| liquid cooling, PUE 1.1 | 92% | only the overhead |
| optics beside the switch | 98% | only the network |
| **all of them together** | **about 1/3,800** | still about 300,000 times the floor |

Compute in memory saves 2% alone; with the model on chips and users batched, the same lever saves more than 90% of
what is left. That is the puzzle in one line: the best fixes cross levels.

## The threads it runs through

The puzzle is not a new place. It runs through questions from the field that are already asked at their levels:

- **`fetch`** (block, on the seam to the gate): *why does fetching a number cost far more than using it?* The heart of
  the puzzle, where a visitor meets it.
- **`wait`** (board, on the seam to the chip): *if the chip gets faster, why does it spend more time waiting?* The same
  distance, paid in time instead of joules.
- **`dark`** (chip): *why must most of a chip go dark?* Heat sets how much can switch at once.
- **`brain`** (gate): *how does a brain think so well with slow, sloppy parts?* The existence proof that the gap is not
  all physics.
- **`heat`** (switch): *must thinking make heat at all?* The floor, and whether reversible logic could go under it.
- **`palm`** (phone): *why does your phone slow down while you hold it?* The same puzzle in a hand: the budget is your
  skin's temperature.

## The engine: Budget

**What it computes:** for a **job** (multiply-adds, bytes read if each number is used once, and how often each is
reused) and a **plan** (where the numbers live, their precision, the clock and voltage, and the levers), the energy of
one answer at every level of the data centre's dive (building, rack, board, chip, block, gate, switch, atom), each
split into **computing**, **moving data** and **heat**, with the total, the floor under it, the time one answer takes
and the accuracy its precision keeps.

**Its maths:** counting operations and bytes; the 45 nm energy table; the voltage squared and the leak of the power
curve; Landauer's limit; the roofline for time. It reuses the engines already in the lab instead of re-deriving their
numbers: the energy table and compute in memory (`src/engines/paradigms.js`), memory beside the chip
(`src/engines/chip.js`), the power curve (`src/engines/clockpower.js`), the floor (`src/engines/floor.js`), energy per
token, the cluster's network and quantization (`src/engines/aiserve.js`), and the chip's speed and number formats
(`src/engines/aichip.js`).

**What it decides:** an attempt's score, and whether a claim holds: a plan that goes below the floor, or a lever that
raises the total, is wrong in the engine before it is argued about.

**What it is not:** a meter. Its energies are those of a 45 nm chip, so its starting answer (2.8 Wh) is above the
measured 0.24 Wh, and every lever together (under 0.001 Wh) is below. The shares and the directions hold; the joules
are a ruler for comparing ideas.

**Today:** `src/engines/budget.js`, tested in `tests/budget.test.mjs`: never wrong in direction (off-chip moves dominate
at low reuse; reuse, compute in memory and fewer bits lower the total; nothing goes below the floor), and matching the
45 nm table, Landauer's limit, the floor engine and the energy-per-token lab's shares.

## The score, and what an attempt is

**An attempt** is a plan the engine can run, for a job: where the numbers live, their precision, clock and voltage,
and the levers pulled, with who made it and how AI was used. It can come from a person or from an agent through the
open port.

**The score** is the energy of one answer in joules, lower is better, with the floor it can never go below. Nobody
votes. Beside it, two other sides an attempt pays on, so ideas can be compared fairly instead of one number winning
alone: **time** (seconds for one answer, and answers per second) and **accuracy** (the signal-to-noise of its
precision). An attempt that is cheaper and worse on both other sides is not a win; one that is cheaper on one side and
no worse on the others moves the frontier.

**What the community does:** make attempts (a plan); find what is wrong in one (a claimed saving the engine does not
show); predict which lever pays next; pass on what was learned (the level where an attempt's energy still goes). When
the engine cannot express an idea (a new material, a new memory), the attempt is a question to the engine: which new
lever, at which level, with which source.

**Part 2** (a separate task) makes it visible: a lens on the dive that follows the joule level by level, the labs as
levers that change the whole trace, attempts kept as ledger entries, and a map of attempts.

## Where it meets other questions

- **[divide](../divide.md):** the home of "moving a number costs more than computing with it"; the puzzle is that truth
  added up over a whole answer.
- **[limit](../limit.md):** the floor, and how far from it we are.
- **[life](../life.md):** a brain does not separate memory from computing, and runs on 20 watts.
- **Jevons' bet** (`jevons`, at the power island): a cheaper answer has so far meant more answers, not less energy.
- **[strange](../strange.md):** other media (light, spin, analog arrays) are levers at the block and below.
