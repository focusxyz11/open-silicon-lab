/* the labs section's check of the lab films (src/data/labs/films.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  /* the films labs run in time: start a run, go on if it was paused, start again if it ended short of the goal */
  const GO = "const g = document.querySelector('[data-fl-go]'), st = g ? g.dataset.flState : '';";
  await playLab('etch', GO + " if (st === 'ready') { SET('#fl-ions', 100); SET('#fl-chem', 0); const f = document.querySelector('[data-fl-fast]'); if (f && f.getAttribute('aria-pressed') !== 'true') f.click(); CL('[data-fl-go]'); }"
    + " else if (st === 'ended') CL('[data-fl-reset]'); else if (st === 'paused') CL('[data-fl-go]')", 'Etch straight down', 180000);
  await playLab('bottom', GO + " const m = document.querySelector('[data-fl-mode].on'), mode = m ? m.dataset.flMode : 'cvd';"
    + " if (st === 'ended') { if (mode === 'cvd') CL('[data-fl-mode=\"ald\"]'); else CL('[data-fl-reset]'); } else if (st === 'ready' || st === 'paused') CL('[data-fl-go]')", 'The bare bottom', 180000);
};
