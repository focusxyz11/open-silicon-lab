/* The stories that drive scenes (src/v2/story.js). Each is data: its steps, what the scene shows at each, the
   live numbers, the predictions. The numbers come from the engines, never from the words.
   The board: one chip and its memory, and the wall between them (src/engines/chip.js: reuse, busy, movePJ). */
import { t } from '../core/i18n.js';
import { model, START, REUSES } from '../engines/chip.js';
import { VIEW_PARTS } from '../data/atlas.js';

export function boardStory() {
  const M = i => model(Object.assign({}, START, { reuse: i }));
  const pct = v => Math.round(v * 100);
  /* how much is streaming from memory: full while the cores wait for it, then less as each number is reused */
  const flowOf = i => { const m = M(i); return Math.min(1, m.busy * 16 / REUSES[i]); };
  const figs = (S, which) => { const m = M(S.reuse); return { die: which.includes('die') ? t('board.fig.busy', { v: pct(m.busy) }) : '', hbm: which.includes('hbm') ? t('board.fig.move', { v: Math.round(m.movePJ) }) : '' }; };
  /* the parts' names come from their one home in the atlas */
  const names = Object.fromEntries(Object.entries(VIEW_PARTS.board).map(([id, home]) => [id, t('part.' + home)]));
  return {
    text: (k, v) => t('board.story.' + k, v),
    state: { reuse: 0, guess: null },
    vars: S => { const m = M(S.reuse), a = M(0), b = M(2); return { math: m.mathPJ, move: Math.round(a.movePJ), ratio: Math.round(a.movePJ / a.mathPJ), b1: pct(a.busy), b16: pct(b.busy), busy: pct(m.busy) }; },
    live: S => ({ reuse: { index: S.reuse, values: REUSES, text: t('board.times', { v: REUSES[S.reuse] }), label: t('board.reuseLabel') } }),
    /* the goal beside the picture while the number moves */
    gauges: S => { const m = M(S.reuse); return [{ id: 'busy', v: m.busy, text: pct(m.busy) + '%' }, { id: 'moving', v: m.moving, text: pct(m.moving) + '%', warm: true }]; },
    steps: [
      { id: 'intro', parts: [], scene: S => ({ view: 'board', open: 0, lit: 'chip', busy: M(S.reuse).busy, flow: 0, names, figs: figs(S, []) }) },
      { id: 'die', parts: ['chip', 'die'], scene: S => ({ view: 'die', open: 1, lit: 'die', busy: M(S.reuse).busy, flow: 0, figs: figs(S, ['die']) }) },
      { id: 'hbm', parts: ['hbm'], scene: S => ({ view: 'hbm', open: 1, lit: 'hbm', busy: M(S.reuse).busy, flow: flowOf(S.reuse), figs: figs(S, ['die', 'hbm']) }) },
      { id: 'reuse', live: 'reuse', predict: ['a', 'b', 'c'], right: 'b', scene: S => ({ view: 'flow', open: 1, lit: null, busy: M(S.reuse).busy, flow: flowOf(S.reuse), figs: figs(S, ['die', 'hbm']) }) },
      { id: 'links', parts: ['links'], scene: S => ({ view: 'links', open: 0, lit: 'links', flow: 0, figs: figs(S, []) }) },
      { id: 'power', parts: ['vrm'], ask: 'divide.block', scene: S => ({ view: 'vrm', open: 0, lit: 'vrm', flow: 0, figs: figs(S, []) }),
        end: [{ href: '#/chip/0', words: 'board.end.dive' }, { href: '#/place/datacentre/4', words: 'board.end.back' }] }
    ]
  };
}
