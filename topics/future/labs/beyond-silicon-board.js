/* Lab: BEYOND-SILICON BOARD */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function beyond(){
const box=$('#bsBoard');if(!box)return;
const ST=['Research lab','Prototype chips','Early products','Shipping'];
const CAT={cmp:['Computing','var(--violet)'],dev:['Transistors','var(--amber)'],mem:['Memory','var(--cyan)'],int:['Interconnect & packaging','var(--rose)']};
/* name, category, stage 1-4, when it could matter, what it changes, obstacle, latest signal */
const B=[
 ['Chiplets & 3D stacking','int',4,'Now','Builds huge processors from smaller dies, and stacks memory and logic on top of each other.','Heat trapped in stacks, and testing every die before assembly.','Every leading AI GPU is built from chiplets, and hybrid bonding is on HBM roadmaps.'],
 ['Backside power delivery','dev',4,'Now','Feeds power from under the transistors, freeing wiring space on top and cutting voltage loss.','Wafer bonding and thinning add cost and steps.','Intel 18A ships with PowerVia; TSMC A16 with Super Power Rail arrives in the second half of 2026.'],
 ['Embedded MRAM','mem',4,'Now, in niches','Magnetic memory that keeps data without power, replacing flash inside microcontrollers.','Not dense or fast enough to replace SRAM caches yet.','Offered by major foundries at 22 nm and below for cars and IoT chips.'],
 ['Co-packaged optics','int',3,'2026–2030','Moves the optics right next to switch and GPU chips, so data leaves as light and network power falls.','Laser reliability, field repair, and scarce advanced-packaging capacity.','NVIDIA Spectrum-X Photonics switches entered production in May 2026; TrendForce expects co-packaged optics to grow from about 0.5% of AI optical links in 2026 to around 35% by 2030.'],
 ['Analog in-memory computing','cmp',3,'2027–2032','Does the multiply-adds of AI inside memory arrays using currents, avoiding most data movement.','Noise and limited precision; models often need retraining, and mixed-signal design is hard to scale.','EnCharge AI launched its EN100 inference accelerator in 2025; IBM Research has built analog AI chips.'],
 ['Glass package substrates','int',2,'Around 2028–2030','Flatter, more stable package cores that allow larger AI packages with finer wiring.','New factories and handling processes for glass.','Intel, Samsung and substrate makers are developing glass-core substrates.'],
 ['Photonic computing','cmp',2,'2030s','Performs matrix math with light, potentially at very low energy per operation.','Converting between light and electronics eats much of the gain, and light is hard to store or switch.','Lightmatter showed a photonic processor running real AI models in Nature (2025), while focusing its business on optical interconnect.'],
 ['Neuromorphic chips','cmp',2,'2030s, in sensors and robots','Spiking, brain-like circuits that use energy only when events happen.','Few algorithms and tools; hard to beat GPUs on mainstream AI.','Intel\'s Hala Point system (2024) packs 1.15 billion artificial neurons; IBM\'s NorthPole chip merges memory and compute.'],
 ['Quantum computers','cmp',2,'2029+ for first fault-tolerant machines','Large speedups on specific problems such as chemistry, materials and code-breaking, but not AI training.','Error correction needs hundreds to thousands of physical qubits per reliable logical qubit.','Google\'s Willow (2024) showed errors falling as its code grew; IBM targets the fault-tolerant Starling for 2029; the US awarded about $2 billion of CHIPS quantum incentives in May 2026.'],
 ['Thermodynamic & probabilistic chips','cmp',1,'2030s','Hardware that uses physical noise to sample probabilities, a natural fit for generative AI.','Unproven at scale; needs new algorithms and software.','Startups including Extropic and Normal Computing showed first chips in 2025.'],
 ['Superconducting logic','cmp',1,'2030s or later','Logic with almost no resistance, promising very high efficiency for data centers.','Must run near −269 °C, and cooling costs much of the gain; low density.','imec runs a superconducting digital program, and the startup Snowcap Compute raised seed funding in 2025.'],
 ['2D-material transistors','dev',1,'Late 2030s','Channels a single layer of atoms thick, letting transistors keep shrinking.','Growing defect-free films on 300 mm wafers and making low-resistance contacts.','imec\'s roadmap places 2D channels near the end of the 2030s.'],
 ['Carbon nanotube transistors','dev',1,'Uncertain','Fast, efficient transistors that can be built at low temperature on top of other layers.','Purifying and placing nanotubes precisely by the billion.','MIT built a 16-bit nanotube processor in 2019; progress toward manufacturing has been slow.'],
 ['Reversible computing','cmp',1,'2030s or later','Recycles the energy of each logic operation instead of turning it into heat.','Slower clocks and more complex circuits.','Startups such as Vaire Computing are building early test chips.']
];
let flt='all',sel=3;
$('#bsF').innerHTML=[['all','All']].concat(Object.entries(CAT).map(([k,v])=>[k,v[0]])).map(f=>'<button type="button" data-f="'+f[0]+'">'+f[1]+'</button>').join('');
$('#bsF').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{flt=b.dataset.f;render();}));
function render(){$('#bsF').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===flt?'true':'false'));
 box.innerHTML=ST.map((s,si)=>'<div class="mcol"><p class="code">'+(si+1)+' · '+s+'</p>'+B.map((b,i)=>[b,i]).filter(([b])=>b[2]===si+1).map(([b,i])=>'<button type="button" data-i="'+i+'" style="--c:'+CAT[b[1]][1]+'"'+(flt!=='all'&&b[1]!==flt?' class="dim"':'')+' aria-pressed="'+(i===sel)+'"><b>'+b[0]+'</b><small>'+b[3]+'</small></button>').join('')+'</div>').join('');
 box.querySelectorAll('button').forEach(x=>x.addEventListener('click',()=>{sel=+x.dataset.i;render();}));
 const b=B[sel];$('#bsDetail').innerHTML='<div><div class="row"><span class="limtag" style="--c:'+CAT[b[1]][1]+'">'+CAT[b[1]][0]+'</span><span class="pill '+['out','proj','ann','ship'][b[2]-1]+'">'+ST[b[2]-1]+'</span></div><h3>'+b[0]+'</h3><p class="small muted">When it could matter: '+b[3]+'</p></div><dl><div><dt>What it would change</dt><dd>'+b[4]+'</dd></div><div><dt>What stands in the way</dt><dd>'+b[5]+'</dd></div><div><dt>Latest signal</dt><dd>'+b[6]+'</dd></div></dl>';}
render();
})();
}
