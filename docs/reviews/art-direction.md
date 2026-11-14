# Art direction: one world, level by level

Written 2026-11-14 from the 25 screenshots in `/tmp/art/` (1280 x 800, dark and light), `CLAUDE.md`, `docs/SYSTEM.md`, `docs/FRAME.md`, and a reading of `src/v2/kit3d.js`, `src/v2/chip3d.js`, `src/v2/board3d.js` (in part), `src/app/world.js`, `src/app/scenes.js` and `src/app/solid.js` for cost. Nothing has been applied: this file is the only change. No code was run and nothing was measured on a phone; every budget below is a target to check, not a result.

Not seen: no screenshot shows the car, the phone board, the car chip, the die, or anything at 390 px. Verdicts for those rest on the code and on their sibling levels.

Reviewer: Claude Fable 5.2, asked with a written brief.

## Status

Applied 2026-11-14, first part (the mismatches): one colour per material in the flat gate, switch and block (silicon blue-grey, the switch's gate in the accent, copper wires, contact metal, a glass skin, doped source and drain), and the 3D chip's switch layer drawn as stacks of sheets, not fins. Checked and not changed: the atom picture already joins each atom to four neighbours (two above, two below); at screenshot size it can look like three. Second part, same day: the switch in 3D (`src/v2/switch3d.js`), the first level of the build order. One change from the spec: the camera looks from a little left of the front (-18°) rather than the stack's -35°, because at -35° the source hid the gate's cut face. Third part, same day: the clean-up of the flat dive (step 2, first half): no card, frame or ghost of the level above round the picture; no miniatures or frames in portals; names, notes and question marks in HTML (`src/v2/overlay.js`), at most five names, a note only on a picked part beside its name with a ring on the part, marks only under Ask (more than three on a part become one with a count, on the 3D switch too); four corner marks on the way deeper after three seconds at rest; no canvas blur; no white outline round a whole chip, die, wafer or machine; no grid behind the gate; the block's wires faint unless picked or in the story; the scanner's pumps named, its loader gone, its laser warm, not red; green no longer a material (battery charge, signals). One choice beyond the review: a note opens only on a pick, as on the 3D switch, where before the level's main part had one open from the start. Fourth part, same day (step 2, second half): the bench's result strip is words in its dock, and words in its drawings too small to read (under 8 px) are left out; the bench and the factory's line take the same HTML notes and marks; the supply map has no grid, canvas title or row of steps and fills the free screen; the line at night has a plain floor, no ceiling lattice, quieter edges and darker glass; the board's copper is traces that go to each link and wide traces that bring power, not 26 stripes. Not done: the mask stack at the bench still runs off the edge when the masks are the next station (it is the next station, seen beside this one), and the working machine on the line is not lit apart. Fifth part, same day: the atom in 3D (`src/v2/atom3d.js`, step 3): a crystal three cells wide, two high and two deep in the diamond pattern (atoms left at a corner with one bond are left out), turned so one of its diagonals lies near the line of sight, with the added atom warm, ten loose electrons, the skin as a disordered network of silicon and oxygen, and fog set from the camera's distance so the back fades. Six draws. What it shares with the switch moved into one module (`src/v2/level3d.js`). Not done: the sheet breaking into atoms between the switch and the atom; the flat picture shows for a moment instead. The risk named below stands: if the crystal confuses beginners, the flat net comes back, redrawn so four bonds show. Sixth part, same day: the gate as a relief (`src/v2/gate3d.js`, step 4), the same plan as the flat gate with its layers in true order, lifting apart once on arrival (not with reduced motion), and the timing race along the bottom. Step 4's question answered: at the review's heights (1 to 4 per cent) and 70° the relief read as a flat drawing tilted, and the lift moved toward the camera, so it hardly showed. At three times those heights and 65° it reads: the order shows by what covers what, the studs stand under the copper, and the lift visibly separates the layers. So steps 5 and 6 (the chip on the board, the block) can go ahead as reliefs, but at about three times the heights in the table and 65°, to be tried at their real camera first. Not done: the plan standing up into the switch; the flat picture shows for a moment between them.

Seventh part, same day: the chip as a relief (`src/v2/relief3d.js`, step 5): one drawing for the data centre's chip, the phone's, the car's and the die, from the flat scenes' parts, at three times the table's heights and 72° (a floorplan needs to be read more straight than the gate); working blocks warm, late ones red, memory a regular field of bits, the clock's beat on copper. Coming down from the data centre's flight, the camera rises from the flight's angle (29°, turned -35°) to the plan's and turns square, from the first frame drawn. One change from the review: no lid. The review saw the board view with its lid on before the chip; in the chip world the dive's chip is reached from the flight, which ends over the bare die, so a lid would appear only to lift. Not done: the flight's die (a fixed picture of one) and the board view's (48 cores) are not yet your chip's grid of cores, so the cores change in number as you arrive; that seam is in their files (`dc3d.js`, `board3d.js`). Eighth part, same day: the block as a relief (step 6), a fifth plan in the same module: twelve rows of cells of different widths (the flat block's widths, from your chip's switch size) between copper rails, the memory array as a lower field of bits, your design as warm cells from the start of row three (its name only once you have a design), and the wires over the cells at a fifth of their strength until you pick them, then whole, with signals on them. The gate's cell in row six, where the dive goes next, is a shade lighter. Seven draws. With this, all four shared levels below the chip are on the stage. Next in the build order: the wafer (step 7).

Ninth part, same day: the wafer in 3D (`src/v2/wafer3d.js`, step 7): a polished disc on its chuck, with its notch; your chips as low tiles (one instanced draw), the pieces the rim cuts as grey, lower shapes clipped to the disc (one draw), each chip a speck touched red, the specks glowing where they landed, and the chip the dive follows a shade lighter. The chips, specks and losses are the flat wafer's, from your chip's size and generation. Seen from 65°, turned like the stack, turnable and swaying. Five draws. Next: step 8, the stack taking the same models and colours.

Reviewer: Claude Fable 5.2, asked by Claude Opus 5.5 with a written brief and 25 screenshots; applied by Claude Opus 5.5.

## Summary

- **Direction:** everything from the board down is drawn on the one stage with the one light and one table of materials, and a level's style is only its camera and its relief: things you could hold are modelled and seen at an angle; plans (chip, block, gate) are low reliefs read almost straight down; four views stay diagrams on purpose (scanner section, car cutaway, bench, supply map).
- **The real break today is not 2D against 3D.** It is that the same thing has different colours in different views (the switch gate is red in `09`, blue in `05`; wires are blue in `08`, copper in `04`), that the flat picture is a 380 px framed card while 3D scenes fill the screen, and that the flat views carry debris (ghost slabs, seven question dots on one part, lines across the picture).
- **First level to build: the switch.** It is the object the whole site is about, every way down passes through it, it needs every material, it is tiny (about 30 meshes), and it is where the present drawings disagree most (`05` and `09` show two different things under one name).
- **Then:** the clean-up of all flat views with no new modelling, the atom, the gate, the chip on the board, the block, the wafer; phone, control unit and the diagram views last.
- **Biggest risk:** every level moved to the stage keeps its canvas drawing as the fallback, so each exists twice. If the two drift, or the fallback is never looked at, the site is worse on exactly the weakest devices.
- **Second risk:** a relief plan that is too timid reads as "the same flat box, tilted". The gate level must be tried at its real camera before the block and chip follow it.

## 1. Verdict per level

Three words are used. **3D**: a model on the shared stage, seen at an angle, that you may turn a little. **2.5D relief**: also on the shared stage, but a plan with low relief, read almost straight down, not turned. **Diagram**: flat canvas, kept on purpose, with outlines.

| Level | Verdict | Size |
| --- | --- | --- |
| Data-centre chip (`chip`) | 2.5D relief, inside the board scene | medium |
| Block | 2.5D relief | medium |
| Gate | 2.5D relief, layers that lift apart | medium |
| Switch | 3D | medium |
| Atom | 3D | small |
| Phone | 3D | large |
| Phone board | 3D (the board scene with other parts) | medium |
| Phone chip (`soc`) | 2.5D relief (the chip relief with other data) | small |
| Car | Diagram: a 2.5D cutaway kept on purpose | small |
| Car controller (`ecu`) | 3D (the board scene with other parts) | medium |
| Car chip (`mcu`) | 2.5D relief (the chip relief with other data) | small |
| Scanner | Diagram: a 2.5D section kept on purpose | medium |
| Wafer | 3D | small |
| Die | 2.5D relief (the chip relief with other data) | small |
| Bench drawings | Diagram kept on purpose | small |
| Supply map | Diagram kept on purpose | small |

### Data-centre chip: 2.5D relief, inside the board scene

A learner must see that a chip is a town of districts: several compute blocks that are alike, memory that looks different, a ring of pads at the edge, and one clock reaching every block. That is a plan, and `06-dive-chip-dark.png` already holds the right content. What is wrong is the step into it: `03-board-3d-dark.png` is a lit model of this very chip with its lid on, and the next picture is a small outlined square on another renderer. So the chip level should be the board scene's last step: the lid lifts (it already does, `board3d.js`), the camera comes over the die and looks down, and the die is a slab whose blocks stand a little proud of it. No orbit: at this level direction means nothing and a tilted floorplan is harder to read than a straight one.

### Block: 2.5D relief

A learner must see three things: logic is rows of small ready-made cells of different widths standing between power rails; memory is a different thing, a regular grid; and your own design is a handful of those cells in one row. `04-chip-3d-wires-dark.png` shows why full 3D is wrong here: drawn true, the copper covers everything below it and the cells cannot be seen. So the block is a plan: cells as low tiles with lit tops, rails as thin copper strips between rows, the memory array as one lower, finer field, and only the few wires that belong to the selected thing drawn. The present drawing (`07`, `21`) has the right parts but the wires run as blue lines across the cells and the card, and the cells are outlined boxes.

### Gate: 2.5D relief, layers that lift apart

A learner must see that two strips of silicon are crossed by two gate strips, that each crossing is one switch (four in all), and that metal above brings power and takes the result out. The whole lesson is which layer lies over which, and that is what a flat layout hides: in `08-dive-gate-dark.png` red over green is only a colour mix. Drawn as a relief with true order (silicon lowest, gate strips over it, contacts as studs, metal on top) and a tilt of 20° from straight down, "crosses over" becomes something you see. One gesture is worth its cost here: the layers lift apart by 8% of the scene and settle back, once, on arrival. It stays a plan, not a turnable model, because the layout is also what the bench and the masks show, and the three must be recognisably the same drawing.

### Switch: 3D

A learner must see that current runs from source to drain through thin sheets of silicon, that the gate wraps all the way round each sheet with a skin of insulator between, and that the gate touches nothing it controls. None of that can be seen in a cross-section: `09-dive-switch-dark.png` shows three green bars across a red bar, and a beginner cannot tell a sheet from a wire or "around" from "behind". `05-chip-3d-switch-dark.png` is a model, but it shows fins with no gate at all, under a label that says "channel sheets" and a sentence that says the gate wraps around sheets. This is the one level where 3D is not a style choice but the explanation: one switch, cut open at the front so the sheets show inside the gate, turnable by about 20° each way.

### Atom: 3D

A learner must see that every silicon atom holds four neighbours in a regular pattern, that one added atom of another kind sits in a place of that pattern, that a few electrons are loose, and that the skin on top is a different, disordered material. The flat lattice in `10-dive-atom-dark.png` appears to give each atom three bonds while its card says four: a flat net cannot show four equal bonds. A small 3D crystal can, and it is the cheapest scene on the site (one instanced sphere, one instanced bond). The danger is clutter, so it is kept small: two cells deep, the back fading into the sky, a slow sway so the pattern is read by movement.

### Phone: 3D

A learner must see that most of a phone is battery and screen, and the computer is one small board. `11-phone-dark.png` already draws it taken apart in layers, which is a 3D idea drawn in 2.5D, and beside the data-centre flight it is the weakest first picture of any way down. It should be a model whose layers come apart along one axis as you arrive. It is last in the order only because it is the most work for a level that already reads.

### Phone board: 3D

A learner must see the same thing as on the data-centre board, smaller: one chip everything else serves, memory stacked on it, power parts, radios. It should be the board scene (`board3d.js`) fed other parts, not a new scene, so that "a board is a board" (`docs/FRAME.md`) is true to the eye.

### Phone chip, car chip, die: 2.5D relief

A learner must see that these are the same kind of thing as the data-centre chip with other districts: a phone's chip has a camera unit and an AI unit beside its cores (`12-phone-chip-dark.png`), a car's chip is small and mostly memory and inputs, a die on the wafer is your chip with its size. One relief, three sets of data. Drawing them alike is itself the lesson.

### Car: diagram, a 2.5D cutaway kept on purpose

A learner must see where the control units sit and that wiring joins them: a car is a network on wheels. A side cutaway shows that at once; a model you fly round hides it behind the body, and a good low-polygon car is costly to draw well ("well designed, or left out"). Keep the cutaway from `solid.js`, in the shared materials. This is the level I am least sure of, because I saw no screenshot of it.

### Car controller: 3D

A learner must see one small chip that decides and large parts that switch real power, in a sealed box (`13-car-controller-dark.png`). It is a board in a case: the board scene again, with a case whose lid lifts as the chip's lid does.

### Scanner: diagram, a 2.5D section kept on purpose

A learner must see one path: light is made, bounces from mirror to mirror, picks up the pattern at the mask and lands on the wafer. The path is a folded line in one plane, and the real machine around it is too complex to model truthfully. A section, with the machine as quiet solids and the beam as the only lit thing, explains it better than 3D. `14-made-scanner-dark.png` has the right idea but loose parts (three unexplained spheres at the top left, a striped box in the middle) and a white outline round the whole machine.

### Wafer: 3D

A learner must see a round disc cut into square chips, wasted pieces at the rim, and specks that land at random and each kill a chip. A disc with instanced dies costs almost nothing, the line already carries modelled wafers (`16`, `24`), and it is the object people know from photographs. Seen from 65° so the grid still reads as a grid.

### Bench drawings: diagram kept on purpose

A learner must learn to read a designer's drawings: a waveform, a gate symbol, a layout, a set of masks. These are a language, and the symbols are the content (`17-bench-gates-dark.png`, `25-bench-layout-light.png`). They stay flat. They take the shared materials (the layout uses the gate level's colours exactly) and lose the text that is too small to read.

