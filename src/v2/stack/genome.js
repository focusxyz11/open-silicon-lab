/* The open genome in the stack (docs/PATH.md, "Architectures: the frontier of the path"; #452): the options proposed for
   a gene, entries of the community's ledger (kind gene, checked complete by src/engines/arch.js proposalWhy), shown under
   the gene's own options, each with its trait effects and who proposed it, marked a guess until a fact backs it. The
   engine does not grow them: a pull request adopts one into the genome with its fact. Words sk.genome.* in
   src/i18n/en/stack.json. Written by Claude Opus 5.5 in the nightly build. */
import { t } from '../../core/i18n.js';
import { esc } from '../../core/esc.js';
import { mark, statusMark } from '../fid.js';
import { A, times } from './model.js';

const fx = e => A.TRAITS.filter(k => e && typeof e[k] === 'number').map(k => t('ar.tr.' + k) + ' ' + times(e[k])).join(' · ');
/* the proposals for one gene, under its options in the gene's menu */
export function proposedHtml(list, gene) {
  const ps = (list || []).filter(p => p.gene === gene);
  if (!ps.length) return '';
  return '<p class="sk-gk">' + esc(t('sk.genome.head')) + '</p>' + ps.map(p => '<div class="sk-gprop"><b>' + esc(p.name) + '</b><span>' + esc(p.what) + '</span>' +
    (fx(p.effect) ? '<span class="fx">' + esc(fx(p.effect)) + '</span>' : '') + '<em>' + (p.fact ? mark({ f: 'figures', fact: p.fact }) : statusMark('guess')) + ' ' + esc(t('sk.genome.by', { who: p.by })) + '</em></div>').join('');
}
/* the field's open edge: how many options are proposed, or the invitation */
export const openWords = list => ((list || []).length ? t('sk.field.openN', { n: list.length }) : t('sk.field.open'));
