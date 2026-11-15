# What the worlds share

The eleven worlds are not eleven sites, because almost nothing in them is owned by one. This file lists the
shared layers. Every table below is made from [skeleton.json](skeleton.json); the worlds are named by their
short ids (think, strange, limit, fail, idea, make, know, open, divide, life, scale; [worlds.md](worlds.md)).

The sharing is the point. A lens that two questions use is a place where a visitor can turn from one question
to the other without leaving what they are looking at. An engine that two questions use lets what you did for
one count in the other. Take the sharing away and you have eleven lists.

## 1. Lenses: ways of seeing

**What a lens is.** A lens lays one thing out across the picture, and has one move of its own along it. The
dive lays out scale, and its move is in and out. A lens is named by what it lays out, never by how it is drawn:
the 3D flight through the data centre and the flat zoom below the chip are one lens, drawn two ways.

**Why eleven.** I asked what there is about a chip that can be laid out, and found eleven things: how big
(Dive), when (Clock), in which form (Forms), in what order it is made (Line), how many of it (Copies), where
inside it (Plan), where around it (Map), what it could be instead (Walls), what else does the same job (Side by
side), who is in charge (Swarm), and what you know of it only by trying (Probe). The number depends on two
cuts I made. The Plan and the Map share a grammar (ground, districts, flows) and differ in what the ground is:
the inside of a chip, or the world round it. The Clock could have been three lenses (one tick, a chip's years,
fifty years); I made it one, because moving between lengths of time is the same act as diving between lengths
of space, and the site has no picture of time at all. If the count changes, nothing else does.

**Home.** Each world has one lens that shows its tension best. A visitor does feel that each question has a
visual world of its own, as the owner wanted. But no world owns its lens: every lens is used by at least three
worlds.

| Lens | What it lays out across the picture | Its own move | At home in | Also used by | Today |
| --- | --- | --- | --- | --- | --- |
| **Dive** | scale: one thing inside the next, from a building to an atom | in and out | think | strange, limit, fail, idea, make, divide, life, scale | exists: the flight, the flat dive and the levels in 3D (src/v2/level3d.js, src/app/world.js) |
| **Forms** | one design in every form it takes at once: the job, the description, what it does, its gates, its layout, its masks | more exact, or more free | idea | think, fail, know, open | partly: the studio's six stations, shown one after another (src/app/design.js) |
| **Line** | the order things are made in: one wafer followed from crystal to package | the step before, the step after | make | strange, fail, idea, know, scale | exists: the factory line (src/app/journey.js, journey3d.js) |
| **Copies** | one design as the many chips made from it: a wafer, a batch, a fleet, each a little different | from one chip to all of them | fail | make, open, divide, life | partly: the wafer with its lost chips (src/v2/wafer3d.js) |
| **Plan** | the ground divided into districts, and what flows between them: numbers, energy, heat | follow a flow | divide | think, life | partly: the chip as a relief and as an X-ray (src/v2/relief3d.js, src/engines/xray.js) |
| **Map** | the world around the chip: who does what, where, and who depends on whom | from a place to the places it needs | open | idea, make, know, divide, scale | exists: the island and the supply map (src/v2/map3d.js, src/app/map.js) |
| **Clock** | time, at every length: a switch flipping, one tick, a program, a wafer's months, a chip's years, fifty years of chips | slower and faster, as the dive is nearer and farther | scale | think, strange, limit, fail, make, know, open | new: only the signal traces at the studio's check |
| **Walls** | everything a chip could be, as a ground with walls: where today's chips stand, what is out of reach, and what kind of wall stops it | toward a wall, or along it | limit | strange, make, life, scale | new: the physics floor is an engine with no picture (src/engines/floor.js) |
| **Side by side** | different things doing the same job at the same moment | swap one for another | strange | limit, idea, know, open, divide, life, scale | new: debates and the ways to compute are lists of words |
| **Swarm** | many small things with no one in charge, and the pattern that comes out of them | from one unit to the whole | life | think, open | partly: the makers' village draws the record (src/v2/map3d.js) |
| **Probe** | a thing you cannot open, known only by what you try on it: the picture is the trace of the tries | try again, somewhere else | know | limit, fail, idea | partly: the broken-copy challenge and the tries of the ledger |

