/* What every section of the browser smoke test shares (scripts/smoke.mjs fills it before the first section runs): the
   address of the site served for the run, the two browsers (browser: plain; browser3d: software WebGL, so the 3D levels can
   draw on a machine without a GPU), the problems found so far, and where the run is now (at), which the watchdog names
   when a page stops answering. A section reads them as S.base, S.browser, ... and sets S.at as it goes. */
export const S = { base: '', browser: null, browser3d: null, problems: [], at: 'start' };
