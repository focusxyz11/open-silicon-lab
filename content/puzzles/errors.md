# How can a chip be right when its parts aren't?

> **The question:** every part of a chip goes wrong now and then: a bit flips, a signal is late, a copy is born broken.
> How can the whole still give the right answer?
>
> **The question behind it:** every reliable system is built from unreliable parts. Where should the checking live, and
> who pays for it?

A puzzle (see [README](README.md)): one problem that runs through every level, from the atom a particle strikes to the
hall where a fleet of machines answers, so no level can solve it alone. It is where the puzzles meet the core question
*why can a perfect design fail?* ([fail](../fail.md)). That world explains why parts go wrong. This puzzle asks how to
stay right anyway, and keeps score.

## Why it is open

**Protection can sit at every level.** A flipped bit can be fixed by the memory that holds it, a wrong sum outvoted by
copies of the logic, a broken machine found by a fleet that tests itself, a wrong value shrugged off by the job.

**Every level's protection costs.** Extra bits on every read, copies of the logic, a slower clock, time spent testing:
energy, area and time. Protect too little and wrong answers get out without anyone knowing (**silent** errors).
Protect everything everywhere and the chip is slow, big and hot.

And a protection catches only the errors it can see. A code on memory never sees a wrong sum; copies of the logic all
read the same wrong word from memory; retrying never redoes an answer nobody knew was wrong. So the puzzle is not *how
much* protection, but *which, where*, and nobody knows the cheapest plan that is right enough for a phone, a car, a
data centre or a satellite.

## What is true

The truths of why parts go wrong have their home in [fail](../fail.md): no two copies are the same, specks land at
random, chips age, tests check only what someone thought to check, rare is common at scale, and a system can be more
reliable than its parts. These are the truths about staying right.