**Three things every lens can do**, so they are not lenses of their own:

- **Run.** Time passes in any lens: a signal crosses the dive's gate, a wafer moves along the line.
- **Compare.** Any lens can be shown twice, with one thing changed. (Side by side is a lens because there the
  comparison is the picture: several machines, one job.)
- **Carry a specimen.** Your design shows in the dive's gates, on the line's masks, in the crowd of copies.

**The site's six kinds of view become lenses** like this:

| Today's view (`docs/SYSTEM.md` §3) | Becomes |
| --- | --- |
| Map (the island, the supply map) | Map |
| Flight and Dive | Dive, drawn in 3D where you fly and flat where a plan reads better |
| Stack (the dive and the line as one cut through a chip) | The turn between Dive and Line: the same level as used, and as made |
| Line | Line |
| Bench (the studio; every challenge) | Forms for the studio. A challenge is no longer a view: it is an experiment, shown in whatever lens it has |

**Rules for a lens.** It wears the same frame as every other ([rebuild.md](rebuild.md), "One frame"). Words are
HTML over the picture, never drawn into it. It is drawn well, or not at all: until then its experiments are
read as documents. A twelfth lens needs a thing to lay out that none of the eleven lays out.

## 2. Engines: what is true

**What an engine is.** A model in code with no screen: something goes in (a specimen and its conditions),
measures come out, and it can say yes or no to a target. It is tested, and it says in plain words what it
leaves out. The lab's engines are small on purpose: each keeps the direction and rough size of an effect
right, not the digits.

**Why they are shared.** An engine follows its maths, not a question. The theory of queues describes the
factory whoever is asking. So fifteen engines serve eleven worlds, the busiest of them six worlds each.

| Engine | What it does | The maths behind it | It gives | Used by | Today |
| --- | --- | --- | --- | --- | --- |
| **Logic** | reads a description, checks it against the job, turns it into gates, places and wires them, and grades the tests by the faults they would catch | Boolean algebra, search (annealing, maze routing), fault models | certainty, space, work done | think, limit, fail, idea, open | exists: `src/engines/tinychip.js`, `src/engines/design.js` |
| **Core** | a small RISC-V processor that runs real programs through an arithmetic unit made of the community's designs | state machines, two's complement arithmetic | certainty, work done | think, idea | exists: `src/engines/core.js`, `src/engines/riscv.js`, `src/engines/alu.js` |
| **Timing and power** | the slowest path against the tick, and the heat that follows from speed, size and switch generation | delay of a charging wire, energy per switch, power per area | work done, energy, space | think, fail, idea, divide, scale | exists: `src/engines/chip.js` |
| **Stress** | what variation, heat, supply dips, ageing, missed defects and radiation do to a design over years in a phone, a car or a data centre | probability distributions and their tails, rate laws for ageing | years of life, good copies, certainty | fail, life | exists: `src/engines/life.js` |
| **Floor** | how far a chip is from the limits physics sets on energy and speed | thermodynamics and information theory (Landauer, Carnot), the speed of light | energy, work done | think, strange, limit, divide, life, scale | exists: `src/engines/floor.js` |
| **Factory** | a factory where wafers go round the same machines many times: its pace, its queues, its bottleneck | queueing theory | time to make, money | make, know | exists: `src/engines/fab.js` |
| **Supply** | what stops, and where, when a place in the chain stops | reachability in a graph | reach, time to make | open, divide | exists: `src/engines/supply.js`, `src/data/world.js` |
| **Record** | replays everything the community added and works out, from the entries alone, what stands, what is broken and what calls loudest | replaying an ordered log; traces that attract and fade | certainty, reach | fail, idea, know, open, life, scale | exists: `src/engines/ledger.js`, `src/engines/build.js` |
| **Yield and money** | specks to good chips, chips per wafer, and what a chip costs when the cost of starting is split over few or many | Poisson statistics, splitting a fixed cost | good copies, money, reach | fail, idea, make, open, divide, scale | partly: `src/engines/chip.js` |
| **Work** | how fast and at what energy a job runs, given how it is divided: cores, special districts, where the memory sits | Amdahl's law, the cost of moving a number against the cost of using it | work done, energy, space | strange, divide | partly: `src/engines/chip.js`, `src/engines/xray.js` |
| **Scaling** | what follows when every length shrinks by the same factor, where that rule broke, and how a doubling curve bends | exponentials, S-curves, learning curves | space, work done, energy, money | limit, scale | partly: `src/engines/chip.js` |
| **Process** | a recipe of steps acting on a slice through the wafer, and a check of what was built: is it a working switch? | geometry: adding, masking and carving layers of a grid | good copies, time to make, money | make; next: fail, strange, scale | missing |
| **Substrate** | any kind of switch as a curve, a noise, a delay and an energy: does a 1 survive a chain of them, and what does each step cost? | repeating a curve on itself until it settles or fades | energy, work done, certainty | strange; next: limit, life, scale, think | missing |
| **Tune** | a machine with dials, some unlabelled, that drifts: you learn it by trying, and what you learned can be handed over or lost | finding the best setting through noise; learning curves | good copies, time to make | know; next: make, fail, open | missing |
| **Swarm** | many simple units with local rules: spikes, cells, trails; what the whole computes, at what energy, and how much damage it survives | systems of many interacting parts | energy, years of life, work done | life; next: think, divide, open | missing |

