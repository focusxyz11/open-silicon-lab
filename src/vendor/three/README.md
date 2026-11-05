# three.js, vendored

[three.js](https://threejs.org) r160 (npm `three@0.160.0`), MIT licence (`LICENSE`). Only the topic
`topics/factory` uses it, and it loads only when that topic opens.

| File | From the package | Changed |
| --- | --- | --- |
| `three.module.min.js` | `build/three.module.min.js` | no |
| `OrbitControls.js` | `examples/jsm/controls/OrbitControls.js` | `from 'three'` → `from './three.module.min.js'` |
| `RoomEnvironment.js` | `examples/jsm/environments/RoomEnvironment.js` | `from 'three'` → `from './three.module.min.js'` |

The relative imports let the same files work in the browser (no import map entry for `three`) and in
the single-file build (esbuild follows them). To update, copy the same three files from a newer
release, repeat the one-line change, and check the topic at phone width and in dark mode.
