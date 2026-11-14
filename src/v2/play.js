/* The challenge player: one challenge, played where you met it (inside the sheet of its station).
   Four kinds, each checked by a real engine (src/v2/game.js):
     design  write or fix a circuit's description; ask an AI for a proposal, then let the check decide;
     chip    move your chip's settings until it reaches a goal no single setting can reach;
     life    choose what the design and the factory do, then see whether the chip lives through a place's life;
     spot    run a few test patterns on four copies, and find the one the factory broke;
     break   a design of the ledger that passed its check: find the case, tick by tick, that makes it answer wrong.
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
  const opens = () => { const k = opensOf(ch); return k ? '<a class="opens" href="' + esc(askHref(k)) + '"><span class="kicker">' + esc(t('game.opens')) + '</span><span class="q">' + esc(t('stop.' + k + '.q')) + '</span><span class="small muted">' + esc(t('sheet.follow')) + '</span></a>' : ''; };
  /* your work as an entry of the ledger: sign it and keep it, then the slip gives the way in */
  const entry = (label) => view.slip && draftOf(S, view.slip) ? slipHtml(S, view.slip) : '<div class="keep">' + signHtml(S, view.ai ? 'both' : 'person') + (view.no ? '<p class="small bad">' + esc(view.no) + '</p>' : '') + '<button type="button" class="btn primary" data-keep>' + esc(t(label)) + '</button><p class="small muted">' + esc(t('ledger.keep.note')) + '</p></div>';

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

  /* bring what just changed into view inside the sheet */
  const show = sel => { const n = el.querySelector(sel); if (n && n.scrollIntoView) n.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
  function draw() {
    const f = ch.kind === 'design' ? design : ch.kind === 'chip' ? chip : ch.kind === 'life' ? life : ch.kind === 'break' ? brk : spot;
    const html = '<div class="player">' + f() + '</div>', old = el.firstElementChild;
    if (!old || !old.classList.contains('player')) { el.innerHTML = html; return; }
    const tpl = document.createElement('template'); tpl.innerHTML = html; patch(old, tpl.content.firstElementChild);
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
  el.onclick = e => {
    const q = s => e.target.closest(s);
    if (q('[data-back]')) return ctx.back();
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
  };
  el.oninput = e => {
    const r = e.target.closest('[data-set]');
    if (r) { const k = r.dataset.set, v = +r.value; S.chip[k] = k === 'clock' ? CLOCKS[v] : v; ctx.save(); draw(); fx(); return; }
    if (e.target.closest('[data-margin]')) { const c = normalLife(S.life[ch.mission]); c.margin = +e.target.value; S.life[ch.mission] = c; ctx.save(); draw(); }
  };
  draw(); fx();
}
