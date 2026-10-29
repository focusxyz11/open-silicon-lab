/* The wire between the tiny-chip studio and the RISC-V lab: the studio publishes the ALU slice
   you are designing, and the CPU builds its ALU from it. Both live on the same page, so a change
   in your gates reaches the processor at once. */
import TC from '../engines/tinychip.js';
import { buildSlice } from '../engines/alu.js';

const TKEY = 'sjl-tiny-v1';
let live = null, cache = { code: null, slice: null };

export const ALU_PROJ = TC.PROJ.find(p => p.id === 'alu');

/* The slice code: what the studio last published, else what it saved, else the starter. */
export function sliceCode() {
  if (live !== null) return live;
  try { const j = JSON.parse(localStorage.getItem(TKEY) || 'null'); if (j && j.code && typeof j.code.alu === 'string') return j.code.alu; } catch (e) { /* storage unavailable */ }
  return ALU_PROJ.starter;
}

/* Called by the tiny-chip studio whenever the ALU slice code changes. */
export function publishSlice(code) {
  if (code === live) return;
  live = code;
  document.dispatchEvent(new CustomEvent('osl:alu'));
}

/* The current slice, parsed, synthesized and verified (cached by code). */
export function currentSlice() {
  const code = sliceCode();
  if (cache.code !== code) cache = { code, slice: buildSlice(code) };
  return cache.slice;
}

/* Open the tiny-chip studio on the ALU project from anywhere on the site. */
export function openSliceInStudio() {
  document.dispatchEvent(new CustomEvent('osl:tiny-open', { detail: { id: 'alu', step: 1 } }));
  location.hash = 'lab-tiny-1';
}
