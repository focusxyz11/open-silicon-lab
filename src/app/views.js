/* Workshop, Challenges and Knowledge: three ways into the same topics. Each reads the shared
   data (topics, challenges, cards, facts), so nothing is duplicated and nothing is locked. */
import { BANDS, TOPICS, topicById, bandById } from '../data/topics.js';
import { CHALLENGES, PROBLEMS } from '../data/challenges.js';
import { CARDS, TH } from '../data/cards.js';
import { FACTS, fmtDate, changesHTML } from './facts.js';
import { levelStars, riscvStars } from '../labs/riscv-lab.js';
import { P } from './learning.js';

const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(String(u || '')) ? String(u) : '';
const tName = id => (topicById(id) || { t: id }).t;
const labsIn = id => { const s = document.getElementById(id); return s ? [...s.querySelectorAll('.lab')].map(l => ({ id: l.id, t: ((l.querySelector(':scope > header b') || {}).textContent || '').trim() })).filter(l => l.t) : []; };
const stars = n => '<span class="stars"><span>' + '★'.repeat(n) + '</span><span class="off">' + '★'.repeat(3 - n) + '</span></span>';

/* ---------------- Workshop ---------------- */
const BUILDS = [
  { id: 'tiny', n: '01', t: 'Make a tiny chip', d: 'Write a small circuit and take it through every step a GPU goes through, until it runs in a gadget, or as the ALU inside the RISC-V CPU.', steps: ['Logic', 'Verify', 'Gates', 'Layout', 'Masks', 'Fab', 'Test', 'Gadget'], link: 'Your ALU slice runs inside the RISC-V CPU' },
  { id: 'riscv', n: '02', t: 'Program and extend a RISC-V CPU', d: 'Write assembly for a real open processor, watch the datapath, then add your own AI instruction.', steps: ['Registers', 'Memory', 'Loops', 'Multiply', 'Neuron', 'Custom op', 'Layer'], link: 'Your custom instruction is how AI chips begin' },
  { id: 'build', n: '03', t: 'Architect an AI chip', d: 'Choose architecture, node, memory and package for a mission, then compare with real 2026 chips.', steps: ['Mission', 'Architecture', 'Node', 'Memory', 'Package', 'Cost', 'Score'], link: null },
  { id: 'agent', n: '04', t: 'Design with an AI agent', d: 'An agent proposes designs, code and claims. Check them with real tools and decide what to trust.', steps: ['Equality', 'Majority', 'Array sum', 'Multiply', 'Yield', 'Roofline', 'Facts', 'Coverage'], link: null }
];
let wsQuery = '';
export function renderWorkshop() {
  const v = $('#view-workshop');
  const rs = riscvStars();
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">Workshop</p><h1>Build it yourself</h1><p class="lede">Three builds, one idea at three scales: gates make a processor, and a processor plus custom hardware makes a specialized chip, such as an AI chip. A fourth asks the AI-era question: when an agent does the work, can you tell whether it is right? Start with any of them. Below are all ' + TOPICS.reduce((s, t) => s + labsIn(t.id).length, 0) + ' simulations to play with.</p></section>' +
    '<section class="wrap buildline">' + BUILDS.map((b, i) => '<div class="bstation"><a class="bcard" href="#' + b.id + '"><span class="bn">' + b.n + '</span><div><b>' + esc(b.t) + '</b><p>' + esc(b.d) + '</p><ol class="bsteps">' + b.steps.map((s, k) => '<li' + (b.id === 'riscv' && levelStars(k + 1) ? ' class="done"' : '') + '>' + esc(s) + '</li>').join('') + '</ol>' + (b.id === 'riscv' ? '<small class="muted">' + rs + ' of 21 stars earned</small>' : (P.seen[b.id] ? '<small class="muted">Opened before</small>' : '<small class="muted">Not opened yet</small>')) + '</div><span class="go">Open →</span></a>' + (b.link ? '<p class="blink"><span aria-hidden="true">↓</span>' + esc(b.link) + '</p>' : '') + '</div>').join('') + '</section>' +
    '<section class="wrap"><div class="vbar"><h2>Playground</h2><input type="search" id="wsQ" placeholder="Find a simulation…" aria-label="Find a simulation" value="' + esc(wsQuery) + '"></div><div id="wsGrid"></div></section>';
  const draw = () => {
    const q = wsQuery.toLowerCase();
    $('#wsGrid').innerHTML = BANDS.map(b => { const tiles = TOPICS.filter(t => t.band === b.id).flatMap(t => labsIn(t.id).map(l => ({ ...l, topic: t }))).filter(l => !q || (l.t + ' ' + l.topic.t).toLowerCase().includes(q)); return tiles.length ? '<div class="pgband"><p class="eyebrow">' + esc(b.t) + '</p><div class="pgrid">' + tiles.map(l => '<a href="#' + l.id + '"><b>' + esc(l.t) + '</b><small>' + esc(l.topic.t) + '</small></a>').join('') + '</div></div>' : ''; }).join('') || '<p class="muted">No simulation matches that search.</p>';
  };
  $('#wsQ').addEventListener('input', e => { wsQuery = e.target.value.trim(); draw(); });
  draw();
}

