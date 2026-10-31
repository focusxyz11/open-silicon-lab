/* My chip: the design you are building in the tiny-chip studio, followed through every layer of
   the site. The studio publishes the design; this module turns it into a passport, stamps the
   stages you have done, shows a line about your chip on topic pages, and renders the My chip view. */
import TC from '../engines/tinychip.js';
import { passport, journey, chipLine, NODES } from '../engines/passport.js';
import { topicById } from '../data/topics.js';
import { t, fmtNum, fmtDate, locale } from '../core/i18n.js';
import { openStudio, setStudioNode } from './studio.js';

const KEY = 'osl-mychip-v1', TKEY = 'sjl-tiny-v1';
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const M = { name: '', stamps: {}, show: true };
try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object') { if (typeof j.name === 'string') M.name = j.name; if (j.stamps && typeof j.stamps === 'object') M.stamps = j.stamps; if (j.show === false) M.show = false; } } catch (e) { /* storage unavailable */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(M)); } catch (e) { /* ignore */ } };

/* The design, as the studio last published it (or as it saved it). */
let live = null;
function design() {
  if (live) return live;
  try { const j = JSON.parse(localStorage.getItem(TKEY) || 'null'); if (j && typeof j === 'object') { const p = TC.PROJ[Number.isInteger(j.p) ? j.p : 0] || TC.PROJ[0]; return { p: p.id, code: j.code && typeof j.code[p.id] === 'string' ? j.code[p.id] : p.starter, node: NODES.includes(j.node) ? j.node : '130', lib: j.lib === 'nand' ? 'nand' : 'basic', util: +j.util || 0.5 }; } } catch (e) { /* ignore */ }
  const p = TC.PROJ[0]; return { p: p.id, code: p.starter, node: '130', lib: 'basic', util: 0.5 };
}
/* The design itself: project id, code, process, library. The bench tests it on a board. */
export const chipDesign = () => ({ ...design() });
export function publishChip(d) {
  const same = live && live.p === d.p && live.code === d.code && live.node === d.node && live.lib === d.lib && live.util === d.util;
  live = { ...d }; if (same) return;
  cache = { key: null, p: null };
  document.dispatchEvent(new CustomEvent('osl:chip'));
}
let cache = { key: null, p: null };
export function currentChip() {
  const d = design(); const key = JSON.stringify(d) + '|' + M.name;
  if (cache.key !== key) { const proj = TC.PROJ.find(x => x.id === d.p) || TC.PROJ[0]; cache = { key, p: passport({ proj, code: d.code, node: d.node, lib: d.lib, util: d.util, name: M.name }) }; }
  return cache.p;
}
/* A chip "exists" once you have started one in the studio. */
export const hasChip = () => !!M.stamps.logic;

export function stampChip(key) {
  if (M.stamps[key]) return;
  M.stamps[key] = new Date().toISOString().slice(0, 10); save();
  document.dispatchEvent(new CustomEvent('osl:chip-stamp', { detail: { key } }));
}
/* Visiting these topics with a chip stamps their stage. */
const VISIT = { yield: 'yield', economics: 'cost', future: 'era' };
export function chipVisit(topic) { if (hasChip() && VISIT[topic] && currentChip().ok) stampChip(VISIT[topic]); }

/* ---- the line on topic pages ---- */
export function renderChipBanner(topic) {
  const box = document.getElementById('chipBanner'); if (!box) return;
  box.dataset.topic = topic || '';
  const p = currentChip(); const line = hasChip() && M.show && p.ok ? chipLine(topic, p) : '';
  if (!line) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false; box.className = 'chipbanner';
  box.innerHTML = '<span class="chipicon" aria-hidden="true"></span><div><p class="code">' + esc(t('chip.bannerCode', { name: p.name, node: p.nodeName })) + '</p><p>' + esc(line) + '</p></div><a class="btn" href="#mychip">' + t('chip.passport') + '</a>';
}

