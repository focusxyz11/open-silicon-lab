# Finished: the bar a level must meet

You cannot invite people into a half-built world, but you can invite them into one great room (#326). This is what
"finished" means for one level of the lab: the level, everything it shows (its picture, its lenses and where two of
them meet, its labs, Listen) and the three ways it is worn (Look, Do, Read). A level is finished when it meets every
line below, and the pull request that says so shows each line checked.

The block was the first level walked against it (below). The owner looks at the live block before the bar is used for
the next level, so this file may still change; until then no other level is held to it.

## The bar

Each line says what it asks and how to check it. A check that a machine can run is run in `npm test` or the smoke
test; the rest are done by eye, on screenshots kept in the pull request.

| # | The line | How it is checked |
| --- | --- | --- |
| 1 | **The picture is well designed, or left out.** Nothing drawn collides: names, marks, the way in, the card, the rails. Nothing is clipped or scrolls sideways. Every mark a lens paints on the picture is named in its card (its key), so the picture reads without guessing. | Screenshots at 1280 × 820 dark and 390 × 844 light of Look, Ask, every lens, every meeting, every lab and Listen, looked at one by one. The smoke test fails on sideways scrolling and on a mark that cannot be placed. |
| 2 | **Every claim is checked**, by the truth audit's method (`docs/reviews/truth/block-and-machines.md`, six steps): every text in scope gathered by rule, sorted into claims and not, each claim checked against a source or the engine run, one verdict, a fix with a trace. A number in a stop's words has its figure (`src/data/facts.json`, `FIGURES`). Words added since the audit are checked the same way before they land. | The audit's file for the level; `npm test` (figures, words). A picture that misleads with no words is caught only where a number stands beside it, so the numbers a picture draws are checked against their engine too. |
| 3 | **Every model is marked with how true it is** (`docs/SYSTEM.md`, 4b): the level's picture, each lab, each lens's measure, each pair that one model computes, each front. | `src/data/fidelity.js`; `tests/fidelity.test.mjs` fails on anything shown without a mark. |
| 4 | **The lenses and their meetings are drawn from the parts' facts**: each lens that lives at the level paints it from `src/data/partfacts.js` with a model of an engine (`src/engines/lens.js`), and two lenses held are drawn in their shape (a front, a fork, a chain), a front only where one model computes both measures. Each lens asks one question with the note that belongs to it. | `tests/lens.test.mjs`, `tests/frame.test.mjs`; the smoke sections `frame` (every lens repaints, every pair draws). |
| 5 | **At least one open problem has attempts in the ledger**: a problem people and agents can push, each attempt a `try` entry in `community/ledger/`, replayed by `src/engines/ledger.js`, drawn where the problem is met, and open to an agent through the port (`scripts/mcp.mjs`). | `npm test` replays every entry and places every attempt; the PR shows the chart with them. |
| 6 | **Look, Do and Read are all good at 1280 px and 390 px, dark and light**: in Look the picture is the stage and the caption stands on it; in Do the lab's instrument has the stage and its controls are beside it (on a phone, under it); Read is a column of about 70 characters with its picture pinned beside it. | Screenshots; the smoke sections `frame` and `labs` (every lab won in Do mode, instrument beside the panel). |
| 7 | **No motion without meaning.** What moves carries something (energy travelling, currents adding, the clock's beat, a level arriving); nothing moves for decoration, and with reduced motion nothing moves at all. Between levels there is no jump or pop. | By eye, and with `prefers-reduced-motion`; the smoke sections `motion` and `seams`. |
| 8 | **It loads fast.** The first page loads none of the level's code; the start-up module graph does not grow with the level; a view loads its styles and code when it opens. | The start-up graph of `src/main2.js` counted before and after (files and KB); `base.css` with the first page's sheet under 60 KB (`npm test`). |
| 9 | **It reads in plain words to someone new to chips.** Each term explained the first time; questions, not answers; one sentence per step of a caption; text read at 15 px or more, names and instrument labels at 14 px. | By eye on the screenshots; the truth audit's sorting (step 3) reads every text once. |

## How a level is walked

1. Take the screenshots of line 1 from an untouched `main` first ("before").
2. Go down the bar line by line, write what misses in the table of the level below, and fix it in the same pull
   request. A miss that needs the owner (a model to redesign, a choice of what to show) is written as left, with why.
3. Take the same screenshots again ("after") and put both in the pull request, with each line of the bar ticked.

## The block, walked on 24 November 2026 (#326)

Before and after screenshots are in the pull request (`pr-shots`, `task-slice/`).

| # | What missed the bar | What was done |
| --- | --- | --- |
| 1 | The lenses' paint had no key: wire colours, pulses, tinted cells and dashed margins were left to guess. | Each lens's card now names every mark its paint draws, drawn the way the paint draws it (`keyHtml` in `src/v2/lenspaint.js`, words `lp.<lens>.key.*`). |
| 1 | The way in (*Go inside*) stood on a lens's paint and covered part of it. | While a lens is held the way in steps aside; the lens's card already has ↓ and ↑ (`.lensing`, `src/v2/frame.js`). |
| 1 | A lens's mark could sit on the end of a part's name (the phone most of all). | Marks take the first spot clear of every name too, and fall back to the old rule only when none is (`trackMarks`, `src/v2/frame.js`). |
| 1 | With Listen (or the joule's lens) open beside it, the smaller picture slid under the caption. | With a box beside it the picture stands clear of the caption (`diveInset`, `src/v2/glue/flat.js`). |
| 2 | The front of Geometry and Efficiency fuels use drew the **whole answer's** energy (about 10,000 J) as if the block's trips set all of it: packing the logic beside the memory "saved" 4,500 J, when the block's whole share of an answer is about 9 J. | Wrong: fixed. The front is now drawn in the block's own joules (`geoEffFront` in `src/engines/lens.js`), the card says what the whole answer takes and the block's share of it, and `tests/front.test.mjs` holds the model to the budget engine's block. |
| 4 | Two lenses asked the same question from the field (*Why does fetching a number cost far more than using it?* under Geometry, Efficiency fuels use and Brain or copy; *wear* under Fight or use physics) with a note under it that belonged to another question (the clock's voltage, a ring of NOT gates, compute in memory). | A field question now leads only in the lens that is its home (the first it is filed under); every other lens asks its own question with its own note (`lensCard`, `src/v2/glue/frame.js`). |
| 5 | The front said "each try could be a point on this chart"; nothing was kept. | The front takes attempts: a `try` entry with `front` and a plan (`FRONTS` in `src/engines/ledger.js`), each placed by the model on the chart, the ones nothing beats joined; kept from the card, signed like every entry, or by an agent through `block_front` and `submit_front`. Four attempts are in the ledger (three examples, one by an AI agent); `npm test` replays them. |
| 9 | The instruments' labels were 12 px, under the type scale. | 14 px for labels and names, 15 px for the controls' names, in the side panel (`src/styles/frame.css`). |
| 3, 6, 7, 8 | Met as they stood: every model marked (#325), Do mode for every lab at the block, motion only where it carries something, nothing of the block on the first page. | The start-up graph is 105 files before and after (863 KB, then 866 KB: the ledger's front). |

Left for the owner, as the truth audit left them: the clean-1 model's noise (too large, said so on screen), and
whether the energy of one answer should start from a served batch. The front's model is still the lab's own (the
words say so): a fetch's energy grows with the length of its trip, and moving memory into the rows gives the logic
the memory's room.
