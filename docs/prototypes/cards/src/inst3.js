/* ---- Fight or use physics: the same sum kept exact, or left to physical law ---- */
INST.physics = {
  u0: 0.34,
  setup(S) { const r = rng(5); S.sm = Array.from({ length: 90 }, () => ({ tv: Math.round(r() * 255), u: Array.from({ length: 8 }, () => r()), z: gauss(r) })); },
  frame(g, S) {
    const { c, P, box: B } = g, sig = lerp(0.02, 0.5, g.u), pf = 0.5 * erfc(0.5 / (sig * Math.SQRT2));
    /* exact logic: a bit flips when the noise crosses half its swing. Physics: the whole answer drifts with the noise */
    const sm = S.sm.map(s => { let dv = s.tv, flips = 0; s.u.forEach((u, k) => { if (u < pf) { dv ^= 1 << k; flips |= 1 << k; } }); return { tv: s.tv, dv, flips, d: (dv - s.tv) / 255, a: sig * s.z }; });
    const gw = Math.min(150, B.w * .26), sx = B.x + gw + 14, sw = B.w - gw - 18, rowH = B.h / 2, cur = sm[sm.length - 1], stepX = sw / 89;
    [0, 1].forEach(row => {
      const y0 = B.y + row * rowH, mid = y0 + rowH / 2 + 8, amp = rowH / 2 - 26;
      c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, mid + .5); c.lineTo(sx + sw, mid + .5); c.stroke();
      sm.forEach((s, i) => { const e = row ? s.a : s.d, cl = clamp(e, -.5, .5), bad = !row && s.flips;
        c.globalAlpha = .85; c.fillStyle = bad ? P.red : P.ink; disc(c, sx + i * stepX, mid - cl / .5 * amp, bad ? 3.6 : 2.6); c.fill(); });
      c.globalAlpha = 1;
    });
    const q = Math.min(13, (gw - 8) / 8 - 3), by = B.y + rowH / 2 + 8 - q / 2;
    for (let k = 7; k >= 0; k--) { const x = B.x + 2 + (7 - k) * (q + 3), on = (cur.dv >> k) & 1, fl = (cur.flips >> k) & 1;
      c.strokeStyle = fl ? P.red : P.ink; c.fillStyle = fl ? P.red : P.ink; c.lineWidth = 1.3; on ? c.fillRect(x, by, q, q) : c.strokeRect(x + .5, by + .5, q - 1, q - 1); }
    const my = B.y + rowH * 1.5 + 8, jx = B.x + gw * .62, val = clamp(cur.tv / 255 + cur.a, .04, 1.2);
    c.strokeStyle = P.ink; c.globalAlpha = .55; c.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) { const yy = my + (i - 3.5) * Math.min(9, (rowH - 30) / 8); c.beginPath(); c.moveTo(B.x + 2, yy); c.bezierCurveTo(B.x + gw * .35, yy, B.x + gw * .4, my, jx, my); c.stroke(); }
    c.globalAlpha = 1; c.lineWidth = 2 + val * 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(jx, my); c.lineTo(B.x + gw - 4, my); c.stroke(); c.lineCap = 'butt';
    g.lab(B.x, B.y - 18, 'kept exact: eight bits', 'ink'); g.lab(B.x, B.y + rowH - 18, 'left to physics: currents joining', 'ink');
    g.lab(sx + sw, B.y - 18, 'ninety answers, against the right one', '', 'r');
    const eD = pf, eA = sig * Math.sqrt(2 / Math.PI);
    return { reads: [
      { v: eD < 1e-7 ? 'exactly right' : 'off by ' + (eD < .001 ? pct(eD, 3) : pct(eD, 1)), k: 'exact logic, on average, for 1 unit of energy', tone: eD < 1e-7 ? 'good' : '' },
      { v: 'off by ' + pct(eA, 1), k: 'physics, on average, for 0.13 of that energy' }] };
  }
};

