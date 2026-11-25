/* The questions from the field, as the frame and the island show them (the data: src/data/questions.js). A question
   wears its shape as a small mark: a point for a limit (one primitive at its edge), a diamond on a line for a leak (two
   meeting, on a seam), a triangle for a bet (three pulling at once). Its card says who was stuck on it, what it opened,
   what is still open, and how to try it here; the asker's own words are one tap away. */
import { t } from '../core/i18n.js';
import { fieldOf, fieldHome, QUESTIONS, questionOfField } from '../data/atlas.js';
import { CHALLENGES } from './loop.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const GLYPH = {
  limit: '<circle cx="8" cy="8" r="4.2"/>',
  leak: '<path d="M1 8h14" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="5" y="5" width="6" height="6" transform="rotate(45 8 8)"/>',
  bet: '<path d="M8 2.2 13.8 13H2.2Z"/>'
};
export const glyph = shape => '<svg class="fglyph" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">' + (GLYPH[shape] || '') + '</svg>';

/* where a question sits, in words: its seam for a leak, its home otherwise */
export function whereWords(q) {
  const s = q.seam;
  if (s && s.a) return t('field.ui.inout', { a: t('depth.' + s.a + '.name'), b: t('depth.' + s.b + '.name') });
  if (s && s.along) return t('field.ui.along', { a: t('loop.stage.' + s.along[0]), b: t('loop.stage.' + s.along[1]) });
  const h = fieldHome(q.id);
  return t('field.ui.home', { at: h.level ? t('depth.' + h.level + '.name') : t('map.' + h.place + '.t') });
}

/* a line in a list: the mark and the question; tapping it opens the card */
export const fieldLine = id => { const q = fieldOf(id); return q ? '<button type="button" class="fieldline" data-field="' + esc(id) + '">' + glyph(q.shape) + '<span class="q">' + esc(t('field.' + id + '.q')) + '</span></button>' : ''; };

/* the card */
export function fieldHtml(id) {
  const q = fieldOf(id); if (!q) return '';
  const play = CHALLENGES.find(c => c.kind === 'bet' && c.bet === id);
  return '<div class="fieldx stopx" data-shape="' + q.shape + '"><p class="kicker fieldk">' + glyph(q.shape) + esc(t('field.shape.' + q.shape)) + ' · ' + esc(whereWords(q)) + '</p>' +
    '<p class="line trailq">' + esc(t('field.' + id + '.q')) + '</p>' +
    '<p class="small muted">' + esc(t('field.' + id + '.who')) + ' · <a href="' + esc(q.src) + '" target="_blank" rel="noopener">' + esc(t('field.ui.read')) + '</a></p>' +
    '<dl class="fielddl"><dt>' + esc(t('field.ui.meets')) + '</dt><dd>' + q.prims.map(p => '<span class="prim ' + p + '">' + esc(t('prim.' + p)) + '</span>').join(' ') + '</dd>' +
    '<dt>' + esc(t('field.ui.opened')) + '</dt><dd>' + esc(t('field.' + id + '.opened')) + '</dd>' +
    '<dt>' + esc(t('field.ui.open')) + '</dt><dd>' + esc(t('field.' + id + '.open')) + '</dd>' +
    '<dt>' + esc(t('field.ui.try')) + '</dt><dd>' + esc(t('field.try.' + q.shape)) + '</dd></dl>' +
    /* a bet you can play: its challenge, one tap away */
    (play ? '<a class="btn primary" href="#/do/' + esc(play.id) + '">' + esc(t('field.ui.play')) + '</a>' : '') +
    /* a question the energy puzzle runs through: the puzzle, offered here (content/puzzles/energy.md) */
    (JOULE_AT[id] ? jouleOffer(id) : '') + buildOffer(id, true) +
    '<div class="nav"><button type="button" class="btn ghost" data-fieldleave>' + esc(t('field.ui.leave')) + '</button></div></div>';
}

/* the questions of the field the energy puzzle runs through, and the level of the dive where its lens opens */
export const JOULE_AT = { fetch: 'block', wait: 'chip', dark: 'chip', brain: 'gate', heat: 'switch' };
const jouleOffer = id => '<p class="small jofferd">' + esc(t('joule.offer.d')) + '</p><button type="button" class="btn" data-joule="' + esc(JOULE_AT[id]) + '">' + esc(t('joule.offer')) + '</button>';
/* a question to build that this question of the field leads to (QUESTIONS in the atlas): its game, one tap away */
function buildOffer(id, long) {
  const k = questionOfField(id); if (!k) return '';
  const Q = QUESTIONS[k];
  return (long ? '<p class="small jofferd">' + esc(t('q.' + k + '.q')) + '</p>' : '') + '<a class="btn" href="#/do/' + esc(Q.challenge) + '" data-qoffer="' + esc(k) + '">' + esc(t('game.ch.' + Q.challenge + '.t')) + '</a>';
}
/* the note a crossed seam raises: the leak on it, with a way to follow it */
export function seamNote(id) {
  const q = fieldOf(id); if (!q) return '';
  return '<p class="kicker">' + glyph('leak') + esc(t('field.ui.seam')) + '</p><p class="sq">' + esc(t('field.' + id + '.q')) + '</p>' +
    '<div class="acts"><button type="button" class="btn primary" data-field="' + esc(id) + '">' + esc(t('field.ui.go')) + '</button>' +
    (JOULE_AT[id] ? '<button type="button" class="btn" data-joule="' + esc(JOULE_AT[id]) + '">' + esc(t('joule.offer')) + '</button>' : '') + buildOffer(id, false) +
    '<button type="button" class="seamx" data-seamx aria-label="' + esc(t('field.ui.hide')) + '">×</button></div>';
}
