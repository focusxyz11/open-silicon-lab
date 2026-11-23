/* the labs section's check of the lab thousand (src/data/labs/thousand.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* a thousand that pass: one chosen with a reason and kept as a ledger try the engine validates */
  await playLab('thousand', "const P = '.player[data-ch=\"thousand\"] ', d = document.querySelector(P + '[data-th-pick=\"d0042\"]'); if (d && !document.querySelector(P + '.thcard')) d.dispatchEvent(new MouseEvent('click', { bubbles: true })); if (!document.querySelector(P + '.slip')) { SET(P + '[data-th-why]', 'What you say to it should never leave the phone'); SET(P + '.thkeep [data-sign]', 'Smoke'); CL(P + '[data-th-keep]'); }", 'A thousand that pass');
};