/* ---- Beyond computation: one row, one rule of eight bits ---- */
INST.nat = {
  u0: 110 / 255, hstep: 255,
  setup(S) { S.rule = -1; },
  frame(g, S) {
    const { c, P, box: B } = g, rule = Math.round(g.u * 255), cs = B.w < 480 ? 4 : 5, cols = Math.floor(B.w / cs), topH = 34, vis = Math.floor((B.h - topH) / cs), LIMIT = 3000;
    if (rule !== S.rule || cols !== S.cols || vis !== S.vis) { const r = rng(3); S.rule = rule; S.cols = cols; S.vis = vis; S.cur = Uint8Array.from({ length: cols }, () => (r() < .5 ? 1 : 0)); S.rows = [S.cur]; S.seen = new Map(); S.gen = 0; S.verdict = null; }
    const next = () => { const a = S.cur, b = new Uint8Array(cols); let all = 1;
      for (let i = 0; i < cols; i++) { b[i] = (rule >> ((a[(i + cols - 1) % cols] << 2) | (a[i] << 1) | a[(i + 1) % cols])) & 1; if (b[i] !== b[0]) all = 0; }
      S.cur = b; if (S.rows.length < vis) S.rows.push(b); S.gen++;
      if (!S.verdict) { const key = String.fromCharCode.apply(null, b), was = S.seen.get(key); if (was != null) S.verdict = { from: was, period: S.gen - was, all }; else S.seen.set(key, S.gen); } };
    /* the picture is the first rows; the rule runs on, unseen, to learn whether it ever repeats */
    let n = 0; while ((S.rows.length < vis || (!S.verdict && S.gen < LIMIT)) && n++ < 500) next();
    if (!S.verdict && S.gen < LIMIT) g.again();
    c.fillStyle = P.ink; c.globalAlpha = .88;
    S.rows.forEach((a, j) => { const y = B.y + topH + j * cs; let s = -1;
      for (let i = 0; i <= cols; i++) { if (i < cols && a[i]) { if (s < 0) s = i; } else if (s >= 0) { c.fillRect(B.x + s * cs, y, (i - s) * cs - .6, cs - .6); s = -1; } } });
    c.globalAlpha = 1;
    const q = 6.5, tw = 3 * q + 9;
    for (let m = 7; m >= 0; m--) { const x = B.x + 2 + (7 - m) * tw, on = (rule >> m) & 1;
      for (let k = 0; k < 3; k++) { const b = (m >> (2 - k)) & 1; c.strokeStyle = P.muted; c.lineWidth = 1; c.fillStyle = P.muted; b ? c.fillRect(x + k * q, B.y, q - 1, q - 1) : c.strokeRect(x + k * q + .5, B.y + .5, q - 2, q - 2); }
      c.strokeStyle = P.warm; c.fillStyle = P.warm; c.lineWidth = 1.4; on ? c.fillRect(x + q - .5, B.y + q + 3, q, q) : c.strokeRect(x + q, B.y + q + 3.5, q - 1, q - 1); }
    const v = S.verdict, say = v ? (v.period === 1 ? (v.all ? 'one colour from row ' + comma(v.from) : 'stands still from row ' + comma(v.from)) : 'repeats every ' + comma(v.period) + ' rows') : 'no repeat in ' + comma(S.gen) + ' rows';
    return { reads: [
      { v: 'rule ' + rule, k: 'the rule you chose, of 256' },
      { v: say, k: v ? 'what it does from this start' : 'what it does from this start, as far as it was run', tone: v ? '' : 'bad' }] };
  }
};

