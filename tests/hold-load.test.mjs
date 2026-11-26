// Hold, the first page, loads: its three modules run their top level without a browser, so a name used there and
// not imported fails here, in npm test, and not only in the browser smoke test (dAt was lost this way when two pull
// requests touched holdkit.js's imports at once). A few browser globals are stubbed, nothing more.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const noop = () => {};
const store = { getItem: () => null, setItem: noop, removeItem: noop };
Object.assign(globalThis, {
  addEventListener: noop, removeEventListener: noop, localStorage: store, location: { hash: '' },
  matchMedia: () => ({ matches: false, addEventListener: noop }),
});
globalThis.window = globalThis;
globalThis.document = {
  documentElement: { dataset: {}, lang: 'en' }, addEventListener: noop, querySelector: () => null, getElementById: () => null,
  createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop }),
};

for (const f of ['holdkit', 'holdplates', 'hold', 'holdisle', 'holdnotes']) {
  test('src/v2/' + f + '.js loads: every name its top level uses is defined', async () => {
    const m = await import('../src/v2/' + f + '.js');
    assert.ok(Object.keys(m).length > 0);
  });
}
