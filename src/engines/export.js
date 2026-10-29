/* From simulation to silicon: turn a tiny-chip design into the files a real open-source chip
   flow reads. Verilog for Yosys and OpenROAD, wrapped in the Tiny Tapeout top-level interface
   (8 inputs, 8 outputs, 8 bidirectional pins), plus info.yaml, a cocotb testbench and a
   gate-level netlist. Pure logic, no DOM, so every file is unit-tested and checked in CI with
   Icarus Verilog and Yosys. */
import TC from './tinychip.js';

/* Verilog keywords a tiny-chip wire name could collide with. */
const KW = new Set('always and assign automatic begin buf bufif0 bufif1 case casex casez cell cmos config deassign default defparam design disable edge else end endcase endconfig endfunction endgenerate endmodule endprimitive endspecify endtable endtask event for force forever fork function generate genvar highz0 highz1 if ifnone incdir include initial inout input instance integer join large liblist library localparam macromodule medium module nand negedge nmos nor noshowcancelled not notif0 notif1 or output parameter pmos posedge primitive pull0 pull1 pulldown pullup pulsestyle_onevent pulsestyle_ondetect rcmos real realtime reg release repeat rnmos rpmos rtran rtranif0 rtranif1 scalared showcancelled signed small specify specparam strong0 strong1 supply0 supply1 table task time tran tranif0 tranif1 tri tri0 tri1 triand trior trireg unsigned use uwire vectored wait wand weak0 weak1 while wire wor xnor xor logic bit byte int'.split(' '));
const safe = n => (KW.has(n) || /^(ui_in|uo_out|uio_in|uio_out|uio_oe|ena|clk|rst_n|_unused)$/.test(n) ? 'w_' + n : n);

/* A unique, valid Tiny Tapeout top-module name: tt_um_ + letters, digits and underscores. */
export function topName(s) {
  const t = String(s || '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return 'tt_um_' + (t || 'my_design');
}
const NAMES = { seg: 'seg_decoder', free: 'my_design', add2: 'adder_2bit', alu: 'alu_slice' };
/* The module name for your logic: a valid Verilog identifier (it may not start with a digit). */
export const coreName = p => { const n = NAMES[p.id] || p.t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''); return /^[a-z_]/.test(n) ? n : 'm_' + n; };

/* Pin order on the chip: by default the order the project declares its inputs and outputs,
   with bit-numbered names put least-significant first so binary numbers read naturally. */
export function pinOrder(p) {
  const order = names => names.slice().sort((a, b) => { const ma = /^(.*?)(\d+)$/.exec(a), mb = /^(.*?)(\d+)$/.exec(b); if (ma && mb && ma[1] === mb[1]) return +ma[2] - +mb[2]; return names.indexOf(a) - names.indexOf(b); });
  return { ins: order(p.ins), outs: order(p.outs) };
}

function expr(e) {
  switch (e.op) {
    case 'const': return "1'b" + e.v;
    case 'var': return safe(e.n);
    case 'not': return '~' + expr(e.a);
    default: return '(' + expr(e.a) + ' ' + { and: '&', or: '|', xor: '^' }[e.op] + ' ' + expr(e.b) + ')';
  }
}
const strip = s => (s[0] === '(' && s[s.length - 1] === ')' && balanced(s.slice(1, -1)) ? s.slice(1, -1) : s);
function balanced(s) { let d = 0; for (const c of s) { if (c === '(') d++; if (c === ')') { d--; if (d < 0) return false; } } return d === 0; }

/* Your logic as a Verilog module: one continuous assignment per line you wrote. */
export function coreVerilog(D, p) {
  const name = coreName(p);
  const wires = D.order.filter(n => !p.outs.includes(n));
  return 'module ' + name + ' (\n' + p.ins.map(n => '    input  wire ' + safe(n)).concat(p.outs.map(n => '    output wire ' + safe(n))).join(',\n') + '\n);\n' +
    (wires.length ? '  wire ' + wires.map(safe).join(', ') + ';\n' : '') +
    D.order.map(n => '  assign ' + safe(n) + ' = ' + strip(expr(D.asg[n].e)) + ';').join('\n') + '\nendmodule\n';
}

