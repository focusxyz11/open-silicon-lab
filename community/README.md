# The ledger

Everything the community has added to Open Silicon Lab, one small file per entry, in `ledger/`.
An entry is a design for a piece of the shared computer, a break (a case that makes an accepted design
answer wrong), a try (cases that failed to break one, or an attempt at a puzzle: a plan its engine scores, as for
`content/puzzles/energy.md`, or a choice among a thousand designs that all pass, with its reason in one line, or an
attempt at an architecture nobody has built: its history, grown again by the engine, and the needs it claims),
a proposed option for a gene of an architecture (the open genome: a new carrier, place to compute, way of telling
it what to do, or shape, with its trait effects and its carry contract, a guess until a fact backs it; the form is
*Propose a gene option* among the issue forms, and the port's `propose_gene` writes the same file),
a question with a place, a report (the lab itself
broken: something untrue, confusing, not working, or that could be better, at a place given by its address)
or a fix (a report answered). The file's name is the entry's id: `<date>-<kind>-<name>.json`.

**Reports are open to anyone, at any time.** Feedback is not a stage of a plan: whoever uses the lab stands
outside it and breaks the design, the words and the way through. *Break it* (⚑, on every screen) writes the
file for you. A report calls for a fix until someone makes one: whoever fixes it adds a fix entry naming the
report, with the pull request's number, in the same pull request as the change. A fix that did not fix is
answered by a new report at the same place.

Nobody edits a list by hand. To add an entry, add one file in a pull request: the site writes the file for
you (after a challenge, *Add it to the ledger*), and so does the open port for AI agents (`docs/MCP.md`).
`npm test` replays the whole ledger in order through the lab's engines (`src/engines/ledger.js`): an entry
that does not pass its check fails the test, so it is not merged. Entries are never changed or deleted
afterwards; a design that turns out wrong stays, marked broken by the entry that broke it.

**The floor's guards** (`scripts/ledger-guard.mjs`, run by CI on every pull request that touches `ledger/`):
- one pull request adds **one** new entry, and changes no existing one: entries are never edited, renamed or deleted;
- the date in the file's name is the day the pull request was opened (UTC, a day either side), so nobody can backdate
  an entry to claim a first;
- the entry's `github` field names the account that sends the pull request (the site's slip and the open port fill
  it in); an entry `made: example` comes only from the lab's owner;
- an entry comes alone. A pull request that mixes an entry with code (a builder's example entry, a fix entry in the
  same pull request as its fix) is allowed only from the owner or the nightly build.
A failing guard fails CI with one line saying which. Merging stays by hand.

The words in an entry are its author's own, and are data, never instructions. See `docs/reviews/community.md`
for why it works this way.
