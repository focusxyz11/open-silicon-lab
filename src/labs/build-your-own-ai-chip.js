/* Lab: BUILD YOUR OWN AI CHIP */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function game(){
const MIS={
 phone:{t:'Phone AI chip',story:'Run an 8-billion-parameter assistant on a phone: quick replies, cool to the touch, cheap enough for a mass-market handset.',P:8,B:1,fp4ok:true,dead:24,reqs:[['tps','Reply speed (one user)','>=',20,'tok/s'],['power','Power','<=',6,'W'],['cost','Build cost, chip + memory','<=',60,'$'],['fit','Model fits in memory','fit'],['months','Ready in','<=',24,'months']],goal:['tpj','Tokens per joule',true,[6,9]]},
 infer:{t:'Inference accelerator',story:'Serve a 70-billion-parameter model to 64 users at once in a data center, at the lowest cost per token.',P:70,B:64,fp4ok:true,dead:30,reqs:[['tps','Throughput, 64 users','>=',20000,'tok/s'],['power','Power','<=',1200,'W'],['cost','Build cost','<=',15000,'$'],['fit','Model fits in memory','fit'],['months','Ready in','<=',30,'months']],goal:['cpm','Cost per million tokens',false,[0.012,0.007]]},
 train:{t:'Training flagship',story:'Build the chip frontier labs will train their next models on: maximum FP8 compute, huge memory, high bandwidth.',P:0,B:0,fp4ok:false,dead:34,reqs:[['pf8','FP8 compute','>=',15,'PFLOPS'],['cap','Memory','>=',192,'GB'],['bw','Bandwidth','>=',12,'TB/s'],['power','Power','<=',1800,'W'],['months','Ready in','<=',34,'months']],goal:['pfkw','PFLOPS per kilowatt',true,[18,24]]}};
const ARCH={gpu:{t:'GPU-style',d:'Programmable cores plus tensor units. Runs anything; biggest software ecosystem.',dens:5.5,e:0.06,util:0.6,design:26},sys:{t:'Matrix engine',d:'Big systolic arrays, TPU-style. More math per mm² and per watt, less flexible.',dens:7.5,e:0.045,util:0.7,design:22},cpu:{t:'Many CPU cores',d:'General-purpose cores with vector units. Flexible, but far less math per mm².',dens:0.6,e:0.5,util:0.5,design:24}};
const NODE={n5:{t:'N5',d:'Mature since 2020: cheap wafers, high yield.',dens:0.62,e:1.3,wafer:17000,d0:0.06,sram:0.30,fab:3.0,cplx:0.85,risk:0},n3:{t:'N3',d:'Workhorse of 2024–26 AI chips.',dens:1.0,e:1.0,wafer:20000,d0:0.08,sram:0.27,fab:3.5,cplx:1,risk:0},n2:{t:'N2',d:'Gate-all-around, volume since Q4 2025. Less power, pricier wafers.',dens:1.15,e:0.78,wafer:30000,d0:0.12,sram:0.24,fab:4,cplx:1.1,risk:0},a16:{t:'A16',d:'Backside power, ramping 2H 2026. Best efficiency, newest and riskiest.',dens:1.25,e:0.66,wafer:33000,d0:0.2,sram:0.24,fab:4.5,cplx:1.2,risk:2}};
const MEM={lp:{t:'LPDDR5X',d:'Phone and laptop memory: cheap, low power, modest bandwidth.',bw:0.068,cap:8,cost:14,pj:4,max:4,cow:false},gd:{t:'GDDR7',d:'Graphics memory chips on the board around the package.',bw:0.128,cap:3,cost:12,pj:4.5,max:16,cow:false},h3:{t:'HBM3E',d:'Stacked memory beside the die. Needs CoWoS.',bw:1.2,cap:36,cost:450,pj:3.5,max:12,cow:true},h4:{t:'HBM4',d:'2,048-bit stacks, new in 2026. Needs CoWoS.',bw:2.75,cap:36,cost:650,pj:2.5,max:12,cow:true}};
const PKG={org:{t:'Standard',d:'Cheap phone-style package, one die.',cost:8,maxD:1,maxS:0,maxSi:900,y:0.995,mo:0.5},fc:{t:'Large organic',d:'Big FCBGA package for up to two dies, no HBM.',cost:60,maxD:2,maxS:0,maxSi:2000,y:0.99,mo:0.7},cs:{t:'CoWoS-S',d:'Silicon interposer: up to 2 dies and 6 HBM stacks.',cost:900,maxD:2,maxS:6,maxSi:2700,y:0.97,mo:1.5},cl:{t:'CoWoS-L',d:'Bridged interposer beyond reticle size: up to 4 dies and 12 stacks.',cost:2200,maxD:4,maxS:12,maxSi:6000,y:0.96,mo:2}};
const PRE={phone:{arch:'sys',node:'n3',area:12,dies:1,sram:16,fp4:false,mem:'lp',memN:2,pkg:'org',f:1.2,agents:true},infer:{arch:'gpu',node:'n3',area:600,dies:1,sram:64,fp4:false,mem:'h3',memN:6,pkg:'cs',f:2.0,agents:false},train:{arch:'gpu',node:'n3',area:600,dies:2,sram:64,fp4:false,mem:'h3',memN:8,pkg:'cl',f:1.8,agents:true}};
let S=Object.assign({mission:'infer'},PRE.infer);
const Kf=2.0*0.75/Math.pow(0.45,1.3),fmax=V=>V<=0.3?0:Kf*Math.pow(V-0.3,1.3)/V;
function vmin(f){let lo=0.31,hi=1.4;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(fmax(m)>=f)hi=m;else lo=m;}return Math.max(0.5,hi);}
const aOf=v=>Math.round(5*Math.pow(160,v/1000)),vOfA=a=>Math.round(1000*Math.log(a/5)/Math.log(160));
const sOf=v=>Math.max(0,Math.round(Math.pow(2,v/1000*9))-1),vOfS=s=>Math.round(1000*Math.log2(s+1)/9);
function ev(s){const m=MIS[s.mission],a=ARCH[s.arch],n=NODE[s.node],me=MEM[s.mem],pk=PKG[s.pkg];
 const V=vmin(s.f),vok=V<=1.05;const fp4a=s.fp4?1.04:1;
 const phy=me.cow?(s.memN/s.dies)*8:(s.memN>0?6:0),d2d=s.dies>1?12:0;
 const dieA=(s.area*fp4a+s.sram*n.sram)*1.12+phy+d2d;
 const pf8=s.dies*s.area*a.dens*n.dens*s.f/1000,pf4=s.fp4?pf8*2:0;
 const prec=m.fp4ok&&s.fp4?'FP4':'FP8',pfU=prec==='FP4'?pf4:pf8;
 const bw=s.memN*me.bw,cap=s.memN*me.cap+s.sram*s.dies/1000;
 const pComp=pf8*1e15*a.util*a.e*1e-12*n.e*(V/0.75)**2,pMem=bw*8*me.pj*0.6,pSram=s.sram*s.dies*0.02;
 const power=(pComp+pSram)*1.1+pMem;
 const A=dieA,dpw=Math.max(0,Math.floor(Math.PI*22500/A-Math.PI*300/Math.sqrt(2*A))),Y=Math.exp(-A/100*n.d0),good=dpw*Y;
 const dieCost=good>0?n.wafer/good:Infinity;const cost=(s.dies*dieCost+s.memN*me.cost+pk.cost)/pk.y*1.03;
 const si=s.dies*A+(me.cow?s.memN*110:0);const prob=[];
 if(A>858)prob.push('Each die is '+Math.round(A)+' mm², larger than the 858 mm² reticle limit. Shrink compute or SRAM, or split into more dies.');
 if(me.cow&&pk.maxS===0)prob.push('HBM must sit on a silicon interposer: choose CoWoS-S or CoWoS-L packaging.');
 if(me.cow&&s.memN>pk.maxS&&pk.maxS>0)prob.push(pk.t+' fits at most '+pk.maxS+' HBM stacks.');
 if(s.dies>pk.maxD)prob.push(pk.t+' holds at most '+pk.maxD+' die'+(pk.maxD>1?'s':'')+'.');
 if(si>pk.maxSi)prob.push('Dies plus memory need about '+Math.round(si).toLocaleString('en-US')+' mm² of package area; '+pk.t+' allows '+pk.maxSi.toLocaleString('en-US')+' mm².');
 if(!vok)prob.push('No safe voltage reaches '+s.f.toFixed(2)+' GHz. Lower the clock.');
 if(s.memN<1)prob.push('The chip has no external memory. Add at least one memory device.');
 let tps=0,memT=0,compT=0;const b=prec==='FP4'?0.5:1,W=m.P*b;const fit=m.P?cap>=W*1.15:true;
 if(m.P&&bw>0&&pfU>0){memT=W*1e9/(bw*1e12);compT=2*m.P*1e9*m.B/(pfU*1e15*a.util);tps=fit?m.B/Math.max(memT,compT):0;}
 const area=s.area*s.dies;const design=a.design*n.cplx*(s.dies>1?1.08:1)*(s.agents?0.75:1)*(0.85+0.15*Math.min(1,area/1500));
 const months=design+1+n.fab+pk.mo+4+n.risk;
 const life=3*365*24*3600*0.6;const cpm=tps>0?((cost*2.5)/life+power*1.3/1000*0.10/3600)/tps*1e6:Infinity;
 return {V,vok,dieA:A,pf8,pf4,pfU,prec,bw,cap,power,Y,dpw,good,dieCost,cost,prob,tps,memT,compT,fit,design,months,cpm,tpj:power>0?tps/power:0,pfkw:power>0?pf8/(power/1000):0,W};}
