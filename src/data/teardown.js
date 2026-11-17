/* The teardown and the right chip for the job, as data (the words: WORDS below; the checks: CHALLENGES).
   Brought over from the first version of the site (the earlier site, branch claude/before-retire-2026-11):
   topics/everywhere/labs/teardown.js ("Look inside: what chips does it take?") and
   topics/everywhere/labs/chip-for-the-job.js ("The right chip for the job"), with their challenge goals from
   topics/everywhere/topic.json and the note under each lab from topics/everywhere/content.html. No interface here:
   only the things and their ids, one place for every word, and the checks.

   Look inside: five products (a smartphone, an electric car, a smart thermostat, a laptop, an AI server), and in
   each the kinds of chips it holds. A chip has a job (what it does), a way it is made (MADE) and whether it needs a
   leading-edge process (3 to 5 nm: leading is true exactly when made is 'lead'). The count of those is the point:
   most of what is inside a product is not the famous processor. A chip's topics are the ids of the map's topics
   that explain it in the first version; facts are ids in src/data/facts.json (the car's two are used by its summary).

   The right chip for the job: kinds of chip on a line from flexible to specialized (pos, 0 to 1; the power chip is
   not on the line), and eight real jobs with the best kind and the kinds that are also sensible.

   The words are td.* in src/i18n/en.json (a word with braces is filled by the view, src/v2/play.js kinds
   'teardown' and 'fit'); nothing here is English. */

/* what a chip does */
export const JOBS = ['proc', 'mem', 'power', 'radio', 'sense'];
/* how it is made */
export const MADE = ['lead', 'adv', 'mat', 'mem', 'spec'];

