/* ---- Compute beats cleverness: a blind search against a person's design (Sutton 2019; src/engines/search.js) ---- */
const SRCH = (() => {
  const A = 0xF0, B = 0xCC, C = 0xAA, OUTS = [A ^ B ^ C, (A & B) | (B & C) | (A & C)], N = 16, FULL = 16;
  const pop = x => { let n = 0; while (x) { n += x & 1; x >>= 1; } return n; };
  /* a circuit: N NAND gates, each fed by two earlier things (0, 1, 2 are the inputs a, b, c), then which two are the outputs */
  function evalG(g) {
    const v = [A, B, C]; for (let i = 0; i < N; i++) v.push(~(v[g[2 * i]] & v[g[2 * i + 1]]) & 255);
    let right = 0; const used = new Set(), stack = [];
    for (let o = 0; o < 2; o++) { const k = g[2 * N + o]; right += 8 - pop(v[k] ^ OUTS[o]); stack.push(k); }
    while (stack.length) { const k = stack.pop(); if (k < 3 || used.has(k)) continue; used.add(k); stack.push(g[2 * (k - 3)], g[2 * (k - 3) + 1]); }
    return { right, gates: used.size, used, v };
  }
  function make(seed) {
    const r = rng(seed), g = []; for (let i = 0; i < N; i++) g.push(Math.floor(r() * (3 + i)), Math.floor(r() * (3 + i))); for (let o = 0; o < 2; o++) g.push(Math.floor(r() * (3 + N)));
    const f = evalG(g); return { r, best: g, fb: f, tried: 1, marks: [{ tried: 1, right: f.right, gates: f.gates, g }], first: null };
  }
  /* four changed copies a round; keep the best of them when it scores no worse (once right: no more gates) */
  function step(s, until) {
    const r = s.r;
    while (s.tried < until) {
      let ch = null, fc = null;
      for (let k = 0; k < 4; k++) { const h = s.best.slice(), m = 1 + Math.floor(r() * 3);
        for (let j = 0; j < m; j++) { const i = Math.floor(r() * h.length); h[i] = i < 2 * N ? Math.floor(r() * (3 + (i >> 1))) : Math.floor(r() * (3 + N)); }
        const f = evalG(h); s.tried++; if (!fc || f.right > fc.right || (f.right === fc.right && f.gates <= fc.gates)) { ch = h; fc = f; } }
      const fb = s.fb;
      if (fc.right > fb.right || (fc.right === fb.right && (fb.right < FULL || fc.gates <= fb.gates))) {
        if (fc.right > fb.right || (fc.right === FULL && fc.gates < fb.gates)) { s.marks.push({ tried: s.tried, right: fc.right, gates: fc.gates, g: ch }); if (fc.right === FULL && !s.first) s.first = s.tried; }
        s.best = ch; s.fb = fc; }
    }
  }
  /* the plain way: two half adders and an OR, written out in NAND gates (13) */
  const PLAIN = [0, 1, 0, 3, 1, 3, 4, 5, 3, 3, 6, 2, 6, 8, 2, 8, 9, 10, 8, 8, 7, 7, 12, 12, 13, 14, 0, 0, 0, 0, 0, 0, 11, 15];
  return { evalG, make, step, PLAIN, OUTS, N, FULL, MAX: 1e6 };
})();
function drawCircuit(g, G, x, y, w, h, names) {
  const { c, P } = g, E = SRCH.evalG(G), N = SRCH.N, lv = [0, 0, 0], ids = [...E.used].sort((a, b) => a - b), pos = {};
  for (let k = 3; k < 3 + N; k++) lv[k] = E.used.has(k) ? 1 + Math.max(lv[G[2 * (k - 3)]], lv[G[2 * (k - 3) + 1]]) : 0;
  const maxL = Math.max(1, ...ids.map(k => lv[k]));
  [0, 1, 2].forEach(i => { pos[i] = [x + 6, y + h * (i + .5) / 3]; });
  for (let L = 1; L <= maxL; L++) {
    const at = ids.filter(k => lv[k] === L).map(k => ({ k, m: (pos[G[2 * (k - 3)]][1] + pos[G[2 * (k - 3) + 1]][1]) / 2 })).sort((a, b) => a.m - b.m);
    at.forEach((n, i) => { pos[n.k] = [x + 22 + (L - .4) / maxL * (w - 52), y + h * (i + .5) / at.length]; });
  }
  c.lineWidth = 1; c.strokeStyle = P.muted; c.globalAlpha = .75;
  for (const k of ids) [0, 1].forEach(j => { const s = pos[G[2 * (k - 3) + j]], d = pos[k], x1 = s[0] + (G[2 * (k - 3) + j] < 3 ? 4 : 11), x2 = d[0] - 8, y2 = d[1] + (j ? 3.5 : -3.5), mx = (x1 + x2) / 2;
    c.beginPath(); c.moveTo(x1, s[1]); c.bezierCurveTo(mx, s[1], mx, y2, x2, y2); c.stroke(); });
  [0, 1].forEach(o => { const k = G[2 * N + o], s = pos[k], yo = y + h * (o ? .72 : .28), x1 = s[0] + (k < 3 ? 4 : 11), x2 = x + w - 4, mx = (x1 + x2) / 2;
    c.beginPath(); c.moveTo(x1, s[1]); c.bezierCurveTo(mx, s[1], mx, yo, x2, yo); c.stroke(); });
  c.globalAlpha = 1;
  [0, 1, 2].forEach(i => { c.fillStyle = P.ink; disc(c, pos[i][0], pos[i][1], 3); c.fill(); });
  c.strokeStyle = P.ink; c.fillStyle = P.solid; c.lineWidth = 1.3;
  for (const k of ids) { const [X, Y] = pos[k]; c.beginPath(); c.moveTo(X - 7, Y - 6.5); c.lineTo(X, Y - 6.5); c.arc(X, Y, 6.5, -Math.PI / 2, Math.PI / 2); c.lineTo(X - 7, Y + 6.5); c.closePath(); c.fill(); c.stroke(); disc(c, X + 8.7, Y, 2); c.fill(); c.stroke(); }
  if (names) { g.lab(x - 8, pos[0][1] - 7, 'a', '', 'r'); g.lab(x - 8, pos[1][1] - 7, 'b', '', 'r'); g.lab(x - 8, pos[2][1] - 7, 'c', '', 'r'); }
  return E;
}
INST.sutton = {
  u0: 0.62,
  setup(S) { S.main = SRCH.make(8 * 7919); S.others = [1, 2, 3, 4, 5, 6, 7, 9, 10].map(s => SRCH.make(s * 7919)); S.oi = 0; },
  frame(g, S) {
    const { c, P, box: B } = g;
    /* the search itself, a slice each frame: the shown run first, then nine more runs for their luck */
    if (S.main.tried < SRCH.MAX) SRCH.step(S.main, Math.min(SRCH.MAX, S.main.tried + 60000));
    else if (S.oi < S.others.length) { const o = S.others[S.oi]; SRCH.step(o, Math.min(SRCH.MAX, o.tried + 120000)); if (o.tried >= SRCH.MAX) S.oi++; }
    if (S.main.tried < SRCH.MAX || S.oi < S.others.length) g.again();
    const budget = Math.min(Math.pow(10, 6 * g.u), S.main.tried); let m = S.main.marks[0]; for (const k of S.main.marks) if (k.tried <= budget) m = k;
    const wide = B.w > 560, axY = B.y + B.h - 22, top = B.y + 14, h = axY - top - 26, lampW = 46;
    const xs = wide ? B.x + B.w * .36 : B.x + 16, ws = B.x + B.w - lampW - xs - 8;
    if (wide) { drawCircuit(g, SRCH.PLAIN, B.x + 16, top, B.w * .3, h, true); g.lab(B.x + 16 + B.w * .15, B.y - 18, 'a person’s plain design', '', 'c');
      c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath(); c.moveTo(B.x + B.w * .335, top); c.lineTo(B.x + B.w * .335, top + h); c.stroke(); }
    const E = drawCircuit(g, m.g, xs + 14, top, ws - 14, h, !wide);
    g.lab(xs + ws / 2, B.y - 18, 'the search’s best so far', 'ink', 'c');
    /* its sixteen answers: the sum and the carry for each of the eight inputs */
    const lx = B.x + B.w - lampW, q = Math.min(11, (h - 8) / 8 - 3);
    [0, 1].forEach(o => { const out = E.v[m.g[2 * SRCH.N + o]];
      for (let r = 0; r < 8; r++) { const ok = ((out >> (7 - r)) & 1) === ((SRCH.OUTS[o] >> (7 - r)) & 1), X = lx + 8 + o * (q + 8), Y = top + 4 + r * (q + 3);
        if (ok) { c.fillStyle = P.ink; c.fillRect(X, Y, q, q); } else { c.strokeStyle = P.red; c.lineWidth = 1.6; c.strokeRect(X + 1, Y + 1, q - 2, q - 2); } } });
    g.lab(lx + 8 + q, B.y - 18, 'answers', '', 'c');
    /* the computing spent, on powers of ten */
    const X = t => B.x + 10 + (B.w - 20) * Math.log10(Math.max(1, t)) / 6;
    c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath(); c.moveTo(X(1), axY); c.lineTo(X(1e6), axY); c.stroke();
    c.strokeStyle = P.blue; c.lineWidth = 3; c.beginPath(); c.moveTo(X(1), axY); c.lineTo(X(budget), axY); c.stroke();
    for (let e = 0; e <= 6; e++) { c.strokeStyle = P.muted; c.lineWidth = 1; c.beginPath(); c.moveTo(X(10 ** e), axY - 4); c.lineTo(X(10 ** e), axY + 4); c.stroke(); }
    g.lab(X(1), axY + 6, '1 tried'); g.lab(X(1e3), axY + 6, 'a thousand', '', 'c'); g.lab(X(1e6), axY + 6, 'a million', '', 'r');
    for (const k of S.main.marks) { c.fillStyle = k.right === SRCH.FULL ? P.ink : P.muted; c.globalAlpha = k.tried <= budget ? 1 : .35; c.fillRect(X(k.tried) - 1, axY - 13, 2, 8); }
    c.globalAlpha = 1; c.strokeStyle = P.muted; c.lineWidth = 1;
    for (const o of S.others) if (o.first) { const x = X(o.first), y = axY; c.beginPath(); c.moveTo(x, y - 3.5); c.lineTo(x + 3.5, y); c.lineTo(x, y + 3.5); c.lineTo(x - 3.5, y); c.closePath(); c.stroke(); }
    c.fillStyle = P.blue; disc(c, X(budget), axY, 4.5); c.fill();
    const lucky = S.others.filter(o => o.first).length;
    return { reads: [
      { v: big(budget), k: S.main.tried < SRCH.MAX ? 'circuits tried (the search is running)' : 'circuits tried' },
      { v: m.right + ' of 16', k: 'answers it gets right', tone: m.right === 16 ? 'good' : 'bad' },
      { v: m.right === 16 ? m.gates + ' gates' : 'not right yet', k: 'against 13 the plain way, 9 the classic best' }],
      cap: wide ? (lucky ? CARDS.sutton.cap + ' Diamonds: when ' + lucky + ' other runs first got it right.' : CARDS.sutton.cap) : 'The best full adder a blind search has found so far, and its 16 answers. A person’s plain design uses 13 gates.' };
  }
};

