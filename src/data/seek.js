/* Something to do at every level of the dive (issue #235): a level's question turned into a small search on its
   picture. The card says what to look for (seek.<level>.find); tapping a part, on the picture or in the card, gives
   something true to notice about it (seek.<level>.<part>); the part that leads into the question (leads) lights the
   question's thread to follow; finding it is kept in your log (S.looked in src/v2/game.js). The search leads to the
   question; it never answers it.
   view: where the level is shown ('flight': the data centre flight, src/v2/dc3d.js, its parts the ids of
   VIEW_PARTS.flight; 'dive': the dive, its parts the keys of the level's scene); ask: the question's stop key; at:
   the address of the level, for your log. */
export const SEEK = {
  server: { view: 'flight', ask: 'divide.rack', parts: ['fans', 'accelerator', 'memory', 'network'], leads: 'accelerator', at: '#/place/datacentre/3' },
  phoneboard: { view: 'dive', ask: 'fail.phoneboard', parts: ['soc', 'pmic', 'modem', 'storage'], leads: 'soc', at: '#/dive/phoneboard/phone' },
  gate: { view: 'dive', ask: 'think.gate', parts: ['gates', 'diff', 'metal'], leads: 'metal', at: '#/dive/gate' }
};
export const SEEK_LEVELS = Object.keys(SEEK);
/* what you have looked at, kept: only parts a search has, in its order */
export const normalLooked = v => {
  const out = {};
  Object.entries(v && typeof v === 'object' ? v : {}).forEach(([lv, ps]) => { if (SEEK[lv] && Array.isArray(ps)) { const k = SEEK[lv].parts.filter(p => ps.includes(p)); if (k.length) out[lv] = k; } });
  return out;
};
export const foundAt = (looked, lv) => !!(SEEK[lv] && looked && looked[lv] && looked[lv].includes(SEEK[lv].leads));
