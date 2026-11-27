# The drawing and the line: the studio and the fab

A guiding prototype by Claude Fable 5.2 (27 November 2026), designed for the design studio and the fab. It is a guide, not a polished build. It runs on the lab's carry (`path.js`, with `litho.js`, `fabline.js` and `chip.js` behind it) and the architecture engine's genes. Its heat, placer, timing on the layout, coverage map and cell layout are stand-ins, each marked on the picture.

- **The studio is the dive as designed:** one die in dashed blueprint outline, with no room and no figures. It zooms die → a core → your block (four of its 32 slices, placed) → cells → one cell. The chip level holds Arrange (the recipe's `shape` and `where` genes) and the floorplan under heat. The block level holds a placer you watch settle against your own hand, the longest path lit on the wires, and a coverage map with a planted bug. The masks leave on a road to Print, with a side road to a shared shuttle (Tiny Tapeout).
- **The fab is the same die as made so far,** station by station: each station's wafer shows your design in its state after that step, down to one switch in a cut-through. The line's care changes spread at the switch, and yield and cost at the chip.
- **The stack is the rail at the left:** the seven rungs, with the ones this face holds lit.

**What the owner decided (27 November 2026):** the fab stays the 3D line (`src/app/journey3d.js`). This prototype's flat plan of stations is a design guide, not a second view of the line. Its station frames go inside the 3D stations, and *along keeps your depth* applies there: → at a station's switch moves to the next station's switch. The studio's drafted die is taken as drawn. Everything shares one record of your chip (`docs/CHIP.md`).

Open `index.html`. To rebuild, run from the repository's root: `npm install --no-save esbuild && node docs/prototypes/studio-fab/build.mjs --min`. Checked at 1280, 1920 and 390, dark and light. Known faults: the opening view is sparse at 1280, the zoomed station frames overlap, and the phone title wraps.