/* ---- The next Moore's law: fifty years of chips, and the years nobody has made yet (trend of src/data/hold.js) ---- */
const TREND = (() => {
  const P = s => s.split(' ').map(e => { const [y, v] = e.split(':'); return [1970 + y / 10, +v]; });
  const tr = P('19:2.3e3 23:3.6e3 43:6.1e3 96:2.9e4 123:1.4e5 159:2.7e5 163:1.1e5 187:1.2e5 195:1.2e6 206:1.2e6 224:1.2e6 227:3.1e6 227:1.1e6 230:1.7e6 234:3.1e6 234:9.2e5 247:1.9e6 247:2.8e6 254:9.6e6 257:3.1e6 262:5.5e6 263:6.8e6 263:3.7e6 264:4.3e6 268:9.6e6 274:5.5e6 275:3.6e6 275:8.9e6 276:7.6e6 289:1.5e7 291:9.4e6 292:7e6 295:9.4e6 295:2.2e7 302:2.2e7 307:2.8e7 307:3.7e7 311:2.9e7 312:4.3e7 317:2.5e7 318:3.7e7 324:5.6e7 328:3.8e7 329:2.2e8 334:1.5e8 335:5.4e7 337:1.1e8 348:1.3e8 348:1.1e8 348:2.7e8 357:2.3e8 358:1.1e8 360:3.1e8 361:1.2e8 369:3.8e8 369:1.6e8 369:2.5e8 370:3e8 370:5.8e8 371:1.5e8 376:5.8e8 377:2.3e8 378:8.1e8 378:1.2e8 380:5.1e8 382:4.5e8 385:4.1e8 392:4.6e8 393:7.8e8 397:2.3e9 397:1.9e9 402:4.1e8 404:1.3e9 412:1.2e9 413:2.6e9 419:1.2e9 424:2.4e9 424:2.3e9 427:2.1e9 429:1.2e9 434:5e9 438:4.3e9 442:4.3e9 445:4.2e9 448:2.6e9 448:3.8e9 448:5.7e9 463:7.2e9 467:8e9 475:1.9e10 484:8e9 485:2.1e10 493:8e9 498:4e10 501:3e10 509:1.6e10 518:5.7e10 519:5.8e10 519:5.5e10');
  const hz = P('19:7e5 23:5.1e5 43:2e6 96:5e6 123:6.1e6 159:1.6e7 163:1.6e7 187:4e7 195:2.5e7 206:3.3e7 224:6.6e7 227:6e7 227:1e8 230:2e8 234:6.7e7 234:4e7 247:1.5e8 247:3e8 254:3e8 257:9.1e7 261:2e8 263:2e8 264:9.1e7 268:5.1e8 274:2.5e8 275:5.4e8 275:2.3e8 276:3e8 288:5e8 291:3e8 292:4e8 295:4.6e8 295:5.1e8 302:7.4e8 307:1e9 311:9e8 312:2e9 317:8.1e8 318:1.4e9 324:2.2e9 328:1.8e9 329:1e9 334:1.2e9 335:2.2e9 336:1.8e9 348:2.6e9 348:1.9e9 349:3.7e9 357:3.2e9 359:2.8e9 360:1.2e9 360:2.2e9 369:3.7e9 369:2.6e9 370:2.7e9 371:2.3e9 376:2.9e9 377:4.7e9 377:4.1e9 378:2e9 380:1.4e9 382:2e9 382:2.3e9 385:3e9 392:2.5e9 393:3.3e9 394:2.6e9 397:2.6e9 397:3.3e9 402:2.3e9 412:3.5e9 413:2.4e9 419:3e9 424:3.1e9 424:2.9e9 427:3.7e9 429:2.5e9 434:1.2e9 438:2.7e9 442:2.8e9 445:3.7e9 448:3.2e9 448:2.6e9 448:2.3e9 463:2.2e9 465:1.5e9 467:4e9 475:2.2e9 476:2.1e9 476:2.5e9 484:3.4e9 485:1.2e9 493:2.7e9 498:2.3e9 501:2.9e9 502:2.7e9 509:3.2e9 513:2.3e9 518:3.2e9 519:1e9 519:2.6e9');
  const upTo = (a, y) => { let m = 0; for (const [yy, v] of a) if (yy <= y + .05 && v > m) m = v; return m; };
  return { tr, hz, upTo, END: 2021.9, LAST: 5.8e10 };
})();
INST.moore = {
  u0: (2011 - 1971) / 69, v0: 0.5,
  frame(g) {
    const { c, P, box: B } = g, x0 = B.x + 4, x1 = B.x + B.w - 4, X = y => x0 + (x1 - x0) * (y - 1970) / 71, Y = v => B.y + B.h - 14 - (B.h - 22) * (Math.log10(v) - 2) / 13;
    const year = lerp(1971, 2040, g.u), fut = year > TREND.END;
    c.fillStyle = P.ink; c.globalAlpha = .045; c.fillRect(X(TREND.END), B.y, x1 - X(TREND.END), B.h); c.globalAlpha = 1;
    c.strokeStyle = P.line; c.lineWidth = 1;
    [3, 6, 9, 12].forEach(e => { c.beginPath(); c.moveTo(x0, Y(10 ** e) + .5); c.lineTo(x1, Y(10 ** e) + .5); c.stroke(); });
    g.lab(x1 - 4, Y(1e3) - 14, 'a thousand', '', 'r'); g.lab(x1 - 4, Y(1e6) - 14, 'a million', '', 'r'); g.lab(x1 - 4, Y(1e9) - 14, 'a billion', '', 'r'); g.lab(x1 - 4, Y(1e12) - 14, 'a trillion', '', 'r');
    [1980, 2000, 2020, 2040].forEach(y => { c.beginPath(); c.moveTo(X(y) + .5, B.y + B.h - 14); c.lineTo(X(y) + .5, B.y + B.h - 8); c.stroke(); g.lab(X(y), B.y + B.h - 8, String(y), '', y === 2040 ? 'r' : 'c'); });
    c.strokeStyle = P.muted; c.lineWidth = 1; for (const [y, v] of TREND.hz) { disc(c, X(y), Y(v), 2.3); c.stroke(); }
    c.fillStyle = P.ink; for (const [y, v] of TREND.tr) { disc(c, X(y), Y(v), 2.4); c.fill(); }
    g.lab(X(1972), Y(2e9), '● transistors on one chip', 'ink'); g.lab(X(2001), Y(2.5e6), '○ the clock, ticks a second');
    /* your line, past the data */
    const D = g.v < 0.03 ? Infinity : 1 / g.v, at = y => TREND.LAST * Math.pow(2, (y - TREND.END) / D);
    c.save(); c.beginPath(); c.rect(x0, B.y, x1 - x0, B.h); c.clip();
    c.strokeStyle = P.warm; c.lineWidth = 1.8; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(X(TREND.END), Y(TREND.LAST)); c.lineTo(X(2041), Y(at(2041))); c.stroke(); c.setLineDash([]); c.restore();
    g.lab(X(2031), B.y + 2, 'not made yet', '', 'c');
    const best = fut ? at(year) : TREND.upTo(TREND.tr, year), xc = X(year);
    c.strokeStyle = P.blue; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xc + .5, B.y); c.lineTo(xc + .5, B.y + B.h - 14); c.stroke();
    if (best > 0 && Y(best) > B.y) { c.fillStyle = fut ? P.warm : P.blue; disc(c, xc, Y(best), 5); c.fill(); c.strokeStyle = P.solid; c.lineWidth = 1.5; c.stroke(); }
    const yr = Math.floor(year), every = d => (isFinite(d) ? 'every ' + (d < 10 ? d.toFixed(1) : Math.round(d)) + ' years' : 'never');
    if (fut) return { reads: [
      { v: big(best), k: 'transistors on one chip in ' + yr + ', on your line' },
      { v: every(D), k: 'how often your line doubles' },
      { v: 'nothing yet', k: 'what was really made' }] };
    const span = Math.min(10, year - 1971.9), prev = TREND.upTo(TREND.tr, year - span), r = prev ? best / prev : 1, hz = TREND.upTo(TREND.hz, year), hzp = TREND.upTo(TREND.hz, year - span), rh = hzp ? hz / hzp : 1;
    const dbl = x => (span >= 3 && x > 1.2 ? every(span / Math.log2(x)) : span < 3 ? 'too early to say' : 'stopped');
    return { reads: [
      { v: big(best), k: 'transistors on the biggest chip by ' + yr },
      { v: dbl(r), k: 'how often that count doubled, in the ten years before' },
      { v: dbl(rh), k: 'how often the clock doubled', tone: span >= 3 && rh <= 1.2 ? 'bad' : '' }] };
  }
};

