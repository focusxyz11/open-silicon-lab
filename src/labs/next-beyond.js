/* Labs: BEYOND VON NEUMANN. Where the energy goes; the same job on ten machines; a frontier gallery. */
import { $ } from '../core/ui.js';
import { macEnergy } from '../engines/paradigms.js';
import { MACHINES, JOBS, STAGES, GALLERY, SAVES } from '../data/paradigms.js';
import { FACTS } from '../app/facts.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pj = v => v >= 100 ? Math.round(v).toLocaleString('en-US') + ' pJ' : v >= 1 ? v.toFixed(1) + ' pJ' : v.toFixed(2) + ' pJ';
const STAGE_PILL = ['out', 'out', 'proj', 'ann', 'ship'];

export function init() {
  energy(); machines(); gallery();
}

function energy() {
  if (!$('#bnBar')) return;
  let where = 'dram';
  const reuseOf = () => [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024][+$('#bnReuse').value];
  $('#bnWhere').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { where = b.dataset.w; draw(); } });
  $('#bnReuse').addEventListener('input', draw);
  function draw() {
    const reuse = reuseOf(), E = macEnergy(where, reuse);
    $('#bnWhere').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.w === where));
    $('#bnReuseO').textContent = reuse === 1 ? 'once' : reuse.toLocaleString('en-US') + '×';
    $('#bnMath').textContent = pj(E.math); $('#bnMove').textContent = pj(E.move); $('#bnShare').textContent = (E.share * 100).toFixed(E.share > 0.995 ? 2 : 0) + '%';
    const m = E.math / E.total * 100;
    $('#bnBar').innerHTML = '<div style="flex:' + m + ' 0 0;background:var(--amber-fill)"><span>math</span></div><div style="flex:' + (100 - m) + ' 0 0;background:var(--cyan-fill)"><span>moving data</span></div>';
    $('#bnTag').textContent = (E.total / E.math).toFixed(E.total / E.math < 10 ? 1 : 0) + '× the energy of the math alone';
    $('#bnTxt').textContent = where === 'dram' && reuse === 1 ? 'Fetching both numbers from DRAM costs over 1,000 times more than the multiply-add itself. This is the von Neumann bottleneck in one number.'
      : where === 'rf' ? 'With the numbers right beside the arithmetic, moving them costs less than the math itself. Every architecture in this layer tries to get closer to this case.'
        : E.share > 0.5 ? 'Reuse helps: each fetch is shared by ' + reuse + ' operations. Caches, batching and systolic arrays all work this way, but moving data still dominates.' : 'With enough reuse, the math finally dominates. Compute-in-memory and dataflow chips try to get here without needing huge reuse.';
  }
  draw();
}

function machines() {
  if (!$('#smGrid')) return;
  let job = JOBS[1].id;
  $('#smJobs').innerHTML = JOBS.map(j => '<button type="button" data-j="' + j.id + '">' + esc(j.t) + '</button>').join('');
  $('#smJobs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { job = b.dataset.j; draw(); } });
  function draw() {
    const J = JOBS.find(j => j.id === job);
    $('#smJobs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.j === job));
    $('#smJobD').textContent = J.d;
    const rows = MACHINES.map(m => ({ m, f: J.fit[m[0]] || [0, 'Not built for this job.'] })).sort((a, b) => b.f[0] - a.f[0] || b.m[3] - a.m[3]);
    $('#smGrid').innerHTML = rows.map(({ m, f }) => '<a class="smcard f' + f[0] + '" href="#' + m[2] + '"><span class="dots" aria-label="Fit ' + f[0] + ' of 3">' + '●'.repeat(f[0]) + '<i>' + '●'.repeat(3 - f[0]) + '</i></span><b>' + esc(m[1]) + '</b><small>' + esc(f[1]) + '</small><span class="pill ' + STAGE_PILL[m[3]] + '">' + STAGES[m[3]] + '</span></a>').join('');
  }
  draw();
}

function gallery() {
  if (!$('#fgBoard')) return;
  let saves = '', sel = GALLERY[0][0];
  $('#fgSaves').innerHTML = '<button type="button" data-s="">All</button>' + Object.entries(SAVES).map(([k, v]) => '<button type="button" data-s="' + k + '">' + v + '</button>').join('');
  $('#fgSaves').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { saves = b.dataset.s; draw(); } });
  $('#fgBoard').addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) { sel = b.dataset.g; draw(); } });
  function draw() {
    $('#fgSaves').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.s === saves));
    const shown = GALLERY.filter(g => !saves || g[3] === saves);
    if (!shown.some(g => g[0] === sel) && shown.length) sel = shown[0][0];
    $('#fgBoard').innerHTML = STAGES.map((st, i) => '<div class="fgcol"><p class="eyebrow">' + st + '</p>' + shown.filter(g => g[2] === i).map(g => '<button type="button" data-g="' + g[0] + '" aria-pressed="' + (g[0] === sel) + '"><b>' + esc(g[1]) + '</b><small>' + esc(SAVES[g[3]]) + '</small></button>').join('') + '</div>').join('');
    $('#fgTag').textContent = shown.length + ' of ' + GALLERY.length + ' ideas';
    const g = GALLERY.find(x => x[0] === sel);
    if (!g) { $('#fgDetail').innerHTML = ''; return; }
    const f = g[7] ? FACTS.facts.find(x => x.id === g[7]) : null;
    $('#fgDetail').innerHTML = '<p class="code">' + STAGES[g[2]] + ' · saves ' + esc(SAVES[g[3]].toLowerCase()) + '</p><h3>' + esc(g[1]) + '</h3><p>' + esc(g[4]) + '</p><p class="small"><b>Latest signal:</b> ' + esc(g[5]) + (f && /^https:\/\//.test(f.url) ? ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">Source</a>' : '') + '</p><p class="small"><b>The catch:</b> ' + esc(g[6]) + '</p>';
  }
  draw();
}
