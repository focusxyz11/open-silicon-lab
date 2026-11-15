# The structure of the lab: one loop, two moves, one card

A design review with a working prototype (branch `claude/fable-structure`), written by Claude Fable 5.2 on
15 November 2026. Nothing here is merged. The site as it was is kept on `claude/before-structure-2026-11`.
Screenshots are in `docs/reviews/structure/` (`before-*` is the site on `main`, `after-*` the prototype).

To play it: check out the branch, `npm start`, open `http://localhost:8000`.

## Status

**15 November 2026.** The prototype was merged to `main` to be tried live (PR #145). The owner's answers, and
what followed:

| Decision | The owner | What was done |
| --- | --- | --- |
| 1, 2. The loop starts at the Need | "Partly agree, because it's changing and technology development does not all start with need." | The first stage is now **Open** (below). The community stays there. |
| 3. No menu | "It depends." Not decided. | Still no menu by default. *Jump* was brought forward from stage 4, and a menu of sections can be switched on to compare (below). |
| 4. The first button | No answer | *Follow the chip* stays. |
| 5. Go on to stage 1 | Yes; the commons' stage 3 waits | Stage 1 is being built in small pull requests, listed at the end of this section. |

### The loop's start: *Open*, with two ways in

The owner is right, and I was wrong to call it Need. A loop that starts with "someone needs it" says demand always
comes first. Much of chip history ran the other way: the transistor, the integrated circuit and the
microprocessor were possibilities before most of their uses were known, and today's new ways to compute are
possibilities still looking for theirs. Both happen, and the second is the one the lab's own questions care about
most ("what is the strangest thing that could compute?").

What I considered:

- **Two first stages** (Need and Possibility), or a loop that forks. The bar would have to show a fork, and every
  other stage is one word. It also suggests a chip is one or the other, when most are both.
- **Idea, Spark, Why.** "Idea" is what the studio already does with a job. "Spark" is warm and says nothing.
  "Why" promises an answer.
- **Open.** What is still open: a piece someone needs and nobody has built, a possibility nobody has used, a
  question nobody has settled. It holds both directions without choosing. It is the word the ledger already uses
  for its frontier ("what is open now"), the word in the lab's name, and it is the one stage that is honestly
  never finished, so it carries no tick.

So the first stage is **Open**, and the Lab's card shows the **two ways in** side by side: *Someone needs it* (the
pieces of the shared computer nobody has built) and *It has become possible* (the new ways to compute people are
trying, which were already at the Lab, at the bottom of a list). The first card now reads: *It starts with
something open: a thing someone needs, or a thing that has just become possible.* The community stays at this
stage, as before: what is open is exactly what a commons holds. Where this review says "Need" below, read "Open".

One thing this does not solve: the second way in has little to do yet. A visitor can read the ten ways; they
cannot yet take one and carry it round the loop. That is content, not structure, and it is worth a challenge of
its own ("here is a new kind of switch: what is it for?").

### The menu: what it depends on

It depends on one thing: **can a visitor who wants a specific thing get to it in one or two moves without a
menu?** A menu is for people who already know what they want. The loop and the card are for people who do not
yet. A site needs both kinds of way in; the question is only whether the second kind has to be a row of sections.

What exists now for the visitor who knows what they want:

| They want | Moves |
| --- | --- |
| All the challenges | 1: *Your log* (they are listed there by step) |
| The questions they met | 1: *Your log* |
| The record of the build | 2: *Open* in the bar, *Go inside* |
| A place, a level or a challenge by name | 2: press `/` (or open *Your log*) and type; Enter goes to the first match |
| The page they saw yesterday | 0: every address now says where you are, so the browser's history and bookmarks work |

*Jump* is new here, brought forward from stage 4 because this question needed it. It never shows a list of
everything: only what matches what you typed.

**To compare, the menu can be switched on:** add `?menu=1` to the address and a ☰ appears in the bar with
Explore, Challenges, Questions, Build and Ecosystem; `?menu=0` removes it. It is remembered in that browser. So
the choice costs nothing to try and one line to make permanent either way (`SECTIONS_ON` in `src/v2/app.js`).

**What I would watch, with five people, to settle it:**

