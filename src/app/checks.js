/* Challenges that check themselves. A challenge in topic.json may carry a "check": a list of steps,
   each a list of conditions on the simulation's own controls and readouts that must all hold at the
   same moment. When every step has been seen (in any order), the challenge is solved: it is saved in
   this browser, the page says so, and its "why" opens. A challenge without a check (an open design,
   a question with many answers) offers "I tried it" instead. Solving never unlocks or locks anything.

   A condition names an element by id and tests it:
     { "id": "ydCost", "lt": 539 }          the first number in its text (or an input's value): lt, lte, gt, gte, eq
     { "id": "ydSplit", "on": "8" }         a button group: the pressed button's text starts with this
     { "id": "ppFwd", "checked": true }     a checkbox
     { "id": "cvTag", "has": "Finished" }   its text contains this ("sel" narrows to a child, e.g. "h3")
     { "id": "encOp", "is": "sub" }         an input's or select's exact value
     { "any": [ …conditions ] }             at least one of them */
import { CHALLENGES } from '../data/challenges.js';
import { levelStars } from './progress.js';

const KEY = 'osl-solved-v1';
let SOLVED = {}; try { SOLVED = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { SOLVED = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(SOLVED)); } catch (e) { /* storage unavailable */ } };

export const keyOf = c => c.topic + '/' + c.t;
/* RISC-V levels keep their own stars; a level with a star is a solved build challenge. */
const riscvLevel = c => { const m = /^#riscv-(\d+)$/.exec(c.href); return m && c.lens === 'build' ? +m[1] : 0; };
export const isSolved = c => !!SOLVED[keyOf(c)] || (riscvLevel(c) > 0 && levelStars(riscvLevel(c)) > 0);
/* Does the lab itself notice when this challenge is solved? */
export const selfChecks = c => (Array.isArray(c.check) && c.check.length > 0) || riscvLevel(c) > 0;
export const solvedIn = list => list.filter(isSolved).length;

/* from: 'card' when the reader said "I tried it" on the mission card, so the note shows there. */
export function markSolved(c, from = 'lab') {
  if (isSolved(c)) return;
  SOLVED[keyOf(c)] = new Date().toISOString().slice(0, 10); save();
  document.dispatchEvent(new CustomEvent('osl:solved', { detail: { c, from } }));
  document.dispatchEvent(new CustomEvent('osl:progress'));
}

/* ---- reading the page ---- */
const num = s => { const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? +m[0] : NaN; };
function valueOf(el) { return el.matches('input,select,textarea') ? el.value : el.textContent; }
function pressedText(el) {
  const b = el.querySelector('[aria-pressed="true"]') || el.querySelector('.on');
  return b ? b.textContent.trim() : '';
}
export function holds(cond, root = document) {
  if (cond.any) return cond.any.some(x => holds(x, root));
  let el = root.querySelector('#' + cond.id) || document.getElementById(cond.id);
  if (!el) return false;
  if (cond.sel) { el = el.querySelector(cond.sel); if (!el) return false; }
  if ('checked' in cond) return el.checked === cond.checked;
  if ('on' in cond) return pressedText(el).startsWith(cond.on);
  if ('is' in cond) return String(el.value) === String(cond.is);
  if ('has' in cond) return el.textContent.includes(cond.has);
  const v = num(valueOf(el));
  if (Number.isNaN(v)) return false;
  return ('lt' in cond ? v < cond.lt : true) && ('lte' in cond ? v <= cond.lte : true) &&
    ('gt' in cond ? v > cond.gt : true) && ('gte' in cond ? v >= cond.gte : true) &&
    ('eq' in cond ? Math.abs(v - cond.eq) < 1e-9 : true);
}

/* ---- watching a topic ---- */
const seen = new Map();   /* challenge key → set of step numbers seen true in this visit */
function evaluate(sec, cs) {
  cs.forEach(c => {
    if (isSolved(c)) return;
    const k = keyOf(c), s = seen.get(k) || new Set();
    c.check.forEach((step, i) => { if (step.every(cond => holds(cond, sec))) s.add(i); });
    seen.set(k, s);
    if (s.size === c.check.length) markSolved(c);
  });
}
/* Called once when a topic loads: re-check after every change the reader makes and every readout the
   simulation writes (a few times a second at most). */
export function watchChecks(id, sec) {
  const cs = CHALLENGES.filter(c => c.topic === id && Array.isArray(c.check) && c.check.length);
  if (!cs.length) return;
  let queued = false;
  const run = () => { if (queued) return; queued = true; setTimeout(() => { queued = false; if (!sec.hidden) evaluate(sec, cs); }, 120); };
  ['input', 'change', 'click'].forEach(ev => sec.addEventListener(ev, run));
  if (typeof MutationObserver !== 'undefined') new MutationObserver(run).observe(sec, { subtree: true, childList: true, characterData: true });
  run();
}

export const stepsSeen = c => (seen.get(keyOf(c)) || new Set()).size;
export const solvedCount = () => solvedIn(CHALLENGES);