/* ---- Geometry: close to talk, apart to stay cool ---- */
INST.geo = {
  u0: 0.4, v0: 0.4,
  setup(S) { const r = rng(12); S.lf = Array.from({ length: 600 }, () => r()); S.msg = Array.from({ length: 34 }, () => ({ k: Math.floor(r() * 300) * 2, p: r() })); },
  frame(g, S) {
    const { c, P, box: B } = g, N = Math.round(lerp(150, 600, g.v)), s = lerp(0.7, 1.4, g.u), N0 = 330, s0 = 0.98;
    const Rm = Math.min(B.w, B.h) / 2 - 4, R = Rm * (s / 1.4) * Math.sqrt(N / 600), cx = B.x + B.w / 2, cy = B.y + B.h / 2;
    const trip = s * Math.sqrt(N) / (s0 * Math.sqrt(N0)), heat = Math.sqrt(N) / s / (Math.sqrt(N0) / s0);
    const pt = k => { const rr = R * Math.sqrt((k + .5) / N), th = k * 2.399963; return [cx + rr * Math.cos(th), cy + rr * Math.sin(th), rr]; };
    const hot = clamp((heat - .55) / 1.9); if (hot > 0) { const G = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25); G.addColorStop(0, P.red); G.addColorStop(1, 'transparent'); c.globalAlpha = hot * .75; c.fillStyle = G; disc(c, cx, cy, R * 1.25); c.fill(); c.globalAlpha = 1; }
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = .1; c.beginPath();
    for (let k = 0; k < N; k += 2) { const a = pt(k), b = pt(Math.floor(S.lf[k] * N)); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
    const rd = clamp(R / Math.sqrt(N) * .5, 1.1, 4.2);
    for (let k = 0; k < N; k++) { const p = pt(k), T = heat * (1 - .55 * (p[2] / R) ** 2); c.globalAlpha = .8; c.fillStyle = P.ink; disc(c, p[0], p[1], rd); c.fill(); const o = clamp((T - .9) / 1.3); if (o > 0) { c.globalAlpha = o; c.fillStyle = P.red; c.fill(); } }
    /* a few of the trips a message makes */
    c.globalAlpha = .9; c.fillStyle = P.blue; c.strokeStyle = P.blue; c.lineWidth = 1.4;
    for (let j = 0; j < 12; j++) { const k = (j * 46) % N - ((j * 46) % N) % 2, a = pt(k), b = pt(Math.floor(S.lf[k] * N)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); disc(c, a[0], a[1], 2.6); c.fill(); disc(c, b[0], b[1], 2.6); c.fill(); }
    c.globalAlpha = 1;
    return { reads: [
      { v: times(trip), k: 'the average trip between parts', tone: trip > 1.25 ? 'bad' : '' },
      { v: times(heat), k: 'the hottest spot', tone: heat > 1.25 ? 'bad' : '' },
      { v: comma(N), k: 'parts' }] };
  }
};

/* ---- Brain or copy: where a mind is kept (evaluate of src/engines/mortal.js: learned on the chip, no relearning) ---- */
INST.copy = {
  u0: 0.35,
  setup(S) { const r = rng(31), G = 10; S.G = G; S.w = []; for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) S.w.push(clamp(.5 + .42 * Math.sin(i * .8 + 1) * Math.cos(j * .65 + .4) + .12 * (r() - .5), .06, 1));
    S.order = S.w.map((_, i) => i); for (let i = S.order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [S.order[i], S.order[j]] = [S.order[j], S.order[i]]; }
    S.rank = []; S.order.forEach((k, i) => { S.rank[k] = i; }); S.q = [0, 1, 2, 3].map(() => S.w.map(() => gauss(r))); },
  frame(g, S) {
    const { c, P, box: B } = g, f = g.u, G = S.G, nA = Math.round(f * G * G);
    const acc = l => Math.max(50, Math.round((98 - l) * 10) / 10), n2 = (f * .1) ** 2, energy = 1 - f + f * .13, own = acc(120 * n2), copied = acc(2000 * n2);
    const L = Math.min(B.h - 34, B.w * .44), x0 = B.x + 4, y0 = B.y + 20, gap = Math.max(18, B.w * .07), M = (L - 16) / 2, x1 = x0 + L + gap + Math.max(0, (B.w - L - gap - 2 * M - 16 - 8) / 2);
    const grid = (x, y, sz, q) => { const cs = sz / G;
      for (let k = 0; k < G * G; k++) { const cx = x + (k % G + .5) * cs, cy = y + ((k / G | 0) + .5) * cs, an = S.rank[k] < nA; let w = S.w[k], d = 0;
        if (an && q) { d = .1 * Math.SQRT2 * q[k] * 1.5; w = clamp(w + d, 0, 1); } else if (an && !g.still) w = clamp(w + .035 * Math.sin(g.t * 2.2 + k), 0, 1);
        c.globalAlpha = .1 + .82 * w; c.fillStyle = P.ink;
        if (an) { disc(c, cx, cy, cs * .43); c.fill(); if (q) { c.globalAlpha = clamp(Math.abs(d) * 3.2); c.fillStyle = P.red; c.fill(); } } else c.fillRect(cx - cs * .4, cy - cs * .4, cs * .8, cs * .8); }
      c.globalAlpha = 1; };
    grid(x0, y0, L, null);
    [0, 1, 2, 3].forEach(i => grid(x1 + (i % 2) * (M + 16), y0 + (i >> 1) * (M + 16), M, S.q[i]));
    g.lab(x0, B.y - 18, 'this chip', 'ink'); g.lab(x1, B.y - 18, 'the same mind, copied to four other chips', 'ink');
    return { reads: [
      { v: times(energy), k: 'energy for one answer, against all bits', tone: energy < .5 ? 'good' : '' },
      { v: own.toFixed(1) + '%', k: 'right answers on this chip' },
      { v: copied.toFixed(1) + '%', k: 'right answers on a copy', tone: copied < 90 ? 'bad' : '' }] };
  }
};

