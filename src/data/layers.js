/* The shared layers of the lab (docs/framework/shared.md): what every experiment names, so that experiments meet.
   Data only; words are layer.<kind>.<id> in src/i18n/en.json (a direction that is one of the ways to compute in
   src/data/ways.js keeps that way's words, way.<id>.*, and has none of its own).

   - LENSES: ways of seeing. state: exists (drawn on the site), partly, new. home: the world it is at home in.
   - ENGINES: tested models, the truth layer. state: exists, partly (its maths lives inside another engine),
     missing (not written: an experiment that needs it is wanted). files: where it lives.
   - MEASURES: what a chip costs and gives.
   - GIVENS: what today's chips take for granted. DIRECTIONS: bets that each drop one or more givens, with the
     measure they would gain and how far they have come (stage 0 an idea … 4 in wide use, as in src/data/ways.js). */
export const LENSES = [
  {"id":"dive","home":"think","state":"exists"},
  {"id":"forms","home":"idea","state":"partly"},
  {"id":"line","home":"make","state":"exists"},
  {"id":"copies","home":"fail","state":"partly"},
  {"id":"plan","home":"divide","state":"partly"},
  {"id":"map","home":"open","state":"exists"},
  {"id":"clock","home":"scale","state":"new"},
  {"id":"walls","home":"limit","state":"new"},
  {"id":"side","home":"strange","state":"new"},
  {"id":"swarm","home":"life","state":"partly"},
  {"id":"probe","home":"know","state":"partly"}];
export const ENGINES = [
  {"id":"logic","state":"exists","files":["src/engines/tinychip.js","src/engines/design.js"],"gives":["sure","area","work"]},
  {"id":"core","state":"exists","files":["src/engines/core.js","src/engines/riscv.js","src/engines/alu.js"],"gives":["sure","work"]},
  {"id":"timing","state":"exists","files":["src/engines/chip.js"],"gives":["work","energy","area"]},
  {"id":"stress","state":"exists","files":["src/engines/life.js"],"gives":["life","yield","sure"]},
  {"id":"floor","state":"exists","files":["src/engines/floor.js"],"gives":["energy","work"]},
  {"id":"factory","state":"exists","files":["src/engines/fab.js"],"gives":["time","cost"]},
  {"id":"supply","state":"exists","files":["src/engines/supply.js","src/data/world.js"],"gives":["reach","time"]},
  {"id":"record","state":"exists","files":["src/engines/ledger.js","src/engines/build.js"],"gives":["sure","reach"]},
  {"id":"money","state":"partly","files":["src/engines/chip.js"],"gives":["yield","cost","reach"]},
  {"id":"work","state":"partly","files":["src/engines/chip.js","src/engines/xray.js"],"gives":["work","energy","area"]},
  {"id":"scaling","state":"partly","files":["src/engines/chip.js"],"gives":["area","work","energy","cost"]},
  {"id":"process","state":"missing","files":[],"gives":["yield","time","cost"]},
  {"id":"substrate","state":"missing","files":[],"gives":["energy","work","sure"]},
  {"id":"tune","state":"missing","files":[],"gives":["yield","time"]},
  {"id":"swarm","state":"missing","files":[],"gives":["energy","life","work"]}];
export const MEASURES = ["work","energy","area","cost","time","yield","life","sure","reach"];
export const GIVENS = ["silicon","switch","exact","clocked","program","apart","flat","onepiece","masks","giant","closed","erasing","frozen","tried","hands"];
export const DIRECTIONS = [
  {"id":"reversible","drops":["erasing"],"gains":"energy","stage":1},
  {"id":"quantum","drops":["exact","erasing"],"gains":"work","stage":2},
  {"id":"photonic","drops":["switch"],"gains":"energy","stage":3},
  {"id":"neuro","drops":["clocked","program","apart"],"gains":"energy","stage":3},
  {"id":"cim","drops":["apart"],"gains":"energy","stage":3},
  {"id":"analog","drops":["exact"],"gains":"work","stage":3},
  {"id":"approx","drops":["exact"],"gains":"energy","stage":4},
  {"id":"pbits","drops":["exact"],"gains":"work","stage":2},
  {"id":"super","drops":["silicon","switch"],"gains":"energy","stage":1},
  {"id":"spatial","drops":["program","onepiece"],"gains":"work","stage":4},
  {"id":"chiplets","drops":["onepiece"],"gains":"yield","stage":4},
  {"id":"stack","drops":["flat"],"gains":"area","stage":3},
  {"id":"thin","drops":["silicon"],"gains":"area","stage":1},
  {"id":"nanotube","drops":["silicon"],"gains":"energy","stage":2},
  {"id":"light-links","drops":["switch"],"gains":"energy","stage":3},
  {"id":"imprint","drops":["masks"],"gains":"cost","stage":2},
  {"id":"beam","drops":["masks"],"gains":"reach","stage":3},
  {"id":"self","drops":["masks"],"gains":"cost","stage":1},
  {"id":"atoms","drops":["masks"],"gains":"area","stage":1},
  {"id":"smallfab","drops":["giant"],"gains":"reach","stage":2},
  {"id":"openkit","drops":["closed"],"gains":"reach","stage":3},
  {"id":"shuttle","drops":["closed"],"gains":"cost","stage":4},
  {"id":"riscv","drops":["closed"],"gains":"reach","stage":4},
  {"id":"aidesign","drops":["closed","hands"],"gains":"time","stage":3},
  {"id":"proof","drops":["tried"],"gains":"sure","stage":3},
  {"id":"selfcheck","drops":["frozen"],"gains":"life","stage":4},
  {"id":"rewire","drops":["frozen"],"gains":"work","stage":3},
  {"id":"events","drops":["clocked"],"gains":"energy","stage":3},
  {"id":"remember","drops":["apart","switch"],"gains":"energy","stage":2},
  {"id":"dna","drops":["silicon","switch"],"gains":"area","stage":1},
  {"id":"living","drops":["silicon","program"],"gains":"energy","stage":2},
  {"id":"fabai","drops":["hands"],"gains":"yield","stage":3}];
export const engineOf = id => ENGINES.find(e => e.id === id) || null;
export const directionOf = id => DIRECTIONS.find(d => d.id === id) || null;
