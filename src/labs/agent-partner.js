/* Lab: DESIGN WITH AN AI AGENT. An agent proposes; you check with real tools and decide.
   Scripted cases work everywhere; inside Claude a live agent designs tiny chips too. */
import { $ } from '../core/ui.js';
import TC from '../engines/tinychip.js';
import { CASES, SKILLS, tinyCheck, asmRun, poissonYield, decodeTime, score, livePrompt, extractCode, specText } from '../data/agent-cases.js';
import { FACTS, fmtDate } from '../app/facts.js';
import { topicById } from '../data/topics.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KEY = 'osl-agent-v1';

export function init() {
  if (!$('#agCase')) return;
  let D = {}; try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object' && j.d) D = j.d; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ d: D })); } catch (e) { /* ignore */ } };
  let cur = (CASES.find(c => !(D[c.id] && D[c.id].decision)) || CASES[0]).id;
  let pending = null; /* 'reject' while choosing a reason */
  const st = id => (D[id] = D[id] || {});

  /* ---- tools: one per kind of proposal ---- */
  const TOOLS = {
    tiny(c) {
      return '<div class="agtool"><p class="eyebrow">Your tool: exhaustive verification, on your own copy of the design</p><textarea class="agcode" rows="4" spellcheck="false" aria-label="Your copy of the agent\'s design">' + esc(c.art.code) + '</textarea><div class="row"><button type="button" class="btn" data-tool="run">Verify every input</button><span class="small muted">Edit the code to try a fix.</span></div><div class="agout"></div></div>';
    },
    asm(c) {
      return '<div class="agtool"><p class="eyebrow">Your tool: run it on the RISC-V simulator</p><p class="small">Memory holds the words ' + c.art.data.join(', ') + '. Choose N and run.</p><div class="row"><label class="ctl" style="flex:1;min-width:180px"><span class="lbl">N <output data-o>4</output></span><input type="range" min="0" max="8" value="4" data-n></label><button type="button" class="btn" data-tool="run">Run</button></div><div class="agout"></div></div>';
    },
    asm2() {
      return '<div class="agtool"><p class="eyebrow">Your tool: run it on the RISC-V simulator</p><div class="row"><label>A <input type="number" min="0" max="1000" value="13" data-a></label><label>B <input type="number" min="0" max="1000" value="11" data-b></label><button type="button" class="btn" data-tool="run">Run</button></div><div class="agout"></div></div>';
    },
    yield(c) {
      return '<div class="agtool"><p class="eyebrow">Your tool: the Poisson yield model, yield = e^(−area × defect density)</p><div class="row"><label>Area <input type="number" value="' + c.art.area + '" data-area> mm²</label><label>Defects <input type="number" step="0.01" value="' + c.art.d0 + '" data-d0> per cm²</label><button type="button" class="btn" data-tool="run">Calculate</button></div><div class="agout"></div></div>';
    },
    roof(c) {
      return '<div class="agtool"><p class="eyebrow">Your tool: time for one token, one user</p><div class="row"><label>Model <input type="number" value="' + c.art.params + '" data-p> B parameters</label><label>Memory <input type="number" value="' + c.art.bw + '" data-bw> TB/s</label><label>Compute <input type="number" step="0.5" value="' + c.art.pf + '" data-pf> PFLOPS</label></div><div class="row"><button type="button" class="btn" data-tool="run">Calculate</button><button type="button" class="btn" data-tool="double">Double the compute</button></div><div class="agout"></div><p class="note">Weights in FP8, one byte each. Each token reads every weight once and does about two operations per weight.</p></div>';
    },
    fact(c) {
      return '<div class="agtool"><p class="eyebrow">Your tool: the lab\'s dated, sourced facts</p><div class="row"><input type="search" value="' + esc(c.art.query) + '" data-q aria-label="Search facts"><button type="button" class="btn" data-tool="run">Search</button></div><div class="agout"></div></div>';
    },
    cov(c) {
      return '<div class="agtool"><p class="eyebrow">Your tool: what did the tests cover?</p><p class="small">The design under test: <code>' + esc(c.art.code) + '</code></p><div class="row"><button type="button" class="btn" data-tool="run">Show coverage</button><button type="button" class="btn" data-tool="all">Run all 8 patterns</button></div><div class="agout"></div></div>';
    }
  };
  const tinyTable = (c, r, only) => '<div class="scroll"><table class="tt"><tr>' + c.art.ins.map(n => '<th>' + n + '</th>').join('') + c.art.outs.map((n, k) => '<th' + (k ? '' : ' class="sep"') + '>' + n + ' <small class="muted">want / got</small></th>').join('') + (only ? '<th>Tested?</th>' : '') + '</tr>' +
    r.rows.map(x => { const key = c.art.ins.map(n => x.v[n]).join(''); const tested = only && only.includes(key); return '<tr>' + c.art.ins.map(n => '<td>' + x.v[n] + '</td>').join('') + c.art.outs.map((n, k) => '<td class="' + (x.got[n] === x.want[n] ? 'ok' : 'bad') + (k ? '' : ' sep') + '">' + x.want[n] + ' / ' + x.got[n] + '</td>').join('') + (only ? '<td>' + (tested ? '✓' : '<b style="color:var(--bad)">no</b>') + '</td>' : '') + '</tr>'; }).join('') + '</table></div>';
  const lastOut = {};
  function runTool(c, box, which) {
    const out = box.querySelector('.agout'); st(c.id).checked = true; save();
    queueMicrotask(() => { lastOut[c.id] = out.innerHTML; });
    const k = c.art.kind;
    if (k === 'tiny') {
      const code = box.querySelector('.agcode').value; const r = tinyCheck(code, c.art.ins, c.art.outs, c.art.f);
      out.innerHTML = r.errs.length ? '<p class="small" style="color:var(--bad)">' + esc(r.errs[0].m) + '</p>' : '<p class="small"><b>' + (r.bad.length ? r.bad.length + ' of ' + r.rows.length + ' cases are wrong.' : 'All ' + r.rows.length + ' cases pass.') + '</b>' + (code !== c.art.code ? ' (This is your edited version, not the agent\'s.)' : '') + '</p>' + tinyTable(c, r);
    } else if (k === 'asm') {
      const n = +box.querySelector('[data-n]').value; const r = asmRun(c.art.code, c.art.data, 0x1000, mm => { mm.mem[0x1100] = n; });
      const want = c.art.data.slice(0, n).reduce((s, x) => s + x, 0);
      out.innerHTML = '<p class="small">N = ' + n + ': ' + (r.err ? '<b style="color:var(--bad)">crashed after ' + r.steps.toLocaleString('en-US') + ' instructions: ' + esc(r.err.m) + '</b> The answer should have been ' + want + '.' : 'a0 = <b>' + r.a0 + '</b>, expected ' + want + ' ' + (r.a0 === want ? '✓' : '<b style="color:var(--bad)">✗</b>') + ' (' + r.steps + ' instructions).') + '</p>';
    } else if (k === 'asm2') {
      const a = Math.max(0, Math.min(1000, Math.round(+box.querySelector('[data-a]').value || 0))), b = Math.max(0, Math.min(1000, Math.round(+box.querySelector('[data-b]').value || 0)));
      const r = asmRun(c.art.code, [a, b], 0x1000);
      out.innerHTML = '<p class="small">' + a + ' × ' + b + ': ' + (r.err ? '<b style="color:var(--bad)">' + esc(r.err.m) + '</b>' : 'a0 = <b>' + r.a0 + '</b>, expected ' + a * b + ' ' + (r.a0 === a * b ? '✓' : '<b style="color:var(--bad)">✗</b>') + ' (' + r.steps + ' instructions).') + '</p>';
    } else if (k === 'yield') {
      const A = +box.querySelector('[data-area]').value || 0, d0 = +box.querySelector('[data-d0]').value || 0;
      const y = poissonYield(A, d0);
      out.innerHTML = '<p class="small">' + A + ' mm² = <b>' + (A / 100).toFixed(2) + ' cm²</b>. Yield = e^(−' + (A / 100).toFixed(2) + ' × ' + d0 + ') = <b>' + (y * 100).toFixed(1) + '%</b>. The agent\'s number used ' + A + ' instead of ' + (A / 100).toFixed(2) + '.</p>';
    } else if (k === 'roof') {
      const pf0 = +box.querySelector('[data-pf]').value || 1;
      if (which === 'double') box.querySelector('[data-pf]').value = pf0 * 2;
      const P = +box.querySelector('[data-p]').value || 1, bw = +box.querySelector('[data-bw]').value || 1, pf = +box.querySelector('[data-pf]').value || 1;
      const t = decodeTime(P, 1, bw, pf);
      out.innerHTML = '<div class="readout"><div><span>Reading the weights</span><b>' + (t.mem * 1000).toFixed(2) + ' ms</b></div><div><span>Doing the math</span><b>' + (t.math * 1000).toFixed(3) + ' ms</b></div><div><span>Tokens per second</span><b>' + (1 / t.t).toFixed(0) + '</b></div><div><span>Limited by</span><b>' + t.bound + '</b></div></div>';
    } else if (k === 'fact') {
      const q = box.querySelector('[data-q]').value.trim().toLowerCase();
      const hits = FACTS.facts.filter(f => q.length > 1 && (f.label + ' ' + f.value + ' ' + (f.detail || '')).toLowerCase().includes(q)).slice(0, 5);
      out.innerHTML = hits.length ? hits.map(f => '<div class="agfact"><b>' + esc(f.label) + '</b><span>' + esc(f.value) + '</span><small>' + esc(f.source || '') + ' · checked ' + esc(fmtDate(f.verified)) + (/^https:\/\//.test(f.url || '') ? ' · <a href="' + esc(f.url) + '" target="_blank" rel="noopener">source</a>' : '') + '</small></div>').join('') : '<p class="small muted">No fact matches. Try a shorter word.</p>';
    } else if (k === 'cov') {
      const r = tinyCheck(c.art.code, c.art.ins, c.art.outs, c.art.f);
      if (which === 'all') out.innerHTML = '<p class="small"><b>' + (r.bad.length ? r.bad.length + ' of 8 patterns fail.' : 'All 8 pass.') + '</b></p>' + tinyTable(c, r, c.art.tested);
      else out.innerHTML = '<p class="small">The agent tested <b>' + c.art.tested.length + ' of ' + r.rows.length + '</b> input patterns: ' + c.art.tested.join(', ') + '. The other ' + (r.rows.length - c.art.tested.length) + ' were never tried.</p>';
    }
  }

  function nav() {
    $('#agNav').innerHTML = CASES.map((c, i) => { const s = D[c.id] || {}; const r = s.decision ? score(c, s.decision, s.reason) : null; return '<button type="button" data-c="' + c.id + '" aria-pressed="' + (c.id === cur) + '" class="' + (r ? (r.rightCall ? 'right' : 'wrong') : '') + '"><span>' + (i + 1) + '</span><b>' + esc(c.t) + '</b><small>' + esc(c.area) + (r ? (r.rightCall ? ' · ✓' : ' · ✗') : '') + '</small></button>'; }).join('');
    const done = CASES.filter(c => D[c.id] && D[c.id].decision);
    const right = done.filter(c => score(c, D[c.id].decision, D[c.id].reason).rightCall).length;
    const checked = done.filter(c => D[c.id].checkedFirst).length;
    $('#agScore').textContent = done.length ? right + ' of ' + done.length + ' right calls · checked first ' + checked + ' of ' + done.length : CASES.length + ' cases';
    skills();
  }
  function skills() {
    $('#agSkills').innerHTML = Object.entries(SKILLS).map(([k, s]) => { const cs = CASES.filter(c => c.skill === k); const done = cs.filter(c => D[c.id] && D[c.id].decision); const ok = done.filter(c => score(c, D[c.id].decision, D[c.id].reason).rightCall).length; return '<div><span>' + esc(s[0]) + '</span><b>' + (done.length ? ok + ' of ' + done.length : '–') + '</b><small>' + esc(s[1]) + '</small></div>'; }).join('');
  }
  function render() {
    const c = CASES.find(x => x.id === cur), s = st(c.id), i = CASES.indexOf(c);
    const art = c.art.kind === 'tiny' || c.art.kind === 'cov' ? '' : c.art.kind === 'asm' || c.art.kind === 'asm2' ? '<pre class="v agpre">' + esc(c.art.code) + '</pre>' : '';
    const tinyArt = c.art.kind === 'tiny' ? '<pre class="v agpre">' + esc(c.art.code) + '</pre>' : '';
    let decide = '';
    if (!s.decision) {
      decide = '<div class="agdecide"><p class="eyebrow">Your call</p><div class="row"><button type="button" class="btn" data-d="trust">Trust it</button><button type="button" class="btn" data-d="reject" aria-pressed="' + (pending === 'reject') + '">Reject it</button></div>' +
        (pending === 'reject' ? '<fieldset class="agreasons"><legend class="small">What is wrong with it?</legend>' + c.reasons.map((r, k) => k === 3 && c.reasons[3].startsWith('Nothing') ? '' : '<label><input type="radio" name="agr" value="' + k + '"> ' + esc(r) + '</label>').join('') + '<div class="row"><button type="button" class="btn primary" data-d="confirm">Reject for this reason</button></div></fieldset>' : '') + '</div>';
    } else {
      const r = score(c, s.decision, s.reason);
      decide = '<div class="agverdict ' + (r.rightCall ? 'win' : 'lose') + '"><p class="code">' + (r.rightCall ? (c.truth === 'flawed' ? (r.rightReason ? 'Right call, right reason' : 'Right call, but a different reason') : 'Right call') : (c.truth === 'flawed' ? 'You trusted a flawed proposal' : 'You rejected a correct proposal')) + '</p>' +
        (c.truth === 'flawed' ? '<p><b>The flaw:</b> ' + esc(c.reasons[c.right]) + '.</p>' : '') + '<p>' + esc(c.why) + '</p>' +
        '<p class="small"><span class="tag" style="--c:var(--violet)">Skill: ' + esc(SKILLS[c.skill][0]) + '</span> ' + (s.checkedFirst ? 'You checked before deciding.' : 'You decided without using the tool. Agents sound equally sure when they are wrong.') + ' See also <a href="#' + c.topic + '">' + esc((topicById(c.topic) || { t: c.topic }).t) + '</a>.</p>' +
        '<div class="row"><button type="button" class="btn" data-d="again">Try this case again</button>' + (CASES[i + 1] ? '<button type="button" class="btn primary" data-go="' + CASES[i + 1].id + '">Next case →</button>' : '<a class="btn primary" href="#agSkills">See your skills ↓</a>') + '</div></div>';
    }
    $('#agCase').innerHTML = '<p class="code">Case ' + (i + 1) + ' of ' + CASES.length + ' · ' + esc(c.area) + '</p><h3>' + esc(c.t) + '</h3>' +
      '<div class="agchat"><div class="msg you"><span>You asked</span><p>' + esc(c.ask) + '</p></div><div class="msg bot"><span>Agent</span><p>' + esc(c.says) + '</p>' + art + tinyArt + '</div></div>' +
      TOOLS[c.art.kind](c) + decide;
    if (lastOut[c.id]) $('#agCase .agout').innerHTML = lastOut[c.id];
    nav();
  }
  $('#agNav').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { cur = b.dataset.c; pending = null; render(); } });
  $('#agCase').addEventListener('click', e => {
    const c = CASES.find(x => x.id === cur), s = st(c.id);
    const t = e.target.closest('[data-tool]'); if (t) { runTool(c, t.closest('.agtool'), t.dataset.tool); return; }
    const g = e.target.closest('[data-go]'); if (g) { cur = g.dataset.go; pending = null; render(); $('#agCase').scrollIntoView({ block: 'nearest' }); return; }
    const d = e.target.closest('[data-d]'); if (!d) return;
    const act = d.dataset.d;
    if (act === 'trust') { s.decision = 'trust'; s.checkedFirst = !!s.checked; save(); pending = null; render(); }
    else if (act === 'reject') { pending = pending === 'reject' ? null : 'reject'; render(); }
    else if (act === 'confirm') { const r = $('#agCase input[name="agr"]:checked'); if (!r) { d.textContent = 'Choose a reason first'; return; } s.decision = 'reject'; s.reason = +r.value; s.checkedFirst = !!s.checked; save(); pending = null; render(); }
    else if (act === 'again') { D[c.id] = {}; save(); render(); }
  });
  $('#agCase').addEventListener('input', e => { const n = e.target.closest('[data-n]'); if (n) n.closest('.agtool').querySelector('[data-o]').textContent = n.value; });
  render();
  initLive();
}

