/* The island's plan, as plain data (no words, no three.js): where every place stands, its coast and its loop road
   (points a smooth closed curve runs through), and the turn the camera looks at it from. The island draws it in 3D
   (src/v2/map3d.js); the first page draws the same plan flat (src/v2/holdisle.js), so going from one into the other
   is one move of one camera. 1 = 10 metres; x east, z south. */
/* the island (src/v2/map3d.js): where every place stands, and how close the camera comes */
export const PLACES = [
  { id: 'studio', at: [-48, -30], d: 76, r: 26 }, { id: 'quarry', at: [-62, -4], d: 56 }, { id: 'fab', at: [-8, -16], d: 72 },
  { id: 'test', at: [22, -2], d: 54 }, { id: 'port', at: [62, 6], d: 66 }, { id: 'datacentre', at: [36, -36], d: 64 },
  { id: 'lab', at: [6, 26], d: 62 }, { id: 'village', at: [-34, 24], d: 60 },
  { id: 'phones', at: [-62, -196], d: 110, far: true }, { id: 'cars', at: [228, -40], d: 110, far: true }, { id: 'idea', at: [180, -116], d: 90, far: true },
  { id: 'tools', at: [-160, -138], d: 100, far: true }, { id: 'materials', at: [-232, -46], d: 100, far: true }, { id: 'power', at: [92, -178], d: 100, far: true }
];

export const ISLE_COAST = [[-82, -16], [-66, -46], [-34, -56], [2, -54], [40, -56], [72, -38], [82, -6], [78, 22], [54, 44], [16, 48], [-24, 48], [-60, 40], [-82, 14]];
export const ISLE_ROAD = [[-28, -14], [-12, 0], [-3, 9], [6, 15], [16, 13], [28, 10], [46, 12], [53, -6], [44, -20], [24, -22], [12, -32], [-8, -38], [-26, -38], [-29, -26]];
export const ISLE_YAW = -0.42;
/* a point of the island as the camera sees it from straight above: [right, down], in the island's units (10 m) */
export const isleFlat = ([x, z], yaw = ISLE_YAW) => [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
