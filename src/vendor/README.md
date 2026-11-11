# Vendored code

- `three.min.js`: [three.js](https://threejs.org) r187, MIT licence, with `mergeGeometries` from its
  `BufferGeometryUtils`, bundled and minified with esbuild into one ES module. Used only by the journey's
  3D view (`src/app/journey3d.js`), loaded when the journey is first opened. To update: `npm pack three`,
  then bundle an entry that re-exports `three.module.js` and `mergeGeometries` (see the commit that added it).
