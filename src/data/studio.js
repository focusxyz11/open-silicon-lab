/* The design studio's one plan (#267): its ground floor seen from outside on the island (src/v2/map3d.js) is drawn from
   these numbers, as the die is drawn from src/data/die.js (the room walked inside retired for the die as designed, #506). Metres, in
   the studio's own place on the island (its origin is the place's point, x east, z south, the camera looking from the
   south-west).

   The corners are the design's steps (the depths of the design world, src/data/weave.js), in order, in one row along
   the room from west to east, with the walk (the aisle) along the glass front. The last is not in the room: it is the
   mask house's loading bay, beside the road to the factory, where a finished design leaves as masks. Each corner has
   one screen (or a wall, or a table that is a screen) where its work is shown; arriving at a step, the camera settles
   on it and the step's bench takes over there. Words: depth.<id>.name for a corner, part.studio.<screen> for its
   screen (VIEW_PARTS.studio in src/data/atlas.js). Tests in tests/studio.test.mjs. */

/* the ground floor: its floor, from wall to wall, and how high it is */
export const FLOOR = { x0: -14.9, x1: 6.85, z0: -6.35, z1: 4.4, h: 3.6 };
/* the walk: along the glass front, at this z, and the eye of someone standing in it, a little raised */
export const AISLE = { z: 2.5, eye: 2.3 };
/* the mask house: its middle, its size, and the bay door on its east side, facing the road */
export const HOUSE = { at: [13, 3], w: 8, d: 7, h: 4 };
/* each corner: where its furniture stands (at, its middle), the screen the bench opens on (sat: its middle, from the
   corner's middle; w × h its size; up: a table, facing the sky, else facing south, towards the walk) and the name of
   that screen in the atlas */
export const CORNERS = [
  { id: 'need', at: [-12.4, -2.6], screen: { part: 'notes', at: [0, 1.7, -2.54], w: 4, h: 2 } },
  { id: 'logic', at: [-8, -2.4], screen: { part: 'code', at: [-0.9, 1.2, 0.637], w: 0.9, h: 0.52 } },
  { id: 'check', at: [-3.6, -2.4], screen: { part: 'results', at: [0, 1.6, -2.56], w: 2.86, h: 1.3 } },
  { id: 'gates', at: [0.8, -2.4], screen: { part: 'gates', at: [0.9, 1.2, -0.663], w: 0.9, h: 0.52 } },
  { id: 'layout', at: [4.8, -2], screen: { part: 'screentable', at: [0, 0.87, 0], w: 3, h: 1.6, up: true } },
  { id: 'masks', at: [HOUSE.at[0] + 0.6, HOUSE.at[1]], house: true, screen: { part: 'lighttable', at: [0, 0.92, 0], w: 1.6, h: 1, up: true } }
];
export const cornerOf = id => CORNERS.find(c => c.id === id) || null;
/* a corner's screen, in the studio's coordinates: its middle, and the way it faces */
export const screenAt = c => ({ x: c.at[0] + c.screen.at[0], y: c.screen.at[1], z: c.at[1] + c.screen.at[2], n: c.screen.up ? [0, 1, 0] : [0, 0, 1], w: c.screen.w, h: c.screen.h });
