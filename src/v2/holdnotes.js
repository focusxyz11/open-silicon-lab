/* What a tap on the first page opens (src/v2/holdkit.js asks for it when it is first needed): a number's source in a
   small note, every source on one sheet, by chapter, and the word that a challenge is done. Styles:
   src/styles/holdnotes.css. */
import { esc } from '../core/esc.js';
import { w, $, $$, h, clamp, ROOT, FACTS, loadFacts } from './holdkit.js';

export const CH_FACTS = { years: ['moore-1965', 'transistor-trend', 'zeloof-garage', 'chm-x86', 'core2-410m', 'northpole', 'rubin-gpu', 'cerebras-cs4', 'node-years', 'node-names', 'clock-stall', 'dual-core-2005', 'asic-vs-cpu', 'fdiv-rate', 'fdiv-charge', 'euv-wavelength', 'high-na-price', 'tsmc-n2', 'node-n2'],
  walls: ['energy-moving-data', 'dc-electricity', 'design-cost-older', 'design-cost-recent', 'design-cost-2nm', 'fab-module-cost', 'wafer-space-run', 'cortical-cl1', 'brain-power', 'minimal-fab'],
  next: ['energy-moving-data', 'hbm4', 'encharge-en100', 'landauer-measured'],
  arch: ['alexnet-gpu', 'epyc-chiplets', 'hbm4', 'encharge-en100', 'cpo-production', 'hala-point'],
  machine: ['asic-vs-cpu', 'fpga-asic-gap'] };
let pop = null, sheetEl = null, toastEl = null, toastTm = 0;
const inRoot = el => { ROOT.appendChild(el); return el; };
export function showPop(b) {
  if (!FACTS[b.dataset.f]) { if (!Object.keys(FACTS).length) loadFacts().then(() => { if (b._want && FACTS[b.dataset.f]) showPop(b); }); return; }
  if (!pop) { pop = inRoot(h('div', 'srcpop')); }
  const f = FACTS[b.dataset.f]; if (!f) return; $$('.src.on').forEach(e => e.classList.remove('on')); b.classList.add('on');
  pop.innerHTML = '<span class="mono">' + w('src.k') + ' · ' + w('src.verified', { d: esc(f[3]) }) + '</span>' + esc(f[2]) + '<br><a href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + ' ↗</a><button type="button" class="all mono">' + w('sources') + '</button>';
  pop.querySelector('.all').onclick = () => { hidePop(); sheet(true); };
  const r = b.getBoundingClientRect(), pw = Math.min(300, innerWidth - 24); pop.style.left = clamp(r.left - 20, 12, innerWidth - pw - 12) + 'px';
  pop.classList.add('on'); const ph = pop.offsetHeight; pop.style.top = (r.bottom + 8 + ph > innerHeight ? r.top - ph - 8 : r.bottom + 8) + 'px'; }
export function hidePop() { if (pop) pop.classList.remove('on'); $$('.src.on').forEach(e => e.classList.remove('on')); }
export function sheet(on) {
  if (on && !Object.keys(FACTS).length) { loadFacts().then(() => sheet(true)); return; }
  if (!sheetEl && on) { sheetEl = inRoot(h('div', 'sheet')); sheetEl.setAttribute('role', 'dialog'); sheetEl.setAttribute('aria-label', w('sheet.h').replace(/<[^>]+>/g, ''));
    /* each source once, in the first chapter that names it, and counted as listed */
    const seen = new Set(), by = Object.entries(CH_FACTS).map(([ch, ids]) => [ch, ids.filter(id => FACTS[id] && !seen.has(id) && seen.add(id))]);
    sheetEl.innerHTML = '<header><div><span class="mono dim">' + w('sheet.k', { n: seen.size }) + '</span><h2 class="anton">' + w('sheet.h') + '</h2></div><p>' + w('sheet.p') + '</p><button type="button" class="bbtn mono" data-x="1">' + w('close') + ' ✕</button></header><div class="cols">' +
      by.map(([ch, ids], i) => '<div class="col"><h3 class="anton"><span>0' + (i + 1) + '</span>' + w('tab.' + ch) + '</h3>' + ids.map(id => '<a class="f" href="' + esc(FACTS[id][1]) + '" target="_blank" rel="noopener"><b>' + esc(FACTS[id][2]) + '</b><span>' + esc(FACTS[id][0]) + ' ↗ · ' + esc(FACTS[id][3]) + '</span></a>').join('') + '</div>').join('') + '</div>';
    $('[data-x]', sheetEl).onclick = () => sheet(false); }
  if (sheetEl) sheetEl.classList.toggle('on', on); }
export function toast(html) { if (!toastEl) { toastEl = inRoot(h('div', 'toast mono')); toastEl.setAttribute('role', 'status'); } toastEl.innerHTML = html; toastEl.classList.add('on'); clearTimeout(toastTm); toastTm = setTimeout(() => toastEl.classList.remove('on'), 2600); }
