/* Labs: The shared tile, Add your design, and The whole chip. The checks and the chip's files come
   from src/engines/community.js (tested); the designs from community/ via src/generated/community.js.
   The site calls init(section) once, after this topic's content is on the page. */
import { $, T, fit, watch, rgba } from 'osl/core/ui.js';
import TC from 'osl/engines/tinychip.js';
import * as CM from 'osl/engines/community.js';
import { zip } from 'osl/engines/export.js';
import { COMMUNITY, LIMITS, CELLS } from 'osl/generated/community.js';
import { chipDesign } from 'osl/app/mychip.js';
import { REPO_URL } from 'osl/app/config.js';
import { FACTS, fmtDate } from 'osl/app/facts.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PALETTE = ['#5fb7a8', '#9b8ce0', '#d6a35a', '#7f9fe0', '#c58ab3', '#8fb36a', '#e07a5f', '#6aa9c9'];

export function init() {
  if (!$('#cmCv')) return;
  const sh = FACTS.facts.find(f => f.id === 'tt-next-shuttle');
  if (sh) $('#cmShuttle').textContent = 'Next: ' + sh.value + ' (' + sh.source + ', checked ' + fmtDate(sh.verified) + ').';
  tileLab(); yoursLab(); filesLab();
}

/* ---------- The shared tile ---------- */
let pick = 0, yours = null;
function layout(w, h) {
  /* each design is a square whose area is its share of the tile's cell budget, laid out in reading order */
  const items = COMMUNITY.map(d => ({ d, cells: d.cells })).concat(yours ? [{ d: yours, cells: yours.cells, yours: true }] : []);
  const pad = 16, top = 40, W = w - 2 * pad, H = h - top - pad, A = W * H, out = []; let x = pad, y = top, rowH = 0;
  items.forEach(it => { const side = Math.max(26, Math.sqrt(it.cells / LIMITS.cellsTotal * A)); if (x + side > pad + W) { x = pad; y += rowH + 6; rowH = 0; } out.push({ ...it, x, y, w: side, h: side }); x += side + 6; rowH = Math.max(rowH, side); });
  return { out, pad, W, H };
}
function tileLab() {
  const cv = $('#cmCv');
  cv.addEventListener('click', e => {
    const rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
    const L = layout(rc.width, rc.height).out, k = L.findIndex(s => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
    if (k < 0) return; pick = L[k].yours ? -1 : k; draw(); info();
  });
  const authors = new Set(COMMUNITY.map(d => d.author));
  $('#cmN').textContent = COMMUNITY.length + ' of ' + LIMITS.designs; $('#cmCells').textContent = CELLS + ' of ' + LIMITS.cellsTotal;
  $('#cmRoom').textContent = Math.round((1 - CELLS / LIMITS.cellsTotal) * 100) + '%'; $('#cmWho').textContent = authors.size;
  $('#cmTag').textContent = COMMUNITY.length + ' designs';
  function draw() {
    const { ctx: c, w, h } = fit(cv); c.clearRect(0, 0, w, h);
    c.fillStyle = '#1f2326'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#30344f'; c.fillRect(8, 8, w - 16, h - 16);
    c.fillStyle = '#e8eef2'; c.font = '600 12px "IBM Plex Mono", monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('ONE TILE · ' + CELLS + (yours ? ' + ' + yours.cells : '') + ' / ' + LIMITS.cellsTotal + ' CELLS', 16, 24);
    const L = layout(w, h); c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '12px "IBM Plex Sans", sans-serif'; c.textAlign = 'center'; c.fillText('room for about ' + (LIMITS.cellsTotal - CELLS - (yours ? yours.cells : 0)) + ' more cells', w / 2, h * 0.72);
    L.out.forEach((s, k) => {
      const col = s.yours ? '#f0b13c' : PALETTE[k % PALETTE.length];
      c.fillStyle = rgba(col, s.yours ? 0.25 : 0.7); c.fillRect(s.x, s.y, s.w, s.h);
      if (s.yours) { c.strokeStyle = col; c.setLineDash([4, 3]); c.lineWidth = 2; c.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2); c.setLineDash([]); }
      if ((s.yours && pick === -1) || (!s.yours && k === pick)) { c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.strokeRect(s.x - 1, s.y - 1, s.w + 2, s.h + 2); }
      if (s.w > 20) { c.fillStyle = '#10161a'; c.textBaseline = 'middle'; c.font = '600 11px "IBM Plex Sans", sans-serif'; c.textAlign = 'center'; c.fillText(s.yours ? (s.w > 50 ? 'yours?' : 'you') : String(s.d.sel), s.x + s.w / 2, s.y + s.h / 2); }
    });
  }
  function info() {
    const box = $('#cmInfo'), d = pick === -1 ? yours : COMMUNITY[pick];
    if (!d) { box.innerHTML = '<p class="small">No designs yet.</p>'; return; }
    box.innerHTML = '<p class="eyebrow">' + (pick === -1 ? 'Your design (not on the chip yet)' : 'Selector ' + d.sel) + '</p><h3 class="cmh">' + esc(d.title) + '</h3><p class="small muted">by ' + esc(d.author) + (d.project ? ' · checked against the studio\'s ' + esc((TC.PROJ.find(p => p.id === d.project) || {}).t || d.project) + ' specification' : '') + '</p>' +
      (d.description ? '<p>' + esc(d.description) + '</p>' : '') +
      '<div class="readout col"><div><span>Cells</span><b>' + d.cells + '</b></div><div><span>Transistors</span><b>' + d.tr + '</b></div>' + (d.flops ? '<div><span>Flip-flops</span><b>' + d.flops + '</b></div>' : '') + '<div><span>Fastest clock at 130 nm</span><b>' + d.fmaxMHz + ' MHz</b></div></div>' +
      '<p class="small">Pins: ' + d.ins.map((n, i) => 'ui[' + i + '] ' + esc(n)).join(', ') + ' → ' + d.outs.map((n, i) => 'uo[' + i + '] ' + esc(n)).join(', ') + (d.seq ? ' · clocked' : '') + '</p>' +
      '<pre class="cmfile">' + esc(d.code) + '</pre>';
  }
  tileLab.redraw = () => { draw(); info(); };
  watch(cv, draw); draw(); info();
}