/* ---- Only humans: a thousand designs that all pass (stand-in for src/engines/thousand.js) ---- */
const SIDES = ['its users', 'the people who repair it', 'the people who pay for it', 'the planet', 'the limits it must keep'];
INST.human = {
  u0: 0.55,
  setup(S) { const r = rng(2026); S.d = Array.from({ length: 1000 }, () => ({ L: [r(), r(), r(), r(), r()], s: 100 - Math.abs(gauss(r)) * 1.1 })); S.keep = -1; S.hov = -1; S.lay = null; },
  at(x, y, S) { const l = S.lay; if (!l || x < l.x0 || y < l.y0) return -1; const i = Math.floor((x - l.x0) / l.cell), j = Math.floor((y - l.y0) / l.cell), k = j * l.cols + i; return i < l.cols && k < l.N ? k : -1; },
  hover(x, y, S) { S.hov = this.at(x, y, S); },
  tap(x, y, S) { const k = this.at(x, y, S); if (k >= 0) S.keep = S.keep === k ? -1 : k; },
  frame(g, S) {
    const { c, P, box: B } = g, N = Math.max(1, Math.round(Math.pow(10, 3 * g.u))), cols = Math.ceil(Math.sqrt(N * B.w / B.h)), rows = Math.ceil(N / cols), cell = Math.min(B.w / cols, B.h / rows, 190);
    const x0 = B.x + (B.w - cell * cols) / 2, y0 = B.y + (B.h - cell * rows) / 2; S.lay = { x0, y0, cell, cols, N };
    let best = 0; for (let k = 0; k < N; k++) best = Math.max(best, S.d[k].s); let near = 0;
    for (let k = 0; k < N; k++) { const d = S.d[k], cx = x0 + (k % cols + .5) * cell, cy = y0 + ((k / cols | 0) + .5) * cell, R = cell * .44, kept = k === S.keep, hov = k === S.hov; if (d.s >= best - 1) near++;
      c.beginPath(); for (let j = 0; j < 5; j++) { const a = -Math.PI / 2 + j * TAU / 5, rr = R * (.28 + .72 * d.L[j]); j ? c.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)) : c.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a)); } c.closePath();
      c.globalAlpha = kept ? .4 : .08; c.fillStyle = kept ? P.warm : P.ink; c.fill();
      c.globalAlpha = kept || hov ? 1 : cell < 14 ? .5 : .7; c.strokeStyle = kept ? P.warm : hov ? P.blue : P.ink; c.lineWidth = kept || hov ? 2 : cell < 14 ? .7 : 1.1; c.stroke(); }
    c.globalAlpha = 1;
    const lean = k => { const L = S.d[k].L; let hi = 0, lo = 0; L.forEach((v, j) => { if (v > L[hi]) hi = j; if (v < L[lo]) lo = j; }); return 'It gives most to ' + SIDES[hi] + ' and least to ' + SIDES[lo] + '.'; };
    const kept = S.keep >= 0 && S.keep < N, show = S.hov >= 0 && S.hov < N ? S.hov : -1;
    return { reads: [
      { v: comma(N), k: N === 1 ? 'design that passes every check' : 'designs that pass every check' },
      { v: comma(near), k: 'of them score within 1% of the best' },
      { v: kept ? 'design ' + (S.keep + 1) : 'none yet', k: 'kept by you', tone: kept ? 'good' : '' }],
      cap: kept ? 'You kept design ' + (S.keep + 1) + '. ' + lean(S.keep) + ' No check can say why this one. In the lab your reason is kept with it.'
        : show >= 0 ? 'Design ' + (show + 1) + ' scores ' + S.d[show].s.toFixed(1) + '. ' + lean(show) + ' Tap to keep it.' : CARDS.human.cap };
  }
};