function reqVal(R,k){return k==='tps'?R.tps:k==='power'?R.power:k==='cost'?R.cost:k==='months'?R.months:k==='pf8'?R.pf8:k==='cap'?R.cap:k==='bw'?R.bw:0;}
function judge(R){const m=MIS[S.mission];const rows=m.reqs.map(r=>{if(r[2]==='fit')return {t:r[1],ok:R.fit,txt:R.fit?Math.round(R.cap)+' GB ≥ '+Math.ceil(R.W*1.15)+' GB':'needs '+Math.ceil(R.W*1.15)+' GB'};const v=reqVal(R,r[0]);const ok=r[2]==='>='?v>=r[3]:v<=r[3];return {t:r[1],ok,txt:fmtV(r[0],v)+' '+(r[2]==='>='?'≥':'≤')+' '+fmtV(r[0],r[3])};});
 const all=rows.every(r=>r.ok)&&!R.prob.length;let stars=0;const g=m.goal,v=R[g[0]];if(all){stars=1;if(g[2]?v>=g[3][0]:v<=g[3][0])stars++;if(g[2]?v>=g[3][1]:v<=g[3][1])stars++;}return {rows,all,stars,gv:v};}
function fmtV(k,v){if(!isFinite(v))return '–';if(k==='tps')return Math.round(v).toLocaleString('en-US')+' tok/s';if(k==='power')return Math.round(v).toLocaleString('en-US')+' W';if(k==='cost')return '$'+Math.round(v).toLocaleString('en-US');if(k==='months')return Math.round(v)+' mo';if(k==='pf8')return v.toFixed(1)+' PF';if(k==='cap')return Math.round(v)+' GB';if(k==='bw')return v.toFixed(1)+' TB/s';if(k==='cpm')return '$'+v.toFixed(4);if(k==='tpj'||k==='pfkw')return v.toFixed(1);return String(v);}
const el=id=>document.getElementById(id);
el('gmMission').innerHTML=Object.keys(MIS).map(k=>'<button type="button" data-k="'+k+'"><b>'+MIS[k].t+'</b><span>'+MIS[k].story+'</span></button>').join('');
el('gmMission').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S=Object.assign({mission:b.dataset.k},PRE[b.dataset.k]);syncCtl();upd();el('gmResult').hidden=true;}));
const segH=(id,obj)=>'<div class="seg" id="'+id+'">'+Object.keys(obj).map(k=>'<button type="button" data-v="'+k+'">'+obj[k].t+'</button>').join('')+'</div>';
el('gmCfg').innerHTML=
 '<div class="gbox"><h4>2 · Architecture <span id="gmArchN"></span></h4>'+segH('gmArch',ARCH)+'<p class="hint" id="gmArchD"></p></div>'+
 '<div class="gbox"><h4>3 · Process node <span id="gmNodeN"></span></h4>'+segH('gmNode',NODE)+'<p class="hint" id="gmNodeD"></p></div>'+
 '<div class="gbox"><h4>4 · Dies <span id="gmDieN"></span></h4><div class="ctl"><label for="gmArea">Compute area per die <output id="gmAreaO"></output></label><input type="range" id="gmArea" min="0" max="1000"></div><div class="ctl"><label for="gmSram">On-chip SRAM per die <output id="gmSramO"></output></label><input type="range" id="gmSram" min="0" max="1000"></div><div class="ctl"><span class="lbl">Number of compute dies (chiplets)</span><div class="seg" id="gmDies"><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button><button type="button" data-v="4">4</button></div></div><label class="check"><input type="checkbox" id="gmFp4"> Support FP4 math (+4% compute area, 2× throughput in FP4)</label></div>'+
 '<div class="gbox"><h4>5 · Memory <span id="gmMemN2"></span></h4>'+segH('gmMem',MEM)+'<p class="hint" id="gmMemD"></p><div class="ctl"><label for="gmMemN">How many <output id="gmMemNO"></output></label><input type="range" id="gmMemN" min="0" max="12" step="1"></div></div>'+
 '<div class="gbox"><h4>6 · Packaging <span id="gmPkgN"></span></h4>'+segH('gmPkg',PKG)+'<p class="hint" id="gmPkgD"></p></div>'+
 '<div class="gbox"><h4>7 · Clock and team</h4><div class="ctl"><label for="gmF">Clock frequency <output id="gmFO"></output></label><input type="range" id="gmF" min="0.6" max="2.6" step="0.05"></div><label class="check"><input type="checkbox" id="gmAgents"> Use 2026 AI design agents for RTL, verification and layout (about 25% faster design)</label></div>';
