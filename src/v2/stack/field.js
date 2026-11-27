/* The field of every attempt in words (docs/PATH.md step 6; #448): who holds a point and the credit it carries, what
   changed since your last visit (kept in this browser), and how agents explore it: through the open port, never run by
   the lab. The census and its rules are the population engine's (src/engines/population.js); this file only says them, every word
   t('sk.…') in src/i18n/en/stack.json. Written by Claude Opus 5.5 in the nightly build. */
import { t, fmtNum, fmtDate, fmtList } from '../../core/i18n.js';
import { esc } from '../../core/esc.js';
import { REPO } from '../../data/weave.js';
import { F, times } from './model.js';
import { DAY_CAP } from '../../data/field.js';

const SEEN = 'osl-stack-seen';
const need = n => t('ar.need.' + n);
const away = d => (d === 1 ? t('sk.field.away1') : t('sk.field.away', { d }));
/* who stands on a point, in a few words: the built recipe's name, the entry's author (an agent said so), or you */
export function holder(a) {
  if (!a) return '';
  if (a.mine) return t('sk.field.yours');
  if (a.built) return t('ar.known.' + a.id);
  return a.agent ? t('sk.field.byAgent', { who: a.who }) : a.who;
}
/* the credit a point carries, for the line under a plot: first to try its recipe, or kept on a day */
export function credit(a) {
  if (!a || a.by !== 'ledger') return '';
  return a.first ? t('sk.field.firstBy', { who: holder(a), date: fmtDate(a.day) }) : t('sk.field.by', { who: holder(a) });
}
/* the card under another recipe's stack: where it came from */
export function plotCard(a) {
  if (!a || a.by !== 'ledger') return t('sk.plot.ledger');
  return t(a.first ? 'sk.plot.firstBy' : 'sk.plot.keptBy', { who: holder(a), date: fmtDate(a.day), y: fmtNum(a.years) });
}

/* what changed since your last visit: read what this browser kept, then keep this visit (once a page load) */
export function sinceVisit(POP, cen, today) {
  let prev = null;
  try { prev = JSON.parse(localStorage.getItem(SEEN) || 'null'); } catch (e) { /* nothing kept */ }
  const info = F.since(prev, POP, cen);
  try { localStorage.setItem(SEEN, JSON.stringify(F.snapOf(POP, cen, today))); } catch (e) { /* not kept */ }
  return info;
}
export function sinceLine(info, POP, cen) {
  const kept = POP.filter(a => a.by === 'ledger' && !a.draft).length;
  if (info.first) return t('sk.since.first', { n: kept, c: F.champions(cen).length });
  const parts = [];
  if (info.fresh.length) parts.push(t('sk.since.fresh', { n: info.fresh.length, a: info.fresh.filter(a => a.agent).length }));
  if (info.deposed.length === 1) { const x = info.deposed[0]; parts.push(t('sk.since.deposed', { need: need(x.need), away: away(x.d), who: holder(x.now) })); }
  else if (info.deposed.length) parts.push(t('sk.since.deposedN', { n: info.deposed.length }));
  const when = info.at ? fmtDate(info.at) : '';
  return parts.length ? t('sk.since.head', { date: when }) + ' ' + fmtList(parts) + '.' : t('sk.since.none', { date: when });
}

/* the seasons (#480): closed seasons' champions, kept as history, and the attempts over their authors' day's cap */
export function seasonLine(over) {
  const P = F.pastChampions(), parts = [];
  if (P.length) parts.push(t('sk.season.past', { list: fmtList(P.slice(-3).map(c => t('sk.season.champ', { who: c.built ? t('ar.known.' + c.id) : c.who, n: c.season, need: need(c.need), away: away(c.d) }))) }));
  if (over > 0) parts.push(t('sk.season.over', { n: over, cap: DAY_CAP }));
  return parts.join(' ');
}

/* how agents explore: from their own machines, through the open port; what they try comes back as entries */
export function portCard(POP) {
  const L = POP.filter(a => a.by === 'ledger' && !a.draft), ag = L.filter(a => a.agent).length;
  return '<div class="sk-port"><p>' + esc(t('sk.port.head')) + '</p><p class="n">' + esc(t('sk.port.count', { n: ag, all: L.length })) + '</p>' +
    '<p>' + esc(t('sk.port.how')) + ' <a href="' + esc(REPO + '/blob/main/docs/MCP.md') + '" target="_blank" rel="noopener">' + esc(t('sk.port.doc')) + '</a> · <code>' + esc(t('sk.port.cmd')) + '</code></p>' +
    '<button type="button" class="btn" data-port="x">' + esc(t('sk.agent.dismiss')) + '</button></div>';
}
/* a champion's words on the sheet: who holds it and how far it has come */
export const champWords = c => holder(c.a) + '  ' + times(c.now);
