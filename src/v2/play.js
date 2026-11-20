/* The challenge player: one challenge, played where you met it (inside the sheet of its station).
   Four kinds, each checked by a real engine (src/v2/game.js):
     design  write or fix a circuit's description; ask an AI for a proposal, then let the check decide;
     chip    move your chip's settings until it reaches a goal no single setting can reach;
     life    choose what the design and the factory do, then see whether the chip lives through a place's life;
     spot    run a few test patterns on four copies, and find the one the factory broke;
     break   a design of the ledger that passed its check: find the case, tick by tick, that makes it answer wrong;
     bet     say where you think the balance is, then turn two dials until three primitives meet (src/engines/bet.js).
   A win says which question it opens (a challenge is where a question starts), and where the work could join the
   community's ledger, a slip gives the way in (src/v2/commons.js).
   play(el, ch, ctx) draws into el; ctx: { state, save(), done(ch), back(), open(challenge), startChip() }. */
import { t } from '../core/i18n.js';
import { CLOCKS, SIDES, LOADS, REUSES, MEMS, GENS, x2 } from '../engines/chip.js';
import { MISSIONS, MARGINS, PROTECT, normalLife } from '../engines/life.js';
import { TAPS, turnGate, hasPiece, togglePiece, checkDesign, checkChip, checkLife, chipGoal, starter, ownStarter, aiProposal, spotCase, spotCode, spotAnswer, SPOT, STEPS, next, INSIDE, challengeOf, GAUGES, gauge, world, opensOf, askHref } from './game.js';
import { runCase } from '../engines/ledger.js';
import { projectOf, patterns as testOf } from '../engines/design.js';
import { signHtml, signOf, keep, refusal, slipHtml, slipClick, draftOf } from './commons.js';
import { build } from '../engines/design.js';
import * as Bet from '../engines/bet.js';
import { setBetScene } from '../app/betscene.js';
import { WAFER as SCENE_WAFER } from '../engines/chip.js';
import { glyph } from './field.js';
import { LABS } from './labs/index.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
/* the gates a description can use, and the one a tap turns each into */
const OPS = { '&': 'and', '|': 'or', '^': 'xor' };
const MAX = { clock: CLOCKS.length - 1, gen: GENS - 1, size: SIDES.length - 1, load: LOADS.length - 1, reuse: REUSES.length - 1, mem: MEMS.length - 1 };
const pctShare = v => v >= 0.01 ? t('life.share.pct', { v: (v * 100).toFixed(v >= 0.1 ? 0 : 1) }) : t('life.share.ppm', { v: v * 1e6 >= 10 ? Math.round(v * 1e6) : (v * 1e6).toPrecision(2) });
/* a gauge's value in words */
const gaugeText = (k, v) => k === 'load' ? t('gauge.pct', { v: Math.round(v * 100) }) : k === 'cost' || k === 'work' ? t('life.times', { v: v.toFixed(k === 'cost' ? 2 : 1) }) : k === 'clock' ? t('life.times', { v: v.toFixed(1) }) : k === 'days' ? t('gauge.days.v', { v: Math.round(v) }) : String(Math.round(v));
const reqValue = (id, v) => id === 'fail' ? pctShare(v) : id === 'silent' ? (v >= 10 ? Math.round(v) : v.toFixed(1)) : id === 'perf' ? t('life.share.pct', { v: Math.round(v * 100) }) : t('life.times', { v: v.toFixed(2) });

/* Redraw by patching: nodes that did not change stay, so a slider being dragged keeps its drag and focus stays put. */
function patch(a, b) {
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b.cloneNode(true)); return; }
  if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.nodeType !== 1) return;
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for (const at of [...b.attributes]) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
  if (a.nodeName === 'INPUT') { if (a.value !== b.getAttribute('value') && document.activeElement !== a) a.value = b.getAttribute('value'); return; }
  if (a.nodeName === 'TEXTAREA') { if (a.value !== b.textContent) a.value = b.textContent; return; }
  const A = [...a.childNodes], B = [...b.childNodes];
  B.forEach((n, i) => { if (A[i]) patch(A[i], n); else a.appendChild(n.cloneNode(true)); });
  A.slice(B.length).forEach(n => n.remove());
}

/* the title, goal and reward of a challenge */
export function titleOf(ch) { return ch.kind === 'break' ? t('game.break.t', { what: ch.title || t('design.proj.' + ch.p + '.t') }) : ch.kind === 'design' ? t('design.proj.' + ch.p + '.t') : t('game.ch.' + ch.id + '.t'); }
export function goalOf(ch) {
  if (ch.kind === 'break') return t('game.break.goal');
  if (ch.kind === 'design') return t(ch.need ? 'game.job.goal' : 'game.ch.' + ch.id + '.goal', { job: t('design.proj.' + ch.p + '.t') });
  if (ch.kind === 'chip') return t('chal.' + ch.goal + '.goal');
  return t('game.ch.' + ch.id + '.goal');
}

