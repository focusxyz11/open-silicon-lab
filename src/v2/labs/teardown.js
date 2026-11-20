/* Look inside (kind 'teardown', at the phone's board) and the right chip for the job (kind 'fit', at the studio's need), from src/data/teardown.js.
   A lab of the challenge player (src/v2/play.js): lab(L) gets the player's pieces and returns { draw, click, input };
   draw gives the card's HTML, click and input say whether they handled the event. */
import * as TD from '../../data/teardown.js';

export default function lab(L) {
  const { S, ch, ctx, el, esc, t, head, reward, doneNote, win, draw, fx, show } = L, view = L.view;
  /* ---- Look inside (src/data/teardown.js): open five products, see every kind of chip each holds, coloured by what it
     does or how it is made, and count the kinds that need a leading-edge factory ---- */
  const tdOf = () => { const o = S.teardown || {}; return (S.teardown = { opened: (o.opened || []).filter(id => TD.productById(id)), count: Number.isInteger(o.count) ? o.count : null, by: o.by === 'made' ? 'made' : 'job', at: TD.productById(o.at) ? o.at : null }); };
  function teardown() {
    const D = tdOf(), C = TD.checkNewest(D), P = D.at && TD.productById(D.at);
    let h = head() + '<p class="kicker">' + esc(t('td.open')) + '</p><div class="chips tdprod">' + TD.PRODUCTS.map(p => '<button type="button" class="chipb' + (D.at === p.id ? ' on' : '') + '" data-td-open="' + p.id + '" aria-pressed="' + (D.at === p.id) + '">' + (D.opened.includes(p.id) ? '✓ ' : '') + esc(t('td.product.' + p.id + '.t')) + '</button>').join('') + '</div>';
    if (!P) return h + '<p class="small hint">' + esc(t('td.start')) + '</p>' + reward();
    h += '<div class="chips tdby"><span class="small muted">' + esc(t('td.by.label')) + '</span>' + ['job', 'made'].map(k => '<button type="button" class="chipb' + (D.by === k ? ' on' : '') + '" data-td-by="' + k + '" aria-pressed="' + (D.by === k) + '">' + esc(t('td.by.' + k)) + '</button>').join('') + '</div>';
    /* the board: one tile for each kind of chip, the main one bigger; a diamond marks the leading edge */
    const sel = view.tdChip && P.chips.find(c => c.id === view.tdChip);
    h += '<div class="tdboard by-' + D.by + '" data-f2="instrument">' + P.chips.map(c => '<button type="button" class="tdchip ' + D.by + '-' + (D.by === 'job' ? c.job : c.made) + (c.big ? ' big' : '') + (sel && sel.id === c.id ? ' on' : '') + '" data-td-chip="' + c.id + '"><span>' + esc(t('td.chip.' + c.id + '.t')) + '</span>' + (c.leading ? '<i class="lead" aria-label="' + esc(t('td.rd.lead')) + '">◆</i>' : '') + '</button>').join('') + '</div>';
    const keys = D.by === 'job' ? TD.JOBS : TD.MADE;
    h += '<div class="tdkey">' + keys.map(k => '<span class="small"><i class="sw ' + D.by + '-' + k + '"></i>' + esc(t('td.' + D.by + '.' + k)) + '</span>').join('') + '<span class="small"><i class="lead">◆</i> ' + esc(t('td.rd.lead')) + '</span></div>';
    if (sel) h += '<div class="tdsel"><b>' + esc(t('td.chip.' + sel.id + '.t')) + '</b><span class="small muted">' + esc(t('td.job.' + sel.job)) + ' · ' + esc(t('td.how')) + ' ' + esc(t('td.chip.' + sel.id + '.m')) + '</span><span class="small">' + esc(t('td.chip.' + sel.id + '.d')) + '</span></div>';
    const S1 = TD.summaryOf(P.id);
    h += '<p class="small">' + esc(t(S1.key, S1.vars)) + ' ' + esc(t(S1.then[0])) + '</p>';
    /* the count, once every product is open */
    if (C.all) {
      h += '<p class="kicker">' + esc(t('td.askCount', { n: TD.PRODUCTS.reduce((a, p) => a + p.chips.length, 0) })) + '</p><div class="agab"><label>' + esc(t('td.yourCount')) + ' <input type="number" min="0" max="60" data-td-count value="' + (D.count == null ? '' : D.count) + '"></label><button type="button" class="chipb" data-td-check>' + esc(t('td.check')) + '</button></div>';
      if (view.tdTried && !C.ok) h += '<p class="small bad">' + esc(t('td.notYet')) + '</p>';
    } else h += '<p class="small muted">' + esc(t('td.openAll', { n: TD.PRODUCTS.length - D.opened.length })) + '</p>';
    if (C.ok) { win(); h += '<p class="small good">' + esc(t('td.ch.newest.done')) + '</p>'; }
    return h + '<p class="small muted">' + esc(t('td.note')) + '</p>' + doneNote() + reward();
  }
  /* ---- The right chip for the job: eight jobs, a line from flexible to specialized, the best kind for each ---- */
  const fitOf = () => { const o = S.fit || {}, a = {}; TD.FIT_JOBS.forEach(j => { const k = (o.answers || {})[j.id]; if (TD.FIT_KINDS.some(x => x.id === k)) a[j.id] = k; }); return (S.fit = { answers: a }); };
  function fitJobs() {
    const F = fitOf(), C = TD.checkJobs(F), i = view.fitJob != null ? view.fitJob : Math.max(0, TD.FIT_JOBS.findIndex(j => F.answers[j.id] !== j.best)), J = TD.FIT_JOBS[i];
    let h = head() + '<p class="kicker">' + esc(t('td.fit.score', { n: C.best, m: C.of })) + (C.of - C.best ? ' · ' + esc(t('td.fit.togo', { n: C.of - C.best })) : '') + '</p>';
    h += '<div class="fitjobs" data-f2="goal">' + TD.FIT_JOBS.map((j, k) => { const v = F.answers[j.id] ? TD.verdict(j.id, F.answers[j.id]) : ''; return '<button type="button" class="agcase ' + (v === 'best' ? 'ok' : v ? 'no' : '') + (k === i ? ' on' : '') + '" data-fit-job="' + k + '"><span class="n">' + (k + 1) + '</span><span class="small">' + esc(t('td.fit.job.' + j.id + '.t')) + '</span></button>'; }).join('') + '</div>';
    h += '<p class="kicker">' + esc(t('td.fit.pick', { n: i + 1 })) + '</p><h4 class="agt">' + esc(t('td.fit.job.' + J.id + '.t')) + '</h4>';
    /* the line: flexible at the left, one job done efficiently at the right; the power chip stands apart */
    const a = F.answers[J.id], v = a ? TD.verdict(J.id, a) : null;
    h += '<div class="fitline" data-f2="instrument"><span class="end small muted">' + esc(t('td.fit.end.l')) + '</span><span class="end r small muted">' + esc(t('td.fit.end.r')) + '</span>' +
      TD.FIT_KINDS.filter(k => k.pos != null).map(k => '<button type="button" class="fitk' + (a === k.id ? ' on ' + v : '') + '" style="left:' + (k.pos * 100).toFixed(0) + '%;transform:translateX(-' + (k.pos * 100).toFixed(0) + '%)" data-fit-kind="' + k.id + '" title="' + esc(t('td.fit.kind.' + k.id + '.d')) + '">' + esc(t('td.fit.kind.' + k.id + '.t')) + '</button>').join('') + '</div>' +
      TD.FIT_KINDS.filter(k => k.pos == null).map(k => '<button type="button" class="chipb fitk2' + (a === k.id ? ' on ' + v : '') + '" data-fit-kind="' + k.id + '">' + esc(t('td.fit.kind.' + k.id + '.t')) + '</button>').join('');
    if (a) {
      const kd = TD.FIT_KINDS.find(k => k.id === a);
      h += '<p class="small"><b>' + esc(t('td.fit.kind.' + kd.id + '.t')) + '</b> · ' + esc(t('td.fit.kind.' + kd.id + '.d')) + '</p>';
      h += '<p class="small ' + (v === 'best' ? 'good' : v === 'ok' ? 'hint' : 'bad') + '">' + esc(v === 'ok' ? t('td.fit.ok', { kind: t('td.fit.kind.' + J.best + '.t') }) : t('td.fit.' + v)) + '</p>';
      if (v === 'best') h += '<p class="small">' + esc(t('td.fit.job.' + J.id + '.why')) + '</p>';
      else if (view.fitShow === J.id) h += '<p class="small">' + esc(t('td.fit.answer', { kind: t('td.fit.kind.' + J.best + '.t') })) + ' ' + esc(t('td.fit.job.' + J.id + '.why')) + '</p>';
      else h += '<button type="button" class="link" data-fit-show>' + esc(t('td.fit.show')) + '</button>';
    }
    const nx = TD.FIT_JOBS.findIndex((j, k) => k !== i && F.answers[j.id] !== j.best); if (v === 'best' && nx >= 0) h += ' <button type="button" class="btn primary" data-fit-job="' + nx + '">' + esc(t('agent.next')) + '</button>';
    if (C.ok) { win(); h += '<p class="small good">' + esc(t('td.ch.jobs.done')) + '</p>'; }
    return h + '<p class="small muted">' + esc(t('td.fit.note')) + '</p>' + doneNote() + reward();
  }
  return {
    draw: () => ch.kind === 'fit' ? fitJobs() : teardown(),
    click(e) { const q = s => e.target.closest(s);
    const tdo = q('[data-td-open]'); if (tdo) { const D = tdOf(); D.at = tdo.dataset.tdOpen; if (!D.opened.includes(D.at)) D.opened.push(D.at); view.tdChip = null; ctx.save(); draw(); return ((show('.tdboard')), true); }
    const tdb = q('[data-td-by]'); if (tdb) { tdOf().by = tdb.dataset.tdBy; ctx.save(); return ((draw()), true); }
    const tdc = q('[data-td-chip]'); if (tdc) { view.tdChip = view.tdChip === tdc.dataset.tdChip ? null : tdc.dataset.tdChip; draw(); return ((show('.tdsel')), true); }
    if (q('[data-td-check]')) { const D = tdOf(), inp = el.querySelector('[data-td-count]'); D.count = inp && inp.value !== '' ? Math.round(+inp.value) : null; view.tdTried = true; ctx.save(); draw(); fx(); return ((show('.won, p.bad')), true); }
    const fj = q('[data-fit-job]'); if (fj) { view.fitJob = +fj.dataset.fitJob; view.fitShow = null; draw(); return ((show('.agt')), true); }
    const fk = q('[data-fit-kind]'); if (fk) { const F = fitOf(), i = view.fitJob != null ? view.fitJob : Math.max(0, TD.FIT_JOBS.findIndex(j => F.answers[j.id] !== j.best)); view.fitJob = i; F.answers[TD.FIT_JOBS[i].id] = fk.dataset.fitKind; ctx.save(); draw(); fx(); return true; }
    if (q('[data-fit-show]')) { const i = view.fitJob != null ? view.fitJob : 0; view.fitShow = TD.FIT_JOBS[i].id; return ((draw()), true); }
      return false; },
    input(e) {

      return false; }
  };
}