const bindSeg=(id,key,num)=>el(id).querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{S[key]=num?+b.dataset.v:b.dataset.v;if(key==='mem'){S.memN=Math.min(S.memN,MEM[S.mem].max);}syncCtl();upd();}));
bindSeg('gmArch','arch');bindSeg('gmNode','node');bindSeg('gmDies','dies',true);bindSeg('gmMem','mem');bindSeg('gmPkg','pkg');
el('gmArea').addEventListener('input',e=>{S.area=aOf(+e.target.value);upd();});el('gmSram').addEventListener('input',e=>{S.sram=sOf(+e.target.value);upd();});
el('gmMemN').addEventListener('input',e=>{S.memN=+e.target.value;upd();});el('gmF').addEventListener('input',e=>{S.f=+e.target.value;upd();});
el('gmFp4').addEventListener('change',e=>{S.fp4=e.target.checked;upd();});el('gmAgents').addEventListener('change',e=>{S.agents=e.target.checked;upd();});
el('gmReset').addEventListener('click',()=>{S=Object.assign({mission:S.mission},PRE[S.mission]);syncCtl();upd();});
function syncCtl(){el('gmArea').value=vOfA(S.area);el('gmSram').value=vOfS(S.sram);el('gmMemN').max=MEM[S.mem].max;el('gmMemN').value=S.memN;el('gmF').value=S.f;el('gmFp4').checked=S.fp4;el('gmAgents').checked=S.agents;}
const press=(id,v)=>el(id).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v==String(v)?'true':'false'));
let last=null;
function upd(){const R=ev(S),J=judge(R),m=MIS[S.mission];last={R,J};
 el('gmMission').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===S.mission?'true':'false'));el('gmMisTag').textContent=m.t;
 press('gmArch',S.arch);press('gmNode',S.node);press('gmDies',S.dies);press('gmMem',S.mem);press('gmPkg',S.pkg);
 el('gmArchD').textContent=ARCH[S.arch].d;el('gmNodeD').textContent=NODE[S.node].d+' Wafer about $'+NODE[S.node].wafer.toLocaleString('en-US')+' (estimate).';el('gmMemD').textContent=MEM[S.mem].d;el('gmPkgD').textContent=PKG[S.pkg].d;
 el('gmAreaO').textContent=S.area+' mm²';el('gmSramO').textContent=S.sram+' MB';el('gmMemNO').textContent=S.memN+' × '+MEM[S.mem].cap+' GB';el('gmFO').textContent=S.f.toFixed(2)+' GHz at '+(R.vok?R.V.toFixed(2)+' V':'—');
 el('gmDieN').textContent=Math.round(R.dieA)+' mm² per die';el('gmMemN2').textContent=R.bw.toFixed(R.bw<1?2:1)+' TB/s';el('gmNodeN').textContent='yield '+Math.round(R.Y*100)+'%';el('gmArchN').textContent='';el('gmPkgN').textContent='$'+PKG[S.pkg].cost.toLocaleString('en-US');
 const spec=[['FP8 compute',R.pf8.toFixed(R.pf8<1?3:1)+' PF'],['FP4 compute',S.fp4?R.pf4.toFixed(R.pf4<1?3:1)+' PF':'not supported'],['Memory',(R.cap<10?R.cap.toFixed(1):Math.round(R.cap))+' GB'],['Bandwidth',R.bw.toFixed(R.bw<1?2:1)+' TB/s'],['Power',Math.round(R.power).toLocaleString('en-US')+' W'],['Build cost',isFinite(R.cost)?'$'+Math.round(R.cost).toLocaleString('en-US'):'–'],['Die yield',Math.round(R.Y*100)+'% of '+R.dpw+' per wafer'],['Ready in',Math.round(R.months)+' months']];
 el('gmSpec').innerHTML=spec.map(([a,b2])=>'<div><span>'+a+'</span><b>'+b2+'</b></div>').join('');
 const pb=el('gmProb');pb.hidden=!R.prob.length;pb.innerHTML=R.prob.map(p=>'<span>✕ '+p+'</span>').join('');
 el('gmReqs').innerHTML=J.rows.map(r=>'<div class="'+(r.ok?'ok':'no')+'"><i></i><span>'+r.t+'</span><b>'+r.txt+'</b></div>').join('');
 const g=m.goal;el('gmGoal').innerHTML='<b>Score:</b> '+g[1]+' = '+fmtV(g[0],J.gv)+' ('+(g[2]?'higher':'lower')+' is better; 2 stars at '+fmtV(g[0],g[3][0])+', 3 stars at '+fmtV(g[0],g[3][1])+')'+(m.P?' · Model runs in '+R.prec:'');
 el('gmStars').textContent=R.prob.length?'Not buildable':J.all?'★'.repeat(J.stars)+'☆'.repeat(3-J.stars):'Requirements not met';
 el('gmTape').disabled=!!R.prob.length;cmp();}