### Supply map: diagram kept on purpose

A learner must see how far one chip travels and how few places each step has. A flat map shows the whole trip at once; a globe would hide half of it. `18-supply-map-dark.png` is right in kind but small (about 600 px wide in a 1280 px screen) and carries a grid, a title and a row of step dots that repeat the rail.

## 2. One visual language

### Light

One sun, the same everywhere, as `light()` in `kit3d.js` already sets it: from the left and towards the viewer, about 50° above the horizon (position `(-0.5, 0.9, 0.6) x span`). Every flat view puts its highlight top left and its shadow bottom right, as `WORLD_LOOK` does now.

| | Day | Night |
| --- | --- | --- |
| Sun | `0xfff1dc`, 2.1 | `0xa9bff0`, 0.9 |
| Sky and ground bounce | `0xeaf2ff` / `0x8a8270`, 0.55 | `0x6f86b6` / `0x10141c`, 0.5 |
| Environment | 0.7 | 0.35 |
| Background | `0xdfe8f2` | `0x0b1120` |
| Things that carry energy or a signal | full colour, glow 0.1 | glow 0.35 at rest, 1.0 when live |
| Tone mapping | ACES, exposure 0.92 | the same |

These are the values in the code today; the rule is that no scene sets its own. Day is lit by the sun; night is lit by what is working. That is the only difference between the themes: shapes, cameras and materials do not change.

