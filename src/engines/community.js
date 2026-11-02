/* The community chip: learners' designs gathered into one Tiny Tapeout project. Pure logic, no DOM;
   tests in tests/community.test.mjs. scripts/community.mjs checks every design in community/ and
   writes src/generated/community.js for the site.

   How it works, as Tiny Tapeout itself does on a bigger scale: every design sits in the same tile,
   all of them get the chip's inputs, and a selector on five of the bidirectional pins (uio_in[4:0])
   picks which design drives the outputs. One tile holds about 1,000 standard cells (fact tt-tile);
   the designs here are tiny, so dozens fit, with room left for the selector. */
import TC from './tinychip.js';
import * as X from './export.js';

export const LIMITS = { designs: 32, cellsEach: 150, cellsTotal: 900, pins: 8, title: 48, author: 40, description: 200 };
export const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/* A design file as a project the engines understand. A design either names a studio project
   ("project": "count") and is checked against that project's specification, or declares its own
   pins ("ins", "outs", and "clocked" with "tests" for a clocked design) and is checked for what it does. */
export function specOf(d) {
  const base = d.project ? TC.PROJ.find(p => p.id === d.project) : null;
  if (base) return { ...base, id: d.slug, t: d.title, d: d.description || base.d, from: base.id };
  return { id: d.slug, t: d.title, d: d.description || '', ins: d.ins || [], outs: d.outs || [], seq: !!d.clocked, tests: d.tests, f: null, spec: false, from: null };
}

/* Check one design. Every problem is a plain sentence, so a contributor knows what to fix. */
export function check(d) {
  const P = [], say = m => P.push((d && d.slug ? d.slug + ': ' : '') + m);
  if (!d || typeof d !== 'object') return { ok: false, problems: ['not a design file'] };
  if (!SLUG.test(d.slug || '')) say('the folder name must be 3 to 40 lowercase letters, digits or dashes');
  if (typeof d.title !== 'string' || !d.title.trim() || d.title.length > LIMITS.title) say('"title" must be 1 to ' + LIMITS.title + ' characters');
  if (typeof d.author !== 'string' || !d.author.trim() || d.author.length > LIMITS.author) say('"author" must be 1 to ' + LIMITS.author + ' characters (a name or a GitHub handle)');
  if (d.description != null && (typeof d.description !== 'string' || d.description.length > LIMITS.description)) say('"description" can be at most ' + LIMITS.description + ' characters');
  if (typeof d.code !== 'string' || !d.code.trim()) say('"code" must hold the design, written in the tiny-chip language');
  if (d.project && !TC.PROJ.some(p => p.id === d.project)) say('"project" must be one of: ' + TC.PROJ.map(p => p.id).join(', '));
  const s = specOf(d);
  if (!d.project) {
    if (!Array.isArray(s.ins) || !s.ins.length || s.ins.length > LIMITS.pins || !s.ins.every(n => NAME.test(n))) say('"ins" must list 1 to 8 input names (letters, digits, underscores)');
    if (!Array.isArray(s.outs) || !s.outs.length || s.outs.length > LIMITS.pins || !s.outs.every(n => NAME.test(n))) say('"outs" must list 1 to 8 output names');
    if (s.seq && !(s.tests && s.ins.every(n => Array.isArray(s.tests[n]) && s.tests[n].length === s.tests[s.ins[0]].length && s.tests[n].length >= 4))) say('a clocked design needs "tests": a list of 0s and 1s for every input, one per clock cycle, at least 4 long');
  }
  if (P.length) return { ok: false, problems: P, spec: s };
  const D = TC.parse(d.code, s.ins, s.outs, { regs: !!s.seq });
  if (D.errs.length) { D.errs.forEach(e => say((e.l ? 'line ' + e.l + ': ' : '') + e.m)); return { ok: false, problems: P, spec: s }; }
  if (s.f) { const v = TC.verify(D, s); if (v.bad) say('it does not meet the ' + s.from + ' specification in ' + v.bad + ' of ' + v.rows.length + (s.seq ? ' clock cycles' : ' cases') + '; fix it in the studio first'); }
  const SY = TC.synth(D, s.ins, s.outs, 'basic', false, '130');
  if (SY.st.cells > LIMITS.cellsEach) say('it needs ' + SY.st.cells + ' cells; the limit is ' + LIMITS.cellsEach + ' per design so that many designs fit in one tile');
  const PL = TC.place(SY.M, 0.5, 7); PL.anneal(Math.min(3000, 300 + SY.M.cells.length * 80), null);
  if (TC.route(PL).failed.length) say('it could not be routed at 50% packing');
  if (P.length) return { ok: false, problems: P, spec: s };
  return { ok: true, problems: [], spec: s, D, M: SY.M, stats: { cells: SY.st.cells, tr: SY.st.tr, fmaxMHz: Math.round(SY.st.fmax), flops: (SY.M.regs || []).length } };
}

