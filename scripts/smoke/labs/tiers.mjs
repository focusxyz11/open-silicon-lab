/* the labs section's check of the lab tiers (src/data/labs/tiers.js): its challenge played to its win on the labs' flat
   page, in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ playLab }) => {
  /* build up: memory on the logic, coolant between the tiers, then three tiers of logic */
  await playLab('tiers', "const m = document.querySelector('[data-tr-tog=\"memOn\"]'); if (m && !m.checked) { m.checked = true; m.dispatchEvent(new Event('input', { bubbles: true })); }"
    + " const c = document.querySelector('[data-tr-tog=\"cool\"]'); if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('input', { bubbles: true })); }"
    + " const b = document.querySelector('[data-tr=\"tiers:3\"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click();", 'Build up, not out');
};
