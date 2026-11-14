# The in-between moves: from one 3D level to the next with no flat picture between

Written 2026-11-14 by Claude Fable 5.2, asked by Claude Opus 5.5 with a written brief. Nothing was applied: this file is the only change. No code was run in a browser and nothing was measured on a phone or on any GPU; every cost below is counted from the code or is a guess, and guesses are marked.

Read for it: `docs/reviews/art-direction.md` (all), `docs/SYSTEM.md` ("The flat dive, tidied", "The levels in 3D"), `src/v2/level3d.js`, `src/v2/app.js` (`levelZoom`, `ensureL3`, `L3`, `diveNotes`), `src/v2/gate3d.js`, `switch3d.js`, `atom3d.js`, `relief3d.js`, `pcb3d.js`, `phone3d.js`, `wafer3d.js`, `kit3d.js`, `src/app/world.js` (`render`, `box`, `flyTo`, `settle`), `src/app/scenes.js` (the flat switch and atom), `src/engines/weave.js` (`cam`, `frames`), `src/data/weave.js` (`DEPTHS`), `src/app/lens3d.js` (line 199), `scripts/smoke.mjs`.

**State of the code when this was written.** Branch `claude/phone-3d`, last commit `b178803`. Five files had changes not yet committed, made by someone else at the same time: `src/v2/kit3d.js`, `src/v2/level3d.js`, `src/v2/app.js`, `scripts/smoke.mjs` and, appearing while this was being written, `src/app/world.js`. They add the fallback check of the art review's §4 (`QUALITY`, `lowQuality()`, a level's `failed`, `on.failed`, drawing on demand, a "slow device" smoke test) and a `setCovered(on)` on the flat world, which stops the flat canvas drawing while a 3D level covers it whole. This plan was checked against the committed code and read against those changes; where they matter it says so. Line numbers are of the working tree and will move.

## Status

Step 1 applied 2026-11-14 by Claude Opus 5.5, as written: `src/engines/join.js` and `tests/join.test.mjs`; the tests pass.

Step 2 applied the same day: the gate and the switch are joined. `stage()` has `over()` and `veil()`; `level3d.js` has `size`, `fitOf`, `aim`, a `rig`, `show(k, off, frame, link)` and `joinFrame()`, with names, note and marks hidden in a join and a frame count of its own (`JOINS.off`); the gate has its door (from `DEPTHS.gate.portal`), the switch its foot; `levelZoom` pairs them, with the latch, and makes and warms a level's neighbours at rest. The smoke test scrolls half way and back. Seen in SwiftShader at 1280 and 390 px, dark and light: the veil's colour matches the sky. Not yet: the latch is per move, the parent's `leave` is passed but nothing uses it (step 3).