Shadows are soft and short. Hero objects (switch, phone, control unit, wafer) cast one real shadow onto their own base. Relief plans cast none: a tile's depth comes from its lit top, its darker side and a contact shadow 2 units wide (of the 1000-unit scene) at 25% black by day, 45% by night. Flat views use two offset layers, as `solid.js` does, never a canvas blur.

### Materials

One table, used by every scene, 3D and flat. The 3D values are those already in `chip3d.js` and `kit3d.js`; the flat column is new and belongs in `WORLD_LOOK`.

| Material | Where | 3D day / night | Roughness, metalness | Flat fill day / night |
| --- | --- | --- | --- | --- |
| Silicon | crystal, wafer, sheets, strips, atoms | `0x8d99ab` / `0x46536b` | 0.35, 0.3 | `#8d99ab` / `#46536b` |
| Doped silicon | source, drain, wells, the added atom | silicon mixed 35% towards `warm` (one kind) or `accent` (the other) | 0.35, 0.3 | the same mix |
| Switch gate | the part that controls a switch | `accent`: `0x2f7de1` / `0x5aa9ff` | 0.35, 0.6 | `#2f7de1` / `#5aa9ff` |
| Insulator | the skin, the fill between wires | `glass`, opacity 0.45 as a skin, 0.12 as a volume | 0.08, 0.1 | `#9fc4dc` / `#5aa9e6` at 35% |
| Copper | every wire on a chip | `0xc77b45` both | 0.3, 0.85 | `#b5683a` / `#c77b45` |
| Contact metal | contacts, vias, board traces, pins | `0xe0b070`, `gold` | 0.3, 0.9 | `#d2a744` / `#c9a14a` |
| Bright metal | lids, solder, machine parts | `0xb8c0cc`, `metal` | 0.25, 0.85 | `up` |
| Plastic | packages, cases, racks | `chip`: `0x2a2f38` / `0x1d222a` | 0.72, 0.02 | `mid` |
| Board | every circuit board | `board`: `0x2b5f45` / `0x1f4a37` | 0.6, 0 | the same |
| Live | your wafer, the beam, a signal, electrons | `warm` glowing (electrons: `accent` glowing) | 0.4 | `warm` / `cool` |

