# Rebuilding the lab on the skeleton

What the site already has that fits, what has to be rebuilt (the design studio first), what should go, and the
plan in stages. Every replaced version is kept on a named branch first, as always.

**Status (15 November 2026).** Stage 1 is built, and the start of stage 2 with it, because the owner asked for
the questions and a document first. Every stop of the weave, every challenge and every try is part of exactly one
experiment (`src/data/experiments/`, one file per world; worked out in `src/engines/experiments.js`; checked by
`tests/experiments.test.mjs`). Gathering the stops gave 135 experiments, not the 87 counted above: 26 live, 22 ready,
67 only words, 20 wanted. Every experiment reads as a page at `#/read/<id>` (`src/v2/read.js`), and the first page
offers questions you can try now and the next challenges, over the island. Not yet: `look` in the open port, the
skeleton's list replaced by the real one, the measures and claims of the engines.

## 1. What fits, and stays

More fits than not. The lab's parts are good; it is their arrangement that changes.

| It stays | Why it fits |
| --- | --- |
| The engines (`src/engines/`), pure and tested | They are the truth layer. The framework asks two small things more of each: the measures it gives, and its claims (`shared.md`, section 2) |
| The ledger and all its rules (`src/engines/ledger.js`, `docs/reviews/community.md`) | It is the record. Its kinds of entry grow; its rules do not change |
| The open port (`src/engines/api.js`, `scripts/mcp.mjs`) and `look` | Agents and people walk the same graph. `look` will return experiments |
| One home for every thing (the atlas) | The rule was right. The home is now an experiment; where on the chip it is about becomes one of its sides |
| Figures with source, date and kind, re-checked monthly (`src/data/facts.json`); the real cases | They are what "true" rests on when no engine can say. Each figure becomes a reading of a measure |
| Words in `src/i18n/en.json`, never in code | Unchanged. Later the file splits by world |
| The dive and its joined levels in 3D; the factory line; the island; the supply map | Four lenses already drawn well: Dive, Line, Map twice |
| One renderer, no cuts between views, feedback for wrong and right, reduced motion | Craft that every lens inherits |
| Tap a gate to fix a design; typing for whoever wants it | The right way to change a description. It moves into Forms |
| "Your chip": one chip that every try changes and every depth shows | It was the specimen all along |
| The four things under a stop: a question, something true to notice, what people try, its real cases | Already most of an experiment. They lacked an engine and a thing to change |
| A core question appearing alone, after it is earned (`rootShown`) | Kept, a little stricter (`growth.md`, section 1) |
| *Your log*, Jump, *Break it*, an address that always says where you are | Kept as they are |
| The two moves and their keys (in and out; along) | Kept, as the moves of two lenses, with *turn* and *follow* beside them |

## 2. What is rebuilt

### The design studio, first

**What is there.** I looked at the studio on the live site at 1280 pixels. Six small drawings stand in a strip
across the top third of the screen. None has a name on it. A card covers the rest: "Step 5 of 6 · Layout", a
paragraph, one question in a box, a note about your design, and a button, *Next step*. The description you can
change is behind a tab called *Do*; the questions are behind a tab called *Ask*. This is the earlier site's
line of six stations, wearing the new frame. It is linear because it was built as a walk, and the picture and
the words do not meet because the picture is an illustration of a station and the words are about a step.

**What is good in it.** The engine: it reads a description, checks it, chooses gates, places and wires them,
and grades the tests. Tapping a gate to turn it into another. The AI proposals, some subtly wrong. Your design
riding on into the factory through the masks. All of that stays.

**What it becomes: Forms.** One design, shown in all six of its forms at once: the job, the description, what
it does, its gates, its layout, its masks.

- **Tied.** A thing has one name in every form. Touch a signal, a gate or a wire in any of them and it lights
  in all: its word in the description, its column in the table, its gate, its cell, its wire on the masks. The
  engine works out which gates came from which line.
- **Alive.** Change the description and all six follow at once. There is no station to walk to.
- **Honest about who did what.** Under each form's name, one line says who made that step and what they added
  that you never said: "chosen by a program: 5 gates, 42 switches", "placed by a program: it tried 700 moves".
  That line is where this world's question lives: an idea becomes real through decisions nobody stated.
- **The questions sit between the forms**, where meaning can slip, and each is an experiment:

| Between | The experiment | What the engine lets you notice |
| --- | --- | --- |
| the description and what it does | Change one character. Which form notices? | Every form follows you; only the one set against the job can say you are wrong |
| the description and its gates | Two descriptions give the same answers. Are they the same chip? | Same table; 5 gates and 530 picoseconds against 7 gates and 490: the smaller is the slower |
| its gates and its layout | Nobody chose where these cells go. Who is the designer? | Placed again, the same gates need a different length of wire |
| the job and the description | An AI wrote this and says it is right. Who checks it, and with what? | The check compares answers. It does not care who wrote it or how sure they sound |
| its masks and what it does | A speck leaves one wire stuck. Would your tests notice? | With three patterns of eight, the tests catch 12 of the 16 ways a wire can stick |
| its layout and its masks | The same design goes to another factory. What has to be done again? | Not a character changes, and everything below the description is made again: 26 masks become 80 |

