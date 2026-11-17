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

   WORDS holds every visible English word, under td.* keys, to be merged into src/i18n/en.json later. A word with
   braces ({n}, {kind}) is filled by the view. Nothing else here is English. */

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
export const FIXED_WORDS = ['td.title', 'td.open', 'td.by.label', 'td.by.job', 'td.by.made', 'td.how', 'td.map', 'td.rd.kinds', 'td.rd.lead', 'td.rd.topics', 'td.rd.of', 'td.rd.topicsval', 'td.sum.none', 'td.sum.one', 'td.sum.some', 'td.sum.car', 'td.sum.chipsPerCar', 'td.sum.legacyAuto', 'td.note',
  'td.fit.title', 'td.fit.end.l', 'td.fit.end.r', 'td.fit.short.asic', 'td.fit.short.mcu', 'td.fit.job', 'td.fit.pick', 'td.fit.best', 'td.fit.ok', 'td.fit.no', 'td.fit.show', 'td.fit.answer', 'td.fit.score', 'td.fit.togo', 'td.fit.reset', 'td.fit.note'];
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
  CHALLENGES.forEach(c => k.push('td.ch.' + c.id + '.t', 'td.ch.' + c.id + '.goal', 'td.ch.' + c.id + '.done'));
  return k;
}

export const WORDS = {
  'td.job.proc': 'Processors & logic',
  'td.job.mem': 'Memory',
  'td.job.power': 'Power & analog',
  'td.job.radio': 'Radio & connectivity',
  'td.job.sense': 'Sensors',
  'td.made.lead': 'Leading edge (3–5 nm)',
  'td.made.adv': 'Advanced (6–16 nm)',
  'td.made.mat': 'Mature (22 nm and larger)',
  'td.made.mem': 'Memory process',
  'td.made.spec': 'Other materials or MEMS',
  'td.product.phone.t': 'Smartphone',
  'td.chip.ap.t': 'Application processor',
  'td.chip.ap.m': '3 nm-class',
  'td.chip.ap.d': 'CPU cores, graphics, the AI engine (NPU), the camera\'s image processor and video codecs, all on one die: a system on a chip.',
  'td.chip.modem.t': '5G modem',
  'td.chip.modem.m': '4–5 nm',
  'td.chip.modem.d': 'Turns radio waves into data with heavy digital signal processing. In many phones it sits inside the application processor.',
  'td.chip.dram.t': 'Main memory (DRAM)',
  'td.chip.dram.m': 'LPDDR5X, often stacked on top of the processor',
  'td.chip.dram.d': 'Holds the apps that are running. Each bit is a tiny capacitor that leaks and must be refreshed many times a second.',
  'td.chip.nand.t': 'Storage (3D NAND flash)',
  'td.chip.nand.m': 'Cells stacked 200+ layers high',
  'td.chip.nand.d': 'Photos, apps and the operating system. Bits are trapped charge that stays put without power.',
  'td.chip.pmic.t': 'Power management chips',
  'td.chip.pmic.m': '40–180 nm',
  'td.chip.pmic.d': 'Turn the battery\'s 4 volts into a dozen precise voltages, charge the battery and switch whole sections off to save energy.',
  'td.chip.rffe.t': 'RF front end',
  'td.chip.rffe.m': 'Gallium arsenide amplifiers, RF silicon-on-insulator switches',
  'td.chip.rffe.d': 'Amplifies the signal going out to the antenna and filters what comes back. Gallium arsenide handles high-frequency power better than silicon.',
  'td.chip.wifi.t': 'Wi-Fi and Bluetooth',
  'td.chip.wifi.m': '6–16 nm',
  'td.chip.wifi.d': 'Short-range radios with their own small processor.',
  'td.chip.cam.t': 'Camera image sensors',
  'td.chip.cam.m': 'Pixel wafer (40–65 nm) bonded face to face to a logic wafer',
  'td.chip.cam.d': 'Millions of photodiodes turn light into charge. Two wafers are bonded together: one for the pixels, one for the readout circuits.',
  'td.chip.mems.t': 'Motion sensors',
  'td.chip.mems.m': 'MEMS: microscopic moving silicon',
  'td.chip.mems.d': 'An accelerometer and gyroscope made of tiny silicon springs and weights that shift when the phone moves.',
  'td.chip.touch.t': 'Touch and display controllers',
  'td.chip.touch.m': '28–65 nm',
  'td.chip.touch.d': 'Scan the touch grid hundreds of times a second and drive every pixel of the screen.',
  'td.chip.audio.t': 'Audio chips',
  'td.chip.audio.m': '40–180 nm',
  'td.chip.audio.d': 'Convert sound between analog and digital and drive the speakers.',
  'td.chip.se.t': 'Secure element and NFC',
  'td.chip.se.m': '28–40 nm',
  'td.chip.se.d': 'A small tamper-resistant processor that keeps payment keys away from the rest of the phone.',
  'td.product.car.t': 'Electric car',
  'td.chip.adas.t': 'Driver-assistance computer',
  'td.chip.adas.m': '7–8 nm typical, newest designs at 4 nm',
  'td.chip.adas.d': 'Combines cameras and radar with an AI accelerator to keep the car in its lane and brake for obstacles.',
  'td.chip.info.t': 'Infotainment processor',
  'td.chip.info.m': '7–8 nm typical',
  'td.chip.info.d': 'Runs the screens, maps and music: a phone-class processor qualified to survive a car\'s heat and vibration.',
  'td.chip.mcu.t': 'Microcontrollers (dozens)',
  'td.chip.mcu.m': '28–90 nm with built-in flash memory',
  'td.chip.mcu.d': 'Small processors in every control unit: brakes, airbags, steering, windows, seats and lights. Built to work for 15 years from −40 to 150 °C.',
  'td.chip.inv.t': 'Motor inverter switches',
  'td.chip.inv.m': 'Silicon carbide (SiC)',
  'td.chip.inv.d': 'Switch hundreds of amps at 400 to 800 volts to drive the motor. Silicon carbide\'s wide band gap wastes less energy as heat than silicon does.',
  'td.chip.bms.t': 'Battery management chips',
  'td.chip.bms.m': '130–180 nm',
  'td.chip.bms.d': 'Measure the voltage and temperature of every battery cell to keep the pack safe and balanced.',
  'td.chip.drv.t': 'Gate drivers and regulators',
  'td.chip.drv.m': '130–350 nm',
  'td.chip.drv.d': 'Turn small control signals into the strong pulses that switch the power transistors, and supply every other chip.',
  'td.chip.radar.t': 'Radar chips',
  'td.chip.radar.m': '22–45 nm RF CMOS',
  'td.chip.radar.d': 'Send and receive 77 GHz radio waves to measure the distance and speed of the cars ahead.',
  'td.chip.net.t': 'In-car network chips',
  'td.chip.net.m': '40–180 nm',
  'td.chip.net.d': 'CAN and automotive Ethernet transceivers link the car\'s control units together.',
  'td.chip.ccam.t': 'Camera image sensors',
  'td.chip.ccam.m': 'Automotive grade, 40–90 nm',
  'td.chip.ccam.d': 'Surround-view and driver-assist cameras, built to see in glare and darkness.',
  'td.chip.csen.t': 'Sensors',
  'td.chip.csen.m': 'MEMS and magnetic sensors',
  'td.chip.csen.d': 'Tire pressure, motor position, battery current and the airbag\'s crash detectors.',
  'td.chip.cmem.t': 'DRAM and flash',
  'td.chip.cmem.m': 'Automotive-grade memory',
  'td.chip.cmem.d': 'Maps, camera recordings, software updates and the driver-assist computer\'s working memory.',
  'td.product.thermo.t': 'Smart thermostat',
  'td.chip.wmcu.t': 'Wi-Fi microcontroller',
  'td.chip.wmcu.m': '40 nm-class',
  'td.chip.wmcu.d': 'A low-power processor with Wi-Fi built in. Many new ones use RISC-V cores, because the open instruction set needs no licence.',
  'td.chip.tsen.t': 'Temperature and humidity sensor',
  'td.chip.tsen.m': 'CMOS sensor, 180 nm-class',
  'td.chip.tsen.d': 'Measures the room through a tiny opening in the case.',
  'td.chip.flash.t': 'Flash memory',
  'td.chip.flash.m': 'Serial NOR flash',
  'td.chip.flash.d': 'Stores the program and your schedule, and keeps them when the power goes out.',
  'td.chip.reg.t': 'Power regulator',
  'td.chip.reg.m': '180 nm and larger',
  'td.chip.reg.d': 'Turns the wall or battery supply into the 3.3 volts the other chips need.',
  'td.chip.disp.t': 'Display driver',
  'td.chip.disp.m': '40–110 nm',
  'td.chip.disp.d': 'Lights the numbers on the screen.',
  'td.product.laptop.t': 'Laptop',
  'td.chip.cpu.t': 'Processor (system on a chip)',
  'td.chip.cpu.m': '3 nm-class',
  'td.chip.cpu.d': 'CPU cores, graphics and an AI engine on one die, or on a few chiplets in one package.',
  'td.chip.gpu.t': 'Graphics chip (gaming models)',
  'td.chip.gpu.m': '4–5 nm',
  'td.chip.gpu.d': 'Thousands of small cores for games, video editing and local AI.',
  'td.chip.ldram.t': 'Memory (DRAM)',
  'td.chip.ldram.m': 'LPDDR5X or DDR5',
  'td.chip.ldram.d': 'Working memory for every open program.',
  'td.chip.ssdc.t': 'SSD controller',
  'td.chip.ssdc.m': '6–12 nm',
  'td.chip.ssdc.d': 'A processor that spreads writes evenly across the flash, corrects bit errors and hides how slow flash is.',
  'td.chip.lnand.t': 'SSD flash',
  'td.chip.lnand.m': '3D NAND',
  'td.chip.lnand.d': 'Your files, kept without power.',
  'td.chip.vr.t': 'Voltage regulators',
  'td.chip.vr.m': '90–180 nm power processes',
  'td.chip.vr.d': 'Dozens of power stages feed the processor tens of amps at under one volt, adjusting thousands of times a second.',
  'td.chip.lwifi.t': 'Wi-Fi and Bluetooth',
  'td.chip.lwifi.m': '6–16 nm',
  'td.chip.lwifi.d': 'Wireless networking with its own small processor.',
  'td.chip.usb.t': 'USB-C controllers',
  'td.chip.usb.m': '28–65 nm',
  'td.chip.usb.d': 'Negotiate how much charging power to accept and route high-speed signals to the right place.',
  'td.chip.ec.t': 'Embedded controller',
  'td.chip.ec.m': '40–90 nm',
  'td.chip.ec.d': 'A small microcontroller that runs the keyboard, fans and battery even while the main processor sleeps.',
  'td.chip.lcam.t': 'Webcam sensor',
  'td.chip.lcam.m': '40–65 nm',
  'td.chip.lcam.d': 'A small image sensor and its processor.',
  'td.chip.tpm.t': 'Security chip',
  'td.chip.tpm.m': '28–65 nm',
  'td.chip.tpm.d': 'Holds encryption keys and checks that the startup software has not been tampered with.',
  'td.product.server.t': 'AI server',
  'td.chip.agpu.t': 'AI accelerators (GPUs)',
  'td.chip.agpu.m': '4 nm moving to 3 nm, in CoWoS packages',
  'td.chip.agpu.d': 'Thousands of matrix-math units each, joined into one giant computer by a high-speed network.',
  'td.chip.hbm.t': 'HBM memory stacks',
  'td.chip.hbm.m': '8–16 DRAM dies stacked with through-silicon vias',
  'td.chip.hbm.d': 'Sits next to each GPU in the same package to deliver terabytes per second.',
  'td.chip.hcpu.t': 'Host CPUs',
  'td.chip.hcpu.m': '3 nm-class',
  'td.chip.hcpu.d': 'Run the operating system and feed work to the accelerators.',
  'td.chip.nic.t': 'Network chips',
  'td.chip.nic.m': '3–5 nm',
  'td.chip.nic.d': 'Network cards, data processing units and switches move data between thousands of GPUs.',
  'td.chip.opt.t': 'Optical transceivers',
  'td.chip.opt.m': 'Indium phosphide lasers plus 3–5 nm signal processors',
  'td.chip.opt.d': 'Turn electrical signals into light for links longer than a few meters.',
  'td.chip.spow.t': 'Power stages',
  'td.chip.spow.m': 'Silicon power processes plus gallium nitride (GaN)',
  'td.chip.spow.d': 'Convert 48–54 volt rack power down to under one volt at over a thousand amps per accelerator.',
  'td.chip.bmc.t': 'Management controller (BMC)',
  'td.chip.bmc.m': '28–40 nm',
  'td.chip.bmc.d': 'A small computer that watches fans, power and temperatures and lets operators restart the server remotely.',
  'td.chip.ret.t': 'Signal retimers',
  'td.chip.ret.m': '6–16 nm',
  'td.chip.ret.d': 'Clean up high-speed PCIe and CXL signals so they survive the trip across the board.',
  'td.chip.ssd.t': 'SSDs',
  'td.chip.ssd.m': '3D NAND and a controller',
  'td.chip.ssd.d': 'Hold datasets and model checkpoints.',
  'td.chip.sen.t': 'Sensors and fan controllers',
  'td.chip.sen.m': '65–180 nm',
  'td.chip.sen.d': 'Hundreds of temperature, current and airflow readings a second.',
  'td.product.phone.sum': 'The processor gets the headlines, but a phone holds dozens of chips from many different companies and factories.',
  'td.product.car.sum': 'When a few-dollar microcontroller went missing in the 2021 shortage, whole car factories stopped.',
  'td.product.thermo.sum': 'A whole product built from mature chips that cost a few dollars each. This is what most of the world\'s chips look like.',
  'td.product.laptop.sum': 'Like a phone, a laptop pairs one leading-edge processor with many ordinary chips around it.',
  'td.product.server.sum': 'Even here, where the newest chips are concentrated, older processes supply power, management and sensing.',
  'td.fit.kind.cpu.t': 'CPU',
  'td.fit.kind.cpu.d': 'General-purpose processor: runs any program, a few things at a time.',
  'td.fit.kind.mcu.t': 'Microcontroller',
  'td.fit.kind.mcu.d': 'A tiny, cheap processor with its own memory, built to sip power.',
  'td.fit.kind.gpu.t': 'GPU',
  'td.fit.kind.gpu.d': 'Thousands of simple cores doing the same math on lots of data.',
  'td.fit.kind.dsp.t': 'DSP',
  'td.fit.kind.dsp.d': 'A processor tuned for streams of signal math: audio, radio, sensors.',
  'td.fit.kind.fpga.t': 'FPGA',
  'td.fit.kind.fpga.d': 'A chip of blank logic you can rewire after it is made.',
  'td.fit.kind.asic.t': 'Custom chip (ASIC)',
  'td.fit.kind.asic.d': 'One job wired into silicon: the most efficient, the least flexible.',
  'td.fit.kind.power.t': 'Power chip',
  'td.fit.kind.power.d': 'Not computing at all: it switches and converts electrical energy.',
  'td.fit.job.laptop.t': 'Run a web browser, a spreadsheet and the odd game on a laptop',
  'td.fit.job.laptop.why': 'The software changes every day and nobody knows what you will run next, so you need a chip that can run anything. That is what a general-purpose CPU is for.',
  'td.fit.job.soil.t': 'Read a soil-moisture sensor once a minute for five years on two AA batteries',
  'td.fit.job.soil.why': 'A microcontroller sleeps at a few microwatts, wakes for a millisecond, takes a reading and sleeps again. It costs well under a dollar and has its memory built in.',
  'td.fit.job.train.t': 'Train a large language model',
  'td.fit.job.train.why': 'Training is enormous amounts of the same matrix math, and the models keep changing. GPUs offer that parallel math and stay programmable. Custom AI chips such as Google\'s TPUs are also a strong answer when you control the whole software stack.',
  'td.fit.job.video.t': 'Record 4K video on a phone without draining the battery',
  'td.fit.job.video.why': 'Video encoding never changes once the standard is set, and it runs for hours. Phones use a fixed-function encoder block. In a Stanford study, general-purpose processors needed about 500 times the energy of a custom encoder for the same job.',
  'td.fit.job.mine.t': 'Mine bitcoin',
  'td.fit.job.mine.why': 'One fixed calculation (the SHA-256 hash) repeated trillions of times a second, where energy cost decides profit. Mining moved from CPUs to GPUs to FPGAs and finally to custom chips that can do nothing else.',
  'td.fit.job.radio.t': 'Prototype a new radio standard that will change again next year, in a few hundred base stations',
  'td.fit.job.radio.why': 'Too few units to pay for a custom chip, and the standard is still moving. An FPGA can be rewired with a software update, and it is fast enough for real-time radio.',
  'td.fit.job.anc.t': 'Cancel noise in wireless earbuds in real time',
  'td.fit.job.anc.why': 'Noise cancelling is a non-stop stream of filter math on audio samples, within a battery the size of a pea. A DSP does exactly that kind of math efficiently while staying programmable for tuning. Many earbud chips add small custom blocks too.',
  'td.fit.job.motor.t': 'Turn an electric car\'s 800-volt battery into motor current',
  'td.fit.job.motor.why': 'This is not computing: it is switching hundreds of amps on and off thousands of times a second. Power transistors in silicon carbide do it with less heat. A microcontroller decides when to switch; the power chip does the switching.',
  'td.title': 'Look inside: what chips does it take?',
  'td.open': 'Open up',
  'td.by.label': 'Color the chips by',
  'td.by.job': 'What they do',
  'td.by.made': 'How they are made',
  'td.how': 'How it is made:',
  'td.map': 'See it on the map',
  'td.rd.kinds': 'Kinds of chips inside',
  'td.rd.lead': 'Need a leading-edge process',
  'td.rd.topics': 'Topics on this map they use',
  'td.rd.of': '{a} of {b}',
  'td.rd.topicsval': '{n} of the map\'s topics',
  'td.sum.none': 'None of these chips needs a leading-edge factory.',
  'td.sum.one': 'Only 1 of these {n} kinds of chips needs a leading-edge factory; the rest use older processes, memory processes or other materials.',
  'td.sum.some': 'Only {lead} of these {n} kinds of chips need a leading-edge factory; the rest use older processes, memory processes or other materials.',
  'td.sum.car': 'Only the newest driver-assist computers reach a leading-edge factory; everything else uses older processes, memory processes or other materials.',
  'td.sum.chipsPerCar': 'Chips per car: {v} (Yole).',
  'td.sum.legacyAuto': 'Made on mature processes: {v} (CSIS).',
  'td.note': 'A teaching model: each product shows typical kinds of chips, not one exact model, and many products merge or split these chips differently. Process ranges are typical for 2025–26 designs. "Leading edge" here means 5 nm-class and finer. Memory is made on its own processes, which do not map onto logic node names.',
  'td.fit.title': 'The right chip for the job',
  'td.fit.end.l': 'Runs anything',
  'td.fit.end.r': 'One job, efficiently',
  'td.fit.short.asic': 'ASIC',
  'td.fit.short.mcu': 'MCU',
  'td.fit.job': 'Job {n}',
  'td.fit.pick': 'Choose a chip for job {n}',
  'td.fit.best': 'Best fit.',
  'td.fit.ok': 'Good, but there is a better fit: {kind}.',
  'td.fit.no': 'Not the best fit. Try another chip.',
  'td.fit.show': 'Or show the answer',
  'td.fit.answer': 'The best fit is {kind}.',
  'td.fit.score': '{n} of {m} best fits',
  'td.fit.togo': '{n} to go',
  'td.fit.reset': 'Start again',
  'td.fit.note': 'Several jobs have more than one sensible answer, and real products often combine chips: a phone has a CPU, GPU, DSP and custom blocks on one die. The 500× figure comes from Hameed et al., ISCA 2010, for HD video encoding; the gap depends on the task.',
  'td.ch.newest.t': 'How many need the newest fab?',
  'td.ch.newest.goal': 'Open five products and count the chips that need a leading-edge process.',
  'td.ch.newest.done': 'Only a few kinds of chips across all five products need the newest factory; most use older, cheaper processes.',
  'td.ch.jobs.t': 'The right chip for the job',
  'td.ch.jobs.goal': 'Match eight real jobs to a CPU, GPU, FPGA, custom chip and more.',
  'td.ch.jobs.done': 'Every job has its best fit: the more fixed the job, the more specialized the chip can be.'
};
