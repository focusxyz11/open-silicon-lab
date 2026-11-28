/* the labs section's check of the lab trigger (src/data/labs/trigger.js): its challenge played to its win on the labs'
   flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ playLab }) => {
  /* each adder in turn: check every input where it can be afforded, read the gates where that can, then reject what was
     found out or could not be checked, and accept what was proved honest */
  await playLab('trigger', "for (let i = 0; i < 5; i++) { const tl = document.querySelector('[data-tg-at=\"' + i + '\"]'); if (!tl || tl.classList.contains('accept') || tl.classList.contains('reject')) continue; tl.click();"
    + " const all = document.querySelector('[data-tg-all]:not([disabled])'); if (all) all.click(); const gt = document.querySelector('[data-tg-gates]:not([disabled])'); if (gt) gt.click();"
    + " const said = (document.querySelector('.tgsaid') || {}).textContent || ''; const proved = /right everywhere|nothing else/.test(said) && !/wrong sum|extra|do not need/.test(said);"
    + " const b = document.querySelector('[data-tg-d=\"' + (proved ? 'accept' : 'reject') + '\"]'); if (b) b.click(); }", 'Trust it or not');
};
