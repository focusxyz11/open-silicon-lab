// The AI serving engines (src/engines/aiserve.js): the defaults give what the first version showed, results move the right
// way, and each challenge can be met by some setting and fails at the defaults.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../src/engines/aiserve.js';
import { readFileSync } from 'node:fs';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test('facts named by the tables exist in facts.json', () => {
  const ids = new Set(JSON.parse(readFileSync(new URL('../src/data/facts.json', import.meta.url))).facts.map(f => f.id));
  for (const c of [...S.SERVE_CHIPS, ...S.REAL_CHIPS]) for (const f of c.facts) assert.ok(ids.has(f), f);
});

test('words: every id is namespaced, and the challenges have title, goal and done', () => {
  for (const k of Object.keys(S.WORDS)) assert.match(k, /^ai\./);
  for (const id of ['fourBits', 'readFastWriteSlow']) for (const p of ['t', 'goal', 'done']) assert.ok(S.WORDS[`ai.ch.${id}.${p}`]);
  for (const f of Object.keys(S.QUANT_FORMATS)) assert.ok(S.WORDS[`ai.quant.format.${f}`]);
  for (const a of S.ARCHITECTURES) assert.ok(S.WORDS[`ai.arch.${a.id}.t`] && S.WORDS[`ai.arch.${a.id}.tag`]);
});

test('quantization defaults: FP4, one scale per tensor, 0.5% outliers: most weights collapse to zero', () => {
  const r = S.quantize();
  assert.equal(r.bits, 4); assert.equal(r.memGB, 35);
  assert.equal(r.verdict, 'coarse');
  assert.ok(r.zeroShare > 0.7 && r.snrDb < 10);
  assert.deepEqual(S.quantize(), r);                      // seeded: the same every time
});

test('quantization: block scaling helps, finer blocks help more, 16-bit is nearly lossless', () => {
  const at = (scaling, format = 'fp4') => S.quantize({ format, scaling, outliers: 1 });
  assert.ok(at('nv16').snrDb > at('mx32').snrDb && at('mx32').snrDb > at('tensor').snrDb);
  near(at('nv16').bits, 4.5, 0); near(at('mx32').bits, 4.25, 0);
  assert.equal(at('tensor', 'fp16').verdict, 'lossless');
  assert.equal(at('nv16', 'fp16').bits, 16);               // 16-bit formats take no block scale
  assert.ok(S.quantize({ format: 'e4m3', scaling: 'tensor', outliers: 1 }).snrDb > S.quantize({ format: 'fp4', scaling: 'tensor', outliers: 1 }).snrDb);
  assert.ok(S.quantize({ format: 'fp4', scaling: 'nv16', outliers: 0 }).snrDb > at('nv16').snrDb);   // more outliers, more noise
});

test('challenge Four bits: only FP4 with blocks of 16 meets it (39.4 GB, about 20.5 dB)', () => {
  assert.equal(S.fourBits(S.QUANT_DEFAULTS), false);
  const win = { format: 'fp4', scaling: 'nv16', outliers: 1 };
  assert.equal(S.fourBits(win), true);
  near(S.quantize(win).memGB, 39.4, 0.05); near(S.quantize(win).snrDb, 20.5, 0.05);
  assert.equal(S.fourBits({ ...win, outliers: 0.5 }), false);             // it asks for 1% outliers
  const winners = [];
  for (const format of Object.keys(S.QUANT_FORMATS)) for (const scaling of Object.keys(S.QUANT_SCALES)) if (S.fourBits({ format, scaling, outliers: 1 })) winners.push(format + scaling);
  assert.deepEqual(winners, ['fp4nv16']);
});

test('prefill and decode defaults: Rubin, 70B, 7,317 tokens in, 270 out', () => {
  const r = S.prefillDecode();
  assert.equal(r.chips, 1); assert.equal(r.promptTokens, 7317); assert.equal(r.answerTokens, 270);
  near(r.prefillS, 0.082, 0.001); near(r.tokPerS, 314, 1); near(r.totalS, 0.941, 0.001);
  assert.equal(r.dominant, 'decode');
  near(r.readVsWrite, 280, 5);
  assert.equal(S.serveChipOf('rubin').pf8, 25);
});

test('prefill and decode: longer prompts take longer to first token, longer answers longer to write, bigger models more chips', () => {
  const a = S.prefillDecode({ promptSlider: 300 }), b = S.prefillDecode({ promptSlider: 900 });
  assert.ok(b.prefillS > a.prefillS && b.decodeS === a.decodeS);
  assert.ok(S.prefillDecode({ answerSlider: 900 }).decodeS > S.prefillDecode({ answerSlider: 100 }).decodeS);
  assert.ok(S.prefillDecode({ paramsB: 405 }).chips > 1);
  assert.equal(S.prefillDecode({ promptSlider: 1000 }).dominant, 'prefill');
  assert.equal(S.promptOfSlider(1000), 128000); assert.equal(S.answerOfSlider(1000), 4000);
});

