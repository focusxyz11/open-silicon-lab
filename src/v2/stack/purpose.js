/* Propose what it is for (#481): the field's door for a new need. Dials for the power each trait is raised to and the
   level it must have, checked live by the architecture engine (src/engines/arch.js purposeWhy) with its reason shown in
   words a proposer can act on, then kept as your draft and sent with the same one link an attempt uses (the slip,
   src/v2/commons.js). Until kept, what you set stays in this browser. The proposed column it joins is drawn by the view
   (src/v2/stack/view.js); its words are sk.purpose.* in src/i18n/en/stack.json. Written by Claude Opus 5.5. */
import { t, fmtNum } from '../../core/i18n.js';
import { esc } from '../../core/esc.js';
import { A } from './model.js';

const FORM = 'osl-purpose-form';
/* the dials: a weight from 0 (not weighed) to the engine's top, a level it must have from 0 (none) to 4 times today's */
const WMAX = A.PURPOSE_W[1], MMAX = 4, STEP = 0.05;
export function blank() { return { purpose: '', name: '', what: '', w: {}, must: {} }; }
export function loadForm() { try { const f = JSON.parse(localStorage.getItem(FORM) || 'null'); if (f && typeof f === 'object' && f.w && f.must) return Object.assign(blank(), f); } catch (e) { /* nothing kept */ } return blank(); }
export function saveForm(f) { try { localStorage.setItem(FORM, JSON.stringify(f)); } catch (e) { /* not kept */ } }
export function clearForm() { try { localStorage.removeItem(FORM); } catch (e) { /* nothing kept */ } }
/* the proposal as an entry holds it: only the traits set */
export const fieldsOf = f => ({ kind: 'purpose', purpose: f.purpose.trim(), name: f.name.trim(), what: f.what.trim(), w: Object.fromEntries(Object.entries(f.w).filter(([, v]) => v > 0)), must: Object.fromEntries(Object.entries(f.must).filter(([, v]) => v > 0)), season: A.VERSION, words: '' });
/* what the engine says of it now: the reason it would be refused, or how far the best recipe could go */
export function verdict(f, ctx) {
  const p = fieldsOf(f), why = A.purposeWhy(p, ctx);
  if (why) return { ok: false, words: t('ledger.no.' + why) };
  if (p.name.length < 2 || p.what.length < 10) return { ok: false, words: t('sk.purpose.words') };
  return { ok: true, words: t('sk.purpose.ok', { p: fmtNum(+A.bestPotential(A.wantOf(p)).toPrecision(2)) }) };
}
const dial = (k, kind, v, max) => '<label class="sk-pdial"><span>' + esc(t(kind === 'w' ? 'sk.purpose.weigh' : 'sk.purpose.must')) + '</span><input type="range" min="0" max="' + max + '" step="' + STEP + '" value="' + (v || 0) + '" data-pd="' + kind + ':' + k + '" aria-label="' + esc(t('ar.tr.' + k) + ' · ' + t(kind === 'w' ? 'sk.purpose.weigh' : 'sk.purpose.must')) + '"><output>' + (v ? fmtNum(v) : '–') + '</output></label>';
/* the card: what it is, its dials, the engine's word on it, who signs it and the way to keep it (or the slip once kept) */
export function cardHtml(f, ctx, sign, slip) {
  const v = verdict(f, ctx);
  return '<div class="sk-purpose"><p class="k">' + esc(t('sk.purpose.head')) + '</p><p>' + esc(t('sk.purpose.how')) + '</p>' +
    '<div class="sk-pf"><label><span>' + esc(t('sk.purpose.id')) + '</span><input type="text" maxlength="24" data-pf="purpose" value="' + esc(f.purpose) + '" placeholder="deep-sea" spellcheck="false"></label>' +
    '<label><span>' + esc(t('sk.purpose.name')) + '</span><input type="text" maxlength="40" data-pf="name" value="' + esc(f.name) + '"></label>' +
    '<label class="wide"><span>' + esc(t('sk.purpose.what')) + '</span><textarea maxlength="300" rows="1" data-pf="what">' + esc(f.what) + '</textarea></label></div>' +
    '<div class="sk-ptraits">' + A.TRAITS.map(k => '<div class="sk-ptr"><b>' + esc(t('ar.tr.' + k)) + '</b>' + dial(k, 'w', f.w[k], WMAX) + dial(k, 'must', f.must[k], MMAX) + '</div>').join('') + '</div>' +
    '<p class="sk-pv' + (v.ok ? ' ok' : '') + '" role="status" aria-live="polite">' + esc(v.words) + '</p>' +
    (slip || ('<div class="sk-pfoot">' + sign + '<div class="acts"><button type="button" class="btn primary" data-pkeep="1"' + (v.ok ? '' : ' disabled') + '>' + esc(t('sk.purpose.keep')) + '</button><button type="button" class="btn" data-pclose="1">' + esc(t('sk.purpose.close')) + '</button></div></div>')) + '</div>';
}
/* a dial or a field changed: the form, and the words that follow it */
export function readInput(f, el) {
  if (el.dataset.pf) f[el.dataset.pf] = el.value;
  else if (el.dataset.pd) { const [kind, k] = el.dataset.pd.split(':'), v = +el.value; f[kind === 'w' ? 'w' : 'must'][k] = v; const o = el.parentNode.querySelector('output'); if (o) o.textContent = v ? fmtNum(v) : '–'; }
  return f;
}

/* the proposed column on the field: the purpose it shows (the open need now, else the latest), how each recipe could do at
   it once polished, and how far the best attempt at each recipe has come */
export function columnOf(P, POP) {
  const all = (P && P.all) || []; if (!all.length) return null;
  const e = (P.open && all.find(x => x.id === P.open)) || all[all.length - 1], want = A.wantOf(e);
  const best = new Map();
  for (const a of POP) { const s = A.scoreFor(a.st, want); if (!best.has(a.key) || s.now > best.get(a.key).now) best.set(a.key, { now: s.now, a }); }
  return { e, want, open: P.open === e.id, more: all.length - 1, all, best };
}
/* the column's words: its name, who proposed it, and whether it is won or the open need now */
export function columnWords(col, who) {
  const e = col.e, by = e.draft ? t('sk.purpose.yours') : e.wonBy ? t('sk.purpose.won', { who: who(e.wonBy), by: e.by }) : t('sk.purpose.by', { who: e.by });
  return { kick: t('sk.purpose.col'), head: e.name, sub: by, open: col.open ? t('sk.purpose.open') : '', more: col.more > 0 ? t('sk.purpose.more', { n: col.more }) : '' };
}
