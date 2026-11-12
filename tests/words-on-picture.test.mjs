/* Words on the picture (src/app/draw.js wrap, src/data/weave.js NOTE_AT): any language, any length. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap } from '../src/app/draw.js';
import { NOTE_AT } from '../src/data/weave.js';
import { partsOf } from '../src/app/scenes.js';

/* a stand-in for a canvas: every character 7 px wide, wide characters 13 */
const C = { measureText: s => ({ width: [...s].reduce((a, ch) => a + (/[　-鿿가-힯]/.test(ch) ? 13 : 7), 0) }) };

test('lines never run wider than the box, in any script', () => {
  for (const text of ['Its cores wait for numbers from memory two thirds of the time.', 'Speicherbandbreitenbegrenzungsproblematik ist überall zu finden.', '芯片的大部分能量都花在从内存中搬运数据上，而不是计算本身。', 'メモリから数値を運ぶのに、計算そのものより多くのエネルギーを使います。']) {
    const lines = wrap(C, text, 140);
    assert.ok(lines.length > 1, text);
    for (const l of lines) assert.ok(C.measureText(l).width <= 140, JSON.stringify(l));
    assert.equal(lines.join('').replace(/\s+/g, ''), text.replace(/\s+/g, ''), 'nothing lost');
  }
});

test("every depth's note about your chip is pinned to a part it really has", () => {
  for (const [id, key] of Object.entries(NOTE_AT)) assert.ok(partsOf(id)[key], id + ': no part ' + key);
});