Three rules follow, and each changes something drawn today:

- **A thing has one colour everywhere.** Wires are copper in the gate (`08` draws them blue), in the block, in the bench layout and in the stack. The switch gate is blue in the switch (`09` draws it red) and in the gate level. Silicon is blue-grey, never green (`08`, `09`, `22`, `23`).
- **Green and red mean right and wrong, and nothing else.** A late core, a leak and a killed die are red; a passing check is green. No material may be green or red.
- **Selection is never a colour fill.** Blue is a material, so a selected part is shown by a 2 px ring in `hi`, 3 px off the part, and by its label turning on (`.part3.on`).

### Line

Modelled and relief levels have no outlines. Edges come from light: every box has a rounded edge (radius 0.08 per unit in models, as `box()` in `kit3d.js`; 2 units of 1000 in reliefs). Diagrams use three weights and no others: 1 px in `line` for structure, 1.5 px in `hi` for the subject, 2.5 px in `warm` for the live thing. Corners are round joins. No white frame round a whole machine or picture.

### Depth and camera

All cameras use a 30° field of view on the shared stage, and the picture is lifted 14% so the subject sits above the dock (as `chip3d.js` does); on a narrow screen the camera stands back instead.

| Kind | Looks down by | Turned | You may move it |
| --- | --- | --- | --- |
| Places (island, hall, line) | as now | as now | freely, as now |
| Hero objects (board, control unit, phone, switch, wafer at 65°, atom at 17°) | 29° (0.5 rad) | -35° (-0.62 rad), the stack's angle | ±20° round, ±9° up and down |
| Relief plans (chip, soc, mcu, die, block) | 78° | 0°, so the plan's across is the screen's across | pan only |
| Gate | 70° | 0° | pan; the layers lift once |
| Diagrams | flat | — | pan, as now |