export const PRODUCTS = [
  { id: "phone", facts: [], chips: [
      { id: "ap", job: "proc", made: "lead", leading: true, big: true, topics: ["architecture", "accelerators", "transistor"], facts: [] },
      { id: "modem", job: "radio", made: "lead", leading: true, topics: ["architecture"], facts: [] },
      { id: "dram", job: "mem", made: "mem", leading: false, topics: ["datacenter", "package"], facts: [] },
      { id: "nand", job: "mem", made: "mem", leading: false, topics: ["datacenter"], facts: [] },
      { id: "pmic", job: "power", made: "mat", leading: false, topics: ["physics", "design"], facts: [] },
      { id: "rffe", job: "radio", made: "spec", leading: false, topics: ["physics"], facts: [] },
      { id: "wifi", job: "radio", made: "adv", leading: false, topics: ["architecture"], facts: [] },
      { id: "cam", job: "sense", made: "mat", leading: false, topics: ["physics", "package"], facts: [] },
      { id: "mems", job: "sense", made: "spec", leading: false, topics: ["physics", "fab"], facts: [] },
      { id: "touch", job: "proc", made: "mat", leading: false, topics: ["design"], facts: [] },
      { id: "audio", job: "power", made: "mat", leading: false, topics: ["design"], facts: [] },
      { id: "se", job: "proc", made: "mat", leading: false, topics: ["architecture"], facts: [] }
  ] },
  { id: "car", facts: ["chips-per-car", "legacy-auto"], chips: [
      { id: "adas", job: "proc", made: "adv", leading: false, big: true, topics: ["accelerators", "compute"], facts: [] },
      { id: "info", job: "proc", made: "adv", leading: false, topics: ["architecture"], facts: [] },
      { id: "mcu", job: "proc", made: "mat", leading: false, topics: ["architecture", "riscv"], facts: [] },
      { id: "inv", job: "power", made: "spec", leading: false, topics: ["physics"], facts: [] },
      { id: "bms", job: "power", made: "mat", leading: false, topics: ["physics", "design"], facts: [] },
      { id: "drv", job: "power", made: "mat", leading: false, topics: ["physics"], facts: [] },
      { id: "radar", job: "radio", made: "mat", leading: false, topics: ["transistor"], facts: [] },
      { id: "net", job: "radio", made: "mat", leading: false, topics: ["design"], facts: [] },
      { id: "ccam", job: "sense", made: "mat", leading: false, topics: ["physics"], facts: [] },
      { id: "csen", job: "sense", made: "spec", leading: false, topics: ["physics"], facts: [] },
      { id: "cmem", job: "mem", made: "mem", leading: false, topics: ["datacenter"], facts: [] }
  ] },
  { id: "thermo", facts: [], chips: [
      { id: "wmcu", job: "proc", made: "mat", leading: false, big: true, topics: ["riscv", "architecture"], facts: [] },
      { id: "tsen", job: "sense", made: "mat", leading: false, topics: ["physics"], facts: [] },
      { id: "flash", job: "mem", made: "mem", leading: false, topics: ["datacenter"], facts: [] },
      { id: "reg", job: "power", made: "mat", leading: false, topics: ["physics"], facts: [] },
      { id: "disp", job: "proc", made: "mat", leading: false, topics: ["design"], facts: [] }
  ] },
  { id: "laptop", facts: [], chips: [
      { id: "cpu", job: "proc", made: "lead", leading: true, big: true, topics: ["architecture", "package"], facts: [] },
      { id: "gpu", job: "proc", made: "lead", leading: true, topics: ["accelerators"], facts: [] },
      { id: "ldram", job: "mem", made: "mem", leading: false, topics: ["datacenter"], facts: [] },
      { id: "ssdc", job: "proc", made: "adv", leading: false, topics: ["architecture"], facts: [] },
      { id: "lnand", job: "mem", made: "mem", leading: false, topics: ["datacenter"], facts: [] },
      { id: "vr", job: "power", made: "mat", leading: false, topics: ["physics"], facts: [] },
      { id: "lwifi", job: "radio", made: "adv", leading: false, topics: ["architecture"], facts: [] },
      { id: "usb", job: "power", made: "mat", leading: false, topics: ["design"], facts: [] },
      { id: "ec", job: "proc", made: "mat", leading: false, topics: ["architecture"], facts: [] },
      { id: "lcam", job: "sense", made: "mat", leading: false, topics: ["physics"], facts: [] },
      { id: "tpm", job: "proc", made: "mat", leading: false, topics: ["architecture"], facts: [] }
  ] },
  { id: "server", facts: [], chips: [
      { id: "agpu", job: "proc", made: "lead", leading: true, big: true, topics: ["accelerators", "compute", "package"], facts: [] },
      { id: "hbm", job: "mem", made: "mem", leading: false, topics: ["package", "datacenter"], facts: [] },
      { id: "hcpu", job: "proc", made: "lead", leading: true, topics: ["architecture"], facts: [] },
      { id: "nic", job: "radio", made: "lead", leading: true, topics: ["datacenter"], facts: [] },
      { id: "opt", job: "radio", made: "spec", leading: false, topics: ["datacenter", "package"], facts: [] },
      { id: "spow", job: "power", made: "spec", leading: false, topics: ["physics", "datacenter"], facts: [] },
      { id: "bmc", job: "proc", made: "mat", leading: false, topics: ["architecture"], facts: [] },
      { id: "ret", job: "radio", made: "adv", leading: false, topics: ["design"], facts: [] },
      { id: "ssd", job: "mem", made: "mem", leading: false, topics: ["datacenter"], facts: [] },
      { id: "sen", job: "sense", made: "mat", leading: false, topics: ["physics"], facts: [] }
  ] }
];

/* the kinds of chip on the line from flexible to specialized, and the eight jobs */
export const FIT_KINDS = [
  { id: "cpu", pos: 0.04 },
  { id: "mcu", pos: 0.2 },
  { id: "gpu", pos: 0.38 },
  { id: "dsp", pos: 0.52 },
  { id: "fpga", pos: 0.68 },
  { id: "asic", pos: 0.94 },
  { id: "power", pos: null }
];
export const FIT_JOBS = [
  { id: "laptop", best: "cpu", ok: [] },
  { id: "soil", best: "mcu", ok: [] },
  { id: "train", best: "gpu", ok: ["asic"] },
  { id: "video", best: "asic", ok: ["dsp"] },
  { id: "mine", best: "asic", ok: [] },
  { id: "radio", best: "fpga", ok: ["dsp"] },
  { id: "anc", best: "dsp", ok: ["asic"] },
  { id: "motor", best: "power", ok: [] }
];

