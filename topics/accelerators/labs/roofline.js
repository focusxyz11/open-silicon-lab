/* Lab: ROOFLINE */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function roof(){
const CH=[{n:'NVIDIA Rubin (2026)',F:50,BW:22,M:288},{n:'NVIDIA B200 (2025)',F:9,BW:8,M:192},{n:'Phone NPU (illustrative)',F:0.04,BW:0.08,M:12}];
let ci=0,b=0.5;const seg=$('#rfChip');
CH.forEach((ch,i)=>{const bt=document.createElement('button');bt.textContent=ch.n;bt.addEventListener('click',()=>{ci=i;run();});seg.appendChild(bt);});
$('#rfPrec').querySelectorAll('button').forEach(bt=>bt.addEventListener('click',()=>{b=+bt.dataset.b;run();}));
const pR=$('#rfP'),bR=$('#rfB');[pR,bR].forEach(e=>e.addEventListener('input',run));
const P=v=>Math.pow(10,0+3.3*v/1000);const Bt=v=>Math.max(1,Math.round(Math.pow(2,10*v/1000)));
const peak=(ch,bb)=>ch.F*(bb===0.5?1:bb===1?0.5:0.25);
let S={};
function run(){
 [...seg.children].forEach((x,k)=>x.setAttribute('aria-pressed',k===ci?'true':'false'));$('#rfPrec').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.b===b?'true':'false'));
 const ch=CH[ci],p=P(+pR.value),B=Bt(+bR.value);const Fp=peak(ch,b);
 $('#rfPO').textContent=p<10?p.toFixed(1)+'B params':Math.round(p)+'B params';$('#rfBO').textContent=B;
 const wBytes=p*1e9*b;const G=Math.max(1,Math.ceil(wBytes/(ch.M*1e9*0.8)));
 const tMem=wBytes/(G*ch.BW*1e12),tCmp=2*p*1e9*B/(G*Fp*1e15);const step=Math.max(tMem,tCmp);
 const I=2*B/b;const memBound=tMem>=tCmp;
 $('#rfG').textContent=G+(G>1?' (linked)':'');$('#rfU').textContent=fmtNum(1/step)+' tok/s';$('#rfT').textContent=fmtNum(B/step)+' tok/s';{const u=tCmp/step*100;$('#rfUt').textContent=(u<1?u.toFixed(2):Math.round(u))+'%';}
 $('#rfBound').innerHTML=memBound?'<span class="status warn">Memory-bound</span>':'<span class="status ok">Compute-bound</span>';
 S={ch,Fp,I,b};draw();
}
function draw(){
 const {ctx:c,w,h}=fit($('#rfCv'));c.clearRect(0,0,w,h);if(!S.ch)return;
 const L=52,R=14,Tp=14,Bm=40;const lx0=0,lx1=4.5,ly0=-4,ly1=2.2;
 const X=v=>L+(w-L-R)*(Math.log10(v)-lx0)/(lx1-lx0),Y=v=>Tp+(h-Tp-Bm)*(ly1-Math.log10(v))/(ly1-ly0);
 c.font='11px IBM Plex Mono, monospace';c.strokeStyle=rgba(T.muted,0.22);c.fillStyle=T.muted;c.lineWidth=1;
 for(let e=0;e<=4;e++){c.beginPath();c.moveTo(X(10**e),Tp);c.lineTo(X(10**e),h-Bm);c.stroke();c.fillText(e===0?'1':'1e'+e,X(10**e)-8,h-Bm+15);}
 for(let e=-4;e<=2;e+=2){c.beginPath();c.moveTo(L,Y(10**e));c.lineTo(w-R,Y(10**e));c.stroke();c.fillText(e===0?'1':'1e'+e,10,Y(10**e)+4);}
 c.fillText('operations per byte read →',w/2-80,h-6);c.fillText('PFLOPS ↑',L+6,Tp+12);
 const roofAt=(ch,Fp,x)=>Math.min(Fp,ch.BW*x/1000);
 CH.forEach((ch,k)=>{if(k===ci)return;const Fp=peak(ch,S.b);c.strokeStyle=rgba(T.muted,0.5);c.lineWidth=1.2;c.beginPath();for(let e=lx0;e<=lx1;e+=0.02){const x=10**e,y=roofAt(ch,Fp,x);const yy=Y(Math.max(y,10**ly0));e===lx0?c.moveTo(X(x),yy):c.lineTo(X(x),yy);}c.stroke();});
 const {ch,Fp}=S;
 c.fillStyle=rgba(T['amber-fill'],0.12);c.beginPath();c.moveTo(X(1),h-Bm);for(let e=lx0;e<=lx1;e+=0.02){const x=10**e;c.lineTo(X(x),Y(Math.max(roofAt(ch,Fp,x),10**ly0)));}c.lineTo(X(10**lx1),h-Bm);c.closePath();c.fill();
 c.strokeStyle=T.amber;c.lineWidth=2.5;c.beginPath();for(let e=lx0;e<=lx1;e+=0.02){const x=10**e;const yy=Y(Math.max(roofAt(ch,Fp,x),10**ly0));e===lx0?c.moveTo(X(x),yy):c.lineTo(X(x),yy);}c.stroke();
 const ridge=Fp*1000/ch.BW;if(ridge>1&&ridge<10**lx1){c.setLineDash([3,4]);c.strokeStyle=rgba(T.ink,0.45);c.beginPath();c.moveTo(X(ridge),Y(Fp));c.lineTo(X(ridge),h-Bm);c.stroke();c.setLineDash([]);c.fillStyle=T.ink;c.fillText('ridge '+Math.round(ridge),Math.min(X(ridge)+5,w-80),Y(Fp)+16);}
 const xi=clamp(S.I,1,10**lx1),yv=roofAt(ch,Fp,xi);c.fillStyle=T.cyan;c.beginPath();c.arc(X(xi),Y(Math.max(yv,10**ly0)),6,0,6.283);c.fill();
 c.fillStyle=T.ink;c.fillText('your workload',Math.min(X(xi)+9,w-100),Y(Math.max(yv,10**ly0))-9);
 c.fillStyle=T.muted;c.fillText('memory-bound slope',X(40),Y(Math.max(roofAt(ch,Fp,40),10**ly0))+18);c.fillText('compute ceiling',Math.min(w-120,X(ridge*3)),Y(Fp)-8);
}
watch($('#rfCv'),draw);run();
})();
}
