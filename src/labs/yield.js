/* Lab: YIELD */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from '../core/ui.js';
export function init(){
(function yieldSim(){
const cv=$('#ydCv');const W=$('#ydW'),H=$('#ydH'),D=$('#ydD'),C=$('#ydC');let split=1,seed=3;
$('#ydPre').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{W.value=b.dataset.w;H.value=b.dataset.h;run();}));
$('#ydSplit').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{split=+b.dataset.n;run();}));
[W,H,D,C].forEach(e=>e.addEventListener('input',run));
$('#ydNew').addEventListener('click',()=>{seed++;run();});
const RAD=150,USE=147,SCR=0.1;
function grid(w,h){let best=null;for(const ox of [0,0.5])for(const oy of [0,0.5]){const dies=[];const nx=Math.ceil(RAD/(w+SCR))+1,ny=Math.ceil(RAD/(h+SCR))+1;for(let i=-nx;i<=nx;i++)for(let j=-ny;j<=ny;j++){const x=(i+ox)*(w+SCR)-w/2,y=(j+oy)*(h+SCR)-h/2;const cs=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]];const inside=cs.every(([a,b])=>a*a+b*b<=USE*USE);const any=cs.some(([a,b])=>a*a+b*b<=RAD*RAD);if(inside||any)dies.push({x,y,w,h,ok:inside});}const n=dies.filter(d=>d.ok).length;if(!best||n>best.n)best={dies,n};}return best;}
let state=null;
function run(){
 const w0=+W.value,h0=+H.value,d0=+D.value,cost=+C.value*1000;
 [...$('#ydSplit').children].forEach(b=>b.setAttribute('aria-pressed',+b.dataset.n===split?'true':'false'));
 $('#ydWO').textContent=w0+' mm';$('#ydHO').textContent=h0+' mm';$('#ydDO').textContent=d0.toFixed(2)+' per cm²';$('#ydCO').textContent='$'+(+C.value)+'k';
 const area=w0*h0;let w=w0,h=h0;
 if(split>1){const a=area*1.1/split;const ratio=w0/h0;w=Math.sqrt(a*ratio);h=a/w;}
 const g=grid(w,h);const r=rng(seed*7919+split);
 const lam=d0*Math.PI*RAD*RAD/100;let nd=0;if(lam<40){let L=Math.exp(-lam),k=0,p=1;do{k++;p*=r();}while(p>L);nd=k-1;}else nd=Math.max(0,Math.round(lam+Math.sqrt(lam)*(r()+r()+r()-1.5)*1.4));
 const defs=[];for(let i=0;i<nd;i++){const a=r()*6.283,rr=RAD*Math.sqrt(r());defs.push([rr*Math.cos(a),rr*Math.sin(a)]);}
 let good=0;g.dies.forEach(d=>{d.bad=defs.some(([x,y])=>x>=d.x&&x<=d.x+d.w&&y>=d.y&&y<=d.y+d.h);if(d.ok&&!d.bad)good++;});
 const aCm=w*h/100;const Y=Math.exp(-aCm*d0);const chips=Math.floor(good/split);
 // expected cost comparison
 const expChips=g.n*Y/split;const costPer=expChips>0?cost/expChips:Infinity;
 $('#ydN').textContent=g.n+(split>1?' chiplets':'');$('#ydY').textContent=(Y*100).toFixed(1)+'%';$('#ydG').textContent=good+' of '+g.n;$('#ydChips').textContent=chips;$('#ydCost').textContent=isFinite(costPer)?'$'+Math.round(costPer).toLocaleString('en-US'):'—';
 const over=w0>26||h0>33;const warn=$('#ydWarn');
 warn.innerHTML=over&&split===1?'<span class="status bad">Exceeds 26 × 33 mm reticle: cannot print as one die</span>':(area>429&&split===1?'<span class="status warn">Too big for one High-NA field (26 × 16.5 mm)</span>':'300 mm wafer · '+nd+' defects this run');
 state={g,defs};draw();
}
function draw(){
 if(!state)return;const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);
 const s=Math.min(w,h)/2/RAD*0.96,cx=w/2,cy=h/2;
 c.fillStyle=rgba(T.muted,0.18);c.beginPath();c.arc(cx,cy,RAD*s,0,6.283);c.fill();
 c.strokeStyle=rgba(T.muted,0.6);c.lineWidth=1;c.stroke();
 c.fillStyle=T.sunk;c.beginPath();c.moveTo(cx-6,cy+RAD*s+1);c.lineTo(cx,cy+RAD*s-7);c.lineTo(cx+6,cy+RAD*s+1);c.fill();
 c.save();c.beginPath();c.arc(cx,cy,RAD*s,0,6.283);c.clip();
 state.g.dies.forEach(d=>{const x=cx+d.x*s,y=cy+d.y*s,ww=d.w*s,hh=d.h*s;if(!d.ok){c.strokeStyle=rgba(T.muted,0.35);c.strokeRect(x+0.5,y+0.5,ww-1,hh-1);return;}c.fillStyle=d.bad?rgba(T.bad,0.75):rgba(T.good,0.6);c.fillRect(x+0.5,y+0.5,ww-1,hh-1);});
 c.fillStyle=T.ink;state.defs.forEach(([x,y])=>{c.beginPath();c.arc(cx+x*s,cy+y*s,1.8,0,6.283);c.fill();});
 c.restore();
 c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.fillText('■ good',8,h-24);c.fillStyle=T.bad;c.fillText('■ defect hit',8,h-10);
}
watch(cv,draw);run();
})();
}
