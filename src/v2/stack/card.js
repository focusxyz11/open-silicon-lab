/* The card of Your stack (#447, docs/PATH.md "The frame and the card", docs/SYSTEM.md "One frame, three modes"): the
   stack wears the lab's one frame and card (src/v2/frame.js, worn by src/v2/frame2.js) the same way every view does, in
   the same homes (#433): Look is the stack, its caption at the bottom left (on a phone the sheet at the foot); Do is a
   rung's challenge played on its plate, the rung's controls (.sk-ctl, kept by the view) the card's Do face in the side
   panel at the right; Ask is one question opened alone from its mark, in the same panel; Read is #/read, the question
   in the caption. The thirteen are met only as marks on the plates (the view draws them, at most three while you look);
   no row of their names anywhere.
   Written by Claude Opus 5.5 in the nightly build, on the frame by the lab's earlier builds.

   wear(V, host, view, { stones }) -> card: makes the frame in a section of the view's host and returns what the view
   asks of it ({ level(key), mode(), inset(), mark(m), putDown(), changed() }, see src/v2/stack/view.js). key is where
   you are: 'field', 'stack' (your stack, whole) or a rung id. Along turns the plates to a face (#456): the caption then
   says the rung as designed or made (view.seen), and Do is that face's controls, the studio's or the line's steps,
   kept by the view in the same .sk-ctl (turned()). */
import { t } from '../../core/i18n.js';
import { esc } from '../../core/esc.js';
import { phone } from '../../core/ui.js';
import { mark as fidMark, statusMark } from '../fid.js';
import { questionOf } from '../../engines/frame.js';
import { EXPERIMENTS, levelsOf } from '../../engines/experiments.js';
import { askOf } from '../read.js';
import { RUNG_LENS } from '../../data/frame.js';
import { RUNGS, rungName } from './model.js';

const isRung = k => RUNGS.includes(k);
const nameOf = k => (isRung(k) ? rungName(k) : k === 'field' ? t('sk.rail.field') : t('sk.title'));
/* the face the plates are turned to, said after the name; as used, nothing (the stack as before) */
const faceOf = view => (view.face ? view.face() : 'use'), asFace = view => (faceOf(view) === 'use' ? '' : ' · ' + t('sk.face.' + faceOf(view)));
const seenOf = (view, sh, r) => (view.seen ? view.seen(r) : { way: sh.Y.V.way[r], figs: sh.Y.V.fig[r] || [], fid: sh.Y.V.fid[r], dead: RUNGS.indexOf(r) > sh.Y.V.dead });
/* a rung's reading page: the first experiment that runs through its levels (#/read/<id>); the stack's, every one */
const readOf = k => { const x = isRung(k) ? EXPERIMENTS.find(e => levelsOf(e).some(l => RUNG_LENS[k].includes(l))) : null; return x ? { href: '#/read/' + x.id, q: askOf(x) } : { href: '#/read', q: t('sk.card.read') }; };

/* reached from the first page (#524): Hold's last block marks the way in (src/v2/holdisle.js, osl-stack-from), read once
   when the stack opens. The stack is then not filed as one place of the island: its way up and its path lead back to
   the first page, the loop in the bar lights no stage, and it opens on the ladder alone (the genes, fifty years of
   polish and the agents one step away) */
const FROM = 'osl-stack-from', DO = 'osl-stack-do';
/* reached from a challenge of Grow an architecture (its door, src/v2/labs/arch.js): the stack opens on its Do (#450) */
const toGrow = () => { try { const f = sessionStorage.getItem(DO) === 'grow'; sessionStorage.removeItem(DO); return f; } catch (e) { return false; } };
const fromFirst = () => { try { const f = sessionStorage.getItem(FROM) === 'first'; sessionStorage.removeItem(FROM); return f; } catch (e) { return false; } };

