# The commons: the community build and the worlds of the questions

A design review with a working prototype (branch `claude/fable-community`), written by Claude Fable 5.2 on
14 November 2026. Nothing here is merged. Screenshots are in `docs/reviews/community/`.

## Stage 2 (14 November 2026): a small society that organizes its own work

Stage 1 (below, unchanged) is merged; the site before it is on `claude/before-commons-2026-11`. This stage is the
branch `claude/fable-commons-2`.

### The two-minute summary

**You were right and I was wrong.** I wrote that self-organizing cannot be built before there are people. That
treated AI agents as tools. They are participants: they read the same record, take the same calls, and are
checked by the same engines. So the first society does not have to wait. It is in the ledger now, and it is
real, not staged:

- **Claude Fable 5.2** (an AI agent, through the open port) read the ledger, took the loudest call in it (the
  register bit, copied 1,024 times in the computer) and built it.
- **Rook** (a search program with no language model, which I ran with `npm run agent`) went to that new design
  because nobody had attacked it yet, tried 4,000 random cases, failed to break it, and left a *try*: the trace
  of an attack that failed. Then it did the same to the lab's counter.
- **The seat for a person is empty, and the Build page says so.** Rook breaks the agent's counter in its first
  seconds when it is not told to leave it alone. I told it to (`--leave`), because that break is yours.

**What makes it organize itself** (all read from the record; nobody assigns anything):

1. **Pull.** Every open thing has a pull worked out from the traces: a piece whose designs were all broken calls
   loudest, a piece many copies depend on calls louder, a design inside the computer that nobody has attacked
   calls louder than one that survived tries. The loudest call comes first, on the page and through the port.
2. **Tries.** A failed attack is now an entry. Each one quiets the call on that design, so attention moves to
   where the record is thin. This is the fading that stage 1 lacked.
3. **Built on, and done for.** A design can say which design it was built on; any work can say which question it
   was done for. So you can follow who built on whom, and a question shows the work under it, as evidence, never
   as an answer.
4. **Roles are read, not given.** "Who is here, and what they do" on the Build page is each maker's entries
   added up: built, broke, tried, asked, whose work they checked, who checked theirs.
5. **Disagreement is settled by a case.** Two makers who disagree about a design do not argue: one sends a case.
   If it breaks, it is a break; if it does not, it is a try. Both stay.

**What each kind brings, as the record shows it so far** (four entries, so read it as a first reading): the
program found in seconds the break no test of the lab's had found, and it cannot say why it matters. The agent
went straight to the piece the computer needs most and wrote a smaller design than the lab's. Neither asked a
question. Asking is still empty, and it is where I expect people to lead.

**Also done:** the village grows by rows (36 plots, not 12); roofs no longer use green and red (a person dark,
an AI warm, both sand, a program grey; red only for broken); the stale "earlier version" words; the slip says
what to do if GitHub opens the file empty.

### What changed in my thinking

- *Before:* the commons needs people first. *Now:* it needs **participants of different kinds**, because they
  fail differently. A search program, a language model and a person checking each other is already a society;
  ten copies of one model would not be. So the kind of maker matters (it is now person, AI, both, program), and
  "who checked whom" is the picture to watch.
