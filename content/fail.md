# Why can a perfect design fail in the real world?

> **The question behind it:** is "perfect" only possible inside our models?

## Why it is open

**A design is one exact thing.** Before a chip is made, its design is checked: every rule right, every signal on
time. But **the world makes a million inexact copies of it**, and runs them hot, on a shaky supply, for years. The
check was made on an imagined chip: a typical one, at room temperature, brand new. No real chip is that one. A
design can be perfect and still fail, and the question is whether "perfect" ever meant anything outside the model.

## What is true

**1. No two copies are the same.** A switch's size is set by a few dozen atoms, and atoms land where they land.
Each copy of a gate is a little faster or slower than its neighbour; each chip on a wafer differs from the next;
wafers differ from wafers. A design must work for the slow ones too, so it is built with a margin, and the margin
costs speed every fast chip gives away.

**2. Specks land at random.** Despite the cleanest rooms on Earth, specks of dust and tiny flaws land on wafers. A
speck ruins only the chip it lands on, so the bigger the chip, the more likely it is hit. Yield, the share of chips
that come out working, falls fast as chips grow (see [divide](divide.md) for what that does to how chips are split).

**3. "On time" is a matter of chance.** Inside a chip, a signal must arrive before the next tick of the clock, or the
chip reads the wrong value. Every path has its own length, every copy its own speed, every moment its own
temperature and supply voltage. On time means on time for the slowest path, in the slowest copy, at the worst
moment.

**4. Heat is the main enemy, and it is everywhere.** Nearly all the electricity a chip uses leaves it as heat. Hot
switches are slower and leak more, which makes more heat. Chip and package grow by different amounts as they warm,
and the joints between them flex every time.