Relief heights are at most 3% of the scene's side (30 of 1000 units); the gate's layers stand 1, 2, 3 and 4% high and lift to 8% apart.

### Labels and question marks

- One label everywhere: the HTML `.part3` (12 px mono, panel fill, 7 px stem), over a projected point, in flat views too. The canvas-drawn labels and cards of `world.js` go.
- At most five names at once (three at 390 px), chosen by the story step; the rest appear on tap. A name appears 300 ms after the camera rests and hides while it moves.
- A part's card opens beside the part, on the side with more room, touching its label. No line is drawn from card to part.
- One question mark, the island's (`01`): a 22 px disc, panel fill, 2 px ring in the thread's colour, 14 px above the part's anchor. Marks show only under Ask. More than three on one part become one mark with a count.

### Motion

Only three things move: the camera when you move; the one live thing (electrons, the beam, a signal, your wafer); and feedback to what you did. A move takes 800 ms with the existing `ease()`. Hero objects sway ±3° over 14 s when idle; reliefs and diagrams are still. Live things cross the view in 2 to 4 s and number at most 40. With reduced motion there is no sway, live things hold still in a telling position, and a move is a 200 ms cross-fade.

## 3. Keeping the zoom continuous across a change of style

**One contract makes this cheap.** Every level, however drawn, keeps the 1000 x 1000 plane it has today: a model stands on that plane, a relief lies in it, a diagram is it. Parts, hit shapes, stops and portals (`src/data/weave.js`) stay as they are, a tap is a ray onto the plane fed to the existing hit test, and a label is a plane point projected. The next level is a group placed in the parent's portal square and scaled by `side / 1000`. Only two levels are alive at once; on arrival the child becomes the root, so numbers never get small.

