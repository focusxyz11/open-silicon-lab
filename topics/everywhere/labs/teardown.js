/* Lab: LOOK INSIDE. Open a product and see the kinds of chips it holds, colored by what they do
   or by how they are made, with links to the topics on the map that explain each one. */
import { $ } from 'osl/core/ui.js';
import { FACTS } from 'osl/app/facts.js';
import { topicById } from 'osl/data/topics.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* What a chip does. */
export const JOBS = {
  proc: ['Processors & logic', 'var(--cyan-fill)'],
  mem: ['Memory', 'var(--violet)'],
  power: ['Power & analog', 'var(--amber-fill)'],
  radio: ['Radio & connectivity', 'var(--rose)'],
  sense: ['Sensors', 'var(--good)']
};
/* How it is made. */
export const NODES = {
  lead: ['Leading edge (3–5 nm)', 'var(--bad)'],
  adv: ['Advanced (6–16 nm)', 'var(--amber-fill)'],
  mat: ['Mature (22 nm and larger)', 'var(--cyan-fill)'],
  mem: ['Memory process', 'var(--violet)'],
  spec: ['Other materials or MEMS', 'var(--good)']
};

/* [id, name, job, node, process detail, what it does, topics, big?] */
export const PRODUCTS = [
  { id: 'phone', t: 'Smartphone', chips: [
    ['ap', 'Application processor', 'proc', 'lead', '3 nm-class', 'CPU cores, graphics, the AI engine (NPU), the camera\'s image processor and video codecs, all on one die: a system on a chip.', ['architecture', 'accelerators', 'transistor'], 1],
    ['modem', '5G modem', 'radio', 'lead', '4–5 nm', 'Turns radio waves into data with heavy digital signal processing. In many phones it sits inside the application processor.', ['architecture']],
    ['dram', 'Main memory (DRAM)', 'mem', 'mem', 'LPDDR5X, often stacked on top of the processor', 'Holds the apps that are running. Each bit is a tiny capacitor that leaks and must be refreshed many times a second.', ['datacenter', 'package']],
    ['nand', 'Storage (3D NAND flash)', 'mem', 'mem', 'Cells stacked 200+ layers high', 'Photos, apps and the operating system. Bits are trapped charge that stays put without power.', ['datacenter']],
    ['pmic', 'Power management chips', 'power', 'mat', '40–180 nm', 'Turn the battery\'s 4 volts into a dozen precise voltages, charge the battery and switch whole sections off to save energy.', ['physics', 'design']],
    ['rffe', 'RF front end', 'radio', 'spec', 'Gallium arsenide amplifiers, RF silicon-on-insulator switches', 'Amplifies the signal going out to the antenna and filters what comes back. Gallium arsenide handles high-frequency power better than silicon.', ['physics']],
    ['wifi', 'Wi-Fi and Bluetooth', 'radio', 'adv', '6–16 nm', 'Short-range radios with their own small processor.', ['architecture']],
    ['cam', 'Camera image sensors', 'sense', 'mat', 'Pixel wafer (40–65 nm) bonded face to face to a logic wafer', 'Millions of photodiodes turn light into charge. Two wafers are bonded together: one for the pixels, one for the readout circuits.', ['physics', 'package']],
    ['mems', 'Motion sensors', 'sense', 'spec', 'MEMS: microscopic moving silicon', 'An accelerometer and gyroscope made of tiny silicon springs and weights that shift when the phone moves.', ['physics', 'fab']],
    ['touch', 'Touch and display controllers', 'proc', 'mat', '28–65 nm', 'Scan the touch grid hundreds of times a second and drive every pixel of the screen.', ['design']],
    ['audio', 'Audio chips', 'power', 'mat', '40–180 nm', 'Convert sound between analog and digital and drive the speakers.', ['design']],
    ['se', 'Secure element and NFC', 'proc', 'mat', '28–40 nm', 'A small tamper-resistant processor that keeps payment keys away from the rest of the phone.', ['architecture']]
  ] },
  { id: 'car', t: 'Electric car', chips: [
    ['adas', 'Driver-assistance computer', 'proc', 'adv', '7–8 nm typical, newest designs at 4 nm', 'Combines cameras and radar with an AI accelerator to keep the car in its lane and brake for obstacles.', ['accelerators', 'compute'], 1],
    ['info', 'Infotainment processor', 'proc', 'adv', '7–8 nm typical', 'Runs the screens, maps and music: a phone-class processor qualified to survive a car\'s heat and vibration.', ['architecture']],
    ['mcu', 'Microcontrollers (dozens)', 'proc', 'mat', '28–90 nm with built-in flash memory', 'Small processors in every control unit: brakes, airbags, steering, windows, seats and lights. Built to work for 15 years from −40 to 150 °C.', ['architecture', 'riscv']],
    ['inv', 'Motor inverter switches', 'power', 'spec', 'Silicon carbide (SiC)', 'Switch hundreds of amps at 400 to 800 volts to drive the motor. Silicon carbide\'s wide band gap wastes less energy as heat than silicon does.', ['physics']],
    ['bms', 'Battery management chips', 'power', 'mat', '130–180 nm', 'Measure the voltage and temperature of every battery cell to keep the pack safe and balanced.', ['physics', 'design']],
    ['drv', 'Gate drivers and regulators', 'power', 'mat', '130–350 nm', 'Turn small control signals into the strong pulses that switch the power transistors, and supply every other chip.', ['physics']],
    ['radar', 'Radar chips', 'radio', 'mat', '22–45 nm RF CMOS', 'Send and receive 77 GHz radio waves to measure the distance and speed of the cars ahead.', ['transistor']],
    ['net', 'In-car network chips', 'radio', 'mat', '40–180 nm', 'CAN and automotive Ethernet transceivers link the car\'s control units together.', ['design']],
    ['ccam', 'Camera image sensors', 'sense', 'mat', 'Automotive grade, 40–90 nm', 'Surround-view and driver-assist cameras, built to see in glare and darkness.', ['physics']],
    ['csen', 'Sensors', 'sense', 'spec', 'MEMS and magnetic sensors', 'Tire pressure, motor position, battery current and the airbag\'s crash detectors.', ['physics']],
    ['cmem', 'DRAM and flash', 'mem', 'mem', 'Automotive-grade memory', 'Maps, camera recordings, software updates and the driver-assist computer\'s working memory.', ['datacenter']]
  ] },
  { id: 'thermo', t: 'Smart thermostat', chips: [
    ['wmcu', 'Wi-Fi microcontroller', 'proc', 'mat', '40 nm-class', 'A low-power processor with Wi-Fi built in. Many new ones use RISC-V cores, because the open instruction set needs no licence.', ['riscv', 'architecture'], 1],
    ['tsen', 'Temperature and humidity sensor', 'sense', 'mat', 'CMOS sensor, 180 nm-class', 'Measures the room through a tiny opening in the case.', ['physics']],
    ['flash', 'Flash memory', 'mem', 'mem', 'Serial NOR flash', 'Stores the program and your schedule, and keeps them when the power goes out.', ['datacenter']],
    ['reg', 'Power regulator', 'power', 'mat', '180 nm and larger', 'Turns the wall or battery supply into the 3.3 volts the other chips need.', ['physics']],
    ['disp', 'Display driver', 'proc', 'mat', '40–110 nm', 'Lights the numbers on the screen.', ['design']]
  ] },
  { id: 'laptop', t: 'Laptop', chips: [
    ['cpu', 'Processor (system on a chip)', 'proc', 'lead', '3 nm-class', 'CPU cores, graphics and an AI engine on one die, or on a few chiplets in one package.', ['architecture', 'package'], 1],
    ['gpu', 'Graphics chip (gaming models)', 'proc', 'lead', '4–5 nm', 'Thousands of small cores for games, video editing and local AI.', ['accelerators']],
    ['ldram', 'Memory (DRAM)', 'mem', 'mem', 'LPDDR5X or DDR5', 'Working memory for every open program.', ['datacenter']],
    ['ssdc', 'SSD controller', 'proc', 'adv', '6–12 nm', 'A processor that spreads writes evenly across the flash, corrects bit errors and hides how slow flash is.', ['architecture']],
    ['lnand', 'SSD flash', 'mem', 'mem', '3D NAND', 'Your files, kept without power.', ['datacenter']],
    ['vr', 'Voltage regulators', 'power', 'mat', '90–180 nm power processes', 'Dozens of power stages feed the processor tens of amps at under one volt, adjusting thousands of times a second.', ['physics']],
    ['lwifi', 'Wi-Fi and Bluetooth', 'radio', 'adv', '6–16 nm', 'Wireless networking with its own small processor.', ['architecture']],
    ['usb', 'USB-C controllers', 'power', 'mat', '28–65 nm', 'Negotiate how much charging power to accept and route high-speed signals to the right place.', ['design']],
    ['ec', 'Embedded controller', 'proc', 'mat', '40–90 nm', 'A small microcontroller that runs the keyboard, fans and battery even while the main processor sleeps.', ['architecture']],
    ['lcam', 'Webcam sensor', 'sense', 'mat', '40–65 nm', 'A small image sensor and its processor.', ['physics']],
    ['tpm', 'Security chip', 'proc', 'mat', '28–65 nm', 'Holds encryption keys and checks that the startup software has not been tampered with.', ['architecture']]
  ] },
  { id: 'server', t: 'AI server', chips: [
    ['agpu', 'AI accelerators (GPUs)', 'proc', 'lead', '4 nm moving to 3 nm, in CoWoS packages', 'Thousands of matrix-math units each, joined into one giant computer by a high-speed network.', ['accelerators', 'compute', 'package'], 1],
    ['hbm', 'HBM memory stacks', 'mem', 'mem', '8–16 DRAM dies stacked with through-silicon vias', 'Sits next to each GPU in the same package to deliver terabytes per second.', ['package', 'datacenter']],
    ['hcpu', 'Host CPUs', 'proc', 'lead', '3 nm-class', 'Run the operating system and feed work to the accelerators.', ['architecture']],
    ['nic', 'Network chips', 'radio', 'lead', '3–5 nm', 'Network cards, data processing units and switches move data between thousands of GPUs.', ['datacenter']],
    ['opt', 'Optical transceivers', 'radio', 'spec', 'Indium phosphide lasers plus 3–5 nm signal processors', 'Turn electrical signals into light for links longer than a few metres.', ['datacenter', 'package']],
    ['spow', 'Power stages', 'power', 'spec', 'Silicon power processes plus gallium nitride (GaN)', 'Convert 48–54 volt rack power down to under one volt at over a thousand amps per accelerator.', ['physics', 'datacenter']],
    ['bmc', 'Management controller (BMC)', 'proc', 'mat', '28–40 nm', 'A small computer that watches fans, power and temperatures and lets operators restart the server remotely.', ['architecture']],
    ['ret', 'Signal retimers', 'radio', 'adv', '6–16 nm', 'Clean up high-speed PCIe and CXL signals so they survive the trip across the board.', ['design']],
    ['ssd', 'SSDs', 'mem', 'mem', '3D NAND and a controller', 'Hold datasets and model checkpoints.', ['datacenter']],
    ['sen', 'Sensors and fan controllers', 'sense', 'mat', '65–180 nm', 'Hundreds of temperature, current and airflow readings a second.', ['physics']]
  ] }
];