**What each engine owes the lab** (the contract; today the eight that exist meet the first three):

1. It is pure: no screen, no network, the same answer for the same input. So it runs in a test, in the
   browser, and behind the open port for an AI agent, unchanged.
2. It has tests, and `npm test` runs them.
3. It says what it leaves out, in its first comment.
4. *New:* it names the measures it gives, by the shared names below, so two engines can be laid on one
   picture and a challenge can use both.
5. *New:* it carries its **claims**: the true things experiments may say on its authority, each as a small
   function a test runs. "Same table, different chip" is a claim of Logic. If the engine changes and a claim
   stops holding, the test fails and the sentence comes off the site.

**The four that are missing** are listed with what they must do, and each is a contribution someone could
bring: Process (make), Substrate (strange), Tune (know), Swarm (life). Each starts in one world and would be
used by others soon after (the *next* in the table). **Three are only partly there**: their maths lives inside
`src/engines/chip.js`, the model of "your chip", which grew a little of everything. Giving Yield and money,
Work, and Scaling homes of their own is the first step of stage 5 of the plan.

## 3. Measures: what is traded

Nine things a chip costs or gives. They are the units every engine speaks in, the axes of the Walls, the
gauges of every challenge, and the subject of every forecast.

| Measure | It says | Engines that give it | Worlds that trade it |
| --- | --- | --- | --- |
| **Work done** | how much gets computed each second | Logic, Core, Timing and power, Floor, Work, Scaling, Substrate, Swarm | think, strange, limit, fail, idea, divide, life, scale |
| **Energy** | what each step costs in energy, and where the heat goes | Timing and power, Floor, Work, Scaling, Substrate, Swarm | think, strange, limit, divide, life, scale |
| **Space** | how much silicon it takes | Logic, Timing and power, Work, Scaling | strange, idea, divide, scale |
| **Money** | what one chip costs, and what it costs to start at all | Factory, Yield and money, Scaling, Process | idea, make, open, divide, scale |
| **Time to make** | how long from an idea to a working chip | Factory, Supply, Process, Tune | idea, make, know, open |
| **Good copies** | how many of the chips made actually work | Stress, Yield and money, Process, Tune | fail, make, know |
| **Years of life** | how long a chip stays right once it is in use | Stress, Swarm | fail, life |
| **Certainty** | how sure anyone can be that it does what was meant | Logic, Core, Stress, Record, Substrate | think, strange, limit, fail, idea, know, open |
| **Reach** | how many people could make it, and who depends on whom | Supply, Record, Yield and money | make, know, open |

**Why they are a layer.** Measures are the joints between worlds. Almost every link in [worlds.md](worlds.md)
is one measure seen from two sides:

- *Space* is what Timing wants more of (more cores) and what Yield punishes (a bigger chip catches more
  specks). That is the edge between *divide* and *fail*.