**The portal is the child, small.** There is no window or frame. In the parent, the portal square holds the child's own shape at its lowest detail (for the switch: one gate block across one strip), so the thing you fly into is the thing you arrive at. It is marked, only at rest and only in Look, by four corner brackets (HTML, 12 px arms, 1.5 px, `accent`) after 3 s of stillness. The miniature pictures drawn in the portals today (`07`, `08`) go.

**The camera carries the change of style.** Because style is only camera and relief, a change of style is a change of angle during the dolly, never a cut:

| From, to | What the camera does | What the picture does |
| --- | --- | --- |
| Board (3D) to chip (relief) | rises from 29° to 78° and turns from -35° to 0° while closing in | the lid lifts and fades; the blocks are already on the die |
| Chip to block, block to gate | straight in; 78° to 70° for the gate | child fades in when the portal is 35% of the short side, fully there at 70% |
| Gate (relief) to switch (3D) | comes down from 70° to 29° and turns to -35° | the plan stands up: the gate strip and the silicon under it grow from relief height to true height |
| Switch to atom | straight into a channel sheet; 29° to 17° | the sheet's surface breaks into atoms, front first |
| Any level to a diagram, or the fallback | closes in until the portal square fills the picture | 250 ms cross-fade at that moment, child framed exactly as the square, as today |

After arrival the parent fades out over 600 ms and is removed. Nothing of it stays round the edges (see section 6): the rail says where you are.

## 4. Performance budget and fallback

Targets for a mid-range phone at the existing pixel-ratio cap of 2, to be measured, at 30 frames a second while moving.

