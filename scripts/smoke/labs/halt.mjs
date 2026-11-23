/* the labs section's check of the lab halt (src/data/labs/halt.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('halt', "const P = '.player[data-ch=\"halt\"] '; CL(P + '[data-hl-join=\"series\"]:not([aria-pressed=\"true\"])'); CL(P + '[data-hl-out=\"invert\"]:not([aria-pressed=\"true\"])'); CL(P + '[data-hl-k=\"2\"]'); CL(P + '[data-hl-fed][aria-pressed=\"false\"]'); CL(P + '[data-hl-push=\"set\"]'); CL(P + '[data-hl-push=\"reset\"]'); CL(P + '[data-hl-deeper]');"
    + " for (const [b, n] of [[1000, 1000], [10000, 10000]]) { CL(P + '[data-hl-budget=\"' + b + '\"]'); CL(P + '[data-hl-clear]'); CL(P + '[data-hl-add=\"count\"]'); SET(P + '[data-hl-n=\"0\"]', n); CL(P + '[data-hl-run]'); } CL(P + '[data-hl-clear]'); CL(P + '[data-hl-add=\"ask\"]'); CL(P + '[data-hl-run]')", 'The program nobody can judge');
};
