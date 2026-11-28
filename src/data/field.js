/* The field's rules (#480): what keeps the field of every attempt fair before more people and agents arrive. Plain
   data, read by the ledger (src/engines/ledger.js settle) and the population engine (src/engines/population.js).

   DAY_CAP   at most this many attempts at an architecture are scored per author per day, the same rule for a person and
             an agent (one agent through the open port could otherwise post thousands overnight and crowd people out).
             An author is the entry's `by`, read without spaces or capitals; a day is the date its id begins with. The
             entries past it stay in the ledger, marked over the day's cap, and are not scored. A choice of the lab,
             written down so it can be argued with: a person playing for an evening keeps a handful; an agent's sweep
             spreads over days.
   PAST      each closed season's standings, as they stood when the season closed (src/engines/arch.js SEASONS): for
             every attempt of that season, its facts and credit, and each niche's champion. Written once by
             scripts/season.mjs when VERSION is raised, never edited afterwards and never deleted: a champion of season
             1 stays the champion of season 1. Empty while the first season is the current one. */
export const DAY_CAP = 10;
export const PAST = {};