/* The cells synthesis chose, as a structural netlist of Verilog gate primitives. */
const PRIM = { INV: 'not', BUF: 'buf', NAND2: 'nand', NOR2: 'nor', AND2: 'and', OR2: 'or', XOR2: 'xor', XNOR2: 'xnor' };
export function gatesVerilog(M, p) {
  const name = coreName(p) + '_gates';
  const lines = [];
  M.inputs.forEach(i => lines.push('  assign n' + i.net + ' = ' + safe(i.name) + ';'));
  M.cells.forEach((c, k) => {
    if (c.type === 'TIE0' || c.type === 'TIE1') lines.push('  assign n' + c.out + " = 1'b" + (c.type === 'TIE1' ? 1 : 0) + ';  // ' + c.type);
    else lines.push('  ' + PRIM[c.type] + ' g' + k + ' (n' + c.out + ', ' + c.ins.map(n => 'n' + n).join(', ') + ');  // ' + c.type);
  });
  M.outs.forEach(o => lines.push('  assign ' + safe(o.name) + ' = n' + o.net + ';'));
  const nets = Array.from({ length: M.nets }, (_, i) => 'n' + i);
  return 'module ' + name + ' (\n' + p.ins.map(n => '    input  wire ' + safe(n)).concat(p.outs.map(n => '    output wire ' + safe(n))).join(',\n') + '\n);\n' +
    '  wire ' + nets.join(', ') + ';\n' + lines.join('\n') + '\nendmodule\n';
}

/* The Tiny Tapeout top level: every pin assigned, unused inputs listed to avoid warnings. */
export function wrapper(p, top, inner) {
  const { ins, outs } = pinOrder(p);
  const nI = ins.length, nO = outs.length;
  const conn = ins.map((n, i) => '      .' + safe(n) + '(ui_in[' + i + '])').concat(outs.map((n, i) => '      .' + safe(n) + '(uo_out[' + i + '])'));
  const unusedIn = nI < 8 ? 'ui_in[7:' + nI + '], ' : '';
  return 'module ' + top + ' (\n' +
    '    input  wire [7:0] ui_in,    // Dedicated inputs\n' +
    '    output wire [7:0] uo_out,   // Dedicated outputs\n' +
    '    input  wire [7:0] uio_in,   // IOs: Input path\n' +
    '    output wire [7:0] uio_out,  // IOs: Output path\n' +
    '    output wire [7:0] uio_oe,   // IOs: Enable path (active high: 0=input, 1=output)\n' +
    '    input  wire       ena,      // always 1 when the design is powered, so you can ignore it\n' +
    '    input  wire       clk,      // clock\n' +
    '    input  wire       rst_n     // reset_n - low to reset\n' +
    ');\n\n' +
    '  // Your circuit. Inputs come in on ui_in, outputs go out on uo_out.\n' +
    '  ' + inner + ' core (\n' + conn.join(',\n') + '\n  );\n\n' +
    '  // All output pins must be assigned. Unused ones are tied to 0.\n' +
    (nO < 8 ? '  assign uo_out[7:' + nO + '] = ' + (8 - nO) + "'b0;\n" : '') +
    "  assign uio_out = 8'b0;\n  assign uio_oe  = 8'b0;\n\n" +
    '  // List all unused inputs to prevent warnings\n' +
    '  wire _unused = &{ena, clk, rst_n, ' + unusedIn + "uio_in, 1'b0};\n\nendmodule\n";
}

/* src/project.v: your logic plus the top level. useGates puts the synthesized netlist inside instead. */
export function projectV(D, p, top, opts = {}) {
  const head = '/*\n * ' + p.t + ', exported from Open Silicon Lab.\n * SPDX-License-Identifier: Apache-2.0\n */\n\n`default_nettype none\n\n';
  const inner = opts.gates ? gatesVerilog(opts.M, p) : coreVerilog(D, p);
  return head + wrapper(p, top, coreName(p) + (opts.gates ? '_gates' : '')) + '\n' + inner;
}