/* ---- the live agent: only when this page runs inside Claude ---- */
async function initLive() {
  const box = $('#agLive'); let sample = null;
  try { if (window.claude && typeof window.claude.use === 'function') sample = await window.claude.use('sample'); } catch (e) { sample = null; }
  if (!sample) return;
  $('#agLiveTag').textContent = 'Live · Claude';
  const projs = TC.PROJ.filter(p => p.f);
  const L = { p: projs[2].id, busy: false, code: null, text: '', guess: null, verdict: null, tally: { n: 0, right: 0 } };
  const P = () => projs.find(p => p.id === L.p);
  function draw() {
    const p = P();
    let body = '<div class="ctl"><span class="lbl">Specification</span><div class="seg" id="alProj">' + projs.map(x => '<button type="button" data-p="' + x.id + '" aria-pressed="' + (x.id === L.p) + '">' + esc(x.t) + '</button>').join('') + '</div></div><p class="small">' + esc(specText(p)) + '</p><div class="row"><button type="button" class="btn primary" id="alAsk"' + (L.busy ? ' disabled' : '') + '>' + (L.busy ? 'The agent is designing…' : 'Ask the agent to design it') + '</button><span class="small muted">' + (L.tally.n ? 'Your calibration: ' + L.tally.right + ' of ' + L.tally.n + ' calls right' : '') + '</span></div>';
    if (L.text) body += '<div class="agchat"><div class="msg bot"><span>Agent (live)</span><p>' + esc(L.text.replace(/```[\s\S]*?```/g, '').trim()) + '</p>' + (L.code ? '<pre class="v agpre">' + esc(L.code) + '</pre>' : '') + '</div></div>';
    if (L.code && !L.busy && L.guess === null) body += '<div class="agdecide"><p class="eyebrow">Before you check: do you trust it?</p><div class="row"><button type="button" class="btn" data-g="1">Trust it</button><button type="button" class="btn" data-g="0">Don\'t trust it</button></div></div>';
    if (L.verdict) body += '<div class="agverdict ' + ((L.guess === 1) === L.verdict.ok ? 'win' : 'lose') + '"><p class="code">' + (L.verdict.ok ? 'The design is correct' : 'The design is wrong') + ' · your call was ' + ((L.guess === 1) === L.verdict.ok ? 'right' : 'wrong') + '</p><p class="small">' + esc(L.verdict.msg) + '</p></div>';
    box.innerHTML = body + '<p class="note">The agent is Claude, asked to write in this lab\'s tiny hardware language for the specification above. Verification uses the same exhaustive check as the tiny chip studio.</p>';
  }
  box.addEventListener('click', async e => {
    const pb = e.target.closest('#alProj [data-p]'); if (pb && !L.busy) { L.p = pb.dataset.p; L.text = ''; L.code = null; L.guess = null; L.verdict = null; draw(); return; }
    const g = e.target.closest('[data-g]');
    if (g) { L.guess = +g.dataset.g; const p = P(); const r = tinyCheck(L.code, p.ins, p.outs, p.f); const ok = !r.errs.length && !r.bad.length; L.verdict = { ok, msg: r.errs.length ? 'It does not even compile: ' + r.errs[0].m : ok ? 'All ' + r.rows.length + ' input cases pass.' : r.bad.length + ' of ' + r.rows.length + ' cases are wrong, for example ' + p.ins.map(n => n + ' = ' + r.bad[0].v[n]).join(', ') + '.' }; L.tally.n++; if ((L.guess === 1) === ok) L.tally.right++; draw(); return; }
    if (e.target.closest('#alAsk') && !L.busy) {
      L.busy = true; L.text = ''; L.code = null; L.guess = null; L.verdict = null; draw();
      try { const r = await sample(livePrompt(P()), { cache: false, modelTier: 'quick', onText: ({ text }) => { L.text = text; } }); L.text = (r && r.text) || L.text; L.code = extractCode(L.text) || null; if (!L.code) L.text += '\n(No design found in the reply.)'; }
      catch (err) { L.text = err && err.code === 'rate_limited' ? 'The agent is busy. Try again in a minute.' : 'The agent could not answer right now.'; }
      finally { L.busy = false; draw(); }
    }
  });
  draw();
}