export function wear(V, host, view, o = {}) {
  const el = document.createElement('section'); el.className = 'placeui skframe'; host.appendChild(el);
  let key = null, fr = null, first = false, ladder = false;
  const LAB = { up: { href: '#/place/lab', label: t('map.lab.t') }, path: [{ href: '#/island', label: t('place.back') }, { href: '#/place/lab', label: t('map.lab.t') }, { label: t('sk.title') }] };
  const FIRST = { up: { href: '#/', label: t('frame2.backFirst') }, path: [{ href: '#/', label: t('frame2.backFirst') }, { href: '#/', label: t('frame2.backFirst') }, { label: t('sk.title') }] };
  const opts = { up: LAB.up, path: LAB.path.slice() };
  /* the lens open, at a rung: from the stack whole, the rung its mark stands on */
  const rungOf = (q, k) => (isRung(k) ? k : ((view.marksAt('stack').find(m => m.id === q) || {}).rung || null));
  const markOf = (q, k) => { const r = rungOf(q, k); return r ? view.markOf(r, q) : null; };
  /* the questions that live here: the marks on the plates; with one opened, also those its card offers to hold with it
     (the lenses of the lab's level it is read at), so two can be held (#449) */
  const lensOf = id => ({ id, label: t('frame.q.' + id), hint: t('frame.q.' + id + '.hint'), icon: questionOf(id).icon });
  const lensesAt = k => {
    if (k === 'field') return [];
    const ids = view.marksAt(k, 6).map(m => m.id), open = fr && fr.lens ? fr.lens() : null;
    if (open && ids.includes(open) && V.lensIds) { const m = markOf(open, k), lv = m ? m.level : labLevel(rungOf(open, k)); if (lv) V.lensIds(lv).forEach(x => { if (!ids.includes(x)) ids.push(x); }); }
    return ids.map(lensOf);
  };
  /* each rung's challenge, played on its plate; then the lab's challenges on it, its stepping stones */
  const goalOf = r => ({ id: 'rung-' + r, title: t('sk.do.' + r), where: rungName(r), href: '#/stack/' + r });
  const doAt = k => (k === 'stack' ? RUNGS.slice().reverse().map(goalOf) : isRung(k) && view.mine() ? [goalOf(k)].concat(o.stones(k).map(x => ({ id: x.id, title: x.title, where: rungName(k), href: x.href }))) : []);
  /* a level of the lab where the rung's questions live, for what the frame already knows there */
  const labLevel = k => (isRung(k) ? RUNG_LENS[k][0] : null);

  /* Look: the caption. What you are looking at in one sentence, the question it opens (its reading page), Read more and
     Do; under Read more the rest (the figures, how true, the rungs) */
  function look() {
    const sh = view.shown(), k = key || 'stack', R = read(k);
    let h = '<p class="kicker">' + esc(nameOf(k) + (k === 'field' ? '' : asFace(view))) + '</p>';
    if (!isRung(k)) {
      h += '<p class="line">' + esc(view.rest() + (k === 'stack' ? ' ' + t('sk.card.stack') : '')) + '</p>' + R;
      if (k === 'stack' && ladder) h += '<button type="button" class="chipb sk-whole" data-skwhole>' + esc(t('sk.dock.today')) + ' →</button>';
      if (k === 'stack' && sh) h += '<p class="kicker">' + esc(t('sk.card.rungs')) + '</p><div class="sk-rungs">' + RUNGS.map((r, i) => ({ r, i })).reverse().map(({ r, i }) => '<button type="button" class="chipb" data-rung="' + i + '"><b>' + esc(rungName(r)) + '</b> <span>' + esc(seenOf(view, sh, r).way || t('sk.tag.cannot')) + '</span></button>').join('') + '</div>';
    } else {
      const S0 = seenOf(view, sh, k), figs = S0.figs, dead = S0.dead, f = S0.fid;
      const line = dead ? t('sk.card.dead') : S0.why ? S0.why : t(k === 'mind' ? 'sk.card.mind' : 'sk.card.rung', { way: S0.way || rungName(k), up: k === 'mind' ? '' : rungName(RUNGS[RUNGS.indexOf(k) + 1]).toLowerCase(), figs: figs.slice(0, 2).map(x => (x[1] ? x[1] + ' ' : '') + x[0]).join(', ') });
      h += '<p class="line">' + esc(line) + '</p>' + R;
      if (figs.length) h += '<dl class="sk-figs">' + figs.map(x => '<dt>' + esc(x[0]) + '</dt><dd' + (x[2] ? ' class="bad"' : '') + '>' + esc(x[1]) + '</dd>').join('') + '</dl>';
      if (f && !dead) h += '<p class="small sk-fidl">' + (f.status === 'guess' ? statusMark('guess') : fidMark(f)) + '</p>';
    }
    fr.dock.innerHTML = h;
  }
  const read = k => { const r = readOf(k); return '<a class="askline" href="' + esc(r.href) + '"><span class="q">' + esc(r.q) + '</span></a>'; };

  /* Do for the whole stack (#450): Grow an architecture, played here, its two challenges, the curve, the attempt kept
     and the family tree (src/v2/stack/grow.js); the rungs' own challenges under them */
  function growFace() {
    fr.doing();
    fr.dock.innerHTML = '<div class="player sk-do sk-growd"><p class="kicker">' + esc(t('frame.doAt', { level: t('sk.title') })) + '</p><h3>' + esc(t('sk.grow.t')) + '</h3>' + view.growHtml() +
      '<p class="kicker">' + esc(t('sk.card.rungs')) + '</p><div class="dolist">' + RUNGS.slice().reverse().map(r => '<a class="dochip" href="#/stack/' + r + '"><b>' + esc(t('sk.do.' + r)) + '</b><span class="small muted">' + esc(rungName(r)) + '</span></a>').join('') + '</div>' +
      '<div class="nav"><button type="button" class="btn ghost" data-mode="look">' + esc(t('frame.backToLook')) + '</button></div></div>';
    return true;
  }
  /* Do: the rung's challenge on its plate, its controls in the card */
  function doFace() {
    if (key === 'stack' && view.mine() && view.growHtml) return growFace();
    if (!isRung(key) || !view.mine()) return false;
    fr.doing();
    const d = fr.dock;
    d.innerHTML = '<div class="player sk-do"><p class="kicker">' + esc(t('frame.doAt', { level: rungName(key) })) + '</p><h3>' + esc(faceOf(view) === 'use' ? t('sk.do.' + key) : (s0 => (s0.why ? t('sk.face.' + faceOf(view)) + ': ' + s0.way : t('sk.face.do.' + faceOf(view))))(view.seen(key))) + '</h3></div>';
    d.firstChild.appendChild(view.ctl);
    d.firstChild.insertAdjacentHTML('beforeend', '<div class="nav"><button type="button" class="btn ghost" data-mode="look">' + esc(t('frame.backToLook')) + '</button></div>');
    return true;
  }

  /* the lens opened alone: what it is on your stack (when what you built raised it), then the lab's card of it, at the
     level of the lab it lives at */
  function lensCard(q, k) {
    const m = markOf(q, k), lv = m ? m.level : labLevel(rungOf(q, k)) || 'chip';
    return (m && m.here ? '<p class="sk-here"><b>' + esc(t('sk.card.here', { rung: rungName(m.rung) })) + '</b> ' + esc(m.here) + '</p>' : '') + V.lensCard(q, lv);
  }

  fr = V.frameOf(el, Object.assign(opts, {
    caption: true, levelName: nameOf,
    marksAt: () => [], lensesAt, lensCard,
    /* two lenses held (#449): the pair's shape on your stack first (a chain, a fork with its line, the front of two
       needs: view.pairHtml), then the lab's card of the pair */
    pairCard: (a, b, k) => { const m = markOf(a, k); return (view.pairHtml ? view.pairHtml(a, b) : '') + V.pairCard(a, b, m ? m.level : labLevel(rungOf(a, k)) || 'chip'); },
    onLens: (q, k, p) => { const r = q ? rungOf(q, k) : null; view.setLens(r ? { rung: r, id: q, pair: p || null } : null); },
    onLook: look,
    doAt,
    askAt: () => [], fieldAt: () => [], askedAt: () => ''
  }));
  /* filed where it was reached from: the way up, the path and the caption's place (the frame reads opts.path[1]) */
  function file() {
    const F = first ? FIRST : LAB, up = el.querySelector('.homebtn'), crumbs = el.querySelector('.crumbs2');
    opts.up = F.up; opts.path.splice(0, opts.path.length, ...F.path);
    if (up) { up.setAttribute('href', F.up.href); up.setAttribute('aria-label', F.up.label); }
    if (crumbs) crumbs.innerHTML = F.path.slice(first ? 2 : 1).map((p, i) => (i ? '<span aria-hidden="true">›</span>' : '') + (p.href ? '<a href="' + esc(p.href) + '">' + esc(p.label) + '</a>' : '<b>' + esc(p.label) + '</b>')).join('');
    if (first && crumbs) crumbs.insertAdjacentHTML('afterbegin', '<a href="#/">' + esc(t('frame2.backFirst')) + '</a><span aria-hidden="true">›</span>');
    unlit();
  }
  /* the loop in the bar lights no stage while the stack is reached from the first page: it is not the Lab's Use */
  const loop = document.getElementById('loop');
  const unlit = () => { if (first && !el.hidden && loop) loop.querySelectorAll('[data-stage][aria-current]').forEach(b => b.removeAttribute('aria-current')); };   /* i18n-ok: a selector */
  if (loop && typeof MutationObserver === 'function') new MutationObserver(unlit).observe(loop, { childList: true, subtree: true });
  /* the ladder alone: the genes and the dock (fifty years of polish, the agents) wait one step away */
  const parts = () => [host.querySelector('.sk-genes'), host.querySelector('.sk-dock')].filter(Boolean);
  const showWhole = on => { parts().forEach(p => { p.style.display = on ? '' : 'none'; }); again(); };
  el.addEventListener('click', e => { if (!e.target.closest('[data-skwhole]')) return; ladder = false; showWhole(true); look(); });
  window.addEventListener('hashchange', () => { if (/^#\/stack(\/|$)/.test(location.hash)) return; if (first || ladder) { first = false; ladder = false; showWhole(true); file(); } });
  /* Do at a rung is its controls, whichever way it is asked for: the tab, the caption's Do, a goal of the stack's */
  el.addEventListener('click', e => {
    const d = e.target.closest('.modes3 [data-mode="do"], .f2acts .f2do'); if (!d || !(isRung(key) || key === 'stack')) return;
    if (doFace()) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  /* the card's home or size changed: the camera frames the stack in the room it leaves */
  const wrap = el.querySelector('.dockwrap'), again = () => requestAnimationFrame(() => view.reframe());
  new MutationObserver(again).observe(el, { attributes: true, attributeFilter: ['class'] });
  if (typeof ResizeObserver === 'function') new ResizeObserver(again).observe(wrap);

  return {
    level(k) {
      const came = fromFirst(); if (came) { first = true; ladder = true; }
      /* the camera comes in over the field to the stack: the ladder holds until a rung is opened */
      if (isRung(k) && ladder) { ladder = false; showWhole(true); }
      if (came || first) { showWhole(!ladder); file(); }
      if (k === key) return;
      const was = key; key = k; el.hidden = false;
      fr.level(k);
      /* reached from a challenge of Grow an architecture: its Do, at once */
      if (k === 'stack' && view.mine() && toGrow()) doFace();
      /* reached out and up from the dive's chip: what the rung is, first; its controls one tap away */
      else if (isRung(k) && view.rose && view.rose()) { view.ctl.remove(); fr.look(); if (el.peekDown) el.peekDown(); }
      /* a rung opened is played: its controls in hand. Leaving it, back to Look */
      else if (isRung(k) && view.mine() && (!isRung(was) || fr.mode() === 'do')) doFace();
      /* out on the field, every attempt: no question opened, the caption says where you stand */
      else if (k === 'field') { fr.look(); if (el.peekDown) el.peekDown(); }
      else if (fr.mode() !== 'ask') { fr.look(); if (el.peekDown) el.peekDown(); }   /* on a phone the sheet folds to its peek, giving the picture back */
    },
    mode: () => (fr ? fr.mode() : 'look'), key: () => key,
    inset() {
      const w = wrap.getBoundingClientRect(), H = host.getBoundingClientRect();
      if (el.hidden || !w.width) return { l: 0, r: 0, b: 0 };
      /* a phone: the picture is framed for the sheet at its peek, so it never jumps when the sheet opens over it; a rung
         being played stands above the sheet that holds its controls */
      if (phone()) return { l: 0, r: 0, b: fr.mode() === 'do' ? Math.max(0, H.bottom - w.top) : fr.restH() + 10 };
      if (el.classList.contains('f2side')) return { l: 0, r: Math.max(0, H.right - w.left), b: 0 };
      return { l: 0, r: 0, b: 0, capW: w.right - H.left, capH: H.bottom - w.top };
    },
    /* a mark tapped: its lens opened alone (tapped again, put down) */
    mark(m) { if (fr.lens() === m.id) fr.look(); else fr.ask(m.id); },
    putDown() { if (fr.mode() === 'ask') fr.look(); },
    /* the plates turned to another face: Do holds that face's controls, the caption says it */
    turned() { if (fr.mode() === 'do' && isRung(key)) doFace(); else if (fr.mode() === 'look') fr.look(); },
    /* what you built changed: the question opened says what it is now; Grow an architecture shows where it stands */
    changed() { if (fr.mode() === 'ask') fr.level(key); else if (fr.mode() === 'look') fr.look(); else if (fr.mode() === 'do' && key === 'stack') doFace(); },
    hide() { el.hidden = true; key = null; }
  };
}
