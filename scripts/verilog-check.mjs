// Runs every tiny-chip project's exported Verilog through real open-source chip tools:
// Icarus Verilog simulates the Tiny Tapeout top level (RTL and gate netlist) against every input
// pattern, and Yosys synthesizes it. Needs iverilog and yosys on the PATH (CI installs them);
// without them it says so and exits cleanly, unless --require is given.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import TC from '../src/engines/tinychip.js';
import * as X from '../src/engines/export.js';

const has = cmd => { try { execFileSync('sh', ['-c', 'command -v ' + cmd], { stdio: 'ignore' }); return true; } catch (e) { return false; } };
const require = process.argv.includes('--require');
if (process.env.GITHUB_ACTIONS) { try { const v = execFileSync('sh', ['-c', 'iverilog -V 2>&1 | head -1; yosys -V 2>&1 | head -1'], { encoding: 'utf8' }); console.log('::notice title=Tools::' + v.replace(/\n/g, ' | ')); } catch (e) { /* ignore */ } }
if (!has('iverilog') || !has('yosys')) {
  const msg = 'Verilog check skipped: iverilog and yosys are not installed (CI runs it).';
  if (require) { console.error(msg); process.exit(1); }
  console.log(msg); process.exit(0);
}

/* A plain Verilog testbench: drive every pattern on ui_in, compare uo_out with the expected value. */
function bench(top, C, mask) {
  return '`timescale 1ns / 1ps\nmodule check;\n  reg [7:0] ui_in = 0, uio_in = 0;\n  reg clk = 0, rst_n = 1, ena = 1;\n  wire [7:0] uo_out, uio_out, uio_oe;\n  integer errors = 0;\n' +
    '  ' + top + ' dut (.ui_in(ui_in), .uo_out(uo_out), .uio_in(uio_in), .uio_out(uio_out), .uio_oe(uio_oe), .ena(ena), .clk(clk), .rst_n(rst_n));\n' +
    '  task check_case(input [7:0] ui, input [7:0] uo); begin ui_in = ui; #1; if ((uo_out & 8\'d' + mask + ') !== uo) begin errors = errors + 1; $display("FAIL ui_in=%b uo_out=%b expected %b", ui, uo_out, uo); end end endtask\n' +
    '  initial begin\n' + C.map(c => '    check_case(8\'d' + c.ui + ', 8\'d' + c.uo + ');').join('\n') + '\n' +
    '    if (uio_oe !== 8\'b0) begin errors = errors + 1; $display("FAIL uio_oe not zero"); end\n' +
    '    if (errors == 0) $display("PASS"); else $display("ERRORS %0d", errors);\n    $finish;\n  end\nendmodule\n';
}

const dir = mkdtempSync(join(tmpdir(), 'osl-verilog-'));
const problems = []; let runs = 0;
try {
  for (const p of TC.PROJ) {
    for (const [code, kind] of [[p.sol, 'solution'], [p.starter, 'starter']]) {
      if (!code) continue;
      const D = TC.parse(code, p.ins, p.outs); if (D.errs.length) { problems.push(p.id + ' ' + kind + ': does not parse'); continue; }
      /* The testbench checks what the design does: for a buggy starter that is its (wrong) behaviour. */
      const C = TC.vectors(p.ins).map(v => { const o = TC.evalDesign(D, v); const { ins, outs } = X.pinOrder(p); let ui = 0, uo = 0; ins.forEach((n, i) => { ui |= v[n] << i; }); outs.forEach((n, i) => { uo |= (o[n] & 1) << i; }); return { ui, uo }; });
      for (const lib of ['rtl', 'basic', 'nand']) {
        const top = X.topName('check_' + p.id + '_' + kind + '_' + lib);
        const M = lib === 'rtl' ? null : TC.synth(D, p.ins, p.outs, lib, false, '130').M;
        const src = X.projectV(D, p, top, lib === 'rtl' ? {} : { gates: true, M });
        const f = join(dir, top + '.v'), tb = join(dir, top + '_tb.v'), out = join(dir, top + '.vvp');
        writeFileSync(f, src); writeFileSync(tb, bench(top, C, X.outMask(p)));
        try {
          execFileSync('iverilog', ['-g2005', '-Wall', '-o', out, tb, f], { stdio: 'pipe' });
          const r = execFileSync('vvp', ['-n', out], { encoding: 'utf8' });
          if (!/\bPASS\b/.test(r)) problems.push(`${p.id} ${kind} ${lib}: simulation\n${r}`);
        } catch (e) { problems.push(`${p.id} ${kind} ${lib}: iverilog failed\n${e.stderr || e.message}`); }
        runs++;
      }
      /* Yosys: read the RTL file and synthesize the top module, as the Tiny Tapeout flow does first. */
      const top = X.topName('yosys_' + p.id + '_' + kind);
      const f = join(dir, top + '.v'); writeFileSync(f, X.projectV(D, p, top));
      try {
        execFileSync('yosys', ['-q', '-p', `read_verilog ${f}; synth -top ${top}; check -assert`], { encoding: 'utf8', stdio: 'pipe' });
      } catch (e) { problems.push(`${p.id} ${kind}: yosys failed\n${e.stderr || e.stdout || e.message}`); }
    }
  }
} finally { rmSync(dir, { recursive: true, force: true }); }

if (problems.length) {
  console.error(problems.join('\n\n'));
  /* In GitHub Actions, also report each problem as an annotation so it shows on the pull request. */
  if (process.env.GITHUB_ACTIONS) problems.slice(0, 10).forEach(p => console.log('::error title=Verilog check::' + p.slice(0, 1500).replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A')));
  process.exit(1);
}
console.log(`Verilog check passed: ${runs} Icarus simulations and every project synthesized by Yosys.`);
