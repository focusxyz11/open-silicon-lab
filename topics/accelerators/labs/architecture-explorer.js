/* Lab: ARCHITECTURE EXPLORER */
import {$,clamp,RM,rng,T,redraws,fit,watch,rgba,shade,fmtLen,fmtNum,inView,fr,hexRGB,gauss,big,LIMC} from 'osl/core/ui.js';
export function init(){
(function ax(){
const AX={
 gpu:{t:'GPU',tag:'Flexible, with the biggest software ecosystem',p:[
  ['How it works','Thousands of programmable cores grouped into streaming multiprocessors, each with tensor cores for matrix math. Model weights live in HBM stacks beside the die and stream in constantly.'],
  ['Strengths','Runs almost any model or new idea, with mature software (CUDA, ROCm) and huge scale-up fabrics such as NVLink.'],
  ['Trade-offs','A lot of energy goes into moving data between HBM and the cores, and reticle-size dies need expensive CoWoS packaging.'],
  ['In 2026','NVIDIA Rubin (288 GB HBM4) and AMD MI455X (432 GB HBM4, 320 billion transistors, compute dies on TSMC N2).']]},
 tpu:{t:'TPU (systolic)',tag:'Matrix engines scheduled by a compiler',p:[
  ['How it works','A few very large systolic arrays (matrix units) pump data through thousands of multiply-accumulate cells, as in stage 09. A compiler (XLA) plans every data movement ahead of time.'],
  ['Strengths','More math per watt on dense matrix work, and chips link directly into pods: an Ironwood superpod joins 9,216 chips.'],
  ['Trade-offs','Less flexible for unusual operations, and available only in one cloud.'],
  ['In 2026','Google TPU v7 Ironwood: 4.6 PFLOPS FP8, 192 GB HBM, about 600 W. The eighth generation splits into TPU 8t for training and 8i for inference, on TSMC 2 nm, expected around the end of 2027.']]},
 asic:{t:'Custom cloud chip',tag:'Built by a cloud for its own models',p:[
  ['How it works','A cloud company designs a chip around its own workloads, often with a design partner such as Broadcom, Marvell or MediaTek. Many add large on-chip SRAM to cut HBM traffic.'],
  ['Strengths','Lower cost per token for in-house models and no vendor margin to pay.'],
  ['Trade-offs','Hundreds of millions of dollars in design cost per generation and a narrower software ecosystem.'],
  ['In 2026','AWS Trainium3 (TSMC 3 nm, 2.52 PFLOPS FP8, 144 GB HBM3E) and Microsoft Maia 200 (TSMC 3 nm, about 10 PFLOPS FP4, 216 GB HBM3E, 272 MB SRAM, 750 W). Trainium4 is targeted for late 2026 to early 2027.']]},
 wafer:{t:'Wafer-scale',tag:'One chip the size of a whole wafer',p:[
  ['How it works','Instead of cutting the wafer into dies, the whole wafer becomes one chip, with SRAM sitting next to every core and a mesh connecting them all. Spare cores route around defects.'],
  ['Strengths','Enormous on-chip bandwidth, so tokens come out very fast.'],
  ['Trade-offs','Memory per wafer is limited (44 GB), and it needs special power delivery, cooling and systems.'],
  ['In 2026','Cerebras WSE-3: 4 trillion transistors and 900,000 cores on TSMC 5 nm. The CS-4 system (August 2026) runs it at about twice the clock, for 43 PB/s of memory bandwidth per wafer.']]},
 lpu:{t:'SRAM dataflow (LPU)',tag:'The model spread across many chips',p:[
  ['How it works','The model is kept entirely in on-chip SRAM, spread over many chips, and a fixed schedule moves data from chip to chip like an assembly line.'],
  ['Strengths','Very low and predictable latency when generating tokens.'],
  ['Trade-offs','Each chip holds only hundreds of megabytes, so a large model needs hundreds of chips.'],
  ['In 2026','NVIDIA licensed Groq\'s technology for about $20 billion (December 2025) and announced the Groq 3 LPU, with about 500 MB of SRAM per chip and racks of 256, for the second half of 2026, to work alongside GPUs on decoding.']]}
};
let cur='gpu',tA=0,vis=false;const seg=$('#axSeg'),cv=$('#axCv');
Object.keys(AX).forEach(k=>{const b=document.createElement('button');b.textContent=AX[k].t;b.dataset.k=k;b.addEventListener('click',()=>{cur=k;show();});seg.appendChild(b);});
function show(){const a=AX[cur];[...seg.children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===cur?'true':'false'));$('#axTag').textContent=a.tag;
 $('#axText').innerHTML=a.p.map(([h,t])=>'<div><p class="eyebrow">'+h+'</p><p>'+t+'</p></div>').join('');draw();}
function draw(){const {ctx:c,w,h}=fit(cv);c.clearRect(0,0,w,h);c.font='11px IBM Plex Mono, monospace';
 const CU=T['cyan-fill'],SR=T['amber-fill'],HB=T.violet,DIE=rgba(T.muted,0.22),INK=T.ink,MU=T.muted;
 const box=(x,y,ww,hh,col)=>{c.fillStyle=col;c.fillRect(x,y,ww,hh);};
 const label=(t,x,y,al)=>{c.fillStyle=MU;c.textAlign=al||'left';c.fillText(t,x,y);c.textAlign='left';};
 const dots=(x0,y0,x1,y1,n,sp,col)=>{c.fillStyle=col;for(let i=0;i<n;i++){const f=((tA*sp+i/n)%1+1)%1;c.beginPath();c.arc(x0+(x1-x0)*f,y0+(y1-y0)*f,2.2,0,6.283);c.fill();}};
 const cx=w/2,cy=h/2;
 if(cur==='gpu'||cur==='tpu'||cur==='asic'){
  const dw=Math.min(w*0.4,260),dh=Math.min(h*0.62,200),dx=cx-dw/2,dy=cy-dh/2;box(dx,dy,dw,dh,DIE);
  const ns=cur==='asic'?3:4,sw=Math.min(46,(w-dw)/2-40),sh=(dh-(ns-1)*8)/ns;
  for(const side of [-1,1])for(let k=0;k<ns;k++){const x=side<0?dx-sw-18:dx+dw+18,y=dy+k*(sh+8);box(x,y,sw,sh,rgba(HB,0.7));for(let j=0;j<3;j++)dots(side<0?x+sw:x,y+sh/2+(j-1)*6,side<0?dx:dx+dw,y+sh/2+(j-1)*6,4,cur==='gpu'?0.9:0.6,rgba(HB,0.95));}
  label('HBM',dx-sw-18,dy-8);label('HBM',dx+dw+18,dy-8);
  if(cur==='gpu'){const gx=8,gy=5,cw=(dw-24)/gx,ch=(dh-44)/gy;for(let i=0;i<gx;i++)for(let j=0;j<gy;j++){const y=dy+8+j*ch+(j>=Math.ceil(gy/2)?22:0);box(dx+12+i*cw,y,cw-4,ch-4,rgba(CU,0.75));}box(dx+12,dy+8+Math.ceil(gy/2)*ch,dw-24,16,rgba(SR,0.8));label('thousands of cores + tensor cores',cx,dy+dh+18,'center');}
  else{const ar=cur==='tpu'?2:2,aw=(dw-36)/2,ahh=dh*(cur==='asic'?0.42:0.62);for(let k=0;k<ar;k++){const x=dx+12+k*(aw+12),y=dy+12;box(x,y,aw,ahh,rgba(CU,0.55));c.strokeStyle=rgba(T.cyan,0.5);c.lineWidth=1;c.beginPath();for(let i=1;i<8;i++){c.moveTo(x+aw*i/8,y);c.lineTo(x+aw*i/8,y+ahh);c.moveTo(x,y+ahh*i/8);c.lineTo(x+aw,y+ahh*i/8);}c.stroke();
    const f=(tA*0.8)%1;c.fillStyle=rgba(T.cyan,0.9);for(let i=0;i<8;i++){const d=(f*16-i);if(d>=0&&d<8){c.fillRect(x+aw*d/8,y+ahh*i/8,aw/8,ahh/8);}}}
   if(cur==='asic'){box(dx+12,dy+20+ahh,dw-24,dh-ahh-32,rgba(SR,0.8));label('large on-chip SRAM',cx,dy+dh-10,'center');}else{box(dx+12,dy+ahh+22,dw-24,dh-ahh-34,rgba(SR,0.6));}
   label(cur==='tpu'?'matrix units (systolic arrays)':'matrix engines',cx,dy+dh+18,'center');
   if(cur==='tpu'){c.strokeStyle=rgba(INK,0.4);c.setLineDash([4,4]);c.beginPath();c.moveTo(cx,dy);c.lineTo(cx,12);c.stroke();c.setLineDash([]);label('links to the next chips in the pod',cx+6,16);}}
 }
 else if(cur==='wafer'){const R=Math.min(w,h)*0.42;c.save();c.beginPath();c.arc(cx,cy,R,0,6.283);c.fillStyle=DIE;c.fill();c.clip();const n=13,s=2*R/n;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=cx-R+i*s,y=cy-R+j*s;box(x+2,y+2,s*0.55,s-4,rgba(CU,0.7));box(x+2+s*0.55,y+2,s*0.4-4,s-4,rgba(SR,0.85));}
  for(let k=0;k<26;k++){const i=(k*7)%n,j=(k*5)%n;const x=cx-R+(i+0.5)*s,y=cy-R+(j+0.5)*s;const hz=k%2;dots(x,y,x+(hz?s:0),y+(hz?0:s),1,1.3,rgba(INK,0.85));}
  c.restore();c.strokeStyle=T.line;c.beginPath();c.arc(cx,cy,R,0,6.283);c.stroke();label('one wafer = one chip: SRAM (amber) beside every core (cyan)',cx,h-8,'center');}
 else{const n=Math.max(4,Math.min(7,Math.floor((w-40)/80))),gw=(w-40)/n,chw=gw*0.72,chh=Math.min(h*0.45,120),y=cy-chh/2;
  for(let i=0;i<n;i++){const x=20+i*gw;box(x,y,chw,chh,DIE);box(x+6,y+6,chw-12,chh*0.62,rgba(SR,0.85));box(x+6,y+chh*0.72,chw-12,chh*0.22,rgba(CU,0.8));label('chip '+(i+1),x,y-8);if(i<n-1)dots(x+chw,cy,x+gw,cy,2,1.1,rgba(INK,0.9));}
  label('each chip holds a slice of the model in SRAM; activations flow chip to chip',cx,y+chh+24,'center');}
}
watch(cv,draw);inView(cv,v=>vis=v);(function an(){if(vis&&!RM){tA+=0.016;draw();}requestAnimationFrame(an);})();show();
})();
}