/* tape-out */
let anim=0;
el('gmTape').addEventListener('click',()=>{if(!last||last.R.prob.length)return;const box=el('gmResult');box.hidden=false;const R=last.R,J=last.J;const seed=Math.floor(Math.random()*1e9);
 el('gmResTag').textContent='Taping out…';el('gmReview').innerHTML='';box.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});
 const ph=[['Design & verification',R.design,'ai'],['Masks',1,'ai'],['Wafer fab',NODE[S.node].fab+NODE[S.node].risk,'invent'],['Packaging',PKG[S.pkg].mo,'capital'],['Bring-up',4,'people']];
 const t0=performance.now(),dur=RM?0:2600;cancelAnimationFrame(anim);
 const step=now=>{const p=dur?Math.min(1,(now-t0)/dur):1;drawTime(ph,p);drawWafer(R,seed,p);if(p<1)anim=requestAnimationFrame(step);else finish(R,J,seed);};anim=requestAnimationFrame(step);});
function drawTime(ph,p){const {ctx:c,w,h}=fit(el('gmTime'));c.clearRect(0,0,w,h);const tot=ph.reduce((a,x)=>a+x[1],0),L=10,Rr=10,y=56,bh=34;let x=L;const sc=(w-L-Rr)/tot;const cut=tot*p;let acc=0;c.font='11px IBM Plex Mono, monospace';
 ph.forEach(([n,mo,lim],i)=>{const ww=mo*sc;const fill=Math.max(0,Math.min(mo,cut-acc))*sc;c.fillStyle=rgba(T.muted,0.15);c.fillRect(x,y,ww-2,bh);c.fillStyle=rgba(T[LIMC[lim]],0.85);c.fillRect(x,y,Math.max(0,fill-2),bh);c.fillStyle=T.ink;if(ww>70){c.fillText(n,x+4,y-8+(i%2?0:-14));}c.fillStyle=T.muted;if(ww>40)c.fillText(mo.toFixed(1)+' mo',x+4,y+bh+14);x+=ww;acc+=mo;});
 c.fillStyle=T.ink;c.textAlign='right';c.fillText(Math.round(cut)+' of '+Math.round(tot)+' months',w-Rr,y+bh+30);c.textAlign='left';}
