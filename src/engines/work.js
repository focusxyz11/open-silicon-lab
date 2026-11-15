/* The Work engine, begun (content/divide.md): how a chip divides its work. Pure; tests in tests/scaling.test.mjs.
   Its first piece is Amdahl's law with a district: give part of the chip's area to a special district that does one
   kind of work k times faster than the same area of general cores. If that work is a share f of the job, the job
   takes (1 - f) / (1 - a) + f / (k * a) of the time the whole chip as general cores would take, where a is the share
   of the area the district takes. The district pays only when its work is a large enough share of the job.
   k is a model's choice, named here: special circuits for one job are commonly tens to hundreds of times more
   efficient than general ones (content/divide.md, "What is true" 5). */
export const SPECIAL_K = 20;
export const AREAS = [0, 0.1, 0.25, 0.5];
export const SHARES = [0.1, 0.3, 0.6, 0.9];
/* the job's time against all-general cores (1 = the same; less is faster) */
export function withDistrict(f, a, k = SPECIAL_K) {
  if (a <= 0) return 1;
  return (1 - f) / (1 - a) + f / (k * a);
}
/* Amdahl's law: speeding up a share f by k */
export const amdahl = (f, k) => 1 / ((1 - f) + f / k);
