/* The build: one big goal, built by many, people and AI together. Data only; words are in en.json
   (build.need.<id>.*). Contributions are open: add a need, a design or an engine in a pull request,
   or through the forms on GitHub (.github/ISSUE_TEMPLATE/need.yml and design.yml).

   GOAL: what the community is building, a small open computer on a shared chip, around a RISC-V core.
   NEEDS: the pieces it takes, as a tree (parent). Each need says how it can be checked (engine):
     - 'logic': a small circuit the tiny-chip engine can describe, check, build and test (project: its job);
     - 'repeat': many copies of another need, chained (of, n);
     - null: no engine can check it yet. It stays open until someone brings one: that is part of the build.
   DESIGNS: what people (and AI) have proposed for a need. kind says who wrote it: 'person', 'ai', 'both',
     or 'example' (written by the lab to show the way); ai says how AI was used, in the author's words.
     Every design must pass its need's check (tests/design.test.mjs); a design that fails is not merged,
     it is talked through in its issue. Titles, authors and descriptions are the contributors' own words. */
export const GOAL = 'computer';
export const NEEDS = [
  { id: 'computer', parent: null, engine: null },
  { id: 'core', parent: 'computer', engine: null, next: 'riscv' },
  { id: 'alu', parent: 'core', engine: 'repeat', of: 'slice', n: 32 },
  { id: 'slice', parent: 'alu', engine: 'logic', project: 'alu' },
  { id: 'adder2', parent: 'alu', engine: 'logic', project: 'add2' },
  { id: 'full', parent: 'slice', engine: 'logic', project: 'full' },
  { id: 'half', parent: 'full', engine: 'logic', project: 'half' },
  { id: 'regs', parent: 'core', engine: null },
  { id: 'decode', parent: 'core', engine: null },
  { id: 'timer', parent: 'computer', engine: 'logic', project: 'count' },
  { id: 'display', parent: 'computer', engine: 'logic', project: 'seg' },
  { id: 'safety', parent: 'computer', engine: 'logic', project: 'vote' },
  { id: 'check', parent: 'computer', engine: 'logic', project: 'parity' },
  { id: 'serial', parent: 'computer', engine: null }
];
export const DESIGNS = [
  { need: 'check', slug: 'parity', title: 'Parity checker', author: 'Open Silicon Lab', kind: 'example', ai: '', description: 'Lights when an odd number of the four switches are on: the check that catches a flipped bit in memory.', code: 'odd = a ^ b ^ c ^ d;' }, /* i18n-ok: contributors' own words */
  { need: 'safety', slug: 'majority-voter', title: 'Majority voter', author: 'Open Silicon Lab', kind: 'example', ai: '', description: 'Trusts whichever answer at least two of three copies agree on, as spacecraft computers do.', code: 'y = (a & b) | (b & c) | (a & c);' }, /* i18n-ok: contributors' own words */
  { need: 'timer', slug: 'counter-3bit', title: '3-bit counter', author: 'Open Silicon Lab', kind: 'example', ai: '', description: 'Counts from 0 to 7 and round again while enabled, one step per clock tick.', code: 'c1 = q0 & en;\nc2 = q1 & c1;\nreg q0 = q0 ^ en;\nreg q1 = q1 ^ c1;\nreg q2 = q2 ^ c2;' } /* i18n-ok: contributors' own words */
];
/* Proposals of the kind AI assistants make, written for this lab: a description and a confident claim
   (words: build.agent.<project>). Some are right, some are subtly wrong; the check decides, not the claim. */
export const AGENT = {
  half: 'sum = a ^ b;\ncarry = a & b;',
  vote: 'y = (a & b) | (a & c);',
  full: 'sum = a ^ b ^ cin;\ncout = (a & b) | (a & cin) | (b & cin);',
  add2: 's0 = a0 ^ b0;\nc0 = a0 & b0;\ns1 = a1 ^ b1 ^ c0;\ns2 = a1 & b1;',
  seg: 'a = ~(~x2 & ~x1 & x0) & ~(x2 & ~x1 & ~x0);\nb = ~(x2 & ~x1 & x0) & ~(x2 & x1 & ~x0);\nc = ~(~x2 & x1 & ~x0);\nd = ~(~x2 & ~x1 & x0) & ~(x2 & ~x1 & ~x0) & ~(x2 & x1 & x0);\ne = ~x0 & (~x2 | x1);\nf = (~x1 & ~x0) | (x2 & ~x1) | (x2 & ~x0);\ng = x2 ^ x1;',
  alu: 'bb = b ^ sub;\ns = a ^ bb ^ cin;\ncout = (a & b) | (cin & (a ^ b));\ny = (~op1 & ~op0 & (a & b)) | (~op1 & op0 & (a | b)) | (op1 & ~op0 & (a ^ b)) | (op1 & op0 & s);',
  count: 'reg q0 = q0 ^ en;\nreg q1 = q1 ^ (q0 & en);\nreg q2 = q2 ^ (q1 & q0);',
  parity: 'odd = a ^ b ^ c ^ d;',
  free: 'y = a & b;\nz = c | d;'
};
