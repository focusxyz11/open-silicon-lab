/* Lab: DESIGN FLOW */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function flow(){
const F=[
 ['SPEC','Specification','Decide what the chip must do: target workloads, speed, power budget, cost and which manufacturing process to use.','A written spec and a performance model of the target workloads.','AI makes it easier to explore many what-if architectures quickly, but the goals are still set by people.'],
 ['ARCH','Architecture','Sketch the block diagram: how many cores, how much cache, which memory and interconnect. Teams test ideas with fast software models long before any hardware exists.','A block diagram and a cycle-level simulator.','Large AI models are themselves the main workload, so architects co-design chips with model teams.'],
 ['RTL','RTL design','Engineers write register-transfer level (RTL) code in Verilog or SystemVerilog. It describes what every register and logic block does on each clock tick. Try the full adder below.','Millions of lines of RTL code.','Coding agents now draft RTL and testbenches. Cadence\'s ChipStack agent claims up to 10× speedups on selected tasks.'],
 ['VERIF','Verification','Prove the RTL does exactly what the spec says, using billions of simulated cycles, formal proofs and hardware emulators. This is often the largest share of engineering effort; for a large chip, front-end verification typically occupies a team for 4–6 months.','Coverage reports showing every behavior was tested.','In July 2026 Synopsys showed an autonomous verification agent that plans tests, closes coverage and debugs on its own, claiming up to 50× faster time to validated RTL. Siemens added self-verifying agents that check their decisions against physics-based tools.'],
 ['SYN','Logic synthesis','A synthesis tool compiles RTL into a netlist of standard cells (NAND, NOR, flip-flops) from the foundry\'s cell library.','A gate-level netlist.','Machine-learning models predict timing and congestion early so synthesis choices are better informed.'],
 ['FLOOR','Floorplan','Place the large blocks first: SRAM macros, memory interfaces, I/O, and plan the power grid that feeds every transistor.','A floorplan and power plan.','Reinforcement learning has been used to place large macros, an approach popularized by Google\'s research on TPU floorplans.'],
 ['PLACE','Placement','Position every standard cell so wires are short and no region is overcrowded. See the simulation in stage 03.','Every cell has an exact location.','Synopsys DSO.ai (2020) and Cadence Cerebrus use reinforcement learning to search tool settings that humans would never have time to try.'],
 ['CTS','Clock tree','Build a tree of buffers that delivers the clock to every flip-flop at almost the same instant, within a few picoseconds.','A balanced clock network.','Agents tune clock tree settings across many runs in parallel on GPU-accelerated EDA tools.'],
 ['ROUTE','Routing','Draw every wire on 15 or more stacked metal layers without breaking the foundry\'s spacing rules.','Fully connected layout.','More than 20 Synopsys EDA and multiphysics products are now GPU-accelerated, shrinking long runs.'],
 ['SIGN','Sign-off','Check everything: timing on every path at every voltage and temperature corner, power, voltage drop, heat, and thousands of design rules (DRC) and layout-versus-schematic (LVS) checks.','A clean bill of health.','Agents triage violation reports and propose fixes. Final sign-off still uses deterministic, physics-based engines.'],
 ['TAPE','Tape-out','Send the final layout (GDSII or OASIS file) to the foundry. Mask makers turn each layer into a photomask.','A mask set, one mask per patterned layer.','The name dates from when layouts were shipped on magnetic tape.'],
 ['BRING','Bring-up','First chips return months later. Engineers power them on, run tests, find bugs and decide whether a re-spin is needed.','Working silicon and a production test program.','AI agents help analyze test data and failing waveforms. ChipAgents demonstrated multi-agent debugging at DVCon 2026.']
];
const box=$('#flow');let cur=3;
F.forEach((s,i)=>{const b=document.createElement('button');b.innerHTML='<span>'+String(i+1).padStart(2,'0')+' '+s[0]+'</span><b>'+s[1]+'</b>';b.addEventListener('click',()=>{cur=i;show();});box.appendChild(b);});
function show(){const s=F[cur];[...box.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===cur?'true':'false'));
 $('#flowText').innerHTML='<h3>'+s[1]+'</h3><p>'+s[2]+'</p><p class="muted small"><b>Output:</b> '+s[3]+'</p>';
 $('#flowAI').innerHTML='<p class="eyebrow">AI in this step, 2026</p><p>'+s[4]+'</p>'+(cur===3||cur===2?'<p class="muted small">The wider trend: at the 2026 Design Automation Conference, Synopsys, Cadence and Siemens all shipped agents for long-running autonomous design work. In September 2026 OpenAI and Synopsys announced GPT-Synopsys, a model built to operate EDA tools directly.</p>':'');}
show();
})();
}