const fact = id => (FACTS.facts.find(f => f.id === id) || {}).value || '';
function summary(p, lead, n) {
  const base = p.id === 'car' ? 'Only the newest driver-assist computers reach a leading-edge factory; everything else uses older processes, memory processes or other materials.' : lead === 0 ? 'None of these chips needs a leading-edge factory.' : 'Only ' + lead + ' of these ' + n + ' kinds of chips need' + (lead === 1 ? 's' : '') + ' a leading-edge factory; the rest use older processes, memory processes or other materials.';
  const per = {
    phone: ' The processor gets the headlines, but a phone holds dozens of chips from many different companies and factories.',
    car: (fact('chips-per-car') ? ' Chips per car: ' + fact('chips-per-car').replace(/^A/, 'a') + ' (Yole).' : '') + (fact('legacy-auto') ? ' Made on mature processes: ' + fact('legacy-auto') + ' (CSIS).' : '') + ' When a few-dollar microcontroller went missing in the 2021 shortage, whole car factories stopped.',
    thermo: ' A whole product built from mature chips that cost a few dollars each. This is what most of the world\'s chips look like.',
    laptop: ' Like a phone, a laptop pairs one leading-edge processor with many ordinary chips around it.',
    server: ' Even here, where the newest chips are concentrated, older processes supply power, management and sensing.'
  }[p.id];
  return base + per;
}

