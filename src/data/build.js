/* The build: one big goal, built by many, people and AI together. Data only; words are in src/i18n/en/
   (build.need.<id>.*). Contributions are open: a need or an engine in a pull request or through the forms on GitHub
   (.github/ISSUE_TEMPLATE/need.yml), a design as an entry of the ledger.

   GOAL: what the community is building, a small open computer on a shared chip, around a RISC-V core.
   NEEDS: the pieces it takes, as a tree (parent). Each need says how it can be checked (engine):
     - 'logic': a small circuit the tiny-chip engine can describe, check, build and test (project: its job);
     - 'repeat': many copies of another need, chained (of, n);
     - 'riscv': a RISC-V core that must run the test programs, its ALU made of a slice design (src/engines/core.js);
     - null: no engine can check it yet. It stays open until someone brings one: that is part of the build.
   The designs people (and AI) have proposed are not here: they are entries of the ledger (community/ledger/,
     one file each, replayed by src/engines/ledger.js), with the breaks and the questions. One home for every thing. */
export const GOAL = 'computer';
export const NEEDS = [
  { id: 'computer', parent: null, engine: null },
  { id: 'core', parent: 'computer', engine: 'riscv', project: 'core' },
  { id: 'alu', parent: 'core', engine: 'repeat', of: 'slice', n: 32 },
  { id: 'slice', parent: 'alu', engine: 'logic', project: 'alu' },
  { id: 'adder2', parent: 'alu', engine: 'logic', project: 'add2' },
  { id: 'full', parent: 'slice', engine: 'logic', project: 'full' },
  { id: 'half', parent: 'full', engine: 'logic', project: 'half' },
  { id: 'regs', parent: 'core', engine: null },
  { id: 'bits', parent: 'regs', engine: 'repeat', of: 'regbit', n: 1024 },
  { id: 'regbit', parent: 'bits', engine: 'logic', project: 'regbit' },
  { id: 'select', parent: 'regs', engine: 'logic', project: 'select' },
  { id: 'decode', parent: 'core', engine: null },
  { id: 'timer', parent: 'computer', engine: 'logic', project: 'count' },
  { id: 'display', parent: 'computer', engine: 'logic', project: 'seg' },
  { id: 'safety', parent: 'computer', engine: 'logic', project: 'vote' },
  { id: 'check', parent: 'computer', engine: 'logic', project: 'parity' },
  { id: 'serial', parent: 'computer', engine: null }
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
  regbit: 'reg q = (we & d) | q;',
  select: 'y0 = ~s1 & ~s0 & en;\ny1 = ~s1 & s0 & en;\ny2 = s1 & ~s0 & en;\ny3 = s1 & s0 & en;',
  free: 'y = a & b;\nz = c | d;'
};
