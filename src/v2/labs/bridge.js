/* One spec, two matters (kind 'bridge', at the gate), from src/engines/strands.js: the core question "Fight or use
   physics", with "Where does the digital world end" and "What remains beyond computation" beside it.
   The same truth table is written once and run in two kinds of matter side by side: in silicon, as the bench's own
   gates (exact, in picoseconds, made in a factory), and in a test tube of DNA strands (a seesaw gate's input strand
   pushes its output strand off; a threshold soaks up the first part of the input; fuel recycles the input so a weak
   signal comes out full, and leaks). Two challenges:
   - 'bridge': an AND, then a choice (s ? a : b, two ANDs and an OR, the selector as two strands since the tube has no
     NOT). The player sets each kind of gate's threshold and fuel until the tube answers right on every input, worst
     case amounts, within the deadline (checkBridge). Run the tube sweeps the time across the curves.
   - 'dnawta': a winner-take-all classifier after Cherry and Qian (2018): three memories sum the pixels of a pattern,
     annihilators remove pairs of sums until only the largest is left, and a restoring gate lights its output. The
     player sets the annihilators, the threshold and the fuel until all six patterns are read as what they are
     (checkWta).
   A lab of the challenge player (src/v2/play.js): lab(L) -> { draw, click, input }. */
import * as D from '../../engines/strands.js';
import { mark as fidMark } from '../fid.js';
import { loop } from './loop.js';
import { still } from '../../core/ui.js';

const f1 = v => (+v).toFixed(1);
/* the tube's chart: minutes across, the output's amount up */
const CX0 = 160, CX1 = 350, CY0 = 186, CY1 = 44;
const cx = m => CX0 + (CX1 - CX0) * m / D.READ_AT, cy = v => CY0 - (CY0 - CY1) * Math.max(0, Math.min(1, v));
const RUN_MS = 2400;                 // a run of the tube, READ_AT minutes, takes this long on the screen

