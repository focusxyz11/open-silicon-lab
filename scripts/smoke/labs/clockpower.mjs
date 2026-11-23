/* the labs section's check of the lab clockpower (src/data/labs/clockpower.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* the clock and the power: the dials at a point the engine's check accepts; the counter is run at the same place on its
     dial at one process after another, and a run in progress is left to finish */
  await playLab('power-curve', "SET('#ckp-f', 2.25); SET('#ckp-v', 0.61)", 'Half the power');
  await playLab('counter', "const n = ['130', '28'].find(k => !document.querySelector('[data-ckp-node=\"' + k + '\"][data-top]'));"
    + " if (n && !document.querySelector('[data-ckp-run][aria-pressed=\"true\"]')) { CL('[data-ckp-node=\"' + n + '\"]'); SET('#ckp-hz', 61); CL('[data-ckp-run]'); }", 'The counter that fails', 180000);
};