1. Ask a returning visitor to "find the list of challenges" and "find who built the register bit". If they need
   more than two moves or ask where the menu is, switch it on.
2. Whether anyone uses Jump unprompted. If nobody finds it, it needs to be visible (a field in the bar on wide
   screens), and until then the menu covers for it.
3. Whether first-time visitors with the menu on leave the world for the lists and never come back. If they do,
   the menu is doing harm and stays off.

My recommendation stays: no menu, Jump visible. But this is now a measurement, not an argument.

### Stage 1, pull request by pull request

| Pull request | What it did |
| --- | --- |
| #147 | The loop starts with what is open, with two ways in at the Lab; Jump; a menu that can be switched on to compare; the Lab's and the village's words. |
| #148 | The keys: ↑ ↓ are out and in, ← → are along, in every view. |
| #150 | `CLAUDE.md`, `docs/SYSTEM.md` and `docs/WORLD.md` rewritten for the grid; `docs/FRAME.md` folded in by reference (it keeps the data model and the history); the roadmap points here. |

**Not done from stage 1, and why:**

- *One card in code.* The island's card and the frame's look and behave the same, and are still two pieces of
  code. Joining them touches every view's card at once; it is a refactor with no visible gain, so it should ride
  with the next change that needs it (the Lab's inside as levels, below).
- *Along gets its picture.* Still a slide between two pictures. It needs both levels drawn at one camera (stage
  2's second item), so it belongs after that, not before.
- *The board's story into the flight.* Not started.

**The order after stage 1 changes: the commons goes before the pictures.** The owner left the timing of the
commons' stage 3 to me. Stage 2 (one picture per cell) makes the lab tidier; stage 3 (the commons in the grid)
makes it more itself, and the owner calls the commons the heart. Nothing in stage 3 needs stage 2. So the next
stage is the commons: the Lab's inside as levels (the computer → a piece → a design → an entry), entries as marks
on what they are about, questions as shared work, and the island drawing who is here. The unfinished work on
`claude/fable-commons-3` (one question, two tries, and a start on the island and on questions) is reworked into
that stage, onto addresses, not merged as it stands: it was saved untested and unreviewed, and its island and
page changes were written for the shell that had a menu.

## The two-minute summary

**What I found.** The pictures are not the problem. The site has three different ways of getting around, and each
answers "where am I, and where can I go?" differently:

1. the island, with a card that has three doors;
2. the views inside places, each wearing a frame with a breadcrumb, a rail, three modes in a corner and a switch
   called Turn;
3. pages, which are lists (Challenges, Questions, Build).

A visitor crosses between them all the time, and each crossing costs a little trust. Standing at one level of a
chip there were eight groups of controls on screen. On a phone they took the top 236 pixels, and with the card
below them the picture was left with about a quarter of the screen. The word "level" meant three things. A
challenge taken from a page threw you back to the island. The main thread, your chip's life, was a checklist in a
corner (1 to 5, and "Next: Half adder"): you could tick it, but you could not move along it. The commons was in
five places and on the thread in none. And an AI agent coming through the open port could not see the world at
all, only a list of jobs.

**What I decided.** The lab is one grid, and the whole interface is that grid and nothing else.

- **Across** runs a chip's life, the loop, now with six stages: **Need → Design → Make → Test → Ship → Use**, and
  what is learned in use comes back as the next need.
- **Down** runs scale: a place, then its levels, one inside the next, to the atom.
- There are **two moves**. *In and out* change scale. *Along* follows the chip's life, and it **keeps the level you
  are at**: from a gate in use, along to Make shows that gate being printed; along to Design shows the gates you
  designed. (This is what the Turn did. It is now simply moving along the loop.)
- **The bar is the loop.** There is no menu. The six stages sit in the bar on every screen: the one you are at is
  lit, and a tap moves you along. The rail at the side is the levels. So the two rails are the two moves.
- **One card** at the bottom, the same on the island and inside every place: Look, Do, Ask at its top, the words
  below. A challenge is played in that card, where its level is shown, with the picture behind it.
- **The commons is the Need.** It is not a section. It is the stage where the loop starts and where it comes
  back: the Lab. What the community left at a level (a design nobody has broken, a piece nobody has built, a
  question someone asked) shows at that level, under Do and Ask.
- **Your log** replaces the Challenges and Questions pages: the questions you met, what you did, what waits.
- **The first minute** has one sentence and one button, *Follow the chip*. It is not a guide: it opens the place
  where the loop starts, and every place's card offers the next place round the loop. You can leave at any tap.

**What you can play now.** All of the above, across the whole site, because a shell cannot be half changed. The
views themselves (the island, the flight, the dive, the line, the studio) are untouched inside.

**What I did not do.** I did not merge the pictures that show the same thing twice (the stack and the dive), move
the Lab's record off its page, or redraw the island. Those are in the plan at the end, and they wait for you.

**Where I disagree with you, with the brief, and with myself.**

1. *With you:* the main thread should not begin at Design. A chip begins because someone needs it, and in this
   lab that someone is the community. Starting at Design is what kept the commons off the thread.
2. *With you:* "the goal never leaves the screen" made the site a checklist. A game's world pulls you by what you
   can see in it, not by a to-do item in the corner. I took the "Next" button off the bar.
3. *With you:* the first button should not be a challenge. "Fix the half adder" in the first ten seconds tells a
   newcomer this is a quiz about something they do not know.
4. *With the brief:* I was asked for a prototype of limited scope. A structure is felt only when it is everywhere,
   so I changed the shell everywhere and kept the scope small in depth instead (nothing inside a view changed).
5. *With my own community review:* I wrote "kept on purpose: the menu, the three doors, the frame". That was
   wrong. The commons could not get its rightful place while the menu had a tab called Build.
6. *With my own art review:* I asked whether the stack and the dive should both remain and left it open. They
   should not stay as two views: the stack is what the lower levels look like *as made*. It belongs in the Make
   column of the grid (plan, stage 2).

## 1. What three first-time visitors met

I played the site on `main` three times, with Playwright, at 1280 px and 390 px, dark and light. One limit on
all of it: this machine draws 3D in software, so I can judge structure and flow, not smoothness.

### Mina, curious, new to chips (a phone, then a laptop)

- **Second 5** (`before-01`). An island, and around it: five menu words, five numbered circles, "Next: Half
  adder", a card with a title, two buttons and three hints, and 36 labels on the island itself, about 25 of them in view at
  once (7 question marks, 12 place names, 5 numbers, 6 house names, 6 plot signs). The only goal named is a half
  adder. She does not know what that is.
- **She taps the biggest building, the factory** (`before-02`). The card says "Step 2 · Make" and lists nine
  levels, numbered 1 to 9: Clean, Deposit, Print, Etch, Implant, Wires, Machine, Wafer, Chip. The first six follow
  each other in time. The last three are one inside the next. The numbers say they are the same kind of thing.
- **She goes inside.** The card now says "Step 3 of 11 · Clean". A moment ago Clean was level 1 of 9. The rail
  has eleven dots, because the line runs through four places of the island (the quarry, the factory, the test
  house, the port), and the island had cut it into pieces.
- **She opens Do** at one step and takes its challenge. The factory disappears: she is back on the island, with
  the challenge in a card over it. *This is where she got lost.* She had gone in, and something threw her out.
- **In the data centre** she presses → to go deeper. Nothing happens. (The other views answer that key.)
- **On the phone** (`before-03`). Four rows above the picture (the bar, the menu, the modes, the Turn), the card
  below. In the studio the drawings are a strip the height of a thumb. *This is where she got bored:* she was
  reading a card, not looking at a chip.
- She never touched the Turn. Nothing told her that "Designed · Made · Used" would show her the same gate three
  ways, which is the best idea on the site.

### Ravi, an engineer (a laptop)

- He skips the island and opens **Build**. It is a long page: a tree, open jobs, the record, who is here, who
  makes what, how to join. Good substance. It also stands apart: its links lead to the studio and to GitHub, never into the
  dive or the factory, so for him the lab is this page.
- He takes the first open thing, **Break it: the agent's counter** (`before-04`). The page vanishes, the address
  becomes `#/`, and the challenge is in a card over the village. He cannot send a colleague the address of what
  he is doing. A strip in the card reads "The job · Describe · Check · Gates · Layout · Masks": the studio's
  steps, inside a village challenge.
- He dives to the switch and wants to share it. The address still says `#/dive/gate`: **moving inside a view never
  changed the address.**
- He found real code quickly ("Write it yourself" under every design). *He was not stuck. He was in a different
  product from Mina,* and that is the two systems you described, seen from the other side.

### An AI agent, through the open port

I connected to `scripts/mcp.mjs` as an agent would and listed the tools.

- It can build well: read the plan, take a job, check, see the factory spoil a copy, propose.
- **It cannot see the world.** No tool says what places or levels exist, or which questions stop where.
  `propose_question` asks for "the level, for example check, gate or wafer" and "the question it sits under, for
  example fail.check", and there is no way to list either. So an agent can only ask a question if a person tells
  it the name of a place first.
- A wrong argument is answered with "A design written with AI must say how AI was used", when it was a question.
- *For the agent the lab is a job queue.* The people see a world with questions on its parts; the agents see a
  to-do list. If the commons is people and AI building together, they must stand in the same place.

### What the three have in common

Each met a different site, and none met the main thread as something to move along. The pieces of a continuous
path exist (the studio's masks lead to the line, the line ends at the port, the port leads to the data centre),
but they are hand-offs between views, not a thing a visitor sees.

## 2. First principles, and what I looked at

**Orientation is answered by the world, not by chrome.** In *Breath of the Wild*, Nintendo first linked its
towers by routes with events along them. Play-testers felt they were on a line, and tracking showed most players
following the route while the rest wandered lost. The team dropped it and instead made the places themselves easy
to see from far away, with terrain that hides and then reveals the next one; players then moved from landmark to
landmark by curiosity and still reached the key places
([Game Maker's Toolkit](https://gmtk.substack.com/p/how-nintendo-solved-zeldas-open-world), on the team's 2017
talk). Lesson for the lab: a path of numbered tasks is the design they abandoned. The thread has to be visible in
the world and pull, and the visitor has to be free to leave it.

**Nothing locked, and a log of what you met.** From memory, not re-checked today: in *Outer Wilds* nothing is
unlocked by an upgrade; what changes is what the player knows, and the ship's log records only what they have
met, joined by what led to what, with a mark where there is more to find. That is your rule (content never locked)
and your rule about the questions (never the whole list), and it is the model for the log here.

**A map has one camera and no pages.** On a map, zoom is the universal move, more detail appears as you come
closer, and what you add is a layer on the same picture. A map that grows tenfold does not get a longer menu. It
gets more to find when you zoom in. Your powers-of-ten dive already works this way.

**Moving between levels is the act of understanding.** From memory: Bret Victor's "ladder of abstraction" argues
that insight comes from moving up and down between the concrete and the abstract, under your own control. The
dive is that for scale. The Turn was that for the chip's life, and it was hidden in a corner.

**So: few verbs, used everywhere.** A game players stay with has a small set of moves that work on everything.
The site had tap, in and out, along, Turn, three modes, three doors, a menu and pages.

## 3. The structure

### The grid

Everything in the lab already has a place and a level (the atlas). What was missing is that places are in an
order, a chip's life, and that the same level appears at more than one stage of it. Put together:

| | Need | Design | Make | Test | Ship | Use |
| --- | --- | --- | --- | --- | --- | --- |
| **The place** | the Lab, the village | the studio | sand to crystal, the factory | the test house | the port | the data centre (and the phone and car islands) |
| **Its steps** | the plan → a piece | the job → describe → check | crystal → wafers → clean → deposit → print → etch → implant → wires | test | package → out | building → rack → board |
| **Chip** | a piece of the computer | the job | a die on its wafer | | in its package | the chip |
| **Block** | | layout | wires | | | the block |
| **Gate** | | gates | print | | | the gate |
| **Switch** | | | etch | | | the switch |
| **Atom** | | | crystal, implant | | | the atom |

An address is a cell. Every view the site has today shows a row or a column of this table: the island is the
top row; the dive is the Use column; the line is the steps of Make, Test and Ship; the bench is the Design
column; the stack is the lower half of the Make column. Nothing new had to be invented. It had to be said once,
in one place: `src/engines/way.js`, about 80 lines, with tests.

### Two moves

| Move | Means | How |
| --- | --- | --- |
| **In · out** | scale: into the part in view, or up to the level above | scroll, pinch, tap the part, the rail, ↑ (top left, on the island too: it leads to the world around it) |
| **Along** | the chip's life: another stage, keeping your level where that level exists there | the loop in the bar; on the island, *Next* in every place's card; inside the line, the next step |

Along *holds the depth*. The tests check it for every level: gate (use) → print (make) → gate (use); block →
layout → block; a whole chip → the die on its wafer → the chip; and on the line, walking from the wires to the
test house to the port, the stage lit in the bar moves from Make to Test to Ship by itself (`after-03`). Where a
level does not exist at a stage (nobody designs an atom), along lands at that stage's place on the island, and the
bar says so beforehand: a stage that will keep your level is underlined.

### What each word means now

- **A place** is a stage of the loop you can stand at on the island (two places may share a stage: the quarry
  and the factory are both Make).
- **A level** is a depth inside a place. Where the things inside a place follow each other in time they are
  called **steps** and drawn with arrows; where one is inside the next they are **levels**. The factory's card
  now says both, separately (`after-06`).
- **A view** is a way of drawing a row or column of the grid (the six kinds stay as drawing rules). A view is no
  longer a thing a visitor has to know about: there is no "open the stack" or "the flat dive".
- **The card** is the one place for words: Look (what this is, and the two moves from here), Do, Ask. The island's
  doors and the frame's modes were the same three things drawn twice; they are now one row at the top of one
  card.
- **A page** is a reading view opened on purpose. Two remain: your log, and the Lab's record.
- **The log** is yours: what you met, what you did, what waits. It is where a list may exist, because it is a
  list of *your* things.

### What merged, changed, or went

| Before | Now |
| --- | --- |
| Menu: Explore · Challenges · Questions · Build · Ecosystem | Gone. Explore is the world. Challenges and Questions are in the card of every place and in your log. Build is the Need, the first stage of the loop. Ecosystem is *out* from the island. |
| Tracker 1–5 and "Next" | The loop in the bar: where you are, and the way along. Ticks stay. |
| The Turn (Designed · Made · Used) | Along. The same three addresses, reached from the loop. |
| Look · Do · Ask in a corner; doors in the island's card | One row at the top of the one card. |
| Breadcrumb "Chip world › place › view" | ↑ and the place's name. The loop says the rest. |
| Challenges played on the island | Played in the card of the view that shows their level (11 of 12; the board's story keeps its own card for now). |
| Challenges page, Questions page | Your log (`#/log`; the old addresses lead there). |
| Build page | The Lab's inside: *Go inside* at the Lab opens it; ↑ and × lead back to the Lab. |
| Hero card: title, two buttons, three hints | One sentence and *Follow the chip*. |
| The address changed only on a jump | The address always says where you are. |
| "Your chip" stood at the next unfinished challenge | It stands at the stage you are looking at. Progress is the ticks. |

### The first minute

The island, the loop in the bar, your chip glowing on the road, one card: *One chip, round one loop. Someone needs
it. It is designed, made, tested, shipped and used, and what is learned there becomes the next need. People and AI
are building one here, in the open.* One button, *Follow the chip*, and beside it, *or tap any place*
(`after-01`).

Following is not a guide. It opens the Lab, where the loop starts (`after-02`). Every place's card has *Next:*
the next place round the loop, and *Go inside*. Six taps go all the way round. Any other tap leaves, and nothing
has to be dismissed, because there is no mode to be in.

### How it holds when the content grows tenfold

- **The chrome does not grow.** Six stages, one rail, one card. A new island is a new place at a stage (a phone
  is another place where chips are *used*); a new question or challenge is at an address and shows in the card
  there; a community entry is at an address too.
- **Nothing lists everything.** The card shows what is at this address. The picture caps what it names (five
  names, marks merged, as now). The log shows what you met. When content is ten times larger, the missing piece
  is a *jump* (type a name, go there); it belongs in the log (plan, stage 4), never in the bar.
- **Other languages.** The structure adds 38 short texts and removes 18. The loop's six words are the only ones
  that must stay short.
- **Agents.** The port has a new first tool, `look`: with nothing it returns the island and the loop; with a
  place or a level it returns what is there (its parts, its questions, what people asked, its challenges) and
  where each move leads. A test walks the whole world through it, starting from the island. So the structure is
  one graph, and people and agents walk the same one.

## 4. How the commons fits

The commons was a tab (Build), two places (the Lab, the village), a kind of challenge, and a list on another
page. Its rightful place is not a bigger tab. It is the **reason the loop turns**.

- **It is the first and last stage.** *Need*: what the shared computer still lacks. A visitor who follows the
  chip starts at the Lab, sees a computer being built in the open, and goes on to the studio, where the first
  step ("The job") has always been "pick a piece of the community's computer". That link existed in the data and
  was invisible in the structure. After Use, the loop comes back to the Lab: what failed, what was learned, what
  someone asked becomes a need, a break or a question, which is an entry in the ledger.
- **It is on the thing.** At the level where designs are checked, Do now also shows the designs of the ledger
  that nobody has broken. At the level where the job is chosen, it shows the pieces nobody has built. Under Ask,
  at any level, what people and agents asked there. A fourth face ("Built here") would be empty at all but two
  levels today, so the traces go where a visitor already looks.
- **It has a record, in one place:** the Lab's inside (today's Build page, unchanged in content).
- **Agents stand in the same world** (`look`).
- **Stage 3 of the commons** (`claude/fable-commons-3`) is not merged and nothing here is built on it. When you
  take it up again, what it adds should attach to addresses (a level, a question, a piece), and the Lab's inside
  should become levels like any other place (the computer → a piece → a design → an entry) instead of a page.
  That is stage 3 of the plan below.

One honest gap: on the island the Lab stands just outside the ring road, on a spur. The picture should say what
the structure says: the road should pass through the Lab's square. I did not redraw the island.

## 5. Every override of an earlier rule

1. **The menu (CLAUDE.md, WORLD.md: "The menu is Explore · Challenges · Questions · Build · Ecosystem").**
   Removed. A menu names sections, and sections are what made two systems. Each item was already somewhere in the
   world; the menu was a second way to reach it that skipped the world.
2. **One HUD: "the tracker … the goal never leaves the screen" (SYSTEM.md §3).** The bar still never hides and
   still shows the five steps with their ticks. It no longer shows "Next: …". A goal that never leaves the screen
   says the site is about finishing, and you have said it is about questions.
3. **"Your chip's life (Design → Make → Test → Ship → Use)" (CLAUDE.md).** Six stages: Need comes first. Argued
   above; this one is yours to accept or refuse (decision 1).
4. **The Turn as a control (SYSTEM.md §5).** The idea stays and is the heart of *along*; the three-button switch
   is gone. A visitor already has to learn the loop; they should not have to learn a second word for moving on
   it.
5. **Look · Do · Ask "switch what the frame holds" from the corner (SYSTEM.md §3).** They are faces of the card,
   at its top, on the island and inside. Same three, one place.
6. **"Every dock keeps one order: back on the left, next on the right."** Kept inside views. On the island's card
   the two buttons are the two moves: *Next* (along) and *Go inside* (in).
7. **The first minute: "one sentence and one glowing button" that starts the first challenge (SYSTEM.md).** One
   sentence and one glowing button that follows the chip. The first challenge is two taps later, at the studio,
   under Do, where it lives.
8. **Challenges and Questions as pages (WORLD.md); my own override 5 in the community review** (the Questions
   page shows the ones you met). Both are sections of your log now. The rule I wrote there holds: never the
   whole list of questions.
9. **"A challenge … played in the sheet" on the island (app.js).** Played in the card of its level's view.
   Content is never locked behind it: Look is one tap away and leads back to the story.
10. **Routes.** `#/do/<id>` now opens the level's view; `#/log` is new; `#/challenges` and `#/questions` lead
    to it. Moving inside a view rewrites the address (without adding a step to the browser's history).
11. **"Your chip's pin pulses so you always see where you are."** It now does mean where you are. Before, it meant
    where your next unfinished challenge was.
12. **The open port (MCP.md): a new tool, `look`, listed first**, and the instructions tell an agent to look
    around before reading the plan.
13. **My community review, "kept on purpose: the menu, the three doors, the frame"**, and **my art review's open
    question on the stack.** Both answered above.
14. **Documents.** `CLAUDE.md`, `docs/SYSTEM.md` and `docs/WORLD.md` still describe `main`. I added one line at
    the top of each pointing here, and did not rewrite them: they should change when you have decided, not
    before.

What I did **not** override, though I was free to: the six kinds of view as drawing rules; the atlas; the rail;
steps instead of scrolling; the island as the first page; the questions' rules; the ledger.

## 6. What I rejected

- **A guided first visit** (steps, arrows, "tap here"). You disliked it, and Nintendo's play-tests say why.
- **The dive as the first page.** It is the site's best single move and your own idea, and I considered it
  seriously. But a zoom shows one column of the grid. It cannot show the loop, and the commons has no place in a
  zoom. The island shows the row that the dive cannot.
- **A map of questions as the home.** You already found that questions as dots break the connection. The log
  keeps the ones you met, as strands.
- **Three top-level modes (Learn · Play · Build).** A menu with other words.
- **A "Community" section, or a fourth face on every card.** Explained above.
- **Questions and challenges as marks only, with no Look · Do · Ask at all.** Closer to a game, and I tried it on
  paper. Seven marks on one part hide the part (my art review), so a way to choose what is shown is needed
  anyway, and three words with counts are the smallest honest one.
- **A new shell beside the old one** (a separate address for the prototype). It would have been a third system
  in a project whose problem is two.
- **Merging the stack into the dive now.** Right, and too large for a prototype (plan, stage 2).
- **A search box in the bar.** Needed later; in the log, not the bar.
- **Numbers on the stages (0 to 5, or 1 to 6).** Numbers invite finishing. The island keeps its 1 to 5 on the
  road for now; I would take them off when the island is redrawn.

## 7. Risks

- **"Need" may read as abstract** to a beginner, and the Lab's first sentence talks about boats and an open
  port. The structure is right only if the first card after *Follow the chip* says, in one plain sentence, what
  the computer still needs and offers one piece small enough to do. Those words are not written yet.
- **Along is still quiet.** Holding your level is the best move on the site, and today it is an underline, a
  short note and a cut between two pictures. It needs the picture itself to turn. Until then some visitors will
  not notice that the gate they see being printed is the gate they were just looking at.
- **Along from a level with no twin lands on the island.** From a rack, Make takes you out to the factory's card.
  It is honest, and it may feel like being thrown out, which is the very thing I removed elsewhere.
- **Losing "Next" from the bar** removes a pull some players like. If people stall, the fix is a pull in the
  world (the next thing glowing where it is), not the corner again.
- **The address follows you, but the Back button does not step through levels.** Chosen on purpose (a scroll
  should not fill the history); some will expect otherwise.
- **Two pages remain** (the log, the Lab's record). The record should become levels (stage 3).
- **Keys.** Inside the dive, ← and → still go deeper and higher, as before. In the grid's logic they should go
  along, and ↑ ↓ in and out. Not changed here, because every view's keys should change together.
- **The island's picture and the structure disagree** in two places: the Lab is off the ring, and the road has
  five numbers for six stages.
- **Nothing was tried with people,** and nothing on a real phone or a real graphics card. Everything was checked
  on a software renderer, where the first seconds after loading are slow enough that I cannot tell whether the
  views warming up in the background would be felt on a slow phone.
- **The prototype's breadth.** I changed the shell everywhere. `npm test` (110) and the browser test pass, but
  the browser test covers flows, not every card at every width. On this machine the browser test took about
  17 minutes, not six, so it did not finish inside a 595-second limit; I ran it to the end with a longer one. I
  did not measure `main` here, so I cannot say how much of that is the machine and how much is mine.

## 8. Decisions that are yours

1. **Does the loop start at the Need?** This is not an interface question. It says the lab's main thread begins
   and ends with the community, and that "your chip" is a piece of something shared. Everything else in this
   review follows from it. If you say no, the bar keeps five stages and the commons needs another home.
2. **The word.** "Need" is plain and true. "Idea" is warmer and wrong (the studio's first step is already "The
   job"). Yours to name.
3. **No menu.** Build, Challenges and Questions stop being words on every screen. You gain one system. You lose
   three familiar doors. I recommend it; you have to live with it.
4. **The first button.** *Follow the chip*, or the first challenge as before.
5. **Go on to stage 1?** And if so, whether the commons' stage 3 waits for it (I recommend that it does: it is
   much easier to place on a grid than on a menu).

## 9. After the prototype: a staged plan

Small pull requests, each leaving the site whole.

**Stage 0. Try it with five people** before building more (the roadmap's item 9, never done). Watch for three
things: do they find *along* without being told, do they understand Need, do they miss the menu.

**Stage 1. Make it true everywhere.**
- Rewrite `CLAUDE.md`, `docs/SYSTEM.md` and `docs/WORLD.md` for the grid; retire `docs/FRAME.md`'s "two ways of
  seeing" into it.
- The island's card and the frame's card become one piece of code (they look the same now; they are still two).
- Keys: ↑ ↓ in and out, ← → along, in every view.
- Along gets its picture: the level turns from used to made to designed, driven by the move.
- The board's story moves into the flight's board level, so `#/board` stops being a separate view and its
  challenge is played in place.
- The Lab's and the village's words, written for a first-time visitor.

**Stage 2. One picture per cell.**
- The stack becomes the lower levels of the Make column: the dive from the factory's machine (scanner → wafer →
  die) continues into the stack's rows (block as wired, gate as printed, switch as etched, atom as implanted),
  and `#/chip` stops being a view of its own. The line's lens opens it.
- The studio's layout and gates are shown as the block and the gate *as designed*, at the same camera as the
  dive's, so along between them is a turn and not a change of picture.

**Stage 3. The commons in the grid.**
- The Lab's inside as levels: the computer → a piece → a design → an entry, in the frame, with the record as its
  story. The Build page goes.
- Entries as marks on the parts they are about, with the cap the questions have.
- `claude/fable-commons-3` rebased onto addresses.
- The island redrawn so the ring road passes through the Lab's square, with six stops and no numbers.

**Stage 4. Growth.**
- *Jump* in the log: type a name, go to its address.
- *Out* from the island as a real level: the archipelago, then the world (the supply map), with the phone and
  car islands as places where chips are used. The ecosystem card goes.
- A second language, to prove the structure's words are few.
- `look` on a hosted port.

## 10. Found along the way

Fixed in the prototype:

- **→ did nothing in the data centre's flight.** Its buttons lacked the mark the keys look for.
- **The address did not follow you.** Diving from the gate to the switch left `#/dive/gate` in the bar, so a
  shared link or a reload led somewhere else, and the Turn's logic had to keep its own idea of where you were.
- **A challenge taken from the Challenges or Build page reset the address to `#/`.**
- **The Lab's card offered the same thing twice** ("Go inside" and "The plan" both opened the plan).
- **The factory's levels were numbered 1 to 9** across two different kinds of thing.
- **The port told an agent asking a question that "a design written with AI must say how AI was used".**

Not fixed:

- **The port could not be explored** before `look`; `propose_question` still does not tell an agent which names
  are valid when it gets one wrong (it should point to `look`).
- **On the factory's line, a part's name ("front robot") is drawn into the canvas in mono type,** over the 3D
  machines, not as HTML over a projected point like every other name. It reads as a different interface, and it
  will not translate or wrap like the rest.
- **The island's first screen carries 36 labels.** The seven question marks above places compete with the
  places' names. I would show a place's mark only when you are near it.
- **The first seconds after loading are heavy:** three views are built and their shaders compiled while the
  island is shown. On this software renderer a tap in that time took 7 to 16 seconds to answer. Worth measuring
  on a slow phone before anything else is warmed ahead.
- **`docs/ROADMAP.md` and `docs/FRAME.md` still describe the site before the chip world** in several places
  ("Now: the dive", the top bar's Journey). They mislead a new contributor, human or AI.
