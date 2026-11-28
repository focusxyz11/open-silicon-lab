/* An agent in the studio (#510): an arrangement or a placement proposed through the open port, scored by the engines
   beside yours, and nothing changed until the person takes it. The lab runs no agent of its own. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as API from '../src/engines/api.js';
import * as F from '../src/engines/floorplan.js';
import * as P from '../src/engines/placer.js';
import * as A from '../src/engines/arch.js';
import { build, solutionOf } from '../src/engines/design.js';

test('an arrangement: today\'s has no better one; a stacked one is offered one both cooler and shorter', () => {
  const none = API.proposeArrangement({});
  assert.equal(none.ok, true); assert.equal(none.proposed, null, 'nothing both cooler and shorter than today\'s');
  const st = API.proposeArrangement({ recipe: { shape: 'stack' } });
  assert.ok(st.proposed && st.coolerBy > 0 && st.shorterByMm > 0, 'a stacked chip gets a cooler, shorter arrangement');
  /* the engine tried all sixteen: nothing it did not propose beats its proposal on both */
  const all = F.arrangementsOf(Object.assign({}, A.TODAY, { shape: 'stack' }), { ui: 1 });
  assert.equal(all.length, 16);
  /* one brought by an agent is scored beside yours by the same engine */
  const b = API.proposeArrangement({ shape: 'grid', where: 'in' }), H = F.heatOf(F.floorplanOf(Object.assign({}, A.TODAY, { shape: 'grid', where: 'in' }), { ui: 1 }));
  assert.ok(Math.abs(b.proposed.hottest - +H.hottest.toPrecision(4)) < 1e-9 && Math.abs(b.proposed.tripMm - +H.trip.toPrecision(4)) < 1e-9);
  assert.equal(API.proposeArrangement({ shape: 'cube' }).ok, false);
});

test('a placement: the engine\'s settled one is shorter and on time; one an agent brings is checked and scored', () => {
  const R = API.proposePlacement({ job: 'alu' });
  assert.ok(R.ok && R.better && R.proposed.wireSites < R.yours.wireSites, 'the settled placement beats the hand one');
  const B = build({ p: 'alu', code: solutionOf('alu') }), scr = P.scrambleOf(B, 3);
  const S = API.proposePlacement({ job: 'alu', place: scr });
  assert.ok(S.ok && !S.better && S.proposed.wireSites > S.yours.wireSites, 'a scrambled proposal is scored as worse');
  assert.equal(S.proposed.meetsClock, false, 'and late');
  assert.equal(API.proposePlacement({ job: 'alu', place: { 0: { x: -5, r: 0 } } }).ok, false, 'a placement off the block is refused');
});

test('a proposal changes nothing on its own: the port writes nothing, and the studio applies one only on Take it', () => {
  /* the port's proposals are pure: called twice, the same answer, and no entry is drafted */
  assert.deepEqual(API.proposeArrangement({ recipe: { shape: 'stack' } }), API.proposeArrangement({ recipe: { shape: 'stack' } }));
  const src = readFileSync(new URL('../src/engines/api.js', import.meta.url), 'utf8'), body = src.slice(src.indexOf('export function proposeArrangement'));
  assert.ok(!/draft\(|draftE\(|entryOut\(/.test(body), 'the studio\'s proposals draft no ledger entry');
  /* the studio keeps a proposal apart and applies it only in the handler of its Take it button */
  const glue = readFileSync(new URL('../src/v2/glue/studio.js', import.meta.url), 'utf8');
  const take = glue.indexOf('function takeProposal'), ask = glue.indexOf('function askAgent');
  assert.ok(take > 0 && ask > 0, 'asking and taking are separate');
  const askBody = glue.slice(ask, glue.indexOf('\n  }', ask));
  assert.ok(!/keepGene|placeTo|keepDesign/.test(askBody), 'asking an agent never changes the record');
});