/* ---------- Add your design ---------- */
function yoursLab() {
  const box = $('#cmYours'), form = $('#cmForm');
  const d = chipDesign(), proj = TC.PROJ.find(p => p.id === d.p) || TC.PROJ[0];
  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const already = COMMUNITY.some(x => x.code.trim() === String(d.code).trim());
  const fromProject = proj.id !== 'free';
  $('#cmTitle').value = proj.t === 'Your own design' ? 'My design' : 'My ' + proj.t.toLowerCase();
  $('#cmSlug').value = slugify($('#cmTitle').value);
  ['#cmTitle', '#cmAuthor', '#cmDesc', '#cmSlug'].forEach(id => $(id).addEventListener('input', e => { if (id === '#cmTitle' && !$('#cmSlug').dataset.touched) $('#cmSlug').value = slugify($('#cmTitle').value); if (id === '#cmSlug') $('#cmSlug').dataset.touched = '1'; update(); }));
  box.innerHTML = '<p>Your current design in the tiny chip studio: <b>' + esc(proj.t) + '</b>. <a href="#lab-tiny-1">Open the studio</a> to change it; this page uses whatever you designed last.</p>';
  form.hidden = false;
  function file() {
    const title = $('#cmTitle').value.trim(), author = $('#cmAuthor').value.trim(), description = $('#cmDesc').value.trim(), slug = $('#cmSlug').value.trim();
    const base = { slug, title, author, description, code: d.code };
    const dd = fromProject ? { ...base, project: proj.id } : { ...base, ins: proj.ins, outs: proj.outs };
    return { dd, text: CM.designFile(dd, new Date().toISOString().slice(0, 10)) };
  }
  function update() {
    const { dd, text } = file(), r = CM.check(dd), taken = COMMUNITY.some(x => x.slug === dd.slug);
    $('#cmSlugO').textContent = 'community/' + (dd.slug || '…') + '/';
    const room = LIMITS.cellsTotal - CELLS;
    const probs = r.problems.map(p => p.replace(/^[a-z0-9-]+: /, '')).concat(taken ? ['that folder name is taken; choose another'] : []).concat(r.ok && r.stats.cells > room ? ['the tile has room for ' + room + ' more cells, and this design needs ' + r.stats.cells] : []).concat(already ? ['this exact design is already on the chip'] : []);
    const ok = !probs.length;
    $('#cmCheck').innerHTML = ok ? '<b style="color:var(--good)">✓ Ready.</b> It passes every check: ' + r.stats.cells + ' cells, ' + r.stats.tr + ' transistors, verified' + (fromProject && proj.f ? ' against the ' + esc(proj.t) + ' specification' : '') + '.'
      : '<b style="color:var(--bad)">Not ready yet:</b> ' + probs.map(esc).join('; ') + '.';
    $('#cmYTag').textContent = ok ? 'Ready to propose' : 'Not ready';
    $('#cmFile').textContent = text;
    const a = $('#cmPropose');
    if (ok) { a.href = REPO_URL + '/new/main?' + new URLSearchParams({ filename: 'community/' + dd.slug + '/design.json', value: text }).toString(); a.removeAttribute('aria-disabled'); }
    else { a.removeAttribute('href'); a.setAttribute('aria-disabled', 'true'); }
    yours = r.ok ? { title: dd.title || 'Your design', author: dd.author || 'you', description: dd.description, cells: r.stats.cells, tr: r.stats.tr, fmaxMHz: r.stats.fmaxMHz, flops: r.stats.flops, ins: proj.ins, outs: proj.outs, seq: !!proj.seq, project: fromProject ? proj.id : null, code: d.code } : null;
    if (tileLab.redraw) tileLab.redraw();
  }
  $('#cmCopy').addEventListener('click', () => { const t = $('#cmFile').textContent, m = s => { $('#cmMsg').textContent = s; }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => m('Copied.'), () => m('Copy is blocked here: select the text and copy it.')); else m('Copy is blocked here: select the text and copy it.'); });
  update();
}

/* ---------- The whole chip ---------- */
function filesLab() {
  const { designs } = CM.checkAll(COMMUNITY.map(x => ({ slug: x.slug, title: x.title, author: x.author, description: x.description, added: x.added, project: x.project || undefined, code: x.code, ins: x.project ? undefined : x.ins, outs: x.project ? undefined : x.outs, clocked: !x.project && x.seq ? true : undefined, tests: x.tests })));
  const files = CM.chipFiles(designs); let k = 0;
  $('#cmFTag').textContent = files.length + ' files';
  $('#cmFiles').innerHTML = files.map((f, i) => '<button type="button" data-i="' + i + '">' + esc(f[0]) + '</button>').join('');
  const show = () => { $('#cmFiles').querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', i === k)); $('#cmView').textContent = files[k][1]; };
  $('#cmFiles').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { k = +b.dataset.i; show(); } });
  $('#cmZip').addEventListener('click', () => {
    try { const blob = new Blob([zip(files.map(f => ['open-silicon-lab-community/' + f[0], f[1]]))], { type: 'application/zip' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'open-silicon-lab-community.zip'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); $('#cmZMsg').textContent = 'Downloaded.'; }
    catch (e) { $('#cmZMsg').textContent = 'This page cannot download files here.'; }
  });
  show();
}
