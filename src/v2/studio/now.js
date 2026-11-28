/* The record of your chip now (docs/CHIP.md), as every view of it reads it: the studio (src/v2/glue/studio.js), the
   line (src/v2/glue/flat.js) and whatever draws your chip next. Your stack as the stack keeps it (src/v2/stack/keep.js),
   your design as the bench keeps it, or the lab's example (one slice of an ALU, placed by hand: GUIDE.md §7), with the
   placement and the clock you set in the studio (osl-studio), and the line's care your stack sets. */
import { recordOf } from '../../engines/chiprecord.js';
import { solutionOf } from '../../engines/design.js';
import { stackKept } from '../stack/keep.js';
import { benchDesign } from '../game.js';

export const SKEY = 'osl-studio';
const store = () => { try { return localStorage; } catch (e) { return null; } };
/* the design the studio draws, with what you set there */
export function designNow(S) {
  const b = benchDesign(S), d = b.by === 'you' ? { p: b.p, code: b.code } : { p: 'alu', code: solutionOf('alu') };
  try { const k = JSON.parse((store() && store().getItem(SKEY)) || 'null'); if (k && k.key === d.p + '\n' + d.code) { if (k.place) d.place = k.place; if (Number.isInteger(k.clock)) d.clock = k.clock; } } catch (e) { /* none kept */ }
  return d;
}
export function keepDesign(d, more) {
  const k = Object.assign({ key: d.p + '\n' + d.code, place: d.place || null, clock: d.clock != null ? d.clock : null }, more);
  try { store().setItem(SKEY, JSON.stringify(k)); } catch (e) { /* not kept */ }
}
export const stackNow = () => stackKept(store() || { getItem: () => null });
export const recordNow = S => recordOf(stackNow(), designNow(S), null);