function drawWafer(R,seed,p){const {ctx:c,w,h}=fit(el('gmWafer'));c.clearRect(0,0,w,h);const rad=Math.min(w,h)/2*0.94,cx=w/2,cy=h/2,s=rad/150,side=Math.sqrt(R.dieA);const r=rng(seed);
 c.fillStyle=rgba(T.muted,0.18);c.beginPath();c.arc(cx,cy,rad,0,6.283);c.fill();let good=0,tot=0;const nx=Math.ceil(150/(side+0.1))+1;const reveal=p;
 for(let i=-nx;i<=nx;i++)for(let j=-nx;j<=nx;j++){const x=i*(side+0.1)-side/2,y=j*(side+0.1)-side/2;const cs=[[x,y],[x+side,y],[x,y+side],[x+side,y+side]];if(!cs.every(([a,b])=>a*a+b*b<=147*147))continue;tot++;const ok=r()<R.Y;const shown=((i+nx)*(2*nx+1)+(j+nx))/((2*nx+1)**2)<reveal;if(ok&&shown)good++;
  c.fillStyle=!shown?rgba(T.muted,0.35):ok?rgba(T.good,0.7):rgba(T.bad,0.75);c.fillRect(cx+x*s+0.5,cy+y*s+0.5,Math.max(1,side*s-1),Math.max(1,side*s-1));}
 c.fillStyle=T.ink;c.font='12px IBM Plex Mono, monospace';c.fillText('First wafer: '+good+' good of '+tot,8,h-10);}