export function init() {
  if (!$('#tdBoard')) return;
  const S = { p: 'phone', by: 'job', sel: null };
  const prod = () => PRODUCTS.find(p => p.id === S.p);
  $('#tdProd').innerHTML = PRODUCTS.map(p => '<button type="button" data-p="' + p.id + '">' + esc(p.t) + '</button>').join('');
  $('#tdProd').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.p = b.dataset.p; S.sel = null; draw(); });
  $('#tdBy').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.by = b.dataset.by; draw(); });
  $('#tdBoard').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.sel = b.dataset.c; draw(); });
  function draw() {
    const p = prod(); const map = S.by === 'job' ? JOBS : NODES;
    $('#tdProd').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === S.p));
    $('#tdBy').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.by === S.by));
    const used = new Set(p.chips.map(c => S.by === 'job' ? c[2] : c[3]));
    $('#tdLeg').innerHTML = Object.entries(map).filter(([k]) => used.has(k)).map(([, v]) => '<span><i style="background:' + v[1] + '"></i>' + esc(v[0]) + '</span>').join('');
    if (!S.sel || !p.chips.some(c => c[0] === S.sel)) S.sel = p.chips[0][0];
    $('#tdBoard').innerHTML = p.chips.map(c => { const col = (S.by === 'job' ? JOBS[c[2]] : NODES[c[3]])[1]; return '<button type="button" class="tdchip' + (c[7] ? ' big' : '') + '" data-c="' + c[0] + '" aria-pressed="' + (c[0] === S.sel) + '" style="--cc:' + col + '"><b>' + esc(c[1]) + '</b><small>' + esc(S.by === 'job' ? JOBS[c[2]][0] : c[4]) + '</small></button>'; }).join('');
    const c = p.chips.find(x => x[0] === S.sel);
    $('#tdDetail').innerHTML = '<p class="code">' + esc(p.t) + '</p><h3>' + esc(c[1]) + '</h3><div class="row"><span class="tag" style="--c:' + JOBS[c[2]][1] + '">' + esc(JOBS[c[2]][0]) + '</span><span class="tag" style="--c:' + NODES[c[3]][1] + '">' + esc(NODES[c[3]][0]) + '</span></div><p>' + esc(c[5]) + '</p><p class="small"><b>How it is made:</b> ' + esc(c[4]) + '.</p><p class="eyebrow">See it on the map</p><div class="row">' + c[6].map(id => '<a class="chip" href="#' + id + '">' + esc((topicById(id) || { t: id }).t) + '</a>').join('') + '</div>';
    const lead = p.chips.filter(x => x[3] === 'lead').length; const topics = new Set(p.chips.flatMap(x => x[6]));
    $('#tdKinds').textContent = p.chips.length;
    $('#tdLead').textContent = lead + ' of ' + p.chips.length;
    $('#tdTopics').textContent = topics.size + ' of the map\'s topics';
    $('#tdTag').textContent = p.t;
    $('#tdSum').textContent = summary(p, lead, p.chips.length);
  }
  draw();
}
