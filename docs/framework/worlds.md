# The eleven worlds

Each core question has a world: its experiments, the lens it is at home in, the engines that judge it, what the
frontier looks like from there, and what the community's work leaves behind. This file writes each one out.

Three things to keep in mind while reading.

- **This list is for people building the lab.** The site never shows the eleven together
  (`rootShown` in `src/engines/weave.js` stays the rule). A visitor meets experiments; a question appears alone,
  once they have done two experiments from two different strands of its world.
- **A world has no walls.** Its lenses and engines are shared (see [shared.md](shared.md)), and the experiments
  at its edge belong to two worlds. The *Links* in each section are those edges.
- **"Where it stands" is the owner's test**: without the fancy design, is there enough here? The four numbers
  are experiments that are *playable today · have an engine and wait · are only words · need something
  missing*. They come from [skeleton.json](skeleton.json), where every experiment is listed with what in the
  repository it comes from. Figures named *fact* are in `src/data/facts.json` with their sources.

---

## How does a chip think?

*Behind it: where does thinking come from, the parts, or how they are arranged?*

**The tension.** Every part is simple and understands nothing. The whole answers your question.

**What you see.** The **Dive**, with something happening in it. One sum, `2 + 3`, followed down: in the program
it is one line; inside that, an arithmetic unit; inside that, thirty-two copies of one small slice; inside a
slice, five gates; inside a gate, a handful of switches; inside a switch, electrons crossing a channel. You look
for the adding at every depth and it is at none of them. Above the gate everything is arrangement. Below it
everything is physics. That is the tension made visible, and it is why this world's home is the dive: the dive
is the only lens that can fail to find something at every level. It borrows the Clock (the same sum at each
length of time), Forms (a program as text, as bits, as signals), the Plan (which district is working) and the
Swarm (many simple units).

**The engine behind it.** *Logic* checks any small circuit against the job it must do, for every input.
*Core* is a small RISC-V processor that runs real programs, and its arithmetic unit is made of a slice written
by a visitor or an agent, copied 32 times. *Timing* says whether the slowest path fits in a tick. The maths:
Boolean algebra and state machines. All three exist and are tested.

**What the engine can judge.** A circuit that must do a job (nine jobs exist, from a half adder to a counter).
A program that must leave the right answer. The smallest or the fastest design for a job: the engine counts
switches and times the slowest path, and the record keeps who holds each. Building any gate from one kind of
gate.

**The frontier.** It takes as given: two exact states, a stored program, one clock. Directions that drop one:
brain-like chips, RISC-V as an open base to build on. The open problem is in the question itself. For an AI
model, nobody can yet point to where a fact or a skill is kept; people who study the insides of networks are
still finding out (*from memory; a fast-moving field*).