export const productById = id => PRODUCTS.find(p => p.id === id) || null;
export const chipById = id => { for (const p of PRODUCTS) { const c = p.chips.find(x => x.id === id); if (c) return c; } return null; };
export const leadingCount = id => (productById(id) ? productById(id).chips.filter(c => c.leading).length : 0);
export const totalLeading = () => PRODUCTS.reduce((n, p) => n + leadingCount(p.id), 0);

/* which summary words a product shows: a key in WORDS and what fills its braces; then its own closing words
   (td.product.<id>.sum). The car has its own first sentence, then two figures from its facts. */
export function summaryOf(id) {
  const p = productById(id), lead = leadingCount(id), n = p.chips.length;
  const key = id === 'car' ? 'td.sum.car' : lead === 0 ? 'td.sum.none' : lead === 1 ? 'td.sum.one' : 'td.sum.some';
  return { key, vars: { lead, n }, then: ['td.product.' + id + '.sum'], facts: p.facts };
}

/* a choice for a job: 'best', 'ok' (also sensible) or 'no' */
export function verdict(jobId, kindId) {
  const j = FIT_JOBS.find(x => x.id === jobId);
  return !j || !FIT_KINDS.some(k => k.id === kindId) ? 'no' : kindId === j.best ? 'best' : j.ok.includes(kindId) ? 'ok' : 'no';
}

/* the challenges. How many need the newest fab: you opened all five products and your count is the right one.
   The right chip for the job: every one of the eight jobs has its best kind (answers: { jobId: kindId }). */
export function checkNewest(b) {
  const opened = new Set((b && b.opened) || []);
  const all = PRODUCTS.every(p => opened.has(p.id));
  const right = !!b && b.count === totalLeading();
  return { all, right, total: totalLeading(), ok: all && right };
}
export function checkJobs(b) {
  const a = (b && b.answers) || {};
  const best = FIT_JOBS.filter(j => a[j.id] === j.best).length;
  return { best, of: FIT_JOBS.length, ok: best === FIT_JOBS.length };
}
export const CHALLENGES = [
  { id: 'newest', check: checkNewest },
  { id: 'jobs', check: checkJobs }
];

/* every key in WORDS that the structures above (and the views' fixed labels) point to */
export const FIXED_WORDS = ['td.start', 'td.openAll', 'td.askCount', 'td.yourCount', 'td.check', 'td.notYet', 'td.open', 'td.by.label', 'td.by.job', 'td.by.made', 'td.how', 'td.rd.lead', 'td.sum.none', 'td.sum.one', 'td.sum.some', 'td.sum.car', 'td.note', 'td.fit.end.l', 'td.fit.end.r', 'td.fit.pick', 'td.fit.best', 'td.fit.ok', 'td.fit.no', 'td.fit.show', 'td.fit.answer', 'td.fit.score', 'td.fit.togo', 'td.fit.note'];
export function wordKeys() {
  const k = [...FIXED_WORDS];
  JOBS.forEach(j => k.push('td.job.' + j));
  MADE.forEach(m => k.push('td.made.' + m));
  for (const p of PRODUCTS) {
    k.push('td.product.' + p.id + '.t', 'td.product.' + p.id + '.sum');
    for (const c of p.chips) k.push('td.chip.' + c.id + '.t', 'td.chip.' + c.id + '.m', 'td.chip.' + c.id + '.d');
  }
  FIT_KINDS.forEach(f => k.push('td.fit.kind.' + f.id + '.t', 'td.fit.kind.' + f.id + '.d'));
  FIT_JOBS.forEach(j => k.push('td.fit.job.' + j.id + '.t', 'td.fit.job.' + j.id + '.why'));
  CHALLENGES.forEach(c => k.push('td.ch.' + c.id + '.done'));
  return k;
}