function finish(R,J,seed){const m=MIS[S.mission];el('gmResTag').innerHTML=J.all?'<span class="status ok">'+'★'.repeat(J.stars)+'☆'.repeat(3-J.stars)+' Mission accomplished</span>':'<span class="status bad">Missed requirements</span>';
 const N=[];if(m.P){if(R.memT>1.5*R.compT)N.push('Memory-bound: the math units wait on memory most of the time. More or faster memory, or FP4 weights, would raise speed more than extra compute.');else if(R.compT>1.5*R.memT)N.push('Compute-bound: memory keeps up easily. More compute area or a higher clock would help.');else N.push('Well balanced: compute and memory finish each step at about the same time.');}
 if(R.Y<0.45)N.push('Only '+Math.round(R.Y*100)+'% of dies work. Chiplets or a more mature node would cut the cost per chip.');
 const pc=m.reqs.find(r=>r[0]==='power');if(pc&&R.power>0.9*pc[3])N.push('Power is close to the limit; cooling will be tight.');
 if(S.node==='a16')N.push('A16 only entered production in late 2026: the newest node costs more and adds schedule risk.');
 if(S.arch==='sys')N.push('Matrix engines need a strong compiler team. Budget for software, as Google does for TPUs.');
 if(S.arch==='cpu')N.push('CPU cores deliver far less math per mm² than tensor or matrix units, which is why AI chips spend their area on matrix math.');
 if(!S.agents&&R.months>m.dead)N.push('Turning on AI design agents would pull the schedule in by several months.');
 if(m.fp4ok&&!S.fp4)N.push('Supporting FP4 halves the bytes per weight, which roughly doubles speed on a memory-bound workload.');
 if(R.cost>0&&S.mem.startsWith('h'))N.push('HBM is '+Math.round(S.memN*MEM[S.mem].cost/R.cost*100)+'% of the build cost. Memory, not logic, dominates the bill of materials of AI chips.');
 el('gmReview').innerHTML='<h3>'+(J.all?'Launch review: ready to ship':'Launch review: back to the drawing board')+'</h3><div class="rv"><ul>'+J.rows.map(r=>'<li>'+(r.ok?'✓ ':'✕ ')+r.t+': '+r.txt+'</li>').join('')+'</ul></div><p class="eyebrow">Reviewer notes</p><div class="rv"><ul>'+N.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>';
 let D=[];try{D=JSON.parse(localStorage.getItem('sjl-designs')||'[]');if(!Array.isArray(D))D=[];}catch(e){}
 D.unshift({m:S.mission,stars:J.all?J.stars:0,ok:J.all,pf:S.fp4?R.pf4:R.pf8,fmt:S.fp4?'FP4':'FP8',cap:R.cap,bw:R.bw,power:R.power,cost:R.cost,node:NODE[S.node].t,arch:ARCH[S.arch].t});D=D.slice(0,5);try{localStorage.setItem('sjl-designs',JSON.stringify(D));}catch(e){}cmp();}
