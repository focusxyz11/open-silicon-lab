# How the lab stays open

Three promises the skeleton has to keep: a visitor can enter anywhere and always has a way sideways; anything
new (a question, an engine, a direction) can arrive from the community; and it still holds when there is a
hundred times as much in it.

## 1. No path

**Every experiment is a front door.** Each has an address, and it stands by itself: its question, its setup,
what is true, what is open. Nothing has to be done first. Content is never locked behind a challenge: the
target of an experiment is something you may aim at, and everything it shows is there whether you hit it or
not.

**Four ways on, worked out and never written.** From any experiment (README, section 5):

| Move | Where it leads | How the lab finds it |
| --- | --- | --- |
| Deeper · higher | along the lens: nearer or farther, the step before or after | the lens's own order |
| Turn | the same thing through another lens | other experiments about the same specimen at the same level |
| Follow | the same question, another experiment | the nearest two in the same strand, then the nearest strand |
| Try | the same experiment, changed | its own settings, and the givens an engine can drop |

Because the ways on are worked out from what experiments share, adding one experiment adds ways on to many
others, and nobody maintains a table of links. A *Follow* never offers "next" and "back" along a numbered
trail. Today a question's stops are walked in one fixed order (`DEPTH_ORDER` in `src/v2/game.js`), which is a
line through a question. That goes.

**A question appears alone, when it is earned.** The rule in `src/engines/weave.js` stays, a little stricter:
a core question shows itself once a visitor has done two experiments from two different strands of its world.
One strand twice is following a topic. Two strands is seeing what they have in common, and that is the
question. The question behind it shows later the same way: after experiments in two worlds that it joins.

**Nothing lists everything.** Not the questions, not the lenses, not the experiments. A view shows what is at
this address. A turn offers only the lenses this thing has. *Your log* lists what *you* met. Jump finds a thing
by name. The one whole picture is the map of the skeleton in this folder, and it is for builders.

**Agents walk the same graph.** The open port's `look` already returns a place and its moves. It will return
an experiment and its four ways on, from the same function the site uses.

## 2. Holes are part of the picture

A closed site hides what it lacks. This one shows it, because a hole is where someone can come in.

| State | What a visitor sees | What it invites |
| --- | --- | --- |
| **Live** | the experiment, playable, judged | run it, break it, beat it |
| **Ready** | the question, the engine's numbers as a plain table, "no picture yet" | build the experiment: the engine is waiting |
| **Words** | the question and what is true, with its source, and "nothing judges this yet" | bring an engine, a case or a figure |
| **Wanted** | a named gap: what is missing and what it would have to do | bring the engine, the sources, or the people |

The same four states are on the map in this folder ([map.html](map.html)), world by world. They are the lab's
honest answer to "is there enough here?", and they are computed, so they cannot flatter.

This is how proofs are now built by many hands: a graph of steps, each coloured by its state, where anyone can
take one open step without holding the whole, and a checker says whether it stands (README, sources). The
lab's checker is `npm test` and the engines.

**What is open has a pull.** The record already works out which open thing calls loudest (`frontier` in
`src/engines/ledger.js`): a piece many others depend on, a design nobody has attacked. The same rule extends to
the skeleton: a *wanted* engine that five experiments wait for calls louder than one that one waits for; a
world with nothing live calls louder than a world with seven. So attention goes where the lab is thinnest,
without anyone assigning it.

## 3. How anything new enters

One rule for all of them: **bring it with what checks it.** An entry is one file in a pull request; `npm test`
is the gate; nobody votes.

| You bring | It must come with | What checks it | Where it shows |
| --- | --- | --- | --- |
| **A run** (a design, a setting that meets a target) | who made it, how AI was used | the experiment's engine | on that experiment; in the standings |
| **A break** | the case | the same engine that passed the thing must fail it | on the experiment; the case joins its check for good |
| **A try** | the cases that failed to break it | the engine | quiets the call on that thing |
| **A question** | the experiment it was asked at | it has a home | under that experiment; work can gather under it |
| **A real case** | a source and a date | the source resolves; it names an experiment | on the experiment, as a run the world did |
| **A figure** | source, date checked, kind (reported, claim, estimate, projection) | the monthly check | as a reading of a measure, wherever that measure is shown |
| **A forecast** | a measure, a date, a number | scored by a figure when the date comes | on the Clock, beside the others |
| **An experiment** | an ask, a setup on an engine, a lens, one to three things to notice | each thing to notice passes as a claim of the engine, or has a figure; the target, if any, can be reached and is not met at the start | at its address, with ways on to everything it shares with |
| **A direction** | the given it drops, what it gains, what it pays, a stage with a source | it names a given and a measure that exist | wherever that given is stood on |
| **A specimen** | its numbers, with sources, in the form an engine reads | the engine runs it | wherever that engine is used |
| **An engine** | tests, what it leaves out, the measures it gives, at least one claim and one experiment | its tests; its claims hold | it turns *wanted* experiments into *ready* ones |
| **A lens** | the thing it lays out that no lens lays out; one experiment drawn in it, well | review by eye, in dark and light, at phone width | wherever an experiment names it |
| **A given** | two directions that drop it | they exist | on every experiment that stands on it |

Two of these are new kinds of contribution that the lab has always wanted and never had a slot for: **an
engine** ("a new kind of check is a new engine, never a separate tool") and **an experiment**.

## 4. How a new question enters

Questions enter at the bottom and rise only with work under them.