export function play(el, ch, ctx) {
  const S = ctx.state;
  let view = { msg: null, B: null, ai: false, hint: false, tests: [], guess: null, wrong: null, write: false, won: false, rows: null, okG: null, op: -1, seq: null, slip: null, no: null };
  /* the design challenges are fixed by tapping, not typing: the gates in a description are buttons, a tray holds
     pieces to add where a gate is not enough, and the table checks every pattern after each tap (the engine still
     decides). "Write it yourself" opens the text. */
  const TC = ch.kind === 'design' && TAPS[ch.id], TAP = !!TC;
  if (TAP) view.B = checkDesign(ch.p, S.codes[ch.p] != null ? S.codes[ch.p] : starter(ch.p));
  const head = () => '<button type="button" class="back" data-back>' + esc(t('game.back')) + '</button>' +
    '<p class="kicker">' + esc(ch.step ? t('game.stepN', { n: STEPS.indexOf(ch.step) + 1, step: t('game.step.' + ch.step) }) + ' · ' + t('map.' + ch.place + '.t') : t(ch.kind === 'break' ? 'game.break.kicker' : 'game.jobKicker')) + '</p>' +
    where() + '<h3 class="ch-t">' + esc(titleOf(ch)) + '</h3><p class="goal">' + esc(goalOf(ch)) + '</p>' +
    (ch.kind !== 'break' && (ch.kind !== 'design' || !ch.need) && !(ch.id === 'half' && !view.write) ? '<p class="small muted why">' + esc(t('game.ch.' + ch.id + '.why')) + '</p>' : '');
  /* where it happens: the place, and its levels with this one lit */
  const where = () => { const place = ch.need ? 'studio' : ch.place, at = ch.kind === 'break' ? 'check' : ch.need ? 'logic' : ch.at, L = INSIDE[place] || [];
    return L.length > 1 ? '<ol class="levels" aria-label="' + esc(t('map.' + place + '.t')) + '">' + L.map(l => '<li' + (l.depth === at ? ' class="on" aria-current="step"' : '') + '>' + esc(t('depth.' + l.depth + '.name')) + '</li>').join('') + '</ol>' : ''; };
  const reward = () => ch.grows && !S.done[ch.id] ? '<p class="grows small">' + esc(t('game.grows', { what: t('grow.' + ch.grows) })) + '</p>' : '';
  const doneNote = () => { if (!S.done[ch.id]) return ''; const n = next(S);
    return '<div class="won"><b>' + esc(t('game.won')) + '</b>' + (ch.grows ? ' ' + esc(t('game.grew', { what: t('grow.' + ch.grows) })) : '') +
      (view.won ? '<span class="burst" aria-hidden="true">' + Array.from({ length: 14 }, (_, i) => '<i style="--a:' + Math.round(i * 360 / 14) + 'deg;--d:' + (i % 3) * 40 + 'ms"></i>').join('') + '</span>' : '') +
      (n && ctx.open ? '<button type="button" class="btn primary" data-next>' + esc(t('game.goNext', { what: titleOf(n) })) + '</button>' : '') + '</div>' + opens(); };
  /* what a win opens: the question this challenge was about all along, one tap away */
  const opens = () => { if (ch.kind === 'bet') return '<button type="button" class="opens" data-field="' + esc(ch.bet) + '"><span class="kicker">' + glyph('bet') + esc(t('game.opens')) + '</span><span class="q">' + esc(t('field.' + ch.bet + '.q')) + '</span><span class="small muted">' + esc(t('field.' + ch.bet + '.who')) + '</span></button>';
    const k = opensOf(ch); return k ? '<a class="opens" href="' + esc(askHref(k)) + '"><span class="kicker">' + esc(t('game.opens')) + '</span><span class="q">' + esc(t('stop.' + k + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a>' : ''; };
  /* your work as an entry of the ledger: sign it and keep it, then the slip gives the way in */
  const entry = (label) => view.slip && draftOf(S, view.slip) ? slipHtml(S, view.slip) : '<div class="keep">' + signHtml(S, view.ai ? 'both' : 'person') + (view.no ? '<p class="small bad">' + esc(view.no) + '</p>' : '') + '<button type="button" class="btn primary" data-keep>' + esc(t(label)) + '</button><p class="small muted">' + esc(t('ledger.keep.note')) + '</p></div>';

  let lab = null;
  function win() { if (S.done[ch.id]) return; S.done[ch.id] = true; view.won = true; ctx.save(); ctx.done(ch); }

  /* ---- design: write a circuit, check it ---- */
  function design() {
    const code = S.codes[ch.p] != null ? S.codes[ch.p] : starter(ch.p), B = view.B;
    /* the first minute keeps to one line of words: the gates and the table say the rest */
    let h = head() + (TAP && !view.write ? '' : '<p class="small">' + esc(ownStarter(ch.p) ? t('game.own.' + ch.p) : t('design.proj.' + ch.p + '.d')) + '</p>');
    if (TAP && !view.write) {
      /* the description with its gates as buttons: tap one to turn it into the next kind */
      let k = -1;
      const line = l => esc(l).replace(/&amp;|[|^]/g, m => { const op = m === '&amp;' ? '&' : m; k++;
        return '<button type="button" class="op' + (k === view.op ? ' just' : '') + '" data-op="' + k + '" title="' + esc(t('game.op.' + OPS[op] + '.d')) + '"><b>' + esc(op) + '</b><span>' + esc(t('game.op.' + OPS[op])) + '</span></button>'; });
      h += '<p class="small hintline">' + esc(t('game.tap.' + ch.id)) + '</p><div class="code tapcode" role="group" aria-label="' + esc(t('game.describe')) + '">' + code.split('\n').map(l => '<div>' + line(l) + '</div>').join('') + '</div>';
      /* pieces to add to a line, and take off again */
      if (TC.pieces) h += '<p class="kicker">' + esc(t('game.tap.pieces')) + '</p><div class="chips pieces">' + TC.pieces.map((pc, i) => '<button type="button" class="chipb mono" data-piece="' + i + '" aria-pressed="' + hasPiece(code, TC.line, pc) + '">' + esc(pc) + '</button>').join('') + '</div>';
      h += '<div class="row">' + (aiProposal(ch.p) && ch.id !== 'half' ? '<button type="button" class="btn" data-ai>' + esc(t('game.askAi')) + '</button>' : '') + (S.codes[ch.p] != null && S.codes[ch.p] !== starter(ch.p) ? '<button type="button" class="btn ghost" data-restart>' + esc(t('game.restart')) + '</button>' : '') + '</div>';
    } else {
    h += '<label class="lab" for="chCode">' + esc(t('game.describe')) + '</label><textarea id="chCode" class="code" spellcheck="false" autocapitalize="off" autocomplete="off" rows="' + Math.min(10, code.split('\n').length + 2) + '">' + esc(code) + '</textarea>';
    h += '<div class="row"><button type="button" class="btn primary" data-check>' + esc(t('game.check')) + '</button>' + (aiProposal(ch.p) ? '<button type="button" class="btn" data-ai>' + esc(t('game.askAi')) + '</button>' : '') + '<button type="button" class="btn ghost" data-restart>' + esc(t('game.restart')) + '</button></div>';
    }
    if (view.ai) h += '<blockquote class="aiq"><span class="kicker">' + esc(t('game.aiSays')) + '</span>' + esc(t('build.agent.' + ch.p)) + '<span class="small muted">' + esc(t('game.aiNote')) + '</span></blockquote>';
    if (B) {
      if (B.errs.length) h += '<ul class="errs">' + B.errs.map(e => '<li>' + esc(t('design.err.' + e.k, { l: e.l, n: e.n || '' })) + '</li>').join('') + '</ul>';
      else {
        const ins = B.ins, outs = B.outs;
        h += '<p class="verdict ' + (B.ok ? 'good' : 'bad') + '">' + esc(B.ok ? t('game.right', { n: B.total }) : t('game.wrongRows', { bad: B.bad, n: B.total })) + '</p>';
        h += '<div class="tt"><table><thead><tr>' + ins.map(i => '<th>' + esc(i) + '</th>').join('') + '<th class="sep"></th>' + outs.map(o => '<th>' + esc(o) + '</th>').join('') + '<th></th></tr></thead><tbody>' +
          B.rows.map(r => '<tr class="' + (r.mis.length ? 'bad' : '') + '">' + ins.map(i => '<td>' + r.v[i] + '</td>').join('') + '<td class="sep"></td>' + outs.map(o => '<td>' + (r.mis.includes(o) ? '<s>' + r.o[o] + '</s> ' + r.e[o] : r.o[o]) + '</td>').join('') + '<td>' + (r.mis.length ? '✗' : '✓') + '</td></tr>').join('') + '</tbody></table></div>';
        if (!B.ok && view.ai) h += '<p class="small">' + esc(t('game.aiWrong')) + '</p>';
        /* the slowest path, not a clock: a design without flip-flops has no clock, and wires and pins are not counted */
        if (B.ok && B.st) h += '<p class="small muted">' + esc(t('game.built', { cells: B.M.cells.length, transistors: B.transistors, ps: Math.round(B.st.crit), depth: B.st.depth })) + '</p>';
      }
    }
    if (TAP && !view.write) h += '<button type="button" class="link" data-write>' + esc(t('game.tap.write')) + '</button>';
    if (B && B.ok) h += tapeOut(B);
    if (B && B.ok && ch.need) h += entry('ledger.keep.design');
    return h + doneNote() + reward();
  }
  /* the rest of the design line, then what the factory does to it: the design and the factory are one story */
  function tapeOut(B) {
    const D = build({ p: ch.p, code: B.code, defect: ch.p === 'full' ? spotCase(B.code).seed : 7 }).defect, steps = [['gates', t('game.tape.gates', { n: B.M.cells.length, transistors: B.transistors })], ['layout', t('game.tape.layout', { wire: Math.round(B.RT ? B.RT.wl : 0) })], ['masks', t('game.tape.masks', { n: B.masks })]];
    let h = '<div class="tape"><p class="kicker">' + esc(t('game.tape.k')) + '</p><ol class="line2">' + steps.map(([d, s]) => '<li><b>' + esc(t('depth.' + d + '.name')) + '</b><span class="small">' + esc(s) + '</span></li>').join('') + '<li class="fab"><b>' + esc(t('map.fab.t')) + '</b><span class="small">' + esc(t('game.tape.fab', { n: B.masks })) + '</span></li></ol>';
    if (D) h += '<p class="small">' + esc(t('game.tape.dust', { v: D.v, wrong: D.wrong, n: D.rows.length })) + '</p>' + (challengeOf('spot') ? '<button type="button" class="link" data-goto="spot">' + esc(t('game.tape.spot')) + '</button>' : '');
    return h + '</div>';
  }
  /* ---- chip: settings toward a goal ---- */
  const valueText = k => { const c = S.chip; return k === 'clock' ? t('chip.clock.value', { v: x2(c.clock) }) : k === 'size' ? t('chip.size.value', { mm: SIDES[c.size] }) : k === 'load' ? t('chip.load.value', { v: Math.round(LOADS[c.load] * 100) }) : k === 'reuse' ? t('chip.reuse.value', { v: REUSES[c.reuse] }) : k === 'mem' ? t('chip.mem.names')[c.mem] : t('chip.gen.names')[c.gen]; };
  const readout = (goal, m) => goal === 'months' || goal === 'quick' ? t('chip.fab', { days: Math.round(m.days), per: x2(m.perLayer), waiting: Math.round(m.waiting * 100), slow: t('depth.' + m.slow + '.name'), cost: x2(m.cost) }) + ' · ' + t('game.coresN', { n: m.cores, layers: m.layers })
    : goal === 'cores' ? t('chip.wafer', { cores: m.cores, power: x2(m.power), yield: Math.round(m.yield * 100), cost: x2(m.cost) })
    : goal === 'fed' ? t('chip.memory', { work: x2(m.work), busy: Math.round(m.busy * 100), moving: Math.round(m.moving * 100), board: x2(m.powerBoard) }) + ' · ' + t(m.late ? 'chip.late' : 'chip.inTime', { late: Math.round(m.late * 100) })
    : t('chip.readout', { clock: x2(m.clock), power: x2(m.power), late: Math.round(m.late * 100) });
  function chip() {
    const G = chipGoal(ch.goal), R = checkChip(ch.goal, S.chip);
    let h = head() + '<!--goal-->';
    h += G.needs.map(k => { const val = k === 'clock' ? CLOCKS.indexOf(S.chip.clock) : S.chip[k];
      return '<label class="lab" for="set-' + k + '"><b>' + esc(t('chip.' + k + '.label')) + '</b> <output>' + esc(valueText(k)) + '</output></label><input type="range" id="set-' + k + '" data-set="' + k + '" min="0" max="' + MAX[k] + '" step="1" value="' + val + '">'; }).join('');
    /* the goal as live gauges, kept in view while the sliders move */
    const gs = GAUGES[ch.goal] || [];
    h = h.replace('<!--goal-->', '<div class="goalbox' + (R.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(R.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => { const q = gauge(g, R.m);
      return '<div class="gauge' + (q.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('gauge.' + g.k)) + '</span><span class="gv">' + esc(gaugeText(g.k, q.v)) + ' <span class="muted">' + esc(t(g.ge != null ? 'gauge.ge' : 'gauge.le', { target: gaugeText(g.k, g.ge != null ? g.ge : g.le) })) + '</span></span><span class="gbar"><span style="width:' + (q.f * 100).toFixed(0) + '%"></span></span></div>'; }).join('') + '</div>');
    h += '<p class="readout small">' + esc(readout(ch.goal, R.m)) + '</p>';
    if (!R.ok) h += view.hint ? '<p class="small hint">' + esc(t('chal.' + ch.goal + '.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reset>' + esc(t('game.resetChip')) + '</button><p class="small muted">' + esc(t('game.oneChip')) + '</p>';
    if (R.ok) win();
    return h + doneNote() + reward();
  }
  /* ---- life: choices, then the chip's years ---- */
  const REQS = L => '<ul class="reqs">' + L.req.map(q => '<li class="' + (q.ok ? 'good' : 'bad') + '">' + (q.ok ? '✓ ' : '✗ ') + esc(t('life.req.' + q.id, { life: L.life })) + ' · ' + esc(t('life.have', { have: reqValue(q.id, q.have), need: reqValue(q.id, q.need) })) + '</li>').join('') + '</ul>';
  function life() {
    const M = MISSIONS[ch.mission], c = normalLife(S.life[ch.mission]), L = checkLife(ch.mission, c);
    const press = (k, on) => '<button type="button" class="chipb" data-life="' + k + '" aria-pressed="' + on + '">' + esc(t('life.' + k)) + '</button>';
    let h = head() + '<div class="goalbox' + (L.pass ? ' ok' : '') + '"><p class="kicker">' + esc(t(L.pass ? 'game.reached' : 'game.goalNow')) + '</p>' + REQS(L) + '</div>' + '<p class="small">' + esc(t('life.' + ch.mission + '.story', { fleet: M.fleet.toLocaleString(), life: M.life, tMax: M.tMax, perDay: Math.max(1, Math.round(L.upsets / 365)) })) + '</p>';
    h += '<p class="kicker">' + esc(t('life.inDesign')) + '</p><label class="lab" for="lifeM"><b>' + esc(t('life.margin')) + '</b> <output>' + esc(t('life.marginValue', { v: Math.round(MARGINS[c.margin] * 100) })) + '</output></label><input type="range" id="lifeM" data-margin min="0" max="' + (MARGINS.length - 1) + '" value="' + c.margin + '">';
    h += '<div class="chips">' + press('grid', c.grid) + '</div><p class="small muted">' + esc(t('life.protect')) + '</p><div class="chips">' + PROTECT.map(p => '<button type="button" class="chipb" data-prot="' + p + '" aria-pressed="' + (c.protect === p) + '">' + esc(t('life.protect.' + p)) + '</button>').join('') + '</div>';
    h += '<p class="kicker">' + esc(t('life.atFactory')) + '</p><div class="chips">' + press('hot', c.hot) + press('burn', c.burn) + '</div>';
    h += '<p class="small ' + (L.pass ? 'good' : 'hint') + '">' + esc(t('life.hint.' + L.hint, { cov: Math.round(L.cover * 100) })) + '</p>';
    if (L.pass) win();
    return h + doneNote() + reward();
  }
  /* ---- spot: which copy is broken? ---- */
  function spot() {
    const C = spotCase(spotCode(S)), letters = ['A', 'B', 'C', 'D'], pat = v => C.ins.map(i => v[i]).join(''); /* i18n-ok: the copies' letters */
    let h = head() + '<p class="small">' + esc(t('game.spot.d', { tests: SPOT.tests })) + '</p><p class="yours"><span class="kicker">' + esc(t(C.yours ? 'game.spot.yours' : 'game.spot.lab')) + '</span>' + esc(t(C.yours ? 'game.spot.yoursD' : 'game.spot.labD')) + '</p>';
    h += '<p class="kicker">' + esc(t('game.spot.run', { left: SPOT.tests - view.tests.length })) + '</p><div class="chips pats">' + C.rows.map((r, i) => '<button type="button" class="chipb mono" data-pat="' + i + '"' + (view.tests.includes(i) || view.tests.length >= SPOT.tests ? ' disabled' : '') + ' title="' + esc(C.ins.join(' ')) + '">' + esc(pat(r.v)) + '</button>').join('') + '</div>';
    if (view.tests.length) {
      h += '<div class="tt"><table><thead><tr><th>' + esc(C.ins.join(' ')) + '</th><th>' + esc(t('game.spot.should')) + '</th>' + letters.map(l => '<th>' + l + '</th>').join('') + '</tr></thead><tbody>' +
        view.tests.map(i => '<tr><td class="mono">' + esc(pat(C.rows[i].v)) + '</td><td class="mono">' + esc(C.outs.map(o => C.rows[i].e[o]).join('')) + '</td>' + letters.map((l, k) => '<td class="mono">' + esc(C.outs.map(o => spotAnswer(C, k, i)[o]).join('')) + '</td>').join('') + '</tr>').join('') + '</tbody></table><p class="small muted">' + esc(t('game.spot.cols', { outs: C.outs.join(' ') })) + '</p></div>';
      h += '<p class="kicker">' + esc(t('game.spot.which')) + '</p><div class="chips">' + letters.map((l, k) => '<button type="button" class="chipb" data-guess="' + k + '">' + l + '</button>').join('') + '</div>';
    }
    if (view.wrong != null) h += '<p class="small bad">' + esc(t('game.spot.fine', { chip: letters[view.wrong] })) + '</p>';
    const caught = view.tests.some(i => C.bad[i].mis.length);
    if (view.tests.length >= SPOT.tests && !caught) h += '<p class="small hint">' + esc(t('game.spot.missed')) + '</p><button type="button" class="btn" data-again>' + esc(t('game.restart')) + '</button>';
    if (view.guess === C.broken) h += '<p class="verdict good">' + esc(t('game.spot.found', { chip: letters[C.broken] })) + '</p><p class="small">' + esc(t('game.spot.why', { v: C.v })) + '</p>';
    return h + doneNote() + reward();
  }

  /* ---- break: a design of the ledger that passed its check. Set the inputs tick by tick; the piece's own rule
     and the design answer side by side. The first tick where they differ is a break: a case the check never tried. ---- */
  const TICKS = 8;
  function brk() {
    const W = world(S), T = W.byId[ch.of], proj = projectOf(ch.p), lab = testOf({ proj }), bits = (o, outs) => outs.map(k => o[k]).join('');
    if (!view.seq) view.seq = Array.from({ length: TICKS }, () => Object.fromEntries(proj.ins.map(k => [k, 1])));
    const R = runCase(ch.p, T.code, view.seq), hit = R.first >= 0, mine = view.slip && draftOf(S, view.slip), was = T.state === 'broken' && !(mine && T.brokenBy === mine.id) ? W.byId[T.brokenBy] : null;
    let h = head() + '<p class="small why">' + esc(t(was ? 'game.break.was' : 'game.break.why', { ticks: lab.length, by: T.by, who: was ? was.by : '' })) + '</p>';
    h += '<div class="yours"><span class="kicker">' + esc(T.title) + ' · ' + esc(T.by) + ' · ' + esc(t('build.kind.' + T.made)) + '</span><pre class="mono small code">' + esc(T.code) + '</pre>' + (T.words ? '<span class="small muted">' + esc(t('game.break.says', { words: T.words })) + '</span>' : '') + '</div>';
    h += '<div class="tt ticks"><table><thead><tr><th>' + esc(t('game.break.tick')) + '</th>' + view.seq.map((_, i) => '<th>' + (i + 1) + '</th>').join('') + '</tr></thead><tbody>' +
      proj.ins.map(k => '<tr><th class="mono">' + esc(k) + '</th>' + view.seq.map((v, i) => '<td><button type="button" class="tick' + (v[k] ? ' on' : '') + '" data-tick="' + i + '" data-in="' + esc(k) + '" aria-pressed="' + !!v[k] + '" aria-label="' + esc(t('game.break.set', { name: k, n: i + 1 })) + '">' + v[k] + '</button></td>').join('') + '</tr>').join('') +
      '<tr><th>' + esc(t('game.spot.should')) + '</th>' + R.rows.map(r => '<td class="mono">' + esc(bits(r.e, proj.outs)) + '</td>').join('') + '</tr>' +
      '<tr><th>' + esc(t('game.break.does')) + '</th>' + R.rows.map((r, i) => '<td class="mono' + (r.mis.length ? ' wrongc' : '') + (i === R.first ? ' first' : '') + '">' + esc(bits(r.o, proj.outs)) + '</td>').join('') + '</tr></tbody></table>' +
      '<p class="small muted">' + esc(t('game.break.cols', { ins: proj.ins.join(' '), outs: proj.outs.join(' ') })) + '</p></div>';
    h += '<div class="acts"><button type="button" class="btn" data-labtest>' + esc(t('game.break.lab')) + '</button>' + (view.hint ? '' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>') + '</div>';
    if (view.hint && !hit) h += '<p class="small hint">' + esc(t('game.break.hint')) + '</p>';
    if (hit) { const r = R.rows[R.first];
      h += '<p class="verdict good">' + esc(t('game.break.found', { n: R.first + 1, want: bits(r.e, proj.outs), got: bits(r.o, proj.outs) })) + '</p>';
      h += was ? '<p class="small">' + esc(t('game.break.too', { who: was.by })) + '</p>' : '<p class="small">' + esc(t('game.break.then')) + '</p>' + entry('ledger.keep.break'); }
    else h += '<p class="verdict">' + esc(t('game.break.holds', { n: view.seq.length })) + '</p>' + (view.tried && !was ? '<p class="small muted">' + esc(t('game.break.heldNote')) + '</p>' + entry('ledger.keep.try') : '');
    return h + doneNote();
  }

  /* ---- bet: say where you think the balance is, then find it. Moore's bet: a real wafer, cut into chips of the
     size you choose, specked by the line you choose; each part's cost is counted from what works ---- */
  const betOf = () => (S.bets[ch.id] = Bet.normalBetOf(ch.bet, S.bets[ch.id]));
  const million = i => t('bet.sizeV', { n: Bet.SIZES[i] });
  const times = v => isFinite(v) ? t('bet.times', { v: v >= 10 ? Math.round(v) : v.toFixed(2) }) : t('bet.none');
  function bet() { return ch.bet === 'oxen' ? betOxen() : ch.bet === 'onebad' ? betPieces() : ch.bet === 'prove' ? betProve() : ch.bet === 'jevons' ? betJevons() : ch.bet === 'batch' ? betBatch() : betMoore(); }
  function betMoore() {
    const b = betOf();
    let h = head();
    if (b.guess == null) {
      /* first, a guess: the act of predicting before you look */
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.predict')) + '</p><div class="chips">' +
        Bet.SIZES.map((_, i) => '<button type="button" class="chipb" data-guess-size="' + i + '">' + esc(million(i)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.model')) + '</p>';
      return h + reward();
    }
    const M = Bet.moore(b.size, b.clean), C = Bet.check(b), cur = Bet.curve(b.clean), low = Bet.cheapest(b.clean);
    const gs = [{ k: 'size', ok: C.big, v: million(b.size), target: t('bet.gSize', { n: Bet.GOAL.minParts }), f: Math.min(1, Bet.SIZES[b.size] / Bet.GOAL.minParts) },
      { k: 'cost', ok: C.close, v: times(C.rel), target: t('bet.gCost', { v: Bet.GOAL.maxRel }), f: C.ok || C.close ? 1 : Math.min(1, Bet.GOAL.maxRel / C.rel) }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    /* the wafer and the curve, side by side where there is room */
    h += '<div class="betview"><figure class="wafer"><canvas class="betwafer" width="320" height="320" role="img" aria-label="' + esc(t('bet.waferAria', { chips: M.chips, good: M.good })) + '"></canvas><figcaption class="small muted">' + esc(t('bet.counts', { chips: M.chips, good: M.good })) + '</figcaption></figure>' + curveSvg(cur, low, b) + '</div>';
    h += '<label class="lab" for="bet-size"><b>' + esc(t('bet.size')) + '</b> <output>' + esc(million(b.size)) + '</output></label><input type="range" id="bet-size" data-bet="size" min="0" max="' + (Bet.SIZES.length - 1) + '" step="1" value="' + b.size + '">';
    h += '<label class="lab" for="bet-clean"><b>' + esc(t('bet.clean')) + '</b> <output>' + esc(t('bet.cleanV', { d: Bet.CLEAN[b.clean] })) + '</output></label><input type="range" id="bet-clean" data-bet="clean" min="0" max="' + (Bet.CLEAN.length - 1) + '" step="1" value="' + b.clean + '">';
    h += '<p class="readout small">' + esc(t('bet.readout', { wafer: times(M.wafer), cost: times(C.rel) })) + '</p>';
    h += '<p class="small ' + (b.guess === low ? 'good' : 'hint') + '">' + esc(t(b.guess === low ? 'bet.guessRight' : 'bet.guessOff', { g: Bet.SIZES[b.guess], n: Bet.SIZES[low] })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* ---- Cray's bet: one strong core, many small ones, or both, on one chip that serves two jobs ---- */
  function betOxen() {
    const b = betOf(), G = Bet.GUESSES;
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.ox.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-ox="' + i + '">' + esc(t('bet.ox.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.ox.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkOxen(b), M = C.M, X = Bet.OX_GOAL;
    const gs = [{ k: 'app', ok: C.app, v: times(M.app), target: t('bet.ox.gApp', { v: X.app }), f: Math.min(1, M.app / X.app) },
      { k: 'ai', ok: C.ai, v: times(M.ai), target: t('bet.ox.gApp', { v: X.ai }), f: Math.min(1, M.ai / X.ai) },
      { k: 'size', ok: C.size, v: t('bet.ox.sizeV', { v: M.size }), target: t('bet.ox.gSize', { v: X.size }), f: C.size ? 1 : X.size / M.size }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.ox.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    h += '<div class="betview">' + planSvg(M) + '<div class="races">' + ['app', 'ai'].map(k => race(k, M[k], X[k])).join('') + '<p class="small muted">' + esc(t('bet.ox.raceNote')) + '</p></div></div>';
    h += '<label class="lab" for="bet-ox"><b>' + esc(t('bet.ox.ox')) + '</b> <output>' + esc(M.r > 1 ? t('bet.ox.units', { n: M.r }) : t('bet.ox.noOx')) + '</output></label><input type="range" id="bet-ox" data-bet="ox" min="0" max="' + (Bet.OX.length - 1) + '" step="1" value="' + b.ox + '">';
    h += '<label class="lab" for="bet-hens"><b>' + esc(t('bet.ox.hens')) + '</b> <output>' + esc(t('bet.ox.hensV', { n: M.m })) + '</output></label><input type="range" id="bet-hens" data-bet="hens" min="0" max="' + (Bet.HENS.length - 1) + '" step="1" value="' + b.hens + '">';
    h += '<p class="small ' + (G[b.guess] === 'both' ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === 'both' ? 'bet.ox.right' : 'bet.ox.off', { g: t('bet.ox.g.' + G[b.guess]) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.ox.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.ox.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* one job's speed, on a log scale up to 300 times one small core, with the goal as a mark */
  function race(k, v, goal) {
    const p = x => Math.max(2, Math.min(100, 100 * Math.log(x) / Math.log(300)));
    return '<div class="race' + (v >= goal ? ' ok' : '') + '"><span class="rl">' + esc(t('bet.ox.race.' + k)) + '</span><span class="rbar"><span style="width:' + p(v).toFixed(1) + '%"></span><i style="left:' + p(goal).toFixed(1) + '%"></i></span><span class="rv">' + esc(times(v)) + '</span></div>';
  }
  /* the chip as units: the strong core a dark block, small cores squares, more than the budget past a dashed line */
  function planSvg(M) {
    const F = Bet.floorplan(M.r, M.m), c = 10, W = F.W * c, H = F.rows * c, over = F.rows > F.budgetRows;
    return '<figure class="oxplan"><svg viewBox="-2 -2 ' + (W + 4) + ' ' + (H + 4) + '" role="img" aria-label="' + esc(t('bet.ox.planAria', { r: M.r, m: M.m, size: M.size })) + '">' +
      (over ? '<rect class="over" x="0" y="' + F.budgetRows * c + '" width="' + W + '" height="' + (H - F.budgetRows * c) + '"/>' : '') +
      (F.ox ? '<rect class="ox" x="0.6" y="0.6" width="' + (F.ox.w * c - 1.2) + '" height="' + (F.ox.h * c - 1.2) + '" rx="2"/>' : '') +
      F.hens.map(([x, y]) => '<rect class="hen" x="' + (x * c + 1.2) + '" y="' + (y * c + 1.2) + '" width="' + (c - 2.4) + '" height="' + (c - 2.4) + '" rx="1"/>').join('') +
      '<rect class="edge" x="0" y="0" width="' + W + '" height="' + Math.min(H, F.budgetRows * c) + '"/>' +
      (over ? '<line class="budget" x1="0" x2="' + W + '" y1="' + F.budgetRows * c + '" y2="' + F.budgetRows * c + '"/>' : '') +
      '</svg><figcaption class="small muted">' + esc(t('bet.ox.plan', { size: M.size })) + '</figcaption></figure>';
  }
  /* each part's cost at every size on this line (log scale), the cheapest point, your size, your guess, the goal */
  function curveSvg(cur, low, b) {
    const W = 300, H = 200, l = 34, r = 10, top = 12, bot = 34, n = cur.length, top2 = 6, x = i => l + i * (W - l - r) / (n - 1);
    const y = v => top + (H - top - bot) * (1 - Math.log(Math.min(v, top2)) / Math.log(top2));
    const pts = cur.map((v, i) => x(i).toFixed(1) + ',' + y(isFinite(v) ? v : top2).toFixed(1)).join(' ');
    const gx = x(Bet.SIZES.indexOf(Bet.GOAL.minParts)), gy = y(Bet.GOAL.maxRel);
    return '<figure class="betcurve"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.curveAria', { n: Bet.SIZES[low] })) + '">' +
      '<rect class="goalzone" x="' + (gx - 8).toFixed(1) + '" y="' + top + '" width="' + (W - r - gx + 8).toFixed(1) + '" height="' + (gy - top).toFixed(1) + '"/>' +
      [1, 2, 4].map(v => '<line class="grid" x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/><text class="ax" x="' + (l - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + esc(t('bet.times', { v })) + '</text>').join('') +
      Bet.SIZES.map((sz, i) => i % 2 ? '' : '<text class="ax" x="' + x(i).toFixed(1) + '" y="' + (H - bot + 20) + '" text-anchor="middle">' + sz + '</text>').join('') +
      '<text class="ax" x="' + ((l + W - r) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(t('bet.axis')) + '</text>' +
      '<polyline class="line" points="' + pts + '"/>' +
      '<circle class="low" cx="' + x(low).toFixed(1) + '" cy="' + y(cur[low]).toFixed(1) + '" r="7"/>' +
      '<path class="guess" d="M' + x(b.guess).toFixed(1) + ' ' + (H - bot + 1) + 'l-4.5 6.5h9z"/>' +
      '<circle class="you" cx="' + x(b.size).toFixed(1) + '" cy="' + y(isFinite(cur[b.size]) ? cur[b.size] : top2).toFixed(1) + '" r="4.5"/>' +
      '</svg><figcaption class="small muted">' + esc(t('bet.legend')) + '</figcaption></figure>';
  }
  /* the wafer, painted from the engine's own layout and specks. Moore's bet: dead chips dark, working ones light.
     The pieces' bet: good pieces light, pieces the test caught dark, bad pieces it missed in the warm colour. */
  function paintWafer() {
    const cv = el.querySelector('.betwafer'); if (!cv || ch.kind !== 'bet') return;
    const b = betOf(), dpr = Math.min(2, window.devicePixelRatio || 1), px = 320;
    if (cv.width !== px * dpr) { cv.width = px * dpr; cv.height = px * dpr; }
    const g = cv.getContext('2d'), cs = getComputedStyle(el), col = (k, d) => cs.getPropertyValue(k).trim() || d;
    const ink = col('--ink', '#222'), bad = col('--bad', '#c33'), good = col('--good', '#2a7'), warm = col('--warm', '#d80');
    let s, cells, paint, d;
    if (ch.bet === 'onebad') { const P = Bet.pieces(b.k, b.test); s = P.s; cells = P.cells; d = Bet.CLEAN[2]; paint = n => P.state[n] === 'good' ? [good, 0.55] : P.state[n] === 'caught' ? [bad, 0.75] : [warm, 0.95]; }
    else { const M = Bet.moore(b.size, b.clean); s = M.s; cells = M.cells; d = M.d; paint = n => M.alive[n] ? [good, 0.55] : [bad, 0.75]; }
    const k = px * dpr / (2 * Bet.WAFER.r + 8), o = px * dpr / 2;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
    g.save(); g.translate(o, o); g.scale(k, -k);
    g.beginPath(); g.arc(0, 0, Bet.WAFER.r, 0, Math.PI * 2); g.fillStyle = ink; g.globalAlpha = 0.07; g.fill(); g.globalAlpha = 0.35; g.lineWidth = 1 / k * dpr; g.strokeStyle = ink; g.stroke();
    const gap = Math.min(0.6, s * 0.06);
    cells.forEach(([i, j], n) => { const [c, a] = paint(n); g.globalAlpha = a; g.fillStyle = c; g.fillRect(i * s + gap / 2, j * s + gap / 2, s - gap, s - gap); });
    g.globalAlpha = 0.9; g.fillStyle = ink; const rr = Math.max(0.7, 1.1 / k * dpr);
    Bet.specksOf(d).forEach(([x, y]) => { g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); });
    g.restore();
  }
  /* the scene behind the card answers the dials (src/app/scenes.js setBetScene): the 3D wafer shows the bet's
     wafer, the data centre's chip the bet's cores. Before the guess, the scene stays yours. */
  function betScene() {
    if (ch.kind !== 'bet') return;
    const b = betOf(); if (b.guess == null) return setBetScene(null, null, '');
    /* bets whose answer is in the card alone leave the scene as it is */
    if (ch.bet === 'prove' || ch.bet === 'batch') return setBetScene(null, null, '');
    if (ch.bet === 'jevons') { const J = Bet.jevons(b.eff, b.cap); return setBetScene(null, null, 'jevons:' + b.eff + ':' + b.cap, { need: J.turbines, own: Bet.TURBINES }); }
    if (ch.bet === 'oxen') { const M = Bet.oxen(b.ox, b.hens); return setBetScene(null, { r: M.r, m: M.m, plan: Bet.floorplan(M.r, M.m) }, 'oxen:' + b.ox + ':' + b.hens); }
    let s, cells, tone, d;
    if (ch.bet === 'onebad') { const P = Bet.pieces(b.k, b.test); s = P.s; cells = P.cells; d = Bet.CLEAN[2]; tone = n => P.state[n] === 'good' ? 'ok' : P.state[n] === 'caught' ? 'lost' : 'missed'; }
    else { const M = Bet.moore(b.size, b.clean); s = M.s; cells = M.cells; d = M.d; tone = n => M.alive[n] ? 'ok' : 'lost'; }
    /* millimetres on the bet's wafer to the scene's 1000 x 1000, the wafer's middle at 500; a 2-unit gap between chips */
    const k = SCENE_WAFER.R / Bet.WAFER.r, at = v => 500 + v * k, side = s * k;
    const dies = cells.map(([i, j]) => [at(i * s) + 1, at(j * s) + 1, side - 2, side - 2]), tones = cells.map((_, n) => tone(n));
    const near = dies.map((q, n) => [n, Math.hypot(q[0] + q[2] / 2 - 500, q[1] + q[3] / 2 - 500)]).filter(([n]) => tones[n] === 'ok').sort((x, y) => x[1] - y[1])[0];
    const f = dies[near ? near[0] : 0] || [500, 500, 40, 40];
    setBetScene({ dies, hits: tones.map(x => x !== 'ok'), tones, specks: Bet.specksOf(d).map(([x, y]) => [at(x), at(y)]), R: SCENE_WAFER.R, follow: [f[0], f[1], f[2]] }, null, ch.bet + ':' + JSON.stringify(b));
  }
  /* ---- the proof's bet: run random tests, or prove blocks by machine; tap a block to prove it ---- */
  /* a power of ten as it is written: 10⁶ */
  const sup = n => String(n).replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const pct = v => v < 0.0001 ? t('bet.pv.tiny') : v < 0.01 ? t('bet.pv.pctFine', { v: (v * 100).toFixed(2) }) : t('gauge.pct', { v: Math.round(v * 100) });
  function betProve() {
    const b = betOf(), G = Bet.PROVE_GUESSES;
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.pv.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-pv="' + i + '">' + esc(t('bet.pv.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.pv.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkProve(b), R = C.R, X = Bet.PROVE_GOAL;
    const gs = [{ k: 'escape', ok: C.safe, v: pct(R.escape), target: t('bet.pv.gEscape', { v: Math.round(X.maxEscape * 100) }), f: C.safe ? 1 : Math.min(1, X.maxEscape / R.escape) },
      { k: 'cost', ok: C.cheap, v: t('bet.pv.costV', { v: R.cost < 10 ? R.cost.toFixed(1) : Math.round(R.cost) }), target: t('bet.pv.gCost', { v: X.maxCost }), f: C.cheap ? 1 : X.maxCost / R.cost }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.pv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    /* the chip, block by block: how rare its bug is, the chance it is still hidden, and the proof's price */
    h += '<p class="kicker">' + esc(t('bet.pv.blocksK')) + '</p><div class="pblocks">' + R.blocks.map((B, i) => {
      const st = B.proved ? 'proved' : B.hidden > 0.01 ? 'hidden' : 'found';
      return '<button type="button" class="pblock ' + st + '" data-prove="' + i + '" aria-pressed="' + B.proved + '"><span class="pn">' + (B.proved ? glyph('limit') : '') + esc(t('bet.pv.b.' + B.id)) + '</span>' +
        '<span class="pr small muted">' + esc(t('bet.pv.rare', { n: sup(Math.round(-Math.log10(B.p))) })) + '</span>' +
        '<span class="ph"><span style="width:' + (B.hidden * 100).toFixed(1) + '%"></span></span>' +
        '<span class="pv small">' + esc(B.proved ? t('bet.pv.provedV', { c: B.proof }) : t('bet.pv.hiddenV', { v: pct(B.hidden), c: B.proof })) + '</span></button>';
    }).join('') + '</div><p class="small muted">' + esc(t('bet.pv.blocksNote')) + '</p>';
    const n = Math.round(Math.log10(R.T));
    h += '<label class="lab" for="bet-tests"><b>' + esc(t('bet.pv.tests')) + '</b> <output>' + esc(t('bet.pv.testsV', { n: sup(n), c: Bet.testCost(R.T) < 1 ? Bet.testCost(R.T).toFixed(2) : Math.round(Bet.testCost(R.T)) })) + '</output></label><input type="range" id="bet-tests" data-bet="tests" min="0" max="' + (Bet.PTESTS.length - 1) + '" step="1" value="' + b.tests + '">';
    h += '<p class="small ' + (G[b.guess] === Bet.PROVE_ANSWER ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === Bet.PROVE_ANSWER ? 'bet.pv.right' : 'bet.pv.off', { g: t('bet.pv.g.' + G[b.guess]) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.pv.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.pv.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* ---- Jevons' bet: a better chip makes each answer cheaper; the world asks more; does the island hold? ---- */
  const frac = v => v >= 1 ? String(v) : '1/' + Math.round(1 / v);
  const xTimes = v => t('bet.times', { v: v >= 10 ? Math.round(v) : v.toFixed(2) });
  function betJevons() {
    const b = betOf(), G = Bet.J_GUESSES, right = Bet.jevonsAnswer();
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.jv.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-jv="' + i + '">' + esc(t('bet.jv.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.jv.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkJevons(b), J = C.J, X = Bet.J_GOAL;
    const gs = [{ k: 'answers', ok: C.many, v: xTimes(J.answers), target: t('bet.jv.gAnswers', { v: X.minAnswers }), f: Math.min(1, J.answers / X.minAnswers) },
      { k: 'energy', ok: C.held, v: xTimes(J.energy), target: t('bet.jv.gEnergy', { v: Math.round(X.maxEnergy * 100) }), f: C.held ? 1 : X.maxEnergy / J.energy }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.jv.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    h += '<div class="betview">' + turbinesSvg(J) + pathSvg(b) + '</div>';
    h += '<label class="lab" for="bet-eff"><b>' + esc(t('bet.jv.eff')) + '</b> <output>' + esc(t(b.eff ? 'bet.jv.effV' : 'bet.jv.eff0', { v: frac(J.e) })) + '</output></label><input type="range" id="bet-eff" data-bet="eff" min="0" max="' + (Bet.EFF.length - 1) + '" step="1" value="' + b.eff + '">';
    h += '<label class="lab" for="bet-cap"><b>' + esc(t('bet.jv.cap')) + '</b> <output>' + esc(isFinite(J.cap) ? t('bet.jv.capV', { v: J.cap }) : t('bet.jv.capNone')) + '</output></label><input type="range" id="bet-cap" data-bet="cap" min="0" max="' + (Bet.CAP.length - 1) + '" step="1" value="' + b.cap + '">';
    const J8 = Bet.jevons(3, Bet.CAP.length - 1);
    h += '<p class="small ' + (G[b.guess] === right ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === right ? 'bet.jv.right' : 'bet.jv.off', { g: t('bet.jv.g.' + G[b.guess]), a: Math.round(J8.answers), e: J8.energy.toFixed(1) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.jv.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.jv.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* the turbines the answers draw: the island's own (turning, or standing idle), the ones it would need beyond them,
     and, past the island's limit, the asking it turns away (drawn as outlines) */
  function turbinesSvg(J) {
    const n = J.turbines, N = Bet.TURBINES, want = J.asked * J.e * N, all = Math.max(N, Math.ceil(want - 1e-9)), cols = 15, c = 20, rows = Math.ceil(all / cols), W = cols * c, H = rows * 26 + 4;
    const one = i => { const x = (i % cols) * c + c / 2, y = Math.floor(i / cols) * 26 + 2, hub = y + 8, st = i < n ? (i < N ? 'on' : 'more') : i < N ? 'idle' : 'away', part = i + 1 > n && i < n ? Math.max(0.25, n - i) : 1;
      return '<g class="tb ' + st + '"' + (part < 1 ? ' opacity="' + part.toFixed(2) + '"' : '') + '><line class="mast" x1="' + x + '" y1="' + (y + 24) + '" x2="' + x + '" y2="' + hub + '"/>' +
        '<g class="rot" style="transform-origin:' + x + 'px ' + hub + 'px">' + [0, 120, 240].map(a => { const r = (a - 90) * Math.PI / 180; return '<line x1="' + x + '" y1="' + hub + '" x2="' + (x + 7 * Math.cos(r)).toFixed(1) + '" y2="' + (hub + 7 * Math.sin(r)).toFixed(1) + '"/>'; }).join('') + '</g></g>'; };
    const shore = '<rect class="isle" x="0.5" y="0.5" width="' + (Math.min(N, cols) * c - 1) + '" height="' + (Math.ceil(N / cols) * 26 + 1) + '" rx="6"/>';
    /* past the island's own, a part of a turbine still needs a whole one */
    const k = n > N ? Math.ceil(n - 1e-9) : Math.round(n), key = k > N ? 'bet.jv.more' : k < N ? 'bet.jv.idle' : 'bet.jv.held', away = Math.round(want - n);
    const words = t(key, { n: k, N, x: k - N, i: N - k }) + (away >= 1 ? ' ' + t('bet.jv.away', { w: away }) : '');
    return '<figure class="turbines"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(words) + '">' + shore + Array.from({ length: all }, (_, i) => one(i)).join('') + '</svg>' +
      '<figcaption class="small muted">' + esc(words) + '</figcaption></figure>';
  }
  /* where the world goes: answers across, energy up, both against today, on scales of tens. Each line is one limit on
     the island's power; along it, each dot a better chip. Under a limit the line turns flat: a better chip then buys
     answers, not energy. The ring is today; the hollow dot what the world asks, the asking past the limit dashed. */
  function pathSvg(b) {
    const W = 300, H = 210, l = 36, r = 10, top = 10, bot = 36, lx = [0.5, 400], ly = [0.3, 8];
    const x = v => l + (W - l - r) * Math.log(v / lx[0]) / Math.log(lx[1] / lx[0]), y = v => top + (H - top - bot) * (1 - Math.log(v / ly[0]) / Math.log(ly[1] / ly[0]));
    const P = (ei, ci) => { const J = Bet.jevons(ei, ci); return [x(J.answers), y(J.energy)]; };
    const line = ci => Bet.EFF.map((_, ei) => P(ei, ci).map(v => v.toFixed(1)).join(',')).join(' ');
    const J = Bet.jevons(b.eff, b.cap), gx = x(Bet.J_GOAL.minAnswers), gy = y(Bet.J_GOAL.maxEnergy), [px, py] = P(b.eff, b.cap), ax = x(J.asked), ay = y(J.asked * J.e);
    return '<figure class="betcurve jpath"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.jv.pathAria')) + '">' +
      '<rect class="goalzone" x="' + gx.toFixed(1) + '" y="' + gy.toFixed(1) + '" width="' + (W - r - gx).toFixed(1) + '" height="' + (H - bot - gy).toFixed(1) + '"/>' +
      [1, 10, 100].map(v => '<line class="grid" x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/><text class="ax" x="' + x(v).toFixed(1) + '" y="' + (H - bot + 14) + '" text-anchor="middle">' + esc(t('bet.times', { v })) + '</text>').join('') +
      [0.5, 1, 4].map(v => '<text class="ax" x="' + (l - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + esc(t('bet.times', { v })) + '</text>').join('') +
      '<line class="cap" x1="' + l + '" x2="' + (W - r) + '" y1="' + y(1).toFixed(1) + '" y2="' + y(1).toFixed(1) + '"/>' +
      Bet.CAP.map((_, ci) => ci === b.cap ? '' : '<polyline class="other" points="' + line(ci) + '"/>').join('') +
      '<polyline class="line" points="' + line(b.cap) + '"/>' + Bet.EFF.map((_, ei) => { const [cx, cy] = P(ei, b.cap); return '<circle class="step" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="2.4"/>'; }).join('') +
      (J.waiting > 1e-9 ? '<line class="awayline" x1="' + px.toFixed(1) + '" y1="' + py.toFixed(1) + '" x2="' + ax.toFixed(1) + '" y2="' + ay.toFixed(1) + '"/><circle class="asked" cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="4"/>' : '') +
      '<circle class="today" cx="' + x(1).toFixed(1) + '" cy="' + y(1).toFixed(1) + '" r="5"/>' +
      '<circle class="you" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="5"/>' +
      '<text class="ax" x="' + ((l + W - r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(t('bet.jv.axisX')) + '</text>' +
      '<text class="ax" transform="translate(11 ' + ((top + H - bot) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(t('bet.jv.axisY')) + '</text>' +
      '</svg><figcaption class="small muted">' + esc(t('bet.jv.legend')) + '</figcaption></figure>';
  }
  /* ---- the batch bet: how many people the chip serves at once, and how many bits each number takes ---- */
  function betBatch() {
    const b = betOf(), G = Bet.BATCH_GUESSES, right = Bet.batchAnswer();
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.bt.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-bt="' + i + '">' + esc(t('bet.bt.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.bt.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkBatch(b), R = C.R, X = Bet.BATCH_GOAL, pctB = v => v < 0.01 ? t('bet.pv.pctFine', { v: (v * 100).toFixed(2) }) : t('gauge.pct', { v: Math.round(v * 100) });
    const gs = [{ k: 'speed', ok: C.fast, v: t('bet.bt.tps', { v: Math.round(R.tokPerUser) }), target: t('bet.bt.gSpeed', { v: X.minSpeed }), f: Math.min(1, R.tokPerUser / X.minSpeed) },
      { k: 'busy', ok: C.busy, v: pctB(R.utilization), target: t('bet.bt.gBusy', { v: Math.round(X.minBusy * 100) }), f: Math.min(1, R.utilization / X.minBusy) }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.bt.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    /* one step of writing: reading every weight, against doing the sums for everyone; the step takes the longer */
    const ms = v => v * 1000 < 1 ? (v * 1000).toFixed(2) : (v * 1000).toFixed(1), top = Math.max(R.tMemS, R.tCmpS), w = v => Math.max(0.8, v / top * 100).toFixed(1);
    h += '<div class="betview" data-f2="instrument"><figure class="btstep"><div class="agrace"><span class="small">' + esc(t('bet.bt.read')) + '</span><span class="agbar' + (R.memoryBound ? ' hot' : '') + '"><span style="width:' + w(R.tMemS) + '%"></span></span><b class="mono small">' + esc(t('agent.tool.ms', { v: ms(R.tMemS) })) + '</b>' +
      '<span class="small">' + esc(t('bet.bt.sums', { n: R.people })) + '</span><span class="agbar' + (R.memoryBound ? '' : ' hot') + '"><span style="width:' + w(R.tCmpS) + '%"></span></span><b class="mono small">' + esc(t('agent.tool.ms', { v: ms(R.tCmpS) })) + '</b></div>' +
      '<figcaption class="small muted">' + esc(t(R.memoryBound ? 'bet.bt.waitsMem' : 'bet.bt.waitsSum', { n: R.people })) + '</figcaption></figure>' + batchSvg(b) + '</div>';
    h += '<label class="lab" for="bet-batch"><b>' + esc(t('bet.bt.batch')) + '</b> <output>' + esc(t('bet.bt.batchV', { n: R.people })) + '</output></label><input type="range" id="bet-batch" data-bet="batch" min="0" max="' + (Bet.BATCH.length - 1) + '" step="1" value="' + b.batch + '">';
    h += '<label class="lab" for="bet-format"><b>' + esc(t('bet.bt.format')) + '</b> <output>' + esc(t('bet.bt.f.' + Bet.BFORMATS[b.format])) + '</output></label><input type="range" id="bet-format" data-bet="format" min="0" max="' + (Bet.BFORMATS.length - 1) + '" step="1" value="' + b.format + '">';
    const R1 = Bet.batched(0, 0);
    h += '<p class="small ' + (G[b.guess] === right ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === right ? 'bet.bt.right' : 'bet.bt.off', { g: t('bet.bt.g.' + G[b.guess]), v: (R1.utilization * 100).toFixed(1) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.bt.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.bt.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* each person's speed against how many are served at once, one line for each number size; the chip is 80% busy
     right of the dashed line; the green corner is the goal */
  function batchSvg(b) {
    const W = 300, H = 210, l = 40, r = 10, top = 10, bot = 36, lx = [1, 4096], ly = [10, 1000];
    const x = v => l + (W - l - r) * Math.log(v / lx[0]) / Math.log(lx[1] / lx[0]), y = v => top + (H - top - bot) * (1 - Math.log(Math.max(ly[0], Math.min(ly[1], v)) / ly[0]) / Math.log(ly[1] / ly[0]));
    const line = fi => Bet.BATCH.map((_, bi) => { const R = Bet.batched(bi, fi); return x(R.people).toFixed(1) + ',' + y(R.tokPerUser).toFixed(1); }).join(' ');
    /* while the chip waits on memory, each person more adds the same share of busy arithmetic */
    const busyAt = Math.min(4096, Bet.BATCH_GOAL.minBusy / Bet.batched(0, 0).utilization);
    const R = Bet.batched(b.batch, b.format), gx = x(busyAt), gy = y(Bet.BATCH_GOAL.minSpeed);
    return '<figure class="betcurve jpath btcurve"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.bt.aria')) + '">' +
      '<rect class="goalzone" x="' + gx.toFixed(1) + '" y="' + top + '" width="' + (W - r - gx).toFixed(1) + '" height="' + (gy - top).toFixed(1) + '"/>' +
      [1, 16, 256, 4096].map(v => '<line class="grid" x1="' + x(v).toFixed(1) + '" x2="' + x(v).toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/><text class="ax" x="' + x(v).toFixed(1) + '" y="' + (H - bot + 14) + '" text-anchor="' + (v === 4096 ? 'end' : 'middle') + '">' + v + '</text>').join('') +
      [10, 100, 1000].map(v => '<text class="ax" x="' + (l - 5) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>').join('') +
      '<line class="cap" x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + top + '" y2="' + (H - bot) + '"/>' +
      Bet.BFORMATS.map((_, fi) => fi === b.format ? '' : '<polyline class="other" points="' + line(fi) + '"/>').join('') + '<polyline class="line" points="' + line(b.format) + '"/>' +
      '<circle class="you" cx="' + x(R.people).toFixed(1) + '" cy="' + y(R.tokPerUser).toFixed(1) + '" r="5"/>' +
      '<text class="ax" x="' + ((l + W - r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(t('bet.bt.axisX')) + '</text>' +
      '<text class="ax" transform="translate(11 ' + ((top + H - bot) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(t('bet.bt.axisY')) + '</text>' +
      '</svg><figcaption class="small muted">' + esc(t('bet.bt.legend')) + '</figcaption></figure>';
  }
  /* ---- the pieces' bet: one big piece, or many joined in one package; test each first, or not ---- */
  function betPieces() {
    const b = betOf(), G = Bet.PIECE_GUESSES, right = Bet.piecesAnswer();
    let h = head();
    if (b.guess == null) {
      h += '<p class="kicker">' + esc(t('bet.predictK')) + '</p><p class="small">' + esc(t('bet.pc.predict')) + '</p><div class="chips">' +
        G.map((g, i) => '<button type="button" class="chipb" data-guess-pc="' + i + '">' + esc(t('bet.pc.g.' + g)) + '</button>').join('') + '</div><p class="small muted">' + esc(t('bet.pc.model')) + '</p>';
      return h + reward();
    }
    const C = Bet.checkPieces(b), P = C.P, X = Bet.PIECES_GOAL;
    const gs = [{ k: 'cost', ok: C.cheap, v: times(C.rel), target: t('bet.pc.gCost', { v: X.maxRel }), f: C.cheap ? 1 : Math.min(1, X.maxRel / C.rel) },
      { k: 'share', ok: C.works, v: t('gauge.pct', { v: Math.round(P.share * 100) }), target: t('bet.pc.gShare', { v: Math.round(X.minShare * 100) }), f: Math.min(1, P.share / X.minShare) }];
    h += '<div class="goalbox' + (C.ok ? ' ok' : '') + '"><p class="kicker">' + esc(t(C.ok ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.map(g => '<div class="gauge' + (g.ok ? ' ok' : '') + '"><span class="gl">' + esc(t('bet.pc.g.' + g.k)) + '</span><span class="gv">' + esc(g.v) + ' <span class="muted">' + esc(g.target) + '</span></span><span class="gbar"><span style="width:' + (g.f * 100).toFixed(0) + '%"></span></span></div>').join('') + '</div>';
    const caught = P.state.filter(x => x === 'caught').length, missed = P.state.filter(x => x === 'missed').length;
    h += '<div class="betview"><figure class="wafer"><canvas class="betwafer" width="320" height="320" role="img" aria-label="' + esc(t('bet.pc.waferAria', { n: P.cells.length, good: P.good, caught, missed })) + '"></canvas><figcaption class="small muted">' + esc(t('bet.pc.counts', { n: P.cells.length, good: P.good, caught, missed })) + '</figcaption></figure>' + packsSvg(P) + '</div>';
    h += '<label class="lab" for="bet-k"><b>' + esc(t('bet.pc.k')) + '</b> <output>' + esc(t(P.k === 1 ? 'bet.pc.one' : 'bet.pc.kV', { n: P.k, a: Math.round(Bet.LOGIC / P.k + (P.k > 1 ? Bet.LINK : 0)) })) + '</output></label><input type="range" id="bet-k" data-bet="k" min="0" max="' + (Bet.PIECES.length - 1) + '" step="1" value="' + b.k + '">';
    h += '<label class="lab" for="bet-test"><b>' + esc(t('bet.pc.test')) + '</b> <output>' + esc(t('bet.pc.t.' + Bet.TESTS[b.test])) + '</output></label><input type="range" id="bet-test" data-bet="test" min="0" max="' + (Bet.TESTS.length - 1) + '" step="1" value="' + b.test + '">';
    h += '<p class="small ' + (G[b.guess] === right ? 'good' : 'hint') + '">' + esc(t(G[b.guess] === right ? 'bet.pc.right' : 'bet.pc.off', { g: t('bet.pc.g.' + G[b.guess]), r: t('bet.pc.g.' + right) })) + '</p>';
    if (!C.ok) h += view.hint ? '<p class="small hint">' + esc(t('bet.pc.hint')) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>';
    h += '<button type="button" class="link" data-reguess>' + esc(t('bet.again')) + '</button>';
    if (C.ok) { win(); h += '<p class="small">' + esc(t('bet.pc.why')) + '</p>'; }
    return h + doneNote() + reward();
  }
  /* the first packages off the wafer: each holds its pieces; one bad piece, or a join that fails, sinks it */
  function packsSvg(P) {
    const N = 12, L = P.packs.slice(0, N), cols = Math.ceil(Math.sqrt(P.k)), rows = Math.ceil(P.k / cols), cell = 40 / Math.max(cols, rows), W = 6 * 52, H = 2 * 56;
    const pk = (q, n) => { const x0 = (n % 6) * 52 + 4, y0 = Math.floor(n / 6) * 56 + 4;
      return '<g class="pack' + (q.ok ? '' : ' sunk') + '"><rect class="pk" x="' + x0 + '" y="' + y0 + '" width="44" height="44" rx="5"' + (q.joins ? '' : ' stroke-dasharray="3 2"') + '/>' +
        q.ids.map((id, i) => { const st = P.state[id]; return '<rect class="pc ' + st + '" x="' + (x0 + 2 + (i % cols) * cell + 0.8).toFixed(1) + '" y="' + (y0 + 2 + Math.floor(i / cols) * cell + 0.8).toFixed(1) + '" width="' + (cell - 1.6).toFixed(1) + '" height="' + (cell - 1.6).toFixed(1) + '" rx="1"/>'; }).join('') +
        (q.ok ? '' : '<path class="x" d="M' + (x0 + 8) + ' ' + (y0 + 8) + 'l28 28M' + (x0 + 36) + ' ' + (y0 + 8) + 'l-28 28"/>') + '</g>'; };
    return '<figure class="packs"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t('bet.pc.packsAria', { ok: L.filter(q => q.ok).length, n: L.length })) + '">' + L.map(pk).join('') + '</svg><figcaption class="small muted">' + esc(t('bet.pc.packs', { ok: P.working, n: P.packs.length })) + '</figcaption></figure>';
  }
  /* bring what just changed into view inside the sheet */
  const show = sel => { const n = el.querySelector(sel); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  function draw() {
    const f = ch.kind === 'design' ? design : ch.kind === 'chip' ? chip : ch.kind === 'life' ? life : ch.kind === 'break' ? brk : ch.kind === 'bet' ? bet : lab ? lab.draw : spot;
    /* the card says which challenge it holds (data-ch), so whatever drives it never reads the card before it */
    const html = '<div class="player" data-ch="' + esc(ch.id) + '">' + f() + '</div>', old = el.firstElementChild;
    if (!old || !old.classList.contains('player')) el.innerHTML = html;
    else { old.dataset.ch = ch.id; const tpl = document.createElement('template'); tpl.innerHTML = html; patch(old, tpl.content.firstElementChild); }
    paintWafer(); betScene();
  }
  /* feedback: what changed moves. A wrong answer shakes, a row that turned right flashes, a gauge that reached its
     target pops, a tapped gate bounces. Nothing moves with reduced motion. */
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = (n, k, o) => { if (n && n.animate && !still()) n.animate(k, Object.assign({ duration: 420, easing: 'cubic-bezier(.2, 1.3, .4, 1)' }, o)); };
  function fx(after) {
    const B = view.B;
    if (after === 'check' || after === 'op') {
      const v = el.querySelector('.verdict');
      if (v && v.classList.contains('bad') && after === 'check') anim(v, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380, easing: 'ease-out' });
      if (v && v.classList.contains('good')) anim(v, [{ transform: 'scale(.9)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }]);
      const rows = B && B.rows ? B.rows.map(r => !r.mis.length) : null;
      if (rows && view.rows) el.querySelectorAll('.tt tbody tr').forEach((tr, i) => { if (rows[i] !== view.rows[i]) anim(tr, [{ background: rows[i] ? 'color-mix(in srgb, var(--good) 45%, transparent)' : 'color-mix(in srgb, var(--bad) 45%, transparent)' }, { background: 'transparent' }], { duration: 900, easing: 'ease-out' }); });
      view.rows = rows;
      if (after === 'op') anim(el.querySelector('.op.just'), [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }]);
    }
    const gs = [...el.querySelectorAll('.goalbox .gauge')], ok = gs.map(g => g.classList.contains('ok'));
    if (view.okG) gs.forEach((g, i) => { if (ok[i] && !view.okG[i]) anim(g, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 500 }); });
    view.okG = ok;
    if (view.won) { anim(el.querySelector('.won'), [{ transform: 'scale(.92)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520 }); view.won = false; }
  }
  /* a lab of its own file answers its own events first (src/v2/labs) */
  lab = LABS[ch.kind] ? LABS[ch.kind]({ S, view, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show }) : null;
  el.onclick = e => {
    const q = s => e.target.closest(s);
    if (q('[data-back]')) return ctx.back();
    if (lab && lab.click(e)) return;
    /* the ledger: a tick of a case, the lab's own test, keeping your work as an entry, the slip's buttons */
    const tk = q('[data-tick]'); if (tk) { const v = view.seq[+tk.dataset.tick], k = tk.dataset.in; v[k] = v[k] ? 0 : 1; view.tried = true; view.slip = null; const R = runCase(ch.p, world(S).byId[ch.of].code, view.seq); if (R.first >= 0) win(); draw(); if (R.first >= 0) { fx('check'); show('.verdict'); } return; }
    if (q('[data-labtest]')) { const proj = projectOf(ch.p); view.seq = testOf({ proj }).slice(0, TICKS).map(v => Object.assign({}, v)); return draw(); }
    if (q('[data-keep]')) {
      const sign = signOf(el), W = world(S), T = ch.kind === 'break' ? W.byId[ch.of] : null;
      const first = T ? runCase(ch.p, T.code, view.seq).first : -1, seq = T ? view.seq.slice(0, first + 1) : null;
      const k = T && first < 0 ? keep(S, { kind: 'try', of: ch.of, cases: [view.seq.map(v => Object.assign({}, v))], words: '', about: 'fail.check' }, T.title, sign) : T ? keep(S, { kind: 'break', of: ch.of, case: seq, words: '', about: 'fail.check' }, T.title, sign) : keep(S, { kind: 'design', piece: ch.need, title: t('design.proj.' + ch.p + '.t'), words: '', code: S.codes[ch.p] || '' }, t('design.proj.' + ch.p + '.t'), Object.assign(sign, view.ai && sign.made === 'person' ? { made: 'both' } : {}));
      view.no = k.ok ? null : refusal(k.r); if (k.ok) { view.slip = k.e.id; ctx.save(); ctx.kept && ctx.kept(k.e); }
      draw(); return show('.slip, .keep');
    }
    if (slipClick(e, S, redraw => { ctx.save(); if (redraw) { view.slip = null; ctx.kept && ctx.kept(null); draw(); } })) return;
    if (q('[data-next]')) { const n = next(S); return n && ctx.open(n); }
    const gt = q('[data-goto]'); if (gt) return ctx.open(challengeOf(gt.dataset.goto));
    if (q('[data-check]')) { const code = el.querySelector('#chCode').value; S.codes[ch.p] = code; ctx.save(); view.B = checkDesign(ch.p, code); if (view.B.ok) win(); draw(); fx('check'); return show('.won, .verdict, .errs'); }
    const op = q('[data-op]'); if (op) {
      /* turn the k-th gate of the description into the next kind, and check again at once */
      const k = +op.dataset.op, code = turnGate(S.codes[ch.p] != null ? S.codes[ch.p] : starter(ch.p), k);
      S.codes[ch.p] = code; ctx.save(); view.op = k; view.B = checkDesign(ch.p, code); if (view.B.ok) win(); draw(); fx('op'); return show('.won');
    }
    const pc = q('[data-piece]'); if (pc) {
      const code = togglePiece(S.codes[ch.p] != null ? S.codes[ch.p] : starter(ch.p), TC.line, TC.pieces[+pc.dataset.piece]);
      S.codes[ch.p] = code; ctx.save(); view.op = -1; view.B = checkDesign(ch.p, code); if (view.B.ok) win(); draw(); fx('op'); anim(pc, [{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }]); return show('.won');
    }
    if (q('[data-write]')) { view.write = true; draw(); const ta = el.querySelector('#chCode'); return ta && ta.focus(); }
    if (q('[data-ai]')) { S.codes[ch.p] = aiProposal(ch.p); view.ai = true; view.B = TAP && !view.write ? checkDesign(ch.p, S.codes[ch.p]) : null; if (view.B && view.B.ok) win(); ctx.save(); draw(); return fx('check'); }
    if (q('[data-restart]')) { delete S.codes[ch.p]; view = Object.assign(view, { B: TAP ? checkDesign(ch.p, starter(ch.p)) : null, ai: false, rows: null }); ctx.save(); return draw(); }
    if (q('[data-hint]')) { view.hint = true; return draw(); }
    if (q('[data-reset]')) { Object.assign(S.chip, ctx.startChip()); ctx.save(); draw(); return fx(); }
    const lb = q('[data-life]'); if (lb) { const c = normalLife(S.life[ch.mission]); c[lb.dataset.life] = !c[lb.dataset.life]; S.life[ch.mission] = c; ctx.save(); draw(); return fx(); }
    const pr = q('[data-prot]'); if (pr) { const c = normalLife(S.life[ch.mission]); c.protect = pr.dataset.prot; S.life[ch.mission] = c; ctx.save(); draw(); return fx(); }
    const pt = q('[data-pat]'); if (pt) { view.tests.push(+pt.dataset.pat); view.wrong = null; return draw(); }
    const gs = q('[data-guess]'); if (gs) { const k = +gs.dataset.guess; if (k === spotCase(spotCode(S)).broken) { view.guess = k; win(); } else view.wrong = k; draw(); fx(); if (view.wrong === k) anim(el.querySelector('p.bad'), [{ transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return show('.won, .verdict, p.bad'); }
    if (q('[data-again]')) { view.tests = []; view.wrong = null; view.guess = null; return draw(); }
    const gbt = q('[data-guess-bt]'); if (gbt) { betOf().guess = +gbt.dataset.guessBt; ctx.save(); draw(); fx(); return show('.betview'); }
    const gj = q('[data-guess-jv]'); if (gj) { betOf().guess = +gj.dataset.guessJv; ctx.save(); draw(); fx(); return show('.betview'); }
    const gv = q('[data-guess-pv]'); if (gv) { betOf().guess = +gv.dataset.guessPv; ctx.save(); draw(); fx(); return show('.pblocks'); }
    const pb = q('[data-prove]'); if (pb) { const b = betOf(); b.proved ^= 1 << +pb.dataset.prove; ctx.save(); draw(); fx(); return; }
    const gp = q('[data-guess-pc]'); if (gp) { betOf().guess = +gp.dataset.guessPc; ctx.save(); draw(); fx(); return show('.betview'); }
    const go = q('[data-guess-ox]'); if (go) { betOf().guess = +go.dataset.guessOx; ctx.save(); draw(); fx(); return show('.betview'); }
    const gz = q('[data-guess-size]'); if (gz) { const b = betOf(); b.guess = +gz.dataset.guessSize; ctx.save(); draw(); fx(); return show('.betview'); }
    if (q('[data-reguess]')) { betOf().guess = null; ctx.save(); return draw(); }
  };
  el.oninput = e => {
    if (lab && lab.input(e)) return;
    const r = e.target.closest('[data-set]');
    if (r) { const k = r.dataset.set, v = +r.value; S.chip[k] = k === 'clock' ? CLOCKS[v] : v; ctx.save(); draw(); fx(); return; }
    const bd = e.target.closest('[data-bet]'); if (bd) { betOf()[bd.dataset.bet] = +bd.value; ctx.save(); draw(); fx(); return; }
    if (e.target.closest('[data-margin]')) { const c = normalLife(S.life[ch.mission]); c.margin = +e.target.value; S.life[ch.mission] = c; ctx.save(); draw(); }
  };
  draw(); fx();
}