/* ---- the chip card: a drawing of your die in its package ---- */
const up = s => s.toLocaleUpperCase(locale());
const CELLC = { INV: '#8fa3b3', BUF: '#8fa3b3', NAND2: '#9b8ce0', NOR2: '#c58ab3', AND2: '#7f9fe0', OR2: '#d6a35a', XOR2: '#5fb7a8', XNOR2: '#5fb7a8', TIE0: '#888', TIE1: '#888' };
export function drawCard(cv, p, d) {
  const ctx = cv.getContext('2d'), W = 720, H = 440, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0f1b23'); g.addColorStop(1, '#1d2d38');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  /* package and pins */
  const px = 40, py = 60, ps = 320; ctx.fillStyle = '#c9a54a';
  const pins = Math.max(4, p.inputs + p.outputs), per = Math.ceil(pins / 4);
  for (let s = 0; s < 4; s++) for (let k = 0; k < per; k++) { const t = (k + 1) / (per + 1); const L = 14, w = 10;
    if (s === 0) ctx.fillRect(px + t * ps - w / 2, py - L, w, L); if (s === 1) ctx.fillRect(px + ps, py + t * ps - w / 2, L, w); if (s === 2) ctx.fillRect(px + t * ps - w / 2, py + ps, w, L); if (s === 3) ctx.fillRect(px - L, py + t * ps - w / 2, L, w); }
  ctx.fillStyle = '#20262b'; ctx.fillRect(px, py, ps, ps); ctx.strokeStyle = '#3a444c'; ctx.lineWidth = 2; ctx.strokeRect(px, py, ps, ps);
  /* the die, with your placed cells */
  const proj = TC.PROJ.find(x => x.id === p.proj), D = TC.parse(d.code, proj.ins, proj.outs);
  const SY = TC.synth(D, proj.ins, proj.outs, p.lib, false, p.node), PL = TC.place(SY.M, p.util, 7); PL.anneal(Math.min(3000, 300 + SY.M.cells.length * 80), null);
  const dm = 190, dx = px + (ps - dm) / 2, dy = py + (ps - dm) / 2;
  ctx.fillStyle = '#5b5f86'; ctx.fillRect(dx, dy, dm, dm);
  const sc = Math.min((dm - 20) / PL.GW, (dm - 20) / PL.H), ox = dx + (dm - PL.GW * sc) / 2, oy = dy + (dm - PL.H * sc) / 2;
  ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let r = 0; r < PL.rows; r++) ctx.fillRect(ox + 2 * sc, oy + (r * PL.TR + 1) * sc, (PL.GW - 4) * sc, 3 * sc);
  SY.M.cells.forEach((c, i) => { const q = PL.pos[i]; ctx.fillStyle = CELLC[c.type]; ctx.fillRect(ox + (2 + q.x) * sc + 1, oy + (q.r * PL.TR + 1) * sc + 1, q.w * sc - 2, 3 * sc - 2); });
  ctx.fillStyle = '#d6b35a'; for (let k = 0; k < 12; k++) { const t = (k + 0.5) / 12; ctx.fillRect(dx + t * dm - 3, dy + 3, 6, 6); ctx.fillRect(dx + t * dm - 3, dy + dm - 9, 6, 6); }
  ctx.fillStyle = '#e8eef2'; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('OSL · ' + p.nodeName.toUpperCase(), px + ps / 2, py + ps - 18);
  /* the text side */
  const tx = 400; ctx.textAlign = 'left';
  ctx.fillStyle = '#efae35'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(up(t('chip.cardTitle')), tx, 74);
  ctx.fillStyle = '#ffffff'; ctx.font = '700 30px "Archivo", "Arial Narrow", sans-serif';
  const words = p.name.split(' '); let line = '', y = 116; for (const w of words) { const next = line ? line + ' ' + w : w; if (ctx.measureText(next).width > 290 && line) { ctx.fillText(line, tx, y); y += 34; line = w; } else line = next; } ctx.fillText(line, tx, y);
  const rows = [['process', p.nodeName], ['tr', fmtNum(p.tr)], ['cells', fmtNum(p.cells)], ['size', fmtNum(Math.round(p.wUm)) + ' × ' + fmtNum(Math.round(p.hUm)) + ' µm'], ['clock', p.fmaxMHz >= 1000 ? fmtNum(p.fmaxMHz / 1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' GHz' : fmtNum(Math.round(p.fmaxMHz)) + ' MHz'], ['verified', !p.spec ? t('chip.free') : p.wrong ? t('chip.wrong', { n: p.wrong }) : t('chip.allCases', { n: p.cases })]].map(([k, v]) => [t('chip.row.' + k), v]);
  y += 30; ctx.font = '13px "IBM Plex Sans", sans-serif';
  rows.forEach(([k, v]) => { ctx.fillStyle = '#8c9da8'; ctx.fillText(k, tx, y); ctx.fillStyle = '#e8eef2'; ctx.font = '500 14px "IBM Plex Mono", monospace'; ctx.fillText(v, tx + 120, y); ctx.font = '13px "IBM Plex Sans", sans-serif'; y += 26; });
  const done = Object.keys(M.stamps).length;
  ctx.fillStyle = '#5dc27c'; ctx.font = '600 12px "IBM Plex Mono", monospace'; ctx.fillText(up(t('chip.stamps', { n: done }) + (M.stamps.logic ? ' · ' + t('chip.started', { date: fmtDate(M.stamps.logic) }) : '')), tx, H - 40);
}

