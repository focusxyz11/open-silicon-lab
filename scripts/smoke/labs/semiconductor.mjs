/* the labs section's check of the lab semiconductor (src/data/labs/semiconductor.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* too hot for silicon, at the switch: the heater is set to 600 K and the silicon warms through the crossing */
  await playLab('too-hot', "SET('#semi-T', 600)", 'Too hot for silicon');
  /* powers of ten in the font of their numbers (#373): raised tspans on the plot's axis, sups in the readings and the
     goal, never Unicode's superscript digits (a fallback font drew '10¹ ⁰') */
  await fp.waitForFunction(re => { const p = document.querySelector('.player[data-ch="too-hot"]'); if (!p) return false;
    return p.querySelectorAll('.semifig text.ax tspan.exp').length >= 3 && p.querySelectorAll('.semiread sup.exp').length >= 3 && !!p.querySelector('.gauge .gv sup.exp') && !new RegExp(re).test(p.textContent); }, '[\\u2070-\\u209f]', { timeout: 30000, polling: 1000 })
    .catch(() => problems.push(tag + ': the powers of ten are not raised numbers in the readings\' own font'));
};