**[forms.html](forms.html) is this, working**, on the lab's real engine, in dark and light and at phone width.
Open it and touch things. Every number in the sentences under the question is read from the engine at that
moment, so the words cannot disagree with the picture.

What the sketch proves: the tie can be worked out from the engine as it stands; six forms fit on a screen and
stack on a phone; an experiment's question, its control, what is true and what is open fit in four lines above
the picture; five other questions fit as ways on, without a menu.

What it does not prove: it is not on the site. It has no 3D and does not join the shared stage. It does not
carry your design on to the factory or the dive. Its words are in the file and not in `en.json`. It holds a
copy of the engine so that it opens from disk. It covers four small jobs, none with a clock. Nobody but me has
tried it.

**What goes from the studio:** the count of steps, *Next step*, the strip of small drawings, and the three
tabs. Old addresses (`#/bench/<level>`) lead to Forms with that form in view.

### One frame, with no tabs

The card with three faces (Look, Do, Ask) becomes one thing, because an experiment is one thing.

- **The picture fills the screen**: the engine's state through a lens.
- **The question is on the picture**, one line, in the colour of its world.
- **What you may change is on the thing it changes**: a gate in the description, a dial on the machine. Where
  that cannot be done well, a small row of controls under the question.
- **What is true appears where it happened**, when your change makes it visible. It is also always there to
  read; nothing is locked.
- **What is open** is one line under it, opening to the directions and to what people and AI did here.
- **The four ways on** keep their places on every screen: deeper and higher at the side, turn at the top (only
  the lenses this thing has), follow below (the two nearest), and try is the picture itself.
- **One key turns the experiment into its document**, the same fields in reading order.
- **Budgets.** The question: one sentence. What is true: two sentences each. What is open: three. Longer
  reading is the document.

The bar then holds the lab's mark, where you are (the lens and the level), *Your log* and the theme. The loop
leaves the bar. It stays on the island as the ring road, and it is the Line lens at its widest.

### Stops become experiments

About 110 stops hold a question, a note and sometimes a list. Each becomes an experiment in one of three
states: *live* where a try or a challenge already sits on it (about twenty), *ready* where an engine could
judge it and nothing asks it to, *words* where nothing can yet. The words-only ones say so. Several stops that
ask the same thing at different depths ("where does the heat go?", three times) become one experiment seen at
several levels.

### Engines given homes of their own

`src/engines/chip.js` models "your chip" and has grown a little of four engines: timing and power, the memory
wall (Work), specks and cost (Yield and money), and the switch generation (Scaling). Each gets a file, tests,
its measures and its claims, and `chip.js` becomes the specimen that all four read. The Floor engine gets
counting. Four engines are written new, in the order their worlds are rebuilt: Process, Substrate, Swarm, Tune.

### The frontier becomes data

"What people are trying" is today a list of phrases under 35 stops, plus ten ways to compute with a stage and
a catch. They become givens and directions (`shared.md`, section 5): one home each, a stage with a source, and
links worked out from the givens they drop.

## 3. What should go

