# Interaction: one world, one camera, one card

What the lab feels like to move through, and the rules every view keeps. Written in November 2026 after the owner's
review: going into a building meant pressing a button in a window, and coming back dropped you on the island with
a jump; the factory was far behind the rest; the first page should already be a rich, playable surface; and nothing
should look like a cartoon. Consistency comes before any single feature.

## What we take from games and from zooming interfaces

- **Zoom is the way in and out.** Zooming interfaces put everything in one space and let you zoom in to see detail
  and out to see context, instead of opening and closing windows; the move between levels is continuous and
  animated so you never lose your place (Raskin's ZUI; Bederson and Hollan's Pad++ and its *semantic zoom*, where a
  thing is drawn differently at each scale). City builders work the same way: you never "open" a building, you
  come closer and it shows more.
- **The world carries the interface.** Diegetic and spatial interface (labels on parts, lights on machines, a
  status you can see from far away) instead of panels over the picture; a small heads-up layer that appears when
  something changes and fades when idle. Factory games let you point at any machine and see what it is doing and
  what is holding it back, in place.
- **One inspector.** Whatever you select (a place, a machine, a part, a person's design) is described by the same
  card, in the same spot, with the same three faces: Look, Do, Ask.

## The rules

1. **Tap selects; the camera frames what you selected; the card describes it.** Nothing else happens on a tap.
2. **In and out are zoom.** Scroll, pinch, double-tap, or ↓ ↑. Zooming into a selected building opens it where it
   stands: the roof lifts away and the near walls fade, and what is inside is there, in the same scene. Zooming
   into a selected machine goes closer still, into the machine. Zooming out reverses the same path: the walls come
   back and the roof closes as you pull away. There is no "Go inside" button; the card only reminds you how
   ("zoom in to go inside"), with a small ↓ for keyboards and for anyone who prefers to press.
3. **No cuts.** A level that is not yet built into the island's scene is entered by the camera diving into the
   place first, and left by starting close to the place and pulling back. Each new level is built into the scene
   it belongs to, one at a time; the factory is first.
4. **The address always says where you are**: `#/place/fab` is the factory, open; `#/place/fab/etch` is its etch
   tool, selected; `#/line/etch` is inside the etch tool.
5. **Words are on things.** Inside an open building, every machine has its name over it, in HTML over the scene
   (never drawn into it). The card holds the sentence and the questions, never the navigation.
6. **Grown up, not a toy.** Muted materials (white enclosures, steel, glass, epoxy floors), light that tells you
   something (the yellow light of the lithography bay, the glow of a plasma), motion that is the process itself
   (carriers riding the overhead rail, a platen turning), and colour only where it carries meaning.

## Places and the eleven worlds

Every question asked at a place belongs to one of the eleven core questions already (its thread is the world:
`stop.<world>.<depth>`). So a place leads into a world only through the questions it already holds, never through
a link drawn for the purpose: a part's card ends with the worlds its questions belong to (with the world's way of
seeing, and "try it" where that is live), and each world's page says where you meet it on the island, every part
or level whose question belongs to it, as an address to fly to.

## The plan

1. **The factory, opened in place** (this change): the fab's shell lifts away as you come close; inside, six tools
   in their bays along an aisle, carriers moving on the overhead rail between them, each tool selectable, named,
   and described in the card with its questions and challenges; zooming into a tool goes into the line at that
   step. The card loses its "Go inside" button everywhere; zoom does it.
2. The design studio and the test house opened the same way (done: the studio's upper floor lifts away from a
   ground floor where the job is written, described, checked, turned into gates and laid out, with the mask house as
   its last part; the test house shows its probers, the needles and the wafer map; the port's packing hall on the
   quay shows the saw, the bonder, the lid press, the last test and the packed boxes; the data centre's nearer hall
   shows its rows of racks and a server pulled out onto a cart, and `#/place/datacentre` is now the place on the
   island, like every other, while its flight is entered at a level, `#/place/datacentre/2`).
3. The hand-off from a part into the view inside made one move (first pass done: the camera dives at the part, and
   the view inside opens from that point on the screen, as through a portal; going out, it closes back into the
   place). The line now starts high above the machine the camera dived at and comes down to it, so the dive
   continues instead of starting again. The factory's bays hold the line's own machines (machineModel in
   src/app/journey3d.js), so the machine you dive into is the one you were looking at; the test house holds the
   line's prober station and the port's hall its packaging station, their parts picked by the station's own named
   boxes; and the machines work while you watch (plasma, beams, sprays, the polisher's head, the prober stepping
   and its wafer map filling; the robots hand a wafer from port to airlock to chamber and back, on each machine's own
   round). The studio and the data centre, which have no machine in the line to borrow, are furnished in the same
   grown-up way: people at desks with two screens each, showing the work in shapes (code, waveforms, gates, the
   layout's two metals; never words, which are HTML over the scene); racks whose fronts are their servers, lights
   blinking, a cold aisle closed in glass, cable trays and cooling units; a server pulled out with its board, chip,
   memory and heat sink.
4. The first page as a surface to play (first pass done): the questions and challenges stay, folding into a
   button in the corner while you explore and opening again from it; a place pointed at says in one line what it is;
   a minimap keeps the whole island in view, with what the camera sees, and takes you anywhere on it.