/* What the outputs must be for every input pattern, as numbers on ui_in and uo_out. */
export function cases(D, p) {
  const { ins, outs } = pinOrder(p);
  return TC.vectors(p.ins).map(v => {
    const want = p.f ? p.f(v) : TC.evalDesign(D, v);
    let ui = 0, uo = 0; ins.forEach((n, i) => { ui |= v[n] << i; }); outs.forEach((n, i) => { uo |= (want[n] & 1) << i; });
    return { ui, uo };
  });
}
export const outMask = p => (1 << p.outs.length) - 1;

/* test/test.py: a cocotb test that tries every input pattern. */
export function cocotbTest(D, p) {
  const C = cases(D, p), mask = outMask(p);
  return '# SPDX-License-Identifier: Apache-2.0\n# Exhaustive test for "' + p.t + '", exported from Open Silicon Lab.\n\n' +
    'import cocotb\nfrom cocotb.clock import Clock\nfrom cocotb.triggers import ClockCycles, Timer\n\n' +
    '# Every input pattern on ui_in and the value ' + (p.f ? 'the specification requires' : 'your design gives') + ' on uo_out.\n' +
    'CASES = [\n' + C.map(c => '    (0b' + c.ui.toString(2).padStart(8, '0') + ', 0b' + c.uo.toString(2).padStart(8, '0') + '),').join('\n') + '\n]\n' +
    'MASK = 0b' + mask.toString(2).padStart(8, '0') + '  # the output pins your design uses\n\n\n' +
    '@cocotb.test()\nasync def test_project(dut):\n' +
    '    clock = Clock(dut.clk, 10, unit="us")\n    cocotb.start_soon(clock.start())\n\n' +
    '    dut.ena.value = 1\n    dut.ui_in.value = 0\n    dut.uio_in.value = 0\n    dut.rst_n.value = 0\n    await ClockCycles(dut.clk, 2)\n    dut.rst_n.value = 1\n\n' +
    '    for ui, expected in CASES:\n        dut.ui_in.value = ui\n        await Timer(1, unit="us")\n        got = int(dut.uo_out.value) & MASK\n' +
    '        assert got == expected, f"ui_in={ui:08b}: uo_out={got:08b}, expected {expected:08b}"\n\n' +
    '    dut._log.info(f"All {len(CASES)} input patterns pass")\n';
}

/* test/tb.v: the template testbench, already pointing at your top module. */
export function tbV(top) {
  return '`default_nettype none\n`timescale 1ns / 1ps\n\n/* This testbench just instantiates the module and makes some convenient wires\n   that can be driven / tested by the cocotb test.py.\n*/\nmodule tb ();\n\n' +
    '  // Dump the signals to a FST file. You can view it with gtkwave or surfer.\n  initial begin\n    $dumpfile("tb.fst");\n    $dumpvars(0, tb);\n    #1;\n  end\n\n' +
    '  // Wire up the inputs and outputs:\n  reg clk;\n  reg rst_n;\n  reg ena;\n  reg [7:0] ui_in;\n  reg [7:0] uio_in;\n  wire [7:0] uo_out;\n  wire [7:0] uio_out;\n  wire [7:0] uio_oe;\n`ifdef GL_TEST\n  wire VPWR = 1\'b1;\n  wire VGND = 1\'b0;\n`endif\n\n' +
    '  ' + top + ' user_project (\n\n      // Include power ports for the Gate Level test:\n`ifdef GL_TEST\n      .VPWR(VPWR),\n      .VGND(VGND),\n`endif\n\n' +
    '      .ui_in  (ui_in),    // Dedicated inputs\n      .uo_out (uo_out),   // Dedicated outputs\n      .uio_in (uio_in),   // IOs: Input path\n      .uio_out(uio_out),  // IOs: Output path\n      .uio_oe (uio_oe),   // IOs: Enable path (active high: 0=input, 1=output)\n      .ena    (ena),      // enable - goes high when design is selected\n      .clk    (clk),      // clock\n      .rst_n  (rst_n)     // not reset\n  );\n\nendmodule\n';
}

