/* The Swarm engine: a trail that belongs to the colony, and eyes that work only when news arrives. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choice, settle, colony, step, kill, share, verdict, COLONIES, STEPS, watch, SCENES } from '../src/engines/swarm.js';

const runs = (opts, seeds = 12) => Array.from({ length: seeds }, (_, i) => settle({ ...opts, seed: i + 1 }).verdict);

test('the measured choice: no scent, an even chance; more scent, more ants; ignoring scent, always even', () => {
  assert.equal(choice(0, 0), 0.5);
  assert.ok(choice(40, 0) > 0.8 && choice(0, 40) < 0.2);
  assert.equal(choice(100, 0, 0), 0.5);
  assert.ok(choice(40, 0, 2) > choice(40, 0, 1), 'following more than in proportion sways harder');
});
test('ants that follow scent as measured settle on the short bridge in most colonies, not all', () => {
  const v = runs({ n: COLONIES[1], follow: 2 });
  const short = v.filter(x => x === 'short').length;
  assert.ok(short >= 7 && short < 12, short + ' of 12');
});
test('ants that ignore scent, or follow it only in proportion, make no trail', () => {
  for (const follow of [0, 1]) assert.ok(runs({ n: COLONIES[1], follow }).every(x => x === 'both'), 'follow ' + follow);
});
test('with lasting scent, a shortcut opened late is not taken (Goss et al., 1989)', () => {
  assert.ok(runs({ n: COLONIES[1], follow: 2, late: true }).every(x => x === 'long'));
});
test('take away a third of the ants and the trail holds', () => {
  const S = colony({ n: COLONIES[1], follow: 2, seed: 1 });
  for (let i = 0; i < 600; i++) step(S);
  const before = share(S, 10); assert.equal(verdict(before), 'short');
  kill(S, 1 / 3); assert.equal(S.ants.filter(a => a.alive).length, COLONIES[1] - 20);
  for (let i = 600; i < STEPS; i++) step(S);
  assert.equal(verdict(share(S, 10)), 'short');
});
test('eyes: a still room costs the camera every read and the eye-like pixels nothing; busier scenes, more reports', () => {
  const [still, one, busy] = SCENES.map(k => watch(k));
  assert.equal(still.events, 0); assert.ok(still.reads > 0);
  assert.ok(one.events > 0 && busy.events > one.events && busy.events < busy.reads);
  assert.equal(one.reads, busy.reads);
});