**1. Radiation flips bits, from outside and from inside.** At sea level about thirteen fast neutrons from cosmic rays
cross every square centimetre every hour, and the chip's own package adds alpha particles from traces of radioactive
elements in its solder; at sea level the two cause about as many flips each
([Rauch, IEEE](https://eds.ieee.org/images/files/Education/terrestrial_radiation_induced_soft_errors_in_integrated_circuits.pdf)).
At a plane's cruising height there are about 300 times more neutrons
([Science in School](https://scienceinschool.org/article/2023/particle-physics-aviation-safety)). A megabit of on-chip
memory flips hundreds to a few thousand times in a billion hours on the ground
([Tezzaron](https://tezzaron.com/media/soft_errors_1_1_secure.pdf)). In orbit it is far worse: a small satellite's
memory flipped about 4 × 10⁻⁷ times per bit per day, more than ten thousand times a typical rate on the ground
([Bentoutou](https://zenodo.org/api/records/1072680/files/9391.pdf/content)).

**2. A few extra bits can fix a flipped one.** Store 8 check bits beside every 64 and any one flipped bit can be found
and fixed, and any two found (a Hamming code, *SECDED*: single error correction, double error detection)
([AMD](https://docs.amd.com/api/khub/documents/UXxjwXIsSdz9u~seS8w6cg/content)). One check bit (*parity*) only finds an
odd number of flips, and misses two. Codes are everywhere memory is, and still needed: in Google's servers about a third
of machines saw at least one corrected memory error a year, and 1.3% one the code could not fix
([Schroeder et al.](https://www.cs.toronto.edu/~bianca/papers/sigmetrics09.pdf)).

**3. Some broken copies pass every test and compute wrong, quietly.** Meta found about one silicon device in a thousand
in its fleet giving silent wrong answers ([arXiv](https://arxiv.org/abs/2203.08989)); Google saw a few such "mercurial"
cores per several thousand machines ([Hochschild et al.](https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s01-hochschild.pdf)).
No code on memory sees them: the arithmetic itself is wrong.

**4. At scale, machines stop all the time.** Training Llama 3 on 16,384 GPUs, Meta had 419 unexpected interruptions in
54 days, about 78% put down to hardware, six of them to silent data corruption
([Llama 3](https://arxiv.org/abs/2407.21783)): one every three hours. A stop is seen; it costs time, never a wrong
answer.

**5. Copies decide by comparing.** Two copies that compare find a difference but cannot say which is right. Three that
vote fix any one wrong copy and none if two are wrong, so a small chance becomes a much smaller one: ten times rarer
faults, a hundred times rarer wrong answers. A fault every copy shares (a clock, a supply, a flaw in the design) passes
them all.

**6. A car's brakes ask for fewer than 10 failures in a billion hours.** The car standard ISO 26262 at its highest level
(ASIL D) asks for random hardware failures under 10 FIT (failures in 10⁹ hours) and at least 99% of single faults caught
([Battery Design](https://www.batterydesign.net/battery-management-system/functional-safety/bms-hardware-architectural-metrics-spfm-lfm-pmhf/)).
A car may accept only about one bad chip in a million, because each car carries thousands
([SemiEngineering](https://semiengineering.com/the-drive-towards-zero-defects)).

**7. An AI shrugs off most wrong values.** One bit flipped in an accelerator's datapath changed the top answer of an
image-recognition network (AlexNet) only 0.4% to 7% of the time, depending on its number format; most flips are erased
by the network's own steps, and only the high bits of a number matter
([Li et al.](https://research.nvidia.com/sites/default/files/pubs/2017-11_Understanding-Error-Propagation/SC17_DNN_Resilience.pdf)).
A brake controller cannot shrug anything off.

**8. Purer materials cut the flips from inside.** Ultra-low-alpha solder emits under 0.002 alpha particles per square
centimetre per hour, ten or more times less than ordinary solder
([Solstice](https://www.solstice.com/us/en/products/semiconductor-materials/low-alpha-materials)). Neutrons pass through
any package.

**9. A slower clock is a margin against lateness.** Selling a chip slower than its design allows lets the slow copies,
hot days and old age still arrive on time (see [fail](../fail.md)). The margin costs speed, but only when the chip is
computing: while it waits for memory a slower clock costs no time at all (see the [energy puzzle](energy.md)).

## Level by level

The engine's places: a **phone** (a 2-second answer from an assistant on the phone, 64 megabits of memory in use), a
**car** (one millisecond step of a brake controller, 16 megabits, fifteen hot years), a **data centre** (the energy
puzzle's answer: a 70-billion-parameter model writing 500 words, about 3 seconds, 400 megabits) and **space** (one
second of a satellite's computer, built like a car's, in low Earth orbit).

| Level | Where errors come from | Levers people are trying | Their catch | Already in the lab |
| --- | --- | --- | --- | --- |
| **Job** | Nothing breaks here; this is where a wrong value matters or not | Work that tolerates errors (an AI); clipping values to their usual range; checksums on matrix arithmetic | Only some work tolerates; a checksum also stops answers the job would have shrugged off | `brain` |
| **Hall** (building) | Rare faults made common by scale: copies that compute wrong now and then | A fleet that hunts silent errors: machines taken out of service, tested, the bad ones retired | Capacity spent testing; finds only faults that last; a fault that shows rarely hides between tests | `later`; Through a data centre's life |
| **Rack** | Machines that stop: a GPU, a link, a power supply | Retry the answer; for long jobs, save the state every so often (checkpoints) | Fixes only what was caught; checkpoints cost time, and the best interval grows only with the square root of the time between stops ([Young](https://doi.org/10.1145/361147.361115)) | the cluster's network (no lab yet) |
| **Package** | Alpha particles from the package's own solder and mould | Low-alpha materials | Price; neutrons pass through anyway | `lid` |
| **Chip** | Copies wrong for good (a defect no test found); logic flipped by a particle | Two copies in lockstep; three that vote; self-test while working | Area ×1.5 to ×2; a pair stops twice as often as one copy is wrong; a fault every copy shares passes | The majority voter (`vote`); `later`, `life`; Through a car's life |
| **Block** | Flipped bits in memory; wires that wear out | Parity; error-correcting codes (SECDED); spare rows swapped in | 12.5% more bits on every read; parity only finds | `wear`; the parity checker; Through a phone's life |
| **Gate** | Late signals: slow copies, heat, a sagging supply, age | A margin on the clock; sensors that raise the voltage as the chip ages | Speed given away wherever the chip computes | `spare` |
| **Switch** | A particle's charge flips a cell | Hardened cells: bigger, or with a second node that restores the first | Area and energy on every cell | `lid` |

**Each place, from nothing to right enough** (the engine; wrong answers that escape silently per billion answers, and
per 10⁹ hours of work):

| Place | No protection | Codes on memory and a 30% margin | What most of the rest comes from | A plan that goes far |
| --- | --- | --- | --- | --- |
| Phone | 401 (720,000 FIT) | 0.47 | copies wrong for good | + three copies: 0.004, at twice the area |
| Car | 0.28 (1,000,000 FIT) | 0.00077 (2,800 FIT) | late signals | + two copies and self-test: 2.7 FIT, under the 10 ASIL D asks |
| Data centre | 47 | 0.13 | copies wrong for good | + checksums, a fleet that hunts, retry: 0.0006, at 16% more energy |
| Space | 23,000 | 450 | flips in the logic | + two copies and self-test: 0.0008, though the pair stops 1,300 times per billion |

**Each lever in the data centre** (the engine, from codes on memory and a 30% margin):

| Lever | Silent per billion | Energy | Area | Time | The other side |
| --- | --- | --- | --- | --- | --- |
| codes on memory and the margin | 0.13 | +14.8% | +7% | +1% | the starting plan |
| clip values to their range | 0.026 | +14.8% | +7% | +1.5% | only for work that tolerates |
| checksums on the arithmetic | 0.0013 | +14.8% | +7% | +4% | also stops answers the AI would have shrugged off |
| a fleet that hunts | 0.061 | +15.9% | +7% | +2% | finds only faults that last |
| two copies in lockstep | 0.00075 | +15.5% | +57% | +1.5% | caught answers rise (19 → 24) |
| three copies that vote | 0.00075 | +16.2% | +108% | +3% | twice the logic |
| hardened cells | 0.081 | +16.9% | +39% | +1% | helps only against particles |
| low-alpha materials | 0.10 | +14.8% | +7% | +1% | 5% on the price |

Three things show in the tables. **Wrong level, no help:** three voting copies alone barely touch a satellite's silent
errors (23,171 → 22,447 per billion), because most of them are flipped bits in memory, which every copy reads the same.
**Finding is not fixing:** two copies in lockstep, parity, or a checksum turn silent answers into caught ones, which
cost a redo; only retrying, a code that corrects, or a vote turns them into right ones. **Being right is paid in the
energy puzzle's joules:** in a data centre, where moving data takes most of the energy, three copies of the logic cost
1.4% more energy alone and double the area, while a code on memory costs 14% more energy and 7% more area. In a car's
control loop, where the arithmetic is the work, three copies cost 86% more energy.

## The threads it runs through

The puzzle is not a new place. It runs through questions from the field already asked at their levels:

- **`spare`** (gate): *can the whole be more reliable than every one of its parts?* Von Neumann's question, the
  puzzle's own, where a visitor meets it.
- **`later`** (chip, on the seam from test to use): *why does a chip that passed every test compute wrong years later?*
  The copies wrong for good, and the fleets that hunt them.
- **`lid`** (package): *why did a chip's own package flip its bits?* The flips from inside, and the purer materials.
- **`wear`** (block): *why does a chip that never moves wear out?* Faults that come with age, which only a test that
  keeps running can find.
- **`life`** (the car's control unit): *how sure must a chip be when a life depends on it?* The place where the score
  has a legal floor.
- **`brain`** (gate): *how does a brain think so well with slow, sloppy parts?* The existence proof that tolerating can
  be cheaper than checking.

## The engine: Errors

**What it computes:** for a **place** (a phone, a car, a data centre or space) and a **plan** (one protection at each
level: checks in the job, a fleet that hunts, retry, copies of the logic, self-test, codes on memory, the clock's margin,
hardened cells, the package's materials), how many wrong values arise in every billion answers, from each source
(neutrons, alpha particles, late signals, wear, defects, machines that stop), and where each ends: **fixed**, **caught**
(seen but not fixed: refused, or redone if the plan retries), **masked** (shrugged off by the job) or **silent**. Beside
them, what the plan costs: **energy** on the energy puzzle's scale, **area**, **time** and **price**.

**Its maths:** rates per answer that add; the Hamming code's promise; the chance that two or three copies are wrong at
once; the far tail of the spread of copies for timing. It reuses the engines already in the lab instead of re-deriving
their numbers: the rate of flips, the share that matter and the memory each place uses, and the share of chips that
fall out of their timing window or wear out at each margin (`src/engines/life.js`); the energy and time of one answer
and how a slower clock changes them (`src/engines/budget.js`, and through it the energy table and the power curve).

**What it decides:** an attempt's score, and whether a claim holds: a protection that lowers errors it cannot see, or
costs nothing, is wrong in the engine before it is argued about.

**What it is not:** a reliability simulator. Some of its numbers are choices, said to be in the code: a copy wrong for
good gives a wrong answer about once in a thousand hours of work; hardened cells keep a tenth of the flips; two wrong
copies agree. Its rates are for the direction and rough size, not the digits.

**Today:** `src/engines/errors.js`, tested in `tests/errors.test.mjs`: never wrong in direction (more protection, fewer
silent answers and more cost; a check that only finds turns silent answers into caught ones; protection at one level
never catches errors from another), three voting copies fix one fault and not two, and it matches the life engine, the
satellite's flips, the training run's stops, the server fleets' defects, and the car standard's 10 FIT.

## The score, and what an attempt is

**An attempt** is a plan the engine can run, for a place: one protection at each level, with who made it and how AI was
used. It can come from a person or from an agent through the open port.

**The score** is the number of wrong answers that escape silently in every billion, lower is better; beside it, the
answers caught but not fixed, and what being right costs: energy, area, time and price. Nobody votes. An attempt that is
quieter and no dearer on any side moves the frontier; one that is quieter and dearer is a different bet, not a win. A
car's attempt also meets the standard or not: under 10 silent failures in a billion hours.

**What the community does:** make attempts (a plan); find what is wrong in one (a claimed protection the engine does
not show, a fault the plan does not see); predict which lever pays next in a place; pass on what was learned (the source
the escapes still come from). When the engine cannot express an idea (a new code, a new kind of copy), the attempt is a
question to the engine: which new lever, at which level, with which source.

**On the site:** *Catch the silent errors* at the port (`#/do/silent`, `src/v2/labs/errors.js`): the stack of levels with each protection set on its row, and a goal for each place. Attempts kept in the ledger come next.

## Where it meets other questions

- **[fail](../fail.md):** the home of why parts go wrong, and of "every reliable system is built from unreliable parts";
  this puzzle is that truth with a score.
- **[the energy puzzle](energy.md):** both are scored on the same joules: being right always costs energy, and the
  levels where energy goes decide which protections are cheap.
- **[limit](../limit.md):** no test can try every input of a big circuit, so some broken copies pass.
- **[life](../life.md):** a brain is built from parts far less reliable than switches, and does not check itself the way
  a chip does.
- **[idea](../idea.md):** proving a design right removes the design's own errors, the ones every copy shares.
