/* Figures more than one page names (Hold, the first page, and the blueprint, #/blueprint), said once here and read by
   both: the words around them carry only a placeholder ({dc}, {design}, …), filled by src/v2/figures.js. Each is tied
   to its fact in src/data/facts.json, and tests/hold.test.mjs checks that the fact says the same number and that no
   page's words type it out again. */
export const FIG = {
  dc: { v: 485, fact: 'dc-electricity' },              /* TWh of electricity data centres used */
  dc2030: { v: 950, fact: 'dc-electricity' },          /* TWh projected for 2030 */
  design28: { v: 51e6, fact: 'design-cost-older' },    /* $ to design one leading chip at 28 nm */
  design: { v: 725e6, fact: 'design-cost-2nm' },       /* $ to design one leading chip at 2 nm */
  module: { v: [25e9, 35e9], fact: 'fab-module-cost' }, /* $ for one leading factory module */
  euv: { v: 400e6, fact: 'high-na-price' },            /* $ for one of the newest machines that print the lines */
  run: { v: 7000, fact: 'wafer-space-run' }            /* $ for one open run of 1,000 finished chips */
};
