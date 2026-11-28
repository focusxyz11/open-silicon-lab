/* Your stack as this browser keeps it (osl-stack, src/v2/stack/view.js), read and changed from outside the stack view:
   the studio's Arrange sets the recipe's shape and where it computes (#507), and the stack, the field and the record
   read the same keeping when they next open. A gene changed is what the stack itself does (view.js setGene): before
   any growth, a new start in the new recipe; after, a fork that keeps what carries over. Pure logic over storage. */
import * as A from '../../engines/arch.js';
import { stackOf } from '../../engines/path.js';
import { EXAMPLE } from '../../data/path.js';

export const KEY = 'osl-stack';
const read = store => { try { const k = JSON.parse(store.getItem(KEY) || 'null'); if (k && k.A && A.isKey(A.keyOf(k.A.g))) return k; } catch (e) { /* a fresh start */ } return null; };
/* the stack kept, or the lab's example */
export function stackKept(store) { const k = read(store); return k ? stackOf(k.A.g, k.F, k.aim) : stackOf(); }
/* the recipe kept */
export const recipeKept = store => { const k = read(store); return k ? A.normal(k.A.g) : Object.assign({}, A.TODAY); };
/* set one gene of the recipe kept; returns the recipe after */
export function keepGene(store, gene, option) {
  if (!A.GENES.includes(gene) || !(A.CARRY[gene] && A.CARRY[gene][option])) return recipeKept(store);
  const k = read(store) || { F: Object.assign({}, EXAMPLE), aim: 'any', A: A.start(A.TODAY, {}), T: A.treeOf(A.TODAY), focus: [], stones: {}, first: {} };
  if (k.A.g[gene] === option) return A.normal(k.A.g);
  const g2 = Object.assign({}, k.A.g, { [gene]: option }), yr = k.A.year;
  if (!yr) { k.A = A.start(g2, k.stones || {}); k.T = A.treeStart(k.T || A.treeOf(k.A.g), g2); }
  else { k.A = A.forkOf(k.A, gene, option); k.T = A.treeFork(k.T || A.treeOf(g2), g2, yr); }
  k.focus = A.novelty(k.A.g) ? A.suggest(k.A, 'archniche').dirs.slice() : [];
  try { store.setItem(KEY, JSON.stringify(k)); } catch (e) { /* not kept */ }
  return A.normal(k.A.g);
}

/* set one fine setting of the stack kept (the line's care at its stations, #513): what the stack view's setFine does */
export function keepFine(store, key, value) {
  const k = read(store) || { F: Object.assign({}, EXAMPLE), aim: 'any', A: A.start(A.TODAY, {}), T: A.treeOf(A.TODAY), focus: [], stones: {}, first: {} };
  k.F = Object.assign({}, EXAMPLE, k.F || {}, { [key]: value });
  try { store.setItem(KEY, JSON.stringify(k)); } catch (e) { /* not kept */ }
  return stackOf(k.A.g, k.F, k.aim);
}
