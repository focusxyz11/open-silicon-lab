/* Opening the tiny-chip studio from anywhere on the site. The studio is a topic that loads on
   demand, so load it first, then ask it to open a project or change the process. */
import { ensureTopic } from './loader.js';

export function openStudio(id, step = 0) {
  return ensureTopic('tiny').then(() => document.dispatchEvent(new CustomEvent('osl:tiny-open', { detail: { id, step } })));
}
export function setStudioNode(node) {
  return ensureTopic('tiny').then(() => document.dispatchEvent(new CustomEvent('osl:tiny-set', { detail: { node } })));
}
/* Buttons such as the RISC-V lab's "design my ALU" carry data-tiny-proj="<project>". */
export function initStudioLinks() {
  document.addEventListener('click', e => { const t = e.target.closest('[data-tiny-proj]'); if (t) openStudio(t.dataset.tinyProj, 0); });
}