1. **Anyone asks**, at an experiment. This exists (the ledger's `question`): the question has a home, and work
   can be done *for* it.
2. **It becomes a strand** of a world when three experiments, by at least two different makers, hang under it.
   That is counted from the record. A strand is a line in a world's data and shows as a way to *follow*.
3. **It becomes a core question**, the twelfth, when it has all of this:
   - a tension that none of the eleven holds (written as two things that are both true);
   - a home lens, one of the eleven or a new one;
   - at least one engine that judges it;
   - eight experiments, three of them live;
   - links to at least three other worlds.

   The first four are counted by a test. The step itself is a pull request to the skeleton with the counts in
   it. A core question can also be split or merged by the same test.

So eleven is today's count and not a rule. Three strands look to me like they are growing toward it:

| Strand today | In the world | The question it might become |
| --- | --- | --- |
| Can we build what we cannot understand? | limit | How do you trust a chip that nobody fully understands? |
| Can the planet afford the answers we want? | scale | What does a chip cost the world, and who pays? |
| What does it mean to depend on one maker? | open | Who depends on whom? |

I did not promote any of them. Each has one or two experiments, mostly words. If they are real, the record
will show it.

**The question behind the question** enters the other way, from above: when two worlds turn out to share a
strand, what they share is a candidate for a question behind both. *Divide* and *open* already do: "how should
any system divide work" is the industry's question as much as the chip's.

## 5. People and AI

The framework treats them the same and expects them to differ.

- **The same:** one port, one record, one gate. An agent calls the engines a visitor's browser calls. An
  agent's entry is checked like a person's. The lab runs no AI of its own.
- **Different:** what each is good at (see [shared.md](shared.md), section 6). A healthy world gives each kind
  something to do. The record shows who checked whom, and a world where only one kind has acted is marked thin.
- **Entries are data.** Whatever an entry says, it is never an instruction to an agent or to the lab.

The part of this I consider unsolved: agents can produce experiments, directions and figures much faster than
people can read them. The gate checks that a thing is well formed and true by its engine. It does not check
that it is worth anyone's time. The pull helps (thin places call loudest), and so does the rule that an
experiment must have something true to notice that its engine checks. I expect a further rule will be needed
once it happens, and I would rather see the problem first than guess its cure.

## 6. A hundred times the size

| | Today | At a hundred times | What keeps it usable |
| --- | --- | --- | --- |
| Core questions | 11 | perhaps 15 | they are never listed |
| Strands | about 55 | a few hundred | shown only as ways to follow from where you stand |
| Experiments | 87 named here, 22 live | several thousand | each view shows what is at its address; names on a picture stay capped |
| Engines | 15 | 50 or more | an engine is a file with tests; unused ones cost nothing |
| Lenses | 11 | a few more | a new one needs a new thing to lay out |
| Measures | 9 | 9 or 10 | they should hardly grow: they are the lab's units |
| Givens | 15 | 20 to 25 | one page |
| Directions | 32 | several hundred | found from a given, never from a list |
| Specimens | 6 | hundreds (community designs, real open chips) | chosen from where you stand |
| Entries on the record | 11 | a hundred thousand or more | standings are computed; replay gets snapshots |

What has to be built for that, and when:

- **One file per experiment, loaded when opened**, in the folder of its home world. The owner decided on this
  shape long ago (each topic its own folder, loaded only when opened). It also lets people with less capable
  tools work on one world without reading the rest.
- **Words split by world.** `src/i18n/en.json` is one file of about 2,100 texts. At a hundred times that it
  must be one file per world, loaded with the world. The rule that no visible English lives in code stays.
- **An index, made by a script,** of every experiment's seven sides, so the ways on can be worked out without
  loading everything. The same index serves Jump and the open port.
- **Snapshots of the record,** so a hundred thousand entries are not replayed on every visit.
- **Caps where things are named.** At most five names on a picture, marks merged with a count: already the
  rule, and it matters more as content grows.

None of this is needed before stage 5 of the plan.

## 7. What keeps it from becoming a list or a textbook

Rules, each with the reason it is a rule.

1. **No experiment without something to change.** A page that only tells is a textbook page.
2. **No sentence that claims a fact without an engine's claim or a figure behind it.** The words cannot drift
   from the picture when both come from the same place.
3. **What is open is said in every experiment.** An experiment that ends in an answer closes; one that ends in
   what nobody knows leads on.
4. **Ways on are worked out, never written.** A written link is the start of a path.
5. **Nothing is shown as a whole set** (the questions, the lenses, the experiments), except what is yours.
6. **A thing is written once.** One home for every thing was right; the home is now an experiment, and where
   on the chip it is about is one of its sides.
7. **Drawn well, or read as a document.** A world with no lens yet is a good document, not a bad picture.
8. **Every layer shows its holes.**

## 8. An experiment as data

A sketch of the shape, to be settled in stage 1. Words stay in `en.json` (`exp.<id>.ask`, `.notice.<n>`,
`.open`); nothing a visitor reads is in this file.

```js
{
  id: 'idea-two-ways',
  why: ['idea', 'know'],              // worlds; the first is its home
  strand: 1,                          // which strand of that world
  about: { specimen: 'design', at: 'gates' },   // where on the chip: a level or a step, as the atlas names them
  engine: 'logic',                    // or null, with wants: 'substrate'
  lens: 'forms',
  change: ['code'],                   // what a visitor may change
  trade: ['area', 'work'],            // the measures that move
  notice: [{ claim: 'logic.sameTableOtherChip' }],   // each a claim the engine's tests run, or { figure: 'id' }
  target: null,                       // or a goal the engine judges: then it is a challenge
  given: ['closed'],                  // what it stands on
  open: ['aidesign'],                 // directions being tried
  cases: []
}
```

What is **not** in it: the ways on, the state (live, ready, words, wanted), the pull. Those are worked out.
