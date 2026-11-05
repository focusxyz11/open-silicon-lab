/* The home hero: every zoom level from the rack to the atom, seen four ways.
   - topics: the topics to explore at this level (ids from topics/).
   - build / break / imagine: one thing to do at this level. ch = [topic id, challenge title] points at a
     challenge in that topic's topic.json; sim = a topic whose simulation to open; topic = a topic to open.
   Texts shown with each (the hook and the "why" lines) are hero.hook.<n> and hero.why.<n>.<lens> in
   src/i18n. tests/hero.test.mjs checks that every challenge and topic named here exists. */
export const HERO = [
  { topics: ['datacenter', 'accelerators'],
    build: { ch: ['build', 'Inference accelerator'] },
    break: { ch: ['reality', 'A fleet you can trust'] },
    imagine: { ch: ['datacenter', 'What does power really cost AI?'] } },
  { topics: ['everywhere', 'datacenter'],
    build: { ch: ['everywhere', 'The right chip for the job'] },
    break: { ch: ['supply', 'What if Taiwan stops?'] },
    imagine: { ch: ['economics', 'Fund a chip startup'] } },
  { topics: ['package', 'yield'],
    build: { ch: ['build', 'Training flagship'] },
    break: { ch: ['bench', 'Design bug or defect?'] },
    imagine: { ch: ['spatial', 'Make the model fit'] } },
  { topics: ['xray', 'litho', 'yield'],
    build: { ch: ['tiny', 'Tape it out for real'] },
    break: { ch: ['bench', 'Let a defect escape'] },
    imagine: { ch: ['beyond', 'Same job, ten machines'] } },
  { topics: ['accelerators', 'architecture'],
    build: { ch: ['riscv', 'Invent an instruction'] },
    break: { ch: ['agent', 'Verify the agent'] },
    imagine: { ch: ['cim', 'Fewest bits that still work'] } },
  { topics: ['layout', 'design'],
    build: { ch: ['tiny', 'Pack it tight'] },
    break: { ch: ['clock', 'Find the speed limit'] },
    imagine: { ch: ['evolve', 'Beat the person'] } },
  { topics: ['tiny', 'clock'],
    build: { ch: ['tiny', "Build the CPU's ALU"] },
    break: { ch: ['tiny', 'Find the bug: full adder'] },
    imagine: { ch: ['evolve', 'NAND only'] } },
  { topics: ['transistor'],
    build: { sim: 'transistor' },
    break: { ch: ['reality', 'Ship a phone chip'] },
    imagine: { topic: 'future' } },
  { topics: ['physics', 'floor'],
    build: { ch: ['physics', 'Grow a perfect crystal'] },
    break: { ch: ['floor', 'Beat the floor by cooling'] },
    imagine: { ch: ['floor', 'Within two million'] } }
];

export const LENS_IDS = ['explore', 'build', 'break', 'imagine'];

/* The compute die at level 4 doubles as the map of the lab: one block per band of the chip stack,
   placed like a floorplan (percent of the die), with a texture that hints at what such a block
   looks like on real silicon. zoom = the zoom level (0-based) that block opens, if it has one. */
export const DIE = [
  { band: 'frontier', x: 4, y: 5.3, w: 45, h: 18, tex: 'rings', c: '#4D3E14', t: '#D9B24E' },
  { band: 'industry', x: 50.5, y: 5.3, w: 45.5, h: 18, tex: 'pads', c: '#33244F', t: '#9A7AE0' },
  { band: 'systems', x: 4, y: 25.3, w: 56, h: 24, tex: 'tensor', c: '#3F2C10', t: '#F0AE44', zoom: 0 },
  { band: 'making', x: 61.5, y: 25.3, w: 34.5, h: 24, tex: 'vstripes', c: '#401E1E', t: '#E07E66', zoom: 2 },
  { band: 'design', x: 4, y: 51.3, w: 56, h: 26, tex: 'logic', c: '#22264A', t: '#8C94EA', zoom: 5 },
  { band: 'processors', x: 61.5, y: 51.3, w: 34.5, h: 26, tex: 'sram', c: '#173B3D', t: '#5FD0CD', zoom: 4 },
  { band: 'atoms', x: 4, y: 79.3, w: 92, h: 15.4, tex: 'dots', c: '#272727', t: '#D9D9D9', zoom: 7 }
];
