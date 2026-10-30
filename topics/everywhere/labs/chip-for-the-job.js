/* Lab: THE RIGHT CHIP FOR THE JOB. Every chip sits on a line from flexible to efficient.
   Match eight real jobs to the kind of chip that suits them best. */
import { $ } from 'osl/core/ui.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Kinds of chip, from most flexible to most specialized. pos: place on the line, 0 to 1. */
export const KINDS = [
  { id: 'cpu', t: 'CPU', d: 'General-purpose processor: runs any program, a few things at a time.', pos: 0.04 },
  { id: 'mcu', t: 'Microcontroller', d: 'A tiny, cheap processor with its own memory, built to sip power.', pos: 0.2 },
  { id: 'gpu', t: 'GPU', d: 'Thousands of simple cores doing the same math on lots of data.', pos: 0.38 },
  { id: 'dsp', t: 'DSP', d: 'A processor tuned for streams of signal math: audio, radio, sensors.', pos: 0.52 },
  { id: 'fpga', t: 'FPGA', d: 'A chip of blank logic you can rewire after it is made.', pos: 0.68 },
  { id: 'asic', t: 'Custom chip (ASIC)', d: 'One job wired into silicon: the most efficient, the least flexible.', pos: 0.94 },
  { id: 'power', t: 'Power chip', d: 'Not computing at all: it switches and converts electrical energy.', pos: null }
];

/* best: the best fit; ok: also sensible; why: the explanation shown after a choice. */
export const JOBS = [
  { id: 'laptop', t: 'Run a web browser, a spreadsheet and the odd game on a laptop', best: 'cpu', ok: [], why: 'The software changes every day and nobody knows what you will run next, so you need a chip that can run anything. That is what a general-purpose CPU is for.' },
  { id: 'soil', t: 'Read a soil-moisture sensor once a minute for five years on two AA batteries', best: 'mcu', ok: [], why: 'A microcontroller sleeps at a few microwatts, wakes for a millisecond, takes a reading and sleeps again. It costs well under a dollar and has its memory built in.' },
  { id: 'train', t: 'Train a large language model', best: 'gpu', ok: ['asic'], why: 'Training is enormous amounts of the same matrix math, and the models keep changing. GPUs offer that parallel math and stay programmable. Custom AI chips such as Google\'s TPUs are also a strong answer when you control the whole software stack.' },
  { id: 'video', t: 'Record 4K video on a phone without draining the battery', best: 'asic', ok: ['dsp'], why: 'Video encoding never changes once the standard is set, and it runs for hours. Phones use a fixed-function encoder block. In a Stanford study, general-purpose processors needed about 500 times the energy of a custom encoder for the same job.' },
  { id: 'mine', t: 'Mine bitcoin', best: 'asic', ok: [], why: 'One fixed calculation (the SHA-256 hash) repeated trillions of times a second, where energy cost decides profit. Mining moved from CPUs to GPUs to FPGAs and finally to custom chips that can do nothing else.' },
  { id: 'radio', t: 'Prototype a new radio standard that will change again next year, in a few hundred base stations', best: 'fpga', ok: ['dsp'], why: 'Too few units to pay for a custom chip, and the standard is still moving. An FPGA can be rewired with a software update, and it is fast enough for real-time radio.' },
  { id: 'anc', t: 'Cancel noise in wireless earbuds in real time', best: 'dsp', ok: ['asic'], why: 'Noise cancelling is a non-stop stream of filter math on audio samples, within a battery the size of a pea. A DSP does exactly that kind of math efficiently while staying programmable for tuning. Many earbud chips add small custom blocks too.' },
  { id: 'motor', t: 'Turn an electric car\'s 800-volt battery into motor current', best: 'power', ok: [], why: 'This is not computing: it is switching hundreds of amps on and off thousands of times a second. Power transistors in silicon carbide do it with less heat. A microcontroller decides when to switch; the power chip does the switching.' }
];

const KEY = 'osl-jobs-v1';

export function init() {
  if (!$('#jbJobs')) return;
  let A = {}; try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object') A = j; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) { /* ignore */ } };
  const kind = id => KINDS.find(k => k.id === id);
  $('#jbSpec').innerHTML = '<div class="jbline"><span class="end">Runs anything</span><span class="end r">One job, efficiently</span>' + KINDS.filter(k => k.pos !== null).map(k => '<i style="left:' + (k.pos * 100) + '%" data-k="' + k.id + '"><b>' + esc(k.id === 'asic' ? 'ASIC' : k.id === 'mcu' ? 'MCU' : k.t) + '</b></i>').join('') + '</div>';
  function draw() {
    $('#jbJobs').innerHTML = JOBS.map((j, n) => {
      const a = A[j.id]; const verdict = !a ? '' : a === j.best ? 'best' : j.ok.includes(a) ? 'ok' : 'no';
      return '<article class="jbjob' + (verdict ? ' ' + verdict : '') + '"><p class="code">Job ' + (n + 1) + '</p><h4>' + esc(j.t) + '</h4><div class="seg" role="group" aria-label="Choose a chip for job ' + (n + 1) + '">' + KINDS.map(k => '<button type="button" data-j="' + j.id + '" data-k="' + k.id + '" aria-pressed="' + (a === k.id) + '" title="' + esc(k.d) + '">' + esc(k.t) + '</button>').join('') + '</div>' +
        (a ? '<p class="small jbwhy"><b>' + (verdict === 'best' ? 'Best fit.' : verdict === 'ok' ? 'Good, but there is a better fit: ' + esc(kind(j.best).t) + '.' : 'Not the best fit. Try another chip.') + '</b> ' + (verdict === 'no' ? '' : esc(j.why)) + (verdict === 'no' ? '<button type="button" class="linkish" data-why="' + j.id + '">Or show the answer</button>' : '') + '</p>' : '') + '</article>';
    }).join('');
    const best = JOBS.filter(j => A[j.id] === j.best).length, done = JOBS.filter(j => A[j.id]).length;
    $('#jbScore').textContent = best + ' of ' + JOBS.length + ' best fits' + (done && done < JOBS.length ? ' · ' + (JOBS.length - done) + ' to go' : '');
  }
  $('#jbJobs').addEventListener('click', e => {
    const w = e.target.closest('[data-why]'); if (w) { const j = JOBS.find(x => x.id === w.dataset.why); w.parentElement.innerHTML = '<b>The best fit is ' + esc(kind(j.best).t) + '.</b> ' + esc(j.why); return; }
    const b = e.target.closest('button[data-j]'); if (!b) return; A[b.dataset.j] = b.dataset.k; save(); draw();
  });
  $('#jbReset').addEventListener('click', () => { A = {}; save(); draw(); });
  draw();
}
