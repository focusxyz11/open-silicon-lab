/* Lab: STARTUP BUDGET */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function startup(){
const cv=$('#suCv');if(!cv)return;
/* engineer-years at 7 nm, IP license cost $M, prototype & package $M, bring-up months */
const K=[['edge','Edge AI chip',70,3,0.6,2,'A small inference chip for cameras, robots or wearables.'],['cpu','RISC-V CPU chiplet',160,5,1.2,2.5,'A server CPU chiplet built on the open RISC-V instruction set.'],['dc','Data-center AI accelerator',330,10,6,3,'A large AI accelerator with HBM on an advanced package.']];
/* node: complexity, mask set $M, shuttle $M, months in fab */
const N=[['28 nm',.45,2,.15,2.5],['16 nm',.65,4,.4,3],['7 nm',1,8,1,3.5],['5 nm',1.25,12,1.6,4],['3 nm',1.55,18,2.5,4.5],['2 nm',1.8,25,3.5,5]];
let k=2,n=3;
$('#suKind').innerHTML=K.map((x,i)=>'<button type="button" data-i="'+i+'">'+x[1]+'</button>').join('');
$('#suNode').innerHTML=N.map((x,i)=>'<button type="button" data-i="'+i+'">'+x[0]+'</button>').join('');
$('#suKind').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{k=+b.dataset.i;if(k===0&&n>3)n=2;if(k===2&&n<2)n=3;run();}));
$('#suNode').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{n=+b.dataset.i;run();}));
const tm=$('#suTeam'),ai=$('#suAi'),mpw=$('#suMpw'),ip=$('#suIp');[tm,ai].forEach(e=>e.addEventListener('input',run));[mpw,ip].forEach(e=>e.addEventListener('change',run));
const COL=()=>[T.violet,T.rose,T.cyan,T['amber-fill'],T.muted];const NM=['Engineers','Design software','IP licenses','Masks & wafers','Prototypes & lab'];
const M=v=>v>=1000?'$'+(v/1000).toFixed(2)+'B':v>=100?'$'+Math.round(v)+'M':'$'+v.toFixed(1)+'M';
let G=null;
function run(){const kk=K[k],nn=N[n],team=+tm.value,a=+ai.value/100;
 let W=kk[2]*nn[1]*(ip.checked?.75:1.1)*(1-a);
 const eff=1/(1+team/500);const design=Math.max(6,W*12/(team*eff));
 const people=team*design/12*0.35,eda=people*.25,ipc=ip.checked?kk[3]*(0.6+0.4*nn[1]):0.5,mask=mpw.checked?nn[3]:nn[2]+(k===2?2:0.5),proto=kk[4]+1;
 const v=[people,eda,ipc,mask,proto],cost=v.reduce((s,x)=>s+x,0);const fab=nn[4]+(mpw.checked?1.5:0),bring=kk[5];const total=design+fab+bring;
 $('#suKind').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===k?'true':'false'));
 $('#suNode').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===n?'true':'false'));
 $('#suTeamO').textContent=team+' engineers';$('#suAiO').textContent=Math.round(a*100)+'% less effort';
 const col=COL();$('#suStack').innerHTML=v.map((x,i)=>'<i style="width:'+(x/cost*100).toFixed(2)+'%;background:'+col[i]+'"></i>').join('');
 $('#suLeg').innerHTML=v.map((x,i)=>'<span><i style="background:'+col[i]+'"></i>'+NM[i]+' '+M(x)+'</span>').join('');
 const fund=cost*1.5;$('#suCost').textContent=M(cost);$('#suTime').textContent=(total/12).toFixed(1)+' years';$('#suFab').textContent=fab.toFixed(1)+' months';$('#suFund').textContent=M(fund);
 $('#suTag').textContent=kk[1]+' · '+nn[0];
 const stage=fund<15?'a seed round':fund<60?'a Series A':fund<200?'a Series B':fund<600?'several large rounds':'more than almost any chip startup has raised privately';
 let t=kk[6]+' Funding of about '+M(fund)+' means '+stage+'.';
 if(people/cost>.55)t+=' Engineers are most of the bill, so AI agents that cut effort save the most money here.';
 if(mpw.checked)t+=' A shuttle gives only a few dozen prototypes; volume production still needs a full mask set later.';
 if(n>=4&&k===0)t+=' A small edge chip rarely needs 3 nm or 2 nm; the mask set alone may cost more than the design.';
 if(team>250&&k===0)t+=' A team this large mostly adds coordination overhead for a small chip.';
 $('#suTxt').textContent=t;G={design,fab,bring,aiSave:a>0?design/(1-a)-design:0};draw();}
function draw(){if(!G)return;const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);const L=8,R=8,base=G.design+G.aiSave,tot=base+G.fab+G.bring,X=m=>L+m/Math.max(tot,1)*(w-L-R);
 const bh=26;c.font='12px IBM Plex Sans, sans-serif';c.textBaseline='middle';
 const seg=(y,a,b,fill,lab,dash)=>{const x0=X(a),x1=X(b)-2;if(dash){c.strokeStyle=fill;c.setLineDash([4,3]);c.strokeRect(x0+.5,y+.5,Math.max(1,x1-x0-1),bh-1);c.setLineDash([]);}else{c.fillStyle=fill;c.fillRect(x0,y,Math.max(1,x1-x0),bh);}if(x1-x0>70){c.fillStyle=dash?T.muted:T.ink;c.fillText(lab,x0+6,y+bh/2);}};
 const row=(y,d,dash,label)=>{c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.textBaseline='alphabetic';c.fillText(label,L,y-6);c.font='12px IBM Plex Sans, sans-serif';c.textBaseline='middle';
  seg(y,0,d,dash?T.violet:rgba(T.violet,.55),'Design & verification',dash);seg(y,d,d+G.fab,dash?T['amber-fill']:rgba(T['amber-fill'],.75),'In the fab',dash);seg(y,d+G.fab,d+G.fab+G.bring,dash?T.cyan:rgba(T.cyan,.5),'Bring-up',dash);};
 if(G.aiSave>0.3){row(22,base,true,'Without AI agents: '+(tot/12).toFixed(1)+' yr');row(86,G.design,false,'Your plan: '+((G.design+G.fab+G.bring)/12).toFixed(1)+' yr');}
 else row(54,G.design,false,'Your plan: '+((G.design+G.fab+G.bring)/12).toFixed(1)+' yr');}
watch(cv,draw);run();
})();
}
