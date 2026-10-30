/* Trade-offs: two things you cannot both have. Most of engineering is choosing a point between
   them, and the right point depends on the job. A topic says which trade-offs it shows, and where
   you can move along one yourself, in its topic.json:
     "tradeoffs": [{ "tradeoff": "precision-energy", "how": "4-bit numbers cost far less to move", "try": "#lab-accelerators-3" }]
   "try" is optional: the simulation where you can feel the trade-off. A trade-off must show up in at
   least two topics. Name both sides in plain words: "a" and "b" are what you gain at each end. */
export const TRADEOFFS = [
  { id: 'precision-energy', t: 'Precision or energy', a: 'more exact numbers', b: 'less energy per answer', d: 'Fewer bits, or analog values, cost much less to store, move and multiply, but each answer gets a little less exact.' },
  { id: 'near-big', t: 'Close memory or big memory', a: 'data close by, fast', b: 'room for much more data', d: 'Memory right next to the logic is fast but small; memory that holds a lot sits farther away and is slower to reach.' },
  { id: 'flexible-efficient', t: 'Flexible or efficient', a: 'runs any job', b: 'does one job with far less energy', d: 'A general processor can run anything; hardware built for one job does that job much better and nothing else.' },
  { id: 'speed-power', t: 'Speed or power', a: 'higher clock, more work per second', b: 'less power and heat', d: 'Raising voltage and frequency makes a chip faster, but power grows faster still, and the heat has to go somewhere.' },
  { id: 'safety-cost', t: 'Safety margin or cost', a: 'fails less often', b: 'cheaper and faster', d: 'Margin, extra testing and spare copies make a chip fail less, and every one of them costs area, speed, time or money.' },
  { id: 'big-yield', t: 'One big die or many small ones', a: 'everything on one piece of silicon', b: 'more working chips per wafer', d: 'A bigger die keeps data on one chip but catches more defects; splitting it raises yield but adds links between the pieces.' },
  { id: 'ship-check', t: 'Ship sooner or check more', a: 'reach the market first', b: 'fewer bugs in silicon', d: 'Every extra week of verification finds more bugs, but a chip that ships late can lose its market.' }
];
export const tradeoffById = id => TRADEOFFS.find(t => t.id === id) || null;