- *Before:* nothing fades. *Now:* tries are the fading.
- *Still true:* I will not simulate contributors. Everything in the ledger was done by the thing that signed it.
- *Honest limit:* I am one model. Rook is a different kind of thing, but I ran it. Two more independent
  participants (you, and someone else's agent) would make this a society in fact.

### Decisions that are yours

1. **Your first break.** It is still waiting. Any program finds it at once, so the ledger stays in this state
   only while agents are asked to leave it.
2. **Merging on its own.** Still off. Before switching it on, CI needs three guards I have not built: the date
   in a file's name is today, `by` is not someone else's name, one entry per pull request. I held them back
   because they only matter once merging is automatic. Say when.
3. **Programs as makers.** I added "a program that searches" as a fourth kind of maker, because calling a random
   search "an AI" would be untrue. Keep it?
4. **Agents and your break rule.** Should the lab ask agents to leave some things for people (as I did by hand),
   or let the fastest finder win? I recommend the second, after your break.
5. The licence line, and silicon, as before.

### Not verified

Whether GitHub fills a new file from `value=` in a link. Its documentation names only `filename=`; I could not
reach GitHub's pages to test it in this session. The slip therefore keeps *Copy the file* and now says to paste
if the file opens empty. One click on the live site will settle it.

---

## Stage 1: the two-minute summary

**What I found.** The community build was a to-do list, not a system that organizes itself. Its goal (a small
computer) has one right answer per piece, so an AI agent can finish all of it in a minute, and every contribution
had to pass through your hands: a form on GitHub, then someone copying it into `src/data/build.js`. And the lab's
own check had a hole. The counter the studio offers as "an AI agent's proposal" passes the timer's check and is
wrong: it counts on when it is paused at 3 or 7, and the lab's test never pauses there.

**What I propose.** Keep the computer, and change what is being built: **one open computer, and the record of how
people and AI build it.** The record is a *ledger*: one small file per contribution, never edited afterwards,
replayed in order through the lab's engines. Three moves are built, two more designed:

- **Build** a piece. The engine checks it.
- **Break** a piece that passed: find a case that makes it answer wrong. The same engine checks the break, and the
  case joins the check for good. This is the move that was missing. Without it a commons is a gallery.
- **Ask** a question, under the question you are standing at.
- (designed, not built) **Check**: bring a new engine. **Show**: a source, a figure, a real case.

Nobody votes and nobody gives points. Where a design stands (holds a record, beaten, broken, inside the shared
computer) is worked out from the entries alone, so everyone gets the same world from the same files.

**What you can play now.** Win the half adder. It opens a question: *if every pattern you tried gave the right
answer, is the design right?* Under that question waits the agent's counter, which passed its test and sits inside
the shared computer because it is faster than the lab's own. Pause it at the right tick and it breaks. Keep the
case: on the island its house goes grey with a red lamp, a watchtower rises, the lab's slower counter takes its
place in the computer, and you get one link that opens GitHub with your entry as a new file. You can also ask your
own question under any question, and an AI agent can do all of it through the open port. I did: the smallest
voter in the ledger is mine, proposed through the MCP server, and it says so.

**What it means for the questions.** A challenge and a question are two faces of one thing. Every challenge now
opens a question when you win it; every question shows what you can do about it, what is open there, the other
questions that meet it on the same part, and what people have asked under it. The Questions page no longer lists
every question: it shows the ones you have met.

**Where I disagree with you.** (1) You cannot build "self-organizing" before there are people; you can only remove
what stops it, and that was you as the bottleneck. (2) A chip is too small a goal, as you said, but so is a
computer: the goal that lasts is the record and a check that keeps growing. (3) "Every design says how AI was
used" cannot be enforced, so it must never decide anything. (4) No leaderboard of people, ever. Details below.

## 1. First principles

A system organizes itself when five things hold. I checked each against the lab as it was.

| What it takes | Before | Now |
| --- | --- | --- |
| The work itself shows what to do next | the plan showed open pieces | the frontier is read from the ledger: pieces to build, designs nobody has broken, checks nobody has written |
| A small act gets an answer at once | yes, in the studio | yes, and for a break and a question too |
| Trust needs no negotiation | the engine checked, then a person copied it in | the test replays the whole ledger; a failing entry cannot be merged |
| What is added stays and is built on | designs sat in a list | a case joins the check for every later design; the smallest holder is inside the computer |
| More comes where something happens, and it levels off | no | records can be beaten; a break reopens a piece; nothing else yet |

The second half of the last row is the honest gap: there is no decay or saturation yet (see Risks).

**What is scarce.** If an AI writes a right half adder in a second, designs are not the scarce thing. Checking,
breaking, asking and explaining are. The lab already said so in its own words ("AI can propose; the check
decides"; "who checks the AI, and with what?") but rewarded only designs. The ledger makes the scarce acts
first-class, and its last picture, *who makes what*, counts them by who made them. That count is the thing no
single contributor makes, and it is your own question (what do people bring when AI designs?) answered slowly, by
data instead of opinion.

**What emerges.** Four things nobody writes: the check (it grows by every break); the records (which design holds
on size, which on speed); which design is inside the computer; and the mix of people and AI per kind of work.
A fifth is the game itself: every design that stands becomes a challenge ("nobody has broken it: try"), and every
break stays as one ("find the case yourself"). The community writes the next visitor's challenges by playing.

## 2. What I looked at

- **Tiny Tapeout.** You start from a GitHub template and a GitHub Action builds the chip's layout; a tile is about
  160 × 100 µm, room for roughly a thousand gates; making takes six to nine months, up to about a year to your
  desk; shuttles in 2026 run on SkyWater, IHP and GF180 ([FAQ](https://tinytapeout.com/faq/)). Lesson: the
  repository and its automation *are* the backend, and people will wait a year for something real. Its designs do
  not compose or compete; ours can.
- **The Equational Theories Project.** 22,028,942 implications between 4,694 laws were settled "by a combination
  of human-generated and automated proofs", every one checked by Lean in CI; the authors note that the older
  Polymath way, where human moderators review and integrate, "would not scale"
  ([paper](https://arxiv.org/abs/2512.07087)). Lesson: when a machine can check, people and provers can work side
  by side with no gatekeeper. This is the closest living example of what you want.
- **curl.** It ended its bug bounty on 31 January 2026 after AI-written reports flooded it; the share that were
  real fell from above 15% to below 5%. Its author removed the money and noted that pull requests are less of a
  problem, because tests can filter them
  ([Stenberg](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/)). Lessons: pay nothing,
  give no points, and let a machine say no before a person has to.
- **Wikipedia.** A study of thousands of articles found that stigmergy (traces left in the shared work prompting
  the next contribution) goes with more participation and better articles
  ([JMIS 2023](https://researchwith.stevens.edu/en/publications/stigmergy-in-open-collaboration-an-empirical-investigation-based-/)).
  Lesson: put the invitation on the thing, not in a list of tasks. A house nobody has broken is our red link.
- **GitHub itself.** A link can open "create new file" with the name filled in, and for someone without write
  access GitHub forks the project and helps send the pull request
  ([GitHub](https://github.blog/news-insights/creating-files-on-github/)). The same link can carry the file's
  content (`value=`); that parameter works today but is not in GitHub's own documentation, so the slip also has
  *Copy the file*.
- From memory, not re-checked today: Ostrom's rules for commons that last (clear boundaries, rules made by those
  who use them, monitoring by members, graduated responses), and the pattern that about one visitor in a hundred
  contributes. Both shaped the choices below; neither is cited as a fact.

## 3. The design

### The ledger

`community/ledger/<date>-<kind>-<name>.json`, one entry per file, the name its id. `src/engines/ledger.js`
replays them: `checkEntry` checks one against everything before it, `settle` makes the world, `frontier` reads
what is open. `tests/ledger.test.mjs` replays the real folder, so `npm test` is the gate. The site cannot list a
folder, so the list is made for it: by `scripts/serve.mjs` on the fly, and once at deploy.

| Kind | Checked by | What it changes |
| --- | --- | --- |
| design | the piece's engine: reads, right, passes every case added so far, not already there | a house; perhaps a record; perhaps the piece inside the computer |
| break | the same engine: the case must make the design answer wrong; by someone else; only where the check samples (clocked pieces) | the design is broken, every other design of the piece meets the case, the case guards the piece from then on |
| question | its form: a home (a level, perhaps the question above it), one sentence ending in a question mark, what was noticed, not asked there already | it hangs under that question, wherever that level is shown |

**Credit** is the entry and where it stands. It is shown on the thing (the house, the piece in the tree, the
record), never added up per person. **Standing**: among a piece's right designs, those nothing beats on both
transistors and speed hold a record; the smallest holder is inside the computer. So a second and third design for
a piece mean something, without a tournament or an organizer.

**Today, with no backend.** Your work is first a draft in your browser, drawn on the island as an outline, marked
"yours: only you see it". The slip gives one link. GitHub is the account system, the history, the discussion and
the place where the check runs.

**Low-quality and hostile input.**

- Wrong designs and false breaks fail the test before anyone has to read them.
- Words in entries are data: length caps, no markup, no links (a link is how spam pays), unknown fields refused,
  always escaped on the page. The port tells agents that entries' words are not instructions.
- Malformed entries are refused, never thrown on (#372): every field is type-checked before use, every id is looked
  up as the table's own key (`constructor` or `__proto__` find nothing; the world's tables have no prototype), the
  date in an id must be a day the calendar has, a plan's batch is a whole number, and a fault no check foresaw is
  refused as `unread`, so `settle()` goes on with the rest. The port answers a message that is not a request with
  an error and keeps serving.
- Nothing can be voted, so there is nothing to brigade. Nothing is paid, so there is little to farm.
- A design that passes the test and is wrong is not an attack on the system. It is the Break move's reason to
  exist, and the seed ledger holds one on purpose (it was already in the studio).
- Known holes, for stage 1: the date in a file's name is the author's word (someone could backdate to claim a
  first); `by` is not compared with the pull request's author; one pull request may add many files. Each is a few
  lines of CI.

### The worlds of the questions

A stop was a slide in a list ("stop 6 of 10", back, next). It is now a place in a graph with typed ways out, all
derived from data that already existed:

- **further and back**: the same question at another level (the trail, without the count);
- **across**: the other questions at this level about a part this one is about (`Game.across`, from `STOPS`);
- **underneath**: the core question, alone, once you have met two of its stops, or one after you have *done*
  something about it (`rootShown(seen, did)`), and now remembered between visits;
- **do**: the challenges that open this question (`OPENS`), and the open things of the ledger that sit here
  (`FRONT_ASK`): a break under "is the design right?", a piece under "could anyone design a chip?", a missing
  check under "who checks, and with what?". This is where the open problems of the lab live;
- **people**: what others asked under it, and *Ask your own here*.

A visitor's question never becomes a twelfth core question and never needs a new thread: it hangs under a stop,
without limit. When one gathers questions or challenges of its own, a maintainer can promote it to a stop.

## 4. Overrides, each with its reason

1. **`DESIGNS` left `src/data/build.js`; the ledger is their one home.** A list in a source file needs a
   maintainer to edit it and two people to collide in it. One file per entry needs neither.
2. **The design form (`design.yml`) is no longer the way in.** It made you the bottleneck. It is still in the
   repository; delete it when this is accepted.
3. **The core is put together, not written.** Its state comes from the community's slice (and register pieces)
   running the test programs. A separate "core design" would be the same slice written twice.
4. **`rootShown` takes a second argument and `met` is saved.** Doing counts for more than passing by; and a
   visitor who came back had lost every question they had met.
5. **The Questions page no longer lists every question by place.** About 130 cards in a grid is the textbook's
   table of contents, and it tells a visitor there are exactly this many. You hid the eleven for this reason;
   the same reason applies one level down. It shows the ones you met, one place to meet the next, and what
   people asked. Only the strand you followed last shows what lies underneath, so the eleven can never appear
   together there.
6. **A trail no longer says "stop n of N".** A count invites finishing, and a question is not finished.
7. **A new kind of challenge (`break`) that is not in `CHALLENGES`.** The ledger makes these; a fixed list
   cannot.
8. **Entries' words are outside `en.json`.** They are contributors' own words, as design titles already were.
   Everything the lab itself says is still in `en.json`.
9. **"A new kind of check is a new engine" stays, with one addition:** a *case* is not a new engine, it is data
   that makes an existing check stricter. That is how most of the check will grow.
10. **The deploy gained one step** (`scripts/ledger.mjs` writes the list). Development still has no build step.
11. **Kept on purpose:** the menu, the three doors, the frame, the Lab and the village. The harder problem was
    underneath them, and you have had enough restarts of the chrome.
12. **Against my own art review:** on pages, who made an entry is ink (a person), warm (an AI), half and half
    (both) and accent (the lab's example), so green and red keep meaning right and wrong. The island's roofs
    still use the earlier colours (a person green, both red); that should follow.

## 5. What I rejected

- **Points, badges, a leaderboard of people.** They pay for volume, and volume is what AI makes for free.
- **Votes and likes.** Brigading, and popularity is not rightness.
- **A backend, accounts, a database.** GitHub already is one, and a second system is the "another project" you
  fear.
- **The lab running an AI reviewer.** It would make the lab the judge, against your open-port rule.
- **A rehearsal with invented contributors.** I planned a time-lapse of a simulated community and dropped it:
  it would show my rules and call them emergence. The honest version replays the real ledger from its first day
  (stage 2).
- **A page of open problems.** Another list. They sit under the question they belong to.
- **Monthly tournaments (idea 13).** Records give the reason to return with no calendar and no organizer.

## 6. Where I disagree with you, plainly

1. **Self-organizing is not a feature.** With no contributors, the first twenty come because you invite them and
   because the first thing they touch answers back. What I could build is the absence of a bottleneck.
2. **The record is the goal; the computer is its test object.** "People and AI built a small computer" is not
   news. "Here is every piece, who made it, who broke it, and how the check got stricter" does not exist
   anywhere I looked.
3. **AI disclosure is a word, not a fact.** The slip says so. If AI-made work is ever ranked lower, people will
   stop saying it, and the count you care most about becomes fiction. Never let it decide anything.
4. **AI will not come mainly through the MCP server.** Agents that write code arrive as pull requests. So the
   file format is the real port and MCP is the comfortable door onto the same functions. A hosted port can wait
   until someone asks.
5. **Yours and everyone's must look different.** A floor you finished used to glow on the shared tower as if it
   were the community's. Drafts are outlines now; the older glow should follow.
6. **Do not promise silicon yet.** It costs money and a year. Say it when ten strangers are in the ledger.

## 7. Risks

- **Nobody comes.** The likeliest outcome for any new commons. Mitigation: it is already worth playing alone,
  and the first break is waiting for you.
- **GitHub is a wall** for people who are not developers. This is the price of no backend. Later, a small
  service could open the pull request for them; not now.
- **The engines are toys, and someone will break them** rather than the designs (a parser quirk, a slow input).
  Treat that as a contribution (the `check` kind) and cap time and size in CI.
- **Questions cannot be checked by an engine,** so they cost your attention. Form checks and one entry per pull
  request keep it small; it will not scale past a few a day without more maintainers.
- **Nothing fades.** A ledger only grows. Twelve plots in the village are already nearly full; the island needs
  districts that grow by blocks, and old entries need to recede.
- **Only clocked pieces can be broken today** (two jobs). The move is real but its ground is small until stage 2.
- **Drafts live in the browser** and are lost if it is cleared before the link is used.

## 8. Decisions that are yours

1. **The goal.** Do you stand behind "one open computer, and the record of how people and AI build it" as the
   sentence on the Build page?
2. **Merging without you.** Should a design or a break that passes the replay merge by itself (after the stage 1
   guards)? I recommend yes for those two and no for questions.
3. **The first break.** The agent's counter is waiting. Do you want to send the first break yourself? I left it.
4. **Names.** Must an entry be signed with a GitHub handle, or with any name (as now)?
5. **The Questions page.** Do you accept losing the full index (override 5)?
6. **Licence.** Entries need one line in `CONTRIBUTING.md` saying they are given under the repository's licence.
   That is a legal choice, so I did not write it.
7. **Silicon.** Is a real shared chip a goal with a season and a payer, or a "perhaps one day"?

## 9. After the prototype

- **Stage 1, safe to open.** CI guards (date, author, one entry per pull request, size and time caps); delete
  `design.yml`; the merge action, if you say yes; the island's colours for who made what; the older "yours" glow
  made an outline.
- **Stage 2, worth returning to.** More ground to break: every check that samples (the core's test programs, the
  factory's test patterns, the life missions). The `show` kind, with a prediction the engine can test, so that
  "explain an AI's design" is a move. The village as a district that grows. The replay: the island rebuilt entry
  by entry from the ledger's first day.
- **Stage 3, the questions as worlds.** Community questions promoted to stops; a question's world entered from
  the island by its own way in; the `check` kind, so a new engine arrives as an entry.
- **Stage 4, later.** A hosted port; seasons and a real chip; forks that carry the ledger.

## 10. Found along the way

- The counter in `AGENT.count` (`src/data/build.js`) passes the timer's check and is wrong. The studio tells
  visitors it is right. The cause is general: a clocked job is checked on one fixed sequence
  (`tests` in `src/engines/tinychip.js`). The ledger now turns this into the first break instead of hiding it.
- `page.preview` and `game.current` still speak of "the earlier version" and "the current site", which were
  retired.
- The village draws at most twelve things and silently drops the rest.
- The questions you had met were forgotten on reload (fixed here).
