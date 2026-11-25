/* The commons in the chip world: how something you did becomes an entry of the ledger (src/engines/ledger.js),
   and how the ledger is read on a page. Shared by the challenge player, a question's dock and the Build page.

   An entry of yours is first a draft, kept in your browser (S.drafts) and drawn on the island as yours. The slip
   says what the check found and gives the one link that opens it on GitHub as a new file in a pull request: no
   account with the lab, no server. Until it is merged only you see it, and the slip says so. */
import { esc } from '../core/esc.js';
import { t } from '../core/i18n.js';
import { draft, tryEntry, fileOf, proposeUrl, ledger } from '../engines/ledger.js';

const MADE = ['person', 'ai', 'both'], USE = { person: 'you', ai: 'ai', both: 'both' };

/* who signs: a name, and who made it. How AI was used starts as one of three plain sentences (the file can say more). */
export function signHtml(S, made) {
  return '<div class="sign"><label><span class="kicker">' + esc(t('ledger.sign.name')) + '</span><input type="text" data-sign maxlength="40" autocomplete="nickname" value="' + esc(S.name || '') + '" placeholder="' + esc(t('ledger.sign.ph')) + '"></label>' +
    '<label><span class="kicker">' + esc(t('ledger.sign.made')) + '</span><select data-made>' + MADE.map(k => '<option value="' + k + '"' + (k === (made || 'person') ? ' selected' : '') + '>' + esc(t('build.aiUse.' + USE[k])) + '</option>').join('') + '</select></label></div>';
}
export const signOf = el => { const n = el.querySelector('[data-sign]'), m = el.querySelector('[data-made]'); return { by: n ? n.value.trim() : '', made: m ? m.value : 'person' }; };

/* make a draft from what was done, check it against the ledger and your other drafts, and keep it if it passes */
export function keep(S, fields, name, sign) {
  const made = MADE.includes(sign.made) ? sign.made : 'person';
  const e = draft(Object.assign({}, fields, { by: sign.by, made, ai: made === 'person' ? '' : t('build.aiUse.' + USE[made]) }), sign.by + ' ' + name);
  Object.keys(e).forEach(k => { if (e[k] == null) delete e[k]; });
  const mine = (S.drafts || []).filter(d => !ledger().some(x => x.id === d.id));
  const r = tryEntry(e, mine);
  if (r.ok) { S.name = sign.by; S.drafts = mine.concat(e); }
  return { ok: r.ok, e, r };
}
export const refusal = r => t('ledger.no.' + r.reason, { n: r.wrong || 0, of: r.of || 0 });
export const draftOf = (S, id) => (S.drafts || []).find(d => d.id === id) || null;
const merged = id => ledger().some(x => x.id === id);

/* the slip of an entry of yours: what it is, where it stands, and the way into the ledger */
export function slipHtml(S, id) {
  const e = draftOf(S, id); if (!e) return '';
  const f = fileOf(e), inLedger = merged(id), sent = S.sent && S.sent[id];
  return '<div class="slip' + (inLedger ? ' in' : '') + '" data-slip="' + esc(id) + '"><p class="kicker">' + esc(t(inLedger ? 'ledger.slip.in' : sent ? 'ledger.slip.sent' : 'ledger.slip.yours')) + '</p>' +
    '<p class="small">' + esc(t(inLedger ? 'ledger.slip.inD' : 'ledger.slip.d')) + '</p><p class="mono small path">' + esc(f.path) + '</p>' + (inLedger ? '' : '<p class="small muted">' + esc(t('ledger.slip.paste')) + '</p>') +
    (inLedger ? '' : '<div class="acts"><a class="btn primary" target="_blank" rel="noopener" data-send="' + esc(id) + '" href="' + esc(proposeUrl(e)) + '">' + esc(t('ledger.slip.send')) + '</a><button type="button" class="btn" data-copy="' + esc(id) + '">' + esc(t('ledger.slip.copy')) + '</button><button type="button" class="link" data-drop="' + esc(id) + '">' + esc(t('ledger.slip.drop')) + '</button></div>') + '</div>';
}
/* the slip's buttons; returns true when it handled the click (and changed is called when your state changed) */
export function slipClick(ev, S, changed) {
  const q = s => ev.target.closest(s);
  const send = q('[data-send]'); if (send) { S.sent = S.sent || {}; S.sent[send.dataset.send] = true; changed(false); return true; }
  const copy = q('[data-copy]'); if (copy) { const e = draftOf(S, copy.dataset.copy); if (e && navigator.clipboard) navigator.clipboard.writeText(fileOf(e).text).then(() => { copy.textContent = t('ledger.slip.copied'); }, () => { /* no clipboard */ }); return true; }
  const drop = q('[data-drop]'); if (drop) { S.drafts = (S.drafts || []).filter(d => d.id !== drop.dataset.drop); if (S.sent) delete S.sent[drop.dataset.drop]; changed(true); return true; }
  return false;
}

export const byLine = e => esc(e.by) + ' · ' + esc(t('build.kind.' + e.made));
