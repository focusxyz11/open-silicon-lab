/* Lab: ECOSYSTEM */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function eco(){
const E=[
 ['IP','Instruction sets & IP','Arm, RISC-V International, Synopsys IP, Cadence IP, Imagination','Most chips license building blocks: CPU cores from Arm or open RISC-V designs, plus memory and I/O interfaces. Few companies design every block themselves.','Arm\'s architecture runs in nearly every phone and in NVIDIA\'s Vera and Grace CPUs.'],
 ['EDA','Design software (EDA)','Synopsys, Cadence, Siemens EDA','Three companies supply almost all professional chip design software. No leading chip can be designed without their tools and the foundry rule files they support.','A chokepoint. Tools can make up 10–40% of a chip\'s design budget, by some estimates. All three launched autonomous AI agents in 2026.'],
 ['DES','Chip designers','NVIDIA, AMD, Apple, Qualcomm, Broadcom, Google (TPU), Amazon (Trainium), MediaTek, Intel','Companies that design chips. Most are "fabless" and pay a foundry to manufacture. Cloud giants increasingly design custom AI chips, often with Broadcom or Marvell as design partners.','Custom AI ASICs are a fast-growing share of high-end accelerators.'],
 ['EQP','Equipment','ASML, Applied Materials, Lam Research, Tokyo Electron, KLA','The machines in the fab: lithography, deposition, etch, polishing, inspection. A new leading-edge fab costs tens of billions of dollars, much of it in tools.','A chokepoint. ASML is the only maker of EUV scanners, and High-NA tools cost around $400 million each.'],
 ['MAT','Materials','Shin-Etsu, SUMCO (wafers); JSR, Tokyo Ohka (resists); gas and chemical suppliers','Ultra-pure silicon wafers, photoresists, specialty gases and chemicals. Purity is measured in parts per billion.','Concentrated in Japan for wafers and resists.'],
 ['FAB','Foundries','TSMC, Samsung Foundry, Intel Foundry, SMIC, Rapidus, GlobalFoundries','Factories that manufacture chips for others. TSMC leads the most advanced nodes (N2 in volume since Q4 2025, A16 in 2H 2026). Intel 18A is in production. Rapidus targets 2 nm in Japan.','A chokepoint. TSMC makes nearly all of the world\'s leading AI chips.'],
 ['MEM','Memory','SK hynix, Samsung, Micron','DRAM and HBM makers. HBM is sold out well ahead and is often the limiting factor on how many AI GPUs can ship.','SK hynix holds the largest share of HBM4 supply in 2026, by analyst estimates.'],
 ['PKG','Packaging & test','TSMC (CoWoS, SoIC), ASE, Amkor, JCET','Assemble dies and memory into packages and test them. Advanced packaging used to be an afterthought; it is now a strategic bottleneck.','TSMC holds about 70% of CoWoS-class capacity in 2026, by brokerage estimates, and outsources some steps to Amkor and ASE.'],
 ['SYS','Systems','Foxconn, Quanta, Wistron, Supermicro, Dell, HPE','Build servers and racks around the packages: boards, power, liquid cooling, networking and optics.','A single AI rack now involves thousands of parts and draws power like a small building.'],
 ['USE','Users','Cloud providers, AI labs, enterprises, phone and PC makers','The buyers who run AI models and ship devices. Their workloads feed straight back into the next chip\'s specification, closing the loop.','Hyperscaler spending on AI infrastructure drives much of the industry\'s growth.']
];
let cur=5;const box=$('#eco');
E.forEach((e,i)=>{const b=document.createElement('button');b.innerHTML='<span class="code">'+String(i+1).padStart(2,'0')+' · '+e[0]+'</span><b>'+e[1]+'</b><small>'+e[2]+'</small>';b.addEventListener('click',()=>{cur=i;show();});box.appendChild(b);});
function show(){[...box.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===cur?'true':'false'));const e=E[cur];
 $('#ecoDetail').innerHTML='<div class="prose"><h3>'+e[1]+'</h3><p>'+e[3]+'</p><div class="chips">'+e[2].split(/[,;] ?/).map(s=>'<span>'+s.trim()+'</span>').join('')+'</div></div><div class="callout"><p class="code">Why it matters</p><p>'+e[4]+'</p></div>';}
show();
})();
}
