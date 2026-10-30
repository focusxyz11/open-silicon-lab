/* Lab: COVERAGE */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function cov(){
const W=24,H=16,N=W*H;const R0=rng(77);const rar=Array.from({length:N},()=>6.5*Math.pow(R0(),1.8));const p=rar.map(r=>Math.pow(10,-r));
const cand=[...Array(N).keys()].filter(i=>rar[i]>3);const bugs=new Set();while(bugs.size<7)bugs.add(cand[Math.floor(R0()*cand.length)]);
let hit=new Uint8Array(N),tests=0,mode=null,running=false;const hist={rand:null,ai:null};
const covf=()=>{let s=0;for(let i=0;i<N;i++)s+=hit[i];return s/N;};
function start(m){hit=new Uint8Array(N);tests=0;mode=m;hist[m]=[[0,0]];running=true;$('#cvTag').textContent='Running '+(m==='ai'?'AI-guided':'random')+' tests';loop();}
function tick(){const B=500;tests+=B;for(let i=0;i<N;i++)if(!hit[i]&&Math.random()<1-Math.pow(1-p[i],B))hit[i]=1;
 if(mode==='ai'){const un=[];for(let i=0;i<N;i++)if(!hit[i])un.push(i);for(let k=0;k<4&&un.length;k++){const j=Math.floor(Math.random()*un.length);if(Math.random()<0.3)hit[un[j]]=1;un.splice(j,1);}}
 const cc=covf();hist[mode].push([tests,cc]);if(tests>=100000||cc>=1){running=false;$('#cvTag').textContent='Finished '+(mode==='ai'?'AI-guided':'random')+' run';}}
function loop(){if(!running){draw();return;}tick();draw();requestAnimationFrame(loop);}
$('#cvRand').addEventListener('click',()=>{if(!running)start('rand');});$('#cvAI').addEventListener('click',()=>{if(!running)start('ai');});
function draw(){
 const {ctx:c,w,h}=fit($('#cvGrid'));c.clearRect(0,0,w,h);const cs=Math.min(w/W,h/H),ox=(w-cs*W)/2,oy=(h-cs*H)/2;
 for(let i=0;i<N;i++){const x=ox+(i%W)*cs,y=oy+Math.floor(i/W)*cs;c.fillStyle=hit[i]?T['cyan-fill']:rgba(T.muted,0.08+0.55*rar[i]/6.5);c.fillRect(x+1,y+1,cs-2,cs-2);
  if(hit[i]&&bugs.has(i)){c.strokeStyle=T.bad;c.lineWidth=2.5;c.beginPath();c.moveTo(x+4,y+4);c.lineTo(x+cs-4,y+cs-4);c.moveTo(x+cs-4,y+4);c.lineTo(x+4,y+cs-4);c.stroke();}}
 let found=0;bugs.forEach(b=>{if(hit[b])found++;});
 $('#cvN').textContent=tests.toLocaleString('en-US');$('#cvC').textContent=(covf()*100).toFixed(1)+'%';$('#cvB').textContent=found+' of 7';
 const k=fit($('#cvCurve')),cc=k.ctx,cw=k.w,ch=k.h;cc.clearRect(0,0,cw,ch);const L=36,Rr=8,Tp=10,B=20;const X=t=>L+(cw-L-Rr)*t/100000,Y=v=>Tp+(ch-Tp-B)*(1-v);
 cc.font='10px IBM Plex Mono, monospace';cc.strokeStyle=rgba(T.muted,0.22);cc.fillStyle=T.muted;cc.lineWidth=1;
 [0,0.5,1].forEach(v=>{cc.beginPath();cc.moveTo(L,Y(v));cc.lineTo(cw-Rr,Y(v));cc.stroke();cc.fillText(v*100+'%',2,Y(v)+4);});
 cc.fillText('0',L,ch-5);cc.fillText('100k tests',cw-Rr-62,ch-5);
 [['rand',T.muted,'random'],['ai',T.amber,'AI-guided']].forEach(([m,col,lab],j)=>{const hs=hist[m];if(!hs)return;cc.strokeStyle=col;cc.lineWidth=2;cc.beginPath();hs.forEach(([t,v],i)=>i?cc.lineTo(X(t),Y(v)):cc.moveTo(X(t),Y(v)));cc.stroke();const lt=hs[hs.length-1];cc.fillStyle=col;cc.fillText(lab,Math.min(X(lt[0])+4,cw-70),Y(lt[1])+(j?-6:12));});
 if(!hist.rand&&!hist.ai){cc.fillStyle=T.muted;cc.fillText('Run a mode to plot coverage over time',L+6,Y(0.5)-6);}
}
watch($('#cvGrid'),draw);new ResizeObserver(()=>draw()).observe($('#cvCurve'));draw();
})();
}
