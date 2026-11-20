/* Verify the agent (kind 'agent', at the Lab), from src/data/agent.js.
   A lab of the challenge player (src/v2/play.js): lab(L) gets the player's pieces and returns { draw, click, input };
   draw gives the card's HTML, click and input say whether they handled the event. */
import * as Agent from '../../data/agent.js';

export default function lab(L) {
  const { S, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  /* ---- Verify the agent: eight proposals from an AI agent; check each with the lab's own engines, then trust it or
     reject it for its real flaw (src/data/agent.js). The facts come from the lab's dated file when asked for. ---- */
  let FACTS = null;
  const factsNow = () => FACTS ? Promise.resolve(FACTS) : fetch('src/data/facts.json').then(r => r.json()).then(j => (FACTS = Object.fromEntries((j.facts || []).map(f => [f.id, f]))), () => (FACTS = {}));
  const agentOf = () => (S.agent = Agent.normalAgent(S.agent));
  function agentTool(c) {
    const a = c.art, T = view.ag[c.id] || (view.ag[c.id] = {});
    const k = (n, v) => '<span class="small muted">' + esc(n) + '</span> <b class="mono">' + esc(v) + '</b>';
    if (a.kind === 'tiny' || a.kind === 'cov') {
      const code = T.code != null ? T.code : a.code;
      let h = '<p class="kicker">' + esc(t('agent.tool.tiny')) + '</p><textarea class="agcode mono" data-ag-code rows="' + Math.max(2, code.split('\n').length) + '" spellcheck="false" aria-label="' + esc(t('agent.tool.codeAria')) + '">' + esc(code) + '</textarea>' +
        '<div class="chips"><button type="button" class="chipb" data-ag-run>' + esc(t('agent.tool.verify')) + '</button>' + (T.code != null && T.code !== a.code ? '<button type="button" class="link" data-ag-reset>' + esc(t('agent.tool.reset')) + '</button>' : '') + '</div>';
      if (T.ran) { const R = Agent.tinyCheck(code, a.ins, a.outs, a.f), key = r => a.ins.map(n => r.v[n]).join('');
        if (R.errs.length) h += '<p class="small bad">' + esc(t('agent.tool.errs')) + '</p>';
        else h += '<p class="small ' + (R.bad.length ? 'bad' : 'good') + '">' + esc(R.bad.length ? t('agent.tool.bad', { n: R.bad.length, total: R.rows.length }) : t('agent.tool.allOk', { total: R.rows.length })) + '</p>' +
          '<table class="agtt mono"><thead><tr>' + a.ins.map(n => '<th>' + esc(n) + '</th>').join('') + a.outs.map(n => '<th>' + esc(n) + '</th><th class="muted">' + esc(t('agent.tool.want')) + '</th>').join('') + '<th></th></tr></thead><tbody>' +
          R.rows.map(r => '<tr class="' + (r.ok ? '' : 'bad') + (a.tested && a.tested.includes(key(r)) ? ' tried' : '') + '">' + a.ins.map(n => '<td>' + r.v[n] + '</td>').join('') + a.outs.map(n => '<td>' + r.got[n] + '</td><td class="muted">' + r.want[n] + '</td>').join('') + '<td class="small">' + (a.tested && a.tested.includes(key(r)) ? esc(t('agent.tool.tried')) : '') + '</td></tr>').join('') + '</tbody></table>'; }
      return h;
    }
    if (a.kind === 'asm') { const n = T.n != null ? T.n : a.tried;
      let h = '<p class="kicker">' + esc(t('agent.tool.asm')) + '</p><pre class="agcode mono">' + esc(a.code) + '</pre><label class="lab" for="ag-n"><b>' + esc(t('agent.tool.n')) + '</b> <output>' + n + '</output></label><input type="range" id="ag-n" data-ag-n min="0" max="' + a.data.length + '" step="1" value="' + n + '">' +
        '<p class="small muted">' + esc(t('agent.tool.data', { list: a.data.join(', ') })) + '</p><button type="button" class="chipb" data-ag-run>' + esc(t('agent.tool.run')) + '</button>';
      if (T.ran) { const R = Agent.sumRun(a.code, a.data, n); h += '<p class="small ' + (R.ok ? 'good' : 'bad') + '">' + esc(R.ok ? t('agent.tool.sumOk', { v: R.a0 }) : R.err ? t('agent.tool.crash', { steps: R.steps }) : t('agent.tool.sumBad', { v: R.a0, want: R.want })) + '</p>'; }
      return h;
    }
    if (a.kind === 'asm2') { const [x, y] = T.ab || a.tried;
      let h = '<p class="kicker">' + esc(t('agent.tool.asm')) + '</p><pre class="agcode mono">' + esc(a.code) + '</pre><div class="agab"><label>' + esc(t('agent.tool.a')) + ' <input type="number" min="0" max="1000" data-ag-a value="' + x + '"></label><label>' + esc(t('agent.tool.b')) + ' <input type="number" min="0" max="1000" data-ag-b value="' + y + '"></label><button type="button" class="chipb" data-ag-run>' + esc(t('agent.tool.run')) + '</button></div>';
      if (T.ran) { const R = Agent.asmRun(a.code, [x, y], 0x1000), ok = !R.err && !R.errs && R.a0 === x * y; h += '<p class="small ' + (ok ? 'good' : 'bad') + '">' + esc(ok ? t('agent.tool.mulOk', { a: x, b: y, v: R.a0, steps: R.steps }) : t('agent.tool.mulBad', { a: x, b: y, v: R.a0 })) + '</p>'; }
      return h;
    }
    if (a.kind === 'yield') { const area = T.area != null ? T.area : a.area, d0 = T.d0 != null ? T.d0 : a.d0, y = Agent.poissonYield(area, d0);
      return '<p class="kicker">' + esc(t('agent.tool.yield')) + '</p><div class="agab"><label>' + esc(t('agent.tool.area')) + ' <input type="number" min="1" max="900" data-ag-area value="' + area + '"></label><label>' + esc(t('agent.tool.d0')) + ' <input type="number" min="0" max="2" step="0.01" data-ag-d0 value="' + d0 + '"></label></div>' +
        '<p class="small">' + esc(t('agent.tool.yieldV', { cm: (area / 100).toFixed(2), d0, v: (y * 100).toFixed(1) })) + '</p><div class="agbar"><span style="width:' + (y * 100).toFixed(1) + '%"></span></div>';
    }
    if (a.kind === 'roof') { const x2 = !!T.x2, D = Agent.decodeTime(a.params, a.bytes, a.bw, a.pf * (x2 ? 2 : 1)), base = Agent.decodeTime(a.params, a.bytes, a.bw, a.pf), ms = v => (v * 1000).toFixed(v < 0.001 ? 3 : 1);
      const w = v => Math.max(0.6, v / base.t * 100).toFixed(1);
      return '<p class="kicker">' + esc(t('agent.tool.roof')) + '</p><p class="small muted">' + esc(t('agent.tool.roofSet', { p: a.params, bw: a.bw, pf: a.pf * (x2 ? 2 : 1) })) + '</p>' +
        '<div class="agrace"><span class="small">' + esc(t('agent.tool.read')) + '</span><span class="agbar"><span style="width:' + w(D.mem) + '%"></span></span><b class="mono small">' + esc(t('agent.tool.ms', { v: ms(D.mem) })) + '</b>' +
        '<span class="small">' + esc(t('agent.tool.math')) + '</span><span class="agbar hot"><span style="width:' + w(D.math) + '%"></span></span><b class="mono small">' + esc(t('agent.tool.ms', { v: ms(D.math) })) + '</b></div>' +
        '<p class="small">' + esc(t('agent.tool.roofV', { tps: Math.round(1 / D.t), was: Math.round(1 / base.t) })) + '</p><button type="button" class="chipb" data-ag-x2 aria-pressed="' + x2 + '">' + esc(t(x2 ? 'agent.tool.x1' : 'agent.tool.x2')) + '</button>';
    }
    if (a.kind === 'fact') {
      if (!T.ran) return '<p class="kicker">' + esc(t('agent.tool.fact')) + '</p><button type="button" class="chipb" data-ag-run>' + esc(t('agent.tool.lookup')) + '</button>';
      const f = FACTS && FACTS[a.fact];
      return '<p class="kicker">' + esc(t('agent.tool.fact')) + '</p>' + (f ? '<div class="agfact"><b>' + esc(f.label) + ': ' + esc(f.value) + '</b><span class="small muted">' + esc(t('agent.tool.factSrc', { src: f.source, kind: f.kind, date: f.verified || f.date || '' })) + '</span>' + (f.url ? '<a class="small" href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('agent.tool.open')) + '</a>' : '') + '</div>' : '<p class="small muted">' + esc(t('agent.tool.loading')) + '</p>');
    }
    return '';
  }
  function agentDesk() {
    const A = agentOf(), C = Agent.checkAgent(A), id = view.agc || (Agent.CASES.find(c => !A[c.id] || !Agent.score(c, A[c.id].decision, A[c.id].reason).ok) || Agent.CASES[0]).id, c = Agent.caseOf(id);
    view.agc = id; view.ag = view.ag || {};
    let h = head() + '<div class="agprog" data-f2="goal"><p class="kicker">' + esc(t('agent.progress', { n: C.done, total: C.total })) + '</p><div class="agcases">' + Agent.CASES.map((x, i) => { const d = A[x.id], st = d ? (Agent.score(x, d.decision, d.reason).ok ? 'ok' : 'no') : '';
      return '<button type="button" class="agcase ' + st + (x.id === id ? ' on' : '') + '" data-ag-case="' + x.id + '" aria-pressed="' + (x.id === id) + '"><span class="n">' + (i + 1) + '</span><span class="small">' + esc(t('agent.case.' + x.id + '.t')) + '</span></button>'; }).join('') + '</div></div>';
    const a = c.art, d = A[id];
    h += '<p class="kicker">' + esc(t('agent.caseN', { n: Agent.CASES.indexOf(c) + 1, area: t('agent.area.' + c.area) })) + '</p><h4 class="agt">' + esc(t('agent.case.' + id + '.t')) + '</h4>' +
      '<div class="say you"><span class="who small">' + esc(t('agent.you')) + '</span>' + esc(t('agent.case.' + id + '.ask')) + '</div>' +
      '<div class="say ai"><span class="who small">' + esc(t('agent.ai')) + '</span>' + esc(t('agent.case.' + id + '.says')) + (a.kind === 'tiny' || a.kind === 'cov' ? '<pre class="agcode mono">' + esc(a.code) + '</pre>' : '') + '</div>' +
      '<div class="agtool" data-f2="instrument">' + agentTool(c) + '</div>';
    if (!d || view.agRedo === id) {
      h += '<p class="kicker">' + esc(t('agent.decide')) + '</p><div class="chips"><button type="button" class="btn" data-ag-trust>' + esc(t('agent.trust')) + '</button><button type="button" class="btn" data-ag-reject aria-pressed="' + (view.agReject === id) + '">' + esc(t('agent.reject')) + '</button></div>';
      if (view.agReject === id) h += '<p class="small">' + esc(t('agent.why')) + '</p><div class="agreasons">' + [0, 1, 2, 3].map(i => '<button type="button" class="agr" data-ag-reason="' + i + '">' + esc(t('agent.case.' + id + '.r' + i)) + '</button>').join('') + '</div>';
    } else {
      const S0 = Agent.score(c, d.decision, d.reason);
      h += '<div class="agverdict ' + (S0.ok ? 'good' : 'bad') + '"><b>' + esc(t(S0.ok ? 'agent.right' : S0.rightCall ? 'agent.halfRight' : 'agent.wrong')) + '</b> <span class="small muted">' + esc(t('agent.skill.' + c.skill + '.t')) + ': ' + esc(t('agent.skill.' + c.skill + '.d')) + '</span></div>' +
        '<p class="small">' + esc(t('agent.case.' + id + '.why')) + '</p>' + (c.at ? '<a class="small" href="' + esc(c.at) + '">' + esc(t('agent.inWorld')) + '</a> ' : '') + '<button type="button" class="link" data-ag-redo>' + esc(t('agent.again')) + '</button>';
      const nx = Agent.CASES.find(x => !A[x.id]); if (nx) h += ' <button type="button" class="btn primary" data-ag-case="' + nx.id + '">' + esc(t('agent.next')) + '</button>';
    }
    if (C.ok) win();
    return h + doneNote() + reward();
  }
  return {
    draw: agentDesk,
    click(e) { const q = s => e.target.closest(s);
    const agc = q('[data-ag-case]'); if (agc) { view.agc = agc.dataset.agCase; view.agReject = null; view.agRedo = null; draw(); return ((show('.agt')), true); }
    if (ch.kind === 'agent') { const c = Agent.caseOf(view.agc), T = c && (view.ag[c.id] = view.ag[c.id] || {});
      if (c && q('[data-ag-run]')) { T.ran = true; const ta = el.querySelector('[data-ag-code]'); if (ta) T.code = ta.value;
        if (c.art.kind === 'asm2') T.ab = [+el.querySelector('[data-ag-a]').value || 0, +el.querySelector('[data-ag-b]').value || 0].map(v => Math.max(0, Math.min(1000, Math.round(v))));
        if (c.art.kind === 'fact') { draw(); factsNow().then(() => draw()); return true; }
        draw(); return ((show('.agtool')), true); }
      if (c && q('[data-ag-reset]')) { T.code = null; T.ran = false; return ((draw()), true); }
      if (c && q('[data-ag-x2]')) { T.x2 = !T.x2; return ((draw()), true); }
      if (c && q('[data-ag-trust]')) { const A = agentOf(); A[c.id] = { decision: 'trust', reason: null }; view.agRedo = null; view.agReject = null; ctx.save(); draw(); fx(); return ((show('.agverdict')), true); }
      if (c && q('[data-ag-reject]')) { view.agReject = c.id; draw(); return ((show('.agreasons')), true); }
      const rs = q('[data-ag-reason]'); if (c && rs) { const A = agentOf(); A[c.id] = { decision: 'reject', reason: +rs.dataset.agReason }; view.agRedo = null; view.agReject = null; ctx.save(); draw(); fx(); return ((show('.agverdict')), true); }
      if (c && q('[data-ag-redo]')) { view.agRedo = c.id; return ((draw()), true); } }
      return false; },
    input(e) {
    if (ch.kind === 'agent') { const c = Agent.caseOf(view.agc), T = c && (view.ag[c.id] = view.ag[c.id] || {});
      if (c && e.target.closest('[data-ag-n]')) { T.n = +e.target.value; T.ran = true; return ((draw()), true); }
      if (c && e.target.closest('[data-ag-area]')) { T.area = Math.max(1, Math.min(900, +e.target.value || 1)); return ((draw()), true); }
      if (c && e.target.closest('[data-ag-d0]')) { T.d0 = Math.max(0, Math.min(2, +e.target.value || 0)); return ((draw()), true); }
      if (c && e.target.closest('[data-ag-code]')) { T.code = e.target.value; return true; } }
      return false; }
  };
}