| Level | Draw calls | Triangles | Textures | Shadows |
| --- | --- | --- | --- | --- |
| Chip, soc, mcu, die | 40 | 20,000 | none | the board's own, not updated while still |
| Block | 12 (cells, memory bits, rails each one instanced mesh) | 15,000 | none | none; contact strips |
| Gate | 25 | 2,000 | none | none; contact strips |
| Switch | 30 | 6,000 | none | one map, 1024, drawn once |
| Atom | 6 | 25,000 | none | none; depth by fog |
| Wafer | 8 | 10,000 | none | none; one contact disc |
| Phone | 60 | 40,000 | one, 512, for the screen | one map, 1024, drawn once |
| Phone board, control unit | 80 | 50,000 | none | as the board now |
| Scanner, car, bench, supply map | canvas | — | — | redraw under 8 ms; no `shadowBlur` |

Rules that matter more than the numbers:

- **Draw on demand.** A level draws a frame only while the camera moves, a live thing moves or a selection changes. At rest with nothing live it draws nothing. (`chip3d.js` draws every frame today.) This is what keeps software rendering from hanging.
- **Shadow maps are drawn once.** A still scene sets its shadow map not to update. No new level adds a map above 1024; `light()` gives each scene 2048 on a phone today, and four scenes already hold four.
- **No textures for surface detail.** Detail is geometry and instances; a texture is allowed only for a screen or a photograph.
- **The flat lit look loses its blur.** `world.js` draws a 14 px `shadowBlur` under every large shape; `solid.js` notes that blur is slow on phones and uses two offset layers. Use those everywhere.

Fallback, in order:

