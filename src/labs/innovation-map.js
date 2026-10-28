/* Lab: INNOVATION MAP */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function inno(){
const LIM={ai:['AI accelerates','Mostly data and computation. Agents and models already speed it up.'],invent:['Needs invention','Limited by physics and materials. Requires new science and engineering.'],capital:['Needs capital & time','The know-how exists. Limited by money, factories and years of building.'],people:['Needs people & rules','Limited by skills, judgment, accountability, permits or policy.']};
const GR=['Design','Masks & litho','Fab process','Fab capacity','Memory & package','Systems','People & rules'];
const I=[
 ['Architecture & spec',0,4,6,3,0.3,'people','Models explore design options and predict performance; agents draft specifications.','Better ways to simulate tomorrow\'s AI workloads before they exist.','Choosing what to build is a business and technical bet that people own.'],
 ['RTL coding',0,7,9,1,0.1,'ai','Coding agents draft RTL and testbenches. Cadence says its ChipStack agent speeds selected tasks up to 10×.','Little new physics; mostly better models trained on hardware code, which is scarce and secret.','Engineers review and own the code. RTL is closely guarded IP, which limits training data and raises security questions.'],
 ['Verification',0,8,9,2,0.1,'ai','Autonomous agents plan tests, close coverage and debug. Synopsys claims up to 50× faster time to validated RTL (July 2026).','Formal methods that scale to whole chips.','Someone must decide the coverage plan is complete and sign that the chip is correct.'],
 ['Physical design',0,7,8.5,2,0.1,'ai','Reinforcement learning tunes place-and-route; more than 20 Synopsys tools are GPU-accelerated; Cadence and Siemens agents orchestrate runs.','New methods for 3D-stacked chips and backside power layouts.','Experts set constraints and resolve trade-offs between speed, power and area.'],
 ['Sign-off & tape-out',0,4,5.5,2,0.1,'people','Agents triage thousands of timing and rule violations and propose fixes.','Deterministic, physics-based checkers remain the referee.','A tape-out commits millions of dollars of masks; a person signs off and is accountable.'],
 ['Computational lithography',1,8,9,3,0.3,'ai','GPU and AI acceleration is in production at TSMC; NVIDIA reports 20–50% better cost or cycle time with cuLitho (2026).','Curvilinear masks and better models of resist chemistry.','A small pool of experts, tightly tied to each fab\'s process.'],
 ['Mask making',1,4,5,5,1,'capital','Machine learning speeds mask inspection and mask data preparation.','Multi-beam mask writers, better EUV pellicles and defect-free mask blanks.','A small specialist supply base with long tool lead times.'],
 ['EUV scanners',1,2,3,9,2.5,'invent','AI helps monitor tool health and tune calibration.','Higher source power (1,000 W demonstrated in 2026), the High-NA ramp, and Hyper-NA for the 2030s.','Only ASML makes them, and each machine takes months to build, ship and install.'],
 ['Resists & stochastics',1,4,6,9,2,'invent','AI-driven materials discovery screens candidate chemistries.','Resists that capture more of each scarce EUV photon without blurring, such as metal-oxide and dry resists.','Chemistry know-how is concentrated in a few firms, mostly in Japan.'],
 ['New transistors (CFET, 2D)',2,3,5,10,5,'invent','Accelerated simulation narrows experiments; NVIDIA claims about 50× faster materials simulation with cuEST.','Stacked n- and p-type devices; growing and doping 2D channels across a whole wafer.','Ten-year research cycles through imec and company R&D labs.'],
 ['Deposition & etch',2,4,6,7,1.5,'invent','Tools use machine learning to match chambers and tune recipes.','Atomic-layer etch, very deep high-aspect-ratio etch, and new metals such as ruthenium.','Process engineers still tune each new layer by hand and experience.'],
 ['Inspection & metrology',2,7,8.5,5,1,'ai','Vision AI classifies defects; TSMC began adopting NVIDIA tools for this in 2026.','Faster electron-beam inspection to see defects too small for light.','Engineers decide which defects actually matter.'],
 ['Yield learning',2,6,8,3,1,'people','Virtual metrology and advanced process control predict problems from sensor data; digital twins model whole fabs.','Data sharing between tool makers and fabs.','Veteran engineers\' tacit experience is still the core of a fast yield ramp.'],
 ['Building fabs',3,2,3,2,3,'capital','Digital twins plan layouts, utilities and logistics.','Faster construction; TSMC aims for about two years per Arizona fab.','Permits, construction crews and utilities, at $25–35 billion per 2 nm-class module (estimate).'],
 ['Silicon, gases & chemicals',3,2,3,4,2,'capital','Supply-chain forecasting.','Ultra-pure supply from more regions.','Concentrated suppliers; trade policy matters.'],
 ['HBM memory',4,3,4,7,2,'capital','Machine learning improves yield and test of stacked dies.','16-high stacks, hybrid bonding, custom logic base dies.','Three suppliers, with capacity sold out well ahead.'],
 ['Advanced packaging',4,3,4.5,7,1.5,'capital','Cadence\'s AuraStack agent claims up to 20× faster package multiphysics analysis.','Panel-level packaging (TSMC CoPoS pilot in 2027), glass substrates, hybrid bonding.','New capacity takes years and billions of dollars.'],
 ['Co-packaged optics',4,2,3,8,2,'invent','Design tools model photonics together with electronics.','Reliable lasers, fiber attach at volume, and common standards.','A new supply chain that is still forming.'],
 ['Testing',4,6,7.5,3,0.5,'ai','Adaptive test uses machine learning to skip unneeded tests and catch outliers.','Testing stacked dies that can\'t be probed directly.','Quality sign-off for customers.'],
 ['Power & cooling',5,3,4,6,4,'capital','AI tunes cooling and power distribution inside data centers.','Liquid cooling everywhere, higher-voltage power delivery, new generation capacity.','Grid connections and permits can take years.'],
 ['Software stack',5,8,9.5,3,0.1,'ai','AI writes and tunes kernels, compilers and drivers.','Software that is portable across chip vendors.','Developers choose ecosystems, and switching is slow.'],
 ['Workforce',6,3,4,1,5,'people','AI assistants help train technicians and capture expert knowledge.','Training pipelines: only about 3% of US engineering graduates join the industry each year.','SEMI Foundation (2026): a US shortfall of up to 157,000 workers, possibly by 2030.'],
 ['Policy & standards',6,1,1.5,1,2,'people','Little direct help from AI.','Open standards for chiplets (UCIe) and memory (JEDEC).','Export controls, subsidies and trade rules shape who can build and buy what.']
];
let sel=2,filt=null,yr=0,anim=0,raf=0;let pts=[];
const leadTxt=l=>l<0.5?'weeks to months':l<1.2?'about a year':'about '+l+' years';
$('#imKey').innerHTML=Object.keys(LIM).map(k=>'<div style="--c:var(--'+LIMC[k]+')"><b>'+LIM[k][0]+'</b><span>'+LIM[k][1]+'</span></div>').join('');
$('#imChain').innerHTML=GR.map((g,gi)=>'<div class="grp"><p>'+g+'</p>'+I.map((it,i)=>it[1]!==gi?'':'<button data-i="'+i+'" style="--c:var(--'+LIMC[it[6]]+')"><span>'+String(i+1).padStart(2,'0')+'</span>'+it[0]+'<i style="--w:'+it[2]*10+'%"></i></button>').join('')+'</div>').join('');
$('#imChain').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{sel=+b.dataset.i;refresh();}));
const fl=$('#imFilter');[['all','All']].concat(Object.keys(LIM).map(k=>[k,LIM[k][0]])).forEach(([k,t])=>{const b=document.createElement('button');b.textContent=t;b.dataset.k=k;b.addEventListener('click',()=>{filt=k==='all'?null:k;refresh();});fl.appendChild(b);});
$('#imYear').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{yr=+b.dataset.y;refresh();if(!raf)step();}));
function step(){const tgt=yr;anim+=(tgt-anim)*(RM?1:0.12);if(Math.abs(tgt-anim)<0.005)anim=tgt;draw();raf=anim!==tgt?requestAnimationFrame(step):0;}
function refresh(){$('#imChain').querySelectorAll('button').forEach(b=>{const i=+b.dataset.i;b.setAttribute('aria-pressed',i===sel?'true':'false');b.classList.toggle('dim',!!filt&&I[i][6]!==filt);});
 fl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.k==='all'&&!filt)||b.dataset.k===filt?'true':'false'));
 $('#imYear').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.y===yr?'true':'false'));
 const it=I[sel];$('#imDetail').innerHTML='<p class="eyebrow">'+String(sel+1).padStart(2,'0')+' · '+GR[it[1]]+'</p><h3>'+it[0]+'</h3><span class="tag" style="--c:var(--'+LIMC[it[6]]+')">'+LIM[it[6]][0]+'</span><div class="meta"><span>AI leverage '+it[2]+'/10 now, '+it[3]+'/10 by 2030</span><span>Invention need '+it[4]+'/10</span><span>Adding capacity: '+leadTxt(it[5])+'</span></div><div><h4>What AI does now</h4><p>'+it[7]+'</p></div><div><h4>What needs innovation</h4><p>'+it[8]+'</p></div><div><h4>What still needs people, or lags</h4><p>'+it[9]+'</p></div>';
 draw();}