- *Money to start* is what a shared run splits (*open*) and what each new process raises (*scale*).
- *Certainty* is what a test buys (*idea*), what a break takes away (*fail*) and what no count of cases can
  ever make complete (*limit*).

The industry's own shorthand is three of these: power, performance, area. The lab needs the other six because
its questions are not only an engineer's: time to make, good copies, years of life, certainty and reach are
where the factory, the world and the community come in.

Figures from the world (`src/data/facts.json`) are readings of the same measures, so a real chip can stand on
the same picture as yours.

## 4. Specimens: what is on the bench

| Specimen | What it is | Today |
| --- | --- | --- |
| **The open computer** | the small computer the community is building round a RISC-V core, piece by piece (src/data/build.js) | exists |
| **Your design** | one piece of it, as you described it (the tiny-chip engine) | exists |
| **Your chip** | a whole chip as a few settings every engine reads: clock, switch generation, size, memory (src/engines/chip.js) | exists |
| **Three chips in use** | a data centre's AI chip, a phone's chip, a car's chip, in general terms, to stand beside yours | exists |
| **The strange shelf** | other things that compute: light, spins, DNA, dominoes, neurons, each as numbers an engine can run | missing |
| **The lab itself** | its own record: who built, broke, tried and asked | exists |

One system needs these to be one family, and they nearly are: your design is a piece of the open computer; the
open computer is a chip with settings; the three chips in use are other chips with other settings. Stage 5 of
the plan ties them: one specimen with levels of detail, so that what you change in one experiment is there in
the next. "Universal, not only AI chips" is kept by adding specimens, never by adding structure.

## 5. Givens and directions: the frontier

**The idea.** Every chip made today rests on a few things taken as given. They are so ordinary that nobody
states them. Each was once a choice. **A direction is a bet that drops one or two of them.** That gives the
frontier a shape: not a list of technologies, but fifteen assumptions and what happens to each when someone
lets go of it.

| Today's chip takes as given | Directions that drop it (stage) | Worlds that stand on it |
| --- | --- | --- |
| It is made of silicon | Superconducting logic (1); Channels a few atoms thick (1); Carbon nanotube chips (2); DNA to store and to compute (1); Living neurons as computers (2) | strange, scale |
| It computes with switches that move charge | Computing with light (3); Superconducting logic (1); Light between chips (3); Parts that remember what passed through them (2); DNA to store and to compute (1) | strange |
| It has two exact states, 0 and 1 | Quantum computing (2); Analog computing (3); Approximate computing (4); Probabilistic bits (2) | think, strange, fail |
| One clock tells every part when to move | Brain-like chips that spike (3); Sensing only what changes, like an eye (3) | think, life |
| It follows a stored program, a step at a time | Brain-like chips that spike (3); Dataflow and wafer-scale chips (4); Living neurons as computers (2) | think, divide, life |
| Memory sits apart from the logic | Brain-like chips that spike (3); Computing inside the memory (3); Parts that remember what passed through them (2) | divide, life |
| Its switches lie in one flat layer | Stacking: memory towers, switches on switches (3) | make, scale |
| It is one piece of silicon | Dataflow and wafer-scale chips (4); Chiplets: small chips joined in one package (4) | divide |
| It is printed with light through masks, by adding layers and carving them away | Stamping patterns like a seal (2); Writing each chip with electron beams (3); Materials that arrange themselves (1); Placing atoms one at a time (1) | make |
| It is made in a giant factory | A factory in one room (2) | make, open, scale |
| It is designed by a few, with closed tools | Open design kits and open tools (3); Shared runs: many small designs on one chip (4); RISC-V: an open instruction set (4); AI that writes, places and checks designs (3) | idea, open |
| It throws information away at every step | Reversible computing (1); Quantum computing (2) | strange, limit |
| It is frozen the day it is made | Chips that watch and adjust themselves (4); Chips rewired, or learning, after they are made (3) | limit, fail, idea |
| It is checked by trying cases | Proving a design right for every input (3) | limit, fail, idea |
| The craft of making it lives in people | AI that writes, places and checks designs (3); AI that learns a factory from its sensors (3) | know |