test('challenge Read fast, write slow: about 77,000 tokens in on Rubin with 70B and 270 out', () => {
  assert.equal(S.readFastWriteSlow(S.PREFILL_DEFAULTS), false);
  assert.equal(S.readFastWriteSlow({ chipId: 'rubin', paramsB: 70, answerTokens: 270, promptTokens: 77000 }), true);
  // the two times cross there
  near(S.prefillDecode({ promptTokens: 77000, answerTokens: 270 }).prefillS, S.prefillDecode({ promptTokens: 77000, answerTokens: 270 }).decodeS, 0.01);
  assert.equal(S.readFastWriteSlow({ chipId: 'rubin', paramsB: 70, answerTokens: 270, promptTokens: 20000 }), false);
  assert.equal(S.readFastWriteSlow({ chipId: 'mi455x', paramsB: 70, answerTokens: 270, promptTokens: 77000 }), false);
  assert.equal(S.readFastWriteSlow({ chipId: 'rubin', paramsB: 70, answerTokens: 271, promptTokens: 77000 }), false);
  // a prompt slider position that gives it exactly: the default answer slider gives 270
  const ok = [...Array(1001).keys()].some(v => S.readFastWriteSlow({ ...S.PREFILL_DEFAULTS, promptSlider: v }));
  assert.ok(ok);
});

test('energy per token defaults: 2.3 kW, 7,943 tokens a second, 35% overhead, PUE 1.2', () => {
  const r = S.energyPerToken();
  near(r.facilityW, 3726, 0.01); near(r.joulesPerToken, 0.469, 0.001); near(r.whPerAnswer, 0.130, 0.001);
  near(r.shares[0], 0.617, 0.001); near(r.shares.reduce((a, b) => a + b), 1, 1e-9);
  assert.equal(Math.round(r.acceleratorsPerGW), 268384); assert.equal(r.homesK, 834);
  near(r.tokensPerDayPerGW / 1e12, 184.2, 0.1);
});

test('energy per token: faster is cheaper per token; power, overhead and PUE cost more', () => {
  const j = s => S.energyPerToken(s).joulesPerToken;
  assert.ok(j({ tokExp: 4.5 }) < j({}) && j({ watts: 1000 }) < j({}) && j({ overhead: 10 }) < j({}) && j({ pue: 1.05 }) < j({}));
  near(j({ tokExp: 4.9 }) * 10, j({ tokExp: 3.9 }), 1e-9);
  assert.equal(S.energyPerToken({ pue: 1 }).parts[2], 0);
});

test('cluster network defaults: 8,192 GPUs, racks of 72, pluggable optics', () => {
  const r = S.clusterNetwork();
  assert.equal(r.tiers, 3); assert.equal(r.switches, 640); assert.equal(r.transceivers, 49152); assert.equal(r.domains, 114);
  near(r.netW / 1e6, 2.43, 0.01); near(r.share * 100, 9.4, 0.05);
});

test('cluster network: tiers grow with size, a domain that holds the cluster needs none, optics power falls with co-packaged optics', () => {
  let prev = -1;
  for (let e = 3; e <= 17; e++) { const t = S.clusterNetwork({ exp: e, domain: 8 }).tiers; assert.ok(t >= prev); prev = t; }
  assert.equal(S.clusterNetwork({ exp: 3 }).tiers, 0); assert.equal(S.clusterNetwork({ exp: 6, domain: 72 }).tiers, 0); assert.equal(S.clusterNetwork({ exp: 6, domain: 8 }).tiers, 1);
  assert.equal(S.clusterNetwork({ exp: 17 }).tiers, 4); assert.equal(S.clusterNetwork({ exp: 3 }).netW, 0);
  const plug = S.clusterNetwork(), cpo = S.clusterNetwork({ optics: 'cpo' });
  assert.ok(cpo.netW < plug.netW && cpo.share < plug.share && cpo.switches === plug.switches);
  near(cpo.linkW / plug.linkW, 39 / 60, 1e-9);
  assert.ok(S.clusterNetwork({ gpuW: 1000 }).share > plug.share);
});

test('architectures and real chips: data is whole and the comparison bars are on a log scale', () => {
  for (const a of S.ARCHITECTURES) for (const c of a.chips) assert.ok(S.realChipOf(c), c);
  assert.equal(S.REAL_CHIPS.length, 7);
  assert.equal(S.compareBar('groq3', 'top'), null);
  assert.ok(S.compareBar('cerebras', 'bw') > S.compareBar('rubin', 'bw'));
  near(S.compareBar('rubin', 'top'), Math.log10(50) / 3, 1e-9);
  assert.equal(S.compareBar('groq3', 'gb'), Math.max(0.02, (Math.log10(0.5) + 1) / 4));
});