| It goes | Why |
| --- | --- |
| Look · Do · Ask | Three tabs are three systems behind one border |
| The loop as the bar and as "the main thread"; *Follow the chip* as the one first call; a tick for each stage | A chip's life is one lens. As the frame of everything, it made the lab a tour of the chip |
| The studio's six stations as steps | Above |
| A question's fixed trail (`DEPTH_ORDER`, *back* and *next stop*) | A numbered walk through a question is a line through it. *Follow* offers the nearest two instead |
| Parts' captions as content (`what.*`, 146 texts) | A caption names what you touch. It stays as a label's note. It is not what the lab has to say |
| Debates, ways, tries, stories and challenges as separate kinds of data, each with its own place on the card | They are experiments, directions and runs |
| A glowing question mark above each place on the island (`BEACON`) | A question shown as a dot on a map was rejected once already, and rightly. On the Map, what calls is what is open |
| The place as the owner of content (`INSIDE`, a challenge's `place`) | A place is where an experiment is about. It does not own it |
| Six kinds of view as the rule for drawing | Eleven lenses, named by what they lay out |
| The Lab as the first stage of the loop | The community has no stage. The Lab is where the record is read whole |
| `src/data/waiting-words.json` | Each waiting text is read, then becomes part of an experiment in stage 2, or is deleted |

Nothing is deleted before its stage, and each stage keeps the site as it was on a named branch.

## 4. The plan

Six stages. Each is a handful of small pull requests with CI passing. Stages 1 and 2 change no pictures.

**Stage 1. Experiments as data.**
The atom in code: one file per experiment under `src/data/experiments/`, with its seven sides (`growth.md`,
section 8); an index made by a script; engines name their measures and carry their claims. Convert what exists:
the 12 challenges, the 12 tries, the stops, the debates, the cases, the open jobs of the ledger. The open
port's `look` returns experiments and their ways on. `skeleton.json`'s list of experiments is then replaced by
the real index, and this folder's test checks the documents against it.
*Done when* every stop and challenge of today is reachable as an experiment, `npm test` checks every side of
each, and the site looks exactly as it did.

**Stage 2. Every world as a document.**
A reading view (`#/read/<experiment>` and one for each world) made from the same data: the question, the setup,
the engine's own numbers as a plain table worked out as you read, what is true with its source, what is open,
the real cases, the ways on as links. This is where the content is written: world by world, the words-only
experiments get what is true and what is open, with sources. The owner has said the content of the questions
comes first and that a document is enough; this stage is that, built so nothing has to be written twice later.
*Done when* each world can be read from end to end with no picture, and the owner's test is passed for each or
its gaps are named on the page.

**Stage 3. The studio as Forms.**
From the sketch to the site: in the frame, on the shared stage where it needs one, words in `en.json`, the six
experiments live, your design still riding on to the factory. It can start as soon as stage 1's shape is
settled; it does not wait for stage 2. The site before it: `claude/before-forms-2026-11`.
*Done when* no screen says "step" or "next step", every sentence that states a number reads it from the
engine, and it works at 390 pixels in dark and light.

**Stage 4. One frame.**
The experiment's frame replaces the card with three faces, everywhere. *Turn* returns as a move. The bar loses
the loop. The site before it: `claude/before-one-frame-2026-11`.
*Done when* every live experiment is played in the same frame in whatever lens it has, and an agent's `look`
at any address returns the same four ways on a visitor sees.

**Stage 5. The worlds, one at a time, strongest first.**
First the engines get their homes (section 2). Then each world gets its home lens drawn well, at least five
live experiments, and its kind of entry on the record. In this order, by how much is already there:

| Order | World | The lens to draw | The engine work |
| --- | --- | --- | --- |
| 1 | Why can a perfect design fail? | Copies | none new: Stress, Logic and Yield exist |
| 2 | How should a chip divide its work? | Plan, with flows | Work made whole: Amdahl, a special district, links |
| 3 | What would chipmaking look like from scratch? | Line (exists), with the slice at every step | Process, new |
| 4 | What will be the next Moore's law? | Clock | Scaling made whole; forecasts on the record |
| 5 | How does a chip think? | Dive (exists), with one sum followed down | a tiny network on the core |
| 6 | What happens when anyone can make a chip? | Map (exists), three times | Yield and money made whole |
| 7 | What could a chip never do? | Walls | counting in Floor; sourced cases of walls that fell |
| 8 | What is the strangest thing that could compute? | Side by side | Substrate, new |
| 9 | What new kinds of computers could life inspire? | Swarm | Swarm, new |
| 10 | What can't be written down? | Probe | Tune, new; and people who have made chips |

*A world is done when* its home lens is drawn well or it is honestly a document; it has five live experiments;
its document reads well with the pictures off; and a person, an agent and a program each have something to do
in it.

**Stage 6. Growth.**
The record's new kinds (an experiment, a case, a forecast, a direction, a specimen, an engine), each with its
check. The pull worked out over the whole skeleton. One folder and one file of words for each world, loaded
when opened. Snapshots of the record. A hosted port. The first screen decided by trying it (README, decision 1).

**What I would not do.** Draw any new lens before stage 2 has shown that its world is worth reading. Start
phone and car islands. Add a twelfth question by hand. Write the Tune engine before someone who has worked in
a factory has read its design.

## 5. Risks, said plainly

- **A fresh abstraction can be one more layer of polish.** "Experiment" could become a new name for a card. The
  guard is the contract: something to change, something true that an engine checks, something open. A thing
  that cannot meet it is not let in, however good it looks. If stage 1 finds that most of today's content cannot
  meet it, that is the finding, and it is the owner's feeling put in numbers.
- **Stage 2 may be dull to build and is the one that matters.** It has no new pictures. It is where "is there
  enough here?" is answered. Skipping to stage 3 because the sketch is exciting would repeat the last month.
- **Four engines are not written.** Each is small (a few hundred lines, in the style of the others). None is
  hard. But a model that is wrong in direction is worse than none, so each needs tests against known cases and,
  for Process and Tune, a reader who knows the factory.
- **I am one model, and I designed and judged this.** The sketch has been tried by nobody else. *Break it* is
  the lab's own answer to that, and it applies to this folder.

## 6. Where these pages are published

The site's deploy copied only `index.html`, `src` and `assets`. One line in `.github/workflows/ci.yml` now
copies this folder too, to `/framework/`, so the map and the sketch can be opened at the site's address
(README, top). No page of the site links to them. That line went in as a pull request of its own, after this
folder, because it is the one thing here that touches what the site publishes.