1. No WebGL: the canvas scene of the level, as today. Every level keeps its canvas scene for this.
2. A software renderer (the renderer's name says SwiftShader, llvmpipe or Software, where the browser tells) starts at pixel ratio 1, no shadows, no live motes.
3. Any device whose middle frame time over a level's first 20 frames is above 40 ms drops to step 2's settings; if still above, that level uses its canvas scene for the rest of the visit.

No such check exists in the code today.

## 5. Build order

**First: the switch (medium).** Why this one:

- It is the subject. "One switch, called a transistor" is the object every other level is built from or looks down into, and all four ways down pass through it.
- It is where the pictures are furthest from the words (`05` against `09`), so the gain in understanding is largest.
- It needs every material in the table (silicon, doped silicon, gate, insulator, contact metal, live electrons), a cut-away, labels, question marks and both kinds of portal (a relief above, a model below). If the language holds here it holds everywhere.
- It is small and cannot be slow: about 30 meshes, so any trouble found is trouble with the language, not with the level.
- One model can then replace three drawings: the dive's switch, the stack's switch row (`chip3d.js`) and the lens over the line (`lens3d.js`).

Its size is medium because it carries the shared pieces with it: the material table in `kit3d.js`, a level on the stage that keeps the plane contract, drawing on demand, the fallback check, and the scene's live states (the leak, and the eight steps of "Build it" as parts shown or hidden).

Then:

| Step | What | Size | Why here |
| --- | --- | --- | --- |
| 2 | Clean-up of every flat view, no new modelling: section 6, the material colours, HTML labels and marks, full-screen picture | medium | the largest gain for the least risk; uses the label and mark rules the switch proved |
| 3 | Atom | small | completes the bottom; cheapest scene; tests switch to atom |
| 4 | Gate | medium | the first relief; tests "the plan stands up"; decides whether relief is strong enough |
| 5 | Chip on the board, then soc, mcu and die as data | medium, then small each | closes the most visible seam (`03` to `06`) |
| 6 | Block | medium | last of the shared four; needs instancing and the wire rule |
| 7 | Wafer | small | |
| 8 | The stack takes the same models and colours; the label under `05` fixed | small | the stack and the dive must not show two switches |
| 9 | Phone board and control unit from the board scene | medium | |
| 10 | Scanner section redrawn; car, bench, supply map in the shared materials; the line at night | medium in all | |
| 11 | Phone | large | |

Step 4 is a gate in both senses: if the relief plan does not read as belonging with the models at its real camera, steps 5 and 6 should be rethought before they are built.

## 6. What to leave out

- **The ghost of the level above, round the picture.** In `06`, `07`, `08`, `21`, `22` it is large empty rounded boxes; in `09`, `10`, `23` it is huge flat slabs of green, red and grey that look like a fault. `docs/FRAME.md` asks for the depth above to stay faintly at the edges; I would drop that and let the move itself and the rail carry it.
- **The framed card round the flat picture** (the square border and inner panel in `06` to `15`). A scene fills the screen in every other view.
- **Question dots while looking.** Seven dots in a row cover the compute blocks in `06`, seven cover the sheets in `09`, six sit on the atoms in `10`: they hide the thing the sentence below is explaining. `docs/SYSTEM.md` already says marks belong to Ask.
- **The line from a card to its part** (the blue diagonal in `06`, `09`, `10`, `11`, `14`, `15`).
- **Labels and cards drawn into the canvas**, and labels that overlap or slide under the card (`08`: "slowest signal" and a cut-off label beneath it; `11`: "main boa" cut by the card).
- **Miniature pictures inside portals** (the tiny striped icon in the sixth row of `07` and in the lower strip of `08`).
- **Contacts as white squares** (`08`), which turn into black squares by day (`22`, `23`). They become studs of contact metal.
- **Green silicon, red gates, blue wires** (`08`, `09`, `22`, `23`).
- **Blue wires across the block** running over cells and under the card (`07`, `21`). Only the selected thing's wires are drawn.
- **Loose parts in the scanner** (`14`): the three spheres at the top left, the striped box in the middle, the white outline round the machine. Each is explained by a part name or goes.
- **At the bench** (`17`, `25`): text inside the drawings too small to read (wave names, mask names), the mask stack running off the right edge, and the result strip drawn in the canvas ("1 of 4 patterns wrong"), which is words and belongs in HTML.
- **On the supply map** (`18`): the grid behind the land, the title drawn in the canvas, and the row of step dots under the map, which repeats the rail.
- **On the line at night** (`16`): the wire-grid floor and the see-through machine shells. By day (`24`) the same machines are solid and read well; night should be the same solids, darker, with the working machine lit.
- **On the board** (`03`): the rows of identical parallel traces, which read as stripes. A few traces that go somewhere, or none.

## Open risks

- **Two drawings per level.** The canvas scene stays as the fallback for every level moved to the stage. They will drift unless the browser test opens both. This is the cost of the whole direction and it does not go away.
- **Nothing here is measured.** The budgets are estimates from counting shapes. The shared stage's memory with one more scene, and frame times under software rendering, need a real phone.
- **Colour meanings still collide in two places.** `warm` is both "one kind of doped silicon" and "live, yours"; `accent` is both the switch gate and the interface's own blue. The table keeps doping pale (35%) and selection as a ring to hold them apart; it may not be enough, and a twelfth palette colour for the gate would be the way out.
- **The relief may be too quiet.** Three per cent of height seen from 78° is little. If it reads as flat, raise the heights before lowering the camera: a tilted plan loses legibility fast.
- **A 3D crystal can confuse.** If the atom level tests worse with beginners than the flat net, keep the flat net but redraw it so four bonds show (a projection along another axis), and say that it is a projection.
- **The stack and the dive overlap more after this.** With a modelled switch and atom, the stack's lower rows and the dive's lower levels show the same objects. Step 8 makes them share models; whether both views should then remain is a question for the owner, not for art direction.
- **Two documents would need to change** if this is taken up: `docs/SYSTEM.md` ("The flat dive stays", the table of six views) and `docs/FRAME.md` ("The depth you came from stays faintly around the edges", "One drawing style").
- **The car and the phone are judged without seeing them** (the car not at all, the phone only in `11`), and nothing was seen at 390 px or in light for most levels.
