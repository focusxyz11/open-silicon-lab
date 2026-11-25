/* the labs section's check of the lab halt (src/data/labs/halt.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('halt', "const P = '.player[data-ch=\"halt\"] '; CL(P + '[data-hl-join=\"series\"]:not([aria-pressed=\"true\"])'); CL(P + '[data-hl-out=\"invert\"]:not([aria-pressed=\"true\"])'); CL(P + '[data-hl-k=\"2\"]'); CL(P + '[data-hl-fed][aria-pressed=\"false\"]'); CL(P + '[data-hl-push=\"set\"]'); CL(P + '[data-hl-push=\"reset\"]'); CL(P + '[data-hl-deeper]');"
    + " for (const [b, n] of [[1000, 1000], [10000, 10000]]) { CL(P + '[data-hl-budget=\"' + b + '\"]'); CL(P + '[data-hl-clear]'); CL(P + '[data-hl-add=\"count\"]'); SET(P + '[data-hl-n=\"0\"]', n); CL(P + '[data-hl-run]'); } CL(P + '[data-hl-clear]'); CL(P + '[data-hl-add=\"ask\"]'); CL(P + '[data-hl-run]')", 'The program nobody can judge');
  /* one loop at a time (#373): Run pressed twice replays in one loop, which stops when the replay ends */
  await fp.waitForFunction(() => { const P = '.player[data-ch="halt"] ', p = document.querySelector(P), b = document.querySelector(P + '[data-hl-run]'); if (!p || !b) return false;
    b.click(); b.click(); const n = +(p.parentElement.dataset.loops || 0); window.__hlLoops = Math.max(window.__hlLoops || 0, n); return n <= 1; }, null, { timeout: 30000, polling: 1500 })
    .catch(() => problems.push(tag + ': pressing Run twice starts two replays'));
  await fp.waitForFunction(() => { const p = document.querySelector('.player[data-ch="halt"]'); return !!p && +(p.parentElement.dataset.loops || 0) === 0 && (window.__hlLoops || 0) <= 1; }, null, { timeout: 30000, polling: 500 })
    .catch(() => problems.push(tag + ': the replay\'s loop does not stop, or more than one ran'));
};