**The community here.** What accumulates is the open computer itself: every piece built, broken and rebuilt.
AI agents are strong here (one built the register bit the computer needed most), search programs are stronger
at attack (one found in seconds a break no test of the lab's had found), and people ask what it means.

**The questions behind it.** How can on and off mean anything? Does meaning come from the wiring? Is
remembering part of thinking? Is thinking a great deal of adding? At which depth does the thinking begin?

**Links.** To *idea* by the same core as someone described it. To *divide* by how the core's work is split. To
*life* by other ways to arrange simple parts. To *limit* by what no arrangement can do. To *fail* by one stuck
wire in a right design.

**Where it stands: 2 · 4 · 2 · 0.** The lab's best engines are here. With no pictures at all, there is a real
computer that runs real programs on gates you wrote, and that is enough. What is missing is the half of the
question a newcomer cares about most: an AI "answering from a rack like this". Nothing in the lab computes
anything like a network. It needs one tiny network (a few dozen numbers) run on the core, and one sum followed
down.

---

## What is the strangest thing that could compute?

*Behind it: is computing something we invented, or something nature was already doing?*

**The tension.** Almost anything with two states can compute. Almost nothing can do it fast, small, cheap, and
a billion times in a row.

**What you see.** **Side by side**: the same one-bit sum done at the same moment by several machines. Today's
switches. Falling dominoes. Drops of water in channels. Strands of DNA. Beams of light. Each runs at its own
pace under one clock, nanoseconds beside hours. Under each stand the same four readings: energy for a step, time
for a step, size, and how often it is wrong. Then the answer is passed on through ten more gates, and you watch
which signals arrive and which fade on the way. It borrows the Walls (where each machine stands against the
limits), the Dive (which level each one replaces) and the Clock (how far along each has come).

**The engine behind it.** *Substrate*, which is **missing**. It would treat any switch as four things: a curve
(what comes out for what goes in), a noise, a delay, an energy. Apply the curve to its own output again and
again. If the curve is steep in the middle, a weak 1 is pulled back to a clean 1 at every stage. If it is not,
the signal fades. That one rule separates what can be chained from what cannot, and the lab already says so in
words ("a gate's output must be strong enough to drive the next gates"). It is perhaps 150 lines, plus sourced
numbers for each machine. *Floor* and *Work* exist and join it: the energy floor applies to anything that
erases, and each machine wins on some job.

**What the engine can judge.** A gate in a given material that survives ten stages. The job on which a strange
machine beats silicon. A new machine proposed as a curve and four numbers with sources: the engine says what it
can and cannot do. A vendor's claim run with the vendor's own numbers.

**The frontier.** It takes as given: silicon, the charge switch, exactness, erasing. Almost every direction in
the lab's list drops one of these. The figures are current and real: a computer of living neurons is on sale;
photonic processors are installed in two supercomputing centres; a reversible test chip has recovered part of
its energy; probabilistic chips have been made (*facts cortical-cl1, qant-photonic, vaire-ice-river,
prob-chips*). The open problem: no candidate replaces the switch across the board. Each wins one measure and
loses another.

**The community here.** What accumulates is the strange shelf: each way to compute as a specimen with sourced
numbers, and the cases where its claims failed. People who have worked in such labs matter most. AI agents can
gather and cross-check published numbers. Search programs can hunt for the job a specimen wins.

**The questions behind it.** What makes something a computer? What else could a chip be made of? What could
replace the switch itself? Is nature already computing? What is each strange machine best at?

**Links.** To *limit* by the walls each machine does or does not share. To *life* by what a machine is made of,
against how it is arranged. To *think* by what a gate must do whatever it is made of. To *scale* by what takes
over when silicon stops shrinking. To *make* by how you would build it.

**Where it stands: 0 · 0 · 4 · 3.** Today this world is a table of ten technologies with "the catch" for each.
That is a textbook page, however it is drawn. The facts are rich; nothing can be done with them. It becomes a
world the day the Substrate engine exists.

---

## What could a chip never do, and could it learn to?

*Behind it: can a creation go beyond its creator?*

**The tension.** Some walls are laws of nature or of mathematics. Many walls were money, habit or a lack of
ideas, and fell.

**What you see.** The **Walls**: a ground whose two directions are two measures, say energy for a step across
and steps per second up. Your chip is a dot on it. Real chips are dots. Far below runs the floor: the least
energy that erasing one bit can take at room temperature. To one side stands the wall of light: no signal
crosses a chip of this size faster. Each wall is drawn by its kind: a law of nature, a law of mathematics, a
wall of money, a wall of habit. Push your chip toward one and the engine says what gives. Switch on a direction
and a wall moves, because the direction drops the given the wall stood on: reversible computing does not erase,
so the erasing floor is no longer its floor. It borrows the Clock (the same ground through history: where
people once said the walls were), the Dive, the Probe and Side by side.

**The engine behind it.** *Floor* exists and is tested: the least energy to erase a bit (about 3 zeptojoules
at room temperature, and measured: *fact landauer-measured*), the proof that cooling the chip saves nothing
once you pay to pump the heat out, and the speed of light in the glass between wires. It has **no picture
today**; its words wait in a file. It should also count: the number of cases there are against the number
anyone can try. Two 64-bit numbers can be added in 2^128 ways; at a billion a second that is about 10^22 years.
*Logic* judges circuits found by blind search.

**What the engine can judge.** Bringing your chip within a given factor of the floor. A set of tests that
proves a small design for every input, where every input can still be counted. A claim about a wall: someone
says what kind it is, with a source, and a case can move it to another kind.

**The frontier.** It takes as given: erasing, a chip frozen when made, checking by trying cases. Directions:
reversible computing, quantum computing for a few problems, approximate answers, chips rewired or learning after
they are made, proof in place of tests, AI that designs. One real case sets the tone. In the 1990s a search by
blind evolution produced a circuit on a real chip that told two tones apart. It used 37 of 100 cells; five of
them were connected to nothing, and it failed without them; it did not work on another chip of the same type
(see the README's sources). It worked, and nobody could say why. Would you ship it?

**The community here.** What accumulates is a table of walls: each wall, its kind, how close anyone has come,
and the cases that moved a wall from one kind to another.

**The questions behind it.** Is there a floor under all thinking? Is "too hard" a law, or a lack of ideas? What
can no machine settle? What if a chip kept changing after it was made? Can we build what we cannot understand?

**Links.** To *strange* by machines that go round a wall. To *scale* by which wall ends the doubling. To *idea*
by why no check can try everything. To *think* by what a learning chip would be. To *know* by designs that work
and nobody can explain.

**Where it stands: 0 · 3 · 2 · 2.** A very good engine that nobody can see, and the fewest words of any world
(172). The second half of the question, "could it learn to?", has two one-line stops behind it and nothing
else. It needs the Walls lens, counting, and sourced cases of walls that fell. Whether "learning" gets an engine
of its own (a circuit that changes itself) should wait until the first half stands.

---

## Why can a perfect design fail in the real world?

*Behind it: is "perfect" only possible inside our models?*

**The tension.** A design is one exact thing. The world makes a million inexact copies of it and runs them hot
for years.

**What you see.** **Copies**. Your design sits at the centre, one exact dot. Round it is a cloud: every chip the
factory made from it, each a little faster or slower than the design says, each placed by how fast it is and how
much it leaks. Over the cloud lies a window: what the job demands. Dots outside the window are failures. Turn
up the heat, let the supply dip, let ten years pass, and the cloud drifts and spreads. Widen your safety margin
and the window is safe again, and every chip is slower. On a wafer the same dots are chips, and specks kill some
of them. In a hall of a hundred thousand machines the same dots are servers, and about one in a thousand
computes wrong answers without saying so (*fact sdc-rate*). It borrows the Clock (the years), the Probe (what a
test cannot see), the Dive (what goes wrong at each depth), the Line (the step that spoils a copy) and Forms
(the form of a design in which a mistake hides).

**The engine behind it.** *Stress* runs a design through years in a phone, a car or a data centre: variation,
heat, supply dips, ageing, defects the test missed, wear, radiation. *Logic* leaves one wire of a copy stuck and
says which tests would catch it. *Yield and money* turns specks and chip size into good copies. *Timing* says
when a signal is late. *Record* keeps every break. All exist. The maths: probability, and above all the far
ends of distributions, where one in a million lives.

**What the engine can judge.** A chip that lives through its years in a phone, in a car, in a data centre
(three challenges, playable). The spoiled copy found with the fewest tests (playable). A design that passed its
check and is wrong, broken by one case (playable, and the first real break is still open). The margin that
keeps the worst chip in a million inside the window.

**The frontier.** It takes as given: a chip frozen when made, checking by trying cases, exact states.
Directions: chips that watch and adjust themselves, proof, smaller pieces joined together. Open problems: wrong
answers with no error, at the scale of whole fleets, are still being understood; and when AI writes both the
design and its tests, who is responsible for what the tests did not ask.

**The community here.** What accumulates is the case book and the checks that grow: every break adds a case
that every later design must pass. Seven real cases are in the lab with their sources, from a processor that
could not divide to an election with 4,096 extra votes. Programs break best. People say what a break means.

**The questions behind it.** No two copies come out the same. Time: heat, wear and age. What a test can never
catch. Right by the check, wrong for the job. A system more reliable than its parts.

**Links.** To *idea* by the form of a design where a mistake hides. To *make* by the step that spoils a copy.
To *know* by what a test knows and what only a person notices. To *divide* by smaller pieces failing less. To
*life* by machines that still answer when parts die. To *limit* by why nobody can try every case.

**Where it stands: 7 · 1 · 2 · 0.** The strongest world. Switch every picture off and the engine's tables and
seven sourced cases are still worth an evening. What it lacks is a home: today its experiments are scattered
over the port, the test house, the studio and the Lab, because they were filed by where on the chip they
happen. It needs the Copies lens, and then it is the model for the others.

---

## How could your idea become a chip?

*Behind it: how do ideas become real, and who gets to make them?*

**The tension.** An idea is free and vague. A chip is exact and frozen. Every step from one to the other adds
decisions that nobody stated.

**What you see.** **Forms**. One design in all its forms on one screen: the job (what it must do), the
description (a few lines), what it does (every input tried), its gates, its layout (cells in rows, wires on two
layers), its masks. They are tied together. Touch a signal in any form and it lights in all of them. Change one
character and all six change at once, and exactly one of them turns red: the only form that knows the job.
Between each two forms stands whoever made that step, you, a program or an AI, and what they added that you
never said: which gates, which place for each cell, which way round for each wire. The questions of this world
live in those gaps. It borrows Side by side (your design, an AI's, one found by search), the Probe (testing),
the Dive (your gates inside a real block), the Line (the masks arriving at the factory) and the Map (what it
costs to make it real, and where). [forms.html](forms.html) is a working sketch of this lens.

**The engine behind it.** *Logic*, all of it: it reads the description, checks it, chooses gates, places them
by trial and improvement, wires them through a maze, and grades the tests by the faults they would catch, on a
130-nanometre process of the kind open shared runs use. *Core* treats a whole processor as a design. *Timing*,
*Yield and money* and *Record* join it. This is the most complete engine in the lab.

**What the engine can judge.** Right for every input (playable). The smallest, or the fastest, design for a
job. An AI's proposal that says it is right (playable). A set of tests that catches every fault the factory
could leave. The same job built for another factory's process. A design that fits one tile of a shared chip
(about 1,000 cells: *fact tt-tile*).

**The frontier.** It takes as given: a few designers with closed tools, checking by trying cases, a chip frozen
when made. Directions: AI that writes, places and checks designs; open design kits and open tools; shared runs;
proof. The figures are stark: designing a chip for the newest process is estimated at about $725 million
(*fact design-cost-2nm*), and the three largest tool makers now sell AI agents for the work (*fact
agentic-eda*). Open problems: saying exactly what the job is, which stays hard however good the tools get; and
who signs when an AI wrote both the design and the check.

**The community here.** What accumulates is designs for the open computer, by people, AI agents and search
programs, each saying who wrote it and how AI was used. Eleven entries are on the record.

**The questions behind it.** Who decides what the chip should do? What does the description not say? How sure
is sure enough? Who checks the AI, and with what? Who can afford to make it real?

**Links.** To *fail* by the check that passed a wrong design. To *make* by the masks, where the design becomes
the factory's. To *open* by what it costs, alone or shared. To *think* by what the design does once it runs. To
*know* by the why that the description leaves out. To *limit* by why no check can try everything.

**Where it stands: 2 · 4 · 1 · 1.** The best engine and the worst way of seeing it: six small drawings and a
card that says "Step 5 of 6". So it is the first world to rebuild ([rebuild.md](rebuild.md)).

---

## What would chipmaking look like if we invented it from scratch today?

*Behind it: how much of our technology is the way it is only because of history?*

**The tension.** Today's way of making chips is astonishingly good. It is also one path among many, held in
place by sixty years of investment.

**What you see.** The **Line**: one wafer followed through the factory, round the same loop once for every
layer. The lab has this, in 3D, and it is its best picture. The framework adds the two things it lacks. At
every step, the slice through the wafer, so you see what this step did to the chip (the Dive, borrowed). And
beside today's step, another way to do the same job (Side by side): stamp the pattern in place of printing it,
write it with a beam in place of a mask, grow the shape in place of carving it, each with the same four
readings: how fine, how fast, how costly, how many good. It also borrows Copies (the wafer and its lost chips),
the Clock (the months a wafer takes; the inventions that changed the line), the Map (where each step is done)
and the Walls.

**The engine behind it.** *Factory* exists: a line where wafers go round the same machines dozens of times,
with its pace, its queues and its one bottleneck (queueing theory). *Process* is **missing**, and it is the one
that would make the question real. It would run a recipe on a slice through the wafer: lay a layer down, coat
it, expose it through a mask, wash, carve straight down or all round, fire atoms in, strip, polish. Then it
would check what was built: is there a gate, over a thin skin, over a channel, between two doped regions, with
nothing shorted? Order then matters, and a visitor can find out why: fire the atoms in after the gate is made,
and the gate itself shields the channel, so the parts line themselves up. That was one of the inventions that
made modern chips possible (*from memory: the self-aligned gate, late 1960s*). For printing, the engine carries
one sourced law: writing a pattern point by point gets slower with the fifth power of fineness (Tennant's law;
see the README's sources). That is why chips are printed through masks and not drawn.

**What the engine can judge.** Wafers through the factory in under 60 days while it runs 92% full (playable). A
chip with fewer layers (playable). A recipe that makes a working switch in fewer steps. The same switch with no
carving. The cheapest way to make a thousand chips, and a million: where drawing beats printing, and where it
stops.

**The frontier.** It takes as given: printing with light through masks by adding and carving, the giant
factory, one flat layer of switches. Directions: stamping, beams, materials that arrange themselves, atoms
placed one at a time, a factory in one room, AI that learns a factory from its sensors. Open problems: whether
any road to the newest chips avoids a printing machine that costs about $400 million (*fact high-na-price*);
whether a small factory can pay for itself; whether anything this fine can be grown instead of carved.

**The community here.** What accumulates is recipes: a step, or a whole line, done another way, judged by
whether it still makes a working switch, and at what cost and pace. People who have run the tools know what the
engine leaves out. Agents can search the space of recipes.

**The questions behind it.** Why light and masks? Add and carve, or grow? Must a chip be made one layer at a
time? Must the factory be giant and clean? Which order of steps, and why?

**Links.** To *idea* by the masks. To *fail* by what each step can spoil. To *know* by what the recipe does not
say. To *open* by who could run a line. To *scale* by why each new factory costs more. To *strange* by how to
build with other stuff.

**Where it stands: 3 · 1 · 2 · 2.** The most words of any world (703) and the best picture. But its question
cannot be acted on: a visitor can watch the line and cannot change it. "What if we invented it from scratch"
stays a thing to read until the Process engine lets someone try.

---

## What part of making chips can't be written down?

*Behind it: how much expertise lives only in people's hands, and can AI ever capture it?*

**The tension.** What is written: recipes, descriptions, papers. What is known: by hands, by eyes, by teams who
have done it.

**What you see.** The **Probe**: a machine you cannot open. Nine dials; five have labels. A result comes out, a
trench seen in a slice: too shallow, too wide, slanted. You try again. Each try leaves a dot, and slowly the
dots become your own map of the machine. The picture *is* what you know, and nobody gave it to you. Overnight
the machine drifts. Then you are asked to write a note for the next person, and the lab shows you what they
reached from your note alone. It borrows the Clock (the learning curve: good chips against wafers made), the
Map (where the craft sits), the Line (the steps where the recipe runs out), Forms (the why a description
leaves out) and Side by side (two teams, the same tools).

**The engine behind it.** *Tune*, which is **missing**. A hidden rule that turns dial settings into a result,
with dials that affect each other, noise, and slow drift; and a second site whose hidden state differs a
little. The maths is finding the best setting through noise. The ground it stands on is real and sourced: no
scientist built a working laser of a certain kind from the published papers alone, only after contact with
someone who had built one; and one chip maker's answer to this problem is to copy a working factory exactly,
down to the purity of its chemicals; the reason usually given is that nobody can say beforehand which details
matter (see the README's sources).

**What the engine can judge.** A target reached in a set number of tries. A hand-over: what the next person,
or an agent, reaches from your note. A second factory brought up to the first one's result. A person and a
search program on the same machine: who gets there, and who can say afterwards what they know.

**The frontier.** It takes as given: the craft of making chips lives in people. Directions: AI that learns a
factory from its sensors (a large maker says it is adopting it for printing and inspection: *fact ai-in-fabs*,
a vendor's claim), AI that
designs. Open problems: an AI learns from what was recorded, and the hard part is what never was; the
shortfall of trained people (up to 157,000 in one country by 2030, an estimate: *fact workforce*); whether a
design can carry its own reasons.

**The community here.** What accumulates is notes handed over and what became of them, and stories from people
who have made chips, signed or sourced. This is the one world where people lead and AI is the one being tested.

**The questions behind it.** Same tools, different chips. Can it be written down at all? How does it move: on
paper, or with people? Can AI learn what was never recorded? What does a description leave out?

**Links.** To *make* by the step where the recipe runs out. To *fail* by what a test knows and a person
notices. To *open* by an open recipe that still cannot be followed. To *idea* by the why behind each line. To
*scale* by learning curves: cost falls as hands learn.

**Where it stands: 0 · 0 · 3 · 5.** The thinnest world, and design cannot fix it. It needs the Tune engine,
which can be written. And it needs people who have made chips, which I cannot supply and no AI can stand in
for; that is the owner's to seek (README, decision 3). Until then it should stay small and say so.

---

## What happens when anyone can make a chip?

*Behind it: what happens to a society when powerful tools reach everyone?*

**The tension.** A few: a handful of companies can make the newest chips, and one makes the machine that prints
them. Anyone: a place on a shared run costs about what a laptop does.

**What you see.** The **Map**, three times over. The world of who makes chips today: each step of a chip's trip
done in a few places; close one and watch what stops, and where (playable). Over it, the map from where one
person sits: the open tools, the open design kits, the shared runs within reach, and what each still costs.
And the third map is the lab's own island: what strangers and AI built together with nobody in charge. It
borrows Copies (one wafer shared by hundreds of designs), Forms (which forms of a design are open: a
description travels anywhere, a layout fits one factory's rules), the Swarm, the Clock (open software's forty
years, as a mirror) and Side by side.

**The engine behind it.** *Supply* exists: what stops when a place stops. *Record* exists: the lab's own
standings and pull, worked out from the entries. *Logic* builds the same design for four processes. *Yield and
money* is only partly there, inside another engine; this world needs it whole: the cost of starting (masks,
design) split over one design or a thousand, against the cost of each chip. The numbers to anchor it are in
the lab: 1,000 finished chips for $7,000 on one open process, by the seller's claim (*fact wafer-space-run*).

**What the engine can judge.** A chain kept running when a place stops. What each design pays on a shared run,
as the number sharing it changes. A design moved to another factory's kit and passing again. A piece accepted
into the open computer.

**The frontier.** It takes as given: a few designers with closed tools, the giant factory. Directions: open
design kits from three makers and an open tool chain from description to masks (*fact open-flow*), shared
runs, RISC-V (now the base of a mainstream operating system release; a RISC-V microcontroller for under ten
cents: *facts riscv-rva23, ch32v003*), a factory in one room. Open problems: why open blocks do not spread the
way open software did; whether an open design is safer or easier to attack; what a society does with cheap
custom chips.

**The community here.** What accumulates is the lab itself. Its record is this world's experiment, running
live. In the long term, a real shared chip made from that record.

**The questions behind it.** What would anyone need, besides an idea? Why do open parts not spread the way open
software did? Open to check, open to copy: strength or risk? What does it mean to depend on one maker? What
should strangers build together?

**Links.** To *idea* by the cost of making a design real. To *make* by who could run a line. To *know* by an
open recipe not yet being an open craft. To *divide* by an industry divided between a few places. To *life* by
a community that organizes itself. To *scale* by who can afford the newest process.

**Where it stands: 2 · 1 · 3 · 2.** Middling in words and engines, with one thing no other site has: it is its
own specimen. It needs the money engine made whole, so that the price of access is something a visitor can
change and watch.

---

## How should a chip divide its work?

*Behind it: how should any system divide work: cells, companies, societies?*

**The tension.** One general thing that can do any job. Many special things, each fast at one job, that must
keep talking. Dividing work saves effort and costs movement.

**What you see.** The **Plan**: the chip as ground divided into districts, and between them what flows, drawn as
flows: numbers from memory to the cores, energy in, heat out. A flow's width is its amount. The memory wall is
then something you see: a wide stream squeezed down a narrow road, and cores standing idle at the end of it.
Move the memory closer, give one job a district of its own, cut the chip in two, and the streams redraw. The
same picture holds at every scale: cores on a chip, chips on a board, boards in a rack, racks in a hall (the
Dive), and companies in an industry (the Map). That is the question behind the question, shown and not said.

**The engine behind it.** *Work* is partly there: how often a fetched number is used, and where the memory
sits, already change what your chip gets done, and the X-ray says where a chip's area goes. Made whole, it needs
three more things: the part of a job that cannot be split (Amdahl's law), a special district (faster on a share
of the work, at a cost in space), and links between chips. *Timing*, *Yield and money* (small chips come out
good more often), *Floor* and *Supply* join it. One figure carries the world: fetching 16 bits from memory
costs about 3,500 times the energy of adding them (*fact energy-moving-data*).

**What the engine can judge.** Two and a half times the work, every signal on time (playable). More cores,
still cheap (playable). The blocks of a chip found from its photo (playable). A floor plan that wins on a
shared set of jobs. The point at which splitting one big chip into small ones wins.

**The frontier.** It takes as given: memory apart from logic, one piece of silicon, a stored program.
Directions: chiplets, memory stacked beside the processor, computing inside the memory, light between chips
(announced as in production in 2026: *fact cpo-production*), chips the size of a wafer. Open problems: where the next jump
in feeding numbers to processors comes from; whether by 2040 one kind of machine wins or computers are
mixtures.

**The community here.** What accumulates is floor plans, scored by engines on a shared set of jobs, and for
each plan the jobs on which it loses. A break here is a job.

**The questions behind it.** General or special? Was keeping memory apart from logic a mistake? Where should
one chip end and the next begin? Near or far: in your hand, or in a hall? Who should be in charge?

**Links.** To *think* by what the districts are doing. To *fail* by splitting to beat defects. To *scale* by
going up or apart when smaller stops paying. To *life* by work divided with nobody in charge. To *open* by an
industry divided the same way. To *limit* by the energy of moving a number.

**Where it stands: 4 · 1 · 2 · 1.** Strong: 612 words, a real model, four things to play. It reads well with
the pictures off. It needs its engine given a home of its own, and the Plan drawn with flows.

---

## What new kinds of computers could brains, swarms and living cells inspire?

*Behind it: if we stopped copying the 80-year-old computer design, what would we copy instead?*

**The tension.** One clock, one program, one designer. Or no centre at all: many small units, local rules, and
a pattern nobody wrote.

**What you see.** The **Swarm**: many small units, each following a rule about its neighbours and nothing else.
Signals pass only when something changes. A pattern holds though no unit holds it. Beside it (Side by side)
stands a clocked chip doing the same job, every part ticking whether or not there is news. Under each, two
readings: the energy a quiet input costs, and what is left after a tenth of the parts are killed. And a third
swarm is on the screen: the lab. People, agents and programs leave traces on the record, and the loudest call
pulls the next hand. Ants find short paths by the same rule. It borrows the Walls (twenty watts), the Plan,
Copies and the Dive.

**The engine behind it.** *Swarm*, which is **missing**: units with local rules (a cell that fires, a cell in a
grid, an agent that leaves a trail), and what the whole computes, at what energy, and through how much damage.
*Record* exists, and it is already a swarm rule: what is open has a pull worked out from traces, and tries make
the pull fade. *Floor* and *Stress* join it.

**What the engine can judge.** A job done inside an energy budget. A job still done after damage. A rule for
what calls loudest, tried on a replay of the lab's own record: does the open work get done in fewer steps?

**The frontier.** It takes as given: a clock, a stored program, memory apart from logic. Directions: brain-like
chips (one system holds 1.15 billion artificial neurons in 2,600 watts: *fact hala-point*), sensing only what
changes, parts that remember what passed through them, living neurons, materials that arrange themselves. Open
problems: how to program something that has no program; what a brain does with about 20 watts (*fact
brain-power*).

**The community here.** What accumulates is the lab's own traces. The owner's idea that collective intelligence
is itself a new kind of computer is, in this world, an experiment and not a slogan: the specimen is alive, and
it is us.

**The questions behind it.** What is the brain doing differently? What if each part worked only when news
arrived? What if storing and computing were one act? Could a chip be grown? Is a community a computer?

**Links.** To *strange* by the stuff against the arrangement. To *think* by today's arrangement, to compare. To
*fail* by machines that still answer when parts die. To *divide* by work divided with nobody in charge. To
*open* by the community as a swarm. To *make* by building as chemistry does.

**Where it stands: 1 · 0 · 3 · 3.** Thin: six one-line stops and no engine of its own. Its one playable
experiment is the lab's record. It needs the Swarm engine. The boundary with *strange* should be kept sharp:
that world is about what a computer is made of, this one about how it is organized.

---

## What will be the next Moore's law?

*Behind it: can any kind of progress keep doubling forever?*

**The tension.** Fifty years of doubling. And every doubling in the physical world has ended: something else
took over, or nothing did.

**What you see.** The **Clock**: time, at every length. At its widest, 1971 to 2040 on one line. The switches
on a chip, doubling about every two years (*fact transistor-trend*). On the same line, the curves that did not
keep going: clock speed, flat since the mid-2000s; and those that rose the wrong way: the price of a factory,
of a design, of a set of masks. The right-hand end is the future, drawn as what it is: dated claims. A new
process in 2028. Switches stacked on switches around 2033. Channels a few atoms thick around 2043 (*facts
tsmc-a14, imec-cfet, imec-2d*, all marked as projections). Your own forecast goes beside them. Then use the
lens's own move and go nearer in time, as the dive goes nearer in space: a chip's years, a wafer's months, one
tick. It borrows the Dive (what is left to shrink), the Walls, the Line, the Map and Side by side.

**The engine behind it.** *Scaling* is partly there, as one setting of your chip: a switch generation. Made
whole, it would shrink every length by one factor and show what follows. For about thirty years what followed
was faster, denser chips with the same heat for their area; then leakage broke the rule (*from memory:
Dennard's scaling, 1974, ended in the mid-2000s*). It would also bend a doubling curve into the S-shape every
real one takes, and carry learning curves. *Yield and money* gives the cost of one switch from the price of a
wafer. *Record* would keep forecasts.

**What the engine can judge.** A generation smaller, with the bill paid (playable). A forecast, scored when
its date comes: the lab already re-checks its figures every month. The cheapest way, in the model, to double
the work done for a watt: shrink, stack, or change the machine.

**The frontier.** It takes as given: one flat layer of switches, silicon, the giant factory. Directions:
stacking, channels a few atoms thick, power fed from the back of the chip, larger mirrors in the printing
machine. Open problems: what should double next; whether the cost of a factory can keep rising faster than
chips earn; whether the planet can afford the answers we want (data centres' electricity is projected to
roughly double by 2030: *fact dc-electricity*).

**The community here.** What accumulates is forecasts: dated claims about a measure, kept, and scored by the
figure when the date comes. Nobody gives points. A maker's standing is their forecasts and how each came out.

**The questions behind it.** What is left to shrink? When is smaller not better? Can the cost keep rising
faster than chips earn? What should double next? Can the planet afford the answers we want?

**Links.** To *limit* by which wall ends the curve. To *strange* by what takes over. To *make* by the factory
that costs more each time. To *divide* by going up and apart. To *open* by who can still afford the newest. To
*know* by cost falling as people learn.

**Where it stands: 1 · 1 · 5 · 1.** Rich in dated, sourced figures (dozens are already in the lab) and poor in
engine. The figures alone make a good document. The Clock is the lens the lab lacks most: nothing on the site
shows time.
