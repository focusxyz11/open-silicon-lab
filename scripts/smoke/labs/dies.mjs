/* the labs section's check of the lab dies (src/data/labs/dies.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* read the die, at the test house: name each chip from its die photo, find every block on one */
  await playLab('dieread', "const P = '.player[data-ch=\"dieread\"] ', ty = new Set([...document.querySelectorAll(P + '[data-xr-type]')].map(g => g.dataset.xrType)), k = ty.has('dram') ? 'dram' : ty.has('pixels') ? 'camera' : ty.has('flash') ? 'mcu' : ty.has('npu') ? 'phone' : 'gpu'; CL(P + '[data-xr-kind=\"' + k + '\"]'); for (let n = 0; n < 60 && document.querySelector(P + '.xrfind'); n++) for (const t of [...ty]) { const g = document.querySelector(P + '[data-xr-type=\"' + t + '\"]'); if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true })); if (!document.querySelector(P + '.xrfind')) break; } CL(P + '[data-xr-next]')", 'Read the die');
};
