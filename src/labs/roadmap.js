/* Lab: ROADMAP */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function road(){
const TR=['Transistor','Lithography','Memory & packaging','AI chips','Design tools'];
const D=[
 [2011,0,'FinFET enters production','Intel 22 nm. The gate wraps three sides of a fin.','ship'],
 [2019,1,'EUV in high-volume manufacturing','13.5 nm light replaces multi-patterned 193 nm on critical layers.','ship'],
 [2020,4,'Reinforcement learning tunes chip layouts','Synopsys DSO.ai searches tool settings automatically.','ship'],
 [2022,0,'First gate-all-around transistors','Samsung 3 nm (MBCFET).','ship'],
 [2022,3,'H100 with HBM3','3.35 TB/s of memory bandwidth.','ship'],
 [2024,1,'First commercial High-NA EUV installed','Intel integrates ASML\'s first EXE system in Oregon.','ship'],
 [2025,0,'TSMC N2 volume production','TSMC\'s first nanosheet node, Q4 2025. Intel 18A adds backside power (PowerVia).','ship'],
 [2025,3,'Blackwell B200 / GB300','208 billion transistors, 8 TB/s HBM3E.','ship'],
 [2026,2,'HBM4 mass production','2,048-bit interface; Samsung starts in February, others through Q2.','ship'],
 [2026,4,'Multi-agent design workflows','March: Synopsys AgentEngineer, Cadence ChipStack, Siemens Fuse agents.','ship'],
 [2026,1,'1,000 W EUV source demonstrated','February: ASML reports a path to about 330 wafers per hour by 2030, up from about 230 today.','ann'],
 [2026,1,'First High-NA chips ship','July: select Intel 18A layers in Panther Lake printed with High-NA EUV.','ship'],
 [2026,4,'Autonomous verification agents','July, DAC: Synopsys claims up to 50× faster to validated RTL. September: OpenAI and Synopsys announce GPT-Synopsys.','ann'],
 [2026,3,'Arm unveils its own chip','March: the AGI CPU, 136 Neoverse V3 cores on TSMC N3P, co-designed with Meta. Arm moves beyond licensing.','ann'],
 [2026,3,'Vera Rubin NVL72','336B-transistor GPUs, 288 GB HBM4 each, shipping 2H 2026. AMD MI400 / Helios with 432 GB HBM4.','ship'],
 [2026,0,'TSMC N2P and A16','A16 adds Super Power Rail backside power: 8–10% faster or 15–20% less power than N2P.','ann'],
 [2026,2,'Co-packaged optics go commercial','Optical engines move into the package; TSMC folds COUPE into CoWoS.','ann'],
 [2027,2,'Panel-level packaging pilot','TSMC CoPoS pilot line targeted for mid-2027 to escape round-wafer size limits.','ann'],
 [2027,3,'Rubin Ultra with HBM4E','NVIDIA\'s next step, planned for 2H 2027.','ann'],
 [2027,1,'High-NA for a full node','Intel 14A is planned to use High-NA broadly.','ann'],
 [2028,0,'TSMC A14','Next-generation nanosheet node; A14 with backside power follows in 2029.','ann'],
 [2031,0,'A10: last plain nanosheet node','imec projects gate pitch stalls near 42 nm from here.','proj'],
 [2033,0,'CFET arrives at A7','n- and p-type transistors stacked on each other. imec places it around 2033–34.','proj'],
 [2034,4,'Agents run spec-to-layout loops','Engineers define goals and sign off while agents iterate through design and verification. Our outlook, not a vendor plan.','out'],
 [2036,0,'A5 with stacked CFET','Smaller cells from vertical stacking rather than shrinking pitch.','proj'],
 [2038,1,'Hyper-NA EUV may be needed','imec notes A3 targets may require NA around 0.75.','proj'],
 [2038,0,'A3: bonded CFET','Tiers built separately and bonded together.','proj'],
 [2043,0,'2D-material transistors at A2','Atom-thin channels such as MoS₂ replace silicon sheets.','proj']
];
const tk=$('#rmTracks');let on=new Set(TR.map((_,i)=>i));
const all=document.createElement('button');all.textContent='All tracks';all.addEventListener('click',()=>{on=new Set(TR.map((_,i)=>i));upd();});tk.appendChild(all);
TR.forEach((t,i)=>{const b=document.createElement('button');b.textContent=t;b.addEventListener('click',()=>{on=new Set([i]);upd();});tk.appendChild(b);});
const R=$('#rmR');R.addEventListener('input',upd);
const pl={ship:'<span class="pill ship">Shipping</span>',ann:'<span class="pill ann">Announced</span>',proj:'<span class="pill proj">Projection</span>',out:'<span class="pill out">Outlook</span>'};
function upd(){
 const y=+R.value;$('#rmYear').textContent=y;
 const allOn=on.size===TR.length;[...tk.children].forEach((b,k)=>b.setAttribute('aria-pressed',(k===0&&allOn)||(!allOn&&on.has(k-1))?'true':'false'));
 $('#rmSnap').innerHTML=TR.map((t,i)=>{const it=D.filter(d=>d[1]===i&&d[0]<=y).pop();return '<div><span class="eyebrow">'+t+'</span>'+(it?'<b>'+it[2]+'</b><p>'+it[0]+' · '+it[3]+'</p>'+pl[it[4]]:'<p>Nothing on this track yet.</p>')+'</div>';}).join('');
 $('#rmList').innerHTML=D.filter(d=>on.has(d[1])).map(d=>'<div class="it'+(d[0]>y?' future':'')+'"><span class="y">'+d[0]+'</span><span class="trk">'+TR[d[1]]+'</span><div><b>'+d[2]+'</b><p>'+d[3]+'</p></div>'+pl[d[4]]+'</div>').join('');
}
upd();
})();
}
