# The drawing and the line: design guide

For the nightly build of the design studio (#506–#510), the inside of the 3D line's stations (#511–#513) and their
doors (#514). Written by Claude Fable 5.2 on 28 November 2026 with the prototype beside it (`index.html`, sources in
`src/`). Where this guide and the prototype disagree, the guide wins. Where the guide is silent, copy the prototype.

The prototype is a **reference drawing**, not a view to port whole. The studio's die is ported as drawn. The grid of
station tiles is *not* a view of the site: each tile shows what the inside of one 3D station must contain.

Record fields below are named by the part of the record in `docs/CHIP.md` (as designed, as made, as used) and the
engine behind them. #505 fixes the exact field names; no view may compute a number itself.

## 1. The two moves

| Move | Means | Keys | Pointer |
| --- | --- | --- | --- |
| In, out | scale: chip → block → gate → switch | ↓ or +, ↑ or − or Escape | wheel, pinch, tap the part |
| Along | the chip's life: Design → Crystal → Deposit → Print → Etch → Implant → Wires → Test → Package → Use | ← → | the stages in the bar |

**Along keeps your depth.** → from the studio's gate lands on Crystal's gate; → from Etch's switch lands on
Implant's switch. The camera target is the same part of the same die (same cell, same slice), found by id, in the next
frame. Never reset to the top of a station.

Levels are the stack's rungs: `chip`, `block`, `gate`, `switch`. The studio has no `atom`; the line has `atom` at
Crystal and Implant only (not drawn in the prototype; show the lattice of the dive's atom level there). Above the chip
there is one more level on the line, the **station** (machine and wafer together), and in the studio none.

## 2. The studio: the die as designed

One die, drawn once, in **dashed accent-blue outline on the lab's ground**. No room, no figures, no fill except heat.
Each level is the same drawing closer. Nothing is swapped between levels: parts appear when they are large enough to
read (thresholds in screen pixels, below).

### What is drawn, level by level

| Level | Camera frames | Drawn | Reads | Controls on the picture | Marks |
| --- | --- | --- | --- | --- | --- |
| chip | the die and its pads | die outline; pads on four sides; the units of the floorplan; memory; the trips between them; heat under it all; the die's name above | as designed: recipe (`shape`, `where`), floorplan; heat and trip length from an engine (stand-in today) | *Its shape*, *Where it computes* (the genes' options, four each); *Ask an agent* | *Geometry* on the hottest cell; *Only humans* opens with the agent's proposal |
| block | your block inside the first unit, with registers and control beside it | block outline; cells in their slots; wires (dotted); the longest path (solid, 2.6 px); the input pins; the coverage map in the registers' rectangle once a test has run | as designed: netlist, placement, routing; `timing.js` for the path and its slack; `design.js` simulate for coverage | *The slice by hand*, *Scramble*, *Let it settle*; *Run 20 random tests*, *Test every state*; drag a cell | *Compute beats cleverness* at the block's top right; *Perfect fails* on the path's last cell; *Trust without inspection* beside the coverage map |
| gate | about five by four cells | each cell as layout: two strips of silicon, two gates across them, two rails | as designed: cells of the library; `rules.js` `checkRules` | *Clock to meet* (four periods around the hand placement's own delay: ×1.6, ×1.12, ×0.95, ×0.8) | *Perfect fails* stays on the path |
| switch | one cell, with room at its left | the cell large; its name above; "drafted until the line makes it solid" below | as designed: masks (`maskSet`) | none | none |

**The masks.** Four sheets (silicon, gates, contacts, metal) leave the die's right edge on a dotted accent road that
ends **inside Print's machine, as its mask**. One small square travels the road (12% of its length a second). A side
road leads to a grid of tiles with one lit: a shared shuttle. The sheets draw the record's masks; the prototype's
patterns are placeholders.

**Growth, slice to core to computer.** The names on the picture say it: "your block: four of its 32 slices" on the
block, then "registers" and "control" beside it inside one unit, then the units inside "The community computer, as
designed". Keep these three labels; they are the only place the growth is told.

### Thresholds (screen pixels)

- Die narrower than 34: outline only. Under 200: units and memory, no pads, no words.
- Die wider than 220 and block narrower than 620: heat is drawn, with its two figures under the die.
- First unit wider than 130: block, registers, control appear. Block wider than 150: cells and wires.
- Cell wider than 44: its layout. Wider than 110: its words.

### The four simulations

1. **Floorplan under heat.** A 22 × 22 grid under the outlines, red, opacity `min(0.5, (v − 0.12) × 0.55)`. Two
   figures under the die: hottest temperature, and how far a value travels to memory. Changing a gene redraws at
   once. *Ask an agent* tries all sixteen arrangements, proposes one that is both cooler and shorter, in a card above
   the line of words: what it proposes, the two gains, *Take it*, *Not now*. If none is better it says so.
2. **Placement.** 36 cells on 45 slots (9 × 5). *Let it settle* runs annealing and the cells move while you watch
   (about 1.5 seconds; with reduced motion, the result at once). Under the block: wire now, wire by hand, wire settled.
   Dragging a cell swaps it with the cell in the slot under the pointer; the settle stops.
3. **Timing on the layout.** The longest path is the solid wire; blue with "N ps to spare", red with "late by N ps"
   on a label at its end. It turns red when a wire is long: scramble shows it.
4. **Coverage.** 512 states as a 32 × 16 map in the registers' rectangle: untested faint, tested blue, wrong red.
   One wire of the netlist is moved (the engine picks the change the fewest states reveal). Twenty random tests
   usually look clean; *Test every state* finds the red ones. Words: "N of 512 states tested", then "no wrong answer
   yet" or "a wrong answer, in a corner".

## 3. Inside a station of the 3D line

Every station holds two things in one scene, and the prototype's tile shows both:

- **The machine, cut open** (the tile's left third): its near wall removed, its working part moving, the wafer
  edge-on on its stage, your die a short accent mark on the wafer.
- **The wafer from above** (the tile's right two thirds): 21 dies in a disc, each **your die in its state after
  this step**; the centre die is the one the camera goes into.

### The camera, in one move

```
island → line (exists, #471) → station: three-quarter view, near wall fading out over 600 ms
       → tilt to straight above the wafer (the machine's parts above it fade to 15%)
       → your die (centre) → block → gate → switch, straight down, as in the studio
```

- In the prototype the cut-open machine and the plan sit side by side. In 3D they are the **same model seen from two
  angles**: the three-quarter view is the tile's left third, the view from above is its right. The tilt takes 900 ms.
- From the chip level down the camera is orthographic and the die is drawn exactly as the studio draws it, with the
  state rules of the table below. Use the same drawing code for both.
- At the switch level a **cut through one switch** stands at the cell's left, joined to it by a dotted line. It is the
  only side view below the station level.
- ← → at any depth: the wafer slides out along the line and the next station's wafer slides in, the camera holding its
  depth and its part (700 ms; 1.5× longer when the scale dips).

### What each step does to your design

`f` is the step's place in the line. A die is drawn with the rules of every step up to its own.

| Step | Machine cut open (moving part) | On the wafer | Your die, from above | Cut through one switch | Figures (record, as made) | Mark |
| --- | --- | --- | --- | --- | --- | --- |
| Crystal | crucible, melt, one crystal pulled up and turning | bare disc, dots of the lattice | dotted outline only: "your design waits for Print" | bare silicon | none | none |
| Deposit | chamber, shower plate, specks falling | a ring growing outward; the disc tinted | dotted outline, tinted | a film over the silicon | none | none |
| **Print** | **source, light path over six mirrors to your mask at the top and down to the wafer; pulses travel the path; the stage steps die by die** | a bar of light sweeping one die at a time, that die ringed | units and cells in **accent blue**, filled 16%: printed in the resist, not yet cut | film, resist on it, the exposed part blue | copies' spread (print engine) | *The next Moore's law* |
| **Etch** | **chamber, electrode, plasma (red, breathing), ions as short strokes falling straight; a round glass on the wafer shows three gate lines being cut where the resist is open, each as wide as its copy came out** | a red ring around the disc | cells solid; gates in ink with **wavy edges** and each copy's own width; a copy that strays too far is red, with "this copy's gate strays: it switches late" | the gate standing on bare silicon, its width that copy's | copies' spread | *Perfect fails* |
| Implant | source, bending magnet, beam scanning | a line crossing the disc | silicon strips beside the gates filled blue | blue wells left and right of the gate | specks a cm² (cleanroom engine) | none |
| Wires | layers laid one on another, a polishing disc | an arc going round the rim | rails thick (3 px), wires solid | contacts and a metal line over the switch | specks a cm² | none |
| Test | probe card coming down, wafer stepping | a square stepping die to die; failed dies **solid red** | as after Wires | as after Wires | good dies of all; yield; cost of a good chip (chip engine) | *Efficiency fuels use* |
| Package (#500) | die on its board under a lid, fins | no wafer: one die | as after Wires | none | bonding pitch, heat out (its own engine) | none |

Print and Etch are drawn in full in the prototype. The others are marked "sketched only": build them to the same
depth, one moving part each, no more.

**Wavy edges.** A gate's edge is ten segments; each point is moved by `(hash − 0.5) × width × 0.45 × spread`, and the
whole gate's width is scaled by `1 + (hash − 0.5) × spread × 0.9`. `spread` is the record's, against today's line.
The hash is seeded by the cell's id, so the same copy strays at every station and every visit.

**The line's care** is one control of three (rough, good, the best there is) in the prototype. On the site it is set
at its stations (#513): the dose at Print, the cleanroom at Deposit. Changing it must visibly change, at once, the
gates' edges, the stray copies, the failed dies at Test, and the stack rail's switch and chip figures.

## 4. The stack rail, the bar and the words

- **Bar (top):** logo, title, the whole-sheet button, day or night. Under it the stages of a chip's life in one row,
  the one you stand at bold with a blue diamond under it; *Design* is blue (a way in); *Use: your stack* closes the
  row, blue, behind a rule. On the site this row is the loop in the bar; do not add a second one.
- **Stack rail (left, 164 px):** the seven rungs, mind at the top. The rungs this face holds are full ink with a grey
  rule at their left (studio: switch to chip; line: atom to chip); the rung you are at has a 4 px blue rule; the rest
  are at 50%. Under each name, one figure it hands up, from the record as used. A tap moves in or out to that rung.
- **Words on the picture** carry everything else. A name sits above its part's top left; a figure sits under the
  part it measures. One line of plain words stands above the controls and says where you are.
- **Controls** sit in one glass strip at the bottom centre, and only the controls of the level in view.
- **A question's card** opens at the top right (bottom sheet on a phone), warm border, Besley italic, with *Put it
  down*. At most three marks at once, the nearest to the middle; a mark is a warm ring of 9 px with a slow pulse.

## 5. Layout

| Width | Rail | Picture's safe area | Controls | Never covered |
| --- | --- | --- | --- | --- |
| 1280 | left, centred, 164 px, ground fading behind it for 230 px | left 200, right 30, top 96, bottom 150 | bottom centre strip, at most 1180 wide | the part in focus, its name, its figures |
| 1920 | the same | the same; the picture grows, type does not | the same | the same |
| 390 | a row under the stages, names only, scrolls sideways | left 10, right 10, top 100, bottom 150 | bottom strip, wraps to two rows | the part in focus |

- The opening view at 1280 and 1920 is the whole sheet: the die at the left about 40% of the width, the stations
  three by three at its right, the masks' road above them. On a phone it opens on the die.
- On a phone a station's words are dropped from the picture below 210 px of machine width, and its figure moves into
  the line of words ("Print: copies spread ×1.29.").
- A neighbour may show at the edge of the view, under the rail's fade. It must never sit under the controls' strip
  with readable words: fade neighbours' words out when the view is at a level.

## 6. Look

- **Ground and ink:** the lab's (`base.css`). Blue is drafted and a way in. Red is the signal: late, hot, strayed,
  failed, plasma. Warm is a question's mark. No other colour.
- **Drafted** (as designed): stroke only, accent blue 90%, dash 6 4, 1.2–1.4 px. Wires dotted 3 3 at 40%. No fill.
- **Printed** (Print only): accent stroke, accent fill 16%.
- **Solid** (Etch on): ink stroke 85%, panel fill; gates ink fill 85%.
- **Machines:** ink strokes 1.2–1.4 px; working surfaces (mirrors, electrodes, the wafer) 3.5–4 px; what moves
  through them (light, ions, beam) accent; gas and pumps dashed 3 3 at 60%.
- **Type:** Besley 700 for names of places and parts' titles (13–30 px by zoom), Besley italic 400 for asides and
  questions, Atkinson 12–13.5 for words on parts, Martian Mono narrow 12.5/500 for figures and 10–10.5 for marks.
- **How true:** under every figure, four small steps filled to its mark and the mark's words in mono 10
  ("computed: the print engine", "a stand-in: this prototype"). A stand-in has no step filled. A figure never shows
  without one.
- **Motion:** every flight eases in and out (cubic), 900 ms, up to 1.5× longer across the sheet with a dip in scale.
  Only work moves by itself: light, ions, the stage, the settle. With reduced motion nothing moves by itself and
  flights are cuts.

## 7. States

| State | Studio | Line |
| --- | --- | --- |
| The lab's example (nothing changed) | today's recipe, the slice by hand, clock at ×1.12, no coverage map | care good; no stray copy; Test nearly all good |
| Yours (anything changed) | the rail's rung gains "yours" under its name, as in the stack | the same |
| Empty (no design in the record) | the die's outline and pads only, the words "nothing drawn yet", and the way to the bench | every wafer bare; Print's mask blank; words "no masks yet: draw the chip first", blue, leading to the studio |
| Broken (the switch never turns off, or a rule is broken) | the broken part red; rungs above it dashed red in the rail; the masks' road dashed red and stopped | wafers bare from Print on; words say which part of the design stops the line |
| Late (the path misses the clock) | path red with its figure; the rail's chip figure red | unchanged: the line makes it anyway, and Test fails every die for speed |
| A stand-in | drawn as the real thing, its mark empty and named | the same |

## 8. Retire

- `src/v2/studio3d.js`, `src/v2/furnish.js` and the room, figures and wall panels of `src/data/studio.js`; keep the
  version on a `claude/before-studio-…` branch first.
- The studio's "Go inside" cut to a flat panel.
- The generic wafer of `src/app/journey3d.js` (#511 replaces it with the record's).
- The prototype's own models once engines exist: heat, placer, timing, coverage, cell layout, care as one control.
- The prototype's grid of tiles: never ship it as a view.

## 9. Done right

- [ ] One camera from the island to one switch, in the studio and at every station, with no cut.
- [ ] ← → at any depth lands on the same part at the same depth in the next frame.
- [ ] The mask in Print's machine is the studio's mask; changing the design changes it.
- [ ] Every station's die differs visibly from the one before it, at the chip, gate and switch levels.
- [ ] Changing the line's care changes gate edges, stray copies, failed dies and the rail's two figures at once.
- [ ] No number is computed in a view; every figure shows its mark; no stand-in is unmarked.
- [ ] No panel of text; no word drawn into a 3D scene (labels are HTML over projected points).
- [ ] At most three question marks; none listed; one card open at a time.
- [ ] 1280, 1920 and 390, day and night: nothing under the controls or the rail that is in focus; no sideways scroll.
- [ ] Reduced motion: nothing moves by itself.

## 10. What the prototype does not settle

- The 3D models of the machines: the prototype gives their parts and what moves, not their shapes in 3D.
- The atom level on the line, power beside heat, and the Package station beyond its outline.
- The agent proposes only arrangements here; a proposed placement uses the same card.
- Exact record field names (#505).