Step 3 applied the same day: the plan stands up. `switch3d.js` gives every box its built form and a flat one, computed from the gate's exported layout (`DIFF`, `GATES`, `H`, `X`, `Z`, `PORTAL`, `DOOR`) through `toChild`, each blended in its own stretch of `arrived` as the table in section 3 says; the source, drain and sheets have materials of their own and warm from the gate's silicon; `view.enter = [0.25, 0.85]`; the electrons come at 0.9; the flat form casts no shadow (the gate's tiles do not). `level3d.js` passes `leave` at rest (0). Seen in SwiftShader at `f` from 0.12 to 0.92, 1280 and 390 px, dark and light. What differs from the plan, each found by looking:

- **The silicon strip is cut in five pieces, not three.** The door is 90 units high and the lower silicon strip 150, so pieces split only at x = 365 and 455 would leave two bands of the strip above and below the door uncovered. The pieces are drawn only in a join; at rest the two strips are whole, so the gate has no seams and no extra draws.
- **The child is drawn only once its own move has begun** (`enter > 0`, `f` 0.25 here), and the parent's door is its own until then. Drawn from 0.12 in front of everything, the switch's flat form showed its front faces over the gate's tiles in front of the door: a dark notch across the strip at the very moment nothing was to change.
- **Then it is hidden by the parent's tiles, not drawn over them, until `leave` reaches `JOIN.clear` (0.7, `f` about 0.36).** Its camera is the parent's in its own units, near and far included (`over(scene, camera, keep)`), so the two depths agree. Drawn in front, its front faces cut a dark gap across the gate strip in front of the door for the first stretch of the stand-up.
- **The silicon and the gate strip in front of the door lower into the ground** with `leave` (gone by 0.65), so the switch's cut face can be seen as it forms and nothing in front of it is left to hide it when it is drawn in front again. The switch is seen standing up in an opening cut in the plan. Not in the plan; it is the plan's own "the switch is cut open at the front", carried to the gate.
- The pieces' rounded ends show the door's outline as thin lines while the switch stands up. Left: they read as the door.

Step 4 applied the same day: the sheet breaks into atoms. The switch has its door (the middle sheet's top front edge on its cut face, its side from `DEPTHS.switch.portal`, `yaw` from the crystal's exported `TURN`); its electrons shrink away by `leave` 0.3. The atom has its foot (through the crystal's turn), `view.enter = [0.2, 0.8]`, the front moving from the cut face to the back with every atom, bond, skin atom and the added atom coming with its row, the electrons at 0.9 and the fog pushed back while it is still part of the sheet. The smoke test scrolls half way and back for this pair too. Seen at `f` from 0.12 to 0.92, 1280 and 390 px, dark and light. What differs from the plan, each found by looking:

- **The piece of sheet is one face, not a block.** Drawn in front of the switch, a block showed its side and top, which in the switch are inside the sheet and under the gate; only the sheet's cut face is seen there. So it is that face, in the sheet's material, going back with the front.
- **The glass is a pane lying on that face, not a slab over it.** The switch's skin stands in front of the sheet's cut face (glass 0.06 deep, 0.73 of the crystal's units), so a face without glass was a darker patch; a pane at the skin's real depth showed its edges at an angle (one side untinted, the other tinted twice). On the face it tints exactly what the switch's skin tints.
- **The front goes 1.25 times as far** as the plan's formula, or the back row of atoms would end at size 0.
- **The parent's depth is kept only for a door with tiles in front of it** (`door.front`, the gate's). Kept here, the switch's sheet would hide its own piece.
- By day the atoms are a little darker than the sheet, as the plan expected; left.

## Summary

- **Today the flat picture is seen for about three quarters of a second in every move**, alone for about 0.12 s. The model also does not follow the flat zoom while the two are mixed (it closes in on its own centre, the flat picture on the portal), so the mix slides.
- **Recommended: one camera path, two models in one frame.** Between two neighbouring 3D levels the parent's scene is drawn, then the child's scene over it with the same camera expressed in the child's units, so the child stands exactly in the parent's portal. No render target, no new scene graph, no change to how a level is built. `src/app/lens3d.js` already draws a second scene over a first this way.
- **The change of style is carried by the models' own parts, driven by the zoom, not the clock**: the switch has a flat form that equals the gate's crossing and grows into the built switch; the crystal starts as a solid piece of the sheet and turns into atoms from the cut face back. Dragging back and forth scrubs it.
- **It fails safe to exactly what exists today.** A pair is joined only if both models are loaded, neither has failed, and the joined frames are fast enough; otherwise the present cross-fade through the flat drawing stays, untouched.
- **Eight small steps**; step 1 is pure arithmetic with unit tests and touches no file anyone is editing now.

## 1. What a visitor sees today at each change of level

### How it works now (checked against the code)

- The zoom is one number `Z` in `src/app/world.js`: `Z = i + f` is level `i` with the camera a fraction `f` of the way into its portal. `cam(i, f)` in `src/engines/weave.js` shrinks the view geometrically: the square in view has side `1000 * r^f`, `r = portal side / 1000`.
- A tap on the way deeper, the dock's button or an arrow key calls `flyTo(d)`: `500 + 1150 * levels` ms, so 1650 ms for one level, with a cubic ease in and out. A wheel or a drag sets `Z` directly (`setZ`) and can stop anywhere, also half way. With reduced motion `flyTo` jumps: `Z = d` at once.
- Every frame `settle()` calls `on.zoom(Z)` when `Z` changed, which is `levelZoom(z)` in `src/v2/app.js`. For each level in `L3` it computes `d = z - index` and a presence `k = 1 - clamp((|d| - 0.08) / 0.32)`: 1 within 0.08 of the level, 0 from 0.4 away. Two neighbouring levels are one apart, so **two models are never present together**.
- `levelZoom` then sets the flat canvas's opacity to `1 - k` (`#diveCanvas`, with a CSS `transition: opacity .25s` on `.c3.dive2`), hides the flat names above `k = 0.5`, and hides the whole GL canvas (`showStage(false)`) when no model is present.
- The GL canvas (`.stage3d`) lies under the flat canvas (`stage()` in `kit3d.js` inserts it as the first child). So "the model fades out" is really the flat canvas fading in over it.
- The model's camera, in `place()` of `level3d.js`: it fits the object's radius `V.r` to the static square of the dive (`dive.frame` = `box()`: `B`, `cx`, `cy`; the object fills `min(1.05 B, 0.74 W)`), then moves in or out by the zoom offset `off`: `dist = fit * (1 + 3 * -off)` above the level, `fit / (1 + 2.5 * off)` below it. It always looks at `V.at`, the model's centre. It does not go towards the portal.
- The flat canvas meanwhile draws level `i` zoomed into its portal and level `i + 1` over the portal with alpha `smooth(0.16, 0.7, f)` (`render()` in `world.js`).
- Only three levels have an arrival of their own (`view.arrive`): the chip (from the flight, 1800 ms), the control unit (1600 ms, its lid lifts) and the phone (2200 ms, it comes apart). All three are tops of a way down, reached from something that is not a 3D level of the dive. An arrival runs by frames after a 250 ms hold and only starts when the level becomes present from above (`off <= 0.05`) and motion is allowed.

### One move, in time (a `flyTo` of one level, 1650 ms)

| `f` | Time | What is on screen |
| --- | --- | --- |
| 0 to 0.08 | 0 to 0.45 s | the parent model alone, coming a little closer to its own centre |
| 0.08 to 0.40 | 0.45 to 0.77 s | the flat drawing fades in over the model. The model has grown 2 times about its centre; the flat drawing has grown 2.6 to 4 times (`1 / r^0.4`) towards the portal. They do not lie on each other |
| 0.40 to 0.60 | 0.77 to 0.88 s | **the flat drawing alone**, the stage hidden: the flat parent with the flat child over its portal |
| 0.60 to 0.92 | 0.88 to 1.20 s | the child model fades in under the flat drawing. It stands at the centre of the square at 0.45 of its size and grows; the flat child stands where the portal is, at `r^0.4` (0.25 to 0.57) of its size |
| 0.92 to 1 | 1.20 to 1.65 s | the child model alone, settling; names come on at `k > 0.85` |

So the flat drawing is visible, in part or whole, from 0.45 s to 1.20 s. With a wheel or a drag a visitor can stop at `f = 0.5` and look at the flat drawing for as long as they like.

### Per pair

| From, to | Today | Kind |
| --- | --- | --- |
| chip, soc, mcu, die to block | relief, flat, relief; both seen from 72° | both 3D |
| block to gate | relief, flat, relief; 72° to 65° is a jump hidden by the flat picture | both 3D |
| gate to switch | relief, flat cross-section, model at 25° turned -18°. The flat switch is an elevation (source left, drain right, sheets stacked up the screen) while the gate is a plan, so the flat in-between is itself a change of view | both 3D |
| switch to atom | model, flat net, crystal at 17° turned -36° | both 3D |
| phone to phone board | teardown, flat, board at 36° | both 3D |
| phone board to soc, control unit to mcu | board, flat, relief at 72° | both 3D |
| wafer to die | disc at 65° turned -36°, flat, relief | both 3D |
| car to control unit | flat cutaway, then the board; its lid lifts (time-driven) | flat to 3D, on purpose |
| scanner to wafer | flat section, then the disc | flat to 3D, on purpose |
| board to chip (data centre) | another view altogether (`#/place/datacentre/…`, the flight) hands to `#/dive/chip`; the chip's `arrive` rises from the flight's angle | not part of this plan |

With reduced motion a `flyTo` jumps, so the stage cuts from one model to the next (no fade at all, since the flat canvas's opacity does not change). If the next model's file is not loaded yet, the flat drawing shows until it is.

## 2. Approaches

Costs are per frame during a move, on top of the two levels' own cost. Level costs counted from the code (not measured):

| Level | Draw calls | Triangles | Note |
| --- | --- | --- | --- |
| gate | 22 | about 5,450 | 18 rounded tiles of 300 triangles (`RoundedBoxGeometry`, 2 segments) and 4 plain boxes; nothing casts a shadow. The review's budget was 2,000 |
| switch | 37, and 37 more in the shadow pass | about 2,750 | 19 boxes and 18 electron spheres, each its own mesh, each casting |
| atom | 6 | about 45,000 | 111 + 1 + 52 spheres of 252 triangles, 172 bonds of 12, the skin's bonds, 10 electrons. The review's budget was 25,000 |
| chip, block | about 10, 7 | not counted | instanced |

Each level's scene has its own sun with a shadow map (`light(scene, P, 16)`: 4096 px when the window is wider than 900 px, else 2048), drawn every frame the scene is drawn, even when nothing in it casts. That is an existing cost; any approach that draws two scenes in one frame draws two shadow passes. With `QUALITY.low` (uncommitted) shadows are off.

### A. Two scenes in one frame, cross-faded

Draw the outgoing scene and the incoming scene in the same frame and blend them by an alpha that follows the zoom.

- Blending two whole lit scenes needs one of them in a texture (that is approach D), or every material made transparent. The second is not possible here without harm: `mat()` in `kit3d.js` caches materials by their settings and scenes share them, so fading one scene's silicon fades every scene's; and transparent boxes sort wrongly.
- A cross-fade of two pictures with two cameras is still two pictures. It hides the flat drawing but it is a dissolve, not a movement; at the mid-point both are half there and neither registers with the other unless the cameras are tied (which is the real work, and is approach B).
- Cost: as D. Risk: reads as a slide change. **Not recommended on its own.**

### B. The parent holds the child (nesting), and hands over

The review's contract (§3): the next level is a group placed in the parent's portal square, scaled by `side / 1000`; only two levels are alive; on arrival the child becomes the root. One camera flies from the parent's pose to the child's.

- Done literally (one scene graph), it means rebuilding `createLevel3D`: a model builds into a scene it owns (`model(scene, root, P, night)`), the atom sets `scene.fog`, each scene has its light and shadow square in its own units. Moving the child from the parent's scene to its own on arrival is where it would break.
- Done as **two scenes and one camera pose** it needs none of that. If the child's world is the parent's world moved to the door, turned and scaled by `1 / s`, and the child's camera is the parent's camera put through the same change, the child's picture is, pixel for pixel, what it would be as a group inside the parent (a perspective picture does not change when the world and the camera are scaled together; the lights are a direction and a sky, which do not move with position). The child is drawn second with the depth cleared, exactly as `src/app/lens3d.js` line 199 draws the lens over the line: `renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = true;`.
- Cost: the two levels' own draws and triangles, summed, for the length of the move, and one flat square of two triangles for the veil (below). Gate and switch: 22 + 4 + 37 + 1 = 64 draws without shadows, about 101 with the switch's shadow pass, about 8,200 triangles. Switch and atom: 37 + 8 + 1 = 46 draws (83 with shadows), about 48,000 triangles. No new texture, no new memory beyond a model that is loaded one level early.
- Risks: the child is always drawn over the parent, so nothing of the parent can stand in front of it (the door must be chosen where nothing does: true for both main pairs; for a chip under its package the package top must leave first). The child has no fade of its own, so it must begin as something that looks like what the parent shows there. A level's own clock-driven arrival must not also run.
- **Recommended, in the two-scene form.**

### C. Morphing geometry from the relief into the model

One mesh set whose shapes go from the relief's to the model's.

- As the whole answer it fails: it only exists for pairs that share parts. The gate and the switch share two (a silicon strip, a gate strip); the switch and the crystal share one surface; a board and a chip relief share nothing.
- As a part of B it is the right tool, and cheap, because every part of the switch is a plain box (`B()` in `switch3d.js` makes a `BoxGeometry` mesh): a morph is a position and a scale blended between two boxes, 19 of them. No new draw call, no vertex work.
- Cost: none to speak of. Risk: the two forms must be kept true to both levels by hand; if the gate's layout changes, the switch's flat form must follow (it should read the gate's numbers, not copy them).
- **Used inside the recommendation for gate to switch and switch to atom only.**

### D. The outgoing level drawn to a texture and dissolved

Render the parent into a `WebGLRenderTarget` once (or each frame), then draw it as a full-screen square that fades while the child draws.

- Works for every pair with no knowledge of either level, and it is the only true cross-fade (so it is also the honest way to do the 200 ms cross-fade for reduced motion).
- Cost: one target the size of the stage with depth. At 1280 x 800 and pixel ratio 2 that is 2560 x 1600: about 16 MB of colour and about as much depth (a guess for the depth format); on a 390 x 844 phone at ratio 2 about 5 MB and 5 MB. Anti-aliasing is lost in the target unless it is multisampled (more memory; not checked whether the vendored three.js build exposes samples the way the current docs describe). Tone mapping and colour space must be handled once, not twice, or the frozen picture changes brightness the moment it is frozen (a known trap; not checked against this three.js build).
- A frozen parent cannot keep zooming, so the move stops being one movement: the parent freezes while the child grows. Re-rendering the parent to the target every frame removes that and brings back all of B's cost plus the target.
- **Not recommended for the dive.** Kept as the second fallback for one case (section 3, "If the child's first frames pop").

### What decides it

B (two scenes, one camera) is the only one in which the thing you fly into is the thing you arrive at, which is the review's own rule ("the portal is the child, small"). It adds no memory, it reuses a pattern the repository already has, and it leaves `createLevel3D`'s contract with its models as it is, with two optional additions. C supplies the two moves the owner named. A and D hide the flat drawing but replace it with a dissolve.

## 3. The recommendation

**A join.** Between two neighbouring levels that are both models on the stage, for `0.08 < f < 0.92`, one frame is drawn like this:

1. the parent's scene, with a camera on the join's path;
2. a veil: one square over the whole picture in the background's colour, with opacity `smooth(0.55, 0.92, f)`, so the parent goes into the sky behind the child (the atom level already says "the back fades into the sky"); at 0.92 the parent is no longer drawn;
3. the depth cleared, then the child's scene with no background of its own, with the same camera expressed in the child's units.

Everything is a function of `f`, so a fly, a drag and a wheel all show the same thing and going up is the same move backwards.

### Words the plan uses

- **Door** (the parent's): where the next level stands in this model, in the model's own units: `{ at: [x, y, z], side, yaw }`. `at` is the middle of the child's square on the parent; `side` is that square's side; `yaw` (optional, radians about y) turns the child's axes onto the parent's. A model may give a function, for a door that moves (the wafer).
- **Foot** (the child's): the point of the child, in its own units, that stands on the door's `at`.
- **Square**: a level's own square in its own units. `place()` makes an object of radius `V.r` fill 1.05 of the square, so `square = 2 * V.r / 1.05` (gate 11.24, switch 7.81, atom 4.76, chip reliefs 10.67).
- **Scale** `s = door.side / square(child)`: parent units per child unit.

### The camera path

In the parent's units, with `fitP` and `fitC` the two rest distances `place()` computes today (`V.r / tan(15°)` times the same screen factor), and `ρ = s * fitC / fitP`:

- distance: `dist(f) = fitP * ρ^f` (geometric, as the flat zoom is);
- look-at: from the parent's `V.at` to the child's `V.at` carried through the door, by `u(f) = (1 - ρ^f) / (1 - ρ)`. This is the same law as `cam()` in `src/engines/weave.js` (`ox = p / (1 - r) * (1 - k)`), so the door behaves as a fixed point of the zoom;
- angles: `tilt` and `turn` go from the parent's to the child's (the child's turn plus the door's `yaw`) by `e = smooth(0.2, 0.9, f)`: the first fifth of the move is straight in, the camera has finished turning before the names come on;
- the picture's centre on screen (`setViewOffset` from `frame.cx`, `frame.cy`) is the same for both and does not change;
- the parent's own turn by a drag (`yaw`) is multiplied by `1 - smooth(0, 0.3, f)`, the sway by zero while `0.08 < f < 0.92`;
- the child's camera: position and look-at put through `toChild`, `turn - yaw`, `dist / s`. Its `near` and `far` must follow: `far = max(200, 3 * dist)`, `near = max(0.1, dist / 200)`. Today `far` is a fixed 200; block to gate at `f = 0.12` puts the child's camera about 460 of its units away (`s` = 0.039), so without this the child is clipped away.

For the two main pairs (computed, not seen):

| `f` | Gate to switch: looks down, turned, child's share of the square | Switch to atom: the same |
| --- | --- | --- |
| 0 | 65°, 0°, 8% | 25°, -18°, 5% |
| 0.12 | 65°, 0°, 11% | 25°, -18°, 7% |
| 0.25 | 64°, 0°, 15% | 25°, -18°, 11% |
| 0.5 | 49°, -7°, 28% | 22°, -21°, 22% |
| 0.75 | 30°, -16°, 53% | 18°, -25°, 47% |
| 0.92 | 25°, -18°, 82% | 17°, -26°, 79% |
| 1 | 25°, -18°, 100% | 17°, -26°, 100% |

The gate's `ρ` is 0.080 where the flat portal's ratio is 0.09, because the gate relief is drawn at 0.89 of its square (its `r` is 5.9 for a plan 10 units wide). It does not matter: the flat picture is not on screen during a join. The switch's `ρ` is 0.050, the flat portal's own.

### Who is in charge during a join

- Below `f = 0.5` the parent leads: its level object ticks, draws the frame, answers `hit()` and `active()`. From 0.5 the child leads. Both draw the same picture with the same function, so nothing changes on screen at 0.5.
- Names, the note and the marks show only outside `0.08 < f < 0.92`, by the rules that exist (`k > 0.85 && arrived >= 1`).
- The child's `arrived` (the fifth argument of `M.update`, today always 1 for these levels) is the join's **enter** value, a function of `f` chosen per pair. The clock-driven arrival (`arr`) is never started for a level that enters by a join.
- The parent gets a new sixth argument, **leave** (0 at rest, 1 when the child has taken over), for its own part of the move: hiding the piece of itself the child replaces, lifting a package top, shrinking its electrons.

### Gate to switch: the plan stands up

**The door** (in `gate3d.js`): the flat portal is `[365, 660, 90]` (`DEPTHS.gate.portal`), the crossing of the left gate strip (`GATES[0]`: x 380 to 440) with the lower silicon strip (`DIFF[1]`: y 630 to 780). Its middle is (410, 705), so `door = { at: [X(410), 0, Z(705)], side: 0.9 }` = `[-0.9, 0, 2.05]`, on the plane the tiles stand on. Nothing lies over it: no stud and no copper is inside that square (checked against `CONTACTS` and `METAL`).

**The foot** (in `switch3d.js`): `[0, 0, -0.6]`, the middle of the base slab's underside. `s = 0.9 / 7.81 = 0.115`, so one unit of the flat plan is 0.0868 of a switch unit and the door's square is 7.81 switch units: x from -3.9 to 3.9, z from -4.5 to 3.3.

The plan's axes already agree with the switch's: the silicon strip runs along x in both (source, channel, drain), the gate strip runs along z in both, up is up. No turn of the child is needed (`yaw` 0).

**What the plan shows in the door's square, in switch units:** silicon over the whole square, 2.6 high (`H.si` 0.3 of the gate's units; the relief is three times true height); on it the gate strip, 5.2 wide (60 of the plan's units) across the middle, running the whole depth, another 2.6 high.

**The switch's two forms.** `stand = smooth(0.25, 0.85, f)` (passed as `arrived`). Each box of the switch has its built shape (as `switch3d.js` makes it now) and a flat shape; position and scale are blended, each part in its own stretch of `stand`:

| Part of the switch | Flat form (`stand` 0): what the gate shows | Built form (`stand` 1) | When |
| --- | --- | --- | --- |
| source, drain | the silicon strip's two ends beside the gate strip: 1.3 wide, at x = ±3.25, y 0 to 2.6, the door's whole depth; plain silicon | 2.2 wide at x = ±3.3, y 0.9 to 3.5, z -1.65 to 0.05; doped | shape 0 to 0.6; colour from silicon to doped 0.3 to 0.8 |
| three channel sheets | the silicon under the gate strip, cut in three slabs lying on each other with no gap: 5.2 wide, each 0.87 high, y 0 to 2.6, whole depth | 4.4 wide, 0.24 thick, at y 1.45, 2.1, 2.75, z -1.15 to 0.05 | 0.2 to 0.8: they thin and part |
| gate: the slab above the top sheet | the whole gate strip: 5.2 wide, y 2.6 to 5.2, whole depth | 1.7 wide (`GX`), 0.55 high above the top sheet, z -1.65 to 0.05 | 0 to 0.6: it narrows and comes down |
| gate: the slab below, the two between, the back wall | nothing: no height, at the strip's underside | as built | 0.3 to 0.9: the gate grows down between the sheets and closes behind them |
| three skins (insulator) | nothing | as built | 0.5 to 0.9, with the gate reaching each sheet |
| two spacers | nothing | as built | 0.4 to 0.8 |
| three contacts | nothing: no height, at their built tops | as built | 0.7 to 1: they come down last |
| the silicon underneath | no height, at y = 0 | 0.9 high | 0 to 0.5: everything rides up on it |
| electrons | hidden | flowing | shown from `stand` 0.9 (and `k > 0.6`, as now) |

In words: the wide blue strip narrows to a gate; the silicon beside it rises and warms into source and drain; the silicon under it thins into three sheets as the gate comes down round them; the front, which reached the edge of the square, draws back to the cut face at z = 0.05 so the sheets show inside the gate. The source and drain need a material of their own for the colour (a `new THREE.MeshStandardMaterial`, as the electrons have), never a change to a cached `mat()`.

**The gate's side** (`leave`): the left gate strip and the lower silicon strip are each built as three tiles, not one: before the door, in the door, after it (the gate strip split at y = 660 and 750, the silicon strip at x = 365 and 455). The two door pieces are hidden while a child is drawn over them; the child's flat form stands exactly where they were, in the same two colours, so nothing is seen to change at `f = 0.12`. Four more draw calls (26). Without the split, the child's gate would narrow over a parent strip of the same blue and the narrowing could not be seen. The lift on arrival (`lift`) must be at rest before a join begins: it already ends by itself after 1.8 s, and a join that starts while it is running sets it to -1.

**The camera** comes down from 65° to 25° (`tilt` 1.13 to 0.44) and turns from 0° to -18° (`turn` 0 to -0.32) while closing in, by the table above. From almost straight above, the first half shows the strip narrowing (a change in plan); as the camera comes down, the second half shows height and the cut face. The review asked for 70° to 29° and -35°; the status section records why the code has 65° and -18°, and this plan follows the code.

### Switch to atom: the sheet breaks into atoms, front first

**Which sheet.** The flat portal is `[475, 520, 50]`: the middle of the three flat sheets (y 520 to 570), at its centre, under the gate. In `switch3d.js` that is `SHEETS[1]`, y 2.1 to 2.34, and the place to enter is its cut face at z = `CUT` = 0.05.

**The door** (in `switch3d.js`): `{ at: [0, 2.34, 0.05], side: 0.39, yaw: 0.17 }`: the top front edge of the middle sheet, in the middle of its length. The side is the flat portal's share of the switch's square (0.05 x 7.81). The yaw undoes the crystal's own turn (`TURN` = -0.17 on its `root`), so the crystal's faces lie along the sheet's.

**The foot** (in `atom3d.js`): `[NX * A / 2, NY * A, NZ * A]` = `[1.5, 2, 2]` in the crystal's own (`root`) coordinates: the top front edge of the crystal, in the middle. `s = 0.39 / 4.76 = 0.082`.

So the crystal, 3 x 2 x 2, is a piece 0.25 long, 0.16 high and 0.16 deep of the sheet, just under the sheet's top face, at the cut face. Its skin (0.22 to 0.84 above the crystal's top) reaches 0.07 above the sheet's top; the switch's own skin box reaches 0.06 above it. They agree, by the numbers as they are; nothing needs moving.

**How the surface becomes the crystal.** `brk = smooth(0.2, 0.8, f)` (passed as `arrived`):

- Two new solids in the crystal's scene, shown only while `brk < 1`: a block the size of the crystal in the sheet's colour (`0x7f93b3` at night, `0xa7b3c4` by day, the switch's `sheetM`), and a slab over it in the skin's glass. At `brk = 0` they are all there is: the child is a piece of smooth sheet with its skin, lying on the sheet and skin it is a piece of. Nothing is seen to change when it comes on.
- A front moves from the cut face (z = `NZ * A`) to the back: `w = smooth(0.1, 0.9, brk)`. Both solids keep their back face and their front face draws back to z = `NZ * A * (1 - w)`.
- In front of that plane the atoms are there. Atom `i` has size `R * smooth(0, 0.25, w - (NZ * A - z_i) / (NZ * A))`: the atoms on the cut face first, row by row to the back. A bond has the smaller size of its two atoms. The skin's atoms and bonds do the same over the slab. This rewrites the instance matrices (112 atoms, 172 bonds, 52 skin atoms and their bonds) each frame of the move; that is small work for the processor (a guess: well under a millisecond).
- The added atom comes with its row. The loose electrons show from `brk = 0.9`.
- By day the atoms (`0x8d99ab`) are a little darker than the sheet (`0xa7b3c4`): the surface is seen to darken as it turns into atoms. Left as it is unless it reads as a fault.
- The fog: `fog.far` gets `(1 - brk) * 50` added, so the crystal's back does not fade to sky while the parent's sheet is still behind it.

Two more draw calls while it moves (8), none at rest.

**The switch's side** (`leave`): its electrons are spheres of radius 0.09, as large as the whole door; they shrink to nothing by `leave = 0.3` and stop. Nothing else: the door is on an open face.

**The camera** goes straight into the face: 25° to 17° (`tilt` 0.44 to 0.30) and -18° to -26° in the switch's frame (`turn` -0.32 to -0.62 + 0.17), which is the atom's own -36° once the crystal's turn is counted.

**What stays untrue.** At `f = 1` the crystal stands in the sky; the sheet it was part of has gone behind the veil. That is the atom level as it is drawn now, and its words say so.

### The other neighbouring levels

All use the same join. What each needs:

| From, to | Door | Camera | The child's entering | The parent's leaving |
| --- | --- | --- | --- | --- |
| chip, soc, mcu, die to block | from `DEPTHS[level].portal` `[px, py, side]`: `at = [X(px + side / 2), 0, Z(py + side / 2)]`, `side / 100`; foot `[0, 0, 0]`. `s` = 0.066 for the chip | 72° to 72°, straight in | rises: `root.scale.y` from 0.02 to 1 by `smooth(0.12, 0.8, f)` | nothing: the block's slab covers the core under it |
| block to gate | `[300, 438, 44]`: the lighter cell in row six (checked: `relief3d.js` puts that cell at x 300, y 438, 44 wide). `s` = 0.039 | 72° to 65° | rises, the same; the gate's own lift still plays once after `f > 0.92` | nothing: the gate has no slab, and the lighter cell under it is its ground |
| phone to phone board | on the phone's small board (`phone3d.js`: a box 3.1 x 2.2 at `(0.1, 0.02, -2.4)` in the middle layer): `at = [0.1, 0.07, -2.4]`, `side` about 3.5 so the child's board is as wide as the parent's. **A guess to be tried at its camera** | 43° turned -24° to 36° turned -36° | none: it is the same thing, larger | the phone's five `board` boxes are hidden while the child is drawn (the child's board is shaped round the battery, the parent's is a rectangle) |
| phone board to soc | `[410, 360, 240]`, on the package (`pcb3d.js` part `soc`); `at.y` = 0.08, the substrate's top. `s` = 0.225 | 36° turned -36° to 72° turned 0°: the review's "rises and turns square while closing in" | rises | the package's plastic top and the memory on it lift by `1.5 * leave` and fade by `leave = 0.5`; they need a material of their own with opacity, as the control unit's lid has |
| control unit to mcu | `[455, 425, 40]`, inside the `mcu` box. `s` = 0.0375 | the same rise and turn | rises | the `mcu` box fades the same way |
| wafer to die | the chip the dive follows: `waferNow().follow` (it changes with your chip's size, so the door is a function) | 65° turned -36° to 72° turned 0° | rises; its test needles (`probes`) from `enter` 0.9 | nothing: the die's slab covers the tile |
| car to control unit, scanner to wafer | not joined: the parent is a diagram kept on purpose | as today | the control unit keeps its clock-driven lid | as today: the flat picture, then the model |

"Rises" is done once in `level3d.js` for every level whose view is `fixed` (the reliefs), not in each model.

**If the child's first frames pop.** A relief child comes on at `f = 0.12` as flat tiles of several tones over one plain tile of the parent, 7 to 11% of the square across. This is a guess: that it reads as something growing, not as something appearing. If it does not, in this order: (1) draw one plain square over the child, in the parent tile's colour, fading from 1 to 0 over `f` 0.12 to 0.4 (one draw, two triangles, a material of its own); (2) only if that fails, draw the child alone into a render target at half size and fade that in (approach D's cost, for the child only, for a third of the move).

### What does not change

- One stage, one renderer, one GL context. No new canvas, no texture, no dependency.
- `createLevel3D(canvas, host, on, model)` and what a model returns; `door`, `foot` and the sixth argument of `update` are additions a model may leave out. A level with no door is not joined.
- The 1000 x 1000 plane, parts, hit shapes, stops and portals in `src/data/weave.js`.
- Labels are HTML; nothing is written into a scene; there are no new words on screen, so `src/i18n/en.json` is not touched.
- `src/app/world.js` is not touched. In the committed code the flat canvas goes on drawing under an opacity of 0 while a model covers it; the uncommitted `setCovered(on)` stops that. During a join the flat canvas is covered whole in the same sense (`top = 1`), so whatever rule the shell ends up using to call `setCovered` at rest should hold for a join too; the zoom still moves, since `settle()` runs from `tick` either way.
- The flat drawing is still what shows with no WebGL, when a level has failed, when a level's file has not arrived, and between a diagram and a model.

### Reduced motion

- `flyTo` jumps, so no in-between frame is ever drawn by a tap or a key: the stage shows the parent, then the child. That is a cut today and stays one in steps 1 to 6. Step 7 makes it the 200 ms the brief allows, as a dip: the GL canvas's opacity goes to 0 in 100 ms, the level changes, and it comes back in 100 ms, over the page's own ground. It is honestly a dip, not a cross-fade; a true cross-fade needs approach D's target and is not worth its memory for this.
- A drag or a wheel still moves `Z` by hand with reduced motion, and so still passes through a join. That is the visitor's own hand, not an animation, so the joined picture is drawn; but the models' own parts of it do not glide: `enter` and `leave` are 0 below `f = 0.5` and 1 from it, and there is no sway. (The camera's angle still follows the hand.)

## 4. Build plan

Each step is one pull request, leaves `npm test` and `npm run test:browser` passing, and leaves the site no worse if the next step never comes. The branch is cut from `main` after the uncommitted fallback check has landed, since steps 2 and on edit the same functions.

### Step 1. The join's arithmetic, as an engine with tests

No visible change. Touches no file that is being edited now.

**New file `src/engines/join.js`** (no DOM, no three.js; points are `[x, y, z]`, angles radians, a level is `{ at, tilt, turn, r }` exactly as a model's `view`):

```js
export const square = r => 2 * r / 1.05;                       // a level's square, in its own units (level3d.js place())
export const scaleOf = (door, child) => door.side / square(child.r);   // parent units per child unit
export const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
// a turn about y, as THREE's rotation.y: x' = x cos a + z sin a, z' = -x sin a + z cos a
export const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
// a point of the child, in the parent's units, and back
export function toParent(p, door, foot, s) { const q = rotY([p[0] - foot[0], p[1] - foot[1], p[2] - foot[2]], door.yaw || 0); return [door.at[0] + s * q[0], door.at[1] + s * q[1], door.at[2] + s * q[2]]; }
export function toChild(p, door, foot, s) { const q = rotY([(p[0] - door.at[0]) / s, (p[1] - door.at[1]) / s, (p[2] - door.at[2]) / s], -(door.yaw || 0)); return [foot[0] + q[0], foot[1] + q[1], foot[2] + q[2]]; }
// the camera at fraction f of the way from parent P to child C, in the parent's units.
// fitP: the parent's rest distance (what place() computes); the child's is fitP * C.r / P.r (same screen)
export function pose(f, P, C, door, foot, fitP, win = [0.2, 0.9]) {
  const s = scaleOf(door, C), rho = s * C.r / P.r, k = Math.pow(rho, f), u = (1 - k) / (1 - rho), e = smooth(win[0], win[1], f);
  const a1 = toParent(C.at, door, foot, s), at = P.at.map((v, i) => v + (a1[i] - v) * u);
  return { at, tilt: P.tilt + (C.tilt - P.tilt) * e, turn: P.turn + (C.turn + (door.yaw || 0) - P.turn) * e, dist: fitP * k, s };
}
// the same camera in the child's units
export const childPose = (p, door, foot) => ({ at: toChild(p.at, door, foot, p.s), tilt: p.tilt, turn: p.turn - (door.yaw || 0), dist: p.dist / p.s });
// where the camera stands (as place() in level3d.js)
export const eye = p => [p.at[0] + Math.sin(p.turn) * Math.cos(p.tilt) * p.dist, p.at[1] + Math.sin(p.tilt) * p.dist, p.at[2] + Math.cos(p.turn) * Math.cos(p.tilt) * p.dist];
// the windows of a join, so the shell, the levels and the tests agree
export const JOIN = { from: 0.08, to: 0.92, child: 0.12, lead: 0.5, veil: [0.55, 0.92] };
```

**New file `tests/join.test.mjs`** (node:test, picked up by `npm test`'s `tests/*.test.mjs`), with the two real pairs as data copied from the models' `view`s (gate `{ at: [0, 0.3, 0.35], tilt: 1.13, turn: 0, r: 5.9 }`, switch `{ at: [0, 2.1, -0.4], tilt: 0.44, turn: -0.32, r: 4.1 }`, atom `{ at: [1.5, 1.24, 1], tilt: 0.3, turn: -0.62, r: 2.5 }`; doors and feet from section 3):

- at `f = 0` `pose` is the parent's rest: `at`, `tilt`, `turn` equal, `dist === fitP`;
- at `f = 1` `childPose(pose(1, …))` is the child's rest: `at` equals `C.at`, `tilt` and `turn` equal `C`'s, `dist` equals `fitP * C.r / P.r`, all within 1e-9;
- `toChild(toParent(p))` returns `p` for a few points, with and without a `yaw`;
- `dist` falls at every step of `f` from 0 to 1 in hundredths; `tilt` stays between the two levels' tilts;
- the numbers this document states: gate to switch `s` = 0.1152 and `ρ` = 0.0801; switch to atom (door side 0.3905) `s` = 0.0820 and `ρ` = 0.0500; each to three figures;
- `eye(childPose(p))` equals `toChild(eye(p))` within 1e-9 for `f` = 0.3 and 0.7 (the two cameras are one camera).

Done when `npm test` passes with the new file.

### Step 2. Two scenes in one frame, for the gate and the switch

The flat picture no longer shows between the gate and the switch. The switch does not yet stand up: it comes on built, small, in the crossing, and the camera carries the move.

- `src/v2/kit3d.js`, `stage()`: two more methods beside `draw`. `over(scene, camera)`: `autoClear = false`, `clearDepth()`, `render`, `autoClear = true` (the lens's lines). `veil(color, alpha)`: draws one square over the picture with a `MeshBasicMaterial` (`transparent`, `depthTest: false`, `depthWrite: false`, `toneMapped: false`) through a camera of its own, with `autoClear` off. To check by screenshot in this step: at alpha 1 the veil must be the background's exact colour (a guess that `toneMapped: false` is enough in this three.js build; if not, clear to the colour with a scissor instead).
- `src/v2/level3d.js`:
  - `place(now)` split in two: the part that computes `fit` from the frame, and a new `aim(p)` that sets the camera from a pose `{ at, tilt, turn, dist }` (position by `eye`, `lookAt`, aspect, `setViewOffset`, `near`, `far`, `st.size`). At rest `place` builds the pose it builds today and calls `aim`.
  - the level object gains `rig: { scene, camera, M, V, root, fit: () => fit }`, `door` and `foot` read from `M.view` (a function is called each frame), and `show(k, off, frame, link)` takes a fourth argument: `null`, `{ guest: level }` (this level is the parent and leads) or `{ host: level }` (this level is the child and leads).
  - `tick`: with a `link` and `JOIN.from < f < JOIN.to` (`f = off` for a parent, `1 + off` for a child) it calls a new `drawJoin(P, C, f, dt)`: `pose` and `childPose` from `src/engines/join.js`; `P.aim`, `P.M.update(dt, 1, dist, 1, picked, leave)`, `st.draw(P.scene, P.camera)` unless `f >= JOIN.to`; `st.veil(background, smooth(...JOIN.veil, f))`; from `f >= JOIN.child`: `C.aim(childPose)`, `C.M.update(dt, 1, dist, enter, null)`, `C.scene.background` set to null for the one `st.over(C.scene, C.camera)` and put back. `leave = smooth(JOIN.child, JOIN.lead, f)`, `enter = smooth(JOIN.child, 0.8, f)` unless the pair says otherwise (step 3). With reduced motion or `QUALITY.low`, `dt` is 0 and `enter`, `leave` are steps at `JOIN.lead`.
  - in `show`: no `arr` is started when there is a `link`; `host.hidden` stays as it is (the leading level's names are hidden by the `k > 0.85 && arrived >= 1` rule, and `arrived` is below 1 in a join).
  - the uncommitted `watch(ms)` must not count a join's frames against a level. The join has its own count: the middle of its first 20 frame times after 4 skipped; above 40 ms it sets an exported `JOINS.off = true` and calls `on.failed`, and every move from then on is today's. `localStorage` `osl-quality = 'keep'` never switches it off, `'slow'` always does, as for levels. The key of the uncommitted draw-on-demand check (`shown`) already holds `off`, so a join draws only when `f` moves.
  - while a joined frame is drawn, `document.documentElement.dataset.join = P.M.level + '>' + C.M.level`; removed when it is not. This is for the tests and is not visible.
- `src/v2/gate3d.js`: `view.door = { at: [X(410), 0, Z(705)], side: 0.9 }`, computed from `DEPTHS.gate.portal` (import it from `src/data/weave.js`), not typed in.
- `src/v2/switch3d.js`: `view.foot = [0, 0, -0.6]`.
- `src/v2/app.js`, `levelZoom(z)`: before the loop, `i = Math.floor(z)`, `f = z - i`, `a = L3[WE.IDS[i]]`, `b = L3[WE.IDS[i + 1]]`. The pair is joined when both have an `obj`, neither `obj.failed`, `a.obj.door` and `b.obj.foot` exist, `JOINS.off` is false, and `JOIN.from < f < JOIN.to`. Then: every other level `show(0)`; below `JOIN.lead` `b.obj.show(0)` and `a.obj.show(1, f, dive.frame, { guest: b.obj })`, from it `a.obj.show(0)` and `b.obj.show(1, f - 1, dive.frame, { host: a.obj })`; `top = 1`. Otherwise the loop as it is.
  - a latch, so a model that arrives half way does not swap the picture: a move that began unjoined (a frame with `f > JOIN.from` drawn the old way) stays unjoined until `Z` is next within 0.08 of a whole number.
  - neighbours ready early: when a level is present with `k = 1`, call `ensureL3` for `WE.IDS[index ± 1]` if they are in `L3`, and `obj.warm()` once each when made (`warm` exists on the level object and is not called for dive levels today), so the shaders are compiled before the move.
- `scripts/smoke.mjs`: the test of section 6, for the gate and the switch.

Done when: on a desktop with a GPU, flying and dragging from the gate to the switch and back never shows the flat picture; the smoke test passes; with `osl-quality = 'slow'` the move is exactly today's.

### Step 3. The plan stands up

- `src/v2/switch3d.js`: `B()` records each mesh's built box; a table of flat forms from section 3, computed from the gate's layout (export `DIFF`, `GATES` and `H` from `gate3d.js`, or move the three to a small shared data file both import) through `toChild`; `update(dt, k, dist, arrived)` blends each part in its own stretch of `arrived`; the source and drain get a material of their own for the colour; `view.enter = [0.25, 0.85]` (the stretch of `f` over which `arrived` runs, read by `drawJoin` in place of its default).
- `src/v2/gate3d.js`: the left gate strip and the lower silicon strip built as three tiles each; `update(dt, k, dist, arrived, picked, leave)` hides the two door tiles while `leave > 0`, and ends a running `lift`.
- `src/v2/level3d.js`: passes `leave` as the sixth argument at rest too (0), and `view.enter` to `drawJoin`.
- Check by screenshots at `f` = 0.12, 0.3, 0.5, 0.7, 0.92, dark and light, 1280 px and 390 px: at 0.12 the picture is the gate's own, unchanged to the eye; at 0.92 it is the switch's.

### Step 4. The sheet breaks into atoms

- `src/v2/switch3d.js`: `view.door = { at: [0, SHEETS[1] + 0.24, CUT], side: 0.05 * 2 * 4.1 / 1.05, yaw: 0.17 }` (the 0.05 from `DEPTHS.switch.portal[2] / 1000`, the yaw from `atom3d.js`'s `TURN`, exported); in `update`, the electrons shrink with `leave` (gone by 0.3).
- `src/v2/atom3d.js`: `view.foot` (the crystal's top front edge, put through `root`'s turn into the scene's coordinates), `view.enter = [0.2, 0.8]`; the two solids; `update` sets the front and rewrites the instance sizes while `arrived < 1`; the fog's `far`.
- Smoke test: the same check for the switch and the atom.

### Step 5. The reliefs: chip, soc, mcu, die to block; block to gate

- `src/v2/relief3d.js`: `view.door` from `DEPTHS[level].portal` for `chip`, `soc`, `mcu`, `die` and `block`; `view.foot = [0, 0, 0]` for all.
- `src/v2/gate3d.js`: `view.foot = [0, 0, 0]`.
- `src/v2/level3d.js`: for a `fixed` child with no `enter` of its own, `root.scale.y = 0.02 + 0.98 * enter` during a join (1 at rest).
- Look at the pop at `f = 0.12` (section 3, "If the child's first frames pop") and apply the cover square only if it is needed.

### Step 6. Boards, the wafer, the phone

- `src/v2/pcb3d.js`: doors for `phoneboard` and `ecu`; the package's top and stacked memory (and the `mcu` box) get materials of their own and lift and fade with `leave`.
- `src/v2/wafer3d.js`: `view.door` as a function of `waferNow().follow`.
- `src/v2/phone3d.js`: `view.door` on the small board; its five `board` boxes hidden with `leave`. `src/v2/pcb3d.js`: `view.foot` for the phone board. These two numbers are the least sure in this plan and are set by eye.
- The die's needles from `enter` 0.9 (`relief3d.js`).

### Step 7. The moves that stay flat, and reduced motion

- `src/v2/app.js`, `levelZoom`: when one call moves `z` by half a level or more (a jump: reduced motion, or a link to another level), the GL canvas gets a class for 200 ms; `src/styles/v2.css`: `.stage3d.swap` runs an opacity dip of 100 ms out and 100 ms in. Not with a join.
- Car to control unit, scanner to wafer: left as they are. One thing could be better and is small: in an unjoined move the model's camera could follow the flat zoom (pass the flat level's real square, from `frames()`, as the frame, in place of the `off` factors in `place()`), so model and drawing lie on each other while they mix. It needs `far` to follow the distance (the car's portal ratio is 0.03, which puts the control unit 8 times its rest distance away at `f = 0.4`, beyond today's `far` of 200). Optional; do it only if the two mixed pictures are seen to slide.

### Step 8. The documents

- `docs/SYSTEM.md`, "The levels in 3D": the sentence "between the two, the flat picture shows for a moment" replaced by what was built; the status section of `docs/reviews/art-direction.md` gets its next part ("Not done: the plan standing up…" and "Not done: the sheet breaking into atoms…" answered), with every difference from this plan recorded as the earlier parts do.

## 5. Risks

- **Two scenes in one frame on a weak phone.** The sum is small in triangles (under 50,000) but it is two shadow passes and, for switch to atom, 83 draws. Not measured. The join's own frame count (step 2) turns joins off for the visit if they are slow; the smoke test's `slow` setting proves that path.
- **The first joined frame compiles shaders.** If the child's shaders are not ready, its first frame can take hundreds of milliseconds, in the middle of a move. Step 2 warms neighbours at rest (`warm()` uses `compileAsync` where the browser has it). On a browser without it the stall happens once per level per visit (a guess).
- **Each level's scene owns a shadow map** (4096 px on a wide window), made when the scene is first drawn. Warming and joining mean the next level's is made one level sooner, not that there are more. The art review's rule ("shadow maps are drawn once", "no map above 1024") is not in the code; this plan does not fix it and leans on it more.
- **The veil's colour.** If the square is not the background's exact colour, the parent fades to a slightly different sky and the picture steps at `f = 0.92` when the parent stops being drawn. Checked by screenshot in step 2.
- **The child is always in front.** Any pair whose parent has something over the door needs that thing moved by `leave` first. Known: the packages on the boards. If one is missed it shows as the child drawn through a lid.
- **Materials are shared.** `mat()` caches by settings across all scenes. Any colour or opacity that changes in a move must be a material of the model's own. A mistake here changes another level's colours, and would be found only by looking at that other level.
- **The two forms of the switch are a second drawing of the gate's crossing.** If they drift from `gate3d.js`, the join pops at `f = 0.12`. They must be computed from the gate's exported layout, and the screenshots of step 3 at `f = 0.12` are the check.
- **The proportions are not the same.** In the plan the gate strip takes two thirds of the door; in the switch the gate is under a fifth of its width. The stand-up shows the strip narrowing by three times. It may read as "the gate shrinks", which is not what happens in a real chip; the truth is that the plan is a diagram. If it misleads, widen the switch's gate in its flat form less (start from 3.4, not 5.2) and accept a small step at `f = 0.12`. A guess either way until seen.
- **Scrubbing by hand.** A visitor can rest at `f = 0.5` between gate and switch and see a half-stood switch with no names. That is honest (it is between two levels) but it is a picture nobody designed as a resting place. If it matters, let the dive settle to the nearer level after 260 ms of rest, as the line already does (`settleLine` in `world.js`); that is a change to the dive's behaviour and the owner's call. **Decided 2026-11-14 by the owner: no settling.** A picture between two levels is part of a modern design experience; the dive stays where the visitor leaves it.
- **Files this plan edits are being edited by someone else now.** Steps 2 and on edit `level3d.js`, `kit3d.js` and `app.js` where the fallback check is landing, and lean on what `world.js` does when covered. Start from the branch that has it, and read `levelZoom` again first: its lines here are of a moving file.
- **Nothing here has been seen.** Every angle and window is computed. The phone's door, the relief children's first frames and the day-time colour step of the crystal are the three most likely to need changing by eye.

## 6. Tests

**Unit (`npm test`).** `tests/join.test.mjs` from step 1: the path's two ends, the round trip through the door, the numbers this document states. It runs with no browser.

**Browser (`scripts/smoke.mjs`, Playwright with SwiftShader).** The existing "motion" page has motion on and uses the software renderer. A new block beside it, with `localStorage` `osl-quality = 'keep'` (so the software renderer is not sent to the flat drawing) and hints off (as the "slow device" block does):

1. open `#/dive/gate`; wait for `#l3-gate` to show its five names (the existing check);
2. wait for the switch's module to have been made: `document.getElementById('l3-switch')` exists (its host is made by `ensureL3`);
3. put the mouse over `#diveCanvas` and `page.mouse.wheel(0, 312)`: `world.js` adds `deltaY * 0.0016`, so `Z` rests at the gate plus 0.5. A wheel is not a fly, so the picture stays there;
4. wait for `document.documentElement.dataset.join === 'gate>switch'`; then: the flat canvas's computed opacity is below 0.05; `.stage3d` is not hidden; no name and no note is showing in `#l3-gate` or `#l3-switch`;
5. a screenshot of the middle 200 x 200 px has more than a handful of different colours (the picture is not empty ground);
6. wheel the same amount again; wait for the rail to say `switch` and `#l3-switch` to show five names; `dataset.join` is gone;
7. wheel back by 624; the gate has its names again.

The same for switch and atom from step 4, and one relief pair (chip to block) from step 5.

**Fail safe, tested.** The existing "slow device" block gains one check: with `osl-quality = 'slow'`, after the same wheel to `f = 0.5`, `dataset.join` is never set and the flat canvas's opacity is above 0.9 (today's picture). A page with WebGL refused (a launch of Chromium with `--disable-gpu` and no SwiftShader flags, or `getContext` stubbed to return null for `webgl` in an init script) opens `#/dive/switch`, wheels to the atom and has no page error: the flat dive alone.

**One stage.** The existing count of WebGL contexts (`window.GL`, at most 1) stays and must still pass: a join makes none.

**By eye, before each merge.** At 1280 px and 390 px, dark and light: a fly and a slow drag down and up through the pair; rest at `f` = 0.12, 0.5 and 0.92. No sideways scrolling. With reduced motion: a key press cuts (or dips, from step 7), a drag shows no gliding parts.

**How it fails safe, in one place.** A join is drawn only if all of these hold, checked every frame in `levelZoom`: both levels have a model made; neither has `failed`; the parent declares a door and the child a foot; joins have not been switched off for slowness; the move did not begin unjoined. If any is false the code that runs is today's, line for line: the flat drawing, the present fades.
