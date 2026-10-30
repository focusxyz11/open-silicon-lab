/* Lab: CLEANROOM */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function cr(){
const CL=[['ISO 1',1,'Inside tool mini-environments and sealed wafer pods'],['ISO 3',3,'A very clean fab bay'],['ISO 5',5,'A typical semiconductor cleanroom'],['ISO 7',7,'Roughly a hospital operating room'],['Room air',9,'An ordinary office (extrapolated from ISO 9)']];
let ci=0,parts=[],vis=false,perL=0;const seg=$('#crSeg');
CL.forEach((c0,i)=>{const b=document.createElement('button');b.textContent=c0[0];b.addEventListener('click',()=>setC(i));seg.appendChild(b);});
function setC(i){ci=i;const N=CL[i][1];const perM3=Math.pow(10,N);perL=Math.pow(10,N-3);const n=Math.min(2500,Math.round(perL));const r=rng(i+3);parts=Array.from({length:n},()=>({x:r(),y:r(),v:0.0015+r()*0.002}));
 [...seg.children].forEach((b,k)=>b.setAttribute('aria-pressed',k===i?'true':'false'));
 $('#crN').textContent=big(perM3);$('#crL').textContent=perL<1?'about 1 per '+Math.round(1/perL)+' litres':big(perL);$('#crTag').textContent=CL[i][2];
 $('#crTxt').textContent=CL[i][2]+'. '+(perL<1?'You would have to sample about '+Math.round(1/perL)+' litres of air to find one particle of 0.1 µm or larger.':'One litre of this air carries about '+big(perL)+' particles of 0.1 µm or larger.')+' Each one is roughly twice the spacing between transistor gates, and a human hair is about 800 times wider still.';
 drawAir();drawScale();}
function drawAir(){const {ctx:c,w,h}=fit($('#crAir'));c.clearRect(0,0,w,h);const bx=20,by=26,bw=w-40,bh=h-52;
 c.strokeStyle=T.line;c.lineWidth=1;c.strokeRect(bx+0.5,by+0.5,bw,bh);c.fillStyle=T.muted;c.font='11px IBM Plex Mono, monospace';c.fillText('1 litre of air, flowing down',bx,by-8);
 c.strokeStyle=rgba(T.muted,0.18);for(let k=1;k<6;k++){const x=bx+bw*k/6;c.beginPath();c.moveTo(x,by+4);c.lineTo(x,by+bh-4);c.stroke();}
 c.fillStyle=T.ink;parts.forEach(p=>{c.fillRect(bx+p.x*bw-1,by+p.y*bh-1,2.2,2.2);});
 c.fillStyle=T.muted;if(!parts.length)c.fillText('Empty, almost always',bx+12,by+bh/2);else if(perL>2500)c.fillText('showing 2,500 of '+big(perL),bx,h-10);
}
function drawScale(){const {ctx:c,w,h}=fit($('#crScale'));c.clearRect(0,0,w,h);const view=300;const s=(w-20)/view,ox=10,oy=30;const H=(h-60)/s;
 c.font='11px IBM Plex Mono, monospace';c.fillStyle=T.muted;c.fillText('To scale: 2 nm-class logic',ox,18);
 for(let y=20;y<H;y+=60){c.fillStyle='rgba(46,125,91,0.5)';c.fillRect(ox,oy+y*s,view*s,22*s);}
 for(let x=10;x<view;x+=48){c.fillStyle='rgba(208,83,63,0.75)';c.fillRect(ox+x*s,oy,14*s,H*s);}
 c.fillStyle=rgba(T.ink,0.85);c.beginPath();c.arc(ox+150*s,oy+H*s*0.45,50*s,0,6.283);c.fill();
 c.beginPath();c.arc(ox+250*s,oy+H*s*0.8,10*s,0,6.283);c.fill();
 c.fillStyle=T.bg;c.textAlign='center';c.fillText('0.1 µm',ox+150*s,oy+H*s*0.45+4);c.textAlign='left';
 c.fillStyle=T.ink;c.fillText('20 nm particle',Math.min(ox+262*s,w-100),oy+H*s*0.8-14);
 c.fillStyle=T.ink;c.fillRect(ox,h-18,48*s,3);c.fillText('48 nm gate pitch',ox+48*s+8,h-12);
}
watch($('#crAir'),drawAir);watch($('#crScale'),drawScale);inView($('#crAir'),v=>vis=v);
function anim(){if(vis&&!RM&&parts.length){parts.forEach(p=>{p.y+=p.v;if(p.y>1)p.y-=1;});drawAir();}requestAnimationFrame(anim);}requestAnimationFrame(anim);
setC(2);
})();
}
