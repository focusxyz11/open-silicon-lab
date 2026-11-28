# Core question cards: the prototype and its design

One card for each of the thirteen core questions: the whole question, one still picture you can move, why it matters,
and where it lives in the lab. Designed and built by Claude Fable 5.2 with the owner on 27 and 28 November 2026. The
owner found the card right, and asked for low movement, well-designed text, and each card to say why its question is
important; all three are in this version.

It is a reference to port from (the task issue says how), not part of the site: it does not follow the lab's rules
for words (`src/i18n/`), styles or loading.

- `index.html`: the built page, one self-contained file. Open it in a browser; `#perfect`, `#geo` and so on open a card.
- `src/cards.js`: every card's words: the caption, the controls' names, why it matters (one sentence and three short
  parts), one thing true with its source, one thing still open, and a note for the build.
- `src/inst1.js`, `inst2.js`, `inst3.js`: the thirteen pictures, each `{ u0, v0?, hstep?, setup, frame }`.
- `src/app.js`: the shell: one card at a time, the drag and the sliders, the footprint, the meetings.
- `src/data.json`: what the right of a card shows, read from the lab's own data by `extract.mjs` (never typed).
- `extract.mjs`, `build.mjs`: from the repository's root, `node docs/prototypes/cards/extract.mjs` then
  `node docs/prototypes/cards/build.mjs`.

## The idea

A core question lives in the lab at two sizes: a **mark** on a picture, and a **lens** at one level, where the core
question is a small line at the foot of the lens card. Nowhere is it whole. The **card** is the missing size: the lens
pulled back out of every level. Pull back from a lens and you hold the card; tap a lit level on the card and you land
on a lens.

## What a card holds

Three bands, read from the top.

1. **See it** (left): the mark and short name, the question in its settled wording, one sentence on why it matters,
   one still picture, a caption under it, then the controls as sliders and two or three measures.
2. **Place it** (right): *Where it lives*, the lab's Map in small (the loop as the ground, each place a shaft of its
   levels, the four shared depths, your stack standing at the Lab), lit where the question has its mark, a tap landing
   there with the lens on. *It meets*: the questions it shares content with, as marks, one opened at a time with what
   joins them and the pair's own question. *It also asks*: the questions from the field under it, and its counts.
3. **Read it** (full width, under both): *Why it matters* in three parts, the same three for every question: *In a
   chip*, *In the age of AI*, *Beyond chips* (the three things the lab asks of a core question). Then *True*, one
   sentence with its source and the kind of source, and *Still open*, set as a question.

## Rules

1. One card at a time. No index, row, grid or menu of the thirteen anywhere. The row at the foot of the prototype is
   for review and is not part of the design. The only way from one card to another is *It meets*.
2. Low movement. Nothing on a card moves by itself: the picture is complete when it opens and changes only under the
   hand. Turning to another card is one short fade.
3. No answer, no goal, no score. Why it matters says what is at stake and never answers; *Still open* has the last word.
4. The question is written once, whole, in its settled wording. No line that restates it.
5. No number written by hand: measures from an engine, facts from `src/data/facts.json` with their kind.
6. No words drawn into the picture: labels are HTML over it.
7. Reading text at 16 px in lines of about fifty characters. The picture has the stage; nothing to read sits in a
   window beside it.
8. Desktop first; on a phone one column: the picture, the reading, the lab.
9. Every word translatable.

## The thirteen pictures

| Question | The picture | You drag | Behind it |
| --- | --- | --- | --- |
| Perfect fails | 144 copies of one drawing, a bar each for how close its slowest signal comes to the tick | the clock | `perfect()` in `lens.js`; here a stand-in spread |
| Digital meets physical | one wire under noise, a line where a 1 begins, the bits as read | the swing | `digital()`, `cleanOne()` in `lens.js`; same formulas |
| Whole beats parts | ten runs in rows: the parts' answers, a vote, the whole's answer | copies; how often a part is wrong | `blockOk()` in `redundancy.js`; same formula |
| Compute beats cleverness | a plain full adder beside the best circuit a blind search has found, with its 16 answers | computing given to the search | `search.js`; here a real, lighter search |
| The next Moore's law | fifty years of microprocessors as dots, the clock beside them, and an empty field past 2021 | the year; how fast your line doubles | `trend()` in `data/hold.js`; same data |
| Fixed or fluid | a chip of sixty places cut by a line, holding sixty jobs | where the line falls; how far the work has moved on | new small engine |
| Trust without inspection | a square of every case an adder can be given; lit, a day of testing | how wide the numbers are | `exhaust()` in `floor.js`; exact |
| Fight or use physics | ninety sums done two ways: exact bits, and currents joining | heat, as noise | `physics()` in `lens.js`, `paradigms.js`; here a stand-in |
| Efficiency fuels use | a cloud of answers, each as big as its energy, against a ring for today | what an answer costs; how eagerly the world asks | `jevons()` in `bet.js`, its elasticity freed |
| Beyond computation | one row of cells redrawn by one rule of eight bits | the rule | new small engine (elementary automaton); the lab's way in is `halt.js` |
| Geometry | a sheet of parts wired to each other, heat at the centre | spacing; how many parts | `geometry()`, `geoEffFront()` in `lens.js`; here a toy sheet |
| Brain or copy | one mind on its chip, and on four other chips | where the mind is kept | `evaluate()` in `mortal.js`; exact |
| Only humans | a field of designs that all pass, each leaning five ways; tap one to keep it | designs the machine makes | `thousand.js`; here stand-in designs |

## Checked

In a browser at 1280 px and 390 px, night and day: no errors, no sideways scrolling. Not checked: other languages, a
screen reader, and the lab's fonts (the test browser could not load them).

Sources not yet in `facts.json`: Matthew Cook, *Universality in Elementary Cellular Automata*, Complex Systems 15
(2004), for Rule 110. Von Neumann 1956 and Sutton 2019 are already cited by the lab elsewhere.