/* ---------------- Challenges ---------------- */
let chKind = '';
export function renderChallenges() {
  const v = $('#view-challenges');
  const kinds = ['', 'Puzzle', 'Design', 'Experiment'];
  const status = c => { const m = /^#riscv-(\d+)$/.exec(c.href); if (m) { const s = levelStars(+m[1]); return stars(s); } return P.seen[c.topic] ? '<span class="vis">Visited</span>' : ''; };
  const list = CHALLENGES.filter(c => !chKind || c.kind === chKind);
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">Challenges</p><h1>Puzzles, designs and experiments</h1><p class="lede">Puzzles have one right answer. Designs have many, scored on trade-offs. Experiments ask you to find where something breaks. Every one is open: pick any.</p></section>' +
    '<section class="wrap"><div class="vbar"><div class="seg" role="group" aria-label="Kind of challenge">' + kinds.map(k => '<button type="button" data-k="' + k + '" aria-pressed="' + (k === chKind) + '">' + (k ? k + 's' : 'All') + ' <small>' + CHALLENGES.filter(c => !k || c.kind === k).length + '</small></button>').join('') + '</div></div>' +
    '<div class="chgrid">' + BANDS.flatMap(b => list.filter(c => (topicById(c.topic) || {}).band === b.id)).map(c => '<a class="chcard k-' + c.kind.toLowerCase() + '" href="' + c.href + '"><span class="pill out">' + c.kind + '</span><b>' + esc(c.t) + '</b><small>' + esc(c.d) + '</small><span class="chmeta"><em>' + esc(bandById(topicById(c.topic).band).t) + ' · ' + esc(tName(c.topic)) + '</em>' + status(c) + '</span></a>').join('') + '</div>' + '</section>' +
    '<section class="wrap"><div class="vbar"><h2>Open problems</h2></div><p class="lede">These have no answer yet. The industry is working on them right now. Look at each from more than one side, test an idea in the linked simulations, and form your own view.</p><div class="probgrid">' +
    PROBLEMS.map(p => '<article class="prob"><h3>' + esc(p.t) + '</h3><p>' + esc(p.q) + '</p><div class="persp">' + p.persp.map(x => '<span>' + esc(x) + '</span>').join('') + '</div><p class="eyebrow">Test an idea in</p><div class="row">' + p.try.map(id => '<a class="chip" href="#' + id + '">' + esc(tName(id)) + '</a>').join('') + '</div></article>').join('') + '</div></section>';
  v.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { chKind = b.dataset.k; renderChallenges(); }));
}

/* ---------------- Knowledge ---------------- */
let fq = '', fk = '';
export function renderKnowledge() {
  const v = $('#view-knowledge');
  const groups = Object.keys(TH).map(k => [k, Object.entries(CARDS).filter(([, c]) => c[0] === k)]);
  const KN = { reported: 'Reported', claim: 'Vendor claim', estimate: 'Estimate', projection: 'Projection' };
  v.innerHTML = '<section class="wrap vhead"><p class="eyebrow">Knowledge</p><h1>Ideas, terms and dated facts</h1><p class="lede">Short cards for the ideas that come up everywhere, every fact with its source and date, and the full glossary. Each one links back to the topic where you can see it in action.</p><div class="row"><a class="btn" href="#glossary">Glossary</a><a class="btn" href="#sources">All sources</a></div></section>' +
    '<section class="wrap">' + groups.map(([k, cs]) => '<div class="pgband"><p class="eyebrow" style="color:' + TH[k][1] + '">' + esc(TH[k][0]) + '</p><div class="kgrid">' + cs.map(([, c]) => '<a class="kcard" href="#' + c[3] + '" style="--kc:' + TH[k][1] + '"><b>' + esc(c[1]) + '</b><p>' + esc(c[2]) + '</p><small>' + esc(tName(c[3])) + ' →</small></a>').join('') + '</div></div>').join('') + '</section>' +
    '<section class="wrap"><div class="vbar"><h2>Live facts</h2><div class="seg" role="group" aria-label="Kind of fact">' + [''].concat(Object.keys(KN)).map(k => '<button type="button" data-fk="' + k + '" aria-pressed="' + (k === fk) + '">' + (k ? KN[k] : 'All') + '</button>').join('') + '</div><input type="search" id="kfQ" placeholder="Search facts…" aria-label="Search facts" value="' + esc(fq) + '"></div><p class="small muted">' + FACTS.facts.length + ' facts · last checked ' + esc(fmtDate(FACTS.lastCheck)) + ' · next check ' + esc(fmtDate(FACTS.nextCheck)) + '. Facts are updated by pull request; see the project README.</p><div class="ftable" id="kfList"></div></section>' +
    '<section class="wrap"><div class="vbar"><h2>What changed recently</h2></div>' + changesHTML() + '</section>';
  const draw = () => {
    const q = fq.toLowerCase();
    const fs = FACTS.facts.filter(f => (!fk || f.kind === fk) && (!q || (f.label + ' ' + f.value + ' ' + (f.detail || '') + ' ' + tName(f.topic)).toLowerCase().includes(q)));
    $('#kfList').innerHTML = fs.length ? fs.map(f => { const u = safeUrl(f.url); return '<div class="frow"><div><b>' + esc(f.label) + '</b>' + (f.detail ? '<small>' + esc(f.detail) + '</small>' : '') + '</div><div class="v">' + esc(f.value) + '</div><div class="meta"><span class="pill ' + ({ reported: 'ship', claim: 'ann', estimate: 'out', projection: 'proj' }[f.kind] || 'ship') + '">' + esc(KN[f.kind] || 'Reported') + '</span><a href="#' + f.topic + '">' + esc(tName(f.topic)) + '</a>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(f.source || 'Source') + '</a>' : '') + '<span>' + esc(fmtDate(f.verified)) + '</span></div></div>'; }).join('') : '<p class="muted">No facts match.</p>';
  };
  $('#kfQ').addEventListener('input', e => { fq = e.target.value.trim(); draw(); });
  v.querySelectorAll('[data-fk]').forEach(b => b.addEventListener('click', () => { fk = b.dataset.fk; v.querySelectorAll('[data-fk]').forEach(x => x.setAttribute('aria-pressed', x.dataset.fk === fk)); draw(); }));
  draw();
}