/* ---- Fixed or fluid: a line you drag across a machine, and how far the work has moved on ---- */
INST.line = {
  u0: 7 / 12, v0: 0.3, hstep: 12,
  setup(S) { const r = rng(99); S.ord = Array.from({ length: 60 }, (_, i) => i); for (let i = 59; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [S.ord[i], S.ord[j]] = [S.ord[j], S.ord[i]]; } },
  frame(g, S) {
    const { c, P, box: B } = g, N = 60, cols = 12, rows = 5, G = 50, f = g.u, k = lerp(1, 0.2, g.v);
    /* sixty places, sixty jobs: the fixed places take the kinds they were built for, the fluid ones take anything */
    const F = Math.round(f * cols) * rows, L = N - F, known = Math.round(k * N), fDone = Math.min(F, known), lDone = Math.min(L, N - fDone), away = N - fDone - lDone, idle = F - fDone;
    const lKnown = Math.min(lDone, known - fDone), energy = (fDone / G + lDone) / Math.max(1, fDone + lDone);
    const qw = Math.min(B.w * .2, 150), cx = B.x + qw + 14, cw = B.w - qw - 18, cy = B.y + 22, ch = B.h - 26, pw = cw / cols, ph = ch / rows, q = Math.min(pw, ph) * .2, lx = cx + cw * F / N;
    c.fillStyle = P.ink; c.globalAlpha = .07; c.fillRect(cx, cy, lx - cx, ch); c.globalAlpha = 1;
    c.strokeStyle = P.line; c.lineWidth = 1; c.strokeRect(cx + .5, cy + .5, cw - 1, ch - 1);
    const job = (x, y, sq, st) => { c.lineWidth = 1.6; c.strokeStyle = st === 'away' ? P.red : P.ink; c.fillStyle = P.ink; c.globalAlpha = st === 'idle' ? .28 : 1;
      if (sq) c.strokeRect(x - q, y - q, 2 * q, 2 * q); else { disc(c, x, y, q * 1.12); c.stroke(); } c.globalAlpha = 1; };
    for (let n = 0; n < N; n++) { const col = (n / rows) | 0, row = n % rows, x = cx + (col + .5) * pw, y = cy + (row + .5) * ph, fixed = n < F;
      const done = fixed ? n < fDone : n - F < lDone;
      if (done) { c.fillStyle = P.warm; c.globalAlpha = fixed ? .9 : .32; disc(c, x, y, fixed ? Math.min(pw, ph) * .46 / Math.sqrt(G) : Math.min(pw, ph) * .46); c.fill(); c.globalAlpha = 1; }
      if (fixed) job(x, y, true, done ? 'done' : 'idle'); else if (done) job(x, y, n - F < lKnown, 'done'); else { c.setLineDash([3, 3]); c.strokeStyle = P.line; c.strokeRect(x - q, y - q, 2 * q, 2 * q); c.setLineDash([]); } }
    /* the jobs it had no place for */
    const ac = Math.max(1, Math.floor(qw / (2.9 * q)));
    for (let n = 0; n < away; n++) job(B.x + q * 1.6 + (n % ac) * 2.9 * q, cy + q * 1.6 + ((n / ac) | 0) * 2.9 * q, n < Math.max(0, known - fDone - lKnown), 'away');
    c.strokeStyle = P.blue; c.lineWidth = 2.5; c.beginPath(); c.moveTo(lx, cy - 6); c.lineTo(lx, cy + ch + 6); c.stroke(); c.fillStyle = P.blue; c.fillRect(lx - 5, cy + ch / 2 - 16, 10, 32);
    if (lx - cx > 60) g.lab((cx + lx) / 2, B.y, 'fixed: ' + F + ' places', 'ink', 'c'); if (cx + cw - lx > 60) g.lab((lx + cx + cw) / 2, B.y, 'fluid: ' + L + ' places', 'ink', 'c');
    g.lab(B.x, B.y, away ? 'turned away: ' + away : 'none turned away', away ? 'bad' : '');
    return { reads: [
      { v: times(energy), k: 'energy for one job, against a chip that is all fluid', tone: energy < .5 ? 'good' : '' },
      { v: pct(away / N), k: 'of the work turned away', tone: away ? 'bad' : '' },
      { v: pct(F ? idle / F : 0), k: 'of the fixed part standing idle', tone: idle > F * .25 ? 'bad' : '' }] };
  }
};