function draw(){const cv=$('#imCv');const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const L=40,R=14,Tp=14,B=40;const X=v=>L+(w-L-R)*v/10,Y=v=>Tp+(h-Tp-B)*(1-v/10);
 c.fillStyle=rgba(T['amber-fill'],0.07);c.fillRect(X(0),Y(10),X(5)-X(0),Y(5)-Y(10));c.fillStyle=rgba(T['cyan-fill'],0.08);c.fillRect(X(5),Y(5),X(10)-X(5),Y(0)-Y(5));
 c.strokeStyle=rgba(T.muted,0.35);c.setLineDash([4,4]);c.lineWidth=1;c.beginPath();c.moveTo(X(5),Y(0));c.lineTo(X(5),Y(10));c.moveTo(X(0),Y(5));c.lineTo(X(10),Y(5));c.stroke();c.setLineDash([]);
 c.font='600 11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.fillText('NEEDS INVENTION',X(0)+8,Y(10)+16);c.textAlign='right';c.fillText('AI HELPS INVENT',X(10)-8,Y(10)+16);c.fillText('AI ACCELERATES',X(10)-8,Y(0)-8);c.textAlign='left';c.fillText('BUILD, FUND, TRAIN',X(0)+8,Y(0)-8);
 c.font='11px IBM Plex Mono, monospace';c.strokeStyle=rgba(T.muted,0.5);for(let v=0;v<=10;v+=2){c.fillText(String(v),X(v)-3,h-B+15);c.fillText(String(v),L-16,Y(v)+4);}
 c.fillText('How much AI can speed it up →',L,h-6);c.save();c.translate(12,Y(1));c.rotate(-Math.PI/2);c.fillText('How much new invention it needs →',0,0);c.restore();
 pts=[];const order=I.map((_,i)=>i).sort((a,b)=>I[b][5]-I[a][5]);
 order.forEach(i=>{const it=I[i];const jx=((i*37)%7-3)*0.11,jy=((i*53)%7-3)*0.11;const x=X(it[2]+(it[3]-it[2])*anim+jx),y=Y(it[4]+jy);const r=7+9*Math.sqrt(it[5]/5);const dim=filt&&it[6]!==filt;
  c.globalAlpha=dim?0.15:1;c.fillStyle=rgba(T[LIMC[it[6]]],0.72);c.beginPath();c.arc(x,y,r,0,6.283);c.fill();if(i===sel){c.strokeStyle=T.ink;c.lineWidth=2.5;c.stroke();}
  c.fillStyle=T.ink;c.font='600 10px IBM Plex Mono, monospace';c.textAlign='center';c.fillText(String(i+1),x,y+3.5);c.textAlign='left';c.globalAlpha=1;pts.push({i,x,y,r});});
 const s=pts.find(p=>p.i===sel);if(s){const t=I[sel][0];c.font='600 12px IBM Plex Sans, sans-serif';const tw=c.measureText(t).width;let lx=s.x+s.r+6;if(lx+tw+10>w)lx=s.x-s.r-tw-14;const ly=Math.max(Tp+10,s.y-s.r-4);c.fillStyle=T.surface;c.fillRect(lx-4,ly-13,tw+8,18);c.strokeStyle=T.line;c.strokeRect(lx-4+0.5,ly-13+0.5,tw+8,18);c.fillStyle=T.ink;c.fillText(t,lx,ly);}
}
$('#imCv').addEventListener('click',e=>{const r=$('#imCv').getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;let best=null;pts.forEach(p=>{const d=Math.hypot(p.x-x,p.y-y);if(d<=p.r+4&&(!best||d<best.d))best={d,i:p.i};});if(best){sel=best.i;refresh();}});
watch($('#imCv'),draw);refresh();
})();
}
