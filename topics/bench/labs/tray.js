/* Lab: FIND THE FAULTY CHIP. A tray of four virtual chips from one wafer. Usually one carries a
   single stuck-at defect; sometimes every chip carries the same design bug. Twin-test each chip,
   decide what went wrong, and name the broken wire. A test budget shows how defects escape when a
   factory cannot afford to try every pattern. The chips speak the Open Bench Protocol, like every
   board on the bench. */
import { $ } from 'osl/core/ui.js';
import TC from 'osl/engines/tinychip.js';
import { tray, virtualDevice, budgetCases, coverage } from 'osl/hw/virtual.js';
import { DESIGN_BUGS as BUGS } from 'osl/hw/parts.js';
import { obpClient } from 'osl/hw/obp.js';
import { loopback, lineResponder } from 'osl/hw/transport.js';
import { twinTest, diagnose } from 'osl/hw/twin.js';
import { whereText, bits } from './bench.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PROJS = ['add2', 'seg', 'alu'];
const isDesignWafer = seed => seed % 3 === 0;

export function init() {
  if (!$('#tyTray')) return;
  const S = { proj: 'add2', seed: 1 + Math.floor(Math.random() * 1e6), T: null, res: [], pick: null, step: 'test', guess: null, budget: 0 };
  $('#tyProj').innerHTML = PROJS.map(id => '<button type="button" data-p="' + id + '">' + esc(TC.PROJ.find(p => p.id === id).t) + '</button>').join('');
  $('#tyProj').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { S.proj = b.dataset.p; S.budget = 0; fresh(); } });
  $('#tyNew').addEventListener('click', () => { S.seed++; fresh(); });
  $('#tyBudget').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; S.budget = +b.dataset.n; S.res = S.T.chips.map(() => null); S.pick = null; S.step = 'test'; render(); });

  const total = () => 1 << S.T.base.pins.ins.length;
  const budget = () => S.budget || total();
  function fresh() {
    const p = TC.PROJ.find(x => x.id === S.proj);
    S.T = tray(p, p.sol, { n: 4, bad: 1, seed: S.seed, bugCode: isDesignWafer(S.seed) ? BUGS[S.proj].code : null });
    S.res = S.T.chips.map(() => null); S.pick = null; S.guess = null; S.step = 'test';
    render();
  }
  async function test(i) {
    const chip = S.T.chips[i];
    const client = obpClient(loopback(lineResponder(virtualDevice(chip, 'tray-chip-' + (i + 1)))));
    await client.hello();
    S.res[i] = await twinTest(budgetCases(S.T.base, budget()), client, { mask: S.T.base.mask });
    render();
  }
  $('#tyTray').addEventListener('click', e => {
    const t = e.target.closest('[data-test]'); if (t) { test(+t.dataset.test); return; }
    const p = e.target.closest('[data-pick]'); if (p && S.step === 'test') { S.pick = +p.dataset.pick; S.step = 'picked'; render(); }
  });
  $('#tyStep').addEventListener('click', e => {
    if (e.target.closest('[data-design]') && S.step === 'test') { S.pick = 'design'; S.step = 'picked'; render(); return; }
    const g = e.target.closest('[data-g]'); if (g && S.step === 'picked') { S.guess = +g.dataset.g; render(); }
    if (e.target.closest('[data-again]')) { S.step = 'test'; S.pick = null; S.guess = null; render(); }
    if (e.target.closest('[data-next]')) { S.seed++; fresh(); }
    if (e.target.closest('[data-all]')) { S.budget = 0; S.res = S.T.chips.map(() => null); S.step = 'test'; S.pick = null; render(); }
  });

  function render() {
    $('#tyProj').querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === S.proj ? 'true' : 'false'));
    const N = total(), n = S.T.base.pins.ins.length;
    const opts = [...new Set([N, N / 2, N / 4, 2].filter(x => x >= 1 && Number.isInteger(x)))];
    $('#tyBudget').innerHTML = opts.map(x => '<button type="button" data-n="' + (x === N ? 0 : x) + '" aria-pressed="' + (budget() === x ? 'true' : 'false') + '">' + (x === N ? 'All ' + N : x + ' of ' + N) + '</button>').join('');
    const cov = coverage(S.T.base, budgetCases(S.T.base, budget()));
    $('#tyCov').innerHTML = 'This test tries ' + budget() + ' of ' + N + ' input patterns and would catch <b>' + Math.round(cov * 100) + '%</b> of the possible stuck wires.' + (budget() < N ? ' Real chips can never try them all: a chip with 64 inputs has about 18 quintillion patterns.' : '');

    $('#tyTray').innerHTML = S.T.chips.map((c, i) => {
      const r = S.res[i];
      return '<div class="tychip' + (r ? (r.ok ? ' pass' : ' fail') : '') + (S.pick === i ? ' picked' : '') + '"><div class="tydie" aria-hidden="true"></div><b>Chip ' + (i + 1) + '</b>' +
        (r ? '<span class="small">' + (r.ok ? 'All ' + r.rows.length + ' tested match' : r.fail + ' of ' + r.rows.length + ' differ') + '</span><div class="tymini">' + r.rows.slice().sort((a, b) => a.ui - b.ui).map(x => '<i class="' + (x.ok ? 'ok' : 'bad') + '" title="' + bits(x.ui, n) + '"></i>').join('') + '</div>' : '<span class="small muted">Not tested</span>') +
        '<div class="row"><button type="button" class="btn" data-test="' + i + '">' + (r ? 'Test again' : 'Twin-test') + '</button>' + (S.step === 'test' ? '<button type="button" class="btn" data-pick="' + i + '">This one is faulty</button>' : '') + '</div></div>';
    }).join('');
    const tested = S.res.filter(Boolean).length;
    $('#tyTag').textContent = S.step === 'done' ? 'Solved' : tested + ' of 4 tested';
    $('#tyStep').innerHTML = stepHTML();
  }

  function stepHTML() {
    const T = S.T, res = S.res, all = res.every(Boolean);
    const badIdx = T.design ? null : T.chips.findIndex(c => c.fault);
    if (S.step === 'test') {
      let h = '<div class="row"><button type="button" class="btn" data-design>Every chip is faulty: it is the design</button></div>';
      /* All four passed a reduced test, yet one is faulty: an escape. */
      if (all && res.every(r => r.ok) && !T.design && budget() < total()) h += '<div class="callout"><p><b>All four chips passed, but one of them is faulty.</b> Your test tried only ' + budget() + ' of ' + total() + ' patterns, and the defect hides in the others. That chip would ship to a customer: <b>a defect the test missed</b>, the second cause in <a href="#reality">Why perfect designs fail</a>. Factories pay for more test time, or smarter patterns, to catch more.</p><div><button type="button" class="btn" data-all>Test with all ' + total() + ' patterns</button></div></div>';
      return h;
    }
    const again = '<div><button type="button" class="btn" data-again>Try again</button></div>';
    if (S.pick === 'design') {
      if (!T.design) return '<div class="callout"><p><b>Not the design.</b> ' + (res.some(r => r && r.ok) && budget() === total() ? 'At least one chip passes every pattern, so the design itself is right; manufacturing broke one chip.' : 'Test the chips first: if the design were wrong, every chip would fail, and fail the same way.') + '</p>' + again + '</div>';
      S.step = 'done';
      return '<div class="callout"><p><b>Right: it is the design.</b> Every chip fails the same patterns in the same way, so no chip is broken; the design is. Here, ' + esc(BUGS[S.proj].what) + '. No test sorts this out, because every copy is identical, and a chip cannot be patched after it is made. In 1994 a similar design slip in Intel\'s Pentium divider cost about $475 million to replace the chips: see the case files in <a href="#reality">Why perfect designs fail</a>. Design bugs are caught before tape-out, by verification (step 2 of the <a href="#tiny">tiny chip studio</a>).</p><div><button type="button" class="btn" data-next>Next wafer →</button></div></div>';
    }
    const i = S.pick, r = res[i];
    if (T.design) return '<div class="callout"><p><b>Look at all four.</b> ' + (all ? 'Every chip fails, and on the same patterns. What does that say?' : 'Test every chip, then compare how they fail.') + '</p>' + again + '</div>';
    if (i !== badIdx) return '<div class="callout"><p><b>Chip ' + (i + 1) + ' is fine.</b> ' + (r ? 'Its twin test matched on every pattern you tried.' : 'Test it first: the twin test shows whether a chip disagrees with the simulation.') + '</p>' + again + '</div>';
    if (!r) return '<div class="callout"><p><b>Right chip, but how do you know?</b> Twin-test chip ' + (i + 1) + ' to see its wrong answers, then name the broken wire.</p>' + again + '</div>';
    if (r.ok) return '<div class="callout"><p><b>Right chip, but your test did not catch it.</b> With ' + budget() + ' of ' + total() + ' patterns its defect stays hidden. Try a bigger test budget to see it fail.</p><div><button type="button" class="btn" data-all>Test with all ' + total() + ' patterns</button></div></div>';
    const base = T.base, bad = T.chips[i];
    const sus = diagnose(base, r.rows);
    const allF = []; for (let net = 0; net < base.M.nets; net++) for (const v of [0, 1]) allF.push({ net, v });
    const fits = new Set(sus.map(f => f.net + ':' + f.v));
    const decoys = allF.filter(f => !fits.has(f.net + ':' + f.v)).sort((a, b) => ((a.net * 7 + a.v * 3 + S.seed) % 11) - ((b.net * 7 + b.v * 3 + S.seed) % 11)).slice(0, Math.max(2, 4 - sus.length));
    const opts = sus.slice(0, 3).concat(decoys.map(f => ({ ...f, where: describe(f) }))).sort((a, b) => a.net - b.net || a.v - b.v);
    const chosen = S.guess !== null ? opts[S.guess] : null; const right = chosen && fits.has(chosen.net + ':' + chosen.v);
    if (right) S.step = 'done';
    const wrongOuts = base.pins.outs.filter((o, k) => r.rows.some(x => ((x.got ^ x.want) >> k) & 1));
    return '<div class="callout"><p><b>Right: chip ' + (i + 1) + ' is faulty, and only chip ' + (i + 1) + ', so it is a manufacturing defect, not the design.</b> It is wrong on ' + r.fail + ' of ' + r.rows.length + ' patterns, always on output' + (wrongOuts.length > 1 ? 's ' : ' ') + wrongOuts.join(', ') + '. Which broken wire explains every wrong answer?</p></div><div class="tyopts">' +
      opts.map((f, k) => '<button type="button" class="btn" data-g="' + k + '" aria-pressed="' + (S.guess === k ? 'true' : 'false') + '"' + (S.step === 'done' ? ' disabled' : '') + '>' + esc(whereText(f, base)) + '</button>').join('') + '</div>' +
      (chosen ? (right ? '<p class="ok"><b>Found it.</b> ' + (sus.length > 1 ? 'Other wires fit too: ' + sus.filter(f => !(f.net === chosen.net && f.v === chosen.v)).slice(0, 3).map(f => esc(whereText(f, base))).join('; ') + '. From the outside they look identical, so a real test engineer would add a test point to tell them apart.' : 'It is the only single wire that explains every wrong answer.') + ' The real defect: ' + esc(whereText({ ...bad.fault, where: describe(bad.fault) }, base)) + '. <button type="button" class="linkish" data-next>Next wafer →</button></p>'
        : '<p class="bad">Not that one: with that wire stuck, the chip would give different answers. Compare which patterns failed with what this wire feeds.</p>') : '');
  }
  const describe = f => { const M = S.T.base.M; const pin = M.inputs.find(x => x.net === f.net); const k = M.cells.findIndex(c => c.out === f.net); return { pin: pin ? pin.name : null, cell: k >= 0 ? { index: k, type: M.cells[k].type } : null, outs: M.outs.filter(o => o.net === f.net).map(o => o.name) }; };
  fresh();
}
