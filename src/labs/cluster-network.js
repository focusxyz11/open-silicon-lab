/* Lab: CLUSTER NETWORK */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function network(){
const cv=$('#nwCv');if(!cv)return;
let dom=72,opt='plug',gw=2300;
const k=64;
['#nwDom','#nwOpt','#nwGpu'].forEach(s=>$(s).querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.d)dom=+b.dataset.d;if(b.dataset.o)opt=b.dataset.o;if(b.dataset.w)gw=+b.dataset.w;run();})));
$('#nwN').addEventListener('input',run);
let R={};
function run(){const N=Math.pow(2,+$('#nwN').value);let tiers=N<=k?1:N<=k*k/2?2:N<=k*k*k/4?3:4;if(N<=dom)tiers=0;
 const links=N*tiers,xcv=2*links,pw=opt==='cpo'?(9+30):60;const optW=links*pw;const sw=tiers?Math.ceil(N/(k/2))*(tiers-1)+Math.ceil(N/k):0;const swW=sw*1500;const net=optW+swW;const it=N*gw*1.25;const share=net/(it+net);
 R={N,tiers,sw,xcv,share};
 $('#nwDom').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.d===dom?'true':'false'));$('#nwOpt').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.o===opt?'true':'false'));$('#nwGpu').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.w===gw?'true':'false'));
 $('#nwNO').textContent=N.toLocaleString('en-US')+' GPUs';
 const mw=v=>v>=1e6?(v/1e6).toFixed(1)+' MW':Math.round(v/1e3)+' kW';
 $('#nwTier').textContent=tiers?String(tiers):'None needed';$('#nwXcv').textContent=xcv.toLocaleString('en-US');$('#nwPow').textContent=net?mw(net):'0';$('#nwShare').textContent=(share*100).toFixed(1)+'%';
 $('#nwTag').textContent=Math.ceil(N/dom).toLocaleString('en-US')+' scale-up domain'+(N>dom?'s':'')+' · '+sw.toLocaleString('en-US')+' switches';
 let t;if(!tiers)t='The whole cluster fits inside one scale-up domain, so every GPU talks over copper NVLink at full speed and no optical network is needed. NVIDIA says a 72-GPU rack uses over 5,000 copper cables.';
 else t='GPUs inside each '+dom+'-GPU domain share 3.6 TB/s links; traffic between domains drops to about 0.2 TB/s per GPU, 18 times less. That is why software keeps the chattiest work (splitting each layer across chips) inside a domain and sends only occasional updates across the network.';
 if(tiers>=3)t+=' At this size the network needs '+tiers+' layers of switches and '+(xcv/1e6>=1?(xcv/1e6).toFixed(1)+' million':Math.round(xcv/1000)+' thousand')+' optical transceivers, each with its own lasers that can fail.';
 if(opt==='cpo'&&tiers)t+=' Co-packaged optics cut the switch-side optics power by about two-thirds; TrendForce expects them to be only about 0.5% of AI optical links in 2026 but around 35% by 2030.';
 $('#nwTxt').textContent=t;draw();}
let anim=0,vis=false;
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);if(!R.N)return;c.font='11px IBM Plex Mono, monospace';
 const nd=Math.min(12,Math.ceil(R.N/dom)),bot=h-46,bw=Math.min(90,(w-40)/nd-10),gap=(w-nd*bw)/(nd+1);
 const levels=[];for(let t=1;t<=R.tiers;t++){const y=bot-t*(bot-30)/(R.tiers+0.6);const cnt=Math.min(t===R.tiers?Math.max(2,Math.min(8,nd)):Math.max(2,Math.min(10,nd)),10);levels.push({y,cnt});}
 const px=(cnt,i)=>w/(cnt+1)*(i+1);
 /* links */
 if(levels.length){c.lineWidth=1;levels.forEach((L,li)=>{const below=li===0?nd:levels[li-1].cnt;for(let i=0;i<below;i++){const bx=li===0?gap+i*(bw+gap)+bw/2:px(below,i),by=li===0?bot-28:levels[li-1].y;for(let j=0;j<L.cnt;j++){c.strokeStyle=rgba(T['amber-fill'],.35);c.beginPath();c.moveTo(bx,by);c.lineTo(px(L.cnt,j),L.y+8);c.stroke();}}});
  if(!RM){const ph=(performance.now()/900)%1;c.fillStyle=T.amber;for(let i=0;i<Math.min(nd,8);i++){const bx=gap+i*(bw+gap)+bw/2,by=bot-28;const L=levels[0];const tx=px(L.cnt,i%L.cnt),ty=L.y+8;const f=(ph+i*0.13)%1;c.beginPath();c.arc(bx+(tx-bx)*f,by+(ty-by)*f,2.5,0,7);c.fill();}}}
 levels.forEach((L,li)=>{for(let j=0;j<L.cnt;j++){c.fillStyle=T.surface;c.strokeStyle=T.ink;c.lineWidth=1.2;c.fillRect(px(L.cnt,j)-14,L.y,28,10);c.strokeRect(px(L.cnt,j)-14,L.y,28,10);}c.fillStyle=T.muted;c.textAlign='left';c.fillText(['Leaf switches','Spine switches','Core switches','Super-spine'][li],6,L.y-4);});
 for(let i=0;i<nd;i++){const x=gap+i*(bw+gap);c.fillStyle=rgba(T.violet,.12);c.strokeStyle=T.violet;c.lineWidth=1.2;c.fillRect(x,bot-28,bw,28);c.strokeRect(x,bot-28,bw,28);
  const g=Math.min(dom,R.N,dom>72?24:dom),cols=Math.min(g,12),rows=Math.ceil(g/cols);for(let a=0;a<g;a++){c.fillStyle=T.violet;c.fillRect(x+4+(a%cols)*((bw-8)/cols),bot-24+Math.floor(a/cols)*(20/rows),Math.max(1.5,(bw-8)/cols-1.5),Math.max(1.5,20/rows-1.5));}}
 c.fillStyle=T.muted;c.textAlign='left';c.fillText((R.N>nd*dom?'Showing '+nd+' of '+Math.ceil(R.N/dom).toLocaleString('en-US')+' domains · ':'')+'violet = copper NVLink inside a domain · amber = optical links',6,h-28);c.fillText('',6,h-14);}
function loop(){if(!vis||RM)return;draw();requestAnimationFrame(loop);}
inView(cv,v=>{const was=vis;vis=v;if(v&&!was)loop();});
watch(cv,draw);run();
})();
}