/* Check all designs together: each on its own, then the names, the count and the tile's room. */
export function checkAll(list) {
  const problems = [], ok = [];
  list.forEach(d => { const r = check(d); if (r.ok) ok.push({ d, r }); else problems.push(...r.problems); });
  const seen = new Set(); list.forEach(d => { if (seen.has(d.slug)) problems.push(d.slug + ': two designs use this folder name'); seen.add(d.slug); });
  if (list.length > LIMITS.designs) problems.push('the chip holds at most ' + LIMITS.designs + ' designs (five selector pins); there are ' + list.length);
  const cells = ok.reduce((s, x) => s + x.r.stats.cells, 0);
  if (cells > LIMITS.cellsTotal) problems.push('together the designs need ' + cells + ' cells, more than the ' + LIMITS.cellsTotal + ' that fit beside the selector in one tile');
  /* designs keep their order by date added, then folder name, so selector numbers never change */
  ok.sort((a, b) => String(a.d.added || '').localeCompare(String(b.d.added || '')) || a.d.slug.localeCompare(b.d.slug));
  return { problems, designs: ok, cells };
}

/* ---------- the chip's files ---------- */
const id = s => s.replace(/-/g, '_');
const moduleOf = (x) => X.coreVerilog(x.r.D, x.r.spec).replace(/^module \w+ \(/, 'module d_' + id(x.d.slug) + ' (');

/* src/project.v for the whole community chip. */
export function chipVerilog(designs, top = 'tt_um_open_silicon_lab_community') {
  const anyClock = designs.some(x => x.r.spec.seq);
  const lines = designs.map((x, k) => {
    const s = x.r.spec, { ins, outs } = X.pinOrder(s), nm = id(x.d.slug);
    const conn = (s.seq ? ['.clk(clk)', '.rst_n(rst_n)'] : []).concat(ins.map((n, i) => '.' + X.safe(n) + '(ui_in[' + i + '])'), outs.map((n, i) => '.' + X.safe(n) + '(o' + k + '[' + i + '])'));
    return '  // ' + k + ': ' + x.d.title.replace(/\*\//g, '') + ' by ' + x.d.author.replace(/\*\//g, '') + '\n  wire [7:0] o' + k + ';\n' + (outs.length < 8 ? '  assign o' + k + '[7:' + outs.length + '] = ' + (8 - outs.length) + "'b0;\n" : '') + '  d_' + nm + ' u' + k + ' (' + conn.join(', ') + ');';
  });
  return '/*\n * Open Silicon Lab community chip: ' + designs.length + ' designs by learners, in one tile.\n * uio_in[4:0] selects which design drives uo_out. Generated from community/ by scripts/community.mjs.\n * SPDX-License-Identifier: Apache-2.0\n */\n\n`default_nettype none\n\n' +
    'module ' + top + ' (\n    input  wire [7:0] ui_in,\n    output wire [7:0] uo_out,\n    input  wire [7:0] uio_in,\n    output wire [7:0] uio_out,\n    output wire [7:0] uio_oe,\n    input  wire       ena,\n    input  wire       clk,\n    input  wire       rst_n\n);\n' +
    '  wire [4:0] sel = uio_in[4:0];\n\n' + lines.join('\n\n') + '\n\n' +
    '  reg [7:0] out;\n  always @(*) begin\n    case (sel)\n' + designs.map((x, k) => "      5'd" + k + ': out = o' + k + ';').join('\n') + "\n      default: out = 8'b0;\n    endcase\n  end\n  assign uo_out = out;\n\n" +
    "  assign uio_out = 8'b0;\n  assign uio_oe  = 8'b0;\n  wire _unused = &{ena, " + (anyClock ? '' : 'clk, rst_n, ') + "uio_in[7:5], 1'b0};\nendmodule\n\n" +
    designs.map(moduleOf).join('\n');
}

/* What the chip must do: for each design, its selector number and its cases (clocked ones in order). */
export function chipCases(designs) {
  return designs.map((x, k) => ({ sel: k, seq: !!x.r.spec.seq, slug: x.d.slug, cases: X.cases(x.r.D, Object.assign({}, x.r.spec, { f: null })) }));
}

export function chipCocotb(designs) {
  const C = chipCases(designs);
  return '# SPDX-License-Identifier: Apache-2.0\n# Test for the Open Silicon Lab community chip: every design, selected in turn.\n\n' +
    'import cocotb\nfrom cocotb.clock import Clock\nfrom cocotb.triggers import ClockCycles, FallingEdge, Timer\n\n' +
    '# (selector, clocked, mask, [(ui_in, uo_out), ...]) for each design\nDESIGNS = [\n' +
    C.map(c => '    (' + c.sel + ', ' + (c.seq ? 'True' : 'False') + ', 0b' + X.outMask(designs[c.sel].r.spec).toString(2).padStart(8, '0') + ', [' + c.cases.map(x => '(' + x.ui + ', ' + x.uo + ')').join(', ') + ']),  # ' + c.slug).join('\n') + '\n]\n\n\n' +
    '@cocotb.test()\nasync def test_community_chip(dut):\n    clock = Clock(dut.clk, 10, unit="us")\n    cocotb.start_soon(clock.start())\n    dut.ena.value = 1\n\n' +
    '    for sel, clocked, mask, cases in DESIGNS:\n        dut.uio_in.value = sel\n        dut.ui_in.value = 0\n        dut.rst_n.value = 0\n        await ClockCycles(dut.clk, 2)\n        await FallingEdge(dut.clk)\n        dut.rst_n.value = 1\n' +
    '        for cycle, (ui, expected) in enumerate(cases):\n            dut.ui_in.value = ui\n            await Timer(1, unit="us")\n            got = int(dut.uo_out.value) & mask\n            assert got == expected, f"design {sel}, case {cycle}, ui_in={ui:08b}: uo_out={got:08b}, expected {expected:08b}"\n            if clocked:\n                await FallingEdge(dut.clk)\n\n' +
    '    dut._log.info(f"All {len(DESIGNS)} designs pass")\n';
}

const yq = s => '"' + String(s).replace(/["\\\n]/g, ' ') + '"';
export function chipInfoYaml(designs, top = 'tt_um_open_silicon_lab_community') {
  const authors = [...new Set(designs.map(x => x.d.author))];
  return '# Tiny Tapeout project information, generated by Open Silicon Lab\nproject:\n  title:        "Open Silicon Lab community chip"\n  author:       ' + yq(authors.join(', ').slice(0, 200)) + '\n  discord:      ""\n  description:  ' + yq(designs.length + ' small designs by learners, chosen with a selector') + '\n  language:     "Verilog"\n  clock_hz:     10\n\n  tiles: "1x1"\n\n  top_module:  ' + yq(top) + '\n\n  source_files:\n    - "project.v"\n\n' +
    'pinout:\n' + Array.from({ length: 8 }, (_, i) => '  ui[' + i + ']: "design input ' + i + '"').join('\n') + '\n\n' + Array.from({ length: 8 }, (_, i) => '  uo[' + i + ']: "design output ' + i + '"').join('\n') + '\n\n' +
    Array.from({ length: 8 }, (_, i) => '  uio[' + i + ']: ' + (i < 5 ? '"selector bit ' + i + '"' : '""')).join('\n') + '\n\n# Do not change!\nyaml_version: 6\n';
}

export function chipInfoMd(designs) {
  return '## How it works\n\nOne tile holds ' + designs.length + ' small designs by learners of [Open Silicon Lab](https://focusxyz11.github.io/open-silicon-lab/#community). Every design receives the inputs on `ui_in`; the selector on `uio_in[4:0]` picks which design drives `uo_out`.\n\n## The designs\n\n| Selector | Design | By | Inputs | Outputs |\n| --- | --- | --- | --- | --- |\n' +
    designs.map((x, k) => { const p = X.pinOrder(x.r.spec); return '| ' + k + ' | ' + x.d.title.replace(/\|/g, '/') + (x.r.spec.seq ? ' (clocked)' : '') + ' | ' + x.d.author.replace(/\|/g, '/') + ' | ' + p.ins.map((n, i) => 'ui[' + i + '] ' + n).join(', ') + ' | ' + p.outs.map((n, i) => 'uo[' + i + '] ' + n).join(', ') + ' |'; }).join('\n') +
    '\n\n## How to test\n\nSet the selector switches to a design\'s number, hold reset, then use the input switches. Clocked designs change at each clock tick. The cocotb test in `test/test.py` checks every design in turn.\n';
}

export function chipFiles(designs, top = 'tt_um_open_silicon_lab_community') {
  return [['src/project.v', chipVerilog(designs, top)], ['info.yaml', chipInfoYaml(designs, top)], ['test/test.py', chipCocotb(designs)], ['test/tb.v', X.tbV(top)], ['docs/info.md', chipInfoMd(designs)]];
}

/* A design file for the studio's current design, ready to add to community/<slug>/design.json. */
export function designFile({ slug, title, author, description, project, code, ins, outs, clocked, tests }, added) {
  const d = { slug, title, author, description: description || undefined, added, project: project || undefined, code };
  if (!project) Object.assign(d, { ins, outs, clocked: clocked || undefined, tests: clocked ? tests : undefined });
  const { slug: _s, ...file } = d;
  return JSON.stringify(file, null, 2) + '\n';
}
