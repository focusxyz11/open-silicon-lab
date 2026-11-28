# Your chip: one record

How the design studio, the line and its machines, the simulations and the calculations share one chip. Agreed with
the owner on 27 November 2026 (`docs/DECISIONS.md`); the plan it serves is `docs/PATH.md` ("Three faces"). The
guiding prototype for the studio and the line is `docs/prototypes/studio-fab/` (Claude Fable 5.2).

## The problem it solves

The studio, the factory's stations, their machines, the labs' simulations and the stack's carry each work on their
own today: the studio keeps its design in the bench, the line follows a generic wafer, the carry assumes numbers the
line does not give it. Polished separately, they would look good and disagree. So the lab keeps **one record of your
chip**, which every part reads and writes and none keeps a copy of.

## The rules

1. **One record per chip,** in three parts:
   - **As designed:** the recipe (the four genes of `src/engines/arch.js`), the fine settings, the design (the
     netlist and the placed and routed block of `src/engines/design.js`, `build`), the floorplan, and the masks
     (`maskSet` in `src/engines/rules.js`).
   - **As made:** the chip's state after each step of the line, in the line's order (crystal, deposit, print, etch,
     implant, wires, test, package), each with that step's report.
   - **As used:** the carry, rung by rung (`carry` in `src/engines/path.js`), reading the made part for what the line
     did (the copies' spread, the defects, yield, the cost of a good die) instead of assuming it.
2. **Every machine is a function.** A station takes the chip so far and the line's care, and returns the chip after
   it plus a report: what it added, what went wrong, what it cost and the mark of how true each number is. Print reads
   the masks of the design; Etch reads what Print left; the line is these functions in order. A new machine is a new
   function, checked by its own tests, never a picture with its own numbers.
3. **Calculations live only in engines.** The studio's die, the 3D line and its machines, a station's frame, your
   stack, Hold's last block and the field all draw the record; none computes a number of its own. That is what keeps
   them in agreement.
4. **Every number carries its mark** (`src/data/fidelity.js`: computed, real figures, an idea drawn, a guess). A
   stand-in (the prototype's heat, its placer) shows as one until an engine replaces it.
5. **One id per thing:** the record names rungs, levels, steps and parts by the atlas's ids (`src/data/atlas.js`), so
   any view can find where a thing lives and *along* keeps the level you are at (`alongTo`).
6. **Agents use the same record through the open port** (`src/engines/api.js`, `scripts/mcp.mjs`): an agent proposes
   an arrangement or a placement, the engines score it, the person decides. The lab runs no agent of its own.
7. **The record is pure data,** so a chip can be kept (`osl-chip`), replayed and kept in the ledger as one entry.

## What exists, and what joins it

| Part | In the lab today | Joins the record as |
| --- | --- | --- |
| Recipe and fine settings | `stackOf`, `recipeOf`, `fineOf` (`src/engines/path.js`) | as designed |
| Floorplan and its heat | `floorplanOf`, `heatOf` (`src/engines/floorplan.js`, #507) | as designed |
| Design, placement, routing | `build`, `simulate` (`src/engines/design.js`, `tinychip.js`), `timing.js`, `evolve.js` | as designed |
| Masks | `maskSet` (`src/engines/rules.js`) | as designed, read by Print |
| Crystal | `src/engines/crystal.js` | a station function |
| Deposit, the cleanroom | `depoRun`, `cleanroom`, `isoLimit` (`src/engines/fabline.js`) | a station function |
| Print | `litho`, `euv` (`src/engines/litho.js`) | a station function reading the masks |
| Etch | `etchRun` (`src/engines/etch.js`) | a station function |
| Implant | `implant` (`src/engines/dope.js`) | a station function |
| Wires | `overlay`, `VIA` (`src/engines/fabline.js`) | a station function |
| Test, yield, cost | `dieOf`, `defectsOf` (`src/engines/chip.js`) | a station function |
| Package | not yet (#500) | the eighth station |
| The line's care | `CARE`, `lineOf` (`src/engines/path.js`, `chip.js`) | an input every station reads |
| The carry | `carry` (`src/engines/path.js`) | as used, reading as made |

## Building it

The first task builds the record and turns the existing engines into station functions, with no view changing
(`[Task] The chip's record`, #505). It is built: the record's fields and the line's stations in order are fixed in
`src/data/chiprecord.js`; the stations, every machine a function, are `src/engines/stations.js` (`STATION_FNS`,
`runLine`, `fabOf`: what the line hands up); the record is `src/engines/chiprecord.js` (`recordOf(stack, design,
care)`, `designedOf`, `madeAt(record, step)`, `keepOf` and `fromKept` for `osl-chip`), and the carry reads the made
part (`carryWith(stack, made)` in `src/engines/path.js`; `carry(stack)` runs the same line when there is no record).
Every cell's copy strays by a seed of its id (`hashOf`), the same at every station. Package keeps its place as the
eighth station with no function until #500; the design's timing (the guide's Late state) is not read yet. The studio and the line then draw it (the tasks named *Studio* and *Fab*). They follow
the design guide `docs/prototypes/studio-fab/GUIDE.md`, written by Claude Fable 5.2 as the last design round for the
studio and the fab: no further Fable round is planned.
