/* Keeps old links and saved progress working when topics merge.

   MOVED lists each topic that has gone: { 'old-id': 'id-it-lives-in-now' }. Add a line in the same
   pull request that removes a topic folder, plus one for each of its simulations, such as
   'lab-compute-1': 'lab-accelerators-5'. Never remove a line: links live for years.

   main.js imports this file first, so saved progress is carried across before any module reads it. */
export const MOVED = {
  ecosystem: 'supply',
  scenarios: 'future',
  'lab-scenarios-1': 'lab-future-2',
  'lab-scenarios-2': 'lab-future-3',
  'lab-ecosystem-1': 'lab-supply-5',
  'lab-ecosystem-2': 'lab-supply-6'
};

/* Where each merged topic's quiz now starts: the number of questions already in the receiving topic. */
export const QUIZ_AT = { ecosystem: 3, scenarios: 3 };

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

/* Seen topics move across. Quiz answers are stored by question number, and a merged topic's questions
   sit after the receiving topic's own, so each answer shifts by QUIZ_AT[old id]. With no entry there,
   the answers are dropped: a wrong answer on the wrong question is worse than an empty quiz. */
export function moveProgress(p, moved, quizAt = {}) {
  const seen = {}, quiz = {};
  for (const [id, v] of Object.entries(p.seen || {})) seen[movedTo(id, moved) || id] = v;
  for (const [id, v] of Object.entries(p.quiz || {})) { if (!movedTo(id, moved)) quiz[id] = { ...v }; }
  for (const [id, v] of Object.entries(p.quiz || {})) {
    const to = movedTo(id, moved); if (!to || quizAt[id] === undefined) continue;
    quiz[to] = quiz[to] || {};
    for (const [n, a] of Object.entries(v)) quiz[to][+n + quizAt[id]] = a;
  }
  return { ...p, seen, quiz };
}

function update(store, key, f) {
  const raw = store.getItem(key); if (!raw) return;
  const was = JSON.parse(raw), now = f(was);
  if (JSON.stringify(now) !== JSON.stringify(was)) store.setItem(key, JSON.stringify(now));
}

/* Safe to run on every visit: once a key has moved there is nothing left to change. */
export function migrateSaved(store, moved = MOVED, quizAt = QUIZ_AT) {
  if (!Object.keys(moved).length) return;
  try { update(store, 'osl-solved-v1', s => moveSolved(s, moved)); } catch (e) { /* unreadable: leave it as it is */ }
  try { update(store, 'sjl-progress-v3', p => moveProgress(p, moved, quizAt)); } catch (e) { /* unreadable: leave it as it is */ }
}

try { if (typeof localStorage !== 'undefined') migrateSaved(localStorage); } catch (e) { /* storage unavailable */ }