const REF=[['NVIDIA Rubin','2H 2026, TSMC 3 nm','50 FP4','288 GB HBM4','22 TB/s','–'],['AMD MI455X','2026, TSMC N2 + N3','40.3 MXFP4','432 GB HBM4','23.3 TB/s','–'],['Microsoft Maia 200','2026, TSMC 3 nm','~10 FP4','216 GB HBM3E','7 TB/s','750 W'],['Google TPU v7 Ironwood','2025','4.6 FP8','192 GB HBM','7.4 TB/s','~600 W'],['AWS Trainium3','2025, TSMC 3 nm','2.52 FP8','144 GB HBM3E','4.9 TB/s','–']];
function cmp(){let D=[];try{D=JSON.parse(localStorage.getItem('sjl-designs')||'[]');if(!Array.isArray(D))D=[];}catch(e){}const R=last&&last.R;
 const you=R?'<tr class="you"><td><b>Your current design</b><br><span class="muted small">'+MIS[S.mission].t+' · '+ARCH[S.arch].t+' · '+NODE[S.node].t+'</span></td><td class="n">'+(S.fp4?R.pf4.toFixed(R.pf4<1?3:1)+' FP4':R.pf8.toFixed(R.pf8<1?3:1)+' FP8')+'</td><td class="n">'+(R.cap<10?R.cap.toFixed(1):Math.round(R.cap))+' GB '+MEM[S.mem].t+'</td><td class="n">'+R.bw.toFixed(R.bw<1?2:1)+' TB/s</td><td class="n">'+Math.round(R.power)+' W</td></tr>':'';
 const saved=D.map((d,i)=>'<tr><td>Tape-out '+(D.length-i)+' · '+esc2(MIS[d.m]?MIS[d.m].t:'')+'<br><span class="muted small">'+(d.ok?'★'.repeat(d.stars):'missed')+' · '+esc2(d.arch)+' · '+esc2(d.node)+'</span></td><td class="n">'+(+d.pf).toFixed(d.pf<1?3:1)+' '+esc2(d.fmt)+'</td><td class="n">'+((+d.cap)<10?(+d.cap).toFixed(1):Math.round(d.cap))+' GB</td><td class="n">'+(+d.bw).toFixed(1)+' TB/s</td><td class="n">'+Math.round(d.power)+' W</td></tr>').join('');
 el('gmCmp').innerHTML='<tr><th>Chip</th><th>Peak PFLOPS</th><th>Memory</th><th>Bandwidth</th><th>Power</th></tr>'+you+saved+REF.map(r=>'<tr><td>'+r[0]+'<br><span class="muted small">'+r[1]+'</span></td><td class="n">'+r[2]+'</td><td class="n">'+r[3]+'</td><td class="n">'+r[4]+'</td><td class="n">'+r[5]+'</td></tr>').join('');}
const esc2=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
watch(el('gmTime'),()=>{});syncCtl();upd();
})();
}
