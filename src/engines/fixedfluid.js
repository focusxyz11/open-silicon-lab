/* Fixed or fluid: the picture of the core question "Fixed or fluid" (home.q.line, the card at #/q/line). A chip of
   sixty places in twelve columns of five, cut by a line: the places left of it are fixed (built for the kinds of job
   known when the chip was designed), those right of it are fluid (they take any job). Sixty jobs arrive; some share
   of them are of the known kinds, the rest are new. A fixed place takes only a known job and does it at a fiftieth of
   the energy (GAIN); a fluid place takes anything at full energy; a job with no place is turned away.
   A model with round numbers, not industry figures: the order of the gain is the one Hameed et al. measured for one
   job (fact asic-vs-cpu, about 500 times), kept smaller here because most jobs are not that one.

   share({ cols, known }) → { F, L, fDone, lDone, lKnown, away, idle, energy }:
     cols   how many of the twelve columns are fixed (0..12)
     known  the share of the jobs that are of the kinds the chip was built for (0..1)
     F, L   fixed and fluid places; fDone, lDone the jobs each part does (lKnown: known jobs a fluid place took)
     away   jobs turned away; idle fixed places with no job of their kind
     energy energy for one job done, against a chip that is all fluid (1) */

export const N = 60, COLS = 12, ROWS = 5, GAIN = 50;

export function share({ cols, known }) {
  const F = Math.max(0, Math.min(COLS, Math.round(cols))) * ROWS, L = N - F, k = Math.round(Math.max(0, Math.min(1, known)) * N);
  const fDone = Math.min(F, k), lDone = Math.min(L, N - fDone), away = N - fDone - lDone, idle = F - fDone;
  const lKnown = Math.min(lDone, k - fDone), done = fDone + lDone;
  return { F, L, fDone, lDone, lKnown, away, idle, energy: done ? (fDone / GAIN + lDone) / done : 1 };
}
