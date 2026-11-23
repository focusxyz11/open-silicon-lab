/* the labs section's check of the lab implant (src/data/labs/implant.js): its challenges played to their win on the
   labs' flat page, each in Do mode (scripts/smoke/labs.mjs gives the page and the moves) */
export default async ({ fp, adr, inDo, playLab, problems, tag }) => {
  await playLab('furnace', "CL('[data-im-ion=\"B\"]'); SET('#im-le', 0.3); CL('[data-im-anneal=\"furnace\"]'); CL('[data-im-anneal=\"laser\"]')", 'The furnace spreads it');
  await playLab('shallow', "CL('[data-im-ion=\"As\"]'); SET('#im-le', 0.3); CL('[data-im-anneal=\"laser\"]')", 'Shallow and switched on');
};
