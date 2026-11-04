/* The four doors into the lab: Explore (the home map), Build, Break and Imagine. Build, Break and
   Imagine each open with their big projects, then their own column of the frontier map: every
   challenge of that kind, by layer, beside the open problems they help with. Their words are
   door.<id>.* in src/i18n; a project is a topic (its title and summary come from the graph) or one
   of the shell's own pages, such as the What if? simulator. */
import { topicById } from '../data/topics.js';
import { CHALLENGES } from '../data/challenges.js';
import { renderFrontier, watchFrontier } from './frontier.js';
import { P } from './learning.js';
import { solvedIn } from './checks.js';
import { t } from '../core/i18n.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const DOORS = {
  break: { view: 'break', projects: ['reality', 'bench', 'agent', 'supply'] },
  imagine: { view: 'imagine', projects: ['beyond', 'whatif', 'scenarios', 'evolve', 'future', 'floor'] }
};

/* A project card: a topic, or a page of the shell (#whatif, #mychip), named door.page.<id>.t / .d. */
export function project(id) {
  const tp = topicById(id);
  const title = tp ? tp.t : t('door.page.' + id + '.t'), d = tp ? tp.s : t('door.page.' + id + '.d');
  const n = CHALLENGES.filter(c => c.topic === id).length;
  return '<a class="dproj" href="#' + id + '"><b>' + esc(title) + '</b><span>' + esc(d) + '</span><small>' +
    (n ? esc(t('door.challenges', { n })) : '') + (tp && P.seen[id] ? '<em>' + t('door.opened') + '</em>' : '') + '</small></a>';
}

/* The heading every door shares; lens is build, break or imagine. */
export function doorHead(lens) {
  const mine = CHALLENGES.filter(c => c.lens === lens), n = mine.length, k = solvedIn(mine);
  return '<section class="wrap dhead fc-' + lens + '"><p class="code"><i class="dot"></i>' + t('door.' + lens + '.code') + '</p><h1>' + t('door.' + lens + '.title') + '</h1>' +
    '<p class="lede">' + t('door.' + lens + '.lede') + '</p><p class="small muted">' + esc(t('door.count', { n })) + (k ? ' · ' + esc(t('door.solved', { n: k })) : '') + ' · <a href="#challenges">' + t('door.whole') + '</a></p></section>';
}

/* The door's column of the frontier map, drawn into the element given. */
export function doorMap(el, lens) {
  el.innerHTML = '<div class="wrap dmaphead"><h2>' + t('door.' + lens + '.mapT') + '</h2><p class="muted">' + t('door.mapD') + '</p></div><div class="dmap"></div>';
  renderFrontier(el.querySelector('.dmap'), { lens });
  watchFrontier();
}

export function renderDoor(id) {
  const D = DOORS[id], v = document.getElementById('view-' + D.view);
  v.innerHTML = doorHead(id) + '<section class="wrap dprojs">' + D.projects.map(project).join('') + '</section><div class="dmapsec"></div>';
  doorMap(v.querySelector('.dmapsec'), id);
}