const yq = s => '"' + String(s).replace(/["\\]/g, '') + '"';
/* info.yaml in the Tiny Tapeout format (yaml_version 6). */
export function infoYaml(p, top, author) {
  const { ins, outs } = pinOrder(p);
  const pin = (k, i, names) => '  ' + k + '[' + i + ']: ' + yq(names[i] || '');
  return '# Tiny Tapeout project information, exported from Open Silicon Lab\nproject:\n' +
    '  title:        ' + yq(p.t) + '\n  author:       ' + yq(author || '') + '\n  discord:      ""\n' +
    '  description:  ' + yq(p.d.split('. ')[0].replace(/\.$/, '') + '.') + '\n' +
    '  language:     "Verilog"\n  clock_hz:     0       # pure logic: no clock\n\n' +
    '  # How many tiles your design occupies?\n  tiles: "1x1"\n\n' +
    '  # Your top module name must start with "tt_um_" and be unique.\n  top_module:  ' + yq(top) + '\n\n' +
    '  source_files:\n    - "project.v"\n\n' +
    'pinout:\n  # Inputs\n' + Array.from({ length: 8 }, (_, i) => pin('ui', i, ins)).join('\n') +
    '\n\n  # Outputs\n' + Array.from({ length: 8 }, (_, i) => pin('uo', i, outs)).join('\n') +
    '\n\n  # Bidirectional pins\n' + Array.from({ length: 8 }, (_, i) => pin('uio', i, [])).join('\n') +
    '\n\n# Do not change!\nyaml_version: 6\n';
}

/* docs/info.md: the datasheet page for your project. */
export function infoMd(D, p) {
  const { ins, outs } = pinOrder(p);
  return '## How it works\n\n' + p.d + '\n\nThe logic, one line per wire:\n\n```\n' + D.order.map(n => n + ' = ' + strip(expr(D.asg[n].e)).replace(/1'b/g, '') + ';').join('\n') + '\n```\n\n' +
    'Designed, verified and laid out in [Open Silicon Lab](https://focusxyz11.github.io/open-silicon-lab/#tiny).\n\n' +
    '## How to test\n\nSet the input switches and read the outputs:\n\n' +
    ins.map((n, i) => '- `ui[' + i + ']` → ' + n).join('\n') + '\n' + outs.map((n, i) => '- `uo[' + i + ']` → ' + n).join('\n') + '\n\n' +
    'The cocotb test in `test/test.py` tries all ' + (1 << p.ins.length) + ' input patterns.\n\n## External hardware\n\nNone: the demo board\'s switches and LEDs are enough.\n';
}

/* A minimal ZIP writer (stored, no compression) so the whole project downloads as one file. */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
export function zip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  for (const [name, text] of files) {
    const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
    const local = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0)];
    parts.push(new Uint8Array(local), nb, data);
    central.push([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)], nb);
    off += local.length + nb.length + data.length;
  }
  let csize = 0; const cparts = central.map(x => { const a = x instanceof Uint8Array ? x : new Uint8Array(x); csize += a.length; return a; });
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(csize), ...u32(off), ...u16(0)]);
  const all = parts.concat(cparts, [end]); const out = new Uint8Array(all.reduce((s, a) => s + a.length, 0)); let p = 0; all.forEach(a => { out.set(a, p); p += a.length; });
  return out;
}

/* Every file for a Tiny Tapeout repository made from the template. */
export function ttFiles(D, M, p, top, author) {
  return [
    ['src/project.v', projectV(D, p, top)],
    ['info.yaml', infoYaml(p, top, author)],
    ['test/test.py', cocotbTest(D, p)],
    ['test/tb.v', tbV(top)],
    ['docs/info.md', infoMd(D, p)],
    ['gates/' + coreName(p) + '_gates.v', '// The cells Open Silicon Lab\'s synthesis chose, for comparison with what Yosys makes.\n// Not needed for the tapeout: Yosys synthesizes src/project.v itself.\n\n`default_nettype none\n\n' + gatesVerilog(M, p)]
  ];
}