The stage (0 an idea, 1 lab demos, 2 prototype chips, 3 early products, 4 in wide use) is an editorial
judgment made to compare directions with one another, as `src/data/ways.js` already does for ten of them. The
other twenty-two are named today only as phrases under stops ("what people are trying"). Each needs a source
before the site shows its stage.

**What this does for the lab.**

- At any experiment a visitor can ask: *what is this taking as given?* The answer is a short list, and each
  item leads to the directions that drop it, and to experiments where it is dropped.
- A direction crosses questions (23 of the 32 belong to two or more worlds), so it is a way sideways.
- Where an engine can, dropping a given is a setting: the Floor engine without erasing, the Work engine with
  memory beside the logic. Then the frontier is not something you read about. It is something you switch on.
- Not all progress drops a given. Most of the industry's work keeps all fifteen and pushes harder (a larger
  mirror, a thinner sheet). The lab should say so plainly; it is the other side of every debate.

The list of givens is open. I am least sure of the last two (checking by trying cases; the craft living in
people): they are about how chips are made sure and made at all, not about the chip. I kept them because two
worlds (limit, know) have nothing else to stand on.

## 6. The record: who did what

The community is not a layer of topics and not a place. It is what happens to experiments, kept. Everything
decided in `docs/reviews/community.md` stays: one file per entry, never edited, replayed in order by
`src/engines/ledger.js`; standings from the entries alone; no votes, no points; what is open has a pull worked
out from the traces; anyone may run an agent; the lab runs none; every entry says who made it and how AI was
used.

What the framework adds is that the kinds of entry grow to cover every layer:

| Kind of entry | What it is | Today |
| --- | --- | --- |
| A design | a description for a piece, checked by its engine | exists |
| A break | a case that makes an accepted thing answer wrong; it joins the check for good | exists |
| A try | an attack that failed, kept, so attention moves on | exists |
| A question | asked at an address; work gathers under it | exists |
| A report | the lab itself broken, by anyone, at any time | exists |
| A fix | a report answered | exists |
| A run | any experiment done, with its settings and what came out | planned |
| An experiment | a new question put to an engine, with something true to notice that the engine checks | planned |
| A real case | something that happened to real chips, with its source | planned |
| A figure | a number from the world, with source, date and kind | planned |
| A forecast | a dated claim about a measure, scored when its date comes | planned |
| A direction | a bet that drops a given, with what it gains, what it pays and how far it has come | planned |
| A specimen | another thing to put on the bench, as numbers an engine can run | planned |
| An engine | a new model with tests and a plain list of what it leaves out | planned |

**The same moves in every world.** Build, break, try, ask, show (a case, a figure), bring (an engine, a
specimen, a direction), forecast. What differs from world to world is only what the work leaves behind:

| World | What the community's work leaves behind |
| --- | --- |
| think | the open computer itself: every piece built, broken and rebuilt, and the smallest and fastest design for each |
| strange | the strange shelf: each way to compute as a specimen with sourced numbers, and the cases where its claims failed |
| limit | the table of walls: each wall, its kind (nature, mathematics, money, habit), how close anyone has come, and the cases that moved one from a kind to another |
| fail | the case book and the checks that grow: every break adds a case every later design must pass |
| idea | designs for the open computer, by people, AI agents and search programs, each saying who wrote it and how |
| make | recipes: a step or a whole line done another way, judged on whether it still makes a working switch, and at what cost and pace |
| know | notes handed over and what became of them; stories from people who have made chips, signed or sourced |
| open | the lab itself: its record is the experiment, and one day a real shared chip made from it |
| divide | floor plans scored by engines on a shared set of jobs, and the jobs on which each one loses |
| life | the lab's own traces: how people and AI found work with nobody assigning it, and the local rules tried on that record |
| scale | forecasts: dated claims about a measure, kept, and scored when their date comes |

**Who is good at what** (read from the record so far, which is small). Search programs break things fastest
and cannot say why it matters. AI agents build quickly, go straight to what the plan needs most, and gather
and cross-check sources well. People ask the questions, say what a result means, and know what no engine
models. A world is healthy when all three kinds have something to do in it. By that test *know* is the world
where people lead, *fail* and *think* are where programs and agents are already at work, and *strange* and
*scale* are where agents could do the most soon (sourced numbers, dated forecasts).
