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
  { topics: ['compute', 'architecture'],
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
  { band: 'questions', x: 4, y: 5.3, w: 29, h: 15.8, tex: 'hstripes', c: '#4A2440', t: '#C46CA2' },
  { band: 'future', x: 34.5, y: 5.3, w: 30, h: 15.8, tex: 'rings', c: '#4D3E14', t: '#D9B24E' },
  { band: 'industry', x: 66, y: 5.3, w: 30, h: 15.8, tex: 'pads', c: '#33244F', t: '#9A7AE0' },
  { band: 'next', x: 4, y: 23, w: 56, h: 22.4, tex: 'grid', c: '#16344A', t: '#62C0EA' },
  { band: 'systems', x: 61.5, y: 23, w: 34.5, h: 22.4, tex: 'sram', c: '#1C3E30', t: '#6FD3A2', zoom: 0 },
  { band: 'design', x: 4, y: 47.4, w: 56, h: 26.3, tex: 'logic', c: '#22264A', t: '#8C94EA', zoom: 5 },
  { band: 'ai', x: 61.5, y: 47.4, w: 34.5, h: 26.3, tex: 'tensor', c: '#3F2C10', t: '#F0AE44', zoom: 4 },
  { band: 'mfg', x: 4, y: 75.7, w: 25, h: 19, tex: 'vstripes', c: '#401E1E', t: '#E07E66' },
  { band: 'pkg', x: 30.5, y: 75.7, w: 16, h: 19, tex: 'dots', c: '#30303A', t: '#B4B4C8', zoom: 2 },
  { band: 'cpu', x: 48, y: 75.7, w: 18.5, h: 19, tex: 'sram', c: '#173B3D', t: '#5FD0CD', zoom: 4 },
  { band: 'device', x: 68, y: 75.7, w: 13, h: 19, tex: 'vstripes', c: '#3F3A10', t: '#E6D45A', zoom: 7 },
  { band: 'atoms', x: 82.5, y: 75.7, w: 13.5, h: 19, tex: 'dots', c: '#272727', t: '#D9D9D9', zoom: 8 }
];