**5. Chips age.** Under voltage and heat, switches slowly weaken and wires slowly thin as current pushes their atoms
along. A chip that is right on day one can be wrong in year three. A phone needs a few years; a car's electronics
are expected to last fifteen or more ([Monolithic Power Systems](https://www.monolithicpower.com/jp/learning/resources/automotive-electronics-reliability-testing-starts-and-ends-with-the-mission-profile)).

**6. Tests check only what someone thought to check.** Every chip is tested before it is shipped, but a test is a
short list of patterns. Small circuits can be tried for every pattern; a processor has more than anyone could ever
try (see [limit](limit.md)). Some broken chips pass.

**7. Rare is common at scale.** A fault that hits one chip in a thousand is nothing in your hand and something every
day in a hall of hundreds of thousands. Meta found about one silicon device in a thousand in its fleet quietly
computing wrong answers ([arXiv](https://arxiv.org/abs/2203.08989)). A car maker that accepts one bad chip in a
million can still have about one car in a hundred with a fault, because each car carries so many chips
([SemiEngineering](https://semiengineering.com/the-drive-towards-zero-defects)).

**8. Right is not the same as good.** A chip can do exactly what its design says and still be wrong for the job: the
design was mistaken, or the world uses it in a way nobody imagined.

**9. A system can be more reliable than its parts.** Keep spares, check answers twice, store extra bits that let an
error be found and fixed, vote among three copies. Every reliable system is built from unreliable parts; the price
is space, energy and speed.

## The visual system: Copies

**What it lays out:** one design as **a crowd of chips**: a wafer, a batch, a fleet, each copy a point, slightly
different from the next. Across the picture runs the window every copy must stay inside: fast enough, cool enough,
right. Time runs forward: the crowd drifts as the chips age, specks remove some, heat pushes others out of the
window. A copy that leaves the window fails.

**What you can do:** choose where the chips will live (a phone, a car, a data centre, space); choose margins, tests,
cooling and error correction; run the years forward and watch how many leave the window, and when.

**What it shows that words cannot:** that failure is a crowd falling off an edge, not a single event. The perfect
design is the centre of the crowd; nobody lives at the centre.

**Status:** partly drawn: the wafer with its specks, and the life of a chip in a phone, car or data centre as
challenges. The crowd as one picture is new.

![Copies](img/copies.svg)

## The engine: Stress

**What it computes:** for a design and a place to live: how its copies spread in speed; how heat, supply dips and
age move them; how many are hit by specks, by missed faults, by particles from space; how many leave the window,
and when; what each fix costs.

**Its maths:** probability (the spread of copies as a normal curve, its far tails); textbook models of ageing,
wire wear and early failures; counting faults that tests catch.

**What it decides:** whether a chip survives its life where it is sent; how many copies of a design come out
working; which broken copy a set of tests would find.

**Today:** `src/engines/life.js` (life in a phone, a car or a data centre), yield in `src/engines/chip.js`, fault
grading in `src/engines/design.js`, all tested. Every model says what it leaves out; their numbers are for the
direction and rough size, not the digits.

## Questions inside

| Question | Something true to notice |
| --- | --- |
| No two gates come out identical. How do you design with parts you cannot fully trust? | Each is slightly faster or slower than its neighbour. |
| Specks land at random. Why does a bigger chip come out broken more often? | A speck ruins only the chip it lands on. |
| The design is exact; the arrival times are not. What does "on time" mean? | A signal that arrives after the tick is read wrong. |
| One board turns hundreds of watts into heat. Where does it all go? | Nearly all of a chip's electricity leaves it as heat. |
| An insulating skin a few atoms thick lets electrons leak through. What do you do when the rules change? | At that size electrons behave partly like waves and cross barriers that should stop them. |
| If every pattern you tried gave the right answer, is the design right? | A processor has more patterns than anyone could ever try. |
| Needles test every chip before the wafer is cut. What can a test never catch? | A test checks only what someone thought to check. |
| In a hall this size, something is always failing. Can a system be more reliable than its parts? | With hundreds of thousands of parts, rare faults happen every day. |
| This unit works the brakes. How do you trust a chip with a life? | Safety chips assume something will go wrong, and are built to notice it in time. |
| A chip computed every answer right and leaked secrets through its timing. Is "correct" the wrong word? | It did exactly what its design said. |

## Challenges

| Challenge | What you change | What the engine judges |
| --- | --- | --- |
| **Through a phone's life.** | margins, tests, cooling, error correction | the chip lives its years, at a price a phone can pay |
| **Through a car's life.** | the same, for fifteen years of heat and cold | failures in parts per million |
| **Through a data centre's life.** | the same, flat out and hot | no silent errors |
| **Find the broken copy.** Four copies of your design, one spoiled by a speck. | the test patterns you run | found, with as few patterns as possible |
| **How much margin?** Give away as little speed as you can and still be safe from the worst copy in a million. | the clock margin | the share of copies that fail |
| **A test that misses.** Write tests for a design; someone else finds a fault your tests miss. | your tests; their fault | which faults are caught |

The first four exist in the lab today.

## Innovation direction: chips that check and repair themselves

Instead of hoping every copy is good, assume some are not and build chips that notice:
- **Testing while working.** Large data centres now keep testing chips while they run and retire the bad ones, after
  silent errors were found in the fleet.
- **Sensors inside the chip** that measure its own speed and heat, and raise its voltage as it ages.
- **Spares and votes:** extra rows of memory to swap in, three copies of a circuit that outvote a faulty one,
  error-correcting codes in every memory.
- **Proving instead of testing:** mathematics that shows a circuit is right for every input, so the tests no longer
  have to find design errors (see [idea](idea.md)).

**The catch:** every check costs space, energy and speed, and a chip that changes itself is harder to be sure of.

## Community topic: break it

The community's designs are not trusted because they were checked once. Anyone can try to break any design: find an
input where it is wrong, a speck that a design's tests would miss, a condition (heat, age, a slow copy) under which
it fails. Every break that holds becomes a case every later design must pass, so the checks grow with the record.
People and AI agents break things side by side; the record says who found what.

**How it is judged:** a break is real when the engine reproduces it.

## Real cases

| Year | What happened | What the check did not know |
| --- | --- | --- |
| 1994 | [The Pentium that could not divide](https://en.wikipedia.org/wiki/Pentium_FDIV_bug): five missing entries in a table; a $475 million charge | the tests never tried those numbers |
| 2000 | [The fastest Pentium III](https://www.theregister.com/2000/08/28/intel_recalls_1_13ghz_pentium), recalled weeks after launch | it crashed in some heavy jobs at its rated speed |
| 2003 | [4,096 extra votes](https://en.wikipedia.org/wiki/Electronic_voting_in_Belgium): one bit flipped in memory | a particle from space is the suspected cause |
| 2011 | [Disk ports that slowly died](https://www.intc.com/news-events/press-releases/detail/688/intel-identifies-chipset-design-error-implementing-solution): about $700 million to fix | nothing was wrong on the first day |
| 2018 | [Processors that leaked secrets](https://meltdownattack.com/) | guessing ahead left traces nobody imagined an attacker could read |
| 2021 | [Cores that quietly compute wrong answers](https://arxiv.org/abs/2203.08989) | rare flaws, at a scale of millions of cores |
| 2024 | [Desktop chips that grew unstable](https://community.intel.com/t5/Blogs/Tech-Innovation/Client/Intel-Core-13th-and-14th-Gen-Desktop-Instability-Root-Cause/post/1705129): two extra years of warranty | a clock circuit aged faster under high voltage and heat |

## Where it meets other questions

- **[make](make.md):** every step of the factory leaves its mark on how copies differ; specks are a factory's problem
  as much as a design's.
- **[limit](limit.md):** no test can try every case of a big circuit.
- **[divide](divide.md):** yield is the reason big chips are split into several small ones.
- **[idea](idea.md):** a design that is right by its description and wrong for its job.

## From earlier work

Fits and comes back almost whole: the reality stress test (phone, car, data centre, satellite; margins, tests,
error correction); the seven case files; wafer and yield; finding the broken copy; the clock pushed until it
breaks. This is the world the lab knows best.
