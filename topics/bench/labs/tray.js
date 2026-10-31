/* Lab: FIND THE FAULTY CHIP. A tray of four virtual chips from one wafer; one carries a single
   stuck-at defect. Twin-test each, pick the faulty one, then name the broken wire from the pattern
   of wrong answers. The chips speak the Open Bench Protocol, like every board on the bench. */
import { $ } from 'osl/core/ui.js';
import TC from 'osl/engines/tinychip.js';
import { tray, virtualDevice, simCases } from 'osl/hw/virtual.js';
import { obpClient } from 'osl/hw/obp.js';
import { loopback, lineResponder } from 'osl/hw/transport.js';
import { twinTest, diagnose } from 'osl/hw/twin.js';
import { whereText, bits } from './bench.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PROJS = ['add2', 'seg', 'alu'];

export function init() {
  if (!$('#tyTray')) return;
  const S = { proj: 'add2', seed: 1 + Math.floor(Math.random() * 1e6), T: null, res: [], pick: null, step: 'test', guess: null };
  $('#tyProj').innerHTML = PROJS.map(id => '<button type="button" data-p="' + id + '">' + esc(TC.PROJ.find(p => p.id === id).t) + '</button>').join('');
  $('#tyProj').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) { S.proj = b.dataset.p; fresh(); } });
  $('#tyNew').addEventListener('click', () => { S.seed++; fresh(); });

  function fresh() {
    const p = TC.PROJ.find(x => x.id === S.proj);
    S.T = tray(p, p.sol, { n: 4, bad: 1, seed: S.seed });
    S.res = S.T.chips.map(() => null); S.pick = null; S.guess = null; S.step = 'test';
    render();
  }
  async function test(i) {
    const chip = S.T.chips[i];
    const client = obpClient(loopback(lineResponder(virtualDevice(chip, 'tray-chip-' + (i + 1)))));
    await client.hello();
    S.res[i] = await twinTest(simCases(S.T.base), client, { mask: S.T.base.mask });
    render();
  }
  $('#tyTray').addEventListener('click', e => {
    const t = e.target.closest('[data-test]'); if (t) { test(+t.dataset.test); return; }
    const p = e.target.closest('[data-pick]'); if (p && S.step === 'test') { S.pick = +p.dataset.pick; S.step = S.T.chips[S.pick].fault ? 'name' : 'wrong'; render(); }
  });
  $('#tyStep').addEventListener('click', e => {
    const g = e.target.closest('[data-g]'); if (g && S.step === 'name') { S.guess = +g.dataset.g; render(); }
    if (e.target.closest('[data-again]')) { S.step = 'test'; S.pick = null; render(); }
  });

  function render() {
    $('#tyProj').querySelectorAll('[data-p]').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === S.proj ? 'true' : 'false'));
    const n = S.T.base.pins.ins.length, m = S.T.base.pins.outs.length;
    $('#tyTray').innerHTML = S.T.chips.map((c, i) => {
      const r = S.res[i];
      return '<div class="tychip' + (r ? (r.ok ? ' pass' : ' fail') : '') + (S.pick === i ? ' picked' : '') + '"><div class="tydie" aria-hidden="true"></div><b>Chip ' + (i + 1) + '</b>' +
        (r ? '<span class="small">' + (r.ok ? 'All ' + r.rows.length + ' match' : r.fail + ' of ' + r.rows.length + ' differ') + '</span><div class="tymini">' + r.rows.map(x => '<i class="' + (x.ok ? 'ok' : 'bad') + '" title="' + bits(x.ui, n) + '"></i>').join('') + '</div>' : '<span class="small muted">Not tested</span>') +
        '<div class="row"><button type="button" class="btn" data-test="' + i + '">' + (r ? 'Test again' : 'Twin-test') + '</button>' + (S.step === 'test' ? '<button type="button" class="btn" data-pick="' + i + '">This one is faulty</button>' : '') + '</div></div>';
    }).join('');
    const tested = S.res.filter(Boolean).length;
    $('#tyTag').textContent = S.step === 'done' ? 'Solved' : tested + ' of 4 tested';
    let h = '';
    if (S.step === 'wrong') h = '<div class="callout"><p><b>Chip ' + (S.pick + 1) + ' is fine.</b> ' + (S.res[S.pick] ? 'Its twin test matched on every pattern.' : 'Test it first: the twin test shows whether a chip disagrees with the simulation.') + '</p><div><button type="button" class="btn" data-again>Try again</button></div></div>';
    if (S.step === 'name' || S.step === 'done') {
      const bad = S.T.chips[S.pick], r = S.res[S.pick];
      if (!r) h = '<div class="callout"><p><b>Right chip, but how do you know?</b> Twin-test chip ' + (S.pick + 1) + ' to see its wrong answers, then name the broken wire.</p></div>';
      else {
        const sus = diagnose(S.T.base, r.rows);
        /* Choices: every wire that fits, plus a few that do not, shuffled the same way each time. */
        const all = []; for (let net = 0; net < S.T.base.M.nets; net++) for (const v of [0, 1]) all.push({ net, v });
        const fits = new Set(sus.map(f => f.net + ':' + f.v));
        const decoys = all.filter(f => !fits.has(f.net + ':' + f.v)).sort((a, b) => ((a.net * 7 + a.v * 3 + S.seed) % 11) - ((b.net * 7 + b.v * 3 + S.seed) % 11)).slice(0, Math.max(2, 4 - sus.length));
        const opts = sus.slice(0, 3).concat(decoys.map(f => ({ ...f, where: describe(f) }))).sort((a, b) => a.net - b.net || a.v - b.v);
        const chosen = S.guess !== null ? opts[S.guess] : null; const right = chosen && fits.has(chosen.net + ':' + chosen.v);
        if (right) S.step = 'done';
        const wrongOuts = S.T.base.pins.outs.filter((o, i) => r.rows.some(x => ((x.got ^ x.want) >> i) & 1));
        h = '<div class="callout"><p><b>Right: chip ' + (S.pick + 1) + ' is faulty.</b> It is wrong on ' + r.fail + ' of ' + r.rows.length + ' patterns, always on output' + (wrongOuts.length > 1 ? 's ' : ' ') + wrongOuts.join(', ') + '. Which broken wire explains every wrong answer?</p></div><div class="tyopts">' +
          opts.map((f, i) => '<button type="button" class="btn" data-g="' + i + '" aria-pressed="' + (S.guess === i ? 'true' : 'false') + '"' + (S.step === 'done' ? ' disabled' : '') + '>' + esc(whereText(f, S.T.base)) + '</button>').join('') + '</div>' +
          (chosen ? (right ? '<p class="ok"><b>Found it.</b> ' + (sus.length > 1 ? 'Other wires fit too: ' + sus.filter(f => !(f.net === chosen.net && f.v === chosen.v)).slice(0, 3).map(f => esc(whereText(f, S.T.base))).join('; ') + '. From the outside they look identical, so a real test engineer would add a test point to tell them apart.' : 'It is the only single wire that explains every wrong answer.') + ' The real defect: ' + esc(whereText({ ...bad.fault, where: describe(bad.fault) }, S.T.base)) + '. <button type="button" class="linkish" id="tyNext">Next wafer →</button></p>'
            : '<p class="bad">Not that one: with that wire stuck, the chip would give different answers. Compare which patterns failed with what this wire feeds.</p>') : '');
      }
    }
    $('#tyStep').innerHTML = h;
    const nx = $('#tyNext'); if (nx) nx.addEventListener('click', () => { S.seed++; fresh(); });
  }
  const describe = f => { const M = S.T.base.M; const pin = M.inputs.find(i => i.net === f.net); const k = M.cells.findIndex(c => c.out === f.net); return { pin: pin ? pin.name : null, cell: k >= 0 ? { index: k, type: M.cells[k].type } : null, outs: M.outs.filter(o => o.net === f.net).map(o => o.name) }; };
  fresh();
}
