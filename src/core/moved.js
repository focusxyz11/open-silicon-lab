/* Keeps old links and saved progress working when topics merge.

   MOVED lists each topic that has gone: { 'old-id': 'id-it-lives-in-now' }. Add a line in the same
   pull request that removes a topic folder, and never remove one: links live for years. Give each
   moved simulation its old anchor as an explicit id, such as <div class="lab" id="lab-compute-1">.

   main.js imports this file first, so saved progress is carried across before any module reads it. */
export const MOVED = {};

/* Where an address lives now, or null if it has not moved. */
export const movedTo = (id, moved = MOVED) => (Object.hasOwn(moved, id) ? moved[id] : null);

/* Solved challenges are keyed 'topic/title'. The earliest date wins when both exist. */
export function moveSolved(solved, moved) {
  const out = {};
  for (const [key, date] of Object.entries(solved)) {
    const cut = key.indexOf('/'), to = cut > 0 ? movedTo(key.slice(0, cut), moved) : null, k = to ? to + key.slice(cut) : key;
    out[k] = out[k] && out[k] < date ? out[k] : date;
  }
  return out;
}

/* Seen topics move across. Quiz answers are stored by question number, so a merged topic's answers
   move only when the new topic has none; otherwise they would land on the wrong questions. */
export function moveProgress(p, moved) {
  const seen = {}, quiz = {}, later = [];
  for (const [id, v] of Object.entries(p.seen || {})) seen[movedTo(id, moved) || id] = v;
  for (const [id, v] of Object.entries(p.quiz || {})) { if (movedTo(id, moved)) later.push([movedTo(id, moved), v]); else quiz[id] = v; }
  for (const [id, v] of later) if (!quiz[id]) quiz[id] = v;
  return { ...p, seen, quiz };
}

function update(store, key, f) {
  const raw = store.getItem(key); if (!raw) return;
  const was = JSON.parse(raw), now = f(was);
  if (JSON.stringify(now) !== JSON.stringify(was)) store.setItem(key, JSON.stringify(now));
}

/* Safe to run on every visit: once a key has moved there is nothing left to change. */
export function migrateSaved(store, moved = MOVED) {
  if (!Object.keys(moved).length) return;
  try { update(store, 'osl-solved-v1', s => moveSolved(s, moved)); } catch (e) { /* unreadable: leave it as it is */ }
  try { update(store, 'sjl-progress-v3', p => moveProgress(p, moved)); } catch (e) { /* unreadable: leave it as it is */ }
}

try { if (typeof localStorage !== 'undefined') migrateSaved(localStorage); } catch (e) { /* storage unavailable */ }