export default function lab(L) {
  const { S, ch, esc, t, head, reward, doneNote, win, draw, fx } = L, view = L.view;
  const wta = ch.id === 'dnawta';
  const st = () => view.br || (view.br = { spec: 'and', and: Object.assign({}, D.START.and), or: Object.assign({}, D.START.or), row: 3 });
  const sw = () => view.bw || (view.bw = Object.assign({ pat: 1 }, D.WTA_START));
  const num = (v, d = 2) => (+v).toFixed(d);
  const mins = m => (m == null ? t('br.never') : t('br.min', { v: m < 10 ? num(m, 1) : Math.round(m) }));
  const pathOf = (arr, every = D.SAMPLE) => arr.map((v, i) => (i ? 'L' : 'M') + f1(cx(i * every)) + ' ' + f1(cy(v))).join('');
  const readWord = r => (r === 1 ? '1' : r === 0 ? '0' : '?');
  const gauge = (k, ok, v, target, f) => '<div class="gauge' + (ok ? ' ok' : '') + '"><span class="gl">' + esc(t('br.g.' + k)) + '</span><span class="gv">' + esc(v) + ' <span class="muted">' + esc(target) + '</span></span><span class="gbar"><span style="width:' + Math.round(Math.max(0, Math.min(1, f)) * 100) + '%"></span></span></div>';
  const goalbox = (met, gs) => '<div class="goalbox' + (met ? ' ok' : '') + '" data-f2="goal"><p class="kicker">' + esc(t(met ? 'game.reached' : 'game.goalNow')) + '</p>' + gs.join('') + '</div>';
  const hint = (h, d) => (!S.done[ch.id] ? (view.hint ? '<p class="small hint">' + esc(h) + '</p>' : '<button type="button" class="link" data-hint>' + esc(t('game.hint')) + '</button>') : '<p class="small good">' + esc(d) + '</p>');
  /* a dial: its label, the value, and a slider over the engine's steps */
  const dial = (key, lab, list, v, fmt) => { const i = Math.max(0, list.indexOf(v)), id = 'br-' + key.replace('.', '-');
    return '<div class="brdial"><label class="lab" for="' + id + '"><b>' + esc(lab) + '</b> <output>' + esc(fmt(v)) + '</output></label><input type="range" id="' + id + '" data-br="' + key + '" min="0" max="' + (list.length - 1) + '" step="1" value="' + i + '"></div>'; };
  const units = v => t('br.units', { v: String(+(+v).toFixed(2)) });

  /* the button that runs the tube in time; with motion reduced the curves say it all */
  const runBtn = () => (still() ? '' : '<div class="chips brrun"><button type="button" class="chipb" data-br-run>' + esc(t('br.run')) + '</button></div>');

  /* ---- the tube's chart, shared: the lines a reporter reads, the deadline, the minutes ---- */
  function chartFrame(deadline) {
    let s = '<rect class="blur" x="' + CX0 + '" y="' + f1(cy(D.HIGH)) + '" width="' + (CX1 - CX0) + '" height="' + f1(cy(D.LOW) - cy(D.HIGH)) + '"/>';
    s += '<line class="ln" x1="' + CX0 + '" x2="' + CX1 + '" y1="' + f1(cy(D.HIGH)) + '" y2="' + f1(cy(D.HIGH)) + '"/><line class="ln" x1="' + CX0 + '" x2="' + CX1 + '" y1="' + f1(cy(D.LOW)) + '" y2="' + f1(cy(D.LOW)) + '"/>';
    s += '<text class="ax" x="' + (CX0 - 5) + '" y="' + f1(cy(D.HIGH) + 3) + '" text-anchor="end">1</text><text class="ax" x="' + (CX0 - 5) + '" y="' + f1(cy(D.LOW) + 3) + '" text-anchor="end">0</text>';
    s += '<text class="ax q" x="' + (CX0 - 5) + '" y="' + f1((cy(D.HIGH) + cy(D.LOW)) / 2 + 3) + '" text-anchor="end">?</text>';
    s += '<line class="axl" x1="' + CX0 + '" x2="' + CX1 + '" y1="' + CY0 + '" y2="' + CY0 + '"/><line class="axl" x1="' + CX0 + '" x2="' + CX0 + '" y1="' + CY1 + '" y2="' + CY0 + '"/>';
    const ticks = deadline ? [0, D.DEADLINE, D.READ_AT] : [0, 60, D.READ_AT];
    ticks.forEach((m, i) => { s += '<text class="ax" x="' + f1(cx(m)) + '" y="' + (CY0 + 12) + '" text-anchor="' + (i ? i === ticks.length - 1 ? 'end' : 'middle' : 'start') + '">' + esc(t('br.min', { v: m })) + '</text>'; });
    if (deadline) s += '<line class="dl" x1="' + f1(cx(D.DEADLINE)) + '" x2="' + f1(cx(D.DEADLINE)) + '" y1="' + CY1 + '" y2="' + CY0 + '"/><text class="dlt" x="' + f1(cx(D.DEADLINE)) + '" y="' + (CY1 - 8) + '" text-anchor="middle">' + esc(t('br.deadline')) + '</text>';
    return s;
  }
  /* the time cursor and its clock, moved by a run of the tube */
  const cursor = m => '<line class="cur" data-br-cur x1="' + f1(cx(m)) + '" x2="' + f1(cx(m)) + '" y1="' + (CY1 - 4) + '" y2="' + CY0 + '"/><text class="clk" data-br-clock x="' + CX1 + '" y="' + (CY1 - 8) + '" text-anchor="end">' + esc(t('br.at', { v: Math.round(m) })) + '</text>';

  /* ---- the silicon side: the spec as the bench's cells, lit by one input ---- */
  function silicon(spec, v) {
    const W = D.siliconRun(spec, v).wires, on = n => (W[n] ? ' on' : ''), seg = (n, d) => '<path class="sw' + on(n) + '" d="' + d + '"/>';
    const AND = (x, y) => '<path class="g" d="M' + x + ' ' + (y - 10) + 'h10a10 10 0 0 1 0 20h-10z"/>';
    const OR = (x, y) => '<path class="g" d="M' + x + ' ' + (y - 10) + 'q6 10 0 20q14 0 22 -10q-8 -10 -22 -10z"/>';
    const NOT = (x, y) => '<path class="g" d="M' + x + ' ' + (y - 6) + 'l11 6l-11 6z"/><circle class="g" cx="' + (x + 13.4) + '" cy="' + y + '" r="2.3"/>';
    const pin = (n, y) => '<text class="pn" x="9" y="' + (y + 3.5) + '" text-anchor="middle">' + esc(n) + '</text><rect class="bit' + on(n) + '" x="17" y="' + (y - 6) + '" width="12" height="12" rx="3"/><text class="bv' + on(n) + '" x="23" y="' + (y + 3.5) + '" text-anchor="middle">' + W[n] + '</text>';
    let s = '';
    if (spec === 'and') {
      s += seg('a', 'M29 92H58V104H64') + seg('b', 'M29 128H58V116H64') + seg('y', 'M84 110H118') + AND(64, 110) + pin('a', 92) + pin('b', 128);
    } else {
      /* s and a into the first AND, NOT s and b into the second, both into the OR */
      s += seg('s', 'M29 62H64V74H70') + seg('s', 'M38 62V128H44') + seg('a', 'M29 94H64V86H70') + seg('ns', 'M60 128H64V138H70') + seg('b', 'M29 160H64V150H70');
      s += seg('p', 'M90 80H98V104H105') + seg('q', 'M90 144H98V116H105') + seg('y', 'M124 110H128');
      s += '<circle class="dot' + on('s') + '" cx="38" cy="62" r="2.2"/>' + AND(70, 80) + NOT(44, 128) + AND(70, 144) + OR(102, 110) + pin('s', 62) + pin('a', 94) + pin('b', 160);
    }
    const yx = spec === 'and' ? 122 : 132;
    s += '<rect class="bit out' + on('y') + '" x="' + (yx - 4) + '" y="104" width="12" height="12" rx="3"/><text class="bv' + on('y') + '" x="' + (yx + 2) + '" y="113.5" text-anchor="middle">' + W.y + '</text>';
    s += '<text class="sub" x="74" y="' + (CY0 + 12) + '" text-anchor="middle">' + esc(t('br.ps', { v: D.siliconDelay(spec) })) + '</text>';
    return s;
  }

  /* ---- the first challenge: the AND and the choice ---- */
  function bench() {
    const o = st(), set = { and: o.and, or: o.or }, C = D.checkBridge(set), spec = o.spec, R = C[spec], row = Math.min(o.row, R.rows.length - 1), cur = R.rows[row];
    const tNow = view.brRun != null ? view.brRun : D.READ_AT;
    let h = head() + '<p class="small brintro">' + esc(t('br.intro')) + '</p>';
    h += goalbox(C.ok, [
      gauge('and', C.and.ok, t('br.v.rows', { n: C.and.right, of: C.and.total }), t('br.t.rows'), C.and.right / C.and.total),
      gauge('choice', C.choice.ok, t('br.v.rows', { n: C.choice.right, of: C.choice.total }), t('br.t.rows'), C.choice.right / C.choice.total),
      gauge('time', C.and.fast && C.choice.fast, C.and.time == null || C.choice.time == null ? t('br.never') : mins(Math.max(C.and.time, C.choice.time)), t('br.t.time', { v: D.DEADLINE }),
        C.and.time == null || C.choice.time == null ? 0 : Math.min(1, D.DEADLINE / Math.max(C.and.time, C.choice.time)))]);
    h += '<div class="chips brspecs" role="tablist">' + D.SPEC_IDS.map(k => '<button type="button" class="chipb" role="tab" data-br-spec="' + k + '" aria-pressed="' + (k === spec) + '">' + esc(t('br.spec.' + k)) + (C[k].ok && C[k].fast ? ' ✓' : '') + '</button>').join('') + '</div>';
    /* the picture: silicon at the left, the tube's curves at the right, one line per input */
    let s = '<svg viewBox="0 0 360 206" role="img" aria-label="' + esc(t('br.aria', { n: R.right, of: R.total })) + '">';
    s += '<text class="hd" x="8" y="22">' + esc(t('br.silicon')) + '</text><text class="hd" x="' + CX0 + '" y="22">' + esc(t('br.tube')) + '</text>';
    s += '<line class="split" x1="148" x2="148" y1="10" y2="196"/>';
    s += silicon(spec, cur.v) + chartFrame(true);
    R.rows.forEach((r, k) => { if (k !== row) s += '<path class="cv' + (r.want ? ' w1' : ' w0') + (r.ok ? '' : ' bad') + '" d="' + pathOf(r.trace.y) + '"/>'; });
    s += '<path class="cv sel' + (cur.want ? ' w1' : ' w0') + (cur.ok ? '' : ' bad') + '" d="' + pathOf(cur.trace.y) + '"/>';
    s += '<circle class="end' + (cur.ok ? '' : ' bad') + '" cx="' + f1(cx(D.READ_AT)) + '" cy="' + f1(cy(cur.out)) + '" r="3.4"/>';
    s += cursor(tNow) + '</svg>';
    h += '<figure class="brfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('br.legend')) + '</figcaption></figure>';
    /* the dials, every gate kind's, the OR's used by the choice only */
    h += '<div class="brdials"><div class="brgate"><p class="kicker">' + esc(t('br.gate.and')) + '</p>' + dial('and.th', t('br.th'), D.THRESHOLDS, o.and.th, units) + dial('and.fuel', t('br.fuel'), D.FUELS, o.and.fuel, units) + '</div>' +
      '<div class="brgate' + (spec === 'choice' ? '' : ' idle') + '"><p class="kicker">' + esc(t('br.gate.or')) + '</p>' + dial('or.th', t('br.th'), D.THRESHOLDS, o.or.th, units) + dial('or.fuel', t('br.fuel'), D.FUELS, o.or.fuel, units) + '</div></div>';
    h += runBtn();
    /* every input: what it should give, silicon's answer, the tube's */
    const I = D.SPECS[spec].ins;
    h += '<div class="tt brtt"><table><thead><tr>' + I.map(k => '<th>' + esc(k) + '</th>').join('') + '<th class="sep"></th><th>' + esc(t('br.th.want')) + '</th><th>' + esc(t('br.th.si')) + '</th><th>' + esc(t('br.th.tube')) + '</th><th></th></tr></thead><tbody>' +
      R.rows.map((r, k) => '<tr class="' + (r.ok ? '' : 'bad') + (k === row ? ' on' : '') + '" data-br-row="' + k + '" tabindex="0">' + I.map(x => '<td>' + r.v[x] + '</td>').join('') + '<td class="sep"></td><td>' + r.want + '</td><td>' + D.siliconRun(spec, r.v).out + '</td><td>' + readWord(r.got) + ' <span class="muted">' + num(r.out) + '</span></td><td>' + (r.ok ? '✓' : '✗') + '</td></tr>').join('') + '</tbody></table></div>';
    const msg = C.ok ? 'met' : R.why || (R.ok && R.fast ? 'other' : 'slow');
    h += '<p class="small brmsg ' + (C.ok || msg === 'other' ? 'good' : 'bad') + '">' + esc(t('br.msg.' + msg, { spec: t('br.spec.' + (spec === 'and' ? 'choice' : 'and')), v: D.DEADLINE })) + '</p>';
    /* what each matter is good at, side by side */
    const tt = Math.max(C.and.time || 0, C.choice.time || 0), x = tt ? tt * 60 / (D.siliconDelay('choice') * 1e-12) : 0;
    h += '<div class="brcmp"><div><b>' + esc(t('br.silicon')) + '</b><span class="small">' + esc(t('br.cmp.si', { ps: D.siliconDelay(spec), n: D.siliconTransistors(spec) })) + '</span></div>' +
      '<div><b>' + esc(t('br.tube')) + '</b><span class="small">' + esc(R.time != null ? t('br.cmp.tube', { m: mins(R.time) }) : t('br.cmp.tubeNo')) + '</span></div></div>';
    if (x) h += '<p class="small muted">' + esc(t('br.slower', { x: '10' + sup(Math.floor(Math.log10(x))) })) + '</p>';
    h += '<p class="small brsrc">' + esc(t('br.src.seesaw')) + ' ' + fidMark({ f: 'figures', fact: 'dna-seesaw' }) + '</p><p class="small brsrc">' + esc(t('br.src.cello')) + ' ' + fidMark({ f: 'figures', fact: 'dna-cello' }) + '</p>';
    h += hint(t('br.hint'), t('br.done')) + '<p class="small muted">' + esc(t('br.note')) + '</p>';
    return h + doneNote() + reward();
  }
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = n => String(n).split('').map(d => SUP[+d]).join('');

  /* ---- the second challenge: winner takes all ---- */
  const MCLS = ['m0', 'm1', 'm2'];
  function grid(pxs, x, y, c, cls, ref) {
    let s = '<g class="pg ' + (cls || '') + '">';
    for (let i = 0; i < D.GRID * D.GRID; i++) { const r = Math.floor(i / D.GRID), k = i % D.GRID, inP = pxs.includes(i), inR = ref ? ref.includes(i) : false;
      s += '<rect class="px' + (inP ? ' on' : '') + (ref && inP && !inR ? ' extra' : '') + '" x="' + f1(x + k * c) + '" y="' + f1(y + r * c) + '" width="' + f1(c - 1) + '" height="' + f1(c - 1) + '" rx="1"/>'; }
    return s + '</g>';
  }
  function classifier() {
    const o = sw(), set = { ann: o.ann, th: o.th, fuel: o.fuel }, C = D.checkWta(set), r = C.rows[o.pat];
    const losers = C.rows.flatMap(x => x.out.filter((_, k) => D.MEMORIES[k].id !== x.p.is)), winners = C.rows.map(x => x.out[D.MEMORIES.findIndex(m => m.id === x.p.is)]);
    const maxL = Math.max(...losers), minW = Math.min(...winners);
    let h = head() + '<p class="small brintro">' + esc(t('bw.intro')) + '</p>';
    h += goalbox(C.ok, [
      gauge('pats', C.ok, t('br.v.rows', { n: C.right, of: C.total }), t('br.t.pats'), C.right / C.total),
      gauge('win', minW > D.HIGH, num(minW), t('br.t.win', { v: D.HIGH }), minW / D.HIGH),
      gauge('lose', maxL < D.LOW, num(maxL), t('br.t.lose', { v: D.LOW }), maxL < D.LOW ? 1 : D.LOW / maxL)]);
    /* the picture: the three memories, the six patterns (one chosen), and that pattern's race in the tube */
    let s = '<svg viewBox="0 0 360 206" role="img" aria-label="' + esc(t('bw.aria', { n: C.right, of: C.total })) + '">';
    s += '<text class="hd" x="8" y="22">' + esc(t('bw.memories')) + '</text>';
    D.MEMORIES.forEach((m, k) => { s += grid(m.px, 8 + k * 46, 30, 7.4, MCLS[k]) + '<text class="mn ' + MCLS[k] + '" x="' + f1(8 + k * 46 + 18) + '" y="78" text-anchor="middle">' + esc(t('bw.m.' + m.id)) + '</text>'; });
    s += '<text class="hd" x="8" y="100">' + esc(t('bw.patterns')) + '</text>';
    C.rows.forEach((x, k) => { const gx = 8 + (k % 3) * 46, gy = 108 + Math.floor(k / 3) * 46;
      s += '<g class="pat' + (k === o.pat ? ' sel' : '') + (x.ok ? '' : ' bad') + '">' + (k === o.pat ? '<rect class="pick" x="' + (gx - 3) + '" y="' + (gy - 3) + '" width="43" height="43" rx="4"/>' : '') + grid(x.p.px, gx, gy, 7.4, '', D.MEMORIES.find(m => m.id === x.p.is).px) +
        '<text class="pk" x="' + (gx + 39) + '" y="' + (gy + 8) + '" text-anchor="end">' + (x.ok ? '✓' : '✗') + '</text><rect class="hit" data-bw-pat="' + k + '" x="' + (gx - 3) + '" y="' + (gy - 3) + '" width="43" height="43"><title>' + esc(t('bw.pick', { n: k + 1 })) + '</title></rect></g>'; });
    s += '<line class="split" x1="144" x2="144" y1="10" y2="196"/><text class="hd" x="' + CX0 + '" y="22">' + esc(t('bw.race')) + '</text>';
    s += chartFrame(false);
    /* each memory's light rising (its sum and what the annihilators left of it are in the table) */
    r.trace.forEach((a, k) => { s += '<path class="cv ' + MCLS[k] + '" d="' + pathOf(a) + '"/><circle class="end ' + MCLS[k] + '" cx="' + f1(cx(D.READ_AT)) + '" cy="' + f1(cy(r.out[k])) + '" r="3.2"/>'; });
    s += cursor(view.brRun != null ? view.brRun : D.READ_AT) + '</svg>';
    h += '<figure class="brfig" data-f2="instrument">' + s + '<figcaption class="small muted">' + esc(t('bw.legend')) + '</figcaption></figure>';
    h += '<div class="brdials one">' + dial('ann', t('bw.ann'), D.ANNIHILATORS, o.ann, units) + dial('th', t('bw.th'), D.RESTORE_TH, o.th, units) + dial('fuel', t('br.fuel'), D.FUELS, o.fuel, units) + '</div>';
    h += runBtn();
    /* the chosen pattern: each memory's sum, what the annihilators left, its light */
    h += '<div class="tt brtt"><table><thead><tr><th>' + esc(t('bw.th.m')) + '</th><th>' + esc(t('bw.th.sum')) + '</th><th>' + esc(t('bw.th.left')) + '</th><th>' + esc(t('bw.th.out')) + '</th></tr></thead><tbody>' +
      D.MEMORIES.map((m, k) => { const left = r.left[k][r.left[k].length - 1], rd = r.out[k] > D.HIGH ? 1 : r.out[k] < D.LOW ? 0 : null;
        return '<tr class="' + (m.id === r.p.is ? 'on' : '') + '"><td><span class="sw ' + MCLS[k] + '"></span>' + esc(t('bw.m.' + m.id)) + '</td><td>' + num(r.sums[k]) + '</td><td>' + num(left) + '</td><td>' + readWord(rd) + ' <span class="muted">' + num(r.out[k]) + '</span></td></tr>'; }).join('') + '</tbody></table></div>';
    const bad = C.rows.find(x => !x.ok), msg = C.ok ? 'met' : bad.got;
    h += '<p class="small brmsg ' + (C.ok ? 'good' : 'bad') + '">' + esc(t('bw.msg.' + (['many', 'none', 'blur', 'met'].includes(msg) ? msg : 'wrong'), { n: C.rows.indexOf(bad) + 1 })) + '</p>';
    h += '<p class="small brsrc">' + esc(t('bw.src')) + ' ' + fidMark({ f: 'figures', fact: 'dna-wta' }) + '</p>';
    h += hint(t('bw.hint'), t('bw.done')) + '<p class="small muted">' + esc(t('br.note')) + '</p>';
    return h + doneNote() + reward();
  }

  /* a run of the tube: the cursor sweeps the minutes, the card is not redrawn (only the cursor and its clock move) */
  const runner = () => view.brLoop || (view.brLoop = loop(L.el, (now, dt) => {
    view.brRun = Math.min(D.READ_AT, (view.brRun || 0) + dt / RUN_MS * D.READ_AT);
    const c = L.el.querySelector('[data-br-cur]'), k = L.el.querySelector('[data-br-clock]');
    if (c) { const x = f1(cx(view.brRun)); c.setAttribute('x1', x); c.setAttribute('x2', x); }
    if (k) k.textContent = t('br.at', { v: Math.round(view.brRun) });
    if (view.brRun >= D.READ_AT) { view.brRun = null; return false; }
    return true;
  }, () => { view.brRun = null; }));
  /* a move: the engine's check on the new dials decides */
  const after = () => { if (wta ? D.checkWta(sw()).ok : D.checkBridge(st()).ok) win(); draw(); fx(); return true; };
  return {
    draw: () => (wta ? classifier() : bench()),
    click(e) {
      const q = s => e.target.closest(s);
      const sp = q('[data-br-spec]'); if (sp) { st().spec = sp.dataset.brSpec; st().row = sp.dataset.brSpec === 'and' ? 3 : 5; draw(); return true; }
      const r = q('[data-br-row]'); if (r) { st().row = +r.dataset.brRow; draw(); return true; }
      const p = q('[data-bw-pat]'); if (p) { sw().pat = +p.dataset.bwPat; draw(); return true; }
      if (q('[data-br-run]')) { if (still()) return true; view.brRun = 0; draw(); runner().start(); return true; }
      return false;
    },
    input(e) {
      const i = e.target.closest('[data-br]'); if (!i) return false;
      const k = i.dataset.br, v = +i.value;
      if (wta) { const list = k === 'ann' ? D.ANNIHILATORS : k === 'th' ? D.RESTORE_TH : D.FUELS; sw()[k] = list[v]; }
      else { const [g, f] = k.split('.'); st()[g][f] = (f === 'th' ? D.THRESHOLDS : D.FUELS)[v]; }
      return after();
    }
  };
}
