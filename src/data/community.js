/* The community chip: small designs by learners, side by side on one shared chip, as Tiny Tapeout does
   (each design on its own tile, all of them given the chip's inputs, a selector choosing which one
   drives the outputs). From the earlier site's community/ folder.

   To add yours: write it in the design studio (the Design world), then add an entry here in a pull
   request: title, author (a name or a GitHub handle), a one-sentence description, and either "project"
   (a studio job it does, checked against that job) or your own ins and outs. tests/design.test.mjs checks
   every design: it must parse, pass its job's check, and be built into gates and wires. Nothing is
   promised about a real tape-out yet; every design keeps its author's name. */
export const COMMUNITY = [
  { slug: 'parity', title: 'Parity checker', author: 'Open Silicon Lab (example)', description: 'Lights when an odd number of the four switches are on: the check that catches a flipped bit in memory.', ins: ['a', 'b', 'c', 'd'], outs: ['odd'], code: 'odd = a ^ b ^ c ^ d;' }, /* i18n-ok: contributors' own words */
  { slug: 'majority-voter', title: 'Majority voter', author: 'Open Silicon Lab (example)', description: 'Trusts whichever answer at least two of three copies agree on, as spacecraft computers do.', project: 'vote', code: 'y = (a & b) | (b & c) | (a & c);' }, /* i18n-ok: contributors' own words */
  { slug: 'counter-3bit', title: '3-bit counter', author: 'Open Silicon Lab (example)', description: 'Counts from 0 to 7 and round again while enabled, one step per clock tick.', project: 'count', code: 'c1 = q0 & en;\nc2 = q1 & c1;\nreg q0 = q0 ^ en;\nreg q1 = q1 ^ c1;\nreg q2 = q2 ^ c2;' } /* i18n-ok: contributors' own words */
];