/* ---- the My chip view ---- */
export function renderMyChip() {
  const v = $('#view-mychip'); if (!v) return;
  const p = currentChip(), d = design();
  if (!hasChip()) {
    v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">' + t('chip.eyebrow') + '</p><h1>' + t('chip.h1') + '</h1><p class="lede">' + t('chip.lede') + '</p><div class="row"><a class="btn primary" href="#lab-tiny-1">' + t('chip.start') + '</a></div></section>' +
      '<section class="wrap"><p class="eyebrow">' + t('chip.pick') + '</p><div class="mcpick">' + TC.PROJ.map(x => '<button type="button" data-start="' + x.id + '"><small>' + esc(x.lvl) + '</small><b>' + esc(x.t) + '</b></button>').join('') + '</div></section>';
    return;
  }
  const J = p.ok ? journey(p) : [];
  const applicable = J.filter(s => s.key !== 'cpu' || p.alu);
  const got = applicable.filter(s => M.stamps[s.key]).length;
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">' + esc(t('chip.eyebrowName', { title: p.title })) + '</p><div class="mcname"><label for="mcName" class="small muted">' + t('chip.name') + '</label><input id="mcName" type="text" maxlength="40" value="' + esc(M.name) + '" placeholder="' + esc(p.title) + '"></div>' +
    '<p class="lede">' + t('chip.lede2') + '</p></section>' +
    (p.ok ? '<section class="wrap mcgrid"><div class="mccard"><canvas id="mcCard" width="720" height="440" aria-label="' + t('chip.cardLabel') + '"></canvas><div class="row"><button type="button" class="btn primary" id="mcDl">' + t('chip.download') + '</button><a class="btn" href="#lab-tiny-1">' + t('chip.change') + '</a><span class="small muted" id="mcMsg" aria-live="polite"></span></div></div>' +
      '<div class="mcside"><div class="ctl"><span class="lbl">' + t('chip.row.process') + '</span><div class="seg" id="mcNode">' + NODES.map(n => '<button type="button" data-n="' + n + '" aria-pressed="' + (n === d.node) + '">' + TC.NODE[n].t + '</button>').join('') + '</div></div>' +
      '<div class="readout col"><div><span>' + t('chip.stampsGot') + '</span><b>' + t('chip.stampsOf', { n: got, total: applicable.length }) + '</b></div><div><span>' + t('chip.row.tr') + '</span><b>' + fmtNum(p.tr) + '</b></div><div><span>' + esc(t('chip.area', { node: p.nodeName })) + '</span><b>' + t('chip.areaValue', { n: fmtNum(Math.round(p.area)) }) + '</b></div><div><span>' + t('chip.year') + '</span><b>' + p.year + '</b></div></div>' +
      '<label class="check"><input type="checkbox" id="mcShow"' + (M.show ? ' checked' : '') + '> ' + t('chip.show') + '</label></div></section>' +
      '<section class="wrap"><div class="vbar"><h2>' + t('chip.journey') + '</h2></div><ol class="mcjourney">' + J.map(s => { const na = s.key === 'cpu' && !p.alu; const st = M.stamps[s.key]; return '<li class="' + (na ? 'na' : st ? 'done' : '') + '"><span class="stamp" aria-hidden="true">' + (na ? '–' : st ? '✓' : '') + '</span><div><b>' + esc(s.t) + '</b>' + (st ? '<small class="muted">' + esc(t('chip.stamped', { date: fmtDate(st) })) + '</small>' : na ? '<small class="muted">' + t('chip.na') + '</small>' : '') + '<p>' + esc(s.d) + '</p><a href="' + s.href + '">' + esc((topicById(s.topic) || { t: s.topic }).t) + ' →</a></div></li>'; }).join('') + '</ol>' +
      '<p class="note">' + t('chip.note') + '</p></section>'
      : '<section class="wrap"><div class="callout"><p class="code" style="color:var(--bad)">' + t('chip.noCompile') + '</p><p>' + esc(p.errs[0].m) + ' <a href="#lab-tiny-1">' + t('chip.fix') + '</a></p></div></section>');
  const nm = $('#mcName'); nm.addEventListener('input', () => { M.name = nm.value; save(); cache.key = null; const c = $('#mcCard'); if (c) drawCard(c, currentChip(), design()); });
  if (!p.ok) return;
  drawCard($('#mcCard'), p, d);
  $('#mcNode').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) setStudioNode(b.dataset.n); });
  $('#mcShow').addEventListener('change', e => { M.show = e.target.checked; save(); });
  $('#mcDl').addEventListener('click', () => { const c = $('#mcCard'); const msg = s => { $('#mcMsg').textContent = s; }; try { c.toBlob(b => { if (!b) { msg(t('chip.noDownload')); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (currentChip().name || 'my-chip').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); msg(t('chip.downloaded')); }); } catch (e) { msg(t('chip.noDownload')); } });
}

export function initMyChip() {
  document.addEventListener('click', e => { const b = e.target.closest('[data-start]'); if (b) { openStudio(b.dataset.start, 1); location.hash = 'lab-tiny-1'; } });
  const refresh = () => { const bx = document.getElementById('chipBanner'); if (bx && bx.dataset.topic) renderChipBanner(bx.dataset.topic); const v = $('#view-mychip'); if (v && !v.hidden && document.activeElement !== $('#mcName')) renderMyChip(); };
  document.addEventListener('osl:chip', refresh);
  document.addEventListener('osl:chip-stamp', refresh);
}
