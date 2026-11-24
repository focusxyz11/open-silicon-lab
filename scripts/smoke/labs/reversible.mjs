/* the labs section's check of the lab reversible (src/data/labs/reversible.js): its challenge played to its win on the
   labs' flat page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* compute without erasing: guess, add the two gates that bring the carry in, then ramp each step at 300 ps. Each place
     on a wire is tapped until it holds the role wanted, so the moves can be done again on every poll */
  await playLab('reversible', "CL('[data-rev-guess=\"1\"]'); for (const [k, r] of [['2:1', 'c'], ['2:2', 'c'], ['2:3', 't'], ['3:1', 'c'], ['3:2', 't']]) for (let i = 0; i < 3; i++) { const b = document.querySelector('[data-rev-cell=\"' + k + '\"]'); if (!b || b.dataset.role === r) break; b.dispatchEvent(new MouseEvent('click', { bubbles: true })); } SET('#rev-ramp', 5)", 'Compute without erasing');
};
